// Stanford bru, 25. september 1066, mellom klokka ti og klokka tolv.
//
// Andre halvdel av kapittel 5, og det femte kartet epoken har. Her er det
// ingen gård å vandre rundt i og ingen oppdrag: eleven kommer fram til en hær
// som ligger og venter på gisler, og alt som står her, står her for å vise hva
// den hæren tror om dagen sin.
//
// **Alt de tror, er fornuftig, og alt er galt.** Freden er sluttet med York,
// gislene er avtalt, det er ingen fiendtlig hær nærmere enn fire dagsreiser, og
// det er så varmt at folk sitter i graset med skjoldene fra seg. Ingen her er
// urolig. En eneste urolig mann ville gjort hele dagen til et varsel eleven
// overhørte, og da lærer kapittelet bort at de burde skjønt det.
//
// **De tre som står her, dekker hver sin side av året 1066.** Harald er
// tronkravet gjort til et menneske, og han er 51 år gammel og har vært konge i
// nitten av dem. Tjodolv er den eneste kilden på hele kartet, og han vet det
// ikke. Torfinn er hjemme: gården, loddet på tinget i mai, og kornet som står
// inne uten dem.
//
// **Den fjerde står ikke her når hun kommer.** Mannen med øksa dukker opp på
// plankene først når hæren snur, og han har ikke noe navn - ikke fordi vi ikke
// fant på et, men fordi ingen kilde ga ham et. Mellomspill V skal kunne peke på
// nettopp det.

import { K5 } from './kapitler';
import { BRUA_MIDT, BRUA_X, BRUA_Y, RINGEN_X, RINGEN_Y, VEIEN_VEST } from '../engine/bruagen';
import type { LandmarkDef, NpcDef } from '../types';

/** Midt i rekka, der landemerket som starter slaget står. */
export const RINGEN_MIDT: [number, number] = [
    Math.round((RINGEN_X.fra + RINGEN_X.til) / 2),
    RINGEN_Y,
];

/**
 * De som skal ut av bildet når hæren snur.
 *
 * Kongen, skalden og naboen står oppe på venting-siden. I det støvet er sett,
 * går hele hæren over brua - og tre menn som blir stående igjen på feil side og
 * småprater mens rekka stiller seg opp nedenfor, gjør retretten til noe eleven
 * ser bort fra i stedet for noe hun gjør.
 */
export const BRUA_VENTENDE = ['harald-hardraade', 'tjodolv-brua', 'torfinn-brua'];

