"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";

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
        <table className="min-w-full rounded overflow-hidden bg-gray-50 dark:bg-gray-800 mb-8">
            <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Date Added</th>
                    <th className="px-4 py-2 text-left">Intent</th>
                    <th className="px-4 py-2 text-center">Group w. Category</th>
                    <th className="px-4 py-2 text-center">Remove</th>
                </tr>
            </thead>
            <tbody>
                {sortedCategories.map((cat) => (
                    <React.Fragment key={cat}>
                        <tr>
                            <td
                                colSpan={6}
                                className="px-4 py-2 font-bold text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700"
                            >
                                {cat}
                            </td>
                        </tr>
                        {grouped[cat].map((action) => (
                            <tr
                                key={action.selected_action_id ? action.selected_action_id : action.action_id}
                                className="border-b border-gray-200 dark:border-gray-700"
                            >
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.action_name || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.action_id || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.added_to_tracking_on
                                        ? new Date(action.added_to_tracking_on).toLocaleDateString("en-GB")
                                        : "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.intent || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <Switch
                                        id={`group-category-${action.action_id}`}
                                        checked={!!action.group_category}
                                        onCheckedChange={(checked: boolean) => onToggleGroupCategory(action, checked)}
                                    />
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => onRemoveAction(action)}
                                        className="bg-red-600 text-white px-2 py-1 rounded"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
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
        <table className="min-w-full rounded overflow-hidden bg-gray-50 dark:bg-gray-800 mb-8">
            <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Intent</th>
                    <th className="px-4 py-2 text-center">Add</th>
                </tr>
            </thead>
            <tbody>
                {sortedCategories.map((cat) => (
                    <React.Fragment key={cat}>
                        <tr>
                            <td
                                colSpan={5}
                                className="px-4 py-2 font-bold text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700"
                            >
                                {cat}
                            </td>
                        </tr>
                        {grouped[cat].map((action) => (
                            <tr
                                key={action.action_id}
                                className="border-b border-gray-200 dark:border-gray-700"
                            >
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.action_name || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.action_id || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.category_name || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                    {action.intent || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => onAddAction(action)}
                                        className="bg-green-600 text-white px-2 py-1 rounded"
                                    >
                                        Add
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );
};

export type { UserAction };
export { SelectedActionsTable, UnselectedActionsTable };
