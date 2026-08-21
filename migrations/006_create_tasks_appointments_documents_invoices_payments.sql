CREATE TABLE tasks (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NULL,
    engagement_id BIGINT UNSIGNED NULL,
    service_id BIGINT UNSIGNED NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    owner_user_id BIGINT UNSIGNED NULL,
    priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    due_date DATE NULL,
    status ENUM('not_started','in_progress','waiting_on_client','waiting_on_alchemize','completed','archived') NOT NULL DEFAULT 'not_started',
    dependency_task_id BIGINT UNSIGNED NULL,
    internal_notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    completed_at TIMESTAMP(6) NULL DEFAULT NULL,
    archived_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tasks_public_id (public_id),
    KEY idx_tasks_client_id (client_id),
    KEY idx_tasks_engagement_id (engagement_id),
    KEY idx_tasks_owner_user_id (owner_user_id),
    KEY idx_tasks_due_date (due_date),
    CONSTRAINT fk_tasks_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_tasks_engagement
        FOREIGN KEY (engagement_id) REFERENCES engagements (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_tasks_service
        FOREIGN KEY (service_id) REFERENCES services (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_tasks_owner
        FOREIGN KEY (owner_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_tasks_dependency
        FOREIGN KEY (dependency_task_id) REFERENCES tasks (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NULL,
    lead_id BIGINT UNSIGNED NULL,
    engagement_id BIGINT UNSIGNED NULL,
    appointment_type VARCHAR(80) NOT NULL,
    service_id BIGINT UNSIGNED NULL,
    scheduled_at DATETIME(6) NOT NULL,
    end_at DATETIME(6) NULL,
    timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
    location_type VARCHAR(50) NULL,
    status ENUM('requested','scheduled','confirmed','completed','cancelled') NOT NULL DEFAULT 'requested',
    preparation_required TINYINT(1) NOT NULL DEFAULT 0,
    follow_up_required TINYINT(1) NOT NULL DEFAULT 0,
    internal_notes TEXT NULL,
    owner_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    cancelled_at TIMESTAMP(6) NULL DEFAULT NULL,
    completed_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_appointments_public_id (public_id),
    KEY idx_appointments_client_id (client_id),
    KEY idx_appointments_lead_id (lead_id),
    KEY idx_appointments_engagement_id (engagement_id),
    KEY idx_appointments_status (status),
    KEY idx_appointments_scheduled_at (scheduled_at),
    CONSTRAINT fk_appointments_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_appointments_lead
        FOREIGN KEY (lead_id) REFERENCES leads (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_appointments_engagement
        FOREIGN KEY (engagement_id) REFERENCES engagements (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_appointments_service
        FOREIGN KEY (service_id) REFERENCES services (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_appointments_owner
        FOREIGN KEY (owner_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE documents_metadata (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    engagement_id BIGINT UNSIGNED NULL,
    service_id BIGINT UNSIGNED NULL,
    document_name VARCHAR(180) NOT NULL,
    document_type VARCHAR(80) NULL,
    status ENUM('requested','awaiting_upload','received','under_review','accepted','replacement_requested','archived') NOT NULL DEFAULT 'requested',
    visibility ENUM('internal','client','shared') NOT NULL DEFAULT 'internal',
    requested_date DATE NULL,
    received_date DATE NULL,
    reviewed_date DATE NULL,
    owner_user_id BIGINT UNSIGNED NULL,
    internal_notes TEXT NULL,
    storage_key VARCHAR(255) NULL,
    mime_type VARCHAR(80) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    archived_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_documents_public_id (public_id),
    KEY idx_documents_client_id (client_id),
    KEY idx_documents_engagement_id (engagement_id),
    KEY idx_documents_service_id (service_id),
    CONSTRAINT fk_documents_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_documents_engagement
        FOREIGN KEY (engagement_id) REFERENCES engagements (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_documents_service
        FOREIGN KEY (service_id) REFERENCES services (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_documents_owner
        FOREIGN KEY (owner_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    invoice_number VARCHAR(80) NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    engagement_id BIGINT UNSIGNED NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NULL,
    status ENUM('draft','open','partially_paid','paid','past_due','cancelled','voided') NOT NULL DEFAULT 'draft',
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    adjustment_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    credit_deposit_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    client_facing_notes TEXT NULL,
    internal_notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    issued_at TIMESTAMP(6) NULL DEFAULT NULL,
    paid_at TIMESTAMP(6) NULL DEFAULT NULL,
    voided_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoices_public_id (public_id),
    UNIQUE KEY uq_invoices_number (invoice_number),
    KEY idx_invoices_client_id (client_id),
    KEY idx_invoices_engagement_id (engagement_id),
    KEY idx_invoices_status (status),
    CONSTRAINT fk_invoices_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_engagement
        FOREIGN KEY (engagement_id) REFERENCES engagements (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoice_line_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    invoice_id BIGINT UNSIGNED NOT NULL,
    engagement_service_item_id BIGINT UNSIGNED NULL,
    service_id BIGINT UNSIGNED NULL,
    service_code_snapshot VARCHAR(80) NULL,
    description_snapshot TEXT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    billing_type_snapshot VARCHAR(50) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoice_line_items_public_id (public_id),
    KEY idx_invoice_line_items_invoice_id (invoice_id),
    KEY idx_invoice_line_items_service_id (service_id),
    CONSTRAINT fk_invoice_line_items_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_invoice_line_items_engagement_service_item
        FOREIGN KEY (engagement_service_item_id) REFERENCES engagement_service_items (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_invoice_line_items_service
        FOREIGN KEY (service_id) REFERENCES services (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    invoice_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(80) NOT NULL DEFAULT 'manual',
    external_reference VARCHAR(120) NULL,
    internal_note TEXT NULL,
    recorded_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_public_id (public_id),
    KEY idx_payments_invoice_id (invoice_id),
    KEY idx_payments_client_id (client_id),
    CONSTRAINT fk_payments_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_payments_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_payments_user
        FOREIGN KEY (recorded_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    entity_type ENUM('lead','client','engagement') NOT NULL,
    entity_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NULL,
    note_category VARCHAR(80) NULL,
    note_body TEXT NOT NULL,
    author_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_notes_public_id (public_id),
    KEY idx_notes_entity (entity_type, entity_id),
    KEY idx_notes_client_id (client_id),
    CONSTRAINT fk_notes_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_notes_author
        FOREIGN KEY (author_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    actor_type VARCHAR(40) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    lead_id BIGINT UNSIGNED NULL,
    client_id BIGINT UNSIGNED NULL,
    engagement_id BIGINT UNSIGNED NULL,
    summary VARCHAR(500) NOT NULL,
    visibility ENUM('admin','client','both') NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_activity_events_public_id (public_id),
    KEY idx_activity_events_entity (entity_type, entity_id, created_at),
    KEY idx_activity_events_lead_id (lead_id),
    KEY idx_activity_events_client_id (client_id),
    KEY idx_activity_events_engagement_id (engagement_id),
    CONSTRAINT fk_activity_events_lead
        FOREIGN KEY (lead_id) REFERENCES leads (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_activity_events_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_activity_events_engagement
        FOREIGN KEY (engagement_id) REFERENCES engagements (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    actor_user_id BIGINT UNSIGNED NULL,
    event_type VARCHAR(120) NOT NULL,
    entity_type VARCHAR(60) NULL,
    entity_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL,
    action_summary VARCHAR(500) NOT NULL,
    request_metadata JSON NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_audit_events_public_id (public_id),
    KEY idx_audit_events_actor_user_id (actor_user_id),
    KEY idx_audit_events_event_type (event_type),
    CONSTRAINT fk_audit_events_actor
        FOREIGN KEY (actor_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
