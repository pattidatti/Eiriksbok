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
import { stedEllerStart, stedIEpoke } from '../data/steder';
import { kapittelIEpoke, maksVerdier, useRpgStore } from '../store/useRpgStore';
import type { EnemyDef, KlippDef, QuestDef, Sted } from '../types';
import { sfx, startMusikk, stopMusikk } from './audio';
import { fraSpill, tilSpill, type UiEvents } from './bridge';
import { dommen, innenforFristen } from './ting';
import { BOT_I_KORN } from '../data/ting';
import { Farkoster } from './farkost';
import { KampFx } from './kampfx';
import { spillKlipp, type KlippKontekst } from './klipp';
import { Opplaering } from './opplaering';
import { K1, K1_FLAGG, K2, K3, K3_FLAGG, KAPITTEL_BY_NR } from '../data/kapitler';
import { MELLOMSPILL_BY_ID } from '../data/mellomspill';
import { SJOSETTINGEN, STRANDA } from '../data/klipp/kapittel1';
import { Raidet } from './raidet';
import { Gaarden } from './gaarden';
import { Angrepet, ANGREP_FLAGG } from './angrepet';
import { Holmgang } from './holmgang';
import { Portaler } from './portal';
import { Samvaer } from './samvaer';
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
import { Gjester } from './systems/gjester';
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
    /** Alt som flyr: piler og kastespyd. */
    private skudd!: Prosjektiler;
    private samhandling!: Interaksjon;
    /** Fire økter på tunet, mot Ravn. Kapittel 1 begynner her. */
    private opplaering!: Opplaering;
    /** Raidet mot Lindisfarne, i to halvdeler. Ligger stille alle andre steder. */
    private raidet!: Raidet;
    /**
     * Året på gården: årstidene, forrådet og oppgjøret.
     *
     * `null` overalt utenom kapittel 2. Årshjulet går ikke av seg selv, og et
     * kapittel som ikke spiller på det, skal ikke ha en klokke stående og tikke
     * i bakgrunnen.
     */
    private gaarden: Gaarden | null = null;
    /** Båten i vika, høsten 872. `null` utenom kapittel 2. */
    private angrepet: Angrepet | null = null;
    /** Huden på tingvollen, 995. `null` utenom kapittel 3. */
    private holmgang: Holmgang | null = null;
    /** Selve huden, tegnet på bakken mens holmgangen står. */
    private hudBilde: Phaser.GameObjects.Graphics | null = null;
    /** Båter og annet eleven kan gå om bord i. */
    private farkoster!: Farkoster;
    /** Dørene ut: portalene i hallen, og porten hjem fra en epoke. */
    private porter!: Portaler;
    /** Sølv og gjenstander som ligger på bakken. */
    private lootSystem!: Loot;
    /**
     * De andre elevene i hallen, og benkene de kan sette seg på.
     *
     * `null` overalt utenom hubben. Det er ikke en optimalisering - det er
     * regelen i blueprintens §4.1: hubben er sammen, epokene er alene. Står
     * feltet som null i en epoke, kan ingen kode der komme til å tegne en
     * medelev inn i et øyeblikk som skal være stille.
     */
    private gjester: Gjester | null = null;
    private samvaer: Samvaer | null = null;
    /** Egen stilling meldes ti ganger i sekundet, ikke seksti. */
    private stillingTimer = 0;
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
    /** Går det en cutscene? Da hviler E-tasten og alt annet som vil ha den. */
    private klippGaar = false;
    private avmeldinger: (() => void)[] = [];
    /** En reise er bestilt. Hindrer at to avreiser overlapper. */
    private reiser = false;
    /** Stedet eleven kom fra, hvis hun kom gjennom en dør. */
    private fraSted: string | null = null;
    /** Stedet den bestilte reisen går fra. Blir `fraSted` på den andre siden. */
    private reiserFra: string | null = null;

    constructor() {
        super(VERDEN_SCENE);
    }

    init(data: { stedId?: string; quester: QuestDef[]; fraSted?: string }) {
        this.quester = data.quester ?? [];
        this.sted = stedEllerStart(data.stedId);
        this.fraSted = data.fraSted ?? null;
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
            sted.spawner,
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
            this.ankomstRute(),
            regler,
            {
                fiender: () => this.fiendeSystem.alle(),
                skadFiende: (f, skade, kritisk, vinkel, kraft) => {
                    // Opplæringen teller slagene som lander. Den ligger foran
                    // og ikke inne i fiendesystemet fordi det ikke er fiendens
                    // sak at noen holder på å lære seg å slå.
                    this.opplaering.treff(f);
                    this.fiendeSystem.skad(f, skade, kritisk, vinkel, kraft);
                },
                stotBort: (f, vinkel, fart) => this.fiendeSystem.stotBort(f, vinkel, fart),
                hitstop: (ms) => this.hitstop(ms),
                laas: (pa) => this.settLaast(pa),
                meldForsvar: (art, f) => this.opplaering.forsvar(art, f),
            }
        );
        this.opplaering = new Opplaering({
            settUt: (defId, x, y, valg) => {
                const def = ENEMY_BY_ID[defId];
                return def ? this.fiendeSystem.settUt(def, x, y, valg) : null;
            },
            hentInn: (f) => this.fiendeSystem.hentInn(f),
            spiller: () => this.helt.sprite,
            ovingsmodus: (pa) => this.helt.settOvingsmodus(pa),
            visNpc: (npcId, synlig) => this.samhandling.settSynlig(npcId, synlig),
        });
        this.raidet = new Raidet({
            settUt: (defId, x, y, valg) => {
                const def = ENEMY_BY_ID[defId];
                return def ? this.fiendeSystem.settUt(def, x, y, valg) : null;
            },
            musikkRot: sted.musikkRot,
        });
        // Gården eies av kapittelet, ikke av stedet: det er 872 som har et
        // årshjul, ikke Nordvik.
        this.gaarden =
            sted.kapittel === 2
                ? new Gaarden({
                      settSynlig: (npcId, synlig) => this.samhandling.settSynlig(npcId, synlig),
                      varsleAngrep: () => this.angrepet?.varsle(),
                  })
                : null;
        this.angrepet =
            sted.kapittel === 2
                ? new Angrepet({
                      settUt: (defId, x, y, valg) => {
                          const def = ENEMY_BY_ID[defId];
                          return def ? this.fiendeSystem.settUt(def, x, y, valg) : null;
                      },
                      settSynlig: (npcId, synlig) => this.samhandling.settSynlig(npcId, synlig),
                      musikkRot: sted.musikkRot,
                  })
                : null;
        this.holmgang =
            sted.kapittel === 3
                ? new Holmgang({
                      settUt: (defId, x, y, valg) => {
                          const def = ENEMY_BY_ID[defId];
                          return def ? this.fiendeSystem.settUt(def, x, y, valg) : null;
                      },
                      hentInn: (f) => this.fiendeSystem.hentInn(f),
                      spiller: () => this.helt.sprite,
                      settSpiller: (x, y) => this.flyttHelt(x, y),
                      ovingsmodus: (pa) => this.helt.settOvingsmodus(pa),
                      nyttVern: () => this.helt.nyttVern(),
                      vernHelse: () => this.helt.vernHelse,
                      leggUtHud: (x, y, w, h) => this.leggUtHud(x, y, w, h),
                      taOppHud: () => this.taOppHud(),
                      musikkRot: sted.musikkRot,
                  })
                : null;
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
        this.porter = new Portaler(this, sted.portaler ?? [], {
            spiller: () => this.helt.sprite,
            reis: (stedId) => this.bestillReise(stedId),
        });
        // Samværet finnes bare der stedet sier at det deles. Benkene uten
        // flerspiller ville vært møbler uten grunn, og flerspiller uten benker
        // et rom uten noe å gjøre i - de to hører sammen.
        if (sted.flerspiller) {
            this.gjester = new Gjester(this);
            this.samvaer = new Samvaer(this, sted.sitteplasser ?? [], {
                spiller: () => this.helt.sprite,
                settSitter: (plass) => this.helt.settSitter(plass),
                akse: () => this.helt.akse(),
            });
        }
        this.verden.byggTerreng();
        this.verden.byggKollisjon();
        this.verden.byggProps();
        this.helt.bygg();
        this.samhandling.bygg();
        this.farkoster.bygg();
        this.porter.bygg();
        this.fiendeSystem.byggBoss();
        this.verden.byggAtmosfare(sted.landemerker, sted.taake ?? 1);
        this.settOppKamera();
        this.lyttPaaUi();

        startMusikk(sted.musikkRot, 0);
        // Både `shutdown` og `destroy`. De to er ikke det samme, og forskjellen
        // kostet en ettermiddag: Phaser sender `shutdown` når scenen stoppes
        // (en reise), men `destroy` når hele spillet rives - og React river
        // spillet hver eneste gang i utviklingsmodus, fordi StrictMode kjører
        // oppstartseffekten to ganger.
        //
        // Sto bare `shutdown` her, ble den døde scenen liggende igjen som
        // lytter på broen. Neste hendelse som ba den tegne noe - en medelev som
        // kom inn i hallen - slo i «Cannot read properties of null (reading
        // renderer)», for teksturlageret hennes hørte til et spill som ikke
        // fantes lenger. Ingenting i hallen ble tegnet, og feilen pekte på
        // Phaser og ikke på oss.
        this.events.once('shutdown', this.ryddEnGang);
        this.events.once('destroy', this.ryddEnGang);

        // Stedet huskes, så neste økt begynner der eleven slapp. Går reisen
        // over en epokegrense, legger storen den forrige epoken til side hel.
        useRpgStore.getState().ankomSted(sted.id, sted.epokeId);
        fraSpill.emit('sone', {
            stedId: sted.id,
            tittel: sted.tittel,
            undertittel: sted.undertittel,
        });

        this.aapneStedet();
    }

    /**
     * Det som skal skje i det eleven kommer fram et sted.
     *
     * Ligger her og ikke i `steder.ts` av samme grunn som handlingene: dataene
     * sier hva et sted *er*, scenen sier hva som skjer. Et felt i registeret som
     * het `naarHunKommer` ville før eller siden fått et helt kapittel i seg.
     */
    private aapneStedet(): void {
        // Opptakten eier skjermen først. Kommer hun rett inn i verden og møter
        // Torgeir før hun vet at hun er Åsa, er kapittelskiftet bare et
        // kartbytte med nye navn på folk.
        if (this.visOpptakt()) return;
        // Gården setter seg selv i takt med årstiden: hvem som står på tunet,
        // og hva hun holder på med. Uten dette kommer hun hjem fra hallen midt
        // i sommeren til et tomt tun.
        this.gaarden?.oppdater();
        // Båten i vika står i lagringen, ikke i et felt i minnet: går hun en tur
        // innom hallen midt i det, skal de fem mennene fortsatt være på vei inn.
        this.angrepet?.gjenopprett();
        // Samme regel for huden på vollen: er hun utfordret, står avtalen der
        // også etter en tur innom hallen.
        this.holmgang?.gjenopprett();
        if (this.sted.id !== 'lindisfarne') return;
        const store = useRpgStore.getState();
        if (store.steg.includes(K1.motstanden)) {
            // Hun har vært her før. Ingen ny cutscene og ingen nye forsvarere -
            // øya skal ikke fylle seg opp på nytt hver gang hun seiler tilbake
            // for å hente det hun lot ligge.
            this.raidet.start();
            return;
        }
        void this.spillKlipp(STRANDA).then(() => {
            useRpgStore.getState().fullforSteg(K1.stranda);
            this.raidet.start();
        });
    }

    /**
     * Skal kapittelets åpningsskjerm stå nå?
     *
     * Bare på et sted som hører til et kapittel eleven ikke har begynt på ennå,
     * og aldri i kapittel 1: det begynner med karakterskaperen, og to
     * åpningsskjermer etter hverandre er én for mye.
     *
     * Merket ligger i `sette` sammen med cutscenene. Opptakten *er* en slik
     * scene - den skal vises én gang, og aldri igjen når eleven kommer hjem fra
     * hallen midt i året.
     */
    private visOpptakt(): boolean {
        const nr = this.sted.kapittel ?? 0;
        if (nr < 2) return false;
        const store = useRpgStore.getState();
        if (store.sette.includes(`opptakt:k${nr}`)) return false;
        this.settLaast(true);
        fraSpill.emit('opptakt', { nr });
        return true;
    }

    /**
     * Ruta eleven står på ved ankomst.
     *
     * Kom hun gjennom en dør, skal hun komme ut av den samme døra på andre
     * siden - ikke ved stedets faste startpunkt. Uten dette lander hun i vest
     * ved bålet hver eneste gang hun kommer hjem fra en epoke, og må gå hele
     * tidslinjeveien østover på nytt for å komme tilbake dit hun var. Det er en
     * straff for å ha reist.
     */
    private ankomstRute(): [number, number] {
        const { sted } = this;
        if (!this.fraSted) return sted.spawn;
        const port = (sted.portaler ?? []).find((p) =>
            p.maal.art === 'sted'
                ? p.maal.stedId === this.fraSted
                : stedIEpoke(p.maal.epokeId, kapittelIEpoke(p.maal.epokeId)) === this.fraSted
        );
        // Tre ruter under porten: hun skal stå foran den, ikke inni den - og
        // ikke oppå skiltet, som henger like under.
        return port ? [port.tile[0], port.tile[1] + 3] : sted.spawn;
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
            tilSpill.on('gjenoppliv', () => this.helt.gjenoppliv()),
            // Bildet av rommet kommer hit ti ganger i sekundet per elev der
            // ute. Det er derfor det går over broen og ikke gjennom
            // React-tilstand: en gjentegning per melding ville tegnet hele
            // grensesnittet hundre ganger i sekundet.
            tilSpill.on('gjester', ({ liste }) => this.gjester?.motta(liste)),
            tilSpill.on('folelse', ({ emoji }) => this.samvaer?.visFolelse(emoji)),
            tilSpill.on('npcHandling', ({ npcId, handlingId }) =>
                this.utforHandling(npcId, handlingId)
            ),
            tilSpill.on('puzzleSvar', ({ id, lost, forsteForsok, utfall }) =>
                this.avsluttPuzzle(id, lost, Boolean(forsteForsok), utfall)
            ),
            // Bordet holder ingen regnskap selv - det melder bare at hun la fra
            // seg kildene, og hva hun rakk. Konteringen ligger her, ved siden
            // av alt annet som deler ut begreper.
            tilSpill.on('mellomspillFerdig', ({ id, gjennomgatt }) =>
                this.avsluttMellomspill(id, gjennomgatt)
            ),
            tilSpill.on('opptaktFerdig', ({ nr }) => {
                useRpgStore.getState().markerSett(`opptakt:k${nr}`);
                this.settLaast(false);
                // Året skal stå riktig i det hun får gå: hvem som er på tunet,
                // og hva oppgavekortet sier.
                this.gaarden?.oppdater();
            }),
            tilSpill.on('landemerkeHandling', ({ handlingId }) =>
                this.utforLandemerkeHandling(handlingId)
            ),
            tilSpill.on('forradValg', ({ beslutning, alternativ }) => {
                this.gaarden?.velg(beslutning, alternativ);
                this.apneBua();
            }),
            tilSpill.on('forradVidere', () => {
                this.gaarden?.gaaVidere();
                // Vinteren gjør opp og sender sitt eget skjermbilde. Da skal
                // ikke bua legge seg oppå det igjen.
                if (useRpgStore.getState().steg.includes(K2.vinteren)) return;
                this.apneBua();
            }),
            tilSpill.on('forradLukk', () => this.settLaast(false)),
            tilSpill.on('beskjedLest', () => {
                this.settLaast(false);
                this.bordetEtterKapittelet();
            }),
            tilSpill.on('tingsakSvar', (svar) => this.forSaken(svar))
        );
    }

    /**
     * Ryddingen, koblet til begge sluttene og kjørt nøyaktig én gang.
     *
     * Den melder seg av begge før den rydder. Uten det ville en scene som har
     * vært gjennom fem reiser stå med fem `destroy`-lyttere - ufarlig, siden
     * `rydd()` tåler å kjøres to ganger, men det er den slags rot som gjør at
     * neste feil tar en ettermiddag i stedet for ti minutter.
     */
    private ryddEnGang = () => {
        this.events.off('shutdown', this.ryddEnGang);
        this.events.off('destroy', this.ryddEnGang);
        this.rydd();
    };

    private rydd() {
        stopMusikk();
        for (const av of this.avmeldinger) av();
        this.avmeldinger = [];
        // Kamerastøtet kan stå midt i en tween, og blod, biter og lik er egne
        // bilder som må ryddes.
        this.fx.vask();
        // Gjestene ligger i et kart utenfor visningslista. Phaser river
        // sprite-ene med scenen, men ikke kartet - og en reise ut av hallen
        // ville ellers latt figurene stå igjen som nøkler til bilder som er
        // borte.
        this.gjester?.vask();
        this.gjester = null;
        this.samvaer = null;
        // Oppgavekortet og replikklinja lever i React, ikke i scenen. Phaser
        // river ingenting av det, så en reise midt i en økt med Ravn ville latt
        // «Blokker tre slag» stå igjen over et kloster i Northumbria.
        fraSpill.emit('oppgave', null);
        fraSpill.emit('replikk', null);
    }

    // ── Oppdatering ─────────────────────────────────────────────────────────

    update(_tid: number, delta: number) {
        // Saktefilmen telles ned først av alt, før enhver tidlig retur. Lå den
        // etter hitstop- eller lås-returen, kunne den henge igjen for alltid hvis
        // eleven åpnet en dialog i drapsøyeblikket - og da ville hele spillet gå
        // i sirup uten at noen skjønte hvorfor.
        this.fx.tikk(delta);

        // De andre i hallen tikker før alle tidlige returer, og i vanlig tid.
        // Hallen skal leve videre mens eleven leser et skilt: en verden som
        // fryser fordi hun åpnet en tekst, leser som at nettet falt ut. Det er
        // trygt fordi det ikke finnes noe der ute som kan skade henne - de
        // andre er bilder, ikke kropper.
        this.gjester?.oppdater(delta);

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
        // Portalen kommer før folk og steiner: står eleven i porten, skal ett
        // trykk føre henne gjennom, ikke åpne skiltet ved siden av.
        const portEier = this.porter.sjekk(delta, brukTrykk, !farkostEier);
        const opptatt = farkostEier || portEier;

        // Rekkefølgen mellom benken og folk er ikke vilkårlig, og den ble
        // rettet etter en måling: benken sto først, og da stjal den E-tasten fra
        // varden som står tre ruter unna - eleven kunne ikke legge steinen sin.
        //
        // Regelen er nå: **innholdet vinner over møbelet.** Står hun ved en
        // person eller en stein med noe å lese i, gjelder E den. Ett unntak,
        // og det er nødvendig: sitter hun allerede, eier benken trykket, ellers
        // ville E åpnet skiltet ved siden av og latt henne bli sittende.
        const sitter = this.samvaer?.sitter ?? false;
        const benkEier = sitter
            ? (this.samvaer?.sjekk(delta, brukTrykk, !opptatt) ?? false)
            : false;
        // Under opplæringen hviler samhandlingen helt. Ravn står som fiende på
        // tunet, og et hint om at E snakker med Bera tre ruter unna er det
        // siste eleven skal lese midt i en parade.
        const folkEier = this.samhandling.sjekk(
            opptatt || benkEier || this.opplaering.gaar ? false : brukTrykk,
            !opptatt && !benkEier && !this.opplaering.gaar
        );
        this.opplaering.oppdater(delta);
        this.raidet.oppdater(delta);
        this.angrepet?.oppdater(delta);
        this.holmgang?.oppdater(delta);
        if (!sitter) {
            this.samvaer?.sjekk(
                delta,
                opptatt || folkEier ? false : brukTrykk,
                !opptatt && !folkEier
            );
        }
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
        this.meldStilling(delta);
        this.oppdaterKompass(dt);
        // HUD-en og hjerteslaget skal gå i vanlig tid, ikke i saktefilm.
        this.oppdaterKampUi(delta);
        // Skjermknappene leses én gang per bilde og tømmes så.
        this.helt.tomTouchTrykk();
    }

    /**
     * Melder hvor eleven står, til de andre i hallen.
     *
     * Ti ganger i sekundet, ikke seksti. Scenen vet ikke at det finnes et nett -
     * den sier bare hvor hun står, og React tar det videre hvis noen lytter.
     * Står hun ikke på et sted som deles, sendes ingenting i det hele tatt.
     */
    private meldStilling(delta: number) {
        if (!this.gjester) return;
        this.stillingTimer -= delta;
        if (this.stillingTimer > 0) return;
        this.stillingTimer = 100;
        fraSpill.emit('minStilling', this.helt.stilling(this.samvaer?.sitter ?? false));
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
        // Å forlate øya *er* å ha gjort seg ferdig der. Hun trenger ikke ta
        // noe som helst - å la alt ligge er et av valgene (§3), og steget skal
        // føres uansett. Ellers ville Orm hjemme stått og ventet på et bytte som
        // aldri kom, og kapittelet kunne ikke avsluttes.
        if (this.sted.id === 'lindisfarne' && useRpgStore.getState().steg.includes(K1.motstanden)) {
            useRpgStore.getState().fullforSteg(K1.byttet);
        }
        // Raidet eier oppgavekortet og navnestolpen. Begge lever i React, og
        // uten dette ville «Ta det du vil ha» blitt stående over fjorden hjemme.
        this.raidet.avslutt();
        this.angrepet?.avslutt();
        this.holmgang?.avslutt();
        this.reiser = true;
        this.reiserFra = this.sted.id;
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
            this.time.delayedCall(0, () =>
                this.scene.restart({ stedId, quester, fraSted: this.reiserFra })
            );
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

    /** Portalene på stedet. Prøveskriptene leser dem herfra. */
    portalOversikt() {
        return this.porter.oversikt();
    }

    /**
     * De andre i hallen, slik de faktisk er tegnet. Prøveskriptene leser dem
     * herfra - det er den eneste måten å måle at etterslepet og glidningen
     * virker uten å ha to nettlesere i rommet samtidig.
     */
    gjesteOversikt() {
        return this.gjester?.oversikt() ?? [];
    }

    /** Sitter eleven på en benk? Prøveskriptene leser den herfra. */
    sitterNaa() {
        return this.samvaer?.sitter ?? false;
    }

    /** Følelsen eleven viser nå, eller null. Prøveskriptene leser den herfra. */
    folelseNaa() {
        return this.samvaer?.folelse ?? null;
    }

    /**
     * Setter eleven et annet sted på kartet.
     *
     * Finnes for prøveskriptene: å gå åtte sekunder langs tidslinjeveien er en
     * fin opplevelse for en elev og bortkastet tid for en måling. Cutscenene
     * bruker det samme.
     */
    flyttHelt(x: number, y: number) {
        this.helt.sprite.setPosition(x, y);
    }

    // ── Kapittelet ──────────────────────────────────────────────────────────

    /**
     * Eleven valgte en kapittelhandling i en samtale.
     *
     * Scenen eier hva som skjer, ikke dataene. En handling i `steder.ts` er et
     * navn og en knapp; hva Nordvik faktisk gjør når Ravn reiser seg, hører
     * hjemme her - ved siden av alt annet som kan låse verden.
     */
    private utforHandling(npcId: string, handlingId: string): void {
        // Låsen som dialogen satte må av først. Blir den stående, står eleven
        // og ser på at Ravn slår uten å kunne løfte skjoldet.
        this.settLaast(false);
        switch (handlingId) {
            case 'ravn-opplaering': {
                const mal = this.samhandling.mal('npc', npcId);
                if (!mal) return;
                this.opplaering.start(npcId, { x: mal.x, y: mal.y });
                return;
            }
            case 'orm-skroget': {
                // Puzzlet tar over skjermen, så verden må stå stille bak det.
                // Låsen tas av igjen når React svarer med `puzzleSvar`.
                this.settLaast(true);
                fraSpill.emit('puzzle', { id: 'skroget' });
                return;
            }
            case 'orm-ferden': {
                this.settLaast(true);
                fraSpill.emit('puzzle', { id: 'navigasjonen' });
                return;
            }
            case 'orm-hjemkomst': {
                const store = useRpgStore.getState();
                store.fullforSteg(K1.hjem);
                // Hun dro ut om sommeren og er hjemme før slåtten. Det er hele
                // begrepet: å dra i viking var noe man gjorde, ikke noe man var
                // - og nå har hun gjort det, tur-retur.
                store.larBegrep('haerferd', 'forstatt');
                store.fullforKapittel(1, 'Kapittel 1: Skroget og stranda');
                store.varsle('Kapittel 1 er over. 793 er bak deg.', 'niva');
                // Og så bordet, med én gang. Kapittelet er spillbart uten
                // mellomspillet, men det er ikke ferdig uten det: hele grunnen
                // til at hun utførte raidet selv, ligger i det tomme feltet på
                // bordet etterpå (blueprint §3 og §6).
                const bordet = KAPITTEL_BY_NR[1]?.mellomspillEtter;
                if (bordet) this.apneMellomspill(bordet);
                return;
            }
            // ── Sommeren på tunet: hvem mater du? ───────────────────────────
            // Alle tre går gjennom `Gaarden`, som eier kornet og følgene.
            // Dialogen har alt sagt hva det koster; her betales det.
            case 'gave-harald': {
                this.gaarden?.gave('harald', true);
                return;
            }
            case 'gave-motstanderne': {
                this.gaarden?.gave('motstanderne', true);
                return;
            }
            case 'gave-saebo': {
                this.gaarden?.gave('saebo', true);
                return;
            }
            case 'nekt-harald': {
                this.gaarden?.gave('harald', false);
                return;
            }
            case 'nekt-motstanderne': {
                this.gaarden?.gave('motstanderne', false);
                return;
            }
            case 'nekt-saebo': {
                this.gaarden?.gave('saebo', false);
                return;
            }
            case 'kaare-vaapen': {
                // Et spyd i hendene på en ufri mann. Spillet sier ingenting om
                // hva det betyr - det kommer i det han står der etterpå.
                const store = useRpgStore.getState();
                store.settFlagg(ANGREP_FLAGG.kaareVaepnet);
                store.fullforSteg('k2-kaare-vaapen');
                store.larBegrep('trell', 'forstatt');
                return;
            }
            // ── 995: vilkårene fra fjæra ────────────────────────────────────
            case 'ragnvald-vilkaarene': {
                // Samtalen *er* handlingen, som hos Torgeir i 872. Kongens
                // mann sier hva som skal skje, og fra nå av vet Torgils hva
                // fristen er. Ingen skjerm skal legge seg oppå det: hele
                // kapittelet er svaret på det han nettopp sa.
                useRpgStore.getState().fullforSteg(K3.knarren);
                return;
            }
            case 'skjalg-utfordring': {
                // Utfordringen er ikke en oppgave hun tok imot - den er noe
                // som skjedde med henne. Merket finnes bare så knappen på
                // vollen vet at det står en avtale i verden.
                useRpgStore.getState().fullforSteg(K3.utfordret);
                this.holmgang?.utfordre();
                return;
            }
            case 'torgeir-noklene': {
                // Her er samtalen selve handlingen. Torgeir forteller Åsa hva
                // som ligger i bua, og det er alt steget er - hun vet nå hva
                // hun har å rutte med. Ingen egen skjerm skal ligge her:
                // forrådet er et eget steg, og et kapittel som åpner med to
                // paneler etter hverandre begynner med papirarbeid.
                useRpgStore.getState().fullforSteg(K2.noklene);
                this.gaarden?.oppdater();
                return;
            }
            default:
                return;
        }
    }

    /** Eleven trykket på knappen ved et landemerke. */
    private utforLandemerkeHandling(handlingId: string): void {
        this.settLaast(false);
        if (handlingId === 'bua-forradet') this.apneBua();
        if (handlingId === 'gaa-i-fjaera') this.angrepet?.mot();
        if (handlingId === 'til-tinget') this.apneTinget();
        if (handlingId === 'gaa-paa-huden') this.holmgang?.start();
        if (handlingId === 'kall-sammen') {
            this.settLaast(true);
            fraSpill.emit('puzzle', { id: 'vinternettene' });
        }
        if (handlingId === 'hold-blot') {
            // Verden må stå stille bak horgen. Låsen tas av igjen når React
            // svarer med `puzzleSvar`, som for de andre puzzlene.
            this.settLaast(true);
            fraSpill.emit('puzzle', { id: 'blotet' });
        }
    }

    // ── Huden på vollen ─────────────────────────────────────────────────────

    /**
     * Legger huden ut på bakken.
     *
     * Den tegnes her og ikke i `Holmgang`, av samme grunn som ellers: modulen
     * eier reglene, scenen eier alt som er Phaser. Dybden er over terrenget og
     * under folk, så begge kan gå oppå den.
     *
     * Kanten er ikke pynt. Den *er* arenaen, og eleven må kunne se nøyaktig
     * hvor den går mens hun viker - derfor en hard, lys strek og ikke en
     * uttonet flate.
     */
    private leggUtHud(x: number, y: number, w: number, h: number): void {
        this.taOppHud();
        const g = this.add.graphics().setDepth(-950);
        g.fillStyle(0x8a7048, 1).fillRect(x - w / 2, y - h / 2, w, h);
        g.fillStyle(0x7a6140, 1).fillRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8);
        g.lineStyle(2, 0xd8c48a, 0.95).strokeRect(x - w / 2, y - h / 2, w, h);
        // Løkkene i hjørnene. En holmgangshud ble spent fast med tjorer, og de
        // fire pluggene er det eneste som holdt arenaen på plass.
        g.fillStyle(0x2f2418, 1);
        for (const [dx, dy] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
        ]) {
            g.fillCircle(x + (dx * w) / 2, y + (dy * h) / 2, 3);
        }
        this.hudBilde = g;
    }

    private taOppHud(): void {
        this.hudBilde?.destroy();
        this.hudBilde = null;
    }

    // ── Tinget ──────────────────────────────────────────────────────────────

    /**
     * Tinget settes. Verden står låst bak vollen.
     *
     * Bare når det finnes en sak som ikke er avgjort. Er den ført, er den ført -
     * en dom som kan spilles om igjen er ingen dom.
     */
    private apneTinget(): void {
        const sak = useRpgStore.getState().saker.find((s) => s.dom === 'ubehandlet');
        if (!sak) return;
        this.settLaast(true);
        fraSpill.emit('tingsak', { sakId: sak.id });
    }

    /**
     * Ett skritt i saken.
     *
     * Scenen er den ene som skriver i den. Skjermen på vollen viser trinnene og
     * melder hva Åsa gjorde - den skal ikke kunne komme til å dømme.
     */
    private forSaken(svar: UiEvents['tingsakSvar']): void {
        const store = useRpgStore.getState();
        const sak = store.saker.find((s) => s.dom === 'ubehandlet');
        if (!sak) return;
        switch (svar.art) {
            case 'lys':
                // Fristen måles her og ikke i skjermen: en frist en komponent
                // kan tolke, er en frist to steder kan være uenige om.
                if (!innenforFristen(sak, store.klokke.dag)) return;
                store.endreSak(sak.id, { lyst: true });
                store.varsle('Du lyste drapet. Nå er det en sak, ikke et mord.', 'info');
                return;
            case 'vitner':
                store.endreSak(sak.id, { vitner: svar.vitner });
                return;
            case 'hjemmel':
                store.endreSak(sak.id, { anfort: svar.id });
                return;
            case 'lukk':
                this.settLaast(false);
                return;
            case 'dom':
                this.avsiDom(sak.id);
        }
    }

    /**
     * Dommen faller, og gården lever med den.
     *
     * Fredløshet er ikke game over (§16.2 og §7.1). Det er en tilstand, og den
     * lærer hva et samfunn uten stat gjør med den det støter ut.
     */
    private avsiDom(sakId: string): void {
        const store = useRpgStore.getState();
        const sak = store.saker.find((s) => s.id === sakId);
        if (!sak) return;
        const dom = dommen(sak, store.aere);
        store.endreSak(sakId, { dom: dom.dom });
        store.larBegrep('mannebot', 'forstatt');
        store.fullforPuzzle(`sak-${sakId}`, 'Du førte en sak på tinget');

        if (dom.dom === 'frikjent') {
            store.giAere(12, 'Tinget ga deg medhold. Alle hørte hjemmelen din.');
            store.endreAett('hovda', { uoppgjort: -1 });
        } else if (dom.dom === 'bot') {
            store.giAere(6, 'Du gjorde opp for deg. Det er slik en strid tar slutt.');
            store.endreForrad({ korn: -BOT_I_KORN });
            store.endreAett('hovda', { uoppgjort: -1 });
        } else {
            store.giAere(-25, 'Du tidde. Tinget dømte deg fredløs.');
            useRpgStore.setState({ fredlos: true });
        }

        this.settLaast(false);
        fraSpill.emit('beskjed', {
            tittel:
                dom.dom === 'frikjent'
                    ? 'Du står lovlig'
                    : dom.dom === 'bot'
                      ? 'Boten er satt'
                      : 'Fredløs',
            tekst: [dom.kjennelse, dom.folge].filter(Boolean).join('\n\n'),
            knapp: 'Gå hjem',
        });
    }

    /**
     * Åpner bua. Verden står låst bak den.
     *
     * Kalles også etter hvert valg: skjermen skal vise året slik det er *nå*,
     * og hvilke valg som står åpne kan ha endret seg av det hun nettopp gjorde.
     */
    private apneBua(): void {
        const bua = this.gaarden?.bua();
        if (!bua) return;
        this.settLaast(true);
        fraSpill.emit('forrad', bua);
    }

    /**
     * Et puzzle er over. Scenen eier hva det førte til.
     *
     * Belønningen ligger her og ikke i komponenten fordi det er spillet som
     * skal avgjøre hva et løst puzzle betyr - React tegner det, den skal ikke
     * dele ut begreper.
     */
    private avsluttPuzzle(
        id: string,
        lost: boolean,
        forsteForsok: boolean,
        utfall?: string
    ): void {
        this.settLaast(false);
        if (!lost) return;
        const store = useRpgStore.getState();
        switch (id) {
            case 'vinternettene': {
                this.vinternettene(utfall);
                return;
            }
            case 'blotet': {
                // Blotet er det ene puzzlet som ikke kan mislykkes, bare gå
                // dårlig. Steget er gjort - hun holdt et blot - men begrepet
                // står på «hørt» til gaven passet til guden og til tiden.
                // Ingen sier hvorfor. Ulv står ved hovet i morgen også.
                store.fullforSteg(K3.blotet);
                if (utfall !== 'passet') {
                    store.larBegrep('blot', 'hort');
                    return;
                }
                store.fullforPuzzle('blotet', 'Du holdt et blot bygda ble værende i');
                store.larBegrep('blot', 'forstatt');
                store.giAere(10, 'Bygda ble til det lysnet. Det snakkes om det.');
                return;
            }
            case 'skroget': {
                store.fullforSteg(K1.skroget);
                store.fullforPuzzle('skroget', 'Du bygget et skrog som fløt');
                store.larBegrep('klinkbygging', 'forstatt');
                if (forsteForsok) store.settFlagg(K1_FLAGG.skrogetHeltFint);
                // Sjøsettingen kommer med én gang. Å måtte gå ut av naustet og
                // finne Orm igjen for å se skipet sitt gå på vannet, ville lagt
                // et ærend mellom handlingen og følgen av den.
                void this.spillKlipp(SJOSETTINGEN).then(() => {
                    useRpgStore.getState().fullforSteg(K1.sjosettingen);
                });
                return;
            }
            case 'navigasjonen': {
                store.fullforSteg(K1.navigasjonen);
                store.fullforPuzzle('navigasjonen', 'Du holdt breddegraden vestover');
                store.larBegrep('breddegradseiling', 'forstatt');
                // Reisen bestilles med én gang. Overfarten *er* puzzlet - å
                // sette henne tilbake på brygga for å gå om bord etterpå ville
                // gjort seilasen til en meny hun må gjennom to ganger.
                this.bestillReise('lindisfarne');
                return;
            }
            default:
                return;
        }
    }

    /**
     * Gården har svart, og kapittelet er over.
     *
     * Ingen av de tre svarene er feil, og ingen av dem gir mer enn de andre i
     * begreper. Det som skiller dem er hva kongen gjør etterpå - en gave, et
     * skuldertrekk, eller tre mark og et revet hov - og hvem Torgils er når
     * kirken står der neste vår.
     */
    private vinternettene(utfall?: string): void {
        const store = useRpgStore.getState();
        if (store.steg.includes(K3.valget)) return;
        store.fullforSteg(K3.valget);
        store.larBegrep('kristningen', 'forstatt');
        store.larBegrep('sed', 'forstatt');

        if (utfall === 'dopt') {
            store.settFlagg(K3_FLAGG.dopt);
            // Kongens gave er ikke en belønning fra spillet. Den er en
            // kvittering, og den sto i kildene lenge før den sto her.
            store.giSolv(40);
            store.giAere(6, 'Kongen ga deg en armring. Alle i fjorden vet hvorfor.');
        } else if (utfall === 'primsignet') {
            store.settFlagg(K3_FLAGG.primsignet);
            store.larBegrep('primsigning', 'forstatt');
        } else {
            store.settFlagg(K3_FLAGG.nektet);
            store.giSolv(-Math.min(store.solv, 60));
            store.giAere(14, 'Du sa nei mens tolv menn hørte på. Det snakkes om det.');
        }

        store.fullforKapittel(3, 'Kapittel 3: Blot eller dåp');
        store.varsle('Kapittel 3 er over. 995 er bak deg.', 'niva');
        fraSpill.emit('oppgave', null);
        fraSpill.emit('beskjed', {
            tittel: 'Vinteren 995',
            tekst: [
                'Skipet gikk ut fjorden dagen etter. Det kom ikke tilbake det året.',
                utfall === 'nektet'
                    ? 'Der hovet sto, ligger det bare stokker og sot. Ulv kommer fortsatt opp dit om morgenen. Han har ingenting å gjøre der, og han går likevel.'
                    : 'Der hovet sto, er det ryddet. Grunnen ligger flat og venter på noe.',
                'Broren din snakker med kongens folk nå. Det gjør ikke du.',
            ].join('\n\n'),
            knapp: 'Videre',
        });
    }

    // ── Mellomspillet ───────────────────────────────────────────────────────

    /**
     * Åpner bordet med kildene. Verden står låst bak det.
     *
     * Offentlig fordi den har to innganger: Orm, når hun kommer hjem, og
     * pausemenyen etterpå. Et bord hun bare får se én gang er et bord hun
     * kommer til å klikke seg gjennom - og kildekritikk er det eneste i dette
     * spillet som blir bedre av å leses to ganger.
     */
    apneMellomspill(id: string): void {
        if (!MELLOMSPILL_BY_ID[id]) return;
        this.settLaast(true);
        fraSpill.emit('mellomspill', { id });
    }

    /**
     * Kapittelet er over, og beskjeden om det er lest. Da kommer bordet.
     *
     * Kapittel 1 åpner mellomspillet rett fra Orm, for der er hjemkomsten en
     * samtale. Kapittel 2 ender i et fullskjerms oppgjør - vinteren - og bordet
     * må vente til hun har lest det: to skjermbilder oppå hverandre er ett hun
     * ikke leser.
     *
     * Vakten er `kapittel:N` i storen og ikke et eget flagg per kapittel. Da
     * gjelder samme regel for alle kapitler som ender i en beskjed, og den er
     * den samme regelen som pausemenyen bruker for å vise bordene igjen.
     */
    private bordetEtterKapittelet(): void {
        const store = useRpgStore.getState();
        const kapittel = KAPITTEL_BY_NR[store.kapittel];
        const bordet = kapittel?.mellomspillEtter;
        // Et mellomspill som ikke er bygget ennå, gjør ingenting. Det er
        // grunnen til at kapittel 2 var spillbart uten dette bordet - men også
        // grunnen til at det ikke var ferdig.
        if (!bordet || !MELLOMSPILL_BY_ID[bordet]) return;
        if (!store.steg.includes(`kapittel:${kapittel.nr}`)) return;
        if (store.steg.includes(`mellomspill:${bordet}`)) return;
        this.apneMellomspill(bordet);
    }

    /**
     * Hun la fra seg kildene.
     *
     * Begrepene deles ut her og ikke i komponenten, av samme grunn som for
     * puzzlene: React tegner bordet, den skal ikke avgjøre hva et bord er
     * verdt. Gikk hun før det tomme feltet, har hun ikke sett det som var
     * poenget, og da er ingenting fullført.
     */
    private avsluttMellomspill(id: string, gjennomgatt: boolean): void {
        this.settLaast(false);
        const def = MELLOMSPILL_BY_ID[id];
        if (!def || !gjennomgatt) return;
        const store = useRpgStore.getState();
        store.fullforMellomspill(def.id, `Mellomspill ${def.nr}: ${def.tittel}`);
        for (const begrepId of def.begreper) store.larBegrep(begrepId, 'forstatt');
        this.gaaVidereTilNesteKapittel(def.nr);
    }

    /**
     * Bordet er ryddet, og året er over.
     *
     * Neste kapittel begynner med én gang. Å la eleven bli stående i 793 etter
     * at kildene er lagt bort, ville gjort kampanjen til en samling årstall hun
     * må finne inngangen til selv - og det finnes ingen inngang, for Orm har
     * ikke mer å si.
     *
     * Vakten er kapittelnummeret i storen, ikke mellomspillet: bordet ligger
     * framme i pausemenyen etterpå, og det skal kunne leses om igjen uten å
     * sende henne 79 år fram hver gang.
     */
    private gaaVidereTilNesteKapittel(fraNr: number): void {
        const store = useRpgStore.getState();
        if (store.kapittel !== fraNr) return;
        const neste = KAPITTEL_BY_NR[fraNr + 1];
        // Er neste kapittel ikke bygget ennå, blir hun stående i det hun kan.
        // Et kapittel uten steg er et tomt kart, og det er verre enn å vente.
        if (!neste || neste.steg.length === 0) return;
        const stedId = stedIEpoke(this.sted.epokeId ?? '', neste.nr);
        if (!stedId) return;
        store.byttKapittel(neste.nr);
        this.bestillReise(stedId);
    }

    // ── Cutscenes ───────────────────────────────────────────────────────────

    /**
     * Spiller et klipp og løser når det er over.
     *
     * Den som kaller, eier hva som skjer etterpå - avspilleren gjør ingenting
     * med spilltilstanden. Det er ikke en forglemmelse: en cutscene som kan
     * dele ut sølv eller sette et flagg, er en cutscene noen kommer til å legge
     * fagstoff inn i, og blueprintens §8 regel 1 sier at det aldri skal skje.
     */
    async spillKlipp(def: KlippDef): Promise<void> {
        if (this.klippGaar) return;
        this.klippGaar = true;
        const sett = useRpgStore.getState().sette.includes(def.id);
        try {
            await spillKlipp(def, this.klippKontekst(), sett);
        } finally {
            this.klippGaar = false;
            useRpgStore.getState().markerSett(def.id);
        }
    }

    /** Går det et klipp nå? Prøveskriptene leser det, og E-tasten hviler. */
    get klippAktivt(): boolean {
        return this.klippGaar;
    }

    private klippKontekst(): KlippKontekst {
        return {
            scene: this,
            laas: (pa) => this.settLaast(pa),
            aktor: (hvem) =>
                hvem === 'spiller' ? this.helt.sprite : this.samhandling.sprite(hvem),
            navn: (hvem) =>
                hvem === 'spiller'
                    ? (useRpgStore.getState().character?.name ?? 'Du')
                    : (this.samhandling.navn(hvem) ?? hvem),
            vend: (hvem, retning) => {
                if (hvem === 'spiller') this.helt.vend(retning);
                else this.samhandling.vend(hvem, retning);
            },
            folgSpiller: () => {
                const cam = this.cameras.main;
                cam.startFollow(this.helt.sprite, true, 0.12, 0.12);
            },
            taake: (tetthet, ms) => this.verden.settTaake(tetthet, ms),
        };
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
