CREATE TABLE lead_contact_attempts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    lead_id BIGINT UNSIGNED NOT NULL,
    contacted_at DATETIME(6) NOT NULL,
    method ENUM('phone','email','sms','video','in_person','other') NOT NULL,
    direction ENUM('outbound','inbound') NOT NULL DEFAULT 'outbound',
    outcome ENUM('no_answer','voicemail','email_sent','spoke','callback_requested','consultation_scheduled','not_interested','follow_up_needed','other') NOT NULL,
    notes TEXT NULL,
    actor_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_lead_contact_attempts_public_id (public_id),
    KEY idx_lead_contact_attempts_lead_id (lead_id),
    KEY idx_lead_contact_attempts_contacted_at (contacted_at),
    CONSTRAINT fk_lead_contact_attempts_lead
        FOREIGN KEY (lead_id) REFERENCES leads (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_lead_contact_attempts_actor
        FOREIGN KEY (actor_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lead_service_interests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    lead_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NULL,
    custom_interest VARCHAR(180) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_lead_service_interests_lead_id (lead_id),
    KEY idx_lead_service_interests_service_id (service_id),
    CONSTRAINT fk_lead_service_interests_lead
        FOREIGN KEY (lead_id) REFERENCES leads (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_lead_service_interests_service
        FOREIGN KEY (service_id) REFERENCES services (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
