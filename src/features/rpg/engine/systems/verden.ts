// Bygger det som står stille: bakken, kollisjonen, objektene og atmosfæren.
//
// Modulen kjenner ingen spillregler og ingen bestemt sone. Den får kartet, temaet
// og landemerkene inn, så den kan bygge Nordvik i 793 like gjerne som et hvilket
// som helst annet sted.

import Phaser from 'phaser';
import type { LandmarkDef, Tema } from '../../types';
import { fraSpill } from '../bridge';
import { hexToNum } from '../pixels';
import { TILE } from '../spriteforge';
import {
    FLIS_PRIORITET,
    FLIS_VARIANTER,
    type KantHjorne,
    type KantRetning,
    type TileKey,
} from '../tileforge';
import type { WorldMap } from '../worldgen';

/** Hvor mange tåkeflak som driver over verden. Holdt nede med vilje, se under. */
const TAAKEFLAK = 14;

export class Verden {
    private scene: Phaser.Scene;
    private kart: WorldMap;
    private tema: Tema;

    private vannLag: Phaser.GameObjects.RenderTexture[] = [];
    private vannFrame = 0;
    /**
     * `grunnAlpha` er tettheten flaket ble bygget med. Uten den ville en
     * nedtoning til null gjort at oppturen etterpå ganget med null - og tåka
     * ville aldri kommet tilbake etter det første klippet.
     */
    private taakeflak: { bilde: Phaser.GameObjects.Image; fart: number; grunnAlpha: number }[] =
        [];
    private baalLys: Phaser.GameObjects.Image[] = [];
    private baalPuls = 0;

    constructor(scene: Phaser.Scene, kart: WorldMap, tema: Tema) {
        this.scene = scene;
        this.kart = kart;
        this.tema = tema;
    }

