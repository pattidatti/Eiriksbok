import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Anchor,
    ChevronRight,
    Church,
    Crown,
    Flame,
    RotateCcw,
    Ship,
    Sparkles,
    Swords,
    Waves,
} from 'lucide-react';

// Signaturkomponent for hansadrapet i Bergen 1. september 1455.
// Lyspære-øyeblikket: Hvem hadde egentlig makten i Bergen - den norske kongen
// eller de tyske hansakjøpmennene? Eleven stegger gjennom dramaet over Vågen,
// ser stedene lyse opp på kartet, og følger en makt-måler som glir fra Kongen
// mot Hansaen. Til slutt sitter innsikten igjen: kjøpmennene rådde, ikke kongen.

interface NordnesnattenProps {
    title?: string;
}

type Place = 'bryggen' | 'tinget' | 'munkeliv';

interface Beat {
    id: string;
    place: Place;
    label: string;
    text: string;
    hansaPower: number; // 0 = kongen rår, 100 = Hansaen rår fullstendig
    Icon: typeof Ship;
    showBoat?: boolean;
    showFire?: boolean;
}

const BEATS: Beat[] = [
    {
        id: 'bryggen',
        place: 'bryggen',
        label: 'Bryggen — Det tyske kontor',
        text: 'Tyske hansakjøpmenn styrte handelen i Bergen fra Bryggen. De var rike, mange og godt bevæpnet.',
        hansaPower: 62,
        Icon: Anchor,
    },
    {
        id: 'tinget',
        place: 'tinget',
        label: 'Tinget — overfallet',
        text: 'Olav Nilsson, kongens høvedsmann på Bergenhus, ville tvinge kjøpmennene under norsk lov. 1. september 1455 gikk tyskerne til angrep på ham på tinget.',
        hansaPower: 74,
        Icon: Swords,
    },
    {
        id: 'flukten',
        place: 'munkeliv',
        label: 'Flukten over Vågen',
        text: 'Olav, sønnen Nils, broren Peder og biskop Thorleiv flyktet i båt over havnebassenget mot Nordnes.',
        hansaPower: 82,
        Icon: Ship,
        showBoat: true,
    },
    {
        id: 'munkeliv',
        place: 'munkeliv',
        label: 'Munkeliv kloster',
        text: 'De søkte tilflukt i Munkeliv kloster på Nordnes og håpet at det hellige stedet ville verne dem.',
        hansaPower: 86,
        Icon: Church,
    },
    {
        id: 'brannen',
        place: 'munkeliv',
        label: 'Brannen',
        text: 'Kjøpmennene satte fyr på klosteret. Olav, biskopen og over 60 mann ble drept. Kongen turte ikke straffe Hansaen.',
        hansaPower: 100,
        Icon: Flame,
        showFire: true,
    },
];

// Posisjoner på det stiliserte Vågen-kartet (prosent av kartboksen).
const MARKERS: Record<Place, { x: number; y: number }> = {
    bryggen: { x: 76, y: 60 },
    tinget: { x: 80, y: 26 },
    munkeliv: { x: 18, y: 62 },
};

