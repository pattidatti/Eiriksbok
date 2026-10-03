// Kongens menn på Holmen, og oppdragene der: «Budet til Bergenhus» (sniking, dagens ord og
// vaktrunder, graboks/holmenvakt.ts) og «Brann i lagerhuset» (bøttekjede, graboks/brann.ts).
// Ettersøkt-systemet (graboks/ettersokt.ts) fører gutten til gjaldkeren; samtalen der står også her.
//
// Hendelsene oppdragene teller:
//   snakk:vakta        vakta i porten har sagt at ingen tysker slipper inn uten dagens ord
//   budet:ordet        gutten har hørt dagens ord da vaktene byttet, uten å bli sett
//   budet:inn          gutten har sagt ordet til vakta og fått gå inn
//   brann:varslet      gutten har ropt «brann» og fått folk til å stille seg i bøttekjede
//   brann:slokket      ilden i lagerhuset er slokket (eller huset er tapt, men ilden spredte seg ikke)
//
// Det vi vet [V]:
// - Erik av Pommern var konge i Norge 1389-1442 og bodde ikke fast i Norge. Han var i krig med
//   Holstein og hansabyene. I krigsårene forlot tyske kjøpmenn Bergen, og kongen klarte ikke å
//   verne byen mot angrepene 1428-1430 (Haug, SNL «Erik av Pommern», hentet 03.10.2026).
// - Høvedsmannen på Bergenhus var kongens fremste mann i byen (blueprint §3, §4.1). Olav Nilsson
//   ble høvedsmann først i 1437-38 (SNL, samme artikkel). Hvem som var høvedsmann i 1426-29, har vi
//   ikke funnet [K]: derfor har høvedsmannen ikke navn i spillet.
// - Gjaldkeren var kongens mann som holdt orden i byen; tyver skulle føres bundet til ham
//   (bylova 1276, tyveribolken, Nielsen mfl. 2022 s. 111, blueprint §8.2).
// - Bylova sa at byen skulle ha brannvakt og vektere (Hartvedt & Skreien, Bergen byleksikon
//   «Byloven av 1276», 2009). Bergen brant mange ganger, blant annet 1198, 1248, 1413 og 1476
//   (Bergen byleksikon «Branner», 2009). Etter 1248 bygget Håkon Håkonsson ringmuren rundt Holmen
//   (Hartvedt & Skreien, Bergen byleksikon «Bergenhus (festningsanlegg)», 2009).
// Det som er laget for spillet [S]: dagens ord, vaktrundene, vaktene Ulf og Kolbein, gjaldkeren
// Sjur, skriveren Peder, lagerhuset som brenner og bøttekjeden. Hvordan porten ble vaktet og om
// det fantes et passord, vet vi ikke [K].
import type { OppdragDef } from './oppdrag-data';
import { SAMTALER, type Samtale } from './samtaler';

/** Dagens ord som vaktene sier til hverandre ved vaktskiftet [S]. */
export const ORDET = 'Hellig Olav';

// ── «Dette vet vi»: tyveribolken i bylova ──
// [V] Magnus Lagabøtes bylov for Bergen ble vedtatt i 1276 (Bergen byleksikon «Byloven av 1276»).
// Tyveribolken (Nielsen, Friðriksdóttir & Rindal 2022, s. 111, egen oversettelse i blueprint §8.2):
// sult fritar første gang, straffen øker for hver gang, et lite tyveri kan kjøpes fri fra pisking
// med en bot (3 mark sølv), godset bindes på ryggen og tyven føres til gjaldkeren. [U] Oversettelsen
// er vår egen og bør sjekkes mot en trykt utgave. [U] Hvordan lova ble brukt mot tyskerne på Bryggen
// i 1420-årene: Kontoret dømte sine egne etter egne regler. Ingen paragrafnumre er oppgitt med vilje.
// Witten i stedet for mark sølv er [S]: spillets mynt.
export const TYVERI_VET =
    'Bylova til kong Magnus Lagabøte kom i 1276. Den hadde egne regler om tyveri. Den som stjal mat fordi han sultet og ikke kunne arbeide, skulle ikke straffes. Den som stjal noe lite, kunne kjøpe seg fri fra pisking med en bot på 3 mark sølv. Neste gang ble boten dobbelt så stor, og den som ikke kunne betale, ble pisket og brennemerket. Den som tok en tyv, skulle binde tyvegodset på ryggen hans og føre ham til gjaldkeren, kongens mann i byen. Lova står skrevet, men vi vet ikke hvor ofte den ble brukt slik. Tyskerne på Bryggen ble ofte dømt etter Kontorets egne regler. Boten i witten er laget for spillet.';

