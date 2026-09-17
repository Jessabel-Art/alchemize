from __future__ import annotations

import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "content" / "downloadable-resources"
SOURCE_DIR_ES = SOURCE_DIR / "es"
OUTPUT_DIR = ROOT / "public" / "assets" / "downloads"
OUTPUT_DIR_ES = OUTPUT_DIR / "es"

CONTENT_WIDTH = 7.12 * inch

# ---- Brand palette --------------------------------------------------------
NAVY = colors.HexColor("#213745")
TEAL = colors.HexColor("#0B4332")
GOLD = colors.HexColor("#D7B05F")
RUST = colors.HexColor("#8F5430")
CREAM = colors.HexColor("#F3F0ED")
WARM = colors.HexColor("#E9E5DF")
SOFT = colors.HexColor("#52636A")
WHITE = colors.white
RULE = colors.HexColor("#C9C2B8")
ROW_TINT = colors.HexColor("#F8F6F2")
TEAL_TINT = colors.HexColor("#E3EEE8")
GOLD_TINT = colors.HexColor("#F5E9CE")
RUST_TINT = colors.HexColor("#F0E3D7")
NAVY_TINT = colors.HexColor("#E5E9EC")

pdfmetrics.registerFont(TTFont("Inter", ROOT / "public/assets/fonts/inter-400.ttf"))
pdfmetrics.registerFont(TTFont("Inter-Medium", ROOT / "public/assets/fonts/inter-500.ttf"))
pdfmetrics.registerFont(TTFont("Inter-Semibold", ROOT / "public/assets/fonts/inter-600.ttf"))
pdfmetrics.registerFont(TTFont("Cormorant", ROOT / "public/assets/fonts/cormorant-garamond-600.ttf"))

