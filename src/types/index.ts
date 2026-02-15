export type CandidateStatus = "pendent" | "vist";

export type CandidateEvaluation =
  | "molt_interessant"
  | "interessant"
  | "poc_interessant"
  | "descartat";

export type EducativeStage = "infantil" | "primaria" | "secundaria" | "altres";

export type LanguageLevel = "nadiu" | "alt" | "mitja" | "basic";

export type EmailDirection = "inbound" | "outbound";

export type EmailClassification = "cv" | "job_offer" | "response" | "other";

export type ProcessingStatus = "completed" | "failed" | "skipped";

export type DocumentType = "pdf" | "docx" | "doc";

export type AIProvider = "anthropic" | "openai" | "google";

export type AITaskType = "classification" | "extraction";

export type InterestedStatus = "si" | "no" | "dubte";
