// Folk i gården: drakten til hver figur, og de som står, sitter og jobber i bua og schøtstua.
//
// Hvem som var der [V]: gårdene var delt i stuer med hver sin husbonde. Under ham sto svenner
// (gesell), skutedrenger og stuedrenger/junger, alle ugifte menn og gutter fra nordtyske
// hansabyer (SNL Det tyske kontor; Hanseatiske museum). Rangstigen og hvem som gjorde hva
// (stuedrengen lager mat, skutedrengen laster og losser, svennen lærer guttene å skrive og regne)
// er fortalt for 1600- og 1700-tallet; for 1420-årene er det usikkert [U]. Schøtstua var samlingsrommet
// for hele gården om vinteren [V]. Hvem som satt hvor og gjorde hva her, er valgt for spillet [S].
//
// Klærne: kjortel med belte, hette med kappe over skuldrene og lang tut bak (liripipe), hoser
// og lave sko. Funnene fra Herjolfsnes på Grønland (hetter med tut, kjortler og hoser, laget så sent
// som i 1430-årene) og Bockstensmannen fra Sverige (1340-1370) viser at slik gikk menn kledd i
// Nord-Europa i senmiddelalderen [V]. På Bryggen er det funnet sko og tekstiler i hopetall [V
// Bymuseet]. Fargene er et valg [S]: ufarget vadmel i grått og brunt for guttene, plantefarget
// blått og rødt for husbonden, som hadde råd. Snitt og farger på Bryggen akkurat i 1420-årene er
// ikke sjekket mot Bryggens Museum [K].
import * as THREE from 'three';
import { Animator, loadRig } from '../motor/animator';
import { kleFigur, RIG_URL, type Drakt } from '../motor/figur';
import { ColliderKit, MeshKit, type ColliderSpec } from '../motor/meshkit';
import type { Materials } from '../motor/materials';
import { disposeObject, type CellCtx, type Snakkbar } from '../motor/streaming';
import { Vandrer, type Rute } from './vandrer';

const HUD = 0xd9a88a;

export const DRAKTER = {
    /** Gutten man spiller: 12 år, kort kjortel i ufarget vadmel, hetta nede som krage. */
    junge: {
        navn: 'junge', hud: HUD, haar: 0xc29a5e, kjortel: 0x7d705d, kjortelNed: -0.06, belte: 0x3b2a1e,
        hoser: 0x5b5047, sko: 0x3a2a1f, hette: 0x8e8068, hetteOppe: false, tut: 0.16, kappe: 0.15,
        slank: 0.6, hode: 1.07,
    },
    /** Husbonden: lang, blå kjortel, rød hette oppe med lang tut, mage og skjegg, pung i beltet. */
    husbonde: {
        navn: 'husbonde', hud: 0xd3a083, haar: 0x5b4632, skjegg: 0x6b5541, kjortel: 0x2e4868, kjortelNed: 0.24,
        belte: 0x2a1d14, hoser: 0x5c2b24, sko: 0x2b1f17, hette: 0x7c2f25, hetteOppe: true, tut: 0.42, kappe: 0.2,
        mage: 0.85, pung: 0.9,
    },
    /** Svennen: brungrønn kjortel til under kneet, brun hette oppe, kort skjegg. */
    svenn: {
        navn: 'svenn', hud: 0xcf9c80, haar: 0x3e2f22, skjegg: 0x4a3828, kjortel: 0x535b3c, kjortelNed: 0.08,
        belte: 0x33241a, hoser: 0x4d443b, sko: 0x2e2219, hette: 0x5f4a36, hetteOppe: true, tut: 0.28, kappe: 0.17,
        mage: 0.15,
    },
    /** Skutedrengen: et par år eldre enn jungen, gråbrun vadmel, hetta nede. */
    dreng: {
        navn: 'dreng', hud: 0xd6a487, haar: 0x7a5a3a, kjortel: 0x6c5a47, kjortelNed: -0.03, belte: 0x3a281c,
        hoser: 0x4f463e, sko: 0x35271c, hette: 0x7f7563, hetteOppe: false, tut: 0.2, kappe: 0.16,
        slank: 0.35, hode: 1.03,
    },
    /** Stuedrengen: en junge til, yngre enn skutedrengen, lysere vadmel og blågrå hette. */
    stuedreng: {
        navn: 'stuedreng', hud: 0xdcae92, haar: 0x3f3226, kjortel: 0x8b806c, kjortelNed: -0.05, belte: 0x3b2a1e,
        hoser: 0x5e554b, sko: 0x3a2a1f, hette: 0x666d78, hetteOppe: false, tut: 0.14, kappe: 0.14,
        slank: 0.55, hode: 1.06,
    },
    /**
     * Nordlandsfiskeren som har kommet med jekta: grå vadmel, hetta oppe, skjegg, mørkere hud
     * av vær og vind. Ingen pung. Klærne til fiskerne i nord i 1420-årene er ikke sjekket [K];
     * dette er et valg [S].
     */
    fisker: {
        navn: 'fisker', hud: 0xc48f72, haar: 0x6e604f, skjegg: 0x7a6a58, kjortel: 0x5e5a52, kjortelNed: 0.04,
        belte: 0x2f2419, hoser: 0x48413a, sko: 0x3b2c20, hette: 0x4f5458, hetteOppe: true, tut: 0.12, kappe: 0.22,
        mage: 0.05,
    },
} satisfies Record<string, Drakt>;

