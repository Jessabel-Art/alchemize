CREATE TABLE clients (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_type ENUM('individual','business','organization') NOT NULL,
    display_name VARCHAR(180) NOT NULL,
    legal_name VARCHAR(180) NULL,
    preferred_name VARCHAR(120) NULL,
    primary_email VARCHAR(254) NULL,
    primary_phone VARCHAR(40) NULL,
    preferred_contact_method ENUM('email','phone','either') NOT NULL DEFAULT 'email',
    status ENUM('prospective','active','inactive','archived') NOT NULL DEFAULT 'prospective',
    portal_status ENUM('active','disabled','pending','archived') NOT NULL DEFAULT 'pending',
    source VARCHAR(80) NOT NULL DEFAULT 'website',
    origin_lead_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    archived_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_clients_public_id (public_id),
    KEY idx_clients_status (status),
    KEY idx_clients_email (primary_email),
    KEY idx_clients_origin_lead_id (origin_lead_id),
    CONSTRAINT fk_clients_origin_lead
        FOREIGN KEY (origin_lead_id) REFERENCES leads (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    legal_name VARCHAR(180) NOT NULL,
    dba_name VARCHAR(180) NULL,
    entity_type VARCHAR(80) NULL,
    formation_state VARCHAR(80) NULL,
    formation_date DATE NULL,
    business_email VARCHAR(254) NULL,
    business_phone VARCHAR(40) NULL,
    website VARCHAR(255) NULL,
    billing_address_line1 VARCHAR(180) NULL,
    billing_address_line2 VARCHAR(180) NULL,
    billing_city VARCHAR(120) NULL,
    billing_state VARCHAR(120) NULL,
    billing_postal_code VARCHAR(50) NULL,
    billing_country VARCHAR(120) NULL,
    business_stage VARCHAR(80) NULL,
    status ENUM('prospective','active','inactive','archived') NOT NULL DEFAULT 'prospective',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_business_profiles_public_id (public_id),
    UNIQUE KEY uq_business_profiles_client (client_id),
    CONSTRAINT fk_business_profiles_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE client_contacts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(180) NOT NULL,
    title VARCHAR(120) NULL,
    email VARCHAR(254) NULL,
    phone VARCHAR(40) NULL,
    relationship VARCHAR(80) NULL,
    authorization_level ENUM('admin','billing','documents','scheduling','portal','limited') NOT NULL DEFAULT 'limited',
    is_primary_contact TINYINT(1) NOT NULL DEFAULT 0,
    is_billing_contact TINYINT(1) NOT NULL DEFAULT 0,
    is_document_contact TINYINT(1) NOT NULL DEFAULT 0,
    is_scheduling_contact TINYINT(1) NOT NULL DEFAULT 0,
    portal_access_allowed TINYINT(1) NOT NULL DEFAULT 0,
    authorization_status ENUM('active','pending','expired','archived') NOT NULL DEFAULT 'active',
    effective_date DATE NULL,
    expiration_date DATE NULL,
    internal_authorization_notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    archived_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_client_contacts_public_id (public_id),
    KEY idx_client_contacts_client_id (client_id),
    KEY idx_client_contacts_email (email),
    CONSTRAINT fk_client_contacts_client
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
