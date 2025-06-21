"use client"; // This is a client component

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { UserAction, SelectedActionsTable, UnselectedActionsTable } from "@/components/selected-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Save, ArrowLeft } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Checkbox } from "@/components/ui/checkbox";

// Move CustomActionDialog outside the main component
const CustomActionDialog = React.memo(({
    newAction,
    setNewAction,
    categories,
    categoryData,
    onClose,
    onCreate
}: {
    newAction: {
        action_name: string;
        category_name: string;
        category_id: number | null;
        intent: "engage" | "avoid";
        isNewCategory: boolean;
        addToSelected: boolean;
    };
    setNewAction: (action: any) => void;
    categories: string[];
    categoryData: Array<{ category_id: number; category_name: string }>;
    onClose: () => void;
    onCreate: () => void;
}) => {
    type ActionState = typeof newAction;

    // Memoize handlers to prevent infinite recursion
    const handleActionNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAction((prev: ActionState) => ({ ...prev, action_name: e.target.value }));
    }, [setNewAction]);

    const handleCategoryChange = React.useCallback((value: string) => {
        // Find the category data for the selected category name
        const selectedCategory = categoryData.find(cat => cat.category_name === value);
        if (!selectedCategory) {
            console.error("Selected category not found in category data");
            return;
        }

        setNewAction((prev: ActionState) => ({ 
            ...prev, 
            category_name: value,
            category_id: selectedCategory.category_id,
            isNewCategory: false 
        }));
    }, [setNewAction, categoryData]);

    const handleIntentChange = React.useCallback((value: "engage" | "avoid") => {
        setNewAction((prev: ActionState) => ({ ...prev, intent: value }));
    }, [setNewAction]);

    const handleNewCategoryChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAction((prev: ActionState) => ({ 
            ...prev, 
            category_name: e.target.value,
            category_id: null // Will be set when creating the category
        }));
    }, [setNewAction]);

    const toggleNewCategory = React.useCallback(() => {
        setNewAction((prev: ActionState) => ({ 
            ...prev, 
            isNewCategory: !prev.isNewCategory, 
            category_name: "",
            category_id: null
        }));
    }, [setNewAction]);

    const handleAddToSelectedChange = React.useCallback((checked: boolean) => {
        setNewAction((prev: ActionState) => ({ 
            ...prev, 
            addToSelected: checked 
        }));
    }, [setNewAction]);

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Custom Action</DialogTitle>
            </DialogHeader>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onCreate();
                }}
                className="space-y-4 py-4"
            >
                <div className="space-y-2">
                    <label htmlFor="action-name">Action Name</label>
                    <Input
                        id="action-name"
                        value={newAction.action_name}
                        onChange={handleActionNameChange}
                        placeholder="Enter action name"
                    />
                </div>
                <div className="space-y-2">
                    <label>Category</label>
                    <div className="flex gap-2">
                        {!newAction.isNewCategory ? (
                            <select
                                value={newAction.category_name}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                value={newAction.category_name}
                                onChange={handleNewCategoryChange}
                                placeholder="Enter new category name"
                            />
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={toggleNewCategory}
                        >
                            {newAction.isNewCategory ? "Select Existing" : "Create New"}
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label>Intent</label>
                    <select
                        value={newAction.intent}
                        onChange={(e) => handleIntentChange(e.target.value as "engage" | "avoid")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">Select intent</option>
                        <option value="engage">Engage</option>
                        <option value="avoid">Avoid</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="add-to-selected"
                        checked={newAction.addToSelected}
                        onCheckedChange={handleAddToSelectedChange}
                    />
                    <label
                        htmlFor="add-to-selected"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Add to selected actions
                    </label>
                </div>
                <Button
                    type="submit"
                    className="w-full"
                    disabled={!newAction.action_name || !newAction.category_name}
                >
                    Create Action
                </Button>
            </form>
        </DialogContent>
    );
});

const SelectedActionsPage: React.FC = () => {
    const router = useRouter();
    const supabase = createClient();

    // Local state for actions, loading, pending removals, and userId.
    const [userActions, setUserActions] = useState<UserAction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [pendingRemovals, setPendingRemovals] = useState<number[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [showCustomActionDialog, setShowCustomActionDialog] = useState(false);
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
            action.group_category !== action.originalGroupCategory
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
                originalGroupCategory: row.group_category,
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
        
        // Only add to pendingRemovals if this action was actually saved to the database
        // (i.e., it has a dbSelectedActionId and wasn't just a pendingAdd)
        if (action.dbSelectedActionId !== undefined && !action.pendingAdd) {
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

            // Start a transaction
            const { data, error } = await supabase.rpc('create_custom_action', {
                p_user_id: userId,
                p_action_name: newAction.action_name,
                p_category_name: newAction.category_name,
                p_category_id: newAction.isNewCategory ? null : newAction.category_id,
                p_intent: newAction.intent,
                p_add_to_selected: newAction.addToSelected
            });

            if (error) throw error;

            // If we get here, everything succeeded
            toast.success("Custom action created successfully");
            
            // Reset form and refresh data
            setNewAction({
                action_name: "",
                category_name: "",
                category_id: null,
                intent: "engage",
                isNewCategory: false,
                addToSelected: true
            });
            setShowCustomActionDialog(false);
            await fetchUserActions(userId);
            await fetchCategories(userId);

        } catch (error) {
            console.error("Error creating custom action:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create custom action");
        }
    }, [userId, newAction, supabase, fetchUserActions, fetchCategories, userActions, categories]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="h-screen flex flex-col">
            <Toaster position="top-center" />
            {/* Header */}
            <header className="flex justify-between items-center p-8 pb-4 flex-shrink-0">
                <h1 className="text-3xl font-bold">Manage Your Actions</h1>
                <div className="flex gap-4">
                    {hasPendingChanges() && (
                        <Button
                            onClick={handleSaveChanges}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    )}
                    <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8 px-4 md:px-8 pb-4 md:pb-8 min-h-0">
                {/* Selected Actions */}
                <Card className="flex flex-col min-h-[350px] md:min-h-[400px]">
                    <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 pb-4">
                        <CardTitle className="text-lg md:text-xl">Your Selected Actions</CardTitle>
                        <Dialog open={showCustomActionDialog} onOpenChange={setShowCustomActionDialog}>
                            <DialogTrigger asChild>
                                <Button className="text-xs md:text-sm">
                                    <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                    <span className="hidden sm:inline">Create Custom Action</span>
                                    <span className="sm:hidden">Create</span>
                                </Button>
                            </DialogTrigger>
                            <CustomActionDialog
                                newAction={newAction}
                                setNewAction={setNewAction}
                                categories={categories}
                                categoryData={categoryData}
                                onClose={() => setShowCustomActionDialog(false)}
                                onCreate={handleCreateCustomAction}
                            />
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 p-3 md:p-6">
                        <SelectedActionsTable
                            actions={selectedActions.filter((action) => action.selected_action_id !== null)}
                            onRemoveAction={handleRemoveAction}
                            onToggleGroupCategory={handleToggleGroupCategory}
                        />
                    </CardContent>
                </Card>

                {/* Available Actions */}
                <Card className="flex flex-col min-h-[350px] md:min-h-[400px]">
                    <CardHeader className="flex-shrink-0 pb-4">
                        <CardTitle className="text-lg md:text-xl">Available Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 p-3 md:p-6">
                        <UnselectedActionsTable
                            actions={unselectedActions}
                            onAddAction={handleAddAction}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SelectedActionsPage;