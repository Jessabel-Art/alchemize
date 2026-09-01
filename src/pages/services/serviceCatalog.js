import {
  Calculator,
  Compass,
  FileCheck2,
  Landmark,
  Workflow,
  ClipboardCheck,
} from "lucide-react";

export const serviceStatuses = {
  medicare: "planned",
};

const individual = [
  {
    audience: "individuals",
    audienceLabel: "Individual Services",
    slug: "tax-preparation",
    serviceKey: "individual-tax",
    title: "Tax Preparation",
    seoTitle: "Individual Tax Preparation Services | Alchemize",
    seoDescription:
      "Individual tax preparation support with organized records, document review, and virtual filing guidance where service requirements allow.",
    Icon: Calculator,
    statement:
      "Organized tax preparation begins with complete records, clear questions, and a filing process that does not depend on last-minute document searches.",
    hero: "Prepare the return with the records already working in your favor.",
    overview:
      "Tax preparation becomes harder when income records, expenses, prior-year information, and unanswered questions are scattered across different places. Alchemize helps organize the filing process so the return can be prepared from a clearer starting point. Based in North Carolina, support can be delivered virtually where service requirements allow.",
    capabilities: [
      "Federal filing preparation",
      "Tax document organization",
      "Prior-year review",
      "Year-round record readiness",
    ],
    for: [
      "Wage earners",
      "Households with multiple income sources",
      "Self-employed individuals",
      "Taxpayers with changes from the prior year",
      "Clients organizing records before filing",
    ],
    situations: [
      "Income records are arriving from several sources",
      "A life or work change affected the filing picture",
      "Prior-year information needs review",
      "Missing records are delaying preparation",
    ],
    helps: [
      "Individual federal income tax preparation",
      "State income tax preparation where supported",
      "Prior-year return preparation where supported",
      "Income and expense record organization",
      "Estimated-payment record organization",
      "Self-employment record organization within supported filing scope",
      "Missing-document identification",
      "Year-round tax record organization",
    ],
    process: [
      [
        "Gather",
        "Bring income, expense, payment, and prior-year records into one preparation set.",
      ],
      [
        "Review",
        "Identify changes, missing documents, corrections, and questions before preparation.",
      ],
      [
        "Prepare",
        "Prepare the supported return from the organized information and confirmed facts.",
      ],
      [
        "Finalize",
        "Review the filing package, resolve remaining items, and confirm the next step.",
      ],
    ],
    prepare: [
      "Income statements and other income records",
      "Prior-year federal and state returns",
      "Estimated-payment confirmations",
      "Applicable expense and deduction support",
      "Records of major personal or business changes",
      "A list of missing items and questions",
    ],
    boundary:
      "Tax treatment depends on individual circumstances. Alchemize does not provide legal advice or representation services. Supported return types and jurisdictions must be confirmed before engagement; matters outside scope may require a CPA, attorney, enrolled agent, or other qualified professional.",
    checklist: ["Individual Tax Preparation Organizer", null],
    resources: [
      [
        "Individual Tax Preparation Organizer",
        "/resources/preparing-for-tax-season",
      ],
      ["Tax Records: What to Keep", "/resources/tax-records-what-to-keep"],
      [
        "Estimated Taxes: Questions to Ask",
        "/resources/estimated-taxes-questions",
      ],
    ],
    related: [
      [
        "Notary & Document Services",
        "/services/individuals/notary-document-services",
      ],
      [
        "Business Advisory & Optimization",
        "/services/businesses/advisory-optimization",
      ],
    ],
    cta: "Ready to organize the filing process?",
  },
  {
    audience: "individuals",
    audienceLabel: "Individual Services",
    slug: "notary-document-services",
    serviceKey: "individual-notary",
    title: "Notary & Administrative Document Support",
    seoTitle: "North Carolina Notary Services | Alchemize",
    seoDescription:
      "North Carolina notary and nonlegal administrative document support for signatures, acknowledgments, packet organization, and clear appointment expectations.",
    Icon: FileCheck2,
    statement:
      "Prepare the document. Verify the requirements. Complete the appointment correctly.",
    hero: "Prepare the document. Verify the requirements. Complete the appointment correctly.",
    overview:
      "Notary work and administrative document support are related but distinct. Alchemize provides North Carolina notary support and nonlegal packet organization for appointments that require accurate identification, witnessing, and document readiness without selecting forms, drafting legal terms, or interpreting legal consequences.",
    capabilities: [
      "Traditional notarization",
      "Document readiness",
      "Printing and scanning",
      "Packet organization",
    ],
    for: [
      "People preparing for a notary appointment",
      "Clients coordinating signatures or witnesses",
      "People organizing document packets",
      "Businesses needing administrative document support",
    ],
    situations: [
      "A receiving party requires a notarized signature",
      "Identification or witness requirements need confirmation",
      "A document packet needs printing, scanning, conversion, or assembly",
      "Files need a reliable naming and delivery structure",
    ],
    helps: [
      "Traditional notarization where permitted",
      "Identity and signature readiness",
      "Document printing, scanning, and copying",
      "File conversion and digital organization",
      "Document packet assembly",
      "Nonlegal administrative forms using client-provided information",
      "Submission-packet preparation",
      "Administrative proofreading for completeness or format",
    ],
    process: [
      [
        "Prepare",
        "Confirm the document, instructions, signers, witnesses, and appointment details.",
      ],
      [
        "Verify",
        "Complete identification and notarial verification required for the permitted act.",
      ],
      [
        "Execute",
        "Complete signatures, acknowledgments, or jurats in the required sequence.",
      ],
      [
        "Complete",
        "Handle copies, delivery instructions, and administrative records as agreed.",
      ],
    ],
    prepare: [
      "The complete unsigned document unless instructed otherwise",
      "Acceptable identification",
      "All required signers",
      "Required witnesses, if applicable",
      "Instructions from the receiving party",
      "Appointment, location, and return details",
    ],
    boundary:
      "Alchemize does not determine whether a document is legally sufficient, select legal forms, draft legal language, interpret legal consequences, or provide legal advice. Requirements depend on the document, receiving party, applicable law, and commission authority.",
    resources: [
      [
        "Preparing for a Notary Appointment",
        "/resources/preparing-for-a-notary-appointment",
      ],
      ["Consultation Preparation Workbook", null],
    ],
    related: [
      ["Tax Preparation", "/services/individuals/tax-preparation"],
      ["Business Readiness & Growth", "/services/businesses/readiness-growth"],
    ],
    cta: "Need a notary appointment or nonlegal document packet organized?",
  },
  {
    audience: "individuals",
    audienceLabel: "Individual Services",
    slug: "translation-services",
    serviceKey: "individual-translation",
    title: "Translation Services",
    seoTitle: "Document Translation Services | Alchemize",
    seoDescription:
      "Professional document translation services for individuals and businesses, with virtual support available and North Carolina-based coordination where appropriate.",
    Icon: FileCheck2,
    statement:
      "Clear translation support for documents that need to be understandable, organized, and ready for the next step.",
    hero: "Professional document translation support for personal, administrative, and business needs.",
    overview:
      "Translation needs vary by document, destination, and purpose. Based in North Carolina, Alchemize helps organize translated materials, clarify content, and prepare a useful record set for review before the engagement is confirmed, with virtual support available where appropriate.",
    capabilities: [
      "Personal document translation support",
      "Business document translation support",
      "Administrative document organization",
      "Supporting records and correspondence",
    ],
    for: [
      "Individuals preparing personal records for another language",
      "Businesses translating policies, forms, or correspondence",
      "Clients organizing supporting records for a review process",
      "People preparing materials for an agency or institution",
    ],
    situations: [
      "A personal or business record needs translation for a formal review",
      "A form, policy, or letter must be translated before use",
      "Supporting documents are ready but need a consistent language version",
      "A client wants a clear, organized set of materials before submitting them",
    ],
    helps: [
      "Personal document translation support",
      "Business correspondence and form translation",
      "Administrative records and supporting-document translation",
      "Document packet preparation and organization",
      "Review-ready translated materials before submission",
      "Language conversion for client-facing or internal business records",
      "Document organization for agencies, institutions, or business content",
    ],
    process: [
      [
        "Review",
        "Confirm the document, intended destination, source language, and what needs to be translated.",
      ],
      [
        "Organize",
        "Group the supporting records and identify the materials that belong in the translation set.",
      ],
      [
        "Translate",
        "Prepare the requested translation work in a clear, review-ready format based on the selected engagement.",
      ],
      [
        "Confirm",
        "Review the final materials and determine whether additional instructions or follow-up are needed.",
      ],
    ],
    prepare: [
      "The documents that need translation",
      "The source language and desired target language",
      "Any instructions from the receiving party or organization",
      "Related records that should remain attached to the translated packet",
      "Reference materials that clarify terminology or context",
    ],
    boundary:
      "Translation services are design and document-support services and do not guarantee acceptance, certification, legal effect, or any agency-specific result. Some institutions, courts, immigration matters, foreign governments, or other authorities may impose specific translation or certification requirements, and those requirements should be confirmed before service begins.",
    checklist: ["Consultation Preparation Workbook", null],
    resources: [
      ["Consultation Preparation Workbook", null],
      [
        "Preparing for a Notary Appointment",
        "/resources/preparing-for-a-notary-appointment",
      ],
    ],
    related: [
      [
        "Notary & Document Services",
        "/services/individuals/notary-document-services",
      ],
      ["Apostille Services", "/services/individuals/apostille-services"],
    ],
    cta: "Need translated materials prepared clearly and consistently?",
  },
  {
    audience: "individuals",
    audienceLabel: "Individual Services",
    slug: "apostille-services",
    serviceKey: "individual-apostille",
    title: "North Carolina Apostille Facilitation & Support",
    seoTitle: "North Carolina Apostille Facilitation & Support | Alchemize",
    seoDescription:
      "North Carolina apostille facilitation and document-coordination support. Apostilles are issued by the appropriate government authority, not Alchemize.",
    Icon: FileCheck2,
    statement:
      "Document preparation and coordination support for materials that may need authentication for use outside the United States.",
    hero: "Prepare the document set for the destination that will receive it.",
    overview:
      "Alchemize facilitates and supports the North Carolina apostille process by helping organize the document package, coordinate prerequisite notarization or certification where applicable, and prepare submission and return details. Apostilles are issued by the appropriate government authority, not Alchemize, and availability remains pending process readiness.",
    capabilities: [
      "Destination and document review",
      "Document organization",
      "Notarization or certification coordination support",
      "Submission preparation and return handling",
    ],
    for: [
      "Individuals preparing personal records for use abroad",
      "Families coordinating authenticated documents for another country",
      "Businesses preparing corporate records for overseas use",
      "Clients organizing records that may require authentication",
    ],
    situations: [
      "A document will be used in another country or jurisdiction",
      "The receiving authority requires an apostille or comparable authentication",
      "The document may need prior notarization or certification before apostille processing",
      "A client needs help organizing the supporting records for the process",
    ],
    helps: [
      "Review of intended destination and document type",
      "Assessment of whether notarization or certification is required first",
      "Organization of supporting documents and receiving instructions",
      "Document packet preparation and record handling",
      "Coordination of submission requirements and return details",
      "Administrative support for document authentication workflows",
    ],
    process: [
      [
        "Review",
        "Clarify the destination country, document type, and any issuing authority requirements.",
      ],
      [
        "Confirm",
        "Determine whether notarization, certification, or another step is required before apostille processing.",
      ],
      [
        "Organize",
        "Prepare the document set, supporting records, and submission details in an orderly packet.",
      ],
      [
        "Coordinate",
        "Support the return, tracking, and document-handling steps based on the engagement and instructions received.",
      ],
    ],
    prepare: [
      "The document that may require apostille processing",
      "Any applicable notarization or certification records",
      "Instructions from the receiving authority or document source",
      "A copy of the final document set and any supporting records",
      "Destination-country or issuing-authority details when available",
    ],
    boundary:
      "Alchemize provides facilitation and administrative document-coordination support. The apostille is issued by the appropriate government authority, not Alchemize. Government, shipping, courier, and third-party fees are separate. Processing times and issuance are controlled by the issuing authority. Alchemize does not provide legal or immigration advice and does not guarantee issuance or acceptance by a foreign authority.",
    checklist: ["Consultation Preparation Workbook", null],
    resources: [
      ["Consultation Preparation Workbook", null],
      [
        "Preparing for a Notary Appointment",
        "/resources/preparing-for-a-notary-appointment",
      ],
    ],
    related: [
      ["Translation Services", "/services/individuals/translation-services"],
      [
        "Notary & Document Services",
        "/services/individuals/notary-document-services",
      ],
    ],
    cta: "Need a document packet organized for authentication or overseas use?",
  },
];

