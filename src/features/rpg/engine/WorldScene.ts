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
import { hexToNum, numToHex } from './pixels';
import { aktivQuestFor, nesteQuestFor } from './quests';
import {
    FIG_ORIGIN_Y,
    FIENDE_RAMMER,
    GLYF,
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
    glyfIndex,
    heltFrame,
    type Dir,
    type Positur,
} from './spriteforge';
import {
    FLIS_PRIORITET,
    FLIS_VARIANTER,
    forgeProps,
    forgeTiles,
    type KantHjorne,
    type KantRetning,
    type TileKey,
} from './tileforge';
import { byggNordvik, type WorldMap } from './worldgen';

type Sprite = Phaser.Physics.Arcade.Sprite;

interface Fiende {
    sprite: Sprite;
    def: EnemyDef;
    hp: number;
    maksHp: number;
    tilstand: 'sover' | 'jager' | 'varsler' | 'slar' | 'henter-seg' | 'stotet';
    timer: number;
    frame: number;
    frameTimer: number;
    /** Bossen er udødelig til eleven svarer riktig. */
    skjold: number;
    dodd: boolean;
    /** Colliderne må fjernes eksplisitt når fienden dør, ellers lekker de. */
    collidere: Phaser.Physics.Arcade.Collider[];
    /** Livsstolpen over hodet. Vises først når fienden har tatt skade. */
    stolpe: Phaser.GameObjects.Graphics | null;
    /** Hvor lenge stolpen blir stående etter siste treff. */
    stolpeTid: number;
    /** Fargen fienden skal ha når treff-blinket er over (varsel-rødt eller ingen). */
    onsketTint: number | null;
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
    private vannLag: Phaser.GameObjects.RenderTexture[] = [];
    private vannFrame = 0;
    private utseendeSignatur = '';
    private slagIgjen = 0;
    private slagVarighet = 400;

    private fiender: Fiende[] = [];
    private prosjektiler: Prosjektil[] = [];
    private npcSprites = new Map<string, Phaser.GameObjects.Sprite>();
    private npcMarkorer = new Map<string, Phaser.GameObjects.Image>();
    private landemerker = new Map<string, Phaser.GameObjects.Image>();
    private loot: {
        sprite: Phaser.GameObjects.Image;
        itemId: string | null;
        solv: number;
        levetid: number;
    }[] = [];
    private partikkelPool: Phaser.GameObjects.Image[] = [];
    private taakeflak: { bilde: Phaser.GameObjects.Image; fart: number }[] = [];
    private baalLys: Phaser.GameObjects.Image[] = [];
    private baalPuls = 0;
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
    /** Det retningsbestemte kamerastøtet. Bare ett om gangen. */
    private dyttTween: Phaser.Tweens.Tween | null = null;
    /** Blod som blir liggende. Eldste ryddes når lista blir lang. */
    private blodflekker: Phaser.GameObjects.Image[] = [];
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
    private naerInteraksjon: { type: 'npc' | 'landemerke'; id: string } | null = null;
    private bossVakt = false;
    /** Brølet skal komme én gang, ikke hver gang eleven lokker bossen ut og inn. */
    private bossVekket = false;
    private boss: Fiende | null = null;
    private maaRyddeFiender = false;
    private spawnTimer = 0;
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

        this.byggTerreng();
        this.byggKollisjon();
        this.byggProps();
        this.byggSpiller();
        this.byggNpcer();
        this.byggLandemerker();
        this.byggBoss();
        this.byggAtmosfare();
        this.settOppInput();
        this.settOppKamera();
        this.lyttPaaUi();

        startMusikk(196, 0);
        this.events.once('shutdown', () => this.rydd());