// ── Folkene på Holmen som har noe å si ──
// Høvedsmannen står foran hallen. Han svarer på det eleven lurer mest på: hvor er kongen?
SAMTALER.hovedsmann = {
    start: {
        tekst: 'En tyskergutt i borggården. Har vakta sovet? Si fort hva du vil.',
        gest: 'peke',
        valg: [
            { tekst: 'Hvor er kongen?', til: 'kongen' },
            { tekst: 'Hva er en høvedsmann?', til: 'hva' },
            { tekst: 'Unnskyld. Jeg går.', til: 'slutt' },
        ],
    },
    kongen: {
        tekst: 'Kong Erik er konge over Norge, Danmark og Sverige. Han bor ikke her. Han holder til i Danmark og i Sverige, langt mot sør.',
        gest: 'riste',
        til: 'kongen2',
    },
    kongen2: {
        tekst: 'Derfor sitter jeg her. Det jeg sier i Bergen, sier jeg på kongens vegne. Borgen, loven og skatten er mitt ansvar.',
        gest: 'snakk',
        valg: [
            { tekst: 'Er kongen sint på oss tyskere?', til: 'krig' },
            { tekst: 'Hva er en høvedsmann?', til: 'hva' },
            { tekst: 'Takk, herre.', til: 'slutt' },
        ],
    },
    krig: {
        tekst: 'Kongen er i krig med hansabyene. Dine landsmenn i Lübeck og Wismar. Mange av kjøpmennene på Bryggen har reist hjem. De som ble igjen, ser jeg på hver dag.',
        gest: 'riste',
        til: 'krig2',
    },
    krig2: {
        tekst: 'Men byen trenger kornet deres, og dere trenger fisken vår. Så vi tåler hverandre. Inntil videre.',
        gest: 'skuldre',
        til: 'vet',
    },
    hva: {
        tekst: 'Høvedsmannen holder borgen for kongen. Jeg har vaktene, krever inn skatten og passer på at kongens lov gjelder i byen. Gjaldkeren holder orden i gatene for meg.',
        gest: 'snakk',
        valg: [
            { tekst: 'Hvor er kongen?', til: 'kongen' },
            { tekst: 'Takk, herre.', til: 'slutt' },
        ],
    },
    slutt: { tekst: 'Gå. Og hold deg unna kongens vei om natta.', gest: 'vift' },
    vet: {
        hvem: 'Dette vet vi',
        vet: true,
        // [V] Haug, SNL «Erik av Pommern»: konge 1389-1442, bodde ikke fast i Norge, krig med
        // hansabyene, tyske kjøpmenn forlot Bergen i krigsårene. [K] Hvem som var høvedsmann i 1426.
        tekst: 'Erik av Pommern var konge i Norge fra 1389 til 1442, og samtidig konge i Danmark og Sverige. Han bodde aldri fast i Norge. I hans tid var det krig mellom kongen og hansabyene, og mange tyske kjøpmenn reiste fra Bergen. På Bergenhus satt høvedsmannen, kongens fremste mann i byen. Hvem som var høvedsmann i 1420-årene, har vi ikke funnet ut. Derfor har han ikke noe navn i spillet.',
    },
};

// Gjaldkeren står ved skriverboden. Uten oppdrag forteller han hva han gjør.
SAMTALER.gjaldker = {
    start: {
        tekst: 'Jeg er gjaldkeren. Når noen stjeler, slåss eller lager bråk i byen, er det meg de blir ført til.',
        gest: 'snakk',
        valg: [
            { tekst: 'Hva skjer med en tyv?', til: 'tyv' },
            { tekst: 'Dømmer du tyskerne også?', til: 'tysk' },
        ],
    },
    tyv: {
        tekst: 'Første gang en bot. Kan han ikke betale, blir han pisket. Og jo flere ganger, jo verre. Står alt i kongens lov.',
        gest: 'riste',
    },
    tysk: {
        tekst: 'Kontoret vil helst dømme sine egne. Men står du på kongens grunn, gjelder kongens lov. Husk det.',
        gest: 'peke',
    },
};

/** Det vakta sier om kongen (felles for samtalene ved porten). */
const VAKTA_KONGEN: Samtale = {
    kongen: {
        tekst: 'Kongen? Kong Erik bor i Danmark. Han har ikke vært her i min tid. Her styrer høvedsmannen for ham.',
        gest: 'riste',
        til: 'krig',
    },
    krig: {
        tekst: 'Og nå er kongen i krig med hansabyene. Med dine folk, gutt. Derfor slipper ingen tysker inn uten dagens ord.',
        gest: 'snakk',
        til: 'ordet',
    },
};

