// «Kontorets lov»: oppdragskjeden om Kontoret som makt på Bryggen. Samme form som oppdrag-data.ts;
// kjeden legges til `OPPDRAG` der med én linje.
//
//   1 Morgensprache       sekretæren -> oldermannen   hør reglene og straffene, og lov å holde dem
//   2 Fisken sorteres     oldermannen -> Lambert      sortere tørrfisk i bua (kontor-sortering.ts)
//   3 Sølve fra Vesterålen Lambert -> husbonden       prute fisk mot rug (kontor-prute.ts)
//   4 Sølves side i boka  husbonden -> husbonden      Sølve ber deg stryke saltet; før boka (kontor-gjeldsbok.ts)
//   5 Heis fisken         husbonden -> sekretæren     vinsjen i gavlen (kontor-vinsj.ts); sekretæren teller
//   6 Kontorets dom       sekretæren -> oldermannen   Morgensprache igjen: ros, eller dom og straff
//
// Hvert oppdrag tas av det forrige når det leveres (`lever:a;ta:b` i samme replikk), så kjeden går
// av seg selv. Valget som slår tilbake: Sølve ber deg stryke en linje i gjeldsboka (4). Gjør du det,
// finner sekretæren feilen når han teller lasten (5), og da velger du igjen: si sannheten og ta
// straffen, eller skylde på Sølve (6). Valgene huskes som flagg (oppdrag.ts) og lagres:
//   kontor-sort-god | kontor-sort-svak      hvordan sorteringen gikk
//   kontor-pris=<tall>, kontor-pris-tvunget | -hard | -rett | -raus   kilo rug for en kilo fisk
//   kontor-lovte | kontor-nektet            hva du svarte Sølve
//   kontor-strok | kontor-skrev             om saltlinja står i boka
//   kontor-tilsto | kontor-skyldte          hva du sa da feilen ble funnet
//
// Mekanikkene sender hendelsene målene teller: kontor:morgensprache, kontor:sortert, kontor:prutet,
// kontor:bok, kontor:heist, kontor:dom.
//
// Historien, navnene og replikkene er laget for spillet [S]. Ingen av folkene er historiske.
// Fakta i «Dette vet vi» er merket i kommentarene, med kildene i blueprint §4 og §11.
import type { OppdragDef } from './oppdrag-data';
import { PERSONER, TITTEL } from './personer';
import { BESTEMT, NAVN, REPLIKKER, SAMTALER } from './samtaler';

// ── Folkene ── Lagt til her, så de delte listene bare får én import. [S]
PERSONER.oldermannen = { navn: 'Tidemann Ruge', tittel: 'oldermann på Kontoret' };
PERSONER.sekretaeren = { navn: 'Magister Arnold', tittel: 'Kontorets sekretær' };
PERSONER.solve = { navn: 'Sølve', tittel: 'fisker fra Vesterålen' };
TITTEL.oldermann = 'Oldermann';
NAVN.oldermann = 'Oldermannen';
BESTEMT.oldermann = 'oldermannen';
REPLIKKER.oldermann = [
    'Kontoret har sine egne lover, gutt. Lær dem.',
    'Jeg har ikke tid nå. Gå til sekretæren.',
    'En junge som holder seg til reglene, blir svenn en dag.',
];

/** Det systemene og samtalene trenger fra spillet (settes av kontoret.ts når spillet starter). */
export const KONTOR = {
    flagg: new Set<string>() as ReadonlySet<string>,
    status: ((): string => 'ny') as (id: string) => string,
};

