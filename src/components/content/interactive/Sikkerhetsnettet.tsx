import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import {
    ShieldCheck,
    Baby,
    Thermometer,
    Briefcase,
    Armchair,
    Accessibility,
    Check,
    RotateCcw,
    Users,
} from 'lucide-react';

interface SikkerhetsnettetProps {
    title?: string;
    /** Hvilken akt komponenten åpner på. Artikkelen bruker 1 ved trådlisten og 2 i finansieringsseksjonen. */
    initialAct?: 1 | 2;
}

// Lyspære-øyeblikket: velferdsstaten var ikke en gave som kom med rikdommen.
// Den ble vevd tråd for tråd, gjennom politiske vedtak i fattige år - og eleven
// finner selv hvilket år hver tråd kom, ved å falle gjennom hullet før den fantes.

type Phase = 'idle' | 'caught' | 'fell' | 'complete';

interface Strand {
    id: string;
    ordning: string;
    year: number;
    note: string;
}

// Hver tråd = én trygdeordning, med året den kom. Kildebelagt i artikkelen.
const STRANDS: Strand[] = [
    {
        id: 'barn',
        ordning: 'Barnetrygd',
        year: 1946,
        note: 'Den første trygden som gjaldt alle, uansett hvor mye foreldrene tjente.',
    },
    {
        id: 'syk',
        ordning: 'Syketrygd',
        year: 1946,
        note: 'Nå fikk lønnstakere penger å leve av mens de var syke.',
    },
    {
        id: 'jobb',
        ordning: 'Arbeidsløshetstrygd',
        year: 1949,
        note: 'Å miste jobben betydde ikke lenger å miste alt.',
    },
    {
        id: 'gammel',
        ordning: 'Alderstrygd til alle',
        year: 1957,
        note: 'Pensjon uten at noen først målte hvor fattig du var.',
    },
    {
        id: 'ufor',
        ordning: 'Uføretrygd',
        year: 1960,
        note: 'Klarer du ikke å jobbe mer, får du likevel en inntekt.',
    },
];

interface LifeEvent {
    id: string;
    label: string;
    strandId: string;
    Icon: typeof Baby;
}

const EVENTS: LifeEvent[] = [
    { id: 'e-syk', label: 'Du blir syk', strandId: 'syk', Icon: Thermometer },
    { id: 'e-jobb', label: 'Du mister jobben', strandId: 'jobb', Icon: Briefcase },
    { id: 'e-barn', label: 'Du får barn', strandId: 'barn', Icon: Baby },
    { id: 'e-gammel', label: 'Du blir gammel', strandId: 'gammel', Icon: Armchair },
    { id: 'e-ufor', label: 'Du blir ufør', strandId: 'ufor', Icon: Accessibility },
];

const YEARS = [1930, 1946, 1949, 1957, 1960, 1967];

// --- Akt 2: hvem holder nettet oppe? ---
// Modellen hviler på et regnestykke: mange betaler inn, få tar ut. Eleven setter
// hvor mange av 100 voksne som er i jobb, og ser nettet stramme seg eller ryke.
// MERK: henget er en tegning som viser sammenhengen. Det finnes ingen reell terskel
// der nettet ryker, og komponenten sier det til eleven under panelet.

const NET_X0 = 24;
const NET_X1 = 376;
const NET_Y = 96;
const FLOOR2_Y = 250;
const TORN_BELOW = 62;
const DOTS = 20; // hver prikk = 5 voksne

interface Preset {
    id: string;
    label: string;
    workers: number;
    caption: string;
}

// Bare tall vi har kildebelegg for oppgis. Ingen sysselsettingsandel for 1967 finnes
// verifisert, derfor er «Mange holder» merket som tenkt situasjon uten årstall.
const PRESETS: Preset[] = [
    {
        id: 'mange',
        label: 'Mange holder',
        workers: 90,
        caption:
            'Tenkt situasjon: nesten alle voksne er i jobb. Jo flere som holder, jo strammere er nettet.',
    },
    {
        id: 'idag',
        label: 'I dag',
        workers: 80,
        caption:
            'I 2025 var 79,7 prosent av dem mellom 20 og 64 år i jobb, ned fra 81,2 prosent i 2022 (SSB).',
    },
    {
        id: 'faerre',
        label: 'Flere faller ut',
        workers: 65,
        caption:
            'Ved utgangen av 2025 fikk 374 900 personer uføretrygd, 10,5 prosent av alle mellom 18 og 67 år (Nav).',
    },
];

// Henget vokser når færre holder. Ren illustrasjon, ikke en beregning.
function sagFor(workers: number) {
    // Taket gjør at et røket nett fortsatt ligger godt over gulvet, slik at eleven
    // ser forskjell på å bli tatt imot og å falle helt gjennom.
    return Math.min(90, Math.round(10 + (100 - workers) * 2));
}

