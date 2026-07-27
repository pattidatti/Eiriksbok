// Nordvik i 872. Samme gård, 79 år senere, og nesten ingen hjemme.
//
// Alle våpenføre menn er sør ved Hafrsfjord, der Harald Hårfagre slåss mot
// småkongene. Igjen står Åsa Torsteinsdotter, husfrue og hauld, med en gammel
// mann, to kvinner og en trell. Gården er hennes, og det er ikke en tjeneste
// noen har gjort henne - det er slik det var: husfrua styrte alt innenfor
// dørstokken, og når mannen var borte, styrte hun også alt utenfor.
//
// **Folkene her er valgt for å dekke kapittelets fag, ikke for å fylle tunet.**
// Torgeir husker loven og tinget. Sigrid vet hva kvinner kunne eie og arve.
// Kåre er ufri, og hele spørsmålet om hva en trell *er* ligger hos ham. Vigdis
// er naboætten - og det er hun som avgjør om kampen i høst må kjempes eller
// ikke (blueprint §16.1).
//
// Landemerkene fra 793 står der ennå, og det er med vilje de samme objektene:
// runesteinen ved veien *er* den samme steinen. Det eleven leser der, har hun
// kanskje lest før - som en 14-åring i 2026 kan lese en stein fra 1000-tallet.

import { NORDVIK_LANDMARKS, NORDVIK_PORTAL, NORDVIK_SPAWN } from './nordvik';
import { K1_FLAGG } from './kapitler';
import type { LandmarkDef, NpcDef } from '../types';

/** Der Åsa står når kapittelet begynner: på tunet, med utsikt til fjorden. */
export const NORDVIK_872_SPAWN: [number, number] = NORDVIK_SPAWN;

/** Porten hjem til hallen. Samme sted som i 793 - det er samme gård. */
export const NORDVIK_872_PORTAL: [number, number] = NORDVIK_PORTAL;

/**
 * Haugen der Torstein ligger. Sør for tunet, med steinen på toppen.
 *
 * Ikke lenger sør enn dette: legges den nede ved brygga, smelter steinkransen
 * sammen med fjellet som rammer inn kartet i sør, og haugen ser ut som en
 * grusflekk i stedet for noe noen har bygget.
 */
export const TORSTEINS_HAUG: [number, number] = [17, 37];

