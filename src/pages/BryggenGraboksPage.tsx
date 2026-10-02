import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GrayboxGame, HudState, Quality, WorldId } from '../games/bryggen/graboks/game';
import { BismerVisning } from '../games/bryggen/graboks/BismerVisning';

// Testruter for Bryggen-spillet. Ikke koblet inn i galleriet.
// /test/bryggen-graboks  grå prøvescene (følelsen)
// /test/bryggen-gard     den første gården bygget av modulsettet
// Legg til ?skygger=0 for å måle uten skygger, ?kvalitet=lav for lav-nivået (uten normalkart og skygger).
// Knappen øverst til høyre (eller G) bytter kvalitet mens spillet går. Valget huskes i nettleseren.

const QUALITY_KEY = 'bryggen-kvalitet';
const LYD_KEY = 'bryggen-lyd';

interface LydValg {
    paa: boolean;
    volum: number;
}

function lagretLyd(): LydValg {
    try {
        const v = JSON.parse(localStorage.getItem(LYD_KEY) ?? 'null') as Partial<LydValg> | null;
        if (v && typeof v.paa === 'boolean' && typeof v.volum === 'number') return { paa: v.paa, volum: Math.min(1, Math.max(0, v.volum)) };
    } catch {
        // Lagring blokkert eller ødelagt verdi: standard.
    }
    return { paa: true, volum: 0.8 };
}

function initialQuality(params: URLSearchParams): Quality {
    const q = params.get('kvalitet');
    if (q === 'lav' || q === 'full') return q;
    try {
        if (localStorage.getItem(QUALITY_KEY) === 'lav') return 'lav';
    } catch {
        // Lagring kan være blokkert. Da blir det full kvalitet.
    }
    return 'full';
}

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
    quality: 'full',
    samtale: null,
    replikk: null,
    bunter: 0,
    bismer: null,
    telegraphSving: false,
    oppdrag: [],
    oppdragMelding: null,
    ting: [],
};

const TING: Record<string, string> = { brev: 'Et brev', botte: 'En bøtte vann' };

const INTRO: Record<WorldId, { tag: string; title: string; text: string }> = {
    graboks: {
        tag: 'Motorprøve · gråboks',
        title: 'Bryggen, 1420-årene',
        text: 'Ingen grafikk ennå, bare følelsen. Løp gjennom gårdsrommet, klatre opp på svalgangen fra kassestabelen, prøv kameraet i det trange smuget til høyre, ro færingen ved kaia og slåss med tyven inne i gårdsrommet.',
    },
    gard: {
        tag: 'Modulsett · første gård',
        title: 'En gård på Bryggen',
        text: 'Den første gården bygget av modulsettet: laftehus med torv- og bordtak, svalganger over gårdsrommet, vinsjer i gavlene og kai på bolverk. Nikolaikirkeallmenningen ligger til høyre, og nabogårdene langs bryggefronten er bygget av det samme settet.',
    },
};

