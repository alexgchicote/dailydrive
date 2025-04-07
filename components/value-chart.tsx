"use client"
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { DayKpi } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Props for the Chart component
interface ChartProps {
  kpi: DayKpi[];
  selectedDate: string | null;
  dayScore: number;
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ValueChart({ kpi, selectedDate, dayScore }: ChartProps) {

  // Determine score color based on the value
  const getScoreColor = (score: number) => {
    if (score === 1) return { light: "#4ade80", dark: "#15803d" }; // green-400/700
    if (score > 0.6) return { light: "#facc15", dark: "#a16207" }; // yellow-400/700
    return { light: "#f87171", dark: "#b91c1c" }; // red-400/700
};

  // Get the appropriate color for the dot based on dayScore
  const dotColor = getScoreColor(dayScore);


  // Function to render dots only for the selected date
  const renderDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    
    // Skip if no selected date
    if (!selectedDate) {
      return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
    }
    
    // Convert both to ISO date strings for comparison
    // log_date is a Date object, selectedDate is a string
    const payloadDateStr = payload.log_date instanceof Date 
      ? payload.log_date.toISOString().split('T')[0] 
      : String(payload.log_date);
    
    // Compare the dates
    if (payloadDateStr === selectedDate) {
      return (
        <circle 
          key={`dot-${index}`}
          cx={cx} 
          cy={cy} 
          r={4} 
          fill={dotColor.dark}
          strokeWidth={2} 
        />
      );
    }
    
    // Return an empty/invisible dot for other points
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart
          accessibilityLayer
          data={kpi}
          margin={{
            top: 5,
            left: 12,
            right: 12,
            bottom: 5
          }}
          width={500}
          height={100}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="log_date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("en-GB", { month: "short", day: "numeric" })
            }
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel/>}
          />
          <Line
            dataKey="cumulative_gain"
            type="linear"
            stroke="var(--color-desktop)"
            strokeWidth={2}
            dot={selectedDate ? renderDot : false}
            activeDot={{ 
              r: 4, 
              fill: dotColor.light, 
              stroke: "white", 
              strokeWidth: 2 
            }}
          />
        </LineChart>
      </ChartContainer>
    </ResponsiveContainer>
  )
}