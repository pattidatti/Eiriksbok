// Utviklerverktøy for Bryggen (bare i dev, kalt hvert bilde fra game.ts).
//
// - `window.__bryggenFoto = { pos: [x, y, z], look: [x, y, z] }` låser kameraet (skjermbilder og
//   måling fra Vågen). Funksjonen gir det tilbake, så løkka kan sette kameraet.
// - `window.__bryggenPos` er der gutten står (til testskript).
// - `window.__bryggenFolk()` gir folkene i de lastede cellene (drakt, posisjon, retning).
// - `?sted=<navn>` starter gutten ved et sted fra `DEV_STEDER` (sideoppdragene), `?oppdrag=a,b` tar
//   oppdragene (krav hoppes over, et levert oppdrag tas på nytt), og `?hendelse=a,b` sender hendelser
//   (f.eks. `messe:lys` for å hoppe rett til svarene i messen).
import * as THREE from 'three';
import type { Character } from '../motor/character';
import type { Spillsystem } from './system';
import type { Oppdrag } from './oppdrag';

interface Dev {
    __bryggenFoto?: { pos: number[]; look: number[] };
    __bryggenPos?: number[];
    __bryggenFolk?: () => FolkInfo[];
}

export function devVerktoy(scene: THREE.Scene, gutt: Character | undefined): { pos: number[]; look: number[] } | undefined {
    const dev = window as Dev;
    if (gutt) dev.__bryggenPos = gutt.pos.toArray();
    if (!dev.__bryggenFolk) dev.__bryggenFolk = () => folkListe(scene);
    return dev.__bryggenFoto;
}

/** En figur i scenen: drakt, føttene, retning, og høyden på hoftene og den laveste foten (beina). */
interface FolkInfo { navn: string; pos: number[]; yaw: number; hofte: number; fot: number }

/** Folkene i scenen (figur-meshene heter `figur:<drakt>`). */
function folkListe(scene: THREE.Scene): FolkInfo[] {
    const ut: FolkInfo[] = [];
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    scene.traverse((g) => {
        if (g.name !== 'folk') return;
        for (const root of g.children) {
            let navn = '';
            let hofte = NaN;
            let fot = Infinity;
            root.traverse((o) => {
                if (o.name.startsWith('figur:')) navn = o.name.slice(6);
                if (o.name === 'DEF-hips') hofte = o.getWorldPosition(v).y;
                if (o.name === 'DEF-footL' || o.name === 'DEF-footR') fot = Math.min(fot, o.getWorldPosition(v).y);
            });
            root.getWorldQuaternion(q);
            const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
            ut.push({ navn, pos: root.getWorldPosition(new THREE.Vector3()).toArray(), yaw: Math.atan2(fwd.x, fwd.z), hofte, fot });
        }
    });
    return ut;
}

/**
 * Fotokameraet også for navneskiltene: løkka tegner hodene før `devVerktoy` flytter kameraet, så
 * uten dette sto skiltene der gutten ser, ikke der bildet er tatt fra (bare i dev).
 */
export function fotoSystem(): Spillsystem {
    return {
        navn: 'foto',
        bilde: (_dt, kamera) => {
            const foto = (window as Dev).__bryggenFoto;
            if (!foto) return;
            kamera.position.fromArray(foto.pos);
            kamera.lookAt(foto.look[0], foto.look[1], foto.look[2]);
            kamera.updateMatrixWorld();
        },
    };
}

