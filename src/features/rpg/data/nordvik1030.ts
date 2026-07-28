// Nordvik i 1030. Samme gård, femogtretti år etter Torgils, og første gang
// eleven kommer til en gård som er kristen fra før.
//
// Halvard er født året etter at kirken ble reist. Han har aldri sett hovet,
// aldri vært på et blot, og han er døpt som spedbarn av en prest han ikke
// husker. Det er ikke et innfall: kristningen tok én generasjon på hver gård,
// og den som ble født etterpå kjente ingen annen verden.
//
// **Det kapittelet handler om, står i den setningen.** Om noen dager går
// Halvard mot kongen som gjorde landet kristent, sammen med naboer som også er
// døpt, og med et kors om halsen. Slaget på Stiklestad var ikke hedninger mot
// kristne. Det var kristne bønder og misfornøyde stormenn mot en kristen konge,
// og alt som senere er fortalt om det, er fortalt av kirken hans.
//
// **Folkene her er valgt for å dekke det.** Bård bærer budstikka og vet hvem
// som holder i den andre enden. Skofte har stått i skjoldborg før og kan
// reglene. Torgils er faren, femogfemti vintrer, og han husker den kvelden i
// 995 - eleven spilte den. Sigurd er presten, født her, og han vet ikke hva han
// skal be om.

import { NORDVIK_LANDMARKS, NORDVIK_PORTAL, NORDVIK_SPAWN } from './nordvik';
import { TORSTEINS_HAUG } from './nordvik872';
import { AASAS_HAUG, HOVET } from './nordvik995';
import { K3_FLAGG } from './kapitler';
import type { LandmarkDef, NpcDef } from '../types';

/** Der Halvard står når kapittelet begynner: på tunet, midt i slåtten. */
export const NORDVIK_1030_SPAWN: [number, number] = NORDVIK_SPAWN;

/** Porten hjem til hallen. Samme rute i alle kapitlene - samme gård. */
export const NORDVIK_1030_PORTAL: [number, number] = NORDVIK_PORTAL;

/**
 * Kirken, på hovets grunn.
 *
 * Samme rute som `HOVET`, og det er hele poenget. Under gulvet i Mære kirke
 * ligger gullgubber fra hedensk kult: kirkene ble reist der folk kom fra før,
 * og stien opp dit var alt tråkket.
 */
export const KIRKEN: [number, number] = HOVET;

/**
 * Ruta foran naustet, der båtene ligger.
 *
 * Foran og ikke oppå: naustet er bygget med `bygg()`, og hele fotavtrykket er
 * sperret. Et landemerke inne i veggen kan eleven aldri stille seg inntil.
 */
export const UTFERD: [number, number] = [8, 37];

