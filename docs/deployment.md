# PHP Contact API Deployment Notes

These notes cover only the Contact → Lead → Activity Event slice. The existing new Hostinger database is the target for the controlled initial deployment; no second database is required.

## Hostinger layout

The public web root must contain the built marketing site and `api/v1/leads/index.php`. Place the reusable PHP application outside `public_html` when Hostinger File Manager or SSH permits it:

```text
account home or domain root/
├── alchemize-server/
│   ├── bootstrap.php
│   ├── config/
│   ├── database/
│   ├── http/
│   ├── repositories/
│   ├── services/
│   └── validation/
└── public_html/
    ├── index.html
    ├── assets/
    ├── api/v1/leads/index.php
    └── ...built public routes
```

The endpoint checks `ALCHEMIZE_SERVER_BOOTSTRAP` first, then a sibling `alchemize-server/bootstrap.php`, then the repository-local `server/bootstrap.php`. Set `ALCHEMIZE_SERVER_BOOTSTRAP` to the absolute server-side bootstrap path when the protected directory is elsewhere. If repository constraints require `server/` below the web root, the included Apache 2.4 `.htaccess` denies HTTP access; verify the denial before activating the form. Directory names alone are not security controls.

Vite does not copy PHP, `.htaccess`, `server/`, or migrations into `dist`. Deployment must intentionally publish frontend `dist/`, the public API entrypoint, and the protected PHP application. Do not place migration SQL or a protected configuration file in a downloadable public directory.

## Production configuration

Use server-side environment variables where Hostinger permits them. Otherwise create `alchemize-server/config/config.local.php` from `config.example.php` and enter the values manually through Hostinger File Manager or SSH. The file must remain untracked and outside `public_html` wherever practical. Required values to obtain from Hostinger are:

- `ALCHEMIZE_APP_ENV=production`
- `ALCHEMIZE_DB_HOST`
- `ALCHEMIZE_DB_PORT`
- `ALCHEMIZE_DB_NAME`
- `ALCHEMIZE_DB_USER`
- `ALCHEMIZE_DB_PASSWORD`

Also confirm that the selected PHP 8.5.6 runtime has `pdo_mysql` enabled. Never paste production credentials into Vite configuration, browser JavaScript, HTML, Git, deployment logs, or support messages.

Production disables PHP error display and logs unexpected failures server-side. Confirm the log destination and retention in Hostinger without logging raw request messages or credentials.

## Migration audit result

Both migrations are create-only. They contain no `DROP`, `TRUNCATE`, `DELETE`, `ALTER`, `RENAME`, `UPDATE`, or data-seeding statements. `001_create_leads.sql` creates only `leads`; `002_create_activity_events.sql` creates only `activity_events` and its foreign key to `leads`.

The schema uses InnoDB, `utf8mb4`, ASCII UUID columns, MySQL enums for controlled values, microsecond timestamps, and a 191-character email index prefix for compatibility with conservative InnoDB index limits. The migration repository check rejects destructive migration statements.

## Apply the migrations in phpMyAdmin

1. In Hostinger hPanel, open phpMyAdmin for the existing new Alchemize database.
2. Confirm the database name shown in phpMyAdmin is the intended empty/new database.
3. Open the **Import** tab and import `migrations/001_create_leads.sql`.
4. Confirm phpMyAdmin reports success and that the `leads` table appears.
5. Import `migrations/002_create_activity_events.sql`.
6. Confirm `activity_events` appears and its foreign key references `leads.id`.
7. Do not rerun a migration after it succeeds. These files intentionally fail rather than silently masking an existing incompatible table.
8. Do not configure the web endpoint to execute migrations.

Safe verification SQL:

```sql
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('leads', 'activity_events')
ORDER BY TABLE_NAME;

SHOW CREATE TABLE leads;
SHOW CREATE TABLE activity_events;
```

## Controlled first submission

After files, configuration, and migrations are in place, make one request with fake data:

```bash
curl -i -X POST "https://YOUR-DOMAIN.example/api/v1/leads/" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data '{"full_name":"Alchemize Test Lead","email":"alchemize-deployment-test@example.invalid","phone":null,"audience":"business","service_key":"business-formation","message":"Controlled deployment test. No real client information.","preferred_contact":"email","website":""}'
```

Expect HTTP `201` and only a public UUID plus status `new`. Copy the returned `leadId` into the first statement below; do not use the internal numeric ID in a browser-facing workflow.

```sql
SET @test_lead_public_id = 'PASTE-PUBLIC-UUID-FROM-RESPONSE';

SELECT
    l.public_id,
    l.full_name,
    l.email,
    l.audience,
    l.service_key,
    l.status,
    l.source,
    l.created_at,
    l.updated_at,
    COUNT(a.id) AS lead_created_event_count
FROM leads AS l
LEFT JOIN activity_events AS a
    ON a.lead_id = l.id
   AND a.event_type = 'lead.created'
WHERE l.public_id = @test_lead_public_id
GROUP BY
    l.id, l.public_id, l.full_name, l.email, l.audience,
    l.service_key, l.status, l.source, l.created_at, l.updated_at;

SELECT
    a.public_id,
    a.event_type,
    a.actor_type,
    a.entity_type,
    a.entity_id,
    a.visibility,
    a.created_at
FROM activity_events AS a
INNER JOIN leads AS l ON l.id = a.lead_id
WHERE l.public_id = @test_lead_public_id;
```

The first query must return exactly one Lead with `business`, `business-formation`, `new`, `website_contact`, and `lead_created_event_count = 1`. The second must return exactly one `lead.created` event with `public`, `lead`, matching entity UUID, and `admin` visibility.

## Targeted cleanup of the fake test

Keeping the clearly labeled first test record can be useful while validating the future admin workflow. If it should be removed, first confirm `@test_lead_public_id` still contains the exact test UUID, then delete only its dependent event and Lead inside one transaction:

```sql
SET @test_lead_public_id = 'PASTE-PUBLIC-UUID-FROM-RESPONSE';

START TRANSACTION;

DELETE a
FROM activity_events AS a
INNER JOIN leads AS l ON l.id = a.lead_id
WHERE l.public_id = @test_lead_public_id
  AND l.email = 'alchemize-deployment-test@example.invalid';

DELETE FROM leads
WHERE public_id = @test_lead_public_id
  AND email = 'alchemize-deployment-test@example.invalid';

COMMIT;

SELECT COUNT(*) AS remaining_test_leads
FROM leads
WHERE public_id = @test_lead_public_id;
```

Never use `TRUNCATE` or an unqualified `DELETE` for this cleanup.

## Endpoint checks before activation

1. Confirm PHP reports 8.5.6 and `pdo_mysql` is enabled.
2. Verify `GET /api/v1/leads/` returns JSON `405` and never returns Lead data.
3. Verify wrong content type, malformed JSON, oversized requests, and invalid fields return their expected JSON status codes.
4. Confirm one valid request creates exactly one Lead and one `lead.created` event.
5. Confirm no credentials, SQL errors, paths, stack traces, or internal numeric IDs reach the browser.
6. Confirm protected PHP configuration, migration files, and logs cannot be retrieved over HTTP.
7. Confirm the updated Privacy page is published with the activated form.
8. Configure hosting/WAF rate limiting in a later reviewed slice; the honeypot is only an initial defense.
