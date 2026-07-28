// «Minnevokteren» - rollespillet på /oving/rpg.
//
// Siden eier tre ting: Phaser-lerretet, React-grensesnittet oppå det, og
// koblingen mellom dem. Selve spillet ligger i engine/, og all tilstand i
// store/useRpgStore.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../context/LayoutContext';
import { useStilleSkjerm } from '../progress/useStilleSkjerm';
import { CharacterCreator } from './components/CharacterCreator';
import { DialogOverlay, LandmarkOverlay } from './components/DialogOverlay';
import { Hud } from './components/Hud';
import { HubHud } from './components/HubHud';
import { Klippscene } from './components/Klippscene';
import { Kontrafaktisk } from './components/Kontrafaktisk';
import { Mellomspill } from './components/Mellomspill';
import { Minnetre } from './components/Minnetre';
import { Opptakt } from './components/Opptakt';
import { Forradet } from './components/Forradet';
import { Tingsak } from './components/Tingsak';
import { KAPITTEL_BY_NR } from './data/kapitler';
import { MELLOMSPILL_BY_ID } from './data/mellomspill';
import { Navigasjonen } from './components/Navigasjonen';
import { Skroget } from './components/Skroget';
import { Blotet } from './components/Blotet';
import { Vinternettene } from './components/Vinternettene';
import { rustningTier } from './data/classes';
import { useHubRom } from './net/useHubRom';
import { Atmosfare, Skjermkontroll } from './components/Skjermkontroll';
import { harBeroring } from './engine/enhet';
import { ButikkPanel, InventoryPanel, PauseMeny, QuestLog } from './components/Panels';
import { Meldingsskjerm, QuizChallenge } from './components/QuizChallenge';
import { finnNpc, stedEllerStart } from './data/steder';
import { resumeAudio } from './engine/audio';
import { fraSpill, tilSpill } from './engine/bridge';
import type { KampSnapshot } from './engine/kamp';
import { byggQuester, lastQuestBank } from './engine/quests';
import type { SpillHandle } from './engine/boot';
import { VERDEN_SCENE, type WorldScene } from './engine/WorldScene';
import { useRpgStore } from './store/useRpgStore';
import type { CharacterDraft, QuestDef } from './types';

type Overlegg =
    | { type: 'ingen' }
    | { type: 'dialog'; npcId: string }
    | { type: 'butikk'; npcId: string }
    | { type: 'landemerke'; landmarkId: string }
    | { type: 'utfordring'; quest: QuestDef }
    | { type: 'boss'; runde: number }
    | { type: 'sekk' }
    | { type: 'logg' }
    /** Minnetreet: det hun kan fordi hun har gjort det. */
    | { type: 'minnetre' }
    | { type: 'pause' }
    | { type: 'dod' }
    | { type: 'seier' }
    /** Kapittelets håndverkspuzzle. Scenen står låst bak det. */
    | { type: 'puzzle'; id: 'skroget' | 'navigasjonen' | 'blotet' | 'vinternettene' }
    /** Bordet med kildene, mellom to kapitler. */
    | { type: 'mellomspill'; id: string }
    /** Epilogens siste spørsmål: kartet som tegnes på nytt. */
    | { type: 'kontrafaktisk' }
    /** Åpningsskjermen til et nytt kapittel. */
    | { type: 'opptakt'; nr: number }
    /** Bua: forrådet og årets valg. */
    | { type: 'forrad'; apne: string[]; kanGaaVidere: boolean }
    /** Ett skjermbilde som eier flaten: båten som snudde, vinteren som gjorde opp. */
    | { type: 'beskjed'; tittel: string; tekst: string; knapp: string }
    /** Tinget: saken, trinn for trinn. */
    | { type: 'tingsak'; sakId: string };