export const NORDVIK_1030_NPCS: NpcDef[] = [
    {
        id: 'ragnhild',
        name: 'Ragnhild',
        role: 'Kona di. Husfrue på Nordvik.',
        tile: [19, 31],
        ser: 'ned',
        palette: { tunic: '#5f6b52', trim: '#e0d6b8', hair: '#a8925c' },
        smalltalk: [
            'Høyet ligger slått på bakken. Kommer regnet før dere er tilbake, har vi ingen vinterfôr.',
            'Jeg sier ikke at du skal la være. Jeg sier at jeg vet hva det koster.',
            'Nøklene henger her. Det har de gjort før, når menn har dratt.',
        ],
        kunnskap: [
            {
                tekst: 'Slåtten er nå. Graset må slås, tørkes og kjøres inn før det regner, ellers råtner det på bakken. Har vi ikke høy, kan vi ikke fø dyra gjennom vinteren, og da må vi slakte alt vi ikke greier å berge.',
                stikkord: ['slått', 'høy', 'gårdsår'],
            },
            {
                tekst: 'Hver gang en konge kaller ut folk, kalles de ut om sommeren. Det er da det går an å seile, og det er da gården trenger hver hånd. En hær koster mer enn menn - den koster året.',
                stikkord: ['leidang', 'utbud', 'sommer'],
            },
        ],
    },
    /**
     * Faren. Eleven spilte ham for femogtretti år siden.
     *
     * Han sier ikke hvordan det gikk den kvelden - det står i flaggene, og de
     * leses av steinen og av kirken. Det han sier, er det ingen kilde sier: at
     * det gikk fort.
     */
    {
        id: 'torgils-gamle',
        name: 'Torgils Ketilsson',
        role: 'Far din. Femogfemti vintrer.',
        tile: [21, 33],
        ser: 'hoyre',
        palette: { tunic: '#4a4237', trim: '#b4a684', hair: '#d8d4cc' },
        smalltalk: [
            'Jeg var nitten da de kom inn vika med den presten. Du var ikke født.',
            'Du har aldri sett hovet. Det står i deg likevel, om du bare visste hvor du skulle se etter.',
            'Jeg blir her. Jeg kan ikke løpe lenger enn til naustet.',
        ],
        kunnskap: [
            {
                tekst: 'Det tok én sommer på denne gården. En konge kom med tolv menn, ga en frist, og så var vi kristne. Sønnen min ble døpt før han kunne gå. Han vet ikke om noe annet, og han spør ikke.',
                stikkord: ['kristningen', 'dåp', 'gård'],
            },
            {
                tekst: 'Olav Haraldsson er den andre Olav. Den første, Tryggvason, kom hit og krevde. Denne har gjort det samme, men han har også laget lov om det: hva vi skal spise, når vi skal faste, hvem som kan gifte seg med hvem. En konge som bestemmer over søndagen din, er noe nytt.',
                stikkord: ['olav haraldsson', 'kristenrett', 'lov'],
            },
            {
                tekst: 'Før avgjorde vi ting på tinget, og kongen var en mann som kom og dro. Nå har han menn sittende på gårdene - årmenn og sysselmenn - som krever inn for ham hele året. Det er ikke troen folk her er sinte for.',
                stikkord: ['årmann', 'kongsmakt', 'ting'],
            },
        ],
    },
    /**
     * Sønnen. Femten vintrer, og han er ikke redd - han har aldri sett noe å
     * være redd for.
     *
     * Valget om han blir med, er kapittelets ene valg før slaget, og det er
     * ikke et moralsk valg med et riktig svar. Det er formasjonen: i en
     * skjoldborg dekker skjoldet ditt halve mannen til venstre for deg, og det
     * er ham eller Skofte som kommer til å stå der.
     */
    {
        id: 'aasmund',
        name: 'Åsmund Halvardsson',
        role: 'Sønn din. Femten vintrer.',
        tile: [23, 31],
        ser: 'venstre',
        palette: { tunic: '#6a7f8a', trim: '#dcd0ae', hair: '#c8a852' },
        smalltalk: [
            'Jeg kan bære spyd. Jeg har båret ljå i to uker, det er tyngre.',
            'Bård sier at halve Trøndelag kommer. Da må vel jeg også?',
            'Bestefar sier ingenting når jeg spør ham om det.',
        ],
        kunnskap: [
            {
                tekst: 'Jeg har aldri sett en kamp. Jeg har sett to karer slåss ved naustet, men det var ikke sånn, sier de. De sier at det er lyden som er verst.',
                stikkord: ['kamp', 'ungdom'],
            },
        ],
        handlinger: [
            {
                id: 'aasmund-med',
                knapp: 'Han blir med',
                ledetekst:
                    'Far. Jeg er femten. Halvor på Sæbø er femten, og han går.\n\nJeg står ved siden av deg. Jeg går ikke fra deg.',
                krever: ['k4-budstikka'],
                gir: 'k4-hvem-drar',
                etterpa: 'Jeg har slipt spydet to ganger. Det blir ikke skarpere av å slipes tre.',
            },
            {
                id: 'aasmund-hjemme',
                knapp: 'Han blir hjemme',
                ledetekst:
                    'Far. Jeg er femten. Halvor på Sæbø er femten, og han går.\n\nJeg står ved siden av deg. Jeg går ikke fra deg.',
                krever: ['k4-budstikka'],
                gir: 'k4-hvem-drar',
                etterpa: 'Jeg sa ikke mer. Det er ikke noe å si mer om.',
            },
        ],
    },
    /**
     * Budbæreren.
     *
     * Han er fra Sæbø - ætta Åsa ga korn til i 872, og som stilte seg foran
     * tunet hennes samme høst. Hundre og femtiåtte år etter kommer en av dem
     * gående opp stien med en hærpil, og gjelden går fortsatt begge veier.
     */
    {
        id: 'baard-saebo',
        name: 'Bård på Sæbø',
        role: 'Naboen. Kom i morges med budstikka.',
        tile: [16, 33],
        ser: 'hoyre',
        palette: { tunic: '#7a6a4a', trim: '#c9bd94', hair: '#6a5030' },
        smalltalk: [
            'Den har vært på fire gårder før din. Den skal videre til Melhus i kveld.',
            'Nei, jeg vet ikke hvem som skar den ut. Den kom ovenfra.',
            'Kalv Arnesson har sendt bud. Tore Hund fra Bjarkøy er alt på vei sørover.',
        ],
        kunnskap: [
            {
                tekst: 'Dette er en budstikke - en pil skåret i tre. Den går fra gård til gård, og den som tar imot den, skal sende den videre samme dag og selv møte med våpen. Å la den ligge er bot, og verre: alle vet hvem som lot den ligge.',
                stikkord: ['budstikke', 'hærpil', 'utbud'],
            },
            {
                tekst: 'Det er ikke bøndene som har begynt dette. Det er stormennene: Kalv Arnesson, som var kongens egen mann til kongen lot stesønnene hans drepe, og Tore Hund fra Bjarkøy, som mistet en brorsønn på samme vis. De har sølv fra Knut den mektige i Danmark. Vi har ljåer.',
                stikkord: ['kalv arnesson', 'tore hund', 'knut den mektige'],
                begrep: 'bondehaeren',
            },
            {
                tekst: 'Olav rømte til Gardarike for to år siden, da Knut kom med flåten sin og alle stormennene gikk over. Nå er han på vei tilbake gjennom Sverige med det han fikk med seg derfra. Han har ikke mange menn. Han har rett til kronen, sier han.',
                stikkord: ['gardarike', 'knut den mektige', 'olav haraldsson'],
            },
        ],
        handlinger: [
            {
                id: 'baard-budstikka',
                knapp: 'Ta imot budstikka',
                ledetekst:
                    'Halvard. Den er til deg også.\n\nOlav Haraldsson er på vei ned Verdalen med hæren sin. Han kommer for å ta landet tilbake, og han begynner der vi bor.\n\nKalv og Tore samler alt som kan bære skjold ved Stiklestad. Du skal møte der. Tar du imot, sender du henne videre i dag.',
                gir: 'k4-budstikka',
                etterpa: 'Du har tatt imot. Da er det ikke mer å snakke om her.',
            },
        ],
    },
    /**
     * Han som har stått i en før.
     *
     * Reglene i skjoldborgen sies av et menneske som har overlevd dem, og de
     * sies *før* eleven står i den. Det er ikke en hjelpetekst: en bondehær
     * hadde ingen øvelse, og det eneste den hadde, var noen gamle karer som
     * kunne fortelle hvor man skulle stå.
     */
    {
        id: 'skofte',
        name: 'Skofte Gamle',
        role: 'Har vært i leidangen. To ganger.',
        tile: [25, 34],
        ser: 'opp',
        palette: { tunic: '#5a5548', trim: '#a89878', hair: '#b8b0a0' },
        smalltalk: [
            'Spyd. Ikke øks. Hører du etter, gutt, så tar du spyd.',
            'Jeg har stått i to. Jeg står i den tredje fordi jeg vet hvor jeg skal stå.',
            'Den som løper fram, dreper mannen ved siden av seg. Det er ikke et ordtak.',
        ],
        kunnskap: [
            {
                tekst: 'En skjoldborg er en rekke. Skjoldene ligger kant i kant, og skjoldet ditt dekker deg og halve mannen til venstre for deg. Mannen til høyre for deg dekker halve deg. Ingen står bak sitt eget skjold alene.',
                stikkord: ['skjoldborg', 'formasjon', 'skjold'],
                begrep: 'skjoldborg',
            },
            {
                tekst: 'Går du fram, åpner du et hull. Da har mannen til venstre ingenting foran seg, og han faller - og så brister rekka utover fra der du sto. Derfor vinner den siden som greier å stå stille lengst, ikke den som slår hardest.',
                stikkord: ['skjoldborg', 'disiplin'],
            },
            {
                tekst: 'Spydet er våpenet i rekka. Det når over skjoldene og krever ikke plass å svinge på. En øks trenger albuerom, og albuerom er nettopp det ingen har der inne. Alt du har lært om å slåss én mot én, er feil i en skjoldborg.',
                stikkord: ['spyd', 'øks', 'rekkevidde'],
            },
        ],
    },
    /**
     * Presten.
     *
     * Han velsigner ingenting. Det er et valg: en prest som sender bøndene av
     * gårde med Guds ord i ryggen ville gjort kapittelet til en fortelling om
     * hvem Gud var med, og det er nøyaktig den fortellingen mellomspillet
     * skal ta fra hverandre etterpå.
     */
    {
        id: 'sigurd-prest',
        name: 'Presten Sigurd',
        role: 'Født her. Lærte messa i Nidaros.',
        tile: [KIRKEN[0] - 1, KIRKEN[1] + 3],
        ser: 'opp',
        palette: { tunic: '#d8d4c8', trim: '#8a8478', hair: '#5a5048' },
        smalltalk: [
            'Kongen er kristen. Dere er kristne. Jeg vet ikke hva jeg skal be om i dag.',
            'Faren din kommer hit på søndagene. Han går aldri lenger inn enn til døra.',
            'Jeg er født på gården nedenfor. Det er ikke lenger engelskmenn som gjør dette.',
        ],
        kunnskap: [
            {
                tekst: 'Alle som skal møte ved Stiklestad, er døpt. Kongen er døpt. Dette er ikke en strid mellom to guder - det er en strid om hvem som skal styre, og begge sider ber til den samme.',
                stikkord: ['kristendom', 'stiklestad', 'strid'],
            },
            {
                tekst: 'Olav har gitt landet en kristenrett: regler om faste, om helligdager, om hvem som kan gifte seg med hvem, og om at ingen skal sette ut barn eller blote. Loven er ny, og den blir krevd inn av kongens menn. Mange her mener at en konge ikke skal ha noe med søndagen deres å gjøre.',
                stikkord: ['kristenrett', 'lov', 'faste'],
            },
            {
                tekst: 'De som skriver, er oss. Munker og prester. Om hundre år er det vi som har fortalt hva som hendte her, og ingen av dere kommer til å ha skrevet ett ord.',
                stikkord: ['skrift', 'kilde', 'kirken'],
            },
        ],
    },
];

