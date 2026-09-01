# Alchemize Platform System Specification

Status: pre-backend architecture baseline  
Authority: this document is the highest-level product architecture reference. Detailed companion documents are linked below. Existing prototype documents remain informative where they do not conflict with this specification.

## 1. Purpose and principles

Alchemize is a unified professional-services operating system supporting public lead acquisition, client onboarding, service engagements, internal operations, document workflows, appointments, billing, communications, notifications, and future third-party integrations.

Alchemize owns the client experience while specialized infrastructure remains integrated behind it. The platform must make responsibilities clear without misrepresenting service scope, provider responsibilities, security, or regulatory authority.

This specification defines what the system must know, store, authorize, transition, trigger, and expose. It does not select vendors, database technology, authentication implementation, or deployment infrastructure.

## 2. Current-state truth

The repository contains a production-capable static marketing site and non-production Client/Admin prototypes. `js/data/*demo-data.js`, `admin-store.js`, `mock-api.js`, and `admin-api.js` are in-memory fixtures/facades. They provide workflow evidence but no authentication, durable persistence, secure storage, authorization, transactional integrity, or provider integration.

Public contact submission is not yet a live lead-ingestion system. Portal route visibility is not security. No prototype data should be migrated as real client data.

## 3. System boundaries

| Layer              | Owns                                                                                                                              | Must not own                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Public Website     | Marketing, service discovery, educational content, minimal inquiry capture                                                        | Sensitive intake, authorization, private records                     |
| Client Application | Authorized views of relationships, engagements, tasks, documents, appointments, conversations, billing, notifications             | Trust decisions or direct vendor secrets                             |
| Admin Application  | Internal workflows, review queues, client/lead operations, content/configuration within permission                                | Authorization enforcement or direct datastore access                 |
| Backend/API        | Identity linkage, persistence, validation, authorization, transactions, workflows, derived queries, audit, provider orchestration | Vendor-specific UI behavior                                          |
| External Providers | Specialized delivery infrastructure: identity, email, storage, payments, calendar, accounting/tax/insurance systems               | Alchemize business truth, client authorization, engagement lifecycle |

## 4. Canonical terminology

- **User**: authenticated identity. A User is not a Client.
- **Client**: the professional-service relationship with a person or organization.
- **Business**: an organization associated with a Client and authorized Users.
- **Service**: reusable catalog definition.
- **Service Engagement**: a specific Client instance of a Service. Never use Project, Case, Job, or Service Request as synonyms unless a later specialized entity is formally defined.
- **Workflow Stage**: service-specific position in the method.
- **Engagement Status**: current operational condition independent of stage.
- **Contact**: a person/contact method associated with a Lead, Client, or Business.
- **Activity Event**: user-friendly operational history.
- **Audit Event**: protected security/compliance evidence.

## 5. Canonical service catalog

Canonical keys follow `content/service-details.json` slugs. Routes are normalized with leading/trailing slashes. Consultation routing values must use the canonical key unless an owner-approved intake vocabulary supersedes it.

| Key                    | Public name                      | Audience   | Category              | Route                                                  | Workflow                              | Checklist                              | Related resources            | Scope review                                                                           |
| ---------------------- | -------------------------------- | ---------- | --------------------- | ------------------------------------------------------ | ------------------------------------- | -------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| `individual-tax`       | Individual Tax Preparation       | Individual | Tax                   | `/services/individuals/tax-preparation/`               | Gather, Review, Prepare, Finalize     | Individual Tax Preparation Organizer   | Tax preparation guides       | General boundary present; exact offered filing scope requires operational confirmation |
| `individual-insurance` | Insurance Solutions              | Individual | Insurance             | `/services/individuals/insurance/`                     | Identify, Organize, Explore, Decide   | Insurance planning checklist           | Insurance guides             | **Owner review:** lines and jurisdictions                                              |
| `individual-notary`    | Notary & Document Services       | Individual | Notary/Documents      | `/services/individuals/notary-document-services/`      | Prepare, Verify, Execute, Complete    | Notary appointment prep checklist      | Notary guides                | Confirm jurisdiction and authorized act scope                                          |
| `business-formation`   | Business Formation & Startup     | Business   | Formation             | `/services/businesses/business-formation/`             | Clarify, Prepare, Establish, Organize | Business Startup & Formation Workbook  | Startup guides               | **Owner review:** formation/EIN boundary                                               |
| `business-operations`  | Administration & Operations      | Business   | Operations            | `/services/businesses/administration-operations/`      | Map, Structure, Document, Maintain    | Business Operations & Systems Workbook | Records/operations guides    | Confirm deliverables and exclusions                                                    |
| `business-tax`         | Business Tax Services            | Business   | Tax                   | `/services/businesses/business-tax/`                   | Assemble, Reconcile, Prepare, Close   | Business Tax Preparation Organizer     | Business tax guides          | **Owner review:** entity/return types                                                  |
| `business-advisory`    | Business Advisory                | Business   | Advisory              | `/services/businesses/business-advisory/`              | Understand, Evaluate, Prioritize, Act | Consultation Preparation Workbook      | Advisory/organization guides | **Owner review:** advisory boundary                                                    |
| `business-insurance`   | Business Insurance Solutions     | Business   | Insurance             | `/services/businesses/business-insurance/`             | Profile, Assess, Explore, Proceed     | Insurance planning checklist           | Insurance/business guides    | **Owner review:** lines, carriers, jurisdictions                                       |
| `business-notary`      | Notary & Administrative Services | Business   | Notary/Administration | `/services/businesses/notary-administrative-services/` | Prepare, Verify, Execute, Record      | Notary appointment prep checklist      | Document/notary guides       | Confirm jurisdiction and administrative boundary                                       |

