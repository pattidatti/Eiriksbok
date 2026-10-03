// Seilduken til koggen og jekta: ett delt materiale for alle seil, satt eller beslått.
//
// Før var seilet lys `raatre` (treteksturen med krympede UV-er), og på nært hold så det ut som en
// trestamme. Nå har seilet egen duk: en tekstur tegnet på et lerret (canvas) én gang, med duker
// (de loddrette tøybanene som er sydd sammen), sømmer, lapper, tauet langs kanten, ujevnt garn og
// skitt nederst. På full kvalitet ligger en vev (kypert) oppå som relieff (`bumpMap`).
//
// UV-ene er normalisert over seilet (seilSatt og raa i skrog.ts): u 0..1 på tvers, v 0..1 fra
// nederste kant til råa. Det beslåtte seilet har v fra 1 til 2 (rundt rullen): teksturen gjentas,
// og vinden i shaderen ser v >= 1 og lar det ligge i ro.
//
// Vinden: shaderen skyver hjørnene forut (+z i skipets rom) med en langsom «pust» og små krusninger
// som løper over duken. Råa og hjørnene der skjøtene holder, står stille. Ingen fysikk og ingen nye
// tegnekall; tiden er én uniform som settes når materialet tegnes.
//
// Historikk:
// - Norrøne seil var ofte av ullvadmel, tett vevd ull [K: kilde mangler, jf. SNL «vadmel»]. Jekta
//   er en nordnorsk båt, så den kan godt ha ullseil [K].
// - Koggene fra hansabyene kan ha hatt seil av lin eller hamp [K]. Spillet bruker samme lyse,
//   ufargede duk på begge skipene, så ingen påstår noe om farge [S].
// - Vadmel ble ofte vevd i kypert (skrå striper i veven) [K]. Vev-relieffet her er kypert [S].
// - Bonnet: en ekstra duk snørt under seilet, som kunne tas av i sterk vind [K]. Den snørte sømmen
//   nederst på teksturen er den [S].
import * as THREE from 'three';
import type { Vaat } from './vaat';

/** Tiden for vinden. Delt av alle seil (materialet er ett). */
const uSeilTid = { value: 0 };

/** Seilets omtrentlige mål i meter (bare for hvor bratt krusningene heller normalen). */
const SEIL_B = 15;
const SEIL_H = 11;
/** Hvor mye sollys som slipper gjennom duken til baksida. */
const GJENNOM = 0.35;

let seilTekstur: THREE.CanvasTexture | null = null;
let vevTekstur: THREE.CanvasTexture | null = null;

/** Liten, fast tilfeldighet, så seilet ser likt ut hver gang. */
function rng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

