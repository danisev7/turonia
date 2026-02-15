import type { AIProvider, AIModelConfig } from "./types";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAIProvider } from "./providers/openai";
import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Factory that reads the active AI model config from the database
 * and returns the appropriate provider.
 *
 * @param supabase - A Supabase client (works in both Next.js and Edge Functions)
 * @param taskType - The AI task type to get a provider for
 * @param getEnv - Function to get environment variables (defaults to process.env)
 */
export async function getAIProvider(
  supabase: SupabaseClient,
  taskType: "classification" | "extraction",
  getEnv: (key: string) => string | undefined = (key) => process.env[key]
): Promise<{ provider: AIProvider; modelId: string }> {
  const { data, error } = await supabase
    .from("ai_model_config")
    .select("*")
    .eq("task_type", taskType)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error(
      `No active AI model config found for task type: ${taskType}`
    );
  }

  const apiKey = getEnv(data.api_key_env_var);
  if (!apiKey) {
    throw new Error(`API key env var not set: ${data.api_key_env_var}`);
  }

  const config: AIModelConfig = {
    provider: data.provider,
    modelId: data.model_id,
    apiKey,
    maxTokens: data.max_tokens,
    temperature: data.temperature,
  };

  let provider: AIProvider;

  switch (data.provider) {
    case "anthropic":
      provider = new AnthropicProvider(config);
      break;
    case "openai":
      provider = new OpenAIProvider(config);
      break;
    default:
      throw new Error(`Unknown AI provider: ${data.provider}`);
  }

  return { provider, modelId: data.model_id };
}
