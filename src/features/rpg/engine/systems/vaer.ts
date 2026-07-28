// Været. Alt som ligger *over* verden og aldri kolliderer med noe: skyskygger
// som driver, tåke langs bakken, røyk fra takene, gnister fra bålet, glitter på
// fjorden, fnugg i lufta og fugler som krysser himmelen.
//
// Modulen kjenner ingen spillregler og ingen bestemt sone. Den får kartet,
// temaet og landemerkene inn, akkurat som `Verden`.
//
// **Skyene og tåka er ikke her.** De lå her først, som tjue store
// gjennomsiktige bilder som drev over kartet, og de kostet halve
// bildefrekvensen i ren overtegning. Begge regnes nå ut i etterbehandlingen -
// se `engine/verdenfx.ts`.
//
// Skillet som ble igjen er skarpt og verdt å holde på: **her bor det som har en
// plass i verden.** Røyken kommer opp av et bestemt tak, gnistene fra et
// bestemt bål, glitteret ligger der det faktisk er vann. Alt som er like sant
// over hele kartet - skydekke, tåke, lys - hører hjemme i shaderen, fordi det
// ikke trenger å vite hvor det er.

import Phaser from 'phaser';
import type { LandmarkDef, Tema, Vaerlag } from '../../types';
import { createPainter, makeRng } from '../pixels';
import { TILE } from '../spriteforge';
import type { WorldMap } from '../worldgen';

/** Været på en vanlig dag. Et tema uten eget `vaer` får dette. */
export const STANDARD_VAER: Vaerlag = {
    skyggedybde: 0.45,
    skyfart: 18,
    skyfarge: '#93a9c8',
    taake: 0.1,
    taakefarge: '#dce8f2',
    vind: 1,
    fnugg: 1,
    fugler: true,
};

const DYBDE_FUGL = 30500;

function addCanvas(scene: Phaser.Scene, key: string, painter: { canvas: HTMLCanvasElement }): void {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const texture = scene.textures.createCanvas(key, painter.canvas.width, painter.canvas.height);
    if (!texture) return;
    texture.context.drawImage(painter.canvas, 0, 0);
    texture.refresh();
}

/**
 * Slår av piksel-filteret på én tekstur.
 *
 * Spillet kjører med `pixelArt: true`, som setter NEAREST på alt. Det er
 * riktig for hver eneste flis og figur - og feil for hver eneste myke
 * gradient. En skyskygge på 192 piksler blåst opp tre ganger med NEAREST blir
 * en trapp av firkanter, og da leser den som et lavoppløst bilde i stedet for
 * som en sky. Disse fire teksturene er de eneste i spillet som ikke er
 * pikselkunst, og de er de eneste som skal ha LINEAR.
 */
function mykne(scene: Phaser.Scene, ...nokler: string[]): void {
    for (const nokkel of nokler) {
        if (scene.textures.exists(nokkel)) {
            scene.textures.get(nokkel).setFilter(Phaser.Textures.FilterMode.LINEAR);
        }
    }
}

