// Tyven i natt (kapittel 1, oppdraget «tyven» i oppdrag-data.ts, blueprint §6).
//
// Fienden fra gråboksen er tyven. Han er parkert under bakken til oppdraget er tatt. Så står han ved
// loftsdøra på svalgangen og venter til gutten kommer nær, og løper en fast rute: bortover
// svalgangen, ned trappa bakerst, opp trappa på den andre sida, fram langs svalgangen, over
// brystningen og ned i gårdsrommet, og inn i smuget foran schøtstua. Der snur han og slåss (kampen
// fra gråboksen). Gutten må holde følge: tyven løper fortere når gutten er nær, og saktere når han
// henger etter. Mister gutten ham av syne for lenge, gjemmer tyven seg ved neste punkt på ruta og
// venter. Kommer gutten for langt unna, slipper tyven unna, og jakten begynner på nytt.
//
// Etter slagsmålet kan gutten snakke med tyven (E). Svarene velger: ta ham med til Lambert (han
// følger etter gutten), eller rope på vakta (filmen «vakta», filmer.ts). Han roper over hodet når
// kampen starter, når han blir svak og når han slår et svingslag. Ruta og alt han sier, er [S].
import * as THREE from 'three';
import type { Character } from '../motor/character';
import type { EnemyAI } from '../motor/combat';
import type { Snakkbar } from '../motor/streaming';
import type { FolkStyring } from './folkstyring';
import type { Hode } from './hoder';
import type { SpillKontekst, Spillsystem } from './system';

const ROP = {
    aggro: ['Du gir deg ikke, du!', 'Kom an, da, tyskergutt!', 'Gå vekk! Dette angår ikke deg!'],
    treff: ['Au!', 'Det skal du få igjen!'],
    svak: ['Stopp! Jeg var sulten!', 'Nok! Jeg gir meg ...'],
    slaar: ['Nå skal du få!', 'Ta denne!'],
};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PARKERT = V(0, -60, 30);
const SV = 2.6; // svalgangen (DECK_Y i gard.ts)

/** Et punkt på ruta. `punkt`: her gjemmer han seg om gutten mister ham (står i hintet). */
interface RutePunkt {
    p: THREE.Vector3;
    punkt?: string;
    /** Hopp hit over brystningen (ikke løp). */
    hopp?: boolean;
}

/** Ruta gjennom den første gården (gard.ts: svalgangene på x = ±1,47, trappene bakerst). */
export const RUTE: RutePunkt[] = [
    { p: V(-1.47, SV, 11.4) },
    { p: V(-1.47, SV, 22), punkt: 'på svalgangen' },
    { p: V(-1.47, SV, 33.4) },
    { p: V(-1.47, 0, 38.9), punkt: 'ved trappa bakerst' },
    { p: V(0.1, 0, 39.7) },
    { p: V(1.47, 0, 38.7) },
    { p: V(1.47, SV, 33.2), punkt: 'oppe på svalgangen til høyre' },
    { p: V(1.47, SV, 11.2) },
    { p: V(0.15, 0, 10.6), hopp: true },
    { p: V(0.3, 0, 28), punkt: 'i gårdsrommet' },
    { p: V(0.1, 0, 44.6) },
    { p: V(-2.6, 0, 48.3), punkt: 'i smuget bakerst' },
];
/** Der gutten holder vakt (filmen «kap1-inn» setter ham her), og retningen han ser. */
export const VAKTPOST = V(0.85, 0, 17.5);
export const VAKTPOST_YAW = -2.75;
const START_R = 9;
const TAPT_R = 15;
const BORTE_R = 38;

type Fase = 'parkert' | 'venter' | 'flukt' | 'hopp' | 'gjemt' | 'kamp' | 'nede' | 'folger';

export class Tyv implements Spillsystem {
    readonly navn = 'tyv';
    private readonly c: Character;
    private readonly ai: EnemyAI;
    private readonly folk: FolkStyring;
    private k: SpillKontekst | null = null;
    fase: Fase = 'parkert';
    private i = 0;
    private tapt = 0;
    private borte = 0;
    private hopp: { a: THREE.Vector3; b: THREE.Vector3; t: number } | null = null;
    private land = 0;
    private sistRop = -9;
    private klokke = 0;
    private nedeTalt = false;
    /** Holdes igjen (en film går eller venter): tyven står stille. */
    holdt: () => boolean = () => false;
    readonly hode: Hode;
    private readonly snakkbar: Snakkbar;
    private hint: string | null = null;

