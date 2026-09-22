// Prøvebanen: stedet vi tester basissystemene på.
//
// Dette er verktøy, ikke fagstoff. Hallen har en portal som heter «Test meg»,
// og bak den ligger ett kart der hvert system i motoren står oppstilt som en
// stasjon eleven - altså vi - kan gå bort til og prøve: lese, snakke, få
// oppdrag, handle, åpne kiste, ro, slåss, møte boss.
//
// Grunnen til at dette er et eget *sted* og ikke en knapp i en meny: systemene
// henger sammen i verden, ikke i koden. En dialog som virker i en enhetstest
// kan likevel kjempe med portallaget om hintlinja. Det ser man bare ved å stå
// der.
//
// Stedet har sin egen epoke-id, `testbanen`, og det er det viktigste valget
// her. Storen legger hver epoke i sitt eget navnerom, så alt vi gjør i
// sandkassen - nivå, sølv, sekk, oppdrag, leste landemerker - havner i sin
// egen bunke og rører ikke vikingtidskampanjen eleven har gående. Epoken står
// med vilje *ikke* i `EPOKER`: ble den lagt inn der, ville `hub.ts` regnet ut
// en plass til den på tidslinjen eller i lunden, og en sandkasse hører
// ingen av stedene. Følgen er at `regelsettFor` faller tilbake på
// vikingtidens regelsett, og det er riktig: vi tester det settet som finnes.
//
// Én følge er verdt å kjenne til: hallen ligger utenfor alle epoker og bytter
// derfor ingenting. Går man ut porten herfra, står sandkassens tall i HUD-en
// mens man er i hallen - akkurat som vikingtidens tall står der når man kommer
// hjem fra Nordvik. Kampanjen hentes hel fram igjen i det man går inn i
// Vikingtiden. `verify-rpg-testbanen.mjs` måler nettopp det.
//
// Rutene står her og ikke i generatoren fordi generatoren må rydde plass til
// dem. Samme grep som `hub.ts`.

import type {
    AuthoredQuest,
    BankQuestion,
    FarkostDef,
    LandmarkDef,
    NpcDef,
    Tema,
} from '../types';

export const TESTBANE_SIZE = { bredde: 72, hoyde: 36 };

/** Der eleven står ved ankomst: midt på tunet, med porten hjem i syne. */
export const TESTBANE_SPAWN: [number, number] = [8, 18];

/** Porten tilbake til hallen. Nord for spawn, så veien ut er synlig med en gang. */
export const TESTBANE_PORTAL: [number, number] = [6, 14];

/**
 * Hovedveien østover, i ruter. Tunet ligger i vest, slagmarka i øst, og
 * avstanden mellom dem er ikke pynt - se `SPAWN_FELT`.
 */
export const VEI_Y = 18;

/** Tunet: det brolagte feltet der alle de fredelige stasjonene står. */
export const TUNET = { x0: 4, y0: 12, x1: 22, y1: 24 };

/** Vannet, så farkostlaget har noe å prøve seg på. Ellipse, i ruter. */
export const TJERNET = { x: 34, y: 28, rx: 7, ry: 4.5 };

/** Bossens plass, i ruter. */
export const BOSS_RUTE: [number, number] = [60, 18];

/**
 * Feltet fiender får dukke opp i.
 *
 * Grensa på x=50 er regnet ut, ikke valgt: fiendelaget setter bare ut noen
 * mellom 200 og 420 piksler fra eleven, altså 12,5 og 26 ruter. Står hun ved
 * den østligste stasjonen på tunet (x=22), er nærmeste rute her 28 ruter unna,
 * og da kommer ingen. Tunet er trygt så lenge man blir på det, og motstanden
 * begynner når man går ut i feltet. Det er hele poenget med å ha to soner:
 * dialog og handel skal kunne testes uten en øksekar i ryggen.
 */
export const SPAWN_FELT = { x0: 50, y0: 5, x1: 67, y1: 31 };

/**
 * Paletten. Lys og flat med vilje: en sandkasse skal være lett å lese, ikke
 * stemningsfull. Ingen `lys`- eller `vaer`-blokk - da ser vi fargene motoren
 * faktisk legger på, uten et filter som kan skjule en feil.
 */
