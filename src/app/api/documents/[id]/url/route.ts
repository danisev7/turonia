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

  // Get document metadata
  const { data: doc, error: docError } = await supabase
    .from("candidate_documents")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document no trobat" }, { status: 404 });
  }

  // Create signed URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 3600);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
