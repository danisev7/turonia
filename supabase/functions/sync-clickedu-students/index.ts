import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { DOMParser, initParser } from "jsr:@b-fuze/deno-dom/wasm-noinit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://escolaelturo.clickedu.eu";

// ── Known class mapping (curs 2025-2026) ────────────────────────────
const CLASS_NAME_TO_ID: Record<string, number> = {
  "Infantil 3": 105,
  "Infantil 4": 106,
  "Infantil 5": 107,
  "Primer de Primària": 108,
  "Segon de Primària": 109,
  "Tercer de Primària": 110,
  "Quart de Primària": 111,
  "Cinquè de Primària": 112,
  "Sisè de Primària": 113,
  "Primer d'ESO": 114,
  "Segon d'ESO": 115,
  "Tercer d'ESO": 116,
  "Quart d'ESO": 117,
};

interface Student {
  clickedu_id: number;
  first_name: string;
  last_name: string;
  class_id: number;
  class_name: string;
}

// ── Clickedu Login (2-step) ─────────────────────────────────────────

function extractCookies(response: Response): string[] {
  const cookies: string[] = [];
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      const cookie = value.split(";")[0];
      cookies.push(cookie);
    }
  }
  return cookies;
}

function mergeCookies(existing: string[], newCookies: string[]): string[] {
  const map = new Map<string, string>();
  for (const c of [...existing, ...newCookies]) {
    const name = c.split("=")[0];
    map.set(name, c);
  }
  return Array.from(map.values());
}

function cookieHeader(cookies: string[]): string {
  return cookies.join("; ");
}

