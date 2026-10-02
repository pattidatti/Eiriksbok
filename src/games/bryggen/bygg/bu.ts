// Bua og lagerloftet i et forhus: tørrfisk i stabler og bunter, kornsekker, tranfat, bismeren
// som varene ble veid med, og skrivepulten med gjeldsboka.
//
// Det vi vet [V]: tørrfisk var over 80 prosent av Norges eksport på 1300-tallet. Kontoret styrte
// kornimporten, og fiskerne fikk korn og utstyr «på bok» (nordfarergjeld). Fisken ble veid i våg
// og bismerpund (blueprint §4.3). Forhusene mot sjøen var lagerhus med uisolerte loft. Hvordan en
// bu var innredet i 1420-årene er ikke beskrevet i kildene vi har [K]. Stablene med halene ut,
// buntene, bismeren og pulten følger museet og bilder fra senere tid [S].
//
// Ingen ild: åpen ild var forbudt i gårdene [V]. Lyset kommer inn gjennom dører og glugger.
import * as THREE from 'three';
import type { ColliderKit, MeshKit } from '../motor/meshkit';
import { floorY, floorZ, rng, type HouseSpec } from './moduler';
import { WALL_T, golvY, trappehull } from './inne';
import type { Plass } from './folk';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Tørrfisk: lys, gråbrun og litt gyllen. */
const FISK = { top: 1.45, bottom: 1.15, hue: [1.02, 0.98, 0.86] as [number, number, number] };
const HAMP = { top: 1.1, bottom: 0.9, hue: [1.12, 1.02, 0.8] as [number, number, number] };

interface Rect {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
}

/** Bygger bua (etasje 0) og lagerloftet (etasje 1) i husets eget rom. Gir folkene i bua. */
export function bu(k: MeshKit, c: ColliderKit, s: HouseSpec): Plass[] {
    const r = rng(1426);
    const xIn = s.w / 2 - WALL_T;
    const sv = s.inne?.trapp?.side ?? -1;
    // Speilet: positiv x er siden med trappa, negativ siden mot gårdsrommet.
    const X = (x: number) => sv * x;
    const y0 = golvY(s, 0);
    const l = s.l - WALL_T;

    // ── Bua ──
    stabel(k, c, rect(X(xIn - 1.3), X(xIn - 0.05), 0.45, 2.3), y0, 1.35, r, sv);
    stabel(k, c, rect(X(xIn - 1.4), X(xIn - 0.05), (s.inne?.trapp?.z1 ?? 6) + 0.45, l - 0.1), y0, 1.6, r, sv);
    // Under trappa, der den er høy nok: sekker.
    sekker(k, c, rect(X(xIn - 0.95), X(xIn - 0.1), 5.0, 6.0), y0, r);
    // Langs veggen mot gårdsrommet, mellom dørene: kornsekker fra Lübeck.
    sekker(k, c, rect(X(-xIn + 0.1), X(-xIn + 0.75), 3.0, 5.8), y0, r);
    // Tranfat på ei slind langs bakveggen.
    fat(k, c, X(-xIn + 0.5), X(xIn - 1.7), l - 0.5, y0);
    // Ferdige bunter ved bismeren, klare til veiing.
    bunter(k, c, rect(X(-0.4), X(0.9), 3.3, 4.3), y0, 2, r);
    bismer(k, s, X(-0.5), 2.6);
    pult(k, c, X(-xIn + 0.55), 0.95, y0, sv);

    // ── Lagerloftet ──
    const y1 = golvY(s, 1);
    const zf = floorZ(s, 1) + WALL_T;
    const hull = trappehull(s);
    const midt = s.upperDoors?.find((d) => d.side === -sv)?.z ?? 4.5;
    // Langs veggen med trappa: foran hullet, og bak det. Bak hullet står stabelen et godt stykke
    // unna, ellers stanger gutten i den når han kommer opp av trappa.
    stabel(k, c, rect(X(xIn - 1.3), X(xIn - 0.05), zf + 0.25, (hull?.z0 ?? 3.5) - 0.4), y1, 1.55, r, sv);
    stabel(k, c, rect(X(xIn - 1.3), X(xIn - 0.05), (hull?.z1 ?? 6.2) + 1.5, l - 0.1), y1, 1.7, r, sv);
    // Mot svalgangen: foran og bak døra.
    stabel(k, c, rect(X(-xIn + 0.05), X(-xIn + 1.35), zf + 0.9, midt - 0.85), y1, 1.6, r, -sv as -1 | 1);
    stabel(k, c, rect(X(-xIn + 0.05), X(-xIn + 1.35), midt + 0.85, l - 0.1), y1, 1.5, r, -sv as -1 | 1);
    // Buntene innenfor loftsdøra: herfra går de i tauet fra vinsjen og ned på kaia.
    bunter(k, c, rect(X(-1.45), X(-0.6), zf + 0.15, zf + 1.3), y1, 3, r);
    sekker(k, c, rect(X(0.6), X(1.4), l - 1.4, l - 0.15), y1, r);

    // ── Folkene [S] ──
    // Husbonden fører gjeldsboka ved pulten, svennen leser av bismeren, og skutedrengen står
    // med en bunt i armene, klar til å bære den ut døra mot gårdsrommet. Ingen står i døråpningene,
    // i ganglinja fra porten eller ved trappefoten.
    const yaw = (fx: number, fz: number) => Math.atan2(fx, fz);
    return [
        { figur: 'husbonde', rolle: 'skrive', pos: V(X(-xIn + 0.55) + sv * 0.62, y0, 0.95), yaw: yaw(-sv, 0) },
        { figur: 'svenn', rolle: 'veie', pos: V(X(-0.75), y0, 3.2), yaw: Math.PI },
        { figur: 'dreng', rolle: 'baere', pos: V(X(-1.6), y0, 5.0), yaw: yaw(-sv, 1) },
    ];
}

