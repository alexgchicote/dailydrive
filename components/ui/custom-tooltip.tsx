// CustomTooltip.tsx
"use client";

import React from "react";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  // Use the first payload item
  const item = payload[0];
  // Get the color from the payload (either stroke or fill)
  const color = item.stroke || item.fill || "#000";
  const value = item.value;

  return (
    <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 shadow rounded">
      {/* Colored icon square */}
      <div
        className="w-3 h-3 rounded"
        style={{ backgroundColor: color }}
      />
      {/* Text label and value on one line */}
      <span className="font-medium text-gray-900 dark:text-gray-100">
        Cumulative Gain {value}
      </span>
    </div>
  );
};

export default CustomTooltip;
