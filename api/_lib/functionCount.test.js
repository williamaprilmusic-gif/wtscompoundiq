// api/_lib/functionCount.test.js
// Vercel turns EVERY .js file under api/ into a serverless function unless its path has a
// segment starting with "_". The Hobby plan allows 12, and a deploy fails outright above that
// (a stray test file in api/ once did). Keep tests and helpers under api/_lib/.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.name.startsWith('_')) return [];
    return e.isDirectory() ? walk(p) : [p];
  });

describe('Vercel function budget', () => {
  const files = walk(path.resolve(__dirname, '..')).filter((f) => f.endsWith('.js'));

  it('has no more than 12 serverless functions (Hobby plan limit)', () => {
    expect(files.length).toBeLessThanOrEqual(12);
  });

  it('keeps test files out of the function set', () => {
    expect(files.filter((f) => /\.test\.js$/.test(f))).toEqual([]);
  });
});
