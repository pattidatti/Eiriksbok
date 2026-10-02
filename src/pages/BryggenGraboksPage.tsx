import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GrayboxGame, HudState, WorldId } from '../games/bryggen/graboks/game';

// Testruter for Bryggen-spillet. Ikke koblet inn i galleriet.
// /test/bryggen-graboks  grå prøvescene (følelsen)
// /test/bryggen-gard     den første gården bygget av modulsettet
// Legg til ?skygger=0 for å måle uten skygger, ?kvalitet=lav for lav-nivået (uten normalkart og skygger).

const EMPTY: HudState = {
    loading: true,
    fps: 0,
    frameMs: 0,
    simMs: 0,
    drawCalls: 0,
    triangles: 0,
    prompt: null,
    mode: 'foot',
    playerHp: 100,
    enemyHp: 0,
    enemyMax: 1,
    enemyActive: false,
    telegraph: false,
    finisherReady: false,
    playerDead: false,
    enemyDead: false,
    message: null,
    pointerLocked: false,
    mouseMode: false,
    boatSpeed: 0,
    cells: 0,
};

const INTRO: Record<WorldId, { tag: string; title: string; text: string }> = {
    graboks: {
        tag: 'Motorprøve · gråboks',
        title: 'Bryggen, 1420-årene',
        text: 'Ingen grafikk ennå, bare følelsen. Løp gjennom gårdsrommet, klatre opp på svalgangen fra kassestabelen, prøv kameraet i det trange smuget til høyre, ro færingen ved kaia og slåss med tyven inne i gårdsrommet.',
    },
    gard: {
        tag: 'Modulsett · første gård',
        title: 'En gård på Bryggen',
        text: 'Den første gården bygget av modulsettet: laftehus med torv- og bordtak, svalganger over gårdsrommet, vinsjer i gavlene og kai på bolverk. Nikolaikirkeallmenningen ligger til høyre. Nabogårdene er plassholdere til denne er godkjent.',
    },
};

const CONTROLS: [string, string][] = [
    ['WASD', 'gå og løp'],
    ['Shift', 'sprint'],
    ['Mellomrom', 'hopp / klatre opp på kanter'],
    ['Mus / piltaster', 'kamera'],
    ['E', 'gå om bord / i land'],
    ['Venstre klikk / J', 'lett slag'],
    ['Hold venstre / K', 'tungt slag'],
    ['Høyre / L (hold)', 'blokker'],
    ['Q / C', 'unnamanøver'],
    ['F', 'avslutt (når fienden vakler)'],
    ['R', 'start slagsmålet på nytt'],
];

/** Den første gården bygget av modulsettet. */
export function BryggenGardPage() {
    return <BryggenGraboksPage world="gard" />;
}

