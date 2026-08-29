ALTER TABLE leads
    MODIFY COLUMN service_key ENUM(
        'individual-tax',
        'individual-insurance',
        'individual-notary',
        'individual-translation',
        'business-formation',
        'business-readiness',
        'business-operations',
        'business-digital',
        'business-bookkeeping',
        'business-payroll',
        'business-tax',
        'business-financial',
        'business-advisory',
        'business-insurance',
        'business-notary'
    ) NULL;

UPDATE leads SET service_key = 'business-readiness' WHERE service_key = 'business-formation';
UPDATE leads SET service_key = 'business-financial' WHERE service_key = 'business-tax';
