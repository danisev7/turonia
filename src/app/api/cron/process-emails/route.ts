import { NextRequest, NextResponse } from "next/server";

async function handleCronRequest(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    // Call the Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/process-emails`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
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

// POST: Alternative for manual triggers or pg_cron via pg_net
export async function POST(request: NextRequest) {
  return handleCronRequest(request);
}
