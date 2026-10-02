// Hva folkene i gården sier: samtalen med husbonden, korte replikker når gutten snakker med de
// andre, og hva de sier når han står i veien.
//
// Husbonden forteller de tre første reglene fra prologen (blueprint §6): ingen ild, ingen kvinner,
// ingen handel på egen hånd. Ildforbudet i gårdene, at hanseatene var ugifte, og at Kontoret hadde
// egne lover og eget styre, er [V] (SNL Det tyske kontor; Hanseatiske museum; Orning). Straffen
// («slag over ryggen») og hvem som gjorde hva er fortalt for 1600- og 1700-tallet [U]; derfor
// slutter samtalen med en «Dette vet vi»-tekst (§3). Ordene og replikkene ellers er [S].

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
}

/** En samtale: nodene etter id. Den starter i `start`. */
export type Samtale = Record<string, Replikk>;

export const NAVN: Record<string, string> = {
    junge: 'Jungen',
    husbonde: 'Husbonden',
    svenn: 'Svennen',
    dreng: 'Skutedrengen',
    stuedreng: 'Stuedrengen',
    fisker: 'Fiskeren',
};

/** Til teksten «E: Snakk med …». */
export const BESTEMT: Record<string, string> = {
    junge: 'jungen',
    husbonde: 'husbonden',
    svenn: 'svennen',
    dreng: 'skutedrengen',
    stuedreng: 'stuedrengen',
    fisker: 'fiskeren',
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
};

/** Når gutten står i veien. */
export const VEI: Record<string, string[]> = {
    husbonde: ['Står du i veien for meg, junge?'],
    svenn: ['Til side, junge!', 'Har du ikke noe å gjøre?'],
    dreng: ['Flytt deg! Denne er tung.', 'Gå til side, junge!'],
    stuedreng: ['Pass deg!', 'Flytt deg, da!'],
    fisker: ['Gå til side, gutt.'],
};

/** Velger en replikk som skifter med tiden, så det ikke er den samme hver gang. */
export function trekk(liste: string[] | undefined, t: number): string {
    if (!liste?.length) return '...';
    return liste[Math.floor(t * 7.31) % liste.length];
}
