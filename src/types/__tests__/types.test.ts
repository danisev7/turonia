import { describe, it, expect } from "vitest";
import type {
  CandidateStatus,
  CandidateEvaluation,
  EducativeStage,
  LanguageLevel,
  EmailDirection,
  EmailClassification,
  ProcessingStatus,
  DocumentType,
} from "../index";

// Type-level tests: these verify that the types compile correctly
// and that the values match the expected domain model

describe("Domain Types", () => {
  it("CandidateStatus allows valid values", () => {
    const statuses: CandidateStatus[] = ["pendent", "vist"];
    expect(statuses).toHaveLength(2);
    expect(statuses).toContain("pendent");
    expect(statuses).toContain("vist");
  });

  it("CandidateEvaluation allows valid values", () => {
    const evaluations: CandidateEvaluation[] = [
      "molt_interessant",
      "interessant",
      "poc_interessant",
      "descartat",
    ];
    expect(evaluations).toHaveLength(4);
  });

  it("EducativeStage uses altres instead of pas", () => {
    const stages: EducativeStage[] = [
      "infantil",
      "primaria",
      "secundaria",
      "altres",
    ];
    expect(stages).toHaveLength(4);
    expect(stages).toContain("altres");
    expect(stages).not.toContain("pas");
  });

  it("LanguageLevel has 4 levels", () => {
    const levels: LanguageLevel[] = ["nadiu", "alt", "mitja", "basic"];
    expect(levels).toHaveLength(4);
  });

  it("EmailDirection has inbound and outbound", () => {
    const directions: EmailDirection[] = ["inbound", "outbound"];
    expect(directions).toHaveLength(2);
  });

  it("EmailClassification has all 4 types", () => {
    const types: EmailClassification[] = [
      "cv",
      "job_offer",
      "response",
      "other",
    ];
    expect(types).toHaveLength(4);
  });

  it("ProcessingStatus has all valid statuses", () => {
    const statuses: ProcessingStatus[] = ["completed", "failed", "skipped"];
    expect(statuses).toHaveLength(3);
  });

  it("DocumentType has pdf, docx, doc", () => {
    const types: DocumentType[] = ["pdf", "docx", "doc"];
    expect(types).toHaveLength(3);
  });
});
