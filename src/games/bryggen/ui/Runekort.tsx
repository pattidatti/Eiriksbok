// Kortet som kommer opp når gutten plukker opp en runepinne (graboks/strandliv.ts): pinnen med runene
// som risses fram én etter én, hva det står på norsk, hvor den er funnet, og «Dette vet vi».
//
// Runene tegnes som streker i SVG, ikke med en skrift: Chromebookene har ikke alltid en skrift med
// runer. Formene er de vanlige middelalderrunene, forenklet [S].
import { useEffect, useState } from 'react';
import type { RunekortHud } from '../graboks/strandliv';
import { ETIKETT, PANEL } from './stil';

/** Strekene i hver rune, i en rute 0-1 (x) og 0-1 (y ned). Stammen er (0,5 0) til (0,5 1). */
const STAV: number[] = [0.5, 0, 0.5, 1];
const FORM: Record<string, number[][]> = {
    a: [STAV, [0.5, 0.42, 0.85, 0.62]],
    b: [STAV, [0.5, 0, 0.85, 0.25, 0.5, 0.5, 0.85, 0.75, 0.5, 1]],
    d: [STAV, [0.18, 0.3, 0.5, 0.02, 0.82, 0.3], [0.38, 0.55, 0.62, 0.55]],
    e: [STAV, [0.36, 0.5, 0.64, 0.5]],
    f: [STAV, [0.5, 0.3, 0.88, 0.06], [0.5, 0.56, 0.88, 0.32]],
    g: [STAV, [0.5, 0.42, 0.85, 0.12], [0.36, 0.62, 0.64, 0.62]],
    h: [STAV, [0.2, 0.32, 0.8, 0.68], [0.8, 0.32, 0.2, 0.68]],
    i: [STAV],
    k: [STAV, [0.5, 0.42, 0.85, 0.12]],
    l: [STAV, [0.5, 0, 0.85, 0.3]],
    m: [STAV, [0.15, 0.02, 0.5, 0.36, 0.85, 0.02]],
    n: [STAV, [0.22, 0.36, 0.78, 0.62]],
    o: [STAV, [0.5, 0.2, 0.85, 0.42], [0.5, 0.48, 0.85, 0.7]],
    p: [STAV, [0.5, 0, 0.85, 0.25, 0.5, 0.5, 0.85, 0.75, 0.5, 1], [0.62, 0.25, 0.62, 0.25]],
    r: [STAV, [0.5, 0, 0.85, 0.22, 0.5, 0.45, 0.85, 1]],
    s: [[0.72, 0, 0.28, 0.35, 0.72, 0.65, 0.28, 1]],
    t: [STAV, [0.18, 0.3, 0.5, 0.02, 0.82, 0.3]],
    u: [STAV, [0.5, 0, 0.88, 0.32, 0.88, 1]],
    v: [STAV, [0.5, 0, 0.88, 0.32, 0.88, 1], [0.58, 0.55, 0.78, 0.55]],
    y: [STAV, [0.15, 0.98, 0.5, 0.64, 0.85, 0.98]],
    þ: [STAV, [0.5, 0.24, 0.85, 0.45, 0.5, 0.66]],
    æ: [STAV, [0.15, 0.6, 0.85, 0.36]],
    ø: [STAV, [0.5, 0.2, 0.85, 0.42], [0.5, 0.48, 0.85, 0.7], [0.32, 0.7, 0.32, 0.7]],
    c: [[0.5, 0.45, 0.5, 1]],
    z: [STAV, [0.15, 0.98, 0.5, 0.64, 0.85, 0.98]],
};
const BOKSTAV_W = 26;
const BOKSTAV_H = 46;
/** Hvor fort runene risses fram (ms per rune). */
const RISS_MS = 140;

