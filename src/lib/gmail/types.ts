export interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  subject: string;
  from: string;
  to: string[];
  bcc: string[];
  date: string;
  body: string;
  bodyPreview: string;
  attachments: GmailAttachment[];
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
}
