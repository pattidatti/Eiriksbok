// Hva folkene i gården sier: samtalen med husbonden, korte replikker når gutten snakker med de
// andre, og hva de sier når han står i veien.
//
// Husbonden forteller de tre første reglene fra prologen (blueprint §6): ingen ild, ingen kvinner,
// ingen handel på egen hånd. Ildforbudet i gårdene, at hanseatene var ugifte, og at Kontoret hadde
// egne lover og eget styre, er [V] (SNL Det tyske kontor; Hanseatiske museum; Orning). Straffen
// («slag over ryggen») og hvem som gjorde hva er fortalt for 1600- og 1700-tallet [U]; derfor
// slutter samtalen med en «Dette vet vi»-tekst (§3). Ordene og replikkene ellers er [S].

import type { Gest } from '../motor/gestikk';
import type { Fraksjon, Krav } from './oppdrag-data';
import { rykteNaa } from './rpg-data';

export interface Valg {
    tekst: string;
    til: string;
    /** Svaret er låst til gutten har nok rykte, rang, witten eller ferdighet (graboks/rpg.ts). */
    krav?: Krav;
}

export interface Replikk {
    /** Hvem som snakker. Utelatt: den man snakker med. */
    hvem?: string;
    tekst: string;
    /** Svarene gutten kan velge (1, 2, 3). Uten valg: E går videre til `til`, eller slutter. */
    valg?: Valg[];
    til?: string;
    /** En «Dette vet vi»-tekst: hva vi vet, hvor vi vet det fra, og hva vi ikke vet. */
    vet?: boolean;
    /** Gesten den som snakker gjør (gestikk.ts). Uten: velges fra teksten. */
    gest?: Gest;
    /** Noe som skjer når replikken vises: `ta:<oppdrag>`, `lever:<oppdrag>`, `hendelse:<navn>`, `gi:<ting>`, `ta-ting:<ting>`. */
    gjor?: string;
}

/** En samtale: nodene etter id. Den starter i `start`, eller i `mistro` når fiskeren har tatt gutten i juks. */
export type Samtale = Record<string, Replikk>;

/**
 * Det gutten har gjort som folk husker: hvor mange ganger han har jukset på vekta, og om
 * fiskeren har merket det. Et lite forstadium til ryktet i §8.3.
 */
export const SPOR = { juks: 0, tatt: false, baret: 0 };

/**
 * Hvem den man snakker med hører til. Ryktet der velger en kald (`kald`, mistrodd eller hatet) eller
 * varm (`varm`, likt eller æret) start, om samtalen har den noden (rykte-samtaler.ts).
 */
export const SAMTALE_FRAKSJON: Record<string, Fraksjon> = {
    husbonde: 'K',
    fisker: 'F',
    kornselger: 'N',
    borger: 'N',
    skomaker: 'N',
    hovedsmann: 'B',
    jonspresten: 'Ki',
};

/** Hvor en samtale starter, etter det gutten har gjort (SPOR) og ryktet han har. */
export function startNode(id: string, s: Samtale): string {
    if (id === 'fisker' && SPOR.tatt && s.mistro) return 'mistro';
    if (id === 'husbonde' && SPOR.juks > 0 && s.medskyldig) return 'medskyldig';
    if (id === 'husbonde' && SPOR.baret >= 3 && s.flink) return 'flink';
    const f = SAMTALE_FRAKSJON[id];
    if (f) {
        const t = rykteNaa(f);
        if (t < 0 && s.kald) return 'kald';
        if (t > 0 && s.varm) return 'varm';
    }
    return 'start';
}

export const NAVN: Record<string, string> = {
    junge: 'Jungen',
    husbonde: 'Husbonden',
    svenn: 'Svennen',
    dreng: 'Skutedrengen',
    stuedreng: 'Stuedrengen',
    fisker: 'Fiskeren',
    fiskekone: 'Fiskekona',
    kornselger: 'Kornselgeren',
    bondekone: 'Bondekona',
    bodker: 'Bødkeren',
    kjopekone: 'Kona',
    borger: 'Borgeren',
    tjenestejente: 'Tjenestejenta',
    tyv: 'Tyven',
    prest: 'Presten',
    vakt: 'Vakta',
    skriver: 'Skriveren',
    klokker: 'Klokkeren',
    olkone: 'Ølkona',
    skomaker: 'Skomakeren',
    skomakersvenn: 'Skomakersvennen',
    baker: 'Bakeren',
    bakerdreng: 'Bakerdrengen',
    gullsmed: 'Gullsmeden',
    buntmaker: 'Buntmakeren',
    barberer: 'Barbereren',
    smed: 'Smeden',
};

