import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Hammer, HeartHandshake, RotateCcw, Sparkles, Sun } from 'lucide-react';

interface DraapenIHavetProps {
    title?: string;
}

type Fase = 'venter' | 'klar' | 'naade' | 'forent';

interface Vane {
    id: string;
    navn: string;
    undertekst: string;
    ikon: typeof Sparkles;
    kvittering: string;
}

const VANER: Vane[] = [
    {
        id: 'nam',
        navn: 'Nam simaran',
        undertekst: 'Å holde Guds navn i tankene',
        ikon: Sparkles,
        kvittering:
            'Nam simaran er å meditere over det hellige Navnet. Sikhene mener det gjør mennesket gradvis mindre opptatt av seg selv.',
    },
    {
        id: 'seva',
        navn: 'Seva',
        undertekst: 'Tjeneste for andre uten å vente noe igjen',
        ikon: HeartHandshake,
        kvittering:
            'Seva er tjeneste. Den skal gjøres uten ønske om lønn og uten baktanker. Arbeid med kroppen, som i fellesskjøkkenet, regnes som den fremste formen.',
    },
    {
        id: 'kirat',
        navn: 'Kirat karo',
        undertekst: 'Ærlig arbeid i et helt vanlig liv',
        ikon: Hammer,
        kvittering:
            'Kirat er ærlig arbeid. Sikhismen krever ikke at du forlater familie og jobb. Veien går midt gjennom hverdagen.',
    },
];

const RING_RADIUS = 44;
const SEGMENTER: Array<[number, number]> = [
    [-85, 25],
    [35, 145],
    [155, 265],
];

const DROPPE_FARGER = ['#cbd5e1', '#bae6fd', '#7dd3fc', '#38bdf8'];
const NIVAA_Y = [0, 22, 44, 66];
const MERGE_Y = 118;

function punkt(grader: number, radius: number): [number, number] {
    const rad = (grader * Math.PI) / 180;
    return [radius * Math.cos(rad), radius * Math.sin(rad)];
}

