// SERVICE-DETAIL CONTENT (English)
//
// Additional, service-specific modules for the editorial service page, keyed by
// the canonical `serviceKey`. Titles, routes, hero lines and the existing
// scope/boundary copy stay in serviceCatalog.js; this file adds what a buyer
// needs to decide: who it is for, what is done, how the service is scoped,
// where it stops, how it differs from adjacent services, and the practical
// questions.
//
// Module shapes (every module is optional; a page uses only what helps):
//   cta      { hero, close, info, title, body }  service-specific CTA wording
//   summary  concise positioning line for the hero
//   fit      { title, items[] }
//   does     { title, intro, groups: [{ title, items[] }] }
//   options  { title, intro, items: [{ name, tag, text, points[] }], note }
//   pricing  { title, intro, tiers: [{ id, name, text, points[] }], extras,
//              notes[], separate: { title, items[] }, cta }   (priced services only)
//   process  [[name, text]]         overrides the catalog steps
//   prepare  [item]                 overrides the "what to bring" list
//   compare  { title, intro, rows: [{ label, text, to, current }] }
//   faq      { title, items: [{ q, a }] }
//   related  [[route, note]]
//
// PRICING POLICY: dollar amounts for Translation and Apostille come from
// src/data/publicServicePricing.js. No other service may show a price or any
// internal commercial figure in this file.

const R = {
  tax: "/services/individuals/tax-preparation",
  notary: "/services/individuals/notary-document-services",
  translation: "/services/individuals/translation-services",
  apostille: "/services/individuals/apostille-services",
  advisory: "/services/businesses/advisory-optimization",
  operations: "/services/businesses/operations-implementation",
  foundation: "/services/businesses/readiness-growth",
  bookkeeping: "/services/businesses/bookkeeping-financial-reporting",
  payroll: "/services/businesses/payroll-processing",
  businessTax: "/services/businesses/business-tax-support",
  web: "/web-digital",
};

