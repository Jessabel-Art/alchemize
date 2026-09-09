CREATE TABLE saved_reports (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    name VARCHAR(120) NOT NULL,
    report_type VARCHAR(80) NOT NULL,
    config_json JSON NOT NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_saved_reports_public_id (public_id),
    KEY idx_saved_reports_owner_created (created_by_user_id, created_at),
    CONSTRAINT fk_saved_reports_owner
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
