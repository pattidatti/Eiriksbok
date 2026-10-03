// Slåsskamp i arkadestil: lett slag, tungt slag, blokk, unnamanøver og avslutning.
//
// Prinsipper (Arkham/Assassin's Creed):
//  - Slag «suger» deg mot nærmeste fiende (utfall), så du treffer uten å sikte.
//  - Fienden varsler før den slår (lyser opp). Blokkerer du rett før treffet, får du et
//    motslag: fienden vakler og neste slag teller dobbelt.
//  - Hvert treff har treffpause (hitstop), risting og skadetall over den som blir truffet.
//
// Tonen er rå og alvorlig: ingen vitser, og blodet blir liggende.
import * as THREE from 'three';
import type { Character } from './character';
import type { Animator } from './animator';

/** Lydene i kampen (lyd.json, sprite `kamp`). */
export type KampLyd = 'sus' | 'stonn' | 'slag-lett' | 'slag-tung' | 'blokk' | 'smerte' | 'fall';

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

/**
 * Kroppen i kampen, oppå klippene: overkroppen vrir seg inn i slaget og lener seg etter det, og
 * hodet og ryggen kastes bakover når man blir truffet. Fjærer som dør ut, satt av kampen og lagt
 * på rett før animatoren oppdateres (`Animator.foerOppdatering`).
 */
class Kropp {
    vri = 0;
    len = 0;
    hode = 0;
    hodeSide = 0;
    private vriV = 0;
    private lenV = 0;
    private hodeV = 0;
    private sideV = 0;
    private maalVri = 0;
    private maalLen = 0;
    private tid = 0;
    constructor(a: Animator) {
        a.foerOppdatering = () => {
            a.figurDrei('DEF-spine.001', Y, this.vri * 0.55);
            a.figurDrei('DEF-spine.002', Y, this.vri * 0.45);
            a.figurDrei('DEF-spine.001', X, this.len);
            a.figurDrei('DEF-head', X, this.hode);
            a.figurDrei('DEF-head', Z, this.hodeSide);
        };
    }
    /** Vri inn i et slag (`side` 1: høyre hånd), fra en spenning bakover til et kast forover. */
    slag(side: number, kraft: number, tilTreff: number): void {
        this.maalVri = -side * 0.22 * kraft;
        this.maalLen = -0.05 * kraft;
        this.tid = tilTreff;
        this.kast = { side, kraft };
    }
    private kast: { side: number; kraft: number } | null = null;
    /** Truffet: hodet og ryggen kastes bakover, og litt til siden. */
    treff(kraft: number, side: number): void {
        this.hodeV -= 7 * kraft;
        this.lenV -= 4.5 * kraft;
        this.sideV += side * 5 * kraft;
        this.vriV += side * 4 * kraft;
    }
    step(dt: number): void {
        if (this.kast) {
            this.tid -= dt;
            if (this.tid <= 0) {
                // Slaget går: vri gjennom til den andre siden, og len inn.
                this.maalVri = this.kast.side * 0.38 * this.kast.kraft;
                this.maalLen = 0.16 * this.kast.kraft;
                this.vriV += this.kast.side * 6 * this.kast.kraft;
                this.kast = null;
                this.tid = 0.18;
            }
        } else if (this.tid > 0) {
            this.tid -= dt;
            if (this.tid <= 0) {
                this.maalVri = 0;
                this.maalLen = 0;
            }
        }
        // Kritisk dempede fjærer mot målet.
        const fjar = (x: number, v: number, m: number, k: number) => {
            const a = k * k * (m - x) - 2 * k * v;
            v += a * dt;
            return [x + v * dt, v];
        };
        [this.vri, this.vriV] = fjar(this.vri, this.vriV, this.maalVri, 16);
        [this.len, this.lenV] = fjar(this.len, this.lenV, this.maalLen, 14);
        [this.hode, this.hodeV] = fjar(this.hode, this.hodeV, 0, 15);
        [this.hodeSide, this.sideV] = fjar(this.hodeSide, this.sideV, 0, 13);
    }
}

export type DamageKind = 'dealt' | 'taken' | 'blocked' | 'counter' | 'finisher';

export interface DamageEvent {
    at: THREE.Vector3;
    amount: number;
    kind: DamageKind;
    /** Retning slaget kom fra (for blodsprut). */
    dir: THREE.Vector3;
}