export const BRUA_NPCS: NpcDef[] = [
    /**
     * Harald Sigurdsson.
     *
     * Han er den mest kjente mannen i hele kampanjen, og han er med fordi
     * livet hans er kapittelets viktigste opplysning: han sto i den andre
     * rekka på Stiklestad, femten år gammel, mens Halvard sto i eleven sin.
     * De to slagene er ett menneskeliv fra hverandre, og de føles som to
     * verdener. Det er nettopp det 1030 til 1066 er.
     *
     * Han sier ingenting om at det er farlig i dag, for det syntes han ikke at
     * det var.
     */
    {
        id: 'harald-hardraade',
        name: 'Harald Sigurdsson',
        role: 'Konge i Norge. De kaller ham Hardråde.',
        tile: [18, 6],
        ser: 'ned',
        palette: { tunic: '#3f4a6a', trim: '#e8dcae', hair: '#c8b070' },
        smalltalk: [
            'Sett deg. Det er ingenting å gjøre før de kommer.',
            'Jeg var på din alder da jeg forlot dette yrket første gang. Så kom jeg tilbake til det.',
            'Merket mitt heter Landøyda. Det har ikke tapt ennå.',
        ],
        kunnskap: [
            {
                tekst: 'Jeg sto i en rekke på Stiklestad. Femten vintrer gammel, på kongens side, mot bøndene. Vi tapte, jeg ble såret, og jeg kom meg over til Sverige og videre østover. Det er trettiseks år siden i sommer.',
                stikkord: ['stiklestad', 'harald hardråde', 'ung'],
            },
            {
                tekst: 'Jeg tjente kongen i Gardarike, og så gikk jeg i keiserens livvakt i Miklagard - Væringgarden. Ti år nede i sør, i land du ikke har hørt navnet på. Jeg kom hjem rikere enn noen mann i Norden, og jeg kjøpte meg halve kongedømmet av Magnus for det.',
                stikkord: ['miklagard', 'væringgarden', 'gardarike', 'handel'],
            },
            {
                tekst: 'Kravet mitt er ikke sverdet. Magnus den gode og Hardeknut i England avtalte at den som levde lengst, skulle ta begge rikene. Hardeknut døde først. Magnus arvet England, og jeg arvet Magnus. Papirene er like gode som de to andres, og alle tre er tynne.',
                stikkord: ['tronkrav', 'magnus den gode', 'hardeknut', 'arv'],
                begrep: 'tronkravet',
            },
        ],
        handlinger: [
            {
                id: 'harald-gislene',
                knapp: 'Hvor blir det av dem?',
                ledetekst:
                    'De kommer. Sønner av folk med jord, fra hver bygd nord for Humber, og de skal leveres her ved brua i dag.\n\nSlik avslutter man en krig uten å slåss om den. Så lenge jeg har guttene deres, gjør fedrene ingenting.\n\nDet er derfor ingen av oss har brynje på i dag, gutt. Vi skal ikke slåss. Vi skal ta imot.',
                gir: K5.gislene,
                etterpa: 'Sett deg i skyggen til de kommer. Det er ingen skam i å hvile.',
            },
        ],
    },
    /**
     * Tjodolv Arnorsson, kongens skald.
     *
     * Samme mann som i leiren, ny id: `finnNpc` slår opp på tvers av steder, og
     * to oppføringer med samme id ville gjort at grensesnittet ikke visste hvem
     * det snakket med.
     *
     * Det han sier her, er det Mellomspill V skal ta opp igjen: kvadene handler
     * om kongen. Det finnes ingen strofe om Orm, og det er ikke fordi Orm ikke
     * var der.
     */
    {
        id: 'tjodolv-brua',
        name: 'Tjodolv Arnorsson',
        role: 'Kongens skald. Faller her, om to timer.',
        tile: [20, 8],
        ser: 'venstre',
        palette: { tunic: '#6a5a3a', trim: '#e0d4a8', hair: '#7a6a5a' },
        smalltalk: [
            'Fulford-strofen er ferdig. Den ble ikke god.',
            'Et kvad om en dag der ingenting hendte, er ikke et kvad.',
            'Jeg går der kongen går. Det er hele stillingen.',
        ],
        kunnskap: [
            {
                tekst: 'Kvadene mine handler om kongen. Ikke om deg, ikke om Torfinn, ikke om de tre tusen som ror. Det er ikke fordi dere ikke er her - det er fordi et kvad lages for den som betaler skalden, og ingen av dere betaler meg.',
                stikkord: ['skald', 'kvad', 'kilde', 'hvem forteller'],
            },
            {
                tekst: 'Om noen skriver om denne dagen en gang, blir det etter kvadene mine. Da kommer det til å stå hva kongen sa og hva kongen gjorde. Alt annet som hendte her, hender uten at noen ord tar vare på det.',
                stikkord: ['nedskriving', 'saga', 'kildetaushet'],
                begrep: 'kildetaushet',
            },
        ],
    },
    /**
     * Torfinn på Sæbø.
     *
     * Han er den ene som snakker om hjemme, og han er den som skal stå til
     * venstre for henne i rekka. Begge deler er med vilje: skjoldet hennes
     * dekker halve ham, og han er naboen fra ætta Åsa ga korn til i 872.
     *
     * Han sier at hans egen brynje ligger i kista, og det sier han uansett hva
     * eleven valgte i morges. Det er med vilje: en nabo som hadde svart ulikt
     * etter hva hun gjorde, ville lagt en dom i replikken - og ingen i denne
     * leiren er urolig i dag.
     */
    {
        id: 'torfinn-brua',
        name: 'Torfinn på Sæbø',
        role: 'Naboen hjemmefra. Står ved siden av deg.',
        tile: [14, 8],
        ser: 'hoyre',
        palette: { tunic: '#7a6a4a', trim: '#c9bd94', hair: '#5a4a30' },
        smalltalk: [
            'Fem timer hit. Fem timer tilbake. Og så en dag til i morgen.',
            'Kjenner du varmen? I september. Hjemme er det frost om morgenen nå.',
            'Når vi kommer tilbake til skipene, spiser jeg og sover i to døgn.',
        ],
        kunnskap: [
            {
                tekst: 'Brynja mi ligger i kista, som kongen sa. Halve hæren har lagt igjen alt de eier av jern ved skipene, og det er femten kilometer den veien. Vi bærer skjold, hjelm og spyd. Det er nok til å ta imot noen gutter.',
                stikkord: ['brynje', 'utstyr', 'skip', 'riccall'],
            },
            {
                tekst: 'Vi trakk lodd om dette på tinget i mai. Jeg trakk. Du trakk. Faren din står med slåtten alene i år, og min bror har begge gårdene å se til. Det er sånn et utbud koster: ikke i sølv, men i to menn som ikke er hjemme.',
                stikkord: ['leidang', 'utbud', 'lodd', 'gård'],
                begrep: 'leidang',
            },
        ],
    },
    /**
     * Mannen med øksa.
     *
     * Han står ikke her når eleven kommer. Han settes inn på plankene i det
     * hæren snur, og han er borte igjen når rekka har stilt seg opp.
     *
     * Han har ikke navn, og det er hele grunnen til at han er med. Historien om
     * mannen som holdt brua alene, står ikke i den eldste angelsaksiske
     * krøniken - den kom inn i én håndskrift over hundre år senere, og ingen
     * norrøn kilde har den i det hele tatt. Mellomspill V legger den på bordet
     * ved siden av kvadene, og spør eleven hva hun vil gjøre med den.
     *
     * Her sier vi ingenting om det. Her er han bare en mann som stiller seg i
     * veien.
     */
    {
        id: 'mannen-med-oksa',
        name: 'En mann med øks',
        role: 'Ingen kilde gir ham et navn.',
        tile: BRUA_MIDT,
        ser: 'opp',
        palette: { tunic: '#6a5540', trim: '#b8a880', hair: '#8a5a30' },
        smalltalk: ['Gå.', 'Jeg står her.', 'Det er plass til én av gangen. Det er poenget.'],
        kunnskap: [
            {
                tekst: 'Ei toppløs øks tar to hender. Jeg har ikke skjold, og jeg trenger ikke skjold: ingen kommer på siden av meg her. Brua er to alen bred, og en mann som fyller den, er en vegg til han faller.',
                stikkord: ['øks', 'bru', 'terreng', 'flaskehals'],
            },
        ],
    },
];

