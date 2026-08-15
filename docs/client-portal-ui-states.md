# Client Portal UI States

This document captures the intended client-facing interface states for the portal prototype. The current implementation remains a frontend-only prototype with mock data and no real authentication or storage.

## Core states

### Loading

- Use a lightweight skeleton for dashboards, service cards, and list views while the UI waits on a real adapter.
- Keep skeleton blocks minimal and consistent with the portal design system.
- Do not simulate a long artificial delay.

### Empty

- No active services: show a clear message that the client does not currently have an active engagement.
- No tasks: show a "You’re all caught up" experience.
- No documents: show a document request queue or an empty state that explains what will appear next.
- No appointments: show a future-focused planner state.
- No messages: explain that secure communications appear here once the workflow is active.
- No billing activity: show open invoices or payment history if applicable; otherwise explain that none is available.

### Error

- Show a simple application-level error panel with a `Retry` action pattern.
- Keep the copy specific to the failed request: services, documents, billing, or messages.

### Unauthorized

- Show an access-denied state with a clear message that the account is not authorized for the requested area.
- Provide a future sign-in path but avoid pretending session logic is active.

### Session expired

- Show a future state encouraging the client to sign in again.
- Keep the copy fully conceptual and non-functional.

### Active engagement

- Show the current service stage, next-action card, related tasks, and active checklist progress.
- Surface documents and appointment deadlines without implying storage or scheduling is connected.

### Completed engagement

- Keep the service visible for reference and historical context.
- Collapse detail actions and clearly label the engagement as completed or archived.

### Waiting on client

- Flag the engagement as awaiting the client’s response, materials, or review.
- Make the required action explicit and easy to find.

### Waiting on Alchemize

- Show progress in a way that reassures the client that internal follow-up is underway.
- Use copy like "We’re reviewing" rather than vague or empty progress.

## Future contract states

The prototype should be able to represent the following application-level states without adding backend logic:

- onboarding
- active service
- preparatory workflow
- waiting on client
- waiting on Alchemize
- review and approval
- completed
- archived

## Design guidance

- Every state should be understandable without color alone.
- Labels, text, and status chips should agree with the controlled status vocabulary.
- Use the same empty-state and error-state design patterns everywhere.

## Owner decisions to revisit

- whether clients can self-register
- whether a future client can access multiple business records
- whether completed engagements remain visible to clients
- whether clients can delete uploaded files after secure storage is enabled
- whether clients can manage notifications themselves
- whether portal billing can support in-portal payment collection
