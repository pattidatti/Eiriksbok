import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, RotateCcw, Sparkles } from 'lucide-react';

interface SpeiletOgSolenProps {
    title?: string;
}

interface Speil {
    navn: string;
    undertekst: string;
    fakta: string;
    rot: number;
}

const SPEIL: Speil[] = [
    {
        navn: 'Abraham',
        undertekst: 'stamfar',
        fakta: "Abraham er stamfar i jødedom, kristendom og islam. Bahá'í-troen regner ham som et av de tidligste speilene.",
        rot: -14,
    },
    {
        navn: 'Moses',
        undertekst: 'loven',
        fakta: "Moses står sentralt i jødedommen. Bahá'íer ser ham som et speil som ga Guds veiledning til sin egen tid.",
        rot: 71,
    },
    {
        navn: 'Buddha',
        undertekst: 'læreren',
        fakta: "Buddha er læreren buddhismen bygger på. Bahá'íer regner også ham blant Guds manifestasjoner.",
        rot: -52,
    },
    {
        navn: 'Jesus',
        undertekst: 'kristendommen',
        fakta: "Jesus er sentral i kristendommen. For bahá'íer er han ett av speilene, ikke det eneste og ikke det siste.",
        rot: 18,
    },
    {
        navn: 'Muhammad',
        undertekst: 'islam',
        fakta: "Muhammad er islams profet. Bahá'íer mener at det samme lyset skinte i ham som i de andre speilene.",
        rot: 86,
    },
    {
        navn: "Bahá'u'lláh",
        undertekst: '1817-1892',
        fakta: "Bahá'u'lláh levde fra 1817 til 1892 og grunnla bahá'í-troen. Religionen er oppkalt etter ham.",
        rot: -78,
    },
];

const SOL = { x: 360, y: 54 };
const SPEIL_Y = 180;
const BAKKE_Y = 250;
const FORSTE_X = 62;
const AVSTAND = 119;

const speilX = (i: number) => FORSTE_X + i * AVSTAND;

