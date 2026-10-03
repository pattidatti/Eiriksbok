// Lysestaken ved oldermannen i schøtstua: en høy stake av jern på tre bein, med et talglys øverst.
// Flammen lyser selv (eget materiale uten lys), så man ser hvor oldermannen står også i mørket.
// Den lyser ikke opp noe rundt seg: ildlyset er ett lys for hele byen (bryggen.ts), og lys i
// cellene tvinger Three til å bygge shaderne på nytt.
//
// Talglys på jernstake er vårt valg for spillet [S]. Hva slags lys schøtstuene hadde i 1420-årene,
// har vi ikke funnet i kildene [K]. Det er heller ikke beskrevet at oldermannen sto ved en stake.
import * as THREE from 'three';
import { MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import { toGroup } from './gard';
import { flamme } from './mariakirken-inne';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Høyden på flammen over golvet staken står på. */
export const LYS_H = 1.55;

/** Staken med lys og flamme, med foten i `p` (verdensrom). Kalleren eier `dispose`. */
export function lysestake(mats: Materials, p: THREE.Vector3): { group: THREE.Group; dispose: () => void } {
    const k = new MeshKit();
    const kl = new MeshKit();
    const kf = new MeshKit();
    const topp = LYS_H - 0.3;
    k.withTint({ top: 0.35, bottom: 0.35 }, () => {
        // Tre bein som spriker ut fra en ring, og stanga opp.
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            k.log('mork', V(Math.cos(a) * 0.22, 0.01, Math.sin(a) * 0.22), V(0, 0.2, 0), 0.014, 5);
        }
        k.log('mork', V(0, 0.18, 0), V(0, topp, 0), 0.016, 6);
        // Skåla som fanger talgen som renner.
        k.log('mork', V(0, topp, 0), V(0, topp + 0.03, 0), 0.075, 9, true, 0.085);
    });
    // Talglyset: tykt og gulhvitt, litt nedbrent.
    kl.withTint({ top: 0.95, bottom: 0.95, hue: [0.96, 0.9, 0.72] }, () => kl.log('mork', V(0, topp + 0.03, 0), V(0, topp + 0.22, 0), 0.032, 7, true));
    flamme(kf, V(0, topp + 0.29, 0));

    const group = toGroup(k, mats, 'kontor:stake');
    const voks = new THREE.Mesh(kl.bucket('mork').toGeometry(), mats.lodMaterial());
    voks.name = 'kontor:talglys';
    const flammeMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const fl = new THREE.Mesh(kf.bucket('mork').toGeometry(), flammeMat);
    fl.name = 'kontor:flamme';
    group.add(voks, fl);
    group.position.copy(p);
    return {
        group,
        dispose: () => {
            group.traverse((o) => {
                if (o instanceof THREE.Mesh) o.geometry.dispose();
            });
            flammeMat.dispose();
        },
    };
}