function Rune({ tegn, synlig, x }: { tegn: string; synlig: number; x: number }) {
    if (tegn === ':') {
        return (
            <g opacity={synlig}>
                <circle cx={x + BOKSTAV_W * 0.5} cy={BOKSTAV_H * 0.35} r={2.6} fill="#3b2a1b" />
                <circle cx={x + BOKSTAV_W * 0.5} cy={BOKSTAV_H * 0.65} r={2.6} fill="#3b2a1b" />
            </g>
        );
    }
    const form = FORM[tegn] ?? [STAV];
    return (
        <g>
            {form.map((s, i) => {
                const pts = [];
                for (let j = 0; j < s.length; j += 2) pts.push(`${x + s[j] * BOKSTAV_W},${4 + s[j + 1] * (BOKSTAV_H - 8)}`);
                const len = 120;
                return (
                    <polyline
                        key={i}
                        points={pts.join(' ')}
                        fill="none"
                        stroke="#3b2a1b"
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={len}
                        strokeDashoffset={len * (1 - synlig)}
                    />
                );
            })}
        </g>
    );
}

/** Pinnen med runene risset inn, tegnet som en lys trestav. */
function Pinne({ runer, siden }: { runer: string; siden: number }) {
    const tegn = [...runer.toLowerCase()].filter((t) => t !== ' ');
    const w = tegn.length * (BOKSTAV_W + 6) + 28;
    return (
        <svg viewBox={`0 0 ${w} ${BOKSTAV_H + 12}`} className="h-16 w-full max-w-[560px]" role="img" aria-label="Runene på pinnen">
            <rect x={2} y={4} width={w - 4} height={BOKSTAV_H + 4} rx={12} fill="#e2cba0" stroke="#a88a5c" strokeWidth={2} />
            <rect x={8} y={8} width={w - 16} height={4} rx={2} fill="#f0dfbc" opacity={0.7} />
            {tegn.map((t, i) => (
                <Rune key={i} tegn={t} x={16 + i * (BOKSTAV_W + 6)} synlig={Math.min(1, Math.max(0, (siden - i * RISS_MS) / (RISS_MS * 1.6)))} />
            ))}
        </svg>
    );
}

export function RunekortPanel({ data }: { data: unknown }) {
    const d = data as RunekortHud;
    const [naa, setNaa] = useState(() => performance.now());
    useEffect(() => {
        let id = 0;
        const tikk = () => {
            setNaa(performance.now());
            id = requestAnimationFrame(tikk);
        };
        id = requestAnimationFrame(tikk);
        return () => cancelAnimationFrame(id);
    }, [d.apnet]);
    const siden = naa - d.apnet;
    const inn = Math.min(1, siden / 260);
    const p = d.pinne;
    return (
        <div
            className={`${PANEL} pointer-events-auto mt-2 w-[min(620px,92vw)] p-5 text-slate-800`}
            style={{ opacity: inn, transform: `translateY(${(1 - inn) * 18}px) scale(${0.96 + inn * 0.04})` }}
        >
            <div className="flex items-baseline justify-between gap-3">
                <div className={ETIKETT}>Runepinne · {p.slag}</div>
                <div className="text-[13px] font-semibold text-slate-500">
                    {d.funnet} av {d.totalt} funnet
                </div>
            </div>
            <div className="mt-3 flex justify-center">
                {p.runer ? (
                    <Pinne runer={p.runer} siden={siden} />
                ) : (
                    <div className="rounded-xl bg-amber-50 px-4 py-2 text-[14px] text-amber-900">Runene på denne pinnen er ikke gjengitt her.</div>
                )}
            </div>
            {p.runer && <div className="mt-1 text-center font-mono text-[14px] tracking-wider text-slate-500">{p.runer.split(':').join(' · ')}</div>}
            <div className="mt-3 text-center font-serif text-[22px] font-semibold leading-snug text-slate-900">«{p.norsk}»</div>
            <div className="mt-1 text-center text-[13px] text-slate-500">
                Funnet {d.hvor}. Den ekte pinnen: {p.funn}
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                <div className="text-[13px] font-bold uppercase tracking-widest text-amber-800">Dette vet vi</div>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-800">{p.vet}</p>
                <p className="mt-2 text-[13px] text-slate-500">Kilde: {p.kilde}. Runene over er tegnet etter den latinske gjengivelsen.</p>
            </div>
            <div className="mt-3 text-right text-[14px] font-semibold text-indigo-700">E: Legg pinnen i pungen</div>
        </div>
    );
}