export const TESTBANE_TEMA: Tema = {
    gress: '#5f8a52',
    stein: '#9aa0a8',
    vann: '#3a7aa0',
    himmel: '#bcd6e8',
    sand: '#d8cca8',
    jord: '#8a7a60',
    aker: '#8a7a48',
    tommer: '#7a6348',
    tak: '#6a7a58',
    lov: '#4f8a55',
};

export const TESTBANE_NPCS: NpcDef[] = [
    {
        id: 'provemester',
        name: 'Prøvemesteren',
        role: 'Han som deler ut oppdrag som ikke betyr noe',
        tile: [11, 14],
        ser: 'ned',
        palette: { tunic: '#4a5f7a', trim: '#d8c88a', hair: '#5a4a3a' },
        smalltalk: [
            'Her går ingenting galt for alvor. Prøv det du vil.',
            'Snakk med meg igjen hvis du vil ha et oppdrag å teste.',
            'Kremmeren står sør for meg. Kista står øst for henne.',
        ],
        // Svaret på oppdraget under står her. Regelen fra Nordvik gjelder også
        // i sandkassen: et oppdrag uten et svar i verden er et oppdrag som
        // ikke kan testes - man kan bare gjette seg gjennom det.
        kunnskap: [
            {
                tekst: 'Et ting var stedet frie menn møttes for å dømme i saker og vedta lover. Høyt, foran alle.',
                stikkord: ['ting', 'lov', 'dom'],
                begrep: 'sed',
            },
            {
                tekst: 'Vil du teste minnetreet: les runesteinen øst for meg. Den løfter et begrep helt til forstått.',
                stikkord: ['minnetre', 'begrep'],
            },
        ],
    },
    {
        id: 'provekremmer',
        name: 'Bergljot Prøvekremmer',
        role: 'Hun som har alt på lager',
        tile: [15, 22],
        ser: 'opp',
        palette: { tunic: '#8a5a2f', trim: '#e8c96a', hair: '#3a2a1a' },
        smalltalk: [
            'Jeg fører alt. Det er derfor jeg står her.',
            'Har du ikke sølv, felle en fiende i feltet øst.',
        ],
        // Hele varelisten, ikke et utvalg. Boden er stedet vi ser om et nytt
        // våpen eller en ny rustning faktisk kan kjøpes, utrustes og tegnes -
        // og da må alle sammen være å få tak i ett sted.
        handler: {
            velkomst: 'Alt jeg har, står framme. Kjøp det du skal prøve.',
            varer: [
                'ovingssverd',
                'rustet-oks',
                'bjorkestav',
                'jaktbue',
                'sagasverd',
                'tingspyd',
                'runestav',
                'minnehammer',
                'vadmelskjortel',
                'lerbrynje',
                'ringbrynje',
                'glemselskappen',
                'kvernstein',
                'skaldering',
                'bjornetann',
                'minnestein',
            ],
        },
    },
];

export const TESTBANE_LANDMARKS: LandmarkDef[] = [
    {
        id: 'test-skilt',
        kind: 'skilt',
        tile: [10, 22],
        title: 'Oppslagstavla',
        text:
            'PRØVEBANEN\n\n' +
            'Ingenting her er fagstoff. Stedet finnes for å prøve systemene i motoren, ett om gangen.\n\n' +
            'På tunet: Prøvemesteren gir oppdrag, Bergljot selger alt, kista gir sølv, runesteinen gir et begrep til minnetreet, bålet brenner.\n\n' +
            'Sørover: tjernet med robåten.\n\n' +
            'Østover: feltet der fiender kommer av seg selv, og bossen lengst ute.\n\n' +
            'Tunet er trygt. Motstanden begynner når du går ut i feltet.',
        stikkord: ['prøvebanen', 'testbanen'],
    },
    {
        id: 'test-runestein',
        kind: 'runestein',
        tile: [16, 14],
        title: 'Prøvesteinen',
        text:
            'En kilde som er laget i samme tid som det den forteller om, kalles en samtidig kilde. Den som skrev, var der.\n\n' +
            'Leser du dette, skal begrepet stå som forstått i minnetreet. Gjør det ikke det, er det treet som er i stykker - ikke steinen.',
        stikkord: ['samtidig kilde'],
        begrep: { id: 'samtidig-kilde', niva: 'forstatt' },
    },
    {
        id: 'test-baal',
        kind: 'baal',
        tile: [6, 21],
        title: 'Prøvebålet',
        text: 'Et bål som brenner uten å varme noen. Det står her for at vi skal se at flammene animeres, og at lyset legger seg riktig i tåka.',
    },
    {
        id: 'test-kiste',
        kind: 'kiste',
        tile: [20, 22],
        title: 'Prøvekista',
        text:
            'En kiste med litt sølv i. Ta det, så har du noe å handle for hos Bergljot.\n\n' +
            'Kista er her for valgsystemet: knappen setter et flagg, teksten byttes ut, og sølvet legges til. Skjer bare én av de tre tingene, vet vi hvilken.',
        valg: {
            id: 'test-kiste-tom',
            knapp: 'Ta sølvet',
            flagg: 'test:kiste-tomt',
            etterpa: 'Kista står åpen. Flagget er satt.',
            solv: 200,
        },
    },
];