export function BryggenGraboksPage({ world = 'graboks' }: { world?: WorldId }) {
    const mountRef = useRef<HTMLDivElement>(null);
    const floatRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<GrayboxGame | null>(null);
    const [hud, setHud] = useState<HudState>(EMPTY);
    const [started, setStarted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const params = new URLSearchParams(window.location.search);
        const shadows = params.get('skygger') !== '0';
        const low = params.get('kvalitet') === 'lav';
        import('../games/bryggen/graboks/game').then(({ GrayboxGame }) => {
            if (cancelled || !mountRef.current || !floatRef.current) return;
            const game = new GrayboxGame(mountRef.current, floatRef.current, setHud, { shadows, world, low });
            gameRef.current = game;
            (window as unknown as { __bryggen?: GrayboxGame }).__bryggen = game;
            game.start().catch((e: unknown) => setError(String(e)));
        });
        return () => {
            cancelled = true;
            gameRef.current?.dispose();
            gameRef.current = null;
        };
    }, [world]);

    const start = (withMouse: boolean) => {
        setStarted(true);
        const root = document.documentElement;
        if (!document.fullscreenElement) root.requestFullscreen?.().catch(() => undefined);
        if (withMouse) gameRef.current?.requestPointerLock();
        else gameRef.current?.focus();
    };

    useEffect(() => {
        if (started) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'Enter') start(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const hpPct = Math.max(0, hud.playerHp);
    const enemyPct = Math.max(0, (hud.enemyHp / hud.enemyMax) * 100);

    // Portal til <body>: sidens layout har stablingskontekster som ellers legger toppmenyen over spillet.
    return createPortal(
        <div className="fixed inset-0 z-[1000] overflow-hidden bg-slate-400 select-none">
            <div ref={mountRef} className="absolute inset-0" onClick={() => started && !hud.pointerLocked && gameRef.current?.requestPointerLock()} />
            <div ref={floatRef} className="pointer-events-none absolute inset-0" />

            {/* Musa er sluppet (Esc eller fokus borte): ett klikk låser den igjen. */}
            {started && hud.mouseMode && !hud.pointerLocked && (
                <button
                    onClick={() => gameRef.current?.requestPointerLock()}
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/25"
                >
                    <span className="rounded-2xl bg-white px-6 py-4 text-lg font-semibold text-slate-900 shadow-xl">
                        Klikk for å spille videre
                    </span>
                </button>
            )}

            {/* Liv */}
            <div className="pointer-events-none absolute left-4 top-4 w-64 rounded-xl bg-white/85 px-3 py-2 shadow-md backdrop-blur">
                <div className="flex items-baseline justify-between text-[13px] font-semibold text-slate-700">
                    <span>Junge</span>
                    <span className="tabular-nums">{hud.playerHp}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-rose-600 transition-[width] duration-200" style={{ width: `${hpPct}%` }} />
                </div>
            </div>

            {hud.enemyActive && (
                <div className="pointer-events-none absolute left-1/2 top-4 w-72 -translate-x-1/2 rounded-xl bg-white/85 px-3 py-2 shadow-md backdrop-blur">
                    <div className="text-center text-[13px] font-semibold text-slate-700">Tyven</div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-slate-700 transition-[width] duration-200" style={{ width: `${enemyPct}%` }} />
                    </div>
                </div>
            )}

            {/* Ytelse */}
            <div className="pointer-events-none absolute right-4 top-4 rounded-xl bg-white/85 px-3 py-2 text-right text-[13px] tabular-nums text-slate-700 shadow-md backdrop-blur">
                <div className="text-base font-bold text-slate-900">{hud.fps} FPS</div>
                <div>{hud.frameMs} ms/bilde · sim {hud.simMs} ms</div>
                <div>{hud.drawCalls} tegnekall · {Math.round(hud.triangles / 1000)}k trekanter</div>
                {hud.cells > 0 && <div>{hud.cells} celler lastet</div>}
            </div>

            {/* Faste hint nederst i midten: der blikket er */}
            <div className="pointer-events-none absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
                {hud.telegraph && (
                    <div className="rounded-xl bg-amber-300 px-4 py-2 text-base font-bold text-slate-900 shadow-lg">
                        Han slår! Blokker (L / høyre) eller rull unna (Q)
                    </div>
                )}
                {hud.finisherReady && (
                    <div className="rounded-xl bg-white px-4 py-2 text-base font-bold text-rose-700 shadow-lg">F: Avslutt</div>
                )}
                {hud.prompt && (
                    <div className="rounded-xl bg-white/90 px-4 py-2 text-base font-semibold text-slate-800 shadow-lg">{hud.prompt}</div>
                )}
            </div>

            {hud.message && (
                <div className="pointer-events-none absolute left-1/2 top-24 max-w-xl -translate-x-1/2 rounded-xl bg-white/90 px-5 py-3 text-center text-[15px] font-medium text-slate-800 shadow-lg">
                    {hud.message}
                </div>
            )}

            {/* Kontroller */}
            {started && (
                <div className="absolute bottom-4 left-4 max-w-xs rounded-xl bg-white/85 px-3 py-2 text-[13px] text-slate-700 shadow-md backdrop-blur">
                    <button className="font-semibold text-slate-900" onClick={() => setShowControls((v) => !v)}>
                        {showControls ? 'Skjul kontroller' : 'Vis kontroller'}
                    </button>
                    {showControls && (
                        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                            {CONTROLS.map(([k, v]) => (
                                <div key={k} className="contents">
                                    <dt className="font-semibold text-slate-900">{k}</dt>
                                    <dd>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    {!hud.pointerLocked && !hud.mouseMode && <div className="mt-1 text-slate-500">Klikk i bildet for å styre kameraet med musa.</div>}
                </div>
            )}

            {!started && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
                    <div className="w-[min(560px,92vw)] rounded-2xl bg-white p-6 shadow-xl">
                        <p className="text-[13px] font-semibold uppercase tracking-wide text-indigo-600">{INTRO[world].tag}</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">{INTRO[world].title}</h1>
                        <p className="mt-2 text-[15px] text-slate-600">{INTRO[world].text}</p>
                        {error && <p className="mt-3 rounded-lg bg-rose-50 p-2 text-[13px] text-rose-700">{error}</p>}
                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                disabled={hud.loading}
                                onClick={() => start(true)}
                                className="rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow disabled:opacity-50"
                            >
                                {hud.loading ? 'Laster ...' : 'Start med mus'}
                            </button>
                            <button
                                disabled={hud.loading}
                                onClick={() => start(false)}
                                className="rounded-xl bg-slate-200 px-5 py-3 text-base font-semibold text-slate-800 disabled:opacity-50"
                            >
                                Bare tastatur (Enter)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
