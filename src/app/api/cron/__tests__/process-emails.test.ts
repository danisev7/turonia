import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock env vars
const originalEnv = process.env;

beforeEach(() => {
  vi.restoreAllMocks();
  process.env = {
    ...originalEnv,
    CRON_SECRET: "test-secret",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
  };
});

// Dynamic import to get fresh module each test
async function getHandlers() {
  const module = await import("../../cron/process-emails/route");
  return { POST: module.POST, GET: module.GET };
}

function createRequest(
  method: string = "POST",
  headers: Record<string, string> = {}
) {
  return new Request("http://localhost:3000/api/cron/process-emails", {
    method,
    headers,
  }) as never;
}

describe("POST /api/cron/process-emails", () => {
  it("rejects requests without valid auth", async () => {
    const { POST } = await getHandlers();
    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("No autoritzat");
  });

  it("rejects requests with wrong secret", async () => {
    const { POST } = await getHandlers();
    const response = await POST(
      createRequest("POST", { authorization: "Bearer wrong-secret" })
    );

    expect(response.status).toBe(401);
  });

  it("accepts requests with correct secret", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        processed: 5,
        classified: { cv: 3, job_offer: 1, response: 1, other: 0 },
        errors: 0,
      }),
    });

    const { POST } = await getHandlers();
    const response = await POST(
      createRequest("POST", { authorization: "Bearer test-secret" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.processed).toBe(5);
  });

  it("calls Supabase Edge Function with service role key", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ processed: 0 }),
    });

    const { POST } = await getHandlers();
    await POST(createRequest("POST", { authorization: "Bearer test-secret" }));

    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.supabase.co/functions/v1/process-emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-service-key",
        }),
      })
    );
  });

  it("returns 500 when Edge Function fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Edge function error" }),
    });

    const { POST } = await getHandlers();
    const response = await POST(
      createRequest("POST", { authorization: "Bearer test-secret" })
    );

    expect(response.status).toBe(500);
  });

  it("returns 500 when Supabase config is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";

    const { POST } = await getHandlers();
    const response = await POST(
      createRequest("POST", { authorization: "Bearer test-secret" })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Missing Supabase configuration");
  });
});

describe("GET /api/cron/process-emails (Vercel Cron)", () => {
  it("accepts GET requests with correct secret", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ processed: 2 }),
    });

    const { GET } = await getHandlers();
    const response = await GET(
      createRequest("GET", { authorization: "Bearer test-secret" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.processed).toBe(2);
  });

  it("rejects GET requests without auth", async () => {
    const { GET } = await getHandlers();
    const response = await GET(createRequest("GET"));

    expect(response.status).toBe(401);
  });
});
