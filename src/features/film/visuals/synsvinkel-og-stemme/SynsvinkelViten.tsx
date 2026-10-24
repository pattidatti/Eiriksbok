import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hva får leseren vite? Et rutenett med de tre linsene som kolonner og det vi kan få vite
 * som rader. «jeg» fyller kolonnen for personal synsvinkel, «gud» kolonnen for allvitende,
 * og «alle» viser dem side om side med hva slags sannhet hver linse gir.
 */

type Modus = 'jeg' | 'gud' | 'alle';
type Kol = 'jeg' | 'flue' | 'gud';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const RADER = ['Tankene til Jonas', 'Tankene til Anna', 'Det som skjer', 'Før og etter'];
const RAD_Y = [210, 315, 420, 525];
const RAD_H = 88;

const KOLONNER: { id: Kol; navn: string; farge: string; lys: string; x: number }[] = [
    { id: 'jeg', navn: 'Jeg', farge: '#6366f1', lys: '#e0e7ff', x: 690 },
    { id: 'flue', navn: 'Flue', farge: '#10b981', lys: '#d1fae5', x: 1030 },
    { id: 'gud', navn: 'Gud', farge: '#f59e0b', lys: '#fef3c7', x: 1370 },
];
const KOL_B = 310;

/** Svaret i hver rute. Tom streng = ingenting å vise. «nei» tegnes rødt. */
const SVAR: Record<Kol, { tekst: string; nei?: boolean }[]> = {
    jeg: [{ tekst: 'Alt' }, { tekst: 'Vet ikke', nei: true }, { tekst: 'Det han ser' }, { tekst: '' }],
    flue: [
        { tekst: 'Ingenting', nei: true },
        { tekst: 'Ingenting', nei: true },
        { tekst: 'Det vi ser' },
        { tekst: '' },
    ],
    gud: [{ tekst: 'Alt' }, { tekst: 'Alt' }, { tekst: 'Alt' }, { tekst: 'Fortid og framtid' }],
};

/** Hvor mange ruter som er fylt ut i hver kolonne, per beat. */
function fylt(modus: Modus, beat: number): Record<Kol, number> {
    if (modus === 'jeg') return { jeg: beat === 0 ? 1 : 3, flue: 0, gud: 0 };
    if (modus === 'gud') return { jeg: 3, flue: 3, gud: beat === 0 ? 2 : 4 };
    return { jeg: 3, flue: 3, gud: 4 };
}

function aktivKolonne(modus: Modus, beat: number): Kol | null {
    if (modus === 'jeg') return 'jeg';
    if (modus === 'gud') return 'gud';
    if (beat === 1) return 'jeg';
    if (beat === 2) return 'flue';
    if (beat === 3) return 'gud';
    return null;
}

interface Lapp {
    fraBeat: number;
    tekst: string;
    farge: string;
}

const LAPPER: Record<Modus, Lapp[]> = {
    jeg: [
        { fraBeat: 2, tekst: 'Stor nærhet', farge: '#6366f1' },
        { fraBeat: 3, tekst: 'Kan bli lurt', farge: '#dc2626' },
    ],
    gud: [
        { fraBeat: 2, tekst: 'Hopper og kommenterer', farge: '#b45309' },
        { fraBeat: 3, tekst: 'Stor frihet', farge: '#f59e0b' },
        { fraBeat: 3, tekst: 'Mer avstand', farge: '#475569' },
    ],
    alle: [],
};

const SANNHET: Record<Kol, string> = {
    jeg: 'Sterk og personlig',
    flue: 'Kald og saklig',
    gud: 'Stor oversikt',
};

