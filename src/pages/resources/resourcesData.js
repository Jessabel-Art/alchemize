export const RESOURCE_CATEGORIES = [
  "All",
  "Taxes",
  "Medicare & Insurance",
  "Starting a Business",
  "Business Operations",
  "Records & Administration",
  "Guides & Checklists",
];

// Medicare resources require review at least annually and whenever CMS makes a
// material rule or communications change. Do not infer marketing approval from
// the presence of educational content.
export const MEDICARE_MARKETING_COMPLIANCE = {
  status: "pending-owner-compliance-review",
  finalMarketingDisclaimer: null,
  note: "Confirm Alchemize's agent, carrier, FMO, TPMO, represented-plan, and required marketing-disclaimer status before Medicare marketing or enrollment activity goes live.",
};

const updated = "August 18, 2026";
const irsRecords = {
  source: "IRS.GOV",
  title: "How long should I keep records?",
  href: "https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records",
};
const irsEstimated = {
  source: "IRS.GOV",
  title: "Estimated taxes",
  href: "https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes",
};
const sbaRegister = {
  source: "SBA.GOV",
  title: "Register your business and find state resources",
  href: "https://www.sba.gov/counseling/launch-your-business/#register-business",
};
const medicareOptions = {
  source: "MEDICARE.GOV",
  title: "Your Medicare coverage options",
  href: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options",
};
const medicareJoin = {
  source: "MEDICARE.GOV",
  title: "Joining a Medicare health or drug plan",
  href: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan",
};
const medicareSep = {
  source: "MEDICARE.GOV",
  title: "Special Enrollment Periods",
  href: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan/special-enrollment-periods",
};
const medicarePlanFinder = {
  source: "MEDICARE.GOV",
  title: "Compare Medicare coverage options",
  href: "https://www.medicare.gov/plan-compare/",
};
const medicareHandbook = {
  source: "MEDICARE.GOV",
  title: "Medicare & You 2026 handbook",
  href: "https://www.medicare.gov/publications/10050-medicare-and-you.pdf",
};
const cmsEducation = {
  source: "CMS.GOV",
  title: "Medicare educational resources",
  href: "https://www.cms.gov/training-education/medicare/general-resources",
};

const taxDisclaimer =
  "General educational information only. Tax treatment depends on individual facts and applicable federal and state law.";
const businessDisclaimer =
  "General educational and organizational information only. Requirements vary by jurisdiction and circumstance. This resource is not legal, accounting, or individualized tax advice.";
const medicareDisclaimer =
  "Medicare information on this page is provided for general educational purposes. Medicare rules, costs, benefits, plan availability, and enrollment requirements can change. For current official Medicare information, visit Medicare.gov or call 1-800-MEDICARE. This educational notice is not a substitute for any marketing disclaimer required for Alchemize's eventual agent, carrier, FMO, or TPMO status.";

