// De andre i hallen: figurene, navnene og følelsene deres.
//
// Laget kjenner ikke Firebase og importerer det ikke. Det får en ferdig liste
// over gjester inn over broen og tegner den. Skulle transporten byttes ut i
// morgen, står dette urørt - og viktigere: ingen epoke kan komme til å dra inn
// nettverkskode ved å bruke en figur herfra.
//
// Det som er vanskelig her er ikke å tegne en figur til. Det er at meldingene
// kommer ti ganger i sekundet mens skjermen tegner seksti. Tegner vi rå
// posisjoner, teleporterer folk (fallgruve 7). Derfor ligger hele laget
// **bakpå**: vi tegner hallen slik den var for et øyeblikk siden, og glir jevnt
// mellom de to siste prøvene vi har fått.

import Phaser from 'phaser';
import { figurLook } from '../../data/eleven';
import { FOLELSE_MS } from '../../data/folelser';
import type { Gjest } from '../../types';
import {
    FIG_ORIGIN_Y,
    POSITUR_LENGDE,
    forgeHumanoid,
    heltFrame,
    skrivPiksel,
    type PikselTekst,
} from '../spriteforge';

/**
 * Hvor langt bakpå vi tegner.
 *
 * Litt mer enn ett meldingsintervall. Da har vi nesten alltid en nyere prøve å
 * gli *mot*, og bevegelsen blir jevn i stedet for å hakke hver gang nettet er
 * en tanke sent. Prisen er at en medelev står 120 ms i fortiden - og det merker
 * ingen når det ikke finnes noe å treffe hverandre med.
 */
const ETTERSLEP_MS = 120;

/**
 * Hvor lenge vi gjetter videre når en melding blir borte.
 *
 * Gjettingen finnes for å dekke *én* tapt melding. Den skal ikke dekke at noen
 * har sluttet å sende: en elev som fryser skal se ut som en som står stille,
 * ikke som en som glir bortover for alltid.
 */
const EKSTRAPOLER_MAKS_MS = 200;

/**
 * Hvor langt gjettingen får bære, i piksler.
 *
 * En figur kan ikke bevege seg mer enn omtrent tjue piksler på to hundre
 * millisekunder. Uten taket kan én rar melding - hun reiste bort og kom
 * tilbake, og prøvene ligger et halvt kart fra hverandre - kaste figuren ut av
 * verden i et femtedels sekund før den finner tilbake.
 */
const EKSTRAPOLER_MAKS_PX = 24;

/** Så mange forskjellige utseender vi smir før vi begynner å gjenbruke. */
const MAKS_TEKSTURER = 12;

interface Proeve {
    x: number;
    y: number;
    t: number;
}

interface Figur {
    id: string;
    sprite: Phaser.GameObjects.Sprite;
    navnetekst: PikselTekst;
    navn: string;
    /** De to siste prøvene vi har fått. Vi tegner et sted mellom dem. */
    forrige: Proeve;
    siste: Proeve;
    data: Gjest;
    /** Animasjonsfasen går på vår egen klokke - den sendes ikke over nettet. */
    fase: number;
    faseTimer: number;
    boble: Phaser.GameObjects.Text | null;
    bobleIgjen: number;
    bobleTegn: string | null;
}

export class Gjester {
    private scene: Phaser.Scene;
    private figurer = new Map<string, Figur>();
    /** Teksturnøkler vi allerede har smidd, etter utseende-signatur. */
    private teksturer = new Map<string, string>();
    private klokke = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Nytt bilde av rommet. Kalles hver gang noen der ute rører seg.
     *
     * Merk at posisjonen ikke settes her - den legges i prøvekøen. Setter man
     * den rett på sprite-en, er hele etterslepet bortkastet og figurene hopper
     * igjen.
     */
    motta(liste: Gjest[]): void {
        const sett = new Set<string>();
        for (const g of liste) {
            sett.add(g.id);
            const finnes = this.figurer.get(g.id);
            if (finnes) this.oppdaterFigur(finnes, g);
            else this.lag(g);
        }
        for (const [id, f] of this.figurer) {
            if (!sett.has(id)) {
                this.fjern(f);
                this.figurer.delete(id);
            }
        }
    }

