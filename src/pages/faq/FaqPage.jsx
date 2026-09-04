import { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/ui/PageShell.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import LocalizedLink from "../../i18n/LocalizedLink.jsx";
import usePageMetadata from "../../i18n/usePageMetadata.js";
import { buildFaqSchema, ensureJsonLd } from "../../seo/siteSchema.js";
import { faqCategoriesEs, faqUiEs } from "./faqContent.es.js";
import "./faq.css";

const faqCategories = [
  {
    category: "General",
    description: "The basic questions most clients ask before starting.",
    items: [
      {
        question: "What does Alchemize Business Services do?",
        answer:
          "Alchemize provides professional support for individuals, entrepreneurs, and small businesses across administrative, tax-related, business, organizational, and operational responsibilities. The goal is to help clients understand what needs attention, organize the information around it, and determine practical next steps. In some cases, a licensed or specialized professional may be the more appropriate provider for a specific service or requirement.",
      },
      {
        question: "Who does Alchemize work with?",
        answer:
          "Alchemize works with individuals, entrepreneurs, freelancers, owner-operated businesses, and small businesses that need help organizing responsibilities, preparing for decisions, improving administrative processes, or moving a business task forward. The appropriate service depends on the situation, scope, location, and any licensing or professional requirements involved.",
      },
      {
        question: "Do I need to know exactly which service I need?",
        answer:
          "No. Many clients know what they are trying to accomplish but are not sure which service category applies. Start by describing the situation, what has already happened, and what you are trying to resolve or prepare for. Alchemize can help identify the most appropriate starting point.",
      },
      {
        question: "Can Alchemize help with more than one type of need?",
        answer:
          "Yes, when the needs fall within Alchemize's scope. Personal and business responsibilities often overlap, and a client may need support across more than one area over time. Each responsibility is still evaluated individually so the correct service, process, and professional boundaries remain clear.",
      },
      {
        question: "Are services available virtually?",
        answer:
          "Many Alchemize services can be handled through virtual consultation and remote communication. Some services may depend on location, document requirements, licensing rules, or the nature of the work. Availability should be confirmed when the service is requested.",
      },
      {
        question: "Where is Alchemize based?",
        answer:
          "Alchemize Business Services is based in North Carolina and is designed to support clients through both local and virtual service models. Specific service availability may vary by location and by the requirements that apply to the service.",
      },
      {
        question: "Is assistance available in Spanish?",
        answer:
          "Yes. Alchemize intends to support clients in both English and Spanish. The website is being developed to provide a full Spanish-language experience as well. Availability of third-party forms, government documents, carrier materials, or external platforms in Spanish may depend on the organization that provides them.",
      },
    ],
  },
  {
    category: "Individual Services",
    description:
      "Common questions for personal tax, document support, and practical guidance.",
    items: [
      {
        question: "What services are available for individuals?",
        answer:
          "Individual services may include tax preparation support, notary and document services, preparation guidance, and help organizing information connected to an important personal responsibility. The final scope depends on the specific request, applicable requirements, and service availability.",
      },
      {
        question: "What should I prepare before contacting Alchemize?",
        answer:
          "Start with a short description of what you are trying to accomplish, any important dates or deadlines, and the information or documents you already have. You do not need to organize everything perfectly before reaching out. The initial conversation can help determine what is actually needed.",
      },
      {
        question:
          "Can I ask for help even if I am not sure which service fits?",
        answer:
          "Yes. The initial inquiry can focus on the situation rather than a service name. Explain what is happening, what feels unclear, and what outcome you are trying to reach. Alchemize can then determine whether the request fits an available service and what should happen next.",
      },
      {
        question: "How will I know which documents are required?",
        answer:
          "Document requirements depend on the service. Once the request is understood, Alchemize can identify which records are useful, which documents are required, and which information should not be sent until a secure method is available.",
      },
      {
        question: "Should I send sensitive documents with my first inquiry?",
        answer:
          "No. Do not send Social Security numbers, full tax returns, banking information, identity documents, medical records, confidential business records, or other sensitive information through an ordinary contact form or unsecured email. Alchemize will provide instructions when secure document handling is required.",
      },
      {
        question:
          "Can one individual use Alchemize for different needs over time?",
        answer:
          "Yes. A client may begin with one responsibility and later return for another service that falls within Alchemize's scope. The objective is to create a professional relationship that can remain useful as needs change.",
      },
    ],
  },
  {
    category: "Business Services",
    description: "Questions for owners, operators, and growing businesses.",
    items: [
      {
        question: "Can Alchemize help get a new business organized?",
        answer:
          "Yes. Alchemize can help organize the administrative information, records, responsibilities, and next steps involved in establishing a business. The exact support depends on the business, jurisdiction, formation status, licensing requirements, and whether legal, tax, accounting, or other specialized professional guidance is required.",
      },
      {
        question: "Do I need to already have a registered business?",
        answer:
          "No. Alchemize may work with someone who is still preparing to start a business as well as an existing business that needs better organization, operations, or administrative structure. The appropriate starting point depends on how far the business has progressed.",
      },
      {
        question: "Does Alchemize provide ongoing operational support?",
        answer:
          "Ongoing support may be available depending on the business need and agreed scope. This may involve helping organize administrative processes, responsibilities, records, workflows, recurring tasks, or other operational areas supported by Alchemize.",
      },
      {
        question: "What if I need help in more than one business area?",
        answer:
          "That is common. Business responsibilities often connect. A formation issue can create administrative work, an operational issue can affect financial records, and a new service or opportunity can create new processes and deadlines. Alchemize can help identify how the responsibilities relate and determine a practical order for addressing them.",
      },
      {
        question:
          "Can Alchemize help implement recommendations, not just provide advice?",
        answer:
          "Where the work falls within Alchemize's scope, yes. The business model is intended to go beyond simply identifying a problem. Alchemize may also help organize, document, coordinate, prepare, or implement practical next steps.",
      },
      {
        question:
          "Can Alchemize work with systems and processes I already use?",
        answer:
          "Yes. The objective is not to replace tools that are already working. Alchemize can first assess the existing process, identify where information or responsibility is breaking down, and determine whether the current system can be improved before recommending something new.",
      },
    ],
  },
  {
    category: "Web & Digital Solutions",
    description:
      "Questions about websites, digital tools, and online business needs.",
    items: [
      {
        question: "What types of websites does Alchemize build?",
        answer:
          "Alchemize builds professional websites for small businesses, service providers, entrepreneurs, and organizations that need a clear, credible online presence. Projects may include informational websites, service-based sites, lead-generation sites, client portals, resource libraries, and other business-focused web experiences.",
      },
      {
        question: "Can Alchemize redesign an existing website?",
        answer:
          "Yes. Existing websites can be reviewed for structure, usability, mobile responsiveness, content organization, branding consistency, conversion flow, and technical issues. Depending on the condition of the current site, Alchemize may recommend improving the existing build or rebuilding portions of it.",
      },
      {
        question: "Do you provide SEO support?",
        answer:
          "Yes. Web projects can include foundational search optimization such as page structure, metadata, headings, internal linking, mobile usability, performance considerations, and search-friendly content organization. More advanced or ongoing SEO work can be scoped separately based on the business's needs.",
      },
      {
        question: "Can you help with Google Ads or paid advertising?",
        answer:
          "Alchemize can build or improve the website and landing-page experience needed to support advertising campaigns and can assist with the technical and conversion-focused preparation of those pages. Advertising management itself should only be represented as an included service when specifically scoped in the engagement.",
      },
      {
        question: "Will my website work on phones and tablets?",
        answer:
          "Yes. Alchemize websites are designed and tested for responsive use across common desktop, tablet, and mobile screen sizes. Mobile usability is treated as part of the core build rather than an optional add-on.",
      },
      {
        question:
          "Can Alchemize add forms, scheduling, payments, or client portals?",
        answer:
          "Yes. Depending on the project, websites can include contact and lead forms, consultation scheduling, payment functionality, secure client-facing areas, document workflows, intake forms, and integrations with external business systems.",
      },
      {
        question: "Can you connect my website to tools I already use?",
        answer:
          "In many cases, yes. Alchemize can evaluate integrations with payment processors, calendars, email platforms, cloud storage, CRM or workflow tools, analytics, and other business systems. Integration availability depends on the provider's API or supported connection options.",
      },
      {
        question: "Do you provide hosting or domain registration?",
        answer:
          "Alchemize can help configure and connect domains, hosting, DNS, SSL, and deployment environments as part of a web engagement. Ownership of business-critical accounts should remain with the client whenever practical.",
      },
      {
        question: "Do you have a website hosting provider you recommend?",
        answer:
          "I work with different hosting environments depending on the website, its technical requirements, integrations, expected traffic, and the client's needs. For many small businesses, I recommend considering Hostinger because it brings hosting, domain management, email options, SSL and security features, and practical website-management tools into an approachable platform. It is not the right fit for every project, so I still evaluate the actual requirements before recommending a hosting environment.",
        links: [
          {
            label: "Read why I often recommend Hostinger",
            href: "/resources/hostinger-for-small-business-websites",
          },
          {
            label: "Explore Hostinger",
            href: "https://www.hostinger.com?REFERRALCODE=JZBJESSABFQ9",
            external: true,
          },
        ],
        disclosure:
          "If you choose Hostinger through this link, Alchemize may receive a referral benefit at no additional cost to you.",
      },
      {
        question: "Will I be able to update my website after it is built?",
        answer:
          "That depends on the platform and project scope. Where appropriate, Alchemize can provide an administrative or content-management workflow for routine updates. For custom-built systems, ongoing maintenance or managed updates can also be scoped.",
      },
      {
        question: "What happens after a website launches?",
        answer:
          "Post-launch work may include testing, troubleshooting, performance review, analytics setup, content updates, maintenance, security updates, or future feature development depending on the engagement. The exact ongoing support arrangement should be documented before or at launch.",
      },
    ],
  },
  {
    category: "Consultations",
    description: "What to expect before, during, and after a conversation.",
    items: [
      {
        question: "What happens during a consultation?",
        answer:
          "The consultation begins with the situation rather than a predetermined solution. The conversation generally focuses on what you are trying to accomplish, what has already happened, what information is available, what feels unclear, and what next step may be appropriate.",
      },
      {
        question: "What should I bring to a consultation?",
        answer:
          "Bring enough information to explain the situation clearly. Useful items may include relevant dates, a short description of the issue, a list of questions, and a summary of documents or records you already have. Do not send highly sensitive documents until Alchemize provides an appropriate method for doing so.",
      },
      {
        question: "What if I do not have everything organized yet?",
        answer:
          "That is not a problem. The purpose of the initial conversation is often to determine what information actually matters and what needs to be gathered next.",
      },
      {
        question:
          "Can we discuss more than one issue during the same consultation?",
        answer:
          "Yes, especially when the responsibilities appear connected. If the issues require substantially different services, Alchemize may recommend addressing them separately so each can be handled with the appropriate scope and preparation.",
      },
      {
        question:
          "Does scheduling a consultation commit me to purchasing a service?",
        answer:
          "No. A consultation is intended to help determine whether Alchemize is an appropriate fit and what the next step should be. Any service engagement, pricing, or additional work should be clearly defined before work begins.",
      },
      {
        question: "What happens after the consultation?",
        answer:
          "The next step depends on the situation. You may receive a recommended service path, a request for additional information, preparation instructions, a proposed scope of work, or guidance that another type of professional or provider is more appropriate.",
      },
    ],
  },
  {
    category: "Notary & Document Services",
    description: "North Carolina notary and document service questions.",
    items: [
      {
        question:
          "What types of notarial acts can a North Carolina notary perform?",
        answer:
          "North Carolina notaries may perform acknowledgments, administer oaths and affirmations, and perform verifications or proofs when the applicable legal requirements are met. The document or requesting party should indicate the notarial act required. Reference intent: N.C.G.S. Chapter 10B.",
      },
      {
        question: "Do I need to appear in person for a notarization?",
        answer:
          "For a traditional North Carolina notarization, the signer or other required individual must personally appear before the notary at the time of the notarial act. Identification and other statutory requirements must also be satisfied.",
      },
      {
        question: "What identification should I bring?",
        answer:
          "A signer who is not personally known to the notary generally needs satisfactory evidence of identity. North Carolina law recognizes a current identification document issued by a federal, state, or federally or state-recognized tribal government agency that includes a photograph and either a signature or physical description. A qualifying credible witness may also be used in circumstances permitted by law.",
      },
      {
        question: "Can the notary tell me which type of notarization I need?",
        answer:
          "No. A North Carolina notary who is not a licensed attorney cannot select the notarial act or certificate for a client when the document does not indicate what is required. The signer, document preparer, receiving agency, or an attorney should determine which certificate or notarial act is needed.",
      },
      {
        question:
          "Can Alchemize help me fill out or interpret the document being notarized?",
        answer:
          "Not as part of the notarial act. A non-attorney notary cannot provide legal advice or assist a person in drafting, completing, selecting, or understanding a document or transaction when doing so would constitute the unauthorized practice of law. Administrative assistance that is separately permissible should not be represented as legal guidance.",
      },
      {
        question: "How much does notarization cost in North Carolina?",
        answer:
          "North Carolina currently permits a notary to charge up to $10 per notarized principal signature for traditional acknowledgments, jurats, verifications, or proofs, and up to $10 per person for certain oaths or affirmations without a signature. Different statutory maximums apply to authorized electronic and remote notarizations.",
      },
      {
        question: "Is there a travel fee for mobile notary service?",
        answer:
          "North Carolina law permits actual mileage at the federal business mileage rate for travel connected to a notarial act when the reimbursement is agreed to by the principal in writing before the travel occurs. Any mobile-service terms should therefore be confirmed before the appointment.",
      },
      {
        question:
          "Can a document already be signed before I meet with the notary?",
        answer:
          "It depends on the notarial act. Some acknowledgments may involve a signature that was made earlier and is later acknowledged before the notary, while other acts require signing or an oath in the notary's presence. The notary cannot choose the required act for the signer.",
      },
      {
        question: "Can a notary refuse to notarize a document?",
        answer:
          "Yes. A notary must decline when statutory requirements are not satisfied, including situations involving inadequate identification, lack of required personal appearance, prohibited conflicts of interest, suspected fraud, or other legal disqualifications.",
      },
      {
        question:
          "Can Alchemize notarize a document if Jessy is a party to or beneficiary of it?",
        answer:
          "No. A North Carolina notary generally may not notarize a record when the notary is a signer, party, or beneficiary of that record, subject to limited statutory exceptions that should not be generalized in public-facing FAQ copy. A notary cannot perform a notarial act when legally disqualified by an interest in the document or transaction.",
      },
      {
        question: "Do you offer electronic or remote online notarization?",
        answer:
          "Alchemize's available notary methods will depend on the notary authorization and technology in place at the time of service. North Carolina regulates traditional, electronic, and remote electronic notarization separately. The appointment process will identify which service methods are currently available.",
      },
      {
        question: "What should I bring to a notary appointment?",
        answer:
          "Bring the complete document requiring notarization, acceptable identification if required, and any witnesses or additional individuals required by the document or receiving party. Do not sign portions that must be signed in the notary's presence unless instructed by the document or appropriate requesting party.",
      },
    ],
  },
  {
    category: "Working With Alchemize",
    description:
      "How client intake, communication, and follow-through are handled.",
    items: [
      {
        question: "Can I contact Alchemize without committing to a service?",
        answer:
          "Yes. An initial inquiry can simply explain what you are trying to accomplish or what responsibility needs attention. Alchemize can then determine whether the request is within scope and what next step makes sense.",
      },
      {
        question: "Do I need to send documents upfront?",
        answer:
          "Usually not. The initial inquiry should provide enough context to understand the request. If documents are needed, Alchemize will identify what is required and how it should be provided.",
      },
      {
        question: "How are services priced?",
        answer:
          "Pricing depends on the type of service, scope of work, complexity, and amount of support required. Where pricing has not yet been standardized, Alchemize should define the scope and applicable cost before substantial work begins.",
      },
      {
        question: "Will I know the cost before work begins?",
        answer:
          "The objective is to make scope and pricing clear before significant work begins. Some services may have standardized pricing while others may require review of the request before a fee can be determined.",
      },
      {
        question:
          "How will Alchemize communicate with me while work is in progress?",
        answer:
          "Communication methods depend on the service and the information being exchanged. Routine communication may occur through approved business communication channels, while sensitive information should use a secure process when required. As the client portal becomes operational, more service communication and status information can be centralized there.",
      },
      {
        question: "How does Alchemize handle confidential information?",
        answer:
          "Alchemize treats personal and business information as confidential and limits its use to legitimate business and service purposes. Sensitive information should only be collected when necessary and through appropriate methods. Specific privacy practices are described in the site's Privacy Policy.",
      },
    ],
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function FaqPage() {
  const { language } = useLanguage();
  const categories = language === "es" ? faqCategoriesEs : faqCategories;
  const ui =
    language === "es"
      ? faqUiEs
      : {
          metadata: {
            title: "FAQ | Alchemize Business Services",
            description:
              "Clear answers about Alchemize services, consultations, and what to expect when working with us.",
          },
          eyebrow: "Frequently asked questions",
          title: "Questions before you get started?",
          summary:
            "Clear answers about Alchemize services, consultations, and what to expect when working with us.",
          search: "Search questions",
          placeholder: "Try “consultation” or “business”",
          clear: "Clear",
          categories: "FAQ categories",
          results: (answers, count) =>
            `Showing ${answers} ${answers === 1 ? "answer" : "answers"} across ${count} ${count === 1 ? "category" : "categories"}.`,
          emptyTitle: "No matching answers found.",
          emptyText:
            "Try a broader keyword such as “consultation,” “tax,” “notary,” “digital,” or “organization.”",
          clearSearch: "Clear search",
        };
  const [query, setQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState(
    categories[0].items[0].question,
  );
  const [activeCategory, setActiveCategory] = useState(categories[0].category);
  usePageMetadata({
    en: {
      title: "FAQ | Business Services Questions & Answers",
      description:
        "Find clear answers about Alchemize services, consultations, business support, and what to expect before starting a project or engagement.",
    },
    es: {
      title: "FAQ | Preguntas y respuestas sobre servicios empresariales",
      description:
        "Encuentre respuestas claras sobre los servicios de Alchemize, las consultas, el apoyo empresarial y qué esperar antes de comenzar un proyecto o servicio.",
    },
  });
  useEffect(() => {
    setQuery("");
    setOpenQuestion(categories[0].items[0].question);
    setActiveCategory(categories[0].category);
  }, [language, categories]);

  useEffect(() => {
    if (!categories?.length) return undefined;
    const faqItems = categories.flatMap((category) =>
      category.items.map(({ question, answer }) => ({ question, answer })),
    );
    ensureJsonLd(`faq-schema-${language}`, buildFaqSchema(faqItems));
    return () => {
      document.head
        .querySelector(`script[data-schema-id="faq-schema-${language}"]`)
        ?.remove();
    };
  }, [categories, language]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          items: category.items.filter(({ question, answer }) =>
            `${category.category} ${question} ${answer}`
              .toLowerCase()
              .includes(normalizedQuery),
          ),
        }))
        .filter((category) => category.items.length > 0),
    [categories, normalizedQuery],
  );

  const totalResults = filteredCategories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );

  return (
    <div className="faq-page">
      <PageShell eyebrow={ui.eyebrow} title={ui.title} summary={ui.summary}>
        <div className="faq-search">
          <label htmlFor="faq-query">{ui.search}</label>
          <div className="faq-search-field">
            <input
              id="faq-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ui.placeholder}
            />
            {query ? (
              <button
                type="button"
                className="faq-clear-button"
                onClick={() => setQuery("")}
              >
                {ui.clear}
              </button>
            ) : null}
          </div>
        </div>

        {query ? (
          <p className="faq-results-meta">
            {ui.results(totalResults, filteredCategories.length)}
          </p>
        ) : null}

        <div className="faq-layout">
          <nav className="faq-category-nav" aria-label={ui.categories}>
            {categories.map((category) => {
              const visibleCount =
                filteredCategories.find(
                  (entry) => entry.category === category.category,
                )?.items.length ?? 0;
              const isActive = activeCategory === category.category;

              return (
                <a
                  key={category.category}
                  href={`#faq-${slugify(category.category)}`}
                  className={`${visibleCount === 0 ? "is-disabled" : ""} ${isActive ? "is-active" : ""}`.trim()}
                  aria-disabled={visibleCount === 0}
                  onClick={() => setActiveCategory(category.category)}
                >
                  <span>{category.category}</span>
                  <em>{visibleCount}</em>
                </a>
              );
            })}
          </nav>

          <div className="faq-groups">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <section
                  id={`faq-${slugify(category.category)}`}
                  key={category.category}
                  className="faq-category-section"
                >
                  <header className="faq-category-header">
                    <h2>{category.category}</h2>
                    <p>{category.description}</p>
                  </header>

                  <div className="faq-accordion" role="list">
                    {category.items.map(
                      ({ question, answer, links, disclosure }) => {
                        const itemId = `faq-${slugify(category.category)}-${slugify(
                          question,
                        )}`;
                        const isOpen = openQuestion === question;

                        return (
                          <article
                            key={question}
                            className="faq-accordion-item"
                            role="listitem"
                          >
                            <button
                              type="button"
                              className="faq-question"
                              aria-expanded={isOpen}
                              aria-controls={itemId}
                              onClick={() =>
                                setOpenQuestion((current) =>
                                  current === question ? "" : question,
                                )
                              }
                            >
                              <span>{question}</span>
                              <span
                                className="faq-question-icon"
                                aria-hidden="true"
                              >
                                {isOpen ? "−" : "+"}
                              </span>
                            </button>

                            <div
                              id={itemId}
                              className={`faq-answer ${isOpen ? "is-open" : ""}`}
                              hidden={!isOpen}
                            >
                              <p>{answer}</p>
                              {links?.length ? (
                                <div className="faq-answer-links">
                                  {links.map((link) =>
                                    link.external ? (
                                      <a
                                        className="text-link"
                                        href={link.href}
                                        key={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer sponsored"
                                      >
                                        {link.label}
                                      </a>
                                    ) : (
                                      <LocalizedLink
                                        className="text-link"
                                        key={link.href}
                                        to={link.href}
                                      >
                                        {link.label}
                                      </LocalizedLink>
                                    ),
                                  )}
                                </div>
                              ) : null}
                              {disclosure ? (
                                <small className="faq-referral-disclosure">
                                  {disclosure}
                                </small>
                              ) : null}
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                </section>
              ))
            ) : (
              <div className="faq-empty-state">
                <h2>{ui.emptyTitle}</h2>
                <p>{ui.emptyText}</p>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setQuery("")}
                >
                  {ui.clearSearch}
                </button>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    </div>
  );
}

export default FaqPage;
