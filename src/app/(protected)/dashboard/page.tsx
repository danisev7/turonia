"use client";

import { useEffect, useState } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { StudentKPICards } from "@/components/dashboard/student-kpi-cards";
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

interface StudentKPIs {
  total: number;
  byEtapa: { etapa: string; count: number }[];
  byClass: { name: string; count: number }[];
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [studentKpis, setStudentKpis] = useState<StudentKPIs | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/kpis")
      .then((r) => r.json())
      .then(setKpis);
    fetch("/api/dashboard/charts")
      .then((r) => r.json())
      .then(setCharts);
    fetch("/api/dashboard/students-kpis")
      .then((r) => r.json())
      .then(setStudentKpis);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tauler de Control</h1>
      </div>

      {/* ── Secció Alumnes ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground/80">Alumnes</h2>
        {studentKpis ? (
          <StudentKPICards
            total={studentKpis.total}
            byEtapa={studentKpis.byEtapa}
            byClass={studentKpis.byClass}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        )}
      </section>

      {/* ── Secció Curr\u00edculums ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground/80">Curr&iacute;culums</h2>
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
      </section>
    </div>
  );
}