export interface Fighter {
    char: Character;
    hp: number;
    maxHp: number;
    /** Aldri treffbar mens dette er > 0 (rulling). */
    iframes: number;
    stagger: number;
    dead: boolean;
}

interface Attack {
    kind: 'light' | 'heavy' | 'finisher';
    t: number;
    dur: number;
    hitAt: number;
    hit: boolean;
    lunge: number;
    target: EnemyAI | null;
    /** Når helkroppsklippet slippes (svingslaget fra Sword_Attack ender i et dypt utfall). */
    slipp: number;
}

const PLAYER_REACH = 1.35;

export class PlayerCombat {
    readonly f: Fighter;
    private attack: Attack | null = null;
    private queued: 'light' | 'heavy' | null = null;
    private combo = 0;
    private comboTimer = 0;
    /** Neste slag tas med høyre. Armene veksler etter hvert slag; en ny runde starter med høyre. */
    private rightNext = true;
    private blockStart = -1;
    blocking = false;
    private dodge = 0;
    private counterBonus = 0;
    private time = 0;
    /** Ganges med skaden i slagene (slåss-ferdigheten, graboks/rpg.ts). */
    skadeFaktor = 1;
    private readonly kropp: Kropp;

    constructor(char: Character, hp = 100) {
        this.f = { char, hp, maxHp: hp, iframes: 0, stagger: 0, dead: false };
        this.kropp = new Kropp(char.anim);
    }

    get busy(): boolean {
        return !!this.attack || this.dodge > 0 || this.blocking || this.f.stagger > 0 || this.f.dead;
    }

    reset(): void {
        this.f.hp = this.f.maxHp;
        this.f.dead = false;
        this.f.stagger = 0;
        this.attack = null;
        this.blocking = false;
        this.dodge = 0;
    }

    /**
     * @param moveDir ønsket retning i verden (brukes av unnamanøveren)
     */
    step(
        dt: number,
        input: { light: boolean; heavy: boolean; block: boolean; dodge: boolean; finisher: boolean },
        moveDir: THREE.Vector2,
        enemies: EnemyAI[],
        sink: CombatSink
    ): void {
        const c = this.f.char;
        this.time += dt;
        this.kropp.step(dt);
        this.f.iframes = Math.max(0, this.f.iframes - dt);
        this.comboTimer = Math.max(0, this.comboTimer - dt);
        if (this.comboTimer === 0) {
            this.combo = 0;
            this.rightNext = true;
        }
        if (this.f.dead) return;
        if (this.f.stagger > 0) {
            this.f.stagger -= dt;
            if (this.f.stagger <= 0) c.anim.release(0.2);
            return;
        }
        if (c.mode === 'air' || c.mode === 'mantle' || c.mode === 'seated') return;

        // ── Unnamanøver (rulling) ──
        if (this.dodge > 0) {
            this.dodge -= dt;
            if (this.dodge < 0.32) c.setLockVel(0, 0);
            if (this.dodge <= 0) c.anim.release(0.15);
            return;
        }
        if (input.dodge && !this.attack) {
            this.blocking = false;
            const d = moveDir.lengthSq() > 0.01 ? moveDir.clone().normalize() : new THREE.Vector2(-Math.sin(c.yaw), -Math.cos(c.yaw));
            c.yaw = Math.atan2(d.x, d.y);
            c.lock(0.62, d.x * 6.2, d.y * 6.2);
            c.anim.play('Roll', { fade: 0.05, timeScale: 1.75 });
            sink.lyd?.('sus', c.pos, 'gutt');
            this.dodge = 0.62;
            this.f.iframes = 0.42;
            return;
        }

        // ── Blokk ──
        if (input.block && !this.attack) {
            if (!this.blocking) {
                this.blocking = true;
                this.blockStart = this.time;
                c.anim.play('Punch_Enter', { fade: 0.08, timeScale: 2.2 });
            }
            c.lock(0.1, 0, 0);
            const t = nearest(c, enemies, 6);
            if (t) c.faceTowards(t.f.char.pos.x, t.f.char.pos.z, 10 * dt);
            return;
        } else if (this.blocking) {
            this.blocking = false;
            c.unlock();
            c.anim.release(0.15);
        }

        // ── Slag ──
        const want: Attack['kind'] | null = input.finisher ? 'finisher' : input.heavy ? 'heavy' : input.light ? 'light' : null;
        if (this.attack) {
            const a = this.attack;
            a.t += dt;
            if (want && want !== 'finisher' && a.t > a.dur * 0.45) this.queued = want;
            if (a.t > a.lunge) c.setLockVel(0, 0);
            if (a.slipp > 0 && a.t >= a.slipp) {
                a.slipp = -1;
                c.anim.release(0.3);
            }
            if (!a.hit && a.t >= a.hitAt) {
                a.hit = true;
                this.resolveHit(a, sink);
            }
            if (a.t >= a.dur) {
                this.attack = null;
                c.unlock();
                if (this.queued) {
                    const next = this.queued;
                    this.queued = null;
                    this.startAttack(next, enemies, sink);
                } else if (a.slipp !== -1) c.anim.release(0.2);
            }
            return;
        }
        if (want) {
            if (want === 'finisher') {
                const t = nearest(c, enemies, 3.5);
                if (!t || !t.canBeFinished) return;
            }
            this.startAttack(want, enemies, sink);
        }
    }

