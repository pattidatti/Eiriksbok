// Nordvik i 995. Samme gård, 123 år etter Åsa, og et skip i vika som ikke
// hører hjemme der.
//
// Olav Tryggvason er tatt til konge. Han ble døpt i England, og han seiler
// kysten fjord for fjord med tolv menn i brynje og en prest. Torgils er nitten
// vintrer og har aldri sett noe annet enn hovet oppe i lia.
//
// **Folkene her er valgt for å dekke kapittelets fag, ikke for å fylle tunet.**
// Ulv holder hovet og vet hva et blot er. Steinar er broren, og han har vært
// ute og sett hvem som handler med hvem. Åsleiv er primsignet og kan forklare
// hvorfor det finnes en mellomting. Ragnvald bærer kongens vilkår, og Eadwulf
// bærer gudens.
//
// To hauger ligger sør for tunet nå. På den ene står Torsteins stein, med
// halve innskriften slitt bort. Den andre har ingen stein, og ingen på gården
// kan si hvem som ligger der. Eleven vet det.

import { NORDVIK_LANDMARKS, NORDVIK_PORTAL, NORDVIK_SPAWN } from './nordvik';
import { TORSTEINS_HAUG } from './nordvik872';
import type { LandmarkDef, NpcDef } from '../types';

/** Der Torgils står når kapittelet begynner: på tunet, med utsikt til vika. */
export const NORDVIK_995_SPAWN: [number, number] = NORDVIK_SPAWN;

/** Porten hjem til hallen. Samme rute i alle tre kapitlene - samme gård. */
export const NORDVIK_995_PORTAL: [number, number] = NORDVIK_PORTAL;

/**
 * Haugen ingen kan navnet på.
 *
 * Åsa ligger her. Hun styrte gården gjennom et helt år alene, og eleven spilte
 * det året. Hundre og tjuetre år senere er det ingen igjen som vet det, og det
 * står ingen stein. Det er ikke en glemsel spillet har funnet på: en grav uten
 * innskrift er den vanligste graven som finnes.
 */
export const AASAS_HAUG: [number, number] = [14, 38];

/**
 * Hovet oppe i lia, nord for tunet. Kirken reises her til slutt.
 *
 * Godt nord for tingvollen med vilje: de to er forskjellige institusjoner, og
 * la de to lysningene flyte sammen, leser hovet som en del av tinget.
 */
export const HOVET: [number, number] = [30, 14];

/**
 * Midt på tingvollen. Huden legges ut der bygda alt samles.
 *
 * Ruta står her og ikke i `engine/holmgang.ts` med vilje: landemerket på
 * vollen må kjenne den, og en motor som importerer et sted som importerer
 * motoren tilbake er en ring modullasteren ikke kommer ut av.
 */
export const HUD_MIDT: [number, number] = [38, 24];

/** Kongens knarr, der den ligger i vika. */
export const KONGENS_KNARR: [number, number] = [3, 30];

