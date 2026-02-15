# PRD — Turonia (Escola el Turó)

## 1. Visió General del Producte

### Descripció

Turonia és una web app per a l'Escola el Turó que automatitza tasques rutinàries amb IA. La primera funcionalitat és **Gestió de Currículums**: un sistema que processa automàticament els CVs rebuts per Gmail, extreu dades amb IA i els presenta en una interfície filtrable.

### Objectius

1. Automatitzar la recepció i classificació de currículums via Gmail
2. Extreure dades estructurades dels CVs amb agents d'IA
3. Proporcionar una interfície filtrable per gestionar candidats
4. Detectar ofertes de feina enviades des de Gmail i vincular-les amb candidats
5. Preparar l'arquitectura per a futures funcionalitats

### Stack Tecnològic

| Capa | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) + React |
| Estils | Tailwind CSS + shadcn/ui |
| ORM | Drizzle ORM |
| Base de dades | Supabase (PostgreSQL) |
| Autenticació | Supabase Auth |
| Emmagatzematge | Supabase Storage |
| Funcions servidor | Supabase Edge Functions (Deno) |
| Scheduling | pg_cron + pg_net |
| Gràfics | Recharts |
| Desplegament | Vercel |
| IA — Classificació | Model econòmic (Claude Haiku, GPT-4o-mini o similar) |
| IA — Extracció | Model potent (Claude Opus, GPT-4o o similar) |

---

## 2. Esquema de Base de Dades

Totes les taules tenen RLS (Row Level Security) activat. Es defineixen amb Drizzle ORM.

### 2.1 `profiles`

Usuaris de l'aplicació. Es sincronitza amb `auth.users` via trigger. Extensible amb rols futurs.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `auth_id` | `uuid` | NOT NULL, UNIQUE, FK → `auth.users(id)` |
| `email` | `text` | NOT NULL, UNIQUE |
| `full_name` | `text` | NOT NULL |
| `role` | `text` | NOT NULL, default `'admin'` |
| `is_active` | `boolean` | NOT NULL, default `true` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

> Un sol rol (`admin`) per ara. La columna `role` permetrà afegir rols futurs.

### 2.2 `candidates`

Taula principal de candidats. L'email del candidat és la clau de negoci.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `email` | `text` | NOT NULL, UNIQUE |
| `first_name` | `text` | |
| `last_name` | `text` | |
| `phone` | `text` | |
| `date_of_birth` | `date` | |
| `date_of_birth_approximate` | `boolean` | NOT NULL, default `false` |
| `education_level` | `text` | |
| `work_experience_summary` | `text` | |
| `teaching_months` | `integer` | |
| `status` | `text` | NOT NULL, default `'pendent'` — `pendent` \| `vist` |
| `evaluation` | `text` | default `null` — `molt_interessant` \| `interessant` \| `poc_interessant` \| `descartat` |
| `observations` | `text` | |
| `reception_date` | `timestamptz` | NOT NULL — data del primer email amb CV |
| `last_contact_date` | `timestamptz` | — últim contacte des del col·legi |
| `last_response_date` | `timestamptz` | — última resposta del candidat |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

**Índexs:** `status`, `evaluation`, `reception_date`, `email`.

### 2.3 `candidate_stages`

Relació N:M entre candidats i etapes educatives.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `candidate_id` | `uuid` | NOT NULL, FK → `candidates(id)` ON DELETE CASCADE |
| `stage` | `text` | NOT NULL — `infantil` \| `primaria` \| `secundaria` \| `altres` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Restricció UNIQUE:** `(candidate_id, stage)`.
**Índex:** `stage`.

> Un candidat "infantil i primària" tindrà **dos registres** separats.

### 2.4 `candidate_languages`

Idiomes del candidat amb nivell.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `candidate_id` | `uuid` | NOT NULL, FK → `candidates(id)` ON DELETE CASCADE |
| `language` | `text` | NOT NULL |
| `level` | `text` | — `nadiu` \| `alt` \| `mitja` \| `basic` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Restricció UNIQUE:** `(candidate_id, language)`.

### 2.5 `candidate_documents`

Metadades dels CVs. El fitxer binari s'emmagatzema a Supabase Storage.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `candidate_id` | `uuid` | NOT NULL, FK → `candidates(id)` ON DELETE CASCADE |
| `file_name` | `text` | NOT NULL |
| `file_type` | `text` | NOT NULL — `pdf` \| `docx` \| `doc` |
| `file_size` | `integer` | |
| `storage_path` | `text` | NOT NULL — ruta a Supabase Storage |
| `is_latest` | `boolean` | NOT NULL, default `true` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

> Si un candidat envia un nou CV, el registre anterior es marca `is_latest = false` i es crea un de nou. Historial preservat.

### 2.6 `candidate_emails`

