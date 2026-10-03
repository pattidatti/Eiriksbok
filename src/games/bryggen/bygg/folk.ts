// Folk i gården: drakten til hver figur, og de som står, sitter og jobber i bua og schøtstua.
//
// Hvem som var der [V]: gårdene var delt i stuer med hver sin husbonde. Under ham sto svenner
// (gesell), skutedrenger og stuedrenger/junger, alle ugifte menn og gutter fra nordtyske
// hansabyer (SNL Det tyske kontor; Hanseatiske museum). Rangstigen og hvem som gjorde hva
// (stuedrengen lager mat, skutedrengen laster og losser, svennen lærer guttene å skrive og regne)
// er fortalt for 1600- og 1700-tallet; for 1420-årene er det usikkert [U]. Schøtstua var samlingsrommet
// for hele gården om vinteren [V]. Hvem som satt hvor og gjorde hva her, er valgt for spillet [S].
//
// Klærne: kjortel med belte, hette med kappe over skuldrene og lang tut bak (liripipe), hoser
// og lave sko. Funnene fra Herjolfsnes på Grønland (hetter med tut, kjortler og hoser, laget så sent
// som i 1430-årene) og Bockstensmannen fra Sverige (1340-1370) viser at slik gikk menn kledd i
// Nord-Europa i senmiddelalderen [V]. På Bryggen er det funnet sko og tekstiler i hopetall [V
// Bymuseet]. Fargene er et valg [S]: ufarget vadmel i grått og brunt for guttene, plantefarget
// blått og rødt for husbonden, som hadde råd. Snitt og farger på Bryggen akkurat i 1420-årene er
// ikke sjekket mot Bryggens Museum [K].
import * as THREE from 'three';
import { Animator, loadRig } from '../motor/animator';
import { kleFigur, RIG_URL, type Drakt } from '../motor/figur';
import { cullFigur, FigurLod } from '../motor/figurlod';
import type { Portaler } from '../motor/portal';
import { ColliderKit, MeshKit, type ColliderSpec } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import { disposeObject, type CellCtx, type Snakkbar } from '../motor/streaming';
import { Vandrer, type Rute } from './vandrer';
import { Gestikk } from '../motor/gestikk';

const HUD = 0xd9a88a;