export type FigurNavn = keyof typeof DRAKTER;

export const HOYDE: Record<FigurNavn, number> = { junge: 1.58, husbonde: 1.74, svenn: 1.79, dreng: 1.66, stuedreng: 1.52, fisker: 1.71 };

/**
 * Hva en figur gjør på plassen sin. Alt er løkker på stedet.
 *  - sitte: på benken, hendene i fanget
 *  - spise: på benken ved bordet, hendene framme
 *  - skrive: står ved pulten
 *  - rore: står ved gryta med sleiva
 *  - veie: rekker opp mot bismeren og leser av merkene
 *  - baere: står med en bunt tørrfisk i armene, klar til å gå
 *  - staa: står og venter
 */
export type Rolle = 'sitte' | 'spise' | 'skrive' | 'rore' | 'veie' | 'baere' | 'staa';

export interface Plass {
    figur: FigurNavn;
    rolle: Rolle;
    /** Føttene (stående) eller midt på benkesetet under hoftene (sittende), i verdensrom. */
    pos: THREE.Vector3;
    /** Retningen figuren ser (0 = +z). */
    yaw: number;
    /** Id i samtalene (samtaler.ts). Uten: en kort replikk når gutten snakker med hen. */
    samtale?: string;
}

const KLIPP: Record<Rolle, { clip: string; speed: number; hold?: number }> = {
    sitte: { clip: 'Sitting_Idle_Loop', speed: 1 },
    spise: { clip: 'Row', speed: 0.45 },
    skrive: { clip: 'Hender_Fram', speed: 0.35 },
    rore: { clip: 'Hender_Fram', speed: 0.8 },
    veie: { clip: 'Interact', speed: 0.55 },
    baere: { clip: 'Hender_Fram', speed: 0, hold: 0.3 },
    // Tomt klipp: bevegelseslagets hvile. Idle_Loop som helkroppsklipp er samme action som
    // hvilen i bevegelseslaget, og slipper man det, stopper hvilen også (T-stilling).
    staa: { clip: '', speed: 1 },
};

/** Hoftene i sitteklippet står så langt bak føttene og så høyt, i riggens egne meter (1,83 m høy). */
const SITT_BAK = 0.33;

/** En figur i gården. Lager animatoren og plasserer den. Bruk `animer` hvert bilde. */
export async function lagFigur(navn: FigurNavn): Promise<Animator> {
    const rig = await loadRig(RIG_URL);
    return new Animator(kleFigur(rig, DRAKTER[navn]), HOYDE[navn]);
}