export const BRUA_LANDMARKS: LandmarkDef[] = [
    /**
     * Veien fra York. Kapittelets vendepunkt.
     *
     * Knappen krever at kongen har sagt hva dagen er. Uten det er støvet bare
     * støv, og eleven har ingen forventning å få knust.
     */
    {
        id: 'veien-fra-york',
        kind: 'skilt',
        tile: [VEIEN_VEST[0] + 1, VEIEN_VEST[1] + 2],
        title: 'Veien fra York',
        text: 'Veien går vestover, over flat mark, mot byen som ga seg for fem dager siden.\n\nDet er femten kilometer dit. Til London er det fire dagsreiser med hær, og det er alle enige om: ingen fører tusen mann den veien på kortere tid. Det har aldri hendt.\n\nDet står støv over veien. Det har det gjort en stund nå.',
        stikkord: ['york', 'vei', 'london', 'marsj'],
        handling: {
            id: 'se-paa-stovet',
            knapp: 'Se hva som kommer',
            krever: [K5.gislene],
        },
    },
    /**
     * Plassen der gislene skal leveres.
     *
     * Dette er bildet av dagen, og det er det bildet som skal gjøre vondt
     * etterpå: en hær som har lagt fra seg våpnene i graset fordi det er varmt
     * og fordi krigen er over.
     */
    {
        id: 'gislene-plassen',
        kind: 'skilt',
        tile: [15, 5],
        title: 'Der gislene skal leveres',
        text: 'Folk ligger i graset langs veien. Skjoldene står lent mot hverandre i klaser, spydene ligger flatt, og noen har tatt av seg hjelmen og lagt den over ansiktet for sola.\n\nTo karer krangler om hvem som skal telle guttene når de kommer. Ingen har sett noe å telle ennå.\n\nDette er en hær som ikke venter noe. Det er ikke dumskap. Det er en avtale som er sluttet, og en avtale er en avtale.',
        stikkord: ['gisler', 'gissel', 'fred', 'avtale'],
    },
    /**
     * Brua.
     *
     * Den er stedet, og den er tittelen på kapittelet. Teksten sier hva ei bru
     * gjør med en hær, og den sier det før noen trenger den til noe.
     */
    {
        id: 'brua-plankene',
        kind: 'skilt',
        tile: [BRUA_X.fra - 1, BRUA_Y.fra + 1],
        title: 'Brua',
        text: 'Plankene ligger på fire par staur ute i vannet. Elva under heter Derwent, og den er ikke bred - en mann kan vasse over på det smaleste, hvis han har tid og ingen skyter på ham.\n\nEn hær har ikke tid, og en hær med skjold og spyd vasser ikke. En hær går på brua, to og to.\n\nAlt som skal fra den ene siden til den andre i dag, skal over disse plankene.',
        stikkord: ['stamford bridge', 'stanford bru', 'derwent', 'flaskehals'],
    },
    {
        id: 'elva-derwent',
        kind: 'skilt',
        tile: [27, 17],
        title: 'Derwent',
        text: 'Elva renner stille, brun av høstvann, med vier langs kanten.\n\nDen er ikke en fluktvei og ikke et forsvar. Den er det som deler dagen i to: det som skjer på den ene siden, og det som skjer på den andre.\n\nVeien hjem til skipene går den veien du kom. Fem timers gange, langs elva og videre sørover.',
        stikkord: ['derwent', 'terreng', 'hjemvei'],
    },
    /**
     * Merket.
     *
     * Landøyda er med fordi et merke er hvordan en hær vet hvor kongen er, og
     * fordi hele kapittelets slutt henger i det: eleven kommer til å se etter
     * det, og en dag kommer det ikke opp igjen.
     */
    {
        id: 'merket-landoyda',
        kind: 'skilt',
        tile: [RINGEN_MIDT[0] + 5, RINGEN_Y - 2],
        title: 'Landøyda',
        text: 'Kongens merke står plantet i bakken: et ravnemerke på hvit duk, på en stang så lang at to mann trengs for å bære det.\n\nDet heter Landøyda. Kongen sier at den siden det bæres foran, vinner.\n\nEt merke er ikke pynt. Det er slik tre tusen mann vet hvor kongen står, uten å se ham. Går det ned, vet alle det med én gang, og alle vet hva det betyr.',
        stikkord: ['merke', 'landøyda', 'hærordning', 'konge'],
    },
    /**
     * Rekka.
     *
     * Samme knapp, samme ord og samme sted i bildet som på Stiklestad. Det er
     * ikke latskap: eleven skal kjenne igjen handlingen fra 1030 og gå inn i
     * den med skuldrene senket. Alt som er annerledes, skal hun oppdage inne i
     * rekka, ikke lese på et skilt utenfor den.
     */
    {
        id: 'rekka-brua',
        kind: 'skilt',
        tile: [RINGEN_MIDT[0], RINGEN_Y + 2],
        title: 'Rekka',
        text: 'De som kom over brua, stiller seg opp på høyden, skulder ved skulder, med brumunnen rett foran seg.\n\nDu kan reglene. Stå. Ikke gå fram. Skjoldet ditt dekker deg og halve mannen til venstre.\n\nDet er én ting som er annerledes enn sist, og alle her vet hva det er: dere har ikke jernet deres. Det ligger i kistene, fem timers gange herfra.',
        stikkord: ['skjoldborg', 'rekke', 'brynje'],
        handling: {
            id: 'still-deg-i-brua-rekka',
            knapp: 'Still deg i rekka',
            krever: [K5.stovet],
        },
    },
];

