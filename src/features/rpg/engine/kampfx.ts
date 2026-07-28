// Alt som gjør kampen deilig å kjenne på: kamerastøt, klaskesprett, blod som
// blir liggende, løsdeler som spinner av, lik på bakken, saktefilm og én
// avslutningsanimasjon per våpenart.
//
// Ligger utenfor `WorldScene` fordi scenen alt er lang nok, og fordi dette er
// laget som skal justeres oftest. Ingenting her kjenner spillreglene - det tar
// bare imot «noe traff her, i denne retningen, med denne vekten».
//
// Prinsippet gjennom hele fila: rystelse leser som støy, dytt leser som kraft,
// og en effekt eleven ikke legger merke til er ikke en effekt.

import Phaser from 'phaser';
import { sfx } from './audio';
import { hexToNum, numToHex, ramp } from './pixels';
import { LOSDEL_RAMMER } from './spriteforge';
import type { EnemyDef, WeaponArt } from '../types';

/** Fargen blod har når det har lagt seg: to trinn mørkere enn i luften. */
function morkere(farge: number): number {
    return hexToNum(ramp(numToHex(farge), -2));
}

/** Hvor mye som får ligge igjen før det eldste ryddes. Chromebook-budsjett. */
const MAKS_FLEKKER = 110;
const MAKS_LIK = 12;

type Bilde = Phaser.GameObjects.Image;

export class KampFx {
    private pool: Bilde[] = [];
    private dyttTween: Phaser.Tweens.Tween | null = null;
    /** Blod og løsdeler som har lagt seg. Statiske bilder, ingen tweens. */
    private flekker: Bilde[] = [];
    private lik: Bilde[] = [];
    /** Saktefilm: millisekunder igjen, og hvor sakte. */
    private sakteIgjen = 0;
    private faktor = 1;

    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // ── Saktefilm ───────────────────────────────────────────────────────────

    /**
     * Tidsfaktoren `WorldScene` skal gange sin egen delta med. Fysikken og
     * tweenene skaleres her inne; spillogikken kan vi ikke røre herfra.
     */
    get tidsfaktor(): number {
        return this.sakteIgjen > 0 ? this.faktor : 1;
    }

    /**
     * Kort saktefilm etter et drap. Kort med vilje: over 200 ms begynner det å
     * føles som lagg i stedet for som tyngde.
     */
    sakteFilm(ms: number, faktor = 0.4): void {
        this.sakteIgjen = ms;
        this.faktor = faktor;
        this.scene.physics.world.timeScale = 1 / faktor;
        this.scene.tweens.timeScale = faktor;
    }

    /** Kalles med ekte delta, ikke den skalerte - ellers tar saktefilmen aldri slutt. */
    tikk(delta: number): void {
        if (this.sakteIgjen <= 0) return;
        this.sakteIgjen -= delta;
        if (this.sakteIgjen <= 0) this.normalTid();
    }

    private normalTid(): void {
        this.sakteIgjen = 0;
        this.faktor = 1;
        // Samme grunn som i vask(): under nedstenging kan fysikkverdenen og
        // tween-manageren være borte før vi slipper til.
        const verden = this.scene.physics?.world;
        if (verden) verden.timeScale = 1;
        if (this.scene.tweens) this.scene.tweens.timeScale = 1;
    }

    // ── Kamera ──────────────────────────────────────────────────────────────

    /**
     * Retningsbestemt kamerastøt. Kameraet følger spilleren, så `setScroll` blir
     * overskrevet neste bilde - `followOffset` er det ene stedet vi kan skyve det.
     */
    dytt(vinkel: number, piksler: number, ms = 120): void {
        const cam = this.scene.cameras.main;
        const mx = Math.cos(vinkel) * piksler;
        const my = Math.sin(vinkel) * piksler;
        // To dytt samtidig ville dratt kameraet i to retninger, og den ene
        // tweenen ville ryddet etter seg midt i den andre.
        this.dyttTween?.remove();
        cam.setFollowOffset(mx, my);
        this.dyttTween = this.scene.tweens.addCounter({
            from: 1,
            to: 0,
            duration: ms,
            ease: 'Quad.Out',
            onUpdate: (t) => {
                const k = t.getValue() ?? 0;
                cam.setFollowOffset(mx * k, my * k);
            },
            onComplete: () => {
                cam.setFollowOffset(0, 0);
                this.dyttTween = null;
            },
        });
    }