/** Til teksten «E: Snakk med …». */
export const BESTEMT: Record<string, string> = {
    junge: 'jungen',
    husbonde: 'husbonden',
    svenn: 'svennen',
    dreng: 'skutedrengen',
    stuedreng: 'stuedrengen',
    fisker: 'fiskeren',
    fiskekone: 'fiskekona',
    kornselger: 'kornselgeren',
    bondekone: 'bondekona',
    bodker: 'bødkeren',
    kjopekone: 'kona',
    borger: 'borgeren',
    tjenestejente: 'tjenestejenta',
    tyv: 'tyven',
    prest: 'presten',
    vakt: 'vakta',
    skriver: 'skriveren',
    klokker: 'klokkeren',
    olkone: 'ølkona',
    skomaker: 'skomakeren',
    skomakersvenn: 'skomakersvennen',
    baker: 'bakeren',
    bakerdreng: 'bakerdrengen',
    gullsmed: 'gullsmeden',
    buntmaker: 'buntmakeren',
    barberer: 'barbereren',
    smed: 'smeden',
};

const REGLER = 'Hvilke regler gjelder her?';

const VET_SKOSTREDET = 'Skostredet gikk rundt bunnen av Vågen. Det var den nordligste veien mellom Bryggen og Stranden. Langs gata sto det opptil 36 skomakerboder med to skomakere i hver, og de hadde egne brygger mot Vågen. De fleste var tyskere. De tyske håndverkerne i Bergen var delt i fem lag, kalt amt: skomakere, bakere, gullsmeder, buntmakere (de syr pels) og barberere. Skomakerne var sterkest. I 1507 nektet de til og med hertug Christian å gå gjennom gata. Hvordan bodene så ut innvendig, og hvem som sto i dem i 1420-årene, vet vi ikke. Det er laget for spillet.';

export const SAMTALER: Record<string, Samtale> = {
    husbonde: {
        start: {
            tekst: 'Der er du, junge. Det er det du er nå: en junge, den yngste i gården. Du gjør det du får beskjed om, og du spør når du ikke skjønner.',
            valg: [
                { tekst: 'Hva skal jeg gjøre?', til: 'arbeid' },
                { tekst: 'Hvem bestemmer her?', til: 'makt' },
                { tekst: REGLER, til: 'regel1' },
            ],
        },
        arbeid: {
            tekst: 'Du bærer fisk fra kaia og inn i bua. Du henter vann og ved til schøtstua. Og du lærer å telle, for her teller vi alt.',
            valg: [
                { tekst: 'Hva er det vi teller?', til: 'telle' },
                { tekst: REGLER, til: 'regel1' },
            ],
        },
        telle: {
            tekst: 'Tørrfisk. Den kommer fra nord med jektene, og vi veier den i våger. En våg er omtrent det du klarer å bære. Fiskerne får korn, mel og øl tilbake.',
            til: 'telle2',
        },
        telle2: {
            tekst: 'Det de ikke kan betale med en gang, skriver jeg her i boka. Det er gjelda deres.',
            valg: [
                { tekst: 'Hva om de aldri klarer å betale?', til: 'gjeld' },
                { tekst: REGLER, til: 'regel1' },
            ],
        },
        gjeld: {
            tekst: 'Da står gjelda der til neste sommer, og sommeren etter. Slik vet vi at de kommer tilbake med fisken sin. Til oss, og ikke til noen andre.',
            valg: [{ tekst: REGLER, til: 'regel1' }],
        },
        makt: {
            tekst: 'Her på Kontoret har vi egne lover. Vi har oldermenn og et råd, og jeg er husbonde for denne stua.',
            til: 'makt2',
        },
        makt2: {
            tekst: 'Oppe på Bergenhus sitter høvedsmannen, kongens fremste mann i byen. Han liker ikke at vi har egne lover. Men han trenger kornet vårt, som alle andre.',
            valg: [
                { tekst: 'Hva skal jeg gjøre?', til: 'arbeid' },
                { tekst: REGLER, til: 'regel1' },
            ],
        },
        regel1: {
            tekst: 'Tre ting, og dem skal du huske. Ingen ild i gården. Bare i schøtstua bakerst, der vi lager mat og varmer oss. Hele byen er bygget av tre, og den har brent før.',
            til: 'regel2',
        },
        regel2: {
            tekst: 'Ingen kvinner. Alle vi som bor her, er ugifte menn og gutter. Slik blir det så lenge du bor på Bryggen.',
            til: 'regel3',
        },
        regel3: {
            tekst: 'Og ingen handel for egen regning. Alt du bærer, veier og skriver, hører gården til. Bryter du en regel, får du slag over ryggen.',
            valg: [
                { tekst: 'Jeg skal huske det.', til: 'slutt' },
                { tekst: 'Og hvis jeg glemmer det?', til: 'glemme' },
            ],
        },
        glemme: {
            tekst: 'Da er det ryggen din som husker det for deg. Gå ned på kaia og hjelp skutedrengen. Fisken bærer seg ikke selv.',
            til: 'vet',
        },
        slutt: {
            tekst: 'Godt. Gå ned på kaia og hjelp skutedrengen. Fisken bærer seg ikke selv.',
            til: 'vet',
        },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            tekst: 'At det var forbudt med ild i gårdene, at hanseatene ikke giftet seg, og at Kontoret hadde egne lover, vet vi fra kildene. Mye av det vi vet om hvordan guttene levde og ble straffet, er skrevet ned på 1600- og 1700-tallet. Vi vet ikke sikkert om alt var likt i 1420-årene.',
        },
    },
};

