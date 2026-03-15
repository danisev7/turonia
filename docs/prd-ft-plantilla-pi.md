# PRD - Feature: Plantilla PI

## Context

Els professors de l'Escola el Turó utilitzen un Google Sheets complex amb macros per gestionar els Plans Individualitzats (PI) dels alumnes amb necessitats educatives especials. Aquest procés és manual, propens a errors, i difícil de mantenir.

**Objectiu**: Digitalitzar la Plantilla PI dins Turonia com una nova pestanya al detall de l'alumne, amb tota la lògica dinàmica (dropdowns en cascada, pestanyes per matèria) gestionada des de la base de dades per a que un administrador pugui mantenir les opcions.

**Condició d'activació**: La pestanya "Plantilla PI" apareix quan `mesura_nese` comença per "pi" (valors: `pi`, `pi_curricular`, `pi_no_curricular`, `pi_nouvingut`).

---

## Estructura de la Plantilla PI

### Sub-pestanyes fixes (6)

#### 1_DADES - Dades personals i escolars
- **Dades de l'alumne en lectura** (de `clickedu_students` + `student_nese_data`): Nom, Curs, Data incorporació, Escolarització prèvia, Repeticions, Data arribada Catalunya
- **Mesures prèvies rebudes**: 3 checkboxes (Universal, Addicional, Intensiu)
- **Matèries amb PI** (taula dinàmica, genera sub-pestanyes MAT_):
  - Matèria (select de `pi_config_materies`)
  - Docent (select de `pi_config_docents`, sincronitzats des de Clickedu)
  - Nivell actual de competència (select de nivells: 1PRI-4ESO)
  - Observacions (text)
- **Professionals que intervenen** (taula dinàmica):
  - Professional (select de `pi_config_professionals`)
  - Nom (text), Contacte (text), Notes (text)

#### 2_JUSTIFICACIO - Justificació del PI
- **Motius** (7 checkboxes):
  - NEE, DEA (dislèxia, discalcúlia...), Trastorns neurodesenvolupament (TDAH, TEA, TEL/TDL...), Alumnat nouvingut, Altes capacitats, Situació personal/social, Altres
- **Model PI** (select): TEL/TDL, TEA, Dislèxia, TDAH, Nouvingut, NEE, Altes capacitats, Altres
  - Seleccionar model pre-omple orientacions (3_ORIENTACIONS), però es poden editar manualment
- **Justificació** (textarea lliure)

#### 3_ORIENTACIONS - Orientacions generals per a totes les matèries
- Llista de files amb:
  - **Tipus** (select): Universal / Addicional / Intensiu
  - **Orientació** (select filtrat per tipus des de `pi_config_model_mesures`)
- Pre-omplert per model seleccionat a 2_JUSTIFICACIO
- Es poden afegir/treure files manualment
- Camp "Altres orientacions" (textarea)

#### 4_COMP_TRANSVERSALS - Competències transversals
- Graella amb fins a 20 files, cada una amb:
  - **Nivell** (select: 1PRI-4ESO) → determina PRI/ESO i grup
  - **Àrea transversal** (select): Ciutadana, Digital, Emprenedora, Personal/social/aprendre
  - **Competència específica** (select): filtrat per àrea + nivell (cascada)
  - **Criteris d'avaluació** (multi-select): filtrat per àrea + competència + grup (cascada)
  - **Sabers** (multi-select): només per Digital, filtrat per nivell (cascada)
  - **Avaluació** (select): 1-NA, 2-AS, 3-AN, 4-AE

#### 5_HORARI - Horari i suports
- Graella setmanal: 8 franges (8-9, 9-10, 10-10:30, 10:30-12, 12-13, 13-14, 15-16, 16-17) × 5 dies (Dl-Dv)
- Cada cel·la: text lliure

#### 6_SEGUIMENT - Conformitat, seguiment i continuïtat
- **Conformitat** (taula): Data, Nom, Rol (Tutor/a, Família, Orientació, Direcció), Signatura
- **Reunions de seguiment** (taula dinàmica): Data, Assistents, Acords, Proper pas
- **Continuïtat del PI** (taula dinàmica): Data, Decisió (Continuïtat/Revisió/Finalització), Motiu breu, Responsable

### Sub-pestanyes dinàmiques (una per matèria amb PI)

