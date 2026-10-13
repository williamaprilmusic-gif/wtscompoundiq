import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { translations } from './translations';

// Guards the wiring between components and the translation tables: every static
// t('some.key') call must resolve in English/Afrikaans/isiZulu, must pass every
// {placeholder} the English string has, and af/zu must keep English's placeholders.

const get = (o, p) => p.split('.').reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), o);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
  .flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const placeholders = (s) => [...new Set((String(s).match(/\{(\w+)\}/g) || []).map(x => x.slice(1, -1)))].filter(x => x !== 'plural').sort();
const flat = (o, p = '') => Object.entries(o)
  .flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));

// Top-level property names of the object literal starting at the `{` at/after `start`.
const topLevelKeys = (src, start) => {
  const open = src.indexOf('{', start);
  const names = [];
  let depth = 0;
  let cur = '';
  for (let j = open; j < src.length; j++) {
    const c = src[j];
    if (c === '"' || c === "'") {
      let k = j + 1;
      while (k < src.length && src[k] !== c) { if (src[k] === '\\') k++; k++; }
      j = k; continue;
    }
    if (c === '`') {
      let k = j + 1; let d = 0;
      while (k < src.length && !(src[k] === '`' && d === 0)) {
        if (src[k] === '$' && src[k + 1] === '{') d++;
        else if (src[k] === '}' && d > 0) d--;
        k++;
      }
      j = k; continue;
    }
    if (c === '{' || c === '(' || c === '[') { depth++; if (depth === 1) { cur = ''; continue; } }
    else if (c === '}' || c === ')' || c === ']') {
      depth--;
      if (depth === 0) { if (cur.trim()) names.push(cur.trim().split(':')[0].trim()); break; }
    } else if (depth === 1 && c === ',') {
      if (cur.trim()) names.push(cur.trim().split(':')[0].trim());
      cur = ''; continue;
    }
    if (depth >= 1) cur += c;
  }
  return names.filter(Boolean);
};

describe('translation usage', () => {
  const files = walk('src').filter(f => /\.jsx?$/.test(f) && !/\.test\.|[\\/]i18n[\\/]/.test(f));

  it('every static t() key exists in English, Afrikaans and isiZulu', () => {
    const missing = [];
    for (const f of files) {
      const s = fs.readFileSync(f, 'utf8');
      for (const m of s.matchAll(/[^\w.]t\('([\w.]+)'/g)) {
        for (const l of ['en', 'af', 'zu']) if (get(translations[l], m[1]) === undefined) missing.push(`${l}:${m[1]} (${path.basename(f)})`);
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });

  it('every t() call passes the placeholders its English string uses', () => {
    const problems = [];
    for (const f of files) {
      const s = fs.readFileSync(f, 'utf8');
      for (const m of s.matchAll(/[^\w.]t\('([\w.]+)'(\s*,\s*\{)?/g)) {
        const en = get(translations.en, m[1]);
        if (typeof en !== 'string') continue;
        const given = m[2] ? topLevelKeys(s, m.index + m[0].length - 1) : [];
        const lacking = placeholders(en).filter(p => !given.includes(p));
        if (lacking.length) problems.push(`${m[1]} lacks ${lacking.join(',')} (${path.basename(f)})`);
      }
    }
    expect([...new Set(problems)]).toEqual([]);
  });

  it('af and zu keep the same {placeholders} as English', () => {
    const bad = [];
    for (const [k, v] of flat(translations.en)) {
      if (typeof v !== 'string') continue;
      for (const l of ['af', 'zu']) {
        const o = get(translations[l], k);
        if (typeof o === 'string' && placeholders(o).join() !== placeholders(v).join()) bad.push(`${l}:${k}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