// Fiskeren: «Jekta kommer» fra blueprint §7.2, handelen sett fra hans side. Tørrfisk som over
// 80 prosent av eksporten på 1300-tallet, korn og utstyr «på bok» og gjeld i årevis er [V] (§4.3).
// Navnet, Lofoten og hans egen gjeld er [S]. At jektene seilte sørover om sommeren er [V/U].
SAMTALER.fisker = {
    start: {
        tekst: 'Du er ny her, ser jeg. Jeg heter Ottar. Jeg har seilt hele veien fra Lofoten med fisken min. Mange uker sørover langs kysten.',
        valg: [
            { tekst: 'Hva får du for fisken?', til: 'korn' },
            { tekst: 'Hvorfor selger du den til oss?', til: 'gjeld' },
        ],
    },
    korn: {
        tekst: 'Korn og mel, mest. Salt, hamp til garn og litt øl. Det vokser nesten ikke korn der jeg bor. Uten kornet fra dere sulter vi om vinteren.',
        valg: [{ tekst: 'Hvorfor selger du den til oss?', til: 'gjeld' }],
    },
    gjeld: {
        tekst: 'Fordi jeg skylder husbonden din. I fjor var fisket dårlig. Jeg fikk korn likevel, men han skrev det i boka. Nå betaler jeg med årets fisk.',
        til: 'gjeld2',
    },
    gjeld2: {
        tekst: 'Blir fisket dårlig i år også, skylder jeg enda mer neste sommer. Faren min skyldte også. Det er slik det går.',
        valg: [
            { tekst: 'Kan du ikke selge til noen andre?', til: 'andre' },
            { tekst: 'Er vekta riktig?', til: 'vekt' },
        ],
    },
    andre: {
        tekst: 'Hvem skulle det være? Det er her kornet kommer inn. Og den som skylder, kan ikke velge hvem han handler med.',
        til: 'vet',
    },
    vekt: {
        tekst: 'Jeg veide fisken selv før jeg dro. Men her er det deres bismer og deres lodd. Du får tenke selv på hva det betyr, gutt.',
        til: 'vet',
    },
    vet: {
        hvem: 'Dette vet vi',
        vet: true,
        tekst: 'Tørrfisk var over 80 prosent av det Norge solgte til utlandet på 1300-tallet. Fiskerne i nord fikk korn og utstyr med en gang og betalte med fisk senere. Mange satt i gjeld til kjøpmennene i Bergen i årevis. Hvor stor gjelda var for en vanlig fisker i 1420-årene, vet vi ikke sikkert.',
    },
};