    // ── Kropper ─────────────────────────────────────────────────────────────

    /** Klaskesprett: målet klemmes flatt i trefframmen og spretter tilbake. */
    klask(mal: Phaser.GameObjects.Sprite | Bilde, styrke = 0.15): void {
        this.scene.tweens.killTweensOf(mal);
        mal.setScale(1 + styrke, 1 - styrke);
        this.scene.tweens.add({
            targets: mal,
            scaleX: 1,
            scaleY: 1,
            duration: 80,
            ease: 'Quad.Out',
        });
    }

    /** Vipp: en kort rotasjonsrykning. Gjør at et treff kjennes i kroppen. */
    vipp(mal: Phaser.GameObjects.Sprite | Bilde, grader = 8): void {
        mal.setAngle(Phaser.Math.Between(-grader, grader));
        this.scene.tweens.add({ targets: mal, angle: 0, duration: 110, ease: 'Quad.Out' });
    }

    // ── Blod ────────────────────────────────────────────────────────────────

    /**
     * Én flekk på bakken. Formen er én av fire ujevne små blob-er, og fargen er
     * mørkere enn sprutet i luften - blod som har lagt seg er mørkere enn blod som
     * flyr. Uten begge to leser flekkene som spredte murstein.
     */
    private flekk(x: number, y: number, farge: number): Bilde {
        return this.scene.add
            .image(x, y, 'fx-flekk', Phaser.Math.Between(0, 3))
            .setTint(morkere(farge))
            .setAlpha(Phaser.Math.FloatBetween(0.5, 0.85))
            .setScale(Phaser.Math.FloatBetween(0.7, 1.15))
            .setAngle(Phaser.Math.Between(0, 3) * 90)
            .setDepth(-880);
    }

    /** Blod som blir liggende, kastet ut langs treffvektoren. */
    blod(x: number, y: number, farge: number, antall: number, vinkel: number): void {
        for (let i = 0; i < antall; i++) {
            const spredning = Phaser.Math.FloatBetween(-0.7, 0.7);
            const lengde = Phaser.Math.Between(3, 18);
            this.leggFlekk(
                this.flekk(
                    x + Math.cos(vinkel + spredning) * lengde,
                    y + Math.sin(vinkel + spredning) * lengde + Phaser.Math.Between(0, 5),
                    farge
                )
            );
        }
    }

    /**
     * Gyt: blod i luften. Partiklene flyr ut langs vektoren og etterlater en
     * flekk der de lander - så sprutet og flekken er samme hendelse, ikke to.
     */
    gyt(x: number, y: number, farge: number, antall: number, vinkel: number, kraft = 1): void {
        for (let i = 0; i < antall; i++) {
            const p = this.hent('fx-bit');
            const v = vinkel + Phaser.Math.FloatBetween(-0.55, 0.55);
            const lengde = Phaser.Math.Between(14, 40) * kraft;
            p.setPosition(x, y)
                .setTint(farge)
                .setScale(Phaser.Math.FloatBetween(0.6, 1.4))
                .setDepth(19000);
            const mx = x + Math.cos(v) * lengde;
            const my = y + Math.sin(v) * lengde + Phaser.Math.Between(4, 14);
            this.scene.tweens.add({
                targets: p,
                x: mx,
                y: my,
                alpha: 0.2,
                duration: Phaser.Math.Between(260, 460),
                ease: 'Quad.Out',
                onComplete: () => {
                    this.slipp(p);
                    // Der den landet, ligger den igjen.
                    this.leggFlekk(this.flekk(mx, my, farge));
                },
            });
        }
    }

