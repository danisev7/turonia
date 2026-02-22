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

// Student types
export type UserRole =
  | "admin"
  | "direccio"
  | "tutor"
  | "poe"
  | "mesi"
  | "secretaria"
  | "professor"
  | "convidat";

export type StudentEtapa = "infantil" | "primaria" | "eso";

export type StudentEstat = "resolt" | "pendent";

export type InformeEap = "sense_informe" | "nese_annex1" | "nee_annex1i2";

export type MesuraNese =
  | "pi"
  | "pi_curricular"
  | "pi_no_curricular"
  | "pi_nouvingut"
  | "dua_misu"
  | "no_mesures";

export type Nise = "nise" | "sls" | "no";

export type BecaMec =
  | "sollicitada_curs_actual"
  | "candidat_proper_curs"
  | "no_candidat_mec";
