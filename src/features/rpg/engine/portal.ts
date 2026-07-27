// Portalene: dørene mellom hubben og epokene.
//
// Laget er bygget som `farkost.ts`: det eier hintlinja og E-tasten når eleven
// står nær nok, og melder fra til scenen så samhandlingslaget kan hvile. Ellers
// kjemper de to om linja hvert eneste bilde, den ene skriver «E - reis inn», den
// andre skriver null, og eleven ser ingenting.
//
// En portal vet nesten ingenting selv. Tittel, tidsspenn, farge og om den er
// åpen slås opp i `EPOKER`, så en ny epoke blir synlig i hallen uten at noen må
// skrive den inn to steder.

import Phaser from 'phaser';
import { EPOKE_BY_ID } from '../data/epoker';
import { forsteStedI } from '../data/steder';
import { useRpgStore } from '../store/useRpgStore';
import type { PortalDef } from '../types';
import { sfx } from './audio';
import { fraSpill } from './bridge';
import { hexToNum } from './pixels';
import { GLYF, TILE, glyfIndex } from './spriteforge';

/** Hvor nær eleven må stå for at portalen skal svare. */
const NAER = 40;

/** Steinene på varden. Flere enn dette leser som en haug, ikke som et spor. */
const MAKS_STEINER = 14;

/** Årstallet slik det står på skiltet. Tomt for epokene uten årstall. */
function aarskilt(aar: number | null): string {
    if (aar === null) return '';
    return aar < 0 ? `${-aar} F.KR.` : `${aar}`;
}

interface Portal {
    def: PortalDef;
    /** Stedet den fører til, eller null når epoken ikke er bygget ennå. */
    maalSted: string | null;
    tittel: string;
    /** Årstallet på skiltet. */
    undertekst: string;
    /** Hva epoken handler om. Står i hintlinja, der det er plass til å lese. */
    beskrivelse: string;
    apen: boolean;
    farge: number;
    stein: Phaser.GameObjects.Image;
    lys: Phaser.GameObjects.Image;
    /** Sporene: én liten stein per gang eleven har gått inn her. */
    spor: Phaser.GameObjects.Image[];
}

export interface PortalKroker {
    spiller: () => { x: number; y: number };
    /** Be scenen om å bygge et annet sted. */
    reis: (stedId: string) => void;
}

export class Portaler {
    private scene: Phaser.Scene;
    private defs: PortalDef[];
    private kroker: PortalKroker;

    private portaler: Portal[] = [];
    private naermeste: Portal | null = null;
    private sisteHint: string | null = null;
    private puls = 0;

    constructor(scene: Phaser.Scene, defs: PortalDef[], kroker: PortalKroker) {
        this.scene = scene;
        this.defs = defs;
        this.kroker = kroker;
    }

    bygg(): void {
        const spor = useRpgStore.getState().hub.besokt;

        for (const def of this.defs) {
            const [tx, ty] = def.tile;
            const x = tx * TILE + 8;
            const y = ty * TILE + 8;

            const epoke = def.maal.art === 'epoke' ? EPOKE_BY_ID[def.maal.epokeId] : null;
            // Hvor porten faktisk fører hen. `null` betyr at det ikke finnes noe
            // sted i den andre enden ennå - da står portalen mørk, uansett hva
            // epoken påstår om seg selv. En epoke som er merket `spillbar` før
            // kartet er bygget ville ellers gitt en port som ikke gjør noe: E
            // trykkes, `bestillReise` avviser i stillhet, og ingenting sier
            // hvorfor.
            const maalSted =
                def.maal.art === 'sted' ? def.maal.stedId : forsteStedI(def.maal.epokeId);
            const apen = maalSted !== null && (def.maal.art === 'sted' || Boolean(epoke?.spillbar));
            const tittel = def.maal.art === 'sted' ? def.maal.navn : (epoke?.title ?? 'Ukjent');
            // Skiltet får årstallet, ikke epokebeskrivelsen. «Steinalder og de
            // første byene» er 28 tegn med pikselfont - en tekstplakat tvers
            // over veien. Årstallet er dessuten det som hører hjemme på en
            // tidslinje; beskrivelsen får eleven i hintlinja, der den kan leses.
            const undertekst =
                def.maal.art === 'sted' ? def.maal.undertekst : aarskilt(epoke?.aar ?? null);
            // Portalen lyser i den tiden den fører til. Paletten finnes
            // allerede for alle elleve epokene, så det koster ingenting.
            const farge = epoke ? hexToNum(epoke.tema.himmel) : 0xffe6b0;

            const stein = this.scene.add.image(x, y, 'prop-portal');
            stein.setOrigin(0.5, 0.92).setDepth(y);
            if (!apen) stein.setTint(0x6c6c78);

            const lys = this.scene.add.image(x, y - 20, 'prop-portallys');
            lys.setOrigin(0.5, 0.5)
                .setDepth(y - 1)
                .setTint(farge)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setAlpha(apen ? 0.75 : 0.1);

            const p: Portal = {
                def,
                maalSted: apen ? maalSted : null,
                tittel,
                undertekst,
                beskrivelse: epoke?.era ?? '',
                apen,
                farge,
                stein,
                lys,
                spor: [],
            };
            this.portaler.push(p);

            this.skriv(x, y + 6, tittel, apen ? '#f0ead8' : '#8a8a96');
            if (undertekst) this.skriv(x, y + 6 + GLYF.h + 2, undertekst, '#9aa0b0');

            if (def.maal.art === 'epoke') {
                this.leggSpor(p, spor[def.maal.epokeId] ?? 0);
            }
        }
    }

