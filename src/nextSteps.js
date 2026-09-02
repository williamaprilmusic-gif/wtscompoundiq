// src/nextSteps.js
// Rule-based "what to look at next" list for the Dashboard, derived only from which
// plan sections the user has (or hasn't) saved and a few thresholds on them. Same
// spirit as the Milestones list already on that tab: deterministic pattern-matching
// over saved data, surfacing a gap -- it computes no new numbers and gives no advice.
export const buildNextSteps = ({ plan, hasNetWorth, hasHealthScore }) => {
  const steps = [];
  const add = (tab, text) => steps.push({ tab, text });

  if (!plan?.emergencyFund) {
    add('Emergency Fund', 'Set an emergency fund target — the buffer that comes before investing.');
  } else if (plan.emergencyFund.targetAmount > 0 && plan.emergencyFund.currentSavings < plan.emergencyFund.targetAmount * 0.5) {
    add('Emergency Fund', 'Emergency fund is under halfway to target — worth prioritising.');
  }

  if (plan?.debt && plan.debt.totalBalance > 0) {
    if (plan.debt.avalancheReachable === false) {
      add('Debt Payoff', "The saved debt plan doesn't clear at this pace — raise the extra monthly payment.");
    } else if (plan.debt.avalancheMonths > 60) {
      add('Debt Payoff', 'Debt payoff is over 5 years out — compare Avalanche vs. a consolidation.');
    }
  }

  if (!plan?.fire) {
    add('Power Tools', "Work out your FIRE number so the plan has a target to aim at.");
  } else if (plan.fire.yearsToFire === null) {
    add('Power Tools', "The FIRE number isn't reachable on the saved plan — revisit the contribution or timeframe.");
  }

  if (!hasNetWorth) {
    add('Net Worth', 'Log a net worth snapshot to start tracking the whole picture over time.');
  }

  if (!hasHealthScore) {
    add('Dashboard', 'Save at least two plan sections to unlock the Financial Health Score.');
  }

  return steps.slice(0, 4);
};
