# PRD: Feature Alumnes (ft_alumnes)

## Context

L'Escola El Turó gestiona dades d'alumnes mitjançant Google Sheets: un "Traspàs de Tutories" (per a tots els alumnes) i una "Graella NESE" (per alumnes amb necessitats especials). Aquesta feature trasllada tota aquesta funcionalitat a l'aplicació Turonia, connectant-la amb els alumnes ja sincronitzats des de Clickedu (302 alumnes, taula `clickedu_students`).

**Objectiu**: Substituir els excels per una interfície web completa amb llistat, filtratge, fitxa detall, control de permisos per rol, historial per curs escolar i exportació.

---

## 1. Esquema de Base de Dades

### 1.1 Nova taula: `clickedu_years`
Configuració de cursos escolars.

| Columna | Tipus | Nullable | Notes |
|---------|-------|----------|-------|
| id | uuid PK | no | gen_random_uuid() |
| name | text UNIQUE | no | Ex: "2024-25", "2025-26" |
| start_date | date | no | Ex: 2025-09-01 |
| end_date | date | no | Ex: 2026-06-30 |
| is_current | boolean | no | Default false. Un sol registre a true |
| clickedu_curs_id | integer | sí | ID del curs a Clickedu (ex: 35) |
| created_at | timestamptz | no | Default now() |

**RLS**: Lectura per a tots els autenticats. Escriptura només admin/direccio.

### 1.2 Nova taula: `student_yearly_data`
Dades del "Traspàs de Tutories" per alumne i curs escolar. Idèntica estructura per a les 3 etapes.

| Columna | Tipus | Nullable | Notes |
|---------|-------|----------|-------|
| id | uuid PK | no | gen_random_uuid() |
| student_id | uuid FK→clickedu_students | no | |
| school_year_id | uuid FK→clickedu_years | no | |
| graella_nese | boolean | no | Default false |
| curs_repeticio | text | sí | Ex: "1r ESO", "I3", "2n P" |
| dades_familiars | text | sí | Dades familiars rellevants |
| academic | text | sí | Observacions acadèmiques |
| comportament | text | sí | Comportament / convivència |
| acords_tutoria | text | sí | Acords des de tutoria |
| estat | text | sí | Enum: "resolt", "pendent" |
| observacions | text | sí | Observacions generals |
| created_at | timestamptz | no | Default now() |
| updated_at | timestamptz | no | Default now() |

**Constraint UNIQUE**: (student_id, school_year_id)
**Índexs**: school_year_id, estat

### 1.3 Nova taula: `student_nese_data`
Dades de la "Graella NESE" per alumne i curs escolar. Inclou tots els camps de les 3 etapes, mostrant/ocultant segons l'etapa.

| Columna | Tipus | Nullable | Notes |
|---------|-------|----------|-------|
| id | uuid PK | no | gen_random_uuid() |
| student_id | uuid FK→clickedu_students | no | |
| school_year_id | uuid FK→clickedu_years | no | |
| data_incorporacio | date | sí | Data d'incorporació al centre |
| escolaritzacio_previa | text | sí | **Només Infantil** |
| reunio_poe | boolean | no | Default false |
| reunio_mesi | boolean | sí | **Infantil + Primària** (null per ESO) |
| reunio_eap | boolean | no | Default false |
| informe_eap | text | sí | Enum: "sense_informe", "nese_annex1", "nee_annex1i2" |
| cad | text | sí | % i data venciment, text lliure |
| informe_diagnostic | text | sí | Data i nom centre, text lliure |
| curs_retencio | text | sí | Ex: "No", "I5", "1r", "2n P" |
| nise | text | sí | Enum: "nise", "sls", "no" |
| ssd | boolean | no | Default false |
| mesura_nese | text | sí | Enum: "pi", "pi_curricular", "pi_no_curricular", "pi_nouvingut", "dua_misu", "no_mesures" |
| materies_pi | text | sí | **Primària + ESO**: llista de matèries separades per comes |
| eixos_pi | text | sí | **Només Infantil**: eixos on s'aplica PI |
| nac_pi | text | sí | **Primària + ESO**: NAC PI i nova incorpo. |
| nac_final | text | sí | **Només ESO**: NAC final de curs |
| serveis_externs | text | sí | Centre, responsable i contacte |
| beca_mec | text | sí | Enum: "sollicitada_curs_actual", "candidat_proper_curs", "no_candidat_mec" |
| observacions_curs | text | sí | Observacions del curs actual |
| dades_rellevants_historic | text | sí | Dades rellevants acumulades |
| created_at | timestamptz | no | Default now() |
| updated_at | timestamptz | no | Default now() |

