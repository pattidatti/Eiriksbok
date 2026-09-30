import type { EKind, Kind } from './tuning';

// Fargene (fra kunstbriefen) og gråboks-figurene: hver figur er noen få bokser.
// Kunstfasen bytter disse ut; spillreglene vet ingenting om dem.

export const C = {
    papir: '#e6d9b8',
    mark: '#d9cba4',
    mark2: '#e1d4b0',
    vei: '#b7a57c',
    egen: '#5b6b3a',
    fiende: '#6f716c',
    sot: '#1a1a1a',
    fare: '#b3261e',
    radio: '#d9a21b',
    himmel: '#1d2b4f',
    røyk: '#8a8577',
};

export interface Part {
    pos: [number, number, number];
    size: [number, number, number];
    rot?: [number, number, number];
    color?: string;
}

const PLANE = (span: number, len: number): Part[] => [
    { pos: [0, 0, 0], size: [0.16, 0.14, len] },
    { pos: [0, 0, 0.05], size: [span, 0.05, 0.22] },
    { pos: [0, 0.08, -len / 2 + 0.06], size: [0.35, 0.04, 0.12] },
];

export const UNIT_SHAPE: Record<Kind, Part[]> = {
    inf: [
        { pos: [-0.2, 0.15, 0.05], size: [0.14, 0.3, 0.14] },
        { pos: [0.2, 0.15, 0.05], size: [0.14, 0.3, 0.14] },
        { pos: [0, 0.15, -0.18], size: [0.14, 0.3, 0.14] },
    ],
    vogn: [
        { pos: [0, 0.16, 0], size: [0.7, 0.28, 0.5] },
        { pos: [0, 0.38, 0], size: [0.34, 0.18, 0.3] },
        { pos: [0.38, 0.38, 0], size: [0.46, 0.06, 0.06] },
    ],
    pv: [
        { pos: [0, 0.12, 0], size: [0.3, 0.2, 0.3] },
        { pos: [0.1, 0.25, 0], size: [0.06, 0.3, 0.46] },
        { pos: [0.4, 0.26, 0], size: [0.6, 0.05, 0.05] },
    ],
    art: [
        { pos: [0, 0.14, 0], size: [0.44, 0.24, 0.4] },
        { pos: [0.3, 0.42, 0], size: [0.7, 0.07, 0.07], rot: [0, 0, 0.6] },
    ],
    lv: [
        { pos: [0, 0.12, 0], size: [0.46, 0.22, 0.46] },
        { pos: [0, 0.45, -0.08], size: [0.05, 0.5, 0.05], rot: [0.25, 0, 0] },
        { pos: [0, 0.45, 0.08], size: [0.05, 0.5, 0.05], rot: [-0.25, 0, 0] },
    ],
    jag: PLANE(0.9, 0.7),
    bomb: PLANE(1.5, 1),
};

export const ENEMY_SHAPE: Record<EKind, Part[]> = {
    einf: [
        { pos: [-0.12, 0.15, 0], size: [0.13, 0.3, 0.13] },
        { pos: [0.12, 0.15, 0.1], size: [0.13, 0.3, 0.13] },
    ],
    evogn: [
        { pos: [0, 0.16, 0], size: [0.7, 0.28, 0.5] },
        { pos: [0, 0.38, 0], size: [0.34, 0.18, 0.3] },
        { pos: [-0.38, 0.38, 0], size: [0.46, 0.06, 0.06], color: '#1a1a1a' },
    ],
    epak: [
        { pos: [0, 0.12, 0], size: [0.3, 0.2, 0.3] },
        { pos: [-0.1, 0.25, 0], size: [0.06, 0.3, 0.46], color: '#1a1a1a' },
        { pos: [-0.4, 0.26, 0], size: [0.6, 0.05, 0.05] },
    ],
    estuka: [...PLANE(1, 0.8), { pos: [0, -0.12, 0.1], size: [0.1, 0.12, 0.1], color: '#1a1a1a' }],
    ejag: PLANE(0.85, 0.7),
};
