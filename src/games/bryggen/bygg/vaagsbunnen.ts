// Vågsbunnen: håndverkernes kvarter innerst i Vågen, sør for Bryggen.
//
// Det vi vet:
//  - Bryggen gikk til Auta allmenning (dagens Vetrlidsallmenning), Bryggens sørgrense [V §5.2].
//  - Skostredet var i middelalderen den nordligste veien mellom Bryggen og Stranden, rundt bunnen av
//    Vågen. Langs gata sto det opptil 36 skomakerboder med to håndverkere i hver, og de hadde brygger
//    mot Vågen. De fleste var tyskere, og de hadde makt til å stenge gata [V Byleksikon «Skostredet»].
//  - Tyske skomakere leide Vågsbunnen gård av kongen i 1330, og holdt til i Vågsbunnen gjennom hele
//    middelalderen [V Wikipedia «Vågsbunnen»].
//  - De fem tyske amtene: skomakere, bakere, gullsmeder, buntmakere og barberere [V Wikipedia].
//  - Mikaelskirken var sognekirke for de tyske skomakerne og brant i 1413 [V]; se kirker-vaagsbunnen.ts.
//
// Det vi ikke vet [K]: hvordan gata og bodene lå, hvor de andre håndverkerne holdt til, og hvordan
// Vågsbunnen så ut i 1420-årene. Derfor er alt her lagt ut for spillet [S]: kaia med brygger nederst,
// skomakerboder på sjøsida av gata, verksteder for de andre amtene (og en norsk smed) på landsida,
// og ruinen av Mikaelskirken bak. Avstandene er komprimert som resten av byen.
//
// Verden som ellers: x langs sjøen (Holmen = +x), z innover. Kvarteret ligger vest (-x) for den
// siste nabogården. Det er to celler langs x; den østre har Auta allmenning med trappa opp til
// Øvregaten. Ved den vestre enden ligger en bom over gata, og bak den en kulisse (`endeCelle`).
import * as THREE from 'three';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import type { CellContent, CellDef, Rom, Sted } from '../motor/streaming';
import { Ild } from '../motor/ild';
import { COLD, DARK, FRONT_Z, GARD_DEPTH, T, WARM, kai, kaiJog, toGroup, tonne, type Sides } from './gard';
import { hus, husLod, rng, trekkGlugger, type HouseSpec } from './moduler';
import { verksted, type Fag, type VerkstedSpec } from './verksted';
import { korskirken, mikaelskirken } from './kirker-vaagsbunnen';
import { lagFolk, type Plass } from './folk';
import type { Rute } from './vandrer';
import { LIST, STEIN } from './stein';
import { MUR_Z } from './allmenning';
import { NIKOLAI_Y } from './nikolaikirken';
import { spor } from './torg';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Hvor bredt hele kvarteret er langs x, og Auta allmenning øst i det. */
export const VB_BREDDE = 66;
export const AUTA_W = 8;
/** Gata: plankeveien langs x, og hvor bodene står. */
const GATE = { z: 15, w: 2.4, sjo: 12.0, land: 18.2 };
/** Trappa opp til Øvregaten i Auta allmenning (bredde og hvor den starter). */
const TRAPP = { w: 2.4, z0: 57.5, z1: MUR_Z };
/** Hvor bred åpningen i støttemuren må være for trappa (ovregaten.ts). */
export const AUTA_HULL = TRAPP.w / 2 + 0.4;

const SJO = Math.PI;
const NORD = 0;
const OST = Math.PI / 2;
const VEST = -Math.PI / 2;

interface Plan {
    fag: Fag;
    w: number;
    l: number;
    id?: string;
    samtale?: string;
}

/** Verkstedene på landsida av gata, fra øst mot vest. */
const LANDSIDE: Record<'o' | 'v', Plan[]> = {
    o: [
        { fag: 'baker', w: 6.2, l: 8, id: 'wilken' },
        { fag: 'gullsmed', w: 5.0, l: 7 },
        { fag: 'skomaker', w: 4.6, l: 7, id: 'hans', samtale: 'skomaker' },
        { fag: 'buntmaker', w: 5.4, l: 7.5 },
    ],
    v: [
        { fag: 'barberer', w: 5.4, l: 7.5 },
        { fag: 'smed', w: 6.4, l: 8 },
        { fag: 'skomaker', w: 4.4, l: 6.5 },
        { fag: 'skomaker', w: 4.4, l: 6.5 },
    ],
};

/** Grove mål for et verksted på avstand (middels nivå): kroppen og taket i flat farge. */
function verkstedLod(lod: MeshKit, s: VerkstedSpec, mats: Materials): void {
    const spec: HouseSpec = { w: s.w, l: s.l, floors: [s.h], roof: s.roof, pitch: s.pitch, tint: s.tint, cornersFront: false, cornersBack: false };
    husLod(lod, spec, (key) => mats.lodColor(key));
}