/**
 * Robåten på tjernet. Ligger i den nordligste vannruta, med tørt land rett
 * nord for seg, så man kan gå helt fram til den og gå om bord.
 */
export const TESTBANE_FARKOSTER: FarkostDef[] = [
    {
        id: 'test-baat',
        navn: 'prøvebåten',
        art: 'baat',
        tile: [34, 24],
        seter: 1,
        fart: 74,
        treghet: 620,
    },
];

/** Spørsmålet i prøveoppdraget. Svaret står hos Prøvemesteren selv. */
const TEST_SPORSMAL: BankQuestion = {
    id: 'testbane-h0',
    question: 'Hva var et ting i vikingtiden?',
    options: [
        'Et møte der frie menn dømte i saker og vedtok lover',
        'Et marked der folk byttet varer',
        'Kongens private råd',
        'En gravplass for høvdinger',
    ],
    correct: 0,
    explanation: 'På tinget møttes frie menn. Der ble tvister avgjort og lover vedtatt - høyt, foran alle.',
    subjectId: 'historie',
    topicId: 'vikingtiden',
    lessonId: 'samfunn-og-rett',
    lessonTitle: 'Samfunn og Rett i vikingtiden',
    link: '/historie/vikingtiden/samfunn-og-rett',
};

export const TESTBANE_AUTHORED: AuthoredQuest[] = [
    {
        title: 'Prøveoppdraget',
        intro: 'Ta dette oppdraget, så ser du hele kjeden: kortet i HUD-en, hintet, spørsmålet og belønningen.',
        hint: 'Snakk med Prøvemesteren igjen. Han sitter på svaret selv.',
        giverId: 'provemester',
        question: TEST_SPORSMAL,
        belonning: { xp: 60, solv: 40, itemId: 'lerbrynje' },
    },
];

/**
 * Bossens skjold. To spørsmål, ikke tre: vi tester at skjoldene ryker og at
 * kampen går videre, og den tredje runden lærer oss ingenting den andre ikke
 * allerede har sagt.
 */
export const TESTBANE_BOSS_SPORSMAL: BankQuestion[] = [
    {
        id: 'testbane-boss-0',
        question: 'Hva betyr navnet Norge?',
        options: ['Veien mot nord', 'Det kalde landet', 'Vikingenes rike', 'Landet ved havet'],
        correct: 0,
        explanation: 'Navnet kommer av seilingsleia langs kysten: Nord-vegen. Veien mot nord.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'rikssamlingen',
        lessonTitle: 'Rikssamlingen',
        link: '/historie/vikingtiden/rikssamlingen',
    },
    {
        id: 'testbane-boss-1',
        question: 'Hva må historikere bruke når ingen skrev noe ned i en tid?',
        options: [
            'Arkeologi - sporene folk la igjen i jorda',
            'Sagaene, som ble skrevet flere hundre år etter',
            'Gjetning ut fra hvordan folk lever i dag',
            'Kongerekkene i kirkebøkene',
        ],
        correct: 0,
        explanation:
            'Uten tekster må vi grave. Graver, hus og skip forteller det ingen skrev ned - som skipet i Myklebust.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'myklebust-funnet',
        lessonTitle: 'Skipet som ble brent',
        link: '/historie/vikingtiden/myklebust-funnet',
    },
];
