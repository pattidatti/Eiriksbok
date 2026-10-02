// Hva folkene i gården sier: samtalen med husbonden, korte replikker når gutten snakker med de
// andre, og hva de sier når han står i veien.
//
// Husbonden forteller de tre første reglene fra prologen (blueprint §6): ingen ild, ingen kvinner,
// ingen handel på egen hånd. Ildforbudet i gårdene, at hanseatene var ugifte, og at Kontoret hadde
// egne lover og eget styre, er [V] (SNL Det tyske kontor; Hanseatiske museum; Orning). Straffen
// («slag over ryggen») og hvem som gjorde hva er fortalt for 1600- og 1700-tallet [U]; derfor
// slutter samtalen med en «Dette vet vi»-tekst (§3). Ordene og replikkene ellers er [S].

import type { Gest } from '../motor/gestikk';

export interface Valg {
    tekst: string;
    til: string;
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

/** Hvor en samtale starter, etter det gutten har gjort (SPOR). */
export function startNode(id: string, s: Samtale): string {
    if (id === 'fisker' && SPOR.tatt && s.mistro) return 'mistro';
    if (id === 'husbonde' && SPOR.juks > 0 && s.medskyldig) return 'medskyldig';
    if (id === 'husbonde' && SPOR.baret >= 3 && s.flink) return 'flink';
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
};

const REGLER = 'Hvilke regler gjelder her?';

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
};

/** Velger en replikk som skifter med tiden, så det ikke er den samme hver gang. */
export function trekk(liste: string[] | undefined, t: number): string {
    if (!liste?.length) return '...';
    return liste[Math.floor(t * 7.31) % liste.length];
}
