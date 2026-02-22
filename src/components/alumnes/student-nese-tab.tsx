"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/types";
import { canEditField } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { EditableTabRef } from "./student-info-tab";

interface NeseData {
  id?: string;
  data_incorporacio: string | null;
  escolaritzacio_previa: string | null;
  reunio_poe: boolean;
  reunio_mesi: boolean | null;
  reunio_eap: boolean;
  informe_eap: string | null;
  cad: string | null;
  cad_percentatge: string | null;
  cad_data_venciment: string | null;
  informe_diagnostic: string | null;
  curs_retencio: string | null;
  nise: string | null;
  ssd: boolean;
  mesura_nese: string | null;
  materies_pi: string | null;
  eixos_pi: string | null;
  nac_pi: string | null;
  nac_final: string | null;
  serveis_externs: string | null;
  beca_mec: string | null;
  observacions_curs: string | null;
  dades_rellevants_historic: string | null;
}

interface StudentNeseTabProps {
  neseData: NeseData | null;
  userRole: UserRole;
  editing: boolean;
  onSave: (data: Record<string, any>) => Promise<void>;
}

const EMPTY_NESE: NeseData = {
  data_incorporacio: null,
  escolaritzacio_previa: null,
  reunio_poe: false,
  reunio_mesi: false,
  reunio_eap: false,
  informe_eap: null,
  cad: null,
  cad_percentatge: null,
  cad_data_venciment: null,
  informe_diagnostic: null,
  curs_retencio: null,
  nise: null,
  ssd: false,
  mesura_nese: null,
  materies_pi: null,
  eixos_pi: null,
  nac_pi: null,
  nac_final: null,
  serveis_externs: null,
  beca_mec: null,
  observacions_curs: null,
  dades_rellevants_historic: null,
};

const CURS_RETENCIO_OPTIONS = [
  "I3", "I4", "I5",
  "P1", "P2", "P3", "P4", "P5", "P6",
  "E1", "E2", "E3", "E4",
] as const;

