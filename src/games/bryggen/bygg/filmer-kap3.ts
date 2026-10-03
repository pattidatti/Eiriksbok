// Filmscenene i kapittel 3, «Brannen» (blueprint §6.2), skrevet som data for sekvensverktøyet
// (graboks/sekvens.ts), som filmene i filmer.ts. Koblet i `koblFilmer` (filmer.ts):
//
//   kap3-inn     Hennig har fortalt om leidangen (flagget `kap3-start`): april 1429, leidangsskipene i
//                Vågen, sju kogger kommer inn fra havet. Byen skifter til 1429 (epoke.ts) i første skudd,
//                som ser ut over Vågen.
//   kap3-slaget  gutten rakk buntene opp til Asbjørn (kap3.ts): koggene legger seg inntil de store
//                skipene, ti skip til kommer fra Wismar, to norske skip blir tatt, og Hennig roper fra kaia
//   kap3-ut      «Brannen» er levert: natten etter brenner Holmen, om morgenen seiler koggene, og så
//                det gutten valgte. Byen skifter tilbake i det siste skuddet over sjøen.
//
// Det som skjer, og hvor vi vet det fra, står i kap3-data.ts. Replikkene, hvem som står hvor og hva
// folk sier, er laget for spillet [S].
import * as THREE from 'three';
import { WATER_Y } from '../motor/boat';
import { DAG_S, NATT_S, STARTER } from '../motor/dogn';
import type { Film, P3, Rekvisitt } from '../graboks/sekvens';
import type { SpillKontekst } from '../graboks/system';
import type { AnkerDef } from '../graboks/ankerskip';
import { HOLMEN } from './holmenvei';
import { HOLMEN_D } from './bergenhus';
import { KAI_START, filmKogge, flyttGutt } from './filmer';
import { KAP3_STEDER as S } from './kap3-data';

