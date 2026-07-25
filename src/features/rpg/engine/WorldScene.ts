// Verden i Nordvik: terreng, folk, fiender og kamp i sanntid.
//
// Scenen eier bevegelse, slag og fiende-AI. Alt som har med tall å gjøre
// (liv, XP, sekk, quester) bor i useRpgStore, og alt som skal *vises* som
// grensesnitt sendes over broen til React. Scenen tegner altså aldri en meny.

import Phaser from 'phaser';
import { ENEMY_BY_ID, ENEMIES } from '../data/enemies';
import { ITEM_BY_ID } from '../data/items';
import {
    NORDVIK_LANDMARKS,
    NORDVIK_NPCS,
    NORDVIK_SPAWN,
    NORDVIK_BOSS_QUESTIONS,
} from '../data/nordvik';
import { SPELL_BY_ID } from '../data/spells';
import { ZONE_BY_ID } from '../data/zones';
import { maksVerdier, useRpgStore } from '../store/useRpgStore';
import type { EnemyDef, QuestDef } from '../types';
import { sfx, startMusikk, stopMusikk } from './audio';
import { fraSpill, tilSpill } from './bridge';
import { numToHex } from './pixels';
import { aktivQuestFor, nesteQuestFor } from './quests';
import { TILE, forgeEffects, forgeEnemy, forgeHumanoid, forgeLootIcons, forgeWeapon, type Dir } from './spriteforge';
import { forgeProps, forgeTiles } from './tileforge';
import { byggNordvik, type WorldMap } from './worldgen';

type Sprite = Phaser.Physics.Arcade.Sprite;

interface Fiende {
    sprite: Sprite;
    def: EnemyDef;
    hp: number;
    tilstand: 'sover' | 'jager' | 'varsler' | 'slar' | 'henter-seg';
    timer: number;
    frame: number;
    frameTimer: number;
    /** Bossen er udødelig til eleven svarer riktig. */
    skjold: number;
    dodd: boolean;
}

interface Prosjektil {
    sprite: Phaser.GameObjects.Image;
    vx: number;
    vy: number;
    skade: number;
    levetid: number;
    fraFiende: boolean;
    piercing: boolean;
    truffet: Set<Fiende>;
}

/** Korteste avstand fra et punkt til et linjestykke - brukt av stråle-besvergelsen. */
function avstandTilLinje(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengde2 = dx * dx + dy * dy;
    if (lengde2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengde2));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

const SPILLER_FART = 96;
const RULL_FART = 260;
const RULL_MS = 260;
const RULL_NEDKJOLING = 620;
const USARBAR_MS = 620;

export class WorldScene extends Phaser.Scene {
    private kart!: WorldMap;
    private spiller!: Sprite;
    private vapenSprite!: Phaser.GameObjects.Image;
    private retning: Dir = 'ned';
    private gangFrame = 0;
    private gangTimer = 0;

    private fiender: Fiende[] = [];
    private prosjektiler: Prosjektil[] = [];
    private npcSprites = new Map<string, Phaser.GameObjects.Sprite>();
    private npcMarkorer = new Map<string, Phaser.GameObjects.Image>();
    private landemerker = new Map<string, Phaser.GameObjects.Image>();
    private loot: { sprite: Phaser.GameObjects.Image; itemId: string | null; solv: number }[] = [];

    private taster!: Record<string, Phaser.Input.Keyboard.Key>;
    private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

    private angrepNedkjoling = 0;
    private rullNedkjoling = 0;
    private rullIgjen = 0;
    private usarbarIgjen = 0;
    private spellNedkjoling = new Map<string, number>();
    private skjoldLadninger = 0;
    private hitstopIgjen = 0;

    private quester: QuestDef[] = [];
    private laast = false;
    private naerInteraksjon: { type: 'npc' | 'landemerke'; id: string } | null = null;
    private bossVakt = false;
    private bossRunde = 0;
    private boss: Fiende | null = null;
    private spawnTimer = 0;
    private avmeldinger: (() => void)[] = [];
    private soneVist = new Set<string>();

    constructor() {
        super('nordvik');
    }

    init(data: { quester: QuestDef[] }) {
        this.quester = data.quester ?? [];
    }

    create() {
        const tema = ZONE_BY_ID.nordvik.tema;
        this.kart = byggNordvik();

        forgeTiles(this, tema);
        forgeProps(this, tema);
        forgeEffects(this);
        forgeLootIcons(this);
        for (const def of ENEMIES) forgeEnemy(this, def);

        this.byggTerreng();
        this.byggKollisjon();
        this.byggProps();
        this.byggSpiller();
        this.byggNpcer();
        this.byggLandemerker();
        this.byggBoss();
        this.settOppInput();
        this.settOppKamera();
        this.lyttPaaUi();

        startMusikk(196, 0);
        this.events.once('shutdown', () => this.rydd());

        fraSpill.emit('sone', { tittel: 'Nordvik', undertittel: 'Vikingtiden · 793–1066' });
    }

    // ── Oppbygging ──────────────────────────────────────────────────────────

    private byggTerreng() {
        const { bredde, hoyde, terreng } = this.kart;
        // Hele bakken tegnes én gang inn i én tekstur. Da koster den ett
        // tegnekall i stedet for tre tusen sprites - viktig på Chromebook.
        const rt = this.add.renderTexture(0, 0, bredde * TILE, hoyde * TILE);
        rt.setOrigin(0, 0).setDepth(-1000);

        const vannRuter: [number, number][] = [];
        for (let y = 0; y < hoyde; y++) {
            for (let x = 0; x < bredde; x++) {
                const flis = terreng[y][x];
                if (flis === 'vann') {
                    vannRuter.push([x, y]);
                    continue;
                }
                rt.drawFrame(`flis-${flis}`, undefined, x * TILE, y * TILE);
            }
        }

        // Vannet får leve - to rammer som veksler rolig.
        this.anims.create({
            key: 'vann-bolge',
            frames: [{ key: 'flis-vann-0' }, { key: 'flis-vann-1' }],
            frameRate: 1.6,
            repeat: -1,
        });
        for (const [x, y] of vannRuter) {
            this.add
                .sprite(x * TILE + TILE / 2, y * TILE + TILE / 2, 'flis-vann-0')
                .setDepth(-999)
                .play({ key: 'vann-bolge', startFrame: (x + y) % 2 });
        }
    }

