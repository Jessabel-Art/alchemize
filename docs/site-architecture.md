# Site Architecture

This project remains a vanilla HTML, CSS, and JavaScript site packaged with Vite.

## Structure

- Root-level pages such as `index.html` serve as entry routes.
- Section directories such as `services/`, `about/`, `resources/`, `faq/`, and `contact/` each contain their own page entry points.
- Shared layout behavior is handled through lightweight page patterns and script-driven behavior rather than a framework.
- Static assets remain in their existing source locations and are referenced directly by HTML and CSS.

## Build model

Vite is used for local development and production builds. The build configuration discovers page entries from the top-level route directories so the site continues to work as a multi-page static experience.

## Future integration notes

- Forms and scheduling flows should eventually be backed by server-side endpoints.
- Analytics, CRM, and payments should be introduced through explicit integration points rather than embedded directly into page logic.
- SEO files such as `robots.txt` and `sitemap.xml` live in the public output area so they can be generated or served cleanly during production builds.
