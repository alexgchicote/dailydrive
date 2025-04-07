"use client";
import React from "react";
import { Circle, CircleCheck, CircleX } from "lucide-react";
import { UserHistoryLogEntry } from "@/types";

interface DayActionsDepthProps {
  dayActions: UserHistoryLogEntry[];
}

type Outcome = "positive" | "neutral" | "negative";

const order: Record<Outcome, number> = {
    positive: 0,
    neutral: 1,
    negative: 2,
};

export function DayActionsDepth({dayActions}: DayActionsDepthProps) {

    // Group logs by category.
    const groupedLogs = dayActions.reduce((groups: Record<string, typeof dayActions>, log) => {
        const category = log.category_name;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(log);
        return groups;
    }, {} as Record<string, typeof dayActions>);

    return (
        <div className="flex-1 overflow-y-auto space-y-6">
            {Object.entries(groupedLogs).map(([category, actions]) => {
                const sortedActions = [...actions].sort((a, b) => {
                    const outcomeA: Outcome = a.outcome as Outcome;
                    const outcomeB: Outcome = b.outcome as Outcome;
                    return order[outcomeA] - order[outcomeB];
                });

                return (
                    <div key={category} className="shadow-[0_4px_12px_theme(colors.gray.300)] dark:shadow-[4px_4px_4px_theme(colors.zinc.800)]">
                        {/* Category Header */}
                        <div className="bg-gray-200 dark:bg-gray-900 px-4 py-2 rounded-t-lg">
                            <span className="text-sm dark:text-gray-400">{category}</span>
                        </div>
                        {/* Table */}
                        <table className="min-w-full table-fixed">
                            <tbody>
                                {sortedActions.map((action) => (
                                    <React.Fragment key={action.selected_action_id}>
                                        {/* Action Row */}
                                        <tr className={`${action.notes ? 'border-b-0' : 'border-b'} border-zinc-800 dark:border-zinc-600`}>
                                            <td className="w-6 px-4 py-2 align-middle">
                                                {action.outcome === "positive" ? (
                                                    <CircleCheck className="text-green-600" />
                                                ) : action.outcome === "negative" ? (
                                                    <CircleX className="text-red-600" />
                                                ) : (
                                                    <Circle className="text-yellow-600" />
                                                )}
                                            </td>
                                            <td className="text-left py-2 align-middle">{action.action_name}</td>
                                        </tr>
                                        {action.notes && (
                                            <tr className="border-b border-zinc-800 dark:border-zinc-600">
                                                <td className="w-6 px-4" />
                                                <td className="text-left text-sm italic text-gray-700 dark:text-gray-300 pb-1">
                                                    {action.notes}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
};

export default DayActionsDepth;