    /**
     * Ett bilde. `delta` er ekte tid, ikke skalert: saktefilmen etter et drap
     * hører til kampen, og det er ingen kamp i hallen - men skulle laget noen
     * gang brukes et sted med kamp, skal de andre likevel bevege seg normalt.
     */
    oppdater(delta: number): void {
        this.klokke += delta;
        const naa = this.klokke - ETTERSLEP_MS;

        for (const f of this.figurer.values()) {
            const { x, y } = this.stedFor(f, naa);
            f.sprite.setPosition(Math.round(x), Math.round(y + (f.data.sitter ? 3 : 0)));
            f.sprite.setDepth(f.sprite.y);

            // Animasjonen drives lokalt. Å sende fasenummeret over nettet ville
            // vært flere byte for noe øyet ikke kan se forskjell på.
            const positur = f.data.sitter ? 'idle' : f.data.positur;
            const takt = positur === 'gang' ? 120 : 620;
            f.faseTimer += delta;
            while (f.faseTimer >= takt) {
                f.faseTimer -= takt;
                f.fase = (f.fase + 1) % POSITUR_LENGDE[positur];
            }
            f.sprite.setFrame(heltFrame(f.data.dir, positur, f.fase));

            f.navnetekst.sett(f.sprite.x, f.sprite.y - 22);
            f.navnetekst.settDybde(f.sprite.y + 2);

            if (f.boble) {
                f.boble.setPosition(f.sprite.x, f.sprite.y - 32);
                f.boble.setDepth(f.sprite.y + 3);
                f.bobleIgjen -= delta;
                if (f.bobleIgjen <= 0) {
                    f.boble.destroy();
                    f.boble = null;
                    f.bobleTegn = null;
                } else if (f.bobleIgjen < 500) {
                    f.boble.setAlpha(f.bobleIgjen / 500);
                }
            }
        }
    }

    /** Hvor mange andre som er synlige nå. Brukes av grensesnittet og prøvene. */
    get antall(): number {
        return this.figurer.size;
    }

    /** Figurene slik prøveskriptene ser dem. */
    oversikt(): { id: string; navn: string; x: number; y: number; emoji: string | null }[] {
        return [...this.figurer.values()].map((f) => ({
            id: f.id,
            navn: f.navn,
            x: Math.round(f.sprite.x),
            y: Math.round(f.sprite.y),
            emoji: f.bobleTegn,
        }));
    }

    /** Ryddes når scenen rives. Phaser tar sprite-ene, men ikke kartet vårt. */
    vask(): void {
        for (const f of this.figurer.values()) this.fjern(f);
        this.figurer.clear();
        this.teksturer.clear();
    }

    // ── Innmat ─────────────────────────────────────────────────────────────

    /**
     * Posisjonen å tegne på, `naa` millisekunder inn i vår egen klokke.
     *
     * Mellom de to siste prøvene glir vi. Er `naa` kommet forbi den siste
     * prøven, gjetter vi videre i samme retning - og legger oss så tilbake på
     * det siste vi faktisk vet.
     *
     * Den siste halvdelen er det som ikke er åpenbart. Gjetter man videre og
     * blir stående der, ender en elev som slutter å sende opp et stykke fra der
     * hun faktisk er, og hun blir liggende der til neste puls tolv sekunder
     * senere. Derfor ebber gjettingen ut: full styrke etter
     * `EKSTRAPOLER_MAKS_MS`, borte etter det dobbelte, og da står figuren
     * nøyaktig på siste kjente sted. Ingen kan se de tjue pikslene det koster,
     * og alle ville sett de hundre det sparer.
     */
    private stedFor(f: Figur, naa: number): { x: number; y: number } {
        const { forrige, siste } = f;
        const spenn = siste.t - forrige.t;
        if (spenn <= 0) return { x: siste.x, y: siste.y };

        if (naa <= siste.t) {
            const t = Math.max(0, Math.min(1, (naa - forrige.t) / spenn));
            return {
                x: forrige.x + (siste.x - forrige.x) * t,
                y: forrige.y + (siste.y - forrige.y) * t,
            };
        }

        const over = naa - siste.t;
        const demp = Math.max(0, 1 - Math.max(0, over - EKSTRAPOLER_MAKS_MS) / EKSTRAPOLER_MAKS_MS);
        if (demp <= 0) return { x: siste.x, y: siste.y };

        const ut = Math.min(over, EKSTRAPOLER_MAKS_MS) * demp;
        let dx = ((siste.x - forrige.x) / spenn) * ut;
        let dy = ((siste.y - forrige.y) / spenn) * ut;
        const lengde = Math.hypot(dx, dy);
        if (lengde > EKSTRAPOLER_MAKS_PX) {
            dx = (dx / lengde) * EKSTRAPOLER_MAKS_PX;
            dy = (dy / lengde) * EKSTRAPOLER_MAKS_PX;
        }
        return { x: siste.x + dx, y: siste.y + dy };
    }

