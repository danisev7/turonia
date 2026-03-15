"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import type { PiConfig, PiCompTransversalData } from "../student-pi-tab";

const NIVELLS = [
  "I3", "I4", "I5",
  "P1", "P2", "P3", "P4", "P5", "P6",
  "S1", "S2", "S3", "S4",
];

const AVALUACIO_MAP: Record<string, string> = {
  "1": "1-NA",
  "2": "2-AS",
  "3": "3-AN",
  "4": "4-AE",
};

// Color palette per àrea — bg, text, border for badges
const AREA_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Ciutadana": {
    bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500",
  },
  "Digital": {
    bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500",
  },
  "Emprenedora": {
    bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500",
  },
  "Personal, social i aprendre a aprendre": {
    bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500",
  },
};

const DEFAULT_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-500" };

function getAreaColor(area: string) {
  return AREA_COLORS[area] || DEFAULT_COLOR;
}

/** Derive group_name from a nivell (e.g. "P1" → "P1-P2", "S3" → "S3-S4") */
function getGroupName(nivell: string): string | null {
  const prefix = nivell.charAt(0);
  const num = parseInt(nivell.substring(1));
  if (prefix === "P") {
    if (num <= 2) return "P1-P2";
    if (num <= 4) return "P3-P4";
    return "P5-P6";
  }
  if (prefix === "S") {
    if (num <= 2) return "S1-S2";
    return "S3-S4";
  }
  return null;
}

/** Find which area a competència belongs to */
function findAreaForEspec(
  espec: string,
  groupName: string | null,
  transversals: PiConfig["transversals"]
): string | null {
  if (!groupName) return null;
  for (const t of transversals) {
    if (t.group_name === groupName && t.espec_short === espec) return t.area;
  }
  return null;
}

interface PiCompTransversalsSubTabProps {
  config: PiConfig;
  compTransversals: PiCompTransversalData[];
  editing: boolean;
  onUpdate: (rows: PiCompTransversalData[]) => void;
}

