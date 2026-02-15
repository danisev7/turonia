import type {
  AIProvider,
  AIModelConfig,
  EmailData,
  Classification,
  CandidateExtraction,
} from "../types";
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  buildClassificationUserPrompt,
} from "../prompts/classification";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "../prompts/extraction";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export class AnthropicProvider implements AIProvider {
  private config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  async classify(email: EmailData): Promise<Classification> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.modelId,
        max_tokens: this.config.maxTokens || 1024,
        temperature: this.config.temperature ?? 0,
        system: CLASSIFICATION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildClassificationUserPrompt(email),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || "";
    return parseJsonResponse<Classification>(text);
  }

  async extract(
    documentBase64: string,
    mimeType: string,
    emailContext: { subject: string; body: string }
  ): Promise<CandidateExtraction> {
    const mediaType = mimeType === "application/pdf" ? "application/pdf" : "application/pdf";

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.modelId,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature ?? 0,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: documentBase64,
                },
              },
              {
                type: "text",
                text: buildExtractionUserPrompt(emailContext),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || "";

    const result = {
      ...parseJsonResponse<CandidateExtraction>(text),
      _usage: {
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
      },
    };

    return result;
  }
}

function parseJsonResponse<T>(text: string): T {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response: ${text.substring(0, 200)}`);
  }
  return JSON.parse(jsonMatch[0]);
}
