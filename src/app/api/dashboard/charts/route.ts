import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  // By stage
  const { data: stagesData } = await supabase
    .from("candidate_stages")
    .select("stage");

  const stageCounts: Record<string, number> = {};
  stagesData?.forEach((row) => {
    stageCounts[row.stage] = (stageCounts[row.stage] || 0) + 1;
  });

  const stageLabels: Record<string, string> = {
    infantil: "Infantil",
    primaria: "Primària",
    secundaria: "Secundària",
    altres: "Altres",
  };

  const byStage = Object.entries(stageLabels).map(([key, label]) => ({
    stage: label,
    count: stageCounts[key] || 0,
  }));

  // By evaluation
  const { data: evalData } = await supabase
    .from("candidates")
    .select("evaluation")
    .not("evaluation", "is", null);

  const evalCounts: Record<string, number> = {};
  evalData?.forEach((row) => {
    if (row.evaluation) {
      evalCounts[row.evaluation] = (evalCounts[row.evaluation] || 0) + 1;
    }
  });

  const evalLabels: Record<string, string> = {
    molt_interessant: "Molt Interessant",
    interessant: "Interessant",
    poc_interessant: "Poc Interessant",
    descartat: "Descartat",
  };

  const byEvaluation = Object.entries(evalLabels).map(([key, label]) => ({
    evaluation: label,
    count: evalCounts[key] || 0,
  }));

  // Trend: CVs per week (last 12 weeks)
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const { data: trendData } = await supabase
    .from("candidates")
    .select("reception_date")
    .gte("reception_date", twelveWeeksAgo.toISOString())
    .order("reception_date", { ascending: true });

  const weeklyTrend: { week: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count =
      trendData?.filter((row) => {
        const d = new Date(row.reception_date);
        return d >= weekStart && d < weekEnd;
      }).length ?? 0;

    weeklyTrend.push({
      week: `${weekStart.getDate().toString().padStart(2, "0")}/${(weekStart.getMonth() + 1).toString().padStart(2, "0")}`,
      count,
    });
  }

  return NextResponse.json({
    byStage,
    byEvaluation,
    weeklyTrend,
  });
}
