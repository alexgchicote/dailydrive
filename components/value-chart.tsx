"use client"
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
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
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ValueChart({ kpi, selectedDate }: ChartProps) {
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
          fill="var(--color-desktop)" 
          stroke="white" 
          strokeWidth={2} 
        />
      );
    }
    
    // Return an empty/invisible dot for other points
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
  };

  return (
    <CardContent>
      <ChartContainer config={chartConfig}>
        <LineChart
          accessibilityLayer
          data={kpi}
          margin={{
            left: 12,
            right: 12,
          }}
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
            activeDot={{ r: 4, fill: "var(--color-desktop)", stroke: "white", strokeWidth: 2 }}
          />
        </LineChart>
      </ChartContainer>
    </CardContent>
  )
}