/**
 * Skomakerbodene på sjøsida, fra `x1` mot vest. Trekkes først fra cellas frø, så `brygger` kan
 * regne ut de samme plassene uten å bygge cella.
 */
function sjoRad(x0: number, x1: number, r: () => number): { cx: number; spec: VerkstedSpec }[] {
    const ut: { cx: number; spec: VerkstedSpec }[] = [];
    let x = x1 - 0.6;
    let n = 0;
    while (x - 4.2 > x0 + 0.6) {
        const w = 4.0 + r() * 0.5;
        const spec: VerkstedSpec = {
            fag: 'skomaker', w, l: GATE.sjo - FRONT_Z - 0.9, h: 2.4, pitch: 0.75 + r() * 0.15, roof: r() < 0.7 ? 'torv' : 'bordtak',
            tint: T(0.82 + r() * 0.2, [WARM, COLD, DARK][Math.floor(r() * 3)]), dor: r() < 0.5 ? -1 : 1,
        };
        ut.push({ cx: x - w / 2, spec });
        x -= w + (n % 2 === 1 ? 1.8 : 0.15);
        n++;
    }
    return ut;
}

/** Bryggetrappene: i smauet etter annenhver bod. */
function trappene(sjo: { cx: number; spec: VerkstedSpec }[], x0: number): number[] {
    const ut: number[] = [];
    for (let i = 1; i < sjo.length; i += 2) {
        const bx = sjo[i].cx - sjo[i].spec.w / 2 - 0.9;
        if (bx > x0 + 1) ut.push(bx);
    }
    return ut;
}

/** Hvor bryggetrappene i kvarteret står (x), så båtene kan fortøyes ved siden av dem (trafikk.ts). */
export function brygger(xw: number): number[] {
    const xm = xw - 36;
    return [
        ...trappene(sjoRad(xm, xw - AUTA_W, rng(1330)), xm),
        ...trappene(sjoRad(xw - VB_BREDDE, xm, rng(1413)), xw - VB_BREDDE),
    ];
}

/** Kvarterets to celler som plasser langs fronten (bryggen.ts sorterer dem inn med gårdene). */
export function vaagsbunnenPlasser(mats: Materials, xw: number): { id: string; x0: number; x1: number; front: number; build: (s: Sides) => Promise<CellContent> }[] {
    const xm = xw - 36;
    return [
        { id: 'vaagsbunnen-o', x0: xm, x1: xw, front: 0.25, build: (s) => byggCelle(mats, xm, xw, 'o', 0.25, s) },
        { id: 'vaagsbunnen-v', x0: xw - VB_BREDDE, x1: xm, front: -0.35, build: (s) => byggCelle(mats, xw - VB_BREDDE, xm, 'v', -0.35, s) },
    ];
}

/** Hvor Auta-trappa står (x), gitt den østre grensa av kvarteret. */
export const autaX = (xw: number) => xw - AUTA_W / 2;

