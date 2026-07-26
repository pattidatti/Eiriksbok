// Fiendene: hvordan de vandrer, jager, varsler, slår, tar skade og dør.
//
// Systemet eier lista over levende fiender, bossen og spawningen. Det avgjør
// alt som skjer *med* en fiende - men ingenting som skjer med eleven. Når et
// nærkampslag lander, spør det `nerkampTreff` og får vite om slaget gikk
// gjennom garden. Skjold, parade og blokk hører til forsvaret hennes, og skal
// ikke ligge to steder.
//
// Bossen kommer inn som argument (def + hvor mange spørsmål skjoldet består
// av), så laget ikke er bundet til Den store glemselen (blueprint R2).

import Phaser from 'phaser';
import { ENEMIES } from '../../data/enemies';
import { ITEM_BY_ID } from '../../data/items';
import { KAMP } from '../../data/vaapen';
import { maksVerdier, useRpgStore } from '../../store/useRpgStore';
import type { EnemyDef } from '../../types';
import { sfx, startMusikk } from '../audio';
import { fraSpill } from '../bridge';
import type { KampFx } from '../kampfx';
import { FIENDE_RAMMER, TILE } from '../spriteforge';
import type { WorldMap } from '../worldgen';
import type { Effekter } from './effekter';
import type { Fiende, Sprite } from './entiteter';
import type { Loot } from './loot';
import type { Prosjektiler } from './prosjektiler';

/** Hvor lenge et treff kaster fienden bakover før AI-en tar rattet igjen. */
const STOT_MS = 150;
/** Taket på hvor mange som kan være i live samtidig. */
const MAKS_LEVENDE = 14;
const SPAWN_PAUSE_MS = 2600;

export interface FiendeKroker {
    spiller: () => Sprite;
    /**
     * Fienden lander et nærkampslag. Returner `true` hvis slaget gikk gjennom
     * garden, `false` hvis det ble paret eller blokkert.
     */
    nerkampTreff: (fiende: Fiende) => boolean;
    hitstop: (ms: number) => void;
    /** Låser bevegelsen mens bossdysten står åpen. */
    laas: (pa: boolean) => void;
}

export class Fiender {
    private scene: Phaser.Scene;
    private kart: WorldMap;
    private efx: Effekter;
    private fx: KampFx;
    private loot: Loot;
    private skudd: Prosjektiler;
    private kroker: FiendeKroker;
    private bossDef: EnemyDef;
    private bossRunder: number;

    private liste: Fiende[] = [];
    private bossen: Fiende | null = null;
    private bossVakt = false;
    private bossVekket = false;
    private spawnTimer = 0;
    /** Lista ryddes bare når noen faktisk har dødd, ikke hver frame. */
    private maaRydde = false;

    constructor(
        scene: Phaser.Scene,
        kart: WorldMap,
        efx: Effekter,
        fx: KampFx,
        loot: Loot,
        skudd: Prosjektiler,
        bossDef: EnemyDef,
        bossRunder: number,
        kroker: FiendeKroker
    ) {
        this.scene = scene;
        this.kart = kart;
        this.efx = efx;
        this.fx = fx;
        this.loot = loot;
        this.skudd = skudd;
        this.bossDef = bossDef;
        this.bossRunder = bossRunder;
        this.kroker = kroker;
    }

    // ── Oppslag utenfra ─────────────────────────────────────────────────────

    alle(): Fiende[] {
        return this.liste;
    }

    harBoss(): boolean {
        return this.bossen !== null;
    }

    /** Et riktig svar i bossdysten river ned ett skjold. */
    senkBossSkjold(): void {
        if (this.bossen) this.bossen.skjold -= 1;
    }

    /**
     * Bossdysten kan lukkes med Esc eller avbrytes av at eleven dør. Uten at
     * vakten slippes blir bossen stående med skjoldene sine for alltid.
     */
    settBossVakt(pa: boolean): void {
        this.bossVakt = pa;
    }

    // ── Bygging ─────────────────────────────────────────────────────────────

