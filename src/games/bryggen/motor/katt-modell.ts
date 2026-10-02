// Katten som modell: en huskatt på ca. 45 cm pluss halen, laget i kode og animert i
// vertex-shaderen (ingen skjelett, ingen klipp), i samme teknikk som rotta (rotte-modell.ts).
//
// Kroppen og hodet er loftede tverrsnitt, ørene er små pyramider, beina er rør med ett ledd, og
// halen er et rør som shaderen legger ut langs en kurve. Hvert hjørnepunkt vet hvilken del det
// hører til (`aDel`): kropp, hode, hale, bein eller labb. Hver katt sender gangfase, fart,
// hvor lavt den lusker, hvor mye den sitter, sover eller kaster seg, hodet, vasking og halen
// (`iA`, `iB`, `iC`), og shaderen bøyer delene etter det:
//
// - Beina står med foten der shaderen vil ha den (tostykkes IK i beinets plan, leddet bakover):
//   skritt i passgang-rekkefølge når den går (bakbein, forbein på samme side), parvis når den
//   løper, foldet under når den ligger, strukket fram og bak i kastet.
// - Sitter: kroppen vippes opp rundt rumpa og senkes, forbeina strekkes, hodet holdes vannrett.
// - Sover: ryggraden bøyes rundt en loddrett akse, så katta ligger i en ring med halen rundt.
// - Halen: står opp med en krok på tuppen når den rusler, ligger lavt og dirrer i tuppen når den
//   lusker, krøller seg rundt beina når den sitter, og svaier hele tida.
//
// Pelsen er støy i pikselen, med tabbystriper på tvers av kroppen og halen og bånd på beina.
// Fargen per katt kommer fra `iF` (ikke instanceColor, ellers ville øynene og nesa blitt farget).
import * as THREE from 'three';

const KROPP = 0;
const HODE = 1;
const HALE = 2;
const BEN = 3;
const LABB = 4;

/** Lengden på halen (meter). */
const HALE_L = 0.28;

