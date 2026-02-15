import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Gmail Client ──────────────────────────────────────────────────────
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailCreds {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

let cachedToken: { token: string; expiry: number } | null = null;

async function getAccessToken(creds: GmailCreds): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiry) return cachedToken.token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiry: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

async function gmailRequest(creds: GmailCreds, path: string) {
  const token = await getAccessToken(creds);
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function gmailModify(creds: GmailCreds, messageId: string, body: object) {
  const token = await getAccessToken(creds);
  const res = await fetch(`${GMAIL_API}/messages/${messageId}/modify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gmail modify ${res.status}: ${await res.text()}`);
  return res.json();
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function parseAddresses(raw: string): string[] {
  if (!raw) return [];
  return raw.split(",").map((a) => {
    const m = a.match(/<([^>]+)>/);
    return (m ? m[1] : a).trim().toLowerCase();
  });
}

function extractBody(payload: any): string {
  if (payload.body?.data) {
    const b64 = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
    try {
      return decodeURIComponent(atob(b64).split("").map((c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    } catch { return atob(b64); }
  }
  if (payload.parts) {
    const text = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (text) return extractBody(text);
    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (html) return extractBody(html);
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }
  return "";
}

interface Attachment { filename: string; mimeType: string; size: number; attachmentId: string; }

function extractAttachments(payload: any, result: Attachment[]) {
  if (payload.filename && payload.body?.attachmentId) {
    const ext = payload.filename.toLowerCase().split(".").pop();
    if (["pdf", "doc", "docx"].includes(ext || "")) {
      result.push({ filename: payload.filename, mimeType: payload.mimeType || "", size: payload.body.size || 0, attachmentId: payload.body.attachmentId });
    }
  }
  if (payload.parts) for (const part of payload.parts) extractAttachments(part, result);
}

// ── AI Classification ──────────────────────────────────────────────────
const CLASSIFICATION_PROMPT = `Ets un assistent que classifica emails rebuts per una escola (Escola el Turó).
Classifica cada email en: "cv" (currículum amb adjunt PDF/DOCX), "job_offer" (oferta enviada des de l'escola), "response" (resposta d'un candidat), o "other".
Respon en JSON: {"classification":"cv"|"job_offer"|"response"|"other","confidence":0-1,"reasoning":"..."}`;

async function classifyEmail(
  apiKey: string,
  modelId: string,
  email: { subject: string; body: string; from: string; to: string[]; hasAttachments: boolean; attachmentNames: string[] }
): Promise<{ classification: string; confidence: number; reasoning: string }> {
  const userMsg = `Assumpte: ${email.subject}\nDe: ${email.from}\nA: ${email.to.join(", ")}\nAdjunts: ${email.hasAttachments ? email.attachmentNames.join(", ") || "Sí" : "No"}\n\nCos:\n${email.body.substring(0, 2000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: modelId, max_tokens: 1024, temperature: 0, system: CLASSIFICATION_PROMPT, messages: [{ role: "user", content: userMsg }] }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);
  const data = await res.json();
  const text = data.content[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON in classification response`);
  return JSON.parse(jsonMatch[0]);
}

// ── AI Extraction ──────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `Ets un expert en extracció de dades de CVs per a l'Escola el Turó.
Etapes: "infantil","primaria","secundaria","altres". Nivells idiomes: "nadiu","alt","mitja","basic".
Respon en JSON: {"firstName":null|str,"lastName":null|str,"email":"...","phone":null|str,"dateOfBirth":null|"YYYY-MM-DD","dateOfBirthApproximate":bool,"educationLevel":null|str,"workExperienceSummary":null|str,"teachingMonths":null|num,"stages":[],"languages":[{"language":"...","level":"..."}]}`;

async function extractCandidate(
  apiKey: string,
  modelId: string,
  docBase64: string,
  mediaType: string,
  emailContext: { subject: string; body: string }
) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      temperature: 0,
      system: EXTRACTION_PROMPT,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: mediaType, data: docBase64 } },
          { type: "text", text: `Context email — Assumpte: ${emailContext.subject}\nCos: ${emailContext.body.substring(0, 1000)}\n\nExtreu les dades del candidat.` },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic extract error: ${await res.text()}`);
  const data = await res.json();
  const text = data.content[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON in extraction response`);
  return {
    ...JSON.parse(jsonMatch[0]),
    _usage: { promptTokens: data.usage?.input_tokens, completionTokens: data.usage?.output_tokens },
  };
}

// ── Gmail Label Mapping ──────────────────────────────────────────────
const STAGE_LABEL_MAP: Record<string, string> = {
  infantil: "Currículums/Infantil",
  primaria: "Currículums/Primaria",
  secundaria: "Curriculums/Secundària",
  altres: "Curriculums",
};

async function ensureAndGetLabelIds(creds: GmailCreds): Promise<Map<string, string>> {
  const data = await gmailRequest(creds, "/labels");
  const labelMap = new Map<string, string>();
  for (const label of data.labels || []) {
    labelMap.set(label.name, label.id);
  }
  return labelMap;
}

// ── Main Processing Pipeline ──────────────────────────────────────────

async function processCV(
  supabase: SupabaseClient,
  creds: GmailCreds,
  extractApiKey: string,
  extractModelId: string,
  msg: any,
  headers: any[],
  body: string,
  attachments: Attachment[],
  processedEmailId: string,
  labelMap: Map<string, string>
) {
  const fromEmail = parseAddresses(getHeader(headers, "From"))[0];
  const subject = getHeader(headers, "Subject");
  const emailDate = getHeader(headers, "Date");

  if (attachments.length === 0) return;

  const attachment = attachments[0];
  // Download attachment
  const attData = await gmailRequest(creds, `/messages/${msg.id}/attachments/${attachment.attachmentId}`);
  const docBase64 = attData.data.replace(/-/g, "+").replace(/_/g, "/");

  const ext = attachment.filename.toLowerCase().split(".").pop() || "pdf";
  const mediaType = ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  // Extract candidate data with AI
  const startTime = Date.now();
  const extracted = await extractCandidate(extractApiKey, extractModelId, docBase64, mediaType, { subject, body });
  const durationMs = Date.now() - startTime;

  const candidateEmail = extracted.email || fromEmail;

  // Upsert candidate
  const { data: existing } = await supabase.from("candidates").select("id").eq("email", candidateEmail).single();

  let candidateId: string;
  if (existing) {
    candidateId = existing.id;
    await supabase.from("candidates").update({
      first_name: extracted.firstName,
      last_name: extracted.lastName,
      phone: extracted.phone,
      date_of_birth: extracted.dateOfBirth,
      date_of_birth_approximate: extracted.dateOfBirthApproximate || false,
      education_level: extracted.educationLevel,
      work_experience_summary: extracted.workExperienceSummary,
      teaching_months: extracted.teachingMonths,
      reception_date: new Date(emailDate || Date.now()).toISOString(),
    }).eq("id", candidateId);

    // Mark old documents as not latest
    await supabase.from("candidate_documents").update({ is_latest: false }).eq("candidate_id", candidateId);
    // Delete old stages/languages to replace with new
    await supabase.from("candidate_stages").delete().eq("candidate_id", candidateId);
    await supabase.from("candidate_languages").delete().eq("candidate_id", candidateId);
  } else {
    const { data: newCandidate } = await supabase.from("candidates").insert({
      email: candidateEmail,
      first_name: extracted.firstName,
      last_name: extracted.lastName,
      phone: extracted.phone,
      date_of_birth: extracted.dateOfBirth,
      date_of_birth_approximate: extracted.dateOfBirthApproximate || false,
      education_level: extracted.educationLevel,
      work_experience_summary: extracted.workExperienceSummary,
      teaching_months: extracted.teachingMonths,
      reception_date: new Date(emailDate || Date.now()).toISOString(),
    }).select("id").single();
    candidateId = newCandidate!.id;
  }

  // Insert stages
  if (extracted.stages?.length > 0) {
    await supabase.from("candidate_stages").insert(
      extracted.stages.map((s: string) => ({ candidate_id: candidateId, stage: s }))
    );
  }

  // Insert languages
  if (extracted.languages?.length > 0) {
    await supabase.from("candidate_languages").insert(
      extracted.languages.map((l: { language: string; level: string | null }) => ({
        candidate_id: candidateId,
        language: l.language,
        level: l.level,
      }))
    );
  }

  // Upload document to storage
  const storagePath = `${candidateId}/${Date.now()}_${attachment.filename}`;
  const binaryStr = atob(docBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

  await supabase.storage.from("documents").upload(storagePath, bytes, { contentType: mediaType });

  // Create document record
  await supabase.from("candidate_documents").insert({
    candidate_id: candidateId,
    file_name: attachment.filename,
    file_type: ext,
    file_size: attachment.size,
    storage_path: storagePath,
    is_latest: true,
  });

  // Create email record
  await supabase.from("candidate_emails").insert({
    candidate_id: candidateId,
    gmail_message_id: msg.id,
    gmail_thread_id: msg.threadId,
    direction: "inbound",
    subject,
    body_preview: body.substring(0, 500),
    from_email: fromEmail,
    to_emails: parseAddresses(getHeader(headers, "To")),
    email_date: new Date(emailDate || Date.now()).toISOString(),
  });

  // Apply Gmail labels
  if (extracted.stages?.length > 0) {
    const labelIds: string[] = [];
    for (const stage of extracted.stages) {
      const labelName = STAGE_LABEL_MAP[stage];
      if (labelName && labelMap.has(labelName)) {
        labelIds.push(labelMap.get(labelName)!);
      }
    }
    if (labelIds.length > 0) {
      try { await gmailModify(creds, msg.id, { addLabelIds: labelIds }); } catch { /* ignore label errors */ }
    }
  }

  // Log extraction
  await supabase.from("extraction_logs").insert({
    candidate_id: candidateId,
    email_id: processedEmailId,
    model_used: extractModelId,
    prompt_tokens: extracted._usage?.promptTokens,
    completion_tokens: extracted._usage?.completionTokens,
    raw_response: extracted,
    duration_ms: durationMs,
  });
}

async function processJobOffer(
  supabase: SupabaseClient,
  msg: any,
  headers: any[],
  body: string,
  bccAddresses: string[]
) {
  const subject = getHeader(headers, "Subject");
  const emailDate = getHeader(headers, "Date");

  // Create job offer
  const { data: offer } = await supabase.from("job_offers").insert({
    gmail_message_id: msg.id,
    subject,
    body_preview: body.substring(0, 500),
    sent_date: new Date(emailDate || Date.now()).toISOString(),
  }).select("id").single();

  if (!offer) return;

  // Link BCC recipients to candidates
  if (bccAddresses.length > 0) {
    const { data: candidates } = await supabase
      .from("candidates")
      .select("id, email")
      .in("email", bccAddresses);

    if (candidates?.length) {
      await supabase.from("job_offer_candidates").insert(
        candidates.map((c) => ({ job_offer_id: offer.id, candidate_id: c.id }))
      );

      // Update last_contact_date for these candidates
      const now = new Date().toISOString();
      for (const c of candidates) {
        await supabase.from("candidates").update({ last_contact_date: now }).eq("id", c.id);
      }
    }
  }
}

async function processResponse(
  supabase: SupabaseClient,
  msg: any,
  headers: any[],
  body: string
) {
  const fromEmail = parseAddresses(getHeader(headers, "From"))[0];
  const subject = getHeader(headers, "Subject");
  const emailDate = getHeader(headers, "Date");

  // Find the candidate
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("email", fromEmail)
    .single();

  if (!candidate) return;

  // Create email record
  await supabase.from("candidate_emails").insert({
    candidate_id: candidate.id,
    gmail_message_id: msg.id,
    gmail_thread_id: msg.threadId,
    direction: "inbound",
    subject,
    body_preview: body.substring(0, 500),
    from_email: fromEmail,
    to_emails: parseAddresses(getHeader(headers, "To")),
    email_date: new Date(emailDate || Date.now()).toISOString(),
  });

  // Update last_response_date
  await supabase.from("candidates").update({
    last_response_date: new Date(emailDate || Date.now()).toISOString(),
  }).eq("id", candidate.id);
}

// ── Main Handler ──────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const results = { processed: 0, classified: { cv: 0, job_offer: 0, response: 0, other: 0 }, errors: 0, details: [] as string[] };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get configs
    const { data: gmailConfig } = await supabase.from("gmail_config").select("*").eq("is_active", true).single();
    if (!gmailConfig) throw new Error("No active Gmail config");

    const gmailCredsRaw = Deno.env.get(gmailConfig.credentials_env_var);
    if (!gmailCredsRaw) throw new Error(`Missing env: ${gmailConfig.credentials_env_var}`);
    const creds: GmailCreds = JSON.parse(gmailCredsRaw);

    const { data: classConfig } = await supabase.from("ai_model_config").select("*").eq("task_type", "classification").eq("is_active", true).single();
    const { data: extractConfig } = await supabase.from("ai_model_config").select("*").eq("task_type", "extraction").eq("is_active", true).single();
    if (!classConfig || !extractConfig) throw new Error("Missing AI model config");

    const classApiKey = Deno.env.get(classConfig.api_key_env_var);
    const extractApiKey = Deno.env.get(extractConfig.api_key_env_var);
    if (!classApiKey || !extractApiKey) throw new Error("Missing AI API keys");

    // Get Gmail label map
    const labelMap = await ensureAndGetLabelIds(creds);

    // Fetch unprocessed emails from inbox
    const inboxIds = await listUnprocessedMessages(supabase, creds, "in:inbox", 50);
    // Also fetch from Sent for job offers
    const sentIds = await listUnprocessedMessages(supabase, creds, "in:sent", 50);
    const allIds = [...new Set([...inboxIds, ...sentIds])];

    for (const messageId of allIds) {
      try {
        const msg = await gmailRequest(creds, `/messages/${messageId}?format=full`);
        const headers = msg.payload?.headers || [];
        const body = extractBody(msg.payload);
        const attachments: Attachment[] = [];
        extractAttachments(msg.payload, attachments);

        const from = parseAddresses(getHeader(headers, "From"))[0];
        const to = parseAddresses(getHeader(headers, "To"));
        const bcc = parseAddresses(getHeader(headers, "Bcc"));
        const isSent = (msg.labelIds || []).includes("SENT");

        // Classify
        const classification = await classifyEmail(classApiKey, classConfig.model_id, {
          subject: getHeader(headers, "Subject"),
          body,
          from,
          to,
          hasAttachments: attachments.length > 0,
          attachmentNames: attachments.map((a) => a.filename),
        });

        // Record processed email
        const { data: processedEmail } = await supabase.from("processed_emails").insert({
          gmail_message_id: messageId,
          gmail_thread_id: msg.threadId,
          classification: classification.classification,
          processing_status: "completed",
        }).select("id").single();

        // Process based on classification
        switch (classification.classification) {
          case "cv":
            await processCV(supabase, creds, extractApiKey, extractConfig.model_id, msg, headers, body, attachments, processedEmail!.id, labelMap);
            results.classified.cv++;
            break;
          case "job_offer":
            if (isSent) {
              await processJobOffer(supabase, msg, headers, body, bcc);
            }
            results.classified.job_offer++;
            break;
          case "response":
            await processResponse(supabase, msg, headers, body);
            results.classified.response++;
            break;
          default:
            results.classified.other++;
        }

        results.processed++;
      } catch (error) {
        results.errors++;
        const errMsg = error instanceof Error ? error.message : "Unknown";
        results.details.push(`Error processing ${messageId}: ${errMsg}`);

        // Record failed processing
        await supabase.from("processed_emails").insert({
          gmail_message_id: messageId,
          processing_status: "failed",
          error_message: errMsg,
        }).catch(() => {});
      }
    }

    // Update last sync
    await supabase.from("gmail_config").update({ last_sync_at: new Date().toISOString() }).eq("id", gmailConfig.id);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ ...results, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function listUnprocessedMessages(
  supabase: SupabaseClient,
  creds: GmailCreds,
  query: string,
  maxResults: number
): Promise<string[]> {
  const params = new URLSearchParams({ q: query, maxResults: maxResults.toString() });
  const data = await gmailRequest(creds, `/messages?${params}`);
  const allIds = (data.messages || []).map((m: { id: string }) => m.id);

  if (allIds.length === 0) return [];

  // Filter out already processed
  const { data: processed } = await supabase
    .from("processed_emails")
    .select("gmail_message_id")
    .in("gmail_message_id", allIds);

  const processedSet = new Set(processed?.map((p) => p.gmail_message_id) || []);
  return allIds.filter((id: string) => !processedSet.has(id));
}