export const DRAKTER = {
    /** Gutten man spiller: 12 år, kort kjortel i ufarget vadmel, hetta nede som krage. */
    junge: {
        navn: 'junge', hud: HUD, haar: 0xc29a5e, kjortel: 0x7d705d, kjortelNed: -0.06, belte: 0x3b2a1e,
        hoser: 0x5b5047, sko: 0x3a2a1f, hette: 0x8e8068, hetteOppe: false, tut: 0.16, kappe: 0.15,
        slank: 0.6, hode: 1.07,
    },
    /** Husbonden: lang, blå kjortel, rød hette oppe med lang tut, mage og skjegg, pung i beltet. */
    husbonde: {
        navn: 'husbonde', hud: 0xd3a083, haar: 0x5b4632, skjegg: 0x6b5541, kjortel: 0x2e4868, kjortelNed: 0.24,
        belte: 0x2a1d14, hoser: 0x5c2b24, sko: 0x2b1f17, hette: 0x7c2f25, hetteOppe: true, tut: 0.42, kappe: 0.2,
        mage: 0.85, pung: 0.9,
    },
    /** Svennen: brungrønn kjortel til under kneet, brun hette oppe, kort skjegg. */
    svenn: {
        navn: 'svenn', hud: 0xcf9c80, haar: 0x3e2f22, skjegg: 0x4a3828, kjortel: 0x535b3c, kjortelNed: 0.08,
        belte: 0x33241a, hoser: 0x4d443b, sko: 0x2e2219, hette: 0x5f4a36, hetteOppe: true, tut: 0.28, kappe: 0.17,
        mage: 0.15,
    },
    /** Skutedrengen: et par år eldre enn jungen, gråbrun vadmel, hetta nede. */
    dreng: {
        navn: 'dreng', hud: 0xd6a487, haar: 0x7a5a3a, kjortel: 0x6c5a47, kjortelNed: -0.03, belte: 0x3a281c,
        hoser: 0x4f463e, sko: 0x35271c, hette: 0x7f7563, hetteOppe: false, tut: 0.2, kappe: 0.16,
        slank: 0.35, hode: 1.03,
    },
    /** Stuedrengen: en junge til, yngre enn skutedrengen, lysere vadmel og blågrå hette. */
    stuedreng: {
        navn: 'stuedreng', hud: 0xdcae92, haar: 0x3f3226, kjortel: 0x8b806c, kjortelNed: -0.05, belte: 0x3b2a1e,
        hoser: 0x5e554b, sko: 0x3a2a1f, hette: 0x666d78, hetteOppe: false, tut: 0.14, kappe: 0.14,
        slank: 0.55, hode: 1.06,
    },
    /**
     * Nordlandsfiskeren som har kommet med jekta: grå vadmel, hetta oppe, skjegg, mørkere hud
     * av vær og vind. Ingen pung. Klærne til fiskerne i nord i 1420-årene er ikke sjekket [K];
     * dette er et valg [S].
     */
    fisker: {
        navn: 'fisker', hud: 0xc48f72, haar: 0x6e604f, skjegg: 0x7a6a58, kjortel: 0x5e5a52, kjortelNed: 0.04,
        belte: 0x2f2419, hoser: 0x48413a, sko: 0x3b2c20, hette: 0x4f5458, hetteOppe: true, tut: 0.12, kappe: 0.22,
        mage: 0.05,
    },

    // ── Norske byfolk på torget i Nikolaikirkeallmenningen (torgfolk.ts) ──
    // Draktene er valgt for spillet [S]: samme snitt som guttene på Kontoret (kjortel, hette,
    // hoser), kvinnene med kjortel til anklene og en lys hette som hodeduk, uten skjegg. Hva norske
    // kvinner og håndverkere i Bergen gikk med i 1420-årene, og om gifte kvinner dekket håret, er
    // ikke sjekket [K Bryggens Museum, tekstilfunnene fra Bryggen].
    /** Fiskekona i fiskeboden: lang brun kjortel, lys hodeduk (hette). */
    fiskekone: {
        navn: 'fiskekone', hud: 0xd29e82, haar: 0x6b5139, kjortel: 0x6a5240, kjortelNed: 0.42, belte: 0x3a2a1e,
        hoser: 0x4a4038, sko: 0x33251b, hette: 0xd6cdb8, hetteOppe: true, tut: 0.04, kappe: 0.2,
        mage: 0.25, slank: 0.3,
    },
    /** Kornselgeren: norsk kremmer som kjøper korn av Kontoret og selger det videre. Rødbrun kjortel, pung. */
    kornselger: {
        navn: 'kornselger', hud: 0xcf9b7d, haar: 0x8a6a46, skjegg: 0x8f7050, kjortel: 0x7a4632, kjortelNed: 0.14,
        belte: 0x2d2016, hoser: 0x4b4a3e, sko: 0x2f2318, hette: 0x5b6a52, hetteOppe: true, tut: 0.22, kappe: 0.19,
        mage: 0.45, pung: 0.7,
    },
    /** Bondekona med kurvene: har rodd inn til byen med egg og erter. Grå kjortel, ufarget hodeduk. */
    bondekone: {
        navn: 'bondekone', hud: 0xc99577, haar: 0x9a8a72, kjortel: 0x6e6b60, kjortelNed: 0.44, belte: 0x3e2d1f,
        hoser: 0x4d453c, sko: 0x35271c, hette: 0xc8bea6, hetteOppe: true, tut: 0.03, kappe: 0.22,
        mage: 0.1, slank: 0.2,
    },
    /** Bødkeren i tønneboden: lager og selger tønner. Kort kjortel til arbeid, hetta nede, skjegg. */
    bodker: {
        navn: 'bodker', hud: 0xc99478, haar: 0x4a3a2b, skjegg: 0x55432f, kjortel: 0x5a4a36, kjortelNed: 0.0,
        belte: 0x2a1d14, hoser: 0x3f4a4f, sko: 0x2b1f17, hette: 0x6f5a41, hetteOppe: false, tut: 0.18, kappe: 0.16,
        mage: 0.2,
    },
    /** Kjøpekona: blå kjortel til anklene (råd til plantefarge), lys hodeduk. */
    kjopekone: {
        navn: 'kjopekone', hud: 0xdcab8f, haar: 0x5a4330, kjortel: 0x3f5670, kjortelNed: 0.42, belte: 0x2f2218,
        hoser: 0x463d36, sko: 0x2d2119, hette: 0xe0d8c6, hetteOppe: true, tut: 0.04, kappe: 0.19,
        slank: 0.35,
    },
    /** Borgeren: norsk bymann med eget hus og handel. Grønn kjortel under kneet, rødbrun hette, skjegg. */
    borger: {
        navn: 'borger', hud: 0xd6a184, haar: 0x4a3626, skjegg: 0x5a4532, kjortel: 0x3f5a3e, kjortelNed: 0.2,
        belte: 0x281c13, hoser: 0x4f4a40, sko: 0x2a1e16, hette: 0x7a3a2c, hetteOppe: true, tut: 0.3, kappe: 0.2,
        mage: 0.3, pung: 0.6,
    },
    /** Tjenestejenta som henter vann: ung, ufarget vadmel, hetta nede så håret synes. */
    tjenestejente: {
        navn: 'tjenestejente', hud: 0xe0b196, haar: 0xa77d4c, kjortel: 0x857865, kjortelNed: 0.36, belte: 0x3b2a1e,
        hoser: 0x5b5047, sko: 0x3a2a1f, hette: 0x8a7f6a, hetteOppe: false, tut: 0.08, kappe: 0.15,
        slank: 0.55, hode: 1.03,
    },

    // ── Tyven, kirken, ølstua og kongens folk (oppdragene, oppdrag-data.ts) ── Alt [S], ikke sjekket [K].
    /** Tyven: en mager gutt fra nord, slitt grå vadmel, hetta oppe og trukket ned. */
    tyv: {
        navn: 'tyv', hud: 0xc69476, haar: 0x7a6650, kjortel: 0x4d4a44, kjortelNed: -0.02, belte: 0x2a2018,
        hoser: 0x3b3833, sko: 0x2a2018, hette: 0x3e4044, hetteOppe: true, tut: 0.1, kappe: 0.2,
        slank: 0.75, hode: 1.04,
    },
    /** Presten i Mariakirken: svart, lang kjortel til anklene, hvit krage (hetta nede), glattbarbert. */
    prest: {
        navn: 'prest', hud: 0xd8a98c, haar: 0x8a7a66, kjortel: 0x22201f, kjortelNed: 0.46, belte: 0x111010,
        hoser: 0x1c1b1a, sko: 0x1a1512, hette: 0xe6e1d6, hetteOppe: false, tut: 0.06, kappe: 0.18,
        mage: 0.35,
    },
    /** Vakta på Bergenhus: kongens mann, rød og grå, brun hette oppe, skjegg. */
    vakt: {
        navn: 'vakt', hud: 0xcf9a7c, haar: 0x3a2c20, skjegg: 0x3e2f22, kjortel: 0x6e2a22, kjortelNed: 0.1,
        belte: 0x1e1610, hoser: 0x3c3c3a, sko: 0x231a12, hette: 0x56565a, hetteOppe: true, tut: 0.14, kappe: 0.26,
        mage: 0.1,
    },
    /** Kongens skriver: lang mørkeblå kjortel, svart hette oppe, pung med blekk og penner. */
    skriver: {
        navn: 'skriver', hud: 0xd9aa8e, haar: 0x5b4632, kjortel: 0x24324a, kjortelNed: 0.34, belte: 0x1a1410,
        hoser: 0x2a2a2e, sko: 0x1d1612, hette: 0x1e1e22, hetteOppe: true, tut: 0.36, kappe: 0.2,
        slank: 0.25, pung: 0.5,
    },
    /** Klokkeren i Mariakirken: ringer og steller lysene. Grå kjortel til leggen, hetta oppe. */
    klokker: {
        navn: 'klokker', hud: 0xd2a084, haar: 0x6e5c48, kjortel: 0x4a4640, kjortelNed: 0.3, belte: 0x241b14,
        hoser: 0x35322e, sko: 0x231a12, hette: 0x2e2c2a, hetteOppe: true, tut: 0.1, kappe: 0.2,
        slank: 0.4,
    },
    /** Ølkona i ølstua ved Øvregaten: rødbrun kjortel til anklene, lys hodeduk, forkle-farget belte. */
    olkone: {
        navn: 'olkone', hud: 0xd9a385, haar: 0x7a5434, kjortel: 0x6e3b2c, kjortelNed: 0.42, belte: 0xb8ad94,
        hoser: 0x463d36, sko: 0x2d2119, hette: 0xddd3bd, hetteOppe: true, tut: 0.04, kappe: 0.2,
        mage: 0.4, slank: 0.2,
    },

    // ── Håndverkerne i Vågsbunnen (vaagsbunnen.ts) ── Tyskere i de fem amtene [V], og en norsk smed.
    // Draktene er valgt for spillet [S]: arbeidsklær i vadmel, mørke lærforklær som beltefarge og
    // kortere kjortel. Ikke sjekket mot tekstilfunnene [K].
    /** Skomakermesteren: mørkebrun kjortel, hetta nede, kort skjegg. */
    skomaker: {
        navn: 'skomaker', hud: 0xcf9b7f, haar: 0x5a4430, skjegg: 0x5e4834, kjortel: 0x4f3a2a, kjortelNed: 0.04,
        belte: 0x2a1a10, hoser: 0x3e3a34, sko: 0x241810, hette: 0x6a5a48, hetteOppe: false, tut: 0.2, kappe: 0.16,
        mage: 0.35,
    },
    /** Skomakersvennen: yngre, grå vadmel, hetta oppe. */
    skomakersvenn: {
        navn: 'skomakersvenn', hud: 0xd6a487, haar: 0x8a6a46, kjortel: 0x5f5a50, kjortelNed: 0.0, belte: 0x2e2015,
        hoser: 0x4a443c, sko: 0x2b1e14, hette: 0x6e4b33, hetteOppe: true, tut: 0.22, kappe: 0.16,
        slank: 0.3,
    },
    /** Bakeren: lys kjortel av ubleket lin, melet ned, hetta nede. */
    baker: {
        navn: 'baker', hud: 0xe0ae92, haar: 0x9a7a52, skjegg: 0xa0805a, kjortel: 0xcfc4ac, kjortelNed: 0.1,
        belte: 0x8a7a62, hoser: 0x6a6258, sko: 0x3a2a1f, hette: 0xddd4c0, hetteOppe: false, tut: 0.1, kappe: 0.15,
        mage: 0.7,
    },
    /** Bakerdrengen: ung gutt i lyst lin. */
    bakerdreng: {
        navn: 'bakerdreng', hud: 0xdcae92, haar: 0xb08a58, kjortel: 0xbdb39b, kjortelNed: -0.04, belte: 0x6a5c48,
        hoser: 0x5e554b, sko: 0x3a2a1f, hette: 0xa89e88, hetteOppe: false, tut: 0.12, kappe: 0.14,
        slank: 0.55, hode: 1.05,
    },
    /** Gullsmeden: velstående, mørkerød kjortel til leggen, svart hette, pung. */
    gullsmed: {
        navn: 'gullsmed', hud: 0xd8a88c, haar: 0x4a3626, skjegg: 0x55402c, kjortel: 0x5c2226, kjortelNed: 0.26,
        belte: 0x1a120c, hoser: 0x2c2c30, sko: 0x1d1612, hette: 0x1f1d1c, hetteOppe: true, tut: 0.34, kappe: 0.19,
        mage: 0.3, pung: 0.8,
    },
    /** Buntmakeren: syr pels. Brun kjortel og en hette av pels (lys kappe). */
    buntmaker: {
        navn: 'buntmaker', hud: 0xcf9d80, haar: 0x6a5038, skjegg: 0x725a42, kjortel: 0x4a4436, kjortelNed: 0.12,
        belte: 0x2a1d14, hoser: 0x463f36, sko: 0x2a1e16, hette: 0xb09272, hetteOppe: true, tut: 0.08, kappe: 0.28,
        mage: 0.25,
    },
    /** Barbereren: blå kjortel, hvit linklut (lys hette nede), glattbarbert. */
    barberer: {
        navn: 'barberer', hud: 0xdcaa8e, haar: 0x3e2f22, kjortel: 0x34465c, kjortelNed: 0.14, belte: 0x2a1d14,
        hoser: 0x3a3a3c, sko: 0x231a12, hette: 0xe2dccd, hetteOppe: false, tut: 0.06, kappe: 0.16,
        slank: 0.3,
    },
    /** Smeden: norsk, svær, sotet kjortel, lærforkle (mørkt belte), skjegg. */
    smed: {
        navn: 'smed', hud: 0xc48d70, haar: 0x2e241b, skjegg: 0x33281e, kjortel: 0x3c3630, kjortelNed: -0.02,
        belte: 0x1e140c, hoser: 0x2e2b28, sko: 0x1d1510, hette: 0x4a4440, hetteOppe: false, tut: 0.12, kappe: 0.15,
        mage: 0.4,
    },

    // ── Kongens menn på Holmen (byen-oppdrag.ts) ── Fargene er [S], ikke sjekket [K].
    /** Høvedsmannen: kongens mann på Bergenhus. Lang blå kjortel, rød kappe og hette, kort skjegg, pung. */
    hovedsmann: {
        navn: 'hovedsmann', hud: 0xd2a084, haar: 0x6a5440, skjegg: 0x6e5844, kjortel: 0x23365c, kjortelNed: 0.3,
        belte: 0x5a3a18, hoser: 0x6a2420, sko: 0x1d1510, hette: 0x8a1f1c, hetteOppe: false, tut: 0.2, kappe: 0.3,
        mage: 0.2, pung: 0.5,
    },
    /** Gjaldkeren: kongens mann i byen. Brun kjortel til leggen, grå hette oppe, skjegg, stor pung. */
    gjaldker: {
        navn: 'gjaldker', hud: 0xcf9d80, haar: 0x4a3a2c, skjegg: 0x5a483a, kjortel: 0x5a4430, kjortelNed: 0.22,
        belte: 0x1e1610, hoser: 0x3c3c3a, sko: 0x231a12, hette: 0x6a6a6e, hetteOppe: true, tut: 0.26, kappe: 0.22,
        mage: 0.35, pung: 0.7,
    },
    // ── Familiene på Stranden og barna og fyllikken i Vågsbunnen (strandliv.ts, vaagsbunnen-liv.ts) ──
    // Valgt for spillet [S], samme snitt som de andre norske byfolkene. Hva barn gikk med, og om de
    // hadde sko, er ikke sjekket mot funnene [K].
    /** Gamle Gunnvor på Stranden: grå kjortel til anklene, mørk hodeduk, foroverbøyd og tynn. */
    gammelkone: {
        navn: 'gammelkone', hud: 0xcf9f86, haar: 0xb9b2a6, kjortel: 0x5a5650, kjortelNed: 0.44, belte: 0x2e241c,
        hoser: 0x3e3a35, sko: 0x2a2018, hette: 0x4a4440, hetteOppe: true, tut: 0.03, kappe: 0.24,
        slank: 0.45,
    },
    /** Husmannen på Stranden: kort brun kjortel til arbeid, hetta nede, skjegg. */
    husmann: {
        navn: 'husmann', hud: 0xc99478, haar: 0x6a4e34, skjegg: 0x6e5236, kjortel: 0x5e4c38, kjortelNed: 0.0,
        belte: 0x2a1d14, hoser: 0x4a463e, sko: 0x2b1f17, hette: 0x6a6052, hetteOppe: false, tut: 0.14, kappe: 0.16,
        mage: 0.15,
    },
    /** Husfrua: grønngrå kjortel til anklene, ufarget hodeduk. */
    husfrue: {
        navn: 'husfrue', hud: 0xd8a588, haar: 0x7a5636, kjortel: 0x58604c, kjortelNed: 0.42, belte: 0x3a2a1e,
        hoser: 0x4a4038, sko: 0x33251b, hette: 0xd2c8b2, hetteOppe: true, tut: 0.03, kappe: 0.2,
        slank: 0.3,
    },
    /** En gutt på 8-9 år: kort kjortel, barbeint-mørke sko, stort hode. */
    gutt: {
        navn: 'gutt', hud: 0xe0b196, haar: 0xb08a58, kjortel: 0x7a6a52, kjortelNed: -0.08, belte: 0x3b2a1e,
        hoser: 0x5b5047, sko: 0x3a2a1f, hette: 0x8a7d66, hetteOppe: false, tut: 0.1, kappe: 0.13,
        slank: 0.75, hode: 1.16,
    },
    /** Ei jente på 8-9 år: kjortel til leggen, håret synes. */
    jente: {
        navn: 'jente', hud: 0xe3b59a, haar: 0x8a5a34, kjortel: 0x7c5a48, kjortelNed: 0.3, belte: 0x3b2a1e,
        hoser: 0x5b5047, sko: 0x3a2a1f, hette: 0x9a8a70, hetteOppe: false, tut: 0.06, kappe: 0.13,
        slank: 0.75, hode: 1.16,
    },
    /** Fyllikken i Vågsbunnen: en skomakersvenn i skitten, slitt kjortel, hetta på skakke. */
    fyllik: {
        navn: 'fyllik', hud: 0xd09a86, haar: 0x5a4430, skjegg: 0x5e4834, kjortel: 0x4c4840, kjortelNed: 0.02,
        belte: 0x2a2018, hoser: 0x3c3832, sko: 0x241810, hette: 0x5a4a3a, hetteOppe: false, tut: 0.2, kappe: 0.15,
        mage: 0.2,
    },
    // ── Kontoret (kontor-data.ts) ── [S]: ingen kilde for hva en oldermann bar i 1420-årene [K].
    /** Oldermannen på Kontoret: lang, mørk vinrød kjortel til anklene, svart hette oppe, grått skjegg. */
    /** Skipperen på koggen fra Lübeck: kort, mørk grønn kjortel for sjøen, lærhette, vær i ansiktet. */
    skipper: {
        navn: 'skipper', hud: 0xc48d6c, haar: 0x6a5238, skjegg: 0x7a5f44, kjortel: 0x2f4a3a, kjortelNed: -0.02,
        belte: 0x2a1d14, hoser: 0x4a3f36, sko: 0x2b1f17, hette: 0x4b3624, hetteOppe: true, tut: 0.12, kappe: 0.2,
        mage: 0.35,
    },
    oldermann: {
        navn: 'oldermann', hud: 0xd0a086, haar: 0x9a948a, skjegg: 0xa8a39a, kjortel: 0x4a1f24, kjortelNed: 0.44,
        belte: 0x1a120c, hoser: 0x2a2626, sko: 0x1d1612, hette: 0x1c1a1a, hetteOppe: true, tut: 0.46, kappe: 0.24,
        mage: 0.5, pung: 0.9,
    },
} satisfies Record<string, Drakt>;