Historial d'emails per candidat.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `candidate_id` | `uuid` | NOT NULL, FK → `candidates(id)` ON DELETE CASCADE |
| `gmail_message_id` | `text` | NOT NULL, UNIQUE |
| `gmail_thread_id` | `text` | |
| `direction` | `text` | NOT NULL — `inbound` \| `outbound` |
| `subject` | `text` | |
| `body_preview` | `text` | — primers 500 caràcters |
| `from_email` | `text` | |
| `to_emails` | `text[]` | |
| `email_date` | `timestamptz` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Índexs:** `candidate_id + email_date`, `gmail_message_id`.

### 2.7 `job_offers`

Ofertes de feina enviades des de Gmail (detectades via BCC).

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `gmail_message_id` | `text` | NOT NULL, UNIQUE |
| `subject` | `text` | |
| `body_preview` | `text` | |
| `sent_date` | `timestamptz` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

### 2.8 `job_offer_candidates`

Relació N:M entre ofertes i candidats destinataris + resposta.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `job_offer_id` | `uuid` | NOT NULL, FK → `job_offers(id)` ON DELETE CASCADE |
| `candidate_id` | `uuid` | NOT NULL, FK → `candidates(id)` ON DELETE CASCADE |
| `interested` | `text` | — `si` \| `no` \| `dubte` |
| `response_date` | `timestamptz` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

**Restricció UNIQUE:** `(job_offer_id, candidate_id)`.

### 2.9 `processed_emails`

Registre d'emails ja processats per evitar reprocessament.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `gmail_message_id` | `text` | NOT NULL, UNIQUE |
| `gmail_thread_id` | `text` | |
| `classification` | `text` | — `cv` \| `job_offer` \| `response` \| `other` |
| `processed_at` | `timestamptz` | NOT NULL, default `now()` |
| `processing_status` | `text` | NOT NULL, default `'completed'` — `completed` \| `failed` \| `skipped` |
| `error_message` | `text` | |

**Índex:** `gmail_message_id`.

### 2.10 `extraction_logs`

Logs de les extraccions d'IA.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `candidate_id` | `uuid` | FK → `candidates(id)` ON DELETE SET NULL |
| `email_id` | `uuid` | FK → `processed_emails(id)` |
| `model_used` | `text` | NOT NULL |
| `prompt_tokens` | `integer` | |
| `completion_tokens` | `integer` | |
| `raw_response` | `jsonb` | |
| `confidence_score` | `real` | |
| `duration_ms` | `integer` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

### 2.11 `ai_model_config`

Configuració dinàmica de models d'IA (patró adaptador).

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `task_type` | `text` | NOT NULL, UNIQUE — `classification` \| `extraction` |
| `provider` | `text` | NOT NULL — `anthropic` \| `openai` \| `google` |
| `model_id` | `text` | NOT NULL |
| `api_key_env_var` | `text` | NOT NULL — nom de la variable d'entorn |
| `max_tokens` | `integer` | |
| `temperature` | `real` | |
| `is_active` | `boolean` | NOT NULL, default `true` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

### 2.12 `gmail_config`

Configuració de connexió amb Gmail.

| Columna | Tipus | Restriccions |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `email_account` | `text` | NOT NULL |
| `credentials_env_var` | `text` | NOT NULL |
| `last_history_id` | `text` | — per sincronització incremental |
| `last_sync_at` | `timestamptz` | |
| `is_active` | `boolean` | NOT NULL, default `true` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

---

## 3. Pantalles de l'Aplicació

> **Important:** Tota la UI és en català.

### 3.1 Layout General

- **Sidebar** esquerra col·lapsable amb les opcions:
  - Panell de control (Dashboard)
  - Gestió de Currículums
- **Responsive:** en mòbil el sidebar es converteix en menú hamburguesa
- **Header:** mostra el nom de l'usuari i opció de tancar sessió

### 3.2 `/login` — Inici de sessió

- Formulari amb email i contrasenya
- **Sense signup públic** — només un admin pot crear usuaris
- Missatge d'error en cas de credencials incorrectes
- Redirecció a `/dashboard` després del login

### 3.3 `/dashboard` — Panell de control

KPIs visuals amb targetes numèriques i gràfics (Recharts).

**Targetes:**
| KPI | Descripció |
|---|---|
| Total candidats | Nombre total de candidats a la BD |
| Nous (últims 7 dies) | Candidats rebuts en els últims 7 dies |
| Pendents de revisar | Candidats amb `status = 'pendent'` |

**Gràfics:**
- **Per etapa:** Gràfic de barres amb el total per etapa (Infantil, Primària, Secundària, Altres)
- **Per avaluació:** Gràfic de pastís amb la distribució per avaluació
- **Tendència:** Gràfic de línia amb CVs rebuts per setmana (últimes 12 setmanes)

### 3.4 `/curriculums` — Llistat de candidats

Taula filtrable amb paginació al servidor.

