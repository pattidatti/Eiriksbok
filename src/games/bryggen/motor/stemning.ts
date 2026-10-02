// Lysstemningene: sola, himmelen, tåka og hvor vått det er, samlet ett sted.
//
// Lav polycount ser flat ut i flatt lys. Det som gir form, er forskjellen mellom solsiden og
// skyggesiden: sterk, varm sol og svakt, kaldt fyllys fra himmelen. I gråvær er de like sterke,
// og da forsvinner formene. Derfor har hver stemning sitt eget forhold mellom sol og fyll.
//
// Velg med `?lys=kveld|graatt|morgen` i adressen. Standard er «kveld»: regnet har nettopp
// gitt seg, sola står lavt over Vågen og lyser rett på bryggefronten, og alt er fortsatt vått.
// «graatt» er det gamle, jevne Bergen-været (det eieren godkjente først).
//
// Hvor sola står: Vågen åpner seg mot nordvest forbi Holmen (+x, -z). En kveldssol derfra
// lyser på gavlene mot sjøen og kaster lange skygger innover i gårdsrommene [S].
import * as THREE from 'three';

export type StemningId = 'kveld' | 'graatt' | 'morgen';

export interface Stemning {
    /** Retning MOT sola (normaliseres). */
    sol: [number, number, number];
    solFarge: number;
    solStyrke: number;
    /** Halvkulelyset: himmel over, bakken under. Fyllyset i skyggene. */
    himmel: number;
    bakke: number;
    fyll: number;
    /** Fyllyset på lav kvalitet (der miljølyset er av). */
    fyllLav: number;
    miljo: number;
    takeFarge: number;
    takeTetthet: number;
    eksponering: number;
    /** Himmelkuppelen: rett opp, i horisonten, og skyene. */
    zenit: number;
    horisont: number;
    sky: number;
    /** Hvor mye av himmelen som er dekket av skyer (0-1). */
    skydekke: number;
    /** Glød rundt sola i tåka og på himmelen (etterbehandlingen). 0 = ingen. */
    solGlod: number;
    /** Standard regn (0-1). `?regn=` overstyrer. */
    regn: number;
    /** Hvor vått det er selv uten regn (det har nettopp regnet). */
    vaat: number;
    /** Dis lavt over Vågen (etterbehandlingen). */
    dis: number;
    /**
     * Hvor mye fyllyset og miljølyset løftes når kameraet står i skyggen ute (0 = ingenting).
     * Øyet venner seg til mørket, og i de smale gårdsrommene kaster de solbelyste veggene lys
     * ned på hverandre. Det siste kan ikke halvkulelyset vise, så dette gjør jobben.
     */
    skyggeLoft: number;
    /** Fjellene rundt byen (himmel.ts): fargen nær, og hvor fort disen tar dem (meter). */
    fjell: number;
    fjellDis: number;
}

export const STEMNINGER: Record<StemningId, Stemning> = {
    kveld: {
        sol: [0.35, 0.34, -0.87],
        solFarge: 0xffc28a,
        solStyrke: 3.4,
        himmel: 0x8ea4bd,
        bakke: 0x5c4a3a,
        fyll: 1.05,
        fyllLav: 1.4,
        miljo: 0.85,
        takeFarge: 0xa4a29f,
        takeTetthet: 0.017,
        eksponering: 1.05,
        zenit: 0x6f89a8,
        horisont: 0xb7b2aa,
        sky: 0x8a8b92,
        skydekke: 0.6,
        solGlod: 1.0,
        regn: 0.0,
        vaat: 0.85,
        dis: 1.0,
        skyggeLoft: 0.7,
        fjell: 0x2c3a30,
        fjellDis: 2600,
    },
    graatt: {
        sol: [-14, 22, -10],
        solFarge: 0xfff4e6,
        solStyrke: 1.5,
        himmel: 0xc9d2da,
        bakke: 0x4a4843,
        fyll: 1.25,
        fyllLav: 1.7,
        miljo: 0.9,
        takeFarge: 0x95a0a8,
        takeTetthet: 0.021,
        eksponering: 1.2,
        zenit: 0xb9c3cb,
        horisont: 0x95a0a8,
        sky: 0xa3acb3,
        skydekke: 0.95,
        solGlod: 0.0,
        regn: 0.6,
        vaat: 0.6,
        dis: 0.6,
        skyggeLoft: 0,
        fjell: 0x3a4641,
        fjellDis: 1500,
    },
    morgen: {
        // En ekte morgensol står i øst, bak gårdene (+z), og da ligger hele bryggefronten i
        // skygge. Her har sola kommet rundt mot sør (-x) utpå formiddagen: den streifer gavlene
        // og lyser rett på langveggene og ned i gårdsrommene [S].
        sol: [-0.8, 0.62, -0.08],
        solFarge: 0xfff0dc,
        solStyrke: 2.8,
        himmel: 0x9db7d4,
        bakke: 0x40382f,
        fyll: 0.85,
        fyllLav: 1.05,
        miljo: 0.75,
        takeFarge: 0xb4bcc4,
        takeTetthet: 0.013,
        eksponering: 1.0,
        zenit: 0x5e86b5,
        horisont: 0xc3ccd4,
        sky: 0xdfe3e8,
        skydekke: 0.3,
        solGlod: 0.55,
        regn: 0.0,
        vaat: 0.35,
        dis: 0.7,
        skyggeLoft: 0.45,
        fjell: 0x33463a,
        fjellDis: 3200,
    },
};

