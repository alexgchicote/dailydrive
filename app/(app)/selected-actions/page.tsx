"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { UserAction, SelectedActionsTable, UnselectedActionsTable } from "@/components/selected-actions";

const SelectedActionsPage: React.FC = () => {
    const router = useRouter();
    const supabase = createClient();

    // Local state for actions, loading, pending removals, and userId.
    const [userActions, setUserActions] = useState<UserAction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [pendingRemovals, setPendingRemovals] = useState<number[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // RPC call to fetch a flat list of user actions.
    const fetchUserActions = async (uid: string): Promise<void> => {
        console.log("Fetching user actions for user:", uid);
        const { data, error } = await supabase.rpc("get_user_actions", { uid });
        if (error) {
            console.error("Error fetching user actions:", error);
        } else if (data) {
            console.log("Fetched user actions:", data);
            // Map each row to include a new property 'dbSelectedActionId' and store original group_category.
            const mappedData: UserAction[] = (data as any[]).map((row) => ({
                ...row,
                dbSelectedActionId: row.selected_action_id,
                originalGroupCategory: row.group_category,
            }));
            setUserActions(mappedData || []);
        }
    };

    // On mount, check session and fetch user actions.
    useEffect(() => {
        (async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log("Session response:", session, "Error:", error);
            if (error || !session) {
                router.push("/sign-in");
            } else {
                console.log("User ID:", session.user.id);
                setUserId(session.user.id);
                await fetchUserActions(session.user.id);
                setLoading(false);
            }
        })();
    }, [router]);

    // Derive selected and unselected actions.
    const selectedActions = userActions.filter(
        (action) => action.selected_action_id !== null || action.pendingAdd
    );
    const unselectedActions = userActions.filter(
        (action) => action.selected_action_id === null && !action.pendingAdd
    );

    // Handler to add an unselected action locally.
    const handleAddAction = (action: UserAction): void => {
        setUserActions((prev) =>
            prev.map((a) => {
                if (a.action_id === action.action_id) {
                    // If this action was previously removed (has a dbSelectedActionId in pendingRemovals),
                    // remove it from pendingRemovals and restore the original ID.
                    if (a.dbSelectedActionId && pendingRemovals.includes(a.dbSelectedActionId)) {
                        setPendingRemovals((prevRemovals) =>
                            prevRemovals.filter((id) => id !== a.dbSelectedActionId)
                        );
                        return {
                            ...a,
                            pendingAdd: false,
                            selected_action_id: a.dbSelectedActionId, // restore original DB id
                            added_to_tracking_on: a.added_to_tracking_on, // restore original date
                        };
                    }
                    // Otherwise, mark it as pending add with a temporary selected_action_id.
                    return {
                        ...a,
                        pendingAdd: true,
                        selected_action_id: Date.now(), // temporary id
                        added_to_tracking_on: new Date().toISOString(),
                    };
                }
                return a;
            })
        );
    };

    // Handler to remove an action locally.
    const handleRemoveAction = (action: UserAction): void => {
        setUserActions((prev) =>
            prev.map((a) =>
                a.action_id === action.action_id 
                    ? { 
                        ...a, 
                        pendingAdd: false, 
                        selected_action_id: null 
                    } : a
            )
        );
        if (action.dbSelectedActionId !== undefined) {
            setPendingRemovals((prev) => [...prev, action.dbSelectedActionId!]);
        }
    };

    // Handler for toggling the group category switch.
    const handleToggleGroupCategory = (action: UserAction, checked: boolean): void => {
        setUserActions((prev) =>
            prev.map((a) =>
                a.action_id === action.action_id ? { ...a, group_category: checked } : a
            )
        );
    };

    // Handler to save pending changes.
    const handleSaveChanges = async (): Promise<void> => {
        if (!userId) return;

        // Process pending additions.
        const pendingAdditions = userActions.filter((action) => action.pendingAdd);
        if (pendingAdditions.length > 0) {
            const insertData = pendingAdditions.map((action) => ({
                user_id: userId,
                action_id: action.action_id.toString(),
                added_to_tracking_on: action.added_to_tracking_on,
                removed_from_tracking_on: null,
                group_category: action.group_category,
            }));
            const { error: insertError } = await supabase
                .from("selected_actions")
                .insert(insertData);
            if (insertError) {
                console.error("Error inserting pending additions:", insertError);
            }
        }

        // Process pending removals.
        if (pendingRemovals.length > 0) {
            const removalTimestamp = new Date().toISOString();
            const { error: updateError } = await supabase
                .from("selected_actions")
                .update({ removed_from_tracking_on: removalTimestamp })
                .in("selected_action_id", pendingRemovals);
            if (updateError) {
                console.error("Error updating pending removals:", updateError);
            }
        }

        // Process group category changes for actions that already existed in the DB.
        // TODO: should this insert a new selected action and remove the existing one? I feel like it should?  but maybe not
        const groupCategoryChanges = userActions.filter(
            (action) =>
                action.selected_action_id !== null &&
                action.dbSelectedActionId &&
                action.group_category !== action.originalGroupCategory
        );
        if (groupCategoryChanges.length > 0) {
            await Promise.all(
                groupCategoryChanges.map((action) =>
                    supabase
                        .from("selected_actions")
                        .update({ group_category: action.group_category })
                        .eq("selected_action_id", action.dbSelectedActionId)
                )
            );
        }

        // Refresh the data from the database.
        await fetchUserActions(userId);
        setPendingRemovals([]);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 flex-col flex mx-auto">
            {/* Dashboard Header */}
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Edit Actions to Track</h1>
                <div className="flex gap-4">
                    <button
                        onClick={handleSaveChanges}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="bg-purple-600 text-white px-4 py-2 rounded"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </header>

            {/* Selected Actions */}
            <h2 className="text-xl font-semibold mb-4">Your Selected Actions</h2>
            <SelectedActionsTable
                actions={selectedActions.filter((action) => action.selected_action_id !== null)}
                onRemoveAction={handleRemoveAction}
                onToggleGroupCategory={handleToggleGroupCategory}
            />

            {/* Unselected Actions */}
            <h2 className="text-xl font-semibold mb-4">Available Actions</h2>
            <UnselectedActionsTable 
                actions={unselectedActions} 
                onAddAction={handleAddAction} 
            />
        </div>
    );
};

export default SelectedActionsPage;