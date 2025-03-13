"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Define a type for a log entry
interface LogEntry {
    log_date: string; // in YYYY-MM-DD format
    selected_action_id: number;
    action_name: string;
    outcome: "positive" | "negative";
}

// Props for the ActionsCalendar component
interface ActionsCalendarProps {
    userId: string;
}

const ActionsCalendar = ({ userId }: ActionsCalendarProps) => {
    const supabase = createClient();

    // State to store flattened log data from daily_actions_log.
    const [rawLogs, setRawLogs] = useState<LogEntry[]>([]);
    // Dropdown filter: selected action name.
    const [filterAction, setFilterAction] = useState<string>("All");
    // Distinct action names for the dropdown.
    const [distinctActions, setDistinctActions] = useState<string[]>([]);

    const today = new Date();
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
            const flatLogs: LogEntry[] = data.map((log: any) => ({
                log_date: new Date(log.log_date).toLocaleDateString("en-GB"),
                selected_action_id: log.selected_action_id,
                action_name: log.selected_actions?.actions_list?.action_name || "Unknown",
                category_name: log.selected_actions?.actions_list?.actions_categories?.category_name || "Unknown",
                outcome: log.outcome,
            }));

            console.log("Flat logs:", flatLogs);
            setRawLogs(flatLogs);

            // Derive distinct action names.
            const actionNames = Array.from(new Set(flatLogs.map((log) => log.action_name).filter(Boolean)));
            setDistinctActions(["All", ...actionNames]);
        }
    };

    // useEffect to fetch logs when userId changes.
    useEffect(() => {
        if (userId) {
            fetchLogs(userId);
        }
    }, [userId]);

    // Filter logs based on selected action.
    const filteredLogs = filterAction === "All" ? rawLogs : rawLogs.filter((log) => log.action_name === filterAction);

    // Build a map for quick lookup of logs by date.
    // We convert each raw log date to en-GB format so it matches generated dates.
    const logDateMap = new Map<string, LogEntry>();
    filteredLogs.forEach((log) => {
        // const key = convertToEnGBFormat(log.log_date);
        logDateMap.set(log.log_date, log);
    });

    // Helper function to generate dates for a given period in en-GB format.
    const generateDates = (startDate: Date, endDate: Date): string[] => {
        const dates: string[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            // Use en-GB to return date in DD/MM/YYYY format.
            dates.push(current.toLocaleDateString("en-GB"));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const dates = generateDates(startDate, today);
    // Reverse the array so that most recent dates come first.
    const reversedDates = dates.slice().reverse();

    // Get color for each date based on outcome.
    // If no log exists, return gray. If log exists, green for positive outcome, red for negative.
    const getColorForDate = (date: string): string => {
        const log = logDateMap.get(date);
        if (!log) {
            return "bg-gray-500";
        }
        console.log(`For date ${date}: outcome=${log.outcome}`);
        return log.outcome === "positive" ? "bg-green-500" : "bg-red-500";
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

            <div className="grid grid-cols-7 gap-1">
                {reversedDates.map((date) => (
                    <div key={date} className={`w-8 h-8 rounded ${getColorForDate(date)}`} title={date}>
                        {/* Optionally display the date or count on hover */}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActionsCalendar;