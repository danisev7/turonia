"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { UserRole } from "@/types";
import type { EditableTabRef } from "@/components/alumnes/student-info-tab";
import { canEdit } from "@/lib/permissions";
import { PiDadesSubTab } from "./sub-tabs/pi-dades";
import { PiJustificacioSubTab } from "./sub-tabs/pi-justificacio";
import { PiOrientacionsSubTab } from "./sub-tabs/pi-orientacions";
import { PiCompTransversalsSubTab } from "./sub-tabs/pi-comp-transversals";
import { PiHorariSubTab } from "./sub-tabs/pi-horari";
import { PiSeguimentSubTab } from "./sub-tabs/pi-seguiment";
import { PiMateriaSubTab } from "./sub-tabs/pi-materia";

// Types for PI config data
export interface PiConfig {
  materies: { id: string; name: string; sort_order: number }[];
  professionals: { id: string; name: string; sort_order: number }[];
  models: { id: string; name: string; sort_order: number }[];
  docents: { id: string; name: string; school_year_id: string }[];
  instruments: { id: string; name: string; sort_order: number }[];
  nivells: { id: string; code: string; label: string; sort_order: number }[];
  modelMesures: {
    id: string;
    model: string;
    tipus: string;
    mesura: string;
    sort_order: number;
  }[];
  curriculum: {
    id: string;
    stage: string;
    subject: string;
    level: string;
    entry_type: string;
    code: string;
    full_text: string;
    short_text: string | null;
    parent_code: string | null;
    sort_order: number;
  }[];
  transversals: {
    id: string;
    stage: string;
    area: string;
    group_name: string;
    espec_short: string;
    espec_full: string;
    crit_short: string | null;
    crit_full: string | null;
    sort_order: number;
  }[];
  sabersDig: {
    id: string;
    stage: string;
    group_name: string | null;
    full_text: string;
    short_text: string;
    sort_order: number;
  }[];
}

// Types for PI document data
export interface PiDocumentData {
  id?: string;
  model: string | null;
  prev_universal: boolean;
  prev_addicional: boolean;
  prev_intensiu: boolean;
  just_nee: boolean;
  just_dea: boolean;
  just_tea: boolean;
  just_nouvingut: boolean;
  just_altes_cap: boolean;
  just_social: boolean;
  just_altres: boolean;
  just_text: string | null;
  altres_orientacions: string | null;
  horari: any;
}

export interface PiMateriaData {
  id?: string;
  materia: string;
  docent: string | null;
  nivell: string | null;
  observacions: string | null;
  sort_order: number;
}

export interface PiProfessionalData {
  id?: string;
  professional: string;
  nom: string | null;
  contacte: string | null;
  notes: string | null;
  sort_order: number;
}

export interface PiOrientacioData {
  id?: string;
  tipus: string;
  mesura: string;
  sort_order: number;
}

export interface PiCompTransversalData {
  id?: string;
  nivell: string;
  area: string[]; // multi-select areas
  especifica: string[] | null; // multi-select competències (short texts)
  criteris: { short: string; full: string }[] | null;
  sabers: { short: string; full: string }[] | null;
  avaluacio: string | null;
  sort_order: number;
}

export interface PiSignaturaData {
  id?: string;
  rol: string;
  nom: string | null;
  data_signatura: string | null;
  sort_order: number;
}

export interface PiReunioData {
  id?: string;
  data_reunio: string | null;
  assistents: string | null;
  acords: string | null;
  proper_pas: string | null;
  sort_order: number;
}

export interface PiContinuitatData {
  id?: string;
  data_decisio: string | null;
  decisio: string | null;
  motiu: string | null;
  responsable: string | null;
  sort_order: number;
}

export interface PiMateriaMesuraData {
  id?: string;
  tipus: string;
  mesures: string[];
  observacions: string | null;
  sort_order: number;
}

export interface PiMateriaCurriculumData {
  id?: string;
  nivell: string;
  competencia: string[] | null; // CE codes (multi-select)
  criteris: { short: string; full: string }[] | null;
  sabers: { short: string; full: string }[] | null;
  instruments: string[] | null;
  avaluacio: string | null;
  sort_order: number;
}

// The full PI state managed by this tab
export interface PiState {
  document: PiDocumentData;
  materies: PiMateriaData[];
  professionals: PiProfessionalData[];
  orientacions: PiOrientacioData[];
  compTransversals: PiCompTransversalData[];
  signatures: PiSignaturaData[];
  reunions: PiReunioData[];
  continuitat: PiContinuitatData[];
  materiaMesures: Record<string, PiMateriaMesuraData[]>;
  materiaCurriculum: Record<string, PiMateriaCurriculumData[]>;
}

const EMPTY_DOCUMENT: PiDocumentData = {
  model: null,
  prev_universal: false,
  prev_addicional: false,
  prev_intensiu: false,
  just_nee: false,
  just_dea: false,
  just_tea: false,
  just_nouvingut: false,
  just_altes_cap: false,
  just_social: false,
  just_altres: false,
  just_text: null,
  altres_orientacions: null,
  horari: null,
};

