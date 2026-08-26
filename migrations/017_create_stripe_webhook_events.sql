CREATE TABLE stripe_webhook_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    stripe_event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    event_status ENUM('received','processed','ignored','duplicate','failed') NOT NULL DEFAULT 'received',
    payload JSON NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    processed_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_stripe_webhook_events_event_id (stripe_event_id),
    KEY idx_stripe_webhook_events_event_type (event_type),
    KEY idx_stripe_webhook_events_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
