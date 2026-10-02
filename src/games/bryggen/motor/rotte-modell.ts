// Rotta som modell: en svartrotte på ca. 22 cm pluss en hale som er lengre enn kroppen, laget i
// kode og animert i vertex-shaderen (ingen skjelett, ingen klipp).
//
// Svartrotte, ikke brunrotte: svartrotta kom til Norge tidlig på 1200-tallet eller før, brunrotta
// først omkring 1750 (SNL: «svartrotte», «brunrotte»). Svartrotta er slankere, har lengre hale,
// større ører og spissere snute, og er mørk grå til gråbrun.
//
// Kroppen er en loftet spindel med flat buk og spiss snute, ørene er skåler, og halen er et
// smalnende rør. Hvert hjørnepunkt vet hvilken del det hører til (`aDel`): kropp, hode, hale
// eller ett av de fire beina. Hver rotte sender sin egen gangfase, fart, snusing, hodevridning,
// hvor mye den reiser seg, halekrøll og tid (`iA`, `iB`), og shaderen bøyer delene etter det:
// beina svinger i trav (diagonalt) når den rusler og i sprang (parvis) når den piler, kroppen
// strekker og krummer seg i spranget, hodet snuser, og halen ligger slapp i en bue når den står
// og strekker seg rett bak når den løper.
//
// Pelsen er støy i fargen (lange strå langs kroppen), regnet ut i pikselen.
import * as THREE from 'three';

/** Delene i `aDel.x`. */
const KROPP = 0;
const HODE = 1;
const HALE = 2;
const BEN = 3;

/** Lengden på halen (meter). Svartrotta har halen lengre enn kroppen. */
const HALE_L = 0.26;

export function lagRotteMateriale(): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 });
    mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', `#include <common>\n${ROTTE_GLSL}`)
            .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = rotteRot(position) * objectNormal;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = rotte(position);\nvRotte = position;\nvPels = aDel.w;');
        sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', `#include <common>\n${PELS_GLSL}`)
            .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= pels();')
            // Pelsen lyser litt i kanten (strå mot lyset), så rotta skiller seg fra et mørkt golv.
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.18 * vPels * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.5);');
    };
    mat.customProgramCacheKey = () => 'bryggen-rotte';
    return mat;
}

