"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
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
  Legend,
} from "recharts";

interface EtapaCount {
  etapa: string;
  count: number;
}

interface ClassCount {
  name: string;
  count: number;
}

interface StudentKPICardsProps {
  total: number;
  byEtapa: EtapaCount[];
  byClass: ClassCount[];
}

const ETAPA_COLORS: Record<string, string> = {
  Infantil: "#10b981",
  "Prim\u00e0ria": "#3b82f6",
  "Secund\u00e0ria": "#8b5cf6",
};

function getClassBarColor(name: string): string {
  if (name.startsWith("I")) return "#10b981"; // emerald
  if (name.startsWith("P")) return "#3b82f6"; // blue
  return "#8b5cf6"; // violet
}

export function StudentKPICards({ total, byEtapa, byClass }: StudentKPICardsProps) {
  const hasEtapaData = byEtapa.some((d) => d.count > 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total alumnes */}
      <Card className="border-l-4 border-l-indigo-500 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total alumnes
          </CardTitle>
          <div className="rounded-lg p-2 bg-indigo-100 text-indigo-700">
            <GraduationCap className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="text-4xl font-bold">{total}</div>
        </CardContent>
      </Card>

      {/* Per etapa — Donut chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Per etapa</CardTitle>
        </CardHeader>
        <CardContent>
          {hasEtapaData ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byEtapa.filter((d) => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="etapa"
                  label={({ value }) => `${value}`}
                  labelLine={false}
                >
                  {byEtapa
                    .filter((d) => d.count > 0)
                    .map((entry) => (
                      <Cell
                        key={entry.etapa}
                        fill={ETAPA_COLORS[entry.etapa] || "#94a3b8"}
                      />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Sense dades
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per classe — Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Per classe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byClass}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Alumnes" radius={[4, 4, 0, 0]}>
                {byClass.map((entry) => (
                  <Cell key={entry.name} fill={getClassBarColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
