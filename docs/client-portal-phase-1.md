# Client Portal Phase 1 Mapping

The Client Portal is a read-only projection of the same persisted operational records used by the administrative APIs. It does not maintain a parallel client data store.

| Administrative source                        | Client Portal projection        | Client boundary                                                                                                             |
| -------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `clients` and `business_profiles`            | Profile                         | Active `client_access_grants` relationship; safe profile columns only                                                       |
| `client_contacts`                            | Authorized contacts             | Active contacts intended for portal, primary, billing, document, or scheduling access; internal authorization notes omitted |
| `engagements` and `engagement_service_items` | Services                        | Authenticated client's engagements; scope and pricing notes omitted                                                         |
| `tasks`                                      | Tasks and next action           | Matching client plus `visibility IN ('client','both')`; internal notes omitted                                              |
| `documents_metadata`                         | Documents                       | Matching client plus `visibility IN ('client','shared')`; metadata only, with storage keys and internal notes omitted       |
| `appointments`                               | Appointments                    | Matching client plus `visibility IN ('client','both')`; internal notes omitted                                              |
| Future message/thread tables                 | Messages                        | No fabricated data; Phase 1 reports messaging unavailable                                                                   |
| Issued `invoices` and related `payments`     | Billing                         | Matching client; draft/internal invoices and payment internals omitted                                                      |
| `activity_events`                            | Recent activity                 | Matching client plus `visibility IN ('client','both')`                                                                      |
| `notes` and `audit_events`                   | No Client Portal representation | Admin-only by design                                                                                                        |

## Authorization model

The API derives the user ID from the authenticated server session and resolves an active `client_access_grants` row. A browser-provided client ID is never accepted. Multiple users may hold active grants to the same business client. The Phase 1 workspace uses the grant marked as default, or the earliest active grant when no default is set.

The client-safe routes are read-only:

- `portal/dashboard`
- `portal/services`
- `portal/tasks`
- `portal/documents`
- `portal/appointments`
- `portal/messages`
- `portal/billing`
- `portal/profile`
- `portal/activity`

Existing operational APIs are restricted to internal roles. Client and business-authorized-user accounts must use the intentionally shaped portal endpoints.
