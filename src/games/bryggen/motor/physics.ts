// Fysikk-laget i Bryggen-motoren. Tynn innpakning rundt Rapier: statisk verden av bokser
// og ramper, og spørringer (stråle og formkast) som karakter, kamera og kamp deler.
//
// Kollisjonsgrupper: alt statisk ligger i WORLD. Figurer ligger i ACTOR. Kameraet og
// kant-sjekken spør bare mot WORLD, så de aldri «treffer» spilleren selv eller fienden.
import * as THREE from 'three';
import type RAPIER_NS from '@dimforge/rapier3d-compat';

export type Rapier = typeof RAPIER_NS;

const WORLD = 0x0001;
const ACTOR = 0x0002;
const BOAT = 0x0004;
/** Tynne ting (stolper, rekkverk, tønner): figurer og båter stopper, kameraet ikke. */
const PROP = 0x0008;

/** Rapier-grupper: høye 16 bit = medlemskap, lave 16 bit = hva den kolliderer med. */
const groups = (member: number, filter: number) => (member << 16) | filter;
export const GROUP_WORLD = groups(WORLD, WORLD | ACTOR | BOAT);
export const GROUP_PROP = groups(PROP, ACTOR | BOAT);
export const GROUP_ACTOR = groups(ACTOR, WORLD | ACTOR | PROP);
export const GROUP_BOAT = groups(BOAT, WORLD | PROP);
/** Brukes av spørringer som bare skal se den statiske verden. */
export const QUERY_WORLD = groups(0xffff, WORLD);
/** Kant-sjekk for klatring: verden og tynne ting (man kan klatre på en tønne). */
export const QUERY_SOLID = groups(0xffff, WORLD | PROP);

let rapierPromise: Promise<Rapier> | null = null;
export function loadRapier(): Promise<Rapier> {
    if (!rapierPromise) {
        rapierPromise = import('@dimforge/rapier3d-compat').then(async (mod) => {
            const R = (mod as unknown as { default?: Rapier }).default ?? (mod as unknown as Rapier);
            await R.init();
            return R;
        });
    }
    return rapierPromise;
}

export interface WorldHit {
    distance: number;
    point: THREE.Vector3;
    normal: THREE.Vector3;
}

export class Physics {
    readonly R: Rapier;
    readonly world: RAPIER_NS.World;
    private readonly ray: RAPIER_NS.Ray;

    constructor(R: Rapier) {
        this.R = R;
        this.world = new R.World({ x: 0, y: -9.81, z: 0 });
        this.world.timestep = 1 / 60;
        this.ray = new R.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
    }

    /** Statisk boks. `center` og `half` i meter. */
    addBox(center: THREE.Vector3, half: THREE.Vector3, rot?: THREE.Euler, prop = false): RAPIER_NS.Collider {
        const q = new THREE.Quaternion().setFromEuler(rot ?? new THREE.Euler());
        const desc = this.R.ColliderDesc.cuboid(half.x, half.y, half.z)
            .setTranslation(center.x, center.y, center.z)
            .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
            .setCollisionGroups(prop ? GROUP_PROP : GROUP_WORLD)
            .setFriction(0.8);
        return this.world.createCollider(desc);
    }

    step(): void {
        this.world.step();
    }

    /** Stråle mot den statiske verden. Returnerer null ved bom. */
    rayWorld(origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number, includeProps = false): WorldHit | null {
        this.ray.origin = { x: origin.x, y: origin.y, z: origin.z };
        this.ray.dir = { x: dir.x, y: dir.y, z: dir.z };
        const hit = this.world.castRayAndGetNormal(
            this.ray, maxDist, true, undefined, includeProps ? QUERY_SOLID : QUERY_WORLD
        );
        if (!hit) return null;
        const t = hit.timeOfImpact;
        return {
            distance: t,
            point: new THREE.Vector3(origin.x + dir.x * t, origin.y + dir.y * t, origin.z + dir.z * t),
            normal: new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z),
        };
    }

    /**
     * Kaster en kule langs `dir` mot den statiske verden. Avstanden er hvor langt kula
     * kan flytte seg før den rører noe. Kameraet bruker denne i stedet for en tynn stråle:
     * en stråle slipper gjennom glipen mellom to vegger, en kule gjør det ikke.
     */
    sphereCastWorld(origin: THREE.Vector3, dir: THREE.Vector3, radius: number, maxDist: number): number {
        const ball = new this.R.Ball(radius);
        const hit = this.world.castShape(
            { x: origin.x, y: origin.y, z: origin.z },
            { x: 0, y: 0, z: 0, w: 1 },
            { x: dir.x, y: dir.y, z: dir.z },
            ball,
            0,
            maxDist,
            true,
            undefined,
            QUERY_WORLD
        );
        return hit ? hit.time_of_impact : maxDist;
    }

    /** Er det plass til en kapsel her (brukes før klatring og ilandstigning)? */
    capsuleFits(center: THREE.Vector3, halfHeight: number, radius: number): boolean {
        const shape = new this.R.Capsule(halfHeight, radius);
        let blocked = false;
        this.world.intersectionsWithShape(
            { x: center.x, y: center.y, z: center.z },
            { x: 0, y: 0, z: 0, w: 1 },
            shape,
            () => {
                blocked = true;
                return false;
            },
            undefined,
            QUERY_SOLID
        );
        return !blocked;
    }
}