// Husbonden når gutten har båret og veid, og når han har jukset for gården [S]. Spillet handler om
// hva gutten blir med på (§2): her får han ros for å holde munn.
SAMTALER.husbonde.flink = {
    tekst: 'Du har båret og veid. Bra, junge. Men husk det jeg sa: det er gårdens fisk du bærer, ikke din.',
    valg: [
        { tekst: 'Hvilke regler var det igjen?', til: 'regel1' },
        { tekst: 'Hva er det vi teller?', til: 'telle' },
    ],
};
SAMTALER.husbonde.medskyldig = {
    tekst: 'Svennen sier du gjorde som han sa ved bismeren. Det er bra. Den som kan holde munn, blir svenn selv en dag.',
    valg: [
        { tekst: 'Fiskeren fikk betalt for mindre enn han leverte.', til: 'medskyldig2' },
        { tekst: 'Takk, husbonde.', til: 'medskyldig3' },
    ],
};
SAMTALER.husbonde.medskyldig2 = {
    tekst: 'Han skylder oss mer enn det. Og uten kornet vårt hadde han sultet i vinter. Tenk på det før du synes synd på ham.',
    til: 'vetgjeld',
};
SAMTALER.husbonde.medskyldig3 = {
    tekst: 'Gå og bær mer. Og husk hvem som gir deg mat.',
    til: 'vetgjeld',
};
SAMTALER.husbonde.vetgjeld = {
    hvem: 'Dette vet vi',
    vet: true,
    tekst: 'Kontoret styrte både kornet som kom til Bergen og kjøpet av tørrfisk, og mange fiskere satt i gjeld til kjøpmennene. Hva en husbonde sa til jungene sine, er ikke skrevet ned. Samtalen er laget for spillet.',
};

// Juks på vekta (§7.1): svennen ber gutten lese av for lite på fisken til nordlendingen [S]. At
// bylova av 1276 fastsatte bismerpundet, er [V]; om og hvor ofte noen jukset på Bryggen, vet vi ikke [U].
SAMTALER.fisker.mistro = {
    tekst: 'Du. Den bunten veide mer enn du sa. Jeg veide den selv hjemme, og jeg så hvor hanken sto.',
    valg: [
        { tekst: 'Svennen sa jeg skulle gjøre det.', til: 'mistro2' },
        { tekst: 'Du så feil.', til: 'mistro3' },
    ],
};
SAMTALER.fisker.mistro2 = {
    tekst: 'Det tror jeg på. Men det var du som holdt i bismeren. Neste år husker jeg ansiktet ditt, gutt.',
    til: 'vetvekt',
};
SAMTALER.fisker.mistro3 = {
    tekst: 'Jeg har veid fisk i tretti år. Jeg kan ikke gjøre noe med det her. Det vet du, og det vet han som sendte deg.',
    til: 'vetvekt',
};
SAMTALER.fisker.vetvekt = {
    hvem: 'Dette vet vi',
    vet: true,
    tekst: 'Bylova fra 1276 bestemte hvor tungt et bismerpund skulle være, så alle skulle veie likt. Fiskerne var avhengige av kjøpmennene som veide fisken. Om noen jukset med vekta på Bryggen i 1420-årene, og hvor ofte, vet vi ikke.',
};

