# Clickedu Web Scraping - Troballes de la investigació

## Resum executiu

Les notes dels alumnes **NO estan disponibles via l'API oficial** de Clickedu.
Després d'analitzar el portal web (`escolaelturo.clickedu.eu`) amb DevTools,
hem confirmat que les notes es serveixen **server-side** (HTML renderitzat pel PHP)
sense crides AJAX. Això significa que **és viable fer scraping** amb un script
que simuli la sessió del navegador.

---

## 1. Arquitectura del portal

- **Backend**: PHP + jQuery 1.7.1 + DataTables
- **Renderitzat de notes**: 100% server-side (no AJAX, no API interna)
- **Llistat d'alumnes**: DataTables client-side (tota la taula ve al HTML)
- **Autenticació**: Login amb formulari POST (usuario + password + archivo de paso), sessió PHP amb cookies

---

## 2. URLs clau

### 2.1 Login (2 passos)

**Pas 1: Credencials** (form id: `frmLogin`)
```
POST https://escolaelturo.clickedu.eu/user.php?action=doLogin
Content-Type: application/x-www-form-urlencoded

username=msensada&password=Teresita78&button=
```
Camps: `username` (text), `password` (password), `button` (submit)
→ Si OK, retorna la pàgina de l'arxiu de pas (status 200, no redirect)

**Pas 2: Arxiu de pas** (form id: `frmArxiuPas`)
```
POST https://escolaelturo.clickedu.eu/user.php?action=controlArxiuPas
Content-Type: multipart/form-data

userfile: [fitxer amb contingut "d1997ca187e32ad0eda9b79ceb95f1d4"]
id_usuari: [hidden, assignat pel servidor]
MAX_FILE_SIZE: [hidden, assignat pel servidor]
```
Camps: `userfile` (file upload!), `id_usuari` (hidden), `MAX_FILE_SIZE` (hidden)
→ Si OK, redirigeix a `/sumari/index.php` (sessió activa amb cookies)

**Important**: L'arxiu de pas NO és un camp de text sinó un **file upload**.
El fitxer conté un hash MD5: `d1997ca187e32ad0eda9b79ceb95f1d4`.
Per al scraping, cal simular el multipart/form-data upload amb aquest contingut.

### 2.2 Llistat d'alumnes
```
GET https://escolaelturo.clickedu.eu/admin/users.php?tipus=alu&selected=alu
```
- Retorna HTML amb taula DataTables
- 302 alumnes actius (curs 2025-2026)
- Columnes: Id, Nom, Cognoms, Tipus, Classe, Estat
- El filtre "Tots" + "Mostra Tots registres" mostra tots d'un cop

### 2.3 Fitxa acadèmica (NOTES)
```
GET https://escolaelturo.clickedu.eu/admin/fitxa_alumne.php?alum={id}&p=academica_total&notes=tot&ce_cl={ce}_{cl}
```
Paràmetres:
- `alum` = ID de l'alumne (ex: 1487)
- `p` = tipus de pàgina (`academica_total` per notes, `diaadia` per assistència)
- `notes` = `tot` (mostrar totes les notes)
- `ce_cl` = `{curs_escolar}_{classe}` (ex: `35_116` on 35=curs 2025-2026, 116=Tercer d'ESO)

### 2.4 Altres pàgines de la fitxa
| Paràmetre `p`         | Descripció                  |
|------------------------|----------------------------|
| `academica_total`      | Notes de totes les avaluacions |
| `diaadia`              | Assistència dia a dia       |
| `modificar_notes`      | Editar notes del curs       |
| `grafica`              | Gràfiques de notes          |
| `notes_etapa`          | Notes de l'etapa            |
| `info_etapa`           | Informació de l'etapa       |
| `documentacio`         | Generar documentació        |
| `academica`            | Notes per matèria (`assig={id}`) |

---

## 3. Mapeig de classes (curs 2025-2026)

| ID  | Classe                | Alumnes |
|-----|-----------------------|---------|
| 105 | Infantil 3            | 20      |
| 106 | Infantil 4            | 19      |
| 107 | Infantil 5            | 18      |
| 108 | Primer de Primària    | 21      |
| 109 | Segon de Primària     | 17+2    |
| 110 | Tercer de Primària    | 15      |
| 111 | Quart de Primària     | 19      |
| 112 | Cinquè de Primària    | 24      |
| 113 | Sisè de Primària      | 27      |
| 114 | Primer d'ESO          | 32      |
| 115 | Segon d'ESO           | 28      |
| 116 | Tercer d'ESO          | 31      |
| 117 | Quart d'ESO           | 28      |

**Total**: 302 alumnes

**Curs escolar ID**: 35 (2025-2026)

---

## 4. Estructura de la taula de notes

La taula HTML de notes conté per cada matèria:
- **Matèria** (nom)
- Per cada avaluació (Preavaluació, 1a, 2a, 3a, Final):
  - `abs.` = absències
  - `ret.` = retards
  - `deu.` = deures
  - `Nota` = qualificació textual
- **Professor/a**

### Valors de nota observats:
- `Assoliment Excel·lent`
- `Assoliment Notable`
- `Assoliment Satisfactori`
- `Assoliment Satisfactori(r)` (recuperació)
- `No Assoliment`
- Buit (avaluació no completada)

### Avaluacions i dates (curs 2025-2026):
| Avaluació       | Dates                      |
|-----------------|---------------------------|
| Preavaluació    | 08/09/2025 - 25/10/2025   |
| 1a Avaluació    | 26/10/2025 - 05/12/2025   |
| 2a Avaluació    | 06/12/2025 - 14/03/2026   |
| 3a Avaluació    | 17/03/2026 - 19/06/2026   |

---

## 5. Pla d'implementació del scraping

### Pas 1: Login
```
POST / HTTP/1.1
Host: escolaelturo.clickedu.eu
Content-Type: application/x-www-form-urlencoded

usuario=msensada&password=Teresita78&archivo_paso=d1997ca187e32ad0eda9b79ceb95f1d4
```
→ Capturar cookies de sessió (PHPSESSID o similar)

### Pas 2: Obtenir llistat d'alumnes
```
GET /admin/users.php?tipus=alu&selected=alu
Cookie: {session_cookies}
```
→ Parsejar HTML amb cheerio/jsdom per extreure: id, nom, cognoms, classe

### Pas 3: Per cada alumne, obtenir notes
```
GET /admin/fitxa_alumne.php?alum={id}&p=academica_total&notes=tot&ce_cl=35_{classe_id}
Cookie: {session_cookies}
```
→ Parsejar la taula HTML de notes

### Tecnologies recomanades:
- **Runtime**: Node.js (TypeScript)
- **HTTP**: `fetch` nativa o `undici`
- **HTML parsing**: `cheerio` (lightweight, no browser needed)
- **Alternativa**: Playwright/Puppeteer si cal JavaScript execution

### Consideracions:
- Cal afegir delays entre peticions per no sobrecarregar el servidor
- La sessió pot caducar, cal gestionar re-login
- Els noms de camp del formulari de login s'han de verificar (inspeccionant el form)
- El paràmetre `ce_cl` necessita el curs_escolar_id (35) que pot canviar cada any

---

## 6. Següents passos

1. **Verificar el formulari de login**: Inspeccionar els noms exactes dels camps del formulari POST de login
2. **Crear script de prova**: Script TypeScript que faci login + obtingui notes d'1 alumne
3. **Validar el parsing**: Confirmar que cheerio pot extreure correctament la taula de notes
4. **Implementar scraper complet**: Loop per tots els alumnes amb rate limiting
5. **Integrar amb Turonia**: Guardar les dades a Supabase
