import { useEffect, useMemo, useState } from "react";
import { Check, Info } from "lucide-react";
import {
  getPublicPricingFallback,
  getPublicServiceCatalog,
} from "../../services/public-catalog-api.js";
import { pricingServiceMap } from "../../data/publicPricingCatalog.js";

const disclaimers = {
  FIXED:
    "Published fixed prices apply to projects that fall within the stated package scope and assumptions. Additional services, requirements, complexity, third-party costs, or work outside the included scope may require an add-on, change order, or separate Statement of Work. Any additional charges will be disclosed and approved before additional work begins. Final scope, pricing, and payment terms are confirmed in the applicable proposal or service agreement.",
  STARTING_AT:
    "“Starting at” pricing represents the minimum price for the standard scope described. Final pricing is determined after Alchemize reviews the project requirements, complexity, and requested deliverables. The client will receive and approve the final price before work begins.",
  CUSTOM_SOW:
    "Projects marked “Custom SOW” require an initial scope review. Pricing is determined based on the approved deliverables, complexity, implementation requirements, and project timeline and is confirmed in writing before work begins.",
  FORMULA:
    "Formula pricing is calculated from the stated quantities and standard assumptions. Records, formatting, volume, or complexity outside those assumptions require review before a final price is confirmed.",
  REGULATED_PENDING:
    "Pricing is shown for planning only. Availability remains pending authorization or process readiness, and this service is not currently available for ordinary purchase.",
};

const externalCosts =
  "Prices shown do not include applicable third-party software, subscriptions, hosting, domain registration, government filing fees, shipping, courier costs, payment processing charges, or other external expenses unless specifically stated as included.";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number(value) % 1 ? 2 : 0,
  }).format(Number(value));

const frequencyLabel = {
  ONE_TIME: "one-time",
  MONTHLY: "/month",
  QUARTERLY: "quarterly",
  ANNUAL: "/year",
  HOURLY: "/hour",
  PER_PAGE: "/page",
  PER_WORD: "/source word",
  PER_DOCUMENT: "first document",
};

const renderPrice = (tier) => {
  if (["CUSTOM_SOW", "MANUAL_REVIEW"].includes(tier.pricingType))
    return { primary: "Custom SOW", secondary: "Scope review required" };
  if (tier.displayPrice)
    return { primary: tier.displayPrice, secondary: "Published formula" };
  const amount = tier.minimumPrice ?? tier.basePrice;
  if (amount == null)
    return {
      primary: "Manual Review Required",
      secondary: "No automatic quote",
    };
  if (tier.pricingType === "STARTING_AT")
    return { primary: money(amount), secondary: "Starting at" };
  return {
    primary: money(amount),
    secondary: frequencyLabel[tier.billingFrequency] || "",
  };
};

function PricingDisclaimer({ types }) {
  return (
    <div className="pricing-disclaimers" aria-label="Pricing terms">
      {[...types].map((type) =>
        disclaimers[type] ? (
          <details key={type}>
            <summary>
              <Info aria-hidden="true" /> {type.replaceAll("_", " ")} pricing
              terms
            </summary>
            <p>{disclaimers[type]}</p>
          </details>
        ) : null,
      )}
      <p className="pricing-external-costs">{externalCosts}</p>
    </div>
  );
}