/** Felles for fargepasset og skyggepasset: delene beveges likt i begge. */
const KATT_GLSL = /* glsl */ `
attribute vec4 aDel; // del, ben-id (0 FV, 1 FH, 2 BV, 3 BH), ledd (ben: 0 lår, 0,5 kne, 1 legg) eller halens t, pels
attribute vec4 iA;   // gangfase (0-1), løp (0-1), bevegelse (0-1), tid (s)
attribute vec4 iB;   // lusker (0-1), sitter (0-1), sover (0-1), kaster seg (0-1)
attribute vec4 iC;   // hodevridning (rad), hodenikk (rad), vasker seg (0-1), halen opp (0-1)
mat3 kRot;
const float TAU = 6.2831853;
mat3 rX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
float krollK() { return iB.z * 8.5; }

// Kroppen: strekk i løpet, krøll når den sover, vippet opp når den sitter, senket.
vec3 kropp(vec3 p, out mat3 R) {
    vec3 q = p;
    R = mat3(1.0);
    float lop = iA.y * iA.z;
    float fase = iA.x * TAU;
    q.z *= 1.0 + lop * 0.07 * sin(fase) + iB.w * 0.08;
    float rygg = 1.0 - clamp(abs(p.z + 0.02) / 0.2, 0.0, 1.0);
    q.y += lop * 0.014 * cos(fase) * rygg;
    float k = krollK();
    if (k > 0.001) {
        // Bøyd rundt en loddrett akse på +x-siden: rumpa og hodet møtes i en ring.
        float th = k * q.z;
        float c = cos(th), s = sin(th);
        q = vec3(q.x * c + (1.0 - c) / k, q.y, s / k - q.x * s);
        R = rY(th);
    }
    float b = -0.5 * iB.y;
    vec3 piv = vec3(0.0, 0.13, -0.19);
    q = piv + rX(b) * (q - piv);
    R = rX(b) * R;
    q.y -= iB.x * 0.065 + iB.y * 0.1 + iB.z * 0.105;
    // Pusten når den sover: ryggen hever og senker seg.
    q.y += iB.z * 0.005 * sin(iA.w * 1.9) * clamp((p.y - 0.12) / 0.1, 0.0, 1.0);
    return q;
}

vec3 hode(vec3 p, out mat3 R) {
    vec3 n = vec3(0.0, 0.235, 0.165);
    // Hodet holdes vannrett når kroppen vippes opp; lavt fram når den lusker; ned på labbene når den sover.
    float slikk = iC.z * (0.1 * sin(iA.w * 9.0) + 0.05);
    float pitch = iC.y + iB.y * 0.5 + iB.x * 0.2 + iB.z * 0.55 + slikk;
    mat3 H = rY(iC.x) * rX(pitch);
    vec3 q = n + H * (p - n);
    // Lusker: halsen strekkes fram.
    q.z += iB.x * 0.02;
    mat3 Rk;
    vec3 r = kropp(q, Rk);
    R = Rk * H;
    return r;
}

float hP0, hPK, hKrok, hYK, hSv, hVipp;
void haleStilling() {
    float opp = iC.w;
    float lop = iA.y * iA.z;
    hP0 = mix(-0.4, 1.2, opp);
    hPK = mix(0.35, 0.5, opp);
    hP0 = mix(hP0, -0.1, lop); hPK = mix(hPK, 0.1, lop);
    hP0 = mix(hP0, -0.15, iB.x); hPK = mix(hPK, 0.1, iB.x);
    hP0 = mix(hP0, -1.1, iB.y); hPK = mix(hPK, 1.1, iB.y);
    hP0 = mix(hP0, -0.7, iB.z); hPK = mix(hPK, 0.7, iB.z);
    hP0 = mix(hP0, 0.2, iB.w); hPK = mix(hPK, 0.0, iB.w);
    hKrok = opp * (1.0 - iB.y) * (1.0 - iB.z) * (1.0 - lop) * (1.0 - iB.x);
    hYK = 2.8 * iB.y + 2.4 * iB.z;
    hSv = mix(0.22, 0.06, lop) * (1.0 - iB.z * 0.85) * (1.0 - iB.y * 0.6);
    hVipp = 0.06 + iB.x * 0.5 + iB.y * 0.15;
}
float haleYaw(float u) {
    float t = iA.w;
    return hYK * u + hSv * sin(u * 2.8 - t * 1.6) * u + hVipp * smoothstep(0.55, 1.0, u) * sin(t * 7.0 + u * 4.0);
}
vec3 haleRetning(float u) {
    float p = hP0 + hPK * u - hKrok * 2.4 * smoothstep(0.68, 1.0, u);
    float y = haleYaw(u);
    return vec3(sin(y) * cos(p), sin(p), -cos(y) * cos(p));
}
vec3 hale(vec3 p, out mat3 R) {
    vec3 b0 = vec3(0.0, 0.2, -0.205);
    float t = aDel.z;
    haleStilling();
    const int N = 12;
    float tt = t * float(N);
    float stp = ${HALE_L.toFixed(3)} / float(N);
    vec3 c = vec3(0.0);
    for (int i = 0; i < N; i++) {
        float fi = float(i);
        if (fi >= tt) break;
        float seg = min(1.0, tt - fi);
        c += haleRetning((fi + 0.5 * seg) / float(N)) * stp * seg;
    }
    vec3 T = haleRetning(t);
    float y = haleYaw(t);
    vec3 S = vec3(cos(y), 0.0, sin(y));
    vec3 U = normalize(cross(-T, S));
    mat3 M = mat3(S, U, -T);
    mat3 Rb;
    vec3 B = kropp(b0, Rb);
    vec3 q = B + Rb * (c + M * vec3(p.x, p.y - 0.2, 0.0));
    q.y = max(q.y, 0.004);
    R = Rb * M;
    return q;
}

// Hvor foten skal stå, i beinets plan (z fram, y opp) målt fra hofta.
vec2 malFot(float id, bool front, float hy) {
    float lop = iA.y;
    float gang = id < 0.5 ? 0.25 : id < 1.5 ? 0.75 : id < 2.5 ? 0.0 : 0.5;
    float galopp = id < 0.5 ? 0.0 : id < 1.5 ? 0.1 : id < 2.5 ? 0.5 : 0.6;
    float ph = fract(iA.x + mix(gang, galopp, lop));
    float sig = mix(0.5, 0.36, lop);
    float A = mix(0.06, 0.13, lop) * iA.z;
    float fz = 0.0;
    float loft = 0.0;
    if (ph < sig) fz = A * (1.0 - 2.0 * ph / sig);
    else {
        float u = (ph - sig) / (1.0 - sig);
        fz = -A + 2.0 * A * smoothstep(0.0, 1.0, u);
        loft = sin(u * 3.14159) * mix(0.03, 0.055, lop) * iA.z;
    }
    vec2 f = vec2(fz, -hy + loft);
    f = mix(f, vec2(front ? 0.035 : 0.075, -hy), iB.y);
    f = mix(f, vec2(front ? 0.08 : 0.07, -hy + 0.012), iB.z);
    // Vasker seg: venstre forlabb opp mot munnen.
    if (id < 0.5) f = mix(f, vec2(0.075, 0.035 + 0.012 * sin(iA.w * 9.0)), iC.z);
    f = mix(f, front ? vec2(0.17, -hy * 0.45) : vec2(-0.19, -hy * 0.55), iB.w);
    return f;
}

vec3 ben(vec3 p, out mat3 R) {
    float id = aDel.y;
    bool front = id < 1.5;
    float sx = (id < 0.5 || (id > 1.5 && id < 2.5)) ? 1.0 : -1.0;
    vec3 h0 = front ? vec3(0.034 * sx, 0.17, 0.10) : vec3(0.04 * sx, 0.18, -0.15);
    float L1r = front ? 0.09 : 0.11;
    float L2r = front ? 0.085 : 0.08;
    float sc = 1.0 + (front ? 0.2 * iB.y : 0.0) + 0.08 * iB.w;
    float L1 = L1r * sc;
    float L2 = L2r * sc;
    mat3 Rh;
    vec3 H = kropp(h0, Rh);
    mat3 Y = rY(krollK() * h0.z);
    vec2 f = malFot(id, front, H.y);
    // To ledd, leddet bakover (albuen foran, hasen bak).
    float d = clamp(length(f), abs(L1 - L2) + 0.004, L1 + L2 - 0.001);
    float phi = atan(f.x, -f.y);
    float al = acos(clamp((L1 * L1 + d * d - L2 * L2) / (2.0 * L1 * d), -1.0, 1.0));
    float p1 = phi - al;
    vec2 kne = L1 * vec2(sin(p1), -cos(p1));
    vec2 fot = d * vec2(sin(phi), -cos(phi));
    float p2 = atan(fot.x - kne.x, -(fot.y - kne.y));
    vec3 o = p - h0;
    vec3 l;
    if (aDel.x > 3.5) {
        l = vec3(0.0, fot.y, fot.x) + (o - vec3(0.0, -(L1r + L2r), 0.0));
        R = Y;
    } else if (aDel.z < 0.25) {
        mat3 M = rX(-p1);
        l = M * vec3(o.x, o.y * sc, o.z);
        R = Y * M;
    } else if (aDel.z < 0.75) {
        mat3 M = rX(-(p1 + p2) * 0.5);
        l = vec3(0.0, kne.y, kne.x) + M * vec3(o.x, 0.0, o.z);
        R = Y * M;
    } else {
        mat3 M = rX(-p2);
        l = vec3(0.0, kne.y, kne.x) + M * vec3(o.x, (o.y + L1r) * sc, o.z);
        R = Y * M;
    }
    return H + Y * l;
}

vec3 katt(vec3 p) {
    mat3 R;
    vec3 q;
    if (aDel.x < 0.5) q = kropp(p, R);
    else if (aDel.x < 1.5) q = hode(p, R);
    else if (aDel.x < 2.5) q = hale(p, R);
    else q = ben(p, R);
    kRot = R;
    return q;
}
`;

