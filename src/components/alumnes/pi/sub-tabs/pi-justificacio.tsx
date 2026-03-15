"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PiConfig, PiDocumentData } from "../student-pi-tab";

interface PiJustificacioSubTabProps {
  config: PiConfig;
  document: PiDocumentData;
  editing: boolean;
  onUpdateDocument: (partial: Partial<PiDocumentData>) => void;
}

const MOTIUS = [
  { key: "just_nee" as const, label: "NEE" },
  { key: "just_dea" as const, label: "DEA (dislèxia, discalcúlia...)" },
  {
    key: "just_tea" as const,
    label: "Trastorns neurodesenvolupament (TDAH, TEA, TEL/TDL...)",
  },
  { key: "just_nouvingut" as const, label: "Alumnat nouvingut" },
  { key: "just_altes_cap" as const, label: "Altes capacitats" },
  { key: "just_social" as const, label: "Situació personal/social" },
  { key: "just_altres" as const, label: "Altres" },
];

export function PiJustificacioSubTab({
  config,
  document,
  editing,
  onUpdateDocument,
}: PiJustificacioSubTabProps) {
  return (
    <div className="space-y-8">
      {/* Motius */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Motius del PI
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOTIUS.map(({ key, label }) => (
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

      {/* Model PI */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Model PI
        </h3>
        {editing ? (
          <Select
            value={document.model || ""}
            onValueChange={(v) => onUpdateDocument({ model: v || null })}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecciona model..." />
            </SelectTrigger>
            <SelectContent>
              {config.models.map((m) => (
                <SelectItem key={m.id} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm">{document.model || "—"}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Seleccionar un model pre-omple les orientacions (pestanya 3).
        </p>
      </section>

      {/* Justificació lliure */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Justificació
        </h3>
        {editing ? (
          <Textarea
            value={document.just_text || ""}
            onChange={(e) =>
              onUpdateDocument({ just_text: e.target.value || null })
            }
            placeholder="Justificació del PI..."
            rows={4}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">
            {document.just_text || "—"}
          </p>
        )}
      </section>
    </div>
  );
}
