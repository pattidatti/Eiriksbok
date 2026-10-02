// Tyven i gården (oppdraget «Tyven i gården», oppdrag-data.ts).
//
// Fienden fra gråboksen står bakerst i gårdsrommet bare mens oppdraget er aktivt. Ellers er han
// parkert under bakken og står stille (Character i `seated`-modus går ikke). Når han blir slått
// ned, teller oppdraget det. Han har navn over hodet og roper noe når kampen starter, når han blir
// svak og når han slår et svingslag [S]: en sulten gutt fra nord (blueprint §6, kap. 1).
import * as THREE from 'three';
import type { Character } from '../motor/character';
import type { EnemyAI } from '../motor/combat';
import type { FolkStyring } from './folkstyring';
import type { Hode } from './hoder';

const ROP = {
    aggro: ['Hold deg unna, tyskergutt!', 'Gå vekk! Dette angår ikke deg!', 'Kom an, da!'],
    treff: ['Au!', 'Det skal du få igjen!'],
    svak: ['Stopp! Jeg var sulten!', 'Nok! Jeg gir meg ...'],
    slaar: ['Nå skal du få!', 'Ta denne!'],
};

const PARKERT = new THREE.Vector3(0, -60, 30);

export class Tyv {
    private readonly c: Character;
    private readonly ai: EnemyAI;
    private readonly folk: FolkStyring;
    private readonly start: THREE.Vector3;
    /** Står han i gården nå? */
    ute = false;
    private talt = false;
    private sistRop = -9;
    private klokke = 0;
    readonly hode: Hode;

    constructor(c: Character, ai: EnemyAI, folk: FolkStyring, start: THREE.Vector3) {
        this.c = c;
        this.ai = ai;
        this.folk = folk;
        this.start = start.clone();
        const h = c.tune.height;
        this.hode = {
            hode: (ut) => {
                const b = c.anim.bein('DEF-head');
                if (b && !ai.f.dead) return b.getWorldPosition(ut).setY(ut.y + 0.24);
                return ut.copy(c.anim.root.position).setY(c.anim.root.position.y + (ai.f.dead ? 0.5 : h + 0.1));
            },
            synlig: () => this.ute,
        };
        folk.ekstra.push({
            h: this.hode,
            info: () => (this.ute && !ai.f.dead ? { navn: 'Tyven', tittel: 'fremmed', merke: null, giver: false } : null),
        });
        ai.onRop = (hva) => this.rop(hva);
        this.parker();
    }

    private rop(hva: keyof typeof ROP): void {
        if (this.klokke - this.sistRop < (hva === 'svak' ? 0 : 2.5)) return;
        this.sistRop = this.klokke;
        const l = ROP[hva];
        this.folk.hoder.si(this.hode, l[Math.floor(Math.random() * l.length)], hva === 'svak' ? 3 : 1.8);
    }

    private parker(): void {
        this.ute = false;
        this.c.anim.root.visible = false;
        this.c.teleport(PARKERT, Math.PI);
        this.c.setSeated(true);
        this.ai.aggro = false;
    }

    /** Sett ham ut i gården, frisk. */
    private slippUt(): void {
        this.ute = true;
        this.talt = false;
        this.c.setSeated(false);
        this.c.mode = 'ground';
        this.c.teleport(this.start, Math.PI);
        this.c.anim.root.visible = true;
        this.c.anim.release(0.1);
        this.ai.f.hp = this.ai.f.maxHp;
        this.ai.f.dead = false;
        this.ai.state = 'idle';
        this.ai.aggro = false;
        this.ai.nullstill();
    }

    /** Skal fienden styres og flyttes dette steget? */
    get aktiv(): boolean {
        return this.ute;
    }

    update(dt: number): void {
        this.klokke += dt;
        const status = this.folk.oppdrag.status('tyven');
        if (status === 'aktiv' && !this.ute) this.slippUt();
        else if (status === 'levert' && this.ute && this.ai.f.dead) {
            // Ligger han der fortsatt når oppdraget er levert, er han hentet av kongens mann.
            this.parker();
        } else if (status !== 'aktiv' && status !== 'klar' && status !== 'levert' && this.ute) this.parker();
        if (this.ute && this.ai.f.dead && !this.talt) {
            this.talt = true;
            this.folk.oppdrag.hendelse('slaa:tyven');
        }
    }

    /** R: start slagsmålet på nytt (bare mens oppdraget er aktivt). */
    nyRunde(): void {
        if (this.folk.oppdrag.status('tyven') === 'aktiv') this.slippUt();
    }
}
