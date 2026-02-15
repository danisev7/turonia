import { describe, it, expect, vi } from "vitest";
import { classifyEmail } from "../agents/classifier";
import { extractCandidateData } from "../agents/extractor";
import type { AIProvider, Classification, CandidateExtraction } from "../types";

function createMockProvider(overrides?: Partial<AIProvider>): AIProvider {
  return {
    classify: vi.fn().mockResolvedValue({
      classification: "cv",
      confidence: 0.95,
      reasoning: "L'email conté un CV adjunt",
    } satisfies Classification),
    extract: vi.fn().mockResolvedValue({
      firstName: "Maria",
      lastName: "Garcia",
      email: "maria@example.com",
      phone: "+34 612 345 678",
      dateOfBirth: "1990-05-15",
      dateOfBirthApproximate: false,
      educationLevel: "Grau en Educació Primària",
      workExperienceSummary: "5 anys d'experiència docent",
      teachingMonths: 60,
      stages: ["infantil", "primaria"],
      languages: [
        { language: "Català", level: "nadiu" },
        { language: "Castellà", level: "nadiu" },
        { language: "Anglès", level: "alt" },
      ],
    } satisfies CandidateExtraction),
    ...overrides,
  };
}

describe("classifyEmail agent", () => {
  it("delegates to provider.classify", async () => {
    const provider = createMockProvider();
    const email = {
      subject: "Currículum Vitae",
      body: "Adjunto el meu CV",
      from: "candidat@test.com",
      to: ["escola@elturo.cat"],
      hasAttachments: true,
      attachmentNames: ["cv.pdf"],
    };

    const result = await classifyEmail(provider, email);

    expect(provider.classify).toHaveBeenCalledWith(email);
    expect(result.classification).toBe("cv");
    expect(result.confidence).toBe(0.95);
  });

  it("propagates provider errors", async () => {
    const provider = createMockProvider({
      classify: vi.fn().mockRejectedValue(new Error("API error")),
    });

    await expect(
      classifyEmail(provider, {
        subject: "Test",
        body: "Test",
        from: "test@test.com",
        to: [],
        hasAttachments: false,
        attachmentNames: [],
      })
    ).rejects.toThrow("API error");
  });
});

describe("extractCandidateData agent", () => {
  it("delegates to provider.extract", async () => {
    const provider = createMockProvider();
    const docBase64 = "base64data";
    const mimeType = "application/pdf";
    const emailContext = {
      subject: "CV Maria Garcia",
      body: "Adjunto CV",
    };

    const result = await extractCandidateData(
      provider,
      docBase64,
      mimeType,
      emailContext
    );

    expect(provider.extract).toHaveBeenCalledWith(
      docBase64,
      mimeType,
      emailContext
    );
    expect(result.firstName).toBe("Maria");
    expect(result.lastName).toBe("Garcia");
    expect(result.email).toBe("maria@example.com");
    expect(result.stages).toEqual(["infantil", "primaria"]);
    expect(result.languages).toHaveLength(3);
  });

  it("propagates provider errors", async () => {
    const provider = createMockProvider({
      extract: vi.fn().mockRejectedValue(new Error("Extraction failed")),
    });

    await expect(
      extractCandidateData(provider, "data", "application/pdf", {
        subject: "Test",
        body: "Test",
      })
    ).rejects.toThrow("Extraction failed");
  });
});
