// Filmscenene i hovedhistorien (blueprint §6: én inn og én ut per kapittel), skrevet som data og
// spilt av i spill-løkka av sekvensverktøyet (graboks/sekvens.ts). Ingen video.
//
// Hver film er en funksjon av spillet (`SpillKontekst`), så den kan finne koggen, tyven og valgene
// eleven har gjort. Alt som skal vare etter filmen (klokka, et oppdrag, hvor gutten står), skjer i
// `gjor`-steg eller i `slutt`: de kjøres også når filmen hoppes over, så sluttilstanden blir lik.
//
// Når filmene kommer (koblet i `koblFilmer` nederst):
//   ankomst   nytt spill, bak startskjermen: koggen fra Lübeck legger til (prologen)
//   prolog-ut oppdraget «fisk» er levert: sommeren går, høsten kommer
//   kap1-inn  oppdraget «tyven» er tatt: natt, gutten holder vakt, en skygge på svalgangen
//   vakta     gutten ropte på vakta etter slagsmålet: vaktene henter tyven
//   kap1-ut   «tyven» er levert: morgenen etter
//
// Gutten, husbonden, Lambert, Sigurd, skipperen og vaktene er laget for spillet [S], og det samme er
// replikkene og hvor ting skjer. Historiske påstander er merket der de står.
import * as THREE from 'three';
import { MeshKit } from '../motor/meshkit';
import { KOGGE, lagKogge } from '../motor/kogge-modell';
import { raa, seilSatt, vannlinje } from '../motor/skrog';
import { WATER_Y } from '../motor/boat';
import { vannHoyde, type SkrogFot } from '../motor/vann';
import { DAG_S, NATT_S, STARTER } from '../motor/dogn';
import { toGroup } from './gard';
import { VAKTPOST, VAKTPOST_YAW, RUTE } from '../graboks/tyv';
import type { Film, Rekvisitt, P3 } from '../graboks/sekvens';
import type { SpillKontekst } from '../graboks/system';

/** Der gutten står når prologen slutter (spillets startpunkt på kaia), og retningen mot bua. */
const KAI_START: P3 = [0, 0, 2.4];
const MOT_BUA = Math.atan2(-3.4, 3.6);
const OPP = new THREE.Vector3(0, 1, 0);

/** Sett gutten et sted og kameraet bak ham. */
function flyttGutt(k: SpillKontekst, p: P3, yaw: number): void {
    k.player.teleport(new THREE.Vector3(p[0], p[1], p[2]), yaw);
    k.cam.yaw = yaw + Math.PI;
}

