// Lysstemningene: sola, himmelen og tåka, samlet ett sted, og hvordan de skifter gjennom døgnet.
//
// Lav polycount ser flat ut i flatt lys. Det som gir form, er forskjellen mellom solsiden og
// skyggesiden: sterk, varm sol og svakt, kaldt fyllys fra himmelen. I gråvær er de like sterke,
// og da forsvinner formene. Derfor har hver stemning sitt eget forhold mellom sol og fyll.
//
// I Bryggen går døgnet (dogn.ts): stemningen blandes fra nøkkelbilder etter hvor høyt sola står
// (natt, skumring, solnedgang, kveld, dag), og mot de grå nøkkelbildene når det trekker over.
// Om natta er «sola» i lyssettingen månen: samme lys, flyttet dit månen står, blått og svakt.
//
// `?lys=kveld|morgen|dag|graatt|natt` velger hvor døgnet starter (standard: kveld etter regnet).
// `?dogn=0` stopper klokka og været (skjermbilder og måling). Gråboksen har alltid grått vær.
import * as THREE from 'three';
import { DOGN_S, STARTER, Vaer, maaneRetning, solRetning } from './dogn';

export type StemningId = 'kveld' | 'graatt' | 'morgen' | 'dag' | 'natt';

export interface Stemning {
    /** Fargen og styrken på lyset fra sola (om natta: månen). */
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
    /** Glød rundt sola i tåka og på himmelen, og glitteret i vannet. 0 = ingen. */
    solGlod: number;
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

const FARGER = ['solFarge', 'himmel', 'bakke', 'takeFarge', 'zenit', 'horisont', 'sky', 'fjell'] as const;
const TALL = ['solStyrke', 'fyll', 'fyllLav', 'miljo', 'takeTetthet', 'eksponering', 'skydekke', 'solGlod', 'dis', 'skyggeLoft', 'fjellDis'] as const;
type Farge = (typeof FARGER)[number];

// ── Klart vær ──
// Dag og kveld er de to stemningene eieren har sett og godkjent («morgen» og «kveld» før døgnet).
const DAG: Stemning = {
    solFarge: 0xfff0dc, solStyrke: 2.8, himmel: 0x9db7d4, bakke: 0x40382f, fyll: 0.85, fyllLav: 1.05, miljo: 0.75,
    takeFarge: 0xb4bcc4, takeTetthet: 0.013, eksponering: 1.0, zenit: 0x5e86b5, horisont: 0xc3ccd4, sky: 0xdfe3e8,
    skydekke: 0.3, solGlod: 0.55, dis: 0.7, skyggeLoft: 0.45, fjell: 0x33463a, fjellDis: 3200,
};
const KVELD: Stemning = {
    solFarge: 0xffc28a, solStyrke: 3.4, himmel: 0x8ea4bd, bakke: 0x5c4a3a, fyll: 1.05, fyllLav: 1.4, miljo: 0.85,
    takeFarge: 0xa4a29f, takeTetthet: 0.017, eksponering: 1.05, zenit: 0x6f89a8, horisont: 0xb7b2aa, sky: 0x8a8b92,
    skydekke: 0.6, solGlod: 1.0, dis: 1.0, skyggeLoft: 0.7, fjell: 0x2c3a30, fjellDis: 2600,
};
// Sola i horisonten: rødgul, svakere, og himmelen varm nederst.
const SOLNED: Stemning = {
    solFarge: 0xff9450, solStyrke: 2.4, himmel: 0x8890aa, bakke: 0x4a3a30, fyll: 0.9, fyllLav: 1.2, miljo: 0.72,
    takeFarge: 0xa8948a, takeTetthet: 0.018, eksponering: 1.15, zenit: 0x56698e, horisont: 0xc89a7e, sky: 0x86788a,
    skydekke: 0.55, solGlod: 1.25, dis: 1.1, skyggeLoft: 0.7, fjell: 0x2a2e30, fjellDis: 2400,
};
// Blåtimen: sola er borte, månen er ikke oppe ennå. Bare himmellyset.
const SKUMRING: Stemning = {
    solFarge: 0x9fb2dc, solStyrke: 0.05, himmel: 0x5d6c94, bakke: 0x2a2a30, fyll: 0.85, fyllLav: 1.15, miljo: 0.6,
    takeFarge: 0x4e5672, takeTetthet: 0.019, eksponering: 1.65, zenit: 0x1f2a4a, horisont: 0x6c6680, sky: 0x3a3c52,
    skydekke: 0.5, solGlod: 0.2, dis: 0.7, skyggeLoft: 0.3, fjell: 0x161c26, fjellDis: 2600,
};
// Natt: månelys, blått og svakt, men nok til å finne veien.
const NATT: Stemning = {
    solFarge: 0xa6bce6, solStyrke: 1.7, himmel: 0x5a70a8, bakke: 0x2a2a34, fyll: 1.3, fyllLav: 1.75, miljo: 0.85,
    takeFarge: 0x26304a, takeTetthet: 0.018, eksponering: 2.1, zenit: 0x0a1226, horisont: 0x253048, sky: 0x1a2032,
    skydekke: 0.4, solGlod: 0.5, dis: 0.5, skyggeLoft: 0.6, fjell: 0x0c1118, fjellDis: 3000,
};

// ── Grått vær ──
// Midt på dagen er det det gamle, jevne Bergen-været (det eieren godkjente først).
const GRAATT: Stemning = {
    solFarge: 0xfff4e6, solStyrke: 1.5, himmel: 0xc9d2da, bakke: 0x4a4843, fyll: 1.25, fyllLav: 1.7, miljo: 0.9,
    takeFarge: 0x95a0a8, takeTetthet: 0.021, eksponering: 1.2, zenit: 0xb9c3cb, horisont: 0x95a0a8, sky: 0xa3acb3,
    skydekke: 0.95, solGlod: 0.0, dis: 0.6, skyggeLoft: 0, fjell: 0x3a4641, fjellDis: 1500,
};
const GRAA_KVELD: Stemning = {
    ...GRAATT, solFarge: 0xffd8b8, solStyrke: 0.7, himmel: 0x8d96a2, bakke: 0x3a3835, fyll: 1.0, fyllLav: 1.4,
    miljo: 0.75, takeFarge: 0x75808a, takeTetthet: 0.022, eksponering: 1.3, zenit: 0x7d8790, horisont: 0x75808a,
    sky: 0x7a838c, fjell: 0x2c3633,
};
const GRAA_SKUMRING: Stemning = {
    ...GRAATT, solFarge: 0x8a9ab8, solStyrke: 0.05, himmel: 0x4a5468, bakke: 0x24242a, fyll: 0.75, fyllLav: 1.0,
    miljo: 0.5, takeFarge: 0x3e4654, takeTetthet: 0.022, eksponering: 1.5, zenit: 0x353d4c, horisont: 0x3e4654,
    sky: 0x3a414e, dis: 0.5, fjell: 0x1a2024,
};
const GRAA_NATT: Stemning = {
    ...GRAATT, solFarge: 0x8a9ab8, solStyrke: 0.15, himmel: 0x384258, bakke: 0x1c1c20, fyll: 0.95, fyllLav: 1.3,
    miljo: 0.55, takeFarge: 0x1c212b, takeTetthet: 0.022, eksponering: 2.1, zenit: 0x161b24, horisont: 0x1c212b,
    sky: 0x1d222c, dis: 0.4, fjell: 0x0e1216,
};

interface Nokkel {
    /** Solhøyden (radianer) der dette nøkkelbildet gjelder fullt. */
    el: number;
    s: Stemning;
    c: Record<Farge, THREE.Color>;
}
const nokler = (liste: [number, Stemning][]): Nokkel[] =>
    liste.map(([el, s]) => ({ el, s, c: Object.fromEntries(FARGER.map((f) => [f, new THREE.Color(s[f])])) as Record<Farge, THREE.Color> }));
const KLAR = nokler([[-0.2, NATT], [-0.07, SKUMRING], [0.02, SOLNED], [0.33, KVELD], [0.8, DAG]]);
const GRAA = nokler([[-0.2, GRAA_NATT], [-0.06, GRAA_SKUMRING], [0.06, GRAA_KVELD], [0.35, GRAATT]]);

const _c = new THREE.Color();

/** Blander nøkkelbildene for solhøyden `el` inn i `tall` og `c`, med vekt `w` oppå det som står der. */
function bland(liste: Nokkel[], el: number, w: number, tall: Stemning, c: Record<Farge, THREE.Color>): void {
    let i = 0;
    while (i < liste.length - 2 && el > liste[i + 1].el) i++;
    const a = liste[i];
    const b = liste[i + 1];
    const f = THREE.MathUtils.smoothstep(el, a.el, b.el);
    for (const k of TALL) {
        const v = a.s[k] + (b.s[k] - a.s[k]) * f;
        tall[k] = w >= 1 ? v : tall[k] + (v - tall[k]) * w;
    }
    for (const k of FARGER) {
        if (w >= 1) c[k].copy(a.c[k]).lerp(b.c[k], f);
        else c[k].lerp(_c.copy(a.c[k]).lerp(b.c[k], f), w);
    }
}

export function stemningFraUrl(): StemningId {
    const s = new URLSearchParams(location.search).get('lys');
    return s && s in STARTER ? (s as StemningId) : 'kveld';
}

/**
 * Lysene i scenen, og døgnet som flytter dem. Eier sola og halvkulelyset, tåka og fargene alle
 * de andre delene leser (himmelen, vannet, røyken, etterbehandlingen). Fargene og retningene er
 * delte objekter som endres på stedet: de som bruker dem, legger dem rett i uniformene sine.
 */
export class Lyssetting {
    /** Stemningen akkurat nå (tallene). Fargene står i `c`. */
    readonly s: Stemning = { ...GRAATT };
    readonly c = Object.fromEntries(FARGER.map((f) => [f, new THREE.Color(GRAATT[f])])) as Record<Farge, THREE.Color>;
    readonly sol: THREE.DirectionalLight;
    readonly hemi: THREE.HemisphereLight;
    /** Retningen mot lyset som kaster skygger: sola om dagen, månen om natta. */
    readonly solRetning = new THREE.Vector3(-14, 22, -10).normalize();
    /** Der sola og månen faktisk står (også under horisonten). */
    readonly solen = new THREE.Vector3();
    readonly maanen = new THREE.Vector3(0, -1, 0);
    /** Hvor sterkt lyset fra sola/månen er nå, 0..1 (borte nede ved horisonten). */
    lysFade = 1;
    /** 0 om dagen, 1 når det er mørkt nok for stjerner. */
    natt = 0;
    /** Sekunder fra soloppgang (døgnet er `DOGN_S`). */
    klokke = 0;
    /** Klokka går (`?dogn=0` stopper den og været). Ganger: `fart`. */
    gaar = true;
    fart = 1;
    readonly vaer: Vaer;
    /** Hvor vått det er ved start. */
    readonly vaatStart: number;
    private readonly bryggen: boolean;
    private avstand = 30;
    private stor = false;