STYLES = {
    "eyebrow": ParagraphStyle("eyebrow", fontName="Inter-Semibold", fontSize=7.4, leading=9.4, textColor=TEAL, spaceAfter=8),
    "title": ParagraphStyle("title", fontName="Cormorant", fontSize=28, leading=29, textColor=NAVY, spaceAfter=7),
    "subtitle": ParagraphStyle("subtitle", fontName="Inter", fontSize=9.6, leading=13.6, textColor=SOFT, spaceAfter=10),
    "page_title": ParagraphStyle("page_title", fontName="Cormorant", fontSize=19, leading=21, textColor=NAVY, spaceAfter=7),
    "section": ParagraphStyle("section", fontName="Inter-Semibold", fontSize=9.2, leading=11.2, textColor=TEAL),
    "subsection": ParagraphStyle("subsection", fontName="Inter-Semibold", fontSize=8, leading=10, textColor=NAVY, spaceBefore=4, spaceAfter=3),
    "section_num": ParagraphStyle("section_num", fontName="Inter-Semibold", fontSize=7.6, leading=9, textColor=WHITE, alignment=TA_CENTER),
    "body": ParagraphStyle("body", fontName="Inter", fontSize=8.0, leading=10.8, textColor=NAVY, spaceAfter=4.5),
    "small": ParagraphStyle("small", fontName="Inter", fontSize=6.9, leading=9.0, textColor=SOFT),
    "check": ParagraphStyle("check", fontName="Inter", fontSize=7.6, leading=10.2, textColor=NAVY, leftIndent=1),
    "prompt": ParagraphStyle("prompt", fontName="Inter-Medium", fontSize=7.4, leading=9.2, textColor=NAVY),
    "callout_title": ParagraphStyle("callout_title", fontName="Inter-Semibold", fontSize=7.9, leading=10, textColor=TEAL, spaceAfter=2.5),
    "callout": ParagraphStyle("callout", fontName="Inter", fontSize=7.3, leading=9.7, textColor=NAVY),
    "table_head": ParagraphStyle("table_head", fontName="Inter-Semibold", fontSize=6.5, leading=7.8, textColor=WHITE, alignment=TA_LEFT),
    "table_cell": ParagraphStyle("table_cell", fontName="Inter", fontSize=6.3, leading=7.7, textColor=NAVY),
    "table_cell_center": ParagraphStyle("table_cell_center", fontName="Inter", fontSize=7.2, leading=8.6, textColor=NAVY, alignment=TA_CENTER),
    "chip": ParagraphStyle("chip", fontName="Inter-Semibold", fontSize=6.3, leading=7.6, textColor=NAVY, alignment=TA_CENTER),
    "micro_label": ParagraphStyle("micro_label", fontName="Inter-Semibold", fontSize=6.1, leading=7.4, textColor=WHITE, alignment=TA_CENTER),
    "micro_body": ParagraphStyle("micro_body", fontName="Inter", fontSize=7.5, leading=10, textColor=NAVY),
    "outcome": ParagraphStyle("outcome", fontName="Inter", fontSize=8.0, leading=10.8, textColor=NAVY),
    "meta_label": ParagraphStyle("meta_label", fontName="Inter-Semibold", fontSize=6.6, leading=8.2, textColor=TEAL, spaceAfter=1),
    "meta_value": ParagraphStyle("meta_value", fontName="Inter", fontSize=7.6, leading=10, textColor=NAVY),
    "cta_kicker": ParagraphStyle("cta_kicker", fontName="Inter-Semibold", fontSize=7.4, leading=9.4, textColor=GOLD, spaceAfter=4),
    "cta_title": ParagraphStyle("cta_title", fontName="Cormorant", fontSize=16, leading=18, textColor=WHITE, spaceAfter=5),
    "cta_body": ParagraphStyle("cta_body", fontName="Inter", fontSize=8.4, leading=11.6, textColor=colors.HexColor("#EDEFF0")),
    "cta_link": ParagraphStyle("cta_link", fontName="Inter-Semibold", fontSize=8, leading=10, textColor=GOLD, spaceBefore=6),
    "scale_anchor": ParagraphStyle("scale_anchor", fontName="Inter-Medium", fontSize=6.6, leading=8, textColor=SOFT),
    "matrix_axis": ParagraphStyle("matrix_axis", fontName="Inter-Semibold", fontSize=6.6, leading=8, textColor=SOFT, alignment=TA_CENTER),
    "matrix_q_label": ParagraphStyle("matrix_q_label", fontName="Inter-Semibold", fontSize=7.2, leading=9.2, textColor=NAVY),
    "timeline_label": ParagraphStyle("timeline_label", fontName="Inter-Semibold", fontSize=6.6, leading=8, textColor=NAVY, alignment=TA_CENTER),
    "timeline_label_light": ParagraphStyle("timeline_label_light", fontName="Inter-Semibold", fontSize=6.6, leading=8, textColor=WHITE, alignment=TA_CENTER),
}

FOOTER_STRINGS = {
    "en": {"page": "Page", "version": "Version 1.0  ·  September 2026", "library": "ALCHEMIZE RESOURCE LIBRARY"},
    "es": {"page": "Página", "version": "Versión 1.0  ·  septiembre de 2026", "library": "ALCHEMIZE RESOURCE LIBRARY"},
}
OUTCOME_LABEL = {"en": "USE THIS WORKBOOK TO", "es": "USE ESTE CUADERNO PARA"}
TIME_LABEL = {"en": "ESTIMATED TIME", "es": "TIEMPO ESTIMADO"}
NEARBY_LABEL = {"en": "HAVE NEARBY", "es": "TENGA A LA MANO"}
NEXT_STEP_LABEL = {"en": "NEXT STEP", "es": "SIGUIENTE PASO"}


