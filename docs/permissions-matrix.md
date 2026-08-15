# Alchemize Permissions Matrix

Legend: `R` read, `C` create, `U` update, `A` archive, `M` manage/administrate, `Own` only explicitly authorized Client/Business relationships, `Assigned` only assigned operational records, `TBD` owner decision. All grants are server-enforced and further constrained by record relationship and sensitivity.

| Resource              | Owner / Super Admin | Administrator     | Staff                                   | Client                            | Business Authorized User                   |
| --------------------- | ------------------- | ----------------- | --------------------------------------- | --------------------------------- | ------------------------------------------ |
| Clients               | RCUAM               | RCUA              | R/U Assigned                            | R/U Own profile fields            | R/U Own business profile fields            |
| Engagements           | RCUAM               | RCUA              | RCU Assigned                            | R Own; limited client actions     | R Own business; limited actions            |
| Tasks                 | RCUAM               | RCUA              | RCU Assigned                            | R/U Own client-facing tasks       | R/U Own business client-facing tasks       |
| Documents             | RCUAM               | RCUA              | R/C/U/review Assigned by classification | R/C Own authorized requests/files | R/C Own business authorized requests/files |
| Appointments          | RCUAM               | RCUA              | RCU Assigned                            | R/C/U Own within policy           | R/C/U Own business within policy           |
| Messages              | RCUAM               | RCUA              | R/C Assigned conversations              | R/C Own conversations             | R/C Own business conversations             |
| Billing               | RCUAM               | RCUA or TBD       | R Assigned; amount access TBD           | R Own, initiate provider payment  | R Own business, payment authority TBD      |
| Internal Notes        | RCUAM               | RCUA              | R/C/U Assigned; archive TBD             | None                              | None                                       |
| Users / access grants | RCUAM               | RCU within policy | Self only                               | Self only                         | Self; invite/manage business users TBD     |
| Settings              | RCUAM               | R/U limited       | None/TBD                                | Self preferences only             | Self preferences only                      |
| Content               | RCUAM               | RCUA              | R/C/U if `content.manage`               | Public only                       | Public only                                |

## Initial permission keys

- `clients.read`, `clients.write`, `clients.archive`
- `businesses.read`, `businesses.write`, `businesses.authorize_users`
- `engagements.read`, `engagements.write`, `engagements.transition`
- `tasks.read`, `tasks.write`, `tasks.assign`, `tasks.complete`
- `documents.read`, `documents.upload`, `documents.request`, `documents.review`, `documents.share`, `documents.archive`
- `appointments.read`, `appointments.manage`
- `messages.read`, `messages.send`, `conversations.manage`
- `billing.read`, `billing.manage`, `payments.initiate`, `refunds.manage`
- `notes.read`, `notes.write`, `notes.archive`
- `users.manage`, `roles.manage`, `settings.manage`, `content.manage`, `audit.read`

## Authorization rules

1. Frontend menus and routes never grant access.
2. Client/Business users require an active AccessGrant to the target relationship.
3. Staff access can be narrowed by assignment, team, service, classification, or location later.
4. Highly Sensitive documents require explicit document permission and relationship; views/downloads are audited.
5. Internal Notes are excluded from client serializers/endpoints by design, not hidden with CSS.
6. Owner decisions remain: administrator billing/refunds, staff document scope, business-user delegation, and exact staff roles.
