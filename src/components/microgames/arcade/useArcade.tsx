import { useCallback, useEffect, useRef, useState } from 'react';
import { playtestSpeed } from '../playtest';
import { budgetDpr } from '../kit/pixelBudget';
import {
    BannerStore,
    CoachStore,
    FloatStore,
    type Anchor,
    type BeatOptions,
    type PinOptions,
} from './stores';
import { BannerLayer, CoachLayer, FloatLayer } from './ArcadeLayers';

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
            view.w = Math.max(1, r.width);
            view.h = Math.max(1, r.height);
            // Pikselbudsjett: fullskjerm på en tett skjerm skal ikke koste mange
            // ganger spalten (2D-canvas tåler mer enn 3D, derfor høyere budsjett).
            view.dpr = budgetDpr(view.w, view.h, 2.6e6);
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
        const speed = playtestSpeed();
        // Selvspill med ?mgfart: bare det siste steget per bilde tegnes på skjermen. De
        // andre tegner på et 1x1-lerret - samme spillregler og samme view-mål, men uten å
        // rastrere hele fullskjermen fire ganger på en programvare-GPU (det var det som
        // holdt 2D-spillene på 0,2-0,4x ekte tid i CI).
        const scratch = speed > 1 ? document.createElement('canvas').getContext('2d') : null;
        const stepView: ArcadeView = { ...view };
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
                // Selvspill kan be om flere steg per bilde (?mgfart, kun i utvikling).
                for (let k = 0; k < speed; k++) {
                    if (scratch && k < speed - 1) {
                        Object.assign(stepView, view, { ctx: scratch });
                        h.current.frame(dt, stepView);
                    } else h.current.frame(dt, view);
                }
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

// ---------- Tekst: banner, lapper, lærings-øyeblikk, «Dette skjedde», poengtekst ----------

/**
 * Alt spillet vil si med tekst, samlet på ett sted. Regelen bak (eier, 2026-09-26):
 * eleven ser på spillet, ikke under det. Derfor finnes det ingen toast eller
 * tekstlinje under spillvinduet lenger - bare fire måter å si noe på:
 *
 * - `banner(tittel)`: to-fire ord midt i bildet et par sekunder («15. AUGUST»).
 * - `point(nøkkel, tekst, anker)`: en lapp med pil, festet til tingen den gjelder
 *   («Klatrer - 5 s»). Maks sju ord. Står til eleven har gjort det den ber om.
 * - `beatOnce(nøkkel, tittel, setning)`: et lærings-øyeblikk. Spillet går i sakte
 *   film, et kort står ved hendelsen, og spillet fortsetter når eleven gjør
 *   handlingen eller trykker «Skjønner». Bare første gang, maks tre per runde.
 *   Bruk det på fagkjernen: øyeblikket eleven MÅ forstå for å spille riktig.
 * - `lesson(nøkkel, tekst)`: det eleven skal sitte igjen med. Vises på
 *   slutt-skjermen under «Dette skjedde», der eleven har tid til å lese.
 *
 * Og `float(tekst, x, y)` for poeng som spretter opp der det skjedde.
 *
 * Spillet må gange sin dt med `timeScale()`, ellers blir ikke øyeblikkene sakte film.
 * `layer` legges inne i ArcadeStage. Ingen av delene tegner spillkomponenten på
 * nytt - tekst skal aldri få et 3D-spill til å hakke.
 */
export function useArcadeText(gameId: string, opts: { maxBeats?: number } = {}) {
    const [stores] = useState(() => ({
        banner: new BannerStore(),
        coach: new CoachStore(gameId, opts.maxBeats ?? 3),
        floats: new FloatStore(),
    }));
    useEffect(() => () => stores.banner.dispose(), [stores]);

    const [api] = useState(() => {
        const { banner, coach, floats } = stores;
        return {
            /** To-fire ord midt i bildet. Aldri en setning. */
            banner: (title: string, color = '#b8322a', seconds = 2.2) =>
                banner.push(title, color, seconds),
            point: (key: string, text: string, at: Anchor, o?: PinOptions) =>
                coach.point(key, text, at, o),
            unpoint: (key: string) => coach.unpoint(key),
            beatOnce: (key: string, title: string, text: string, o?: BeatOptions) =>
                coach.beatOnce(key, title, text, o),
            endBeat: () => coach.endBeat(),
            beatActive: () => coach.beat !== null,
            lesson: (key: string, text: string, weight = 1) => coach.lesson(key, text, weight),
            lessons: (max = 3) => coach.lessons(max),
            float: (text: string, x: number, y: number, color?: string, big = false) =>
                floats.push(text, x, y, color, big),
            timeScale: () => coach.timeScale(),
            /** Ny runde. */
            resetRun: () => {
                coach.resetRun();
                banner.clear();
                floats.clear();
            },
            /** Rydd bort alt som står i bildet (meny, slutt-skjerm). */
            clear: () => {
                banner.clear();
                floats.clear();
                coach.endBeat();
                for (const p of [...coach.pins]) coach.unpoint(p.key);
            },
            forgetSeen: () => coach.forgetSeen(),
        };
    });

    const [layer] = useState(() => (
        <>
            <FloatLayer store={stores.floats} />
            <BannerLayer store={stores.banner} />
            <CoachLayer store={stores.coach} />
        </>
    ));

    return [api, layer] as const;
}

export type ArcadeText = ReturnType<typeof useArcadeText>[0];
