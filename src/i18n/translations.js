// src/i18n/translations.js
// Foundation-level i18n: covers the header, navigation, footer, Start Here, and the
// Calculator tab -- the highest-traffic surface of the app, not every tab (there are
// 20+ components; translating all of them accurately is a much larger job). Any key
// missing from a non-English language silently falls back to English (see
// LanguageContext.jsx's `t()`), so partial coverage never breaks the UI or shows a
// blank string.
//
// Translations below are machine-assisted, not reviewed by a native speaker of each
// language -- treat them the same way as this app's other "illustrative, not
// authoritative" data. If you spot a mistranslation, it's safe to just edit the value
// here directly.

// South Africa only: English and Afrikaans, its two most widely spoken official
// languages that this app has translation coverage for. This file used to also carry
// 20 other languages (Spanish, French, German, Japanese, Arabic, Swahili, and so on),
// added back when the app modeled 36 countries' tax systems (see data/countries.js) --
// dropped along with that dataset rather than kept around unused. isiZulu, isiXhosa,
// and South Africa's other official languages aren't covered yet; a real translation
// pass for those would need a native speaker, not a machine-assisted first draft like
// the ones this file already carries a caution about above.
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'af', label: 'Afrikaans', flag: '🇿🇦' }
];

export const translations = {
  en: {
    common: {
      yes: 'Yes',
      no: 'No',
      loading: 'Loading…'
    },
    header: {
      tagline: 'South African money planner · Tax Optimizer · AI Coach',
      currentPlan: 'Current Plan:',
      upgradePlan: '⭐ Upgrade Plan',
      language: 'Language'
    },
    nav: {
      groupFree: 'Free',
      groupPlanning: 'Planning',
      groupAI: 'AI & Analysis',
      startHere: 'Start Here',
      calculator: 'Calculator',
      dashboard: 'Dashboard',
      budget: 'Budget',
      emergencyFund: 'Emergency Fund',
      debtPayoff: 'Debt Payoff',
      loanBond: 'Loan & Bond',
      myPlan: 'My Plan',
      netWorth: 'Net Worth',
      snapshot: 'Snapshot',
      invest: 'Invest',
      taxOptimizer: 'Tax Optimizer',
      powerTools: 'Power Tools',
      compare: 'Compare',
      coach: 'Coach',
      monteCarlo: 'Monte Carlo',
      aiAdvisor: 'AI Advisor'
    },
    footer: {
      tagline: 'educational tool · indicative rates drift weekly · not financial advice',
      privacyTerms: 'Privacy & Terms',
      disclaimer: 'This is an educational tool only, not financial advice -- please seek advice from a reputable, qualified accountant or financial advisor before making financial decisions.'
    },
    startHere: {
      title: '👋 Start Here',
      subtitle: 'Three quick questions to find out what to focus on first -- in the order most financial guidance recommends.',
      q1: 'Do you have any high-interest debt (roughly 15%+ APR, e.g. credit cards)?',
      q2: 'Do you have 3-6 months of essential expenses saved for emergencies?',
      q3: 'Are you already investing toward a specific goal every month?',
      rec1Title: '🔥 Priority 1: Pay off high-interest debt',
      rec1Body: 'High-interest debt (credit cards, store cards, etc.) almost always costs more than any investment reliably earns. Clearing it first is usually the single best "return" available to you.',
      rec1Cta: 'Go to Debt Payoff',
      rec2Title: '🛟 Priority 1: Build your emergency fund',
      rec2Body: "Before investing, most guidance recommends 3-6 months of essential expenses in an easily accessible account, so a surprise bill or job loss doesn't force you to sell investments or go into debt.",
      rec2Cta: 'Go to Emergency Fund',
      rec3Title: '📈 Priority 1: Start investing toward a goal',
      rec3Body: 'With debt handled and a safety net in place, the next step is putting your money to work. Use the Invest tab to work out exactly how much you need to save monthly to hit a real target.',
      rec3Cta: 'Go to Invest',
      rec4Title: "✅ You've covered the basics",
      rec4Body: "No high-interest debt, a funded emergency cushion, and you're already investing regularly -- now it's about optimizing. Make sure you're using every tax-free wrapper available to you.",
      rec4Cta: 'Go to Tax Optimizer'
    },
    calculator: {
      title: 'Compound Interest Calculator',
      subtitle: 'Free, with South Africa\'s tax rules and TFSA (Tax-Free Savings Account) comparison included. No signup required.',
      country: 'Country',
      initialAmount: 'Initial Amount',
      monthlyContribution: 'Monthly Contribution',
      annualRate: 'Annual Rate (%)',
      yearsToGrow: 'Years to Grow',
      inflation: 'Inflation',
      compoundingFrequency: 'Compounding Frequency',
      annualContributionIncrease: 'Annual Contribution Increase',
      useWrapper: 'Use Tax-Free Wrapper',
      annually: 'Annually',
      semiAnnually: 'Semi-Annually',
      quarterly: 'Quarterly',
      monthly: 'Monthly',
      daily: 'Daily',
      oneOffContributions: 'One-Off Contributions',
      addOneOff: '+ Add a One-Off Contribution',
      projectedBalance: 'Projected Balance:',
      totalDeposits: 'Total Deposits:',
      compoundInterestEarned: 'Compound Interest Earned:',
      realValue: 'Real Value',
      todaysMoney: "(Today's money):",
      sharePlan: '🔗 Share This Plan',
      linkCopied: '✓ Link copied!',
      copySummary: '📋 Copy Summary',
      summaryCopied: '✓ Summary copied!',
      scenarioComparison: 'Scenario Comparison',
      saveScenario: '+ Save Current as Scenario',
      tableYear: 'Year',
      tableBalance: 'Balance',
      tableRealValue: 'Real Value',
      tableDeposits: 'Deposits',
      tableInterest: 'Interest',
      tableTaxPaid: 'Tax Paid'
    }
  },

  af: {
    common: { yes: 'Ja', no: 'Nee', loading: 'Laai…' },
    header: {
      tagline: 'Suid-Afrikaanse geldbeplanner · Belastingoptimeerder · KI-afrigter',
      currentPlan: 'Huidige Plan:',
      upgradePlan: '⭐ Gradeer Plan Op',
      language: 'Taal'
    },
    nav: {
      groupFree: 'Gratis',
      groupPlanning: 'Beplanning',
      groupAI: 'KI & Analise',
      startHere: 'Begin Hier',
      calculator: 'Sakrekenaar',
      dashboard: 'Paneelbord',
      budget: 'Begroting',
      emergencyFund: 'Noodfonds',
      debtPayoff: 'Skuldbetaling',
      loanBond: 'Lening & Verband',
      myPlan: 'My Plan',
      netWorth: 'Netto Waarde',
      snapshot: 'Kiekie',
      invest: 'Belê',
      taxOptimizer: 'Belastingoptimeerder',
      powerTools: 'Kragmiddele',
      compare: 'Vergelyk',
      coach: 'Afrigter',
      monteCarlo: 'Monte Carlo',
      aiAdvisor: 'KI-Adviseur'
    },
    footer: {
      tagline: 'opvoedkundige hulpmiddel · aanwyserkoerse wissel weekliks · nie finansiële advies nie',
      privacyTerms: 'Privaatheid & Voorwaardes',
      disclaimer: "Dit is slegs 'n opvoedkundige hulpmiddel, nie finansiële advies nie -- raadpleeg asseblief 'n betroubare, gekwalifiseerde rekenmeester of finansiële adviseur voordat u finansiële besluite neem."
    },
    startHere: {
      title: '👋 Begin Hier',
      subtitle: 'Drie vinnige vrae om uit te vind waarop om eerste te fokus -- in die volgorde wat die meeste finansiële raad aanbeveel.',
      q1: 'Het jy hoë-rente skuld (ongeveer 15%+ JKK, bv. kredietkaarte)?',
      q2: 'Het jy 3-6 maande se noodsaaklike uitgawes vir noodgevalle gespaar?',
      q3: 'Belê jy reeds elke maand na \'n spesifieke doelwit toe?',
      rec1Title: '🔥 Prioriteit 1: Betaal hoë-rente skuld af',
      rec1Body: 'Hoë-rente skuld (kredietkaarte, winkelkaarte, ens.) kos byna altyd meer as wat enige belegging betroubaar verdien. Om dit eerste te delg is gewoonlik die beste "opbrengs" beskikbaar aan jou.',
      rec1Cta: 'Gaan na Skuldbetaling',
      rec2Title: '🛟 Prioriteit 1: Bou jou noodfonds',
      rec2Body: 'Voor jy belê, beveel meeste raad 3-6 maande se noodsaaklike uitgawes in \'n maklik toeganklike rekening aan, sodat \'n onverwagte rekening of werksverlies jou nie dwing om beleggings te verkoop of skuld aan te gaan nie.',
      rec2Cta: 'Gaan na Noodfonds',
      rec3Title: '📈 Prioriteit 1: Begin belê na \'n doelwit toe',
      rec3Body: 'Met skuld hanteer en \'n veiligheidsnet in plek, is die volgende stap om jou geld te laat werk. Gebruik die Belê-blad om presies uit te werk hoeveel jy maandeliks moet spaar om \'n regte teiken te bereik.',
      rec3Cta: 'Gaan na Belê',
      rec4Title: '✅ Jy het die basiese beginsels gedek',
      rec4Body: 'Geen hoë-rente skuld nie, \'n gefinansierde noodkussing, en jy belê reeds gereeld -- nou gaan dit oor optimering. Maak seker jy gebruik elke belastingvrye omhulsel wat vir jou beskikbaar is.',
      rec4Cta: 'Gaan na Belastingoptimeerder'
    },
    calculator: {
      title: 'Saamgestelde Rentesakrekenaar',
      subtitle: 'Gratis, met Suid-Afrika se belastingreëls en BVS- (Belastingvrye Spaarrekening) vergelyking ingesluit. Geen registrasie nodig nie.',
      country: 'Land',
      initialAmount: 'Aanvangsbedrag',
      monthlyContribution: 'Maandelikse Bydrae',
      annualRate: 'Jaarlikse Koers (%)',
      yearsToGrow: 'Jare om te Groei',
      inflation: 'Inflasie',
      compoundingFrequency: 'Samestellingsfrekwensie',
      annualContributionIncrease: 'Jaarlikse Bydraeverhoging',
      useWrapper: 'Gebruik Belastingvrye Omhulsel',
      annually: 'Jaarliks',
      semiAnnually: 'Halfjaarliks',
      quarterly: 'Kwartaalliks',
      monthly: 'Maandeliks',
      daily: 'Daagliks',
      oneOffContributions: 'Eenmalige Bydraes',
      addOneOff: '+ Voeg Eenmalige Bydrae By',
      projectedBalance: 'Geprojekteerde Balans:',
      totalDeposits: 'Totale Deposito\'s:',
      compoundInterestEarned: 'Saamgestelde Rente Verdien:',
      realValue: 'Werklike Waarde',
      todaysMoney: '(Vandag se geld):',
      sharePlan: '🔗 Deel Hierdie Plan',
      linkCopied: '✓ Skakel gekopieer!',
      scenarioComparison: 'Scenario-vergelyking',
      saveScenario: '+ Stoor Huidige as Scenario',
      tableYear: 'Jaar',
      tableBalance: 'Balans',
      tableRealValue: 'Werklike Waarde',
      tableDeposits: 'Deposito\'s',
      tableInterest: 'Rente',
      tableTaxPaid: 'Belasting Betaal'
    }
  }
};
