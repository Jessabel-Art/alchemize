ALTER TABLE clients
    MODIFY COLUMN client_type ENUM('individual','business','both','organization') NOT NULL;