Prototype aliases requiring migration: `individual-tax-preparation` → `individual-tax`; `notary-document-services` → `individual-notary`; `insurance-review` → `individual-insurance`. New persisted data must use canonical keys. Each Service record should include `key`, name, audience, category, route, workflow definition, checklist definition references, resource references, consultation routing value, active/version status, and scope-review status.

## 6. Core entity model

| Entity                   | Purpose / key attributes                                                                     | Relationships and visibility                                    | Lifecycle                                                                 | MVP                                   |
| ------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| User                     | Auth identity: id, email, displayName, status, lastLoginAt                                   | Roles and explicit Client/Business grants; self/admin visible   | Invited, Active, Suspended, Archived                                      | Yes                                   |
| Role                     | Named permission bundle                                                                      | Assigned to Users; admin managed                                | Active, Archived                                                          | Yes                                   |
| Permission               | Atomic capability key                                                                        | Granted through roles/limited overrides                         | Defined, Deprecated                                                       | Yes                                   |
| Lead                     | Pre-client inquiry: contact, audience, serviceInterest, source, owner, nextAction            | Admin only; may convert to Client                               | See §8                                                                    | Yes                                   |
| Contact                  | Person and approved contact methods/preferences                                              | Lead, Client, Business; visibility by relationship              | Active, Inactive, Archived                                                | Yes                                   |
| Client                   | Service relationship: type, displayName, status, primaryContactId                            | Many engagements/documents/etc.; admin and authorized Users     | Prospective, Active, Inactive, Archived                                   | Yes                                   |
| Business                 | Legal/operating organization metadata                                                        | Associated Client, Contacts, authorized Users                   | Prospective, Active, Inactive, Archived                                   | Yes                                   |
| Service                  | Versioned reusable catalog definition                                                        | Referenced by Engagements/checklists/resources                  | Draft, Active, Retired                                                    | Yes                                   |
| ServiceEngagement        | Client-specific service: serviceKey, clientId, businessId?, status, stage, dates, nextAction | Parent of tasks, requests, appointments, conversations, billing | See §9                                                                    | Yes                                   |
| Workflow / WorkflowStage | Versioned service method and ordered stages                                                  | Service definition; stage captured on Engagement                | Draft, Active, Retired                                                    | Yes, may initially be configuration   |
| Task                     | Work item: title, status, assignee, priority, dueAt, visibility                              | Client/Engagement; admin-only or client-facing                  | See §11                                                                   | Yes                                   |
| Checklist                | Reusable versioned preparation definition                                                    | Service and downloadable PDF representation                     | Draft, Active, Retired                                                    | Later/MVP config                      |
| ChecklistAssignment      | Engagement-specific progress snapshot                                                        | Engagement, definition version, items                           | Assigned, In Progress, Completed, Archived                                | Later                                 |
| DocumentRequest          | Request for evidence/file                                                                    | Client/Engagement; staff and authorized client                  | See §12                                                                   | Later                                 |
| Document                 | Stored-file metadata, never raw public URL                                                   | Client/Engagement/request; authorization by classification      | Received, Under Review, Accepted, Replacement Requested, Shared, Archived | Later                                 |
| Appointment              | Scheduled/requested meeting with timezone and method                                         | Client/Engagement/participants                                  | See §13                                                                   | Later                                 |
| Conversation             | Thread container: subject, status                                                            | Client, optional Engagement, participants                       | Open, Closed, Archived                                                    | Later                                 |
| Message                  | Immutable communication entry/attachment refs                                                | Conversation; sender and visibility                             | Sent, Delivered, Failed, Archived                                         | Later                                 |
| Notification             | System alert per User/channel                                                                | References related entity                                       | Pending, Sent, Failed, Read, Archived                                     | Later                                 |
| Quote / Estimate         | Proposed service/lines/validity                                                              | Client/Engagement optional                                      | Draft, Sent, Accepted, Declined, Expired, Cancelled                       | Later                                 |
| Invoice / InvoiceLine    | Alchemize receivable and detail lines                                                        | Client/Engagement/payments                                      | See §14                                                                   | Later                                 |
| Payment / Refund         | Provider transaction reference and reconciliation                                            | Invoice; no raw card data                                       | Pending, Succeeded, Failed, Refunded/Partially Refunded                   | Later                                 |
| InternalNote             | Staff-only narrative                                                                         | Lead/Client/Engagement; never client-visible                    | Active, Amended, Archived                                                 | Yes                                   |
| ActivityEvent            | Human-readable timeline                                                                      | Actor, Client, Engagement, visibility                           | Append-oriented; correction by superseding event                          | Yes                                   |
| AuditEvent               | Security evidence: action, actor, target, context, outcome                                   | Privileged access only                                          | Append-oriented, retention protected                                      | Yes for security-relevant MVP actions |
| IntegrationConnection    | Provider/configuration linkage, status, external refs                                        | Tenant/environment; privileged admin                            | Pending, Active, Error, Revoked                                           | Later                                 |

