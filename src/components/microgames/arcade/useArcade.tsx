import { useCallback, useEffect, useRef, useState } from 'react';

// Hookene i arkadeskallet. Ligger i egen fil fordi Fast Refresh krever at
// komponentfiler bare eksporterer komponenter.

export interface ArcadeView {
    ctx: CanvasRenderingContext2D;
    /** Canvasens størrelse i CSS-piksler. */
    w: number;
    h: number;
    dpr: number;
}

interface LoopHandlers {
    /** Kalles hver frame med dt i sekunder (klemt til 50 ms). */
    frame: (dt: number, view: ArcadeView) => void;
    /** Spillet skrolles ut av syne eller fanen skjules - pause her. */
    onHidden?: () => void;
}

/**
 * Canvas-løkka. Tegner bare mens spillet er synlig på skjermen: en Chromebook
 * uten vifte skal ikke male et spill eleven har scrollet forbi.
 *
 * Bruk `bindStage`/`bindCanvas` som ref på elementene. De er callback-refs med
 * vilje: rammen rundt spillet kan lukkes og åpnes igjen, og da monteres canvasen
 * på nytt mens spillkomponenten lever videre. Med vanlige ref-objekter ville
 * løkka fortsatt å male på den gamle, frakoblede canvasen - og eleven ser et
 * tomt spill med bare HUD. Nå starter løkka på nytt på det nye elementet.
 */
