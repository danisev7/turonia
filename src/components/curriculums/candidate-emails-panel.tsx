"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, Briefcase } from "lucide-react";

interface Email {
  id: string;
  direction: string;
  subject: string | null;
  body_preview: string | null;
  from_email: string | null;
  email_date: string;
  isJobOffer?: boolean;
}

interface CandidateEmailsPanelProps {
  emails: Email[];
}

export function CandidateEmailsPanel({ emails }: CandidateEmailsPanelProps) {
  return (
    <div className="space-y-3 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold">Historial d&apos;emails</h3>

      {emails.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cap email registrat</p>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <div
              key={email.id}
              className="rounded-md border p-3 space-y-1 text-sm"
            >
              <div className="flex items-center gap-2">
                {email.direction === "inbound" ? (
                  <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-500 shrink-0" />
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(email.email_date).toLocaleDateString("ca-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {email.from_email && (
                  <span className="text-xs text-muted-foreground truncate">
                    {email.from_email}
                  </span>
                )}
                {email.isJobOffer && (
                  <Badge variant="secondary" className="text-xs ml-auto shrink-0">
                    <Briefcase className="h-3 w-3 mr-1" />
                    Oferta de feina
                  </Badge>
                )}
              </div>
              {email.subject && (
                <p className="font-medium text-xs">{email.subject}</p>
              )}
              {email.body_preview && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {email.body_preview}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