/** Koggen som seiler inn i prologen: samme modell som den som ligger fortøyd (skip.ts). */
function filmKogge(k: SpillKontekst): Rekvisitt {
    const mk = new MeshKit();
    const info = lagKogge(mk, false);
    const root = new THREE.Group();
    root.rotation.order = 'YXZ';
    root.add(toGroup(mk, k.world.materials, 'film-kogge'));
    const ra = info.raa;
    const tint = { top: 0.8, bottom: 0.8, hue: [1.04, 0.98, 0.9] as [number, number, number] };
    const ks = new MeshKit();
    seilSatt(ks, ra.z, ra.y, ra.halv, ra.bunn, ra.halv * 0.16, tint);
    const kb = new MeshKit();
    raa(kb, ra.z, ra.y - 0.4, ra.halv, tint, ra.seilR);
    const satt = toGroup(ks, k.world.materials, 'film-kogge:seil');
    const beslatt = toGroup(kb, k.world.materials, 'film-kogge:beslatt');
    beslatt.visible = false;
    root.add(satt, beslatt);
    // Vannet skal ikke tegnes inne i skroget (vann.ts).
    const vl = vannlinje(KOGGE, 0.3);
    const fot: SkrogFot = { x: 0, z: 0, yaw: 0, L: vl.L, B: vl.B, fyldig: vl.fyldig };
    k.world.ekstraSkrog.push(fot);
    // Mannskapet på den fortøyde koggen (torgfolk.ts) seiler med: de flyttes med filmkoggen og
    // settes tilbake når filmen slutter.
    const fast = k.scene.getObjectByName('kogge');
    const fastPos = fast ? fast.getWorldPosition(new THREE.Vector3()) : null;
    const fastYaw = fast?.rotation.y ?? Math.PI / 2;
    const mannskap: { o: THREE.Object3D; lokal: THREE.Vector3; pos: THREE.Vector3; yaw: number }[] = [];
    if (fastPos) {
        k.scene.traverse((g) => {
            if (g.name !== 'folk') return;
            for (const o of g.children) {
                const w = o.getWorldPosition(new THREE.Vector3());
                if (Math.hypot(w.x - fastPos.x, w.z - fastPos.z) > 7 || w.y > 1.5) continue;
                const lokal = w.clone().sub(fastPos).applyAxisAngle(OPP, -fastYaw);
                mannskap.push({ o, lokal, pos: o.position.clone(), yaw: o.rotation.y });
            }
        });
    }
    const _w = new THREE.Vector3();
    return {
        root,
        seil: (s) => {
            satt.visible = s;
            beslatt.visible = !s;
        },
        oppdater: (t) => {
            const p = root.position;
            const fx = Math.sin(root.rotation.y);
            const fz = Math.cos(root.rotation.y);
            const l = KOGGE.L * 0.7;
            const hF = vannHoyde(p.x + fx * l, p.z + fz * l, t);
            const hA = vannHoyde(p.x - fx * l, p.z - fz * l, t);
            p.y = WATER_Y - 0.15 + (hF + hA) / 2 + Math.sin(t * 0.55) * 0.035;
            root.rotation.x = -(hF - hA) / (2 * l);
            root.rotation.z = Math.sin(t * 0.83) * 0.01 + (satt.visible ? 0.03 : 0);
            fot.x = p.x + fx * vl.forut;
            fot.z = p.z + fz * vl.forut;
            fot.yaw = root.rotation.y;
            for (const m of mannskap) {
                _w.copy(m.lokal).applyAxisAngle(OPP, root.rotation.y).add(p);
                _w.y = m.lokal.y + fastPos!.y + (p.y - (WATER_Y - 0.15));
                m.o.position.copy(m.o.parent ? m.o.parent.worldToLocal(_w) : _w);
                m.o.rotation.y = m.yaw + root.rotation.y - fastYaw;
            }
        },
        dispose: () => {
            for (const m of mannskap) {
                m.o.position.copy(m.pos);
                m.o.rotation.y = m.yaw;
            }
            const i = k.world.ekstraSkrog.indexOf(fot);
            if (i >= 0) k.world.ekstraSkrog.splice(i, 1);
            root.traverse((o) => {
                if (o instanceof THREE.Mesh) o.geometry.dispose();
            });
        },
    };
}

