"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define an interface for your user actions.
interface UserAction {
    action_id: number;
    action_name?: string;
    category_name?: string;
    added_to_tracking_on?: string;
    intent?: string;
    selected_action_id: number | null;
    pendingAdd?: boolean;
    group_category?: boolean;
    originalGroupCategory?: boolean;
    dbSelectedActionId?: number;
}

// Props interface for SelectedActionsTable.
interface SelectedActionsTableProps {
    actions: UserAction[];
    onRemoveAction: (action: UserAction) => void;
    onToggleGroupCategory: (action: UserAction, checked: boolean) => void;
}

// Component for Selected Actions Table.
const SelectedActionsTable: React.FC<SelectedActionsTableProps> = ({
    actions,
    onRemoveAction,
    onToggleGroupCategory,
}) => {
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
        <div className="h-full overflow-auto">
            <table className="w-full min-w-[500px]">
                <thead className="sticky top-0 z-20 bg-background">
                    <tr className="border-b-2 border-border">
                        <th className="pr-3 py-2 text-left text-xs font-semibold text-foreground">Action</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-foreground">Added On</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-foreground">Intent</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-foreground">Group</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-foreground w-12">Remove</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedCategories.map((cat) => (
                        <React.Fragment key={cat}>
                            <tr className="sticky top-[33px] z-10 bg-background border-b-2 border-border">
                                <td
                                    colSpan={5}
                                    className="py-2 text-xs font-light text-muted-foreground"
                                >
                                    {cat}
                                </td>
                            </tr>
                            {grouped[cat].map((action) => (
                                <tr
                                    key={action.selected_action_id ? action.selected_action_id : action.action_id}
                                    className="hover:bg-muted/20 transition-colors"
                                >
                                    <td className="px-3 py-2 align-middle">
                                        <div className="text-sm text-foreground">
                                            {action.action_name || "N/A"}
                                            {(action.pendingAdd || (action.group_category !== action.originalGroupCategory)) && (
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
                                            <button
                                                onClick={() => onRemoveAction(action)}
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
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
};

// Props interface for UnselectedActionsTable.
interface UnselectedActionsTableProps {
    actions: UserAction[];
    onAddAction: (action: UserAction) => void;
}

// Component for Unselected Actions Table.
const UnselectedActionsTable: React.FC<UnselectedActionsTableProps> = ({ actions, onAddAction }) => {
    // Group actions by category
    const grouped = actions.reduce<Record<string, UserAction[]>>((acc, action) => {
        const cat = action.category_name || "Uncategorized";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(action);
        return acc;
    }, {});

    const sortedCategories = Object.keys(grouped).sort();

    return (
        <div className="h-full overflow-auto">
            <table className="w-full min-w-[350px]">
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
                                    className="hover:bg-muted/20 transition-colors"
                                >
                                    <td className="px-3 py-2 align-middle">
                                        <div className="text-sm text-foreground">
                                            {action.action_name || "N/A"}
                                            {(action.pendingAdd || action.dbSelectedActionId) && (
                                                <span className="text-orange-500 ml-1">*</span>
                                            )}
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
                                            <button
                                                onClick={() => onAddAction(action)}
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
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
};

export type { UserAction };
export { SelectedActionsTable, UnselectedActionsTable };
