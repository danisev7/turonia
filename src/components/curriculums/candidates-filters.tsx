"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";

const STAGES = [
  { value: "infantil", label: "Infantil" },
  { value: "primaria", label: "Primària" },
  { value: "secundaria", label: "Secundària" },
  { value: "altres", label: "Altres" },
];

const STATUSES = [
  { value: "pendent", label: "Pendent" },
  { value: "vist", label: "Vist" },
];

const EVALUATIONS = [
  { value: "molt_interessant", label: "Molt Interessant" },
  { value: "interessant", label: "Interessant" },
  { value: "poc_interessant", label: "Poc Interessant" },
  { value: "descartat", label: "Descartat" },
];

export interface Filters {
  search: string;
  stages: string[];
  status: string;
  evaluations: string[];
  languages: string[];
  dateFrom: string;
  dateTo: string;
}

interface CandidatesFiltersProps {
  filters: Filters;
  availableLanguages: string[];
  onFiltersChange: (filters: Filters) => void;
}

function ToggleGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <Badge
            key={opt.value}
            variant={selected.includes(opt.value) ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => onToggle(opt.value)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function CandidatesFilters({
  filters,
  availableLanguages,
  onFiltersChange,
}: CandidatesFiltersProps) {
  const toggleArrayFilter = (
    key: "stages" | "evaluations" | "languages",
    value: string
  ) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const hasActiveFilters =
    filters.search ||
    filters.stages.length > 0 ||
    filters.status ||
    filters.evaluations.length > 0 ||
    filters.languages.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cercar per nom, email o telèfon..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Des de:</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateFrom: e.target.value })
            }
            className="w-[150px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Fins a:</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateTo: e.target.value })
            }
            className="w-[150px]"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onFiltersChange({
                search: "",
                stages: [],
                status: "",
                evaluations: [],
                languages: [],
                dateFrom: "",
                dateTo: "",
              })
            }
          >
            <X className="mr-1 h-3 w-3" />
            Netejar filtres
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <ToggleGroup
          label="Etapa"
          options={STAGES}
          selected={filters.stages}
          onToggle={(v) => toggleArrayFilter("stages", v)}
        />

        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Estat
          </span>
          <div className="flex flex-wrap gap-1">
            {STATUSES.map((opt) => (
              <Badge
                key={opt.value}
                variant={
                  filters.status === opt.value ? "default" : "outline"
                }
                className="cursor-pointer text-xs"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    status:
                      filters.status === opt.value ? "" : opt.value,
                  })
                }
              >
                {opt.label}
              </Badge>
            ))}
          </div>
        </div>

        <ToggleGroup
          label="Avaluació"
          options={EVALUATIONS}
          selected={filters.evaluations}
          onToggle={(v) => toggleArrayFilter("evaluations", v)}
        />

        {availableLanguages.length > 0 && (
          <ToggleGroup
            label="Idiomes"
            options={availableLanguages.map((l) => ({ value: l, label: l }))}
            selected={filters.languages}
            onToggle={(v) => toggleArrayFilter("languages", v)}
          />
        )}
      </div>
    </div>
  );
}