export interface Folk {
    group: THREE.Group;
    colliders: ColliderSpec[];
    /** Føttene til dem som går (verdenen gir de nærmeste en kollider). */
    gaaende: THREE.Vector3[];
    snakkbare: Snakkbar[];
    tick: (t: number, dt: number, ctx: CellCtx) => void;
    dispose: () => void;
}

/** Nærmere enn dette animeres hvert bilde; lenger unna 15 ganger i sekundet, og bak FJERN ikke. */
const NAER = 16;
const FJERN = 55;

/** Hvor ofte animasjonen oppdateres etter avstand. Tåka skjuler det som står langt unna. */
class Takt {
    private acc = 0;
    readonly a: Animator;
    constructor(a: Animator) {
        this.a = a;
    }
    update(dt: number, speed: number, kamera: THREE.Vector3): void {
        const d = this.a.root.position.distanceTo(kamera);
        this.a.root.visible = d < FJERN + 15;
        if (d > FJERN) return;
        this.acc += dt;
        if (d > NAER && this.acc < 1 / 15) return;
        this.a.update(this.acc, speed);
        this.acc = 0;
    }
}

/** Stående figurer som snakkes med snur seg mot gutten. De som sitter, blir sittende. */
class Staaende {
    private mot: THREE.Vector3 | null = null;
    private yaw: number;
    private readonly a: Animator;
    private readonly p: Plass;
    private readonly clip: { clip: string; speed: number; hold?: number } | null;
    constructor(a: Animator, p: Plass, clip: { clip: string; speed: number; hold?: number } | null) {
        this.a = a;
        this.p = p;
        this.clip = clip;
        this.yaw = p.yaw;
    }
    vend(mot: THREE.Vector3 | null): void {
        if (!this.clip) return;
        if (mot && !this.mot && this.clip.clip) this.a.release(0.4);
        if (!mot && this.mot && this.clip.clip) {
            this.a.play(this.clip.clip, { loop: true, fade: 0.5, timeScale: this.clip.speed });
            if (this.clip.hold !== undefined) this.a.setPhase(this.clip.hold);
        }
        this.mot = mot?.clone() ?? null;
    }
    step(dt: number): void {
        const root = this.a.root.position;
        const want = this.mot ? Math.atan2(this.mot.x - root.x, this.mot.z - root.z) : this.p.yaw;
        const diff = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw));
        this.yaw += THREE.MathUtils.clamp(diff, -3 * dt, 3 * dt);
        this.a.root.rotation.y = this.yaw;
    }
}

/**
 * Lager folkene i en celle. Cella eier dem: kolliderne går i cellas liste, og `dispose` rydder
 * animatorene. Figurgeometrien deles med alle andre figurer og kastes aldri her.
 */
