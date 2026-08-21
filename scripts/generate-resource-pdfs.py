from io import BytesIO
from pathlib import Path
import shutil

from PIL import Image as PILImage
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
PUBLIC = ROOT / "public" / "assets" / "downloads"
LOGO_PATH = ROOT / "public" / "assets" / "logos" / "alchemize-logo-light.png"

PAGE_W, PAGE_H = letter
MARGIN = 46
EMERALD = HexColor("#062b2b")
FOREST = HexColor("#0b4332")
GOLD = HexColor("#d7b05f")
NAVY = HexColor("#213745")
IVORY = HexColor("#f3f0ed")
MUTED = HexColor("#5d6b70")
RULE = HexColor("#d9d4cc")
WHITE = HexColor("#ffffff")


RESOURCES = [
    {
        "filename": "alchemize-preparing-for-tax-season.pdf",
        "category": "INDIVIDUAL TAX PREPARATION",
        "title": "Preparing for\nTax Season",
        "intro": "A practical checklist for organizing common records, identifying gaps, and arriving better prepared for a tax-preparation conversation.",
        "pages": [
            {
                "label": "PART 01 / BUILD THE FILE",
                "heading": "Create a clear starting point before documents begin to pile up.",
                "sections": [
                    ("Set up the system", [
                        "Create one secure folder for the current tax year.",
                        "Keep personal and business records separate where applicable.",
                        "Use clear filenames that include the document type and year.",
                        "Review the prior-year return for carryforwards or recurring records.",
                    ]),
                    ("Gather common income records", [
                        "Wage, retirement, benefit, or other income statements received.",
                        "Interest, dividend, investment, or platform income records where applicable.",
                        "Self-employment or other business income summaries where applicable.",
                        "Records for any other income that may need to be discussed.",
                    ]),
                    ("Gather supporting records", [
                        "Potential deduction or credit documentation where applicable.",
                        "Estimated tax payment confirmations.",
                        "Relevant state or local tax records.",
                        "Documentation of major family, financial, property, or business changes.",
                    ]),
                ],
                "sidebar": ("A simple preparation timeline", [
                    "As documents arrive: file and label them.",
                    "Before the appointment: compare records with your expected-document list.",
                    "During preparation: keep a running list of questions and missing items.",
                    "After filing: retain the final return and supporting records securely.",
                ]),
            },
            {
                "label": "PART 02 / RESOLVE THE GAPS",
                "heading": "Know what is missing, what changed, and what you need to ask.",
                "sections": [
                    ("When something is missing", [
                        "Do not estimate or recreate an official form from memory.",
                        "Contact the issuer and request a replacement or corrected document.",
                        "Track each missing item, the date requested, and its status.",
                        "Ask whether preparation should wait until the missing record arrives.",
                    ]),
                    ("Questions to prepare", [
                        "What changed since the prior tax year?",
                        "Are there unfamiliar documents or transactions to explain?",
                        "Are any records incomplete, corrected, or still expected?",
                        "What should be organized differently for next year?",
                    ]),
                    ("Final readiness check", [
                        "Contact information is current.",
                        "Expected documents have been checked against what was received.",
                        "Questions and missing items are written down.",
                        "Sensitive records are ready to share through an approved secure method.",
                    ]),
                ],
                "notes": True,
            },
        ],
        "disclaimer": "This guide supports general organization and filing readiness. It is not individualized tax advice and does not promise or guarantee any tax outcome.",
    },
    {
        "filename": "alchemize-starting-a-business-organization-checklist.pdf",
        "category": "BUSINESS FORMATION & READINESS",
        "title": "Starting a Business:\nOrganization Checklist",
        "intro": "A practical preparation guide for organizing the information, records, systems, and questions behind a new business.",
        "pages": [
            {
                "label": "PART 01 / DEFINE THE STARTING PICTURE",
                "heading": "Organize the decisions that shape the business before adding systems around it.",
                "sections": [
                    ("Business purpose and ownership", [
                        "Describe the product or service and the customer it is intended to serve.",
                        "List owners, decision-makers, roles, and responsibilities.",
                        "Identify the intended business name and any names still under consideration.",
                        "Write down major launch dates, deadlines, and immediate priorities.",
                    ]),
                    ("Formation preparation", [
                        "Organize owner and business contact information.",
                        "List entity, tax, licensing, or registration questions for the appropriate professional.",
                        "Track EIN, state, local, or industry registration steps that may apply.",
                        "Keep approved formation and registration records together.",
                    ]),
                    ("Separate the business activity", [
                        "Plan how business income and expenses will be kept separate from personal activity.",
                        "Define where contracts, receipts, invoices, and official notices will be stored.",
                        "Choose a repeatable naming and filing convention.",
                    ]),
                ],
                "sidebar": ("Questions worth resolving early", [
                    "Which decisions require legal, tax, insurance, or financial guidance?",
                    "What must be completed before the business begins operating?",
                    "Who owns each recurring responsibility?",
                    "What information must remain private or securely stored?",
                ]),
            },
            {
                "label": "PART 02 / BUILD THE OPERATING FOUNDATION",
                "heading": "Create enough structure to operate clearly from the beginning.",
                "sections": [
                    ("Core record categories", [
                        "Formation and registration records.",
                        "Tax and financial records.",
                        "Client, vendor, and agreement records.",
                        "Insurance and risk-related records where applicable.",
                        "Operational procedures, credentials, and system access records.",
                    ]),
                    ("Recurring responsibilities", [
                        "Create a calendar for filing, renewal, tax, and reporting dates.",
                        "Define a routine for reviewing income, expenses, and outstanding items.",
                        "Document repeatable client intake and administrative tasks.",
                        "Assign ownership and a follow-up date for each open action.",
                    ]),
                    ("Digital and operating readiness", [
                        "Confirm professional contact information and business email setup.",
                        "Review website, booking, payment, CRM, or workflow needs.",
                        "Use secure access practices and maintain current account ownership records.",
                        "Start with the systems required now; add complexity only when it solves a real need.",
                    ]),
                ],
                "notes": True,
            },
        ],
        "disclaimer": "This checklist provides general business-organization information. It is not legal advice, does not recommend a specific entity, and does not guarantee registration, funding, certification, or contracting outcomes.",
    },
    {
        "filename": "alchemize-consultation-document-checklist.pdf",
        "category": "CONSULTATION PREPARATION",
        "title": "Documents to Bring\nto a Consultation",
        "intro": "A practical guide for deciding what context and records may help make an initial Alchemize conversation more useful.",
        "pages": [
            {
                "label": "PART 01 / PREPARE THE CONTEXT",
                "heading": "Start with the responsibility, not a perfect set of documents.",
                "sections": [
                    ("Describe the need", [
                        "Write down what you are trying to accomplish, improve, organize, or resolve.",
                        "Note important dates, deadlines, or decisions already in progress.",
                        "List the people, providers, agencies, or systems already involved.",
                        "Identify what feels unclear or incomplete.",
                    ]),
                    ("Common personal-service records", [
                        "Tax notices or current-year tax documents relevant to the question.",
                        "Insurance policy summaries or communications relevant to the discussion.",
                        "Unsigned notary documents and required identification information where applicable.",
                        "Prior correspondence, checklists, or records that explain the situation.",
                    ]),
                    ("Common business-service records", [
                        "Formation, registration, or business-identification records.",
                        "Current workflows, forms, procedures, or administrative records.",
                        "Relevant income, expense, tax, or financial summaries.",
                        "Notices, deadlines, requirements, or opportunity documentation.",
                    ]),
                ],
                "sidebar": ("Bring the question with the records", [
                    "What outcome are you working toward?",
                    "What has already been tried?",
                    "What decision is currently blocked?",
                    "What would a useful next step look like?",
                ]),
            },
            {
                "label": "PART 02 / SHARE INFORMATION CAREFULLY",
                "heading": "Prepare enough to begin while protecting sensitive information.",
                "sections": [
                    ("Before sending anything", [
                        "Confirm which records are actually needed for the initial conversation.",
                        "Remove unrelated personal or confidential information where appropriate.",
                        "Do not use the public contact form or ordinary email for sensitive records.",
                        "Use an approved secure method only when instructed.",
                    ]),
                    ("During the consultation", [
                        "Confirm the responsibility and the desired outcome.",
                        "Identify missing information, decisions, and scope boundaries.",
                        "Clarify the appropriate service or referral path.",
                        "Record the agreed next step and who is responsible for it.",
                    ]),
                    ("After the consultation", [
                        "Organize any follow-up records requested.",
                        "Complete actions in the order established.",
                        "Keep notes, decisions, and final documents together.",
                        "Ask for clarification when an instruction is not understood.",
                    ]),
                ],
                "notes": True,
            },
        ],
        "disclaimer": "This guide is for general consultation preparation. The records required depend on the situation and service scope; Alchemize will confirm what should be provided and how it should be shared.",
    },
]