// ── Budet til Bergenhus ── (blueprint §7.2: sniking, passord, timing på vaktene)
export const BUDET: OppdragDef = {
    id: 'bergenhus',
    tittel: 'Budet til Bergenhus',
    giver: 'presten',
    mottaker: 'skriveren',
    krav: ['brev'],
    om: 'Herr Johannes har et svar som skal til kongens skriver på Bergenhus. Det er krig mellom kongen og hansabyene, og vakta slipper ingen tysker inn uten dagens ord. Vaktene sier ordet til hverandre når de bytter, ved vaktbua på veien til Holmen.',
    hvor: 'Veien til Holmen, ytterst langs kaia mot nord, og porten til Bergenhus',
    maal: [
        { hendelse: 'snakk:vakta', tekst: 'Spør vakta i porten om å få gå inn' },
        { hendelse: 'budet:ordet', tekst: 'Snik deg inntil vaktbua og hør dagens ord uten å bli sett', etter: true },
        { hendelse: 'budet:inn', tekst: 'Si dagens ord til vakta i porten (E)', etter: true },
    ],
    ting: 'brev',
    tilbud: {
        start: {
            tekst: 'Vent, gutt. Siden du først er her: dette brevet skal til kongens skriver på Bergenhus.',
            gest: 'kom',
            til: 'start2',
        },
        start2: {
            tekst: 'Følg kaia mot nord til Holmen. Porten er i muren. Men pass deg: det er krig, og kongens menn liker ikke tyskere nå.',
            gest: 'peke',
            valg: [
                { tekst: 'Får jeg se kongen?', til: 'kongen' },
                { tekst: 'Jeg skal levere det.', til: 'ja' },
            ],
        },
        kongen: {
            tekst: 'Kongen? Han er ikke her, gutt. Spør høvedsmannen, om han gidder å svare deg.',
            gest: 'riste',
            valg: [{ tekst: 'Jeg skal levere det.', til: 'ja' }],
        },
        ja: { tekst: 'Gud være med deg.', gest: 'bukk', gjor: 'ta:bergenhus' },
    },
    underveis: {
        start: { tekst: 'Bergenhus ligger ytterst på Holmen. Følg kaia mot nord, og vær forsiktig med vaktene.', gest: 'peke' },
    },
    samtaler: {
        vakta: {
            start: {
                tekst: 'Stopp! Hva vil en tyskergutt på kongens borg?',
                gest: 'peke',
                valg: [
                    { tekst: 'Jeg har et brev fra presten i Mariakirken.', til: 'brev' },
                    { tekst: 'Jeg vil se kongen.', til: 'kongen' },
                    // Låst svar (rpg.ts): krever at kongens menn kjenner gutten fra tyven i gården.
                    { tekst: 'Du kjenner meg. Jeg ropte på dere da tyven var i gården.', til: 'kjent', krav: { rykte: { B: 8 } } },
                ],
            },
            kjent: {
                tekst: 'Jungen som ropte på oss? Ja, jeg husker deg. Men ordre er ordre, uten dagens ord går ingen inn. Hør etter ved vaktbua når vi bytter.',
                gest: 'nikk',
                gjor: 'hendelse:snakk:vakta;rykte:B:+2',
            },
            ...VAKTA_KONGEN,
            brev: {
                tekst: 'Fra presten, sier du? Det kan hvem som helst si. Det er krig. Ingen tysker går inn uten dagens ord.',
                gest: 'riste',
                til: 'ordet',
            },
            ordet: {
                tekst: 'Vet du ikke ordet, så kom deg vekk fra porten. Og ikke la meg se deg luske rundt vaktbua.',
                gest: 'vift',
                gjor: 'hendelse:snakk:vakta',
            },
        },
    },
    levering: {
        start: {
            tekst: 'Et brev fra Mariakirken? Og vakta slapp deg inn? Hit med det. Jeg skal gi det til høvedsmannen.',
            gest: 'kom',
            gjor: 'lever:bergenhus',
            til: 'hvem',
        },
        hvem: {
            tekst: 'Høvedsmannen står der borte ved hallen. Han er kongens mann her. Han holder borgen, krever inn skatt og passer på at kongens lov gjelder i byen.',
            gest: 'peke',
            valg: [
                { tekst: 'Gjelder kongens lov på Bryggen også?', til: 'bryggen' },
                { tekst: 'Hvem er mannen ved siden av deg?', til: 'gjaldker' },
                { tekst: 'Takk. Jeg går nå.', til: 'slutt' },
            ],
        },
        bryggen: {
            tekst: 'Det burde den. Men dere på Kontoret har egne lover, og kongen trenger kornet deres. Det er en strid som ikke er over.',
            gest: 'skuldre',
            til: 'slutt',
        },
        gjaldker: {
            tekst: 'Det er Sjur, gjaldkeren. Han holder orden i byen. Tyver og slåsskjemper blir ført til ham. Han trenger nok bein som dine også.',
            gest: 'peke',
            til: 'slutt',
        },
        slutt: { tekst: 'Gå tilbake til Bryggen før det blir mørkt, gutt.', gest: 'vift', til: 'vet' },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            // [V] Erik av Pommern, krigen med hansabyene, høvedsmannen (se toppen av fila). [K] om
            // porten hadde vakt og passord slik. Skriveren, vakta og ordet er [S].
            tekst: 'Kong Erik av Pommern var konge over Norge, Danmark og Sverige, og bodde ikke i Norge. I 1420-årene var han i krig med hansabyene. På Bergenhus satt høvedsmannen, kongens fremste mann i Bergen. Om vaktene i porten brukte et hemmelig ord, vet vi ikke. Vakta, ordet og skriveren er laget for spillet.',
        },
    },
    lonn: 'Du har vært innenfor muren på Bergenhus. Høvedsmannen vet hvem du er.',
    belonning: { witten: 2, rykte: { B: 5, Ki: 2 }, ferdighet: { regning: 1 } },
};

