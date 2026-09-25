import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, RotateCcw, CalendarClock, Castle, CheckCircle2, Info } from 'lucide-react';

interface OyhoppingProps {
    title?: string;
}

type Kind = 'start' | 'svak' | 'middels' | 'festning';
type Phase = 'active' | 'complete';

interface Island {
    id: string;
    navn: string;
    kind: Kind;
    x: number;
    y: number;
}

// Forenklet kart over Stillehavet. Avstandene er ikke målestokkriktige, men
// forholdet er det samme som i virkeligheten: flyene rakk bare et stykke fra
// den siste flyplassen, og hver erobret øy flyttet rekkevidden nærmere Japan.
const ISLANDS: Island[] = [
    { id: 'hawaii', navn: 'Hawaii', kind: 'start', x: 92, y: 48 },
    { id: 'atoll-1', navn: 'Atoll', kind: 'svak', x: 74, y: 58 },
    { id: 'festning-nord', navn: 'Festningsøy', kind: 'festning', x: 76, y: 36 },
    { id: 'festning-sor', navn: 'Festningsøy', kind: 'festning', x: 55, y: 52 },
    { id: 'atoll-2', navn: 'Atoll', kind: 'svak', x: 60, y: 74 },
    { id: 'atoll-3', navn: 'Atoll', kind: 'svak', x: 45, y: 60 },
    { id: 'atoll-4', navn: 'Atoll', kind: 'svak', x: 58, y: 30 },
    { id: 'marianene', navn: 'Marianene', kind: 'middels', x: 40, y: 40 },
];

const JAPAN = { x: 22, y: 26 };
// Rekkevidden til flyene som skal dekke neste landgang.
const RANGE = 22;
// B-29-bombeflyene rakk lenger - fra Marianene nådde de Japan.
const B29_RANGE = 26;
const BEST_MONTHS = 6;

const COST: Record<Kind, number> = { start: 0, svak: 1, middels: 3, festning: 6 };

