// src/i18n/strings/uiMore.js -- text for the parts of the smaller components that only exist
// on this branch. Default-exports an array of { ns, en, af, zu } modules (index.js flattens it).
export default [
  {
    ns: 'plan',
    en: {
      cmpIntro: 'Same South African tax rules -- three independently-editable plans, so you can see what changing the contribution, rate, timeframe, or wrapper actually does.',
      cmpMonthly: 'Monthly ({symbol})',
      cmpRate: 'Rate (%)', cmpYears: 'Years', cmpInflation: 'Inflation (%)',
      cmpEmpty: 'All three plans start at {symbol}0 -- this tab seeds itself from the Calculator tab\'s inputs the first time you open it, so if you haven\'t entered anything there yet, edit the fields below directly, or fill in the Calculator tab first and click "Sync with Calculator" on any plan.',
      cmpVerdict: 'If each plan runs exactly as entered, {winner} would come out ahead at {amount} — {gap} more than {runnerUp}, driven by whatever\'s different between the plans (contribution, rate, timeframe, or wrapper use).',
      cmpPlanN: 'Plan {n}',
      cmpOvertake: "⏱️ It starts behind: {winner} doesn't overtake {runnerUp} until",
      cmpYearN: 'year {n}',
      cmpOvertake2: 'Up to then the other plan is worth more — the lead above is the finish line, not the whole race.',
      cmpNever1: '⏱️ Across the years these two plans share, {runnerUp} stays ahead the whole way — {winner} only wins on its longer timeframe. Set both plans to the same number of years to compare like with like.',
      cmpExport: '⬇️ Export Year-by-Year CSV',
      cmpFootNote: "All three plans use South Africa's current tax rules and Calculator-tab compounding frequency/contribution growth settings -- only the fields shown above differ between them. Saved in your browser so they're still here next time.",
      baselineDebtOn: 'on pace to be debt-free in {n} months.',
      baselineDebtOff: 'not on track to clear within 50 years at that pace.',
      practiceBranding: '🏷️ Practice Branding', ultraBadge: 'Ultra',
      phFirm: 'Firm / practice name (shown on the plan and in print)',
      phTagline: 'Tagline or licence line (optional)',
      phPrepared: 'Prepared by (adviser name) — shows "Prepared by X on <today>"',
      phClient: 'Client name (optional) — adds "for [client]" to the line above',
      complianceTitle: '⚖️ Compliance Line',
      phCompliance: "Your firm's disclosure/compliance wording (e.g. FAIS / FSP licence details). Shown on the plan and always included when it's printed. Saved on this device only.",
      debtNoClear: "This plan doesn't clear the debt at the saved pace -- raise the extra monthly payment on the Debt Payoff tab before tracking progress here.",
      adviserNotes: '🗒️ Adviser Notes',
      phNotes: 'Context, assumptions, and recommendations to hand to a client with this plan. Saved on this device (not synced or uploaded).',
      notesUpsellBold: 'Adviser Notes',
      notesUpsell: "— attach context and recommendations to a client's plan. Included on Ultra."
    },
    af: {
      cmpIntro: 'Dieselfde Suid-Afrikaanse belastingreëls -- drie onafhanklik-wysigbare planne, sodat jy kan sien wat die verandering van die bydrae, koers, tydraamwerk of omhulsel werklik doen.',
      cmpMonthly: 'Maandeliks ({symbol})',
      cmpRate: 'Koers (%)', cmpYears: 'Jare', cmpInflation: 'Inflasie (%)',
      cmpEmpty: 'Al drie planne begin by {symbol}0 -- hierdie blad saai homself uit die Sakrekenaar-blad se invoere die eerste keer as jy dit oopmaak, so as jy nog niks daar ingevoer het nie, wysig die velde hieronder direk, of vul eers die Sakrekenaar-blad in en klik "Sinkroniseer met Sakrekenaar" op enige plan.',
      cmpVerdict: 'As elke plan presies soos ingevoer loop, sal {winner} voorlê by {amount} — {gap} meer as {runnerUp}, gedryf deur wat ook al verskil tussen die planne (bydrae, koers, tydraamwerk of omhulselgebruik).',
      cmpPlanN: 'Plan {n}',
      cmpOvertake: '⏱️ Dit begin agter: {winner} haal nie {runnerUp} in tot',
      cmpYearN: 'jaar {n}',
      cmpOvertake2: 'Tot dan is die ander plan meer werd — die voorsprong hierbo is die wenstreep, nie die hele wedloop nie.',
      cmpNever1: '⏱️ Oor die jare wat hierdie twee planne deel, bly {runnerUp} heeltyd voor — {winner} wen net op sy langer tydraamwerk. Stel albei planne op dieselfde aantal jare om appels met appels te vergelyk.',
      cmpExport: '⬇️ Voer Jaar-vir-Jaar CSV Uit',
      cmpFootNote: 'Al drie planne gebruik Suid-Afrika se huidige belastingreëls en die Sakrekenaar-blad se samestellingsfrekwensie/bydraegroei-instellings -- slegs die velde hierbo verskil tussen hulle. In jou blaaier gestoor sodat hulle volgende keer nog hier is.',
      baselineDebtOn: 'op koers om oor {n} maande skuldvry te wees.',
      baselineDebtOff: 'nie op koers om binne 50 jaar teen daardie tempo te delg nie.',
      practiceBranding: '🏷️ Praktykhandelsmerk', ultraBadge: 'Ultra',
      phFirm: 'Firma-/praktyknaam (word op die plan en in druk getoon)',
      phTagline: 'Leuse of lisensielyn (opsioneel)',
      phPrepared: 'Opgestel deur (adviseur se naam) — wys "Opgestel deur X op <vandag>"',
      phClient: 'Kliëntnaam (opsioneel) — voeg "vir [kliënt]" by die lyn hierbo',
      complianceTitle: '⚖️ Nakomingslyn',
      phCompliance: 'Jou firma se openbaarmakings-/nakomingswoordkeuse (bv. FAIS / FSP-lisensiebesonderhede). Word op die plan getoon en altyd ingesluit wanneer dit gedruk word. Slegs op hierdie toestel gestoor.',
      debtNoClear: 'Hierdie plan delg nie die skuld teen die gestoorde tempo nie -- verhoog die ekstra maandelikse betaling op die Skuldaflossing-blad voordat jy hier vordering volg.',
      adviserNotes: '🗒️ Adviseursnotas',
      phNotes: '\'n Konteks, aannames en aanbevelings om saam met hierdie plan aan \'n kliënt te gee. Op hierdie toestel gestoor (nie gesinkroniseer of opgelaai nie).',
      notesUpsellBold: 'Adviseursnotas',
      notesUpsell: '— heg konteks en aanbevelings aan \'n kliënt se plan. Ingesluit by Ultra.'
    },
    zu: {
      cmpIntro: 'Imithetho yentela efanayo yaseNingizimu Afrika -- izinhlelo ezintathu ezihlelekayo ngokuzimela, ukuze ubone ukuthi ukushintsha umnikelo, izinga, isikhathi noma i-akhawunti kwenza ini ngempela.',
      cmpMonthly: 'Ngenyanga ({symbol})',
      cmpRate: 'Izinga (%)', cmpYears: 'Iminyaka', cmpInflation: 'Ukwenyuka kwamanani (%)',
      cmpEmpty: 'Zontathu izinhlelo ziqala ku-{symbol}0 -- leli thebhu lizifaka ngokwalo kokufakiwe kwethebhu le-Calculator ngesikhathi sokuqala ulivula, ngakho uma ungakafaki lutho lapho, hlela izinkambu ngezansi ngqo, noma qala ugcwalise ithebhu le-Calculator bese uchofoza "Vumelanisa ne-Calculator" kunoma yiluphi uhlelo.',
      cmpVerdict: 'Uma uhlelo ngalunye lusebenza ngqo njengoba lufakiwe, {winner} lwalungaphambili ku-{amount} — {gap} ngaphezu kwe-{runnerUp}, kuqhutshwa yinoma yini ehlukile phakathi kwezinhlelo (umnikelo, izinga, isikhathi noma ukusetshenziswa kwe-akhawunti).',
      cmpPlanN: 'Uhlelo {n}',
      cmpOvertake: '⏱️ Luqala lungemuva: {winner} aluludluli {runnerUp} kuze kube',
      cmpYearN: 'unyaka {n}',
      cmpOvertake2: 'Kuze kube yilapho, olunye uhlelo lubaluleke kakhulu — ukuhola ngenhla kuyisiphetho, hhayi yonke impi.',
      cmpNever1: '⏱️ Eminyakeni lezi zinhlelo ezimbili ezihlanganyela ngayo, {runnerUp} luhlala phambili yonke indlela — {winner} luwina kuphela ngesikhathi saso eside. Setha zombili izinhlelo ezinyakeni ezifanayo ukuze uqhathanise ngokulinganayo.',
      cmpExport: '⬇️ Layisha i-CSV Yonyaka Nonyaka',
      cmpFootNote: 'Zontathu izinhlelo zisebenzisa imithetho yentela yamanje yaseNingizimu Afrika kanye nezilungiselelo zesivinini sokuhlanganisa/ukukhula komnikelo zethebhu le-Calculator -- izinkambu ezibonisiwe ngenhla kuphela ezihlukene phakathi kwazo. Zigcinwe esiphequluli sakho ukuze zisekhona ngesikhathi esilandelayo.',
      baselineDebtOn: 'luhambile ukuze lungabi nasikweletu ezinyangeni ezingu-{n}.',
      baselineDebtOff: 'alukho ohlelweni lokuqeda ngaphakathi kweminyaka engu-50 ngalelo zinga.',
      practiceBranding: '🏷️ Uphawu Lomsebenzi', ultraBadge: 'Ultra',
      phFirm: 'Igama lenkampani / lomsebenzi (liboniswa kuhlelo nasekuphrintweni)',
      phTagline: 'Umushwana noma umugqa welayisense (ukukhetha)',
      phPrepared: 'Kulungiswe ngu (igama lomluleki) — kubonisa "Kulungiswe ngu-X ngo-<namuhla>"',
      phClient: 'Igama lekhasimende (ukukhetha) — kwengeza "ka-[ikhasimende]" emugqeni ongenhla',
      complianceTitle: '⚖️ Umugqa Wokuthobela Umthetho',
      phCompliance: 'Amagama enkampani yakho okuembula/okuthobela umthetho (isb. imininingwane yelayisense ye-FAIS / FSP). Aboniswa kuhlelo futhi ahlala ephrintiwe. Agcinwe kuleli divayisi kuphela.',
      debtNoClear: 'Lolu hlelo aluqedi isikweletu ngesivinini esigciniwe -- khulisa inkokhelo eyengeziwe yenyanga ethebhini le-Debt Payoff ngaphambi kokulandelela inqubekela phambili lapha.',
      adviserNotes: '🗒️ Amanothi Omluleki',
      phNotes: 'Umongo, ukucabanga nezincomo ozinikeza ikhasimende kanye nalolu hlelo. Kugcinwe kuleli divayisi (akuvumelanisiwe noma akulayishiwe).',
      notesUpsellBold: 'Amanothi Omluleki',
      notesUpsell: '— namathisela umongo nezincomo kuhlelo lwekhasimende. Kufakiwe ku-Ultra.'
    }
  },
  {
    ns: 'nw',
    en: {
      concentration: 'Your biggest asset class, {label}, is {pct}% of your total assets.',
      concentratedYes: " That's a concentrated position — a hit to that one category moves most of your net worth.",
      concentratedNo: ' Reasonably spread across categories.',
      growthGrown: 'Net worth has grown at about {rate}%/yr over {years} years ({change} in total).',
      growthShrunk: 'Net worth has shrunk at about {rate}%/yr over {years} years ({change} in total).',
      growthTotal: '{change} in total across your snapshots — {reason}',
      reasonShort: 'too little time between them to annualise a rate yet.',
      reasonNonpositive: 'net worth is now zero or negative, so an annualised rate has no meaning.',
      reasonStart: 'an annualised rate needs a positive starting net worth.'
    },
    af: {
      concentration: 'Jou grootste batekategorie, {label}, is {pct}% van jou totale bates.',
      concentratedYes: ' Dis \'n gekonsentreerde posisie — \'n slag op daardie een kategorie verskuif die meeste van jou netto waarde.',
      concentratedNo: ' Redelik versprei oor kategorieë.',
      growthGrown: 'Netto waarde het teen ongeveer {rate}%/jr oor {years} jaar gegroei ({change} in totaal).',
      growthShrunk: 'Netto waarde het teen ongeveer {rate}%/jr oor {years} jaar gekrimp ({change} in totaal).',
      growthTotal: '{change} in totaal oor jou kiekies — {reason}',
      reasonShort: 'te min tyd tussen hulle om \'n koers nog te jaarliks.',
      reasonNonpositive: 'netto waarde is nou nul of negatief, so \'n jaarlikse koers het geen betekenis nie.',
      reasonStart: '\'n jaarlikse koers vereis \'n positiewe begin-netto-waarde.'
    },
    zu: {
      concentration: 'Isigaba sakho semali esikhulu kunazo zonke, {label}, singu-{pct}% wempahla yakho yonke.',
      concentratedYes: ' Lokho kuyisimo esigxile — ukushayeka kwalesi sigaba esisodwa kuhambisa iningi lenani lakho eliphelele.',
      concentratedNo: ' Kusabalale kahle ezigabeni.',
      growthGrown: 'Inani eliphelele likhule ngo-{rate}%/ngonyaka cishe eminyakeni engu-{years} ({change} sekukonke).',
      growthShrunk: 'Inani eliphelele lehle ngo-{rate}%/ngonyaka cishe eminyakeni engu-{years} ({change} sekukonke).',
      growthTotal: '{change} sekukonke kuzo zonke izithombe zakho — {reason}',
      reasonShort: 'isikhathi esincane kakhulu phakathi kwazo ukuze kubalwe izinga lonyaka.',
      reasonNonpositive: 'inani eliphelele manje lingu-zero noma likhona okubi, ngakho izinga lonyaka alinamqondo.',
      reasonStart: 'izinga lonyaka lidinga inani eliphelele lokuqala eliyiphozithivu.'
    }
  },
  {
    ns: 'backup',
    en: {
      emUnconfigured: 'Emailing a backup isn\'t switched on for this app yet — use "Save to Device" instead.',
      emBad: "That doesn't look like a valid email address.",
      emTooLarge: 'Your saved data is unexpectedly large to email — use "Save to Device" instead.',
      emRate: "You've requested a few of these recently. Wait a little while and try again.",
      emError: 'Couldn\'t send it just now. Try again in a moment, or use "Save to Device".',
      emailAria: 'Email address to send the backup to',
      emailSent: 'Sent — check your inbox for a .json file you can Import on any device.',
      emailNote: 'The file travels through a third-party email service and lands in your mailbox unencrypted — only send it to an address you control. Nothing is stored on our side.',
      saveDevice: '⬇️ Save to Device',
      sending: 'Sending…', send: 'Send',
      noBackup: "You haven't exported a backup yet in this browser -- clearing browser data without one loses everything above."
    },
    af: {
      emUnconfigured: 'Om \'n rugsteun te e-pos is nog nie vir hierdie toepassing aangeskakel nie — gebruik eerder "Stoor na Toestel".',
      emBad: 'Dit lyk nie soos \'n geldige e-posadres nie.',
      emTooLarge: 'Jou gestoorde data is onverwags groot om te e-pos — gebruik eerder "Stoor na Toestel".',
      emRate: 'Jy het onlangs \'n paar hiervan versoek. Wag \'n rukkie en probeer weer.',
      emError: 'Kon dit nou nie stuur nie. Probeer weer oor \'n oomblik, of gebruik "Stoor na Toestel".',
      emailAria: 'E-posadres om die rugsteun heen te stuur',
      emailSent: 'Gestuur — kyk in jou inkassie vir \'n .json-lêer wat jy op enige toestel kan Invoer.',
      emailNote: 'Die lêer reis deur \'n derdeparty-e-posdiens en land ongeënkripteer in jou posbus — stuur dit net na \'n adres wat jy beheer. Niks word aan ons kant gestoor nie.',
      saveDevice: '⬇️ Stoor na Toestel',
      sending: 'Stuur…', send: 'Stuur',
      noBackup: 'Jy het nog nie \'n rugsteun in hierdie blaaier uitgevoer nie -- om blaaierdata uit te vee sonder een, verloor alles hierbo.'
    },
    zu: {
      emUnconfigured: 'Ukuthumela isipele nge-imeyili akukavulwa kulolu hlelo -- sebenzisa "Gcina Kudivayisi" esikhundleni.',
      emBad: 'Lokhu akubukeki njengekheli le-imeyili elivumelekile.',
      emTooLarge: 'Idatha yakho egciniwe inkulu ngokungalindelekile ukuthumela nge-imeyili -- sebenzisa "Gcina Kudivayisi" esikhundleni.',
      emRate: 'Usucele ezimbalwa zalokhu muva nje. Linda isikhashana bese uzama futhi.',
      emError: 'Ayikwazanga ukuthunyelwa manje. Zama futhi ngemuva kwesikhashana, noma usebenzise "Gcina Kudivayisi".',
      emailAria: 'Ikheli le-imeyili lokuthumela isipele kulo',
      emailSent: 'Kuthunyelwe -- hlola ebhokisini lakho lokungena ifayela le-.json ongalingenisa kunoma yiliphi idivayisi.',
      emailNote: 'Ifayela lihamba ngenkonzo ye-imeyili yenhlangano yesithathu futhi lifika ebhokisini lakho lingafihlwanga -- lithumele kuphela ekhelini olilawulayo. Akukho okugcinwa ohlangothini lwethu.',
      saveDevice: '⬇️ Gcina Kudivayisi',
      sending: 'Iyathumela…', send: 'Thumela',
      noBackup: 'Awukalayishi isipele kulesi siphequluli -- ukususa idatha yesiphequluli ngaphandle kwayo kulahlekelwa yikho konke okungenhla.'
    }
  },
  {
    ns: 'tax',
    en: {
      roomLeft: '{amount} of room left{more}. Withdrawals don\'t give the room back.',
      roomMore: ' — about {years} more years at the full {limit}/year',
      lifetimeUsed: "You've used your entire lifetime allowance — further contributions to this wrapper would be taxed like a normal account.",
      lossLine1: 'Offsetting a',
      lossLine2: 'loss against a gain saves about',
      lossLine3: 'in tax -- the loss reduces your taxable capital gain by {offset} (SA\'s 40% individual inclusion rate), taxed away at your {rate}% marginal rate. Only real if there\'s an actual gain to offset it against -- a loss with nothing to offset just carries forward.'
    },
    af: {
      roomLeft: '{amount} ruimte oor{more}. Onttrekkings gee nie die ruimte terug nie.',
      roomMore: ' — ongeveer {years} meer jaar teen die volle {limit}/jaar',
      lifetimeUsed: 'Jy het jou hele leeftydtoelae gebruik — verdere bydraes tot hierdie omhulsel sal soos \'n gewone rekening belas word.',
      lossLine1: 'Om \'n',
      lossLine2: 'verlies teen \'n wins te vereffen, spaar ongeveer',
      lossLine3: 'belasting -- die verlies verminder jou belasbare kapitaalwins met {offset} (SA se 40% individuele insluitingskoers), weggebelas teen jou {rate}% randkoers. Slegs werklik as daar \'n werklike wins is om dit teen te vereffen -- \'n verlies met niks om te vereffen nie, word net oorgedra.'
    },
    zu: {
      roomLeft: '{amount} yendawo esele{more}. Ukukhipha akubuyiseli indawo.',
      roomMore: ' — cishe iminyaka engu-{years} eyengeziwe ku-{limit}/ngonyaka ogcwele',
      lifetimeUsed: 'Usebenzise yonke imvume yakho yempilo yonke — iminikelo eyengeziwe kule-akhawunti izokhokhiswa intela njenge-akhawunti evamile.',
      lossLine1: 'Ukulinganisa',
      lossLine2: 'ukulahlekelwa nenzuzo kongela cishe',
      lossLine3: 'entelweni -- ukulahlekelwa kunciphisa inzuzo yakho yenhlokomali enentela nge-{offset} (izinga lokufakwa lomuntu ngamunye le-40% laseNingizimu Afrika), likhokhwe ngezinga lakho le-{rate}%. Kuyiqiniso kuphela uma kunenzuzo yangempela yokulinganisa -- ukulahlekelwa okungenalutho lokulinganisa kudluliselwa phambili kuphela.'
    }
  },
  {
    ns: 'snap',
    en: {
      brandingDesc: "Ultra feature -- add your firm's details below and they'll appear on the report header instead of WTS CompoundIQ's own, ready to hand to a client.",
      contactLabel: 'Contact Info (for the report footer)',
      phContact: 'e.g. 011 123 4567 · jane@acmefinancial.co.za',
      fspLabel: 'FSP Number (FAIS licence)',
      phFsp: 'e.g. FSP 12345',
      upsellRest: "-- add your firm's name, logo, and client details to the header instead of WTS CompoundIQ's own. Included on Ultra.",
      debtOnPace: 'on pace to be debt-free in {n} months.',
      debtOffPace: 'not clearing within 50 years at that pace.',
      complianceHint: "Add a firm compliance/disclosure line (e.g. FAIS / FSP details) in the My Plan tab's Practice Branding section -- it'll appear on this report too."
    },
    af: {
      brandingDesc: 'Ultra-kenmerk -- voeg jou firma se besonderhede hieronder by en hulle sal op die verslagopskrif verskyn in plaas van WTS CompoundIQ se eie, gereed om aan \'n kliënt te gee.',
      contactLabel: 'Kontakbesonderhede (vir die verslagvoetskrif)',
      phContact: 'bv. 011 123 4567 · jane@acmefinancial.co.za',
      fspLabel: 'FSP-nommer (FAIS-lisensie)',
      phFsp: 'bv. FSP 12345',
      upsellRest: '-- voeg jou firma se naam, logo en kliëntbesonderhede by die opskrif in plaas van WTS CompoundIQ se eie. Ingesluit by Ultra.',
      debtOnPace: 'op koers om oor {n} maande skuldvry te wees.',
      debtOffPace: 'delg nie binne 50 jaar teen daardie tempo nie.',
      complianceHint: 'Voeg \'n firma-nakomings-/openbaarmakingslyn (bv. FAIS / FSP-besonderhede) by in die My Plan-blad se Praktykhandelsmerk-afdeling -- dit sal ook op hierdie verslag verskyn.'
    },
    zu: {
      brandingDesc: 'Isici se-Ultra -- engeza imininingwane yenkampani yakho ngezansi futhi izovela ekhanda lombiko esikhundleni sezakwa-WTS CompoundIQ, isilungele ukunikezwa ikhasimende.',
      contactLabel: 'Imininingwane Yokuxhumana (yengxenye engezansi yombiko)',
      phContact: 'isb. 011 123 4567 · jane@acmefinancial.co.za',
      fspLabel: 'Inombolo ye-FSP (ilayisense ye-FAIS)',
      phFsp: 'isb. FSP 12345',
      upsellRest: '-- engeza igama lenkampani yakho, ilogo, nemininingwane yekhasimende ekhanda esikhundleni sezakwa-WTS CompoundIQ. Kufakiwe ku-Ultra.',
      debtOnPace: 'luhambile ukuze lungabi nasikweletu ezinyangeni ezingu-{n}.',
      debtOffPace: 'alukhishi ngaphakathi kweminyaka engu-50 ngalelo zinga.',
      complianceHint: 'Engeza umugqa wokuthobela umthetho/wokuembula wenkampani (isb. imininingwane ye-FAIS / FSP) esigabeni se-Practice Branding sethebhu le-My Plan -- uzovela nakulo mbiko.'
    }
  },
  {
    ns: 'loan',
    en: {
      primePlus: 'My rate is quoted as "prime + %" (common for SA bonds and vehicle finance)',
      extraCallout1: 'Paying an extra {amount}/month clears this {type} in',
      extraCallout2: 'instead of {was}',
      around: 'around {date}',
      extraCallout3: 'saving',
      extraCallout4: 'in interest and {years} years {months} months off the term.',
      biweeklyA: '💡 Switching to bi-weekly payments (half your {payment} instalment, paid every 2 weeks instead of once a month) works out to one extra payment a year. That alone would clear this {type} in',
      biweeklyB: 'instead of {was}',
      homeLoans: 'SA home loans', vehicleFinance: 'Most SA vehicle finance',
      shockNote: 'track the prime rate, so the instalment changes each time the Reserve Bank does. This shows the new payment at {rate}% ± a few points, same principal and term.'
    },
    af: {
      primePlus: 'My koers word as "prima + %" aangehaal (algemeen vir SA verbande en voertuigfinansiering)',
      extraCallout1: 'Om ekstra {amount}/maand te betaal, delg hierdie {type} oor',
      extraCallout2: 'in plaas van {was}',
      around: 'rondom {date}',
      extraCallout3: 'wat',
      extraCallout4: 'aan rente bespaar en {years} jaar {months} maande van die termyn afhaal.',
      biweeklyA: '💡 Om oor te skakel na tweeweeklikse betalings (die helfte van jou {payment}-paaiement, elke 2 weke betaal in plaas van een keer \'n maand) kom neer op een ekstra betaling per jaar. Dit alleen sal hierdie {type} delg oor',
      biweeklyB: 'in plaas van {was}',
      homeLoans: 'SA huisverbande', vehicleFinance: 'Die meeste SA voertuigfinansiering',
      shockNote: 'volg die primakoers, so die paaiement verander elke keer as die Reserwebank dit doen. Dit wys die nuwe betaling teen {rate}% ± \'n paar punte, dieselfde kapitaal en termyn.'
    },
    zu: {
      primePlus: 'Izinga lami lisho ngokuthi "prime + %" (kuvamile kumabhondi aseNingizimu Afrika nasekuxhaseni izimoto)',
      extraCallout1: 'Ukukhokha i-{amount}/inyanga eyengeziwe kuqeda i-{type} ku-',
      extraCallout2: 'esikhundleni se-{was}',
      around: 'cishe {date}',
      extraCallout3: 'konga',
      extraCallout4: 'enzalweni futhi kususa iminyaka engu-{years} nezinyanga ezingu-{months} esikhathini.',
      biweeklyA: '💡 Ukushintshela ekukhokheni njalo emasontweni amabili (ingxenye yenkokhelo yakho ye-{payment}, ekhokhwa njalo emasontweni amabili esikhundleni sokukhokha kanye ngenyanga) kuphumela ekukhokheni okukodwa okwengeziwe ngonyaka. Lokho kuphela kuzoqeda i-{type} ku-',
      biweeklyB: 'esikhundleni se-{was}',
      homeLoans: 'amabhondi ezindlu aseNingizimu Afrika', vehicleFinance: 'Iningi lokuxhaswa kwezimoto eNingizimu Afrika',
      shockNote: 'lilandela izinga le-prime, ngakho inkokhelo ishintsha njalo uma i-Reserve Bank ishintsha. Lokhu kubonisa inkokhelo entsha ku-{rate}% ± amaphuzu ambalwa, inhlokomali nesikhathi esifanayo.'
    }
  },
  {
    ns: 'budget',
    en: {
      note: "Saved only in your browser's local storage -- nothing is sent anywhere. Update the line items as your budget changes, then log a snapshot each month to track your surplus trend over time, the same way Net Worth, Debt Payoff, and Emergency Fund do.",
      confirmClear: "Clear all saved budget snapshots? This can't be undone.",
      surplusSeries: 'Monthly Surplus'
    },
    af: {
      note: 'Slegs in jou blaaier se plaaslike berging gestoor -- niks word êrens heen gestuur nie. Werk die lynitems op soos jou begroting verander, en teken dan elke maand \'n kiekie aan om jou oorskotneiging oor tyd te volg, op dieselfde manier as Netto Waarde, Skuldaflossing en Noodfonds.',
      confirmClear: 'Vee alle gestoorde begrotingskiekies uit? Dit kan nie ongedaan gemaak word nie.',
      surplusSeries: 'Maandelikse Surplus'
    },
    zu: {
      note: 'Kugcinwe kuphela esikhaleni sokugcina sasekhaya sesiphequluli sakho -- akukho okuthunyelwa noma kuphi. Buyekeza izinto zomugqa njengoba isabelomali sakho sishintsha, bese ubhala isithombe inyanga ngayinye ukulandelela inkambo yokusele ngokuhamba kwesikhathi, njengoba kwenza i-Net Worth, i-Debt Payoff ne-Emergency Fund.',
      confirmClear: 'Sula zonke izithombe zesabelomali ezigciniwe? Lokhu akunakuhlehliswa.',
      surplusSeries: 'Okusele Ngenyanga'
    }
  },
  {
    ns: 'invest',
    en: {
      covered: "✅ Covered by your Budget: your saved Budget plan shows a {surplus}/month surplus -- enough for the {need}/month {these} need, with {left}/month left over.",
      noSurplus: "⚠️ Your saved Budget plan shows no surplus right now, but these goals need {need}/month -- revisit the Budget tab, or these contributions aren't coming from spare cash flow.",
      short: '⚠️ Short by {gap}/month: {these} need {need}/month, but your saved Budget plan only shows a {surplus}/month surplus.',
      theseGoal: 'this goal', theseGoals: 'these goals'
    },
    af: {
      covered: '✅ Gedek deur jou Begroting: jou gestoorde Begrotingsplan toon \'n oorskot van {surplus}/maand -- genoeg vir die {need}/maand wat {these} nodig het, met {left}/maand oor.',
      noSurplus: '⚠️ Jou gestoorde Begrotingsplan toon tans geen oorskot nie, maar hierdie doelwitte het {need}/maand nodig -- besoek die Begroting-blad weer, of hierdie bydraes kom nie uit spaar kontantvloei nie.',
      short: '⚠️ Tekort van {gap}/maand: {these} het {need}/maand nodig, maar jou gestoorde Begrotingsplan toon net \'n oorskot van {surplus}/maand.',
      theseGoal: 'hierdie doelwit', theseGoals: 'hierdie doelwitte'
    },
    zu: {
      covered: '✅ Kuvalwe yisabelomali sakho: uhlelo lwakho lwe-Budget olugciniwe lubonisa okusele kwe-{surplus}/inyanga -- kwanele i-{need}/inyanga edingwa yi-{these}, kusele i-{left}/inyanga.',
      noSurplus: '⚠️ Uhlelo lwakho lwe-Budget olugciniwe alubonisi okusele okwamanje, kodwa lezi zinhloso zidinga i-{need}/inyanga -- buyela ethebhini le-Budget, noma leyo minikelo ayivela ekugelezeni kwemali eyengeziwe.',
      short: '⚠️ Kuswele i-{gap}/inyanga: {these} idinga i-{need}/inyanga, kodwa uhlelo lwakho lwe-Budget olugciniwe lubonisa okusele kwe-{surplus}/inyanga kuphela.',
      theseGoal: 'le nhloso', theseGoals: 'lezi zinhloso'
    }
  },
  {
    ns: 'debt',
    en: {
      verdict1: '💸 The Avalanche plan repays {total} in total to clear {balance} of debt — that means',
      verdict2: '{pct}% of what you pay from here is interest',
      verdict3: ', not the amount you actually borrowed. Every extra rand aimed at the highest-rate debt drops that share.'
    },
    af: {
      verdict1: '💸 Die Lawine-plan betaal {total} in totaal terug om {balance} se skuld te delg — dit beteken',
      verdict2: '{pct}% van wat jy van hier af betaal is rente',
      verdict3: ', nie die bedrag wat jy werklik geleen het nie. Elke ekstra rand wat op die hoogste-koers-skuld gerig word, verlaag daardie aandeel.'
    },
    zu: {
      verdict1: '💸 Uhlelo lwe-Avalanche lubuyisela i-{total} sekukonke ukuqeda i-{balance} yesikweletu — lokho kusho',
      verdict2: 'i-{pct}% yalokho okukhokhayo kusukela lapha yinzalo',
      verdict3: ', hhayi inani obolekile ngempela. Irandi ngalinye elengeziwe eliqondiswe esikweletwini esinezinga eliphezulu lehlisa leyo ngxenye.'
    }
  },
  {
    ns: 'ui',
    en: {
      paymentPending: 'Your payment is still being confirmed by PayFast. Your plan unlocks automatically the next time you open the app — no need to pay again.',
      nowBasic: "You're now on the free Basic plan.",
      nowTier: "You're now on {tier} — premium features unlocked.",
      cancelledUntil: "Subscription cancelled — you won't be charged again, and you keep {tier} until {date}.",
      cancelled: "Subscription cancelled — you won't be charged again.",
      cancelFailed: "We couldn't cancel just now. Please try again in a moment, or cancel from your PayFast account.",
      dismiss: 'Dismiss',
      summaryTitle: 'WTS CompoundIQ -- {country}',
      summaryInputs: 'Initial: {initial} | Monthly: {monthly} | Rate: {rate}%/yr | Years: {years}',
      summaryBalance: 'Projected Balance: {v}',
      summaryDeposits: 'Total Deposits: {v}',
      summaryInterest: 'Compound Interest Earned: {v}',
      summaryReal: "Real Value (today's money): {v}",
      copySummary: 'Copy this summary:',
      allocNote: '{pct}% of this is in {label} -- worth thinking about whether that\'s concentrated more than you\'d like.',
      installApp: '📲 Install app',
      iosPre: '— tap the', iosMid: 'icon, then',
      iosShare: 'Share', iosAdd: 'Add to Home Screen'
    },
    af: {
      paymentPending: 'Jou betaling word nog deur PayFast bevestig. Jou plan ontsluit outomaties die volgende keer as jy die toepassing oopmaak — jy hoef nie weer te betaal nie.',
      nowBasic: 'Jy is nou op die gratis Basiese plan.',
      nowTier: 'Jy is nou op {tier} — premium-kenmerke ontsluit.',
      cancelledUntil: 'Intekening gekanselleer — jy sal nie weer gehef word nie, en jy behou {tier} tot {date}.',
      cancelled: 'Intekening gekanselleer — jy sal nie weer gehef word nie.',
      cancelFailed: 'Ons kon nie nou kanselleer nie. Probeer asseblief oor \'n oomblik weer, of kanselleer vanaf jou PayFast-rekening.',
      dismiss: 'Maak toe',
      summaryTitle: 'WTS CompoundIQ -- {country}',
      summaryInputs: 'Aanvanklik: {initial} | Maandeliks: {monthly} | Koers: {rate}%/jr | Jare: {years}',
      summaryBalance: 'Geprojekteerde Saldo: {v}',
      summaryDeposits: 'Totale Deposito\'s: {v}',
      summaryInterest: 'Saamgestelde Rente Verdien: {v}',
      summaryReal: 'Reële Waarde (vandag se geld): {v}',
      copySummary: 'Kopieer hierdie opsomming:',
      allocNote: '{pct}% hiervan is in {label} -- dit is die moeite werd om te oorweeg of dit meer gekonsentreer is as wat jy sou wou hê.',
      installApp: '📲 Installeer toepassing',
      iosPre: '— tik die', iosMid: '-ikoon, dan',
      iosShare: 'Deel', iosAdd: 'Voeg by Tuisskerm'
    },
    zu: {
      paymentPending: 'Inkokhelo yakho isaqinisekiswa yi-PayFast. Uhlelo lwakho luvulwa ngokuzenzakalelayo ngesikhathi esilandelayo uvula uhlelo — akudingeki ukhokhe futhi.',
      nowBasic: 'Manje useluhlelweni lwamahhala lwe-Basic.',
      nowTier: 'Manje useku-{tier} — izici eziphezulu zivuliwe.',
      cancelledUntil: 'Ukubhalisa kukhanseliwe — ngeke ukhokhiswe futhi, futhi ugcina i-{tier} kuze kube ngu-{date}.',
      cancelled: 'Ukubhalisa kukhanseliwe — ngeke ukhokhiswe futhi.',
      cancelFailed: 'Asikwazanga ukukhansela manje. Sicela uzame futhi ngemuva kwesikhashana, noma ukhansele ku-akhawunti yakho ye-PayFast.',
      dismiss: 'Vala',
      summaryTitle: 'WTS CompoundIQ -- {country}',
      summaryInputs: 'Okokuqala: {initial} | Ngenyanga: {monthly} | Izinga: {rate}%/ngonyaka | Iminyaka: {years}',
      summaryBalance: 'Ibhalansi Elinganiselwe: {v}',
      summaryDeposits: 'Izimali Zonke Ezifakiwe: {v}',
      summaryInterest: 'Inzalo Ehlanganisiwe Etholakele: {v}',
      summaryReal: 'Inani Langempela (imali yanamuhla): {v}',
      copySummary: 'Kopisha lesi sifinyezo:',
      allocNote: 'I-{pct}% yalokhu ikwi-{label} -- kufanele ucabange ukuthi ingabe ixhumene kakhulu kunalokho ongathanda.',
      installApp: '📲 Faka uhlelo',
      iosPre: '— thinta isithonjana se-', iosMid: ', bese',
      iosShare: 'Yabelana', iosAdd: 'Engeza Esikrinini Sasekhaya'
    }
  },
  {
    ns: 'restore',
    en: {
      title: 'Already paid? Restore your plan',
      prompt: "Enter the email you paid with — we'll check for an active subscription and unlock it on this device.",
      none: 'No active subscription found for that email. Check the address you paid with, or contact support.',
      unconfigured: "Live billing isn't switched on for this app yet, so there's no purchase to restore.",
      unavailable: "Automatic restore is switched off while we add email verification. Email warrrtechsolutions@gmail.com from the address you paid with and we'll restore your plan by hand.",
      badEmail: "That doesn't look like a valid email address.",
      error: "Couldn't reach the server just now. Try again in a moment.",
      checking: 'Checking…', restore: 'Restore',
      found: 'Found your {tier} subscription — unlocking now…',
      note: 'This only restores a real paid subscription. Your saved plans, budgets and other data live in this browser — export a backup from the footer to move those between devices.'
    },
    af: {
      title: 'Reeds betaal? Herstel jou plan',
      prompt: 'Voer die e-pos in waarmee jy betaal het — ons sal vir \'n aktiewe intekening kyk en dit op hierdie toestel ontsluit.',
      none: 'Geen aktiewe intekening vir daardie e-pos gevind nie. Kontroleer die adres waarmee jy betaal het, of kontak ondersteuning.',
      unconfigured: 'Lewendige fakturering is nog nie vir hierdie toepassing aangeskakel nie, so daar is geen aankoop om te herstel nie.',
      unavailable: 'Outomatiese herstel is afgeskakel terwyl ons e-posverifikasie byvoeg. E-pos warrrtechsolutions@gmail.com vanaf die adres waarmee jy betaal het en ons sal jou plan met die hand herstel.',
      badEmail: 'Dit lyk nie soos \'n geldige e-posadres nie.',
      error: 'Kon nie nou die bediener bereik nie. Probeer weer oor \'n oomblik.',
      checking: 'Kontroleer…', restore: 'Herstel',
      found: 'Jou {tier}-intekening gevind — ontsluit nou…',
      note: 'Dit herstel slegs \'n werklike betaalde intekening. Jou gestoorde planne, begrotings en ander data leef in hierdie blaaier — voer \'n rugsteun uit die voetskrif uit om dit tussen toestelle te skuif.'
    },
    zu: {
      title: 'Usukhokhile? Buyisela uhlelo lwakho',
      prompt: 'Faka i-imeyili owakhokha ngayo — sizohlola ukubhalisa okusebenzayo bese sikuvula kuleli divayisi.',
      none: 'Akukho ukubhalisa okusebenzayo okutholakele kuleyo imeyili. Hlola ikheli owakhokha ngalo, noma uxhumane nosekelo.',
      unconfigured: 'Ukukhokhisa bukhoma akukavulwa kulolu hlelo, ngakho akukho ukuthenga okungabuyiselwa.',
      unavailable: 'Ukubuyisela okuzenzakalelayo kuvaliwe ngenkathi sengeza ukuqinisekiswa kwe-imeyili. Thumela i-imeyili ku-warrrtechsolutions@gmail.com usebenzisa ikheli owakhokha ngalo futhi sizobuyisela uhlelo lwakho ngesandla.',
      badEmail: 'Lokhu akubukeki njengekheli le-imeyili elivumelekile.',
      error: 'Asikwazanga ukufinyelela iseva manje. Zama futhi ngemuva kwesikhashana.',
      checking: 'Iyahlola…', restore: 'Buyisela',
      found: 'Sithole ukubhalisa kwakho kwe-{tier} — siyavula manje…',
      note: 'Lokhu kubuyisela kuphela ukubhalisa okukhokhelwe kwangempela. Izinhlelo zakho ezigciniwe, izabelomali nenye idatha kuhlala kulesi siphequluli — layisha isipele ngaphansi ukuze uzidlulisele phakathi kwamadivayisi.'
    }
  }
];
