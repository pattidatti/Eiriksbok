// Filmscenene i kapittel 2, «Uten motstand» (blueprint §6), skrevet som data for sekvensverktøyet
// (graboks/sekvens.ts), som filmene i filmer.ts. Koblet i `koblFilmer` (filmer.ts):
//
//   kap2-inn    Lambert har fortalt om budet fra Lübeck (flagget `kap2-start`): våren 1427 seiler
//               koggen hjem, gutten og Hennig blir igjen. Et år går. Våren 1428 ligger fremmede skip i
//               Vågen. Byen skifter til 1428 (epoke.ts) i skuddet over Vågen.
//   kap2-jekta  gutten trykket E ved jekta (kap2.ts): plyndrerne tar fisken til Bård
//   kap2-ut     «Kornet» er levert: mai 1428, hvordan det gikk med kornet, plyndrerne seiler, og to av
//               dem ved porten til gården. Byen skifter tilbake i det siste skuddet over sjøen.
//
// Det som skjer, og hvor vi vet det fra, står i kap2-data.ts. Replikkene, hvem som står hvor og hva
// plyndrerne sier ved porten, er laget for spillet [S]. Krangelen ved porten viser at vi ikke vet om
// plyndrerne lot gårdene på Bryggen være [U].
import { WATER_Y } from '../motor/boat';
import { DAG_S, STARTER } from '../motor/dogn';
import type { Film, P3 } from '../graboks/sekvens';
import type { SpillKontekst } from '../graboks/system';
import { KAI_START, filmKogge, flyttGutt } from './filmer';
import { KAP2_STEDER as S } from './kap2-data';

/** Gutten på kaia, med ansiktet mot torget (+x) når filmen slutter. */
const MOT_TORGET = Math.PI / 2;
const P = (p: [number, number, number], dx = 0, dz = 0): P3 => [p[0] + dx, p[1], p[2] + dz];
/** Som `P`, men i høyden `y` (kameraet og blikket). */
const Q = (p: [number, number, number], dx: number, y: number, dz: number): P3 => [p[0] + dx, y, p[2] + dz];

