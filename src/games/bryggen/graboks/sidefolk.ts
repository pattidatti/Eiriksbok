// Folk som bare sideoppdragene trenger, i en egen liten celle (strømmes som de andre): Bård,
// Ottars bror, på kaia ved jekta vest for gården (skip.ts: `jekt-kai` ligger ved x -25).
// Hjelpere som de andre sideoppdrag-systemene bruker, står også her.
//
// Bård er laget for spillet [S] («Jekta kommer», sideoppdrag.ts).
import * as THREE from 'three';
import type { BryggenWorld } from '../bygg/bryggen';
import type { Snakkbar } from '../motor/streaming';
import type { Plass } from '../bygg/folk';
import type { SpillKontekst, Spillsystem } from './system';
import type { Oppdrag } from './oppdrag';
import { EPOKE } from '../bygg/epoke';

/** Personen med denne id-en i cellene som er lastet, eller null. */
export function finnPerson(world: BryggenWorld, id: string): Snakkbar | null {
    for (const s of world.streamer.snakkbare()) if (s.id === id) return s;
    return null;
}

/** Står `p` innen `r` meter fra `mal` (vannrett), og omtrent på samme høyde? */
export function naer(p: THREE.Vector3, mal: THREE.Vector3, r: number, dy = 1.2): boolean {
    return Math.hypot(p.x - mal.x, p.z - mal.z) < r && Math.abs(p.y - mal.y) < dy;
}

/** Er mål nummer `i` i oppdraget `id` nådd (oppdraget aktivt eller klart)? Leser oppdragslista. */
export function maalNaadd(oppdrag: Oppdrag, id: string, i: number): boolean {
    return oppdrag.hud().find((o) => o.id === id)?.linjer[i]?.ferdig ?? false;
}

/** Hvor Bård står: på kaikanten foran jekta, med ryggen halvveis mot sjøen. */
const BARD = new THREE.Vector3(-24.2, 0, -0.35);

export function lagSidefolk(k: SpillKontekst): Spillsystem {
    const plasser: Plass[] = [{ figur: 'fisker', rolle: 'staa', pos: BARD.clone(), yaw: 0.5, id: 'bard' }];
    k.world.streamer.leggTil({
        id: 'sidefolk-jekt',
        center: new THREE.Vector2(BARD.x, BARD.z),
        half: new THREE.Vector2(2, 2),
        build: async () => {
            const { lagFolk } = await import('../bygg/folk');
            const folk = await lagFolk(EPOKE.aar !== null ? [] : plasser, k.world.materials, 1349);
            return {
                near: folk.group,
                colliders: folk.colliders,
                snakkbare: folk.snakkbare,
                gaaende: folk.gaaende,
                tick: folk.tick,
                dispose: folk.dispose,
            };
        },
    });
    return { navn: 'sidefolk' };
}