    constructor(scene: THREE.Scene, id: StemningId, opts: { bryggen: boolean }) {
        this.bryggen = opts.bryggen;
        const start = STARTER[opts.bryggen ? id : 'graatt'];
        this.klokke = start.tid;
        this.vaer = new Vaer(start.vaer, { regn: start.regn, takvann: start.takvann, neste: start.neste });
        this.vaatStart = start.vaat;
        this.gaar = opts.bryggen && new URLSearchParams(location.search).get('dogn') !== '0';
        this.hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
        this.sol = new THREE.DirectionalLight(0xffffff, 1);
        this.sol.castShadow = true;
        const sc = this.sol.shadow.camera;
        sc.near = 1;
        this.sol.shadow.mapSize.setScalar(1024);
        this.sol.shadow.bias = -0.0006;
        scene.add(this.hemi, this.sol, this.sol.target);
        scene.fog = new THREE.FogExp2(0x9ba4ab, 0.024);
        scene.background = new THREE.Color(0x9ba4ab);
        if (opts.bryggen) this.beregn(scene);
        else {
            // Gråboksen har aldri fått nye stemninger: den beholder det gamle lyset, litt tettere
            // og lysere tåke og mer fyll.
            this.hemi.color.set(GRAATT.himmel);
            this.hemi.groundColor.set(GRAATT.bakke);
            this.hemi.intensity = 1.5;
            this.sol.color.set(GRAATT.solFarge);
            this.sol.intensity = GRAATT.solStyrke;
            this.skyggeKamera();
        }
        if (import.meta.env.DEV) Object.assign(window, { __bryggenLys: this });
    }