/** Gutten på kaia, med ansiktet mot Asbjørn og buntene (−x) når filmen slutter. */
const MOT_VEST = -Math.PI / 2;
const BAAT_START = new THREE.Vector3(-4.5, WATER_Y, -1.7);
const KOGGER = ['k0', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6'];
const SKJUL_KOGGER = KOGGER.map((_, i) => `kap3-kogge-${i}`);
const W = (d: AnkerDef, ut = 0): P3 => [d.x - Math.sin(d.yaw) * ut, WATER_Y, d.z - Math.cos(d.yaw) * ut];

/** De sju koggene som filmfigurer, der `hvor` sier. */
function kogger(hvor: AnkerDef[], ut = 0): Record<string, { rekvisitt: (k: SpillKontekst) => Rekvisitt; pos: P3; yaw: number }> {
    return Object.fromEntries(KOGGER.map((id, i) => [id, { rekvisitt: (kk: SpillKontekst) => filmKogge(kk, false), pos: W(hvor[i], ut), yaw: hvor[i].yaw }]));
}

/** Skipene fra Wismar: ti kogger med seil, som én flåte (samme skrog, delt geometri). */
function wismar(k: SpillKontekst): Rekvisitt {
    const mal = filmKogge(k, false);
    mal.seil?.(true);
    const root = new THREE.Group();
    root.rotation.order = 'YXZ';
    for (let i = 0; i < 10; i++) {
        const c = mal.root.clone();
        const rad = Math.floor(i / 2);
        c.position.set((i % 2 ? 1 : -1) * (7 + rad * 5), 0, -rad * 16);
        c.scale.setScalar(0.92 + ((i * 37) % 10) / 60);
        root.add(c);
    }
    return { root, dispose: mal.dispose };
}

/** Et punkt på dekket til skipet til Asbjørn: `u` langs skipet, `s` mot kaia. */
function dekk(u: number, s: number): P3 {
    const a = S.leidang[0];
    const fx = Math.sin(a.yaw);
    const fz = Math.cos(a.yaw);
    return [a.x + fx * u + fz * s, WATER_Y - 0.01, a.z + fz * u - fx * s];
}

// ── Kapittel 3 inn: april 1429 ──
function kap3Inn(k: SpillKontekst): Film {
    void k;
    const s1 = S.koggerFor[1];
    return {
        id: 'kap3-inn',
        lengde: 34,
        skjul: ['gutt'],
        figurer: {
            ...kogger(S.koggerFor, 48),
            gutt: { drakt: 'junge', pos: [0.4, 0, 2.0], yaw: Math.PI },
            hennig: { drakt: 'stuedreng', pos: [1.5, 0, 2.2], yaw: Math.PI },
        },
        steg: [
            {
                t: 0,
                gjor: (kk) => {
                    // Kameraet ser ut over Vågen: året skifter, og leidangsskipene kommer (kap3.ts).
                    kk.folk.oppdrag.settFlagg('kap3-epoke');
                    kk.lys.still(STARTER.morgen.tid);
                    kk.baering.slipp();
                },
            },
            ...KOGGER.map((id) => ({ t: 0, figur: id, seil: true })),
            { t: 0, kamera: { pos: [-8, 7, -7], blikk: [16, 0, -60], fov: 52, til: { pos: [-3, 7.5, -9] } } },
            { t: 0.6, tekst: 'Bergen, april 1429' },
            // [V] Byleksikon: leidangen kalt ut i 1429.
            { t: 4.5, tekst: 'Kongen har kalt ut leidangen. Skip fra bygdene langs kysten ligger i Vågen.' },
            { t: 9.5, tekst: 'Gutten er femten år. Kjøpmennene har ikke kommet tilbake.' },
            { t: 13.5, tekst: null },
            // [V] Byleksikon: Bartholomeus Voet kom med sju kogger.
            ...KOGGER.map((id, i) => ({ t: 13.5 + i * 0.3, figur: id, lop: [W(S.koggerFor[i])], fart: 3.4 })),
            { t: 13.5, kamera: { pos: [52, 5, -52], blikk: [s1.x + 18, 5, s1.z - 8], fov: 46, til: { pos: [56, 5.4, -55] } } },
            { t: 14, tekst: 'Så kommer sju store skip inn fra havet.' },
            { t: 19, tekst: 'Kapittel 3: Brannen' },
            { t: 23, tekst: null },
            ...KOGGER.map((id) => ({ t: 23, figur: id, seil: false })),
            // Gutten og Hennig på kaia ser skipene.
            { t: 23, figur: 'gutt', snu: [40, 0, -60] },
            { t: 23, figur: 'hennig', snu: [40, 0, -60] },
            { t: 23, kamera: { pos: [-1.2, 1.65, 4.4], blikk: [8, 1.3, -8], fov: 50 } },
            { t: 23.3, si: 'hennig', tekst: 'Sju kogger. Det er vitaliebrødrene igjen.' },
            { t: 26.3, si: 'gutt', tekst: 'Men denne gangen er det noen som kjemper imot.' },
            { t: 29.3, si: 'hennig', tekst: 'Asbjørn står der borte på kaia. Han trenger folk som kan ro.' },
            { t: 29.3, figur: 'hennig', snu: [S.asbjorn[0], 0, S.asbjorn[2]] },
            {
                t: 32.5,
                gjor: (kk) => {
                    flyttGutt(kk, KAI_START, MOT_VEST);
                    kk.boat.flytt(BAAT_START, Math.PI / 2);
                    kk.folk.oppdrag.ta('kap3', true);
                },
            },
        ],
    };
}

// ── Slaget i Vågen ──
function kap3Slaget(k: SpillKontekst): Film {
    void k;
    const b = S.leidang[S.tapt[0]];
    const [k1] = [S.koggerEtter[1]];
    const menn = Object.fromEntries(
        S.menn.map(([x, z], i) => [`m${i}`, { drakt: i === 1 ? ('vakt' as const) : ('leidang' as const), pos: [x, WATER_Y - 1.18, z] as P3, yaw: 0.6 * i, synlig: false }])
    );
    return {
        id: 'kap3-slaget',
        lengde: 35,
        skjul: SKJUL_KOGGER,
        figurer: {
            ...kogger(S.koggerFor),
            wismar: { rekvisitt: wismar, pos: [175, WATER_Y, -126], yaw: -1.0 },
            asbjorn: { drakt: 'leidang', pos: dekk(0.6, 1.1), yaw: 0 },
            ...menn,
        },
        steg: [
            { t: 0, figur: 'asbjorn', snu: [S.skipet[0], 0, S.skipet[1] + 4] },
            { t: 0, kamera: { pos: [S.skipet[0] - 5, 1.7, S.skipet[1] + 7], blikk: [S.skipet[0] + 1, 1.2, S.skipet[1] - 5], fov: 50 } },
            { t: 0.4, si: 'asbjorn', tekst: 'Godt rodd, gutt! Rekk dem opp hit.' },
            { t: 3.4, si: 'asbjorn', tekst: 'Hold deg unna de store skipene nå. Der kommer de.' },
            { t: 3.4, figur: 'asbjorn', snu: [S.koggerFor[1].x, 0, S.koggerFor[1].z] },
            // Koggene går mot de store norske skipene (tiden er trukket sammen).
            ...KOGGER.map((id, i) => ({ t: 6 + i * 0.25, figur: id, seil: true, lop: [W(S.koggerEtter[i])], fart: 6.5 })),
            { t: 6, kamera: { pos: [22, 6, -38], blikk: ['k1', 5], fov: 48 } },
            { t: 6.4, tekst: 'Koggene går rett mot de største norske skipene.' },
            { t: 12.5, tekst: null },
            ...KOGGER.map((id, i) => ({ t: 12.5, figur: id, seil: false, plass: W(S.koggerEtter[i]) })),
            // [U] «Høye som tårn» (no.wikipedia etter Ersland & Holm 2000).
            { t: 12.5, kamera: { pos: [b.x - 18, 0.5, b.z + 17], blikk: [k1.x, 7, k1.z], fov: 50, til: { pos: [b.x - 16, 0.6, b.z + 15] } } },
            { t: 13, tekst: 'Skipene deres er høye som tårn. Nordmennene står langt under dem.' },
            { t: 18, tekst: null },
            // [V] Byleksikon: Voet fikk ti skip i forsterkning fra Wismar.
            { t: 18, figur: 'wismar', lop: [[140, WATER_Y, -104]], fart: 6 },
            { t: 18, kamera: { pos: [100, 5, -66], blikk: ['wismar', 6], fov: 48 } },
            { t: 18.4, tekst: 'Så kommer ti skip til, fra Wismar.' },
            { t: 23.5, tekst: null },
            // [U] no.wikipedia: to av de store norske skipene ble tatt, rundt 300 drept eller kastet over bord.
            ...S.menn.map((_, i) => ({ t: 23.5, figur: `m${i}`, synlig: true })),
            { t: 23.5, kamera: { pos: [S.menn[0][0] - 8, 1.3, S.menn[0][1] + 7], blikk: [S.menn[0][0] + 1, -0.4, S.menn[0][1] - 2], fov: 50 } },
            { t: 23.8, tekst: 'To av de store norske skipene blir tatt. Folk faller i sjøen.' },
            // Kameraet ser mot byen: Holmen begynner å brenne (kap3.ts leser flagget).
            { t: 28.4, gjor: (kk) => kk.folk.oppdrag.settFlagg('kap3-slag') },
            { t: 28.5, tekst: null },
            { t: 28.5, kamera: { pos: [HOLMEN.xe - 15, 4, -38], blikk: [HOLMEN.xe + HOLMEN_D + 40, 14, 20], fov: 50, til: { pos: [HOLMEN.xe - 11, 4.4, -36] } } },
            { t: 29, tekst: 'Fra kaia roper Hennig: «Plyndrerne har gått i land! Det brenner på Holmen!»' },
            { t: 34, tekst: null },
            {
                t: 34.2,
                gjor: (kk) => {
                    const o = kk.folk.oppdrag;
                    o.hendelse('kap3:skipet');
                    o.lever('kap3');
                    o.ta('kap3-valg', true);
                },
            },
        ],
    };
}

// ── Kapittel 3 ut: natten etter, og morgenen ──
function kap3Ut(k: SpillKontekst): Film {
    const f = k.folk.oppdrag.flagg;
    const hx = HOLMEN.xe + HOLMEN_D;
    const steg: Film['steg'] = [
        {
            t: 0,
            gjor: (kk) => {
                kk.lys.still(DAG_S + NATT_S * 0.3);
                kk.baering.slipp();
            },
        },
        // [V] Byleksikon: kongsgården og bispegården brant.
        { t: 0, kamera: { pos: [hx - 40, 16, -52], blikk: [hx + 45, 8, 20], fov: 50, til: { pos: [hx - 35, 16.5, -50] } } },
        { t: 0.6, tekst: 'Natten etter slaget' },
        { t: 4.5, tekst: 'Kongsgården og bispegården på Holmen brenner.' },
        { t: 9.5, tekst: null },
        { t: 9.5, kamera: { pos: [hx + 100, 5, -62], blikk: [hx + 132, 7, -2], fov: 46, til: { pos: [hx + 104, 5.2, -60] } } },
        { t: 10, tekst: 'Plyndrerne tar det de finner i byen.' },
        { t: 15, tekst: null },
        // Morgen: koggene seiler ut. Gutten og færingen flyttes til kaia mens kameraet er ute på Vågen.
        {
            t: 15,
            gjor: (kk) => {
                kk.lys.still(STARTER.morgen.tid);
                flyttGutt(kk, KAI_START, MOT_VEST);
                kk.boat.flytt(BAAT_START, Math.PI / 2);
            },
        },
        ...KOGGER.map((id, i) => ({ t: 15 + i * 0.3, figur: id, seil: true, lop: [W(S.koggerFor[i]), W(S.koggerFor[i], 70)], fart: 3 })),
        { t: 15, kamera: { pos: [24, 6, -32], blikk: ['k2', 4], fov: 48, til: { pos: [28, 6.4, -34] } } },
        { t: 15.5, tekst: 'Om morgenen seiler koggene.' },
        { t: 21, tekst: null },
    ];
    // Det gutten valgte.
    if (f.has('kap3-folk')) {
        steg.push(
            { t: 21, kamera: { pos: [0.6, 1.65, -1.4], blikk: [1.1, 1.3, 2.3], fov: 52, til: { pos: [0.4, 1.65, -1.7] } } },
            { t: 21.5, si: 'm1', tekst: 'Uten deg hadde vi ligget på bunnen av Vågen, gutt.' },
            { t: 24.8, si: 'm0', tekst: 'Hva heter du? Det skal de få høre om hjemme i bygda.' },
            { t: 27.5, tekst: 'Tre mann fra leidangen står på kaia. De lever.' },
        );
    } else if (f.has('kap3-bok')) {
        steg.push(
            { t: 21, kamera: { pos: [0.3, 1.5, 15.5], blikk: [0.4, 1.1, 9], fov: 48, til: { pos: [0.3, 1.5, 14.5] } } },
            { t: 21.5, tekst: 'Gutten står alene i den tomme gården med gjeldsboka.' },
            { t: 25.5, tekst: 'Hvem som skylder Kontoret, og hvor mye, står der ennå.' },
        );
    } else {
        steg.push(
            { t: 21, kamera: { pos: [2.6, 1.6, -0.6], blikk: [0.6, 1.3, 2.6], fov: 48 } },
            { t: 21.5, tekst: 'Gutten og Hennig står på kaia. Ingen av dem sier noe.' },
        );
    }
    steg.push(
        { t: 30.5, tekst: null },
        // Siste skudd over sjøen: byen skifter tilbake mens kameraet ser bort (kap3.ts leser flagget).
        { t: 30.5, kamera: { pos: [12, 8, -58], blikk: [70, 3, -95], fov: 50, til: { pos: [14, 8.5, -62] } } },
        // [V] Byleksikon: siste gang leidangen ble kalt ut.
        { t: 30.8, tekst: 'Det var siste gang leidangen ble kalt ut.' },
        {
            t: 31.5,
            gjor: (kk) => {
                kk.folk.oppdrag.settFlagg('kap3-ferdig');
                // Gutten er femten og skutedreng (blueprint §6): minst rang 2.
                kk.folk.oppdrag.gjor('rang:2');
            },
        },
        { t: 35, tekst: 'Du rodde gjennom slaget.' },
        { t: 39, tekst: 'Slutt på kapittel 3' },
    );
    steg.sort((a, b) => a.t - b.t);
    const folk = f.has('kap3-folk');
    return {
        id: 'kap3-ut',
        lengde: 42.5,
        skjul: ['gutt', ...SKJUL_KOGGER],
        figurer: {
            ...kogger(S.koggerEtter),
            gutt: { drakt: 'junge', pos: f.has('kap3-bok') ? [0.4, 0, 9.2] : [0.0, 0, 2.2], yaw: f.has('kap3-bok') ? 0 : Math.PI / 2 },
            ...(f.has('kap3-bok') ? {} : { hennig: { drakt: 'stuedreng' as const, pos: [-1.0, 0, 2.9] as P3, yaw: Math.PI / 2 } }),
            ...(folk
                ? {
                      m0: { drakt: 'leidang' as const, pos: [1.6, 0, 3.0] as P3, yaw: -Math.PI / 2 - 0.4 },
                      m1: { drakt: 'vakt' as const, pos: [1.3, 0, 1.4] as P3, yaw: -Math.PI / 2 + 0.3 },
                      m2: { drakt: 'leidang' as const, pos: [2.6, 0, 2.2] as P3, yaw: -Math.PI / 2 },
                  }
                : {}),
        },
        steg,
    };
}

export const KAP3_FILMER: Record<string, (k: SpillKontekst) => Film> = {
    'kap3-inn': kap3Inn,
    'kap3-slaget': kap3Slaget,
    'kap3-ut': kap3Ut,
};