const ROTTE_GLSL = /* glsl */ `
attribute vec4 aDel; // del, ben (0 FV, 1 FH, 2 BV, 3 BH), halens t (0-1) eller fot (1), pels (0-1)
attribute vec4 iA;   // gangfase (0-1), løp (0-1), snusing (0-1), hodevridning (rad)
attribute vec4 iB;   // reiser seg (0-1), halekrøll (-1..1), tid (s), bevegelse (0-1)
varying vec3 vRotte;
varying float vPels;
const float TAU = 6.2831853;
mat3 rX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
float hodeVekt(vec3 p) {
    if (aDel.x > 0.5 && aDel.x < 1.5) return 1.0;
    if (aDel.x < 0.5) return smoothstep(0.03, 0.068, p.z);
    return 0.0;
}
float hodePitch() {
    float t = iB.z;
    // Snusing: raske små nikk med nesa, og litt opp. Når den løper, holdes hodet lavt.
    float snus = iA.z * (0.06 * sin(t * 16.0) + 0.035 * sin(t * 6.3 + 1.0) - 0.06);
    return snus + iA.y * 0.12 - iB.x * 0.3;
}
// Svingen i beinet: trav (diagonale par) når den går, sprang (parvis) når den løper.
float benFase() {
    float b = aDel.y;
    float trav = (b < 0.5 || b > 2.5) ? 0.0 : 0.5;
    float sprang = b < 1.5 ? (b < 0.5 ? 0.0 : 0.08) : (b < 2.5 ? 0.5 : 0.58);
    return (iA.x + mix(trav, sprang, iA.y)) * TAU;
}
float benVinkel() {
    float amp = iB.w * mix(0.42, 0.72, iA.y);
    float a = amp * sin(benFase());
    float b = aDel.y;
    // Reiser den seg, folder forbeina seg opp under brystet.
    if (b < 1.5) a -= iB.x * 1.2;
    return a;
}
float reisVinkel() {
    if (aDel.x > 2.5 && aDel.y > 1.5) return 0.0; // bakbeina står på golvet
    float a = -iB.x * 0.95;
    if (aDel.x > 1.5 && aDel.x < 2.5) a *= 1.0 - aDel.z;
    return a;
}
mat3 rotteRot(vec3 p) {
    mat3 m = rX(reisVinkel());
    // Foten holdes nesten vannrett mens beinet svinger.
    if (aDel.x > 2.5) return m * rX(benVinkel() * (aDel.z > 0.5 ? 0.2 : 1.0));
    float w = hodeVekt(p);
    return m * rY(iA.w * w) * rX(hodePitch() * w);
}
vec3 rotte(vec3 p) {
    vec3 q = p;
    float fase = iA.x * TAU;
    float lop = iA.y;
    float tid = iB.z;
    float bev = iB.w;
    // Spranget: kroppen strekker seg og krummer ryggen i takt med beina.
    float strekk = 1.0 + lop * bev * 0.11 * sin(fase);
    if (aDel.x > 1.5 && aDel.x < 2.5) {
        // Halen: en sentrallinje fra rumpa og bakover. Tverrsnittet ligger i p.xy.
        float t = aDel.z;
        float s = t * ${HALE_L.toFixed(3)} * mix(1.0, 1.06, lop);
        float slapp = 0.04 * pow(1.0 - t, 1.6) + 0.004;
        float rett = 0.04 - 0.016 * t;
        float y = mix(slapp, rett, lop);
        float bolge = sin(t * 5.0 - tid * mix(1.6, 10.0, bev)) * mix(0.03, 0.01, lop) * t;
        float bue = iB.y * 0.075 * t * t * (1.0 - lop * 0.8);
        q = vec3(p.x + bolge + bue, y + p.y - 0.04, -0.112 - s);
    } else if (aDel.x > 2.5) {
        bool front = aDel.y < 1.5;
        vec3 hofte = front ? vec3(0.0, 0.045, 0.036) : vec3(0.0, 0.05, -0.064);
        float a = benVinkel();
        if (aDel.z > 0.5) {
            // Foten: følger ankelen, men vipper bare litt (ellers står den som en pinne).
            vec3 ankel = front ? vec3(0.0, 0.006, 0.044) : vec3(0.0, 0.006, -0.058);
            vec3 ny = hofte + rX(a) * (ankel - hofte);
            q = ny + rX(a * 0.2) * (p - ankel);
        } else q = hofte + rX(a) * (p - hofte);
        // Foten løftes når beinet svinger fram.
        q.y += max(0.0, cos(benFase())) * mix(0.008, 0.016, lop) * bev;
    } else {
        vec3 nakke = vec3(0.0, 0.054, 0.048);
        float w = hodeVekt(p);
        q = nakke + rY(iA.w * w) * rX(hodePitch() * w) * (q - nakke);
        // Nesetippen dirrer når den snuser.
        if (p.z > 0.105) q.y += iA.z * 0.0025 * sin(tid * 41.0);
        float rygg = 1.0 - clamp(abs(p.z + 0.02) / 0.12, 0.0, 1.0);
        q.y += lop * bev * 0.012 * cos(fase) * rygg * step(0.02, p.y);
        q.y += bev * (1.0 - lop) * 0.003 * abs(sin(fase * 2.0));
    }
    q.z *= strekk;
    // Reiser seg på bakbeina: alt unntatt bakbeina vippes opp rundt hoftene.
    vec3 bak = vec3(0.0, 0.02, -0.07);
    q = bak + rX(reisVinkel()) * (q - bak);
    return q;
}
`;

const PELS_GLSL = /* glsl */ `
varying vec3 vRotte;
varying float vPels;
float rHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float rStoy(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(rHash(i), rHash(i + vec3(1, 0, 0)), f.x), mix(rHash(i + vec3(0, 1, 0)), rHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(rHash(i + vec3(0, 0, 1)), rHash(i + vec3(1, 0, 1)), f.x), mix(rHash(i + vec3(0, 1, 1)), rHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
vec3 pels() {
    // Strå: fin støy på tvers, lang langs kroppen. Pluss flekker i pelsen.
    float straa = rStoy(vRotte * vec3(820.0, 820.0, 150.0));
    float flekk = rStoy(vRotte * 90.0);
    float k = 0.74 + 0.4 * straa + 0.14 * (flekk - 0.5);
    return vec3(mix(1.0, k, vPels));
}
`;

