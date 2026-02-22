/**
 * Import students data from Excel files into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-students-excel.ts --type traspass --etapa infantil --file "docs/examples/INF - ..."
 *   npx tsx scripts/import-students-excel.ts --type nese --etapa eso --file "docs/examples/ESO_Alumnat NESE ..."
 *   npx tsx scripts/import-students-excel.ts --all   (imports all 6 files)
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Config ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE / SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Etapa = "infantil" | "primaria" | "eso";
type ImportType = "traspass" | "nese";

interface StudentRow {
  name: string;
  sheetName: string;
  data: Record<string, string | boolean | Date | null>;
}

interface UnmatchedStudent {
  name: string;
  sheet: string;
  file: string;
  data: Record<string, string | boolean | Date | null>;
}

// --- Cell value extraction ---
function cellValue(cell: ExcelJS.CellValue): string {
  if (cell === undefined || cell === null) return "";
  if (typeof cell === "boolean") return cell ? "true" : "false";
  if (cell instanceof Date) return cell.toISOString().split("T")[0];
  if (typeof cell === "number") return String(cell);
  if (typeof cell === "object") {
    if ("richText" in cell && Array.isArray((cell as any).richText)) {
      return ((cell as any).richText as { text: string }[]).map((r) => String(r.text ?? "")).join("").trim();
    }
    if ("text" in cell) {
      const t = (cell as any).text;
      return typeof t === "string" ? t.trim() : String(t ?? "").trim();
    }
    if ("result" in cell) {
      const r = (cell as any).result;
      if (r === undefined || r === null) return "";
      if (typeof r === "boolean") return r ? "true" : "false";
      if (r instanceof Date) return r.toISOString().split("T")[0];
      return String(r).trim();
    }
    return String(cell).trim();
  }
  return String(cell).trim();
}

function cellBool(cell: ExcelJS.CellValue): boolean {
  const v = cellValue(cell).toLowerCase();
  return v === "true" || v === "sí" || v === "si" || v === "x" || v === "yes";
}

function cellDate(cell: ExcelJS.CellValue): string | null {
  if (cell instanceof Date) return cell.toISOString().split("T")[0];
  const v = cellValue(cell);
  if (!v) return null;
  // Try to parse dd/mm/yyyy
  const match = v.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

// --- Name normalization for fuzzy matching ---
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// --- Parse Traspàs sheets ---
function parseTraspassSheet(
  sheet: ExcelJS.Worksheet,
  sheetName: string
): StudentRow[] {
  const rows: StudentRow[] = [];

  // Find header row (looking for "NOM" in columns A-E)
  let headerRowNum = 0;
  let nomColOffset = 0; // How much columns are shifted vs expected layout
  for (let r = 1; r <= 15; r++) {
    for (let c = 1; c <= 5; c++) {
      const val = cellValue(sheet.getRow(r).getCell(c).value);
      if (val.toUpperCase() === "NOM") {
        headerRowNum = r;
        nomColOffset = c - 2; // 0 if NOM is at col B (expected), -1 if at col A
        break;
      }
    }
    if (headerRowNum) break;
  }
  if (!headerRowNum) {
    console.warn(`  [WARN] No header found in sheet "${sheetName}"`);
    return rows;
  }

  // Map headers (detect column positions dynamically)
  const headerRow = sheet.getRow(headerRowNum);
  const colMap: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const h = cellValue(cell.value).toUpperCase().trim();
    if (h === "NOM") colMap["nom"] = col;
    if (h.includes("GRAELLA NESE")) colMap["graella_nese"] = col;
    if (h.includes("CURS") && h.includes("REPETI")) colMap["curs_repeticio"] = col;
    if (h.includes("DADES FAMILIARS")) colMap["dades_familiars"] = col;
    if (h.includes("ACADÈMIC") || h === "ACADEMIC") colMap["academic"] = col;
    if (h.includes("COMPORTAMENT")) colMap["comportament"] = col;
    if (h.includes("ACORDS")) colMap["acords_tutoria"] = col;
    if (h === "ESTAT") colMap["estat"] = col;
    if (h.includes("OBSERVAC")) colMap["observacions"] = col;
  });

  // Parse data rows
  for (let r = headerRowNum + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = cellValue(row.getCell(colMap["nom"] || 2).value);

    // Skip empty rows and example rows
    if (!name) continue;
    // Check for "exemple" marker - column may shift with layout offset
    const exampleColIdx = 11 + nomColOffset;
    if (exampleColIdx > 0) {
      const exampleCol = row.getCell(exampleColIdx);
      if (cellValue(exampleCol?.value).toLowerCase().includes("exemple")) continue;
    }

    const data: Record<string, string | boolean | Date | null> = {
      graella_nese: colMap["graella_nese"] ? cellBool(row.getCell(colMap["graella_nese"]).value) : false,
      curs_repeticio: colMap["curs_repeticio"] ? cellValue(row.getCell(colMap["curs_repeticio"]).value) || null : null,
      dades_familiars: colMap["dades_familiars"] ? cellValue(row.getCell(colMap["dades_familiars"]).value) || null : null,
      academic: colMap["academic"] ? cellValue(row.getCell(colMap["academic"]).value) || null : null,
      comportament: colMap["comportament"] ? cellValue(row.getCell(colMap["comportament"]).value) || null : null,
      acords_tutoria: colMap["acords_tutoria"] ? cellValue(row.getCell(colMap["acords_tutoria"]).value) || null : null,
      estat: colMap["estat"] ? cellValue(row.getCell(colMap["estat"]).value) || null : null,
      observacions: colMap["observacions"] ? cellValue(row.getCell(colMap["observacions"]).value) || null : null,
    };

    // Normalize estat
    if (data.estat && typeof data.estat === "string") {
      const e = data.estat.toLowerCase().trim();
      data.estat = e.includes("resolt") ? "resolt" : e.includes("pendent") ? "pendent" : null;
    }

    rows.push({ name, sheetName, data });
  }

  return rows;
}

// --- Parse NESE sheets ---
function parseNeseSheet(
  sheet: ExcelJS.Worksheet,
  sheetName: string,
  etapa: Etapa
): StudentRow[] {
  const rows: StudentRow[] = [];

  // Find header row (looking for "ALUMNE" or "NOM" in first cols)
  let headerRowNum = 0;
  for (let r = 1; r <= 10; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= 5; c++) {
      const val = cellValue(row.getCell(c).value).toUpperCase();
      if (val.includes("ALUMNE") || val === "NOM") {
        headerRowNum = r;
        break;
      }
    }
    if (headerRowNum) break;
  }
  if (!headerRowNum) {
    console.warn(`  [WARN] No header found in NESE sheet "${sheetName}"`);
    return rows;
  }

  // Map headers dynamically
  const headerRow = sheet.getRow(headerRowNum);
  // Also check the next row (sometimes split headers)
  const subHeaderRow = sheet.getRow(headerRowNum + 1);
  const colMap: Record<string, number> = {};

  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const h = cellValue(cell.value).toUpperCase().trim();
    if (h.includes("ALUMNE") || h === "NOM") colMap["nom"] = col;
    if (h.includes("DATA") && h.includes("INCORPORA")) colMap["data_incorporacio"] = col;
    if (h.includes("ESCOLARITZA")) colMap["escolaritzacio_previa"] = col;
    if (h.includes("REUNIÓ") || h.includes("REUNIO")) {
      const sub = cellValue(subHeaderRow?.getCell(col).value).toUpperCase();
      if (sub.includes("POE")) colMap["reunio_poe"] = col;
      else if (sub.includes("MESI")) colMap["reunio_mesi"] = col;
      else if (sub.includes("EAP")) colMap["reunio_eap"] = col;
      // Fallback: check the header itself
      else if (h.includes("POE")) colMap["reunio_poe"] = col;
      else if (h.includes("MESI")) colMap["reunio_mesi"] = col;
      else if (h.includes("EAP")) colMap["reunio_eap"] = col;
    }
    if (h.includes("INFORME EAP")) colMap["informe_eap"] = col;
    if (h.includes("CAD")) colMap["cad"] = col;
    if (h.includes("INFORME DIAGNÒSTIC") || h.includes("INFORME DIAGNOSTIC")) colMap["informe_diagnostic"] = col;
    if (h.includes("CURS") && (h.includes("RETENCI") || h.includes("RETENCIO"))) colMap["curs_retencio"] = col;
    if (h === "NISE" || h.includes("NISE")) colMap["nise"] = col;
    if (h === "SSD" || h.includes("SSD")) colMap["ssd"] = col;
    if (h.includes("MESURA NESE")) colMap["mesura_nese"] = col;
    if (h.includes("MATÈRIES") || h.includes("MATERIES") || h.includes("ÀMBITS") || h.includes("AMBITS")) colMap["materies_pi"] = col;
    if (h.includes("EIXOS")) colMap["eixos_pi"] = col;
    if (h.includes("NAC PI") || (h.includes("NAC") && h.includes("PI"))) colMap["nac_pi"] = col;
    if (h.includes("NAC FINAL") || (h.includes("NAC") && h.includes("FINAL"))) colMap["nac_final"] = col;
    if (h.includes("SERVEIS EXTERNS")) colMap["serveis_externs"] = col;
    if (h.includes("BECA MEC") || h.includes("BECA")) colMap["beca_mec"] = col;
    if (h.includes("OBSERVACIONS CURS") || h.includes("OBSERVAC")) colMap["observacions_curs"] = col;
    if (h.includes("DADES RELLEVANTS") || h.includes("HISTÒRIC") || h.includes("HISTORIC")) colMap["dades_rellevants_historic"] = col;
  });

  // If reunio columns not found, try scanning the subheader
  if (!colMap["reunio_poe"] || !colMap["reunio_mesi"] || !colMap["reunio_eap"]) {
    // Scan a different approach: find "REUNIÓ AMB" merged headers and check subheaders
    for (let c = 1; c <= 30; c++) {
      const h = cellValue(headerRow.getCell(c).value).toUpperCase();
      const sub = cellValue(subHeaderRow?.getCell(c).value).toUpperCase();
      if (sub === "POE") colMap["reunio_poe"] = c;
      if (sub === "MESI") colMap["reunio_mesi"] = c;
      if (sub === "EAP") colMap["reunio_eap"] = c;
    }
  }

  // Parse data rows
  const dataStartRow = subHeaderRow ? headerRowNum + 2 : headerRowNum + 1;
  for (let r = dataStartRow; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = cellValue(row.getCell(colMap["nom"] || 2).value);
    if (!name) continue;

    const data: Record<string, string | boolean | Date | null> = {
      data_incorporacio: colMap["data_incorporacio"] ? cellDate(row.getCell(colMap["data_incorporacio"]).value) : null,
      escolaritzacio_previa: colMap["escolaritzacio_previa"] ? cellValue(row.getCell(colMap["escolaritzacio_previa"]).value) || null : null,
      reunio_poe: colMap["reunio_poe"] ? cellBool(row.getCell(colMap["reunio_poe"]).value) : false,
      reunio_mesi: colMap["reunio_mesi"] ? cellBool(row.getCell(colMap["reunio_mesi"]).value) : (etapa === "eso" ? null : false),
      reunio_eap: colMap["reunio_eap"] ? cellBool(row.getCell(colMap["reunio_eap"]).value) : false,
      informe_eap: colMap["informe_eap"] ? cellValue(row.getCell(colMap["informe_eap"]).value) || null : null,
      cad: colMap["cad"] ? cellValue(row.getCell(colMap["cad"]).value) || null : null,
      informe_diagnostic: colMap["informe_diagnostic"] ? cellValue(row.getCell(colMap["informe_diagnostic"]).value) || null : null,
      curs_retencio: colMap["curs_retencio"] ? cellValue(row.getCell(colMap["curs_retencio"]).value) || null : null,
      nise: colMap["nise"] ? cellValue(row.getCell(colMap["nise"]).value) || null : null,
      ssd: colMap["ssd"] ? cellBool(row.getCell(colMap["ssd"]).value) : false,
      mesura_nese: colMap["mesura_nese"] ? cellValue(row.getCell(colMap["mesura_nese"]).value) || null : null,
      eixos_pi: colMap["eixos_pi"] ? cellValue(row.getCell(colMap["eixos_pi"]).value) || null : null,
      materies_pi: colMap["materies_pi"] ? cellValue(row.getCell(colMap["materies_pi"]).value) || null : null,
      nac_pi: colMap["nac_pi"] ? cellValue(row.getCell(colMap["nac_pi"]).value) || null : null,
      nac_final: colMap["nac_final"] ? cellValue(row.getCell(colMap["nac_final"]).value) || null : null,
      serveis_externs: colMap["serveis_externs"] ? cellValue(row.getCell(colMap["serveis_externs"]).value) || null : null,
      beca_mec: colMap["beca_mec"] ? cellValue(row.getCell(colMap["beca_mec"]).value) || null : null,
      observacions_curs: colMap["observacions_curs"] ? cellValue(row.getCell(colMap["observacions_curs"]).value) || null : null,
      dades_rellevants_historic: colMap["dades_rellevants_historic"] ? cellValue(row.getCell(colMap["dades_rellevants_historic"]).value) || null : null,
    };

    // Normalize informe_eap
    if (data.informe_eap && typeof data.informe_eap === "string") {
      const v = data.informe_eap.toLowerCase();
      if (v.includes("sense") || v.includes("no")) data.informe_eap = "sense_informe";
      else if (v.includes("nee") || v.includes("annex 1 i 2") || v.includes("annex1i2")) data.informe_eap = "nee_annex1i2";
      else if (v.includes("nese") || v.includes("annex 1") || v.includes("annex1")) data.informe_eap = "nese_annex1";
    }

    // Normalize mesura_nese
    if (data.mesura_nese && typeof data.mesura_nese === "string") {
      const v = data.mesura_nese.toLowerCase();
      if (v.includes("pi curricular")) data.mesura_nese = "pi_curricular";
      else if (v.includes("pi no curricular") || v.includes("pi no-curricular")) data.mesura_nese = "pi_no_curricular";
      else if (v.includes("pi nouvingut")) data.mesura_nese = "pi_nouvingut";
      else if (v.includes("dua") || v.includes("misu")) data.mesura_nese = "dua_misu";
      else if (v.includes("no mesures") || v.includes("sense")) data.mesura_nese = "no_mesures";
      else if (v.includes("pi")) data.mesura_nese = "pi";
    }

    // Normalize nise
    if (data.nise && typeof data.nise === "string") {
      const v = data.nise.toLowerCase();
      if (v.includes("nise") && !v.includes("sls") && !v.includes("no")) data.nise = "nise";
      else if (v.includes("sls")) data.nise = "sls";
      else if (v.includes("no")) data.nise = "no";
    }

    // Normalize beca_mec
    if (data.beca_mec && typeof data.beca_mec === "string") {
      const v = data.beca_mec.toLowerCase();
      if (v.includes("sol·licit") || v.includes("solicit") || v.includes("curs actual")) data.beca_mec = "sollicitada_curs_actual";
      else if (v.includes("candidat") || v.includes("proper")) data.beca_mec = "candidat_proper_curs";
      else if (v.includes("no")) data.beca_mec = "no_candidat_mec";
    }

    rows.push({ name, sheetName, data });
  }

  return rows;
}

// --- Manual name overrides for edge cases ---
// Maps normalized Excel name → normalized DB name (first_name + " " + last_name)
// Include BOTH orderings (before and after comma normalization) for "Apellido, Nombre" entries
const MANUAL_NAME_MAP: Record<string, string> = {
  "ZAIF": "SAIF DIN BERAADI MARCHAN",
  "AYA": "AYA AHDOR OULAD CHAIB",
  "WALID": "WALID IBN OMAR SENDI",
  "ASHLYJHOANA DUARTE": "ASHLY JHOANA DUARTE HERNANDEZ",
  "DUARTE ASHLYJHOANA": "ASHLY JHOANA DUARTE HERNANDEZ",
  "LIAM JOSUE DELGADO": "LIAM JOSE DELGADO NEIRA",
  "EIDEN GUERREO": "EIDEN GUERRERO CALDAS",
  "ENZO AARON GUERREO": "ENZO AARON GUERRERO ALFONSO",
  "BENSLAIMAN IBRAHIM": "IBRAHIM BEN SLAIMAN JEBARI",
  "IBRAHIM BENSLAIMAN": "IBRAHIM BEN SLAIMAN JEBARI",
  "ISMAEL BENSLAIMAN": "ISMAEL BEN SLAIMAN JEBARI",
  "ISMAEL BENSALIMAN": "ISMAEL BEN SLAIMAN JEBARI",
  "ROMERO A KIMBERLY": "KIMBERLY ANDREA ROMERO LEON",
  "KIMBERLY ROMERO": "KIMBERLY ANDREA ROMERO LEON",
  "AHDOR ABDEL": "ABDEL BASSET AHDOR",
  "ABDEL AHDOR": "ABDEL BASSET AHDOR",
};

// Names that are garbage/notes, not real students
const GARBAGE_PATTERNS = [
  /^\* /,
  /^si cal/i,
  /^renovar/i,
  /^model de pi/i,
];

function isGarbage(name: string): boolean {
  return GARBAGE_PATTERNS.some((p) => p.test(name.trim()));
}

// --- Token-based matching ---
function tokenize(name: string): string[] {
  return normalizeName(name).split(" ").filter(Boolean);
}

/**
 * Tokenize for matching: same as tokenize but removes single-character tokens
 * (initials like "M.", "N.", "S." that block matching).
 */
