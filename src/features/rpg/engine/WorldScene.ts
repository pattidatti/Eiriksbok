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
import { KAMP, MANOVER_NAVN, vaapenKamp } from '../data/vaapen';
import { ZONE_BY_ID } from '../data/zones';
import { maksVerdier, useRpgStore } from '../store/useRpgStore';
import type { EnemyDef, QuestDef } from '../types';
import { sfx, startMusikk, stopMusikk } from './audio';
import { fraSpill, tilSpill } from './bridge';
import { Kamp } from './kamp';
import { KampFx } from './kampfx';
import { numToHex } from './pixels';
import {
    FIG_ORIGIN_Y,
    POSITUR_LENGDE,
    SKJOLD_RAMMER,
    TILE,
    forgeEffects,
    forgeEnemy,
    forgeHumanoid,
    forgeLootIcons,
    forgeSkjold,
    forgeTallfont,
    forgeWeapon,
    heltFrame,
    type Dir,
    type Positur,
} from './spriteforge';
import { forgeProps, forgeTiles } from './tileforge';
import { Effekter } from './systems/effekter';
import type { Fiende, Sprite } from './systems/entiteter';
import { Fiender } from './systems/fiender';
import { Interaksjon } from './systems/interaksjon';
import { Loot } from './systems/loot';
import { Prosjektiler } from './systems/prosjektiler';
import { Verden } from './systems/verden';
import { byggNordvik, type WorldMap } from './worldgen';

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
/** Hvor lenge et treff kaster fienden bakover før AI-en tar rattet igjen. */
const STOT_MS = 150;
/** Trykker eleven angrep like før nedkjølingen er ute, huskes trykket så lenge. */
const INPUT_BUFFER_MS = 130;

export class WorldScene extends Phaser.Scene {
    private kart!: WorldMap;
    private spiller!: Sprite;
    private vapenSprite!: Phaser.GameObjects.Image;
    /** Skjoldet er eget lag, så slitasjen synes uten å smi helten på nytt. */
    private skjoldSprite!: Phaser.GameObjects.Image;
    /** Pust, gard, parade, skjoldslitasje og kombo. All logikk ligger i kamp.ts. */
    private kamp = new Kamp();
    /** Hvor lenge garden vises i «presset» ramme etter at noe traff skjoldet. */
    private gardPress = 0;
    /** Kamptilstanden sendes til HUD-en et titalls ganger i sekundet, ikke 60. */
    private kampUiTimer = 0;
    private retning: Dir = 'ned';
    /** Hvilken animasjon helten spiller, og hvor langt hun er kommet i den. */
    private positur: Positur = 'idle';
    private posFase = 0;
    private posTimer = 0;
    private forrigeFrame = -1;
    private utseendeSignatur = '';
    private slagIgjen = 0;
    private slagVarighet = 400;

    private fiendeSystem!: Fiender;
    /** Alt som flyr: piler, kastespyd, besvergelser. */
    private skudd!: Prosjektiler;
    private samhandling!: Interaksjon;
    /** Sølv og gjenstander som ligger på bakken. */
    private lootSystem!: Loot;
    /** Partikler, flytende tall og glimt. Kjenner ingen spillregler. */
    private efx = new Effekter(this);
    /** Bakken, kollisjonen, objektene og atmosfæren. Kjenner ingen spillregler. */
    private verden!: Verden;
    private kompassTimer = 0;
    private kompassAktivt = false;

    private taster!: Record<string, Phaser.Input.Keyboard.Key>;
    private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

    private angrepNedkjoling = 0;
    private rullNedkjoling = 0;
    private rullIgjen = 0;
    private usarbarIgjen = 0;
    private stotIgjen = 0;
    private angrepBuffer = 0;
    private spellNedkjoling = new Map<string, number>();
    private skjoldLadninger = 0;
    private skjoldTimer: Phaser.Time.TimerEvent | null = null;
    private skjoldRing: Phaser.GameObjects.Image | null = null;
    private hitstopIgjen = 0;
    /** Kamerastøt, blod, løsdeler, lik, saktefilm og avslutninger. */
    private fx = new KampFx(this);
    /** Utfallet i slaget: figuren bæres framover i trefframmen. */
    private utfallIgjen = 0;
    /** Hjerteslaget når livet er lavt. */
    private hjerteTimer = 0;
    /** Nivået sist vi sjekket, så vi kan feire når det stiger. */
    private sisteNiva = 0;
    /** Er eleven i kamp? Styrer hvor tett kameraet følger. */
    private iKamp = false;
    /** Forrige bildes knappetilstand, så håndkontrolleren får ekte trykk-kant. */
    private padForrige = { A: false, B: false, X: false, Y: false };

    private quester: QuestDef[] = [];
    private laast = false;
    private avmeldinger: (() => void)[] = [];
    /** Styrestikke på skjerm (nettbrett). Settes fra React over broen. */
    private touchAkse = { x: 0, y: 0 };
    /** Knappetrykk fra skjermkontrollen, tømmes når de er lest. */
    private touchTrykk = new Set<'angrep' | 'rull' | 'bruk' | 'gard'>();
    /**
     * Garden er en veksling på berøringsskjerm, ikke et hold: tommelen kan ikke
     * holde og trykke samtidig. Og fordi paraden *er* reisningen, blir trykket på
     * nettbrett nøyaktig samme ferdighet som tastetrykket.
     */
    private touchGard = false;

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
        forgeSkjold(this);
        forgeTallfont(this);
        forgeLootIcons(this);
        for (const def of ENEMIES) forgeEnemy(this, def);

