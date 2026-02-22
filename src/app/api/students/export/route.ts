import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  // Get current school year
  const { data: yearData } = await supabase
    .from("clickedu_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  if (!yearData) {
    return NextResponse.json(
      { error: "No hi ha curs escolar actiu" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const etapa = searchParams.get("etapa") || "";

  // Fetch all students with yearly data
  const { data: students, error } = await supabase
    .from("clickedu_students")
    .select(
      `
      id, clickedu_id, first_name, last_name, class_id, class_name,
      student_yearly_data(
        graella_nese, curs_repeticio, dades_familiars,
        academic, comportament, acords_tutoria, estat, observacions,
        school_year_id
      )
    `
    )
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = students || [];

  // Filter by etapa
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

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Alumnes");

  // Headers
  sheet.columns = [
    { header: "Cognoms, Nom", key: "name", width: 30 },
    { header: "Classe", key: "class_name", width: 12 },
    { header: "Etapa", key: "etapa", width: 10 },
    { header: "NESE", key: "nese", width: 8 },
    { header: "Curs repetició", key: "curs_repeticio", width: 15 },
    { header: "Dades familiars", key: "dades_familiars", width: 40 },
    { header: "Acadèmic", key: "academic", width: 40 },
    { header: "Comportament", key: "comportament", width: 40 },
    { header: "Acords tutoria", key: "acords_tutoria", width: 40 },
    { header: "Estat", key: "estat", width: 10 },
    { header: "Observacions", key: "observacions", width: 40 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F5E9" },
  };

  // Data rows
  for (const s of filtered) {
    const yearlyData = Array.isArray(s.student_yearly_data)
      ? s.student_yearly_data.find(
          (yd: any) => yd.school_year_id === yearData.id
        )
      : s.student_yearly_data;

    const cn = s.class_name || "";
    let etapaLabel: string;
    if (cn.startsWith("I")) etapaLabel = "Infantil";
    else if (cn.startsWith("P")) etapaLabel = "Primària";
    else etapaLabel = "Secund\u00e0ria";

    sheet.addRow({
      name: `${s.last_name}, ${s.first_name}`,
      class_name: s.class_name,
      etapa: etapaLabel,
      nese: yearlyData?.graella_nese ? "Sí" : "No",
      curs_repeticio: yearlyData?.curs_repeticio || "",
      dades_familiars: yearlyData?.dades_familiars || "",
      academic: yearlyData?.academic || "",
      comportament: yearlyData?.comportament || "",
      acords_tutoria: yearlyData?.acords_tutoria || "",
      estat: yearlyData?.estat
        ? yearlyData.estat === "resolt"
          ? "Resolt"
          : "Pendent"
        : "",
      observacions: yearlyData?.observacions || "",
    });
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  const filename = `alumnes_${yearData.name}_${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
