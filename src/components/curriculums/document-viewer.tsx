"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

interface DocumentViewerProps {
  documentId: string | null;
  fileType: string | null;
}

export function DocumentViewer({ documentId, fileType }: DocumentViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    setLoading(true);
    fetch(`/api/documents/${documentId}/url`)
      .then((r) => r.json())
      .then((data) => {
        setUrl(data.url || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [documentId]);

  if (!documentId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 mb-2" />
          <p className="text-sm">Cap document disponible</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">Carregant document...</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">No s&apos;ha pogut carregar el document</p>
      </div>
    );
  }

  if (fileType === "pdf") {
    return (
      <iframe
        src={url}
        className="h-full w-full border-0"
        title="Visualització del CV"
      />
    );
  }

  // For DOCX/DOC, show a download link
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Fitxer {fileType?.toUpperCase()}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline"
        >
          Descarregar document
        </a>
      </div>
    </div>
  );
}
