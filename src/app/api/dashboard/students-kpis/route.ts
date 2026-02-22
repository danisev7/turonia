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

  // Get all active students with their class_name
  const { data: students } = await supabase
    .from("clickedu_students")
    .select("class_name")
    .eq("is_active", true);

  const all = students || [];
  const total = all.length;

  // Count by etapa
  const byEtapa: Record<string, number> = {
    infantil: 0,
    primaria: 0,
    secundaria: 0,
  };
  for (const s of all) {
    const cn = s.class_name || "";
    if (cn.startsWith("I")) byEtapa.infantil++;
    else if (cn.startsWith("P")) byEtapa.primaria++;
    else byEtapa.secundaria++;
  }

  // Count by class
  const byClass: Record<string, number> = {};
  for (const s of all) {
    const cn = s.class_name || "?";
    byClass[cn] = (byClass[cn] || 0) + 1;
  }

  // Sort classes in pedagogical order
  const classOrder = [
    "I3", "I4", "I5",
    "P1", "P2", "P3", "P4", "P5", "P6",
    "E1", "E2", "E3", "E4",
  ];
  const sortedClasses = Object.entries(byClass)
    .sort(([a], [b]) => {
      const ia = classOrder.indexOf(a);
      const ib = classOrder.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    total,
    byEtapa: [
      { etapa: "Infantil", count: byEtapa.infantil },
      { etapa: "Prim\u00e0ria", count: byEtapa.primaria },
      { etapa: "Secund\u00e0ria", count: byEtapa.secundaria },
    ],
    byClass: sortedClasses,
  });
}