/** Startpunkter for `?sted=` (verdensrom, føttene) og retningen gutten ser. Målt i spillet 03.10.2026. */
const DEV_STEDER: Record<string, { pos: [number, number, number]; yaw: number; baat?: [number, number, number] }> = {
    loft: { pos: [-5.5, 3.6, 9.5], yaw: 0 },
    hans: { pos: [-140.8, 0, 16.9], yaw: 0 },
    detmar: { pos: [-178.3, 0, 16.6], yaw: -Math.PI / 2 },
    bard: { pos: [-23.4, 0, 0.9], yaw: -2.57 },
    ottar: { pos: [6.1, 0, 3.1], yaw: Math.PI },
    // Foran kornselgeren Torstein på torget i Nikolaikirkeallmenningen (rykte-samtaler.ts).
    torg: { pos: [11.6, 0, 19.6], yaw: -Math.PI / 2 },
    kirke: { pos: [100.6, 2.05, 105.4], yaw: 0.15 },
    alter: { pos: [95.8, 2.05, 100.6], yaw: -0.54 },
    olstua: { pos: [38.2, 2.2, 74.0], yaw: 0.88 },
    // Holmen (byen-oppdrag.ts): kaienden, foran porten, langs ringmuren bak vakta, bak vaktbua, ved gjaldkeren, ved lagerhusene.
    holmenveien: { pos: [131.5, 0.3, 3.4], yaw: Math.PI / 2 },
    porten: { pos: [148.6, 0.3, 15.2], yaw: Math.PI / 2 },
    muren: { pos: [152.6, 0.3, 19.0], yaw: 0 },
    lytte: { pos: [150.4, 0.3, 26.2], yaw: -1.6 },
    borggard: { pos: [178.5, 0.9, 25.2], yaw: Math.PI / 2 },
    lagerhus: { pos: [138.0, 0.3, 24.0], yaw: 0 },
    // Stranden og Vågsbunnen (verden2): bryggen på Stranden (med færingen ved siden av), Gunnvor, Jonskirken, Skostredet.
    stranden: { pos: [-16.4, 0, -118.2], yaw: Math.PI, baat: [-19.6, -1.35, -118.0] },
    gunnvor: { pos: [-28.5, 0, -134.6], yaw: Math.PI },
    jonskirken: { pos: [-18, 0, -136.4], yaw: Math.PI },
    skostredet: { pos: [-128, 0, 15], yaw: -Math.PI / 2 },
    // Inn i husene på Stranden (heim.ts): foran døra til stua der Åsa vever, og foran naustet.
    stua: { pos: [-32.6, 0, -138.3], yaw: -Math.PI / 2 },
    naustet: { pos: [-37, 0, -122.6], yaw: Math.PI },
    // Stua bak verkstedene i Vågsbunnen (bolig.ts): foran den åpne døra.
    bolig: { pos: [-124.3, 0, 35.5], yaw: -Math.PI / 2 },
    aasa: { pos: [-37.3, 0.2, -138.95], yaw: -Math.PI / 2 },
    // Veien til fots (strandgaten.ts): foran bommen, bak den i gata, på kaia langs bunnen av Vågen, og på Strandgaten.
    bommen: { pos: [-178.8, 0, 15.5], yaw: -Math.PI / 2 },
    bakbommen: { pos: [-183.8, 0, 15], yaw: -Math.PI / 2 },
    vaagkaia: { pos: [-183.6, 0, -60], yaw: Math.PI },
    strandgaten: { pos: [-120, 0, -123], yaw: Math.PI / 2 },
    // Kontoret (kontor-steder.ts): schøtstua foran oldermannen, fiskestablene i bua, pulten, Sølve, vinsjen.
    schotstua: { pos: [3.6, 0.2, 53.0], yaw: Math.PI / 2 },
    bua: { pos: [-5.6, 0.2, 8.6], yaw: Math.PI },
    pult: { pos: [-3.4, 0.2, 7.6], yaw: Math.PI },
    solve: { pos: [2.4, 0, 2.9], yaw: Math.PI },
    vinsj: { pos: [-5.9, 0, 2.2], yaw: 0 },
    // Jobbene (kontor-jobber.ts): foran Hermen ved koggen, og foran Bård ved jekta.
    koggen: { pos: [23.2, 0, 2.6], yaw: Math.PI },
    // Kapittel 2 (kap2-data.ts): ved jekta (E spiller filmen), foran Volmer, og ved sekkene foran stua til Åsa.
    jekta: { pos: [-20.4, 0, 2.2], yaw: -1.9 },
    volmer: { pos: [22.6, 0, 2.9], yaw: Math.PI },
    sekkene: { pos: [-30.6, 0, -135.6], yaw: -2.2 },
    // Kapittel 3 (kap3-data.ts): foran Asbjørn og buntene på kaia (pulten i bua er `pult`).
    asbjorn: { pos: [-6.4, 0, 2.0], yaw: -Math.PI / 2 },
};

/** `?sted=`: flytt startpunktet før cellene rundt det lastes (bare i dev). */
export function devStart(layout: { playerStart: THREE.Vector3; playerYaw: number; boatStart?: THREE.Vector3 }): void {
    const s = DEV_STEDER[new URLSearchParams(location.search).get('sted') ?? ''];
    if (!s) return;
    layout.playerStart.fromArray(s.pos);
    layout.playerYaw = s.yaw;
    if (s.baat) layout.boatStart?.fromArray(s.baat); // færingen følger med (Stranden)
}

/** `?oppdrag=` og `?hendelse=`: ta oppdrag og send hendelser når spillet er klart (bare i dev). */
export function devOppdrag(oppdrag: Oppdrag): void {
    const q = new URLSearchParams(location.search);
    for (const id of (q.get('oppdrag') ?? '').split(',').filter(Boolean)) oppdrag.devTa(id);
    for (const h of (q.get('hendelse') ?? '').split(',').filter(Boolean)) oppdrag.hendelse(h);
}