    byggBoss(): void {
        if (useRpgStore.getState().bosser.includes(this.bossDef.id)) return;

        const arena = this.kart.bossArena;
        const sprite = this.scene.physics.add.sprite(
            arena.x,
            arena.y,
            `fiende-${this.bossDef.id}`,
            0
        );
        sprite.setOrigin(0.5, 0.85).setDepth(sprite.y);
        sprite.body!.setSize(24, 16);
        sprite.setImmovable(false);

        this.bossen = {
            sprite,
            def: this.bossDef,
            hp: this.bossDef.hp,
            maksHp: this.bossDef.hp,
            tilstand: 'sover',
            timer: 0,
            frame: 0,
            frameTimer: 0,
            skjold: this.bossRunder,
            dodd: false,
            lemlestet: false,
            collidere: [this.scene.physics.add.collider(sprite, this.scene.data.get('vegger'))],
            stolpe: null,
            stolpeTid: 0,
            onsketTint: null,
        };
        this.liste.push(this.bossen);
    }

    private spawnFiende(def: EnemyDef, x: number, y: number): void {
        const sprite = this.scene.physics.add.sprite(x, y, `fiende-${def.id}`, 0);
        sprite.setOrigin(0.5, 0.85).setDepth(y);
        sprite.body!.setSize(10, 8);
        // Colliderne må tas vare på. Uten dette lå det igjen to per fiende for
        // alltid, og en halvtimes økt lekket over tusen av dem.
        const collidere = [
            this.scene.physics.add.collider(sprite, this.scene.data.get('vegger')),
            this.scene.physics.add.collider(sprite, this.scene.data.get('propKropper')),
        ];

        // Liten «trer fram av tåka»-effekt
        sprite.setAlpha(0).setScale(0.6);
        this.scene.tweens.add({
            targets: sprite,
            alpha: 1,
            scale: 1,
            duration: 320,
            ease: 'Back.Out',
        });

        this.liste.push({
            sprite,
            def,
            hp: def.hp,
            maksHp: def.hp,
            tilstand: 'sover',
            timer: 0,
            frame: 0,
            frameTimer: Math.random() * 200,
            skjold: 0,
            dodd: false,
            lemlestet: false,
            collidere,
            stolpe: null,
            stolpeTid: 0,
            onsketTint: null,
        });
    }

    oppdaterSpawn(delta: number): void {
        this.spawnTimer -= delta;
        if (this.spawnTimer > 0) return;
        this.spawnTimer = SPAWN_PAUSE_MS;

        const levende = this.liste.filter((f) => !f.dodd).length;
        if (levende >= MAKS_LEVENDE) return;

        const spiller = this.kroker.spiller();
        // Bare rundt spilleren, men utenfor synsfeltet - fienden skal komme
        // *til* eleven, ikke poppe opp foran nesa hennes.
        const kandidater = this.kart.spawnRuter.filter(([x, y]) => {
            const d = Phaser.Math.Distance.Between(x * TILE, y * TILE, spiller.x, spiller.y);
            return d > 200 && d < 420;
        });
        if (kandidater.length === 0) return;

        const [tx, ty] = kandidater[Math.floor(Math.random() * kandidater.length)];
        const niva = maksVerdier(useRpgStore.getState()).niva;
        const mulige = ENEMIES.filter((e) => e.kind !== 'boss').slice(
            0,
            Math.min(5, 2 + Math.floor(niva / 2))
        );
        const def = mulige[Math.floor(Math.random() * mulige.length)];
        this.spawnFiende(def, tx * TILE + 8, ty * TILE + 8);
    }

    // ── AI ──────────────────────────────────────────────────────────────────