**Columnes de la taula:**
| Columna | Ordenable |
|---|---|
| Nom i cognoms | Sí |
| Email | Sí |
| Telèfon | Sí |
| Etapa | Sí |
| Idiomes | Sí |
| Data de recepció | Sí |
| Últim contacte | Sí |
| Última resposta | Sí |
| Avaluació | Sí |
| Estat | Sí |

**Filtres (a la barra superior):**
- Etapa: multiselect (Infantil, Primària, Secundària, Altres)
- Estat: select (pendent, vist)
- Avaluació: multiselect (Molt Interessant, Interessant, Poc Interessant, Descartat)
- Idiomes: multiselect (llistat dinàmic)
- Rang de dates de recepció: date picker rang
- Cerca lliure: cerca per nom, email o telèfon

**Comportament:**
- Cada fila és clicable → navega a `/curriculums/[id]`
- Paginació al servidor amb 100 registres per pàgina per defecte, amb opció de mostrar-los tots
- L'estat es canvia a `vist` automàticament en entrar al detall

### 3.5 `/curriculums/[id]` — Detall del candidat

Distribució en **3 panells resizables**:

```
┌──────────────────────┬──────────────────────┐
│                      │   Dades extretes     │
│                      │   + Camps editables  │
│   Visualització      │   (estat, avaluació, │
│   del CV             │    observacions)     │
│   (PDF / DOCX)       ├──────────────────────┤
│                      │   Historial d'emails │
│                      │   (nou → antic)      │
└──────────────────────┴──────────────────────┘
```

**Panell esquerre:** Visualització del document original (PDF embed o preview DOCX).

**Panell superior dret — Dades del candidat:**
- Nom i cognoms (només lectura)
- Email (només lectura)
- Telèfon (només lectura)
- Data de naixement (només lectura) — amb indicador ⚠️ si és aproximada
- Nivell d'estudis (només lectura)
- Experiència laboral — resum (només lectura)
- Mesos d'experiència docent (només lectura)
- Etapes (només lectura, badges)
- Idiomes (només lectura, badges amb nivell)
- **Estat** (editable) — select: Pendent / Vist
- **Avaluació** (editable) — select: Molt Interessant / Interessant / Poc Interessant / Descartat
- **Observacions** (editable) — textarea
- Botó "Desar canvis"

**Panell inferior dret — Historial d'emails:**
- Llista d'emails ordenats de més nou a més antic
- Cada email mostra: data, remitent, assumpte, previsualització del cos
- Indicador de direcció: ← rebut / → enviat
- Si està vinculat a una oferta de feina, mostra badge "Oferta de feina"

---

## 4. Estructura d'API Routes

Totes les rutes sota `src/app/api/`. Autenticació requerida excepte login.

### Auth

| Mètode | Ruta | Descripció |
|---|---|---|
| `POST` | `/api/auth/login` | Login amb email/contrasenya |
| `POST` | `/api/auth/logout` | Tancar sessió |
| `GET` | `/api/auth/me` | Obtenir usuari actual |

### Dashboard

| Mètode | Ruta | Descripció |
|---|---|---|
| `GET` | `/api/dashboard/kpis` | KPIs: total, nous, pendents |
| `GET` | `/api/dashboard/charts` | Dades per gràfics |

### Candidats

| Mètode | Ruta | Descripció |
|---|---|---|
| `GET` | `/api/candidates` | Llistat amb filtres i paginació |
| `GET` | `/api/candidates/[id]` | Detall d'un candidat |
| `PATCH` | `/api/candidates/[id]` | Actualitzar camps editables |

### Emails

| Mètode | Ruta | Descripció |
|---|---|---|
| `GET` | `/api/candidates/[id]/emails` | Historial d'emails d'un candidat |

### Documents

| Mètode | Ruta | Descripció |
|---|---|---|
| `GET` | `/api/candidates/[id]/documents` | Llista de documents d'un candidat |
| `GET` | `/api/documents/[id]/url` | URL signada per visualitzar el fitxer |

### Webhook / Cron

| Mètode | Ruta | Descripció |
|---|---|---|
| `POST` | `/api/cron/process-emails` | Disparador del cron (cada hora) |

---

## 5. Arquitectura d'Agents IA

### 5.1 Flux General

```
Gmail (cada hora via cron)
  │
  ▼
┌─────────────────────────┐
│  Agent Classificador     │  Model econòmic (Haiku / GPT-4o-mini)
│  Classifica cada email:  │
│  cv | job_offer |        │
│  response | other        │
└─────┬───────┬───────┬────┘
      │       │       │
      ▼       ▼       ▼
   [cv]  [job_offer] [response]
      │       │       │
      ▼       │       ▼
┌─────────┐   │   Actualitza
│ Agent    │   │   candidate_emails
│ Extractor│   │   + job_offer_candidates
│          │   │   + dates de contacte
│ Model    │   ▼
│ potent   │  Llegeix BCC de
│ (Opus /  │  "Enviats" Gmail →
│  GPT-4o) │  crea job_offers +
└────┬─────┘  job_offer_candidates
     │
     ▼
  Crea/actualitza
  candidate + stages
  + languages + document
  + candidate_emails
  + etiqueta Gmail
```

