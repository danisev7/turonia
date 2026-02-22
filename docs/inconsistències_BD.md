# Informe d'inconsistències de la Base de Dades

**Data**: 22 de febrer de 2026
**Curs escolar**: 2024-2025 → 2025-2026

---

## Resum

| Inconsistència | Alumnes afectats |
|---|---|
| 1. Alumnes a Clickedu sense dades de traspàs als Excels | 30 |
| 2. Alumnes als Excels que no existeixen a Clickedu | 22 (16 persones úniques) |
| 3. Alumnes amb registre NESE sense `graella_nese` al traspàs | 56 |

---

## 1. Alumnes a Clickedu sense dades de traspàs als Excels

Aquests 30 alumnes consten a la base de dades de Clickedu (són alumnes actius del centre) però **no apareixen a cap dels Excels de traspàs de tutories**. Per tant, no tenim cap dada de traspàs (dades familiars, acadèmiques, comportament, acords de tutoria, etc.) per a ells.

> **Nota**: S'han exclòs els 21 alumnes d'Infantil 3, ja que són nous al centre i és esperable que no tinguin traspàs previ.

**Acció necessària**: Confirmeu si aquests alumnes haurien de tenir fitxa de traspàs o si és correcte que no en tinguin.

### Infantil 4 (1 alumne)

| Nom | Cognoms |
|---|---|
| German Isaac | Castro Navas |

### Infantil 5 (1 alumne)

| Nom | Cognoms |
|---|---|
| Zixi | Yang |

### Cinquè de Primària (1 alumne)

| Nom | Cognoms |
|---|---|
| Danial | Amjid Khanum |

### Sisè de Primària (2 alumnes)

| Nom | Cognoms |
|---|---|
| Pol | Carmona Romera |
| Daniela | Díaz González |

### Segon de Primària - repetidor (1 alumne)

| Nom | Cognoms |
|---|---|
| Anderson Saul | Martínez Coronel |

### Quart de Primària (19 alumnes)

| Nom | Cognoms |
|---|---|
| Sara | Amjid Khanum |
| Ferdaus | Boukayour Chahbouni |
| Yassine | Chamlal |
| Ashly Jhoana | Duarte Hernández |
| Yahya | El Haddouchi |
| Gerard | García Saavedra |
| Alma | González Mateo |
| Haroun | Harrak El Jibari |
| Núria | Hernández Villodres |
| Eimy Gabriela | Jiménez Mina |
| Iyad | Lorenzo El Faraa |
| Roumayssae | Maalem |
| Marc | Martínez Fernández |
| Sergio | Murcia Díaz |
| Aroa | Ortiz Rhu |
| Martí | Poveda López |
| Maria Elisabet | Ramos Sánchez |
| Kimberly Andrea | Romero León |
| Andrea | Vilamala Ros |

### Primer d'ESO (3 alumnes)

| Nom | Cognoms |
|---|---|
| Cesar | Granado Cortés |
| Walid | Mounachit El Guennouni |
| Jaqueline Dayanara | Vega Solaeche |

### Tercer d'ESO (1 alumne)

| Nom | Cognoms |
|---|---|
| Alae | Harrak El Jibari |

### Quart d'ESO (2 alumnes)

| Nom | Cognoms |
|---|---|
| Soufiane | Chamlal |
| Alfonso Gerardo | Lunar Flores |

---

## 2. Alumnes als Excels que no existeixen a Clickedu

Aquests 22 registres (16 persones úniques) apareixen als Excels de traspàs i/o NESE però **no s'han pogut trobar a la base de dades de Clickedu**. Les seves dades no s'han pogut importar.

**Acció necessària**: Confirmeu si aquests alumnes han causat baixa, han canviat de centre, o si es tracta d'errors als Excels. Si han de continuar al centre, caldria donar-los d'alta a Clickedu.

### Infantil 3 (1 alumne)

| Nom | Font Excel | Notes |
|---|---|---|
| Júlia Serrano | NESE INF | Sospita TEA. CDIAP setmanal. Baixa des del maig per motius personals. |

### Segon de Primària (1 alumne)

| Nom | Font Excel | Notes |
|---|---|---|
| Andy Martínez | Traspàs PRI | Nouvingut a final de curs 2025. Retenció a 2n. Monoparental. Molt disruptiu. |

