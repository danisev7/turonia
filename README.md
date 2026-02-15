# Turonia — Escola el Turó

Web app per a l'Escola el Turó que automatitza la gestió de currículums amb IA.

## Funcionalitats

- **Processament automàtic de CVs**: Llegeix emails de Gmail cada hora, classifica-los amb IA (Haiku) i extreu dades estructurades dels CVs adjunts amb IA (Sonnet).
- **Gestió de candidats**: Llistat filtrable amb cerca, etapes educatives, avaluació, idiomes i dates. Detall amb visualització del CV, dades extretes i historial d'emails.
- **Detecció d'ofertes de feina**: Detecta emails enviats des de Gmail amb BCC i vincula els destinataris amb candidats existents.
- **Dashboard**: KPIs (total, nous, pendents) i gràfics (per etapa, avaluació, tendència setmanal).
- **Etiquetatge Gmail automàtic**: Aplica etiquetes segons l'etapa educativa detectada (Infantil, Primària, Secundària, Altres).

## Stack tecnològic

| Capa | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 |
| Estils | Tailwind CSS 4 + shadcn/ui |
| ORM | Drizzle ORM |
| Base de dades | Supabase (PostgreSQL) |
| Autenticació | Supabase Auth |
| Emmagatzematge | Supabase Storage |
| Funcions servidor | Supabase Edge Functions (Deno) |
| Scheduling | pg_cron + pg_net + Vercel Cron |
| Gràfics | Recharts 3 |
| IA — Classificació | Claude Haiku (Anthropic) |
| IA — Extracció | Claude Sonnet (Anthropic) |
| Desplegament | Vercel |

## Estructura del projecte

```
src/
├── app/
│   ├── login/                    # Pàgina de login
│   ├── (protected)/              # Rutes protegides
│   │   ├── dashboard/            # KPIs i gràfics
│   │   └── curriculums/          # Llistat i detall de candidats
│   └── api/                      # API Routes (auth, candidates, dashboard, cron)
├── components/
│   ├── ui/                       # Components shadcn/ui
│   ├── layout/                   # Sidebar, header, mobile nav
│   ├── dashboard/                # KPI cards, charts
│   └── curriculums/              # Taula, filtres, detall, visor PDF
├── db/
│   └── schema/                   # 12 esquemes Drizzle (candidates, emails, jobs...)
├── lib/
│   ├── supabase/                 # Clients browser/server/middleware
│   ├── ai/                       # Providers (Anthropic/OpenAI), prompts, agents, factory
│   └── gmail/                    # Client Gmail API, etiquetes
└── types/                        # Tipus TypeScript del domini

supabase/
└── functions/
    └── process-emails/           # Edge Function principal (~557 línies)
```

## Base de dades

12 taules amb RLS activat: `profiles`, `candidates`, `candidate_stages`, `candidate_languages`, `candidate_documents`, `candidate_emails`, `job_offers`, `job_offer_candidates`, `processed_emails`, `extraction_logs`, `ai_model_config`, `gmail_config`.

## Flux de processament d'emails

```
Gmail (cada hora)
  │
  ▼
┌─────────────────────────┐
│  Classificador (Haiku)  │  cv | job_offer | response | other
└─────┬───────┬───────┬───┘
      │       │       │
      ▼       ▼       ▼
   [cv]   [job_offer] [response]
      │       │       │
      ▼       │       ▼
┌──────────┐  │   Actualitza emails
│ Extractor │  │   + dates contacte
│ (Sonnet)  │  ▼
└─────┬─────┘ Crea job_offers
      │       + vincula BCC
      ▼
  Upsert candidat
  + stages + languages
  + document + email
  + etiqueta Gmail
```

## Desenvolupament

```bash
# Instal·lar dependències
npm install

# Servidor de desenvolupament
npm run dev

# Tests
npm test

# Build
npm run build

# Drizzle Studio (explorar BD)
npm run db:studio
```

## Variables d'entorn

### Aplicació (`.env.local` / Vercel)

| Variable | Descripció |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del projecte Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clau anon de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clau service role |
| `DATABASE_URL` | URL de connexió PostgreSQL (pooler) |
| `CRON_SECRET` | Secret per autenticar crides cron |

### Supabase Edge Functions

| Variable | Descripció |
|---|---|
| `ANTHROPIC_API_KEY` | Clau API d'Anthropic |
| `GMAIL_CREDENTIALS` | JSON: `{"client_id":"...","client_secret":"...","refresh_token":"..."}` |