class WorksheetDoc(BaseDocTemplate):
    def __init__(self, filename: Path, metadata: dict[str, str], locale: str):
        self.metadata = metadata
        # Named "locale", not "lang" -- BaseDocTemplate's own _initArgs
        # already defines a "lang" property (PDF accessibility language
        # tag) and resets it to None during super().__init__(), which
        # silently clobbers a same-named custom attribute set beforehand.
        self.locale = locale
        super().__init__(
            str(filename),
            pagesize=letter,
            leftMargin=.58 * inch,
            rightMargin=.58 * inch,
            topMargin=.62 * inch,
            bottomMargin=.56 * inch,
            title=metadata["title"],
            author="Alchemize Business Services",
            subject=metadata["subtitle"],
            lang="es-ES" if locale == "es" else "en-US",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(PageTemplate(id="resource", frames=[frame], onPage=self.decorate))

    def decorate(self, canvas, doc):
        canvas.saveState()
        width, height = letter
        strings = FOOTER_STRINGS[self.locale]
        canvas.setStrokeColor(GOLD)
        canvas.setLineWidth(1.2)
        canvas.line(self.leftMargin, height - .35 * inch, width - self.rightMargin, height - .35 * inch)
        logo = ROOT / "public/assets/logos/alchemize-logo-dark.png"
        if logo.exists():
            canvas.drawImage(str(logo), self.leftMargin, height - .30 * inch, width=1.05 * inch, height=.20 * inch, preserveAspectRatio=True, anchor="sw", mask="auto")
        canvas.setFont("Inter", 5.6)
        canvas.setFillColor(SOFT)
        canvas.drawRightString(width - self.rightMargin, height - .195 * inch, strings["library"])
        canvas.setFont("Inter-Semibold", 6.2)
        canvas.setFillColor(TEAL)
        canvas.drawRightString(width - self.rightMargin, height - .285 * inch, self.metadata["category"].upper())
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(.45)
        canvas.line(self.leftMargin, .38 * inch, width - self.rightMargin, .38 * inch)
        canvas.setFont("Inter", 5.9)
        canvas.setFillColor(SOFT)
        canvas.drawString(self.leftMargin, .22 * inch, f'{self.metadata["short"]}  |  {strings["version"]}')
        canvas.drawCentredString(width / 2, .22 * inch, "getalchemize.com")
        canvas.drawRightString(width - self.rightMargin, .22 * inch, f'{strings["page"]} {doc.page}')
        canvas.restoreState()


def safe(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def p(text: str, style: str = "body") -> Paragraph:
    return Paragraph(safe(text), STYLES[style])


# ---- Core primitives -------------------------------------------------------

def checkbox(text: str) -> Table:
    box = Table([["", p(text, "check")]], colWidths=[.19 * inch, 6.8 * inch])
    box.setStyle(TableStyle([
        ("BOX", (0, 0), (0, 0), 1.1, NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 5.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (0, 0), 3),
        ("TOPPADDING", (0, 0), (0, 0), 3),
    ]))
    return box


def writing_lines(label: str, count: int) -> list:
    rows = [[p(label, "prompt")]] + [[""] for _ in range(count)]
    row_heights = [.22 * inch] + [.26 * inch] * count
    table = Table(rows, colWidths=[7.15 * inch], rowHeights=row_heights)
    commands = [("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]
    for row in range(1, count + 1):
        commands.append(("LINEBELOW", (0, row), (0, row), .4, RULE))
    table.setStyle(TableStyle(commands))
    return [table, Spacer(1, 5)]


def box(title: str, body_text: str, accent, tint) -> Table:
    inner = [p(title, "callout_title"), p(body_text, "callout")]
    table = Table([[inner]], colWidths=[CONTENT_WIDTH])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), tint),
        ("BOX", (0, 0), (-1, -1), .5, accent),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 6.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6.5),
    ]))
    return table


def callout(title: str, body_text: str) -> Table:
    return box(title, body_text, GOLD, CREAM)


def example_box(title: str, body_text: str) -> Table:
    return box(title, body_text, TEAL, TEAL_TINT)


def watch_box(title: str, body_text: str) -> Table:
    return box(title, body_text, RUST, RUST_TINT)


def micro(label: str, text: str) -> Table:
    chip_cell = Table([[Paragraph(label.upper(), STYLES["micro_label"])]], colWidths=[1.12 * inch])
    chip_cell.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    body_cell = p(text, "micro_body")
    row = Table([[chip_cell, body_cell]], colWidths=[1.22 * inch, 5.9 * inch])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (1, 0), (1, 0), 10),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return row


