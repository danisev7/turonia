"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CandidatesFilters,
  type Filters,
} from "@/components/curriculums/candidates-filters";
import { CandidatesTable } from "@/components/curriculums/candidates-table";
import { Skeleton } from "@/components/ui/skeleton";

const INITIAL_FILTERS: Filters = {
  search: "",
  stages: [],
  status: "",
  evaluations: [],
  languages: [],
  dateFrom: "",
  dateTo: "",
};

export default function CurriculumsPage() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [candidates, setCandidates] = useState<never[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("reception_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

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

    setLoading(false);
  }, [filters, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Gestió de Currículums</h1>
        <p className="text-muted-foreground mt-1">Llistat de candidats</p>
      </div>

      <CandidatesFilters
        filters={filters}
        availableLanguages={availableLanguages}
        onFiltersChange={setFilters}
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
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
