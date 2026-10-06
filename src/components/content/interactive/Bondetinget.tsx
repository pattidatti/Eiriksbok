import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark,
    BookOpen,
    ClipboardList,
    MapPin,
    Crown,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Lightbulb,
} from 'lucide-react';

interface BondetingetProps {
    title?: string;
}

type Phase = 'stortinget' | 'regjeringen' | 'done';
type Seat = 'embetsmann' | 'bonde' | 'tom';
type TiltakId = 'olaboka' | 'manntall' | 'flere-plasser';
type Svar = 'bonder' | 'blanding' | 'embetsmenn';

interface Tiltak {
    id: TiltakId;
    icon: typeof BookOpen;
    label: string;
    effekt: string;
    // Hvor mange embetsmannsplasser som går til bønder, og hvor mange nye plasser bøndene fyller
    tilBonde: number;
    nyeBonder: number;
}

const TOTALT = 80;
const START_EMBETSMENN = 43;
const START_BONDER = 21;

const TILTAK: Tiltak[] = [
    {
        id: 'olaboka',
        icon: BookOpen,
        label: 'Spre «Ola-boka»',
        effekt: 'Bønder stemmer på andre bønder i stedet for den lokale embetsmannen.',
        tilBonde: 8,
        nyeBonder: 0,
    },
    {
        id: 'manntall',
        icon: ClipboardList,
        label: 'Få bønder inn i manntallet',
        effekt: 'Flere bønder skriver seg inn i listen over dem som får stemme.',
        tilBonde: 0,
        nyeBonder: 8,
    },
    {
        id: 'flere-plasser',
        icon: MapPin,
        label: 'Avtal kandidaten på forhånd',
        effekt: 'Bøndene i hver bygd blir enige om én bondekandidat, og amtene får velge flere representanter enn før.',
        tilBonde: 0,
        nyeBonder: 8,
    },
];

const SVAR: { id: Svar; label: string }[] = [
    { id: 'bonder', label: 'Mest bønder' },
    { id: 'blanding', label: 'Halvt om halvt' },
    { id: 'embetsmenn', label: 'Bare embetsmenn' },
];

const REGJERING_PLASSER = 6;

function byggSeter(brukt: TiltakId[]): Seat[] {
    let embetsmenn = START_EMBETSMENN;
    let bonder = START_BONDER;
    for (const t of TILTAK) {
        if (brukt.includes(t.id)) {
            embetsmenn -= t.tilBonde;
            bonder += t.tilBonde + t.nyeBonder;
        }
    }
    const tomme = TOTALT - embetsmenn - bonder;
    return [
        ...Array<Seat>(embetsmenn).fill('embetsmann'),
        ...Array<Seat>(bonder).fill('bonde'),
        ...Array<Seat>(tomme).fill('tom'),
    ];
}

const SEAT_STYLE: Record<Seat, string> = {
    embetsmann: 'bg-indigo-500 border-indigo-600',
    bonde: 'bg-emerald-500 border-emerald-600',
    tom: 'bg-white border-dashed border-slate-300',
};

