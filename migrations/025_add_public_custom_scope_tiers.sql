-- Complete the canonical public catalog with explicit non-priced scope-review tiers.
-- These rows prevent public clients from interpreting the highest standardized tier
-- as unlimited, while ensuring Custom SOW work never renders as a zero-dollar offer.
INSERT INTO service_tiers (
    public_id, service_id, tier_key, tier_name, description, base_price, minimum_price,
    billing_frequency, pricing_type, status, included_scope, limits_metadata,
    pricing_metadata, invoice_description, internal_notes, active_flag,
    sort_order, catalog_version
)
SELECT UUID(), s.id, x.tier_key, x.tier_name, x.description, NULL, NULL,
       'CUSTOM', 'CUSTOM_SOW', 'CUSTOM_SOW_ONLY', NULL, x.limits_metadata,
       NULL, x.invoice_description, NULL, 1, x.sort_order, '2026-08-29'
FROM services s
JOIN (
    SELECT 'bookkeeping' service_code, 'higher-volume-complex' tier_key,
           'Higher-Volume or Complex Bookkeeping' tier_name,
           'Bookkeeping beyond standard Operations limits requires a scope review.' description,
           JSON_OBJECT('min_transactions', 601) limits_metadata,
           'Higher-volume or complex bookkeeping — Custom SOW.' invoice_description,
           50 sort_order
    UNION ALL
    SELECT 'financial-reporting', 'advanced-modeling', 'Advanced Financial Modeling',
           'Complex models, multiple scenarios, or specialized analysis require a scope review.',
           NULL, 'Advanced financial modeling — Custom SOW.', 40
    UNION ALL
    SELECT 'seo', 'large-competitive-multilocation', 'Large, Competitive, or Multi-Location SEO',
           'Broader market, competitive, or multi-location SEO requires a custom scope.',
           NULL, 'Large, competitive, or multi-location SEO — Custom SOW.', 60
    UNION ALL
    SELECT 'business-planning', 'advanced-modeling', 'Advanced Financial Modeling',
           'Complex projections, scenarios, or modeling require a separate scope review.',
           NULL, 'Advanced financial modeling — Custom SOW.', 40
) x ON x.service_code = s.service_code
ON DUPLICATE KEY UPDATE
    tier_name = VALUES(tier_name),
    description = VALUES(description),
    base_price = NULL,
    minimum_price = NULL,
    billing_frequency = VALUES(billing_frequency),
    pricing_type = VALUES(pricing_type),
    status = VALUES(status),
    limits_metadata = VALUES(limits_metadata),
    invoice_description = VALUES(invoice_description),
    internal_notes = NULL,
    active_flag = VALUES(active_flag),
    sort_order = VALUES(sort_order),
    catalog_version = VALUES(catalog_version);
