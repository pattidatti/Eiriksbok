import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, RotateCcw, Sparkles } from 'lucide-react';

interface IsoglossKartetProps {
    title?: string;
}

interface Isogloss {
    id: string;
    navn: string;
    forklaring: string;
    farge: string;
    d: string;
    // Isoglosser som følger Langfjella og bunter seg til øst-vest-skillet.
    buntet: boolean;
}

// Omtrentlige linjer, tegnet for å vise prinsippet - ikke et nøyaktig dialektatlas.
const ISOGLOSSER: Isogloss[] = [
    {
        id: 'jamvekt',
        navn: 'Jamvekt',
        forklaring:
            'Grensen for jamvekt og kløyvd infinitiv går fra Langesundsfjorden, gjennom sørvestre Telemark, følger Langfjella og videre mellom Romsdal og Nordmøre.',
        farge: '#4f46e5',
        d: 'M 258 438 C 236 414 210 380 196 340 C 185 305 180 275 186 252',
        buntet: true,
    },
    {
        id: 'tjukk-l',
        navn: 'Tjukk l',
        forklaring:
            'Tjukk l hører hjemme i østlandsk og trøndersk. Den mangler på Vestlandet og i det meste av Nord-Norge.',
        farge: '#0891b2',
        d: 'M 266 445 C 242 410 206 372 192 335 C 180 300 178 268 196 240 C 205 226 214 216 222 206',
        buntet: true,
    },
    {
        id: 'tonelag',
        navn: 'Tonelag',
        forklaring:
            'Vest og nord har høy tone først i ordet, øst og Trøndelag har lav tone først. På kysten går skillet ved Lillesand.',
        farge: '#7c3aed',
        d: 'M 243 448 C 228 420 205 385 193 345 C 182 308 182 272 200 244',
        buntet: true,
    },
    {
        id: 'palatalisering',
        navn: 'Palatalisering',
        forklaring:
            'Den myke j-lyden i ord som «mannj» hører til et nordlig område. Grensen går så langt sør som Hedmark, mellom Valdres og Gudbrandsdalen.',
        farge: '#e11d48',
        d: 'M 262 372 C 246 340 226 300 224 262 C 226 226 240 190 258 160',
        buntet: false,
    },
    {
        id: 'skarre-r',
        navn: 'Skarre-r',
        forklaring:
            'Skarre-r kom fra Paris på 1600-tallet og nådde Kristiansand og Bergen rundt år 1800. Siden 1950-tallet har beltet vokst fra Risør mot Bergen.',
        farge: '#ea580c',
        d: 'M 268 442 C 240 430 200 400 170 366 C 156 348 146 334 140 322',
        buntet: false,
    },
];

// Den stiliserte omrisset av Norge som brukes ellers i dialekt-serien.
const NORGE =
    'M250 452 C 150 452 120 400 150 350 C 120 330 150 300 160 288 C 130 260 175 230 195 250 C 175 200 205 150 235 165 C 250 110 285 70 312 78 C 340 96 320 150 300 175 C 320 210 270 250 258 262 C 285 300 255 340 262 360 C 300 380 300 440 250 452 Z';

const BUNT_IDS = ISOGLOSSER.filter((i) => i.buntet).map((i) => i.id);

type Phase = 'idle' | 'active' | 'complete';

