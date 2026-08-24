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
  electronicNotary: "planned",
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
    status: {
      label: "Electronic Notary Services",
      value: serviceStatuses.electronicNotary,
      text: "Planned after completion of applicable North Carolina certification and authorization requirements. No electronic-notary booking is offered while this status is not active.",
    },
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
      ["Financial & Tax Support", "/services/businesses/financial-tax-support"],
    ],
    cta: "Preparing the business for what comes next?",
  },
  {
    audience: "businesses",
    audienceLabel: "Business Services",
    slug: "financial-tax-support",
    serviceKey: "business-financial",
    title: "Financial & Tax Support",
    Icon: Landmark,
    statement:
      "Keep financial and tax responsibilities organized before they become reactive.",
    hero: "Create a dependable record process before filing and reporting deadlines arrive.",
    overview:
      "Alchemize helps organize the records, transaction workflow, deadlines, and preparation steps that support bookkeeping and tax readiness. QuickBooks or another accounting platform may remain the system of record while Alchemize helps make the information usable and maintainable.",
    capabilities: [
      "Business tax preparation",
      "Bookkeeping organization",
      "Financial workflows",
      "Year-end readiness",
    ],
    for: [
      "Businesses preparing supported tax returns",
      "Owners cleaning up bookkeeping records",
      "Companies improving invoice or receipt workflows",
      "Businesses preparing records for a CPA or accountant",
    ],
    situations: [
      "Business and personal records are not consistently separated",
      "Transactions or receipts need organization",
      "Monthly records are not ready for review",
      "Tax season exposes gaps that should be addressed year-round",
    ],
    helps: [
      "Business tax preparation for supported return types",
      "Business tax-document organization",
      "Estimated-tax record organization",
      "Bookkeeping support and cleanup",
      "Transaction categorization support",
      "Expense and receipt organization",
      "Accounts-receivable and invoice workflow setup",
      "Financial deadline tracking",
      "QuickBooks setup or support where appropriate",
      "Accountant or CPA preparation support",
      "Year-end record preparation",
    ],
    process: [
      [
        "Organize",
        "Bring accounts, documents, receipts, deadlines, and responsibilities into a defined record system.",
      ],
      [
        "Reconcile",
        "Identify inconsistencies, missing support, and items requiring confirmation or qualified review.",
      ],
      [
        "Prepare",
        "Assemble the supported bookkeeping, reporting, or tax-preparation record set.",
      ],
      [
        "Maintain",
        "Establish a practical recurring rhythm for records, review, and handoff.",
      ],
    ],
    prepare: [
      "Business bank and credit statements",
      "Bookkeeping system access when shared securely",
      "Income, invoice, expense, and receipt records",
      "Prior-year business returns",
      "Estimated-payment records",
      "Payroll or contractor summaries where applicable",
      "Notices and filing deadlines",
    ],
    boundary:
      "Alchemize is not a CPA, audit, payroll-processing, or investment-advisory firm. Supported return types, bookkeeping depth, software support, and jurisdictions must be confirmed before engagement; specialized work may require a CPA or other qualified professional.",
    checklist: [
      "Business Financial & Tax Preparation Checklist",
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
        "Operations & Implementation",
        "/services/businesses/operations-implementation",
      ],
      ["Business Readiness & Growth", "/services/businesses/readiness-growth"],
    ],
    cta: "Need the records and financial process organized?",
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
  "business-tax": "/services/businesses/financial-tax-support",
  "business-advisory": "/services/businesses/advisory-optimization",
  "notary-administrative-services":
    "/services/individuals/notary-document-services",
};
