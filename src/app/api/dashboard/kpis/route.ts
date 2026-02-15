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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [totalResult, newResult, pendingResult] = await Promise.all([
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .gte("reception_date", sevenDaysAgo.toISOString()),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendent"),
  ]);

  return NextResponse.json({
    total: totalResult.count ?? 0,
    newLast7Days: newResult.count ?? 0,
    pending: pendingResult.count ?? 0,
  });
}
