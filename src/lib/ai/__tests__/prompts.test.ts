import { describe, it, expect } from "vitest";
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  buildClassificationUserPrompt,
} from "../prompts/classification";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "../prompts/extraction";

describe("Classification Prompts", () => {
  it("system prompt contains all classification categories", () => {
    expect(CLASSIFICATION_SYSTEM_PROMPT).toContain('"cv"');
    expect(CLASSIFICATION_SYSTEM_PROMPT).toContain('"job_offer"');
    expect(CLASSIFICATION_SYSTEM_PROMPT).toContain('"response"');
    expect(CLASSIFICATION_SYSTEM_PROMPT).toContain('"other"');
  });

  it("system prompt requests JSON response", () => {
    expect(CLASSIFICATION_SYSTEM_PROMPT).toContain("JSON");
    expect(CLASSIFICATION_SYSTEM_PROMPT).toContain("classification");
    expect(CLASSIFICATION_SYSTEM_PROMPT).toContain("confidence");
    expect(CLASSIFICATION_SYSTEM_PROMPT).toContain("reasoning");
  });

  it("buildClassificationUserPrompt includes email fields", () => {
    const prompt = buildClassificationUserPrompt({
      subject: "CV per a professor",
      body: "Benvolguts, adjunto el meu CV...",
      from: "candidat@example.com",
      to: ["escola@elturo.cat"],
      hasAttachments: true,
      attachmentNames: ["cv.pdf"],
    });

    expect(prompt).toContain("CV per a professor");
    expect(prompt).toContain("candidat@example.com");
    expect(prompt).toContain("escola@elturo.cat");
    expect(prompt).toContain("Sí");
    expect(prompt).toContain("cv.pdf");
    expect(prompt).toContain("Benvolguts, adjunto el meu CV...");
  });

  it("buildClassificationUserPrompt shows No for no attachments", () => {
    const prompt = buildClassificationUserPrompt({
      subject: "Test",
      body: "Test body",
      from: "test@test.com",
      to: ["dest@test.com"],
      hasAttachments: false,
      attachmentNames: [],
    });

    expect(prompt).toContain("No");
    expect(prompt).not.toContain("Noms dels adjunts");
  });

  it("buildClassificationUserPrompt truncates body at 2000 chars", () => {
    const longBody = "a".repeat(3000);
    const prompt = buildClassificationUserPrompt({
      subject: "Test",
      body: longBody,
      from: "test@test.com",
      to: ["dest@test.com"],
      hasAttachments: false,
      attachmentNames: [],
    });

    // Body in prompt should be truncated to 2000 chars
    const bodySection = prompt.split("Cos de l'email:\n")[1];
    expect(bodySection.length).toBe(2000);
  });
});

describe("Extraction Prompts", () => {
  it("system prompt contains all stage values", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('"infantil"');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('"primaria"');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('"secundaria"');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('"altres"');
  });

  it("system prompt contains all language level values", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('"nadiu"');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('"alt"');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('"mitja"');
    expect(EXTRACTION_SYSTEM_PROMPT).toContain('"basic"');
  });

  it("system prompt requests JSON with expected fields", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("firstName");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("lastName");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("email");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("phone");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("dateOfBirth");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("stages");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("languages");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("teachingMonths");
  });

  it("buildExtractionUserPrompt includes email context", () => {
    const prompt = buildExtractionUserPrompt({
      subject: "Currículum - Maria Garcia",
      body: "Benvolguts, em dirigeixo a vostès...",
    });

    expect(prompt).toContain("Currículum - Maria Garcia");
    expect(prompt).toContain("Benvolguts, em dirigeixo a vostès...");
  });

  it("buildExtractionUserPrompt truncates body at 1000 chars", () => {
    const longBody = "b".repeat(2000);
    const prompt = buildExtractionUserPrompt({
      subject: "Test",
      body: longBody,
    });

    expect(prompt).toContain("b".repeat(1000));
    expect(prompt).not.toContain("b".repeat(1001));
  });
});