### Tercer de Primària (1 alumne)

| Nom | Font Excel | Notes |
|---|---|---|
| Alba Borrego | NESE PRI | Canvia d'escola el curs 25-26. Sessions quinzenals amb psicòloga. |

### Primer d'ESO (1 alumne)

| Nom | Font Excel | Notes |
|---|---|---|
| Júlia Ríos Carmona | Traspàs ESO + NESE ESO | Discalcúlia i Dislèxia (informe 2020 CGO). Logopeda. |

### Segon d'ESO (1 alumne)

| Nom | Font Excel | Notes |
|---|---|---|
| Abram Cortés Jiménez | Traspàs ESO + NESE ESO | SSD. Retenció 1r PRI. Preinscripció a CFGB Miquel Biada. |

### Tercer d'ESO (3 alumnes)

| Nom | Font Excel | Notes |
|---|---|---|
| Lucas Cortés | NESE ESO | UEC (Salesians). Causa baixa al complir 16 anys. |
| Marc Alsinet Ortega | Traspàs ESO + NESE ESO | TDAH (F90.2) combinat. Dislèxia. Concerta. Retenció 2n ESO. Coach setmanal. |
| Tanisha Kishor Rani | Traspàs ESO + NESE ESO | SSD. Pare amb ordre d'allunyament. Pis de protecció. Serveis Socials. |

### Quart d'ESO (8 alumnes)

| Nom | Font Excel | Notes |
|---|---|---|
| Pau Moragas | NESE ESO | Acceleració progressiva des de 4t PRI. Segueix amb normalitat. |
| Nàhia Segarra | NESE ESO | TEA (ITA 2024). Protocol absentisme, no assisteix a classe. |
| Yanira Jiménez | NESE ESO | Absentisme des d'octubre. Intenció de baixa als 16 anys. SS. |
| Natalia Giménez | NESE ESO | No ha assistit cap dia a classe. Protocol absentisme. Ja té 16 anys. |
| Lucía Martínez | NESE ESO | Dislèxia (falta informe). Li costa memoritzar. |
| Donovan Romero | NESE ESO | Nouvingut 17/18. PI NISE fins 6è. SSD. No segueix el ritme. |
| Lucía Valdivia | NESE ESO | Dislèxia (informe Volta 2020). Segueix amb normalitat. |
| Javier Sarrias | NESE ESO | Protocol absentisme. Preinscripció PFI perruqueria. SS. Fiscalia. |
| Ruchita Kishor | NESE ESO | SSD. Incorporació octubre 2024. SS Pineda. Divorci pares. |
| Alisa Miroliubova | NESE ESO | NISE. Nouvinguda de Rússia (febrer 2024). |

---

## 3. Alumnes amb registre NESE sense indicació de `graella_nese` al traspàs

Aquests 56 alumnes tenen un registre a la **graella NESE** (Excels de NESE per nivell) però **no estan marcats com a `graella_nese = true`** a la seva fitxa de traspàs de tutories. Això pot ser correcte (alumnes amb seguiment SSD o observació que no estan formalment a la graella NESE del traspàs) o pot indicar una manca de coordinació entre les dues fonts.

**Acció necessària**: Reviseu si aquests alumnes haurien de tenir `graella_nese = true` al traspàs o si és correcte que no el tinguin.

### Resum per tipus de situació NESE:

| Tipus | Alumnes |
|---|---|
| Sense NISE definit (seguiment, observació, SSD) | 32 |
| NISE = "no" (explícitament sense NISE, però amb seguiment) | 15 |
| NISE = "nise" (amb NISE reconegut, sense marcar al traspàs) | 7 |
| NISE = "sls" (Situació Lleu de Salut) | 2 |

### Infantil 4 (4 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Daniela | Alberich Díaz | No | — | DUA/MISU | Possible trastorn del llenguatge expressiu (CDIAP). Logopeda setmanal. Pictogrames. |
| Ouissal | Grain | Sí | — | — | — |
| Leo | Ibáñez Burgos | No | — | DUA/MISU | Retard del desenvolupament del llenguatge (CDIAP). Logopeda quinzenal. |
| Zakaria | Rahhli Azahriou | Sí | — | — | — |

