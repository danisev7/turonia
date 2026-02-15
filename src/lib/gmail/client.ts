import type { GmailCredentials, GmailMessage, GmailAttachment } from "./types";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export class GmailClient {
  private credentials: GmailCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: GmailCredentials) {
    this.credentials = credentials;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        refresh_token: this.credentials.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh Gmail token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken!;
  }

  private async request(path: string, options?: RequestInit) {
    const token = await this.getAccessToken();
    const response = await fetch(`${GMAIL_API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gmail API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * List message IDs matching a query.
   */
  async listMessages(query: string, maxResults = 100): Promise<string[]> {
    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
    });

    const data = await this.request(`/messages?${params}`);
    return (data.messages || []).map((m: { id: string }) => m.id);
  }

  /**
   * Get full message details.
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    const data = await this.request(
      `/messages/${messageId}?format=full`
    );

    const headers = data.payload?.headers || [];
    const getHeader = (name: string): string =>
      headers.find(
        (h: { name: string; value: string }) =>
          h.name.toLowerCase() === name.toLowerCase()
      )?.value || "";

    const subject = getHeader("Subject");
    const from = getHeader("From");
    const toRaw = getHeader("To");
    const bccRaw = getHeader("Bcc");
    const date = getHeader("Date");

    const parseAddresses = (raw: string): string[] => {
      if (!raw) return [];
      return raw.split(",").map((addr) => {
        const match = addr.match(/<([^>]+)>/);
        return (match ? match[1] : addr).trim().toLowerCase();
      });
    };

    // Extract body
    const body = extractBody(data.payload);
    const bodyPreview = data.snippet || body.substring(0, 500);

    // Extract attachments
    const attachments: GmailAttachment[] = [];
    extractAttachments(data.payload, attachments);

    return {
      id: data.id,
      threadId: data.threadId,
      labelIds: data.labelIds || [],
      subject,
      from: parseAddresses(from)[0] || from,
      to: parseAddresses(toRaw),
      bcc: parseAddresses(bccRaw),
      date,
      body,
      bodyPreview,
      attachments,
    };
  }

  /**
   * Download an attachment.
   */
  async getAttachment(
    messageId: string,
    attachmentId: string
  ): Promise<Uint8Array> {
    const data = await this.request(
      `/messages/${messageId}/attachments/${attachmentId}`
    );

    // Gmail returns base64url-encoded data
    const base64 = data.data.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Get history changes since a history ID.
   */
  async getHistory(
    startHistoryId: string
  ): Promise<{ historyId: string; messageIds: string[] }> {
    try {
      const params = new URLSearchParams({
        startHistoryId,
        historyTypes: "messageAdded",
      });

      const data = await this.request(`/history?${params}`);

      const messageIds: string[] = [];
      (data.history || []).forEach(
        (h: {
          messagesAdded?: { message: { id: string } }[];
        }) => {
          h.messagesAdded?.forEach((m) => messageIds.push(m.message.id));
        }
      );

      return {
        historyId: data.historyId || startHistoryId,
        messageIds,
      };
    } catch {
      // If historyId is too old, fall back to listing
      return { historyId: startHistoryId, messageIds: [] };
    }
  }

  /**
   * Get the current profile (for getting latest historyId).
   */
  async getProfile(): Promise<{ historyId: string; emailAddress: string }> {
    return this.request("/profile");
  }
}

function extractBody(payload: {
  mimeType?: string;
  body?: { data?: string };
  parts?: Array<{
    mimeType?: string;
    body?: { data?: string };
    parts?: unknown[];
  }>;
}): string {
  if (payload.body?.data) {
    const base64 = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
    try {
      return decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch {
      return atob(base64);
    }
  }

  if (payload.parts) {
    // Prefer text/plain, fallback to text/html
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart) return extractBody(textPart as typeof payload);

    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart) return extractBody(htmlPart as typeof payload);

    // Recurse into multipart
    for (const part of payload.parts) {
      const body = extractBody(part as typeof payload);
      if (body) return body;
    }
  }

  return "";
}

function extractAttachments(
  payload: {
    filename?: string;
    mimeType?: string;
    body?: { attachmentId?: string; size?: number };
    parts?: unknown[];
  },
  result: GmailAttachment[]
) {
  if (payload.filename && payload.body?.attachmentId) {
    const ext = payload.filename.toLowerCase().split(".").pop();
    if (["pdf", "doc", "docx"].includes(ext || "")) {
      result.push({
        filename: payload.filename,
        mimeType: payload.mimeType || "",
        size: payload.body.size || 0,
        attachmentId: payload.body.attachmentId,
      });
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      extractAttachments(part as typeof payload, result);
    }
  }
}
