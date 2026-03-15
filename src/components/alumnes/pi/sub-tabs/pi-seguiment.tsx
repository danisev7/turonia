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
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type {
  PiSignaturaData,
  PiReunioData,
  PiContinuitatData,
} from "../student-pi-tab";

const ROL_OPTIONS = ["Tutor/a", "Família", "Orientació", "Direcció"];
const DECISIO_OPTIONS = ["Continuïtat", "Revisió", "Finalització"];

interface PiSeguimentSubTabProps {
  signatures: PiSignaturaData[];
  reunions: PiReunioData[];
  continuitat: PiContinuitatData[];
  editing: boolean;
  onUpdateSignatures: (rows: PiSignaturaData[]) => void;
  onUpdateReunions: (rows: PiReunioData[]) => void;
  onUpdateContinuitat: (rows: PiContinuitatData[]) => void;
}

export function PiSeguimentSubTab({
  signatures,
  reunions,
  continuitat,
  editing,
  onUpdateSignatures,
  onUpdateReunions,
  onUpdateContinuitat,
}: PiSeguimentSubTabProps) {
  // Signatures helpers
  const addSignatura = useCallback(() => {
    onUpdateSignatures([
      ...signatures,
      { rol: "", nom: null, data_signatura: null, sort_order: signatures.length },
    ]);
  }, [signatures, onUpdateSignatures]);

  const updateSignatura = useCallback(
    (idx: number, partial: Partial<PiSignaturaData>) => {
      const updated = [...signatures];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdateSignatures(updated);
    },
    [signatures, onUpdateSignatures]
  );

  const removeSignatura = useCallback(
    (idx: number) => {
      onUpdateSignatures(signatures.filter((_, i) => i !== idx));
    },
    [signatures, onUpdateSignatures]
  );

  // Reunions helpers
  const addReunio = useCallback(() => {
    onUpdateReunions([
      ...reunions,
      {
        data_reunio: null,
        assistents: null,
        acords: null,
        proper_pas: null,
        sort_order: reunions.length,
      },
    ]);
  }, [reunions, onUpdateReunions]);

  const updateReunio = useCallback(
    (idx: number, partial: Partial<PiReunioData>) => {
      const updated = [...reunions];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdateReunions(updated);
    },
    [reunions, onUpdateReunions]
  );

  const removeReunio = useCallback(
    (idx: number) => {
      onUpdateReunions(reunions.filter((_, i) => i !== idx));
    },
    [reunions, onUpdateReunions]
  );

  // Continuitat helpers
  const addContinuitat = useCallback(() => {
    onUpdateContinuitat([
      ...continuitat,
      {
        data_decisio: null,
        decisio: null,
        motiu: null,
        responsable: null,
        sort_order: continuitat.length,
      },
    ]);
  }, [continuitat, onUpdateContinuitat]);

  const updateContinuitat = useCallback(
    (idx: number, partial: Partial<PiContinuitatData>) => {
      const updated = [...continuitat];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdateContinuitat(updated);
    },
    [continuitat, onUpdateContinuitat]
  );

  const removeContinuitat = useCallback(
    (idx: number) => {
      onUpdateContinuitat(continuitat.filter((_, i) => i !== idx));
    },
    [continuitat, onUpdateContinuitat]
  );

  return (
    <div className="space-y-10">
      {/* CONFORMITAT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Conformitat
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={addSignatura}>
              <Plus className="h-3 w-3 mr-1" />
              Afegir
            </Button>
          )}
        </div>

        {signatures.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground">
            Cap signatura registrada.
          </p>
        )}

        <div className="space-y-2">
          {signatures.map((sig, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[160px_1fr_140px_auto] gap-3 items-start rounded-lg border p-3"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rol</Label>
                {editing ? (
                  <Select
                    value={sig.rol}
                    onValueChange={(v) => updateSignatura(idx, { rol: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROL_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{sig.rol || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nom</Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={sig.nom || ""}
                    onChange={(e) =>
                      updateSignatura(idx, { nom: e.target.value || null })
                    }
                  />
                ) : (
                  <p className="text-sm">{sig.nom || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data</Label>
                {editing ? (
                  <Input
                    type="date"
                    className="h-8 text-sm"
                    value={sig.data_signatura || ""}
                    onChange={(e) =>
                      updateSignatura(idx, {
                        data_signatura: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{sig.data_signatura || "—"}</p>
                )}
              </div>
              {editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mt-5 text-destructive hover:text-destructive"
                  onClick={() => removeSignatura(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* REUNIONS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Reunions de seguiment
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={addReunio}>
              <Plus className="h-3 w-3 mr-1" />
              Afegir
            </Button>
          )}
        </div>

        {reunions.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground">
            Cap reunió registrada.
          </p>
        )}

        <div className="space-y-2">
          {reunions.map((reu, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[140px_1fr_1fr_1fr_auto] gap-3 items-start rounded-lg border p-3"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data</Label>
                {editing ? (
                  <Input
                    type="date"
                    className="h-8 text-sm"
                    value={reu.data_reunio || ""}
                    onChange={(e) =>
                      updateReunio(idx, {
                        data_reunio: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{reu.data_reunio || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Assistents
                </Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={reu.assistents || ""}
                    onChange={(e) =>
                      updateReunio(idx, {
                        assistents: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{reu.assistents || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Acords</Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={reu.acords || ""}
                    onChange={(e) =>
                      updateReunio(idx, { acords: e.target.value || null })
                    }
                  />
                ) : (
                  <p className="text-sm">{reu.acords || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Proper pas
                </Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={reu.proper_pas || ""}
                    onChange={(e) =>
                      updateReunio(idx, {
                        proper_pas: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{reu.proper_pas || "—"}</p>
                )}
              </div>
              {editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mt-5 text-destructive hover:text-destructive"
                  onClick={() => removeReunio(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CONTINUÏTAT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Continuïtat del PI
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={addContinuitat}>
              <Plus className="h-3 w-3 mr-1" />
              Afegir
            </Button>
          )}
        </div>

        {continuitat.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground">
            Cap decisió registrada.
          </p>
        )}

        <div className="space-y-2">
          {continuitat.map((cont, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[140px_160px_1fr_1fr_auto] gap-3 items-start rounded-lg border p-3"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data</Label>
                {editing ? (
                  <Input
                    type="date"
                    className="h-8 text-sm"
                    value={cont.data_decisio || ""}
                    onChange={(e) =>
                      updateContinuitat(idx, {
                        data_decisio: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{cont.data_decisio || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Decisió</Label>
                {editing ? (
                  <Select
                    value={cont.decisio || ""}
                    onValueChange={(v) =>
                      updateContinuitat(idx, { decisio: v || null })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {DECISIO_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{cont.decisio || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Motiu</Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={cont.motiu || ""}
                    onChange={(e) =>
                      updateContinuitat(idx, {
                        motiu: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{cont.motiu || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Responsable
                </Label>
                {editing ? (
                  <Input
                    className="h-8 text-sm"
                    value={cont.responsable || ""}
                    onChange={(e) =>
                      updateContinuitat(idx, {
                        responsable: e.target.value || null,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{cont.responsable || "—"}</p>
                )}
              </div>
              {editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mt-5 text-destructive hover:text-destructive"
                  onClick={() => removeContinuitat(idx)}
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
