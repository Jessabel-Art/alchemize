# Content Publishing Workflow

This site is intentionally static. New article and resource pages should be added through repeatable tooling instead of ad hoc directory copying.

## Workflow

1. Run `npm run new:resource` or `npm run new:blog`.
2. Enter a title, slug, category/topic, and meta description when prompted.
3. Edit the generated page content to add the final article structure.
4. Run `npm run content:check`.
5. Run `npm run build`.
6. Preview locally and verify the route.
7. Commit the page and related metadata updates.

## Content conventions

- Resources are evergreen, practical, and reference-oriented.
- Blog articles are timely commentary, seasonal reminders, and operational observations.
- FAQ entries are concise and direct.
- Avoid artificial urgency or promotional claims in educational content.

## Future metadata

The page templates currently support the essentials needed for publishing. Future additions may include:

- published date
- updated date
- author
- reading time
- featured image

These should be added deliberately and only when the project is ready to maintain them consistently.
