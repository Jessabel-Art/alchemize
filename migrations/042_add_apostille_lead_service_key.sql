-- Adds the public Apostille service to the lead service_key set so an inquiry
-- about it can be stored. Additive only: every existing value keeps its place,
-- 'individual-apostille' is appended, and no existing row changes.
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
        'business-notary',
        'individual-apostille'
    ) NULL;