export const NORDVIK_995_NPCS: NpcDef[] = [
    {
        id: 'gudrid',
        name: 'Gudrid',
        role: 'Mor din. Husfrue på Nordvik.',
        tile: [19, 31],
        ser: 'ned',
        palette: { tunic: '#5a4a6a', trim: '#dcd0ae', hair: '#b0a89a' },
        smalltalk: [
            'Gudene har fått sitt her så lenge noen kan huske. Nå står det et skip i vika.',
            'Jeg spør ikke hva du tror. Jeg spør hva du gjør når det blir vinternetter.',
            'Broren din har vært ute. Han kom hjem med andre ord enn han dro med.',
        ],
        kunnskap: [
            {
                tekst: 'Vi holder blot tre ganger i året. Ett når vinternettene kommer, ett midtvinters til jul, og ett om våren for at året skal bli godt. Det er ikke noe man tror på. Det er noe man gjør, som å så.',
                stikkord: ['blot', 'vinternetter', 'jul'],
            },
            {
                tekst: 'Der nede ligger to hauger. På den ene står en stein, og halve innskriften er borte. Den andre har ingen stein. Mor mi sa at det var en kvinne som styrte gården et år da hver mann var borte. Mer vet ingen her.',
                stikkord: ['gravhaug', 'minne'],
            },
        ],
    },
    {
        id: 'steinar-995',
        name: 'Steinar',
        role: 'Broren din. Tre vintrer eldre.',
        tile: [22, 30],
        ser: 'venstre',
        palette: { tunic: '#4a5f7a', trim: '#e0d4b0', hair: '#8a6a3a' },
        smalltalk: [
            'Jeg har vært i Jorvik og i Hedeby. Alle som teller sølv der, er døpt.',
            'Du tror dette handler om guder. Det handler om hvem som får handle med hvem.',
            'Jeg vil ikke slåss mot deg. Men jeg kommer ikke til å stå på din side heller.',
        ],
        kunnskap: [
            {
                tekst: 'En kristen kjøpmann handler helst med en kristen. Det er ikke ondskap - det er at han vet hvilken ed du kan sverge, og hvilken domstol som tar deg om du bryter den.',
                stikkord: ['handel', 'kjøpmann', 'ed'],
            },
            {
                tekst: 'Kongen gir gaver til dem som lar seg døpe, og han tar gisler av dem som nøler. Han står fadder for barn på de gårdene han vil binde til seg. En fadder er en slags slektning, og en konge med mange fadderbarn har mange slekter i hånden.',
                stikkord: ['fadder', 'gisler', 'kongsmakt'],
            },
        ],
    },
    {
        id: 'ulv-gode',
        name: 'Ulv Gode',
        role: 'Han som holder hovet',
        tile: [29, 17],
        ser: 'ned',
        palette: { tunic: '#4a4237', trim: '#a89060', hair: '#c8c0b0' },
        smalltalk: [
            'Hovet er ikke en kirke. Det er et hus der gudene får mat.',
            'Jeg eier hovet, og jeg tar imot for det. Så var det her lenge før meg også.',
            'De sier de har én gud. Jeg forstår ikke hvordan én gud skal rekke over alt.',
        ],
        kunnskap: [
            {
                tekst: 'Hver gud har sitt. Tor rår for været og verner gården. Frøy gir god avling og fred. Odin er for konger, for kamp og for dikt. Ber du Odin om korn, får du ikke korn.',
                stikkord: ['tor', 'frøy', 'odin', 'guder'],
            },
            {
                tekst: 'Blodet fra det vi ofrer, samles i en bolle. Så dyppes en kvist i det, og alt stenkes: veggene, benkene og folket. Kjøttet kokes, og vi spiser det sammen. Måltidet er ikke etterpå. Måltidet er blotet.',
                stikkord: ['blot', 'offer', 'hlaut'],
            },
            {
                tekst: 'Vi har ingen bok og ingen læresetning. Ingen har spurt meg hva jeg tror, og jeg ville ikke visst hva jeg skulle svare. Vi kaller det sida vår - det vi gjør, slik det alltid er gjort.',
                stikkord: ['sed', 'tro', 'hedendom'],
                begrep: 'sed',
            },
        ],
    },
    {
        id: 'aasleiv',
        name: 'Åsleiv Kremmer',
        role: 'Primsignet. Handler begge veier.',
        tile: [21, 33],
        ser: 'opp',
        palette: { tunic: '#8a6a3a', trim: '#e8c96a', hair: '#4a3a2a' },
        smalltalk: [
            'Jeg selger jern og salt. Jeg selger ikke meninger.',
            'Jeg har korset på meg i Jorvik og hammeren på meg her. Begge deler er ekte nok.',
            'Dere kommer til å bli enige til slutt. Dere er bare uenige om hvem som får si det først.',
        ],
        handler: {
            velkomst: 'Du har sølv. Jeg har det gården ikke lager selv. Resten angår ikke meg.',
            varer: ['vadmelskjortel', 'lerbrynje', 'tingspyd', 'jaktbue', 'kvernstein'],
        },
        kunnskap: [
            {
                tekst: 'Jeg er primsignet. Presten gjorde korsets tegn over meg, men jeg er ikke døpt. Da får jeg handle og spise med kristne, og jeg får være i huset deres. Det var slik mange av oss løste det: en fot i hver leir, og ingen som spurte for nøye.',
                stikkord: ['primsigning', 'kjøpmann'],
            },
            {
                tekst: 'En døpt mann kan ikke gå tilbake. Det er hele poenget med dåpen for kongen: den er ikke til å angre på, og den binder deg til hans folk.',
                stikkord: ['dåp', 'binding'],
            },
        ],
    },
    {
        id: 'torfinn',
        name: 'Torfinn Kåresson',
        role: 'Sønn av en frigitt mann',
        tile: [24, 34],
        ser: 'venstre',
        palette: { tunic: '#6b6255', trim: '#9a9080', hair: '#3a3028' },
        smalltalk: [
            'Far min ble frigitt. Det henger ved meg likevel, og det kommer til å henge ved barna mine.',
            'Presten sier at vi er like foran hans gud. Ingen har sagt det til meg før.',
            'Jeg har ikke noe hov å miste.',
        ],
        kunnskap: [
            {
                tekst: 'Frigitt er ikke fri født. Jeg kan ikke sitte hvor jeg vil på tinget, og jeg får ikke gifte meg inn hvor jeg vil. Ingen har skrevet det ned. Alle vet det.',
                stikkord: ['frigitt', 'trell', 'stand'],
            },
            {
                tekst: 'Kirken sier at en døpt mann ikke skal eie en døpt mann. Det tok flere hundre år før det betydde noe her, men det er det eneste jeg har hørt noen si om trellene i det hele tatt.',
                stikkord: ['trell', 'kirke', 'slaveri'],
            },
        ],
    },
    /**
     * Kongens mann i fjæra.
     *
     * Han er ikke en fiende ennå, og det er meningen. Vilkårene han bærer, er
     * det kapittelet handler om, og eleven skal ha hørt dem av et menneske som
     * mener det han sier.
     */
    {
        id: 'ragnvald',
        name: 'Ragnvald Kongsmann',
        role: 'Olav Tryggvasons hirdmann',
        tile: [10, 30],
        ser: 'hoyre',
        palette: { tunic: '#7a3a3a', trim: '#e8d8a0', hair: '#3a2a20' },
        smalltalk: [
            'Jeg har stått i tolv fjorder i sommer. Denne blir ikke den vanskeligste.',
            'Kongen var i England. Han så hvordan et land ser ut når det har én lov og én tro.',
            'Jeg spør ikke om du liker det. Jeg spør hva du gjør.',
        ],
        kunnskap: [
            {
                tekst: 'Olav Tryggvason ble døpt i England, og kong Adalråd sto fadder for ham. Han lovte å komme tilbake hit med troen. En konge som holder et slikt løfte, får kirken i ryggen resten av livet.',
                stikkord: ['olav tryggvason', 'dåp', 'england'],
            },
            {
                tekst: 'Håkon jarl styrte her før. Han er død nå. Trellen hans skar strupen over på ham mens de gjemte seg i et grisehus. Kongen lot trellen henrette etterpå - en mann som dreper sin egen herre, er ingen mann å ha rundt seg.',
                stikkord: ['håkon jarl', 'olav tryggvason'],
            },
        ],
        handlinger: [
            {
                id: 'ragnvald-vilkaarene',
                knapp: 'Hva vil dere?',
                ledetekst:
                    'Olav Tryggvason er konge nå. Han ble døpt i England, og han ga et løfte der: landet skal være kristent.\n\nVi seiler fjord for fjord. På den første gården spør vi pent. På den femte spør vi ikke.\n\nDere har til vinternettene. Da skal hovet stå tomt, og de som bor her skal være døpt.',
                gir: 'k3-knarren',
                etterpa: 'Du har hørt vilkårene. De blir ikke andre av at du spør en gang til.',
            },
        ],
    },
    /**
     * Han som lever av holmganger.
     *
     * Skjalg er ikke en troende og ikke en politiker. Han er en mann som er god
     * med sverd i et samfunn der en god sverdmann kunne kreve andres jord ved å
     * utfordre dem - og der en nekt var verre enn et tap. Han står i fjæra fra
     * første bilde, og han sier hva han er før han krever noe.
     */
    {
        id: 'skjalg-npc',
        name: 'Skjalg',
        role: 'En av de tolv. Kjent for noe annet.',
        tile: [11, 27],
        ser: 'hoyre',
        palette: { tunic: '#53607a', trim: '#c9c2ae', hair: '#8a7a52' },
        smalltalk: [
            'Jeg bryr meg ikke om hvilken gud du gir hesten din til.',
            'Jeg har gått ni holmganger. Jeg står her fremdeles.',
            'Du ser på hendene mine. Det gjør alle til slutt.',
        ],
        kunnskap: [
            {
                tekst: 'Holmgang er lov. Krever jeg deg ut, må du møte - nekter du, er du niding, og en niding kan ingen ta i hånden. Derfor kan en mann som meg kreve jorda til folk som ikke kan slåss, og få den.',
                stikkord: ['holmgang', 'niding'],
                begrep: 'holmgang',
            },
            {
                tekst: 'Den som taper, blør. Han dør ikke - han betaler tre mark sølv, og så er saken ute av verden. Holmløsning kalles det.',
                stikkord: ['holmløsning', 'bot'],
            },
        ],
        handlinger: [
            {
                id: 'skjalg-utfordring',
                knapp: 'Si det du har å si',
                ledetekst:
                    'Du holdt blot etter at kongen forbød det, og du gjorde det så hele fjorden så det.\n\nJeg krever deg ut på huden for det. Tingvollen, i morgen. Fem alen, tre skjold, og den som blør har tapt.\n\nMøter du ikke, sier jeg det jeg da har rett til å si om deg, og ingen her kan si meg imot.',
                // Først etter blotet. Det er blotet som gir ham påskuddet, og
                // uten det står utfordringen i lufta uten grunn.
                krever: ['k3-blotet'],
                gir: 'k3-utfordret',
                etterpa: 'Jeg står på vollen. Kom når du er klar.',
            },
        ],
    },
    {
        id: 'eadwulf',
        name: 'Presten Eadwulf',
        role: 'Kom med skipet. Snakker språket vårt.',
        tile: [9, 29],
        ser: 'hoyre',
        palette: { tunic: '#d8d4c8', trim: '#8a8478', hair: '#6a6058' },
        smalltalk: [
            'Jeg lærte ordene deres i Jorvik. Halve byen snakker som dere.',
            'Kongen har tolv menn med spyd. Jeg har vann og et kors. Gjett hvem folk hører på.',
            'Jeg døper gjerne uten at du forstår. Det gjør det ikke mindre gyldig, sier de.',
        ],
        kunnskap: [
            {
                tekst: 'Jeg kommer fra England. Nesten alle prestene kongen har med seg, gjør det - det var der han ble døpt, og det er derfra kirken har fulgt ham hit.',
                stikkord: ['england', 'misjon', 'prest'],
            },
            {
                tekst: 'Dere har mange guder, og dere kan legge til en til uten at noe blir feil. Det er der vi skiller lag. Min gud tåler ikke å være en av flere, og det er derfor dette ikke kan ende med at vi deler hovet.',
                stikkord: ['kristendom', 'guder', 'ene gud'],
            },
        ],
    },
];