// Kornselgeren på torget: «Kontoret styrte kornimporten» og «jektene førte bygg, havre, hvete og
// hamp nordover» er [V] (blueprint §4.3). At gutten kom med koggen fra Lübeck, er prologen (§6).
// At en norsk kremmer kjøpte korn av Kontoret og solgte det videre på torget, er [S]; prisene er [U].
SAMTALER.kornselger = {
    start: {
        tekst: 'Korn! Bygg, havre og hvete! Vil du kjøpe, gutt, eller bare se?',
        valg: [
            { tekst: 'Hvor kommer kornet fra?', til: 'fra' },
            { tekst: 'Hvem bestemmer prisen?', til: 'kontoret' },
        ],
    },
    fra: {
        tekst: 'Det kommer med koggene fra de tyske byene. Fra Lübeck, der du kommer fra, og fra de andre hansabyene. En hansaby er en by som er med i handelsforbundet til tyskerne.',
        til: 'fra2',
    },
    fra2: {
        tekst: 'Mye av kornet blir ikke her. Jektene tar det med nordover til fiskerne, og kommer tilbake med tørrfisk.',
        valg: [{ tekst: 'Hvem bestemmer prisen?', til: 'kontoret' }],
    },
    kontoret: {
        tekst: 'Kjøpmennene på Bryggen, de som kaller seg Kontoret. De styrer kornet som kommer til byen. Jeg kjøper av dem og selger videre her på torget.',
        til: 'kontoret2',
    },
    kontoret2: {
        tekst: 'Så når kornet blir dyrt, er det ikke jeg som har bestemt det. Det er husbonden din og de andre i gårdene.',
        // Gutten lærer hvordan prisen blir til: én øvelse i pruting (rpg.ts teller den høyst én gang i minuttet).
        gjor: 'ferdighet:prute',
        valg: [
            { tekst: 'Er det urettferdig?', til: 'rett' },
            { tekst: 'Takk. Jeg må gå.', til: 'vet' },
        ],
    },
    rett: {
        tekst: 'Det sier du ikke høyt her, gutt. Uten kornet deres sulter vi. Men det er de som har makta over det, ikke vi som bor i byen.',
        til: 'vet',
    },
    vet: {
        hvem: 'Dette vet vi',
        vet: true,
        tekst: 'Det tyske kontor styrte kornet som kom til Bergen, og saltet fiskerne trengte. Jektene tok korn med seg nordover og kom tilbake med tørrfisk. Vi vet ikke hvordan handelen på torget foregikk i 1420-årene, eller hva kornet kostet.',
    },
};

// Borgeren: et norsk syn på tyskerne. At omtrent en av ti av Bergens ca. 10 000 innbyggere var
// tyskere, at de var ugifte og hadde egne lover, at høvedsmannen ikke likte det, og at det var
// strid mellom Kontoret og norske borgere og håndverkere, er [V] (blueprint §3, §4.2). Hva han
// mener og hvordan han sier det, er [S]. «Byen er farlig om natta» bygger på at mange ugifte menn
// ga mye kriminalitet [V Orning], sagt forsiktig.
SAMTALER.borger = {
    start: {
        tekst: 'Du er en av de nye guttene fra Bryggen, ser jeg. Det synes på klærne. Og du snakker tysk.',
        valg: [
            { tekst: 'Hva synes du om oss tyskere?', til: 'syn' },
            { tekst: 'Hvor mange tyskere bor her?', til: 'antall' },
        ],
    },
    antall: {
        tekst: 'Én av ti i byen er tysker, sier folk. Dere bor sammen på Bryggen, med egne lover og eget styre. Det er nesten en egen by inni byen vår.',
        valg: [{ tekst: 'Hva synes du om oss tyskere?', til: 'syn' }],
    },
    syn: {
        tekst: 'Jeg er borger her. Det betyr at jeg bor i byen og har lov til å drive handel her. Og jeg handler med dere, for dere har kornet. Uten det sulter vi.',
        til: 'syn2',
    },
    syn2: {
        tekst: 'Men dere gifter dere ikke, og dere holder dere for dere selv. Mange unge menn uten familie i samme by. Folk sier at Bergen er farlig å gå i om natta.',
        valg: [
            { tekst: 'Er alle tyskere slik?', til: 'alle' },
            { tekst: 'Hvem har makta i byen?', til: 'makt' },
        ],
    },
    alle: {
        tekst: 'Nei. Jeg kjøper øl av en tysker som aldri har lurt meg. Det er ikke hver enkelt av dere jeg er sint på. Det er Kontoret.',
        til: 'makt',
    },
    makt: {
        tekst: 'Kontoret har kornet og egne lover. Høvedsmannen oppe på Bergenhus, kongens fremste mann i byen, liker det ikke. Ikke vi heller. Men det er ikke vi som bestemmer.',
        til: 'vet',
    },
    vet: {
        hvem: 'Dette vet vi',
        vet: true,
        tekst: 'Omtrent en av ti av de rundt 10 000 menneskene i Bergen var tyskere. De bodde på Bryggen med egne lover og giftet seg ikke med norske kvinner. Det var strid mellom Kontoret og norske borgere og håndverkere. Hva vanlige bergensere tenkte om tyskerne i 1420-årene, er nesten ikke skrevet ned. Det borgeren sier her, er laget for spillet.',
    },
};

