"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Circle, CircleCheck, CircleX } from 'lucide-react';

// Define a type for the selected action
interface SelectedAction {
    selected_action_id: number;
    action_name: string;
    intent: "engage" | "avoid";
    // other fields as needed
}

interface DailyLogProps {
    userId: string;
    onActionToggle?: (actionId: number, done: boolean) => void;
}

const DailyLog = ({ userId, onActionToggle }: DailyLogProps) => {
    const supabase = createClient();
    // Local state: map each action's selected_action_id to a boolean (true means marked as done)
    const [doneStatus, setDoneStatus] = useState<Record<number, boolean>>({});

    const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([]);

    // State to track the selected date. Defaults to today.
    const today = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // Compute the minimum selectable date (today minus 7 days).
    const minDateObj = new Date();
    minDateObj.setDate(new Date().getDate() - 7);
    const minDate = minDateObj.toISOString().split("T")[0];

    // Function to fetch selected actions for a given date.
    const fetchSelectedActionsByDate = async (uid: string, selDate: string) => {
        console.log("Fetching selected actions for user:", uid, "for date:", selDate);
        const { data, error } = await supabase.rpc("get_user_selected_actions_by_date", {
            uid,
            sel_date: selDate,
        });
        if (error) {
            console.error("Error fetching selected actions for date:", error);
        } else {
            console.log("Fetched actions for date", selDate, ":", data);
            setSelectedActions(data || []);
        }
    };

    // useEffect to refetch selected actions when selectedDate changes.
    useEffect(() => {
        if (userId) {
            fetchSelectedActionsByDate(userId, selectedDate);
        }
    }, [userId, selectedDate]);

    // Toggle the done status for an action.
    const handleToggle = (selected_action_id: number) => {
        setDoneStatus((prev) => {
            const newStatus = !prev[selected_action_id];
            if (onActionToggle) {
                onActionToggle(selected_action_id, newStatus);
            }
            return { ...prev, [selected_action_id]: newStatus };
        });
    };

    // Compute outcome based on intent and status.
    // For "engage": done = positive, not done = negative.
    // For "avoid": done = negative, not done = positive.
    const computeOutcome = (intent: "engage" | "avoid", done: boolean): string => {
        if (intent === "engage") {
            return done ? "positive" : "negative";
        } else {
            return done ? "negative" : "positive";
        }
    };

    // Save the log: 
    // Invalidate previous logs for that user and day
    // Insert records into daily_actions_log for each selected action.
    const handleSaveLog = async () => {
        if (!userId) return;

        // First, update any existing daily log rows for this user and date, marking them as invalid (is_valid = 0).
        const { error: updateError } = await supabase
            .from("daily_actions_log")
            .update({ is_valid: 0 })
            .eq("user_id", userId)
            .eq("log_date", selectedDate)
            .eq("is_valid", 1);

        if (updateError) {
            console.error("Error updating previous log entries:", updateError);
            return;
        }

        // Build an array of new rows to insert.
        const rowsToInsert = selectedActions.map((action) => {
            const done = doneStatus[action.selected_action_id] || false;
            return {
                user_id: userId,  // Ensure this column exists in your table.
                log_date: selectedDate,
                selected_action_id: action.selected_action_id,
                status: done, // true for done, false for skipped/avoided.
                outcome: computeOutcome(action.intent, done),
                is_valid: 1, // Mark the new row as valid.
                log_timestamp: new Date().toISOString()
            };
        });

        const { error } = await supabase.from("daily_actions_log").insert(rowsToInsert);
        if (error) {
            console.error("Error saving daily log:", error);
        } else {
            alert("Daily log saved successfully!");
        }
    };


    return (
        <div className="p-4">
            <div className="mb-4">
                <label htmlFor="log-date" className="text-sm text-gray-900 dark:text-gray-100 mr-2">
                    Select Date:
                </label>
                <input
                    id="log-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value ? e.target.value : today)}
                    min={minDate}  // e.g., today - 7 days
                    max={today}    // today's date; no future dates allowed
                    className="p-1 border rounded bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                />
            </div>
            <table className="min-w-full rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                <tbody>
                    {selectedActions.length === 0 ? (
                        <tr>
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300" colSpan={2}>
                                No selected actions.
                            </td>
                        </tr>
                    ) : (
                        selectedActions.map((action) => {
                            const done = doneStatus[action.selected_action_id] || false;
                            return (
                                <tr
                                    key={action.selected_action_id}
                                    className="border-b border-gray-200 dark:border-gray-700"
                                >
                                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                        {action.action_name}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            onClick={() => handleToggle(action.selected_action_id)}
                                            className="relative group p-2 focus:outline-none"
                                        >
                                            {/* When not done, show empty circle by default and on hover swap icon */}
                                            {!done && (
                                                <>
                                                    {/* Default state: empty circle */}
                                                    <span className="block group-hover:hidden">
                                                        <Circle className="text-gray-400" />
                                                    </span>
                                                    {/* Hover state: tick for engage, cross for avoid */}
                                                    <span className="hidden group-hover:block">
                                                        {action.intent === "engage" ? (
                                                            <CircleCheck className="text-green-300" />
                                                        ) : (
                                                            <CircleX className="text-red-300" />
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                            {/* When done, show the filled version */}
                                            {done && (
                                                <>
                                                    <span className="block group-hover:hidden">
                                                        {action.intent === "engage" ? (
                                                            <CircleCheck className="text-green-600" />
                                                        ) : (
                                                            <CircleX className="text-red-600" />
                                                        )}
                                                    </span>
                                                    <span className="hidden group-hover:block">
                                                        <Circle className={action.intent === "engage" ? "text-green-300" : "text-red-300"} />
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
            <div className="mt-4">
                <button
                    onClick={handleSaveLog}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Save Log
                </button>
            </div>
        </div>
    );
};

export default DailyLog;