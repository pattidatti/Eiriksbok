import React, { Suspense } from 'react';
import { getMicroGame } from './registry';
import { MicroGameEmbedProvider } from './MicroGameFrame';
import { MicroGameLauncher } from './MicroGameLauncher';
import type { MicroGameEntry, MicroGameProps, MicroGameResult } from './types';
import { useProgressStore } from '../../features/progress/useProgressStore';

// Bro mellom artikkel-JSON og mikrospill-registeret. Lar et hvilket som helst
// mikrospill embeddes rett i en artikkel:
//
//   { "type": "component", "name": "MicroGame", "props": { "gameId": "gladius-duell" } }
//
// Spillene eier sin egen MicroGameFrame internt, så her trengs bare oppslag,
// lazy-lasting og en trygg onComplete i artikkel-kontekst (ingen "neste steg").

// Forhåndslasting. entry.loader() importerer samme modul som registerets
// React.lazy, så når eleven trykker «Spill» ligger spillet allerede i
// modulcachen og starter uten ventetid. Ett løfte per spill, så hover +
// synlighet + klikk aldri henter to ganger.
const prefetched = new Map<string, Promise<unknown>>();
function prefetchGame(entry: MicroGameEntry): Promise<unknown> {
    let p = prefetched.get(entry.id);
    if (!p) {
        // Feil svelges her - React.lazy prøver på nytt ved start og viser
        // feilen der den hører hjemme.
        p = entry.loader().catch(() => {
            prefetched.delete(entry.id);
        });
        prefetched.set(entry.id, p);
    }
    return p;
}