def chips(labels: list[str]) -> list:
    n = len(labels)
    gap_w = 0.07 * inch
    chip_w = (CONTENT_WIDTH - gap_w * (n - 1)) / n
    row = []
    widths = []
    cmds = [("VALIGN", (0, 0), (-1, -1), "MIDDLE")]
    col = 0
    for i, label in enumerate(labels):
        row.append(p(label.upper(), "chip"))
        widths.append(chip_w)
        cmds += [
            ("BACKGROUND", (col, 0), (col, 0), WARM),
            ("BOX", (col, 0), (col, 0), .5, RULE),
            ("ALIGN", (col, 0), (col, 0), "CENTER"),
        ]
        col += 1
        if i < n - 1:
            row.append("")
            widths.append(gap_w)
            col += 1
    cmds += [
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    table = Table([row], colWidths=widths)
    table.setStyle(TableStyle(cmds))
    return [table, Spacer(1, 7)]


def scale(prompt: str, left_anchor: str, right_anchor: str, segments: int) -> list:
    numbered = [p(str(i + 1), "chip") for i in range(segments)]
    seg_width = 0.34 * inch
    anchor_width = (CONTENT_WIDTH - seg_width * segments) / 2
    widths = [anchor_width] + [seg_width] * segments + [anchor_width]
    row = [p(left_anchor, "scale_anchor")] + numbered + [p(right_anchor, "scale_anchor")]
    table = Table([row], colWidths=widths, rowHeights=[.3 * inch])
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (-2, 0), "CENTER"),
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("ALIGN", (-1, 0), (-1, 0), "RIGHT"),
        ("BOX", (1, 0), (-2, 0), 0.7, NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
    ]
    for i in range(segments - 1):
        cmds.append(("LINEAFTER", (1 + i, 0), (1 + i, 0), 0.7, NAVY))
    table.setStyle(TableStyle(cmds))
    return [p(prompt, "prompt"), Spacer(1, 3), table, Spacer(1, 8)]


def matrix(title: str, x_left: str, x_right: str, y_top: str, y_bottom: str, q1: str, q2: str, q3: str, q4: str) -> list:
    header_row = ["", p(x_left, "matrix_axis"), p(x_right, "matrix_axis")]
    row1 = [p(y_top, "matrix_axis"), p(q1, "matrix_q_label"), p(q2, "matrix_q_label")]
    row2 = [p(y_bottom, "matrix_axis"), p(q3, "matrix_q_label"), p(q4, "matrix_q_label")]
    data = [header_row, row1, row2]
    axis_width = 0.95 * inch
    widths = [axis_width, (CONTENT_WIDTH - axis_width) / 2, (CONTENT_WIDTH - axis_width) / 2]
    heights = [0.24 * inch, 1.15 * inch, 1.15 * inch]
    table = Table(data, colWidths=widths, rowHeights=heights)
    table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, 0), "BOTTOM"),
        ("VALIGN", (0, 1), (0, -1), "MIDDLE"),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("VALIGN", (1, 1), (-1, -1), "TOP"),
        ("BOX", (1, 1), (1, -1), .6, RULE),
        ("BOX", (2, 1), (2, -1), .6, RULE),
        ("BACKGROUND", (1, 1), (1, 1), GOLD_TINT),
        ("BACKGROUND", (2, 1), (2, 1), TEAL_TINT),
        ("BACKGROUND", (1, 2), (1, 2), NAVY_TINT),
        ("BACKGROUND", (2, 2), (2, 2), WARM),
        ("GRID", (1, 1), (-1, -1), .6, RULE),
        ("LEFTPADDING", (1, 1), (-1, -1), 9),
        ("RIGHTPADDING", (1, 1), (-1, -1), 9),
        ("TOPPADDING", (1, 1), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
    ]))
    result = []
    if title:
        result.append(p(title, "prompt"))
        result.append(Spacer(1, 3))
    # KeepTogether: a 2x2 matrix must never split its quadrant rows across
    # a page break.
    result.append(KeepTogether([table]))
    result.append(Spacer(1, 9))
    return result