/** Hva Sølve sier når ingen av oppdragene har noe å si: det han husker av det gutten gjorde. */
function solveSier(): string {
    const f = KONTOR.flagg;
    const st = KONTOR.status;
    if (st('kontor-prute') !== 'levert' && !f.has('kontor-pris-tvunget') && ![...f].some((x) => x.startsWith('kontor-pris='))) {
        return 'Jeg venter på at noen fra gården skal kjøpe fisken min. Det tar tid. Det gjør det alltid.';
    }
    if (st('kontor-dom') === 'levert') {
        if (f.has('kontor-tilsto')) return 'Du tok slagene for min skyld. Det skulle ikke vært sånn. Neste sommer er jeg her igjen.';
        return 'Neste sommer er jeg her igjen. Det er jeg alltid. Gjelda sørger for det.';
    }
    if (f.has('kontor-strok')) return 'Ikke si noe til noen, gutt. Du har ikke sett meg ta det saltet.';
    if (f.has('kontor-skrev') && f.has('kontor-lovte')) return 'Jeg så tallet da husbonden leste det høyt. Du lovte meg det, gutt.';
    if (f.has('kontor-skrev')) return 'Boka er boka. Jeg har hørt det før.';
    if (f.has('kontor-pris-tvunget')) return 'Seks kilo. Du vet like godt som jeg at det ikke holder vinteren ut.';
    return 'Rugen er lovet. Nå venter jeg bare på å bli skrevet inn i boka.';
}

SAMTALER.solve = {
    start: {
        get tekst() {
            return solveSier();
        },
        gest: 'snakk',
    },
};

/** Hvor mange kilo rug Sølve fikk for én kilo tørrfisk (lagret som flagget `kontor-pris=<tall>`). */
export function kontorPris(flagg: ReadonlySet<string> = KONTOR.flagg): number {
    for (const f of flagg) if (f.startsWith('kontor-pris=')) return Number(f.slice(12)) || 6;
    return 6;
}

/** Sølves konto i gjeldsboka (i våger fisk), etter prisen han fikk. Hvert ledd er en linje i boka. */
export interface BokLinje {
    tekst: string;
    /** Våger: + det han skylder mer, - det han betalte. */
    vaager: number;
    /** Linja Sølve ba gutten stryke. */
    salt?: boolean;
}

/**
 * Familien trenger 1440 kilo rug til vinteren [S]. Sølve leverte 10 våger (180 kg) fisk. Det han
 * ikke fikk for fisken, må han ta på kreditt: jo lavere pris, jo større gjeld.
 */
export function solvesKonto(pris: number): BokLinje[] {
    const fikk = 180 * pris;
    const mangler = Math.max(0, 1440 - fikk);
    const rugGjeld = Math.round(mangler / (18 * pris));
    return [
        { tekst: 'Gjeld fra i fjor', vaager: 6 },
        { tekst: 'Betalte med fisk på gammel gjeld', vaager: -3 },
        { tekst: 'Salt til fisket, to sekker', vaager: 2, salt: true },
        { tekst: 'Hamp til garn', vaager: 1 },
        { tekst: `Rug på kreditt (det som mangler til vinteren)`, vaager: rugGjeld },
        { tekst: 'Mel og øl til turen hjem', vaager: 1 },
    ];
}

const VET_MORGENSPRACHE =
    // [V] SNL «Det tyske kontor»: to oldermenn, et råd på 18 og en sekretær; fellesmøtet het
    // Morgensprache. [U] at reglene ble lest opp på møtet slik spillet viser det. [V for 1600/1700-tallet,
    // U for 1400-tallet] «fem harde slag over ryggen» (Hanseatiske museum, blueprint §4.2). Hvilke straffer
    // som hørte til hvilke regler i 1420-årene: [K]. Stedet (schøtstua i gården) er [S].
    'Det tyske kontor hadde egne lover og eget styre. Det ble ledet av to oldermenn, et råd på 18 menn og en sekretær som skrev brevene og protokollen. Når alle skulle samles, het møtet Morgensprache. Vi vet ikke nøyaktig hva som skjedde på møtene i 1420-årene, eller hvilke straffer som hørte til hvilke regler. At en junge kunne få «fem harde slag over ryggen», står i museets fortelling om livet på Bryggen flere hundre år senere. I spillet holdes møtet i schøtstua. Det er laget for spillet.';

const VET_SORTERING =
    // [V] tørrfisk over 80 prosent av eksporten på 1300-tallet (blueprint §4.3). [K] hvordan fisken
    // ble sortert i 1420-årene. Klassene og kjennetegnene her er [S].
    'Tørrfisk var den viktigste varen fra Norge. På 1300-tallet var over åtte av ti kroner Norge tjente på salg til utlandet, tørrfisk. God fisk ga bedre pris enn dårlig. Hvordan fisken ble sortert i 1420-årene, og hva klassene het, vet vi ikke. De tre haugene her er laget for spillet.';