function tokenizeForMatching(name: string): string[] {
  return tokenize(name).filter((t) => t.length > 1);
}

/**
 * Check if all tokens from the Excel name appear in the DB student's full name.
 * This handles the common case where Excel has "NOA FALL" but DB has "Noa Fall Martínez".
 */
function tokensMatch(excelTokens: string[], dbTokens: string[]): boolean {
  return excelTokens.every((t) => dbTokens.includes(t));
}

/**
 * Fuzzy token matching: each Excel token must match a DB token within Levenshtein ≤ 1.
 * Handles typos like "GUERREO" → "GUERRERO", "KANDE" → "KANDEH".
 */
function fuzzyTokensMatch(excelTokens: string[], dbTokens: string[]): boolean {
  return excelTokens.every((et) =>
    dbTokens.some((dt) => et === dt || (et.length >= 3 && levenshtein(et, dt) <= 1))
  );
}

/**
 * Clean name: remove asterisks, dots after single letters (initials), normalize whitespace.
 */
function cleanName(name: string): string {
  return name
    .replace(/\*/g, "")           // Remove asterisks
    .replace(/\b([A-Za-z])\./g, "$1") // Remove dots after single letters (M. → M)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Handle "Apellido, Nombre" format: "Ibañez, Edite" → "Edite Ibañez"
 */
function normalizeCommaFormat(name: string): string {
  if (name.includes(",")) {
    const parts = name.split(",").map((p) => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[1]} ${parts[0]}`;
    }
  }
  return name;
}

// --- Match students ---
async function matchStudents(
  students: StudentRow[],
  dbStudents: { id: string; first_name: string; last_name: string }[],
  filePath: string
): Promise<{ matched: { studentId: string; data: Record<string, any> }[]; unmatched: UnmatchedStudent[] }> {
  const matched: { studentId: string; data: Record<string, any> }[] = [];
  const unmatched: UnmatchedStudent[] = [];

  const dbNormalized = dbStudents.map((s) => ({
    ...s,
    normalized: normalizeName(`${s.last_name} ${s.first_name}`),
    normalizedReverse: normalizeName(`${s.first_name} ${s.last_name}`),
    tokens: tokenize(`${s.first_name} ${s.last_name}`),
  }));

  for (const student of students) {
    // Skip garbage lines
    if (isGarbage(student.name)) continue;

    // Clean the name (remove *, dots after initials)
    const cleaned = cleanName(student.name);
    // Handle "Apellido, Nombre" format
    const cleanedName = normalizeCommaFormat(cleaned);
    // Also keep the original normalized (before comma swap) for manual map
    const normOriginal = normalizeName(cleaned);
    const norm = normalizeName(cleanedName);
    if (!norm) continue;

    let match: (typeof dbNormalized)[0] | undefined;

    // Check manual overrides first (try both original and comma-normalized)
    const manualTarget = MANUAL_NAME_MAP[norm] || MANUAL_NAME_MAP[normOriginal];
    if (manualTarget) {
      match = dbNormalized.find(
        (db) => db.normalizedReverse === manualTarget || db.normalized === manualTarget
      );
      if (match) {
        console.log(`    [MANUAL] "${student.name}" → ${match.first_name} ${match.last_name}`);
      }
    }

    // Step 1: Exact match (last_name first_name or first_name last_name)
    if (!match) {
      match = dbNormalized.find(
        (db) => db.normalized === norm || db.normalizedReverse === norm
      );
    }

    // Step 2: Levenshtein distance ≤ 3
    if (!match) {
      let bestDist = Infinity;
      let bestMatch: (typeof dbNormalized)[0] | null = null;
      for (const db of dbNormalized) {
        const d1 = levenshtein(norm, db.normalized);
        const d2 = levenshtein(norm, db.normalizedReverse);
        const d = Math.min(d1, d2);
        if (d < bestDist) {
          bestDist = d;
          bestMatch = db;
        }
      }
      if (bestMatch && bestDist <= 3) {
        match = bestMatch;
      }
    }

    // Step 3: Strict token-based matching (all Excel tokens must appear in DB name)
    // Uses tokenizeForMatching to skip single-char tokens (initials like M, N, S)
    if (!match) {
      const excelTokens = tokenizeForMatching(cleanedName);
      if (excelTokens.length >= 1) {
        const candidates = dbNormalized.filter((db) =>
          tokensMatch(excelTokens, db.tokens)
        );
        if (candidates.length === 1) {
          match = candidates[0];
          console.log(`    [TOKEN] "${student.name}" → ${match.first_name} ${match.last_name}`);
        } else if (candidates.length > 1) {
          // Multiple matches by tokens - try Levenshtein to break tie
          let bestDist = Infinity;
          let bestCandidate: (typeof dbNormalized)[0] | null = null;
          for (const c of candidates) {
            const d = Math.min(
              levenshtein(norm, c.normalized),
              levenshtein(norm, c.normalizedReverse)
            );
            if (d < bestDist) {
              bestDist = d;
              bestCandidate = c;
            }
          }
          if (bestCandidate) {
            match = bestCandidate;
            console.log(`    [TOKEN+LEV] "${student.name}" → ${match.first_name} ${match.last_name} (${candidates.length} candidates, dist=${bestDist})`);
          }
        }
      }
    }

    // Step 4: Fuzzy token matching (each token within Levenshtein ≤ 1)
    // Handles typos like "GUERREO" → "GUERRERO", "KANDE" → "KANDEH"
    if (!match) {
      const excelTokens = tokenizeForMatching(cleanedName);
      if (excelTokens.length >= 2) {
        const candidates = dbNormalized.filter((db) =>
          fuzzyTokensMatch(excelTokens, db.tokens)
        );
        if (candidates.length === 1) {
          match = candidates[0];
          console.log(`    [FUZZY] "${student.name}" → ${match.first_name} ${match.last_name}`);
        } else if (candidates.length > 1) {
          let bestDist = Infinity;
          let bestCandidate: (typeof dbNormalized)[0] | null = null;
          for (const c of candidates) {
            const d = Math.min(
              levenshtein(norm, c.normalized),
              levenshtein(norm, c.normalizedReverse)
            );
            if (d < bestDist) {
              bestDist = d;
              bestCandidate = c;
            }
          }
          if (bestCandidate) {
            match = bestCandidate;
            console.log(`    [FUZZY+LEV] "${student.name}" → ${match.first_name} ${match.last_name} (${candidates.length} candidates, dist=${bestDist})`);
          }
        }
      }
    }

    // Step 5: Single first-name match (for "Aya", "Walid", "Zaif" etc.)
    if (!match) {
      const parts = norm.split(" ");
      if (parts.length === 1) {
        const candidates = dbNormalized.filter(
          (db) => normalizeName(db.first_name) === parts[0]
        );
        if (candidates.length === 1) {
          match = candidates[0];
          console.log(`    [FIRSTNAME] "${student.name}" → ${match.first_name} ${match.last_name}`);
        }
      }
    }

    // Note: PARTIAL surname matching was removed - it caused false positives
    // (e.g., "Abram Cortés" matching "Moisès Cortés", "Lucía Valdivia" matching "Lucas Valdivia")

    if (match) {
      matched.push({ studentId: match.id, data: student.data });
    } else {
      unmatched.push({
        name: student.name,
        sheet: student.sheetName,
        file: path.basename(filePath),
        data: student.data,
      });
    }
  }

  return { matched, unmatched };
}

// --- Main import ---
async function importFile(
  filePath: string,
  type: ImportType,
  etapa: Etapa,
  schoolYearId: string,
  dbStudents: { id: string; first_name: string; last_name: string }[]
): Promise<UnmatchedStudent[]> {
  console.log(`\nImporting: ${path.basename(filePath)} (${type}, ${etapa})`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  let allRows: StudentRow[] = [];

  workbook.eachSheet((sheet) => {
    console.log(`  Sheet: "${sheet.name}"`);
    const rows =
      type === "traspass"
        ? parseTraspassSheet(sheet, sheet.name)
        : parseNeseSheet(sheet, sheet.name, etapa);
    console.log(`    Parsed ${rows.length} students`);
    allRows = allRows.concat(rows);
  });

  // Deduplicate by name (keep last occurrence = most recent class)
  const deduped = new Map<string, StudentRow>();
  for (const row of allRows) {
    const key = normalizeName(row.name);
    if (key) deduped.set(key, row);
  }
  const uniqueRows = Array.from(deduped.values());
  console.log(`  Total unique students: ${uniqueRows.length}`);

  // Match
  const { matched, unmatched } = await matchStudents(uniqueRows, dbStudents, filePath);
  console.log(`  Matched: ${matched.length}, Unmatched: ${unmatched.length}`);

  // Upsert
  if (type === "traspass") {
    for (const m of matched) {
      const record = {
        student_id: m.studentId,
        school_year_id: schoolYearId,
        graella_nese: m.data.graella_nese ?? false,
        curs_repeticio: m.data.curs_repeticio || null,
        dades_familiars: m.data.dades_familiars || null,
        academic: m.data.academic || null,
        comportament: m.data.comportament || null,
        acords_tutoria: m.data.acords_tutoria || null,
        estat: m.data.estat || null,
        observacions: m.data.observacions || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("student_yearly_data")
        .upsert(record, { onConflict: "student_id,school_year_id" });

      if (error) {
        console.error(`    Error upserting traspass for ${m.studentId}: ${error.message}`);
      }
    }
  } else {
    for (const m of matched) {
      const record: Record<string, any> = {
        student_id: m.studentId,
        school_year_id: schoolYearId,
        updated_at: new Date().toISOString(),
      };

      // Only include non-null fields
      const fields = [
        "data_incorporacio", "escolaritzacio_previa",
        "reunio_poe", "reunio_mesi", "reunio_eap",
        "informe_eap", "cad", "informe_diagnostic", "curs_retencio",
        "nise", "ssd", "mesura_nese",
        "materies_pi", "eixos_pi", "nac_pi", "nac_final",
        "serveis_externs", "beca_mec",
        "observacions_curs", "dades_rellevants_historic",
      ];

      for (const field of fields) {
        if (m.data[field] !== undefined) {
          record[field] = m.data[field];
        }
      }

      const { error } = await supabase
        .from("student_nese_data")
        .upsert(record, { onConflict: "student_id,school_year_id" });

      if (error) {
        console.error(`    Error upserting NESE for ${m.studentId}: ${error.message}`);
      }
    }
  }

  console.log(`  Upserted ${matched.length} records`);
  return unmatched;
}

// --- File configurations ---
const FILE_CONFIGS: { file: string; type: ImportType; etapa: Etapa }[] = [
  { file: "docs/examples/INF - 24-25 a 25-26_Traspàs de tutories INFANTIL .xlsx", type: "traspass", etapa: "infantil" },
  { file: "docs/examples/24-25 a 25-26_Traspàs de tutories PRIMÀRIA.xlsx", type: "traspass", etapa: "primaria" },
  { file: "docs/examples/24-25 a 25-26_Traspàs de tutories ESO.xlsx", type: "traspass", etapa: "eso" },
  { file: "docs/examples/INF_Alumnat NESE 24-25.xlsx", type: "nese", etapa: "infantil" },
  { file: "docs/examples/PRI_Alumnat NESE 24-25.xlsx", type: "nese", etapa: "primaria" },
  { file: "docs/examples/ESO_Alumnat NESE 24-25.xlsx", type: "nese", etapa: "eso" },
];

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all");

  // Get school year
  const { data: yearData, error: yearError } = await supabase
    .from("clickedu_years")
    .select("id")
    .eq("is_current", true)
    .single();

  if (yearError || !yearData) {
    console.error("No current school year found:", yearError?.message);
    process.exit(1);
  }

  const schoolYearId = yearData.id;
  console.log(`School year ID: ${schoolYearId}`);

  // Get all active students
  const { data: dbStudents, error: studentsError } = await supabase
    .from("clickedu_students")
    .select("id, first_name, last_name")
    .eq("is_active", true);

  if (studentsError || !dbStudents) {
    console.error("Error fetching students:", studentsError?.message);
    process.exit(1);
  }

  console.log(`DB students: ${dbStudents.length}`);

  let allUnmatched: UnmatchedStudent[] = [];

  if (isAll) {
    // Import all 6 files (traspass first, then nese)
    for (const config of FILE_CONFIGS) {
      const filePath = path.resolve(__dirname, "..", config.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }
      const unmatched = await importFile(filePath, config.type, config.etapa, schoolYearId, dbStudents);
      allUnmatched = allUnmatched.concat(unmatched);
    }
  } else {
    const typeIdx = args.indexOf("--type");
    const etapaIdx = args.indexOf("--etapa");
    const fileIdx = args.indexOf("--file");

    if (typeIdx === -1 || etapaIdx === -1 || fileIdx === -1) {
      console.error("Usage: --type traspass|nese --etapa infantil|primaria|eso --file <path>");
      console.error("   or: --all");
      process.exit(1);
    }

    const type = args[typeIdx + 1] as ImportType;
    const etapa = args[etapaIdx + 1] as Etapa;
    const filePath = path.resolve(args[fileIdx + 1]);

    const unmatched = await importFile(filePath, type, etapa, schoolYearId, dbStudents);
    allUnmatched = unmatched;
  }

  // Write unmatched log
  if (allUnmatched.length > 0) {
    const outputDir = path.resolve(__dirname, "output");
    fs.mkdirSync(outputDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(outputDir, `unmatched_${timestamp}.csv`);

    const csvLines = ["name,sheet,file,data"];
    for (const u of allUnmatched) {
      const dataStr = JSON.stringify(u.data).replace(/"/g, '""');
      csvLines.push(`"${u.name}","${u.sheet}","${u.file}","${dataStr}"`);
    }
    fs.writeFileSync(logPath, csvLines.join("\n"), "utf-8");
    console.log(`\nUnmatched students log: ${logPath}`);
    console.log(`Total unmatched: ${allUnmatched.length}`);
  } else {
    console.log("\nAll students matched successfully!");
  }

  console.log("\nDone!");
}

main().catch(console.error);
