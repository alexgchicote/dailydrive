"use client"

import { Bar, ComposedChart, Line, BarChart, Cell, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { UserHistoryDay, UserHistoryLogEntry } from "@/types"

interface ActionsWeekProps {
    selectedDate: string | null;
    userHistory: UserHistoryDay[];
}

// Data item interface for chart
interface ChartDataItem {
    dayOfWeek: string;
    log_date: string;
    positive_actions: number;
    negative_actions: number;
    net_actions: number;
    logs: UserHistoryLogEntry[];
    isHighlighted: boolean;
    grade: number;
    dotColor: string;
}

// Get hex color for grade - for use with Recharts
const getColorHexForGrade = (grade: number): string => {
    if (grade === 1) {
        return "#4ade80"; // green color
    } else if (grade > 0.6 && grade < 1) {
        return "#facc15"; // yellow color 
    } else {
        return "#f87171"; // red color
    }
};

export function ActionsWeek({ selectedDate, userHistory }: ActionsWeekProps) {
    // Helper function to get the abbreviated day-of-week given a date string.
    const getDayOfWeek = (dateStr: string) => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[new Date(dateStr).getDay()];
    };

    // Create a date in the local timezone to avoid timezone shift issues
    const createLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Note: Month is 0-based in JavaScript Date constructor
        return new Date(year, month - 1, day);
    };

    // Get a 7-day date range (including the selected date)
    const getDateRange = (endDateStr: string) => {
        // Parse the date string into local date components to prevent timezone shifts
        const endDate = createLocalDate(endDateStr);
        const result = [];

        // Create 7 days, starting with 6 days before the selected date
        for (let i = 6; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(endDate.getDate() - i);
            result.push(date);
        }

        return result;
    };

    // Filter and prepare the data: include the selected date and the six days prior.
    const prepareChartData = (): ChartDataItem[] => {
        if (!selectedDate || !userHistory.length) return [];

        // Get the 7-day date range
        const dateRange = getDateRange(selectedDate);

        // Format range dates as strings for comparison (YYYY-MM-DD format)
        const dateRangeStrings = dateRange.map(date => {
            // Use local date format to ensure consistency with the input date format
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        });

        // Sort history by date
        const sortedHistory = [...userHistory].sort(
            (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
        );

        // Create a map for quick lookups
        const historyMap = new Map<string, UserHistoryDay>();
        sortedHistory.forEach(day => {
            historyMap.set(day.log_date, day);
        });

        // Map each date in our range to chart data
        return dateRangeStrings.map(dateStr => {
            const day = historyMap.get(dateStr);

            // If we have data for this day, use it; otherwise, use zeros
            const positiveSum = day
                ? day.num_engage_actions_positive + day.num_avoid_actions_positive
                : 0;

            const negativeSum = day
                ? -(day.num_engage_actions_negative + day.num_avoid_actions_negative)
                : 0;

            // Add the grade data for coloring the dots
            const grade = day?.actions_day_grade ?? 0;
            const dotColor = getColorHexForGrade(grade);

            return {
                dayOfWeek: getDayOfWeek(dateStr),
                log_date: dateStr,
                positive_actions: positiveSum > 0 ? positiveSum : 0,
                negative_actions: negativeSum < 0 ? negativeSum : 0,
                net_actions: positiveSum + negativeSum,
                logs: day?.logs || [],
                isHighlighted: dateStr === selectedDate,
                grade: grade,
                dotColor: dotColor
            };
        });
    };

    const chartData = prepareChartData();

    // NEW: Calculate the Y-axis domain based on the actual data values
    const calculateYAxisDomain = () => {
        if (!chartData || chartData.length === 0) return [0, 5]; // Default if no data

        // Extract all values we care about for determining the range
        const allValues = chartData.flatMap(item => [
            item.positive_actions || 0,
            item.negative_actions || 0,
            item.net_actions || 0
        ]);

        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);

        // Add a bit of padding (10%) for better visualization
        const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1;

        return [Math.floor(minValue - padding), Math.ceil(maxValue + padding)];
    };

    // Get Y-axis domain values
    const yAxisDomain = calculateYAxisDomain();

    const chartConfig = {
        net_actions: {
            label: "Net",
            color: "#ffffff",
        },
        positive_actions: {
            label: "Positive",
            color: "#4ade80",
        },
        negative_actions: {
            label: "Negative",
            color: "#f87171",
            // Add valueFormatter to display the absolute value
            valueFormatter: (value) => Math.abs(Number(value)).toLocaleString()
        },
        outcomes: {
            label: "Outcomes"
        }
    } satisfies ChartConfig;

    // Custom dot renderer for the Line component to apply colors based on grade
    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;

        return (
            <g>
                {/* The dot itself */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.dotColor}
                    stroke={payload.log_date === selectedDate ? "#8b5cf6" : "white"}
                    strokeWidth={2}
                    className="drop-shadow-sm"
                />
            </g>
        );
    };

    const barSize = 20;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ChartContainer config={chartConfig} className="h-full">
                <ComposedChart
                    data={chartData}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    barGap={-barSize}
                    barCategoryGap={0}
                    barSize={barSize}
                >
                    <XAxis
                        dataKey="log_date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={0}
                        // tick={renderXAxisTick} 
                        tickFormatter={(value) =>
                            getDayOfWeek(value)
                        }
                    />
                    <YAxis
                        domain={yAxisDomain}
                        hide={true}
                        tickLine={false}
                        axisLine={false}
                    />
                    <ReferenceLine y={0} stroke="#666" />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelKey="outcomes"
                                indicator="line"
                            />
                        }
                        cursor={false}

                    />
                    <Bar
                        dataKey="positive_actions"
                        fill="#4ade80"
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`positive-${index}`}
                                stroke={entry.log_date === selectedDate ? "#8b5cf6" : "transparent"}
                                strokeWidth={entry.log_date === selectedDate ? 2 : 0}
                            />
                        ))}
                    </Bar>
                    <Bar
                        dataKey="negative_actions"
                        fill="#f87171"
                        stackId="b"
                        radius={[4, 4, 0, 0]}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`positive-${index}`}
                                stroke={entry.log_date === selectedDate ? "#8b5cf6" : "transparent"}
                                strokeWidth={entry.log_date === selectedDate ? 2 : 0}
                            />
                        ))}
                    </Bar>
                    <Line
                        type="monotone"
                        dataKey="net_actions"
                        stroke="white"
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={false}
                    />
                </ComposedChart>
            </ChartContainer>
        </ResponsiveContainer>
    );
}