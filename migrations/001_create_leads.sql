CREATE TABLE leads (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(40) NULL,
    audience ENUM('individual', 'business') NOT NULL,
    service_key ENUM(
        'individual-tax',
        'individual-insurance',
        'individual-notary',
        'business-formation',
        'business-operations',
        'business-tax',
        'business-advisory',
        'business-insurance',
        'business-notary'
    ) NULL,
    message TEXT NOT NULL,
    preferred_contact ENUM('email', 'phone', 'either') NULL,
    status ENUM(
        'new',
        'contacted',
        'consultation_requested',
        'consultation_scheduled',
        'qualified',
        'converted',
        'closed'
    ) NOT NULL DEFAULT 'new',
    source VARCHAR(64) NOT NULL DEFAULT 'website_contact',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_leads_public_id (public_id),
    KEY idx_leads_status_created (status, created_at),
    KEY idx_leads_email (email(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
