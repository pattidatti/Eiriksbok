// Folkene og tingene eleven kan gå bort til og trykke E på.
//
// Modulen eier NPC-sprites, utropstegnene over hodene deres og landemerkene
// (runesteiner, skilt, bål, kister). Den avgjør hva som er nærmest, sender
// hintet nederst på skjermen, og melder fra til React når eleven faktisk
// trykker.
//
// Den kjenner ingen bestemt bygd. NPC-ene og landemerkene kommer inn som
// argumenter, så det samme laget bærer et kloster i 793 og en skyttergrav i
// 1916 (blueprint R2).

import Phaser from 'phaser';
import type { LandmarkDef, NpcDef, QuestDef, Retning } from '../../types';
import { useRpgStore } from '../../store/useRpgStore';
import { sfx } from '../audio';
import { fraSpill } from '../bridge';
import { aktivQuestFor, nesteQuestFor } from '../quests';
import { FIG_ORIGIN_Y, TILE, forgeHumanoid, heltFrame } from '../spriteforge';

/** Hvor nær eleven må stå. Folk får litt mer slingringsmonn enn ting. */
const NPC_AVSTAND = 34;
const LANDEMERKE_AVSTAND = 30;

/** Steiner på varden. Flere leser som en steinrøys, ikke som et spor. */
const VARDE_TAK = 16;

export type InteraksjonMaal = { type: 'npc' | 'landemerke'; id: string };

export interface InteraksjonKroker {
    spiller: () => { x: number; y: number };
    /** Låser bevegelsen mens en dialog står åpen. */
    laas: (pa: boolean) => void;
    quester: () => QuestDef[];
}

export class Interaksjon {
    private scene: Phaser.Scene;
    private npcer: NpcDef[];
    private landemerkeDefs: LandmarkDef[];
    private kroker: InteraksjonKroker;

    private npcSprites = new Map<string, Phaser.GameObjects.Sprite>();
    /** Hvilken vei hver NPC ser. Pusteanimasjonen leser den hvert bilde. */
    private npcRetning = new Map<string, Retning>();
    private npcMarkorer = new Map<string, Phaser.GameObjects.Image>();
    private landemerker = new Map<string, Phaser.GameObjects.Image>();
    private naermest: InteraksjonMaal | null = null;
    /** Varden, hvis stedet har en. */
    private vardeId: string | null = null;
    private vardeSteiner: Phaser.GameObjects.Image[] = [];
    /** Én stein per besøk. Ellers blir varden en knapp å trykke på.  */
    private harLagtStein = false;

    constructor(
        scene: Phaser.Scene,
        npcer: NpcDef[],
        landemerker: LandmarkDef[],
        kroker: InteraksjonKroker
    ) {
        this.scene = scene;
        this.npcer = npcer;
        this.landemerkeDefs = landemerker;
        this.kroker = kroker;
    }

    bygg(): void {
        this.byggNpcer();
        this.byggLandemerker();
    }

