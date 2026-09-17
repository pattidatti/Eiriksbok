// Diagram-byggeklosser for dashbordet.
//
// Rå SVG framfor Chart.js: dashbordet tegner mange små figurer på én skjerm,
// og hver Chart.js-instans drar med seg en canvas og en egen animasjonsløkke.
// Her er hver figur noen få path-er som følger sidens egen typografi.
//
// Farger og skalaer bor i chartTokens.ts.

import React, { useEffect, useRef, useState } from 'react';
import { RAMPE, RUTENETT, TEKST_SVAK, SERIE_1, rampeSteg } from './chartTokens';

/**
 * Måler bredden på beholderen, slik at viewBox kan settes i ekte piksler.
 * Alternativet - fast viewBox og `w-full` - lar SVG-en skalere proporsjonalt,
 * og da endte grafen som en smal stripe midt i et bredt kort.
 */
const useBredde = (start = 720): [React.RefObject<HTMLDivElement | null>, number] => {
    const ref = useRef<HTMLDivElement>(null);
    const [bredde, setBredde] = useState(start);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new ResizeObserver(([post]) => {
            const b = post.contentRect.width;
            if (b > 0) setBredde(b);
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return [ref, bredde];
};

// --------------------------------------------------------------------------
// Trendgraf: én eller to serier over tid, med trådkors og verdiboks.
// --------------------------------------------------------------------------

export interface Serie {
    navn: string;
    farge: string;
    verdier: number[];
    /** Formatering i verdiboksen - default er rått tall. */
    format?: (n: number) => string;
}

interface TrendProps {
    etiketter: string[];
    serier: Serie[];
    hoyde?: number;
}

export const Trendgraf: React.FC<TrendProps> = ({ etiketter, serier, hoyde = 200 }) => {
    const [aktiv, setAktiv] = useState<number | null>(null);
    const [ref, B] = useBredde();
    const H = hoyde;
    const pad = { topp: 12, hoyre: 12, bunn: 22, venstre: 40 };
    const n = etiketter.length;

    // Én akse - aldri to. Serier med ulik målestokk hører hjemme i hver sin graf.
    const toppverdi = Math.max(0, ...serier.flatMap((s) => s.verdier));
    const maks = Math.max(1, toppverdi);
    const innB = B - pad.venstre - pad.hoyre;
    const innH = H - pad.topp - pad.bunn;

    const x = (i: number) => pad.venstre + (n <= 1 ? innB / 2 : (i / (n - 1)) * innB);
    const y = (v: number) => pad.topp + innH - (v / maks) * innH;

    const linje = (verdier: number[]) =>
        verdier.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

    const flate = (verdier: number[]) =>
        `${linje(verdier)} L ${x(n - 1).toFixed(1)} ${(pad.topp + innH).toFixed(1)} L ${x(0).toFixed(1)} ${(pad.topp + innH).toFixed(1)} Z`;

    const ticks = [0, 0.5, 1].map((f) => Math.round(maks * f));
    // Én etikett per ~90 piksler, ellers kolliderer datoene på en Chromebook.
    const steg = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innB / 90))));

    // En graf av bare nuller sier ingenting, og en strek langs bunnen ser ut
    // som en måling. Da er det ærligere å si at det ikke finnes tall ennå.
    if (toppverdi === 0) {
        return (
            <div ref={ref} className="flex items-center justify-center text-sm text-slate-400" style={{ height: H }}>
                Ingen målinger i perioden ennå
            </div>
        );
    }

    return (
        <div className="relative" ref={ref}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                width={B}
                height={H}
                role="img"
                aria-label={`Utvikling over ${n} dager for ${serier.map((s) => s.navn).join(' og ')}`}
                onMouseLeave={() => setAktiv(null)}
                onMouseMove={(e) => {
                    const boks = e.currentTarget.getBoundingClientRect();
                    const rel = ((e.clientX - boks.left) / boks.width) * B;
                    const i = Math.round(((rel - pad.venstre) / innB) * (n - 1));
                    setAktiv(i >= 0 && i < n ? i : null);
                }}
            >
                {ticks.map((t) => (
                    <g key={t}>
                        <line
                            x1={pad.venstre}
                            x2={B - pad.hoyre}
                            y1={y(t)}
                            y2={y(t)}
                            stroke={RUTENETT}
                            strokeWidth={1}
                        />
                        <text x={pad.venstre - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={TEKST_SVAK}>
                            {t}
                        </text>
                    </g>
                ))}

                {serier.map((s, si) => (
                    <g key={s.navn}>
                        {si === 0 && (
                            <path d={flate(s.verdier)} fill={s.farge} opacity={0.1} />
                        )}
                        <path
                            d={linje(s.verdier)}
                            fill="none"
                            stroke={s.farge}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    </g>
                ))}

                {aktiv !== null && (
                    <g>
                        <line
                            x1={x(aktiv)}
                            x2={x(aktiv)}
                            y1={pad.topp}
                            y2={pad.topp + innH}
                            stroke={TEKST_SVAK}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                        />
                        {serier.map((s) => (
                            <circle
                                key={s.navn}
                                cx={x(aktiv)}
                                cy={y(s.verdier[aktiv] ?? 0)}
                                r={4}
                                fill={s.farge}
                                stroke="#ffffff"
                                strokeWidth={2}
                            />
                        ))}
                    </g>
                )}

                {etiketter.map((e, i) =>
                    i % steg === 0 || i === n - 1 ? (
                        <text
                            key={e}
                            x={x(i)}
                            y={H - 6}
                            textAnchor="middle"
                            fontSize={11}
                            fill={TEKST_SVAK}
                        >
                            {e}
                        </text>
                    ) : null
                )}
            </svg>

            {aktiv !== null && (
                <div
                    className="pointer-events-none absolute top-0 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
                    style={{ left: x(aktiv), transform: 'translateX(-50%)' }}
                >
                    <div className="mb-1 font-semibold text-slate-900">{etiketter[aktiv]}</div>
                    {serier.map((s) => (
                        <div key={s.navn} className="flex items-center gap-2 whitespace-nowrap">
                            <span className="h-2 w-2 rounded-full" style={{ background: s.farge }} />
                            <span className="text-slate-500">{s.navn}</span>
                            <span className="ml-auto font-mono font-semibold text-slate-900">
                                {s.format ? s.format(s.verdier[aktiv] ?? 0) : (s.verdier[aktiv] ?? 0)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {serier.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-4" style={{ paddingLeft: pad.venstre }}>
                    {serier.map((s) => (
                        <span key={s.navn} className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-2 w-4 rounded-full" style={{ background: s.farge }} />
                            {s.navn}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

// --------------------------------------------------------------------------
// Stolpeliste: navn til venstre, stolpe og tall til høyre.
// Alltid direkte merket, så identiteten aldri hviler på farge alene.
// --------------------------------------------------------------------------

export interface StolpeRad {
    navn: string;
    verdi: number;
    farge?: string;
    bimerke?: string;
    lenke?: string;
}

export const Stolpeliste: React.FC<{
    rader: StolpeRad[];
    format?: (n: number) => string;
    tomTekst?: string;
}> = ({ rader, format = (n) => n.toLocaleString('nb-NO'), tomTekst = 'Ingen data ennå' }) => {
    const maks = Math.max(1, ...rader.map((r) => r.verdi));

    if (rader.length === 0) {
        return <p className="py-6 text-center text-sm text-slate-400">{tomTekst}</p>;
    }

    return (
        <ul className="space-y-2.5">
            {rader.map((r) => (
                <li key={r.navn}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-medium text-slate-700">
                            {r.navn}
                            {r.bimerke && (
                                <span className="ml-2 text-xs font-normal text-slate-400">{r.bimerke}</span>
                            )}
                        </span>
                        <span className="shrink-0 font-mono text-sm font-semibold text-slate-900">
                            {format(r.verdi)}
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: r.verdi > 0 ? `${Math.max(2, (r.verdi / maks) * 100)}%` : '0%',
                                background: r.farge ?? SERIE_1,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
};

// --------------------------------------------------------------------------
// Varmekart: ukedag x klokketime. Én tone, lys -> mørk.
// --------------------------------------------------------------------------

export const Varmekart: React.FC<{
    celler: { ukedag: number; time: number; antall: number }[];
    ukedager: string[];
}> = ({ celler, ukedager }) => {
    const maks = Math.max(1, ...celler.map((c) => c.antall));

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[540px]">
                <div className="mb-1 flex pl-9">
                    {Array.from({ length: 24 }, (_, t) => (
                        <div key={t} className="flex-1 text-center text-[9px] text-slate-400">
                            {t % 3 === 0 ? t : ''}
                        </div>
                    ))}
                </div>
                {ukedager.map((navn, d) => (
                    <div key={navn} className="mb-0.5 flex items-center">
                        <div className="w-9 shrink-0 text-[10px] font-medium text-slate-500">{navn}</div>
                        <div className="flex flex-1 gap-0.5">
                            {Array.from({ length: 24 }, (_, t) => {
                                const c = celler.find((x) => x.ukedag === d && x.time === t);
                                const antall = c?.antall ?? 0;
                                return (
                                    <div
                                        key={t}
                                        title={`${navn} kl. ${t}:00 – ${antall} visninger`}
                                        className="h-5 flex-1 rounded-[3px] transition-transform hover:scale-125"
                                        style={{ background: rampeSteg(antall / maks) }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
                <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-400">
                    <span>Lite</span>
                    {RAMPE.map((f) => (
                        <span key={f} className="h-3 w-5 rounded-[2px]" style={{ background: f }} />
                    ))}
                    <span>Mye ({maks})</span>
                </div>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------------
// Sparkline til nøkkeltallkortene.
// --------------------------------------------------------------------------

export const Sparkline: React.FC<{ verdier: number[]; farge?: string }> = ({
    verdier,
    farge = SERIE_1,
}) => {
    if (verdier.length < 2 || !verdier.some((v) => v > 0)) return null;
    const maks = Math.max(1, ...verdier);
    const B = 100;
    const H = 24;
    const d = verdier
        .map((v, i) => {
            const x = (i / (verdier.length - 1)) * B;
            const y = H - (v / maks) * (H - 2) - 1;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');

    return (
        <svg viewBox={`0 0 ${B} ${H}`} className="h-6 w-full" preserveAspectRatio="none" aria-hidden="true">
            <path d={d} fill="none" stroke={farge} strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
};