// ── Prologen: Ankomst med koggen (vår 1426) ──
function ankomst(k: SpillKontekst): Film {
    // Koggen legger seg der den fortøyde koggen ligger (skip.ts), og den skjules så lenge.
    const fast = k.scene.getObjectByName('kogge');
    const x = fast?.position.x ?? 24;
    const z = fast?.position.z ?? -9.2;
    return {
        id: 'ankomst',
        lengde: 34,
        skjul: ['gutt', 'kogge'],
        figurer: {
            kogge: { rekvisitt: filmKogge, pos: [x - 36, WATER_Y, z - 12], yaw: Math.atan2(20, 12) },
            gutt: { drakt: 'junge', pos: [9, 0, 1.8], yaw: -Math.PI / 2, synlig: false },
            skipper: { drakt: 'svenn', pos: [10, 0, 1.4], yaw: -Math.PI / 2, synlig: false },
        },
        steg: [
            { t: 0, figur: 'kogge', lop: [[x - 16, WATER_Y, z], [x, WATER_Y, z]], fart: 2.6 },
            // Fra kaia ved allmenningen: koggen kommer inn fra Vågen mot kameraet.
            { t: 0, kamera: { pos: [x + 7, 3.4, z + 4], blikk: ['kogge', 4], fov: 46, til: { pos: [x + 4, 3.0, z + 5.5] } } },
            // [V] Kogger fra hansabyene kom til Bergen med korn (blueprint §4.3). Lübeck var den
            // ledende hansabyen [V].
            { t: 0.6, tekst: 'Bergen, våren 1426' },
            { t: 5, tekst: 'Koggen kommer fra Lübeck, en by i Tyskland. Den er full av korn og øl.' },
            { t: 6, kamera: { pos: { folg: 'kogge', off: [-6, 6, -16] }, blikk: ['kogge', 4], fov: 45, glid: 3 } },
            // [K] Junger kom ofte til Bryggen som unge gutter; at denne er tolv, er [S] (blueprint §6).
            { t: 10, tekst: 'Om bord står en gutt på tolv år. Han skal bli junge: den yngste arbeideren i en gård på Bryggen.' },
            { t: 13, figur: 'kogge', seil: false },
            { t: 13.5, kamera: { pos: [x - 4, 4.5, z + 9.5], blikk: ['kogge', 3], fov: 50, glid: 2.5 } },
            { t: 15.5, tekst: null },
            // Kutt til kaia: gutten og skipperen går mot gården.
            { t: 17, figur: 'gutt', synlig: true, lop: [[0.9, 0, 2.3], [KAI_START[0], 0, KAI_START[2]]], fart: 1.25 },
            { t: 17, figur: 'skipper', synlig: true, lop: [[1.6, 0, 1.6]], fart: 1.2 },
            { t: 17, kamera: { pos: [-1.6, 1.55, 0.9], blikk: ['gutt', 1.3], fov: 48, til: { pos: [-1.9, 1.6, 0.6] } } },
            { t: 22, si: 'skipper', tekst: 'Her er det, gutt. Gården til Hinrik Kolle.' },
            // To-skudd fra kaikanten: gutten og skipperen, med bua bak.
            { t: 25, figur: 'gutt', snu: [1.6, 0, 1.6] },
            { t: 25, figur: 'skipper', snu: [0, 0, 2.4] },
            { t: 24.5, kamera: { pos: [0.9, 1.6, -1.7], blikk: [0.8, 1.35, 2.0], fov: 46, glid: 1.2 } },
            { t: 25.3, si: 'gutt', tekst: 'Er det her jeg skal bo?' },
            { t: 27, si: 'skipper', tekst: 'Her skal du bo og arbeide i mange år. Husbonden venter på deg i bua. Lykke til, junge.' },
            { t: 28, figur: 'gutt', snu: MOT_BUA },
            { t: 31.5, figur: 'skipper', lop: [[9, 0, 1.5], [16, 0, 1.4]], fart: 1.3 },
            { t: 31.5, tekst: 'Prologen: Ankomst med koggen' },
            {
                t: 33.5,
                gjor: (kk) => {
                    flyttGutt(kk, KAI_START, MOT_BUA);
                    kk.folk.oppdrag.ta('ankomst');
                },
            },
        ],
    };
}

// ── Prologen slutter: sommeren går (etter «Fisken bærer seg ikke selv») ──
function prologUt(k: SpillKontekst): Film {
    void k;
    return {
        id: 'prolog-ut',
        lengde: 15,
        steg: [
            { t: 0, kamera: { pos: [9, 5, -16], blikk: [0, 3.5, 8], fov: 50, til: { pos: [-5, 5.5, -16], blikk: [-2, 3.5, 8] } } },
            { t: 0.5, tekst: 'Gutten bærer fisk hele sommeren. Han lærer reglene, navnene og hvor alt står.' },
            { t: 5.5, kamera: { pos: [0.9, 4.6, 5.5], blikk: [0, 1.2, 30], fov: 55, til: { pos: [0.9, 4.2, 9] } } },
            { t: 5.5, gjor: (kk) => kk.lys.still(DAG_S * 0.86) },
            { t: 6, tekst: 'Så kommer høsten. Dagene blir korte, og nettene blir lange og mørke.' },
            { t: 11, tekst: 'Høsten 1426' },
        ],
    };
}