/** Hele seilet på ett lerret: duker, sømmer, lapper, kanttau og skitt. Lages én gang. */
function tegnSeil(): THREE.CanvasTexture {
    const S = 1024;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    if (!g) throw new Error('Fikk ikke tegnet seilduken');
    const r = rng(1429);

    // Dukene: loddrette tøybaner, hver med litt egen tone (garn fra ulike vevinger).
    const DUKER = 13;
    const bw = S / DUKER;
    for (let i = 0; i < DUKER; i++) {
        const t = 0.94 + r() * 0.1;
        const varm = r() * 6;
        g.fillStyle = `rgb(${Math.round(230 * t + varm)}, ${Math.round(216 * t + varm * 0.6)}, ${Math.round(186 * t)})`;
        g.fillRect(Math.floor(i * bw), 0, Math.ceil(bw) + 1, S);
        // Duken buler litt mellom sømmene: lysest midt i banen, mørkere inn mot sømmen.
        const x0 = i * bw;
        const bul = g.createLinearGradient(x0, 0, x0 + bw, 0);
        bul.addColorStop(0, 'rgba(90, 72, 48, 0.1)');
        bul.addColorStop(0.3, 'rgba(255, 250, 235, 0.06)');
        bul.addColorStop(0.55, 'rgba(255, 250, 235, 0.1)');
        bul.addColorStop(1, 'rgba(90, 72, 48, 0.08)');
        g.fillStyle = bul;
        g.fillRect(Math.floor(x0), 0, Math.ceil(bw) + 1, S);
    }
    // Strekkfolder: skrå, myke striper fra de nedre hjørnene (skjøtene) inn mot midten av duken.
    for (const [hx, retn] of [[0, 1], [S, -1]] as const) {
        for (let k = 0; k < 4; k++) {
            g.save();
            g.translate(hx, S * (0.97 - k * 0.04));
            g.rotate(retn * (-0.5 - k * 0.16 + r() * 0.05));
            const len = S * (0.35 + r() * 0.25);
            // Bred og myk: en fold, ikke en strek. Lys kant på den ene siden.
            const f = g.createLinearGradient(0, -26, 0, 26);
            f.addColorStop(0, 'rgba(80, 64, 42, 0)');
            f.addColorStop(0.45, `rgba(80, 64, 42, ${0.06 + r() * 0.05})`);
            f.addColorStop(0.65, 'rgba(255, 250, 235, 0.06)');
            f.addColorStop(1, 'rgba(255, 250, 235, 0)');
            g.fillStyle = f;
            g.fillRect(0, -26, retn * len, 52);
            g.restore();
        }
    }

    // Ujevnt garn: tynne, lyse og mørke tråder på tvers (veften) og langs (renningen).
    for (let y = 0; y < S; y += 1) {
        if (r() > 0.55) continue;
        const a = 0.03 + r() * 0.07;
        g.fillStyle = r() > 0.5 ? `rgba(90, 70, 45, ${a})` : `rgba(255, 250, 235, ${a})`;
        g.fillRect(0, y, S, 1 + (r() > 0.85 ? 1 : 0));
    }
    for (let x = 0; x < S; x += 2) {
        if (r() > 0.4) continue;
        g.fillStyle = `rgba(80, 62, 40, ${0.02 + r() * 0.04})`;
        g.fillRect(x, 0, 1, S);
    }

    // Lappene: ruter av annet tøy, noen mørkere og eldre, én nyere og lysere, sydd fast i kanten.
    const lapper: [number, number, number, number, string][] = [
        [0.18, 0.3, 0.09, 0.1, 'rgb(210, 194, 164)'],
        [0.62, 0.22, 0.07, 0.06, 'rgb(216, 204, 176)'],
        [0.71, 0.58, 0.12, 0.09, 'rgb(202, 184, 150)'],
        [0.34, 0.66, 0.06, 0.08, 'rgb(230, 220, 194)'],
        [0.08, 0.72, 0.08, 0.06, 'rgb(196, 176, 140)'],
        [0.48, 0.42, 0.05, 0.05, 'rgb(214, 198, 166)'],
    ];
    for (const [lx, ly, lw, lh, farge] of lapper) {
        const x = lx * S, y = ly * S, w = lw * S, h = lh * S;
        const vri = (r() - 0.5) * 0.06;
        g.save();
        g.translate(x + w / 2, y + h / 2);
        g.rotate(vri);
        // Lappen er klippet for hånd: hjørnene står litt skjevt.
        const hj = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([px, py]) => [px + (r() - 0.5) * w * 0.12, py + (r() - 0.5) * h * 0.12]);
        const sti = () => {
            g.beginPath();
            hj.forEach(([px, py], n) => (n === 0 ? g.moveTo(px, py) : g.lineTo(px, py)));
            g.closePath();
        };
        sti();
        g.fillStyle = farge;
        g.fill();
        g.save();
        sti();
        g.clip();
        // Garnet i lappen går litt annerledes.
        for (let k = 0; k < h; k += 2) {
            g.fillStyle = `rgba(70, 55, 35, ${0.03 + r() * 0.06})`;
            g.fillRect(-w / 2, -h / 2 + k, w, 1);
        }
        g.restore();
        // Brettet kant og sting.
        sti();
        g.strokeStyle = 'rgba(80, 62, 42, 0.35)';
        g.lineWidth = 2.5;
        g.stroke();
        g.save();
        g.scale(0.9, 0.88);
        sti();
        g.restore();
        g.setLineDash([3, 4]);
        g.strokeStyle = 'rgba(70, 54, 36, 0.45)';
        g.lineWidth = 1.2;
        g.stroke();
        g.setLineDash([]);
        g.restore();
    }

    // Sømmene mellom dukene: en mørk fold med sting på begge sider.
    for (let i = 1; i < DUKER; i++) {
        const x = Math.round(i * bw);
        g.fillStyle = 'rgba(80, 62, 40, 0.3)';
        g.fillRect(x - 1, 0, 3, S);
        g.fillStyle = 'rgba(255, 248, 230, 0.2)';
        g.fillRect(x + 2, 0, 2, S);
        g.setLineDash([4, 5]);
        g.strokeStyle = 'rgba(60, 46, 30, 0.35)';
        g.lineWidth = 1;
        for (const dx of [-5, 7]) {
            g.beginPath();
            g.moveTo(x + dx, 0);
            g.lineTo(x + dx, S);
            g.stroke();
        }
        g.setLineDash([]);
    }

    // Bonneten: en snørt søm et stykke opp fra underkanten [K].
    const by = S * 0.84;
    g.fillStyle = 'rgba(70, 54, 34, 0.55)';
    g.fillRect(0, by - 2, S, 5);
    for (let x = 6; x < S; x += 22) {
        g.strokeStyle = 'rgba(60, 44, 28, 0.75)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x, by - 9);
        g.lineTo(x + 11, by + 9);
        g.stroke();
    }

    // Skitt og sjøsprøyt nederst, sot og vær i flekker.
    const grad = g.createLinearGradient(0, S, 0, S * 0.55);
    grad.addColorStop(0, 'rgba(70, 58, 40, 0.38)');
    grad.addColorStop(1, 'rgba(70, 58, 40, 0)');
    g.fillStyle = grad;
    g.fillRect(0, S * 0.55, S, S * 0.45);
    for (let i = 0; i < 26; i++) {
        const x = r() * S, y = r() * S, rad = 20 + r() * 90;
        const fl = g.createRadialGradient(x, y, 0, x, y, rad);
        fl.addColorStop(0, `rgba(95, 80, 55, ${0.05 + r() * 0.09})`);
        fl.addColorStop(1, 'rgba(95, 80, 55, 0)');
        g.fillStyle = fl;
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }

    // Kanttauet (liket) rundt seilet: mørkt, tjæret tau.
    g.fillStyle = 'rgba(92, 72, 48, 0.75)';
    g.fillRect(0, 0, S, 7);
    g.fillRect(0, S - 6, S, 6);
    g.fillRect(0, 0, 5, S);
    g.fillRect(S - 5, 0, 5, S);
    // Hullene langs toppen der seilet er surret til råa.
    for (let x = 18; x < S; x += 34) {
        g.fillStyle = 'rgba(40, 30, 20, 0.85)';
        g.beginPath();
        g.arc(x, 18, 3.5, 0, Math.PI * 2);
        g.fill();
    }

    // Fin støy i hver piksel: garnet er aldri helt jevnt.
    const img = g.getImageData(0, 0, S, S);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const n = (r() - 0.5) * 14;
        d[i] += n;
        d[i + 1] += n;
        d[i + 2] += n * 0.9;
    }
    g.putImageData(img, 0, 0);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

