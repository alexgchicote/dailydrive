"use client";
import React, { useState } from "react";
import { UserHistoryDay, UserHistoryLogEntry } from "@/types";
import { Deepdive } from "./deepdive";
import { DailyLog } from "./daily-log";

interface DayViewProps {
    selectedDate: string;
    selectedActions: UserHistoryLogEntry[];
    userHistory: UserHistoryDay[];
    userId: string;
}

export function DayView({ selectedDate, selectedActions, userHistory, userId }: DayViewProps) {
    
    // State to control which view is shown
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Toggle handler for switching between views
    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };
    
    // Find the day info first
    const dayInfo = userHistory.find((day) => day.log_date === selectedDate);
    
    // Determine if we should be in edit mode
    // Note: We're not setting state here, just using the value
    const shouldBeInEditMode = isEditMode || !dayInfo;
    
    // Determine which actions to use - declare this BEFORE the return statement
    // so it's in scope for the entire component
    const logActions = dayInfo ? dayInfo.logs : selectedActions; // TODO: change this to be the selected actions on the day selected, not hard coded to today.

    return (
        <>
            {shouldBeInEditMode ? (
                <DailyLog
                    userId={userId}
                    selectedDate={selectedDate}
                    selectedActions={logActions}
                    onClose={toggleEditMode}
                />
            ) : (
                <Deepdive
                    selectedDate={selectedDate}
                    userHistory={userHistory}
                    onEdit={toggleEditMode}
                />
            )}
        </>
    );
}

export default DayView;