interface Bygger {
    pos: number[];
    col: number[];
    del: number[];
    idx: number[];
}

/** Ett hjørnepunkt. Returnerer indeksen. */
function v(b: Bygger, p: number[], c: THREE.Color, del: number[]): number {
    b.pos.push(p[0], p[1], p[2]);
    b.col.push(c.r, c.g, c.b);
    b.del.push(...del);
    return b.pos.length / 3 - 1;
}

/**
 * Én rotte i meter, nesa mot +z, golvet i y = 0. Ca. 900 trekanter.
 * Indeksert geometri, så normalene blir glatte over kroppen.
 */
export function lagRotteGeometri(): THREE.BufferGeometry {
    const b: Bygger = { pos: [], col: [], del: [], idx: [] };
    const rygg = new THREE.Color(0x3e3935);
    const side = new THREE.Color(0x4f4943);
    const buk = new THREE.Color(0x7e766c);
    const snute = new THREE.Color(0x8a6c64);
    const rosa = new THREE.Color(0xc99a90);
    const svart = new THREE.Color(0x0b0a0a);
    const hale = new THREE.Color(0x7d6862);

    // ── Kroppen: tverrsnitt fra rumpa til nesa (z, halv bredde, halv høyde, senter y) ──
    const st: [number, number, number, number][] = [
        [-0.118, 0.012, 0.012, 0.042],
        [-0.108, 0.03, 0.032, 0.048],
        [-0.088, 0.044, 0.045, 0.054],
        [-0.06, 0.048, 0.05, 0.057],
        [-0.03, 0.046, 0.047, 0.056],
        [0.0, 0.042, 0.043, 0.054],
        [0.03, 0.035, 0.037, 0.053],
        [0.05, 0.03, 0.032, 0.055],
        [0.066, 0.027, 0.029, 0.057],
        [0.082, 0.022, 0.024, 0.056],
        [0.098, 0.016, 0.018, 0.052],
        [0.112, 0.01, 0.012, 0.048],
        [0.123, 0.005, 0.006, 0.045],
    ];
    const SEG = 14;
    const ringer: number[][] = [];
    for (const [z, rx, ry, cy] of st) {
        const ring: number[] = [];
        const nese = z > 0.09;
        for (let k = 0; k < SEG; k++) {
            const a = (k / SEG) * Math.PI * 2;
            const c = Math.cos(a);
            const s = Math.sin(a);
            // Flat buk: undersida trykkes inn.
            const y = cy + s * ry * (s < 0 ? 0.72 : 1);
            const x = c * rx * 0.9;
            // Farge etter hvor på ringen: mørk rygg, lysere sider, lys buk, rosa snute.
            const opp = s;
            const f = opp > 0.45 ? rygg : opp > -0.35 ? side : buk;
            const farge = nese && z > 0.11 ? snute : f;
            ring.push(v(b, [x, y, z], farge, [KROPP, 0, 0, z > 0.115 ? 0.2 : 1]));
        }
        ringer.push(ring);
    }
    for (let r = 0; r < ringer.length - 1; r++) {
        for (let k = 0; k < SEG; k++) {
            const a = ringer[r][k];
            const bb = ringer[r][(k + 1) % SEG];
            const c = ringer[r + 1][(k + 1) % SEG];
            const d = ringer[r + 1][k];
            b.idx.push(a, c, d, a, bb, c);
        }
    }
    // Lokk bak og nesetipp foran.
    const bakPkt = v(b, [0, 0.042, -0.122], rygg, [KROPP, 0, 0, 1]);
    for (let k = 0; k < SEG; k++) b.idx.push(bakPkt, ringer[0][(k + 1) % SEG], ringer[0][k]);
    const nesa = v(b, [0, 0.044, 0.129], rosa, [KROPP, 0, 0, 0]);
    const siste = ringer[ringer.length - 1];
    for (let k = 0; k < SEG; k++) b.idx.push(nesa, siste[k], siste[(k + 1) % SEG]);

    // ── Øynene: små svarte kuler som stikker litt ut ──
    for (const sx of [-1, 1]) kule(b, [sx * 0.0215, 0.064, 0.077], 0.0058, svart, [HODE, 0, 0, 0]);

    // ── Ørene: skåler, litt bakover og ut ──
    for (const sx of [-1, 1]) ore(b, sx, rosa, side);

    // ── Værhår: tynne strå ut fra snuten, begge sider av flata ──
    const haar = new THREE.Color(0xc9c2b8);
    for (const sx of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
            const o = [sx * 0.009, 0.046 + i * 0.003, 0.113 - i * 0.002];
            const ut = [sx * (0.055 + i * 0.006), 0.05 + (i - 1.5) * 0.012, 0.098 - i * 0.008];
            const a = v(b, o, haar, [HODE, 0, 0, 0]);
            const c = v(b, [o[0], o[1] + 0.0012, o[2]], haar, [HODE, 0, 0, 0]);
            const d = v(b, ut, haar, [HODE, 0, 0, 0]);
            b.idx.push(a, c, d, a, d, c);
        }
    }

    // ── Beina: fra hofta/skuldra ned til en rosa fot ──
    const ben: [number, number, number, number, number][] = [
        // ben-id, x, z (ved golvet), hofte-y, tykkelse
        [0, -0.019, 0.042, 0.045, 0.009],
        [1, 0.019, 0.042, 0.045, 0.009],
        [2, -0.03, -0.05, 0.05, 0.013],
        [3, 0.03, -0.05, 0.05, 0.013],
    ];
    for (const [id, x, z, hy, r] of ben) {
        const bak = id >= 2;
        // Bakbeinet har lår (inne i kroppen) og en legg som går skrått fram til hælen.
        const topp = [x, hy, bak ? z - 0.016 : z];
        const kne = [x * 1.05, 0.006, bak ? z - 0.008 : z + 0.002];
        ror(b, topp, kne, r * 1.15, r * 0.55, side, [BEN, id, 0, 1]);
        const fotL = bak ? 0.028 : 0.016;
        fot(b, [x * 1.08, 0.003, kne[2] + (bak ? -0.004 : 0)], fotL, bak ? 0.011 : 0.009, rosa, [BEN, id, 1, 0]);
    }

    // ── Halen: smalnende rør. Shaderen legger den ut på nytt fra tverrsnittet (x, y - 0,04) og t ──
    const HSEG = 6;
    const HRING = 16;
    const halering: number[][] = [];
    for (let i = 0; i <= HRING; i++) {
        const t = i / HRING;
        const r = THREE.MathUtils.lerp(0.0105, 0.0026, Math.pow(t, 0.85));
        const ring: number[] = [];
        // Skjell-ringer: annenhver ring litt mørkere.
        const f = hale.clone().multiplyScalar(i % 2 ? 0.9 : 1.04);
        for (let k = 0; k < HSEG; k++) {
            const a = (k / HSEG) * Math.PI * 2;
            ring.push(v(b, [Math.cos(a) * r, Math.sin(a) * r + 0.04, -0.112 - t * HALE_L], f, [HALE, 0, t, 0.15]));
        }
        halering.push(ring);
    }
    for (let i = 0; i < HRING; i++) {
        for (let k = 0; k < HSEG; k++) {
            const a = halering[i][k];
            const bb = halering[i][(k + 1) % HSEG];
            const c = halering[i + 1][(k + 1) % HSEG];
            const d = halering[i + 1][k];
            b.idx.push(a, c, bb, a, d, c);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
    geo.setAttribute('aDel', new THREE.Float32BufferAttribute(b.del, 4));
    geo.setIndex(b.idx);
    geo.computeVertexNormals();
    return geo;
}

/** En liten kule (oktaeder delt én gang). */
function kule(b: Bygger, c: number[], r: number, farge: THREE.Color, del: number[]): void {
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const i0 = b.pos.length / 3;
    for (const d of dirs) v(b, [c[0] + d[0] * r, c[1] + d[1] * r, c[2] + d[2] * r], farge, del);
    const f = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]];
    for (const [a, bb, cc] of f) b.idx.push(i0 + a, i0 + bb, i0 + cc);
}

