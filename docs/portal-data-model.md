# Portal Data Model

> Architecture note: [system-specification.md](system-specification.md) is the authoritative pre-backend model. This earlier document remains useful prototype context; where terms differ, use `Service` for catalog definitions, `ServiceEngagement` for client-specific work, and separate `DocumentRequest` from `Document`.

This document is a high-level conceptual model for the future portal and admin systems. It does not commit the project to a specific database vendor or deployment stack.

## Core entities

### User

Represents the identity used to sign in and access the system. A user account can later support multiple roles and access contexts.

#### Likely properties

- unique user id
- email address
- status
- role
- created date
- last login
- account status

### Client Record

Represents the relationship between Alchemize and the client. This is distinct from the user account and may be linked to one or more users.

#### Likely properties

- client id
- client type: individual or business
- business name where applicable
- primary contact
- status
- association to service engagements

### Business

Represents the business or organization tied to a service relationship when relevant.

#### Likely properties

- business id
- business name
- industry or sector
- owner/decision maker links
- contact information

### Service Engagement

Captures the specific work or service relationship associated with a client.

#### Likely properties

- engagement id
- client id
- service type
- status
- start date
- target completion date
- assigned checklist
- tasks
- documents
- appointments

### Task

A future work item associated with a service engagement, client request, admin action, or follow-up.

#### Likely properties

- task id
- client or staff owner
- related engagement
- due date
- priority
- status
- notes

### Document

Represents a submitted, requested, shared, or archived file in a secure and controlled system.

#### Likely properties

- document id
- related engagement or client
- category
- upload date
- current status
- visibility level
- file storage reference
- audit trail

### Appointment

Represents meetings, consultations, or service sessions.

#### Likely properties

- appointment id
- client
- service
- attendee type
- date and time
- status
- meeting channel
- preparation notes

### Message

Represents secure communication between client and Alchemize.

#### Likely properties

- message id
- thread id
- sender and recipient user or role
- subject
- body
- attachments
- timestamp
- read state

### Invoice

Represents an issued fee or bill related to services.

#### Likely properties

- invoice id
- client
- engagement
- total amount
- status
- issued date
- due date
- payment status

### Payment

Represents the actual recorded payment against an invoice or service.

#### Likely properties

- payment id
- invoice id
- amount
- method
- timestamp
- status

### Checklist Assignment

Tracks which checklist a client is assigned to within a service engagement.

#### Likely properties

- assignment id
- engagement id
- checklist id or source
- progress count
- status

### Activity Log

Captures changes or significant events for operational auditability.

#### Likely properties

- log id
- actor
- target entity
- action
- timestamp
- notes

## Relationship model

The design should support:

- one user may have one or more roles
- one client may have one or more associated users
- one client may have multiple active service engagements
- each engagement may have multiple tasks, documents, and appointments
- documents and messages should be tied to client or engagement records with authorization rules
- invoices and payments should remain separate from document storage and user credentials

## Prototype data model notes

The current admin prototype uses an in-memory state layer that initializes from fixture data and resets on refresh. This is intentionally not a database-backed model. It represents the same conceptual objects as the future system while keeping the data ephemeral and safe.

### Admin event and activity model

The prototype activity model includes:

- id
- type
- actorType
- actorName
- clientId
- engagementId
- timestamp
- summary
- visibility

Visibility is used to separate admin-only operational events from items that may later be visible to client-facing views.

### Admin-only vs later client-visible events

Admin-only examples:

- internal note added
- staff assignment changed
- lead qualified
- internal priority changed
- lead converted to client

Potentially client-visible later examples:

- document requested
- appointment scheduled
- service stage changed
- task completed
- engagement status changed

## Design guidance

The interface has been shaped to prepare for this future structure without pretending data already exists. The static portal shells intentionally use empty states and development-preview messages rather than fake records. The admin prototype is intentionally non-persistent and exists to validate workflow and product structure before backend integration.