    // ── Skjold og slag ──────────────────────────────────────────────────────

    /** Treflis av skjoldkanten, langs blokkvinkelen. */
    flis(x: number, y: number, vinkel: number, antall: number): void {
        for (let i = 0; i < antall; i++) {
            const p = this.hent('fx-flis');
            const v = vinkel + Phaser.Math.FloatBetween(-0.9, 0.9);
            const fart = Phaser.Math.Between(30, 90);
            p.setPosition(x, y).setDepth(19000).setAngle(Phaser.Math.Between(0, 360));
            this.scene.tweens.add({
                targets: p,
                x: x + Math.cos(v) * fart,
                y: y + Math.sin(v) * fart + 14,
                angle: p.angle + Phaser.Math.Between(-180, 180),
                alpha: 0,
                duration: Phaser.Math.Between(320, 520),
                ease: 'Quad.Out',
                onComplete: () => this.slipp(p),
            });
        }
    }

    /**
     * Våpenspor: buen henger igjen et øyeblikk etter svingen. Tre kopier med
     * synkende alpha i stedet for tidsforsinkelser - da virker den også midt i
     * en hitstop, der alle tweens står stille.
     */
    spor(x: number, y: number, vinkel: number, rekkevidde: number): void {
        const skala = rekkevidde / 26;
        [
            { a: 0.9, v: 0, s: 1 },
            { a: 0.5, v: -0.22, s: 0.92 },
            { a: 0.25, v: -0.44, s: 0.84 },
        ].forEach(({ a, v, s }, i) => {
            const bue = this.hent('fx-slag');
            bue.setPosition(x + Math.cos(vinkel + v) * 14, y + Math.sin(vinkel + v) * 14)
                .setRotation(vinkel + v)
                .setAlpha(a)
                .setScale(skala * s)
                .setDepth(19000);
            this.scene.tweens.add({
                targets: bue,
                alpha: 0,
                scale: skala * s * 1.35,
                duration: 90 + i * 40,
                onComplete: () => this.slipp(bue),
            });
        });
    }

    /** Nedslag: en ring som slår ut fra treffpunktet. Leser som trykk. */
    nedslag(x: number, y: number, styrke = 1): void {
        const ring = this.hent('fx-ring');
        ring.setPosition(x, y).setScale(0.06).setAlpha(0.85).setTint(0xffffff).setDepth(19500);
        this.scene.tweens.add({
            targets: ring,
            scale: 0.3 * styrke,
            alpha: 0,
            duration: 180,
            ease: 'Quad.Out',
            onComplete: () => this.slipp(ring),
        });
    }

    // ── Lemlestelse ─────────────────────────────────────────────────────────

    /**
     * Biter som slås av og blir liggende. `tunge` velger de store flakene i
     * løsdel-arket - øksa river av flak, hammeren lager grus.
     */
    lemlest(
        x: number,
        y: number,
        enemyId: string,
        antall: number,
        vinkel: number,
        tunge = false
    ): void {
        const key = `losdel-${enemyId}`;
        if (!this.scene.textures.exists(key)) return;
        for (let i = 0; i < antall; i++) {
            const ramme = tunge
                ? Phaser.Math.Between(0, 1)
                : Phaser.Math.Between(2, LOSDEL_RAMMER - 1);
            const bit = this.scene.add.image(x, y, key, ramme).setDepth(19000);
            const v = vinkel + Phaser.Math.FloatBetween(-1.1, 1.1);
            const lengde = Phaser.Math.Between(16, 46);
            const mx = x + Math.cos(v) * lengde;
            const my = y + Math.sin(v) * lengde;

            // Kastet opp, og så ned igjen. To tweens etter hverandre på y, én på
            // x - to samtidige y-tweens ville slått hverandre ut.
            this.scene.tweens.add({ targets: bit, x: mx, duration: 420, ease: 'Quad.Out' });
            this.scene.tweens.add({
                targets: bit,
                angle: Phaser.Math.Between(-540, 540),
                duration: 420,
                ease: 'Quad.Out',
            });
            this.scene.tweens.add({
                targets: bit,
                y: my - Phaser.Math.Between(10, 22),
                duration: 190,
                ease: 'Quad.Out',
                onComplete: () => {
                    if (!bit.active) return;
                    this.scene.tweens.add({
                        targets: bit,
                        y: my + 4,
                        duration: 180,
                        ease: 'Quad.In',
                        onComplete: () => {
                            // Biten legger seg og blir liggende med resten.
                            if (!bit.active) return;
                            bit.setDepth(-870).setAngle(Phaser.Math.Between(0, 360));
                            this.leggFlekk(bit);
                        },
                    });
                },
            });
        }
    }

