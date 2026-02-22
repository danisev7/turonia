#!/usr/bin/env python3
"""Convert the inconsistencies report from markdown to a formatted PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# ── Colors ──────────────────────────────────────────────────────────────
PRIMARY = HexColor("#1a365d")       # Dark blue
SECONDARY = HexColor("#2b6cb0")     # Medium blue
ACCENT = HexColor("#e53e3e")        # Red for warnings
LIGHT_BG = HexColor("#ebf4ff")      # Light blue bg
TABLE_HEADER = HexColor("#2b6cb0")  # Blue header
TABLE_ALT = HexColor("#f7fafc")     # Light gray alternating rows
NOTE_BG = HexColor("#fffff0")       # Light yellow for notes
NOTE_BORDER = HexColor("#d69e2e")   # Yellow border
BORDER_COLOR = HexColor("#cbd5e0")  # Gray border
TEXT_COLOR = HexColor("#2d3748")     # Dark gray text
MUTED = HexColor("#718096")         # Muted gray

# ── Page setup ──────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN = 2 * cm

output_path = os.path.join(os.path.dirname(__file__), "..", "docs", "inconsistències_BD.pdf")

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=MARGIN,
    rightMargin=MARGIN,
    topMargin=2.5 * cm,
    bottomMargin=2 * cm,
)

# ── Styles ──────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    "CustomTitle",
    parent=styles["Title"],
    fontSize=22,
    textColor=PRIMARY,
    spaceAfter=6,
    leading=26,
)

style_subtitle = ParagraphStyle(
    "CustomSubtitle",
    parent=styles["Normal"],
    fontSize=11,
    textColor=MUTED,
    spaceAfter=4,
)

style_h1 = ParagraphStyle(
    "CustomH1",
    parent=styles["Heading1"],
    fontSize=16,
    textColor=PRIMARY,
    spaceBefore=20,
    spaceAfter=8,
    borderWidth=0,
    borderPadding=0,
)

style_h2 = ParagraphStyle(
    "CustomH2",
    parent=styles["Heading2"],
    fontSize=12,
    textColor=SECONDARY,
    spaceBefore=14,
    spaceAfter=6,
)

style_body = ParagraphStyle(
    "CustomBody",
    parent=styles["Normal"],
    fontSize=9,
    textColor=TEXT_COLOR,
    leading=13,
    alignment=TA_JUSTIFY,
    spaceAfter=6,
)

style_note = ParagraphStyle(
    "CustomNote",
    parent=styles["Normal"],
    fontSize=9,
    textColor=HexColor("#744210"),
    leading=13,
    leftIndent=8,
)

style_action = ParagraphStyle(
    "CustomAction",
    parent=styles["Normal"],
    fontSize=9,
    textColor=ACCENT,
    leading=13,
    spaceAfter=8,
)

style_table_cell = ParagraphStyle(
    "TableCell",
    parent=styles["Normal"],
    fontSize=8,
    textColor=TEXT_COLOR,
    leading=11,
)

style_table_header = ParagraphStyle(
    "TableHeader",
    parent=styles["Normal"],
    fontSize=8,
    textColor=white,
    leading=11,
)

style_footer = ParagraphStyle(
    "Footer",
    parent=styles["Normal"],
    fontSize=8,
    textColor=MUTED,
    alignment=TA_CENTER,
)

story = []


def add_hr():
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))


def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    avail_width = PAGE_W - 2 * MARGIN

    header_cells = [Paragraph(f"<b>{h}</b>", style_table_header) for h in headers]
    data = [header_cells]

    for row in rows:
        data.append([Paragraph(str(cell), style_table_cell) for cell in row])

    if col_widths is None:
        col_widths = [avail_width / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)

    table_style = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
    ]

    # Alternating row colors
    for i in range(1, len(data)):
        if i % 2 == 0:
            table_style.append(("BACKGROUND", (0, i), (-1, i), TABLE_ALT))

    t.setStyle(TableStyle(table_style))
    return t


def make_note_box(text):
    """Create a note box with yellow background."""
    avail = PAGE_W - 2 * MARGIN
    data = [[Paragraph(text, style_note)]]
    t = Table(data, colWidths=[avail - 4])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NOTE_BG),
        ("BOX", (0, 0), (-1, -1), 1, NOTE_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


# ═══════════════════════════════════════════════════════════════════════
# HEADER
# ═══════════════════════════════════════════════════════════════════════
story.append(Paragraph("Informe d'inconsistències de la Base de Dades", style_title))
story.append(Paragraph("<b>Escola el Turó</b> — Turonia", style_subtitle))
story.append(Paragraph("Data: 22 de febrer de 2026 &nbsp; | &nbsp; Curs escolar: 2024-2025 → 2025-2026", style_subtitle))
story.append(Spacer(1, 6))
add_hr()

# ═══════════════════════════════════════════════════════════════════════
# SUMMARY TABLE
# ═══════════════════════════════════════════════════════════════════════
story.append(Paragraph("Resum", style_h1))

avail = PAGE_W - 2 * MARGIN
summary_table = make_table(
    ["Inconsistència", "Alumnes afectats"],
    [
        ["1. Alumnes a Clickedu sense dades de traspàs als Excels", "30"],
        ["2. Alumnes als Excels que no existeixen a Clickedu", "22 (16 persones úniques)"],
        ["3. Alumnes amb registre NESE sense graella_nese al traspàs", "56"],
    ],
    col_widths=[avail * 0.8, avail * 0.2],
)
story.append(summary_table)
story.append(Spacer(1, 6))
add_hr()

# ═══════════════════════════════════════════════════════════════════════
# SECTION 1
# ═══════════════════════════════════════════════════════════════════════
story.append(Paragraph("1. Alumnes a Clickedu sense dades de traspàs als Excels", style_h1))
story.append(Paragraph(
    "Aquests 30 alumnes consten a la base de dades de Clickedu (són alumnes actius del centre) "
    "però <b>no apareixen a cap dels Excels de traspàs de tutories</b>. Per tant, no tenim cap "
    "dada de traspàs (dades familiars, acadèmiques, comportament, acords de tutoria, etc.) per a ells.",
    style_body
))
story.append(make_note_box(
    "<b>Nota:</b> S'han exclòs els 21 alumnes d'Infantil 3, ja que són nous al centre "
    "i és esperable que no tinguin traspàs previ."
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "<b>Acció necessària:</b> Confirmeu si aquests alumnes haurien de tenir fitxa de traspàs "
    "o si és correcte que no en tinguin.",
    style_action
))

# Section 1 data
s1_groups = [
    ("Infantil 4 (1 alumne)", [
        ["German Isaac", "Castro Navas"],
    ]),
    ("Infantil 5 (1 alumne)", [
        ["Zixi", "Yang"],
    ]),
    ("Cinquè de Primària (1 alumne)", [
        ["Danial", "Amjid Khanum"],
    ]),
    ("Sisè de Primària (2 alumnes)", [
        ["Pol", "Carmona Romera"],
        ["Daniela", "Díaz González"],
    ]),
    ("Segon de Primària — repetidor (1 alumne)", [
        ["Anderson Saul", "Martínez Coronel"],
    ]),
    ("Quart de Primària (19 alumnes)", [
        ["Sara", "Amjid Khanum"],
        ["Ferdaus", "Boukayour Chahbouni"],
        ["Yassine", "Chamlal"],
        ["Ashly Jhoana", "Duarte Hernández"],
        ["Yahya", "El Haddouchi"],
        ["Gerard", "García Saavedra"],
        ["Alma", "González Mateo"],
        ["Haroun", "Harrak El Jibari"],
        ["Núria", "Hernández Villodres"],
        ["Eimy Gabriela", "Jiménez Mina"],
        ["Iyad", "Lorenzo El Faraa"],
        ["Roumayssae", "Maalem"],
        ["Marc", "Martínez Fernández"],
        ["Sergio", "Murcia Díaz"],
        ["Aroa", "Ortiz Rhu"],
        ["Martí", "Poveda López"],
        ["Maria Elisabet", "Ramos Sánchez"],
        ["Kimberly Andrea", "Romero León"],
        ["Andrea", "Vilamala Ros"],
    ]),
    ("Primer d'ESO (3 alumnes)", [
        ["Cesar", "Granado Cortés"],
        ["Walid", "Mounachit El Guennouni"],
        ["Jaqueline Dayanara", "Vega Solaeche"],
    ]),
    ("Tercer d'ESO (1 alumne)", [
        ["Alae", "Harrak El Jibari"],
    ]),
    ("Quart d'ESO (2 alumnes)", [
        ["Soufiane", "Chamlal"],
        ["Alfonso Gerardo", "Lunar Flores"],
    ]),
]

for group_name, rows in s1_groups:
    story.append(Paragraph(group_name, style_h2))
    t = make_table(["Nom", "Cognoms"], rows, col_widths=[avail * 0.35, avail * 0.65])
    story.append(t)

add_hr()

# ═══════════════════════════════════════════════════════════════════════
# SECTION 2
# ═══════════════════════════════════════════════════════════════════════
story.append(Paragraph("2. Alumnes als Excels que no existeixen a Clickedu", style_h1))
story.append(Paragraph(
    "Aquests 22 registres (16 persones úniques) apareixen als Excels de traspàs i/o NESE "
    "però <b>no s'han pogut trobar a la base de dades de Clickedu</b>. Les seves dades no s'han pogut importar.",
    style_body
))
story.append(Paragraph(
    "<b>Acció necessària:</b> Confirmeu si aquests alumnes han causat baixa, han canviat de centre, "
    "o si es tracta d'errors als Excels. Si han de continuar al centre, caldria donar-los d'alta a Clickedu.",
    style_action
))

s2_groups = [
    ("Infantil 3 (1 alumne)", [
        ["Júlia Serrano", "NESE INF", "Sospita TEA. CDIAP setmanal. Baixa des del maig per motius personals."],
    ]),
    ("Segon de Primària (1 alumne)", [
        ["Andy Martínez", "Traspàs PRI", "Nouvingut a final de curs 2025. Retenció a 2n. Monoparental. Molt disruptiu."],
    ]),
    ("Tercer de Primària (1 alumne)", [
        ["Alba Borrego", "NESE PRI", "Canvia d'escola el curs 25-26. Sessions quinzenals amb psicòloga."],
    ]),
    ("Primer d'ESO (1 alumne)", [
        ["Júlia Ríos Carmona", "Traspàs ESO + NESE ESO", "Discalcúlia i Dislèxia (informe 2020 CGO). Logopeda."],
    ]),
    ("Segon d'ESO (1 alumne)", [
        ["Abram Cortés Jiménez", "Traspàs ESO + NESE ESO", "SSD. Retenció 1r PRI. Preinscripció CFGB Miquel Biada."],
    ]),
    ("Tercer d'ESO (3 alumnes)", [
        ["Lucas Cortés", "NESE ESO", "UEC (Salesians). Causa baixa al complir 16 anys."],
        ["Marc Alsinet Ortega", "Traspàs ESO + NESE ESO", "TDAH (F90.2) combinat. Dislèxia. Concerta. Coach setmanal."],
        ["Tanisha Kishor Rani", "Traspàs ESO + NESE ESO", "SSD. Pare amb ordre d'allunyament. Pis de protecció. SS."],
    ]),
    ("Quart d'ESO (8 alumnes)", [
        ["Pau Moragas", "NESE ESO", "Acceleració progressiva des de 4t PRI. Segueix amb normalitat."],
        ["Nàhia Segarra", "NESE ESO", "TEA (ITA 2024). Protocol absentisme, no assisteix a classe."],
        ["Yanira Jiménez", "NESE ESO", "Absentisme des d'octubre. Intenció de baixa als 16 anys. SS."],
        ["Natalia Giménez", "NESE ESO", "No ha assistit cap dia a classe. Protocol absentisme. Ja té 16 anys."],
        ["Lucía Martínez", "NESE ESO", "Dislèxia (falta informe). Li costa memoritzar."],
        ["Donovan Romero", "NESE ESO", "Nouvingut 17/18. PI NISE fins 6è. SSD. No segueix el ritme."],
        ["Lucía Valdivia", "NESE ESO", "Dislèxia (informe Volta 2020). Segueix amb normalitat."],
        ["Javier Sarrias", "NESE ESO", "Protocol absentisme. Preinscripció PFI perruqueria. SS. Fiscalia."],
        ["Ruchita Kishor", "NESE ESO", "SSD. Incorporació octubre 2024. SS Pineda. Divorci pares."],
        ["Alisa Miroliubova", "NESE ESO", "NISE. Nouvinguda de Rússia (febrer 2024)."],
    ]),
]

for group_name, rows in s2_groups:
    story.append(Paragraph(group_name, style_h2))
    t = make_table(
        ["Nom", "Font Excel", "Notes"],
        rows,
        col_widths=[avail * 0.22, avail * 0.22, avail * 0.56],
    )
    story.append(t)

add_hr()

# ═══════════════════════════════════════════════════════════════════════
# SECTION 3
# ═══════════════════════════════════════════════════════════════════════
story.append(Paragraph(
    "3. Alumnes amb registre NESE sense indicació de graella_nese al traspàs",
    style_h1
))
story.append(Paragraph(
    "Aquests 56 alumnes tenen un registre a la <b>graella NESE</b> (Excels de NESE per nivell) "
    "però <b>no estan marcats com a graella_nese = true</b> a la seva fitxa de traspàs de tutories. "
    "Això pot ser correcte (alumnes amb seguiment SSD o observació que no estan formalment a la graella NESE del traspàs) "
    "o pot indicar una manca de coordinació entre les dues fonts.",
    style_body
))
story.append(Paragraph(
    "<b>Acció necessària:</b> Reviseu si aquests alumnes haurien de tenir graella_nese = true "
    "al traspàs o si és correcte que no el tinguin.",
    style_action
))

# NESE summary
story.append(Paragraph("Resum per tipus de situació NESE:", style_h2))
nese_summary = make_table(
    ["Tipus", "Alumnes"],
    [
        ["Sense NISE definit (seguiment, observació, SSD)", "32"],
        ['NISE = "no" (explícitament sense NISE, però amb seguiment)', "15"],
        ['NISE = "nise" (amb NISE reconegut, sense marcar al traspàs)', "7"],
        ['NISE = "sls" (Situació Lleu de Salut)', "2"],
    ],
    col_widths=[avail * 0.8, avail * 0.2],
)
story.append(nese_summary)

s3_headers = ["Nom", "Cognoms", "SSD", "NISE", "Mesura", "Detall"]
s3_widths = [avail * 0.12, avail * 0.16, avail * 0.05, avail * 0.06, avail * 0.10, avail * 0.51]

s3_groups = [
    ("Infantil 4 (4 alumnes)", [
        ["Daniela", "Alberich Díaz", "No", "—", "DUA/MISU", "Possible trastorn del llenguatge expressiu (CDIAP). Logopeda setmanal."],
        ["Ouissal", "Grain", "Sí", "—", "—", "—"],
        ["Leo", "Ibáñez Burgos", "No", "—", "DUA/MISU", "Retard del desenvolupament del llenguatge (CDIAP). Logopeda quinzenal."],
        ["Zakaria", "Rahhli Azahriou", "Sí", "—", "—", "—"],
    ]),
    ("Infantil 5 (6 alumnes)", [
        ["Malak", "Chmanti Haouari", "Sí", "—", "—", "—"],
        ["Fatima", "El Khayat", "Sí", "—", "—", "—"],
        ["Malak", "Ghanoura", "Sí", "—", "—", "—"],
        ["Yassin", "Grain", "Sí", "—", "—", "—"],
        ["Yanis", "Maati El Abbassi", "Sí", "—", "—", "—"],
        ["Rodaina", "Ziadi", "Sí", "—", "—", "—"],
    ]),
    ("Primer de Primària (5 alumnes)", [
        ["Janat", "Bilal", "Sí", "—", "—", "—"],
        ["Adama", "Dabo", "Sí", "—", "—", "—"],
        ["Hawa", "Dabo", "Sí", "—", "—", "—"],
        ["Oumaya", "El Khayat", "Sí", "—", "—", "—"],
        ["Alae", "El Mansouri", "Sí", "—", "—", "—"],
    ]),
    ("Segon de Primària (2 alumnes)", [
        ["Zeinabu", "Ganess Kaloga", "Sí", "No", "S/mesures", "Dificultats gestió emocional. Candidata beca MEC."],
        ["Anderson S.", "Martínez Coronel", "Sí", "NISE", "—", "Nouvingut abril 2025. Nivell molt baix. Retenció a 2n."],
    ]),
    ("Quart de Primària (10 alumnes)", [
        ["Ferdaus", "Boukayour C.", "Sí", "—", "PI", "TDL (informe EAP). CAD 33%. Logopeda CLER quinzenal."],
        ["Yassine", "Chamlal", "Sí", "NISE", "—", "Nouvingut del Marroc (maig 2025). Cal PI nouvingut 25/26."],
        ["Ashly J.", "Duarte H.", "Sí", "NISE", "PI", "Nouvinguda de Veneçuela. PI nouvinguda. Pla Educatiu d'Entorn."],
        ["Núria", "Hernández V.", "No", "—", "DUA/MISU", "Psicòloga mensual. Estancament acadèmic. Possible TDAH."],
        ["Iyad", "Lorenzo El Faraa", "No", "—", "S/mesures", "TDAH + rasgos TEA a estudi. CSMIJ. Medicació Atenza 27mg."],
        ["Marc", "Martínez F.", "No", "—", "PI", "Dislèxia (indicis). Teràpia visual. PI signat 20/12/2024."],
        ["Sergio", "Murcia Díaz", "No", "—", "—", "Nivell molt baix. Millora progressiva. Pla Educatiu d'Entorn."],
        ["Kimberly A.", "Romero León", "Sí", "—", "—", "Ritme lent, baixa autoestima. Pla Educatiu d'Entorn."],
        ["Andrea", "Vilamala Ros", "No", "—", "—", "Millora lectoescriptura. Visió 10% ull dret."],
    ]),
    ("Cinquè de Primària (4 alumnes)", [
        ["Júlia", "Avila González", "No", "—", "—", "Problemes de relació. Es recomana teràpia comunicació."],
        ["Moisès", "Cortés Jiménez", "Sí", "—", "—", "Pla Educatiu d'Entorn. Família en seguiment de SS."],
        ["Ona", "García López", "No", "—", "—", "Tractament hormonal (nov 24-25)."],
        ["Vega", "Mayordomo C.", "No", "—", "—", "Acompanyant emocional mensual (centre Kènia)."],
    ]),
    ("Sisè de Primària (5 alumnes)", [
        ["Diego José", "Castro Soliz", "Sí", "—", "S/mesures", "—"],
        ["Amani", "El Mamouni", "Sí", "—", "—", "—"],
        ["Blanca", "Meca Martínez", "No", "—", "S/mesures", "Deficiència auditiva del 90%."],
        ["Lucas", "Valdivia Moreno", "No", "—", "—", "—"],
        ["Nourhan", "Ziadi", "Sí", "—", "—", "Baixa acadèmica i emocional al 3r trimestre."],
    ]),
    ("Tercer d'ESO (10 alumnes)", [
        ["Insaf", "Aghaddar", "Sí", "SLS", "—", "MISU en llengües i mates. Candidata beca MEC."],
        ["Jan", "Baldà Ortego", "No", "No", "—", "Psicòloga privada quinzenal. Candidat beca MEC."],
        ["Pol", "Gil Amor", "No", "No", "—", "Dislèxia + TDAH. Dificultats gestió emocional. Candidat beca MEC."],
        ["Daniel", "Martínez F.", "No", "No", "—", "TDAH inatent. Dislèxia severa. Pla Ed. Entorn. Candidat beca MEC."],
        ["Brian", "Pousada M.", "No", "SLS", "—", "No aprofita repetició. De Cuba (2022). Candidat beca MEC."],
        ["Julen", "Robledo G.", "No", "No", "—", "Pendent diagnòstic (psico CAP). Absentisme. Candidat beca MEC."],
        ["Dayana S.", "Sandoval E.", "Sí", "NISE", "—", "PI nouvinguda. Evolució complicada. Candidata beca MEC."],
        ["Mahamadou", "Sillah Sillah", "Sí", "No", "—", "Dificultats llengües, mates, física. Valorar PFI."],
        ["Anyelisteici", "Varela A.", "Sí", "NISE", "—", "PI nouvinguda. Psicòloga CAP quinzenal. Candidata beca MEC."],
    ]),
    ("Quart d'ESO (10 alumnes)", [
        ["Abdel B.", "Ahdor", "Sí", "No", "—", "Informe NESE Annex 1. PI retirat a final de 2n ESO."],
        ["Soufiane", "Chamlal", "Sí", "NISE", "—", "Nouvingut del Marroc (maig 2025). No parla cap llengua local."],
        ["Jan", "Gascons P.", "No", "No", "—", "TDAH + trastorn comunicació social. CSMIJ. Psicòloga privada."],
        ["Aicha", "Ndiaye", "Sí", "No", "—", "Dificultats però motivada. Reforç escolar."],
        ["Fatima", "Ndiaye", "Sí", "No", "—", "Retard greu de l'aprenentatge (NESE Annex 1). Reforç escolar."],
        ["Graciela", "Noguera A.", "Sí", "No", "—", "Centre obert Salesians. SS. Psico. Derivació psiquiatria."],
        ["Danna G.", "Paz Melgara", "Sí", "NISE", "—", "Incorporació setembre 2023."],
        ["Daniel", "Picazo P.", "No", "No", "—", "Possible dislèxia (valoració EAP). Candidat beca MEC."],
        ["Guillem", "Rodríguez P.", "No", "No", "—", "TEA + TDAH combinat + Tr. adaptatiu. Psicòloga privada."],
        ["Maija", "Scedrova", "Sí", "—", "—", "PI nouvinguda retirat. MISU català (retirant-se)."],
        ["Pol", "Vivó Cortés", "No", "No", "—", "TDAH + Dislèxia (2025). Psicòloga. Reforç escolar. MISU català."],
        ["Pengxiang", "Yin", "Sí", "No", "—", "TEA + TEL. CSMIJ. Informe NESE Annex 1. Candidat beca MEC."],
    ]),
]

for group_name, rows in s3_groups:
    story.append(Paragraph(group_name, style_h2))
    t = make_table(s3_headers, rows, col_widths=s3_widths)
    story.append(t)

add_hr()

# ═══════════════════════════════════════════════════════════════════════
# NOTES
# ═══════════════════════════════════════════════════════════════════════
story.append(Paragraph("Notes per als professors", style_h1))

notes = [
    "<b>Secció 1:</b> Reviseu si aquests alumnes haurien de tenir fitxa de traspàs o si és correcte que no en tinguin.",
    "<b>Secció 2:</b> Alguns d'aquests alumnes probablement han causat <b>baixa</b> "
    "(Lucas Cortés — UEC, Alba Borrego — canvi d'escola, Natalia Giménez — 16 anys, "
    "Yanira Jiménez — 16 anys). Confirmeu la situació de cadascun.",
    "<b>Secció 3:</b> Molts alumnes amb <b>SSD</b> (Servei de Suport a la Diversitat) "
    "apareixen a les graelles NESE però no estan marcats al traspàs. Això pot ser intencionat o un oblit. "
    "Si us plau, reviseu si cal marcar-los com a graella_nese = true al traspàs.",
    "<b>Alumnes que apareixen a les seccions 1 i 3:</b> Hi ha alumnes que apareixen a ambdues seccions "
    "(per exemple, Ferdaus Boukayour, Yassine Chamlal, Ashly Jhoana Duarte, etc.). "
    "Aquests alumnes tenen dades NESE però no tenen cap dada de traspàs. "
    "Cal revisar si s'han oblidat d'omplir el traspàs o si hi ha algun altre motiu.",
]

for i, note in enumerate(notes, 1):
    story.append(Paragraph(f"{i}. {note}", style_body))
    story.append(Spacer(1, 4))

story.append(Spacer(1, 20))
add_hr()
story.append(Paragraph(
    "Informe generat automàticament per Turonia a partir de les dades dels Excels de traspàs i NESE del curs 2024-2025.",
    style_footer
))


# ── Page numbering ──────────────────────────────────────────────────────
def add_page_number(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(MUTED)
    page_num = canvas_obj.getPageNumber()
    text = f"Pàgina {page_num}"
    canvas_obj.drawCentredString(PAGE_W / 2, 1.2 * cm, text)
    # Header line
    canvas_obj.setStrokeColor(BORDER_COLOR)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(MARGIN, PAGE_H - 2 * cm, PAGE_W - MARGIN, PAGE_H - 2 * cm)
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.drawString(MARGIN, PAGE_H - 1.8 * cm, "Escola el Turó — Informe d'inconsistències BD")
    canvas_obj.drawRightString(PAGE_W - MARGIN, PAGE_H - 1.8 * cm, "22/02/2026")
    canvas_obj.restoreState()


# ── Build ───────────────────────────────────────────────────────────────
doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
print(f"PDF generated: {os.path.abspath(output_path)}")