/**
 * Skjermbildet der dagen snur.
 *
 * Ligger her og ikke i scenen fordi det er tekst, og fordi den er det ene
 * stedet i kapittelet der fire ting skjer samtidig og må stå i riktig
 * rekkefølge: de ser hæren, de forstår hva den er, kongen sender bud etter
 * jernet, og hæren snur.
 *
 * Bildet av våpnene som glitrer «som is som er brutt opp» er Snorres, skrevet
 * hundre og seksti år etter. Vi bruker det, og Mellomspill V legger det på
 * bordet og spør hvor han hadde det fra. Det er samme grep som med kampen på
 * Lindisfarne (blueprint §16.4): et spill som viser fram sin egen dikting, er
 * kildekritikk eleven ikke kan lese seg til.
 */
export const STOVET_PAA_VEIEN = {
    tittel: 'Støvet på veien',
    tekst: [
        'Først er det bare en sky over veien, slik det blir når mange går på tørr mark. Noen sier det er gislene. Det er for mye støv til å være gutter.',
        'Så kommer det fram under skyen, og det står stille et øyeblikk i sola: jern. Så mange spydspisser og hjelmer at det glitrer som is som er brutt opp. Hundre og seksti år senere skriver en islending ned nettopp det bildet, og han var ikke her.',
        'Det er Harald Godwinson. Han har ført hæren sin fra London på fire dager, opp gjennom hele England, og ingen trodde det lot seg gjøre. De har hatt rett i alt de trodde om dagen i dag. De har tatt feil om én ting: hvor fort en mann kan gå.',
        'To ryttere kommer ut foran hæren. De roper at Tostig kan få jarledømmet sitt tilbake. Tostig roper tilbake og spør hva broren hans vil gi kongen av Norge. Svaret er sju fot engelsk jord, eller så mye mer som han er høyere enn andre menn.',
        'Kongen sender tre mann i galopp mot skipene etter resten av hæren og etter brynjene. Så gir han ordre om at alle skal over brua og stille seg opp på høyden på den andre siden.',
    ].join('\n\n'),
    knapp: 'Over brua',
};
