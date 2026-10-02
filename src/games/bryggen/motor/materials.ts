// PBR-materialene til byen. Teksturene ligger i public/games/bryggen/textures/ (Poly Haven, CC0,
// se KILDE.md): farge, normal og ARM (AO, ruhet, metall i R, G, B).
//
// Materialene deles av alle hus og alle celler. Når en celle kastes, forsvinner bare
// geometrien; materialene og teksturene blir liggende til spillet avsluttes.
import * as THREE from 'three';
import type { MatKey } from './meshkit';

const BASE = '/games/bryggen/textures/';

interface MatDef {
    /** Filprefiks i teksturmappa. */
    file: string;
    /** Hvor mange meter én tekstur dekker (UV-ene er i meter). */
    tile: number;
    /** Farge-skjær oppå teksturen. */
    /** Fargefaktor (r, g, b) oppå teksturen. Over 1 lysner den. */
    color?: [number, number, number];
    normalScale?: number;
    /** Fargen huset har på middels avstand, der teksturene ikke lastes. */
    lodColor: number;
}

// Stokkene i laft-teksturen er ca. 0,24 m (10 per flis). Laftehodene i modulene følger samme mål.
export const LOG_H = 0.24;

const DEFS: Record<Exclude<MatKey, 'mork'>, MatDef> = {
    laft: { file: 'laft', tile: LOG_H * 10, color: [1.55, 1.45, 1.35], normalScale: 1.1, lodColor: 0x4a3c31 },
    bordvegg: { file: 'bordvegg', tile: 2.0, color: [1.45, 1.38, 1.3], lodColor: 0x4f4338 },
    bordtak: { file: 'bordtak', tile: 1.7, color: [1.1, 1.08, 1.05], lodColor: 0x55504a },
    torv: { file: 'torv', tile: 2.6, color: [0.95, 1.0, 0.88], normalScale: 1.4, lodColor: 0x5c5a33 },
    dekke: { file: 'dekke', tile: 2.2, color: [1.45, 1.4, 1.35], lodColor: 0x3f362f },
    gardsrom: { file: 'gardsrom', tile: 1.8, color: [0.82, 0.8, 0.78], lodColor: 0x4d3e30 },
    gjorme: { file: 'gjorme', tile: 3.2, color: [0.9, 0.86, 0.82], normalScale: 1.2, lodColor: 0x4a3b2c },
    raatre: { file: 'raatre', tile: 1.2, color: [0.95, 0.9, 0.85], lodColor: 0x5b544c },
};

export class Materials {
    private readonly loader = new THREE.TextureLoader();
    private readonly mats = new Map<MatKey, THREE.MeshStandardMaterial>();
    private readonly textures: THREE.Texture[] = [];
    private readonly anisotropy: number;
    /** Lav kvalitet: bare fargetekstur og ruhet. Sparer to teksturoppslag per piksel. */
    private readonly low: boolean;

    constructor(renderer: THREE.WebGLRenderer, opts: { low?: boolean } = {}) {
        this.low = !!opts.low;
        // 4 er nok til at plankene på bakken ikke blir grøt på skrå, og billig på Chromebook.
        this.anisotropy = this.low ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy());
    }

    /** Laster alle teksturene. Spillet venter på denne før første bilde. */
    async load(): Promise<void> {
        const jobs: Promise<void>[] = [];
        for (const [key, def] of Object.entries(DEFS) as [Exclude<MatKey, 'mork'>, MatDef][]) {
            jobs.push(this.make(key, def));
        }
        await Promise.all(jobs);
        // Mørke åpninger (inn i loftet, under svalgangen): ingen tekstur, bare nesten svart tre.
        this.mats.set('mork', new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 1, vertexColors: true }));
    }

    get(key: MatKey): THREE.MeshStandardMaterial {
        const m = this.mats.get(key);
        if (!m) throw new Error(`Materialet ${key} er ikke lastet`);
        return m;
    }

    private lodMat?: THREE.MeshStandardMaterial;

    /** Middels nivå: flat farge fra vertex-fargene, ingen teksturer. */
    lodMaterial(): THREE.MeshStandardMaterial {
        if (!this.lodMat) this.lodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, vertexColors: true });
        return this.lodMat;
    }

    lodColor(key: MatKey): THREE.Color {
        return new THREE.Color(key === 'mork' ? 0x1b1714 : DEFS[key].lodColor);
    }

    private tex(url: string, srgb: boolean, tile: number): Promise<THREE.Texture> {
        return this.loader.loadAsync(url).then((t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(1 / tile, 1 / tile);
            t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            t.anisotropy = this.anisotropy;
            this.textures.push(t);
            return t;
        });
    }

    private async make(key: MatKey, def: MatDef): Promise<void> {
        const [map, normalMap, arm] = await Promise.all([
            this.tex(`${BASE}${def.file}_diff.webp`, true, def.tile),
            this.low ? null : this.tex(`${BASE}${def.file}_nor.webp`, false, def.tile),
            this.low ? null : this.tex(`${BASE}${def.file}_arm.webp`, false, def.tile),
        ]);
        const ns = def.normalScale ?? 1;
        const m = new THREE.MeshStandardMaterial({
            map,
            normalMap,
            normalScale: new THREE.Vector2(ns, ns),
            aoMap: arm,
            aoMapIntensity: 1,
            roughnessMap: arm,
            roughness: this.low ? 0.85 : 1,
            metalness: 0,
            color: new THREE.Color(...(def.color ?? [1, 1, 1])),
            vertexColors: true,
        });
        this.mats.set(key, m);
    }

    dispose(): void {
        this.mats.forEach((m) => m.dispose());
        this.lodMat?.dispose();
        this.textures.forEach((t) => t.dispose());
    }
}

/**
 * Miljølys fra en enkel himmel: lys grå over, mørk brun-grå under. Gir treverket
 * et svakt gjenskinn og våte flater litt glans, uten et ekte himmelbilde.
 */
export function makeSkyEnvironment(renderer: THREE.WebGLRenderer, top: number, horizon: number, bottom: number): THREE.Texture {
    const scene = new THREE.Scene();
    const geo = new THREE.SphereGeometry(10, 32, 16);
    const cTop = new THREE.Color(top);
    const cHor = new THREE.Color(horizon);
    const cBot = new THREE.Color(bottom);
    const colors: number[] = [];
    const pos = geo.getAttribute('position');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / 10;
        if (y > 0) c.copy(cHor).lerp(cTop, Math.pow(y, 0.6));
        else c.copy(cHor).lerp(cBot, Math.min(1, -y * 2.5));
        colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromScene(scene, 0.02);
    pmrem.dispose();
    geo.dispose();
    return rt.texture;
}