const VET_PRUTE =
    // [V] Holm mfl. 2019, etter Nedkvitne 1988 (blueprint §4.3): rundt 1500 fikk fiskeren 8 kg rug for
    // 1 kg tørrfisk i Bergen, 50 år senere halvparten. [V] Kontoret styrte kornimporten. [U] prisene i
    // 1420-årene. Sølves tall er [S].
    'Fiskerne fra nord byttet tørrfisk mot korn. Rundt år 1500 fikk en fisker omtrent 8 kilo rug for 1 kilo tørrfisk i Bergen. Femti år senere fikk han bare halvparten. Kontoret styrte nesten alt korn som kom til Bergen, så fiskerne hadde få andre å selge til. Hva bytteforholdet var i 1420-årene, vet vi ikke sikkert.';

const VET_GJELD =
    // [V] nordfarergjeld: varer på bok, betalt med fisk senere, bundet i gjeld i årevis (blueprint §4.3).
    // [U] hvor stor gjelda var i 1420-årene. Sølves konto er [S].
    'Fiskerne fikk korn, salt og hamp på kreditt og betalte med fisk året etter. Kjøpmannen skrev alt i gjeldsboka. Mange fiskere kunne ikke lese det som sto der, og satt i gjeld i årevis. Gjelda bandt dem til den samme kjøpmannen år etter år. Hvor mye en fisker skyldte i 1420-årene, vet vi ikke. Tallene her er laget for spillet.';

const VET_VINSJ =
    // [V] forhusene mot sjøen var lagerhus (bu.ts). [U] vinsjer i gavlene i 1420-årene: husene som står i
    // dag, med heiser i gavlene, er bygget etter brannen i 1702 (Byleksikon «Bryggen»). Ikke sjekket [K].
    'Husene ytterst mot sjøen var lagerhus. Varene ble heist opp til loftene og ned igjen til skipene. Husene som står på Bryggen i dag, har vinsjer i gavlene, men de ble bygget etter brannen i 1702. Hvordan varene kom opp på loftet i 1420-årene, vet vi ikke sikkert.';

// ── 1. Morgensprache ──
const MORGENSPRACHE: OppdragDef = {
    id: 'kontor-morgensprache',
    tittel: 'Morgensprache',
    giver: 'sekretaeren',
    mottaker: 'oldermannen',
    krav: ['fisk'],
    om: 'Oldermannen på Kontoret holder Morgensprache i schøtstua. Alle nye junger skal stå foran ham, høre Kontorets regler og love å holde dem.',
    hvor: 'Schøtstua, bakerst i gården',
    maal: [{ hendelse: 'kontor:morgensprache', tekst: 'Still deg foran oldermannen og hør reglene' }],
    tilbud: {
        start: {
            tekst: 'Du er den nye jungen til Hinrik Kolle? Jeg er Magister Arnold, Kontorets sekretær. Jeg skriver Kontorets brev og alt som blir bestemt.',
            gest: 'snakk',
            til: 'start2',
        },
        start2: {
            tekst: 'Oldermannen er kommet for å holde Morgensprache. Det er møtet der Kontoret samles og hører sine egne lover.',
            gest: 'peke',
            valg: [
                { tekst: 'Hva er en oldermann?', til: 'hvem' },
                { tekst: 'Hva må jeg gjøre?', til: 'gjore' },
            ],
        },
        hvem: {
            tekst: 'Kontoret har to oldermenn. De styrer sammen med et råd på atten menn. Her gjelder ikke kongens lov først. Her gjelder Kontorets.',
            gest: 'snakk',
            til: 'gjore',
        },
        gjore: {
            tekst: 'Still deg foran oldermannen, der ved østveggen. Hør godt etter. Etterpå skal du love å holde reglene, foran alle.',
            gest: 'peke',
            valg: [{ tekst: 'Jeg skal gjøre det.', til: 'ja' }],
        },
        ja: { tekst: 'Stå rett, og ikke se ned i golvet.', gest: 'nikk', gjor: 'ta:kontor-morgensprache' },
    },
    underveis: {
        start: { tekst: 'Still deg foran oldermannen, gutt. Han venter ikke lenge.', gest: 'peke' },
    },
    levering: {
        start: {
            tekst: 'Du har lovt det foran gården, og sekretæren har skrevet det ned. Nå er du en av oss. Bryter du loven, er det vi som dømmer deg.',
            gest: 'snakk',
            gjor: 'lever:kontor-morgensprache;rykte:K:+3',
            til: 'arbeid',
        },
        arbeid: {
            tekst: 'Jekta fra Vesterålen er kommet, og fisken må sorteres før den selges. Gå til bua. Lambert viser deg hvordan.',
            gest: 'peke',
            gjor: 'ta:kontor-sortere',
            til: 'vet',
        },
        vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_MORGENSPRACHE },
    },
    lonn: 'Du har lovt å holde Kontorets lov.',
    belonning: { rykte: { K: 3 } },
};