async function byggCelle(mats: Materials, x0: number, x1: number, del: 'o' | 'v', front: number, sides: Sides): Promise<CellContent> {
    const k = new MeshKit();
    const ki = new MeshKit();
    const glod = new MeshKit();
    const c = new ColliderKit();
    const lod = new MeshKit();
    const r = rng(del === 'o' ? 1330 : 1413);
    const near = new THREE.Group();
    near.name = `vaagsbunnen-${del}`;
    const rom: Rom[] = [];
    const ild: THREE.Vector3[] = [];
    const royk: THREE.Vector3[] = [];
    const ilder: Ild[] = [];
    const plasser: Plass[] = [];
    const ruter: Rute[] = [];
    const steder: Sted[] = [];
    const back = FRONT_Z + GARD_DEPTH;
    const auta = del === 'o' ? x1 - AUTA_W : x1; // vestkanten av allmenningen

    // Bakken: gjørme helt opp til støttemuren under Øvregaten, og kaia ytterst.
    k.withTint({ top: 0.9, bottom: 0.9 }, () => k.box('gjorme', (x0 + x1) / 2, -0.1, (FRONT_Z + back) / 2, x1 - x0, 0.2, back - FRONT_Z, { skip: ['bottom'] }));
    c.box((x0 + x1) / 2, -0.75, (FRONT_Z + back) / 2, x1 - x0, 1.5, back - FRONT_Z);
    kai(k, c, x0, x1, front, FRONT_Z - front);
    kaiJog(k, x0, front, sides.west, -1);
    kaiJog(k, x1, front, sides.east, 1);
    lod.withTint({ top: 1, bottom: 1, hue: [0.29, 0.23, 0.17] }, () => lod.box('mork', (x0 + x1) / 2, -0.05, (front + back) / 2, x1 - x0, 0.1, back - front, { skip: ['bottom'] }));

    // Skostredet: plankevei langs x, med en stokk langs hver kant og sledespor i gjørma ved siden av.
    const g0 = x0;
    const g1 = auta;
    k.withTint({ top: 0.82, bottom: 0.82 }, () => k.box('gardsrom', (g0 + g1) / 2, 0.0, GATE.z, g1 - g0, 0.08, GATE.w, { skip: ['bottom'], grain: 'x' }));
    k.withTint({ top: 0.55, bottom: 0.55 }, () => {
        for (const s of [-1, 1]) k.box('raatre', (g0 + g1) / 2, 0.03, GATE.z + (s * GATE.w) / 2, g1 - g0, 0.1, 0.14);
    });

    // Auta allmenning: plankegang fra kaia opp til trappa, og trappa opp til Øvregaten.
    if (del === 'o') {
        const ax = autaX(x1);
        const pz0 = FRONT_Z + 0.3;
        k.withTint({ top: 0.85, bottom: 0.85 }, () => k.box('gardsrom', ax, 0.0, (pz0 + TRAPP.z0) / 2, 2.0, 0.1, TRAPP.z0 - pz0, { skip: ['bottom'] }));
        k.withTint({ top: 0.55, bottom: 0.55 }, () => {
            for (const s of [-1, 1]) k.box('raatre', ax + s * 0.95, 0.02, (pz0 + TRAPP.z0) / 2, 0.12, 0.1, TRAPP.z0 - pz0);
        });
        trapp(k, c, ax);
        spor(k, ax - 2.6, FRONT_Z + 1, TRAPP.z0 - 2, 0.8, 7);
        // Brannkar og en vannpost midt i allmenningen: branngata skulle holdes fri [V allmenninger som branngater].
        for (const [dz, t] of [[3.2, 0.85], [3.9, 0.75]] as const) tonne(k, c, x1 - 0.9, FRONT_Z + dz, t);
        // Et plankegjerde langs gårdsgrensa, så allmenningen har en kant.
        k.withTint({ top: 0.8, bottom: 0.6, hue: DARK }, () => k.box('bordvegg', x1 - 0.1, 0.8, (FRONT_Z + 6 + back - 1) / 2, 0.05, 1.6, back - FRONT_Z - 7, { shadeFoot: true }));
        c.box(x1 - 0.1, 0.9, (FRONT_Z + 6 + back - 1) / 2, 0.12, 1.8, back - FRONT_Z - 7, true);
    }

    // Sjøsida: skomakerboder med ryggen mot kaia, to og to med et smau ned til bryggene imellom [V boder og brygger; S hvordan].
    const sjo = sjoRad(x0, auta, r);
    const sjoBoder = sjo.map((b) => b.cx);
    sjo.forEach((b, i) => bygg(b.cx, GATE.sjo, SJO, b.spec, undefined, i === 1 && del === 'o' ? 'claus' : undefined));
    let x: number;
    // Landsida: verkstedene til de andre amtene.
    x = auta - 0.8;
    const land: { x: number; w: number; fag: Fag }[] = [];
    for (const p of LANDSIDE[del]) {
        const w = p.w;
        if (x - w < x0 + 3) break;
        const spec: VerkstedSpec = {
            fag: p.fag, w, l: p.l, h: 2.6, pitch: 0.8 + r() * 0.15, roof: p.fag === 'smed' ? 'bordtak' : r() < 0.6 ? 'torv' : 'bordtak',
            tint: T(0.85 + r() * 0.18, [WARM, COLD, DARK][Math.floor(r() * 3)]), dor: r() < 0.5 ? -1 : 1,
        };
        bygg(x - w / 2, GATE.land, 0, spec, p.samtale, p.id);
        land.push({ x: x - w / 2, w, fag: p.fag });
        x -= w + 1.1 + r() * 0.8;
    }

    /** Ett verksted: huset, innredningen, folkene og ilden, flyttet på plass. */
    function bygg(cx: number, fz: number, rot: number, spec: VerkstedSpec, samtale?: string, id?: string): void {
        const m = new THREE.Matrix4().makeRotationY(rot).setPosition(cx, 0, fz);
        k.matrix = m.clone();
        ki.matrix = m.clone();
        glod.matrix = m.clone();
        c.matrix = m.clone();
        lod.matrix = m.clone();
        const info = verksted(k, ki, glod, c, spec, r);
        verkstedLod(lod, spec, mats);
        info.folk.forEach((p, i) => {
            plasser.push({
                ...p, pos: p.pos.clone().applyMatrix4(m), yaw: p.yaw + rot,
                // Mesteren (den første) får navnet og samtalen.
                samtale: i === 0 ? samtale : undefined, id: i === 0 ? (p.id ?? id) : p.id,
            });
        });
        // Rommet: dagslyset dempes litt inne. `yaw: 0` holder rottene ute (streaming.ts): her er det folk hele dagen.
        rom.push({ box: info.rom.clone().applyMatrix4(m), demp: 0.45, yaw: 0 });
        if (info.ild) ild.push(info.ild.clone().applyMatrix4(m));
        if (info.royk) royk.push(info.royk.clone().applyMatrix4(m));
        if (spec.fag === 'smed' && info.ild) {
            const f = new Ild({ smokeTop: 1.4, spread: 0.3 });
            f.group.position.copy(info.ild).applyMatrix4(m);
            ilder.push(f);
        }
        k.matrix = new THREE.Matrix4();
        ki.matrix = new THREE.Matrix4();
        glod.matrix = new THREE.Matrix4();
        c.matrix = new THREE.Matrix4();
        lod.matrix = new THREE.Matrix4();
    }

    // Bryggene: trapper ned mot vannet i smauene mellom bodene, og pullerter [S].
    for (const bx of trappene(sjo, x0)) bryggetrapp(k, c, bx, front);
    k.withTint({ top: 0.7, bottom: 0.7 }, () => {
        for (let px = x1 - 3; px > x0 + 1; px -= 7.5) k.log('raatre', V(px, -0.1, front + 0.45), V(px, 0.55, front + 0.45), 0.17, 8, true, 0.15);
    });
    for (let px = x1 - 3; px > x0 + 1; px -= 7.5) c.box(px, 0.25, front + 0.45, 0.32, 0.6, 0.32, true);

    // Bak verkstedene: i øst bolighus med gjerder og ved, i vest ruinen av Mikaelskirken.
    if (del === 'o') {
        bakgard(k, c, lod, mats, x0, auta, r);
    } else {
        const mx = (x0 + x1) / 2 + 2;
        const mz = 41;
        k.at(mx, 0, mz, 0, () => mikaelskirken(k, c), c);
        lod.matrix = new THREE.Matrix4().makeTranslation(mx, 0, mz);
        const st = mats.lodColor('stein');
        lod.withTint({ top: 0.6, bottom: 0.6, hue: [st.r, st.g, st.b] }, () => lod.box('mork', 0, 2.5, 0, 17, 5, 9, { skip: ['bottom'] }));
        lod.matrix = new THREE.Matrix4();
        steder.push({ id: 'mikaelskirken', pos: V(mx, 0, mz), r: 7 });
        // Kirkegården rundt ruinen: trekors og noen steinheller, skjeve av tiden [S].
        for (let i = 0; i < 14; i++) {
            const gx = mx - 12 + r() * 30;
            const side = r() < 0.5 ? -1 : 1;
            const gz = mz + side * (6.5 + r() * 3.5);
            const tilt = (r() - 0.5) * 0.25;
            k.at(gx, 0, gz, (r() - 0.5) * 0.4, () => {
                const m = new THREE.Matrix4().makeRotationZ(tilt);
                k.push(m);
                if (r() < 0.65) {
                    k.withTint({ top: 0.55, bottom: 0.45, hue: DARK }, () => {
                        k.box('raatre', 0, 0.5, 0, 0.08, 1.0, 0.08);
                        k.box('raatre', 0, 0.75, 0, 0.45, 0.07, 0.07);
                    });
                } else k.withTint({ ...STEIN, top: 0.75 }, () => k.box('stein', 0, 0.3, 0, 0.45, 0.6, 0.12, { skip: ['bottom'] }));
                k.pop();
            });
        }
        // Bommen over Skostredet ved den vestre enden: tønner og en stokk på bukker [V at skomakerne kunne stenge gata; S hvordan].
        bom(k, c, x0 + 1.2);
        plasser.push({ figur: 'skomakersvenn', rolle: 'staa', pos: V(x0 + 2.3, 0, GATE.z + 1.6), yaw: OST, samtale: 'sperring' });
        // Gjerde bak ruinen og mot vest: her slutter byen som er bygget.
        k.withTint({ top: 0.8, bottom: 0.6, hue: DARK }, () => k.box('bordvegg', x0 + 0.1, 0.8, (GATE.land + back) / 2, 0.05, 1.6, back - GATE.land, { shadeFoot: true }));
    }

    // Folk som går i gata.
    ruter.push(...gatefolk(del, x0, auta, sjoBoder, land));

    // ── Ferdig: husene med og uten skygge, innredningen, det som gløder, og folkene ──
    const naer = toGroup(k, mats, `vaagsbunnen-${del}`);
    const uten = naer.clone();
    uten.traverse((o) => (o.castShadow = false));
    const inne = toGroup(ki, mats, `vaagsbunnen-${del}:inne`, false);
    const glodMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xffffff, toneMapped: false });
    glodMat.color.setScalar(2.2);
    if (glod.bucket('mork').vertexCount > 0) inne.add(new THREE.Mesh(glod.bucket('mork').toGeometry(), glodMat));
    for (const f of ilder) inne.add(f.group);
    const folk = await lagFolk(plasser, mats, del === 'o' ? 1330 : 1413, ruter);
    near.add(naer, uten, inne, folk.group);
    const mid = new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial());
    mid.name = `vaagsbunnen-${del}:lod`;
    return {
        near, mid, inne: [inne], samlet: { delt: [naer], samlet: uten },
        colliders: [...c.specs, ...folk.colliders], rom, ild, royk, drypp: k.skjegg, steder,
        gaaende: folk.gaaende, snakkbare: folk.snakkbare,
        tick: (t, dt, ctx) => {
            ilder.forEach((f) => f.update(t, dt));
            folk.tick(t, dt, ctx);
        },
        dispose: () => {
            ilder.forEach((f) => f.dispose());
            folk.dispose();
            glodMat.dispose();
        },
    };
}

