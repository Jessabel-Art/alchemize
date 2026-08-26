# Alchemize Portal Route and Functionality Audit

Audit date: 2026-08-26

## 1. Executive summary

The React application contains 89 catalogued concrete routes, including 58 canonical public/sitemap routes, 16 Admin routes, 10 Client Portal routes, and authentication routes. The PHP front controller exposes 14 API resource families with 73 method/path handler branches. Public content is broadly healthy and direct-load capable. The contact form persists real leads. Authentication, scoped Client Portal reads, intake, messaging, and secure document handoff have meaningful backend support.

The largest operational risk is the split Admin implementation: initial lists hydrate from persistent APIs, but several edits, archives, reports, billing actions, and secondary selectors still use the process-local `adminStore`. Several frontend API methods also target backend routes that do not exist. External provider configuration is ready, but Google Drive, Google Calendar, Stripe checkout/payment creation, and SES portal-account delivery are not wired into the business workflows.

No P0 defect was confirmed in this audit. There are **25 tracked findings: 12 P1, 10 P2, and 3 P3**. Seven are direct missing/broken frontend/backend route contracts.

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

| Check                                                             | Status                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Frontend/backend endpoint and JSON contract                       | WORKING                                                                                   |
| Required fields, email, audience, canonical service normalization | WORKING; React options include legacy aliases normalized by the shared integration script |
| Honeypot                                                          | WORKING; returns a synthetic success without persistence to avoid teaching bots           |
| Persistence and Admin visibility                                  | WORKING through the same `leads` table/repository                                         |
| Malformed JSON / validation errors                                | WORKING safe 4xx responses                                                                |
| False success on API failure                                      | Not present; success is shown only after `response.ok`                                    |
| CSRF                                                              | Appropriate exemption for a public unauthenticated creation endpoint                      |
| Rate limiting / replay / duplicate suppression                    | **MISSING [P1, BACKEND/SECURITY]**; honeypot is the only abuse control                    |
| Admin email notification                                          | **UNWIRED [P2, SES]**; lead creation does not use `AlchemizeNotificationService`          |
| Mobile                                                            | Form stacks at 560px; no browser-level mobile submit test exists **[P3, UX]**             |

## 4. Authentication route inventory

| Flow                           | Frontend                           | API/service/storage                                      | Status                                                                                                         |
| ------------------------------ | ---------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Session                        | Auth guards/layouts                | `GET auth/session`, PHP session                          | WORKING; no CSRF required                                                                                      |
| Login                          | `/login`                           | `POST auth/login`, users/roles, password verification    | WORKING; safe errors                                                                                           |
| Logout                         | Portal layouts                     | `POST auth/logout`                                       | WORKING; cookie removal repaired; backend does not enforce CSRF **[P2, AUTH]**                                 |
| Invitation consumption         | `/set-password?purpose=invitation` | `POST auth/set-password`, hashed `portal_account_tokens` | WORKING; expiry/one-use                                                                                        |
| Reset consumption              | Same page with reset purpose       | Same endpoint/table                                      | WORKING                                                                                                        |
| Send/resend invitation         | Admin client detail                | `POST clients/:id/portal-invitation`                     | PARTIAL: token works, production SES delivery is not wired **[P1, SES/AUTH]**                                  |
| Admin-triggered reset          | Admin client detail                | `POST clients/:id/password-reset`                        | PARTIAL for same reason                                                                                        |
| User-requested forgot-password | None                               | None                                                     | **MISSING [P1, AUTH/FRONTEND/BACKEND]**                                                                        |
| Pending/disabled portal        | Login and account-status checks    | users/client/grant status                                | PARTIAL: login checks user status, but an existing session is not revalidated against DB status **[P1, AUTH]** |
| Authorized user access         | Client request UI                  | request table/Admin review service                       | PARTIAL: request persists; full approval/permission-management UI is incomplete **[P2, AUTH]**                 |

## 5. Admin Portal route/function matrix

