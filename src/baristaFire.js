// src/baristaFire.js
// "Barista FIRE": you stop needing to cover your whole cost of living from investments
// because you keep some part-time or lower-stress income. The pot you need shrinks to
// cover only the gap between expenses and that income, at the same safe withdrawal
// rate the FIRE Number tool uses.
export const baristaFireNumber = ({ annualExpenses, partTimeIncome, withdrawalRate }) => {
  const expenses = Math.max(0, annualExpenses || 0);
  const income = Math.max(0, partTimeIncome || 0);
  const swr = Math.max(0.01, withdrawalRate || 4);
  const gap = Math.max(0, expenses - income);

  const fullFireNumber = expenses / (swr / 100);
  const number = gap / (swr / 100);

  return {
    coversItself: gap === 0,
    gap,
    fullFireNumber,
    baristaFireNumber: number,
    reduction: fullFireNumber - number
  };
};
