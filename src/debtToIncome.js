// src/debtToIncome.js
// Pure math backing PowerTools.jsx's Debt-to-Income Ratio Calculator. Distinct from
// Home Affordability's affordRatio (which caps a *hypothetical new* bond payment) --
// this scores the debt load someone already carries today, the metric a lender
// actually checks. Bands follow the widely-cited mortgage-underwriting convention (a
// back-end DTI under ~36% is considered healthy, 43%+ is where many lenders decline).

const DTI_BANDS = [
  { upTo: 20, key: 'healthy', label: 'Healthy' },
  { upTo: 36, key: 'manageable', label: 'Manageable' },
  { upTo: 43, key: 'stretched', label: 'Getting stretched' },
  { upTo: Infinity, key: 'high', label: 'High risk' }
];

export const calculateDTI = ({ monthlyDebtPayments, grossMonthlyIncome }) => {
  const income = Math.max(0, grossMonthlyIncome || 0);
  const debt = Math.max(0, monthlyDebtPayments || 0);
  const ratio = income > 0 ? (debt / income) * 100 : 0;
  const band = DTI_BANDS.find(b => ratio <= b.upTo) || DTI_BANDS[DTI_BANDS.length - 1];
  return { ratio, band: band.key, bandLabel: band.label };
};
