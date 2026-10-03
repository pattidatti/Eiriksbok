// Kobler spillet til lydbildet (lyd.ts): hva som skal høres, hvor og hvor sterkt.
//
// - Regn og vind er løkker uten sted. Regnet ute følger `world.regn`; inne tar regnet på taket over.
// - Bølgene klukker mot bolverket: én løkke som står på kaikanten der den er nærmest kameraet.
// - Ildstedet knitrer der det står (nærmeste innen 15 m).
// - Måkene skriker fra der en måke faktisk er, og en hel flokk skriker når den letter.
// - Rottene piper, krafser og skriker fra der rotta er (lave, man må være nær), også når katta tar en.
// - Grisene grynter, hundene bjeffer og knurrer (dyr.ts) og kattene mjauer (katter.ts), fra der dyret er (`dyr.ogg`).
// - Fottrinn: når en fot når bunnen av steget i animasjonen (fotbeinet slutter å synke), velges
//   underlaget der gutten står: planker ute, golv inne eller gjørme.
// - Færingen: et plask og et åretak når åra settes i, og vann mot skroget etter farten.
import * as THREE from 'three';
import { Lydbilde } from './lyd';
import type { Character } from './character';
import type { Faering } from './boat';
import type { BryggenWorld } from '../bygg/bryggen';
import type { RotteHendelse } from './rotter';
import type { KampLyd } from './combat';

export type Underlag = 'tre-ute' | 'tre-inne' | 'gjorme';

const _a = new THREE.Vector3();

interface Fot {
    bein: THREE.Object3D | null;
    y: number;
    /** Høyeste punkt siden forrige steg. */
    topp: number;
    synker: boolean;
    sist: number;
}

export class LydKobling {
    readonly lyd = new Lydbilde();
    private readonly world: BryggenWorld;
    private readonly kamera: THREE.Camera;
    private readonly gutt: Character;
    private readonly baat: Faering;
    private readonly fotter: Fot[];
    private tid = 0;
    private nesteMaake = 3;
    private nesteSteg = 0;
    /** Fotbeinets laveste høyde over føttene (der foten står på bakken), lært mens han går. */
    private bunn = 0.08;

    constructor(world: BryggenWorld, kamera: THREE.Camera, gutt: Character, baat: Faering) {
        this.world = world;
        this.kamera = kamera;
        this.gutt = gutt;
        this.baat = baat;
        // GLTFLoader fjerner punktum fra nodenavn: DEF-foot.L heter DEF-footL.
        this.fotter = ['DEF-footL', 'DEF-footR'].map((n) => ({ bein: gutt.anim.root.getObjectByName(n) ?? null, y: 0, topp: 0, synker: false, sist: 0 }));
        world.rotter.onHendelse = (h) => this.rotte(h);
        world.maaker.onLetter = (pos, antall) => this.flokk(pos, antall);
        world.katter.onMjau = (pos, ute) => this.dyr('katt', 'mjau', pos, ute);
    }

    /** Dyrelyder (dyr.ts og katter.ts), fra `dyr.ogg`. */
    dyr(art: 'gris' | 'hund' | 'katt', hva: string, pos: THREE.Vector3, ute = true): void {
        const l = this.lyd;
        const f = 0.92 + Math.random() * 0.16;
        if (art === 'katt') l.spill('dyr', 'mjau', { pos, ref: 1.6, styrke: 0.45, fart: f, buss: ute ? 'ute' : 'inne' });
        else if (art === 'gris') l.spill('dyr', 'gris', { pos, ref: 2.2, styrke: hva === 'skremt' ? 0.75 : 0.45, fart: hva === 'skremt' ? 1.3 : f });
        else if (hva === 'knurr') l.spill('dyr', 'knurr', { pos, ref: 1.6, styrke: 0.5, fart: f });
        else for (let i = 0; i < (Math.random() < 0.5 ? 2 : 1); i++) l.spill('dyr', 'bjeff', { pos, ref: 4, styrke: 0.6, fart: f, om: i * (0.32 + Math.random() * 0.15) });
    }

    /** Fra et tastetrykk eller klikk (nettleseren krever det før lyd kan spilles). */
    start(): Promise<void> {
        return this.lyd.start();
    }