const CONTROLS: [string, string][] = [
    ['WASD', 'gå og løp'],
    ['Shift', 'sprint'],
    ['Mellomrom', 'hopp / klatre opp på kanter'],
    ['Mus / piltaster', 'kamera'],
    ['E', 'snakk / gjør / gå om bord / i land'],
    ['1, 2, 3', 'svar i en samtale'],
    ['Venstre klikk / J', 'lett slag'],
    ['Hold venstre / K', 'tungt slag'],
    ['Høyre / L (hold)', 'blokker'],
    ['Q / C', 'unnamanøver'],
    ['F', 'avslutt (når fienden vakler)'],
    ['R', 'start slagsmålet på nytt'],
    ['O', 'skjul / vis oppdragene'],
    ['G', 'bytt grafikk (full / lav)'],
    ['M', 'lyd av / på'],
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
    const [lyd, setLyd] = useState<LydValg>(lagretLyd);
    const [visOppdrag, setVisOppdrag] = useState(true);
    // Oppdragsmeldingen (nytt, mål, fullført) står i noen sekunder, så forsvinner den.
    const [melding, setMelding] = useState<HudState['oppdragMelding']>(null);
    const meldingN = hud.oppdragMelding?.n ?? 0;
    useEffect(() => {
        if (!hud.oppdragMelding) return;
        setMelding(hud.oppdragMelding);
        const t = window.setTimeout(() => setMelding(null), hud.oppdragMelding.type === 'maal' ? 2800 : 5200);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meldingN]);
    const lydRef = useRef(lyd);

    useEffect(() => {
        let cancelled = false;
        const params = new URLSearchParams(window.location.search);
        const shadows = params.get('skygger') !== '0';
        const low = initialQuality(params) === 'lav';
        import('../games/bryggen/graboks/game').then(({ GrayboxGame }) => {
            if (cancelled || !mountRef.current || !floatRef.current) return;
            const game = new GrayboxGame(mountRef.current, floatRef.current, setHud, { shadows, world, low });
            gameRef.current = game;
            game.settLyd(lydRef.current.paa, lydRef.current.volum);
            (window as unknown as { __bryggen?: GrayboxGame }).__bryggen = game;
            game.start().catch((e: unknown) => setError(String(e)));
        });
        return () => {
            cancelled = true;
            gameRef.current?.dispose();
            gameRef.current = null;
        };
    }, [world]);

    const toggleQuality = () => {
        const game = gameRef.current;
        if (!game) return;
        const next: Quality = game.quality === 'full' ? 'lav' : 'full';
        try {
            localStorage.setItem(QUALITY_KEY, next);
        } catch {
            // Lagring blokkert: byttet gjelder bare denne økta.
        }
        void game.setQuality(next);
    };

    // Lydvalget huskes i nettleseren og sendes til spillet.
    const endreLyd = (neste: LydValg) => {
        lydRef.current = neste;
        setLyd(neste);
        gameRef.current?.settLyd(neste.paa, neste.volum);
        try {
            localStorage.setItem(LYD_KEY, JSON.stringify(neste));
        } catch {
            // Lagring blokkert: valget gjelder bare denne økta.
        }
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'KeyG' && !e.repeat) toggleQuality();
            if (e.code === 'KeyM' && !e.repeat) endreLyd({ ...lydRef.current, paa: !lydRef.current.paa });
            if (e.code === 'KeyO' && !e.repeat) setVisOppdrag((v) => !v);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const start = (withMouse: boolean) => {
        setStarted(true);
        // Lyden får bare starte fra et klikk eller tastetrykk.
        gameRef.current?.startLyd();
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
            <div
                ref={mountRef}
                className="absolute inset-0"
                onClick={() => {
                    gameRef.current?.startLyd();
                    if (started && !hud.pointerLocked) gameRef.current?.requestPointerLock();
                }}
            />
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
                {hud.bunter > 0 && <div className="mt-1 text-[13px] text-slate-600">Bunter båret: <span className="font-semibold tabular-nums text-slate-900">{hud.bunter}</span></div>}
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
            <div className="absolute right-4 top-4 rounded-xl bg-white/85 px-3 py-2 text-right text-[13px] tabular-nums text-slate-700 shadow-md backdrop-blur">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleQuality();
                        }}
                        title="Bytt grafikk (G)"
                        className="rounded-lg bg-slate-200 px-2 py-0.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-300"
                    >
                        Grafikk: {hud.quality === 'full' ? 'full' : 'lav'} (G)
                    </button>
                    <span className="text-base font-bold text-slate-900">{hud.fps} FPS</span>
                </div>
                {world === 'gard' && (
                    <div className="mt-1 flex items-center justify-end gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                gameRef.current?.startLyd();
                                endreLyd({ ...lyd, paa: !lyd.paa });
                            }}
                            title="Lyd av og på (M)"
                            className="rounded-lg bg-slate-200 px-2 py-0.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-300"
                        >
                            Lyd: {lyd.paa ? 'på' : 'av'} (M)
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(lyd.volum * 100)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                                gameRef.current?.startLyd();
                                endreLyd({ paa: true, volum: Number(e.target.value) / 100 });
                            }}
                            aria-label="Volum"
                            title="Volum"
                            className="h-1.5 w-24 cursor-pointer accent-indigo-600"
                        />
                    </div>
                )}
                <div>{hud.frameMs} ms/bilde · sim {hud.simMs} ms</div>
                <div>{hud.drawCalls} tegnekall · {Math.round(hud.triangles / 1000)}k trekanter</div>
                {hud.cells > 0 && <div>{hud.cells} celler lastet</div>}
            </div>

            {/* Faste hint nederst i midten: der blikket er */}
            <div className="pointer-events-none absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
                {hud.telegraph && (
                    <div className={`rounded-xl px-4 py-2 text-base font-bold shadow-lg ${hud.telegraphSving ? 'bg-orange-600 text-white' : 'bg-amber-300 text-slate-900'}`}>
                        {hud.telegraphSving ? 'Stort svingslag! Rull unna (Q), det går gjennom garden' : 'Han slår! Blokker (L / høyre) eller rull unna (Q)'}
                    </div>
                )}
                {hud.finisherReady && (
                    <div className="rounded-xl bg-white px-4 py-2 text-base font-bold text-rose-700 shadow-lg">F: Avslutt</div>
                )}
                {hud.prompt && (
                    <div className="rounded-xl bg-white/90 px-4 py-2 text-base font-semibold text-slate-800 shadow-lg">{hud.prompt}</div>
                )}
            </div>

            {hud.bismer && <BismerVisning b={hud.bismer} />}

            {/* Samtalen: replikkene står i boblene over hodene. Nederst står bare hvem man snakker med og
                svarene, og «Dette vet vi» i sin helhet: det er ikke noen i spillet som sier det. */}
            {hud.samtale && (
                <div className="pointer-events-none absolute bottom-6 left-1/2 w-[min(720px,92vw)] -translate-x-1/2">
                    {hud.samtale.vet ? (
                        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/95 px-5 py-4 shadow-xl">
                            <div className="text-[13px] font-bold uppercase tracking-wide text-amber-700">{hud.samtale.hvem}</div>
                            <p className="mt-1 text-[17px] leading-snug text-slate-900">{hud.samtale.tekst}</p>
                            <div className="mt-2 text-right text-[13px] font-semibold text-slate-500">E: videre</div>
                        </div>
                    ) : hud.samtale.valg.length > 0 ? (
                        <div className="rounded-2xl bg-slate-900/80 px-4 py-3 shadow-xl backdrop-blur">
                            <div className="text-[12px] font-bold uppercase tracking-wide text-amber-200">Svar {hud.samtale.hvem}</div>
                            <ol className="mt-2 flex flex-col gap-1.5">
                                {hud.samtale.valg.map((v, i) => (
                                    <li key={v} className="flex items-baseline gap-2 text-[16px] font-semibold text-white">
                                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-400 text-[13px] font-bold text-slate-900">
                                            {i + 1}
                                        </span>
                                        {v}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ) : (
                        <div className="mx-auto w-max rounded-xl bg-slate-900/75 px-4 py-2 text-[14px] font-semibold text-white shadow-lg">
                            <span className="text-amber-200">{hud.samtale.hvem}</span> · E: videre
                        </div>
                    )}
                </div>
            )}
            {!hud.samtale && hud.replikk && (
                <div className="pointer-events-none absolute bottom-8 left-1/2 max-w-[min(640px,92vw)] -translate-x-1/2 rounded-xl bg-slate-900/80 px-4 py-2 text-center text-[16px] text-white shadow-lg">
                    <span className="font-bold text-amber-200">{hud.replikk.hvem}: </span>
                    {hud.replikk.tekst}
                </div>
            )}

            {/* Oppdragslista: til høyre, under målerne, som i WoW. */}
            {world === 'gard' && visOppdrag && (hud.oppdrag.length > 0 || hud.ting.length > 0) && (
                <div className="pointer-events-none absolute right-4 top-36 w-72 text-right">
                    <div className="text-[12px] font-bold uppercase tracking-widest text-amber-100 [text-shadow:0_1px_3px_rgba(0,0,0,.9)]">Oppdrag (O)</div>
                    {hud.oppdrag.map((o) => (
                        <div key={o.id} className="mt-2">
                            <div className={`text-[15px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.95)] ${o.klar ? 'text-emerald-300' : 'text-amber-300'}`}>
                                {o.klar && '✓ '}
                                {o.tittel}
                            </div>
                            {o.linjer.map((l) => (
                                <div
                                    key={l.tekst}
                                    className={`text-[13.5px] leading-snug [text-shadow:0_1px_2px_rgba(0,0,0,.95)] ${l.ferdig ? 'text-slate-300 line-through decoration-1' : 'text-white'}`}
                                >
                                    {l.tekst}
                                    {l.antall && <span className="ml-1 font-semibold tabular-nums text-amber-100">{l.antall}</span>}
                                </div>
                            ))}
                        </div>
                    ))}
                    {hud.ting.length > 0 && (
                        <div className="mt-2 text-[13px] italic text-slate-100 [text-shadow:0_1px_2px_rgba(0,0,0,.95)]">
                            Du bærer: {hud.ting.map((t) => TING[t] ?? t).join(', ').toLowerCase()}
                        </div>
                    )}
                </div>
            )}

            {melding && (
                <div key={melding.n} className="bryggen-melding pointer-events-none absolute left-1/2 top-[27%] w-[min(560px,90vw)] text-center">
                    <div className={`text-[13px] font-bold uppercase tracking-[0.25em] [text-shadow:0_1px_4px_rgba(0,0,0,.9)] ${melding.type === 'ferdig' ? 'text-emerald-300' : 'text-amber-200'}`}>
                        {melding.type === 'nytt' ? 'Nytt oppdrag' : melding.type === 'ferdig' ? 'Oppdrag fullført' : melding.tittel}
                    </div>
                    <div className="mt-1 font-[Outfit,Inter,sans-serif] text-[28px] font-extrabold leading-tight text-amber-300 [text-shadow:0_2px_0_#3d2800,0_0_14px_rgba(0,0,0,.7)]">
                        {melding.type === 'maal' ? melding.tekst : melding.tittel}
                    </div>
                    {melding.type !== 'maal' && (
                        <div className="mx-auto mt-2 max-w-md text-[15px] font-medium leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,.95)]">{melding.tekst}</div>
                    )}
                </div>
            )}
            <style>{`.bryggen-melding{animation:bryggen-melding .5s cubic-bezier(.2,1.3,.4,1) both}
@keyframes bryggen-melding{from{opacity:0;transform:translate(-50%,10px) scale(.9)}to{opacity:1;transform:translate(-50%,0) scale(1)}}`}</style>

            {hud.message && (
                <div className="pointer-events-none absolute left-1/2 top-24 max-w-xl -translate-x-1/2 rounded-xl bg-white/90 px-5 py-3 text-center text-[15px] font-medium text-slate-800 shadow-lg">
                    {hud.message}
                </div>
            )}

            {/* Kontroller */}
            {started && !hud.samtale && !hud.bismer && (
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
