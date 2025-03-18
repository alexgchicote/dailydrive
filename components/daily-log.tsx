"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/utils/supabase/client";
import { Circle, CircleCheck, CircleX } from "lucide-react";
import { ReactNode } from "react";

// Define a type for a selected action
interface SelectedAction {
    selected_action_id: number;
    action_name: string;
    intent: "engage" | "avoid";
    category_id: number;
    category_name: string;
    group_category: boolean;
    // additional fields as needed
}

interface DailyLogProps {
    userId: string;
    onActionToggle?: (actionId: number, done: boolean) => void;
    selectedDate: string;
}

const DailyLog = ({ userId, selectedDate, onActionToggle }: DailyLogProps) => {
    const supabase = createClient();

    // Local state for the selected actions and done toggles.
    const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([]);
    const [doneStatus, setDoneStatus] = useState<Record<number, boolean>>({});
    // Local state for selectedDate (assumed to be in "YYYY-MM-DD" format)
    const today = new Date().toISOString().split("T")[0];
    const [reselectedDate, setReselectedDate] = useState<string>(selectedDate);
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
                )
            `)
            .eq("user_id", uid)
            // Filter for rows where added_to_tracking_on is less than or equal to selDate.
            // (Assuming dates are stored in a comparable string format, e.g. "YYYY-MM-DD")
            .filter("added_to_tracking_on", "lte", selDate)
            // Filter such that either removed_from_tracking_on is null or greater than selDate.
            .or(`removed_from_tracking_on.is.null,removed_from_tracking_on.gt.${selDate}`);

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
            }));
            setSelectedActions(flatData || []);
        }
        setLoading(false);
    };

    // On mount (or when userId or selectedDate changes), fetch the logs.
    useEffect(() => {
        if (userId) {
            fetchSelectedActionsByDate(userId, reselectedDate);
        }
    }, [userId, reselectedDate]);

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

        // 1. Invalidate previous daily log rows for this user and date.
        const { error: updateError } = await supabase
            .from("daily_actions_log")
            .update({ is_valid: 0 })
            .eq("user_id", userId)
            .eq("log_date", reselectedDate)
            .eq("is_valid", 1);

        if (updateError) {
            console.error("Error updating previous daily log entries:", updateError);
            return;
        }

        // 2. Compute parent statuses based on selectedActions and doneStatus.
        const parentStatuses = computeParentStatuses(selectedActions, doneStatus);

        // 3. Build new daily log rows for each selected action.
        const dailyLogToInsert = selectedActions.map((action) => {
            const status = doneStatus[action.selected_action_id] || false;
            const parent_status = parentStatuses[action.category_id] || false;
            return {
                user_id: userId,  // Ensure this column exists in your table.
                log_date: reselectedDate,
                selected_action_id: action.selected_action_id,
                status: status, // true if done, false if not.
                parent_status: parent_status, // aggregated status for the category.
                outcome: computeOutcome(action.intent, status, parent_status, action.group_category),
                is_valid: 1, // Mark as valid.
            };
        });

        const { error: insertDailyError } = await supabase.from("daily_actions_log").insert(dailyLogToInsert);
        if (insertDailyError) {
            console.error("Error saving daily log entries:", insertDailyError);
            return;
        } else {
            console.log("Daily log entries inserted successfully:", reselectedDate);
        }

        // 4. Aggregate values for the user_days table.
        // For engage actions:
        const engageActions = selectedActions.filter((a) => a.intent === "engage");
        const num_engage_actions_total = engageActions.length;
        const num_engage_actions_positive = engageActions.filter((a) => {
            const status = doneStatus[a.selected_action_id] || false;
            const parent_status = parentStatuses[a.category_id] || false;
            return computeOutcome(a.intent, status, parent_status, a.group_category) === "positive";
        }).length;
        const num_engage_actions_negative = engageActions
            .filter((a) => {
                const status = doneStatus[a.selected_action_id] || false;
                const parent_status = parentStatuses[a.category_id] || false;
                return (
                    computeOutcome(a.intent, status, parent_status, a.group_category) === "negative" &&
                    !a.group_category // Ensure group_category is false
                );
            }).length
            +
            // Distinct count of category IDs where parent_status === false. I.e. the number of categories that were skipped
            new Set(
                engageActions
                    .filter((a) => !parentStatuses[a.category_id]) // Only include categories where parent_status is false
                    .map((a) => a.category_id) // Extract category IDs
            ).size;

        const num_engage_actions_neutral = engageActions.filter((a) => {
            const status = doneStatus[a.selected_action_id] || false;
            const parent_status = parentStatuses[a.category_id] || false;
            return computeOutcome(a.intent, status, parent_status, a.group_category) === "neutral";
        }).length;

        // For avoid actions:
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

        const actions_day_grade = (
            num_engage_actions_positive +
            num_avoid_actions_positive
        ) / (
                num_engage_actions_positive +
                num_avoid_actions_positive +
                num_engage_actions_negative +
                num_avoid_actions_negative
            )

        // Count distinct categories tracked.
        const distinctCategories = Array.from(new Set(selectedActions.map((a) => a.category_id)));
        const num_categories_tracked = distinctCategories.length;

        console.log("Aggregates:", {
            num_engage_actions_total,
            num_engage_actions_positive,
            num_engage_actions_negative,
            num_engage_actions_neutral,
            num_avoid_actions_total,
            num_avoid_actions_positive,
            num_avoid_actions_negative,
            num_categories_tracked,
            actions_day_grade
        });

        // 5. Invalidate previous user_days row for this user and date.
        const { error: updateUserDaysError } = await supabase
            .from("user_days")
            .update({ is_valid: false })
            .eq("user_id", userId)
            .eq("log_date", reselectedDate)
            .eq("is_valid", true);

        if (updateUserDaysError) {
            console.error("Error updating previous user_days entries:", updateUserDaysError);
            return;
        }

        // 6. Insert a new row into user_days with the aggregated values.
        const userDaysRow = {
            user_id: userId,
            log_date: reselectedDate,
            num_engage_actions_total,
            num_engage_actions_positive,
            num_engage_actions_negative,
            num_engage_actions_neutral,
            num_avoid_actions_total,
            num_avoid_actions_positive,
            num_avoid_actions_negative,
            num_categories_tracked,
            actions_day_grade,
            is_valid: true
        };

        const { error: insertUserDaysError } = await supabase
            .from("user_days")
            .insert(userDaysRow);

        if (insertUserDaysError) {
            console.error("Error inserting user_days row:", insertUserDaysError);
        } else {
            console.log("User_days row inserted successfully.");
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
                            value={reselectedDate}
                            onChange={(e) =>
                                setReselectedDate(e.target.value ? e.target.value : selectedDate)
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

            {/* Scrollable Table Container */}
            <div className="flex-grow overflow-y-auto max-h-full">
                <table className="min-w-full">
                    <tbody>
                        {selectedActions.length === 0 ? (
                            <tr>
                                <td
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300"
                                    colSpan={2}
                                >
                                    No selected actions.
                                </td>
                            </tr>
                        ) : (
                            sortedGroupedActions.map((group) => {
                                // Check if any action in the group is marked done.
                                const groupHasDone = group.actions.some(
                                    (action: SelectedAction) => doneStatus[action.selected_action_id]
                                );
                                // Use the first action's intent for the group.
                                const groupIntent = group.actions.length > 0 ? group.actions[0].intent : "engage";
                                const groupIcon = groupHasDone
                                    ? groupIntent === "engage" ? (
                                        <CircleCheck className="text-blue-600" />
                                    ) : (
                                        <CircleX className="text-red-600" />
                                    )
                                    : null;

                                return (
                                    <Fragment key={group.category}>
                                        {/* Category Header Row */}
                                        <tr className="bg-gray-300 dark:bg-gray-700">
                                            <td className="px-4 py-2 font-bold">{group.category}</td>
                                            <td></td>
                                            {/* <td className="px-4 py-2 text-right">{groupIcon}</td> */}
                                        </tr>
                                        {group.actions.map((action) => {
                                            const done = doneStatus[action.selected_action_id] || false;
                                            return (
                                                <tr
                                                    key={action.selected_action_id}
                                                    className="border-b border-gray-200 dark:border-gray-700"
                                                >
                                                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                                        {action.action_name}
                                                        {action.intent === "engage" && !action.group_category && " *"}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => handleToggle(action.selected_action_id)}
                                                            className="relative group p-2 focus:outline-none"
                                                        >
                                                            {!done && (
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
                                                            )}
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
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
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
                className="bg-white dark:bg-gray-800 rounded-lg w-[90%] max-w-xl 
                           max-h-[60vh] shadow-lg relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                    onClick={onClose}
                >
                    ✖
                </button>
                {children}
            </div>
        </div>
    );
};

export { DailyLog, DailyLogModal }