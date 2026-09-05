// src/components/Snapshot.jsx
import React, { useState, useEffect } from 'react';
import './Snapshot.css';
import { calculateCompoundInterest } from '../engine';
import GrowthChart from './GrowthChart';
import { readPlan, loanEffectiveMonthlyPayment, loanEffectiveTermLabel } from '../utils/planStorage';
import { usePersistedState } from '../utils/usePersistedState';
import { downloadCSV } from '../utils/csv';
import { COMPLIANCE_KEY } from './MyPlan';

// Exported so Dashboard.jsx's own print masthead can read the same firm/advisor/client
// details and logo an Ultra user already set here, rather than a third place to
// set them (My Plan has its own, separate, lighter branding store -- see MyPlan.jsx's
// BRANDING_KEY for why that isn't unified into this one).
export const BRANDING_KEY = 'wts_compoundiq_report_branding';
export const DEFAULT_BRANDING = { firmName: '', advisorName: '', clientName: '', logoDataUrl: '', contactInfo: '', fspNumber: '' };
// Keeps a data-URL logo (base64-encoded in localStorage alongside everything else this
// app persists) from silently eating a meaningful chunk of the shared ~5-10MB
// localStorage quota -- a compressed PNG/JPG a firm would actually use for a report
// masthead comfortably fits well under this.
const MAX_LOGO_BYTES = 500 * 1024;

const exportProjectionCSV = (results, country) => downloadCSV(
  `wts-compoundiq-${country.code}-projection.csv`,
  [
    ['Year', 'Balance', 'Real Value', 'Deposited', 'Interest', 'Tax Paid'],
    ...results.yearlyData.map(r => [r.year, r.balance, r.realValue, r.deposited, r.interest, r.taxPaid])
  ]
);

