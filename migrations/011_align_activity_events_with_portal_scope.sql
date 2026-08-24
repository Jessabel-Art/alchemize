ALTER TABLE activity_events
    DROP FOREIGN KEY fk_activity_events_lead,
    MODIFY COLUMN lead_id BIGINT UNSIGNED NULL,
    ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER lead_id,
    ADD COLUMN engagement_id BIGINT UNSIGNED NULL AFTER client_id,
    ADD KEY idx_activity_events_client_id (client_id),
    ADD KEY idx_activity_events_engagement_id (engagement_id);

ALTER TABLE activity_events
    ADD CONSTRAINT fk_activity_events_lead
        FOREIGN KEY (lead_id) REFERENCES leads (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    ADD CONSTRAINT fk_activity_events_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    ADD CONSTRAINT fk_activity_events_engagement
        FOREIGN KEY (engagement_id) REFERENCES engagements (id)
        ON UPDATE RESTRICT ON DELETE SET NULL;
