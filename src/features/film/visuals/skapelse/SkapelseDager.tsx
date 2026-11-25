import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * De seks dagene som tre par: tre tomme rom (dag 1-3) som fylles (dag 4-6).
 * Til høyre den sjuende dagen. I modus «bibel» blir den hellig. I modus «islam»
 * blir den strøket: ingen tretthet rørte Gud.
 */

const B = 1600;
const H = 900;
const BX = 260;
const BH = 230;
const X0 = 160;
const Y1 = 170;
const Y2 = 470;

function dagPos(d: number) {
    const kol = (d - 1) % 3;
    return { x: X0 + kol * (BX + 50), y: d <= 3 ? Y1 : Y2 };
}

/** Prikker som fyller et rom. Samme mønster for hvert rom, bare ulik farge. */
function Fyll({ farge, x, y, synlig }: { farge: string; x: number; y: number; synlig: boolean }) {
    return (
        <g>
            {Array.from({ length: 12 }, (_, i) => (
                <motion.circle
                    key={i}
                    cx={x + 40 + (i % 4) * 60}
                    cy={y + 70 + Math.floor(i / 4) * 52}
                    fill={farge}
                    initial={{ r: 0 }}
                    animate={{ r: synlig ? 16 : 0 }}
                    transition={{ delay: synlig ? i * 0.05 : 0 }}
                />
            ))}
        </g>
    );
}

const FARGER = ['#f59e0b', '#38bdf8', '#22c55e'];

