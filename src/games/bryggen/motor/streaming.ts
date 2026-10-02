// Strømming per celle (blueprint §9.6).
//
// Byen er delt i celler på ca. 60×60 m. En celle bygges (med `import()` av byggekoden) når
// spilleren kommer innen LOAD_R, og kastes når hen er lenger unna enn DROP_R. Avstanden mellom
// de to hindrer at en celle lastes og kastes om og om igjen ved grensa.
//
// Hver celle har to nivåer:
//  - nær: full geometri med PBR, og kollidere i Rapier
//  - middels: sammenslåtte bokser med flat farge, ingen tekstur (vises bak NEAR_R)
// Tåka skjuler resten, så det trengs ikke et tredje nivå ennå.
//
// Kollidere finnes bare for celler som er lastet. Når cellen kastes, fjernes Rapier-kroppene
// og geometrien. Materialene deles og blir liggende (se materials.ts).
import * as THREE from 'three';
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import type { Physics } from './physics';
import type { ColliderSpec } from './meshkit';

export const LOAD_R = 120;
export const DROP_R = 180;
/** Bak denne avstanden vises middels-nivået i stedet for full geometri. */
export const NEAR_R = 70;

export interface CellContent {
    near: THREE.Object3D;
    mid?: THREE.Object3D;
    colliders: ColliderSpec[];
}

export interface CellDef {
    id: string;
    /** Midten av cella i xz (meter). Avstand måles til nærmeste punkt i rektangelet. */
    center: THREE.Vector2;
    half: THREE.Vector2;
    build: () => Promise<CellContent>;
}

interface LiveCell {
    def: CellDef;
    state: 'loading' | 'live';
    content?: CellContent;
    bodies: RAPIER_NS.Collider[];
    /** Satt når cella ble forlatt mens den lastet: kast den så fort den er ferdig. */
    dropped?: boolean;
}

export class CellStreamer {
    readonly root = new THREE.Group();
    private readonly live = new Map<string, LiveCell>();
    private readonly cells: CellDef[];
    private readonly phys: Physics;

    constructor(phys: Physics, cells: CellDef[]) {
        this.phys = phys;
        this.cells = cells;
        this.root.name = 'celler';
    }

    /** Avstand fra punktet til cellas rektangel (0 inne i cella). */
    private dist(def: CellDef, x: number, z: number): number {
        const dx = Math.max(0, Math.abs(x - def.center.x) - def.half.x);
        const dz = Math.max(0, Math.abs(z - def.center.y) - def.half.y);
        return Math.hypot(dx, dz);
    }

    /**
     * Kalles jevnlig med spillerens (eller kameraets) posisjon. Returnerer et løfte som er
     * ferdig når alle celler innen LOAD_R er lastet; ved oppstart ventes det på det.
     */
    update(focus: THREE.Vector3): Promise<void> {
        const jobs: Promise<void>[] = [];
        for (const def of this.cells) {
            const d = this.dist(def, focus.x, focus.z);
            const cell = this.live.get(def.id);
            if (!cell && d < LOAD_R) jobs.push(this.load(def));
            else if (cell && d > DROP_R) this.drop(cell);
            else if (cell?.state === 'live' && cell.content) {
                const near = d < NEAR_R || !cell.content.mid;
                cell.content.near.visible = near;
                if (cell.content.mid) cell.content.mid.visible = !near;
            }
        }
        return Promise.all(jobs).then(() => undefined);
    }

    private async load(def: CellDef): Promise<void> {
        const cell: LiveCell = { def, state: 'loading', bodies: [] };
        this.live.set(def.id, cell);
        const content = await def.build();
        if (cell.dropped) {
            disposeObject(content.near);
            if (content.mid) disposeObject(content.mid);
            return;
        }
        cell.content = content;
        cell.state = 'live';
        for (const spec of content.colliders) {
            const c = spec.kind === 'box'
                ? this.phys.addBox(spec.center, spec.half, spec.rot, spec.prop)
                : this.phys.addHull(spec.points, spec.prop);
            if (c) cell.bodies.push(c);
        }
        this.root.add(content.near);
        if (content.mid) {
            content.mid.visible = false;
            this.root.add(content.mid);
        }
    }

    private drop(cell: LiveCell): void {
        this.live.delete(cell.def.id);
        if (cell.state === 'loading') {
            cell.dropped = true;
            return;
        }
        for (const b of cell.bodies) this.phys.world.removeCollider(b, false);
        if (cell.content) {
            this.root.remove(cell.content.near);
            disposeObject(cell.content.near);
            if (cell.content.mid) {
                this.root.remove(cell.content.mid);
                disposeObject(cell.content.mid);
            }
        }
    }

    /** Til målerne: hvor mange celler er lastet nå. */
    get liveCount(): number {
        return this.live.size;
    }

    dispose(): void {
        for (const cell of [...this.live.values()]) this.drop(cell);
    }
}

/** Kaster geometrien i et tre. Materialene eies av Materials og røres ikke. */
export function disposeObject(o: THREE.Object3D): void {
    o.traverse((x) => {
        const m = x as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
    });
}
