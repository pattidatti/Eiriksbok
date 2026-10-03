// Kapittel 3, «Brannen» (blueprint §6.2): april 1429. To oppdrag etter hverandre, folkene som bare
// finnes dette året, og «Dette vet vi»-tekstene.
//
//   kap3        Leidangen   Hennig gir det i den frie byen (filmen «kap3-inn» hopper til 1429).
//                           Asbjørn trenger piler og vann rodd ut til skipet sitt midt i Vågen. Gutten
//                           bærer to bunter ned i færingen og ror ut. Da kommer slaget (filmen «kap3-slaget»).
//   kap3-valg   Brannen     Plyndrerne er i land. Mennene i sjøen ved det tapte skipet, eller gjeldsboka
//                           i bua. Han rekker bare det ene (graboks/kap3.ts). Hennig tar imot.
//
// Det vi vet, og hvor (blueprint §4.1):
//  - [V] I april 1429 kom Bartholomeus Voet til Bergen med sju kogger og rundt 400 mann. Leidangsflåten
//    ble kalt ut, for siste gang. Voet fikk ti skip til fra Wismar, og plyndret og brente byen. Både
//    kongsgården og bispegården på Holmen brant. Bispegården ble bygd opp igjen og revet i 1531
//    (Bergen byleksikon «Vitaliebrødrene» og «Bispegårder»).
//  - [U] Den norske flåten: fire store og «svært mange» mindre skip (SNL), opptil 100 etter en
//    krønikeskriver, trolig 40-50 skip og rundt 1500 mann fra Hordaland og Sogn. Nordmennene tok ett
//    skip, men to av de store norske skipene ble tatt, og rundt 300 mann ble drept eller kastet over
//    bord (no.wikipedia etter Ersland & Holm 2000; ikke lest selv). Kildene kaller koggene «høye som tårn».
//  - [V] Ingen hansaskip i Bergen i 1428 og 1429, og Kontoret var borte fra 1427 til 1433 (Ersland 2020).
// Hvem som ledet leidangen, og hvilken dag slaget sto, er ikke funnet [K]. At småbåter fraktet folk og
// varer ut til skipene, er heller ikke funnet [K]. Asbjørn, Hennig, gjeldsboka, mennene i sjøen og alt
// folk sier, er laget for spillet [S]. Valget har ikke noe fasitsvar.
import type { AnkerDef } from '../graboks/ankerskip';
import type { OppdragDef } from './oppdrag-data';
import { PERSONER, TITTEL } from './personer';
import { NAVN, REPLIKKER } from './samtaler';

PERSONER.asbjorn = { navn: 'Asbjørn', tittel: 'styresmann i leidangen' };
TITTEL.leidang = 'Leidangsmann';
NAVN.leidang = 'Leidangsmannen';
REPLIKKER.leidang = [
    'Vi rodde i to dager for å komme hit.',
    'Har du sett skipene deres? Høye som tårn.',
    'Kongen kalte, og vi kom.',
    'Bøndene hjemme slår ikke graset selv.',
];

/** «Dette vet vi»: leidangen. */
const VET_LEIDANG =
    'Leidangen var kongens flåte i Norge i middelalderen. Bygdene langs kysten måtte stille med skip, menn og mat når kongen kalte dem ut. I april 1429 ble leidangen kalt ut for å forsvare Bergen mot vitaliebrødrene. Etter det vi vet, var det siste gang. Noen kilder sier at mennene kom fra Hordaland og Sogn, men det er ikke sikkert. Hennig og Asbjørn er laget for spillet.';

/** «Dette vet vi»: tallene som ikke stemmer. */
const VET_TALL =
    'Hvor mange skip var med i slaget i Vågen? Kildene er ikke enige. Vitaliebrødrene kom med sju store skip, kogger. Mot dem sto fire store norske skip og mange små. En skriver fra den tiden sa hundre små skip. Historikere i dag tror det var færre, kanskje 40 til 50, med rundt 1500 mann. Én kilde sier at to av de store norske skipene ble tatt, og at rundt 300 mann ble drept eller kastet i sjøen. Hvem som ledet nordmennene, og hvilken dag det var, vet vi ikke.';

