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
import { cn } from "@/lib/utils";

export interface EditableTabRef {
  save: () => Promise<void>;
  cancel: () => void;
}

interface StudentInfoTabProps {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    class_name: string;
    class_id: number;
    clickedu_id: number;
  };
  yearlyData: {
    id?: string;
    graella_nese: boolean;
    curs_repeticio: string | null;
    dades_familiars: string | null;
    academic: string | null;
    comportament: string | null;
    acords_tutoria: string | null;
    estat: string | null;
    observacions: string | null;
  } | null;
  schoolYearId: string;
  userRole: UserRole;
  editing: boolean;
  onSave: (data: Record<string, any>) => Promise<void>;
}

function getEtapa(className: string): { label: string; color: string } {
  if (className.startsWith("I"))
    return { label: "Infantil", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  if (className.startsWith("P"))
    return { label: "Prim\u00e0ria", color: "bg-blue-100 text-blue-800 border-blue-200" };
  return { label: "Secund\u00e0ria", color: "bg-violet-100 text-violet-800 border-violet-200" };
}

export const StudentInfoTab = forwardRef<EditableTabRef, StudentInfoTabProps>(
  function StudentInfoTab(
    { student, yearlyData, schoolYearId, userRole, editing, onSave },
    ref
  ) {
    const [form, setForm] = useState({
      graella_nese: yearlyData?.graella_nese ?? false,
      curs_repeticio: yearlyData?.curs_repeticio ?? "",
      dades_familiars: yearlyData?.dades_familiars ?? "",
      academic: yearlyData?.academic ?? "",
      comportament: yearlyData?.comportament ?? "",
      acords_tutoria: yearlyData?.acords_tutoria ?? "",
      estat: yearlyData?.estat ?? "",
      observacions: yearlyData?.observacions ?? "",
    });

    useImperativeHandle(ref, () => ({
      save: async () => {
        await onSave(form);
      },
      cancel: () => {
        setForm({
          graella_nese: yearlyData?.graella_nese ?? false,
          curs_repeticio: yearlyData?.curs_repeticio ?? "",
          dades_familiars: yearlyData?.dades_familiars ?? "",
          academic: yearlyData?.academic ?? "",
          comportament: yearlyData?.comportament ?? "",
          acords_tutoria: yearlyData?.acords_tutoria ?? "",
          estat: yearlyData?.estat ?? "",
          observacions: yearlyData?.observacions ?? "",
        });
      },
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {student.last_name}, {student.first_name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{student.class_name}</Badge>
            <Badge variant="secondary" className={`text-xs ${getEtapa(student.class_name).color}`}>{getEtapa(student.class_name).label}</Badge>
            {yearlyData?.graella_nese && (
              <Badge className="bg-amber-100 text-amber-800">NESE</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Section: Dades bàsiques */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium">Dades bàsiques</h3>

        {/* Short fields row */}
        <div className="flex flex-wrap items-start gap-6">
          {/* Estat */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Estat
            </label>
            {editing ? (
              <Select
                value={form.estat || ""}
                onValueChange={(v) => setForm({ ...form, estat: v || "" })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendent">Pendent</SelectItem>
                  <SelectItem value="resolt">Resolt</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center min-h-7">
                {form.estat ? (
                  <Badge
                    className={
                      form.estat === "resolt"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }
                  >
                    {form.estat === "resolt" ? "Resolt" : "Pendent"}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            )}
          </div>

          {/* Graella NESE */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Graella NESE
            </label>
            <BooleanPicker
              value={form.graella_nese}
              editing={editing}
              onChange={(v) => setForm({ ...form, graella_nese: v })}
            />
          </div>

          {/* Curs repetició — multi-select badges */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Curs repetició
            </label>
            <CursRepeticioPicker
              value={form.curs_repeticio}
              editing={editing}
              onChange={(v) => setForm({ ...form, curs_repeticio: v })}
            />
          </div>
        </div>

        {/* Long text fields */}
        <div className="grid gap-4">
          <Field
            label="Dades familiars rellevants"
            value={form.dades_familiars}
            editing={editing}
            type="textarea"
            onChange={(v) => setForm({ ...form, dades_familiars: v })}
          />
          <Field
            label="Acadèmic"
            value={form.academic}
            editing={editing}
            type="textarea"
            onChange={(v) => setForm({ ...form, academic: v })}
          />
          <Field
            label="Comportament / Convivència"
            value={form.comportament}
            editing={editing}
            type="textarea"
            onChange={(v) => setForm({ ...form, comportament: v })}
          />
          <Field
            label="Acords des de Tutoria"
            value={form.acords_tutoria}
            editing={editing}
            type="textarea"
            onChange={(v) => setForm({ ...form, acords_tutoria: v })}
          />
          <Field
            label="Observacions"
            value={form.observacions}
            editing={editing}
            type="textarea"
            onChange={(v) => setForm({ ...form, observacions: v })}
          />
        </div>
      </div>
    </div>
  );
  }
);

function Field({
  label,
  value,
  editing,
  type,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  type: "input" | "textarea";
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      {editing ? (
        type === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        ) : (
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        )
      ) : (
        <p className="text-sm whitespace-pre-wrap">
          {value || <span className="text-muted-foreground">—</span>}
        </p>
      )}
    </div>
  );
}

function BooleanPicker({
  value,
  editing,
  onChange,
}: {
  value: boolean;
  editing: boolean;
  onChange: (v: boolean) => void;
}) {
  if (!editing) {
    return (
      <div className="flex items-center min-h-7">
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
    );
  }

  return (
    <div className="flex items-center gap-1 min-h-7">
      {(["Sí", "No"] as const).map((label) => {
        const isSelected = label === "Sí" ? value : !value;
        const selectedColor = label === "Sí"
          ? "bg-green-600 text-white border-green-600"
          : "bg-red-100 text-red-700 border-red-200";
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label === "Sí")}
            className={cn(
              "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium border transition-colors",
              isSelected
                ? selectedColor
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const ALL_CURSOS = [
  "I3", "I4", "I5",
  "P1", "P2", "P3", "P4", "P5", "P6",
  "E1", "E2", "E3", "E4",
] as const;

function CursRepeticioPicker({
  value,
  editing,
  onChange,
}: {
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  const selected = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggle = (curs: string) => {
    const next = selected.includes(curs)
      ? selected.filter((s) => s !== curs)
      : [...selected, curs];
    onChange(next.join(","));
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-1 min-h-9">
        {selected.length > 0 ? (
          selected.map((curs) => (
            <Badge key={curs} variant="secondary" className="text-xs">
              {curs}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1 min-h-9">
      {ALL_CURSOS.map((curs) => {
        const isSelected = selected.includes(curs);
        return (
          <button
            key={curs}
            type="button"
            onClick={() => toggle(curs)}
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
            )}
          >
            {curs}
          </button>
        );
      })}
    </div>
  );
}
