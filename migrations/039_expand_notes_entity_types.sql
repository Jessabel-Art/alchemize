-- The Client Requests "Notes" action needs to attach internal/admin-only
-- notes to a document request, task, or intake-form submission, but
-- notes.entity_type only ever allowed ('lead','client','engagement') --
-- the existing, already-working notes architecture (server/repositories/
-- note-repository.php, api/v1/notes/index.php) just never had these three
-- entity types opened up. MODIFY COLUMN on an ENUM is safe to re-run with
-- the same target definition, matching the pattern already used by
-- migrations/018_expand_client_type_for_intake.sql.
ALTER TABLE notes
    MODIFY COLUMN entity_type ENUM('lead','client','engagement','document','task','intake') NOT NULL;
