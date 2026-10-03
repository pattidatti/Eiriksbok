// Veien til fots mellom Vågsbunnen og Stranden: forbi bommen over Skostredet, et stykke vestover i gata,
// sørover på kaia langs bunnen av Vågen, og østover på Strandgaten langs sjøen til den gåbare biten på
// Stranden (strandliv.ts). Bommen eies av graboks/bommen.ts: Detmar løfter den når byfolket kjenner gutten.
//
// Det vi vet: Vågsbunnen er den innerste enden av Vågen, og byen gikk rundt den fra Bryggen over til
// Strandsiden [V Byleksikon «Vågsbunnen», «Strandsiden»]. At skomakerne kunne sperre Skostredet, står i
// vaagsbunnen.ts [V]. Hvordan veien rundt Vågen så ut i 1420-årene, er ikke funnet [K]: kaia langs
// bunnen, plankene og gjerdene her er laget for spillet [S].
//
// Kulissene (endeCelle i vaagsbunnen.ts og stranden.ts) har ingen kollidere. Denne cella gir bakken
// under veien og grensene langs den: husveggene og gjerdene på landsida, kaikanten mot sjøen. Mot
// Vågen står grensene i bryggen.ts. Husene på Stranden vest for den gåbare biten står `VEI` lenger
// inne, så Strandgaten får plass (stranden.ts).
import * as THREE from 'three';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellDef } from '../motor/streaming';
import { kai, toGroup, tonne } from './gard';
import { STRAND_Z, VEI } from './stranden';
import { GATE } from './vaagsbunnen';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Bolverket på Stranden (strandliv.ts bruker samme front). */
const SZ = -121;
/** Kaia langs Strandgaten er så dyp, og gjerdet mot hagene står bak gjørma. */
const KAI_D = 3.2;
const GJERDE_Z = STRAND_Z - VEI + 0.4;
/** Hvor kaia langs bunnen av Vågen slutter innover: husfrontene står 3 m fra kanten. */
const INN = 3.4;
/** Hvor langt vest gata bak bommen kan gås, før huset på tvers stenger. */
const GATE_V = 14.5;

/** Strekninger i verden, til grensene og testene. `xw` er vestenden av byen (der Vågen slutter). */
export function strandgatenMaal(xw: number, strandX0: number) {
    return {
        gate: { x0: xw - GATE_V, x1: xw, z0: GATE.sjo - 0.5, z1: GATE.land + 0.5 },
        kaiVaag: { x0: xw - INN, x1: xw, z0: SZ - KAI_D, z1: GATE.sjo - 0.5 },
        strand: { x0: xw - INN, x1: strandX0, z0: GJERDE_Z, z1: SZ },
    };
}

/** Kollidere i et dreid rom (ColliderKit har ingen `at`). */
function cAt(c: ColliderKit, x: number, z: number, rot: number, fn: () => void): void {
    const for_ = c.matrix;
    c.matrix = new THREE.Matrix4().makeRotationY(rot).setPosition(x, 0, z);
    fn();
    c.matrix = for_;
}

/**
 * Et gjerde fra `a` til `b` (verden): stolper med to rekker stokker, så hagene bak synes. Kollideren går
 * høyt nok til at gutten ikke klatrer over.
 */
function gjerde(k: MeshKit, c: ColliderKit, a: THREE.Vector3, b: THREE.Vector3, h = 1.15): void {
    const d = b.clone().sub(a);
    const len = d.length();
    const rot = Math.atan2(d.x, d.z);
    const m = a.clone().add(b).multiplyScalar(0.5);
    k.at(m.x, 0, m.z, rot, () => {
        k.withTint({ top: 0.95, bottom: 0.7, hue: [1, 0.96, 0.9] }, () => {
            for (let z = -len / 2; z <= len / 2 + 0.01; z += 2.2) k.log('raatre', V(0, -0.05, z), V(0, h + 0.1, z), 0.07, 5, true);
        });
        k.withTint({ top: 0.85, bottom: 0.85, hue: [1.02, 0.97, 0.9] }, () => {
            for (const y of [h * 0.45, h * 0.92]) k.log('raatre', V(0.08, y, -len / 2), V(0.08, y, len / 2), 0.055, 5, false);
        });
    });
    cAt(c, m.x, m.z, rot, () => c.box(0, 2, 0, 0.3, 4, len + 0.3));
}

/** En usynlig vegg fra `a` til `b`: husfronter i kulissen, som ikke har kollidere. */
function vegg(c: ColliderKit, a: THREE.Vector3, b: THREE.Vector3): void {
    const d = b.clone().sub(a);
    const m = a.clone().add(b).multiplyScalar(0.5);
    cAt(c, m.x, m.z, Math.atan2(d.x, d.z), () => c.box(0, 3, 0, 0.3, 6, d.length() + 0.3));
}