// ── 2. Fisken sorteres ──
const SORTERE: OppdragDef = {
    id: 'kontor-sortere',
    tittel: 'Fisken sorteres',
    giver: 'oldermannen',
    mottaker: 'lambert',
    krav: ['kontor-morgensprache'],
    om: 'Kontoret selger bare fisk som er sortert. Sorter tørrfisken fra jekta i bua: fin, middels og vrak.',
    hvor: 'Fiskestablene i bua',
    maal: [{ hendelse: 'kontor:sortert', tekst: 'Sorter tørrfisken ved stablene i bua' }],
    tilbud: {
        start: {
            tekst: 'Fisken fra jekta må sorteres. Gå til bua.',
            gest: 'peke',
            gjor: 'ta:kontor-sortere',
        },
    },
    underveis: {
        start: { tekst: 'Fisken ligger ved stablene langs veggen, junge. Fin, middels og vrak. Kjenn på den som ser fin ut.', gest: 'peke' },
    },
    leveringStart: (f) => (f.has('kontor-sort-god') ? 'god' : 'svak'),
    levering: {
        god: {
            tekst: 'Jeg har sett gjennom haugene dine. Nesten alt ligger der det skal. Du har øyne i hodet, junge.',
            gest: 'nikk',
            gjor: 'lever:kontor-sortere;rykte:K:+2;witten:+2',
            til: 'solve',
        },
        svak: {
            tekst: 'Det ligger vrak i haugen med fin fisk. En kjøpmann i Lübeck som finner det, kjøper ikke av oss igjen. Jeg har sortert om.',
            gest: 'riste',
            gjor: 'lever:kontor-sortere',
            til: 'solve',
        },
        solve: {
            tekst: 'Fisken var fra Sølve, han som står på kaia. Han vil ha rug for resten. Husbonden sier: ikke mer enn seks kilo rug for en kilo fisk. Prut med ham.',
            gest: 'peke',
            gjor: 'ta:kontor-prute',
            til: 'vet',
        },
        vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_SORTERING },
    },
    lonn: 'Lambert har sett at du kan skille god fisk fra dårlig.',
    belonning: { rykte: { K: 1 } },
};