// ── Brann i lagerhuset ── (blueprint §7.2: brannvakt og bøttekjede)
export const BRANN: OppdragDef = {
    id: 'brann',
    tittel: 'Brann i lagerhuset',
    giver: 'gjaldkeren',
    mottaker: 'gjaldkeren',
    krav: ['bergenhus'],
    om: 'Gjaldkeren har satt deg til å gå brannvakt langs veien til Holmen. Ser du røyk, skal du rope, få folk i bøttekjede fra sjøen og slokke før ilden tar resten av byen.',
    hvor: 'Lagerhusene langs veien til Holmen',
    maal: [
        { hendelse: 'brann:varslet', tekst: 'Gå brannvakt ved lagerhusene. Rop «brann» om du ser røyk' },
        { hendelse: 'brann:slokket', tekst: 'Stå først i bøttekjeden og slokk ilden', etter: true },
    ],
    tilbud: {
        start: {
            tekst: 'Du, tyskergutt. Du har lette bein. Jeg mangler en vekter langs lagerhusene ved veien.',
            gest: 'kom',
            til: 'start2',
        },
        start2: {
            tekst: 'Én gnist er nok. Byen er av tre, og den har brent før. Ser du røyk, så rop, få folk i bøttekjede fra sjøen og stå selv nærmest ilden.',
            gest: 'peke',
            valg: [
                { tekst: 'Jeg skal gå brannvakt.', til: 'ja' },
                { tekst: 'Hvorfor brenner byen så ofte?', til: 'hvorfor' },
            ],
        },
        hvorfor: {
            tekst: 'Alt er tre, og husene står vegg i vegg. Folk har ild til mat og lys. Og vinden fra fjorden blåser gnistene fra tak til tak.',
            gest: 'skuldre',
            valg: [{ tekst: 'Jeg skal gå brannvakt.', til: 'ja' }],
        },
        ja: { tekst: 'Bra. Gå langs lagerhusene, og hold øynene oppe.', gest: 'nikk', gjor: 'ta:brann' },
    },
    underveis: {
        start: { tekst: 'Brannvakt, gutt. Lagerhusene langs veien. Ser du røyk, så rop.', gest: 'peke' },
    },
    leveringStart: (f) => (f.has('brann-tapt') ? 'tapt' : 'reddet'),
    levering: {
        reddet: {
            tekst: 'Jeg så røyken fra muren. Dere fikk den ned før den tok taket. Det var raskt gjort.',
            gest: 'nikk',
            gjor: 'lever:brann',
            til: 'lov',
        },
        tapt: {
            tekst: 'Lagerhuset er borte. Men ilden tok ikke naboene, og ingen døde. Det er mer enn byen har fått mange ganger før.',
            gest: 'riste',
            gjor: 'lever:brann',
            til: 'lov',
        },
        lov: {
            tekst: 'Kongens lov sier at byen skal ha brannvakt og vektere om natta. Nå vet du hvorfor.',
            gest: 'snakk',
            til: 'vet',
        },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            // [V] Bergen byleksikon «Branner» (1198, 1248, 1413, 1476) og «Byloven av 1276»
            // (brannvakt og vektere), Hartvedt & Skreien 2009. [K] Hvordan man slokket i 1420-årene:
            // bøttekjeden er en rimelig antakelse, ikke funnet i kildene.
            tekst: 'Bergen brant mange ganger i middelalderen, blant annet i 1198, 1248, 1413 og 1476. Byen var bygget av tre, og husene sto tett. Bylova fra 1276 sa at byen skulle ha brannvakt og vektere. Hvordan folk slokket branner i 1420-årene, vet vi lite om. Bøttekjeden i spillet er en antakelse.',
        },
    },
    lonn: 'Gjaldkeren skriver navnet ditt i boka si, og ikke for noe galt denne gangen.',
    belonning: { witten: 3, rykte: { B: 6, N: 3 }, ferdighet: { styrke: 1 } },
};

export const BYEN_OPPDRAG: OppdragDef[] = [BRANN];