/** Steintrappa opp til Øvregaten i Auta allmenning, med vanger på sidene (som kirketrappa). */
function trapp(k: MeshKit, c: ColliderKit, x: number): void {
    const { w, z0, z1 } = TRAPP;
    const h = NIKOLAI_Y;
    const n = 10;
    const rise = h / n;
    const tread = (z1 - z0) / n;
    k.withTint(STEIN, () => {
        for (let i = 0; i < n; i++) {
            const top = rise * (i + 1);
            const z = z0 + tread * (i + 0.5);
            k.box('stein', x, top / 2 - 0.05, z, w, top + 0.1, tread + 0.02, { skip: ['bottom'] });
            for (const sx of [-1, 1]) k.box('stein', x + sx * (w / 2 + 0.2), (top + 0.35) / 2 - 0.05, z, 0.4, top + 0.45, tread + 0.02, { skip: ['bottom'] });
        }
    });
    k.withTint(LIST, () => {
        for (const sx of [-1, 1]) k.box('stein', x + sx * (w / 2 + 0.2), h + 0.25, z1 + 0.35, 0.45, 0.5, 0.75);
    });
    const pts: THREE.Vector3[] = [];
    for (const xx of [x - w / 2, x + w / 2]) pts.push(V(xx, 0, z0), V(xx, rise / 2, z0), V(xx, h, z1 - tread / 2), V(xx, h, z1 + 0.7), V(xx, 0, z1 + 0.7));
    c.hull(pts);
    for (const sx of [-1, 1]) {
        const xx = x + sx * (w / 2 + 0.2);
        const side: THREE.Vector3[] = [];
        for (const dx of [-0.2, 0.2]) side.push(V(xx + dx, 0, z0), V(xx + dx, rise + 0.35, z0), V(xx + dx, h + 0.5, z1 + 0.7), V(xx + dx, 0, z1 + 0.7));
        c.hull(side, true);
    }
}