// ── 3. Sølve fra Vesterålen ──
const PRUTE: OppdragDef = {
    id: 'kontor-prute',
    tittel: 'Sølve fra Vesterålen',
    giver: 'lambert',
    mottaker: 'husbonden',
    krav: ['kontor-sortere'],
    om: 'Sølve fra Vesterålen vil ha rug for tørrfisken sin. Husbonden vil ikke gi mer enn seks kilo rug for en kilo fisk. Prut med Sølve på kaia.',
    hvor: 'Sølve på kaia, så husbonden i bua',
    maal: [{ hendelse: 'kontor:prutet', tekst: 'Prut med Sølve på kaia' }],
    tilbud: { start: { tekst: 'Sølve står på kaia. Prut med ham.', gest: 'peke', gjor: 'ta:kontor-prute' } },
    underveis: {
        start: { tekst: 'Sølve står på kaia og venter. Seks kilo rug for kiloen, sa husbonden.', gest: 'peke' },
    },
    leveringStart: (f) =>
        f.has('kontor-pris-tvunget') ? 'tvunget' : f.has('kontor-pris-hard') ? 'hard' : f.has('kontor-pris-raus') ? 'raus' : 'rett',
    levering: {
        tvunget: {
            tekst: 'Seks? Han ville gå, sier du, men han ble stående. Selvfølgelig. Hvem andre skal han selge til? Vi har kornet.',
            gest: 'skuldre',
            gjor: 'lever:kontor-prute;rykte:K:+3;rykte:F:-6',
            til: 'bok',
        },
        hard: {
            tekst: 'Det er en god handel for gården. Du lar deg ikke lure av en fisker som klager.',
            gest: 'nikk',
            gjor: 'lever:kontor-prute;rykte:K:+2;rykte:F:-2',
            til: 'bok',
        },
        rett: {
            tekst: 'Mer enn jeg sa. Men han går ikke til en annen gård neste år heller. Det får gå denne gangen.',
            gest: 'skuldre',
            gjor: 'lever:kontor-prute;rykte:F:+3',
            til: 'bok',
        },
        raus: {
            tekst: 'Så mye? Du gir bort husbondens korn, junge! Det der kommer ikke til å skje igjen.',
            gest: 'riste',
            gjor: 'lever:kontor-prute;rykte:F:+5;rykte:K:-3',
            til: 'bok',
        },
        bok: {
            tekst: 'Nå skal Sølves side i gjeldsboka føres. Det han ikke fikk for fisken, må han ta på kreditt. Gå og hent tallene hos ham, og før dem i boka her.',
            gest: 'peke',
            gjor: 'ta:kontor-gjeldsbok',
            til: 'vet',
        },
        vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_PRUTE },
    },
    lonn: 'Handelen er gjort, og Sølve får rug med seg hjem.',
    belonning: { ferdighet: { prute: 1 } },
};

// ── 4. Sølves side i boka ──
const GJELDSBOK: OppdragDef = {
    id: 'kontor-gjeldsbok',
    tittel: 'Sølves side i boka',
    giver: 'husbonden',
    mottaker: 'husbonden',
    krav: ['kontor-prute'],
    om: 'Hent tallene hos Sølve på kaia, og før kontoen hans i gjeldsboka på pulten i bua. Regn riktig: det som står i boka, gjelder.',
    hvor: 'Sølve på kaia, så pulten i bua',
    maal: [
        { hendelse: 'snakk:solve', tekst: 'Hent tallene hos Sølve på kaia' },
        { hendelse: 'kontor:bok', tekst: 'Før Sølves konto i gjeldsboka på pulten', etter: true },
    ],
    tilbud: { start: { tekst: 'Før Sølves side i boka.', gest: 'peke', gjor: 'ta:kontor-gjeldsbok' } },
    underveis: {
        start: { tekst: 'Tallene til Sølve, junge. Og før dem ordentlig. Boka lyver ikke.', gest: 'peke' },
    },
    samtaler: {
        solve: {
            start: {
                tekst: 'Skal du skrive meg inn i boka? Da skal du få tallene. Seks våger fra i fjor. Tre våger fisk betalte jeg på den gamle gjelda i dag.',
                gest: 'snakk',
                til: 'start2',
            },
            start2: {
                tekst: 'Så fikk jeg to sekker salt til fisket, hamp til garn, og mel og øl til turen hjem. Og rug på kreditt, for det jeg fikk for fisken, holder ikke vinteren ut.',
                gest: 'skuldre',
                til: 'be',
            },
            be: {
                tekst: 'Hør her, gutt. Saltet. Ingen så at jeg tok det. Hopp over den linja. To våger mindre gjeld, og jeg kan kanskje komme meg ut av boka om noen år.',
                gest: 'kom',
                valg: [
                    { tekst: 'Greit. Jeg hopper over saltet.', til: 'lovte' },
                    { tekst: 'Nei. Det som står i boka, skal være sant.', til: 'nektet' },
                    { tekst: 'Hvorfor skal jeg gjøre det for deg?', til: 'hvorfor' },
                ],
            },
            hvorfor: {
                tekst: 'Fordi far min satt i gjeld til den samme gården hele livet. Og jeg kommer til å gjøre det samme. Ungene mine også, om ingen stryker en linje en gang.',
                gest: 'riste',
                valg: [
                    { tekst: 'Greit. Jeg hopper over saltet.', til: 'lovte' },
                    { tekst: 'Nei. Det som står i boka, skal være sant.', til: 'nektet' },
                ],
            },
            lovte: {
                tekst: 'Takk. Jeg glemmer deg ikke. Men husk: du har ikke sett meg ta det saltet.',
                gest: 'nikk',
                gjor: 'flagg:kontor-lovte;hendelse:snakk:solve',
            },
            nektet: {
                tekst: 'Nei. Du er en av dem nå. Jeg skjønner det. Skriv det, da.',
                gest: 'skuldre',
                gjor: 'flagg:kontor-nektet;hendelse:snakk:solve',
            },
        },
    },
    leveringStart: (f) => (f.has('kontor-strok') ? 'strok' : 'riktig'),
    levering: {
        riktig: {
            tekst: 'La meg se. Ja. Det stemmer. Sølve skylder mer enn i fjor. Slik går det med de fleste av dem.',
            gest: 'nikk',
            gjor: 'lever:kontor-gjeldsbok;rykte:K:+2',
            til: 'vinsj',
        },
        strok: {
            tekst: 'La meg se. Ja, det ser greit ut. Skriften din er bedre enn min, junge.',
            gest: 'nikk',
            gjor: 'lever:kontor-gjeldsbok;rykte:F:+6',
            til: 'vinsj',
        },
        vinsj: {
            tekst: 'Fisken til Sølve skal opp på lagerloftet. Bruk vinsjen i gavlen ute på kaia. Sekretæren teller buntene mot boka etterpå. Gå til ham når du er ferdig.',
            gest: 'peke',
            gjor: 'ta:kontor-vinsj',
            til: 'vet',
        },
        vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_GJELD },
    },
    lonn: 'Sølves konto står i boka.',
    belonning: { ferdighet: { regning: 1 } },
};

