// Utviklerverktøy for Bryggen (bare i dev, kalt hvert bilde fra game.ts).
//
// - `window.__bryggenFoto = { pos: [x, y, z], look: [x, y, z] }` låser kameraet (skjermbilder og
//   måling fra Vågen). Funksjonen gir det tilbake, så løkka kan sette kameraet.
// - `window.__bryggenPos` er der gutten står (til testskript).
// - `window.__bryggenFolk()` gir folkene i de lastede cellene (drakt, posisjon, retning).
import * as THREE from 'three';
import type { Character } from '../motor/character';
import type { Spillsystem } from './system';

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