const rect = (a: number, b: number, z0: number, z1: number): Rect => ({ x0: Math.min(a, b), x1: Math.max(a, b), z0, z1 });

/**
 * Én tørrfisk: lang, smal og stiv, med ryggen som en kam på midten og sidene som faller av, og
 * halen som en vifte. Fisken tørket på hjell og ble skjev, så halen løfter seg litt. Ligger fra
 * `a` langs `dir`, kammen opp. Tegnes fra `fra` meter ut: i en stabel ligger resten av fisken inne
 * i kjernen og synes ikke.
 *
 * UV-ene dekker bare noen centimeter av teksturen, så fisken får én flat farge (ingen treårer), og
 * formen kommer fra lyset på kammen og de mørkere kantene.
 */
function fisk(k: MeshKit, a: THREE.Vector3, dir: THREE.Vector3, len: number, r: () => number, tilt = 0, fra = 0): void {
    const tone = FISK.top * (0.85 + r() * 0.3);
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const up = new THREE.Vector3(0, 1, 0).applyAxisAngle(dir, tilt);
    side.applyAxisAngle(dir, tilt);
    const body = len * 0.84;
    const hw = 0.055 + r() * 0.02;
    const kam = 0.028 + r() * 0.01;
    const loft = (r() - 0.3) * 0.06;
    const u0 = r() * 1.2;
    const v0 = r() * 1.2;
    const at = (t: number, s2: number, h: number) => {
        const lift = loft * Math.max(0, t / len - 0.5) * 2;
        return a.clone().addScaledVector(dir, t).addScaledVector(side, s2).addScaledVector(up, h + lift);
    };
    const uv = (t: number, s2: number): [number, number] => [u0 + s2 * 0.05, v0 + t * 0.05];
    // Stasjoner langs fisken: avstand, halv bredde og kammens høyde.
    const st: [number, number, number][] = [
        [0, hw * 0.75, kam * 0.7],
        [body * 0.3, hw, kam],
        [body * 0.65, hw * 0.65, kam * 0.7],
        [body, hw * 0.35, kam * 0.3],
    ];
    const KANT = 0.62 * tone;
    const RYGG = 1.08 * tone;
    k.withTint(FISK, () => {
        for (let i = 0; i < st.length - 1; i++) {
            const [ta, wa, ha] = st[i];
            const [tb, wb, hb] = st[i + 1];
            if (tb < fra) continue;
            const La = at(ta, -wa, 0), Sa = at(ta, 0, ha), Ra = at(ta, wa, 0);
            const Lb = at(tb, -wb, 0), Sb = at(tb, 0, hb), Rb = at(tb, wb, 0);
            k.tri('raatre', La, Sa, Sb, uv(ta, -wa), uv(ta, 0), uv(tb, 0), [KANT, RYGG, RYGG]);
            k.tri('raatre', La, Sb, Lb, uv(ta, -wa), uv(tb, 0), uv(tb, -wb), [KANT, RYGG, KANT]);
            k.tri('raatre', Sa, Ra, Rb, uv(ta, 0), uv(ta, wa), uv(tb, wb), [RYGG, KANT, KANT]);
            k.tri('raatre', Sa, Rb, Sb, uv(ta, 0), uv(tb, wb), uv(tb, 0), [RYGG, KANT, RYGG]);
        }
        // Halen: en vifte med et hakk i enden, begge sider, litt mørkere.
        // Fra halerota (en bred kant, ikke en spiss) og ut til to fliker med et hakk imellom.
        const wr = hw * 0.35;
        const r0 = at(body, -wr, 0), r1 = at(body, wr, 0);
        const f0 = at(len, -0.05, 0), fm = at(len - 0.03, 0, 0), f1 = at(len, 0.05, 0);
        const S = 0.8 * tone;
        for (const [a2, b2, c2] of [[r0, f0, fm], [r0, fm, r1], [r1, fm, f1]] as const) {
            k.tri('raatre', a2, c2, b2, uv(0, 0), uv(0.03, 0.03), uv(0.03, -0.03), [S, KANT, KANT]);
            k.tri('raatre', a2, b2, c2, uv(0, 0), uv(0.03, -0.03), uv(0.03, 0.03), [S, KANT, KANT]);
        }
    });
}

