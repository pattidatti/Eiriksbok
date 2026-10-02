// PBR-materialene til byen. Teksturene ligger i public/games/bryggen/textures/ (Poly Haven, CC0,
// se KILDE.md): farge, normal og ARM (AO, ruhet, metall i R, G, B).
//
// Materialene deles av alle hus og alle celler. Når en celle kastes, forsvinner bare
// geometrien; materialene og teksturene blir liggende til spillet avsluttes.
import * as THREE from 'three';
import type { MatKey } from './meshkit';
import { Vaat } from './vaat';

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

/** Hvor tett tåka er rundt landemerkene (`tynnTake`), mot resten av byen. */
const TYNN_TAKE = 0.5;

const DEFS: Record<Exclude<MatKey, 'mork'>, MatDef> = {
    laft: { file: 'laft', tile: LOG_H * 10, color: [1.55, 1.45, 1.35], normalScale: 1.1, lodColor: 0x4a3c31 },
    bordvegg: { file: 'bordvegg', tile: 2.0, color: [1.45, 1.38, 1.3], lodColor: 0x4f4338 },
    bordtak: { file: 'bordtak', tile: 1.7, color: [1.1, 1.08, 1.05], lodColor: 0x55504a },
    torv: { file: 'torv', tile: 2.6, color: [0.95, 1.0, 0.88], normalScale: 1.4, lodColor: 0x5c5a33 },
    dekke: { file: 'dekke', tile: 2.2, color: [1.45, 1.4, 1.35], lodColor: 0x3f362f },
    gardsrom: { file: 'gardsrom', tile: 1.8, color: [0.82, 0.8, 0.78], lodColor: 0x4d3e30 },
    gjorme: { file: 'gjorme', tile: 3.2, color: [0.9, 0.86, 0.82], normalScale: 1.2, lodColor: 0x4a3b2c },
    raatre: { file: 'raatre', tile: 1.2, color: [0.95, 0.9, 0.85], lodColor: 0x5b544c },
    stein: { file: 'stein', tile: 2.0, color: [1.25, 1.2, 1.15], lodColor: 0x4b4741 },
};

export class Materials {
    private readonly loader = new THREE.TextureLoader();
    private readonly mats = new Map<MatKey, THREE.MeshStandardMaterial>();
    private readonly textures: THREE.Texture[] = [];
    /** Normal- og ARM-kartene per materiale. Lastes først når full kvalitet brukes. */
    private readonly detail = new Map<MatKey, { normal: THREE.Texture; arm: THREE.Texture }>();
    private detailLoad: Promise<void> | null = null;
    private readonly maxAnisotropy: number;
    /** Lav kvalitet: bare fargetekstur og ruhet. Sparer to teksturoppslag per piksel. */
    private low: boolean;
    /** Våte flater (vaat.ts): alle materialene her deler den. */
    readonly vaat = new Vaat();

    constructor(renderer: THREE.WebGLRenderer, opts: { low?: boolean } = {}) {
        this.low = !!opts.low;
        // 4 er nok til at plankene på bakken ikke blir grøt på skrå, og billig på Chromebook.
        this.maxAnisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    }

    private get anisotropy(): number {
        return this.low ? 1 : this.maxAnisotropy;
    }