**Constraint UNIQUE**: (student_id, school_year_id)

### 1.4 Modificació: `clickedu_students`
Afegir camp `etapa` derivat de `class_id` per facilitar filtres.

| Columna | Tipus | Notes |
|---------|-------|-------|
| etapa | text | Calculat: "infantil" (105-107), "primaria" (108-113), "eso" (114-117) |

**Nota**: Alternativament es pot derivar al vol des de `class_id`, sense afegir columna.

### 1.5 Creació schema Drizzle per `clickedu_students`
Crear `src/db/schema/clickedu-students.ts` ja que la taula existeix a Supabase però no té schema Drizzle.

---

## 2. Sistema de Rols i Permisos

### 2.1 Rols disponibles (8 rols)
| Rol | Alumnes - Traspàs | Alumnes - NESE | Curriculums |
|-----|-------------------|----------------|-------------|
| admin | Lectura + Escriptura total | Lectura + Escriptura total | Lectura + Escriptura |
| direccio | Lectura + Escriptura total | Lectura + Escriptura total | Lectura + Escriptura |
| tutor | Lectura + Escriptura total | Lectura total + Escriptura camps TUTOR | No visible |
| poe | Lectura | Lectura total + Escriptura camps POE/MESI | No visible |
| mesi | Lectura | Lectura total + Escriptura camps POE/MESI | No visible |
| secretaria | Lectura | Lectura total + Escriptura camps SECRETARIA | No visible |
| professor | Lectura | Lectura | No visible |
| convidat | No visible | No visible | No visible |

### 2.2 Camps NESE per rol (basat en colors de l'Excel)

**Camps TUTOR (blau `#3C78D8`)** — editables per tutor, admin, direccio:
- `cad` (CAD % i data venciment)
- `informe_diagnostic`
- `curs_retencio`
- `materies_pi` / `eixos_pi`
- `nac_pi`, `nac_final`
- `serveis_externs`
- `observacions_curs`
- `dades_rellevants_historic`

**Camps POE/MESI (groc `#FFF2CC`)** — editables per poe, mesi, admin, direccio:
- `reunio_poe`, `reunio_mesi`, `reunio_eap`
- `informe_eap`
- `nise`
- `mesura_nese`
- `beca_mec`

**Camps SECRETARIA (rosa `#F4CCCC`)** — editables per secretaria, admin, direccio:
- `data_incorporacio`
- `escolaritzacio_previa`
- `ssd`

### 2.3 Implementació
- **Fitxer de configuració de permisos**: `src/lib/permissions.ts`
  - Exporta mapa de rols → seccions → accions (read/write)
  - Funcions helper: `canView(role, section)`, `canEdit(role, section)`, `canEditField(role, fieldName)`
  - Mapa de camps NESE → rol responsable (TUTOR_FIELDS, POE_MESI_FIELDS, SECRETARIA_FIELDS)
  - admin i direccio poden editar tots els camps
- **Sidebar**: Filtrar opcions de menú segons `canView(role, 'alumnes')` i `canView(role, 'curriculums')`
- **API routes**: Verificar permisos al principi de cada handler (GET → canView, PATCH → verificar que cada camp enviat és editable pel rol)
- **Components**: Camps individuals com readonly/editable segons `canEditField(role, field)`
- **RLS**: Afegir polítiques basades en el rol del perfil per a les noves taules