// ── Kapittel 1 inn: Tyven i natt ──
function kap1Inn(k: SpillKontekst): Film {
    void k;
    // Tyven kommer ut der jakten begynner (tyv.ts, RUTE[0]): loftsdøra på svalgangen.
    const dor = RUTE[0].p;
    // Kameraet foran gutten, så vi ser ansiktet.
    const fx = Math.sin(VAKTPOST_YAW);
    const fz = Math.cos(VAKTPOST_YAW);
    return {
        id: 'kap1-inn',
        lengde: 20,
        skjul: ['gutt', 'tyv'],
        figurer: {
            gutt: { drakt: 'junge', pos: [VAKTPOST.x, VAKTPOST.y, VAKTPOST.z], yaw: VAKTPOST_YAW },
            tyv: { drakt: 'tyv', pos: [dor.x, dor.y, dor.z - 1.6], yaw: 0, synlig: false },
        },
        steg: [
            {
                t: 0,
                gjor: (kk) => {
                    // Midt i natta [S]. Gutten holder vakt i gårdsrommet.
                    kk.lys.still(DAG_S + NATT_S * 0.3);
                    kk.baering.slipp();
                    flyttGutt(kk, [VAKTPOST.x, VAKTPOST.y, VAKTPOST.z], VAKTPOST_YAW);
                },
            },
            { t: 0, kamera: { pos: [0.4, 8.5, 3], blikk: [0, 1, 24], fov: 55, til: { pos: [0.4, 7.5, 7] } } },
            // Kapittelnavn og årstall fra blueprint §6 [S].
            { t: 0.6, tekst: 'Kapittel 1: Tyven i natt' },
            { t: 4.5, tekst: 'Høsten 1426. Det forsvinner fisk fra lagerloftet om natta, og ingen vet hvem som tar den.' },
            { t: 9, tekst: null },
            {
                t: 9,
                kamera: { pos: [VAKTPOST.x + fx * 2.2, 1.45, VAKTPOST.z + fz * 2.2], blikk: ['gutt', 1.35], fov: 45, til: { pos: [VAKTPOST.x + fx * 1.8, 1.45, VAKTPOST.z + fz * 1.8] } },
            },
            { t: 9.6, si: 'gutt', tekst: 'Så kaldt det er. Og så mørkt ...' },
            // Han lister seg ut av loftsdøra, stopper og ser ned i gården.
            { t: 12, figur: 'tyv', synlig: true, lop: [[dor.x, dor.y, dor.z]], fart: 0.6 },
            { t: 12, kamera: { pos: [1.2, 3.9, dor.z + 4.5], blikk: ['tyv', 1.3], fov: 40 } },
            { t: 15, figur: 'tyv', snu: [VAKTPOST.x, 0, VAKTPOST.z] },
            // Gutten ser ham.
            { t: 15.2, figur: 'gutt', snu: [dor.x, 0, dor.z] },
            { t: 15.2, kamera: { pos: [VAKTPOST.x + fx * 2 - 0.5, 1.6, VAKTPOST.z + fz * 2], blikk: ['gutt', 1.4], fov: 45 } },
            { t: 15.5, si: 'gutt', tekst: 'Der! Det er noen oppe på svalgangen!' },
            { t: 17, tekst: 'Løp etter tyven, og ikke mist ham av syne.' },
        ],
        slutt: (kk) => flyttGutt(kk, [VAKTPOST.x, VAKTPOST.y, VAKTPOST.z], VAKTPOST_YAW),
    };
}

/** Er det fri sikt mellom to punkter (ingen vegg imellom)? */
function fri(k: SpillKontekst, a: THREE.Vector3, b: THREE.Vector3): boolean {
    const d = b.clone().sub(a);
    const len = d.length();
    return len < 0.3 || !k.phys.rayWorld(a, d.divideScalar(len), len - 0.2, true);
}

/**
 * Et kamera rundt `mal` i avstand `r` og høyde `h` som ser både `mal` og `ogsa` uten vegger
 * imellom (smuget er trangt). Prøver retninger fra `fra` og rundt; finner det ingen, `fra`.
 */
function friVinkel(k: SpillKontekst, mal: THREE.Vector3, ogsa: THREE.Vector3, fra: number, r: number, h: number): P3 {
    const hode = mal.clone().setY(mal.y + 1.2);
    const hode2 = ogsa.clone().setY(ogsa.y + 1.4);
    for (let i = 0; i < 16; i++) {
        const v = fra + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8);
        const p = new THREE.Vector3(mal.x + Math.sin(v) * r, mal.y + h, mal.z + Math.cos(v) * r);
        if (fri(k, hode, p) && fri(k, p, hode2)) return [p.x, p.y, p.z];
    }
    return [mal.x + Math.sin(fra) * r, mal.y + h, mal.z + Math.cos(fra) * r];
}