// ── Kapittel 2 inn: våren 1427 til våren 1428 ──
function kap2Inn(k: SpillKontekst): Film {
    const fast = k.scene.getObjectByName('kogge');
    const x = fast?.position.x ?? 24;
    const z = fast?.position.z ?? -9.2;
    const [s0] = S.skip;
    return {
        id: 'kap2-inn',
        lengde: 44,
        skjul: ['gutt', 'kogge'],
        figurer: {
            kogge: { rekvisitt: (kk) => filmKogge(kk, false), pos: [x, WATER_Y, z], yaw: fast?.rotation.y ?? Math.PI / 2 },
            husbonde: { drakt: 'husbonde', pos: [0.5, 0, 1.7], yaw: -Math.PI / 2 },
            gutt: { drakt: 'junge', pos: [-1.1, 0, 2.1], yaw: Math.PI / 2 },
            hennig: { drakt: 'stuedreng', pos: [-2.3, 0, 2.5], yaw: Math.PI / 2 },
        },
        steg: [
            {
                t: 0,
                gjor: (kk) => {
                    kk.lys.still(STARTER.morgen.tid);
                    kk.baering.slipp();
                },
            },
            { t: 0, figur: 'kogge', seil: false },
            { t: 0, kamera: { pos: [x - 9, 4.2, z + 6], blikk: [x - 4, 1.6, z + 9], fov: 50, til: { pos: [x - 12, 4.6, z + 5] } } },
            { t: 0.6, tekst: 'Bergen, våren 1427' },
            // [V] Ersland 2020: kjøpmennene fra de vendiske byene forlot Bergen våren 1427.
            { t: 4.5, tekst: 'Kongen og hansabyene er i krig. Byrådet i Lübeck sender bud: alle kjøpmennene skal reise hjem.' },
            { t: 9.5, tekst: null },
            // To-skudd på kaia: husbonden og gutten, Hennig bak. Vest for fiskeren Sølve, som står på kaia
            // ved (2,7, 1,3) i 1427: i en lang grå kjortel så han ut som en fremmed kvinne i skuddet.
            { t: 9.5, kamera: { pos: [-0.7, 1.6, -1.6], blikk: [-0.4, 1.35, 2.0], fov: 46, til: { pos: [-1.0, 1.6, -1.9] } } },
            { t: 10, si: 'husbonde', tekst: 'Koggen går i dag. Du og Hennig blir her og passer gården til vi kommer tilbake.' },
            { t: 14, si: 'gutt', tekst: 'Hvor lenge blir dere borte?' },
            { t: 16.2, si: 'husbonde', tekst: 'Til krigen er over. Ingen vet hvor lenge. Hold ilden i schøtstua, og hold dørene stengt.' },
            { t: 21, figur: 'husbonde', lop: [[8, 0, 1.6], [x - 1.5, 0, 1.4]], fart: 1.2 },
            { t: 21, figur: 'gutt', snu: [8, 0, 1.6] },
            // Koggen seiler ut av Vågen mot havet (forbi Holmen, +x).
            { t: 23, figur: 'husbonde', synlig: false },
            { t: 23, figur: 'kogge', seil: true, lop: [[x + 14, WATER_Y, z - 16], [x + 50, WATER_Y, z - 40]], fart: 2.4 },
            { t: 23, kamera: { pos: [16, 3.2, 1.2], blikk: ['kogge', 4], fov: 48 } },
            { t: 23.5, tekst: 'Koggen seiler. Gården blir stille.' },
            // Et år går. Kameraet ser ut over Vågen (gårdene er bak det), og byen skifter til 1428.
            {
                t: 28,
                gjor: (kk) => {
                    kk.folk.oppdrag.settFlagg('kap2-epoke');
                    kk.lys.still(DAG_S * 0.18);
                },
            },
            { t: 28, figur: 'kogge', synlig: false },
            { t: 28, kamera: { pos: [s0[0] - 22, 7, s0[1] + 30], blikk: [s0[0] + 6, 2.5, s0[1] - 4], fov: 46, til: { pos: [s0[0] - 18, 6, s0[1] + 26] } } },
            { t: 28.3, tekst: 'Et år går.' },
            { t: 31.5, tekst: 'Våren 1428. Gutten er fjorten år.' },
            { t: 35, tekst: 'Kapittel 2: Uten motstand' },
            // Gutten og Hennig på kaia ser skipene.
            { t: 38.5, tekst: null },
            { t: 38.5, figur: 'gutt', plass: [0.4, 0, 2.0], snu: [s0[0], 0, s0[1]] },
            { t: 38.5, figur: 'hennig', plass: [-0.6, 0, 2.3], snu: [s0[0], 0, s0[1]] },
            { t: 38.5, kamera: { pos: [-1.5, 1.7, 4.6], blikk: [6, 1.2, -8], fov: 50 } },
            { t: 38.8, si: 'hennig', tekst: 'Ser du skipene? De kom i natt. Ingen har sett dem her før.' },
            { t: 41.5, si: 'gutt', tekst: 'Jeg går til torget og hører hva folk sier.' },
            {
                t: 43.5,
                gjor: (kk) => {
                    flyttGutt(kk, KAI_START, MOT_TORGET);
                    kk.folk.oppdrag.ta('kap2', true);
                    // Gutten er fjorten og stuejunge (blueprint §6): minst rang 1.
                    kk.folk.oppdrag.gjor('rang:1');
                },
            },
        ],
    };
}

