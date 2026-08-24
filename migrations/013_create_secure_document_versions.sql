ALTER TABLE documents_metadata
    ADD COLUMN due_date DATE NULL AFTER requested_date,
    ADD COLUMN client_instructions TEXT NULL AFTER due_date;

ALTER TABLE document_submissions
    ADD COLUMN version_number INT UNSIGNED NULL AFTER client_id,
    ADD COLUMN internal_review_notes TEXT NULL AFTER client_visible_review_note,
    ADD COLUMN archived_at TIMESTAMP(6) NULL DEFAULT NULL AFTER reviewed_at;

UPDATE document_submissions ds
INNER JOIN (
    SELECT current_row.id, COUNT(previous_row.id) AS version_number
    FROM document_submissions current_row
    INNER JOIN document_submissions previous_row
        ON previous_row.document_id = current_row.document_id
       AND previous_row.id <= current_row.id
    GROUP BY current_row.id
) numbered ON numbered.id = ds.id
SET ds.version_number = numbered.version_number;

ALTER TABLE document_submissions
    MODIFY COLUMN version_number INT UNSIGNED NOT NULL,
    ADD UNIQUE KEY uq_document_submissions_document_version (document_id, version_number),
    ADD KEY idx_document_submissions_client_archive (client_id, archived_at, submitted_at);
