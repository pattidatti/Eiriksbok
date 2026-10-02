// Himmelen: en kuppel med fargeovergang, skyer som driver og sola bak dem.
//
// Ett tegnekall. Kuppelen følger kameraet og tegnes etter alt det andre som er helt (ikke
// gjennomsiktig), med dybden lagt helt bakerst: da hopper GPU-en over pikslene der husene
// allerede står, og skyene regnes bare ut der himmelen faktisk synes. (Tegnet først kostet den
// 1,7 ms i gårdsrommet, der bare en stripe himmel synes.) Den skriver ikke dybde, så
// dybdebufferen er tom (1,0) der himmelen er: etterbehandlingen kjenner himmelen på det.
//
// Horisonten har nøyaktig tåkefargen. Da glir husene langt ute over i himmelen uten kant.
// Gløden rundt sola legges på i etterbehandlingen, likt over himmel og tåke, så de ikke
// skiller lag. Uten etterbehandling (lav kvalitet) gløder himmelen litt selv (`glodHer`).
//
// Fjellene rundt Bergen står i himmelen, ikke i scenen: en profil langs horisonten regnet ut
// fra toppene i `FJELL` sett fra kameraet. Da flytter de seg litt når man går (Fløyen er bare
// en knapp kilometer unna), koster ingen tegnekall, og husene dekker dem gratis. De er tunge
// av dis: tåka i spillet er mye tettere enn ekte luft, og fjell som sto skarpere enn husene
// 100 m unna, ville sett klistret på ut.
import * as THREE from 'three';
import type { Lyssetting } from './stemning';

const R = 140; // innenfor kameraets fjerne plan (160)

/**
 * Fjellene i spillets rom, målt fra Bryggen: x, z, høyde over havet og hvor bred foten er (alt i
 * meter). Spillets +x går langs Vågen mot Holmen, som i virkeligheten er omtrent nordvest (330°),
 * +z inn i landet (nordøst) og -z over Vågen (sørvest). Toppene er regnet om fra kartet med den
 * dreiningen: nord og øst i km fra Bryggen, så x = 0,866·N - 0,5·Ø og z = 0,5·N + 0,866·Ø.
 * Høydene og retningene er ekte [V]; bredden er valgt for spillet [S].
 */
const FJELL: [number, number, number, number][] = [
    [-910, 830, 320, 1100], // Fløyen, bak og til høyre for Bryggen sett fra Vågen
    [-630, 1490, 399, 1000], // Fløyfjellet, ryggen fra Fløyen opp mot Blåmanen, rett bak Bryggen
    [-120, 2510, 551, 1100], // Blåmanen
    [350, 3220, 568, 1300], // Rundemanen
    [1230, 2070, 417, 1100], // Sandviksfjellet
    [990, 1490, 250, 1200], // lia over Sandviken
    [-3690, 1950, 643, 1700], // Ulriken, over enden av Vågen
    [-2130, 1080, 230, 1000], // lav rygg mellom Fløyen og Ulriken
    [-3780, -1320, 477, 1600], // Løvstakken
    [-1970, -2520, 317, 1400], // Damsgårdsfjellet
    [60, -5670, 396, 1800], // Lyderhorn
    [5460, -1460, 230, 3000], // Askøy over Byfjorden
];

export class Himmel {
    readonly mesh: THREE.Mesh;
    private readonly u: Record<string, THREE.IUniform>;

    private readonly lys: Lyssetting;

