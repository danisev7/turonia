"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type {
  PiConfig,
  PiDocumentData,
  PiMateriaData,
  PiProfessionalData,
} from "../student-pi-tab";

const NIVELLS = [
  "I3", "I4", "I5",
  "P1", "P2", "P3", "P4", "P5", "P6",
  "S1", "S2", "S3", "S4",
];

interface PiDadesSubTabProps {
  config: PiConfig;
  materies: PiMateriaData[];
  professionals: PiProfessionalData[];
  document: PiDocumentData;
  schoolYearId: string;
  editing: boolean;
  onUpdateDocument: (partial: Partial<PiDocumentData>) => void;
  onUpdateMateries: (materies: PiMateriaData[]) => void;
  onUpdateProfessionals: (professionals: PiProfessionalData[]) => void;
}

export function PiDadesSubTab({
  config,
  materies,
  professionals,
  document,
  schoolYearId,
  editing,
  onUpdateDocument,
  onUpdateMateries,
  onUpdateProfessionals,
}: PiDadesSubTabProps) {
  const docents = config.docents.filter(
    (d) => d.school_year_id === schoolYearId
  );

  const addMateria = useCallback(() => {
    onUpdateMateries([
      ...materies,
      {
        materia: "",
        docent: null,
        nivell: null,
        observacions: null,
        sort_order: materies.length,
      },
    ]);
  }, [materies, onUpdateMateries]);

  const removeMateria = useCallback(
    (idx: number) => {
      onUpdateMateries(materies.filter((_, i) => i !== idx));
    },
    [materies, onUpdateMateries]
  );

  const updateMateria = useCallback(
    (idx: number, partial: Partial<PiMateriaData>) => {
      const updated = [...materies];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdateMateries(updated);
    },
    [materies, onUpdateMateries]
  );

  const addProfessional = useCallback(() => {
    onUpdateProfessionals([
      ...professionals,
      {
        professional: "",
        nom: null,
        contacte: null,
        notes: null,
        sort_order: professionals.length,
      },
    ]);
  }, [professionals, onUpdateProfessionals]);

  const removeProfessional = useCallback(
    (idx: number) => {
      onUpdateProfessionals(professionals.filter((_, i) => i !== idx));
    },
    [professionals, onUpdateProfessionals]
  );

  const updateProfessional = useCallback(
    (idx: number, partial: Partial<PiProfessionalData>) => {
      const updated = [...professionals];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdateProfessionals(updated);
    },
    [professionals, onUpdateProfessionals]
  );

  return (
    <div className="space-y-8">
      {/* Mesures prèvies */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Mesures prèvies rebudes
        </h3>
        <div className="flex flex-wrap gap-6">
          {[
            { key: "prev_universal" as const, label: "Universal" },
            { key: "prev_addicional" as const, label: "Addicional" },
            { key: "prev_intensiu" as const, label: "Intensiu" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={document[key]}
                disabled={!editing}
                onCheckedChange={(checked) =>
                  onUpdateDocument({ [key]: !!checked })
                }
              />
              <Label htmlFor={key} className="text-sm">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </section>

      {/* Matèries amb PI */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Matèries amb PI
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={addMateria}>
              <Plus className="h-3 w-3 mr-1" />
              Afegir matèria
            </Button>
          )}
        </div>

        {materies.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground">Cap matèria amb PI.</p>
        )}

        <div className="space-y-3">
          {materies.map((mat, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1fr_auto_1fr_auto] gap-3 items-start rounded-lg border p-3"
            >
              {/* Matèria */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Matèria</Label>
                {editing ? (
                  <Select
                    value={mat.materia}
                    onValueChange={(v) => updateMateria(idx, { materia: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {config.materies.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{mat.materia || "—"}</p>
                )}
              </div>

              {/* Docent */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Docent</Label>
                {editing ? (
                  <Select
                    value={mat.docent || undefined}
                    onValueChange={(v) => updateMateria(idx, { docent: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {docents.map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{mat.docent || "—"}</p>
                )}
              </div>

              {/* Nivell */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nivell</Label>
                {editing ? (
                  <Select
                    value={mat.nivell || undefined}
                    onValueChange={(v) => updateMateria(idx, { nivell: v })}
                  >
                    <SelectTrigger className="h-8 text-sm w-24">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIVELLS.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{mat.nivell || "—"}</p>
                )}
              </div>

              {/* Observacions */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Observacions
                </Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={mat.observacions || ""}
                    onChange={(e) =>
                      updateMateria(idx, {
                        observacions: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{mat.observacions || "—"}</p>
                )}
              </div>

              {/* Delete */}
              {editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mt-5 text-destructive hover:text-destructive"
                  onClick={() => removeMateria(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Professionals que intervenen */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Professionals que intervenen
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={addProfessional}>
              <Plus className="h-3 w-3 mr-1" />
              Afegir professional
            </Button>
          )}
        </div>

        {professionals.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground">
            Cap professional registrat.
          </p>
        )}

        <div className="space-y-3">
          {professionals.map((prof, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-start rounded-lg border p-3"
            >
              {/* Professional */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Professional
                </Label>
                {editing ? (
                  <Select
                    value={prof.professional}
                    onValueChange={(v) =>
                      updateProfessional(idx, { professional: v })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {config.professionals.map((p) => (
                        <SelectItem key={p.id} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{prof.professional || "—"}</p>
                )}
              </div>

              {/* Nom */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nom</Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={prof.nom || ""}
                    onChange={(e) =>
                      updateProfessional(idx, { nom: e.target.value || null })
                    }
                  />
                ) : (
                  <p className="text-sm">{prof.nom || "—"}</p>
                )}
              </div>

              {/* Contacte */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Contacte
                </Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={prof.contacte || ""}
                    onChange={(e) =>
                      updateProfessional(idx, {
                        contacte: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{prof.contacte || "—"}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={prof.notes || ""}
                    onChange={(e) =>
                      updateProfessional(idx, {
                        notes: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{prof.notes || "—"}</p>
                )}
              </div>

              {/* Delete */}
              {editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mt-5 text-destructive hover:text-destructive"
                  onClick={() => removeProfessional(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
