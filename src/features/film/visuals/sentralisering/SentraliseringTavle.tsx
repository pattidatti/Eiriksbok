import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Tavla: forklaringer tegnet som enkle skisser på en flate på 1000x562.
 * tettsted: husene samles og sprer seg, og hva et tettsted er.
 * klasser: SSBs seks sentralitetsklasser, med andelen som bor i tettsted i klasse 1 og 6.
 * uenige: regjeringens argumenter og hva partiene mente om målet.
 */

type Modus = 'tettsted' | 'klasser' | 'uenige';

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function Husikon({ farge = '#a32626', s = 1 }: { farge?: string; s?: number }) {
    return (
        <g transform={`scale(${s})`}>
            <rect x={-9} y={-6} width={18} height={14} fill={farge} rx={1} />
            <path d="M-12,-5 L0,-15 L12,-5 Z" fill="#334155" />
            <rect x={-3} y={0} width={6} height={8} fill="#fde68a" />
        </g>
    );
}

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 flex justify-center"
                style={{ top: 22 }}
            >
                <div className="rounded-2xl bg-white px-5 py-2 text-3xl font-display font-black text-slate-900 shadow-lg whitespace-nowrap">
                    {tekst}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ---------- tettsted ---------- */

const N_HUS = 26;

function Tettsted({ beat }: { beat: number }) {
    const hus = useMemo(
        () =>
            Array.from({ length: N_HUS }, (_, i) => {
                const spredtX = 80 + frø(i) * 840;
                const spredtY = 140 + frø(i + 40) * 380;
                const kol = i % 7;
                const rad = Math.floor(i / 7);
                const samletX = 380 + kol * 40 + (rad % 2) * 18;
                const samletY = 250 + rad * 42;
                return { spredtX, spredtY, samletX, samletY };
            }),
        []
    );
    const samlet = beat === 0 || beat >= 2;
    const titler = [
        'Sentralisering: folk samles på ett sted',
        'Desentralisering: folk sprer seg utover',
        'Tettsted: minst 200 mennesker bor tett',
        'Vanligvis høyst 50 meter mellom husene',
    ];
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {beat >= 2 && (
                    <motion.rect
                        x={340}
                        y={200}
                        width={340}
                        height={200}
                        rx={60}
                        fill="#dbeafe"
                        stroke="#2563eb"
                        strokeWidth={4}
                        strokeDasharray="14 10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                )}
                {hus.map((h, i) => (
                    <motion.g
                        key={i}
                        initial={{ x: h.spredtX, y: h.spredtY }}
                        animate={{
                            x: samlet ? h.samletX : h.spredtX,
                            y: samlet ? h.samletY : h.spredtY,
                            opacity: beat === 3 ? 0.35 : 1,
                        }}
                        transition={{
                            duration: 2.2,
                            delay: beat === 0 ? 0.6 + frø(i + 7) * 0.8 : frø(i + 7) * 0.6,
                            ease: 'easeInOut',
                        }}
                    >
                        <Husikon s={1.3} />
                    </motion.g>
                ))}
                {beat === 3 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <g transform="translate(350,480)">
                            <Husikon s={3} />
                        </g>
                        <g transform="translate(650,480)">
                            <Husikon s={3} />
                        </g>
                        <line
                            x1={395}
                            y1={512}
                            x2={605}
                            y2={512}
                            stroke="#dc2626"
                            strokeWidth={6}
                        />
                        <line
                            x1={395}
                            y1={498}
                            x2={395}
                            y2={526}
                            stroke="#dc2626"
                            strokeWidth={6}
                        />
                        <line
                            x1={605}
                            y1={498}
                            x2={605}
                            y2={526}
                            stroke="#dc2626"
                            strokeWidth={6}
                        />
                    </motion.g>
                )}
            </svg>
            {beat === 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute rounded-2xl bg-blue-600 px-5 py-2 text-3xl font-black text-white shadow-lg"
                    style={{ left: 700, top: 270 }}
                >
                    minst 200
                    <div className="text-xl font-bold">mennesker</div>
                </motion.div>
            )}
            {beat === 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="absolute rounded-2xl bg-red-600 px-4 py-1 text-2xl font-black text-white shadow-lg whitespace-nowrap"
                    style={{ left: 418, top: 452 }}
                >
                    vanligvis høyst 50 meter
                </motion.div>
            )}
            <Overskrift tekst={titler[Math.min(beat, 3)]} />
        </>
    );
}