export function SkapelseDager({ beat, props }: VisualProps<{ modus?: 'bibel' | 'islam' }>) {
    const islam = props.modus === 'islam';
    const visDager = islam || beat >= 1;
    // Mønsteret med tre par står bare i Bibelen. Islam-scenen viser seks vanlige dager.
    const visPar = !islam && beat >= 2;
    const visSju = islam || beat >= 3;
    const hellig = !islam && beat === 4;
    const strøket = islam && beat >= 3;
    // På beaten om mennesket viker rutene for kortet, så kortet ikke dekker dagene.
    const menneske = (!islam && beat >= 5) || (islam && beat >= 4);
    const sitat = islam && beat === 2;
    const skjulRuter = menneske || sitat;

    const tekst = islam
        ? [
              'Islam: også seks dager',
              'Bibelen: Gud hviler. Koranen: nei.',
              'Koranen 50,38',
              'Ingen hviledag',
              'Adam formet av leire: Guds forvalter',
          ][Math.min(beat, 4)]
        : [
              '1. Mosebok: jødedom og kristendom',
              'Seks dager',
              'Tre tomme rom, så fylles de',
              'Den sjuende dagen',
              'Jødedom: den hellige dagen',
              'Kristendom: skapt i Guds bilde',
          ][Math.min(beat, 5)];

    return (
        <div
            className="absolute inset-0"
            style={{
                background: islam
                    ? 'linear-gradient(180deg, #ecfdf5, #ccfbf1)'
                    : 'linear-gradient(180deg, #eef2ff, #e0f2fe)',
            }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {!visDager && (
                    <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        {/* En åpen bok */}
                        <path
                            d="M 800 300 C 700 260 560 260 480 290 L 480 640 C 560 610 700 610 800 650 Z"
                            fill="#fff"
                            stroke="#6366f1"
                            strokeWidth={8}
                        />
                        <path
                            d="M 800 300 C 900 260 1040 260 1120 290 L 1120 640 C 1040 610 900 610 800 650 Z"
                            fill="#fff"
                            stroke="#6366f1"
                            strokeWidth={8}
                        />
                        {[0, 1, 2, 3, 4].map((i) => (
                            <g key={i}>
                                <line
                                    x1={530}
                                    y1={350 + i * 55}
                                    x2={750}
                                    y2={340 + i * 55}
                                    stroke="#c7d2fe"
                                    strokeWidth={10}
                                    strokeLinecap="round"
                                />
                                <line
                                    x1={850}
                                    y1={340 + i * 55}
                                    x2={1070}
                                    y2={350 + i * 55}
                                    stroke="#c7d2fe"
                                    strokeWidth={10}
                                    strokeLinecap="round"
                                />
                            </g>
                        ))}
                        <text
                            x={640}
                            y={730}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#3b82f6"
                        >
                            Jødedom
                        </text>
                        <text
                            x={960}
                            y={730}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#6366f1"
                        >
                            Kristendom
                        </text>
                    </motion.g>
                )}
                {visDager &&
                    !skjulRuter &&
                    [1, 2, 3, 4, 5, 6].map((d) => {
                        const p = dagPos(d);
                        const par = (d - 1) % 3;
                        return (
                            <motion.g
                                key={d}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: islam ? 0 : d * 0.25 }}
                            >
                                <rect
                                    x={p.x}
                                    y={p.y}
                                    width={BX}
                                    height={BH}
                                    rx={24}
                                    fill="white"
                                    stroke={visPar ? FARGER[par] : islam ? '#10b981' : '#94a3b8'}
                                    strokeWidth={visPar || islam ? 8 : 4}
                                    strokeDasharray={visPar && d <= 3 ? '18 12' : undefined}
                                />
                                <text
                                    x={p.x + 24}
                                    y={p.y + 48}
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#334155"
                                >
                                    Dag {d}
                                </text>
                                {d >= 4 && (
                                    <Fyll farge={FARGER[par]} x={p.x} y={p.y} synlig={visPar} />
                                )}
                                {d <= 3 && visPar && (
                                    <text
                                        x={p.x + BX / 2}
                                        y={p.y + 150}
                                        textAnchor="middle"
                                        fontSize={32}
                                        fontWeight={700}
                                        fill="#94a3b8"
                                    >
                                        tomt rom
                                    </text>
                                )}
                            </motion.g>
                        );
                    })}
                {visPar &&
                    !menneske &&
                    [0, 1, 2].map((k) => {
                        const x = X0 + k * (BX + 50) + BX / 2;
                        return (
                            <motion.path
                                key={k}
                                d={`M ${x} ${Y1 + BH + 8} L ${x} ${Y2 - 12}`}
                                stroke={FARGER[k]}
                                strokeWidth={8}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.3 + k * 0.2 }}
                            />
                        );
                    })}
                {visPar && !menneske && (
                    <motion.text
                        x={X0 + 465}
                        y={Y2 + BH + 70}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#475569"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        dag 4-6 fyller rommene fra dag 1-3
                    </motion.text>
                )}
                {/* Islam: de seks dagene er bare seks dager, uten par og uten tomme rom */}
                {visDager && islam && !skjulRuter && (
                    <motion.text
                        x={X0 + 465}
                        y={Y2 + BH + 70}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#047857"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        seks dager: himlene og jorden
                    </motion.text>
                )}
                {visSju && (
                    <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}>
                        <rect
                            x={1150}
                            y={Y1}
                            width={300}
                            height={Y2 + BH - Y1}
                            rx={30}
                            fill={hellig ? '#fef3c7' : strøket ? '#f1f5f9' : 'white'}
                            stroke={hellig ? '#d97706' : strøket ? '#dc2626' : '#64748b'}
                            strokeWidth={hellig ? 12 : 6}
                        />
                        <text
                            x={1300}
                            y={Y1 + 70}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#334155"
                        >
                            Dag 7
                        </text>
                        <text
                            x={1300}
                            y={Y1 + (strøket ? 220 : 300)}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={800}
                            fill={hellig ? '#b45309' : '#475569'}
                        >
                            {islam ? (beat === 0 ? '?' : 'hvile?') : hellig ? 'hellig' : 'hvile'}
                        </text>
                        {strøket && (
                            <text
                                x={1300}
                                y={Y1 + 480}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={900}
                                fill="#dc2626"
                            >
                                ingen hviledag
                            </text>
                        )}
                        {hellig && (
                            <motion.circle
                                cx={1300}
                                cy={Y1 + 420}
                                r={60}
                                fill="#fbbf24"
                                initial={{ r: 0 }}
                                animate={{ r: 60 }}
                            />
                        )}
                        {/* Rødt kryss under ordet, ikke strek over det (lesbart på projektor) */}
                        {strøket && (
                            <motion.path
                                d={`M 1255 ${Y1 + 290} L 1345 ${Y1 + 380} M 1345 ${Y1 + 290} L 1255 ${Y1 + 380}`}
                                stroke="#dc2626"
                                strokeWidth={18}
                                strokeLinecap="round"
                                fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.6 }}
                            />
                        )}
                    </motion.g>
                )}
            </svg>
            {/* Mennesket: Guds bilde (kristendom) eller formet av leire (islam) */}
            {/* Kortet står der rutene var: venstre del av bildet, Dag 7 blir stående til høyre */}
            <div
                className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none"
                style={{ width: '69%', paddingTop: '6%' }}
            >
                <AnimatePresence>
                    {sitat && (
                        <motion.div
                            key="sitat"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-10 py-8 rounded-3xl bg-white shadow-2xl text-center"
                            style={{ maxWidth: '88%' }}
                        >
                            <div className="font-display font-black text-3xl md:text-5xl text-emerald-800 leading-tight">
                                «og ingen tretthet rørte Oss»
                            </div>
                            <div className="font-bold text-xl md:text-3xl text-slate-500 mt-3">
                                Koranen om de seks dagene
                            </div>
                        </motion.div>
                    )}
                    {menneske && (
                        <motion.div
                            key="menneske"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-10 py-8 rounded-3xl bg-white shadow-2xl text-center"
                        >
                            <div
                                className="mx-auto flex items-center justify-center rounded-full text-7xl"
                                style={{
                                    width: 120,
                                    height: 120,
                                    background: islam ? '#d6a46a' : '#e0e7ff',
                                }}
                            >
                                🧍
                            </div>
                            <div className="font-display font-black text-3xl md:text-5xl text-slate-900 mt-2">
                                {islam ? 'Adam av leire' : 'Skapt i Guds bilde'}
                            </div>
                            <div className="font-bold text-xl md:text-3xl text-slate-500 mt-1">
                                {islam ? 'Guds forvalter på jorda' : 'ansvar for jorda'}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