export function forgeVaer(scene: Phaser.Scene): void {
    // Gloa og røykflekken lages i `forgeEffects`, som kjører rett før denne.
    // De er de eneste myke gradientene som er igjen i scenen.
    mykne(scene, 'fx-glo', 'fx-taake');

    // ── Glitter på vannet ───────────────────────────────────────────────────
    // Et lite kors, ikke en prikk. Prikken forsvinner i bølgene; korset leser
    // som et blink fordi øyet kjenner igjen stjerneformen fra ekte gjenskinn.
    const glimt = createPainter(7, 7);
    glimt.hline(1, 3, 5, 'rgba(255,255,255,0.65)');
    glimt.vline(3, 1, 5, 'rgba(255,255,255,0.65)');
    glimt.rect(2, 2, 3, 3, 'rgba(255,255,255,0.85)');
    glimt.px(3, 3, '#ffffff');
    addCanvas(scene, 'fx-glimt', glimt);

    // ── Fugl: tre rammer med vingeslag ──────────────────────────────────────
    const FB = 9;
    const FH = 7;
    const ark = createPainter(FB * 3, FH);
    const vinger: [number, number][][] = [
        // Opp, midt, ned. Fuglen er fem piksler bred - den skal leses som en
        // strek i det fjerne, ikke som et dyr.
        [
            [0, 0],
            [1, 1],
            [3, 2],
            [5, 1],
            [6, 0],
        ],
        [
            [0, 2],
            [1, 2],
            [3, 3],
            [5, 2],
            [6, 2],
        ],
        [
            [0, 4],
            [1, 3],
            [3, 3],
            [5, 3],
            [6, 4],
        ],
    ];
    vinger.forEach((form, f) => {
        for (const [x, y] of form) {
            ark.rect(f * FB + 1 + x, 1 + y, 1, 1, '#20242e');
            ark.rect(f * FB + 1 + x, 2 + y, 1, 1, 'rgba(32,36,46,0.55)');
        }
    });
    if (scene.textures.exists('fx-fugl')) scene.textures.remove('fx-fugl');
    const fugleArk = scene.textures.addSpriteSheet(
        'fx-fugl',
        ark.canvas as unknown as HTMLImageElement,
        { frameWidth: FB, frameHeight: FH }
    );
    if (fugleArk) {
        scene.anims.remove('fugl-flaks');
        scene.anims.create({
            key: 'fugl-flaks',
            frames: scene.anims.generateFrameNumbers('fx-fugl', { frames: [0, 1, 2, 1] }),
            frameRate: 7,
            repeat: -1,
        });
    }
}

export class Vaer {
    private scene: Phaser.Scene;
    private kart: WorldMap;
    private lag: Vaerlag;

    private baalLys: Phaser.GameObjects.Image[] = [];
    private fnugg: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private fnuggSone: Phaser.Geom.Rectangle | null = null;
    private tid = 0;

    constructor(scene: Phaser.Scene, kart: WorldMap, tema: Tema) {
        this.scene = scene;
        this.kart = kart;
        this.lag = tema.vaer ?? STANDARD_VAER;
    }


    bygg(landemerker: LandmarkDef[]): void {
        this.byggGlitter();
        this.byggRoyk();
        this.byggBaal(landemerker);
        this.byggFnugg();
        this.byggFugler();
    }


    // ── Glitter på fjorden ──────────────────────────────────────────────────

    /**
     * Blink der sola treffer bølgetoppene. Dette er det billigste triksene i
     * hele modulen og det som gir mest: stillestående vann leser som gulv,
     * blinkende vann leser som vann.
     */
    private byggGlitter(): void {
        const rng = makeRng(31337);
        const vannruter: [number, number][] = [];
        for (let y = 1; y < this.kart.hoyde - 1; y++) {
            for (let x = 1; x < this.kart.bredde - 1; x++) {
                if (this.kart.terreng[y][x] === 'vann') vannruter.push([x, y]);
            }
        }
        if (vannruter.length === 0) return;

        const antall = Math.min(30, Math.floor(vannruter.length * 0.09));
        for (let i = 0; i < antall; i++) {
            const [tx, ty] = vannruter[Math.floor(rng() * vannruter.length)];
            const g = this.scene.add
                .image(tx * TILE + rng() * TILE, ty * TILE + rng() * TILE, 'fx-glimt')
                .setDepth(-998)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setScale(0.55 + rng() * 0.5)
                .setAlpha(0);
            this.scene.tweens.add({
                targets: g,
                alpha: { from: 0, to: 0.25 + rng() * 0.35 },
                duration: 420 + rng() * 620,
                delay: rng() * 3400,
                yoyo: true,
                repeat: -1,
                repeatDelay: 500 + rng() * 3200,
                ease: 'Sine.easeInOut',
            });
        }
    }

