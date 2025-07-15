"use client";

import React, { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Pencil, PencilOff, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { UserHistoryLogEntry } from "@/types";
import { formatDateHeader } from "@/lib/utils";

interface DailyLogProps {
    userId: string;
    selectedDate: string;
    onClose: () => void;
    selectedActions: UserHistoryLogEntry[];
    onDataRefresh: () => Promise<void>;
}

export function DailyLog({ userId, selectedDate, selectedActions, onClose, onDataRefresh }: DailyLogProps) {
    const supabase = createClient();

    // Local state for the selected actions and done toggles.
    const [doneStatus, setDoneStatus] = useState<Record<number, boolean>>({});
    // Local state to store notes text per action
    const [notes, setNotes] = useState<Record<number, string>>({});
    // State to track if the component is loaded
    const [isLoaded, setIsLoaded] = useState(false);
    // Track original state to detect changes
    const [originalDoneStatus, setOriginalDoneStatus] = useState<Record<number, boolean>>({});
    const [originalNotes, setOriginalNotes] = useState<Record<number, string>>({});

    // Initialize the state on component mount
    useEffect(() => {
        // Build doneStatus object from selectedActions
        const doneStatusMap: Record<number, boolean> = selectedActions.reduce((acc, curr) => {
            acc[curr.selected_action_id] = Boolean(curr.status);
            return acc;
        }, {} as Record<number, boolean>);

        // Build notes object from selectedActions
        const notesMap: Record<number, string> = selectedActions.reduce((acc, curr) => {
            if (curr.notes != null && curr.notes.trim() !== "") {
                acc[curr.selected_action_id] = curr.notes;
            }
            return acc;
        }, {} as Record<number, string>);

        setDoneStatus(doneStatusMap);
        setNotes(notesMap);
        // Store original state for change detection
        setOriginalDoneStatus(doneStatusMap);
        setOriginalNotes(notesMap);
        setIsLoaded(true);
    }, [selectedActions]); // Only run when selectedActions changes

    // Helper function to check if there's an existing log
    const hasExistingLog = () => {
        return selectedActions.some(action => 
            action.status !== null || (action.notes != null && action.notes.trim() !== "")
        );
    };

    // Helper function to check if there are unsaved changes
    const hasUnsavedChanges = () => {
        // Check if done status has changed
        const doneStatusChanged = Object.keys({...originalDoneStatus, ...doneStatus}).some(key => {
            const actionId = parseInt(key);
            return (originalDoneStatus[actionId] || false) !== (doneStatus[actionId] || false);
        });

        // Check if notes have changed
        const notesChanged = Object.keys({...originalNotes, ...notes}).some(key => {
            const actionId = parseInt(key);
            const originalNote = originalNotes[actionId] || "";
            const currentNote = notes[actionId] || "";
            return originalNote !== currentNote;
        });

        return doneStatusChanged || notesChanged;
    };

    // Compute outcome based on intent, status and status of sibling actions
    const computeOutcome = (
        intent: "engage" | "avoid",
        status: boolean,
        parent_status: boolean,
        group_category?: boolean
    ): string => {
        if (intent === "engage") {
            if (status) {
                return "positive";
            } else if (!group_category) { // if not group with category then it can't be neutral
                return "negative";
            } else {
                return parent_status ? "neutral" : "negative";
            }
        } else {
            // For avoid actions, done means negative, not done means positive.
            return status ? "negative" : "positive";
        }
    };

    // Helper function to compute parent statuses (grouped by category)
    const computeParentStatuses = (
        actions: UserHistoryLogEntry[],
        doneStatus: Record<number, boolean>
    ): Record<string, boolean> => {
        const parentStatuses: Record<string, boolean> = {};

        // Group actions by category_id.
        const categoryGroups: Record<string, any[]> = {};

        actions.forEach((action) => {
            const catId = action.category_id;
            if (!categoryGroups[catId]) {
                categoryGroups[catId] = [];
            }
            categoryGroups[catId].push(action);
        });

        // For each category, if at least one action is marked done, parent_status is true.
        Object.keys(categoryGroups).forEach((catId) => {
            const group = categoryGroups[catId];
            
            // Only consider actions with group_category=true for parent status
            const groupableActions = group.filter(action => action.group_category);
            
            // If there are no groupable actions in this category, parent status is false
            if (groupableActions.length === 0) {
                parentStatuses[catId] = false;
            } else {
                const anyDone = groupableActions.some((action) => doneStatus[action.selected_action_id]);
            parentStatuses[catId] = anyDone;
            }
        });

        return parentStatuses;
    };

    // Save the log and then close the form
    const handleSaveAndClose = async () => {
        try {
            await handleSaveLog();
            await onDataRefresh();
            onClose();
        } catch (error) {
            console.error("Error saving and refreshing data:", error);
            toast.error("Failed to save log or refresh data");
        }
    };

    // Save the log (in daily_actions_log and user_days)
    const handleSaveLog = async () => {
        if (!userId) return;

        // Compute parent statuses using your helper.
        const parentStatuses = computeParentStatuses(selectedActions, doneStatus);

        // Build an array of daily log rows for JSON parameter.
        const dailyLogsPayload = selectedActions.map((action) => {
            const status = doneStatus[action.selected_action_id] || false;
            const parent_status = parentStatuses[action.category_id] || false;
            return {
                selected_action_id: action.selected_action_id,
                status,
                outcome: computeOutcome(action.intent, status, parent_status, action.group_category),
                parent_status,
                notes: notes[action.selected_action_id] || "",
            };
        });

        // Build the user_days payload with aggregated values
        // Compute aggregates for user_days:
        const engageActions = selectedActions.filter((a) => a.intent === "engage");
        const num_engage_actions_total = engageActions.length;
        const num_engage_actions_positive = engageActions.filter((a) => {
            const status = doneStatus[a.selected_action_id] || false;
            const parent_status = parentStatuses[a.category_id] || false;
            return computeOutcome(a.intent, status, parent_status, a.group_category) === "positive";
        }).length;

        const num_engage_actions_negative =
            engageActions.filter((a) => {
                const status = doneStatus[a.selected_action_id] || false;
                const parent_status = parentStatuses[a.category_id] || false;
                return (
                    computeOutcome(a.intent, status, parent_status, a.group_category) === "negative" &&
                    !a.group_category
                );
            }).length +
            new Set(
                engageActions
                    .filter((a) => !parentStatuses[a.category_id] && a.group_category)
                    .map((a) => a.category_id)
            ).size;

        const num_engage_actions_neutral = engageActions.filter((a) => {
            const status = doneStatus[a.selected_action_id] || false;
            const parent_status = parentStatuses[a.category_id] || false;
            return computeOutcome(a.intent, status, parent_status, a.group_category) === "neutral";
        }).length;

        const avoidActions = selectedActions.filter((a) => a.intent === "avoid");
        const num_avoid_actions_total = avoidActions.length;
        const num_avoid_actions_positive = avoidActions.filter((a) => {
            const status = doneStatus[a.selected_action_id] || false;
            const parent_status = parentStatuses[a.category_id] || false;
            return computeOutcome(a.intent, status, parent_status, a.group_category) === "positive";
        }).length;
        const num_avoid_actions_negative = avoidActions.filter((a) => {
            const status = doneStatus[a.selected_action_id] || false;
            const parent_status = parentStatuses[a.category_id] || false;
            return computeOutcome(a.intent, status, parent_status, a.group_category) === "negative";
        }).length;

        const distinctCategories = Array.from(new Set(selectedActions.map((a) => a.category_id)));
        const num_categories_tracked = distinctCategories.length;

        const actions_day_grade =
            (num_engage_actions_positive + num_avoid_actions_positive) /
            (num_engage_actions_positive +
                num_avoid_actions_positive +
                num_engage_actions_negative +
                num_avoid_actions_negative);

        const userDaysPayload = {
            num_engage_actions_total,
            num_engage_actions_positive,
            num_engage_actions_neutral,
            num_engage_actions_negative,
            num_avoid_actions_total,
            num_avoid_actions_positive,
            num_avoid_actions_negative,
            num_categories_tracked,
            actions_day_grade,
        };

        // Call the RPC function with the encapsulated JSON payloads.
        const { error } = await supabase.rpc("upsert_user_log_payloads", {
            p_user_id: userId,
            p_log_date: selectedDate,
            p_user_days: userDaysPayload,
            p_daily_logs: dailyLogsPayload,
        });

        if (error) {
            console.error("Error in RPC upsert:", error);
            toast.error("Failed to save daily log");
            throw error; // Re-throw to be caught by handleSaveAndClose
        }
        // Success toast will be shown after data refresh completes
    };

    // Group selected actions by category.
    const groupActionsByCategory = (actions: UserHistoryLogEntry[]): Record<string, UserHistoryLogEntry[]> => {
        return actions.reduce((acc, action) => {
            const cat = action.category_name || "Uncategorized";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(action);
            return acc;
        }, {} as Record<string, UserHistoryLogEntry[]>);
    };

    // Sort actions within a category.
    const sortActions = (actions: UserHistoryLogEntry[]): UserHistoryLogEntry[] => {
        return actions.sort((a, b) => {
            if (a.intent === b.intent) {
                if (a.intent === "engage") {
                    if (a.group_category === b.group_category) return 0;
                    return a.group_category === false ? -1 : 1;
                }
                return 0;
            }
            return a.intent === "engage" ? -1 : 1;
        });
    };

    // Show a loading state until the initial state is set up
    if (!isLoaded) {
        return (
            <div className="h-full flex flex-col">
                <div className="pb-0 p-6">
                    <h3 className="text-lg font-semibold leading-none tracking-tight">{formatDateHeader(selectedDate)}</h3>
                </div>
                <div className="h-full flex flex-col overflow-hidden pt-4 p-6">
                    <div>Loading...</div>
                </div>
            </div>
        );
    }

    // Group and sort the actions.
    const groupedActions = groupActionsByCategory(selectedActions);
    const sortedGroupedActions = Object.keys(groupedActions)
        .sort((a, b) => a.localeCompare(b))
        .map((category) => ({
            category,
            actions: sortActions(groupedActions[category]),
        }));

    return (
        <Card className="h-[500px] flex flex-col">
            <Toaster position="top-center" />
            <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold leading-none tracking-tight">{formatDateHeader(selectedDate)}</h3>
                    <div className="flex space-x-2">
                        {/* Save button - show if there are unsaved changes OR no existing log */}
                        {(hasUnsavedChanges() || !hasExistingLog()) && (
                        <button
                            onClick={handleSaveAndClose}
                            className="bg-purple-300/40 dark:bg-purple-800/40 hover:bg-purple-400/40 dark:hover:bg-purple-700/40 text-purple-600 dark:text-purple-400 p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm dark:shadow-white/5"
                        >
                            <Save className="h-4 w-4" />
                        </button>
                        )}
                        {/* X button to close without saving - only show if there's an existing log */}
                        {hasExistingLog() && (
                        <button
                            onClick={onClose}
                            className="bg-gray-300/40 dark:bg-gray-800/40 hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm dark:shadow-white/5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 px-3 md:px-6">
                <div className="h-full overflow-auto">
                    <table className="w-full">
                        <tbody>
                            {sortedGroupedActions.map((group) => (
                                <React.Fragment key={group.category}>
                                    <tr className="sticky top-0 z-10 bg-background border-b-2 border-border border-l-2 border-l-transparent">
                                        <td
                                            colSpan={2}
                                            className="pb-2 pt-3 text-xs text-gray-600 dark:text-gray-400 font-thin text-muted-foreground"
                                        >
                                            {group.category}
                                        </td>
                                    </tr>
                                    {group.actions.map((action) => (
                                        <DailyLogActionRow
                                            key={action.selected_action_id}
                                            action={action}
                                            doneStatus={doneStatus}
                                            setDoneStatus={setDoneStatus}
                                            notes={notes}
                                            setNotes={setNotes}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

export interface DailyLogActionRowProps {
    action: UserHistoryLogEntry;
    doneStatus: Record<number, boolean>;
    setDoneStatus: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    notes: Record<number, string>;
    setNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}

const DailyLogActionRow = ({
    action,
    doneStatus,
    setDoneStatus,
    notes,
    setNotes,
}: DailyLogActionRowProps) => {
    // Local state to track note UI for each action
    const [notesOpen, setNotesOpen] = useState<Record<number, boolean>>(() => {
        // Initialize with notes row open if there's already text
        const hasNotes = notes[action.selected_action_id]?.trim();
        return hasNotes ? { [action.selected_action_id]: true } : {};
    });
    // Determine whether the current action is marked as done.
    const done = doneStatus[action.selected_action_id] || false;
    // Determine whether the notes textbox for this action is open.
    const isNotesOpen = notesOpen[action.selected_action_id] || false;

    return (
        <Fragment>
            {/* Main Action Row: if notes are open, omit bottom border */}
            <tr>
                <td className="p-2 text-black dark:text-white">
                    {action.action_name || "N/A"}
                </td>
                {/* Combined cell for circle and pencil icons */}
                <td className="p-2 text-right" style={{ width: "80px", minWidth: "80px", maxWidth: "80px" }}>
                    <div className="flex justify-end items-center space-x-2">
                        <button
                            onClick={() =>
                                setDoneStatus((prev) => ({
                                    ...prev,
                                    [action.selected_action_id]: !prev[action.selected_action_id],
                                }))
                            }
                            className={`p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm group focus:outline-none ${
                                done ? 
                                    action.intent === "engage"
                                        ? "hover:bg-gray-300/40 hover:dark:bg-gray-800/40 bg-green-400/40 dark:bg-green-700/40 text-green-600 dark:text-green-400"
                                        : "hover:bg-gray-300/40 hover:dark:bg-gray-800/40 bg-red-400/40 dark:bg-red-700/40 text-red-600 dark:text-red-400"
                                    : 
                                    action.intent === "engage"
                                        ? "bg-gray-300/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:text-green-600 hover:dark:text-green-400"
                                        : "bg-gray-300/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:dark:text-red-400"
                            }`}
                        >
                            {action.intent === "engage" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={() => {
                                // If there's text, don't allow closing the notes
                                if (notes[action.selected_action_id]?.trim()) {
                                    return;
                                }
                                // Otherwise, toggle as normal
                                setNotesOpen((prev) => ({
                                    ...prev,
                                    [action.selected_action_id]:
                                        !prev[action.selected_action_id],
                                }));
                            }}
                            className={`p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm ${
                                notes[action.selected_action_id]?.trim()
                                    ? "hover:bg-gray-300/40 hover:dark:bg-gray-800/40 bg-blue-400/40 dark:bg-blue-700/40 text-blue-600 dark:text-blue-400"
                                    : "bg-gray-300/40 dark:bg-gray-800/40 hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}
                        >
                            {/* Show pencil-off only if notes are open but no text exists */}
                            {isNotesOpen && !notes[action.selected_action_id]?.trim() 
                                ? <PencilOff className="h-4 w-4" /> 
                                : <Pencil className="h-4 w-4" />}
                        </button>
                    </div>
                </td>
            </tr>
            {/* Notes Row */}
            {isNotesOpen && (
                <tr>
                    <td
                        colSpan={2}
                        className="p-2"
                    >
                        <textarea
                            value={notes[action.selected_action_id] || ""}
                            onChange={(e) =>
                                setNotes((prev) => ({
                                    ...prev,
                                    [action.selected_action_id]: e.target.value,
                                }))
                            }
                            placeholder="Flag any notes here..."
                            className="w-full p-2 border rounded transition-all duration-300 min-h-[3rem] resize-y"
                        />
                    </td>
                </tr>
            )}
        </Fragment>
    );
};