const EMPTY_STATE: PiState = {
  document: EMPTY_DOCUMENT,
  materies: [],
  professionals: [],
  orientacions: [],
  compTransversals: [],
  signatures: [],
  reunions: [],
  continuitat: [],
  materiaMesures: {},
  materiaCurriculum: {},
};

/** Re-key a record from materia ID → materia name */
function rekeyByMateriaName(
  materies: { id: string; materia: string }[],
  byId: Record<string, any[]>
): Record<string, any[]> {
  const result: Record<string, any[]> = {};
  for (const mat of materies) {
    if (byId[mat.id]) {
      result[mat.materia] = byId[mat.id];
    }
  }
  return result;
}

interface StudentPiTabProps {
  studentId: string;
  schoolYearId: string;
  userRole: UserRole;
  editing: boolean;
  onSave: (piState: PiState) => Promise<void>;
}

export const StudentPiTab = forwardRef<EditableTabRef, StudentPiTabProps>(
  function StudentPiTab(
    { studentId, schoolYearId, userRole, editing, onSave },
    ref
  ) {
    const [config, setConfig] = useState<PiConfig | null>(null);
    const [state, setState] = useState<PiState>(EMPTY_STATE);
    const [initialState, setInitialState] = useState<PiState>(EMPTY_STATE);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState("dades");

    const canWrite = canEdit(userRole, "alumnes_pi");

    // Load config + data
    useEffect(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        try {
          const [configRes, dataRes] = await Promise.all([
            fetch("/api/pi/config"),
            fetch(`/api/students/${studentId}/pi?yearId=${schoolYearId}`),
          ]);

          if (!cancelled) {
            const configJson = await configRes.json();
            const dataJson = await dataRes.json();

            setConfig(configJson);

            const newState: PiState = {
              document: dataJson.piDocument
                ? {
                    id: dataJson.piDocument.id,
                    model: dataJson.piDocument.model,
                    prev_universal: dataJson.piDocument.prev_universal,
                    prev_addicional: dataJson.piDocument.prev_addicional,
                    prev_intensiu: dataJson.piDocument.prev_intensiu,
                    just_nee: dataJson.piDocument.just_nee,
                    just_dea: dataJson.piDocument.just_dea,
                    just_tea: dataJson.piDocument.just_tea,
                    just_nouvingut: dataJson.piDocument.just_nouvingut,
                    just_altes_cap: dataJson.piDocument.just_altes_cap,
                    just_social: dataJson.piDocument.just_social,
                    just_altres: dataJson.piDocument.just_altres,
                    just_text: dataJson.piDocument.just_text,
                    altres_orientacions: dataJson.piDocument.altres_orientacions,
                    horari: dataJson.piDocument.horari,
                  }
                : EMPTY_DOCUMENT,
              materies: dataJson.materies || [],
              professionals: dataJson.professionals || [],
              orientacions: dataJson.orientacions || [],
              compTransversals: dataJson.compTransversals || [],
              signatures: dataJson.signatures || [],
              reunions: dataJson.reunions || [],
              continuitat: dataJson.continuitat || [],
              // Re-key materiaMesures/Curriculum from materia ID → materia NAME
              // API returns them keyed by materia UUID, but we use materia name as key
              materiaMesures: rekeyByMateriaName(
                dataJson.materies || [],
                dataJson.materiaMesures || {}
              ),
              materiaCurriculum: rekeyByMateriaName(
                dataJson.materies || [],
                dataJson.materiaCurriculum || {}
              ),
            };

            setState(newState);
            setInitialState(structuredClone(newState));
          }
        } catch (err) {
          console.error("Error loading PI data:", err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [studentId, schoolYearId]);

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (!canWrite) return;
        await onSave(state);
      },
      cancel: () => {
        setState(structuredClone(initialState));
      },
    }));

    // State updaters passed to sub-tabs
    const updateDocument = useCallback(
      (partial: Partial<PiDocumentData>) => {
        setState((prev) => ({
          ...prev,
          document: { ...prev.document, ...partial },
        }));
      },
      []
    );

    const updateMateries = useCallback((materies: PiMateriaData[]) => {
      setState((prev) => ({ ...prev, materies }));
    }, []);

    const updateProfessionals = useCallback(
      (professionals: PiProfessionalData[]) => {
        setState((prev) => ({ ...prev, professionals }));
      },
      []
    );

    const updateOrientacions = useCallback(
      (orientacions: PiOrientacioData[]) => {
        setState((prev) => ({ ...prev, orientacions }));
      },
      []
    );

    const updateCompTransversals = useCallback(
      (compTransversals: PiCompTransversalData[]) => {
        setState((prev) => ({ ...prev, compTransversals }));
      },
      []
    );

    const updateSignatures = useCallback((signatures: PiSignaturaData[]) => {
      setState((prev) => ({ ...prev, signatures }));
    }, []);

    const updateReunions = useCallback((reunions: PiReunioData[]) => {
      setState((prev) => ({ ...prev, reunions }));
    }, []);

    const updateContinuitat = useCallback(
      (continuitat: PiContinuitatData[]) => {
        setState((prev) => ({ ...prev, continuitat }));
      },
      []
    );

    const updateMateriaMesures = useCallback(
      (materiaName: string, mesures: PiMateriaMesuraData[]) => {
        setState((prev) => ({
          ...prev,
          materiaMesures: { ...prev.materiaMesures, [materiaName]: mesures },
        }));
      },
      []
    );

    const updateMateriaCurriculum = useCallback(
      (materiaName: string, curriculum: PiMateriaCurriculumData[]) => {
        setState((prev) => ({
          ...prev,
          materiaCurriculum: {
            ...prev.materiaCurriculum,
            [materiaName]: curriculum,
          },
        }));
      },
      []
    );

    const handleExportPdf = useCallback(async () => {
      setExporting(true);
      try {
        const res = await fetch(
          `/api/students/${studentId}/pi/export-pdf?yearId=${schoolYearId}`
        );
        if (!res.ok) throw new Error("Error exportant PDF");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          res.headers
            .get("Content-Disposition")
            ?.match(/filename="(.+)"/)?.[1] || "pi-export.pdf";
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Error exporting PI PDF:", err);
      } finally {
        setExporting(false);
      }
    }, [studentId, schoolYearId]);

    // Dynamic tab list: fixed tabs + one per materia
    const fixedTabs = useMemo(
      () => [
        { key: "dades", label: "1. Dades" },
        { key: "justificacio", label: "2. Justificació" },
        { key: "orientacions", label: "3. Orientacions" },
        { key: "transversals", label: "4. Comp. Transversals" },
        { key: "horari", label: "5. Horari" },
        { key: "seguiment", label: "6. Seguiment" },
      ],
      []
    );

    const materiaTabs = useMemo(
      () =>
        state.materies.map((m) => ({
          key: `mat_${m.materia}`,
          label: `MAT_${m.materia}`,
        })),
      [state.materies]
    );

    const allTabs = useMemo(
      () => [...fixedTabs, ...materiaTabs],
      [fixedTabs, materiaTabs]
    );

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (!config) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Error carregant configuració PI.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center gap-2">
            <ScrollArea className="w-full flex-1">
              <TabsList className="inline-flex w-max">
                {allTabs.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting}
              className="shrink-0"
            >
              <FileDown className="h-4 w-4 mr-1" />
              {exporting ? "Exportant..." : "PDF PI"}
            </Button>
          </div>

          <TabsContent value="dades" className="mt-4">
            <PiDadesSubTab
              config={config}
              materies={state.materies}
              professionals={state.professionals}
              document={state.document}
              schoolYearId={schoolYearId}
              editing={editing && canWrite}
              onUpdateDocument={updateDocument}
              onUpdateMateries={updateMateries}
              onUpdateProfessionals={updateProfessionals}
            />
          </TabsContent>

          <TabsContent value="justificacio" className="mt-4">
            <PiJustificacioSubTab
              config={config}
              document={state.document}
              editing={editing && canWrite}
              onUpdateDocument={updateDocument}
            />
          </TabsContent>

          <TabsContent value="orientacions" className="mt-4">
            <PiOrientacionsSubTab
              config={config}
              document={state.document}
              orientacions={state.orientacions}
              editing={editing && canWrite}
              onUpdateOrientacions={updateOrientacions}
              onUpdateDocument={updateDocument}
            />
          </TabsContent>

          <TabsContent value="transversals" className="mt-4">
            <PiCompTransversalsSubTab
              config={config}
              compTransversals={state.compTransversals}
              editing={editing && canWrite}
              onUpdate={updateCompTransversals}
            />
          </TabsContent>

          <TabsContent value="horari" className="mt-4">
            <PiHorariSubTab
              document={state.document}
              editing={editing && canWrite}
              onUpdateDocument={updateDocument}
            />
          </TabsContent>

          <TabsContent value="seguiment" className="mt-4">
            <PiSeguimentSubTab
              signatures={state.signatures}
              reunions={state.reunions}
              continuitat={state.continuitat}
              editing={editing && canWrite}
              onUpdateSignatures={updateSignatures}
              onUpdateReunions={updateReunions}
              onUpdateContinuitat={updateContinuitat}
            />
          </TabsContent>

          {state.materies.map((mat) => (
            <TabsContent
              key={`mat_${mat.materia}`}
              value={`mat_${mat.materia}`}
              className="mt-4"
            >
              <PiMateriaSubTab
                config={config}
                materia={mat}
                mesures={state.materiaMesures[mat.materia] || []}
                curriculum={state.materiaCurriculum[mat.materia] || []}
                orientacions={state.orientacions}
                editing={editing && canWrite}
                onUpdateMesures={(m) => updateMateriaMesures(mat.materia, m)}
                onUpdateCurriculum={(c) =>
                  updateMateriaCurriculum(mat.materia, c)
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }
);