    constructor(c: Character, ai: EnemyAI, folk: FolkStyring, start: THREE.Vector3) {
        void start;
        this.c = c;
        this.ai = ai;
        this.folk = folk;
        const h = c.tune.height;
        this.hode = {
            hode: (ut) => {
                const b = c.anim.bein('DEF-head');
                if (b) return b.getWorldPosition(ut).setY(ut.y + 0.24);
                return ut.copy(c.anim.root.position).setY(c.anim.root.position.y + h + 0.1);
            },
            synlig: () => this.fase !== 'parkert' && c.anim.root.visible,
        };
        this.snakkbar = {
            figur: 'tyv', id: 'tyven', pos: c.pos,
            vend: (mot) => {
                if (mot) c.faceTowards(mot.x, mot.z);
            },
            hode: (ut) => this.hode.hode(ut),
            gest: () => undefined,
            synlig: () => this.hode.synlig(),
        };
        folk.ekstra.push({
            h: this.hode,
            info: () => {
                if (this.fase === 'parkert') return null;
                const kjent = this.fase === 'folger' || this.folk.oppdrag.flagg.has('tyv-selv');
                return { navn: kjent ? 'Sigurd' : 'Tyven', tittel: kjent ? 'fra Helgeland' : '', merke: this.folk.oppdrag.merke('tyven'), giver: false };
            },
        });
        ai.onRop = (hva) => this.rop(hva);
        // Slått for hardt: avslutningsslaget (F) gir vakta grunn til mistanke (en forsmak på §8.2).
        const motta = ai.receive.bind(ai);
        ai.receive = (dmg, dir, tung, sink, kind) => {
            if (kind === 'finisher' && this.fase === 'kamp') this.folk.oppdrag.settFlagg('tyv-hardt');
            motta(dmg, dir, tung, sink, kind);
        };
        this.parker();
    }

    /** Konteksten (systemer.ts): flytte gutten og vise meldinger. */
    koble(k: SpillKontekst): void {
        this.k = k;
    }

    private rop(hva: keyof typeof ROP, tekst?: string): void {
        if (!tekst && this.klokke - this.sistRop < (hva === 'svak' ? 0 : 2.5)) return;
        this.sistRop = this.klokke;
        const l = ROP[hva];
        this.folk.hoder.si(this.hode, tekst ?? l[Math.floor(Math.random() * l.length)], hva === 'svak' ? 3 : 2);
    }

    private parker(): void {
        this.fase = 'parkert';
        this.hint = null;
        this.c.anim.root.visible = false;
        this.c.teleport(PARKERT, Math.PI);
        this.c.setSeated(true);
        this.ai.aggro = false;
    }

    /** Frisk og på beina et sted. */
    private sett(p: THREE.Vector3, yaw: number): void {
        this.c.setSeated(false);
        this.c.mode = 'ground';
        this.c.teleport(p, yaw);
        this.c.anim.root.visible = true;
        this.c.anim.release(0.1);
        this.ai.f.hp = this.ai.f.maxHp;
        this.ai.f.dead = false;
        this.ai.state = 'idle';
        this.ai.aggro = false;
        this.ai.nullstill();
    }

    /** Ved loftsdøra, klar til å løpe. */
    private tilStart(): void {
        this.sett(RUTE[0].p, 0);
        this.fase = 'venter';
        this.i = 1;
        this.tapt = 0;
        this.borte = 0;
        this.nedeTalt = false;
    }

    /** Skal kampen styre fienden dette steget (game.ts)? */
    get aktiv(): boolean {
        return this.fase === 'kamp' || this.fase === 'nede';
    }

    /** Vakta har tatt ham med seg (filmen «vakta»). */
    hent(): void {
        this.parker();
    }

    private status(): string {
        return this.folk.oppdrag.status('tyven');
    }

    /** Er det første målet (slå ham ned) nådd? */
    private slaatt(): boolean {
        return this.folk.oppdrag.hud().find((o) => o.id === 'tyven')?.linjer[0]?.ferdig ?? this.status() === 'klar';
    }

