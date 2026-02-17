import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Candidate {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  teaching_months: number | null;
  status: string;
  evaluation: string | null;
  observations: string | null;
  reception_date: string;
  last_contact_date: string | null;
  last_response_date: string | null;
  candidate_stages: { stage: string }[];
  candidate_languages: { language: string; level: string | null }[];
}

interface CandidatesTableProps {
  candidates: Candidate[];
  total: number;
  page: number;
  totalPages: number;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
}

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

const EVAL_LABELS: Record<string, string> = {
  molt_interessant: "Molt Interessant",
  interessant: "Interessant",
  poc_interessant: "Poc Interessant",
  descartat: "Descartat",
};

const EVAL_COLORS: Record<string, string> = {
  molt_interessant:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  interessant:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  poc_interessant:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  descartat: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ca-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  column: string;
  currentSort: string;
  currentOrder: string;
  onSort: (column: string) => void;
}) {
  return (
    <TableHead>
      <button
        className="flex items-center gap-1 hover:text-foreground text-xs"
        onClick={() => onSort(column)}
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${currentSort === column ? "text-foreground" : "text-muted-foreground/50"}`}
        />
      </button>
    </TableHead>
  );
}

export function CandidatesTable({
  candidates,
  total,
  page,
  totalPages,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
}: CandidatesTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="Nom i cognoms"
                column="last_name"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                label="Email"
                column="email"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <TableHead className="text-xs">Etapa</TableHead>
              <TableHead className="text-xs">Idiomes</TableHead>
              <SortableHeader
                label="Exp."
                column="teaching_months"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                label="Data recepció"
                column="reception_date"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                label="Últim contacte"
                column="last_contact_date"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                label="Última resposta"
                column="last_response_date"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                label="Avaluació"
                column="evaluation"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                label="Estat"
                column="status"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <TableHead className="text-xs">Observacions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No s&apos;han trobat candidats
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow
                  key={candidate.id}
                  className="cursor-pointer hover:bg-muted/50 relative"
                >
                  <TableCell className="font-medium text-sm">
                    <Link
                      href={`/curriculums/${candidate.id}`}
                      className="after:absolute after:inset-0"
                    >
                      {[candidate.first_name, candidate.last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{candidate.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {candidate.candidate_stages?.map((s) => (
                        <Badge
                          key={s.stage}
                          variant="outline"
                          className={`text-xs ${STAGE_COLORS[s.stage] || ""}`}
                        >
                          {STAGE_LABELS[s.stage] || s.stage}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {candidate.candidate_languages?.map((l) => (
                        <Badge
                          key={l.language}
                          variant="outline"
                          className="text-xs"
                        >
                          {l.language}
                          {l.level ? ` (${l.level})` : ""}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right">
                    {candidate.teaching_months != null
                      ? (candidate.teaching_months / 12).toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(candidate.reception_date)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(candidate.last_contact_date)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(candidate.last_response_date)}
                  </TableCell>
                  <TableCell>
                    {candidate.evaluation && (
                      <Badge
                        className={`text-xs ${EVAL_COLORS[candidate.evaluation] || ""}`}
                      >
                        {EVAL_LABELS[candidate.evaluation] ||
                          candidate.evaluation}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        candidate.status === "pendent"
                          ? "secondary"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {candidate.status === "pendent" ? "Pendent" : "Vist"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {candidate.observations || ""}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} candidat{total !== 1 ? "s" : ""} en total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Pàgina {page} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
