-- Admin -> Client Management -> "+ Client or Prospect" -> Client (direct
-- creation, server/services/client-service.php AlchemizeClientService::create())
-- has no protection against an accidental repeat submission. Reproduced
-- directly against production: the full create -> portal-provision ->
-- commit chain completes in well under a second with no thrown exception,
-- so the only thing standing between one click and two client rows was the
-- frontend's missing re-entry guard (no disabled state, no in-progress
-- indicator) -- confirmed by the two "Joseph Santos" client rows created
-- roughly two seconds apart in production.
--
-- Mirrors the Idempotency-Key pattern already used for outbound Stripe
-- calls in this codebase (server/services/stripe-payment-service.php): the
-- frontend generates one key per "Add record" submission attempt and sends
-- it with the create request; a repeat submission carrying the same key is
-- recognized via this unique index and returns the original client instead
-- of inserting a second row. Nullable so direct API callers that omit a key
-- are unaffected, and normal legitimate clients (even ones sharing a name
-- or email) are never blocked -- only an exact repeated key is.
--
-- Uses the same portable conditional-DDL pattern as migrations 033-037.
DROP PROCEDURE IF EXISTS alchemize_migration_038_apply;

CREATE PROCEDURE alchemize_migration_038_apply()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE clients ADD COLUMN idempotency_key VARCHAR(64) NULL AFTER source;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'clients' AND index_name = 'uniq_clients_idempotency_key'
    ) THEN
        CREATE UNIQUE INDEX uniq_clients_idempotency_key ON clients (idempotency_key);
    END IF;
END;

CALL alchemize_migration_038_apply();

DROP PROCEDURE alchemize_migration_038_apply;
