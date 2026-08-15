# Backend Readiness Report

## Executive summary

The repository currently contains a strong static marketing site plus prototype-only client and admin shells. It is not backend-ready for live user identity, data storage, document handling, or business operations. The current architecture is intentionally designed as a frontend prototype with in-memory mock data and should be treated as a design/testing layer, not a production backend.

## Current mock systems

- Client portal mock data: [js/data/client-demo-data.js](../js/data/client-demo-data.js)
- Client portal API facade: [js/data/mock-api.js](../js/data/mock-api.js)
- Admin mock data: [js/data/admin-demo-data.js](../js/data/admin-demo-data.js)
- Admin memory store: [js/data/admin-store.js](../js/data/admin-store.js)
- Admin API facade: [js/data/admin-api.js](../js/data/admin-api.js)

These are intentionally in-memory and reset on refresh. They are appropriate for prototype testing and workflow design, but they are not authentication, persistence, or compliance systems.

## Required entities

A production system would eventually need the following entities:

- Users and roles
- Clients
- Leads
- Contacts and communications
- Service engagements
- Tasks
- Documents
- Appointments
- Messages
- Invoices
- Payments
- Notifications
- Audit logs
- Activity streams
- Content records
- Portal access tokens / sessions
- Security policies and access groups

## Required APIs

Conceptual backend endpoints would need to support:

- user login / logout / session refresh
- role-based authorization checks
- client profile reads and updates
- lead creation and status updates
- lead-to-client conversion as an atomic transaction
- engagement creation and status changes
- task lifecycle management
- document request lifecycle and secure upload
- appointment scheduling and reminders
- message send / receive / archive
- invoice creation and payment status tracking
- notification delivery and read status
- audit log collection
- admin analytics reporting

## Required authentication and authorization

The repository does not contain a secure authentication implementation. Production requirements would include:

- password hashing and secure storage
- session management with rotation and expiration
- role enforcement for client vs admin vs staff users
- MFA or at least a staged risk model for sensitive workflows
- invitation or onboarding flows for new clients and staff
- password reset and email confirmation flows
- audit logging for sensitive administrative actions

## Required storage

Production would require:

- relational or document database for structured records
- secure storage for private documents and file metadata
- object storage with lifecycle controls, encryption, and access management
- backups, retention policy, and audit logging
- configuration for access patterns and role restrictions

## Required notifications and communication

- transactional email for contact form submissions and onboarding
- SMS or email reminders for appointments and tasks
- notifications for billing and document follow-up
- admin alerting for lead conversion, overdue tasks, etc.
- unsubscribe, preference, and privacy handling for contact and portal messages

## Required payments and billing

- invoicing engine
- payment processing integration
- invoice status lifecycle
- billing provider configuration and webhook handling
- PCI-safe tokenization or hosted payment flows
- payment reconciliation and receipts

## Required scheduling

- real calendar or appointment booking system
- timezone handling
- staff availability rules
- confirmation and reminder flows
- cancellation and reschedule policies

## What can be replaced cleanly

The following frontend concepts map well to a later backend model:

- lead statuses and lead-to-client conversion
- engagement status updates
- document request lifecycle
- task creation and completion
- invoice draft creation and payment lifecycle
- activity feed entries
- requests for attention queues and admin review

The current in-memory store already separates state shape from UI rendering in a way that is reasonably portable to a later server-backed datastore.

## What needs refactoring before backend connection

- remove demo-only state from production navigation flow
- separate public and authenticated application shells clearly
- do not expose prototype admin/client logic in public builds
- move API boundary to real async fetch layer with clear error handling
- enforce authorization on every route and API call
- confirm security requirements for private document handling and external integrations
- replace any feature-flag prototypes with real permission checks and data access rules

## Bottom line

The current repository is not production backend-ready. It can ship a static public website today, but it cannot safely handle live user access, secure files, payments, appointments, conversations, or operational admin data without a new backend layer and security review.