export const NORDVIK_872_NPCS: NpcDef[] = [
    {
        id: 'torgeir',
        name: 'Torgeir Gamle',
        role: 'For gammel til å dra sør',
        tile: [19, 30],
        ser: 'ned',
        palette: { tunic: '#4a4f42', trim: '#cfc4a0', hair: '#d8d8d0' },
        smalltalk: [
            'Alle som kunne bære skjold, dro. Jeg kunne ikke lenger.',
            'Harald har sverget at han ikke skal klippe håret før hele landet er hans. Han har langt hår nå.',
            'Gården er din i år. Det har den vært før også, når mennene var borte. Det er bare ingen som skriver det ned.',
        ],
        kunnskap: [
            {
                tekst: 'Harald Hårfagre samler landet med makt. I sommer står slaget i Hafrsfjord, sør i Rogaland, mot småkongene som ikke vil under ham.',
                stikkord: ['hafrsfjord', 'hårfagre', 'rikssamling'],
            },
            {
                tekst: 'Du er hauld. Det betyr at du sitter på odelsjord - jord ætta di har hatt så lenge at ingen husker noe annet. En hauld står høyere enn en vanlig fri karl, og det merkes både på tinget og i bøtene.',
                stikkord: ['hauld', 'odel'],
            },
            {
                tekst: 'Dreper noen et menneske, skal drapet lyses innen ett døgn. Sier du det høyt, er det drap, og drap kan bøtes. Tier du, er det mord - og mord kan ingen bot kjøpe deg fri fra.',
                stikkord: ['drap', 'mord', 'lyse'],
            },
            {
                tekst: 'På tinget dømmer de frie mennene. Lovsigemannen kan loven utenat og sier den fram - den står ikke i noen bok, den bor i hodet på ett menneske.',
                stikkord: ['ting', 'lovsigemann'],
            },
        ],
        handlinger: [
            {
                id: 'torgeir-noklene',
                knapp: 'Året er mitt',
                ledetekst:
                    'Se på fjorden. Skipet er borte, og med det hver mann som kunne ro det. Det som ligger i bua nå, er alt gården har til våren. Nøklene henger i beltet ditt, Åsa. Bruk dem.',
                gir: 'k2-noklene',
                etterpa: 'Du vet hva som ligger i bua nå. Det er verre å vite enn å la være.',
            },
        ],
    },
    {
        id: 'sigrid',
        name: 'Sigrid',
        role: 'Datteren din, seksten vintrer',
        tile: [17, 28],
        ser: 'hoyre',
        palette: { tunic: '#7a5a8a', trim: '#e8dcc2', hair: '#c98f3a' },
        smalltalk: [
            'Jeg vever. Det er ikke fint arbeid, men det er det vi selger.',
            'Far er sør. Jeg vet ikke om han kommer tilbake, og ingen sier det høyt.',
            'Du sier ingenting når du er redd. Jeg har lagt merke til det.',
        ],
        kunnskap: [
            {
                tekst: 'Vadmel er ullstoffet vi vever. Det er en vare som gjelder som betaling - et skip trenger seil, og et seil er mange kvinneår med veving.',
                stikkord: ['vadmel', 'veving', 'seil'],
            },
            {
                tekst: 'En kvinne kunne eie jord, arve og kreve skilsmisse. Hun kunne ikke tale på tinget selv - men hun kunne få en mann til å tale saken sin.',
                stikkord: ['kvinne', 'arve', 'skilsmisse'],
            },
        ],
    },
    {
        id: 'kaare',
        name: 'Kåre',
        role: 'Trell på Nordvik',
        tile: [24, 34],
        ser: 'opp',
        palette: { tunic: '#6b6255', trim: '#8a8071', hair: '#3a3028' },
        smalltalk: [
            'Jeg spør ikke hva som skjer sør. Det angår ikke meg heller.',
            'Jeg bar kornet inn i fjor også. Og året før.',
            'Du snakker til meg. Det gjør ikke alle.',
        ],
        kunnskap: [
            {
                tekst: 'Jeg er ufri. En trell eier ingenting, kan ikke gifte seg uten lov, og kan ikke føre sak på tinget. Blir jeg drept, er det ikke drap - det er tap for den som eier meg.',
                stikkord: ['trell', 'ufri'],
            },
            {
                tekst: 'De fleste av oss ble tatt på ferd. Jeg ble født her, men mor kom med et skip vestfra.',
                stikkord: ['krigsbytte', 'slave'],
            },
            {
                tekst: 'En trell kan bli fri. Eieren kan gi frihet, eller du kan kjøpe deg fri om du får lov å arbeide for eget. Men frigitt er ikke det samme som fri født - det henger ved deg og barna dine.',
                stikkord: ['frigi', 'frigitt', 'frihet'],
            },
        ],
    },
    {
        id: 'vigdis',
        name: 'Vigdis på Sæbø',
        role: 'Naboætta, over fjorden',
        tile: [28, 27],
        ser: 'venstre',
        palette: { tunic: '#3f5f5a', trim: '#d8c9a0', hair: '#8a7a5a' },
        smalltalk: [
            'Sæbø ligger rett over vika. Vi ser røyken deres, dere ser vår.',
            'Mine menn dro sør de også. Vi sitter i samme båt, og den ligger på land.',
            'Gaute Gråkappe har vært på fjorden. Han ser på gårder som har få folk igjen.',
        ],
        handlinger: [
            {
                id: 'gave-saebo',
                knapp: 'Seks sekker over vika',
                ledetekst:
                    'Jeg spør deg om noe jeg helst ikke ville spurt om. Vi sådde for lite i vår, og vi har seks munner. Seks sekker korn, Åsa. Jeg skriver det ikke ned noe sted, men jeg glemmer det ikke.',
                // Først når hun har sådd selv. Da vet hun hva seks sekker er.
                krever: ['k2-vaaronn'],
                gir: 'k2-gave-saebo',
                etterpa: 'Vi står i gjeld til deg. Det gjør vi til det er gjort opp.',
            },
        ],
        kunnskap: [
            {
                tekst: 'En gave er aldri bare en gave. Den som tar imot, står i gjeld til den som ga, til han har gitt noe tilbake. Slik holder ættene hverandre i live - og slik binder de hverandre.',
                stikkord: ['gave', 'gjengave', 'gjeld'],
                begrep: 'gjengave',
            },
            {
                tekst: 'Det finnes ingen konge som kan sende folk for å hjelpe deg her. Kommer noen mot gården din, er det ætta di og naboene dine som stiller opp - eller ingen.',
                stikkord: ['ætt', 'naboer', 'stat'],
            },
        ],
    },
    /**
     * De to som kommer over fjorden i sommer.
     *
     * De står på kartet hele tiden, men er skjult utenom sommeren - `Gaarden`
     * viser og skjuler dem. Alternativet var å sette dem ut og hente dem inn
     * som fiender, og det ville gjort to menn med et ærend om til noe som
     * dukker opp. De kommer med båt, og de drar igjen når de har fått svar.
     */
    {
        id: 'torolv',
        name: 'Torolv Kongsmann',
        role: 'Sendt av Harald Hårfagre',
        tile: [23, 29],
        ser: 'venstre',
        palette: { tunic: '#5a3f6b', trim: '#e8c96a', hair: '#4a3a2a' },
        smalltalk: [
            'Kongen samler landet. Det koster korn.',
            'Jeg spør på gårdene i denne fjorden. Alle svarer.',
            'Mannen din er sør hos oss. Det burde gjøre dette enkelt.',
        ],
        kunnskap: [
            {
                tekst: 'Harald tar ikke bare land. Han tar odelen: jorda skal være hans, og bøndene skal betale for å sitte på sin egen gård. Det er derfor mange heller flyttet til Island.',
                stikkord: ['odel', 'island', 'utvandring'],
            },
        ],
        handlinger: [
            {
                id: 'gave-harald',
                knapp: 'Åtte sekker til kongen',
                ledetekst:
                    'Åtte sekker korn til hæren. Kongen glemmer ikke hvem som ga i det året det gjaldt - og han glemmer ikke hvem som lot være.',
                gir: 'k2-kornet',
                etterpa: 'Kornet er sørover. Du har svart.',
            },
        ],
    },
    {
        id: 'eystein',
        name: 'Eystein frå Vestfold',
        role: 'Sendt av dem som slåss mot Harald',
        tile: [26, 31],
        ser: 'opp',
        palette: { tunic: '#3f5a3f', trim: '#c9b489', hair: '#6a4a2a' },
        smalltalk: [
            'Vi er ikke færre enn ham. Vi er bare dårligere til å samle oss.',
            'Vinner han, er ingen gård her din lenger. Den er hans, og du sitter på lån.',
            'Jeg ber. Jeg krever ikke. Merk deg forskjellen.',
        ],
        kunnskap: [
            {
                tekst: 'Småkongene styrte hver sin bygd eller dal. Ingen av dem var svak, men de kunne ikke enes - og det er derfor én mann kunne ta dem én etter én.',
                stikkord: ['småkonge', 'rikssamling'],
            },
        ],
        handlinger: [
            {
                id: 'gave-motstanderne',
                knapp: 'Åtte sekker til dem som står imot',
                ledetekst:
                    'Åtte sekker. Vi har ingen konge som kan love deg noe tilbake - bare folk som husker.',
                gir: 'k2-kornet',
                etterpa: 'De rodde nordover med kornet ditt.',
            },
        ],
    },
    {
        id: 'ingeborg',
        name: 'Ingeborg Kremmer',
        role: 'Selger det gården ikke lager selv',
        tile: [21, 31],
        palette: { tunic: '#8a5a2f', trim: '#e8c96a', hair: '#5a4a3a' },
        smalltalk: [
            'Jern, salt og korn. Alt annet lager dere selv.',
            'Prisen min er ikke den samme for alle. Den er den samme for alle jeg stoler på.',
            'Jeg kommer tilbake til våren. Om gården står.',
        ],
        handler: {
            velkomst: 'Du har sølv, og jeg har det gården ikke lager selv. La oss se.',
            varer: ['vadmelskjortel', 'lerbrynje', 'tingspyd', 'jaktbue', 'kvernstein'],
        },
        kunnskap: [
            {
                tekst: 'Salt er ikke krydder, det er hvordan mat overlever vinteren. Uten salt råtner kjøttet du slaktet i høst før jul.',
                stikkord: ['salt', 'konservering'],
            },
        ],
    },
];

