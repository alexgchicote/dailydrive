"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/utils/supabase/client";
import { Circle, CircleCheck, CircleX, Pencil, PencilOff, Save, X, Plus, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { UserHistoryLogEntry } from "@/types";
import { formatDateHeader } from "@/utils/utils";

interface DailyLogProps {
    userId: string;
    selectedDate: string;
    onClose: () => void;
    selectedActions: UserHistoryLogEntry[];
}

export function DailyLog({ userId, selectedDate, selectedActions, onClose }: DailyLogProps) {
    const supabase = createClient();

    // Local state for the selected actions and done toggles.
    const [doneStatus, setDoneStatus] = useState<Record<number, boolean>>({});
    // Local state to store notes text per action
    const [notes, setNotes] = useState<Record<number, string>>({});
    // State to track if the component is loaded
    const [isLoaded, setIsLoaded] = useState(false);

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
        setIsLoaded(true);
    }, [selectedActions]); // Only run when selectedActions changes

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
        actions: any[],
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
            const anyDone = group.some((action) => doneStatus[action.selected_action_id]);
            parentStatuses[catId] = anyDone;
        });
        return parentStatuses;
    };

    // Save the log and then close the form
    const handleSaveAndClose = async () => {
        await handleSaveLog();
        onClose();
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
        } else {
            alert("Daily log and summary saved successfully!");
        }
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
            <Card className="h-full flex flex-col">
                <CardHeader className="pb-0">
                    <CardTitle>{formatDateHeader(selectedDate)}</CardTitle>
                </CardHeader>
                <CardContent className="h-full flex flex-col overflow-hidden pt-4">
                    <div>Loading...</div>
                </CardContent>
            </Card>
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
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-0 flex flex-row justify-between items-center">
                <CardTitle>{formatDateHeader(selectedDate)}</CardTitle>
                <div className="flex space-x-2">
                    {/* Save button */}
                    <button
                        onClick={handleSaveAndClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center transition-colors"
                    >
                        <Save className="h-5 w-5" />
                    </button>
                    {/* X button to close without saving */}
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded flex items-center justify-center transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="h-full flex flex-col overflow-hidden pt-4">
                <div className="flex-grow overflow-y-auto max-h-full">
                    {sortedGroupedActions.map((group) => (
                        <div
                            key={group.category}
                            className="shadow-[0_4px_12px_theme(colors.gray.300)] dark:shadow-[4px_4px_4px_theme(colors.zinc.800)] mb-4"
                        >
                            {/* Category Header */}
                            <div className="bg-gray-200 dark:bg-gray-900 px-4 py-2 rounded-t-lg">
                                <span className="text-sm dark:text-gray-400">{group.category}</span>
                            </div>
                            {/* Table */}
                            <table className="min-w-full table-fixed">
                                <tbody>
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
                                </tbody>
                            </table>
                        </div>
                    ))}
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
    const [notesOpen, setNotesOpen] = useState<Record<number, boolean>>({});
    // Determine whether the current action is marked as done.
    const done = doneStatus[action.selected_action_id] || false;
    // Determine whether the notes textbox for this action is open.
    const isNotesOpen = notesOpen[action.selected_action_id] || false;

    return (
        <Fragment>
            {/* Main Action Row: if notes are open, omit bottom border */}
            <tr
                className={`${isNotesOpen ? "" : "border-b border-gray-200 dark:border-gray-700"
                    }`}
            >
                <td className="px-4 py-2 text-black dark:text-white">
                    {action.action_name || "N/A"}
                    {action.intent === "engage" && !action.group_category && " *"}
                </td>
                {/* Combined cell for circle and pencil icons */}
                <td className="px-4 py-2 text-right">
                    <div className="flex justify-end items-center space-x-2">
                        <button
                            onClick={() =>
                                setDoneStatus((prev) => ({
                                    ...prev,
                                    [action.selected_action_id]: !prev[action.selected_action_id],
                                }))
                            }
                            className="relative group p-2 focus:outline-none"
                        >
                            {!done ? (
                                <>
                                    <span className="block group-hover:hidden">
                                        <Circle className="text-gray-400" />
                                    </span>
                                    <span className="hidden group-hover:block">
                                        {action.intent === "engage" ? (
                                            <CircleCheck className="text-green-300" />
                                        ) : (
                                            <CircleX className="text-red-300" />
                                        )}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="block group-hover:hidden">
                                        {action.intent === "engage" ? (
                                            <CircleCheck className="text-green-600" />
                                        ) : (
                                            <CircleX className="text-red-600" />
                                        )}
                                    </span>
                                    <span className="hidden group-hover:block">
                                        <Circle
                                            className={
                                                action.intent === "engage"
                                                    ? "text-green-300"
                                                    : "text-red-300"
                                            }
                                        />
                                    </span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() =>
                                setNotesOpen((prev) => ({
                                    ...prev,
                                    [action.selected_action_id]:
                                        !prev[action.selected_action_id],
                                }))
                            }
                            className="
                                text-gray-600 
                                dark:text-gray-500 
                                px-2 
                                py-1 
                                rounded 
                                focus:outline-none
                            "
                        >
                            {isNotesOpen ? <PencilOff /> : <Pencil />}
                        </button>
                    </div>
                </td>
            </tr>
            {/* Notes Row */}
            {isNotesOpen && (
                <tr>
                    <td
                        colSpan={2}
                        className="px-4 py-2 border-b border-gray-200 dark:border-gray-700"
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