export const StudentNeseTab = forwardRef<EditableTabRef, StudentNeseTabProps>(
  function StudentNeseTab({ neseData, userRole, editing, onSave }, ref) {
    const data = neseData || EMPTY_NESE;
    const [form, setForm] = useState<NeseData>({ ...data });

    useImperativeHandle(ref, () => ({
      save: async () => {
        // Only send fields the user can edit
        const editableFields: Record<string, any> = {};
        for (const [key, value] of Object.entries(form)) {
          if (key === "id") continue;
          if (canEditField(userRole, key)) {
            editableFields[key] = value;
          }
        }
        await onSave(editableFields);
      },
      cancel: () => {
        setForm({ ...data });
      },
    }));

    const isFieldEditable = (field: string) =>
      editing && canEditField(userRole, field);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dades NESE</h2>
      </div>

      {!neseData && !editing && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hi ha dades NESE per aquest curs.</p>
        </div>
      )}

      {(neseData || editing) && (
        <div className="grid gap-6">
          {/* Secretaria section */}
          <Section title="Dades administratives" badge="Secretaria" color="bg-rose-100 text-rose-800">
            {/* Short fields: Data incorporació + SSD on same line */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              <FieldInput
                label="Data incorporació"
                value={form.data_incorporacio || ""}
                editing={isFieldEditable("data_incorporacio")}
                type="date"
                onChange={(v) => setForm({ ...form, data_incorporacio: v || null })}
              />
              <BooleanPicker
                label="SSD"
                value={form.ssd}
                editing={isFieldEditable("ssd")}
                onChange={(v) => setForm({ ...form, ssd: v })}
              />
            </div>
            <FieldText
              label="Escolarització prèvia"
              value={form.escolaritzacio_previa || ""}
              editing={isFieldEditable("escolaritzacio_previa")}
              onChange={(v) => setForm({ ...form, escolaritzacio_previa: v || null })}
            />
          </Section>

          {/* POE / MESI section */}
          <Section title="Seguiment POE / MESI" badge="POE / MESI" color="bg-blue-100 text-blue-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <BooleanPicker
                label="Reunió POE"
                value={form.reunio_poe}
                editing={isFieldEditable("reunio_poe")}
                onChange={(v) => setForm({ ...form, reunio_poe: v })}
              />
              <BooleanPicker
                label="Reunió MESI"
                value={form.reunio_mesi ?? false}
                editing={isFieldEditable("reunio_mesi")}
                onChange={(v) => setForm({ ...form, reunio_mesi: v })}
              />
              <BooleanPicker
                label="Reunió EAP"
                value={form.reunio_eap}
                editing={isFieldEditable("reunio_eap")}
                onChange={(v) => setForm({ ...form, reunio_eap: v })}
              />
              {/* 4th column empty for grid alignment with selects below */}
              <div />
            </div>
            {/* Four selects on the same responsive line */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <FieldSelect
                label="Informe EAP"
                value={form.informe_eap || ""}
                editing={isFieldEditable("informe_eap")}
                onChange={(v) => setForm({ ...form, informe_eap: v || null })}
                options={[
                  { value: "sense_informe", label: "Sense informe" },
                  { value: "nese_annex1", label: "NESE (Annex 1)" },
                  { value: "nee_annex1i2", label: "NEE (Annex 1 i 2)" },
                ]}
              />
              <FieldSelect
                label="NISE"
                value={form.nise || ""}
                editing={isFieldEditable("nise")}
                onChange={(v) => setForm({ ...form, nise: v || null })}
                options={[
                  { value: "nise", label: "NISE" },
                  { value: "sls", label: "SLS" },
                  { value: "no", label: "No" },
                ]}
              />
              <FieldSelect
                label="Mesura NESE"
                value={form.mesura_nese || ""}
                editing={isFieldEditable("mesura_nese")}
                onChange={(v) => setForm({ ...form, mesura_nese: v || null })}
                options={[
                  { value: "pi", label: "PI" },
                  { value: "pi_curricular", label: "PI curricular" },
                  { value: "pi_no_curricular", label: "PI no curricular" },
                  { value: "pi_nouvingut", label: "PI nouvingut" },
                  { value: "dua_misu", label: "DUA / MISU" },
                  { value: "no_mesures", label: "Sense mesures" },
                ]}
              />
              <FieldSelect
                label="Beca MEC"
                value={form.beca_mec || ""}
                editing={isFieldEditable("beca_mec")}
                onChange={(v) => setForm({ ...form, beca_mec: v || null })}
                options={[
                  { value: "sollicitada_curs_actual", label: "Sol·licitada curs actual" },
                  { value: "candidat_proper_curs", label: "Candidat proper curs" },
                  { value: "no_candidat_mec", label: "No candidat MEC" },
                ]}
              />
            </div>
          </Section>

          {/* Tutor section */}
          <Section title="Seguiment tutoria" badge="Tutor/a" color="bg-green-100 text-green-800">
            {/* Short fields row: CAD %, CAD data venciment, Curs retenció */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <FieldInput
                label="CAD %"
                value={form.cad_percentatge || ""}
                editing={isFieldEditable("cad_percentatge")}
                onChange={(v) => setForm({ ...form, cad_percentatge: v || null })}
              />
              <FieldInput
                label="CAD data venciment"
                value={form.cad_data_venciment || ""}
                editing={isFieldEditable("cad_data_venciment")}
                type="date"
                onChange={(v) => setForm({ ...form, cad_data_venciment: v || null })}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Curs retenció
                </label>
                <MultiSelectPicker
                  value={form.curs_retencio || ""}
                  editing={isFieldEditable("curs_retencio")}
                  options={CURS_RETENCIO_OPTIONS}
                  onChange={(v) => setForm({ ...form, curs_retencio: v || null })}
                />
              </div>
            </div>
            {/* Long text fields */}
            <FieldText
              label="Informe diagnòstic"
              value={form.informe_diagnostic || ""}
              editing={isFieldEditable("informe_diagnostic")}
              onChange={(v) => setForm({ ...form, informe_diagnostic: v || null })}
            />
            <FieldText
              label="Matèries PI"
              value={form.materies_pi || ""}
              editing={isFieldEditable("materies_pi")}
              onChange={(v) => setForm({ ...form, materies_pi: v || null })}
            />
            <FieldText
              label="Eixos PI"
              value={form.eixos_pi || ""}
              editing={isFieldEditable("eixos_pi")}
              onChange={(v) => setForm({ ...form, eixos_pi: v || null })}
            />
            <FieldText
              label="NAC PI"
              value={form.nac_pi || ""}
              editing={isFieldEditable("nac_pi")}
              onChange={(v) => setForm({ ...form, nac_pi: v || null })}
            />
            <FieldText
              label="NAC Final"
              value={form.nac_final || ""}
              editing={isFieldEditable("nac_final")}
              onChange={(v) => setForm({ ...form, nac_final: v || null })}
            />
            <FieldText
              label="Serveis externs actuals"
              value={form.serveis_externs || ""}
              editing={isFieldEditable("serveis_externs")}
              onChange={(v) => setForm({ ...form, serveis_externs: v || null })}
            />
            <FieldText
              label="Observacions curs actual"
              value={form.observacions_curs || ""}
              editing={isFieldEditable("observacions_curs")}
              onChange={(v) => setForm({ ...form, observacions_curs: v || null })}
            />
            <FieldText
              label="Dades rellevants (Històric)"
              value={form.dades_rellevants_historic || ""}
              editing={isFieldEditable("dades_rellevants_historic")}
              onChange={(v) => setForm({ ...form, dades_rellevants_historic: v || null })}
            />
          </Section>
        </div>
      )}
    </div>
  );
  }
);

/* ---------- Sub-components ---------- */

function Section({
  title,
  badge,
  color,
  children,
}: {
  title: string;
  badge: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium">{title}</h3>
        <Badge variant="secondary" className={`text-xs ${color}`}>
          {badge}
        </Badge>
      </div>
      {children}
    </div>
  );
}

function FieldText({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {editing ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} />
      ) : (
        <p className="text-sm whitespace-pre-wrap">
          {value || <span className="text-muted-foreground">&mdash;</span>}
        </p>
      )}
    </div>
  );
}

