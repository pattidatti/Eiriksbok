import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { BannerStore, CoachStore, FloatStore, PinTone } from './stores';

// Tekstlaget over spillet. Hvert lag abonnerer på sin egen store, så en ny
// melding tegner bare laget på nytt - aldri spillet under (se stores.ts).
//
// Lapper og lærings-øyeblikk flytter seg med tingen de peker på. Posisjonen
// skrives rett i style.transform fra en egen animasjonsløkke, ikke via React.

// Retningspil for lapper som peker på noe utenfor bildet (vinkel fra midten, 8 retninger).
const ARROWS = ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'];

const TONE: Record<PinTone, string> = { info: 'var(--arc-paper)', fare: '#ffd9cf', bra: '#dff3cf' };

export function BannerLayer({ store }: { store: BannerStore }) {
    useSyncExternalStore(store.subscribe, store.getVersion);
    const b = store.current;
    if (!b) return null;
    return (
        <div
            key={b.n}
            className="arc-banner show"
            aria-live="polite"
            style={{ ['--arc-out' as string]: `${Math.max(0.5, b.dur - 0.4)}s` }}
        >
            <h4 className="arc-display" style={{ background: b.color }}>
                {b.t}
            </h4>
        </div>
    );
}

export function FloatLayer({ store }: { store: FloatStore }) {
    useSyncExternalStore(store.subscribe, store.getVersion);
    return (
        <>
            {store.items.map((f) => (
                <div
                    key={f.id}
                    className={`arc-float arc-display${f.big ? ' big' : ''}`}
                    style={{ left: f.x, top: f.y, color: f.color }}
                >
                    {f.t}
                </div>
            ))}
        </>
    );
}

export function CoachLayer({ store }: { store: CoachStore }) {
    useSyncExternalStore(store.subscribe, store.getVersion);
    const root = useRef<HTMLDivElement>(null);

    // Én løkke flytter lappene og kortet etter ankeret sitt, og rydder bort det
    // som er gjort eller har stått lenge nok.
    useEffect(() => {
        let raf = 0;
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const el = root.current;
            if (!el) return;
            const W = el.clientWidth;
            const H = el.clientHeight;
            const now = performance.now();
            for (const p of store.pins) {
                const node = el.querySelector<HTMLElement>(
                    `[data-coach-pin="${CSS.escape(p.key)}"]`
                );
                if (!node) continue;
                if ((p.until && p.until()) || now - p.born > p.seconds * 1000) {
                    store.unpoint(p.key);
                    continue;
                }
                const a = p.at();
                if (!a) {
                    node.style.opacity = '0';
                    continue;
                }
                const w = node.offsetWidth;
                const h = node.offsetHeight;
                node.style.opacity = '1';
                // Utenfor bildet: lappen legger seg i kanten med en pil mot tingen.
                const out = a.x < 8 || a.x > W - 8 || a.y < 8 || a.y > H - 8;
                if (out) {
                    const cx = W / 2;
                    const cy = H / 2;
                    const ang = Math.atan2(a.y - cy, a.x - cx);
                    const x = Math.min(W - w - 8, Math.max(8, a.x - w / 2));
                    const y = Math.min(H - h - 8, Math.max(8, a.y - h / 2));
                    node.style.transform = `translate(${x}px, ${y}px)`;
                    node.dataset.edge = ARROWS[Math.round(((ang + Math.PI) / (Math.PI * 2)) * 8) % 8];
                    node.dataset.below = '';
                    continue;
                }
                node.dataset.edge = '';
                // Lappen står over punktet med pila ned mot det - under hvis det ikke er plass.
                const below = a.y - h - 14 < 4;
                const x = Math.min(W - w - 6, Math.max(6, a.x - w / 2));
                const y = below ? a.y + 14 : a.y - h - 14;
                node.style.transform = `translate(${x}px, ${y}px)`;
                node.dataset.below = below ? '1' : '';
                node.style.setProperty('--arrow-x', `${Math.min(w - 12, Math.max(12, a.x - x))}px`);
            }
            const b = store.beat;
            if (b) {
                if (b.until && b.until() && now - b.born > 700) {
                    store.endBeat();
                    return;
                }
                const card = el.querySelector<HTMLElement>('[data-coach-beat]');
                const ring = el.querySelector<HTMLElement>('[data-coach-ring]');
                const a = b.at?.() ?? null;
                if (card) {
                    const w = card.offsetWidth;
                    const h = card.offsetHeight;
                    let x = (W - w) / 2;
                    let y = H * 0.18;
                    if (a) {
                        // Kortet ved siden av hendelsen, aldri oppå den.
                        x = Math.min(W - w - 8, Math.max(8, a.x - w / 2));
                        y = a.y - h - 36 > 8 ? a.y - h - 36 : Math.min(H - h - 8, a.y + 36);
                    }
                    card.style.transform = `translate(${x}px, ${y}px)`;
                }
                if (ring) {
                    ring.style.display = a ? 'block' : 'none';
                    if (a) ring.style.transform = `translate(${a.x - 34}px, ${a.y - 34}px)`;
                }
            }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [store]);

    // Enter fortsetter etter et lærings-øyeblikk (mellomrom er ofte et spillgrep).
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (store.beat && e.code === 'Enter') {
                e.preventDefault();
                store.endBeat();
            }
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
    }, [store]);

    const b = store.beat;
    return (
        <div ref={root} className="arc-coach">
            {store.pins.map((p) => (
                <div
                    key={p.key}
                    data-coach-pin={p.key}
                    className="arc-pin arc-body"
                    style={{ background: TONE[p.tone], opacity: 0 }}
                >
                    {p.text}
                </div>
            ))}
            {b && (
                <>
                    <div data-coach-ring className="arc-ring" />
                    <div
                        key={b.key}
                        data-coach-beat={b.key}
                        className="arc-beat"
                        role="dialog"
                        aria-live="assertive"
                    >
                        <div className="arc-display arc-beat-title">{b.title}</div>
                        <p>{b.text}</p>
                        <button
                            type="button"
                            className="arc-small"
                            data-coach-continue
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => store.endBeat()}
                        >
                            Skjønner ↵
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

/** «Dette skjedde» på slutt-skjermen: det eleven skal sitte igjen med fra runden. */
export function ArcadeLessons({
    items,
    title = 'Dette skjedde',
}: {
    items: string[];
    title?: string;
}) {
    if (!items.length) return null;
    return (
        <div data-coach-lessons className="arc-lessons">
            <div className="arc-display arc-lessons-title">{title}</div>
            <ul>
                {items.map((t, i) => (
                    <li key={i}>{t}</li>
                ))}
            </ul>
        </div>
    );
}
