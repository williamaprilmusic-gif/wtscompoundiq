// src/compoundingComparison.js
// Same principal, same nominal rate, same term -- what actually changes when interest
// is credited annually vs monthly vs daily. The Calculator tab has a frequency selector
// but never shows the gap between the options side by side; this does, using the same
// engine so the numbers match that tab exactly.
import { calculateCompoundInterest } from './engine';

export const FREQUENCIES = [
  { key: 'annual', label: 'Annually', periods: 1 },
  { key: 'semi', label: 'Semi-annually', periods: 2 },
  { key: 'quarterly', label: 'Quarterly', periods: 4 },
  { key: 'monthly', label: 'Monthly', periods: 12 },
  { key: 'daily', label: 'Daily', periods: 365 }
];

export const compareCompoundingFrequencies = ({ principal, annualRate, years }) => {
  const p = Math.max(0, principal || 0);
  const rows = FREQUENCIES.map(f => {
    const finalBalance = calculateCompoundInterest({
      initial: p, monthly: 0, rate: annualRate || 0, years: years || 0,
      inflation: 0, taxRate: 0, wrapper: false, compoundFrequency: f.periods
    }).finalBalance;
    return { ...f, finalBalance, interest: finalBalance - p };
  });
  const annualFinal = rows[0].finalBalance;
  return rows.map(r => ({ ...r, extraVsAnnual: r.finalBalance - annualFinal }));
};