        fraSpill.emit('sone', { tittel: 'Nordvik', undertittel: 'Vikingtiden · 793-1066' });
    }

    // ── Oppbygging ──────────────────────────────────────────────────────────

    /**
     * Bakken tegnes én gang inn i én stor tekstur. Da koster den ett tegnekall
     * i stedet for tre tusen sprites.
     *
     * Det viktige her er andre runde: hver rute ser på naboene sine, og hvis en
     * nabo har en flis som «vinner» (se FLIS_PRIORITET), legges naboens kant
     * oppå. Uten det møtes gress, sand og vann i harde 16-pikslers trapper over
     * hele kartet.
     */
    private byggTerreng() {
        const { bredde, hoyde, terreng } = this.kart;
        const rt = this.add.renderTexture(0, 0, bredde * TILE, hoyde * TILE);
        rt.setOrigin(0, 0).setDepth(-1000);

        const flisPa = (x: number, y: number): TileKey => {
            if (x < 0 || y < 0 || x >= bredde || y >= hoyde) return terreng[Math.min(Math.max(y, 0), hoyde - 1)]?.[Math.min(Math.max(x, 0), bredde - 1)] ?? 'gress';
            return terreng[y][x];
        };
        // Fast variant per rute, så verden ser lik ut hver gang.
        const variantFor = (x: number, y: number, flis: TileKey) => {
            const h = (x * 73856093) ^ (y * 19349663) ^ flis.length * 2654435761;
            return Math.abs(h) % FLIS_VARIANTER[flis];
        };

        const vannRuter: [number, number][] = [];
        for (let y = 0; y < hoyde; y++) {
            for (let x = 0; x < bredde; x++) {
                const flis = terreng[y][x];
                if (flis === 'vann') {
                    vannRuter.push([x, y]);
                    // Stillestående vann bakes inn, så det aldri blir hull i kartet.
                    rt.drawFrame('flis-vann-0-stille', undefined, x * TILE, y * TILE);
                    continue;
                }
                rt.drawFrame(`flis-${flis}-${variantFor(x, y, flis)}`, undefined, x * TILE, y * TILE);
            }
        }

        // ── Overgangene ─────────────────────────────────────────────────────
        const naboer: [KantRetning, number, number][] = [
            ['n', 0, -1],
            ['s', 0, 1],
            ['v', -1, 0],
            ['h', 1, 0],
        ];
        const hjorner: [KantHjorne, number, number][] = [
            ['nv', -1, -1],
            ['nh', 1, -1],
            ['sv', -1, 1],
            ['sh', 1, 1],
        ];
        for (let y = 0; y < hoyde; y++) {
            for (let x = 0; x < bredde; x++) {
                const min = flisPa(x, y);
                const minPrio = FLIS_PRIORITET[min];
                // Sanden får sin lyse skumkant bare der den faktisk møter vann.
                const kantNavn = (nabo: TileKey) =>
                    nabo === 'sand' && min === 'vann' ? 'sandskum' : nabo;
                for (const [retning, dx, dy] of naboer) {
                    const nabo = flisPa(x + dx, y + dy);
                    if (FLIS_PRIORITET[nabo] <= minPrio) continue;
                    rt.drawFrame(`kant-${kantNavn(nabo)}-${retning}`, undefined, x * TILE, y * TILE);
                }
                for (const [hjorne, dx, dy] of hjorner) {
                    const nabo = flisPa(x + dx, y + dy);
                    if (FLIS_PRIORITET[nabo] <= minPrio) continue;
                    // Hjørnet skal bare fylles når ingen av de to sidene alt gjør jobben.
                    if (flisPa(x + dx, y) === nabo || flisPa(x, y + dy) === nabo) continue;
                    rt.drawFrame(`hjorne-${kantNavn(nabo)}-${hjorne}`, undefined, x * TILE, y * TILE);
                }
            }
        }

        // ── Vannet får leve ─────────────────────────────────────────────────
        // Fire ferdigbakte lag som veksler. Tidligere lå det 268 enkeltsprites
        // her, hver med sin egen animasjonskomponent.
        if (vannRuter.length > 0) {
            let minX = bredde;
            let maksX = 0;
            let minY = hoyde;
            let maksY = 0;
            for (const [x, y] of vannRuter) {
                minX = Math.min(minX, x);
                maksX = Math.max(maksX, x);
                minY = Math.min(minY, y);
                maksY = Math.max(maksY, y);
            }
            const bx = minX * TILE;
            const by = minY * TILE;
            for (let frame = 0; frame < 4; frame++) {
                const lag = this.add.renderTexture(
                    bx,
                    by,
                    (maksX - minX + 1) * TILE,
                    (maksY - minY + 1) * TILE
                );
                lag.setOrigin(0, 0).setDepth(-999).setVisible(frame === 0);
                for (const [x, y] of vannRuter) {
                    lag.drawFrame(`flis-vann-${frame}`, undefined, x * TILE - bx, y * TILE - by);
                }
                this.vannLag.push(lag);
            }
            this.time.addEvent({
                delay: 260,
                loop: true,
                callback: () => {
                    this.vannFrame = (this.vannFrame + 1) % this.vannLag.length;
                    this.vannLag.forEach((l, i) => l.setVisible(i === this.vannFrame));
                },
            });
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
        // Boksen skal aldri tegnes, og den har ingenting i visningslista å
        // gjøre: 286 usynlige rektangler der var nok til å tredoble lengden på
        // lista som sorteres etter dybde hver frame.
        this.children.remove(boks);
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

    /**
     * De 244 objektene i verden er statiske, men de må fortsatt sorteres mot
     * spilleren så hun kan gå bak et tre.
     *
     * Jeg prøvde å bake dem inn i vannrette bånd for å spare tegnekall. Det
     * halverte bildefrekvensen: hvert bånd er en kartbred, delvis gjennomsiktig
     * flate, og fem-seks av dem overlapper hver piksel på skjermen. Overtegning
     * er dyrere enn tegnekall på en svak GPU. Derfor står objektene her som
     * hver sin Image - med dybden satt én gang, siden de aldri flytter seg.
     */
    private byggProps() {
        const solide = this.physics.add.staticGroup();

        for (const prop of this.kart.props) {
            const nokkel =
                prop.kind === 'tre' || prop.kind === 'busk' || prop.kind === 'stein'
                    ? `prop-${prop.kind}-${prop.variant}`
                    : `prop-${prop.kind}`;

            const bilde = this.add.image(prop.x, prop.y, nokkel);
            // Foten av objektet bestemmer dybden, så spilleren kan gå bak trær.
            bilde.setOrigin(0.5, 0.85).setDepth(prop.y);
            if (prop.kind === 'kai' || prop.kind === 'langskip') bilde.setDepth(-900);
            // Variasjon per objekt: speiling, størrelse og en liten fargetone.
            bilde.setFlipX(prop.flip).setScale(prop.skala);
            if (prop.tint !== 0) {
                const n = Math.max(0, Math.min(255, 255 + prop.tint));
                bilde.setTint((n << 16) | (n << 8) | n);
            }

            if (prop.solid && prop.treff) {
                this.lagBoks(solide, prop.x, prop.y + prop.treff.dy, prop.treff.w, prop.treff.h);
            }
        }
        this.data.set('propKropper', solide);

        // Bål på tingplassen
        this.anims.create({
            key: 'baal',
            frames: [
                { key: 'prop-baal-0' },
                { key: 'prop-baal-1' },
                { key: 'prop-baal-2' },
                { key: 'prop-baal-3' },
            ],
            frameRate: 9,
            repeat: -1,
        });
    }

    private byggSpiller() {
        const store = useRpgStore.getState();
        const look = this.heltLook();
        forgeHumanoid(this, 'helt', look);

        const [tx, ty] = NORDVIK_SPAWN;
        this.spiller = this.physics.add.sprite(tx * TILE + 8, ty * TILE + 8, 'helt', heltFrame('ned', 'idle', 0));
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

        this.skjoldSprite = this.add.image(this.spiller.x, this.spiller.y, 'skjold', 0).setVisible(false);

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
            const sprite = this.add.sprite(
                tx * TILE + 8,
                ty * TILE + 8,
                `npc-${npc.id}`,
                heltFrame('ned', 'idle', 0)
            );
            sprite.setOrigin(0.5, FIG_ORIGIN_Y).setDepth(sprite.y);
            // NPC-ene puster. Fem mennesker frosset i en bygd så ut som en feil.
            this.tweens.addCounter({
                from: 0,
                to: 1,
                duration: 900 + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                onUpdate: (t) =>
                    sprite.setFrame(heltFrame('ned', 'idle', (t.getValue() ?? 0) > 0.5 ? 1 : 0)),
            });
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
        const sprite = this.physics.add.sprite(arena.x, arena.y, `fiende-${def.id}`, 0);
        sprite.setOrigin(0.5, 0.85).setDepth(sprite.y);
        sprite.body!.setSize(24, 16);
        sprite.setImmovable(false);

        this.boss = {
            sprite,
            def,
            hp: def.hp,
            maksHp: def.hp,
            tilstand: 'sover',
            timer: 0,
            frame: 0,
            frameTimer: 0,
            skjold: NORDVIK_BOSS_QUESTIONS.length,
            dodd: false,
            collidere: [this.physics.add.collider(sprite, this.data.get('vegger'))],
            stolpe: null,
            stolpeTid: 0,
            onsketTint: null,
        };
        this.fiender.push(this.boss);
    }

    /**
     * Spillet heter Minnevokteren. Fienden er tåka. Bygda er «en fjordbygd der
     * tåka har begynt å spise navnene på folk». Likevel fantes det ikke én
     * piksel atmosfærisk tåke i rendereren - og `tema.himmel` var definert på
     * alle elleve soner uten å bli lest noe sted.
     *
     * Her tas begge i bruk: en tone i lufta, en vignett i kanten, og tåkeslør
     * som driver over verden og tykner der eleven ikke har vært.
     */
    private byggAtmosfare() {
        const tema = ZONE_BY_ID.nordvik.tema;

        // Himmeltonen og vignetten legges av React oppå lerretet (se
        // `Atmosfare` i RpgPage). Da slipper de å kjempe mot kamerazoomen, og
        // de blir skarpe uansett skjermoppløsning.
        fraSpill.emit('atmosfare', { himmel: tema.himmel });

        // Tåkeslør som driver over verden. Dette er selve temaet i spillet:
        // Glemselen er tåke, og før fantes den bare i teksten.
        // Antallet er holdt nede med vilje: hvert flak er en stor gjennomsiktig
        // flate, og overtegning er det som koster på en svak Chromebook-GPU.
        for (let i = 0; i < 14; i++) {
            const naer = i % 2 === 0;
            const lag = this.add
                .image(
                    Math.random() * this.kart.bredde * TILE,
                    Math.random() * this.kart.hoyde * TILE,
                    'fx-taake'
                )
                // Ett lag under figurene og ett over: da får tåka dybde.
                .setDepth(naer ? 29000 : -850)
                .setScale(naer ? 1.8 + Math.random() * 1.2 : 3 + Math.random() * 2)
                .setAlpha(naer ? 0.11 + Math.random() * 0.07 : 0.15 + Math.random() * 0.09)
                .setTint(hexToNum(tema.himmel));
            this.taakeflak.push({ bilde: lag, fart: (naer ? 11 : 4) + Math.random() * 7 });
        }

        // Bålet lyser. Ett bål i hele bygda, og det ga null lys.
        for (const lm of NORDVIK_LANDMARKS) {
            if (lm.kind !== 'baal') continue;
            const [tx, ty] = lm.tile;
            const glo = this.add
                .image(tx * TILE + 8, ty * TILE + 4, 'fx-glo')
                .setTint(0xffb23f)
                .setAlpha(0.3)
                .setScale(2.2)
                .setDepth(-800)
                .setBlendMode(Phaser.BlendModes.ADD);
            this.baalLys.push(glo);
        }
    }

    private oppdaterAtmosfare(delta: number) {
        const dt = delta / 1000;
        const kartB = this.kart.bredde * TILE;
        for (const flak of this.taakeflak) {
            flak.bilde.x += flak.fart * dt;
            if (flak.bilde.x > kartB + 120) flak.bilde.x = -120;
        }
        // Bålet flakker.
        this.baalPuls += delta;
        const puls = 0.26 + Math.sin(this.baalPuls / 190) * 0.05 + Math.sin(this.baalPuls / 71) * 0.03;
        for (const lys of this.baalLys) lys.setAlpha(puls);
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
            this.bossVakt = false;
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
                    this.feirRiktigSvar();
                } else {
                    sfx.galt();
                    this.cameras.main.shake(140, 0.004);
                }
                this.oppdaterMarkorer();
            }),
            tilSpill.on('bossSvar', ({ riktig }) => {
                this.settLaast(false);
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
        // Kamerastøtet kan stå midt i en tween, og blodflekkene er egne bilder.
        this.dyttTween?.remove();
        this.dyttTween = null;
        for (const flekk of this.blodflekker) flekk.destroy();
        this.blodflekker = [];
    }

    // ── Oppdatering ─────────────────────────────────────────────────────────

    update(_tid: number, delta: number) {
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

        this.angrepNedkjoling = Math.max(0, this.angrepNedkjoling - delta);
        this.rullNedkjoling = Math.max(0, this.rullNedkjoling - delta);
        this.rullIgjen = Math.max(0, this.rullIgjen - delta);
        this.usarbarIgjen = Math.max(0, this.usarbarIgjen - delta);
        this.stotIgjen = Math.max(0, this.stotIgjen - delta);
        this.utfallIgjen = Math.max(0, this.utfallIgjen - delta);
        this.slagIgjen = Math.max(0, this.slagIgjen - delta);
        this.angrepBuffer = Math.max(0, this.angrepBuffer - delta);
        for (const [id, verdi] of this.spellNedkjoling) {
            if (verdi > 0) this.spellNedkjoling.set(id, Math.max(0, verdi - delta));
        }

        this.oppdaterSpiller(delta);
        this.sjekkInteraksjon();
        this.oppdaterFiender(delta);
        this.oppdaterProsjektiler(delta);
        this.oppdaterLoot(delta);
        this.oppdaterDybde();
        this.oppdaterSpawn(delta);
        this.oppdaterAtmosfare(delta);
        this.oppdaterKompass(delta);
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
        const iKampNa = this.fiender.some(
            (f) =>
                !f.dodd &&
                f.tilstand !== 'sover' &&
                Phaser.Math.Distance.Between(f.sprite.x, f.sprite.y, this.spiller.x, this.spiller.y) < 220
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
            this.flytTekst(this.spiller.x, this.spiller.y - 34, `NIVÅ ${maks.niva}`, '#ffe9a8', 15);
            this.pikselSprut(this.spiller.x, this.spiller.y - 10, 0xffe9a8, 22);
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

        const mal =
            kilde.type === 'npc' ? this.npcSprites.get(kilde.id) : this.landemerker.get(kilde.id);
        if (!mal) return;
        this.kompassAktivt = true;
        fraSpill.emit('kompass', {
            vinkel: (Math.atan2(mal.y - this.spiller.y, mal.x - this.spiller.x) * 180) / Math.PI,
            avstand: Phaser.Math.Distance.Between(this.spiller.x, this.spiller.y, mal.x, mal.y),
            navn:
                kilde.type === 'npc'
                    ? (NORDVIK_NPCS.find((n) => n.id === kilde.id)?.name ?? kilde.navn)
                    : (NORDVIK_LANDMARKS.find((l) => l.id === kilde.id)?.title ?? kilde.navn),
        });
    }

    /** Fryser bildet et lite øyeblikk så slaget kjennes i hendene. */
    private hitstop(ms: number) {
        this.hitstopIgjen = ms;
        this.physics.pause();
        this.tweens.pauseAll();
    }

    /**
     * Retningsbestemt kamerastøt. Rystelse i alle retninger leser som støy - et
     * dytt langs treffvektoren leser som kraft. Dette er enkeltgrepet som gjorde
     * mest for hvordan slagene kjennes.
     *
     * Kameraet følger spilleren, så `setScroll` blir overskrevet neste bilde.
     * `followOffset` er det ene stedet vi kan skyve det uten å slåss med
     * `startFollow`.
     */
    private dytt(vinkel: number, piksler: number, ms = 120) {
        const cam = this.cameras.main;
        const mx = Math.cos(vinkel) * piksler;
        const my = Math.sin(vinkel) * piksler;
        // To dytt samtidig ville dratt kameraet i to retninger og etterlatt en
        // permanent forskyvning når den ene tweenen ryddet etter seg.
        this.dyttTween?.remove();
        cam.setFollowOffset(mx, my);
        this.dyttTween = this.tweens.addCounter({
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

    /**
     * Klaskesprett: målet klemmes flatt i trefframmen og spretter tilbake.
     * Squash and stretch - nesten gratis, og det gjør hvert treff til en hendelse.
     */
    private klask(mal: Phaser.GameObjects.Sprite, styrke = 0.15) {
        this.tweens.killTweensOf(mal);
        mal.setScale(1 + styrke, 1 - styrke);
        this.tweens.add({
            targets: mal,
            scaleX: 1,
            scaleY: 1,
            duration: 80,
            ease: 'Quad.Out',
        });
    }

    /**
     * Blod som blir liggende. Flekkene ligger over terrenget og under alt som
     * går på det, og de eldste ryddes bort - ellers vokser lista hele økten.
     */
    private blodflekk(x: number, y: number, farge: number, antall: number, vinkel: number) {
        for (let i = 0; i < antall; i++) {
            const spredning = Phaser.Math.FloatBetween(-0.7, 0.7);
            const lengde = Phaser.Math.Between(3, 16);
            const flekk = this.add
                .image(
                    x + Math.cos(vinkel + spredning) * lengde,
                    y + Math.sin(vinkel + spredning) * lengde + Phaser.Math.Between(0, 5),
                    'fx-bit'
                )
                .setTint(farge)
                .setAlpha(Phaser.Math.FloatBetween(0.35, 0.7))
                .setScale(Phaser.Math.FloatBetween(0.7, 1.8), Phaser.Math.FloatBetween(0.5, 1.2))
                .setDepth(-880);
            this.blodflekker.push(flekk);
        }
        while (this.blodflekker.length > 90) this.blodflekker.shift()?.destroy();
    }

    /**
     * Håndkontrolleren leverer «holdt inne», ikke «trykket nå». Uten en egen
     * kant-deteksjon her ville det å holde A gitt automatisk angrep.
     */
    private padKant(pad: Phaser.Input.Gamepad.Gamepad | null, knapp: 'A' | 'B' | 'X' | 'Y'): boolean {
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
        const enhet = utslag > 0.001 ? { x: dx / Math.hypot(dx, dy), y: dy / Math.hypot(dx, dy) } : { x: 0, y: 0 };

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
            gardHoldt && !ruller && this.stotIgjen === 0 && this.slagIgjen === 0 && this.kamp.harSkjold
        );
        this.kamp.tikk(delta);
        const gard = this.kamp.gardOppe;
        if (this.kamp.lesKollaps()) {
            sfx.galt();
            this.flytTekst(this.spiller.x, this.spiller.y - 28, 'Tom for pust!', '#ff9d6a');
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
                    Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'venstre' : 'hoyre') : dy < 0 ? 'opp' : 'ned';
            }
        }
        this.gardPress = Math.max(0, this.gardPress - delta);
        this.oppdaterHeltRamme(delta, !ruller && utslag > 0.001 && this.slagIgjen === 0);
        this.oppdaterSkjold();

        // Rull - kort fartsøkning med usårbarhet
        const rullTrykk =
            Phaser.Input.Keyboard.JustDown(this.taster.rull) || this.padKant(pad, 'B') || touch.has('rull');
        if (rullTrykk && this.rullNedkjoling === 0 && utslag > 0.001) {
            // Uten pust blir rullen en stavring: kortere, og uten usårbarhet.
            const { stavring } = this.kamp.rull();
            const fart = stavring ? RULL_FART * KAMP.stavringFaktor : RULL_FART;
            this.spiller.setVelocity(enhet.x * fart, enhet.y * fart);
            this.rullIgjen = RULL_MS;
            this.rullNedkjoling = RULL_NEDKJOLING;
            if (!stavring) this.usarbarIgjen = Math.max(this.usarbarIgjen, RULL_MS + 60);
            sfx.rull();
            this.stovsky(this.spiller.x, this.spiller.y + 6, stavring ? 3 : 6);
            if (stavring) this.flytTekst(this.spiller.x, this.spiller.y - 26, 'Tungt...', '#9fb0c8');
        }

        // Angrep. Trykket huskes en kort stund, så et litt tidlig trykk rett
        // før nedkjølingen er ute ikke bare forsvinner.
        const angrepTrykk =
            Phaser.Input.Keyboard.JustDown(this.taster.angrep) || this.padKant(pad, 'A') || touch.has('angrep');
        if (angrepTrykk) this.angrepBuffer = INPUT_BUFFER_MS;
        if (this.angrepBuffer > 0 && this.angrepNedkjoling === 0 && !ruller) {
            this.angrepBuffer = 0;
            // Slår hun bak et reist skjold, er det våpenets manøver.
            if (gard) this.manover();
            else this.slaa();
        }

        // Besvergelser 1-4
        const spells = useRpgStore.getState().spells;
        const hurtigtaster = [this.taster.spell1, this.taster.spell2, this.taster.spell3, this.taster.spell4];
        hurtigtaster.forEach((tast, i) => {
            if (Phaser.Input.Keyboard.JustDown(tast) && spells[i]) this.kastBesvergelse(spells[i]);
        });
        if (this.padKant(pad, 'X') && spells[0]) this.kastBesvergelse(spells[0]);

        // Blink når eleven er usårbar
        this.spiller.setAlpha(this.usarbarIgjen > 0 ? (Math.floor(this.time.now / 70) % 2 ? 0.45 : 1) : 1);
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
        this.vapenSprite.setVisible(true).setDepth(this.spiller.y + (this.retning === 'opp' ? -2 : 1));
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
            // Tredje slag i komboen kaster dobbelt så hardt.
            this.skadFiende(fiende, skade, kritisk, vinkelTil, sving.trinn === 3 ? 2 : 1);
            traff = true;
        }

        // Bommer hun på det tredje slaget, står hun i etterslep uten gard.
        this.kamp.etterSlag(sving.trinn, traff);

        if (traff) {
            // Hitstop etter vekt. Ett tall for alt gjør at ingenting føles tungt.
            const tungt = vk.tungt || sving.trinn === 3;
            this.hitstop(tungt ? KAMP.hitstopTungt : KAMP.hitstopLett);
            this.dytt(vinkel, tungt ? 6 : 3, tungt ? 140 : 110);
        } else if (sving.trinn === 3) {
            this.stovsky(this.spiller.x, this.spiller.y + 6, 4);
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
            this.flytTekst(this.spiller.x, this.spiller.y - 28, 'Ikke pust nok', '#9fb0c8');
            return;
        }

        const vinkel = this.retningsVinkel();
        const rekkevidde = (vapen?.rekkevidde ?? 30) * (vk.manover === 'stikk-gjennom' ? 1.35 : 0.8);
        const bue = vk.manover === 'stikk-gjennom' ? Math.PI / 6 : Math.PI / 2;

        this.angrepNedkjoling = 520;
        this.slagIgjen = 320;
        this.slagVarighet = 320;
        this.gardPress = 140;
        sfx.sving();

        const stats = maksVerdier(store);
        let traff = false;
        for (const fiende of this.fiender) {
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
            this.skadFiende(fiende, skade, false, vinkelTil, vk.manover === 'skjoldstot' ? 2.4 : 1.4);
            traff = true;
        }

        this.flytTekst(this.spiller.x, this.spiller.y - 30, MANOVER_NAVN[vk.manover], '#cfd8c0');
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

    /** Fargen fienden skal ha akkurat nå, uten at treff og varsel slår hverandre ut. */
    private settFiendeTint(fiende: Fiende) {
        if (fiende.onsketTint === null) fiende.sprite.clearTint();
        else fiende.sprite.setTint(fiende.onsketTint);
    }

    private skadFiende(
        fiende: Fiende,
        skade: number,
        kritisk: boolean,
        vinkel: number,
        kraftFaktor = 1
    ) {
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
        this.klask(fiende.sprite, kritisk ? 0.24 : 0.15);
        this.blodflekk(fiende.sprite.x, fiende.sprite.y, fiende.def.farge, kritisk ? 4 : 2, vinkel);
        this.flytTekst(
            fiende.sprite.x + Phaser.Math.Between(-4, 4),
            fiende.sprite.y - 20,
            kritisk ? `${skade}!` : `${skade}`,
            kritisk ? '#ffd166' : '#ffffff',
            kritisk ? 18 : 13
        );
        this.pikselSprut(fiende.sprite.x, fiende.sprite.y - 8, fiende.def.farge, kritisk ? 12 : 7);

        // Hvitt blink. Timeren setter tilbake den fargen fienden *skal* ha, i
        // stedet for å nulle alt - ellers visker et treff ut varselfargen når
        // fienden lader opp til å slå.
        fiende.sprite.setTintFill(0xffffff);
        this.time.delayedCall(70, () => {
            if (!fiende.dodd && fiende.sprite.active) this.settFiendeTint(fiende);
        });

        if (fiende.hp <= 0) {
            this.drepFiende(fiende, vinkel);
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
    private visHelsestolpe(fiende: Fiende) {
        if (fiende.def.kind === 'boss') return;
        if (!fiende.stolpe) {
            fiende.stolpe = this.add.graphics().setDepth(18000);
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

    private drepFiende(fiende: Fiende, vinkel = 0) {
        if (fiende.dodd) return;
        fiende.dodd = true;
        this.maaRyddeFiender = true;
        for (const c of fiende.collidere) this.physics.world.removeCollider(c);
        fiende.collidere.length = 0;
        fiende.stolpe?.destroy();
        fiende.stolpe = null;
        sfx.dod();
        this.pikselSprut(fiende.sprite.x, fiende.sprite.y - 8, fiende.def.farge, 20);

        const erBoss = fiende.def.kind === 'boss';

        // Avslutningen. Et drap skal ikke føles som at en helsestolpe nådde null:
        // bildet stopper, kameraet får dobbelt kick, og det ligger en blodbue
        // igjen på bakken etterpå.
        this.hitstop(KAMP.hitstopDrap);
        this.dytt(vinkel, erBoss ? 12 : 8, 220);
        this.blodflekk(fiende.sprite.x, fiende.sprite.y, fiende.def.farge, erBoss ? 26 : 9, vinkel);

        // De større fiendene tar fargen ut av bildet et øyeblikk. Vi gjør det ikke
        // på hver liten tåkedott - da blir det flimmer i stedet for tyngde.
        if (erBoss) {
            this.cameras.main.shake(600, 0.012);
            this.cameras.main.flash(500, 255, 255, 255);
        } else if (fiende.maksHp >= 34) {
            this.cameras.main.flash(120, 42, 44, 52);
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

        // Sølv og gjenstander spretter ut i en bue, med én klingende lyd per
        // objekt. Loot som bare dukker opp under fienden er en kvittering; loot
        // som spretter er en utbetaling.
        const solv = Phaser.Math.Between(2, 6) + Math.round(fiende.def.xp / 4);
        let nr = 0;
        this.slippLoot(fiende.sprite.x, fiende.sprite.y, null, solv, nr++);
        for (const drop of fiende.def.loot) {
            if (Math.random() < drop.sjanse) {
                this.slippLoot(fiende.sprite.x, fiende.sprite.y, drop.itemId, 0, nr++);
            }
        }

        if (erBoss) {
            store.felleBoss(fiende.def.id);
            this.boss = null;
            this.time.delayedCall(1200, () => fraSpill.emit('seier', {}));
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
            this.flytTekst(this.spiller.x, this.spiller.y - 26, 'Skjold!', '#cfd8c0');
            this.usarbarIgjen = 300;
            return;
        }

        const stats = maksVerdier(store);
        const faktisk = Math.max(1, Math.round(skade - stats.vern * 0.6));
        store.endreHp(-faktisk);
        this.usarbarIgjen = USARBAR_MS;
        sfx.skade();
        // Dyttet går bort fra treffet - eleven skal kjenne at hun ble slått bakover.
        this.dytt(this.retningsVinkel() + Math.PI, 7, 170);
        this.cameras.main.flash(120, 180, 20, 20);
        this.klask(this.spiller, 0.2);
        this.blodflekk(this.spiller.x, this.spiller.y, 0xc4241f, 3, this.retningsVinkel() + Math.PI);
        this.flytTekst(this.spiller.x, this.spiller.y - 26, `-${faktisk}`, '#ff8080', 15);

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
        // blodet fra forrige forsøk skal ikke ligge igjen på tunet.
        this.dyttTween?.remove();
        this.dyttTween = null;
        this.cameras.main.setFollowOffset(0, 0);
        for (const flekk of this.blodflekker) flekk.destroy();
        this.blodflekker = [];
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
                    piercing: Boolean(spell.piercing),
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
            if (fiende.frameTimer > 200) {
                fiende.frameTimer = 0;
                fiende.frame = (fiende.frame + 1) % FIENDE_RAMMER;
                sprite.setFrame(fiende.frame);
            }

            // Livsstolpen følger fienden og forsvinner av seg selv.
            if (fiende.stolpe) {
                fiende.stolpeTid -= delta;
                if (fiende.stolpeTid <= 0) fiende.stolpe.setVisible(false);
                else fiende.stolpe.setPosition(sprite.x, sprite.y - sprite.displayHeight * 0.85 - 6);
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
                            sprite.setVelocity(Math.cos(v) * def.fart * 0.35, Math.sin(v) * def.fart * 0.35);
                        } else {
                            sprite.setVelocity(0, 0);
                        }
                    }
                    if (avstand < def.aggro) {
                        fiende.tilstand = 'jager';
                        if (def.kind === 'boss' && !this.bossVekket) {
                            this.bossVekket = true;
                            sfx.bossBrol();
                            this.cameras.main.shake(700, 0.008);
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
                        this.settFiendeTint(fiende);
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
                        this.settFiendeTint(fiende);
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
        if (this.maaRyddeFiender) {
            this.maaRyddeFiender = false;
            this.fiender = this.fiender.filter((f) => !f.dodd || f.sprite.active);
        }
    }

    /**
     * Går mot spilleren, men glir langs hindringer i stedet for å presse seg
     * inn i dem. Med 130 trær på kartet er «gå rett mot spilleren» ikke et
     * kanttilfelle - det er normaltilstanden.
     */
    private jag(fiende: Fiende, fart: number) {
        const sprite = fiende.sprite;
        const dx = this.spiller.x - sprite.x;
        const dy = this.spiller.y - sprite.y;
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
        for (const annen of this.fiender) {
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
    private telegrafer(fiende: Fiende) {
        const merke = this.hentPartikkel('fx-ring');
        merke.setPosition(fiende.sprite.x, fiende.sprite.y + 2);
        merke.setTint(0xff8a6a).setAlpha(0.5).setScale(0.12).setDepth(fiende.sprite.y - 1);
        this.tweens.add({
            targets: merke,
            scale: 0.34,
            alpha: 0,
            duration: fiende.def.varsel,
            onComplete: () => this.slippPartikkel(merke),
        });
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
            // Skjoldet får si sitt først. Vinkelen er retningen fra eleven *mot*
            // den som slår, så et angrep i ryggen aldri kan blokkeres.
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
                return;
            }
            if (utfall.art === 'blokk') {
                this.blokk(fiende, utfall.skjoldBrast);
                return;
            }

            const forSkade = useRpgStore.getState().hp;
            this.skadSpiller(def.skade);
            // Bare støt eleven hvis treffet faktisk gikk gjennom. Ellers ble
            // farten uansett overskrevet av input allerede neste bilde.
            if (useRpgStore.getState().hp < forSkade) {
                this.kamp.meldTreff();
                const v = Math.atan2(this.spiller.y - fiende.sprite.y, this.spiller.x - fiende.sprite.x);
                this.spiller.setVelocity(Math.cos(v) * 190, Math.sin(v) * 190);
                this.stotIgjen = STOT_MS;
            }
        }
        this.pikselSprut(fiende.sprite.x, fiende.sprite.y - 6, def.farge, 5);
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
        this.flytTekst(this.spiller.x, this.spiller.y - 30, 'Parade!', '#fff2b0', 15);
        this.pikselSprut(this.skjoldSprite.x, this.skjoldSprite.y, 0xfff2b0, 14);
        this.klask(this.spiller, 0.1);

        // Angriperen mister balansen: full åpning. Kameraet dyttes *mot* henne,
        // ikke bort - det er hun som vant utvekslingen.
        const v = Math.atan2(fiende.sprite.y - this.spiller.y, fiende.sprite.x - this.spiller.x);
        this.dytt(v, 5, 150);
        fiende.sprite.setVelocity(Math.cos(v) * 240, Math.sin(v) * 240);
        this.klask(fiende.sprite, 0.2);
        fiende.tilstand = 'stotet';
        fiende.timer = STOT_MS * 3;
        fiende.onsketTint = null;
        this.settFiendeTint(fiende);
    }

    /** Vanlig blokk: skjoldet tok det, men det kostet pust og en flis av kanten. */
    private blokk(fiende: Fiende, brast: boolean) {
        this.gardPress = 160;
        // Lindetre, ikke jern. Blokken skal høres tørr ut - metallklangen er
        // paradens belønning, og den skal ikke deles med noe billigere.
        sfx.treSprak();
        const v = Math.atan2(this.spiller.y - fiende.sprite.y, this.spiller.x - fiende.sprite.x);
        this.dytt(v, 3, 110);
        this.skjoldFlis(this.skjoldSprite.x, this.skjoldSprite.y, v, brast ? 12 : 4);

        // Litt støt, så et blokkert slag fortsatt flytter eleven. Uten det står
        // hun som en vegg, og blokken mister vekt.
        this.spiller.setVelocity(Math.cos(v) * 70, Math.sin(v) * 70);

        if (brast) {
            sfx.skjoldBrudd();
            this.hitstop(KAMP.hitstopTungt);
            this.dytt(v, 9, 260);
            this.flytTekst(this.spiller.x, this.spiller.y - 30, 'Skjoldet brast!', '#ff9d6a', 15);
            useRpgStore.getState().varsle('Skjoldet gikk i to. Nå står du bar.', 'darlig');
            // Et kort pusterom, ellers lander neste slag i samme sekund som
            // skjoldet forsvant, og det leser som en straff for å ha blokkert.
            this.usarbarIgjen = Math.max(this.usarbarIgjen, 420);
        }
    }

    /** Treflis av skjoldkanten, langs blokkvinkelen. Gjør slitasjen synlig. */
    private skjoldFlis(x: number, y: number, vinkel: number, antall: number) {
        for (let i = 0; i < antall; i++) {
            const p = this.hentPartikkel('fx-flis');
            const v = vinkel + Phaser.Math.FloatBetween(-0.9, 0.9);
            const fart = Phaser.Math.Between(30, 90);
            p.setPosition(x, y).setDepth(19000).setAngle(Phaser.Math.Between(0, 360));
            this.tweens.add({
                targets: p,
                x: x + Math.cos(v) * fart,
                y: y + Math.sin(v) * fart + 14,
                angle: p.angle + Phaser.Math.Between(-180, 180),
                alpha: 0,
                duration: Phaser.Math.Between(320, 520),
                ease: 'Quad.Out',
                onComplete: () => this.slippPartikkel(p),
            });
        }
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
        const sprite = this.physics.add.sprite(x, y, `fiende-${def.id}`, 0);
        sprite.setOrigin(0.5, 0.85).setDepth(y);
        sprite.body!.setSize(10, 8);
        // Colliderne må tas vare på. Uten dette lå det igjen to per fiende for
        // alltid, og en halvtimes økt lekket over tusen av dem.
        const collidere = [
            this.physics.add.collider(sprite, this.data.get('vegger')),
            this.physics.add.collider(sprite, this.data.get('propKropper')),
        ];

        // Liten «trer fram av tåka»-effekt
        sprite.setAlpha(0).setScale(0.6);
        this.tweens.add({ targets: sprite, alpha: 1, scale: 1, duration: 320, ease: 'Back.Out' });

        this.fiender.push({
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
            collidere,
            stolpe: null,
            stolpeTid: 0,
            onsketTint: null,
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

    private slippLoot(x: number, y: number, itemId: string | null, solv: number, nr = 0) {
        const key = itemId ? (ITEM_BY_ID[itemId]?.slot === 'vapen' ? 'loot-bok' : 'loot-kiste') : 'loot-solv';
        const sprite = this.add.image(x, y, key).setDepth(y);
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
        this.tweens.add({ targets: sprite, x: mx, duration: 350, ease: 'Quad.Out' });
        this.tweens.add({
            targets: sprite,
            y: my - 13,
            duration: 190,
            ease: 'Quad.Out',
            onComplete: () => {
                if (sprite.active) {
                    this.tweens.add({ targets: sprite, y: my, duration: 160, ease: 'Quad.In' });
                }
            },
        });
        this.tweens.add({
            targets: sprite,
            scale: 1.12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
        });
        // Loot du aldri går bort til skal forsvinne. Før lå hvert eneste
        // sølvstykke igjen for alltid, hvert med en evig tween.
        this.loot.push({ sprite, itemId, solv, levetid: 45000 });
    }

    private oppdaterLoot(delta: number) {
        for (let i = this.loot.length - 1; i >= 0; i--) {
            const l = this.loot[i];
            l.levetid -= delta;
            if (l.levetid <= 0) {
                this.tweens.killTweensOf(l.sprite);
                l.sprite.destroy();
                this.loot.splice(i, 1);
                continue;
            }
            if (l.levetid < 4000) l.sprite.setAlpha(Math.floor(l.levetid / 160) % 2 ? 0.35 : 1);

            const d = Phaser.Math.Distance.Between(l.sprite.x, l.sprite.y, this.spiller.x, this.spiller.y);
            // Trekkes mot spilleren når hun er nær - alltid tilfredsstillende.
            if (d < 40) {
                const v = Math.atan2(this.spiller.y - l.sprite.y, this.spiller.x - l.sprite.x);
                const steg = (180 * delta) / 1000;
                l.sprite.x += Math.cos(v) * steg;
                l.sprite.y += Math.sin(v) * steg;
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
                this.tweens.killTweensOf(l.sprite);
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

        // Sammenlikningen gikk før via to JSON.stringify hver eneste frame.
        const ny = naermest ? { type: naermest.type, id: naermest.id } : null;
        const forrige = this.naerInteraksjon;
        if (ny?.id !== forrige?.id || ny?.type !== forrige?.type) {
            this.naerInteraksjon = ny;
            if (!ny) {
                fraSpill.emit('hint', { tekst: null });
            } else if (ny.type === 'npc') {
                const npc = NORDVIK_NPCS.find((n) => n.id === ny.id);
                fraSpill.emit('hint', { tekst: `E - snakk med ${npc?.name ?? 'noen'}` });
            } else {
                const lm = NORDVIK_LANDMARKS.find((l) => l.id === ny.id);
                fraSpill.emit('hint', { tekst: `E - ${lm?.kind === 'kiste' ? 'åpne' : 'les'} ${lm?.title}` });
            }
        }

        const pad = this.gamepad ?? this.input.gamepad?.pad1 ?? null;
        const brukTrykk =
            Phaser.Input.Keyboard.JustDown(this.taster.bruk) ||
            this.padKant(pad, 'Y') ||
            this.touchTrykk.has('bruk');
        if (brukTrykk && this.naerInteraksjon) {
            this.settLaast(true);
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
        this.settLaast(true);
        this.bossVakt = true;
        const runde = NORDVIK_BOSS_QUESTIONS.length - this.boss.skjold;
        fraSpill.emit('bossSporsmal', {
            runde: Math.max(0, Math.min(NORDVIK_BOSS_QUESTIONS.length - 1, runde)),
        });
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

    // ── Partikler og tall ───────────────────────────────────────────────────
    // Alt her gjenbrukes. Før ble det laget og ødelagt et Image + en Tween per
    // partikkel, og et helt nytt Text-objekt (= én ny GL-teksturopplasting) per
    // skadetall. Det er den klassiske kilden til hakk på en Chromebook-GPU.

    private hentPartikkel(nokkel: string): Phaser.GameObjects.Image {
        const p = this.partikkelPool.pop() ?? this.add.image(0, 0, nokkel);
        p.setTexture(nokkel)
            .setActive(true)
            .setVisible(true)
            .setAlpha(1)
            .setScale(1)
            .setAngle(0)
            .clearTint();
        return p;
    }

    private slippPartikkel(p: Phaser.GameObjects.Image) {
        p.setActive(false).setVisible(false);
        if (this.partikkelPool.length < 220) this.partikkelPool.push(p);
        else p.destroy();
    }

    /**
     * Flytende tall, tegnet med pikselfonten. Vektorfont skalert 3x av kameraet
     * var det mest uskarpe elementet i en ellers skarp pikselartscene.
     */
    private flytTekst(x: number, y: number, tekst: string, farge: string, storrelse = 1) {
        const skala = storrelse >= 15 ? 1.5 : 1;
        const bredde = tekst.length * GLYF.w * skala;
        const tint = Phaser.Display.Color.HexStringToColor(farge).color;
        const tegn: Phaser.GameObjects.Image[] = [];
        for (let i = 0; i < tekst.length; i++) {
            const bilde = this.hentPartikkel('font-tall');
            bilde.setFrame(glyfIndex(tekst[i]));
            bilde
                .setPosition(x - bredde / 2 + i * GLYF.w * skala, y)
                .setOrigin(0, 0.5)
                .setScale(skala)
                .setTint(tint)
                .setDepth(20000);
            tegn.push(bilde);
        }
        this.tweens.add({
            targets: tegn,
            y: y - 22,
            alpha: 0,
            duration: 720,
            ease: 'Quad.Out',
            onComplete: () => {
                for (const t of tegn) {
                    t.setOrigin(0.5, 0.5);
                    this.slippPartikkel(t);
                }
            },
        });
    }

    private pikselSprut(x: number, y: number, farge: number, antall: number) {
        for (let i = 0; i < antall; i++) {
            const bit = this.hentPartikkel('fx-bit');
            bit.setPosition(x, y).setTint(farge).setDepth(19000);
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
                onComplete: () => this.slippPartikkel(bit),
            });
        }
    }

    private stovsky(x: number, y: number, antall: number) {
        for (let i = 0; i < antall; i++) {
            const p = this.hentPartikkel('fx-prikk');
            p.setPosition(x, y).setTint(0xd8c89a).setDepth(y - 1).setAlpha(0.7);
            const v = Math.random() * Math.PI * 2;
            this.tweens.add({
                targets: p,
                x: x + Math.cos(v) * 14,
                y: y + Math.sin(v) * 7,
                alpha: 0,
                scale: 1.8,
                duration: 380,
                onComplete: () => this.slippPartikkel(p),
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

    /** Fargen på en fiende, brukt av grensesnittet. */
    static fiendeFarge(def: EnemyDef): string {
        return numToHex(def.farge);
    }
}