export function Nordnesnatten({ title = 'Nordnesnatten' }: NordnesnattenProps) {
    const [step, setStep] = useState(0); // 0..4 = beats, 5 = innsikt
    const isDone = step >= BEATS.length;
    const beatIndex = Math.min(step, BEATS.length - 1);
    const beat = BEATS[beatIndex];
    const activePlace = beat.place;
    const hansaPower = isDone ? 100 : beat.hansaPower;

    const handleNext = () => setStep((s) => Math.min(s + 1, BEATS.length));
    const handleReset = () => setStep(0);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-6 py-4">
                <Ship className="h-5 w-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk «Neste» og følg dramaet over Vågen. Hvem hadde egentlig makten i Bergen
                        i 1455?
                    </p>
                </div>
            </div>

            {/* Kart over Vågen */}
            <div className="px-4 pt-4 sm:px-6">
                <div className="relative w-full overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-b from-sky-100 to-sky-200">
                    <div className="relative w-full" style={{ paddingBottom: '58%' }}>
                        {/* Vann + landmasser */}
                        <svg
                            viewBox="0 0 200 130"
                            preserveAspectRatio="none"
                            className="absolute inset-0 h-full w-full"
                        >
                            <defs>
                                <linearGradient id="nn-land" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#c6e6c0" />
                                    <stop offset="100%" stopColor="#a7d49e" />
                                </linearGradient>
                            </defs>
                            {/* Nordnes (venstre halvøy) */}
                            <path
                                d="M0,130 L0,52 C22,47 44,58 51,82 C57,101 46,124 28,130 Z"
                                fill="url(#nn-land)"
                                stroke="#8bc47f"
                                strokeWidth="1"
                            />
                            {/* Byen + Bryggen + Bergenhus (høyre) */}
                            <path
                                d="M200,130 L200,20 C168,20 148,34 143,62 C138,92 156,122 178,130 Z"
                                fill="url(#nn-land)"
                                stroke="#8bc47f"
                                strokeWidth="1"
                            />
                        </svg>

                        {/* Vann-tekst */}
                        <div className="pointer-events-none absolute left-1/2 top-[42%] flex -translate-x-1/2 items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-sky-500/70">
                            <Waves className="h-3 w-3" /> Vågen
                        </div>

                        {/* Flukt-rute (stiplet bue) */}
                        <svg
                            viewBox="0 0 200 130"
                            preserveAspectRatio="none"
                            className="absolute inset-0 h-full w-full"
                        >
                            <motion.path
                                d="M158,42 Q100,30 40,78"
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="1.4"
                                strokeDasharray="3 3"
                                strokeLinecap="round"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat.showBoat ? 0.85 : 0 }}
                                transition={{ duration: 0.4 }}
                            />
                        </svg>

                        {/* Fluktbåt */}
                        <AnimatePresence>
                            {beat.showBoat && (
                                <motion.div
                                    key="boat"
                                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 text-indigo-600"
                                    initial={{ left: '79%', top: '32%', opacity: 0 }}
                                    animate={{
                                        left: ['79%', '50%', '20%'],
                                        top: ['32%', '24%', '60%'],
                                        opacity: 1,
                                    }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.8, ease: 'easeInOut' }}
                                >
                                    <Ship className="h-5 w-5 drop-shadow" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Stedmarkører */}
                        {(['tinget', 'bryggen', 'munkeliv'] as Place[]).map((place) => {
                            const pos = MARKERS[place];
                            const active = place === activePlace;
                            const meta =
                                place === 'bryggen'
                                    ? { name: 'Bryggen', Icon: Anchor }
                                    : place === 'tinget'
                                      ? { name: 'Bergenhus', Icon: Crown }
                                      : { name: 'Munkeliv', Icon: Church };
                            const MIcon = meta.Icon;
                            const onFire = active && beat.showFire;
                            return (
                                <div
                                    key={place}
                                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                >
                                    {/* Pulserende ring for aktivt sted */}
                                    <AnimatePresence>
                                        {active && (
                                            <motion.span
                                                key="ring"
                                                className={`absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                                                    onFire ? 'bg-rose-400/40' : 'bg-indigo-400/40'
                                                }`}
                                                initial={{ scale: 0.6, opacity: 0.8 }}
                                                animate={{ scale: [0.9, 1.6, 0.9], opacity: [0.7, 0, 0.7] }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 1.6, repeat: Infinity }}
                                            />
                                        )}
                                    </AnimatePresence>

                                    <motion.div
                                        animate={{ scale: active ? 1.12 : 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                        className={`relative flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ${
                                            onFire
                                                ? 'border-rose-300 bg-rose-500 text-white'
                                                : active
                                                  ? 'border-indigo-300 bg-indigo-600 text-white'
                                                  : 'border-slate-300 bg-white text-slate-500'
                                        }`}
                                    >
                                        {onFire ? (
                                            <motion.span
                                                animate={{ scale: [1, 1.25, 1], rotate: [-4, 4, -4] }}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                            >
                                                <Flame className="h-4 w-4" />
                                            </motion.span>
                                        ) : (
                                            <MIcon className="h-4 w-4" />
                                        )}
                                    </motion.div>
                                    <span
                                        className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded px-1.5 text-[10px] font-semibold ${
                                            active
                                                ? 'text-indigo-700'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        {meta.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Makt-måler */}
            <div className="px-4 pt-4 sm:px-6">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1 text-amber-700">
                            <Crown className="h-3.5 w-3.5" /> Kongen
                        </span>
                        <span className="text-slate-400">Hvem rår i Bergen?</span>
                        <span className="flex items-center gap-1 text-rose-700">
                            Hansaen <Anchor className="h-3.5 w-3.5" />
                        </span>
                    </div>
                    <div className="relative h-3 rounded-full bg-gradient-to-r from-amber-200 via-slate-200 to-rose-200">
                        <motion.div
                            className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-600 shadow-md"
                            animate={{ left: `${hansaPower}%` }}
                            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                        />
                    </div>
                </div>
            </div>

            {/* Fortellertekst / innsikt */}
            <div className="px-4 pb-2 pt-4 sm:px-6">
                <AnimatePresence mode="wait">
                    {isDone ? (
                        <motion.div
                            key="insight"
                            initial={{ opacity: 0, y: 14, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4"
                        >
                            {/* Suksess-glimt */}
                            {[...Array(7)].map((_, i) => (
                                <motion.span
                                    key={i}
                                    className="absolute top-3 left-4 text-emerald-400"
                                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0, 1, 0.4],
                                        x: (i - 3) * 26,
                                        y: [0, -18 - (i % 3) * 10, 6],
                                    }}
                                    transition={{ duration: 1.1, delay: 0.15 + i * 0.05 }}
                                >
                                    <Sparkles className="h-4 w-4" />
                                </motion.span>
                            ))}
                            <p className="flex items-center gap-2 font-semibold text-emerald-800">
                                <Sparkles className="h-4 w-4" /> Kjøpmennene hadde makten
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                                Kongen satt i København og trengte Hansaens hjelp, så han lot drapet
                                passere. I Bergen var det kjøpmennene, ikke kongen, som rådde.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={beat.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4"
                        >
                            <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                                <beat.Icon className="h-4 w-4" />
                                {beatIndex + 1}. {beat.label}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-blue-700">{beat.text}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Steg-prikker */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
                {BEATS.map((b, i) => (
                    <span
                        key={b.id}
                        className={`h-1.5 rounded-full transition-all ${
                            i === beatIndex && !isDone
                                ? 'w-5 bg-indigo-600'
                                : i < step
                                  ? 'w-1.5 bg-indigo-400'
                                  : 'w-1.5 bg-slate-300'
                        }`}
                    />
                ))}
            </div>

            {/* Kontrollrad */}
            <div className="flex items-center justify-between px-6 py-4">
                {!isDone ? (
                    <button
                        onClick={handleNext}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        {beatIndex === BEATS.length - 1 ? 'Se hva dramaet forteller' : 'Neste'}
                        <ChevronRight className="h-4 w-4" />
                    </button>
                ) : (
                    <span className="text-sm font-medium text-emerald-700">
                        Ferdig — makten lå hos Hansaen.
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