export const serviceDetailEn = {
  "individual-translation": {
    cta: {
      hero: "Request a Translation",
      close: "Request a Translation",
      info: "Ask about your document",
      title: "Send us the document details.",
      body: "Tell us what the document is, the language direction, and who will receive it. Alchemize confirms the translation type, scope, and price before work begins.",
    },
    summary:
      "English ↔ Spanish translation of written documents, from short personal records to certified, official-use translations. Pricing is published below; complex or specialized material is reviewed and quoted first.",
    fit: {
      title: "Common requests",
      items: [
        "Personal records for a school, employer, agency, or other institution",
        "Business forms, policies, correspondence, and client-facing materials",
        "Short documents needed in both languages",
        "Documents that must be certified for official use",
        "Translations that will also need notarization or an apostille",
      ],
    },
    pricing: {
      title: "Choose the type of translation.",
      intro:
        "English → Spanish and Spanish → English use the same rates. Rates are shown before any rush charge, separate services, or third-party costs.",
      tiers: [
        {
          id: "standard",
          name: "Standard short document",
          text: "For short documents that do not need certification.",
          points: [
            "English ↔ Spanish",
            "Basic formatting",
            "One correction round for translation errors",
          ],
        },
        {
          id: "general",
          name: "General & business translation",
          text: "For letters, forms, policies, and other general or business content priced by length.",
          points: [
            "English ↔ Spanish",
            "Priced by source word, with a minimum",
            "Specialized legal, medical, or technical material is reviewed and quoted",
          ],
        },
        {
          id: "certified",
          name: "Certified & official-use",
          text: "For documents an institution requires to be certified.",
          points: [
            "Complete translation",
            "Relevant stamps, seals, and annotations",
            "Reasonable layout preservation and proofreading",
            "Signed Certificate of Translation Accuracy",
            "Digital PDF and one correction round for translation errors",
          ],
        },
      ],
      extras: [
        {
          label: "Rush service",
          text: "+{rush} on the applicable price, subject to availability.",
        },
        {
          label: "Complex material",
          text: "Complex formatting or design, and specialized legal, medical, or technical documents, are reviewed and quoted.",
        },
        {
          label: "Turnaround",
          text: "Depends on document length, complexity, formatting, certification requirements, and current workload. Timing is discussed when the scope is confirmed.",
        },
      ],
      separate: {
        title: "Priced or handled separately",
        items: [
          "Notarization, when the receiving party requires it",
          "Apostille facilitation, when a document is used abroad",
        ],
      },
      cta: "Request a Translation",
    },
    does: {
      title: "How the work is handled",
      intro:
        "The type you choose sets the level of proofreading, certification, and delivery. Alchemize confirms it before anything is translated.",
      groups: [
        {
          title: "Before translation begins",
          items: [
            "Confirm the document, language direction, and purpose",
            "Identify what the receiving institution requires for official-use work",
            "Flag complex formatting or specialized content for review and quote",
            "Confirm the type, scope, and price",
          ],
        },
        {
          title: "The translation",
          items: [
            "English → Spanish and Spanish → English",
            "Personal, administrative, and business documents",
            "Proofreading before delivery for certified work",
            "One correction round for translation errors",
          ],
        },
      ],
    },
    process: [
      [
        "Share the document",
        "Tell us the document, the languages, its purpose, and who will receive it.",
      ],
      [
        "Confirm the type",
        "Alchemize confirms standard, general, or certified work and any review needed.",
      ],
      [
        "Translate",
        "The document is translated and proofread to the agreed scope.",
      ],
      [
        "Deliver",
        "You receive the translation as a digital PDF, with the signed certificate when certified.",
      ],
    ],
    prepare: [
      "The document, or a clear scan or photo of it",
      "The source and target language",
      "Who will receive the translation and any instructions they gave",
      "Any names, spellings, or terms that must stay consistent",
      "Your deadline",
    ],
    compare: {
      title: "Translation, notarization, and apostille are separate steps.",
      intro:
        "Some documents need only a translation. Others need one or more of these, in a specific order. Each is scoped on its own.",
      rows: [
        {
          label: "Translation",
          text: "Converts a written document between English and Spanish. The type you choose sets proofreading, certification, and delivery.",
          current: true,
        },
        {
          label: "Notarization",
          text: "Verifies a signer's identity and completes a notarial act. It is needed only when the receiving party requires it.",
          to: R.notary,
        },
        {
          label: "Apostille facilitation",
          text: "Coordinates authentication of a North Carolina document for use in another country. It is not a translation.",
          to: R.apostille,
        },
        {
          label: "Acceptance",
          text: "Agencies, courts, consulates, and foreign authorities set their own rules. Alchemize asks what the receiving party requires before accepting official-use work, but cannot guarantee acceptance.",
        },
      ],
    },
    faq: {
      title: "Translation questions",
      items: [
        {
          q: "Which type of translation do I need?",
          a: "It depends on what the receiving party asks for. If an agency, school, or institution requires a certified translation, choose certified & official-use. Everyday and business content usually fits standard or general translation. If you are unsure, tell us who will receive it and we will help identify the right type.",
        },
        {
          q: "What does “up to 250 source words” mean?",
          a: "Per-page pricing applies to pages of up to 250 words in the source document. Longer or denser pages are reviewed so the price can be confirmed before work begins.",
        },
        {
          q: "Will my translation be accepted?",
          a: "Alchemize cannot guarantee acceptance. Agencies, institutions, courts, consulates, and foreign authorities set their own requirements. For official-use work we ask what the receiving party requires before accepting the job.",
        },
        {
          q: "Do I need notarization or an apostille as well?",
          a: "Only if the receiving party requires it. Both are separate services, scoped and priced on their own, and the receiving party can tell you which steps apply.",
        },
        {
          q: "How long will it take?",
          a: "Turnaround depends on document length, complexity, formatting, certification requirements, and current workload. Rush service is available subject to availability. Timing is confirmed when the scope is confirmed.",
        },
        {
          q: "What if there is a mistake?",
          a: "Standard and certified translations include one correction round for translation errors.",
        },
        {
          q: "Can you translate legal, medical, or technical documents?",
          a: "Specialized material and documents with complex formatting or design are reviewed first and quoted individually.",
        },
      ],
    },
    related: [
      [
        R.apostille,
        "If the document will be used abroad, authentication is a separate step.",
      ],
      [
        R.notary,
        "If a signature or sworn statement must be notarized, request it separately.",
      ],
    ],
  },

  "individual-apostille": {
    cta: {
      hero: "Request Apostille Support",
      close: "Request Apostille Support",
      info: "Ask about your document",
      title: "Tell us about the document and where it is going.",
      body: "Share the document type and the destination country. Alchemize reviews what the document needs and confirms scope and next steps before an engagement begins.",
    },
    summary:
      "Alchemize facilitates the North Carolina apostille process for North Carolina documents: reviewing the document, working out what preparation it needs, and coordinating submission and return. Pricing is published below; government and third-party fees are separate.",
    fit: {
      title: "Common situations",
      items: [
        "A North Carolina document that will be used in another country",
        "A foreign institution or authority has asked for an apostille",
        "You are not sure whether the document needs notarization or a translation first",
        "Several documents need to move through the process together",
      ],
    },
    pricing: {
      title: "Transparent facilitation pricing.",
      intro:
        "This is Alchemize's facilitation fee. Government and other third-party costs are separate and depend on your documents and destination.",
      tiers: [
        {
          id: "first",
          name: "First document",
          text: "Review, preparation coordination, and facilitation for one North Carolina document.",
          points: [
            "Document and destination review",
            "Preparation requirements identified",
            "Submission and return coordinated",
          ],
        },
        {
          id: "additional",
          name: "Additional documents",
          text: "Each further document facilitated in the same engagement.",
          points: ["Added to the same request", "Same North Carolina process"],
        },
      ],
      extras: [
        {
          label: "Current service model",
          text: "North Carolina documents only.",
        },
        {
          label: "Requests",
          text: "Each request is reviewed before an engagement is confirmed.",
        },
      ],
      separate: {
        title: "Not included in the facilitation fee",
        items: [
          "Government fees",
          "Shipping and courier costs",
          "Expedited and international shipping costs",
          "Other third-party costs",
          "Notarization or certified translation, when the document needs them",
        ],
      },
      cta: "Request Apostille Support",
    },
    does: {
      title: "What Alchemize does, and what it does not.",
      intro:
        "Alchemize facilitates the process. The apostille itself is issued by the appropriate government authority.",
      groups: [
        {
          title: "Alchemize facilitates",
          items: [
            "Reviews the document and where it will be used",
            "Identifies whether notarization, translation, or other preparation is needed first",
            "Organizes the document package",
            "Facilitates the appropriate North Carolina apostille process",
            "Coordinates return handling for the completed documents",
          ],
        },
        {
          title: "Outside Alchemize's control",
          items: [
            "Issuing the apostille",
            "Government processing times",
            "Whether a foreign authority accepts the document",
            "Legal or immigration advice",
          ],
        },
      ],
    },
    process: [
      [
        "Review the document",
        "Document type, issuing source, destination country, and the receiving party's requirements.",
      ],
      [
        "Determine preparation",
        "Whether notarization, translation, or other steps must come first, depending on the document and destination.",
      ],
      [
        "Facilitate the process",
        "Organize the package and facilitate the appropriate North Carolina apostille process.",
      ],
      [
        "Return the documents",
        "Coordinate the return of the completed documents as agreed.",
      ],
    ],
    prepare: [
      "The document, or a clear copy of it",
      "The destination country and receiving authority",
      "Any instructions from the receiving party",
      "Existing notarization or certification records, if any",
      "How and where the completed documents should be returned",
    ],
    compare: {
      title: "Which services might your document need?",
      intro:
        "Depending on the document and destination, you may need some combination of these. Alchemize keeps them distinct so each step is scoped on its own.",
      rows: [
        {
          label: "Apostille facilitation",
          text: "Coordinates the North Carolina apostille process for your document. Alchemize does not issue apostilles.",
          current: true,
        },
        {
          label: "Document preparation",
          text: "Making sure the document is complete, correctly signed, and organized before it is submitted.",
        },
        {
          label: "Notarization",
          text: "Some documents must be notarized before an apostille can be requested. Whether yours does depends on the document.",
          to: R.notary,
        },
        {
          label: "Certified translation",
          text: "If the receiving country needs the document in another language, translation is a separate service.",
          to: R.translation,
        },
      ],
    },
    faq: {
      title: "Apostille questions",
      items: [
        {
          q: "Does Alchemize issue the apostille?",
          a: "No. Apostilles are issued by the appropriate government authority. Alchemize facilitates the process and coordinates the documents.",
        },
        {
          q: "Do I need a translation before an apostille?",
          a: "It depends on the destination and the receiving authority. Translation is a separate service. We identify what your situation needs during the document review.",
        },
        {
          q: "Does the document need to be notarized first?",
          a: "Some documents do and some do not. The answer depends on the document type, so it is determined during review rather than assumed.",
        },
        {
          q: "Which documents can you help with?",
          a: "The current service model covers North Carolina documents. Tell us what you have and we will confirm whether it fits.",
        },
        {
          q: "What does the facilitation fee cover?",
          a: "Alchemize's facilitation of the first document, with each additional document in the same engagement added. Government fees, shipping and courier, expedited or international costs, and other third-party costs are separate.",
        },
        {
          q: "How long will it take?",
          a: "Processing time is controlled by the government authority, so Alchemize cannot guarantee it. We explain what to expect for your document when we confirm the scope.",
        },
        {
          q: "Will the foreign country accept it?",
          a: "Alchemize cannot guarantee acceptance by a foreign authority. Check the receiving party's requirements, and share them with us so the preparation matches.",
        },
      ],
    },
    related: [
      [
        R.translation,
        "A separate service, needed when the receiving country requires another language.",
      ],
      [
        R.notary,
        "Some documents must be notarized before an apostille can be requested.",
      ],
    ],
  },

  "individual-notary": {
    cta: {
      hero: "Request a Notary Appointment",
      close: "Request a Notary Appointment",
      info: "Ask before you book",
      title: "Tell us what needs to be notarized.",
      body: "Share the document, who needs to sign, and where and when. Alchemize reviews the request and coordinates the appointment with you.",
    },
    summary:
      "Request a North Carolina notary appointment. Tell Alchemize what needs to be notarized and where; the request is reviewed and the appointment is coordinated with an authorized notary.",
    fit: {
      title: "Common notarial needs",
      items: [
        "Acknowledgments of a signature on a document",
        "Jurats and sworn statements",
        "Oaths and affirmations",
        "Documents a receiving party requires to be notarized",
        "Signers and witnesses who need to be coordinated for one appointment",
      ],
    },
    does: {
      title: "What the service supports.",
      intro:
        "Notarization is one step in getting a document ready. Alchemize helps with the requests and the preparation around it.",
      groups: [
        {
          title: "Notarial requests",
          items: [
            "Review of the request and the act being asked for",
            "Coordination of the appointment with an authorized notary",
            "Confirmation of signers, identification, and witnesses",
            "Completion of the requested notarial act",
          ],
        },
        {
          title: "Document support around the appointment",
          items: [
            "Printing, scanning, and copying",
            "File conversion and digital organization",
            "Assembly of document packets",
            "Completeness and format checks before submission",
          ],
        },
      ],
    },
    process: [
      [
        "Request",
        "Tell us the document, who needs to sign, the location, and your deadline.",
      ],
      [
        "Review",
        "Alchemize confirms the act being requested and any instructions from the receiving party.",
      ],
      [
        "Coordinate",
        "The appointment is scheduled and its details confirmed with everyone involved.",
      ],
      [
        "Appointment",
        "Identification is verified and the notarial act is completed by an authorized notary.",
      ],
    ],
    prepare: [
      "The complete document, unsigned unless instructed otherwise",
      "Acceptable identification for every signer",
      "All signers present, and witnesses if required",
      "Any instructions from the receiving party",
      "Appointment location, timing, and return details",
    ],
    compare: {
      title: "Where notarization fits with other services.",
      intro:
        "A notary verifies identity and completes a notarial act. It does not decide what a document should say or whether it is legally sufficient.",
      rows: [
        {
          label: "Notarization",
          text: "Identity verification and completion of the requested notarial act.",
          current: true,
        },
        {
          label: "Document support",
          text: "Printing, scanning, packet organization, and administrative proofreading. This does not include legal forms, drafting, or legal advice.",
        },
        {
          label: "Translation",
          text: "If a document also needs to be in English or Spanish, translation is a separate service.",
          to: R.translation,
        },
        {
          label: "Apostille facilitation",
          text: "For use abroad, an apostille may follow notarization. It is a separate service.",
          to: R.apostille,
        },
      ],
    },
    faq: {
      title: "Notary questions",
      items: [
        {
          q: "What happens after I submit a request?",
          a: "Alchemize reviews it, confirms the details with you, and coordinates the appointment. Depending on the request, the appointment may be coordinated with another appropriate notary.",
        },
        {
          q: "What should I bring?",
          a: "The complete document (unsigned unless instructed otherwise), acceptable identification for every signer, all required signers and witnesses, and any instructions from the receiving party.",
        },
        {
          q: "Can you tell me which notarial act my document needs?",
          a: "The receiving party, or an attorney, should specify that. A notary does not select forms, draft language, or give legal advice, but Alchemize can review the receiving party's instructions with you.",
        },
        {
          q: "Can you notarize a document that will be used abroad?",
          a: "Notarization may be a first step. Authentication for use in another country, an apostille, is a separate service.",
        },
        {
          q: "How much does it cost?",
          a: "Fees are confirmed with you when your request is reviewed.",
        },
      ],
    },
    related: [
      [
        R.apostille,
        "For documents going abroad, an apostille can be the next step.",
      ],
      [
        R.translation,
        "A separate service for documents needing another language.",
      ],
    ],
  },

  "individual-tax": {
    cta: {
      hero: "Request Tax Preparation",
      close: "Request Tax Preparation",
      info: "Ask whether your return fits",
      title: "Tell us about your tax situation.",
      body: "You do not need to know which forms apply. Describe your income and any changes; Alchemize confirms fit and scope before preparation begins.",
    },
    summary:
      "Individual tax preparation for straightforward and more involved returns, including self-employment, rental property, and prior-year or amended filings, organized around your records so you can start without knowing which forms apply.",
    fit: {
      title: "Common situations",
      items: [
        "W-2 income with standard or itemized deductions",
        "Self-employment or side income",
        "Rental property",
        "Investment sales, retirement, HSA, education, unemployment, or marketplace insurance items",
        "K-1 income",
        "A return that needs amending, or prior years still to file",
      ],
    },
    does: {
      title: "Returns Alchemize is structured to support.",
      intro:
        "Every return is reviewed for fit before an engagement is confirmed. Supported scope is not the same as automatic acceptance of every situation.",
      groups: [
        {
          title: "Individual returns",
          items: [
            "Straightforward Form 1040 returns",
            "More involved individual returns with added schedules",
            "Self-employed filers, including Schedule C",
            "Rental-property situations",
            "Ordinary investment activity",
            "Retirement, HSA, education, unemployment, and marketplace-related items where applicable",
            "K-1 situations, subject to complexity",
          ],
        },
        {
          title: "Corrections and prior years",
          items: [
            "Amended returns, including returns prepared elsewhere",
            "Prior-year returns, with each tax year handled as its own engagement",
          ],
        },
        {
          title: "What can change the scope",
          items: [
            "The number of businesses or entities involved",
            "The states involved",
            "Investments and basis questions",
            "The condition of your records",
            "Foreign or specialized matters",
          ],
        },
      ],
    },
    process: [
      [
        "Describe your situation",
        "Income sources, life changes, and prior-year filing. No forms needed.",
      ],
      [
        "Confirm fit and scope",
        "Alchemize confirms the return type, states, and complexity before preparation begins.",
      ],
      [
        "Gather and review",
        "Records are collected and missing items identified.",
      ],
      [
        "Prepare and finalize",
        "The return is prepared, reviewed with you, and the next step confirmed.",
      ],
    ],
    compare: {
      title: "Tax preparation is one service among several.",
      intro:
        "Preparing a return does not automatically include the work around it. Each of these is separate.",
      rows: [
        {
          label: "Tax preparation",
          text: "Preparing your return from your records, within the scope confirmed for your situation.",
          current: true,
        },
        {
          label: "Bookkeeping and cleanup",
          text: "Organizing and reconciling financial records. Self-employed or business records that are disorganized may need this first.",
          to: R.bookkeeping,
        },
        {
          label: "Tax planning and advisory",
          text: "Forward-looking strategy is a separate service and is not automatically included.",
        },
        {
          label: "IRS and state representation",
          text: "Notices, audits, and resolution matters are separate and are not part of tax preparation. Some matters need a CPA, enrolled agent, or attorney.",
        },
        {
          label: "Business returns",
          text: "Partnership (1065), S corporation (1120-S), and C corporation (1120) returns are prepared under business tax support.",
          to: R.businessTax,
        },
      ],
    },
    faq: {
      title: "Tax preparation questions",
      items: [
        {
          q: "Do I need to know which forms I need?",
          a: "No. Describe your income and any changes and Alchemize identifies what applies as part of confirming scope.",
        },
        {
          q: "Can you prepare a return if I am self-employed or own rental property?",
          a: "Alchemize is structured to support self-employed filers, including Schedule C, and rental-property situations. The number of businesses or properties, and the states involved, can affect scope.",
        },
        {
          q: "Can you help with prior years or an amended return?",
          a: "Yes, both are within the structure of the service. Each prior year is its own engagement, and amended returns are reviewed before work is accepted.",
        },
        {
          q: "Does tax preparation include planning or IRS representation?",
          a: "No. Tax planning and advisory, and IRS or state representation and resolution, are separate and not automatically included.",
        },
        {
          q: "What if my records are disorganized?",
          a: "Complexity and record condition affect scope. Records that need organizing or reconciling first may call for bookkeeping cleanup before a return can be prepared.",
        },
        {
          q: "How do I know whether my situation fits?",
          a: "Submit an inquiry. Alchemize reviews it and tells you whether it fits the service. Some matters need a CPA, enrolled agent, or attorney instead.",
        },
        {
          q: "What does it cost?",
          a: "Cost is confirmed after your situation is reviewed, based on the return type and its complexity.",
        },
      ],
    },
    related: [
      [
        R.businessTax,
        "For partnership, S corporation, and C corporation returns.",
      ],
      [
        R.bookkeeping,
        "Organized records make a return easier to prepare and review.",
      ],
      [R.notary, "For documents that also need to be notarized."],
    ],
  },

  "business-advisory": {
    cta: {
      hero: "Start a Conversation",
      close: "Start a Conversation",
      info: "Ask which engagement fits",
      title: "Start with the problem you need solved.",
      body: "Describe the challenge, decision, or friction. Alchemize recommends the engagement that fits before any work begins.",
    },
    proof: {
      text: "Advisory draws on Jessy Santos's 15+ years of professional experience in business operations, administration, and client service, plus an MBA, and on a working knowledge of what it takes to carry recommendations out.",
    },
    summary:
      "Advisory is where the work starts: diagnose the current state, find the real constraint, prioritize, and leave with recommendations and a roadmap you can act on. Substantial execution is a separate engagement.",
    fit: {
      title: "When advisory fits",
      items: [
        "A recurring problem you have not been able to trace to its cause",
        "A decision that needs analysis before you commit",
        "Too many priorities and no clear order",
        "Systems or organization that no longer keep up with the business",
        "Recommendations exist, but no plan to carry them out",
      ],
    },
    does: {
      title: "Diagnose, then advise.",
      intro:
        "Advisory works out what should change and why. Putting the change in place is Operations.",
      groups: [
        {
          title: "Diagnose",
          items: [
            "Understand the current state of the business",
            "Identify gaps in workflows, information, ownership, and tools",
            "Analyze a defined business challenge",
            "Evaluate processes, systems, and organization",
          ],
        },
        {
          title: "Advise",
          items: [
            "Prioritize by impact, dependency, urgency, and capacity",
            "Develop clear recommendations",
            "Create an actionable roadmap",
            "Support decisions with research, including vendor and provider review",
          ],
        },
      ],
    },
    options: {
      title: "Engagements grow with the question.",
      intro:
        "Start with the smallest engagement that answers your question. Each builds on the one before.",
      items: [
        {
          tag: "One defined challenge",
          name: "Focused strategy",
          text: "A working session on one challenge or decision, ending in documented next steps.",
        },
        {
          tag: "The broader picture",
          name: "Business foundation assessment",
          text: "Discovery, a review of gaps across the business, prioritized recommendations, and a written action plan.",
        },
        {
          tag: "Deeper work",
          name: "Business intensive",
          text: "Half-day or full-day work across connected issues: process, workflow, and systems analysis, with implementation planning and a written summary.",
        },
        {
          tag: "New businesses",
          name: "Startup and readiness",
          text: "Foundation assessment plus a startup roadmap, described under Business Foundation.",
          to: R.foundation,
        },
      ],
      note: "Not sure which fits? Describe the situation and Alchemize will recommend a starting point.",
    },
    compare: {
      title:
        "Advisory, operations, and administrative support are different jobs.",
      intro:
        "Advisory determines what should change and why. Operations implements how it changes. Administrative support carries out defined tasks.",
      rows: [
        {
          label: "Business Advisory",
          text: "Diagnose and advise: assess, prioritize, recommend, and plan.",
          current: true,
        },
        {
          label: "Operations implementation",
          text: "Build and improve: redesign workflows, write SOPs, configure systems, and train the team.",
          to: R.operations,
        },
        {
          label: "Administrative support",
          text: "Do: perform defined recurring tasks, as needed or on a monthly basis.",
          to: R.operations,
        },
        {
          label: "Business Foundation",
          text: "For businesses being established or readied for their next stage.",
          to: R.foundation,
        },
      ],
    },
    faq: {
      title: "Advisory questions",
      items: [
        {
          q: "What is the difference between advisory and implementation?",
          a: "Advisory diagnoses the problem and recommends what to do. Implementation, which is Operations, builds and configures the change. They are separate engagements so you can act on the recommendations however you choose.",
        },
        {
          q: "Which engagement should I start with?",
          a: "If you have one clear challenge or decision, start with a focused session. If you are not sure where the friction is, start with the broader assessment. Alchemize will recommend one when you describe the situation.",
        },
        {
          q: "What do I receive at the end?",
          a: "Documented recommendations and next steps. The broader formats include a written action plan.",
        },
        {
          q: "Can Alchemize carry out the recommendations?",
          a: "Yes, through Operations or other services, scoped separately. You are also free to act on them yourself or with another provider.",
        },
        {
          q: "Does advisory replace legal, accounting, or tax advice?",
          a: "No. Business advisory does not replace legal, accounting, tax, investment, or other regulated professional advice.",
        },
      ],
    },
    related: [
      [
        R.operations,
        "Where recommendations become working workflows and systems.",
      ],
      [R.foundation, "For startup readiness and business planning."],
      [R.web, "For websites, search visibility, and automation."],
    ],
  },

  "business-operations": {
    cta: {
      hero: "Request Operations Support",
      close: "Request Operations Support",
      info: "Ask which scope fits",
      title: "Tell us which workflow needs to work better.",
      body: "Describe the process, the tools involved, and what should be different. Alchemize recommends a scope before work begins.",
    },
    proof: {
      text: "Jessy Santos's professional background includes supporting CRM creation and development, contributing to workflow and process improvement, implementing automation, maintaining an intranet, and day-to-day administrative operations.",
    },
    summary:
      "Operations is where recommendations become working systems. Alchemize redesigns workflows, builds the SOPs, templates, and tool configurations behind them, trains your team, and hands off something the business can maintain.",
    fit: {
      title: "When operations fits",
      items: [
        "Client information lives in email, texts, and memory",
        "Recurring tasks have no clear owner",
        "Files and records have no dependable home",
        "A CRM, intake, scheduling, or task system needs to be set up",
        "You need recurring administrative help with defined tasks",
      ],
    },
    does: {
      title: "Build and improve how the work runs.",
      intro:
        "Operations redesigns and builds how the work itself functions. Administrative support performs defined tasks inside a process that already exists.",
      groups: [
        {
          title: "Workflows",
          items: [
            "Workflow review and redesign",
            "Process mapping",
            "Standard operating procedures",
            "Checklists and templates",
          ],
        },
        {
          title: "Systems and tools",
          items: [
            "Business-system configuration",
            "Tool and platform setup",
            "Straightforward integrations",
            "Data organization and import where appropriate",
          ],
        },
        {
          title: "Adoption and scale",
          items: [
            "Training and handoff",
            "Improvement across several connected workflows",
            "Larger operational transformation, scoped as custom work",
          ],
        },
        {
          title: "Administrative support",
          items: [
            "Document, spreadsheet, and file organization",
            "Scheduling and routine correspondence",
            "CRM and data entry, and client intake administration",
            "Invoice preparation and follow-up",
            "Online research and meeting preparation",
          ],
        },
      ],
    },
    options: {
      title: "Scoped to the size of the change.",
      intro:
        "The work is defined by deliverables, not hours. The right size depends on how many workflows and systems are involved.",
      items: [
        {
          tag: "One workflow",
          name: "Process and workflow implementation",
          text: "Review, redesign, and implement one clearly defined workflow, with a supporting checklist or template, operating instructions, and training.",
        },
        {
          tag: "Tools and systems",
          name: "Business systems setup",
          text: "Requirements, a tool recommendation, configuration, a straightforward integration, basic data import, and training.",
        },
        {
          tag: "Connected workflows",
          name: "Operations improvement sprint",
          text: "A defined multi-week engagement across several connected workflows: mapping, redesign, implementation, SOPs, and training.",
        },
        {
          tag: "Large or complex",
          name: "Operational transformation",
          text: "Multiple departments, extensive SOP libraries, large system implementations, or significant migrations, scoped after discovery.",
        },
      ],
      note: "Administrative support is offered as-needed or as recurring monthly support for defined tasks.",
    },
    compare: {
      title:
        "Operations, advisory, and administrative support are different jobs.",
      intro:
        "Advisory determines what should change and why. Operations implements how it changes. Administrative support does the defined work.",
      rows: [
        {
          label: "Operations implementation",
          text: "Build and improve: redesign the workflow, document it, configure the tools, and train the team.",
          current: true,
        },
        {
          label: "Business Advisory",
          text: "Diagnose and advise: assess the business and decide what should change first.",
          to: R.advisory,
        },
        {
          label: "Administrative support",
          text: "Do: perform defined recurring tasks. It does not redesign the process or implement systems.",
          current: true,
        },
        {
          label: "Digital automation",
          text: "When a workflow needs software connected across apps, it belongs with Web & Digital.",
          to: R.web,
        },
      ],
    },
    faq: {
      title: "Operations questions",
      items: [
        {
          q: "What is the difference between operations and advisory?",
          a: "Advisory decides what should change and why. Operations builds the change: the workflow, documents, tools, and training. If the problem and the target workflow are already clear, implementation can start directly.",
        },
        {
          q: "What is the difference between operations and administrative support?",
          a: "Operations designs and builds how the work functions. Administrative support performs defined tasks such as scheduling, data entry, correspondence, and file organization. Administrative support does not include process redesign or system implementation.",
        },
        {
          q: "Can you set up a CRM or intake system?",
          a: "Yes, including basic configuration and straightforward integrations. Advanced CRM work, complex migrations, and custom automation are scoped separately, with automation handled under Web & Digital.",
        },
        {
          q: "Will my team be trained?",
          a: "Training and handoff are part of implementation, so the process can be run without Alchemize.",
        },
        {
          q: "Is administrative support available on a recurring basis?",
          a: "Yes, as-needed or as recurring monthly support for defined tasks.",
        },
      ],
    },
    related: [
      [R.advisory, "Decide what should change and why before building it."],
      [R.web, "For automation and connected digital systems."],
      [R.bookkeeping, "Bookkeeping, payroll, and tax are separate services."],
    ],
  },

  "business-readiness": {
    cta: {
      hero: "Request Business Foundation Support",
      close: "Request Business Foundation Support",
      info: "Ask which starting point fits",
      title: "Tell us where the business is starting from.",
      body: "Describe the business, its stage, and what it is preparing for. Alchemize recommends a starting point before any work begins.",
    },
    proof: {
      text: "Jessy Santos brings 15+ years of professional experience across operations, administration, and financial responsibilities, plus an MBA, to how a new or growing business gets organized.",
    },
    summary:
      "For businesses getting established or ready for their next stage: a clear read on where the foundation stands, a startup roadmap, and business-plan and financial-readiness work, without promising financing, certification, or approval.",
    fit: {
      title: "When this fits",
      items: [
        "A new business that needs a clear startup path",
        "Formation details and startup steps are scattered",
        "A plan or financial projections are needed for planning or outside review",
        "Registrations, certifications, or vendor opportunities need organized records",
        "An existing business preparing for its next stage",
      ],
    },
    does: {
      title: "Assess, plan, and organize.",
      intro:
        "The goal is a stronger planning and decision process, not financing procurement or a promise of approval.",
      groups: [
        {
          title: "Assess",
          items: [
            "Foundation assessment: discovery, gap review, and prioritized recommendations",
            "A written action plan",
            "Business and growth-readiness review",
          ],
        },
        {
          title: "Plan",
          items: [
            "Startup roadmap and readiness checklist",
            "Business plan development",
            "Financial-readiness materials: projections, cash flow, break-even, and use-of-funds framework where applicable",
          ],
        },
        {
          title: "Organize",
          items: [
            "Formation and startup administrative preparation",
            "EIN assistance within permitted scope",
            "Registration, vendor-record, and capability-statement readiness",
            "Local presence basics, including Google Business Profile setup",
          ],
        },
      ],
    },
    options: {
      title: "Start where the business is.",
      intro:
        "These build on each other. Website, bookkeeping, payroll, tax, and substantial implementation are separate services.",
      items: [
        {
          tag: "Understand the starting point",
          name: "Foundation assessment",
          text: "Discovery, a gap review, prioritized recommendations, and a written action plan.",
        },
        {
          tag: "New businesses",
          name: "Startup package",
          text: "Assessment, startup roadmap, operations consultation, Google Business Profile setup, a readiness checklist, and working meetings on first steps.",
        },
        {
          tag: "Plan the business",
          name: "Business plan",
          text: "Discovery, executive summary, market and competitor basics, operations, management, and marketing approach, in a formatted plan with revision rounds.",
        },
        {
          tag: "Plan and financial readiness",
          name: "Business plan with financial readiness",
          text: "The plan plus deeper market work, documented assumptions, projected profit and loss, cash flow, break-even analysis, and a supporting-document checklist. Larger or research-heavy plans are scoped individually.",
        },
      ],
      note: "Business planning is not loan procurement. Alchemize does not match lenders, negotiate with them, submit applications, or guarantee financing.",
    },
    compare: {
      title: "Foundation work versus the services around it.",
      intro:
        "Foundation work gets a business established and planned. These neighboring services do different jobs.",
      rows: [
        {
          label: "Business Foundation",
          text: "Establish, plan, and prepare the business, including financial readiness.",
          current: true,
        },
        {
          label: "Business Advisory",
          text: "Diagnose a specific challenge or decision in a business that is already running.",
          to: R.advisory,
        },
        {
          label: "Bookkeeping",
          text: "Ongoing financial records, separate from planning and projections.",
          to: R.bookkeeping,
        },
        {
          label: "Web & Digital",
          text: "Websites, ongoing Google Business Profile and search work, and automation.",
          to: R.web,
        },
      ],
    },
    faq: {
      title: "Foundation questions",
      items: [
        {
          q: "Will you help me get a loan?",
          a: "No. Alchemize provides business-planning and financial-readiness services. It does not match lenders, negotiate with lenders, submit applications, or guarantee financing eligibility, approval, or funding.",
        },
        {
          q: "Do you handle legal formation?",
          a: "Alchemize provides nonlegal formation and startup administrative preparation. Choices that need legal or tax judgment should be reviewed by an attorney or CPA.",
        },
        {
          q: "What is the difference between an assessment and a business plan?",
          a: "An assessment reviews where the business stands and what to do first. A business plan documents the business, market, and operations, and can include financial projections.",
        },
        {
          q: "What is not in the startup package?",
          a: "A website, bookkeeping, payroll, tax, and substantial implementation are separate services.",
        },
        {
          q: "Where should I start if I am not sure?",
          a: "Start with the foundation assessment. It shows what to do first and what can wait.",
        },
      ],
    },
    related: [
      [R.advisory, "For a specific challenge in a business already running."],
      [R.bookkeeping, "For the ongoing financial record after launch."],
      [R.web, "For the website and local presence."],
    ],
  },

  "business-bookkeeping": {
    cta: {
      hero: "Request Bookkeeping Support",
      close: "Request Bookkeeping Support",
      info: "Ask which level fits",
      title: "Tell us how your books stand today.",
      body: "Describe your accounts, your volume, and the condition of your records. Alchemize recommends the right level of support, and whether cleanup comes first.",
    },
    proof: {
      text: "Jessy Santos's 15+ years of professional experience include financial responsibilities, business records, and administrative financial processes.",
    },
    summary:
      "Recurring bookkeeping that keeps transactions categorized, accounts reconciled, and reporting current, with separate cleanup when historical records need to be brought current first.",
    fit: {
      title: "When bookkeeping fits",
      items: [
        "You have books, but you do not trust them",
        "Growing activity across several bank or credit accounts",
        "You need regular reports to make decisions, not only at tax time",
        "Records are behind, incomplete, or disorganized",
        "Clean books are needed before a tax return",
      ],
    },
    does: {
      title: "What Alchemize does every month.",
      intro:
        "The rhythm is the point: transactions stay categorized, accounts stay reconciled, and reports stay current.",
      groups: [
        {
          title: "Each cycle",
          items: [
            "Categorize transactions",
            "Reconcile bank and credit accounts",
            "Track income and expenses",
            "Maintain the ledger",
            "Prepare recurring financial reports appropriate to your service level",
          ],
        },
        {
          title: "Reporting and review",
          items: [
            "Profit and loss, balance sheet, and cash-flow summary",
            "Comparisons with prior periods, with trends and variances explained in plain language",
            "Periodic review discussions, depending on the level of support",
          ],
        },
        {
          title: "Deeper reporting, when the records support it",
          items: [
            "Quarterly financial reviews",
            "Basic 12-month cash-flow forecasts",
            "Scoped separately as reporting work",
          ],
        },
      ],
    },
    options: {
      title: "How the right level of support is chosen.",
      intro:
        "You do not need to guess a plan. These are the factors Alchemize reviews with you, and then recommends a level.",
      items: [
        {
          tag: "Volume",
          name: "Transaction volume",
          text: "More transactions mean more categorization and review each month.",
        },
        {
          tag: "Accounts",
          name: "Bank and credit accounts",
          text: "Each account is reconciled, so the number of accounts shapes the monthly work.",
        },
        {
          tag: "Reporting",
          name: "Reporting needs",
          text: "From standard monthly reports to deeper periodic reviews.",
        },
        {
          tag: "Records",
          name: "Condition of the records",
          text: "Current, organized records can start recurring bookkeeping. Behind or unreconciled records may need cleanup first.",
        },
        {
          tag: "Support",
          name: "Review and support level",
          text: "How much discussion, review, and responsiveness the business wants alongside the books.",
        },
      ],
      note: "Very high volume or unusually complex books are scoped individually.",
    },
    process: [
      [
        "Gather",
        "Collect formation records, bank and credit records, income and expense support, and relevant payroll or contractor information.",
      ],
      [
        "Review",
        "Identify missing items, inconsistencies, and transactions that need clarification, and decide whether cleanup comes first.",
      ],
      [
        "Reconcile",
        "Match recorded transactions to statements and organize the ledger so the books reflect the business's actual activity.",
      ],
      [
        "Report",
        "Deliver the recurring reporting and review appropriate to the service level, on a repeating rhythm.",
      ],
    ],
    prepare: [
      "Entity and EIN information",
      "Accounting-software access, if you already use one",
      "Bank, credit-card, and loan statements",
      "Payment-processor reports and payroll summaries",
      "Invoices, receipts, and supporting income and expense records",
      "Historical records, when cleanup is needed",
    ],
    compare: {
      title: "Ongoing bookkeeping, cleanup, and the services beside it.",
      intro:
        "A business with historical, incomplete, or unreconciled records often needs cleanup before recurring bookkeeping can begin.",
      rows: [
        {
          label: "Ongoing bookkeeping",
          text: "A recurring monthly rhythm once the records are current.",
          current: true,
        },
        {
          label: "Bookkeeping cleanup",
          text: "Brings historical, incomplete, or unreconciled records current so recurring bookkeeping can start. Severe or reconstruction-heavy records are reviewed and scoped separately.",
        },
        {
          label: "Financial reports",
          text: "Management reports, not audited, reviewed, compiled, certified, or attested financial statements.",
        },
        {
          label: "Tax preparation",
          text: "Separate. Clean books make it easier, but bookkeeping does not include preparing returns.",
          to: R.businessTax,
        },
        {
          label: "Payroll",
          text: "Payroll administration is its own service.",
          to: R.payroll,
        },
      ],
    },
    faq: {
      title: "Bookkeeping questions",
      items: [
        {
          q: "What does Alchemize actually do every month?",
          a: "Categorizes transactions, reconciles your accounts, tracks income and expenses, maintains the ledger, and prepares the recurring reports for your level of support, with review discussions where the service level includes them.",
        },
        {
          q: "How do I know what level of support I need?",
          a: "It depends on transaction volume, the number of bank and credit accounts, your reporting needs, the condition of your records, and the review and support you want. Alchemize reviews these with you and recommends a level.",
        },
        {
          q: "Is cleanup included?",
          a: "No. Cleanup is separate and comes first when records are behind or unreconciled. Severe or reconstruction-heavy situations are reviewed and scoped individually.",
        },
        {
          q: "Does bookkeeping include tax preparation?",
          a: "No. Tax preparation is a separate service. Organized books make it easier.",
        },
        {
          q: "What do I need to provide?",
          a: "Entity and EIN information, accounting-software access if you have one, bank, card, and loan statements, processor and payroll reports, and supporting records.",
        },
        {
          q: "Are these audited financial statements?",
          a: "No. They are management financial reports, not audited, reviewed, compiled, certified, or attested statements.",
        },
      ],
    },
    related: [
      [
        R.payroll,
        "Payroll runs feed the books and are administered separately.",
      ],
      [
        R.businessTax,
        "Tax-ready books are the foundation for a business return.",
      ],
      [
        R.advisory,
        "For questions the numbers raise about how the business runs.",
      ],
    ],
  },

  "business-payroll": {
    cta: {
      hero: "Request Payroll Support",
      close: "Request Payroll Support",
      info: "Ask about setup",
      title: "Tell us how payroll runs today.",
      body: "Share your headcount, pay schedule, and platform, if you have one. Alchemize confirms scope and whether a platform needs to be selected and set up.",
    },
    summary:
      "Payroll setup and recurring administration through the payroll platform you select. Alchemize administers your payroll process; the platform remains the payroll processor.",
    fit: {
      title: "When payroll support fits",
      items: [
        "A new employer who needs a platform chosen and configured",
        "An owner who is tired of running payroll personally",
        "A growing team that needs a repeatable payroll routine",
        "Payroll information tracked in several places",
      ],
    },
    does: {
      title: "What Alchemize administers.",
      intro:
        "Alchemize does the administrative work of payroll inside the platform. It is not the underlying payroll processor.",
      groups: [
        {
          title: "Setup, when needed",
          items: [
            "Payroll-platform selection and setup assistance",
            "Administrative employee setup",
            "Entry of W-4 information supplied by the client or employee",
          ],
        },
        {
          title: "Every pay cycle",
          items: [
            "Recurring payroll administration through the selected platform",
            "Payroll and payment records",
            "Payroll reporting",
            "Coordination of routine platform and direct-deposit issues",
          ],
        },
      ],
    },
    options: {
      title: "How the scope is set.",
      intro:
        "Scope follows the size and starting point of your payroll. Larger teams are scoped individually.",
      items: [
        {
          tag: "Starting point",
          name: "Whether a platform is in place",
          text: "If a payroll platform must be selected and configured, setup comes first.",
        },
        {
          tag: "Team size",
          name: "Headcount",
          text: "The number of employees shapes the recurring administration.",
        },
        {
          tag: "Rhythm",
          name: "Pay schedule",
          text: "Weekly, biweekly, or monthly cycles set how often the work repeats.",
        },
      ],
    },
    compare: {
      title: "Who does what.",
      intro:
        "Payroll has several parties. The scope of each is clear from the start.",
      rows: [
        {
          label: "Alchemize",
          text: "Administers payroll through the selected platform and keeps the records and reporting.",
          current: true,
        },
        {
          label: "The payroll platform",
          text: "Processes payroll and performs whatever tax filing and deposit functions it provides. Platform and software charges are separate.",
        },
        {
          label: "You and your employees",
          text: "You supply accurate information. Each employee completes their own W-4; Alchemize enters it as supplied and does not advise on it.",
        },
        {
          label: "Bookkeeping",
          text: "Payroll and bookkeeping are separate service lines.",
          to: R.bookkeeping,
        },
        {
          label: "Business tax",
          text: "Business tax preparation is a separate service.",
          to: R.businessTax,
        },
      ],
    },
    faq: {
      title: "Payroll questions",
      items: [
        {
          q: "Do you provide the payroll software?",
          a: "No. Payroll runs through the platform you select. Alchemize can help select and set it up, and platform and software charges are separate.",
        },
        {
          q: "Does Alchemize file my payroll taxes?",
          a: "Alchemize does not automatically take on tax filing or deposit responsibilities that the payroll platform performs. Confirm which filings and deposits your platform handles during setup.",
        },
        {
          q: "Can you help my employees fill out their W-4?",
          a: "No. Alchemize enters W-4 information as supplied and does not advise employees how to complete it.",
        },
        {
          q: "What if I already use a payroll platform?",
          a: "Alchemize can administer payroll through it where the platform and scope allow.",
        },
        {
          q: "Is payroll included with bookkeeping?",
          a: "No. Payroll, bookkeeping, and tax are separate service lines, even when they are used together.",
        },
        {
          q: "How many employees can you support?",
          a: "Scope grows with headcount, and larger teams are scoped individually.",
        },
      ],
    },
    related: [
      [R.bookkeeping, "Payroll records feed the books."],
      [R.businessTax, "Payroll tax documentation and business filings."],
    ],
  },

  "business-financial": {
    cta: {
      hero: "Request Business Tax Support",
      close: "Request Business Tax Support",
      info: "Ask whether your return fits",
      title: "Tell us about the business and its books.",
      body: "Share the entity type, states, and the condition of your records. Alchemize confirms fit and scope before preparation begins.",
    },
    summary:
      "Business tax preparation and year-end readiness: partnership, S corporation, and C corporation returns for businesses with tax-ready books, plus the organization that makes filing season manageable.",
    fit: {
      title: "When this fits",
      items: [
        "A partnership, S corporation, or C corporation preparing to file",
        "Books that are reconciled and ready for a return",
        "Year-end tax readiness and estimated-tax planning support",
        "Prior-year or amended business returns",
        "Records that need organizing before a filing or handoff",
      ],
    },
    does: {
      title: "Returns and readiness Alchemize is structured to support.",
      intro:
        "Every return is reviewed for fit first. Supported scope is not automatic acceptance of every business situation.",
      groups: [
        {
          title: "Business returns",
          items: [
            "Partnership returns (Form 1065)",
            "S corporation returns (Form 1120-S)",
            "C corporation returns (Form 1120)",
            "Amended and prior-year returns",
          ],
        },
        {
          title: "Filing readiness",
          items: [
            "Tax document organization",
            "Year-end tax readiness and deadline awareness",
            "Estimated-tax planning support and tracking",
            "Contractor and payroll documentation readiness",
          ],
        },
        {
          title: "What can change the scope",
          items: [
            "The number of owners or K-1s",
            "Multiple states",
            "Fixed assets and owner loans",
            "Ownership changes and distributions",
            "Books that are not reconciled, and unusual transactions",
          ],
        },
      ],
    },
    process: [
      [
        "Organize",
        "Compile the income, expense, payroll, contractor, and prior-year records needed for the return.",
      ],
      [
        "Confirm fit",
        "Confirm the entity type, states, and complexity, and whether the books are tax-ready.",
      ],
      [
        "Prepare",
        "Prepare the return from tax-ready books and confirmed facts.",
      ],
      [
        "Finalize",
        "Review the return, resolve remaining items, and confirm the next step and timeline.",
      ],
    ],
    compare: {
      title: "Tax preparation and the services around it.",
      intro: "Preparing a business return is one service. These are separate.",
      rows: [
        {
          label: "Business tax preparation",
          text: "Preparing the return from tax-ready books, within the scope confirmed for the business.",
          current: true,
        },
        {
          label: "Bookkeeping and cleanup",
          text: "Business returns are prepared from tax-ready books. Unreconciled books need bookkeeping cleanup first.",
          to: R.bookkeeping,
        },
        {
          label: "Tax planning and advisory",
          text: "Forward-looking strategy is separate and not automatically included.",
        },
        {
          label: "IRS and state representation",
          text: "Notices, audits, and resolution matters are separate. Some need a CPA, enrolled agent, or attorney.",
        },
        {
          label: "Individual returns",
          text: "Personal returns, including a sole proprietor's Schedule C, are under individual tax preparation.",
          to: R.tax,
        },
      ],
    },
    faq: {
      title: "Business tax questions",
      items: [
        {
          q: "Do I need my books in order first?",
          a: "Yes. Business returns are prepared from tax-ready books. If your books are not reconciled, bookkeeping cleanup comes first.",
        },
        {
          q: "Which business returns do you prepare?",
          a: "Alchemize is structured to support partnership (1065), S corporation (1120-S), and C corporation (1120) returns, including amended and prior-year returns.",
        },
        {
          q: "I am a sole proprietor. Is this the right page?",
          a: "Sole proprietors filing Schedule C are supported under individual tax preparation.",
        },
        {
          q: "What if my business files in more than one state?",
          a: "Additional states affect scope and are confirmed before work begins.",
        },
        {
          q: "Does this include tax planning or IRS representation?",
          a: "No. Tax planning and advisory, and IRS or state representation and resolution, are separate and not automatically included.",
        },
      ],
    },
    related: [
      [
        R.bookkeeping,
        "Tax-ready books are the foundation for a business return.",
      ],
      [R.payroll, "Payroll administration is a separate service."],
      [R.tax, "For individual returns, including Schedule C."],
    ],
  },
};
