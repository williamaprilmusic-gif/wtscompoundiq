// src/sarsTaxYear.js
// South Africa's tax year for individuals runs 1 March to the last day of February
// the following year (e.g. 1 March 2026 - 28 February 2027 is the "2026/27" tax
// year) -- not the calendar year most people default to thinking in. The TFSA annual
// contribution limit, and most other SARS-facing personal deadlines, reset on this
// cycle, which is a common source of confusion ("did I use this year's TFSA
// allowance?" answered wrong by counting from 1 January).
export const sarsTaxYear = (now = new Date()) => {
  const MARCH = 2; // Date's getMonth() is 0-indexed: 0=Jan, 1=Feb, 2=Mar
  const isOnOrAfterMarch = now.getMonth() >= MARCH;
  const startYear = isOnOrAfterMarch ? now.getFullYear() : now.getFullYear() - 1;
  const endYear = startYear + 1;
  // Day 0 of March is JS Date's standard idiom for "the last day of February" --
  // correctly handles leap years without a separate leap-year check.
  const endDate = new Date(endYear, MARCH, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / msPerDay));
  return {
    label: `${startYear}/${String(endYear).slice(-2)}`,
    endDate,
    daysLeft
  };
};