export function PiCompTransversalsSubTab({
  config,
  compTransversals,
  editing,
  onUpdate,
}: PiCompTransversalsSubTabProps) {
  const addRow = useCallback(() => {
    onUpdate([
      ...compTransversals,
      {
        nivell: "",
        area: [],
        especifica: null,
        criteris: null,
        sabers: null,
        avaluacio: null,
        sort_order: compTransversals.length,
      },
    ]);
  }, [compTransversals, onUpdate]);

  const removeRow = useCallback(
    (idx: number) => {
      onUpdate(compTransversals.filter((_, i) => i !== idx));
    },
    [compTransversals, onUpdate]
  );

  const updateRow = useCallback(
    (idx: number, partial: Partial<PiCompTransversalData>) => {
      const updated = [...compTransversals];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdate(updated);
    },
    [compTransversals, onUpdate]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Competències transversals
        </h3>
        {editing && (
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-3 w-3 mr-1" />
            Afegir fila
          </Button>
        )}
      </div>

      {compTransversals.length === 0 && !editing && (
        <p className="text-sm text-muted-foreground">
          Cap competència transversal registrada.
        </p>
      )}

      <div className="space-y-3">
        {compTransversals.map((row, idx) => (
          <CompTransversalRow
            key={idx}
            row={row}
            idx={idx}
            config={config}
            editing={editing}
            onUpdate={updateRow}
            onRemove={removeRow}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Individual Row ─────────────────────────────────────────────────────

interface RowProps {
  row: PiCompTransversalData;
  idx: number;
  config: PiConfig;
  editing: boolean;
  onUpdate: (idx: number, partial: Partial<PiCompTransversalData>) => void;
  onRemove: (idx: number) => void;
}

function CompTransversalRow({ row, idx, config, editing, onUpdate, onRemove }: RowProps) {
  const groupName = row.nivell ? getGroupName(row.nivell) : null;
  const selectedAreas = Array.isArray(row.area) ? row.area : [];

  // Available areas for the current group
  const availableAreas = useMemo(() => {
    if (!groupName) return [];
    const areas = new Set<string>();
    for (const t of config.transversals) {
      if (t.group_name === groupName) areas.add(t.area);
    }
    return Array.from(areas).sort();
  }, [config.transversals, groupName]);

  // Available competències for ALL selected areas
  const availableEspec = useMemo(() => {
    if (!groupName || selectedAreas.length === 0) return [];
    const specs = new Map<string, { short: string; full: string; area: string }>();
    for (const t of config.transversals) {
      if (t.group_name === groupName && selectedAreas.includes(t.area)) {
        if (!specs.has(t.espec_short)) {
          specs.set(t.espec_short, { short: t.espec_short, full: t.espec_full, area: t.area });
        }
      }
    }
    return Array.from(specs.values());
  }, [config.transversals, groupName, selectedAreas]);

  const selectedEspec = useMemo(() => {
    if (!row.especifica || !Array.isArray(row.especifica)) return new Set<string>();
    return new Set(row.especifica);
  }, [row.especifica]);

  // Available criteris for ALL selected competències
  const availableCriteris = useMemo(() => {
    if (!groupName || selectedAreas.length === 0 || selectedEspec.size === 0) return [];
    const crits: { short: string; full: string; area: string }[] = [];
    const seen = new Set<string>();
    for (const t of config.transversals) {
      if (
        t.group_name === groupName &&
        selectedAreas.includes(t.area) &&
        selectedEspec.has(t.espec_short) &&
        t.crit_short &&
        !seen.has(t.crit_short)
      ) {
        seen.add(t.crit_short);
        crits.push({ short: t.crit_short, full: t.crit_full || t.crit_short, area: t.area });
      }
    }
    return crits;
  }, [config.transversals, groupName, selectedAreas, selectedEspec]);

  const selectedCriteris = useMemo(() => {
    if (!row.criteris || !Array.isArray(row.criteris)) return new Set<string>();
    return new Set(row.criteris.map((c) => c.short || ""));
  }, [row.criteris]);

  // Toggle helpers
  const toggleArea = useCallback(
    (area: string) => {
      const current = [...selectedAreas];
      const i = current.indexOf(area);
      if (i >= 0) current.splice(i, 1);
      else current.push(area);
      // Clean dependent fields: remove espec/criteris that no longer belong to selected areas
      onUpdate(idx, { area: current, especifica: null, criteris: null, sabers: null });
    },
    [selectedAreas, idx, onUpdate]
  );

  const toggleEspec = useCallback(
    (espec: string) => {
      const current = Array.isArray(row.especifica) ? [...row.especifica] : [];
      const i = current.indexOf(espec);
      if (i >= 0) current.splice(i, 1);
      else current.push(espec);
      // Clean criteris when especifica changes
      onUpdate(idx, { especifica: current.length > 0 ? current : null, criteris: null });
    },
    [row.especifica, idx, onUpdate]
  );

  const toggleCriteri = useCallback(
    (crit: { short: string; full: string }) => {
      const current = Array.isArray(row.criteris) ? [...row.criteris] : [];
      const i = current.findIndex((c) => c.short === crit.short);
      if (i >= 0) current.splice(i, 1);
      else current.push(crit);
      onUpdate(idx, { criteris: current.length > 0 ? current : null });
    },
    [row.criteris, idx, onUpdate]
  );

  // Sabers (only if Digital is selected)
  const hasDigital = selectedAreas.includes("Digital");

  const selectedSabers = useMemo(() => {
    if (!row.sabers || !Array.isArray(row.sabers)) return new Set<string>();
    return new Set(row.sabers.map((s) => s.short || ""));
  }, [row.sabers]);

  const toggleSaber = useCallback(
    (saber: { short: string; full: string }) => {
      const current = Array.isArray(row.sabers) ? [...row.sabers] : [];
      const i = current.findIndex((s) => s.short === saber.short);
      if (i >= 0) current.splice(i, 1);
      else current.push(saber);
      onUpdate(idx, { sabers: current.length > 0 ? current : null });
    },
    [row.sabers, idx, onUpdate]
  );

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Row 1: Nivell + Avaluació + Delete */}
      <div className="flex gap-3 items-start">
        <div className="w-[90px] space-y-1">
          <Label className="text-xs text-muted-foreground">Nivell</Label>
          {editing ? (
            <Select
              value={row.nivell || undefined}
              onValueChange={(v) =>
                onUpdate(idx, { nivell: v, area: [], especifica: null, criteris: null, sabers: null })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {NIVELLS.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm">{row.nivell || "—"}</p>
          )}
        </div>

        <div className="w-[100px] space-y-1">
          <Label className="text-xs text-muted-foreground">Avaluació</Label>
          {editing ? (
            <Select
              value={row.avaluacio || undefined}
              onValueChange={(v) => onUpdate(idx, { avaluacio: v || null })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AVALUACIO_MAP).map(([code, label]) => (
                  <SelectItem key={code} value={code}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm">
              {row.avaluacio ? AVALUACIO_MAP[row.avaluacio] || row.avaluacio : "—"}
            </p>
          )}
        </div>

        <div className="flex-1" />

        {editing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mt-5 text-destructive hover:text-destructive shrink-0"
            onClick={() => onRemove(idx)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Row 2: Àrea (multi-select with colors) */}
      {row.nivell && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Àrees</Label>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {availableAreas.map((area) => {
                const color = getAreaColor(area);
                const selected = selectedAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                      selected
                        ? `${color.bg} ${color.text} ${color.border} ring-1 ring-offset-1 ring-current`
                        : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                    {area}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedAreas.length > 0
                ? selectedAreas.map((a) => {
                    const color = getAreaColor(a);
                    return (
                      <Badge key={a} className={`${color.bg} ${color.text} ${color.border} border text-xs`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${color.dot} mr-1`} />
                        {a}
                      </Badge>
                    );
                  })
                : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          )}
        </div>
      )}

      {/* Row 3: Competència específica (multi-select, colored by area) */}
      {selectedAreas.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Competències específiques</Label>
          {editing ? (
            <MultiSelectTagged
              available={availableEspec}
              selected={selectedEspec}
              onToggle={toggleEspec}
              transversals={config.transversals}
              groupName={groupName}
              placeholder="Selecciona competències..."
              label="competència"
            />
          ) : (
            <div className="flex flex-col gap-1">
              {row.especifica && Array.isArray(row.especifica) && row.especifica.length > 0
                ? row.especifica.map((e, i) => {
                    const area = findAreaForEspec(e, groupName, config.transversals);
                    const color = area ? getAreaColor(area) : DEFAULT_COLOR;
                    return (
                      <Badge key={i} className={`${color.bg} ${color.text} ${color.border} border text-xs w-fit`}>
                        {e}
                      </Badge>
                    );
                  })
                : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          )}
        </div>
      )}

      {/* Row 4: Criteris d'avaluació (multi-select, colored by area) */}
      {selectedEspec.size > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Criteris d&apos;avaluació</Label>
          {editing ? (
            <MultiSelectCriteris
              available={availableCriteris}
              selected={selectedCriteris}
              onToggle={toggleCriteri}
            />
          ) : (
            <div className="flex flex-col gap-1">
              {row.criteris && Array.isArray(row.criteris) && row.criteris.length > 0
                ? row.criteris.map((c, i) => {
                    const area = findAreaForEspec(c.short, groupName, config.transversals);
                    const color = area ? getAreaColor(area) : DEFAULT_COLOR;
                    return (
                      <Badge key={i} className={`${color.bg} ${color.text} ${color.border} border text-xs w-fit`} title={c.full}>
                        {c.short}
                      </Badge>
                    );
                  })
                : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          )}
        </div>
      )}

      {/* Row 5: Sabers digitals (if Digital selected) */}
      {hasDigital && selectedEspec.size > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sabers digitals</Label>
          {editing ? (
            <MultiSelectSabers
              sabersDig={config.sabersDig}
              selected={selectedSabers}
              onToggle={toggleSaber}
            />
          ) : (
            <div className="flex flex-col gap-1">
              {row.sabers && Array.isArray(row.sabers) && row.sabers.length > 0
                ? row.sabers.map((s, i) => {
                    const color = getAreaColor("Digital");
                    return (
                      <Badge key={i} className={`${color.bg} ${color.text} ${color.border} border text-xs w-fit`} title={s.full}>
                        {s.short}
                      </Badge>
                    );
                  })
                : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Multi-select for Competències (with area colors) ───────────────────

function MultiSelectTagged({
  available,
  selected,
  onToggle,
  transversals,
  groupName,
  placeholder,
}: {
  available: { short: string; full: string; area: string }[];
  selected: Set<string>;
  onToggle: (espec: string) => void;
  transversals: PiConfig["transversals"];
  groupName: string | null;
  placeholder: string;
  label: string;
}) {
  if (available.length === 0) {
    return <p className="text-xs text-muted-foreground">Cap competència disponible</p>;
  }

  // Group by area for better visual organization
  const byArea = new Map<string, typeof available>();
  for (const item of available) {
    if (!byArea.has(item.area)) byArea.set(item.area, []);
    byArea.get(item.area)!.push(item);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto min-h-8 text-xs w-full justify-between font-normal items-start">
          <span className="flex flex-col gap-1 text-left">
            {selected.size > 0 ? (
              available
                .filter((c) => selected.has(c.short))
                .map((c) => {
                  const color = getAreaColor(c.area);
                  return (
                    <Badge key={c.short} className={`${color.bg} ${color.text} ${color.border} border text-xs w-fit`}>
                      {c.short}
                    </Badge>
                  );
                })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 ml-1 mt-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-h-[400px] overflow-y-auto p-2" align="start">
        {Array.from(byArea.entries()).map(([area, items]) => {
          const color = getAreaColor(area);
          return (
            <div key={area} className="mb-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 text-xs font-semibold ${color.text}`}>
                <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                {area}
              </div>
              {items.map((c) => (
                <label
                  key={c.short}
                  className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(c.short)}
                    onCheckedChange={() => onToggle(c.short)}
                    className="mt-0.5"
                  />
                  <span className="text-xs leading-relaxed" title={c.full}>
                    {c.short}
                  </span>
                </label>
              ))}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ─── Multi-select for Criteris (with area colors) ──────────────────────

function MultiSelectCriteris({
  available,
  selected,
  onToggle,
}: {
  available: { short: string; full: string; area: string }[];
  selected: Set<string>;
  onToggle: (item: { short: string; full: string }) => void;
}) {
  if (available.length === 0) {
    return <p className="text-xs text-muted-foreground">Cap criteri disponible</p>;
  }

  // Group by area
  const byArea = new Map<string, typeof available>();
  for (const item of available) {
    if (!byArea.has(item.area)) byArea.set(item.area, []);
    byArea.get(item.area)!.push(item);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto min-h-8 text-xs w-full justify-between font-normal items-start">
          <span className="flex flex-col gap-1 text-left">
            {selected.size > 0 ? (
              available
                .filter((c) => selected.has(c.short))
                .map((c) => {
                  const color = getAreaColor(c.area);
                  return (
                    <Badge key={c.short} className={`${color.bg} ${color.text} ${color.border} border text-xs w-fit`} title={c.full}>
                      {c.short}
                    </Badge>
                  );
                })
            ) : (
              <span className="text-muted-foreground">Selecciona criteris...</span>
            )}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 ml-1 mt-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-h-[400px] overflow-y-auto p-2" align="start">
        {Array.from(byArea.entries()).map(([area, items]) => {
          const color = getAreaColor(area);
          return (
            <div key={area} className="mb-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 text-xs font-semibold ${color.text}`}>
                <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                {area}
              </div>
              {items.map((c) => (
                <label
                  key={c.short}
                  className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(c.short)}
                    onCheckedChange={() => onToggle(c)}
                    className="mt-0.5"
                  />
                  <span className="text-xs leading-relaxed" title={c.full}>
                    {c.short}
                  </span>
                </label>
              ))}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ─── Multi-select for Sabers Digitals ───────────────────────────────────

function MultiSelectSabers({
  sabersDig,
  selected,
  onToggle,
}: {
  sabersDig: PiConfig["sabersDig"];
  selected: Set<string>;
  onToggle: (item: { short: string; full: string }) => void;
}) {
  if (sabersDig.length === 0) {
    return <p className="text-xs text-muted-foreground">Cap saber disponible</p>;
  }

  const color = getAreaColor("Digital");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto min-h-8 text-xs w-full justify-between font-normal items-start">
          <span className="flex flex-col gap-1 text-left">
            {selected.size > 0 ? (
              sabersDig
                .filter((s) => selected.has(s.short_text))
                .map((s) => (
                  <Badge key={s.id} className={`${color.bg} ${color.text} ${color.border} border text-xs w-fit`} title={s.full_text}>
                    {s.short_text}
                  </Badge>
                ))
            ) : (
              <span className="text-muted-foreground">Selecciona sabers...</span>
            )}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 ml-1 mt-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] max-h-[300px] overflow-y-auto p-2" align="start">
        <div className="space-y-1">
          {sabersDig.map((s) => (
            <label
              key={s.id}
              className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={selected.has(s.short_text)}
                onCheckedChange={() => onToggle({ short: s.short_text, full: s.full_text })}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed" title={s.full_text}>
                {s.short_text}
              </span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