Future specialized entities—`TaxEngagement`/`TaxYear`, `InsuranceRelationship`/`Policy`, `FundingOpportunity`, `BookkeepingConnection`—are extensions, not MVP requirements. They must reference the base Client/Business/Engagement model.

## 7. Identity and authorization model

`User ≠ Client`. A Client can exist with no portal User, one User, or multiple Users. A User may be granted access to one individual Client and/or multiple Business/Client records. Access requires an explicit server-side relationship grant; matching email addresses are insufficient.

Initial roles: Owner/Super Admin, Administrator, Staff, Client, Business Authorized User. Roles are permission bundles, not the complete authorization decision. Every protected decision combines authenticated User, permission, record relationship, sensitivity, and action. See [permissions-matrix.md](permissions-matrix.md).

Business stores legal name, DBA, entity type, formation state, non-secret EIN status/reference, associated Client, and authorized Users. Raw EIN values or sensitive formation data must never be embedded in frontend fixtures or public assets.

## 8. Lead lifecycle and conversion

Canonical states: `New → Contacted → Consultation Requested → Consultation Scheduled → Qualified → Converted`. `Closed` may be reached from any non-converted state and is terminal unless explicitly reopened to `Contacted`. Consultation Requested can precede Contacted when created from the public form. Conversion requires a contact identity, client type, and confirmed disposition.

Lead-to-client conversion is one atomic backend operation:

1. validate lead is Qualified (or require authorized override with reason);
2. set Lead to Converted;
3. create Client and primary Contact;
4. optionally create Business;
5. optionally create User invitation;
6. optionally create ServiceEngagement and onboarding task set;
7. append ActivityEvent and AuditEvent;
8. commit all or none and return stable identifiers.

Client lifecycle is deliberately separate: Prospective, Active, Inactive, Archived.

## 9. Engagement lifecycle

Statuses describe operational condition; stages describe service method. Example: a tax Engagement can be at stage `Gather` with status `Waiting on Client`.

| Status               | Meaning                           | Client visible                            | Attention / notification                                        |
| -------------------- | --------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| Preparing            | Internal setup/intake preparation | Optional plain-language version           | Admin attention; no automatic client alert unless action exists |
| Waiting on Client    | Client action required            | Yes                                       | Dashboard attention; notify on entry/action assignment          |
| Waiting on Alchemize | Staff action required             | Yes                                       | Admin attention                                                 |
| Scheduled            | Work/meeting scheduled            | Yes                                       | Confirmation/reminder as applicable                             |
| In Progress          | Active work                       | Yes                                       | Informational                                                   |
| Review               | Internal or joint review          | Plain-language client view if appropriate | Admin attention when internal                                   |
| Ready for Client     | Deliverable/action ready          | Yes                                       | Notify client                                                   |
| Completed            | Scope completed                   | Yes                                       | Completion event/notification                                   |
| Archived             | Removed from active operations    | Historical if authorized                  | No active attention                                             |

