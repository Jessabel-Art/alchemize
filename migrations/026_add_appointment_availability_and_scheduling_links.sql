SET @dbname = DATABASE();
SET @stmt = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = 'appointments'
          AND COLUMN_NAME = 'meeting_method'
    ) = 0,
    'ALTER TABLE appointments ADD COLUMN meeting_method VARCHAR(50) NULL AFTER location_type',
    'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = 'appointments'
          AND COLUMN_NAME = 'meeting_url'
    ) = 0,
    'ALTER TABLE appointments ADD COLUMN meeting_url VARCHAR(255) NULL AFTER meeting_method',
    'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = 'appointments'
          AND COLUMN_NAME = 'location'
    ) = 0,
    'ALTER TABLE appointments ADD COLUMN location VARCHAR(255) NULL AFTER meeting_url',
    'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = 'appointments'
          AND COLUMN_NAME = 'duration_minutes'
    ) = 0,
    'ALTER TABLE appointments ADD COLUMN duration_minutes INT UNSIGNED NOT NULL DEFAULT 60 AFTER location',
    'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = 'appointments'
          AND COLUMN_NAME = 'source'
    ) = 0,
    'ALTER TABLE appointments ADD COLUMN source VARCHAR(80) NULL AFTER owner_user_id',
    'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = 'appointments'
          AND COLUMN_NAME = 'scheduling_token'
    ) = 0,
    'ALTER TABLE appointments ADD COLUMN scheduling_token VARCHAR(255) NULL AFTER source',
    'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = 'appointments'
          AND COLUMN_NAME = 'scheduling_context'
    ) = 0,
    'ALTER TABLE appointments ADD COLUMN scheduling_context JSON NULL AFTER scheduling_token',
    'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS appointment_availability (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    weekday TINYINT NULL,
    date_override DATE NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    kind ENUM('weekday','date_override','blocked','partial_day') NOT NULL DEFAULT 'weekday',
    notes TEXT NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_appointment_availability_public_id (public_id),
    KEY idx_appointment_availability_weekday (weekday),
    KEY idx_appointment_availability_date_override (date_override),
    CONSTRAINT fk_appointment_availability_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_appointment_availability_creator
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointment_scheduling_links (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NULL,
    lead_id BIGINT UNSIGNED NULL,
    appointment_type VARCHAR(80) NOT NULL,
    meeting_method VARCHAR(50) NOT NULL DEFAULT 'phone',
    expires_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    recipient_name VARCHAR(255) NULL,
    recipient_email VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_appointment_link_public_id (public_id),
    UNIQUE KEY uq_appointment_link_token_hash (token_hash),
    KEY idx_appointment_links_client_id (client_id),
    KEY idx_appointment_links_lead_id (lead_id),
    KEY idx_appointment_links_expires_at (expires_at),
    CONSTRAINT fk_appointment_scheduling_link_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_appointment_scheduling_link_lead
        FOREIGN KEY (lead_id) REFERENCES leads (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_appointment_scheduling_link_user
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
