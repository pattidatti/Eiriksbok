// Cutscene-avspilleren.
//
// Bygget på det motoren allerede har: kameraet, tweenene, figurene fra
// `spriteforge`, låsen og synten. Ingen video, ingen nye filer, ingen ny
// grafikk (blueprint §8).
//
// Fire regler styrer innholdet, og de er innholdsregler - ikke kode:
//
//   1. Ingen fakta som bare finnes i cutscenen. Klippene setter innsats og
//      stemning; fagstoffet lever i systemene og i mellomspillene.
//   2. Alltid hoppbar etter første visning.
//   3. Maks 40 sekunder.
//   4. Vis handling, ikke replikk. Én god bevegelse slår tre replikker.
//
// To ting i koden under er ikke valgfrie:
//
//   **Låsen går gjennom `settLaast`.** Alt som fryser spillet gjør det ett
//   sted (fallgruve 1). Setter noen `laast` selv, slår fiendene mens eleven
//   ser på en samtale hun ikke kan avbryte.
//
//   **Ryddingen ligger i `finally`.** Letterbox, kamerafølge og tåketetthet
//   henger igjen for alltid hvis eleven hopper over midt i (fallgruve 2), og
//   da står hun med svarte bjelker over skjermen og et kamera som ser på et
//   naust hun har forlatt.

import Phaser from 'phaser';
import type { Klipp, KlippDef, Retning } from '../types';
import { sfx, startMusikk, stopMusikk } from './audio';
import { fraSpill, tilSpill } from './bridge';
import { TILE } from './spriteforge';

/** Hvor lenge en replikk står, når den ikke sier det selv. */
function lesetid(tekst: string): number {
    return Math.max(1500, Math.min(5200, 900 + tekst.length * 48));
}

/**
 * Alt avspilleren trenger å kunne gjøre med verden.
 *
 * Grensesnittet er med vilje smalt. Avspilleren skal ikke kunne skade noen,
 * flytte penger eller starte en kamp - en cutscene som kan endre spilltilstand
 * er en cutscene noen kommer til å legge fagstoff inn i, og det er regel 1.
 */
export interface KlippKontekst {
    scene: Phaser.Scene;
    /** Den ene veien inn og ut av «spillet står stille». */
    laas: (pa: boolean) => void;
    /** Sprite-en til en aktør: `spiller`, eller en NPC-id. */
    aktor: (hvem: string) => Phaser.GameObjects.Sprite | null;
    /** Navnet som står over replikken. */
    navn: (hvem: string) => string;
    /** Vend en figur. Retningen er en ramme, ikke en rotasjon. */
    vend: (hvem: string, retning: Retning) => void;
    /** Kameraet tilbake på eleven. */
    folgSpiller: () => void;
    /** Tåketettheten, for de klippene der været er dramaturgi. */
    taake: (tetthet: number, ms: number) => void;
}

/**
 * Én avspilling. Lever bare så lenge klippet varer, og eier alt som må
 * tilbakestilles etterpå.
 */
class Avspilling {
    private ktx: KlippKontekst;
    private hopper = false;
    /** Løses av et tastetrykk: neste replikk, eller ut av ventingen. */
    private vekk: (() => void) | null = null;
    private avmeldinger: (() => void)[] = [];

    constructor(ktx: KlippKontekst) {
        this.ktx = ktx;
    }

    async spill(def: KlippDef, kanHoppes: boolean): Promise<void> {
        const cam = this.ktx.scene.cameras.main;
        this.ktx.laas(true);
        fraSpill.emit('klipp', { pa: true, kanHoppes });
        this.avmeldinger.push(
            tilSpill.on('klippVidere', () => this.vekk?.()),
            tilSpill.on('klippHoppOver', () => {
                if (!kanHoppes) return;
                this.hopper = true;
                this.vekk?.();
            })
        );

        try {
            for (const steg of def.steg) {
                if (this.hopper) break;
                await this.utfor(steg);
            }
        } finally {
            // Alt som kan stå igjen, tas ned her - også når eleven hoppet over
            // midt i en panorering. Rekkefølgen spiller ingen rolle, men at det
            // skjer gjør det.
            for (const av of this.avmeldinger) av();
            this.avmeldinger = [];
            this.ktx.scene.tweens.killTweensOf(cam);
            cam.panEffect.reset();
            cam.fadeEffect.reset();
            cam.shakeEffect.reset();
            this.ktx.folgSpiller();
            this.ktx.taake(1, 0);
            fraSpill.emit('klippTekst', null);
            fraSpill.emit('klipp', { pa: false, kanHoppes: false });
            this.ktx.laas(false);
        }
    }

