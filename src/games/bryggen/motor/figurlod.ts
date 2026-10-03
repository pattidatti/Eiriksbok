// Nivåene til figurene: fin geometri med skygge nær kameraet, grov uten skygge lenger unna, og
// frustum-culling for figurer som flytter seg (blueprint §9.5, README «Regler»).
import * as THREE from 'three';
import { GROV } from './figur';

/** Bak denne avstanden fra kameraet: grov geometri og ingen skygge (§9.5). */
export const GROV_R = 13;

/**
 * Nivået til én figur: fin geometri med skygge nær kameraet, grov uten skygge bak `GROV_R`.
 * Brukes av folk (folk.ts) og roerne i færingene (trafikk.ts). `sett` kalles hvert bilde med
 * avstanden til kameraet.
 */
export class FigurLod {
    private readonly mesh: THREE.Mesh | null = null;
    private readonly fin: THREE.BufferGeometry | null = null;
    private readonly grov: THREE.BufferGeometry | undefined;
    constructor(model: THREE.Object3D) {
        let mesh: THREE.Mesh | null = null;
        model.traverse((o) => {
            if (o.name.startsWith('figur:')) mesh = o as THREE.Mesh;
        });
        this.mesh = mesh;
        this.fin = this.mesh ? (this.mesh as THREE.Mesh).geometry : null;
        this.grov = this.fin ? GROV.get(this.fin) : undefined;
    }
    sett(d: number, skygge = true): void {
        if (!this.mesh || !this.fin || !this.grov) return;
        const langt = d > GROV_R;
        this.mesh.geometry = langt ? this.grov : this.fin;
        this.mesh.castShadow = skygge && !langt;
    }
}

/**
 * Slår på frustum-culling for en figur som flytter seg eller bøyer seg mye (roer, vandrer): kula
 * regnes fra stillingen nå og gjøres litt større, så armene ikke stikker ut av den. Uten culling
 * ble alle figurene i Vågen tegnet (og kastet skygge) også bak kameraet.
 */
export function cullFigur(model: THREE.Object3D, ekstra = 1.3): void {
    model.updateMatrixWorld(true);
    model.traverse((o) => {
        const m = o as THREE.SkinnedMesh;
        if (!m.isMesh) return;
        m.frustumCulled = true;
        if (m.isSkinnedMesh) {
            m.computeBoundingSphere();
            if (m.boundingSphere) m.boundingSphere.radius *= ekstra;
        }
    });
}