    oppdater(delta: number): void {
        const spiller = this.kroker.spiller();
        for (const fiende of this.liste) {
            if (fiende.dodd) continue;
            const sprite = fiende.sprite;
            const def = fiende.def;

            // Gangfase
            fiende.frameTimer += delta;
            if (fiende.frameTimer > 200) {
                fiende.frameTimer = 0;
                fiende.frame = (fiende.frame + 1) % FIENDE_RAMMER;
                sprite.setFrame(fiende.frame);
            }

            // Livsstolpen følger fienden og forsvinner av seg selv.
            if (fiende.stolpe) {
                fiende.stolpeTid -= delta;
                if (fiende.stolpeTid <= 0) fiende.stolpe.setVisible(false);
                else
                    fiende.stolpe.setPosition(sprite.x, sprite.y - sprite.displayHeight * 0.85 - 6);
            }

            const avstand = Phaser.Math.Distance.Between(sprite.x, sprite.y, spiller.x, spiller.y);
            fiende.timer -= delta;

            // Bossen er bundet til gravhaugen. Kommer den for langt ut, snur
            // den hjem - eleven skal møte den der, ikke i bygda.
            if (def.kind === 'boss') {
                const arena = this.kart.bossArena;
                const hjem = Phaser.Math.Distance.Between(sprite.x, sprite.y, arena.x, arena.y);
                if (hjem > arena.r) {
                    const v = Math.atan2(arena.y - sprite.y, arena.x - sprite.x);
                    sprite.setVelocity(Math.cos(v) * def.fart, Math.sin(v) * def.fart);
                    fiende.tilstand = 'sover';
                    continue;
                }
            }

            switch (fiende.tilstand) {
                // Truffet: fienden flyr bakover og AI-en holder fingrene av fatet.
                case 'stotet':
                    if (fiende.timer <= 0) {
                        fiende.tilstand = 'jager';
                        sprite.setVelocity(0, 0);
                    }
                    break;

                case 'sover':
                    // Fiendene vandrer rolig rundt i stedet for å stå som statuer.
                    if (fiende.timer <= 0) {
                        fiende.timer = 900 + Math.random() * 1800;
                        if (Math.random() < 0.55) {
                            const v = Math.random() * Math.PI * 2;
                            sprite.setVelocity(
                                Math.cos(v) * def.fart * 0.35,
                                Math.sin(v) * def.fart * 0.35
                            );
                        } else {
                            sprite.setVelocity(0, 0);
                        }
                    }
                    if (avstand < def.aggro) {
                        fiende.tilstand = 'jager';
                        if (def.kind === 'boss' && !this.bossVekket) {
                            this.bossVekket = true;
                            sfx.bossBrol();
                            this.scene.cameras.main.shake(700, 0.008);
                            startMusikk(147, 1);
                        }
                    }
                    break;

                case 'jager': {
                    if (avstand > def.aggro * 1.6) {
                        fiende.tilstand = 'sover';
                        fiende.timer = 0;
                        break;
                    }
                    if (avstand <= def.rekkevidde) {
                        fiende.tilstand = 'varsler';
                        fiende.timer = def.varsel;
                        sprite.setVelocity(0, 0);
                        fiende.onsketTint = 0xffaaaa;
                        this.settTint(fiende);
                        this.telegrafer(fiende);
                        break;
                    }
                    this.jag(fiende, def.fart);
                    break;
                }

                case 'varsler':
                    sprite.setVelocity(0, 0);
                    if (fiende.timer <= 0) {
                        fiende.onsketTint = null;
                        this.settTint(fiende);
                        fiende.tilstand = 'slar';
                        fiende.timer = 120;
                        this.slaar(fiende, avstand);
                    }
                    break;

                case 'slar':
                    if (fiende.timer <= 0) {
                        fiende.tilstand = 'henter-seg';
                        fiende.timer = def.kind === 'boss' ? 700 : 480;
                    }
                    break;

                case 'henter-seg': {
                    // Dempingen må regnes per sekund, ikke per bilde - ellers
                    // oppfører fienden seg ulikt på 30 og 60 bilder i sekundet.
                    const d = Math.pow(0.05, delta / 1000);
                    sprite.setVelocity(sprite.body!.velocity.x * d, sprite.body!.velocity.y * d);
                    if (fiende.timer <= 0) fiende.tilstand = 'jager';
                    break;
                }
            }
        }
        // Bare rydd lista når noen faktisk har dødd. Før ble det allokert en
        // ny array hver eneste frame.
        if (this.maaRydde) {
            this.maaRydde = false;
            this.liste = this.liste.filter((f) => !f.dodd || f.sprite.active);
        }
    }

