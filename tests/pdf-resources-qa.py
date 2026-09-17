# Downloadable resource PDFs: content-quality QA.
#
# Regenerates all 10 canonical English/Spanish PDFs, then scans every page's
# extracted text for unparsed source-markup leakage (a directive or table
# row that the generator failed to render, e.g. a literal "### Heading" or
# "CALLOUT:" string appearing in the output) and for suspiciously
# near-empty pages (a sign of a stray page break or overflow bug). Run
# manually with:
#
#   python tests/pdf-resources-qa.py
#
# This is a content/rendering check, not part of the Playwright suite --
# similar to tests/php/*.php, it exercises the real PDF generator and its
# real output rather than mocked data.
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

try:
    import fitz  # PyMuPDF
except ImportError:
    print("SKIPPED: PyMuPDF (pip install pymupdf) is not installed.")
    sys.exit(0)

CANONICAL_RESOURCE_IDS = [
    "business-startup-formation-workbook",
    "business-operations-systems-workbook",
    "business-tax-preparation-organizer",
    "individual-tax-preparation-organizer",
    "consultation-preparation-workbook",
]

MARKDOWN_LEAK_PATTERNS = [
    (re.compile(r"(?<!\w)#{1,6}\s"), "leading # heading marker"),
    (re.compile(r"\*\*[^\n*]+\*\*"), "bold ** markup"),
    (re.compile(r"(?<!\w)\[ \]"), "literal unchecked-box brackets"),
    (re.compile(r"(?<!\w)\[x\]", re.IGNORECASE), "literal checked-box brackets"),
    (
        re.compile(r"\b(CALLOUT|EXAMPLE|WATCH|MICRO|CHIPS|SCALE|MATRIX|TIMELINE|LINES):"),
        "unparsed directive",
    ),
    (re.compile(r"---PAGE---"), "unparsed page-break marker"),
]

NEAR_BLANK_LINE_THRESHOLD = 5


def regenerate() -> None:
    script = ROOT / "scripts" / "generate-downloadable-resources.py"
    result = subprocess.run([sys.executable, str(script)], cwd=ROOT)
    if result.returncode != 0:
        raise SystemExit("Generator failed -- see output above.")


def scan_pdf(path: Path) -> list[str]:
    problems = []
    doc = fitz.open(str(path))
    for page_index in range(doc.page_count):
        text = doc[page_index].get_text()
        for pattern, label in MARKDOWN_LEAK_PATTERNS:
            match = pattern.search(text)
            if match:
                problems.append(
                    f"page {page_index + 1}: {label}: {match.group()[:60]!r}"
                )
        body_lines = [line for line in text.strip().splitlines() if line.strip()]
        if len(body_lines) <= NEAR_BLANK_LINE_THRESHOLD:
            problems.append(
                f"page {page_index + 1}: near-blank page ({len(body_lines)} lines of text)"
            )
    doc.close()
    return problems


def main() -> None:
    regenerate()
    all_problems: dict[str, list[str]] = {}
    for resource_id in CANONICAL_RESOURCE_IDS:
        for rel in (
            f"public/assets/downloads/{resource_id}.pdf",
            f"public/assets/downloads/es/{resource_id}-es.pdf",
        ):
            path = ROOT / rel
            if not path.exists():
                all_problems[rel] = [f"MISSING FILE: {rel}"]
                continue
            problems = scan_pdf(path)
            if problems:
                all_problems[rel] = problems

    if all_problems:
        print("FAILED: content-quality issues found in generated PDFs:\n")
        for rel, problems in all_problems.items():
            print(f"=== {rel} ===")
            for problem in problems:
                print(f"  {problem}")
        raise SystemExit(1)

    print(f"PASS: {len(CANONICAL_RESOURCE_IDS) * 2} PDFs (5 English + 5 Spanish) "
          "have no markdown leakage and no near-blank pages.")


if __name__ == "__main__":
    main()
