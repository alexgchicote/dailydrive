"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { UserAction, SelectedActionsTable, AddActionsModal } from "@/components/selected-actions";

import { Button } from "@/components/ui/button";
import { Plus, Save, ArrowLeft } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

function SelectedActionsPage() {
    const router = useRouter();
    const supabase = createClient();

    // Local state for actions, loading, pending removals, and userId.
    const [userActions, setUserActions] = useState<UserAction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [pendingRemovals, setPendingRemovals] = useState<number[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [showCustomActionDialog, setShowCustomActionDialog] = useState(false);
    const [showAddActionsModal, setShowAddActionsModal] = useState(false);
    const [addActionsCategoryFilter, setAddActionsCategoryFilter] = useState<string | undefined>(undefined);
    const [newAction, setNewAction] = useState({
        action_name: "",
        category_name: "",
        category_id: null as number | null,
        intent: "engage" as "engage" | "avoid",
        isNewCategory: false,
        addToSelected: true
    });
    const [categories, setCategories] = useState<string[]>([]);
    const [categoryData, setCategoryData] = useState<Array<{ category_id: number; category_name: string }>>([]);
    const [saving, setSaving] = useState(false);

    // Check if there are any pending changes
    const hasPendingChanges = () => {
        // Check for pending additions (actions marked as pendingAdd)
        const hasPendingAdditions = userActions.some(action => action.pendingAdd);
        
        // Check for pending removals (but exclude actions that were never saved to DB)
        const hasActualPendingRemovals = pendingRemovals.length > 0;
        
        // Check for group category changes on existing DB actions
        const hasGroupCategoryChanges = userActions.some(action =>
            action.dbSelectedActionId &&
            action.selected_action_id !== null && // Still selected
            Boolean(action.group_category) !== Boolean(action.originalGroupCategory)
        );
        
        return hasPendingAdditions || hasActualPendingRemovals || hasGroupCategoryChanges;
    };

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
                originalGroupCategory: Boolean(row.group_category),
                group_category: Boolean(row.group_category), // Normalize to boolean
            }));
            setUserActions(mappedData || []);
        }
    };

    const fetchCategories = async (uid: string) => {
        console.log("Fetching categories for user:", uid);
        const { data, error } = await supabase
            .from("actions_categories")
            .select("category_id, category_name")
            .or(`category_type.eq.predefined,created_by_id.eq.${uid}`)
            .order("category_name");

        if (error) {
            console.error("Error fetching categories:", error);
            console.error("Error details:", error.message, error.details, error.hint);
        } else if (data) {
            console.log("Raw fetched categories data:", data);
            // Store both category names and IDs
            setCategories(data.map(row => row.category_name));
            // Store the category data for later use
            setCategoryData(data);
        } else {
            console.log("No data returned from categories query");
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
                await fetchCategories(session.user.id);
                setLoading(false);
            }
        })();
    }, [router]);

    // Derive selected and unselected actions.
    const selectedActions = userActions.filter(
        (action) => action.selected_action_id !== null || action.pendingAdd || action.pendingRemoval
    );
    const unselectedActions = userActions.filter(
        (action) => (action.selected_action_id === null && !action.pendingRemoval) || action.pendingAdd
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
                        selected_action_id: action.pendingAdd ? null : a.selected_action_id, // Keep selected if not pending add
                        pendingRemoval: !action.pendingAdd // Mark for removal if not pending add
                    } : a
            )
        );
        
        // Only add to pendingRemovals if this action was actually saved to the database
        // (i.e., it has a dbSelectedActionId and wasn't just a pendingAdd)
        if (action.dbSelectedActionId !== undefined && !action.pendingAdd) {
            setPendingRemovals((prev) => [...prev, action.dbSelectedActionId!]);
        }
    };

    // Handler to undo removal of an action
    const handleUndoRemoval = (action: UserAction): void => {
        setUserActions((prev) =>
            prev.map((a) =>
                a.action_id === action.action_id
                    ? {
                        ...a,
                        pendingRemoval: false,
                        selected_action_id: a.dbSelectedActionId || a.selected_action_id
                    } : a
            )
        );
        
        // Remove from pendingRemovals if it was there
        if (action.dbSelectedActionId !== undefined) {
            setPendingRemovals((prev) => prev.filter(id => id !== action.dbSelectedActionId));
        }
    };

    // Handler to undo addition of an action
    const handleUndoAdd = (action: UserAction): void => {
        setUserActions((prev) =>
            prev.map((a) =>
                a.action_id === action.action_id
                    ? {
                        ...a,
                        pendingAdd: false,
                        selected_action_id: null,
                        added_to_tracking_on: undefined
                    } : a
            )
        );
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

        setSaving(true);
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
        setSaving(false);
    };

    // Memoize the create action handler
    const handleCreateCustomAction = React.useCallback(async () => {
        if (!userId || !newAction.action_name || !newAction.category_name) {
            toast.error("Missing required fields");
            return;
        }

        try {
            // First check for duplicate category name if creating new category
            if (newAction.isNewCategory) {
                const existingCategory = categories.find(
                    cat => cat.toLowerCase() === newAction.category_name.toLowerCase()
                );

                if (existingCategory) {
                    toast.error("A category with this name already exists");
                    return;
                }
            }

            // Then check for duplicate action name within the same category
            const existingAction = userActions.find(
                action => 
                    action.action_name && 
                    action.action_name.toLowerCase() === newAction.action_name.toLowerCase() &&
                    action.category_name?.toLowerCase() === newAction.category_name.toLowerCase()
            );

            if (existingAction) {
                toast.error("An action with this name already exists in this category");
                return;
            }

            // Create the action without adding to selected (we'll handle that locally)
            const { data, error } = await supabase.rpc('create_custom_action', {
                p_user_id: userId,
                p_action_name: newAction.action_name,
                p_category_name: newAction.category_name,
                p_category_id: newAction.isNewCategory ? null : newAction.category_id,
                p_intent: newAction.intent
            });

            if (error) throw error;

            // The RPC returns just the action_id (integer), not a full object
            const newActionId = data; // data is the returned action_id
            
            if (newActionId) {
                // Add the new action to local state using form data
                const newActionData: UserAction = {
                    action_id: newActionId,
                    action_name: newAction.action_name,
                    category_name: newAction.category_name,
                    intent: newAction.intent,
                    selected_action_id: newAction.addToSelected ? Date.now() : null, // temporary id if adding to selected
                    pendingAdd: newAction.addToSelected,
                    pendingRemoval: false,
                    group_category: false,
                    originalGroupCategory: false,
                    added_to_tracking_on: newAction.addToSelected ? new Date().toISOString() : undefined,
                    dbSelectedActionId: undefined
                };

                // Add to userActions state
                setUserActions(prev => [...prev, newActionData]);
            }

            // Refresh categories in case a new one was created
            await fetchCategories(userId);

            toast.success("Custom action created successfully");
            
            // Reset form
            setNewAction({
                action_name: "",
                category_name: "",
                category_id: null,
                intent: "engage",
                isNewCategory: false,
                addToSelected: true
            });

        } catch (error) {
            console.error("Error creating custom action:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create custom action");
        }
    }, [userId, newAction, supabase, fetchUserActions, fetchCategories, userActions, categories]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex flex-col">
            <Toaster position="top-center" />
            {/* Header */}
            <header className="flex justify-between items-center p-8 pb-4 flex-shrink-0">
                <h1 className="text-3xl font-bold">Manage Your Actions</h1>
                <Button
                    onClick={() => router.push("/dashboard")}
                    variant="outline"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </header>

            <div className="flex-1 px-4 md:px-8 pb-4 md:pb-8 min-h-0">
                {/* Selected Actions */}
                <SelectedActionsTable
                    actions={selectedActions.filter((action) => action.selected_action_id !== null || action.pendingRemoval)}
                    onRemoveAction={handleRemoveAction}
                    onUndoRemoval={handleUndoRemoval}
                    onToggleGroupCategory={handleToggleGroupCategory}
                    onAddActionsForCategory={(category) => {
                        setAddActionsCategoryFilter(category);
                        setShowAddActionsModal(true);
                    }}
                    hasPendingChanges={hasPendingChanges()}
                    saving={saving}
                    onSaveChanges={handleSaveChanges}
                    onAddActions={() => setShowAddActionsModal(true)}
                />
                
                {/* Add Actions Modal */}
                <AddActionsModal
                    isOpen={showAddActionsModal}
                    onClose={() => {
                        setShowAddActionsModal(false);
                        setAddActionsCategoryFilter(undefined);
                    }}
                    actions={unselectedActions}
                    onAddAction={handleAddAction}
                    onUndoAdd={handleUndoAdd}
                    categoryFilter={addActionsCategoryFilter}
                    newAction={newAction}
                    setNewAction={setNewAction}
                    categories={categories}
                    categoryData={categoryData}
                    onCreateCustomAction={handleCreateCustomAction}
                />
            </div>
        </div>
    );
}

export default SelectedActionsPage;