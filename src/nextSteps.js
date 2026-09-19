// src/nextSteps.js
// Rule-based "what to look at next" list for the Dashboard, derived only from which
// plan sections the user has (or hasn't) saved and a few thresholds on them. Same
// spirit as the Milestones list already on that tab: deterministic pattern-matching
// over saved data, surfacing a gap -- it computes no new numbers and gives no advice.
//
// Each step carries both a literal English `text` (the source of truth other callers
// and this module's own tests read) and a `key`/`params` pair Dashboard.jsx can pass
// to t() for translation -- t() falls back to the English string baked into
// translations.js if a language hasn't got that key yet, so this file itself never
// needs to know what language is active.
export const buildNextSteps = ({ plan, hasNetWorth, hasHealthScore }) => {
  const steps = [];
  const add = (tab, text, key, params) => steps.push({ tab, text, key, params });

  if (!plan?.emergencyFund) {
    add('Emergency Fund', 'Set an emergency fund target — the buffer that comes before investing.', 'dashboard.nextSteps.efMissing');
  } else if (plan.emergencyFund.targetAmount > 0 && plan.emergencyFund.currentSavings < plan.emergencyFund.targetAmount * 0.5) {
    add('Emergency Fund', 'Emergency fund is under halfway to target — worth prioritising.', 'dashboard.nextSteps.efUnderHalf');
  }

  if (plan?.debt && plan.debt.totalBalance > 0) {
    if (plan.debt.avalancheReachable === false) {
      add('Debt Payoff', "The saved debt plan doesn't clear at this pace — raise the extra monthly payment.", 'dashboard.nextSteps.debtUnreachable');
    } else if (plan.debt.avalancheMonths > 60) {
      add('Debt Payoff', 'Debt payoff is over 5 years out — compare Avalanche vs. a consolidation.', 'dashboard.nextSteps.debtFarOut', { years: 5 });
    }
  }

  if (!plan?.fire) {
    add('Power Tools', "Work out your FIRE number so the plan has a target to aim at.", 'dashboard.nextSteps.fireMissing');
  } else if (plan.fire.yearsToFire === null) {
    add('Power Tools', "The FIRE number isn't reachable on the saved plan — revisit the contribution or timeframe.", 'dashboard.nextSteps.fireUnreachable');
  }

  if (!hasNetWorth) {
    add('Net Worth', 'Log a net worth snapshot to start tracking the whole picture over time.', 'dashboard.nextSteps.netWorthMissing');
  }

  if (!hasHealthScore) {
    // No tab -- this one is already on the Dashboard, so it's informational, not a link.
    add(null, 'Save at least two plan sections (from any tab) to unlock the Financial Health Score.', 'dashboard.nextSteps.healthScoreLocked');
  }

  return steps.slice(0, 4);
};