export type FigurNavn = keyof typeof DRAKTER;

export const HOYDE: Record<FigurNavn, number> = {
    junge: 1.58, husbonde: 1.74, svenn: 1.79, dreng: 1.66, stuedreng: 1.52, fisker: 1.71,
    fiskekone: 1.58, kornselger: 1.73, bondekone: 1.55, bodker: 1.7, kjopekone: 1.61, borger: 1.75, tjenestejente: 1.54,
    tyv: 1.68, prest: 1.72, vakt: 1.82, skriver: 1.7, klokker: 1.66, olkone: 1.6,
    hovedsmann: 1.8, gjaldker: 1.76,
    skomaker: 1.7, skomakersvenn: 1.74, baker: 1.72, bakerdreng: 1.5, gullsmed: 1.73, buntmaker: 1.68, barberer: 1.76, smed: 1.84,
    gammelkone: 1.5, husmann: 1.72, husfrue: 1.6, gutt: 1.26, jente: 1.22, fyllik: 1.73,
    oldermann: 1.76, skipper: 1.77,
};

/**
 * Hva en figur gjør på plassen sin. Alt er løkker på stedet.
 *  - sitte: på benken, hendene i fanget
 *  - spise: på benken ved bordet, hendene framme
 *  - skrive: står ved pulten
 *  - rore: står ved gryta med sleiva
 *  - veie: rekker opp mot bismeren og leser av merkene
 *  - baere: står med en bunt tørrfisk i armene, klar til å gå
 *  - staa: står og venter
 *  - hamre: står og arbeider med armene (smeden ved ambolten, bakeren ved trauet)
 *  - knele: kneler og arbeider nede ved golvet
 *  - prate: står og prater med noen (gestikulerer)
 */
