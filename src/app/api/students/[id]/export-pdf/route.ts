import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import { join } from "path";

/* ── Enum display labels ── */
const ENUM_LABELS: Record<string, Record<string, string>> = {
  estat: { resolt: "Resolt", pendent: "Pendent" },
  informe_eap: {
    sense_informe: "Sense informe",
    nese_annex1: "NESE (Annex 1)",
    nee_annex1i2: "NEE (Annex 1 i 2)",
  },
  nise: { nise: "NISE", sls: "SLS", no: "No" },
  mesura_nese: {
    pi: "PI",
    pi_curricular: "PI curricular",
    pi_no_curricular: "PI no curricular",
    pi_nouvingut: "PI nouvingut",
    dua_misu: "DUA / MISU",
    no_mesures: "Sense mesures",
  },
  beca_mec: {
    sollicitada_curs_actual: "Sol\u00b7licitada curs actual",
    candidat_proper_curs: "Candidat proper curs",
    no_candidat_mec: "No candidat MEC",
  },
};

function enumLabel(field: string, value: string | null): string {
  if (!value) return "-";
  return ENUM_LABELS[field]?.[value] || value;
}

function boolText(v: boolean | null | undefined): string {
  return v ? "S\u00ed" : "No";
}

/* ── PDF builder helpers ── */
class PDFBuilder {
  doc: jsPDF;
  y: number;
  readonly M = 15; // margin
  readonly CW = 180; // content width (210 - 2*15)
  readonly PH = 297; // page height

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

