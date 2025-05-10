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
import { getScoreColor } from "@/utils/utils"

interface DayScoreProps {
  dayScore: number;
}

export function DayScore({ dayScore }: DayScoreProps) {
  const scoreFill = 1 - dayScore;
  // Gray color for the background (scoreFill)
  const fillColor = "hsl(var(--score-faint-gray))";
  const scoreColor = getScoreColor(dayScore);
  
  // Hard coded average score
  const averageScore = 0.5;
  const averageScoreFill = 1 - averageScore;
  const averageScoreColor = getScoreColor(averageScore);
  
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

          {/* Average score bar (inner) */}
          <RadialBar
            dataKey="averageScoreFill"
            stackId="b"
            opacity={0}
          />
          <RadialBar
            dataKey="averageScore"
            stackId="b"
            cornerRadius={5}
            fill={averageScoreColor}
            className="stroke-transparent stroke-1"
            
          />
          
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