# Documentacio API de Clickedu

Documentacio completa de la API de Clickedu basada en l'exploracio de https://api-docs.clickedu.eu/.

**Data d'exploracio**: 2026-02-21

---

## 1. Informacio General

| Concepte | Valor |
|---|---|
| API Server (produccio) | `https://api.clickedu.eu/` |
| API Server (sandbox) | `https://api-sandbox.clickedu.eu/` |
| Documentacio | https://api-docs.clickedu.eu/ |
| Contacte API | api@clickedu.net |
| Especificacio | OpenAPI 3 (OAS3) |

La API esta organitzada en **9 serveis** independents, cadascun amb la seva propia base URL.

### Autenticacio

Tots els endpoints requereixen 3 headers:
- `Authorization`: JWT token (obtingut via Login)
- `x-api-key`: Clau API proporcionada per Clickedu
- `domain`: Subdomini de l'escola (ex: `escolaelturo`)

**IMPORTANT**: Les credencials `x-api-key`, `client_id` i `client_secret` que apareixen a la documentacio son valors de demo. Cal sol·licitar credencials propies a **api@clickedu.net**.

---

## 2. Login Service

**Base URL**: `https://api.clickedu.eu/login/`
**Versio**: 1.0.0

### Endpoints

| Metode | Endpoint | Descripcio |
|---|---|---|
| POST | `/v1/auth/token` | Obtenir token OAuth2 |
| POST | `/v1/auth/token/refresh` | Refrescar token |
| POST | `/v1/auth/credentials` | Obtenir dades del usuari del token |
| GET | `/v1/auth/token/validate` | Validar token |

### POST `/v1/auth/token`

**Headers requerits**:
- `x-api-key` (string): Clau API
- `domain` (string): Subdomini de l'escola

**Body** (User grant):
```json
{
  "grant_type": "password",
  "client_id": 2,
  "client_secret": "xxx",
  "username": "user",
  "password": "pass"
}
```

**Resposta 200**:
```json
{
  "token_type": "string",
  "expires_in": "string",
  "access_token": "string",
  "refresh_token": "string"
}
```

Hi ha dos tipus de grant:
1. **User grant** (`grant_type: "password"`): Identifica un usuari especific amb les seves credencials
2. **Client grant**: Identifica una aplicacio de tercers

---

## 3. Users Service (el mes rellevant per al nostre cas)

**Base URL**: `https://api.clickedu.eu/users/`
**Versio recomanada**: 2.0.0 (v1 esta obsoleta)

### Endpoints

#### Llistats d'usuaris

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v2/lists/students?page=1&limit=100` | Llista d'alumnes actius |
| GET | `/v2/lists/parents?page=1&limit=100` | Llista de pares |
| GET | `/v2/lists/teachers?page=1&limit=100` | Llista de professors |
| GET | `/v2/lists/adminServicesStaff?page=1&limit=100` | Personal administratiu |
| GET | `/v2/lists/others?page=1&limit=100` | Altres usuaris |

**Resposta** (totes les llistes):
```json
{
  "users": [
    { "id": 123, "name": "Nom Cognom" }
  ],
  "paginator": {
    "pages": 5,
    "current_page": 1,
    "per_page": 100,
    "total": 450
  }
}
```

#### Dades detallades d'un usuari

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v2/users/{user_id}/{ind_pm}` | Dades completes d'un usuari |

- `user_id` (integer): ID de l'usuari
- `ind_pm` (integer): 0 o 1 (possiblement indicador de dades de pares/mares)

**Resposta (UserResponse)** - Camps disponibles:

