import { NextResponse } from "next/server";

/**
 * @deprecated Use /api/cron/sync-clickedu instead.
 * This route previously called the web-scraping Edge Function.
 * Kept for backwards compatibility — redirects to the new API-based sync.
 */

export async function GET() {
  return NextResponse.json(
    {
      error: "Deprecated. Use /api/cron/sync-clickedu instead.",
      redirect: "/api/cron/sync-clickedu",
    },
    { status: 301 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated. Use /api/cron/sync-clickedu instead.",
      redirect: "/api/cron/sync-clickedu",
    },
    { status: 301 }
  );
}