/** En bryggetrapp: trinn ned langs bolverket til en flåte ved vannet, der båtene legger til [S]. */
function bryggetrapp(k: MeshKit, c: ColliderKit, x: number, front: number): void {
    const n = 5;
    k.withTint({ top: 0.7, bottom: 0.6, hue: WARM }, () => {
        for (let i = 0; i < n; i++) {
            const y = -0.25 - i * 0.22;
            k.box('raatre', x, y, front - 0.35 - i * 0.3, 1.2, 0.08, 0.32, { grain: 'x' });
        }
        // Flåten nederst, og stolper som holder trappa.
        k.box('dekke', x, -1.25, front - 2.3, 1.8, 0.14, 1.4);
        for (const sx of [-1, 1]) k.log('raatre', V(x + sx * 0.65, -2.4, front - 0.2), V(x + sx * 0.65, 0.5, front - 0.2), 0.08, 6);
    });
    // Rekkverk så gutten ikke går rett ut over kanten (prop): trappa er bare til å se på.
    c.box(x, 0.5, front - 0.2, 1.4, 1.0, 0.12, true);
}

/** Bommen over gata: tønner på hver side og en stokk på bukker imellom. */
function bom(k: MeshKit, c: ColliderKit, x: number): void {
    const z0 = GATE.sjo + 0.6;
    const z1 = GATE.land - 0.6;
    k.withTint({ top: 0.7, bottom: 0.7, hue: WARM }, () => {
        for (const z of [z0 + 0.8, (z0 + z1) / 2, z1 - 0.8]) {
            for (const s of [-1, 1]) {
                const m = new THREE.Matrix4().makeRotationX(s * 0.35).setPosition(x, 0.45, z + s * 0.15);
                k.slab('raatre', m, 0.08, 0.95, 0.08);
            }
        }
        k.log('raatre', V(x, 0.95, z0), V(x, 0.95, z1), 0.13, 8, true);
    });
    tonne(k, c, x - 0.6, z0 + 0.1, 0.85);
    tonne(k, c, x - 0.5, z1 - 0.1, 0.75);
    c.box(x, 0.8, (z0 + z1) / 2, 0.5, 1.6, z1 - z0 + 1.2, true);
}

