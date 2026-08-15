# Alchemize State Machines

State changes require server-side authorization, validation, an ActivityEvent when operationally meaningful, and an AuditEvent when security/financially significant. Invalid transitions return a conflict error; clients may not set arbitrary status strings.

## Lead

```mermaid
stateDiagram-v2
  [*] --> New
  New --> Contacted
  New --> ConsultationRequested
  Contacted --> ConsultationRequested
  ConsultationRequested --> ConsultationScheduled
  ConsultationScheduled --> Qualified
  Qualified --> Converted
  New --> Closed
  Contacted --> Closed
  ConsultationRequested --> Closed
  ConsultationScheduled --> Closed
  Qualified --> Closed
  Closed --> Contacted: authorized reopen
  Converted --> [*]
```

Converted is terminal. Conversion atomically creates relationship records and emits `lead.converted`. Closed can reopen only with a reason and permission.

## Service Engagement

```mermaid
stateDiagram-v2
  [*] --> Preparing
  Preparing --> WaitingOnClient
  Preparing --> WaitingOnAlchemize
  Preparing --> Scheduled
  Preparing --> InProgress
  WaitingOnClient --> InProgress
  WaitingOnAlchemize --> InProgress
  Scheduled --> InProgress
  InProgress --> WaitingOnClient
  InProgress --> WaitingOnAlchemize
  InProgress --> Review
  Review --> InProgress
  Review --> ReadyForClient
  ReadyForClient --> InProgress
  ReadyForClient --> Completed
  Completed --> Archived
  Archived --> [*]
```

Stage changes are a parallel dimension and emit `engagement.stage_changed`. Entering Waiting on Client or Ready for Client may notify. Reopening Completed requires elevated permission and reason.

## Task

```mermaid
stateDiagram-v2
  [*] --> NotStarted
  NotStarted --> InProgress
  NotStarted --> WaitingOnClient
  NotStarted --> WaitingOnAlchemize
  InProgress --> WaitingOnClient
  InProgress --> WaitingOnAlchemize
  WaitingOnClient --> InProgress
  WaitingOnAlchemize --> InProgress
  InProgress --> Completed
  Completed --> InProgress: authorized reopen
  NotStarted --> Archived
  Completed --> Archived
  Archived --> [*]
```

Assignment may notify. Completion emits `task.completed`. Overdue is derived from dueAt plus nonterminal status.

## Document Request and Document

```mermaid
stateDiagram-v2
  [*] --> Requested
  Requested --> AwaitingUpload
  AwaitingUpload --> Received
  Received --> UnderReview
  UnderReview --> Accepted
  UnderReview --> ReplacementRequested
  ReplacementRequested --> AwaitingUpload
  Accepted --> Shared
  Requested --> Archived
  Accepted --> Archived
  Shared --> Archived
  Archived --> [*]
```

Requested/Awaiting Upload primarily belong to DocumentRequest; Received onward primarily belong to Document. The combined diagram shows the user journey, not a single-table design. Upload emits `document.received`; acceptance emits `document.accepted`; sensitive downloads create AuditEvents.

## Appointment

```mermaid
stateDiagram-v2
  [*] --> Requested
  Requested --> Scheduled
  Scheduled --> Confirmed
  Confirmed --> Completed
  Requested --> Cancelled
  Scheduled --> Cancelled
  Confirmed --> Cancelled
  Scheduled --> RescheduleRequested
  Confirmed --> RescheduleRequested
  RescheduleRequested --> Scheduled
  RescheduleRequested --> Cancelled
  Completed --> [*]
  Cancelled --> [*]
```

Scheduling emits confirmation; reminders are background jobs. A replacement appointment is a new record linked to the old appointment.

## Invoice

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Open: issue
  Draft --> Cancelled
  Open --> PartiallyPaid
  Open --> Paid
  Open --> PastDue
  Open --> Cancelled
  PartiallyPaid --> Paid
  PartiallyPaid --> PastDue
  PastDue --> PartiallyPaid
  PastDue --> Paid
  Paid --> PartiallyRefunded
  Paid --> Refunded
  PartiallyRefunded --> Refunded
  Cancelled --> [*]
  Refunded --> [*]
```

Issue and payment transitions are audit-required. Past Due should usually be derived by due date then recorded/served as status according to the final billing design. Provider webhooks must be idempotent.
