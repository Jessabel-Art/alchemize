CREATE TABLE activity_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    actor_type VARCHAR(40) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    lead_id BIGINT UNSIGNED NOT NULL,
    summary VARCHAR(500) NOT NULL,
    visibility ENUM('admin', 'client', 'both') NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_activity_events_public_id (public_id),
    KEY idx_activity_events_entity (entity_type, entity_id, created_at),
    KEY idx_activity_events_lead_id (lead_id),
    CONSTRAINT fk_activity_events_lead
        FOREIGN KEY (lead_id) REFERENCES leads (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
