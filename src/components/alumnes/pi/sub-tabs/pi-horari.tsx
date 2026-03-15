"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { PiDocumentData } from "../student-pi-tab";

const DIES = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];
const FRANGES = [
  "8-9",
  "9-10",
  "10-10:30",
  "10:30-12",
  "12-13",
  "13-14",
  "15-16",
  "16-17",
];

interface PiHorariSubTabProps {
  document: PiDocumentData;
  editing: boolean;
  onUpdateDocument: (partial: Partial<PiDocumentData>) => void;
}

type HorariGrid = Record<string, Record<string, string>>;

export function PiHorariSubTab({
  document,
  editing,
  onUpdateDocument,
}: PiHorariSubTabProps) {
  const horari: HorariGrid = (document.horari as HorariGrid) || {};

  const updateCell = useCallback(
    (franja: string, dia: string, value: string) => {
      const updated = { ...horari };
      if (!updated[franja]) updated[franja] = {};
      updated[franja] = { ...updated[franja], [dia]: value };
      onUpdateDocument({ horari: updated });
    },
    [horari, onUpdateDocument]
  );

  const getCell = (franja: string, dia: string) => {
    return horari[franja]?.[dia] || "";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Horari i suports
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-muted/50 text-left text-xs font-medium w-24">
                Franja
              </th>
              {DIES.map((dia) => (
                <th
                  key={dia}
                  className="border p-2 bg-muted/50 text-center text-xs font-medium"
                >
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRANGES.map((franja) => (
              <tr key={franja}>
                <td className="border p-2 bg-muted/30 text-xs font-medium">
                  {franja}
                </td>
                {DIES.map((dia) => (
                  <td key={dia} className="border p-1">
                    {editing ? (
                      <Input
                        className="h-7 text-xs border-0 shadow-none focus-visible:ring-1"
                        value={getCell(franja, dia)}
                        onChange={(e) => updateCell(franja, dia, e.target.value)}
                      />
                    ) : (
                      <span className="text-xs px-1">
                        {getCell(franja, dia) || ""}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
