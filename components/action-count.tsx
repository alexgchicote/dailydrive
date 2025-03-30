"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, BarProps, CartesianGrid, XAxis, YAxis } from "recharts"

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
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
    {
        "action_name": "Doom Scroll",
        "action_id": 8,
        "intent": "avoid",
        "positive_count": 32,
        "neutral_count": 0,
        "negative_count": 4
    },
    {
        "action_name": "Football",
        "action_id": 10,
        "intent": "engage",
        "positive_count": 6,
        "neutral_count": 21,
        "negative_count": 9
    },
    {
        "action_name": "Gym",
        "action_id": 5,
        "intent": "engage",
        "positive_count": 12,
        "neutral_count": 15,
        "negative_count": 9
    },
    {
        "action_name": "Meal Prep",
        "action_id": 12,
        "intent": "engage",
        "positive_count": 28,
        "neutral_count": 0,
        "negative_count": 8
    },
    {
        "action_name": "Morning Walk",
        "action_id": 4,
        "intent": "engage",
        "positive_count": 32,
        "neutral_count": 0,
        "negative_count": 4
    },
    {
        "action_name": "Muay Thai",
        "action_id": 11,
        "intent": "engage",
        "positive_count": 9,
        "neutral_count": 18,
        "negative_count": 9
    },
    {
        "action_name": "Nicotine",
        "action_id": 13,
        "intent": "avoid",
        "positive_count": 24,
        "neutral_count": 0,
        "negative_count": 12
    },
    {
        "action_name": "Read fiction",
        "action_id": 3,
        "intent": "engage",
        "positive_count": 13,
        "neutral_count": 12,
        "negative_count": 11
    },
    {
        "action_name": "Read non-fiction",
        "action_id": 2,
        "intent": "engage",
        "positive_count": 12,
        "neutral_count": 13,
        "negative_count": 11
    },
    {
        "action_name": "Weed",
        "action_id": 14,
        "intent": "avoid",
        "positive_count": 24,
        "neutral_count": 0,
        "negative_count": 12
    }
]

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
    mobile: {
        label: "Mobile",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

export function ActionCount() {
    return (
        <Card>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="action_name"
                            angle={-30}
                            textAnchor="end"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            interval={0}
                            height={80}
                        />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Bar
                            dataKey="negative_count"
                            stackId="a"
                            fill="var(--color-mobile)"
                            radius={[0, 0, 4, 4]}
                        />
                        <Bar
                            dataKey="neutral_count"
                            stackId="a"
                            fill="teal"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="positive_count"
                            stackId="a"
                            fill="var(--color-desktop)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}