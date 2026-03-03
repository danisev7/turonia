import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  // Check role permission
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const role = profile?.role || "convidat";
  const allowedRoles = [
    "admin",
    "direccio",
    "tutor",
    "poe",
    "mesi",
    "secretaria",
    "professor",
  ];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const etapa = searchParams.get("etapa") || "";
  const className = searchParams.get("className") || "";
  const graellaNese = searchParams.get("graellaNese") || "";
  const mesuraNese = searchParams.get("mesuraNese") || "";
  const ssd = searchParams.get("ssd") || "";
  const estat = searchParams.get("estat") || "";
  const sortBy = searchParams.get("sortBy") || "last_name";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? false : true;

  // Get current school year
  const { data: yearData } = await supabase
    .from("clickedu_years")
    .select("id")
    .eq("is_current", true)
    .single();

  if (!yearData) {
    return NextResponse.json(
      { error: "No hi ha curs escolar actiu" },
      { status: 500 }
    );
  }

  // Build query - left join students with yearly data
  let query = supabase
    .from("clickedu_students")
    .select(
      `
      id,
      clickedu_id,
      first_name,
      last_name,
      class_id,
      class_name,
      is_repetidor,
      is_active,
      student_yearly_data(
        id,
        graella_nese,
        curs_repeticio,
        estat,
        observacions,
        school_year_id
      ),
      student_nese_data(
        mesura_nese,
        ssd,
        school_year_id
      )
    `
    )
    .eq("is_active", true)
    .eq("school_year_id", yearData.id);

  // Class name filter
  if (className) {
    const classNames = className.split(",");
    query = query.in("class_name", classNames);
  }

  // Sort
  const validSortColumns = [
    "last_name",
    "first_name",
    "class_name",
    "clickedu_id",
  ];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "last_name";
  query = query.order(sortColumn, { ascending: sortOrder });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = data || [];

  if (search) {
    const normalize = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    filtered = filtered.filter((s) => {
      const text = normalize(`${s.first_name || ""} ${s.last_name || ""}`);
      return terms.every((term) => text.includes(term));
    });
  }

  // Client-side filters for related data
  if (etapa) {
    const etapes = etapa.split(",");
    filtered = filtered.filter((s) => {
      const cn = s.class_name || "";
      let studentEtapa: string;
      if (cn.startsWith("I")) studentEtapa = "infantil";
      else if (cn.startsWith("P")) studentEtapa = "primaria";
      else studentEtapa = "secundaria";
      return etapes.includes(studentEtapa);
    });
  }

  if (graellaNese) {
    const isNese = graellaNese === "true";
    filtered = filtered.filter((s) => {
      const yearlyData = Array.isArray(s.student_yearly_data)
        ? s.student_yearly_data[0]
        : s.student_yearly_data;
      return yearlyData?.graella_nese === isNese;
    });
  }

  if (mesuraNese) {
    const mesures = mesuraNese.split(",");
    filtered = filtered.filter((s) => {
      const neseData = Array.isArray(s.student_nese_data)
        ? s.student_nese_data[0]
        : s.student_nese_data;
      return neseData?.mesura_nese && mesures.includes(neseData.mesura_nese);
    });
  }

  if (ssd) {
    const isSsd = ssd === "true";
    filtered = filtered.filter((s) => {
      const neseData = Array.isArray(s.student_nese_data)
        ? s.student_nese_data[0]
        : s.student_nese_data;
      return neseData?.ssd === isSsd;
    });
  }

  if (estat) {
    filtered = filtered.filter((s) => {
      const yearlyData = Array.isArray(s.student_yearly_data)
        ? s.student_yearly_data[0]
        : s.student_yearly_data;
      return yearlyData?.estat === estat;
    });
  }

  // Extract available filter values from filtered data
  const CLASS_ORDER = ["I3", "I4", "I5", "P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4"];
  const availableClasses = [
    ...new Set(filtered.map((s) => s.class_name).filter(Boolean)),
  ].sort((a, b) => {
    const idxA = CLASS_ORDER.indexOf(a);
    const idxB = CLASS_ORDER.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const ETAPA_ORDER = ["infantil", "primaria", "secundaria"];
  const availableEtapes = [
    ...new Set(filtered.map((s) => {
      const cn = s.class_name || "";
      if (cn.startsWith("I")) return "infantil";
      if (cn.startsWith("P")) return "primaria";
      return "secundaria";
    })),
  ].sort((a, b) => ETAPA_ORDER.indexOf(a) - ETAPA_ORDER.indexOf(b));

  const availableMesuraNese = [
    ...new Set(filtered.map((s) => {
      const nd = Array.isArray(s.student_nese_data) ? s.student_nese_data[0] : s.student_nese_data;
      return nd?.mesura_nese as string | undefined;
    }).filter(Boolean)),
  ].sort();

  const availableEstats = [
    ...new Set(filtered.map((s) => {
      const yd = Array.isArray(s.student_yearly_data) ? s.student_yearly_data[0] : s.student_yearly_data;
      return yd?.estat as string | undefined;
    }).filter(Boolean)),
  ];

  return NextResponse.json({
    data: filtered,
    total: filtered.length,
    availableClasses,
    availableEtapes,
    availableMesuraNese,
    availableEstats,
  });
}
