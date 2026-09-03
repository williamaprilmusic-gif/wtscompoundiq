// src/homePurchaseCosts.js
// The cash a home purchase needs on day one, on top of the deposit -- the costs a
// sticker price and a bond calculator both leave out: transfer duty, the transferring
// and bond-registration attorneys, and the deeds office. Complements Home Affordability
// (how big a bond) and Deposit Timeline (how long to save the deposit); this is "what
// else do I need in the bank the day I buy".
import { estimateZaTransferDuty } from './homeAffordability';

// Recommended conveyancing tariff is a stepped scale; this is a smooth approximation of
// it (indicative, VAT-inclusive, not a conveyancer's quote -- the same caveat as the
// rest of the app's SA figures). ~1% of value on the transfer side and ~1% of the bond
// on the registration side, each with a floor, lands within a few percent of the
// published tables across the normal price range.
const estimateZaAttorneyFees = (value) => {
  if (!(value > 0)) return 0;
  return Math.max(6000, value * 0.011 + 4000);
};

export const estimateHomePurchaseCosts = ({
  purchasePrice, depositAmount = 0, bondAmount = null,
  countryCode = 'za',
  transferDutyOverride = null, // pass a number to skip the built-in estimate
  otherFeesRatePct = null // non-ZA: a single "stamp duty / purchase tax" % of price
}) => {
  const price = Math.max(0, purchasePrice || 0);
  const deposit = Math.max(0, Math.min(depositAmount || 0, price));
  // If the bond isn't given, assume it funds the rest of the price after the deposit.
  const bond = bondAmount != null ? Math.max(0, bondAmount) : Math.max(0, price - deposit);

  let transferDuty;
  let transferAttorney;
  let bondRegistration;
  let deedsOffice;

  if (transferDutyOverride != null) {
    transferDuty = Math.max(0, transferDutyOverride);
  } else if (countryCode === 'za') {
    transferDuty = estimateZaTransferDuty(price);
  } else {
    // Generic: a single purchase-tax percentage (user-supplied, else a 1% placeholder).
    transferDuty = price * ((otherFeesRatePct != null ? Math.max(0, otherFeesRatePct) : 1) / 100);
  }

  if (countryCode === 'za') {
    transferAttorney = estimateZaAttorneyFees(price);
    bondRegistration = bond > 0 ? estimateZaAttorneyFees(bond) * 0.9 : 0;
    deedsOffice = bond > 0 ? 1500 : 1000; // indicative office lodgement fees
  } else {
    // Outside ZA, fold professional fees into a light 1.5%-of-price allowance so the
    // total still means something; users can refine with the override.
    transferAttorney = price * 0.015;
    bondRegistration = 0;
    deedsOffice = 0;
  }

  const totalFees = transferDuty + transferAttorney + bondRegistration + deedsOffice;
  return {
    transferDuty,
    transferAttorney,
    bondRegistration,
    deedsOffice,
    totalFees,
    cashNeededUpfront: deposit + totalFees,
    feesAsPctOfPrice: price > 0 ? (totalFees / price) * 100 : 0
  };
};
