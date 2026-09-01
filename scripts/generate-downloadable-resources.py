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
    Image,
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
OUTPUT_DIR = ROOT / "public" / "assets" / "downloads"

NAVY = colors.HexColor("#213745")
TEAL = colors.HexColor("#0B4332")
GOLD = colors.HexColor("#D7B05F")
CREAM = colors.HexColor("#F3F0ED")
WARM = colors.HexColor("#E9E5DF")
SOFT = colors.HexColor("#52636A")
WHITE = colors.white
RULE = colors.HexColor("#C9C2B8")

pdfmetrics.registerFont(TTFont("Inter", ROOT / "public/assets/fonts/inter-400.ttf"))
pdfmetrics.registerFont(TTFont("Inter-Medium", ROOT / "public/assets/fonts/inter-500.ttf"))
pdfmetrics.registerFont(TTFont("Inter-Semibold", ROOT / "public/assets/fonts/inter-600.ttf"))
pdfmetrics.registerFont(TTFont("Cormorant", ROOT / "public/assets/fonts/cormorant-garamond-600.ttf"))

STYLES = {
    "eyebrow": ParagraphStyle("eyebrow", fontName="Inter-Semibold", fontSize=7.2, leading=9, textColor=TEAL, spaceAfter=8, uppercase=True, tracking=1.4),
    "title": ParagraphStyle("title", fontName="Cormorant", fontSize=28, leading=29, textColor=NAVY, spaceAfter=8),
    "subtitle": ParagraphStyle("subtitle", fontName="Inter", fontSize=9.2, leading=13.2, textColor=SOFT, spaceAfter=11),
    "page_title": ParagraphStyle("page_title", fontName="Cormorant", fontSize=20, leading=22, textColor=NAVY, spaceAfter=8),
    "section": ParagraphStyle("section", fontName="Inter-Semibold", fontSize=9, leading=11, textColor=TEAL, spaceBefore=7, spaceAfter=5, uppercase=True, tracking=.65),
    "body": ParagraphStyle("body", fontName="Inter", fontSize=7.8, leading=10.6, textColor=NAVY, spaceAfter=5),
    "small": ParagraphStyle("small", fontName="Inter", fontSize=6.7, leading=8.7, textColor=SOFT),
    "check": ParagraphStyle("check", fontName="Inter", fontSize=7.4, leading=10.2, textColor=NAVY, leftIndent=1),
    "prompt": ParagraphStyle("prompt", fontName="Inter-Medium", fontSize=7.2, leading=9, textColor=NAVY),
    "callout_title": ParagraphStyle("callout_title", fontName="Inter-Semibold", fontSize=8, leading=10, textColor=TEAL, spaceAfter=3),
    "callout": ParagraphStyle("callout", fontName="Inter", fontSize=7.2, leading=9.6, textColor=NAVY),
    "table_head": ParagraphStyle("table_head", fontName="Inter-Semibold", fontSize=6.4, leading=7.7, textColor=WHITE, alignment=TA_LEFT),
    "table_cell": ParagraphStyle("table_cell", fontName="Inter", fontSize=6.1, leading=7.5, textColor=NAVY),
}


class WorksheetDoc(BaseDocTemplate):
    def __init__(self, filename: Path, metadata: dict[str, str]):
        self.metadata = metadata
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
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(PageTemplate(id="resource", frames=[frame], onPage=self.decorate))

    def decorate(self, canvas, doc):
        canvas.saveState()
        width, height = letter
        canvas.setStrokeColor(GOLD)
        canvas.setLineWidth(1.2)
        canvas.line(self.leftMargin, height - .35 * inch, width - self.rightMargin, height - .35 * inch)
        logo = ROOT / "public/assets/logos/alchemize-logo-dark.png"
        if logo.exists():
            canvas.drawImage(str(logo), self.leftMargin, height - .30 * inch, width=1.05 * inch, height=.20 * inch, preserveAspectRatio=True, anchor="sw", mask="auto")
        canvas.setFont("Inter", 6.3)
        canvas.setFillColor(SOFT)
        canvas.drawRightString(width - self.rightMargin, height - .25 * inch, self.metadata["category"].upper())
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(.45)
        canvas.line(self.leftMargin, .38 * inch, width - self.rightMargin, .38 * inch)
        canvas.setFont("Inter", 5.9)
        canvas.drawString(self.leftMargin, .22 * inch, f'{self.metadata["short"]}  |  Version 1.0 - September 2026')
        canvas.drawCentredString(width / 2, .22 * inch, "getalchemize.com")
        canvas.drawRightString(width - self.rightMargin, .22 * inch, f"Page {doc.page}")
        canvas.restoreState()


