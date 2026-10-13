// src/i18n/strings/index.js -- per-component string modules. Each module in this folder
// default-exports { ns, en, af, zu }; translations.js merges them into those three
// languages (every other language falls back to English through t()). Picked up
// automatically -- just drop a new file in here.
const found = import.meta.glob('./*.js', { eager: true });

const modules = Object.entries(found)
  .filter(([path]) => !/\/(index|zuBase)\.js$/.test(path))
  .map(([, mod]) => mod.default)
  .flat();

export default modules;