    private byggNpcer(): void {
        for (const npc of this.npcer) {
            forgeHumanoid(this.scene, `npc-${npc.id}`, {
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
            const sprite = this.scene.add.sprite(
                tx * TILE + 8,
                ty * TILE + 8,
                `npc-${npc.id}`,
                heltFrame('ned', 'idle', 0)
            );
            sprite.setOrigin(0.5, FIG_ORIGIN_Y).setDepth(sprite.y);
            // NPC-ene puster. Fem mennesker frosset i en bygd så ut som en feil.
            this.scene.tweens.addCounter({
                from: 0,
                to: 1,
                duration: 900 + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                onUpdate: (t) =>
                    sprite.setFrame(
                        heltFrame(
                            this.npcRetning.get(npc.id) ?? 'ned',
                            'idle',
                            (t.getValue() ?? 0) > 0.5 ? 1 : 0
                        )
                    ),
            });
            this.npcSprites.set(npc.id, sprite);
            this.npcRetning.set(npc.id, npc.ser ?? 'ned');
            sprite.setFrame(heltFrame(npc.ser ?? 'ned', 'idle', 0));

            const markor = this.scene.add.image(sprite.x, sprite.y - 26, 'fx-utrop').setDepth(9000);
            this.scene.tweens.add({
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

    private byggLandemerker(): void {
        for (const lm of this.landemerkeDefs) {
            const [tx, ty] = lm.tile;
            const key =
                lm.kind === 'runestein'
                    ? 'prop-runestein'
                    : lm.kind === 'skilt'
                    ? 'prop-skilt'
                    : lm.kind === 'kiste'
                    ? 'loot-kiste'
                    : lm.kind === 'varde'
                    ? 'prop-varde'
                    : 'prop-baal-0';
            if (lm.kind === 'varde') this.byggVarde(lm, tx, ty);
            const bilde = this.scene.add.image(tx * TILE + 8, ty * TILE + 8, key);
            bilde.setOrigin(0.5, 0.85).setDepth(bilde.y);
            if (lm.kind === 'baal') {
                (bilde as unknown as Phaser.GameObjects.Sprite).destroy();
                const s = this.scene.add.sprite(tx * TILE + 8, ty * TILE + 8, 'prop-baal-0');
                s.setOrigin(0.5, 0.85).setDepth(s.y).play('baal');
                this.landemerker.set(lm.id, s as unknown as Phaser.GameObjects.Image);
                continue;
            }
            this.landemerker.set(lm.id, bilde);
        }
    }

    /**
     * Steinene som allerede ligger på varden.
     *
     * Varden er det ene landemerket som ikke leses. Den er et spor (blueprint
     * §3.4): eleven legger en stein hver gang hun kommer hjem til hallen, og
     * haugen vokser mens hun spiller. Én ferdigtegnet varde ville løyet om hvor
     * mange ganger hun faktisk har vært her.
     */
    private byggVarde(lm: LandmarkDef, tx: number, ty: number): void {
        const antall = Math.min(VARDE_TAK, useRpgStore.getState().hub.steiner);
        for (let i = 0; i < antall; i++) this.leggStein(tx, ty, i);
        this.vardeId = lm.id;
    }

    private leggStein(tx: number, ty: number, i: number): void {
        const rad = Math.floor(i / 4);
        const kol = i % 4;
        const bilde = this.scene.add.image(
            tx * TILE + 3 + kol * 5 + (rad % 2) * 2,
            ty * TILE + 4 - rad * 4,
            'prop-smaastein'
        );
        bilde.setOrigin(0.5, 0.9).setDepth(ty * TILE + 9 + i);
        this.vardeSteiner.push(bilde);
    }

    /**
     * Kjøres hver frame. `brukTrykk` er sant den ene framen eleven trykker E,
     * gamepad-Y eller berøringsknappen - hvilken tast det er bor hos scenen.
     *
     * `aktiv` er falsk når et annet lag eier hintlinja og E-tasten, som når
     * eleven står ved en båt eller sitter i den. Da glemmer vi hva som var
     * nærmest, men skriver ingenting: den som eier hintet, skal få skrive det i
     * fred, og neste bilde uten båt finner vi målet på nytt.
     */
    sjekk(brukTrykk: boolean, aktiv = true): boolean {
        if (!aktiv) {
            this.naermest = null;
            return false;
        }
        const spiller = this.kroker.spiller();
        let funn: { type: 'npc' | 'landemerke'; id: string; d: number } | null = null;

        for (const [id, sprite] of this.npcSprites) {
            const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, spiller.x, spiller.y);
            if (d < NPC_AVSTAND && (!funn || d < funn.d)) funn = { type: 'npc', id, d };
        }
        for (const [id, sprite] of this.landemerker) {
            const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, spiller.x, spiller.y);
            if (d < LANDEMERKE_AVSTAND && (!funn || d < funn.d))
                funn = { type: 'landemerke', id, d };
        }

        // Sammenlikningen gikk før via to JSON.stringify hver eneste frame.
        const ny: InteraksjonMaal | null = funn ? { type: funn.type, id: funn.id } : null;
        const forrige = this.naermest;
        if (ny?.id !== forrige?.id || ny?.type !== forrige?.type) {
            this.naermest = ny;
            if (!ny) {
                fraSpill.emit('hint', { tekst: null });
            } else if (ny.type === 'npc') {
                const npc = this.npcer.find((n) => n.id === ny.id);
                fraSpill.emit('hint', { tekst: `E - snakk med ${npc?.name ?? 'noen'}` });
            } else {
                const lm = this.landemerkeDefs.find((l) => l.id === ny.id);
                fraSpill.emit('hint', { tekst: this.landemerkeHint(lm) });
            }
        }

        if (brukTrykk && this.naermest) {
            // Varden åpner ingen tekst. Den tar imot en stein.
            if (this.naermest.type === 'landemerke' && this.naermest.id === this.vardeId) {
                this.leggSteinPaaVarden();
                return true;
            }
            this.kroker.laas(true);
            sfx.dialog();
            if (this.naermest.type === 'npc') {
                fraSpill.emit('dialog', { npcId: this.naermest.id });
            } else {
                fraSpill.emit('landmark', { landmarkId: this.naermest.id });
            }
            fraSpill.emit('hint', { tekst: null });
        }

        // Har vi noen eller noe innen rekkevidde? Det er dette laget under - i
        // dag benkene i hallen - trenger å vite for å holde seg unna: står
        // eleven ved en person eller en stein med en tekst i, skal E gjelde den.
        return this.naermest !== null;
    }

    private landemerkeHint(lm: LandmarkDef | undefined): string {
        if (lm?.kind === 'varde') {
            const antall = useRpgStore.getState().hub.steiner;
            if (this.harLagtStein) return `Varden - ${antall} steiner`;
            return 'E - legg en stein på varden';
        }
        return `E - ${lm?.kind === 'kiste' ? 'åpne' : 'les'} ${lm?.title}`;
    }

    /**
     * En stein til. Ingen lås og ingen tekstboks - handlingen er hele
     * innholdet, og eleven skal kunne gjøre den i forbifarten.
     */
    private leggSteinPaaVarden(): void {
        if (this.harLagtStein || !this.vardeId) return;
        const lm = this.landemerkeDefs.find((l) => l.id === this.vardeId);
        if (!lm) return;
        this.harLagtStein = true;
        useRpgStore.getState().leggStein();
        if (this.vardeSteiner.length < VARDE_TAK) {
            this.leggStein(lm.tile[0], lm.tile[1], this.vardeSteiner.length);
        }
        // Tallet leses etter endringen. Snapshotet over er det gamle.
        const antall = useRpgStore.getState().hub.steiner;
        sfx.dialog();
        useRpgStore.getState().varsle(`En stein til på varden. ${antall} nå.`, 'bra');
        fraSpill.emit('hint', { tekst: `Varden - ${antall} steiner` });
    }

    /**
     * Hvor står denne kilden, og hva heter den? Kompasset peker på den.
     * `navn` er null når stedet ikke kjenner id-en - da har den som spør et
     * eget fallback-navn fra questen.
     */
    mal(
        type: 'npc' | 'landemerke',
        id: string
    ): { x: number; y: number; navn: string | null } | null {
        if (type === 'npc') {
            const sprite = this.npcSprites.get(id);
            if (!sprite) return null;
            return {
                x: sprite.x,
                y: sprite.y,
                navn: this.npcer.find((n) => n.id === id)?.name ?? null,
            };
        }
        const sprite = this.landemerker.get(id);
        if (!sprite) return null;
        return {
            x: sprite.x,
            y: sprite.y,
            navn: this.landemerkeDefs.find((l) => l.id === id)?.title ?? null,
        };
    }

    /** Oppdaterer utropstegnene over NPC-ene. */
    oppdaterMarkorer(): void {
        const status = useRpgStore.getState().quester;
        const quester = this.kroker.quester();
        for (const [id, markor] of this.npcMarkorer) {
            const ny = nesteQuestFor(id, quester, status);
            const aktiv = aktivQuestFor(id, quester, status);
            markor.setVisible(Boolean(ny || aktiv));
            markor.setTexture(aktiv ? 'fx-sporsmal' : 'fx-utrop');
        }
    }

    /** NPC-ene må sorteres inn i dybden sammen med alt annet som står på bakken. */
    oppdaterDybde(): void {
        for (const [, sprite] of this.npcSprites) sprite.setDepth(sprite.y);
    }

    /**
     * Figuren til en NPC. Cutscene-avspilleren trenger den for å kunne la folk
     * gå og snu seg - og den skal ikke lete i scenens visningsliste etter et
     * navn, for da hadde to lag eid hvem som står hvor.
     */
    sprite(npcId: string): Phaser.GameObjects.Sprite | null {
        return this.npcSprites.get(npcId) ?? null;
    }

    /** Navnet på en NPC, til replikkboksen i en cutscene. */
    navn(npcId: string): string | null {
        return this.npcer.find((n) => n.id === npcId)?.name ?? null;
    }

    /**
     * Vender en NPC. Pusteanimasjonen skriver rammen hvert bilde, så en
     * retningsendring må gå gjennom den - ikke gjennom `setFrame` alene, som
     * ville blitt overskrevet i neste tick av tweenen.
     */
    vend(npcId: string, retning: Retning): void {
        const sprite = this.npcSprites.get(npcId);
        if (!sprite) return;
        this.npcRetning.set(npcId, retning);
        sprite.setFrame(heltFrame(retning, 'idle', 0));
    }
}
