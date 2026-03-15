"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type {
  PiConfig,
  PiMateriaData,
  PiMateriaMesuraData,
  PiMateriaCurriculumData,
  PiOrientacioData,
} from "../student-pi-tab";

const TIPUS_OPTIONS = ["Universal", "Addicional", "Intensiu"];
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

// Color palette for competències (cycles)
const CE_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
];

const DEFAULT_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-500" };

// Color palette for mesures by tipus
const TIPUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Universal": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  "Addicional": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  "Intensiu": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
};

function getCEColor(index: number) {
  return CE_COLORS[index % CE_COLORS.length];
}

/** Normalize subject name for robust matching (inspired by sameSubject_ in Codigo.gs) */
function normalizeSubject(s: string): string {
  return s.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}

interface PiMateriaSubTabProps {
  config: PiConfig;
  materia: PiMateriaData;
  mesures: PiMateriaMesuraData[];
  curriculum: PiMateriaCurriculumData[];
  orientacions: PiOrientacioData[];
  editing: boolean;
  onUpdateMesures: (rows: PiMateriaMesuraData[]) => void;
  onUpdateCurriculum: (rows: PiMateriaCurriculumData[]) => void;
}

export function PiMateriaSubTab({
  config,
  materia,
  mesures,
  curriculum,
  orientacions,
  editing,
  onUpdateMesures,
  onUpdateCurriculum,
}: PiMateriaSubTabProps) {
  // Mesures CRUD
  const addMesura = useCallback(() => {
    onUpdateMesures([
      ...mesures,
      { tipus: "Universal", mesures: [], observacions: null, sort_order: mesures.length },
    ]);
  }, [mesures, onUpdateMesures]);

  const removeMesura = useCallback(
    (idx: number) => onUpdateMesures(mesures.filter((_, i) => i !== idx)),
    [mesures, onUpdateMesures]
  );

  const updateMesura = useCallback(
    (idx: number, partial: Partial<PiMateriaMesuraData>) => {
      const updated = [...mesures];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdateMesures(updated);
    },
    [mesures, onUpdateMesures]
  );

  // Curriculum CRUD
  const addCurriculum = useCallback(() => {
    onUpdateCurriculum([
      ...curriculum,
      { nivell: "", competencia: null, criteris: null, sabers: null, instruments: null, avaluacio: null, sort_order: curriculum.length },
    ]);
  }, [curriculum, onUpdateCurriculum]);

  const removeCurriculum = useCallback(
    (idx: number) => onUpdateCurriculum(curriculum.filter((_, i) => i !== idx)),
    [curriculum, onUpdateCurriculum]
  );

  const updateCurriculum = useCallback(
    (idx: number, partial: Partial<PiMateriaCurriculumData>) => {
      const updated = [...curriculum];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdateCurriculum(updated);
    },
    [curriculum, onUpdateCurriculum]
  );

  return (
    <div className="space-y-10">
      <h2 className="text-lg font-semibold">PI — {materia.materia}</h2>

      {/* ─── MESURES I SUPORTS ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Mesures i suports
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={addMesura}>
              <Plus className="h-3 w-3 mr-1" />
              Afegir mesura
            </Button>
          )}
        </div>

        {mesures.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground">Cap mesura registrada.</p>
        )}

        <div className="space-y-2">
          {mesures.map((mes, idx) => (
            <MesuraRow
              key={idx}
              mes={mes}
              idx={idx}
              orientacions={orientacions}
              editing={editing}
              onUpdate={updateMesura}
              onRemove={removeMesura}
            />
          ))}
        </div>
      </section>

      {/* ─── GRAELLA CURRICULAR ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Graella curricular
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={addCurriculum}>
              <Plus className="h-3 w-3 mr-1" />
              Afegir fila
            </Button>
          )}
        </div>

        {curriculum.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground">Cap entrada curricular.</p>
        )}

        <div className="space-y-3">
          {curriculum.map((cur, idx) => (
            <CurriculumRow
              key={idx}
              cur={cur}
              idx={idx}
              subjectName={materia.materia}
              config={config}
              editing={editing}
              onUpdate={updateCurriculum}
              onRemove={removeCurriculum}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Mesura Row ─────────────────────────────────────────────────────────

function MesuraRow({
  mes,
  idx,
  orientacions,
  editing,
  onUpdate,
  onRemove,
}: {
  mes: PiMateriaMesuraData;
  idx: number;
  orientacions: PiOrientacioData[];
  editing: boolean;
  onUpdate: (idx: number, partial: Partial<PiMateriaMesuraData>) => void;
  onRemove: (idx: number) => void;
}) {
  // Available mesures: only those selected in Orientacions (tab 3) for this tipus
  const availableMesures = useMemo(() => {
    return orientacions
      .filter((o) => o.tipus === mes.tipus && o.mesura)
      .map((o) => o.mesura)
      .filter((m, i, arr) => arr.indexOf(m) === i)
      .sort();
  }, [orientacions, mes.tipus]);

  const selectedSet = useMemo(
    () => new Set(mes.mesures || []),
    [mes.mesures]
  );

  const toggleMesura = useCallback(
    (mesura: string) => {
      const current = [...(mes.mesures || [])];
      const i = current.indexOf(mesura);
      if (i >= 0) current.splice(i, 1);
      else current.push(mesura);
      onUpdate(idx, { mesures: current });
    },
    [mes.mesures, idx, onUpdate]
  );

  const tipusColor = TIPUS_COLORS[mes.tipus] || DEFAULT_COLOR;

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex gap-3 items-start">
        {/* Tipus */}
        <div className="w-[130px] space-y-1">
          <Label className="text-xs text-muted-foreground">Tipus</Label>
          {editing ? (
            <Select
              value={mes.tipus}
              onValueChange={(v) => onUpdate(idx, { tipus: v, mesures: [] })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPUS_OPTIONS.map((t) => {
                  const tc = TIPUS_COLORS[t] || DEFAULT_COLOR;
                  return (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${tc.dot}`} />
                        {t}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <Badge className={`${tipusColor.bg} ${tipusColor.text} ${tipusColor.border} border text-xs w-fit`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tipusColor.dot} mr-1`} />
              {mes.tipus}
            </Badge>
          )}
        </div>

        {/* Observacions */}
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Observacions</Label>
          {editing ? (
            <Input
              className="h-8 text-sm"
              value={mes.observacions || ""}
              onChange={(e) => onUpdate(idx, { observacions: e.target.value || null })}
            />
          ) : (
            <p className="text-sm">{mes.observacions || "—"}</p>
          )}
        </div>

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

      {/* Mesures multi-select */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Mesures</Label>
        {editing ? (
          availableMesures.length > 0 ? (
            <SimpleMultiSelectPopover
              label="Selecciona mesures..."
              items={availableMesures.map((m) => ({ key: m, label: m }))}
              selected={selectedSet}
              onToggle={toggleMesura}
            />
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Cap orientació de tipus &quot;{mes.tipus}&quot; seleccionada a la pestanya Orientacions.
            </p>
          )
        ) : (
          <div className="flex flex-col gap-1">
            {mes.mesures && mes.mesures.length > 0
              ? mes.mesures.map((m, i) => (
                  <Badge key={i} className={`${tipusColor.bg} ${tipusColor.text} ${tipusColor.border} border text-xs w-fit`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${tipusColor.dot} mr-1`} />
                    {m}
                  </Badge>
                ))
              : <span className="text-sm text-muted-foreground">—</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Curriculum Row ─────────────────────────────────────────────────────

function CurriculumRow({
  cur,
  idx,
  subjectName,
  config,
  editing,
  onUpdate,
  onRemove,
}: {
  cur: PiMateriaCurriculumData;
  idx: number;
  subjectName: string;
  config: PiConfig;
  editing: boolean;
  onUpdate: (idx: number, partial: Partial<PiMateriaCurriculumData>) => void;
  onRemove: (idx: number) => void;
}) {
  const selectedCodes = useMemo(() => {
    if (!cur.competencia || !Array.isArray(cur.competencia)) return [];
    return cur.competencia;
  }, [cur.competencia]);

  const selectedCodesSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  const normalizedSubject = useMemo(() => normalizeSubject(subjectName), [subjectName]);

  // Available competències for this subject + nivell
  const availableComp = useMemo(() => {
    if (!cur.nivell) return [];
    return config.curriculum
      .filter(
        (c) =>
          normalizeSubject(c.subject) === normalizedSubject &&
          c.level === cur.nivell &&
          c.entry_type === "COMP_ESPEC"
      )
      .map((c) => ({ code: c.code, short: c.short_text || c.full_text, full: c.full_text }));
  }, [config.curriculum, normalizedSubject, cur.nivell]);

  // Color map: code → color (based on index in availableComp)
  const colorMap = useMemo(() => {
    const map = new Map<string, typeof CE_COLORS[0]>();
    availableComp.forEach((c, i) => map.set(c.code, getCEColor(i)));
    return map;
  }, [availableComp]);

  // Available criteris for ALL selected competències, grouped by parent
  const availableCriteris = useMemo(() => {
    if (!cur.nivell || selectedCodes.length === 0) return [];
    return config.curriculum
      .filter(
        (c) =>
          normalizeSubject(c.subject) === normalizedSubject &&
          c.level === cur.nivell &&
          c.entry_type === "CRIT" &&
          c.parent_code !== null &&
          selectedCodesSet.has(c.parent_code)
      )
      .map((c) => ({
        short: c.short_text || c.full_text,
        full: c.full_text,
        parentCode: c.parent_code!,
      }));
  }, [config.curriculum, normalizedSubject, cur.nivell, selectedCodes, selectedCodesSet]);

  // Available sabers for this subject + nivell (independent of competència)
  const availableSabers = useMemo(() => {
    if (!cur.nivell) return [];
    return config.curriculum
      .filter(
        (c) =>
          normalizeSubject(c.subject) === normalizedSubject &&
          c.level === cur.nivell &&
          c.entry_type === "SABER"
      )
      .map((c) => ({ short: c.short_text || c.full_text, full: c.full_text }));
  }, [config.curriculum, normalizedSubject, cur.nivell]);

  // Map criteri short → parent CE code (for coloring in view mode)
  const critToParent = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of availableCriteris) {
      map.set(c.short, c.parentCode);
    }
    return map;
  }, [availableCriteris]);

  // Selected sets
  const selectedCriteris = useMemo(() => {
    if (!cur.criteris || !Array.isArray(cur.criteris)) return new Set<string>();
    return new Set(cur.criteris.map((c) => c.short || ""));
  }, [cur.criteris]);

  const selectedSabers = useMemo(() => {
    if (!cur.sabers || !Array.isArray(cur.sabers)) return new Set<string>();
    return new Set(cur.sabers.map((s) => s.short || ""));
  }, [cur.sabers]);

  const selectedInstruments = useMemo(() => {
    if (!cur.instruments || !Array.isArray(cur.instruments)) return new Set<string>();
    return new Set(cur.instruments);
  }, [cur.instruments]);

  // Toggle handlers
  const toggleComp = useCallback(
    (code: string) => {
      const current = [...selectedCodes];
      const i = current.indexOf(code);
      if (i >= 0) current.splice(i, 1);
      else current.push(code);
      // Reset dependent fields
      onUpdate(idx, { competencia: current.length > 0 ? current : null, criteris: null });
    },
    [selectedCodes, idx, onUpdate]
  );

  const toggleCriteri = useCallback(
    (item: { short: string; full: string }) => {
      const current = Array.isArray(cur.criteris) ? [...cur.criteris] : [];
      const i = current.findIndex((c) => c.short === item.short);
      if (i >= 0) current.splice(i, 1);
      else current.push(item);
      onUpdate(idx, { criteris: current.length > 0 ? current : null });
    },
    [cur.criteris, idx, onUpdate]
  );

  const toggleSaber = useCallback(
    (item: { short: string; full: string }) => {
      const current = Array.isArray(cur.sabers) ? [...cur.sabers] : [];
      const i = current.findIndex((s) => s.short === item.short);
      if (i >= 0) current.splice(i, 1);
      else current.push(item);
      onUpdate(idx, { sabers: current.length > 0 ? current : null });
    },
    [cur.sabers, idx, onUpdate]
  );

  const toggleInstrument = useCallback(
    (name: string) => {
      const current = Array.isArray(cur.instruments) ? [...cur.instruments] : [];
      const i = current.indexOf(name);
      if (i >= 0) current.splice(i, 1);
      else current.push(name);
      onUpdate(idx, { instruments: current.length > 0 ? current : null });
    },
    [cur.instruments, idx, onUpdate]
  );

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Row 1: Nivell + Avaluació + Delete */}
      <div className="flex gap-3 items-start">
        <div className="w-[90px] space-y-1">
          <Label className="text-xs text-muted-foreground">Nivell</Label>
          {editing ? (
            <Select
              value={cur.nivell || undefined}
              onValueChange={(v) =>
                onUpdate(idx, { nivell: v, competencia: null, criteris: null, sabers: null })
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
            <p className="text-sm">{cur.nivell || "—"}</p>
          )}
        </div>

        <div className="w-[100px] space-y-1">
          <Label className="text-xs text-muted-foreground">Avaluació</Label>
          {editing ? (
            <Select
              value={cur.avaluacio || undefined}
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
            <p className="text-sm">{cur.avaluacio ? AVALUACIO_MAP[cur.avaluacio] || cur.avaluacio : "—"}</p>
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

      {/* Row 2: Competències específiques (multi-select with colors) */}
      {cur.nivell && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Competències específiques</Label>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {availableComp.map((comp) => {
                const color = colorMap.get(comp.code) || DEFAULT_COLOR;
                const selected = selectedCodesSet.has(comp.code);
                return (
                  <button
                    key={comp.code}
                    type="button"
                    onClick={() => toggleComp(comp.code)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                      selected
                        ? `${color.bg} ${color.text} ${color.border} ring-1 ring-offset-1 ring-current`
                        : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                    title={comp.full}
                  >
                    <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                    {comp.code}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {selectedCodes.length > 0
                ? selectedCodes.map((code) => {
                    const comp = availableComp.find((c) => c.code === code);
                    const color = colorMap.get(code) || DEFAULT_COLOR;
                    return (
                      <Badge key={code} className={`${color.bg} ${color.text} ${color.border} border text-xs w-fit`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${color.dot} mr-1`} />
                        {code} — {comp?.short || code}
                      </Badge>
                    );
                  })
                : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          )}

          {/* Show full descriptions of selected CEs */}
          {selectedCodes.length > 0 && (
            <div className="space-y-1 mt-1">
              {selectedCodes.map((code) => {
                const comp = availableComp.find((c) => c.code === code);
                const color = colorMap.get(code) || DEFAULT_COLOR;
                if (!comp) return null;
                return (
                  <p key={code} className={`text-xs ${color.text} leading-relaxed pl-1`}>
                    <span className="font-semibold">{code}:</span> {comp.full}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Row 3: Criteris (multi-select, grouped by parent CE, with colors) */}
      {selectedCodes.length > 0 && availableCriteris.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Criteris d&apos;avaluació prioritzats</Label>
          {editing ? (
            <GroupedMultiSelect
              available={availableCriteris}
              selected={selectedCriteris}
              onToggle={toggleCriteri}
              colorMap={colorMap}
              availableComp={availableComp}
              placeholder="Selecciona criteris..."
            />
          ) : (
            <div className="flex flex-col gap-1">
              {cur.criteris && Array.isArray(cur.criteris) && cur.criteris.length > 0
                ? cur.criteris.map((c, i) => {
                    const parentCode = critToParent.get(c.short);
                    const color = parentCode ? (colorMap.get(parentCode) || DEFAULT_COLOR) : DEFAULT_COLOR;
                    return (
                      <Badge key={i} className={`${color.bg} ${color.text} ${color.border} border text-xs w-fit`} title={c.full}>
                        <span className={`h-1.5 w-1.5 rounded-full ${color.dot} mr-1`} />
                        {c.short}
                      </Badge>
                    );
                  })
                : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          )}
        </div>
      )}

      {/* Row 4: Sabers (multi-select) */}
      {cur.nivell && availableSabers.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sabers prioritzats</Label>
          {editing ? (
            <ShortFullMultiSelect
              items={availableSabers}
              selected={selectedSabers}
              onToggle={toggleSaber}
              placeholder="Selecciona sabers..."
            />
          ) : (
            <div className="flex flex-col gap-1">
              {cur.sabers && Array.isArray(cur.sabers) && cur.sabers.length > 0
                ? cur.sabers.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs w-fit" title={s.full}>
                      {s.short}
                    </Badge>
                  ))
                : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          )}
        </div>
      )}

      {/* Row 5: Instruments (multi-select) */}
      {cur.nivell && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Instruments d&apos;avaluació</Label>
          {editing ? (
            <SimpleMultiSelectPopover
              label="Selecciona instruments..."
              items={config.instruments.map((i) => ({ key: i.name, label: i.name }))}
              selected={selectedInstruments}
              onToggle={toggleInstrument}
            />
          ) : (
            <div className="flex flex-col gap-1">
              {cur.instruments && Array.isArray(cur.instruments) && cur.instruments.length > 0
                ? cur.instruments.map((name, i) => (
                    <Badge key={i} variant="secondary" className="text-xs w-fit">{name}</Badge>
                  ))
                : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grouped Multi-select for Criteris (grouped by parent CE, with colors) ──

function GroupedMultiSelect({
  available,
  selected,
  onToggle,
  colorMap,
  availableComp,
  placeholder,
}: {
  available: { short: string; full: string; parentCode: string }[];
  selected: Set<string>;
  onToggle: (item: { short: string; full: string }) => void;
  colorMap: Map<string, typeof CE_COLORS[0]>;
  availableComp: { code: string; short: string; full: string }[];
  placeholder: string;
}) {
  // Group by parent CE
  const byParent = useMemo(() => {
    const map = new Map<string, typeof available>();
    for (const item of available) {
      if (!map.has(item.parentCode)) map.set(item.parentCode, []);
      map.get(item.parentCode)!.push(item);
    }
    return map;
  }, [available]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto min-h-8 text-xs w-full justify-between font-normal items-start">
          <span className="flex flex-col gap-1 text-left">
            {selected.size > 0 ? (
              available
                .filter((c) => selected.has(c.short))
                .map((c) => {
                  const color = colorMap.get(c.parentCode) || DEFAULT_COLOR;
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
        {Array.from(byParent.entries()).map(([parentCode, items]) => {
          const color = colorMap.get(parentCode) || DEFAULT_COLOR;
          const comp = availableComp.find((c) => c.code === parentCode);
          return (
            <div key={parentCode} className="mb-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 text-xs font-semibold ${color.text}`}>
                <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                {parentCode}{comp ? ` — ${comp.short}` : ""}
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
                  <div className="text-xs leading-relaxed">
                    <span className="font-medium">{c.short}</span>
                    {c.full !== c.short && (
                      <p className="text-muted-foreground mt-0.5">{c.full}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ─── Multi-select for {short, full} items (sabers) ──────────────────────

function ShortFullMultiSelect({
  items,
  selected,
  onToggle,
  placeholder,
}: {
  items: { short: string; full: string }[];
  selected: Set<string>;
  onToggle: (item: { short: string; full: string }) => void;
  placeholder: string;
}) {
  if (items.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto min-h-8 text-xs w-full justify-between font-normal items-start">
          <span className="flex flex-col gap-1 text-left">
            {selected.size > 0 ? (
              items
                .filter((i) => selected.has(i.short))
                .map((i) => (
                  <Badge key={i.short} variant="secondary" className="text-xs w-fit">
                    {i.short}
                  </Badge>
                ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-h-[400px] overflow-y-auto p-2" align="start">
        <div className="space-y-1">
          {items.map((item) => (
            <label
              key={item.short}
              className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={selected.has(item.short)}
                onCheckedChange={() => onToggle(item)}
                className="mt-0.5"
              />
              <div className="text-xs leading-relaxed">
                <span className="font-medium">{item.short}</span>
                {item.full !== item.short && (
                  <p className="text-muted-foreground mt-0.5">{item.full}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Simple Multi-select Popover (string items, for mesures/instruments) ──

function SimpleMultiSelectPopover({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { key: string; label: string }[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto min-h-8 text-xs w-full justify-between font-normal items-start">
          <span className="flex flex-col gap-1 text-left">
            {selected.size > 0 ? (
              items
                .filter((i) => selected.has(i.key))
                .map((i) => (
                  <Badge key={i.key} variant="secondary" className="text-xs w-fit">
                    {i.label}
                  </Badge>
                ))
            ) : (
              <span className="text-muted-foreground">{label}</span>
            )}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 ml-1 mt-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] max-h-[300px] overflow-y-auto p-2" align="start">
        <div className="space-y-1">
          {items.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={selected.has(item.key)}
                onCheckedChange={() => onToggle(item.key)}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed">{item.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
