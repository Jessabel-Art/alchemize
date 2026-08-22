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
