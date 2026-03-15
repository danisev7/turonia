import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { canView } from "@/lib/permissions";
import type { UserRole } from "@/types";
import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import { join } from "path";

/* ── PDF builder helpers (same pattern as main export-pdf) ── */
class PDFBuilder {
  doc: jsPDF;
  y: number;
  readonly M = 15;
  readonly CW = 180;
  readonly PH = 297;

  constructor() {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.y = this.M;
  }

  checkPage(need: number) {
    if (this.y + need > this.PH - this.M) {
      this.doc.addPage();
      this.y = this.M;
    }
  }

  sectionHeader(title: string) {
    this.checkPage(14);
    this.doc.setFillColor(97, 153, 141);
    this.doc.rect(this.M, this.y, this.CW, 8, "F");
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.M + 4, this.y + 5.5);
    this.doc.setTextColor(0, 0, 0);
    this.y += 12;
  }

  subHeader(title: string) {
    this.checkPage(10);
    this.doc.setFontSize(9.5);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(55, 65, 81);
    this.doc.text(title, this.M, this.y + 3.5);
    this.doc.setTextColor(0, 0, 0);
    this.y += 6;
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.M, this.y, this.M + this.CW, this.y);
    this.y += 3;
  }

  inlineRow(fields: { label: string; value: string }[], cols?: number) {
    const numCols = cols || fields.length;
    const colW = this.CW / numCols;
    this.checkPage(13);

    this.doc.setFontSize(7.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    for (let i = 0; i < fields.length; i++) {
      this.doc.text(fields[i].label, this.M + i * colW, this.y + 3);
    }
    this.y += 5;

    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(33, 37, 41);
    for (let i = 0; i < fields.length; i++) {
      const val = fields[i].value || "-";
      const maxW = colW - 2;
      const truncated = this.doc.splitTextToSize(val, maxW)[0] || val;
      this.doc.text(truncated, this.M + i * colW, this.y + 3.5);
    }
    this.doc.setTextColor(0, 0, 0);
    this.y += 7;
  }

  textField(label: string, value: string | null) {
    this.checkPage(14);
    this.doc.setFontSize(7.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(label, this.M, this.y + 3);
    this.y += 5;

    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(33, 37, 41);
    const text = value || "-";
    const lines: string[] = this.doc.splitTextToSize(text, this.CW);
    for (const line of lines) {
      this.checkPage(5);
      this.doc.text(line, this.M, this.y + 3.5);
      this.y += 4.5;
    }
    this.doc.setTextColor(0, 0, 0);
    this.y += 2;
  }

  emptyMessage(text: string) {
    this.checkPage(8);
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "italic");
    this.doc.setTextColor(156, 163, 175);
    this.doc.text(text, this.M, this.y + 3.5);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "normal");
    this.y += 8;
  }

  /** Bullet list of items */
  bulletList(items: string[]) {
    for (const item of items) {
      this.checkPage(6);
      this.doc.setFontSize(8.5);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(33, 37, 41);
      const lines: string[] = this.doc.splitTextToSize(
        `\u2022 ${item}`,
        this.CW - 4
      );
      for (const line of lines) {
        this.checkPage(5);
        this.doc.text(line, this.M + 2, this.y + 3.5);
        this.y += 4.5;
      }
    }
    this.doc.setTextColor(0, 0, 0);
    this.y += 1;
  }

  /** Colored bullet list — each item with its own dot + text color */
  coloredBulletList(items: { text: string; rgb: [number, number, number] }[]) {
    for (const item of items) {
      this.checkPage(6);
      // Draw colored dot
      this.doc.setFillColor(item.rgb[0], item.rgb[1], item.rgb[2]);
      this.doc.circle(this.M + 3, this.y + 2.5, 1.2, "F");
      // Text in the same color
      this.doc.setFontSize(8.5);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(item.rgb[0], item.rgb[1], item.rgb[2]);
      const lines: string[] = this.doc.splitTextToSize(item.text, this.CW - 8);
      for (let li = 0; li < lines.length; li++) {
        if (li > 0) this.checkPage(5);
        this.doc.text(lines[li], this.M + 6, this.y + 3.5);
        this.y += 4.5;
      }
    }
    this.doc.setTextColor(0, 0, 0);
    this.y += 1;
  }

  /** Label + colored bullet list */
  labeledColorList(label: string, items: { text: string; rgb: [number, number, number] }[]) {
    this.checkPage(10);
    this.doc.setFontSize(7.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(label, this.M, this.y + 3);
    this.y += 5;
    if (items.length === 0) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(33, 37, 41);
      this.doc.text("-", this.M, this.y + 3.5);
      this.y += 6;
    } else {
      this.coloredBulletList(items);
    }
    this.doc.setTextColor(0, 0, 0);
  }

  /** Label followed by a bullet list — each item on its own line */
  labeledList(label: string, items: string[]) {
    this.checkPage(10);
    this.doc.setFontSize(7.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(label, this.M, this.y + 3);
    this.y += 5;
    if (items.length === 0) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(33, 37, 41);
      this.doc.text("-", this.M, this.y + 3.5);
      this.y += 6;
    } else {
      this.bulletList(items);
    }
    this.doc.setTextColor(0, 0, 0);
  }

  /** Compact table with headers and rows */
  compactTable(
    headers: string[],
    rows: string[][],
    colWidths?: number[]
  ) {
    const numCols = headers.length;
    const widths = colWidths || headers.map(() => this.CW / numCols);
    const rowH = 5;

    // Headers
    this.checkPage(rowH + 4);
    this.doc.setFillColor(243, 244, 246);
    this.doc.rect(this.M, this.y, this.CW, rowH, "F");
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(75, 85, 99);
    let x = this.M + 1;
    for (let i = 0; i < numCols; i++) {
      this.doc.text(headers[i], x, this.y + 3.5);
      x += widths[i];
    }
    this.y += rowH + 1;

    // Rows
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(33, 37, 41);
    this.doc.setFontSize(7);

    for (const row of rows) {
      this.checkPage(rowH + 2);
      x = this.M + 1;
      for (let i = 0; i < numCols; i++) {
        const val = row[i] || "-";
        const truncated =
          this.doc.splitTextToSize(val, widths[i] - 2)[0] || val;
        this.doc.text(truncated, x, this.y + 3.5);
        x += widths[i];
      }
      // Light bottom border
      this.doc.setDrawColor(229, 231, 235);
      this.doc.setLineWidth(0.1);
      this.doc.line(this.M, this.y + rowH, this.M + this.CW, this.y + rowH);
      this.y += rowH;
    }
    this.doc.setTextColor(0, 0, 0);
    this.y += 2;
  }

  gap(size = 4) {
    this.y += size;
  }

  output(): ArrayBuffer {
    return this.doc.output("arraybuffer");
  }
}