### 2.4 Obtenció del rol
El perfil amb el rol ja existeix a la taula `profiles`. Cal:
1. Carregar el perfil de l'usuari autenticat en el layout protegit
2. Passar el rol via context (React Context o prop drilling)
3. Consultar `profiles.role` a les API routes

---

## 3. Llistat d'Alumnes (`/alumnes`)

### 3.1 Ruta
- `src/app/(protected)/alumnes/page.tsx` — Llistat (client component)
- `src/app/api/students/route.ts` — API GET amb filtres

### 3.2 Filtres (persistits a URL, patró idèntic a `/curriculums`)
| Filtre | Tipus | Valors |
|--------|-------|--------|
| search | text input | Cerca per nom |
| etapa | toggle group | infantil, primaria, eso |
| classe | select/toggle | Classes dinàmiques segons etapa |
| graella_nese | toggle | Sí / No |
| mesura_nese | toggle group | PI, DUA/MISU, No mesures |
| estat | toggle | Resolt, Pendent |
| informe_eap | toggle group | Sense informe, NESE, NEE |

### 3.3 Columnes de la taula
| Columna | Sortable | Color | Notes |
|---------|----------|-------|-------|
| Nom (last_name, first_name) | Sí | — | Link a detall |
| Classe | Sí | — | class_name de clickedu_students |
| Graella NESE | Sí | — | Checkbox/badge |
| Curs repetició | Sí | — | Text o buit |
| Mesura NESE | Sí | Sí* | Badge amb color segons valor |
| Estat | Sí | Sí* | Badge: Resolt (verd), Pendent (taronja) |
| Acadèmic | Sí | — | Truncat |
| Observacions | Sí | — | Truncat |

*Colors MESURA NESE (del Excel):
- PI / PI curricular / PI no curricular / PI nouvingut → Badge vermell/rosa
- DUA / MISU → Badge taronja/groc
- No mesures / Sense mesures → Badge verd

### 3.4 Comportament
- Mostra per defecte el curs escolar vigent (`is_current = true`)
- Selector de curs escolar a la capçalera (si hi ha múltiples anys carregats)
- Paginació, ordenació per columnes (patró idèntic a `/curriculums`)
- Files clickables amb navegació a `/alumnes/[id]`
- **Botó "Exportar a Excel"**: Exporta la selecció filtrada actual

### 3.5 Fitxers
- `src/app/(protected)/alumnes/page.tsx`
- `src/components/alumnes/students-table.tsx`
- `src/components/alumnes/students-filters.tsx`
- `src/app/api/students/route.ts`

---

## 4. Fitxa Detall Alumne (`/alumnes/[id]`)

### 4.1 Ruta
- `src/app/(protected)/alumnes/[id]/page.tsx`
- `src/app/api/students/[id]/route.ts` — GET + PATCH

### 4.2 Layout
Disseny amb toggle de visualització: pestanyes (tabs) o seccions (scroll continu). Un botó a la capçalera permet canviar entre els dos modes. La preferència es guarda al localStorage.

**Capçalera**:
- Botó tornar
- Nom complet de l'alumne + classe
- Selector de curs escolar (canviar entre anys)
- Botó "Exportar PDF" (genera PDF amb logo Escola El Turó)
- Indicador mode lectura/escriptura

**Pestanyes/Seccions**:

#### Tab 1: Dades Bàsiques (Traspàs de Tutories)
- Dades identificatives (nom, classe, clickedu_id) — sempre lectura
- Graella NESE (checkbox)
- Curs repetició
- Dades familiars rellevants (textarea)
- Acadèmic (textarea)
- Comportament / Convivència (textarea)
- Acords des de tutoria (textarea)
- Estat (select: Resolt/Pendent) — amb badge de color
- Observacions (textarea)

#### Tab 2: NESE (visible només si `graella_nese = true`)
Camps adaptats segons l'etapa de l'alumne:

**Secció Administrativa:**
- Data incorporació al centre
- Escolarització prèvia (només Infantil)
- Reunió amb POE (checkbox)
- Reunió amb MESI (checkbox, només Infantil/Primària)
- Reunió amb EAP (checkbox)
- Informe EAP (select)
- SSD (checkbox)