    private startAttack(kind: Attack['kind'], enemies: EnemyAI[], sink: CombatSink): void {
        const c = this.f.char;
        const target = nearest(c, enemies, 4.2);
        let lungeV = new THREE.Vector2();
        const lunge = kind === 'heavy' ? 0.22 : 0.16;
        if (target) {
            const tp = target.f.char.pos;
            c.faceTowards(tp.x, tp.z);
            const dist = Math.hypot(tp.x - c.pos.x, tp.z - c.pos.z);
            const travel = Math.max(0, dist - 1.0);
            lungeV = new THREE.Vector2(tp.x - c.pos.x, tp.z - c.pos.z).normalize().multiplyScalar(Math.min(10, travel / lunge));
        } else {
            lungeV.set(Math.sin(c.yaw), Math.cos(c.yaw)).multiplyScalar(1.5);
        }

        // Rekka: et raskt jab, et krosslag med skulderen bak, og et stort svingslag til slutt.
        // Krosslagene veksler arm (venstre er et speilet klipp). Svingslaget er starten av
        // Sword_Attack uten sverd: armen trekkes langt bak og slås rundt, før klippet går ned i et
        // dypt utfall som slippes.
        const cross = this.rightNext ? 'Punch_Cross' : 'Punch_Cross_L';
        let side = 1;
        if (kind === 'light') {
            this.combo = (this.combo % 3) + 1;
            if (this.combo === 1) {
                c.anim.play('Punch_Jab', { fade: 0.05, startAt: 0.1, timeScale: 2.1 });
                this.attack = { kind, t: 0, dur: 0.32, hitAt: 0.13, hit: false, lunge, target, slipp: 0 };
                side = -1;
            } else if (this.combo === 2) {
                c.anim.play(cross, { fade: 0.06, startAt: 0.12, timeScale: 2.0 });
                side = this.rightNext ? 1 : -1;
                this.rightNext = !this.rightNext;
                this.attack = { kind, t: 0, dur: 0.36, hitAt: 0.15, hit: false, lunge, target, slipp: 0 };
            } else {
                c.anim.play('Sword_Attack', { fade: 0.07, startAt: 0.12, timeScale: 1.55 });
                this.attack = { kind, t: 0, dur: 0.52, hitAt: 0.2, hit: false, lunge, target, slipp: 0.3 };
            }
        } else if (kind === 'heavy') {
            this.combo = 0;
            c.anim.play('Sword_Attack', { fade: 0.08, startAt: 0.05, timeScale: 0.95 });
            this.attack = { kind, t: 0, dur: 0.78, hitAt: 0.38, hit: false, lunge, target, slipp: 0.5 };
        } else {
            c.anim.play('Sword_Attack', { fade: 0.05, startAt: 0.0, timeScale: 0.85 });
            this.attack = { kind, t: 0, dur: 0.95, hitAt: 0.45, hit: false, lunge, target, slipp: 0.6 };
        }
        const kraft = kind === 'light' ? (this.combo === 3 ? 1.2 : 0.75) : kind === 'heavy' ? 1.4 : 1.6;
        this.kropp.slag(side, kraft, this.attack.hitAt * 0.8);
        sink.lyd?.('sus', c.pos, 'gutt', this.attack.hitAt * 0.6);
        if (kind !== 'light' || this.combo === 3 || Math.random() < 0.3) sink.lyd?.('stonn', c.pos, 'gutt');
        // Rekka (og armvekslingen) holder seg et drøyt halvsekund etter at slaget er ferdig.
        this.comboTimer = this.attack.dur + 0.55;
        c.lock(this.attack.dur + 0.05, lungeV.x, lungeV.y);
    }