export function stemningFraUrl(): StemningId {
    const s = new URLSearchParams(location.search).get('lys');
    return s === 'graatt' || s === 'morgen' || s === 'kveld' ? s : 'kveld';
}

/** Hvor stort område sola kaster skygger i (meter, i solas rom). Lav sol trenger lengre. */
const SKYGGE_HALV = 20;

/**
 * Lysene i scenen for en stemning. Eier sola og halvkulelyset, og demper dem inne i et rom
 * (`oppdater`). Skyggekameraet følger gutten og strekkes langs sola.
 */
export class Lyssetting {
    readonly s: Stemning;
    readonly sol: THREE.DirectionalLight;
    readonly hemi: THREE.HemisphereLight;
    /** Normalisert retning mot sola. */
    readonly solRetning: THREE.Vector3;
    private readonly bryggen: boolean;
    /** Hvor langt bak gutten sola står: langt nok til at et 12 m høyt hus i sollinja kaster skygge. */
    private readonly avstand: number;

    constructor(scene: THREE.Scene, id: StemningId, opts: { bryggen: boolean }) {
        // Gråboksen har aldri fått nye stemninger: den beholder det gamle lyset.
        this.s = STEMNINGER[opts.bryggen ? id : 'graatt'];
        this.bryggen = opts.bryggen;
        const s = this.s;
        this.solRetning = new THREE.Vector3(...s.sol).normalize();
        this.hemi = new THREE.HemisphereLight(s.himmel, s.bakke, s.fyll);
        this.sol = new THREE.DirectionalLight(s.solFarge, s.solStyrke);
        this.sol.castShadow = true;
        // Lav sol gir lange skygger: større kart og større område enn i gråvær.
        const lav = this.solRetning.y < 0.5;
        this.sol.shadow.mapSize.setScalar(lav ? 2048 : 1024);
        const sc = this.sol.shadow.camera;
        const r = lav ? SKYGGE_HALV : 16;
        sc.left = -r;
        sc.right = r;
        sc.top = r;
        sc.bottom = -r;
        sc.near = 1;
        this.avstand = 12 / this.solRetning.y + 10;
        sc.far = this.avstand + 25;
        this.sol.shadow.bias = -0.0006;
        this.sol.shadow.normalBias = lav ? 0.045 : 0.03;
        scene.add(this.hemi, this.sol, this.sol.target);
        // Gråboksen: litt tettere og lysere tåke, og mer fyll (som før stemningene).
        const take = opts.bryggen ? s.takeFarge : 0x9ba4ab;
        scene.fog = new THREE.FogExp2(take, opts.bryggen ? s.takeTetthet : 0.024);
        scene.background = new THREE.Color(take);
        if (!opts.bryggen) this.hemi.intensity = 1.5;
        if (import.meta.env.DEV) Object.assign(window, { __bryggenLys: this });
    }

    /**
     * Kalles hvert bilde. `inne` 0..1 demper dagslyset (ilden tar over), og skyggen følger `follow`.
     * `skygge` 0..1 er hvor mye kameraet står i skyggen ute (`BryggenWorld.skygge`).
     */
    oppdater(follow: THREE.Vector3, inne: number, low: boolean, scene: THREE.Scene, skygge = 0): void {
        this.sol.position.copy(follow).addScaledVector(this.solRetning, this.avstand);
        this.sol.target.position.copy(follow);
        if (!this.bryggen) return;
        const s = this.s;
        const ute = 1 - inne * 0.65;
        const loft = 1 + s.skyggeLoft * skygge * (1 - inne);
        this.hemi.intensity = (low ? s.fyllLav : s.fyll) * ute * loft;
        this.sol.intensity = s.solStyrke * (1 - inne * 0.85);
        scene.environmentIntensity = s.miljo * ute * loft;
    }
}