**Secció Diagnòstic:**
- CAD (% i data venciment)
- Informe diagnòstic
- Curs retenció
- NISE (select)

**Secció Mesures:**
- Mesura NESE (select amb color)
- Matèries o àmbits (multi-select, Primària/ESO)
- Eixos on s'aplica PI (text, Infantil)
- NAC PI i nova incorporació (text, Primària/ESO)
- NAC final de curs (text, ESO)

**Secció Seguiment:**
- Serveis externs actuals (textarea)
- Beca MEC (select)
- Observacions curs actual (textarea)
- Dades rellevants històric (textarea)

#### Tab 3: PI (futur, placeholder)
- Pendent de definir. Visible només si `mesura_nese` conté PI.
- Marcat com a "Pròximament" a la UI.

#### Tab 4: Evolució (visible si hi ha dades de >1 curs)
- Gràfiques amb Recharts mostrant evolució de camps clau entre cursos
- Taula comparativa de mesures NESE per curs
- Consulta de dades de cursos anteriors (mode lectura)

### 4.3 Edició
- Botons d'editar/guardar visibles només si `canEdit(role, 'alumnes')`
- Mode visualització per defecte, botó per entrar en mode edició
- PATCH a `/api/students/[id]` amb validació de permisos

### 4.4 Fitxers
- `src/app/(protected)/alumnes/[id]/page.tsx`
- `src/components/alumnes/student-basic-tab.tsx`
- `src/components/alumnes/student-nese-tab.tsx`
- `src/components/alumnes/student-evolution-tab.tsx`
- `src/app/api/students/[id]/route.ts`

---

## 5. Exportació

### 5.1 Exportar llistat a Excel
- Llibreria: `exceljs` o `xlsx`
- Endpoint: `POST /api/students/export` (rep filtres, retorna .xlsx)
- Inclou totes les columnes visibles amb colors
- Nom fitxer: `alumnes_{curs}_{data}.xlsx`

### 5.2 Exportar fitxa a PDF
- Llibreria: `@react-pdf/renderer` o `jspdf`
- Endpoint o generació client-side
- Inclou logo Escola El Turó a dalt a l'esquerra
- Format: totes les seccions visibles de la fitxa
- Nom fitxer: `{cognom}_{nom}_{curs}.pdf`

---

## 6. Còpia de Curs Escolar

### 6.1 Funcionalitat
- Botó accessible des del llistat, només per admin/direccio
- Seleccionar curs origen i curs destí
- Procés:
  1. Crear registres `student_yearly_data` nous copiant tots els camps del curs origen
  2. Crear registres `student_nese_data` nous copiant tots els camps EXCEPTE `observacions_curs` (neix buit)
  3. Sincronitzar amb `clickedu_students` actius (alumnes nous no tindran dades)
  4. Mostrar resum: X alumnes copiats, Y alumnes nous sense dades

### 6.2 Endpoint
- `POST /api/students/copy-year` — cos: { from_year_id, to_year_id }
- Verificar permisos admin/direccio
- Transacció SQL per atomicitat

---

## 7. Script d'Importació d'Excel

### 7.1 Objectiu
Script reutilitzable per importar dades dels Excel al DB. No forma part de la UI de l'app.

### 7.2 Ubicació
- `scripts/import-students-excel.ts` (executable amb `tsx`)

### 7.3 Comportament
- Paràmetres: ruta fitxer(s) Excel, curs escolar, tipus (traspass/nese), etapa
- Parseja Excel amb `exceljs`
- Match alumnes per nom amb `clickedu_students` (fuzzy matching nom+cognom)
- Upsert a `student_yearly_data` i/o `student_nese_data`
- Preparat per columnes variables entre anys (mapeja caps de columna, no posicions fixes)

