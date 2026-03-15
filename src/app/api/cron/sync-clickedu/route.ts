import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Sync students and teachers from ClickEDU API.
 * Replaces the old web-scraping Edge Function with direct API calls.
 *
 * Called by Vercel Cron (GET) or manually (POST).
 */

// ── ClickEDU API config ──

const API_KEY = process.env.CLICKEDU_API_KEY || "";
const CLIENT_ID = Number(process.env.CLICKEDU_CLIENT_ID || "0");
const CLIENT_SECRET = process.env.CLICKEDU_CLIENT_SECRET || "";
const DOMAIN = `${process.env.CLICKEDU_DOMAIN || "escolaelturo"}.clickedu.eu`;

const LOGIN_URL = "https://api.clickedu.eu/login/v1/auth/token";
const USERS_BASE = "https://api.clickedu.eu/users";
const ACADEMIC_BASE = "https://api.clickedu.eu/academic";

// Class name normalization (Clickedu long names → short codes)
const CLASS_NAME_NORMALIZE: Record<string, string> = {
  "Infantil 3": "I3",
  "Infantil 4": "I4",
  "Infantil 5": "I5",
  "Primer de Primària": "P1",
  "Segon de Primària": "P2",
  "Tercer de Primària": "P3",
  "Quart de Primària": "P4",
  "Cinquè de Primària": "P5",
  "Sisè de Primària": "P6",
  "Primer d'ESO": "S1",
  "Segon d'ESO": "S2",
  "Tercer d'ESO": "S3",
  "Quart d'ESO": "S4",
};

