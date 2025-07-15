"use client";

import { useState, useMemo } from "react";
import { UserHistoryDay, } from "@/types";


// Define a type for a log entry
interface DayEntry {
    log_date: Date;
    action_name: string;
    selected_action_id?: number;
    outcome?: "positive" | "negative" | "neutral";
    actions_day_grade?: number | null; // Make optional if nullable
}

// Weekday labels with Monday at top.
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarDayProps {
    date: Date
    log: DayEntry | undefined;
    filterAction: string;
    handleDateClick: (date: string) => void;
    isActive: boolean; // Add this prop to track active state
}

function CalendarDay({ 
    date, 
    log, 
    filterAction, 
    handleDateClick,
    isActive
}: CalendarDayProps) {
    const today = new Date();

    const isPastOrToday = date <= today;

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    // Get styling for each date based on outcome.
    const getDateStyling = (date: Date, filterAction: string = "All Actions"): { bg: string; text: string; activeBorder: string } => {

        const greenDiv = {
            bg: "bg-green-400/40 dark:bg-green-700/40 hover:bg-green-500/40 dark:hover:bg-green-600/40",
            text: "text-green-600 dark:text-green-400",
            activeBorder: "border-green-600 dark:border-green-400",
        };

        const yellowDiv = {
            bg: "bg-yellow-400/40 dark:bg-yellow-700/40 hover:bg-yellow-500/40 dark:hover:bg-yellow-600/40",
            text: "text-yellow-600 dark:text-yellow-400",
            activeBorder: "border-yellow-600 dark:border-yellow-400"
        };

        const redDiv = {
            bg: "bg-red-400/40 dark:bg-red-700/40 hover:bg-red-500/40 dark:hover:bg-red-600/40",
            text: "text-red-600 dark:text-red-400",
            activeBorder: "border-red-600 dark:border-red-400"
        };

        const noLogDiv = {
            bg: "bg-gray-400/40 dark:bg-gray-700/40 hover:bg-gray-500/40 dark:hover:bg-gray-600/40",
            text: "text-gray-600 dark:text-gray-400",
            activeBorder: "border-gray-600 dark:border-gray-400"
        };

        const futureDiv = {
            bg: "",
            text: "text-gray-600 dark:text-gray-400",
            activeBorder: ""
        };

        // Future dates
        if (date > today) {
            return futureDiv;
        }

        // No log data
        if (!log) {
            return noLogDiv;;
        }

        if (filterAction === "All Actions") {
            const grade = log.actions_day_grade ?? 0;
            // For all actions, use green/yellow/red based on grade like before
            if (grade == 1) {
                return greenDiv;
            } else if (grade > 0.6) {
                return yellowDiv;;
            } else {
                return redDiv;
            }
        } else {
            const outcome = (log.outcome ?? "").trim().toLowerCase();
            
            if (outcome === "positive") {
                return greenDiv;
            } else if (outcome === "neutral") {
                return yellowDiv;
            } else {
                return redDiv;
            }
        }
    };

    // Format date as YYYY-MM-DD using local date components, not UTC
    const formatDateForClick = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const styling = getDateStyling(date, filterAction);
    
    const commonClasses = `w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200
    ${styling.bg} ${styling.text}
    ${isActive ? `border-2 ${styling.activeBorder}` : ""}
    ${isPastOrToday ? `cursor-pointer` : "cursor-default"}`;

    return isPastOrToday ? (
        //  Render a button if date is today or in the past
        <button
            onClick={() => handleDateClick(formatDateForClick(date))}
            className={commonClasses}
            title={date.toLocaleDateString("en-GB")}
        >
            {date.getDate()}
        </button>
    ) : (
        // Render a div for future dates (non-clickable)
        <div className={commonClasses} title={date.toLocaleDateString("en-GB")}>
            {date.getDate()}
        </div>
    );
};


interface ActionsCalendarGridProps {
    weeks: Date[][]; // weeks is an array of week arrays (each week: Date[])
    logDateMap: Map<string, DayEntry>;
    filterAction: string;
    handleDateClick: (date: string) => void;
    activeDate: string | null;
}

