import type { AIProvider, EmailData, Classification } from "../types";

export async function classifyEmail(
  provider: AIProvider,
  email: EmailData
): Promise<Classification> {
  return provider.classify(email);
}
