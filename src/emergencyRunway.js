// src/emergencyRunway.js
// The other side of the Emergency Fund tab: not "how much should I save" but "if my
// income stopped today, how many full months would what I already have cover" --
// burning a balance down by monthly essential expenses while the remainder earns a
// little interest.
export const emergencyRunway = ({ savings, monthlyExpenses, annualSavingsRate = 0 }) => {
  const balance0 = Math.max(0, savings || 0);
  const burn = Math.max(0, monthlyExpenses || 0);
  const i = Math.max(0, annualSavingsRate || 0) / 100 / 12;

  if (burn === 0) return { fullMonths: Infinity, lastsIndefinitely: true };
  // If a month's interest alone covers the burn, the fund never depletes.
  if (i > 0 && balance0 * i >= burn) return { fullMonths: Infinity, lastsIndefinitely: true };

  let balance = balance0;
  let fullMonths = 0;
  const MAX = 1200;
  while (balance >= burn && fullMonths < MAX) {
    balance = balance * (1 + i) - burn;
    fullMonths++;
  }
  return { fullMonths, lastsIndefinitely: false };
};