    /**
     * Sporene ved foten av portalen: én stein per gang eleven har gått inn.
     *
     * Dette er §3.4 i det små. Hallen skal bære merker etter den som var her
     * før - foreløpig etter eleven selv, og etter alle når rommet blir delt.
     * Verdien av at stedet ikke ser dødt ut er den samme.
     */
    private leggSpor(p: Portal, antall: number): void {
        const n = Math.min(MAKS_STEINER, antall);
        for (let i = p.spor.length; i < n; i++) {
            const rad = Math.floor(i / 5);
            const kol = i % 5;
            const bilde = this.scene.add.image(
                p.stein.x - 16 + kol * 8 + (rad % 2) * 4,
                p.stein.y - 2 + rad * 4,
                'prop-smaastein'
            );
            bilde
                .setOrigin(0.5, 0.9)
                .setDepth(p.stein.y + 1)
                .setTint(p.farge)
                .setAlpha(0.85);
            p.spor.push(bilde);
        }
    }

    /**
     * Skilttekst med pikselfonten.
     *
     * Vektorfont skalert tre ganger av kameraet er det mest uskarpe elementet i
     * en ellers skarp scene - det er samme grunn som `Effekter.flytTekst` har.
     * Her er teksten statisk, så den bygges én gang og blir liggende.
     */
    private skriv(x: number, y: number, tekst: string, farge: string): void {
        const tint = Phaser.Display.Color.HexStringToColor(farge).color;
        const bredde = tekst.length * GLYF.w;
        for (let i = 0; i < tekst.length; i++) {
            const ramme = glyfIndex(tekst[i]);
            const tx = x - bredde / 2 + i * GLYF.w;
            // Skygge først. Lys tekst rett på gress er nesten uleselig på en
            // Chromebook, og en piksel mørk bak hvert tegn koster ingenting.
            this.scene.add
                .image(tx + 1, y + 1, 'font-tall')
                .setFrame(ramme)
                .setOrigin(0, 0.5)
                .setTint(0x0d1014)
                .setAlpha(0.75)
                .setDepth(29999);
            this.scene.add
                .image(tx, y, 'font-tall')
                .setFrame(ramme)
                .setOrigin(0, 0.5)
                .setTint(tint)
                .setDepth(30000);
        }
    }

    /**
     * Ett bilde. Returnerer `true` når portallaget eier hintet og E-tasten -
     * altså når eleven står foran en portal.
     *
     * `aktiv` er falsk når et lag over eier linja, som når eleven sitter i en
     * båt. Da puster lyset videre, men vi skriver ingenting: gjorde vi det,
     * ville de to lagene kjempet om hintet og eleven sett det blinke.
     */
    sjekk(delta: number, brukTrykk: boolean, aktiv = true): boolean {
        if (this.portaler.length === 0) return false;

        // Lyset puster. En portal som står helt stille leser som en kulisse.
        this.puls += delta;
        for (const p of this.portaler) {
            if (!p.apen) continue;
            p.lys.setAlpha(0.62 + Math.sin(this.puls / 520 + p.stein.x) * 0.12);
            p.lys.setScale(1, 1 + Math.sin(this.puls / 700 + p.stein.x) * 0.03);
        }

        if (!aktiv) {
            this.naermeste = null;
            return false;
        }

        const s = this.kroker.spiller();
        let best: Portal | null = null;
        let bestD = NAER;
        for (const p of this.portaler) {
            const d = Phaser.Math.Distance.Between(p.stein.x, p.stein.y - 12, s.x, s.y);
            if (d < bestD) {
                best = p;
                bestD = d;
            }
        }

        this.naermeste = best;
        if (!best) {
            this.hint(null);
            return false;
        }

        this.hint(
            best.apen
                ? `E - gå inn i ${best.tittel}`
                : `${best.tittel}: ${best.beskrivelse}. Ikke åpnet ennå.`
        );
        if (brukTrykk) this.gaaInn(best);
        return true;
    }

    private gaaInn(p: Portal): void {
        if (!p.apen || !p.maalSted) {
            sfx.galt();
            useRpgStore.getState().varsle(`${p.tittel} er ikke bygget ennå. Den kommer.`, 'darlig');
            return;
        }
        sfx.dialog();
        if (p.def.maal.art === 'epoke') useRpgStore.getState().teltPortal(p.def.maal.epokeId);
        this.kroker.reis(p.maalSted);
    }

    private hint(tekst: string | null): void {
        if (tekst === this.sisteHint) return;
        this.sisteHint = tekst;
        fraSpill.emit('hint', { tekst });
    }

    /** Står eleven foran en portal akkurat nå? Brukes av prøveskriptene. */
    get vedPortal(): string | null {
        return this.naermeste?.tittel ?? null;
    }

    /** Portalene, for prøveskriptene. */
    oversikt(): { tittel: string; apen: boolean; x: number; y: number; spor: number }[] {
        return this.portaler.map((p) => ({
            tittel: p.tittel,
            apen: p.apen,
            x: p.stein.x,
            y: p.stein.y,
            spor: p.spor.length,
        }));
    }
}