  /** Main section header with green background */
  sectionHeader(title: string) {
    this.checkPage(14);
    this.doc.setFillColor(97, 153, 141); // #61998D - color oficial escola
    this.doc.rect(this.M, this.y, this.CW, 8, "F");
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.M + 4, this.y + 5.5);
    this.doc.setTextColor(0, 0, 0);
    this.y += 12;
  }

  /** Subsection title with subtle line */
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

  /** Row of inline label-value pairs */
  inlineRow(
    fields: { label: string; value: string }[],
    cols?: number
  ) {
    const numCols = cols || fields.length;
    const colW = this.CW / numCols;
    this.checkPage(13);

    // Labels
    this.doc.setFontSize(7.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    for (let i = 0; i < fields.length; i++) {
      this.doc.text(fields[i].label, this.M + i * colW, this.y + 3);
    }
    this.y += 5;

    // Values
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(33, 37, 41);
    for (let i = 0; i < fields.length; i++) {
      const val = fields[i].value || "-";
      // Truncate if too long for column
      const maxW = colW - 2;
      const truncated = this.doc.splitTextToSize(val, maxW)[0] || val;
      this.doc.text(truncated, this.M + i * colW, this.y + 3.5);
    }
    this.doc.setTextColor(0, 0, 0);
    this.y += 7;
  }

  /** Full-width text field with label and potentially multi-line value */
  textField(label: string, value: string | null) {
    this.checkPage(14);

    // Label
    this.doc.setFontSize(7.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(label, this.M, this.y + 3);
    this.y += 5;

    // Value
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

  /** Italic placeholder text */
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

  gap(size = 4) {
    this.y += size;
  }

  output(): ArrayBuffer {
    return this.doc.output("arraybuffer");
  }
}

/* ── Main route ── */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  // ── Fetch data ──
  const { data: yearData } = await supabase
    .from("clickedu_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  const { data: student } = await supabase
    .from("clickedu_students")
    .select("*")
    .eq("id", id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Alumne no trobat" }, { status: 404 });
  }

  let yearlyData: Record<string, any> | null = null;
  if (yearData) {
    const { data } = await supabase
      .from("student_yearly_data")
      .select("*")
      .eq("student_id", id)
      .eq("school_year_id", yearData.id)
      .single();
    yearlyData = data;
  }

  let neseData: Record<string, any> | null = null;
  if (yearData) {
    const { data } = await supabase
      .from("student_nese_data")
      .select("*")
      .eq("student_id", id)
      .eq("school_year_id", yearData.id)
      .single();
    neseData = data;
  }

  const { data: allYearlyData } = await supabase
    .from("student_yearly_data")
    .select("*, clickedu_years(name)")
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  // Etapa
  const cn = student.class_name || "";
  let etapaLabel = "Secund\u00e0ria";
  if (cn.startsWith("I")) etapaLabel = "Infantil";
  else if (cn.startsWith("P")) etapaLabel = "Prim\u00e0ria";

  // ── Load logo ──
  let logoDataUrl: string | null = null;
  try {
    const logoPath = join(process.cwd(), "public", "logo.png");
    const buf = readFileSync(logoPath);
    logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    // Logo not found, continue without it
  }

  // ── Build PDF ──
  const pdf = new PDFBuilder();
  const { doc } = pdf;

  // ─── Header ───
  if (logoDataUrl) {
    const logoW = 45;
    const logoH = logoW * (127 / 550); // keep aspect ratio
    doc.addImage(logoDataUrl, "PNG", pdf.M, pdf.y, logoW, logoH);
  }

  // Student name (right-aligned)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(97, 153, 141); // #61998D
  doc.text(
    `${student.last_name}, ${student.first_name}`,
    pdf.M + pdf.CW,
    pdf.y + 5,
    { align: "right" }
  );

  // Meta line
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(
    `${student.class_name} \u00b7 ${etapaLabel} \u00b7 Curs ${yearData?.name || "-"}`,
    pdf.M + pdf.CW,
    pdf.y + 10,
    { align: "right" }
  );
  doc.text(
    new Date().toLocaleDateString("ca-ES"),
    pdf.M + pdf.CW,
    pdf.y + 14,
    { align: "right" }
  );

  pdf.y += 18;

  // Separator
  doc.setDrawColor(97, 153, 141); // #61998D
  doc.setLineWidth(0.5);
  doc.line(pdf.M, pdf.y, pdf.M + pdf.CW, pdf.y);
  pdf.y += 6;

  // ═══════════════════════════════════════════════════
  // SECTION 1: Trasp\u00e0s de tutoria
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("Trasp\u00e0s de tutoria - Dades b\u00e0siques");

  pdf.inlineRow([
    { label: "Estat", value: enumLabel("estat", yearlyData?.estat) },
    { label: "Graella NESE", value: boolText(yearlyData?.graella_nese) },
    {
      label: "Curs repetici\u00f3",
      value: yearlyData?.curs_repeticio || "-",
    },
  ]);

  pdf.textField(
    "Dades familiars rellevants",
    yearlyData?.dades_familiars
  );
  pdf.textField("Acad\u00e8mic", yearlyData?.academic);
  pdf.textField(
    "Comportament / Conviv\u00e8ncia",
    yearlyData?.comportament
  );
  pdf.textField("Acords des de Tutoria", yearlyData?.acords_tutoria);
  pdf.textField("Observacions", yearlyData?.observacions);
  pdf.gap(4);

  // ═══════════════════════════════════════════════════
  // SECTION 2: Dades NESE
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("Dades NESE");

  if (neseData) {
    // ── Dades administratives ──
    pdf.subHeader("Dades administratives");
    pdf.inlineRow(
      [
        {
          label: "Data incorporaci\u00f3",
          value: neseData.data_incorporacio || "-",
        },
        { label: "SSD", value: boolText(neseData.ssd) },
      ],
      3
    );
    pdf.textField(
      "Escolaritzaci\u00f3 pr\u00e8via",
      neseData.escolaritzacio_previa
    );
    pdf.gap(2);

    // ── Seguiment POE / MESI ──
    pdf.subHeader("Seguiment POE / MESI");
    pdf.inlineRow(
      [
        { label: "Reuni\u00f3 POE", value: boolText(neseData.reunio_poe) },
        { label: "Reuni\u00f3 MESI", value: boolText(neseData.reunio_mesi) },
        { label: "Reuni\u00f3 EAP", value: boolText(neseData.reunio_eap) },
      ],
      4
    );
    pdf.inlineRow([
      {
        label: "Informe EAP",
        value: enumLabel("informe_eap", neseData.informe_eap),
      },
      { label: "NISE", value: enumLabel("nise", neseData.nise) },
      {
        label: "Mesura NESE",
        value: enumLabel("mesura_nese", neseData.mesura_nese),
      },
      { label: "Beca MEC", value: enumLabel("beca_mec", neseData.beca_mec) },
    ]);
    pdf.gap(2);

    // ── Seguiment tutoria ──
    pdf.subHeader("Seguiment tutoria");
    pdf.inlineRow([
      { label: "CAD %", value: neseData.cad_percentatge || "-" },
      {
        label: "CAD data venciment",
        value: neseData.cad_data_venciment || "-",
      },
      { label: "Curs retenci\u00f3", value: neseData.curs_retencio || "-" },
    ]);

    pdf.textField("Informe diagn\u00f2stic", neseData.informe_diagnostic);
    pdf.textField("Mat\u00e8ries PI", neseData.materies_pi);
    pdf.textField("Eixos PI", neseData.eixos_pi);
    pdf.textField("NAC PI", neseData.nac_pi);
    pdf.textField("NAC Final", neseData.nac_final);
    pdf.textField("Serveis externs actuals", neseData.serveis_externs);
    pdf.textField("Observacions curs actual", neseData.observacions_curs);
    pdf.textField(
      "Dades rellevants (Hist\u00f2ric)",
      neseData.dades_rellevants_historic
    );
  } else {
    pdf.emptyMessage("No hi ha dades NESE per aquest curs.");
  }

  pdf.gap(4);

  // ═══════════════════════════════════════════════════
  // SECTION 3: Evoluci\u00f3
  // ═══════════════════════════════════════════════════
  pdf.sectionHeader("Evoluci\u00f3 per cursos");

  const yearlyArr = allYearlyData || [];
  if (yearlyArr.length === 0) {
    pdf.emptyMessage("No hi ha dades d'evoluci\u00f3 disponibles.");
  } else {
    for (const yd of yearlyArr) {
      const yearName =
        (yd as any).clickedu_years?.name || "Desconegut";

      pdf.checkPage(20);

      // Year card header
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(33, 37, 41);
      let headerParts = [`Curs ${yearName}`];
      if (yd.graella_nese) headerParts.push("[NESE]");
      if (yd.estat)
        headerParts.push(
          yd.estat === "resolt" ? "[Resolt]" : "[Pendent]"
        );
      if (yd.curs_repeticio)
        headerParts.push(`[Rep: ${yd.curs_repeticio}]`);
      doc.text(headerParts.join("  "), pdf.M, pdf.y + 3.5);
      doc.setTextColor(0, 0, 0);
      pdf.y += 6;

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.line(pdf.M, pdf.y, pdf.M + pdf.CW, pdf.y);
      pdf.y += 3;

      const evoFields = [
        { label: "Dades familiars", value: yd.dades_familiars },
        { label: "Acad\u00e8mic", value: yd.academic },
        { label: "Comportament", value: yd.comportament },
        { label: "Acords tutoria", value: yd.acords_tutoria },
        { label: "Observacions", value: yd.observacions },
      ];

      const filled = evoFields.filter((f) => f.value);
      if (filled.length === 0) {
        pdf.emptyMessage("Sense dades registrades");
      } else {
        for (const f of filled) {
          pdf.textField(f.label, f.value);
        }
      }

      pdf.gap(4);
    }
  }

  // ── Output PDF ──
  const pdfBuffer = pdf.output();

  // Sanitize filename (remove accents for safe Content-Disposition)
  const safeFileName = `fitxa-${student.last_name}-${student.first_name}`
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
