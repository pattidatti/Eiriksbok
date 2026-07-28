// Nordvik i 1100. Femte og siste gang, og den eneste gangen eleven kommer til
// gården uten å ha noe å gjøre der.
//
// Dette er epilogen (blueprint §4). Orm ble liggende ved Stanford bru i 1066,
// og ingen hentet ham hjem. Trettifire år senere står gården der fortsatt: den
// er kristen, den har en kirkegård med rader, og folkene på den er
// tipptippoldebarna til folk eleven har vært.
//
// **Kapittelets ene setning er at ingen her kan si hva Torstein het.** Den sies
// ikke av noen. Den sies av at steinen er borte, av at haugene bare heter
// «haugene», og av at den som bor her nå gjetter feil når hun spør.
//
// Det er ikke sørgelig ment. Det er den nøyaktige tilstanden alt fagstoffet i
// kampanjen handler om: fem liv, ingen kilder, og en gård som husker to
// generasjoner bakover og ikke én meter lenger.

import { NORDVIK_PORTAL, NORDVIK_SPAWN } from './nordvik';
import { AASAS_HAUG, HOVET } from './nordvik995';
import { K1_FLAGG } from './kapitler';
import type { LandmarkDef, NpcDef } from '../types';

/** Der eleven står når epilogen begynner: på tunet, som alle de andre gangene. */
export const NORDVIK_1100_SPAWN: [number, number] = NORDVIK_SPAWN;

/** Porten hjem til hallen. Samme rute i alle fem kapitlene - samme gård. */
export const NORDVIK_1100_PORTAL: [number, number] = NORDVIK_PORTAL;

/** Kirken, fortsatt på hovets grunn. Hundre og fem år gammel nå. */
export const KIRKEN_1100: [number, number] = HOVET;

export const NORDVIK_1100_NPCS: NpcDef[] = [
    /**
     * Han som bor her nå.
     *
     * Han er ikke dum, og han er ikke likegyldig. Han vet nøyaktig like mye som
     * folk flest vet om oldeforeldrene sine: navnet på to av dem, og ingenting
     * om den tredje. Det er hele poenget - glemselen i denne kampanjen er ikke
     * en tåke som kommer utenfra, den er normal.
     */
    {
        id: 'ketil-1100',
        name: 'Ketil på Nordvik',
        role: 'Bonde her. Tjuefire vintrer.',
        tile: [19, 31],
        ser: 'ned',
        palette: { tunic: '#6b7156', trim: '#ded4b6', hair: '#8a6f42' },
        smalltalk: [
            'Vi har vært her lenge, sier de. Det sier vel alle.',
            'Faren min het Halvard, etter sin far. Lenger bak enn det kan jeg ikke telle.',
            'Skal du opp til kirken? Presten er der på onsdager.',
        ],
        kunnskap: [
            {
                tekst: 'Det ligger to hauger nede ved naustet. Vi kaller dem bare haugene. Vi pløyer ikke i dem, for det har vi aldri gjort, og jeg har aldri spurt hvorfor.',
                stikkord: ['gravhaug', 'glemsel', 'skikk'],
            },
            {
                tekst: 'En som het Orm dro vestover med kong Harald da mor til bestemor min var ung. Han kom ikke igjen. Det gjorde ingen av dem som dro herfra, sier de, men jeg vet ikke om det er sant eller om det bare er noe man sier.',
                stikkord: ['1066', 'leidang', 'muntlig'],
            },
            {
                tekst: 'Nei. Jeg vet ikke hvem som ligger i haugene. Det gjør ingen. Presten sier de er fra før, og det er vel det som er å si om dem.',
                stikkord: ['glemsel', 'kildetaushet'],
                begrep: 'de-skriftlose',
            },
        ],
    },
    /**
     * Hun som husker mest, og som husker feil.
     *
     * Det hun sier er ikke oppspinn: det er en ekte opplysning som har mistet
     * navnet sitt og fått et nytt på veien. Fire ledd med muntlig overlevering
     * gjør nøyaktig dette, og eleven kan se det skje fordi hun selv var der da
     * det hendte.
     */
    {
        id: 'ragna-1100',
        name: 'Ragna',
        role: 'Gammel her på gården.',
        tile: [22, 34],
        ser: 'venstre',
        palette: { tunic: '#5d5a4c', trim: '#c3b795', hair: '#ded9d0' },
        smalltalk: [
            'Mormor min fortalte om det. Hun hadde det fra sin mor igjen.',
            'Det var en kvinne her som styrte gården alene en vinter. Det er alt jeg vet om henne.',
            'Sitt ned, du. Ingen har det travelt her.',
        ],
        kunnskap: [
            {
                tekst: 'Det skal ha stått en stein på den ene haugen. Jeg så den da jeg var lita. Den lå over ende da, og så var den borte. Jeg tror de tok den med opp til kirken da de la ny grunnmur.',
                stikkord: ['runestein', 'gjenbruk', 'kirke'],
            },
            {
                tekst: 'Han som ligger der, skal ha bygget et skip og seilt vestover, og han skal ha vært svært ung. Kongen sendte ham, sier de. Det var vel Olav.',
                stikkord: ['muntlig', 'fortellingen-vokser'],
                begrep: 'fortellingen-vokser',
            },
            {
                tekst: 'Nei, navnet hans er borte. Det er ingen igjen som kan det. Vi har bedt for ham likevel, hver søndag, sammen med alle de andre uten navn.',
                stikkord: ['glemsel', 'ettermæle'],
            },
        ],
    },
];