### 7.4 Gestió d'alumnes no identificats
Pot ser que alguns alumnes tinguin el nom o cognom mal escrit a l'Excel i no es trobin a la DB. En aquests casos:
- El script NO descarta l'alumne, sinó que el registra en un fitxer de log (ex: `scripts/output/unmatched_{timestamp}.csv`)
- El log inclou: nom tal com apareix a l'Excel, full/pestanya d'origen, totes les dades de la fila
- Després de la importació, cal revisar manualment el log i identificar a quin registre de `clickedu_students` correspon cada alumne no trobat
- Un cop identificat, es pot tornar a executar l'script o inserir les dades manualment

---

## 8. Navegació i Menú

### 8.1 Sidebar actualitzat
```
- Tauler de Control     [tots excepte convidat]
- Gestió de Currículums  [admin, direccio]
- Alumnes                [admin, direccio, tutor, poe, mesi, secretaria, professor]
```

### 8.2 Fitxers a modificar
- `src/components/layout/sidebar.tsx` — afegir entrada + filtrar per rol
- `src/components/layout/mobile-nav.tsx` — idem
- `src/app/(protected)/layout.tsx` — carregar perfil/rol de l'usuari

---

## 9. Fases d'Implementació

### Fase 1: Infraestructura (DB + permisos) ✅ COMPLETADA
1. ✅ Crear schema Drizzle per `clickedu_students` → `src/db/schema/clickedu-students.ts`
2. ✅ Migracions: `clickedu_years`, `student_yearly_data`, `student_nese_data` → aplicades a Supabase
3. ✅ RLS policies per a les noves taules (select per rols amb accés, insert/update segons permisos)
4. ✅ Crear `src/lib/permissions.ts` (canView, canEdit, canEditField, getNavItems, getEtapaFromClassId)
5. ✅ Actualitzar sidebar + mobile-nav amb filtratge per rol (userRole prop des del layout)
6. ✅ Inserir registre `clickedu_years` per al curs 2024-25 (is_current=true, clickedu_curs_id=35)

**Fitxers creats/modificats:**
- `src/db/schema/clickedu-students.ts` (nou)
- `src/db/schema/clickedu-years.ts` (nou)
- `src/db/schema/student-yearly-data.ts` (nou)
- `src/db/schema/student-nese-data.ts` (nou)
- `src/db/schema/index.ts` (actualitzat exports)
- `src/types/index.ts` (nous tipus: UserRole, StudentEtapa, etc.)
- `src/lib/permissions.ts` (nou)
- `src/components/layout/sidebar.tsx` (userRole + nav dinàmica)
- `src/components/layout/mobile-nav.tsx` (userRole + nav dinàmica)
- `src/app/(protected)/layout.tsx` (càrrega rol des de profiles)

### Fase 2: Script importació + dades inicials ✅ COMPLETADA
7. ✅ Crear script `scripts/import-students-excel.ts` (amb parsing de Traspàs + NESE, fuzzy matching)
8. ✅ Importar els 6 Excel del curs 2024-25 (186 traspàs matched, 88 NESE matched)
9. ✅ Verificar dades importades (185 student_yearly_data, 87 student_nese_data)

**Fitxers creats:**
- `scripts/import-students-excel.ts` (script complet amb `--all` o `--type/--etapa/--file`)
- `scripts/output/unmatched_*.csv` (log alumnes no matchejats per revisió manual)

### Fase 3: Llistat d'alumnes ✅ COMPLETADA
10. ✅ API route `/api/students` amb filtres (search, etapa, className, graellaNese, estat, sort, pagination)
11. ✅ Pàgina `/alumnes` amb filtres i taula (URL-driven state, Suspense wrapper)
12. ✅ Components: `students-table.tsx`, `students-filters.tsx` (badges amb colors, taula ordenable, paginació)

**Fitxers creats:**
- `src/app/api/students/route.ts` (GET amb filtres, permisos per rol)
- `src/app/(protected)/alumnes/page.tsx` (pàgina llistat)
- `src/components/alumnes/students-filters.tsx` (filtres per etapa, classe, NESE, estat)
- `src/components/alumnes/students-table.tsx` (taula amb sort, pagination, link a detall)