| Route                            | Rendering/data                                     | Actions and classification                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`, `/admin/dashboard`     | WORKING route; dashboard uses hydrated collections | Summary derives from store snapshot; not all collections are hydrated from APIs **PARTIAL [P2]**                                                                                          |
| `/admin/leads`                   | Persistent lead API                                | List/detail/update/convert/notes largely WORKING; contact attempts/interests backend have limited/no UI callers                                                                           |
| `/admin/clients`, `/:clientId`   | Persistent list/detail/create                      | Create and portal actions WORKING; edit calls missing `PUT clients/:id`; archive is local-only **BROKEN [P1]**                                                                            |
| `/admin/intakes`                 | Persistent portal-admin intake API                 | Assign/review/update paths exist; selectors are real; advanced missing-information review is PARTIAL                                                                                      |
| `/admin/services`                | Persistent service/engagement load and create      | Engagement create/update WORKING; service edit calls missing `PUT services/:id`; some catalog edits remain local **BROKEN [P1]**                                                          |
| `/admin/tasks`                   | Persistent list/create/update                      | Core create/update WORKING; frontend declares nonexistent `GET tasks/:id`; completion UI/store paths are mixed **PARTIAL [P2]**                                                           |
| `/admin/documents`               | Persistent list/request creation                   | Formal request works; declared detail/update routes are absent; Admin attach/register is explicitly disabled; review/download uses portal-admin submission routes **PARTIAL/BROKEN [P1]** |
| `/admin/communications`          | Persistent portal-admin threads                    | Open/reply/read/archive/link routes WORKING; separate read states implemented                                                                                                             |
| `/admin/appointments`            | Persistent list/create                             | Manual create works; frontend detail/update calls have no backend; cancel/reschedule edits are local-only **BROKEN [P1]**                                                                 |
| `/admin/billing`, invoice detail | Invoice/payment create/list APIs                   | Create invoice/manual payment persist; detail/update callers have no backend; no Stripe checkout/payment links **PARTIAL [P1]**                                                           |
| `/admin/content`                 | Static configuration tables                        | All mutations clearly disabled; no CMS persistence/backend **PLACEHOLDER [P2]**                                                                                                           |
| `/admin/reports`                 | Calculated from `adminStore`                       | Filters/export presentation are local snapshot logic, not a report API **PARTIAL [P2]**                                                                                                   |
| `/admin/settings`                | Team list is real                                  | Other settings are disabled; no settings persistence model **PLACEHOLDER [P2]**                                                                                                           |

Cross-cutting Admin findings:

- `staffOptions` still contains fabricated names even though Team Access uses real users. **[P1, FRONTEND]**
- Initial Admin hydration fetches clients/services/appointments/engagements/tasks/documents only. Leads, invoices, payments, activity, messages, reports, and notes may remain empty/local until page-specific behavior runs. **[P1, FRONTEND/BACKEND]**
- The API client declares unsupported `GET/PUT` detail operations for services, tasks, appointments, documents, and invoices plus unsupported client update. **Seven broken contracts [P1].**

## 6. Client Portal route/function matrix

| Route                          | Reads                               | Actual client actions                                                  | Status                                                                            |
| ------------------------------ | ----------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/client-portal`, `/dashboard` | Scoped dashboard/activity/counts    | Action cards navigate                                                  | WORKING; counts are persisted/scoped                                              |
| `/services`                    | Visible engagements                 | Request service creates a persisted lead-style request                 | WORKING/PARTIAL: request is persisted but Admin review presentation is indirect   |
| `/intake`                      | Assigned engagement intake          | Save, resume, submit, structured profile references, secure handoff    | WORKING                                                                           |
| `/tasks`                       | Visible tasks                       | Complete, acknowledge, respond                                         | WORKING; supporting-file association is not a task-specific workflow **[P2]**     |
| `/documents`                   | Requests/shared docs/versions       | Requested and general upload, replace, download                        | WORKING local storage; Google Drive unwired                                       |
| `/appointments`                | Visible appointments                | Request, confirm, request reschedule/cancel                            | WORKING internal workflow; Calendar unwired                                       |
| `/messages`                    | Scoped threads/history              | Create, open/read, reply, archive                                      | WORKING; prior JSON-object error is corrected and tested                          |
| `/billing`                     | Invoices/payments/open balance      | View only                                                              | PARTIAL; payment action intentionally unavailable pending Stripe **[P1, STRIPE]** |
| `/profile`                     | Client/business/contact/access data | Edit allowed fields, sensitive change request, authorized-user request | PARTIAL; no client-initiated password-reset/change-password UI **[P1, AUTH]**     |

All Client Portal ownership resolution uses the authenticated session/access grant rather than a frontend client ID. File storage validates type/size/content and stores outside public paths.