function bue(fra: number, til: number, radius: number): string {
    const [x1, y1] = punkt(fra, radius);
    const [x2, y2] = punkt(til, radius);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function DraapenIHavet({ title = 'Dråpen i havet' }: DraapenIHavetProps) {
    const [paa, setPaa] = useState<string[]>([]);
    const [fase, setFase] = useState<Fase>('venter');
    const [melding, setMelding] = useState<string | null>(null);
    const timers = useRef<number[]>([]);

    const nullstillTimere = () => {
        timers.current.forEach((t) => window.clearTimeout(t));
        timers.current = [];
    };

    useEffect(() => {
        return () => {
            timers.current.forEach((t) => window.clearTimeout(t));
        };
    }, []);

    const antall = paa.length;
    const laast = fase === 'naade' || fase === 'forent';

    const handleVane = (vane: Vane) => {
        if (laast) return;
        nullstillTimere();

        if (paa.includes(vane.id)) {
            setPaa((p) => p.filter((id) => id !== vane.id));
            setFase('venter');
            setMelding(`Du slo av ${vane.navn}. Egoet legger seg tilbake rundt dråpen.`);
            return;
        }

        const neste = [...paa, vane.id];
        setPaa(neste);
        setMelding(vane.kvittering);

        if (neste.length === VANER.length) {
            setFase('klar');
            const t1 = window.setTimeout(() => {
                setFase('naade');
                setMelding('Kirpa. Nåden kommer fra Gud, og ingen knapp her kan tvinge den fram.');
            }, 1500);
            const t2 = window.setTimeout(() => setFase('forent'), 2900);
            timers.current.push(t1, t2);
        } else {
            setFase('venter');
        }
    };

    const handleReset = () => {
        nullstillTimere();
        setPaa([]);
        setFase('venter');
        setMelding(null);
    };

    const dropY = fase === 'forent' ? MERGE_Y : NIVAA_Y[antall];
    const dropFarge = DROPPE_FARGER[antall];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Droplets className="w-5 h-5 text-sky-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Skallet rundt dråpen er haumai, egoet. Slå på de tre vanene og se hva som
                        skjer.
                    </p>
                </div>
            </div>

            <div className="px-5 py-4 bg-slate-50">
                <svg
                    viewBox="0 0 520 262"
                    className="w-full h-[190px] sm:h-[224px]"
                    role="img"
                    aria-label="En vanndråpe med et skall rundt seg over en vannflate"
                >
                    <defs>
                        <linearGradient id="dih-hav" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7dd3fc" />
                            <stop offset="100%" stopColor="#bae6fd" />
                        </linearGradient>
                        <linearGradient id="dih-lys" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <AnimatePresence>
                        {(fase === 'naade' || fase === 'forent') && (
                            <motion.path
                                key="naadelys"
                                d="M 226 0 L 294 0 L 344 196 L 176 196 Z"
                                fill="url(#dih-lys)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.7 }}
                            />
                        )}
                    </AnimatePresence>

                    <rect x="0" y="196" width="520" height="66" fill="url(#dih-hav)" />
                    <path
                        d="M 0 196 Q 65 188 130 196 T 260 196 T 390 196 T 520 196"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        opacity="0.7"
                    />

                    <AnimatePresence>
                        {fase === 'forent' && (
                            <g key="ringer">
                                {[0, 1, 2].map((i) => (
                                    <motion.circle
                                        key={i}
                                        cx={260}
                                        cy={196}
                                        r={8}
                                        fill="none"
                                        stroke="#0ea5e9"
                                        strokeWidth="3"
                                        initial={{ r: 8, opacity: 0.75 }}
                                        animate={{ r: 118, opacity: 0 }}
                                        transition={{ duration: 1.7, delay: i * 0.28 }}
                                    />
                                ))}
                            </g>
                        )}
                    </AnimatePresence>

                    <motion.g
                        initial={false}
                        animate={{ y: dropY }}
                        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                    >
                        <g transform="translate(260 74)">
                            {SEGMENTER.map(([fra, til], i) => (
                                <motion.path
                                    key={i}
                                    d={bue(fra, til, RING_RADIUS)}
                                    fill="none"
                                    stroke="#94a3b8"
                                    strokeWidth="7"
                                    strokeLinecap="round"
                                    initial={false}
                                    animate={{
                                        opacity: antall > i ? 0 : 1,
                                        scale: antall > i ? 1.5 : 1,
                                    }}
                                    transition={{ duration: 0.55, ease: 'easeOut' }}
                                />
                            ))}

                            <motion.path
                                d="M 0 -28 C 13 -11, 22 -2, 22 7 A 22 22 0 1 1 -22 7 C -22 -2, -13 -11, 0 -28 Z"
                                fill={dropFarge}
                                initial={false}
                                animate={{
                                    fill: dropFarge,
                                    opacity: fase === 'forent' ? 0 : 1,
                                    scale: fase === 'forent' ? 0.2 : 1,
                                }}
                                transition={{ duration: fase === 'forent' ? 0.9 : 0.5 }}
                            />
                            <motion.ellipse
                                cx={-7}
                                cy={4}
                                rx={5}
                                ry={7}
                                fill="#ffffff"
                                initial={false}
                                animate={{ opacity: fase === 'forent' ? 0 : 0.65 }}
                                transition={{ duration: 0.6 }}
                            />
                        </g>
                    </motion.g>

                    <AnimatePresence>
                        {antall < VANER.length && (
                            <motion.text
                                key="haumai"
                                x="260"
                                y="250"
                                textAnchor="middle"
                                fontSize="15"
                                fill="#64748b"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                haumai: egoet som holder dråpen for seg selv
                            </motion.text>
                        )}
                    </AnimatePresence>
                </svg>
            </div>

            <div className="px-5 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {VANER.map((vane) => {
                    const aktiv = paa.includes(vane.id);
                    const Ikon = vane.ikon;
                    return (
                        <motion.button
                            key={vane.id}
                            onClick={() => handleVane(vane)}
                            disabled={laast}
                            whileTap={laast ? undefined : { scale: 0.97 }}
                            animate={aktiv ? { y: [0, -4, 0] } : { y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`text-left rounded-xl border px-3 py-2.5 transition-colors disabled:cursor-default ${
                                aktiv
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Ikon
                                    className={`w-4 h-4 shrink-0 ${
                                        aktiv ? 'text-emerald-600' : 'text-slate-400'
                                    }`}
                                />
                                <span
                                    className={`font-semibold text-sm ${
                                        aktiv ? 'text-emerald-800' : 'text-slate-800'
                                    }`}
                                >
                                    {vane.navn}
                                </span>
                            </span>
                            <span className="block text-[11px] leading-snug text-slate-500 mt-1">
                                {vane.undertekst}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {fase === 'forent' ? (
                        <motion.div
                            key="forent"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <span className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                                >
                                    <Sun className="w-4 h-4" />
                                </motion.span>
                                Jivan mukti: fri mens du lever
                            </span>
                            <p className="mt-1">
                                Vannet er ikke borte. Det kan bare ikke lenger plukkes ut som en
                                egen dråpe. Sikhismen mener mukti kan nås i dette livet, uten at man
                                forlater samfunnet. Den frigjorte fortsetter å arbeide og å tjene
                                andre.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={melding ?? 'tom'}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm border ${
                                melding
                                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                        >
                            {melding ??
                                'Dråpen kommer ikke ned av seg selv. Slå på en vane og se hva som skjer med skallet rundt den.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {fase === 'forent'
                        ? 'Dråpen har gått opp i havet'
                        : `${antall} av ${VANER.length} vaner i gang`}
                </span>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
