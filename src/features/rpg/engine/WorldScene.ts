// Verden: terreng, folk, fiender og kamp i sanntid, uansett hvilket sted eleven
// står på. Scenen får stedet inn i `init()` og bygger det den får - den vet ikke
// at Nordvik finnes.
//
// Scenen eier bevegelse, slag og fiende-AI. Alt som har med tall å gjøre
// (liv, XP, sekk, quester) bor i useRpgStore, og alt som skal *vises* som
// grensesnitt sendes over broen til React. Scenen tegner altså aldri en meny.

import Phaser from 'phaser';
import { ENEMY_BY_ID, ENEMIES } from '../data/enemies';
import { regelsettFor } from '../data/epoker';
import { stedEllerStart } from '../data/steder';
import { maksVerdier, useRpgStore } from '../store/useRpgStore';
import type { EnemyDef, QuestDef, Sted } from '../types';
import { sfx, startMusikk, stopMusikk } from './audio';
import { fraSpill, tilSpill } from './bridge';
import { Farkoster } from './farkost';
import { KampFx } from './kampfx';
import { numToHex } from './pixels';
import {
    TILE,
    forgeEffects,
    forgeEnemy,
    forgeLootIcons,
    forgeSkjold,
    forgeTallfont,
} from './spriteforge';
import { forgeProps, forgeTiles } from './tileforge';
import { Effekter } from './systems/effekter';
import { Fiender } from './systems/fiender';
import { Interaksjon } from './systems/interaksjon';
import { Loot } from './systems/loot';
import { Prosjektiler } from './systems/prosjektiler';
import { Spiller } from './systems/spiller';
import { Verden } from './systems/verden';
import type { WorldMap } from './worldgen';

/**
 * Scenenøkkelen. Én scene, mange steder - derfor heter den ikke lenger
 * «nordvik». Verifiseringsskriptene slår opp scenen med denne.
 */
export const VERDEN_SCENE = 'verden';

export class WorldScene extends Phaser.Scene {
    /** Stedet som bygges. Alt kartspesifikt kommer herfra. */
    private sted!: Sted;
    private kart!: WorldMap;
    /** Eleven: figur, styring, slag, gard og alt som kan skje med henne. */
    private helt!: Spiller;
    /** Kamptilstanden sendes til HUD-en et titalls ganger i sekundet, ikke 60. */
    private kampUiTimer = 0;

    private fiendeSystem!: Fiender;
    /** Alt som flyr: piler, kastespyd, besvergelser. */
    private skudd!: Prosjektiler;
    private samhandling!: Interaksjon;
    /** Båter og annet eleven kan gå om bord i. */
    private farkoster!: Farkoster;
    /** Sølv og gjenstander som ligger på bakken. */
    private lootSystem!: Loot;
    /** Partikler, flytende tall og glimt. Kjenner ingen spillregler. */
    private efx = new Effekter(this);
    /** Bakken, kollisjonen, objektene og atmosfæren. Kjenner ingen spillregler. */
    private verden!: Verden;
    private kompassTimer = 0;
    private kompassAktivt = false;

    private hitstopIgjen = 0;
    /** Kamerastøt, blod, løsdeler, lik, saktefilm og avslutninger. */
    private fx = new KampFx(this);
    /** Hjerteslaget når livet er lavt. */
    private hjerteTimer = 0;
    /** Nivået sist vi sjekket, så vi kan feire når det stiger. */
    private sisteNiva = 0;
    /** Er eleven i kamp? Styrer hvor tett kameraet følger. */
    private iKamp = false;

    private quester: QuestDef[] = [];
    private laast = false;
    private avmeldinger: (() => void)[] = [];
    /** En reise er bestilt. Hindrer at to avreiser overlapper. */
    private reiser = false;

    constructor() {
        super(VERDEN_SCENE);
    }

    init(data: { stedId?: string; quester: QuestDef[] }) {
        this.quester = data.quester ?? [];
        this.sted = stedEllerStart(data.stedId);
        this.reiser = false;
    }

