ALTER TABLE appointment_availability
    ADD COLUMN end_date DATE NULL AFTER date_override,
    ADD COLUMN timezone VARCHAR(80) NOT NULL DEFAULT 'America/New_York' AFTER end_time,
    MODIFY COLUMN start_time TIME NULL,
    MODIFY COLUMN end_time TIME NULL,
    MODIFY COLUMN kind ENUM('weekday','date_override','blocked','full_day','time_off') NOT NULL DEFAULT 'weekday',
    ADD KEY idx_appointment_availability_date_range (date_override, end_date, kind);

ALTER TABLE appointment_scheduling_links
    ADD COLUMN service_id BIGINT UNSIGNED NULL AFTER lead_id,
    ADD COLUMN duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60 AFTER meeting_method,
    ADD COLUMN timezone VARCHAR(80) NOT NULL DEFAULT 'America/New_York' AFTER duration_minutes,
    ADD COLUMN location VARCHAR(255) NULL AFTER timezone,
    ADD COLUMN recipient_phone VARCHAR(40) NULL AFTER recipient_email,
    ADD COLUMN max_uses SMALLINT UNSIGNED NOT NULL DEFAULT 1 AFTER expires_at,
    ADD COLUMN use_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER max_uses,
    ADD COLUMN revoked_at DATETIME(6) NULL AFTER used_at,
    ADD COLUMN delivery_status ENUM('pending','sent','failed','unavailable') NOT NULL DEFAULT 'pending' AFTER notes,
    ADD COLUMN delivery_attempted_at DATETIME(6) NULL AFTER delivery_status,
    ADD COLUMN delivery_error VARCHAR(120) NULL AFTER delivery_attempted_at,
    ADD CONSTRAINT fk_appointment_scheduling_link_service
        FOREIGN KEY (service_id) REFERENCES services (id)
        ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE appointments
    DROP COLUMN scheduling_token,
    ADD COLUMN scheduling_link_id BIGINT UNSIGNED NULL AFTER source,
    ADD CONSTRAINT fk_appointments_scheduling_link
        FOREIGN KEY (scheduling_link_id) REFERENCES appointment_scheduling_links (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    ADD KEY idx_appointments_scheduling_link_id (scheduling_link_id);
