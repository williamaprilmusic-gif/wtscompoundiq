// src/costOfWaiting.js
// The price of procrastination against a fixed target date: the same monthly plan
// compounds for fewer years if you start later. Runs the app's own engine twice and
// reports the gap -- a Basic-tier nudge that sits right on the Calculator result.
import { calculateCompoundInterest } from './engine';

export const costOfWaiting = ({
  initial, monthly, rate, years, inflation, taxRate, wrapper, compoundFrequency,
  annualWrapperLimit, lifetimeWrapperLimit, contributionIncreaseRate, lumpSums, delayYears
}) => {
  const base = {
    initial, monthly, rate, inflation, taxRate, wrapper, compoundFrequency,
    annualWrapperLimit, lifetimeWrapperLimit, contributionIncreaseRate, lumpSums
  };
  const fullYears = Math.max(0, years || 0);
  const delay = Math.max(0, Math.min(fullYears, Math.round(delayYears || 0)));

  const startNow = calculateCompoundInterest({ ...base, years: fullYears });
  const startLater = calculateCompoundInterest({ ...base, years: fullYears - delay });

  return {
    startNowBalance: startNow.finalBalance,
    startLaterBalance: startLater.finalBalance,
    cost: Math.max(0, startNow.finalBalance - startLater.finalBalance),
    delayYears: delay
  };
};