    /**
     * En usynlig kollisjonsboks. Vi bruker Rectangle og ikke Sprite: en sprite
     * uten tekstur arver Phasers 32x32 «mangler bilde»-ramme, og
     * `updateFromGameObject()` setter da kroppen tilbake til 32x32 uansett hva
     * man ber om. Rectangle har ekte bredde og høyde, så boksen blir riktig.
     */
    private lagBoks(
        gruppe: Phaser.Physics.Arcade.StaticGroup,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        const boks = this.add.rectangle(x, y, w, h);
        boks.setVisible(false);
        this.physics.add.existing(boks, true);
        gruppe.add(boks);
        return boks;
    }

    private byggKollisjon() {
        // Naboruter slås sammen til lange rektangler, så vi får noen hundre
        // kollisjonsbokser i stedet for flere tusen.
        const { bredde, hoyde, blokkert } = this.kart;
        const vegger = this.physics.add.staticGroup();
        for (let y = 0; y < hoyde; y++) {
            let start = -1;
            for (let x = 0; x <= bredde; x++) {
                const solid = x < bredde && blokkert[y][x];
                if (solid && start === -1) start = x;
                if (!solid && start !== -1) {
                    const w = (x - start) * TILE;
                    this.lagBoks(vegger, start * TILE + w / 2, y * TILE + TILE / 2, w, TILE);
                    start = -1;
                }
            }
        }
        this.data.set('vegger', vegger);
    }

    private byggProps() {
        const solide = this.physics.add.staticGroup();
        for (const prop of this.kart.props) {
            const key =
                prop.kind === 'gjerde'
                    ? 'prop-gjerde'
                    : prop.kind === 'kai'
                      ? 'prop-kai'
                      : `prop-${prop.kind}`;
            const bilde = this.add.image(prop.x, prop.y, key);
            // Foten av objektet bestemmer dybden, så spilleren kan gå bak trær.
            bilde.setOrigin(0.5, 0.85);
            bilde.setDepth(prop.y);
            if (prop.kind === 'kai' || prop.kind === 'langskip') bilde.setDepth(-900);
            if (prop.solid && prop.treff) {
                this.lagBoks(solide, prop.x, prop.y + prop.treff.dy, prop.treff.w, prop.treff.h);
            }
        }
        this.data.set('propKropper', solide);

        // Bål på tingplassen
        this.anims.create({
            key: 'baal',
            frames: [{ key: 'prop-baal-0' }, { key: 'prop-baal-1' }, { key: 'prop-baal-2' }],
            frameRate: 8,
            repeat: -1,
        });
    }

    private byggSpiller() {
        const store = useRpgStore.getState();
        const look = this.heltLook();
        forgeHumanoid(this, 'helt', look);

        const [tx, ty] = NORDVIK_SPAWN;
        this.spiller = this.physics.add.sprite(tx * TILE + 8, ty * TILE + 8, 'helt-ned-0');
        this.spiller.setOrigin(0.5, 0.85);
        this.spiller.setDepth(this.spiller.y);
        this.spiller.body!.setSize(9, 7);
        (this.spiller.body as Phaser.Physics.Arcade.Body).setOffset(3.5, 14);
        this.spiller.setCollideWorldBounds(true);

        // Våpenet er sin egen sprite som svinges i en bue.
        const vapenId = store.utstyr.vapen ?? 'ovingssverd';
        const vapen = ITEM_BY_ID[vapenId];
        forgeWeapon(this, vapen?.weapon?.art ?? 'sverd', '#cfd6e0');
        this.vapenSprite = this.add
            .image(this.spiller.x, this.spiller.y, `vapen-${vapen?.weapon?.art ?? 'sverd'}`)
            .setOrigin(0.1, 0.5)
            .setVisible(false);

        this.physics.add.collider(this.spiller, this.data.get('vegger'));
        this.physics.add.collider(this.spiller, this.data.get('propKropper'));
        this.physics.world.setBounds(0, 0, this.kart.bredde * TILE, this.kart.hoyde * TILE);
    }

    private heltLook() {
        const store = useRpgStore.getState();
        const klasseFarge = store.character
            ? {
                  tunic:
                      store.character.classId === 'skald'
                          ? '#8b2f4a'
                          : store.character.classId === 'runemester'
                            ? '#2f4b8b'
                            : '#3c6b4a',
                  trim:
                      store.character.classId === 'skald'
                          ? '#e8c96a'
                          : store.character.classId === 'runemester'
                            ? '#7fd4ff'
                            : '#cfd8c0',
              }
            : { tunic: '#8b2f4a', trim: '#e8c96a' };

        const rustning = store.utstyr.rustning;
        const tier = !rustning
            ? 0
            : rustning === 'vadmelskjortel'
              ? 1
              : rustning === 'lerbrynje'
                ? 2
                : 3;

        return {
            appearance: store.character?.appearance ?? { skin: 0, hair: 0, hairColor: 0, face: 0 },
            tunic: klasseFarge.tunic,
            trim: klasseFarge.trim,
            armorTier: tier,
        };
    }

    /** Tegner helten på nytt når utstyret endrer seg. */
    oppdaterUtseende() {
        forgeHumanoid(this, 'helt', this.heltLook());
        const store = useRpgStore.getState();
        const vapen = ITEM_BY_ID[store.utstyr.vapen ?? 'ovingssverd'];
        const art = vapen?.weapon?.art ?? 'sverd';
        forgeWeapon(this, art, '#cfd6e0');
        this.vapenSprite.setTexture(`vapen-${art}`);
        this.spiller.setTexture(`helt-${this.retning}-0`);
    }

    private byggNpcer() {
        for (const npc of NORDVIK_NPCS) {
            forgeHumanoid(this, `npc-${npc.id}`, {
                appearance: {
                    skin: npc.id.length % 6,
                    hair: (npc.id.charCodeAt(0) + 1) % 6,
                    hairColor: npc.id.charCodeAt(1) % 6,
                    face: 0,
                },
                tunic: npc.palette.tunic,
                trim: npc.palette.trim,
                armorTier: 0,
            });
            const [tx, ty] = npc.tile;
            const sprite = this.add.sprite(tx * TILE + 8, ty * TILE + 8, `npc-${npc.id}-ned-0`);
            sprite.setOrigin(0.5, 0.85).setDepth(sprite.y);
            this.npcSprites.set(npc.id, sprite);

            const markor = this.add.image(sprite.x, sprite.y - 26, 'fx-utrop').setDepth(9000);
            this.tweens.add({
                targets: markor,
                y: markor.y - 3,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut',
            });
            this.npcMarkorer.set(npc.id, markor);
        }
    }

