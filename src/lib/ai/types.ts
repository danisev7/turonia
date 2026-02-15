export interface EmailData {
  subject: string;
  body: string;
  from: string;
  to: string[];
  hasAttachments: boolean;
  attachmentNames: string[];
}

export interface Classification {
  classification: "cv" | "job_offer" | "response" | "other";
  confidence: number;
  reasoning: string;
}

export interface CandidateExtraction {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  dateOfBirthApproximate: boolean;
  educationLevel: string | null;
  workExperienceSummary: string | null;
  teachingMonths: number | null;
  stages: string[];
  languages: { language: string; level: string | null }[];
}

export interface AIProvider {
  classify(email: EmailData): Promise<Classification>;
  extract(
    documentBase64: string,
    mimeType: string,
    emailContext: { subject: string; body: string }
  ): Promise<CandidateExtraction>;
}

export interface AIModelConfig {
  provider: string;
  modelId: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}
