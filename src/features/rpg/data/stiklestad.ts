// Stiklestad i Verdalen, 29. juli 1030.
//
// Andre halvdel av kapittel 4, og det tredje kartet epoken har. Her er det
// ingen gård å vandre rundt i og ingen oppdrag: eleven kommer fram til en
// slette der to hærer holder på å stille seg opp, og alt som står her, står
// her for å forklare hva som skal skje på den sletta.
//
// **De tre mennene er valgt for å ta fra eleven den enkleste forklaringen.**
// Tore Hund og Kalv Arnesson er ikke hedninger som møter en kristen konge -
// de er kristne stormenn som har mistet makt og fått drept slektninger, og som
// har tatt imot sølv fra Knut den mektige. Skofte er bonden som kan reglene i
// rekka. Ingen av dem sier at de er på den gode siden, og ingen av dem sier at
// kongen er på den onde.
//
// Alt disse tre forteller om seg selv, er hentet fra Snorre - som skrev det to
// hundre år etter, for kongsætta. Det er nettopp det Mellomspill IV skal
// legge på bordet etterpå.

import { REKKA_X, REKKA_Y, STIKLESTAD_PORTAL } from '../engine/stiklestadgen';
import type { LandmarkDef, NpcDef } from '../types';

/** Midt i rekka, der landemerket som starter slaget står. */
export const REKKA_MIDT: [number, number] = [
    Math.round((REKKA_X.fra + REKKA_X.til) / 2),
    REKKA_Y,
];

export const STIKLESTAD_NPCS: NpcDef[] = [
    /**
     * Skofte, som kom med fra Nordvik.
     *
     * Samme mann, ny id: `finnNpc` slår opp på tvers av steder, og to
     * oppføringer med samme id ville gjort at grensesnittet ikke visste hvem
     * det snakket med. Navnet er det samme, for det er ham.
     */
    {
        id: 'skofte-stiklestad',
        name: 'Skofte Gamle',
        role: 'Har vært i leidangen. To ganger.',
        tile: [REKKA_MIDT[0] - 1, REKKA_MIDT[1] + 3],
        ser: 'opp',
        palette: { tunic: '#5a5548', trim: '#a89878', hair: '#b8b0a0' },
        smalltalk: [
            'Der oppe. Ser du merket? Det er kongens.',
            'Ikke se på dem. Se på skjoldet til han ved siden av deg.',
            'Det tar tid. Det er det ingen forteller: det tar veldig lang tid.',
        ],
        kunnskap: [
            {
                tekst: 'Vi er mange flere enn dem. Det hjelper mindre enn du tror - en rekke er ikke sterkere enn det svakeste stedet i den, og det spiller ingen rolle hvor mange som står bak.',
                stikkord: ['skjoldborg', 'antall', 'formasjon'],
            },
            {
                tekst: 'Kongen har ikke mange menn. Han rømte til Gardarike for to år siden, og det han har med seg nå, fikk han av svenskekongen. Det er ikke en hær som har stått sammen før.',
                stikkord: ['olav haraldsson', 'gardarike', 'hær'],
            },
            {
                tekst: 'Du skal ikke slå. Du skal stå. Slår du, går du fram - og går du fram, er du ikke i rekka lenger. Spydet stikker rett fram over skjoldkanten, og det er derfor det er spydet du har.',
                stikkord: ['spyd', 'skjoldborg', 'disiplin'],
            },
        ],
        handlinger: [
            {
                id: 'skofte-rekka',
                knapp: 'Vis meg hvor jeg skal stå',
                ledetekst:
                    'Her. Midt i, mellom Torfinn og meg. Gutten står på venstre side av deg.\n\nSkjoldet ditt dekker deg og halve ham. Mitt dekker halve deg. Sånn henger hele rekka sammen, fra enden til enden.\n\nTa dette spydet. Øksa di legger du igjen - den trenger plass til å svinges, og plass er det ingen som har der inne.',
                gir: 'k4-linja',
                etterpa: 'Du står der. Still deg opp når du er klar - de kommer uansett.',
            },
        ],
    },
    /**
     * Tore Hund.
     *
     * Han har en grunn, og den er personlig: brorsønnen Asbjørn ble drept av
     * kongens mann. Reinskinnskufta hans er med fordi Snorre gjør et poeng av
     * den - og det poenget er nettopp av det slaget Mellomspill IV skal la
     * eleven veie.
     */
    {
        id: 'tore-hund',
        name: 'Tore Hund',
        role: 'Storbonde fra Bjarkøy, langt nord',
        tile: [REKKA_MIDT[0] + 4, REKKA_MIDT[1] + 4],
        ser: 'venstre',
        palette: { tunic: '#6a5a48', trim: '#d8cba8', hair: '#8a7a5a' },
        smalltalk: [
            'Jeg har seilt tolv døgn for å komme hit. Det gjør ingen for et prinsipp.',
            'Kufta er av reinskinn. Finnene sydde den. Si hva du vil om det.',
            'Han tok brorsønnen min. Så tok han bøtene. Så tok han gården.',
        ],
        kunnskap: [
            {
                tekst: 'Jeg handler med finnene nord for oss, og jeg krever skatt av dem for kongen. Olav ville ha alt sammen selv. En konge som vil eie handelen, er en konge som tar levebrødet fra folk som meg.',
                stikkord: ['finneskatt', 'handel', 'kongsmakt'],
            },
            {
                tekst: 'Asbjørn, brorsønnen min, kjøpte korn i Sør-Norge da det var uår her nord. Kongen hadde forbudt salget. Kongens mann Sel-Tore hindret ham, og Asbjørn drepte ham. Så lot kongen Asbjørn drepe. Sånn begynte dette, og det begynte ikke med Gud.',
                stikkord: ['asbjørn selsbane', 'hevn', 'ætt'],
            },
            {
                tekst: 'Knut den mektige er konge i England og i Danmark. Han har sendt sølv nordover i to år, til alle som Olav har gjort til uvenner. Jeg tok imot. Jeg sier det høyt, for alle vet det.',
                stikkord: ['knut den mektige', 'sølv', 'bondehæren'],
            },
        ],
    },
    /**
     * Kalv Arnesson.
     *
     * Han var kongens egen mann. Det er den viktigste opplysningen på hele
     * sletta: dette er ikke to leirer som alltid har stått mot hverandre, det
     * er en kongsmakt som har laget sine egne fiender på ti år.
     */
    {
        id: 'kalv-arnesson',
        name: 'Kalv Arnesson',
        role: 'Lendmann. Var kongens mann til i fjor.',
        tile: [REKKA_MIDT[0] - 5, REKKA_MIDT[1] + 4],
        ser: 'hoyre',
        palette: { tunic: '#4a5568', trim: '#e0d4b0', hair: '#3a3028' },
        smalltalk: [
            'Jeg satt i hirden hans. Jeg sverget ham troskap, og jeg mente det.',
            'Brødrene mine står der oppe, på hans side. Vi er fire, og vi er delt.',
            'Ingen av oss ville hatt det slik. Det er der vi er likevel.',
        ],
        kunnskap: [
            {
                tekst: 'En lendmann er en storbonde kongen har gjort til sin mann. Han får inntekter av kongens jord, og han skal stille med menn og skip når kongen kaller. Det er en avtale, og en avtale kan brytes av begge to.',
                stikkord: ['lendmann', 'kongsmakt', 'hird'],
            },
            {
                tekst: 'Kongen lot de to stesønnene mine drepe. De hadde brutt loven hans, det er sant. Men en konge som dømmer sin egen manns sønner uten ting og uten bot, har tatt noe fra alle oss andre også.',
                stikkord: ['drap', 'ting', 'lov'],
            },
            {
                tekst: 'Vi kalte ut bøndene med budstikke, i kongens egen form. Det er slik en hær blir til her: det finnes ingen soldater, bare folk som pløyer. Derfor vet vi begge at halvparten av dem der bak har ljå og ikke spyd.',
                stikkord: ['bondehæren', 'budstikke', 'leidang'],
            },
        ],
    },
];

