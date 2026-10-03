// Dyr i gatene: griser som roter i gjørma bak husene og hunder som rusler i gata (blueprint §8.8).
//
// Cellene melder fra om områdene sine (`meldDyreSoner` når cella bygges, `glemDyreSoner` når den
// kastes), og `Dyrene` holder dyrene der. Alle griser er én InstancedMesh og alle hunder én (ett
// tegnekall hver, og ett i skyggen), animert i vertex-shaderen (firbeint.ts). Dyr lenger unna enn
// AKTIV_R står stille og tegnes ikke; bak GROV_R tegnes de, men kaster ikke skygge (bare de nære får
// plass i skyggekameraet, se `skyggeR`).
//
// Grisene rusler, roter med trynet nede, legger seg i gjørma, og løper unna med et rykk når gutten
// kommer løpende eller går helt inntil. Hundene rusler og snuser, setter seg og ser på gutten, går
// litt etter ham med halen i gang, og viker unna når han løper mot dem. Om natta ligger de fleste.
//
// [K] At det gikk griser løse i smugene og hunder i gatene i Bergen i 1420-årene, er ikke funnet i
// kildene ennå (blueprint §8.8). Mange byer i middelalderen hadde regler mot griser i gatene, men det
// er ikke sjekket for Bergen. Dyrene er med fordi en by uten dem ville vært for ren [S].
import * as THREE from 'three';
import { lagDyrDybde, lagDyrGeometri, lagDyrMateriale, type Art } from './firbeint';

/** Et område dyrene holder seg i. `y` er bakken. */
export interface DyreSone {
    art: Art;
    /** Hjørnene i xz. */
    x0: number;
    x1: number;
    z0: number;
    z1: number;
    y: number;
    antall: number;
}

type Tilstand = 'rusle' | 'sta' | 'snuse' | 'ligge' | 'flykte' | 'folge';

interface Dyr {
    art: Art;
    sone: DyreSone;
    tilstand: Tilstand;
    pos: THREE.Vector3;
    yaw: number;
    fart: number;
    mal: THREE.Vector3;
    tid: number;
    fase: number;
    /** Animasjonen, glattet. */
    ned: number;
    ligg: number;
    logre: number;
    hodeYaw: number;
    skala: number;
    farge: THREE.Color;
    frø: number;
}

const soner = new Map<string, DyreSone[]>();
let versjon = 0;

/** En celle har områder med dyr (kalles når cella bygges). */
export function meldDyreSoner(id: string, s: DyreSone[]): void {
    soner.set(id, s);
    versjon++;
}

/** Cella er kastet: dyrene der forsvinner. */
export function glemDyreSoner(id: string): void {
    if (soner.delete(id)) versjon++;
}

const MAKS: Record<Art, number> = { gris: 16, hund: 10 };
const FART: Record<Art, { rusle: number; flykte: number; folge: number }> = {
    gris: { rusle: 0.45, flykte: 2.6, folge: 0 },
    hund: { rusle: 0.85, flykte: 3.4, folge: 1.4 },
};
/** Dyr lenger unna kameraet står stille og tegnes ikke (tåka og husene skjuler dem uansett). */
const AKTIV_R = 50;
/** Nærmere kameraet enn dette kaster dyr skygge. */
const SKYGGE_R = 16;
/** Full fart tilsvarer 1 i shaderens `fart` (løp). */
const LOP: Record<Art, number> = { gris: 2.4, hund: 3.2 };
const STEG: Record<Art, number> = { gris: 0.42, hund: 0.55 };

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const OPP = new THREE.Vector3(0, 1, 0);

class Flokk {
    readonly art: Art;
    readonly mesh: THREE.InstancedMesh;
    readonly dyr: Dyr[] = [];
    private readonly iA: THREE.InstancedBufferAttribute;
    private readonly iB: THREE.InstancedBufferAttribute;
    /** De nære (med skygge) og de fjerne (uten) i hver sin mesh deler geometri og materiale. */
    readonly fjern: THREE.InstancedMesh;
    private readonly fA: THREE.InstancedBufferAttribute;
    private readonly fB: THREE.InstancedBufferAttribute;