/**
 * Stabel med tørrfisk: fisken lagt lag på lag med hodene annenhver vei, slik at halene stikker
 * ut på begge sider. Inni er stabelen én kloss; fisken ligger på tvers av veggen (langs x) og så
 * tett at den dekker kloss-sidene. `wall` er siden veggen står på (-x/+x): der synes ikke fisken,
 * så den bygges bare i øverste lag. En `bunt` er presset hard: kjernen fyller hele bunten, og
 * bare halene stikker ut.
 */
function stabel(k: MeshKit, c: ColliderKit, rc: Rect, y: number, h: number, r: () => number, wall: -1 | 0 | 1, bunt = false): void {
    const w = rc.x1 - rc.x0;
    const d = rc.z1 - rc.z0;
    if (w < 0.4 || d < 0.4) return;
    const xm = (rc.x0 + rc.x1) / 2;
    const zm = (rc.z0 + rc.z1) / 2;
    const dy = 0.07;
    const lag = Math.max(2, Math.floor(h / dy));
    // Kjernen går opp til det øverste hele laget, så fisken der ligger oppå og dekker den. Flat og
    // mørk, så glippene mellom lagene leses som skygge og ikke som en kasse. En bunt er lysere.
    const inn = bunt ? 0.04 : 0.25;
    const kh = 0.015 + (lag - 1) * dy;
    k.withUv(0.04, () =>
        k.withTint(bunt ? { top: 0.95, bottom: 0.8, hue: FISK.hue } : { top: 0.42, bottom: 0.3, hue: FISK.hue }, () =>
            k.box('raatre', xm, y + kh / 2, zm, w - inn, kh, d - (bunt ? 0.02 : 0.1), { skip: ['bottom'] })
        )
    );
    c.box(xm, y + h / 2, zm, w - 0.1, h, d - 0.05, bunt);
    const rad = Math.max(2, Math.floor(d / 0.13));
    const len = bunt ? w * 0.5 + 0.12 : w * 0.62 + 0.1;
    // Under toppen synes bare det som stikker ut av kjernen.
    const skjult = Math.max(0, (w - inn) / 2 - 0.2);
    // Det øverste hele laget dekker kjernen; over det et ujevnt halvt lag (ikke i bunter, de stables).
    for (let i = 0; i <= (bunt ? lag - 1 : lag); i++) {
        const yy = y + 0.03 + i * dy;
        const n = i === lag ? Math.floor(rad * (0.3 + r() * 0.4)) : rad;
        const j0 = i === lag ? Math.floor(r() * (rad - n)) : 0;
        for (let j = j0; j < j0 + n; j++) {
            const z = rc.z0 + 0.04 + ((d - 0.08) * (j + 0.5)) / rad + (r() - 0.5) * 0.03;
            // Fra hver side: hodet inne i stabelen, halen ut. Annenhver rad forskjøvet.
            for (const fra of (i + j) % 2 === 0 ? [true, false] : [false, true]) {
                if (wall !== 0 && (fra ? -1 : 1) === wall && i < lag - 1) continue;
                const jx = (r() - 0.5) * 0.08;
                const a = V(fra ? xm - 0.05 + jx : xm + 0.05 + jx, yy + (fra ? 0 : dy * 0.4), z);
                fisk(k, a, V(fra ? -1 : 1, 0, (r() - 0.5) * 0.12).normalize(), len, r, (r() - 0.5) * 0.12, i >= lag - 1 ? 0 : skjult);
            }
        }
    }
    if (bunt) return;
    // Endene: her ligger fisken på langs, med halen ut, så enden ikke blir en naken kloss.
    const nx = Math.max(2, Math.round(w / 0.17));
    for (let i = 0; i < lag; i++) {
        const yy = y + 0.03 + i * dy + dy * 0.5;
        for (const e of [-1, 1]) {
            const ze = e < 0 ? rc.z0 + 0.3 : rc.z1 - 0.3;
            for (let j = 0; j < nx; j++) {
                const x = rc.x0 + (w * (j + 0.5 + (i % 2) * 0.4)) / (nx + 0.4) + (r() - 0.5) * 0.04;
                fisk(k, V(x, yy, ze), V((r() - 0.5) * 0.15, 0, e).normalize(), 0.5, r, (r() - 0.5) * 0.15, 0.2);
            }
        }
    }
}

