import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * De fire typene arbeidsledighet som kort. «typer»: kortene snus ett for ett. «medisin»: under
 * hvert kort kommer løsningen som hjelper akkurat den typen, som en resept fra legen.
 */

type Modus = 'typer' | 'medisin';

const MORK = '#0f172a';
const GRA = '#64748b';

interface Type {
    navn: string;
    linjer: [string, string];
    farge: string;
}

const TYPER: Type[] = [
    { navn: 'Friksjon', linjer: ['Mellom', 'to jobber'], farge: '#0891b2' },
    { navn: 'Sesong', linjer: ['Jobben finnes bare', 'deler av året'], farge: '#16a34a' },
    { navn: 'Konjunktur', linjer: ['Nedgangstider:', 'folk kjøper mindre'], farge: '#c2410c' },
    { navn: 'Struktur', linjer: ['Det du kan,', 'trengs ikke lenger'], farge: '#7c3aed' },
];

const XS = [230, 610, 990, 1370];
const B = 340;

/** Tegningen øverst på kortet, sentrert i (0, 0). */
function Ikon({ i, farge }: { i: number; farge: string }) {
    if (i === 0)
        return (
            <g>
                <rect x={-120} y={-60} width={60} height={110} rx={6} fill="#cbd5e1" />
                <rect x={60} y={-60} width={60} height={110} rx={6} fill={farge} />
                <circle cx={0} cy={-30} r={14} fill="#e8b48c" />
                <rect x={-14} y={-14} width={28} height={48} rx={12} fill={MORK} />
                <path d="M -40 70 L 40 70 M 22 58 L 40 70 L 22 82" stroke={farge} strokeWidth={7} fill="none" strokeLinecap="round" />
            </g>
        );
    if (i === 1)
        return (
            <g>
                {Array.from({ length: 12 }, (_, m) => (
                    <rect key={m} x={-138 + m * 23} y={-40} width={19} height={60} rx={4} fill={m >= 5 && m <= 7 ? farge : '#cbd5e1'} />
                ))}
                <path d="M -40 60 Q 0 30 40 60 Q 0 90 -40 60 Z M 40 60 L 62 44 L 62 76 Z" fill="#0ea5e9" />
            </g>
        );
    if (i === 2)
        return (
            <g>
                <line x1={-120} y1={70} x2={120} y2={70} stroke={GRA} strokeWidth={4} />
                <path d="M -110 -50 L -50 -30 L 0 10 L 50 30 L 110 60" stroke={farge} strokeWidth={9} fill="none" strokeLinecap="round" />
                <path d="M 110 60 L 84 60 M 110 60 L 104 36" stroke={farge} strokeWidth={9} strokeLinecap="round" />
            </g>
        );
    return (
        <g>
            <rect x={-50} y={-60} width={100} height={84} rx={14} fill="#a1a1aa" />
            <circle cx={-20} cy={-20} r={10} fill={farge} />
            <circle cx={20} cy={-20} r={10} fill={farge} />
            <line x1={0} y1={-60} x2={0} y2={-84} stroke="#71717a" strokeWidth={6} />
            <circle cx={0} cy={-88} r={8} fill={farge} />
            <rect x={-60} y={30} width={120} height={50} rx={10} fill="#a1a1aa" />
        </g>
    );
}

function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: forsinkelse }}>
            {children}
        </motion.g>
    );
}

function Typer({ beat }: { beat: number }) {
    return (
        <g>
            {TYPER.map((t, i) => {
                const vist = beat >= i + 1;
                const aktiv = beat === i + 1;
                const x = XS[i];
                return (
                    <motion.g key={t.navn} animate={{ opacity: vist && !aktiv && beat <= 4 ? 0.55 : 1 }}>
                        <rect
                            x={x - B / 2}
                            y={190}
                            width={B}
                            height={600}
                            rx={28}
                            fill={vist ? '#ffffff' : '#e2e8f0'}
                            stroke={vist ? t.farge : '#cbd5e1'}
                            strokeWidth={aktiv ? 9 : 5}
                        />
                        {!vist && (
                            <text x={x} y={540} textAnchor="middle" fontSize={140} fontWeight={900} fill="#94a3b8">
                                ?
                            </text>
                        )}
                        {vist && (
                            <Inn>
                                <g transform={`translate(${x} 340)`}>
                                    <Ikon i={i} farge={t.farge} />
                                </g>
                                <text x={x} y={520} textAnchor="middle" fontSize={46} fontWeight={900} fill={t.farge}>
                                    {t.navn}
                                </text>
                                <text x={x} y={565} textAnchor="middle" fontSize={26} fontWeight={700} fill={GRA}>
                                    -ledighet
                                </text>
                                <text x={x} y={650} textAnchor="middle" fontSize={28} fontWeight={700} fill={MORK}>
                                    {t.linjer[0]}
                                </text>
                                <text x={x} y={690} textAnchor="middle" fontSize={28} fontWeight={700} fill={MORK}>
                                    {t.linjer[1]}
                                </text>
                            </Inn>
                        )}
                    </motion.g>
                );
            })}
        </g>
    );
}

