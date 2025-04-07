"use client";
import React from "react";
import { Circle, CircleCheck, CircleX } from "lucide-react";
import { UserHistoryLogEntry } from "@/types";

interface DayActionsProps {
  dayActions: UserHistoryLogEntry[];
}

type Outcome = "positive" | "neutral" | "negative";

const order: Record<Outcome, number> = {
  positive: 0,
  neutral: 1,
  negative: 2,
};

export function DayActions({dayActions}: DayActionsProps) {
  // Group logs by category for sorting but display in a single table
  const groupedLogs = dayActions.reduce((groups: Record<string, typeof dayActions>, log) => {
    const category = log.category_name;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(log);
    return groups;
  }, {} as Record<string, typeof dayActions>);

  // Prepare all actions sorted by category and then by outcome, with category information preserved
  const allSortedActions = Object.entries(groupedLogs).flatMap(([category, actions]) => {
    const sortedCategoryActions = [...actions].sort((a, b) => {
      const outcomeA: Outcome = a.outcome as Outcome;
      const outcomeB: Outcome = b.outcome as Outcome;
      return order[outcomeA] - order[outcomeB];
    });
    
    // Add category information to each action for border handling
    return sortedCategoryActions.map((action, index) => ({
      ...action,
      _meta: {
        isFirstInCategory: index === 0,
        isLastInCategory: index === sortedCategoryActions.length - 1,
        category
      }
    }));
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="shadow-[0_4px_12px_theme(colors.gray.300)] dark:shadow-[4px_4px_4px_theme(colors.zinc.800)] rounded-lg">
        {/* Single Table for All Actions */}
        <table className="min-w-full table-fixed">
          <tbody>
            {allSortedActions.map((action) => (
              <React.Fragment key={action.selected_action_id}>
                {/* Action Row */}
                <tr className={`${
                  // No border if it has notes
                  action.notes ? 'border-b-0' : 
                  // Only add bottom border if it's the last in its category
                  action._meta.isLastInCategory ? 'border-b' : ''
                } ${
                  // Add top border only for the first item in a category
                  action._meta.isFirstInCategory ? 'border-t' : ''
                } border-zinc-800 dark:border-zinc-600`}>
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
                  <tr className={`${
                    // Add bottom border if it's the last in its category
                    action._meta.isLastInCategory ? 'border-b' : ''
                  } border-zinc-800 dark:border-zinc-600`}>
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
    </div>
  );
}

export default DayActions;