function PricingCard({ tier, pending }) {
  const price = renderPrice(tier);
  const limits = Object.entries(tier.limits || {}).filter(
    ([, value]) => value != null,
  );
  return (
    <article className="public-pricing-card">
      <div className="public-pricing-card-head">
        <div>
          <span className="pricing-type-label">
            {pending
              ? "Availability pending authorization"
              : tier.pricingType.replaceAll("_", " ")}
          </span>
          <h3>{tier.tierName}</h3>
        </div>
        <div
          className="pricing-amount"
          aria-label={`${tier.tierName}: ${price.secondary} ${price.primary}`}
        >
          {tier.pricingType === "STARTING_AT" ? <span>Starting at</span> : null}
          <strong>{price.primary}</strong>
          {tier.pricingType !== "STARTING_AT" ? (
            <span>{price.secondary}</span>
          ) : null}
        </div>
      </div>
      {tier.description ? <p>{tier.description}</p> : null}
      {limits.length ? (
        <div className="pricing-limit-chips" aria-label="Standard limits">
          {limits.map(([key, value]) => (
            <span key={key}>
              {key.replaceAll("_", " ")}: {value}
            </span>
          ))}
        </div>
      ) : null}
      <ul>
        {(Array.isArray(tier.scope) ? tier.scope : []).map((item) => (
          <li key={item}>
            <Check aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function LegalDocumentBoundary() {
  return (
    <aside className="public-boundary-note">
      <h3>Business and administrative document support</h3>
      <p>
        Business document support focuses on operational and administrative
        materials such as proposals, invoices, forms, process documentation,
        checklists, and other nonlegal business documents.
      </p>
      <p>
        Alchemize may assist with organizing information and preparing business
        or administrative document templates. Alchemize does not provide legal
        advice or act as a substitute for a licensed attorney. Documents
        requiring legal interpretation, customized legal provisions, or legal
        advice should be prepared or reviewed by qualified legal counsel.
      </p>
    </aside>
  );
}

export function PublicPricing({ serviceKey, language = "en" }) {
  const [catalog, setCatalog] = useState(getPublicPricingFallback);
  useEffect(() => {
    const controller = new AbortController();
    getPublicServiceCatalog({ signal: controller.signal })
      .then(setCatalog)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const groups = useMemo(() => {
    const codes = pricingServiceMap[serviceKey] || [];
    return codes
      .map((code) => catalog.find((item) => item.serviceCode === code))
      .filter(Boolean);
  }, [catalog, serviceKey]);
  if (!groups.length) return null;
  const visible = groups.filter(
    (service) => !["NOT_OFFERED", "FUTURE_EXPANSION"].includes(service.status),
  );
  if (!visible.length) return null;
  const types = new Set(
    visible.flatMap((service) =>
      service.tiers.map((tier) =>
        tier.status === "PENDING_AUTHORIZATION"
          ? "REGULATED_PENDING"
          : tier.pricingType,
      ),
    ),
  );
  return (
    <section
      className="service-section public-pricing"
      aria-labelledby={`pricing-${serviceKey}`}
    >
      <div className="content-shell">
        <div className="service-section-heading">
          <span className="eyebrow eyebrow--gold">
            {language === "es"
              ? "Precios y alcance"
              : "Pricing and standard scope"}
          </span>
          <h2 id={`pricing-${serviceKey}`}>
            {language === "es"
              ? "Compare el alcance estándar."
              : "Compare standardized service options."}
          </h2>
          <p>
            {language === "es"
              ? "Los precios finales y el alcance se confirman por escrito antes de comenzar."
              : "Choose a useful starting point. Final scope and applicable terms are confirmed in writing before work begins."}
          </p>
        </div>
        {visible.map((service) => {
          const pending = service.status === "PENDING_AUTHORIZATION";
          const tiers = service.tiers.filter(
            (item) =>
              !["NOT_OFFERED", "FUTURE_EXPANSION"].includes(item.status),
          );
          return (
            <div className="public-pricing-group" key={service.serviceCode}>
              <div className="public-pricing-group-title">
                <h3>{service.serviceName}</h3>
                {service.description ? <p>{service.description}</p> : null}
                {pending ? (
                  <span className="pricing-status">
                    Coming Soon · Availability pending authorization
                  </span>
                ) : null}
              </div>
              <div
                className={`public-pricing-grid public-pricing-grid--${Math.min(tiers.length, 4)}`}
              >
                {tiers.map((item) => (
                  <PricingCard
                    key={item.tierKey}
                    tier={item}
                    pending={pending || item.status === "PENDING_AUTHORIZATION"}
                  />
                ))}
              </div>
              {service.serviceCode === "bookkeeping" ? (
                <p className="pricing-group-note">
                  Tax preparation is a separate service and is not included in
                  monthly bookkeeping. Cleanup may be required before recurring
                  bookkeeping begins when historical records are incomplete,
                  unreconciled, miscategorized, or otherwise not ready for
                  ongoing monthly service. Normal cleanup follows the published
                  formula; severe, unusually high-volume, incomplete, or
                  reconstruction-heavy records require a separate review and may
                  require a Custom SOW.
                </p>
              ) : null}
              {service.serviceCode === "payroll" ? (
                <p className="pricing-group-note">
                  Payroll platform/software charges are separate. Alchemize does
                  not advise employees how to complete withholding elections and
                  enters W-4 information only as provided. Alchemize does not
                  provide HR, employment-law, or individualized tax advice and
                  does not replace the payroll platform’s tax filing or deposit
                  functions.
                </p>
              ) : null}
              {service.serviceCode === "business-consulting" ? (
                <div className="pricing-group-note">
                  <p>
                    Consulting engagements diagnose issues, clarify priorities,
                    recommend practical next steps, and develop implementation
                    plans. Substantial hands-on implementation—such as CRM
                    configuration, workflow implementation, website development,
                    bookkeeping cleanup, systems setup, automation, SEO
                    implementation, or operational transformation—is priced
                    separately unless explicitly included.
                  </p>
                  <details>
                    <summary>
                      Business Foundation Assessment project-credit terms
                    </summary>
                    <p>
                      Your $249 Business Foundation Assessment fee may be
                      credited toward a qualifying project of $799 or more when
                      contracted within 30 calendar days. The credit is
                      non-refundable, non-transferable, limited to one credit
                      per qualifying project, has no cash value, does not apply
                      to unrelated services, and cannot be combined with another
                      promotional or project credit unless expressly approved by
                      Alchemize.
                    </p>
                  </details>
                </div>
              ) : null}
              {service.serviceCode === "apostille" ? (
                <p className="pricing-group-note">
                  Alchemize facilitates and supports the North Carolina
                  apostille process. The apostille is issued by the appropriate
                  government authority, not Alchemize. Government, shipping,
                  courier, and third-party fees are separate. Processing times
                  and issuance are controlled by the issuing authority.
                  Alchemize does not guarantee issuance or acceptance by a
                  foreign authority.
                </p>
              ) : null}
              {service.serviceCode === "business-planning" ? (
                <p className="pricing-group-note">
                  Business planning and financial-readiness services help
                  clients organize professional planning materials for growth,
                  strategic planning, and external review. Alchemize does not
                  procure financing, negotiate with lenders, submit loan
                  applications on a client’s behalf, or guarantee financing
                  approval.
                </p>
              ) : null}
            </div>
          );
        })}
        <PricingDisclaimer types={types} />
      </div>
    </section>
  );
}