export type Rolle = 'sitte' | 'spise' | 'skrive' | 'rore' | 'veie' | 'baere' | 'staa' | 'hamre' | 'knele' | 'prate';

export interface Plass {
    figur: FigurNavn;
    rolle: Rolle;
    /** Føttene (stående) eller midt på benkesetet under hoftene (sittende), i verdensrom. */
    pos: THREE.Vector3;
    /** Retningen figuren ser (0 = +z). */
    yaw: number;
    /** Id i samtalene (samtaler.ts). Uten: en kort replikk når gutten snakker med hen. */
    samtale?: string;
    /** Hvem hen er (personer.ts): eget navn over hodet, og hen kan gi og ta imot oppdrag. */
    id?: string;
    /**
     * Ytelse: hen står inne i et hus og synes bare gjennom åpningene (portal.ts). Tegnes da bare
     * når kameraet kan se hen gjennom en dør eller glugg, og kaster ikke skygge (veggene skygger).
     */
    bak?: Portaler;
}

const KLIPP: Record<Rolle, { clip: string; speed: number; hold?: number }> = {
    sitte: { clip: 'Sitting_Idle_Loop', speed: 1 },
    spise: { clip: 'Row', speed: 0.45 },
    skrive: { clip: 'Hender_Fram', speed: 0.35 },
    rore: { clip: 'Hender_Fram', speed: 0.8 },
    veie: { clip: 'Interact', speed: 0.55 },
    baere: { clip: 'Hender_Fram', speed: 0, hold: 0.3 },
    // Tomt klipp: bevegelseslagets hvile. Idle_Loop som helkroppsklipp er samme action som
    // hvilen i bevegelseslaget, og slipper man det, stopper hvilen også (T-stilling).
    staa: { clip: '', speed: 1 },
    hamre: { clip: 'Hender_Fram', speed: 1.7 },
    knele: { clip: 'Fixing_Kneeling', speed: 0.9 },
    prate: { clip: 'Idle_Talking_Loop', speed: 0.85 },
};

