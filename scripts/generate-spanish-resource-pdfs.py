from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import BaseDocTemplate, Frame, Paragraph, PageBreak, PageTemplate, Spacer, Table

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "assets" / "downloads" / "es"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#213745")
TEAL = colors.HexColor("#0B4332")
GOLD = colors.HexColor("#D7B05F")
CREAM = colors.HexColor("#F3F0ED")
WHITE = colors.white
RULE = colors.HexColor("#C9C2B8")

STYLES = {
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=TEAL, spaceAfter=10),
    "subtitle": ParagraphStyle("subtitle", fontName="Helvetica", fontSize=10, leading=13, textColor=NAVY, spaceAfter=12),
    "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=TEAL, spaceAfter=8, spaceBefore=10),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=12.5, textColor=NAVY, spaceAfter=6),
    "small": ParagraphStyle("small", fontName="Helvetica", fontSize=7.5, leading=10, textColor=NAVY, spaceAfter=5),
}


def p(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, STYLES[style])


class WorkbookDoc(BaseDocTemplate):
    def __init__(self, filename: Path, heading: str, subtitle: str):
        super().__init__(
            str(filename),
            pagesize=letter,
            leftMargin=0.6 * inch,
            rightMargin=0.6 * inch,
            topMargin=0.6 * inch,
            bottomMargin=0.6 * inch,
            title=heading,
            author="Alchemize Business Services",
            subject=subtitle,
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(PageTemplate(id="main", frames=[frame]))


DOCS = {
    "business-startup-formation-workbook-es.pdf": {
        "title": "Fundación Empresarial",
        "subtitle": "Libro de trabajo para la formación y el arranque del negocio",
        "pages": [
            [p("Organice las decisiones, los registros, las inscripciones, los sistemas y las prioridades de lanzamiento detrás de un nuevo negocio.", "subtitle"), p("La mejor base empresarial no es solo una buena idea. Es una imagen clara de qué es el negocio, a quién sirve, qué necesita para operar y quién controla los registros y las decisiones importantes.", "body")],
            [p("Primeros 90 días", "section"), p("Primer año", "body"), p("Prioridades inmediatas", "body")],
            [p("Propiedad y estructura", "section"), p("La estructura de propiedad, control, responsabilidad y toma de decisiones importa desde el principio porque afecta el acceso, la autoridad, el tratamiento tributario y la complejidad futura.", "body")],
            [p("Registros y licencias", "section"), p("Nombre legal propuesto", "body"), p("Estado / ubicación de operación", "body"), p("EIN / licencias / seguros", "body")],
            [p("Lista de verificación del arranque", "section"), p("Dominio y seguridad", "body"), p("Correos y cuentas empresariales", "body"), p("Sistemas de pago y seguimiento", "body")],
            [p("Preparación para el lanzamiento", "section"), p("La meta no es la perfección el día uno. La meta es la claridad: qué está funcionando, qué falta, quién debe responder y qué debe mejorarse antes de que el negocio se vuelva más ocupado.", "body")],
            [p("Plan 30 / 60 / 90 días", "section"), p("30 días", "body"), p("60 días", "body"), p("90 días", "body"), p("Necesita ayuda para organizar la base del negocio? Programar una consulta en getalchemize.com.", "small")],
        ],
    },
    "business-operations-systems-workbook-es.pdf": {
        "title": "Operaciones Empresariales",
        "subtitle": "Libro de trabajo sobre operaciones y sistemas",
        "pages": [
            [p("Identifique registros dispersos, responsabilidades poco claras, flujos de trabajo ineficientes y sistemas digitales que necesitan atención.", "subtitle"), p("Un proceso funciona con fiabilidad cuando tiene un propietario claro, un desencadenante conocido, un lugar definido para la información, una forma de verificar el resultado y un plan para cuando falla el sistema.", "body")],
            [p("Información general del negocio", "section"), p("Etapa del negocio / tamaño del equipo", "body"), p("Productos o servicios principales", "body"), p("Dolores operativos actuales", "body"), p("Tres prioridades principales", "body")],
            [p("Responsabilidades recurrentes", "section"), p("La confiabilidad operativa suele romperse donde el trabajo recurrente no está programado, asignado ni revisado.", "body"), p("Responsabilidad", "body"), p("Propietario", "body"), p("Frecuencia", "body")],
            [p("Flujos del cliente y del interior", "section"), p("Un negocio suele tener más fricción en los puntos de transferencia que en el trabajo en sí.", "body"), p("Consulta del cliente", "body"), p("Seguimiento y resolución", "body")],
            [p("Inventario del sistema digital", "section"), p("La tecnología debe apoyar las operaciones, no crear otra capa de confusión.", "body"), p("Sitio web / dominio", "body"), p("Correo / programación", "body")],
            [p("Plan de acción prioritario", "section"), p("Esta página final ayuda a convertir la evaluación en una secuencia práctica, en lugar de una larga lista de tareas.", "body"), p("Necesita ayuda para convertir la evaluación en un plan práctico? Programar una consulta en getalchemize.com.", "small")],
        ],
    },
    "business-tax-preparation-organizer-es.pdf": {
        "title": "Impuestos Empresariales",
        "subtitle": "Organizador para la preparación de impuestos del negocio",
        "pages": [
            [p("Organice los registros del negocio, las preguntas de conciliación, los elementos faltantes y la preparación para la presentación del impuesto del año fiscal.", "subtitle"), p("Este formato está pensado para registrar los hechos reales del negocio antes de preparar la declaración. Un buen organizador tributario responde: qué cambió, qué registros existen, qué falta y qué puede explicarse con claridad.", "body")],
            [p("Ingresos y preparación contable", "section"), p("El organizador tributario más valioso no solo recopila totales. Ayuda a determinar si los totales son consistentes, si falta respaldo y si la Teneduría de libros refleja la actividad real del negocio.", "body")],
            [p("Organización de gastos", "section"), p("Esto no es solo un ejercicio de clasificación. Es un ejercicio de organización de registros.", "body")],
            [p("Personas, activos y otros registros", "section"), p("Un organizador tributario empresarial es más útil cuando captura no solo las cuentas, sino también a las personas y los activos que impulsan la actividad y la presentación de informes.", "body")],
            [p("Preguntas de conciliación", "section"), p("Las diferencias entre totales no siempre significan un error; a veces reflejan diferencias de tiempo, comisiones, reembolsos, duplicados o informes brutos versus netos.", "body")],
            [p("Cronograma de cambios del negocio", "section"), p("Un año empresarial puede cambiar por propiedad, contratación, financiamiento, equipos, propiedad, ubicación o actividad. Registre la fecha del cambio y el registro que la respalda.", "body")],
        ],
    },
    "consultation-preparation-workbook-es.pdf": {
        "title": "Preparación para la Consulta",
        "subtitle": "Libro de trabajo para lograr una consulta más productiva",
        "pages": [
            [p("Organice el contexto, las preguntas, los registros y las prioridades que pueden hacer que su consulta sea más productiva.", "subtitle"), p("Una consulta útil suele comenzar con la responsabilidad o decisión, no con una pila de documentos. Use este cuaderno para aclarar qué está ocurriendo, qué está bloqueado y qué resultado ayudaría realmente.", "body")],
            [p("¿Qué lo trae por aquí?", "section"), p("¿Qué intenta lograr?", "body"), p("¿Qué problema intenta resolver?", "body"), p("¿Qué decisión parece bloqueada?", "body")],
            [p("Tiempo importante", "section"), p("Fecha límite / presentación", "body"), p("Cita / renovación", "body"), p("Inicio / aviso recibido", "body")],
            [p("Por qué esto importa", "section"), p("La consulta más útil se centra en un problema actual, una decisión concreta y las preguntas que deben responderse con mayor claridad antes de actuar.", "body")],
        ],
    },
    "individual-tax-preparation-organizer-es.pdf": {
        "title": "Impuestos Personales",
        "subtitle": "Organizador para la preparación de impuestos individuales",
        "pages": [
            [p("Organice los documentos esperados, los cambios de vida, los registros faltantes, las preguntas y la preparación para la presentación del impuesto del año fiscal.", "subtitle"), p("Comience con el año, no con los formularios. La forma más fácil de identificar documentos faltantes es pensar qué cambió durante el año: cambios de trabajo, ingresos, vivienda o propiedades, jubilación, cambios familiares, eventos financieros o avisos tributarios.", "body")],
            [p("¿Qué cambió este año?", "section"), p("Matrimonio, divorcio, nuevo dependiente o dependencia que termina", "body"), p("Traslado, cambio de empleo, jubilación o cambio importante de ingresos", "body")],
            [p("Registros de ingresos y gastos", "section"), p("Reúna formularios, recibos y documentos de respaldo para todos los ingresos y gastos relevantes.", "body")],
            [p("Cambios de vida y familia", "section"), p("Los cambios de vida pueden afectar dependientes, deducciones, ingresos, cobertura o residencia. Registre la fecha y la documentación relacionada.", "body")],
            [p("Preparación y siguiente paso", "section"), p("Un cambio no crea automáticamente un resultado tributario específico. Regístrelo para que el preparador determine qué preguntas y documentos corresponden.", "body")],
        ],
    },
}


def build_doc(filename: str, title: str, subtitle: str, pages: list[list[Paragraph]]) -> None:
    path = OUTPUT_DIR / filename
    doc = WorkbookDoc(path, title, subtitle)
    story = [p(title, "title"), p(subtitle, "subtitle"), Spacer(1, 0.18 * inch)]
    for page in pages:
        story.extend(page)
        story.append(PageBreak())
    doc.build(story)


def main() -> None:
    for filename, metadata in DOCS.items():
        build_doc(filename, metadata["title"], metadata["subtitle"], metadata["pages"])
        print(f"Created {filename}")


if __name__ == "__main__":
    main()
