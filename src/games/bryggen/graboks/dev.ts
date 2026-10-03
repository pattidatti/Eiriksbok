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
    __bryggenFolk?: () => { navn: string; pos: number[]; yaw: number }[];
}

export function devVerktoy(scene: THREE.Scene, gutt: Character | undefined): { pos: number[]; look: number[] } | undefined {
    const dev = window as Dev;
    if (gutt) dev.__bryggenPos = gutt.pos.toArray();
    if (!dev.__bryggenFolk) dev.__bryggenFolk = () => folkListe(scene);
    return dev.__bryggenFoto;
}

/** Folkene i scenen (figur-meshene heter `figur:<drakt>`). */
function folkListe(scene: THREE.Scene): { navn: string; pos: number[]; yaw: number }[] {
    const ut: { navn: string; pos: number[]; yaw: number }[] = [];
    const q = new THREE.Quaternion();
    scene.traverse((g) => {
        if (g.name !== 'folk') return;
        for (const root of g.children) {
            let navn = '';
            root.traverse((o) => {
                if (o.name.startsWith('figur:')) navn = o.name.slice(6);
            });
            root.getWorldQuaternion(q);
            const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
            ut.push({ navn, pos: root.getWorldPosition(new THREE.Vector3()).toArray(), yaw: Math.atan2(fwd.x, fwd.z) });
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
const DEV_STEDER: Record<string, { pos: [number, number, number]; yaw: number }> = {
    loft: { pos: [-5.5, 3.6, 9.5], yaw: 0 },
    hans: { pos: [-140.8, 0, 16.9], yaw: 0 },
    detmar: { pos: [-178.3, 0, 16.6], yaw: -Math.PI / 2 },
    bard: { pos: [-23.4, 0, 0.9], yaw: -2.57 },
    ottar: { pos: [6.1, 0, 3.1], yaw: Math.PI },
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
};

/** `?sted=`: flytt startpunktet før cellene rundt det lastes (bare i dev). */
export function devStart(layout: { playerStart: THREE.Vector3; playerYaw: number }): void {
    const s = DEV_STEDER[new URLSearchParams(location.search).get('sted') ?? ''];
    if (!s) return;
    layout.playerStart.fromArray(s.pos);
    layout.playerYaw = s.yaw;
}

/** `?oppdrag=` og `?hendelse=`: ta oppdrag og send hendelser når spillet er klart (bare i dev). */
export function devOppdrag(oppdrag: Oppdrag): void {
    const q = new URLSearchParams(location.search);
    for (const id of (q.get('oppdrag') ?? '').split(',').filter(Boolean)) oppdrag.devTa(id);
    for (const h of (q.get('hendelse') ?? '').split(',').filter(Boolean)) oppdrag.hendelse(h);
}