def logo_reader():
    image = PILImage.open(LOGO_PATH).convert("RGBA")
    image.thumbnail((1000, 260), PILImage.Resampling.LANCZOS)
    buffer = BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return ImageReader(buffer), buffer


def wrap(text, font, size, width):
    lines, current = [], ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if pdfmetrics.stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def text(c, value, x, y, width, font="Helvetica", size=9.3, leading=13, color=MUTED):
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap(value, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_header(c, resource, page):
    logo, buffer = logo_reader()
    if page == 1:
        c.setFillColor(EMERALD)
        c.rect(0, PAGE_H - 176, PAGE_W, 176, fill=1, stroke=0)
        c.drawImage(logo, MARGIN, PAGE_H - 73, width=178, height=44, preserveAspectRatio=True, mask="auto")
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(GOLD)
        c.drawString(MARGIN, PAGE_H - 94, resource["category"])
        y = PAGE_H - 123
        c.setFont("Times-Bold", 25)
        c.setFillColor(WHITE)
        for line in resource["title"].split("\n"):
            c.drawString(MARGIN, y, line)
            y -= 26
        text(c, resource["intro"], 355, PAGE_H - 93, 210, size=9.2, leading=13, color=IVORY)
    else:
        c.setFillColor(EMERALD)
        c.rect(0, PAGE_H - 91, PAGE_W, 91, fill=1, stroke=0)
        c.drawImage(logo, MARGIN, PAGE_H - 67, width=152, height=38, preserveAspectRatio=True, mask="auto")
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(GOLD)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 48, resource["category"])
    buffer.close()