// ── Gutten ropte på vakta: vaktene henter tyven ──
function vakta(k: SpillKontekst): Film {
    // Tyven der han ligger. Er han parkert under bakken (filmen startet med ?film=vakta), smuget.
    const t = k.enemy.pos.y < -10 ? RUTE[RUTE.length - 1].p.clone() : k.enemy.pos.clone();
    const g = k.player.pos.clone();
    // Vaktene kommer fra gårdsrommet (mot kaia), gjennom munningen av smuget (tyv.ts, RUTE).
    const munning = RUTE[RUTE.length - 2].p;
    const fra = new THREE.Vector3(0.3, 0, munning.z - 9);
    const ved = (dx: number, dz: number): P3 => [t.x + dx, t.y, t.z + dz];
    const inn: P3 = [munning.x, 0, munning.z];
    const ut: P3[] = [inn, [0.3, 0, munning.z - 10]];
    const motGutt = Math.atan2(g.x - t.x, g.z - t.z);
    // Kameraet der det ser både tyven og gutten (eller vakta).
    const kam1 = friVinkel(k, t, g, motGutt + 0.3, 3.8, 2.1);
    const kam2 = friVinkel(k, t, new THREE.Vector3(...inn), motGutt - 0.4, 4.2, 2.3);
    return {
        id: 'vakta',
        lengde: 19,
        skjul: ['tyv'],
        figurer: {
            sigurd: { drakt: 'tyv', pos: () => t.clone(), yaw: motGutt },
            vakt1: { drakt: 'vakt', pos: [fra.x, 0, fra.z], yaw: 0 },
            vakt2: { drakt: 'vakt', pos: [fra.x + 0.8, 0, fra.z - 0.9], yaw: 0 },
        },
        steg: [
            { t: 0, figur: 'sigurd', klipp: 'Crouch_Idle_Loop', loop: true },
            { t: 0, kamera: { pos: kam1, blikk: ['sigurd', 0.9], fov: 50 } },
            { t: 0.2, figur: 'vakt1', lop: [inn, ved(0.7, -1.1)], fart: 3.4 },
            { t: 0.5, figur: 'vakt2', lop: [inn, ved(-0.6, -1.3)], fart: 3.4 },
            { t: 3.5, kamera: { pos: kam2, blikk: ['vakt1', 1.5], fov: 50, glid: 1 } },
            { t: 4.2, figur: 'vakt1', snu: [t.x, 0, t.z] },
            { t: 4.2, figur: 'vakt2', snu: [t.x, 0, t.z] },
            { t: 4.4, si: 'vakt1', tekst: 'Hva er det som skjer her? Var det deg som ropte, gutt?' },
            { t: 7, si: 'gutt', tekst: 'Han har stjålet fisk fra lagerloftet vårt.' },
            { t: 9.5, si: 'vakt1', tekst: 'Da skal han til gjaldkeren. Opp med deg!' },
            { t: 11.5, figur: 'sigurd', klipp: null },
            { t: 12, si: 'sigurd', tekst: 'Jeg var bare sulten ...' },
            { t: 14, figur: 'vakt1', lop: ut, fart: 1.2 },
            { t: 14.4, figur: 'sigurd', lop: ut, fart: 1.2 },
            { t: 14.8, figur: 'vakt2', lop: ut, fart: 1.2 },
            // [V] Bylova: tyven skulle føres til gjaldkeren, kongens mann i byen (blueprint §8.2).
            { t: 14.5, tekst: 'Vaktene tar Sigurd med til gjaldkeren. Han er kongens mann i byen.' },
        ],
        // Tyven er borte fra gården. Lambert får høre om det når gutten leverer.
        slutt: (kk) => kk.tyv.hent(),
    };
}

