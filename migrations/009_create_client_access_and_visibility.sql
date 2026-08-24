CREATE TABLE client_access_grants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    access_role ENUM('primary_contact','authorized_user','billing_contact','document_contact','read_only') NOT NULL DEFAULT 'authorized_user',
    status ENUM('active','pending','revoked','expired') NOT NULL DEFAULT 'pending',
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    granted_by_user_id BIGINT UNSIGNED NULL,
    effective_at TIMESTAMP(6) NULL DEFAULT NULL,
    expires_at TIMESTAMP(6) NULL DEFAULT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_client_access_grants_public_id (public_id),
    UNIQUE KEY uq_client_access_grants_user_client (user_id, client_id),
    KEY idx_client_access_grants_user_status (user_id, status, is_default),
    KEY idx_client_access_grants_client_status (client_id, status),
    CONSTRAINT fk_client_access_grants_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_client_access_grants_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_client_access_grants_granted_by
        FOREIGN KEY (granted_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE tasks
    ADD COLUMN visibility ENUM('admin','client','both') NOT NULL DEFAULT 'admin' AFTER status,
    ADD KEY idx_tasks_client_visibility (client_id, visibility, status);

ALTER TABLE appointments
    ADD COLUMN visibility ENUM('admin','client','both') NOT NULL DEFAULT 'admin' AFTER status,
    ADD COLUMN client_instructions TEXT NULL AFTER visibility,
    ADD KEY idx_appointments_client_visibility (client_id, visibility, scheduled_at);

INSERT INTO roles (public_id, name, slug, description, is_system, is_active)
SELECT UUID(), 'Business Authorized User', 'business-authorized-user',
       'Authorized portal access to an associated business client record.', 1, 1
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE slug = 'business-authorized-user'
);