const PELS_GLSL = /* glsl */ `
varying vec3 vKatt;
varying float vPels;
varying float vDel;
varying vec4 vFarge;
float kHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float kStoy(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(kHash(i), kHash(i + vec3(1, 0, 0)), f.x), mix(kHash(i + vec3(0, 1, 0)), kHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(kHash(i + vec3(0, 0, 1)), kHash(i + vec3(1, 0, 1)), f.x), mix(kHash(i + vec3(0, 1, 1)), kHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
vec3 pels() {
    float straa = kStoy(vKatt * vec3(700.0, 700.0, 220.0));
    float flekk = kStoy(vKatt * 70.0);
    // Tabbystriper: bånd på tvers av kroppen og halen, ringer på beina, tynnere på hodet.
    float akse = vDel > 2.5 ? vKatt.y * 1.3 : vDel > 0.5 && vDel < 1.5 ? vKatt.z * 1.8 + vKatt.y : vKatt.z;
    float st = sin(akse * 105.0 + kStoy(vKatt * 22.0) * 6.0);
    float stripe = smoothstep(0.3, 0.85, st) * vFarge.a;
    float k = (0.8 + 0.32 * straa + 0.12 * (flekk - 0.5)) * (1.0 - 0.42 * stripe);
    vec3 f = mix(vec3(1.0), vFarge.rgb, step(0.5, vPels));
    return f * mix(1.0, k, vPels);
}
`;