/** Øret: en skål av to ringer, rosa inni og pelsfarget utenpå. */
function ore(b: Bygger, sx: number, inni: THREE.Color, utenpa: THREE.Color): void {
    const senter = new THREE.Vector3(sx * 0.02, 0.079, 0.062);
    // Øret vender fram og ut, vippet litt bakover.
    const fram = new THREE.Vector3(sx * 0.55, 0.15, 1).normalize();
    const opp = new THREE.Vector3(0, 1, -0.25).normalize();
    const hoyre = new THREE.Vector3().crossVectors(opp, fram).normalize();
    const N = 9;
    const r = 0.0195;
    const pkt = (a: number, k: number, dybde: number) =>
        senter.clone()
            .addScaledVector(hoyre, Math.cos(a) * r * k)
            .addScaledVector(opp, Math.sin(a) * r * k * 1.1 + r * 0.25)
            .addScaledVector(fram, -dybde);
    // Bunnen av øret går inn i hodet: halvsirkelen starter litt under midten.
    const a0 = -0.35;
    const a1 = Math.PI + 0.35;
    for (const [farge, flip, skyv] of [[inni, false, 0], [utenpa, true, -0.0012]] as const) {
        const i0 = b.pos.length / 3;
        const mid = v(b, pkt(0, 0, 0.004 + skyv).toArray(), farge, [HODE, 0, 0, flip ? 0.6 : 0]);
        for (let i = 0; i <= N; i++) {
            const a = a0 + ((a1 - a0) * i) / N;
            v(b, pkt(a, 1, skyv).toArray(), farge, [HODE, 0, 0, flip ? 0.6 : 0]);
        }
        for (let i = 0; i < N; i++) {
            if (flip) b.idx.push(mid, i0 + 2 + i, i0 + 1 + i);
            else b.idx.push(mid, i0 + 1 + i, i0 + 2 + i);
        }
    }
}

