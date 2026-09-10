-- portal/billing (AlchemizePortalRepository::listPayments) selects p.receipt_url,
-- but the column was only ever added by migration 021, which the baseline step
-- in scripts/run-migrations.php can mark as already-applied without verifying
-- its statements actually ran against a pre-existing legacy schema. This is a
-- brand-new migration number, so a plain (non-conditional) ADD COLUMN is both
-- sufficient and portable across MySQL/MariaDB.
ALTER TABLE payments
    ADD COLUMN receipt_url VARCHAR(500) NULL;
