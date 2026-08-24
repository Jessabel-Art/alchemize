ALTER TABLE client_addresses
    MODIFY COLUMN address_type ENUM('principal','business','mailing','registered_office','operating_location','billing','other') NOT NULL,
    ADD COLUMN is_primary TINYINT(1) NOT NULL DEFAULT 0 AFTER country;

ALTER TABLE client_business_people
    MODIFY COLUMN role_type ENUM('owner','member','manager','officer','authorized_representative','authorized_contact','decision_maker','administrative_contact','other') NOT NULL,
    ADD COLUMN is_authorized_contact TINYINT(1) NOT NULL DEFAULT 0 AFTER ownership_percentage,
    ADD COLUMN is_decision_maker TINYINT(1) NOT NULL DEFAULT 0 AFTER is_authorized_contact,
    ADD COLUMN client_notes VARCHAR(500) NULL AFTER is_primary;

CREATE TABLE intake_profile_references (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    intake_assignment_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    field_key VARCHAR(120) NOT NULL,
    record_type ENUM('address','business_person') NOT NULL,
    record_public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    record_snapshot JSON NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_intake_profile_reference (intake_assignment_id, field_key, record_type, record_public_id),
    KEY idx_intake_profile_references_client (client_id, intake_assignment_id),
    CONSTRAINT fk_intake_profile_reference_assignment FOREIGN KEY (intake_assignment_id) REFERENCES intake_assignments (id) ON DELETE CASCADE,
    CONSTRAINT fk_intake_profile_reference_client FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE intake_requirement_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    intake_requirement_id BIGINT UNSIGNED NOT NULL,
    document_id BIGINT UNSIGNED NULL,
    status VARCHAR(40) NOT NULL,
    note VARCHAR(500) NULL,
    actor_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_intake_requirement_history_public_id (public_id),
    KEY idx_intake_requirement_history_requirement (intake_requirement_id, created_at),
    CONSTRAINT fk_intake_requirement_history_requirement FOREIGN KEY (intake_requirement_id) REFERENCES intake_requirements (id) ON DELETE CASCADE,
    CONSTRAINT fk_intake_requirement_history_document FOREIGN KEY (document_id) REFERENCES documents_metadata (id) ON DELETE SET NULL,
    CONSTRAINT fk_intake_requirement_history_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
