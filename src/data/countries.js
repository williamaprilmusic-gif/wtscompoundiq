// src/data/countries.js
// Simplified database of global tax profiles and local interest benchmarks.
// Figures are indicative/illustrative for an educational calculator, not tax advice --
// they drift over time and vary by individual bracket, so treat them as ballpark defaults.
// Wrapper contribution limits spot-checked against current sources: 2026-08-26
// (South Africa, US, UK, Canada, Australia, Germany, India, Japan verified 2026-08-25;
// France, Netherlands, Ireland, Spain, Italy, Switzerland, Sweden, Norway, Denmark, China,
// Singapore, Hong Kong, New Zealand, Brazil, Mexico, United Arab Emirates, Saudi Arabia,
// Nigeria, Kenya, Egypt, South Korea, Poland, Turkey verified 2026-08-26;
// Argentina, Pakistan, Ghana, Vietnam, Indonesia added and verified 2026-08-26 -- picked
// specifically for notably high nominal savings/deposit rates (several of which mostly
// compensate for high local inflation rather than real growth -- see per-country notes) --
// all 36 countries now individually spot-checked, though figures still drift and should be
// periodically re-verified).

export const countriesData = [
  {
    code: 'za',
    name: 'South Africa',
    currency: 'ZAR',
    symbol: 'R',
    taxRate: 31,
    wrapperLabel: 'TFSA',
    taxFreeWrapper: 'TFSA (Tax-Free Savings Account)',
    taxFreeLimit: 'R46,000 per year (from 1 March 2026) / R500,000 lifetime',
    annualWrapperLimit: 46000,
    lifetimeWrapperLimit: 500000,
    typicalBankRate: 6.8,
    typicalInflation: 4.5, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Interest income is taxable up to your marginal tax bracket.',
      capitalGains: 'CGT applies on equity withdrawals outside TFSA wrappers.'
    }
  },
  {
    code: 'us',
    name: 'United States',
    currency: 'USD',
    symbol: '$',
    taxRate: 22,
    wrapperLabel: 'Roth IRA',
    taxFreeWrapper: 'Roth IRA / IRA',
    taxFreeLimit: '$7,500 per year (under 50) / $8,600 (50+ catch-up, 2026 IRS figures)',
    annualWrapperLimit: 7500,
    lifetimeWrapperLimit: null,
    typicalBankRate: 4.2,
    typicalInflation: 2.5, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Standard interest is fully taxed as ordinary income.',
      capitalGains: 'Long-term capital gains are 0%, 15%, or 20% depending on bracket.'
    }
  },
  {
    code: 'gb',
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    taxRate: 20,
    wrapperLabel: 'ISA',
    taxFreeWrapper: 'ISA (Individual Savings Account)',
    taxFreeLimit: '£20,000 per year',
    annualWrapperLimit: 20000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 4.5,
    typicalInflation: 2.3, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Interest is taxed based on your Income Tax band.',
      capitalGains: 'CGT allowance applies on non-ISA assets.'
    }
  },
  {
    code: 'au',
    name: 'Australia',
    currency: 'AUD',
    symbol: 'A$',
    taxRate: 15,
    wrapperLabel: 'Superannuation',
    taxFreeWrapper: 'Superannuation (concessional contributions)',
    taxFreeLimit: 'A$32,500 per year concessional cap (from 1 July 2026)',
    annualWrapperLimit: 32500,
    lifetimeWrapperLimit: null,
    typicalBankRate: 4.1,
    typicalInflation: 2.8, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Fully taxable; Australian residents get imputation credits on dividends.',
      capitalGains: 'CGT discount of 50% for assets held over 1 year.'
    }
  },
  {
    code: 'ca',
    name: 'Canada',
    currency: 'CAD',
    symbol: 'C$',
    taxRate: 26,
    wrapperLabel: 'TFSA',
    taxFreeWrapper: 'TFSA / FHSA',
    taxFreeLimit: 'C$7,000 per year (TFSA)',
    annualWrapperLimit: 7000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 3.8,
    typicalInflation: 2.2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Fully taxed as ordinary income at your marginal rate (26% used here is a mid-upper federal bracket, not the 33% top bracket).',
      capitalGains: '50% inclusion rate for capital gains tax.'
    }
  },
  {
    code: 'de',
    name: 'Germany',
    currency: 'EUR',
    symbol: '€',
    taxRate: 26,
    wrapperLabel: 'Sparerpauschbetrag',
    taxFreeWrapper: "Saver's allowance (Sparerpauschbetrag)",
    taxFreeLimit: "Freigrenze (Saver's allowance €1,000/year)",
    annualWrapperLimit: 1000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 3.0,
    typicalInflation: 2.2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Abgeltungsteuer (flat 25% + solidarity surcharge) on interest/dividends.',
      capitalGains: 'Exempt up to €1,000 annual allowance.'
    }
  },
  {
    code: 'fr',
    name: 'France',
    currency: 'EUR',
    symbol: '€',
    taxRate: 30,
    wrapperLabel: 'PEA',
    taxFreeWrapper: "PEA (Plan d'Épargne en Actions)",
    taxFreeLimit: '€150,000 lifetime contribution cap',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: 150000,
    typicalBankRate: 3.0,
    typicalInflation: 1.8, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Flat tax (PFU) of 30% on interest and dividends by default.',
      capitalGains: 'PEA gains are tax-free after 5 years (social charges still apply).'
    }
  },
  {
    code: 'nl',
    name: 'Netherlands',
    currency: 'EUR',
    symbol: '€',
    taxRate: 36,
    wrapperLabel: 'Box 3 allowance',
    taxFreeWrapper: 'Box 3 tax-free asset allowance',
    taxFreeLimit: '≈€59,357 exempt threshold per person (2026)',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 3.0,
    typicalInflation: 2.5, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Savings/investments taxed via deemed return under Box 3 (36% rate on the deemed return, not the actual gain).',
      capitalGains: 'No separate capital gains tax; covered by Box 3 wealth tax.'
    }
  },
  {
    code: 'ie',
    name: 'Ireland',
    currency: 'EUR',
    symbol: '€',
    taxRate: 33,
    wrapperLabel: 'PRSA',
    taxFreeWrapper: 'PRSA (Personal Retirement Savings Account)',
    taxFreeLimit: 'Age-related pension contribution limits',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 2.8,
    typicalInflation: 1.9, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'DIRT (Deposit Interest Retention Tax) of 33% on bank interest.',
      capitalGains: 'Standard CGT rate of 33% above the annual €1,270 exemption.'
    }
  },
  {
    code: 'es',
    name: 'Spain',
    currency: 'EUR',
    symbol: '€',
    taxRate: 21,
    wrapperLabel: 'Plan de Pensiones',
    taxFreeWrapper: 'Plan de Pensiones (private pension)',
    taxFreeLimit: '€1,500 per year contribution limit',
    annualWrapperLimit: 1500,
    lifetimeWrapperLimit: null,
    typicalBankRate: 2.8,
    typicalInflation: 2.4, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Savings income tax bands from 19% to 30% (top rate applies above €300,000).',
      capitalGains: 'Taxed at the same progressive savings-income rates as interest.'
    }
  },
  {
    code: 'it',
    name: 'Italy',
    currency: 'EUR',
    symbol: '€',
    taxRate: 26,
    wrapperLabel: 'PIR',
    taxFreeWrapper: 'PIR (Piano Individuale di Risparmio)',
    taxFreeLimit: '€40,000 per year / €200,000 lifetime',
    annualWrapperLimit: 40000,
    lifetimeWrapperLimit: 200000,
    typicalBankRate: 2.8,
    typicalInflation: 1.9, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Flat 26% withholding tax on interest and capital income.',
      capitalGains: 'PIR gains held 5+ years are exempt from capital gains tax.'
    }
  },
  {
    code: 'ch',
    name: 'Switzerland',
    currency: 'CHF',
    symbol: 'CHF',
    taxRate: 22,
    wrapperLabel: 'Pillar 3a',
    taxFreeWrapper: 'Pillar 3a (private pension)',
    taxFreeLimit: 'CHF 7,258 per year (with pension fund)',
    annualWrapperLimit: 7258,
    lifetimeWrapperLimit: null,
    typicalBankRate: 1.0,
    typicalInflation: 1, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Interest taxed as income at federal + cantonal marginal rates.',
      capitalGains: 'Private capital gains on movable assets are generally tax-free.'
    }
  },
  {
    code: 'se',
    name: 'Sweden',
    currency: 'SEK',
    symbol: 'kr',
    taxRate: 30,
    wrapperLabel: 'ISK',
    taxFreeWrapper: 'ISK (Investeringssparkonto)',
    taxFreeLimit: 'No contribution cap; first SEK 300,000 tax-free (2026 threshold, up from 150,000)',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 2.5,
    typicalInflation: 2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Flat 30% capital income tax on interest outside an ISK.',
      capitalGains: 'ISK accounts pay a low annual flat tax (~1.07% effective in 2026) instead of CGT.'
    }
  },
  {
    code: 'no',
    name: 'Norway',
    currency: 'NOK',
    symbol: 'kr',
    taxRate: 22,
    wrapperLabel: 'ASK',
    taxFreeWrapper: 'ASK (Aksjesparekonto)',
    taxFreeLimit: 'No cap; gains deferred until withdrawal',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 4.0,
    typicalInflation: 3, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Flat 22% tax on interest and capital income.',
      capitalGains: 'ASK share gains are tax-deferred until money leaves the account.'
    }
  },
  {
    code: 'dk',
    name: 'Denmark',
    currency: 'DKK',
    symbol: 'kr',
    taxRate: 37,
    wrapperLabel: 'Aktiesparekonto',
    taxFreeWrapper: 'Aktiesparekonto (share savings account)',
    taxFreeLimit: 'DKK 174,200 deposit cap (2026)',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: 174200,
    typicalBankRate: 2.3,
    typicalInflation: 1.8, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Capital income taxed at ~37% up to the progressive threshold, 42% above.',
      capitalGains: 'Aktiesparekonto gains taxed at a reduced flat 17% rate.'
    }
  },
  {
    code: 'jp',
    name: 'Japan',
    currency: 'JPY',
    symbol: '¥',
    taxRate: 20,
    wrapperLabel: 'NISA',
    taxFreeWrapper: 'NISA (Nippon Individual Savings Account)',
    taxFreeLimit: '¥3.6 million per year (new NISA)',
    annualWrapperLimit: 3600000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 0.2,
    typicalInflation: 2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Flat 20.315% withholding tax on interest and dividends.',
      capitalGains: 'NISA investment gains are fully tax-exempt.'
    }
  },
  {
    code: 'cn',
    name: 'China',
    currency: 'CNY',
    symbol: '¥',
    taxRate: 20,
    wrapperLabel: 'Personal Pension',
    taxFreeWrapper: 'Personal Pension Scheme (个人养老金)',
    taxFreeLimit: '¥12,000 per year contribution cap',
    annualWrapperLimit: 12000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 1.5,
    typicalInflation: 0.5, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Bank savings interest is generally tax-exempt; other interest taxed at 20% (Personal Pension contributions up to ¥12,000/year are pre-tax deductible).',
      capitalGains: 'Individual A-share capital gains are currently exempt.'
    }
  },
  {
    code: 'in',
    name: 'India',
    currency: 'INR',
    symbol: '₹',
    taxRate: 30,
    wrapperLabel: 'PPF',
    taxFreeWrapper: 'PPF (Public Provident Fund)',
    taxFreeLimit: '₹150,000 per year',
    annualWrapperLimit: 150000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 6.5,
    typicalInflation: 4.5, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Interest taxed at your income slab rate; TDS may apply above threshold.',
      capitalGains: 'LTCG above ₹100,000/year on equities taxed at 10%.'
    }
  },
  {
    code: 'sg',
    name: 'Singapore',
    currency: 'SGD',
    symbol: 'S$',
    taxRate: 0,
    wrapperLabel: 'SRS',
    taxFreeWrapper: 'SRS (Supplementary Retirement Scheme)',
    taxFreeLimit: 'S$15,300 per year (S$35,700 for foreigners)',
    annualWrapperLimit: 15300,
    lifetimeWrapperLimit: null,
    typicalBankRate: 3.0,
    typicalInflation: 2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Personal savings interest is not taxed in Singapore.',
      capitalGains: 'No capital gains tax for individuals.'
    }
  },
  {
    code: 'hk',
    name: 'Hong Kong',
    currency: 'HKD',
    symbol: 'HK$',
    taxRate: 0,
    wrapperLabel: 'N/A',
    taxFreeWrapper: 'No standard retail tax-free wrapper',
    taxFreeLimit: 'N/A',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 3.5,
    typicalInflation: 2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'No tax on personal interest income.',
      capitalGains: 'No capital gains tax for individuals.'
    }
  },
  {
    code: 'nz',
    name: 'New Zealand',
    currency: 'NZD',
    symbol: 'NZ$',
    taxRate: 30,
    wrapperLabel: 'KiwiSaver',
    taxFreeWrapper: 'KiwiSaver (retirement savings scheme)',
    taxFreeLimit: 'Employer + member min. 3.5% each of gross pay (from April 2026); no fixed cap',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 4.5,
    typicalInflation: 2.5, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Interest taxed via RWT at your marginal rate.',
      capitalGains: 'No general capital gains tax for most individual investors.'
    }
  },
  {
    code: 'br',
    name: 'Brazil',
    currency: 'BRL',
    symbol: 'R$',
    taxRate: 17,
    wrapperLabel: 'LCI/LCA',
    taxFreeWrapper: 'LCI/LCA (tax-exempt bank bonds)',
    taxFreeLimit: 'No fixed cap; product-specific',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 10.5,
    typicalInflation: 4.2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Regressive IR table on fixed income: 22.5% down to 15% by holding term.',
      capitalGains: 'LCI/LCA interest is exempt from income tax for individuals.'
    }
  },
  {
    code: 'mx',
    name: 'Mexico',
    currency: 'MXN',
    symbol: 'MX$',
    taxRate: 20,
    wrapperLabel: 'Afore',
    taxFreeWrapper: 'Afore (retirement savings account)',
    taxFreeLimit: 'Voluntary contributions tax-deductible up to 10% of income or 5 UMA (~MX$198,000/year, 2026)',
    annualWrapperLimit: 198000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 9.0,
    typicalInflation: 4, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Interest subject to withholding tax plus annual ISR reconciliation.',
      capitalGains: 'Stock exchange gains taxed at a flat 10% for residents.'
    }
  },
  {
    code: 'ae',
    name: 'United Arab Emirates',
    currency: 'AED',
    symbol: 'AED',
    taxRate: 0,
    wrapperLabel: 'N/A',
    taxFreeWrapper: 'No personal income tax wrapper needed',
    taxFreeLimit: 'N/A',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 3.5,
    typicalInflation: 2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'No personal income tax on interest for individuals.',
      capitalGains: 'No personal capital gains tax.'
    }
  },
  {
    code: 'sa',
    name: 'Saudi Arabia',
    currency: 'SAR',
    symbol: 'SR',
    taxRate: 0,
    wrapperLabel: 'N/A',
    taxFreeWrapper: 'No personal income tax wrapper needed',
    taxFreeLimit: 'N/A',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 3.0,
    typicalInflation: 2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'No personal income tax on interest for individuals.',
      capitalGains: 'No personal capital gains tax (Zakat applies to businesses).'
    }
  },
  {
    code: 'ng',
    name: 'Nigeria',
    currency: 'NGN',
    symbol: '₦',
    taxRate: 10,
    wrapperLabel: 'N/A',
    taxFreeWrapper: 'No standard retail tax-free wrapper',
    taxFreeLimit: 'N/A',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 15.0,
    typicalInflation: 20, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: '10% withholding tax on bank interest.',
      capitalGains: 'Since the 2026 tax reform, individual capital gains are folded into progressive PIT (up to 25%) instead of the old flat 10% rate.'
    }
  },
  {
    code: 'ke',
    name: 'Kenya',
    currency: 'KES',
    symbol: 'KSh',
    taxRate: 15,
    wrapperLabel: 'N/A',
    taxFreeWrapper: 'No standard retail tax-free wrapper',
    taxFreeLimit: 'N/A',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 8.0,
    typicalInflation: 6.5, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: '15% withholding tax on bank/deposit interest.',
      capitalGains: 'Capital gains tax rate of 15% on disposal of property/securities.'
    }
  },
  {
    code: 'eg',
    name: 'Egypt',
    currency: 'EGP',
    symbol: 'E£',
    taxRate: 20,
    wrapperLabel: 'N/A',
    taxFreeWrapper: 'No standard retail tax-free wrapper',
    taxFreeLimit: 'N/A',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 18.0,
    typicalInflation: 15, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Bank deposit interest generally taxed at source.',
      capitalGains: 'Capital gains on EGX-listed securities are exempt from income tax since 2026 (only a small stamp duty applies).'
    }
  },
  {
    code: 'kr',
    name: 'South Korea',
    currency: 'KRW',
    symbol: '₩',
    taxRate: 15,
    wrapperLabel: 'ISA',
    taxFreeWrapper: 'ISA (Individual Savings Account, Korea)',
    taxFreeLimit: '₩20,000,000/year, ₩100,000,000 lifetime cap (min. 3-year term)',
    annualWrapperLimit: 20000000,
    lifetimeWrapperLimit: 100000000,
    typicalBankRate: 3.2,
    typicalInflation: 2.2, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Flat 15.4% withholding tax on interest income.',
      capitalGains: 'ISA gains up to ₩2-4 million are tax-exempt.'
    }
  },
  {
    code: 'pl',
    name: 'Poland',
    currency: 'PLN',
    symbol: 'zł',
    taxRate: 19,
    wrapperLabel: 'IKE',
    taxFreeWrapper: 'IKE (Individual Retirement Account)',
    taxFreeLimit: 'PLN 28,260 per year (2026 limit)',
    annualWrapperLimit: 28260,
    lifetimeWrapperLimit: null,
    typicalBankRate: 5.0,
    typicalInflation: 4, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: "Flat 19% 'Belka tax' on interest and capital income.",
      capitalGains: 'IKE investment gains are fully tax-exempt on qualifying withdrawal.'
    }
  },
  {
    code: 'tr',
    name: 'Turkey',
    currency: 'TRY',
    symbol: '₺',
    taxRate: 15,
    wrapperLabel: 'BES',
    taxFreeWrapper: 'BES (private pension system)',
    taxFreeLimit: 'Voluntary contributions, government match up to 20% (2026, reduced from 25%)',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 35.5,
    typicalInflation: 45, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Withholding tax on deposit interest, rate varies by maturity (~15%).',
      capitalGains: 'Equity gains held over 1 year on BIST-listed shares are exempt.'
    }
  },
  {
    code: 'ar',
    name: 'Argentina',
    currency: 'ARS',
    symbol: 'AR$',
    taxRate: 0,
    wrapperLabel: 'N/A',
    taxFreeWrapper: 'No standard retail tax-free wrapper',
    taxFreeLimit: 'N/A',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 19.5,
    typicalInflation: 60, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: "Interest on ARS savings and time deposits (plazo fijo) is broadly exempt from income tax for individual retail savers, but the ~19-23% nominal rates (Aug 2026) mostly compensate for Argentina's persistently high inflation rather than real growth.",
      capitalGains: 'Gains on Argentine-listed shares and bonds held by individual non-habitual investors are also generally exempt from income tax.'
    }
  },
  {
    code: 'pk',
    name: 'Pakistan',
    currency: 'PKR',
    symbol: 'Rs',
    taxRate: 15,
    wrapperLabel: 'VPS',
    taxFreeWrapper: 'VPS (Voluntary Pension Scheme)',
    taxFreeLimit: 'Tax credit on contributions up to 20% of annual taxable income',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 11.5,
    typicalInflation: 12, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Profit on debt (bank and National Savings interest) is withheld at source under Section 151 -- 15% for FBR active filers, rising to 30-40% for non-filers.',
      capitalGains: 'Capital gains on listed securities are taxed under the CGT regime, with rates depending on holding period and filer status.'
    }
  },
  {
    code: 'gh',
    name: 'Ghana',
    currency: 'GHS',
    symbol: 'GH₵',
    taxRate: 8,
    wrapperLabel: 'Tier 3',
    taxFreeWrapper: 'Tier 3 Provident Fund (voluntary pension)',
    taxFreeLimit: 'Contributions tax-deductible up to 16.5% of basic salary',
    annualWrapperLimit: null,
    lifetimeWrapperLimit: null,
    typicalBankRate: 13.0,
    typicalInflation: 15, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Government of Ghana Treasury bills (a very popular retail savings vehicle, yielding ~13% on a 364-day bill in 2026) are tax-exempt for individuals, while other interest/dividend income generally attracts an 8% final withholding tax.',
      capitalGains: 'Capital gains tax on disposal of shares and other chargeable assets is generally 15%, though individuals may elect to have the gain taxed as ordinary income instead.'
    }
  },
  {
    code: 'vn',
    name: 'Vietnam',
    currency: 'VND',
    symbol: '₫',
    taxRate: 0,
    wrapperLabel: 'Voluntary Pension Fund',
    taxFreeWrapper: 'Voluntary Pension Fund (Quỹ hưu trí tự nguyện)',
    taxFreeLimit: 'Employee contributions deductible up to VND 1 million/month',
    annualWrapperLimit: 12000000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 6.5,
    typicalInflation: 3.5, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Interest on VND bank savings and time deposits is currently exempt from personal income tax, though 2026 reform proposals could scale this exemption back for larger balances.',
      capitalGains: 'Listed securities transfers are taxed at a flat 0.1% of the gross sale value per trade, regardless of whether the trade was profitable.'
    }
  },
  {
    code: 'id',
    name: 'Indonesia',
    currency: 'IDR',
    symbol: 'Rp',
    taxRate: 20,
    wrapperLabel: 'DPLK',
    taxFreeWrapper: 'DPLK (Dana Pensiun Lembaga Keuangan)',
    taxFreeLimit: 'Deductible contributions up to Rp200,000/month (Rp2.4 million/year)',
    annualWrapperLimit: 2400000,
    lifetimeWrapperLimit: null,
    typicalBankRate: 6.25,
    typicalInflation: 3, // illustrative avg. annual CPI, not live data
    taxRules: {
      interestDeduction: 'Time deposit interest is subject to a flat 20% final withholding tax; smaller regional banks (BPR) commonly pay up to the LPS-guaranteed ceiling of 6.25% (mid-2026) to attract savers, well above the ~2-3.5% major banks offer.',
      capitalGains: 'Sales of Indonesian-listed shares are subject to a final 0.1% tax on the gross transaction value rather than a tax on the gain itself.'
    }
  }
  // 36 countries total -- matches the "Full 36-country currency & tax database" Pro feature.
];