### Infantil 5 (6 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Malak | Chmanti Haouari | Sí | — | — | — |
| Fatima | El Khayat | Sí | — | — | — |
| Malak | Ghanoura | Sí | — | — | — |
| Yassin | Grain | Sí | — | — | — |
| Yanis | Maati El Abbassi | Sí | — | — | — |
| Rodaina | Ziadi | Sí | — | — | — |

### Primer de Primària (5 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Janat | Bilal | Sí | — | — | — |
| Adama | Dabo | Sí | — | — | — |
| Hawa | Dabo | Sí | — | — | — |
| Oumaya | El Khayat | Sí | — | — | — |
| Alae | El Mansouri | Sí | — | — | — |

### Segon de Primària (2 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Zeinabu | Ganess Kaloga | Sí | No | Sense mesures | Dificultats gestió emocional. Candidata beca MEC. |
| Anderson Saul | Martínez Coronel | Sí | NISE | — | Nouvingut abril 2025. Nivell molt baix. No escolaritzat prèviament. Retenció a 2n. |

### Quart de Primària (10 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Ferdaus | Boukayour Chahbouni | Sí | — | PI | TDL (informe EAP). CAD 33%. Logopeda CLER quinzenal. Beca MEC sol·licitada. |
| Yassine | Chamlal | Sí | NISE | — | Nouvingut del Marroc (maig 2025). No parla català ni castellà. Cal PI nouvingut 25/26. |
| Ashly Jhoana | Duarte Hernández | Sí | NISE | PI | Nouvinguda de Veneçuela (març 2024). PI nouvinguda. Pla Educatiu d'Entorn. |
| Núria | Hernández Villodres | No | — | DUA/MISU | Psicòloga mensual. Estancament acadèmic. Es proposa PI a 4t. Possible TDAH. |
| Iyad | Lorenzo El Faraa | No | — | Sense mesures | TDAH + rasgos TEA a estudi. CSMIJ. Medicació Atenza 27mg. |
| Marc | Martínez Fernández | No | — | PI | Dislèxia (indicis). Teràpia visual quinzenal. PI signat 20/12/2024. Es recomana CSMIJ per TDAH. |
| Sergio | Murcia Díaz | No | — | — | Nivell molt baix. Millora progressiva. Pla Educatiu d'Entorn. Observar per possibles adaptacions. |
| Kimberly Andrea | Romero León | Sí | — | — | Ritme lent, baixa autoestima. Pla Educatiu d'Entorn. Seguiment CSMIJ (1a visita maig 2023). |
| Andrea | Vilamala Ros | No | — | — | Millora lectoescriptura. Visió 10% ull dret. Evoluciona favorablement. |

### Cinquè de Primària (4 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Júlia | Avila González | No | — | — | Problemes de relació. Incoherències. Es recomana teràpia comunicació. |
| Moisès | Cortés Jiménez | Sí | — | — | Pla Educatiu d'Entorn. Família en seguiment de Serveis Socials. |
| Ona | García López | No | — | — | Tractament hormonal (nov 24-25). Possibles queixes de mal de cap/cames. |
| Vega | Mayordomo Cordero | No | — | — | Acompanyant emocional mensual (centre Kènia). Pors i males conductes per egocentrisme. |

### Sisè de Primària (5 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Diego José | Castro Soliz | Sí | — | Sense mesures | — |
| Amani | El Mamouni | Sí | — | — | — |
| Blanca | Meca Martínez | No | — | Sense mesures | Deficiència auditiva del 90%. |
| Lucas | Valdivia Moreno | No | — | — | — |
| Nourhan | Ziadi | Sí | — | — | Baixa molt gran a nivell acadèmic i emocional al 3r trimestre. |