// ── 5. Heis fisken ──
const VINSJ: OppdragDef = {
    id: 'kontor-vinsj',
    tittel: 'Heis fisken',
    giver: 'husbonden',
    mottaker: 'sekretaeren',
    krav: ['kontor-gjeldsbok'],
    om: 'Heis fem bunter tørrfisk med vinsjen fra kaia opp til lagerloftet. Sveiv med A og D etter tur, og dra bunten inn når den henger stille. Sekretæren i schøtstua teller etterpå.',
    hvor: 'Under vinsjen i gavlen på bua, så sekretæren i schøtstua',
    maal: [{ hendelse: 'kontor:heist', tekst: 'Heis bunter opp til lagerloftet', antall: 5 }],
    tilbud: { start: { tekst: 'Vinsjen, junge.', gest: 'peke', gjor: 'ta:kontor-vinsj' } },
    underveis: {
        start: { tekst: 'Fem bunter opp på loftet. Så kommer du til meg, og vi teller.', gest: 'peke' },
    },
    leveringStart: (f) => (f.has('kontor-strok') ? 'avvik' : 'riktig'),
    levering: {
        riktig: {
            tekst: 'Fem bunter på loftet, og boka stemmer med lageret. To sekker salt er borte fra bua, og to sekker salt står på Sølve. Slik skal det være.',
            gest: 'nikk',
            gjor: 'lever:kontor-vinsj;ta:kontor-dom',
            til: 'riktig2',
        },
        riktig2: {
            tekst: 'Oldermannen vil se deg på Morgensprache. Still deg foran ham.',
            gest: 'peke',
            til: 'vet',
        },
        avvik: {
            tekst: 'Fem bunter, ja. Men jeg har talt saltet i bua. I går tolv sekker, i dag ti. Og i boka står det ingenting om salt.',
            gest: 'snakk',
            til: 'avvik2',
        },
        avvik2: {
            tekst: 'Det var du som førte Sølves side. Hvor ble det av saltet, gutt?',
            gest: 'peke',
            valg: [
                { tekst: 'Sølve ba meg hoppe over det. Jeg gjorde det.', til: 'tilsto' },
                { tekst: 'Sølve leste opp feil for meg. Han lurte meg.', til: 'skyldte' },
            ],
        },
        tilsto: {
            tekst: 'Da har du handlet med en nordmann bak ryggen på Kontoret. Det er den tredje regelen. Oldermannen skal dømme deg på Morgensprache.',
            gest: 'riste',
            gjor: 'flagg:kontor-tilsto;lever:kontor-vinsj;ta:kontor-dom',
            til: 'vet',
        },
        skyldte: {
            tekst: 'Så han lurte deg. Da er det Sølve som har stjålet fra Kontoret. Oldermannen tar saken på Morgensprache. Still deg foran ham.',
            gest: 'snakk',
            gjor: 'flagg:kontor-skyldte;lever:kontor-vinsj;ta:kontor-dom',
            til: 'vet',
        },
        vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_VINSJ },
    },
    lonn: 'Fisken er på lagerloftet.',
    belonning: { witten: 1, ferdighet: { styrke: 1 } },
};