// Hente et 3D-spill (~1 MB three.js) bare fordi det scrollet forbi er sløsing
// på et tregt klasseromsnett. Synlighet alene utløser derfor bare henting når
// eleven faktisk blir stående ved spillet, og aldri med «spar data» eller 2G.
const DWELL_MS = 2500;
function connectionAllowsPrefetch(): boolean {
    const c = (navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (!c) return true;
    return !c.saveData && !/(^|-)2g$/.test(c.effectiveType ?? '');
}

interface MicroGameBlockProps {
    gameId: string;
    // Frie spillspesifikke props fra JSON sendes videre til spillet.
    [key: string]: unknown;
}

export function MicroGameBlock({ gameId, onComplete, ...rest }: MicroGameBlockProps) {
    const entry = gameId ? getMicroGame(gameId) : undefined;
    // Flere spill kaller onComplete både ved seier og i WinScreen "Gå videre" -
    // dedupliser så én seier aldri gir dobbel XP. (Må stå før early return.)
    const completedOnce = React.useRef(false);
    // Har eleven åpnet spillet? Styrer om spillmodulen i det hele tatt hentes.
    // (Må stå før early return.)
    const [started, setStarted] = React.useState(false);
    const [starting, setStarting] = React.useState(false);
    const [inView, setInView] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement>(null);

    // Fullskjerm-først (eier, 2026-09-26): fra artikkelen åpnes spillet alltid i
    // fullskjerm - 2-3 ganger så stor flate som spalten. Omslaget her (ikke
    // spillrammen) går i fullskjerm, fordi forespørselen må skje i selve klikket,
    // før spillmodulen er lastet og rammen finnes. Der nettleseren ikke har
    // Fullscreen API (iPhone) eller sier nei, fyller omslaget vinduet («pseudo»).
    // (Må stå før early return.)
    const [nativeFs, setNativeFs] = React.useState(false);
    const [pseudoFs, setPseudoFs] = React.useState(false);
    React.useEffect(() => {
        const onChange = () => setNativeFs(!!rootRef.current && document.fullscreenElement === rootRef.current);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);
    React.useEffect(() => {
        if (!pseudoFs) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // Artikkelen ligger i en egen stablingskontekst, så sidens klebrige meny
        // ville ligget over spillet uansett z-index. Den skjules så lenge.
        document.body.classList.add('mg-pseudo-open');
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPseudoFs(false);
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            document.body.classList.remove('mg-pseudo-open');
            window.removeEventListener('keydown', onKey);
        };
    }, [pseudoFs]);
    const enterFullscreen = React.useCallback(() => {
        const el = rootRef.current;
        if (!el) return;
        if (document.fullscreenEnabled && typeof el.requestFullscreen === 'function') {
            el.requestFullscreen({ navigationUI: 'hide' })
                .then(() => {
                    // Mobil: prøv å legge skjermen ned. Går det ikke, går det ikke.
                    const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
                    o?.lock?.('landscape').catch(() => {});
                })
                .catch(() => setPseudoFs(true));
        } else setPseudoFs(true);
    }, []);
    const exitFullscreen = React.useCallback(() => {
        setPseudoFs(false);
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    }, []);

    // Synlighet: tenn lysstripen første gang kortet ses, og hent spillet i
    // forkant hvis eleven blir værende i nærheten. (Må stå før early return.)
    React.useEffect(() => {
        const el = rootRef.current;
        if (!entry || started || !el || typeof IntersectionObserver === 'undefined') return;
        let dwell: number | undefined;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setInView(true);
                    if (dwell === undefined && connectionAllowsPrefetch()) {
                        dwell = window.setTimeout(() => void prefetchGame(entry), DWELL_MS);
                    }
                } else if (dwell !== undefined) {
                    window.clearTimeout(dwell);
                    dwell = undefined;
                }
            },
            { threshold: 0.6 }
        );
        io.observe(el);
        return () => {
            io.disconnect();
            if (dwell !== undefined) window.clearTimeout(dwell);
        };
    }, [entry, started]);

    if (!entry) {
        return (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 text-rose-900 my-4">
                <p className="font-semibold mb-1">Mikro-spillet ble ikke funnet.</p>
                <p className="text-sm">
                    Artikkelen refererer til <code>{gameId ?? '(mangler gameId)'}</code>, men det
                    finnes ikke i mikrospill-registeret.
                </p>
            </div>
        );
    }

    const GameComponent = entry.Component as unknown as React.ComponentType<MicroGameProps>;

    // I artikkel-kontekst finnes ingen sti-flyt å gå videre i. Spillene viser
    // sin egen vinn/feedback-skjerm; vi rapporterer fullføring til «Min læring»
    // og kaller ev. onComplete sendt inn for analytics.
    const handleComplete = (result: MicroGameResult) => {
        if (result.completed) {
            if (completedOnce.current) return;
            completedOnce.current = true;
        }
        useProgressStore.getState().recordActivity({
            kind: 'microgame-played',
            activityId: `microgame/${gameId}`,
            score: result.score,
            title: entry.title,
        });
        if (typeof onComplete === 'function') {
            (onComplete as (result: MicroGameResult) => void)(result);
        }
    };

    // Vent på modulen før vi bytter, så kortet står med «Laster» på plass i
    // stedet for å blinke over til en tynn loader. Oftest er den hentet allerede.
    const start = () => {
        if (starting) return;
        enterFullscreen();
        setStarting(true);
        void prefetchGame(entry).finally(() => setStarted(true));
    };

    // I artikkel starter spillet sammenslått (kun et startkort) - eleven åpner
    // det bevisst. Da mountes ikke 3D-scenen, og en lang artikkel spinner ikke
    // opp WebGL for hvert spill før det faktisk er i bruk.
    //
    // Startkortet tegnes her, ikke av spillet selv. Rammen ligger inne i
    // spillmodulen, så bare det å vise et lukket spill ville tvunget fram
    // nedlasting av modulen - og for et 3D-spill følger rundt en megabyte
    // three.js med. Nå ligger tittel og spilletid i registeret, som allerede
    // er lastet, og selve spillet hentes først ved hover, fokus, klikk eller
    // når eleven blir stående ved det (se prefetchGame).
    const launcher = (loading: boolean) => (
        <MicroGameLauncher
            title={entry.title}
            estimatedSeconds={entry.estimatedSeconds}
            loading={loading}
            inView={inView}
            onStart={start}
            onIntent={() => void prefetchGame(entry)}
            fullscreen
        />
    );
    return (
        <div className={`my-6${pseudoFs ? ' mg-pseudo-fs' : ''}`} data-microgame={gameId} ref={rootRef}>
            {!started ? (
                launcher(starting)
            ) : (
                <MicroGameEmbedProvider
                    value={{
                        collapsible: true,
                        defaultOpen: true,
                        estimatedSeconds: entry.estimatedSeconds,
                        fullscreen: {
                            active: nativeFs || pseudoFs,
                            enter: enterFullscreen,
                            exit: exitFullscreen,
                        },
                    }}
                >
                    {/* Samme kort med «Laster» om modulen mot formodning ikke
                        er klar - ingen hopp i høyde. */}
                    <Suspense fallback={launcher(true)}>
                        <GameComponent
                            {...(rest as Partial<MicroGameProps>)}
                            onComplete={handleComplete}
                        />
                    </Suspense>
                </MicroGameEmbedProvider>
            )}
        </div>
    );
}

export default MicroGameBlock;