### Fase 4: Fitxa detall ✅ COMPLETADA
13. ✅ API route `/api/students/[id]` GET + PATCH (amb permisos per rol i camp)
14. ✅ Pàgina `/alumnes/[id]` amb 3 pestanyes (Traspàs, NESE, Evolució)
15. ✅ Components: `student-info-tab.tsx`, `student-nese-tab.tsx`, `student-evolution-tab.tsx`
16. ✅ Mode edició amb permisos (canEdit/canEditField per rol, seccions Secretaria/POE-MESI/Tutor)

**Fitxers creats:**
- `src/app/api/students/[id]/route.ts` (GET amb joins, PATCH amb validació permisos)
- `src/app/(protected)/alumnes/[id]/page.tsx` (pàgina detall amb tabs)
- `src/components/alumnes/student-info-tab.tsx` (tab traspàs amb edició)
- `src/components/alumnes/student-nese-tab.tsx` (tab NESE amb seccions per rol)
- `src/components/alumnes/student-evolution-tab.tsx` (històric per cursos)

### Fase 5: Exportació + còpia de curs ✅ COMPLETADA
17. ✅ Exportar llistat a Excel (`/api/students/export` amb ExcelJS, botó a la pàgina)
18. ✅ Exportar fitxa a PDF (`/api/students/[id]/export-pdf` genera HTML imprimible amb print-to-PDF)
19. ✅ Funcionalitat còpia de curs escolar (`/api/students/copy-year` POST, copia yearly+nese amb reset d'estat)

**Fitxers creats:**
- `src/app/api/students/export/route.ts` (exportació Excel amb filtres per etapa)
- `src/app/api/students/[id]/export-pdf/route.ts` (exportació PDF amb HTML imprimible)
- `src/app/api/students/copy-year/route.ts` (còpia de curs amb reset de camps transitoris)

---

## 10. Fitxers Clau Existents (referència)

| Fitxer | Ús |
|--------|-----|
| `src/app/(protected)/curriculums/page.tsx` | Patró a seguir per al llistat |
| `src/components/curriculums/candidates-filters.tsx` | Patró de filtres |
| `src/components/curriculums/candidates-table.tsx` | Patró de taula |
| `src/components/layout/sidebar.tsx` | Sidebar a modificar |
| `src/components/layout/mobile-nav.tsx` | Nav mòbil a modificar |
| `src/app/(protected)/layout.tsx` | Layout a modificar (carregar rol) |
| `src/lib/supabase/server.ts` | Client Supabase server-side |
| `src/components/dashboard/charts.tsx` | Patró Recharts |

---

## 11. Verificació

### Per a cada fase:
- **Fase 1**: Executar migracions, verificar taules a Supabase, comprovar que sidebar mostra/oculta segons rol
- **Fase 2**: Executar script, comparar recomptes amb Excel originals, verificar matches correctes
- **Fase 3**: Navegar a `/alumnes`, provar tots els filtres, verificar paginació i ordenació
- **Fase 4**: Clicar alumne, verificar totes les pestanyes, provar edició i guardat, verificar camps per etapa
- **Fase 5**: Exportar Excel i verificar contingut, exportar PDF i verificar format amb logo, provar còpia de curs

### Tests E2E:
1. Login com admin → veure Alumnes + Curriculums al sidebar, editar tots els camps
2. Login com tutor → veure només Alumnes, poder editar Traspàs + camps TUTOR de NESE, camps POE/MESI i SECRETARIA en readonly
3. Login com poe → veure Alumnes, poder editar només camps POE/MESI de NESE, resta en readonly
4. Login com secretaria → veure Alumnes, poder editar només camps SECRETARIA de NESE, resta en readonly
5. Login com professor → veure Alumnes, NO poder editar res
6. Login com convidat → NO veure Alumnes ni Curriculums
7. Filtrar per etapa → veure només alumnes de l'etapa
8. Clicar alumne amb NESE → veure tab NESE amb camps adaptats a l'etapa
9. Exportar llistat → verificar .xlsx correcte
10. Exportar fitxa PDF → verificar logo i contingut