/**
 * Bunter: fisk presset i firkantede bunter og surret med tau, stablet `hoy` i høyden. Hver bunt er
 * en liten stabel, så halene stikker ut i begge ender.
 */
function bunter(k: MeshKit, c: ColliderKit, rc: Rect, y: number, hoy: number, r: () => number): void {
    const bw = 0.62;
    const bd = 0.42;
    const bh = 0.36;
    for (let x = rc.x0 + bw / 2; x <= rc.x1 - bw / 2 + 0.01; x += bw + 0.06) {
        for (let z = rc.z0 + bd / 2; z <= rc.z1 - bd / 2 + 0.01; z += bd + 0.04) {
            const n = Math.max(1, hoy - (r() < 0.4 ? 1 : 0));
            for (let i = 0; i < n; i++) {
                const yy = y + i * bh;
                const jx = (r() - 0.5) * 0.06;
                stabel(k, c, rect(x + jx - bw / 2, x + jx + bw / 2, z - bd / 2, z + bd / 2), yy, bh - 0.01, r, 0, true);
                k.withTint(HAMP, () => {
                    for (const dx of [-0.15, 0.15]) k.box('raatre', x + jx + dx, yy + bh / 2 - 0.01, z, 0.04, bh - 0.01, bd + 0.01);
                });
            }
        }
    }
}

/** Kornsekker av hamp: stående, litt slappe på toppen, noen lent mot hverandre. */
function sekker(k: MeshKit, c: ColliderKit, rc: Rect, y: number, r: () => number): void {
    const step = 0.5;
    const nx = Math.max(1, Math.floor((rc.x1 - rc.x0) / step));
    const nz = Math.max(1, Math.floor((rc.z1 - rc.z0) / step));
    for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
            const x = rc.x0 + (rc.x1 - rc.x0) * (i + 0.5) / nx + (r() - 0.5) * 0.06;
            const z = rc.z0 + (rc.z1 - rc.z0) * (j + 0.5) / nz + (r() - 0.5) * 0.06;
            const h = 0.6 + r() * 0.15;
            const lean = (r() - 0.5) * 0.12;
            const tone = 0.85 + r() * 0.3;
            k.withTint({ ...HAMP, top: HAMP.top * tone, bottom: HAMP.bottom * tone * 0.85 }, () => {
                k.log('raatre', V(x, y, z), V(x + lean * 0.5, y + h * 0.75, z), 0.21, 7, true, 0.23);
                k.log('raatre', V(x + lean * 0.5, y + h * 0.75, z), V(x + lean, y + h, z), 0.23, 7, true, 0.12);
                // Snora rundt halsen.
                k.withTint({ top: 0.6, bottom: 0.6 }, () => k.log('raatre', V(x + lean * 0.8, y + h * 0.88, z), V(x + lean * 0.85, y + h * 0.92, z), 0.15, 7, false));
            });
        }
    }
    const xm = (rc.x0 + rc.x1) / 2;
    const zm = (rc.z0 + rc.z1) / 2;
    c.box(xm, y + 0.38, zm, rc.x1 - rc.x0, 0.76, rc.z1 - rc.z0, true);
}

