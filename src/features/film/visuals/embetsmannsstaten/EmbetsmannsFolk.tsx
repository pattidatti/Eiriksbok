import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';
import { BLEKK, BONDE, EMBETSMANN, KONGE, ROD } from './farger';
import { Figur, Lapp, type FigurType } from './figurer';

/**
 * Menneskene i embetsmannsstaten som flate figurer. Tre moduser:
 * «hvem» (fire slags embetsmenn, hvor få de var, og at de var kongens folk),
 * «hvorfor» (adelen, kjøpmennene og embetsmennene i 1814) og
 * «stemmerett» (hvem som fikk stemme etter Grunnloven, og hvem som sto utenfor).
 */

type Modus = 'hvem' | 'hvorfor' | 'stemmerett';

const BAKGRUNN = 'bg-gradient-to-br from-amber-50 via-white to-slate-100';

function Overskrift({ tekst, y = 128 }: { tekst: string; y?: number }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                x={800}
                y={y}
                textAnchor="middle"
                fontSize={58}
                fontWeight={900}
                fill={BLEKK}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

function Krone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -60 30 L -60 -20 L -30 5 L 0 -40 L 30 5 L 60 -20 L 60 30 Z" fill={KONGE} />
            <rect x={-64} y={28} width={128} height={18} rx={6} fill="#a16207" />
        </g>
    );
}

/* ---------- hvem ---------- */

const EMBETER: { type: FigurType; lapp: string; fraBeat: number }[] = [
    { type: 'prest', lapp: 'Prest\neller biskop', fraBeat: 1 },
    { type: 'offiser', lapp: 'Offiser\ni hæren', fraBeat: 2 },
    { type: 'dommer', lapp: 'Sorenskriver\n(dommer)', fraBeat: 3 },
    { type: 'amtmann', lapp: 'Amtmann\n(som statsforvalter)', fraBeat: 3 },
];

function Hvem({ beat }: { beat: number }) {
    const tittel =
        beat === 0 ? 'En fast og viktig jobb i staten' : beat === 5 ? 'Kongens folk' : 'Embetsmennene';
    return (
        <>
            <Overskrift tekst={tittel} />
            {EMBETER.map((e, i) => {
                const x = 260 + i * 360;
                const vist = beat >= e.fraBeat;
                const fokus = beat === e.fraBeat || (beat === 3 && e.fraBeat === 3);
                return (
                    <g key={e.type} transform={`translate(${x} 0)`}>
                        <motion.rect
                            x={-165}
                            y={170}
                            width={330}
                            height={470}
                            rx={28}
                            fill="#ffffff"
                            stroke={fokus ? EMBETSMANN : '#e2e8f0'}
                            strokeWidth={fokus ? 8 : 3}
                            animate={{ opacity: 1 }}
                        />
                        <g transform="translate(0 520)">
                            <AnimatePresence mode="wait">
                                <motion.g
                                    key={vist ? e.type : 'skygge'}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Figur type={vist ? e.type : 'skygge'} />
                                    {!vist && (
                                        <text y={-140} textAnchor="middle" fontSize={70} fontWeight={900} fill="#94a3b8">
                                            ?
                                        </text>
                                    )}
                                </motion.g>
                            </AnimatePresence>
                        </g>
                        {vist && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                <Lapp tekst={e.lapp} y={572} storrelse={30} />
                            </motion.g>
                        )}
                    </g>
                );
            })}
            <AnimatePresence mode="wait">
                {beat === 4 && (
                    <motion.g key="fa" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <rect x={120} y={680} width={1360} height={180} rx={30} fill={EMBETSMANN} />
                        <text x={330} y={772} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff">
                            <TelleTall verdi={1900} />
                        </text>
                        <text x={330} y={826} textAnchor="middle" fontSize={30} fontWeight={700} fill="#c7d2fe">
                            i 1825
                        </text>
                        <text x={640} y={772} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff">
                            <TelleTall verdi={2300} forsinkelse={1.2} />
                        </text>
                        <text x={640} y={826} textAnchor="middle" fontSize={30} fontWeight={700} fill="#c7d2fe">
                            i 1875
                        </text>
                        <line x1={820} y1={710} x2={820} y2={830} stroke="#93c5fd" strokeWidth={3} />
                        {['jus', 'teologi', 'krigsskolen'].map((t, i) => (
                            <motion.g
                                key={t}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2 + i * 0.6 }}
                            >
                                <rect x={860 + i * 205} y={738} width={196} height={64} rx={32} fill="#fff" />
                                <text x={958 + i * 205} y={781} textAnchor="middle" fontSize={28} fontWeight={800} fill={EMBETSMANN}>
                                    {t}
                                </text>
                            </motion.g>
                        ))}
                    </motion.g>
                )}
                {beat === 5 && (
                    <motion.g key="konge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Krone x={800} y={770} s={1} />
                        {EMBETER.map((_, i) => (
                            <motion.line
                                key={i}
                                x1={800}
                                y1={740}
                                x2={260 + i * 360}
                                y2={650}
                                stroke={KONGE}
                                strokeWidth={6}
                                strokeDasharray="12 10"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.4 + i * 0.2, duration: 0.8 }}
                            />
                        ))}
                        <text x={1010} y={790} fontSize={36} fontWeight={800} fill={BLEKK}>
                            Kongen i København
                        </text>
                        <text x={590} y={790} textAnchor="end" fontSize={36} fontWeight={800} fill={BLEKK}>
                            Folk måtte adlyde
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- hvorfor ---------- */