export const STIKLESTAD_LANDMARKS: LandmarkDef[] = [
    /**
     * Rekka. Kapittelets ene handling.
     *
     * Knappen krever at Skofte har vist henne plassen - ikke fordi spillet
     * ellers ville krasjet, men fordi det å stille seg i en skjoldborg uten å
     * vite hva som gjelder er nøyaktig den kampen kapittelet er skrevet for å
     * ikke være.
     */
    {
        id: 'rekka-stiklestad',
        kind: 'skilt',
        tile: [REKKA_MIDT[0], REKKA_MIDT[1] + 2],
        title: 'Rekka',
        text: 'Bøndene står oppstilt over hele sletta, skulder ved skulder, i en linje så lang at du ikke ser enden av den.\n\nDe fleste har spyd. Noen har ljå bundet på en stang. Alle har skjold.\n\nEn skjoldborg er ikke et angrep. Det er en vegg av folk som har blitt enige om å bli stående, og som vet at den som går fram, tar veggen fra hverandre innenfra.',
        stikkord: ['skjoldborg', 'formasjon', 'bondehæren'],
        handling: {
            id: 'still-deg-i-rekka',
            knapp: 'Still deg i rekka',
            krever: ['k4-linja'],
        },
    },
    {
        id: 'veien-fra-sul',
        kind: 'skilt',
        tile: [22, 13],
        title: 'Veien ned dalen',
        text: 'Veien kommer ned fra Sul, fra fjellovergangen mot Sverige. Det er den kongen har brukt.\n\nDere kan se merket hans oppe i bakken. Ingen vet hvor mange som står under det. Om to hundre år kommer Snorre til å skrive at kongen hadde 3600 mann og at dere var over 7000 - og historikerne i dag mener at kongen kanskje hadde noen hundre.\n\nEn hær som er kalt ut med budstikke, kan ikke telles av noen. Det finnes ingen lister.',
        stikkord: ['stiklestad', 'hær', 'antall'],
    },
    {
        id: 'elva-verdal',
        kind: 'skilt',
        tile: [18, 28],
        title: 'Verdalselva',
        text: 'Elva går bak dere, bred og stri av sommervann. Båtene ligger trukket opp i kanten.\n\nDet er ikke en fluktvei. Det er derfor rekka står der den står: en skjoldborg med elva i ryggen har ingen steder å rygge til, og alle som står i den vet det.',
        stikkord: ['verdalselva', 'terreng', 'skjoldborg'],
    },
    {
        id: 'stiklestad-gaarden',
        kind: 'skilt',
        tile: [10, 11],
        title: 'Gården Stiklestad',
        text: 'En vanlig gård med langhus, bu og et jorde med korn i. Folkene som bor her, har gått opp i lia med dyra.\n\nOm tusen år er navnet på denne gården det eneste alle i landet kan av alt som er her i dag. Ingen kilde forteller hva de som bodde her het.',
        stikkord: ['stiklestad', 'gård', 'kildetaushet'],
    },
    {
        id: 'baatene-verdal',
        kind: 'skilt',
        tile: [STIKLESTAD_PORTAL[0] + 3, STIKLESTAD_PORTAL[1] - 1],
        title: 'Båtene',
        text: 'Her ligger båtene fra fjordgårdene, trukket opp side ved side. Deres egen er den fjerde fra enden.\n\nHjemme ligger høyet slått på enga.',
        stikkord: ['utferd', 'slått'],
    },
];
