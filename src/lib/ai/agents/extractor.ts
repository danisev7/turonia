import type { AIProvider, CandidateExtraction } from "../types";

export async function extractCandidateData(
  provider: AIProvider,
  documentBase64: string,
  mimeType: string,
  emailContext: { subject: string; body: string }
): Promise<CandidateExtraction> {
  return provider.extract(documentBase64, mimeType, emailContext);
}
