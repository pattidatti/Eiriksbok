// Alt som flyr. Piler, kastespyd og skudd fra begge sider er samme sak: noe forlater
// hånda, følger en rett bane, og treffer det første det når.
//
// Modulen avgjør ikke hvor mye skade noe gjør, bare at det traff. Den melder
// treffet tilbake gjennom krokene, så kampreglene kan bli boende ett sted.
//
// Dette er laget skytevåpen skal bygge på (blueprint R3): en bue i 793 og et
// gevær i 1916 er samme prosjektil med andre tall og en ladesyklus.

import Phaser from 'phaser';
import { TILE } from '../spriteforge';
import type { WorldMap } from '../worldgen';
import type { Effekter } from './effekter';
import type { Fiende, Prosjektil } from './entiteter';

/** Treffradius mot spilleren. Fiender får et påslag etter størrelse. */
const TREFF_RADIUS = 12;

export interface ProsjektilKroker {
    spiller: () => { x: number; y: number };
    fiender: () => Fiende[];
    /**
     * Et skudd som lander på eleven. Kroken får *hvor* skuddet er, ikke bare
     * hvor mye det gjør: forsvaret må vite hvilken vei det kom fra for å
     * avgjøre om skjoldet dekket.
     */
    skadSpiller: (x: number, y: number, skade: number) => void;
    skadFiende: (fiende: Fiende, skade: number, kritisk: boolean, vinkel: number) => void;
}

export interface SkuddDef {
    x: number;
    y: number;
    /** Retning i radianer. */
    vinkel: number;
    fart: number;
    skade: number;
    levetid: number;
    tekstur: string;
    farge?: number;
    fraFiende: boolean;
    piercing?: boolean;
    /**
     * Et fysisk skudd: en pil eller et kastespyd. Det peker dit det flyr og
     * pulserer ikke. Pulsen hørte til besvergelsene - en pil som puster ser ut
     * som en feil.
     */
    fysisk?: boolean;
}

export class Prosjektiler {
    private scene: Phaser.Scene;
    private efx: Effekter;
    private kart: WorldMap;
    private kroker: ProsjektilKroker;
    private liste: Prosjektil[] = [];

    constructor(scene: Phaser.Scene, efx: Effekter, kart: WorldMap, kroker: ProsjektilKroker) {
        this.scene = scene;
        this.efx = efx;
        this.kart = kart;
        this.kroker = kroker;
    }

    skyt(def: SkuddDef): void {
        const bilde = this.scene.add.image(def.x, def.y, def.tekstur).setDepth(def.y + 5);
        if (def.farge !== undefined) bilde.setTint(def.farge);
        if (def.fysisk) bilde.setRotation(def.vinkel);
        this.liste.push({
            sprite: bilde,
            vx: Math.cos(def.vinkel) * def.fart,
            vy: Math.sin(def.vinkel) * def.fart,
            skade: def.skade,
            levetid: def.levetid,
            fraFiende: def.fraFiende,
            piercing: Boolean(def.piercing),
            fysisk: Boolean(def.fysisk),
            truffet: new Set(),
        });
    }

    oppdater(delta: number): void {
        const dt = delta / 1000;
        const spiller = this.kroker.spiller();
        const fiender = this.kroker.fiender();

        for (let i = this.liste.length - 1; i >= 0; i--) {
            const p = this.liste[i];
            p.sprite.x += p.vx * dt;
            p.sprite.y += p.vy * dt;
            p.sprite.setDepth(p.sprite.y + 5);
            p.levetid -= delta;
            if (!p.fysisk) p.sprite.setScale(1 + Math.sin(this.scene.time.now / 60) * 0.12);

            const tx = Math.floor(p.sprite.x / TILE);
            const ty = Math.floor(p.sprite.y / TILE);
            const utenfor =
                tx < 0 ||
                ty < 0 ||
                tx >= this.kart.bredde ||
                ty >= this.kart.hoyde ||
                this.kart.blokkert[ty][tx];

            if (p.fraFiende) {
                if (
                    Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, spiller.x, spiller.y - 6) <
                    TREFF_RADIUS
                ) {
                    this.kroker.skadSpiller(p.sprite.x, p.sprite.y, p.skade);
                    this.efx.pikselSprut(p.sprite.x, p.sprite.y, 0xffffff, 6);
                    this.fjern(i);
                    continue;
                }
            } else {
                let traff = false;
                for (const fiende of fiender) {
                    if (fiende.dodd || p.truffet.has(fiende)) continue;
                    const d = Phaser.Math.Distance.Between(
                        p.sprite.x,
                        p.sprite.y,
                        fiende.sprite.x,
                        fiende.sprite.y - 6
                    );
                    if (d < TREFF_RADIUS + (fiende.def.storrelse ?? 1) * 5) {
                        const v = Math.atan2(p.vy, p.vx);
                        this.kroker.skadFiende(fiende, Math.round(p.skade), false, v);
                        p.truffet.add(fiende);
                        traff = true;
                        if (!p.piercing) break;
                    }
                }
                if (traff && !p.piercing) {
                    this.efx.pikselSprut(p.sprite.x, p.sprite.y, 0xffffff, 8);
                    this.fjern(i);
                    continue;
                }
            }

            if (p.levetid <= 0 || utenfor) this.fjern(i);
        }
    }

    private fjern(i: number): void {
        this.liste[i].sprite.destroy();
        this.liste.splice(i, 1);
    }
}