/** Vinkelen speilflaten får når den står rett vendt mot solen. */
function vinkelMotSolen(x: number): number {
    const dx = SOL.x - x;
    const dy = SOL.y - SPEIL_Y;
    return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

type Melding =
    { slag: 'tom' } | { slag: 'sol' } | { slag: 'speil'; tekst: string } | { slag: 'ferdig' };

export function SpeiletOgSolen({ title = 'Speilet og solen' }: SpeiletOgSolenProps) {
    const [vendt, setVendt] = useState<boolean[]>(() => SPEIL.map(() => false));
    const [melding, setMelding] = useState<Melding>({ slag: 'tom' });

    const antall = vendt.filter(Boolean).length;
    const ferdig = antall === SPEIL.length;

    const klikkSpeil = (i: number) => {
        const neste = vendt.map((v, j) => (j === i ? !v : v));
        setVendt(neste);
        if (neste.every(Boolean)) {
            setMelding({ slag: 'ferdig' });
        } else if (neste[i]) {
            setMelding({ slag: 'speil', tekst: SPEIL[i].fakta });
        } else {
            setMelding({ slag: 'tom' });
        }
    };

    const vendAlle = () => {
        setVendt(SPEIL.map(() => true));
        setMelding({ slag: 'ferdig' });
    };

    const tilbakestill = () => {
        setVendt(SPEIL.map(() => false));
        setMelding({ slag: 'tom' });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på et speil for å vende det mot solen. Klarer du alle seks?
                    </p>
                </div>
            </div>

            <div className="px-4 pt-4 sm:px-6">
                <div className="rounded-xl bg-gradient-to-b from-amber-50 to-white border border-amber-100 p-2">
                    <svg
                        viewBox="0 0 720 330"
                        className="w-full h-auto"
                        role="img"
                        aria-label="Solen øverst og seks speil under som kan vendes mot den"
                    >
                        <text
                            x={360}
                            y={18}
                            textAnchor="middle"
                            className="fill-slate-400"
                            fontSize={13}
                        >
                            Solen kan du ikke se rett på
                        </text>

                        {/* Innkommende lys: faller på alle speilene hele tiden */}
                        {SPEIL.map((s, i) => (
                            <motion.line
                                key={`inn-${s.navn}`}
                                x1={SOL.x}
                                y1={SOL.y}
                                x2={speilX(i)}
                                y2={SPEIL_Y}
                                stroke="#f59e0b"
                                strokeLinecap="round"
                                animate={{
                                    opacity: vendt[i] ? 0.85 : 0.18,
                                    strokeWidth: vendt[i] ? 3.5 : 1.5,
                                }}
                                transition={{ duration: 0.35 }}
                            />
                        ))}

                        {/* Gjenskinnet: når speilet står riktig, når lyset menneskene */}
                        {SPEIL.map((s, i) => (
                            <motion.line
                                key={`ut-${s.navn}`}
                                x1={speilX(i)}
                                y1={SPEIL_Y}
                                x2={speilX(i)}
                                y2={BAKKE_Y}
                                stroke="#fbbf24"
                                strokeWidth={7}
                                strokeLinecap="round"
                                initial={false}
                                animate={{ opacity: vendt[i] ? 0.65 : 0 }}
                                transition={{ duration: 0.35 }}
                            />
                        ))}

                        {/* Solen */}
                        <motion.g
                            onClick={() => setMelding({ slag: 'sol' })}
                            className="cursor-pointer"
                            animate={melding.slag === 'sol' ? { x: [0, -5, 5, -3, 0] } : { x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <circle cx={SOL.x} cy={SOL.y} r={40} fill="#fde68a" opacity={0.5} />
                            <motion.circle
                                cx={SOL.x}
                                cy={SOL.y}
                                r={27}
                                fill="#fbbf24"
                                animate={{ opacity: ferdig ? [1, 0.75, 1] : 1 }}
                                transition={{ duration: 1.6, repeat: ferdig ? Infinity : 0 }}
                            />
                            <text
                                x={SOL.x}
                                y={SOL.y + 5}
                                textAnchor="middle"
                                fontSize={14}
                                fontWeight={600}
                                className="fill-white"
                            >
                                Gud
                            </text>
                        </motion.g>

                        <AnimatePresence>
                            {ferdig && (
                                <motion.circle
                                    cx={SOL.x}
                                    cy={SOL.y}
                                    r={27}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    initial={{ scale: 1, opacity: 0.9 }}
                                    animate={{ scale: 5, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.4, ease: 'easeOut' }}
                                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Speilene */}
                        {SPEIL.map((s, i) => {
                            const x = speilX(i);
                            const rett = vinkelMotSolen(x);
                            return (
                                <g
                                    key={s.navn}
                                    onClick={() => klikkSpeil(i)}
                                    className="cursor-pointer"
                                >
                                    <rect
                                        x={x - 52}
                                        y={SPEIL_Y - 34}
                                        width={104}
                                        height={68}
                                        fill="transparent"
                                    />
                                    <motion.rect
                                        x={x - 38}
                                        y={SPEIL_Y - 6}
                                        width={76}
                                        height={12}
                                        rx={6}
                                        stroke={vendt[i] ? '#f59e0b' : '#94a3b8'}
                                        strokeWidth={2}
                                        animate={{
                                            rotate: vendt[i] ? rett : s.rot,
                                            fill: vendt[i] ? '#fef3c7' : '#e2e8f0',
                                        }}
                                        whileHover={{ scale: 1.08 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 130,
                                            damping: 13,
                                        }}
                                        style={{
                                            transformBox: 'fill-box',
                                            transformOrigin: 'center',
                                        }}
                                    />
                                </g>
                            );
                        })}

                        {/* Menneskene */}
                        <rect
                            x={40}
                            y={BAKKE_Y}
                            width={640}
                            height={26}
                            rx={13}
                            fill="#f1f5f9"
                            stroke="#e2e8f0"
                        />
                        <text
                            x={360}
                            y={BAKKE_Y + 18}
                            textAnchor="middle"
                            fontSize={13}
                            className="fill-slate-500"
                        >
                            Menneskene
                        </text>

                        {/* Navn */}
                        {SPEIL.map((s, i) => (
                            <g key={`navn-${s.navn}`}>
                                <text
                                    x={speilX(i)}
                                    y={BAKKE_Y + 50}
                                    textAnchor="middle"
                                    fontSize={14}
                                    fontWeight={600}
                                    className={vendt[i] ? 'fill-amber-600' : 'fill-slate-600'}
                                >
                                    {s.navn}
                                </text>
                                <text
                                    x={speilX(i)}
                                    y={BAKKE_Y + 66}
                                    textAnchor="middle"
                                    fontSize={11}
                                    className="fill-slate-400"
                                >
                                    {s.undertekst}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>

            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={melding.slag + (melding.slag === 'speil' ? melding.tekst : '')}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={
                            melding.slag === 'ferdig'
                                ? 'px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2'
                                : melding.slag === 'sol'
                                  ? 'px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm'
                                  : 'px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm'
                        }
                    >
                        {melding.slag === 'ferdig' && (
                            <>
                                <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                    Seks speil, ett lys. Speilene er ulike, de kom til ulike tider
                                    og ulike steder, men bahá&#39;íer mener at det er den samme
                                    solen som skinner i dem alle.
                                </span>
                            </>
                        )}
                        {melding.slag === 'sol' && (
                            <span>
                                Solen står for Gud selv. Bahá&#39;í-troen lærer at Guds vesen er
                                utenfor det mennesker kan fatte. Derfor kan du ikke gjøre noe med
                                solen her, bare med speilene.
                            </span>
                        )}
                        {melding.slag === 'speil' && <span>{melding.tekst}</span>}
                        {melding.slag === 'tom' && (
                            <span>
                                Lyset faller på alle speilene. Vend et av dem mot solen, så ser du
                                hva som skjer. Prøv å trykke på solen også.
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={vendAlle}
                        disabled={ferdig}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Vend alle mot solen
                    </button>
                    <span className="text-sm text-slate-500">
                        {antall} av {SPEIL.length} speil vendt
                    </span>
                </div>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