    /** Laster alle teksturene. Spillet venter på denne før første bilde. */
    async load(): Promise<void> {
        const jobs: Promise<void>[] = [];
        for (const [key, def] of Object.entries(DEFS) as [Exclude<MatKey, 'mork'>, MatDef][]) {
            jobs.push(this.make(key, def));
        }
        await Promise.all(jobs);
        if (!this.low) await this.loadDetail();
        // Mørke åpninger (inn i loftet, under svalgangen): ingen tekstur, bare nesten svart tre.
        this.mats.set('mork', this.medVaat(new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 1, vertexColors: true }), 'mork'));
    }

    get(key: MatKey): THREE.MeshStandardMaterial {
        const m = this.mats.get(key);
        if (!m) throw new Error(`Materialet ${key} er ikke lastet`);
        return m;
    }

    private lodMat?: THREE.MeshStandardMaterial;
    /** Kopiene med tynnere tåke, per materiale ('lod' for middels nivå). */
    private readonly tynne = new Map<MatKey | 'lod', THREE.MeshStandardMaterial>();

    /**
     * Samme materiale med tynnere tåke, til landemerker som skal synes over hele byen
     * (Mariakirken). Med vanlig tåke er de borte bak 100 m. Kopien deler teksturene og følger
     * kvalitetsbyttet, men får egen shader (bygges én gang).
     */
    tynnTake(key: MatKey | 'lod'): THREE.MeshStandardMaterial {
        let m = this.tynne.get(key);
        if (!m) {
            m = (key === 'lod' ? this.lodMaterial() : this.get(key)).clone();
            m.onBeforeCompile = (sh) => {
                this.vaat.patch(sh, key);
                sh.fragmentShader = sh.fragmentShader.replace(
                    '#include <fog_fragment>',
                    `#ifdef USE_FOG
                        float fd = fogDensity * ${TYNN_TAKE.toFixed(2)};
                        #ifdef FOG_EXP2
                            float fogFactor = 1.0 - exp( - fd * fd * vFogDepth * vFogDepth );
                        #else
                            float fogFactor = smoothstep( fogNear, fogFar * 2.0, vFogDepth );
                        #endif
                        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
                    #endif`
                );
            };
            m.customProgramCacheKey = () => `tynn-take:${key}`;
            // Strømmingen kjenner landemerker på dette og lar dem stå i tåka (streaming.ts).
            m.userData.tynnTake = true;
            this.tynne.set(key, m);
        }
        return m;
    }

    /** Middels nivå: flat farge fra vertex-fargene, ingen teksturer. */
    lodMaterial(): THREE.MeshStandardMaterial {
        if (!this.lodMat) this.lodMat = this.medVaat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, vertexColors: true }), 'lod');
        return this.lodMat;
    }

    /** Hekter vætan på materialet (én shader per nøkkel). */
    private medVaat(m: THREE.MeshStandardMaterial, key: MatKey | 'lod'): THREE.MeshStandardMaterial {
        m.onBeforeCompile = (sh) => this.vaat.patch(sh, key);
        m.customProgramCacheKey = () => `vaat:${key}`;
        return m;
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
        const map = await this.tex(`${BASE}${def.file}_diff.webp`, true, def.tile);
        const ns = def.normalScale ?? 1;
        const m = new THREE.MeshStandardMaterial({
            map,
            normalScale: new THREE.Vector2(ns, ns),
            aoMapIntensity: 1,
            roughness: 0.85,
            metalness: 0,
            color: new THREE.Color(...(def.color ?? [1, 1, 1])),
            vertexColors: true,
        });
        this.mats.set(key, this.medVaat(m, key));
    }

    /** Laster normal- og ARM-kartene én gang, første gang full kvalitet trengs. */
    private loadDetail(): Promise<void> {
        if (!this.detailLoad) {
            const entries = Object.entries(DEFS) as [Exclude<MatKey, 'mork'>, MatDef][];
            this.detailLoad = Promise.all(
                entries.map(async ([key, def]) => {
                    const [normal, arm] = await Promise.all([
                        this.tex(`${BASE}${def.file}_nor.webp`, false, def.tile),
                        this.tex(`${BASE}${def.file}_arm.webp`, false, def.tile),
                    ]);
                    this.detail.set(key, { normal, arm });
                })
            ).then(() => this.applyQuality());
        }
        return this.detailLoad;
    }

    /** Bytter kvalitet mens spillet går. Full kvalitet laster detaljkartene første gang. */
    async setLow(low: boolean): Promise<void> {
        this.low = low;
        if (!low) await this.loadDetail();
        this.applyQuality();
    }

    private applyQuality(): void {
        // Også materialer som ikke står i scenen nå: skyggene er bakt inn i shaderne deres.
        if (this.lodMat) this.lodMat.needsUpdate = true;
        for (const [key, m] of this.mats) {
            m.needsUpdate = true;
            if (key === 'mork') continue;
            const d = this.low ? undefined : this.detail.get(key);
            m.normalMap = d?.normal ?? null;
            m.aoMap = d?.arm ?? null;
            m.roughnessMap = d?.arm ?? null;
            m.roughness = d ? 1 : 0.85;
            m.needsUpdate = true;
        }
        for (const [key, m] of this.tynne) {
            const b = key === 'lod' ? this.lodMat : this.mats.get(key);
            if (!b) continue;
            m.normalMap = b.normalMap;
            m.aoMap = b.aoMap;
            m.roughnessMap = b.roughnessMap;
            m.roughness = b.roughness;
            m.needsUpdate = true;
        }
        for (const t of this.textures) {
            if (t.anisotropy === this.anisotropy) continue;
            t.anisotropy = this.anisotropy;
            t.needsUpdate = true;
        }
    }

    dispose(): void {
        this.mats.forEach((m) => m.dispose());
        this.lodMat?.dispose();
        this.tynne.forEach((m) => m.dispose());
        this.textures.forEach((t) => t.dispose());
    }
}

/**
 * Miljølys fra en enkel himmel: lys grå over, mørk brun-grå under. Gir treverket
 * et svakt gjenskinn og våte flater litt glans, uten et ekte himmelbilde.
 */
export function makeSkyEnvironment(
    renderer: THREE.WebGLRenderer,
    top: number,
    horizon: number,
    bottom: number,
    sol?: { retning: THREE.Vector3; farge: number; styrke: number }
): THREE.Texture {
    const scene = new THREE.Scene();
    const geo = new THREE.SphereGeometry(10, 64, 32);
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
        // Lyset rundt sola: våte flater speiler en varm flekk mot sola.
        if (sol) {
            const mot = Math.max(0, (pos.getX(i) * sol.retning.x + pos.getY(i) * sol.retning.y + pos.getZ(i) * sol.retning.z) / 10);
            c.add(new THREE.Color(sol.farge).multiplyScalar(sol.styrke * (Math.pow(mot, 8) * 0.8 + Math.pow(mot, 64) * 2.5)));
        }
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