    update(dt: number, inne: number, modus: 'foot' | 'boat'): void {
        const l = this.lyd;
        if (!l.klar) return;
        this.tid += dt;
        l.lytter(this.kamera);
        l.settInne(inne);
        const w = this.world;
        const regn = w.regn;
        const kam = this.kamera.position;

        // ── Vær ──
        l.lokke('regn-ute', regn * 0.75);
        l.lokke('regn-tak', regn * inne * 0.8, { buss: 'inne' });
        l.lokke('vind', 0.16 + regn * 0.14 + THREE.MathUtils.clamp((kam.y - 4) / 20, 0, 0.15));

        // ── Bølger mot bolverket: nærmeste punkt på kaikanten ──
        const k = w.kaiKant;
        _a.set(THREE.MathUtils.clamp(kam.x, k.x0, k.x1), k.y, Math.min(k.z, kam.z));
        l.lokke('bolger', 0.9, { pos: _a, ref: 3.5 });

        // ── Ild ──
        let ild: THREE.Vector3 | null = null;
        let ildD = 15;
        for (const p of w.streamer.ildsteder()) {
            const d = p.distanceTo(kam);
            if (d < ildD) {
                ildD = d;
                ild = p;
            }
        }
        l.lokke('ild', ild ? 0.85 : 0, { pos: ild ?? kam, ref: 1.6, buss: 'inne' });

        // ── Færingen ──
        const fart = Math.abs(this.baat.speed);
        l.lokke('skrog', THREE.MathUtils.clamp(fart / 2.2, 0, 1) * 0.75, { pos: this.baat.group.position, ref: 2, fart: 0.85 + Math.min(0.3, fart * 0.1) });

        // ── Måker: én skriker nå og da, sjeldnere i øsregn ──
        this.nesteMaake -= dt;
        if (this.nesteMaake <= 0) {
            this.nesteMaake = (2.5 + Math.random() * 6) * (1 + regn * 0.8);
            const naere = w.maaker.fugler.filter((m) => m.pos.distanceTo(kam) < 45);
            const m = naere[Math.floor(Math.random() * naere.length)];
            if (m) {
                const flyr = m.tilstand !== 'staar';
                l.spill('maaker', flyr && Math.random() < 0.25 ? 'latter' : 'skrik', { pos: m.pos, ref: 7, styrke: flyr ? 0.8 : 0.55, fart: 0.92 + Math.random() * 0.16 });
            }
        }

        // ── Fottrinn ──
        if (modus === 'foot') this.fottrinn(dt);
    }

    /** Åra settes i vannet (Faering.onCatch). */
    aaretak(): void {
        const p = this.baat.group.position;
        this.lyd.spill('aare', 'tak', { pos: p, ref: 2.5, styrke: 0.75, fart: 0.9 + Math.random() * 0.2 });
        if (Math.random() < 0.3) this.lyd.spill('aare', 'knirk', { pos: p, ref: 1.5, styrke: 0.3, fart: 0.95 + Math.random() * 0.1 });
    }

    /** Gutten lander etter et hopp eller fall. */
    landet(fart: number): void {
        if (fart < 2) return;
        const p = this.gutt.anim.root.position;
        const u = this.world.underlag(p);
        const s = Math.min(1.2, 0.5 + fart * 0.08);
        this.lyd.spill('fottrinn', u, { pos: p, ref: 2, styrke: s, fart: 0.85, buss: 'inne' });
        this.lyd.spill('fottrinn', u, { pos: p, ref: 2, styrke: s * 0.7, fart: 0.95, buss: 'inne', om: 0.04 });
    }

    private fottrinn(dt: number): void {
        const g = this.gutt;
        const fart = g.speed;
        const rot = g.anim.root.position;
        if (!g.grounded || g.mode !== 'ground' || fart < 0.35) {
            for (const f of this.fotter) f.synker = false;
            return;
        }
        const harBein = this.fotter.every((f) => f.bein);
        if (!harBein) {
            // Uten fotbein: ett steg per 0,7 m.
            this.nesteSteg -= fart * dt;
            if (this.nesteSteg <= 0) {
                this.nesteSteg = 0.7;
                this.steg(rot, fart);
            }
            return;
        }
        for (const f of this.fotter) {
            const y = f.bein!.getWorldPosition(_a).y - rot.y;
            this.bunn = Math.min(this.bunn + dt * 0.01, y);
            f.topp = Math.max(f.topp, y);
            const synker = y < f.y - 0.0005;
            // Bunnen av steget: foten har sunket et godt stykke fra toppen, er nede ved bakken og
            // slutter å synke. (Den andre foten dupper litt når denne lander; det er ikke et steg.)
            if (f.synker && !synker && f.topp - y > 0.05 && y < this.bunn + 0.04 && this.tid - f.sist > 0.18) {
                f.sist = this.tid;
                f.topp = y;
                this.steg(_a, fart);
            }
            f.synker = synker;
            f.y = y;
        }
    }

