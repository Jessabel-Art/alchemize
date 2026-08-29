import { publicPricingFallback } from "../data/publicPricingCatalog.js";

const normalizeJson = (value, fallback) => {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeTier = (tier) => ({
  tierKey: tier.tier_key,
  tierName: tier.tier_name,
  description: tier.description || "",
  basePrice: tier.base_price == null ? null : Number(tier.base_price),
  minimumPrice: tier.minimum_price == null ? null : Number(tier.minimum_price),
  billingFrequency: tier.billing_frequency,
  pricingType: tier.pricing_type,
  status: tier.status,
  scope: normalizeJson(tier.included_scope, []),
  limits: normalizeJson(tier.limits_metadata, {}),
  pricingMetadata: normalizeJson(tier.pricing_metadata, {}),
  active: Boolean(Number(tier.active_flag)),
});

const normalizeService = (service) => ({
  serviceCode: service.service_code,
  serviceName: service.public_name || service.service_name,
  description: service.description || "",
  category: service.category || "",
  status: service.catalog_status,
  pricingType: service.pricing_type,
  active: Boolean(Number(service.active_flag)),
  tiers: (service.tiers || []).map(normalizeTier),
  addOns: (service.add_ons || []).map((addOn) => ({
    key: addOn.add_on_code,
    name: addOn.name,
    description: addOn.description || "",
    pricingMethod: addOn.pricing_method,
    price: addOn.default_price == null ? null : Number(addOn.default_price),
    unit: addOn.unit,
    active: Boolean(Number(addOn.active_flag)),
  })),
});

export async function getPublicServiceCatalog({ signal } = {}) {
  const response = await fetch("/alchemize-api.php?route=services/public", {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    signal,
  });
  if (!response.ok) throw new Error("Public service catalog unavailable.");
  const payload = await response.json();
  return (payload?.data || []).map(normalizeService);
}

export const getPublicPricingFallback = () => publicPricingFallback;
