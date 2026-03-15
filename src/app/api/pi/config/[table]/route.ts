import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { canEdit } from "@/lib/permissions";
import type { UserRole } from "@/types";

// Map URL param to actual Supabase table name
const TABLE_MAP: Record<string, string> = {
  materies: "pi_config_materies",
  professionals: "pi_config_professionals",
  models: "pi_config_models",
  instruments: "pi_config_instruments",
  "model-mesures": "pi_config_model_mesures",
  docents: "pi_config_docents",
  curriculum: "pi_config_curriculum",
  transversals: "pi_config_transversals",
  "sabers-dig": "pi_config_sabers_dig",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const tableName = TABLE_MAP[table];
  if (!tableName) {
    return NextResponse.json({ error: "Taula no v\u00e0lida" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const tableName = TABLE_MAP[table];
  if (!tableName) {
    return NextResponse.json({ error: "Taula no v\u00e0lida" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const role = (profile?.role || "convidat") as UserRole;
  if (!canEdit(role, "configuracio_pi")) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
  }

  const body = await request.json();
  const { data, error } = await supabase
    .from(tableName)
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