    /** Venter, men lar seg avbryte av et tastetrykk eller av «hopp over». */
    private vent(ms: number, avbrytbar = true): Promise<void> {
        if (this.hopper) return Promise.resolve();
        return new Promise((resolve) => {
            let ferdig = false;
            const slutt = () => {
                if (ferdig) return;
                ferdig = true;
                this.vekk = null;
                timer.remove();
                resolve();
            };
            const timer = this.ktx.scene.time.delayedCall(ms, slutt);
            if (avbrytbar) this.vekk = slutt;
        });
    }

    private async utfor(steg: Klipp): Promise<void> {
        const { scene } = this.ktx;
        const cam = scene.cameras.main;

        switch (steg.art) {
            case 'letterbox':
                fraSpill.emit('klipp', { pa: steg.pa, kanHoppes: true });
                return;

            case 'kamera': {
                cam.stopFollow();
                // Ease-navnet må stå i Phasers `EaseMap`, og der heter det
                // `Sine.easeInOut`. `Sine.InOut` er navnet i `Phaser.Math.Easing`
                // og slår ut som «this.ease is not a function» *inne i*
                // kameraets oppdatering - altså i tegneløkka, ikke i vår kode.
                // Da stopper scenen, nedtellingen under fyrer aldri, og
                // cutscenen blir hengende med låsen på.
                cam.pan(steg.til[0] * TILE + 8, steg.til[1] * TILE + 8, steg.ms, 'Sine.easeInOut');
                await this.vent(steg.ms, false);
                return;
            }

            case 'folg': {
                const mal = this.ktx.aktor(steg.hvem);
                if (mal) cam.startFollow(mal, true, 0.12, 0.12);
                return;
            }

            case 'gaa': {
                const sprite = this.ktx.aktor(steg.hvem);
                if (!sprite) return;
                const ms = steg.ms ?? 900;
                // Tweenen flytter sprite-en direkte. Fysikken står stille under
                // låsen, så ingen kropp kjemper imot - og en cutscene som
                // dyttet en Arcade-kropp gjennom et hus ville satt figuren fast
                // på den andre siden.
                await new Promise<void>((resolve) => {
                    scene.tweens.add({
                        targets: sprite,
                        x: steg.til[0] * TILE + 8,
                        y: steg.til[1] * TILE + 8,
                        duration: ms,
                        ease: 'Sine.easeInOut',
                        onUpdate: () => sprite.setDepth(sprite.y),
                        onComplete: () => resolve(),
                    });
                    if (this.hopper) {
                        scene.tweens.killTweensOf(sprite);
                        sprite.setPosition(steg.til[0] * TILE + 8, steg.til[1] * TILE + 8);
                        resolve();
                    }
                });
                return;
            }

            case 'flytt': {
                const sprite = this.ktx.aktor(steg.hvem);
                sprite?.setPosition(steg.til[0] * TILE + 8, steg.til[1] * TILE + 8);
                sprite?.setDepth(steg.til[1] * TILE + 8);
                return;
            }

            case 'vend':
                this.ktx.vend(steg.hvem, steg.retning);
                return;

            case 'si': {
                fraSpill.emit('klippTekst', {
                    hvem: this.ktx.navn(steg.hvem),
                    tekst: steg.tekst,
                });
                await this.vent(steg.ms ?? lesetid(steg.tekst));
                fraSpill.emit('klippTekst', null);
                return;
            }

            case 'tanke': {
                fraSpill.emit('klippTekst', { hvem: null, tekst: steg.tekst });
                await this.vent(steg.ms ?? lesetid(steg.tekst));
                fraSpill.emit('klippTekst', null);
                return;
            }

            case 'vent':
                await this.vent(steg.ms);
                return;

            case 'toning': {
                const [r, g, b] = [
                    ((steg.farge ?? 0) >> 16) & 0xff,
                    ((steg.farge ?? 0) >> 8) & 0xff,
                    (steg.farge ?? 0) & 0xff,
                ];
                if (steg.inn) cam.fadeIn(steg.ms, r, g, b);
                else cam.fadeOut(steg.ms, r, g, b);
                await this.vent(steg.ms, false);
                return;
            }

            case 'ryst':
                cam.shake(steg.ms, steg.styrke);
                await this.vent(steg.ms, false);
                return;

            case 'lyd':
                sfx[steg.navn]();
                return;

            case 'musikk':
                startMusikk(steg.rot, steg.modus ?? 0);
                return;

            case 'stille':
                stopMusikk();
                return;

            case 'taake':
                this.ktx.taake(steg.tetthet, steg.ms);
                await this.vent(steg.ms, false);
                return;

            case 'sett':
                this.ktx.aktor(steg.hvem)?.setVisible(steg.synlig);
                return;
        }
    }
}

/** Spiller ett klipp fra ende til annen. Løses når det er over eller hoppet over. */
export function spillKlipp(
    def: KlippDef,
    ktx: KlippKontekst,
    kanHoppes: boolean
): Promise<void> {
    return new Avspilling(ktx).spill(def, kanHoppes);
}
