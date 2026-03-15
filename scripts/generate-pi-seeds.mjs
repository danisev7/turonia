/**
 * Parse PI config CSVs and generate SQL seed files.
 * Run: node scripts/generate-pi-seeds.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple CSV parser that handles quoted fields with commas and newlines
function parseCSV(text) {
  const rows = [];
  let i = 0;
  while (i < text.length) {
    const row = [];
    while (i < text.length) {
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        let field = "";
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            field += text[i];
            i++;
          }
        }
        row.push(field);
      } else {
        // Unquoted field
        let field = "";
        while (i < text.length && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          field += text[i];
          i++;
        }
        row.push(field);
      }
      if (i < text.length && text[i] === ",") {
        i++; // skip comma
      } else {
        break;
      }
    }
    // Skip line ending
    if (i < text.length && text[i] === "\r") i++;
    if (i < text.length && text[i] === "\n") i++;
    if (row.length > 0 && row.some((f) => f.trim())) {
      rows.push(row);
    }
  }
  return rows;
}

function esc(s) {
  if (!s) return "NULL";
  // Replace smart/curly quotes with straight apostrophe, then escape for SQL
  return "'" + s.replace(/[\u2018\u2019\u2032]/g, "'").replace(/'/g, "''") + "'";
}

// ==================== CURRICULUM ESO ====================
function generateCurriculumESO() {
  const csv = readFileSync(join(__dirname, "csv_mapa_curriculum.csv"), "utf-8");
  const rows = parseCSV(csv);
  const values = [];
  let sortOrder = 0;

  for (const row of rows) {
    const subject = (row[0] || "").trim();
    const level = (row[1] || "").trim();
    const entryType = (row[2] || "").trim();
    const code = (row[3] || "").trim();
    const fullText = (row[4] || "").trim();
    const shortText = (row[5] || "").trim();

    if (!subject || !level || !entryType || !code || !fullText) continue;

    // Derive parent_code for CRIT entries: "CE1 1" -> "CE1"
    let parentCode = null;
    if (entryType === "CRIT" && code.includes(" ")) {
      parentCode = code.split(" ")[0];
    }

    sortOrder++;
    values.push(
      `  ('ESO', ${esc(subject)}, ${esc(level)}, ${esc(entryType)}, ${esc(code)}, ${esc(fullText)}, ${esc(shortText || null)}, ${esc(parentCode)}, ${sortOrder})`
    );
  }

  return values;
}

// ==================== CURRICULUM PRI ====================
function generateCurriculumPRI() {
  const csv = readFileSync(join(__dirname, "csv_mapa_curriculum_pri.csv"), "utf-8");
  const rows = parseCSV(csv);
  const values = [];
  let sortOrder = 10000; // offset to avoid collisions with ESO sort_order

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const subject = (row[0] || "").trim();
    const entryType = (row[1] || "").trim();
    const code = (row[2] || "").trim();
    const fullTextCol = (row[3] || "").trim();
    const stage = (row[4] || "").trim();
    const level = (row[5] || "").trim();
    const shortText = (row[6] || "").trim();

    if (!subject || !entryType || !code || !level) continue;
    if (!fullTextCol) continue;

    // For PRI, code format for COMP_ESPEC is "1", "2", etc.
    // For CRIT, code is like "1.1", "2.3", etc.
    const normalizedCode = entryType === "COMP_ESPEC" ? `CE${code}` : `CA${code}`;

    // Derive parent_code for CRIT
    let parentCode = null;
    if (entryType === "CRIT" && code.includes(".")) {
      parentCode = `CE${code.split(".")[0]}`;
    }

    sortOrder++;
    values.push(
      `  ('PRI', ${esc(subject)}, ${esc(level)}, ${esc(entryType)}, ${esc(normalizedCode)}, ${esc(fullTextCol)}, ${esc(shortText || null)}, ${esc(parentCode)}, ${sortOrder})`
    );
  }

  return values;
}

// ==================== TRANSVERSALS ESO ====================
function generateTransversalsESO() {
  const csv = readFileSync(join(__dirname, "csv_mapa_transversals.csv"), "utf-8");
  const rows = parseCSV(csv);
  const values = [];
  let sortOrder = 0;

  // Derive group from ESO level
  function getGroup(level) {
    if (level === "1ESO" || level === "2ESO") return "1-2ESO";
    if (level === "3ESO" || level === "4ESO") return "3-4ESO";
    return level;
  }

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const area = (row[0] || "").trim();
    const especNum = (row[1] || "").trim();
    const especFull = (row[2] || "").trim();
    const especShort = (row[3] || "").trim();
    const level = (row[4] || "").trim();
    const critFull = (row[5] || "").trim();
    const critShort = (row[6] || "").trim();

    if (!area || !level) continue;

    const groupName = getGroup(level);

    sortOrder++;
    values.push(
      `  ('ESO', ${esc(area)}, ${esc(groupName)}, ${esc(especShort || especFull)}, ${esc(especFull)}, ${esc(critShort || null)}, ${esc(critFull || null)}, ${sortOrder})`
    );
  }

  return values;
}

// ==================== TRANSVERSALS PRI ====================
function generateTransversalsPRI() {
  const csv = readFileSync(join(__dirname, "csv_mapa_transversals_pri.csv"), "utf-8");
  const rows = parseCSV(csv);
  const values = [];
  let sortOrder = 5000; // offset

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const area = (row[0] || "").trim();
    const especNum = (row[1] || "").trim();
    const especFull = (row[2] || "").trim();
    const especShort = (row[3] || "").trim();
    const groupName = (row[4] || "").trim(); // Already in format "1-2PRI", "3-4PRI", "5-6PRI"
    const critFull = (row[5] || "").trim();
    const critShort = (row[6] || "").trim();

    if (!area || !groupName) continue;

    sortOrder++;
    values.push(
      `  ('PRI', ${esc(area)}, ${esc(groupName)}, ${esc(especShort || especFull)}, ${esc(especFull)}, ${esc(critShort || null)}, ${esc(critFull || null)}, ${sortOrder})`
    );
  }

  return values;
}

// ==================== SABERS DIG ====================
function generateSabersDig() {
  const csv = readFileSync(join(__dirname, "csv_sabers_dig.csv"), "utf-8");
  const rows = parseCSV(csv);
  const values = [];
  let sortOrder = 0;

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const fullText = (row[0] || "").trim();
    const shortText = (row[1] || "").trim();

    if (!fullText || fullText === "Sabers") continue; // Skip header-like rows

    sortOrder++;
    values.push(
      `  ('ESO', NULL, ${esc(fullText)}, ${esc(shortText || fullText)}, ${sortOrder})`
    );
  }

  return values;
}

// ==================== MAIN ====================
function main() {
  console.log("Generating curriculum ESO...");
  const currESO = generateCurriculumESO();
  console.log(`  ${currESO.length} rows`);

  console.log("Generating curriculum PRI...");
  const currPRI = generateCurriculumPRI();
  console.log(`  ${currPRI.length} rows`);

  const allCurriculum = [...currESO, ...currPRI];
  console.log(`Total curriculum: ${allCurriculum.length} rows`);

  // Write curriculum as separate batch files (100 rows each for manageable size)
  const CURR_BATCH = 100;
  let currFileCount = 0;
  for (let i = 0; i < allCurriculum.length; i += CURR_BATCH) {
    const batch = allCurriculum.slice(i, i + CURR_BATCH);
    const batchNum = Math.floor(i / CURR_BATCH) + 1;
    let sql = `INSERT INTO pi_config_curriculum (stage, subject, level, entry_type, code, full_text, short_text, parent_code, sort_order)\nVALUES\n`;
    sql += batch.join(",\n");
    sql += `\nON CONFLICT (stage, subject, level, entry_type, code) DO NOTHING;\n`;
    writeFileSync(join(__dirname, `output/seed-pi-curriculum-${batchNum}.sql`), sql);
    currFileCount++;
  }
  console.log(`Written: ${currFileCount} curriculum batch files to scripts/output/`);

  // Transversals
  console.log("Generating transversals ESO...");
  const transESO = generateTransversalsESO();
  console.log(`  ${transESO.length} rows`);

  console.log("Generating transversals PRI...");
  const transPRI = generateTransversalsPRI();
  console.log(`  ${transPRI.length} rows`);

  const allTransversals = [...transESO, ...transPRI];
  console.log(`Total transversals: ${allTransversals.length} rows`);

  // Write transversals as separate batch files
  const TRANS_BATCH = 50;
  let transFileCount = 0;
  for (let i = 0; i < allTransversals.length; i += TRANS_BATCH) {
    const batch = allTransversals.slice(i, i + TRANS_BATCH);
    const batchNum = Math.floor(i / TRANS_BATCH) + 1;
    let sql = `INSERT INTO pi_config_transversals (stage, area, group_name, espec_short, espec_full, crit_short, crit_full, sort_order)\nVALUES\n`;
    sql += batch.join(",\n");
    sql += `\nON CONFLICT DO NOTHING;\n`;
    writeFileSync(join(__dirname, `output/seed-pi-transversals-${batchNum}.sql`), sql);
    transFileCount++;
  }
  console.log(`Written: ${transFileCount} transversals batch files to scripts/output/`);

  // Sabers Dig
  console.log("Generating sabers dig...");
  const sabers = generateSabersDig();
  console.log(`  ${sabers.length} rows`);

  let sabersSQL = `-- Seed data for pi_config_sabers_dig\n-- Generated from Google Sheets _SABERS_DIG\n-- Total rows: ${sabers.length}\n\n`;
  sabersSQL += `INSERT INTO pi_config_sabers_dig (stage, group_name, full_text, short_text, sort_order)\nVALUES\n`;
  sabersSQL += sabers.join(",\n");
  sabersSQL += `\nON CONFLICT DO NOTHING;\n`;

  writeFileSync(join(__dirname, "seed-pi-sabers-dig.sql"), sabersSQL);
  console.log("Written: scripts/seed-pi-sabers-dig.sql");

  console.log("\nDone! Generated 3 SQL seed files.");
}

main();