    /**
     * Bakken tegnes én gang inn i én stor tekstur. Da koster den ett tegnekall
     * i stedet for tre tusen sprites.
     *
     * Det viktige her er andre runde: hver rute ser på naboene sine, og hvis en
     * nabo har en flis som «vinner» (se FLIS_PRIORITET), legges naboens kant
     * oppå. Uten det møtes gress, sand og vann i harde 16-pikslers trapper over
     * hele kartet.
     */
    byggTerreng(): void {
        const { bredde, hoyde, terreng } = this.kart;
        const rt = this.scene.add.renderTexture(0, 0, bredde * TILE, hoyde * TILE);
        rt.setOrigin(0, 0).setDepth(-1000);

        const flisPa = (x: number, y: number): TileKey => {
            if (x < 0 || y < 0 || x >= bredde || y >= hoyde)
                return (
                    terreng[Math.min(Math.max(y, 0), hoyde - 1)]?.[
                        Math.min(Math.max(x, 0), bredde - 1)
                    ] ?? 'gress'
                );
            return terreng[y][x];
        };
        // Fast variant per rute, så verden ser lik ut hver gang.
        const variantFor = (x: number, y: number, flis: TileKey) => {
            const h = (x * 73856093) ^ (y * 19349663) ^ (flis.length * 2654435761);
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
                rt.drawFrame(
                    `flis-${flis}-${variantFor(x, y, flis)}`,
                    undefined,
                    x * TILE,
                    y * TILE
                );
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
                    rt.drawFrame(
                        `kant-${kantNavn(nabo)}-${retning}`,
                        undefined,
                        x * TILE,
                        y * TILE
                    );
                }
                for (const [hjorne, dx, dy] of hjorner) {
                    const nabo = flisPa(x + dx, y + dy);
                    if (FLIS_PRIORITET[nabo] <= minPrio) continue;
                    // Hjørnet skal bare fylles når ingen av de to sidene alt gjør jobben.
                    if (flisPa(x + dx, y) === nabo || flisPa(x, y + dy) === nabo) continue;
                    rt.drawFrame(
                        `hjorne-${kantNavn(nabo)}-${hjorne}`,
                        undefined,
                        x * TILE,
                        y * TILE
                    );
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
                const lag = this.scene.add.renderTexture(
                    bx,
                    by,
                    (maksX - minX + 1) * TILE,
                    (maksY - minY + 1) * TILE
                );
                lag.setOrigin(0, 0)
                    .setDepth(-999)
                    .setVisible(frame === 0);
                for (const [x, y] of vannRuter) {
                    lag.drawFrame(`flis-vann-${frame}`, undefined, x * TILE - bx, y * TILE - by);
                }
                this.vannLag.push(lag);
            }
            this.scene.time.addEvent({
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
        const boks = this.scene.add.rectangle(x, y, w, h);
        boks.setVisible(false);
        this.scene.physics.add.existing(boks, true);
        gruppe.add(boks);
        // Boksen skal aldri tegnes, og den har ingenting i visningslista å
        // gjøre: 286 usynlige rektangler der var nok til å tredoble lengden på
        // lista som sorteres etter dybde hver frame.
        this.scene.children.remove(boks);
        return boks;
    }

    /** Legger kollisjonsgruppa på `scene.data` under `vegger`. */
    byggKollisjon(): void {
        // Naboruter slås sammen til lange rektangler, så vi får noen hundre
        // kollisjonsbokser i stedet for flere tusen.
        const { bredde, hoyde, blokkert } = this.kart;
        const vegger = this.scene.physics.add.staticGroup();
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
        this.scene.data.set('vegger', vegger);
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
     *
     * Legger kroppene på `scene.data` under `propKropper`.
     */
    byggProps(): void {
        const solide = this.scene.physics.add.staticGroup();

        for (const prop of this.kart.props) {
            const nokkel =
                prop.kind === 'tre' || prop.kind === 'busk' || prop.kind === 'stein'
                    ? `prop-${prop.kind}-${prop.variant}`
                    : `prop-${prop.kind}`;

            const bilde = this.scene.add.image(prop.x, prop.y, nokkel);
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
        this.scene.data.set('propKropper', solide);

        // Bål på tingplassen.
        //
        // Animasjonsmanageren er global for hele spillet, mens flisene lages på
        // nytt for hvert sted. Uten å fjerne den gamle først blir «baal»
        // liggende og peke på bilder som er slettet, og `anims.create` nekter å
        // erstatte en nøkkel som finnes. Første landemerke som spilte den etter
        // en reise krasjet på «sourceSize of null», midt i byggingen av verden.
        this.scene.anims.remove('baal');
        this.scene.anims.create({
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

    /**
     * `taake` er hvor tykk Glemselen ligger her. 1 er Nordvik. Hallen har
     * mindre, for den ligger utenfor tiden - men ikke null, for tåka er selve
     * temaet i spillet, og et sted uten den ser ut som et annet spill.
     */
    byggAtmosfare(landemerker: LandmarkDef[], taake = 1): void {
        // Himmeltonen og vignetten legges av React oppå lerretet (se
        // `Atmosfare` i RpgPage). Da slipper de å kjempe mot kamerazoomen, og
        // de blir skarpe uansett skjermoppløsning.
        fraSpill.emit('atmosfare', { himmel: this.tema.himmel });

        // Tåkeslør som driver over verden. Dette er selve temaet i spillet:
        // Glemselen er tåke, og før fantes den bare i teksten.
        // Antallet er holdt nede med vilje: hvert flak er en stor gjennomsiktig
        // flate, og overtegning er det som koster på en svak Chromebook-GPU.
        for (let i = 0; i < Math.round(TAAKEFLAK * taake); i++) {
            const naer = i % 2 === 0;
            const lag = this.scene.add
                .image(
                    Math.random() * this.kart.bredde * TILE,
                    Math.random() * this.kart.hoyde * TILE,
                    'fx-taake'
                )
                // Ett lag under figurene og ett over: da får tåka dybde.
                .setDepth(naer ? 29000 : -850)
                .setScale(naer ? 1.8 + Math.random() * 1.2 : 3 + Math.random() * 2)
                .setAlpha(naer ? 0.11 + Math.random() * 0.07 : 0.15 + Math.random() * 0.09)
                .setTint(hexToNum(this.tema.himmel));
            this.taakeflak.push({
                bilde: lag,
                fart: (naer ? 11 : 4) + Math.random() * 7,
                grunnAlpha: lag.alpha,
            });
        }

        // Bålet lyser. Ett bål i hele bygda, og det ga null lys.
        for (const lm of landemerker) {
            if (lm.kind !== 'baal') continue;
            const [tx, ty] = lm.tile;
            const glo = this.scene.add
                .image(tx * TILE + 8, ty * TILE + 4, 'fx-glo')
                .setTint(0xffb23f)
                .setAlpha(0.3)
                .setScale(2.2)
                .setDepth(-800)
                .setBlendMode(Phaser.BlendModes.ADD);
            this.baalLys.push(glo);
        }
    }

    /**
     * Toner tåkelaget opp eller ned. Cutscenene bruker den som vær: stranda
     * ved Lindisfarne skal ikke ligge like tykk som naustet hjemme.
     *
     * Flakkene bygges én gang og tones - de rives ikke og bygges på nytt. Å
     * lage tolv store gjennomsiktige flater midt i et klipp gir et hakk
     * nøyaktig der klippet skal være rolig.
     */
    settTaake(tetthet: number, ms: number): void {
        for (const flak of this.taakeflak) {
            const mal = flak.grunnAlpha * Math.max(0, tetthet);
            if (ms <= 0) {
                flak.bilde.setAlpha(mal);
                continue;
            }
            this.scene.tweens.add({ targets: flak.bilde, alpha: mal, duration: ms });
        }
    }

    oppdaterAtmosfare(delta: number): void {
        const dt = delta / 1000;
        const kartB = this.kart.bredde * TILE;
        for (const flak of this.taakeflak) {
            flak.bilde.x += flak.fart * dt;
            if (flak.bilde.x > kartB + 120) flak.bilde.x = -120;
        }
        // Bålet flakker.
        this.baalPuls += delta;
        const puls =
            0.26 + Math.sin(this.baalPuls / 190) * 0.05 + Math.sin(this.baalPuls / 71) * 0.03;
        for (const lys of this.baalLys) lys.setAlpha(puls);
    }
}
