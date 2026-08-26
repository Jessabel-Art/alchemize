ALTER TABLE users
    MODIFY COLUMN password_hash VARCHAR(255) NULL,
    MODIFY COLUMN status ENUM('invited','active','inactive','suspended','archived') NOT NULL DEFAULT 'invited';

CREATE TABLE portal_account_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    purpose ENUM('invitation','password_reset') NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6) NULL DEFAULT NULL,
    invalidated_at TIMESTAMP(6) NULL DEFAULT NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_portal_account_tokens_public_id (public_id),
    UNIQUE KEY uq_portal_account_tokens_hash (token_hash),
    KEY idx_portal_tokens_user_purpose (user_id, purpose, used_at, invalidated_at, expires_at),
    CONSTRAINT fk_portal_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_portal_tokens_client FOREIGN KEY (client_id) REFERENCES clients (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_portal_tokens_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