// Skomakeren i Skostredet: gata, amtene og bommen. Fakta fra Byleksikon «Skostredet» og Wikipedia
// (de fem amtene) [V]; samtalen er [S].
SAMTALER.skomaker = {
    start: {
        tekst: 'Sko, junge? Nei, du har ikke penger. Men du kan se på. Her syr vi sko til halve byen.',
        valg: [
            { tekst: 'Hvorfor er det så mange skomakere her?', til: 'mange' },
            { tekst: 'Er dere tyskere, som på Kontoret?', til: 'tyske' },
            { tekst: 'Hvorfor ligger det en bom over gata?', til: 'bom' },
        ],
    },
    mange: {
        tekst: 'Hele gata er skomakere. Over tretti boder, to mann i hver. Derfor heter den Skostredet.',
        valg: [
            { tekst: 'Er dere tyskere, som på Kontoret?', til: 'tyske' },
            { tekst: 'Takk, mester.', til: 'vet' },
        ],
    },
    tyske: {
        tekst: 'Tyskere, ja. Men vi hører ikke til Kontoret. Vi har vårt eget amt, et lag bare for skomakere. Bakerne, gullsmedene, buntmakerne og barbererne har hvert sitt.',
        valg: [
            { tekst: 'Hvorfor ligger det en bom over gata?', til: 'bom' },
            { tekst: 'Takk, mester.', til: 'vet' },
        ],
    },
    bom: {
        tekst: 'Gata er vår. Når amtet vil det, legger vi en bom over den. Da kommer ingen fra Bryggen til Stranden denne veien, samme hvem de er.',
        til: 'vet',
    },
    vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_SKOSTREDET },
};

// Skomakersvennen ved bommen over Skostredet: skomakerne kunne sperre gata [V Byleksikon]. At den
// er sperret akkurat nå, er [S]: det holder spilleren innenfor byen som er bygget.
SAMTALER.sperring = {
    start: {
        tekst: 'Stopp der, junge. Her går du ikke forbi.',
        valg: [
            { tekst: 'Hvorfor ikke?', til: 'hvorfor' },
            { tekst: 'Jeg skal bare til Stranden.', til: 'stranden' },
        ],
    },
    hvorfor: {
        tekst: 'Mesterne har bestemt at bommen skal ligge i dag. Skostredet er skomakernes gate, ikke Kontorets.',
        til: 'vet',
    },
    stranden: {
        tekst: 'Da får du ta båten over Vågen. Ferja går fra kaia foran gårdene.',
        til: 'vet',
    },
    vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_SKOSTREDET },
};