/**
 * Steinen over Torstein.
 *
 * Runesteiner ble reist for de døde, og de er gjerne reist av dem som lever -
 * det står oftere hvem som reiste steinen enn hvem som ligger under den. Her er
 * det Åsa selv, og det er derfor «Åsa reiste denne steinen» står først.
 *
 * Tilleggene er kampanjen som husker: tok hun skrinet i 793, ligger det her.
 */
export const TORSTEINS_STEIN: LandmarkDef = {
    id: 'haug-torstein',
    kind: 'runestein',
    tile: [TORSTEINS_HAUG[0], TORSTEINS_HAUG[1] - 1],
    title: 'Steinen på haugen',
    text: 'Åsa reiste denne steinen etter Torstein Ormsson, faren sin. Han bygde skip og seilte vestover.\n\nDet står ikke hvor han var, eller hva han gjorde der. Det står at han var faren din, og at du reiste steinen.',
    stikkord: ['runestein', 'gravhaug'],
    tillegg: [
        {
            flagg: K1_FLAGG.tokSkrinet,
            tekst: 'Under haugen ligger et skrin av forgylt kobber. Ingen her vet hva det er, eller hvem det ble laget for.',
        },
        {
            flagg: K1_FLAGG.tokBokene,
            tekst: 'Bøkene han tok med hjem, ligger i bua. Ingen på gården kan lese dem. De brukes til å pakke sølv i.',
        },
    ],
};

