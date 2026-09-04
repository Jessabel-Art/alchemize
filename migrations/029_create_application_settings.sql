CREATE TABLE application_settings (
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON NOT NULL,
    updated_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (setting_key),
    CONSTRAINT fk_application_settings_updated_by
        FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO application_settings (setting_key, setting_value) VALUES
('business_name', JSON_QUOTE('Alchemize Business Services')),
('business_email', JSON_QUOTE('')),
('timezone', JSON_QUOTE('America/New_York')),
('appointment_default_duration', '60'),
('portal_message_email_notifications', 'true');
