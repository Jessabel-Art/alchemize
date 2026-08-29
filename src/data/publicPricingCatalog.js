// Public-only fallback for static builds/API outages. Runtime pages replace this
// with the sanitized canonical Services API response. Never add internal notes.
const tier = (tierKey, tierName, basePrice, billingFrequency, scope, extras = {}) => ({
  tierKey, tierName, basePrice, billingFrequency, scope, status: "ACTIVE",
  pricingType: "FIXED", active: true, limits: {}, ...extras,
});

export const publicPricingFallback = [
  { serviceCode: "google-business-profile", serviceName: "Google Business Profile Setup & Optimization", status: "ACTIVE", active: true, tiers: [tier("setup-optimization", "Setup & Optimization", 399, "ONE_TIME", ["Profile setup and optimization", "Categories, services, hours, and service areas", "Photo, content, and maintenance guidance"])] },
  { serviceCode: "business-consulting", serviceName: "Business Consulting", status: "ACTIVE", active: true, tiers: [
    tier("foundation-assessment", "Business Foundation Assessment", 249, "ONE_TIME", ["60–90 minute discovery", "Operational gap review", "Prioritized written action plan"]),
    tier("focused-strategy", "Focused Strategy Session", 199, "ONE_TIME", ["Up to 90 minutes", "One defined challenge", "Documented next steps"]),
    tier("half-day-intensive", "Half-Day Business Intensive", 499, "ONE_TIME", ["Up to approximately four hours", "Process and systems analysis", "Implementation planning and brief follow-up"]),
    tier("full-day-intensive", "Full-Day Business Intensive", 899, "ONE_TIME", ["Up to approximately eight hours", "Connected issue analysis", "Written action plan and 30-minute follow-up"]),
  ] },
  { serviceCode: "business-startup", serviceName: "Business Startup Package", status: "ACTIVE", active: true, tiers: [tier("startup-package", "Business Startup Package", 799, "ONE_TIME", ["Foundation assessment and startup roadmap", "Operations consultation and readiness checklist", "Google Business Profile setup", "Two implementation meetings"])] },
  { serviceCode: "bookkeeping", serviceName: "Bookkeeping", status: "ACTIVE", active: true, tiers: [
    tier("essentials", "Essentials", 249, "MONTHLY", ["Transaction categorization", "Monthly reconciliations", "Income/expense tracking", "Recurring financial reports"], { limits: { max_transactions: 100, max_accounts: 2 } }),
    tier("growth", "Growth", 399, "MONTHLY", ["Everything in Essentials", "Higher-volume support", "Quarterly review discussion"], { limits: { min_transactions: 101, max_transactions: 300, max_accounts: 4 } }),
    tier("operations", "Operations", 599, "MONTHLY", ["Higher-volume bookkeeping and reporting", "Monthly financial review", "Priority bookkeeping support"], { limits: { min_transactions: 301, max_transactions: 600, max_accounts: 6 } }),
    tier("cleanup", "Bookkeeping Cleanup", null, "ONE_TIME", ["First month behind: $250", "Each additional month: +$125"], { pricingType: "FORMULA", minimumPrice: 250, displayPrice: "$250 first month + $125 each additional month" }),
    tier("custom", "Higher-volume / complex bookkeeping", null, "CUSTOM", ["More than 600 transactions", "More than six applicable accounts", "Severe or reconstruction-heavy cleanup"], { pricingType: "CUSTOM_SOW", status: "MANUAL_REVIEW" }),
  ] },
  { serviceCode: "payroll", serviceName: "Payroll", status: "ACTIVE", active: true, tiers: [
    tier("setup", "Payroll Setup", 199, "ONE_TIME", ["Platform selection and setup assistance", "Administrative configuration"]),
    tier("1-5-employees", "1–5 Employees", 99, "MONTHLY", ["Recurring payroll administration", "Payroll records and reporting", "Routine platform coordination"], { limits: { max_employees: 5 } }),
    tier("6-15-employees", "6–15 Employees", 149, "MONTHLY", ["Recurring payroll administration", "Payroll records and reporting", "Routine platform coordination"], { limits: { min_employees: 6, max_employees: 15 } }),
    tier("16-30-employees", "16–30 Employees", 199, "MONTHLY", ["Recurring payroll administration", "Payroll records and reporting", "Routine platform coordination"], { limits: { min_employees: 16, max_employees: 30 } }),
    tier("31-plus", "31+ Employees", null, "CUSTOM", ["Scope review required"], { pricingType: "CUSTOM_SOW", status: "CUSTOM_SOW_ONLY" }),
  ] },
  { serviceCode: "financial-reporting", serviceName: "Financial Reporting", status: "ACTIVE", active: true, tiers: [
    tier("reporting-package", "Financial Reporting Package", 249, "ONE_TIME", ["Profit & Loss and Balance Sheet", "Cash-flow summary and trends", "Plain-language summary and review"]),
    tier("quarterly-review", "Quarterly Financial Review", 399, "QUARTERLY", ["Quarterly statements and comparisons", "Basic KPI analysis", "Written observations and review"]),
    tier("reporting-forecast", "Financial Reporting + Forecast", 599, "ONE_TIME", ["Quarterly review scope", "Basic 12-month cash-flow forecast", "Basic scenarios and review"], { pricingType: "STARTING_AT", minimumPrice: 599 }),
    tier("advanced-modeling", "Advanced Financial Modeling", null, "CUSTOM", ["Custom scenarios and modeling scope"], { pricingType: "CUSTOM_SOW", status: "CUSTOM_SOW_ONLY" }),
  ] },
  { serviceCode: "website-design", serviceName: "Website Design & Development", status: "ACTIVE", active: true, tiers: [
    tier("launch", "Website Launch", 1250, "ONE_TIME", ["Up to three core pages", "One structured revision round", "SEO foundation", "30-day defect support"], { limits: { max_pages: 3, revision_rounds: 1 } }),
    tier("growth", "Website Growth", 1850, "ONE_TIME", ["Up to six core pages", "Two structured revision rounds", "Enhanced SEO and service-page structure", "30-day defect support"], { limits: { max_pages: 6, revision_rounds: 2 } }),
    tier("custom", "Custom Website", null, "CUSTOM", ["Seven or more substantial pages", "Complex functionality, integrations, commerce, or migration"], { pricingType: "CUSTOM_SOW", status: "CUSTOM_SOW_ONLY" }),
    tier("web-application", "Digital Business System / Web Application", null, "CUSTOM", ["Portals, dashboards, authentication, databases, payments, APIs, or custom workflows"], { pricingType: "CUSTOM_SOW", status: "CUSTOM_SOW_ONLY" }),
  ] },
  { serviceCode: "website-maintenance", serviceName: "Website Maintenance", status: "ACTIVE", active: true, tiers: [
    tier("care", "Website Care", 99, "MONTHLY", ["Routine monitoring and updates", "Up to 30 minutes of content changes", "Monthly website health check"]),
    tier("management", "Website Management", 199, "MONTHLY", ["Everything in Care", "Up to two hours of website changes", "Analytics and quarterly review"]),
    tier("managed", "Managed Website", 349, "MONTHLY", ["Up to four hours monthly", "Priority content and conversion updates", "Monthly review and quarterly strategy"]),
    tier("outside-site-audit", "Outside-Site Onboarding Audit", 149, "ONE_TIME", ["Required for websites Alchemize did not build"]),
  ] },
  { serviceCode: "seo", serviceName: "SEO", status: "ACTIVE", active: true, tiers: [
    tier("audit", "Website SEO Audit", 299, "ONE_TIME", ["Technical and on-page review", "Written priority action report", "Approximately 60-minute debrief"]),
    tier("implementation", "SEO Implementation", 499, "ONE_TIME", ["Agreed recommendations for up to five core pages", "Technical corrections and final verification"], { pricingType: "STARTING_AT", minimumPrice: 499 }),
    tier("local-foundation", "Local SEO Foundation", 599, "ONE_TIME", ["Local research and up to five existing pages", "Local schema, NAP, Search Console, and GBP review"]),
    tier("local", "Local SEO", 399, "MONTHLY", ["Monitoring, GBP maintenance, and page optimization", "Monthly report and quarterly strategy review"]),
    tier("growth", "SEO Growth", 699, "MONTHLY", ["Broader strategy and three page optimizations", "One article or standard content page monthly", "Deeper analysis and recommendations"]),
    tier("custom", "Large / Competitive / Multi-location SEO", null, "CUSTOM", ["Custom scope review required"], { pricingType: "CUSTOM_SOW", status: "CUSTOM_SOW_ONLY" }),
  ] },
  { serviceCode: "business-operations", serviceName: "Business Operations & Implementation", status: "ACTIVE", active: true, tiers: [
    tier("workflow-implementation", "Process & Workflow Implementation", 499, "ONE_TIME", ["One defined workflow", "Process map, implementation, and instructions", "Training and one revision"]),
    tier("systems-setup", "Business Systems Setup", 799, "ONE_TIME", ["Requirements and platform recommendation", "Basic setup, integration, import, and instructions", "Training and implementation support"]),
    tier("improvement-sprint", "Operations Improvement Sprint", 1499, "ONE_TIME", ["Defined 2–3 week engagement", "Up to three connected workflows", "SOPs, configuration, training, and follow-up"]),
    tier("transformation", "Operational Transformation", null, "CUSTOM", ["Four or more workflows, departments, major migration, integrations, or custom software"], { pricingType: "CUSTOM_SOW", status: "CUSTOM_SOW_ONLY" }),
  ] },
  { serviceCode: "administrative-support", serviceName: "Administrative Support", status: "ACTIVE", active: true, tiers: [
    tier("as-needed", "As-Needed Administrative Support", 60, "HOURLY", ["Operational and administrative business support", "Two-hour / $120 minimum"], { pricingType: "FORMULA", minimumPrice: 120 }),
    tier("essentials", "Administrative Essentials", 275, "MONTHLY", ["Five included hours monthly"]),
    tier("support", "Administrative Support", 525, "MONTHLY", ["Ten included hours monthly"]),
    tier("partner", "Administrative Partner", 950, "MONTHLY", ["Twenty included hours monthly"]),
  ] },
  { serviceCode: "translation", serviceName: "Translation", status: "ACTIVE", active: true, tiers: [
    tier("standard-page", "Standard Short Document", 35, "PER_PAGE", ["Up to 250 source words per page"]),
    tier("general", "General / Business Translation", null, "PER_WORD", ["$0.15 per source word", "$35 minimum"], { pricingType: "FORMULA", minimumPrice: 35, displayPrice: "$0.15/source word · $35 minimum" }),
    tier("certified", "Certified & Official-Use Translation", 45, "PER_PAGE", ["Complete English/Spanish translation", "Certificate of Translation Accuracy", "Digital PDF and one correction round"]),
  ] },
  { serviceCode: "apostille", serviceName: "North Carolina Apostille Facilitation & Support", status: "PENDING_AUTHORIZATION", active: false, tiers: [tier("facilitation", "North Carolina Apostille Facilitation & Support", 149, "PER_DOCUMENT", ["Process guidance and document coordination", "First document: $149", "Each additional document in the same engagement: +$40"], { pricingType: "REGULATED_PENDING", status: "PENDING_AUTHORIZATION", active: false })], addOns: [{ key: "additional-document", name: "Additional document", price: 40, unit: "document", active: false }] },
  { serviceCode: "business-planning", serviceName: "Business Planning & Financial Readiness", status: "ACTIVE", active: true, tiers: [
    tier("foundation", "Business Plan Foundation", 799, "ONE_TIME", ["Professional core business plan", "Basic market and competitor research", "Simple startup/revenue assumptions", "Two revision rounds"]),
    tier("financial-readiness", "Business Plan & Financial Readiness", 1299, "ONE_TIME", ["Deeper analysis and documented assumptions", "Projected P&L, cash-flow forecast, and break-even analysis", "Supporting-document readiness checklist"]),
    tier("comprehensive", "Comprehensive Business Plan", 1999, "ONE_TIME", ["Research-heavy external-facing plan", "Multiple streams, locations, scenarios, or capital requirements"], { pricingType: "STARTING_AT", minimumPrice: 1999 }),
    tier("advanced-modeling", "Advanced Financial Modeling", null, "CUSTOM", ["Custom modeling scope"], { pricingType: "CUSTOM_SOW", status: "CUSTOM_SOW_ONLY" }),
  ] },
  { serviceCode: "digital-automation", serviceName: "Digital Business Solutions & Automation", status: "ACTIVE", active: true, tiers: [
    tier("workflow", "Workflow Automation", 499, "ONE_TIME", ["One defined process", "Up to three connected applications", "Testing, documentation, and handoff"], { pricingType: "STARTING_AT", minimumPrice: 499 }),
    tier("connected", "Connected Business Automation", 999, "ONE_TIME", ["Several related automations", "Up to five connected applications", "Mapping, testing, documentation, and training"], { pricingType: "STARTING_AT", minimumPrice: 999 }),
    tier("advanced", "Advanced Digital Business Solution", null, "CUSTOM", ["Complex APIs, AI, sensitive data, migration, payments, authentication, or substantial custom code"], { pricingType: "CUSTOM_SOW", status: "CUSTOM_SOW_ONLY" }),
  ] },
];

export const pricingServiceMap = {
  "individual-tax": ["tax-preparation"],
  "individual-notary": ["notary"],
  "individual-translation": ["translation"],
  "individual-apostille": ["apostille"],
  "business-advisory": ["business-consulting"],
  "business-operations": ["business-operations", "administrative-support"],
  "business-digital": ["google-business-profile", "website-design", "website-maintenance", "seo", "digital-automation"],
  "business-readiness": ["business-startup", "business-planning"],
  "business-bookkeeping": ["bookkeeping", "financial-reporting"],
  "business-payroll": ["payroll"],
  "business-financial": ["tax-preparation"],
};
