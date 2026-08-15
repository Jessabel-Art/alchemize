import json
import sys
from pathlib import Path
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.utils import ImageReader
from PIL import Image as PILImage
from io import BytesIO

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "content/service-details.json").read_text(encoding="utf-8"))
PREMIUM = json.loads((ROOT / "content/checklist-layouts.json").read_text(encoding="utf-8"))
OUT = ROOT / "public/assets/downloads"
OUT.mkdir(parents=True, exist_ok=True)
LOGO = ROOT / "assets/alchemize-logo-horizontal-light-theme.png"
EMERALD, GOLD, NAVY, IVORY, GRAY = map(HexColor, ["#063D35", "#CE9D35", "#193744", "#F5F1E9", "#506169"])
DEEP_EMERALD, FOREST, LIGHT_GOLD, WHITE = map(HexColor, ["#062B2B", "#0B4332", "#D7B05F", "#FFFFFF"])

def optimized_logo():
    image = PILImage.open(ROOT / "assets/alchemize-logo-horizontal-dark-main-theme.png").convert("RGBA")
    image.thumbnail((900, 240), PILImage.Resampling.LANCZOS)
    buffer = BytesIO(); image.save(buffer, format="PNG", optimize=True); buffer.seek(0)
    return ImageReader(buffer), buffer

def wrapped_lines(text, font, size, width):
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdfmetrics.stringWidth(candidate, font, size) <= width: current = candidate
        else:
            if current: lines.append(current)
            current = word
    if current: lines.append(current)
    return lines

def draw_wrapped(c, text, x, y, width, font="Helvetica", size=9.5, leading=13, color=GRAY, max_lines=None):
    lines = wrapped_lines(text, font, size, width)
    if max_lines: lines = lines[:max_lines]
    c.setFont(font, size); c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line); y -= leading
    return y

def draw_footer(c, page, total, disclaimer):
    c.setStrokeColor(GOLD); c.setLineWidth(1); c.line(42, 43, 570, 43)
    c.setFont("Helvetica-Bold", 8); c.setFillColor(DEEP_EMERALD); c.drawString(42, 28, "ALCHEMIZE BUSINESS SERVICES")
    c.setFont("Helvetica", 8); c.setFillColor(GRAY); c.drawString(206, 28, "getalchemize.com")
    c.drawRightString(570, 28, f"Version 1.0  |  August 2026  |  Page {page} of {total}")
    if page == total:
        draw_wrapped(c, disclaimer, 42, 59, 528, size=8, leading=10, color=GRAY, max_lines=2)

def draw_masthead(c, data, page, logo):
    if page == 1:
        c.setFillColor(DEEP_EMERALD); c.rect(0, 642, 612, 150, fill=1, stroke=0)
        c.drawImage(logo, 42, 731, width=166, height=44, preserveAspectRatio=True, mask="auto")
        c.setFillColor(LIGHT_GOLD); c.setFont("Helvetica-Bold", 8); c.drawString(42, 711, f'{data["audience"]}  /  PREPARATION TOOL')
        y=683
        c.setFillColor(WHITE); c.setFont("Times-Bold", 23)
        for line in data["title"].split("\n"):
            c.drawString(42,y,line); y-=24
        c.setFillColor(IVORY); c.setFont("Helvetica", 9.5)
        intro_lines=wrapped_lines(data["intro"],"Helvetica",9.5,210)[:6]
        for line in intro_lines:
            c.drawString(360,711,line)
            c.translate(0,-13)
        c.translate(0,13*len(intro_lines))
    else:
        c.setFillColor(DEEP_EMERALD); c.rect(0, 704, 612, 88, fill=1, stroke=0)
        c.drawImage(logo, 42, 733, width=142, height=38, preserveAspectRatio=True, mask="auto")
        c.setFillColor(LIGHT_GOLD); c.setFont("Helvetica-Bold",8); c.drawRightString(570,754,data["audience"]+" / PREPARATION TOOL")
        c.setFillColor(WHITE); c.setFont("Times-Bold",16); c.drawRightString(570,731,data["title"].split("\n")[0])

def item_height(item, width):
    return max(19, len(wrapped_lines(item,"Helvetica",9.5,width-31))*11+6)

def section_height(section, width):
    return 31 + sum(item_height(i,width) for i in section["items"])