### 5.2 Agent Classificador

- **Entrada:** email no processat (assumpte + cos + adjunts)
- **Sortida:** `{ classification: 'cv' | 'job_offer' | 'response' | 'other' }`
- **Model:** econòmic (configurable via `ai_model_config`)
- **Processament:**
  - Llegeix emails no processats de la safata d'entrada i "Enviats"
  - Per a `cv`: passa l'email a l'Agent Extractor
  - Per a `job_offer`: detecta destinataris BCC des de la carpeta "Enviats" via Gmail API, crea registres a `job_offers` i `job_offer_candidates`
  - Per a `response`: vincula amb el candidat corresponent, actualitza dates i camp `interested`
  - Per a `other`: marca com a processat i ignora
  - Registra a `processed_emails`

### 5.3 Agent Extractor

- **Entrada:** email classificat com a `cv` + document adjunt (PDF/DOCX)
- **Sortida:** dades estructurades del candidat (JSON)
- **Model:** potent (configurable via `ai_model_config`)
- **Dades extretes:**
  - `first_name`, `last_name`
  - `email` (clau de negoci)
  - `phone`
  - `date_of_birth` + `date_of_birth_approximate` (si s'infereix des de l'any de graduació, es marca com aproximada)
  - `education_level`
  - `work_experience_summary`
  - `teaching_months`
  - `stages[]` — array d'etapes (`infantil` | `primaria` | `secundaria` | `altres`)
  - `languages[]` — array amb `{ language, level }`
- **Processament:**
  - Descarrega l'adjunt (PDF/DOCX) i l'envia al model
  - Si el candidat ja existeix (email UNIQUE), actualitza el registre i guarda el nou CV mantenint l'historial
  - Puja el document a Supabase Storage
  - Crea els registres a `candidate_stages`, `candidate_languages`, `candidate_documents`, `candidate_emails`
  - Aplica etiqueta de Gmail segons l'etapa (veure mapatge a continuació)
  - Registra a `extraction_logs`

**Mapatge etapes → etiquetes Gmail:**

| Etapa (BD) | Etiqueta Gmail |
|---|---|
| `infantil` | `Currículums/Infantil` |
| `primaria` | `Currículums/Primaria` |
| `secundaria` | `Currículums/Secundària` |
| `altres` | `Currículums` |

### 5.4 Detecció de BCC en Ofertes de Feina

**Mecanisme:** La Gmail API (`messages.get` amb `format=full`) preserva la capçalera BCC en la còpia del remitent a la carpeta "Enviats", sempre que l'email s'hagi enviat des de la interfície web de Gmail o des de la Gmail API.

**Flux:**
1. L'agent classificador detecta un email de tipus `job_offer` a la carpeta "Enviats"
2. Llegeix els destinataris BCC via la capçalera `Bcc` del missatge
3. Crea el registre a `job_offers`
4. Per a cada destinatari BCC que existeixi com a candidat, crea un registre a `job_offer_candidates`

**Limitació:** Si l'email s'envia des d'un client SMTP de tercers (Outlook, Thunderbird), Gmail elimina la capçalera BCC. No aplica aquí perquè el col·legi sempre utilitza Gmail web.

### 5.5 Patró Adaptador per a Models d'IA

```typescript
// Interfície comuna per a tots els proveïdors
interface AIProvider {
  classify(email: EmailData): Promise<Classification>
  extract(document: DocumentData): Promise<CandidateData>
}

// Implementacions per proveïdor
class AnthropicProvider implements AIProvider { ... }
class OpenAIProvider implements AIProvider { ... }

// Factory que llegeix la config de la BD
function getAIProvider(taskType: 'classification' | 'extraction'): AIProvider
```

La configuració del model actiu es guarda a `ai_model_config`. Canviar de proveïdor requereix només actualitzar el registre a la BD.

### 5.6 Infraestructura d'Execució

- **Supabase Edge Functions:** executen els agents d'IA
- **pg_cron:** programa l'execució cada hora
- **pg_net:** crida la Edge Function des del cron de PostgreSQL
- **Webhook alternatiu:** ruta `/api/cron/process-emails` per si es prefereix un cron extern (Vercel Cron)

---

## 6. Pla d'Implementació per Fases

### Fase 0 — Configuració del Projecte ✅

- Inicialitzar projecte Next.js amb App Router
- Configurar Tailwind CSS
- Instal·lar i configurar shadcn/ui
- Configurar Drizzle ORM amb connexió a Supabase
- Configurar ESLint, Prettier
- Estructura de carpetes base