/** Løsningen under hvert kort: én linje per rad, og linjer som strykes. */
interface Rad {
    tekst: string;
    fraBeat: number;
    strøket?: boolean;
    sterk?: boolean;
}

const LOSNING: (Rad[] | null)[] = [
    [
        { tekst: 'Hjelp folk og', fraBeat: 1, sterk: true },
        { tekst: 'ledige jobber', fraBeat: 1, sterk: true },
        { tekst: 'å finne hverandre', fraBeat: 1, sterk: true },
    ],
    null,
    [
        { tekst: 'Norges Bank:', fraBeat: 2 },
        { tekst: 'renten ned', fraBeat: 2, sterk: true },
        { tekst: '→ billigere å låne', fraBeat: 2 },
        { tekst: '→ folk kjøper mer', fraBeat: 2 },
        { tekst: '→ flere ansatte', fraBeat: 2 },
        { tekst: 'Staten bygger', fraBeat: 3, sterk: true },
        { tekst: 'veier og skoler', fraBeat: 3, sterk: true },
    ],
    [
        { tekst: 'Lavere rente', fraBeat: 4, strøket: true },
        { tekst: 'Kurs og', fraBeat: 4, sterk: true },
        { tekst: 'ny utdanning', fraBeat: 4, sterk: true },
    ],
];

function Medisin({ beat }: { beat: number }) {
    return (
        <g>
            {TYPER.map((t, i) => {
                const x = XS[i];
                const rader = LOSNING[i];
                const aktiv = rader ? rader.some((r) => r.fraBeat === beat) : false;
                const harLosning = rader ? rader.some((r) => r.fraBeat <= beat) : false;
                return (
                    <motion.g key={t.navn} animate={{ opacity: rader ? 1 : 0.35 }}>
                        <rect x={x - B / 2} y={170} width={B} height={260} rx={24} fill="#ffffff" stroke={t.farge} strokeWidth={5} />
                        <g transform={`translate(${x} 280) scale(0.75)`}>
                            <Ikon i={i} farge={t.farge} />
                        </g>
                        <text x={x} y={405} textAnchor="middle" fontSize={40} fontWeight={900} fill={t.farge}>
                            {t.navn}
                        </text>
                        <rect
                            x={x - B / 2}
                            y={460}
                            width={B}
                            height={400}
                            rx={24}
                            fill={harLosning ? '#f0fdfa' : '#f1f5f9'}
                            stroke={aktiv ? '#0d9488' : '#cbd5e1'}
                            strokeWidth={aktiv ? 7 : 3}
                        />
                        {!rader && (
                            <text x={x} y={680} textAnchor="middle" fontSize={28} fontWeight={700} fill={GRA}>
                                ikke med her
                            </text>
                        )}
                        {!harLosning && rader && (
                            <text x={x} y={690} textAnchor="middle" fontSize={90} fontWeight={900} fill="#cbd5e1">
                                ?
                            </text>
                        )}
                        <AnimatePresence>
                            {rader
                                ?.filter((r) => r.fraBeat <= beat)
                                .map((r, j) => {
                                    const y = 520 + j * 46;
                                    return (
                                        <Inn key={r.tekst} forsinkelse={r.fraBeat === beat ? 0.3 + j * 0.35 : 0}>
                                            <text
                                                x={x}
                                                y={y}
                                                textAnchor="middle"
                                                fontSize={29}
                                                fontWeight={r.sterk ? 800 : 600}
                                                fill={r.strøket ? '#dc2626' : r.sterk ? '#0f766e' : MORK}
                                            >
                                                {r.tekst}
                                            </text>
                                            {r.strøket && <line x1={x - 95} y1={y - 10} x2={x + 95} y2={y - 10} stroke="#dc2626" strokeWidth={5} />}
                                        </Inn>
                                    );
                                })}
                        </AnimatePresence>
                    </motion.g>
                );
            })}
        </g>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    typer: ['Fire typer arbeidsledighet', '1. Friksjonsledighet', '2. Sesongledighet', '3. Konjunkturledighet', '4. Strukturledighet'],
    medisin: [
        'Hver type sin egen medisin',
        'Mellom to jobber: hjelp til å finne jobb',
        'Nedgangstider: lavere rente',
        'Nedgangstider: staten bruker mer',
        'Jobben er borte: ny utdanning',
    ],
};

export function ArbeidsledighetFire({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'typer';
    const linjer = OVERSKRIFT[modus];
    const tittel = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            <AnimatePresence mode="wait">
                <motion.text
                    key={tittel}
                    x={800}
                    y={100}
                    textAnchor="middle"
                    fontSize={60}
                    fontWeight={800}
                    fill={MORK}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {tittel}
                </motion.text>
            </AnimatePresence>
            {modus === 'typer' ? <Typer beat={beat} /> : <Medisin beat={beat} />}
        </svg>
    );
}