#### MAT_[NomMatèria] - PI per matèria
- **Mesures i suports** (taula, fins a 13 files):
  - Tipus (select): Universal / Addicional / Intensiu
  - Mesura (multi-select filtrat per tipus des de `pi_config_model_mesures`)
  - Observacions (text)
- **Graella curricular** (fins a 16 files):
  - **Nivell** (select: 1PRI-4ESO)
  - **Competència específica** (select): filtrat per matèria + nivell (cascada des de `pi_config_curriculum_*`)
  - **Criteris d'avaluació prioritzats** (multi-select): filtrat per matèria + nivell + competència (cascada)
  - **Sabers prioritzats** (multi-select): filtrat per matèria + nivell (cascada)
  - **Instruments d'avaluació** (multi-select): de `pi_config_instruments`
  - **Avaluació** (select): 1-NA, 2-AS, 3-AN, 4-AE

---

## Mapa de Dependències Dinàmiques (Cascading Dropdowns)

```
1_DADES
  Matèria (select) ──────────────────→ Crea sub-pestanya MAT_[matèria]
  Nivell actual competència (select) ─→ Es replica a MAT_[matèria] graella

2_JUSTIFICACIO
  Model PI (select) ─────────────────→ Pre-omple 3_ORIENTACIONS amb mesures del model

3_ORIENTACIONS
  Tipus (select) ────────────────────→ Filtra opcions d'Orientació (de pi_config_model_mesures)

4_COMP_TRANSVERSALS
  Nivell (select) ───→ Determina PRI/ESO + grup (1-2ESO, 3-4ESO, 1-2PRI, etc.)
                   ├─→ Filtra Competència específica (àrea + grup)
  Àrea (select) ───┘
  Competència específica (select) ──→ Filtra Criteris d'avaluació (multi-select)
  Àrea = "Digital" ────────────────→ Habilita Sabers (multi-select per nivell)

MAT_* Mesures
  Tipus (select) ──────────────────→ Filtra Mesura (multi-select de pi_config_model_mesures)

MAT_* Graella Curricular
  Nivell (select) ───→ Determina PRI/ESO
                   ├─→ Filtra Competència específica (matèria + nivell)
  [matèria fixa] ──┘
  Competència específica (select) ──→ Filtra Criteris (multi-select, amb text complet)
  [matèria + nivell] ──────────────→ Filtra Sabers (multi-select, amb text complet)
  Instruments ─────────────────────→ Multi-select de pi_config_instruments (sense cascada)
```

---

## Disseny de Base de Dades

### Taules de Configuració (11 taules - reemplacen pestanyes ocultes del Sheets)

#### `pi_config_materies` (← _LLISTES col A)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| name | text NOT NULL UNIQUE | "Matemàtiques", "Biologia i Geologia"... |
| sort_order | integer DEFAULT 0 | |
| is_active | boolean DEFAULT true | Soft delete |

#### `pi_config_professionals` (← _LLISTES col B)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| name | text NOT NULL UNIQUE | "Tutor/a", "Psicopedagog/a"... |
| sort_order | integer DEFAULT 0 | |
| is_active | boolean DEFAULT true | |

#### `pi_config_models` (← _LLISTES col C)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| name | text NOT NULL UNIQUE | "TEA", "TDAH", "Dislèxia"... |
| sort_order | integer DEFAULT 0 | |
| is_active | boolean DEFAULT true | |

#### `pi_config_docents` (← _LLISTES col F + sync Clickedu)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| name | text NOT NULL | Nom del docent |
| school_year_id | uuid FK → clickedu_years | Per curs escolar |
| is_active | boolean DEFAULT true | |
| UNIQUE | (name, school_year_id) | |

#### `pi_config_instruments` (← _LLISTES col J)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| name | text NOT NULL UNIQUE | "Observació", "Prova oral"... |
| sort_order | integer DEFAULT 0 | |
| is_active | boolean DEFAULT true | |

#### `pi_config_nivells_avaluacio` (← _LLISTES col G)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| code | text NOT NULL UNIQUE | "1", "2", "3", "4" |
| label | text NOT NULL | "1 - NA", "2 - AS", "3 - AN", "4 - AE" |
| sort_order | integer DEFAULT 0 | |