    // ── Røyk fra takene ─────────────────────────────────────────────────────

    /** Et hus uten røyk er en kulisse. Et hus med røyk er noen som bor der. */
    private byggRoyk(): void {
        const tak: Record<string, number> = { langhus: 40, bu: 26, naust: 24 };
        for (const prop of this.kart.props) {
            const hoyde = tak[prop.kind];
            if (hoyde === undefined) continue;
            const x = prop.x + (prop.kind === 'langhus' ? -6 : 0);
            const y = prop.y - hoyde;
            this.scene.add
                .particles(x, y, 'fx-taake', {
                    lifespan: { min: 2800, max: 4600 },
                    speedY: { min: -22, max: -10 },
                    speedX: { min: 3, max: 16 },
                    scale: { start: 0.14, end: 0.72 },
                    alpha: { start: 0.26, end: 0 },
                    tint: [0xe6e0d4, 0xc8c4bc],
                    frequency: 360,
                    quantity: 1,
                    rotate: { min: -12, max: 12 },
                })
                .setDepth(prop.y + 40);
        }
    }

    // ── Bålet ───────────────────────────────────────────────────────────────

    private byggBaal(landemerker: LandmarkDef[]): void {
        for (const lm of landemerker) {
            if (lm.kind !== 'baal') continue;
            const x = lm.tile[0] * TILE + 8;
            const y = lm.tile[1] * TILE + 4;

            // To gloer i stedet for én: en vid, svak som farger bakken rundt,
            // og en tett, sterk i selve flammen. Ett enkelt lys blir enten en
            // stor grøtete flekk eller et hardt punkt - aldri begge deler.
            for (const [skala, alfa] of [
                [3.4, 0.22],
                [1.5, 0.42],
            ]) {
                this.baalLys.push(
                    this.scene.add
                        .image(x, y, 'fx-glo')
                        .setTint(0xffb23f)
                        .setAlpha(alfa)
                        .setScale(skala)
                        .setDepth(-800)
                        .setBlendMode(Phaser.BlendModes.ADD)
                );
            }

            // Gnister som stiger og dør ut.
            this.scene.add
                .particles(x, y - 4, 'fx-prikk', {
                    lifespan: { min: 800, max: 1900 },
                    speedY: { min: -46, max: -18 },
                    speedX: { min: -10, max: 16 },
                    scale: { start: 0.9, end: 0 },
                    alpha: { start: 1, end: 0 },
                    tint: [0xffd27a, 0xff9a3c, 0xff6a2a],
                    blendMode: Phaser.BlendModes.ADD,
                    frequency: 120,
                    quantity: 1,
                })
                .setDepth(lm.tile[1] * TILE + 30);
        }
    }

    // ── Fnugg i lufta ───────────────────────────────────────────────────────

    /**
     * Pollen og støv som driver forbi. Sendes bare der kameraet står, ikke over
     * hele kartet - 95 % av partiklene ville ellers levd og dødd usett.
     */
    private byggFnugg(): void {
        if (this.lag.fnugg <= 0) return;
        const cam = this.scene.cameras.main;
        const w = cam.width / cam.zoom + 80;
        const h = cam.height / cam.zoom + 80;
        this.fnuggSone = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);