function FieldInput({
  label,
  value,
  editing,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {editing ? (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <p className="text-sm">
          {value || <span className="text-muted-foreground">&mdash;</span>}
        </p>
      )}
    </div>
  );
}


function FieldSelect({
  label,
  value,
  editing,
  onChange,
  options,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const displayLabel = options.find((o) => o.value === value)?.label;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {editing ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm">
          {displayLabel || <span className="text-muted-foreground">&mdash;</span>}
        </p>
      )}
    </div>
  );
}

function BooleanPicker({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: boolean;
  editing: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {editing ? (
        <div className="flex items-center gap-1 min-h-9">
          {(["Sí", "No"] as const).map((opt) => {
            const isSelected = opt === "Sí" ? value : !value;
            const selectedColor = opt === "Sí"
              ? "bg-green-600 text-white border-green-600"
              : "bg-red-100 text-red-700 border-red-200";
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt === "Sí")}
                className={cn(
                  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border transition-colors",
                  isSelected
                    ? selectedColor
                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center min-h-9">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              value ? "bg-green-100 text-green-800" : "bg-red-50 text-red-600"
            )}
          >
            {value ? "Sí" : "No"}
          </Badge>
        </div>
      )}
    </div>
  );
}

function MultiSelectPicker({
  value,
  editing,
  options,
  onChange,
}: {
  value: string;
  editing: boolean;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const selected = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggle = (item: string) => {
    const next = selected.includes(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item];
    onChange(next.join(","));
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-1 min-h-9">
        {selected.length > 0 ? (
          selected.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">&mdash;</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1 min-h-9">
      {options.map((item) => {
        const isSelected = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