/* ---------- klasser ---------- */

/** Skisse: tettheten av hus synker fra klasse 1 til 6. Bare 96 og 52 prosent er ekte tall. */
const HUS_PER_KLASSE = [14, 10, 7, 5, 3, 2];

function Klasser({ beat }: { beat: number }) {
    const titler = [
        'Seks klasser: hvor langt er det til jobb og butikk?',
        'Klasse 1: hvor mange bor i et tettsted?',
        'Klasse 6: hvor mange bor i et tettsted?',
        'Ingen i Europa har så få i storbyer',
    ];
    const bredde = 140;
    const x0 = 500 - (bredde * 6 + 20 * 5) / 2;
    return (
        <>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {HUS_PER_KLASSE.map((n, k) => {
                    const x = x0 + k * (bredde + 20);
                    const fremhevet = (beat === 1 && k === 0) || (beat === 2 && k === 5);
                    const dempet = (beat === 1 && k !== 0) || (beat === 2 && k !== 5);
                    return (
                        <motion.g
                            key={k}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: dempet ? 0.3 : 1 }}
                            transition={{ delay: beat === 0 ? 0.2 + k * 0.25 : 0 }}
                        >
                            <rect
                                x={x}
                                y={110}
                                width={bredde}
                                height={200}
                                rx={18}
                                fill={fremhevet ? '#fff7ed' : '#ffffff'}
                                stroke={fremhevet ? '#ea580c' : '#cbd5e1'}
                                strokeWidth={fremhevet ? 5 : 2}
                            />
                            {Array.from({ length: n }, (_, i) => (
                                <g
                                    key={i}
                                    transform={`translate(${x + 22 + (i % 4) * 32},${150 + Math.floor(i / 4) * 36})`}
                                >
                                    <Husikon s={1} />
                                </g>
                            ))}
                            <text
                                x={x + bredde / 2}
                                y={296}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                {k + 1}
                            </text>
                        </motion.g>
                    );
                })}
                <text x={x0} y={346} fontSize={22} fontWeight={700} fill="#475569">
                    mest sentrale
                </text>
                <text
                    x={x0 + 6 * bredde + 100}
                    y={346}
                    fontSize={22}
                    fontWeight={700}
                    fill="#475569"
                    textAnchor="end"
                >
                    minst sentrale
                </text>
            </svg>
            {(beat === 1 || beat === 2) && (
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute rounded-3xl bg-white px-7 py-4 shadow-2xl"
                    style={{ left: beat === 1 ? 70 : 500, top: 380, width: 430 }}
                >
                    <div className="text-2xl font-bold text-slate-600">
                        {beat === 1 ? 'Klasse 1, som Oslo og Bærum' : 'Klasse 6'}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                        <div
                            className="relative rounded-full bg-slate-200"
                            style={{ width: 220, height: 26 }}
                        >
                            <motion.div
                                className="absolute left-0 top-0 h-full rounded-full"
                                style={{ background: beat === 1 ? '#2563eb' : '#ea580c' }}
                                initial={{ width: 0 }}
                                animate={{ width: (beat === 1 ? 0.96 : 0.52) * 220 }}
                                transition={{ delay: 0.5, duration: 1.2 }}
                            />
                        </div>
                        <span className="text-5xl font-black text-slate-900">
                            {beat === 1 ? '96 %' : '52 %'}
                        </span>
                    </div>
                </motion.div>
            )}
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 390 }}
                >
                    <div className="rounded-3xl bg-slate-900 px-8 py-4 text-center text-white shadow-2xl">
                        <div className="text-3xl font-black">
                            Norge har fortsatt mange små steder
                        </div>
                        <div className="text-2xl font-semibold text-slate-300">
                            færrest som bor i storbyer av alle land i Europa
                        </div>
                    </div>
                </motion.div>
            )}
            <Overskrift tekst={titler[Math.min(beat, 3)]} />
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 400 }}
                >
                    <div className="rounded-2xl bg-white px-6 py-3 text-2xl font-bold text-slate-700 shadow-lg">
                        Sentralitetsindeksen fra SSB
                    </div>
                </motion.div>
            )}
        </>
    );
}

/* ---------- uenige ---------- */