    constructor(art: Art) {
        this.art = art;
        const n = MAKS[art];
        const lag = () => {
            const geo = lagDyrGeometri(art);
            const a = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
            const b = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
            a.setUsage(THREE.DynamicDrawUsage);
            b.setUsage(THREE.DynamicDrawUsage);
            geo.setAttribute('iA', a);
            geo.setAttribute('iB', b);
            return { geo, a, b };
        };
        const mat = lagDyrMateriale(art);
        const naer = lag();
        this.iA = naer.a;
        this.iB = naer.b;
        this.mesh = new THREE.InstancedMesh(naer.geo, mat, n);
        this.mesh.customDepthMaterial = lagDyrDybde(art);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        const fj = lag();
        this.fA = fj.a;
        this.fB = fj.b;
        this.fjern = new THREE.InstancedMesh(fj.geo, mat, n);
        this.fjern.receiveShadow = true;
        for (const m of [this.mesh, this.fjern]) {
            m.name = `dyr:${art}`;
            m.frustumCulled = false;
            m.count = 0;
            m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        }
    }

    /** Skriv dyret inn som instans `i` i den nære eller fjerne meshen. */
    skriv(d: Dyr, naer: boolean, i: number, t: number): void {
        const m = naer ? this.mesh : this.fjern;
        const a = naer ? this.iA : this.fA;
        const b = naer ? this.iB : this.fB;
        _q.setFromAxisAngle(OPP, d.yaw);
        _s.setScalar(1);
        _m.compose(d.pos, _q, _s);
        m.setMatrixAt(i, _m);
        m.setColorAt(i, d.farge);
        a.setXYZW(i, d.fase, Math.min(1, d.fart / LOP[d.art]), d.ned, d.ligg);
        b.setXYZW(i, t + d.frø * 7, d.logre, d.hodeYaw, d.skala);
    }

    ferdig(naer: number, fjern: number): void {
        this.mesh.count = naer;
        this.fjern.count = fjern;
        for (const [m, a, b] of [[this.mesh, this.iA, this.iB], [this.fjern, this.fA, this.fB]] as const) {
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
            a.needsUpdate = true;
            b.needsUpdate = true;
        }
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        this.fjern.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
        this.mesh.customDepthMaterial?.dispose();
    }
}

/** Fargene på pelsen og bustene: noen mørkere, noen lysere [S]. */
const FARGER: Record<Art, number[]> = {
    gris: [0xffffff, 0xd8c8c0, 0x9a8a80, 0xffe0d0],
    hund: [0xffffff, 0x5a5048, 0xe8dcc8, 0x9a7a5a, 0x3a3634],
};

export class Dyrene {
    readonly group = new THREE.Group();
    private readonly flokker: Record<Art, Flokk>;
    private versjon = -1;
    private tid = 0;
    private frø = 7;
    private readonly forrige = new THREE.Vector3();
    private guttFart = 0;
    /** Natt: de fleste ligger (dagsplan.ts gir svaret). */
    natt: () => boolean = () => false;
    /**
     * Lyd fra et dyr (lydkobling via strandliv.ts): grisene grynter mens de roter og snuser, og høyere
     * når de blir skremt; hundene bjeffer når de blir nysgjerrige på gutten eller skremt, og knurrer
     * om natta når han kommer for nær.
     */
    onLyd: (art: Art, hva: 'grynt' | 'skremt' | 'bjeff' | 'knurr', pos: THREE.Vector3) => void = () => undefined;

    constructor() {
        this.flokker = { gris: new Flokk('gris'), hund: new Flokk('hund') };
        for (const f of Object.values(this.flokker)) this.group.add(f.mesh, f.fjern);
        this.group.name = 'dyr';
        if (import.meta.env.DEV) Object.assign(window, { __bryggenDyr: this });
    }

    private rnd(): number {
        this.frø = (this.frø * 16807) % 2147483647;
        return (this.frø - 1) / 2147483646;
    }

    /** Dyrene i områdene som er meldt nå. Kalles når en celle kommer eller går. */
    private fyll(): void {
        const alle = [...soner.values()].flat();
        for (const f of Object.values(this.flokker)) {
            // Behold dyr i områder som fortsatt finnes; nye områder får nye dyr.
            const igjen = f.dyr.filter((d) => alle.includes(d.sone));
            f.dyr.length = 0;
            f.dyr.push(...igjen);
            for (const s of alle) {
                if (s.art !== f.art) continue;
                const har = f.dyr.filter((d) => d.sone === s).length;
                for (let i = har; i < s.antall && f.dyr.length < MAKS[f.art]; i++) f.dyr.push(this.nytt(s));
            }
        }
    }

