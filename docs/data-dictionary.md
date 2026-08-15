# Alchemize Conceptual Data Dictionary

This dictionary is technology-neutral. `ID` means opaque stable identifier; `timestamp` means ISO-8601 instant. “Sensitive” is conceptual and must be refined in threat/privacy review. Common fields (`id`, `createdAt`, `updatedAt`, optional `archivedAt`, optional `version`) apply to mutable operational entities.

Legend: Required `Y/N/C` (conditional); Sensitive `N/C/Y`; Client-visible `Y/N/C`.

## Identity and relationships

| Entity.field                       | Type concept      | Req. | Sensitive | Client visible | Notes                                                                    |
| ---------------------------------- | ----------------- | ---: | --------: | -------------: | ------------------------------------------------------------------------ |
| User.email                         | email             |    Y |         Y |           Self | Login/notification address; normalize, do not use as authorization grant |
| User.displayName                   | text              |    Y |         C |     Self/admin |                                                                          |
| User.status                        | enum              |    Y |         N |     Self/admin | Invited, Active, Suspended, Archived                                     |
| User.lastLoginAt                   | timestamp         |    N |         Y |     Self/admin | Audit-adjacent                                                           |
| Role.key                           | stable key        |    Y |         N |              N | Owner, admin, staff, client, business authorized user                    |
| Permission.key                     | dotted key        |    Y |         N |              N | E.g. `clients.read`                                                      |
| UserRole.userId/roleId             | ID refs           |    Y |         Y |              N | Scoped role assignment may include Business/Client scope                 |
| AccessGrant.userId                 | ID                |    Y |         Y |              N | Explicit record relationship                                             |
| AccessGrant.clientId/businessId    | ID refs           |    C |         Y |              N | At least one scope target                                                |
| AccessGrant.status                 | enum              |    Y |         Y |              N | Pending, Active, Revoked                                                 |
| Client.clientType                  | enum              |    Y |         N |              Y | Individual or Business relationship                                      |
| Client.displayName                 | text              |    Y |         C |              Y |                                                                          |
| Client.status                      | enum              |    Y |         N |              Y | Prospective, Active, Inactive, Archived                                  |
| Client.primaryContactId            | ID                |    C |         Y |              Y |                                                                          |
| Business.clientId                  | ID                |    Y |         Y |              Y | Owning relationship                                                      |
| Business.legalName/DBA             | text              |  Y/N |         Y |              Y | DBA optional                                                             |
| Business.entityType/formationState | enum/text         |    N |         Y |              Y | Owner-reviewed vocabulary                                                |
| Business.einStatusReference        | text/enum         |    N |         Y |              C | Status/reference only; no raw EIN in frontend                            |
| Contact.name                       | text              |    Y |         Y |              Y |                                                                          |
| Contact.email/phone                | contact values    |    C |         Y |              Y | At least one approved method                                             |
| Contact.preferences                | structured values |    N |         Y |              Y | Channel/consent metadata                                                 |

## Lead and service work

| Entity.field                            | Type concept | Req. | Sensitive | Client visible | Notes                                    |
| --------------------------------------- | ------------ | ---: | --------: | -------------: | ---------------------------------------- |
| Lead.contactId                          | ID           |    Y |         Y |              N | Public inquiry contact                   |
| Lead.audience                           | enum         |    Y |         N |              N | Individual/Business                      |
| Lead.serviceInterest                    | service key  |    N |         C |              N | Canonical key when known                 |
| Lead.message/source                     | text/key     |  N/Y |         C |              N | Public inquiry must remain non-sensitive |
| Lead.status                             | enum         |    Y |         N |              N | State machine controlled                 |
| Lead.ownerUserId/nextAction             | ID/text      |    N |         C |              N | Operational                              |
| Service.key                             | stable key   |    Y |         N |              Y | Canonical catalog identifier             |
| Service.name/audience/category/route    | text/enums   |    Y |         N |              Y |                                          |
| Service.scopeReviewStatus               | enum/text    |    Y |         N |              C | Approved, Owner Review, Retired          |
| Service.workflowVersionId               | ID           |    Y |         N |              C |                                          |
| WorkflowStage.key/order/label           | text/integer |    Y |         N |              C | Versioned definition                     |
| ServiceEngagement.clientId/serviceKey   | ID/key       |    Y |         Y |              Y | Instance of catalog Service              |
| ServiceEngagement.businessId            | ID           |    N |         Y |              Y | Business engagements                     |
| ServiceEngagement.status/stageKey       | enums        |    Y |         C |              Y | Independent dimensions                   |
| ServiceEngagement.startedAt/completedAt | timestamps   |    N |         C |              Y |                                          |
| ServiceEngagement.nextAction/summary    | text         |    N |         C |              C | Client-safe version required             |

## Tasks and checklists