/* ── Helpers ── */
function boolText(v: boolean | null | undefined): string {
  return v ? "S\u00ed" : "No";
}

const MESURA_NESE_LABELS: Record<string, string> = {
  pi: "PI",
  pi_curricular: "PI curricular",
  pi_no_curricular: "PI no curricular",
  pi_nouvingut: "PI nouvingut",
};

// Color palettes (RGB) for PDF
const AREA_RGB: Record<string, [number, number, number]> = {
  "Ciutadana": [29, 78, 216],
  "Digital": [126, 34, 206],
  "Emprenedora": [180, 83, 9],
  "Personal, social i aprendre a aprendre": [15, 118, 110],
};
const DEFAULT_RGB: [number, number, number] = [75, 85, 99];

const CE_RGB_PALETTE: [number, number, number][] = [
  [29, 78, 216],   // blue
  [126, 34, 206],  // purple
  [180, 83, 9],    // amber
  [15, 118, 110],  // teal
  [190, 18, 60],   // rose
  [67, 56, 202],   // indigo
  [194, 65, 12],   // orange
  [4, 120, 87],    // emerald
];

const AVAL_LABELS: Record<string, string> = {
  "1": "1 - NA",
  "2": "2 - AS",
  "3": "3 - AN",
  "4": "4 - AE",
};

function formatJsonItems(
  items: any[] | null | undefined,
  field: "short" | "full" = "short"
): string {
  if (!items || !Array.isArray(items) || items.length === 0) return "-";
  return items.map((i) => i[field] || i.short || i.full || "-").join(", ");
}