// ── 6. Kontorets dom ──
const DOM: OppdragDef = {
    id: 'kontor-dom',
    tittel: 'Kontorets dom',
    giver: 'sekretaeren',
    mottaker: 'oldermannen',
    krav: ['kontor-vinsj'],
    om: 'Oldermannen holder Morgensprache igjen. Still deg foran ham og hør hva Kontoret bestemmer.',
    hvor: 'Schøtstua, foran oldermannen',
    maal: [{ hendelse: 'kontor:dom', tekst: 'Still deg foran oldermannen på Morgensprache' }],
    tilbud: { start: { tekst: 'Still deg foran oldermannen.', gest: 'peke', gjor: 'ta:kontor-dom' } },
    underveis: {
        start: { tekst: 'Oldermannen venter, gutt. Foran ham, ved østveggen.', gest: 'peke' },
    },
    leveringStart: (f) => (f.has('kontor-tilsto') ? 'tilsto' : f.has('kontor-skyldte') ? 'skyldte' : 'riktig'),
    levering: {
        riktig: {
            tekst: 'Du holdt boka ren, selv om fiskeren ba deg om noe annet. Det glemmer jeg ikke. Her, ta disse.',
            gest: 'nikk',
            gjor: 'lever:kontor-dom;rykte:K:+5;witten:+3',
            til: 'riktig2',
        },
        riktig2: {
            tekst: 'Sølve seiler hjem med mer gjeld enn han kom med. Neste sommer kommer han tilbake til oss. Slik er det. Slik holder Kontoret fiskerne.',
            gest: 'skuldre',
            til: 'vet',
        },
        tilsto: {
            tekst: 'Du tok straffen uten å skylde på andre. Det er mer enn mange svenner klarer. Saken er over. Ingen i gården skal snakke om den igjen.',
            gest: 'snakk',
            gjor: 'lever:kontor-dom;rykte:F:+4',
            til: 'tilsto2',
        },
        tilsto2: {
            tekst: 'Sølve får beholde handelen med gården. Saltet står i boka nå. Og du vet hva som skjer neste gang.',
            gest: 'peke',
            til: 'vet',
        },
        skyldte: {
            tekst: 'Sølve er kastet ut fra kaia. Ingen gård på Bryggen kjøper fisken hans mer. Han må seile hjem med det han har.',
            gest: 'snakk',
            gjor: 'lever:kontor-dom;rykte:K:+3;rykte:F:-12',
            til: 'skyldte2',
        },
        skyldte2: {
            tekst: 'Du gikk fri, junge. Men fiskerne fra nord snakker sammen. De vet hvem som skrev i boka.',
            gest: 'skuldre',
            til: 'vet',
        },
        vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_GJELD },
    },
    lonn: 'Kontoret har dømt, og du har sett hvem som bestemmer på Bryggen.',
    belonning: { witten: 2 },
};

export const KONTOR_OPPDRAG: OppdragDef[] = [MORGENSPRACHE, SORTERE, PRUTE, GJELDSBOK, VINSJ, DOM];
