/**
 * Import IDALU values from NESE Excel files into clickedu_students.idalu
 *
 * Usage: npx tsx scripts/import-idalu.ts
 */

import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cellValue(cell: ExcelJS.CellValue): string {
  if (cell === undefined || cell === null) return "";
  if (typeof cell === "number") return String(cell);
  if (typeof cell === "object") {
    if ("richText" in cell && Array.isArray((cell as any).richText)) {
      return ((cell as any).richText as { text: string }[])
        .map((r) => String(r.text ?? ""))
        .join("")
        .trim();
    }
    if ("text" in cell) return String((cell as any).text ?? "").trim();
    if ("result" in cell) return String((cell as any).result ?? "").trim();
  }
  return String(cell).trim();
}

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
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
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

interface IdaluEntry {
  name: string;
  idalu: string;
  sheet: string;
  file: string;
}

const files = [
  "../docs/examples/INF_Alumnat NESE 24-25.xlsx",
  "../docs/examples/PRI_Alumnat NESE 24-25.xlsx",
  "../docs/examples/ESO_Alumnat NESE 24-25.xlsx",
];

async function extractIdalu(): Promise<IdaluEntry[]> {
  const entries: IdaluEntry[] = [];

  for (const f of files) {
    const filePath = path.resolve(__dirname, f);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const fileName = path.basename(f);

    wb.eachSheet((sheet) => {
      // Find IDALU and NOM columns in header area (rows 3-6)
      let idaluCol = -1;
      let nomCol = -1;
      let headerRowNum = -1;

      for (let r = 3; r <= 6; r++) {
        const row = sheet.getRow(r);
        for (let c = 1; c <= 30; c++) {
          const v = cellValue(row.getCell(c).value).toUpperCase();
          if (v.includes("IDALU")) {
            idaluCol = c;
            headerRowNum = r;
          }
          if (v.includes("ALUMNE") || v.includes("COGNOM")) {
            nomCol = c;
          }
        }
        if (idaluCol > 0) break;
      }

      if (idaluCol < 0 || nomCol < 0) return;

      // Read data rows (skip subheader)
      for (let r = headerRowNum + 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const name = cellValue(row.getCell(nomCol).value);
        const idalu = cellValue(row.getCell(idaluCol).value);
        if (name && idalu && idalu !== "-" && idalu.length > 0) {
          entries.push({ name, idalu, sheet: sheet.name, file: fileName });
        }
      }
    });
  }

  return entries;
}

async function run() {
  console.log("Extracting IDALU values from Excel files...");
  const entries = await extractIdalu();
  console.log(`Found ${entries.length} IDALU entries\n`);

  // Fetch all students from DB
  const { data: dbStudents, error } = await supabase
    .from("clickedu_students")
    .select("id, first_name, last_name, class_name, clickedu_id")
    .eq("is_active", true);

  if (error || !dbStudents) {
    console.error("Error fetching students:", error);
    process.exit(1);
  }

  console.log(`DB has ${dbStudents.length} active students\n`);

  // Build lookup: normalized name tokens -> student
  const dbLookup = dbStudents.map((s) => ({
    ...s,
    normalized: normalizeName(`${s.last_name} ${s.first_name}`),
    tokens: normalizeName(`${s.last_name} ${s.first_name}`).split(" "),
  }));

  let matched = 0;
  let unmatched = 0;
  const updates: { id: string; idalu: string; name: string }[] = [];

  for (const entry of entries) {
    const excelNorm = normalizeName(entry.name);
    const excelTokens = excelNorm.split(" ");

    // Step 1: Exact normalized match
    let match = dbLookup.find((db) => db.normalized === excelNorm);

    // Step 2: Token containment (all Excel tokens must be in DB tokens or vice versa)
    if (!match) {
      match = dbLookup.find((db) => {
        return (
          excelTokens.every((t) => db.tokens.includes(t)) ||
          db.tokens.every((t) => excelTokens.includes(t))
        );
      });
    }

    // Step 3: Fuzzy matching with Levenshtein on full normalized name
    if (!match) {
      let bestDist = Infinity;
      let bestMatch: (typeof dbLookup)[0] | undefined;
      for (const db of dbLookup) {
        const dist = levenshtein(excelNorm, db.normalized);
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = db;
        }
      }
      // Accept if distance is small relative to name length
      if (bestMatch && bestDist <= Math.max(3, excelNorm.length * 0.2)) {
        match = bestMatch;
      }
    }

    if (match) {
      // Avoid duplicates
      const existing = updates.find((u) => u.id === match!.id);
      if (!existing) {
        updates.push({
          id: match.id,
          idalu: entry.idalu,
          name: `${match.last_name}, ${match.first_name}`,
        });
      }
      matched++;
    } else {
      console.log(
        `  [UNMATCHED] "${entry.name}" (IDALU=${entry.idalu}) from ${entry.file} / ${entry.sheet}`
      );
      unmatched++;
    }
  }

  console.log(`\nMatched: ${matched}, Unmatched: ${unmatched}`);
  console.log(`Unique students to update: ${updates.length}\n`);

  // Apply updates
  let updated = 0;
  let errors = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from("clickedu_students")
      .update({ idalu: u.idalu })
      .eq("id", u.id);

    if (error) {
      console.error(`  Error updating ${u.name}: ${error.message}`);
      errors++;
    } else {
      updated++;
    }
  }

  console.log(`\nDone! Updated ${updated} students, ${errors} errors.`);

  // Verify
  const { data: withIdalu } = await supabase
    .from("clickedu_students")
    .select("id")
    .not("idalu", "is", null);

  console.log(
    `Students with IDALU in DB: ${withIdalu?.length || 0} / ${dbStudents.length}`
  );
}

run().catch(console.error);
