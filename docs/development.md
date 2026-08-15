# Development Guide

This repository uses Vite for the vanilla frontend and a lightweight PHP JSON API for server-backed workflows. The first API workflow persists public Contact inquiries to MySQL.

## Setup

```bash
npm install
```

## Common commands

```bash
npm run dev
npm run lint
npm run format:check
npm run check:links
npm run check:assets
npm run build
npm run preview
npm run php:lint
npm run php:test
npm run migrations:check
```

## Local Contact API

Requirements: PHP 8.5 with PDO MySQL and a local MySQL-compatible database. Copy `server/config/config.example.php` to the ignored `server/config/config.local.php`, then enter local-only credentials. Never commit that file.

Apply migrations in numeric order to the local database:

```bash
mysql -u YOUR_LOCAL_USER -p YOUR_LOCAL_DATABASE < migrations/001_create_leads.sql
mysql -u YOUR_LOCAL_USER -p YOUR_LOCAL_DATABASE < migrations/002_create_activity_events.sql
```

Start PHP from the repository root:

```bash
php -S 127.0.0.1:8080
```

In a second terminal, start Vite:

```bash
npm run dev
```

Vite proxies `/api/*` to PHP at port 8080. Production remains same-origin and calls `POST /api/v1/leads/` directly. PHP can instead read `ALCHEMIZE_APP_ENV`, `ALCHEMIZE_DB_HOST`, `ALCHEMIZE_DB_PORT`, `ALCHEMIZE_DB_NAME`, `ALCHEMIZE_DB_USER`, and `ALCHEMIZE_DB_PASSWORD` from the server environment.

The endpoint accepts JSON only. It creates a Lead and its admin-visible `lead.created` ActivityEvent in one database transaction. It does not send email and exposes no public lead-reading endpoint.

## Architecture notes

- Static HTML pages are the source of truth for routes.
- Vite handles local development and multi-page production builds.
- Shared shell behavior is handled by the page templates and script logic, not by a framework runtime.
- Root-level and section-level asset folders remain source assets and are not moved into a framework build system.
- `api/` contains public PHP entry points; reusable PHP code belongs in `server/`.
- `migrations/` contains reviewed SQL and is never applied automatically by the application.