    private nytt(s: DyreSone): Dyr {
        const p = new THREE.Vector3(s.x0 + this.rnd() * (s.x1 - s.x0), s.y, s.z0 + this.rnd() * (s.z1 - s.z0));
        const farger = FARGER[s.art];
        return {
            art: s.art, sone: s, tilstand: 'sta', pos: p, yaw: this.rnd() * Math.PI * 2, fart: 0, mal: p.clone(),
            tid: this.rnd() * 3, fase: this.rnd(), ned: 0, ligg: 0, logre: 0, hodeYaw: 0,
            skala: s.art === 'gris' ? 0.85 + this.rnd() * 0.3 : 0.9 + this.rnd() * 0.25,
            farge: new THREE.Color(farger[Math.floor(this.rnd() * farger.length)]), frø: this.rnd(),
        };
    }

    private nyttMal(d: Dyr): void {
        const s = d.sone;
        d.mal.set(s.x0 + 0.3 + this.rnd() * (s.x1 - s.x0 - 0.6), s.y, s.z0 + 0.3 + this.rnd() * (s.z1 - s.z0 - 0.6));
    }

    /** Ny tilstand når den gamle er over. */
    private velg(d: Dyr): void {
        const r = this.rnd();
        const natt = this.natt();
        if (natt && r < 0.75) {
            d.tilstand = 'ligge';
            d.tid = 20 + this.rnd() * 30;
        } else if (d.art === 'gris') {
            if (r < 0.45) {
                d.tilstand = 'rusle';
                this.nyttMal(d);
                d.tid = 12;
            } else if (r < 0.85) {
                d.tilstand = 'snuse';
                d.tid = 4 + this.rnd() * 6;
            } else {
                d.tilstand = 'ligge';
                d.tid = 10 + this.rnd() * 15;
            }
        } else if (r < 0.5) {
            d.tilstand = 'rusle';
            this.nyttMal(d);
            d.tid = 10;
        } else if (r < 0.75) {
            d.tilstand = 'snuse';
            d.tid = 2 + this.rnd() * 3;
        } else if (r < 0.9) {
            d.tilstand = 'sta';
            d.tid = 3 + this.rnd() * 4;
        } else {
            d.tilstand = 'ligge';
            d.tid = 8 + this.rnd() * 10;
        }
    }

    /** Kalles hvert bilde. `gutt` er føttene hans, `kamera` der bildet tas fra. */
    update(dt: number, gutt: THREE.Vector3, kamera: THREE.Vector3): void {
        if (versjon !== this.versjon) {
            this.versjon = versjon;
            this.fyll();
        }
        this.tid += dt;
        const dt1 = Math.min(dt, 0.1);
        if (dt1 > 0) {
            const v = Math.hypot(gutt.x - this.forrige.x, gutt.z - this.forrige.z) / dt1;
            this.guttFart += (Math.min(v, 9) - this.guttFart) * Math.min(1, dt1 * 6);
        }
        this.forrige.copy(gutt);
        for (const f of Object.values(this.flokker)) {
            let n = 0;
            let fj = 0;
            for (const d of f.dyr) {
                const dk = d.pos.distanceTo(kamera);
                if (dk > AKTIV_R) continue;
                this.steg(d, dt1, gutt);
                if (dk < SKYGGE_R) f.skriv(d, true, n++, this.tid);
                else f.skriv(d, false, fj++, this.tid);
            }
            f.ferdig(n, fj);
        }
    }