export const getCountryByCode = (code) => countriesData.find(c => c.code === code) || countriesData[0];

// Approximate, illustrative exchange rates (units of local currency per 1 USD), spot-checked
// 2026-08-27. These are NOT live rates -- FX moves constantly, so treat any conversion using
// this table as a rough order-of-magnitude comparison, not a real-time quote.
export const FX_RATE_TO_USD = {
  za: 18.0, us: 1.0, gb: 0.79, au: 1.53, ca: 1.37, de: 0.92, fr: 0.92, nl: 0.92,
  ie: 0.92, es: 0.92, it: 0.92, ch: 0.88, se: 10.5, no: 10.7, dk: 6.9, jp: 150,
  cn: 7.2, in: 83, sg: 1.35, hk: 7.8, nz: 1.65, br: 5.1, mx: 17, ae: 3.67,
  sa: 3.75, ng: 1550, ke: 129, eg: 49, kr: 1330, pl: 4.0, tr: 34, ar: 1000,
  pk: 278, gh: 15.5, vn: 25000, id: 15800
};

export const convertAmount = (amount, fromCode, toCode) => {
  const fromRate = FX_RATE_TO_USD[fromCode];
  const toRate = FX_RATE_TO_USD[toCode];
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
};

// Date each country's tax rate / wrapper limit was last spot-checked against a web
// source (see the header comment above for the research notes). Surfaced in the UI
// (Tax Optimizer, Calculator) so staleness is visible to users, not just buried in a
// code comment -- update the relevant code(s) here whenever a re-verification pass runs.
export const LAST_VERIFIED = {
  za: '2026-08-25', us: '2026-08-25', gb: '2026-08-25', ca: '2026-08-25',
  au: '2026-08-25', de: '2026-08-25', in: '2026-08-25', jp: '2026-08-25',
  fr: '2026-08-26', nl: '2026-08-26', ie: '2026-08-26', es: '2026-08-26',
  it: '2026-08-26', ch: '2026-08-26', se: '2026-08-26', no: '2026-08-26',
  dk: '2026-08-26', cn: '2026-08-26', sg: '2026-08-26', hk: '2026-08-26',
  nz: '2026-08-26', br: '2026-08-26', mx: '2026-08-26', ae: '2026-08-26',
  sa: '2026-08-26', ng: '2026-08-26', ke: '2026-08-26', eg: '2026-08-26',
  kr: '2026-08-26', pl: '2026-08-26', tr: '2026-08-26',
  ar: '2026-08-26', pk: '2026-08-26', gh: '2026-08-26', vn: '2026-08-26', id: '2026-08-26'
};

const daysSince = (isoDate) => Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));

// Returns { date, daysAgo, stale } for a country code -- `stale` flags data older than
// 90 days so the UI can visually call out figures that are overdue for re-verification.
export const getVerificationInfo = (code) => {
  const date = LAST_VERIFIED[code];
  if (!date) return { date: null, daysAgo: null, stale: true };
  const daysAgo = daysSince(date);
  return { date, daysAgo, stale: daysAgo > 90 };
};