const KIND_TEXT: Record<Kind, string> = {
    start: 'Amerikansk base',
    svak: 'Lite forsvart atoll - 1 måned',
    middels: 'Godt forsvart - 3 måneder',
    festning: 'Festning med tusenvis av soldater - 6 måneder',
};

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export function Oyhopping({ title = 'Øyhopping mot Japan' }: OyhoppingProps) {
    const [held, setHeld] = useState<string[]>(['hawaii']);
    const [months, setMonths] = useState(0);
    const [phase, setPhase] = useState<Phase>('active');
    const [message, setMessage] = useState<{ tone: 'info' | 'bad' | 'good'; text: string }>({
        tone: 'info',
        text: 'Klikk på en øy innenfor den blå sirkelen for å erobre den. Målet er Marianene.',
    });

    const heldIslands = useMemo(() => ISLANDS.filter((i) => held.includes(i.id)), [held]);

    const inRange = (island: Island) => heldIslands.some((h) => dist(h, island) <= RANGE);

    const capture = (island: Island) => {
        if (phase === 'complete' || held.includes(island.id)) return;
        if (!inRange(island)) {
            setMessage({
                tone: 'bad',
                text: 'For langt unna. Flyene dine når ikke dit ennå, og uten fly over landgangen blir soldatene et lett mål.',
            });
            return;
        }
        const nextMonths = months + COST[island.kind];
        setHeld((h) => [...h, island.id]);
        setMonths(nextMonths);

        if (island.id === 'marianene') {
            setPhase('complete');
            setMessage(
                nextMonths <= BEST_MONTHS
                    ? {
                          tone: 'good',
                          text: `Marianene er tatt etter ${nextMonths} måneder - raskeste vei! Du hoppet over festningene. De ble avskåret fra forsyninger og kunne ikke lenger stoppe deg. Nå når B-29-bombeflyene Japan.`,
                      }
                    : {
                          tone: 'good',
                          text: `Marianene er tatt etter ${nextMonths} måneder. B-29-flyene når nå Japan. Men den raskeste veien tar bare ${BEST_MONTHS} måneder: Den går utenom festningene i stedet for gjennom dem. Prøv igjen og se om du finner den.`,
                      }
            );
            return;
        }

        setMessage(
            island.kind === 'festning'
                ? {
                      tone: 'bad',
                      text: 'Festningen falt, men det kostet 6 måneder og mange liv. Måtte du egentlig ta den?',
                  }
                : {
                      tone: 'info',
                      text: `Atollen er tatt på 1 måned. Den nye flyplassen flytter rekkevidden din videre vestover.`,
                  }
        );
    };

    const reset = () => {
        setHeld(['hawaii']);
        setMonths(0);
        setPhase('active');
        setMessage({
            tone: 'info',
            text: 'Klikk på en øy innenfor den blå sirkelen for å erobre den. Målet er Marianene.',
        });
    };

    const marianas = ISLANDS.find((i) => i.id === 'marianene')!;
    const skippedFortresses = ISLANDS.filter(
        (i) => i.kind === 'festning' && !held.includes(i.id)
    ).length;

    const toneClass =
        message.tone === 'good'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : message.tone === 'bad'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Plane className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Erobre øyer til bombeflyene rekker helt til Japan. Bruk så få måneder som
                        mulig.
                    </p>
                </div>
                <motion.div
                    key={months}
                    initial={{ scale: 1.25 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 shrink-0"
                >
                    <CalendarClock className="w-4 h-4" />
                    {months} mnd
                </motion.div>
            </div>

            {/* Kartet */}
            <div className="px-4 pt-4">
                <div className="rounded-lg overflow-hidden bg-[#dbeafe]">
                    <svg
                        viewBox="0 0 100 84"
                        className="w-full max-h-[340px] block"
                        role="img"
                        aria-label="Forenklet kart over Stillehavet med øyer mellom Hawaii og Japan"
                    >
                        <rect x="0" y="0" width="100" height="84" fill="#dbeafe" />

                        {/* Japan */}
                        <path
                            d="M14 8 C20 10 24 14 25 20 C26 25 24 30 20 33 C17 35 14 34 13 31 C15 27 16 22 14 17 C13 13 12 10 14 8 Z"
                            fill="#e7e5e4"
                            stroke="#a8a29e"
                            strokeWidth="0.4"
                        />
                        <text x="16" y="38.5" fontSize="3" fill="#57534e" fontWeight="700">
                            JAPAN
                        </text>

                        {/* Rekkevidde fra hver øy du holder */}
                        {heldIslands.map((h) => (
                            <motion.circle
                                key={`r-${h.id}`}
                                cx={h.x}
                                cy={h.y}
                                initial={{ r: 0, opacity: 0 }}
                                animate={{ r: RANGE, opacity: 1 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                fill="rgba(99,102,241,0.08)"
                                stroke="rgba(99,102,241,0.45)"
                                strokeWidth="0.35"
                                strokeDasharray="1.2 1"
                            />
                        ))}

                        {/* B-29-rekkevidden fra Marianene */}
                        {phase === 'complete' && (
                            <>
                                <motion.circle
                                    cx={marianas.x}
                                    cy={marianas.y}
                                    initial={{ r: 0 }}
                                    animate={{ r: B29_RANGE }}
                                    transition={{ duration: 1.1, ease: 'easeOut' }}
                                    fill="rgba(245,158,11,0.12)"
                                    stroke="#f59e0b"
                                    strokeWidth="0.6"
                                />
                                <motion.line
                                    x1={marianas.x}
                                    y1={marianas.y}
                                    x2={JAPAN.x}
                                    y2={JAPAN.y}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ delay: 0.8, duration: 0.8 }}
                                    stroke="#b45309"
                                    strokeWidth="0.6"
                                    strokeDasharray="1.5 1"
                                />
                            </>
                        )}

                        {/* Øyene */}
                        {ISLANDS.map((island) => {
                            const isHeld = held.includes(island.id);
                            const reachable = !isHeld && phase === 'active' && inRange(island);
                            const isFort = island.kind === 'festning';
                            const cutOff = phase === 'complete' && isFort && !isHeld;
                            const fill = isHeld
                                ? '#4f46e5'
                                : cutOff
                                  ? '#cbd5e1'
                                  : isFort
                                    ? '#b91c1c'
                                    : island.kind === 'middels'
                                      ? '#d97706'
                                      : '#65a30d';
                            const size = isFort ? 3.4 : island.kind === 'middels' ? 3 : 2.3;
                            return (
                                <g
                                    key={island.id}
                                    onClick={() => capture(island)}
                                    style={{
                                        cursor:
                                            isHeld || phase === 'complete' ? 'default' : 'pointer',
                                    }}
                                    role="button"
                                    aria-label={`${island.navn}: ${KIND_TEXT[island.kind]}`}
                                >
                                    {/* Stor usynlig klikkflate - trygg å treffe med styreflate */}
                                    <circle cx={island.x} cy={island.y} r={6} fill="transparent" />
                                    {reachable && (
                                        <motion.circle
                                            cx={island.x}
                                            cy={island.y}
                                            r={size + 1.4}
                                            fill="none"
                                            stroke="#6366f1"
                                            strokeWidth="0.5"
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ repeat: Infinity, duration: 1.4 }}
                                        />
                                    )}
                                    <motion.circle
                                        cx={island.x}
                                        cy={island.y}
                                        animate={{ r: isHeld ? size + 0.5 : size }}
                                        fill={fill}
                                        stroke="white"
                                        strokeWidth="0.5"
                                        opacity={
                                            !isHeld && !reachable && phase === 'active' ? 0.55 : 1
                                        }
                                    />
                                    <text
                                        x={island.x}
                                        y={island.y + size + 3.3}
                                        fontSize="2.4"
                                        textAnchor="middle"
                                        fill="#334155"
                                        fontWeight={
                                            island.kind === 'middels' || island.kind === 'start'
                                                ? 700
                                                : 500
                                        }
                                    >
                                        {cutOff ? 'Avskåret' : island.navn}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Tegnforklaring */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-lime-600" /> Atoll: 1 måned
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Marianene: 3
                        måneder
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Castle className="w-3.5 h-3.5 text-red-700" /> Festning: 6 måneder
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Dine øyer
                    </span>
                    <span className="text-slate-400">Forenklet kart</span>
                </div>
            </div>

            {/* Feedback-sone - alltid synlig */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={message.text}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mx-4 mt-4 px-4 py-3 rounded-lg border text-sm flex gap-2 ${toneClass}`}
                >
                    {message.tone === 'good' ? (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <span>{message.text}</span>
                </motion.div>
            </AnimatePresence>

            {phase === 'complete' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="mx-4 mt-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm"
                >
                    Du hoppet over {skippedFortresses} av 2 festninger. Slik tenkte de amerikanske
                    planleggerne: Du trenger ikke hver øy. Du trenger bare nok flyplasser, nær nok
                    Japan.
                </motion.div>
            )}

            {/* Kontrollrad */}
            <div className="px-4 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {phase === 'complete' ? 'Ferdig!' : `Beste mulige: ${BEST_MONTHS} måneder`}
                </span>
                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