export function SynsvinkelViten({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'jeg';
    const antall = fylt(modus, beat);
    const aktiv = aktivKolonne(modus, beat);
    const lapper = LAPPER[modus].filter((l) => beat >= l.fraBeat);
    const synligKolonne = (k: Kol) => modus !== 'jeg' || k === 'jeg';
    return (
        <div className="absolute inset-0 bg-slate-50">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <text x={80} y={110} fontSize={52} fontWeight={900} fill="#0f172a" style={FONT}>
                    Hva får vi vite?
                </text>
                {RADER.map((r, i) => (
                    <g key={r}>
                        <rect x={60} y={RAD_Y[i]} width={1480} height={RAD_H} rx={18} fill={i % 2 ? '#f1f5f9' : '#e2e8f0'} opacity={0.7} />
                        <text x={90} y={RAD_Y[i] + 56} fontSize={38} fontWeight={800} fill="#334155" style={FONT}>
                            {r}
                        </text>
                    </g>
                ))}
                {KOLONNER.map((k) => {
                    const vis = synligKolonne(k.id);
                    const dempet = aktiv !== null && aktiv !== k.id;
                    return (
                        <motion.g
                            key={k.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: vis ? (dempet ? 0.35 : 1) : 0.12 }}
                            transition={{ duration: 0.6 }}
                        >
                            <rect x={k.x - KOL_B / 2} y={130} width={KOL_B} height={64} rx={20} fill={k.farge} />
                            <text x={k.x} y={176} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff" style={FONT}>
                                {k.navn}
                            </text>
                            {SVAR[k.id].map((s, i) => {
                                const synlig = vis && i < antall[k.id] && s.tekst !== '';
                                return (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: synlig ? 1 : 0 }}
                                        transition={{ duration: 0.5, delay: synlig ? 0.2 + i * 0.25 : 0 }}
                                    >
                                        <rect
                                            x={k.x - KOL_B / 2 + 10}
                                            y={RAD_Y[i] + 10}
                                            width={KOL_B - 20}
                                            height={RAD_H - 20}
                                            rx={14}
                                            fill={s.nei ? '#fee2e2' : k.lys}
                                            stroke={s.nei ? '#dc2626' : k.farge}
                                            strokeWidth={4}
                                        />
                                        <text
                                            x={k.x}
                                            y={RAD_Y[i] + 56}
                                            textAnchor="middle"
                                            fontSize={s.tekst.length > 12 ? 30 : 36}
                                            fontWeight={900}
                                            fill={s.nei ? '#b91c1c' : '#0f172a'}
                                            style={FONT}
                                        >
                                            {s.tekst}
                                        </text>
                                    </motion.g>
                                );
                            })}
                            {modus === 'alle' && (
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: beat >= KOLONNER.indexOf(k) + 1 ? 1 : 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <rect x={k.x - KOL_B / 2} y={650} width={KOL_B} height={96} rx={22} fill={k.farge} />
                                    <text x={k.x} y={710} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff" style={FONT}>
                                        {SANNHET[k.id]}
                                    </text>
                                </motion.g>
                            )}
                        </motion.g>
                    );
                })}
                {modus === 'alle' && (
                    <text x={90} y={710} fontSize={38} fontWeight={800} fill="#334155" style={FONT}>
                        Sannheten blir
                    </text>
                )}
                <AnimatePresence>
                    {modus === 'alle' && beat >= 4 && (
                        <motion.g key="fasit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                            <rect x={450} y={775} width={700} height={90} rx={26} fill="#fcd34d" />
                            <text x={800} y={835} textAnchor="middle" fontSize={46} fontWeight={900} fill="#0f172a" style={FONT}>
                                Ingen fasit
                            </text>
                        </motion.g>
                    )}
                    {lapper.map((l, i) => (
                        <motion.g key={l.tekst} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 + i * 0.4 }}>
                            <rect x={90 + i * 490} y={680} width={450} height={100} rx={26} fill={l.farge} />
                            <text x={315 + i * 490} y={745} textAnchor="middle" fontSize={l.tekst.length > 14 ? 36 : 44} fontWeight={900} fill="#ffffff" style={FONT}>
                                {l.tekst}
                            </text>
                        </motion.g>
                    ))}
                </AnimatePresence>
            </svg>
        </div>
    );
}
