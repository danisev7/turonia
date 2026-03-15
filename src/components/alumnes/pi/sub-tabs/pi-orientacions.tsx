"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Wand2 } from "lucide-react";
import type {
  PiConfig,
  PiDocumentData,
  PiOrientacioData,
} from "../student-pi-tab";

const TIPUS_OPTIONS = ["Universal", "Addicional", "Intensiu"];

interface PiOrientacionsSubTabProps {
  config: PiConfig;
  document: PiDocumentData;
  orientacions: PiOrientacioData[];
  editing: boolean;
  onUpdateOrientacions: (orientacions: PiOrientacioData[]) => void;
  onUpdateDocument: (partial: Partial<PiDocumentData>) => void;
}

export function PiOrientacionsSubTab({
  config,
  document,
  orientacions,
  editing,
  onUpdateOrientacions,
  onUpdateDocument,
}: PiOrientacionsSubTabProps) {
  // Filter mesures by tipus
  const getMesuresForTipus = useCallback(
    (tipus: string) => {
      if (!document.model) return [];
      return config.modelMesures
        .filter((m) => m.model === document.model && m.tipus === tipus)
        .map((m) => m.mesura);
    },
    [config.modelMesures, document.model]
  );

  // Get all unique mesures for a tipus (across all models for free selection)
  const getAllMesuresForTipus = useCallback(
    (tipus: string) => {
      const mesures = new Set<string>();
      config.modelMesures
        .filter((m) => m.tipus === tipus)
        .forEach((m) => mesures.add(m.mesura));
      return Array.from(mesures).sort();
    },
    [config.modelMesures]
  );

  const addOrientacio = useCallback(() => {
    onUpdateOrientacions([
      ...orientacions,
      {
        tipus: "Universal",
        mesura: "",
        sort_order: orientacions.length,
      },
    ]);
  }, [orientacions, onUpdateOrientacions]);

  const removeOrientacio = useCallback(
    (idx: number) => {
      onUpdateOrientacions(orientacions.filter((_, i) => i !== idx));
    },
    [orientacions, onUpdateOrientacions]
  );

  const updateOrientacio = useCallback(
    (idx: number, partial: Partial<PiOrientacioData>) => {
      const updated = [...orientacions];
      updated[idx] = { ...updated[idx], ...partial };
      onUpdateOrientacions(updated);
    },
    [orientacions, onUpdateOrientacions]
  );

  // Pre-fill from model
  const prefillFromModel = useCallback(() => {
    if (!document.model) return;

    const modelMesures = config.modelMesures.filter(
      (m) => m.model === document.model
    );

    const newOrientacions: PiOrientacioData[] = modelMesures.map((m, i) => ({
      tipus: m.tipus,
      mesura: m.mesura,
      sort_order: i,
    }));

    onUpdateOrientacions(newOrientacions);
  }, [document.model, config.modelMesures, onUpdateOrientacions]);

  return (
    <div className="space-y-6">
      {/* Pre-fill button */}
      {editing && document.model && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Pre-omplir amb orientacions del model &quot;{document.model}&quot;
          </span>
          <Button variant="outline" size="sm" onClick={prefillFromModel}>
            Pre-omplir
          </Button>
        </div>
      )}

      {/* Orientations list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Orientacions generals
          </h3>
          {editing && (
            <Button variant="outline" size="sm" onClick={addOrientacio}>
              <Plus className="h-3 w-3 mr-1" />
              Afegir orientació
            </Button>
          )}
        </div>

        {orientacions.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground">
            Cap orientació registrada.
          </p>
        )}

        <div className="space-y-2">
          {orientacions.map((ori, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[140px_1fr_auto] gap-3 items-start rounded-lg border p-3"
            >
              {/* Tipus */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipus</Label>
                {editing ? (
                  <Select
                    value={ori.tipus}
                    onValueChange={(v) => updateOrientacio(idx, { tipus: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPUS_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{ori.tipus}</p>
                )}
              </div>

              {/* Mesura/Orientació */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Orientació
                </Label>
                {editing ? (
                  <Select
                    value={ori.mesura}
                    onValueChange={(v) => updateOrientacio(idx, { mesura: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllMesuresForTipus(ori.tipus).map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{ori.mesura || "—"}</p>
                )}
              </div>

              {/* Delete */}
              {editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mt-5 text-destructive hover:text-destructive"
                  onClick={() => removeOrientacio(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Altres orientacions */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Altres orientacions
        </h3>
        {editing ? (
          <Textarea
            value={document.altres_orientacions || ""}
            onChange={(e) =>
              onUpdateDocument({
                altres_orientacions: e.target.value || null,
              })
            }
            placeholder="Orientacions addicionals..."
            rows={3}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">
            {document.altres_orientacions || "—"}
          </p>
        )}
      </section>
    </div>
  );
}
