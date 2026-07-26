// Partikler, flytende tall og småglimt. Modulen kjenner ingen spillregler - den
// tar imot «tegn dette her, i denne fargen» og rydder etter seg selv.
//
// Alt gjenbrukes. Før ble det laget og ødelagt et Image + en Tween per partikkel,
// og et helt nytt Text-objekt (= én ny GL-teksturopplasting) per skadetall. Det er
// den klassiske kilden til hakk på en Chromebook-GPU.

import Phaser from 'phaser';
import { GLYF, glyfIndex } from '../spriteforge';

type Bilde = Phaser.GameObjects.Image;

/** Over denne grensen ødelegges partikler i stedet for å legges tilbake. */
const POOL_TAK = 220;

export class Effekter {
    private pool: Bilde[] = [];
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /** Hent et gjenbrukt bilde fra poolen, nullstilt. */
    hent(nokkel: string): Bilde {
        const p = this.pool.pop() ?? this.scene.add.image(0, 0, nokkel);
        p.setTexture(nokkel)
            .setActive(true)
            .setVisible(true)
            .setAlpha(1)
            .setScale(1)
            .setAngle(0)
            .clearTint();
        return p;
    }

    /** Legg et bilde tilbake. Alt som henter, må slippe. */
    slipp(p: Bilde): void {
        p.setActive(false).setVisible(false);
        if (this.pool.length < POOL_TAK) this.pool.push(p);
        else p.destroy();
    }

    /**
     * Flytende tall, tegnet med pikselfonten. Vektorfont skalert 3x av kameraet
     * var det mest uskarpe elementet i en ellers skarp pikselartscene.
     */
    flytTekst(x: number, y: number, tekst: string, farge: string, storrelse = 1): void {
        const skala = storrelse >= 15 ? 1.5 : 1;
        const bredde = tekst.length * GLYF.w * skala;
        const tint = Phaser.Display.Color.HexStringToColor(farge).color;
        const tegn: Bilde[] = [];
        for (let i = 0; i < tekst.length; i++) {
            const bilde = this.hent('font-tall');
            bilde.setFrame(glyfIndex(tekst[i]));
            bilde
                .setPosition(x - bredde / 2 + i * GLYF.w * skala, y)
                .setOrigin(0, 0.5)
                .setScale(skala)
                .setTint(tint)
                .setDepth(20000);
            tegn.push(bilde);
        }
        this.scene.tweens.add({
            targets: tegn,
            y: y - 22,
            alpha: 0,
            duration: 720,
            ease: 'Quad.Out',
            onComplete: () => {
                for (const t of tegn) {
                    t.setOrigin(0.5, 0.5);
                    this.slipp(t);
                }
            },
        });
    }

    pikselSprut(x: number, y: number, farge: number, antall: number): void {
        for (let i = 0; i < antall; i++) {
            const bit = this.hent('fx-bit');
            bit.setPosition(x, y).setTint(farge).setDepth(19000);
            const v = Math.random() * Math.PI * 2;
            const fart = 20 + Math.random() * 46;
            this.scene.tweens.add({
                targets: bit,
                x: x + Math.cos(v) * fart,
                y: y + Math.sin(v) * fart,
                alpha: 0,
                scale: 0.3,
                duration: 260 + Math.random() * 220,
                ease: 'Quad.Out',
                onComplete: () => this.slipp(bit),
            });
        }
    }

    stovsky(x: number, y: number, antall: number): void {
        for (let i = 0; i < antall; i++) {
            const p = this.hent('fx-prikk');
            p.setPosition(x, y)
                .setTint(0xd8c89a)
                .setDepth(y - 1)
                .setAlpha(0.7);
            const v = Math.random() * Math.PI * 2;
            this.scene.tweens.add({
                targets: p,
                x: x + Math.cos(v) * 14,
                y: y + Math.sin(v) * 7,
                alpha: 0,
                scale: 1.8,
                duration: 380,
                onComplete: () => this.slipp(p),
            });
        }
    }

    /**
     * Et lite lysglimt rundt en figur. Brukes når kunnskapen treffer.
     * `x`/`y` er figurens fot, slik spilleren er plassert.
     */
    lysglimt(x: number, y: number): void {
        const ring = this.scene.add
            .image(x, y - 6, 'fx-ring')
            .setTint(0xfff1a8)
            .setDepth(y + 8)
            .setScale(0.2);
        this.scene.tweens.add({
            targets: ring,
            scale: 1.8,
            alpha: 0,
            duration: 520,
            ease: 'Cubic.Out',
            onComplete: () => ring.destroy(),
        });
        this.pikselSprut(x, y - 10, 0xfff1a8, 16);
        this.scene.cameras.main.flash(160, 255, 250, 200);
    }
}