    private byggLandemerker() {
        for (const lm of NORDVIK_LANDMARKS) {
            const [tx, ty] = lm.tile;
            const key =
                lm.kind === 'runestein'
                    ? 'prop-runestein'
                    : lm.kind === 'skilt'
                      ? 'prop-skilt'
                      : lm.kind === 'kiste'
                        ? 'loot-kiste'
                        : 'prop-baal-0';
            const bilde = this.add.image(tx * TILE + 8, ty * TILE + 8, key);
            bilde.setOrigin(0.5, 0.85).setDepth(bilde.y);
            if (lm.kind === 'baal') {
                (bilde as unknown as Phaser.GameObjects.Sprite).destroy();
                const s = this.add.sprite(tx * TILE + 8, ty * TILE + 8, 'prop-baal-0');
                s.setOrigin(0.5, 0.85).setDepth(s.y).play('baal');
                this.landemerker.set(lm.id, s as unknown as Phaser.GameObjects.Image);
                continue;
            }
            this.landemerker.set(lm.id, bilde);
        }
    }

    private byggBoss() {
        const def = ENEMY_BY_ID['den-store-glemselen'];
        const alleredeFelt = useRpgStore.getState().bosser.includes(def.id);
        if (alleredeFelt) return;

        const arena = this.kart.bossArena;
        const sprite = this.physics.add.sprite(arena.x, arena.y, `fiende-${def.id}-0`);
        sprite.setOrigin(0.5, 0.85).setDepth(sprite.y);
        sprite.body!.setSize(24, 16);
        sprite.setImmovable(false);

        this.boss = {
            sprite,
            def,
            hp: def.hp,
            tilstand: 'sover',
            timer: 0,
            frame: 0,
            frameTimer: 0,
            skjold: NORDVIK_BOSS_QUESTIONS.length,
            dodd: false,
        };
        this.fiender.push(this.boss);
        this.physics.add.collider(sprite, this.data.get('vegger'));
    }

