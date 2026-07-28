// Bygger det som står stille: bakken, kollisjonen, objektene og atmosfæren.
//
// Modulen kjenner ingen spillregler og ingen bestemt sone. Den får kartet, temaet
// og landemerkene inn, så den kan bygge Nordvik i 793 like gjerne som et hvilket
// som helst annet sted.

import Phaser from 'phaser';
import type { Tema } from '../../types';
import { fraSpill } from '../bridge';
import { makeRng } from '../pixels';
import { TILE } from '../spriteforge';
import {
    FLIS_PRIORITET,
    FLIS_VARIANTER,
    type KantHjorne,
    type KantRetning,
    type TileKey,
} from '../tileforge';
import type { WorldMap } from '../worldgen';

/** Alt som svaier i vinden: hvilket bilde, hvor i takten, og hvor mye. */
interface Svai {
    bilde: Phaser.GameObjects.Image;
    fase: number;
    amplitude: number;
}

export class Verden {
    private scene: Phaser.Scene;
    private kart: WorldMap;
    private tema: Tema;

    private vannLag: Phaser.GameObjects.RenderTexture[] = [];
    private vannFrame = 0;
    private svaiende: Svai[] = [];
    private tid = 0;

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

        // Hvor dypt vannet er: hvor mange ruter det er ut til nærmeste land.
        // Brukes bare til å velge mellom to farger, men det er nok til at
        // fjorden får en bunn som skråner i stedet for å være en blå flate.
        const dybdeKart = this.maalVanndybde();
        const vannNokkel = (x: number, y: number) =>
            dybdeKart[y][x] >= 3 ? 'flis-vanndyp' : 'flis-vann';

        const vannRuter: [number, number][] = [];
        for (let y = 0; y < hoyde; y++) {
            for (let x = 0; x < bredde; x++) {
                const flis = terreng[y][x];
                if (flis === 'vann') {
                    vannRuter.push([x, y]);
                    // Stillestående vann bakes inn, så det aldri blir hull i kartet.
                    rt.drawFrame(`${vannNokkel(x, y)}-stille`, undefined, x * TILE, y * TILE);
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

        // ── Blomstene bakes inn ─────────────────────────────────────────────
        // De ligger på bakken, de er ni piksler høye, og ingen går noen gang
        // bak dem. Da har de ingenting i visningslista å gjøre: hundre og ti
        // egne bilder ville vært hundre og ti sorteringer og tegnekall per
        // bilde, for detaljer som aldri flytter seg i forhold til gresset.
        //
        // Prisen er at de ikke kan svaie. Den er verdt å betale: det er trærne
        // som selger vinden, ikke blomstene, og trærne svaier fortsatt.
        for (const prop of this.kart.props) {
            if (prop.kind !== 'blomst') continue;
            const bilde = this.scene.textures.get(`prop-blomst-${prop.variant}`).getSourceImage();
            // `draw` setter øvre venstre hjørne, mens propsene er plassert
            // etter origo (0,5 / 0,85). Uten forskyvningen står blomstene et
            // halvt bilde nord-vest for der de hører hjemme.
            rt.draw(
                `prop-blomst-${prop.variant}`,
                prop.x - bilde.width / 2,
                prop.y - bilde.height * 0.85
            );
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
                    lag.drawFrame(
                        `${vannNokkel(x, y)}-${frame}`,
                        undefined,
                        x * TILE - bx,
                        y * TILE - by
                    );
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
     * Avstanden fra hver vannrute ut til nærmeste land, i ruter.
     *
     * En bølgefront som sprer seg innover fra kysten: alt land er 0, og hver
     * runde legger ett hakk på naboene som ennå ikke er nådd. Kartet er 60x50,
     * så dette er ferdig før noen rekker å se på det.
     */
    private maalVanndybde(): number[][] {
        const { bredde, hoyde, terreng } = this.kart;
        const dybde: number[][] = [];
        const front: [number, number][] = [];
        for (let y = 0; y < hoyde; y++) {
            dybde[y] = [];
            for (let x = 0; x < bredde; x++) {
                const vann = terreng[y][x] === 'vann';
                dybde[y][x] = vann ? Infinity : 0;
                if (!vann) front.push([x, y]);
            }
        }
        for (let i = 0; i < front.length; i++) {
            const [x, y] = front[i];
            for (const [dx, dy] of [
                [0, -1],
                [0, 1],
                [-1, 0],
                [1, 0],
            ]) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= bredde || ny >= hoyde) continue;
                if (dybde[ny][nx] !== Infinity) continue;
                dybde[ny][nx] = dybde[y][x] + 1;
                front.push([nx, ny]);
            }
        }
        // Vann helt uten land i nærheten (et kart som er bare hav) ville ellers
        // stå igjen som Infinity og alltid telles som dypt. Det er riktig svar.
        return dybde;
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
        const rng = makeRng(60313);

        for (const prop of this.kart.props) {
            // Blomstene er bakt inn i bakketeksturen (se byggTerreng).
            if (prop.kind === 'blomst') continue;
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

            // Løvverket svaier. Origo ligger på 0,85 av høyden - altså nede ved
            // roten - så en rotasjon vipper krona og lar stammen stå. Utslaget
            // er med vilje bittelite: to-tre grader. Mer enn det, og skogen ser
            // ut som den danser i stedet for å puste.
            const utslag: Record<string, number> = { tre: 0.05, busk: 0.032 };
            if (utslag[prop.kind] !== undefined) {
                this.svaiende.push({
                    bilde,
                    fase: rng() * Math.PI * 2,
                    amplitude: utslag[prop.kind] * (0.7 + rng() * 0.6),
                });
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
     * Himmeltonen legges av React oppå lerretet (se `Atmosfare` i RpgPage). Da
     * slipper den å kjempe mot kamerazoomen, og den blir skarp uansett
     * skjermoppløsning.
     *
     * Alt annet i lufta - skyer, tåke, røyk, gnister, fugler - bor i `Vaer`.
     * Det lå her før, og det gjorde denne modulen til to ting på én gang.
     */
    meldHimmel(): void {
        fraSpill.emit('atmosfare', { himmel: this.tema.himmel });
    }

    /**
     * Får skogen til å puste. `kastevind` kommer fra `Vaer`, så løvverket og
     * skydekket driver etter samme vind - det er den delte kilden som gjør at
     * det leser som vær og ikke som to uavhengige animasjoner.
     */
    oppdaterSvai(delta: number, kastevind: (x: number) => number): void {
        this.tid += delta / 1000;
        for (const s of this.svaiende) {
            s.bilde.rotation =
                Math.sin(this.tid * 1.9 + s.fase) * s.amplitude * kastevind(s.bilde.x);
        }
    }
}
