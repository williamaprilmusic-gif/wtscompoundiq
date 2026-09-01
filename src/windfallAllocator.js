// src/windfallAllocator.js
// A rule-based suggested split for a lump sum (bonus, tax refund, inheritance),
// following the conventional priority order: bring the emergency fund up to target
// first, then clear any debt whose rate beats what investing is expected to keep,
// then fill this year's tax-advantaged room, then a taxable account with the rest.
// Deterministic if/else, like the Coach -- a starting framework, not advice.
export const allocateWindfall = ({ amount, emergencyShortfall = 0, highInterestDebt = 0, wrapperRoom = 0 }) => {
  let left = Math.max(0, amount || 0);
  const steps = [];

  const take = (label, need, note) => {
    const put = Math.max(0, Math.min(left, Math.max(0, need || 0)));
    if (put > 0) {
      steps.push({ label, amount: put, note });
      left -= put;
    }
  };

  take('Top up emergency fund', emergencyShortfall,
    'Reach your target months of essential expenses before anything else.');
  take('Clear high-interest debt', highInterestDebt,
    'Paying off debt that costs more than investing is expected to earn is a guaranteed return.');
  take('Fill tax-advantaged room', wrapperRoom,
    "Use this year's tax-free / pre-tax contribution allowance before it resets.");
  if (left > 0) {
    steps.push({ label: 'Invest in a taxable account', amount: left, note: "What's left once the priorities above are covered." });
    left = 0; // the taxable account absorbs whatever remains -- nothing is left unallocated
  }

  return { steps, allocated: Math.max(0, amount || 0) - left, leftover: left };
};