export function IsoglossKartet({ title = 'Isogloss-kartet' }: IsoglossKartetProps) {
    const [pa, setPa] = useState<string[]>([]);
    const [sist, setSist] = useState<Isogloss | null>(null);

    const antall = pa.length;
    const buntFerdig = BUNT_IDS.every((id) => pa.includes(id));
    const phase: Phase =
        antall === ISOGLOSSER.length ? 'complete' : antall === 0 ? 'idle' : 'active';

    const toggle = (iso: Isogloss) => {
        setPa((f) => (f.includes(iso.id) ? f.filter((x) => x !== iso.id) : [...f, iso.id]));
        setSist(iso);
    };

    const handleReset = () => {
        setPa([]);
        setSist(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Map className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Slå på ett målmerke om gangen, og se hvor grensen for akkurat det trekket
                        går.
                    </p>
                </div>
            </div>

            <div className="p-5 grid md:grid-cols-[minmax(0,280px)_1fr] gap-5 items-start">
                {/* Kartet */}
                <div className="relative mx-auto w-full max-w-[280px]">
                    <svg viewBox="0 0 400 480" className="w-full h-auto" role="img">
                        <title>Kart over Norge med isoglosser</title>
                        <path d={NORGE} fill="#eef2f7" stroke="#cbd5e1" strokeWidth={2} />

                        {/* Buntet sone: dukker opp når de tre øst-vest-linjene er på */}
                        <AnimatePresence>
                            {buntFerdig && (
                                <motion.path
                                    key="bunt"
                                    d="M 252 446 C 230 414 200 378 188 338 C 176 302 176 268 194 240"
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth={26}
                                    strokeLinecap="round"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 0.5, 0.28] }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.1 }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Isoglossene */}
                        {ISOGLOSSER.map((iso) => (
                            <AnimatePresence key={iso.id}>
                                {pa.includes(iso.id) && (
                                    <motion.path
                                        d={iso.d}
                                        fill="none"
                                        stroke={iso.farge}
                                        strokeWidth={3.5}
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.75, ease: 'easeInOut' }}
                                    />
                                )}
                            </AnimatePresence>
                        ))}
                    </svg>

                    <div className="text-center text-[11px] text-slate-400 mt-1">
                        Omtrentlige linjer, tegnet for å vise prinsippet
                    </div>
                </div>

                {/* Kontroller og forklaring */}
                <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                        {ISOGLOSSER.map((iso) => {
                            const aktiv = pa.includes(iso.id);
                            return (
                                <button
                                    key={iso.id}
                                    onClick={() => toggle(iso)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                        aktiv
                                            ? 'text-white border-transparent shadow-sm'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                    style={aktiv ? { backgroundColor: iso.farge } : undefined}
                                >
                                    {iso.navn}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 text-sm text-slate-500">
                        Isoglosser på kartet:{' '}
                        <span className="font-semibold text-slate-700 tabular-nums">{antall}</span>{' '}
                        av {ISOGLOSSER.length}
                    </div>

                    {/* Feedback-sone - alltid i DOM-et */}
                    <div className="mt-3 min-h-[92px]">
                        <AnimatePresence mode="wait">
                            {phase === 'idle' && (
                                <motion.div
                                    key="tom"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                                >
                                    Kartet er tomt. Trykk på et målmerke for å tegne isoglossen
                                    dens.
                                </motion.div>
                            )}

                            {phase !== 'idle' && (
                                <motion.div
                                    key={`${sist?.id}-${antall}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm leading-relaxed"
                                >
                                    <span className="font-semibold">{sist?.navn}:</span>{' '}
                                    {sist?.forklaring}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {buntFerdig && (
                                <motion.div
                                    key="bunt-melding"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                    className="mt-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm leading-relaxed flex gap-2"
                                >
                                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                                    <span>
                                        Se det gule beltet: jamvekt, tjukk l og tonelag følger
                                        hverandre langs Langfjella. Det er her vi sier at det går en
                                        dialektgrense - ikke fordi det finnes én strek, men fordi
                                        flere linjer flokker seg på samme sted.
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {phase === 'complete' && (
                                <motion.div
                                    key="ferdig"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                                    className="mt-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed"
                                >
                                    Alle fem er på. Legg merke til at palatalisering og skarre-r
                                    ikke følger de andre i det hele tatt. Ingen enkelt linje deler
                                    Norge i to - hvert trekk har sin egen grense.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <button
                            onClick={() => setPa(ISOGLOSSER.map((i) => i.id))}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            Vis alle
                        </button>
                        <button
                            onClick={handleReset}
                            className="text-slate-400 hover:text-slate-600 text-sm transition-colors inline-flex items-center gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Tilbakestill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
