# Alchemize Production Acceptance Checklist

Use this checklist against the deployed Hostinger site after migrations and protected-runtime dependencies are installed. Use dedicated acceptance-test records and never write credentials, tokens, provider secrets, or sensitive client data into this document.

For every item, record the observed result and mark exactly one of PASS or FAIL.

## A. Infrastructure

[ ] Run the protected CLI production-auth diagnostic.
Expected result: Database, PDO, Composer autoload, session write, and auth repository report configured/success.
Actual result:
PASS / FAIL

[ ] Run `php scripts/verify-production-schema.php` from the protected runtime after migration 022.
Expected result: Every lifecycle table/column and `SCHEMA_VALIDATION` report PRESENT.
Actual result:
PASS / FAIL

[ ] Confirm HTTPS and production cookie attributes in browser developer tools.
Expected result: `alchemize_sid` is Secure, HttpOnly, SameSite=Lax, path `/`, and contains no readable account data.
Actual result:
PASS / FAIL

## B. Public Website

[ ] Open the homepage, services, resources, FAQ, privacy, and terms by direct URL and refresh each.
Expected result: Every route renders the intended page without a blank screen or redirect loop.
Actual result:
PASS / FAIL

[ ] Navigate the public site at desktop and 390px width.
Expected result: Navigation, content, and calls to action remain reachable with no page-level horizontal overflow.
Actual result:
PASS / FAIL

## C. Contact / Lead

[ ] Submit one valid contact request.
Expected result: A success message appears only after persistence; one new record appears in Admin Leads and one notification attempt is recorded.
Actual result:
PASS / FAIL

[ ] Submit invalid email, audience, service, oversized content, and the honeypot.
Expected result: Invalid requests do not create leads; field-safe errors appear; honeypot does not disclose spam detection.
Actual result:
PASS / FAIL

[ ] Repeat the identical request and then exceed the hourly request limit.
Expected result: Replay does not create a duplicate lead; excessive requests receive a safe rate-limit response.
Actual result:
PASS / FAIL

[ ] Repeat a valid submission while SES is unavailable.
Expected result: The lead remains saved and the visitor receives success; notification delivery records unavailable/failed.
Actual result:
PASS / FAIL

## D. Admin Authentication

[ ] Log in with the real active Admin account, refresh, then log out.
Expected result: Login routes to Admin, refresh retains the session, logout destroys access, and protected direct URLs return to login.
Actual result:
PASS / FAIL

[ ] Disable the test Admin account in a controlled database/admin procedure while its session is active.
Expected result: The next authenticated request invalidates the session; restore the account after the test.
Actual result:
PASS / FAIL

## E. Lead Conversion

[ ] Review and update a new lead, refresh, then convert it once.
Expected result: Status changes persist; conversion creates one client linked to the lead and survives refresh.
Actual result:
PASS / FAIL

[ ] Retry the same conversion request.
Expected result: The request is rejected as already converted and creates no second client.
Actual result:
PASS / FAIL

## F. Client Provisioning

[ ] Create a client with portal access while SES is configured.
Expected result: Client, portal user, one default access grant, and one active invitation token persist; delivery status accurately reports sent/failed.
Actual result:
PASS / FAIL

[ ] Create a client while SES is unavailable.
Expected result: Client/user/grant/token still persist and Admin receives a one-time Copy Setup Link fallback with a delivery warning.
Actual result:
PASS / FAIL

[ ] Resend the invitation and retry portal provisioning.
Expected result: User/grant are reused; the former invitation is invalidated and only the newest token is usable.
Actual result:
PASS / FAIL

## G. Client Activation

[ ] Open the latest invitation link and set a compliant password.
Expected result: Account and access become active; the token becomes single-use and the Admin never sees the password.
Actual result:
PASS / FAIL

[ ] Reuse the invitation and test an expired token fixture.
Expected result: Both are rejected with the safe invalid/expired message.
Actual result:
PASS / FAIL

[ ] Complete forgot-password and Admin manual reset-link fallback.
Expected result: Requests are enumeration-safe; only the latest unexpired reset token works once.
Actual result:
PASS / FAIL

## H. Client Portal

[ ] Log in as Client A and refresh every portal section.
Expected result: Dashboard, Services, Intake, Tasks, Documents, Appointments, Messages, Billing, and Profile load persisted Client A data.
Actual result:
PASS / FAIL

[ ] Revoke Client A's grant and disable portal access while logged in.
Expected result: The next request invalidates access; re-enable restores login without changing the password.
Actual result:
PASS / FAIL

[ ] Test an approved authorized user and a user with multiple client grants.
Expected result: Approved scoped access works; revoked access fails. Record whether the currently default/oldest client selection is operationally acceptable.
Actual result:
PASS / FAIL

## I. Intake

[ ] Assign intake to Client A through a Client A engagement.
Expected result: Assignment persists and appears only in Client A's portal with the correct engagement.
Actual result:
PASS / FAIL

[ ] Save a partial intake, log out/in, resume, then submit.
Expected result: Draft values persist; submission locks as designed and appears in Admin review.
Actual result:
PASS / FAIL

[ ] Request changes and resubmit.
Expected result: Client guidance is visible, internal review notes are not, and history/status remain accurate.
Actual result:
PASS / FAIL

## J. Documents

[ ] Create a client-visible document request and upload a valid file as Client A.
Expected result: Local private file, metadata, version record, activity, notification, and Drive sync state persist.
Actual result:
PASS / FAIL