// Add this helper function to format dates consistently
const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Then update the CalendarGrid component to use this function
function ActionsCalendarGrid({
    weeks,
    logDateMap,
    filterAction,
    handleDateClick,
    activeDate,
}: ActionsCalendarGridProps) {
    return (
        <div className="h-full overflow-y-auto overflow-x-hidden">
            <div className="space-y-1">
                {weeks.slice().reverse().map((week, rowIndexReversed) => {
                    const rowIndex = weeks.length - 1 - rowIndexReversed;

                    return (
                        <div key={rowIndex} className="flex justify-center">
                            <div className="flex gap-1">
                                {week.map((date, colIndex) => {
                                    // Use the consistent date formatting when looking up logs
                                    const dateKey = formatDateKey(date);
                                    const isActive = dateKey === activeDate;
                                    return (
                                        <CalendarDay
                                            key={date.toISOString()}
                                            date={date}
                                            log={logDateMap.get(dateKey)}
                                            filterAction={filterAction}
                                            handleDateClick={handleDateClick}
                                            isActive={isActive}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Props for the ActionsCalendar component
interface ActionsCalendarProps {
    userHistory: UserHistoryDay[];
    handleDateClick: (date: string) => void;
    filterAction: string;
}

export default function ActionsCalendar({
    userHistory,
    handleDateClick,
    filterAction,
}: ActionsCalendarProps) {
    // Track the active date
    const [activeDate, setActiveDate] = useState<string | null>(null);

    // Custom handleDateClick to track active date
    const handleDateSelection = (date: string) => {
        setActiveDate(date);
        handleDateClick(date);
    };

    // Transform the grouped userHistory into a flat array of DayEntry objects.
    // If filter is "All Actions", we want one entry per day (using the aggregated KPI).
    // Otherwise, we flatten the logs and only keep those matching the filter.
    const flatEntries: DayEntry[] = useMemo(() => {
        if (filterAction === "All Actions") {
            return userHistory.map((day) => ({
                log_date: new Date(day.log_date),
                // Here you could choose to display the day's aggregated KPI
                // In this case, we're not displaying an individual action name
                action_name: "All Actions",
                actions_day_grade: day.actions_day_grade,
            }));
        } else {
            // Flatten individual logs from all days that match the filter
            return userHistory.flatMap((day) =>
                day.logs
                    .filter((log) => log.action_name === filterAction)
                    .map((log) => ({
                        log_date: new Date(day.log_date),
                        selected_action_id: log.selected_action_id,
                        action_name: log.action_name,
                        outcome: log.outcome,
                        // Optionally, if you want to include the day's aggregated KPI here:
                        actions_day_grade: day.actions_day_grade,
                    }))
            );
        }
    }, [userHistory, filterAction]);

    const logDateMap = useMemo(() => {
        const map = new Map<string, DayEntry>();
        flatEntries.forEach((entry) => {
            // Use the consistent date formatting
            const dateKey = formatDateKey(entry.log_date);
            map.set(dateKey, entry);
        });
        return map;
    }, [flatEntries]);

    // Compute the grid date range based on rawLogs, if available.
    let firstLogDate: Date;

    if (flatEntries.length > 0) {
        // Sort the logs by date ascending.
        const sortedLogs = [...flatEntries].sort((a, b) => a.log_date.getTime() - b.log_date.getTime());
        firstLogDate = sortedLogs[0].log_date;
    } else {
        // If no logs, show a message instead of rendering the calendar.
        return <div className="p-4 text-center">Start Logging actions to view your history log</div>;
    }

    // Get the first day of the earliest log's month
    const firstOfMonth = new Date(firstLogDate.getFullYear(), firstLogDate.getMonth(), 1);

    // Find the Monday of the week that includes the 1st of that month
    const startMonday = new Date(firstOfMonth);
    const firstDayOfWeek = startMonday.getDay();
    const diffToStartMonday = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    startMonday.setDate(startMonday.getDate() + diffToStartMonday);

    const dayOfWeek = startMonday.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startMonday.setDate(startMonday.getDate() + diffToMonday);

    const today = new Date();

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

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Header Row for Weekday Labels */}
                <div className="flex justify-center mb-1 flex-shrink-0">
                    <div className="flex gap-1">
                        {WEEK_DAYS.map((day, index) => (
                            <div
                                key={index}
                                className="w-8 h-8 flex items-center justify-center text-sm text-gray-700 dark:text-gray-300"
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ActionsCalendarGrid
                        weeks={weeks}
                        logDateMap={logDateMap}
                        filterAction={filterAction}
                        handleDateClick={handleDateSelection}
                        activeDate={activeDate}
                    />
                </div>
            </div>
        </div>
    );
};