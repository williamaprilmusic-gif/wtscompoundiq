// src/i18n/strings/tourLegal.js -- onboarding tour copy and the Privacy & Terms dialog chrome.
// The legal documents themselves (legalDocs.jsx) are deliberately left in English: they are
// legal text, so a machine translation could change their meaning.
export default [
  {
    ns: 'tour',
    en: {
      s1Title: 'Your toolkit',
      s1Body: 'Everything lives here -- free tools first, then Planning and AI-powered tools as you go Pro or Ultra. Click any tab to jump straight in.',
      s2Title: 'See what unlocks what',
      s2Body: 'A locked tab shows 🔒 until your plan covers it -- tap this anytime to compare Free, Pro and Ultra side by side.',
      s3Title: 'Your language',
      s3Body: 'Switch the app language here -- it stays visible from every tab, so you never need to hunt for it.',
      s4Title: 'Your data stays on your device',
      s4Body: "Your plans and everything you've entered are saved only on this device. The one exception is a paid subscription, where your email and plan are held for billing. Export a backup here before clearing browser data or switching devices, then import it to pick up where you left off.",
      aria: 'Tour step {n} of {total}: {title}',
      skip: 'Skip tour', back: 'Back', next: 'Next', done: 'Done'
    },
    af: {
      s1Title: 'Jou gereedskapskis',
      s1Body: 'Alles leef hier -- gratis gereedskap eerste, dan Beplanning en KI-aangedrewe gereedskap soos jy Pro of Ultra word. Klik enige blad om dadelik in te spring.',
      s2Title: 'Sien wat wat ontsluit',
      s2Body: '\'n Geslote blad wys 🔒 totdat jou plan dit dek -- tik hier enige tyd om Gratis, Pro en Ultra sy-aan-sy te vergelyk.',
      s3Title: 'Jou taal',
      s3Body: 'Verander die toepassing se taal hier -- dit bly sigbaar vanaf elke blad, so jy hoef dit nooit te soek nie.',
      s4Title: 'Jou data bly op jou toestel',
      s4Body: 'Jou planne en alles wat jy ingevoer het, word slegs op hierdie toestel gestoor. Die een uitsondering is \'n betaalde intekening, waar jou e-pos en plan vir fakturering gehou word. Voer hier \'n rugsteun uit voordat jy blaaierdata uitvee of toestelle wissel, en voer dit dan in om voort te gaan waar jy opgehou het.',
      aria: 'Toerstap {n} van {total}: {title}',
      skip: 'Slaan toer oor', back: 'Terug', next: 'Volgende', done: 'Klaar'
    },
    zu: {
      s1Title: 'Ibhokisi lakho lamathuluzi',
      s1Body: 'Konke kuhlala lapha -- amathuluzi amahhala kuqala, bese i-Planning namathuluzi anikwa amandla yi-AI uma uya ku-Pro noma Ultra. Chofoza noma yiliphi ithebhu ukungena ngokushesha.',
      s2Title: 'Bona ukuthi yini evula ini',
      s2Body: 'Ithebhu evaliwe ibonisa 🔒 kuze kube uhlelo lwakho lulimboze -- thinta lapha noma nini ukuqhathanisa i-Free, Pro ne-Ultra eduze komunye nomunye.',
      s3Title: 'Ulimi lwakho',
      s3Body: 'Shintsha ulimi lohlelo lapha -- lihlala libonakala kuwo wonke amathebhu, ngakho awudingi ukulifuna.',
      s4Title: 'Idatha yakho ihlala kudivayisi yakho',
      s4Body: 'Izinhlelo zakho nakho konke okufakile kugcinwa kuleli divayisi kuphela. Okuhlukile okukodwa ukubhalisa okukhokhelwayo, lapho i-imeyili yakho nohlelo kugcinelwa ukukhokhisa. Layisha isipele lapha ngaphambi kokusula idatha yesiphequluli noma ushintsha amadivayisi, bese ulingenisa ukuze uqhubeke lapho umile khona.',
      aria: 'Isinyathelo {n} sohambo kwezingu-{total}: {title}',
      skip: 'Yeqa uhambo', back: 'Emuva', next: 'Okulandelayo', done: 'Kuphelile'
    }
  },
  {
    ns: 'legal',
    en: {
      dialogAria: 'Legal documents',
      chooseAria: 'Choose a document',
      close: 'Close',
      effective: 'Effective {effective} · Last updated {updated}',
      englishOnly: 'The legal text below is provided in English only.'
    },
    af: {
      dialogAria: 'Regsdokumente',
      chooseAria: 'Kies \'n dokument',
      close: 'Maak toe',
      effective: 'Van krag vanaf {effective} · Laas opgedateer {updated}',
      englishOnly: 'Die regsteks hieronder word slegs in Engels verskaf.'
    },
    zu: {
      dialogAria: 'Amadokhumenti omthetho',
      chooseAria: 'Khetha idokhumenti',
      close: 'Vala',
      effective: 'Iqala ukusebenza {effective} · Ibuyekezwe okokugcina {updated}',
      englishOnly: 'Umbhalo womthetho ongezansi unikezwa ngesiNgisi kuphela.'
    }
  }
];