export function lagKattMateriale(): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
    mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', `#include <common>\n${KATT_GLSL}\nattribute vec4 iF;\nvarying vec3 vKatt;\nvarying float vPels;\nvarying float vDel;\nvarying vec4 vFarge;`)
            .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nkatt(position);\nobjectNormal = kRot * objectNormal;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = katt(position);\nvKatt = position;\nvPels = aDel.w;\nvDel = aDel.x;\nvFarge = iF;');
        sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', `#include <common>\n${PELS_GLSL}`)
            .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= pels();')
            // Pelsen lyser litt i kanten (strå mot lyset), så katta skiller seg fra et mørkt golv.
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.1 * vPels * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.5);');
    };
    mat.customProgramCacheKey = () => 'bryggen-katt';
    return mat;
}

/** Skyggen følger stillingen (ellers kaster en sovende katt skyggen av en stående). */
export function lagKattDybde(): THREE.MeshDepthMaterial {
    const mat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', `#include <common>\n${KATT_GLSL}`)
            .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = katt(position);');
    };
    mat.customProgramCacheKey = () => 'bryggen-katt-dybde';
    return mat;
}

interface Bygger {
    pos: number[];
    col: number[];
    del: number[];
    idx: number[];
}

function v(b: Bygger, p: ArrayLike<number>, c: THREE.Color, del: number[]): number {
    b.pos.push(p[0], p[1], p[2]);
    b.col.push(c.r, c.g, c.b);
    b.del.push(...del);
    return b.pos.length / 3 - 1;
}

/** Tverrsnitt: z, halv bredde, halv høyde, senter y. */
type Snitt = [number, number, number, number];

/** Loftet kropp av ellipse-ringer langs z, med lokk bak og spiss foran. */
function loft(b: Bygger, st: Snitt[], seg: number, farge: (z: number, s: number) => THREE.Color, del: number[], bak: number[], fram: number[]): void {
    const ringer: number[][] = [];
    for (const [z, rx, ry, cy] of st) {
        const ring: number[] = [];
        for (let k = 0; k < seg; k++) {
            const a = (k / seg) * Math.PI * 2;
            const s = Math.sin(a);
            // Buken er litt flatere enn ryggen.
            const y = cy + s * ry * (s < 0 ? 0.85 : 1);
            ring.push(v(b, [Math.cos(a) * rx, y, z], farge(z, s), del));
        }
        ringer.push(ring);
    }
    for (let r = 0; r < ringer.length - 1; r++) {
        for (let k = 0; k < seg; k++) {
            const a = ringer[r][k];
            const bb = ringer[r][(k + 1) % seg];
            const c = ringer[r + 1][(k + 1) % seg];
            const d = ringer[r + 1][k];
            b.idx.push(a, c, d, a, bb, c);
        }
    }
    const pb = v(b, bak, farge(bak[2], 0), del);
    for (let k = 0; k < seg; k++) b.idx.push(pb, ringer[0][(k + 1) % seg], ringer[0][k]);
    const pf = v(b, fram, farge(fram[2], 0), del);
    const siste = ringer[ringer.length - 1];
    for (let k = 0; k < seg; k++) b.idx.push(pf, siste[k], siste[(k + 1) % seg]);
}

/** En ellipsoide (lengde- og breddegrader). */
function ellipsoide(b: Bygger, c: number[], r: number[], nu: number, nv: number, farge: THREE.Color, del: number[]): void {
    const i0 = b.pos.length / 3;
    for (let j = 0; j <= nv; j++) {
        const t = (j / nv) * Math.PI;
        for (let i = 0; i < nu; i++) {
            const a = (i / nu) * Math.PI * 2;
            v(b, [c[0] + Math.cos(a) * Math.sin(t) * r[0], c[1] + Math.cos(t) * r[1], c[2] + Math.sin(a) * Math.sin(t) * r[2]], farge, del);
        }
    }
    for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
            const i1 = (i + 1) % nu;
            const a = i0 + j * nu + i;
            const bb = i0 + j * nu + i1;
            const cc = i0 + (j + 1) * nu + i1;
            const d = i0 + (j + 1) * nu + i;
            b.idx.push(a, bb, cc, a, cc, d);
        }
    }
}

