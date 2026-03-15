/**
 * Apply PI seed data to Supabase using supabase-js client.
 * Reads the generated SQL batch files and inserts via Supabase REST API.
 * Run: node scripts/apply-pi-seeds.mjs
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envContent = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRole) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false },
});

// Parse CSV using the same parser from generate-pi-seeds.mjs
function parseCSV(text) {
  const rows = [];
  let i = 0;
  while (i < text.length) {
    const row = [];
    while (i < text.length) {
      if (text[i] === '"') {
        i++;
        let field = "";
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            field += text[i];
            i++;
          }
        }
        row.push(field);
      } else {
        let field = "";
        while (i < text.length && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          field += text[i];
          i++;
        }
        row.push(field);
      }
      if (i < text.length && text[i] === ",") {
        i++;
      } else {
        break;
      }
    }
    if (i < text.length && text[i] === "\r") i++;
    if (i < text.length && text[i] === "\n") i++;
    if (row.length > 0 && row.some((f) => f.trim())) {
      rows.push(row);
    }
  }
  return rows;
}

function cleanText(s) {
  if (!s) return null;
  // Replace smart/curly quotes with straight apostrophe
  return s.replace(/[\u2018\u2019\u2032]/g, "'").trim();
}

// ==================== TRANSVERSALS ====================
async function seedTransversals() {
  console.log("Seeding transversals...");

  function getGroup(level) {
    if (level === "1ESO" || level === "2ESO") return "1-2ESO";
    if (level === "3ESO" || level === "4ESO") return "3-4ESO";
    return level;
  }

  // ESO
  const csvESO = readFileSync(join(__dirname, "csv_mapa_transversals.csv"), "utf-8");
  const rowsESO = parseCSV(csvESO);
  const esoData = [];
  let sortOrder = 0;

  for (let i = 1; i < rowsESO.length; i++) {
    const row = rowsESO[i];
    const area = cleanText(row[0]);
    const especFull = cleanText(row[2]);
    const especShort = cleanText(row[3]);
    const level = (row[4] || "").trim();
    const critFull = cleanText(row[5]);
    const critShort = cleanText(row[6]);

    if (!area || !level) continue;
    sortOrder++;
    esoData.push({
      stage: "ESO",
      area,
      group_name: getGroup(level),
      espec_short: especShort || especFull,
      espec_full: especFull,
      crit_short: critShort || null,
      crit_full: critFull || null,
      sort_order: sortOrder,
    });
  }

  // PRI
  const csvPRI = readFileSync(join(__dirname, "csv_mapa_transversals_pri.csv"), "utf-8");
  const rowsPRI = parseCSV(csvPRI);
  const priData = [];
  sortOrder = 5000;

  for (let i = 1; i < rowsPRI.length; i++) {
    const row = rowsPRI[i];
    const area = cleanText(row[0]);
    const especFull = cleanText(row[2]);
    const especShort = cleanText(row[3]);
    const groupName = (row[4] || "").trim();
    const critFull = cleanText(row[5]);
    const critShort = cleanText(row[6]);

    if (!area || !groupName) continue;
    sortOrder++;
    priData.push({
      stage: "PRI",
      area,
      group_name: groupName,
      espec_short: especShort || especFull,
      espec_full: especFull,
      crit_short: critShort || null,
      crit_full: critFull || null,
      sort_order: sortOrder,
    });
  }

  const allData = [...esoData, ...priData];
  console.log(`  Total rows to insert: ${allData.length}`);

  // Insert in batches of 50
  const BATCH = 50;
  for (let i = 0; i < allData.length; i += BATCH) {
    const batch = allData.slice(i, i + BATCH);
    const { error } = await supabase.from("pi_config_transversals").upsert(batch, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    if (error) {
      console.error(`  ✗ Batch ${Math.floor(i / BATCH) + 1}:`, error.message);
      throw error;
    }
    process.stdout.write(`  ✓ Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(allData.length / BATCH)}\r`);
  }
  console.log(`  ✓ Inserted ${allData.length} transversals rows`);
}

// ==================== CURRICULUM ====================
async function seedCurriculum() {
  console.log("Seeding curriculum...");

  // ESO
  const csvESO = readFileSync(join(__dirname, "csv_mapa_curriculum.csv"), "utf-8");
  const rowsESO = parseCSV(csvESO);
  const esoData = [];
  let sortOrder = 0;

  for (const row of rowsESO) {
    const subject = cleanText(row[0]);
    const level = (row[1] || "").trim();
    const entryType = (row[2] || "").trim();
    const code = (row[3] || "").trim();
    const fullText = cleanText(row[4]);
    const shortText = cleanText(row[5]);

    if (!subject || !level || !entryType || !code || !fullText) continue;

    let parentCode = null;
    if (entryType === "CRIT" && code.includes(" ")) {
      parentCode = code.split(" ")[0];
    }

    sortOrder++;
    esoData.push({
      stage: "ESO",
      subject,
      level,
      entry_type: entryType,
      code,
      full_text: fullText,
      short_text: shortText || null,
      parent_code: parentCode,
      sort_order: sortOrder,
    });
  }

  // PRI
  const csvPRI = readFileSync(join(__dirname, "csv_mapa_curriculum_pri.csv"), "utf-8");
  const rowsPRI = parseCSV(csvPRI);
  const priData = [];
  sortOrder = 10000;

  for (let i = 1; i < rowsPRI.length; i++) {
    const row = rowsPRI[i];
    const subject = cleanText(row[0]);
    const entryType = (row[1] || "").trim();
    const code = (row[2] || "").trim();
    const fullTextCol = cleanText(row[3]);
    const level = (row[5] || "").trim();
    const shortText = cleanText(row[6]);

    if (!subject || !entryType || !code || !level || !fullTextCol) continue;

    const normalizedCode = entryType === "COMP_ESPEC" ? `CE${code}` : `CA${code}`;

    let parentCode = null;
    if (entryType === "CRIT" && code.includes(".")) {
      parentCode = `CE${code.split(".")[0]}`;
    }

    sortOrder++;
    priData.push({
      stage: "PRI",
      subject,
      level,
      entry_type: entryType,
      code: normalizedCode,
      full_text: fullTextCol,
      short_text: shortText || null,
      parent_code: parentCode,
      sort_order: sortOrder,
    });
  }

  const allData = [...esoData, ...priData];
  console.log(`  Total rows to insert: ${allData.length}`);

  // Insert in batches of 50
  const BATCH = 50;
  for (let i = 0; i < allData.length; i += BATCH) {
    const batch = allData.slice(i, i + BATCH);
    const { error } = await supabase.from("pi_config_curriculum").upsert(batch, {
      onConflict: "stage,subject,level,entry_type,code",
      ignoreDuplicates: true,
    });
    if (error) {
      console.error(`  ✗ Batch ${Math.floor(i / BATCH) + 1}:`, error.message);
      throw error;
    }
    process.stdout.write(`  ✓ Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(allData.length / BATCH)}\r`);
  }
  console.log(`  ✓ Inserted ${allData.length} curriculum rows`);
}

// ==================== MAIN ====================
async function main() {
  await seedTransversals();
  await seedCurriculum();

  // Verify counts
  const { data: transCount } = await supabase.from("pi_config_transversals").select("id", { count: "exact", head: true });
  const { data: currCount } = await supabase.from("pi_config_curriculum").select("id", { count: "exact", head: true });
  const { data: sabersCount } = await supabase.from("pi_config_sabers_dig").select("id", { count: "exact", head: true });

  // Get counts via select
  const { count: tc } = await supabase.from("pi_config_transversals").select("*", { count: "exact", head: true });
  const { count: cc } = await supabase.from("pi_config_curriculum").select("*", { count: "exact", head: true });
  const { count: sc } = await supabase.from("pi_config_sabers_dig").select("*", { count: "exact", head: true });

  console.log("\nVerification:");
  console.log(`  pi_config_transversals: ${tc} rows`);
  console.log(`  pi_config_curriculum: ${cc} rows`);
  console.log(`  pi_config_sabers_dig: ${sc} rows`);

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
