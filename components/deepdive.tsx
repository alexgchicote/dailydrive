"use client";
import React from "react";
import { UserHistory, DayKpi } from "@/types";
import DayActions from "./day-actions";
import DayScore from "./day-score";
import { ValueChart } from "./value-chart";
import { CardContent } from "./ui/card";

interface DeepdiveProps {
    selectedDate: string | null;
    userHistory: UserHistory[];
    dayKpi: DayKpi[]; // this should be merged into user History
}

export function Deepdive({ selectedDate, userHistory, dayKpi }: DeepdiveProps) {
    // Find the history record that matches the selected date.
    const dayInfo = userHistory.find((day) => day.log_date === selectedDate);

    if (!dayInfo) {
        return (
            <div>
                No logs available for {selectedDate}. Start logging your actions!
            </div>
        );
    }

    const dayScore = dayInfo.actions_day_grade;
    const dayActions = dayInfo.logs;
    const positiveActions = dayActions.filter((action) => action.outcome === "positive").length;
    const negativeActions = dayActions.filter((action) => action.outcome === "negative").length;
    const totalActions = positiveActions + negativeActions;

    return (
        <CardContent className="h-full flex flex-col overflow-hidden">
            <div className="flex-none grid grid-cols-2 border-b h-[5rem]">
                <div className="flex items-center justify-center h-[5rem]">
                    <DayScore dayScore={dayScore} />
                </div>
                {/* Second column - Actions Completed */}
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-3xl font-bold">
                        {positiveActions}/{totalActions}
                    </div>
                    <div className="text-xs text-gray-500">
                        Actions Completed
                    </div>
                </div>
            </div>

            {/* Row 2: ValueChart */}
            <div className="flex-none border-b py-4 h-40">
                <ValueChart kpi={dayKpi} selectedDate={selectedDate} dayScore={dayScore} />
            </div>

            {/* Row 3: DayActions (scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {dayActions.length > 0 ? (
                    <DayActions dayActions={dayActions} />
                ) : (
                    <div className="p-4 text-center text-gray-500">
                        No actions logged for this date
                    </div>
                )}
            </div>
        </CardContent>

    )
};

export default Deepdive;