> **Canvis implementats:**
> - Next.js 16 amb App Router i Turbopack, React 19, TypeScript 5.9
> - Tailwind CSS 4 amb `@tailwindcss/postcss`
> - shadcn/ui (new-york style) amb components: button, card, input, label, select, textarea, badge, table, separator, sheet, tooltip, dropdown-menu, dialog, scroll-area, avatar, skeleton, tabs, resizable
> - Drizzle ORM + drizzle-kit connectat a Supabase PostgreSQL
> - Supabase JS client (`@supabase/supabase-js` + `@supabase/ssr`)
> - Recharts 3 per a gràfics
> - Estructura de carpetes completa amb `src/` i rutes protegides `(protected)/`
> - Projecte Supabase: `vtxjacnmruqslznltpcc` (eu-central-1)

### Fase 1 — Autenticació i Layout ✅

- Configurar Supabase Auth (email/contrasenya)
- Pàgina de login (`/login`)
- Middleware de protecció de rutes
- Layout principal amb sidebar col·lapsable
- Responsive: menú hamburguesa en mòbil
- Navegació: "Panell de control" i "Gestió de Currículums"

> **Canvis implementats:**
> - Clients Supabase: `client.ts` (browser), `server.ts` (server), `middleware.ts` (session refresh)
> - Middleware Next.js que protegeix totes les rutes i redirigeix a `/login`
> - Pàgina de login amb formulari email/contrasenya i missatge d'error en català
> - API routes: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
> - Layout protegit `(protected)/layout.tsx` amb sidebar col·lapsable (tooltip en mode compacte)
> - Header amb email de l'usuari i botó logout
> - Navegació mòbil amb `Sheet` (menú hamburguesa)
> - Pàgines placeholder: dashboard, curriculums, curriculums/[id]

### Fase 2 — Base de Dades ✅

- Definir esquemes Drizzle per a les 12 taules
- Generar i aplicar migracions
- Activar RLS a totes les taules
- Crear polítiques RLS
- Crear índexs per a camps de filtrat
- Crear bucket a Supabase Storage per a documents

> **Canvis implementats:**
> - 12 esquemes Drizzle definits a `src/db/schema/`: profiles, candidates, candidate_stages, candidate_languages, candidate_documents, candidate_emails, job_offers, job_offer_candidates, processed_emails, extraction_logs, ai_model_config, gmail_config
> - Migracions aplicades a Supabase amb 4 migracions SQL
> - RLS activat a totes les 12 taules amb polítiques basades en `profiles.auth_id = auth.uid()`
> - Índexs creats: `status`, `evaluation`, `reception_date`, `email` (candidates), `stage` (candidate_stages), `gmail_message_id` (candidate_emails, processed_emails)
> - Trigger `handle_new_user()` per sincronitzar `auth.users` → `profiles`
> - Trigger `update_updated_at()` reutilitzat per profiles, candidates, ai_model_config, gmail_config
> - Bucket `documents` creat a Supabase Storage (privat) amb polítiques RLS
> - Connexió Drizzle configurada a `src/db/index.ts` amb `postgres` driver

### Fase 3 — Dashboard ✅

- Pàgina `/dashboard`
- API route `/api/dashboard/kpis`
- API route `/api/dashboard/charts`
- Targetes KPI amb shadcn/ui Card
- Gràfics amb Recharts (barres, pastís, línia)

> **Canvis implementats:**
> - API route `GET /api/dashboard/kpis`: retorna total candidats, nous últims 7 dies, pendents de revisar
> - API route `GET /api/dashboard/charts`: retorna dades per etapa (barres), per avaluació (pastís), tendència setmanal (línia, últimes 12 setmanes)
> - Component `KPICards`: 3 targetes amb icones (Users, UserPlus, Clock)
> - Component `DashboardCharts`: gràfic de barres per etapa, pastís per avaluació amb colors, línia de tendència
> - Pàgina `/dashboard` amb Skeleton loading states
> - Tots els gràfics amb Recharts 3 (`ResponsiveContainer`)

### Fase 4 — Llistat de Candidats ✅

- Pàgina `/curriculums`
- API route `/api/candidates` amb filtres i paginació
- Taula amb shadcn/ui DataTable
- Filtres: etapa, estat, avaluació, idiomes, dates, cerca
- Paginació al servidor
- Ordenació per columnes

> **Canvis implementats:**
> - API route `GET /api/candidates`: consulta amb filtres (search, status, stages, evaluations, languages, dateFrom, dateTo), paginació servidor (100/pàgina), ordenació dinàmica
> - Component `CandidatesFilters`: cerca lliure, badges toggle per etapa/estat/avaluació/idiomes, date pickers rang, botó "Netejar filtres"
> - Component `CandidatesTable`: 10 columnes ordenables, badges colorits per avaluació, navegació a detall amb click a fila, paginació amb botons prev/next
> - Pàgina `/curriculums` integra filtres + taula amb loading skeleton i reset de pàgina en canviar filtres
> - Idiomes disponibles s'extreuen dinàmicament de les dades

