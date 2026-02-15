"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CandidateDataPanel } from "@/components/curriculums/candidate-data-panel";
import { CandidateEmailsPanel } from "@/components/curriculums/candidate-emails-panel";
import { DocumentViewer } from "@/components/curriculums/document-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CandidateData {
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
  status: string;
  evaluation: string | null;
  observations: string | null;
  candidate_stages: { stage: string }[];
  candidate_languages: { language: string; level: string | null }[];
  candidate_documents: {
    id: string;
    file_name: string;
    file_type: string;
    is_latest: boolean;
  }[];
}

interface EmailData {
  id: string;
  direction: string;
  subject: string | null;
  body_preview: string | null;
  from_email: string | null;
  email_date: string;
  isJobOffer?: boolean;
}

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/candidates/${id}`).then((r) => r.json()),
      fetch(`/api/candidates/${id}/emails`).then((r) => r.json()),
    ]).then(([candidateData, emailsData]) => {
      setCandidate(candidateData);
      setEmails(Array.isArray(emailsData) ? emailsData : []);
      setLoading(false);

      // Auto-mark as "vist" if currently "pendent"
      if (candidateData.status === "pendent") {
        fetch(`/api/candidates/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "vist" }),
        });
      }
    });
  }, [id]);

  async function handleSave(updates: {
    status: string;
    evaluation: string | null;
    observations: string | null;
  }) {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setCandidate((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[calc(100vh-200px)]" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Candidat no trobat</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => router.push("/curriculums")}
        >
          Tornar al llistat
        </Button>
      </div>
    );
  }

  const latestDoc = candidate.candidate_documents?.find((d) => d.is_latest);

  return (
    <div className="space-y-3 h-[calc(100vh-120px)]">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/curriculums")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">
          {[candidate.first_name, candidate.last_name]
            .filter(Boolean)
            .join(" ") || candidate.email}
        </h1>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="rounded-lg border">
        <ResizablePanel defaultSize={50} minSize={30}>
          <DocumentViewer
            documentId={latestDoc?.id || null}
            fileType={latestDoc?.file_type || null}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="h-full overflow-y-auto">
                <CandidateDataPanel
                  candidate={candidate}
                  onSave={handleSave}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full overflow-y-auto">
                <CandidateEmailsPanel emails={emails} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
