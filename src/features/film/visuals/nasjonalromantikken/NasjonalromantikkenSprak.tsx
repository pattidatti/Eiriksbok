import { AnimatePresence, motion } from 'framer-motion';
import { Check, ThumbsUp, X } from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Språkstriden. «dansk»: det danske skriftspråket føles fremmed, og veien deler seg.
 * «knudsen»: gradvishetens vei, trinn for trinn, b d g blir p t k. «munch»: de tre synene
 * side om side, og Munch som gir Aasen rett i problemet, men ikke i løsningen.
 */

type Modus = 'dansk' | 'knudsen' | 'munch';

const OVERSKRIFTER: Record<Modus, string[]> = {
    dansk: [
        'Folk skrev dansk',
        'Dansken føltes fremmed',
        'Hvordan lage et norsk skriftspråk?',
        'Tre veier',
    ],
    knudsen: [
        'Knud Knudsen',
        'Gradvishetens vei',
        'Skriv p, t, k som folk sier',
        'Rettskrivingen endres',
        'Riksmål, senere bokmål',
    ],
    munch: [
        'P. A. Munch, historiker',
        'Bygg om hele systemet',
        'Ros til Aasen, men',
        'Rett om problemet, ikke om løsningen',
    ],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 26 }}
            >
                <div className="px-5 py-2 rounded-2xl bg-white text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                    {tekst}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/** Et ark med grå tekstlinjer og en tittel. */
