# Alchemize Portal Route and Functionality Audit

Audit date: 2026-08-26; production-validation update: 2026-08-27

## 1. Executive summary

The React application contains 89 catalogued concrete routes, including 58 canonical public/sitemap routes, 16 Admin routes, 10 Client Portal routes, and authentication routes. The PHP front controller exposes 14 API resource families with 73 method/path handler branches. Public content is broadly healthy and direct-load capable. The contact form persists real leads. Authentication, scoped Client Portal reads, intake, messaging, and secure document handoff have meaningful backend support.

The largest remaining operational risk is the split Admin implementation: initial lists hydrate from persistent APIs, but reports and several secondary workflows still use the process-local `adminStore`. The 2026-08-27 integration pass added persisted, failure-tolerant Drive document synchronization, Calendar appointment synchronization, SES delivery state, guarded lead notifications, and Stripe-hosted checkout/webhook reconciliation. These paths are implementation- and CI-verified only; live provider access still requires production verification.

No P0 defect was confirmed in this audit. The original audit recorded **25 tracked findings: 12 P1, 10 P2, and 3 P3**. The 2026-08-26 P1 remediation implemented the seven direct frontend/backend route contracts, best-effort portal provisioning/manual links, forgot/change password, and authorized-user grant controls. Remaining workflow and integration findings below are retained.

## 2. Public route inventory