/**
 * Bak verkstedene i øst: to bolighus for håndverkerne med gavlen mot gata, gjerder, vedstabler og
 * en brønn. Hvordan de bodde, er ikke funnet [K]; husene er av modulsettet [S].
 */
function bakgard(k: MeshKit, c: ColliderKit, lod: MeshKit, mats: Materials, x0: number, x1: number, r: () => number): void {
    const toner = [WARM, COLD, DARK];
    let x = x1 - 1.5;
    for (let i = 0; i < 3; i++) {
        const w = 5.6 + r() * 1.6;
        if (x - w < x0 + 1) break;
        const spec: HouseSpec = {
            w, l: 7.5 + r() * 2, floors: r() < 0.5 ? [2.5, 2.3] : [2.7], roof: r() < 0.7 ? 'torv' : 'bordtak', pitch: 0.8 + r() * 0.15,
            tint: T(0.86 + r() * 0.16, toner[Math.floor(r() * 3)]), cornersFront: true, cornersBack: true, hodeSeg: 5,
            doors: [{ side: r() < 0.5 ? -1 : 1, z: 1.3 }],
        };
        spec.glugger = trekkGlugger(spec, spec.doors![0].side, true, rng(i * 17 + 5));
        const m = new THREE.Matrix4().makeTranslation(x - w / 2, 0, 33 + r() * 2);
        k.matrix = m.clone();
        c.matrix = m.clone();
        lod.matrix = m.clone();
        hus(k, c, spec);
        husLod(lod, spec, (key) => mats.lodColor(key));
        x -= w + 2.2 + r() * 1.5;
    }
    k.matrix = new THREE.Matrix4();
    c.matrix = new THREE.Matrix4();
    lod.matrix = new THREE.Matrix4();
    // Gjerdet bak husene, og vedstabler langs det.
    const gz = 46;
    k.withTint({ top: 0.8, bottom: 0.6, hue: DARK }, () => k.box('bordvegg', (x0 + x1) / 2, 0.8, gz, x1 - x0 - 1, 1.6, 0.05, { shadeFoot: true }));
    c.box((x0 + x1) / 2, 0.9, gz, x1 - x0 - 1, 1.8, 0.12, true);
    k.withTint({ top: 0.9, bottom: 0.9, hue: [1.08, 0.97, 0.85] }, () => {
        for (let i = 0; i < 4; i++) {
            const vx = x0 + 3 + i * 6;
            for (let j = 0; j < 3; j++) {
                for (let s = 0; s < 6 - j; s++) k.log('raatre', V(vx - 0.4 + s * 0.16 + j * 0.08, 0.1 + j * 0.15, gz - 0.25), V(vx - 0.4 + s * 0.16 + j * 0.08, 0.1 + j * 0.15, gz - 0.9), 0.075, 6, true);
            }
            c.box(vx, 0.25, gz - 0.55, 1.1, 0.5, 0.7, true);
        }
    });
}

/**
 * Folk som går i gata: kunder fra bod til bod, en skomakersvenn som bærer skinn fra kaia, og folk
 * på vei mellom kaia og Øvregaten. Hver har sitt eget løp langs z (vandrerne kolliderer ikke med
 * hverandre).
 */