export async function lagFolk(plasser: Plass[], mats: Materials, seed = 1, ruter: Rute[] = []): Promise<Folk> {
    const rig = await loadRig(RIG_URL);
    const group = new THREE.Group();
    group.name = 'folk';
    const c = new ColliderKit();
    const anims: Animator[] = [];
    const takter: Takt[] = [];
    const staaende: Staaende[] = [];
    const vandrere: Vandrer[] = [];
    const snakkbare: Snakkbar[] = [];
    const egne: THREE.Object3D[] = [];
    let r = seed;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);

    for (const p of plasser) {
        const h = HOYDE[p.figur];
        const s = h / rig.height;
        const sitter = p.rolle === 'sitte' || p.rolle === 'spise';
        // De som sitter har egen geometri: skjørtet henger over knærne (figur.ts).
        const drakt: Drakt = sitter ? { ...DRAKTER[p.figur], navn: `${p.figur}:sitt`, sitter: true } : DRAKTER[p.figur];
        const a = new Animator(kleFigur(rig, drakt), h);
        const k = KLIPP[p.rolle];
        const clip = rig.clips.get(k.clip);
        if (k.clip) a.play(k.clip, { loop: true, fade: 0.01, timeScale: k.speed, startAt: rnd() * (clip?.duration ?? 1) });
        if (k.hold !== undefined) a.setPhase(k.hold);
        a.update(0.02, 0);
        // Folkene står stille, så Three kan hoppe over dem som er utenfor bildet. Kula rundt
        // hvilestillingen (armene ut) rommer også sitte- og arbeidsstillingene.
        a.model.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) o.frustumCulled = true;
        });

        const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
        const foot = sitter ? p.pos.clone().addScaledVector(fwd, SITT_BAK * s) : p.pos.clone();
        if (sitter) foot.y -= 0.45 - 0.42 * s;
        a.root.position.copy(foot);
        a.root.rotation.y = p.yaw;
        group.add(a.root);
        anims.push(a);
        takter.push(new Takt(a));
        const st = new Staaende(a, p, sitter ? null : k);
        staaende.push(st);
        snakkbare.push({ figur: p.figur, pos: foot.clone(), samtale: p.samtale, vend: (mot) => st.vend(mot) });

        // Kollideren: en boks rundt kroppen (prop, så kameraet ikke hopper når noen står i veien).
        c.matrix = new THREE.Matrix4().makeRotationY(p.yaw).setPosition(foot);
        if (sitter) c.box(0, 0.65 * s, -0.12 * s, 0.5, 1.3 * s, 0.62 * s, true);
        else c.box(0, h / 2, 0, 0.5, h, 0.45, true);

        if (p.rolle === 'baere') {
            const bunt = buntMesh(mats);
            bunt.position.set(0, 1.0 * s, 0.3 * s);
            a.root.add(bunt);
            egne.push(bunt);
        }
    }

    ruter.forEach((rute, i) => {
        const a = new Animator(kleFigur(rig, DRAKTER[rute.figur]), HOYDE[rute.figur]);
        a.update(0.02, 0);
        a.model.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) o.frustumCulled = true;
        });
        const s = HOYDE[rute.figur] / rig.height;
        const bunt = buntMesh(mats);
        bunt.position.set(0, 1.0 * s, 0.3 * s);
        a.root.add(bunt);
        egne.push(bunt);
        const v = new Vandrer(a, rute, bunt, seed + i * 3.7);
        group.add(a.root);
        anims.push(a);
        vandrere.push(v);
        snakkbare.push({ figur: rute.figur, pos: v.pos, vend: (mot) => v.vend(mot) });
    });
    const vTakt = vandrere.map((v) => new Takt(v.a));

    return {
        group,
        colliders: c.specs,
        gaaende: vandrere.map((v) => v.pos),
        snakkbare,
        tick: (t, dt, ctx) => {
            for (const st of staaende) st.step(dt);
            for (const tk of takter) tk.update(dt, 0, ctx.kamera);
            vandrere.forEach((v, i) => {
                v.step(dt, t, ctx);
                vTakt[i].update(dt, v.speed, ctx.kamera);
            });
        },
        dispose: () => {
            for (const a of anims) {
                a.mixer.stopAllAction();
                a.mixer.uncacheRoot(a.model);
                a.model.traverse((o) => {
                    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
                    if (m && (o as THREE.Mesh).isMesh) m.dispose();
                });
                // Figurene tas ut før cella kaster geometrien sin: den deles med de andre.
                group.remove(a.root);
            }
            egne.forEach(disposeObject);
        },
    };
}

/** En bunt tørrfisk surret med tau, i samme materiale og farger som buntene i bua. */
function buntMesh(mats: Materials): THREE.Object3D {
    const k = new MeshKit();
    k.withUv(0.04, () => {
        k.withTint({ top: 1.45, bottom: 1.1, hue: [1.02, 0.98, 0.86] }, () => k.box('raatre', 0, 0, 0, 0.5, 0.26, 0.3, { grain: 'x' }));
    });
    k.withTint({ top: 1.1, bottom: 0.9, hue: [1.12, 1.02, 0.8] }, () => {
        for (const dx of [-0.13, 0.13]) k.box('raatre', dx, 0, 0, 0.035, 0.27, 0.31);
    });
    const g = new THREE.Group();
    for (const [key, b] of k.buckets) {
        if (b.vertexCount === 0) continue;
        const m = new THREE.Mesh(b.toGeometry(), mats.get(key));
        m.castShadow = true;
        g.add(m);
    }
    return g;
}