export const NORDVIK_872_LANDMARKS: LandmarkDef[] = [
    TORSTEINS_STEIN,
    {
        id: 'naust-872',
        kind: 'skilt',
        tile: [8, 37],
        title: 'Det tomme naustet',
        text: 'Rullestokkene ligger klare, og sporet i sanden går rett ut i vannet.\n\nSkipet dro sørover i vår, med hver mann som kunne ro. Det er ikke kommet noe bud siden.',
        stikkord: ['leidang', 'hafrsfjord'],
    },
    {
        id: 'bua-872',
        kind: 'kiste',
        tile: [25, 32],
        title: 'Bua',
        text: 'Her ligger alt gården har: korn i binger, tørrfisk under taket, smør i kar.\n\nNøkkelen til denne døra henger i beltet ditt. Det er ikke pynt - det er hvem som avgjør hvem som spiser i vinter.',
        stikkord: ['nøkl', 'forråd', 'husfrue'],
        handling: { id: 'bua-forradet', knapp: 'Lås opp bua' },
    },
    // Steinene fra 793 er de samme steinene. Objektene gjenbrukes med vilje:
    // det eleven leste som Torstein, kan hun lese igjen som Åsa - 79 år eldre,
    // og med mose på.
    ...NORDVIK_LANDMARKS.filter((l) =>
        ['runestein-navnet', 'runestein-hallen', 'baal-tinget'].includes(l.id)
    ),
];
