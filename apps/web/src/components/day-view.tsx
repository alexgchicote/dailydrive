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
    onDataRefresh: () => Promise<void>;
}

export function DayView({ selectedDate, selectedActions, userHistory, userId, onDataRefresh }: DayViewProps) {
    
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
    
    // Determine which actions to use:
    // - If logs exist for this date, use the actual logs  
    // - If no logs exist, use the user's selected actions but with clean/empty status
    const logActions = dayInfo ? dayInfo.logs : selectedActions.map(action => ({
        ...action,
        status: false,
        parentStatus: false,
        notes: '',
        outcome: 'neutral',
        // Keep the action info but clear the logged values for fresh logging
    })) as unknown as UserHistoryLogEntry[];

    return (
        <>
            {shouldBeInEditMode ? (
                <DailyLog
                    userId={userId}
                    selectedDate={selectedDate}
                    selectedActions={logActions}
                    onClose={toggleEditMode}
                    onDataRefresh={onDataRefresh}
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