export const resources = [
  {
    slug: "preparing-for-tax-season",
    title: "Preparing for Tax Season",
    excerpt:
      "A practical framework for organizing tax records before filing begins, identifying missing information, and reducing the last-minute search for documents.",
    category: "Taxes",
    audience: "Individuals and business owners",
    type: "Guide & checklist",
    featured: true,
    updated,
    readTime: "9 min read",
    printable: true,
    download: "/assets/downloads/alchemize-preparing-for-tax-season.pdf",
    sections: [
      {
        id: "prior-year",
        title: "Start with the prior year",
        paragraphs: [
          "Last year's return can provide a useful starting point for recurring income sources, deductions, credits, accounts, and tax documents. It is not a guarantee that the current year will be identical, but it can reveal what information may need to be located.",
        ],
        items: [
          "Locate a complete copy of the prior-year federal and state returns.",
          "Note major changes in employment, business activity, family circumstances, property, investments, or insurance.",
          "Identify documents received last year that you expect to receive again.",
          "Write down significant financial events from the current tax year.",
        ],
      },
      {
        id: "income-records",
        title: "Organize income records",
        paragraphs: [
          "Applicable forms vary by taxpayer. Build an expected-document list based on the income sources that actually applied during the year.",
        ],
        items: [
          "Forms W-2 and applicable Forms 1099",
          "Self-employment or business income records",
          "Interest and dividend records",
          "Retirement distributions and Social Security benefit statements where applicable",
          "Rental income records and other income documentation where applicable",
        ],
      },
      {
        id: "expense-records",
        title: "Organize expense and deduction records",
        paragraphs: [
          "Collect potentially relevant support for business expenses, charitable contributions, education, medical expenses, mortgage or property activity, retirement contributions, and estimated payments. Having a record does not mean an expense is deductible; applicability depends on the facts and current law.",
        ],
      },
      {
        id: "separate-activity",
        title: "Separate business and personal activity",
        paragraphs: [
          "Small-business owners should make business activity distinguishable from personal transactions. Separate files, clear descriptions, and consistent categories reduce ambiguity without determining the tax treatment of an item.",
        ],
      },
      {
        id: "missing-list",
        title: "Create a missing-document list",
        paragraphs: [
          "Preparation includes identifying what has not arrived or cannot be located. Record the issuer, expected document, date requested, and current status instead of guessing from memory.",
        ],
      },
      {
        id: "questions",
        title: "Questions worth asking before filing",
        items: [
          "Did my income sources change?",
          "Did I start or close a business, move, or buy or sell property?",
          "Did my household change?",
          "Did I receive income without tax withholding?",
          "Did I make estimated tax payments?",
          "Did I receive correspondence from the IRS or a state tax agency?",
        ],
      },
      {
        id: "secure-transfer",
        title: "Before submitting documents",
        paragraphs: [
          "Follow the secure process specified by the preparer. Do not send Social Security numbers, tax returns, bank information, or identity documents through ordinary email or a public inquiry form.",
          "Preparation does not determine the tax result. It gives the preparer a more complete starting point for determining what applies to the taxpayer's situation.",
        ],
        callout:
          "Security first: describe a sensitive document before transmitting it and wait for approved handling instructions.",
      },
    ],
    official: [irsRecords],
    related: ["tax-records-what-to-keep", "estimated-taxes-questions"],
    nextSteps: [
      "Create one secure folder for the filing year.",
      "List expected documents and mark what is missing.",
      "Separate business records from personal records where applicable.",
      "Write down questions before sharing information securely.",
    ],
    disclaimer: taxDisclaimer,
  },
  {
    slug: "tax-records-what-to-keep",
    title: "Tax Records: What to Keep and How to Organize Them",
    excerpt:
      "Build a record system that makes each document's source, year, and purpose easier to understand and retrieve.",
    category: "Taxes",
    audience: "Individuals and business owners",
    type: "Guide",
    updated,
    readTime: "8 min read",
    sections: [
      {
        id: "why",
        title: "Why organization matters",
        paragraphs: [
          "A reliable system preserves the connection between a transaction, its supporting record, and the return or decision it may affect. Retrieval should not depend on remembering which inbox or device received the document.",
        ],
      },
      {
        id: "year-structure",
        title: "Create a year-based structure",
        items: [
          "One top-level folder for each tax year",
          "Separate income, expense support, payments, returns, and correspondence",
          "Consistent filenames that include date, source, and document type",
          "A short index for records stored somewhere else",
        ],
      },
      {
        id: "income",
        title: "Income records",
        paragraphs: [
          "Store wage, contractor, investment, retirement, rental, business, and other applicable income records with enough context to identify the source and year.",
        ],
      },
      {
        id: "support",
        title: "Expense and supporting records",
        paragraphs: [
          "Keep receipts, invoices, statements, mileage or activity records, payment confirmations, and other support relevant to items being reviewed. A record supports analysis; it does not automatically establish deductibility.",
        ],
      },
      {
        id: "business",
        title: "Business records",
        paragraphs: [
          "Separate business activity, preserve the business purpose and payment trail, and keep formation, payroll, asset, tax, and owner-related records in appropriate categories.",
        ],
      },
      {
        id: "filings",
        title: "Tax filings and correspondence",
        paragraphs: [
          "Retain filed returns, amendments, payment confirmations, notices, responses, and supporting work in a way that preserves the complete history.",
        ],
      },
      {
        id: "storage",
        title: "Digital versus paper storage",
        paragraphs: [
          "Use the format that can be maintained securely and retrieved reliably. Back up digital records, protect sensitive files, and avoid keeping the only copy in an inbox or on one device.",
        ],
      },
      {
        id: "retention",
        title: "Create a retention decision",
        paragraphs: [
          "There is no responsible universal rule to keep every document for the same number of years. Retention depends on what the record proves, applicable limitation periods, property or employment-tax issues, and non-tax requirements. Review the IRS guidance and obtain advice for the specific record before disposing of it.",
        ],
        callout:
          "Keep copies of filed returns and check insurance, creditor, legal, and operational requirements before discarding records no longer needed for tax purposes.",
      },
    ],
    official: [irsRecords],
    related: ["preparing-for-tax-season", "business-records-what-needs-a-home"],
    nextSteps: [
      "Create the current-year folder structure.",
      "Move records out of inboxes and downloads folders.",
      "Identify records requiring a specific retention decision.",
      "Verify retention requirements with the appropriate authority or professional.",
    ],
    disclaimer: taxDisclaimer,
  },
  {
    slug: "estimated-taxes-questions",
    title: "Estimated Taxes: Questions to Ask Before You Ignore Them",
    excerpt:
      "Understand why income without enough withholding deserves attention before filing time.",
    category: "Taxes",
    audience: "Individuals and business owners",
    type: "Explainer",
    updated,
    readTime: "7 min read",
    sections: [
      {
        id: "meaning",
        title: "What estimated tax generally means",
        paragraphs: [
          "Federal income tax is generally paid as income is earned. When withholding does not cover enough of the expected obligation, estimated payments may be one way tax is paid during the year. Whether they apply depends on the taxpayer's facts.",
        ],
      },
      {
        id: "situations",
        title: "When withholding may be insufficient",
        items: [
          "Self-employment or business income",
          "Investment, rental, retirement, or other income changes",
          "Multiple income sources or withholding changes",
          "A major change from the prior year's circumstances",
        ],
      },
      {
        id: "prior-year",
        title: "Why prior-year assumptions may not work",
        paragraphs: [
          "A prior return is context, not a forecast. Income timing, withholding, credits, deductions, business activity, and tax law can change. Planning should use current information.",
        ],
      },
      {
        id: "timing",
        title: "Payment timing matters",
        paragraphs: [
          "The IRS divides the year into payment periods with due dates. Late or insufficient payments can create consequences even when a return later shows a refund. Use the current IRS schedule rather than relying on remembered dates.",
        ],
      },
      {
        id: "records",
        title: "Keep a payment record",
        items: [
          "Payment date and amount",
          "Tax year and payment type",
          "Confirmation number or canceled-payment evidence",
          "Account or method used",
          "Any adjustment explained by a tax professional",
        ],
      },
      {
        id: "guidance",
        title: "When professional guidance is appropriate",
        paragraphs: [
          "Seek individualized tax guidance when income changes, a business begins or grows, withholding is uncertain, payments were missed, or the calculation depends on special rules. This guide does not calculate an obligation.",
        ],
      },
    ],
    official: [irsEstimated],
    related: ["preparing-for-tax-season", "tax-records-what-to-keep"],
    nextSteps: [
      "List income sources without withholding.",
      "Gather current income and payment records.",
      "Review the current IRS guidance and due dates.",
      "Ask a qualified tax professional whether and how estimated payments apply.",
    ],
    disclaimer: taxDisclaimer,
  },
  {
    slug: "medicare-basics-coverage-choices",
    title: "Medicare Basics: Understanding Your Coverage Choices",
    excerpt:
      "Understand how Medicare's parts and two primary coverage paths relate before comparing options.",
    category: "Medicare & Insurance",
    audience: "Individuals",
    type: "Educational guide",
    updated,
    reviewYear: 2026,
    readTime: "9 min read",
    sections: [
      {
        id: "introduction",
        title: "Begin with official eligibility information",
        paragraphs: [
          "Medicare is federal health insurance primarily for people age 65 or older and certain younger people who meet eligibility requirements. Eligibility circumstances vary; confirm current information through Medicare.gov or Social Security.",
        ],
      },
      {
        id: "parts",
        title: "The basic parts",
        terms: [
          [
            "Part A — Hospital Insurance",
            "Generally helps cover inpatient hospital care, skilled nursing facility care, hospice, and some home health care, subject to Medicare rules.",
          ],
          [
            "Part B — Medical Insurance",
            "Generally helps cover medically necessary services from doctors and other providers, outpatient care, durable medical equipment, and many preventive services.",
          ],
          [
            "Part C — Medicare Advantage",
            "An alternative way to receive Medicare benefits through a Medicare-approved private plan. Plan rules, networks, benefits, and costs vary.",
          ],
          [
            "Part D — Drug Coverage",
            "Helps cover prescription drugs through a stand-alone drug plan or many Medicare Advantage plans.",
          ],
          [
            "Medigap",
            "Medicare Supplement Insurance can help with certain Original Medicare out-of-pocket costs. It is not Medicare Advantage and availability or timing can depend on the situation.",
          ],
        ],
      },
      {
        id: "paths",
        title: "Two primary coverage paths",
        comparison: [
          {
            title: "Original Medicare",
            items: [
              "Part A + Part B",
              "May add a separate Part D plan",
              "May potentially add Medigap depending on eligibility and timing",
            ],
          },
          {
            title: "Medicare Advantage",
            items: [
              "Medicare-approved private plan providing Part A and Part B benefits",
              "Many plans include Part D",
              "Networks, plan rules, benefits, and costs vary",
            ],
          },
        ],
      },
      {
        id: "questions",
        title: "Questions before comparing options",
        items: [
          "Which doctors, specialists, and hospitals do I use?",
          "What prescriptions do I take and which pharmacies do I prefer?",
          "Do I travel or live in more than one location?",
          "What monthly and out-of-pocket costs can I reasonably manage?",
          "Do I have employer, retiree, Medicaid, VA, TRICARE, or other coverage?",
          "Which coverage features are especially important to me?",
        ],
      },
    ],
    official: [
      medicareOptions,
      medicarePlanFinder,
      medicareHandbook,
      cmsEducation,
    ],
    related: ["medicare-enrollment-periods", "comparing-medicare-coverage"],
    nextSteps: [
      "List providers, prescriptions, pharmacies, and other coverage.",
      "Review the two coverage paths through Medicare.gov.",
      "Use Medicare Plan Finder for current options in your area.",
      "Write down questions that depend on your eligibility or circumstances.",
    ],
    disclaimer: medicareDisclaimer,
  },
  {
    slug: "medicare-enrollment-periods",
    title: "Medicare Enrollment Periods: When You Can Make Changes",
    excerpt:
      "Learn why Medicare choices cannot always be changed at any time and where to verify the period that applies.",
    category: "Medicare & Insurance",
    audience: "Individuals",
    type: "Educational guide",
    updated,
    reviewYear: 2026,
    readTime: "8 min read",
    sections: [
      {
        id: "initial",
        title: "Initial Enrollment Period",
        paragraphs: [
          "For plan enrollment, Medicare.gov generally describes a period beginning three months before a person gets Medicare and ending three months after. The exact timing and permitted actions depend on when Parts A and B begin, so verify the official instructions for the individual situation.",
        ],
      },
      {
        id: "general",
        title: "General Enrollment Period",
        paragraphs: [
          "The General Enrollment Period concerns signing up for Part A and/or Part B in certain circumstances. Plan enrollment after gaining Part A or B has its own timing. Confirm both steps through Medicare.gov or Social Security rather than assuming one enrollment completes the other.",
        ],
      },
      {
        id: "open",
        title: "Medicare Open Enrollment",
        paragraphs: [
          "October 15 through December 7 permits certain changes involving Medicare Advantage and Part D coverage, with coverage generally beginning January 1 when the request is received by the deadline. Verify current permitted actions on Medicare.gov.",
        ],
      },
      {
        id: "ma-open",
        title: "Medicare Advantage Open Enrollment",
        paragraphs: [
          "January 1 through March 31 applies to people already enrolled in Medicare Advantage. Medicare.gov explains the limited changes available during this period, including switching Medicare Advantage plans or returning to Original Medicare in applicable circumstances.",
        ],
      },
      {
        id: "special",
        title: "Special Enrollment Periods",
        paragraphs: [
          "Certain events—such as a move or loss or change of other coverage—can create another opportunity to change coverage. Eligibility, timing, and permitted actions depend on the event. The official Special Enrollment Period resource should be used instead of an abbreviated eligibility checklist.",
        ],
      },
    ],
    official: [medicareJoin, medicareSep, medicareHandbook],
    related: [
      "medicare-basics-coverage-choices",
      "comparing-medicare-coverage",
    ],
    nextSteps: [
      "Identify the coverage action you are considering.",
      "Confirm the enrollment period and permitted action on Medicare.gov.",
      "Gather current plan, provider, prescription, and other-coverage information.",
      "Do not cancel existing coverage until the replacement timing is understood.",
    ],
    disclaimer: medicareDisclaimer,
  },
  {
    slug: "comparing-medicare-coverage",
    title: "Comparing Medicare Coverage: What to Review Beyond the Premium",
    excerpt:
      "Compare providers, prescriptions, cost sharing, plan rules, and patterns of care—not only the monthly premium.",
    category: "Medicare & Insurance",
    audience: "Individuals",
    type: "Comparison guide",
    updated,
    reviewYear: 2026,
    readTime: "9 min read",
    sections: [
      {
        id: "providers",
        title: "Start with providers",
        paragraphs: [
          "List physicians, specialists, hospitals, and recurring facilities. Verify network participation through current plan materials and directly with the provider when appropriate; directories can change.",
        ],
      },
      {
        id: "prescriptions",
        title: "Review every prescription",
        paragraphs: [
          "Check the formulary, tier, preferred pharmacies, and any prior authorization, quantity limit, or step-therapy rule that applies. Not every plan uses every mechanism, and drug coverage can change.",
        ],
      },
      {
        id: "costs",
        title: "Look beyond the premium",
        items: [
          "Deductibles",
          "Copayments and coinsurance",
          "Expected prescription costs",
          "Maximum out-of-pocket considerations for Medicare Advantage",
          "Costs for out-of-network or non-preferred use where applicable",
        ],
      },
      {
        id: "structure",
        title: "Understand the coverage structure",
        paragraphs: [
          "Original Medicare and Medicare Advantage organize coverage differently. Medicare Advantage is not supplemental insurance, and Medigap is not an alternative name for Medicare Advantage.",
        ],
      },
      {
        id: "use",
        title: "Consider how you use health care",
        paragraphs: [
          "Travel, multiple residences, specialist access, recurring care, preferred pharmacies, and other coverage can materially affect how an option works in practice.",
        ],
      },
      {
        id: "annual",
        title: "Review annually",
        paragraphs: [
          "Premiums, cost sharing, networks, formularies, rules, and benefits can change from year to year. Review the Annual Notice of Change where applicable and compare using current official plan information.",
        ],
      },
    ],
    official: [medicarePlanFinder, medicareOptions, medicareHandbook],
    related: [
      "medicare-basics-coverage-choices",
      "medicare-enrollment-periods",
    ],
    nextSteps: [
      "Create one provider and prescription list.",
      "Compare total expected costs and plan rules, not premium alone.",
      "Verify current network and formulary information.",
      "Review other coverage before making changes.",
    ],
    disclaimer: medicareDisclaimer,
  },
  {
    slug: "understanding-insurance-coverage",
    title: "Understanding Insurance Coverage: Terms That Affect What You Pay",
    excerpt:
      "Understand the terms that shape cost, access, limits, and protection before making a coverage decision.",
    category: "Medicare & Insurance",
    audience: "Individuals and business owners",
    type: "Explainer",
    updated,
    readTime: "8 min read",
    sections: [
      {
        id: "terms",
        title: "Terms that affect cost and coverage",
        terms: [
          ["Premium", "The amount paid to keep coverage in force."],
          [
            "Deductible",
            "An amount that may need to be paid before certain coverage applies.",
          ],
          [
            "Copayment",
            "A fixed amount that may apply to a covered service or item.",
          ],
          [
            "Coinsurance",
            "A percentage of an allowed or covered amount that may be the covered person's responsibility.",
          ],
          [
            "Coverage limit",
            "A maximum amount, duration, or quantity the coverage may provide.",
          ],
          [
            "Exclusion",
            "A circumstance, service, condition, or loss the governing document does not cover.",
          ],
          [
            "Network",
            "A group of participating providers or facilities, where the product uses one.",
          ],
          [
            "Out-of-pocket cost",
            "An amount paid by the covered person rather than the insurer.",
          ],
          [
            "Beneficiary",
            "A person or entity designated to receive a benefit where beneficiary designations apply.",
          ],
          [
            "Waiting period",
            "A period before certain coverage or benefits may begin, where applicable.",
          ],
        ],
        paragraphs: [
          "Terminology and application vary by insurance product. Read the governing documents for the actual definition.",
        ],
      },
      {
        id: "questions",
        title: "Questions to ask when reviewing coverage",
        items: [
          "What exactly is covered—and what is excluded?",
          "When does the deductible apply?",
          "Is there a provider network?",
          "What costs apply when I use the coverage?",
          "Are there limits or waiting periods?",
          "What happens outside the normal network or service area?",
          "Which documents control the actual coverage?",
        ],
      },
      {
        id: "documents",
        title: "The governing document matters",
        paragraphs: [
          "Marketing summaries are not the insurance contract. The policy, certificate, Evidence of Coverage, or other governing coverage documents determine the actual terms. Use terminology appropriate to the product involved.",
        ],
      },
    ],
    official: [],
    related: [
      "medicare-basics-coverage-choices",
      "comparing-medicare-coverage",
    ],
    nextSteps: [
      "Collect the governing coverage documents.",
      "Mark unfamiliar terms, exclusions, and limits.",
      "List the real situations in which coverage may be used.",
      "Ask for clarification before making a decision.",
    ],
    disclaimer:
      "General educational information only. Insurance availability, terminology, suitability, and governing requirements depend on the product and individual situation.",
  },
  {
    slug: "starting-a-business-organization-checklist",
    title: "Starting a Business: Organization Checklist",
    excerpt:
      "Organize the decisions, registrations, records, deadlines, and operating information behind a new business.",
    category: "Starting a Business",
    audience: "Entrepreneurs and small businesses",
    type: "Guide & checklist",
    updated,
    readTime: "10 min read",
    printable: true,
    download:
      "/assets/downloads/alchemize-starting-a-business-organization-checklist.pdf",
    sections: [
      {
        id: "define",
        title: "Define the business before filing",
        items: [
          "Business activity and intended customers",
          "Ownership and decision-making responsibility",
          "Proposed legal name",
          "Operating location and contact information",
          "Expected start date",
        ],
      },
      {
        id: "requirements",
        title: "Research formation requirements",
        paragraphs: [
          "Entity choice can have legal and tax consequences. Do not assume one structure is universally appropriate. Use official state sources and obtain qualified legal or tax guidance where the decision requires it.",
        ],
      },
      {
        id: "separate",
        title: "Separate business activity",
        items: [
          "Business banking when appropriate",
          "Dedicated contact information",
          "Accounting and recordkeeping structure",
          "Contracts, receipts, and business correspondence",
        ],
      },
      {
        id: "inventory",
        title: "Create a registration inventory",
        paragraphs: ["Requirements vary by structure, location, and activity."],
        items: [
          "State formation",
          "EIN",
          "State and local tax registrations",
          "Licenses and permits",
          "Insurance",
          "Assumed-name registrations",
          "Industry-specific requirements",
        ],
      },
      {
        id: "calendar",
        title: "Build the compliance calendar",
        items: [
          "Annual reports and government filings",
          "License and tax deadlines",
          "Insurance renewals",
          "Contract dates",
          "Registered-agent and official-information reviews",
          "Internal review dates",
        ],
      },
      {
        id: "decisions",
        title: "Document important decisions",
        paragraphs: [
          "Preserve formation and governing documents, ownership records, contracts, resolutions or consents where applicable, and material business decisions in the permanent company record.",
        ],
      },
      {
        id: "expertise",
        title: "Know when outside expertise is needed",
        paragraphs: [
          "Legal, accounting, tax, insurance, licensing, and other specialized issues may require appropriately qualified professionals. Administrative preparation should make those conversations better, not replace them.",
        ],
      },
    ],
    official: [
      sbaRegister,
      {
        source: "IRS.GOV",
        title: "Apply for an Employer Identification Number",
        href: "https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers",
      },
    ],
    related: [
      "business-formation-information-to-gather",
      "your-first-year-in-business",
    ],
    nextSteps: [
      "Write a plain-language description of the business.",
      "List owners, roles, locations, and unresolved structure questions.",
      "Verify state and local requirements through official sources.",
      "Create one record for every registration and deadline.",
    ],
    disclaimer: businessDisclaimer,
  },
  {
    slug: "your-first-year-in-business",
    title: "Your First Year in Business: What Needs to Stay Organized",
    excerpt:
      "Create the records and habits the business will rely on as responsibilities increase.",
    category: "Starting a Business",
    audience: "Entrepreneurs and small businesses",
    type: "Guide",
    updated,
    readTime: "9 min read",
    sections: [
      {
        id: "company-record",
        title: "Create the permanent company record",
        items: [
          "Formation and EIN documentation",
          "Governing and ownership information",
          "Licenses and registrations",
          "Insurance",
          "Major agreements",
        ],
      },
      {
        id: "money",
        title: "Separate money from administration",
        paragraphs: [
          "Keep banking records, receipts, invoices, expenses, reimbursements, owner contributions, and tax records organized without using an administrative category as an accounting conclusion.",
        ],
      },
      {
        id: "deadlines",
        title: "Build a deadline system",
        items: [
          "Government filings",
          "Renewals",
          "Tax dates",
          "Contracts",
          "Insurance",
          "Licenses",
          "Recurring administrative obligations",
        ],
      },
      {
        id: "vendors",
        title: "Create a vendor and provider record",
        table: {
          headers: ["Provider", "Service", "Owner", "Renewal / end date"],
          rows: [
            [
              "Name and contact",
              "What is provided",
              "Internal contact",
              "Terms and notice date",
            ],
            ["Agreement", "Cost", "Access", "Cancellation requirements"],
          ],
        },
      },
      {
        id: "processes",
        title: "Document repeatable work",
        items: [
          "Client intake",
          "Invoicing",
          "Document storage",
          "Scheduling",
          "Customer communication",
          "Purchasing",
          "Record retention",
        ],
      },
      {
        id: "quarterly",
        title: "Review quarterly",
        items: [
          "What information is difficult to find?",
          "What deadline surprised us?",
          "What process is repeated manually?",
          "What responsibility has no clear owner?",
          "What subscription is no longer useful?",
          "What new risk or dependency has appeared?",
        ],
      },
      {
        id: "purpose",
        title: "Organization without bureaucracy",
        paragraphs: [
          "Organization in the first year is not about creating bureaucracy. It is about making the business easier to understand and operate as responsibilities increase.",
        ],
      },
    ],
    official: [sbaRegister],
    related: [
      "starting-a-business-organization-checklist",
      "building-a-business-deadline-calendar",
    ],
    nextSteps: [
      "Create the permanent company folder.",
      "Build one deadline calendar.",
      "Record vendor and service terms.",
      "Choose one recurring process to document this quarter.",
    ],
    disclaimer: businessDisclaimer,
  },
  {
    slug: "business-formation-information-to-gather",
    title: "Business Formation: Information to Gather Before You File",
    excerpt:
      "Prepare the factual information and professional questions that may be needed before a formation filing.",
    category: "Starting a Business",
    audience: "Entrepreneurs and small businesses",
    type: "Preparation guide",
    updated,
    readTime: "7 min read",
    sections: [
      {
        id: "information",
        title: "Build the information file",
        items: [
          "Proposed legal name and state",
          "Business purpose or activity",
          "Ownership",
          "Management-structure questions",
          "Registered-agent information",
          "Business, mailing, and owner addresses",
          "Organizer information",
          "Effective-date considerations",
          "Expected employees",
        ],
      },
      {
        id: "questions",
        title: "Separate facts from professional questions",
        paragraphs: [
          "A filing form may ask for facts while entity, management, and tax decisions require analysis. List tax and legal questions separately so they can be reviewed by an appropriately qualified professional before filing.",
        ],
      },
      {
        id: "licensing",
        title: "Research licensing and registration",
        paragraphs: [
          "State, county, municipal, tax, assumed-name, and industry requirements vary. Use the state authority and relevant local or licensing agency for current instructions.",
        ],
      },
      {
        id: "after",
        title: "Documents to retain after filing",
        items: [
          "Submitted and accepted formation documents",
          "EIN confirmation",
          "Governing documents",
          "Ownership records",
          "Registrations and licenses",
          "Payment confirmations and official correspondence",
        ],
      },
    ],
    official: [sbaRegister],
    related: [
      "starting-a-business-organization-checklist",
      "your-first-year-in-business",
    ],
    nextSteps: [
      "Gather factual information before opening a filing portal.",
      "Write down structure and tax questions.",
      "Identify the correct state and local authorities.",
      "Plan the permanent record before submitting anything.",
    ],
    disclaimer: businessDisclaimer,
  },
  {
    slug: "business-needs-a-process",
    title: "When Your Business Needs a Process, Not Another To-Do List",
    excerpt:
      "Recognize when recurring problems require a repeatable process, clear ownership, and a dependable home for information.",
    category: "Business Operations",
    audience: "Small and growing businesses",
    type: "Framework",
    updated,
    readTime: "8 min read",
    sections: [
      {
        id: "difference",
        title: "Task, process, and system",
        terms: [
          ["Task", "One action completed once."],
          [
            "Process",
            "A repeatable sequence that turns a trigger into an intended outcome.",
          ],
          [
            "System",
            "The people, process, information, and tools that keep the work functioning.",
          ],
        ],
      },
      {
        id: "signals",
        title: "Signals that a process is missing",
        items: [
          "The same question interrupts work repeatedly",
          "Information is requested more than once",
          "A deadline depends on one person's memory",
          "Handoffs produce rework",
          "No one knows which file or status is current",
        ],
      },
      {
        id: "examples",
        title: "Common examples",
        items: [
          "Client onboarding",
          "Invoice follow-up",
          "Document collection",
          "Renewals",
          "Monthly close preparation",
          "Vendor management",
        ],
      },
      {
        id: "framework",
        title: "Build the process",
        ordered: [
          "Identify the trigger.",
          "Define the desired outcome.",
          "List the required steps.",
          "Assign responsibility.",
          "Identify required information.",
          "Decide where the process is documented.",
          "Review what repeatedly breaks.",
        ],
      },
      {
        id: "improve",
        title: "Improve one recurring failure at a time",
        paragraphs: [
          "A useful process is specific enough to guide action and simple enough to maintain. Test it during real work, remove unnecessary steps, and give one person responsibility for keeping it current.",
        ],
      },
    ],
    official: [],
    related: [
      "simple-administrative-system",
      "business-records-what-needs-a-home",
    ],
    nextSteps: [
      "Choose one recurring problem.",
      "Name its trigger and intended outcome.",
      "Map the steps and assign an owner.",
      "Test the process during the next real occurrence.",
    ],
    disclaimer:
      "General business-organization information only. A process should be adapted to the business, its obligations, and the sensitivity of the information involved.",
  },
  {
    slug: "simple-administrative-system",
    title: "Building a Simple Administrative System for a Small Business",
    excerpt:
      "Create five dependable foundations without adding software complexity for its own sake.",
    category: "Business Operations",
    audience: "Small businesses",
    type: "Guide",
    updated,
    readTime: "8 min read",
    sections: [
      {
        id: "purpose",
        title: "Start with four questions",
        items: [
          "What exists?",
          "Where does it live?",
          "Who owns it?",
          "When does it require attention?",
        ],
      },
      {
        id: "documents",
        title: "1. Documents",
        paragraphs: [
          "Create a consistent category and naming structure, appropriate access permissions, and one dependable current version.",
        ],
      },
      {
        id: "money",
        title: "2. Money and financial records",
        paragraphs: [
          "Define where invoices, receipts, payment records, reports, and tax-related records belong and who maintains the record trail.",
        ],
      },
      {
        id: "deadlines",
        title: "3. Deadlines",
        paragraphs: [
          "Record the date, source, owner, lead time, required records, and completion evidence. A calendar entry without context is often not enough.",
        ],
      },
      {
        id: "contacts",
        title: "4. Contacts and vendors",
        paragraphs: [
          "Keep ownership, access, agreement, renewal, cost, and cancellation information together so outside relationships remain manageable.",
        ],
      },
      {
        id: "processes",
        title: "5. Processes",
        paragraphs: [
          "Document work that repeats or creates risk when missed. Begin with the trigger, desired outcome, owner, steps, and record of completion.",
        ],
      },
      {
        id: "technology",
        title: "Use technology to support the system",
        paragraphs: [
          "The objective is not software complexity. Choose tools only when they make ownership, access, status, or follow-through clearer.",
        ],
      },
    ],
    official: [],
    related: [
      "business-needs-a-process",
      "building-a-business-deadline-calendar",
    ],
    nextSteps: [
      "Inventory the five foundations.",
      "Choose the area creating the most repeated searching or delay.",
      "Define its owner and record location.",
      "Review whether current software is helping or hiding the process.",
    ],
    disclaimer:
      "General business-organization information only. System design should reflect the business's actual obligations, security needs, and operating context.",
  },
  {
    slug: "business-records-what-needs-a-home",
    title: "Business Records: What Needs a Home",
    excerpt:
      "Create clear record categories so important information is protected, retrievable, and connected to its purpose.",
    category: "Records & Administration",
    audience: "Small businesses",
    type: "Reference guide",
    updated,
    readTime: "8 min read",
    sections: [
      {
        id: "categories",
        title: "Core record categories",
        terms: [
          [
            "Formation & governance",
            "Formation, ownership, governing, consent, and official company records.",
          ],
          [
            "Financial",
            "Banking, invoicing, receipts, reports, payments, and financial correspondence.",
          ],
          [
            "Tax",
            "Returns, filings, supporting records, payments, notices, and responses.",
          ],
          [
            "Insurance",
            "Policies, certificates, applications, renewals, claims, and communications.",
          ],
          [
            "Contracts",
            "Executed agreements, amendments, renewals, notices, and performance records.",
          ],
          [
            "Licenses & registrations",
            "Applications, approvals, renewals, conditions, and authority contacts.",
          ],
          [
            "Client / customer",
            "Agreements, intake, service, communication, and completion records.",
          ],
          [
            "Vendors",
            "Agreements, contacts, access, cost, renewal, and cancellation details.",
          ],
          [
            "Personnel",
            "Employment-related records where applicable, with restricted access.",
          ],
          [
            "Operations",
            "Procedures, templates, access records, reviews, and process documentation.",
          ],
        ],
      },
      {
        id: "access",
        title: "Match access to sensitivity",
        paragraphs: [
          "Not every person needs access to every record. Permissions should reflect the sensitivity, role, legal requirements, and operational need for the information.",
        ],
      },
      {
        id: "retention",
        title: "Make retention decisions by record",
        paragraphs: [
          "Do not assign one universal retention period. Tax, employment, contract, insurance, licensing, legal, and operational records can have different requirements. Record the authority or professional guidance behind each retention decision.",
        ],
      },
      {
        id: "retrieval",
        title: "Test retrieval",
        paragraphs: [
          "A record system is only useful if someone with appropriate access can locate the current document, understand what it is, and identify what happens next.",
        ],
      },
    ],
    official: [irsRecords],
    related: [
      "simple-administrative-system",
      "building-a-business-deadline-calendar",
    ],
    nextSteps: [
      "Create the category structure.",
      "Assign an owner and access level to each category.",
      "Identify records without a retention decision.",
      "Test whether a second authorized person can retrieve a current record.",
    ],
    disclaimer: businessDisclaimer,
  },
  {
    slug: "building-a-business-deadline-calendar",
    title: "Building a Business Deadline Calendar",
    excerpt:
      "Turn filing dates, renewals, contracts, and internal commitments into responsibilities that can be prepared and verified.",
    category: "Records & Administration",
    audience: "Small businesses",
    type: "Guide & printable table",
    updated,
    readTime: "7 min read",
    printable: true,
    sections: [
      {
        id: "inventory",
        title: "Inventory the deadline sources",
        items: [
          "Government filings",
          "Tax dates",
          "License renewals",
          "Insurance renewals",
          "Contracts",
          "Subscriptions",
          "Client commitments",
          "Internal reviews",
        ],
      },
      {
        id: "framework",
        title: "Use a complete deadline record",
        table: {
          headers: ["Field", "What to record"],
          rows: [
            ["Deadline", "Exact date or rule"],
            ["Owner", "Person accountable"],
            ["Source", "Authority, agreement, or record"],
            ["Lead time", "When preparation begins"],
            ["Required documents", "Inputs needed"],
            ["Status", "Current stage"],
            ["Completion record", "Proof and storage location"],
          ],
        },
      },
      {
        id: "lead-time",
        title: "Add lead time, not only the due date",
        paragraphs: [
          "The work may require records, approvals, payment, signatures, or outside review. Put the preparation date on the calendar before the final deadline.",
        ],
      },
      {
        id: "ownership",
        title: "Assign one owner",
        paragraphs: [
          "Shared awareness is not the same as accountability. Name one owner and a backup for responsibilities that cannot wait.",
        ],
      },
      {
        id: "completion",
        title: "Retain completion evidence",
        paragraphs: [
          "Store the submission, confirmation, payment, approval, or renewal record with the source document so the business can demonstrate what was completed.",
        ],
      },
    ],
    official: [
      sbaRegister,
      {
        source: "IRS.GOV",
        title: "Tax calendars",
        href: "https://www.irs.gov/businesses/small-businesses-self-employed/online-tax-calendar",
      },
    ],
    related: [
      "business-records-what-needs-a-home",
      "your-first-year-in-business",
    ],
    nextSteps: [
      "List every deadline source.",
      "Record an owner and preparation date.",
      "Add required documents and status.",
      "Choose where completion evidence will be retained.",
    ],
    disclaimer: businessDisclaimer,
  },
];

export const resourceBySlug = new Map(
  resources.map((resource) => [resource.slug, resource]),
);

export function resourcesForCategory(category) {
  if (category === "All") return resources;
  if (category === "Guides & Checklists") {
    return resources.filter(
      (resource) =>
        resource.printable || resource.type.toLowerCase().includes("guide"),
    );
  }
  return resources.filter((resource) => resource.category === category);
}
