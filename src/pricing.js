// Reference amounts from docs/product/pricing_and_payments.md, in minor units.
// Currency and billing policies remain pending; these are not checkout prices.
export const referencePrices = Object.freeze({
  companionSubscriptionMonthly: 1199,
  premiumUserMonthly: 599,
  companionPublishingMonthly: 1999,
  companionPublishingAnnual: 5999,
});
export function formatReferencePrice(minorUnits) {
  return `$${(minorUnits / 100).toFixed(2)}`;
}