def timeline(steps: list[str]) -> list:
    n = len(steps)
    arrow_w = 0.2 * inch
    step_w = (CONTENT_WIDTH - arrow_w * (n - 1)) / n
    row = []
    widths = []
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    col = 0
    for i, step in enumerate(steps):
        is_edge = i == 0 or i == n - 1
        row.append(p(step, "timeline_label_light" if is_edge else "timeline_label"))
        widths.append(step_w)
        cmds += [
            ("BACKGROUND", (col, 0), (col, 0), TEAL if i == 0 else (GOLD if i == n - 1 else CREAM)),
            ("BOX", (col, 0), (col, 0), .6, TEAL if i < n - 1 else GOLD),
            ("ALIGN", (col, 0), (col, 0), "CENTER"),
        ]
        col += 1
        if i < n - 1:
            row.append(p("→", "timeline_label"))
            widths.append(arrow_w)
            cmds.append(("ALIGN", (col, 0), (col, 0), "CENTER"))
            col += 1
    table = Table([row], colWidths=widths)
    table.setStyle(TableStyle(cmds))
    return [table, Spacer(1, 8)]


def section_heading(text: str, number: int) -> list:
    badge = Table([[Paragraph(str(number).zfill(2), STYLES["section_num"])]], colWidths=[.28 * inch], rowHeights=[.2 * inch])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), TEAL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    title = p(text.upper(), "section")
    row = Table([[badge, title]], colWidths=[.36 * inch, 6.76 * inch])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [Spacer(1, 4), row, Spacer(1, 3.5)]


def cta_box(headline: str, body_text: str, lang: str) -> Table:
    inner = [p(NEXT_STEP_LABEL[lang], "cta_kicker")]
    if headline:
        inner.append(p(headline, "cta_title"))
    inner.append(p(body_text, "cta_body"))
    inner.append(p("getalchemize.com", "cta_link"))
    table = Table([[inner]], colWidths=[CONTENT_WIDTH])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("TOPPADDING", (0, 0), (-1, -1), 15),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
    ]))
    return table


def render_rating_table(rows: list[list[str]]) -> Table:
    data = []
    for idx, row in enumerate(rows):
        if idx == 0:
            cleaned = [cell.strip() for cell in row]
            data.append([p(cleaned[0], "table_head"), p("1", "table_head"), p("2", "table_head"), p("3", "table_head"), p("4", "table_head"), p("5", "table_head"), p(cleaned[6] if len(cleaned) > 6 else "Notes", "table_head")])
            continue
        area = row[0].strip() if row else ""
        values = []
        for cell in row[1:6]:
            text = cell.strip()
            values.append("○" if text in {"[ ]", "", "○"} else "●")
        notes = row[6].strip() if len(row) > 6 else ""
        data.append([p(area, "table_cell"), p(values[0], "table_cell_center"), p(values[1], "table_cell_center"), p(values[2], "table_cell_center"), p(values[3], "table_cell_center"), p(values[4], "table_cell_center"), p(notes, "table_cell")])
    widths = [2.0 * inch, .46 * inch, .46 * inch, .46 * inch, .46 * inch, .46 * inch, 2.22 * inch]
    table = Table(data, colWidths=widths, rowHeights=[None] + [.46 * inch] * (len(data) - 1), repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), .45, RULE),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, ROW_TINT]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 1), (-2, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def render_dashboard_table(rows: list[list[str]]) -> Table:
    header = [p(rows[0][0].strip(), "table_head")] + [p(cell.strip(), "table_head") for cell in rows[0][1:]]
    data = [header]
    tints = [WARM, GOLD_TINT, TEAL_TINT, NAVY_TINT]
    for row in rows[1:]:
        area = row[0].strip()
        cells = [p(area, "table_cell")]
        for cell in row[1:]:
            text = cell.strip()
            glyph = "☐" if text in {"[ ]", "", "○"} else text
            cells.append(p(glyph, "table_cell_center"))
        data.append(cells)
    ncols = len(header)
    label_width = 2.15 * inch
    widths = [label_width] + [(CONTENT_WIDTH - label_width) / (ncols - 1)] * (ncols - 1)
    table = Table(data, colWidths=widths, rowHeights=[None] + [.4 * inch] * (len(data) - 1), repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), .45, RULE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (0, -1), [WHITE, ROW_TINT]),
    ]
    for col in range(1, ncols):
        tint = tints[(col - 1) % len(tints)]
        cmds.append(("BACKGROUND", (col, 1), (col, -1), tint))
    table.setStyle(TableStyle(cmds))
    return table


