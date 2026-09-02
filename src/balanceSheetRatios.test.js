// src/balanceSheetRatios.test.js
import { describe, it, expect } from 'vitest';
import { balanceSheetRatios } from './balanceSheetRatios.js';

describe('balanceSheetRatios', () => {
  it('computes debt-to-asset and equity ratio from the totals', () => {
    const r = balanceSheetRatios({ totalAssets: 1000000, totalDebts: 300000 });
    expect(r.debtToAsset).toBeCloseTo(30, 5);
    expect(r.equityRatio).toBeCloseTo(70, 5);
    expect(r.band).toBe('ok'); // 20-40 -> moderate
  });

  it('bands leverage: low / moderate / high / very high', () => {
    expect(balanceSheetRatios({ totalAssets: 100, totalDebts: 10 }).band).toBe('strong');   // 10%
    expect(balanceSheetRatios({ totalAssets: 100, totalDebts: 35 }).band).toBe('ok');        // 35%
    expect(balanceSheetRatios({ totalAssets: 100, totalDebts: 55 }).band).toBe('stretched'); // 55%
    expect(balanceSheetRatios({ totalAssets: 100, totalDebts: 90 }).band).toBe('risky');     // 90%
  });

  it('equity ratio floors at 0 when debts exceed assets (underwater)', () => {
    const r = balanceSheetRatios({ totalAssets: 100000, totalDebts: 250000 });
    expect(r.equityRatio).toBe(0);
    expect(r.debtToAsset).toBeCloseTo(250, 5);
    expect(r.band).toBe('risky');
  });

  it('returns nulls (not a divide-by-zero) when no assets are logged', () => {
    const r = balanceSheetRatios({ totalAssets: 0, totalDebts: 50000 });
    expect(r.debtToAsset).toBeNull();
    expect(r.equityRatio).toBeNull();
    expect(r.bandLabel).toMatch(/no assets/i);
  });

  it('clamps negative inputs', () => {
    const r = balanceSheetRatios({ totalAssets: -100, totalDebts: -100 });
    expect(r.debtToAsset).toBeNull();
  });
});