// ── Plyndrerne tar fisken til Bård ──
function kap2Jekta(k: SpillKontekst): Film {
    void k;
    const b = S.bard;
    return {
        id: 'kap2-jekta',
        lengde: 21,
        skjul: ['kap2-bard'],
        figurer: {
            bard: { drakt: 'fisker', pos: P(b), yaw: 0.5 },
            p1: { drakt: 'plyndrer', pos: P(b, -7, 1.6), yaw: Math.PI / 2 },
            p2: { drakt: 'plyndrer', pos: P(b, -8.5, 2.2), yaw: Math.PI / 2 },
        },
        steg: [
            { t: 0, kamera: { pos: Q(b, 5, 2.2, 3.4), blikk: Q(b, -1.5, 1.2, 0.4), fov: 50 } },
            { t: 0.3, figur: 'p1', lop: [P(b, -1, 0.8)], fart: 1.5 },
            { t: 0.6, figur: 'p2', lop: [P(b, 1.4, 1.4)], fart: 1.4 },
            { t: 0.4, figur: 'bard', snu: P(b, -6, 1.6) },
            // [U] no.wikipedia etter Ersland & Holm 2000: jektene ble tvunget til å gi fra seg fisken uten betaling.
            { t: 3.6, si: 'p1', tekst: 'Den fisken er vår nå. Gå vekk fra jekta.' },
            { t: 6.4, figur: 'bard', snu: P(b, -1, 0.8) },
            { t: 6.6, si: 'bard', tekst: 'Det er alt vi har fått i hele vinter! Hvem skal betale for den?' },
            { t: 9.8, si: 'p2', tekst: 'Klag til kongen din. Han er ikke her.' },
            { t: 10, kamera: { pos: Q(b, -3.5, 1.8, 4.2), blikk: ['bard', 1.3], fov: 46, glid: 1.4 } },
            { t: 12.4, figur: 'p1', klipp: 'Interact' },
            { t: 13.6, figur: 'p1', klipp: null, over: 'Baere_Over', lop: [P(b, -7, 1.4), P(b, -16, 1.4)], fart: 1.1 },
            { t: 14, figur: 'p2', over: 'Baere_Over', lop: [P(b, -6, 1.9), P(b, -16, 1.9)], fart: 1.1 },
            { t: 14.2, tekst: 'Ingen kommer for å hjelpe. Ikke kongens menn, ikke noen andre.' },
            { t: 17.6, tekst: null },
            { t: 17.6, figur: 'bard', snu: P(S.jekta) },
            { t: 17.8, si: 'bard', tekst: 'Og du, tyskergutt? Står du bare og ser på?' },
            { t: 20.8, gjor: (kk) => kk.folk.oppdrag.hendelse('kap2:jekta') },
        ],
    };
}

