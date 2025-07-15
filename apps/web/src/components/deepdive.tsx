"use client";
import React from "react";
import { UserHistoryDay } from "@/types";
import DayActions from "./day-actions";
import DayScore from "./day-score";
import { formatDateHeader } from "@/lib/utils";

import { ActionsWeek } from "./week-actions";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DeepdiveProps {
    selectedDate: string;
    userHistory: UserHistoryDay[];
    onEdit: () => void; // Added prop for edit mode toggle
}

export function Deepdive({ selectedDate, userHistory, onEdit }: DeepdiveProps) {

    // Find the history record that matches the selected date.
    const dayInfo = userHistory.find((day) => day.log_date === selectedDate);
    if (!dayInfo) { // TODO: here also add if the toggle
        return (
            <Card className="h-[500px] flex flex-col">
                <CardHeader className="pb-2 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold leading-none tracking-tight">{formatDateHeader(selectedDate)}</h3>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 px-3 md:px-6">
                    <div className="p-4 text-center text-gray-500">
                        No logs available for {selectedDate}. Start logging your actions!
                    </div>
                </CardContent>
            </Card>
        );
    }

    const dayScore = dayInfo.actions_day_grade;
    const dayActions = dayInfo.logs;
    const positiveActions = dayInfo.num_engage_actions_positive + dayInfo.num_avoid_actions_positive;
    const negativeActions = dayInfo.num_engage_actions_negative + dayInfo.num_avoid_actions_negative;
    const totalActions = positiveActions + negativeActions;

    return (
        <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold leading-none tracking-tight">{formatDateHeader(selectedDate)}</h3>
                    <button
                        onClick={onEdit}
                        className="bg-orange-200/40 dark:bg-orange-800/40 hover:bg-orange-300/40 dark:hover:bg-orange-700/40 text-orange-600 dark:text-orange-400 p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
                        <CardContent className="flex-1 min-h-0 px-3 md:px-6 flex flex-col overflow-hidden pt-4">
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
                            Completed
                        </div>
                    </div>
                </div>
                {/* Row 2: ValueChart */}
                <div className="flex-none border-b py-4 h-40">
                    <ActionsWeek
                        selectedDate={selectedDate}
                        userHistory={userHistory}
                    />
                </div>
                {/* Row 3: DayActions (scrollable) */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {dayActions.length > 0 ? (
                        <DayActions dayActions={dayActions} />
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            No actions logged for this date
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default Deepdive;