[ ] Attempt invalid MIME/extension, oversized file, and a Client B document identifier as Client A.
Expected result: Every request is rejected without a public or orphaned file.
Actual result:
PASS / FAIL

[ ] Request replacement and upload a second version.
Expected result: Version 1 remains retained; version 2 becomes current; authenticated download returns the authorized version.
Actual result:
PASS / FAIL

[ ] Repeat upload with Drive unavailable and then retry synchronization.
Expected result: Local document remains usable, Drive status is failed/not configured, and retry does not create duplicate provider files.
Actual result:
PASS / FAIL

## K. Appointments

[ ] Request an appointment as Client A and approve/confirm it as Admin.
Expected result: Database appointment remains authoritative and one Calendar event ID is persisted.
Actual result:
PASS / FAIL

[ ] Reschedule and cancel through the controlled request/review flow.
Expected result: The existing Calendar event is updated and then cancelled; no duplicate event is created.
Actual result:
PASS / FAIL

[ ] Repeat with Calendar unavailable.
Expected result: Appointment state persists, sync status accurately reports failure/not configured, and retry remains idempotent.
Actual result:
PASS / FAIL

## L. Messaging

[ ] Send a new Client A thread, reply as Admin, and reload both portals.
Expected result: Messages and history persist; each portal sees the correct thread.
Actual result:
PASS / FAIL

[ ] Open the thread independently as Client and Admin.
Expected result: Client/Admin read timestamps and unread counters update independently.
Actual result:
PASS / FAIL

[ ] Repeat while SES is unavailable and try a Client B thread identifier as Client A.
Expected result: Message persists despite email failure; cross-client access returns not found/forbidden.
Actual result:
PASS / FAIL

## M. Billing / Stripe

[ ] Issue an invoice with line items and refresh Admin and Client Billing.
Expected result: Line items, totals, `issued_at`, open balance, and invoice status persist in both portals.
Actual result:
PASS / FAIL

[ ] Record a manual payment and repeat the same request key.
Expected result: One payment persists, invoice balance changes once, and Client Billing reflects it after reload.
Actual result:
PASS / FAIL

[ ] Start the payable invoice action without completing payment.
Expected result: Browser opens Stripe-hosted Checkout; cancellation leaves the invoice unpaid/open.
Actual result:
PASS / FAIL

[ ] Complete a Stripe test-mode payment and verify the signed webhook.
Expected result: One reconciled payment appears, invoice changes to partially paid/paid, and receipt/history appear after reload.
Actual result:
PASS / FAIL

[ ] Replay the webhook and submit an invalid signature.
Expected result: Replay is idempotent; invalid signature is rejected and cannot change invoice state.
Actual result:
PASS / FAIL

## N. Google Drive

[ ] Provision Client A twice and inspect the configured root folder.
Expected result: One folder exists for the stable Client A public ID and the same folder ID is retained.
Actual result:
PASS / FAIL

[ ] Upload and replace a document.
Expected result: Provider IDs persist per version without exposing unrestricted Drive links to the client.
Actual result:
PASS / FAIL

## O. Google Calendar

[ ] Confirm, update, and cancel one acceptance-test appointment.
Expected result: One event ID is reused for all operations and application state remains authoritative.
Actual result:
PASS / FAIL

## P. SES

[ ] Trigger invitation, reset, lead, appointment, document, message, authorized-user, and invoice notices.
Expected result: Each supported event creates a deduplicated notification and records its real delivery result.
Actual result:
PASS / FAIL

[ ] Inspect received test messages.
Expected result: Messages are branded and transactional and contain no passwords, document contents, or provider secrets.
Actual result:
PASS / FAIL

## Q. Security

[ ] As Client A, call Client B profile, engagement, intake, task, document/download, appointment, message, acknowledgement, invoice, and payment identifiers directly.
Expected result: Every read/mutation is rejected at the API regardless of frontend visibility.
Actual result:
PASS / FAIL

[ ] As a Client session, call lead/client/provisioning/review/task/appointment/invoice/payment Admin APIs with valid CSRF.
Expected result: Every Admin operation returns forbidden and writes nothing.
Actual result:
PASS / FAIL

[ ] Review browser responses and protected logs after deliberate failures.
Expected result: Browser exposes no SQL, stack, path, credential, token, or provider secret; logs contain only safe subsystem/category context.
Actual result:
PASS / FAIL

## R. Mobile

[ ] At 390px, complete contact submission, both logins, client creation/detail, intake, document upload, appointment action, message reply, payment entry, and profile update.
Expected result: No page overflow, hidden action, overlapping navigation, inaccessible dialog, or missing status/error announcement.
Actual result:
PASS / FAIL

[ ] Navigate the Admin drawer and Client menu using keyboard and touch emulation.
Expected result: Menus open/close predictably, focus remains usable, and Return to Website does not overlap Menu.
Actual result:
PASS / FAIL

## S. Final Sign-Off

[ ] Confirm all failures above have an owner, severity, and remediation decision.
Expected result: No unexplained P0/P1 failure remains.
Actual result:
PASS / FAIL

[ ] Confirm backup/rollback readiness, migrations 001–022, protected runtime, provider test/live modes, and webhook destinations.
Expected result: Deployment can be rolled back without losing newly created production records.
Actual result:
PASS / FAIL

[ ] Approve the production lifecycle.
Expected result: A real client can progress from contact through completed service and verified payment with persisted history.
Actual result:
PASS / FAIL
