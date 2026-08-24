# Client Portal Phase 2

Phase 2 adds secured client mutations to the Phase 1 session-derived client boundary. A request never accepts `client_id` as authorization; the active client access grant determines the scope.

## Write-back map

| Client action | Canonical persisted destination | Admin destination |
| --- | --- | --- |
| Complete/respond to task | `tasks` + `task_client_actions` | Tasks and Client Portal activity queue |
| Upload requested document | `documents_metadata` + `document_submissions` + private file storage | Documents and Client Portal activity queue |
| Send message | `message_threads` + `messages` | Client Portal activity queue with staff reply |
| Confirm appointment | `appointments` | Appointments and client activity |
| Request reschedule/cancellation | `appointment_change_requests` | Client Portal activity queue; approval updates `appointments` |
| Edit contact preferences | `clients` | Client profile and audit/activity history |
| Propose sensitive profile change | `profile_change_requests` | Client Portal activity queue; approval updates `clients` or `business_profiles` |
| Acknowledge service/invoice | `record_acknowledgements` | Activity history |

Internal `notes`, task `internal_notes`, document `internal_notes`, invoice `internal_notes`, and audit request metadata never enter portal responses.

## Private document storage

Uploads are stored below `ALCHEMIZE_DOCUMENT_STORAGE_ROOT`, which must resolve outside the public web root. The default follows the private server deployment at `server/storage/client-documents`. The server verifies the actual MIME type with `finfo`, checks the corresponding extension, enforces a 15 MB limit, generates a random storage name, and stores a SHA-256 digest. Admin downloads are streamed through an authenticated endpoint; storage keys are never sent to clients.

## Deferred providers

Card/ACH processing, email/SMS delivery, calendar synchronization, e-signatures, and third-party cloud storage remain intentionally unimplemented. Invoice printing and billing support contact are available without simulating a payment provider.