const business = [
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "advisory-optimization",
    serviceKey: "business-advisory",
    title: "Business Consulting",
    seoTitle: "Small Business Consulting & Advisory Services | Alchemize",
    seoDescription:
      "Small business consulting and advisory support for owners who need clearer priorities, process improvements, and practical next steps for what to change or improve.",
    Icon: Compass,
    statement:
      "Identify what is not working, what is slowing the business down, and what should happen next.",
    hero: "Turn operational friction into a practical plan of action.",
    overview:
      "Alchemize reviews the current situation, traces where information or responsibility breaks down, distinguishes symptoms from causes, and creates an ordered plan for improvement. Consulting diagnoses, recommends, and plans; substantial hands-on implementation requires a separate engagement unless explicitly included.",
    capabilities: [
      "Operational assessment",
      "Process-gap identification",
      "Prioritization",
      "Implementation planning",
    ],
    for: [
      "Entrepreneurs who know something is not working",
      "Owners managing recurring operational friction",
      "Growing businesses needing clearer priorities",
      "Independent professionals preparing to formalize how work gets done",
    ],
    situations: [
      "The same problem keeps returning",
      "The business has too many competing priorities",
      "A decision needs research and operational context",
      "Recommendations exist but no implementation plan does",
    ],
    helps: [
      "Business needs and operational assessment",
      "Administrative efficiency review",
      "Workflow and process-gap analysis",
      "Business organization assessment",
      "Prioritization and action planning",
      "Vendor or provider review",
      "Decision-support research",
      "Implementation planning",
      "Ongoing advisory support where scoped",
    ],
    process: [
      [
        "Assess",
        "Document the current situation, desired result, constraints, and areas of friction.",
      ],
      [
        "Diagnose",
        "Identify the process, information, ownership, or tool problem beneath the symptom.",
      ],
      [
        "Prioritize",
        "Order the work by impact, dependency, urgency, and practical capacity.",
      ],
      [
        "Act",
        "Define practical next steps and identify any implementation work that should be scoped separately.",
      ],
    ],
    prepare: [
      "Description of the problem and desired outcome",
      "Current workflows, tools, and providers",
      "Examples of recurring errors or delays",
      "Known deadlines and constraints",
      "People responsible for the work",
      "Prior recommendations or attempted fixes",
    ],
    boundary:
      "Consulting engagements identify issues, clarify priorities, and develop recommendations or implementation plans. Substantial implementation is priced separately unless explicitly included. Business advisory does not replace legal, accounting, tax, investment, or other regulated professional advice.",
    checklist: ["Consultation Preparation Workbook", null],
    resources: [
      [
        "When Your Business Needs a Process",
        "/resources/business-needs-a-process",
      ],
      [
        "Building a Business Deadline Calendar",
        "/resources/building-a-business-deadline-calendar",
      ],
    ],
    related: [
      ["Business Operations", "/services/businesses/operations-implementation"],
      ["Web & Digital Solutions", "/web-digital"],
    ],
    cta: "Not sure what is creating the friction?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "operations-implementation",
    serviceKey: "business-operations",
    title: "Business Operations",
    seoTitle: "Small Business Operations & Process Support | Alchemize",
    seoDescription:
      "Small business operations support for workflows, process improvement, administrative systems, and practical implementation that helps the business run more smoothly.",
    Icon: Workflow,
    statement:
      "Build the systems and administrative structure behind the work.",
    hero: "A recommendation is only useful if the business can actually operate differently afterward.",
    overview:
      "Alchemize maps the current workflow, identifies where information or responsibility breaks down, documents the required steps, assigns ownership, and helps put the revised process into use.",
    capabilities: [
      "Workflow design",
      "SOP development",
      "Administrative systems",
      "Hands-on implementation",
    ],
    for: [
      "Owners carrying processes in memory",
      "Teams with inconsistent intake or follow-up",
      "Businesses with scattered records",
      "Growing operations that need repeatable systems",
    ],
    situations: [
      "Client information lives in email, texts, and memory",
      "Recurring tasks lack clear ownership",
      "Files and records have no dependable home",
      "A CRM, intake, scheduling, or task system needs implementation",
    ],
    helps: [
      "Administrative system setup",
      "Standard operating procedure development",
      "Workflow design and implementation",
      "Client intake processes",
      "Record-management and document structure",
      "Deadline and renewal tracking",
      "Internal forms and templates",
      "Scheduling and correspondence workflows",
      "CRM setup and organization",
      "Operational cleanup",
      "Recurring administrative support where scoped",
    ],
    process: [
      [
        "Map",
        "Capture how the work moves today, including handoffs, tools, records, and delays.",
      ],
      [
        "Structure",
        "Define the steps, ownership, standards, and information each stage requires.",
      ],
      [
        "Implement",
        "Configure the selected workflow, templates, records, and supporting tools.",
      ],
      [
        "Maintain",
        "Document the process, establish a review rhythm, and adjust when the business changes.",
      ],
    ],
    prepare: [
      "Examples of current work and recurring problems",
      "Existing forms, templates, and procedures",
      "Current tools and account ownership",
      "Roles and responsibilities",
      "Deadlines, renewals, and handoffs",
      "Desired output or service standard",
    ],
    boundary:
      "Operational support is limited to the agreed administrative and implementation scope. Legal, HR, accounting, cybersecurity, and other specialized matters may require another qualified provider.",
    checklist: ["Business Operations & Systems Workbook", null],
    resources: [
      [
        "A Simple Administrative System",
        "/resources/simple-administrative-system",
      ],
      [
        "Business Records: What Needs a Home",
        "/resources/business-records-what-needs-a-home",
      ],
    ],
    related: [
      ["Business Consulting", "/services/businesses/advisory-optimization"],
      ["Web & Digital Solutions", "/web-digital"],
      [
        "Notary & Document Services",
        "/services/individuals/notary-document-services",
      ],
    ],
    cta: "Ready to put the process into place?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "readiness-growth",
    serviceKey: "business-readiness",
    title: "Business Readiness",
    seoTitle: "Small Business Startup & Readiness Support | Alchemize",
    seoDescription:
      "Small business startup support, readiness planning, and launch preparation for entrepreneurs who need stronger records, process clarity, and next-step organization.",
    Icon: ClipboardCheck,
    statement:
      "Prepare the business for formation, organized operations, strategic planning, and the next stage of growth.",
    hero: "Build the records and readiness behind the opportunity.",
    overview:
      "Readiness work organizes business information, registrations, plans, deadlines, and supporting records for launch, growth, strategic planning, and external review. The goal is a stronger planning and decision process—not financing procurement or a promise of approval.",
    capabilities: [
      "Formation preparation",
      "Financial readiness",
      "Planning-material readiness",
      "Growth infrastructure",
    ],
    for: [
      "Entrepreneurs preparing to form or launch",
      "Businesses organizing financial-readiness materials",
      "Owners preparing for registrations or certifications",
      "Companies organizing for government or vendor opportunities",
    ],
    situations: [
      "Formation information and startup steps are scattered",
      "External review requires stronger planning and financial records",
      "SAM.gov or vendor-registration preparation needs coordination",
      "A capability statement or opportunity packet needs organized source information",
    ],
    helps: [
      "Formation and startup administrative preparation",
      "EIN assistance within permitted scope",
      "Launch and foundational-record checklists",
      "Business and growth-readiness assessment",
      "Financial-readiness preparation and supporting-document organization",
      "Business plan support",
      "Capability statement preparation",
      "Certification-readiness support",
      "Nonlegal registration and administrative readiness support",
      "Vendor-record organization",
      "Compliance calendar and documentation readiness",
    ],
    process: [
      [
        "Prepare",
        "Clarify the opportunity, requirements, business facts, and decisions that need qualified guidance.",
      ],
      [
        "Organize",
        "Create a reliable record set and identify missing registrations, documents, or deadlines.",
      ],
      [
        "Position",
        "Assemble the supported plan, capability material, or readiness package for its intended audience.",
      ],
      [
        "Track",
        "Record submissions, follow-up responsibilities, renewal dates, and future readiness work.",
      ],
    ],
    prepare: [
      "Business identity and ownership information",
      "Formation and tax-registration records",
      "Business plan or operating summary",
      "Financial and performance information where relevant",
      "Opportunity or program requirements",
      "Deadlines, registrations, and responsible contacts",
    ],
    boundary:
      "Business planning and financial-readiness support does not include financing procurement, lender matching, lender negotiation, application submission, or financing guarantees. Alchemize does not guarantee formation outcomes, certifications, registrations, vendor acceptance, or legal compliance. Legal, tax, lending, and procurement decisions may require qualified professionals.",
    checklist: ["Business Startup & Formation Workbook", null],
    resources: [
      ["Your First Year in Business", "/resources/your-first-year-in-business"],
      [
        "Business Formation Information to Gather",
        "/resources/business-formation-information-to-gather",
      ],
    ],
    related: [
      [
        "Operations & Implementation",
        "/services/businesses/operations-implementation",
      ],
      ["Web & Digital Solutions", "/web-digital"],
      ["Business Tax Support", "/services/businesses/business-tax-support"],
    ],
    cta: "Preparing the business for what comes next?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "bookkeeping-financial-reporting",
    serviceKey: "business-bookkeeping",
    title: "Bookkeeping",
    seoTitle: "Small Business Bookkeeping & Financial Reporting | Alchemize",
    seoDescription:
      "Small business bookkeeping and financial reporting support with reconciliations, recurring reporting, and virtual service options for growing businesses.",
    Icon: Landmark,
    statement:
      "Organized bookkeeping gives a business a reliable financial record of what is coming in, what is going out, what is owed, and where the business stands.",
    hero: "Organized bookkeeping gives a business a reliable financial record of what is coming in, what is going out, what is owed, and where the business stands.",
    overview:
      "Bookkeeping is not only transaction entry. It is a dependable recordkeeping process that helps a business understand its financial position and maintain useful information for reporting, review, and year-end preparation. Based in North Carolina, Alchemize can provide virtual bookkeeping support across the U.S. where the engagement allows, while structuring the records, reconciling the books, and organizing a recurring process based on the selected service level.",
    capabilities: [
      "Transaction categorization",
      "Bank reconciliation",
      "Credit-card reconciliation",
      "Income and expense tracking",
    ],
    for: [
      "Businesses needing better financial record visibility",
      "Owners who need cleaner bookkeeping before tax or review season",
      "Companies with scattered receipts, invoices, and statements",
      "Businesses wanting recurring financial-reporting support",
    ],
    situations: [
      "The business has too many transactions to categorize without a clear system",
      "Bank and credit-card accounts need reconciliation against recorded activity",
      "Receipts, invoices, and expenses are stored in different places",
      "The owner needs a cleaner view of the company's financial position",
    ],
    helps: [
      "Transaction categorization and review",
      "Bank reconciliation and account matching",
      "Credit-card reconciliation and expense review",
      "Income and expense tracking",
      "Accounts receivable tracking",
      "Accounts payable tracking",
      "General ledger maintenance",
      "Monthly or periodic reporting",
      "Bookkeeping cleanup and historical organization",
      "Documentation organization for tax preparation support",
      "Coordination of records for year-end review",
    ],
    process: [
      [
        "Gather",
        "Collect formation records, bank and credit records, income and expense support, and relevant payroll or contractor information required for the books.",
      ],
      [
        "Review",
        "Identify missing items, inconsistencies, and transactions that need classification or clarification.",
      ],
      [
        "Reconcile",
        "Match recorded transactions to statements and organize the ledger so the books reflect the business's actual activity.",
      ],
      [
        "Report",
        "Produce the reporting and record set aligned with the selected bookkeeping engagement and ongoing service rhythm.",
      ],
    ],
    prepare: [
      "Articles of incorporation or formation records and comparable legal setup documents",
      "EIN and business registration records when relevant",
      "Business checking, savings, loan, and credit card statements",
      "Customer invoices, sales records, vendor bills, receipts, and expense records",
      "Payroll summaries, timesheets, contractor invoices, and relevant payroll records",
      "Equipment, asset, and financing records including purchase dates and supporting statements",
    ],
    boundary:
      "Recurring bookkeeping includes transaction categorization, reconciliations, income and expense tracking, recurring financial reporting, and support appropriate to the selected tier. Tax preparation is a separate service and is not included in monthly bookkeeping. Bookkeeping does not replace CPA, audit, payroll-processing, or investment-advisory services.",
    checklist: ["Business Tax Preparation Organizer", null],
    resources: [
      [
        "Business Records: What Needs a Home",
        "/resources/business-records-what-needs-a-home",
      ],
      [
        "Building a Business Deadline Calendar",
        "/resources/building-a-business-deadline-calendar",
      ],
    ],
    related: [
      ["Payroll", "/services/businesses/payroll-processing"],
      ["Business Tax", "/services/businesses/business-tax-support"],
    ],
    cta: "Need the financial recordkeeping process made clearer and more reliable?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "payroll-processing",
    serviceKey: "business-payroll",
    title: "Payroll",
    seoTitle: "Small Business Payroll Processing Services | Alchemize",
    seoDescription:
      "Payroll processing support for small businesses, including organized payroll records, recurring reporting, and virtual administration where the selected workflow allows.",
    Icon: Landmark,
    statement:
      "Payroll administration and processing through the applicable payroll platform, with organized payroll records and recurring reporting.",
    hero: "Structured payroll support for businesses that need dependable employee and contractor payment administration, organized payroll records, and recurring payroll reporting.",
    overview:
      "Payroll work requires dependable information, clear process ownership, and an organized record trail. Based in North Carolina, Alchemize can support small-business payroll processing and payroll administration with virtual coordination across the U.S. where the selected payroll platform and service scope allow.",
    capabilities: [
      "Payroll setup",
      "Recurring payroll processing coordination",
      "Employee payroll records",
      "Contractor payment records",
    ],
    for: [
      "Businesses managing employee or contractor payments",
      "Owners who need more organized payroll records",
      "Companies needing recurring payroll reporting and documentation",
      "Teams coordinating payroll information across schedules and deductions",
    ],
    situations: [
      "Payroll data is being tracked in multiple places",
      "Employee or contractor records need cleaner organization",
      "A business needs recurring payroll summaries and reconciliation support",
      "Year-end payroll records need better coordination and cleanup",
    ],
    helps: [
      "Employee setup and recurring payroll data collection",
      "Payroll schedule and pay-period organization",
      "Wage and hour record preparation support",
      "Deduction tracking and payroll-summary organization",
      "Contractor payment record maintenance",
      "Payroll reconciliation and report preparation",
      "Payroll record maintenance and review",
      "Year-end payroll record coordination",
      "Administrative support for payroll data cleanup",
    ],
    process: [
      [
        "Assess",
        "Confirm the payroll process, employee and contractor information, pay schedule, and required reporting structure.",
      ],
      [
        "Organize",
        "Collect the payroll records, schedules, and supporting details in a review-ready format.",
      ],
      [
        "Process",
        "Coordinate payroll administration and reporting through the selected payroll platform or agreed process.",
      ],
      [
        "Review",
        "Confirm summary records, reconcile exceptions, and support the final record set before the next payroll cycle or annual close.",
      ],
    ],
    prepare: [
      "Employee and contractor information",
      "Pay schedules and relevant payroll calendars",
      "Wage, deduction, and reimbursement information",
      "Timesheet, payroll summary, and contractor invoice records",
      "W-9 and 1099-related information where applicable",
      "Prior payroll records and year-end reporting documents",
    ],
    boundary:
      "Payroll support is administrative and operational. Alchemize enters payroll and W-4 information as supplied and does not advise employees how to complete withholding elections. Alchemize does not provide HR, employment-law, legal, or individualized tax advice and does not replace the payroll platform’s tax filing or deposit functions. Platform/software charges are separate.",
    checklist: ["Business Tax Preparation Organizer", null],
    resources: [
      [
        "Business Records: What Needs a Home",
        "/resources/business-records-what-needs-a-home",
      ],
      [
        "Building a Business Deadline Calendar",
        "/resources/building-a-business-deadline-calendar",
      ],
    ],
    related: [
      ["Bookkeeping", "/services/businesses/bookkeeping-financial-reporting"],
      ["Business Tax", "/services/businesses/business-tax-support"],
    ],
    cta: "Need payroll records and administration organized more reliably?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "business-tax-support",
    serviceKey: "business-financial",
    title: "Business Tax",
    seoTitle: "Small Business Tax Preparation & Support | Alchemize",
    seoDescription:
      "Small business tax preparation and support for organized records, year-end readiness, and virtual tax document preparation where service requirements allow.",
    Icon: Landmark,
    statement:
      "Business tax responsibilities are easier to manage when records, deadlines, and required documents are organized before filing season arrives.",
    hero: "Business tax responsibilities are easier to manage when records, deadlines, and required documents are organized before filing season arrives.",
    overview:
      "Business tax work becomes more manageable when the owner has a clearer record set, a practical timeline, and a realistic understanding of what must be assembled for filing. Based in North Carolina, Alchemize can help organize the information needed for applicable small business tax preparation, year-end readiness, and estimated-tax planning support through virtual coordination where service requirements allow.",
    capabilities: [
      "Business tax preparation",
      "Tax document organization",
      "Year-end tax readiness",
      "Estimated tax planning support",
    ],
    for: [
      "Small business owners preparing for filing season",
      "Entrepreneurs organizing business income and expense records",
      "Businesses collecting prior-year information for tax preparation",
      "Founders preparing for estimated tax and year-end readiness work",
    ],
    situations: [
      "The business has records spread across several places before filing season",
      "The owner needs a cleaner tax record set for the next filing cycle",
      "A business needs help identifying missing documents and tax-ready records",
      "Year-end obligations are approaching and the record set needs review",
    ],
    helps: [
      "Business tax preparation support for applicable return types",
      "Tax document organization and filing-readiness review",
      "Business income and expense documentation readiness",
      "Prior-year information gathering and organization",
      "Estimated tax preparation support and tracking",
      "Contractor and payroll tax documentation readiness where relevant",
      "Year-end tax readiness and deadline awareness",
      "Documentation review before a filing or professional handoff",
    ],
    process: [
      [
        "Organize",
        "Compile the income, expense, payroll, contractor, and prior-year records needed for the tax process.",
      ],
      [
        "Review",
        "Identify what is missing, what needs clarification, and what must be prepared before filing.",
      ],
      [
        "Prepare",
        "Assemble the records and supporting information required for the appropriate business tax preparation workflow.",
      ],
      [
        "Confirm",
        "Establish a practical next step, filing timeline, and handoff path for the next stage of the engagement.",
      ],
    ],
    prepare: [
      "Business income records and supporting statements",
      "Expense documentation and receipts",
      "Prior-year business tax returns and related records",
      "Payroll summaries and contractor payment records where applicable",
      "Estimated tax payment records and supporting notes",
      "Assets, purchases, and business-use vehicle information when relevant",
      "Tax correspondence, deadlines, and filing-related notices",
    ],
    boundary:
      "Business tax support is centered on organization, preparation, and readiness. Alchemize does not provide legal tax advice, representation, or professional tax strategy beyond the defined service scope. Supported return types, tax obligations, and jurisdictions must be confirmed before engagement; specialized work may require a CPA, attorney, enrolled agent, or other qualified professional.",
    checklist: ["Business Tax Preparation Organizer", null],
    resources: [
      [
        "Business Records: What Needs a Home",
        "/resources/business-records-what-needs-a-home",
      ],
      [
        "Building a Business Deadline Calendar",
        "/resources/building-a-business-deadline-calendar",
      ],
    ],
    related: [
      [
        "Bookkeeping & Financial Reporting",
        "/services/businesses/bookkeeping-financial-reporting",
      ],
      ["Payroll Processing", "/services/businesses/payroll-processing"],
    ],
    cta: "Need your business tax records organized before filing season?",
  },
];

