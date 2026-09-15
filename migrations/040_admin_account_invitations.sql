ALTER TABLE portal_account_tokens
    MODIFY COLUMN client_id BIGINT UNSIGNED NULL,
    MODIFY COLUMN purpose ENUM('invitation','password_reset','admin_invitation','email_change') NOT NULL,
    ADD COLUMN pending_email VARCHAR(254) NULL;
