// Seilet som heises og fires: duken rulles ut nedover fra råa når seilet settes, og samles opp mot
// råa igjen når det fires, før det beslås (rullet og surret på råa). Brukes av skipene som seiler
// (trafikk.ts) og jekta ved kaia, som henger seilet opp til tørk når det er opphold (skip.ts).
//
// Råseilet på kogger og jekter ble heist og firt med råa og beslått på den [K]. At mannskapet hengte
// seilet opp til tørk ved kaia, er valgt for spillet [S].
import * as THREE from 'three';
import { MeshKit, type Tint } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import { raa, seilSatt } from '../motor/skrog';
import { toGroup } from './gard';

export interface Raa {
    z: number;
    y: number;
    halv: number;
    bunn: number;
    seilR: number;
}

export class SeilHeis {
    readonly group = new THREE.Group();
    private readonly satt: THREE.Object3D;
    private readonly beslatt: THREE.Object3D;
    private readonly pivot = new THREE.Group();
    /** 0: beslått, 1: satt helt ned. */
    s: number;

    constructor(mats: Materials, navn: string, ra: Raa, tint: Tint, start = 0) {
        const ks = new MeshKit();
        seilSatt(ks, ra.z, ra.y, ra.halv, ra.bunn, ra.halv * 0.16, tint);
        const kb = new MeshKit();
        raa(kb, ra.z, ra.y - 0.4, ra.halv, tint, ra.seilR);
        this.satt = toGroup(ks, mats, `${navn}:seil`);
        this.beslatt = toGroup(kb, mats, `${navn}:beslatt`);
        // Duken henger fra råa: skaleres i høyden rundt råa, så den rulles ut nedover.
        this.pivot.position.set(0, ra.y, ra.z);
        this.satt.position.set(0, -ra.y, -ra.z);
        this.pivot.add(this.satt);
        this.group.add(this.pivot, this.beslatt);
        this.s = start;
        this.vis();
    }

    /** Mot `maal` (0 eller 1) med `fart` per sekund. */
    mot(maal: number, dt: number, fart = 0.25): void {
        this.s += THREE.MathUtils.clamp(maal - this.s, -dt * fart, dt * fart);
        this.vis();
    }

    private vis(): void {
        const s = this.s;
        this.satt.visible = s > 0.06;
        this.beslatt.visible = s < 0.12;
        // Myk start og slutt, og duken buker først når den er nesten helt ute.
        const e = THREE.MathUtils.smoothstep(s, 0, 1);
        this.pivot.scale.set(1, Math.max(0.04, e), Math.max(0.15, e * e));
    }
}
