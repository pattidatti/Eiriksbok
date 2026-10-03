// Bommen over Skostredet (vaagsbunnen.ts) som en ekte port på veien til fots mellom Vågsbunnen og Stranden
// (strandgaten.ts). Stokken ligger over gata og stenger den, til Detmar løfter den: han gjør det når
// byfolket kjenner gutten (svaret i samtalen hans er låst med rykte hos byfolket, rykte-samtaler.ts).
// Da settes flagget `bommen-aapen` (lagret), og stokken svinger opp og blir stående.
//
// [V] skomakerne kunne sperre gata (vaagsbunnen.ts). At bommen kan åpnes slik, er [S].
import * as THREE from 'three';
import { BOM } from '../bygg/vaagsbunnen';
import { MeshKit } from '../motor/meshkit';
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import type { SpillKontekst, Spillsystem } from './system';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Hvor høyt stokken svinger opp (radianer). */
const OPP = 1.25;

export function lagBommen(k: SpillKontekst): Spillsystem {
    const oppdrag = k.folk.oppdrag;
    const x = k.world.xw + 1.2;
    const len = BOM.z1 - BOM.z0;
    // Stokken: dreies rundt enden på sjøsiden, på toppen av bukken.
    const mk = new MeshKit();
    mk.withTint({ top: 0.7, bottom: 0.7, hue: [1.05, 0.98, 0.9] }, () => mk.log('raatre', V(0, 0, 0), V(0, 0, len), 0.13, 8, true));
    const g = new THREE.Group();
    g.name = 'bommen';
    for (const [key, b] of mk.buckets) {
        const m = new THREE.Mesh(b.toGeometry(), k.world.materials.get(key));
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
    }
    g.position.set(x, 0.95, BOM.z0);
    k.scene.add(g);

    let kollider: RAPIER_NS.Collider | null = null;
    const aapen = () => oppdrag.flagg.has('bommen-aapen');
    let vinkel = aapen() ? OPP : 0;
    let lydSpilt = aapen();

    function oppdaterKollider(): void {
        if (!aapen() && !kollider) kollider = k.phys.addBox(V(x, 0.8, (BOM.z0 + BOM.z1) / 2), V(0.25, 0.8, len / 2 + 0.6));
        if (aapen() && kollider) {
            k.phys.world.removeCollider(kollider, false);
            kollider = null;
        }
    }
    oppdaterKollider();

    return {
        navn: 'bommen',
        bilde(dt) {
            oppdaterKollider();
            const mal = aapen() ? OPP : 0;
            if (Math.abs(mal - vinkel) > 1e-3) {
                // En fjær med litt for lite demping: stokken går opp og vipper seg til ro.
                vinkel += (mal - vinkel) * Math.min(1, dt * 2.2);
                if (!lydSpilt && mal > 0) {
                    lydSpilt = true;
                    k.lyd?.lyd.spill('aare', 'knirk', { pos: g.position, ref: 3, styrke: 0.7 });
                }
            }
            g.rotation.x = -vinkel;
        },
        dispose() {
            k.scene.remove(g);
            g.traverse((o) => {
                if (o instanceof THREE.Mesh) o.geometry.dispose();
            });
            if (kollider) k.phys.world.removeCollider(kollider, false);
        },
    };
}