## 7. API route inventory

All URLs are dispatched as `/alchemize-api.php?route=<path>`; conceptual `/api/v1/**` paths below identify endpoint families. Admin mutations require staff/Admin plus CSRF unless noted. Portal mutations share a centralized authenticated-client/CSRF gate.

| Method/path patterns                                                                                                                               | Auth/CSRF                                        | Service/repository and tables                                                                    | Frontend/status                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `GET auth/session`; `POST auth/login,set-password,logout`                                                                                          | Public/session; login/set-password no CSRF       | auth/account services; users, roles, tokens, grants                                              | WORKING; no forgot-password request                                  |
| `POST leads`; `GET leads,leads/:id`; `PUT leads/:id`; `POST leads/:id/{convert,contact-attempts,notes,interests}`                                  | Create public; Admin reads; Admin mutations CSRF | lead services; leads, interests, attempts, notes, activity                                       | WORKING; some secondary routes have no caller                        |
| `GET/POST clients`; `GET clients/team`; `GET clients/:id`; `GET clients/:id/portal-account`; `POST clients/:id/{portal-invitation,password-reset}` | staff/read-only/Admin; mutations CSRF            | client/account repositories; clients/users/grants/tokens                                         | WORKING except missing client PUT                                    |
| `GET/POST services`; `GET services/:id`                                                                                                            | staff/read-only; POST CSRF                       | services                                                                                         | WORKING; frontend PUT missing backend                                |
| `GET/POST engagements`; `GET/PUT engagements/:id`                                                                                                  | staff/read-only; mutations CSRF                  | engagements/services/clients/activity                                                            | WORKING                                                              |
| `GET/POST tasks`; `PUT tasks/:id`                                                                                                                  | staff/read-only; mutations CSRF                  | tasks/activity                                                                                   | WORKING; declared frontend GET detail absent                         |
| `GET/POST documents`                                                                                                                               | staff/read-only; POST CSRF                       | documents metadata                                                                               | PARTIAL; no Admin detail/update/file attach                          |
| `GET/POST appointments`                                                                                                                            | staff/read-only; POST CSRF                       | appointments                                                                                     | PARTIAL; no Admin detail/update/cancel API                           |
| `GET/POST invoices`; `GET/POST payments`                                                                                                           | staff/read-only; mutations CSRF                  | invoices/line items/payments                                                                     | PARTIAL; missing detail/update and Stripe creation                   |
| `GET notes/{type}/{id}`; `POST notes`                                                                                                              | staff/read-only; POST CSRF                       | notes                                                                                            | WORKING; narrow callers                                              |
| `GET portal/{9 resources}` plus scoped detail/download                                                                                             | authenticated client                             | portal repositories across engagements/intakes/tasks/docs/messages/appointments/invoices/profile | WORKING                                                              |
| Portal task/document/intake/message/appointment/profile/onboarding/authorized-user/acknowledgement mutations                                       | authenticated client + CSRF                      | action/intake/storage services and activity/audit tables                                         | WORKING/PARTIAL as section 6                                         |
| `GET portal-admin/{attention,messages,intakes,...}` and document downloads/versions                                                                | staff/Admin                                      | portal-admin/intake repositories                                                                 | WORKING                                                              |
| `POST/PUT portal-admin/{resolve,messages,intakes,...}`                                                                                             | staff/Admin + CSRF                               | portal-admin/intake/notification services                                                        | WORKING                                                              |
| `POST webhooks/stripe`                                                                                                                             | Stripe signature, no session/CSRF                | webhook service/repository; stripe events                                                        | WORKING signature/idempotency; business-state consumption incomplete |

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

| Integration     | Ready                                                            | Gap                                                                                                                                                                                |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe          | Config, signature verification, idempotent event storage         | No customer/checkout/payment-link API; supported webhook events are recorded but do not reconcile invoices/payments **[P1, STRIPE]**                                               |
| Google Drive    | SDK/config/factory and root verification boundary                | No client folder-ID column, no documents adapter wiring, no persisted provider file IDs **[P1, GOOGLE_DRIVE/DATABASE]**                                                            |
| Google Calendar | SDK/config/service boundary                                      | No appointment event-ID column; create/update/cancel business methods are not wired **[P1, GOOGLE_CALENDAR/DATABASE]**                                                             |
| SES             | PHPMailer SES provider behind deduplicated notification boundary | Portal invitation/reset service still logs development URLs and rejects production; no lead/template-specific delivery; notification emails are generic escaped text **[P1, SES]** |