    private steg(p: THREE.Vector3, fart: number): void {
        const u = this.world.underlag(p);
        const styrke = THREE.MathUtils.clamp(0.35 + fart * 0.13, 0.35, 1);
        this.lyd.spill('fottrinn', u, { pos: p, ref: 2, styrke, fart: 0.93 + Math.random() * 0.14, buss: 'inne' });
    }

    /**
     * Lyd i kampen. Stemmen til gutten (12 år) spilles lysere og fortere enn den voksne
     * innspillingen; fienden litt dypere. Slagene varierer litt i tonehøyde så de ikke blir like.
     */
    kamp(hva: KampLyd, pos: THREE.Vector3, hvem: 'gutt' | 'fiende', om = 0): void {
        const stemme = hva === 'stonn' || hva === 'smerte';
        const fart = stemme ? (hvem === 'gutt' ? 1.32 : 0.93) + Math.random() * 0.06 : 0.9 + Math.random() * 0.2;
        const styrke = hva === 'sus' ? 0.55 : hva === 'stonn' ? (hvem === 'gutt' ? 0.5 : 0.65) : hva === 'smerte' ? 0.7 : hva === 'fall' ? 0.9 : 1;
        this.lyd.spill('kamp', hva, { pos: pos.clone().setY(pos.y + 1.2), ref: 2.2, styrke, fart, buss: 'hendelse', om });
    }

    /** Oppdrag: tatt (to toner opp), et mål nådd (én), fullført (tre, en dur-treklang). */
    oppdrag(type: 'nytt' | 'maal' | 'ferdig'): void {
        if (type === 'nytt') this.lyd.toner([[523.3, 0, 0.9], [784, 0.12, 1.2]], 0.16);
        else if (type === 'maal') this.lyd.toner([[659.3, 0, 0.8]], 0.13);
        else {
            // Seremonien i ui/Melding.tsx: arket ruller ut, seglet treffer etter ca. 1 s, så klokkene.
            this.lyd.stempel(0.98, 1);
            this.lyd.toner([[523.3, 1.15, 1.4], [659.3, 1.26, 1.4], [784, 1.37, 1.6], [1046.5, 1.51, 2.0]], 0.13);
        }
    }

    private rotte(h: RotteHendelse): void {
        const l = this.lyd;
        const f = 0.92 + Math.random() * 0.22;
        if (h.type === 'pip') l.spill('rotter', Math.random() < 0.3 ? 'kvitre' : 'pip', { pos: h.pos, ref: 0.8, styrke: 0.5, fart: f, buss: 'inne' });
        else if (h.type === 'kraps') l.spill('rotter', 'kraps', { pos: h.pos, ref: 0.7, styrke: 0.4, fart: f, buss: 'inne' });
        else if (h.type === 'skrik' || h.type === 'fanget') l.spill('rotter', 'skrik', { pos: h.pos, ref: 1, styrke: 0.7, fart: f, buss: 'inne' });
    }

    private flokk(pos: THREE.Vector3, antall: number): void {
        // En flokk som letter: flere skrik over hverandre, litt spredt i tid.
        const n = Math.min(4, 1 + Math.ceil(antall / 2));
        for (let i = 0; i < n; i++) {
            this.lyd.spill('maaker', i === 0 ? 'latter' : 'skrik', { pos, ref: 7, styrke: 0.85, fart: 0.9 + Math.random() * 0.2, om: i * (0.12 + Math.random() * 0.25) });
        }
    }

    dispose(): void {
        this.world.rotter.onHendelse = undefined;
        this.world.maaker.onLetter = undefined;
        this.world.katter.onMjau = undefined;
        this.lyd.dispose();
    }
}
