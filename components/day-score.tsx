"use client"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts"
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


interface DayScoreProps {
  dayScore: number;
}

export function DayScore({ dayScore }: DayScoreProps) {
  const scoreFill = 1 - dayScore;
  // Gray color for the background (scoreFill)
  const fillColor = "hsl(var(--score-faint-gray))";
  
  // Get score color using CSS variables (dark mode compliant)
  let scoreColor;
  if (dayScore === 1) {
    scoreColor = "var(--chart-positive-stroke)";
  } else if (dayScore > 0.6) {
    scoreColor = "var(--chart-neutral-stroke)";
  } else {
    scoreColor = "var(--chart-negative-stroke)";
  }
  
  // Hard coded average score
  const averageScore = 0.5;
  const averageScoreFill = 1 - averageScore;
  // Average score color (neutral/yellow for 0.5)
  const averageScoreColor = "var(--chart-neutral)";
  
  const chartData = [{ 
    score: dayScore, 
    scoreFill: scoreFill,
    averageScore: averageScore,
    averageScoreFill: averageScoreFill
  }]
  
  const chartConfig = {
    score: {
      label: "Score",
      color: scoreColor,
    },
    scoreFill: {
      label: "Max",
      color: fillColor,
    },
    averageScore: {
      label: "Average",
      color: averageScoreColor,
    },
    averageScoreFill: {
      label: "Avg Max",
      color: "transparent", // No color for averageScoreFill as requested
    }
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartContainer
        config={chartConfig}
        className="h-full w-full"
      >
        <RadialBarChart
          data={chartData}
          startAngle={0}
          endAngle={180}
          innerRadius={40}
          outerRadius={100}
          barSize={12}
          cx="50%"
          cy="77%"
        >
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) - 8}
                        className="fill-foreground text-lg font-bold"
                      >
                        {(chartData[0].score * 100).toFixed(0)}%
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </PolarRadiusAxis>

          
          
          {/* Main score bar (outer) */}
          <RadialBar
            dataKey="scoreFill"
            stackId="a"
            opacity={0}
          />
          <RadialBar
            dataKey="score"
            stackId="a"
            cornerRadius={5}
            fill={scoreColor}
            className="stroke-transparent stroke-2"
            background
          />
          
          
        </RadialBarChart>
      </ChartContainer>
    </ResponsiveContainer>
  )
}

export default DayScore;