## 9. Broken routes

Seven confirmed frontend/backend contract failures exist. They are action routes rather than blank React pages.

| Frontend caller           | Missing backend handler                                                | Effect                                                 | Priority            |
| ------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ | ------------------- |
| `clients.update`          | `PUT clients/:id`                                                      | Admin client edits cannot persist                      | P1 FRONTEND/BACKEND |
| `services.update`         | `PUT services/:id`                                                     | Service edits cannot persist                           | P1 FRONTEND/BACKEND |
| `tasks.get`               | `GET tasks/:id`                                                        | Declared detail caller returns 404                     | P2 FRONTEND/BACKEND |
| `appointments.get/update` | `GET/PUT appointments/:id`                                             | Detail/edit/cancel/reschedule cannot persist           | P1 FRONTEND/BACKEND |
| `documents.get/update`    | `GET/PUT documents/:id`                                                | Admin detail/status edit cannot persist                | P1 FRONTEND/BACKEND |
| `invoices.get/update`     | `GET/PUT invoices/:id`                                                 | Invoice detail refresh/edit cannot persist through API | P1 FRONTEND/BACKEND |
| Route catalog             | `/admin/messages` catalogued while router uses `/admin/communications` | Tooling validates a stale path                         | P2 FRONTEND         |

## 10. Missing routes

- Public/Client forgot-password request UI and API. **P1 AUTH**
- Client change-password/security route. **P1 AUTH**
- Stripe checkout/payment-link/session route. **P1 STRIPE**
- Google-backed document and appointment synchronization routes/actions. **P1 GOOGLE_DRIVE/GOOGLE_CALENDAR**
- Explicit Admin service-request review route/queue. **P2 BACKEND/FRONTEND**
- CMS/settings/report persistence endpoints. **P2 BACKEND/DATABASE**
- Dedicated public scheduling route is not present; contact is the current intended fallback. **P2 UX/GOOGLE_CALENDAR**

## 11. Missing backend functions

- The six Admin resource detail/update handlers listed in section 9.
- Lead throttling/idempotency; SES lead notification; SES portal-token delivery.
- Stripe customer/payment-session creation and webhook reconciliation.
- Google Drive folder/file lifecycle and Calendar event lifecycle methods wired to domain services.
- Persisted CMS, settings, and reporting services.
- Session revalidation against current user/grant status.

## 12. Missing frontend functions

- Forgot/change password entry points for clients.
- Persistent Admin client/service/appointment/document/invoice edits where controls currently use local state.
- Complete authorized-user approval/scope management.
- Stripe payment action/receipt workflow.
- Admin attach-document action and explicit service-request review queue.
- Authenticated Admin mobile action coverage and mobile contact submission coverage.

## 13. Placeholder/demo functionality

- Content Management is intentionally disabled and backed by static configuration rows.
- Workflow/Document/Alert/Service/Lead settings panels are disabled; Team Access alone loads real users.
- Reports calculate from the current `adminStore`, not a reporting endpoint.
- `staffOptions` contains demo names (`Jordan Martin`, `Taylor Nguyen`, and others) outside Team Access.
- Archive/internal-note and portions of billing/service/task/document/appointment UI mutate `adminStore` only and disappear on reload.

## 14. Database/schema gaps

| Gap                                                                       | Required for                                 | Priority/dependency         |
| ------------------------------------------------------------------------- | -------------------------------------------- | --------------------------- |
| `clients.google_drive_folder_id` (stable provider ID)                     | Client folder provisioning                   | P1 DATABASE/GOOGLE_DRIVE    |
| Provider file ID/version mapping on documents/submissions                 | Drive upload/download/replace                | P1 DATABASE/GOOGLE_DRIVE    |
| `appointments.google_calendar_event_id` plus sync status/error timestamps | Calendar create/update/cancel reconciliation | P1 DATABASE/GOOGLE_CALENDAR |
| Stripe customer ID on client and provider invoice/payment/session IDs     | Checkout and webhook reconciliation          | P1 DATABASE/STRIPE          |
| Email outbox/delivery attempts/template key                               | Reliable SES retries and observability       | P2 DATABASE/SES             |
| CMS pages/resources/notices/SEO tables                                    | Content mutations                            | P2 DATABASE                 |
| Namespaced persisted settings/audit history                               | Editable settings                            | P2 DATABASE                 |

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