/** Hoftene i sitteklippet står så langt bak føttene og så høyt, i riggens egne meter (1,83 m høy). */
const SITT_BAK = 0.33;

/** En figur i gården. Lager animatoren og plasserer den. Bruk `animer` hvert bilde. */
export async function lagFigur(navn: FigurNavn): Promise<Animator> {
    const rig = await loadRig(RIG_URL);
    return new Animator(kleFigur(rig, DRAKTER[navn]), HOYDE[navn]);
}

export interface Folk {
    group: THREE.Group;
    colliders: ColliderSpec[];
    /** Føttene til dem som går (verdenen gir de nærmeste en kollider). */
    gaaende: THREE.Vector3[];
    snakkbare: Snakkbar[];
    tick: (t: number, dt: number, ctx: CellCtx) => void;
    dispose: () => void;
}

/** Nærmere enn dette animeres hvert bilde; lenger unna 15 ganger i sekundet, og bak FJERN ikke. */
const NAER = 16;
const FJERN = 45;
/** Lenger unna enn dette tegnes ikke folk: tåka har nesten tatt dem, og de koster tegnekall. */
const SYNLIG = 45;

/**
 * Hvor ofte animasjonen oppdateres etter avstand. Tåka skjuler det som står langt unna. Nivået
 * (fin/grov, skygge) styres av `FigurLod` i figurlod.ts.
 */