    /** Fargene og retningene deles med lyssettingen og følger døgnet uten kopiering. */
    constructor(lys: Lyssetting) {
        this.lys = lys;
        this.u = {
            uZenit: { value: lys.c.zenit },
            uHorisont: { value: lys.c.takeFarge },
            uSky: { value: lys.c.sky },
            uSolFarge: { value: lys.c.solFarge },
            uSol: { value: lys.solRetning },
            uSolSkive: { value: lys.solen },
            uMaane: { value: lys.maanen },
            uNatt: { value: 0 },
            uDekke: { value: 0 },
            uGlodHer: { value: 0 },
            uTid: { value: 0 },
            uFjellA: { value: FJELL.map(() => new THREE.Vector4()) },
            uFjellL: { value: FJELL.map(() => 0) },
            uFjellMaks: { value: 0 },
            uFjellFarge: { value: lys.c.fjell },
            uFjellDis: { value: 2600 },
        };
        const mat = new THREE.ShaderMaterial({
            uniforms: this.u,
            vertexShader: /* glsl */ `
                varying vec3 vDir;
                void main() {
                    vDir = position;
                    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_Position = p.xyww; // helt bakerst i dybden

                }`,
            fragmentShader: HIMMEL_GLSL,
            side: THREE.BackSide,
            depthWrite: false,
            depthFunc: THREE.LessEqualDepth,
            fog: false,
        });
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), mat);
        this.mesh.name = 'himmel';
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 1000;
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = false;
    }

    /** `post`: etterbehandlingen legger på gløden rundt sola. Ellers gjør himmelen det selv. */
    update(t: number, kamera: THREE.Vector3, post: boolean): void {
        this.mesh.position.copy(kamera);
        const lys = this.lys;
        this.u.uDekke.value = lys.s.skydekke;
        this.u.uFjellDis.value = lys.s.fjellDis;
        this.u.uNatt.value = lys.natt;
        // Fjellene sett fra kameraet: retningen mot toppen, hvor høyt den rager (vinkel), hvor
        // bred foten er (vinkel) og avstanden. Høyeste topp pluss ryggene er grensa for shaderen.
        const a = this.u.uFjellA.value as THREE.Vector4[];
        const l = this.u.uFjellL.value as number[];
        let maks = 0;
        FJELL.forEach(([x, z, h, r], i) => {
            const dx = x - kamera.x;
            const dz = z - kamera.z;
            const len = Math.hypot(dx, dz);
            const e = Math.atan((h - kamera.y) / len);
            a[i].set(dx / len, dz / len, e, Math.atan(r / len));
            l[i] = len;
            maks = Math.max(maks, e);
        });
        this.u.uFjellMaks.value = maks + 0.05;
        this.u.uTid.value = t % 3600;
        this.u.uGlodHer.value = post ? 0 : lys.s.solGlod * lys.lysFade * 0.6;
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}