Normal transitions are Preparing→Waiting on Client/Waiting on Alchemize/Scheduled/In Progress; Waiting states↔In Progress; In Progress→Review; Review→In Progress/Ready for Client; Ready for Client→In Progress/Completed; Completed→Archived. Reopening requires permission, reason, ActivityEvent, and AuditEvent. Stage changes may occur without status changes and vice versa.

## 10. Service workflow stages

- Individual Tax: **Gather** collect approved records; **Review** organize/gap-check; **Prepare** perform accepted preparation; **Finalize** authorizations and next steps.
- Individual Insurance: **Identify** protection questions/context; **Organize** relevant information; **Explore** available options within scope; **Decide** client/provider decision and follow-through.
- Individual Notary: **Prepare** document/signer readiness; **Verify** identity and permitted requirements; **Execute** authorized act; **Complete** record/return next steps.
- Formation: **Clarify** goals and required decisions; **Prepare** administrative information; **Establish** perform in-scope setup; **Organize** resulting records/next steps.
- Operations: **Map** recurring responsibilities; **Structure** workflow; **Document** procedures/ownership; **Maintain** usable cadence.
- Business Tax: **Assemble** records; **Reconcile** identify inconsistencies/gaps at a high level; **Prepare** accepted return work; **Close** authorization/delivery/readiness.
- Advisory: **Understand** situation; **Evaluate** options/constraints; **Prioritize** actions; **Act** support practical next steps.
- Business Insurance: **Profile** business/exposure context; **Assess** protection needs; **Explore** available categories/options within scope; **Proceed** selected next step.
- Business Notary: **Prepare**, **Verify**, **Execute**, **Record** the authorized act and administrative follow-through.

These are operational summaries, not regulatory representations.

## 11. Tasks and checklists

Task fields: `id`, `clientId`, `engagementId?`, `title`, `description`, `status`, `assignedToUserId?`, `assignedToClient`/assignee type, `priority`, `dueAt?`, `completedAt?`, `visibility`, timestamps. Statuses: Not Started, In Progress, Waiting on Client, Waiting on Alchemize, Completed, Archived. Completed may reopen to In Progress only with permission/reason. Client-facing tasks expose only approved fields; internal tasks never leak through shared endpoints.

Future task dependency support may use a single optional `blockedByTaskId`; complex graphs are not MVP.

A Checklist Definition is reusable/versioned and associated with a Service. A Checklist Assignment is an Engagement-specific snapshot with progress. PDFs are downloadable representations only and are not application state.

## 12. Documents

DocumentRequest asks a client to supply something. Document represents stored file metadata. The prototype combines these concepts and must be split before persistence.

Document metadata includes `id`, `clientId`, `engagementId?`, `documentRequestId?`, taxonomy type, display filename, opaque `storageKey`, MIME type, size, version, classification, status, uploader, timestamps, optional taxYear/reportingPeriod/expirationDate. Provider paths and raw private URLs are not canonical fields.

Taxonomy: Identity, Tax, Income, Expense, Insurance, Formation, Business Records, Financial, Agreement, License, Invoice, Report, Deliverable, Correspondence, Other.

Request lifecycle: Requested → Awaiting Upload → Received (fulfilled) or Cancelled/Archived. Replacement Requested returns to Awaiting Upload. Document lifecycle: Received → Under Review → Accepted or Replacement Requested; Accepted → Shared where applicable; any retained record → Archived. A request status may be derived from accepted current document versions.

Classification: PUBLIC (resource PDF), INTERNAL (procedure), CLIENT CONFIDENTIAL (business records), HIGHLY SENSITIVE (tax/identity records). Classification controls storage, authorization, download audit, retention, and sharing.

## 13. Appointments and communications

Appointment types: Initial Consultation, Tax Consultation, Insurance Consultation, Business Formation Consultation, Business Advisory Session, Notary Appointment, Document Review, Follow-Up. Attributes include Client/Engagement, start/end, timezone, status, delivery method, participants, external calendar ID, and preparation notes.

States: Requested→Scheduled→Confirmed→Completed. Requested/Scheduled/Confirmed may become Cancelled; Scheduled/Confirmed may become Reschedule Requested→Scheduled or Cancelled. Completed and Cancelled are terminal except an authorized corrective operation creates/relinks a new appointment.