const Snapshot = ({ country, initial, monthly, rate, years, inflation, wrapper, compoundFrequency, contributionIncrease = 0, lumpSums = [], canWhiteLabel = false, onOpenPricing }) => {
  const [plan, setPlan] = useState(null);
  const [branding, setBranding] = usePersistedState(BRANDING_KEY, DEFAULT_BRANDING);
  const [brandingError, setBrandingError] = useState(null);
  // Read-only here -- the one editor for this text lives on My Plan (shared via
  // COMPLIANCE_KEY) so an adviser sets a firm disclosure once and it appears on both
  // documents instead of being typed into two separate fields that could drift apart.
  const [compliance, setCompliance] = useState('');

  useEffect(() => {
    setPlan(readPlan());
    try { setCompliance(localStorage.getItem(COMPLIANCE_KEY) || ''); } catch { /* ignore */ }
  }, []);

  // White-label branding (firm/advisor/client name, logo) is an Ultra feature -- see
  // TierPricing.jsx. `canWhiteLabel` is passed in as canAccess('Ultra') (same as
  // MyPlan). A lower tier's already-saved branding is kept in storage but not applied
  // to the report, so downgrading doesn't silently delete it -- re-upgrading brings it
  // straight back.

  const updateBranding = (field, value) => setBranding(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) { setBrandingError('Please choose an image file (PNG, JPG, SVG, etc.).'); return; }
    if (file.size > MAX_LOGO_BYTES) { setBrandingError(`That logo is ${Math.round(file.size / 1024)}KB -- please use an image under ${MAX_LOGO_BYTES / 1024}KB.`); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { updateBranding('logoDataUrl', String(ev.target.result)); setBrandingError(null); };
    reader.onerror = () => setBrandingError('Could not read that image file.');
    reader.readAsDataURL(file);
  };

  const results = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    contributionIncreaseRate: contributionIncrease, lumpSums
  });

  const hasWrapper = country.wrapperLabel && country.wrapperLabel !== 'N/A';
  const taxableResults = calculateCompoundInterest({ initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper: false, compoundFrequency, contributionIncreaseRate: contributionIncrease, lumpSums });
  const wrapperResults = calculateCompoundInterest({
    initial, monthly, rate, years, inflation, taxRate: country.taxRate, wrapper: true, compoundFrequency,
    annualWrapperLimit: country.annualWrapperLimit, lifetimeWrapperLimit: country.lifetimeWrapperLimit,
    contributionIncreaseRate: contributionIncrease, lumpSums
  });
  const wrapperBenefit = wrapperResults.finalBalance - taxableResults.finalBalance;

  const now = new Date();
  const today = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  // A stable-per-day reference an adviser can quote when filing a client report. Not a
  // security token -- just "which printout is this". Regenerates each render, so it
  // moves with the wall clock; that's fine for a "generated at" style stamp.
  const pad = (n) => String(n).padStart(2, '0');
  const reportRef = `WTS-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

  return (
    <div className="card snapshot-page">
      <div className="snapshot-actions no-print">
        <div className="snapshot-actions-text">
          <h2>📄 Financial Snapshot</h2>
          <p>A one-page summary of your current plan -- print it, save it as a PDF, or download the raw numbers.</p>
        </div>
        <div className="snapshot-buttons">
          <button className="snapshot-btn" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
          <button className="snapshot-btn secondary" onClick={() => exportProjectionCSV(results, country)}>⬇️ Download CSV</button>
        </div>
      </div>

      {canWhiteLabel ? (
        <div className="snapshot-branding no-print">
          <h3>🏷️ Client Report Branding</h3>
          <p className="snapshot-branding-desc">Ultra feature -- add your firm's details below and they'll appear on the report header instead of WTS CompoundIQ's own, ready to hand to a client.</p>
          <div className="snapshot-branding-form">
            <div className="form-group">
              <label>Firm Name</label>
              <input type="text" value={branding.firmName} onChange={(e) => updateBranding('firmName', e.target.value)} placeholder="e.g. Acme Financial Advisory" />
            </div>
            <div className="form-group">
              <label>Advisor Name</label>
              <input type="text" value={branding.advisorName} onChange={(e) => updateBranding('advisorName', e.target.value)} placeholder="e.g. Jane Smith, CFP" />
            </div>
            <div className="form-group">
              <label>Client Name</label>
              <input type="text" value={branding.clientName} onChange={(e) => updateBranding('clientName', e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div className="form-group">
              <label>Contact Info (for the report footer)</label>
              <input type="text" value={branding.contactInfo} onChange={(e) => updateBranding('contactInfo', e.target.value)} placeholder="e.g. 011 123 4567 · jane@acmefinancial.co.za" />
            </div>
            <div className="form-group">
              <label>FSP Number (FAIS licence)</label>
              <input type="text" value={branding.fspNumber} onChange={(e) => updateBranding('fspNumber', e.target.value)} placeholder="e.g. FSP 12345" />
            </div>
          </div>
          <div className="snapshot-branding-logo-row">
            {branding.logoDataUrl && <img src={branding.logoDataUrl} alt="Firm logo preview" className="snapshot-branding-logo-preview" />}
            <label className="snapshot-branding-logo-btn">
              🖼️ {branding.logoDataUrl ? 'Replace Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
            </label>
            {branding.logoDataUrl && (
              <button type="button" className="snapshot-branding-logo-remove" onClick={() => updateBranding('logoDataUrl', '')}>Remove logo</button>
            )}
          </div>
          {brandingError && <p className="snapshot-branding-error">⚠️ {brandingError}</p>}
        </div>
      ) : (
        <div className="snapshot-branding-upsell no-print">
          <p>
            🏷️ <strong>White-label this report</strong> -- add your firm's name, logo, and client details to the header
            instead of WTS CompoundIQ's own. Included on Ultra.{' '}
            {onOpenPricing && <button type="button" className="snapshot-branding-upsell-btn" onClick={onOpenPricing}>View Pricing</button>}
          </p>
        </div>
      )}

      <div className="snapshot-print-area">
        <div className="snapshot-report-header">
          {canWhiteLabel && branding.logoDataUrl && (
            <img src={branding.logoDataUrl} alt={`${branding.firmName || 'Firm'} logo`} className="snapshot-report-logo" />
          )}
          <h1>{canWhiteLabel && branding.firmName ? branding.firmName : 'WTS CompoundIQ'} -- Financial Snapshot</h1>
          <p>
            {country.name} · Generated {today}
            {canWhiteLabel && branding.advisorName && ` · Prepared by ${branding.advisorName}`}
            {canWhiteLabel && branding.clientName && ` · Prepared for ${branding.clientName}`}
            {canWhiteLabel && ` · Ref ${reportRef}`}
          </p>
        </div>

        <section className="snapshot-section">
          <h3>Compound Interest Projection</h3>
          <div className="snapshot-grid">
            <div><span>Initial</span><strong>{country.symbol} {initial.toLocaleString()}</strong></div>
            <div><span>Monthly Contribution</span><strong>{country.symbol} {monthly.toLocaleString()}</strong></div>
            <div><span>Annual Rate</span><strong>{rate}%</strong></div>
            <div><span>Timeframe</span><strong>{years} years</strong></div>
            <div><span>Projected Balance</span><strong>{country.symbol} {results.finalBalance.toLocaleString()}</strong></div>
            <div><span>Total Interest Earned</span><strong>{country.symbol} {results.totalInterest.toLocaleString()}</strong></div>
          </div>
          <GrowthChart yearlyData={results.yearlyData} initial={initial} symbol={country.symbol} />
        </section>

        <section className="snapshot-section">
          <h3>Tax Optimization</h3>
          {hasWrapper ? (
            <p>
              Using your {country.wrapperLabel} instead of a taxable account is worth an extra{' '}
              <strong>{country.symbol} {Math.round(wrapperBenefit).toLocaleString()}</strong> over {years} years,
              by avoiding the indicative {country.taxRate}% tax on gains.
              {wrapperResults.wrapperCapExceeded && ' Note: this contribution level exceeds the wrapper\'s real-world limit in at least one year, so the portion over the cap would actually be taxed.'}
            </p>
          ) : (
            <p>{country.name} has no standard tax-free wrapper in this dataset; gains are taxed at an indicative {country.taxRate}%.</p>
          )}
        </section>

        {plan?.emergencyFund && (
          <section className="snapshot-section">
            <h3>Emergency Fund (last saved)</h3>
            <p>
              {country.symbol} {Math.round(plan.emergencyFund.currentSavings).toLocaleString()} saved toward a{' '}
              {country.symbol} {Math.round(plan.emergencyFund.targetAmount).toLocaleString()} target,
              contributing {country.symbol} {plan.emergencyFund.monthlyContribution.toLocaleString()}/month.
            </p>
          </section>
        )}

        {plan?.debt && (
          <section className="snapshot-section">
            <h3>Debt Payoff (last saved)</h3>
            <p>
              {country.symbol} {Math.round(plan.debt.totalBalance).toLocaleString()} total debt,
              paying {country.symbol} {plan.debt.extraMonthly.toLocaleString()}/month extra,{' '}
              {plan.debt.avalancheReachable === false
                ? 'not clearing within 50 years at that pace.'
                : `on pace to be debt-free in ${plan.debt.avalancheMonths} months.`}
            </p>
          </section>
        )}

        {plan?.loan && (
          <section className="snapshot-section">
            <h3>{plan.loan.loanTypeLabel || 'Loan'} (last saved)</h3>
            <p>
              {country.symbol} {Math.round(plan.loan.principal).toLocaleString()} borrowed at {plan.loan.annualRate}% over {loanEffectiveTermLabel(plan.loan)},
              paying {country.symbol} {loanEffectiveMonthlyPayment(plan.loan).toLocaleString()}/month --
              {' '}{country.symbol} {plan.loan.totalInterest.toLocaleString()} total interest over the full term.
            </p>
          </section>
        )}

        {plan?.fire && (
          <section className="snapshot-section">
            <h3>FIRE Target (last saved)</h3>
            <p>
              {country.symbol} {Math.round(plan.fire.annualExpenses).toLocaleString()}/year expenses at a {plan.fire.withdrawalRate}% withdrawal
              rate puts the FIRE number at {country.symbol} {Math.round(plan.fire.fireNumber).toLocaleString()},{' '}
              {plan.fire.yearsToFire === null ? 'not reachable within 60 years at that saved pace' : `about ${plan.fire.yearsToFire} years out at that saved pace`}.
            </p>
          </section>
        )}

        <div className="snapshot-table-container">
        <table className="snapshot-table">
          <thead>
            <tr><th>Year</th><th>Balance</th><th>Real Value</th><th>Deposited</th><th>Interest</th><th>Tax Paid</th></tr>
          </thead>
          <tbody>
            {results.yearlyData.map(row => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{country.symbol} {row.balance.toLocaleString()}</td>
                <td>{country.symbol} {row.realValue.toLocaleString()}</td>
                <td>{country.symbol} {row.deposited.toLocaleString()}</td>
                <td>{country.symbol} {row.interest.toLocaleString()}</td>
                <td>{country.symbol} {row.taxPaid.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <p className="snapshot-disclaimer">
          WTS CompoundIQ · educational tool · figures are indicative projections, not financial advice. Tax and wrapper
          data is simplified and may drift from current law -- verify with a qualified advisor before acting.
        </p>
        {canWhiteLabel && compliance.trim() && (
          <p className="snapshot-disclaimer snapshot-compliance">{compliance.trim()}</p>
        )}
        {canWhiteLabel && ((branding.contactInfo || '').trim() || (branding.fspNumber || '').trim()) && (
          <p className="snapshot-disclaimer snapshot-contact">
            {(branding.firmName || '').trim() || 'Contact'}
            {(branding.fspNumber || '').trim() && ` (${branding.fspNumber.trim()})`}
            {(branding.contactInfo || '').trim() && `: ${branding.contactInfo.trim()}`}
          </p>
        )}
      </div>

      {canWhiteLabel && !compliance.trim() && (
        <p className="snapshot-compliance-hint no-print">
          Add a firm compliance/disclosure line (e.g. FAIS / FSP details) in the My Plan tab's Practice Branding section -- it'll appear on this report too.
        </p>
      )}
    </div>
  );
};

export default Snapshot;
