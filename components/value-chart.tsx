"use client"

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

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

// Define a type for a log entry
interface DayEntry {
  log_date: Date;
  cumulative_gain: number;
  day_contribution: number;
  day_grade: number;
}

// Props for the Chart component
interface ChartProps {
  userId: string;
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartVisual({ userId }: ChartProps) {
  const supabase = createClient();

  // User Days
  const [kpi, setKpi] = useState<DayEntry[]>([]);

  const fetchkpi = async (uid: string) => {
    console.log("Fetching KPIs for user:", uid);

    const { data, error } = await supabase.rpc("get_user_day_kpis", { uid });

    if (error) {
      console.error("Error fetching user's KPIs:", error);
    } else {
      console.log("Fetched user's KPIs:", data);

      setKpi(
        data.map((day: { 
          log_date: string; 
          cumulative_gain: number;
          day_contribution: number;
          day_grade: number;
         }) => ({
          log_date: new Date(day.log_date),
          cumulative_gain: day.cumulative_gain,
          day_contribution: day.day_contribution,
          day_grade: day.day_grade,
        }))
      );
    }
  };

  // useEffect to fetch logs when userId changes.
  useEffect(() => {
    if (userId) {
      fetchkpi(userId);
    }
  }, [userId]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Value</CardTitle>
        <CardDescription>PLACEHOLDER: January - June 2024</CardDescription>
      </CardHeader>
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
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
