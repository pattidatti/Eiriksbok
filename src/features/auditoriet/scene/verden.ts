// Rommene eleven kan gå i. Spiller.tsx tar et av disse.

import * as THREE from 'three';
import {
    BAKVEGG_Z,
    HALV_BREDDE,
    OPPTATT,
    SCENE_KANT_Z,
    SETER,
    START_POS,
    gulvVed,
    type Sete,
} from './salGeometri';

/** Rommet eleven går i. Salen er standard; gangen på universitetet har sin egen. */
export interface Verden {
    grenser: { xMin: number; xMax: number; zMin: number; zMax: number };
    gulv: (z: number) => number;
    seter: Sete[];
    opptatt: Set<number>;
    start: [number, number];
    /** Punktet blikket låses mot når eleven sitter, og som introen ser mot. */
    blikk: THREE.Vector3;
}

export const SAL_VERDEN: Verden = {
    grenser: { xMin: -HALV_BREDDE + 0.4, xMax: HALV_BREDDE - 0.4, zMin: SCENE_KANT_Z + 0.4, zMax: BAKVEGG_Z - 0.4 },
    gulv: gulvVed,
    seter: SETER,
    opptatt: OPPTATT,
    start: START_POS,
    // Mellom foreleseren og lerretet.
    blikk: new THREE.Vector3(-1.2, 3.1, -7.6),
};