        this.verden = new Verden(this, this.kart, tema);
        this.lootSystem = new Loot(this, this.efx, () => this.spiller);
        this.skudd = new Prosjektiler(this, this.efx, this.kart, {
            spiller: () => this.spiller,
            fiender: () => this.fiendeSystem.alle(),
            skadSpiller: (skade) => this.skadSpiller(skade),
            skadFiende: (f, skade, kritisk, vinkel) =>
                this.fiendeSystem.skad(f, skade, kritisk, vinkel),
        });
        this.fiendeSystem = new Fiender(
            this,
            this.kart,
            this.efx,
            this.fx,
            this.lootSystem,
            this.skudd,
            ENEMY_BY_ID['den-store-glemselen'],
            NORDVIK_BOSS_QUESTIONS.length,
            {
                spiller: () => this.spiller,
                nerkampTreff: (fiende) => this.nerkampTreff(fiende),
                hitstop: (ms) => this.hitstop(ms),
                laas: (pa) => this.settLaast(pa),
            }
        );
        this.samhandling = new Interaksjon(this, NORDVIK_NPCS, NORDVIK_LANDMARKS, {
            spiller: () => this.spiller,
            laas: (pa) => this.settLaast(pa),
            quester: () => this.quester,
        });
        this.verden.byggTerreng();
        this.verden.byggKollisjon();
        this.verden.byggProps();
        this.byggSpiller();
        this.samhandling.bygg();
        this.fiendeSystem.byggBoss();
        this.verden.byggAtmosfare(NORDVIK_LANDMARKS);
        this.settOppInput();
        this.settOppKamera();
        this.lyttPaaUi();

        startMusikk(196, 0);
        this.events.once('shutdown', () => this.rydd());