/** Veven som relieff: 2/2-kypert (skrå striper), gjentatt mange ganger over seilet. */
function tegnVev(): THREE.CanvasTexture {
    const S = 128;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    if (!g) throw new Error('Fikk ikke tegnet veven');
    const r = rng(793);
    const T = 8; // piksler per tråd
    const n = S / T;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            // Kypert: tråden over i to, under i to, forskjøvet én per rad.
            const over = ((i + j) % 4) < 2;
            const base = over ? 190 : 90;
            for (let y = 0; y < T; y++) {
                for (let x = 0; x < T; x++) {
                    // Hver tråd er rund: lysest på midten.
                    const k = over ? Math.sin(((x + 0.5) / T) * Math.PI) : Math.sin(((y + 0.5) / T) * Math.PI);
                    const v = base * (0.55 + 0.45 * k) + (r() - 0.5) * 18;
                    g.fillStyle = `rgb(${v | 0}, ${v | 0}, ${v | 0})`;
                    g.fillRect(i * T + x, j * T + y, 1, 1);
                }
            }
        }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    // Ca. 1,1 cm per tråd på et seil på 15 m.
    t.repeat.set(85, 60);
    return t;
}

const SEIL_GLSL = /* glsl */ `
uniform float uSeilTid;
varying float vSeilKrus;
// Hvor langt vinden skyver duken forut ved uv (meter). Råa (v = 1) og sidekantene står stille;
// det beslåtte seilet (v >= 1) rører seg ikke.
float seilVind(vec2 suv, float fase, out float krus) {
    float ned = clamp(1.0 - suv.y, 0.0, 1.0);
    float side = sin(3.14159 * clamp(suv.x, 0.0, 1.0));
    float w = side * pow(ned, 0.6) * step(suv.y, 0.999);
    float pust = 0.5 + 0.5 * sin(uSeilTid * 0.8 + fase);
    krus = sin(uSeilTid * 2.6 + suv.x * 10.0 - suv.y * 6.0 + fase)
        + 0.5 * sin(uSeilTid * 4.1 - suv.x * 17.0 + suv.y * 9.0 + fase * 1.7);
    krus *= w;
    return w * (0.45 * pust + 0.1 * krus);
}
`;