    /** Liket som blir liggende der fienden falt. */
    leggLik(x: number, y: number, enemyId: string): void {
        const key = `lik-${enemyId}`;
        if (!this.scene.textures.exists(key)) return;
        const l = this.scene.add
            .image(x, y, key)
            .setDepth(-875)
            .setAngle(Phaser.Math.Between(-12, 12))
            .setAlpha(0.95);
        this.lik.push(l);
        // De eldste likene tones bort i stedet for å forsvinne i et hopp.
        while (this.lik.length > MAKS_LIK) {
            const gammelt = this.lik.shift();
            if (!gammelt) break;
            this.scene.tweens.add({
                targets: gammelt,
                alpha: 0,
                duration: 900,
                onComplete: () => gammelt.destroy(),
            });
        }
    }

    // ── Avslutninger ────────────────────────────────────────────────────────

    /**
     * Én avslutning per våpenart. Dette er utbetalingen: et drap skal ikke være
     * at en helsestolpe nådde null, det skal være noe som skjedde med en kropp.
     *
     * `ferdig` kalles når animasjonen er over, så scenen kan rydde sprite-en og
     * legge liket. Den kalles alltid - også hvis noe skulle gå galt underveis.
     */
    avslutning(
        sprite: Phaser.GameObjects.Sprite,
        def: EnemyDef,
        art: WeaponArt | null,
        vinkel: number,
        ferdig: () => void
    ): void {
        const { x, y } = sprite;
        const farge = def.farge;
        const stor = (def.storrelse ?? 1) >= 1.5;
        const tw = this.scene.tweens;

        this.nedslag(x, y - 4, stor ? 1.8 : 1.1);

        switch (art) {
            // Sverdet kutter. Kroppen deles på tvers av slagretningen, og de to
            // halvdelene glir fra hverandre før de faller.
            case 'sverd': {
                sfx.kutt();
                this.gyt(x, y - 4, farge, 12, vinkel + Math.PI / 2, 1.1);
                this.gyt(x, y - 4, farge, 12, vinkel - Math.PI / 2, 1.1);
                this.lemlest(x, y - 4, def.id, 2, vinkel + Math.PI / 2, true);
                this.lemlest(x, y - 4, def.id, 2, vinkel - Math.PI / 2, true);
                sprite.setRotation(vinkel);
                tw.add({
                    targets: sprite,
                    scaleY: 0.08,
                    alpha: 0.2,
                    duration: 220,
                    ease: 'Quad.In',
                    onComplete: ferdig,
                });
                break;
            }

            // Øksa flekker. Kroppen slås ned i bakken langs slagretningen.
            case 'oks': {
                sfx.flekk();
                this.gyt(x, y - 4, farge, 16, vinkel, 1.3);
                this.lemlest(x, y - 4, def.id, 3, vinkel, true);
                tw.add({
                    targets: sprite,
                    x: x + Math.cos(vinkel) * 12,
                    y: y + Math.sin(vinkel) * 6,
                    scaleX: 1.6,
                    scaleY: 0.32,
                    alpha: 0.15,
                    duration: 260,
                    ease: 'Quint.In',
                    onComplete: ferdig,
                });
                break;
            }

            // Spydet borer gjennom. Kroppen skyves bakover og henger på odden
            // et øyeblikk før den siger sammen.
            case 'spyd': {
                sfx.gjennombor();
                this.gyt(x, y - 4, farge, 9, vinkel, 1.5);
                this.lemlest(x, y - 4, def.id, 2, vinkel);
                tw.add({
                    targets: sprite,
                    x: x + Math.cos(vinkel) * 22,
                    y: y + Math.sin(vinkel) * 11,
                    scaleX: 0.7,
                    duration: 230,
                    ease: 'Quad.Out',
                    onComplete: () => {
                        tw.add({
                            targets: sprite,
                            scaleY: 0.2,
                            alpha: 0.15,
                            duration: 170,
                            ease: 'Quad.In',
                            onComplete: ferdig,
                        });
                    },
                });
                break;
            }

            // Hammeren knuser. Alt blir grus, i alle retninger.
            case 'hammer': {
                sfx.knus();
                this.gyt(x, y - 4, farge, 20, vinkel, 0.9);
                this.lemlest(x, y - 4, def.id, 6, vinkel - 1.6);
                this.lemlest(x, y - 4, def.id, 6, vinkel + 1.6);
                tw.add({
                    targets: sprite,
                    scaleX: 2.1,
                    scaleY: 0.12,
                    alpha: 0,
                    duration: 150,
                    ease: 'Quint.In',
                    onComplete: ferdig,
                });
                break;
            }

            // Staven, og alt vi ikke har et eget grep for: slengt av gårde.
            default: {
                sfx.slengt();
                this.gyt(x, y - 4, farge, 10, vinkel, 1);
                this.lemlest(x, y - 4, def.id, 3, vinkel);
                tw.add({
                    targets: sprite,
                    x: x + Math.cos(vinkel) * 30,
                    y: y + Math.sin(vinkel) * 16,
                    angle: 420,
                    scale: 0.55,
                    alpha: 0,
                    duration: 320,
                    ease: 'Quad.Out',
                    onComplete: ferdig,
                });
            }
        }
    }

