"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface YearlyDataWithYear {
  id: string;
  graella_nese: boolean;
  curs_repeticio: string | null;
  dades_familiars: string | null;
  academic: string | null;
  comportament: string | null;
  acords_tutoria: string | null;
  estat: string | null;
  observacions: string | null;
  clickedu_years: { name: string } | null;
}

interface StudentEvolutionTabProps {
  allYearlyData: YearlyDataWithYear[];
}

export function StudentEvolutionTab({
  allYearlyData,
}: StudentEvolutionTabProps) {
  if (allYearlyData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hi ha dades d&apos;evolució disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Evolució per cursos</h2>

      <div className="space-y-4">
        {allYearlyData.map((yd) => (
          <div key={yd.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg">
                Curs {yd.clickedu_years?.name || "Desconegut"}
              </h3>
              {yd.graella_nese && (
                <Badge className="bg-amber-100 text-amber-800 text-xs">
                  NESE
                </Badge>
              )}
              {yd.estat && (
                <Badge
                  className={`text-xs ${
                    yd.estat === "resolt"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {yd.estat === "resolt" ? "Resolt" : "Pendent"}
                </Badge>
              )}
              {yd.curs_repeticio && (
                <Badge variant="outline" className="text-xs">
                  Rep: {yd.curs_repeticio}
                </Badge>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Camp</TableHead>
                    <TableHead>Contingut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yd.dades_familiars && (
                    <TableRow>
                      <TableCell className="font-medium text-sm">
                        Dades familiars
                      </TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap">
                        {yd.dades_familiars}
                      </TableCell>
                    </TableRow>
                  )}
                  {yd.academic && (
                    <TableRow>
                      <TableCell className="font-medium text-sm">
                        Acadèmic
                      </TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap">
                        {yd.academic}
                      </TableCell>
                    </TableRow>
                  )}
                  {yd.comportament && (
                    <TableRow>
                      <TableCell className="font-medium text-sm">
                        Comportament
                      </TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap">
                        {yd.comportament}
                      </TableCell>
                    </TableRow>
                  )}
                  {yd.acords_tutoria && (
                    <TableRow>
                      <TableCell className="font-medium text-sm">
                        Acords tutoria
                      </TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap">
                        {yd.acords_tutoria}
                      </TableCell>
                    </TableRow>
                  )}
                  {yd.observacions && (
                    <TableRow>
                      <TableCell className="font-medium text-sm">
                        Observacions
                      </TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap">
                        {yd.observacions}
                      </TableCell>
                    </TableRow>
                  )}
                  {!yd.dades_familiars &&
                    !yd.academic &&
                    !yd.comportament &&
                    !yd.acords_tutoria &&
                    !yd.observacions && (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground"
                        >
                          Sense dades registrades
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