/** «Dette vet vi»: Holmen som brant. */
const VET_HOLMEN =
    'Etter slaget plyndret vitaliebrødrene byen og satte fyr på den. Både kongsgården og bispegården på Holmen brant. I kongsgården bodde kongens menn, og i bispegården bodde biskopen. Bispegården ble bygd opp igjen, men revet i 1531. Om husene på Bryggen brant i 1429, sier ikke kildene vi har lest. Mennene i sjøen og gjeldsboka er laget for spillet.';

/** «Dette vet vi»: ingen hansaskip i Bergen. */
const VET_INGEN_HANSA =
    'Kjøpmennene fra hansabyene var borte fra Bergen fra 1427 til 1433. En historiker som har lest brevene fra den tiden, fant ingen hansaskip i Bergen i 1428 og 1429. Vitaliebrødrene fikk hjelp fra Wismar, en av hansabyene: ti skip kom derfra i 1429. Men hvem som tok imot det de stjal i Bergen, vet vi ikke.';

export const KAP3_OPPDRAG: OppdragDef[] = [
    {
        id: 'kap3',
        tittel: 'Leidangen',
        giver: 'hennig',
        mottaker: 'asbjorn',
        krav: ['kap2-korn'],
        om: 'April 1429. Kongen har kalt ut leidangen, og skipene fra bygdene ligger i Vågen. Asbjørn trenger noen som ror piler og vann ut til skipet hans.',
        hvor: 'Kaia foran gården, og skipet til Asbjørn midt i Vågen',
        maal: [
            { hendelse: 'snakk:asbjorn', tekst: 'Snakk med Asbjørn på kaia' },
            { hendelse: 'kap3:bunt', tekst: 'Bær to bunter ned i færingen', antall: 2, etter: true },
            { hendelse: 'kap3:skipet', tekst: 'Ro ut til skipet til Asbjørn midt i Vågen', etter: true },
        ],
        // Gitt i den frie byen. Svaret setter `kap3-start`, og filmen «kap3-inn» tar oppdraget i 1429 (filmer.ts).
        tilbud: {
            start: {
                tekst: 'Junge. Har du hørt hva folk sier på torget? Sjørøverne kommer tilbake til våren. Flere skip enn sist.',
                gest: 'snakk',
                til: 'start2',
            },
            start2: {
                tekst: 'Men denne gangen skal byen forsvare seg. Kongen kaller ut leidangen.',
                gest: 'peke',
                valg: [
                    { tekst: 'Hva er leidangen?', til: 'leidang' },
                    { tekst: 'Hva gjør vi da?', til: 'vi' },
                ],
            },
            // [V] Byleksikon: leidangsflåten ble kalt ut i 1429.
            leidang: {
                tekst: 'Når kongen ber om det, må bygdene langs kysten sende skip og menn. Det kalles leidangen. Bøndene ror hit fra bygdene for å kjempe.',
                gest: 'snakk',
                til: 'vi',
            },
            vi: {
                tekst: 'Vi passer gården, som i fjor. Men de trenger nok folk som kan ro.',
                gest: 'skuldre',
                gjor: 'flagg:kap3-start',
                til: 'vet',
            },
            vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_LEIDANG },
        },
        underveis: {
            start: { tekst: 'Asbjørn står på kaia ved buntene. Han trenger noen som kan ro.', gest: 'peke' },
        },
        samtaler: {
            asbjorn: {
                start: {
                    tekst: 'Du der! Er du gutten fra tyskergården? Du snakker som dem.',
                    gest: 'peke',
                    til: 'start2',
                },
                start2: {
                    tekst: 'Jeg heter Asbjørn, og jeg styrer skipet der ute. Vi kom fra bygdene i går. Vi trenger piler og vann, og noen som kan ro det ut.',
                    gest: 'snakk',
                    valg: [
                        { tekst: 'Jeg kan ro.', til: 'ja' },
                        { tekst: 'Hvorfor spør du en tysk gutt?', til: 'tysk' },
                        { tekst: 'Hvor mange skip har vi?', til: 'tall' },
                    ],
                },
                tysk: {
                    tekst: 'Fordi du er her, og de andre tyskerne er ikke. Hvem du holder med, får vi se når du ror.',
                    gest: 'skuldre',
                    valg: [
                        { tekst: 'Jeg kan ro.', til: 'ja' },
                        { tekst: 'Hvor mange skip har vi?', til: 'tall' },
                    ],
                },
                // [U] SNL og no.wikipedia: fire store og mange små; koggene «høye som tårn».
                tall: {
                    tekst: 'Fire store, og så mange små båter at ingen har talt dem. Sjørøverne har sju kogger. Høye som tårn, sier de som har sett dem.',
                    gest: 'peke',
                    til: 'ja',
                },
                ja: {
                    tekst: 'Bra. Buntene ligger her på kaia. Bær dem ned i færingen din, og ro ut til skipet mitt. Jeg ror ut nå.',
                    gest: 'nikk',
                    gjor: 'hendelse:snakk:asbjorn',
                    til: 'vet',
                },
                vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_TALL },
            },
        },
        // Levert i filmen «kap3-slaget» (gutten sitter i færingen og kan ikke snakke med noen).
        levering: { start: { tekst: 'Godt rodd, gutt.', gest: 'nikk', gjor: 'lever:kap3' } },
        lonn: 'Asbjørn fikk pilene og vannet.',
        belonning: { rykte: { B: 3 }, ferdighet: { ro: 1 } },
    },
    {
        id: 'kap3-valg',
        tittel: 'Brannen',
        giver: 'hennig',
        mottaker: 'hennig',
        krav: ['kap3'],
        om: 'Plyndrerne har gått i land, og det brenner. Ute ved det tapte skipet ligger menn i sjøen. I bua ligger gjeldsboka som husbonden lot stå igjen. Du rekker bare det ene.',
        hvor: 'Det tapte skipet i Vågen, eller bua i gården',
        maal: [{ hendelse: 'kap3:valgt', tekst: 'Mennene i sjøen, eller gjeldsboka i bua' }],
        // Tatt i filmen «kap3-slaget».
        tilbud: { start: { tekst: 'Fort deg!', gest: 'vift', gjor: 'ta:kap3-valg' } },
        underveis: { start: { tekst: 'Fort deg! Mennene i sjøen, eller boka i bua. Du rekker ikke begge.', gest: 'vift' } },
        levering: {
            folk: {
                tekst: 'Du kom med tre mann fra sjøen. Gjeldsboka tok de. Den ligger vel på et skip til Wismar nå.',
                gest: 'nikk',
                til: 'folk2',
            },
            // Mennene i sjøen: byfolket, fiskerne og kongens menn glemmer det ikke. Kontoret mistet boka [S].
            folk2: {
                tekst: 'Husbonden blir sint når han hører det. Men de tre mennene lever.',
                gest: 'skuldre',
                gjor: 'rykte:N:+5;rykte:F:+4;rykte:B:+4;rykte:K:-3',
                til: 'holmen',
            },
            bok: {
                tekst: 'Du har boka! Da vet husbonden fortsatt hvem som skylder ham, og hvor mye.',
                gest: 'nikk',
                til: 'bok2',
            },
            // Gjeldsboka: Kontoret husker det. Fiskerne som står i den, og byfolket, ser det annerledes [S].
            bok2: {
                tekst: 'Men ute ved skipet ... Jeg så ikke at noen kom opp av sjøen.',
                gest: 'riste',
                gjor: 'rykte:K:+6;rykte:F:-5;rykte:N:-2',
                til: 'holmen',
            },
            sent: {
                tekst: 'Du kom for sent til begge. Boka er borte, og ved skipet er det ingen igjen i sjøen.',
                gest: 'riste',
                til: 'holmen',
            },
            holmen: {
                tekst: 'Se der borte. Det brenner på Holmen. Kongsgården og bispegården.',
                gest: 'peke',
                til: 'vet1',
            },
            vet1: { hvem: 'Dette vet vi', vet: true, tekst: VET_HOLMEN, til: 'wismar' },
            wismar: {
                tekst: 'Og når de seiler, tar de alt med seg til Wismar. Men hvem kjøper det der?',
                gest: 'skuldre',
                gjor: 'lever:kap3-valg',
                til: 'vet2',
            },
            vet2: { hvem: 'Dette vet vi', vet: true, tekst: VET_INGEN_HANSA },
        },
        leveringStart: (f) => (f.has('kap3-folk') ? 'folk' : f.has('kap3-bok') ? 'bok' : 'sent'),
        lonn: 'Natten etter brenner Holmen.',
        belonning: { ferdighet: { ro: 1 } },
    },
];

