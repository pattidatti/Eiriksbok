// Kartet er større enn bildet: kameraet følger rytteren, og det meste av brettet ligger utenfor.
// Tun, fogdgårder og utgangen tegnes derfor bare når de er i (eller like ved) kamerautsnittet.
// Det sparer tegning på Chromebook, og scene-auditen ser bare det eleven faktisk ser.

import * as THREE from 'three';

const FR = new THREE.Frustum();
const PM = new THREE.Matrix4();
const KULE = new THREE.Sphere();

/** Er en kule rundt (x, y, z) med radius r innenfor kameraets utsnitt? */
export function iBildet(cam: THREE.Camera, x: number, z: number, r: number, y = 1): boolean {
    cam.updateMatrixWorld();
    PM.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    FR.setFromProjectionMatrix(PM);
    KULE.center.set(x, y, z);
    KULE.radius = r;
    return FR.intersectsSphere(KULE);
}

/**
 * Skrur meshene under `rot` av (utenfor bildet) eller på igjen. Bare mesher som denne
 * funksjonen selv slo av, slås på igjen, så egen synlighetslogikk (seglet, bølgen) får være.
 * Kall den med `inne = true` før egen logikk i useFrame, og med samme verdi etterpå.
 */
export function kull(rot: THREE.Object3D | null, inne: boolean) {
    if (!rot) return;
    rot.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return;
        if (inne) {
            if (o.userData.kullet) {
                o.visible = true;
                o.userData.kullet = false;
            }
        } else if (o.visible) {
            o.visible = false;
            o.userData.kullet = true;
        }
    });
}
