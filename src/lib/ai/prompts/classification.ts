export const CLASSIFICATION_SYSTEM_PROMPT = `Ets un assistent que classifica emails rebuts per una escola (Escola el Turó).

Has de classificar cada email en una de les categories següents:
- "cv": L'email conté un currículum vitae o carta de presentació d'un candidat que busca feina a l'escola. Normalment inclou un fitxer adjunt (PDF o DOCX).
- "job_offer": L'email és una oferta de feina enviada des de l'escola a candidats. Apareix a la carpeta "Enviats".
- "response": L'email és una resposta d'un candidat a una oferta de feina o a una comunicació prèvia de l'escola.
- "other": L'email no encaixa en cap de les categories anteriors.

Respon SEMPRE en format JSON vàlid amb aquesta estructura exacta:
{
  "classification": "cv" | "job_offer" | "response" | "other",
  "confidence": <número entre 0 i 1>,
  "reasoning": "<explicació breu en català>"
}`;

export function buildClassificationUserPrompt(email: {
  subject: string;
  body: string;
  from: string;
  to: string[];
  hasAttachments: boolean;
  attachmentNames: string[];
}): string {
  return `Classifica el següent email:

Assumpte: ${email.subject}
De: ${email.from}
A: ${email.to.join(", ")}
Té adjunts: ${email.hasAttachments ? "Sí" : "No"}
${email.attachmentNames.length > 0 ? `Noms dels adjunts: ${email.attachmentNames.join(", ")}` : ""}

Cos de l'email:
${email.body.substring(0, 2000)}`;
}