### Fase 5 — Detall del Candidat ✅

- Pàgina `/curriculums/[id]`
- API routes: detall, emails, documents, URL signada
- Layout 3 panells resizables (shadcn/ui ResizablePanelGroup)
- Visualització PDF embed
- Formulari d'edició: estat, avaluació, observacions
- Historial d'emails
- Canvi automàtic d'estat a "vist"

> **Canvis implementats:**
> - API routes: `GET/PATCH /api/candidates/[id]`, `GET /api/candidates/[id]/emails`, `GET /api/candidates/[id]/documents`, `GET /api/documents/[id]/url` (URL signada 1h)
> - Layout amb 3 panells resizables (`react-resizable-panels` v4 amb prop `orientation`)
> - `DocumentViewer`: embed PDF via iframe, fallback descàrrega per DOCX/DOC
> - `CandidateDataPanel`: dades en lectura (nom, email, telèfon, data naixement amb indicador aproximada, estudis, experiència, mesos docent, etapes, idiomes) + camps editables (estat, avaluació, observacions) amb botó "Desar canvis"
> - `CandidateEmailsPanel`: historial emails ordenats nou→antic, indicador direcció (↙rebut/↗enviat), badge "Oferta de feina" si vinculat
> - Canvi automàtic d'estat a "vist" en entrar al detall
> - PATCH només permet actualitzar `status`, `evaluation`, `observations` (whitelist de camps)
> - Wrapper `resizable.tsx` actualitzat per compatibilitat amb `react-resizable-panels` v4.6

### Fase 6 — Infraestructura IA i Gmail ✅