def safe(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def p(text: str, style: str = "body") -> Paragraph:
    return Paragraph(safe(text), STYLES[style])


def checkbox(text: str) -> Table:
    box = Table([["", p(text, "check")]], colWidths=[.18 * inch, 6.8 * inch])
    box.setStyle(TableStyle([
        ("BOX", (0, 0), (0, 0), 1.0, NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (0, 0), 4),
        ("TOPPADDING", (0, 0), (0, 0), 4),
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


def callout(title: str, body: str) -> Table:
    inner = [p(title, "callout_title"), p(body, "callout")]
    table = Table([[inner]], colWidths=[7.1 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("BOX", (0, 0), (-1, -1), .5, GOLD),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


def render_rating_table(rows: list[list[str]]) -> Table:
    data = []
    for idx, row in enumerate(rows):
        if idx == 0:
            cleaned = [cell.strip() for cell in row]
            data.append([p(cleaned[0], "table_head"), p("1", "table_head"), p("2", "table_head"), p("3", "table_head"), p("4", "table_head"), p("5", "table_head"), p("Notes / Why?", "table_head")])
            continue
        area = row[0].strip() if row else ""
        values = []
        for cell in row[1:6]:
            text = cell.strip()
            values.append("○" if text in {"[ ]", "", "○"} else "●")
        notes = row[6].strip() if len(row) > 6 else ""
        data.append([p(area, "table_cell"), p(values[0], "table_cell"), p(values[1], "table_cell"), p(values[2], "table_cell"), p(values[3], "table_cell"), p(values[4], "table_cell"), p(notes, "table_cell")])
    widths = [2.05 * inch, .48 * inch, .48 * inch, .48 * inch, .48 * inch, .48 * inch, 2.1 * inch]
    table = Table(data, colWidths=widths, rowHeights=[.24 * inch] + [.46 * inch] * (len(data) - 1), repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), .45, RULE),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F8F6F2")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 1), (-2, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def render_table(rows: list[list[str]], row_heights: list[float] | None = None) -> Table:
    columns = len(rows[0])
    usable = 7.12 * inch
    widths = [usable / columns] * columns
    if columns >= 5:
        if rows[0][0].strip().lower() == "record area":
            widths = [1.35 * inch, 1.85 * inch, .9 * inch, .72 * inch, 1.5 * inch]
            remaining = usable - sum(widths[:-1])
            widths[-1] = max(remaining, 1.2 * inch)
        else:
            widths[0] *= 1.25
            remaining = usable - widths[0]
            widths[1:] = [remaining / (columns - 1)] * (columns - 1)
    data = [[p(cell, "table_head" if row == 0 else "table_cell") for cell in line] for row, line in enumerate(rows)]
    if row_heights is None:
        row_heights = [0.22 * inch] + [0.4 * inch] * (len(data) - 1)
    table = Table(data, colWidths=widths, rowHeights=row_heights, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), .45, RULE),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F8F6F2")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def parse_source(path: Path) -> tuple[dict[str, str], list[list[str]]]:
    text = path.read_text(encoding="utf-8")
    head, body = text.split("\n---\n", 1)
    metadata = {}
    for line in head.splitlines():
        key, value = line.split(":", 1)
        metadata[key.strip().lower()] = value.strip()
    pages = [page.strip().splitlines() for page in body.split("\n---PAGE---\n")]
    return metadata, pages


def page_story(lines: list[str], metadata: dict[str, str], first: bool) -> list:
    story = []
    if first:
        story.extend([
            Spacer(1, 4),
            p(metadata["category"].upper(), "eyebrow"),
            p(metadata["title"], "title"),
            p(metadata["subtitle"], "subtitle"),
            HRFlowable(width="100%", thickness=1.2, color=GOLD, spaceAfter=9),
        ])
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
            first_cell = next((cell.strip().lower() for cell in table_rows[0] if cell.strip()), "")
            joined = " ".join(cell.strip().lower() for cell in table_rows[0])
            if first_cell == "area" and ("note" in joined or "notes" in joined):
                story.extend([render_rating_table(table_rows), Spacer(1, 6)])
            else:
                row_heights = [0.22 * inch] + [0.48 * inch] * (len(table_rows) - 1)
                header_text = " ".join(cell.strip().lower() for cell in table_rows[0])
                if "record area" in header_text:
                    row_heights = [0.22 * inch] + [0.58 * inch] * (len(table_rows) - 1)
                elif "responsibility" in header_text:
                    row_heights = [0.22 * inch] + [0.56 * inch] * (len(table_rows) - 1)
                elif "workflow" in header_text:
                    row_heights = [0.22 * inch] + [0.62 * inch] * (len(table_rows) - 1)
                elif "system" in header_text:
                    row_heights = [0.22 * inch] + [0.62 * inch] * (len(table_rows) - 1)
                elif "priority" in header_text or "urgent + important" in header_text:
                    row_heights = [0.22 * inch] + [0.65 * inch] * (len(table_rows) - 1)
                elif "business stage" in header_text or "field" in header_text:
                    row_heights = [0.22 * inch] + [0.62 * inch] * (len(table_rows) - 1)
                story.extend([render_table(table_rows, row_heights=row_heights), Spacer(1, 6)])
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
            story.append(p(line[3:], "section"))
        elif line.startswith("[ ] "):
            flush_paragraph()
            story.append(checkbox(line[4:]))
        elif line.startswith("LINES:"):
            flush_paragraph()
            label, count = line[6:].split("|", 1)
            story.extend(writing_lines(label.strip(), int(count)))
        elif line.startswith("CALLOUT:"):
            flush_paragraph()
            title, body = line[8:].split("|", 1)
            story.extend([callout(title.strip(), body.strip()), Spacer(1, 6)])
        else:
            paragraph_lines.append(line)
    flush_table()
    flush_paragraph()
    return story


def build(path: Path) -> Path:
    metadata, pages = parse_source(path)
    output = OUTPUT_DIR / metadata["filename"]
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    story = []
    for index, lines in enumerate(pages):
        story.extend(page_story(lines, metadata, index == 0))
        if index < len(pages) - 1:
            story.append(PageBreak())
    story.extend([Spacer(1, 8), callout("Next step", metadata["cta"]), Spacer(1, 5), p(metadata["disclaimer"], "small")])
    doc = WorksheetDoc(output, metadata)
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
    sources = requested or sorted(SOURCE_DIR.glob("*.md"))
    expected_ids = {Path(f"{resource_id}.md") for resource_id in CANONICAL_RESOURCE_IDS}
    actual_ids = {source.name for source in sources}
    if requested:
        missing = sorted(expected_ids - actual_ids)
        if missing:
            raise SystemExit(
                f"Requested resources are missing from the source set: {', '.join(missing)}"
            )
    elif len(sources) != len(CANONICAL_RESOURCE_IDS):
        raise SystemExit(
            f"Expected {len(CANONICAL_RESOURCE_IDS)} source files, found {len(sources)}"
        )
    for source in sources:
        path = source if source.is_absolute() else ROOT / source
        print(build(path).relative_to(ROOT))


if __name__ == "__main__":
    main()
