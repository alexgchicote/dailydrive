"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/utils/supabase/client";
import { Circle, CircleCheck, CircleX, Pencil, PencilOff } from "lucide-react";
import { ReactNode } from "react";
import { UserHistory } from "@/types";

// Define a type for a selected action
interface SelectedAction {
    selected_action_id: number;
    action_name: string;
    intent: "engage" | "avoid";
    category_id: number;
    category_name: string;
    group_category: boolean;
    status: boolean | null;
    action_reflection_id?: number;
    reflection?: string;
    // additional fields as needed
}

interface DailyLogProps {
    userId: string;
}

export function DailyLog({ userId }: DailyLogProps) {
    const supabase = createClient();

    // Local state for the selected actions and done toggles.
    const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([]);
    const [doneStatus, setDoneStatus] = useState<Record<number, boolean>>({});
    // Local state to store notes text per action
    const [notes, setNotes] = useState<Record<number, string>>({});

    // Local state for selectedDate (assumed to be in "YYYY-MM-DD" format)
    const today = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [loading, setLoading] = useState(true);

    // Compute the minimum selectable date (today minus 7 days).
    const minDateObj = new Date();
    minDateObj.setDate(new Date().getDate() - 30);
    const minDate = minDateObj.toISOString().split("T")[0];

    // Fetch selected actions for the given date.
    const fetchSelectedActionsByDate = async (uid: string, selDate: string) => {
        console.log("Fetching selected actions for user:", uid, "for date:", selDate);
        const { data, error } = await supabase
            .from("selected_actions")
            .select(`
            selected_action_id,
            action_id,
            added_to_tracking_on,
            group_category,
            actions_list (
            action_name,
                intent,
                actions_categories (
                    category_id,
                    category_name
                )
            ),
            daily_actions_log (
                status,
                notes
            )
        `)
            .eq("user_id", uid) // filters selected_actions by user
            .filter("added_to_tracking_on", "lte", selDate)
            .or(`removed_from_tracking_on.is.null,removed_from_tracking_on.gt.${selDate}`)
            .eq("daily_actions_log.log_date", selDate)

        if (error) {
            console.error("Error fetching selected actions for date:", error);
        } else {
            console.log("Fetched actions for date", selDate, ":", data);
            // Flatten the nested result:
            const flatData: SelectedAction[] = data.map((row: any) => ({
                selected_action_id: row.selected_action_id,
                action_id: row.action_id,
                group_category: row.group_category,
                action_name: row.actions_list?.action_name || "Unknown",
                intent: row.actions_list?.intent || "engage",
                category_id: row.actions_list?.actions_categories?.category_id || 0,
                category_name: row.actions_list?.actions_categories?.category_name || "Uncategorized",
                status: row.daily_actions_log?.[0]?.status ?? null, // ← FIX HERE
                reflection: row.daily_actions_log?.[0]?.notes,
            }));
            setSelectedActions(flatData || []);

            // Build doneStatus object from flatData
            const doenStatusMap: Record<number, boolean> = flatData.reduce((acc, curr) => {
                acc[curr.selected_action_id] = Boolean(curr.status);
                return acc;
            }, {} as Record<number, boolean>);
            setDoneStatus(doenStatusMap);


            // Build doneStatus object from flatData
            const notesMap: Record<number, string> = flatData.reduce((acc, curr) => {
                if (curr.reflection != null && curr.reflection.trim() !== "") {
                    acc[curr.selected_action_id] = curr.reflection;
                }
                return acc;
            }, {} as Record<number, string>);
            setNotes(notesMap);

        }
        setLoading(false);
    };

    // On mount (or when userId or selectedDate changes), fetch the logs.
    useEffect(() => {
        if (userId) {
            fetchSelectedActionsByDate(userId, selectedDate);
        }
    }, [userId, selectedDate]);



    // TODO: update compute outcome based on comments below
    // Compute outcome based on intent, status and status of sibling actions (actions that are under the same category)
    // For "engage": 
    //  - status = true then positive
    //  - status = false and parent_status = true (at least one sibling action was done) then neutral
    //  - status = false and parent_status = false then negative
    // For "avoid": can't be neutral for avoids because if its done then it is negative regardless
    //  - status = true then negative
    //  - status = false then positive
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

    // Helper function to compute parent statuses (grouped by category).
    // It returns an object mapping each category_id (as string) to a boolean.
    // Group by category_id get the max status (if all false then false if at least one true then true)
    // this will give a dict key = category_id, value = parent_status
    const computeParentStatuses = (
        actions: any[],
        doneStatus: Record<number, boolean>
    ): Record<string, boolean> => {
        const parentStatuses: Record<string, boolean> = {};
        // Group actions by category_id.
        const categoryGroups: Record<string, any[]> = {};
        actions.forEach((action) => {
            // Assume each action has a category_id field.
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
        console.log("Computed parent statuses:", parentStatuses);
        return parentStatuses;
    };

    // Save the log (in daily_actions_log and user_days): 
    // Invalidate previous logs for that user and day
    // Insert records into daily_actions_log for each selected action and user_days (aggregated view).
    const handleSaveLog = async () => {
        if (!userId) return;

        // Compute parent statuses using your helper.
        const parentStatuses = computeParentStatuses(selectedActions, doneStatus);

        // Build an array of daily log rows for JSON parameter.
        // Build daily log payload: an array of objects with the required keys.
        const dailyLogsPayload = selectedActions.map((action) => {
            const status = doneStatus[action.selected_action_id] || false;
            const parent_status = parentStatuses[action.category_id] || false;
            return {
                selected_action_id: action.selected_action_id,
                status,
                outcome: computeOutcome(action.intent, status, parent_status, action.group_category),
                parent_status,
                // Include any note attached to the action.
                notes: notes[action.selected_action_id] || "",
            };
        });

        // Build the user_days payload: a single JSON object with aggregated values.
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
                    .filter((a) => !parentStatuses[a.category_id])
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
            p_log_date: selectedDate, // Ensure this is in "YYYY-MM-DD" format.
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
    const groupActionsByCategory = (actions: SelectedAction[]): Record<string, SelectedAction[]> => {
        return actions.reduce((acc, action) => {
            const cat = action.category_name || "Uncategorized";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(action);
            return acc;
        }, {} as Record<string, SelectedAction[]>);
    };

    // Sort actions within a category.
    // For engage actions: those with group_category === false come first.
    // Then avoid actions.
    const sortActions = (actions: SelectedAction[]): SelectedAction[] => {
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

    // Group and sort the actions.
    const groupedActions = groupActionsByCategory(selectedActions);
    const sortedGroupedActions = Object.keys(groupedActions)
        .sort((a, b) => a.localeCompare(b))
        .map((category) => ({
            category,
            actions: sortActions(groupedActions[category]),
        }));

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 flex flex-col h-full max-h-[60vh]">
            {/* Header: Fixed area (date selector and save button) */}
            <div className="mb-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Daily Log for:
                    </h2>
                    <div className="flex items-center gap-2">
                        <input
                            id="log-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) =>
                                setSelectedDate(e.target.value ? e.target.value : selectedDate)
                            }
                            min={minDate}  // e.g., today - 7 days
                            max={today}    // today's date; no future dates allowed
                            className="p-1 border rounded bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                        />
                        <button
                            onClick={handleSaveLog}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Save Log
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto max-h-full">
                {sortedGroupedActions.map((group) => (
                    <div
                        key={group.category}
                        className="shadow-[0_4px_12px_theme(colors.gray.300)] dark:shadow-[4px_4px_4px_theme(colors.zinc.800)] mb-4"
                    >
                        {/* Category Header */}
                        <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-t-lg">
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
        </div>
    );
};


export interface DailyLogActionRowProps {
    action: SelectedAction;
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
        className={`${
          isNotesOpen ? "" : "border-b border-gray-200 dark:border-gray-700"
        }`}
      >
        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
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
              className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded focus:outline-none"
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


interface DailyLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

const DailyLogModal = ({ isOpen, onClose, children }: DailyLogModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-lg w-[90%] max-w-xl 
                           max-h-[60vh] shadow-lg relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {children}
            </div>
        </div>
    );
};

export { DailyLogModal };