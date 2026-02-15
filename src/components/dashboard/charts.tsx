"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface ChartsProps {
  byStage: { stage: string; count: number }[];
  byEvaluation: { evaluation: string; count: number }[];
  weeklyTrend: { week: string; count: number }[];
}

const STAGE_COLORS: Record<string, string> = {
  Infantil: "#10b981",
  Primària: "#3b82f6",
  Secundària: "#8b5cf6",
  Altres: "#78716c",
};

const EVAL_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

export function DashboardCharts({
  byStage,
  byEvaluation,
  weeklyTrend,
}: ChartsProps) {
  const hasEvalData = byEvaluation.some((d) => d.count > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Per etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" fontSize={12} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Candidats" radius={[4, 4, 0, 0]}>
                {byStage.map((entry) => (
                  <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Per avaluació</CardTitle>
        </CardHeader>
        <CardContent>
          {hasEvalData ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byEvaluation.filter((d) => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="evaluation"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {byEvaluation
                    .filter((d) => d.count > 0)
                    .map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={EVAL_COLORS[index % EVAL_COLORS.length]}
                      />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Sense dades d&apos;avaluació
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Tendència (últimes 12 setmanes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={11} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                name="CVs rebuts"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