const HIMMEL_GLSL = /* glsl */ `
uniform vec3 uZenit;
uniform vec3 uHorisont;
uniform vec3 uSky;
uniform vec3 uSolFarge;
uniform vec3 uSol;
uniform vec3 uSolSkive;
uniform vec3 uMaane;
uniform float uNatt;
uniform float uDekke;
uniform float uGlodHer;
uniform float uTid;
uniform vec4 uFjellA[${FJELL.length}];
uniform float uFjellL[${FJELL.length}];
uniform float uFjellMaks;
uniform vec3 uFjellFarge;
uniform float uFjellDis;
varying vec3 vDir;

float hHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hStoy(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hHash(i), hHash(i + vec2(1.0, 0.0)), f.x), mix(hHash(i + vec2(0.0, 1.0)), hHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float hHash3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float hFbm3(vec2 p) {
    return hStoy(p) * 0.57 + hStoy(p * 2.03 + vec2(1.7, 9.2)) * 0.29 + hStoy(p * 4.1 + vec2(5.3, 2.8)) * 0.14;
}

float hFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * hStoy(p);
        p = p * 2.03 + vec2(1.7, 9.2);
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 d = normalize(vDir);
    float y = max(d.y, 0.0);
    // Fargeovergangen: tåkefargen i horisonten, himmelfargen oppover.
    vec3 c = mix(uHorisont, uZenit, pow(smoothstep(0.0, 0.75, y), 0.7));
    float mot = max(dot(d, uSol), 0.0);

    // Skyer på et tenkt tak: lengre unna (og mindre) nede mot horisonten. Driver med vinden.
    vec2 p = d.xz / (y + 0.12) * 1.3 + vec2(uTid * 0.006, uTid * 0.0025);
    float n = hFbm(p);
    float tett = smoothstep(1.0 - uDekke - 0.08, 1.0 - uDekke + 0.32, n);
    // Undersiden er mørkere der skya er tykk, kanten mot sola lyser.
    float tykk = smoothstep(0.4, 0.9, n);
    vec3 sky = uSky * mix(1.15, 0.55, tykk);
    // Kanten mot sola lyser, og hele skydekket får et varmt skjær nær sola.
    sky += uSolFarge * (pow(mot, 6.0) * (1.0 - tykk) * 1.1 + pow(mot, 2.0) * 0.12);
    float horisont = smoothstep(0.0, 0.18, y);
    c = mix(c, sky, tett * horisont);

    // Stjernene: ett rutenett på kula, og en stjerne i noen få av rutene. Borte bak skyene, nede
    // i disen og nær månen.
    if (uNatt > 0.01 && d.y > 0.02) {
        vec3 q = d * 150.0;
        vec3 rute = floor(q);
        float h = hHash3(rute);
        if (h > 0.982) {
            vec3 sp = rute + 0.5 + (vec3(hHash3(rute + 7.1), hHash3(rute + 3.7), hHash3(rute + 9.3)) - 0.5) * 0.6;
            float lysS = (h - 0.982) / 0.018;
            float blink = 0.75 + 0.25 * sin(uTid * (2.0 + lysS * 3.0) + h * 400.0);
            float stj = smoothstep(0.16, 0.0, length(q - sp)) * (0.25 + lysS * lysS * 1.6) * blink;
            float vekk = (1.0 - tett) * smoothstep(0.03, 0.3, y) * (1.0 - smoothstep(0.995, 0.9999, dot(d, uMaane)));
            c += vec3(0.85, 0.9, 1.0) * stj * vekk * uNatt;
        }
    }

    // Månen: en lys skive med mørke flekker (havene på månen), og en ring av lys rundt i skyene.
    float motM = dot(d, uMaane);
    if (uMaane.y > -0.05 && motM > 0.99) {
        vec3 t1 = normalize(cross(uMaane, vec3(0.0, 1.0, 0.0)));
        vec3 t2 = cross(t1, uMaane);
        vec2 uv = vec2(dot(d, t1), dot(d, t2)) / 0.0125;
        float r = length(uv);
        float flekk = 0.72 + 0.28 * hFbm3(uv * 1.6 + 4.0);
        float synlig = smoothstep(-0.02, 0.04, uMaane.y) * (0.35 + 0.65 * uNatt);
        vec3 mf = vec3(0.9, 0.93, 1.0);
        c += mf * smoothstep(1.0, 0.9, r) * flekk * (1.0 - tett * 0.8) * 2.6 * synlig;
        c += mf * (pow(motM, 900.0) * 0.22 + pow(motM, 90.0) * 0.08) * (0.4 + tett) * synlig;
    }

    // Sola: en skive bak skyene, så sterk at gløden i etterbehandlingen tar den.
    float skive = smoothstep(0.99955, 0.99975, dot(d, uSolSkive));
    c += uSolFarge * skive * (1.0 - tett * 0.85) * 6.0;
    c += uSolFarge * (pow(mot, 12.0) * 0.35 + pow(mot, 120.0) * 0.6) * uGlodHer;

    // Fjellene: høyden (vinkelen over horisonten) i denne retningen, og hvor langt unna fjellene
    // her står. Toppene er brede kupler med rygger og kløfter i kanten. Retningen, høyden og
    // bredden til hver topp regnes ut på CPU-en hvert bilde (update). Over den høyeste toppen
    // (det meste av himmelen) hoppes alt dette over.
    float el = asin(clamp(d.y, -1.0, 1.0));
    if (el < uFjellMaks && el > -0.03) {
        vec2 hd = normalize(d.xz + vec2(1e-5));
        float fjell = -1.0;
        // Mykt maksimum: der to fjell møtes, fylles skaret litt, så det blir én fjellrekke.
        // Avstanden og solsida blandes med de samme vektene, ellers blir det en loddrett skjøt.
        float sum = 0.0;
        float avst = 0.0;
        float side = 0.0;
        for (int i = 0; i < ${FJELL.length}; i++) {
            vec4 f = uFjellA[i];
            float cosv = dot(hd, f.xy);
            // Korden i stedet for vinkelen: lik for små vinkler, og ingen acos.
            float vinkel = sqrt(max(0.0, 2.0 - 2.0 * cosv));
            // Brede skuldre og bratte sider, ikke kjegler.
            float form = clamp(1.0 - vinkel / f.w, 0.0, 1.0);
            float topp = f.z * pow(form * (2.0 - form), 0.9);
            float w = exp(topp * 70.0);
            sum += w;
            fjell = max(fjell, topp);
            avst += uFjellL[i] * w;
            // Hvilken side av toppen: skråningen mot sola lyser.
            side += sign(hd.x * f.y - hd.y * f.x) * (1.0 - form) * w;
        }
        avst /= sum;
        side /= sum;
        fjell = max(fjell, log(sum) / 70.0 - 0.012);
        float az = atan(d.x, d.z);
        float rygg = (hFbm3(vec2(az * 7.0, 3.1)) - 0.5) * 0.05 + (hStoy(vec2(az * 45.0, 1.7)) - 0.5) * 0.012;
        fjell += rygg * smoothstep(0.0, 0.08, fjell);
        float iFjell = smoothstep(fjell + 0.0015, fjell - 0.0015, el) * step(0.0, fjell);
        // I gråvær henger skydekket nede i fjellsidene: toppene blir borte i skyene, i filler.
        float skyLinje = 0.24 + (hStoy(vec2(az * 12.0, uTid * 0.004)) - 0.5) * 0.06;
        iFjell *= 1.0 - smoothstep(skyLinje - 0.07, skyLinje + 0.02, el) * smoothstep(0.8, 0.95, uDekke) * 0.8;
        if (iFjell > 0.0) {
            // Flekker av skog og berg, og renner som går ned lia. Solsida lysere. Disen tar mer
            // jo lenger unna, og mest nede ved foten.
            float flekk = hFbm3(vec2(az * 70.0, el * 70.0)) * 0.75 + hStoy(vec2(az * 110.0, el * 35.0)) * 0.25;
            vec2 solH = normalize(uSol.xz + vec2(1e-5));
            float motSol = dot(solH, hd);
            vec3 fc = uFjellFarge * mix(0.55, 1.45, flekk) * (1.0 + 0.25 * side * sign(motSol + 0.0001) * (1.0 - abs(motSol)));
            // Toppen får litt av sollyset.
            fc += uSolFarge * 0.06 * smoothstep(-0.03, 0.0, el - fjell) * max(0.0, -motSol + 0.3);
            // Disen tar de nære fjellene som før, men tetner saktere bak halvannen kilometer: ellers
            // var Ulriken (fire km unna) nesten borte.
            float avstD = min(avst, 1500.0 + (avst - 1500.0) * 0.35);
            float dis = 1.0 - exp(-avstD / uFjellDis);
            dis = mix(dis, 1.0, (1.0 - smoothstep(0.0, 0.06, el)) * 0.55);
            fc = mix(fc, uHorisont, clamp(dis, 0.0, 0.97));
            c = mix(c, fc, iFjell);
        }
    }

    // Under horisonten: bare tåke.
    c = mix(uHorisont, c, smoothstep(-0.02, 0.01, d.y));
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;
