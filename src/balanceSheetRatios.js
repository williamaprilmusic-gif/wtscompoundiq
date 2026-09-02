// src/balanceSheetRatios.js
// Two quick solvency reads off a Net Worth snapshot: how leveraged you are (debt as a
// share of assets) and how much of your assets you actually own outright (equity
// ratio). No new inputs -- both derive from the totals the Net Worth tab already has.
export const LEVERAGE_BANDS = [
  { upTo: 20, key: 'strong', label: 'Low leverage' },
  { upTo: 40, key: 'ok', label: 'Moderate leverage' },
  { upTo: 60, key: 'stretched', label: 'High leverage' },
  { upTo: Infinity, key: 'risky', label: 'Very high leverage' }
];

export const balanceSheetRatios = ({ totalAssets, totalDebts }) => {
  const assets = Math.max(0, totalAssets || 0);
  const debts = Math.max(0, totalDebts || 0);

  // With no assets logged, a ratio is meaningless -- signal that rather than divide by 0.
  if (assets === 0) {
    return { debtToAsset: null, equityRatio: null, band: null, bandLabel: 'No assets logged' };
  }

  const debtToAsset = (debts / assets) * 100;
  const equityRatio = Math.max(0, ((assets - debts) / assets) * 100);
  const band = LEVERAGE_BANDS.find(b => debtToAsset <= b.upTo) || LEVERAGE_BANDS[LEVERAGE_BANDS.length - 1];

  return { debtToAsset, equityRatio, band: band.key, bandLabel: band.label };
};
