// src/i18n/langs/index.js -- translations for the eight South African languages that don't have
// a hand-built per-component module (isiXhosa, Sepedi, Setswana, Sesotho, Xitsonga, siSwati,
// Tshivenda, isiNdebele). Each folder <code>/ holds one or more files that default-export a flat
// object of "ns.key.path": 'text' (or an array of strings for list values). translations.js
// merges them into the matching language. These are machine-assisted first drafts: they have
// not been reviewed by native speakers.
const found = import.meta.glob('./*/*.js', { eager: true });

const byLang = {};
for (const [path, mod] of Object.entries(found)) {
  const code = path.split('/')[1];
  byLang[code] = { ...(byLang[code] || {}), ...mod.default };
}

export default byLang;
