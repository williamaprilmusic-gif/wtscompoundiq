// src/dividendIncome.js
// Two directions of the same dividend/interest-yield relationship: the capital needed
// to throw off a target income at a given yield, and the income a given portfolio
// produces. Distinct from the FIRE Number tool, which sizes a pot for a 4%-rule
// total-return drawdown (selling units over time), not a yield you live off while the
// capital stays intact.
export const dividendIncome = ({ targetMonthlyIncome, currentPortfolio, annualYield }) => {
  const yieldPct = Math.max(0, annualYield || 0);
  const monthlyTarget = Math.max(0, targetMonthlyIncome || 0);
  const portfolio = Math.max(0, currentPortfolio || 0);

  const capitalNeeded = yieldPct > 0 ? (monthlyTarget * 12) / (yieldPct / 100) : null;
  const annualFromPortfolio = portfolio * (yieldPct / 100);

  return {
    capitalNeeded,
    annualFromPortfolio,
    monthlyFromPortfolio: annualFromPortfolio / 12,
    shortfallCapital: capitalNeeded != null ? Math.max(0, capitalNeeded - portfolio) : null
  };
};