    private steg(d: Dyr, dt: number, gutt: THREE.Vector3): void {
        const art = d.art;
        const dx = gutt.x - d.pos.x;
        const dz = gutt.z - d.pos.z;
        const dg = Math.hypot(dx, dz);
        const sammeHoyde = Math.abs(gutt.y - d.pos.y) < 1.5;
        const lop = this.guttFart > 3.2;
        // Skremt: gutten løper mot dyret, eller kommer helt inntil en gris.
        if (sammeHoyde && d.tilstand !== 'flykte' && ((lop && dg < (art === 'gris' ? 4.5 : 3.2)) || (art === 'gris' && dg < 1.3))) {
            d.tilstand = 'flykte';
            d.tid = 1.6 + this.rnd();
            this.onLyd(art, art === 'gris' ? 'skremt' : 'bjeff', d.pos);
            // Bort fra gutten, litt til siden, innenfor sona.
            const a = Math.atan2(-dx, -dz) + (this.rnd() - 0.5) * 0.9;
            d.mal.set(d.pos.x + Math.sin(a) * 5, d.pos.y, d.pos.z + Math.cos(a) * 5);
        } else if (art === 'hund' && sammeHoyde && !lop && dg < 6 && dg > 2.2 && (d.tilstand === 'sta' || d.tilstand === 'snuse') && !this.natt() && this.rnd() < dt * 0.4) {
            // Hunden blir nysgjerrig og går bort til gutten.
            d.tilstand = 'folge';
            d.tid = 6 + this.rnd() * 4;
            this.onLyd(art, 'bjeff', d.pos);
        } else if (art === 'gris' && (d.tilstand === 'snuse' || d.tilstand === 'rusle') && this.rnd() < dt * 0.09) {
            this.onLyd(art, 'grynt', d.pos);
        } else if (art === 'hund' && sammeHoyde && this.natt() && d.tilstand === 'ligge' && dg < 2.6 && this.rnd() < dt * 0.5) {
            this.onLyd(art, 'knurr', d.pos);
        }
        d.tid -= dt;
        if (d.tid <= 0) this.velg(d);
        const s = d.sone;
        let vil = 0;
        let mot: number | null = null;
        let ned = 0;
        let ligg = 0;
        let logre = 0;
        let hodeYaw = 0;
        if (d.tilstand === 'rusle' || d.tilstand === 'flykte') {
            const mx = d.mal.x - d.pos.x;
            const mz = d.mal.z - d.pos.z;
            const dm = Math.hypot(mx, mz);
            if (dm < 0.3) d.tid = Math.min(d.tid, d.tilstand === 'flykte' ? 0.4 : 0);
            else {
                mot = Math.atan2(mx, mz);
                vil = d.tilstand === 'flykte' ? FART[art].flykte : FART[art].rusle * Math.min(1, dm / 0.6 + 0.3);
            }
            if (art === 'hund' && d.tilstand === 'rusle') ned = 0.25;
        } else if (d.tilstand === 'snuse') {
            ned = 1;
        } else if (d.tilstand === 'ligge') {
            ligg = 1;
        } else if (d.tilstand === 'folge') {
            mot = Math.atan2(dx, dz);
            vil = dg > 1.9 ? FART[art].folge * Math.min(1, (dg - 1.8) / 1.2) : 0;
            logre = 1;
            if (dg > 9) d.tid = 0;
        } else if (art === 'hund' && sammeHoyde && dg < 7) {
            // Står og ser på gutten (hodet dreid mot ham, så langt det går).
            const rel = Math.atan2(Math.sin(Math.atan2(dx, dz) - d.yaw), Math.cos(Math.atan2(dx, dz) - d.yaw));
            hodeYaw = THREE.MathUtils.clamp(rel, -1, 1);
            logre = 0.4;
        }
        if (mot !== null && vil > 0.05) {
            const diff = Math.atan2(Math.sin(mot - d.yaw), Math.cos(mot - d.yaw));
            const sving = d.tilstand === 'flykte' ? 7 : 3;
            d.yaw += THREE.MathUtils.clamp(diff, -sving * dt, sving * dt);
            vil *= Math.max(0, Math.cos(diff)) * 0.8 + 0.2;
        } else if (d.tilstand === 'folge') {
            // Står ved gutten: snur seg mot ham.
            const a = Math.atan2(dx, dz);
            const diff = Math.atan2(Math.sin(a - d.yaw), Math.cos(a - d.yaw));
            d.yaw += THREE.MathUtils.clamp(diff, -3 * dt, 3 * dt);
        }
        d.fart += THREE.MathUtils.clamp(vil - d.fart, -6 * dt, 4 * dt);
        if (ligg > 0) d.fart = Math.max(0, d.fart - 4 * dt);
        d.pos.x += Math.sin(d.yaw) * d.fart * dt;
        d.pos.z += Math.cos(d.yaw) * d.fart * dt;
        // Kanten av sona er en usynlig vegg; treffer den kanten på flukt, snur den.
        const fx = THREE.MathUtils.clamp(d.pos.x, s.x0, s.x1);
        const fz = THREE.MathUtils.clamp(d.pos.z, s.z0, s.z1);
        if ((fx !== d.pos.x || fz !== d.pos.z) && d.tilstand === 'flykte') d.mal.set(s.x0 + (s.x1 - s.x0) * this.rnd(), s.y, s.z0 + (s.z1 - s.z0) * this.rnd());
        d.pos.x = fx;
        d.pos.z = fz;
        d.pos.y = s.y;
        // Gangen: fasen følger strekningen.
        d.fase = (d.fase + (d.fart * dt) / (STEG[art] * (d.fart > 1.6 ? 1.6 : 1))) % 1;
        const k = Math.min(1, dt * 4);
        d.ned += (ned - d.ned) * k;
        d.ligg += (ligg - d.ligg) * Math.min(1, dt * 2);
        d.logre += (logre - d.logre) * k;
        d.hodeYaw += (hodeYaw - d.hodeYaw) * k;
    }

    dispose(): void {
        for (const f of Object.values(this.flokker)) f.dispose();
    }
}