function decodeHtml(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function normalizeClassName(raw: string): string {
  const decoded = decodeHtml(raw);
  return CLASS_NAME_NORMALIZE[decoded] || decoded;
}

// ── API helpers ──

async function getToken(): Promise<string> {
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function apiGet(url: string, token: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-api-key": API_KEY,
      domain: DOMAIN,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function paginatedList(
  baseUrl: string,
  token: string
): Promise<{ id: number; name: string }[]> {
  const all: { id: number; name: string }[] = [];
  let page = 1;
  while (true) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const data = await apiGet(`${baseUrl}${sep}page=${page}&limit=500`, token);
    all.push(...(data.users || []));
    if (!data.paginator || page >= data.paginator.pages) break;
    page++;
  }
  return all;
}

// ── Main sync logic ──

async function syncClickedu() {
  const startTime = Date.now();
  const errors: { context: string; error: string }[] = [];

  if (!API_KEY || !CLIENT_SECRET || !CLIENT_ID) {
    throw new Error("Missing ClickEDU API credentials");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!;

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  // Get current school year
  const { data: currentYear, error: yearError } = await supabase
    .from("clickedu_years")
    .select("id")
    .eq("is_current", true)
    .single();

  if (yearError || !currentYear) {
    throw new Error("No current school year found");
  }

  const schoolYearId = currentYear.id;
  const now = new Date().toISOString();

  // ── 1. Authenticate ──
  const token = await getToken();

  // ── 2. Fetch class structure (for class_id mapping) ──
  const classesRaw = await apiGet(`${ACADEMIC_BASE}/v1/classes`, token);
  const classes: { id: number; name: string }[] = Array.isArray(classesRaw)
    ? classesRaw
    : [];

  const classMap = new Map<number, string>();
  for (const c of classes) {
    classMap.set(c.id, normalizeClassName(c.name));
  }

  // ── 3. Sync students ──
  const studentList = await paginatedList(
    `${USERS_BASE}/v2/lists/students`,
    token
  );

  let studentsOk = 0;
  let studentsError = 0;
  const fetchedStudentIds = new Set<number>();

  // Process in batches of 10 (concurrent detail fetches)
  const BATCH_SIZE = 10;
  for (let i = 0; i < studentList.length; i += BATCH_SIZE) {
    const batch = studentList.slice(i, i + BATCH_SIZE);

    const details = await Promise.all(
      batch.map(async (s) => {
        try {
          return await apiGet(`${USERS_BASE}/v2/users/${s.id}/0`, token);
        } catch (err) {
          return null;
        }
      })
    );

    for (const detail of details) {
      if (!detail) {
        studentsError++;
        continue;
      }

      const clickeduId = detail.user_id;
      fetchedStudentIds.add(clickeduId);

      const classId = detail.academic?.class?.id || 0;
      const className = classMap.get(classId) || String(classId);

      const record = {
        clickedu_id: clickeduId,
        school_year_id: schoolYearId,
        first_name: detail.name || "",
        last_name: `${detail.lastname1 || ""} ${detail.lastname2 || ""}`.trim(),
        class_id: classId,
        class_name: className,
        birthday: detail.birthday || null,
        gender: detail.gender || null,
        dni: detail.dni || null,
        email: detail.email || null,
        phone: detail.phone || null,
        secondary_phone: detail.secondaryPhone || null,
        mobile_phone: detail.mobilePhone || null,
        address: detail.address || null,
        postcode: detail.postcode || null,
        nationality: detail.nationality || null,
        country_of_birth: detail.countryOfBirth || null,
        place_of_birth: detail.placeOfBirth || null,
        parent1_clickedu_id: detail.parents?.parent1_id || null,
        parent2_clickedu_id: detail.parents?.parent2_id || null,
        remarks: detail.remarks || null,
        medical_remarks: detail.medicalRemarks || null,
        is_active: true,
        list_synced_at: now,
        detail_synced_at: now,
        updated_at: now,
      };

      const { error } = await supabase
        .from("clickedu_students")
        .upsert(record, { onConflict: "clickedu_id,school_year_id" });

      if (error) {
        studentsError++;
        errors.push({
          context: `student ${clickeduId}`,
          error: error.message,
        });
      } else {
        studentsOk++;
      }
    }
  }

  // Deactivate students not in API list
  const { data: allExisting } = await supabase
    .from("clickedu_students")
    .select("clickedu_id")
    .eq("is_active", true)
    .eq("school_year_id", schoolYearId);

  if (allExisting) {
    const toDeactivate = allExisting
      .filter((s) => !fetchedStudentIds.has(s.clickedu_id))
      .map((s) => s.clickedu_id);

    if (toDeactivate.length > 0) {
      await supabase
        .from("clickedu_students")
        .update({ is_active: false, updated_at: now })
        .eq("school_year_id", schoolYearId)
        .in("clickedu_id", toDeactivate);
    }
  }

  // Auto-create student_yearly_data for active students
  const { data: activeStudents } = await supabase
    .from("clickedu_students")
    .select("id")
    .eq("is_active", true)
    .eq("school_year_id", schoolYearId);

  if (activeStudents) {
    for (const student of activeStudents) {
      await supabase
        .from("student_yearly_data")
        .upsert(
          {
            student_id: student.id,
            school_year_id: schoolYearId,
            updated_at: now,
          },
          { onConflict: "student_id,school_year_id", ignoreDuplicates: true }
        );
    }
  }

  // ── 4. Sync teachers → pi_config_docents ──
  const teacherList = await paginatedList(
    `${USERS_BASE}/v2/lists/teachers`,
    token
  );

  let teachersOk = 0;
  let teachersError = 0;
  const fetchedTeacherIds = new Set<number>();

  for (const t of teacherList) {
    try {
      const detail = await apiGet(`${USERS_BASE}/v2/users/${t.id}/0`, token);
      const clickeduId = detail.user_id;
      fetchedTeacherIds.add(clickeduId);

      // Skip "Administrador del Sistema" or non-teacher profiles
      if (detail.profile !== "teacher" && !detail.isTeacher) continue;

      const fullName =
        `${detail.name} ${detail.lastname1} ${detail.lastname2 || ""}`.trim();

      const record = {
        clickedu_id: clickeduId,
        name: fullName,
        first_name: detail.name || null,
        last_name1: detail.lastname1 || null,
        last_name2: detail.lastname2 || null,
        email: detail.email || null,
        phone: detail.phone || null,
        dni: detail.dni || null,
        birthday: detail.birthday || null,
        school_year_id: schoolYearId,
        is_active: true,
      };

      const { error } = await supabase
        .from("pi_config_docents")
        .upsert(record, { onConflict: "clickedu_id,school_year_id" });

      if (error) {
        teachersError++;
        errors.push({
          context: `teacher ${clickeduId} (${fullName})`,
          error: error.message,
        });
      } else {
        teachersOk++;
      }
    } catch (err) {
      teachersError++;
      errors.push({
        context: `teacher ${t.id}`,
        error: (err as Error).message,
      });
    }
  }

  // Deactivate teachers not in API list
  const { data: allDocents } = await supabase
    .from("pi_config_docents")
    .select("clickedu_id")
    .eq("is_active", true)
    .eq("school_year_id", schoolYearId)
    .not("clickedu_id", "is", null);

  if (allDocents) {
    const toDeactivate = allDocents
      .filter((d) => d.clickedu_id && !fetchedTeacherIds.has(d.clickedu_id))
      .map((d) => d.clickedu_id);

    if (toDeactivate.length > 0) {
      await supabase
        .from("pi_config_docents")
        .update({ is_active: false })
        .eq("school_year_id", schoolYearId)
        .in("clickedu_id", toDeactivate);
    }
  }

  // ── 5. Log sync ──
  const durationMs = Date.now() - startTime;
  const status =
    studentsError === 0 && teachersError === 0
      ? "completed"
      : studentsOk > 0
        ? "partial"
        : "failed";

  try {
    await supabase.from("clickedu_sync_logs").insert({
      sync_type: "api_full",
      status,
      records_total: studentList.length + teacherList.length,
      records_ok: studentsOk + teachersOk,
      records_error: studentsError + teachersError,
      duration_ms: durationMs,
      error_details: errors.length > 0 ? errors : null,
    });
  } catch {
    // Ignore logging errors (table might not exist)
  }

  return {
    status,
    students: {
      found: studentList.length,
      synced: studentsOk,
      errors: studentsError,
    },
    teachers: {
      found: teacherList.length,
      synced: teachersOk,
      errors: teachersError,
    },
    duration_ms: durationMs,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ── Route handlers ──

async function handleRequest(request: NextRequest) {
  // Verify CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncClickedu();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