| Entity.field                                       | Type concept        | Req. | Sensitive | Client visible | Notes                        |
| -------------------------------------------------- | ------------------- | ---: | --------: | -------------: | ---------------------------- |
| Task.clientId/engagementId                         | ID refs             |  Y/N |         Y |              C | Engagement optional          |
| Task.title/description                             | text                |  Y/N |         C |              C | Governed by visibility       |
| Task.status/priority                               | enum                |    Y |         N |              C |                              |
| Task.assignedToUserId/assigneeType                 | ID/enum             |    C |         Y |              C | Staff vs client assignment   |
| Task.dueAt/completedAt                             | timestamp           |    N |         C |              C |                              |
| Task.visibility                                    | enum                |    Y |         N |              N | Admin, Client, Both          |
| Task.blockedByTaskId                               | ID                  |    N |         N |              C | Single predecessor, post-MVP |
| Checklist.key/version/serviceKey                   | keys                |    Y |         N |              C | Reusable definition          |
| Checklist.items                                    | ordered definitions |    Y |         N |              C | Stable item keys             |
| ChecklistAssignment.engagementId/definitionVersion | refs                |    Y |         Y |              Y | Snapshot/version lock        |
| ChecklistAssignment.itemProgress/status            | structured state    |    Y |         C |              Y | App state, not PDF state     |

## Documents and communications

| Entity.field                                    | Type concept    |  Req. | Sensitive | Client visible | Notes                                      |
| ----------------------------------------------- | --------------- | ----: | --------: | -------------: | ------------------------------------------ |
| DocumentRequest.clientId/engagementId           | IDs             |   Y/N |         Y |              Y |                                            |
| DocumentRequest.documentType/title              | enum/text       |     Y |         C |              Y |                                            |
| DocumentRequest.status/dueAt                    | enum/timestamp  |   Y/N |         C |              Y |                                            |
| Document.id/clientId/engagementId               | IDs             | Y/Y/N |         Y |              C | Metadata record                            |
| Document.documentRequestId                      | ID              |     N |         Y |              C |                                            |
| Document.filename/storageKey                    | text/opaque key |     Y |         Y |  Filename only | No public storage URL                      |
| Document.mimeType/size/version                  | text/number     |     Y |         C |              C |                                            |
| Document.type/classification/status             | enums           |     Y |         Y |              C | Controls authorization                     |
| Document.taxYear/reportingPeriod/expirationDate | values          |     N |         Y |              C | Optional taxonomy metadata                 |
| Conversation.clientId/engagementId              | IDs             |   Y/N |         Y |              Y |                                            |
| Conversation.subject/status                     | text/enum       |     Y |         C |              Y |                                            |
| Message.conversationId/senderUserId             | IDs             |     Y |         Y |              Y |                                            |
| Message.body/sentAt/visibility                  | text/time/enum  |     Y |         Y |              C | Immutable body; corrections as new message |
| Message.attachmentDocumentIds                   | IDs             |     N |         Y |              C | Separate authorization for each attachment |
| InternalNote.targetType/targetId                | enum/ID         |     Y |         Y |              N | Lead, Client, Engagement                   |
| InternalNote.authorUserId/content               | ID/text         |     Y |         Y |              N | Never automatically client-visible         |

## Scheduling, billing, events, integrations

| Entity.field                                     | Type concept         |  Req. | Sensitive | Client visible | Notes                                                |
| ------------------------------------------------ | -------------------- | ----: | --------: | -------------: | ---------------------------------------------------- |
| Appointment.clientId/engagementId/type           | refs/enum            | Y/N/Y |         Y |              Y |                                                      |
| Appointment.startAt/endAt/timezone               | timestamps/IANA zone |     C |         C |              Y | Required when scheduled                              |
| Appointment.status/deliveryMethod                | enums                |     Y |         C |              Y |                                                      |
| Appointment.externalCalendarId                   | opaque ref           |     N |         Y |              N |                                                      |
| Quote.clientId/status/validUntil                 | ID/enum/date         |     Y |         Y |              Y |                                                      |
| Invoice.clientId/engagementId/number             | refs/text            | Y/N/Y |         Y |              Y |                                                      |
| Invoice.status/currency/subtotal/tax/total       | enums/money          |     Y |         Y |              Y | Minor units recommended later                        |
| InvoiceLine.description/quantity/unitAmount      | values               |     Y |         Y |              Y |                                                      |
| Payment.invoiceId/providerTransactionId          | ID/opaque ref        |     Y |         Y |              C | No card/ACH credentials                              |
| Payment.amount/currency/status                   | money/enums          |     Y |         Y |              Y |                                                      |
| Refund.paymentId/amount/status                   | refs/money/enum      |     Y |         Y |              Y |                                                      |
| Notification.userId/type/channel/status          | ID/enums             |     Y |         Y |           Self |                                                      |
| Notification.relatedEntity/readAt                | polymorphic ref/time |     N |         C |           Self |                                                      |
| ActivityEvent.type/actorId/summary               | key/ID/text          |     Y |         C |              C | Visibility field controls exposure                   |
| ActivityEvent.clientId/engagementId/visibility   | refs/enum            |     C |         Y |              C |                                                      |
| AuditEvent.action/actorId/target/context/outcome | structured           |     Y |         Y |              N | Append-oriented, protected                           |
| IntegrationConnection.provider/type/status       | keys/enums           |     Y |         Y |              N | Secrets stored outside record or encrypted vault ref |
| IntegrationConnection.externalAccountRef         | opaque ref           |     N |         Y |              N |                                                      |

## Data rules

- Derived dashboard counts are not stored as mutable facts.
- Money, timestamps, IDs, and enums require consistent API representations before schema design.
- Sensitive intake and file content are never placed in browser bundles, analytics payloads, logs, or public configuration.
- Archive is the normal operational removal; hard deletion follows a separate policy workflow.
