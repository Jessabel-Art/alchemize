import {
  Calculator,
  Compass,
  FileCheck2,
  Landmark,
  MonitorCog,
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
    Icon: Calculator,
    statement:
      "Organized tax preparation begins with complete records, clear questions, and a filing process that does not depend on last-minute document searches.",
    hero: "Prepare the return with the records already working in your favor.",
    overview:
      "Tax preparation becomes harder when income records, expenses, prior-year information, and unanswered questions are scattered across different places. Alchemize helps organize the filing process so the return can be prepared from a clearer starting point.",
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
    checklist: [
      "Tax Preparation Checklist",
      "/assets/downloads/individual-tax-preparation-checklist.pdf",
    ],
    resources: [
      ["Preparing for Tax Season", "/resources/preparing-for-tax-season"],
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
    title: "Notary & Document Services",
    Icon: FileCheck2,
    statement:
      "Prepare the document. Verify the requirements. Complete the appointment correctly.",
    hero: "Prepare the document. Verify the requirements. Complete the appointment correctly.",
    overview:
      "Notary work and document support are related but distinct. Alchemize can perform authorized notarial acts and help organize non-legal administrative document work without selecting forms or interpreting legal consequences.",
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
      "Administrative form support using client-provided information",
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
    checklist: [
      "Notary & Document Readiness Checklist",
      "/assets/downloads/notary-appointment-checklist.pdf",
    ],
    resources: [
      [
        "Preparing for a Notary Appointment",
        "/resources/preparing-for-a-notary-appointment",
      ],
      [
        "Documents to Bring to a Consultation",
        "/assets/downloads/alchemize-consultation-document-checklist.pdf",
      ],
    ],
    related: [
      ["Tax Preparation", "/services/individuals/tax-preparation"],
      ["Business Readiness & Growth", "/services/businesses/readiness-growth"],
    ],
    cta: "Need a document or notarization prepared correctly?",
  },
  {
    audience: "individuals",
    audienceLabel: "Individual Services",
    slug: "translation-services",
    serviceKey: "individual-translation",
    title: "Translation Services",
    Icon: FileCheck2,
    statement:
      "Clear translation support for documents that need to be understandable, organized, and ready for the next step.",
    hero: "Professional document translation support for personal, administrative, and business needs.",
    overview:
      "Translation needs vary by document, destination, and purpose. Alchemize helps organize translated materials, clarify content, and prepare a useful record set for review before the engagement is confirmed.",
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
    checklist: [
      "Translation Services Preparation Checklist",
      "/assets/downloads/alchemize-consultation-document-checklist.pdf",
    ],
    resources: [
      [
        "Documents to Bring to a Consultation",
        "/assets/downloads/alchemize-consultation-document-checklist.pdf",
      ],
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
    title: "Apostille Services",
    Icon: FileCheck2,
    statement:
      "Document preparation and coordination support for materials that may need authentication for use outside the United States.",
    hero: "Prepare the document set for the destination that will receive it.",
    overview:
      "Apostille processing may involve reviewing the intended destination, identifying whether notarization or certification is required first, and helping organize the document package for the correct authentication process. Alchemize focuses on administrative and document-coordination support rather than legal or immigration guidance.",
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
      "Apostille services are administrative and document-coordination support. Alchemize does not guarantee apostille approval, processing time, legal advice, immigration advice, or acceptance by a foreign government. Requirements vary by document type, issuing authority, destination country, and whether the destination participates in the Hague Apostille Convention or requires additional authentication.",
    checklist: [
      "Apostille Services Preparation Checklist",
      "/assets/downloads/alchemize-consultation-document-checklist.pdf",
    ],
    resources: [
      [
        "Documents to Bring to a Consultation",
        "/assets/downloads/alchemize-consultation-document-checklist.pdf",
      ],
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
    title: "Business Advisory & Optimization",
    Icon: Compass,
    statement:
      "Identify what is not working, what is slowing the business down, and what should happen next.",
    hero: "Turn operational friction into a practical plan of action.",
    overview:
      "Alchemize reviews the current situation, traces where information or responsibility breaks down, distinguishes symptoms from causes, and creates an ordered plan for improvement. When implementation falls within scope, the work can continue beyond recommendations.",
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
        "Define the next steps and implement supported changes where Alchemize can help.",
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
      "Business advisory does not replace legal, accounting, tax, investment, or other regulated professional advice. Recommendations and implementation scope depend on the information available and the engagement agreed.",
    checklist: [
      "Business Advisory Preparation Guide",
      "/assets/downloads/business-advisory-preparation-guide.pdf",
    ],
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
      [
        "Operations & Implementation",
        "/services/businesses/operations-implementation",
      ],
      [
        "Digital Business & Technology",
        "/services/businesses/digital-business-technology",
      ],
    ],
    cta: "Not sure what is creating the friction?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "operations-implementation",
    serviceKey: "business-operations",
    title: "Business Operations & Implementation",
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
    checklist: [
      "Business Operations Organization Checklist",
      "/assets/downloads/business-operations-organization-checklist.pdf",
    ],
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
      [
        "Business Advisory & Optimization",
        "/services/businesses/advisory-optimization",
      ],
      [
        "Digital Business & Technology",
        "/services/businesses/digital-business-technology",
      ],
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
    slug: "digital-business-technology",
    serviceKey: "business-digital",
    title: "Digital Business & Technology",
    Icon: MonitorCog,
    statement:
      "Use technology to support the business process, not complicate it.",
    hero: "Make the tools support the way the business needs to work.",
    overview:
      "Technology implementation starts with the business process. Alchemize helps select, configure, connect, and document practical digital infrastructure so the tool has a clear purpose, owner, and place in the workflow.",
    capabilities: [
      "Website and domain setup",
      "CRM and intake",
      "Workflow automation",
      "Digital workspace organization",
    ],
    for: [
      "Businesses assembling their digital foundation",
      "Owners replacing disconnected manual steps",
      "Teams implementing booking, intake, CRM, or document systems",
      "Businesses needing clearer ownership of digital accounts",
    ],
    situations: [
      "The website or business email is not professionally configured",
      "The same information is entered in several tools",
      "Scheduling, intake, and follow-up do not connect",
      "No one knows who owns accounts, access, or vendor relationships",
    ],
    helps: [
      "Business website setup or improvement",
      "Domain and professional email configuration",
      "Booking and scheduling system setup",
      "CRM implementation",
      "Digital intake forms",
      "Client portal setup",
      "Business software selection and configuration",
      "Workflow automation and tool integrations",
      "Cloud workspace and digital file organization",
      "Basic reporting setup",
      "Digital account and vendor inventory",
    ],
    process: [
      [
        "Assess",
        "Define the business process, current tools, pain points, ownership, and desired result.",
      ],
      [
        "Select",
        "Choose a fit-for-purpose tool or determine whether an existing tool should be retained.",
      ],
      [
        "Configure",
        "Set up the core structure, fields, permissions, templates, and workflow.",
      ],
      [
        "Connect",
        "Integrate supported steps, document ownership, and show the team how the system works.",
      ],
    ],
    prepare: [
      "Current tool and vendor inventory",
      "Account owners and access information (shared securely only when instructed)",
      "Description of the current process",
      "Examples of forms, emails, and records",
      "Required integrations",
      "Budget, timeline, and responsible users",
    ],
    boundary:
      "This service is business technology implementation, not managed IT, enterprise software development, penetration testing, or cybersecurity consulting. Security-sensitive work and unsupported integrations may require a specialized provider.",
    checklist: [
      "Digital Business Systems Assessment Checklist",
      "/assets/downloads/digital-business-systems-assessment-checklist.pdf",
    ],
    resources: [
      [
        "When Your Business Needs a Process",
        "/resources/business-needs-a-process",
      ],
      [
        "A Simple Administrative System",
        "/resources/simple-administrative-system",
      ],
    ],
    related: [
      [
        "Operations & Implementation",
        "/services/businesses/operations-implementation",
      ],
      [
        "Business Advisory & Optimization",
        "/services/businesses/advisory-optimization",
      ],
    ],
    cta: "Need the tools to work together?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "readiness-growth",
    serviceKey: "business-readiness",
    title: "Business Readiness & Growth",
    Icon: ClipboardCheck,
    statement:
      "Prepare the business for formation, opportunities, funding, certifications, and the next stage of growth.",
    hero: "Build the records and readiness behind the opportunity.",
    overview:
      "Readiness work organizes the business information, registrations, plans, deadlines, and supporting records an opportunity may require. The goal is a stronger submission or decision process—not a promise of approval or award.",
    capabilities: [
      "Formation preparation",
      "Funding readiness",
      "Contracting readiness",
      "Growth infrastructure",
    ],
    for: [
      "Entrepreneurs preparing to form or launch",
      "Businesses evaluating funding readiness",
      "Owners preparing for registrations or certifications",
      "Companies organizing for government or vendor opportunities",
    ],
    situations: [
      "Formation information and startup steps are scattered",
      "A funding conversation requires stronger records",
      "SAM.gov or vendor-registration preparation needs coordination",
      "A capability statement or opportunity packet needs organized source information",
    ],
    helps: [
      "Formation and startup administrative preparation",
      "EIN assistance within permitted scope",
      "Launch and foundational-record checklists",
      "Business and growth-readiness assessment",
      "Funding-readiness preparation and opportunity tracking",
      "Business plan support",
      "Capability statement preparation",
      "Certification-readiness support",
      "Government-contracting and SAM.gov preparation support",
      "Vendor registration",
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
      "Alchemize does not guarantee formation outcomes, funding, loan approval, grants, certifications, SAM.gov validation, government contracts, vendor acceptance, or legal compliance. Legal, tax, lending, and procurement decisions may require qualified third parties.",
    checklist: [
      "Business Formation & Readiness Checklist",
      "/assets/downloads/business-formation-startup-checklist.pdf",
    ],
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
      [
        "Digital Business & Technology",
        "/services/businesses/digital-business-technology",
      ],
      ["Business Tax Support", "/services/businesses/business-tax-support"],
    ],
    cta: "Preparing the business for what comes next?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "bookkeeping-financial-reporting",
    serviceKey: "business-bookkeeping",
    title: "Bookkeeping & Financial Reporting",
    Icon: Landmark,
    statement:
      "Organized bookkeeping gives a business a reliable financial record of what is coming in, what is going out, what is owed, and where the business stands.",
    hero: "Organized bookkeeping gives a business a reliable financial record of what is coming in, what is going out, what is owed, and where the business stands.",
    overview:
      "Bookkeeping is not only transaction entry. It is a dependable recordkeeping process that helps a business understand its financial position and maintain useful information for reporting, review, and year-end preparation. Alchemize can help structure the records, reconcile the books, and organize a recurring process based on the selected service level.",
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
        "Collect the legal setup records, bank and credit records, income and expense support, and relevant payroll or contractor information required for the books.",
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
      "Bookkeeping support covers organized financial recordkeeping and reporting based on the selected engagement. It does not replace CPA, auditor, tax-preparer, payroll-processing, or investment-advisory services. Organized books can help prepare cleaner records for year-end tax preparation and professional review.",
    checklist: [
      "Bookkeeping & Financial Reporting Preparation Checklist",
      "/assets/downloads/business-tax-preparation-checklist.pdf",
    ],
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
      ["Payroll Processing", "/services/businesses/payroll-processing"],
      ["Business Tax Support", "/services/businesses/business-tax-support"],
    ],
    cta: "Need the financial recordkeeping process made clearer and more reliable?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "payroll-processing",
    serviceKey: "business-payroll",
    title: "Payroll Processing",
    Icon: Landmark,
    statement:
      "Structured payroll support for businesses that need dependable employee and contractor payment administration, organized payroll records, and recurring payroll reporting.",
    hero: "Structured payroll support for businesses that need dependable employee and contractor payment administration, organized payroll records, and recurring payroll reporting.",
    overview:
      "Payroll work requires dependable information, clear process ownership, and an organized record trail. Alchemize can help support payroll setup, payroll record maintenance, recurring payroll reporting, and year-end coordination using the selected payroll platform and agreed service scope.",
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
      "Payroll support is administrative and operational in nature. Alchemize does not claim direct tax-remittance responsibility unless it is specifically established through the selected payroll platform and the agreed workflow. Supported payroll capabilities, platform requirements, and legal obligations must be confirmed before engagement.",
    checklist: [
      "Payroll Processing Preparation Checklist",
      "/assets/downloads/business-tax-preparation-checklist.pdf",
    ],
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
      ["Business Tax Support", "/services/businesses/business-tax-support"],
    ],
    cta: "Need payroll records and administration organized more reliably?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "business-tax-support",
    serviceKey: "business-financial",
    title: "Business Tax Support",
    Icon: Landmark,
    statement:
      "Business tax responsibilities are easier to manage when records, deadlines, and required documents are organized before filing season arrives.",
    hero: "Business tax responsibilities are easier to manage when records, deadlines, and required documents are organized before filing season arrives.",
    overview:
      "Business tax work becomes more manageable when the owner has a clearer record set, a practical timeline, and a realistic understanding of what must be assembled for filing. Alchemize can help organize the information needed for applicable business tax preparation, year-end readiness, and estimated-tax planning support based on the selected engagement and scope.",
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
    checklist: [
      "Business Tax Support Preparation Checklist",
      "/assets/downloads/business-tax-preparation-checklist.pdf",
    ],
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

export const serviceCatalog = [...individual, ...business];
export const serviceGroups = { individuals: individual, businesses: business };
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
  "notary-administrative-services":
    "/services/individuals/notary-document-services",
};