- Public lead POST lacks rate limiting/replay control. **P1 BACKEND**
- Existing authenticated sessions trust the session snapshot and do not re-check disabled user/grant state. **P1 AUTH**
- Logout is a state-changing POST without server-side CSRF enforcement. **P2 AUTH**
- Portal token architecture is sound (hashed, expiring, one-use), but production delivery is unwired. **P1 SES/AUTH**
- Portal object access is session-derived and cross-client checks are covered by security tests. **WORKING**
- File validation/storage and Stripe signature verification are implemented with safe response boundaries. **WORKING**

### Consolidated priority register

| Severity | Dependency               | Issue                                                                                      |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| P1       | BACKEND/SECURITY         | Public lead creation has no rate limiting/replay control                                   |
| P1       | AUTH                     | Forgot-password request flow is absent; sessions do not revalidate disabled accounts       |
| P1       | SES/AUTH                 | Invitation/reset delivery is not connected to SES                                          |
| P1       | FRONTEND/BACKEND         | Client update route contract is broken                                                     |
| P1       | FRONTEND/BACKEND         | Service update route contract is broken                                                    |
| P1       | FRONTEND/BACKEND         | Appointment detail/edit/cancel route contracts are missing                                 |
| P1       | FRONTEND/BACKEND         | Document detail/update/Admin attach workflow is incomplete                                 |
| P1       | FRONTEND/BACKEND/STRIPE  | Invoice detail/update/payment action is incomplete                                         |
| P1       | FRONTEND                 | Admin hydration and several mutations still depend on in-memory store data                 |
| P1       | FRONTEND                 | Production UI still contains fabricated staff selector names                               |
| P1       | GOOGLE_DRIVE/DATABASE    | Client folder and provider-file IDs are not persisted/wired                                |
| P1       | GOOGLE_CALENDAR/DATABASE | Appointment event IDs and synchronization are absent                                       |
| P2       | FRONTEND/HOSTINGER       | Route discovery/check catalogs are incomplete/stale                                        |
| P2       | AUTH                     | Logout lacks server CSRF enforcement; authorized-user approval scope is incomplete         |
| P2       | FRONTEND                 | Task detail caller absent in backend; supporting-file task linkage incomplete              |
| P2       | BACKEND                  | Service-request Admin review is indirect rather than an explicit queue                     |
| P2       | FRONTEND/BACKEND         | Content is deliberately disabled; no CMS persistence                                       |
| P2       | FRONTEND/BACKEND         | Reports are local calculations without report endpoints                                    |
| P2       | DATABASE/BACKEND         | Editable settings lack a persisted settings model and remain disabled                      |
| P2       | SES                      | Lead and domain-specific email templates/events are unwired                                |
| P2       | STRIPE                   | Webhook events do not update operational invoice/payment state                             |
| P2       | UX                       | Admin mobile behavior has CSS safeguards but no authenticated mobile route/action coverage |
| P3       | UX                       | No browser-level mobile contact submission test                                            |
| P3       | FRONTEND                 | Legacy routes are implemented inline and omitted from route tooling                        |
| P3       | UX                       | Large production JS bundle warning remains                                                 |

Mobile source review confirms the Admin return link moves into the drawer below 1023px, table wrappers use contained horizontal scrolling, and Client Portal navigation has a mobile E2E test. Authenticated Admin mobile controls/modals and contact submission remain unverified at browser level.

## 17. Recommended remediation order

1. Add public lead throttling and session-status revalidation.
2. Reconcile Admin API contracts: clients, services, appointments, documents, invoices; remove fake staff options and eliminate local-only mutations.
3. Connect portal invitation/reset and lead notifications to SES with templates and delivery/outbox state.
4. Add client-initiated password reset/change-password flows.
5. Add Google folder/file and Calendar event identifiers via forward migrations, then wire adapters.
6. Implement Stripe checkout/payment-link creation and webhook-to-invoice reconciliation.
7. Decide whether CMS/settings/report persistence is in scope; retain explicit disabled states until then.
8. Replace the split route catalogs with router-derived discovery and add Admin/mobile/contact E2E coverage.
