# Production Blockers

Only issues that meaningfully warrant a launch hold are listed here.

## CRITICAL

### 1. Accessibility contrast failures are blocking launch

- Automated axe scans show serious color-contrast violations on multiple public routes.
- This impacts readability and legal accessibility compliance.
- Likely source: global shared theme colors in the site stylesheet that are reused across page sections.

### 2. Checklist PDF deliverables are missing

- Public service pages and resource pages link to nine expected /assets/downloads files.
- Those files are not present in the repository snapshot.
- This means the site currently advertises downloadable assets that are not actually available.

## HIGH

### 3. Legal pages are still working drafts, not final production legal documents

- Privacy and Terms pages include placeholder dates and review comments.
- These are explicitly marked as owner/legal review items.
- They should not be treated as final published legal terms for a live commercial website.

### 4. Browser preview/runtime issue remains unresolved

- Representative Playwright checks show console-level MIME-type errors on multiple routes.
- This is not a cosmetic issue; it points to a real runtime or asset-serving problem in the preview environment.

## MEDIUM

### 5. Insurance and tax scope should be explicitly bounded before launch

- Public copy references product availability, underwriting, licensing, and tax preparation scope.
- The exact service boundaries have not been confirmed as a final owner-approved policy.

### 6. Formation and advisory boundaries require explicit final approval

- The site uses language that could be read as broader business support than the owner intends to offer.
- This should be aligned with the final service model before launch.

## LOW

### 7. Naming and CTA label inconsistencies remain

- Some service names and call-to-action labels vary across the site.
- This is a content polish issue, not a technical blocker, but it should be resolved as part of final owner approval.

---

Final decision: do not treat the site as production-ready until the critical and high blockers above are resolved.
