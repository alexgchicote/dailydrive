"use client"
import { TrendingUp } from "lucide-react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
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
import { useEffect, useState } from "react"

interface DayScoreProps {
    dayScore: number;
}

export function DayScore({ dayScore }: DayScoreProps) {
    const scoreFill = 1 - dayScore;

    // Determine score color based on the value
    const getScoreColor = (score: number) => {
        if (score === 1) return { light: "#4ade80", dark: "#15803d" }; // green-400/700
        if (score > 0.6) return { light: "#facc15", dark: "#a16207" }; // yellow-400/700
        return { light: "#f87171", dark: "#b91c1c" }; // red-400/700
    };

    // Gray colors for the background (scoreFill)
    const grayColors = {
        light: "#d1d5db", // gray-300
        dark: "#6b7280",  // gray-500
    };

    const scoreColors = getScoreColor(dayScore);

    // Use state to track dark mode
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Check for dark mode on component mount and when preference changes
    useEffect(() => {
        // Check initial preference
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(darkModeQuery.matches);

        // Add listener for changes
        const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        darkModeQuery.addEventListener('change', handleChange);

        // Clean up
        return () => darkModeQuery.removeEventListener('change', handleChange);
    }, []);

    // Select the appropriate colors based on dark mode state
    const currentScoreColor = isDarkMode ? scoreColors.dark : scoreColors.light;
    const currentGrayColor = isDarkMode ? grayColors.dark : grayColors.light;

    const chartData = [{ score: dayScore, scoreFill: scoreFill }]
    const chartConfig = {
        score: {
            label: "Score",
            color: currentScoreColor,
        },
        scoreFill: {
            label: "Max",
            color: currentGrayColor,
        },
    };

    return (
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[250px]"
        >
            <RadialBarChart
                data={chartData}
                endAngle={180}
                innerRadius={80}
                outerRadius={130}
            >
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                        content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) - 16}
                                            className="fill-foreground text-2xl font-bold"
                                        >
                                            {(chartData[0].score * 100).toFixed(0)}%
                                        </tspan>
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 4}
                                            className="fill-muted-foreground"
                                        >
                                            Score
                                        </tspan>
                                    </text>
                                )
                            }
                            return null;
                        }}
                    />
                </PolarRadiusAxis>
                <RadialBar
                    dataKey="scoreFill"
                    fill={currentGrayColor}
                    stackId="a"
                    cornerRadius={5}
                    className="stroke-transparent stroke-2 opacity-60"
                />
                <RadialBar
                    dataKey="score"
                    stackId="a"
                    cornerRadius={5}
                    fill={currentScoreColor}
                    className="stroke-transparent stroke-2"
                />
            </RadialBarChart>
        </ChartContainer>
    )
}

export default DayScore;