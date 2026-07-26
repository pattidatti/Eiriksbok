// Det som spretter ut av en felt fiende, og som trekkes mot eleven når hun er nær.
//
// Modulen kjenner ingen kamp. Den får «slipp dette her», og den vet hvor spilleren
// står. Resten er tweens og en levetid.

import Phaser from 'phaser';
import { ITEM_BY_ID } from '../../data/items';
import { useRpgStore } from '../../store/useRpgStore';
import { sfx } from '../audio';
import type { Effekter } from './effekter';
import type { LootBit } from './entiteter';

/** Loot du aldri går bort til skal forsvinne, ikke ligge igjen med evig tween. */
const LEVETID_MS = 45000;
/** Under denne blinker den for å varsle at den er i ferd med å gå. */
const BLINK_MS = 4000;
const TREKK_AVSTAND = 40;
const PLUKK_AVSTAND = 12;

export class Loot {
    private scene: Phaser.Scene;
    private efx: Effekter;
    private spillerPos: () => { x: number; y: number };
    private biter: LootBit[] = [];

    constructor(scene: Phaser.Scene, efx: Effekter, spillerPos: () => { x: number; y: number }) {
        this.scene = scene;
        this.efx = efx;
        this.spillerPos = spillerPos;
    }

    /**
     * `nr` er plassen i loot-eksplosjonen, og styrer tonehøyden på plinget - så
     * en full loot-sprett blir en oppadgående figur i stedet for samme lyd fem
     * ganger.
     */
    slipp(x: number, y: number, itemId: string | null, solv: number, nr = 0): void {
        const key = itemId
            ? ITEM_BY_ID[itemId]?.slot === 'vapen'
                ? 'loot-bok'
                : 'loot-kiste'
            : 'loot-solv';
        const sprite = this.scene.add.image(x, y, key).setDepth(y);
        sfx.lootPling(nr);

        // Spretter ut i en bue i stedet for rett opp og ned. Retningen varieres
        // per objekt, så to drop aldri lander i samme punkt.
        //
        // Buen er én tween på x og to på y etter hverandre - opp og så ned. To
        // samtidige y-tweens ville slått hverandre ut, og gjenstanden ville
        // hoppet uten å komme noen vei.
        const v = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
        const kast = Phaser.Math.Between(10, 22);
        const mx = x + Math.cos(v) * kast;
        const my = y + Math.sin(v) * kast * 0.5;
        this.scene.tweens.add({ targets: sprite, x: mx, duration: 350, ease: 'Quad.Out' });
        this.scene.tweens.add({
            targets: sprite,
            y: my - 13,
            duration: 190,
            ease: 'Quad.Out',
            onComplete: () => {
                if (sprite.active) {
                    this.scene.tweens.add({
                        targets: sprite,
                        y: my,
                        duration: 160,
                        ease: 'Quad.In',
                    });
                }
            },
        });
        this.scene.tweens.add({
            targets: sprite,
            scale: 1.12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
        });
        this.biter.push({ sprite, itemId, solv, levetid: LEVETID_MS });
    }

    oppdater(delta: number): void {
        const spiller = this.spillerPos();
        for (let i = this.biter.length - 1; i >= 0; i--) {
            const l = this.biter[i];
            l.levetid -= delta;
            if (l.levetid <= 0) {
                this.fjern(i);
                continue;
            }
            if (l.levetid < BLINK_MS) {
                l.sprite.setAlpha(Math.floor(l.levetid / 160) % 2 ? 0.35 : 1);
            }

            const d = Phaser.Math.Distance.Between(l.sprite.x, l.sprite.y, spiller.x, spiller.y);
            // Trekkes mot spilleren når hun er nær - alltid tilfredsstillende.
            if (d < TREKK_AVSTAND) {
                const v = Math.atan2(spiller.y - l.sprite.y, spiller.x - l.sprite.x);
                const steg = (180 * delta) / 1000;
                l.sprite.x += Math.cos(v) * steg;
                l.sprite.y += Math.sin(v) * steg;
            }
            if (d < PLUKK_AVSTAND) {
                const store = useRpgStore.getState();
                if (l.itemId) {
                    store.leggISekk(l.itemId);
                    sfx.plukk();
                } else {
                    store.giSolv(l.solv);
                    sfx.solv();
                    this.efx.flytTekst(
                        l.sprite.x,
                        l.sprite.y - 12,
                        `+${l.solv} sølv`,
                        '#f2edd0',
                        11
                    );
                }
                this.fjern(i);
            }
        }
    }

    private fjern(i: number): void {
        const l = this.biter[i];
        this.scene.tweens.killTweensOf(l.sprite);
        l.sprite.destroy();
        this.biter.splice(i, 1);
    }
}