/* ── Route ── */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const role = (profile?.role || "convidat") as UserRole;
  if (!canView(role, "alumnes_pi")) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
  }

  // Get school year
  const { searchParams } = new URL(request.url);
  const yearId = searchParams.get("yearId");

  let schoolYearId = yearId;
  let yearName = "";
  if (!schoolYearId) {
    const { data: yearData } = await supabase
      .from("clickedu_years")
      .select("id, name")
      .eq("is_current", true)
      .single();
    schoolYearId = yearData?.id;
    yearName = yearData?.name || "";
  } else {
    const { data: yearData } = await supabase
      .from("clickedu_years")
      .select("name")
      .eq("id", schoolYearId)
      .single();
    yearName = yearData?.name || "";
  }

  if (!schoolYearId) {
    return NextResponse.json(
      { error: "No s'ha trobat el curs escolar" },
      { status: 404 }
    );
  }

  // Get student
  const { data: student } = await supabase
    .from("clickedu_students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Alumne no trobat" }, { status: 404 });
  }

  // Get NESE data (for mesura_nese label)
  const { data: neseData } = await supabase
    .from("student_nese_data")
    .select("mesura_nese")
    .eq("student_id", studentId)
    .eq("school_year_id", schoolYearId)
    .single();

  // Get PI document (or create empty one for PDF export)
  let { data: piDocument } = await supabase
    .from("pi_documents")
    .select("*")
    .eq("student_id", studentId)
    .eq("school_year_id", schoolYearId)
    .single();

  if (!piDocument) {
    // Create an empty PI document so the PDF can be generated
    const { data: newDoc, error: createError } = await supabase
      .from("pi_documents")
      .insert({ student_id: studentId, school_year_id: schoolYearId })
      .select("*")
      .single();

    if (createError || !newDoc) {
      return NextResponse.json(
        { error: "No s'ha pogut crear el document PI" },
        { status: 500 }
      );
    }
    piDocument = newDoc;
  }

  // Fetch all child tables in parallel
  const [
    materiesRes,
    professionalsRes,
    orientacionsRes,
    compTransversalsRes,
    signaturesRes,
    reunionsRes,
    continuitatRes,
  ] = await Promise.all([
    supabase
      .from("pi_dades_materies")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_dades_professionals")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_orientacions")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_comp_transversals")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_seguiment_signatures")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_seguiment_reunions")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_seguiment_continuitat")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
  ]);

  const materies = materiesRes.data || [];
  const professionals = professionalsRes.data || [];
  const orientacions = orientacionsRes.data || [];
  const compTransversals = compTransversalsRes.data || [];
  const signatures = signaturesRes.data || [];
  const reunions = reunionsRes.data || [];
  const continuitat = continuitatRes.data || [];

  // Fetch materia child tables
  const materiaIds = materies.map((m: any) => m.id);
  let materiaMesures: Record<string, any[]> = {};
  let materiaCurriculum: Record<string, any[]> = {};

  if (materiaIds.length > 0) {
    const [mesuresRes, curriculumRes] = await Promise.all([
      supabase
        .from("pi_materia_mesures")
        .select("*")
        .in("pi_materia_id", materiaIds)
        .order("sort_order"),
      supabase
        .from("pi_materia_curriculum")
        .select("*")
        .in("pi_materia_id", materiaIds)
        .order("sort_order"),
    ]);

    for (const m of mesuresRes.data || []) {
      if (!materiaMesures[m.pi_materia_id])
        materiaMesures[m.pi_materia_id] = [];
      materiaMesures[m.pi_materia_id].push(m);
    }
    for (const c of curriculumRes.data || []) {
      if (!materiaCurriculum[c.pi_materia_id])
        materiaCurriculum[c.pi_materia_id] = [];
      materiaCurriculum[c.pi_materia_id].push(c);
    }
  }

  // Fetch curriculum config for CE color mapping
  const { data: curriculumConfig } = await supabase
    .from("pi_config_curriculum")
    .select("subject, level, entry_type, code, parent_code, short_text, full_text")
    .in("entry_type", ["COMP_ESPEC", "CRIT"])
    .order("sort_order");

  // Build helpers: CE code → color index, and criteri parent_code lookup
  function buildCEColorMap(subject: string, level: string): Map<string, [number, number, number]> {
    const map = new Map<string, [number, number, number]>();
    const comps = (curriculumConfig || []).filter(
      (c: any) => c.subject === subject && c.level === level && c.entry_type === "COMP_ESPEC"
    );
    comps.forEach((c: any, i: number) => {
      map.set(c.code, CE_RGB_PALETTE[i % CE_RGB_PALETTE.length]);
    });
    return map;
  }

  function getCritParentCode(subject: string, level: string, critShort: string): string | null {
    const match = (curriculumConfig || []).find(
      (c: any) =>
        c.subject === subject &&
        c.level === level &&
        c.entry_type === "CRIT" &&
        (c.short_text === critShort || c.full_text === critShort)
    );
    return match?.parent_code || null;
  }

  // Fetch transversals config for area color mapping in comp transversals
  const { data: transversalsConfig } = await supabase
    .from("pi_config_transversals")
    .select("area, group_name, espec_short, crit_short");

  /** Derive group_name from nivell (same logic as frontend) */
  function getGroupName(nivell: string): string | null {
    const prefix = nivell.charAt(0);
    const num = parseInt(nivell.substring(1));
    if (prefix === "P") {
      if (num <= 2) return "P1-P2";
      if (num <= 4) return "P3-P4";
      return "P5-P6";
    }
    if (prefix === "S") {
      if (num <= 2) return "S1-S2";
      return "S3-S4";
    }
    return null;
  }

  /** Find which area a competència belongs to */
  function findAreaForEspec(espec: string, groupName: string | null): string | null {
    if (!groupName || !transversalsConfig) return null;
    for (const t of transversalsConfig) {
      if (t.group_name === groupName && (t as any).espec_short === espec) return t.area;
    }
    return null;
  }

  /** Find which area a criteri belongs to */
  function findAreaForCrit(crit: string, groupName: string | null): string | null {
    if (!groupName || !transversalsConfig) return null;
    for (const t of transversalsConfig) {
      if (t.group_name === groupName && (t as any).crit_short === crit) return t.area;
    }
    return null;
  }

  // ── Load logo ──
  let logoDataUrl: string | null = null;
  try {
    const logoPath = join(process.cwd(), "public", "logo.png");
    const buf = readFileSync(logoPath);
    logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    // Logo not found
  }

  // ── Build PDF ──
  const pdf = new PDFBuilder();
  const { doc } = pdf;

  // ─── Header ───
  if (logoDataUrl) {
    const logoW = 45;
    const logoH = logoW * (127 / 550);
    doc.addImage(logoDataUrl, "PNG", pdf.M, pdf.y, logoW, logoH);
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(97, 153, 141);
  doc.text("Plantilla PI", pdf.M + pdf.CW, pdf.y + 5, { align: "right" });

  doc.setFontSize(12);
  doc.text(
    `${student.last_name}, ${student.first_name}`,
    pdf.M + pdf.CW,
    pdf.y + 11,
    { align: "right" }
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  const mesuraLabel =
    MESURA_NESE_LABELS[neseData?.mesura_nese || ""] || "PI";
  doc.text(
    `${student.class_name} \u00b7 ${mesuraLabel} \u00b7 Curs ${yearName}`,
    pdf.M + pdf.CW,
    pdf.y + 16,
    { align: "right" }
  );
  doc.text(
    new Date().toLocaleDateString("ca-ES"),
    pdf.M + pdf.CW,
    pdf.y + 20,
    { align: "right" }
  );

  pdf.y += 24;
  doc.setDrawColor(97, 153, 141);
  doc.setLineWidth(0.5);
  doc.line(pdf.M, pdf.y, pdf.M + pdf.CW, pdf.y);
  pdf.y += 6;

  // ═══════════════════════════════════════════════════
  // SECTION 1: DADES
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("1. Dades");

  pdf.subHeader("Mesures pr\u00e8vies rebudes");
  pdf.inlineRow([
    { label: "Universal", value: boolText(piDocument.prev_universal) },
    { label: "Addicional", value: boolText(piDocument.prev_addicional) },
    { label: "Intensiu", value: boolText(piDocument.prev_intensiu) },
  ]);

  pdf.subHeader("Mat\u00e8ries amb PI");
  if (materies.length === 0) {
    pdf.emptyMessage("No hi ha mat\u00e8ries configurades.");
  } else {
    pdf.compactTable(
      ["Mat\u00e8ria", "Docent", "Nivell", "Observacions"],
      materies.map((m: any) => [
        m.materia || "-",
        m.docent || "-",
        m.nivell || "-",
        m.observacions || "-",
      ]),
      [50, 45, 25, 60]
    );
  }

  pdf.subHeader("Professionals que intervenen");
  if (professionals.length === 0) {
    pdf.emptyMessage("No hi ha professionals registrats.");
  } else {
    pdf.compactTable(
      ["Professional", "Nom", "Contacte", "Notes"],
      professionals.map((p: any) => [
        p.professional || "-",
        p.nom || "-",
        p.contacte || "-",
        p.notes || "-",
      ]),
      [40, 45, 45, 50]
    );
  }
  pdf.gap(4);

  // ═══════════════════════════════════════════════════
  // SECTION 2: JUSTIFICACI\u00d3
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("2. Justificaci\u00f3");

  pdf.subHeader("Motius");
  const motius = [
    { label: "NEE", value: piDocument.just_nee },
    { label: "DEA (disl\u00e8xia, discalc\u00falia...)", value: piDocument.just_dea },
    {
      label: "Trastorns neurodesenvolupament (TDAH, TEA, TEL/TDL...)",
      value: piDocument.just_tea,
    },
    { label: "Alumnat nouvingut", value: piDocument.just_nouvingut },
    { label: "Altes capacitats", value: piDocument.just_altes_cap },
    { label: "Situaci\u00f3 personal/social", value: piDocument.just_social },
    { label: "Altres", value: piDocument.just_altres },
  ];
  const activeMotius = motius.filter((m) => m.value).map((m) => m.label);
  if (activeMotius.length > 0) {
    pdf.bulletList(activeMotius);
  } else {
    pdf.emptyMessage("Cap motiu seleccionat.");
  }

  pdf.inlineRow([
    { label: "Model PI", value: piDocument.model || "-" },
  ]);

  pdf.textField("Justificaci\u00f3", piDocument.just_text);
  pdf.gap(4);

  // ═══════════════════════════════════════════════════
  // SECTION 3: ORIENTACIONS
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("3. Orientacions generals");

  if (orientacions.length === 0) {
    pdf.emptyMessage("No hi ha orientacions configurades.");
  } else {
    // Group by tipus
    const byTipus: Record<string, string[]> = {};
    for (const o of orientacions) {
      const t = (o as any).tipus || "Altres";
      if (!byTipus[t]) byTipus[t] = [];
      byTipus[t].push((o as any).mesura);
    }
    for (const [tipus, mesures] of Object.entries(byTipus)) {
      pdf.subHeader(tipus);
      pdf.bulletList(mesures);
    }
  }

  pdf.textField(
    "Altres orientacions",
    piDocument.altres_orientacions
  );
  pdf.gap(4);

  // ═══════════════════════════════════════════════════
  // SECTION 4: COMP. TRANSVERSALS
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("4. Compet\u00e8ncies transversals");

  if (compTransversals.length === 0) {
    pdf.emptyMessage("No hi ha compet\u00e8ncies transversals configurades.");
  } else {
    for (const ct of compTransversals) {
      const row = ct as any;
      pdf.checkPage(20);
      const rowAreas: string[] = Array.isArray(row.area) ? row.area : [];
      const groupName = row.nivell ? getGroupName(row.nivell) : null;

      pdf.inlineRow(
        [
          { label: "Nivell", value: row.nivell || "-" },
          {
            label: "Avaluaci\u00f3",
            value: AVAL_LABELS[row.avaluacio] || row.avaluacio || "-",
          },
        ],
        4
      );

      // Àrees — colored
      if (rowAreas.length > 0) {
        pdf.labeledColorList(
          "\u00c0rees",
          rowAreas.map((a: string) => ({ text: a, rgb: AREA_RGB[a] || DEFAULT_RGB }))
        );
      }

      // Competències — each colored by its own area
      const especItems = Array.isArray(row.especifica) && row.especifica.length > 0
        ? row.especifica.map((e: string) => {
            const area = findAreaForEspec(e, groupName);
            return { text: e, rgb: area ? (AREA_RGB[area] || DEFAULT_RGB) : DEFAULT_RGB };
          })
        : [];
      if (especItems.length > 0) {
        pdf.labeledColorList("Compet\u00e8ncia espec\u00edfica", especItems);
      }

      // Criteris — each colored by its area (via crit_short lookup)
      if (Array.isArray(row.criteris) && row.criteris.length > 0) {
        const critItems = row.criteris.map((c: any) => {
          const critText = c.short || c.full || "-";
          const area = findAreaForCrit(critText, groupName);
          return { text: critText, rgb: area ? (AREA_RGB[area] || DEFAULT_RGB) : DEFAULT_RGB };
        });
        pdf.labeledColorList("Criteris d'avaluaci\u00f3", critItems);
      }

      // Sabers — always Digital (purple)
      if (Array.isArray(row.sabers) && row.sabers.length > 0) {
        const saberItems = row.sabers.map((s: any) => ({
          text: s.short || s.full || "-",
          rgb: AREA_RGB["Digital"] || DEFAULT_RGB,
        }));
        pdf.labeledColorList("Sabers (Digital)", saberItems);
      }

      // Separator line between rows
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.1);
      doc.line(pdf.M, pdf.y, pdf.M + pdf.CW, pdf.y);
      pdf.y += 3;
    }
  }
  pdf.gap(4);

  // ═══════════════════════════════════════════════════
  // SECTION 5: HORARI
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("5. Horari i suports");

  const horari = piDocument.horari;
  if (!horari || typeof horari !== "object") {
    pdf.emptyMessage("No hi ha horari configurat.");
  } else {
    const days = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];
    const slots = [
      "8-9",
      "9-10",
      "10-10:30",
      "10:30-12",
      "12-13",
      "13-14",
      "15-16",
      "16-17",
    ];

    // Build table
    const headers = ["Hora", ...days];
    const colWidths = [22, ...days.map(() => (pdf.CW - 22) / 5)];
    const rows: string[][] = [];

    for (const slot of slots) {
      const row = [slot];
      for (const day of days) {
        // horari is stored as { slot: { day: value } }
        const slotData = horari[slot];
        row.push(
          (slotData && typeof slotData === "object" ? slotData[day] : "") || ""
        );
      }
      rows.push(row);
    }

    pdf.compactTable(headers, rows, colWidths);
  }
  pdf.gap(4);

  // ═══════════════════════════════════════════════════
  // SECTION 6: SEGUIMENT
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("6. Seguiment");

  // Signatures
  pdf.subHeader("Conformitat");
  if (signatures.length === 0) {
    pdf.emptyMessage("No hi ha signatures registrades.");
  } else {
    pdf.compactTable(
      ["Rol", "Nom", "Data"],
      signatures.map((s: any) => [
        s.rol || "-",
        s.nom || "-",
        s.data_signatura || "-",
      ]),
      [50, 70, 60]
    );
  }

  // Reunions
  pdf.subHeader("Reunions de seguiment");
  if (reunions.length === 0) {
    pdf.emptyMessage("No hi ha reunions registrades.");
  } else {
    pdf.compactTable(
      ["Data", "Assistents", "Acords", "Proper pas"],
      reunions.map((r: any) => [
        r.data_reunio || "-",
        r.assistents || "-",
        r.acords || "-",
        r.proper_pas || "-",
      ]),
      [25, 50, 55, 50]
    );
  }

  // Continuitat
  pdf.subHeader("Continu\u00eftat del PI");
  if (continuitat.length === 0) {
    pdf.emptyMessage("No hi ha decisions de continu\u00eftat.");
  } else {
    pdf.compactTable(
      ["Data", "Decisi\u00f3", "Motiu", "Responsable"],
      continuitat.map((c: any) => [
        c.data_decisio || "-",
        c.decisio || "-",
        c.motiu || "-",
        c.responsable || "-",
      ]),
      [25, 40, 65, 50]
    );
  }
  pdf.gap(4);

  // ═══════════════════════════════════════════════════
  // SECTIONS MAT_*: Per-subject PI
  // ═══════════════════════════════════════════════════
  for (const mat of materies) {
    const m = mat as any;
    pdf.sectionHeader(`MAT: ${m.materia}`);

    pdf.inlineRow([
      { label: "Docent", value: m.docent || "-" },
      { label: "Nivell", value: m.nivell || "-" },
    ]);
    if (m.observacions) {
      pdf.textField("Observacions", m.observacions);
    }

    // Mesures
    const mesures = materiaMesures[m.id] || [];
    pdf.subHeader("Mesures i suports");
    if (mesures.length === 0) {
      pdf.emptyMessage("No hi ha mesures configurades.");
    } else {
      for (const mes of mesures) {
        const mesItems =
          Array.isArray(mes.mesures) && mes.mesures.length > 0
            ? mes.mesures.join(", ")
            : "-";
        pdf.inlineRow(
          [
            { label: "Tipus", value: mes.tipus || "-" },
            { label: "Mesures", value: mesItems },
          ],
          2
        );
        if (mes.observacions) {
          pdf.textField("Observacions", mes.observacions);
        }
      }
    }

    // Curriculum
    const curriculum = materiaCurriculum[m.id] || [];
    const ceColorMap = buildCEColorMap(m.materia, curriculum[0]?.nivell || "");
    pdf.subHeader("Graella curricular");
    if (curriculum.length === 0) {
      pdf.emptyMessage("No hi ha entrades curriculars.");
    } else {
      for (const cur of curriculum) {
        pdf.checkPage(25);
        // Rebuild CE color map if nivell changes
        const curCEMap = buildCEColorMap(m.materia, cur.nivell || "");

        // Competències — colored
        const compCodes: string[] = Array.isArray(cur.competencia) ? cur.competencia
          : typeof cur.competencia === "string" ? [cur.competencia] : [];
        const compColorItems = compCodes.map((code: string) => {
          // Look up short description for this CE code
          const compEntry = (curriculumConfig || []).find(
            (c: any) =>
              c.subject === m.materia &&
              c.level === cur.nivell &&
              c.entry_type === "COMP_ESPEC" &&
              c.code === code
          );
          const label = compEntry
            ? `${code} — ${compEntry.short_text || compEntry.full_text}`
            : code;
          return { text: label, rgb: curCEMap.get(code) || DEFAULT_RGB };
        });

        pdf.inlineRow(
          [
            { label: "Nivell", value: cur.nivell || "-" },
            {
              label: "Avaluaci\u00f3",
              value: AVAL_LABELS[cur.avaluacio] || cur.avaluacio || "-",
            },
          ],
          4
        );

        if (compColorItems.length > 0) {
          pdf.labeledColorList("Compet\u00e8ncies espec\u00edfiques", compColorItems);
        }

        if (
          cur.criteris &&
          Array.isArray(cur.criteris) &&
          cur.criteris.length > 0
        ) {
          const critColorItems = cur.criteris.map((c: any) => {
            const critText = c.short || c.full || "-";
            const parentCode = getCritParentCode(m.materia, cur.nivell, critText);
            return {
              text: critText,
              rgb: parentCode ? (curCEMap.get(parentCode) || DEFAULT_RGB) : DEFAULT_RGB,
            };
          });
          pdf.labeledColorList("Criteris d'avaluaci\u00f3", critColorItems);
        }
        if (
          cur.sabers &&
          Array.isArray(cur.sabers) &&
          cur.sabers.length > 0
        ) {
          pdf.labeledList(
            "Sabers prioritzats",
            cur.sabers.map((s: any) => s.short || s.full || "-")
          );
        }
        if (
          cur.instruments &&
          Array.isArray(cur.instruments) &&
          cur.instruments.length > 0
        ) {
          pdf.labeledList(
            "Instruments d'avaluaci\u00f3",
            cur.instruments
          );
        }

        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.1);
        doc.line(pdf.M, pdf.y, pdf.M + pdf.CW, pdf.y);
        pdf.y += 3;
      }
    }

    pdf.gap(4);
  }

  // ── Output PDF ──
  const pdfBuffer = pdf.output();

  const safeFileName =
    `pi-${student.last_name}-${student.first_name}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName}.pdf"`,
    },
  });
}
