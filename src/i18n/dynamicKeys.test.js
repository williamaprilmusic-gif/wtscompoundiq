import { it, expect } from 'vitest';
import fs from 'fs';
import { translations } from './translations';
const get = (o, p) => p.split('.').reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), o);
it('dynamically built translation keys exist in en/af/zu', () => {
  const missing = [];
  const need = (k) => { for (const l of ['en', 'af', 'zu']) if (get(translations[l], k) === undefined) missing.push(`${l}:${k}`); };
  const faq = fs.readFileSync('src/components/FAQHelper.jsx', 'utf8');
  const block = faq.slice(faq.indexOf('const TOOL_TRANSLATION = ['), faq.indexOf('];', faq.indexOf('const TOOL_TRANSLATION = [')));
  for (const m of block.matchAll(/\['(\w+)', (?:'(\w+)'|null)/g)) { need(`pt.tab_${m[1]}`); if (m[2]) need(`pt.${m[2]}`); }
  const pt = fs.readFileSync('src/components/PowerTools.jsx', 'utf8');
  for (const m of pt.matchAll(/\{ key: '(\w+)', label:/g)) need(`pt.tab_${m[1]}`);
  for (const m of pt.matchAll(/\{ id: '(\w+)', label:/g)) need(`pt.group_${m[1]}`);
  for (const id of ['budget', 'starterEf', 'killDebt', 'fullEf', 'tfsa', 'retireFund', 'invest', 'fi']) for (const f of ['Title', 'What', 'Why']) need(`wp.${id}${f}`);
  for (const b of ['strong', 'ok', 'stretched', 'risky', 'none']) need(`coach.band_${b}`);
  for (const k of ['annual', 'semi', 'quarterly', 'monthly', 'daily']) need(`pt.freq_${k}`);
  for (const k of ['healthy', 'manageable', 'stretched', 'high']) need(`pt.dtiBand_${k}`);
  for (const g of ['A', 'B', 'C', 'D', 'F']) need(`dash.grade${g}`);
  for (const t of ['Basic', 'Pro', 'Ultra']) need(`pricing.tiers.${t}.features`);
  for (let n = 1; n <= 4; n++) { need(`tour.s${n}Title`); need(`tour.s${n}Body`); }
  expect(missing).toEqual([]);
});