    update(dt: number): void {
        this.klokke += dt;
        const status = this.status();
        const gutt = this.k?.player.pos;
        if (status === 'ny' || status === 'levert') {
            if (this.fase !== 'parkert' && !this.holdt()) this.parker();
            return;
        }
        // En film går eller venter: tyven står der han står (filmen viser en dobbeltgjenger).
        if (this.holdt()) return;
        if (this.fase === 'parkert') {
            // Vakta har tatt ham. Ellers: jakten, eller han ligger der han ble slått ned (lagret spill).
            if (this.folk.oppdrag.flagg.has('tyv-vakta')) return;
            if (status === 'aktiv' && !this.slaatt()) this.tilStart();
            else this.nede(RUTE[RUTE.length - 1].p);
            return;
        }
        if (!gutt) return;
        const stille = () => this.c.step(dt, { dir: new THREE.Vector2(), sprint: false, jump: false });
        if (this.fase === 'venter') {
            if (gutt.distanceTo(this.c.pos) < START_R) {
                this.fase = 'flukt';
                this.rop('aggro', 'Pokker! Han så meg!');
            }
            stille();
        } else if (this.fase === 'flukt' || this.fase === 'gjemt') this.flukt(dt, gutt);
        else if (this.fase === 'hopp') this.hoppSteg(dt);
        else if (this.fase === 'folger') this.folg(dt, gutt);
        if (this.land > 0) {
            this.land -= dt;
            if (this.land <= 0) this.c.anim.release(0.2);
        }
        if (this.aktiv && this.ai.f.dead && !this.nedeTalt) {
            this.nedeTalt = true;
            this.fase = 'nede';
            this.hint = null;
            this.folk.oppdrag.hendelse('slaa:tyven');
        }
        if (this.fase === 'nede' && this.folk.oppdrag.flagg.has('tyv-selv')) this.reisSeg();
    }

    /** Ligger nede (lagret etter slagsmålet). */
    private nede(p: THREE.Vector3): void {
        this.sett(p, 0);
        this.fase = 'nede';
        this.nedeTalt = true;
        this.ai.f.dead = true;
        this.ai.state = 'dead';
        this.c.mode = 'dead';
        this.c.anim.play('Death01', { fade: 0.05, startAt: 3 });
        if (this.folk.oppdrag.flagg.has('tyv-selv')) this.reisSeg();
    }

    private reisSeg(): void {
        this.fase = 'folger';
        this.c.mode = 'ground';
        this.c.anim.release(0.6);
    }

    private flukt(dt: number, gutt: THREE.Vector3): void {
        const p = this.c.pos;
        const d = gutt.distanceTo(p);
        const sett = d < TAPT_R && this.ser(gutt);
        this.tapt = sett ? Math.max(0, this.tapt - dt * 2) : this.tapt + dt;
        this.borte = d > BORTE_R ? this.borte + dt : 0;
        if (this.borte > 6) {
            this.slapp();
            return;
        }
        const maal = RUTE[this.i];
        if (this.fase === 'gjemt') {
            this.hint = `Du mistet ham av syne. Let etter ham ${RUTE[this.i - 1]?.punkt ?? ''}.`;
            this.c.step(dt, { dir: new THREE.Vector2(), sprint: false, jump: false });
            if (d < 7 && sett) {
                this.fase = 'flukt';
                this.tapt = 0;
                this.rop('aggro', 'Gi deg, da!');
            }
            return;
        }
        this.hint = this.tapt > 0.8 ? 'Han er ute av syne! Skynd deg etter!' : 'Hold følge med tyven! Hold Shift for å løpe fortere.';
        if (maal.hopp) {
            this.hopp = { a: p.clone(), b: maal.p.clone(), t: 0 };
            this.fase = 'hopp';
            this.c.anim.play('Jump_Start', { fade: 0.08, startAt: 0.3 });
            return;
        }
        const til = new THREE.Vector2(maal.p.x - p.x, maal.p.z - p.z);
        const lengde = til.length();
        if (lengde < 0.5 && Math.abs(maal.p.y - p.y) < 0.8) {
            if (this.i === RUTE.length - 1) {
                // Smuget er stengt bakerst: han snur og slåss.
                this.fase = 'kamp';
                this.hint = null;
                this.rop('aggro', 'Her stopper det. Kom an, da!');
                return;
            }
            this.i++;
            // Har han vært ute av syne lenge, gjemmer han seg ved dette punktet og venter.
            if (maal.punkt && this.tapt > 2.5) this.fase = 'gjemt';
            return;
        }
        // Fortere når gutten er tett bak, saktere når han henger etter (så jakten kan holdes).
        const fart = d < 4 ? 4.6 : d < 9 ? 3.7 : d < 13 ? 2.8 : 2.2;
        til.divideScalar(Math.max(lengde, 0.001)).multiplyScalar(Math.min(1, fart / this.c.tune.sprintSpeed));
        this.c.step(dt, { dir: til, sprint: true, jump: false });
    }