/**
 * Kirkegården.
 *
 * Sytti år etter at skiltet ved haugene i 1030 sa at de døde legges i vigslet
 * jord nå, ligger de der. Fire rader, hodet mot vest, ingen navn på noen av
 * dem - trekors råtner, og bare de rikeste fikk stein.
 */
export const KIRKEGARDEN_1100: LandmarkDef = {
    id: 'kirkegarden-1100',
    kind: 'skilt',
    tile: [KIRKEN_1100[0], KIRKEN_1100[1] + 5],
    title: 'Kirkegården',
    text: 'Fire rader med trekors i vigslet jord, alle med hodet mot vest, så de skal reise seg mot lyset når dagen kommer.\n\nDet står ikke navn på ett eneste av dem. Kors av tre råtner ned på et par slektsledd, og stein over en grav var noe bare de rikeste fikk.\n\nAlle som har dødd på denne gården siden 995, ligger et sted her. Ingen kan si hvor.',
    stikkord: ['gravskikk', 'kristningen', 'kirkegård'],
};

/**
 * Haugene, og veien inn i det kontrafaktiske.
 *
 * Handlingen ligger her og ikke ved porten, av samme grunn som «gå i fjæra» i
 * 872 ligger i fjæra: det siste spørsmålet kampanjen stiller, skal stilles
 * mens hun står oppå de to hun har vært.
 */
export const HAUGENE_1100: LandmarkDef = {
    id: 'haugene-1100',
    kind: 'skilt',
    tile: [AASAS_HAUG[0], AASAS_HAUG[1] - 1],
    title: 'Haugene',
    text: 'To lave rygger med gress på, tett ved naustet. Steinkransen rundt den ene er borte - noen har kjørt steinene opp til kirken.\n\nDen som bor her nå, kaller dem haugene. Han vet ikke mer om dem enn det, og det er ikke rart: det er ni slektsledd siden den første ble kastet opp.\n\nDu vet hvem som ligger der. Du er den eneste som gjør det.',
    stikkord: ['gravhaug', 'glemsel', 'ettermæle'],
    tillegg: [
        {
            flagg: K1_FLAGG.tokSkrinet,
            tekst: 'Og du vet noe til: skrinet du bar ut av kirken på Lindisfarne, ligger i den ene av dem. Det kommer til å ligge der i åtte hundre år, til noen graver det opp og gir det et nummer.',
        },
    ],
    handling: {
        id: 'hva-om',
        knapp: 'Bli stående. Tenk på hva som skulle til',
    },
};

export const NORDVIK_1100_LANDMARKS: LandmarkDef[] = [
    HAUGENE_1100,
    KIRKEGARDEN_1100,
    {
        id: 'kirken-1100',
        kind: 'skilt',
        tile: [KIRKEN_1100[0], KIRKEN_1100[1] + 3],
        title: 'Kirken',
        text: 'Den er hundre og fem år gammel nå, og den har fått ny grunnmur. Nederst i muren på nordsida ligger en flat stein med noe hugget i, lagt med den skrevne sida inn.\n\nSlik ble det gjort mange steder. En runestein var god byggestein, og de som la den, kunne ikke lese den.\n\nDette er stedet der hovet sto. Ingen som lever nå, har hørt om det.',
        stikkord: ['runestein', 'gjenbruk', 'kirke', 'kildetaushet'],
    },
    {
        id: 'naustet-1100',
        kind: 'skilt',
        tile: [8, 37],
        title: 'Naustet',
        text: 'Det står et naust her fortsatt, og det er ikke det samme. Dette er bygget av tømmer som ble felt etter at Orm dro.\n\nInne ligger en færing og et par årer. Ingen på Nordvik eier et skip som kan gå over åpent hav lenger, og ingen har hatt bruk for et på tre slektsledd.\n\nDet er ikke fordi de har glemt hvordan. Det er fordi vestover er blitt et sted man reiser til for å handle, og fordi kongen tar leidangen når han vil ha den.',
        stikkord: ['skip', 'leidang', 'handel'],
    },
];