/**
 * Tranfat på ei slind (to stokker på golvet): liggende tønner med tappen ut, fra `xa` til `xb`.
 * Tran var den andre varen fra nord [V].
 */
function fat(k: MeshKit, c: ColliderKit, xa: number, xb: number, z: number, y: number): void {
    const x0 = Math.min(xa, xb);
    const x1 = Math.max(xa, xb);
    const R = 0.3;
    k.withTint({ top: 0.45, bottom: 0.4 }, () => {
        for (const dz of [-0.22, 0.22]) k.box('raatre', (x0 + x1) / 2, y + 0.06, z + dz, x1 - x0, 0.12, 0.12);
    });
    for (let x = x0 + R + 0.02; x <= x1 - R; x += R * 2 + 0.05) {
        const yc = y + 0.12 + R;
        // Buken: tre stykker, tykkest på midten.
        k.withTint({ top: 0.85, bottom: 0.7, hue: [1.04, 0.96, 0.86] }, () => {
            k.log('raatre', V(x, yc, z - 0.4), V(x, yc, z - 0.12), R * 0.86, 10, true, R);
            k.log('raatre', V(x, yc, z - 0.12), V(x, yc, z + 0.12), R, 10, false);
            k.log('raatre', V(x, yc, z + 0.12), V(x, yc, z + 0.4), R, 10, true, R * 0.86);
        });
        k.withTint({ top: 0.3, bottom: 0.3 }, () => {
            for (const dz of [-0.3, 0.3]) k.log('raatre', V(x, yc, z + dz - 0.025), V(x, yc, z + dz + 0.025), R * 0.95, 10, false);
            // Tappen i fatet.
            k.log('raatre', V(x, yc - R * 0.5, z - 0.4), V(x, yc - R * 0.5, z - 0.47), 0.03, 5);
        });
    }
    c.box((x0 + x1) / 2, y + 0.12 + R, z, x1 - x0, R * 2 + 0.24, 0.84, true);
}

/**
 * Bismeren: ei stang med et tungt lodd i den ene enden og en krok i den andre. Den henger i et tau
 * fra en bjelke, og man flytter tauløkka langs stanga til den står vannrett; merkene viser vekta.
 * En bunt henger i kroken, midt i veiingen.
 */
function bismer(k: MeshKit, s: HouseSpec, x: number, z: number): void {
    const top = floorY(s, 1) - 0.2;
    const y = 1.35;
    const tilt = 0.06;
    const a = V(x - 0.6, y - tilt, z);
    const b = V(x + 0.55, y + tilt, z);
    k.withTint({ top: 0.7, bottom: 0.6, hue: [1.05, 0.97, 0.88] }, () => k.log('raatre', a, b, 0.032, 6, true, 0.024));
    // Merkene: korte, mørke ringer langs stanga.
    k.withTint({ top: 0.2, bottom: 0.2 }, () => {
        for (let i = 1; i < 6; i++) {
            const p = a.clone().lerp(b, 0.45 + i * 0.09);
            k.log('raatre', p.clone().setX(p.x - 0.006), p.clone().setX(p.x + 0.006), 0.035, 6, false);
        }
    });
    // Loddet: ei tung kule av tre med jern rundt, og kroken i den andre enden.
    k.withTint({ top: 0.5, bottom: 0.4, hue: [0.95, 0.9, 0.85] }, () => {
        k.log('raatre', V(a.x - 0.02, a.y, z), V(a.x + 0.1, a.y, z), 0.06, 9, true, 0.095);
        k.log('raatre', V(a.x + 0.1, a.y, z), V(a.x + 0.2, a.y, z), 0.095, 9, true, 0.04);
    });
    const loop = a.clone().lerp(b, 0.62);
    k.withTint({ top: 0.95, bottom: 0.95, hue: [1.05, 0.95, 0.75] }, () => {
        k.log('raatre', V(loop.x, top, z), V(loop.x, loop.y + 0.04, z), 0.018, 5, false);
        k.log('raatre', V(b.x - 0.02, b.y, z), V(b.x - 0.02, b.y - 0.3, z), 0.014, 4, false);
    });
    k.withTint({ top: 0.25, bottom: 0.25 }, () => {
        k.log('mork', V(b.x - 0.02, b.y - 0.3, z), V(b.x + 0.04, b.y - 0.36, z), 0.012, 4, false);
    });
    // Bunten i kroken.
    const by = b.y - 0.58;
    k.withTint(FISK, () => k.box('raatre', b.x, by, z, 0.48, 0.34, 0.36, { grain: 'x' }));
    k.withTint(HAMP, () => {
        for (const dx of [-0.13, 0.13]) k.box('raatre', b.x + dx, by, z, 0.04, 0.345, 0.37);
        k.log('raatre', V(b.x - 0.13, by + 0.17, z), V(b.x + 0.04, b.y - 0.36, z), 0.012, 4, false);
        k.log('raatre', V(b.x + 0.13, by + 0.17, z), V(b.x + 0.04, b.y - 0.36, z), 0.012, 4, false);
    });
}