A Conversation groups Messages by Client and optional Engagement. Messages include sender, timestamp, body, visibility, and attachment references. InternalNote is separate and must never automatically appear in client APIs. Note edits/deletions require version/audit evidence; ordinary staff should archive rather than erase.

Notification is distinct from Message: it is system-generated, user-addressed, channel-aware, and references a triggering entity. Channels may be Portal, Email, SMS; implementation and preferences remain owner/provider decisions.

## 14. Billing

Quote/Estimate, Invoice, InvoiceLine, Payment, and Refund are separate records. Invoice fields include Client, optional Engagement, number, status, issued/due timestamps, currency, subtotal, optional tax, total, and lines. Tax calculation and pricing policy require owner review.

Invoice statuses: Draft→Open→Partially Paid→Paid; Open/Partially Paid may become Past Due; Draft/Open may become Cancelled; paid value may be Refunded/Partially Refunded while preserving original payment history. Payment stores external provider transaction IDs, amount, currency, status, timestamps, and reconciliation metadata—never card number or CVV. Hosted/tokenized processing keeps cardholder data inside the provider PCI boundary.

## 15. Intake and sensitivity

Public Inquiry is minimal and non-sensitive: name, email, optional phone, audience, service interest, message, preferred contact, consent/source metadata. It must explicitly prohibit SSNs, banking data, tax documents, medical details, and ID documents.

Authenticated Onboarding may collect service-specific information through secure access:

- Tax: tax year, filing situation, income categories, dependent context, prior-filing context, checklist; documents and identifiers are sensitive.
- Insurance: coverage goals, jurisdiction, household/business context, existing coverage; health/identity details are highly sensitive and only collected if necessary and authorized.
- Notary: act/document category, signer count, jurisdiction, timing; identity evidence is highly sensitive.
- Formation: business identity, owners, jurisdiction, entity considerations, registered-agent/EIN status, operations; owner identifiers and filings are sensitive.
- Operations/Advisory: processes, priorities, records, constraints; financial/employee/client records require classification.
- Business Tax: tax year/entity context, income/expense categories, prior filing, checklist; tax records are highly sensitive.

## 16. Activity, audit, events, and automation

ActivityEvent is a readable history item with type, actor, Client, optional Engagement, timestamp, summary, and visibility (`admin`, `client`, `both`). AuditEvent is protected evidence for login/failure, role/permission changes, sensitive views/downloads/deletions, and billing/security changes. Audit events are append-oriented and unavailable to normal editing.

Canonical domain events and payloads are defined in [event-catalog.md](event-catalog.md). Automation follows:

`business action → authorized transaction commits → domain event emitted/outboxed → handlers notify/synchronize → delivery result recorded`

Examples: document requested→client notification; appointment scheduled→confirmation and queued reminder; invoice issued→client notification; lead converted→onboarding task set. Handlers must be idempotent and may not retroactively invalidate the committed transaction.

Needs-attention conditions should be derived queries: Lead New; overdue incomplete Task; Engagement Waiting on Alchemize/Preparing/Review as configured; Document Received/Under Review; unread client Message; Appointment needing confirmation; Invoice Past Due. Dashboard counts are computed from source records, not independently mutable counters.

## 17. API conventions

Conceptual base: `/api/v1`. JSON; ISO-8601 timestamps with timezone; opaque stable IDs; explicit pagination/filtering/sorting; validation and authorization on the server; optimistic concurrency/version where lost updates matter; archive semantics rather than generic DELETE.

Resource groups: `/auth`, `/leads`, `/clients`, `/businesses`, `/services`, `/engagements`, `/tasks`, `/checklists`, `/document-requests`, `/documents`, `/appointments`, `/conversations`, `/messages`, `/quotes`, `/invoices`, `/payments`, `/notifications`, `/activity`, `/admin/users`, `/content`.

Older `/api/services/:id` engagement routes are superseded by `/engagements/:id`; `/services` is catalog data.

