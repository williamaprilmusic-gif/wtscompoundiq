// src/data/countryNames.js -- display names for the 36 countries in Afrikaans and
// isiZulu, keyed by country code. Everything else (English, and the other languages)
// shows the English name from countries.js. Applied through countries.js's
// setCountryNameLanguage(), which LanguageContext calls whenever the language changes.
export const COUNTRY_NAMES = {
  af: {
    za: 'Suid-Afrika', us: 'Verenigde State', gb: 'Verenigde Koninkryk', au: 'Australië', ca: 'Kanada',
    de: 'Duitsland', fr: 'Frankryk', nl: 'Nederland', ie: 'Ierland', es: 'Spanje', it: 'Italië',
    ch: 'Switserland', se: 'Swede', no: 'Noorweë', dk: 'Denemarke', jp: 'Japan', cn: 'China',
    in: 'Indië', sg: 'Singapoer', hk: 'Hongkong', nz: 'Nieu-Seeland', br: 'Brasilië', mx: 'Meksiko',
    ae: 'Verenigde Arabiese Emirate', sa: 'Saoedi-Arabië', ng: 'Nigerië', ke: 'Kenia', eg: 'Egipte',
    kr: 'Suid-Korea', pl: 'Pole', tr: 'Turkye', ar: 'Argentinië', pk: 'Pakistan', gh: 'Ghana',
    vn: 'Viëtnam', id: 'Indonesië'
  },
  zu: {
    za: 'iNingizimu Afrika', us: 'i-United States', gb: 'i-United Kingdom', au: 'i-Australia', ca: 'i-Canada',
    de: 'i-Germany', fr: 'i-France', nl: 'i-Netherlands', ie: 'i-Ireland', es: 'i-Spain', it: 'i-Italy',
    ch: 'i-Switzerland', se: 'i-Sweden', no: 'i-Norway', dk: 'i-Denmark', jp: 'i-Japan', cn: 'i-China',
    in: 'i-India', sg: 'i-Singapore', hk: 'i-Hong Kong', nz: 'i-New Zealand', br: 'i-Brazil', mx: 'i-Mexico',
    ae: 'i-United Arab Emirates', sa: 'i-Saudi Arabia', ng: 'i-Nigeria', ke: 'i-Kenya', eg: 'i-Egypt',
    kr: 'i-South Korea', pl: 'i-Poland', tr: 'i-Turkey', ar: 'i-Argentina', pk: 'i-Pakistan', gh: 'i-Ghana',
    vn: 'i-Vietnam', id: 'i-Indonesia'
  }
};