    /** Over brystningen og ned: en bue uten fysikk, med hoppeklippene. */
    private hoppSteg(dt: number): void {
        const h = this.hopp!;
        h.t += dt / 0.8;
        const t = Math.min(1, h.t);
        const p = new THREE.Vector3().lerpVectors(h.a, h.b, t);
        p.y += Math.sin(t * Math.PI) * 1.4;
        const prev = this.c.pos.clone();
        this.c.teleport(p, Math.atan2(h.b.x - h.a.x, h.b.z - h.a.z));
        this.c.prevPos.copy(prev);
        if (h.t >= 0.45 && this.c.anim.current === 'Jump_Start') this.c.anim.play('Jump_Loop', { fade: 0.15, loop: true });
        if (t >= 1) {
            this.hopp = null;
            this.c.anim.play('Jump_Land', { fade: 0.05 });
            this.land = 0.3;
            this.i++;
            this.fase = 'flukt';
        }
    }

    /** Ser gutten tyven? (ingen vegg imellom) */
    private ser(gutt: THREE.Vector3): boolean {
        const k = this.k;
        if (!k) return true;
        const a = gutt.clone().setY(gutt.y + 1.4);
        const dir = this.c.pos.clone().setY(this.c.pos.y + 1.4).sub(a);
        const len = dir.length();
        if (len < 1) return true;
        return !k.phys.rayWorld(a, dir.divideScalar(len), len - 0.4);
    }

    /** Tyven slapp unna: begynn på nytt fra vaktposten. */
    private slapp(): void {
        const k = this.k;
        if (k) {
            k.flash('Tyven slapp unna i mørket. Du går tilbake til vaktposten. Neste gang må du holde følge.', 6);
            k.player.teleport(VAKTPOST, VAKTPOST_YAW);
            k.cam.yaw = VAKTPOST_YAW + Math.PI;
        }
        this.tilStart();
    }

    /** Sigurd går etter gutten til Lambert, et par meter bak. */
    private folg(dt: number, gutt: THREE.Vector3): void {
        this.hint = 'Sigurd følger etter deg. Ta ham med til Lambert i bua.';
        const til = new THREE.Vector2(gutt.x - this.c.pos.x, gutt.z - this.c.pos.z);
        const d = til.length();
        // Gutten gikk fra ham (rodde ut, løp av gårde): han står og venter.
        const fart = d > 25 ? 0 : d > 6 ? 0.9 : d > 1.8 ? 0.5 : 0;
        if (fart > 0) til.divideScalar(d).multiplyScalar(fart);
        else til.set(0, 0);
        this.c.step(dt, { dir: til, sprint: false, jump: false });
    }

    /** R: start slagsmålet på nytt (bare i kampen). */
    nyRunde(): void {
        if (this.fase !== 'kamp' && this.fase !== 'nede') return;
        if (this.status() !== 'aktiv' || this.slaatt()) return;
        this.sett(RUTE[RUTE.length - 1].p, Math.PI);
        this.fase = 'kamp';
        this.nedeTalt = false;
    }

    // ── Spillsystem: E ved tyven når han ligger nede, og hintet under jakten ──

    prompt(gutt: THREE.Vector3): string | null {
        if (this.fase !== 'nede' || this.folk.laast) return null;
        if (!this.folk.oppdrag.samtaleFor('tyven')) return null;
        return gutt.distanceTo(this.c.pos) < 2.4 ? 'E: Snakk med tyven' : null;
    }

    trykk(): null {
        const q = this.folk.oppdrag.samtaleFor('tyven');
        const k = this.k;
        if (!q || !k) return null;
        // Han kommer seg opp på huk og snakker.
        this.c.anim.play('Crouch_Idle_Loop', { fade: 0.5, loop: true });
        this.folk.aapne(q.s, this.snakkbar, k.player.pos, q.start);
        return null;
    }

    hud(): { tekst: string } | null {
        if (this.holdt() || !this.hint || this.fase === 'parkert') return null;
        return { tekst: this.hint };
    }
}
