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

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements AIProvider {
  private config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  async classify(email: EmailData): Promise<Classification> {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelId,
        max_tokens: this.config.maxTokens || 1024,
        temperature: this.config.temperature ?? 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildClassificationUserPrompt(email),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || "";
    return parseJsonResponse<Classification>(text);
  }

  async extract(
    documentBase64: string,
    mimeType: string,
    emailContext: { subject: string; body: string }
  ): Promise<CandidateExtraction> {
    // OpenAI vision API for PDF analysis
    const dataUrl = `data:${mimeType};base64,${documentBase64}`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelId,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature ?? 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: dataUrl },
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
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || "";

    const result = {
      ...parseJsonResponse<CandidateExtraction>(text),
      _usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      },
    };

    return result;
  }
}

function parseJsonResponse<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response: ${text.substring(0, 200)}`);
  }
  return JSON.parse(jsonMatch[0]);
}
