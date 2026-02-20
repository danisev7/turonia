"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  CandidatesFilters,
  type Filters,
} from "@/components/curriculums/candidates-filters";
import { CandidatesTable } from "@/components/curriculums/candidates-table";
import { Skeleton } from "@/components/ui/skeleton";

const PARAM_DEFAULTS: Record<string, string> = {
  page: "1",
  sortBy: "reception_date",
  sortOrder: "desc",
};

function CurriculumsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derive filter/sort/page state from URL search params
  const filters: Filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      stages: searchParams.get("stages")?.split(",").filter(Boolean) || [],
      status: searchParams.get("status") || "",
      evaluations:
        searchParams.get("evaluations")?.split(",").filter(Boolean) || [],
      specialties:
        searchParams.get("specialties")?.split(",").filter(Boolean) || [],
      languages:
        searchParams.get("languages")?.split(",").filter(Boolean) || [],
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
    }),
    [searchParams]
  );

  const page = parseInt(searchParams.get("page") || "1", 10);
  const sortBy = searchParams.get("sortBy") || "reception_date";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // API response state (stays in useState)
  const [candidates, setCandidates] = useState<never[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  // Helper to update URL search params via router.replace
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === PARAM_DEFAULTS[key]) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleFiltersChange = useCallback(
    (newFilters: Filters) => {
      updateParams({
        search: newFilters.search || undefined,
        stages:
          newFilters.stages.length > 0
            ? newFilters.stages.join(",")
            : undefined,
        status: newFilters.status || undefined,
        evaluations:
          newFilters.evaluations.length > 0
            ? newFilters.evaluations.join(",")
            : undefined,
        specialties:
          newFilters.specialties.length > 0
            ? newFilters.specialties.join(",")
            : undefined,
        languages:
          newFilters.languages.length > 0
            ? newFilters.languages.join(",")
            : undefined,
        dateFrom: newFilters.dateFrom || undefined,
        dateTo: newFilters.dateTo || undefined,
        page: undefined, // Reset page on filter change
      });
    },
    [updateParams]
  );

  function handleSort(column: string) {
    if (sortBy === column) {
      updateParams({ sortOrder: sortOrder === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sortBy: column, sortOrder: "desc" });
    }
  }

  function handlePageChange(newPage: number) {
    updateParams({ page: newPage === 1 ? undefined : newPage.toString() });
  }

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("perPage", "100");
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.stages.length > 0)
      params.set("stages", filters.stages.join(","));
    if (filters.evaluations.length > 0)
      params.set("evaluations", filters.evaluations.join(","));
    if (filters.specialties.length > 0)
      params.set("specialties", filters.specialties.join(","));
    if (filters.languages.length > 0)
      params.set("languages", filters.languages.join(","));
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);

    const res = await fetch(`/api/candidates?${params.toString()}`);
    const json = await res.json();

    setCandidates(json.data || []);
    setTotal(json.total || 0);
    setTotalPages(json.totalPages || 1);

    // Extract available languages
    const langs = new Set<string>();
    json.data?.forEach(
      (c: { candidate_languages?: { language: string }[] }) => {
        c.candidate_languages?.forEach((l) => langs.add(l.language));
      }
    );
    setAvailableLanguages(Array.from(langs).sort());

    // Extract available specialties
    const specs = new Set<string>();
    json.data?.forEach((c: { specialty?: string | null }) => {
      if (c.specialty) specs.add(c.specialty);
    });
    setAvailableSpecialties(Array.from(specs).sort());

    setLoading(false);
  }, [filters, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Gestió de Currículums</h1>
        <p className="text-muted-foreground mt-1">Llistat de candidats</p>
      </div>

      <CandidatesFilters
        filters={filters}
        availableLanguages={availableLanguages}
        availableSpecialties={availableSpecialties}
        onFiltersChange={handleFiltersChange}
      />

      {loading ? (
        <Skeleton className="h-[400px]" />
      ) : (
        <CandidatesTable
          candidates={candidates}
          total={total}
          page={page}
          totalPages={totalPages}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default function CurriculumsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px]" />}>
      <CurriculumsContent />
    </Suspense>
  );
}
