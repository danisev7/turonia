"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface Filters {
  search: string;
  etapa: string[];
  className: string[];
  graellaNese: string;
  estat: string;
}

interface StudentsFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableClasses: string[];
}

const ETAPES = [
  { value: "infantil", label: "Infantil" },
  { value: "primaria", label: "Prim\u00e0ria" },
  { value: "secundaria", label: "Secund\u00e0ria" },
];

const NESE_OPTIONS = [
  { value: "true", label: "Graella NESE" },
  { value: "false", label: "Sense NESE" },
];

const ESTAT_OPTIONS = [
  { value: "pendent", label: "Pendent" },
  { value: "resolt", label: "Resolt" },
];

const GROUP_COLORS: Record<string, { active: string; dot: string }> = {
  Etapa: { active: "bg-teal-600 text-white hover:bg-teal-700", dot: "bg-teal-500" },
  Classe: { active: "bg-sky-600 text-white hover:bg-sky-700", dot: "bg-sky-500" },
  NESE: { active: "bg-amber-500 text-white hover:bg-amber-600", dot: "bg-amber-500" },
  Estat: { active: "bg-violet-600 text-white hover:bg-violet-700", dot: "bg-violet-500" },
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

export function StudentsFilters({
  filters,
  onFiltersChange,
  availableClasses,
}: StudentsFiltersProps) {
  const hasFilters =
    filters.search ||
    filters.etapa.length > 0 ||
    filters.className.length > 0 ||
    filters.graellaNese ||
    filters.estat;

  const classOptions = availableClasses.map((c) => ({
    value: c,
    label: c,
  }));

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cercar per nom..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-8"
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onFiltersChange({
                search: "",
                etapa: [],
                className: [],
                graellaNese: "",
                estat: "",
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
          options={ETAPES}
          selected={filters.etapa}
          onToggle={(val) => {
            const newEtapa = filters.etapa.includes(val)
              ? filters.etapa.filter((e) => e !== val)
              : [...filters.etapa, val];
            onFiltersChange({ ...filters, etapa: newEtapa });
          }}
        />

        {classOptions.length > 0 && (
          <ToggleGroup
            label="Classe"
            options={classOptions}
            selected={filters.className}
            onToggle={(val) => {
              const newClass = filters.className.includes(val)
                ? filters.className.filter((c) => c !== val)
                : [...filters.className, val];
              onFiltersChange({ ...filters, className: newClass });
            }}
          />
        )}

        <ToggleGroup
          label="NESE"
          options={NESE_OPTIONS}
          selected={filters.graellaNese ? [filters.graellaNese] : []}
          onToggle={(val) => {
            const newVal = filters.graellaNese === val ? "" : val;
            onFiltersChange({ ...filters, graellaNese: newVal });
          }}
        />

        <ToggleGroup
          label="Estat"
          options={ESTAT_OPTIONS}
          selected={filters.estat ? [filters.estat] : []}
          onToggle={(val) => {
            const newVal = filters.estat === val ? "" : val;
            onFiltersChange({ ...filters, estat: newVal });
          }}
        />
      </div>
    </div>
  );
}