#### `pi_config_model_mesures` (← _MODELS sheet, ~200+ files)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| model | text NOT NULL | "TEA", "TDAH"... |
| tipus | text NOT NULL | "Universal" / "Addicional" / "Intensiu" |
| mesura | text NOT NULL | Text de la mesura/orientació |
| sort_order | integer DEFAULT 0 | |
| is_active | boolean DEFAULT true | |
| UNIQUE | (model, tipus, mesura) | |

#### `pi_config_curriculum` (← _MAPA_CURRICULUM + _MAPA_CURRICULUM_PRI, ~800+ files)
Taula unificada PRI+ESO amb camp `stage`.
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| stage | text NOT NULL | "ESO" o "PRI" |
| subject | text NOT NULL | "Matemàtiques"... |
| level | text NOT NULL | "1ESO", "6PRI"... |
| entry_type | text NOT NULL | "COMP_ESPEC" / "CRIT" / "SABER" |
| code | text NOT NULL | "CE1", "CA1.1", "S1"... |
| full_text | text NOT NULL | Descripció completa |
| short_text | text | Descripció curta |
| parent_code | text | Per CRIT: codi del COMP_ESPEC pare |
| sort_order | integer DEFAULT 0 | |
| UNIQUE | (stage, subject, level, entry_type, code) | |

#### `pi_config_transversals` (← _MAPA_TRANSVERSALS + _MAPA_TRANSVERSALS_PRI)
Taula unificada PRI+ESO.
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| stage | text NOT NULL | "ESO" o "PRI" |
| area | text NOT NULL | "Ciutadana", "Digital"... |
| group_name | text NOT NULL | "1-2ESO", "3-4PRI"... |
| espec_short | text NOT NULL | Competència específica (curt) |
| espec_full | text NOT NULL | Competència específica (complet) |
| crit_short | text | Criteri (curt) |
| crit_full | text | Criteri (complet) |
| sort_order | integer DEFAULT 0 | |

#### `pi_config_sabers_dig` (← _SABERS_DIG)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| stage | text NOT NULL | "ESO" o "PRI" |
| group_name | text | "1-2PRI"... (per PRI) |
| full_text | text NOT NULL | |
| short_text | text NOT NULL | |
| sort_order | integer DEFAULT 0 | |

### Taules de Dades PI (9 taules - per alumne per curs)

#### `pi_documents` - Document PI principal
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| student_id | uuid FK → clickedu_students | |
| school_year_id | uuid FK → clickedu_years | |
| model | text | Model seleccionat (TEA, TDAH...) |
| prev_universal | boolean DEFAULT false | Mesura prèvia universal |
| prev_addicional | boolean DEFAULT false | Mesura prèvia addicional |
| prev_intensiu | boolean DEFAULT false | Mesura prèvia intensiva |
| just_nee | boolean DEFAULT false | |
| just_dea | boolean DEFAULT false | |
| just_tea | boolean DEFAULT false | |
| just_nouvingut | boolean DEFAULT false | |
| just_altes_cap | boolean DEFAULT false | |
| just_social | boolean DEFAULT false | |
| just_altres | boolean DEFAULT false | |
| just_text | text | Justificació lliure |
| altres_orientacions | text | Orientacions lliures |
| horari | jsonb | Graella setmanal |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |
| UNIQUE | (student_id, school_year_id) | |

#### `pi_dades_materies` - Matèries amb PI (genera pestanyes MAT_)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_document_id | uuid FK → pi_documents ON DELETE CASCADE | |
| materia | text NOT NULL | Nom matèria |
| docent | text | Nom docent |
| nivell | text | Nivell actual competència |
| observacions | text | |
| sort_order | integer DEFAULT 0 | |
| UNIQUE | (pi_document_id, materia) | |

#### `pi_dades_professionals` - Professionals que intervenen
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_document_id | uuid FK → pi_documents ON DELETE CASCADE | |
| professional | text NOT NULL | Rol/tipus |
| nom | text | |
| contacte | text | |
| notes | text | |
| sort_order | integer DEFAULT 0 | |

#### `pi_orientacions` - Orientacions seleccionades
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_document_id | uuid FK → pi_documents ON DELETE CASCADE | |
| tipus | text NOT NULL | Universal/Addicional/Intensiu |
| mesura | text NOT NULL | Text de la mesura |
| sort_order | integer DEFAULT 0 | |
| UNIQUE | (pi_document_id, tipus, mesura) | |

