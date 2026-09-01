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

  return {
    targets,
    actualPct,
    unallocated: income - actual.needs - actual.wants - actual.savings,
    onTrack: actualPct.needs <= 55 && actualPct.savings >= 20
  };
};