/**
 * Steinen på Torsteins haug, 158 år etter at Åsa reiste den.
 *
 * Tredje gang eleven ser den. I 872 sto hele innskriften; i 995 var halve
 * skavet bort; nå er det fire runer og et navn som ikke er hans. Kilden
 * forvitrer mens hun ser på den, og det er den stilleste kildekritikken i hele
 * kampanjen fordi ingen sier noe om den.
 */
export const TORSTEINS_STEIN_1030: LandmarkDef = {
    id: 'haug-torstein-1030',
    kind: 'runestein',
    tile: [TORSTEINS_HAUG[0], TORSTEINS_HAUG[1] - 1],
    title: 'Steinen som er igjen',
    text: 'Steinen har lagt seg over mot nord, og mosen har tatt det meste.\n\n«... denne st... etter ...son. Han b... skip ...»\n\nFaren din sier at den sto rett da han var gutt. Ingen her kan lese runer lenger. Presten kan lese, men han leser en annen skrift.',
    stikkord: ['runestein', 'gravhaug', 'forvitring'],
};

export const NORDVIK_1030_LANDMARKS: LandmarkDef[] = [
    TORSTEINS_STEIN_1030,
    {
        id: 'haugene-1030',
        kind: 'skilt',
        tile: [AASAS_HAUG[0], AASAS_HAUG[1] - 1],
        title: 'Haugene ved naustet',
        text: 'To hauger med gress på, og den ene har aldri hatt noen stein.\n\nDe gravlegges ikke her lenger. De som dør på Nordvik nå, ligger i vigslet jord ved kirken, i rader, med hodet mot vest.\n\nEn ny gravskikk er det synligste kristendommen gjorde, og det tok ikke mer enn ett slektsledd.',
        stikkord: ['gravhaug', 'gravskikk', 'kristningen'],
    },
    /**
     * Kirken.
     *
     * Å lese den *er* å se hva kapittelet handler om: den står på hovets grunn,
     * den er trettifem år gammel, og mannen som skal gå mot kongen om noen
     * dager er døpt i den. Derfor har den `tillegg` som leser flaggene fra 995 -
     * gården husker hva Torgils svarte, selv om ingen kilde gjør det.
     */
    {
        id: 'kirken-1030',
        kind: 'skilt',
        tile: [KIRKEN[0], KIRKEN[1] + 3],
        title: 'Kirken',
        text: 'Et smalt hus av stavverk, høyere enn det er bredt, med en svalgang rundt og et kors i mønet. Innenfor er det mørkt, og det lukter tjære.\n\nDen står der hovet sto. Stien opp er den samme stien.\n\nDu ble født året etter at den ble reist. Du er døpt i den, du er gift i den, og om noen dager går du mot kongen som gjorde landet kristent.',
        stikkord: ['kirke', 'stavkirke', 'kristningen'],
        tillegg: [
            {
                flagg: K3_FLAGG.nektet,
                tekst: 'Far din sa nei den gangen. De rev hovet likevel, og de bygde denne. Han går til messe, og han går aldri lenger inn enn til døra.',
            },
            {
                flagg: K3_FLAGG.primsignet,
                tekst: 'Far din tok korsets tegn uten dåpen den gangen. Han lot seg døpe et par år senere, uten at noen spurte ham. Han snakker ikke om det.',
            },
            {
                flagg: K3_FLAGG.dopt,
                tekst: 'Far din lot hele gården døpe den gangen, og fikk en armring av kongen for det. Ringen ligger i kista. Han har aldri gått med den.',
            },
        ],
    },
    {
        id: 'slaatten-1030',
        kind: 'skilt',
        tile: [28, 36],
        title: 'Enga',
        text: 'Graset ligger slått i strenger over hele enga. Det er tørt vær nå, og det må snus i morgen og kjøres inn i overmorgen.\n\nDet kommer ikke til å bli snudd i morgen.\n\nEn hær som kalles ut om sommeren, kalles ut nøyaktig når gården trenger hver hånd. Det er ikke uflaks - det er den eneste årstiden en hær kan flytte seg i.',
        stikkord: ['slått', 'høy', 'utbud', 'årshjul'],
    },
    {
        id: 'naustet-1030',
        kind: 'skilt',
        tile: UTFERD,
        title: 'Naustet',
        text: 'Båten ligger klar med spydene i. Fra vika ror dere inn fjorden til bunnen, og så går dere opp dalen til fots. To dager, om været holder.\n\nDet ligger fire båter i vika allerede. Gårdene lenger ute er alt på vannet.',
        stikkord: ['utferd', 'stiklestad', 'utbud'],
    },
    // Steinene fra 793 står ennå. Det eleven leste som Torstein, som Åsa og som
    // Torgils, kan hun lese en fjerde gang.
    ...NORDVIK_LANDMARKS.filter((l) => ['runestein-navnet', 'runestein-hallen'].includes(l.id)),
];
