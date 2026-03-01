import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticat" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "100");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const stages = searchParams.get("stages") || "";
  const evaluations = searchParams.get("evaluations") || "";
  const specialties = searchParams.get("specialties") || "";
  const languages = searchParams.get("languages") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const sortBy = searchParams.get("sortBy") || "reception_date";
  const sortOrder = searchParams.get("sortOrder") === "asc";

  // Build query
  let query = supabase
    .from("candidates")
    .select(
      `
      *,
      candidate_stages(stage),
      candidate_languages(language, level)
    `
    );

  // Filters
  if (status) {
    query = query.eq("status", status);
  }

  if (evaluations) {
    const evalArray = evaluations.split(",");
    query = query.in("evaluation", evalArray);
  }

  if (specialties) {
    const specArray = specialties.split(",");
    query = query.in("specialty", specArray);
  }

  if (dateFrom) {
    query = query.gte("reception_date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("reception_date", dateTo);
  }

  // Sort
  query = query.order(sortBy, { ascending: sortOrder });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Post-query filters
  let filtered = data || [];

  if (search) {
    const normalize = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    filtered = filtered.filter((c) => {
      const text = normalize(
        `${c.first_name || ""} ${c.last_name || ""} ${c.email || ""} ${c.phone || ""}`
      );
      return terms.every((term) => text.includes(term));
    });
  }

  if (stages) {
    const stageArray = stages.split(",");
    filtered = filtered.filter((c) =>
      c.candidate_stages?.some((s: { stage: string }) =>
        stageArray.includes(s.stage)
      )
    );
  }

  if (languages) {
    const langArray = languages.split(",");
    filtered = filtered.filter((c) =>
      c.candidate_languages?.some((l: { language: string }) =>
        langArray.includes(l.language)
      )
    );
  }

  // Compute available filter values from filtered data
  const availableStages = [...new Set(
    filtered.flatMap((c) => c.candidate_stages?.map((s: { stage: string }) => s.stage) || [])
  )];
  const availableStatuses = [...new Set(
    filtered.map((c) => c.status).filter(Boolean)
  )] as string[];
  const availableEvaluations = [...new Set(
    filtered.map((c) => c.evaluation).filter(Boolean)
  )] as string[];
  const availableSpecialties = [...new Set(
    filtered.map((c) => c.specialty).filter(Boolean)
  )].sort() as string[];
  const availableLanguages = [...new Set(
    filtered.flatMap((c) => c.candidate_languages?.map((l: { language: string }) => l.language) || [])
  )].sort();

  // Manual pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const from = (page - 1) * perPage;
  const paginated = filtered.slice(from, from + perPage);

  return NextResponse.json({
    data: paginated,
    total,
    page,
    perPage,
    totalPages,
    availableStages,
    availableStatuses,
    availableEvaluations,
    availableSpecialties,
    availableLanguages,
  });
}
