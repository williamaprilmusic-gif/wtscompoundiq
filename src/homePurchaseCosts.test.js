// src/homePurchaseCosts.test.js
import { describe, it, expect } from 'vitest';
import { estimateHomePurchaseCosts } from './homePurchaseCosts.js';
import { estimateZaTransferDuty } from './homeAffordability.js';

describe('estimateHomePurchaseCosts (ZA)', () => {
  it('adds transfer duty, attorneys and deeds office on top of the deposit', () => {
    const r = estimateHomePurchaseCosts({ purchasePrice: 2000000, depositAmount: 200000, countryCode: 'za' });
    expect(r.transferDuty).toBeCloseTo(estimateZaTransferDuty(2000000), 2);
    expect(r.transferAttorney).toBeGreaterThan(0);
    expect(r.bondRegistration).toBeGreaterThan(0);
    expect(r.totalFees).toBeCloseTo(
      r.transferDuty + r.transferAttorney + r.bondRegistration + r.deedsOffice, 6
    );
    expect(r.cashNeededUpfront).toBeCloseTo(200000 + r.totalFees, 6);
  });

  it('a cash purchase (no bond) has no bond-registration cost', () => {
    const r = estimateHomePurchaseCosts({ purchasePrice: 1500000, depositAmount: 1500000, countryCode: 'za' });
    expect(r.bondRegistration).toBe(0);
  });

  it('under the ZA transfer-duty threshold, duty is zero but fees still apply', () => {
    const r = estimateHomePurchaseCosts({ purchasePrice: 1000000, depositAmount: 100000, countryCode: 'za' });
    expect(r.transferDuty).toBe(0);
    expect(r.totalFees).toBeGreaterThan(0);
  });

  it('respects a transfer-duty override', () => {
    const r = estimateHomePurchaseCosts({ purchasePrice: 2000000, transferDutyOverride: 12345, countryCode: 'za' });
    expect(r.transferDuty).toBe(12345);
  });

  it('non-ZA uses a purchase-tax percentage of price', () => {
    const r = estimateHomePurchaseCosts({ purchasePrice: 1000000, countryCode: 'gb', otherFeesRatePct: 3 });
    expect(r.transferDuty).toBe(30000);
    expect(r.feesAsPctOfPrice).toBeGreaterThan(0);
  });
});
