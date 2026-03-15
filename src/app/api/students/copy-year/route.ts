import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  // Only admin/direccio can copy years
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  if (!profile || !["admin", "direccio"].includes(profile.role)) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
  }

  const body = await request.json();
  const { sourceYearId, targetYearId, copyNese, copyPi } = body;

  if (!sourceYearId || !targetYearId) {
    return NextResponse.json(
      { error: "Falten IDs de curs origen i destí" },
      { status: 400 }
    );
  }

  // Build a map: clickedu_id → student_id for target year
  const { data: targetStudents } = await supabase
    .from("clickedu_students")
    .select("id, clickedu_id")
    .eq("school_year_id", targetYearId);

  const targetMap = new Map<number, string>();
  for (const s of targetStudents || []) {
    targetMap.set(s.clickedu_id, s.id);
  }

  // Build a map: source student_id → clickedu_id
  const { data: sourceStudents } = await supabase
    .from("clickedu_students")
    .select("id, clickedu_id")
    .eq("school_year_id", sourceYearId);

  const sourceClickeduMap = new Map<string, number>();
  for (const s of sourceStudents || []) {
    sourceClickeduMap.set(s.id, s.clickedu_id);
  }

  // Get source yearly data
  const { data: sourceYearly, error: yearlyError } = await supabase
    .from("student_yearly_data")
    .select("*")
    .eq("school_year_id", sourceYearId);

  if (yearlyError) {
    return NextResponse.json({ error: yearlyError.message }, { status: 500 });
  }

  // Helper: resolve source student_id → target student_id
  function resolveTargetStudentId(sourceStudentId: string): string | undefined {
    const clickeduId = sourceClickeduMap.get(sourceStudentId);
    return clickeduId !== undefined ? targetMap.get(clickeduId) : undefined;
  }

  let copiedYearly = 0;
  let copiedNese = 0;
  let copiedPi = 0;
  let skippedStudents = 0;
  let errors = 0;

  // Copy yearly data (reset estat and keep structure)
  for (const record of sourceYearly || []) {
    const targetStudentId = resolveTargetStudentId(record.student_id);

    if (!targetStudentId) {
      skippedStudents++;
      continue;
    }

    const { error } = await supabase.from("student_yearly_data").upsert(
      {
        student_id: targetStudentId,
        school_year_id: targetYearId,
        graella_nese: record.graella_nese,
        curs_repeticio: null,
        dades_familiars: record.dades_familiars,
        academic: null,
        comportament: null,
        acords_tutoria: null,
        estat: record.graella_nese ? "pendent" : null,
        observacions: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,school_year_id" }
    );

    if (error) {
      errors++;
    } else {
      copiedYearly++;
    }
  }

  // Copy NESE data if requested
  if (copyNese) {
    const { data: sourceNese, error: neseError } = await supabase
      .from("student_nese_data")
      .select("*")
      .eq("school_year_id", sourceYearId);

    if (!neseError && sourceNese) {
      for (const record of sourceNese) {
        const targetStudentId = resolveTargetStudentId(record.student_id);

        if (!targetStudentId) continue;

        const { error } = await supabase.from("student_nese_data").upsert(
          {
            student_id: targetStudentId,
            school_year_id: targetYearId,
            data_incorporacio: record.data_incorporacio,
            escolaritzacio_previa: record.escolaritzacio_previa,
            reunio_poe: false,
            reunio_mesi: false,
            reunio_eap: false,
            informe_eap: record.informe_eap,
            cad: record.cad,
            informe_diagnostic: record.informe_diagnostic,
            curs_retencio: record.curs_retencio,
            nise: record.nise,
            ssd: record.ssd,
            mesura_nese: record.mesura_nese,
            materies_pi: record.materies_pi,
            eixos_pi: record.eixos_pi,
            nac_pi: null,
            nac_final: null,
            serveis_externs: record.serveis_externs,
            beca_mec: null,
            observacions_curs: null,
            dades_rellevants_historic: [
              record.dades_rellevants_historic,
              record.observacions_curs
                ? `[Curs anterior] ${record.observacions_curs}`
                : null,
            ]
              .filter(Boolean)
              .join("\n") || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id,school_year_id" }
        );

        if (error) {
          errors++;
        } else {
          copiedNese++;
        }
      }
    }
  }

  // Copy PI documents and all child tables if requested
  if (copyPi) {
    const { data: sourcePiDocs, error: piError } = await supabase
      .from("pi_documents")
      .select("*")
      .eq("school_year_id", sourceYearId);

    if (!piError && sourcePiDocs) {
      for (const doc of sourcePiDocs) {
        const targetStudentId = resolveTargetStudentId(doc.student_id);
        if (!targetStudentId) continue;

        // Check if target already has a PI document
        const { data: existing } = await supabase
          .from("pi_documents")
          .select("id")
          .eq("student_id", targetStudentId)
          .eq("school_year_id", targetYearId)
          .single();

        if (existing) continue; // Don't overwrite existing PI

        // Insert pi_document (reset horari)
        const { data: newDoc, error: docError } = await supabase
          .from("pi_documents")
          .insert({
            student_id: targetStudentId,
            school_year_id: targetYearId,
            model: doc.model,
            prev_universal: doc.prev_universal,
            prev_addicional: doc.prev_addicional,
            prev_intensiu: doc.prev_intensiu,
            just_nee: doc.just_nee,
            just_dea: doc.just_dea,
            just_tea: doc.just_tea,
            just_nouvingut: doc.just_nouvingut,
            just_altes_cap: doc.just_altes_cap,
            just_social: doc.just_social,
            just_altres: doc.just_altres,
            just_text: doc.just_text,
            altres_orientacions: doc.altres_orientacions,
            horari: null, // Reset horari for new year
          })
          .select("id")
          .single();

        if (docError || !newDoc) {
          errors++;
          continue;
        }

        const newDocId = newDoc.id;
        copiedPi++;

        // Copy pi_dades_materies + their children
        const { data: sourceMateries } = await supabase
          .from("pi_dades_materies")
          .select("*")
          .eq("pi_document_id", doc.id);

        if (sourceMateries) {
          for (const mat of sourceMateries) {
            const { data: newMat } = await supabase
              .from("pi_dades_materies")
              .insert({
                pi_document_id: newDocId,
                materia: mat.materia,
                docent: mat.docent,
                nivell: mat.nivell,
                observacions: mat.observacions,
                sort_order: mat.sort_order,
              })
              .select("id")
              .single();

            if (!newMat) continue;

            // Copy pi_materia_mesures
            const { data: sourceMesures } = await supabase
              .from("pi_materia_mesures")
              .select("*")
              .eq("pi_materia_id", mat.id);

            if (sourceMesures) {
              for (const mes of sourceMesures) {
                await supabase.from("pi_materia_mesures").insert({
                  pi_materia_id: newMat.id,
                  tipus: mes.tipus,
                  mesures: mes.mesures,
                  observacions: mes.observacions,
                  sort_order: mes.sort_order,
                });
              }
            }

            // Copy pi_materia_curriculum (reset avaluacio)
            const { data: sourceCurr } = await supabase
              .from("pi_materia_curriculum")
              .select("*")
              .eq("pi_materia_id", mat.id);

            if (sourceCurr) {
              for (const cur of sourceCurr) {
                await supabase.from("pi_materia_curriculum").insert({
                  pi_materia_id: newMat.id,
                  nivell: cur.nivell,
                  competencia: cur.competencia,
                  criteris: cur.criteris,
                  sabers: cur.sabers,
                  instruments: cur.instruments,
                  avaluacio: null, // Reset for new year
                  sort_order: cur.sort_order,
                });
              }
            }
          }
        }

        // Copy pi_dades_professionals
        const { data: sourceProfs } = await supabase
          .from("pi_dades_professionals")
          .select("*")
          .eq("pi_document_id", doc.id);

        if (sourceProfs) {
          for (const prof of sourceProfs) {
            await supabase.from("pi_dades_professionals").insert({
              pi_document_id: newDocId,
              professional: prof.professional,
              nom: prof.nom,
              contacte: prof.contacte,
              notes: prof.notes,
              sort_order: prof.sort_order,
            });
          }
        }

        // Copy pi_orientacions
        const { data: sourceOrient } = await supabase
          .from("pi_orientacions")
          .select("*")
          .eq("pi_document_id", doc.id);

        if (sourceOrient) {
          for (const ori of sourceOrient) {
            await supabase.from("pi_orientacions").insert({
              pi_document_id: newDocId,
              tipus: ori.tipus,
              mesura: ori.mesura,
              sort_order: ori.sort_order,
            });
          }
        }

        // Copy pi_comp_transversals (reset avaluacio)
        const { data: sourceTransv } = await supabase
          .from("pi_comp_transversals")
          .select("*")
          .eq("pi_document_id", doc.id);

        if (sourceTransv) {
          for (const tr of sourceTransv) {
            await supabase.from("pi_comp_transversals").insert({
              pi_document_id: newDocId,
              nivell: tr.nivell,
              area: tr.area,
              especifica: tr.especifica,
              criteris: tr.criteris,
              sabers: tr.sabers,
              avaluacio: null, // Reset for new year
              sort_order: tr.sort_order,
            });
          }
        }

        // pi_seguiment_* NOT copied (new year = fresh signatures/meetings)
      }
    }
  }

  return NextResponse.json({
    copiedYearly,
    copiedNese,
    copiedPi,
    skippedStudents,
    errors,
    message: `Còpia completada: ${copiedYearly} traspàs, ${copiedNese} NESE, ${copiedPi} PI${skippedStudents > 0 ? `, ${skippedStudents} alumnes no trobats al curs destí` : ""}${errors > 0 ? `, ${errors} errors` : ""}`,
  });
}
