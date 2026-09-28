// NOTARY FEE SCHEDULE (North Carolina)
//
// These are the notarial fees North Carolina law permits a notary to charge.
// They are a government-set schedule, not an Alchemize commercial rate, and
// are unrelated to the internal Master Pricing Matrix figures that stay
// private (see publicServicePricing.js). Amounts live here only; the fee-table
// module on the Notary Services page renders them, in either language.
//
// Source: N.C.G.S. Chapter 10B fee provisions, the same figures already
// published in the site FAQ ("How much does notarization cost in North
// Carolina?" / "Is there a travel fee for mobile notary service?").
import { formatUsd } from "./publicServicePricing.js";

export const notaryFeeSchedule = Object.freeze([
  Object.freeze({ id: "acknowledgment", amount: 10, unit: "perSignature" }),
  Object.freeze({ id: "jurat", amount: 10, unit: "perSignature" }),
  Object.freeze({ id: "verification", amount: 10, unit: "perSignature" }),
  Object.freeze({ id: "oath", amount: 10, unit: "perPerson" }),
  Object.freeze({ id: "absenteeBallot", amount: 0, unit: "noCharge" }),
  Object.freeze({ id: "mobileTravel", amount: null, unit: "mileageRate" }),
]);

const unitLabels = {
  en: {
    perSignature: "per notarized principal signature",
    perPerson: "per person",
    noCharge: "No Charge",
    mileageRate: "Current federal business mileage rate",
  },
  es: {
    perSignature: "por firma principal notariada",
    perPerson: "por persona",
    noCharge: "Sin costo",
    mileageRate: "Tarifa federal de millaje comercial vigente",
  },
};

// { fee: "$10 per notarized principal signature" } — the string a fee-table
// row renders; a row with no dollar amount (no charge, mileage rate) renders
// its label alone.
export function describeNotaryFee(id, language = "en") {
  const row = notaryFeeSchedule.find((item) => item.id === id);
  if (!row) return null;
  const labels = unitLabels[language === "es" ? "es" : "en"];
  if (row.amount === null || row.amount === 0) {
    return { fee: labels[row.unit] };
  }
  return { fee: `${formatUsd(row.amount)} ${labels[row.unit]}` };
}