function Ark({ tittel, farge }: { tittel: string; farge: string }) {
    return (
        <div
            className="rounded-xl bg-[#fdfaf2] shadow-2xl px-6 py-5"
            style={{ width: 260, height: 300, border: `4px solid ${farge}` }}
        >
            <div className="font-display font-black text-2xl" style={{ color: farge }}>
                {tittel}
            </div>
            <div className="mt-4 flex flex-col gap-3">
                {[0.95, 0.8, 0.9, 0.7, 0.85, 0.6, 0.9].map((b, i) => (
                    <div
                        key={i}
                        className="rounded bg-slate-300"
                        style={{ height: 10, width: `${b * 100}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

function Dansk({ beat }: { beat: number }) {
    const delt = beat >= 2;
    const stempler = ['fremmed', 'stiv', 'unorsk'];
    const veier = [
        { navn: 'Aasen', farge: '#0f766e', y: 150, r: -14 },
        { navn: 'Knudsen', farge: '#1d4ed8', y: 275, r: 0 },
        { navn: 'Munch', farge: '#7c3aed', y: 400, r: 14 },
    ];
    return (
        <>
            <motion.div
                className="absolute"
                style={{ top: 140, left: 370 }}
                initial={false}
                animate={{ x: delt ? -250 : 0, scale: delt ? 0.85 : 1 }}
                transition={{ duration: 0.9 }}
            >
                <Ark tittel="Dansk skriftspråk" farge="#991b1b" />
                {beat >= 1 &&
                    stempler.map((s, i) => (
                        <motion.div
                            key={s}
                            className="absolute px-3 py-1 rounded-lg font-black text-3xl"
                            style={{
                                left: 30 + (i % 2) * 70,
                                top: 100 + i * 62,
                                color: '#b91c1c',
                                border: '4px solid #b91c1c',
                                background: '#fff7f7',
                            }}
                            initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: -8 + i * 6 }}
                            transition={{
                                delay: 0.3 + i * 0.5,
                                type: 'spring',
                                stiffness: 200,
                                damping: 14,
                            }}
                        >
                            {s}
                        </motion.div>
                    ))}
            </motion.div>
            {delt && (
                <svg
                    className="absolute"
                    style={{ left: 0, top: 0 }}
                    width={1000}
                    height={562}
                    viewBox="0 0 1000 562"
                >
                    {beat === 2 && (
                        <motion.text
                            x={640}
                            y={340}
                            textAnchor="middle"
                            fontSize={180}
                            fontWeight={900}
                            fill="#334155"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            ?
                        </motion.text>
                    )}
                    {beat >= 3 &&
                        veier.map((v, i) => (
                            <motion.path
                                key={v.navn}
                                d={`M 380 290 C 480 290, 520 ${v.y + 20}, 640 ${v.y + 20}`}
                                fill="none"
                                stroke={v.farge}
                                strokeWidth={12}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, delay: i * 0.5 }}
                            />
                        ))}
                </svg>
            )}
            {beat >= 3 &&
                veier.map((v, i) => (
                    <motion.div
                        key={v.navn}
                        className="absolute rounded-xl px-5 py-2 text-white font-display font-black text-3xl shadow-lg"
                        style={{ left: 660, top: v.y - 8, background: v.farge }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.5 }}
                    >
                        {v.navn}
                    </motion.div>
                ))}
        </>
    );
}

const AAR = ['1907', '1917', '1938'];

function Knudsen({ beat }: { beat: number }) {
    // Trappa: tre trinn fra dansk opp mot norsk.
    return (
        <>
            <div className="absolute" style={{ left: 40, top: 300 }}>
                <div
                    className="rounded-xl px-5 py-3 bg-[#fdfaf2] font-display font-black text-3xl text-red-800 shadow-lg"
                    style={{ border: '4px solid #991b1b' }}
                >
                    Dansk
                </div>
            </div>
            {AAR.map((a, i) => (
                <motion.div
                    key={a}
                    className="absolute rounded-t-lg flex items-start justify-center"
                    style={{
                        left: 230 + i * 170,
                        top: 390 - i * 80,
                        width: 160,
                        height: 120 + i * 80,
                        background: '#bfdbfe',
                        borderTop: '6px solid #1d4ed8',
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.35 }}
                >
                    {beat >= 3 && (
                        <motion.div
                            className="mt-3 font-display font-black text-3xl text-blue-900"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.6 }}
                        >
                            {a}
                        </motion.div>
                    )}
                </motion.div>
            ))}
            {beat === 0 && (
                <motion.div
                    className="absolute rounded-xl bg-white shadow-lg px-5 py-3 text-2xl font-bold text-slate-800"
                    style={{ left: 40, top: 110, width: 430 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Ikke alt på én gang: ett trinn om gangen
                </motion.div>
            )}
            {beat === 1 && (
                <motion.div
                    className="absolute rounded-xl bg-white shadow-lg px-5 py-3 text-2xl font-bold text-slate-800"
                    style={{ left: 40, top: 110, width: 430 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Stav slik folk med utdanning snakker til daglig
                </motion.div>
            )}
            {beat === 2 && (
                <motion.div
                    className="absolute flex gap-4"
                    style={{ left: 40, top: 110 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {[
                        ['b', 'p'],
                        ['d', 't'],
                        ['g', 'k'],
                    ].map(([fra, til], i) => (
                        <div
                            key={fra}
                            className="rounded-xl bg-white shadow-lg flex items-center justify-center gap-2"
                            style={{ width: 140, height: 110 }}
                        >
                            <span
                                className="font-display font-black text-slate-400"
                                style={{ fontSize: 52 }}
                            >
                                {fra}
                            </span>
                            <span className="text-3xl text-slate-500">→</span>
                            <motion.span
                                className="font-display font-black text-blue-700"
                                style={{ fontSize: 60 }}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    delay: 0.6 + i * 0.5,
                                    type: 'spring',
                                    stiffness: 220,
                                    damping: 14,
                                }}
                            >
                                {til}
                            </motion.span>
                        </div>
                    ))}
                </motion.div>
            )}
            {beat >= 4 && (
                <motion.div
                    className="absolute rounded-2xl px-6 py-4 shadow-2xl"
                    style={{ left: 560, top: 100, background: '#1d4ed8', whiteSpace: 'nowrap' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="font-display font-black text-3xl text-white">
                        Riksmål → bokmål
                    </div>
                    <div className="text-xl font-semibold text-blue-100 mt-1">
                        det de fleste skriver i dag
                    </div>
                </motion.div>
            )}
        </>
    );
}

const SYN = [
    { navn: 'Aasen', farge: '#0f766e', tekst: 'Nytt skriftspråk fra dialektene' },
    { navn: 'Knudsen', farge: '#1d4ed8', tekst: 'Endre dansken litt etter litt' },
];

function Munch({ beat }: { beat: number }) {
    return (
        <>
            {SYN.map((s, i) => {
                const aasenRost = i === 0 && beat >= 2;
                return (
                    <motion.div
                        key={s.navn}
                        className="absolute rounded-2xl bg-white shadow-xl px-5 py-4"
                        style={{
                            left: 40 + i * 300,
                            top: 120,
                            width: 270,
                            borderTop: `10px solid ${s.farge}`,
                        }}
                        initial={false}
                        animate={{ opacity: aasenRost ? 1 : 0.55, scale: aasenRost ? 1.04 : 1 }}
                    >
                        <div
                            className="font-display font-black text-3xl"
                            style={{ color: s.farge }}
                        >
                            {s.navn}
                        </div>
                        <div className="text-2xl font-semibold text-slate-700 mt-2 leading-snug">
                            {s.tekst}
                        </div>
                        {aasenRost && (
                            <motion.div
                                className="absolute -top-6 -right-5 rounded-full p-3 text-white shadow-lg"
                                style={{ background: '#7c3aed' }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                            >
                                <ThumbsUp size={34} />
                            </motion.div>
                        )}
                    </motion.div>
                );
            })}
            <motion.div
                className="absolute rounded-2xl bg-white shadow-2xl px-5 py-4"
                style={{ left: 650, top: 120, width: 310, borderTop: '10px solid #7c3aed' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                <div className="font-display font-black text-3xl text-violet-700">Munch</div>
                {beat >= 1 && (
                    <motion.div
                        className="mt-3 flex flex-col gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex items-center gap-2 text-2xl font-semibold text-slate-700">
                            <X size={30} className="text-red-600 shrink-0" /> Bytte noen ord
                        </div>
                        <div className="flex items-center gap-2 text-2xl font-semibold text-slate-700">
                            <Check size={30} className="text-teal-600 shrink-0" /> Bygge om alt
                        </div>
                    </motion.div>
                )}
                {beat >= 2 && (
                    <motion.div
                        className="mt-3 rounded-xl bg-violet-100 px-3 py-2 text-2xl font-bold text-violet-900"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        Mest for forskere
                    </motion.div>
                )}
            </motion.div>
            {beat >= 3 && (
                <motion.div
                    className="absolute inset-x-0 flex justify-center gap-6"
                    style={{ top: 430 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 rounded-2xl bg-teal-600 px-6 py-3 text-white font-display font-black text-3xl shadow-xl">
                        <Check size={36} /> Problemet
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-red-600 px-6 py-3 text-white font-display font-black text-3xl shadow-xl">
                        <X size={36} /> Løsningen
                    </div>
                </motion.div>
            )}
        </>
    );
}

export function NasjonalromantikkenSprak({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'dansk';
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    return (
        <Flate bakgrunn="linear-gradient(135deg, #f8fafc 0%, #eef2f7 60%, #fdf6e3 100%)">
            {modus === 'dansk' && <Dansk beat={beat} />}
            {modus === 'knudsen' && <Knudsen beat={beat} />}
            {modus === 'munch' && <Munch beat={beat} />}
            <Overskrift tekst={overskrift} />
        </Flate>
    );
}