def draw_section(c, section, x, y, width, number):
    c.setFillColor(IVORY); c.roundRect(x,y-23,width,23,3,fill=1,stroke=0)
    c.setFillColor(GOLD); c.rect(x,y-23,4,23,fill=1,stroke=0)
    c.setFillColor(EMERALD); c.setFont("Helvetica-Bold",9.2); c.drawString(x+12,y-15,f'{number:02d}  {section["title"].upper()}')
    y-=28
    for item in section["items"]:
        h=item_height(item,width); c.setStrokeColor(EMERALD); c.setLineWidth(1.1); c.rect(x+2,y-12,11,11,fill=0,stroke=1)
        y=draw_wrapped(c,item,x+24,y-2,width-28,size=9.5,leading=11,color=NAVY)-6
        c.setStrokeColor(HexColor("#DDD7CB")); c.setLineWidth(.45); c.line(x+24,y+4,x+width,y+4)
    return y-7

def draw_prompts(c, prompts, x, y, width, title="YOUR PRIORITIES"):
    c.setFillColor(EMERALD); c.setFont("Helvetica-Bold",9.5); c.drawString(x,y,title); y-=18
    for prompt in prompts:
        c.setFont("Helvetica-Bold",8.5); c.setFillColor(NAVY); c.drawString(x,y,prompt.upper()); y-=14
        c.setStrokeColor(HexColor("#9B9F9B")); c.line(x,y,x+width,y); y-=23
    return y

def draw_security(c, x, y, width):
    c.setFillColor(IVORY); c.roundRect(x,y-49,width,49,4,fill=1,stroke=0)
    c.setStrokeColor(LIGHT_GOLD); c.setLineWidth(.8); c.roundRect(x,y-49,width,49,4,fill=0,stroke=1)
    c.setFillColor(EMERALD); c.setFont("Helvetica-Bold",8); c.drawString(x+12,y-15,"SECURITY NOTE")
    text="Do not send Social Security numbers, banking information, tax returns, identification documents, medical information, or other sensitive records through an unsecured form or ordinary email. Use an approved method when instructed."
    draw_wrapped(c,text,x+92,y-14,width-104,size=7.7,leading=10,color=GRAY,max_lines=4)

def build_premium(filename, data):
    file=OUT/filename; c=pdfcanvas.Canvas(str(file),pagesize=letter,pageCompression=1)
    c.setTitle(data["title"].replace("\n"," ")); c.setAuthor("Alchemize Business Services"); c.setSubject("Client consultation preparation checklist")
    logo, logo_buffer=optimized_logo(); total=len(data["pages"])
    for page_number,page in enumerate(data["pages"],1):
        draw_masthead(c,data,page_number,logo)
        top=623 if page_number==1 else 686
        c.setFillColor(GOLD); c.setFont("Helvetica-Bold",8); c.drawString(42,top,page["label"])
        top-=20; c.setFillColor(NAVY); c.setFont("Times-Bold",18)
        for line in wrapped_lines(page["heading"],"Times-Bold",18,528): c.drawString(42,top,line); top-=20
        top-=10
        columns=[{"x":42,"y":top},{"x":314,"y":top}]; width=256
        for idx,section in enumerate(page["sections"],1):
            col=max(columns,key=lambda a:a["y"]); col["y"]=draw_section(c,section,col["x"],col["y"],width,idx)
        bottom=min(v["y"] for v in columns)-5
        if page.get("readiness"):
            readiness={"title":page["readinessTitle"],"items":page["readiness"]}
            bottom=draw_section(c,readiness,42,bottom,528,len(page["sections"])+1)
        if page.get("prompts"):
            bottom=draw_prompts(c,page["prompts"],42,bottom,528,"REFLECTION / PRIORITIES")
        if page.get("notesTitle"):
            c.setFillColor(EMERALD); c.setFont("Helvetica-Bold",9.5); c.drawString(42,bottom,page["notesTitle"].upper()); bottom-=18
            for _ in range(page.get("notesLines",4)):
                c.setStrokeColor(HexColor("#AEB2AD")); c.line(42,bottom,570,bottom); bottom-=22
        if page_number==total: draw_security(c,42,max(122,min(bottom-4,145)),528)
        draw_footer(c,page_number,total,data["disclaimer"]); c.showPage()
    c.save(); logo_buffer.close(); print(file)

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(HexColor("#D8D2C6")); canvas.line(0.65*inch, 0.52*inch, 7.85*inch, 0.52*inch)
    canvas.setFont("Helvetica", 8); canvas.setFillColor(GRAY)
    canvas.drawString(0.65*inch, 0.32*inch, "Alchemize Business Services  |  getalchemize.com")
    canvas.drawRightString(7.85*inch, 0.32*inch, f"Page {doc.page}")
    canvas.restoreState()

