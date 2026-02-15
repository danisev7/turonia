import { describe, it, expect, vi } from "vitest";
import { getAIProvider } from "../factory";

// Mock Supabase client
function createMockSupabase(data: unknown, error: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data, error }),
          }),
        }),
      }),
    }),
  };
}

describe("getAIProvider", () => {
  it("throws when no config found", async () => {
    const supabase = createMockSupabase(null, {
      message: "Not found",
    });

    await expect(
      getAIProvider(supabase as never, "classification")
    ).rejects.toThrow("No active AI model config found");
  });

  it("throws when API key env var is not set", async () => {
    const supabase = createMockSupabase({
      provider: "anthropic",
      model_id: "claude-haiku-4-5-20251001",
      api_key_env_var: "MISSING_KEY",
      max_tokens: 1024,
      temperature: 0,
    });

    const getEnv = () => undefined;

    await expect(
      getAIProvider(supabase as never, "classification", getEnv)
    ).rejects.toThrow("API key env var not set: MISSING_KEY");
  });

  it("creates AnthropicProvider for anthropic config", async () => {
    const supabase = createMockSupabase({
      provider: "anthropic",
      model_id: "claude-haiku-4-5-20251001",
      api_key_env_var: "ANTHROPIC_API_KEY",
      max_tokens: 1024,
      temperature: 0,
    });

    const getEnv = (key: string) =>
      key === "ANTHROPIC_API_KEY" ? "test-key" : undefined;

    const result = await getAIProvider(
      supabase as never,
      "classification",
      getEnv
    );

    expect(result.provider).toBeDefined();
    expect(result.modelId).toBe("claude-haiku-4-5-20251001");
    expect(result.provider.classify).toBeDefined();
    expect(result.provider.extract).toBeDefined();
  });

  it("creates OpenAIProvider for openai config", async () => {
    const supabase = createMockSupabase({
      provider: "openai",
      model_id: "gpt-4o-mini",
      api_key_env_var: "OPENAI_API_KEY",
      max_tokens: 1024,
      temperature: 0,
    });

    const getEnv = (key: string) =>
      key === "OPENAI_API_KEY" ? "test-key" : undefined;

    const result = await getAIProvider(
      supabase as never,
      "extraction",
      getEnv
    );

    expect(result.provider).toBeDefined();
    expect(result.modelId).toBe("gpt-4o-mini");
  });

  it("throws for unknown provider", async () => {
    const supabase = createMockSupabase({
      provider: "unknown_provider",
      model_id: "model-123",
      api_key_env_var: "SOME_KEY",
      max_tokens: 1024,
      temperature: 0,
    });

    const getEnv = () => "test-key";

    await expect(
      getAIProvider(supabase as never, "classification", getEnv)
    ).rejects.toThrow("Unknown AI provider: unknown_provider");
  });
});
