ALTER TABLE activity_events
    ADD COLUMN actor_user_id BIGINT UNSIGNED NULL AFTER actor_type,
    ADD KEY idx_activity_events_actor_user_id (actor_user_id),
    ADD CONSTRAINT fk_activity_events_actor_user
        FOREIGN KEY (actor_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE TABLE task_client_actions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    task_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    actor_user_id BIGINT UNSIGNED NOT NULL,
    action_type ENUM('acknowledged','responded','completed') NOT NULL,
    response_text TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reviewed_at TIMESTAMP(6) NULL DEFAULT NULL,
    reviewed_by_user_id BIGINT UNSIGNED NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_task_client_actions_public_id (public_id),
    KEY idx_task_client_actions_task (task_id, created_at),
    KEY idx_task_client_actions_client (client_id, created_at),
    CONSTRAINT fk_task_client_actions_task FOREIGN KEY (task_id) REFERENCES tasks (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_task_client_actions_client FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_task_client_actions_actor FOREIGN KEY (actor_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_task_client_actions_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_submissions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    document_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    submitted_by_user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('received','under_review','accepted','replacement_requested') NOT NULL DEFAULT 'received',
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(20) NOT NULL,
    file_size_bytes BIGINT UNSIGNED NOT NULL,
    sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_comment TEXT NULL,
    submitted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reviewed_at TIMESTAMP(6) NULL DEFAULT NULL,
    reviewed_by_user_id BIGINT UNSIGNED NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_document_submissions_public_id (public_id),
    UNIQUE KEY uq_document_submissions_storage_key (storage_key),
    KEY idx_document_submissions_document (document_id, submitted_at),
    KEY idx_document_submissions_client_status (client_id, status, submitted_at),
    CONSTRAINT fk_document_submissions_document FOREIGN KEY (document_id) REFERENCES documents_metadata (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_document_submissions_client FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_document_submissions_submitter FOREIGN KEY (submitted_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_document_submissions_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE message_threads (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    subject VARCHAR(180) NOT NULL,
    related_entity_type ENUM('engagement','task','document','appointment','invoice') NULL,
    related_entity_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL,
    status ENUM('open','action_needed','archived') NOT NULL DEFAULT 'open',
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    last_message_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_message_threads_public_id (public_id),
    KEY idx_message_threads_client_status (client_id, status, last_message_at),
    CONSTRAINT fk_message_threads_client FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_message_threads_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    thread_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    sender_user_id BIGINT UNSIGNED NOT NULL,
    sender_type ENUM('client','staff') NOT NULL,
    message_body TEXT NOT NULL,
    read_by_client_at TIMESTAMP(6) NULL DEFAULT NULL,
    read_by_admin_at TIMESTAMP(6) NULL DEFAULT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_messages_public_id (public_id),
    KEY idx_messages_thread_created (thread_id, created_at),
    KEY idx_messages_client_read (client_id, sender_type, read_by_client_at, read_by_admin_at),
    CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id) REFERENCES message_threads (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_messages_client FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointment_change_requests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    appointment_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    requested_by_user_id BIGINT UNSIGNED NOT NULL,
    request_type ENUM('reschedule','cancellation') NOT NULL,
    requested_at_value DATETIME(6) NULL,
    reason TEXT NULL,
    status ENUM('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
    resolved_by_user_id BIGINT UNSIGNED NULL,
    resolution_note TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    resolved_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_appointment_change_requests_public_id (public_id),
    KEY idx_appointment_change_requests_appointment (appointment_id, status),
    KEY idx_appointment_change_requests_client (client_id, status, created_at),
    CONSTRAINT fk_appointment_change_requests_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_appointment_change_requests_client FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_appointment_change_requests_requester FOREIGN KEY (requested_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_change_requests_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profile_change_requests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    requested_by_user_id BIGINT UNSIGNED NOT NULL,
    field_name ENUM('legal_name','business_legal_name','dba_name','entity_type','formation_state','formation_date') NOT NULL,
    old_value TEXT NULL,
    proposed_value TEXT NULL,
    status ENUM('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
    resolved_by_user_id BIGINT UNSIGNED NULL,
    resolution_note TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    resolved_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_profile_change_requests_public_id (public_id),
    KEY idx_profile_change_requests_client (client_id, status, created_at),
    CONSTRAINT fk_profile_change_requests_client FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_profile_change_requests_requester FOREIGN KEY (requested_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_profile_change_requests_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE record_acknowledgements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    entity_type ENUM('task','document','appointment','engagement','invoice') NOT NULL,
    entity_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    acknowledged_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_record_acknowledgements_public_id (public_id),
    UNIQUE KEY uq_record_acknowledgements_actor_entity (user_id, entity_type, entity_id),
    KEY idx_record_acknowledgements_client (client_id, entity_type, acknowledged_at),
    CONSTRAINT fk_record_acknowledgements_client FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_record_acknowledgements_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