| Camp | Tipus | Descripcio |
|---|---|---|
| `user_id` | integer | ID unic |
| `name` | string | Nom |
| `lastname1` | string | Primer cognom |
| `lastname2` | string | Segon cognom |
| `birthday` | string | Data de naixement |
| `placeOfBirth` | string | Lloc de naixement |
| `countryOfBirth` | string | Pais de naixement |
| `nationality` | string | Nacionalitat |
| `gender` | string | Genere |
| `dni` | string | DNI |
| `passport` | string | Passaport |
| `creationDate` | string | Data de creacio |
| `deregisteredDate` | string | Data de baixa |
| `email` | string | Email |
| `phone` | string | Telefon |
| `secondaryPhone` | string | Telefon secundari |
| `mobilePhone` | string | Mobil |
| `address` | string | Adreca |
| `postcode` | string | Codi postal |
| `locality` | string | Localitat |
| `province` | string | Provincia |
| `country` | string | Pais |
| `remarks` | string | Observacions |
| `medicalRemarks` | string | Observacions mediques |
| `isTeacher` | boolean | Es professor? |
| `profile` | string | Perfil |
| `job` | string | Treball |
| `recipient` | string | Destinatari |
| `preinscriptionYear` | integer | Any de preinscripcio |
| `preinscriptionCourse` | string | Curs de preinscripcio |
| `procedenceCenterName` | string | Centre de procedencia |
| `parents` | object | `{ parent1_id, parent2_id }` |
| `academic` | object | `{ stage, class }` — **Etapa i classe de l'alumne** |
| `children` | array | Fills (si l'usuari es pare/mare) |

#### Dades de matricula d'un alumne

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v2/students/{student_id}/data` | Dades de matricula |

**Resposta (EnrollmentResponse)**:
```json
{
  "enrollmentCode": "string",
  "enrollmentDate": "string",
  "startCourse": "string",
  "cip": "string",
  "nia": "string",
  "enrollmentEndDate": "string",
  "educationalNeeds": "string"
}
```

#### Filtres assignats a un alumne

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v2/students/{student_id}/filters` | Dades dels filtres assignats |

#### Assistencia d'un alumne (FALTES)

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v2/students/{student_id}/attendance` | Assistencia del curs actual |

**Resposta (UserAttendanceResponse)**:
```json
{
  "student_id": 0,
  "attendance_type": "string",
  "data": [
    {
      "type": "string",
      "date": "string",
      "justified": true,
      "session_time": "string",
      "session_subject_id": 0,
      "day_slot": "string"
    }
  ]
}
```

**Camps de cada registre de falta**:
- `type`: Tipus de falta
- `date`: Data
- `justified`: Si esta justificada (true/false)
- `session_time`: Hora de la sessio
- `session_subject_id`: ID de l'assignatura de la sessio
- `day_slot`: Franja horaria del dia

---

## 4. Academic Service

**Base URL**: `https://api.clickedu.eu/academic/`
**Versio**: 1.0.0

### Etapes (Stages)

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/stages` | Totes les etapes (Infantil, Primaria, ESO...) |
| GET | `/v1/stages/{stage_id}` | Dades d'una etapa |
| GET | `/v1/stages/{stage_id}/students` | Alumnes d'una etapa |
| GET | `/v1/stages/{stage_id}/teachers` | Professors d'una etapa |

### Cursos (Courses)

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/courses` | Tots els cursos |
| GET | `/v1/courses/{course_id}` | Dades d'un curs |
| GET | `/v1/courses/{course_id}/students` | Alumnes d'un curs |
| GET | `/v1/courses/{course_id}/teachers` | Professors d'un curs |

**InfoCoursesResponse**:
```json
{
  "id": 1,
  "name": "1r Primaria",
  "parent_course_id": 0,
  "stage_id": 2,
  "course_number": 1,
  "classes": [...]
}
```

### Classes (Classrooms)

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/classes` | Totes les classes |
| GET | `/v1/classes/{class_id}` | Dades d'una classe |
| GET | `/v1/classes/{class_id}/students` | Alumnes d'una classe |
| GET | `/v1/classes/{class_id}/teachers` | Professors d'una classe |

**InfoClassesResponse**:
```json
{
  "id": 1,
  "name": "1A",
  "letter": "A",
  "id_course": 3,
  "id_tutor": 45
}
```

### Grups (Groups)

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/groups` | Tots els grups |
| GET | `/v1/groups/{group_id}` | Dades d'un grup |
| GET | `/v1/groups/{group_id}/students` | Alumnes d'un grup |
| GET | `/v1/groups/{group_id}/teachers` | Professors d'un grup |

### Alumne individual

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/students/{student_id}/stages` | Etapa de l'alumne |
| GET | `/v1/students/{student_id}/classes` | Classe de l'alumne |
| GET | `/v1/students/{student_id}/courses` | Cursos de l'alumne |

### Assignatures (Subjects)

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/subjects` | Totes les assignatures |
| GET | `/v1/subjects/{subject_id}` | Dades d'una assignatura |
| GET | `/v1/subjects/{subject_id}/students` | Alumnes d'una assignatura |
| GET | `/v1/subjects/{subject_id}/teachers` | Professors d'una assignatura |

**SubjectResponse**:
```json
{
  "id": 1,
  "name": "Matematiques",
  "course": "1r Primaria",
  "tutoria": 0,
  "official_code": "string",
  "official_name": "string",
  "official_es_code": "string",
  "official_es_name": "string",
  "type": "string",
  "classes": [...],
  "groups": [...]
}
```

### Anys Escolars (School Years)

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/school_years` | Tots els anys escolars |
| GET | `/v1/school_years/{school_year_id}` | Dades d'un any escolar |

**SchoolYearResponse**:
```json
{ "id": 1, "name": "2025-2026", "current_year": true }
```

---

## 5. Catering Service

**Base URL**: `https://api.clickedu.eu/catering/`
**Versio**: 1.0.0

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/groups` | Grups de menjador |
| GET | `/v1/groups/{group_id}` | Detall d'un grup |
| GET | `/v1/classrooms` | Aules de menjador |
| GET | `/v1/classrooms/{classroom_id}` | Detall d'una aula |
| GET | `/v1/services` | Serveis de menjador |
| GET | `/v1/services/{service_id}` | Detall d'un servei |
| GET | `/v1/registrations` | Totes les inscripcions |
| POST | `/v1/registrations` | Guardar inscripcions |
| GET | `/v1/registrations/date/{date}` | Inscripcions per data |
| GET | `/v1/registrations/date/{date}/group/{group_id}` | Inscripcions per data i grup |
| GET | `/v1/registrations/date/{date}/group/{group_id}/student/{student_id}` | Inscripcio especifica |

---

## 6. Payments Service

**Base URL**: `https://api.clickedu.eu/payments/`
**Versio**: 1.0.0

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/student/{student_id}` | Metodes de pagament d'un alumne |

---

## 7. Extracurricular Service

**Base URL**: `https://api.clickedu.eu/extracurricular/`
**Versio**: 1.0.0

### Tipus d'activitats

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/activity_types` | Llista de tipus d'activitats |
| GET | `/v1/activity_types/{id}` | Info d'un tipus |
| GET | `/v1/activity_types/{id}/coordinators` | Coordinadors |
| GET | `/v1/activity_types/{id}/activities` | Activitats d'aquest tipus |

### Activitats

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/activities/{activity_id}` | Info d'una activitat |
| GET | `/v1/activities/{activity_id}/supervisors` | Supervisors |
| GET | `/v1/activities/{activity_id}/students` | Alumnes inscrits |

### Inscripcions d'un alumne

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/student/{student_id}/activity_types` | Tipus d'activitats on esta inscrit |
| GET | `/v1/student/{student_id}/activities` | Activitats on esta inscrit |
| GET | `/v1/student/{student_id}/activities/{activity_id}/enrollment` | Detall d'inscripcio |

---

## 8. Services Service

**Base URL**: `https://api.clickedu.eu/services/`
**Versio**: 1.0.0

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/students/{student_id}/registrations` | Inscripcions a serveis d'un alumne |
| GET | `/v1/registrations/{registration_id}` | Dades d'una inscripcio |
| GET | `/v1/registrations/{id}/start_date/{start}/end_date/{end}/attendances` | Assistencia a un servei |
| GET | `/v1/prices/{price_id}` | Dades d'un preu |

---

## 9. Preadmissions Service

**Base URL**: `https://api.clickedu.eu/preadmissions/`
**Versio**: 1.0.0

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/preadmissions` | Llista de preinscripcions |
| POST | `/v1/preadmissions` | Inserir preinscripcions |

---

## 10. Orders Service

**Base URL**: `https://api.clickedu.eu/orders/`
**Versio**: 1.0.0

| Metode | Endpoint | Descripcio |
|---|---|---|
| GET | `/v1/delivery/purchase` | Info de comandes |
| GET | `/v1/delivery/purchase/{purchase_code}` | Comanda per codi |
| GET | `/v1/delivery/purchase/date/{date}` | Comandes per data |

---

## 11. Resum: Que podem saber dels alumnes?

### Dades personals (Users Service)
- Nom, cognoms, data de naixement, genere
- DNI, passaport, nacionalitat
- Email, telefon, mobil
- Adreca completa (adreca, CP, localitat, provincia, pais)
- Etapa i classe actual (`academic.stage`, `academic.class`)
- IDs dels pares (`parents.parent1_id`, `parents.parent2_id`)
- Data de creacio i data de baixa
- Observacions i observacions mediques
- Perfil, centre de procedencia

### Dades de matricula (Users Service)
- Codi de matricula, data de matricula
- Curs d'inici
- CIP, NIA
- Data de fi de matricula
- Necessitats educatives

### Assistencia / Faltes (Users Service)
- Tipus de falta
- Data
- Si esta justificada o no
- Hora de la sessio
- Assignatura de la sessio
- Franja horaria

### Estructura academica (Academic Service)
- Etapes, cursos, classes, grups
- Assignatures (amb codi oficial, nom, tipus)
- Professors per classe/curs/assignatura
- Anys escolars

### Activitats extraescolars (Extracurricular Service)
- Activitats on esta inscrit l'alumne
- Supervisors i coordinadors

### Menjador (Catering Service)
- Inscripcions al menjador per data

### Serveis addicionals (Services Service)
- Inscripcions a serveis
- Assistencia a serveis per rang de dates

---

## 12. Que NO te la API (limitacions detectades)

| Funcionalitat | Disponible? | Notes |
|---|---|---|
| **Evaluacions / Notes** | **NO** | No hi ha cap endpoint per consultar qualificacions o butlletins de notes |
| **Horaris** | **NO** | No hi ha endpoints d'horaris |
| **Comunicacions** | **NO** | No hi ha endpoints de missatgeria o circulars |
| **Documents** | **NO** | No hi ha endpoints per accedir a documents pujats |
| **Incidencies** | **NO** | No hi ha endpoints d'incidencies o sancions |

**Les evaluacions/notes NO estan disponibles via API.** Si necessitem accedir a les notes dels alumnes, caldra explorar alternatives (scraping del portal web o sol·licitar a Clickedu que afegeixin aquesta funcionalitat a la API).

---

## 13. Flux recomanat per obtenir la llista d'alumnes

```
1. POST /login/v1/auth/token          → Obtenir access_token
2. GET  /users/v2/lists/students       → Llista {id, name} de tots els alumnes
3. GET  /users/v2/users/{id}/0         → Dades completes de cada alumne
   (opcional, per obtenir detalls com classe, etapa, email, etc.)
```

Alternativament, per obtenir alumnes organitzats per classe:
```
1. POST /login/v1/auth/token
2. GET  /academic/v1/classes            → Llista de totes les classes
3. GET  /academic/v1/classes/{id}/students → Alumnes de cada classe
```

---

## 14. Resum rapid (Hallazgos clau)

### Que SI podem obtenir via API
- Llista d'alumnes actius amb paginacio
- Dades personals completes (nom, DNI, email, telefon, adreca...)
- Etapa i classe de cada alumne (`academic.stage`, `academic.class`)
- Dades de matricula (codi, NIA, CIP, data inici/fi)
- Faltes d'assistencia del curs actual (tipus, data, justificada, hora, assignatura)
- Estructura academica completa (etapes, cursos, classes, grups, assignatures)
- Activitats extraescolars i inscripcions

### Que NO te la API
- **Evaluacions / Notes** — No hi ha cap endpoint per consultar qualificacions
- Horaris, comunicacions, documents, incidencies

### Arxius creats
- `docs/doc-api-clickedu.md` — Documentacio completa (aquest fitxer)
- `scripts/test-clickedu-api.ts` — Script de prova (llest per quan arribin les credencials)

### Proxim pas
Quan Clickedu respongui amb les credencials API propies (`x-api-key`, `client_id`, `client_secret`), actualitzar les variables a `.env.local` i executar:
```bash
npx tsx scripts/test-clickedu-api.ts
```

---

## 15. Estat actual de la integracio

- [x] Documentacio explorada exhaustivament
- [x] Script de prova creat (`scripts/test-clickedu-api.ts`)
- [x] Prova amb credencials demo → 403 Forbidden (les de la doc no funcionen)
- [ ] **Pendent**: Sol·licitar credencials API a api@clickedu.net (mail enviat)
- [ ] **Pendent**: Provar autenticacio amb credencials propies
- [ ] **Pendent**: Implementar integracio a Turonia
