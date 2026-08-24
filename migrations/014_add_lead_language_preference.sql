ALTER TABLE leads
    ADD COLUMN language_preference ENUM('en','es') NOT NULL DEFAULT 'en' AFTER preferred_contact;
