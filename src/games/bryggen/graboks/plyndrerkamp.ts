// En plyndrer som slåss med gutten: plyndreren på Stranden i kapittel 2 (kap2.ts) og plyndreren i bua i
// kapittel 3 (kap3.ts). Felles for begge kapitlene.
//
// Kampen er den samme som med tyven i kapittel 1. Kampfiguren eies av tyven; `Tyv.laan` lar oss låne
// den (da gjør tyven ingenting, og `aktiv` og R spør oss). `byttDrakt(anim, 'plyndrer')` gir figuren
// plyndrerdrakten, og den får tyvedrakten tilbake når kampen er over. Det plyndreren roper, er alvor,
// ingen vitser [S].
import * as THREE from 'three';
import { byttDrakt } from '../bygg/folk';
import type { Hode } from './hoder';
import type { SpillKontekst } from './system';

const PARKERT = new THREE.Vector3(0, -60, 30);
/** Hvor lenge plyndreren ligger nede før han gir opp (s). */
const NEDE_S = 2.6;

/** Det plyndreren roper i kampen (combat.ts `onRop`). */
export interface Rop {
    aggro: string[];
    treff: string[];
    svak: string[];
    slaar: string[];
}

export type KampFase = 'av' | 'kamp' | 'nede' | 'ferdig';

export interface PlyndrerKamp {
    readonly fase: KampFase;
    /** Plyndreren dukker opp her og går løs på gutten. */
    start(pos: readonly number[], replikk: string): void;
    /** Hvert bilde. Gir true i det bildet plyndreren gir opp (etter at han har ligget nede). */
    bilde(dt: number): boolean;
    /** Plyndreren går sin vei uten at kampen er avgjort (tiden er ute). */
    avbryt(): void;
    dispose(): void;
}

/** `nede` er det han sier når han er slått ned. `ferdig`: kampen var avgjort før spillet ble lagret. */
export function lagPlyndrerKamp(k: SpillKontekst, rop: Rop, nede: string, ferdig = false): PlyndrerKamp {
    let fase: KampFase = ferdig ? 'ferdig' : 'av';
    let nedeTid = 0;
    let rop0: typeof k.ai.onRop | null = null;
    let sistRop = -9;
    let klokke = 0;
    let her = new THREE.Vector3();
    const hode: Hode = {
        hode: (ut) => {
            const b = k.enemy.anim.bein('DEF-head');
            return b ? b.getWorldPosition(ut).setY(ut.y + 0.24) : ut.copy(k.enemy.pos).setY(k.enemy.pos.y + 1.9);
        },
        synlig: () => (fase === 'kamp' || fase === 'nede') && k.enemy.anim.root.visible,
    };
    k.folk.ekstra.push({ h: hode, info: () => (hode.synlig() ? { navn: 'Plyndreren', tittel: '', merke: null, giver: false } : null) });
    const si = (hva: keyof Rop) => {
        if (hva !== 'svak' && klokke - sistRop < 2.5) return;
        sistRop = klokke;
        const l = rop[hva];
        k.folk.hoder.si(hode, l[Math.floor(Math.random() * l.length)], hva === 'svak' ? 3 : 2);
    };

    function sett(): void {
        const e = k.enemy;
        e.setSeated(false);
        e.mode = 'ground';
        e.teleport(her, Math.atan2(k.player.pos.x - her.x, k.player.pos.z - her.z));
        e.anim.root.visible = true;
        e.anim.release(0.1);
        k.ai.f.hp = k.ai.f.maxHp;
        k.ai.f.dead = false;
        k.ai.state = 'idle';
        k.ai.nullstill();
        k.ai.aggro = true;
    }

    function slutt(): void {
        const e = k.enemy;
        e.anim.root.visible = false;
        e.teleport(PARKERT, Math.PI);
        e.setSeated(true);
        k.ai.aggro = false;
        if (rop0) k.ai.onRop = rop0;
        rop0 = null;
        k.tyv.laan = null;
        void byttDrakt(e.anim, 'tyv');
    }

    return {
        get fase() {
            return fase;
        },
        start(pos, replikk) {
            her = new THREE.Vector3(pos[0], pos[1], pos[2]);
            fase = 'kamp';
            void byttDrakt(k.enemy.anim, 'plyndrer');
            rop0 = k.ai.onRop;
            k.ai.onRop = (hva) => si(hva);
            k.tyv.laan = {
                navn: 'Plyndreren',
                aktiv: () => fase === 'kamp' || fase === 'nede',
                nyRunde: () => {
                    if (fase !== 'kamp' && fase !== 'nede') return;
                    fase = 'kamp';
                    sett();
                },
            };
            sett();
            k.folk.hoder.si(hode, replikk, 3.5);
        },
        bilde(dt) {
            klokke += dt;
            if (fase === 'kamp' && k.ai.f.dead) {
                fase = 'nede';
                nedeTid = NEDE_S;
                k.folk.hoder.si(hode, nede, NEDE_S);
            } else if (fase === 'nede') {
                nedeTid -= dt;
                if (nedeTid <= 0) {
                    fase = 'ferdig';
                    slutt();
                    return true;
                }
            }
            return false;
        },
        avbryt() {
            if (fase === 'kamp' || fase === 'nede') slutt();
            fase = 'av';
        },
        dispose() {
            if (fase === 'kamp' || fase === 'nede') slutt();
        },
    };
}