const canonicalServiceOrder = [
  "individual-tax",
  "individual-notary",
  "individual-translation",
  "business-advisory",
  "business-operations",
  "business-digital",
  "business-readiness",
  "business-bookkeeping",
  "business-payroll",
  "business-financial",
];

const sortByCanonicalOrder = (services) => {
  const indexMap = new Map(
    canonicalServiceOrder.map((serviceKey, index) => [serviceKey, index]),
  );

  return [...services].sort((a, b) => {
    const aIndex = indexMap.get(a.serviceKey) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = indexMap.get(b.serviceKey) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
};

const businessServiceEntries = [
  ...business,
  { serviceKey: "business-digital", title: "Web & Digital Solutions" },
];

export const serviceCatalog = [...individual, ...business];
export const serviceGroups = {
  individuals: individual,
  businesses: sortByCanonicalOrder(business),
};
export const contactServiceGroups = [
  {
    audience: "individual",
    label: "Individual Services",
    items: individual
      .filter((service) => service.serviceKey !== "individual-apostille")
      .map(({ serviceKey, title }) => ({ value: serviceKey, label: title })),
  },
  {
    audience: "business",
    label: "Business Services",
    items: sortByCanonicalOrder(businessServiceEntries).map(
      ({ serviceKey, title }) => ({ value: serviceKey, label: title }),
    ),
  },
];
export const findService = (audience, slug) =>
  serviceCatalog.find(
    (service) => service.audience === audience && service.slug === slug,
  );

export const legacyServiceRoutes = {
  "business-formation": "/services/businesses/readiness-growth",
  "administration-operations": "/services/businesses/operations-implementation",
  "business-tax": "/services/businesses/business-tax-support",
  "financial-tax-support": "/services/businesses/business-tax-support",
  "business-advisory": "/services/businesses/advisory-optimization",
  "digital-business-technology": "/web-digital",
  "notary-administrative-services":
    "/services/individuals/notary-document-services",
};
