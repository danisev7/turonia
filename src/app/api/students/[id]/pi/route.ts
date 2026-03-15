import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { canView, canEdit } from "@/lib/permissions";
import type { UserRole } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
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
  if (!canView(role, "alumnes_pi")) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
  }

  // Get school year from query param or current
  const { searchParams } = new URL(request.url);
  const yearId = searchParams.get("yearId");

  let schoolYearId = yearId;
  if (!schoolYearId) {
    const { data: yearData } = await supabase
      .from("clickedu_years")
      .select("id")
      .eq("is_current", true)
      .single();
    schoolYearId = yearData?.id;
  }

  if (!schoolYearId) {
    return NextResponse.json(
      { error: "No s'ha trobat el curs escolar" },
      { status: 404 }
    );
  }

  // Get PI document
  const { data: piDocument } = await supabase
    .from("pi_documents")
    .select("*")
    .eq("student_id", studentId)
    .eq("school_year_id", schoolYearId)
    .single();

  if (!piDocument) {
    return NextResponse.json({
      piDocument: null,
      materies: [],
      professionals: [],
      orientacions: [],
      compTransversals: [],
      signatures: [],
      reunions: [],
      continuitat: [],
      materiaMesures: {},
      materiaCurriculum: {},
    });
  }

  // Fetch all child tables in parallel
  const [
    materiesRes,
    professionalsRes,
    orientacionsRes,
    compTransversalsRes,
    signaturesRes,
    reunionsRes,
    continuitatRes,
  ] = await Promise.all([
    supabase
      .from("pi_dades_materies")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_dades_professionals")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_orientacions")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_comp_transversals")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_seguiment_signatures")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_seguiment_reunions")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
    supabase
      .from("pi_seguiment_continuitat")
      .select("*")
      .eq("pi_document_id", piDocument.id)
      .order("sort_order"),
  ]);

  const materies = materiesRes.data || [];

  // For each materia, fetch mesures and curriculum
  const materiaIds = materies.map((m) => m.id);
  let materiaMesures: Record<string, any[]> = {};
  let materiaCurriculum: Record<string, any[]> = {};

  if (materiaIds.length > 0) {
    const [mesuresRes, curriculumRes] = await Promise.all([
      supabase
        .from("pi_materia_mesures")
        .select("*")
        .in("pi_materia_id", materiaIds)
        .order("sort_order"),
      supabase
        .from("pi_materia_curriculum")
        .select("*")
        .in("pi_materia_id", materiaIds)
        .order("sort_order"),
    ]);

    // Group by materia id
    for (const m of mesuresRes.data || []) {
      if (!materiaMesures[m.pi_materia_id]) materiaMesures[m.pi_materia_id] = [];
      materiaMesures[m.pi_materia_id].push(m);
    }
    for (const c of curriculumRes.data || []) {
      if (!materiaCurriculum[c.pi_materia_id]) materiaCurriculum[c.pi_materia_id] = [];
      materiaCurriculum[c.pi_materia_id].push(c);
    }
  }

  return NextResponse.json({
    piDocument,
    materies,
    professionals: professionalsRes.data || [],
    orientacions: orientacionsRes.data || [],
    compTransversals: compTransversalsRes.data || [],
    signatures: signaturesRes.data || [],
    reunions: reunionsRes.data || [],
    continuitat: continuitatRes.data || [],
    materiaMesures,
    materiaCurriculum,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
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
  if (!canEdit(role, "alumnes_pi")) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
  }

  const body = await request.json();
  const {
    schoolYearId,
    document: docData,
    materies,
    professionals,
    orientacions,
    compTransversals,
    signatures,
    reunions,
    continuitat,
    materiaMesures: materiaMesuresData,
    materiaCurriculum: materiaCurriculumData,
  } = body;

  if (!schoolYearId) {
    return NextResponse.json(
      { error: "Falta el curs escolar" },
      { status: 400 }
    );
  }

  // Upsert pi_documents
  const piDocRecord = {
    student_id: studentId,
    school_year_id: schoolYearId,
    ...docData,
    updated_at: new Date().toISOString(),
  };

  const { data: piDocument, error: docError } = await supabase
    .from("pi_documents")
    .upsert(piDocRecord, {
      onConflict: "student_id,school_year_id",
    })
    .select()
    .single();

  if (docError || !piDocument) {
    return NextResponse.json(
      { error: docError?.message || "Error creant document PI" },
      { status: 500 }
    );
  }

  const piDocId = piDocument.id;

  // Sync child tables using delete-then-insert pattern
  // This is simpler and safer than trying to diff updates
  const syncErrors: string[] = [];
  const syncTable = async (
    tableName: string,
    fkColumn: string,
    fkValue: string,
    rows: any[] | undefined
  ) => {
    if (rows === undefined) return; // Skip if not provided

    // Delete existing rows
    const { error: delError } = await supabase
      .from(tableName)
      .delete()
      .eq(fkColumn, fkValue);
    if (delError) {
      console.error(`Error deleting ${tableName}:`, delError);
      syncErrors.push(`${tableName} delete: ${delError.message}`);
      return;
    }

    // Insert new rows
    if (rows.length > 0) {
      const records = rows.map((row, i) => {
        const record = {
          ...row,
          [fkColumn]: fkValue,
          sort_order: row.sort_order ?? i,
        };
        delete record.id; // Let DB generate new IDs
        return record;
      });
      const { error } = await supabase.from(tableName).insert(records);
      if (error) {
        console.error(`Error inserting ${tableName}:`, error, JSON.stringify(records));
        syncErrors.push(`${tableName} insert: ${error.message}`);
      }
    }
  };

  // Sync document-level child tables
  await Promise.all([
    syncTable("pi_dades_professionals", "pi_document_id", piDocId, professionals),
    syncTable("pi_orientacions", "pi_document_id", piDocId, orientacions),
    syncTable("pi_comp_transversals", "pi_document_id", piDocId, compTransversals),
    syncTable("pi_seguiment_signatures", "pi_document_id", piDocId, signatures),
    syncTable("pi_seguiment_reunions", "pi_document_id", piDocId, reunions),
    syncTable("pi_seguiment_continuitat", "pi_document_id", piDocId, continuitat),
  ]);

  // Sync materies (special: they have child tables themselves)
  if (materies !== undefined) {
    // Delete existing materies (cascading deletes mesures/curriculum)
    await supabase
      .from("pi_dades_materies")
      .delete()
      .eq("pi_document_id", piDocId);

    if (materies.length > 0) {
      // Insert materies and get their new IDs
      const materiaRecords = materies.map((m: any, i: number) => ({
        pi_document_id: piDocId,
        materia: m.materia,
        docent: m.docent,
        nivell: m.nivell,
        observacions: m.observacions,
        sort_order: m.sort_order ?? i,
      }));

      const { data: insertedMateries, error: matError } = await supabase
        .from("pi_dades_materies")
        .insert(materiaRecords)
        .select();

      if (matError || !insertedMateries) {
        console.error("Error syncing materies:", matError);
        syncErrors.push(`pi_dades_materies insert: ${matError?.message || "no data returned"}`);
      } else {
        // Sync materia child tables using the original materia name as key
        for (const inserted of insertedMateries) {
          const originalMateria = materies.find(
            (m: any) => m.materia === inserted.materia
          );
          if (!originalMateria) continue;

          const mesures = materiaMesuresData?.[originalMateria.materia];
          const curriculum = materiaCurriculumData?.[originalMateria.materia];

          await Promise.all([
            syncTable("pi_materia_mesures", "pi_materia_id", inserted.id, mesures),
            syncTable("pi_materia_curriculum", "pi_materia_id", inserted.id, curriculum),
          ]);
        }
      }
    }
  }

  if (syncErrors.length > 0) {
    return NextResponse.json(
      { error: `Errors: ${syncErrors.join("; ")}`, piDocumentId: piDocId },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, piDocumentId: piDocId });
}
