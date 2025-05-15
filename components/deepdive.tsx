"use client";
import React from "react";
import { UserHistoryDay } from "@/types";
import DayActions from "./day-actions";
import DayScore from "./day-score";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ActionsWeek } from "./week-actions";
import { Pencil } from "lucide-react";

interface DeepdiveProps {
    selectedDate: string;
    userHistory: UserHistoryDay[];
    onEdit: () => void; // Added prop for edit mode toggle
}

export function Deepdive({ selectedDate, userHistory, onEdit }: DeepdiveProps) {
    // Format date header function
    const formatDateHeader = (dateString: string) => {
        if (!dateString) return "";

        const date = new Date(dateString);

        // Get weekday name
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

        // Get day without leading zero
        const day = date.getDate();

        // Get month abbreviated name
        const month = date.toLocaleDateString('en-US', { month: 'short' });

        // Get full year
        const year = date.getFullYear();

        return `${weekday}, ${day} ${month} ${year}`;
    };

    // Find the history record that matches the selected date.
    const dayInfo = userHistory.find((day) => day.log_date === selectedDate);
    if (!dayInfo) { // TODO: here also add if the toggle
        return (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{formatDateHeader(selectedDate)}</CardTitle>
                </CardHeader>
                <CardContent>
                  No logs available for {selectedDate}. Start logging your actions!
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
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-0 flex flex-row justify-between items-center">
                <CardTitle>{formatDateHeader(selectedDate)}</CardTitle>
                <button
                    onClick={onEdit}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center transition-colors"
                >
                    <Pencil className="h-5 w-5" />
                </button>
            </CardHeader>
            <CardContent className="h-full flex flex-col overflow-hidden pt-4">
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