class Takt {
    private acc = 0;
    readonly a: Animator;
    private readonly lod: FigurLod;
    /** Inne i et hus: synes bare gjennom åpningene (`Plass.bak`). */
    private readonly bak?: { p: Portaler; box: THREE.Box3 };
    constructor(a: Animator, bak?: Portaler) {
        this.a = a;
        this.lod = new FigurLod(a.model);
        if (bak) this.bak = { p: bak, box: new THREE.Box3().setFromCenterAndSize(a.root.position.clone().setY(a.root.position.y + 0.9), new THREE.Vector3(1.2, 1.9, 1.2)) };
    }
    update(dt: number, speed: number, kamera: THREE.Vector3): void {
        const d = this.a.root.position.distanceTo(kamera);
        this.a.root.visible = d < SYNLIG && (!this.bak || this.bak.p.ser(kamera, this.bak.box));
        this.lod.sett(d, !this.bak);
        if (d > FJERN) return;
        this.acc += dt;
        if (d > NAER && this.acc < 1 / 15) return;
        this.a.update(this.acc, speed);
        this.acc = 0;
    }
}

/**
 * Figurer på plassen sin. Stående snur seg mot gutten når han snakker med dem; de som sitter, blir
 * sittende. Begge gestikulerer når de sier noe (gestikk.ts), og går tilbake til det de holdt på
 * med etterpå.
 */