    /** Kalles hvert bilde av verdenen, før de andre delene leser fargene. */
    tikk(dt: number, scene: THREE.Scene): void {
        if (!this.bryggen) return;
        if (this.gaar) {
            this.klokke = (this.klokke + dt * this.fart) % DOGN_S;
            this.vaer.update(dt);
        }
        this.beregn(scene);
    }

    /** Stiller klokka (sekunder fra soloppgang). */
    still(sek: number): void {
        this.klokke = ((sek % DOGN_S) + DOGN_S) % DOGN_S;
    }

    private beregn(scene: THREE.Scene): void {
        solRetning(this.klokke, this.solen);
        maaneRetning(this.klokke, this.maanen);
        const el = Math.asin(this.solen.y);
        bland(KLAR, el, 1, this.s, this.c);
        if (this.vaer.dekke > 0.001) bland(GRAA, el, this.vaer.dekke, this.s, this.c);
        // Sola gir lys til den er under horisonten. Da tar månen over når den har kommet opp.
        // Ved byttet er begge borte, så skyggen hopper ikke.
        if (el > -0.02) {
            this.solRetning.copy(this.solen);
            this.lysFade = THREE.MathUtils.smoothstep(el, -0.02, 0.06);
        } else {
            this.solRetning.copy(this.maanen);
            this.lysFade = THREE.MathUtils.smoothstep(this.maanen.y, 0.02, 0.16);
        }
        this.natt = THREE.MathUtils.smoothstep(-el, 0.03, 0.16);
        const fog = scene.fog as THREE.FogExp2;
        fog.color.copy(this.c.takeFarge);
        fog.density = this.s.takeTetthet;
        (scene.background as THREE.Color).copy(this.c.takeFarge);
        this.hemi.color.copy(this.c.himmel);
        this.hemi.groundColor.copy(this.c.bakke);
        this.sol.color.copy(this.c.solFarge);
        this.skyggeKamera();
    }

    /** Lav sol gir lange skygger: større kart og større område. Byttes med litt slark. */
    private skyggeKamera(): void {
        const y = Math.max(0.15, this.solRetning.y);
        const stor = this.stor ? y < 0.55 : y < 0.48;
        if (stor !== this.stor) {
            this.stor = stor;
            this.sol.shadow.mapSize.setScalar(stor ? 2048 : 1024);
            this.sol.shadow.map?.dispose();
            this.sol.shadow.map = null;
        }
        const r = stor ? 20 : 16;
        // Langt nok bak gutten til at et 12 m høyt hus i sollinja kaster skygge.
        const avstand = Math.min(90, 12 / y + 10);
        const sc = this.sol.shadow.camera;
        if (sc.right !== r || Math.abs(avstand - this.avstand) > 0.5) {
            this.avstand = avstand;
            sc.left = -r;
            sc.right = r;
            sc.top = r;
            sc.bottom = -r;
            sc.far = avstand + 25;
            sc.updateProjectionMatrix();
        }
        this.sol.shadow.normalBias = stor ? 0.045 : 0.03;
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
        this.sol.intensity = s.solStyrke * this.lysFade * (1 - inne * 0.85);
        scene.environmentIntensity = s.miljo * ute * loft;
    }
}