#### `pi_comp_transversals` - Files de competències transversals
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_document_id | uuid FK → pi_documents ON DELETE CASCADE | |
| nivell | text NOT NULL | |
| area | text NOT NULL | |
| especifica | text | Short text |
| criteris | jsonb | [{code, short, full}] |
| sabers | jsonb | [{code, short, full}] (només Digital) |
| avaluacio | text | "1"/"2"/"3"/"4" |
| sort_order | integer DEFAULT 0 | |

#### `pi_seguiment_signatures` - Signatures de conformitat
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_document_id | uuid FK → pi_documents ON DELETE CASCADE | |
| rol | text NOT NULL | Tutor/a, Família, Orientació, Direcció |
| nom | text | |
| data_signatura | date | |
| sort_order | integer DEFAULT 0 | |

#### `pi_seguiment_reunions` - Reunions de seguiment
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_document_id | uuid FK → pi_documents ON DELETE CASCADE | |
| data_reunio | date | |
| assistents | text | |
| acords | text | |
| proper_pas | text | |
| sort_order | integer DEFAULT 0 | |

#### `pi_seguiment_continuitat` - Decisions de continuïtat
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_document_id | uuid FK → pi_documents ON DELETE CASCADE | |
| data_decisio | date | |
| decisio | text | Continuïtat/Revisió/Finalització |
| motiu | text | |
| responsable | text | |
| sort_order | integer DEFAULT 0 | |

#### `pi_materia_mesures` - Mesures per matèria (bloc superior MAT_)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_materia_id | uuid FK → pi_dades_materies ON DELETE CASCADE | |
| tipus | text NOT NULL | Universal/Addicional/Intensiu |
| mesures | jsonb NOT NULL | ["mesura1", "mesura2"] (multi-select) |
| observacions | text | |
| sort_order | integer DEFAULT 0 | |

#### `pi_materia_curriculum` - Graella curricular per matèria (MAT_)
| Camp | Tipus | Notes |
|------|-------|-------|
| id | uuid PK | |
| pi_materia_id | uuid FK → pi_dades_materies ON DELETE CASCADE | |
| nivell | text NOT NULL | |
| competencia | text | Short text |
| criteris | jsonb | [{code, short, full}] (multi-select) |
| sabers | jsonb | [{code, short, full}] (multi-select) |
| instruments | jsonb | ["instr1", "instr2"] (multi-select) |
| avaluacio | text | "1"/"2"/"3"/"4" |
| sort_order | integer DEFAULT 0 | |

### Resum: 20 taules noves (11 config + 9 dades)

### RLS Policies
- **Config tables**: Lectura per tots els autenticats. Escriptura només admin/direccio.
- **Data tables**: Lectura per staff. Escriptura per admin/direccio/tutor.
- Patró existent: `profiles.auth_id = auth.uid()`

---

## Permisos

Afegir nova secció `alumnes_pi` a `src/lib/permissions.ts`:

| Rol | Lectura | Escriptura |
|-----|---------|------------|
| admin | ✅ | ✅ |
| direccio | ✅ | ✅ |
| tutor | ✅ | ✅ |
| poe | ✅ | ❌ |
| mesi | ✅ | ❌ |
| secretaria | ✅ | ❌ |
| professor | ✅ | ❌ |
| convidat | ❌ | ❌ |

---

## Arquitectura UI

### Integració amb la pàgina de detall
- Fitxer: `src/app/(protected)/alumnes/[id]/page.tsx`
- Nova 4a pestanya "Plantilla PI" (condicional si mesura_nese.startsWith("pi"))
- Component `StudentPiTab` amb forwardRef + useImperativeHandle (patró existent)
- Nou ref `piTabRef` integrat a `handleSaveAll()` i `handleCancelAll()`

### Jerarquia de components

