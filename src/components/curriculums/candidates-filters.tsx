"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  infantil: "Infantil",
  primaria: "Primària",
  secundaria: "Secundària",
  altres: "Altres",
};

const STATUS_LABELS: Record<string, string> = {
  pendent: "Pendent",
  vist: "Vist",
};

const EVALUATION_LABELS: Record<string, string> = {
  molt_interessant: "Molt Interessant",
  interessant: "Interessant",
  poc_interessant: "Poc Interessant",
  descartat: "Descartat",
};

export interface Filters {
  search: string;
  stages: string[];
  status: string;
  evaluations: string[];
  specialties: string[];
  languages: string[];
  dateFrom: string;
  dateTo: string;
}

interface CandidatesFiltersProps {
  filters: Filters;
  availableStages: string[];
  availableStatuses: string[];
  availableEvaluations: string[];
  availableSpecialties: string[];
  availableLanguages: string[];
  onFiltersChange: (filters: Filters) => void;
}

const GROUP_COLORS: Record<string, { active: string; dot: string }> = {
  Etapa: { active: "bg-teal-600 text-white hover:bg-teal-700", dot: "bg-teal-500" },
  Estat: { active: "bg-sky-600 text-white hover:bg-sky-700", dot: "bg-sky-500" },
  Avaluació: { active: "bg-amber-500 text-white hover:bg-amber-600", dot: "bg-amber-500" },
  Especialitat: { active: "bg-rose-600 text-white hover:bg-rose-700", dot: "bg-rose-500" },
  Idiomes: { active: "bg-violet-600 text-white hover:bg-violet-700", dot: "bg-violet-500" },
};

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
  const colors = GROUP_COLORS[label] || GROUP_COLORS.Etapa;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
        <span className="text-xs font-semibold text-foreground/70">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <Badge
            key={opt.value}
            variant={selected.includes(opt.value) ? "default" : "outline"}
            className={`cursor-pointer text-xs ${selected.includes(opt.value) ? colors.active : ""}`}
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
  availableStages,
  availableStatuses,
  availableEvaluations,
  availableSpecialties,
  availableLanguages,
  onFiltersChange,
}: CandidatesFiltersProps) {
  const toggleArrayFilter = (
    key: "stages" | "evaluations" | "specialties" | "languages",
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
    filters.specialties.length > 0 ||
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
                specialties: [],
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
        {availableStages.length > 0 && (
          <ToggleGroup
            label="Etapa"
            options={availableStages.map((s) => ({ value: s, label: STAGE_LABELS[s] || s }))}
            selected={filters.stages}
            onToggle={(v) => toggleArrayFilter("stages", v)}
          />
        )}

        {availableStatuses.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span className="text-xs font-semibold text-foreground/70">Estat</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {availableStatuses.map((value) => (
                <Badge
                  key={value}
                  variant={
                    filters.status === value ? "default" : "outline"
                  }
                  className={`cursor-pointer text-xs ${filters.status === value ? "bg-sky-600 text-white hover:bg-sky-700" : ""}`}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      status:
                        filters.status === value ? "" : value,
                    })
                  }
                >
                  {STATUS_LABELS[value] || value}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {availableEvaluations.length > 0 && (
          <ToggleGroup
            label="Avaluació"
            options={availableEvaluations.map((e) => ({ value: e, label: EVALUATION_LABELS[e] || e }))}
            selected={filters.evaluations}
            onToggle={(v) => toggleArrayFilter("evaluations", v)}
          />
        )}

        {availableSpecialties.length > 0 && (
          <ToggleGroup
            label="Especialitat"
            options={availableSpecialties.map((s) => ({ value: s, label: s }))}
            selected={filters.specialties}
            onToggle={(v) => toggleArrayFilter("specialties", v)}
          />
        )}

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
