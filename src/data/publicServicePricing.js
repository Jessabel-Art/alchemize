// PUBLIC SERVICE PRICING
//
// The only prices Alchemize publishes on the website. Everything else in the
// internal Master Pricing Matrix (notary, tax, bookkeeping, payroll, reporting,
// consulting, operations, administrative support, web, SEO, Google Business
// Profile, automation, software) stays internal and must not be added here.
//
// Approved values (Master Pricing Matrix v1.0, August 2026):
//   Translation  standard short document      $35 per page, up to 250 source words
//                general / business           $0.15 per source word, $35 minimum
//                certified & official-use     $45 per page, up to 250 source words
//                rush                         +50%, subject to availability
//   Apostille    NC facilitation              $149 first document,
//                                             +$40 each additional document
//                                             in the same engagement
//
// Amounts live here only; the service pages render them, in either language,
// through this module.
export const publicServicePricing = Object.freeze({
  "individual-translation": Object.freeze({
    tiers: Object.freeze({
      standard: Object.freeze({ amount: 35, unit: "page", sourceWords: 250 }),
      general: Object.freeze({ amount: 0.15, unit: "word", minimum: 35 }),
      certified: Object.freeze({ amount: 45, unit: "page", sourceWords: 250 }),
    }),
    rushSurcharge: 0.5,
  }),
  "individual-apostille": Object.freeze({
    tiers: Object.freeze({
      first: Object.freeze({ amount: 149, unit: "firstDocument" }),
      additional: Object.freeze({
        amount: 40,
        unit: "additionalDocument",
        additive: true,
      }),
    }),
  }),
});

// Only these services may show a price.
export const PRICED_SERVICE_KEYS = Object.freeze(
  Object.keys(publicServicePricing),
);

const unitLabels = {
  en: {
    page: "per page",
    word: "per source word",
    firstDocument: "first document",
    additionalDocument: "each additional document",
    sourceWords: (count) => `up to ${count} source words`,
    minimum: (amount) => `${amount} minimum`,
  },
  es: {
    page: "por página",
    word: "por palabra de origen",
    firstDocument: "primer documento",
    additionalDocument: "cada documento adicional",
    sourceWords: (count) => `hasta ${count} palabras de origen`,
    minimum: (amount) => `mínimo de ${amount}`,
  },
};

export function formatUsd(amount) {
  const fixed = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `$${fixed}`;
}

export const formatPercent = (fraction) => `${Math.round(fraction * 100)}%`;

// { price: "$35", unit: "per page", limit: "up to 250 source words" | null,
//   minimum: "$35 minimum" | null, additive: false }
export function describeTier(serviceKey, tierId, language = "en") {
  const tier = publicServicePricing[serviceKey]?.tiers?.[tierId];
  if (!tier) return null;
  const labels = unitLabels[language === "es" ? "es" : "en"];
  return {
    price: formatUsd(tier.amount),
    unit: labels[tier.unit],
    limit: tier.sourceWords ? labels.sourceWords(tier.sourceWords) : null,
    minimum: tier.minimum ? labels.minimum(formatUsd(tier.minimum)) : null,
    additive: Boolean(tier.additive),
  };
}