// ── Kapittel 1 ut: morgenen etter ──
function kap1Ut(k: SpillKontekst): Film {
    const selv = k.folk.oppdrag.flagg.has('tyv-selv');
    const steg: Film['steg'] = [
        { t: 0, gjor: (kk) => kk.lys.still(STARTER.morgen.tid) },
        { t: 0, kamera: { pos: [0.6, 3.2, 3.5], blikk: [0, 1.6, 26], fov: 52, til: { pos: [0.6, 3.6, 7] } } },
        { t: 0.6, tekst: 'Morgenen etter' },
    ];
    if (selv) {
        // [V] Bylova: den som tok en tyv, skulle binde tyvegodset på ryggen hans og føre ham til
        // gjaldkeren (blueprint §8.2). At Lambert gjør det her, er [S].
        steg.push(
            { t: 4, figur: 'lambert', synlig: true, lop: [[6, 0, 1.6], [16, 0, 1.4]], fart: 1.1 },
            { t: 4, figur: 'sigurd', synlig: true, over: 'Baere_Over', lop: [[5, 0, 2.3], [15, 0, 2.1]], fart: 1.1 },
            { t: 4, kamera: { pos: [9, 1.7, -0.4], blikk: ['sigurd', 1.3], fov: 45 } },
            { t: 5.5, si: 'lambert', tekst: 'Kom. Vi går til gjaldkeren, slik loven sier.' },
            { t: 8, si: 'sigurd', tekst: 'Får jeg noe å spise der?' },
            { t: 10, si: 'lambert', tekst: 'Det får vi se, gutt.' },
            { t: 11.5, tekst: 'Lambert binder fisken på ryggen til Sigurd og tar ham med til gjaldkeren. Slik sa loven at det skulle gjøres.' },
        );
    } else {
        steg.push(
            { t: 4.5, tekst: 'Om morgenen snakker alle i gården om tyven som vaktene tok i natt.' },
            { t: 8, kamera: { pos: [-0.2, 1.7, 44], blikk: [-2.6, 1, 48.3], fov: 50, til: { pos: [0.2, 1.8, 42.5] } } },
            { t: 8.5, tekst: 'Ingen vet hva som skjer med Sigurd hos gjaldkeren.' },
        );
    }
    steg.push(
        { t: 15.5, kamera: { pos: [0.5, 4, -6], blikk: [0, 3, 10], fov: 55, glid: 1.5, til: { pos: [0.5, 5, -9] } } },
        { t: 16, tekst: 'Den nye jungen tok tyven. Nå vet alle i gården hvem du er.' },
        { t: 20, tekst: 'Slutt på kapittel 1' },
    );
    return {
        id: 'kap1-ut',
        lengde: 23,
        skjul: ['tyv'],
        figurer: selv
            ? {
                  lambert: { drakt: 'svenn', pos: [-2.2, 0, 1.9], yaw: Math.PI / 2, synlig: false },
                  sigurd: { drakt: 'tyv', pos: [-3, 0, 2.6], yaw: Math.PI / 2, synlig: false },
              }
            : {},
        steg,
    };
}

export const FILMER: Record<string, (k: SpillKontekst) => Film> = {
    ankomst,
    'prolog-ut': prologUt,
    'kap1-inn': kap1Inn,
    vakta,
    'kap1-ut': kap1Ut,
};

/** Når filmene kommer: på oppdragene og valgene (oppdrag.ts), og prologen i et nytt spill. */
export function koblFilmer(k: SpillKontekst, spill: (f: Film) => void, vedStart: (f: Film) => void): void {
    const o = k.folk.oppdrag;
    const sett = (id: string) => o.flagg.has(`film:${id}`);
    const vis = (id: string) => {
        if (!sett(id)) spill(FILMER[id](k));
    };
    o.lyttere.push((hva, id) => {
        if (hva === 'lever' && id === 'fisk') vis('prolog-ut');
        else if (hva === 'ta' && id === 'tyven') vis('kap1-inn');
        else if (hva === 'flagg' && id === 'tyv-vakta') vis('vakta');
        else if (hva === 'lever' && id === 'tyven') vis('kap1-ut');
    });
    // ?film=<id> spiller en film rett etter start (for å se og teste den). Ellers prologen i et nytt spill,
    // men ikke når ?sted= (dev.ts) har satt gutten et annet sted: prologen ville flyttet ham tilbake.
    const q = new URLSearchParams(location.search);
    const valgt = q.get('film');
    if (valgt && FILMER[valgt]) vedStart(FILMER[valgt](k));
    else if (!(import.meta.env.DEV && q.has('sted')) && !sett('ankomst') && o.status('ankomst') === 'ny') vedStart(FILMER.ankomst(k));
    // Dev: `window.__bryggenFilm('<id>')` spiller en film nå, bygget av spillet slik det er nå.
    if (import.meta.env.DEV) (window as { __bryggenFilm?: (id: string) => void }).__bryggenFilm = (id) => spill(FILMER[id](k));
    // Lastet midt i jakten: det er fortsatt natt.
    if (o.status('tyven') === 'aktiv' && sett('kap1-inn')) k.lys.still(DAG_S + NATT_S * 0.3);
}