def render_compare_table(rows: list[list[str]]) -> Table:
    header = [p(rows[0][0].strip().upper(), "table_head"), p(rows[0][1].strip().upper(), "table_head")]
    data = [header] + [[p(r[0].strip(), "table_cell"), p(r[1].strip(), "table_cell")] for r in rows[1:]]
    half = CONTENT_WIDTH / 2
    table = Table(data, colWidths=[half, half], rowHeights=[None] + [.52 * inch] * (len(data) - 1), repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), RUST),
        ("BACKGROUND", (1, 0), (1, 0), TEAL),
        ("GRID", (0, 0), (-1, -1), .45, RULE),
        ("BACKGROUND", (0, 1), (0, -1), RUST_TINT),
        ("BACKGROUND", (1, 1), (1, -1), TEAL_TINT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [None, None]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def render_table(rows: list[list[str]], row_heights: list[float] | None = None) -> Table:
    columns = len(rows[0])
    usable = CONTENT_WIDTH
    widths = [usable / columns] * columns
    if columns >= 5:
        if rows[0][0].strip().lower() == "record area":
            widths = [1.35 * inch, 1.85 * inch, .9 * inch, .72 * inch, 1.3 * inch]
            remaining = usable - sum(widths[:-1])
            widths[-1] = max(remaining, 1.2 * inch)
        else:
            widths[0] *= 1.25
            remaining = usable - widths[0]
            widths[1:] = [remaining / (columns - 1)] * (columns - 1)
    data = [[p(cell, "table_head" if row == 0 else "table_cell") for cell in line] for row, line in enumerate(rows)]
    if row_heights is None:
        row_heights = [None] + [0.4 * inch] * (len(data) - 1)
    table = Table(data, colWidths=widths, rowHeights=row_heights, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), .45, RULE),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, ROW_TINT]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def cover_block(metadata: dict[str, str], lang: str) -> list:
    story = [
        Spacer(1, 4),
        p(f'{FOOTER_STRINGS[lang]["library"]}  ·  {metadata["category"].upper()}', "eyebrow"),
        p(metadata["title"], "title"),
        p(metadata["subtitle"], "subtitle"),
        HRFlowable(width="100%", thickness=1.2, color=GOLD, spaceAfter=9),
    ]
    outcomes = [o.strip() for o in metadata.get("outcomes", "").split("|") if o.strip()]
    if outcomes:
        story.append(p(OUTCOME_LABEL[lang], "section"))
        story.append(Spacer(1, 4))
        for outcome in outcomes:
            row = Table([[p("◆", "chip"), p(outcome, "outcome")]], colWidths=[.2 * inch, 6.9 * inch])
            row.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TEXTCOLOR", (0, 0), (0, 0), GOLD),
            ]))
            story.append(row)
        story.append(Spacer(1, 8))
    time_val = metadata.get("time", "")
    nearby_val = metadata.get("nearby", "")
    if time_val and nearby_val:
        half = CONTENT_WIDTH / 2
        cell_left = [p(TIME_LABEL[lang], "meta_label"), p(time_val, "meta_value")]
        cell_right = [p(NEARBY_LABEL[lang], "meta_label"), p(nearby_val, "meta_value")]
        meta_table = Table([[cell_left, cell_right]], colWidths=[half, half])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CREAM),
            ("BOX", (0, 0), (-1, -1), .5, RULE),
            ("LINEAFTER", (0, 0), (0, 0), .5, RULE),
            ("LEFTPADDING", (0, 0), (-1, -1), 11),
            ("RIGHTPADDING", (0, 0), (-1, -1), 11),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.extend([meta_table, Spacer(1, 10)])
    return story