async function clickeduLogin(
  username: string,
  password: string,
  passfileContent: string
): Promise<string[]> {
  // Step 1: POST credentials
  const step1Res = await fetch(`${BASE_URL}/user.php?action=doLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password, button: "" }),
    redirect: "manual",
  });

  let cookies = extractCookies(step1Res);
  const step1Html = await step1Res.text();

  // Parse hidden fields from the passfile form
  await initParser();
  const doc1 = new DOMParser().parseFromString(step1Html, "text/html");
  if (!doc1) throw new Error("LOGIN_STEP1_PARSE_FAILED: Could not parse step 1 HTML");

  const idUsuariInput = doc1.querySelector('input[name="id_usuari"]');
  const maxFileSizeInput = doc1.querySelector('input[name="MAX_FILE_SIZE"]');

  if (!idUsuariInput || !maxFileSizeInput) {
    throw new Error(
      "LOGIN_STEP1_FIELDS_MISSING: Could not find id_usuari or MAX_FILE_SIZE hidden fields. Login may have failed."
    );
  }

  const idUsuari = idUsuariInput.getAttribute("value") || "";
  const maxFileSize = maxFileSizeInput.getAttribute("value") || "";

  // Step 2: Upload passfile
  const formData = new FormData();
  formData.append(
    "userfile",
    new Blob([passfileContent], { type: "text/plain" }),
    "archivo_paso.txt"
  );
  formData.append("id_usuari", idUsuari);
  formData.append("MAX_FILE_SIZE", maxFileSize);

  const step2Res = await fetch(
    `${BASE_URL}/user.php?action=controlArxiuPas`,
    {
      method: "POST",
      headers: { Cookie: cookieHeader(cookies) },
      body: formData,
      redirect: "manual",
    }
  );

  cookies = mergeCookies(cookies, extractCookies(step2Res));

  // Verify login success: Clickedu may respond with either:
  // - HTTP 302 redirect to /sumari/ (Location header)
  // - HTTP 200 with JS redirect: window.location.href='./sumari/index.php'
  const location = step2Res.headers.get("location") || "";
  const step2Body = await step2Res.text();
  const isHttpRedirect = location.includes("sumari");
  const isJsRedirect = step2Body.includes("sumari");

  if (!isHttpRedirect && !isJsRedirect) {
    throw new Error(
      `LOGIN_STEP2_FAILED: Expected redirect to /sumari/, got location="${location}", status=${step2Res.status}. Body preview: ${step2Body.substring(0, 200)}`
    );
  }

  return cookies;
}

// ── Fetch and Parse Student List ────────────────────────────────────

async function fetchStudentList(cookies: string[]): Promise<Student[]> {
  // Must POST with lletra_usuari=TOTS to get all students (default is letter "A")
  const res = await fetch(
    `${BASE_URL}/admin/users.php?tipus=alu&selected=alu`,
    {
      method: "POST",
      headers: {
        Cookie: cookieHeader(cookies),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        lletra_usuari: "TOTS",
        cerca_usuari: "",
        classe: "",
      }),
      redirect: "manual",
    }
  );

  if (res.status >= 300 && res.status < 400) {
    throw new Error(
      "SESSION_EXPIRED: Redirected when fetching student list (likely session expired)"
    );
  }

  // Clickedu uses ISO-8859-15 encoding — decode properly for accented characters
  const rawBytes = await res.arrayBuffer();
  const html = new TextDecoder("iso-8859-15").decode(rawBytes);
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) throw new Error("PARSE_FAILED: Could not parse student list HTML");

  const rows = doc.querySelectorAll("#userDataTable tbody tr");
  if (!rows || rows.length === 0) {
    throw new Error(
      "STRUCTURE_CHANGED: No rows found in #userDataTable tbody. The HTML structure may have changed."
    );
  }

  const students: Student[] = [];

  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    if (cells.length < 6) continue;

    // Expected columns: Id, Nom, Cognoms, Tipus, Classe, Estat
    const clickeduId = parseInt(cells[0].textContent?.trim() || "", 10);
    const firstName = cells[1].textContent?.trim() || "";
    const lastName = cells[2].textContent?.trim() || "";
    const className = cells[4].textContent?.trim() || "";

    if (isNaN(clickeduId) || !firstName || !lastName) continue;

    // Strip suffixes like "(repetidor)" for class matching
    const baseClassName = className.replace(/\s*\(.*\)$/, "").trim();
    const classId = CLASS_NAME_TO_ID[baseClassName] || CLASS_NAME_TO_ID[className] || 0;

    students.push({
      clickedu_id: clickeduId,
      first_name: firstName,
      last_name: lastName,
      class_id: classId,
      class_name: className,
    });
  }

  // Sanity check: we expect ~302 students
  if (students.length < 250) {
    throw new Error(
      `STRUCTURE_CHANGED: Expected > 250 students but found ${students.length}. The HTML structure may have changed.`
    );
  }

  return students;
}

// ── Main Handler ────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse credentials from request body
    let username = "";
    let password = "";
    let passfileContent = "";
    try {
      const body = await req.json();
      username = body.username || "";
      password = body.password || "";
      passfileContent = body.passfileContent || "";
    } catch {
      // fall through
    }

    if (!username || !password || !passfileContent) {
      return new Response(
        JSON.stringify({
          error: "Missing credentials: username, password, passfileContent required",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Login to Clickedu
    const cookies = await clickeduLogin(username, password, passfileContent);

    // Step 2: Fetch student list
    const students = await fetchStudentList(cookies);

    // Step 3: Upsert students
    let recordsOk = 0;
    let recordsError = 0;
    const errors: { clickedu_id: number; error: string }[] = [];

    const now = new Date().toISOString();
    const fetchedIds = new Set<number>();

    for (const student of students) {
      fetchedIds.add(student.clickedu_id);
      const { error } = await supabase
        .from("clickedu_students")
        .upsert(
          {
            clickedu_id: student.clickedu_id,
            first_name: student.first_name,
            last_name: student.last_name,
            class_id: student.class_id,
            class_name: student.class_name,
            is_active: true,
            list_synced_at: now,
            updated_at: now,
          },
          { onConflict: "clickedu_id" }
        );

      if (error) {
        recordsError++;
        errors.push({ clickedu_id: student.clickedu_id, error: error.message });
      } else {
        recordsOk++;
      }
    }

    // Step 4: Mark students not in the list as inactive
    const { data: allExisting } = await supabase
      .from("clickedu_students")
      .select("clickedu_id")
      .eq("is_active", true);

    if (allExisting) {
      const toDeactivate = allExisting
        .filter((s) => !fetchedIds.has(s.clickedu_id))
        .map((s) => s.clickedu_id);

      if (toDeactivate.length > 0) {
        await supabase
          .from("clickedu_students")
          .update({ is_active: false, updated_at: now })
          .in("clickedu_id", toDeactivate);
      }
    }

    // Step 5: Log sync
    const durationMs = Date.now() - startTime;
    const status =
      recordsError === 0 ? "completed" : recordsOk > 0 ? "partial" : "failed";

    await supabase.from("clickedu_sync_logs").insert({
      sync_type: "students",
      status,
      records_total: students.length,
      records_ok: recordsOk,
      records_error: recordsError,
      duration_ms: durationMs,
      error_details: errors.length > 0 ? errors : null,
    });

    const result = {
      status,
      students_found: students.length,
      records_ok: recordsOk,
      records_error: recordsError,
      duration_ms: durationMs,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const durationMs = Date.now() - startTime;

    // Try to log failure
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("clickedu_sync_logs").insert({
        sync_type: "students",
        status: "failed",
        records_total: 0,
        records_ok: 0,
        records_error: 0,
        duration_ms: durationMs,
        error_details: { error: message },
      });
    } catch {
      // ignore logging errors
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
