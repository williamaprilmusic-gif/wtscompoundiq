// src/budgetRule.js
// The 50/30/20 rule of thumb: of take-home pay, roughly 50% to needs, 30% to wants,
// 20% to saving / extra debt paydown. Given real numbers it shows the targets and how
// the entered split compares. Complements the Budget tab, which categorises line items
// but doesn't score them against a benchmark.
export const budgetRuleCheck = ({ takeHomeIncome, needs, wants, savings }) => {
  const income = Math.max(0, takeHomeIncome || 0);
  const actual = {
    needs: Math.max(0, needs || 0),
    wants: Math.max(0, wants || 0),
    savings: Math.max(0, savings || 0)
  };
  const targets = { needs: income * 0.5, wants: income * 0.3, savings: income * 0.2 };
  const pct = (v) => (income > 0 ? (v / income) * 100 : 0);
  const actualPct = { needs: pct(actual.needs), wants: pct(actual.wants), savings: pct(actual.savings) };

  const unallocated = income - actual.needs - actual.wants - actual.savings;

  return {
    targets,
    actualPct,
    unallocated,
    // Within a loose tolerance of 50/30/20 on all three, and not materially
    // over-allocated (a 2%-of-income slack absorbs rounding without letting a plan that
    // adds up to well over 100% pass). Checking wants too -- the earlier version let a
    // wildly-over-budget "wants" still read as on track.
    onTrack: actualPct.needs <= 55 && actualPct.wants <= 35 && actualPct.savings >= 18 && unallocated >= -income * 0.02
  };
};
