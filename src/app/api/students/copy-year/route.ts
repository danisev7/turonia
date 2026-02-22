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
  const { sourceYearId, targetYearId, copyNese } = body;

  if (!sourceYearId || !targetYearId) {
    return NextResponse.json(
      { error: "Falten IDs de curs origen i destí" },
      { status: 400 }
    );
  }

  // Get source yearly data
  const { data: sourceYearly, error: yearlyError } = await supabase
    .from("student_yearly_data")
    .select("*")
    .eq("school_year_id", sourceYearId);

  if (yearlyError) {
    return NextResponse.json({ error: yearlyError.message }, { status: 500 });
  }

  let copiedYearly = 0;
  let copiedNese = 0;
  let errors = 0;

  // Copy yearly data (reset estat and keep structure)
  for (const record of sourceYearly || []) {
    const { error } = await supabase.from("student_yearly_data").upsert(
      {
        student_id: record.student_id,
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
        const { error } = await supabase.from("student_nese_data").upsert(
          {
            student_id: record.student_id,
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

  return NextResponse.json({
    copiedYearly,
    copiedNese,
    errors,
    message: `Còpia completada: ${copiedYearly} traspàs, ${copiedNese} NESE${errors > 0 ? `, ${errors} errors` : ""}`,
  });
}
