ALTER TABLE invoice_line_items
    ADD COLUMN IF NOT EXISTS tier_id BIGINT UNSIGNED NULL AFTER service_id,
    ADD COLUMN IF NOT EXISTS service_name_snapshot VARCHAR(180) NULL AFTER service_code_snapshot,
    ADD COLUMN IF NOT EXISTS tier_name_snapshot VARCHAR(180) NULL AFTER service_name_snapshot,
    ADD COLUMN IF NOT EXISTS billing_type_snapshot VARCHAR(50) NULL AFTER description_snapshot,
    ADD COLUMN IF NOT EXISTS pricing_type_snapshot VARCHAR(40) NULL AFTER billing_type_snapshot,
    ADD COLUMN IF NOT EXISTS base_catalog_price_snapshot DECIMAL(12,2) NULL AFTER pricing_type_snapshot,
    ADD COLUMN IF NOT EXISTS pricing_snapshot JSON NULL AFTER base_catalog_price_snapshot,
    ADD COLUMN IF NOT EXISTS catalog_version_snapshot VARCHAR(40) NULL AFTER pricing_snapshot;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS request_key CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL AFTER public_id;