    private resolveHit(a: Attack, sink: CombatSink): void {
        const c = this.f.char;
        const t = a.target;
        if (!t || t.f.dead) {
            sink.whiff();
            return;
        }
        const tp = t.f.char.pos;
        const dist = Math.hypot(tp.x - c.pos.x, tp.z - c.pos.z);
        if (dist > PLAYER_REACH + 0.35 || t.f.iframes > 0) {
            sink.whiff();
            return;
        }
        const dir = new THREE.Vector3(tp.x - c.pos.x, 0, tp.z - c.pos.z).normalize();
        let dmg: number;
        let kind: DamageKind = 'dealt';
        if (a.kind === 'finisher') {
            dmg = t.f.hp;
            kind = 'finisher';
        } else if (a.kind === 'heavy') dmg = 18 + Math.round(Math.random() * 7);
        else dmg = (this.combo === 3 ? 12 : 7) + Math.round(Math.random() * 3);
        if (a.kind !== 'finisher') dmg = Math.round(dmg * this.skadeFaktor);
        if (this.counterBonus > 0) {
            dmg *= 2;
            this.counterBonus = 0;
            kind = kind === 'finisher' ? kind : 'counter';
        }
        const tung = a.kind === 'heavy' || a.kind === 'finisher' || this.combo === 3;
        t.receive(dmg, dir, tung, sink, kind);
        sink.lyd?.(tung ? 'slag-tung' : 'slag-lett', tp, 'gutt');
        sink.impact(a.kind === 'light' && this.combo !== 3 ? 0.05 : 0.11, a.kind === 'light' ? 0.08 : 0.2);
    }

    /** Fienden slår mot spilleren. Returnerer hva som skjedde. */
    receive(dmg: number, from: THREE.Vector3, sink: CombatSink, ublokkbar = false): 'hit' | 'blocked' | 'counter' | 'dodged' {
        const c = this.f.char;
        if (this.f.dead) return 'hit';
        if (this.f.iframes > 0) return 'dodged';
        const dir = new THREE.Vector3(c.pos.x - from.x, 0, c.pos.z - from.z).normalize();
        const head = c.pos.clone().setY(c.pos.y + c.tune.height + 0.15);
        if (this.blocking && !ublokkbar) {
            sink.lyd?.('blokk', c.pos, 'gutt');
            if (this.time - this.blockStart < 0.3) {
                this.counterBonus = 1;
                sink.damage({ at: head, amount: 0, kind: 'counter', dir });
                sink.impact(0.09, 0.12);
                return 'counter';
            }
            const chip = Math.max(1, Math.round(dmg * 0.15));
            this.f.hp = Math.max(1, this.f.hp - chip);
            sink.damage({ at: head, amount: chip, kind: 'blocked', dir });
            c.lock(0.15, dir.x * 2.2, dir.z * 2.2);
            return 'blocked';
        }
        if (this.blocking) {
            // Svingslaget går gjennom garden.
            this.blocking = false;
            c.unlock();
        }
        this.f.hp = Math.max(0, this.f.hp - dmg);
        sink.damage({ at: head, amount: dmg, kind: 'taken', dir });
        sink.blood(c.pos.clone().setY(c.pos.y + c.tune.height * 0.82), dir, 0.6);
        sink.impact(0.08, 0.22);
        sink.lyd?.(ublokkbar ? 'slag-tung' : 'slag-lett', c.pos, 'gutt');
        sink.lyd?.('smerte', c.pos, 'gutt');
        this.kropp.treff(ublokkbar ? 1.3 : 0.9, Math.random() < 0.5 ? 1 : -1);
        this.attack = null;
        this.queued = null;
        if (this.f.hp <= 0) {
            this.f.dead = true;
            c.kill();
            c.anim.play('Death01', { fade: 0.1 });
            sink.lyd?.('fall', c.pos, 'gutt', 0.75);
        } else {
            this.f.stagger = 0.42;
            c.lock(0.42, dir.x * 3, dir.z * 3);
            c.anim.play(Math.random() < 0.5 ? 'Hit_Chest' : 'Hit_Head', { fade: 0.05, timeScale: 0.9 });
        }
        return 'hit';
    }
}

