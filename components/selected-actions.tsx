"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Undo, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define an interface for your user actions.
interface UserAction {
    action_id: number;
    action_name?: string;
    category_name?: string;
    added_to_tracking_on?: string;
    intent?: string;
    selected_action_id: number | null;
    pendingAdd?: boolean;
    pendingRemoval?: boolean;
    group_category?: boolean;
    originalGroupCategory?: boolean;
    dbSelectedActionId?: number;
}

// Props interface for SelectedActionsTable.
interface SelectedActionsTableProps {
    actions: UserAction[];
    onRemoveAction: (action: UserAction) => void;
    onUndoRemoval?: (action: UserAction) => void;
    onToggleGroupCategory: (action: UserAction, checked: boolean) => void;
    onAddActionsForCategory?: (category: string) => void;
    hasPendingChanges: boolean;
    saving: boolean;
    onSaveChanges: () => void;
    onAddActions: () => void;
}

// Component for Selected Actions Table.
function SelectedActionsTable({
    actions,
    onRemoveAction,
    onUndoRemoval,
    onToggleGroupCategory,
    onAddActionsForCategory,
    hasPendingChanges,
    saving,
    onSaveChanges,
    onAddActions,
}: SelectedActionsTableProps) {
    // Group actions by category (using category_name, fallback "Uncategorized")
    const grouped = actions.reduce<Record<string, UserAction[]>>((acc, action) => {
        const cat = action.category_name || "Uncategorized";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(action);
        return acc;
    }, {});

    // Sort categories alphabetically
    const sortedCategories = Object.keys(grouped).sort();

    return (
        <Card className="max-h-[calc(100vh-200px)] min-h-[400px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0 px-3 md:px-6">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Selected Actions</CardTitle>
                    <div className="flex items-center gap-2">
                        {hasPendingChanges && (
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={onSaveChanges}
                                    disabled={saving}
                                    size="sm"
                                    className="bg-purple-300/40 dark:bg-purple-800/40 hover:bg-purple-400/40 dark:hover:bg-purple-700/40 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700"
                                >
                                    <Save className="w-4 h-4" />
                                    <span className="hidden sm:ml-2 sm:inline">
                                        {saving ? "Saving..." : "Save Changes"}
                                    </span>
                                </Button>
                            </div>
                        )}
                        <Button
                            onClick={onAddActions}
                            size="sm"
                            variant="outline"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:ml-2 sm:inline">Add Actions</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 px-3 md:px-6">
                <div className="overflow-auto max-h-[calc(100vh-320px)]">
                    <table className="w-full min-w-[400px]">
            <thead className="sticky top-0 z-20 bg-background">
                <tr className="border-b-2 border-border border-l-2 border-l-transparent">
                    <th className="pr-3 py-2 text-left text-xs font-semibold text-foreground">Action</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-foreground">Tracking Since</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-foreground">Intent</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-foreground">Group</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-foreground w-12">Remove</th>
                </tr>
            </thead>
            <tbody>
                    {sortedCategories.map((cat) => (
                        <React.Fragment key={cat}>
                            <tr className="sticky top-[33px] z-10 bg-background border-b-2 border-border border-l-2 border-l-transparent">
                                <td
                                    colSpan={5}
                                    className="py-2 text-sm text-gray-600 dark:text-gray-400 font-thin text-muted-foreground"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{cat}</span>
                                        {onAddActionsForCategory && (
                                            <button
                                                onClick={() => onAddActionsForCategory(cat)}
                                                className="p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm group focus:outline-none bg-gray-200/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-green-400/40 hover:dark:bg-green-700/40 hover:text-green-600 hover:dark:text-green-400"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            {grouped[cat].map((action) => (
                                <tr
                                    key={action.selected_action_id ? action.selected_action_id : action.action_id}
                                    className={`hover:bg-muted/20 transition-colors relative z-0 ${
                                        action.pendingRemoval 
                                            ? "border-l-2 border-l-red-500" 
                                            : action.pendingAdd 
                                                ? "border-l-2 border-l-green-500" 
                                                : ""
                                    }`}
                                >
                                    <td className="px-3 py-2 align-middle">
                                        <div className="text-sm text-foreground">
                                            {action.action_name || "N/A"}
                                            {(action.dbSelectedActionId && !action.pendingAdd && Boolean(action.group_category) !== Boolean(action.originalGroupCategory)) && (
                                                <span className="text-orange-500 ml-1">*</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center align-middle">
                                        <div className="text-xs text-muted-foreground">
                                            {action.added_to_tracking_on
                                                ? new Date(action.added_to_tracking_on).toLocaleDateString("en-GB")
                                                : "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center align-middle">
                                        <div className="flex justify-center items-center">
                                            <Badge 
                                                variant={action.intent === "engage" ? "default" : "secondary"}
                                                className={`text-xs ${action.intent === "engage" 
                                                    ? "bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/20" 
                                                    : "bg-red-100 text-red-700 dark:bg-red-800/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/20"
                                                }`}
                                            >
                                                {action.intent || "N/A"}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center align-middle">
                                        <div className="flex justify-center items-center">
                                            <Checkbox
                                                id={`group-category-${action.action_id}`}
                                                checked={!!action.group_category}
                                                onCheckedChange={(checked: boolean) => onToggleGroupCategory(action, checked)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center align-middle">
                                        <div className="flex justify-center items-center">
                                            {action.pendingRemoval && onUndoRemoval ? (
                                                <button
                                                    onClick={() => onUndoRemoval(action)}
                                                    className="p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm group focus:outline-none bg-gray-200/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-green-400/40 hover:dark:bg-green-700/40 hover:text-green-600 hover:dark:text-green-400"
                                                    title="Undo removal"
                                                >
                                                    <Undo className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onRemoveAction(action)}
                                                    className="p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm group focus:outline-none bg-gray-200/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-red-400/40 hover:dark:bg-red-700/40 hover:text-red-600 hover:dark:text-red-400"
                                                    title="Remove action"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
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

// Props interface for AvailableActionsTable.
interface AvailableActionsTableProps {
    actions: UserAction[];
    onAddAction: (action: UserAction) => void;
    onUndoAdd?: (action: UserAction) => void;
}

// Component for Available Actions Table.
function AvailableActionsTable({ actions, onAddAction, onUndoAdd }: AvailableActionsTableProps) {
    // Group actions by category
    const grouped = actions.reduce<Record<string, UserAction[]>>((acc, action) => {
        const cat = action.category_name || "Uncategorized";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(action);
        return acc;
    }, {});

    const sortedCategories = Object.keys(grouped).sort();

    return (
        <div className="h-full">
            <table className="w-full min-w-[300px]">
                <thead className="sticky top-0 z-20 bg-background">
                    <tr className="border-b-2 border-border">
                        <th className="pr-3 py-2 text-left text-xs font-semibold text-foreground">Action</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-foreground">Intent</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-foreground w-12">Add</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedCategories.map((cat) => (
                        <React.Fragment key={cat}>
                            <tr className="sticky top-[33px] z-10 bg-background border-b-2 border-border">
                                <td
                                    colSpan={3}
                                    className="py-2 text-xs font-light text-muted-foreground"
                                >
                                    {cat}
                                </td>
                            </tr>
                            {grouped[cat].map((action) => (
                                <tr
                                    key={action.action_id}
                                    className={`hover:bg-muted/20 transition-colors relative z-0 ${
                                        action.pendingRemoval 
                                            ? "border-l-2 border-l-red-500" 
                                            : action.pendingAdd 
                                                ? "border-l-2 border-l-green-500" 
                                                : ""
                                    }`}
                                >
                                    <td className="px-3 py-2 align-middle">
                                        <div className="text-sm text-foreground">
                                            {action.action_name || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center align-middle">
                                        <div className="flex justify-center items-center">
                                            <Badge 
                                                variant={action.intent === "engage" ? "default" : "secondary"}
                                                className={`text-xs ${action.intent === "engage" 
                                                    ? "bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/20" 
                                                    : "bg-red-100 text-red-700 dark:bg-red-800/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/20"
                                                }`}
                                            >
                                                {action.intent || "N/A"}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center align-middle">
                                        <div className="flex justify-center items-center">
                                            {action.pendingAdd && onUndoAdd ? (
                                                <button
                                                    onClick={() => onUndoAdd(action)}
                                                    className="p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm group focus:outline-none bg-gray-200/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-red-400/40 hover:dark:bg-red-700/40 hover:text-red-600 hover:dark:text-red-400"
                                                    title="Undo addition"
                                                >
                                                    <Undo className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onAddAction(action)}
                                                    className="p-1 rounded-lg flex items-center justify-center transition-colors shadow-sm group focus:outline-none bg-gray-200/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:bg-green-400/40 hover:dark:bg-green-700/40 hover:text-green-600 hover:dark:text-green-400"
                                                    title="Add action"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Props interface for CustomActionDialog
interface CustomActionDialogProps {
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
}

// Props interface for AddActionsModal
interface AddActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    actions: UserAction[];
    onAddAction: (action: UserAction) => void;
    onUndoAdd?: (action: UserAction) => void;
    categoryFilter?: string;
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
    onCreateCustomAction: () => void;
}

// Custom Action Dialog Component
function CustomActionDialog({
    newAction,
    setNewAction,
    categories,
    categoryData,
    onClose,
    onCreate
}: CustomActionDialogProps) {
    type ActionState = typeof newAction;

    // Memoized handlers
    const handleActionNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAction((prev: ActionState) => ({ ...prev, action_name: e.target.value }));
    }, [setNewAction]);

    const handleCategoryChange = React.useCallback((value: string) => {
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
            category_id: null
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
                            <span className="hidden sm:inline">
                                {newAction.isNewCategory ? "Select Existing" : "Create New"}
                            </span>
                            <span className="sm:hidden">
                                {newAction.isNewCategory ? "Select" : "Create"}
                            </span>
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
}

// Add Actions Modal Component
function AddActionsModal({
    isOpen,
    onClose,
    actions,
    onAddAction,
    onUndoAdd,
    categoryFilter,
    newAction,
    setNewAction,
    categories,
    categoryData,
    onCreateCustomAction
}: AddActionsModalProps) {
    const [showCreateCustom, setShowCreateCustom] = useState(false);
    
    // Filter actions by category if specified
    const filteredActions = categoryFilter 
        ? actions.filter(action => action.category_name === categoryFilter)
        : actions;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col mx-4 sm:mx-6">
                <DialogHeader>
                    <DialogTitle>
                        Add Actions {categoryFilter && `- ${categoryFilter}`}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <div className="flex justify-between items-center flex-shrink-0">
                        <span className="text-sm text-muted-foreground">
                            {filteredActions.length} available actions
                        </span>
                        <Button
                            onClick={() => setShowCreateCustom(true)}
                            variant="outline"
                            size="sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:ml-2 sm:inline">Create Custom Action</span>
                        </Button>
                    </div>
                    
                    <div className="flex-1 min-h-0 overflow-auto pr-2">
                        <AvailableActionsTable
                            actions={filteredActions}
                            onAddAction={onAddAction}
                            onUndoAdd={onUndoAdd}
                        />
                    </div>
                </div>
                
                {showCreateCustom && (
                    <Dialog open={showCreateCustom} onOpenChange={setShowCreateCustom}>
                        <CustomActionDialog
                            newAction={newAction}
                            setNewAction={setNewAction}
                            categories={categories}
                            categoryData={categoryData}
                            onClose={() => setShowCreateCustom(false)}
                            onCreate={onCreateCustomAction}
                        />
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
}

export type { UserAction, AddActionsModalProps, CustomActionDialogProps };
export { SelectedActionsTable, AvailableActionsTable, AddActionsModal, CustomActionDialog };