const GRUPPER: { navn: string; typer: FigurType[]; dom: string; domBeat: number; farge: string }[] = [
    { navn: 'Adelen', typer: ['adel', 'adel', 'adel'], dom: 'Nesten borte\netter 1600-tallet', domBeat: 1, farge: ROD },
    { navn: 'Kjøpmenn og\nfabrikkeiere', typer: ['kjopmann', 'kjopmann'], dom: 'For få og\nfor svake', domBeat: 2, farge: ROD },
    { navn: 'Embetsmennene', typer: ['prest', 'dommer', 'offiser'], dom: 'Vant til\nå styre', domBeat: 3, farge: BONDE },
];

function Hvorfor({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift tekst={beat >= 3 ? 'Igjen sto embetsmennene' : '1814: Hvem skal lede Norge?'} />
            {GRUPPER.map((g, gi) => {
                const x = 300 + gi * 500;
                const ute = gi < 2 && beat >= g.domBeat;
                const vinner = gi === 2 && beat >= 3;
                return (
                    <g key={g.navn} transform={`translate(${x} 0)`}>
                        <motion.rect
                            x={-200}
                            width={400}
                            rx={16}
                            fill={vinner ? KONGE : '#cbd5e1'}
                            initial={false}
                            animate={{ y: vinner ? 560 : 600, height: vinner ? 80 : 40 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        />
                        <motion.g
                            initial={false}
                            animate={{ opacity: ute ? 0.18 : 1, y: vinner ? -40 : 0 }}
                            transition={{ duration: 0.9 }}
                        >
                            {g.typer.map((t, i) => {
                                const fx = (i - (g.typer.length - 1) / 2) * 110;
                                return (
                                    <g key={i} transform={`translate(${fx} 600) scale(0.95)`}>
                                        <Figur type={t} />
                                    </g>
                                );
                            })}
                        </motion.g>
                        <Lapp tekst={g.navn} y={690} storrelse={36} />
                        <AnimatePresence>
                            {beat >= g.domBeat && (
                                <motion.g
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ transformOrigin: `${x}px 300px` }}
                                >
                                    <rect x={-170} y={250} width={340} height={110} rx={22} fill={g.farge} />
                                    {g.dom.split('\n').map((l, i) => (
                                        <text key={i} y={296 + i * 40} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                                            {l}
                                        </text>
                                    ))}
                                </motion.g>
                            )}
                        </AnimatePresence>
                    </g>
                );
            })}
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <rect x={560} y={150} width={760} height={90} rx={45} fill="#fff" stroke={EMBETSMANN} strokeWidth={5} />
                        <path d="M 1240 236 L 1280 260 L 1200 236 Z" fill={EMBETSMANN} />
                        <text x={940} y={210} textAnchor="middle" fontSize={42} fontWeight={900} fill={EMBETSMANN}>
                            «Landets bedste Mænd»
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------- stemmerett ---------- */

const FOLK: { type: FigurType; lapp: string; stemme: boolean }[] = [
    { type: 'amtmann', lapp: 'Embets-\nmann', stemme: true },
    { type: 'bonde', lapp: 'Bonde\nmed jord', stemme: true },
    { type: 'borger', lapp: 'Borger\ni byen', stemme: true },
    { type: 'kvinne', lapp: 'Kvinne', stemme: false },
    { type: 'husmann', lapp: 'Husmann', stemme: false },
    { type: 'tjeneste', lapp: 'Tjeneste-\nfolk', stemme: false },
    { type: 'arbeider', lapp: 'Arbeider', stemme: false },
];

function plass(i: number, beat: number) {
    if (beat === 0) return { x: 170 + i * 210, opacity: 1 };
    const f = FOLK[i];
    if (f.stemme) return { x: 170 + i * 220, opacity: 1 };
    return { x: 930 + (i - 3) * 175, opacity: beat >= 2 ? 1 : 0.3 };
}

function Stemmerett({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift tekst="Hvem fikk stemme?" y={120} />
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.g key="ja" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect x={40} y={170} width={720} height={680} rx={30} fill="#f0fdf4" stroke={BONDE} strokeWidth={6} />
                        <text x={400} y={240} textAnchor="middle" fontSize={44} fontWeight={900} fill={BONDE}>
                            Fikk stemme
                        </text>
                    </motion.g>
                )}
                {beat >= 2 && (
                    <motion.g key="nei" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect x={810} y={170} width={750} height={680} rx={30} fill="#fef2f2" stroke={ROD} strokeWidth={6} />
                        <text x={1185} y={240} textAnchor="middle" fontSize={44} fontWeight={900} fill={ROD}>
                            Sto utenfor
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {FOLK.map((f, i) => {
                const p = plass(i, beat);
                return (
                    <motion.g
                        key={f.type}
                        initial={false}
                        animate={{ x: p.x, opacity: p.opacity }}
                        transition={{ type: 'spring', stiffness: 70, damping: 16, delay: (i % 4) * 0.15 }}
                    >
                        <g transform="translate(0 610) scale(0.95)">
                            <Figur type={f.type} />
                        </g>
                        <Lapp tekst={f.lapp} y={668} storrelse={32} />
                        {!f.stemme && beat >= 2 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 1.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + (i - 3) * 0.25 }}
                                style={{ transformOrigin: '0px 330px' }}
                            >
                                <circle cx={0} cy={330} r={34} fill={ROD} />
                                <path d="M -14 316 L 14 344 M 14 316 L -14 344" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
                            </motion.g>
                        )}
                        {f.stemme && beat >= 1 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 1.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + i * 0.25 }}
                                style={{ transformOrigin: '0px 330px' }}
                            >
                                <circle cx={0} cy={330} r={34} fill={BONDE} />
                                <path d="M -14 330 L -3 342 L 15 318" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                            </motion.g>
                        )}
                    </motion.g>
                );
            })}
        </>
    );
}

export function EmbetsmannsFolk({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'hvem';
    return (
        <div className={`absolute inset-0 ${BAKGRUNN}`}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'hvem' && <Hvem beat={beat} />}
                {modus === 'hvorfor' && <Hvorfor beat={beat} />}
                {modus === 'stemmerett' && <Stemmerett beat={beat} />}
            </svg>
        </div>
    );
}
