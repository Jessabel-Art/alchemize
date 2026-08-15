# Admin Workflows (Prototype)

> Architecture note: this document describes prototype behavior. Canonical production states, transitions, events, and atomic operations are defined in [system-specification.md](system-specification.md) and [state-machines.md](state-machines.md).

This document describes the operational prototype flows available in the admin portal before any backend services are connected. Every workflow is intentionally in-memory only and resets on refresh.

## Scope

The prototype supports the administrative lifecycle for a new inquiry from initial lead review through engagement completion. It is designed to mirror the eventual product structure without creating a real persistence layer or external service dependency.

## Core prototype lifecycle

Lead
→ Client conversion
→ Engagement creation
→ Task assignment
→ Document request
→ Appointment scheduling
→ Review and follow-up
→ Completion

## Prototype actions

### Lead management

- Change lead status through the prototype admin controls.
- Add an internal note to a lead.
- Update the next action and owner placeholder.
- Schedule a consultation placeholder when the lead advances.
- Convert a lead to a client and optionally create a service engagement.
- Close a lead without permanent deletion.

### Client records

- Create an in-memory client during lead conversion.
- Add an internal note to a client record.
- Start a new service engagement from an active client.
- Request document follow-up or add a task.
- Schedule a consultation or internal meeting.
- Archive the client in the prototype flow without removing the record permanently.

### Engagement orchestration

- Start service engagement with a client and service name.
- Update status using the allowed prototype states.
- Adjust the next action field and summary state.
- Add internal notes, tasks, and appointments at the engagement level.
- Complete or archive a service when the workflow is complete.

### Task workflow

- Create a task with title, client, engagement, owner, due date, priority, and status.
- Assign tasks to prototype staff placeholders.
- Complete tasks to remove them from active attention queues.
- Update status transitions without persisting outside the current session.

### Document workflow

- Request a document from a client.
- Record statuses such as Requested, Awaiting Upload, Received, Under Review, Accepted, and Replacement Requested.
- Keep the admin-only reviewer and internal note metadata separate from client-visible details.
- Require no file upload or secure document storage for the prototype.

### Appointment workflow

- Create a consultation or review appointment.
- Track requested, scheduled, confirmed, completed, cancelled, and reschedule-requested states.
- Prevent cancelled or completed items from appearing in upcoming attention queues.

### Activity and visibility

- Add activity entries for all meaningful in-memory mutations.
- Distinguish admin-only events from client-visible later events.
- Keep internal notes and lead qualification activity hidden from the client portal contract by default.

## Needs Attention rules

The prototype keeps the attention logic in reusable selectors and in-memory evaluation rather than scattered UI logic. The following triggers are used:

- lead in New, Contacted, or Consultation Requested
- overdue task not marked as complete
- engagement status in Waiting on Client, Waiting on Alchemize, Preparing, or Review
- document in Received, Under Review, Requested, or Awaiting Upload
- upcoming appointment in Requested, Scheduled, or Confirmed
- unread or needs-response message
- invoice in Past Due

## Mutation boundaries

All prototype updates are intentionally non-persistent.

- No database writes
- No browser persistence via localStorage
- No network API calls
- No external integrations
- No permanent deletion

The page resets to the fixture snapshot on refresh. This is the expected prototype behavior.

## Future backend replacement

The structure is designed to map cleanly into a later server-backed API contract. Conceptual endpoints should eventually include:

- POST /clients
- POST /engagements
- POST /tasks
- POST /document-requests
- POST /appointments
- PATCH /engagements/:id
- PATCH /tasks/:id
- PATCH /leads/:id

The conversion from lead to client is the clearest example of an operation that should later become atomic. The backend would likely need to update the lead, create the client record, create activity entries, and optionally create the engagement in a single transaction.

## Validation and safety

- prototype forms validate required fields on the client side
- no real auth or credential creation occurs
- no real tax, health, or payment data is used
- no real uploads or network processing are involved

This is an admin prototype for product exploration and workflow design, not a production system.
