ALTER TABLE clients
    ADD COLUMN language_preference ENUM('en','es') NOT NULL DEFAULT 'en' AFTER preferred_contact_method,
    ADD COLUMN portal_onboarding_dismissed_at TIMESTAMP(6) NULL DEFAULT NULL AFTER portal_status;

ALTER TABLE message_threads
    ADD COLUMN client_action_required TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
    ADD COLUMN client_action_required_at TIMESTAMP(6) NULL DEFAULT NULL AFTER client_action_required,
    ADD KEY idx_message_threads_client_attention (client_id, client_action_required, status, last_message_at);

ALTER TABLE document_submissions
    ADD COLUMN client_visible_review_note TEXT NULL AFTER client_comment;

CREATE TABLE authorized_user_requests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    requested_by_user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(180) NOT NULL,
    email VARCHAR(254) NOT NULL,
    requested_access_role ENUM('primary_contact','authorized_user','billing_contact','document_contact','read_only') NOT NULL,
    status ENUM('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
    resolution_note TEXT NULL,
    resolved_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    resolved_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_authorized_user_requests_public_id (public_id),
    KEY idx_authorized_user_requests_client_status (client_id, status, created_at),
    KEY idx_authorized_user_requests_email_status (email, status),
    CONSTRAINT fk_authorized_user_requests_client FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_authorized_user_requests_requester FOREIGN KEY (requested_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_authorized_user_requests_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