export function Bondetinget({ title = 'Bondestortinget 1833' }: BondetingetProps) {
    const [phase, setPhase] = useState<Phase>('stortinget');
    const [brukt, setBrukt] = useState<TiltakId[]>([]);
    const [sisteTiltak, setSisteTiltak] = useState<TiltakId | null>(null);
    const [svar, setSvar] = useState<Svar | null>(null);

    const seter = byggSeter(brukt);
    const antallEmbetsmenn = seter.filter((s) => s === 'embetsmann').length;
    const antallBonder = seter.filter((s) => s === 'bonde').length;
    const alleBrukt = brukt.length === TILTAK.length;
    const aarstall = alleBrukt ? 1833 : 1830;

    const brukTiltak = (id: TiltakId) => {
        if (brukt.includes(id)) return;
        setBrukt((b) => [...b, id]);
        setSisteTiltak(id);
    };

    const velgSvar = (s: Svar) => {
        if (svar) return;
        setSvar(s);
    };

    const handleReset = () => {
        setPhase('stortinget');
        setBrukt([]);
        setSisteTiltak(null);
        setSvar(null);
    };

    const sisteEffekt = TILTAK.find((t) => t.id === sisteTiltak)?.effekt;

    let feedback: { tone: 'info' | 'ok' | 'feil'; tekst: string };
    if (phase === 'stortinget') {
        feedback = alleBrukt
            ? {
                  tone: 'ok',
                  tekst: 'Valget i 1833: 45 bønder mot 35 embetsmenn. For første gang har bøndene flere plasser enn embetsmennene!',
              }
            : sisteEffekt
              ? { tone: 'info', tekst: sisteEffekt }
              : {
                    tone: 'info',
                    tekst: 'Stortinget 1830: 43 embetsmenn og bare 21 bønder. Du er bondepolitikeren John Neergaard. Velg et tiltak.',
                };
    } else if (!svar) {
        feedback = {
            tone: 'info',
            tekst: 'Bøndene vant Stortinget. Men hvem sitter i regjeringen nå? Gjett.',
        };
    } else if (svar === 'embetsmenn') {
        feedback = {
            tone: 'ok',
            tekst: 'Riktig! Kongen valgte statsrådene, ikke Stortinget. Han valgte embetsmenn, helt fram til 1884.',
        };
    } else {
        feedback = {
            tone: 'feil',
            tekst: 'Nei, regjeringen var bare embetsmenn. Kongen valgte statsrådene, og Stortinget fikk ikke bestemme hvem det ble.',
        };
    }

    const feedbackStyle = {
        info: 'bg-blue-50 border-blue-200 text-blue-700',
        ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        feil: 'bg-rose-50 border-rose-200 text-rose-700',
    }[feedback.tone];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Landmark className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {phase === 'stortinget'
                            ? 'Bruk de tre tiltakene og se hvem som får plassene i Stortinget.'
                            : 'Bøndene har vunnet Stortinget. Hvem styrer landet?'}
                    </p>
                </div>
            </div>

            <div className="p-5">
                {/* Stortinget */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                        Stortinget{' '}
                        <motion.span
                            key={aarstall}
                            initial={{ scale: 1.4, color: '#059669' }}
                            animate={{ scale: 1, color: '#334155' }}
                            className="inline-block"
                        >
                            {aarstall}
                        </motion.span>
                    </span>
                    <div className="flex gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                            Embetsmenn: <strong>{antallEmbetsmenn}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                            Bønder: <strong>{antallBonder}</strong>
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    {seter.map((seat, i) => (
                        <motion.div
                            key={i}
                            layout
                            animate={{ scale: [0.6, 1] }}
                            transition={{ duration: 0.3, delay: (i % 20) * 0.01 }}
                            className={`aspect-square rounded-full border ${SEAT_STYLE[seat]}`}
                            title={seat === 'tom' ? 'Ny plass' : seat}
                        />
                    ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                    Bare embetsmenn og bønder er vist. Tallene for 1830 og 1833 er ekte. Hvor mye
                    hvert tiltak ga, er forenklet.
                </p>

                <AnimatePresence mode="wait">
                    {phase === 'stortinget' ? (
                        <motion.div
                            key="tiltak"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4"
                        >
                            {TILTAK.map((t) => {
                                const Icon = t.icon;
                                const ferdig = brukt.includes(t.id);
                                return (
                                    <motion.button
                                        key={t.id}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => brukTiltak(t.id)}
                                        disabled={ferdig}
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-left ${
                                            ferdig
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-white border-slate-200 hover:shadow-md text-slate-700'
                                        }`}
                                    >
                                        {ferdig ? (
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                                        )}
                                        {t.label}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="regjering"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4"
                        >
                            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
                                <Crown className="w-4 h-4 text-amber-500" />
                                Regjeringen (valgt av kongen)
                            </div>
                            <div className="flex gap-2 mb-3">
                                {Array.from({ length: REGJERING_PLASSER }).map((_, i) => (
                                    <motion.div
                                        key={`${i}-${svar ? 'vist' : 'skjult'}`}
                                        initial={svar ? { rotateY: 90 } : false}
                                        animate={{ rotateY: 0 }}
                                        transition={{ delay: i * 0.12 }}
                                        className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold ${
                                            svar
                                                ? 'bg-indigo-500 border-indigo-600 text-white'
                                                : 'bg-slate-100 border-slate-300 text-slate-400'
                                        }`}
                                    >
                                        {svar ? 'E' : '?'}
                                    </motion.div>
                                ))}
                            </div>
                            {phase === 'regjeringen' && (
                                <div className="grid grid-cols-3 gap-2">
                                    {SVAR.map((s) => (
                                        <motion.button
                                            key={s.id}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => velgSvar(s.id)}
                                            disabled={svar !== null}
                                            className={`rounded-xl border px-3 py-2 text-sm ${
                                                svar === s.id
                                                    ? s.id === 'embetsmenn'
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                        : 'bg-rose-50 border-rose-200 text-rose-700'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:shadow-md'
                                            }`}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {svar === s.id &&
                                                    (s.id === 'embetsmenn' ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4" />
                                                    ))}
                                                {s.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                            {phase === 'done' && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                                    className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900"
                                >
                                    <Lightbulb className="w-5 h-5 shrink-0 text-amber-500" />
                                    <p>
                                        Bøndene kunne vinne Stortinget, men ikke regjeringen. De
                                        fikk gjennom sakene sine der: lavere skatt og lokalt
                                        selvstyre med formannskapslovene i 1837. Men så lenge kongen
                                        valgte statsrådene, styrte embetsmennene landet. Det endret
                                        seg først i 1884.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <motion.div
                key={feedback.tekst}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mx-5 mb-4 px-4 py-3 rounded-lg border text-sm ${feedbackStyle}`}
            >
                {feedback.tekst}
            </motion.div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                {phase === 'stortinget' && (
                    <button
                        onClick={() => setPhase('regjeringen')}
                        disabled={!alleBrukt}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Se på regjeringen
                    </button>
                )}
                {phase === 'regjeringen' && (
                    <button
                        onClick={() => setPhase('done')}
                        disabled={!svar}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Hva betyr dette?
                    </button>
                )}
                {phase === 'done' && <span />}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
