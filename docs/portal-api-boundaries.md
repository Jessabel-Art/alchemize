# Portal API Boundaries

> Architecture note: [system-specification.md](system-specification.md) supersedes this document where contracts differ. In particular, `/services` is the catalog resource and client-specific work belongs under `/engagements`; all routes remain conceptual.

This document describes the expected API responsibilities for a future authenticated portal and admin experience. These routes are conceptual and not implemented in the current static site.

## Authentication

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/refresh`
- `/api/auth/reset-password`

Responsibilities:

- verify credentials
- create and invalidate secure sessions
- enforce role-based access
- support password reset flows for authorized authentication systems

## Client and relationship data

- `/api/clients`
- `/api/clients/:id`
- `/api/clients/:id/services`

Responsibilities:

- provide client profile data
- represent active and historical relationships
- serve service engagement summaries for permissions-checked dashboards

## Service engagement management

- `/api/services`
- `/api/services/:id`
- `/api/services/:id/tasks`
- `/api/services/:id/documents`

Responsibilities:

- track service status and next steps
- coordinate tasks and required documents
- support engagement-level progress displays

## Tasks and workflows

- `/api/tasks`
- `/api/tasks/:id`

Responsibilities:

- list task assignments
- allow staff to assign or update statuses
- provide client-facing remaining-action views

## Documents

- `/api/documents`
- `/api/documents/:id`
- `/api/documents/upload`

Responsibilities:

- support secure document handling
- authorize access based on role and relationship
- manage stored metadata and audit logs

## Appointments

- `/api/appointments`
- `/api/appointments/:id`

Responsibilities:

- schedule and update appointments
- manage availability and preparation notes
- support administrative visibility into upcoming work

## Messaging

- `/api/messages`
- `/api/messages/:id`

Responsibilities:

- support authenticated communication between client and staff
- keep message history tied to client or service records
- enforce secure access and message retention policies

## Billing and payments

- `/api/billing`
- `/api/invoices`
- `/api/payments`

Responsibilities:

- provide invoice and payment status
- direct payment processing to an approved provider, not in the frontend
- keep payment data outside the public static site

## Content and settings

- `/api/content`
- `/api/settings`

Responsibilities:

- support operational configuration and content management for staff tools
- keep admin configuration separate from public marketing content

## Prototype mutation boundaries

The current admin prototype includes in-memory write operations for operational evaluation only. These are not production API calls and they intentionally reset on refresh.

### Conceptual future endpoints

- `POST /clients`
- `POST /engagements`
- `POST /tasks`
- `POST /document-requests`
- `POST /appointments`
- `PATCH /engagements/:id`
- `PATCH /tasks/:id`
- `PATCH /leads/:id`
- `POST /activity`
- `POST /notes`

### Atomic transactions required later

Operations that mutate multiple records should eventually be atomic. The clearest example is lead conversion:

- update lead status
- create client record
- create activity log
- optionally create engagement

If this is not transactional, the product risks inconsistent lead and client state. The prototype is intentionally structured so these later boundaries are easy to convert into real server transactions.

## Security boundary

The frontend should never make authorization decisions on its own. It should only render based on server-issued state and route access rules. The production backend remains responsible for enforcing security and privacy policy, including validation, authorization, and audit logging.
