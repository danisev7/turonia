"use client";

import { useEffect, useState } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIs {
  total: number;
  newLast7Days: number;
  pending: number;
}

interface ChartsData {
  byStage: { stage: string; count: number }[];
  byEvaluation: { evaluation: string; count: number }[];
  weeklyTrend: { week: string; count: number }[];
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/kpis")
      .then((r) => r.json())
      .then(setKpis);
    fetch("/api/dashboard/charts")
      .then((r) => r.json())
      .then(setCharts);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panell de control</h1>
        <p className="text-muted-foreground mt-1">Resum general</p>
      </div>

      {kpis ? (
        <KPICards
          total={kpis.total}
          newLast7Days={kpis.newLast7Days}
          pending={kpis.pending}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      )}

      {charts ? (
        <DashboardCharts
          byStage={charts.byStage}
          byEvaluation={charts.byEvaluation}
          weeklyTrend={charts.weeklyTrend}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[330px]" />
          ))}
        </div>
      )}
    </div>
  );
}