        this.fnugg = this.scene.add
            .particles(cam.midPoint.x, cam.midPoint.y, 'fx-prikk', {
                lifespan: { min: 3200, max: 6400 },
                speedX: { min: 4, max: 22 },
                speedY: { min: -7, max: 7 },
                scale: { min: 0.22, max: 0.5 },
                // Fnugget skal tone inn *og* ut, ikke poppe fram og forsvinne.
                // En sinuskurve over levetiden gjør den jobben uten en tween
                // per partikkel - `start`/`end` kan bare gå én vei.
                alpha: {
                    onEmit: () => 0,
                    onUpdate: (_p: unknown, _k: string, t: number) => Math.sin(t * Math.PI) * 0.5,
                },
                tint: [0xfff4d0, 0xe8f0ff],
                blendMode: Phaser.BlendModes.ADD,
                frequency: Math.max(60, 260 / this.lag.fnugg),
                quantity: 1,
                // Rektangelet *har* `getRandomPoint`, men Phasers typer venter
                // en returverdi på `void` og får en `Point`. Casten er ren
                // typestøy, ikke en påstand om at dette virker ved et uhell.
                emitZone: {
                    type: 'random' as const,
                    source: this
                        .fnuggSone as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
                },
            })
            .setDepth(28000);
    }

    // ── Fuglene ─────────────────────────────────────────────────────────────

    /**
     * En flokk krysser himmelen med noen minutters mellomrom. De gjør ingenting
     * og betyr ingenting - og det er nettopp derfor de virker. En verden der alt
     * som beveger seg vil deg noe, er en verden av oppgaver.
     */
    private byggFugler(): void {
        if (!this.lag.fugler) return;
        const rng = makeRng(1789);
        const slipp = () => {
            const cam = this.scene.cameras.main;
            const motHoyre = rng() > 0.4;
            const y = cam.midPoint.y + (rng() - 0.5) * cam.height * 0.8;
            const bredde = cam.width / cam.zoom;
            const startX = cam.midPoint.x + (motHoyre ? -bredde : bredde) * 0.75;
            const sluttX = cam.midPoint.x + (motHoyre ? bredde : -bredde) * 0.9;
            const antall = 2 + Math.floor(rng() * 4);

            for (let i = 0; i < antall; i++) {
                const f = this.scene.add
                    .sprite(startX - i * 14 * (motHoyre ? 1 : -1), y + (rng() - 0.5) * 22, 'fx-fugl')
                    .setDepth(DYBDE_FUGL)
                    .setScale(1)
                    .setFlipX(!motHoyre)
                    .setAlpha(0.75);
                f.play('fugl-flaks');
                // Litt utakt i vingeslagene. En flokk som flakser synkront
                // leser som en enkelt gjenstand.
                f.anims.setProgress(rng());
                const varighet = 5200 + rng() * 2600;
                this.scene.tweens.add({
                    targets: f,
                    x: sluttX,
                    y: y + (rng() - 0.5) * 60,
                    duration: varighet,
                    ease: 'Sine.easeInOut',
                    onComplete: () => f.destroy(),
                });
            }
        };

        this.scene.time.addEvent({
            delay: 9000,
            loop: true,
            startAt: 6000,
            callback: () => {
                if (rng() > 0.45) slipp();
            },
        });
    }

    // ── Hvert bilde ─────────────────────────────────────────────────────────

    oppdater(delta: number): void {
        const dt = delta / 1000;
        this.tid += dt;


        // Bålet flakker. To frekvenser, så det aldri blir en ren sinus.
        const puls = 1 + Math.sin(this.tid * 5.3) * 0.16 + Math.sin(this.tid * 13.7) * 0.09;
        this.baalLys.forEach((lys, i) => lys.setScale((i === 0 ? 3.4 : 1.5) * puls));

        // Fnugget følger kameraet.
        if (this.fnugg) {
            const mid = this.scene.cameras.main.midPoint;
            this.fnugg.setPosition(mid.x, mid.y);
        }
    }

    /** Vindstyrken der `x` står, mellom 0 og 1. Trærne svaier etter denne. */
    kastevind(x: number): number {
        const bolge = Math.sin(x * 0.0055 - this.tid * 0.55);
        const puste = Math.sin(this.tid * 0.23 + 1.7);
        return this.lag.vind * (0.5 + 0.3 * bolge + 0.2 * puste);
    }

    /** Sekunder siden stedet ble bygget. Etterbehandlingen leser denne. */
    get sekunder(): number {
        return this.tid;
    }
}
