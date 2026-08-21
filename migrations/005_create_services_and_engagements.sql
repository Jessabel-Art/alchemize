CREATE TABLE services (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    service_code VARCHAR(80) NOT NULL,
    service_name VARCHAR(180) NOT NULL,
    description TEXT NULL,
    audience ENUM('individual','business','all') NOT NULL DEFAULT 'all',
    category VARCHAR(80) NULL,
    status ENUM('draft','active','retired','archived') NOT NULL DEFAULT 'active',
    default_duration INT UNSIGNED NULL,
    billing_type VARCHAR(50) NULL,
    default_price DECIMAL(10,2) NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    active_flag TINYINT(1) NOT NULL DEFAULT 1,
    billing_description VARCHAR(255) NULL,
    internal_pricing_notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    archived_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_services_public_id (public_id),
    UNIQUE KEY uq_services_code (service_code),
    KEY idx_services_status (status),
    KEY idx_services_audience (audience)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE service_addons (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    add_on_code VARCHAR(80) NOT NULL,
    name VARCHAR(180) NOT NULL,
    description TEXT NULL,
    billing_type VARCHAR(50) NULL,
    default_price DECIMAL(10,2) NULL,
    active_flag TINYINT(1) NOT NULL DEFAULT 1,
    is_optional TINYINT(1) NOT NULL DEFAULT 1,
    internal_notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    archived_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_service_addons_public_id (public_id),
    KEY idx_service_addons_service_id (service_id),
    CONSTRAINT fk_service_addons_service
        FOREIGN KEY (service_id) REFERENCES services (id)
        ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE engagements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    engagement_number VARCHAR(80) NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    status ENUM('preparing','waiting_on_client','waiting_on_alchemize','scheduled','in_progress','review','ready_for_client','completed','archived') NOT NULL DEFAULT 'preparing',
    start_date DATE NULL,
    target_date DATE NULL,
    completion_date DATE NULL,
    owner_user_id BIGINT UNSIGNED NULL,
    billing_arrangement VARCHAR(100) NULL,
    scope_notes TEXT NULL,
    pricing_notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    archived_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_engagements_public_id (public_id),
    UNIQUE KEY uq_engagements_number (engagement_number),
    KEY idx_engagements_client_id (client_id),
    KEY idx_engagements_owner_user_id (owner_user_id),
    CONSTRAINT fk_engagements_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_engagements_owner
        FOREIGN KEY (owner_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE engagement_service_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    engagement_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NULL,
    add_on_id BIGINT UNSIGNED NULL,
    service_code_snapshot VARCHAR(80) NULL,
    service_name_snapshot VARCHAR(180) NULL,
    description_snapshot TEXT NULL,
    catalog_default_price_snapshot DECIMAL(10,2) NULL,
    negotiated_unit_price DECIMAL(10,2) NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    billing_type_snapshot VARCHAR(50) NULL,
    scope_notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_engagement_service_items_public_id (public_id),
    KEY idx_engagement_service_items_engagement_id (engagement_id),
    KEY idx_engagement_service_items_service_id (service_id),
    CONSTRAINT fk_engagement_service_items_engagement
        FOREIGN KEY (engagement_id) REFERENCES engagements (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_engagement_service_items_service
        FOREIGN KEY (service_id) REFERENCES services (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT fk_engagement_service_items_addon
        FOREIGN KEY (add_on_id) REFERENCES service_addons (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
