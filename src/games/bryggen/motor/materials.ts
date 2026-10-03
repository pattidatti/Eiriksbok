// PBR-materialene til byen. Teksturene ligger i public/games/bryggen/textures/ (Poly Haven, CC0,
// se KILDE.md): farge, normal og ARM (AO, ruhet, metall i R, G, B).
//
// Materialene deles av alle hus og alle celler. Når en celle kastes, forsvinner bare
// geometrien; materialene og teksturene blir liggende til spillet avsluttes.
import * as THREE from 'three';
import type { MatKey } from './meshkit';
import { Vaat } from './vaat';
import { SEIL_LOD, kastSeilduk, lagSeilduk, seilKvalitet } from './seilduk';

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

const DEFS: Record<Exclude<MatKey, 'mork' | 'seil'>, MatDef> = {
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
        for (const [key, def] of Object.entries(DEFS) as [Exclude<MatKey, 'mork' | 'seil'>, MatDef][]) {
            jobs.push(this.make(key, def));
        }
        await Promise.all(jobs);
        if (!this.low) await this.loadDetail();
        // Mørke åpninger (inn i loftet, under svalgangen): ingen tekstur, bare nesten svart tre.
        this.mats.set('mork', this.medVaat(new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 1, vertexColors: true }), 'mork'));
        // Seilduken: egen tekstur tegnet på lerret, og vind i shaderen (seilduk.ts).
        this.mats.set('seil', lagSeilduk(this.vaat, this.low, this.anisotropy));
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

    private fjernMat?: THREE.MeshStandardMaterial;
    /**
     * Land langt unna over Vågen (Nordnes): flat farge fra vertex-fargene, uten væte (pyttene ble
     * hvite flekker på takene der borte), og med enda tynnere tåke enn landemerkene, så åsen står
     * som en blek silhuett i disen og ikke forsvinner helt.
     */
    fjernLand(): THREE.MeshStandardMaterial {
        if (!this.fjernMat) {
            const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, vertexColors: true, envMapIntensity: 0.4 });
            m.onBeforeCompile = (sh) => {
                sh.fragmentShader = sh.fragmentShader.replace(
                    '#include <fog_fragment>',
                    `#ifdef USE_FOG
                        float fd = fogDensity * 0.3;
                        #ifdef FOG_EXP2
                            float fogFactor = 1.0 - exp( - fd * fd * vFogDepth * vFogDepth );
                        #else
                            float fogFactor = smoothstep( fogNear, fogFar * 3.0, vFogDepth );
                        #endif
                        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
                    #endif`
                );
            };
            m.customProgramCacheKey = () => 'fjern-land';
            m.userData.tynnTake = true;
            this.fjernMat = m;
        }
        return this.fjernMat;
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
        return new THREE.Color(key === 'mork' ? 0x1b1714 : key === 'seil' ? SEIL_LOD : DEFS[key].lodColor);
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
            const entries = Object.entries(DEFS) as [Exclude<MatKey, 'mork' | 'seil'>, MatDef][];
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
            if (key === 'seil') {
                seilKvalitet(m, this.low, this.anisotropy);
                continue;
            }
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
        kastSeilduk();
    }
}

/**
 * Miljølys fra en enkel himmel: himmelfargen over, mørk brun-grå under, og en varm flekk mot
 * sola. Gir treverket et svakt gjenskinn og våte flater litt glans, uten et ekte himmelbilde.
 *
 * Himmelen skifter med døgnet, så kartet lages på nytt med jevne mellomrom (`oppdater`): fargene
 * skrives inn i hjørnene på kula, og den samme PMREM-generatoren tegner den. Et nytt kart med
 * samme størrelse bygger ingen shadere på nytt.
 */
export class Himmellys {
    texture: THREE.Texture;
    private rt: THREE.WebGLRenderTarget;
    private readonly scene = new THREE.Scene();
    private readonly geo = new THREE.SphereGeometry(10, 48, 24);
    private readonly farger: THREE.BufferAttribute;
    private readonly pmrem: THREE.PMREMGenerator;
    private readonly bunn = new THREE.Color(0x3a3833);

    constructor(renderer: THREE.WebGLRenderer, lys: { topp: THREE.Color; horisont: THREE.Color; sol: THREE.Vector3; solFarge: THREE.Color; solStyrke: number; lysniva: number }) {
        this.farger = new THREE.BufferAttribute(new Float32Array(this.geo.getAttribute('position').count * 3), 3);
        this.geo.setAttribute('color', this.farger);
        this.scene.add(new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
        this.pmrem = new THREE.PMREMGenerator(renderer);
        this.rt = this.lag(lys);
        this.texture = this.rt.texture;
    }

    private lag(lys: { topp: THREE.Color; horisont: THREE.Color; sol: THREE.Vector3; solFarge: THREE.Color; solStyrke: number; lysniva: number }): THREE.WebGLRenderTarget {
        const pos = this.geo.getAttribute('position');
        const c = new THREE.Color();
        const s = new THREE.Color();
        const bunn = new THREE.Color().copy(this.bunn).multiplyScalar(lys.lysniva);
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i) / 10;
            if (y > 0) c.copy(lys.horisont).lerp(lys.topp, Math.pow(y, 0.6));
            else c.copy(lys.horisont).lerp(bunn, Math.min(1, -y * 2.5));
            // Lyset rundt sola: våte flater speiler en varm flekk mot sola.
            const mot = Math.max(0, (pos.getX(i) * lys.sol.x + pos.getY(i) * lys.sol.y + pos.getZ(i) * lys.sol.z) / 10);
            c.add(s.copy(lys.solFarge).multiplyScalar(lys.solStyrke * (Math.pow(mot, 8) * 0.8 + Math.pow(mot, 64) * 2.5)));
            this.farger.setXYZ(i, c.r, c.g, c.b);
        }
        this.farger.needsUpdate = true;
        return this.pmrem.fromScene(this.scene, 0.02);
    }

    /** Lager kartet på nytt. Det gamle kastes etter at det nye er tatt i bruk. */
    oppdater(lys: { topp: THREE.Color; horisont: THREE.Color; sol: THREE.Vector3; solFarge: THREE.Color; solStyrke: number; lysniva: number }): THREE.Texture {
        const gammel = this.rt;
        this.rt = this.lag(lys);
        this.texture = this.rt.texture;
        gammel.dispose();
        return this.texture;
    }

    dispose(): void {
        this.rt.dispose();
        this.pmrem.dispose();
        this.geo.dispose();
    }
}