/**
 * Steinen på Torsteins haug, 202 år etter at Åsa reiste den.
 *
 * Innskriften er ikke borte, den er slitt. Det eleven leser, er det som er
 * igjen - og hun har lest hele teksten før, i 872. Kilden forvitrer mens hun
 * ser på den, og det er kapittelets stilleste kildekritikk.
 */
export const TORSTEINS_STEIN_995: LandmarkDef = {
    id: 'haug-torstein-995',
    kind: 'runestein',
    tile: [TORSTEINS_HAUG[0], TORSTEINS_HAUG[1] - 1],
    title: 'Den slitte steinen',
    text: 'Mose i sporene, og halve runene er skavet bort av to hundre vintrer.\n\n«... reiste denne steinen etter ... Ormsson. Han bygde skip og seilte ...»\n\nIngen på gården vet hvem som reiste den, eller hvor han seilte.',
    stikkord: ['runestein', 'gravhaug', 'forvitring'],
};

export const NORDVIK_995_LANDMARKS: LandmarkDef[] = [
    TORSTEINS_STEIN_995,
    {
        id: 'haug-uten-stein',
        kind: 'skilt',
        tile: [AASAS_HAUG[0], AASAS_HAUG[1] - 1],
        title: 'Haugen uten stein',
        text: 'En lav haug med gress på. Ingen stein, ingen runer, ingenting skåret i noe som helst.\n\nMor sier at det ligger en kvinne der. Hun skal ha styrt gården et år da hver eneste mann var sør i krigen. Mer vet ingen.\n\nDu vet hva hun het.',
        stikkord: ['gravhaug', 'kildetaushet'],
    },
    /**
     * Hovet.
     *
     * Å lese det *er* å forstå begrepet: her er ingen benkerad, ingen bok og
     * ingen menighet. Det er et hus der gudene får mat, og ingen har spurt
     * noen hva de tror. Derfor står `sed` på `forstatt` her, etter samme regel
     * som runesteinen ved veien i 793.
     */
    {
        id: 'hovet-995',
        kind: 'skilt',
        tile: [HOVET[0], HOVET[1] + 2],
        title: 'Hovet',
        text: 'Et langt hus av tømmer, uten vinduer. Innenfor står tre trebilder på en benk langs veggen: Tor med hammeren, Frøy, og Odin med ett øye.\n\nDet finnes ingen bok her, ingen benkerader og ingen menighet. Det finnes en bolle, en kvist, og et ildsted stort nok til å koke kjøtt til hele bygda.\n\nIngen har noen gang spurt deg hva du tror. De har spurt om du kommer til blotet.',
        stikkord: ['hov', 'gudebilde', 'hedendom'],
        begrep: { id: 'sed', niva: 'forstatt' },
        /**
         * Knappen står på hovet og ikke på Ulv.
         *
         * Et blot er ikke noe godene gir deg lov til. Det er noe gården holder,
         * og Torgils er gårdens mann. Han kan holde det igjen senere også -
         * horgen står der hele året, og folk blotet når de trengte noe.
         */
        handling: { id: 'hold-blot', knapp: 'Hold blot', krever: ['k3-knarren'] },
    },
    {
        id: 'horgen',
        kind: 'runestein',
        tile: [HOVET[0] + 3, HOVET[1] + 1],
        title: 'Horgen',
        text: 'En haug av flate steiner ute i det fri, svart av gammelt blod og sot.\n\nHorgen er alteret utendørs. Hovet er huset. Begge deler brukes, og det er ingen som har bestemt hvilken av dem som er den rette.',
        stikkord: ['horg', 'alter', 'offer'],
    },
    /**
     * Tingvollen, som i 995 er noe annet enn en tingplass.
     *
     * Huden legges ut der, og det er ikke tilfeldig: holmgangen var en
     * rettsordning, ikke et slagsmål. Den avgjorde saker, og den ble holdt der
     * folk møttes for å avgjøre saker.
     */
    {
        id: 'vollen-995',
        kind: 'baal',
        tile: [HUD_MIDT[0], HUD_MIDT[1] + 4],
        title: 'Tingvollen',
        text: 'En flat, tråkket ring med stein rundt. Her settes tinget om sommeren, og her legges huden ut når to menn skal gjøre opp med jern.\n\nEn holmgang er ikke et slagsmål. Det er en måte å avgjøre en sak på, med regler alle kan reglene til: fem alen hud, tre skjold, og den som blør har tapt.',
        stikkord: ['holmgang', 'ting', 'rettsordning'],
        handling: {
            id: 'gaa-paa-huden',
            knapp: 'Gå ut på huden',
            // Bare når det står en avtale i verden. En knapp som ikke gjør noe,
            // lærer eleven at knapper ikke gjør noe.
            krever: ['k3-utfordret'],
        },
    },
    /**
     * Hallen. Der gården samles når noe skal avgjøres.
     *
     * Knappen er kapittelets siste handling, og den står på huset og ikke på et
     * menneske: det er husstanden som skal svare, og husbonden svarer for den.
     */
    {
        id: 'langhuset-995',
        kind: 'skilt',
        tile: [18, 30],
        title: 'Hallen',
        text: 'Ett langt rom med ildsted midt på gulvet og benker langs begge veggene. Her sover folkene, her spises det, og her avgjøres det som skal avgjøres.\n\nEn gård er ikke en samling enkeltmennesker. Den er en husstand, og den har én husbonde. Det er ham fremmede snakker med, og det er ham de holder ansvarlig.',
        stikkord: ['langhus', 'husstand', 'husbonde'],
        handling: {
            id: 'kall-sammen',
            knapp: 'Kall folkene sammen',
            krever: ['k3-holmgangen'],
        },
    },
    {
        id: 'fjaera-995',
        kind: 'skilt',
        tile: [11, 30],
        title: 'Fjæra nedenfor tunet',
        text: 'Knarren ligger på svai ute i vika. Den er bredere enn skipene her - den er bygget for last, ikke for fart.\n\nTolv menn har gått i land. Elleve av dem bærer brynje. Den tolvte bærer en bøtte med vann.',
        stikkord: ['knarr', 'landgang'],
    },
    // Steinene fra 793 står ennå. Det er de samme objektene med vilje: det
    // eleven leste som Torstein og som Åsa, kan hun lese en tredje gang.
    ...NORDVIK_LANDMARKS.filter((l) => ['runestein-navnet', 'runestein-hallen'].includes(l.id)),
];