/** Legger vinden og krusningen inn i shaderen. */
function seilPatch(sh: Parameters<THREE.Material['onBeforeCompile']>[0]): void {
    sh.uniforms.uSeilTid = uSeilTid;
    sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\n${SEIL_GLSL}`)
        .replace(
            '#include <beginnormal_vertex>',
            `#include <beginnormal_vertex>
            float seilFase = modelMatrix[3][0] * 0.37 + modelMatrix[3][2] * 0.23;
            float seilK;
            float seilD = seilVind(uv, seilFase, seilK);
            vSeilKrus = seilK;
            {
                float k2;
                float dU = (seilVind(uv + vec2(0.01, 0.0), seilFase, k2) - seilD) / (0.01 * ${SEIL_B.toFixed(1)});
                float dV = (seilVind(uv + vec2(0.0, 0.01), seilFase, k2) - seilD) / (0.01 * ${SEIL_H.toFixed(1)});
                float sg = objectNormal.z >= 0.0 ? 1.0 : -1.0;
                objectNormal = normalize(objectNormal - sg * vec3(dU, dV, 0.0) * abs(objectNormal.z));
            }`
        )
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += seilD;');
    sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vSeilKrus;')
        // Toppene på krusningene får litt mer lys, dalene litt mindre.
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 + 0.06 * vSeilKrus;')
        // Tynn duk slipper sola gjennom: siden som vender bort fra sola, gløder litt (uten skygge).
        .replace(
            '#include <lights_fragment_end>',
            `#include <lights_fragment_end>
            #if NUM_DIR_LIGHTS > 0
                float seilGjennom = max(0.0, -dot(normal, directionalLights[0].direction));
                reflectedLight.indirectDiffuse += diffuseColor.rgb * directionalLights[0].color * seilGjennom * ${GJENNOM.toFixed(2)} * RECIPROCAL_PI;
            #endif`
        );
}

/**
 * Seilduk-materialet. Kalles én gang av `Materials.load` (nøkkelen 'seil'). Vætan (vaat.ts) gjør
 * duken mørkere i regn som resten av byen.
 */
export function lagSeilduk(vaat: Vaat, low: boolean, anisotropy: number): THREE.MeshStandardMaterial {
    seilTekstur ??= tegnSeil();
    vevTekstur ??= tegnVev();
    seilTekstur.anisotropy = anisotropy;
    const m = new THREE.MeshStandardMaterial({
        map: seilTekstur,
        color: new THREE.Color(1, 1, 1),
        roughness: 0.97,
        metalness: 0,
        vertexColors: true,
        bumpScale: 1.2,
    });
    m.onBeforeCompile = (sh) => {
        vaat.patch(sh, 'seil');
        seilPatch(sh);
    };
    m.customProgramCacheKey = () => 'seilduk';
    m.onBeforeRender = () => {
        uSeilTid.value = performance.now() / 1000;
    };
    seilKvalitet(m, low, anisotropy);
    return m;
}

/** Lav kvalitet: bare fargeteksturen. Full: veven som relieff i tillegg. */
export function seilKvalitet(m: THREE.MeshStandardMaterial, low: boolean, anisotropy: number): void {
    m.bumpMap = low ? null : vevTekstur;
    if (seilTekstur && seilTekstur.anisotropy !== anisotropy) {
        seilTekstur.anisotropy = anisotropy;
        seilTekstur.needsUpdate = true;
    }
    m.needsUpdate = true;
}

/** Fargen seilet har langt unna (middels nivå). */
export const SEIL_LOD = 0xd2c6ad;

export function kastSeilduk(): void {
    seilTekstur?.dispose();
    vevTekstur?.dispose();
    seilTekstur = vevTekstur = null;
}
