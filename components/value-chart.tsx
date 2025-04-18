"use client"
import { CartesianGrid, Line, LineChart, XAxis, ResponsiveContainer } from "recharts";
import { UserHistoryDay, DayKpi } from "@/types";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getScoreColor } from "@/utils/utils";

// Props for the Chart component
interface ChartProps {
  userHistory: UserHistoryDay[];
  kpi: DayKpi[];
  selectedDate: string | null;
}

// Use CSS variable for the blue-500 color
// This will be defined in your globals.css or tailwind.config.js
const chartConfig = {
  cumulative_gain: {
    label: "Cum Score",
    color: "hsl(var(--blue-500))", // Use CSS variable instead of hardcoded value
  },
  log_date: {
    label: "Date",
    color: "hsl(var(--blue-500))", // Use CSS variable instead of hardcoded value
  }
} satisfies ChartConfig

export function ValueChart({ userHistory, kpi, selectedDate }: ChartProps) {
  // Get dayInfo if a date is selected
  const dayInfo = selectedDate ? userHistory.find((day) => day.log_date === selectedDate) : null;
  
  // Determine dayScore only if dayInfo exists
  const dayScore = dayInfo ? dayInfo.actions_day_grade : 0;

  // Function to render dots only for the selected date
  const renderDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    
    // Convert both to ISO date strings for comparison
    // log_date is a Date object, selectedDate is a string
    const payloadDateStr = payload.log_date instanceof Date
      ? payload.log_date.toISOString().split('T')[0]
      : String(payload.log_date);

    // Compare the dates - only render for selected date
    if (selectedDate && payloadDateStr === selectedDate) {
      // Find the corresponding user history item to get the score
      const pointData = userHistory.find(day => day.log_date === payloadDateStr);
      const pointScore = pointData ? pointData.actions_day_grade : 0;
      const pointColor = getScoreColor(pointScore);

      return (
        <circle
          key={`dot-${index}`}
          cx={cx}
          cy={cy}
          r={4}
          fill={pointColor}
        />
      );
    }

    // Return an empty/invisible dot for other points
    return (
      <circle 
        key={`dot-${index}`} 
        cx={cx} 
        cy={cy} 
        r={0} 
        fill="none" 
      />
    );
  };
  
  // Add a formatted date field to the kpi array while keeping the original Date
  const kpiWithFormattedDate = kpi.map(item => {
    const date = new Date(item.log_date);
    const day = date.getDate();
    const monthName = date.toLocaleDateString('en-GB', { month: 'short' });
    const shortYear = date.getFullYear().toString().substr(2);

    return {
      ...item,
      // Keep the original log_date
      log_date: item.log_date,
      // Add a new formatted_date field
      formatted_date: `${day} ${monthName} ${shortYear}` // Format: "1 Apr 25"
    };
  });

  // Function to get only formatted dates for the first day of each month
  function getFirstDayOfMonthFormatted(kpiData: any[]): string[] {
    return kpiData
      .filter(item => {
        const date = new Date(item.log_date);
        return date.getDate() === 1; // Check if it's the first day of the month
      })
      .map(item => item.formatted_date);
  }

  // Get formatted first day of month strings
  const firstDayFormatted = getFirstDayOfMonthFormatted(kpiWithFormattedDate);
  
  // Custom active dot renderer to use the correct score color
  const renderActiveDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    
    // Get the date string from payload
    const payloadDateStr = payload.log_date instanceof Date
      ? payload.log_date.toISOString().split('T')[0]
      : String(payload.log_date);
    
    // Find the corresponding user history item to get the score
    const pointData = userHistory.find(day => day.log_date === payloadDateStr);
    const pointScore = pointData ? pointData.actions_day_grade : 0;
    const pointColor = getScoreColor(pointScore);
    
    return (
      <circle
        key={`activeDot-${index}`}
        cx={cx}
        cy={cy}
        r={4}
        fill="none"
        strokeWidth={2}
        stroke={pointColor}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart
          accessibilityLayer
          data={kpiWithFormattedDate}
          margin={{
            top: 5,
            left: 4,
            right: 4,
            bottom: 5
          }}
          width={500}
          height={100}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="formatted_date"
            tickLine={true}
            axisLine={true}
            tickMargin={8}
            interval="preserveStartEnd"
            ticks={firstDayFormatted}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line"/>}
          />
          <Line
            dataKey="cumulative_gain"
            type="linear"
            stroke="hsl(var(--blue-500))" // Use CSS variable
            strokeWidth={2}
            dot={renderDot}
            activeDot={renderActiveDot}
          />
        </LineChart>
      </ChartContainer>
    </ResponsiveContainer>
  )
}