    create() {
        const { sted } = this;
        const tema = sted.tema;
        this.kart = sted.byggKart();

        forgeTiles(this, tema);
        forgeProps(this, tema);
        forgeEffects(this);
        forgeSkjold(this);
        forgeTallfont(this);
        forgeLootIcons(this);
        for (const def of ENEMIES) forgeEnemy(this, def);

        this.verden = new Verden(this, this.kart, tema);
        this.lootSystem = new Loot(this, this.efx, () => this.helt.sprite);
        this.skudd = new Prosjektiler(this, this.efx, this.kart, {
            spiller: () => this.helt.sprite,
            fiender: () => this.fiendeSystem.alle(),
            skadSpiller: (skade) => this.helt.skad(skade),
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
            sted.boss ? ENEMY_BY_ID[sted.boss.enemyId] : null,
            sted.boss?.sporsmal.length ?? 0,
            {
                spiller: () => this.helt.sprite,
                nerkampTreff: (fiende) => this.helt.nerkampTreff(fiende),
                hitstop: (ms) => this.hitstop(ms),
                laas: (pa) => this.settLaast(pa),
            }
        );
        // Verb-kontrakten kommer fra epoken stedet ligger i: hva ressursen
        // heter, hva vernet er, og hvor fort eleven går. Scenen leser den ikke
        // selv - den rekker den videre til den som styrer figuren.
        const regler = regelsettFor(sted.epokeId);
        this.helt = new Spiller(
            this,
            this.kart,
            this.efx,
            this.fx,
            this.skudd,
            sted.spawn,
            regler,
            {
                fiender: () => this.fiendeSystem.alle(),
                skadFiende: (f, skade, kritisk, vinkel, kraft) =>
                    this.fiendeSystem.skad(f, skade, kritisk, vinkel, kraft),
                stotBort: (f, vinkel, fart) => this.fiendeSystem.stotBort(f, vinkel, fart),
                hitstop: (ms) => this.hitstop(ms),
                laas: (pa) => this.settLaast(pa),
            }
        );
        this.samhandling = new Interaksjon(this, sted.npcer, sted.landemerker, {
            spiller: () => this.helt.sprite,
            laas: (pa) => this.settLaast(pa),
            quester: () => this.quester,
        });
        this.farkoster = new Farkoster(
            this,
            this.kart,
            sted.farkoster ?? [],
            regler.bevegelse.farkost,
            {
                spiller: () => this.helt.sprite,
                settOmBord: (pa, plass) => this.helt.settOmBord(pa, plass),
                akse: () => this.helt.akse(),
            }
        );
        this.verden.byggTerreng();
        this.verden.byggKollisjon();
        this.verden.byggProps();
        this.helt.bygg();
        this.samhandling.bygg();
        this.farkoster.bygg();
        this.fiendeSystem.byggBoss();
        this.verden.byggAtmosfare(sted.landemerker);
        this.settOppKamera();
        this.lyttPaaUi();

        startMusikk(sted.musikkRot, 0);
        this.events.once('shutdown', () => this.rydd());

        // Stedet huskes, så neste økt begynner der eleven slapp.
        useRpgStore.setState({ sisteSone: sted.id });
        fraSpill.emit('sone', {
            stedId: sted.id,
            tittel: sted.tittel,
            undertittel: sted.undertittel,
        });
    }

    private settOppKamera() {
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.kart.bredde * TILE, this.kart.hoyde * TILE);
        cam.startFollow(this.helt.sprite, true, 0.12, 0.12);
        cam.setDeadzone(40, 30);
        // Zoom tilpasses skjermen, men holdes på hele tall så pikslene forblir skarpe.
        const onsket = Math.max(2, Math.min(4, Math.round(this.scale.width / 420)));
        cam.setZoom(onsket);
        cam.setRoundPixels(true);

        // Skalamanageren overlever scenen. Uten avmeldingen ville hver reise
        // legge igjen en lytter til, og etter fem stedskifter ville fem
        // lyttere justert zoomen på hver eneste vindusendring.
        const juster = () =>
            cam.setZoom(Math.max(2, Math.min(4, Math.round(this.scale.width / 420))));
        this.scale.on('resize', juster);
        this.avmeldinger.push(() => this.scale.off('resize', juster));

        cam.fadeIn(700, 0, 0, 0);
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
            this.helt.stopp();
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
            tilSpill.on('styring', ({ x, y }) => this.helt.settTouchAkse(x, y)),
            tilSpill.on('knapp', ({ navn }) => this.helt.touchKnapp(navn)),
            tilSpill.on('svar', ({ questId, riktig }) => {
                this.settLaast(false);
                const quest = this.quester.find((q) => q.id === questId);
                if (!quest) return;
                useRpgStore.getState().fullforQuest(quest, riktig);
                if (riktig) {
                    sfx.riktig();
                    this.efx.lysglimt(this.helt.sprite.x, this.helt.sprite.y);
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
                    this.efx.lysglimt(this.helt.sprite.x, this.helt.sprite.y);
                    useRpgStore.setState((s) => ({ riktigeSvar: s.riktigeSvar + 1 }));
                } else {
                    sfx.galt();
                    useRpgStore.getState().varsle('Glemselen vokser. Prøv igjen.', 'darlig');
                    this.helt.skad(18, true);
                }
            }),
            tilSpill.on('besvergelse', ({ spellId }) => this.helt.kastBesvergelse(spellId)),
            tilSpill.on('gjenoppliv', () => this.helt.gjenoppliv())
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
            this.helt.stopp();
            return;
        }

        // Saktefilmen etter et drap. KampFx skalerer fysikken og tweenene; alt vi
        // teller selv må skaleres her. Nedtellingen skjedde øverst i metoden, med
        // ekte delta - blir den skalert, tar saktefilmen aldri slutt.
        const dt = delta * this.fx.tidsfaktor;