| Route family                                               |          Count | Component/status                                                     | Navigation/direct load/metadata/sitemap                                                        |
| ---------------------------------------------------------- | -------------: | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/`, `/why-alchemize`, `/web-digital`                      |              3 | Working public pages                                                 | Reachable; direct load and metadata work; canonical routes included                            |
| `/about`                                                   |              1 | Working redirect to `/why-alchemize`                                 | Legacy redirect; intentionally excluded from sitemap                                           |
| `/services`, audience redirects, service details           |             10 | Working; seven maintained detail routes                              | E2E covers index/details/legacy redirect; responsive CSS present                               |
| `/resources`, founder/client resource pages, article slugs |             17 | Working maintained library; one retired consultation redirect        | Article metadata and mobile overflow covered by E2E                                            |
| `/faq`                                                     |              1 | Working; seven categories in current source                          | Search/accordion test valid after a fresh build                                                |
| `/contact`                                                 |              1 | Working persisted lead form                                          | Public POST is real; see section 3                                                             |
| `/privacy`, `/terms`                                       |              2 | Working legal pages                                                  | Direct load and a11y covered; English-only sitemap alternates intentional                      |
| Spanish `/es/**` equivalents                               |             23 | Working localized route layer                                        | Sitemap alternate generation present; coverage is structural rather than every translated page |
| `/login`, `/register`, `/set-password`                     |              3 | Login/set-password working; registration intentionally informational | Excluded from sitemap                                                                          |
| Legacy resource references                                 | 2 route blocks | Redirect/content compatibility routes                                | Not represented by `APP_ROUTE_PATHS`; should be documented in route tooling                    |

The generated sitemap contains 58 public routes. `npm run routes:list` is not authoritative: it scans static HTML and reports only `/`. `routes:check` validates a manually maintained 89-route catalog that is stale for Admin (`messages` versus `communications`) and omits Admin intake/reports/detail routes, Client intake, set-password, and legacy references. **[P2, FRONTEND]**

### Canonical public paths

All rows below resolve through `PublicLayout`, support SPA refresh through the rewrite fallback, and have page metadata unless explicitly noted. “Nav” means the main header/footer or an on-page maintained index links to the route.

| Paths                                                                                                                                         | Page/component               | Reachability and actions                              | Sitemap                    | Class                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/`                                                                                                                                           | `HomePage`                   | Header brand; service/resource/contact CTAs work      | Yes                        | WORKING                                                                                               |
| `/about`                                                                                                                                      | Redirect                     | Legacy/direct URL → `/why-alchemize`                  | No, appropriate            | WORKING                                                                                               |
| `/why-alchemize`                                                                                                                              | `WhyAlchemizePage`           | Main navigation; informational CTAs                   | Yes                        | WORKING                                                                                               |
| `/web-digital`                                                                                                                                | `WebDigitalPage`             | Services navigation/on-page CTAs                      | Yes                        | WORKING                                                                                               |
| `/services`                                                                                                                                   | `ServicesPage`               | Main navigation; audience/detail links                | Yes                        | WORKING                                                                                               |
| `/services/individuals`, `/services/businesses`                                                                                               | Redirects to service anchors | Direct/legacy audience URLs                           | No, appropriate            | WORKING                                                                                               |
| `/services/individuals/tax-preparation`                                                                                                       | `ServiceDetailPage`          | Service index; contact preselection                   | Yes                        | WORKING                                                                                               |
| `/services/individuals/notary-document-services`                                                                                              | `ServiceDetailPage`          | Service index; contact preselection                   | Yes                        | WORKING                                                                                               |
| `/services/businesses/advisory-optimization`                                                                                                  | `ServiceDetailPage`          | Service index; contact preselection                   | Yes                        | WORKING                                                                                               |
| `/services/businesses/operations-implementation`                                                                                              | `ServiceDetailPage`          | Service index; contact preselection                   | Yes                        | WORKING                                                                                               |
| `/services/businesses/digital-business-technology`                                                                                            | `ServiceDetailPage`          | Service index; contact preselection                   | Yes                        | WORKING                                                                                               |
| `/services/businesses/readiness-growth`                                                                                                       | `ServiceDetailPage`          | Service index; contact preselection                   | Yes                        | WORKING                                                                                               |
| `/services/businesses/financial-tax-support`                                                                                                  | `ServiceDetailPage`          | Service index; contact preselection                   | Yes                        | WORKING                                                                                               |
| `/resources`                                                                                                                                  | `ResourcesPage`              | Main navigation; search/filter/detail links           | Yes                        | WORKING                                                                                               |
| `/resources/client-resources`                                                                                                                 | `ClientResourcesPage`        | Route exists but is absent from route catalog/sitemap | No                         | PARTIAL [P2, FRONTEND]                                                                                |
| `/resources/meet-the-founder`                                                                                                                 | `MeetTheFounderPage`         | Resource/public navigation                            | Yes                        | WORKING                                                                                               |
| `/resources/{preparing-for-tax-season,tax-records-what-to-keep,estimated-taxes-questions}`                                                    | `ResourceRoutePage`          | Resource index cards                                  | Yes                        | WORKING                                                                                               |
| `/resources/{professional-website-design-process,digital-presence-audit,seo-and-website-metadata}`                                            | `ResourceRoutePage`          | Resource index cards                                  | Yes                        | WORKING                                                                                               |
| `/resources/{starting-a-business-organization-checklist,your-first-year-in-business,business-formation-information-to-gather}`                | `ResourceRoutePage`          | Resource index cards                                  | Yes                        | WORKING                                                                                               |
| `/resources/{business-needs-a-process,simple-administrative-system,business-records-what-needs-a-home,building-a-business-deadline-calendar}` | `ResourceRoutePage`          | Resource index cards                                  | Yes                        | WORKING                                                                                               |
| `/resources/documents-to-bring-to-a-consultation`                                                                                             | Redirect                     | Retired route → maintained first-year resource        | No, appropriate            | WORKING                                                                                               |
| `/faq`                                                                                                                                        | `FaqPage`                    | Main navigation; seven-category search/accordion      | Yes                        | WORKING                                                                                               |
| `/contact`                                                                                                                                    | `ContactPage`                | Main navigation; real lead submission                 | Yes                        | WORKING                                                                                               |
| `/privacy`, `/terms`                                                                                                                          | `LegalPage`                  | Footer                                                | Yes                        | WORKING                                                                                               |
| `/legacy-resource-reference/preparing-for-tax-season`                                                                                         | Inline compatibility content | Direct legacy URL only                                | No                         | PARTIAL [P3, FRONTEND]                                                                                |
| `/legacy-resource-reference/starting-a-business-organization-checklist`                                                                       | Inline compatibility content | Direct legacy URL only                                | No                         | PARTIAL [P3, FRONTEND]                                                                                |
| `/es` and `/es` equivalents of services, resources, FAQ, contact, why-alchemize                                                               | Same localized components    | Language switcher/direct URLs                         | 28 Spanish routes included | WORKING/PARTIAL: `client-resources`, legal pages, and legacy references have no Spanish catalog entry |

There is no dedicated public consultation/scheduling route. Consultation CTAs intentionally route to `/contact` with a canonical service query. External appointment scheduling is therefore **MISSING [P2, FRONTEND/GOOGLE_CALENDAR]**, not a dead link.

Server fallback is an SPA rewrite (`.htaccess` to `index.html`). The API uses `/alchemize-api.php?route=…`; the front controller rewrites `PATH_INFO` internally and supports the source-tree versus deployed Hostinger directory shape.

## 3. Contact-form workflow

`ContactPage` → `js/contact-form.js` → `POST /alchemize-api.php?route=leads` → lead validator → `AlchemizeLeadService` → `leads` and `activity_events` → Admin Leads.

| Check                                                             | Status                                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Frontend/backend endpoint and JSON contract                       | WORKING                                                                                                 |
| Required fields, email, audience, canonical service normalization | WORKING; React options include legacy aliases normalized by the shared integration script               |
| Honeypot                                                          | WORKING; returns a synthetic success without persistence to avoid teaching bots                         |
| Persistence and Admin visibility                                  | WORKING through the same `leads` table/repository                                                       |
| Malformed JSON / validation errors                                | WORKING safe 4xx responses                                                                              |
| False success on API failure                                      | Not present; success is shown only after `response.ok`                                                  |
| CSRF                                                              | Appropriate exemption for a public unauthenticated creation endpoint                                    |
| Rate limiting / replay / duplicate suppression                    | WORKING: hashed request/payload guards enforce an hourly limit and ten-minute replay window             |
| Admin email notification                                          | WORKING through persisted deduplicated notification delivery; live SES delivery not production-verified |
| Mobile                                                            | Form stacks at 560px; no browser-level mobile submit test exists **[P3, UX]**                           |

## 4. Authentication route inventory

| Flow                           | Frontend                           | API/service/storage                                      | Status                                                                                                         |
| ------------------------------ | ---------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Session                        | Auth guards/layouts                | `GET auth/session`, PHP session                          | WORKING; no CSRF required                                                                                      |
| Login                          | `/login`                           | `POST auth/login`, users/roles, password verification    | WORKING; safe errors                                                                                           |
| Logout                         | Portal layouts                     | `POST auth/logout`                                       | WORKING; cookie removal repaired; backend does not enforce CSRF **[P2, AUTH]**                                 |
| Invitation consumption         | `/set-password?purpose=invitation` | `POST auth/set-password`, hashed `portal_account_tokens` | WORKING; expiry/one-use                                                                                        |
| Reset consumption              | Same page with reset purpose       | Same endpoint/table                                      | WORKING                                                                                                        |
| Send/resend invitation         | Admin client detail                | `POST clients/:id/portal-invitation`                     | WORKING: token persists before best-effort SES; manual link returned on failure                                |
| Admin-triggered reset          | Admin client detail                | `POST clients/:id/password-reset`                        | WORKING with manual reset-link fallback                                                                        |
| User-requested forgot-password | Login                              | `POST auth/forgot-password`                              | WORKING; enumeration-safe response                                                                             |
| Authenticated change password  | Client Profile                     | `POST auth/change-password`                              | WORKING; current-password verification, CSRF, audit event                                                      |
| Pending/disabled portal        | Login and account-status checks    | users/client/grant status                                | PARTIAL: login checks user status, but an existing session is not revalidated against DB status **[P1, AUTH]** |
| Authorized user access         | Client request and Admin client UI | request/grant review services                            | WORKING: approve/reject, scoped role changes, revoke/re-enable                                                 |

## 5. Admin Portal route/function matrix

| Route                            | Rendering/data                                     | Actions and classification                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`, `/admin/dashboard`     | WORKING route; dashboard uses hydrated collections | Summary derives from store snapshot; not all collections are hydrated from APIs **PARTIAL [P2]**                                                                                          |
| `/admin/leads`                   | Persistent lead API                                | List/detail/update/convert/notes largely WORKING; contact attempts/interests backend have limited/no UI callers                                                                           |
| `/admin/clients`, `/:clientId`   | Persistent list/detail/create/update               | Create/edit/archive and state-aware portal actions persist; manual setup/reset links are one-time token rotations **WORKING**                                                             |
| `/admin/intakes`                 | Persistent portal-admin intake API                 | Assign/review/update paths exist; selectors are real; advanced missing-information review is PARTIAL                                                                                      |
| `/admin/services`                | Persistent service/engagement load/create/update   | Engagement and exposed service create/edit paths persist **WORKING**                                                                                                                      |
| `/admin/tasks`                   | Persistent list/create/update                      | Core create/update WORKING; frontend declares nonexistent `GET tasks/:id`; completion UI/store paths are mixed **PARTIAL [P2]**                                                           |
| `/admin/documents`               | Persistent list/request creation                   | Formal request works; declared detail/update routes are absent; Admin attach/register is explicitly disabled; review/download uses portal-admin submission routes **PARTIAL/BROKEN [P1]** |
| `/admin/communications`          | Persistent portal-admin threads                    | Open/reply/read/archive/link routes WORKING; separate read states implemented                                                                                                             |
| `/admin/appointments`            | Persistent list/create/detail/update               | Manual create, edit, cancel and reschedule use persistent API handlers **WORKING internally**                                                                                             |
| `/admin/billing`, invoice detail | Invoice/payment create/list/detail/update APIs     | Invoice state persists; Stripe identifiers/reconciliation state are visible through persisted API data. Broader Admin retry/detail UX remains PARTIAL [P2, UX]                            |
| `/admin/content`                 | Static configuration tables                        | All mutations clearly disabled; no CMS persistence/backend **PLACEHOLDER [P2]**                                                                                                           |
| `/admin/reports`                 | Calculated from `adminStore`                       | Filters/export presentation are local snapshot logic, not a report API **PARTIAL [P2]**                                                                                                   |
| `/admin/settings`                | Team list is real                                  | Other settings are disabled; no settings persistence model **PLACEHOLDER [P2]**                                                                                                           |

Cross-cutting Admin findings:

- Fabricated `staffOptions` names were removed; remaining generic owner assignment should be replaced by real Team Access IDs when assignment ownership is normalized. **RESOLVED for fake data**
- Initial Admin hydration fetches clients/services/appointments/engagements/tasks/documents only. Leads, invoices, payments, activity, messages, reports, and notes may remain empty/local until page-specific behavior runs. **[P1, FRONTEND/BACKEND]**
- The previously unsupported client/service/task/appointment/document/invoice detail/update contracts now have CSRF-protected persistent handlers. Admin document binary attach remains explicitly unavailable pending its supported storage workflow.

## 6. Client Portal route/function matrix

| Route                          | Reads                               | Actual client actions                                                | Status                                                                                            |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/client-portal`, `/dashboard` | Scoped dashboard/activity/counts    | Action cards navigate                                                | WORKING; counts are persisted/scoped                                                              |
| `/services`                    | Visible engagements                 | Request service creates a persisted lead-style request               | WORKING/PARTIAL: request is persisted but Admin review presentation is indirect                   |
| `/intake`                      | Assigned engagement intake          | Save, resume, submit, structured profile references, secure handoff  | WORKING                                                                                           |
| `/tasks`                       | Visible tasks                       | Complete, acknowledge, respond                                       | WORKING; supporting-file association is not a task-specific workflow **[P2]**                     |
| `/documents`                   | Requests/shared docs/versions       | Requested and general upload, replace, authenticated download        | WORKING local storage with best-effort Drive copy and persisted sync state                        |
| `/appointments`                | Visible appointments                | Request, confirm, request reschedule/cancel                          | WORKING internal workflow; Calendar unwired                                                       |
| `/messages`                    | Scoped threads/history              | Create, open/read, reply, archive                                    | WORKING; prior JSON-object error is corrected and tested                                          |
| `/billing`                     | Invoices/payments/open balance      | View, acknowledge, Stripe-hosted payment for payable issued invoices | WORKING workflow; webhook remains authoritative for paid status; live Stripe verification pending |
| `/profile`                     | Client/business/contact/access data | Edit fields, sensitive/authorized-user requests, change password     | WORKING for internal account management                                                           |

All Client Portal ownership resolution uses the authenticated session/access grant rather than a frontend client ID. File storage validates type/size/content and stores outside public paths.

## 7. API route inventory

All URLs are dispatched as `/alchemize-api.php?route=<path>`; conceptual `/api/v1/**` paths below identify endpoint families. Admin mutations require staff/Admin plus CSRF unless noted. Portal mutations share a centralized authenticated-client/CSRF gate.

| Method/path patterns                                                                                                                               | Auth/CSRF                                        | Service/repository and tables                                                                    | Frontend/status                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `GET auth/session`; `POST auth/login,set-password,logout`                                                                                          | Public/session; login/set-password no CSRF       | auth/account services; users, roles, tokens, grants                                              | WORKING; no forgot-password request                               |
| `POST leads`; `GET leads,leads/:id`; `PUT leads/:id`; `POST leads/:id/{convert,contact-attempts,notes,interests}`                                  | Create public; Admin reads; Admin mutations CSRF | lead services; leads, interests, attempts, notes, activity                                       | WORKING; some secondary routes have no caller                     |
| `GET/POST clients`; `GET clients/team`; `GET clients/:id`; `GET clients/:id/portal-account`; `POST clients/:id/{portal-invitation,password-reset}` | staff/read-only/Admin; mutations CSRF            | client/account repositories; clients/users/grants/tokens                                         | WORKING except missing client PUT                                 |
| `GET/POST services`; `GET services/:id`                                                                                                            | staff/read-only; POST CSRF                       | services                                                                                         | WORKING; frontend PUT missing backend                             |
| `GET/POST engagements`; `GET/PUT engagements/:id`                                                                                                  | staff/read-only; mutations CSRF                  | engagements/services/clients/activity                                                            | WORKING                                                           |
| `GET/POST tasks`; `PUT tasks/:id`                                                                                                                  | staff/read-only; mutations CSRF                  | tasks/activity                                                                                   | WORKING; declared frontend GET detail absent                      |
| `GET/POST documents`                                                                                                                               | staff/read-only; POST CSRF                       | documents metadata                                                                               | PARTIAL; no Admin detail/update/file attach                       |
| `GET/POST appointments`                                                                                                                            | staff/read-only; POST CSRF                       | appointments                                                                                     | PARTIAL; no Admin detail/update/cancel API                        |
| `GET/POST invoices`; `GET/POST payments`                                                                                                           | staff/read-only; mutations CSRF                  | invoices/line items/payments                                                                     | PARTIAL; missing detail/update and Stripe creation                |
| `GET notes/{type}/{id}`; `POST notes`                                                                                                              | staff/read-only; POST CSRF                       | notes                                                                                            | WORKING; narrow callers                                           |
| `GET portal/{9 resources}` plus scoped detail/download                                                                                             | authenticated client                             | portal repositories across engagements/intakes/tasks/docs/messages/appointments/invoices/profile | WORKING                                                           |
| Portal task/document/intake/message/appointment/profile/onboarding/authorized-user/acknowledgement mutations                                       | authenticated client + CSRF                      | action/intake/storage services and activity/audit tables                                         | WORKING/PARTIAL as section 6                                      |
| `GET portal-admin/{attention,messages,intakes,...}` and document downloads/versions                                                                | staff/Admin                                      | portal-admin/intake repositories                                                                 | WORKING                                                           |
| `POST/PUT portal-admin/{resolve,messages,intakes,...}`                                                                                             | staff/Admin + CSRF                               | portal-admin/intake/notification services                                                        | WORKING                                                           |
| `POST webhooks/stripe`                                                                                                                             | Stripe signature, no session/CSRF                | webhook service/repository; stripe events, invoices, payments                                    | WORKING signature/idempotency and checkout/payment reconciliation |

The 14 endpoint files contain **73 method/path handler branches**. There is no separate `/messages`, `/communications`, `/intakes`, or `/billing` top-level API; those concepts intentionally live under `portal`, `portal-admin`, and `invoices/payments`.

### Request-body and caller detail

| Endpoint family         | Accepted body/query shape                                                                      | Principal frontend caller                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `auth`                  | Login credentials; set-password token/password; logout has no JSON body                        | `auth-api.js`, `AuthPage`, `SetPasswordPage`                |
| `leads`                 | Public contact fields plus honeypot; Admin status/conversion/note/interest payloads            | `contact-form.js`, Admin Leads                              |
| `clients`               | Client create fields; invitation/reset actions have no client password; list/detail query only | Admin Clients/profile                                       |
| `services`              | Service definition on create; detail/list query                                                | Admin Services                                              |
| `engagements`           | Client/service IDs, status, dates and scoped engagement fields                                 | Admin Clients/Services                                      |
| `tasks`                 | Client/engagement assignment, instructions, due/status/visibility fields                       | Admin Tasks; portal task actions use `portal`               |
| `documents`             | Request metadata on Admin create; no Admin binary attach/update contract                       | Admin Documents                                             |
| `appointments`          | Client/engagement, type, date/time and status on create                                        | Admin Appointments                                          |
| `invoices` / `payments` | Invoice header/lines or recorded-payment fields                                                | Admin Billing                                               |
| `notes`                 | Entity type/ID and note text                                                                   | Admin detail panels                                         |
| `portal` reads          | Query/path identifiers only; client ownership comes from session                               | All Client Portal pages                                     |
| `portal` mutations      | Action-specific JSON or multipart file upload; centralized CSRF/session scope                  | Client intake/tasks/documents/appointments/messages/profile |
| `portal-admin`          | Action-specific JSON; downloads use path/query only                                            | Admin Intake/Communications/Documents/client profile        |
| `webhooks/stripe`       | Raw Stripe payload, never decoded/re-encoded before signature verification                     | Stripe only; no browser caller                              |

Malformed JSON is rejected by the shared request parser. The prior Messages Open Thread defect is no longer present: thread opening uses the read endpoint and the explicit read mutation supplies a JSON object.

## 8. External integration readiness

| Integration     | Ready                                                                                                           | Gap                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe          | Config, signed/idempotent webhook, idempotent customer mapping, hosted Checkout, invoice/payment reconciliation | IMPLEMENTED; live checkout and webhook delivery require production verification                                                                 |
| Google Drive    | SDK/config/factory, stable client-folder lookup, version upload, persisted folder/file IDs and sync state       | IMPLEMENTED as a best-effort copy after local persistence; authenticated local download remains authoritative                                   |
| Google Calendar | SDK/config/service, deterministic event IDs, confirmed create/update and cancellation synchronization           | IMPLEMENTED; appointment database remains authoritative and failures persist for retry visibility                                               |
| SES             | PHPMailer SES provider, branded HTML/plain text, persisted deduplicated delivery status                         | Portal tokens, leads, appointments, documents, messages, authorized-user decisions, and issued invoices are wired; live delivery is not claimed |

## 9. Broken routes

The seven frontend/backend contract failures found in the original audit were resolved in the P1 remediation. The stale route-catalog entry remains a tooling issue.

| Frontend caller           | Missing backend handler                                                | Effect                                                    | Priority    |
| ------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- | ----------- |
| `clients.update`          | `PUT clients/:id`                                                      | RESOLVED                                                  | WORKING     |
| `services.update`         | `PUT services/:id`                                                     | RESOLVED                                                  | WORKING     |
| `tasks.get`               | `GET tasks/:id`                                                        | RESOLVED                                                  | WORKING     |
| `appointments.get/update` | `GET/PUT appointments/:id`                                             | RESOLVED                                                  | WORKING     |
| `documents.get/update`    | `GET/PUT documents/:id`                                                | RESOLVED for metadata; binary Admin attach still disabled | PARTIAL     |
| `invoices.get/update`     | `GET/PUT invoices/:id`                                                 | RESOLVED                                                  | WORKING     |
| Route catalog             | `/admin/messages` catalogued while router uses `/admin/communications` | Tooling validates a stale path                            | P2 FRONTEND |

## 10. Missing routes

- Public forgot-password and authenticated Client change-password routes are **RESOLVED**.
- Provider retry controls are not yet exposed consistently on every Admin detail surface. **P2 UX/BACKEND**
- Explicit Admin service-request review route/queue. **P2 BACKEND/FRONTEND**
- CMS/settings/report persistence endpoints. **P2 BACKEND/DATABASE**
- Dedicated public scheduling route is not present; contact is the current intended fallback. **P2 UX/GOOGLE_CALENDAR**

## 11. Missing backend functions

- Persisted CMS, settings, and reporting services.
- Session revalidation against current user/grant status.

## 12. Missing frontend functions

- Complete receipt-link presentation and Admin provider retry controls.
- Admin attach-document action and explicit service-request review queue.
- Authenticated Admin mobile action coverage and mobile contact submission coverage.

## 13. Placeholder/demo functionality

- Content Management is intentionally disabled and backed by static configuration rows.
- Workflow/Document/Alert/Service/Lead settings panels are disabled; Team Access alone loads real users.
- Reports calculate from the current `adminStore`, not a reporting endpoint.
- `staffOptions` contains demo names (`Jordan Martin`, `Taylor Nguyen`, and others) outside Team Access.
- Archive/internal-note and portions of billing/service/task/document/appointment UI mutate `adminStore` only and disappear on reload.

## 14. Database/schema gaps

| Gap                                                        | Required for                                                | Priority/dependency |
| ---------------------------------------------------------- | ----------------------------------------------------------- | ------------------- |
| Drive client-folder and version-provider identifiers/state | RESOLVED by migration 021                                   | WORKING             |
| Calendar event identifier and sync status/error timestamps | RESOLVED by migration 021                                   | WORKING             |
| Stripe customer/invoice/payment/session identifiers        | RESOLVED by migration 021                                   | WORKING             |
| Notification delivery state/attempt timestamps             | RESOLVED by migration 021; scheduled retry queue remains P2 | PARTIAL SES         |
| CMS pages/resources/notices/SEO tables                     | Content mutations                                           | P2 DATABASE         |
| Namespaced persisted settings/audit history                | Editable settings                                           | P2 DATABASE         |

No engagement/client relationship migration is required: `engagements.client_id`, intake engagement references, and downstream optional engagement foreign keys already exist.

## 15. Mobile issues

- Admin Menu/Return overlap is fixed in source: the return action moves into the drawer below 1023px.
- Client menu open/close and route navigation are covered by Playwright.
- Admin and content/team tables use contained `overflow-x:auto`; page-level overflow is not expected.
- Public/client forms have narrow-width stacking rules.
- Remaining gap: Admin modals, dense action groups, and every Admin route are not covered at mobile width. **P2 UX**
- Remaining gap: public contact submission has no mobile E2E round trip. **P3 UX**
- No mobile-only blank route was found in router/source review.

## 16. Security concerns

- Public lead POST uses hashed replay and request-rate guards. **WORKING**
- Existing-session revalidation against active users and active client grants is **RESOLVED** by the Phase 4 request guard.
- Logout is a state-changing POST without server-side CSRF enforcement. **P2 AUTH**
- Portal token architecture is hashed, expiring, one-use, and best-effort SES delivery preserves manual fallback. **WORKING; live SES verification pending**
- Portal object access is session-derived and cross-client checks are covered by security tests. **WORKING**
- File validation/storage and Stripe signature verification are implemented with safe response boundaries. **WORKING**

### Consolidated priority register

| Severity | Dependency         | Issue                                                                                      |
| -------- | ------------------ | ------------------------------------------------------------------------------------------ |
| P1       | FRONTEND/BACKEND   | Document detail/update/Admin attach workflow is incomplete                                 |
| P2       | FRONTEND           | Internal notes, reports, and secondary presentation state still use in-memory store data    |
| P2       | FRONTEND/HOSTINGER | Route discovery/check catalogs are incomplete/stale                                        |
| P2       | AUTH               | Logout lacks server CSRF enforcement                                                       |
| P2       | FRONTEND           | Supporting-file task linkage remains incomplete                                            |
| P2       | BACKEND            | Service-request Admin review is indirect rather than an explicit queue                     |
| P2       | FRONTEND/BACKEND   | Content is deliberately disabled; no CMS persistence                                       |
| P2       | FRONTEND/BACKEND   | Reports are local calculations without report endpoints                                    |
| P2       | DATABASE/BACKEND   | Editable settings lack a persisted settings model and remain disabled                      |
| P2       | SES/UX             | Automated retry scheduling and full template localization remain incomplete                |
| P2       | STRIPE/UX          | Admin retry/detail and client receipt-link presentation remain incomplete                  |
| P2       | UX                 | Admin mobile behavior has CSS safeguards but no authenticated mobile route/action coverage |
| P3       | UX                 | No browser-level mobile contact submission test                                            |
| P3       | FRONTEND           | Legacy routes are implemented inline and omitted from route tooling                        |
| P3       | UX                 | Large production JS bundle warning remains                                                 |

Mobile source review confirms the Admin return link moves into the drawer below 1023px, table wrappers use contained horizontal scrolling, and Client Portal navigation has a mobile E2E test. Authenticated Admin mobile controls/modals and contact submission remain unverified at browser level.

## 17. Recommended remediation order

1. Complete Admin document attach/detail and eliminate the remaining local-only internal-note workflow/demo staff options.
2. Add operational retry controls and scheduled notification retry processing without exposing provider details.
3. Complete Stripe receipt presentation and Admin payment reconciliation detail.
4. Decide whether CMS/settings/report persistence is in scope; retain explicit disabled states until then.
5. Replace the split route catalogs with router-derived discovery and add Admin/mobile/contact E2E coverage.

## 18. Phase 4 production lifecycle validation

This section preserves the earlier audit and classifies the lifecycle after contract-level validation. “Automated verified” means source contracts and local automated suites passed; it does not mean the deployed Hostinger database or an external provider was exercised.

### Canonical lifecycle and ownership

| Transition | Database authority | API / portal owner | External representation | Validation status |
| --- | --- | --- | --- | --- |
| Public contact → lead | `leads`, `activity_events`, `public_submission_guards` | Public `POST leads`; Admin Leads | SES Admin notice | IMPLEMENTED / AUTOMATED VERIFIED; live persistence and SES require validation |
| Lead review → conversion | `leads.client_id`, `clients.origin_lead_id` | Admin Leads conversion | None | RESOLVED: migration 022 supplies the previously missing lead/client column and conversion now locks inside its transaction |
| Client → portal provisioning | `clients`, `users`, `client_access_grants`, `portal_account_tokens` | Admin Client detail | SES invitation or one-time manual link | IMPLEMENTED / AUTOMATED VERIFIED; provider delivery requires live validation |
| Invitation → activation | `users.password_hash/status`, grant/client portal status, token consumption | `/set-password`, auth API | SES/manual link transport only | IMPLEMENTED / AUTOMATED VERIFIED |
| Engagement → intake → review | engagements and intake assignment/response/history tables | Admin Services/Intake and Client Intake | Optional document handoff | IMPLEMENTED / AUTOMATED VERIFIED; full live reload round trip remains checklist work |
| Document request → version/review | private local storage, metadata/submissions | Admin Documents and Client Documents | Best-effort Drive copy with persisted state | IMPLEMENTED / AUTOMATED VERIFIED; live Drive permissions require validation |
| Appointment request → decision | appointments/change requests | Client Appointments and Admin attention | Calendar event keyed by persisted deterministic event ID | IMPLEMENTED / AUTOMATED VERIFIED; live Calendar access requires validation |
| Client/Admin messaging | threads/messages/read timestamps/notifications | Client Messages and Admin Communications | Best-effort SES notice | IMPLEMENTED / AUTOMATED VERIFIED |
| Invoice → payment | invoices/line items/payments/webhook events | Admin Billing and Client Billing | Stripe Checkout and verified webhook | RESOLVED: issuance, reload hydration, line-item persistence, manual reconciliation, and idempotent payment request are now database-backed; live Stripe test-mode validation required |
| Task/engagement completion | task and engagement status/history | Admin Tasks/Services and Client Tasks | None | IMPLEMENTED / AUTOMATED VERIFIED; completion policy remains operational |

### Phase 4 route-contract findings

| Contract | Finding before correction | Classification | Current result |
| --- | --- | --- | --- |
| `POST leads/:id/convert` | `FOR UPDATE` executed before the transaction and `leads.client_id` was referenced without any migration | BROKEN / P1 DATABASE | RESOLVED by migration 022 and transactional lock ordering |
| Admin issue invoice → Client Billing | UI sent `open` but no `issued_at`; Client query intentionally excluded it | FALSE SUCCESS / P1 BACKEND | RESOLVED: non-draft creation assigns `issued_at` and notification uses persisted issuance |
| Invoice line editor → reload | Visible line editor calculated totals but neither sent nor persisted line items | IN-MEMORY / P1 FRONTEND/BACKEND | RESOLVED: request, repository transaction, and reload serialization preserve line items |
| Admin record payment | UI called only `adminStore.recordPayment`; API-created payments did not update invoice totals/status | FALSE SUCCESS / P1 FRONTEND/BACKEND | RESOLVED: CSRF/Admin API persists an idempotent payment and reconciles the locked invoice before cache update |
| Admin Billing reload | Admin layout did not load invoices/payments from APIs | IN-MEMORY / P1 FRONTEND | RESOLVED: both collections hydrate from persistent APIs |
| Existing disabled/revoked session | Role guards trusted the login-time session snapshot | BROKEN AUTHORIZATION / P1 AUTH | RESOLVED: every authenticated guard reloads active user state; portal roles must retain at least one active grant |
| Client internal note | Client-detail “Add note” still writes only `adminStore` | IN-MEMORY / P2 FRONTEND/BACKEND | OPEN; not required for the canonical client-facing lifecycle and must not be represented as persisted |
| Admin document attachment/detail | Metadata/review exists; general Admin binary attachment is disabled | DEAD UI / P1 DOCUMENTS | OPEN; control is explicitly disabled rather than falsely successful |
| Multiple-client authorized user | Repository selects the default/oldest active grant and there is no client-switch route/UI | MISSING / P2 AUTH/UX | OPEN; single-client access is enforced correctly, but multi-client selection is not operationally complete |

### Key lifecycle route contract summary

| Caller → route | Auth / CSRF / body | Persistence and response consumer | Reload result |
| --- | --- | --- | --- |
| Contact form → `POST leads` | Public; JSON validation, honeypot, replay/rate guard; no session CSRF | Lead/activity commit before deduplicated notification attempt; form consumes safe 201/4xx | Admin list reads `leads` |
| Admin conversion → `POST leads/:id/convert` | Staff/Admin + CSRF; conversion profile JSON | Locked lead, one client, lead linkage, activity/audit | Admin APIs return converted lead/client |
| Admin client create/provision/actions | Staff/Admin or Admin as appropriate + CSRF | Client/user/grant/token transaction; delivery result separate; raw setup token returned once when required | Client and portal status reload from repository joins |
| Auth login/session/set/reset/change/logout | Login/setup/reset public-safe; change requires session+CSRF | Password hashes stay server-only; session ID regenerates; tokens are expiring/one-use | Session route revalidates current user/grant |
| Admin engagement/intake/task/document/appointment/invoice | Staff/Admin + CSRF; validated JSON or multipart | Persistent repositories and activity/review tables | Admin hydration and Client scoped reads use the same records |
| Client portal mutations | Authenticated session, active scoped grant, CSRF; IDs re-bound to resolved client | Client-scoped repositories; safe 404/403 on foreign IDs | Portal resource GET returns persisted state |
| Client billing checkout | Active billing-capable grant + CSRF; invoice public ID | Stripe session/provider IDs persist; no local paid mutation | Only signed webhook changes payment/invoice completion |
| Stripe webhook | Raw body + Stripe signature; no browser session | Unique event, locked invoice/payment reconciliation | Client/Admin billing reload reflects verified result |

### Database and migration validation

- Migration 022 adds the missing `leads.client_id` relationship used by conversion and a nullable unique `payments.request_key` for retry-safe manual payments.
- Historical negative credit values are normalized to the schema’s positive credit/deposit convention; invoice calculations now consistently subtract credits.
- `scripts/verify-production-schema.php` is CLI-only and compares critical production columns for type/nullability, reporting only PRESENT, MISSING, or MISMATCH.
- The local environment does not provide a production database snapshot, so the deployed schema is **REQUIRES LIVE VERIFICATION** after migrations 001–022.

### Isolation and authorization validation

- Client profile, engagements, intake, tasks, documents/downloads, appointments, messages, acknowledgements, invoices, and payments resolve through the authenticated grant/client rather than a caller-supplied client ID.
- Admin APIs use role guards; state-changing routes require CSRF except logout, retained as an open P2 hardening item.
- Existing static security suites validate query-level client binding and Admin role guards. A real Client A/Client B database exercise remains in the production acceptance checklist and is not represented as production verified.

### UI truthfulness

- Client payment completion is never inferred from a return URL; the UI says processing until webhook reconciliation.
- Provider responses return persisted synchronized/failed/not-configured states and never fabricate success.
- Content/settings integrations remain disabled where persistence does not exist.
- The remaining client-detail internal-note action is local-only and is an OPEN P2 truthfulness defect; Admin document attachment remains explicitly disabled.

### Mobile, accessibility, and performance observations

- Existing E2E covers public mobile overflow and Client navigation; authenticated Admin workflow coverage is desktop-focused. The live checklist covers the missing mobile workflow matrix.
- Public axe checks exist. Authenticated Admin/Client axe coverage remains OPEN P2; this pass does not weaken public assertions.
- Production build emits one approximately 838 kB minified entry chunk (approximately 223 kB gzip). `App.jsx` eagerly imports all public, Admin, and Client pages, and the very large `AdminOperationalPages.jsx` is included for public visits. React, React Router, and Lucide are the only material runtime packages. Route-level lazy loading would materially reduce public initial JavaScript, but it is deferred as a low-risk-focused P3 performance remediation because changing every route import during acceptance validation would broaden risk.

### Historical finding disposition

| Historical finding group | Disposition |
| --- | --- |
| Missing Admin client/service/task/appointment/document/invoice HTTP contracts | RESOLVED |
| Portal provisioning coupled to email and missing manual links | RESOLVED |
| Forgot/change password and authorized-user Admin controls | RESOLVED |
| Drive/Calendar/Stripe workflow identifiers and synchronization | RESOLVED in implementation; REQUIRES LIVE VERIFICATION |
| SES domain notifications and lead abuse controls | RESOLVED in implementation; REQUIRES LIVE VERIFICATION |
| Session revocation revalidation | RESOLVED |
| Lead conversion schema/transaction contract | RESOLVED in migration 022 |
| Admin/client billing issuance, reload, line items, and manual payment persistence | RESOLVED |
| CMS/settings/report persistence | OPEN / deliberately disabled or local reporting |
| Admin document binary attach/detail | OPEN P1; explicitly disabled |
| Remaining local internal-note/demo staff data | OPEN P2 |
| Route catalog gaps and mobile/authenticated accessibility coverage | OPEN P2/P3 |