    /**
     * Går mot spilleren, men glir langs hindringer i stedet for å presse seg
     * inn i dem. Med 130 trær på kartet er «gå rett mot spilleren» ikke et
     * kanttilfelle - det er normaltilstanden.
     */
    private jag(fiende: Fiende, fart: number): void {
        const spiller = this.kroker.spiller();
        const sprite = fiende.sprite;
        const dx = spiller.x - sprite.x;
        const dy = spiller.y - sprite.y;
        const v = Math.atan2(dy, dx);
        let vx = Math.cos(v) * fart;
        let vy = Math.sin(v) * fart;

        // Sto vi nesten stille forrige bilde selv om vi ville fram, er veien sperret.
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.left || body.blocked.right || body.touching.left || body.touching.right) {
            vx = 0;
            vy = Math.sign(dy || 1) * fart;
        } else if (body.blocked.up || body.blocked.down || body.touching.up || body.touching.down) {
            vy = 0;
            vx = Math.sign(dx || 1) * fart;
        }

        // Skyv fra hverandre, så fjorten fiender ikke stabler seg i samme piksel
        // og slår som én.
        let sx = 0;
        let sy = 0;
        for (const annen of this.liste) {
            if (annen === fiende || annen.dodd) continue;
            const ax = sprite.x - annen.sprite.x;
            const ay = sprite.y - annen.sprite.y;
            const d2 = ax * ax + ay * ay;
            if (d2 > 1 && d2 < 18 * 18) {
                const d = Math.sqrt(d2);
                sx += (ax / d) * (18 - d);
                sy += (ay / d) * (18 - d);
            }
        }
        sprite.setVelocity(vx + sx * 3, vy + sy * 3);
    }

    /** Et lite varsel på bakken før fienden slår. */
    private telegrafer(fiende: Fiende): void {
        const merke = this.efx.hent('fx-ring');
        merke.setPosition(fiende.sprite.x, fiende.sprite.y + 2);
        merke
            .setTint(0xff8a6a)
            .setAlpha(0.5)
            .setScale(0.12)
            .setDepth(fiende.sprite.y - 1);
        this.scene.tweens.add({
            targets: merke,
            scale: 0.34,
            alpha: 0,
            duration: fiende.def.varsel,
            onComplete: () => this.efx.slipp(merke),
        });
    }

    private slaar(fiende: Fiende, avstand: number): void {
        const def = fiende.def;
        const spiller = this.kroker.spiller();
        if (def.skytende) {
            this.skudd.skyt({
                x: fiende.sprite.x,
                y: fiende.sprite.y - 6,
                vinkel: Math.atan2(spiller.y - fiende.sprite.y, spiller.x - fiende.sprite.x),
                fart: 150,
                skade: def.skade,
                levetid: 2200,
                tekstur: 'fx-kule',
                farge: def.farge,
                fraFiende: true,
            });
            return;
        }
        // Nærkamp: sjekk at eleven fortsatt er innenfor når slaget lander. Tok
        // garden imot, er det hele - ingen sprut, for ingenting traff henne.
        if (avstand <= def.rekkevidde + 8 && !this.kroker.nerkampTreff(fiende)) return;
        this.efx.pikselSprut(fiende.sprite.x, fiende.sprite.y - 6, def.farge, 5);
    }

    // ── Skade og død ────────────────────────────────────────────────────────

    private settTint(fiende: Fiende): void {
        if (fiende.onsketTint === null) fiende.sprite.clearTint();
        else fiende.sprite.setTint(fiende.onsketTint);
    }

    /** Etter en parade står angriperen bar - kalles av forsvaret hos eleven. */
    stotBort(fiende: Fiende, vinkel: number, fart: number): void {
        fiende.sprite.setVelocity(Math.cos(vinkel) * fart, Math.sin(vinkel) * fart);
        fiende.tilstand = 'stotet';
        fiende.timer = STOT_MS * 3;
        fiende.onsketTint = null;
        this.settTint(fiende);
    }

    skad(fiende: Fiende, skade: number, kritisk: boolean, vinkel: number, kraftFaktor = 1): void {
        // Bossen har skjold som bare kunnskap river ned.
        if (fiende.def.kind === 'boss' && fiende.skjold > 0) {
            this.efx.flytTekst(fiende.sprite.x, fiende.sprite.y - 24, 'Beskyttet!', '#9fb0c8');
            this.scene.cameras.main.shake(60, 0.002);
            sfx.skjold();
            if (!this.bossVakt) this.utfordreBoss();
            return;
        }

        fiende.hp -= skade;
        sfx[kritisk ? 'kritisk' : 'treff']();
        this.fx.klask(fiende.sprite, kritisk ? 0.24 : 0.15);
        this.fx.vipp(fiende.sprite, kritisk ? 12 : 7);
        this.fx.gyt(
            fiende.sprite.x,
            fiende.sprite.y - 4,
            fiende.def.farge,
            kritisk ? 7 : 4,
            vinkel
        );
        if (kritisk) this.fx.nedslag(fiende.sprite.x, fiende.sprite.y - 4, 1.2);

        // Lemlestelse: første gang en fiende går under halvt liv, slås en bit av
        // den - og den slåss videre uten. Det er ikke et nytt tall å holde styr
        // på, det er at eleven ser at motstanden er slitt ned.
        if (!fiende.lemlestet && fiende.hp > 0 && fiende.hp < fiende.maksHp * 0.5) {
            fiende.lemlestet = true;
            sfx.lemlestelse();
            this.fx.lemlest(fiende.sprite.x, fiende.sprite.y - 4, fiende.def.id, 2, vinkel, true);
            this.fx.gyt(fiende.sprite.x, fiende.sprite.y - 4, fiende.def.farge, 8, vinkel, 1.2);
        }
        this.efx.flytTekst(
            fiende.sprite.x + Phaser.Math.Between(-4, 4),
            fiende.sprite.y - 20,
            kritisk ? `${skade}!` : `${skade}`,
            kritisk ? '#ffd166' : '#ffffff',
            kritisk ? 18 : 13
        );
        this.efx.pikselSprut(
            fiende.sprite.x,
            fiende.sprite.y - 8,
            fiende.def.farge,
            kritisk ? 12 : 7
        );

        // Hvitt blink. Timeren setter tilbake den fargen fienden *skal* ha, i
        // stedet for å nulle alt - ellers visker et treff ut varselfargen når
        // fienden lader opp til å slå.
        fiende.sprite.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => {
            if (!fiende.dodd && fiende.sprite.active) this.settTint(fiende);
        });

        if (fiende.hp <= 0) {
            this.drep(fiende, vinkel);
            return;
        }

        // Tilbakestøt. Uten en egen tilstand overskrev AI-en farten allerede
        // neste bilde, og treffet flyttet fienden under to piksler.
        const kraft = (kritisk ? 260 : 170) * kraftFaktor;
        fiende.sprite.setVelocity(Math.cos(vinkel) * kraft, Math.sin(vinkel) * kraft);
        fiende.tilstand = 'stotet';
        fiende.timer = (kritisk ? STOT_MS * 1.6 : STOT_MS) * Math.max(1, kraftFaktor * 0.8);
        fiende.onsketTint = null;
        this.visHelsestolpe(fiende);
    }

    /** Livsstolpen over hodet. Uten den kan ikke eleven se om et slag til holder. */
    private visHelsestolpe(fiende: Fiende): void {
        if (fiende.def.kind === 'boss') return;
        if (!fiende.stolpe) {
            fiende.stolpe = this.scene.add.graphics().setDepth(18000);
        }
        const g = fiende.stolpe;
        const b = 20;
        const andel = Math.max(0, fiende.hp / fiende.maksHp);
        g.clear();
        g.fillStyle(0x120f14, 0.85);
        g.fillRect(-b / 2 - 1, -1, b + 2, 4);
        g.fillStyle(andel > 0.5 ? 0x7ad07a : andel > 0.25 ? 0xe8c96a : 0xe0483f, 1);
        g.fillRect(-b / 2, 0, b * andel, 2);
        g.setVisible(true);
        fiende.stolpeTid = 2600;
    }

    private drep(fiende: Fiende, vinkel = 0): void {
        if (fiende.dodd) return;
        fiende.dodd = true;
        this.maaRydde = true;
        for (const c of fiende.collidere) this.scene.physics.world.removeCollider(c);
        fiende.collidere.length = 0;
        fiende.stolpe?.destroy();
        fiende.stolpe = null;
        sfx.dod();
        this.efx.pikselSprut(fiende.sprite.x, fiende.sprite.y - 8, fiende.def.farge, 20);

        const erBoss = fiende.def.kind === 'boss';
        // Posisjonen låses nå: avslutningen flytter sprite-en, og alt som skal
        // ligge igjen skal ligge der fienden faktisk falt.
        const dx = fiende.sprite.x;
        const dy = fiende.sprite.y;

        // Avslutningen. Et drap skal ikke føles som at en helsestolpe nådde null.
        // Bildet stopper, tiden går sakte et øyeblikk, kameraet får dobbelt kick,
        // og kroppen behandles etter hva den ble drept med.
        this.kroker.hitstop(KAMP.hitstopDrap);
        this.fx.sakteFilm(erBoss ? 320 : 150, erBoss ? 0.3 : 0.4);
        this.fx.dytt(vinkel, erBoss ? 12 : 8, 220);

        // Bare bossen får fullskjermsblink. Et forsøk på å «avmette» bildet med en
        // mørk flash ble prøvd og forkastet: Phasers flash fyller skjermen med
        // fargen på full alpha, så en mørk flash er ikke avmetting - det er et
        // svart blink midt i drapet. Ekte avmetting krever en egen pipeline, og
        // hitstop, saktefilm og gore bærer øyeblikket uten den.
        if (erBoss) {
            this.scene.cameras.main.shake(600, 0.012);
            this.scene.cameras.main.flash(500, 255, 255, 255);
        }

        // Én avslutning per våpenart, og et lik som blir liggende etterpå.
        const art =
            ITEM_BY_ID[useRpgStore.getState().utstyr.vapen ?? 'ovingssverd']?.weapon?.art ?? null;
        this.fx.avslutning(fiende.sprite, fiende.def, art, vinkel, () => {
            fiende.sprite.destroy();
            this.fx.leggLik(dx, dy, fiende.def.id);
        });

        const store = useRpgStore.getState();
        store.giXp(fiende.def.xp);
        this.efx.flytTekst(dx, dy - 30, `+${fiende.def.xp} XP`, '#9ef0c0', 12);

        // Sølv og gjenstander spretter ut i en bue, med én klingende lyd per
        // objekt. Loot som bare dukker opp under fienden er en kvittering; loot
        // som spretter er en utbetaling.
        const solv = Phaser.Math.Between(2, 6) + Math.round(fiende.def.xp / 4);
        let nr = 0;
        this.loot.slipp(dx, dy, null, solv, nr++);
        for (const drop of fiende.def.loot) {
            if (Math.random() < drop.sjanse) {
                this.loot.slipp(dx, dy, drop.itemId, 0, nr++);
            }
        }

        if (erBoss) {
            store.felleBoss(fiende.def.id);
            this.bossen = null;
            this.scene.time.delayedCall(1200, () => fraSpill.emit('seier', {}));
        }
    }

    // ── Bossdysten ──────────────────────────────────────────────────────────

    utfordreBoss(): void {
        if (!this.bossen || this.bossVakt) return;
        this.kroker.laas(true);
        this.bossVakt = true;
        const runde = this.bossRunder - this.bossen.skjold;
        fraSpill.emit('bossSporsmal', {
            runde: Math.max(0, Math.min(this.bossRunder - 1, runde)),
        });
    }

    /** Fiendene må sorteres inn i dybden sammen med alt annet på bakken. */
    oppdaterDybde(): void {
        for (const fiende of this.liste) {
            if (!fiende.dodd) fiende.sprite.setDepth(fiende.sprite.y);
        }
    }
}