### Tercer d'ESO (10 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Insaf | Aghaddar | Sí | SLS | — | MISU en llengües i mates. Incorporació a 5è (2021). Candidata beca MEC. |
| Jan | Baldà Ortego | No | No | — | Psicòloga privada quinzenal. Candidat beca MEC. |
| Pol | Gil Amor | No | No | — | Dislèxia (2018) + TDAH (CSMIJ 2017). Inquiet, dificultats gestió emocional. Candidat beca MEC. |
| Daniel | Martínez Fernández | No | No | — | TDAH inatent (moderada). Dislèxia severa. Pla Educatiu d'Entorn. Candidat beca MEC. |
| Brian | Pousada Montero | No | SLS | — | No aprofita la repetició. Incorporació 2022 de Cuba. Candidat beca MEC. |
| Julen | Robledo Gallardo | No | No | — | Pendent diagnòstic (psico CAP). Absentisme justificat. Emocionalment tocat. Candidat beca MEC. |
| Dayana Sofía | Sandoval Espinoza | Sí | NISE | — | PI nouvinguda. Evolució personal i relacional complicada. Candidata beca MEC. |
| Mahamadou | Sillah Sillah | Sí | No | — | Incorporació curs actual. Dificultats llengües, mates i física. Candidat beca MEC. Valorar PFI. |
| Anyelisteici | Varela Alvárez | Sí | NISE | — | PI nouvinguda. Enyorança del pare. Psicòloga CAP quinzenal. Candidata beca MEC. |

### Quart d'ESO (10 alumnes)

| Nom | Cognoms | SSD | NISE | Mesura NESE | Detall |
|---|---|---|---|---|---|
| Abdel Basset | Ahdor | Sí | No | — | Informe NESE Annex 1. PI retirat a final de 2n ESO. |
| Soufiane | Chamlal | Sí | NISE | — | Nouvingut del Marroc (maig 2025). No parla català, castellà ni anglès. |
| Jan | Gascons Parrilla | No | No | — | TDAH + trastorn comunicació social. CSMIJ. Psicòloga privada. Medicació canviada. |
| Aicha | Ndiaye | Sí | No | — | NAC final 6è: 5è. Dificultats però motivada. Reforç escolar. |
| Fatima | Ndiaye | Sí | No | — | Retard greu de l'aprenentatge (informe NESE Annex 1). Reforç escolar. |
| Graciela | Noguera Akeng | Sí | No | — | Centre obert Salesians. SS. Psico Fundació Hospital. Derivació psiquiatria. |
| Danna Gisselle | Paz Melgara | Sí | NISE | — | Incorporació setembre 2023. |
| Daniel | Picazo Pasamar | No | No | — | Possible dislèxia (valoració EAP, no diagnòstic). Candidat beca MEC. |
| Guillem | Rodríguez Pardo | No | No | — | TEA + TDAH combinat + Tr. adaptatiu (CSMIJ oct 2024). Psicòloga privada. Incorporació 3r ESO. |
| Maija | Scedrova | Sí | — | — | PI nouvinguda retirat amb resultats excel·lents. MISU català (retirant-se). |
| Pol | Vivó Cortés | No | No | — | TDAH + Dislèxia (diagnòstic 2025, Centre Mind). Psicòloga. Reforç escolar. MISU català. |
| Pengxiang | Yin | Sí | No | — | TEA + TEL. CSMIJ. EAP, EAIA. Informe NESE Annex 1. Proposar canvi de centre. Candidat beca MEC. |

---

## Notes per als professors

1. **Secció 1**: Reviseu si aquests alumnes haurien de tenir fitxa de traspàs o si és correcte que no en tinguin.

2. **Secció 2**: Alguns d'aquests alumnes probablement han causat **baixa** (Lucas Cortés - UEC, Alba Borrego - canvi d'escola, Natalia Giménez - 16 anys, Yanira Jiménez - 16 anys). Confirmeu la situació de cadascun.

3. **Secció 3**: Molts alumnes amb **SSD** (Servei de Suport a la Diversitat) apareixen a les graelles NESE però no estan marcats al traspàs. Això pot ser intencionat o un oblit. Si us plau, reviseu si cal marcar-los com a `graella_nese = true` al traspàs.

4. **Alumnes que apareixen a les seccions 1 i 3**: Hi ha alumnes que apareixen a ambdues seccions (per exemple, Ferdaus Boukayour, Yassine Chamlal, Ashly Jhoana Duarte, etc.). Aquests alumnes tenen dades NESE però no tenen cap dada de traspàs. Cal revisar si s'han oblidat d'omplir el traspàs o si hi ha algun altre motiu.

---

*Informe generat automàticament per Turonia a partir de les dades dels Excels de traspàs i NESE del curs 2024-2025.*