function gatefolk(del: 'o' | 'v', x0: number, x1: number, sjo: number[], land: { x: number; w: number; fag: Fag }[]): Rute[] {
    const P = (x: number, z: number, y = 0) => V(x, y, z);
    const ruter: Rute[] = [];
    const vest = x0 + 4;
    const ost = x1 - 2;
    const vedLand = (i: number) => land[Math.min(i, land.length - 1)]?.x ?? (x0 + x1) / 2;
    const vedSjo = (i: number) => sjo[Math.min(i, sjo.length - 1)] ?? (x0 + x1) / 2;
    if (del === 'o') {
        // Kona handler: brød hos bakeren, ser på sko, og går videre.
        ruter.push({
            figur: 'kjopekone', fart: 0.9, start: 0,
            stopp: [
                { p: P(vedLand(0), 16.6), vent: 6, se: NORD, gjor: true },
                { p: P(vedLand(2), 16.2) },
                { p: P(vedLand(2), 16.6), vent: 4, se: NORD },
                { p: P(vedSjo(2), 13.6), vent: 5, se: SJO, gjor: true },
                { p: P(vest, 14.2), vent: 3, se: VEST },
                { p: P(vedSjo(0), 14.2) },
            ],
        });
        // Skomakersvennen bærer en bunt skinn fra båtene ved bryggetrappa og inn i boden sin.
        const smau = (sjo[1] ?? x1) - 2.9;
        ruter.push({
            figur: 'skomakersvenn', fart: 1.0, start: 1,
            stopp: [
                { p: P(smau, 3.0), vent: 3, se: SJO, last: true },
                { p: P(smau, 9.0) },
                { p: P(smau, 14.6) },
                { p: P(vedSjo(0) - 0.6, 14.0), vent: 3, se: SJO, last: false },
                { p: P(smau, 14.2) },
                { p: P(smau, 9.0) },
            ],
        });
        // En borger går fra kaia opp Auta allmenning og trappa til Øvregaten, og ned igjen.
        const ax = x1 + AUTA_W / 2;
        ruter.push({
            figur: 'borger', fart: 1.05, start: 2,
            stopp: [
                { p: P(ax + 0.3, 2.5), vent: 4, se: SJO },
                { p: P(ax + 0.3, TRAPP.z0 - 0.4) },
                { p: P(ax + 0.3, TRAPP.z1 + 0.9, NIKOLAI_Y), vent: 5, se: NORD },
                { p: P(ax + 0.3, TRAPP.z0 - 0.4) },
            ],
        });
        // Tjenestejenta henter vann ved kaia og går til bakeren med det.
        ruter.push({
            figur: 'tjenestejente', fart: 0.95, start: 0, baer: 'botte',
            stopp: [
                { p: P(ax - 0.9, 2.2), vent: 3, se: SJO, last: true },
                { p: P(ax - 1.0, 15.4) },
                { p: P(vedLand(0) + 1.2, 15.4) },
                { p: P(vedLand(0) + 1.2, 17.0), vent: 3, se: NORD, last: false },
                { p: P(ax - 1.0, 15.6) },
            ],
        });
    } else {
        // En fisker går til smia med noe som skal smis, og en kone ser på sko.
        ruter.push({
            figur: 'fisker', fart: 0.9, start: 0,
            stopp: [
                { p: P(ost, 14.6), vent: 3, se: VEST },
                { p: P(vedLand(1), 15.0) },
                { p: P(vedLand(1), 16.7), vent: 9, se: NORD, gjor: true },
                { p: P(vedLand(0), 15.0) },
            ],
        });
        ruter.push({
            figur: 'bondekone', fart: 0.85, start: 1,
            stopp: [
                { p: P(vedSjo(1), 13.6), vent: 6, se: SJO, gjor: true },
                { p: P(vedSjo(3), 14.0) },
                { p: P(vedSjo(3), 13.6), vent: 5, se: SJO },
                { p: P(vest + 2, 14.0), vent: 4, se: VEST },
            ],
        });
    }
    return ruter;
}

/**
 * Bunnen av Vågen bak bommen: husene rundt den innerste enden av Vågen (der Skostredet fortsetter
 * mot Stranden) og Korskirken. Bare kulisse: ingen kollidere, grensene står i bryggen.ts. Bakken
 * dekker vannet under husene.
 */
