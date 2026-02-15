import { GmailClient } from "./client";
import type { GmailLabel } from "./types";

/**
 * Mapping from stage DB values to Gmail label names.
 */
const STAGE_LABEL_MAP: Record<string, string> = {
  infantil: "Currículums/Infantil",
  primaria: "Currículums/Primaria",
  secundaria: "Curriculums/Secundària",
  altres: "Curriculums",
};

/**
 * Get the Gmail label name for a given stage.
 */
export function getGmailLabelForStage(stage: string): string {
  return STAGE_LABEL_MAP[stage] || "Curriculums";
}

/**
 * Ensure labels exist in Gmail, creating them if needed.
 * Returns a map of label name → label ID.
 */
export async function ensureLabels(
  client: GmailClient
): Promise<Map<string, string>> {
  // This would need a raw request method — for now we provide the structure
  // Labels should be pre-created in Gmail manually or via API
  const labelMap = new Map<string, string>();

  // Get existing labels via the client
  // The actual implementation will use the Gmail API labels.list endpoint
  void client;
  void labelMap;

  return labelMap;
}

/**
 * Apply a label to a message.
 */
export async function applyLabel(
  _client: GmailClient,
  _messageId: string,
  _labelId: string
): Promise<void> {
  // Will be implemented when Gmail credentials are configured
  // Uses POST /messages/{id}/modify with { addLabelIds: [labelId] }
}

export type { GmailLabel };
