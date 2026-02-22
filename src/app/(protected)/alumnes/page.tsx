"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StudentsFilters } from "@/components/alumnes/students-filters";
import { StudentsTable } from "@/components/alumnes/students-table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Filters {
  search: string;
  etapa: string[];
  className: string[];
  graellaNese: string;
  estat: string;
}

function StudentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive filters from URL
  const filters = useMemo<Filters>(() => {
    return {
      search: searchParams.get("search") || "",
      etapa: searchParams.get("etapa")
        ? searchParams.get("etapa")!.split(",")
        : [],
      className: searchParams.get("className")
        ? searchParams.get("className")!.split(",")
        : [],
      graellaNese: searchParams.get("graellaNese") || "",
      estat: searchParams.get("estat") || "",
    };
  }, [searchParams]);

  const sortBy = searchParams.get("sortBy") || "last_name";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  // State
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Local search input with debounce
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync searchInput when URL search param changes externally (e.g. clear filters)
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.replace(`/alumnes?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Fetch students with AbortController to cancel stale requests
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchStudents = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (filters.search) params.set("search", filters.search);
      if (filters.etapa.length) params.set("etapa", filters.etapa.join(","));
      if (filters.className.length)
        params.set("className", filters.className.join(","));
      if (filters.graellaNese) params.set("graellaNese", filters.graellaNese);
      if (filters.estat) params.set("estat", filters.estat);

      try {
        const res = await fetch(`/api/students?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();

        if (res.ok) {
          setStudents(json.data || []);
          setTotal(json.total || 0);
          setAvailableClasses(json.availableClasses || []);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return; // Ignored — cancelled by newer request
        console.error("Error fetching students:", err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => controller.abort();
  }, [sortBy, sortOrder, filters]);

  // Handlers
  const handleFiltersChange = useCallback(
    (newFilters: Filters) => {
      // Update search input immediately for responsive UI
      setSearchInput(newFilters.search);

      // Debounce only the search text — other filters update instantly
      if (newFilters.search !== filters.search) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          updateParams({
            search: newFilters.search,
            etapa: newFilters.etapa.join(","),
            className: newFilters.className.join(","),
            graellaNese: newFilters.graellaNese,
            estat: newFilters.estat,
          });
        }, 350);
        // If other filters also changed, update those immediately
        if (
          newFilters.etapa.join(",") !== filters.etapa.join(",") ||
          newFilters.className.join(",") !== filters.className.join(",") ||
          newFilters.graellaNese !== filters.graellaNese ||
          newFilters.estat !== filters.estat
        ) {
          updateParams({
            search: filters.search, // keep old search for now
            etapa: newFilters.etapa.join(","),
            className: newFilters.className.join(","),
            graellaNese: newFilters.graellaNese,
            estat: newFilters.estat,
          });
        }
      } else {
        // Non-search filter change — update immediately
        if (debounceRef.current) clearTimeout(debounceRef.current);
        updateParams({
          search: newFilters.search,
          etapa: newFilters.etapa.join(","),
          className: newFilters.className.join(","),
          graellaNese: newFilters.graellaNese,
          estat: newFilters.estat,
        });
      }
    },
    [updateParams, filters]
  );

  const handleSort = useCallback(
    (column: string) => {
      const newOrder =
        sortBy === column && sortOrder === "asc" ? "desc" : "asc";
      updateParams({ sortBy: column, sortOrder: newOrder });
    },
    [sortBy, sortOrder, updateParams]
  );

  const handleExportExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.etapa.length) params.set("etapa", filters.etapa.join(","));
    window.open(`/api/students/export?${params.toString()}`, "_blank");
  }, [filters.etapa]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alumnes</h1>
          <p className="text-muted-foreground">
            Gestió d&apos;alumnat i seguiment educatiu
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <Download className="h-4 w-4 mr-1" />
          Exportar Excel
        </Button>
      </div>

      <StudentsFilters
        filters={{ ...filters, search: searchInput }}
        onFiltersChange={handleFiltersChange}
        availableClasses={availableClasses}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <StudentsTable
          students={students}
          total={total}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <StudentsPageContent />
    </Suspense>
  );
}
