// src/creditCardTrap.js
// The single-card minimum-payment trap: paying only the required minimum (typically
// the greater of a small % of the balance and a floor amount) stretches a balance out
// for years, because the % shrinks as the balance does. Separate from
// debtPayoffEngine.js's multi-debt avalanche/snowball -- this is the one-card
// cautionary calculation, and it also contrasts the minimum against a fixed payment.

export const MAX_MONTHS = 1200; // 100-year safety cap

const simulateCard = ({ balance, monthlyRate, fixedPayment, minPercent, minFloor }) => {
  let bal = balance;
  let totalInterest = 0;
  let totalPaid = 0;
  let months = 0;

  while (bal > 0.01 && months < MAX_MONTHS) {
    months++;
    const interest = bal * monthlyRate;
    bal += interest;
    totalInterest += interest;

    let payment = fixedPayment != null
      ? fixedPayment
      : Math.max(bal * (minPercent / 100), minFloor);

    if (payment <= interest) {
      // The payment doesn't even cover this month's interest -- the balance only grows.
      return { months: null, totalInterest: Infinity, totalPaid: Infinity, neverPaysOff: true };
    }
    payment = Math.min(payment, bal);
    bal -= payment;
    totalPaid += payment;
  }

  return { months, totalInterest, totalPaid, neverPaysOff: bal > 0.01 };
};

export const analyzeCreditCard = ({ balance, apr, minPercent = 2.5, minFloor = 0, fixedPayment }) => {
  const b = Math.max(0, balance || 0);
  const monthlyRate = Math.max(0, apr || 0) / 100 / 12;
  if (b <= 0) return { minimumOnly: null, fixed: null };

  const minimumOnly = simulateCard({
    balance: b, monthlyRate, fixedPayment: null,
    minPercent: Math.max(0.01, minPercent || 0), minFloor: Math.max(0, minFloor || 0)
  });
  const fixed = (fixedPayment && fixedPayment > 0)
    ? simulateCard({ balance: b, monthlyRate, fixedPayment })
    : null;

  return { minimumOnly, fixed };
};
