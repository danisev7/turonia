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

  // Fetch all config tables in parallel
  const [
    materiesRes,
    professionalsRes,
    modelsRes,
    docentsRes,
    instrumentsRes,
    nivellsRes,
    modelMesuresRes,
    transversalsRes,
    sabersDigRes,
  ] = await Promise.all([
    supabase
      .from("pi_config_materies")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("pi_config_professionals")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("pi_config_models")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("pi_config_docents")
      .select("id, name, school_year_id")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("pi_config_instruments")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("pi_config_nivells_avaluacio")
      .select("id, code, label, sort_order")
      .order("sort_order"),
    supabase
      .from("pi_config_model_mesures")
      .select("id, model, tipus, mesura, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("pi_config_transversals")
      .select("id, stage, area, group_name, espec_short, espec_full, crit_short, crit_full, is_active, sort_order")
      .order("sort_order")
      .range(0, 1999),
    supabase
      .from("pi_config_sabers_dig")
      .select("id, stage, group_name, full_text, short_text, is_active, sort_order")
      .order("sort_order")
      .range(0, 999),
  ]);

  // Fetch curriculum with pagination (table has ~3500+ rows, Supabase default limit is 1000)
  const allCurriculum: Record<string, unknown>[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase
      .from("pi_config_curriculum")
      .select("id, stage, subject, level, entry_type, code, full_text, short_text, parent_code, is_active, sort_order")
      .order("sort_order")
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    allCurriculum.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return NextResponse.json({
    materies: materiesRes.data || [],
    professionals: professionalsRes.data || [],
    models: modelsRes.data || [],
    docents: docentsRes.data || [],
    instruments: instrumentsRes.data || [],
    nivells: nivellsRes.data || [],
    modelMesures: modelMesuresRes.data || [],
    curriculum: allCurriculum,
    transversals: transversalsRes.data || [],
    sabersDig: sabersDigRes.data || [],
  });
}