Error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be accepted.",
    "fields": { "fieldName": "Reason" },
    "requestId": "opaque-id"
  }
}
```

Use 401 for unauthenticated, 403 for authenticated-but-forbidden, 404 where existence should not be disclosed, 409 for transition/concurrency conflicts, and 422 or 400 consistently for validation.

## 18. Provider boundaries and operations

Adapters: AuthProvider, EmailProvider, StorageProvider, PaymentProvider, CalendarProvider, AccountingProvider, TaxProvider, InsuranceProvider. Vendor payloads are translated at adapter boundaries; core entities do not become vendor schemas. See [integration-boundaries.md](integration-boundaries.md).

Webhooks require signature/authentication verification, idempotency keys, replay protection where available, durable logging, retry safety, and mapping to an IntegrationConnection. Background jobs may deliver appointment/task/invoice reminders, renewal/deadline checks, notifications, and synchronization. Queue technology is undecided.

Development, Staging, and Production must have isolated database, auth, storage, email, payment, and calendar configuration. Production data must not be used in development. Public configuration may be browser-readable; secrets never belong in HTML, browser JS, Git, `public/`, or `dist/`.

## 19. Security, retention, and deletion

Baseline: server-side authorization, secure sessions, least privilege, input validation, rate limiting, upload validation/malware strategy, encrypted transport, encryption/storage controls appropriate to classification, secrets management, audit logging, backups, recovery testing, dependency management, and incident procedures. No compliance certification is claimed.

If cookie sessions are selected, cookies must be Secure, HttpOnly, appropriately SameSite, short-lived/rotated, revocable, and invalidated on logout/security events. MFA must be architecturally supported. Admin MFA is a serious production requirement; final policy is an owner decision.

Retention categories: Leads, Active Client Records, Archived Clients, Tax Records, Insurance Records, Documents by classification, Messages, Billing, Audit Logs. Exact periods require owner/legal review. Operational entities should normally be archived. Hard deletion requires a separate authorized privacy/legal workflow, provider propagation, and audit evidence.

## 20. Search, reporting, and analytics

Backend filtering/search must cover Clients, Leads, Engagements, Tasks, Documents, Appointments, and Messages using scoped fields and indexes before considering full-text search. Reporting inputs may include lead conversion, active Clients, Engagement volume/status, revenue by Service, outstanding invoices, and workload. Domain events should feed analytics where possible (`lead.created`, `lead.converted`, `engagement.created/completed`, `invoice.issued`, `invoice.paid`); avoid duplicate event taxonomies.

## 21. First backend scope and order

First MVP: public Contact intake, Lead, User identity, Role/Permission foundation, Client, Business, Contact, Service catalog, ServiceEngagement, Task, ActivityEvent, minimum AuditEvent. Excluded unless reprioritized: payments, secure document files, full messaging, full appointments, notifications beyond intake confirmation.

Dependency order:

1. Contact/lead intake
2. Authentication/identity
3. Client/Business/Contact records
4. Service catalog and Engagements
5. Tasks/Activity/Audit
6. Secure documents
7. Appointments/conversations
8. Billing/payments
9. Notifications/automation/integration maturity

Security design runs throughout, not as a final phase.

## 22. Owner decisions required

- Service scope: insurance lines/jurisdictions/carriers; tax return/entity types; formation/EIN activities; notary acts/jurisdictions; advisory deliverables and exclusions.
- Accounts: invitation-only vs self-registration; multi-user business access and grant approval; MFA policy; exact staff roles/permissions.
- Operations: consultation/cancellation/reschedule policy; pricing/payment/tax policy; secure-document workflow; internal-note correction; archive/deletion and retention periods.
- Integrations: auth, database, storage, email, calendar, payments, accounting/tax/insurance providers.
- Legal/privacy: consent language, privacy/terms updates, retention and deletion obligations, communications preferences, business contact/mailing requirements.

## 23. Companion documents

- [Data Dictionary](data-dictionary.md)
- [State Machines](state-machines.md)
- [Permissions Matrix](permissions-matrix.md)
- [Event Catalog](event-catalog.md)
- [Integration Boundaries](integration-boundaries.md)

## 24. Known repository contradictions and resolution

1. Marketing catalog keys and mock Engagement keys differ. Canonical keys are the JSON slugs listed in §5; aliases require migration.
2. Mock `documents` represent requests/statuses and sometimes files. Persistence splits DocumentRequest from Document.
3. Older API notes use Service for client work. Service is catalog; Engagement is instance.
4. Prototype Client status includes `Onboarding`; canonical Client lifecycle uses Prospective/Active/Inactive/Archived, while onboarding belongs to Engagement/status/tasks.
5. Prototype Message status (`Unread`, `Read`, `Needs Response`) mixes per-user read state and operational attention. Conversation/Message plus Notification/read receipts should separate these concerns.
6. Prototype Activity types use snake_case and display labels inconsistently. New domain events use dotted lowercase names; Activity summaries remain human-readable.
