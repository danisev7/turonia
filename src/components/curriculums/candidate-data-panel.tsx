"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Save } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  infantil: "Infantil",
  primaria: "Primària",
  secundaria: "Secundària",
  altres: "Altres",
};

const STAGE_COLORS: Record<string, string> = {
  infantil: "bg-emerald-100 text-emerald-800 border-emerald-200",
  primaria: "bg-blue-100 text-blue-800 border-blue-200",
  secundaria: "bg-violet-100 text-violet-800 border-violet-200",
  altres: "bg-stone-100 text-stone-700 border-stone-200",
};

interface CandidateDataPanelProps {
  candidate: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    date_of_birth: string | null;
    date_of_birth_approximate: boolean;
    education_level: string | null;
    work_experience_summary: string | null;
    teaching_months: number | null;
    specialty: string | null;
    status: string;
    evaluation: string | null;
    observations: string | null;
    candidate_stages: { stage: string }[];
    candidate_languages: { language: string; level: string | null }[];
  };
  onSave: (updates: {
    status: string;
    evaluation: string | null;
    observations: string | null;
  }) => Promise<void>;
}

export function CandidateDataPanel({
  candidate,
  onSave,
}: CandidateDataPanelProps) {
  const [status, setStatus] = useState(candidate.status);
  const [evaluation, setEvaluation] = useState(candidate.evaluation || "");
  const [observations, setObservations] = useState(
    candidate.observations || ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({
      status,
      evaluation: evaluation || null,
      observations: observations || null,
    });
    setSaving(false);
  }

  const fullName = [candidate.first_name, candidate.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-4 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold">Dades del candidat</h2>

      <div className="grid gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Nom i cognoms</Label>
          <p className="text-sm font-medium">{fullName || "—"}</p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Email</Label>
          <p className="text-sm">{candidate.email}</p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Telèfon</Label>
          <p className="text-sm">{candidate.phone || "—"}</p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">
            Data de naixement
          </Label>
          <p className="text-sm">
            {candidate.date_of_birth
              ? new Date(candidate.date_of_birth).toLocaleDateString("ca-ES")
              : "—"}
            {candidate.date_of_birth_approximate && (
              <span className="ml-1 inline-flex items-center text-yellow-600">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                <span className="text-xs">Aproximada</span>
              </span>
            )}
          </p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">
            Nivell d&apos;estudis
          </Label>
          <p className="text-sm">{candidate.education_level || "—"}</p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">
            Experiència laboral
          </Label>
          <p className="text-sm whitespace-pre-wrap">
            {candidate.work_experience_summary || "—"}
          </p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">
            Mesos d&apos;experiència docent
          </Label>
          <p className="text-sm">
            {candidate.teaching_months != null
              ? candidate.teaching_months
              : "—"}
          </p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Etapes</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {candidate.candidate_stages?.length > 0
              ? candidate.candidate_stages.map((s) => (
                  <Badge key={s.stage} variant="outline" className={`text-xs ${STAGE_COLORS[s.stage] || ""}`}>
                    {STAGE_LABELS[s.stage] || s.stage}
                  </Badge>
                ))
              : "—"}
          </div>
        </div>

        {candidate.specialty && (
          <div>
            <Label className="text-xs text-muted-foreground">Especialitat</Label>
            <p className="text-sm">{candidate.specialty}</p>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground">Idiomes</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {candidate.candidate_languages?.length > 0
              ? candidate.candidate_languages.map((l) => (
                  <Badge
                    key={l.language}
                    variant="outline"
                    className="text-xs"
                  >
                    {l.language}
                    {l.level ? ` (${l.level})` : ""}
                  </Badge>
                ))
              : "—"}
          </div>
        </div>

        <hr className="my-2" />

        <div>
          <Label className="text-xs">Estat</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendent">Pendent</SelectItem>
              <SelectItem value="vist">Vist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Avaluació</Label>
          <Select value={evaluation} onValueChange={setEvaluation}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="molt_interessant">
                Molt Interessant
              </SelectItem>
              <SelectItem value="interessant">Interessant</SelectItem>
              <SelectItem value="poc_interessant">Poc Interessant</SelectItem>
              <SelectItem value="descartat">Descartat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Observacions</Label>
          <Textarea
            className="mt-1"
            rows={4}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Afegeix observacions..."
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Desant..." : "Desar canvis"}
        </Button>
      </div>
    </div>
  );
}