export function useArcadeLoop(handlers: LoopHandlers) {
    const h = useRef(handlers);
    useEffect(() => {
        h.current = handlers;
    });

    const stageRef = useRef<HTMLDivElement | null>(null);
    const [stage, setStage] = useState<HTMLDivElement | null>(null);
    // Canvasen bor i en ref (den får width/height skrevet), og en teller i state
    // starter løkka på nytt når et nytt canvas-element monteres.
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [canvasGen, setCanvasGen] = useState(0);
    const bindStage = useCallback((el: HTMLDivElement | null) => {
        stageRef.current = el;
        setStage(el);
    }, []);
    const bindCanvas = useCallback((el: HTMLCanvasElement | null) => {
        if (canvasRef.current === el) return;
        canvasRef.current = el;
        setCanvasGen((n) => n + 1);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!stage || !canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const view: ArcadeView = { ctx, w: 1, h: 1, dpr: 1 };
        const resize = () => {
            const r = stage.getBoundingClientRect();
            view.dpr = Math.min(window.devicePixelRatio || 1, 2);
            view.w = Math.max(1, r.width);
            view.h = Math.max(1, r.height);
            canvas.width = Math.round(view.w * view.dpr);
            canvas.height = Math.round(view.h * view.dpr);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(stage);

        let visible = true;
        const io = new IntersectionObserver(
            ([e]) => {
                const was = visible;
                visible = e.isIntersecting;
                if (was && !visible) h.current.onHidden?.();
            },
            { threshold: 0.15 }
        );
        io.observe(stage);
        const onVis = () => {
            if (document.hidden) h.current.onHidden?.();
        };
        document.addEventListener('visibilitychange', onVis);

        let raf = 0;
        let last = performance.now();
        let reported = false;
        const tick = (now: number) => {
            // Neste frame bestilles FØRST: et unntak i én frame skal ikke drepe
            // løkka og fryse spillet for godt.
            raf = requestAnimationFrame(tick);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!visible || document.hidden) return;
            try {
                h.current.frame(dt, view);
            } catch (err) {
                if (!reported) {
                    reported = true;
                    console.error('[arkade] feil i frame', err);
                }
            }
        };
        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            io.disconnect();
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [stage, canvasGen]);

    return { stageRef, bindStage, bindCanvas };
}

// ---------- Banner og toast ----------

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Lesetid: en 14-åring skal rekke å lese hele teksten, ikke bare overskriften. */
export function readingSeconds(text: string, min: number, max: number) {
    return clamp(1.6 + text.length * 0.065, min, max);
}

interface BannerMsg {
    t: string;
    s: string;
    color: string;
    n: number;
    dur: number;
}
interface ToastMsg {
    t: string;
    n: number;
    dur: number;
}

/**
 * Banner og toast styres imperativt fra spill-løkka (som ikke lever i React).
 * Meldingene køes - en ny melding skyver aldri en gammel bort før den er lest -
 * og hver melding står så lenge teksten tar å lese.
 *
 * `feed: true` (anbefalt for 3D-spill der eleven klikker i scenen): bare en kort
 * tittel vises over scenen. All lesetekst - toasts og bannerundertekster - går i
 * en fast linje UNDER spillvinduet (`feed`-elementet), så tekst aldri dekker
 * noe eleven skal treffe.
 */
export function useArcadeAnnouncer(opts: { feed?: boolean } = {}) {
    const feedMode = !!opts.feed;
    const [banner, setBanner] = useState<BannerMsg | null>(null);
    const [toast, setToast] = useState<ToastMsg | null>(null);

    const [api] = useState(() => {
        let n = 0;
        const bq: BannerMsg[] = [];
        const tq: ToastMsg[] = [];
        let bTimer: number | undefined;
        let tTimer: number | undefined;
        let bBusy = false;
        let tBusy = false;

        const nextBanner = () => {
            const m = bq.shift();
            if (!m) {
                bBusy = false;
                setBanner(null);
                return;
            }
            bBusy = true;
            setBanner(m);
            bTimer = window.setTimeout(nextBanner, m.dur * 1000 + 150);
        };
        const nextToast = () => {
            const m = tq.shift();
            if (!m) {
                tBusy = false;
                setToast(null);
                return;
            }
            tBusy = true;
            setToast(m);
            tTimer = window.setTimeout(nextToast, m.dur * 1000);
        };

        return {
            banner: (t: string, s = '', color = '#b8322a') => {
                n += 1;
                if (feedMode) {
                    // Kort tittel over scenen; lesestoffet går i linja under.
                    bq.push({ t, s: '', color, n, dur: 2.2 });
                    if (s) {
                        n += 1;
                        tq.unshift({ t: s, n, dur: readingSeconds(s, 4, 9) });
                        window.clearTimeout(tTimer);
                        nextToast();
                    }
                    while (bq.length > 2) bq.shift();
                    if (!bBusy) nextBanner();
                    return;
                }
                bq.push({ t, s, color, n, dur: readingSeconds(t + s, 3.2, 9) });
                // Et spill i full fart skal ikke bygge opp en lang kø av gammelt nytt.
                while (bq.length > 2) bq.shift();
                if (!bBusy) nextBanner();
            },
            toast: (t: string) => {
                n += 1;
                tq.push({ t, n, dur: readingSeconds(t, 3, 7.5) });
                while (tq.length > 2) tq.shift();
                if (!tBusy) nextToast();
            },
            clear: () => {
                bq.length = 0;
                tq.length = 0;
                window.clearTimeout(bTimer);
                window.clearTimeout(tTimer);
                bBusy = false;
                tBusy = false;
                setBanner(null);
                setToast(null);
            },
            dispose: () => {
                window.clearTimeout(bTimer);
                window.clearTimeout(tTimer);
            },
        };
    });

    useEffect(() => api.dispose, [api]);

    const elements = (
        <>
            {banner && (
                <div
                    key={banner.n}
                    className="arc-banner show"
                    aria-live="polite"
                    style={{ ['--arc-out' as string]: `${Math.max(0.5, banner.dur - 0.4)}s` }}
                >
                    <h4 className="arc-display" style={{ background: banner.color }}>
                        {banner.t}
                    </h4>
                    {banner.s && (
                        <>
                            <br />
                            <p>{banner.s}</p>
                        </>
                    )}
                </div>
            )}
            {!feedMode && (
                <div key={toast?.n ?? 0} className={`arc-toast ${toast ? 'on' : ''}`} aria-live="polite">
                    {toast?.t}
                </div>
            )}
        </>
    );

    const feed = (
        <div className="arc-feed" aria-live="polite">
            {toast && (
                <span key={toast.n} className="arc-feed-msg">
                    {toast.t}
                </span>
            )}
        </div>
    );

    return [api, elements, feed] as const;
}
