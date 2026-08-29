ALTER TABLE services
    ADD COLUMN public_name VARCHAR(180) NULL AFTER service_name,
    ADD COLUMN catalog_status ENUM('ACTIVE','PENDING_AUTHORIZATION','CUSTOM_SOW_ONLY','MANUAL_REVIEW','FUTURE_EXPANSION','NOT_OFFERED') NOT NULL DEFAULT 'ACTIVE' AFTER status,
    ADD COLUMN pricing_type ENUM('FIXED','FORMULA','STARTING_AT','CUSTOM_SOW','MANUAL_REVIEW','REGULATED_PENDING','NOT_OFFERED','FUTURE_EXPANSION') NOT NULL DEFAULT 'FIXED' AFTER billing_type,
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER active_flag,
    ADD COLUMN catalog_version VARCHAR(40) NOT NULL DEFAULT '2026-08-29' AFTER sort_order,
    ADD COLUMN price_locked TINYINT(1) NOT NULL DEFAULT 1 AFTER catalog_version;

CREATE TABLE service_tiers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    tier_key VARCHAR(100) NOT NULL,
    tier_name VARCHAR(180) NOT NULL,
    description TEXT NULL,
    base_price DECIMAL(12,2) NULL,
    minimum_price DECIMAL(12,2) NULL,
    billing_frequency ENUM('ONE_TIME','MONTHLY','QUARTERLY','ANNUAL','HOURLY','PER_PAGE','PER_WORD','PER_DOCUMENT','CUSTOM') NOT NULL DEFAULT 'ONE_TIME',
    pricing_type ENUM('FIXED','FORMULA','STARTING_AT','CUSTOM_SOW','MANUAL_REVIEW','REGULATED_PENDING','NOT_OFFERED','FUTURE_EXPANSION') NOT NULL,
    status ENUM('ACTIVE','PENDING_AUTHORIZATION','CUSTOM_SOW_ONLY','MANUAL_REVIEW','FUTURE_EXPANSION','NOT_OFFERED') NOT NULL DEFAULT 'ACTIVE',
    included_scope JSON NULL,
    limits_metadata JSON NULL,
    pricing_metadata JSON NULL,
    invoice_description VARCHAR(500) NULL,
    internal_notes TEXT NULL,
    active_flag TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    catalog_version VARCHAR(40) NOT NULL DEFAULT '2026-08-29',
    price_locked TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id), UNIQUE KEY uq_service_tiers_public_id (public_id), UNIQUE KEY uq_service_tiers_key (service_id, tier_key),
    CONSTRAINT fk_service_tiers_service FOREIGN KEY (service_id) REFERENCES services (id) ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE service_addons
    ADD COLUMN tier_id BIGINT UNSIGNED NULL AFTER service_id,
    ADD COLUMN pricing_method ENUM('FIXED','PER_UNIT','PERCENTAGE','STARTING_AT','MANUAL_RANGE','CONFIGURABLE_RATE') NOT NULL DEFAULT 'FIXED' AFTER billing_type,
    ADD COLUMN unit VARCHAR(60) NULL AFTER default_price,
    ADD COLUMN pricing_metadata JSON NULL AFTER unit,
    ADD UNIQUE KEY uq_service_addons_code (service_id, add_on_code),
    ADD CONSTRAINT fk_service_addons_tier FOREIGN KEY (tier_id) REFERENCES service_tiers (id) ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE TABLE client_service_assignments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, public_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL, service_id BIGINT UNSIGNED NOT NULL, tier_id BIGINT UNSIGNED NULL,
    agreed_base_price DECIMAL(12,2) NULL, agreed_recurring_amount DECIMAL(12,2) NULL, custom_price_override DECIMAL(12,2) NULL,
    selected_addons JSON NULL, billing_frequency VARCHAR(40) NULL, start_date DATE NULL,
    status ENUM('proposed','active','paused','completed','cancelled') NOT NULL DEFAULT 'active',
    pricing_snapshot JSON NOT NULL, catalog_version VARCHAR(40) NOT NULL, notes TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id), UNIQUE KEY uq_client_service_assignments_public_id (public_id), KEY idx_client_service_client (client_id),
    CONSTRAINT fk_client_service_client FOREIGN KEY (client_id) REFERENCES clients (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_client_service_service FOREIGN KEY (service_id) REFERENCES services (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_client_service_tier FOREIGN KEY (tier_id) REFERENCES service_tiers (id) ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE invoice_line_items
    ADD COLUMN tier_id BIGINT UNSIGNED NULL AFTER service_id,
    ADD COLUMN service_name_snapshot VARCHAR(180) NULL AFTER service_code_snapshot,
    ADD COLUMN tier_name_snapshot VARCHAR(180) NULL AFTER service_name_snapshot,
    ADD COLUMN pricing_type_snapshot VARCHAR(40) NULL AFTER billing_type_snapshot,
    ADD COLUMN base_catalog_price_snapshot DECIMAL(12,2) NULL AFTER pricing_type_snapshot,
    ADD COLUMN pricing_snapshot JSON NULL AFTER base_catalog_price_snapshot,
    ADD COLUMN catalog_version_snapshot VARCHAR(40) NULL AFTER pricing_snapshot,
    ADD CONSTRAINT fk_invoice_line_items_tier FOREIGN KEY (tier_id) REFERENCES service_tiers (id) ON UPDATE RESTRICT ON DELETE SET NULL;

INSERT INTO services (public_id,service_code,service_name,public_name,description,audience,category,status,catalog_status,billing_type,pricing_type,default_price,currency,active_flag,sort_order,catalog_version,price_locked,billing_description,internal_pricing_notes)
VALUES
(UUID(),'google-business-profile','Google Business Profile','Google Business Profile Setup & Optimization','Profile setup, optimization, and maintenance guidance.','business','Google Business Profile','active','ACTIVE','one_time','FIXED',399,'USD',1,10,'2026-08-29',1,'One-time','Ongoing management is separate.'),
(UUID(),'business-consulting','Business Consulting','Business Consulting','Assessment, strategy, and intensive consulting engagements.','business','Business Consulting','active','ACTIVE','one_time','FIXED',199,'USD',1,20,'2026-08-29',1,'One-time','Implementation is separate unless included by SOW.'),
(UUID(),'business-startup','Business Startup / Readiness','Business Startup Package','Startup roadmap, operations consultation, GBP setup, readiness checklist, and meetings.','business','Business Startup / Readiness','active','ACTIVE','one_time','FIXED',799,'USD',1,30,'2026-08-29',1,'One-time','Website, bookkeeping, payroll, tax, and substantial implementation excluded.'),
(UUID(),'bookkeeping','Bookkeeping','Bookkeeping','Monthly bookkeeping and cleanup services.','business','Bookkeeping','active','ACTIVE','monthly','FORMULA',249,'USD',1,40,'2026-08-29',1,'Monthly or formula','Tax preparation is separate.'),
(UUID(),'payroll','Payroll','Payroll','Payroll setup and recurring administrative processing.','business','Payroll','active','ACTIVE','monthly','FIXED',99,'USD',1,50,'2026-08-29',1,'One-time or monthly','Platform fees separate; no W-4 advice.'),
(UUID(),'financial-reporting','Financial Reporting','Financial Reporting','Financial statements, reviews, forecasts, and modeling.','business','Financial Reporting','active','ACTIVE','one_time','STARTING_AT',249,'USD',1,60,'2026-08-29',1,'One-time','Advanced modeling requires Custom SOW.'),
(UUID(),'website-design','Website Design & Development','Website Design & Development','Responsive business websites and custom web systems.','business','Website Design & Development','active','ACTIVE','project','FIXED',1250,'USD',1,70,'2026-08-29',1,'Project','Custom applications require SOW.'),
(UUID(),'website-maintenance','Website Maintenance','Website Maintenance','Recurring website care and management.','business','Website Maintenance','active','ACTIVE','monthly','FIXED',99,'USD',1,80,'2026-08-29',1,'Monthly','Unused time does not roll over.'),
(UUID(),'seo','SEO','SEO','Audits, implementation, local SEO, and growth retainers.','business','SEO','active','ACTIVE','mixed','STARTING_AT',299,'USD',1,90,'2026-08-29',1,'One-time or monthly','Large, competitive, and multi-location work requires SOW.'),
(UUID(),'business-operations','Business Operations & Implementation','Business Operations & Implementation','Workflow, systems, sprint, and transformation services.','business','Business Operations & Implementation','active','ACTIVE','project','FIXED',499,'USD',1,100,'2026-08-29',1,'Project','Transformation requires SOW.'),
(UUID(),'administrative-support','Administrative Support','Administrative Support','Hourly and monthly administrative support.','business','Administrative Support','active','ACTIVE','mixed','FIXED',60,'USD',1,110,'2026-08-29',1,'Hourly or monthly','25% rollover for one month; excluded regulated/specialist work documented in scope.'),
(UUID(),'translation','Translation','Translation','English/Spanish document translation.','all','Translation','active','ACTIVE','formula','FORMULA',35,'USD',1,120,'2026-08-29',1,'Per page or word','Complex formatting is custom; specialized content requires review.'),
(UUID(),'apostille','NC Apostille Facilitation','NC Apostille Facilitation','Facilitation/support; Alchemize does not issue apostilles.','all','Document Services','draft','PENDING_AUTHORIZATION','formula','REGULATED_PENDING',149,'USD',0,130,'2026-08-29',1,'Per engagement','Government and third-party costs separate.'),
(UUID(),'notary','Notary','Notary','Pricing stored for future activation.','all','Document Services','draft','PENDING_AUTHORIZATION','formula','REGULATED_PENDING',10,'USD',0,140,'2026-08-29',1,'Per signature/person','Mileage rate must remain administratively configurable.'),
(UUID(),'tax-preparation','Tax Preparation','Tax Preparation','Individual and business returns with complexity review.','all','Tax Preparation','draft','PENDING_AUTHORIZATION','mixed','REGULATED_PENDING',199,'USD',0,150,'2026-08-29',1,'Per return','Do not automatically quote when complexity flags exist.'),
(UUID(),'business-planning','Business Planning & Financial Readiness','Business Planning & Financial Readiness','Business planning and financial readiness, not loan procurement.','business','Business Planning','active','ACTIVE','project','STARTING_AT',799,'USD',1,160,'2026-08-29',1,'Project','No lender selection, negotiation, submission, or guarantee.'),
(UUID(),'digital-automation','Digital Business Solutions & Automation','Digital Business Solutions & Automation','Workflow automation and connected business systems.','business','Digital Solutions','active','ACTIVE','project','STARTING_AT',499,'USD',1,170,'2026-08-29',1,'Project','Third-party charges separate; post-support work $100/hour.'),
(UUID(),'business-financing','Business Financing','Business Financing','Financing readiness is handled through the Business Foundation Assessment.','business','Business Financing','draft','FUTURE_EXPANSION','custom','FUTURE_EXPANSION',NULL,'USD',0,180,'2026-08-29',1,'Not offered','Loan packaging, brokerage, lender matching, and SBA application assistance not offered.')
ON DUPLICATE KEY UPDATE public_name=VALUES(public_name),description=VALUES(description),category=VALUES(category),catalog_status=VALUES(catalog_status),pricing_type=VALUES(pricing_type),active_flag=VALUES(active_flag),sort_order=VALUES(sort_order),catalog_version=VALUES(catalog_version),price_locked=VALUES(price_locked),internal_pricing_notes=VALUES(internal_pricing_notes);

INSERT INTO service_tiers (public_id,service_id,tier_key,tier_name,description,base_price,minimum_price,billing_frequency,pricing_type,status,included_scope,limits_metadata,pricing_metadata,invoice_description,internal_notes,active_flag,sort_order)
SELECT UUID(),s.id,x.tier_key,x.tier_name,x.description,x.base_price,x.minimum_price,x.frequency,x.pricing_type,x.catalog_status,JSON_ARRAY(x.description),x.limits, x.metadata,x.invoice_description,x.internal_notes,x.active_flag,x.sort_order
FROM services s JOIN (
 SELECT 'google-business-profile' service_code,'setup-optimization' tier_key,'Setup & Optimization' tier_name,'Profile setup/optimization, categories, services, description, hours/service areas, photo/content and maintenance guidance.' description,399.00 base_price,NULL minimum_price,'ONE_TIME' frequency,'FIXED' pricing_type,'ACTIVE' catalog_status,NULL limits,NULL metadata,'Google Business Profile setup and optimization.' invoice_description,NULL internal_notes,1 active_flag,10 sort_order UNION ALL
 SELECT 'business-consulting','foundation-assessment','Business Foundation Assessment','60–90 minute discovery, gap identification, recommendations, and written action plan.',249,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Business foundation assessment with prioritized written action plan.','$249 may be credited to a qualifying project within 30 days; do not automate.',1,10 UNION ALL
 SELECT 'business-consulting','focused-strategy','Focused Strategy Session','Up to 90 minutes on one defined challenge with documented next steps.',199,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Focused strategy session with documented next steps.',NULL,1,20 UNION ALL
 SELECT 'business-consulting','half-day-intensive','Half-Day Business Intensive','Up to approximately 4 hours for assessment, workflow mapping, systems analysis, planning, and follow-up.',499,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Half-day business intensive and implementation planning.',NULL,1,30 UNION ALL
 SELECT 'business-consulting','full-day-intensive','Full-Day Business Intensive','Up to approximately 8 hours, written summary/action plan, and follow-up.',899,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Full-day business intensive with written action plan.',NULL,1,40 UNION ALL
 SELECT 'business-startup','startup-package','Business Startup Package','Assessment, roadmap, operations consultation, GBP setup, readiness checklist, and two meetings.',799,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Business startup roadmap and readiness package.',NULL,1,10 UNION ALL
 SELECT 'bookkeeping','essentials','Essentials','Monthly categorization, reconciliation, reports, and routine support.',249,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('max_transactions',100,'max_accounts',2),NULL,'Monthly bookkeeping for up to 100 transactions and two accounts.',NULL,1,10 UNION ALL
 SELECT 'bookkeeping','growth','Growth','Essentials plus higher-volume support and quarterly review.',399,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('min_transactions',101,'max_transactions',300,'max_accounts',4),NULL,'Monthly bookkeeping for 101–300 transactions and up to four accounts.',NULL,1,20 UNION ALL
 SELECT 'bookkeeping','operations','Operations','Higher-volume bookkeeping, reports, monthly review, and priority support.',599,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('min_transactions',301,'max_transactions',600,'max_accounts',6),NULL,'Monthly bookkeeping for 301–600 transactions and up to six accounts.',NULL,1,30 UNION ALL
 SELECT 'bookkeeping','cleanup','Bookkeeping Cleanup','First month $250; each additional month $125.',NULL,250,'ONE_TIME','FORMULA','ACTIVE',NULL,JSON_OBJECT('formula','250 + max(months_behind - 1, 0) * 125'),'Bookkeeping cleanup for the approved number of months.','Severe/incomplete/reconstruction work requires manual review.',1,40 UNION ALL
 SELECT 'payroll','setup','Payroll Setup','Platform selection/setup assistance and administrative configuration.',199,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Payroll platform setup and administrative configuration.','Software fees separate.',1,10 UNION ALL
 SELECT 'payroll','1-5-employees','Payroll Processing 1–5 Employees','Recurring payroll administration through selected platform.',99,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('max_employees',5),NULL,'Monthly payroll processing for 1–5 employees.',NULL,1,20 UNION ALL
 SELECT 'payroll','6-15-employees','Payroll Processing 6–15 Employees','Recurring payroll administration through selected platform.',149,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('min_employees',6,'max_employees',15),NULL,'Monthly payroll processing for 6–15 employees.',NULL,1,30 UNION ALL
 SELECT 'payroll','16-30-employees','Payroll Processing 16–30 Employees','Recurring payroll administration through selected platform.',199,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('min_employees',16,'max_employees',30),NULL,'Monthly payroll processing for 16–30 employees.',NULL,1,40 UNION ALL
 SELECT 'payroll','31-plus','31+ Employees','Custom payroll scope.',NULL,NULL,'CUSTOM','CUSTOM_SOW','CUSTOM_SOW_ONLY',JSON_OBJECT('min_employees',31),NULL,'Payroll processing — Custom SOW.',NULL,1,50 UNION ALL
 SELECT 'financial-reporting','reporting-package','Financial Reporting Package','P&L, balance sheet, cash-flow summary, trends, summary, review, and PDF package.',249,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Financial reporting package with review.',NULL,1,10 UNION ALL
 SELECT 'financial-reporting','quarterly-review','Quarterly Financial Review','Quarterly statements, comparisons, trends, KPIs, observations, and review.',399,NULL,'QUARTERLY','FIXED','ACTIVE',NULL,NULL,'Quarterly financial review and written observations.',NULL,1,20 UNION ALL
 SELECT 'financial-reporting','reporting-forecast','Financial Reporting + Forecast','Quarterly review plus basic 12-month cash-flow forecast and scenarios.',599,599,'ONE_TIME','STARTING_AT','ACTIVE',NULL,NULL,'Financial reporting and basic 12-month forecast.','Final amount subject to scope review.',1,30 UNION ALL
 SELECT 'website-design','launch','Website Launch','Up to 3 pages, one revision, responsive development, SEO foundation, launch, handoff, and 30-day defect support.',1250,NULL,'ONE_TIME','FIXED','ACTIVE',JSON_OBJECT('max_pages',3,'revision_rounds',1),NULL,'Up to three-page responsive business website with SEO foundation.',NULL,1,10 UNION ALL
 SELECT 'website-design','growth','Website Growth','Up to 6 pages, two revisions, stronger conversion strategy, enhanced SEO, forms, and support.',1850,NULL,'ONE_TIME','FIXED','ACTIVE',JSON_OBJECT('max_pages',6,'revision_rounds',2),NULL,'Up to six-page responsive business website with enhanced SEO foundation and conversion-focused service structure.',NULL,1,20 UNION ALL
 SELECT 'website-design','custom','Custom Website','7+ pages or complex architecture, locations, catalogs, forms, commerce, integrations, migration, or design.',NULL,NULL,'CUSTOM','CUSTOM_SOW','CUSTOM_SOW_ONLY',NULL,NULL,'Custom Website — Custom SOW.','Engagement-specific description and approved amount required.',1,30 UNION ALL
 SELECT 'website-design','web-application','Digital Business System / Web Application','Portals, dashboards, auth, databases, payments, APIs, and custom workflows.',NULL,NULL,'CUSTOM','CUSTOM_SOW','CUSTOM_SOW_ONLY',NULL,NULL,'Digital Business System / Web Application — Custom SOW.','Engagement-specific description and approved amount required.',1,40 UNION ALL
 SELECT 'website-maintenance','care','Website Care','Routine updates, monitoring, troubleshooting, 30 minutes changes, monthly check.',99,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('included_hours',0.5),NULL,'Monthly Website Care services.',NULL,1,10 UNION ALL
 SELECT 'website-maintenance','management','Website Management','Care plus two hours changes, analytics, optimization, and quarterly review.',199,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('included_hours',2),NULL,'Monthly Website Management services.',NULL,1,20 UNION ALL
 SELECT 'website-maintenance','managed','Managed Website','Management plus four hours, priority updates, SEO adjustments, monthly review, quarterly strategy.',349,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('included_hours',4),NULL,'Monthly Managed Website services.',NULL,1,30 UNION ALL
 SELECT 'website-maintenance','outside-site-audit','Outside-Site Onboarding Audit','Required for websites Alchemize did not build.',149,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Outside-site onboarding audit.',NULL,1,40 UNION ALL
 SELECT 'seo','audit','Website SEO Audit','Technical fundamentals, metadata, indexing, schema, observations, report, and debrief.',299,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Website SEO audit with written action report.','$299 qualifying implementation credit within 30 days; do not automate.',1,10 UNION ALL
 SELECT 'seo','implementation','SEO Implementation','Implementation of agreed recommendations for up to five core pages.',499,499,'ONE_TIME','STARTING_AT','ACTIVE',JSON_OBJECT('max_pages',5),NULL,'SEO implementation for agreed audit recommendations.','Starting price; final amount subject to scope review.',1,20 UNION ALL
 SELECT 'seo','local-foundation','Local SEO Foundation','Local research, five-page optimization, schema, NAP, Search Console, citations, competitors, and GBP review.',599,NULL,'ONE_TIME','FIXED','ACTIVE',JSON_OBJECT('max_pages',5),NULL,'Local SEO foundation and visibility baseline.',NULL,1,30 UNION ALL
 SELECT 'seo','local','Local SEO','Monitoring, GBP, optimization, citations, schema, reputation, reports, and quarterly strategy.',399,NULL,'MONTHLY','FIXED','ACTIVE',NULL,NULL,'Monthly Local SEO services.',NULL,1,40 UNION ALL
 SELECT 'seo','growth','SEO Growth','Broader strategy, three optimizations, monthly content, deeper analysis, and strategy.',699,NULL,'MONTHLY','FIXED','ACTIVE',NULL,NULL,'Monthly SEO Growth services.',NULL,1,50 UNION ALL
 SELECT 'business-operations','workflow-implementation','Process & Workflow Implementation','One workflow, redesign, implementation, template, instructions, training, and revision.',499,NULL,'ONE_TIME','FIXED','ACTIVE',JSON_OBJECT('implementation_hours',4),NULL,'Process and workflow implementation for one approved workflow.',NULL,1,10 UNION ALL
 SELECT 'business-operations','systems-setup','Business Systems Setup','Requirements, tool recommendation, configuration, integration, import, instructions, training, and support.',799,NULL,'ONE_TIME','FIXED','ACTIVE',JSON_OBJECT('implementation_hours',7),NULL,'Business systems setup and staff training.',NULL,1,20 UNION ALL
 SELECT 'business-operations','improvement-sprint','Operations Improvement Sprint','2–3 weeks, up to three workflows, SOPs, configuration, training, and follow-up.',1499,NULL,'ONE_TIME','FIXED','ACTIVE',JSON_OBJECT('max_workflows',3,'max_internal_hours',14),NULL,'Operations improvement sprint for approved connected workflows.',NULL,1,30 UNION ALL
 SELECT 'business-operations','transformation','Operational Transformation','Four or more workflows, departments, migrations, integrations, or custom software.',NULL,NULL,'CUSTOM','CUSTOM_SOW','CUSTOM_SOW_ONLY',NULL,NULL,'Operational Transformation — Custom SOW.','Approved amount and engagement-specific description required.',1,40 UNION ALL
 SELECT 'administrative-support','as-needed','As-Needed Administrative Support','Approved administrative support; two-hour minimum.',60,120,'HOURLY','FORMULA','ACTIVE',JSON_OBJECT('minimum_hours',2),NULL,'As-needed administrative support.','Two-hour/$120 minimum.',1,10 UNION ALL
 SELECT 'administrative-support','essentials','Administrative Essentials','Five included hours per month.',275,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('included_hours',5),NULL,'Five hours of monthly administrative support.',NULL,1,20 UNION ALL
 SELECT 'administrative-support','support','Administrative Support','Ten included hours per month.',525,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('included_hours',10),NULL,'Ten hours of monthly administrative support.',NULL,1,30 UNION ALL
 SELECT 'administrative-support','partner','Administrative Partner','Twenty included hours per month.',950,NULL,'MONTHLY','FIXED','ACTIVE',JSON_OBJECT('included_hours',20),NULL,'Twenty hours of monthly administrative support.',NULL,1,40 UNION ALL
 SELECT 'translation','standard-page','Standard Short Document','Up to 250 source words per page.',35,35,'PER_PAGE','FORMULA','ACTIVE',JSON_OBJECT('max_words_per_page',250),NULL,'Standard document translation.',NULL,1,10 UNION ALL
 SELECT 'translation','general','General / Business Translation','$0.15 per source word; $35 minimum.',NULL,35,'PER_WORD','FORMULA','ACTIVE',NULL,JSON_OBJECT('rate_per_word',0.15),'General/business translation of approved source material.',NULL,1,20 UNION ALL
 SELECT 'translation','certified','Certified & Official-Use Translation','Complete translation, stamps/seals, layout, proofreading, certificate, PDF, and correction round.',45,45,'PER_PAGE','FORMULA','ACTIVE',JSON_OBJECT('max_words_per_page',250),NULL,'Certified translation including Certificate of Translation Accuracy.',NULL,1,30 UNION ALL
 SELECT 'translation','spoken-interpretation','Spoken Interpretation','Not offered.',NULL,NULL,'CUSTOM','NOT_OFFERED','NOT_OFFERED',NULL,NULL,'Spoken Interpretation.','Not selectable.',0,40 UNION ALL
 SELECT 'apostille','facilitation','Apostille Facilitation','First document $149; each additional document $40.',149,149,'PER_DOCUMENT','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,JSON_OBJECT('additional_document',40),'NC apostille facilitation support.','Alchemize does not issue apostilles.',0,10 UNION ALL
 SELECT 'notary','standard','Standard Notarial Act','Up to recorded NC statutory maximum: $10 per applicable principal signature/person.',10,NULL,'CUSTOM','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Standard notarial act.',NULL,0,10 UNION ALL
 SELECT 'notary','electronic','Electronic Notarial Act','$15 per applicable electronically notarized principal signature/person.',15,NULL,'CUSTOM','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Electronic notarial act.',NULL,0,20 UNION ALL
 SELECT 'notary','remote','Remote Notarial Act','$25 per applicable principal signature.',25,NULL,'CUSTOM','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Remote notarial act.',NULL,0,30 UNION ALL
 SELECT 'tax-preparation','basic-1040','Basic Individual 1040','Basic individual return.',199,NULL,'ONE_TIME','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Basic Individual Form 1040 preparation.',NULL,0,10 UNION ALL
 SELECT 'tax-preparation','standard-1040','Standard Individual 1040','Standard individual return.',299,NULL,'ONE_TIME','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Standard Individual Form 1040 preparation.',NULL,0,20 UNION ALL
 SELECT 'tax-preparation','schedule-c','Self-Employed / Schedule C','Starting price; complexity review required.',399,399,'ONE_TIME','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Self-employed individual return with Schedule C.','Complexity flags stop automatic quoting.',0,30 UNION ALL
 SELECT 'tax-preparation','form-1065','Partnership Form 1065','Starting price.',799,799,'ONE_TIME','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Partnership Form 1065 preparation.',NULL,0,40 UNION ALL
 SELECT 'tax-preparation','form-1120s','S Corporation Form 1120-S','Starting price.',899,899,'ONE_TIME','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'S Corporation Form 1120-S preparation.',NULL,0,50 UNION ALL
 SELECT 'tax-preparation','form-1120','C Corporation Form 1120','Starting price.',899,899,'ONE_TIME','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'C Corporation Form 1120 preparation.',NULL,0,60 UNION ALL
 SELECT 'tax-preparation','amended-alchemize','Amended Return – original prepared by Alchemize','Starting price.',199,199,'ONE_TIME','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Amended return for an Alchemize-prepared original.',NULL,0,70 UNION ALL
 SELECT 'tax-preparation','amended-external','Amended Return – original prepared elsewhere','Starting price.',349,349,'ONE_TIME','REGULATED_PENDING','PENDING_AUTHORIZATION',NULL,NULL,'Amended return for an externally prepared original.',NULL,0,80 UNION ALL
 SELECT 'business-planning','foundation','Business Plan Foundation','Core plan, research, assumptions, professional formatting, and two revisions.',799,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Business Plan Foundation with two revision rounds.',NULL,1,10 UNION ALL
 SELECT 'business-planning','financial-readiness','Business Plan & Financial Readiness','Foundation plus deeper analysis, P&L, cash flow, break-even, and readiness checklist.',1299,NULL,'ONE_TIME','FIXED','ACTIVE',NULL,NULL,'Business plan and financial readiness package.',NULL,1,20 UNION ALL
 SELECT 'business-planning','comprehensive','Comprehensive Business Plan','Research-heavy external plan, multiple streams/locations, capital, projections, and scenarios.',1999,1999,'ONE_TIME','STARTING_AT','ACTIVE',NULL,NULL,'Comprehensive business plan and financial readiness.','Advanced financial modeling requires Custom SOW.',1,30 UNION ALL
 SELECT 'digital-automation','workflow','Workflow Automation','One process, up to three apps and five meaningful actions, testing, documentation, handoff, and support.',499,499,'ONE_TIME','STARTING_AT','ACTIVE',JSON_OBJECT('max_apps',3,'max_actions',5),NULL,'Workflow automation for one approved process.','Starting price; final amount subject to review.',1,10 UNION ALL
 SELECT 'digital-automation','connected','Connected Business Automation','Several automations, up to five apps, routing, mapping, CRM, webhooks, testing, training, and support.',999,999,'ONE_TIME','STARTING_AT','ACTIVE',JSON_OBJECT('max_apps',5),NULL,'Connected business automation for the approved scope.','Starting price; final amount subject to review.',1,20 UNION ALL
 SELECT 'digital-automation','advanced','Advanced Digital Business Solution','Complex APIs, AI, sensitive data, migration, payments/auth, reporting, code, or legacy integrations.',NULL,NULL,'CUSTOM','CUSTOM_SOW','CUSTOM_SOW_ONLY',NULL,NULL,'Advanced Digital Business Solution — Custom SOW.','Approved amount and engagement-specific description required.',1,30 UNION ALL
 SELECT 'business-financing','sba-assistance','SBA Loan Application Assistance','Not offered.',NULL,NULL,'CUSTOM','NOT_OFFERED','NOT_OFFERED',NULL,NULL,'SBA Loan Application Assistance.','Not selectable.',0,10
) x ON x.service_code=s.service_code
ON DUPLICATE KEY UPDATE tier_name=VALUES(tier_name),description=VALUES(description),base_price=VALUES(base_price),minimum_price=VALUES(minimum_price),billing_frequency=VALUES(billing_frequency),pricing_type=VALUES(pricing_type),status=VALUES(status),included_scope=VALUES(included_scope),limits_metadata=VALUES(limits_metadata),pricing_metadata=VALUES(pricing_metadata),invoice_description=VALUES(invoice_description),internal_notes=VALUES(internal_notes),active_flag=VALUES(active_flag),sort_order=VALUES(sort_order),catalog_version=VALUES(catalog_version),price_locked=VALUES(price_locked);

INSERT INTO service_addons (public_id,service_id,tier_id,add_on_code,name,description,billing_type,pricing_method,default_price,unit,pricing_metadata,active_flag,is_optional,internal_notes)
SELECT UUID(),s.id,NULL,x.code,x.name,x.description,x.billing_type,x.method,x.price,x.unit,x.metadata,x.active_flag,1,x.notes FROM services s JOIN (
 SELECT 'translation' service_code,'rush' code,'Rush Translation' name,'Adds 50% to translation subtotal.' description,'percentage' billing_type,'PERCENTAGE' method,50.00 price,'percent' unit,JSON_OBJECT('multiplier',1.5) metadata,1 active_flag,NULL notes UNION ALL
 SELECT 'apostille','additional-document','Additional Document','Each additional document in the same engagement.','per_document','PER_UNIT',40,'document',NULL,0,'Pending authorization.' UNION ALL
 SELECT 'website-maintenance','approved-overage','Approved Overage','Client-approved additional work in 30-minute increments.','hourly','PER_UNIT',100,'hour',JSON_OBJECT('increment_hours',0.5),1,'Client approval required.' UNION ALL
 SELECT 'administrative-support','additional-time','Additional Approved Time','Additional approved time in 30-minute increments.','hourly','PER_UNIT',60,'hour',JSON_OBJECT('increment_hours',0.5),1,NULL UNION ALL
 SELECT 'tax-preparation','additional-schedule-c','Additional Schedule C','Per additional business.','per_unit','PER_UNIT',150,'business',NULL,0,'Pending operational readiness.' UNION ALL
 SELECT 'tax-preparation','rental-property','Rental Property','Per rental property.','per_unit','PER_UNIT',125,'property',NULL,0,'Pending operational readiness.' UNION ALL
 SELECT 'tax-preparation','additional-state','Additional State','Per additional state.','per_unit','PER_UNIT',75,'state',NULL,0,'Pending operational readiness.' UNION ALL
 SELECT 'tax-preparation','investment-reconciliation','Significant Investment Reconciliation','Approved manual value from $75–$150.','manual','MANUAL_RANGE',75,'engagement',JSON_OBJECT('maximum',150),0,'Pending operational readiness; manual value required.' UNION ALL
 SELECT 'tax-preparation','crypto-reconciliation','Crypto Reconciliation','Starting add-on price.', 'starting_at','STARTING_AT',100,'engagement',NULL,0,'Pending operational readiness.' UNION ALL
 SELECT 'tax-preparation','complex-k1','Complex K-1 / Basis Work','Starting add-on price.', 'starting_at','STARTING_AT',100,'engagement',NULL,0,'Pending operational readiness.' UNION ALL
 SELECT 'notary','travel-mileage','Travel Mileage','Actual mileage times the current configured federal business mileage rate.', 'configurable','CONFIGURABLE_RATE',NULL,'mile',JSON_OBJECT('configuration_key','federal_business_mileage_rate'),0,'Advance written consent required; do not hardcode rate.'
) x ON x.service_code=s.service_code
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),pricing_method=VALUES(pricing_method),default_price=VALUES(default_price),unit=VALUES(unit),pricing_metadata=VALUES(pricing_metadata),active_flag=VALUES(active_flag),internal_notes=VALUES(internal_notes);
