// Færingen som modell: et klinkbygd skrog med fire bordganger på hver side, stavner som reiser
// seg i begge ender, kjøl med litt rocker, tiljer i bunnen og tofter (sitteplankene).
//
// Klinkbygd: hvert bord ligger litt utenpå bordet under, så skroget får en trapp av kanter
// langs sidene. Her lages det ved at den nedre kanten av hvert bord skyves litt ut.
//
// Skroget er laget i kode av tverrsnitt langs båten, og UV-ene er i meter (langs båten og rundt
// skroget), så treteksturen fra byen legger seg som planker i riktig retning.
import * as THREE from 'three';

/** Halv lengde (fra midten til stavnen) og halv bredde midtskips, i meter. */
export const FAERING_L = 2.9;
const B = 0.78;
const BORD = 4; // bordganger per side
const N = 28; // tverrsnitt langs båten

/** Hvor bred båten er og hvor høy ripa (øverste kant) står, ved u (-1 akter .. 1 forut). */
function snitt(u: number): { b: number; ripe: number; kjol: number } {
    const a = Math.abs(u);
    const b = B * Math.pow(Math.max(0, 1 - a * a), 0.75);
    // Ripa svinger opp mot stavnene (spring), kjølen har litt rocker.
    const ripe = 0.38 + 0.32 * Math.pow(a, 3.2);
    const kjol = -0.2 + 0.2 * Math.pow(a, 2.4);
    return { b, ripe, kjol };
}

/** Punktet på skroget ved u (langs) og s (0 kjøl .. 1 ripe), på side `side`. */
function punkt(u: number, s: number, side: number, ut = 0): THREE.Vector3 {
    const { b, ripe, kjol } = snitt(u);
    // Tverrsnittet: rund bunn som reiser seg til nesten loddrette sider.
    const vinkel = s * Math.PI * 0.5;
    const x = Math.sin(vinkel) * b + ut;
    const y = kjol + (1 - Math.cos(vinkel)) * (ripe - kjol);
    return new THREE.Vector3(side * x, y, u * FAERING_L);
}

export function lagFaeringSkrog(tre: THREE.Material, mork: THREE.Material): THREE.Group {
    const g = new THREE.Group();
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, ua: [number, number], ub: [number, number], uc: [number, number], ud: [number, number]) => {
        const i = pos.length / 3;
        for (const p of [a, b, c, d]) pos.push(p.x, p.y, p.z);
        uv.push(...ua, ...ub, ...uc, ...ud);
        idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    };
    // Bordgangene: hvert bord dekker en del av tverrsnittet, og den nedre kanten skyves 1,5 cm
    // ut så den ligger utenpå bordet under.
    for (const side of [-1, 1]) {
        for (let k = 0; k < BORD; k++) {
            const s0 = k / BORD;
            const s1 = (k + 1) / BORD;
            for (let i = 0; i < N; i++) {
                const u0 = -1 + (2 * i) / N;
                const u1 = -1 + (2 * (i + 1)) / N;
                const a = punkt(u0, s0, side, 0.015);
                const b = punkt(u1, s0, side, 0.015);
                const c = punkt(u1, s1, side);
                const d = punkt(u0, s1, side);
                // UV: x langs båten, y rundt skroget (bordene får hver sin stripe i teksturen).
                const v0 = k * 0.27;
                const v1 = v0 + 0.25;
                const q: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] = side < 0 ? [a, b, c, d] : [b, a, d, c];
                const uvq: [number, number][] = side < 0
                    ? [[u0 * FAERING_L, v0], [u1 * FAERING_L, v0], [u1 * FAERING_L, v1], [u0 * FAERING_L, v1]]
                    : [[u1 * FAERING_L, v0], [u0 * FAERING_L, v0], [u0 * FAERING_L, v1], [u1 * FAERING_L, v1]];
                quad(q[0], q[1], q[2], q[3], uvq[0], uvq[1], uvq[2], uvq[3]);
            }
        }
    }
    const skrog = new THREE.BufferGeometry();
    skrog.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    skrog.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    skrog.setIndex(idx);
    skrog.computeVertexNormals();
    // Utsida og innsida i samme flate. Innsida er mørkere (skygge og vann i bunnen).
    const ute = new THREE.Mesh(skrog, tre);
    ute.castShadow = true;
    const inne = new THREE.Mesh(skrog, mork);
    g.add(ute, inne);

    // Ripa: en list langs toppen av øverste bord, rundt hele båten.
    const ripe = (side: number) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= N; i++) pts.push(punkt(-1 + (2 * i) / N, 1, side, 0.012));
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, 0.028, 5, false), tre);
        m.castShadow = true;
        return m;
    };
    g.add(ripe(1), ripe(-1));

    // Stavnene: en bøyd stokk i hver ende som reiser seg over ripa.
    for (const ende of [-1, 1]) {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 8; i++) {
            const t = i / 8;
            const u = ende * (0.9 + t * 0.1);
            const { kjol, ripe: r } = snitt(u);
            pts.push(new THREE.Vector3(0, THREE.MathUtils.lerp(kjol, r + 0.14, t), u * FAERING_L + ende * t * 0.12));
        }
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.045, 5, false), tre);
        m.castShadow = true;
        g.add(m);
    }

    // Tiljene (golvbordene) i bunnen: litt over vannflata og formet etter skroget i den høyden,
    // ellers synes Vågen inne i båten. Toftene går på tvers.
    const TILJE_Y = 0.03;
    const tp: number[] = [];
    const tuv: number[] = [];
    const ti: number[] = [];
    for (let i = 0; i <= N; i++) {
        const u = -0.92 + (1.84 * i) / N;
        // Finn hvor skroget står i tiljehøyden (halvering langs tverrsnittet).
        let lo = 0;
        let hi = 1;
        for (let k = 0; k < 14; k++) {
            const m = (lo + hi) / 2;
            if (punkt(u, m, 1).y < TILJE_Y) lo = m;
            else hi = m;
        }
        const x = punkt(u, lo, 1).x;
        const z = u * FAERING_L;
        tp.push(-x, TILJE_Y, z, x, TILJE_Y, z);
        tuv.push(-x, z, x, z);
        if (i > 0) {
            const a = (i - 1) * 2;
            // Vendt ned: innsidematerialet tegner baksida, og den ser opp.
            ti.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
    }
    const tiljeGeo = new THREE.BufferGeometry();
    tiljeGeo.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
    tiljeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2));
    tiljeGeo.setIndex(ti);
    tiljeGeo.computeVertexNormals();
    g.add(new THREE.Mesh(tiljeGeo, mork));
    for (const z of [-1.4, -0.25, 1.1]) {
        const { b } = snitt(z / FAERING_L);
        const tofte = new THREE.Mesh(new THREE.BoxGeometry(b * 1.85, 0.05, 0.22), tre);
        tofte.position.set(0, 0.2, z);
        tofte.castShadow = true;
        g.add(tofte);
    }
    return g;
}