/**
 * Cella med veien. `xw` er vestenden av byen (x der Vågen slutter), `strandX0` den vestre enden av den
 * gåbare biten på Stranden.
 */
export function strandgatenCelle(mats: Materials, xw: number, strandX0: number): CellDef {
    const M = strandgatenMaal(xw, strandX0);
    const x0 = xw - 22;
    return {
        id: 'strandgaten',
        center: new THREE.Vector2((x0 + strandX0) / 2, (GJERDE_Z + GATE.land + 2) / 2),
        half: new THREE.Vector2((strandX0 - x0) / 2, (GATE.land + 2 - GJERDE_Z) / 2),
        naerR: 70,
        build: async () => {
            const k = new MeshKit();
            const c = new ColliderKit();
            // ── Strandgaten: kai langs sjøen, gjørme bak, gjerde mot hagene. ──
            const s = M.strand;
            const xm = (x0 + s.x1) / 2;
            const L = s.x1 - x0;
            // Kaia vender mot Vågen (+z), som bolverket på Stranden.
            k.at(xm, 0, SZ, Math.PI, () => kai(k, c, -L / 2, L / 2, 0, KAI_D), c);
            k.withTint({ top: 0.85, bottom: 0.85 }, () =>
                k.box('gjorme', xm, -0.1, (SZ - KAI_D + GJERDE_Z) / 2 - 0.3, L, 0.2, SZ - KAI_D - GJERDE_Z + 0.6, { skip: ['bottom'] })
            );
            c.box(xm, -0.75, (SZ - KAI_D + GJERDE_Z) / 2, L, 1.5, SZ - KAI_D - GJERDE_Z);
            // En plankevei oppå gjørma, og tønner og en kjerre her og der.
            k.withTint({ top: 0.8, bottom: 0.8 }, () => k.box('gardsrom', (s.x0 + s.x1) / 2, 0.0, SZ - KAI_D - 1.2, s.x1 - s.x0, 0.08, 1.6, { skip: ['bottom'], grain: 'x' }));
            for (let x = s.x0 + 12; x < s.x1 - 8; x += 23) {
                tonne(k, c, x, GJERDE_Z + 0.6, 0.8);
                tonne(k, c, x + 0.75, GJERDE_Z + 0.75, 0.9);
            }
            gjerde(k, c, V(s.x0, 0, GJERDE_Z), V(s.x1, 0, GJERDE_Z));
            // Kaikanten mot sjøen: en stokk på knehøyde, så gutten ikke går rett i Vågen.
            k.withTint({ top: 0.7, bottom: 0.7 }, () => {
                k.log('raatre', V(s.x0, 0.55, SZ - 0.15), V(s.x1, 0.55, SZ - 0.15), 0.07, 6, false);
                for (let x = s.x0 + 1; x < s.x1; x += 3) k.log('raatre', V(x, 0, SZ - 0.15), V(x, 0.6, SZ - 0.15), 0.07, 6, true);
            });
            c.box((s.x0 + s.x1) / 2, 0.5, SZ - 0.15, s.x1 - s.x0, 1.0, 0.2, true);
            // Vest for hjørnet: bare bakke (gjerdet og kaia langs bunnen av Vågen stenger).
            vegg(c, V(s.x0, 0, GJERDE_Z), V(s.x0, 0, SZ - KAI_D + 0.2));

            // ── Kaia langs bunnen av Vågen ── Kulissen (endeCelle) har kaia og husene, men ikke kollidere.
            const kv = M.kaiVaag;
            c.box((kv.x0 + kv.x1) / 2, -0.75, (kv.z0 + kv.z1) / 2, kv.x1 - kv.x0, 1.5, kv.z1 - kv.z0);
            vegg(c, V(kv.x0, 0, SZ - KAI_D), V(kv.x0, 0, kv.z1));
            // Der husrekka ikke står (nord for den, mot hjørnet ved gata): et gjerde.
            gjerde(k, c, V(kv.x0 - 0.1, 0, -5.2), V(kv.x0 - 0.1, 0, GATE.sjo - 6.6));

            // ── Gata bak bommen ── fram til huset på tvers.
            const g = M.gate;
            c.box((g.x0 + g.x1) / 2, -0.75, (g.z0 + g.z1) / 2, g.x1 - g.x0, 1.5, g.z1 - g.z0);
            vegg(c, V(g.x0, 0, g.z1), V(g.x1, 0, g.z1));
            vegg(c, V(g.x0, 0, g.z0), V(kv.x0, 0, g.z0));
            vegg(c, V(g.x0, 0, g.z0), V(g.x0, 0, g.z1));

            const near = toGroup(k, mats, 'strandgaten');
            return {
                near,
                colliders: c.specs,
                dispose: () =>
                    near.traverse((o) => {
                        if (o instanceof THREE.Mesh) o.geometry.dispose();
                    }),
            };
        },
    };
}