const PARTIER = [
    {
        fra: 2,
        navn: 'Fremskrittspartiet',
        mener: 'Målet om at folketallet i distriktene skal øke, er urealistisk',
        farge: '#1e40af',
    },
    {
        fra: 3,
        navn: 'Sosialistisk Venstreparti',
        mener: 'Bra mål, men tiltakene er ikke sterke nok',
        farge: '#be123c',
    },
    {
        fra: 4,
        navn: 'Arbeiderpartiet og Senterpartiet',
        mener: 'Riktig politikk kan gjøre en stor forskjell',
        farge: '#15803d',
    },
];

function Uenige({ beat }: { beat: number }) {
    if (beat >= 5) {
        return (
            <>
                <div
                    className="absolute inset-x-0 flex items-center justify-center gap-6"
                    style={{ top: 170 }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-3xl bg-white px-6 py-5 text-center shadow-2xl"
                        style={{ width: 300 }}
                    >
                        <svg
                            viewBox="0 0 120 80"
                            style={{ width: 160, height: 100 }}
                            className="mx-auto"
                        >
                            {[10, 30, 50, 70, 90].map((x, i) => (
                                <rect
                                    key={x}
                                    x={x}
                                    y={80 - (30 + ((i * 17) % 40))}
                                    width={16}
                                    height={30 + ((i * 17) % 40)}
                                    fill="#64748b"
                                />
                            ))}
                        </svg>
                        <div className="text-4xl font-black text-slate-900">Sentrum</div>
                        <div className="text-2xl font-semibold text-slate-600">de store byene</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-6xl font-black text-red-600"
                    >
                        mot
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-3xl bg-white px-6 py-5 text-center shadow-2xl"
                        style={{ width: 300 }}
                    >
                        <svg
                            viewBox="-60 -40 120 80"
                            style={{ width: 160, height: 100 }}
                            className="mx-auto"
                        >
                            <g transform="translate(-30,10)">
                                <Husikon s={1.6} />
                            </g>
                            <g transform="translate(30,20)">
                                <Husikon s={1.3} farge="#c08a2e" />
                            </g>
                        </svg>
                        <div className="text-4xl font-black text-slate-900">Periferi</div>
                        <div className="text-2xl font-semibold text-slate-600">langt fra byene</div>
                    </motion.div>
                </div>
                <Overskrift tekst="En gammel konflikt i norsk politikk" />
            </>
        );
    }
    return (
        <>
            <motion.div
                className="absolute rounded-3xl bg-white shadow-2xl px-7 py-5"
                style={{ left: 40, top: 100, width: 400 }}
                animate={{ opacity: beat >= 2 ? 0.55 : 1 }}
            >
                <div className="text-xl font-bold text-slate-500">Regjeringen, 2023</div>
                <div className="text-3xl font-black text-slate-900 leading-tight mt-1">
                    Det er en verdi i seg selv at det bor folk i hele landet
                </div>
                {beat >= 1 && (
                    <div className="mt-4 flex flex-col gap-3">
                        {[
                            { t: 'Beredskap', u: 'trygt i en krise eller krig' },
                            { t: 'Naturressurser', u: 'spredt over hele landet' },
                        ].map((a, i) => (
                            <motion.div
                                key={a.t}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 1.6 }}
                                className="rounded-2xl bg-amber-100 px-4 py-2"
                            >
                                <div className="text-2xl font-black text-amber-900">{a.t}</div>
                                <div className="text-2xl font-semibold text-amber-950">{a.u}</div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
            <div
                className="absolute flex flex-col gap-4"
                style={{ left: 480, top: 100, width: 480 }}
            >
                {PARTIER.map((p) =>
                    beat >= p.fra ? (
                        <motion.div
                            key={p.navn}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-3xl bg-white px-6 py-3 shadow-xl"
                            style={{ borderLeft: `10px solid ${p.farge}` }}
                        >
                            <div className="text-2xl font-black" style={{ color: p.farge }}>
                                {p.navn}
                            </div>
                            <div className="text-2xl font-semibold text-slate-800 leading-snug">
                                {p.mener}
                            </div>
                        </motion.div>
                    ) : null
                )}
            </div>
            <Overskrift tekst={beat >= 2 ? 'Hva mente partiene?' : 'Hvorfor bo i hele landet?'} />
        </>
    );
}

export function SentraliseringTavle({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'tettsted';
    return (
        <Flate bakgrunn="linear-gradient(160deg, #f8fafc 0%, #eef2f7 60%, #fdf6e9 100%)">
            {modus === 'tettsted' && <Tettsted beat={beat} />}
            {modus === 'klasser' && <Klasser beat={beat} />}
            {modus === 'uenige' && <Uenige beat={beat} />}
        </Flate>
    );
}
