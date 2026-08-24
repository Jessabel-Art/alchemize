import { useEffect } from "react";
import PageShell from "../../components/ui/PageShell.jsx";
import { businessContact, contactRouting } from "../../data/contactInfo.js";
import "./legal.css";

const privacySections = [
  {
    id: "information-we-collect",
    title: "Information we collect",
    content: (
      <>
        <p>
          The information Alchemize receives depends on how a person interacts
          with the website and which services are requested.
        </p>
        <p>Information may include:</p>
        <ul>
          <li>name</li>
          <li>email address</li>
          <li>telephone number</li>
          <li>whether an inquiry relates to an individual or business</li>
          <li>requested service area</li>
          <li>communication preference</li>
          <li>
            information voluntarily included in an inquiry or consultation
            request
          </li>
          <li>
            information needed to administer an account, appointment, or client
            relationship where applicable
          </li>
        </ul>
        <p>
          Website systems may also receive limited technical information such as
          browser type, device information, IP address, referring pages,
          requested pages, and similar server or security data.
        </p>
      </>
    ),
  },
  {
    id: "how-information-is-used",
    title: "How information is used",
    content: (
      <>
        <p>Alchemize may use information to:</p>
        <ul>
          <li>respond to inquiries</li>
          <li>evaluate requested services</li>
          <li>communicate about consultations or service requests</li>
          <li>maintain appropriate business and client records</li>
          <li>operate and secure the website</li>
          <li>administer accounts or portals where applicable</li>
          <li>improve website functionality and resources</li>
          <li>
            comply with legal, regulatory, tax, licensing, recordkeeping, or
            professional obligations
          </li>
          <li>prevent fraud, misuse, or security incidents</li>
        </ul>
        <p>
          Information collected for a specific regulated or professional service
          may also be subject to additional notices, consent requirements,
          engagement terms, or legal restrictions.
        </p>
      </>
    ),
  },
  {
    id: "inquiry-and-contact-forms",
    title: "Inquiry and contact forms",
    content: (
      <>
        <p>
          Information submitted through the website's inquiry and contact forms
          may be collected and stored so Alchemize can respond to inquiries,
          evaluate requested services, communicate with prospective clients, and
          maintain appropriate business records.
        </p>
        <p>
          Public website forms are intended for initial inquiries and general
          service information.
        </p>
        <p>
          Do not submit highly sensitive information through a public contact
          form, including:
        </p>
        <ul>
          <li>Social Security numbers</li>
          <li>full tax returns</li>
          <li>taxpayer identification numbers</li>
          <li>banking or payment credentials</li>
          <li>government-issued identification documents</li>
          <li>medical records</li>
          <li>detailed insurance records</li>
          <li>confidential business files</li>
          <li>passwords or account credentials</li>
        </ul>
        <p>
          If sensitive information is required for a service, Alchemize will
          provide or identify an appropriate method for supplying it.
        </p>
      </>
    ),
  },
  {
    id: "cookies-and-website-technology",
    title: "Cookies and website technology",
    content: (
      <>
        <p>
          The website may use essential browser storage, cookies, or similar
          technologies where needed for security, session management,
          preferences, forms, or account functionality.
        </p>
        <p>
          If analytics or other non-essential technologies are later introduced,
          this Policy should be updated to describe them and any applicable
          choices.
        </p>
      </>
    ),
  },
  {
    id: "information-sharing",
    title: "Information sharing",
    content: (
      <>
        <p>
          Alchemize does not sell personal information simply because a visitor
          submits a website inquiry.
        </p>
        <p>Information may be disclosed where reasonably necessary to:</p>
        <ul>
          <li>
            operate website, hosting, email, storage, scheduling, payment, or
            other service infrastructure
          </li>
          <li>perform a service requested by the client</li>
          <li>
            work with authorized vendors or professional service providers
          </li>
          <li>
            comply with law, regulation, court order, subpoena, licensing
            requirement, or government request
          </li>
          <li>
            protect the rights, security, systems, clients, or operations of
            Alchemize
          </li>
          <li>
            complete a business transaction such as a reorganization, financing,
            merger, or transfer of business assets, subject to applicable
            requirements
          </li>
        </ul>
        <p>
          Information related to tax preparation, insurance, Medicare, or other
          regulated services may be subject to additional confidentiality,
          authorization, consent, or disclosure restrictions.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    title: "Data security",
    content: (
      <>
        <p>
          Alchemize uses reasonable administrative, technical, and
          organizational measures intended to protect information appropriate to
          the nature of the information and the systems involved.
        </p>
        <p>
          Security practices may include measures such as access controls,
          secure credentials, protected hosting, limited access, software
          maintenance, data minimization, and appropriate service-provider
          controls.
        </p>
        <p>
          No website, email system, internet transmission, or electronic storage
          method can be guaranteed to be completely secure.
        </p>
        <p>
          Users should not send highly sensitive information through ordinary
          email or public website forms unless specifically instructed to do so
          through an appropriate secure process.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Retention",
    content: (
      <>
        <p>
          Alchemize retains information for as long as reasonably necessary for
          the purpose for which it was collected and as needed for legitimate
          business, recordkeeping, tax, contractual, licensing, security,
          dispute-resolution, or legal requirements.
        </p>
        <p>
          Retention periods may differ depending on the type of information and
          service involved.
        </p>
        <p>
          Information that is no longer reasonably needed may be deleted,
          anonymized, or securely disposed of where appropriate.
        </p>
      </>
    ),
  },
  {
    id: "your-choices",
    title: "Your choices",
    content: (
      <>
        <p>Individuals may contact Alchemize to:</p>
        <ul>
          <li>update basic contact information</li>
          <li>correct inaccurate information provided through an inquiry</li>
          <li>ask how their information is being used</li>
          <li>request discontinuation of non-required communications</li>
        </ul>
        <p>
          Some information may need to be retained to comply with legal, tax,
          regulatory, licensing, contractual, fraud-prevention, security, or
          professional recordkeeping obligations.
        </p>
        <p>
          Requests may be sent to:{" "}
          <a href={contactRouting.support.mailto}>
            {contactRouting.support.email}
          </a>
        </p>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    title: "Children's privacy",
    content: (
      <>
        <p>
          The Alchemize website and services are intended for adults and
          businesses and are not directed to children under 13.
        </p>
        <p>
          Alchemize does not knowingly use the public website to solicit
          personal information from children under 13.
        </p>
        <p>
          If information is believed to have been submitted by a child through
          the public website, contact:{" "}
          <a href={contactRouting.general.mailto}>
            {contactRouting.general.email}
          </a>
        </p>
      </>
    ),
  },
  {
    id: "policy-updates",
    title: "Policy updates",
    content: (
      <>
        <p>
          Alchemize may update this Privacy Policy as website functionality,
          services, vendors, business practices, or legal requirements change.
        </p>
        <p>
          The current version will be posted on this page and identified by its
          "Last updated" date.
        </p>
        <p>
          Material changes affecting existing client relationships may also be
          communicated through an appropriate additional method where required
          or appropriate.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <>
        <p>
          Questions about this Privacy Policy or Alchemize's handling of website
          information may be sent to:{" "}
          <a href={contactRouting.general.mailto}>
            {contactRouting.general.email}
          </a>
        </p>
        <p>
          Do not include sensitive personal, tax, financial, identity, health,
          insurance, or confidential business records in ordinary email.
        </p>
        <p>
          Information provided in connection with tax-return preparation may be
          subject to additional federal confidentiality, consent, use, and
          disclosure requirements that are separate from this general website
          Privacy Policy.
        </p>
      </>
    ),
  },
];

const termsSections = [
  {
    id: "website-use",
    title: "Website use",
    content: (
      <>
        <p>
          The Alchemize Business Services website is provided for general
          informational, educational, and business-development purposes. You may
          use the website for lawful personal or business purposes consistent
          with these Terms of Service.
        </p>
        <p>
          Access to the public website does not by itself create a client
          relationship, professional engagement, fiduciary relationship,
          insurance relationship, tax-preparer relationship, or other advisory
          relationship with Alchemize Business Services LLC.
        </p>
        <p>
          Certain services, portals, forms, consultations, or future account
          features may be subject to additional agreements, engagement terms,
          disclosures, or policies.
        </p>
      </>
    ),
  },
  {
    id: "educational-information",
    title: "Educational information",
    content: (
      <>
        <p>
          Articles, checklists, guides, FAQs, resource materials, service
          descriptions, and similar website content are provided for general
          educational and organizational purposes.
        </p>
        <p>
          Information may address tax preparation, insurance, Medicare, notary
          services, business operations, technology, administrative
          organization, financial processes, and related topics. General website
          information is not a substitute for advice based on a person's or
          business's specific facts and circumstances.
        </p>
        <p>
          External laws, regulations, programs, deadlines, carrier requirements,
          tax rules, and government guidance may change after website content is
          published.
        </p>
      </>
    ),
  },
  {
    id: "professional-scope",
    title: "Professional scope",
    content: (
      <>
        <p>
          Alchemize provides only those services that fall within its current
          professional scope, licensing, certification, authority, and agreed
          engagement.
        </p>
        <p>
          Website content does not constitute legal advice, investment advice,
          securities advice, or other regulated professional advice outside
          Alchemize's authorized scope.
        </p>
        <p>
          Where a matter requires an attorney, CPA, enrolled agent, investment
          professional, licensed insurance professional with a different
          authority, government agency, or other specialist, Alchemize may
          recommend that the user obtain assistance from an appropriately
          qualified professional.
        </p>
        <p>
          A service relationship is established only when scope,
          responsibilities, pricing, and any required engagement terms are
          confirmed.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    content: (
      <>
        <p>
          Unless otherwise stated, the website design, Alchemize name and
          branding, logos, original written content, downloadable materials,
          graphics, templates, and other original materials published by
          Alchemize Business Services LLC are owned by or licensed to Alchemize
          and are protected by applicable intellectual-property laws.
        </p>
        <p>
          Users may view, download, or print materials made available for
          personal or internal business use unless a resource states otherwise.
        </p>
        <p>
          Users may not reproduce, republish, sell, license, distribute, modify,
          remove branding from, or commercially exploit Alchemize materials
          without permission.
        </p>
        <p>
          Do not imply ownership of third-party government publications, linked
          resources, trademarks, or other third-party materials.
        </p>
      </>
    ),
  },
  {
    id: "third-party-resources",
    title: "Third-party resources",
    content: (
      <>
        <p>
          The website may link to government agencies, insurers, software
          providers, financial institutions, scheduling platforms, tax
          resources, or other third-party websites and services.
        </p>
        <p>
          External links are provided for convenience or reference. Alchemize
          does not control third-party websites and is not responsible for their
          availability, security, accuracy, privacy practices, terms, or
          content.
        </p>
        <p>
          A link does not necessarily constitute endorsement of a third party or
          every product or service it offers.
        </p>
        <p>
          Users should review the applicable terms and privacy practices of
          third-party services before providing information or completing
          transactions.
        </p>
      </>
    ),
  },
  {
    id: "prohibited-use",
    title: "Prohibited use",
    content: (
      <>
        <p>Users may not use the website or its systems to:</p>
        <ul>
          <li>violate applicable law</li>
          <li>
            attempt unauthorized access to accounts, systems, servers, or data
          </li>
          <li>interfere with website operation or security</li>
          <li>transmit malware, malicious code, or automated abuse</li>
          <li>submit fraudulent, misleading, unlawful, or abusive requests</li>
          <li>impersonate another person or organization</li>
          <li>
            scrape, copy, or systematically extract protected website content
            for unauthorized commercial use
          </li>
          <li>
            use forms or communication channels to transmit unlawful content
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    content: (
      <>
        <p>
          Alchemize works to keep public website information useful and current,
          but website content may contain errors, omissions, or information that
          becomes outdated.
        </p>
        <p>
          Unless otherwise required by law or expressly stated in a written
          service agreement, the website and public materials are provided on an
          "as available" basis.
        </p>
        <p>Alchemize does not guarantee that:</p>
        <ul>
          <li>website content will always be complete or current</li>
          <li>the website will operate without interruption</li>
          <li>
            every visitor will qualify for or benefit from a particular service
          </li>
          <li>
            a particular tax, insurance, Medicare, business, funding,
            certification, or administrative outcome will occur
          </li>
        </ul>
        <p>
          Specific service obligations are governed by the applicable engagement
          terms rather than general website content.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-these-terms",
    title: "Changes to these terms",
    content: (
      <>
        <p>
          Alchemize may update these Terms of Service as the website, services,
          technology, business practices, or legal requirements change.
        </p>
        <p>
          When material updates are made, the revised version will be posted on
          this page with an updated "Last updated" date.
        </p>
        <p>
          Continued use of the public website after an update means the website
          is being used under the version then in effect. Separate client
          agreements remain governed by their own terms unless amended according
          to those agreements.
        </p>
      </>
    ),
  },
];

function LegalPage({ title, summary }) {
  const isPrivacy = title === "Privacy Policy" || title === "Privacy";
  const sections = isPrivacy ? privacySections : termsSections;

  useEffect(() => {
    const pageTitle = isPrivacy
      ? "Privacy Policy | Alchemize Business Services"
      : "Terms of Service | Alchemize Business Services";
    document.title = pageTitle;

    const description = isPrivacy
      ? "How Alchemize Business Services collects, uses, shares, and protects information."
      : "Terms governing use of the Alchemize Business Services website and public materials.";

    let meta = document.head.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = description;

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = `https://getalchemize.com/${isPrivacy ? "privacy" : "terms"}`;
  }, [isPrivacy]);

  const calloutHeading = isPrivacy
    ? "Questions about this Privacy Policy?"
    : "Questions about these Terms?";

  return (
    <div className="legal-page">
      <PageShell eyebrow="Legal" title={title} summary={summary}>
        <div className="legal-meta">
          <span>Effective: August 2026</span>
          <span>Last updated: August 2026</span>
        </div>

        <div className="legal-layout">
          <aside className="legal-nav" aria-label="On this page">
            <strong>On this page</strong>
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </aside>

          <article className="legal-document">
            {sections.map((section) => (
              <section
                id={section.id}
                key={section.id}
                className="legal-section"
              >
                <div className="legal-section-copy">
                  <h2>{section.title}</h2>
                  {section.content}
                </div>
              </section>
            ))}

            <div className="legal-callout">
              <h2>{calloutHeading}</h2>
              <p>
                {isPrivacy
                  ? "Questions about this Privacy Policy or Alchemize's handling of website information may be sent to:"
                  : "Questions about these Terms of Service or website use may be sent to:"}
                <br />
                <a href={contactRouting.general.mailto}>
                  {contactRouting.general.email}
                </a>
                <br />
                <a href={businessContact.phone.href}>
                  {businessContact.phone.display}
                </a>
              </p>
            </div>
          </article>
        </div>
      </PageShell>
    </div>
  );
}

export default LegalPage;