    private lag(g: Gjest): void {
        const nokkel = this.tekstur(g);
        const sprite = this.scene.add.sprite(g.x, g.y, nokkel, heltFrame(g.dir, 'idle', 0));
        sprite.setOrigin(0.5, FIG_ORIGIN_Y).setDepth(g.y);
        // Litt gjennomsiktig. De andre er ekte, men de er ikke det eleven
        // holder på med - og et halvt lag luft gjør det umulig å forveksle
        // dem med sin egen figur i et rom med mange like.
        sprite.setAlpha(0.92);

        const f: Figur = {
            id: g.id,
            sprite,
            navn: g.navn,
            navnetekst: skrivPiksel(this.scene, g.navn.toUpperCase(), '#dfe6f2', 30000),
            forrige: { x: g.x, y: g.y, t: this.klokke - ETTERSLEP_MS },
            siste: { x: g.x, y: g.y, t: this.klokke },
            data: g,
            fase: 0,
            faseTimer: 0,
            boble: null,
            bobleIgjen: 0,
            bobleTegn: null,
        };
        this.figurer.set(g.id, f);
        if (g.emoji) this.visFolelse(f, g.emoji);
    }

    private oppdaterFigur(f: Figur, g: Gjest): void {
        const flyttet = g.x !== f.siste.x || g.y !== f.siste.y;
        if (flyttet) {
            f.forrige = f.siste;
            f.siste = { x: g.x, y: g.y, t: this.klokke };
        } else {
            // Står hun stille, flytter vi bare tidsstempelet fram. Uten det
            // ville etterslepet spist opp den siste bevegelsen og figuren
            // hoppet det siste stykket når hun begynte å gå igjen.
            f.siste = { ...f.siste, t: this.klokke };
        }

        if (g.navn !== f.navn) {
            f.navnetekst.fjern();
            f.navn = g.navn;
            f.navnetekst = skrivPiksel(this.scene, g.navn.toUpperCase(), '#dfe6f2', 30000);
        }

        // Nytt utseende (hun tok på seg en brynje) krever ny tekstur.
        const nokkel = this.tekstur(g);
        if (f.sprite.texture.key !== nokkel) f.sprite.setTexture(nokkel);

        if (g.emoji && g.emoji !== f.bobleTegn) this.visFolelse(f, g.emoji);
        f.data = g;
    }

    private fjern(f: Figur): void {
        f.sprite.destroy();
        f.navnetekst.fjern();
        f.boble?.destroy();
    }

    /**
     * Teksturen for et utseende, smidd én gang og delt av alle som ser like ut.
     *
     * `forgeHumanoid` tegner 56 rammer. Å gjøre det per gjest ville vært et
     * synlig hakk hver gang noen kom inn i rommet. Taket finnes fordi seksten
     * elever i teorien kan ha seksten forskjellige utseender, og da er det
     * bedre at nummer tretten låner en figur enn at hallen står og smir.
     */
    private tekstur(g: Gjest): string {
        const sign = `${g.kjortel}-${g.rustning}-${g.appearance.skin}-${g.appearance.hair}-${g.appearance.hairColor}-${g.appearance.face}`;
        const kjent = this.teksturer.get(sign);
        if (kjent) return kjent;

        if (this.teksturer.size >= MAKS_TEKSTURER) {
            return this.teksturer.values().next().value as string;
        }
        const nokkel = `gjest-${this.teksturer.size}`;
        forgeHumanoid(this.scene, nokkel, figurLook(g.kjortel, g.appearance, g.rustning));
        this.teksturer.set(sign, nokkel);
        return nokkel;
    }

    /**
     * Følelsen over hodet.
     *
     * Dette er det ene stedet i spillet som bruker en vanlig skrifttype, og det
     * er fordi et emoji *er* en skrifttype - det finnes ikke som piksler vi kan
     * smi. Den tegnes stor og skaleres ned, så den ikke blir grøtete når
     * kameraet forstørrer tre ganger.
     */
    private visFolelse(f: Figur, emoji: string): void {
        f.boble?.destroy();
        const tekst = this.scene.add.text(f.sprite.x, f.sprite.y - 32, emoji, {
            fontSize: '32px',
            padding: { x: 4, y: 4 },
        });
        tekst.setOrigin(0.5, 0.5).setScale(0.34).setDepth(f.sprite.y + 3);
        f.boble = tekst;
        f.bobleTegn = emoji;
        f.bobleIgjen = FOLELSE_MS;
    }
}
