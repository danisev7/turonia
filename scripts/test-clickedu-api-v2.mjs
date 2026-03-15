/**
 * ClickEDU API v2 Test Script
 *
 * Tests authentication, lists teachers and students from the official API,
 * fetches full details, and compares against the current Supabase database.
 *
 * Run: node scripts/test-clickedu-api-v2.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──
const envContent = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const API_KEY = process.env.CLICKEDU_API_KEY;
const CLIENT_ID = Number(process.env.CLICKEDU_CLIENT_ID);
const CLIENT_SECRET = process.env.CLICKEDU_CLIENT_SECRET;
const DOMAIN = `${process.env.CLICKEDU_DOMAIN || "escolaelturo"}.clickedu.eu`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!API_KEY || !CLIENT_SECRET) {
  console.error("Missing CLICKEDU_API_KEY or CLICKEDU_CLIENT_SECRET");
  process.exit(1);
}

const LOGIN_URL = "https://api.clickedu.eu/login/v1/auth/token";
const USERS_BASE = "https://api.clickedu.eu/users";
const ACADEMIC_BASE = "https://api.clickedu.eu/academic";

// ── Helpers ──

function header(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

function decodeHtml(s) {
  if (!s) return s;
  return s
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

async function apiGet(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-key": API_KEY,
      domain: DOMAIN,
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
}

async function paginatedList(baseUrl, token) {
  const allItems = [];
  let page = 1;
  while (true) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const data = await apiGet(`${baseUrl}${sep}page=${page}&limit=500`, token);
    const items = data.users || [];
    allItems.push(...items);
    const paginator = data.paginator;
    if (!paginator || page >= paginator.pages) break;
    page++;
  }
  return allItems;
}

// ── 1. Authentication ──

async function authenticate() {
  header("1. AUTENTICACIÓ");
  console.log("client_credentials grant...");

  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      domain: DOMAIN,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  if (res.ok && data.access_token) {
    console.log(`  ✓ TOKEN OBTINGUT (expires: ${data.expires_in}s)`);
    return data.access_token;
  }

  console.error(`  ✗ ${res.status}: ${JSON.stringify(data)}`);
  process.exit(1);
}

// ── 2. Professors (llista + detalls) ──

async function fetchTeachers(token) {
  header("2. PROFESSORS");

  const list = await paginatedList(`${USERS_BASE}/v2/lists/teachers`, token);
  console.log(`Total professors (llista): ${list.length}\n`);

  // Fetch full details for each teacher
  const teachers = [];
  for (const t of list) {
    try {
      const detail = await apiGet(`${USERS_BASE}/v2/users/${t.id}/0`, token);
      teachers.push(detail);
      const fullName = `${detail.name} ${detail.lastname1} ${detail.lastname2 || ""}`.trim();
      console.log(
        `  [${detail.user_id}] ${fullName} | ${detail.email || "-"} | ${detail.dni || "-"} | teacher=${detail.isTeacher}`
      );
    } catch (err) {
      console.log(`  [${t.id}] Error: ${err.message}`);
    }
  }

  return teachers;
}

// ── 3. Alumnes (llista + detalls sample) ──

async function fetchStudents(token) {
  header("3. ALUMNES");

  const list = await paginatedList(`${USERS_BASE}/v2/lists/students`, token);
  console.log(`Total alumnes (llista): ${list.length}`);

  // Fetch 10 sample details to show the data format
  console.log("\nSample detalls (primers 10):");
  const sampleDetails = [];
  for (const s of list.slice(0, 10)) {
    try {
      const d = await apiGet(`${USERS_BASE}/v2/users/${s.id}/0`, token);
      sampleDetails.push(d);
      const classId = d.academic?.class?.id || "?";
      const stageId = d.academic?.stage?.id || "?";
      console.log(
        `  [${d.user_id}] ${d.name} ${d.lastname1} ${d.lastname2 || ""} | classe=${classId} etapa=${stageId} | ${d.birthday || "-"} | ${d.email || "-"} | ${d.dni || "-"}`
      );
    } catch (err) {
      console.log(`  [${s.id}] Error: ${err.message}`);
    }
  }

  return { list, sampleDetails };
}

// ── 4. Estructura acadèmica ──

async function fetchAcademic(token) {
  header("4. ESTRUCTURA ACADÈMICA");

  // School years
  const yearsData = await apiGet(`${ACADEMIC_BASE}/v1/school_years`, token);
  const years = yearsData.school_years || yearsData || [];
  console.log("Anys escolars:");
  for (const y of years) {
    console.log(`  [${y.id}] ${y.name} ${y.current_year ? "← ACTUAL" : ""}`);
  }

  // Classes + students count + tutor
  console.log("\nClasses (amb alumnes i tutor):");
  const classesRaw = await apiGet(`${ACADEMIC_BASE}/v1/classes`, token);
  const classes = Array.isArray(classesRaw) ? classesRaw : [];

  const classDetails = [];
  let totalStudents = 0;

  for (const c of classes) {
    // Get class detail (has id_tutor)
    const detail = await apiGet(`${ACADEMIC_BASE}/v1/classes/${c.id}`, token);

    // Get students in class (object format {id: {id, name}})
    const studentsObj = await apiGet(`${ACADEMIC_BASE}/v1/classes/${c.id}/students`, token);
    const studentsList = typeof studentsObj === "object" && studentsObj !== null
      ? Object.values(studentsObj)
      : [];

    totalStudents += studentsList.length;
    const className = decodeHtml(detail.name || c.name);

    classDetails.push({
      id: c.id,
      name: className,
      letter: detail.letter,
      id_course: detail.id_course,
      id_tutor: detail.id_tutor,
      studentCount: studentsList.length,
      students: studentsList,
    });

    console.log(
      `  [${c.id}] ${className} | ${studentsList.length} alumnes | tutor_id=${detail.id_tutor || "-"} | curs=${detail.id_course || "-"}`
    );
  }

  console.log(`\n  Total alumnes (totes les classes): ${totalStudents}`);

  // Stages
  console.log("\nEtapes:");
  const stages = await apiGet(`${ACADEMIC_BASE}/v1/stages`, token);
  for (const s of Array.isArray(stages) ? stages : []) {
    console.log(`  [${s.id}] ${s.name}`);
  }

  return { years, classDetails };
}

// ── 5. Comparació amb BD ──

async function compareWithDB(apiStudentList, teachers, classDetails) {
  header("5. COMPARACIÓ AMB BASE DE DADES");

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.log("  ⚠ No hi ha credencials Supabase. Saltant.");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: currentYear } = await supabase
    .from("clickedu_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  if (!currentYear) {
    console.log("  ⚠ No hi ha curs actual a la BD.");
    return;
  }
  console.log(`  Curs actual: ${currentYear.name}`);

  // --- Alumnes ---
  console.log("\n--- ALUMNES ---");
  const { data: dbStudents } = await supabase
    .from("clickedu_students")
    .select("clickedu_id, first_name, last_name, class_name, class_id, is_active, is_repetidor")
    .eq("school_year_id", currentYear.id)
    .eq("is_active", true);

  const dbMap = new Map();
  for (const s of dbStudents || []) {
    dbMap.set(s.clickedu_id, s);
  }

  const apiIds = new Set(apiStudentList.map((s) => s.id));
  const dbIds = new Set(dbMap.keys());

  const onlyInApi = [...apiIds].filter((id) => !dbIds.has(id));
  const onlyInDb = [...dbIds].filter((id) => !apiIds.has(id));

  console.log(`  BD: ${dbMap.size} alumnes actius`);
  console.log(`  API: ${apiStudentList.length} alumnes`);
  console.log(`  Coincideixen: ${[...apiIds].filter((id) => dbIds.has(id)).length}`);

  if (onlyInApi.length > 0) {
    console.log(`  Només a l'API (${onlyInApi.length}):`);
    for (const id of onlyInApi.slice(0, 10)) {
      const s = apiStudentList.find((x) => x.id === id);
      console.log(`    + [${id}] ${s?.name}`);
    }
  }
  if (onlyInDb.length > 0) {
    console.log(`  Només a la BD (${onlyInDb.length}):`);
    for (const id of onlyInDb.slice(0, 10)) {
      const s = dbMap.get(id);
      console.log(`    - [${id}] ${s?.first_name} ${s?.last_name} (${s?.class_name})`);
    }
  }

  // Compare class assignments via academic API
  if (classDetails.length > 0) {
    console.log("\n  Comparació classes (API Acadèmica vs BD):");
    let classMatches = 0;
    let classMismatches = 0;

    for (const cls of classDetails) {
      for (const student of cls.students) {
        const dbStudent = dbMap.get(student.id);
        if (dbStudent && dbStudent.class_id !== cls.id) {
          classMismatches++;
          if (classMismatches <= 5) {
            console.log(
              `    ⚠ [${student.id}] ${student.name}: API class=${cls.id} (${cls.name}) vs BD class=${dbStudent.class_id} (${dbStudent.class_name})`
            );
          }
        } else if (dbStudent) {
          classMatches++;
        }
      }
    }
    console.log(`  Classes correctes: ${classMatches}, discrepàncies: ${classMismatches}`);
  }

  // --- Docents ---
  console.log("\n--- DOCENTS ---");
  const { data: dbDocents } = await supabase
    .from("pi_config_docents")
    .select("id, name, is_active")
    .eq("school_year_id", currentYear.id);

  const activeDocents = (dbDocents || []).filter((d) => d.is_active);
  const apiTeacherNames = teachers
    .filter((t) => t.profile === "teacher" || t.isTeacher)
    .map((t) => `${t.name} ${t.lastname1} ${t.lastname2 || ""}`.trim());

  console.log(`  BD (pi_config_docents): ${activeDocents.length}`);
  console.log(`  API: ${apiTeacherNames.length} professors`);

  if (activeDocents.length === 0) {
    console.log("  → Taula buida, tots els professors de l'API seran nous.");
  }
}

// ── Main ──

async function main() {
  console.log("ClickEDU API v2 Test");
  console.log(`Domain: ${DOMAIN} | Client ID: ${CLIENT_ID}`);

  const token = await authenticate();
  const teachers = await fetchTeachers(token);
  const { list: studentList } = await fetchStudents(token);
  const { classDetails } = await fetchAcademic(token);
  await compareWithDB(studentList, teachers, classDetails);

  header("RESUM");
  console.log(`  Auth: ✓ client_credentials amb domain complet`);
  console.log(`  Professors: ${teachers.length} (amb detalls complets)`);
  console.log(`  Alumnes: ${studentList.length} (llista), detalls disponibles per /users/{id}/0`);
  console.log(`  Classes: ${classDetails.length} (amb alumnes i tutor)`);
  console.log(`\n  Camps alumne disponibles: user_id, name, lastname1, lastname2, birthday,`);
  console.log(`    gender, dni, email, phone, mobilePhone, address, postcode,`);
  console.log(`    nationality, countryOfBirth, placeOfBirth, parents, academic.class.id`);
  console.log(`  Camps professor: user_id, name, lastname1, lastname2, email, dni, phone, birthday`);
}

main().catch((err) => {
  console.error("\nError fatal:", err);
  process.exit(1);
});