    // ── Rydding og pool ─────────────────────────────────────────────────────

    private leggFlekk(bilde: Bilde): void {
        this.flekker.push(bilde);
        while (this.flekker.length > MAKS_FLEKKER) this.flekker.shift()?.destroy();
    }

    /** Alt som ligger igjen fjernes - ved død, kapittelskifte eller ny økt. */
    vask(): void {
        for (const f of this.flekker) f.destroy();
        this.flekker = [];
        for (const l of this.lik) l.destroy();
        this.lik = [];
        this.dyttTween?.remove();
        this.dyttTween = null;
        // Vask kalles også fra scenens shutdown, og da er kjerneplugins alt
        // ryddet: `cameras.main` finnes ikke lenger. Kastet herfra avbrøt hele
        // opprydningen, og en reise til et nytt sted strandet med tomt lerret.
        this.scene.cameras?.main?.setFollowOffset(0, 0);
        this.normalTid();
    }

    /**
     * Slipper poolen. Må kalles når scenen rives, og bare da - se den utførlige
     * begrunnelsen i `Effekter.glemPool()`. Samme felle, samme frys.
     *
     * `vask()` gjør det ikke, fordi `vask()` også kalles ved død, og da er
     * bildene i poolen fortsatt gyldige.
     */
    glemPool(): void {
        this.pool = [];
    }

    private hent(nokkel: string): Bilde {
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

    private slipp(p: Bilde): void {
        p.setActive(false).setVisible(false);
        if (this.pool.length < 160) this.pool.push(p);
        else p.destroy();
    }
}
