// src/utils/shareLink.js
// Encodes/decodes the Calculator tab's inputs to and from URL query params, so a plan
// can be shared as a link instead of only saved locally. Short keys keep the URL
// reasonably compact; every value is validated and clamped on the way back in, since
// a URL is untrusted input (hand-edited, or from an old/different app version).
import { uniqueId } from './uniqueId';

const PARAM_KEYS = {
  country: 'cc',
  initial: 'i',
  monthly: 'm',
  rate: 'r',
  years: 'y',
  inflation: 'inf',
  wrapper: 'w',
  compoundFrequency: 'cf',
  contributionIncrease: 'ci',
  lumpSums: 'ls'
};

const encodeLumpSums = (lumpSums) =>
  (lumpSums || [])
    .filter(l => l.amount > 0 && l.year > 0)
    .map(l => `${Math.round(l.year)}:${Math.round(l.amount)}`)
    .join(',');

// year/amount are clamped the same way every other share-param field is (see
// parseShareParams' own header note) -- a crafted `?ls=1:9e307` was previously only
// checked with Number.isFinite, which a huge-but-finite value like 9e307 still passes,
// letting an untrusted link hand the compounding engine an amount that pushes the
// running balance past Number.MAX_VALUE (engine.test.js's own "never returns a
// non-finite finalBalance" invariant). clampNumber is defined further down this file
// but already initialized by the time this runs, since decodeLumpSums is only ever
// called from parseShareParams() below, well after module evaluation completes.
const decodeLumpSums = (raw) => {
  if (!raw) return [];
  return raw.split(',').map((pair) => {
    const [year, amount] = pair.split(':').map(Number);
    return {
      id: uniqueId(),
      year: clampNumber(year, 1, { min: 1, max: 100, integer: true }),
      amount: clampNumber(amount, 0, { min: 0, max: 1e12 })
    };
  }).filter(l => l.amount > 0 && l.year > 0);
};

// Builds a full shareable URL from the current Calculator state (does not mutate
// history/location -- the caller copies this string, e.g. to the clipboard).
export const buildShareUrl = (state) => {
  const params = new URLSearchParams();
  params.set(PARAM_KEYS.country, state.country);
  params.set(PARAM_KEYS.initial, String(state.initial));
  params.set(PARAM_KEYS.monthly, String(state.monthly));
  params.set(PARAM_KEYS.rate, String(state.rate));
  params.set(PARAM_KEYS.years, String(state.years));
  params.set(PARAM_KEYS.inflation, String(state.inflation));
  params.set(PARAM_KEYS.wrapper, state.wrapper ? '1' : '0');
  params.set(PARAM_KEYS.compoundFrequency, String(state.compoundFrequency));
  params.set(PARAM_KEYS.contributionIncrease, String(state.contributionIncrease));
  const ls = encodeLumpSums(state.lumpSums);
  if (ls) params.set(PARAM_KEYS.lumpSums, ls);
  const url = new URL(window.location.href);
  url.search = params.toString();
  url.hash = '';
  return url.toString();
};

const clampNumber = (value, fallback, { min = -Infinity, max = Infinity, integer = false } = {}) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.min(max, Math.max(min, n));
  return integer ? Math.round(clamped) : clamped;
};

// Reads share params from the current URL (if any) and returns a partial Calculator
// state to seed the app with, or null if the URL carries no recognizable share params.
// Every numeric field is clamped to a sane range -- untrusted input from a link should
// never be able to hand the compounding engine a NaN, a negative year count, or a
// billion-year loop.
export const parseShareParams = () => {
  const params = new URLSearchParams(window.location.search);
  if (!params.has(PARAM_KEYS.initial) && !params.has(PARAM_KEYS.monthly) && !params.has(PARAM_KEYS.rate)) {
    return null; // no share link present -- caller should fall back to normal defaults
  }
  const validFrequencies = [1, 2, 4, 12, 365];
  const compoundFrequency = clampNumber(params.get(PARAM_KEYS.compoundFrequency), 12);

  return {
    countryCode: params.get(PARAM_KEYS.country) || null,
    initial: clampNumber(params.get(PARAM_KEYS.initial), 0, { min: 0, max: 1e12 }),
    monthly: clampNumber(params.get(PARAM_KEYS.monthly), 0, { min: 0, max: 1e10 }),
    rate: clampNumber(params.get(PARAM_KEYS.rate), 0, { min: -50, max: 100 }),
    years: clampNumber(params.get(PARAM_KEYS.years), 1, { min: 1, max: 100, integer: true }),
    inflation: clampNumber(params.get(PARAM_KEYS.inflation), 0, { min: -20, max: 100 }),
    wrapper: params.get(PARAM_KEYS.wrapper) === '1',
    compoundFrequency: validFrequencies.includes(compoundFrequency) ? compoundFrequency : 12,
    contributionIncrease: clampNumber(params.get(PARAM_KEYS.contributionIncrease), 0, { min: 0, max: 100 }),
    lumpSums: decodeLumpSums(params.get(PARAM_KEYS.lumpSums))
  };
};

// Strips share params from the visible URL after they've been applied, so the address
// bar doesn't keep showing a long query string once it's done its job (a plain
// history.replaceState -- no navigation, no reload).
export const clearShareParamsFromUrl = () => {
  const url = new URL(window.location.href);
  url.search = '';
  window.history.replaceState({}, '', url.toString());
};
