import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

const LANGS = ['en', 'af', 'zu'];
const makeStorage = (lang) => ({ getItem: (k) => (k === 'wts_compoundiq_language' ? lang : null), setItem() {}, removeItem() {} });

describe('i18n render smoke', () => {
  for (const lang of LANGS) {
    it(`renders in ${lang} without raw translation keys`, async () => {
      vi.resetModules();
      globalThis.localStorage = makeStorage(lang);
      globalThis.window = globalThis.window || { location: { search: '', pathname: '/' }, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) };
      globalThis.document = globalThis.document || { documentElement: {}, addEventListener() {}, removeEventListener() {}, querySelector: () => null };
      const { LanguageProvider } = await import('./LanguageContext.jsx');
      const { countriesData } = await import('../data/countries.js');
      const country = countriesData[0];
      const comps = {};
      for (const name of ['FAQHelper', 'TierPricing', 'WealthPath', 'Coach', 'PowerTools', 'Compare', 'MonteCarlo', 'RestorePlan', 'OnboardingTour', 'LegalModal']) {
        comps[name] = (await import(`../components/${name}.jsx`)).default;
      }
      const props = {
        country, initial: 10000, monthly: 1000, rate: 10, years: 20, inflation: 5, wrapper: false, compoundFrequency: 12,
        contributionIncrease: 0, lumpSums: [], currentTier: 'Pro', onUpgrade() {}, onClose() {}, canAccess: () => true,
        canUltra: true, onOpenPricing() {}, onNavigate() {}
      };
      const out = {};
      for (const [name, C] of Object.entries(comps)) {
        out[name] = renderToString(<LanguageProvider><C {...props} /></LanguageProvider>);
      }
      // a raw key looks like "pt.something" / "faq.q0" rendered as visible text
      const rawKey = />\s*((?:pt|faq|wp|coach|charts|plan|pricing|payment|tour|legal|ui|nw|tax|snap|loan|budget|invest|debt|restore|subtabs)\.[A-Za-z0-9_.]+)\s*</g;
      const leaks = [];
      for (const [name, html] of Object.entries(out)) for (const m of html.matchAll(rawKey)) leaks.push(`${name}: ${m[1]}`);
      expect(leaks).toEqual([]);
      if (lang !== 'en') {
        // a few strings that must not appear in English when another language is active
        expect(out.TierPricing).not.toContain('Choose Your Plan');
        expect(out.WealthPath).not.toContain('There&#x27;s a well-worn order');
        expect(out.FAQHelper).not.toContain('Ask the FAQ Assistant');
        expect(out.PowerTools).not.toContain('FIRE Number');
      }
    });
  }
});
