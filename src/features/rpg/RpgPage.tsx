// «Minnevokteren» - rollespillet på /oving/rpg.
//
// Siden eier tre ting: Phaser-lerretet, React-grensesnittet oppå det, og
// koblingen mellom dem. Selve spillet ligger i engine/, og all tilstand i
// store/useRpgStore.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../context/LayoutContext';
import { CharacterCreator } from './components/CharacterCreator';
import { DialogOverlay, LandmarkOverlay } from './components/DialogOverlay';
import { Hud } from './components/Hud';
import { HubHud } from './components/HubHud';
import { Klippscene } from './components/Klippscene';
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
    | { type: 'pause' }
    | { type: 'dod' }
    | { type: 'seier' };

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
    const [touch] = useState(harBeroring);

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
            if (e.key === 'Escape') {
                if (apent) lukk();
                else apnePanel({ type: 'pause' });
                return;
            }
            if (apent) return;
            if (e.key === 'i' || e.key === 'I') apnePanel({ type: 'sekk' });
            if (e.key === 'l' || e.key === 'L') apnePanel({ type: 'logg' });
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
                        onApneSekk={() => apnePanel({ type: 'sekk' })}
                        onApneLogg={() => apnePanel({ type: 'logg' })}
                        onPause={() => apnePanel({ type: 'pause' })}
                    />

                    {touch && overlegg.type === 'ingen' && (
                        <Skjermkontroll gardOppe={kamp?.gardOppe ?? false} />
                    )}

                    {sted.flerspiller && overlegg.type === 'ingen' && (
                        <HubHud hub={hub} touch={touch} />
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

            {overlegg.type === 'sekk' && (
                <InventoryPanel onLukk={lukk} onEndret={() => scene()?.oppdaterUtseende()} />
            )}

            {overlegg.type === 'logg' && <QuestLog quester={quester} onLukk={lukk} />}

            {overlegg.type === 'pause' && (
                <PauseMeny
                    onFortsett={lukk}
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