        fraSpill.emit('sone', { tittel: 'Nordvik', undertittel: 'Vikingtiden · 793-1066' });
    }

    private byggSpiller() {
        const store = useRpgStore.getState();
        const look = this.heltLook();
        forgeHumanoid(this, 'helt', look);

        const [tx, ty] = NORDVIK_SPAWN;
        this.spiller = this.physics.add.sprite(
            tx * TILE + 8,
            ty * TILE + 8,
            'helt',
            heltFrame('ned', 'idle', 0)
        );
        this.spiller.setOrigin(0.5, FIG_ORIGIN_Y);
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

        this.skjoldSprite = this.add
            .image(this.spiller.x, this.spiller.y, 'skjold', 0)
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

    /**
     * Tegner helten på nytt når utstyret endrer seg. Å smi 48 rammer på nytt
     * gir et lite hakk, så vi hopper over det når ingenting faktisk er endret.
     */
    oppdaterUtseende() {
        const look = this.heltLook();
        const store = useRpgStore.getState();
        const art = ITEM_BY_ID[store.utstyr.vapen ?? 'ovingssverd']?.weapon?.art ?? 'sverd';
        const signatur = `${JSON.stringify(look)}|${art}`;
        if (signatur === this.utseendeSignatur) return;
        this.utseendeSignatur = signatur;

        forgeHumanoid(this, 'helt', look);
        forgeWeapon(this, art, '#cfd6e0');
        this.vapenSprite.setTexture(`vapen-${art}`);
        this.forrigeFrame = -1;
    }

    /**
     * Setter rett ramme på helten. Dette er hele animasjonssystemet: hvilken
     * positur som spilles avgjøres av hva hun holder på med, og rammen byttes
     * bare når den faktisk endrer seg.
     */
    private oppdaterHeltRamme(delta: number, gaar: boolean) {
        let positur: Positur;
        let fart: number;
        if (this.rullIgjen > 0) {
            positur = 'rull';
            fart = RULL_MS / POSITUR_LENGDE.rull;
        } else if (this.slagIgjen > 0) {
            positur = 'slag';
            fart = this.slagVarighet / POSITUR_LENGDE.slag;
        } else if (this.kamp.gardOppe) {
            // Garden står stille i ramma. Den andre ramma er skjoldet presset, og
            // den settes eksplisitt nedenfor - ikke av en animasjonsklokke.
            positur = 'gard';
            fart = Number.POSITIVE_INFINITY;
        } else if (gaar) {
            positur = 'gang';
            fart = 120;
        } else {
            positur = 'idle';
            fart = 620;
        }

        if (positur !== this.positur) {
            this.positur = positur;
            this.posFase = 0;
            this.posTimer = 0;
        } else {
            this.posTimer += delta;
            while (this.posTimer >= fart) {
                this.posTimer -= fart;
                // Slaget skal ikke gå i sirkel - det stopper på siste ramme.
                if (positur === 'slag' || positur === 'rull') {
                    this.posFase = Math.min(POSITUR_LENGDE[positur] - 1, this.posFase + 1);
                } else {
                    this.posFase = (this.posFase + 1) % POSITUR_LENGDE[positur];
                }
            }
        }

        if (positur === 'gard') this.posFase = this.gardPress > 0 ? 1 : 0;

        const frame = heltFrame(this.retning, this.positur, this.posFase);
        if (frame !== this.forrigeFrame) {
            this.forrigeFrame = frame;
            this.spiller.setFrame(frame);
        }
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

    /**
     * Én vei inn og ut av «spillet står stille». Tidligere satte flere steder
     * bare `laast`, uten å pause fysikken - da fortsatte fiendene å slå mens
     * eleven leste et spørsmål, og hun kunne dø midt i en fagforklaring.
     * Nå går alt gjennom denne, så låsing og fysikkpause aldri kan komme i utakt.
     */
    private settLaast(pa: boolean) {
        if (this.laast === pa) return;
        this.laast = pa;
        if (pa) {
            this.spiller.setVelocity(0, 0);
            this.physics.pause();
        } else {
            // En hit-stop kan ha vært i gang da overlegget åpnet seg.
            this.hitstopIgjen = 0;
            this.tweens.resumeAll();
            this.physics.resume();
            // Bossquizen kan ha blitt lukket med Esc eller avbrutt av at eleven
            // døde. Uten dette blir bossen stående med skjoldene sine for alltid.
            this.fiendeSystem.settBossVakt(false);
        }
    }

    private lyttPaaUi() {
        this.avmeldinger.push(
            tilSpill.on('lukk', () => this.settLaast(false)),
            tilSpill.on('pause', ({ pa }) => this.settLaast(pa)),
            tilSpill.on('styring', ({ x, y }) => {
                this.touchAkse.x = x;
                this.touchAkse.y = y;
            }),
            tilSpill.on('knapp', ({ navn }) => {
                // Garden veksles, resten er trykk som leses og tømmes samme bilde.
                if (navn === 'gard') this.touchGard = !this.touchGard;
                else this.touchTrykk.add(navn);
            }),
            tilSpill.on('svar', ({ questId, riktig }) => {
                this.settLaast(false);
                const quest = this.quester.find((q) => q.id === questId);
                if (!quest) return;
                useRpgStore.getState().fullforQuest(quest, riktig);
                if (riktig) {
                    sfx.riktig();
                    this.efx.lysglimt(this.spiller.x, this.spiller.y);
                } else {
                    sfx.galt();
                    this.cameras.main.shake(140, 0.004);
                }
                this.oppdaterMarkorer();
            }),
            tilSpill.on('bossSvar', ({ riktig }) => {
                this.settLaast(false);
                if (!this.fiendeSystem.harBoss()) return;
                if (riktig) {
                    sfx.riktig();
                    this.fiendeSystem.senkBossSkjold();
                    useRpgStore.getState().varsle('Et skjold brister!', 'bra');
                    this.cameras.main.flash(220, 255, 240, 180);
                    this.efx.lysglimt(this.spiller.x, this.spiller.y);
                    useRpgStore.setState((s) => ({ riktigeSvar: s.riktigeSvar + 1 }));
                } else {
                    sfx.galt();
                    useRpgStore.getState().varsle('Glemselen vokser. Prøv igjen.', 'darlig');
                    this.skadSpiller(18, true);
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
        // Kamerastøtet kan stå midt i en tween, og blod, biter og lik er egne
        // bilder som må ryddes.
        this.fx.vask();
    }

    // ── Oppdatering ─────────────────────────────────────────────────────────

    update(_tid: number, delta: number) {
        // Saktefilmen telles ned først av alt, før enhver tidlig retur. Lå den
        // etter hitstop- eller lås-returen, kunne den henge igjen for alltid hvis
        // eleven åpnet en dialog i drapsøyeblikket - og da ville hele spillet gå
        // i sirup uten at noen skjønte hvorfor.
        this.fx.tikk(delta);

        // Ekte hit-stop: hele verden fryser, ikke bare AI-en. Fysikk og tweens
        // må pauses eksplisitt, ellers glir alt videre og det føles som lagg.
        if (this.hitstopIgjen > 0) {
            this.hitstopIgjen -= delta;
            if (this.hitstopIgjen <= 0 && !this.laast) {
                this.physics.resume();
                this.tweens.resumeAll();
            }
            return;
        }

        if (this.laast) {
            // Alt står stille mens eleven leser. Ingen fiender, ingen
            // prosjektiler, ingen nye spawner.
            this.spiller.setVelocity(0, 0);
            return;
        }

        // Saktefilmen etter et drap. KampFx skalerer fysikken og tweenene; alt vi
        // teller selv må skaleres her. Nedtellingen skjedde øverst i metoden, med
        // ekte delta - blir den skalert, tar saktefilmen aldri slutt.
        const dt = delta * this.fx.tidsfaktor;

        this.angrepNedkjoling = Math.max(0, this.angrepNedkjoling - dt);
        this.rullNedkjoling = Math.max(0, this.rullNedkjoling - dt);
        this.rullIgjen = Math.max(0, this.rullIgjen - dt);
        this.usarbarIgjen = Math.max(0, this.usarbarIgjen - dt);
        this.stotIgjen = Math.max(0, this.stotIgjen - dt);
        this.utfallIgjen = Math.max(0, this.utfallIgjen - dt);
        this.slagIgjen = Math.max(0, this.slagIgjen - dt);
        this.angrepBuffer = Math.max(0, this.angrepBuffer - dt);
        for (const [id, verdi] of this.spellNedkjoling) {
            if (verdi > 0) this.spellNedkjoling.set(id, Math.max(0, verdi - dt));
        }

        this.oppdaterSpiller(dt);
        // Hvilken tast som er «bruk» bor hos scenen; samhandlingen får bare vite
        // at den ble trykket. `padKant` må kalles hver frame - den husker forrige
        // tilstand for å skille et trykk fra en knapp som holdes.
        this.samhandling.sjekk(
            Phaser.Input.Keyboard.JustDown(this.taster.bruk) ||
                this.padKant(this.gamepad ?? this.input.gamepad?.pad1 ?? null, 'Y') ||
                this.touchTrykk.has('bruk')
        );
        this.fiendeSystem.oppdater(dt);
        this.skudd.oppdater(dt);
        this.lootSystem.oppdater(dt);
        this.oppdaterDybde();
        this.fiendeSystem.oppdaterSpawn(dt);
        this.verden.oppdaterAtmosfare(dt);
        this.oppdaterKompass(dt);
        // HUD-en og hjerteslaget skal gå i vanlig tid, ikke i saktefilm.
        this.oppdaterKampUi(delta);
        // Skjermknappene leses én gang per bilde og tømmes så.
        this.touchTrykk.clear();
    }

    /**
     * Kamptilstanden til HUD-en. Pusten endrer seg hvert bilde, men React trenger
     * den ikke oftere enn øyet ser - 11 ganger i sekundet holder, og da slipper vi
     * en gjentegning per bilde.
     */
    private oppdaterKampUi(delta: number) {
        this.hjerteTimer -= delta;
        this.kampUiTimer -= delta;
        if (this.kampUiTimer > 0) return;
        this.kampUiTimer = 90;
        fraSpill.emit('kamp', this.kamp.snapshot());

        const store = useRpgStore.getState();
        const maks = maksVerdier(store);

        // ── Rommet snevres inn når det gjelder ──────────────────────────────
        // Zoomen holdes på hele tall, ellers blir pikslene ujevne (se
        // settOppKamera). Vi strammer i stedet dødsonen: kameraet klistrer seg
        // til eleven i kamp og slipper henne løs igjen etterpå. Samme følelse,
        // uten å ofre skarpheten.
        const iKampNa = this.fiendeSystem
            .alle()
            .some(
                (f) =>
                    !f.dodd &&
                    f.tilstand !== 'sover' &&
                    Phaser.Math.Distance.Between(
                        f.sprite.x,
                        f.sprite.y,
                        this.spiller.x,
                        this.spiller.y
                    ) < 220
            );
        if (iKampNa !== this.iKamp) {
            this.iKamp = iKampNa;
            this.cameras.main.setDeadzone(iKampNa ? 14 : 40, iKampNa ? 10 : 30);
        }

        // ── Hjerteslag under 30 % liv ───────────────────────────────────────
        // Eleven skal kjenne at det står dårlig til før hun rekker å lese
        // tallet. Blodkanten i HUD-en pulserer i samme takt.
        if (this.hjerteTimer <= 0 && store.hp > 0 && store.hp / maks.hp < 0.3) {
            this.hjerteTimer = 980;
            sfx.hjerteslag();
        }

        // ── Nivåstigning ────────────────────────────────────────────────────
        if (this.sisteNiva === 0) this.sisteNiva = maks.niva;
        else if (maks.niva > this.sisteNiva) {
            this.sisteNiva = maks.niva;
            this.hitstop(220);
            this.cameras.main.flash(260, 255, 250, 220);
            sfx.horn();
            this.efx.flytTekst(
                this.spiller.x,
                this.spiller.y - 34,
                `NIVÅ ${maks.niva}`,
                '#ffe9a8',
                15
            );
            this.efx.pikselSprut(this.spiller.x, this.spiller.y - 10, 0xffe9a8, 22);
        }
    }

    /**
     * Peker mot der svaret på det aktive oppdraget står. Sendes til HUD-en et
     * par ganger i sekundet - dette trenger ikke skje 60 ganger.
     */
    private oppdaterKompass(delta: number) {
        this.kompassTimer -= delta;
        if (this.kompassTimer > 0) return;
        this.kompassTimer = 260;

        const status = useRpgStore.getState().quester;
        const aktiv = this.quester.find((q) => status[q.id] === 'aktiv' && q.kilde);
        const kilde = aktiv?.kilde;
        if (!kilde) {
            if (this.kompassAktivt) {
                this.kompassAktivt = false;
                fraSpill.emit('kompass', null);
            }
            return;
        }

        const mal = this.samhandling.mal(kilde.type, kilde.id);
        if (!mal) return;
        this.kompassAktivt = true;
        fraSpill.emit('kompass', {
            vinkel: (Math.atan2(mal.y - this.spiller.y, mal.x - this.spiller.x) * 180) / Math.PI,
            avstand: Phaser.Math.Distance.Between(this.spiller.x, this.spiller.y, mal.x, mal.y),
            navn: mal.navn ?? kilde.navn,
        });
    }

    /** Fryser bildet et lite øyeblikk så slaget kjennes i hendene. */
    private hitstop(ms: number) {
        this.hitstopIgjen = ms;
        this.physics.pause();
        this.tweens.pauseAll();
    }

    /**
     * Håndkontrolleren leverer «holdt inne», ikke «trykket nå». Uten en egen
     * kant-deteksjon her ville det å holde A gitt automatisk angrep.
     */
    private padKant(
        pad: Phaser.Input.Gamepad.Gamepad | null,
        knapp: 'A' | 'B' | 'X' | 'Y'
    ): boolean {
        const na = Boolean(pad?.[knapp]);
        const ny = na && !this.padForrige[knapp];
        this.padForrige[knapp] = na;
        return ny;
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
            if (Math.hypot(ax, ay) > 0.25) {
                dx = ax;
                dy = ay;
            }
        }
        if (this.touchAkse.x !== 0 || this.touchAkse.y !== 0) {
            dx = this.touchAkse.x;
            dy = this.touchAkse.y;
        }

        // Lengden på utslaget styrer farten, så en stikke som er halvveis ute
        // gir halv fart. Tastatur gir alltid 1.
        const utslag = Math.min(1, Math.hypot(dx, dy));
        const enhet =
            utslag > 0.001
                ? { x: dx / Math.hypot(dx, dy), y: dy / Math.hypot(dx, dy) }
                : { x: 0, y: 0 };

        const ruller = this.rullIgjen > 0;
        const touch = this.touchTrykk;

        // ── Garden ──────────────────────────────────────────────────────────
        // Shift i ro reiser skjoldet, Shift i bevegelse ruller. De to kan dele
        // tast fordi rullen alltid har krevd bevegelse - da er det aldri
        // tvetydig hva eleven mente. Holder hun Shift gjennom rullen, reiser
        // garden seg i det rullen slutter.
        //
        // Å svinge senker garden. Angrepet skal koste noe mer enn pust: det
        // åpner deg, og det er derfor paraden er verdt å lære.
        const gardHoldt = this.taster.rull.isDown || Boolean(pad?.R1) || this.touchGard;
        this.kamp.settGardOnsket(
            gardHoldt &&
                !ruller &&
                this.stotIgjen === 0 &&
                this.slagIgjen === 0 &&
                this.kamp.harSkjold
        );
        this.kamp.tikk(delta);
        const gard = this.kamp.gardOppe;
        if (this.kamp.lesKollaps()) {
            sfx.galt();
            this.efx.flytTekst(this.spiller.x, this.spiller.y - 28, 'Tom for pust!', '#ff9d6a');
        }

        if (!ruller && this.stotIgjen === 0 && this.utfallIgjen === 0) {
            // Angrepet forplikter: eleven går saktere mens hun svinger, og bak
            // et reist skjold går hun i skjoldgang.
            const bremse = this.slagIgjen > 0 ? 0.4 : gard ? KAMP.gardFart : 1;
            this.spiller.setVelocity(
                enhet.x * SPILLER_FART * utslag * bremse,
                enhet.y * SPILLER_FART * utslag * bremse
            );

            // Retningen settes også under gard, så eleven kan snu seg mot en
            // fiende bak uten å slippe skjoldet.
            if (utslag > 0.001 && this.slagIgjen === 0) {
                this.retning =
                    Math.abs(dx) > Math.abs(dy)
                        ? dx < 0
                            ? 'venstre'
                            : 'hoyre'
                        : dy < 0
                          ? 'opp'
                          : 'ned';
            }
        }
        this.gardPress = Math.max(0, this.gardPress - delta);
        this.oppdaterHeltRamme(delta, !ruller && utslag > 0.001 && this.slagIgjen === 0);
        this.oppdaterSkjold();

        // Rull - kort fartsøkning med usårbarhet
        const rullTrykk =
            Phaser.Input.Keyboard.JustDown(this.taster.rull) ||
            this.padKant(pad, 'B') ||
            touch.has('rull');
        if (rullTrykk && this.rullNedkjoling === 0 && utslag > 0.001) {
            // Uten pust blir rullen en stavring: kortere, og uten usårbarhet.
            const { stavring } = this.kamp.rull();
            const fart = stavring ? RULL_FART * KAMP.stavringFaktor : RULL_FART;
            this.spiller.setVelocity(enhet.x * fart, enhet.y * fart);
            this.rullIgjen = RULL_MS;
            this.rullNedkjoling = RULL_NEDKJOLING;
            if (!stavring) this.usarbarIgjen = Math.max(this.usarbarIgjen, RULL_MS + 60);
            sfx.rull();
            this.efx.stovsky(this.spiller.x, this.spiller.y + 6, stavring ? 3 : 6);
            if (stavring)
                this.efx.flytTekst(this.spiller.x, this.spiller.y - 26, 'Tungt...', '#9fb0c8');
        }

        // Angrep. Trykket huskes en kort stund, så et litt tidlig trykk rett
        // før nedkjølingen er ute ikke bare forsvinner.
        const angrepTrykk =
            Phaser.Input.Keyboard.JustDown(this.taster.angrep) ||
            this.padKant(pad, 'A') ||
            touch.has('angrep');
        if (angrepTrykk) this.angrepBuffer = INPUT_BUFFER_MS;
        if (this.angrepBuffer > 0 && this.angrepNedkjoling === 0 && !ruller) {
            this.angrepBuffer = 0;
            // Slår hun bak et reist skjold, er det våpenets manøver.
            if (gard) this.manover();
            else this.slaa();
        }

        // Besvergelser 1-4
        const spells = useRpgStore.getState().spells;
        const hurtigtaster = [
            this.taster.spell1,
            this.taster.spell2,
            this.taster.spell3,
            this.taster.spell4,
        ];
        hurtigtaster.forEach((tast, i) => {
            if (Phaser.Input.Keyboard.JustDown(tast) && spells[i]) this.kastBesvergelse(spells[i]);
        });
        if (this.padKant(pad, 'X') && spells[0]) this.kastBesvergelse(spells[0]);

        // Blink når eleven er usårbar
        this.spiller.setAlpha(
            this.usarbarIgjen > 0 ? (Math.floor(this.time.now / 70) % 2 ? 0.45 : 1) : 1
        );
    }

    // ── Kamp ────────────────────────────────────────────────────────────────

    private slaa() {
        const store = useRpgStore.getState();
        const vapen = ITEM_BY_ID[store.utstyr.vapen ?? 'ovingssverd']?.weapon;
        const vk = vaapenKamp(vapen?.art);
        const rekkevidde = vapen?.rekkevidde ?? 30;
        const bue = ((vapen?.bue ?? 100) * Math.PI) / 180;
        const basisHastighet = vapen?.hastighet ?? 400;

        // Pusten, komboen og slitenheten avgjøres i kamp.ts. Null tilbake betyr
        // at hun står bundet i etterslep etter et bommet tredje slag.
        const sving = this.kamp.slaa(vk, basisHastighet * 0.7);
        if (!sving) {
            sfx.skjold();
            return;
        }

        const hastighet = basisHastighet * sving.hastighetFaktor;
        this.angrepNedkjoling = hastighet;
        this.slagIgjen = hastighet * 0.7;
        this.slagVarighet = hastighet * 0.7;

        const vinkel = this.retningsVinkel();
        sfx.sving();
        // Suset foran et tungt slag gir treffet en opptakt i stedet for bare et smell.
        if (vk.tungt) sfx.sus();

        // Utfallet: figuren bæres framover i trefframmen. Dette er enkeltgrepet
        // som gir mest utslag i 2D-action, og det gjør slaget til noe hun
        // forplikter seg til i stedet for noe hun trykker på.
        this.utfallIgjen = 110;
        this.spiller.setVelocity(Math.cos(vinkel) * 120, Math.sin(vinkel) * 120);

        // Sving våpenet gjennom buen. Slår hun oppover, skal våpenet være bak
        // henne - ellers ligger sverdet oppå ansiktet.
        this.vapenSprite
            .setVisible(true)
            .setDepth(this.spiller.y + (this.retning === 'opp' ? -2 : 1));
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

        // Våpensporet: buen henger igjen et øyeblikk etter svingen.
        this.fx.spor(this.spiller.x, this.spiller.y - 4, vinkel, rekkevidde);

        // Slagbue-effekt
        const slag = this.add
            .image(
                this.spiller.x + Math.cos(vinkel) * 14,
                this.spiller.y - 4 + Math.sin(vinkel) * 14,
                'fx-slag'
            )
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
        //
        // Styrken skaleres med hvor tregt våpenet er. Da får et raskt sverd og
        // en tung hammer like mye ut av styrke - før favoriserte et flatt
        // tillegg per slag de raske våpnene stadig mer med nivå, og den episke
        // bossbelønningen var en nedgradering.
        // Styrken skaleres på våpenets *egen* hastighet, ikke på den slitne -
        // ellers ville et trett slag gitt mer styrkebonus enn et uthvilt.
        const stats = maksVerdier(store);
        const grunnskade =
            ((vapen?.skade ?? 8) + stats.styrke * (basisHastighet / 400)) * sving.skadeFaktor;
        let traff = false;
        for (const fiende of this.fiendeSystem.alle()) {
            if (fiende.dodd) continue;
            const dx = fiende.sprite.x - this.spiller.x;
            const dy = fiende.sprite.y - 4 - (this.spiller.y - 4);
            const avstand = Math.hypot(dx, dy);
            if (avstand > rekkevidde + (fiende.def.storrelse ?? 1) * 8) continue;
            const vinkelTil = Math.atan2(dy, dx);
            if (Math.abs(Phaser.Math.Angle.Wrap(vinkelTil - vinkel)) > bue / 2) continue;

            const kritisk = Math.random() < 0.12;
            const skade = Math.round(
                grunnskade * (kritisk ? 2 : 1) * Phaser.Math.FloatBetween(0.9, 1.15)
            );
            // Tredje slag i komboen kaster dobbelt så hardt.
            this.fiendeSystem.skad(fiende, skade, kritisk, vinkelTil, sving.trinn === 3 ? 2 : 1);
            traff = true;
        }

        // Bommer hun på det tredje slaget, står hun i etterslep uten gard.
        this.kamp.etterSlag(sving.trinn, traff);

        if (traff) {
            // Hitstop etter vekt. Ett tall for alt gjør at ingenting føles tungt.
            const tungt = vk.tungt || sving.trinn === 3;
            this.hitstop(tungt ? KAMP.hitstopTungt : KAMP.hitstopLett);
            this.fx.dytt(vinkel, tungt ? 6 : 3, tungt ? 140 : 110);
        } else if (sving.trinn === 3) {
            this.efx.stovsky(this.spiller.x, this.spiller.y + 6, 4);
        }
    }

    /**
     * Våpenets særmanøver, slått bak et reist skjold. Hvert våpen har én, og den
     * er et historisk faktum: skjeggøksa haker skjoldet ned, spydet stikker
     * gjennom rekka, og den som ikke har noe av det, slår med skjoldbulen.
     */
    private manover() {
        const store = useRpgStore.getState();
        const vapen = ITEM_BY_ID[store.utstyr.vapen ?? 'ovingssverd']?.weapon;
        const vk = vaapenKamp(vapen?.art);

        if (!this.kamp.manover()) {
            this.efx.flytTekst(this.spiller.x, this.spiller.y - 28, 'Ikke pust nok', '#9fb0c8');
            return;
        }

        const vinkel = this.retningsVinkel();
        const rekkevidde =
            (vapen?.rekkevidde ?? 30) * (vk.manover === 'stikk-gjennom' ? 1.35 : 0.8);
        const bue = vk.manover === 'stikk-gjennom' ? Math.PI / 6 : Math.PI / 2;

        this.angrepNedkjoling = 520;
        this.slagIgjen = 320;
        this.slagVarighet = 320;
        this.gardPress = 140;
        sfx.sving();

        const stats = maksVerdier(store);
        let traff = false;
        for (const fiende of this.fiendeSystem.alle()) {
            if (fiende.dodd) continue;
            const dx = fiende.sprite.x - this.spiller.x;
            const dy = fiende.sprite.y - 4 - (this.spiller.y - 4);
            const avstand = Math.hypot(dx, dy);
            if (avstand > rekkevidde + (fiende.def.storrelse ?? 1) * 8) continue;
            const vinkelTil = Math.atan2(dy, dx);
            if (Math.abs(Phaser.Math.Angle.Wrap(vinkelTil - vinkel)) > bue / 2) continue;

            // Skjoldstøtet gjør lite skade og mye støt - det er en åpner, ikke et
            // drapsslag. Haket og stikket biter.
            const skade =
                vk.manover === 'skjoldstot'
                    ? Math.max(2, Math.round(stats.styrke * 0.6))
                    : Math.round(((vapen?.skade ?? 8) + stats.styrke) * 1.25);
            this.fiendeSystem.skad(
                fiende,
                skade,
                false,
                vinkelTil,
                vk.manover === 'skjoldstot' ? 2.4 : 1.4
            );
            traff = true;
        }

        this.efx.flytTekst(
            this.spiller.x,
            this.spiller.y - 30,
            MANOVER_NAVN[vk.manover],
            '#cfd8c0'
        );
        if (traff) {
            this.hitstop(KAMP.hitstopTungt);
            this.cameras.main.shake(110, 0.005);
        }
    }

    /**
     * Skjoldet følger retningen hun vender, og slitasjen vises på sprite-en før
     * bruddet kommer. Er det en teller eleven kan se, er det spenning - er det
     * tilfeldig, føles det urettferdig.
     */
    private oppdaterSkjold() {
        if (!this.kamp.gardOppe) {
            this.skjoldSprite.setVisible(false);
            return;
        }
        const andel = this.kamp.skjoldHelse / Math.max(1, this.kamp.skjoldMaks);
        const ramme = andel > 0.99 ? 0 : andel > 0.66 ? 1 : andel > 0.33 ? 2 : 3;
        // Figurens origo står ved føttene, så skjoldet må løftes opp til brystet.
        // Ligger det lavere, dekker det bakken i stedet for henne.
        const [ox, oy] =
            this.retning === 'ned'
                ? [-5, 1]
                : this.retning === 'opp'
                  ? [5, -2]
                  : this.retning === 'venstre'
                    ? [-6, 0]
                    : [6, 0];
        // Presset skyver skjoldet ett piksel ut i det noe treffer det.
        const press = this.gardPress > 0 ? Math.sign(ox) : 0;
        this.skjoldSprite
            .setVisible(true)
            .setFrame(Math.min(SKJOLD_RAMMER - 1, ramme))
            .setPosition(this.spiller.x + ox + press, this.spiller.y - 9 + oy)
            .setDepth(this.retning === 'opp' ? this.spiller.y - 3 : this.spiller.y + 3);
    }

    /**
     * Et nærkampslag lander på eleven. Garden får si sitt først: perfekt parade,
     * vanlig blokk, eller ingenting. Returnerer `false` når garden tok imot, så
     * fiendesystemet vet at ingenting traff henne.
     */
    private nerkampTreff(fiende: Fiende): boolean {
        const def = fiende.def;
        // Vinkelen er retningen fra eleven *mot* den som slår, så et angrep i
        // ryggen aldri kan blokkeres.
        const utfall = this.kamp.vurderTreff({
            vinkelTilAngriper: Math.atan2(
                fiende.sprite.y - this.spiller.y,
                fiende.sprite.x - this.spiller.x
            ),
            retningsVinkel: this.retningsVinkel(),
            tungt: def.skade >= 12,
        });

        if (utfall.art === 'parade') {
            this.parade(fiende);
            return false;
        }
        if (utfall.art === 'blokk') {
            this.blokk(fiende, utfall.skjoldBrast);
            return false;
        }

        const forSkade = useRpgStore.getState().hp;
        this.skadSpiller(def.skade);
        // Bare støt eleven hvis treffet faktisk gikk gjennom. Ellers ble farten
        // uansett overskrevet av input allerede neste bilde.
        if (useRpgStore.getState().hp < forSkade) {
            this.kamp.meldTreff();
            const v = Math.atan2(
                this.spiller.y - fiende.sprite.y,
                this.spiller.x - fiende.sprite.x
            );
            this.spiller.setVelocity(Math.cos(v) * 190, Math.sin(v) * 190);
            this.stotIgjen = STOT_MS;
        }
        return true;
    }

    /**
     * Perfekt parade. Belønningen må være umulig å overse - det er dette
     * øyeblikket hele kampsystemet er bygget rundt, og eleven skal ville ha det
     * igjen med én gang.
     */
    private parade(fiende: Fiende) {
        this.gardPress = 200;
        sfx.paradeKlang();
        this.hitstop(KAMP.hitstopParade);
        // Én ramme hvitt over hele skjermen. Belønningen må være umulig å overse.
        this.cameras.main.flash(70, 255, 255, 245);
        this.efx.flytTekst(this.spiller.x, this.spiller.y - 30, 'Parade!', '#fff2b0', 15);
        this.efx.pikselSprut(this.skjoldSprite.x, this.skjoldSprite.y, 0xfff2b0, 14);
        this.fx.klask(this.spiller, 0.1);

        // Angriperen mister balansen: full åpning. Kameraet dyttes *mot* henne,
        // ikke bort - det er hun som vant utvekslingen.
        const v = Math.atan2(fiende.sprite.y - this.spiller.y, fiende.sprite.x - this.spiller.x);
        this.fx.dytt(v, 5, 150);
        this.fx.klask(fiende.sprite, 0.2);
        this.fiendeSystem.stotBort(fiende, v, 240);
    }

    /** Vanlig blokk: skjoldet tok det, men det kostet pust og en flis av kanten. */
    private blokk(fiende: Fiende, brast: boolean) {
        this.gardPress = 160;
        // Lindetre, ikke jern. Blokken skal høres tørr ut - metallklangen er
        // paradens belønning, og den skal ikke deles med noe billigere.
        sfx.treSprak();
        const v = Math.atan2(this.spiller.y - fiende.sprite.y, this.spiller.x - fiende.sprite.x);
        this.fx.dytt(v, 3, 110);
        this.fx.flis(this.skjoldSprite.x, this.skjoldSprite.y, v, brast ? 12 : 4);

        // Litt støt, så et blokkert slag fortsatt flytter eleven. Uten det står
        // hun som en vegg, og blokken mister vekt.
        this.spiller.setVelocity(Math.cos(v) * 70, Math.sin(v) * 70);

        if (brast) {
            sfx.skjoldBrudd();
            this.hitstop(KAMP.hitstopTungt);
            this.fx.dytt(v, 9, 260);
            this.efx.flytTekst(
                this.spiller.x,
                this.spiller.y - 30,
                'Skjoldet brast!',
                '#ff9d6a',
                15
            );
            useRpgStore.getState().varsle('Skjoldet gikk i to. Nå står du bar.', 'darlig');
            // Et kort pusterom, ellers lander neste slag i samme sekund som
            // skjoldet forsvant, og det leser som en straff for å ha blokkert.
            this.usarbarIgjen = Math.max(this.usarbarIgjen, 420);
        }
    }

    /**
     * `tvunget` går forbi usårbarheten og skjoldet. Et galt svar i bossdysten
     * skal koste uansett - før ble straffen ofte spist opp av at bossen nettopp
     * hadde truffet, og da var det gratis å gjette.
     */
    private skadSpiller(skade: number, tvunget = false) {
        if (this.usarbarIgjen > 0 && !tvunget) return;
        const store = useRpgStore.getState();

        // Minneskjoldet tar støyten først.
        if (this.skjoldLadninger > 0 && !tvunget) {
            this.skjoldLadninger -= 1;
            sfx.skjold();
            this.efx.flytTekst(this.spiller.x, this.spiller.y - 26, 'Skjold!', '#cfd8c0');
            this.usarbarIgjen = 300;
            return;
        }

        const stats = maksVerdier(store);
        const faktisk = Math.max(1, Math.round(skade - stats.vern * 0.6));
        store.endreHp(-faktisk);
        this.usarbarIgjen = USARBAR_MS;
        sfx.skade();
        // Dyttet går bort fra treffet - eleven skal kjenne at hun ble slått bakover.
        this.fx.dytt(this.retningsVinkel() + Math.PI, 7, 170);
        this.cameras.main.flash(120, 180, 20, 20);
        this.fx.klask(this.spiller, 0.2);
        this.fx.blod(this.spiller.x, this.spiller.y, 0xc4241f, 3, this.retningsVinkel() + Math.PI);
        this.efx.flytTekst(this.spiller.x, this.spiller.y - 26, `-${faktisk}`, '#ff8080', 15);

        if (useRpgStore.getState().hp <= 0) this.spillerDor();
    }

    private spillerDor() {
        this.settLaast(true);
        stopMusikk();
        this.cameras.main.fade(700, 0, 0, 0, false);
        this.time.delayedCall(750, () => fraSpill.emit('dod', {}));
    }

    private avsluttSkjold() {
        this.skjoldLadninger = 0;
        this.skjoldTimer?.remove();
        this.skjoldTimer = null;
        if (this.skjoldRing) {
            this.tweens.killTweensOf(this.skjoldRing);
            this.skjoldRing.destroy();
            this.skjoldRing = null;
        }
    }

    private gjenoppliv() {
        const store = useRpgStore.getState();
        store.hvil();
        // Nytt skjold og full pust. Døden skal koste tid og sølv, ikke gjøre neste
        // forsøk umulig fordi skjoldet lå i splinter.
        this.kamp.hvil();
        this.touchGard = false;
        this.avsluttSkjold();
        // Kameraet skal ikke våkne skjevt hvis hun døde midt i et dytt, og
        // slagmarken fra forrige forsøk skal ikke ligge igjen på tunet.
        this.fx.vask();
        // Litt sølv går tapt - nok til å svi, ikke nok til å ødelegge.
        const tap = Math.floor(store.solv * 0.15);
        if (tap > 0) useRpgStore.setState({ solv: store.solv - tap });
        const [tx, ty] = NORDVIK_SPAWN;
        this.spiller.setPosition(tx * TILE + 8, ty * TILE + 8);
        this.usarbarIgjen = 1500;
        this.settLaast(false);
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
                this.skudd.skyt({
                    x: this.spiller.x,
                    y: this.spiller.y - 6,
                    vinkel,
                    fart: 260,
                    skade,
                    levetid: 1400,
                    tekstur: 'fx-kule',
                    farge: spell.farge,
                    fraFiende: false,
                    piercing: Boolean(spell.piercing),
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
                this.tweens.add({
                    targets: graf,
                    alpha: 0,
                    duration: 260,
                    onComplete: () => graf.destroy(),
                });
                for (const fiende of this.fiendeSystem.alle()) {
                    if (fiende.dodd) continue;
                    const avstand = avstandTilLinje(
                        fiende.sprite.x,
                        fiende.sprite.y - 6,
                        this.spiller.x,
                        this.spiller.y - 6,
                        ende.x,
                        ende.y
                    );
                    if (avstand < 14)
                        this.fiendeSystem.skad(fiende, Math.round(skade), false, vinkel);
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
                for (const fiende of this.fiendeSystem.alle()) {
                    if (fiende.dodd) continue;
                    const d = Phaser.Math.Distance.Between(
                        this.spiller.x,
                        this.spiller.y,
                        fiende.sprite.x,
                        fiende.sprite.y
                    );
                    if (d < radius) {
                        const v = Math.atan2(
                            fiende.sprite.y - this.spiller.y,
                            fiende.sprite.x - this.spiller.x
                        );
                        this.fiendeSystem.skad(fiende, Math.round(skade), false, v);
                    }
                }
                this.cameras.main.shake(200, 0.006);
                break;
            }
            case 'skjold': {
                // En ny kasting må rydde etter den forrige. Nedkjølingen er
                // nøyaktig like lang som varigheten, så uten dette kunne den
                // gamle timeren slå av et helt ferskt skjold.
                this.skjoldTimer?.remove();
                this.skjoldRing?.destroy();
                this.skjoldLadninger = 3;
                const ring = this.add
                    .image(this.spiller.x, this.spiller.y - 6, 'fx-ring')
                    .setTint(spell.farge)
                    .setDepth(this.spiller.y - 1)
                    .setScale(0.5)
                    .setAlpha(0.5);
                this.skjoldRing = ring;
                this.tweens.add({
                    targets: ring,
                    scale: 0.62,
                    alpha: 0.25,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                });
                this.skjoldTimer = this.time.delayedCall(9000, () => this.avsluttSkjold());
                store.varsle('Minneskjoldet holder - tre slag.', 'bra');
                break;
            }
            case 'helbred': {
                store.endreHp(spell.skade);
                this.efx.flytTekst(
                    this.spiller.x,
                    this.spiller.y - 26,
                    `+${spell.skade}`,
                    '#9ef0c0',
                    15
                );
                this.efx.pikselSprut(this.spiller.x, this.spiller.y - 8, 0x9ef0c0, 14);
                break;
            }
        }
    }

    // ── Fiender ─────────────────────────────────────────────────────────────

    // ── Samhandling ─────────────────────────────────────────────────────────

    /** Oppdaterer utropstegnene over NPC-ene. Kalles fra React etter questbytte. */
    oppdaterMarkorer() {
        this.samhandling.oppdaterMarkorer();
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

    private oppdaterDybde() {
        this.spiller.setDepth(this.spiller.y);
        this.fiendeSystem.oppdaterDybde();
        this.samhandling.oppdaterDybde();
    }

    /** Fargen på en fiende, brukt av grensesnittet. */
    static fiendeFarge(def: EnemyDef): string {
        return numToHex(def.farge);
    }
}
