# Security Baseline

This project is a static public website, so the baseline is intentionally simple:

- Do not put secrets in client-side JavaScript.
- Do not collect sensitive personal or payment data through custom frontend code without a protected backend.
- Review any third-party scripts before enabling them.
- Any future authentication or administrative workflow must be server-backed.
- Payment processing must not be handled directly by custom frontend code.
- Keep environment values in `.env.example` or environment-specific configuration only, never in committed secrets.
- Client portal and admin routes are intentionally non-public preview shells only; they are not secure access controls.
- Sensitive document workflows must never be stored in publicly accessible source directories, public assets, or output folders.
- Administrative access must require authenticated server-side authorization, a secure session, and least-privilege permissions.
- Client documents, billing, and appointment data must remain protected behind separate storage and authorization layers when implemented.
- Metadata and robots directives are a courtesy for non-public routes, not a security system.

This is a documentation-only baseline for future implementation work and does not add backend systems to the site today.