    private settOppKamera() {
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.kart.bredde * TILE, this.kart.hoyde * TILE);
        cam.startFollow(this.spiller, true, 0.12, 0.12);
        cam.setDeadzone(40, 30);
        // Zoom tilpasses skjermen, men holdes på hele tall så pikslene forblir skarpe.
        const onsket = Math.max(2, Math.min(4, Math.round(this.scale.width / 420)));
        cam.setZoom(onsket);
        cam.setRoundPixels(true);
        this.scale.on('resize', () => {
            cam.setZoom(Math.max(2, Math.min(4, Math.round(this.scale.width / 420))));
        });
        cam.fadeIn(700, 0, 0, 0);
    }

    private settOppInput() {
        const kb = this.input.keyboard!;
        this.taster = {
            opp: kb.addKey('W'),
            ned: kb.addKey('S'),
            venstre: kb.addKey('A'),
            hoyre: kb.addKey('D'),
            pilOpp: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            pilNed: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            pilVenstre: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            pilHoyre: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            angrep: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            rull: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            bruk: kb.addKey('E'),
            spell1: kb.addKey('ONE'),
            spell2: kb.addKey('TWO'),
            spell3: kb.addKey('THREE'),
            spell4: kb.addKey('FOUR'),
        };
        // Nettleseren skal ikke scrolle når eleven spiller.
        kb.addCapture(['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);

        if (this.input.gamepad) {
            this.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
                this.gamepad = pad;
            });
            this.gamepad = this.input.gamepad.pad1 ?? null;
        }
    }

    private lyttPaaUi() {
        this.avmeldinger.push(
            tilSpill.on('lukk', () => {
                this.laast = false;
            }),
            tilSpill.on('pause', ({ pa }) => {
                this.laast = pa;
                if (pa) this.physics.pause();
                else this.physics.resume();
            }),
            tilSpill.on('svar', ({ questId, riktig }) => {
                this.laast = false;
                const quest = this.quester.find((q) => q.id === questId);
                if (!quest) return;
                useRpgStore.getState().fullforQuest(quest, riktig);
                if (riktig) {
                    sfx.riktig();
                    this.feirRiktigSvar();
                } else {
                    sfx.galt();
                    this.cameras.main.shake(140, 0.004);
                }
                this.oppdaterMarkorer();
            }),
            tilSpill.on('bossSvar', ({ riktig }) => {
                this.laast = false;
                this.bossVakt = false;
                if (!this.boss) return;
                if (riktig) {
                    sfx.riktig();
                    this.boss.skjold -= 1;
                    useRpgStore.getState().varsle('Et skjold brister!', 'bra');
                    this.cameras.main.flash(220, 255, 240, 180);
                    this.feirRiktigSvar();
                    useRpgStore.setState((s) => ({ riktigeSvar: s.riktigeSvar + 1 }));
                } else {
                    sfx.galt();
                    useRpgStore.getState().varsle('Glemselen vokser. Prøv igjen.', 'darlig');
                    this.skadSpiller(12);
                }
            }),
            tilSpill.on('besvergelse', ({ spellId }) => this.kastBesvergelse(spellId)),
            tilSpill.on('gjenoppliv', () => this.gjenoppliv())
        );
    }

    private rydd() {
        stopMusikk();
        for (const av of this.avmeldinger) av();
        this.avmeldinger = [];
    }

    // ── Oppdatering ─────────────────────────────────────────────────────────

    update(_tid: number, delta: number) {
        if (this.hitstopIgjen > 0) {
            this.hitstopIgjen -= delta;
            return;
        }
        this.angrepNedkjoling = Math.max(0, this.angrepNedkjoling - delta);
        this.rullNedkjoling = Math.max(0, this.rullNedkjoling - delta);
        this.rullIgjen = Math.max(0, this.rullIgjen - delta);
        this.usarbarIgjen = Math.max(0, this.usarbarIgjen - delta);
        for (const [id, verdi] of this.spellNedkjoling) {
            this.spellNedkjoling.set(id, Math.max(0, verdi - delta));
        }

        if (!this.laast) {
            this.oppdaterSpiller(delta);
            this.sjekkInteraksjon();
        } else {
            this.spiller.setVelocity(0, 0);
        }

        this.oppdaterFiender(delta);
        this.oppdaterProsjektiler(delta);
        this.oppdaterLoot();
        this.oppdaterDybde();
        this.oppdaterSpawn(delta);
    }

    private oppdaterSpiller(delta: number) {
        const pad = this.gamepad ?? this.input.gamepad?.pad1 ?? null;
        let dx = 0;
        let dy = 0;
        if (this.taster.venstre.isDown || this.taster.pilVenstre.isDown) dx -= 1;
        if (this.taster.hoyre.isDown || this.taster.pilHoyre.isDown) dx += 1;
        if (this.taster.opp.isDown || this.taster.pilOpp.isDown) dy -= 1;
        if (this.taster.ned.isDown || this.taster.pilNed.isDown) dy += 1;
        if (pad) {
            const ax = pad.leftStick.x;
            const ay = pad.leftStick.y;
            if (Math.abs(ax) > 0.25) dx = ax;
            if (Math.abs(ay) > 0.25) dy = ay;
        }

        const ruller = this.rullIgjen > 0;
        if (!ruller) {
            const lengde = Math.hypot(dx, dy) || 1;
            const fart = SPILLER_FART;
            this.spiller.setVelocity((dx / lengde) * fart * (dx || dy ? 1 : 0), (dy / lengde) * fart * (dx || dy ? 1 : 0));

            if (dx !== 0 || dy !== 0) {
                this.retning =
                    Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'venstre' : 'hoyre') : dy < 0 ? 'opp' : 'ned';
                this.gangTimer += delta;
                if (this.gangTimer > 150) {
                    this.gangTimer = 0;
                    this.gangFrame = this.gangFrame === 1 ? 2 : 1;
                }
            } else {
                this.gangFrame = 0;
                this.gangTimer = 0;
            }
            this.spiller.setTexture(`helt-${this.retning}-${this.gangFrame}`);
        }

        // Rull - kort fartsøkning med usårbarhet
        const rullTrykk = Phaser.Input.Keyboard.JustDown(this.taster.rull) || pad?.B;
        if (rullTrykk && this.rullNedkjoling === 0 && (dx !== 0 || dy !== 0)) {
            const lengde = Math.hypot(dx, dy) || 1;
            this.spiller.setVelocity((dx / lengde) * RULL_FART, (dy / lengde) * RULL_FART);
            this.rullIgjen = RULL_MS;
            this.rullNedkjoling = RULL_NEDKJOLING;
            this.usarbarIgjen = Math.max(this.usarbarIgjen, RULL_MS + 60);
            sfx.rull();
            this.tweens.add({
                targets: this.spiller,
                angle: dx < 0 ? -360 : 360,
                duration: RULL_MS,
                onComplete: () => this.spiller.setAngle(0),
            });
            this.stovsky(this.spiller.x, this.spiller.y + 6, 6);
        }

        // Angrep
        const angrepTrykk = Phaser.Input.Keyboard.JustDown(this.taster.angrep) || pad?.A;
        if (angrepTrykk && this.angrepNedkjoling === 0 && !ruller) this.slaa();

        // Besvergelser 1-4
        const spells = useRpgStore.getState().spells;
        const hurtigtaster = [this.taster.spell1, this.taster.spell2, this.taster.spell3, this.taster.spell4];
        hurtigtaster.forEach((tast, i) => {
            if (Phaser.Input.Keyboard.JustDown(tast) && spells[i]) this.kastBesvergelse(spells[i]);
        });
        if (pad && Phaser.Input.Gamepad.Gamepad && pad.X && spells[0]) this.kastBesvergelse(spells[0]);

        // Blink når eleven er usårbar
        this.spiller.setAlpha(this.usarbarIgjen > 0 ? (Math.floor(this.time.now / 70) % 2 ? 0.45 : 1) : 1);
    }

    // ── Kamp ────────────────────────────────────────────────────────────────

    private slaa() {
        const store = useRpgStore.getState();
        const vapen = ITEM_BY_ID[store.utstyr.vapen ?? 'ovingssverd']?.weapon;
        const rekkevidde = vapen?.rekkevidde ?? 30;
        const bue = ((vapen?.bue ?? 100) * Math.PI) / 180;
        const hastighet = vapen?.hastighet ?? 400;
        this.angrepNedkjoling = hastighet;

        const vinkel = this.retningsVinkel();
        sfx.sving();

        // Sving våpenet gjennom buen
        this.vapenSprite.setVisible(true).setDepth(this.spiller.y + 1);
        const start = vinkel - bue / 2;
        const slutt = vinkel + bue / 2;
        this.vapenSprite.setRotation(start);
        this.tweens.add({
            targets: this.vapenSprite,
            rotation: slutt,
            duration: hastighet * 0.45,
            ease: 'Cubic.Out',
            onUpdate: () => {
                const r = this.vapenSprite.rotation;
                this.vapenSprite.setPosition(
                    this.spiller.x + Math.cos(r) * 8,
                    this.spiller.y - 4 + Math.sin(r) * 8
                );
            },
            onComplete: () => this.vapenSprite.setVisible(false),
        });

        // Slagbue-effekt
        const slag = this.add
            .image(this.spiller.x + Math.cos(vinkel) * 14, this.spiller.y - 4 + Math.sin(vinkel) * 14, 'fx-slag')
            .setRotation(vinkel)
            .setDepth(this.spiller.y + 2)
            .setAlpha(0.9)
            .setScale(rekkevidde / 26);
        this.tweens.add({
            targets: slag,
            alpha: 0,
            scale: (rekkevidde / 26) * 1.4,
            duration: 170,
            onComplete: () => slag.destroy(),
        });

        // Hvem traff vi?
        const stats = maksVerdier(store);
        const grunnskade = (vapen?.skade ?? 8) + stats.styrke;
        let traff = false;
        for (const fiende of this.fiender) {
            if (fiende.dodd) continue;
            const dx = fiende.sprite.x - this.spiller.x;
            const dy = fiende.sprite.y - 4 - (this.spiller.y - 4);
            const avstand = Math.hypot(dx, dy);
            if (avstand > rekkevidde + (fiende.def.storrelse ?? 1) * 8) continue;
            const vinkelTil = Math.atan2(dy, dx);
            if (Math.abs(Phaser.Math.Angle.Wrap(vinkelTil - vinkel)) > bue / 2) continue;

            const kritisk = Math.random() < 0.12;
            const skade = Math.round(grunnskade * (kritisk ? 2 : 1) * Phaser.Math.FloatBetween(0.9, 1.15));
            this.skadFiende(fiende, skade, kritisk, vinkelTil);
            traff = true;
        }

        if (traff) {
            // Kort frys gjør at slaget kjennes i hendene.
            this.hitstopIgjen = 55;
            this.cameras.main.shake(90, 0.0035);
        }
    }

    private skadFiende(fiende: Fiende, skade: number, kritisk: boolean, vinkel: number) {
        // Bossen har skjold som bare kunnskap river ned.
        if (fiende.def.kind === 'boss' && fiende.skjold > 0) {
            this.flytTekst(fiende.sprite.x, fiende.sprite.y - 24, 'Beskyttet!', '#9fb0c8');
            this.cameras.main.shake(60, 0.002);
            sfx.skjold();
            if (!this.bossVakt) this.utfordreBoss();
            return;
        }

        fiende.hp -= skade;
        sfx[kritisk ? 'kritisk' : 'treff']();
        this.flytTekst(
            fiende.sprite.x + Phaser.Math.Between(-4, 4),
            fiende.sprite.y - 20,
            kritisk ? `${skade}!` : `${skade}`,
            kritisk ? '#ffd166' : '#ffffff',
            kritisk ? 18 : 13
        );
        this.pikselSprut(fiende.sprite.x, fiende.sprite.y - 8, fiende.def.farge, kritisk ? 12 : 7);

        // Hvitt blink + tilbakestøt
        fiende.sprite.setTintFill(0xffffff);
        this.time.delayedCall(70, () => fiende.sprite.clearTint());
        const kraft = kritisk ? 190 : 120;
        fiende.sprite.setVelocity(Math.cos(vinkel) * kraft, Math.sin(vinkel) * kraft);

        if (fiende.hp <= 0) this.drepFiende(fiende);
        else fiende.tilstand = 'jager';
    }

    private drepFiende(fiende: Fiende) {
        if (fiende.dodd) return;
        fiende.dodd = true;
        sfx.dod();
        this.pikselSprut(fiende.sprite.x, fiende.sprite.y - 8, fiende.def.farge, 20);

        const erBoss = fiende.def.kind === 'boss';
        if (erBoss) {
            this.cameras.main.shake(600, 0.012);
            this.cameras.main.flash(500, 255, 255, 255);
        }

        this.tweens.add({
            targets: fiende.sprite,
            alpha: 0,
            scaleX: 1.4,
            scaleY: 0.6,
            duration: erBoss ? 900 : 260,
            onComplete: () => fiende.sprite.destroy(),
        });

        const store = useRpgStore.getState();
        store.giXp(fiende.def.xp);
        this.flytTekst(fiende.sprite.x, fiende.sprite.y - 30, `+${fiende.def.xp} XP`, '#9ef0c0', 12);

        // Sølv og gjenstander faller på bakken
        const solv = Phaser.Math.Between(2, 6) + Math.round(fiende.def.xp / 4);
        this.slippLoot(fiende.sprite.x, fiende.sprite.y, null, solv);
        for (const drop of fiende.def.loot) {
            if (Math.random() < drop.sjanse) this.slippLoot(fiende.sprite.x, fiende.sprite.y, drop.itemId, 0);
        }

        if (erBoss) {
            store.felleBoss(fiende.def.id);
            this.boss = null;
            this.time.delayedCall(1200, () => fraSpill.emit('seier', {}));
        }
    }

    private skadSpiller(skade: number) {
        if (this.usarbarIgjen > 0) return;
        const store = useRpgStore.getState();

        // Minneskjoldet tar støyten først.
        if (this.skjoldLadninger > 0) {
            this.skjoldLadninger -= 1;
            sfx.skjold();
            this.flytTekst(this.spiller.x, this.spiller.y - 26, 'Skjold!', '#cfd8c0');
            this.usarbarIgjen = 300;
            return;
        }

        const stats = maksVerdier(store);
        const faktisk = Math.max(1, Math.round(skade - stats.vern * 0.6));
        store.endreHp(-faktisk);
        this.usarbarIgjen = USARBAR_MS;
        sfx.skade();
        this.cameras.main.shake(180, 0.007);
        this.cameras.main.flash(120, 180, 20, 20);
        this.flytTekst(this.spiller.x, this.spiller.y - 26, `-${faktisk}`, '#ff8080', 15);

        if (useRpgStore.getState().hp <= 0) this.spillerDor();
    }

    private spillerDor() {
        this.laast = true;
        this.spiller.setVelocity(0, 0);
        stopMusikk();
        this.cameras.main.fade(700, 0, 0, 0, false);
        this.time.delayedCall(750, () => fraSpill.emit('dod', {}));
    }

    private gjenoppliv() {
        const store = useRpgStore.getState();
        store.hvil();
        // Litt sølv går tapt - nok til å svi, ikke nok til å ødelegge.
        const tap = Math.floor(store.solv * 0.15);
        if (tap > 0) useRpgStore.setState({ solv: store.solv - tap });
        const [tx, ty] = NORDVIK_SPAWN;
        this.spiller.setPosition(tx * TILE + 8, ty * TILE + 8);
        this.usarbarIgjen = 1500;
        this.laast = false;
        this.cameras.main.fadeIn(500, 0, 0, 0);
        startMusikk(196, 0);
    }

    // ── Besvergelser ────────────────────────────────────────────────────────

    private kastBesvergelse(spellId: string) {
        const spell = SPELL_BY_ID[spellId];
        if (!spell) return;
        const store = useRpgStore.getState();
        if (!store.spells.includes(spellId)) return;
        if ((this.spellNedkjoling.get(spellId) ?? 0) > 0) {
            store.varsle(`${spell.name} lader fortsatt.`, 'info');
            return;
        }
        if (store.mana < spell.kostnad) {
            store.varsle('Ikke nok kraft.', 'darlig');
            return;
        }
        store.endreMana(-spell.kostnad);
        this.spellNedkjoling.set(spellId, spell.nedkjoling);
        sfx.besvergelse(spell.farge);

        const stats = maksVerdier(store);
        const skade = spell.skade + stats.visdom * 1.5;
        const vinkel = this.retningsVinkel();

        switch (spell.kind) {
            case 'prosjektil': {
                const bilde = this.add
                    .image(this.spiller.x, this.spiller.y - 6, 'fx-kule')
                    .setTint(spell.farge)
                    .setDepth(this.spiller.y + 5);
                this.prosjektiler.push({
                    sprite: bilde,
                    vx: Math.cos(vinkel) * 260,
                    vy: Math.sin(vinkel) * 260,
                    skade,
                    levetid: 1400,
                    fraFiende: false,
                    piercing: false,
                    truffet: new Set(),
                });
                break;
            }
            case 'stråle': {
                // En stråle treffer alt på linja med én gang.
                const lengde = 190;
                const ende = {
                    x: this.spiller.x + Math.cos(vinkel) * lengde,
                    y: this.spiller.y - 6 + Math.sin(vinkel) * lengde,
                };
                const graf = this.add.graphics().setDepth(this.spiller.y + 6);
                graf.lineStyle(4, spell.farge, 0.9);
                graf.lineBetween(this.spiller.x, this.spiller.y - 6, ende.x, ende.y);
                graf.lineStyle(1, 0xffffff, 1);
                graf.lineBetween(this.spiller.x, this.spiller.y - 6, ende.x, ende.y);
                this.tweens.add({ targets: graf, alpha: 0, duration: 260, onComplete: () => graf.destroy() });
                for (const fiende of this.fiender) {
                    if (fiende.dodd) continue;
                    const avstand = avstandTilLinje(
                        fiende.sprite.x,
                        fiende.sprite.y - 6,
                        this.spiller.x,
                        this.spiller.y - 6,
                        ende.x,
                        ende.y
                    );
                    if (avstand < 14) this.skadFiende(fiende, Math.round(skade), false, vinkel);
                }
                this.cameras.main.shake(120, 0.004);
                break;
            }
            case 'nova': {
                const ring = this.add
                    .image(this.spiller.x, this.spiller.y - 6, 'fx-ring')
                    .setTint(spell.farge)
                    .setDepth(this.spiller.y + 6)
                    .setScale(0.2);
                this.tweens.add({
                    targets: ring,
                    scale: 2.6,
                    alpha: 0,
                    duration: 420,
                    ease: 'Cubic.Out',
                    onComplete: () => ring.destroy(),
                });
                const radius = 110;
                for (const fiende of this.fiender) {
                    if (fiende.dodd) continue;
                    const d = Phaser.Math.Distance.Between(
                        this.spiller.x,
                        this.spiller.y,
                        fiende.sprite.x,
                        fiende.sprite.y
                    );
                    if (d < radius) {
                        const v = Math.atan2(fiende.sprite.y - this.spiller.y, fiende.sprite.x - this.spiller.x);
                        this.skadFiende(fiende, Math.round(skade), false, v);
                    }
                }
                this.cameras.main.shake(200, 0.006);
                break;
            }
            case 'skjold': {
                this.skjoldLadninger = 3;
                const ring = this.add
                    .image(this.spiller.x, this.spiller.y - 6, 'fx-ring')
                    .setTint(spell.farge)
                    .setDepth(this.spiller.y - 1)
                    .setScale(0.5)
                    .setAlpha(0.5);
                this.tweens.add({
                    targets: ring,
                    scale: 0.62,
                    alpha: 0.25,
                    duration: 600,
                    yoyo: true,
                    repeat: 12,
                    onComplete: () => ring.destroy(),
                });
                this.time.delayedCall(9000, () => {
                    this.skjoldLadninger = 0;
                    ring.destroy();
                });
                store.varsle('Minneskjoldet holder — tre slag.', 'bra');
                break;
            }
            case 'helbred': {
                store.endreHp(spell.skade);
                this.flytTekst(this.spiller.x, this.spiller.y - 26, `+${spell.skade}`, '#9ef0c0', 15);
                this.pikselSprut(this.spiller.x, this.spiller.y - 8, 0x9ef0c0, 14);
                break;
            }
        }
    }

    // ── Fiender ─────────────────────────────────────────────────────────────

    private oppdaterFiender(delta: number) {
        for (const fiende of this.fiender) {
            if (fiende.dodd) continue;
            const sprite = fiende.sprite;
            const def = fiende.def;

            // Gangfase
            fiende.frameTimer += delta;
            if (fiende.frameTimer > 220) {
                fiende.frameTimer = 0;
                fiende.frame = (fiende.frame + 1) % 3;
                sprite.setTexture(`fiende-${def.id}-${fiende.frame}`);
            }

            const avstand = Phaser.Math.Distance.Between(
                sprite.x,
                sprite.y,
                this.spiller.x,
                this.spiller.y
            );
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
                case 'sover':
                    sprite.setVelocity(0, 0);
                    if (avstand < def.aggro) {
                        fiende.tilstand = 'jager';
                        if (def.kind === 'boss') {
                            sfx.bossBrol();
                            this.cameras.main.shake(700, 0.008);
                            startMusikk(147, 1);
                        }
                    }
                    break;

                case 'jager': {
                    if (avstand > def.aggro * 1.6) {
                        fiende.tilstand = 'sover';
                        break;
                    }
                    if (avstand <= def.rekkevidde) {
                        fiende.tilstand = 'varsler';
                        fiende.timer = def.varsel;
                        sprite.setVelocity(0, 0);
                        sprite.setTint(0xffaaaa);
                        break;
                    }
                    const v = Math.atan2(this.spiller.y - sprite.y, this.spiller.x - sprite.x);
                    sprite.setVelocity(Math.cos(v) * def.fart, Math.sin(v) * def.fart);
                    break;
                }

                case 'varsler':
                    sprite.setVelocity(0, 0);
                    if (fiende.timer <= 0) {
                        sprite.clearTint();
                        fiende.tilstand = 'slar';
                        fiende.timer = 120;
                        this.fiendeSlaar(fiende, avstand);
                    }
                    break;

                case 'slar':
                    if (fiende.timer <= 0) {
                        fiende.tilstand = 'henter-seg';
                        fiende.timer = def.kind === 'boss' ? 700 : 480;
                    }
                    break;

                case 'henter-seg':
                    sprite.setVelocity(sprite.body!.velocity.x * 0.9, sprite.body!.velocity.y * 0.9);
                    if (fiende.timer <= 0) fiende.tilstand = 'jager';
                    break;
            }
        }
        this.fiender = this.fiender.filter((f) => !f.dodd || f.sprite.active);
    }

    private fiendeSlaar(fiende: Fiende, avstand: number) {
        const def = fiende.def;
        if (def.skytende) {
            const v = Math.atan2(this.spiller.y - fiende.sprite.y, this.spiller.x - fiende.sprite.x);
            const bilde = this.add
                .image(fiende.sprite.x, fiende.sprite.y - 6, 'fx-kule')
                .setTint(def.farge)
                .setDepth(fiende.sprite.y + 5);
            this.prosjektiler.push({
                sprite: bilde,
                vx: Math.cos(v) * 150,
                vy: Math.sin(v) * 150,
                skade: def.skade,
                levetid: 2200,
                fraFiende: true,
                piercing: false,
                truffet: new Set(),
            });
            return;
        }
        // Nærkamp: sjekk at eleven fortsatt er innenfor når slaget lander.
        if (avstand <= def.rekkevidde + 8) {
            this.skadSpiller(def.skade);
            const v = Math.atan2(this.spiller.y - fiende.sprite.y, this.spiller.x - fiende.sprite.x);
            this.spiller.setVelocity(Math.cos(v) * 150, Math.sin(v) * 150);
        }
        this.pikselSprut(fiende.sprite.x, fiende.sprite.y - 6, def.farge, 5);
    }

    private oppdaterSpawn(delta: number) {
        this.spawnTimer -= delta;
        if (this.spawnTimer > 0) return;
        this.spawnTimer = 2600;

        const levende = this.fiender.filter((f) => !f.dodd).length;
        if (levende >= 14) return;

        // Bare rundt spilleren, men utenfor synsfeltet - fienden skal komme
        // *til* eleven, ikke poppe opp foran nesa hennes.
        const kandidater = this.kart.spawnRuter.filter(([x, y]) => {
            const d = Phaser.Math.Distance.Between(x * TILE, y * TILE, this.spiller.x, this.spiller.y);
            return d > 200 && d < 420;
        });
        if (kandidater.length === 0) return;

        const [tx, ty] = kandidater[Math.floor(Math.random() * kandidater.length)];
        const niva = maksVerdier(useRpgStore.getState()).niva;
        const mulige = ENEMIES.filter((e) => e.kind !== 'boss').slice(0, Math.min(5, 2 + Math.floor(niva / 2)));
        const def = mulige[Math.floor(Math.random() * mulige.length)];
        this.spawnFiende(def, tx * TILE + 8, ty * TILE + 8);
    }

    private spawnFiende(def: EnemyDef, x: number, y: number) {
        const sprite = this.physics.add.sprite(x, y, `fiende-${def.id}-0`);
        sprite.setOrigin(0.5, 0.85).setDepth(y);
        sprite.body!.setSize(10, 8);
        this.physics.add.collider(sprite, this.data.get('vegger'));
        this.physics.add.collider(sprite, this.data.get('propKropper'));

        // Liten «trer fram av tåka»-effekt
        sprite.setAlpha(0).setScale(0.6);
        this.tweens.add({ targets: sprite, alpha: 1, scale: 1, duration: 320, ease: 'Back.Out' });

        this.fiender.push({
            sprite,
            def,
            hp: def.hp,
            tilstand: 'sover',
            timer: 0,
            frame: 0,
            frameTimer: Math.random() * 200,
            skjold: 0,
            dodd: false,
        });
    }

    // ── Prosjektiler og loot ────────────────────────────────────────────────

    private oppdaterProsjektiler(delta: number) {
        const dt = delta / 1000;
        for (let i = this.prosjektiler.length - 1; i >= 0; i--) {
            const p = this.prosjektiler[i];
            p.sprite.x += p.vx * dt;
            p.sprite.y += p.vy * dt;
            p.sprite.setDepth(p.sprite.y + 5);
            p.levetid -= delta;
            p.sprite.setScale(1 + Math.sin(this.time.now / 60) * 0.12);

            const tx = Math.floor(p.sprite.x / TILE);
            const ty = Math.floor(p.sprite.y / TILE);
            const utenfor =
                tx < 0 || ty < 0 || tx >= this.kart.bredde || ty >= this.kart.hoyde || this.kart.blokkert[ty][tx];

            if (p.fraFiende) {
                if (
                    Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, this.spiller.x, this.spiller.y - 6) < 12
                ) {
                    this.skadSpiller(p.skade);
                    this.pikselSprut(p.sprite.x, p.sprite.y, 0xffffff, 6);
                    p.sprite.destroy();
                    this.prosjektiler.splice(i, 1);
                    continue;
                }
            } else {
                let traff = false;
                for (const fiende of this.fiender) {
                    if (fiende.dodd || p.truffet.has(fiende)) continue;
                    const d = Phaser.Math.Distance.Between(
                        p.sprite.x,
                        p.sprite.y,
                        fiende.sprite.x,
                        fiende.sprite.y - 6
                    );
                    if (d < 12 + (fiende.def.storrelse ?? 1) * 5) {
                        const v = Math.atan2(p.vy, p.vx);
                        this.skadFiende(fiende, Math.round(p.skade), false, v);
                        p.truffet.add(fiende);
                        traff = true;
                        if (!p.piercing) break;
                    }
                }
                if (traff && !p.piercing) {
                    this.pikselSprut(p.sprite.x, p.sprite.y, 0xffffff, 8);
                    p.sprite.destroy();
                    this.prosjektiler.splice(i, 1);
                    continue;
                }
            }

            if (p.levetid <= 0 || utenfor) {
                p.sprite.destroy();
                this.prosjektiler.splice(i, 1);
            }
        }
    }

    private slippLoot(x: number, y: number, itemId: string | null, solv: number) {
        const key = itemId ? (ITEM_BY_ID[itemId]?.slot === 'vapen' ? 'loot-bok' : 'loot-kiste') : 'loot-solv';
        const sprite = this.add.image(x, y, key).setDepth(y);
        // Lite hopp når den faller ut
        this.tweens.add({
            targets: sprite,
            y: y - 10,
            duration: 220,
            yoyo: true,
            ease: 'Quad.Out',
        });
        this.tweens.add({
            targets: sprite,
            scale: 1.12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
        });
        this.loot.push({ sprite, itemId, solv });
    }

    private oppdaterLoot() {
        for (let i = this.loot.length - 1; i >= 0; i--) {
            const l = this.loot[i];
            const d = Phaser.Math.Distance.Between(l.sprite.x, l.sprite.y, this.spiller.x, this.spiller.y);
            // Trekkes mot spilleren når hun er nær - alltid tilfredsstillende.
            if (d < 40) {
                const v = Math.atan2(this.spiller.y - l.sprite.y, this.spiller.x - l.sprite.x);
                l.sprite.x += Math.cos(v) * 3;
                l.sprite.y += Math.sin(v) * 3;
            }
            if (d < 12) {
                const store = useRpgStore.getState();
                if (l.itemId) {
                    store.leggISekk(l.itemId);
                    sfx.plukk();
                } else {
                    store.giSolv(l.solv);
                    sfx.solv();
                    this.flytTekst(l.sprite.x, l.sprite.y - 12, `+${l.solv} sølv`, '#f2edd0', 11);
                }
                l.sprite.destroy();
                this.loot.splice(i, 1);
            }
        }
    }

    // ── Samhandling ─────────────────────────────────────────────────────────

    private sjekkInteraksjon() {
        let naermest: { type: 'npc' | 'landemerke'; id: string; d: number } | null = null;

        for (const [id, sprite] of this.npcSprites) {
            const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.spiller.x, this.spiller.y);
            if (d < 34 && (!naermest || d < naermest.d)) naermest = { type: 'npc', id, d };
        }
        for (const [id, sprite] of this.landemerker) {
            const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.spiller.x, this.spiller.y);
            if (d < 30 && (!naermest || d < naermest.d)) naermest = { type: 'landemerke', id, d };
        }

        const ny = naermest ? { type: naermest.type, id: naermest.id } : null;
        const endret = JSON.stringify(ny) !== JSON.stringify(this.naerInteraksjon);
        if (endret) {
            this.naerInteraksjon = ny;
            if (!ny) {
                fraSpill.emit('hint', { tekst: null });
            } else if (ny.type === 'npc') {
                const npc = NORDVIK_NPCS.find((n) => n.id === ny.id);
                fraSpill.emit('hint', { tekst: `E — snakk med ${npc?.name ?? 'noen'}` });
            } else {
                const lm = NORDVIK_LANDMARKS.find((l) => l.id === ny.id);
                fraSpill.emit('hint', { tekst: `E — ${lm?.kind === 'kiste' ? 'åpne' : 'les'} ${lm?.title}` });
            }
        }

        const pad = this.gamepad ?? this.input.gamepad?.pad1 ?? null;
        const brukTrykk = Phaser.Input.Keyboard.JustDown(this.taster.bruk) || pad?.Y;
        if (brukTrykk && this.naerInteraksjon) {
            this.laast = true;
            this.spiller.setVelocity(0, 0);
            sfx.dialog();
            if (this.naerInteraksjon.type === 'npc') {
                fraSpill.emit('dialog', { npcId: this.naerInteraksjon.id });
            } else {
                fraSpill.emit('landmark', { landmarkId: this.naerInteraksjon.id });
            }
            fraSpill.emit('hint', { tekst: null });
        }
    }

    private utfordreBoss() {
        if (!this.boss || this.bossVakt) return;
        this.bossVakt = true;
        this.laast = true;
        this.spiller.setVelocity(0, 0);
        const runde = NORDVIK_BOSS_QUESTIONS.length - this.boss.skjold;
        this.bossRunde = Math.max(0, Math.min(NORDVIK_BOSS_QUESTIONS.length - 1, runde));
        fraSpill.emit('bossSporsmal', { runde: this.bossRunde });
    }

    /** Oppdaterer utropstegnene over NPC-ene. */
    oppdaterMarkorer() {
        const status = useRpgStore.getState().quester;
        for (const [id, markor] of this.npcMarkorer) {
            const ny = nesteQuestFor(id, this.quester, status);
            const aktiv = aktivQuestFor(id, this.quester, status);
            markor.setVisible(Boolean(ny || aktiv));
            markor.setTexture(aktiv ? 'fx-sporsmal' : 'fx-utrop');
        }
    }

    // ── Småting som gjør det digg ───────────────────────────────────────────

    private retningsVinkel(): number {
        switch (this.retning) {
            case 'venstre':
                return Math.PI;
            case 'hoyre':
                return 0;
            case 'opp':
                return -Math.PI / 2;
            default:
                return Math.PI / 2;
        }
    }

    private flytTekst(x: number, y: number, tekst: string, farge: string, storrelse = 13) {
        const t = this.add
            .text(x, y, tekst, {
                fontFamily: 'Outfit, Inter, sans-serif',
                fontSize: `${storrelse}px`,
                color: farge,
                stroke: '#12100e',
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(20000);
        this.tweens.add({
            targets: t,
            y: y - 22,
            alpha: 0,
            duration: 720,
            ease: 'Quad.Out',
            onComplete: () => t.destroy(),
        });
    }

    private pikselSprut(x: number, y: number, farge: number, antall: number) {
        for (let i = 0; i < antall; i++) {
            const bit = this.add.image(x, y, 'fx-bit').setTint(farge).setDepth(19000);
            const v = Math.random() * Math.PI * 2;
            const fart = 20 + Math.random() * 46;
            this.tweens.add({
                targets: bit,
                x: x + Math.cos(v) * fart,
                y: y + Math.sin(v) * fart,
                alpha: 0,
                scale: 0.3,
                duration: 260 + Math.random() * 220,
                ease: 'Quad.Out',
                onComplete: () => bit.destroy(),
            });
        }
    }

    private stovsky(x: number, y: number, antall: number) {
        for (let i = 0; i < antall; i++) {
            const p = this.add.image(x, y, 'fx-prikk').setTint(0xd8c89a).setDepth(y - 1).setAlpha(0.7);
            const v = Math.random() * Math.PI * 2;
            this.tweens.add({
                targets: p,
                x: x + Math.cos(v) * 14,
                y: y + Math.sin(v) * 7,
                alpha: 0,
                scale: 1.8,
                duration: 380,
                onComplete: () => p.destroy(),
            });
        }
    }

    private feirRiktigSvar() {
        // Et lite lysglimt rundt spilleren når kunnskapen treffer.
        const ring = this.add
            .image(this.spiller.x, this.spiller.y - 6, 'fx-ring')
            .setTint(0xfff1a8)
            .setDepth(this.spiller.y + 8)
            .setScale(0.2);
        this.tweens.add({
            targets: ring,
            scale: 1.8,
            alpha: 0,
            duration: 520,
            ease: 'Cubic.Out',
            onComplete: () => ring.destroy(),
        });
        this.pikselSprut(this.spiller.x, this.spiller.y - 10, 0xfff1a8, 16);
        this.cameras.main.flash(160, 255, 250, 200);
    }

    private oppdaterDybde() {
        this.spiller.setDepth(this.spiller.y);
        for (const fiende of this.fiender) {
            if (!fiende.dodd) fiende.sprite.setDepth(fiende.sprite.y);
        }
        for (const [, sprite] of this.npcSprites) sprite.setDepth(sprite.y);
    }

    /** Kalles fra React når eleven har lest et landemerke. */
    markerSoneVist(id: string) {
        this.soneVist.add(id);
    }

    /** Fargen på en fiende, brukt av grensesnittet. */
    static fiendeFarge(def: EnemyDef): string {
        return numToHex(def.farge);
    }
}