```
src/components/alumnes/pi/
  student-pi-tab.tsx              ← Component principal amb sub-pestanyes
  sub-tabs/
    pi-dades.tsx                  ← 1_DADES
    pi-justificacio.tsx           ← 2_JUSTIFICACIO
    pi-orientacions.tsx           ← 3_ORIENTACIONS
    pi-comp-transversals.tsx      ← 4_COMP_TRANSVERSALS
    pi-horari.tsx                 ← 5_HORARI
    pi-seguiment.tsx              ← 6_SEGUIMENT
    pi-materia.tsx                ← MAT_[matèria] (reutilitzat per cada matèria)
  shared/
    cascading-select.tsx          ← Select amb opcions filtrades per valor pare
    multi-select-toggle.tsx       ← Multi-selecció amb format bullet + tooltip text complet
    dynamic-table.tsx             ← Taula amb afegir/treure files
    weekly-grid.tsx               ← Graella horària setmanal
    avaluacio-selector.tsx        ← Selector 1-4 (NA/AS/AN/AE)
```

### Càrrega lazy
- Les dades PI + config es carreguen quan l'usuari obre la pestanya PI (no a la càrrega inicial)
- `GET /api/pi/config` → retorna tota la config (matèries, currículum, transversals...) ~1000 files
- `GET /api/students/[id]/pi` → retorna dades PI de l'alumne per al curs actual
- Config cached en React state (no canvia durant la sessió)

### Cascading dropdowns (client-side)
- Tota la config es carrega una vegada
- El filtratge es fa amb `useMemo` al client
- Hook personalitzat `useCascadingOptions(config, subject, nivell)`

### Multi-select amb text complet
- L'usuari veu el text curt als badges
- Tooltip o panel expandible mostra el text complet
- Toggle: clicar un badge l'afegeix/treu de la selecció

---

## Disseny API

### Endpoints de configuració
| Mètode | Ruta | Descripció |
|--------|------|------------|
| GET | `/api/pi/config` | Retorna TOTA la config (per UI cascading) |
| GET | `/api/pi/config/[table]` | Config d'una taula (per admin) |
| POST | `/api/pi/config/[table]` | Crea entrada config (admin/direccio) |
| PATCH | `/api/pi/config/[table]/[id]` | Actualitza entrada config |
| DELETE | `/api/pi/config/[table]/[id]` | Soft delete (is_active=false) |
| POST | `/api/pi/config/[table]/bulk-import` | Import CSV (currículum) |

### Endpoints de dades PI
| Mètode | Ruta | Descripció |
|--------|------|------------|
| GET | `/api/students/[id]/pi?yearId=x` | Retorna document PI complet + fills |
| PATCH | `/api/students/[id]/pi` | Upsert document PI + fills |
| POST | `/api/students/[id]/pi/copy-year` | Còpia PI al nou curs |

### Endpoint d'exportació
| Mètode | Ruta | Descripció |
|--------|------|------------|
| GET | `/api/students/[id]/pi/export-pdf` | Genera PDF del PI |

---

## Pàgines d'administració

```
src/app/(protected)/configuracio/pi/
  page.tsx                     ← Navegació general
  materies/page.tsx            ← CRUD matèries
  professionals/page.tsx       ← CRUD professionals
  models/page.tsx              ← CRUD models PI
  instruments/page.tsx         ← CRUD instruments avaluació
  model-mesures/page.tsx       ← CRUD model→tipus→mesura
  curriculum/page.tsx          ← Vista + import CSV currículum
  transversals/page.tsx        ← Vista + import CSV transversals
```

Accessibles només per admin/direccio. Patró: taula amb edició inline, afegir/treure files, reordenar.

---

## Sync Docents (Clickedu)

- Nou script/Edge Function `sync-clickedu-docents`
- Cron diari (com sync-clickedu-students)
- Obté llistat de professors actius del curs actual via API Clickedu
- Upsert a `pi_config_docents` amb `school_year_id` del curs actual

---

## Còpia Cross-Year

Quan es copia un curs:
1. ✅ Copiar `pi_documents` (reset horari, mantenir model/justificació)
2. ✅ Copiar `pi_dades_materies` (matèries es mantenen, docent pot canviar)
3. ✅ Copiar `pi_orientacions` (mantenir seleccions)
4. ✅ Copiar `pi_comp_transversals` (mantenir, reset avaluació)
5. ❌ NO copiar `pi_seguiment_*` (nou curs = noves signatures/reunions)
6. ✅ Copiar `pi_materia_mesures` (mantenir)
7. ✅ Copiar `pi_materia_curriculum` (mantenir, reset avaluació)

---

## Fases d'Implementació