export default function RpgPage() {
    const navigate = useNavigate();
    const { setHideHeader } = useLayout();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const spillRef = useRef<SpillHandle | null>(null);
    const questerRef = useRef<QuestDef[]>([]);

    const character = useRpgStore((s) => s.character);
    const lagKarakter = useRpgStore((s) => s.lagKarakter);
    const slettAlt = useRpgStore((s) => s.slettAlt);
    const startQuest = useRpgStore((s) => s.startQuest);
    const questForsok = useRpgStore((s) => s.questForsok);

    // Stedet eleven skal til: der hun sluttet sist. En ukjent id - en lagring
    // fra et sted som ikke finnes lenger - faller tilbake til startstedet i
    // stedet for å låse henne ute av spillet.
    const sted = stedEllerStart(useRpgStore((s) => s.sisteSted));

    const [klar, setKlar] = useState(false);
    const [feil, setFeil] = useState<string | null>(null);
    const [quester, setQuester] = useState<QuestDef[]>([]);
    const [overlegg, setOverlegg] = useState<Overlegg>({ type: 'ingen' });
    const [hint, setHint] = useState<string | null>(null);
    const [sonetittel, setSonetittel] = useState<{ tittel: string; undertittel: string } | null>(
        null
    );
    const [himmel, setHimmel] = useState<string | null>(null);
    const [kompass, setKompass] = useState<{
        vinkel: number;
        avstand: number;
        navn: string;
    } | null>(null);
    /** Pust, gard og skjoldslitasje. Kommer fra scenen ~11 ganger i sekundet. */
    const [kamp, setKamp] = useState<KampSnapshot | null>(null);
    /** Går det en cutscene? Da eier den skjermen. */
    const [klipp, setKlipp] = useState<{ pa: boolean; kanHoppes: boolean }>({
        pa: false,
        kanHoppes: false,
    });
    const [klippTekst, setKlippTekst] = useState<{ hvem: string | null; tekst: string } | null>(
        null
    );
    /** Det ene eleven holder på med nå. Skilt fra oppdragsloggen med vilje. */
    const [oppgave, setOppgave] = useState<{
        tittel: string;
        mal: string;
        teller?: string;
    } | null>(null);
    /** Den navngitte motstanderen, øverst på skjermen. */
    const [motstander, setMotstander] = useState<{ navn: string; andel: number } | null>(null);
    /** Én replikk sagt mens spillet går. Går av seg selv. */
    const [replikk, setReplikk] = useState<{ hvem: string; tekst: string } | null>(null);
    const replikkTimer = useRef<number | null>(null);
    const [touch] = useState(harBeroring);
    /**
     * Saken tinget står med nå.
     *
     * Leses ut av storen og ikke sendt med over broen: skjermen skal se saken
     * *mens* den endrer seg - et vitne som legges til, en hjemmel som anføres -
     * og et øyeblikksbilde sendt ved åpning ville stått og vist gårsdagens sak.
     */
    const sakUnderBehandling = useRpgStore((s) => s.saker.find((x) => x.dom === 'ubehandlet'));

    // ── Hallen, delt med andre ──────────────────────────────────────────────
    //
    // Betingelsen er `sted.flerspiller` og ingenting annet. Reiser eleven inn i
    // en epoke, blir den falsk, hooken kobler fra, og epoken er alene - hele
    // blueprintens §4.1 håndheves i denne ene linja.
    const rustning = useRpgStore((s) => s.utstyr.rustning);
    const identitet =
        character && klar
            ? {
                  navn: character.name,
                  classId: character.classId,
                  appearance: character.appearance,
                  rustning: rustningTier(rustning),
              }
            : null;
    const hub = useHubRom(Boolean(sted.flerspiller) && Boolean(character) && klar, identitet);

    const scene = useCallback((): WorldScene | null => {
        const game = spillRef.current?.game;
        if (!game) return null;
        return (game.scene.getScene(VERDEN_SCENE) as WorldScene | null) ?? null;
    }, []);

    // Spillet skal fylle skjermen - toppmenyen kommer i veien.
    useEffect(() => {
        setHideHeader(true);
        return () => setHideHeader(false);
    }, [setHideHeader]);

    /**
     * Øyeblikkene som eier hele skjermen.
     *
     * Et kapittel åpner med hvem hun er nå, og bordet med kildene er det
     * tyngste i spillet. Kommer «Nivå 3!» med rakett og konfetti oppå den
     * setningen, er øyeblikket borte - og XP-en kom nettopp fra det hun holdt
     * på med. Feiringene står i kø og kommer når hun er ute igjen.
     */
    const eierSkjermen =
        klipp.pa ||
        overlegg.type === 'opptakt' ||
        overlegg.type === 'mellomspill' ||
        overlegg.type === 'kontrafaktisk' ||
        overlegg.type === 'puzzle' ||
        overlegg.type === 'forrad' ||
        overlegg.type === 'tingsak' ||
        overlegg.type === 'beskjed';
    useEffect(() => {
        useStilleSkjerm.getState().settStille(eierSkjermen);
        return () => useStilleSkjerm.getState().settStille(false);
    }, [eierSkjermen]);

    // ── Last spørsmålsbanken og bygg questene ───────────────────────────────
    useEffect(() => {
        let avbrutt = false;
        lastQuestBank()
            .then((bank) => {
                if (avbrutt) return;
                const bygde = byggQuester(bank, sted);
                questerRef.current = bygde;
                setQuester(bygde);
                setKlar(true);
            })
            .catch((e: unknown) => {
                if (!avbrutt)
                    setFeil(e instanceof Error ? e.message : 'Klarte ikke å laste spørsmålene.');
            });
        return () => {
            avbrutt = true;
        };
    }, [sted]);

    // ── Start Phaser når karakteren finnes ──────────────────────────────────
    useEffect(() => {
        if (!klar || !character || !containerRef.current || spillRef.current) return;
        let avbrutt = false;
        const parent = containerRef.current;

        void import('./engine/boot').then(({ startSpill }) =>
            startSpill(parent, questerRef.current, useRpgStore.getState().sisteSted).then(
                (handle) => {
                    if (avbrutt) {
                        handle.destroy();
                        return;
                    }
                    spillRef.current = handle;
                    // Utropstegnene skal stemme med lagrede quester med én gang.
                    handle.game.events.once('poststep', () => scene()?.oppdaterMarkorer());
                    window.setTimeout(() => scene()?.oppdaterMarkorer(), 400);
                }
            )
        );

        return () => {
            avbrutt = true;
            spillRef.current?.destroy();
            spillRef.current = null;
        };
    }, [klar, character, scene]);

    // ── Hendelser fra spillet ───────────────────────────────────────────────
    useEffect(() => {
        const av = [
            fraSpill.on('dialog', ({ npcId }) => {
                const npc = finnNpc(npcId);
                setOverlegg(npc?.handler ? { type: 'butikk', npcId } : { type: 'dialog', npcId });
            }),
            fraSpill.on('atmosfare', ({ himmel: h }) => setHimmel(h)),
            fraSpill.on('kompass', (k) => setKompass(k)),
            fraSpill.on('kamp', (k) => setKamp(k)),
            fraSpill.on('landmark', ({ landmarkId }) =>
                setOverlegg({ type: 'landemerke', landmarkId })
            ),
            fraSpill.on('bossSporsmal', ({ runde }) => setOverlegg({ type: 'boss', runde })),
            // Scenen ber om å reise. Questene hører til stedet og bygges her,
            // så scenen får dem med seg inn i den nye verdenen - ellers ville
            // eleven komme fram til et kart der oppdragene pekte på folk som
            // bor et helt annet sted.
            fraSpill.on('reise', ({ stedId }) => {
                const nytt = stedEllerStart(stedId);
                setOverlegg({ type: 'ingen' });
                setHint(null);
                setKompass(null);
                void lastQuestBank().then((bank) => {
                    const bygde = byggQuester(bank, nytt);
                    questerRef.current = bygde;
                    setQuester(bygde);
                    scene()?.utforReise(nytt.id, bygde);
                });
            }),
            fraSpill.on('hint', ({ tekst }) => setHint(tekst)),
            fraSpill.on('klipp', (k) => {
                setKlipp(k);
                // HUD-en skal ikke ligge oppå en cutscene, og et hint om at E
                // snakker med Orm mens Orm står midt i klippet er verre enn
                // ingen hint.
                if (k.pa) setHint(null);
            }),
            fraSpill.on('klippTekst', (t) => setKlippTekst(t)),
            fraSpill.on('oppgave', (o) => setOppgave(o)),
            // Puzzlet åpnes uten `apnePanel`: scenen har alt satt låsen selv, og
            // et `pause: true` til ville tatt den to ganger. Det gjør ingen
            // skade i dag, men de to veiene inn i «alt står stille» skal ikke
            // begge være i bruk - det er slik de kommer i utakt.
            fraSpill.on('puzzle', ({ id }) => setOverlegg({ type: 'puzzle', id })),
            fraSpill.on('mellomspill', ({ id }) => setOverlegg({ type: 'mellomspill', id })),
            fraSpill.on('kontrafaktisk', ({ pa }) =>
                setOverlegg(pa ? { type: 'kontrafaktisk' } : { type: 'ingen' })
            ),
            fraSpill.on('opptakt', ({ nr }) => setOverlegg({ type: 'opptakt', nr })),
            fraSpill.on('forrad', ({ apne, kanGaaVidere }) =>
                setOverlegg({ type: 'forrad', apne, kanGaaVidere })
            ),
            fraSpill.on('beskjed', (k) => setOverlegg({ type: 'beskjed', ...k })),
            fraSpill.on('tingsak', ({ sakId }) => setOverlegg({ type: 'tingsak', sakId })),
            // Replikken står i noen sekunder og går av seg selv. Den skal ikke
            // kreve et tastetrykk: verden går videre mens den står, og en
            // beskjed som må lukkes midt i en kamp er en beskjed eleven lukker
            // uten å lese.
            fraSpill.on('motstander', (m) => setMotstander(m)),
            fraSpill.on('replikk', (r) => {
                setReplikk(r);
                if (replikkTimer.current) window.clearTimeout(replikkTimer.current);
                if (r) {
                    replikkTimer.current = window.setTimeout(
                        () => setReplikk(null),
                        Math.max(2600, 1200 + r.tekst.length * 55)
                    );
                }
            }),
            fraSpill.on('dod', () => setOverlegg({ type: 'dod' })),
            fraSpill.on('seier', () => setOverlegg({ type: 'seier' })),
            fraSpill.on('sone', (s) => {
                setSonetittel(s);
                window.setTimeout(() => setSonetittel(null), 3400);
            }),
        ];
        return () => av.forEach((f) => f());
    }, [scene]);

    // ── Hurtigtaster for panelene ───────────────────────────────────────────
    useEffect(() => {
        const lytt = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const apent = overlegg.type !== 'ingen';
            // Opptakten kan ikke lukkes med Esc. Den er kapittelets første
            // setning, ikke et panel - og en elev som trykker Esc av vane skal
            // ikke ende opp i 872 uten å ha fått vite at hun er Åsa.
            // Det samme gjelder skjermbildet som avslutter kapittelet: året er
            // gjort opp, og det skal leses.
            if (overlegg.type === 'opptakt' || overlegg.type === 'beskjed') return;
            if (e.key === 'Escape') {
                // Bua må lukkes gjennom sin egen vei ut, som puzzlet: låsen ble
                // satt av scenen, og bare scenen kan ta den av igjen.
                if (overlegg.type === 'forrad') {
                    setOverlegg({ type: 'ingen' });
                    tilSpill.emit('forradLukk', {});
                    return;
                }
                if (overlegg.type === 'tingsak') {
                    setOverlegg({ type: 'ingen' });
                    tilSpill.emit('tingsakSvar', { art: 'lukk' });
                    return;
                }
                // Puzzlet må lukkes gjennom sin egen vei ut. `lukk()` sender
                // bare `lukk` og `pause: false`, og da ville scenen aldri fått
                // vite at eleven gikk - låsen ville stått til hun snakket med
                // noen andre.
                if (overlegg.type === 'puzzle') {
                    // Vinternettene har ingen vei ut. Fristen er ute, og et
                    // Esc-trykk som lukket den ville latt eleven gå fra
                    // kapittelets eneste avgjørelse - og etterlatt verden låst
                    // bak en skjerm som ikke kommer igjen.
                    if (overlegg.id === 'vinternettene') return;
                    setOverlegg({ type: 'ingen' });
                    tilSpill.emit('puzzleSvar', { id: overlegg.id, lost: false });
                    return;
                }
                // Samme grunn som for puzzlet: bordet satte låsen gjennom
                // scenen, og bare scenen kan ta den av igjen.
                if (overlegg.type === 'mellomspill') {
                    setOverlegg({ type: 'ingen' });
                    tilSpill.emit('mellomspillFerdig', {
                        id: overlegg.id,
                        gjennomgatt: false,
                    });
                    return;
                }
                // Samme regel, og samme lås. Kartet er kampanjens siste
                // skjermbilde, og et Esc-trykk som bare fjernet det ville
                // etterlatt eleven låst fast på en haug i 1100.
                if (overlegg.type === 'kontrafaktisk') {
                    setOverlegg({ type: 'ingen' });
                    tilSpill.emit('kontrafaktiskFerdig', {});
                    return;
                }
                if (apent) lukk();
                else apnePanel({ type: 'pause' });
                return;
            }
            if (apent) return;
            if (e.key === 'i' || e.key === 'I') apnePanel({ type: 'sekk' });
            if (e.key === 'l' || e.key === 'L') apnePanel({ type: 'logg' });
            if (e.key === 'm' || e.key === 'M') apnePanel({ type: 'minnetre' });
        };
        window.addEventListener('keydown', lytt);
        return () => window.removeEventListener('keydown', lytt);
    });

    const apnePanel = (o: Overlegg) => {
        setOverlegg(o);
        tilSpill.emit('pause', { pa: true });
    };

    const lukk = () => {
        setOverlegg({ type: 'ingen' });
        tilSpill.emit('pause', { pa: false });
        tilSpill.emit('lukk', {});
    };

    const startNyttSpill = (draft: CharacterDraft) => {
        resumeAudio();
        lagKarakter(draft);
    };

    // ── Rendering ───────────────────────────────────────────────────────────

    if (feil) {
        return (
            <div className="grid min-h-[70vh] place-items-center px-4 text-center">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-800">
                        Spillet klarte ikke å starte
                    </h1>
                    <p className="mt-2 text-slate-600">{feil}</p>
                    <button
                        type="button"
                        onClick={() => navigate('/oving')}
                        className="mt-4 rounded-lg bg-slate-800 px-5 py-2.5 font-semibold text-white"
                    >
                        Tilbake til øving
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-950">
            {/* Phaser tegner her */}
            <div ref={containerRef} className="absolute inset-0" />

            {character && klar && <Atmosfare himmel={himmel} />}

            {!character && klar && <CharacterCreator onFerdig={startNyttSpill} />}

            {!klar && (
                <div className="absolute inset-0 grid place-items-center text-slate-300">
                    <p className="font-display text-lg tracking-widest">Vekker {sted.tittel} …</p>
                </div>
            )}

            <Klippscene pa={klipp.pa} kanHoppes={klipp.kanHoppes} tekst={klippTekst} />

            {/*
                HUD-en tas ned mens et klipp går. Liv, pust og oppdragsteller
                over en scene som skal bære et øyeblikk er det samme som å
                skrive «du er i et spill» over den.
            */}
            {character && klar && !klipp.pa && (
                <>
                    <Hud
                        hint={overlegg.type === 'ingen' ? hint : null}
                        kompass={kompass}
                        kamp={kamp}
                        oppgave={oppgave}
                        motstander={motstander}
                        rollenavn={
                            sted.rollenavn !== undefined
                                ? sted.rollenavn
                                : sted.kapittel
                                  ? (KAPITTEL_BY_NR[sted.kapittel]?.rolle.navn ?? null)
                                  : null
                        }
                        onApneSekk={() => apnePanel({ type: 'sekk' })}
                        onApneLogg={() => apnePanel({ type: 'logg' })}
                        onApneMinnetre={() => apnePanel({ type: 'minnetre' })}
                        onPause={() => apnePanel({ type: 'pause' })}
                    />

                    {touch && overlegg.type === 'ingen' && (
                        <Skjermkontroll gardOppe={kamp?.gardOppe ?? false} />
                    )}

                    {sted.flerspiller && overlegg.type === 'ingen' && (
                        <HubHud hub={hub} touch={touch} />
                    )}

                    {replikk && (
                        // Over hintlinja, ikke under. Nederst i bildet ligger
                        // skjermkontrollen på nettbrett, og en replikk oppå
                        // tommelen leser som at grensesnittet har kollapset.
                        <div className="pointer-events-none absolute bottom-[7.5rem] left-1/2 w-full max-w-xl -translate-x-1/2 px-3">
                            <div className="rounded-xl border border-amber-300/25 bg-slate-950/90 px-4 py-2.5 shadow-lg">
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300/90">
                                    {replikk.hvem}
                                </p>
                                <p className="mt-0.5 text-[15px] leading-snug text-slate-100">
                                    «{replikk.tekst}»
                                </p>
                            </div>
                        </div>
                    )}

                    {sonetittel && (
                        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-30 text-center">
                            <p className="font-display text-5xl font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                                {sonetittel.tittel}
                            </p>
                            <p className="mt-1 text-sm uppercase tracking-[0.4em] text-amber-200/90">
                                {sonetittel.undertittel}
                            </p>
                        </div>
                    )}
                </>
            )}

            {overlegg.type === 'dialog' && (
                <DialogOverlay
                    npcId={overlegg.npcId}
                    quester={quester}
                    onLukk={lukk}
                    onTaOppdrag={(q) => {
                        startQuest(q.id);
                        scene()?.oppdaterMarkorer();
                        lukk();
                    }}
                    onSvarPa={(q) => setOverlegg({ type: 'utfordring', quest: q })}
                    onHandling={(handlingId) => {
                        // Overlegget lukkes uten `lukk()`: den ville sendt
                        // `pause: false` og `lukk`, og scenen ville tatt låsen
                        // av i samme bilde som handlingen skal ta den *på*.
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('npcHandling', { npcId: overlegg.npcId, handlingId });
                    }}
                />
            )}

            {overlegg.type === 'butikk' && <ButikkPanel npcId={overlegg.npcId} onLukk={lukk} />}

            {overlegg.type === 'landemerke' && (
                <LandmarkOverlay landmarkId={overlegg.landmarkId} onLukk={lukk} />
            )}

            {overlegg.type === 'utfordring' && (
                <QuizChallenge
                    // Overskriften sier hvor spørsmålet kommer fra. Questtittelen
                    // er nå selve spørsmålet, og det står rett under - å vise det
                    // begge steder ville bare vært dobbelt opp.
                    tittel={overlegg.quest.question.lessonTitle}
                    innsats={`Belønning: ${overlegg.quest.belonning.xp} XP og ${overlegg.quest.belonning.solv} sølv`}
                    question={overlegg.quest.question}
                    hint={overlegg.quest.hint}
                    forsok={questForsok[overlegg.quest.id] ?? 0}
                    onSvar={(riktig) => {
                        tilSpill.emit('svar', { questId: overlegg.quest.id, riktig });
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('pause', { pa: false });
                    }}
                />
            )}

            {overlegg.type === 'boss' && sted.boss && (
                <QuizChallenge
                    tittel="Kunnskapsdyst"
                    innsats="Den store Glemselen er beskyttet. Hvert riktige svar river ned ett skjold."
                    question={sted.boss.sporsmal[overlegg.runde]}
                    onSvar={(riktig) => {
                        tilSpill.emit('bossSvar', { riktig });
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('pause', { pa: false });
                    }}
                />
            )}

            {overlegg.type === 'puzzle' && overlegg.id === 'skroget' && (
                <Skroget
                    onFerdig={(paaForsteForsok) => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('puzzleSvar', {
                            id: 'skroget',
                            lost: true,
                            forsteForsok: paaForsteForsok,
                        });
                    }}
                    onAvbryt={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('puzzleSvar', { id: 'skroget', lost: false });
                    }}
                />
            )}

            {overlegg.type === 'puzzle' && overlegg.id === 'navigasjonen' && (
                <Navigasjonen
                    onFerdig={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('puzzleSvar', { id: 'navigasjonen', lost: true });
                    }}
                    onAvbryt={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('puzzleSvar', { id: 'navigasjonen', lost: false });
                    }}
                />
            )}

            {overlegg.type === 'puzzle' && overlegg.id === 'blotet' && (
                <Blotet
                    onFerdig={(passet) => {
                        setOverlegg({ type: 'ingen' });
                        // Blotet ble holdt uansett hva hun svarte. `utfall`
                        // sier hvordan det gikk; `lost` sier bare at hun ikke
                        // gikk fra det.
                        tilSpill.emit('puzzleSvar', {
                            id: 'blotet',
                            lost: true,
                            utfall: passet ? 'passet' : 'passet-ikke',
                        });
                    }}
                    onAvbryt={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('puzzleSvar', { id: 'blotet', lost: false });
                    }}
                />
            )}

            {/*
                Vinternettene har ingen vei ut. Fristen er ute, og det finnes
                ikke et «senere» - derfor ingen `onAvbryt`, og derfor står den
                i lista over overlegg Esc ikke lukker.
            */}
            {overlegg.type === 'puzzle' && overlegg.id === 'vinternettene' && (
                <Vinternettene
                    onValgt={(valg) => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('puzzleSvar', {
                            id: 'vinternettene',
                            lost: true,
                            utfall: valg,
                        });
                    }}
                />
            )}

            {overlegg.type === 'mellomspill' && MELLOMSPILL_BY_ID[overlegg.id] && (
                <Mellomspill
                    def={MELLOMSPILL_BY_ID[overlegg.id]}
                    onFerdig={(gjennomgatt) => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('mellomspillFerdig', { id: overlegg.id, gjennomgatt });
                    }}
                />
            )}

            {overlegg.type === 'kontrafaktisk' && (
                <Kontrafaktisk
                    onFerdig={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('kontrafaktiskFerdig', {});
                    }}
                />
            )}

            {overlegg.type === 'sekk' && (
                <InventoryPanel onLukk={lukk} onEndret={() => scene()?.oppdaterUtseende()} />
            )}

            {overlegg.type === 'logg' && <QuestLog quester={quester} onLukk={lukk} />}

            {overlegg.type === 'minnetre' && <Minnetre onLukk={lukk} />}

            {overlegg.type === 'forrad' && (
                <Forradet
                    apne={overlegg.apne}
                    kanGaaVidere={overlegg.kanGaaVidere}
                    // Bua lukkes ikke her: scenen svarer med et nytt `forrad`
                    // med årets nye tilstand, eller med beskjeden om oppgjøret.
                    onValg={(beslutning, alternativ) =>
                        tilSpill.emit('forradValg', { beslutning, alternativ })
                    }
                    onGaaVidere={() => tilSpill.emit('forradVidere', {})}
                    onLukk={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('forradLukk', {});
                    }}
                />
            )}

            {overlegg.type === 'tingsak' && sakUnderBehandling && (
                <Tingsak
                    sak={sakUnderBehandling}
                    onLys={() => tilSpill.emit('tingsakSvar', { art: 'lys' })}
                    onVitner={(vitner) => tilSpill.emit('tingsakSvar', { art: 'vitner', vitner })}
                    onHjemmel={(id) => tilSpill.emit('tingsakSvar', { art: 'hjemmel', id })}
                    // Dommen lukker seg selv: scenen svarer med beskjeden.
                    onDom={() => tilSpill.emit('tingsakSvar', { art: 'dom' })}
                    onLukk={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('tingsakSvar', { art: 'lukk' });
                    }}
                />
            )}

            {overlegg.type === 'beskjed' && (
                <Meldingsskjerm
                    tittel={overlegg.tittel}
                    tekst={overlegg.tekst}
                    knapp={overlegg.knapp}
                    onKlikk={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('beskjedLest', {});
                    }}
                />
            )}

            {overlegg.type === 'opptakt' && KAPITTEL_BY_NR[overlegg.nr] && (
                <Opptakt
                    kapittel={KAPITTEL_BY_NR[overlegg.nr]}
                    onFerdig={() => {
                        // Går gjennom scenen, ikke `lukk()`: låsen ble satt av
                        // scenen, og bare den skal ta den av igjen.
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('opptaktFerdig', { nr: overlegg.nr });
                    }}
                />
            )}

            {overlegg.type === 'pause' && (
                <PauseMeny
                    onFortsett={lukk}
                    // Går gjennom scenen, ikke rett i overlegget: låsen skal
                    // settes og tas av på ett sted, og det stedet er scenen.
                    onApneBordet={(id) => scene()?.apneMellomspill(id)}
                    // Bytter overlegg uten å gå via `apnePanel`: pausen står
                    // alt, og et `pause: true` til ville tatt låsen to ganger.
                    onApneMinnetre={() => setOverlegg({ type: 'minnetre' })}
                    onAvslutt={() => navigate('/oving')}
                    onNyKarakter={() => {
                        slettAlt();
                        spillRef.current?.destroy();
                        spillRef.current = null;
                        setOverlegg({ type: 'ingen' });
                    }}
                />
            )}

            {overlegg.type === 'dod' && (
                <Meldingsskjerm
                    farge="rose"
                    tittel="Tåka tok deg"
                    tekst="Du våkner igjen i Nordvik. Litt sølv er borte, men det du har lært, sitter."
                    knapp="Reis deg"
                    onKlikk={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('gjenoppliv', {});
                    }}
                />
            )}

            {overlegg.type === 'seier' && (
                <Meldingsskjerm
                    tittel="Glemselen er felt"
                    tekst="Navnene kommer tilbake til folk i Nordvik. Bygda husker igjen, og du kan fortsatt gå rundt her så lenge du vil."
                    knapp="Fortsett å utforske"
                    onKlikk={() => {
                        setOverlegg({ type: 'ingen' });
                        tilSpill.emit('pause', { pa: false });
                    }}
                />
            )}
        </div>
    );
}
