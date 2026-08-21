# Service Checklist System

Nine service preparation PDFs share one generator. Three high-use client tools—insurance consultation, business formation, and business operations—use the premium two-page layout; the remaining six retain the compatible flow layout until they are intentionally upgraded.

## Source and outputs

- Service and checklist content: `content/service-details.json`
- Service-page generator: `scripts/generate-service-pages.js`
- PDF generator: `scripts/generate-checklists.py`
- Premium page models: `content/checklist-layouts.json`
- Service HTML outputs: the nine folders under `services/individuals/` and `services/businesses/`
- PDF outputs: `public/assets/downloads/` (published at `/assets/downloads/`)

## Regeneration

Run:

```bash
npm run generate:services
npm run generate:checklists
npm run format
npm run check
```

To regenerate only the three premium checklists without touching the other six outputs, run:

```bash
npm run generate:checklists:premium
```

The PDF generator requires ReportLab. The bundled Codex document runtime includes it; a local maintainer can install `reportlab` with Python if needed.

## Checklist names

1. Individual Tax Preparation Document Checklist
2. Insurance Consultation Preparation Checklist
3. Notary Appointment Preparation Checklist
4. Business Formation & Startup Checklist
5. Business Operations Organization Checklist
6. Business Tax Preparation Document Checklist
7. Business Advisory Consultation Preparation Guide
8. Business Insurance Consultation Checklist
9. Business Document & Notary Preparation Checklist

## Premium template capabilities

- Fixed US Letter canvas with printer-safe margins and a quiet emerald/gold footer.
- Approved light logo colorway for the dark masthead, optimized at generation time without changing the source asset.
- Distinct page-one masthead and compact continuation masthead on page two.
- Two-column checklist sections, true drawn checkboxes, writing rules, reflection prompts, and optional full-width readiness sections.
- Selectable/searchable text plus PDF title, author, and subject metadata.
- Service-specific page composition is declarative in `content/checklist-layouts.json`; reusable drawing behavior remains in the Python generator.

## Typography and branding

- Times Bold provides the editorial display hierarchy; Helvetica supports labels, checklist copy, notes, and metadata.
- Use deep emerald `#062B2B`, forest green `#0B4332`, light gold `#D7B05F`, navy, warm ivory, gray, and white.
- Preserve a clear hierarchy: service/audience label, document title, page purpose, section title, checklist item, notes, and footer metadata.
- Keep checkboxes, rules, and hierarchy legible in grayscale; never use color as the only organizational cue.

## Page and content rules

- Prefer one page only when the checklist remains comfortably writable and scannable. Use two pages when the service needs separate preparation phases or meaningful writing space.
- Page two must open with a real continuation header and page-specific purpose—not an orphaned overflow page.
- Notes areas should be labeled for a decision, question, or priority rather than added as decorative blank space.
- Keep the security note visually distinct but secondary. It belongs on the final page above the service-specific scope disclaimer.
- Never ask users to transmit sensitive records through unsecured forms or ordinary email.

## General branding rules

- Use an approved horizontal logo from `assets/` without alteration. The premium dark masthead uses `alchemize-logo-light.png` because the file name describes the logo colorway, not the surface theme.
- Use emerald, gold, navy, ivory, and white only.
- Keep US Letter margins suitable for ordinary office printers.
- Checkboxes, rules, and hierarchy must remain usable in grayscale.
- Keep legal/scope language concise and specific to the service.
- Never ask users to transmit sensitive records through unsecured forms or ordinary email.

## Versioning

Use `Version major.minor | Month Year` in every PDF. Increase the minor version for copy/checklist refinements and the major version when the document structure or service scope changes materially.

## Updating a checklist

For a legacy checklist, edit the applicable object in `content/service-details.json`, including its `categories`, `checkPurpose`, and `disclaimer`. For a premium checklist, edit its service-specific pages, sections, prompts, and disclaimer in `content/checklist-layouts.json`. Regenerate, render every changed page to images, inspect it at actual size and in grayscale, verify text extraction and PDF metadata, then run the full site checks.

## Route relationship

Each service page links directly to its corresponding file in `/assets/downloads/`. The Resources page provides a compact checklist library linking back to the service context and to each PDF. PDF filenames are stable so future revisions do not require URL changes.