def build(service):
    file = OUT / service["pdf"]
    doc = BaseDocTemplate(str(file), pagesize=letter, leftMargin=.7*inch, rightMargin=.7*inch, topMargin=.55*inch, bottomMargin=.7*inch,
                          title=service["checklist"], author="Alchemize Business Services")
    doc.addPageTemplates(PageTemplate(id="main", frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")], onPage=footer))
    styles = {
      "kicker": ParagraphStyle("k", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=GOLD, spaceAfter=9, tracking=1.4),
      "title": ParagraphStyle("t", fontName="Times-Bold", fontSize=27, leading=29, textColor=NAVY, spaceAfter=10),
      "body": ParagraphStyle("b", fontName="Helvetica", fontSize=9.4, leading=14, textColor=GRAY, spaceAfter=8),
      "head": ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=10, leading=12, textColor=EMERALD, spaceBefore=8, spaceAfter=7, tracking=.7),
      "item": ParagraphStyle("i", fontName="Helvetica", fontSize=9, leading=12, textColor=NAVY),
      "small": ParagraphStyle("s", fontName="Helvetica", fontSize=7.5, leading=10, textColor=GRAY),
      "warn": ParagraphStyle("w", fontName="Helvetica-Bold", fontSize=8.2, leading=12, textColor=NAVY),
    }
    logo = str(LOGO)
    from reportlab.platypus import Image
    img = Image(logo, width=2.15*inch, height=.57*inch); img.hAlign="LEFT"
    story=[img, Spacer(1,10), Paragraph(service["audience"].upper()+" / PREPARATION TOOL",styles["kicker"]), Paragraph(service["checklist"],styles["title"]), Paragraph(service["checkPurpose"],styles["body"])]
    use = Table([[Paragraph("HOW TO USE THIS CHECKLIST",styles["head"]), Paragraph("Check what you already have, circle items needing clarification, and use the notes area to record questions. Alchemize will confirm what is actually required for your situation.",styles["body"])]], colWidths=[1.85*inch,5.25*inch])
    use.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),IVORY),("BOX",(0,0),(-1,-1),.7,HexColor("#D8D2C6")),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),12),("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),7)]))
    story += [use, Spacer(1,12)]
    cats=list(service["categories"].items())
    for index,(name,items) in enumerate(cats):
        rows=[[Paragraph(name.upper(),styles["head"]),""]]
        for item in items:
            rows.append([Paragraph("[ ]", ParagraphStyle("box",fontName="Helvetica",fontSize=9,leading=13,textColor=EMERALD)),Paragraph(item,styles["item"])])
        table=Table(rows,colWidths=[.3*inch,6.8*inch],repeatRows=1)
        table.setStyle(TableStyle([("SPAN",(0,0),(-1,0)),("BACKGROUND",(0,0),(-1,0),IVORY),("LINEBELOW",(0,0),(-1,0),1,GOLD),("VALIGN",(0,0),(-1,-1),"TOP"),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),6)]))
        story += [KeepTogether(table), Spacer(1,7)]
    notes=Table([[Paragraph("NOTES / QUESTIONS",styles["head"])], [""], [""], [""]], colWidths=[7.1*inch], rowHeights=[.28*inch,.28*inch,.28*inch,.28*inch])
    notes.setStyle(TableStyle([("BACKGROUND",(0,0),(0,0),IVORY),("LINEBELOW",(0,0),(-1,-1),.5,HexColor("#B9B4A9")),("LEFTPADDING",(0,0),(-1,-1),6)]))
    story += [notes, Spacer(1,10)]
    warning = "SECURITY REMINDER: Do not send Social Security numbers, banking information, tax returns, identification documents, medical information, or other sensitive records through an unsecured contact form or ordinary email. Use only the approved method Alchemize provides when instructed."
    story += [Table([[Paragraph(warning,styles["warn"])]], colWidths=[7.1*inch], style=TableStyle([("BOX",(0,0),(-1,-1),1,GOLD),("BACKGROUND",(0,0),(-1,-1),HexColor("#FFF9E9")),("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)])), Spacer(1,8), Paragraph(service["disclaimer"],styles["small"]), Paragraph("Version 1.0 | August 2026",styles["small"])]
    doc.build(story)
    print(file)

premium_only = "--premium" in sys.argv[1:]
for item in DATA:
    if premium_only and item["pdf"] not in PREMIUM:
        continue
    if item["pdf"] in PREMIUM:
        build_premium(item["pdf"], PREMIUM[item["pdf"]])
    else:
        build(item)
