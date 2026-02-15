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
    `,
      { count: "exact" }
    );

  // Filters
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (evaluations) {
    const evalArray = evaluations.split(",");
    query = query.in("evaluation", evalArray);
  }

  if (dateFrom) {
    query = query.gte("reception_date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("reception_date", dateTo);
  }

  // Sort
  query = query.order(sortBy, { ascending: sortOrder });

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Client-side filter for stages and languages (since they're in related tables)
  let filtered = data || [];

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

  return NextResponse.json({
    data: filtered,
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  });
}