export interface CombatSink {
    damage(e: DamageEvent): void;
    blood(at: THREE.Vector3, dir: THREE.Vector3, amount: number): void;
    /** Treffpause (s) og kamerarisk. */
    impact(hitstop: number, shake: number): void;
    whiff(): void;
    /** Fienden varsler et slag (for faste hint i HUD). `ublokkbar`: et svingslag man må rulle unna. */
    telegraph(active: boolean, ublokkbar?: boolean): void;
    /** En lyd i kampen der den skjer, om `om` sekunder. `hvem` velger stemmen (gutten er lysere). */
    lyd?: (hva: KampLyd, pos: THREE.Vector3, hvem: 'gutt' | 'fiende', om?: number) => void;
}

type AIState = 'idle' | 'approach' | 'circle' | 'windup' | 'strike' | 'recover' | 'stagger' | 'dead';

export class EnemyAI {
    readonly f: Fighter;
    state: AIState = 'idle';
    private timer = 0;
    private circleDir = 1;
    private struck = false;
    private readonly baseTint: number;
    aggro = false;
    /** Hvilket slag som kommer: kross, to raske jab, eller et svingslag som ikke kan blokkeres. */
    slag: 'kross' | 'jab' | 'sving' = 'kross';
    private jabIgjen = 0;
    private readonly kropp: Kropp;
    /** Kalles når noe skjer som fienden kan si noe om (ropene, tyv.ts). */
    onRop: (hva: 'aggro' | 'treff' | 'svak' | 'slaar') => void = () => undefined;
    private svakSagt = false;

    constructor(char: Character, hp: number, tint: number) {
        this.f = { char, hp, maxHp: hp, iframes: 0, stagger: 0, dead: false };
        this.baseTint = tint;
        this.kropp = new Kropp(char.anim);
    }

    /** Gjør klar til en ny runde (R, eller tyven kommer tilbake). */
    nullstill(): void {
        this.svakSagt = false;
        this.slag = 'kross';
        this.jabIgjen = 0;
    }

    get canBeFinished(): boolean {
        return !this.f.dead && (this.state === 'stagger' || this.f.hp <= this.f.maxHp * 0.3);
    }

    receive(dmg: number, dir: THREE.Vector3, heavy: boolean, sink: CombatSink, kind: DamageKind): void {
        if (this.f.dead) return;
        const c = this.f.char;
        if (!this.aggro) this.onRop('aggro');
        this.aggro = true;
        this.f.hp = Math.max(0, this.f.hp - dmg);
        this.kropp.treff(heavy ? 1.4 : 0.8, dir.x * Math.cos(c.yaw) - dir.z * Math.sin(c.yaw) > 0 ? 1 : -1);
        if (Math.random() < (heavy ? 0.9 : 0.45)) sink.lyd?.('smerte', c.pos, 'fiende', 0.04);
        if (!this.svakSagt && this.f.hp > 0 && this.f.hp < this.f.maxHp * 0.35) {
            this.svakSagt = true;
            this.onRop('svak');
        } else if (Math.random() < 0.12) this.onRop('treff');
        const head = c.pos.clone().setY(c.pos.y + c.tune.height + 0.15);
        sink.damage({ at: head, amount: dmg, kind, dir });
        sink.blood(c.pos.clone().setY(c.pos.y + c.tune.height * (heavy ? 0.85 : 0.8)), dir, heavy ? 1 : 0.55);
        c.anim.setTint(this.baseTint);
        sink.telegraph(false);
        if (this.f.hp <= 0) {
            this.f.dead = true;
            this.state = 'dead';
            c.kill();
            c.lock(0.5, dir.x * 2.5, dir.z * 2.5);
            c.anim.play('Death01', { fade: 0.08, timeScale: kind === 'finisher' ? 0.8 : 1 });
            sink.lyd?.('fall', c.pos, 'fiende', kind === 'finisher' ? 0.95 : 0.75);
            return;
        }
        // Lette slag avbryter ikke et slag som allerede er på vei (fienden har tyngde),
        // men tunge slag og motslag gjør det alltid.
        if (heavy || kind === 'counter' || this.state !== 'strike') {
            this.state = 'stagger';
            this.timer = heavy || kind === 'counter' ? 1.1 : 0.4;
            c.faceTowards(c.pos.x - dir.x, c.pos.z - dir.z);
            c.lock(this.timer, dir.x * (heavy ? 4.5 : 1.6), dir.z * (heavy ? 4.5 : 1.6));
            c.anim.play(Math.random() < 0.5 ? 'Hit_Chest' : 'Hit_Head', { fade: 0.04, timeScale: heavy ? 0.7 : 1.1 });
        }
    }