def draw_section(c, heading, items, x, y, width):
    c.setFillColor(IVORY)
    c.rect(x, y - 26, width, 26, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(x, y - 26, 4, 26, fill=1, stroke=0)
    c.setFillColor(FOREST)
    c.setFont("Helvetica-Bold", 8.6)
    c.drawString(x + 13, y - 17, heading.upper())
    y -= 36
    for item in items:
        lines = wrap(item, "Helvetica", 8.9, width - 34)
        row_height = max(24, len(lines) * 11 + 8)
        c.setStrokeColor(FOREST)
        c.setLineWidth(1)
        c.rect(x + 2, y - 9, 10, 10, fill=0, stroke=1)
        text(c, item, x + 24, y, width - 29, size=8.9, leading=11, color=NAVY)
        y -= row_height
        c.setStrokeColor(RULE)
        c.setLineWidth(0.45)
        c.line(x + 24, y + 5, x + width, y + 5)
    return y - 6


def draw_sidebar(c, sidebar, x, y, width):
    title, items = sidebar
    c.setFillColor(FOREST)
    c.roundRect(x, y - 184, width, 184, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8.4)
    c.drawString(x + 16, y - 23, title.upper())
    yy = y - 49
    for item in items:
        c.setFillColor(GOLD)
        c.circle(x + 18, yy + 3, 2, fill=1, stroke=0)
        yy = text(c, item, x + 29, yy + 6, width - 45, size=8.5, leading=11, color=WHITE) - 11


def draw_notes(c, x, y, width):
    c.setFont("Helvetica-Bold", 8.6)
    c.setFillColor(FOREST)
    c.drawString(x, y, "NOTES / QUESTIONS")
    y -= 18
    for _ in range(5):
        c.setStrokeColor(HexColor("#aeb4b1"))
        c.setLineWidth(0.5)
        c.line(x, y, x + width, y)
        y -= 24


def draw_footer(c, resource, page):
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.9)
    c.line(MARGIN, 49, PAGE_W - MARGIN, 49)
    c.setFillColor(EMERALD)
    c.setFont("Helvetica-Bold", 7.4)
    c.drawString(MARGIN, 33, "ALCHEMIZE BUSINESS SERVICES")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.4)
    c.drawString(204, 33, "getalchemize.com")
    c.drawRightString(PAGE_W - MARGIN, 33, f"August 2026  |  Page {page} of 2")
    if page == 2:
        text(c, resource["disclaimer"], MARGIN, 71, PAGE_W - 2 * MARGIN, size=7.1, leading=9, color=MUTED)


def build(resource):
    destination = OUTPUT / resource["filename"]
    c = canvas.Canvas(str(destination), pagesize=letter, pageCompression=1)
    c.setTitle(resource["title"].replace("\n", " "))
    c.setAuthor("Alchemize Business Services")
    c.setSubject("Client preparation guide")
    for page_number, page in enumerate(resource["pages"], 1):
        draw_header(c, resource, page_number)
        top = PAGE_H - (198 if page_number == 1 else 116)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(MARGIN, top, page["label"])
        top -= 27
        c.setFillColor(NAVY)
        c.setFont("Times-Bold", 18)
        for line in wrap(page["heading"], "Times-Bold", 18, PAGE_W - 2 * MARGIN):
            c.drawString(MARGIN, top, line)
            top -= 20
        top -= 13
        if page.get("sidebar"):
            main_width, side_width = 330, 174
            y = top
            for heading, items in page["sections"]:
                y = draw_section(c, heading, items, MARGIN, y, main_width)
            draw_sidebar(c, page["sidebar"], MARGIN + main_width + 18, top, side_width)
        else:
            left_x, right_x, column_width = MARGIN, 314, 252
            positions = [top, top]
            for index, (heading, items) in enumerate(page["sections"]):
                column = index % 2
                x = left_x if column == 0 else right_x
                positions[column] = draw_section(c, heading, items, x, positions[column], column_width)
            if page.get("notes"):
                draw_notes(c, MARGIN, min(positions) - 10, PAGE_W - 2 * MARGIN)
        draw_footer(c, resource, page_number)
        c.showPage()
    c.save()
    shutil.copy2(destination, PUBLIC / resource["filename"])
    print(destination)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for resource in RESOURCES:
        build(resource)


if __name__ == "__main__":
    main()
