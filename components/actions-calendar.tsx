"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Define a type for a log entry
interface DayEntry {
    log_date: Date; // CHANGED: now using Date instead of string
    selected_action_id?: number;
    action_name: string;
    outcome?: "positive" | "negative" | "neutral";
    actions_day_grade?: number | null; // Make optional if nullable
}

// Props for the ActionsCalendar component
interface ActionsCalendarProps {
    userId: string;
}

// Weekday labels with Monday at top.
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ActionsCalendarGrid = ({ userId }: ActionsCalendarProps) => {
    const supabase = createClient();

    // State to store flattened log data from daily_actions_log.
    const [rawLogs, setRawLogs] = useState<DayEntry[]>([]);
    // User Days
    const [userDays, setUserDays] = useState<DayEntry[]>([]);
    // Dropdown filter: selected action name.
    const [filterAction, setFilterAction] = useState<string>("All");
    // Distinct action names for the dropdown.
    const [distinctActions, setDistinctActions] = useState<string[]>([]);

    const today = new Date();

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    // Choose how many weeks you want to display.
    const numWeeks = 10;

    // Determine the starting date for the grid.
    const approxStart = new Date(today);
    approxStart.setDate(today.getDate() - (numWeeks * 4 - 1));

    // Adjust approxStart to the Monday of that week.
    const startMonday = new Date(approxStart);
    const dayOfWeek = startMonday.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startMonday.setDate(startMonday.getDate() + diffToMonday);

    // Determine the end of the grid: the Sunday of the current week.
    const endSunday = new Date(today);
    const currentDay = endSunday.getDay();
    const diffToSunday = currentDay === 0 ? 0 : 7 - currentDay;
    endSunday.setDate(endSunday.getDate() + diffToSunday);

    // Build an array of weeks. Each week is an array of 7 Date objects (from Monday to Sunday).
    const weeks: Date[][] = [];
    const current = new Date(startMonday);
    while (current <= endSunday) {
        const week: Date[] = [];
        for (let i = 0; i < 7; i++) {
            week.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        weeks.push(week);
    }

    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 34);

    // Fetch logs from daily_actions_log.
    const fetchLogs = async (uid: string) => {
        console.log("Fetching action logs for user:", uid);
        const { data, error } = await supabase
            .from("daily_actions_log")
            .select(`
                log_id,
                log_date,
                selected_action_id,
                status,
                outcome,
                selected_actions (
                    actions_list (
                        action_name,
                        intent,
                        actions_categories (
                            category_id,
                            category_name
                        )
                    )
                )
            `)
            .eq("user_id", uid)
            .eq("is_valid", 1)
            .gt("log_date", startDate.toISOString().split("T")[0]);

        if (error) {
            console.error("Error fetching action logs:", error);
        } else {
            console.log("Fetched actions log:", data);

            // Flatten the logs.
            const flatLogs: DayEntry[] = data.map((log: any) => ({
                log_date: new Date(log.log_date), // CHANGED: using Date constructor
                selected_action_id: log.selected_action_id,
                action_name: log.selected_actions?.actions_list?.action_name || "Unknown",
                outcome: log.outcome,
            }));

            console.log("Flat logs:", flatLogs);
            setRawLogs(flatLogs);

            // Derive distinct action names.
            const actionNames = Array.from(new Set(flatLogs.map((log) => log.action_name).filter(Boolean)));
            setDistinctActions(["All", ...actionNames]);
        }
    };

    const fetchUserDays = async (uid: string) => {
        console.log("Fetching user's days for user:", uid);

        const { data, error } = await supabase
            .from("user_days")
            .select(`
                log_date,
                actions_day_grade
            `)
            .eq("user_id", uid)
            .eq("is_valid", 1)
            .gt("log_date", startDate.toISOString().split("T")[0]);

        if (error) {
            console.error("Error fetching user's days:", error);
        } else {
            console.log("Fetched user's days:", data);

            setUserDays(
                data.map((day: any) => ({
                    log_date: new Date(day.log_date), // CHANGED: using Date constructor
                    actions_day_grade: day.actions_day_grade,
                    action_name: "All",
                }))
            );
        }
    };

    // useEffect to fetch logs when userId changes.
    useEffect(() => {
        if (userId) {
            fetchLogs(userId);
            fetchUserDays(userId);
        }
    }, [userId]);

    // Filter logs based on selected action.
    const filteredLogs = filterAction === "All" ? userDays : rawLogs.filter((log) => log.action_name === filterAction);

    // Build a map for quick lookup of logs by date.
    // CHANGED: now using Date keys (converted to ISO strings for consistency)
    const logDateMap = new Map<string, DayEntry>();
    filteredLogs.forEach((log) => {
        logDateMap.set(log.log_date.toISOString().split("T")[0], log);
    });

    // Helper function to generate dates for a given period in en-GB format.
    const generateDates = (startDate: Date, endDate: Date): Date[] => { // CHANGED: return Date objects
        const dates: Date[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    // Generate an array of dates (not used for grid rendering now)
    const allDates = generateDates(startDate, today);

    // Get color for each date based on outcome.
    const getColorForDate = (date: Date, filterAction: string): string => {
        const green = "bg-green-500";
        const yellow = "bg-yellow-500";
        const red = "bg-red-500";
        const gray = "bg-gray-500";

        if (date > today) {
            return "bg-gray-700";
        }

        // CHANGED: matching key as YYYY-MM-DD string
        const key = date.toISOString().split("T")[0];
        const log = logDateMap.get(key);
        if (!log) {
            return gray;
        }

        if (filterAction === "All") {
            const grade = log.actions_day_grade ?? 0; // Default to 0 if null or undefined
            if (grade === 1) {
                return green;
            } else if (grade > 0.6 && grade < 1) {
                return yellow;
            } else {
                return red;
            }
        } else {
            const outcome = (log.outcome ?? "").trim().toLowerCase();

            if (outcome === "positive") {
                return green;
            } else if (outcome === "neutral") {
                return yellow;
            } else {
                return red;
            }
        }
    };

    return (
        <div className="p-4">
            {/* Dropdown for filtering by action */}
            <div className="mb-4">
                <label htmlFor="action-filter" className="mr-2 text-sm text-gray-900 dark:text-gray-100">
                    Filter by Action:
                </label>
                <select
                    id="action-filter"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="p-1 border rounded bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                >
                    {distinctActions.map((actionName) => (
                        <option key={actionName} value={actionName}>
                            {actionName}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex">
                {/* Y-axis: Week day labels */}
                {/* CHANGED: using a grid with 7 rows of fixed height (2rem each) for alignment */}
                <div className="grid gap-1" style={{ gridTemplateRows: "repeat(7, 2rem)" }}>
                    {WEEK_DAYS.map((day) => (
                        <div
                            key={day}
                            className="w-16 h-8 flex items-center justify-end pr-2 text-sm text-gray-700"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid: each column is a week (left to right), each row is a day (Mon at top, Sun at bottom) */}
                {/* CHANGED: setting grid columns explicitly based on the number of weeks */}
                <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${weeks.length}, 2rem)` }}
                >
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-rows-7 gap-1">
                            {week.map((date, dayIndex) => (
                                <div
                                    key={dayIndex}
                                    className={`w-8 h-8 rounded ${getColorForDate(date, filterAction)} ${isToday(date)
                                            ? "border border-black dark:border-white"
                                            : ""
                                        }`}
                                    title={date.toLocaleDateString("en-GB")}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActionsCalendarGrid;
