import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { canEdit, canEditField } from "@/lib/permissions";
import type { UserRole } from "@/types";

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

  // Get current school year
  const { data: yearData } = await supabase
    .from("clickedu_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  // Get student
  const { data: student, error } = await supabase
    .from("clickedu_students")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !student) {
    return NextResponse.json(
      { error: "Alumne no trobat" },
      { status: 404 }
    );
  }

  // Get yearly data for current year
  let yearlyData = null;
  if (yearData) {
    const { data } = await supabase
      .from("student_yearly_data")
      .select("*")
      .eq("student_id", id)
      .eq("school_year_id", yearData.id)
      .single();
    yearlyData = data;
  }

  // Get NESE data for current year
  let neseData = null;
  if (yearData) {
    const { data } = await supabase
      .from("student_nese_data")
      .select("*")
      .eq("student_id", id)
      .eq("school_year_id", yearData.id)
      .single();
    neseData = data;
  }

  // Get all years for evolution tab
  const { data: allYears } = await supabase
    .from("clickedu_years")
    .select("id, name, is_current")
    .order("name", { ascending: false });

  // Get all yearly data for this student (for evolution)
  const { data: allYearlyData } = await supabase
    .from("student_yearly_data")
    .select("*, clickedu_years(name)")
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  return NextResponse.json({
    student,
    yearlyData,
    neseData,
    currentYear: yearData,
    allYears: allYears || [],
    allYearlyData: allYearlyData || [],
    userRole: (profile?.role || "convidat") as UserRole,
  });
}

export async function PATCH(
  request: NextRequest,
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

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const role = (profile?.role || "convidat") as UserRole;

  const body = await request.json();
  const { table, data, schoolYearId } = body;

  if (!table || !data || !schoolYearId) {
    return NextResponse.json(
      { error: "Falten dades requerides" },
      { status: 400 }
    );
  }

  // Validate permissions
  if (table === "student_yearly_data") {
    if (!canEdit(role, "alumnes")) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
    }
  } else if (table === "student_nese_data") {
    if (!canEdit(role, "alumnes_nese")) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
    }

    // Check field-level permissions
    for (const field of Object.keys(data)) {
      if (field === "updated_at" || field === "student_id" || field === "school_year_id") continue;
      if (!canEditField(role, field)) {
        return NextResponse.json(
          { error: `No tens permís per editar el camp: ${field}` },
          { status: 403 }
        );
      }
    }
  } else {
    return NextResponse.json(
      { error: "Taula no vàlida" },
      { status: 400 }
    );
  }

  // Upsert data
  const record = {
    student_id: id,
    school_year_id: schoolYearId,
    ...data,
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase
    .from(table)
    .upsert(record, { onConflict: "student_id,school_year_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result });
}
