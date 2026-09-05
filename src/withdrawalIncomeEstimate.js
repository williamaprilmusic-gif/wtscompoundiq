// src/withdrawalIncomeEstimate.js
// A projected pot, reframed as a rough annual (and monthly) income using a safe
// withdrawal rate -- the same 4%-rule math the FIRE Number and Retirement Income Gap
// Power Tools use, surfaced directly under the Calculator tab's own result so a plain
// "R2,145,000 in 20 years" also reads as "about R85,800/year". Deliberately simple
// (today's-money framing, no tax, no further growth during withdrawal) -- a quick
// translation, not a substitute for the dedicated retirement tools.
export const withdrawalIncomeEstimate = ({ finalBalance, withdrawalRate = 4 }) => {
  const balance = Math.max(0, finalBalance || 0);
  const rate = Math.max(0.01, withdrawalRate || 4) / 100;
  const annualIncome = balance * rate;
  return { annualIncome, monthlyIncome: annualIncome / 12 };
};
