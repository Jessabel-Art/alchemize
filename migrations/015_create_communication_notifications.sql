UPDATE message_threads SET status = 'waiting_on_client' WHERE status = 'action_needed';

ALTER TABLE message_threads
    MODIFY COLUMN status ENUM('open','waiting_on_client','waiting_on_alchemize','resolved','archived') NOT NULL DEFAULT 'open',
    ADD COLUMN service_id BIGINT UNSIGNED NULL AFTER subject,
    ADD COLUMN engagement_id BIGINT UNSIGNED NULL AFTER service_id,
    ADD COLUMN task_id BIGINT UNSIGNED NULL AFTER engagement_id,
    ADD COLUMN document_id BIGINT UNSIGNED NULL AFTER task_id,
    ADD COLUMN appointment_id BIGINT UNSIGNED NULL AFTER document_id,
    ADD COLUMN invoice_id BIGINT UNSIGNED NULL AFTER appointment_id,
    ADD COLUMN archived_at TIMESTAMP(6) NULL DEFAULT NULL AFTER updated_at,
    ADD KEY idx_message_threads_service (service_id),
    ADD KEY idx_message_threads_engagement (engagement_id),
    ADD KEY idx_message_threads_task (task_id),
    ADD KEY idx_message_threads_document (document_id),
    ADD KEY idx_message_threads_appointment (appointment_id),
    ADD KEY idx_message_threads_invoice (invoice_id),
    ADD CONSTRAINT fk_message_threads_service FOREIGN KEY (service_id) REFERENCES services (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    ADD CONSTRAINT fk_message_threads_engagement FOREIGN KEY (engagement_id) REFERENCES engagements (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    ADD CONSTRAINT fk_message_threads_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    ADD CONSTRAINT fk_message_threads_document FOREIGN KEY (document_id) REFERENCES documents_metadata (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    ADD CONSTRAINT fk_message_threads_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    ADD CONSTRAINT fk_message_threads_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE messages
    ADD COLUMN edited_at TIMESTAMP(6) NULL DEFAULT NULL AFTER created_at;

CREATE TABLE notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    recipient_user_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NULL,
    event_type VARCHAR(100) NOT NULL,
    related_entity_type VARCHAR(80) NULL,
    related_entity_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL,
    title VARCHAR(180) NOT NULL,
    message_body VARCHAR(500) NULL,
    language_preference ENUM('en','es') NOT NULL DEFAULT 'en',
    read_at TIMESTAMP(6) NULL DEFAULT NULL,
    dedupe_key VARCHAR(191) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_notifications_public_id (public_id),
    UNIQUE KEY uq_notifications_recipient_dedupe (recipient_user_id, dedupe_key),
    KEY idx_notifications_recipient_read (recipient_user_id, read_at, created_at),
    KEY idx_notifications_client_event (client_id, event_type, created_at),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_notifications_client FOREIGN KEY (client_id) REFERENCES clients (id) ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
