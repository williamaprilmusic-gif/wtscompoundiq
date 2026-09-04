// src/vatCalculator.js
// Add or extract VAT/sales tax from a price. The two directions people actually need:
// "I have an exclusive price, what's the customer-facing total" (add), and "I have an
// invoice/receipt total, how much of that was tax" (extract) -- extraction is NOT simply
// price * rate, since the rate applies to the exclusive amount, not the inclusive one.
// Defaults to South Africa's 15% VAT; the rate is a plain input so it works for any
// country's VAT/GST/sales tax.
export const addVat = ({ exclusiveAmount, vatRatePct = 15 }) => {
  const amount = Math.max(0, exclusiveAmount || 0);
  const rate = Math.max(0, vatRatePct || 0) / 100;
  const vatAmount = amount * rate;
  return { exclusiveAmount: amount, vatAmount, inclusiveAmount: amount + vatAmount, vatRatePct: rate * 100 };
};

export const extractVat = ({ inclusiveAmount, vatRatePct = 15 }) => {
  const amount = Math.max(0, inclusiveAmount || 0);
  const rate = Math.max(0, vatRatePct || 0) / 100;
  // The inclusive amount is (1 + rate) x the exclusive amount, so divide it back out --
  // NOT amount * rate, which double-counts the tax already folded into `amount`.
  const exclusiveAmount = amount / (1 + rate);
  return { inclusiveAmount: amount, vatAmount: amount - exclusiveAmount, exclusiveAmount, vatRatePct: rate * 100 };
};