/** Det de sier når gutten snakker med dem (uten en egen samtale). */
export const REPLIKKER: Record<string, string[]> = {
    husbonde: ['Står du og glaner? Fisken bærer seg ikke selv.', 'Tell to ganger og skriv én gang. Da blir det riktig.'],
    svenn: [
        'I kveld lærer jeg deg å regne. Da er det ingen som lurer deg på vekta.',
        'Jeg var junge selv en gang. Det går over.',
        'Hold deg unna ilden, junge. Den hører til i schøtstua.',
    ],
    dreng: [
        'En bunt veier nesten like mye som deg. Vent til du har båret en hel dag.',
        'Jekta fra nord kom i går. Det blir fisk å bære hele uka.',
        'Rottene var i stabelen igjen i natt.',
    ],
    stuedreng: [
        'Gryta må ikke koke over. Da får jeg juling.',
        'Ved og vann, ved og vann. Det er det jeg gjør hele dagen.',
        'Du er ny, du. Da får du vaske gryta i kveld.',
    ],
    fisker: ['Jeg skal se på kirka før jeg seiler hjem.', 'Byen er stor, men jeg savner havet hjemme.'],
    fiskekone: [
        'Tørrfisk! Fin fisk fra nord!',
        'Legg den i vann noen dager før du koker den. Da blir den myk.',
        'Du har ikke penger, du. Gå videre.',
    ],
    bondekone: [
        'Egg og erter, rett fra gården!',
        'Jeg rodde inn til byen i morges, før det ble lyst.',
        'Ikke klem på eggene, gutt.',
    ],
    bodker: [
        'Jeg er bødker. Jeg lager tønner av staver og bånd.',
        'Uten tønner kommer verken øl eller tran noen vei.',
        'En god tønne lekker ikke en dråpe.',
    ],
    kjopekone: ['Fisken er dyr i dag.', 'Har du ikke noe arbeid å gjøre, gutt?', 'Skal du handle, eller står du bare der?'],
    klokker: [
        'Lysene skal brenne til messen er over. Ikke blås på dem, gutt.',
        'Jeg ringer klokkene. Hører du dem fra Bryggen?',
        'Ta av deg hetta når du er i Guds hus.',
    ],
    olkone: [
        'Øl får du ikke, gutt. Kom igjen når du har penger.',
        'Her drikker bergensere, ikke tyskere. Dere har deres egne stuer.',
        'Hold deg unna ilden, den er varm.',
    ],
    borger: ['Øvregaten er vår gate. Bryggen er deres.', 'Gå hjem til Kontoret, gutt.'],
    prest: ['Gud være med deg, gutt.'],
    vakt: ['Gå videre.'],
    skriver: ['Jeg har mye å skrive. Gå nå.'],
    skomaker: [
        'Sko slites fort i gjørma her. Det er bra for oss skomakere.',
        'Vi er to i hver bod. Han der lærer faget av meg.',
        'Sko til Kontoret, sko til borgerne. Alle trenger sko.',
    ],
    skomakersvenn: [
        'Tråden trekkes gjennom hullet med to nåler, en fra hver side. Se.',
        'Jeg kom fra Lübeck for å lære faget her.',
        'Mester sier at jeg kan bli mester selv om noen år.',
    ],
    baker: [
        'Brød! Varmt brød fra ovnen!',
        'Kornet kommer med koggene. Uten korn, ikke noe brød.',
        'Ovnen er av stein. Ild i et trehus må passes godt på.',
    ],
    bakerdreng: ['Jeg står opp før det er lyst og fyrer i ovnen.', 'Vil du kjøpe brød? Nei? Gå videre da.'],
    gullsmed: [
        'Ikke ta på noe, gutt. Dette er sølv.',
        'Jeg lager spenner, ringer og begre til dem som har råd.',
        'Essa er liten, men den blir varm nok til å smelte sølv.',
    ],
    buntmaker: [
        'Pels fra nord: rev, ekorn og mår. Vi syr den til kåper og fór.',
        'Om vinteren vil alle ha pels. Da har vi det travelt.',
        'Kjenn hvor mykt ekornskinnet er. Nei, ikke med de skitne hendene.',
    ],
    barberer: [
        'Jeg barberer, klipper hår og trekker tenner. Og jeg årelater de syke.',
        'Sitt stille, ellers skjærer jeg deg.',
        'Har du vondt i en tann, gutt? Jeg har tanga her.',
    ],
    smed: [
        'Hestesko, spiker, kroker til buene. Alt av jern lages her.',
        'Jeg er bergenser, ikke tysker. Smia er min egen.',
        'Gå unna essa. Gnistene brenner hull i kjortelen.',
    ],
    tjenestejente: [
        'Vannet er tungt. Jeg går denne veien mange ganger om dagen.',
        'Ikke dytt, da søler jeg.',
        'Fruen min vil ha vannet før det blir mørkt.',
    ],
};

/** Når gutten står i veien. */
export const VEI: Record<string, string[]> = {
    husbonde: ['Står du i veien for meg, junge?'],
    svenn: ['Til side, junge!', 'Har du ikke noe å gjøre?'],
    dreng: ['Flytt deg! Denne er tung.', 'Gå til side, junge!'],
    stuedreng: ['Pass deg!', 'Flytt deg, da!'],
    fisker: ['Gå til side, gutt.'],
    kjopekone: ['Pass deg, gutt!', 'Flytt deg, jeg skal forbi.'],
    borger: ['Til side, tyskergutt.', 'Gå av veien!'],
    tjenestejente: ['Flytt deg, da!', 'Pass deg, jeg bærer vann.'],
    skomakersvenn: ['Til side, junge!', 'Skinnene er tunge. Flytt deg.'],
    bakerdreng: ['Pass deg, brødet!'],
};

/** Velger en replikk som skifter med tiden, så det ikke er den samme hver gang. */
export function trekk(liste: string[] | undefined, t: number): string {
    if (!liste?.length) return '...';
    return liste[Math.floor(t * 7.31) % liste.length];
}