class Staaende {
    private mot: THREE.Vector3 | null = null;
    private yaw: number;
    private readonly a: Animator;
    private readonly p: Plass;
    private readonly clip: { clip: string; speed: number; hold?: number };
    private readonly sitter: boolean;
    readonly gestikk: Gestikk;
    constructor(a: Animator, p: Plass, clip: { clip: string; speed: number; hold?: number }, sitter: boolean) {
        this.a = a;
        this.p = p;
        this.clip = clip;
        this.sitter = sitter;
        this.yaw = p.yaw;
        this.gestikk = new Gestikk(a);
        this.gestikk.sitter = sitter;
        this.gestikk.onFerdig = () => this.tilbake();
    }
    /** Tilbake til det hen holdt på med: hvile mens hen ser på gutten, ellers klippet sitt. */
    private tilbake(): void {
        if (this.mot && !this.sitter) this.a.release(0.4);
        else if (this.clip.clip) {
            this.a.play(this.clip.clip, { loop: true, fade: 0.5, timeScale: this.clip.speed });
            if (this.clip.hold !== undefined) this.a.setPhase(this.clip.hold);
        } else this.a.release(0.4);
    }
    vend(mot: THREE.Vector3 | null): void {
        if (this.sitter) return;
        if (mot && !this.mot && this.clip.clip && !this.gestikk.aktiv) this.a.release(0.4);
        const var_ = this.mot;
        this.mot = mot?.clone() ?? null;
        if (!mot && var_) {
            this.gestikk.stopp();
            this.tilbake();
        }
    }
    step(dt: number): void {
        this.gestikk.tick(dt);
        if (this.sitter) return;
        const root = this.a.root.position;
        const want = this.mot ? Math.atan2(this.mot.x - root.x, this.mot.z - root.z) : this.p.yaw;
        const diff = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw));
        this.yaw += THREE.MathUtils.clamp(diff, -3 * dt, 3 * dt);
        this.a.root.rotation.y = this.yaw;
    }
}

/** Toppen av hodet: hodebeinet pluss et stykke opp (hetta). Uten bein: føttene pluss høyden. */
export function hodeTopp(a: Animator, hoyde: number, ut: THREE.Vector3): THREE.Vector3 {
    const b = a.bein('DEF-head');
    if (b && a.root.visible) return b.getWorldPosition(ut).setY(ut.y + 0.22 * (hoyde / 1.75));
    return ut.copy(a.root.position).setY(a.root.position.y + hoyde + 0.1);
}

/**
 * Lager folkene i en celle. Cella eier dem: kolliderne går i cellas liste, og `dispose` rydder
 * animatorene. Figurgeometrien deles med alle andre figurer og kastes aldri her.
 */
