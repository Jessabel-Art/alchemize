export const RESOURCE_CATEGORIES = [
  "All",
  "Taxes",
  "Web & Digital Solutions",
  "Starting a Business",
  "Business Operations",
  "Records & Administration",
  "Guides & Checklists",
];

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
const taxDisclaimer =
  "General educational information only. Tax treatment depends on individual facts and applicable federal and state law.";
const businessDisclaimer =
  "General educational and organizational information only. Requirements vary by jurisdiction and circumstance. This resource is not legal, accounting, or individualized tax advice.";
const digitalDisclaimer =
  "General educational information about websites and digital presence. Specific recommendations depend on the business, audience, existing systems, and project scope. Search visibility, traffic, and business outcomes are not guaranteed.";

export const resources = [
  {
    slug: "preparing-for-tax-season",
    title: "Individual Tax Preparation Organizer",
    excerpt:
      "A practical framework for organizing tax records before filing begins, identifying missing information, and reducing the last-minute search for documents.",
    category: "Taxes",
    audience: "Individuals and business owners",
    type: "Guide & checklist",
    featured: true,
    updated,
    readTime: "9 min read",
    printable: true,
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
    slug: "professional-website-design-process",
    title: "What to Expect During a Professional Website Design Process",
    excerpt:
      "Understand the practical stages of a professional website project, what decisions clients help shape, and how the work moves from discovery to launch.",
    category: "Web & Digital Solutions",
    audience: "Small businesses and professionals",
    type: "Practical guide",
    updated,
    readTime: "8 min read",
    sections: [
      {
        id: "discovery",
        title: "Begin with the business, not the pages",
        paragraphs: [
          "A useful website process begins by understanding the business, the audience, the services being presented, and the action visitors should be able to take. Discovery may include reviewing the current online presence, clarifying project goals, and identifying practical constraints.",
          "This stage gives later design decisions a clear purpose. The questions and sequence may vary by engagement because a new website, a focused landing page, and a redesign do not require exactly the same work.",
        ],
      },
      {
        id: "structure",
        title: "Plan the structure and content",
        paragraphs: [
          "Before visual design begins, the project needs a content plan. That usually means identifying the pages, deciding how information should be grouped, and determining which calls to action belong in each part of the site.",
          "Existing copy, photographs, brand assets, policies, and business information should be reviewed early. Missing content does not always stop a project, but it should be identified so ownership and next steps are clear.",
        ],
      },
      {
        id: "direction",
        title: "Establish the visual and user-experience direction",
        paragraphs: [
          "Visual direction translates the business into typography, color, imagery, spacing, and interface choices. User-experience decisions consider how visitors move through the site, find information, and complete important actions.",
          "References can help communicate preferences, but the goal is not to copy another website. It is to make choices that fit the business, its audience, and the information being presented.",
        ],
      },
      {
        id: "development",
        title: "Build and test the website",
        paragraphs: [
          "Development turns the approved direction into a working website. Pages, navigation, forms, responsive behavior, metadata, and agreed integrations are implemented according to the project scope.",
          "Testing should include common screen sizes, content accuracy, links, forms, keyboard use, and the most important visitor paths. Technical details matter because they support a clear and dependable experience.",
        ],
      },
      {
        id: "review-launch",
        title: "Review, launch, and support what comes next",
        paragraphs: [
          "Client review is most useful when feedback is consolidated and tied to the agreed goals. Final checks address content, responsive presentation, functionality, domain or hosting coordination, and launch readiness.",
          "After launch, support depends on the engagement. It may include updates, content changes, selected integrations, domain or email coordination, or future improvements. The scope should be clear rather than assumed.",
        ],
      },
    ],
    official: [],
    related: [
      "digital-presence-audit",
      "seo-and-website-metadata",
      "business-needs-a-process",
    ],
    nextSteps: [
      "Clarify the primary business goal for the website.",
      "Identify the audiences and actions the site needs to support.",
      "Gather existing content, brand assets, and access information.",
      "Schedule a consultation to discuss fit, scope, and the appropriate starting point.",
    ],
    disclaimer: digitalDisclaimer,
  },
  {
    slug: "digital-presence-audit",
    title: "What a Digital Presence Audit Can Reveal About Your Business",
    excerpt:
      "A practical review can show where your website, profiles, contact paths, and digital systems are clear, inconsistent, outdated, or creating unnecessary friction.",
    category: "Web & Digital Solutions",
    audience: "Small businesses and professionals",
    type: "Assessment guide",
    updated,
    readTime: "7 min read",
    sections: [
      {
        id: "purpose",
        title: "See the current digital presence as a visitor does",
        paragraphs: [
          "A digital presence audit reviews how a business currently appears and functions online. It can include the website, search listings, social or professional profiles, domain-based email, and the paths people use to make contact.",
          "The purpose is not to find faults for their own sake. It is to identify practical gaps before investing in a redesign, new content, or additional digital tools.",
        ],
      },
      {
        id: "website",
        title: "Review clarity and usability",
        paragraphs: [
          "The review should ask whether the website explains what the business does, who it serves, and what a visitor should do next. Navigation, page organization, calls to action, contact forms, and mobile usability all affect whether information is easy to use.",
          "Outdated services, old staff details, broken links, inconsistent contact information, or unclear next steps can weaken confidence even when the visual design still looks acceptable.",
        ],
      },
      {
        id: "consistency",
        title: "Check consistency across the business",
        paragraphs: [
          "Business names, addresses, phone numbers, service descriptions, hours, logos, and profile links should be reasonably consistent wherever the business appears. Differences can confuse visitors and make routine updates harder to manage.",
          "A professional domain and business email can also affect credibility. The audit should note how the domain, email, website, and outside profiles connect without requesting passwords or exposing credentials.",
        ],
      },
      {
        id: "visibility",
        title: "Consider visibility and measurement",
        paragraphs: [
          "Page titles, headings, meaningful content, local relevance, and technical cleanliness can help search engines understand the website. An audit may also review whether analytics or other tracking is configured appropriately.",
          "These findings support better decisions, but they do not guarantee rankings, traffic, or revenue. They show what is currently measurable and where the foundation may need attention.",
        ],
      },
      {
        id: "priorities",
        title: "Turn findings into priorities",
        paragraphs: [
          "Not every issue requires a complete redesign. Some businesses need clearer content, corrected listings, improved mobile behavior, a stronger contact path, or more consistent branding. Others may benefit from a broader rebuild.",
          "A useful audit separates immediate corrections from larger improvements so the business can choose an appropriate starting point.",
        ],
      },
    ],
    official: [],
    related: [
      "professional-website-design-process",
      "seo-and-website-metadata",
      "simple-administrative-system",
    ],
    nextSteps: [
      "List every public website and profile representing the business.",
      "Check business details and contact paths for accuracy.",
      "Review the website on both desktop and mobile.",
      "Prioritize corrections before selecting new tools or beginning a redesign.",
    ],
    disclaimer: digitalDisclaimer,
  },
  {
    slug: "seo-and-website-metadata",
    title: "Why SEO and Website Metadata Matter for Your Online Presence",
    excerpt:
      "Learn how page titles, descriptions, headings, content, links, and technical quality help people and search engines understand a website.",
    category: "Web & Digital Solutions",
    audience: "Small businesses and professionals",
    type: "Plain-language guide",
    updated,
    readTime: "8 min read",
    sections: [
      {
        id: "foundation",
        title: "SEO begins with a clear, useful website",
        paragraphs: [
          "Search engine optimization, or SEO, is the ongoing work of making a website understandable, useful, and technically accessible. It begins with pages that clearly explain the business, its services, its audience, and its relevance.",
          "Keywords can help describe a topic, but repeating them does not create quality or guarantee a ranking. Search visibility depends on many factors, including competition, location, authority, technical condition, and whether the content serves the person searching.",
        ],
      },
      {
        id: "metadata",
        title: "Metadata provides concise page context",
        paragraphs: [
          "A page title identifies the subject of a page for browser tabs and search results. A meta description summarizes the page and may be used by search engines when presenting it. Each important page should have wording that is specific, accurate, and useful.",
          "Metadata supports understanding, but it cannot compensate for thin, unclear, or outdated page content. Search engines may also choose different result text when another passage better matches a search.",
        ],
      },
      {
        id: "structure",
        title: "Page structure supports people and search engines",
        paragraphs: [
          "A clear main heading, descriptive subheadings, meaningful paragraphs, and useful internal links make information easier to navigate. Image alt text should explain meaningful images for people who cannot see them, rather than being used as a place to insert unrelated keywords.",
          "Internal links help visitors move between related services and resources. They also help search systems understand how pages connect.",
        ],
      },
      {
        id: "technical",
        title: "Technical cleanliness and mobile usability matter",
        paragraphs: [
          "Broken links, duplicate or missing titles, inaccessible controls, poor mobile layouts, slow or unstable pages, and confusing URL structures can make a site harder to use and understand.",
          "Technical SEO is not separate from user experience. A site that works clearly across devices and exposes its content in a dependable structure creates a better foundation for discoverability.",
        ],
      },
      {
        id: "local",
        title: "Keep business relevance accurate",
        paragraphs: [
          "For businesses serving particular locations or communities, website content and business profiles should describe those areas accurately. Names, addresses, phone numbers, hours, and services should remain consistent where practical.",
          "SEO and metadata are valuable parts of a digital presence, but neither provides guaranteed rankings. They support a clearer foundation that still requires useful content, maintenance, and realistic expectations.",
        ],
      },
    ],
    official: [],
    related: [
      "digital-presence-audit",
      "professional-website-design-process",
      "business-records-what-needs-a-home",
    ],
    nextSteps: [
      "Review the title and primary heading on each important page.",
      "Check that page content answers the questions visitors actually bring.",
      "Confirm images, internal links, and mobile layouts remain usable.",
      "Treat metadata as part of a broader content and technical review.",
    ],
    disclaimer: digitalDisclaimer,
  },
  {
    slug: "hostinger-for-small-business-websites",
    title: "Why I Recommend Hostinger for Many Small Business Websites",
    excerpt:
      "A practical website hosting recommendation for small businesses, including why I often consider Hostinger and when a different environment may be the better fit.",
    category: "Web & Digital Solutions",
    audience: "Small businesses and professionals",
    type: "Founder perspective",
    updated: "September 4, 2026",
    modifiedDate: "2026-09-04",
    readTime: "7 min read",
    servicePath: "/web-digital",
    serviceLabel: "Explore Alchemize web and digital services",
    sections: [
      {
        id: "why-hosting-matters",
        title: "Why hosting matters",
        paragraphs: [
          "Building a website is only one part of putting a business online. The finished site still needs a dependable place to live, the domain has to point to the right location, SSL and security settings need attention, and someone needs a manageable way to control the accounts behind it.",
          "I treat hosting as part of the website's working foundation. A platform can affect how the site is deployed, how domains and email are managed, what access the business retains, and how practical future updates will be. The right choice should support the website without creating infrastructure the owner does not need or cannot reasonably manage.",
        ],
      },
      {
        id: "why-hostinger",
        title: "Why I often recommend Hostinger",
        paragraphs: [
          "For many small businesses and newer businesses, Hostinger offers an approachable combination of website hosting, domain management, email options, SSL and security features, and tools for managing a growing website. Keeping those common responsibilities in a clear interface can make the online setup easier to understand after launch.",
          "It can also support a professionally built website without requiring the business owner to manage an unnecessarily complicated server environment. That balance matters to me: the website should be built well, while the account and routine controls should remain accessible to the business that owns them.",
          "This is a practical recommendation, not a claim that one host is best for every website. I consider Hostinger when its capabilities fit the build, the owner's comfort level, and the way the site is expected to grow.",
        ],
      },
      {
        id: "different-fit",
        title: "When I might recommend something different",
        paragraphs: [
          "Hosting recommendations depend on the project. A more complex application, unusual infrastructure requirements, very high traffic, specialized compliance obligations, or a provider-specific integration may point to a different environment.",
          "I also consider who will maintain the site, what deployment workflow the project needs, which services must connect to it, and how much control or isolation is appropriate. The goal is to choose infrastructure for the business in front of me, not to sell the same platform to every client.",
        ],
      },
      {
        id: "how-alchemize-helps",
        title: "How Alchemize helps",
        paragraphs: [
          "Alchemize can help with the broader setup around a business website, not only the visible pages. Depending on the engagement, that work may include website development, hosting configuration, domain connection, SSL, DNS configuration, business email configuration where applicable, deployment, ongoing website support, and third-party integrations.",
          "I also encourage clients to retain ownership of business-critical accounts whenever practical. That creates a cleaner foundation for access, billing, maintenance, and any future work with another provider.",
        ],
        links: [
          {
            label: "Learn about Alchemize web and digital services",
            href: "/web-digital",
          },
        ],
      },
      {
        id: "hostinger-referral",
        title: "Explore Hostinger",
        paragraphs: [
          "If you have reviewed your website's needs and Hostinger appears to be an appropriate fit, you can use the link below to explore its current hosting options. The guidance in this article is still intended to help you make a sound decision whether or not you use the referral link.",
        ],
        links: [
          {
            label: "Explore Hostinger hosting",
            href: "https://www.hostinger.com?REFERRALCODE=JZBJESSABFQ9",
            external: true,
          },
        ],
        disclosure:
          "If you sign up through this link, Alchemize may receive a referral benefit at no additional cost to you.",
      },
    ],
    official: [],
    related: [
      "professional-website-design-process",
      "digital-presence-audit",
      "api-integrations-for-small-business",
    ],
    nextSteps: [
      "List what the website needs from its hosting environment.",
      "Confirm who will own and manage the domain, hosting, and email accounts.",
      "Review expected traffic, integrations, security, and maintenance needs.",
      "Choose a provider only after confirming that it fits the project.",
    ],
    disclaimer: digitalDisclaimer,
  },
  {
    slug: "api-integrations-for-small-business",
    title: "API Integrations: How We Connect the Tools Behind Your Business",
    excerpt:
      "A plain-language look at small business API integrations, with a closer look at secure payment-processing connections and how Alchemize implements them.",
    category: "Web & Digital Solutions",
    audience: "Small businesses and professionals",
    type: "Plain-language guide",
    updated: "September 4, 2026",
    modifiedDate: "2026-09-04",
    readTime: "9 min read",
    servicePath: "/web-digital",
    serviceLabel: "Explore Alchemize web and digital services",
    sections: [
      {
        id: "business-problem",
        title: "The business problem comes first",
        paragraphs: [
          "A business may use one system for its website, another for payments, another for scheduling, and others for email, customer records, or daily operations. When those tools cannot exchange the right information, someone is often left copying details by hand, checking several dashboards, or following up on steps that should have happened automatically.",
          "An API integration can give approved systems a structured way to exchange information and trigger actions. The useful question is not simply whether a tool has an API. It is what the business needs to happen, which systems are responsible for each step, and what information should move between them.",
        ],
      },
      {
        id: "what-an-api-does",
        title: "What an API integration actually does",
        paragraphs: [
          "Consider a customer submitting information through a website. The website sends the appropriate data to a connected service, that service processes the request, the website receives a result, and the customer or business receives the appropriate confirmation. Each system keeps its own role, but the handoff no longer depends on a person re-entering the same information.",
          "The objective is to reduce disconnected manual processes and help the business's systems work together appropriately. A good integration defines what starts the workflow, what data is necessary, what happens after a successful response, and what the customer or team should see when something fails.",
        ],
        callout:
          "Customer submits information → website sends the required data → connected service processes it → website receives the result → customer and/or business receives confirmation.",
      },
      {
        id: "payment-processing",
        title: "Payment-processing integrations",
        paragraphs: [
          "For a payment integration, an Alchemize-built website or application can create the technical connection to a selected payment provider. The customer begins on the website or application, the provider's secure payment infrastructure handles the financial transaction, and the result returns so the site can show an appropriate confirmation, issue or trigger a receipt, or update an internal business record when that is part of the approved workflow.",
          "Sensitive payment information should be handled by the payment provider through its secure payment tools rather than being unnecessarily stored as raw card data inside the business website. The exact approach depends on the provider and project, but minimizing sensitive-data exposure is an important design decision.",
          "Alchemize does not process, hold, or settle the customer's funds. The payment provider performs the financial transaction; Alchemize implements the connection between the business's website or application and that provider.",
        ],
        callout:
          "Customer → Alchemize-built website or application → payment provider → payment result → website or application → confirmation, receipt, and/or approved internal record.",
      },
      {
        id: "implementation-process",
        title: "Our implementation process",
        paragraphs: [
          "API implementation is more than connecting an API key. The connection has to fit the actual workflow and account for security, errors, customer experience, and the actions that should occur after the provider responds.",
        ],
        ordered: [
          "Understand the business workflow.",
          "Determine which systems need to communicate.",
          "Review the provider's API and available capabilities.",
          "Determine what information actually needs to move between systems.",
          "Build the integration.",
          "Secure credentials and sensitive configuration appropriately.",
          "Handle success and failure responses.",
          "Test the complete workflow.",
          "Deploy the integration.",
          "Verify the live workflow.",
        ],
      },
      {
        id: "other-possibilities",
        title: "Other API possibilities",
        paragraphs: [
          "The same general approach can support many other business workflows when the selected provider offers an appropriate API. Examples include scheduling, transactional email, CRM or customer management, document workflows, cloud storage, accounting or bookkeeping platforms, shipping or fulfillment, form submissions, and internal business automation.",
          "These are examples of what APIs can make possible, not a promise that every provider or workflow can be supported. Feasibility depends on the provider's available API, its access and security requirements, and what the client actually needs the systems to do.",
        ],
      },
      {
        id: "closing-perspective",
        title: "The technical layers should serve the business",
        paragraphs: [
          "I do not expect a small business owner to understand every technical layer behind a website. My role is to understand what you need the business to do, identify which systems need to work together, and build a connection that makes sense for the workflow, the customer, and the people who will manage it after launch.",
        ],
        links: [
          {
            label: "Learn about Alchemize web and digital services",
            href: "/web-digital",
          },
        ],
      },
    ],
    official: [],
    related: [
      "professional-website-design-process",
      "hostinger-for-small-business-websites",
      "business-needs-a-process",
    ],
    nextSteps: [
      "Describe the business outcome before choosing a technical approach.",
      "List the systems involved and who is responsible for each step.",
      "Confirm the provider offers the API capabilities the workflow requires.",
      "Plan for security, errors, testing, and the live handoff—not only the successful path.",
    ],
    disclaimer: digitalDisclaimer,
  },
  {
    slug: "starting-a-business-organization-checklist",
    title: "Business Startup & Formation Workbook",
    excerpt:
      "Organize the decisions, registrations, records, deadlines, and operating information behind a new business.",
    category: "Starting a Business",
    audience: "Entrepreneurs and small businesses",
    type: "Guide & checklist",
    updated,
    readTime: "10 min read",
    printable: true,
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