/** Et smalnende rør fra a til b (beina). */
function ror(b: Bygger, a: number[], c: number[], ra: number, rc: number, farge: THREE.Color, del: number[]): void {
    const A = new THREE.Vector3(...a);
    const C = new THREE.Vector3(...c);
    const dir = C.clone().sub(A).normalize();
    const u = new THREE.Vector3(1, 0, 0).cross(dir).normalize();
    const w = new THREE.Vector3().crossVectors(dir, u).normalize();
    const S = 6;
    const i0 = b.pos.length / 3;
    for (const [P, r] of [[A, ra], [C, rc]] as const) {
        for (let k = 0; k < S; k++) {
            const t = (k / S) * Math.PI * 2;
            const p = P.clone().addScaledVector(u, Math.cos(t) * r).addScaledVector(w, Math.sin(t) * r);
            v(b, p.toArray(), farge, del);
        }
    }
    for (let k = 0; k < S; k++) {
        const k1 = (k + 1) % S;
        b.idx.push(i0 + k, i0 + S + k1, i0 + S + k, i0 + k, i0 + k1, i0 + S + k1);
    }
}

/** Foten: en flat, spiss labb med tær framover. */
function fot(b: Bygger, p: number[], len: number, bredde: number, farge: THREE.Color, del: number[]): void {
    const [x, y, z] = p;
    const h = 0.004;
    const pts = [
        [x - bredde / 2, y, z - len * 0.3], [x + bredde / 2, y, z - len * 0.3],
        [x + bredde / 2, y, z + len * 0.55], [x, y, z + len * 0.75], [x - bredde / 2, y, z + len * 0.55],
    ];
    const i0 = b.pos.length / 3;
    for (const q of pts) v(b, [q[0], q[1] + h, q[2]], farge, del);
    for (const q of pts) v(b, [q[0], q[1] - h * 0.5, q[2]], farge, del);
    b.idx.push(i0, i0 + 2, i0 + 1, i0, i0 + 4, i0 + 2, i0 + 4, i0 + 3, i0 + 2);
    for (let k = 0; k < 5; k++) {
        const k1 = (k + 1) % 5;
        b.idx.push(i0 + k, i0 + k1, i0 + 5 + k1, i0 + k, i0 + 5 + k1, i0 + 5 + k);
    }
}