function netPath(sag: number) {
    const cx = (NET_X0 + NET_X1) / 2;
    return `M ${NET_X0} ${NET_Y} Q ${cx} ${NET_Y + sag * 2} ${NET_X1} ${NET_Y}`;
}

const PANEL_H = 300;
const TOP_Y = 18;
const STRAND_Y = [62, 100, 138, 176, 214];
const FLOOR_Y = 272;

export function Sikkerhetsnettet({
    title = 'Sikkerhetsnettet',
    initialAct = 1,
}: SikkerhetsnettetProps) {
    const reduceMotion = useReducedMotion();
    const [act, setAct] = useState<1 | 2>(initialAct);
    const [year, setYear] = useState(1930);
    const [phase, setPhase] = useState<Phase>('idle');
    const [found, setFound] = useState<string[]>([]);
    const [drop, setDrop] = useState<{ key: number; strandIndex: number; caught: boolean } | null>(
        null
    );
    const [message, setMessage] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    // Akt 2
    const [workers, setWorkers] = useState(80);
    const [caption, setCaption] = useState<string | null>(null);
    const [drop2, setDrop2] = useState<{ key: number; torn: boolean } | null>(null);
    const [attempt2, setAttempt2] = useState(0);

    const done = found.length === EVENTS.length;
    const sag = sagFor(workers);
    const torn = workers < TORN_BELOW;
    const strain = workers >= 85 ? 'stramt' : torn ? 'roket' : 'slakt';
    const netColor = strain === 'stramt' ? '#10b981' : strain === 'slakt' ? '#f59e0b' : '#f43f5e';
    const filledDots = Math.round((workers / 100) * DOTS);

    const sagSpring = useSpring(sag, { stiffness: 170, damping: 20 });
    const netD = useTransform(sagSpring, (v) => netPath(v));
    useEffect(() => {
        if (reduceMotion) sagSpring.jump(sag);
        else sagSpring.set(sag);
    }, [sag, reduceMotion, sagSpring]);

    const handleDrop2 = () => {
        const next = attempt2 + 1;
        setAttempt2(next);
        setDrop2({ key: next, torn });
    };

    const handleEvent = (event: LifeEvent) => {
        if (phase === 'complete') return;
        const index = STRANDS.findIndex((s) => s.id === event.strandId);
        const strand = STRANDS[index];
        const caught = year >= strand.year;
        const next = attempt + 1;
        setAttempt(next);
        setDrop({ key: next, strandIndex: index, caught });

        if (caught) {
            const alreadyFound = found.includes(strand.id);
            const updated = alreadyFound ? found : [...found, strand.id];
            setFound(updated);
            setMessage(
                `${strand.ordning} kom i ${strand.year}. I ${year} tar den imot deg. ${strand.note}`
            );
            if (updated.length === EVENTS.length) {
                setPhase('complete');
            } else {
                setPhase('caught');
            }
        } else {
            setPhase('fell');
            setMessage(
                `I ${year} fantes ikke ${strand.ordning.toLowerCase()} ennå. Du falt rett gjennom, ned til fattigkassa i kommunen. Prøv et senere årstall.`
            );
        }
    };

    const handleReset = () => {
        setYear(1930);
        setPhase('idle');
        setFound([]);
        setDrop(null);
        setMessage(null);
        setAttempt(0);
        setWorkers(80);
        setCaption(null);
        setDrop2(null);
        setAttempt2(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {act === 1
                            ? 'Velg et årstall, og klikk på en hendelse. Finn året da hver av de fem trådene i nettet kom på plass.'
                            : 'Sett hvor mange av 100 voksne som er i jobb, og slipp en hendelse ned i nettet. Hvor få kan holde før det ryker?'}
                    </p>
                </div>
            </div>

            {/* Aktvelger - begge alltid tilgjengelige, så ingen elev blir låst ute */}
            <div className="px-6 pt-4 flex flex-wrap gap-2">
                {([1, 2] as const).map((a) => {
                    const label = a === 1 ? '1. Trådene i nettet' : '2. Hvem holder nettet oppe?';
                    const pulse = a === 2 && act === 1 && phase === 'complete';
                    return (
                        <button
                            key={a}
                            onClick={() => setAct(a)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                act === a
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            } ${pulse ? 'ring-2 ring-emerald-400 animate-pulse' : ''}`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {act === 1 && (
                <>
                    {/* Årstallsvelger */}
                    <div className="px-6 pt-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mr-1">
                                Årstall
                            </span>
                            {YEARS.map((y) => (
                                <button
                                    key={y}
                                    onClick={() => {
                                        setYear(y);
                                        setDrop(null);
                                        if (phase !== 'complete') setPhase('idle');
                                        setMessage(null);
                                    }}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                                        year === y
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Nettet */}
                    <div className="px-6 pt-5">
                        <div
                            className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
                            style={{ height: PANEL_H }}
                        >
                            {/* Trådene */}
                            {STRANDS.map((s, i) => {
                                const active = year >= s.year;
                                return (
                                    <div
                                        key={s.id}
                                        className="absolute left-0 right-0 flex items-center gap-3 px-4"
                                        style={{ top: STRAND_Y[i] - 12, height: 24 }}
                                    >
                                        <motion.div
                                            className="flex-1 rounded-full"
                                            animate={{
                                                height: active ? 7 : 3,
                                                backgroundColor: active ? '#10b981' : '#cbd5e1',
                                                opacity: active ? 1 : 0.6,
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 220,
                                                damping: 24,
                                            }}
                                        />
                                        <div
                                            className={`w-52 shrink-0 text-right text-xs leading-tight ${
                                                active ? 'text-emerald-700' : 'text-slate-400'
                                            }`}
                                        >
                                            <span className="font-semibold">{s.ordning}</span>
                                            <span className="block">{s.year}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Folketrygden 1967 - alt samles i én lov */}
                            <AnimatePresence>
                                {year >= 1967 && (
                                    <motion.div
                                        initial={{ opacity: 0, scaleX: 0.6 }}
                                        animate={{ opacity: 1, scaleX: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                                        className="absolute left-4 right-4 rounded-lg bg-indigo-100 border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 text-center"
                                        style={{ top: FLOOR_Y - 26 }}
                                    >
                                        Folketrygden 1967: alle trådene samlet i én lov
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Fattigkassa - bunnen du faller til */}
                            {year < 1967 && (
                                <div
                                    className="absolute left-4 right-4 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-400 text-center"
                                    style={{ top: FLOOR_Y - 26 }}
                                >
                                    Fattigkassa i kommunen
                                </div>
                            )}

                            {/* Figuren som faller */}
                            <AnimatePresence>
                                {drop && (
                                    <motion.div
                                        key={drop.key}
                                        initial={{ top: TOP_Y, opacity: 0.2, scale: 0.7 }}
                                        animate={{
                                            top: drop.caught
                                                ? STRAND_Y[drop.strandIndex] - 20
                                                : FLOOR_Y - 46,
                                            opacity: 1,
                                            scale: 1,
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: drop.caught ? 260 : 90,
                                            damping: drop.caught ? 14 : 18,
                                        }}
                                        className={`absolute w-8 h-8 rounded-full border-2 ${
                                            drop.caught
                                                ? 'bg-emerald-500 border-emerald-600'
                                                : 'bg-rose-500 border-rose-600'
                                        }`}
                                        style={{ left: 60 }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Fullført-feiring - egen linje under nettet, så den aldri
                    legger seg oppå trådene eller folketrygd-bjelken. */}
                        <AnimatePresence>
                            {phase === 'complete' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                                    className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white"
                                >
                                    Hele nettet er vevd. Fem tråder, fem vedtak, tjueen år.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Hendelsene eleven kan utløse */}
                    <div className="px-6 pt-4">
                        <div className="flex flex-wrap gap-2">
                            {EVENTS.map((e) => {
                                const isFound = found.includes(e.strandId);
                                return (
                                    <button
                                        key={e.id}
                                        onClick={() => handleEvent(e)}
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${
                                            isFound
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-white border-slate-200 text-slate-700 hover:shadow-md hover:border-slate-300'
                                        }`}
                                    >
                                        <e.Icon className="w-4 h-4" />
                                        {e.label}
                                        {isFound && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback-sone - alltid til stede */}
                    <div className="px-6 pt-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${phase}-${attempt}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`rounded-lg border px-4 py-3 text-sm ${
                                    phase === 'fell'
                                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                                        : phase === 'idle'
                                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}
                            >
                                {message ??
                                    'Start i 1930. Klikk på en hendelse og se hva som skjer når det ikke finnes noe nett under deg.'}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Kontrollrad */}
                    <div className="px-6 py-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                                {found.length}/5 tråder funnet
                            </span>
                            <div className="w-32 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-emerald-500"
                                    animate={{ width: `${(found.length / EVENTS.length) * 100}%` }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                                />
                            </div>
                            {done && (
                                <span className="text-sm font-semibold text-emerald-700">
                                    Ferdig!
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Tilbakestill
                        </button>
                    </div>
                </>
            )}

            {act === 2 && (
                <>
                    {/* Hvor mange holder nettet oppe? */}
                    <div className="px-6 pt-5">
                        <label
                            htmlFor="sikkerhetsnettet-andel"
                            className="flex items-center gap-2 text-sm font-medium text-slate-700"
                        >
                            <Users className="w-4 h-4 text-indigo-500" />
                            Av 100 voksne er{' '}
                            <span className="font-bold text-indigo-600">{workers}</span> i jobb og
                            betaler skatt
                        </label>
                        <input
                            id="sikkerhetsnettet-andel"
                            type="range"
                            min={50}
                            max={100}
                            value={workers}
                            onChange={(e) => {
                                setWorkers(Number(e.target.value));
                                setCaption(null);
                                setDrop2(null);
                            }}
                            className="mt-2 w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>50</span>
                            <span>100</span>
                        </div>
                    </div>

                    {/* Nettet som henger i dem som holder */}
                    <div className="px-6 pt-3">
                        <div
                            className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
                            style={{ height: PANEL_H }}
                        >
                            {/* De som holder */}
                            <div
                                className="absolute left-6 right-6 flex justify-between"
                                style={{ top: 24 }}
                            >
                                {Array.from({ length: DOTS }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={`w-2.5 h-2.5 rounded-full ${
                                            i < filledDots
                                                ? 'bg-emerald-500'
                                                : 'bg-slate-200 border border-slate-300'
                                        }`}
                                        animate={{ scale: i < filledDots ? 1 : 0.7 }}
                                        transition={
                                            reduceMotion
                                                ? { duration: 0 }
                                                : { type: 'spring', stiffness: 260, damping: 20 }
                                        }
                                    />
                                ))}
                            </div>

                            <svg
                                viewBox="0 0 400 300"
                                preserveAspectRatio="none"
                                className="absolute inset-0 w-full h-full"
                            >
                                {torn ? (
                                    <>
                                        <path
                                            d={`M ${NET_X0} ${NET_Y} Q 120 ${NET_Y + sag * 1.4} 180 ${NET_Y + sag}`}
                                            stroke={netColor}
                                            strokeWidth={5}
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                        <path
                                            d={`M 220 ${NET_Y + sag} Q 280 ${NET_Y + sag * 1.4} ${NET_X1} ${NET_Y}`}
                                            stroke={netColor}
                                            strokeWidth={5}
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                    </>
                                ) : (
                                    <motion.path
                                        d={netD}
                                        stroke={netColor}
                                        strokeWidth={5}
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                )}
                            </svg>

                            <div
                                className="absolute left-6 right-6 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-400 text-center"
                                style={{ top: FLOOR2_Y }}
                            >
                                Ingen ordninger igjen å falle ned i
                            </div>

                            <AnimatePresence>
                                {drop2 && (
                                    <motion.div
                                        key={drop2.key}
                                        initial={{ top: 40, opacity: 0.3, scale: 0.7 }}
                                        animate={{
                                            top: drop2.torn ? FLOOR2_Y - 28 : NET_Y + sag - 16,
                                            opacity: 1,
                                            scale: 1,
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={
                                            reduceMotion
                                                ? { duration: 0 }
                                                : {
                                                      type: 'spring',
                                                      stiffness: drop2.torn ? 90 : 240,
                                                      damping: drop2.torn ? 18 : 12,
                                                  }
                                        }
                                        className={`absolute w-8 h-8 rounded-full border-2 ${
                                            drop2.torn
                                                ? 'bg-rose-500 border-rose-600'
                                                : 'bg-emerald-500 border-emerald-600'
                                        }`}
                                        style={{ left: '46%' }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Ærlighetsforbehold: tallene er ekte, henget er en tegning. */}
                        <p className="mt-2 text-xs text-slate-400">
                            Tallene på skalaen er ekte. Hvor mye nettet henger, er en tegning som
                            viser sammenhengen, ikke en beregning.
                        </p>
                    </div>

                    {/* Knapper */}
                    <div className="px-6 pt-4 flex flex-wrap gap-2">
                        <button
                            onClick={handleDrop2}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:shadow-md hover:border-slate-300"
                        >
                            Slipp en hendelse
                        </button>
                        {PRESETS.map((pre) => (
                            <button
                                key={pre.id}
                                onClick={() => {
                                    setWorkers(pre.workers);
                                    setCaption(pre.caption);
                                    setDrop2(null);
                                }}
                                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                                    workers === pre.workers
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {pre.label}
                            </button>
                        ))}
                    </div>

                    {/* Forklaring */}
                    <div className="px-6 py-5">
                        <div
                            className={`rounded-lg border px-4 py-3 text-sm ${
                                strain === 'stramt'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : strain === 'slakt'
                                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                                      : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {caption ??
                                (strain === 'stramt'
                                    ? 'Mange betaler inn og få tar ut. Nettet er stramt, og det tar imot den som faller.'
                                    : strain === 'slakt'
                                      ? 'Færre holder, og flere henger i nettet. Det holder fortsatt, men det henger tyngre.'
                                      : 'Nå er det for få som holder. Nettet ryker, og det finnes ingen ordning under til å ta imot.')}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
