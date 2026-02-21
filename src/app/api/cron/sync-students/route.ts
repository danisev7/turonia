import { NextRequest, NextResponse } from "next/server";

async function handleCronRequest(request: NextRequest) {
  // CRON_SECRET is mandatory — fail if not configured
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Server misconfigured: CRON_SECRET required" },
      { status: 500 }
    );
  }

  // Verify the Authorization header (Vercel Cron sends it automatically)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    // Read Clickedu credentials from env
    const username = process.env.CLICKEDU_USERNAME;
    const password = process.env.CLICKEDU_PASSWORD;
    const passfileContent = process.env.CLICKEDU_PASSFILE;

    if (!username || !password || !passfileContent) {
      return NextResponse.json(
        { error: "Missing Clickedu credentials (CLICKEDU_USERNAME, CLICKEDU_PASSWORD, CLICKEDU_PASSFILE)" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/sync-clickedu-students`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, passfileContent }),
      }
    );

    const result = await response.json();

    return NextResponse.json(result, { status: response.ok ? 200 : 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Vercel Cron calls this endpoint via GET
export async function GET(request: NextRequest) {
  return handleCronRequest(request);
}

// POST: Alternative for manual triggers
export async function POST(request: NextRequest) {
  return handleCronRequest(request);
}