export function endeCelle(mats: Materials, xb: number): CellDef {
    const x0 = xb - 46;
    const z0 = -124;
    const z1 = 82;
    return {
        id: 'vaagsbunnen-ende',
        center: new THREE.Vector2((x0 + xb) / 2, (z0 + z1) / 2),
        half: new THREE.Vector2((xb - x0) / 2, (z1 - z0) / 2),
        naerR: 80,
        build: async () => {
            const k = new MeshKit();
            const kirke = new MeshKit();
            const lod = new MeshKit();
            const c = new ColliderKit();
            const r = rng(1190);
            // Land der Vågen slutter: kai i flukt med fronten langs bunnen av Vågen, gjørme bak.
            k.withTint({ top: 0.85, bottom: 0.85 }, () => k.box('gjorme', (x0 + xb) / 2, -0.1, (z0 + z1) / 2, xb - x0, 0.2, z1 - z0, { skip: ['bottom'] }));
            lod.withTint({ top: 1, bottom: 1, hue: [0.29, 0.23, 0.17] }, () => lod.box('mork', (x0 + xb) / 2, -0.05, (z0 + z1) / 2, xb - x0, 0.1, z1 - z0, { skip: ['bottom'] }));
            k.at(xb, 0, 0, -Math.PI / 2, () => kai(k, c, z0 + 2, 0, 0, 2.5));
            // Husrekka langs bunnen av Vågen, med gavlen mot vannet (+x).
            const toner = [WARM, COLD, DARK];
            for (let z = -6; z > z0 + 8; z -= 7 + r() * 3) {
                const w = 5 + r() * 2;
                const spec: HouseSpec = {
                    w, l: 7 + r() * 3, floors: r() < 0.5 ? [2.5, 2.3] : [2.7], roof: r() < 0.75 ? 'torv' : 'bordtak', pitch: 0.8 + r() * 0.15,
                    tint: T(0.85 + r() * 0.18, toner[Math.floor(r() * 3)]), cornersFront: true, cornersBack: true, hodeSeg: 5,
                };
                spec.glugger = trekkGlugger(spec, 1, true, rng(Math.round(z) + 77));
                const m = new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(xb - 3, 0, z - w / 2);
                k.matrix = m.clone();
                c.matrix = m.clone();
                lod.matrix = m.clone();
                hus(k, c, spec);
                husLod(lod, spec, (key) => mats.lodColor(key));
            }
            // Bak bommen: Skostredet fortsetter, med boder på begge sider som svinger av mot sør.
            for (let i = 0; i < 3; i++) {
                for (const [z, rot] of [[GATE.sjo - 3.5, Math.PI], [GATE.land + 3.5, 0]] as const) {
                    const w = 4.2 + r() * 1.2;
                    const spec: HouseSpec = {
                        w, l: 6, floors: [2.5], roof: 'torv', pitch: 0.8, tint: T(0.85 + r() * 0.15, toner[i % 3]),
                        cornersFront: true, cornersBack: true, hodeSeg: 5, glugger: [{ side: 0, at: 0, floor: 0, open: r() < 0.5 }],
                    };
                    const m = new THREE.Matrix4().makeRotationY(rot).setPosition(xb - 3.5 - i * 5.6, 0, z + (rot ? 3 : -3));
                    k.matrix = m.clone();
                    c.matrix = m.clone();
                    lod.matrix = m.clone();
                    hus(k, c, spec);
                    husLod(lod, spec, (key) => mats.lodColor(key));
                }
            }
            // Der gata svinger av mot sør: et hus på tvers med gavlen mot gata stenger utsikten.
            {
                const spec: HouseSpec = {
                    w: 7, l: 6.5, floors: [2.6, 2.3], roof: 'torv', pitch: 0.85, tint: T(0.9, DARK),
                    cornersFront: true, cornersBack: true, hodeSeg: 5,
                    doors: [{ side: 1, z: 1.4 }],
                    glugger: [{ side: 0, at: -1.6, floor: 1, open: true }, { side: 0, at: 1.8, floor: 0 }, { side: 0, at: 0, floor: 2 }],
                };
                const m = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(xb - 21.5, 0, GATE.z + 0.5);
                k.matrix = m.clone();
                c.matrix = m.clone();
                lod.matrix = m.clone();
                hus(k, c, spec);
                husLod(lod, spec, (key) => mats.lodColor(key));
            }
            k.matrix = new THREE.Matrix4();
            lod.matrix = new THREE.Matrix4();
            // Korskirken på neset bak husene, synlig over takene fra gata.
            const kx = xb - 30;
            const kz = 30;
            kirke.at(kx, 0, kz, 0.25, () => korskirken(kirke));
            lod.matrix = new THREE.Matrix4().makeRotationY(0.25).setPosition(kx, 0, kz);
            const st = mats.lodColor('stein');
            lod.withTint({ top: 1, bottom: 1, hue: [st.r, st.g, st.b] }, () => {
                lod.box('mork', 0, 4, 0, 22, 8, 10, { skip: ['bottom'] });
                lod.box('mork', -14.2, 9.5, 0, 7, 19, 7, { skip: ['bottom'] });
            });
            const near = toGroup(k, mats, 'vaagsbunnen-ende', true);
            // Kirken har materialer med tynnere tåke: den er et landemerke (som Mariakirken).
            const kg = new THREE.Group();
            for (const [key, b] of kirke.buckets) {
                if (b.vertexCount === 0) continue;
                const mesh = new THREE.Mesh(b.toGeometry(), key === 'mork' ? mats.lodMaterial() : mats.tynnTake(key));
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                kg.add(mesh);
            }
            near.add(kg);
            const mid = new THREE.Group();
            mid.add(new THREE.Mesh(lod.bucket('mork').toGeometry(), mats.lodMaterial()), kg.clone());
            return { near, mid, colliders: [], drypp: k.skjegg };
        },
    };
}