/**
 * Hvor ting står i kapittel 3 (verdensrom). Plassene er [S]. Vågen er −z, munningen mot havet ligger
 * sørøst for Holmen (x 120-170, z −70 til −120). Kaienden er ved x ≈ 129 (holmenvei.ts).
 *   asbjorn   Asbjørn på kaia, vest for færingens plass
 *   bunter    pilene og vannet på kaia ved siden av ham
 *   hennig    Hennig på kaia foran gården hele 1429
 *   plyndrer  der plyndreren står i bua, mellom fiskestablene og pulten
 *   skipet    der færingen legger seg inntil skipet til Asbjørn (på siden mot kaia): x, z
 *   leidang   leidangsskipene: 0 er Asbjørns, `tapt` er de to store skipene koggene tar
 *   koggerFor koggene ved munningen før slaget, med baugen inn i Vågen
 *   koggerEtter koggene etter slaget: to inntil hvert av de tapte skipene, tre lenger ute
 *   menn      mennene i sjøen ved akterenden av det første tapte skipet. Den andre er Ulf
 */
export const KAP3_STEDER = {
    asbjorn: [-7.6, 0, 1.2] as [number, number, number],
    bunter: [-10.2, 0, 1.4] as [number, number, number],
    hennig: [1.7, 0, 1.8] as [number, number, number],
    plyndrer: [-5.6, 0.2, 8.6] as [number, number, number],
    skipet: [10, -49.6] as [number, number],
    leidang: [
        { x: 10, z: -55, yaw: 1.57, type: 'jekt', skala: 1.3 },
        { x: 34, z: -68, yaw: 1.3, type: 'jekt', skala: 1.3 },
        { x: -2, z: -76, yaw: 1.75, type: 'jekt', skala: 1.25 },
        { x: 54, z: -50, yaw: 1.45, type: 'jekt', skala: 1.3 },
        { x: 22, z: -40, yaw: 1.6, type: 'jekt', skala: 0.6 },
        { x: -10, z: -46, yaw: 1.4, type: 'jekt', skala: 0.6 },
        { x: 44, z: -88, yaw: 1.2, type: 'jekt', skala: 0.6 },
        { x: 16, z: -84, yaw: 1.9, type: 'jekt', skala: 0.55 },
    ] as AnkerDef[],
    tapt: [1, 3],
    koggerFor: [
        { x: 118, z: -92, yaw: -1.22 },
        { x: 133, z: -80, yaw: -1.25 },
        { x: 128, z: -106, yaw: -1.15 },
        { x: 146, z: -94, yaw: -1.2 },
        { x: 113, z: -118, yaw: -1.1 },
        { x: 150, z: -74, yaw: -1.3 },
        { x: 140, z: -116, yaw: -1.15 },
    ] as AnkerDef[],
    koggerEtter: [
        { x: 37, z: -77, yaw: 1.3 },
        { x: 31, z: -59, yaw: 1.3 },
        { x: 55, z: -59, yaw: 1.45 },
        { x: 53, z: -41, yaw: 1.45 },
        { x: 74, z: -64, yaw: -1.4 },
        { x: 68, z: -84, yaw: -1.2 },
        { x: 82, z: -48, yaw: -1.5 },
    ] as AnkerDef[],
    menn: [[21.5, -72.5], [19.2, -68.4], [23.8, -76.2]] as [number, number][],
};
