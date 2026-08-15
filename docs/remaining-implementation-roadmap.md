# Remaining Implementation Roadmap

## Phase 1 — Public site launch readiness

- Scope: finalize remaining public marketing content edits, legal copy signoff, downloadable PDFs, and quality review
- Dependencies: owner approval on service scope, legal review, final assets
- Blockers: final content approval, accessibility fixes, brand color contrast adjustments
- Order: first, because the public site can operate as a static front door without a backend

## Phase 2 — Contact and lead intake backend

- Scope: create a real contact/consultation intake service, lead storage, confirmation, spam protections, and admin review flow
- Dependencies: backend framework and database decisions, email/notification provider decisions, lead workflow definition
- Blockers: no real endpoint exists yet; form is disabled
- Order: second, because it unlocks the website’s real conversion path

## Phase 3 — Authentication and user identity

- Scope: secure sign-in for client and staff, role assignments, session handling, password reset, and authorization rules
- Dependencies: auth provider or custom auth service, session and user model
- Blockers: no authentication exists in the repository
- Order: third, before client/admin routing can be trusted

## Phase 4 — Client/Admin database foundation

- Scope: replace mock data with real persisted records, service records, client settings, and admin data models
- Dependencies: DB selection, schema definition, migration strategy, API layer, access rules
- Blockers: current data is loaded from mock arrays in JS and resets on refresh
- Order: fourth, because live app features depend on data storage structure

## Phase 5 — Secure document handling

- Scope: private storage, access control, upload validation, document lifecycle, and staff review workflow
- Dependencies: storage provider, encryption, retention policy
- Blockers: no secure upload flow or storage exists
- Order: fifth, after auth and core DB foundation are in place

## Phase 6 — Appointments and messaging

- Scope: real scheduling, reminders, message delivery, read/unread handling, and staff/client communication flows
- Dependencies: scheduling and notification infrastructure, message data model
- Blockers: current portal features are mock-only
- Order: sixth, because they are operationally valuable but not the first dependency

## Phase 7 — Billing and payment operations

- Scope: invoice operations, payment processing, receipt generation, status reconciliation, and accounting controls
- Dependencies: payment provider, invoicing workflow, accounting data rules
- Blockers: no payment or real invoicing system exists
- Order: seventh, after core access and operational records are live

## Phase 8 — Notifications and automation

- Scope: email reminders, admin action notices, portal alerts, appointment follow-ups, task nudges, and document reminders
- Dependencies: email provider, notification templates, delivery tracking
- Blockers: not implemented in current repo
- Order: eighth, as operational maturity layer after core workflows exist

## Phase 9 — Security hardening

- Scope: vulnerability review, input validation, rate limiting, secrets management, logging, access review, and compliance planning
- Dependencies: full application architecture and deployment model
- Blockers: no production security review has been performed for live-user features
- Order: ninth, but it should run in parallel with the backend build rather than only at the end

## Phase 10 — Production launch validation

- Scope: end-to-end smoke checks, auth testing, payment testing, scheduling tests, document upload tests, privacy review, and final launch readiness signoff
- Dependencies: all earlier phases complete
- Blockers: unresolved owner decisions, legal review, operational policy decisions
- Order: final phase

## Recommended ordering logic

The best sequence is:

1. public static launch readiness
2. contact/lead intake backend
3. auth and sessions
4. database + client/admin data layers
5. secure documents
6. scheduling/messages
7. billing/payments
8. notifications automation
9. security hardening
10. final launch validation

This keeps the public face live while progressively enabling the internal product that the portal prototypes are trying to represent.
