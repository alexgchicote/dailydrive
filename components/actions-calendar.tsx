"use client";

import { useEffect, useState, useMemo } from "react";
import { UserHistory, } from "@/types";

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
}

const CalendarDay: React.FC<CalendarDayProps> = ({ date, log, filterAction, handleDateClick }) => {
    const isPastOrToday = date <= new Date();

    const today = new Date();

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    // Get color for each date based on outcome.
    const getColorForDate = (date: Date, filterAction: string): string => {
        const green = "bg-green-400 dark:bg-green-700";
        const yellow = "bg-yellow-400 dark:bg-yellow-700";
        const red = "bg-red-400 dark:bg-red-700";
        const gray = "bg-gray-300 dark:bg-gray-500";
        const faintGray = "bg-gray-200 dark:bg-gray-700";

        if (date > today) {
            return faintGray;
        }

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

    const commonClasses = `w-8 h-8 rounded-md flex items-center justify-center 
      ${getColorForDate(date, filterAction)}
      ${isToday(date) ? "border-2 border-blue-800 dark:border-blue-200" : ""}
      ${isPastOrToday ? "cursor-pointer hover:bg-blue-300 dark:hover:bg-blue-700" : "cursor-default opacity-50"}`;

    return isPastOrToday ? (
        //  Render a button if date is today or in the past
        <button
            onClick={() => handleDateClick(date.toISOString().split("T")[0])}
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
}

export const ActionsCalendarGrid: React.FC<ActionsCalendarGridProps> = ({
    weeks,
    logDateMap,
    filterAction,
    handleDateClick,
}) => {
    // We assume the grid is 7 columns and each cell is a fixed size (e.g. 32px width)
    // Adjust cellSize to suit your design.
    const cellSize = 32; // in pixels

    // Returns a background color for a given date based on its month.
    // You can adjust this array to suit your design.
    return (
        <div className="space-y-1">
            {/** We want to display the latest week at the top, so we reverse the weeks */}
            {weeks.slice().reverse().map((week, rowIndexReversed) => {
                // Calculate the original row index from the reversed order.
                const rowIndex = weeks.length - 1 - rowIndexReversed;
                // return (
                //     <div key={rowIndex} className="grid grid-cols-7">
                //         {week.map((date, colIndex) => {
                //             const currentMonth = date.getMonth();

                //             const isEvenMonth = date.getMonth() % 2 === 0;
                //             const bgClass = isEvenMonth ? "bg-white" : "bg-white";

                //             // Determine if neighboring cells (within the grid) are in the same month.
                //             const sameLeft =
                //                 colIndex > 0 && week[colIndex - 1].getMonth() === currentMonth;
                //             const sameRight =
                //                 colIndex < week.length - 1 &&
                //                 week[colIndex + 1].getMonth() === currentMonth;
                //             const sameTop =
                //                 rowIndex > 0 && weeks[rowIndex - 1][colIndex].getMonth() === currentMonth;
                //             const sameBottom =
                //                 rowIndex < weeks.length - 1 &&
                //                 weeks[rowIndex + 1][colIndex].getMonth() === currentMonth;

                //             const radiusClasses = [
                //                 !sameLeft && !sameBottom && "rounded-tl-md",
                //                 !sameRight && !sameBottom && "rounded-tr-md",
                //                 !sameLeft && !sameTop && "rounded-bl-md",
                //                 !sameRight && !sameTop && "rounded-br-md",
                //             ].filter(Boolean).join(" ");

                //             const marginClasses = [
                //                 !sameBottom && "mt-[2px]",
                //                 !sameTop && "mb-[2px]",
                //                 !sameLeft && "ml-[2px]",
                //                 !sameRight && "mr-[2px]",
                //             ].filter(Boolean).join(" ");

                //             return (
                //                 <div
                //                     key={date.toISOString()}
                //                     className={`
                //                       ${bgClass}
                //                       transition-colors duration-200
                //                       p-[2px]
                //                       ${radiusClasses}
                //                       ${marginClasses}
                //                     `}
                //                 >
                //                     <CalendarDay
                //                         date={date}
                //                         logDateMap={logDateMap}
                //                         filterAction={filterAction}
                //                         handleDateClick={handleDateClick}
                //                     />
                //                 </div>
                //             );
                //         })}
                //     </div>
                // );

                return (
                    <div key={rowIndex} className="grid grid-cols-7 gap-1">
                        {week.map((date, colIndex) => {
                            return (
                                <CalendarDay
                                    key={date.toISOString()} // Ensure uniqueness
                                    date={date}
                                    log={logDateMap.get(date.toISOString().split("T")[0])}
                                    filterAction={filterAction}
                                    handleDateClick={handleDateClick}
                                />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};


// Props for the ActionsCalendar component
interface ActionsCalendarProps {
    userHistory: UserHistory[];
    handleDateClick: (date: string) => void;
}
const ActionsCalendar: React.FC<ActionsCalendarProps> = ({
    userHistory,
    handleDateClick,
}) => {
    // Distinct action names for the dropdown.
    const distinctActions: string[] = [
        "All",
        ...Array.from(
            new Set(
                userHistory.flatMap((day) =>
                    day.logs.map((log) => log.action_name).filter(Boolean)
                )
            )
        ),
    ];

    // Dropdown filter: selected action name.
    const [filterAction, setFilterAction] = useState<string>("All");

    // Transform the grouped userHistory into a flat array of DayEntry objects.
    // If filter is "All", we want one entry per day (using the aggregated KPI).
    // Otherwise, we flatten the logs and only keep those matching the filter.
    const flatEntries: DayEntry[] = useMemo(() => {
        if (filterAction === "All") {
            return userHistory.map((day) => ({
                log_date: new Date(day.log_date),
                // Here you could choose to display the day's aggregated KPI
                // In this case, we're not displaying an individual action name
                action_name: "All",
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

    // Build a lookup map from date string (YYYY-MM-DD) to DayEntry.
    const logDateMap = useMemo(() => {
        const map = new Map<string, DayEntry>();
        flatEntries.forEach((entry) => {
            map.set(entry.log_date.toISOString().split("T")[0], entry);
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

            <div>
                {/* Header Row for Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {WEEK_DAYS.map((day, index) => (
                        <div
                            key={index}
                            className="w-8 h-8 flex items-center justify-center text-sm text-gray-700 dark:text-gray-300"
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <ActionsCalendarGrid
                    weeks={weeks}
                    logDateMap={logDateMap}
                    filterAction={filterAction}
                    handleDateClick={handleDateClick}
                />
            </div>
        </div>
    );
};

export { ActionsCalendar };