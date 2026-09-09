// src/wealthPathEngine.js
// The "how to build wealth" roadmap, as a small pure function. It encodes the
// well-worn ordering personal-finance guidance converges on -- know your cash flow,
// a starter buffer, kill expensive debt, a full emergency fund, fill tax-advantaged
// room, then invest the surplus toward financial independence -- and marks each step
// done / to-do / unknown from whatever the user has already entered elsewhere in the
// app (Budget, Emergency Fund, Debt Payoff, the Calculator's wrapper toggle, Net
// Worth). No advice is invented: every number shown is derived from the user's own
// inputs or a stated rule of thumb. WealthPath.jsx holds the copy for each step id.

// A debt at or above this annual rate is "expensive" -- roughly SA prime plus a
// margin. Clearing it is a guaranteed return you won't reliably beat by investing, so
// it comes before funding the market side of the plan.
export const EXPENSIVE_DEBT_RATE = 12;
export const STARTER_EF_MONTHS = 1;
export const FULL_EF_MONTHS = 3;
// The "4% rule" pot: 25x a year of spending. A rough planning target, not a promise.
export const FI_MULTIPLE = 25;

const STEP_IDS = ['budget', 'starterEf', 'killDebt', 'fullEf', 'tfsa', 'retireFund', 'invest', 'fi'];

const clampPct = (n) => Math.max(0, Math.min(100, n));

// All inputs optional. A field left null/undefined means "the user hasn't given us
// enough to judge this yet" -> the step reports status 'unknown' rather than a
// misleading 'done'/'todo'.
export const computeWealthPath = ({
  monthlyExpenses = null,   // best available: Emergency Fund's figure, else Budget expenses
  hasBudget = false,        // real income AND expenses entered on the Budget tab
  expensiveDebt = null,     // total balance of debts at/above EXPENSIVE_DEBT_RATE; null = no debt data
  anyDebtData = false,      // any debts entered on the Debt Payoff tab at all
  emergencySavings = null,  // current saved emergency fund
  wrapperOn = false,        // the Calculator's tax-free wrapper toggle
  investedAssets = null,    // investable assets from Net Worth; null = no data
  annualWrapperLimit = 0    // country.annualWrapperLimit (e.g. 46000 for SA TFSA)
} = {}) => {
  const starterTarget = monthlyExpenses != null ? monthlyExpenses * STARTER_EF_MONTHS : null;
  const fullTarget = monthlyExpenses != null ? monthlyExpenses * FULL_EF_MONTHS : null;
  const fiNumber = monthlyExpenses != null ? monthlyExpenses * 12 * FI_MULTIPLE : null;
  const fiProgressPct =
    fiNumber != null && fiNumber > 0 && investedAssets != null
      ? clampPct((investedAssets / fiNumber) * 100)
      : null;

  const statusFor = (id) => {
    switch (id) {
      case 'budget':
        return hasBudget ? 'done' : 'todo';
      case 'starterEf':
        if (emergencySavings == null || starterTarget == null) return 'unknown';
        return emergencySavings >= starterTarget ? 'done' : 'todo';
      case 'killDebt':
        if (!anyDebtData || expensiveDebt == null) return 'unknown';
        return expensiveDebt > 0 ? 'todo' : 'done';
      case 'fullEf':
        if (emergencySavings == null || fullTarget == null) return 'unknown';
        return emergencySavings >= fullTarget ? 'done' : 'todo';
      case 'tfsa':
        return wrapperOn ? 'done' : 'todo';
      case 'retireFund':
        // Whether someone is already maxing a retirement-fund deduction isn't visible
        // to the app -- always informational, and never blocks progress.
        return 'info';
      case 'invest':
        if (fiNumber == null || investedAssets == null) return 'unknown';
        return investedAssets >= fiNumber ? 'done' : 'todo';
      case 'fi':
        return fiNumber != null && investedAssets != null && investedAssets >= fiNumber ? 'done' : 'todo';
      default:
        return 'unknown';
    }
  };

  const targetFor = (id) => {
    if (id === 'starterEf') return starterTarget;
    if (id === 'fullEf') return fullTarget;
    if (id === 'tfsa') return annualWrapperLimit ? annualWrapperLimit / 12 : null; // monthly
    if (id === 'killDebt') return expensiveDebt != null && expensiveDebt > 0 ? expensiveDebt : null;
    if (id === 'invest' || id === 'fi') return fiNumber;
    return null;
  };

  const steps = STEP_IDS.map((id) => ({ id, status: statusFor(id), target: targetFor(id) }));

  // "Where you are now": the first step still needing action. 'info' and 'done' don't
  // count; 'unknown' does (we can't tell it's finished, so surface it). If everything
  // actionable is done, land on the finish line.
  const firstOpen = steps.find((s) => s.status === 'todo' || s.status === 'unknown');
  const currentId = firstOpen ? firstOpen.id : 'fi';

  return { steps, currentId, fiNumber, fiProgressPct };
};