/**
 * Skrivepulten der svennen førte gjeldsboka: skrå plate på fire bein, boka slått opp, og en
 * kiste med jernbånd ved siden av. `sv` er siden med trappa; pulten står mot den andre veggen.
 */
function pult(k: MeshKit, c: ColliderKit, x: number, z: number, y: number, sv: -1 | 1): void {
    const h = 1.05;
    const w = 0.85;
    const d = 0.6;
    // Plata heller ned mot den som står ved pulten (inn i rommet).
    const inn = sv; // retningen inn i rommet fra veggen pulten står ved
    k.withTint({ top: 0.55, bottom: 0.45, hue: [1.04, 0.97, 0.88] }, () => {
        for (const dx of [-0.32, 0.32]) {
            for (const dz of [-0.36, 0.36]) {
                const lh = h - (dx * inn > 0 ? 0.08 : 0);
                k.box('raatre', x + dx * 0.8, y + lh / 2, z + dz, 0.07, lh, 0.07);
            }
        }
        const m = new THREE.Matrix4().makeRotationZ(-inn * 0.2).setPosition(x, y + h - 0.02, z);
        k.slab('raatre', m, d, 0.05, w, { grain: 'z' });
        // Hylla under.
        k.box('raatre', x, y + 0.35, z, d - 0.1, 0.04, w - 0.1);
    });
    // Gjeldsboka: to lyse sider på hver sin side av ryggen, litt reist.
    const by = y + h + 0.03;
    const book = new THREE.Matrix4().makeRotationZ(-inn * 0.2).setPosition(x, by, z);
    k.push(book);
    k.withTint({ top: 1.5, bottom: 1.4, hue: [1.1, 1.02, 0.85] }, () => {
        for (const sz of [-1, 1]) {
            const m = new THREE.Matrix4().makeRotationX(sz * 0.08).setPosition(0, 0.01, sz * 0.13);
            k.slab('raatre', m, 0.3, 0.02, 0.25);
        }
    });
    k.withTint({ top: 0.3, bottom: 0.3, hue: [1, 0.85, 0.7] }, () => k.box('raatre', 0, -0.005, 0, 0.32, 0.02, 0.54));
    k.pop();
    // Blekkhorn i hjørnet av pulten.
    k.withTint({ top: 0.9, bottom: 0.8, hue: [1.1, 1.0, 0.8] }, () => k.log('raatre', V(x - inn * 0.18, by + 0.02, z + 0.36), V(x - inn * 0.18, by + 0.12, z + 0.36), 0.025, 6, true, 0.018));
    c.box(x, y + h / 2, z, d, h, w, true);
    // Kista ved siden av: lokk med jernbånd.
    const kz = z + 0.95;
    k.withTint({ top: 0.7, bottom: 0.5, hue: [1.06, 0.96, 0.85] }, () => k.box('raatre', x, y + 0.27, kz, 0.55, 0.54, 0.95, { skip: ['bottom'] }));
    k.withTint({ top: 0.22, bottom: 0.22 }, () => {
        for (const dz of [-0.3, 0, 0.3]) k.box('raatre', x, y + 0.28, kz + dz, 0.57, 0.56, 0.05);
    });
    c.box(x, y + 0.27, kz, 0.55, 0.54, 0.95, true);
}
