"use client";
import React from "react";
import { UserHistory, DayKpi } from "@/types";
import DayActions from "./day-actions";
import DayScore from "./day-score";
import { ValueChart } from "./value-chart";
import { Card } from "./ui/card";

interface DeepDiveProps {
    selectedDate: string | null;
    userHistory: UserHistory[];
    dayKpi: DayKpi[]; // this should be merged into user History
}

export function DeepDive({ selectedDate, userHistory, dayKpi }: DeepDiveProps) {
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
        <Card className="flex flex-col h-full">
            {/* Top row with KPIs - fixed height */}
            <div className="flex items-center p-4 border-b">
                {/* Day Score - smaller and compact */}
                <div className="w-1/3">
                    <div className="transform scale-75 origin-left"> {/* Scale down the component */}
                        <DayScore dayScore={dayScore} />
                    </div>
                </div>

                {/* Actions completed - emphasize numbers */}
                <div className="w-2/3 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold">
                        {positiveActions}/{totalActions}
                    </div>
                    <div className="text-xs text-gray-500">
                        Actions Completed
                    </div>
                </div>
            </div>

            {/* Middle row - Value chart with fixed height */}
            <div className="p-4 border-b h-48">
                <ValueChart kpi={dayKpi} selectedDate={selectedDate} />
            </div>

            {/* Bottom row - DayActions with flexible height and scrolling */}
            <div className="flex-1 overflow-y-auto">
                <DayActions dayActions={dayActions} />
            </div>
        </Card>
    );
};

export default DeepDive;