/** En trekant som vender bort fra `senter` (egne hjørner, så kanten blir skarp). */
function tri(b: Bygger, p: THREE.Vector3[], senter: THREE.Vector3, farge: THREE.Color, del: number[]): void {
    const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0]));
    const m = p[0].clone().add(p[1]).add(p[2]).multiplyScalar(1 / 3).sub(senter);
    const q = n.dot(m) < 0 ? [p[0], p[2], p[1]] : p;
    const i0 = b.pos.length / 3;
    for (const x of q) v(b, x.toArray(), farge, del);
    b.idx.push(i0, i0 + 1, i0 + 2);
}

/**
 * Én katt i meter, nesa mot +z, golvet i y = 0. Ca. 1450 trekanter (øynene er en sjuendedel).
 * Indeksert geometri, så normalene blir glatte over kroppen.
 */
export function lagKattGeometri(): THREE.BufferGeometry {
    const b: Bygger = { pos: [], col: [], del: [], idx: [] };
    const rygg = new THREE.Color(0.6, 0.6, 0.6);
    const side = new THREE.Color(0.74, 0.74, 0.74);
    const buk = new THREE.Color(0.98, 0.95, 0.9);
    const oreInni = new THREE.Color(0x8a6660);
    const morkNese = new THREE.Color(0x4a3432);
    const oye = new THREE.Color(0x9c8a2c);
    const pupill = new THREE.Color(0x070707);
    const farge = (_z: number, s: number) => (s > 0.4 ? rygg : s > -0.45 ? side : buk);

    // ── Kroppen: rumpe til hals ──
    const kropp: Snitt[] = [
        [-0.208, 0.03, 0.032, 0.192],
        [-0.195, 0.052, 0.056, 0.192],
        [-0.168, 0.064, 0.068, 0.192],
        [-0.12, 0.066, 0.07, 0.19],
        [-0.06, 0.062, 0.068, 0.19],
        [0.0, 0.06, 0.07, 0.194],
        [0.055, 0.063, 0.076, 0.2],
        [0.105, 0.058, 0.072, 0.206],
        [0.145, 0.045, 0.054, 0.218],
        [0.172, 0.034, 0.04, 0.236],
    ];
    loft(b, kropp, 14, farge, [KROPP, 0, 0, 1], [0, 0.19, -0.214], [0, 0.24, 0.18]);

    // ── Hodet: rundt, med kort snute ──
    const hode: Snitt[] = [
        [0.162, 0.034, 0.036, 0.262],
        [0.178, 0.048, 0.046, 0.27],
        [0.196, 0.055, 0.05, 0.274],
        [0.216, 0.054, 0.048, 0.272],
        [0.234, 0.047, 0.042, 0.266],
        [0.25, 0.036, 0.032, 0.258],
        [0.263, 0.026, 0.024, 0.254],
        [0.273, 0.016, 0.016, 0.252],
    ];
    const hodeFarge = (z: number, s: number) => (z > 0.245 && s < 0.2 ? buk : s > 0.3 ? rygg : side);
    loft(b, hode, 14, hodeFarge, [HODE, 0, 0, 1], [0, 0.268, 0.156], [0, 0.254, 0.279]);
    // Nesa: en liten mørk knapp på tuppen.
    ellipsoide(b, [0, 0.262, 0.275], [0.007, 0.005, 0.005], 6, 3, morkNese, [HODE, 0, 0, 0]);
    // Øynene: gule kuler med svart pupill (pupillen er smal).
    for (const sx of [-1, 1]) {
        ellipsoide(b, [sx * 0.022, 0.28, 0.252], [0.0095, 0.0085, 0.0075], 8, 4, oye, [HODE, 0, 0, 0]);
        ellipsoide(b, [sx * 0.0236, 0.28, 0.2585], [0.0022, 0.0068, 0.0025], 6, 3, pupill, [HODE, 0, 0, 0]);
    }
    // Ørene: pyramider, mørk rosa inni, pels utenpå.
    for (const sx of [-1, 1]) {
        const x = sx * 0.031;
        const z = 0.202;
        const A = new THREE.Vector3(x - sx * 0.019, 0.316, z + 0.006);
        const B = new THREE.Vector3(x + sx * 0.022, 0.303, z + 0.004);
        const C = new THREE.Vector3(x + sx * 0.002, 0.312, z - 0.015);
        const T = new THREE.Vector3(x * 1.35, 0.372, z - 0.004);
        const sen = new THREE.Vector3(x, 0.322, z - 0.004);
        tri(b, [A, B, T], sen, oreInni, [HODE, 0, 0, 0.3]);
        tri(b, [B, C, T], sen, side, [HODE, 0, 0, 1]);
        tri(b, [C, A, T], sen, side, [HODE, 0, 0, 1]);
    }
    // Værhår: tynne strå ut fra snuten.
    const haar = new THREE.Color(0xd8d2c6);
    for (const sx of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
            const o = [sx * 0.014, 0.252 + i * 0.003, 0.266];
            const ut = [sx * (0.075 + i * 0.006), 0.258 + (i - 1) * 0.012, 0.25 - i * 0.008];
            const a = v(b, o, haar, [HODE, 0, 0, 0]);
            const c = v(b, [o[0], o[1] + 0.0012, o[2]], haar, [HODE, 0, 0, 0]);
            const d = v(b, ut, haar, [HODE, 0, 0, 0]);
            b.idx.push(a, c, d, a, d, c);
        }
    }

    // ── Beina: rør med tre ringer (hofte, ledd, ankel). Shaderen legger dem ut med IK ──
    const ben: [number, number, number, number, number, number, number[]][] = [
        // id, x, z, hofte-y, L1, L2, radier
        [0, 0.034, 0.1, 0.17, 0.09, 0.085, [0.023, 0.016, 0.013]],
        [1, -0.034, 0.1, 0.17, 0.09, 0.085, [0.023, 0.016, 0.013]],
        [2, 0.04, -0.15, 0.18, 0.11, 0.08, [0.033, 0.019, 0.013]],
        [3, -0.04, -0.15, 0.18, 0.11, 0.08, [0.033, 0.019, 0.013]],
    ];
    const S = 7;
    for (const [id, x, z, hy, L1, L2, r] of ben) {
        const ys = [hy, hy - L1, hy - L1 - L2];
        const ledd = [0, 0.5, 1];
        const i0 = b.pos.length / 3;
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < S; k++) {
                const a = (k / S) * Math.PI * 2;
                v(b, [x + Math.cos(a) * r[j], ys[j], z + Math.sin(a) * r[j] * 1.1], j ? side : rygg, [BEN, id, ledd[j], 1]);
            }
        }
        for (let j = 0; j < 2; j++) {
            for (let k = 0; k < S; k++) {
                const k1 = (k + 1) % S;
                const a = i0 + j * S + k;
                const bb = i0 + j * S + k1;
                const c = i0 + (j + 1) * S + k1;
                const d = i0 + (j + 1) * S + k;
                b.idx.push(a, c, bb, a, d, c);
            }
        }
        // Labben: en flat, rund pute foran ankelen.
        ellipsoide(b, [x, ys[2] + 0.012, z + 0.01], [0.017, 0.012, 0.023], 7, 3, side, [LABB, id, 1, 0.8]);
    }

    // ── Halen: rør langs -z. Shaderen legger den ut langs en kurve fra tverrsnittet (x, y - 0,2) og t ──
    const HSEG = 7;
    const HRING = 14;
    const ringer: number[][] = [];
    for (let i = 0; i <= HRING; i++) {
        const t = i / HRING;
        const r = THREE.MathUtils.lerp(0.014, 0.009, t) * (t > 0.92 ? 0.7 : 1);
        const ring: number[] = [];
        for (let k = 0; k < HSEG; k++) {
            const a = (k / HSEG) * Math.PI * 2;
            ring.push(v(b, [Math.cos(a) * r, Math.sin(a) * r + 0.2, -0.205 - t * HALE_L], side, [HALE, 0, t, 1]));
        }
        ringer.push(ring);
    }
    for (let i = 0; i < HRING; i++) {
        for (let k = 0; k < HSEG; k++) {
            const a = ringer[i][k];
            const bb = ringer[i][(k + 1) % HSEG];
            const c = ringer[i + 1][(k + 1) % HSEG];
            const d = ringer[i + 1][k];
            b.idx.push(a, c, bb, a, d, c);
        }
    }
    const tupp = v(b, [0, 0.2, -0.205 - HALE_L - 0.006], side, [HALE, 0, 1, 1]);
    const sist = ringer[HRING];
    for (let k = 0; k < HSEG; k++) b.idx.push(tupp, sist[k], sist[(k + 1) % HSEG]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
    geo.setAttribute('aDel', new THREE.Float32BufferAttribute(b.del, 4));
    geo.setIndex(b.idx);
    geo.computeVertexNormals();
    return geo;
}