export async function lagFolk(plasser: Plass[], mats: Materials, seed = 1, ruter: Rute[] = []): Promise<Folk> {
    const rig = await loadRig(RIG_URL);
    const group = new THREE.Group();
    group.name = 'folk';
    const c = new ColliderKit();
    const anims: Animator[] = [];
    const takter: Takt[] = [];
    const staaende: Staaende[] = [];
    const vandrere: Vandrer[] = [];
    const snakkbare: Snakkbar[] = [];
    const egne: THREE.Object3D[] = [];
    let r = seed;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);

    for (const p of plasser) {
        const h = HOYDE[p.figur];
        const s = h / rig.height;
        const sitter = p.rolle === 'sitte' || p.rolle === 'spise';
        // De som sitter har egen geometri: skjørtet henger over knærne (figur.ts).
        const drakt: Drakt = sitter ? { ...DRAKTER[p.figur], navn: `${p.figur}:sitt`, sitter: true } : DRAKTER[p.figur];
        const a = new Animator(kleFigur(rig, drakt), h);
        const k = KLIPP[p.rolle];
        const clip = rig.clips.get(k.clip);
        if (k.clip) a.play(k.clip, { loop: true, fade: 0.01, timeScale: k.speed, startAt: rnd() * (clip?.duration ?? 1) });
        if (k.hold !== undefined) a.setPhase(k.hold);
        a.update(0.02, 0);
        // Folkene står stille, så Three kan hoppe over dem som er utenfor bildet. Kula rundt
        // hvilestillingen (armene ut) rommer også sitte- og arbeidsstillingene.
        a.model.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) o.frustumCulled = true;
        });

        const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
        const foot = sitter ? p.pos.clone().addScaledVector(fwd, SITT_BAK * s) : p.pos.clone();
        if (sitter) foot.y -= 0.45 - 0.42 * s;
        a.root.position.copy(foot);
        a.root.rotation.y = p.yaw;
        group.add(a.root);
        anims.push(a);
        takter.push(new Takt(a, p.bak));
        const st = new Staaende(a, p, k, sitter);
        staaende.push(st);
        snakkbare.push({
            figur: p.figur, id: p.id, pos: foot.clone(), samtale: p.samtale,
            vend: (mot) => st.vend(mot),
            hode: (ut) => hodeTopp(a, h, ut),
            gest: (g, len) => st.gestikk.gjor(g, len),
            synlig: () => a.root.visible,
        });

        // Kollideren: en boks rundt kroppen (prop, så kameraet ikke hopper når noen står i veien).
        c.matrix = new THREE.Matrix4().makeRotationY(p.yaw).setPosition(foot);
        if (sitter) c.box(0, 0.65 * s, -0.12 * s, 0.5, 1.3 * s, 0.62 * s, true);
        else c.box(0, h / 2, 0, 0.5, h, 0.45, true);

        if (p.rolle === 'baere') {
            const bunt = buntMesh(mats);
            bunt.position.set(0, 1.0 * s, 0.3 * s);
            a.root.add(bunt);
            egne.push(bunt);
        }
    }

    ruter.forEach((rute, i) => {
        const a = new Animator(kleFigur(rig, DRAKTER[rute.figur]), HOYDE[rute.figur]);
        a.update(0.02, 0);
        // Den som går, bøyer seg og bærer: kula rundt figuren gjøres litt større (figurlod.ts).
        cullFigur(a.model);
        const s = HOYDE[rute.figur] / rig.height;
        const bunt = rute.baer === 'botte' ? botteMesh(mats) : buntMesh(mats);
        bunt.position.set(0, (rute.baer === 'botte' ? 0.9 : 1.0) * s, 0.3 * s);
        a.root.add(bunt);
        egne.push(bunt);
        const v = new Vandrer(a, rute, bunt, seed + i * 3.7);
        group.add(a.root);
        anims.push(a);
        vandrere.push(v);
        const h = HOYDE[rute.figur];
        snakkbare.push({
            figur: rute.figur, id: rute.id, pos: v.pos, samtale: rute.samtale,
            vend: (mot) => v.vend(mot),
            hode: (ut) => hodeTopp(a, h, ut),
            gest: (g, len) => v.gest(g, len),
            synlig: () => a.root.visible,
        });
    });
    const vTakt = vandrere.map((v) => new Takt(v.a));

    return {
        group,
        colliders: c.specs,
        gaaende: vandrere.map((v) => v.pos),
        snakkbare,
        tick: (t, dt, ctx) => {
            for (const st of staaende) st.step(dt);
            for (const tk of takter) tk.update(dt, 0, ctx.kamera);
            vandrere.forEach((v, i) => {
                v.step(dt, t, ctx);
                vTakt[i].update(dt, v.speed, ctx.kamera);
            });
        },
        dispose: () => {
            for (const a of anims) {
                a.mixer.stopAllAction();
                a.mixer.uncacheRoot(a.model);
                a.model.traverse((o) => {
                    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
                    if (m && (o as THREE.Mesh).isMesh) m.dispose();
                });
                // Figurene tas ut før cella kaster geometrien sin: den deles med de andre.
                group.remove(a.root);
            }
            egne.forEach(disposeObject);
        },
    };
}

/** En bunt tørrfisk surret med tau, i samme materiale og farger som buntene i bua. */
export function buntMesh(mats: Materials): THREE.Object3D {
    const k = new MeshKit();
    k.withUv(0.04, () => {
        k.withTint({ top: 1.45, bottom: 1.1, hue: [1.02, 0.98, 0.86] }, () => k.box('raatre', 0, 0, 0, 0.5, 0.26, 0.3, { grain: 'x' }));
    });
    k.withTint({ top: 1.1, bottom: 0.9, hue: [1.12, 1.02, 0.8] }, () => {
        for (const dx of [-0.13, 0.13]) k.box('raatre', dx, 0, 0, 0.035, 0.27, 0.31);
    });
    const g = new THREE.Group();
    for (const [key, b] of k.buckets) {
        if (b.vertexCount === 0) continue;
        const m = new THREE.Mesh(b.toGeometry(), mats.get(key));
        m.castShadow = true;
        g.add(m);
    }
    return g;
}

/** En vannbøtte av staver med to bånd, full av vann, som i brønnen på torget (torg.ts) [S]. */
export function botteMesh(mats: Materials): THREE.Object3D {
    const k = new MeshKit();
    const V = (y: number) => new THREE.Vector3(0, y, 0);
    k.withTint({ top: 0.8, bottom: 0.8, hue: [1.06, 0.98, 0.88] }, () => k.log('raatre', V(-0.15), V(0.13), 0.13, 10, true, 0.15));
    k.withTint({ top: 0.45, bottom: 0.45 }, () => {
        for (const y of [-0.08, 0.07]) k.log('raatre', V(y - 0.02), V(y + 0.02), 0.143 + y * 0.03, 10, false, 0.143 + y * 0.03);
    });
    k.withTint({ top: 0.2, bottom: 0.2, hue: [0.8, 0.9, 1] }, () => k.withUv(0.04, () => k.log('mork', V(0.1), V(0.12), 0.135, 10, true, 0.135)));
    const g = new THREE.Group();
    for (const [key, b] of k.buckets) {
        if (b.vertexCount === 0) continue;
        const m = new THREE.Mesh(b.toGeometry(), mats.get(key));
        m.castShadow = true;
        g.add(m);
    }
    return g;
}