### Fase 1: Fonaments DB - Taules de configuració
**Objectiu**: Crear les 11 taules de config, seed amb dades del Sheets, API de lectura.

**Passos**:
1. Crear schemas Drizzle: `src/db/schema/pi-config-materies.ts`, `pi-config-professionals.ts`, `pi-config-models.ts`, `pi-config-docents.ts`, `pi-config-instruments.ts`, `pi-config-nivells.ts`, `pi-config-model-mesures.ts`, `pi-config-curriculum.ts`, `pi-config-transversals.ts`, `pi-config-sabers-dig.ts`
2. Exportar des de `src/db/schema/index.ts`
3. Migració Supabase (via `mcp__supabase__apply_migration`)
4. Polítiques RLS
5. Script de seed per importar dades del Google Sheets (CSV → insert)
6. Crear `GET /api/pi/config` endpoint
7. Verificar amb consulta SQL directa

**Fitxers a crear/modificar**:
- `src/db/schema/pi-config-*.ts` (10 fitxers nous)
- `src/db/schema/index.ts` (afegir exports)
- `src/app/api/pi/config/route.ts` (nou)

### Fase 2: Taules de dades PI + API bàsica
**Objectiu**: Les 9 taules de dades existeixen, API GET/PATCH funciona.

**Passos**:
1. Crear schemas: `pi-documents.ts`, `pi-dades-materies.ts`, `pi-dades-professionals.ts`, `pi-orientacions.ts`, `pi-comp-transversals.ts`, `pi-seguiment-signatures.ts`, `pi-seguiment-reunions.ts`, `pi-seguiment-continuitat.ts`, `pi-materia-mesures.ts`, `pi-materia-curriculum.ts`
2. Migració + RLS
3. `GET /api/students/[id]/pi` (retorna document + fills)
4. `PATCH /api/students/[id]/pi` (upsert + sync fills)
5. Afegir `alumnes_pi` a `src/lib/permissions.ts`

**Fitxers a crear/modificar**:
- `src/db/schema/pi-*.ts` (9 fitxers nous)
- `src/app/api/students/[id]/pi/route.ts` (nou)
- `src/lib/permissions.ts` (modificar)

### Fase 3: Shell UI - Pestanya PI + navegació sub-pestanyes
**Objectiu**: La pestanya PI apareix al detall de l'alumne, sub-pestanyes navegables.

**Passos**:
1. Crear `src/components/alumnes/pi/student-pi-tab.tsx` amb forwardRef
2. Integrar a `page.tsx` (condició mesura_nese, piTabRef, handleSaveAll)
3. Crear 6 sub-tab placeholders + estructura de carpetes
4. Implementar TabsList scrollable amb tabs fixos + dinàmics

**Fitxers a crear/modificar**:
- `src/components/alumnes/pi/student-pi-tab.tsx` (nou)
- `src/components/alumnes/pi/sub-tabs/pi-*.tsx` (7 fitxers nous, placeholder)
- `src/app/(protected)/alumnes/[id]/page.tsx` (modificar)

### Fase 4: Sub-pestanya 1_DADES + pestanyes dinàmiques MAT_
**Objectiu**: Entrada de matèries amb PI, professionals. Pestanyes MAT_ apareixen dinàmicament.

**Passos**:
1. Crear `DynamicTable` shared component
2. Implementar `PiDadesSubTab` complet
3. Connexió add/remove matèria → genera/treu sub-pestanya MAT_
4. Wire save/load

**Fitxers a crear/modificar**:
- `src/components/alumnes/pi/shared/dynamic-table.tsx` (nou)
- `src/components/alumnes/pi/sub-tabs/pi-dades.tsx` (implementar)

### Fase 5: Sub-pestanya 2_JUSTIFICACIO + Model PI
**Objectiu**: Checkboxes de motius, selecció de model, text lliure.

**Passos**:
1. Implementar `PiJustificacioSubTab`
2. Connexió model → pre-fill orientacions (estat compartit amb sub-tab 3)

### Fase 6: Sub-pestanya 3_ORIENTACIONS + cascading
**Objectiu**: Primer cascading dropdown funcional.

**Passos**:
1. Crear `CascadingSelect` shared component
2. Crear `MultiSelectToggle` shared component
3. Implementar `PiOrientacionsSubTab`
4. Implement pre-fill des de model seleccionat
5. Crear hook `usePiConfig()` per cachejar config