        this.helt.oppdater(dt);
        // E-trykket leses én gang og deles. `JustDown` er oppbrukt etter første
        // spørring, så to kall i samme bilde ville gitt `false` til den andre.
        //
        // Farkosten får første rett på trykket: står eleven på brygga med både
        // en båt og en nabo innen rekkevidde, skal ett trykk gjøre én ting.
        const brukTrykk = this.helt.brukTrykk();
        const farkostEier = this.farkoster.sjekk(dt, brukTrykk);
        this.samhandling.sjekk(farkostEier ? false : brukTrykk, !farkostEier);
        // Figuren settes på dekk *etter* at båten har flyttet seg. Snus
        // rekkefølgen, ligger hun ett bilde etter, og da sklir hun rundt oppå.
        const dekk = this.farkoster.dekksplass();
        if (dekk) this.helt.staaPaaDekk(dekk);
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
        this.helt.tomTouchTrykk();
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
        fraSpill.emit('kamp', this.helt.kampSnapshot());

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
                        this.helt.sprite.x,
                        this.helt.sprite.y
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
                this.helt.sprite.x,
                this.helt.sprite.y - 34,
                `NIVÅ ${maks.niva}`,
                '#ffe9a8',
                15
            );
            this.efx.pikselSprut(this.helt.sprite.x, this.helt.sprite.y - 10, 0xffe9a8, 22);
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
            vinkel:
                (Math.atan2(mal.y - this.helt.sprite.y, mal.x - this.helt.sprite.x) * 180) /
                Math.PI,
            avstand: Phaser.Math.Distance.Between(
                this.helt.sprite.x,
                this.helt.sprite.y,
                mal.x,
                mal.y
            ),
            navn: mal.navn ?? kilde.navn,
        });
    }

    /** Fryser bildet et lite øyeblikk så slaget kjennes i hendene. */
    private hitstop(ms: number) {
        this.hitstopIgjen = ms;
        this.physics.pause();
        this.tweens.pauseAll();
    }

    // ── Kamp ────────────────────────────────────────────────────────────────

    // ── Besvergelser ────────────────────────────────────────────────────────

    // ── Fiender ─────────────────────────────────────────────────────────────

    // ── Samhandling ─────────────────────────────────────────────────────────

    // ── Reise mellom steder ─────────────────────────────────────────────────

    /**
     * Be om å komme til et annet sted. Spillet kan ikke bare bytte kart selv:
     * questene hører til stedet, og de bygges av React fra spørsmålsbanken.
     * Derfor spør scenen, og React svarer med `utforReise`.
     *
     * Skipet i R5 og portalene i hubben kaller denne.
     */
    bestillReise(stedId: string) {
        if (this.reiser || stedId === this.sted.id) return;
        this.reiser = true;
        fraSpill.emit('reise', { stedId });
    }

    /**
     * Utfør reisen. Scenen bygges fra bunnen: Phaser river alt som ligger i
     * den, `rydd()` tar det som ligger utenfor, og `create()` bygger det nye
     * stedet.
     *
     * Kompasset og hintet nullstilles først. De peker på folk og steiner i den
     * gamle verdenen, og et hint om Gudrun mens skjermen viser et kloster i
     * Northumbria er verre enn ingen hint.
     */
    utforReise(stedId: string, quester: QuestDef[]) {
        fraSpill.emit('kompass', null);
        fraSpill.emit('hint', { tekst: null });
        // Låsen må av før scenen rives. Blir den stående, starter det nye
        // stedet med pauset fysikk og en elev som ikke kan gå.
        this.settLaast(false);
        this.cameras.main.fadeOut(420, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Restarten må ut av render-fasen. `camerafadeoutcomplete` fyres
            // fra innsiden av fade-effekten mens kameraet tegner, og river vi
            // kameramanageren der, krasjer effekten på sitt eget kamera
            // («Cannot read properties of undefined (reading setFollowOffset)»)
            // og scenen blir liggende død med et tomt lerret. Ett bilde senere
            // er vi trygt ute i oppdateringssteget.
            this.time.delayedCall(0, () => this.scene.restart({ stedId, quester }));
        });
    }

    /** Tegner helten på nytt når utstyret endrer seg. Kalles fra React. */
    oppdaterUtseende() {
        this.helt.oppdaterUtseende();
    }

    /** Oppdaterer utropstegnene over NPC-ene. Kalles fra React etter questbytte. */
    oppdaterMarkorer() {
        this.samhandling.oppdaterMarkorer();
    }

    // ── Småting som gjør det digg ───────────────────────────────────────────

    private oppdaterDybde() {
        this.helt.oppdaterDybde();
        this.fiendeSystem.oppdaterDybde();
        this.samhandling.oppdaterDybde();
    }

    /** Fargen på en fiende, brukt av grensesnittet. */
    static fiendeFarge(def: EnemyDef): string {
        return numToHex(def.farge);
    }
}
