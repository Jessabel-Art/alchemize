# Authentication and Role Architecture

> Architecture note: [system-specification.md](system-specification.md) and [permissions-matrix.md](permissions-matrix.md) are authoritative for the pre-backend identity, relationship-grant, role, and permission model.

This document describes the intended future architecture for Alchemize client and administrative access. It does not implement access control in the current static website.

## Core principle

Production authorization must be enforced server-side. Static HTML, CSS, and JavaScript can provide interface shells and navigation patterns, but they cannot be trusted to secure private data.

## Intended future roles

### Client

A client is a person or business relationship associated with one or more service engagements. The client experience should provide access to:

- dashboard and relationship status
- active and past service engagements
- tasks and preparation requirements
- appointment information
- documents and checklist progress
- payment status and billing history
- profile/contact information

### Staff

Staff users may manage service work, review client submissions, coordinate tasks, and assist with administrative workflows. Staff permissions should be narrow and role-specific.

### Administrator / Owner

This role is responsible for:

- client records
- service engagement management
- task assignment and progress review
- document workflow review
- internal notes and operational settings
- billing and payment oversight
- operational content management

## Required future safeguards

- secure session creation on the backend
- server-side authorization checks for each protected route and API
- least-privilege access by role
- session expiration and logout flow
- SameSite, HttpOnly, and secure cookie settings for any cookie-based sessions
- MFA requirements for privileged administrative accounts
- audit logging for sensitive changes

## Static-site boundary

The current site uses public, static HTML. The client portal and admin routes are intentionally presented as interface shells only. They should not imply that login or account management is already active.

## Next-step implementation note

A future backend should own authentication, session state, authorization, and private document access decisions. The frontend should only display the resulting state and route users appropriately.