// ── Kapittel 2 ut: mai 1428 ──
// Gutten står på Stranden når Åsa takker, så filmen begynner der (cellene er lastet). Så flyttes han til
// kaia foran gården mens kameraet ser på skipene ute på Vågen, og Bryggen rekker å lastes før porten.
function kap2Ut(k: SpillKontekst): Film {
    const f = k.folk.oppdrag.flagg;
    const [s0, s1] = S.skip;
    const steg: Film['steg'] = [{ t: 0, gjor: (kk) => kk.lys.still(DAG_S * 0.7) }];
    // Hvordan det gikk med kornet.
    if (f.has('kap2-naust')) {
        steg.push(
            { t: 0, kamera: { pos: [-33.4, 2.6, -119.4], blikk: [-37, 1, -125.5], fov: 50, til: { pos: [-33.9, 2.4, -120.4] } } },
            { t: 2.6, tekst: 'Tre sekker rug ligger under båten i naustet.' },
        );
    } else if (f.has('kap2-loft')) {
        steg.push(
            { t: 0, kamera: { pos: [-12.5, 2.4, -112.5], blikk: [-16, 0.6, -117.5], fov: 50, til: { pos: [-12.9, 2.3, -113.2] } } },
            { t: 2.6, tekst: 'Mannen til Åsa ror tre sekker rug over Vågen, til loftet til Hinrik Kolle.' },
        );
    } else {
        steg.push(
            { t: 0, kamera: { pos: [-29.4, 2.2, -134.2], blikk: [-33, 1, -138.4], fov: 50, til: { pos: [-29.8, 2.1, -134.8] } } },
            { t: 2.6, tekst: 'Familien på Stranden har mistet det meste av kornet sitt.' },
        );
    }
    steg.push(
        { t: 0.6, tekst: 'Mai 1428' },
        { t: 6.5, tekst: null },
        // Skipene seiler ut; gutten flyttes til kaia, så Bryggen lastes mens kameraet er ute på Vågen.
        { t: 6.5, gjor: (kk) => flyttGutt(kk, KAI_START, MOT_TORGET) },
        { t: 6.5, figur: 'k0', seil: true, lop: [[s0[0] + 30, WATER_Y, s0[1] - 18], [s0[0] + 80, WATER_Y, s0[1] - 50]], fart: 2.2 },
        { t: 7.2, figur: 'k1', seil: true, lop: [[s1[0] + 30, WATER_Y, s1[1] - 18], [s1[0] + 80, WATER_Y, s1[1] - 50]], fart: 2.2 },
        { t: 6.5, kamera: { pos: [s0[0] - 16, 6, s0[1] + 14], blikk: ['k0', 4], fov: 48, til: { pos: [s0[0] - 12, 6.4, s0[1] + 10] } } },
        // [U] no.wikipedia etter Ersland & Holm 2000: plyndrerne seilte til Wismar med byttet i mai 1428.
        { t: 7, tekst: 'Plyndrerne seiler hjem med fisken og alt annet de har tatt.' },
        { t: 14, tekst: null },
        // To av dem ved porten til gården, sett fra gårdsrommet.
        { t: 14, figur: 'p1', lop: [[1.0, 0, 1.7]], fart: 1.3 },
        { t: 14, figur: 'p2', lop: [[-0.1, 0, 1.5]], fart: 1.3 },
        { t: 14, kamera: { pos: [0.3, 1.6, 8.5], blikk: [0.6, 1.4, 1.3], fov: 46, til: { pos: [0.3, 1.6, 7.6] } } },
        { t: 16.6, figur: 'p1', snu: [0.6, 0, 6] },
        { t: 16.6, figur: 'p2', snu: [0.6, 0, 6] },
        { t: 17, si: 'p1', tekst: 'Tyskergården. Den skal vi ikke røre, sa skipperen.' },
        { t: 20, si: 'p2', tekst: 'Tyskerne har reist. Det som står igjen her, er ingens.' },
        { t: 23, si: 'p1', tekst: 'Vi har nok. Kom, skipet venter.' },
        { t: 25.5, figur: 'p1', lop: [[9, 0, 1.4], [20, 0, 1.4]], fart: 1.2 },
        { t: 25.8, figur: 'p2', lop: [[9, 0, 1.1], [20, 0, 1.1]], fart: 1.2 },
        { t: 26, tekst: 'Om gården sto fordi den var tysk, eller fordi de hadde nok, vet ingen.' },
        { t: 30.5, tekst: null },
    );
    if (f.has('kap2-tolk')) steg.push({ t: 30.5, tekst: 'I byen spør folk hvem den tyske gutten var, som snakket for sjørøverne.' });
    // Siste skudd over sjøen: byen skifter tilbake mens kameraet ser bort (kap2.ts leser flagget).
    steg.push(
        { t: 34.5, kamera: { pos: [12, 8, -58], blikk: [70, 3, -95], fov: 50, til: { pos: [14, 8.5, -62] } } },
        { t: 34.8, tekst: 'Kjøpmennene kommer ikke tilbake før i 1433.' },
        { t: 35.5, gjor: (kk) => kk.folk.oppdrag.settFlagg('kap2-ferdig') },
        { t: 39, tekst: 'Slutt på kapittel 2' },
    );
    steg.sort((a, b) => a.t - b.t);
    return {
        id: 'kap2-ut',
        lengde: 42.5,
        skjul: ['gutt', 'kap2-skip-0', 'kap2-skip-1'],
        figurer: {
            k0: { rekvisitt: (kk) => filmKogge(kk, false), pos: [s0[0], WATER_Y, s0[1]], yaw: s0[2] },
            k1: { rekvisitt: (kk) => filmKogge(kk, false), pos: [s1[0], WATER_Y, s1[1]], yaw: s1[2] },
            p1: { drakt: 'plyndrer', pos: [5.5, 0, 1.7], yaw: -Math.PI / 2 },
            p2: { drakt: 'plyndrer', pos: [6.5, 0, 1.5], yaw: -Math.PI / 2 },
        },
        steg,
    };
}

export const KAP2_FILMER: Record<string, (k: SpillKontekst) => Film> = {
    'kap2-inn': kap2Inn,
    'kap2-jekta': kap2Jekta,
    'kap2-ut': kap2Ut,
};
