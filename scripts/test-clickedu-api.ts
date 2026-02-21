/**
 * Clickedu API Test Script
 *
 * Tests authentication and student listing from the Clickedu API.
 * Run with: npx tsx scripts/test-clickedu-api.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(import.meta.dirname!, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const value = trimmed.slice(eqIdx + 1);
  process.env[key] = value;
}

const CLICKEDU = {
  domain: process.env.CLICKEDU_DOMAIN!,
  username: process.env.CLICKEDU_USERNAME!,
  password: process.env.CLICKEDU_PASSWORD!,
  passfile: process.env.CLICKEDU_PASSFILE!,
  apiKey: process.env.CLICKEDU_API_KEY!,
  clientId: Number(process.env.CLICKEDU_CLIENT_ID!),
  clientSecret: process.env.CLICKEDU_CLIENT_SECRET!,
};

const LOGIN_URL = "https://api.clickedu.eu/login/v1/auth/token";
const USERS_URL = "https://api.clickedu.eu/users";

// ─── Helpers ─────────────────────────────────────────────

function log(label: string, data: unknown) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"═".repeat(60)}`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

async function tryLogin(
  label: string,
  body: Record<string, unknown>,
  headers: Record<string, string>
): Promise<string | null> {
  console.log(`\n--- Intento: ${label} ---`);
  console.log("Headers:", JSON.stringify(headers, null, 2));
  console.log("Body:", JSON.stringify(body, null, 2));

  try {
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (res.ok && data.access_token) {
      console.log("✅ LOGIN EXITOSO!");
      return data.access_token;
    } else {
      console.log("❌ Login fallido");
      return null;
    }
  } catch (err) {
    console.log("❌ Error de red:", (err as Error).message);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  log("Clickedu API Test", {
    domain: CLICKEDU.domain,
    username: CLICKEDU.username,
    apiKey: CLICKEDU.apiKey.slice(0, 10) + "...",
  });

  let token: string | null = null;

  // Attempt 1: Standard User grant (as documented)
  token = await tryLogin(
    "User grant (docs example)",
    {
      grant_type: "password",
      client_id: CLICKEDU.clientId,
      client_secret: CLICKEDU.clientSecret,
      username: CLICKEDU.username,
      password: CLICKEDU.password,
    },
    {
      "x-api-key": CLICKEDU.apiKey,
      domain: CLICKEDU.domain,
    }
  );

  // Attempt 2: With passfile as password
  if (!token) {
    token = await tryLogin(
      "User grant con passfile como password",
      {
        grant_type: "password",
        client_id: CLICKEDU.clientId,
        client_secret: CLICKEDU.clientSecret,
        username: CLICKEDU.username,
        password: CLICKEDU.passfile,
      },
      {
        "x-api-key": CLICKEDU.apiKey,
        domain: CLICKEDU.domain,
      }
    );
  }

  // Attempt 3: With passfile as client_secret
  if (!token) {
    token = await tryLogin(
      "User grant con passfile como client_secret",
      {
        grant_type: "password",
        client_id: CLICKEDU.clientId,
        client_secret: CLICKEDU.passfile,
        username: CLICKEDU.username,
        password: CLICKEDU.password,
      },
      {
        "x-api-key": CLICKEDU.apiKey,
        domain: CLICKEDU.domain,
      }
    );
  }

  // Attempt 4: With passfile as x-api-key
  if (!token) {
    token = await tryLogin(
      "User grant con passfile como x-api-key",
      {
        grant_type: "password",
        client_id: CLICKEDU.clientId,
        client_secret: CLICKEDU.clientSecret,
        username: CLICKEDU.username,
        password: CLICKEDU.password,
      },
      {
        "x-api-key": CLICKEDU.passfile,
        domain: CLICKEDU.domain,
      }
    );
  }

  // Attempt 5: With full domain (escolaelturo.clickedu.eu)
  if (!token) {
    token = await tryLogin(
      "User grant con domain completo",
      {
        grant_type: "password",
        client_id: CLICKEDU.clientId,
        client_secret: CLICKEDU.clientSecret,
        username: CLICKEDU.username,
        password: CLICKEDU.password,
      },
      {
        "x-api-key": CLICKEDU.apiKey,
        domain: `${CLICKEDU.domain}.clickedu.eu`,
      }
    );
  }

  // Attempt 6: With passfile appended to password
  if (!token) {
    token = await tryLogin(
      "User grant con password+passfile concatenados",
      {
        grant_type: "password",
        client_id: CLICKEDU.clientId,
        client_secret: CLICKEDU.clientSecret,
        username: CLICKEDU.username,
        password: `${CLICKEDU.password}:${CLICKEDU.passfile}`,
      },
      {
        "x-api-key": CLICKEDU.apiKey,
        domain: CLICKEDU.domain,
      }
    );
  }

  // Attempt 7: Client grant (sin user/pass)
  if (!token) {
    token = await tryLogin(
      "Client grant (sin credenciales de usuario)",
      {
        grant_type: "client_credentials",
        client_id: CLICKEDU.clientId,
        client_secret: CLICKEDU.clientSecret,
      },
      {
        "x-api-key": CLICKEDU.apiKey,
        domain: CLICKEDU.domain,
      }
    );
  }

  // ─── If we got a token, try fetching students ───
  if (token) {
    log("TOKEN OBTENIDO", { token: token.slice(0, 50) + "..." });

    // Test: list students
    console.log("\n--- Probando GET /v2/lists/students ---");
    try {
      const res = await fetch(`${USERS_URL}/v2/lists/students?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": CLICKEDU.apiKey,
          domain: CLICKEDU.domain,
        },
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      log(`Students Response (${res.status})`, data);

      // If students returned, try getting details of the first one
      if (res.ok && data.users?.length > 0) {
        const firstStudent = data.users[0];
        console.log(`\n--- Probando GET /v2/users/${firstStudent.id}/0 ---`);

        const detailRes = await fetch(
          `${USERS_URL}/v2/users/${firstStudent.id}/0`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-api-key": CLICKEDU.apiKey,
              domain: CLICKEDU.domain,
            },
          }
        );

        const detailText = await detailRes.text();
        let detailData: any;
        try {
          detailData = JSON.parse(detailText);
        } catch {
          detailData = detailText;
        }

        log(`Student Detail (${detailRes.status}): ${firstStudent.name}`, detailData);
      }
    } catch (err) {
      console.log("❌ Error al obtener students:", (err as Error).message);
    }
  } else {
    log("RESULTADO", "❌ Ningún intento de login funcionó. Posiblemente necesitas credenciales API propias. Contacta: api@clickedu.net");
  }
}

main().catch(console.error);