    step(dt: number, player: PlayerCombat, sink: CombatSink): THREE.Vector2 {
        const c = this.f.char;
        const p = player.f.char.pos;
        const toP = new THREE.Vector2(p.x - c.pos.x, p.z - c.pos.z);
        const dist = toP.length();
        const dir = dist > 0.001 ? toP.clone().divideScalar(dist) : new THREE.Vector2(0, 1);
        const intent = new THREE.Vector2();
        this.timer -= dt;
        this.kropp.step(dt);
        if (this.f.dead) return intent;
        if (!this.aggro && dist < 7.5 && !player.f.dead) {
            this.aggro = true;
            this.onRop('aggro');
        }
        if (!this.aggro) return intent;
        if (player.f.dead && this.state !== 'stagger') {
            this.state = 'idle';
            c.anim.release(0.3);
            return intent;
        }

        switch (this.state) {
            case 'idle':
                this.state = 'approach';
                break;
            case 'approach':
                if (dist > 2.3) intent.copy(dir).multiplyScalar(dist > 5 ? 1 : 0.55);
                else {
                    this.state = 'circle';
                    this.timer = 0.7 + Math.random() * 1.1;
                    this.circleDir = Math.random() < 0.5 ? -1 : 1;
                    c.anim.play('Punch_Enter', { fade: 0.2, timeScale: 1.2 });
                }
                break;
            case 'circle': {
                // Sakte sidesteg rundt spilleren med garden oppe, mens den holder avstand.
                const side = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(this.circleDir * 0.65);
                const keep = dist < 1.8 ? -0.6 : dist > 2.8 ? 0.6 : 0;
                c.lock(0.05, side.x + dir.x * keep, side.y + dir.y * keep);
                c.faceTowards(p.x, p.z, 8 * dt);
                if (dist > 4) {
                    this.state = 'approach';
                    c.anim.release(0.2);
                } else if (this.timer <= 0) {
                    // Velg slaget: mest kross, noen ganger to raske jab, og et svingslag når han
                    // er sint (under halvt liv). Svingslaget varsles lenger og må rulles unna.
                    const r = Math.random();
                    this.slag = this.jabIgjen > 0 ? 'jab' : r < 0.22 ? 'jab' : r < (this.f.hp < this.f.maxHp * 0.6 ? 0.45 : 0.3) ? 'sving' : 'kross';
                    if (this.slag === 'jab' && this.jabIgjen === 0) this.jabIgjen = 2;
                    this.state = 'windup';
                    this.timer = this.slag === 'sving' ? 0.85 : this.slag === 'jab' ? 0.32 : 0.55;
                    c.anim.setTint(this.slag === 'sving' ? 0xe0784f : 0xd9b25a, this.slag === 'sving' ? 0x5a1800 : 0x4a3000);
                    sink.telegraph(true, this.slag === 'sving');
                    if (this.slag === 'sving') {
                        c.anim.play('Sword_Attack', { fade: 0.12, startAt: 0.0, timeScale: 0.16 });
                        this.onRop('slaar');
                    } else c.anim.play(this.slag === 'jab' ? 'Punch_Jab' : 'Punch_Cross', { fade: 0.1, startAt: 0, timeScale: this.slag === 'jab' ? 0.6 : 0.45 });
                }
                break;
            }
            case 'windup':
                c.lock(0.05, dir.x * 0.4, dir.y * 0.4);
                c.faceTowards(p.x, p.z, 6 * dt);
                if (this.timer <= 0) {
                    this.state = 'strike';
                    this.timer = this.slag === 'sving' ? 0.5 : this.slag === 'jab' ? 0.32 : 0.45;
                    this.struck = false;
                    c.anim.setTint(this.baseTint);
                    sink.telegraph(false);
                    c.anim.setTimeScale(this.slag === 'sving' ? 1.15 : this.slag === 'jab' ? 2.0 : 1.6);
                    const reach = Math.max(0, dist - 1.0);
                    c.lock(0.2, dir.x * Math.min(8, reach / 0.18), dir.y * Math.min(8, reach / 0.18));
                    sink.lyd?.('sus', c.pos, 'fiende', 0.05);
                    if (this.slag !== 'jab' || Math.random() < 0.3) sink.lyd?.('stonn', c.pos, 'fiende');
                    this.kropp.slag(this.slag === 'jab' ? -1 : 1, this.slag === 'sving' ? 1.5 : this.slag === 'jab' ? 0.7 : 1.1, 0.1);
                }
                break;
            case 'strike':
                if (!this.struck && this.timer < (this.slag === 'sving' ? 0.28 : this.slag === 'jab' ? 0.22 : 0.3)) {
                    this.struck = true;
                    if (dist < (this.slag === 'sving' ? 1.9 : 1.6)) {
                        const sving = this.slag === 'sving';
                        const dmg = sving ? 22 + Math.round(Math.random() * 6) : this.slag === 'jab' ? 6 + Math.round(Math.random() * 3) : 11 + Math.round(Math.random() * 5);
                        const res = player.receive(dmg, c.pos, sink, sving);
                        if (res === 'counter') {
                            this.state = 'stagger';
                            this.timer = 1.2;
                            this.jabIgjen = 0;
                            c.lock(1.2, -dir.x * 1.5, -dir.y * 1.5);
                            c.anim.play('Hit_Head', { fade: 0.05, timeScale: 0.6 });
                            this.kropp.treff(1.2, 1);
                            break;
                        }
                    } else sink.whiff();
                }
                if (this.slag === 'sving' && this.timer < 0.2 && c.anim.current === 'Sword_Attack') c.anim.release(0.25);
                if (this.timer <= 0) {
                    if (this.slag === 'jab' && --this.jabIgjen > 0) {
                        // Det andre jabbet kommer rett etter.
                        this.state = 'windup';
                        this.timer = 0.12;
                        c.anim.play('Punch_Jab', { fade: 0.06, startAt: 0.1, timeScale: 1.2 });
                        break;
                    }
                    this.jabIgjen = 0;
                    this.state = 'recover';
                    this.timer = this.slag === 'sving' ? 0.8 : 0.55;
                    c.anim.play('Punch_Enter', { fade: 0.25, timeScale: 1.2 });
                }
                break;
            case 'recover':
                c.lock(0.05, -dir.x * 0.5, -dir.y * 0.5);
                if (this.timer <= 0) {
                    this.state = 'circle';
                    this.timer = 0.6 + Math.random() * 1.2;
                    this.circleDir *= -1;
                }
                break;
            case 'stagger':
                if (this.timer <= 0) {
                    this.state = 'circle';
                    this.timer = 0.5 + Math.random() * 0.6;
                    c.anim.play('Punch_Enter', { fade: 0.2, timeScale: 1.2 });
                }
                break;
        }
        return intent;
    }
}

function nearest(c: Character, enemies: EnemyAI[], maxDist: number): EnemyAI | null {
    let best: EnemyAI | null = null;
    let bestScore = Infinity;
    const fx = Math.sin(c.yaw);
    const fz = Math.cos(c.yaw);
    for (const e of enemies) {
        if (e.f.dead) continue;
        const dx = e.f.char.pos.x - c.pos.x;
        const dz = e.f.char.pos.z - c.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > maxDist) continue;
        // Foretrekk den du ser mot, men ta også den bak deg om den er nærmest.
        const facing = (dx * fx + dz * fz) / Math.max(0.001, d);
        const score = d - facing * 0.8;
        if (score < bestScore) {
            bestScore = score;
            best = e;
        }
    }
    return best;
}
