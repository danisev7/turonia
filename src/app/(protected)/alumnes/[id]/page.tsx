"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, PanelTop, List, ChevronDown, Pencil, Save, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StudentInfoTab } from "@/components/alumnes/student-info-tab";
import type { EditableTabRef } from "@/components/alumnes/student-info-tab";
import { StudentNeseTab } from "@/components/alumnes/student-nese-tab";
import { StudentEvolutionTab } from "@/components/alumnes/student-evolution-tab";
import type { UserRole } from "@/types";
import { canEdit } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const LS_KEY = "turonia-student-view-mode";

interface StudentDetailData {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    class_name: string;
    class_id: number;
    clickedu_id: number;
  };
  yearlyData: any;
  neseData: any;
  currentYear: { id: string; name: string } | null;
  allYears: { id: string; name: string; is_current: boolean }[];
  allYearlyData: any[];
  userRole: UserRole;
}

type ViewMode = "tabs" | "scroll";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("tabs");

  // Unified editing state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const infoTabRef = useRef<EditableTabRef>(null);
  const neseTabRef = useRef<EditableTabRef>(null);

  // Sections open state for scroll mode
  const [openSections, setOpenSections] = useState({
    info: true,
    nese: true,
    evolution: true,
  });

  // Load view preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored === "tabs" || stored === "scroll") {
      setViewMode(stored);
    }
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === "tabs" ? "scroll" : "tabs";
      localStorage.setItem(LS_KEY, next);
      return next;
    });
  }, []);

  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/students/${id}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Error carregant alumne");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Error de connexió");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveYearly = useCallback(
    async (formData: Record<string, any>) => {
      if (!data?.currentYear) return;
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "student_yearly_data",
          data: formData,
          schoolYearId: data.currentYear.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error desant");
        throw new Error(err.error);
      }
      await fetchData();
    },
    [data?.currentYear, id, fetchData]
  );

  const handleSaveNese = useCallback(
    async (formData: Record<string, any>) => {
      if (!data?.currentYear) return;
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "student_nese_data",
          data: formData,
          schoolYearId: data.currentYear.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error desant");
        throw new Error(err.error);
      }
      await fetchData();
    },
    [data?.currentYear, id, fetchData]
  );

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      await Promise.all([
        infoTabRef.current?.save(),
        neseTabRef.current?.save(),
      ]);
      setEditing(false);
    } catch {
      // Individual handlers already show alert()
    } finally {
      setSaving(false);
    }
  }, []);

  const handleCancelAll = useCallback(() => {
    infoTabRef.current?.cancel();
    neseTabRef.current?.cancel();
    setEditing(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/alumnes">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tornar
          </Link>
        </Button>
        <div className="text-center py-8 text-destructive">{error}</div>
      </div>
    );
  }

  const canEditAny =
    canEdit(data.userRole, "alumnes") ||
    canEdit(data.userRole, "alumnes_nese");

  const sections = [
    {
      key: "info" as const,
      title: "Traspàs tutoria",
      content: (
        <StudentInfoTab
          ref={infoTabRef}
          student={data.student}
          yearlyData={data.yearlyData}
          schoolYearId={data.currentYear?.id || ""}
          userRole={data.userRole}
          editing={editing}
          onSave={handleSaveYearly}
        />
      ),
    },
    {
      key: "nese" as const,
      title: "Dades NESE",
      content: (
        <StudentNeseTab
          ref={neseTabRef}
          neseData={data.neseData}
          userRole={data.userRole}
          editing={editing}
          onSave={handleSaveNese}
        />
      ),
    },
    {
      key: "evolution" as const,
      title: "Evolució",
      content: <StudentEvolutionTab allYearlyData={data.allYearlyData} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/alumnes">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Tornar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {data.student.last_name}, {data.student.first_name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {data.student.class_name} &middot; Curs{" "}
              {data.currentYear?.name || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleViewMode}
                  >
                    {viewMode === "tabs" ? (
                      <List className="h-4 w-4" />
                    ) : (
                      <PanelTop className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {viewMode === "tabs"
                    ? "Canviar a vista seccions"
                    : "Canviar a vista pestanyes"}
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/students/${id}/export-pdf`);
                    if (!res.ok) {
                      alert("Error generant PDF");
                      return;
                    }
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `fitxa-${data.student.last_name}-${data.student.first_name}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch {
                    alert("Error generant PDF");
                  }
                }}
              >
                <FileDown className="h-4 w-4 mr-1" />
                Exportar PDF
              </Button>
              {canEditAny && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelAll} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancel·lar
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Desant..." : "Desar"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {viewMode === "tabs" ? (
        <Tabs defaultValue="info">
          <TabsList>
            {sections.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((s) => (
            <TabsContent key={s.key} value={s.key} className="mt-4">
              {s.content}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => (
            <Collapsible
              key={s.key}
              open={openSections[s.key]}
              onOpenChange={() => toggleSection(s.key)}
            >
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-semibold">{s.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      openSections[s.key] && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {s.content}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Bottom action bar — only in edit mode */}
      {editing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCancelAll} disabled={saving}>
            <X className="h-4 w-4 mr-1" />
            Cancel·lar
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Desant..." : "Desar"}
          </Button>
        </div>
      )}
    </div>
  );
}
