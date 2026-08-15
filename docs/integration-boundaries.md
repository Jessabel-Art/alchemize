# Alchemize Integration Boundaries

Core application logic depends on internal adapter contracts, not vendor SDK types. Each environment uses isolated credentials/connections. Provider callbacks are untrusted until verified and processed idempotently.

## Auth

- **Alchemize owns:** User, Role, Permission, AccessGrant, onboarding policy, authorization, session response, audit.
- **Provider owns:** credential verification, identity proofing capabilities, recovery/MFA infrastructure as selected.
- **Data exchanged:** opaque provider subject, verified contact claims, authentication factors/status—not business authorization grants.
- **Security:** secure callbacks, state/nonce, session rotation/revocation, admin MFA support, no auth secrets in browser bundles.
- **Adapter:** `createInvitation`, `authenticate`, `refresh/revokeSession`, `requestReset`, `getIdentity`, `enroll/verifyFactor`.

## Email

- **Alchemize owns:** template/version, trigger, recipient logic, consent/preferences, message record.
- **Provider owns:** delivery, bounce/complaint/reporting infrastructure.
- **Data exchanged:** recipient, rendered content, template metadata, correlation ID; minimize sensitive content.
- **Security:** signed webhooks, suppression handling, no highly sensitive attachments, delivery audit.
- **Adapter:** `sendTransactional`, `getDeliveryStatus`, `handleDeliveryEvent`.

## Storage

- **Alchemize owns:** Document metadata, classification, authorization, lifecycle, versioning, request workflow, audit.
- **Provider owns:** private encrypted objects, durability, retrieval primitives, lifecycle mechanisms.
- **Data exchanged:** opaque storage key, bytes/stream, MIME/size/checksum; never permanent public URLs.
- **Security:** short-lived authorized access, upload validation, encryption, malware strategy, tenant/path isolation, deletion/retention propagation.
- **Adapter:** `createUpload`, `finalizeUpload`, `openAuthorizedDownload`, `copyVersion`, `archive/deleteObject`.

## Payments

- **Alchemize owns:** Quote/Invoice/lines, pricing policy, payment state projection, receipt presentation, authorization.
- **Provider owns:** card/ACH collection, tokenization, transaction processing, settlement/refund rails.
- **Data exchanged:** invoice reference, amount/currency, provider customer/transaction refs, status; never raw card number/CVV.
- **Security:** hosted/tokenized flow, signed idempotent webhooks, amount/currency verification, reconciliation, restricted refunds.
- **Adapter:** `createCheckout`, `getPayment`, `refundPayment`, `handlePaymentEvent`.

## Calendar

- **Alchemize owns:** Appointment type, Client/Engagement relationship, participants, preparation, status, cancellation rules.
- **Provider owns:** calendar synchronization, optional availability, meeting-link generation.
- **Data exchanged:** time/timezone, approved participant contact, title/limited notes, external event ref.
- **Security:** least calendar scope, avoid sensitive notes, verified callbacks, conflict handling.
- **Adapter:** `findAvailability`, `create/update/cancelEvent`, `handleCalendarEvent`.

## Accounting

- **Alchemize owns:** operational invoice/engagement mapping and authorization.
- **Provider owns:** accounting ledger/reporting/tax treatment within selected product.
- **Data exchanged:** approved customers, invoice/payment/refund summaries, account mappings.
- **Security:** least OAuth scopes, reconciliation/idempotency, financial audit, owner-approved source-of-truth rules.
- **Adapter:** `syncCustomer`, `syncInvoice`, `syncPayment`, `getSyncStatus`.

## Tax software

- **Alchemize owns:** Client/Engagement workflow, consent, document authorization, task/status presentation.
- **Provider owns:** specialized tax preparation/e-file functionality and provider-specific compliance.
- **Data exchanged:** only owner-approved engagement/document metadata and secure transfers; scope TBD.
- **Security:** explicit consent, highly sensitive classification, strict access/audit, jurisdiction/provider review, no public-browser transfer.
- **Adapter:** future `createTaxMatter`, `transferAuthorizedDocument`, `getMatterStatus`; not MVP.

## Insurance platforms

- **Alchemize owns:** Client relationship, goals/context, consent, Engagement workflow, authorized presentation.
- **Provider owns:** carrier/product availability, quotes/applications/underwriting/policy systems as applicable.
- **Data exchanged:** only licensed, jurisdiction-appropriate, consented information; exact fields TBD.
- **Security:** licensing/scope validation, sensitive/health-data review, strict logging minimization, provider agreement review.
- **Adapter:** future `createProspectContext`, `requestOptions`, `getApplicationStatus`; not MVP.

## Webhook and synchronization contract

All adapters must support correlation IDs, idempotency, normalized errors, timeouts/retries, environment isolation, observability without sensitive payload logging, and reconciliation. Webhook processing verifies signature and timestamp, stores receipt/result safely, detects duplicates, translates to a command/domain event, and acknowledges according to provider requirements. Provider state never directly bypasses Alchemize authorization or transition rules.