def parse_source(path: Path) -> tuple[dict[str, str], list[list[str]]]:
    text = path.read_text(encoding="utf-8")
    head, body = text.split("\n---\n", 1)
    metadata = {}
    for line in head.splitlines():
        key, value = line.split(":", 1)
        metadata[key.strip().lower()] = value.strip()
    pages = [page.strip().splitlines() for page in body.split("\n---PAGE---\n")]
    return metadata, pages


def page_story(lines: list[str], metadata: dict[str, str], lang: str, first: bool) -> list:
    story = []
    section_counter = [0]
    if first:
        story.extend(cover_block(metadata, lang))
    table_rows = []
    paragraph_lines = []

    def flush_paragraph():
        nonlocal paragraph_lines
        if paragraph_lines:
            story.append(p(" ".join(paragraph_lines)))
            paragraph_lines = []

    def flush_table():
        nonlocal table_rows
        if table_rows:
            # Detection is structural, not word-based, so it works the same
            # regardless of source language (English "area"/"notes" vs.
            # Spanish "área"/"nota" would otherwise silently fail to match).
            header = [cell.strip() for cell in table_rows[0]]
            joined = " ".join(cell.lower() for cell in header)
            is_rating = len(header) == 7 and header[1:6] == ["1", "2", "3", "4", "5"]
            is_dashboard = False
            if not is_rating and len(header) >= 3 and len(table_rows) > 1:
                # Every status cell must actually be written as checkbox
                # markup -- an ordinary blank fillable table (empty string
                # cells, no brackets at all) must never match this.
                rest_cells = [cell.strip() for cell in table_rows[1][1:]]
                is_dashboard = bool(rest_cells) and all(cell.lower() in {"[ ]", "[x]"} for cell in rest_cells)
            is_compare = (
                len(header) == 2
                and (("before" in joined and "after" in joined) or ("antes" in joined and "despu" in joined))
            )
            if is_rating:
                story.extend([render_rating_table(table_rows), Spacer(1, 5)])
            elif is_dashboard:
                story.extend([render_dashboard_table(table_rows), Spacer(1, 5)])
            elif is_compare:
                story.extend([render_compare_table(table_rows), Spacer(1, 5)])
            else:
                # Row height scales with column count, not header wording --
                # fewer columns generally means each cell holds a longer
                # handwritten answer; more columns means shorter per-cell
                # entries (a date, a name, a checkmark).
                col_count = len(table_rows[0])
                body_height = {2: 0.40, 3: 0.42, 4: 0.46, 5: 0.50, 6: 0.54}.get(col_count, 0.56)
                row_heights = [None] + [body_height * inch] * (len(table_rows) - 1)
                story.extend([render_table(table_rows, row_heights=row_heights), Spacer(1, 5)])
            table_rows = []

    for raw in lines + [""]:
        line = raw.strip()
        if line.startswith("|"):
            flush_paragraph()
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if not all(re.fullmatch(r"[-: ]+", cell) for cell in cells):
                table_rows.append(cells)
            continue
        flush_table()
        if not line:
            flush_paragraph()
        elif line.startswith("# "):
            flush_paragraph()
            if not first:
                story.extend([p(line[2:], "page_title"), HRFlowable(width="100%", thickness=.8, color=GOLD, spaceAfter=5)])
        elif line.startswith("## "):
            flush_paragraph()
            section_counter[0] += 1
            story.extend(section_heading(line[3:], section_counter[0]))
        elif line.startswith("### "):
            flush_paragraph()
            story.append(p(line[4:], "subsection"))
        elif line.startswith("[ ] "):
            flush_paragraph()
            story.append(checkbox(line[4:]))
        elif line.startswith("LINES:"):
            flush_paragraph()
            label, count = line[6:].split("|", 1)
            story.extend(writing_lines(label.strip(), int(count)))
        elif line.startswith("CALLOUT:"):
            flush_paragraph()
            title, body_text = line[8:].split("|", 1)
            story.extend([callout(title.strip(), body_text.strip()), Spacer(1, 5)])
        elif line.startswith("EXAMPLE:"):
            flush_paragraph()
            title, body_text = line[8:].split("|", 1)
            story.extend([example_box(title.strip(), body_text.strip()), Spacer(1, 5)])
        elif line.startswith("WATCH:"):
            flush_paragraph()
            title, body_text = line[6:].split("|", 1)
            story.extend([watch_box(title.strip(), body_text.strip()), Spacer(1, 5)])
        elif line.startswith("MICRO:"):
            flush_paragraph()
            label, text = line[6:].split("|", 1)
            story.extend([KeepTogether([micro(label.strip(), text.strip())]), Spacer(1, 5)])
        elif line.startswith("CHIPS:"):
            flush_paragraph()
            labels = [item.strip() for item in line[6:].split("|") if item.strip()]
            story.extend(chips(labels))
        elif line.startswith("SCALE:"):
            flush_paragraph()
            parts = [item.strip() for item in line[6:].split("|")]
            prompt_text, left_anchor, right_anchor, segments = parts[0], parts[1], parts[2], int(parts[3])
            story.extend(scale(prompt_text, left_anchor, right_anchor, segments))
        elif line.startswith("MATRIX:"):
            flush_paragraph()
            parts = [item.strip() for item in line[7:].split("|")]
            title_text, x_left, x_right, y_top, y_bottom, q1, q2, q3, q4 = parts
            story.extend(matrix(title_text, x_left, x_right, y_top, y_bottom, q1, q2, q3, q4))
        elif line.startswith("TIMELINE:"):
            flush_paragraph()
            steps = [item.strip() for item in line[9:].split("|") if item.strip()]
            story.extend(timeline(steps))
        else:
            paragraph_lines.append(line)
    flush_table()
    flush_paragraph()
    return story


