"use client";

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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface StudentYearlyData {
  id: string;
  graella_nese: boolean;
  curs_repeticio: string | null;
  estat: string | null;
  observacions: string | null;
  school_year_id: string;
}

interface Student {
  id: string;
  clickedu_id: number;
  first_name: string;
  last_name: string;
  class_id: number;
  class_name: string;
  is_repetidor: boolean;
  is_active: boolean;
  student_yearly_data: StudentYearlyData[] | StudentYearlyData;
}

interface StudentsTableProps {
  students: Student[];
  total: number;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
}

function getEtapa(className: string): { label: string; color: string } {
  if (className.startsWith("I"))
    return { label: "Infantil", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  if (className.startsWith("P"))
    return { label: "Prim\u00e0ria", color: "bg-blue-100 text-blue-800 border-blue-200" };
  return { label: "Secund\u00e0ria", color: "bg-violet-100 text-violet-800 border-violet-200" };
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
  const isActive = currentSort === column;
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
}

export function StudentsTable({
  students,
  total,
  sortBy,
  sortOrder,
  onSort,
}: StudentsTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="Cognoms, Nom"
                column="last_name"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                label="Classe"
                column="class_name"
                currentSort={sortBy}
                currentOrder={sortOrder}
                onSort={onSort}
              />
              <TableHead>Etapa</TableHead>
              <TableHead>NESE</TableHead>
              <TableHead>Repetició</TableHead>
              <TableHead>Estat</TableHead>
              <TableHead className="max-w-[300px]">Observacions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No s&apos;han trobat alumnes
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => {
                const yearlyData = Array.isArray(student.student_yearly_data)
                  ? student.student_yearly_data[0]
                  : student.student_yearly_data;
                const etapa = getEtapa(student.class_name);

                return (
                  <TableRow
                    key={student.id}
                    className="relative cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/alumnes/${student.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {student.last_name}, {student.first_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {student.class_name}
                      {student.is_repetidor && (
                        <Badge
                          variant="secondary"
                          className="ml-1.5 text-[10px] bg-orange-100 text-orange-700"
                        >
                          Rep.
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${etapa.color}`}
                      >
                        {etapa.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {yearlyData?.graella_nese && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-amber-100 text-amber-800"
                        >
                          NESE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {yearlyData?.curs_repeticio || "—"}
                    </TableCell>
                    <TableCell>
                      {yearlyData?.estat && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            yearlyData.estat === "resolt"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {yearlyData.estat === "resolt"
                            ? "Resolt"
                            : "Pendent"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {yearlyData?.observacions || "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {total} alumne{total !== 1 ? "s" : ""} trobat
        {total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