### Fase 7: Sub-pestanya 4_COMP_TRANSVERSALS
**Objectiu**: Graella de competències transversals amb cascading complet PRI/ESO.

**Passos**:
1. Crear `AvaluacioSelector` shared component
2. Implementar `PiCompTransversalsSubTab`
3. Lògica PRI vs ESO (grups, mapes diferents)
4. Cascading: Nivell → Àrea → Específica → Criteris + Sabers(Digital)

### Fase 8: Sub-pestanya 5_HORARI
**Objectiu**: Graella setmanal.

**Passos**:
1. Crear `WeeklyGrid` shared component
2. Implementar `PiHorariSubTab`

### Fase 9: Sub-pestanya 6_SEGUIMENT
**Objectiu**: Signatures, reunions, continuïtat.

**Passos**:
1. Implementar `PiSeguimentSubTab` (3 sub-seccions amb DynamicTable)

### Fase 10: Sub-pestanyes MAT_ (PI per matèria)
**Objectiu**: Funcionalitat completa per matèria amb cascading curricular.

**Passos**:
1. Implementar `PiMateriaSubTab`
2. Bloc mesures: Tipus → Mesura (multi-select filtrat)
3. Graella curricular: Nivell → Competència → Criteris → Sabers (cascading des de pi_config_curriculum)
4. Instruments multi-select
5. Reutilitzar components shared (CascadingSelect, MultiSelectToggle, AvaluacioSelector)

### Fase 11: Exportació PDF
**Objectiu**: Generar PDF de la Plantilla PI completa.

**Passos**:
1. Crear `GET /api/students/[id]/pi/export-pdf`
2. Generar PDF seguint estructura de les 6+N sub-pestanyes
3. Botó d'exportació a la UI

### Fase 12: Pàgines d'administració
**Objectiu**: Admin pot mantenir totes les taules de configuració.

**Passos**:
1. Crear ruta `/configuracio/pi/` amb sub-pàgines
2. CRUD simple per llistes (matèries, professionals, models, instruments)
3. CRUD model-mesures (amb filtre per model/tipus)
4. Vista + import CSV per currículum i transversals
5. API endpoints config CRUD

### Fase 13: Sync docents Clickedu + Còpia cross-year
**Objectiu**: Docents sincronitzats, PI copiable entre cursos.

**Passos**:
1. Edge Function `sync-clickedu-docents`
2. Cron diari a Vercel
3. Endpoint `POST /api/students/[id]/pi/copy-year`
4. Lògica de còpia selectiva (què es copia, què no)

### Fase 14: Polish + QA
**Objectiu**: Feature production-ready.

**Passos**:
1. Loading states, error handling, empty states
2. Responsive design
3. Performance (virtualització si cal per llistes grans)
4. Tests
5. Documentació usuari

---

## Fitxers Clau Existents a Reutilitzar

| Fitxer | Patró a reutilitzar |
|--------|---------------------|
| `src/app/(protected)/alumnes/[id]/page.tsx` | Estructura pestanyes, forwardRef, global save |
| `src/components/alumnes/student-nese-tab.tsx` | forwardRef + useImperativeHandle, FieldSelect, BooleanPicker, MultiSelectPicker |
| `src/db/schema/student-nese-data.ts` | Patró schema Drizzle (uuid PK, student_id + school_year_id unique) |
| `src/lib/permissions.ts` | canEditField(), ROLE_PERMISSIONS, section permissions |
| `src/app/api/students/[id]/route.ts` | Auth check, role validation, upsert amb onConflict |
| `src/app/api/students/[id]/export-pdf/route.ts` | Patró generació PDF |
| `src/types/index.ts` | TypeScript types per nous camps |

---

## Verificació

1. **DB**: Consultar taules via `mcp__supabase__execute_sql` per verificar schema i seed data
2. **API**: Testejar GET/PATCH amb curl o des de la UI
3. **UI**: Verificar cascading dropdowns amb dades reals del currículum
4. **Permisos**: Login amb diferents rols i verificar lectura/escriptura
5. **PDF**: Exportar PI i verificar que inclou totes les seccions
6. **Cross-year**: Copiar PI i verificar dades al nou curs
7. **Admin**: Modificar config i verificar que UI reflecteix els canvis
