// src/debtPayoffEngine.js
// Pure simulation functions extracted from DebtPayoff.jsx so they're independently
// testable (see debtPayoffEngine.test.js) without needing to render the component.

export const MAX_MONTHS = 600; // 50-year safety cap

// Simulates payoff month-by-month: minimums on every debt, extra cash goes to the
// debt at the front of `order`; once a debt clears, its minimum payment rolls into
// next month's extra (the "snowball"/"avalanche" effect), regardless of strategy.
export const simulatePayoff = (debts, extraMonthly, orderFn) => {
  let remaining = debts.map(d => ({ ...d }));
  let totalInterest = 0;
  let months = 0;

  while (remaining.some(d => d.balance > 0.01) && months < MAX_MONTHS) {
    months++;
    const order = orderFn(remaining);

    for (const d of order) {
      if (d.balance <= 0) continue;
      const interest = d.balance * (d.rate / 100 / 12);
      d.balance += interest;
      totalInterest += interest;
      d.balance -= Math.min(d.minPayment, d.balance);
    }

    const freedUpPayment = remaining.filter(d => d.balance <= 0).reduce((s, d) => s + d.minPayment, 0);
    let extra = extraMonthly + freedUpPayment;
    for (const d of order) {
      if (extra <= 0) break;
      if (d.balance <= 0) continue;
      const pay = Math.min(extra, d.balance);
      d.balance -= pay;
      extra -= pay;
    }
  }

  // Determine reachability from whether every debt actually cleared, not from the
  // month count -- a payoff that finishes on exactly the MAX_MONTHS cap is still reachable.
  const reachable = !remaining.some(d => d.balance > 0.01);

  return {
    months,
    totalInterest,
    reachable
  };
};

export const avalancheOrder = (debts) => [...debts].sort((a, b) => b.rate - a.rate);
export const snowballOrder = (debts) => [...debts].sort((a, b) => a.balance - b.balance);