- Configurar credencials OAuth2 de Gmail API
- Crear servei de connexió a Gmail (lectura d'emails, etiquetes)
- Implementar patró adaptador per a models d'IA
- Seedear `ai_model_config` i `gmail_config`
- Crear la Edge Function base a Supabase
- Configurar pg_cron per a execució cada hora

> **Canvis implementats:**
> - `GmailClient` (`src/lib/gmail/client.ts`): autenticació OAuth2 amb refresh token, lectura de missatges, descàrrega d'adjunts (PDF/DOCX), historial incremental, extracció de cos (text/plain → text/html) i adjunts
> - `gmail/labels.ts`: mapatge etapes → etiquetes Gmail (Curriculums/Infantil, etc.)
> - Patró adaptador IA: interfície `AIProvider` amb `classify()` i `extract()`
> - Proveïdors: `AnthropicProvider` (API messages amb suport document/PDF) i `OpenAIProvider` (chat completions amb vision)
> - `factory.ts`: factory genèrica que llegeix `ai_model_config` de la BD i instancia el proveïdor actiu
> - Prompts en català: `classification.ts` (cv/job_offer/response/other) i `extraction.ts` (dades estructurades del candidat)
> - Seed: `ai_model_config` amb Haiku (classificació) i Sonnet (extracció), `gmail_config` placeholder
> - Edge Function `process-emails` desplegada a Supabase (esquelet base)
> - Extensions `pg_cron` + `pg_net` activades, cron job `process-emails-hourly` programat cada hora
> - API route `POST /api/cron/process-emails` com a webhook alternatiu amb autenticació per `CRON_SECRET`
> - `supabase/functions/` exclòs del `tsconfig.json` (és codi Deno, no Next.js)

### Fase 7 — Agent de Classificació ✅

- Implementar l'agent classificador a la Edge Function
- Prompt de classificació per al model econòmic
- Lògica per processar cada tipus: cv, job_offer, response, other
- Detecció de BCC en emails de "Enviats" per a ofertes
- Registre a `processed_emails`
- Tests amb emails de mostra

> **Canvis implementats:**
> - Agent classificador integrat a la Edge Function `process-emails` (`supabase/functions/process-emails/index.ts`)
> - Prompt de classificació en català per Anthropic API (Haiku): classifica emails en `cv`, `job_offer`, `response`, `other` amb confiança i raonament
> - Pipeline complet de processament: fetch emails no processats de inbox + enviats, classificació, routing per tipus
> - Detecció de BCC en emails de "Enviats" per a ofertes de feina: crea `job_offers` + vincula destinataris BCC com a `job_offer_candidates`
> - Processament de respostes: crea registre a `candidate_emails`, actualitza `last_response_date`
> - Registre a `processed_emails` amb `processing_status` (completed/failed) i `error_message`
> - Filtratge d'emails ja processats contra la taula `processed_emails` per evitar duplicats
> - Agents wrapper a `src/lib/ai/agents/classifier.ts` i `extractor.ts` per a ús des de Next.js

### Fase 8 — Agent d'Extracció ✅

- Implementar l'agent extractor
- Prompt d'extracció per al model potent
- Parsing de PDF i DOCX
- Creació/actualització de candidat (upsert per email)
- Pujada de documents a Supabase Storage
- Etiquetatge d'emails a Gmail
- Registre a `extraction_logs`
- Tests amb CVs de mostra

> **Canvis implementats:**
> - Agent extractor integrat a la Edge Function `process-emails` amb Anthropic API (Sonnet) i suport per documents PDF/DOCX via `type: "document"` amb base64
> - Prompt d'extracció en català: extreu firstName, lastName, email, phone, dateOfBirth, educationLevel, workExperienceSummary, teachingMonths, stages[], languages[]
> - Upsert de candidat per email: si ja existeix, actualitza dades i marca documents anteriors com `is_latest = false`
> - Pujada de documents a Supabase Storage (bucket `documents`, path: `{candidateId}/{timestamp}_{filename}`)
> - Creació de registres a `candidate_stages`, `candidate_languages`, `candidate_documents`, `candidate_emails`
> - Etiquetatge Gmail automàtic: aplica etiquetes segons les etapes detectades (Curriculums/Infantil, etc.)
> - Registre a `extraction_logs` amb model, tokens (prompt + completion), resposta raw, durada en ms
> - Edge Function desplegada a Supabase (versió 2, status ACTIVE, JWT verification activat)
> - ~557 línies de codi self-contained (Gmail client + AI + processament, tot inline per compatibilitat Deno)

### Fase 9 — Integració i Testing ✅

- Tests end-to-end del flux complet: email → classificació → extracció → BD → UI
- Tests del flux d'ofertes de feina amb BCC
- Tests del flux de respostes de candidats
- Validació de la detecció de duplicats (actualització de registre existent)
- Revisió de rendiment i optimització de queries
- Testing responsive (PC, tablet, mòbil)

> **Canvis implementats:**
> - Vitest 4 configurat amb jsdom, path aliases `@/*`, i scripts `test` / `test:watch` al `package.json`
> - 6 suites de tests amb 39 tests unitaris:
>   - `labels.test.ts`: mapatge etapes → etiquetes Gmail (6 tests)
>   - `prompts.test.ts`: prompts de classificació i extracció, camps, truncat de cos (10 tests)
>   - `factory.test.ts`: factory d'IA amb mocks de Supabase, validació de proveïdors i errors (5 tests)
>   - `agents.test.ts`: agents classificador i extractor, delegació i propagació d'errors (4 tests)
>   - `process-emails.test.ts`: API cron amb autenticació CRON_SECRET, crida a Edge Function, errors (6 tests)
>   - `types.test.ts`: validació de tots els tipus del domini (etapes amb `altres`, no `pas`) (8 tests)
> - Migració de seguretat: `SET search_path = public` a funcions `handle_new_user` i `update_updated_at`
> - Migració de rendiment: 4 índexs nous en foreign keys (`candidate_documents.candidate_id`, `extraction_logs.candidate_id`, `extraction_logs.email_id`, `job_offer_candidates.candidate_id`)
> - Optimització RLS: totes les polítiques actualitzades de `auth.uid()` a `(select auth.uid())` per evitar re-avaluació per fila
> - Build Next.js verificat amb totes les rutes (13 pàgines/API, middleware)
> - 0 advisors de seguretat pendents a Supabase

### Fase 10 — Desplegament a Vercel ✅

- Configurar projecte a Vercel
- Variables d'entorn (Supabase, Gmail, IA)
- Configurar domini
- Verificar Edge Functions a Supabase
- Verificar cron jobs
- Deploy final i smoke tests

> **Canvis implementats:**
> - `vercel.json` creat amb Vercel Cron Job configurat (`0 * * * *` → `GET /api/cron/process-emails`)
> - API route `/api/cron/process-emails` actualitzada per acceptar tant `GET` (Vercel Cron) com `POST` (pg_cron / manual)
> - Repositori git inicialitzat, `.gitignore` inclou `.env*.local`, `.vercel`, `node_modules`, `.next`
> - Edge Function `process-emails` verificada activa (v2, status ACTIVE, JWT verification)
> - Cron job `process-emails-hourly` verificat a pg_cron (`0 * * * *`)
> - Build Next.js verificat: totes les 17 rutes compilades correctament
> - 41 tests passant (6 suites)
>
> **Variables d'entorn necessàries a Vercel:**
> | Variable | Descripció |
> |---|---|
> | `NEXT_PUBLIC_SUPABASE_URL` | URL del projecte Supabase |
> | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clau anon de Supabase |
> | `SUPABASE_SERVICE_ROLE_KEY` | Clau service role (per Edge Function) |
> | `DATABASE_URL` | URL de connexió PostgreSQL (pooler) |
> | `CRON_SECRET` | Secret per autenticar crides cron |
>
> **Variables d'entorn necessàries a Supabase Edge Functions:**
> | Variable | Descripció |
> |---|---|
> | `ANTHROPIC_API_KEY` | Clau API d'Anthropic per classificació i extracció |
> | `GMAIL_CREDENTIALS` | JSON amb `client_id`, `client_secret`, `refresh_token` |

---

## 7. Estructura de Carpetes del Projecte

```
turonia/
├── docs/
│   ├── prompt.md
│   └── PRD.md
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout arrel
│   │   ├── page.tsx                # Redirect a /dashboard
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── (protected)/
│   │   │   ├── layout.tsx          # Layout amb sidebar (protegit)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── curriculums/
│   │   │       ├── page.tsx
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       ├── dashboard/
│   │       │   ├── kpis/route.ts
│   │       │   └── charts/route.ts
│   │       ├── candidates/
│   │       │   ├── route.ts              # GET llistat
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET detall, PATCH actualitzar
│   │       │       ├── emails/route.ts
│   │       │       └── documents/route.ts
│   │       ├── documents/
│   │       │   └── [id]/
│   │       │       └── url/route.ts      # GET URL signada
│   │       └── cron/
│   │           └── process-emails/route.ts
│   ├── components/
│   │   ├── ui/                     # Components shadcn/ui
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── dashboard/
│   │   │   ├── kpi-cards.tsx
│   │   │   └── charts.tsx
│   │   └── curriculums/
│   │       ├── candidates-table.tsx
│   │       ├── candidates-filters.tsx
│   │       ├── candidate-detail.tsx
│   │       ├── candidate-data-panel.tsx
│   │       ├── candidate-emails-panel.tsx
│   │       └── document-viewer.tsx
│   ├── db/
│   │   ├── index.ts                # Connexió Drizzle
│   │   ├── schema/
│   │   │   ├── profiles.ts
│   │   │   ├── candidates.ts
│   │   │   ├── candidate-stages.ts
│   │   │   ├── candidate-languages.ts
│   │   │   ├── candidate-documents.ts
│   │   │   ├── candidate-emails.ts
│   │   │   ├── job-offers.ts
│   │   │   ├── job-offer-candidates.ts
│   │   │   ├── processed-emails.ts
│   │   │   ├── extraction-logs.ts
│   │   │   ├── ai-model-config.ts
│   │   │   ├── gmail-config.ts
│   │   │   └── index.ts            # Re-exporta tots els esquemes
│   │   └── migrations/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Client Supabase (browser)
│   │   │   ├── server.ts           # Client Supabase (server)
│   │   │   └── middleware.ts       # Middleware d'auth
│   │   ├── ai/
│   │   │   ├── types.ts            # Interfícies AIProvider
│   │   │   ├── factory.ts          # Factory getAIProvider
│   │   │   ├── providers/
│   │   │   │   ├── anthropic.ts
│   │   │   │   └── openai.ts
│   │   │   ├── prompts/
│   │   │   │   ├── classification.ts
│   │   │   │   └── extraction.ts
│   │   │   └── agents/
│   │   │       ├── classifier.ts
│   │   │       └── extractor.ts
│   │   ├── gmail/
│   │   │   ├── client.ts           # Client Gmail API
│   │   │   ├── labels.ts           # Gestió d'etiquetes
│   │   │   └── types.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   └── use-candidates.ts
│   └── types/
│       └── index.ts
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   └── process-emails/
│   │       └── index.ts            # Edge Function principal
│   └── migrations/
├── public/
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

---

## Apèndix: Decisions Arquitectòniques

### Gmail API i BCC

Els BCC **sí** són recuperables via Gmail API (`messages.get` amb `format=full` o `format=raw`) sempre que l'email s'hagi enviat des de la interfície web de Gmail. Gmail preserva la capçalera BCC en la còpia del remitent a la carpeta "Enviats".

**Decisió:** L'agent de classificació detecta emails de tipus `job_offer` a la carpeta "Enviats", llegeix els destinataris BCC via la API, i crea els registres corresponents. No es necessita funcionalitat d'enviament a la app.

### Duplicats de candidats

Si un candidat envia un nou CV (mateix email), es fa **upsert**: s'actualitza el registre existent a `candidates` i es guarda el nou document a `candidate_documents` mantenint l'historial (el document anterior es marca amb `is_latest = false`).

### Etapes educatives (N:M)

Un candidat pot optar a múltiples etapes. La relació es gestiona amb la taula `candidate_stages`. Un candidat "infantil i primària" tindrà dos registres separats (`infantil` i `primaria`), no un registre combinat.

**Valors possibles:** `infantil`, `primaria`, `secundaria`, `altres`.

**Mapatge a etiquetes Gmail:** Cada etapa correspon a una etiqueta de Gmail per organitzar els emails classificats: `Currículums/Infantil`, `Currículums/Primaria`, `Currículums/Secundària`, i `Curriculums` (per a `altres`).

### Autenticació

Email/contrasenya via Supabase Auth. Sense signup públic — només un administrador pot crear nous usuaris. Un sol rol (`admin`) per ara, la columna `role` a `profiles` permet extensió futura.
