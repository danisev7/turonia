import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("candidate_emails")
    .select("*")
    .eq("candidate_id", id)
    .order("email_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if any email is linked to a job offer
  const gmailIds = data?.map((e) => e.gmail_message_id) || [];
  const { data: jobOfferLinks } = await supabase
    .from("job_offers")
    .select("gmail_message_id")
    .in("gmail_message_id", gmailIds);

  const jobOfferMessageIds = new Set(
    jobOfferLinks?.map((j) => j.gmail_message_id) || []
  );

  const enriched = data?.map((email) => ({
    ...email,
    isJobOffer: jobOfferMessageIds.has(email.gmail_message_id),
  }));

  return NextResponse.json(enriched);
}