def build(path: Path, lang: str) -> Path:
    metadata, pages = parse_source(path)
    out_dir = OUTPUT_DIR_ES if lang == "es" else OUTPUT_DIR
    output = out_dir / metadata["filename"]
    out_dir.mkdir(parents=True, exist_ok=True)
    story = []
    for index, lines in enumerate(pages):
        story.extend(page_story(lines, metadata, lang, index == 0))
        if index < len(pages) - 1:
            story.append(PageBreak())
    story.append(Spacer(1, 8))
    story.append(cta_box(metadata.get("ctaheadline", ""), metadata["cta"], lang))
    story.append(Spacer(1, 7))
    story.append(p(metadata["disclaimer"], "small"))
    doc = WorksheetDoc(output, metadata, lang)
    doc.build(story)
    return output


CANONICAL_RESOURCE_IDS = [
    "consultation-preparation-workbook",
    "business-startup-formation-workbook",
    "business-operations-systems-workbook",
    "individual-tax-preparation-organizer",
    "business-tax-preparation-organizer",
]


def main() -> None:
    requested = [Path(arg) for arg in sys.argv[1:]]
    if requested:
        for source in requested:
            path = source if source.is_absolute() else ROOT / source
            lang = "es" if path.parent.name == "es" else "en"
            print(build(path, lang).relative_to(ROOT))
        return

    # Only the canonical 5 resources are built here -- other .md files may
    # exist in this directory (future/unreleased content) without being
    # part of this pipeline or the site's download manifest.
    expected_names = {f"{resource_id}.md" for resource_id in CANONICAL_RESOURCE_IDS}
    en_ids = {source.name for source in SOURCE_DIR.glob("*.md")}
    es_ids = {source.name for source in SOURCE_DIR_ES.glob("*.md")} if SOURCE_DIR_ES.exists() else set()
    missing_en = sorted(expected_names - en_ids)
    missing_es = sorted(expected_names - es_ids)
    if missing_en:
        raise SystemExit(f"Missing English source files: {missing_en}")
    if missing_es:
        raise SystemExit(f"Missing Spanish source files: {missing_es}")
    for resource_id in CANONICAL_RESOURCE_IDS:
        print(build(SOURCE_DIR / f"{resource_id}.md", "en").relative_to(ROOT))
    for resource_id in CANONICAL_RESOURCE_IDS:
        print(build(SOURCE_DIR_ES / f"{resource_id}.md", "es").relative_to(ROOT))


if __name__ == "__main__":
    main()
