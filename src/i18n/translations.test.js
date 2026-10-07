import { describe, it, expect } from 'vitest';
import { translations, LANGUAGES } from './translations';

const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));

// {plural} is an English-only "s" suffix; other languages legitimately drop it.
const placeholders = (s) => (String(s).match(/\{[a-zA-Z]+\}/g) || []).filter(x => x !== '{plural}').sort().join();

const en = flat(translations.en);

describe('translations', () => {
  it('has a block for every listed language', () => {
    for (const { code } of LANGUAGES) expect(translations[code], code).toBeDefined();
  });

  for (const { code } of LANGUAGES.filter(l => l.code !== 'en')) {
    describe(code, () => {
      const own = Object.fromEntries(flat(translations[code]));

      it('translates every English key (no half-English screens)', () => {
        expect(en.map(([k]) => k).filter(k => !(k in own))).toEqual([]);
      });

      it('keeps the same {placeholders} as English', () => {
        const bad = en.filter(([k, v]) => k in own && placeholders(own[k]) !== placeholders(v)).map(([k]) => k);
        expect(bad).toEqual([]);
      });
    });
  }
});
