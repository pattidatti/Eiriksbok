import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, CheckCircle2 } from 'lucide-react';

interface ChurchAnswer {
    name: string;
    short: string;
    explanation: string;
}

interface BibleVerse {
    text: string;
    ref: string;
}

interface Dimension {
    id: string;
    label: string;
    question: string;
    verses: BibleVerse[];
    churches: [ChurchAnswer, ChurchAnswer, ChurchAnswer];
}

interface BaptismComparatorProps {
    title?: string;
}

const DIMENSIONS: Dimension[] = [
    {
        id: 'hvem',
        label: 'Hvem?',
        question: 'Hvem kan bli døpt?',
        verses: [
            {
                text: 'Vend om og la dere døpe i Jesu Kristi navn, hver og en av dere, så dere kan få tilgivelse for syndene.',
                ref: 'Apostlenes gjerninger 2,38 (Bibelen 2011) - brukes av baptistene',
            },
            {
                text: 'La de små barna komme til meg, og hindre dem ikke! For Guds rike tilhører slike som dem.',
                ref: 'Markus 10,14 (Bibelen 2011) - brukes til forsvar for barnedåpen',
            },
        ],
        churches: [
            {
                name: 'Baptistene',
                short: 'Bare den som selv kan tro',
                explanation:
                    'Dåpen er forbeholdt mennesker som kan stå personlig inne for kristendommen sin. Slik baptistene ser det, kan et spedbarn ikke ta det valget. Derfor tar de avstand fra barnedåp.',
            },
            {
                name: 'Den norske kirke',
                short: 'Spedbarn og voksne',
                explanation:
                    'Barnedåp er det vanlige, men kirken sier at du kan bli døpt når som helst i livet. Er du udøpt og vil bli medlem som ungdom eller voksen, brukes en tilpasset dåpsliturgi.',
            },
            {
                name: 'Den katolske kirke',
                short: 'Helst som spedbarn',
                explanation:
                    'Katekismen lærer at spedbarn fødes med en skadet menneskenatur og trenger å bli gjenfødt i dåpen. Å vente ville være å frata barnet en uvurderlig nåde.',
            },
        ],
    },
    {
        id: 'metode',
        label: 'Hvordan?',
        question: 'Hvordan blir dåpen utført?',
        verses: [
            {
                text: 'Da Jesus var blitt døpt, steg han straks opp av vannet.',
                ref: 'Matteus 3,16 (Bibelen 2011)',
            },
        ],
        churches: [
            {
                name: 'Baptistene',
                short: 'Gjerne full neddykking',
                explanation:
                    'Hele kroppen senkes under vann. De aller første baptistene på 1600-tallet øste derimot vann over hodet. Full neddykking ble tatt i bruk fra 1641.',
            },
            {
                name: 'Den norske kirke',
                short: 'Vann øses over hodet',
                explanation:
                    'Presten øser tre håndfuller vann over hodet og sier: «Jeg døper deg til Faderens, Sønnens og Den Hellige Ånds navn.»',
            },
            {
                name: 'Den katolske kirke',
                short: 'Neddykking eller overøsing',
                explanation:
                    'Katekismen sier at dåpen utføres mest meningsfullt ved trefoldig neddykking, men at den siden antikken også har kunnet skje ved å øse vann tre ganger over hodet.',
            },
        ],
    },
    {
        id: 'teologi',
        label: 'Hva betyr det?',
        question: 'Hva skjer i dåpen?',
        verses: [
            {
                text: 'Den som tror og blir døpt, skal bli frelst.',
                ref: 'Markus 16,16 (Bibelen 2011)',
            },
        ],
        churches: [
            {
                name: 'Baptistene',
                short: 'En bekreftelse på troen',
                explanation:
                    'Dåpen bekrefter et valg som allerede er tatt. Den kalles troendes dåp og er et uttrykk for en personlig trosoverbevisning. Troen kommer først, dåpen etterpå.',
            },
            {
                name: 'Den norske kirke',
                short: 'Sakrament og gave',
                explanation:
                    'Dåpen regnes som det første og viktigste sakramentet, altså en hellig handling der Gud gir noe. Begrunnelsen for barnedåpen er at troen og tilgivelsen dåpen er et tegn på, er en gave og ikke noe mennesket kan gjøre seg fortjent til.',
            },
            {
                name: 'Den katolske kirke',
                short: 'Gjenfødelsens sakrament',
                explanation:
                    'Katekismen kaller dåpen «gjenfødelsens sakrament ved vannet og i Ordet». Den er samtidig troens sakrament: troen som kreves, er en begynnelse som skal vokse videre.',
            },
        ],
    },
    {
        id: 'konsekvens',
        label: 'Hva skjer etterpå?',
        question: 'Hva betyr dåpen for fellesskapet?',
        verses: [
            {
                text: 'For med én Ånd ble vi alle døpt til å være én kropp.',
                ref: '1. Korinterbrev 12,13 (Bibelen 2011)',
            },
        ],
        churches: [
            {
                name: 'Baptistene',
                short: 'Inn i en menighet av troende',
                explanation:
                    'Du blir del av en lokal menighet som styrer seg selv og ansetter sin egen pastor. Den som kommer fra en kirke med barnedåp, må døpes på nytt ved opptaket.',
            },
            {
                name: 'Den norske kirke',
                short: 'Medlemskap i kirken',
                explanation:
                    'Dåpen er kriteriet for medlemskap. Er du allerede døpt i et annet kristent trossamfunn, trengs ingen ny dåp. Foreldre og faddere blir bedt om å be for barnet.',
            },
            {
                name: 'Den katolske kirke',
                short: 'Det første av tre skritt',
                explanation:
                    'Dåpen er det første av sakramentene som innvier i det kristne liv. Foreldre, faddere og hele menigheten har ansvar for at dåpens nåde får vokse videre.',
            },
        ],
    },
];

const CHURCH_COLORS = [
    {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-800',
    },
    {
        border: 'border-amber-500',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800',
    },
    {
        border: 'border-emerald-600',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800',
    },
];

export function BaptismComparator({ title = 'Tre kirker, tre svar' }: BaptismComparatorProps) {
    const [active, setActive] = useState<string>(DIMENSIONS[0].id);
    const [explored, setExplored] = useState<Set<string>>(new Set([DIMENSIONS[0].id]));

    const activeDim = DIMENSIONS.find((d) => d.id === active)!;
    const allExplored = explored.size === DIMENSIONS.length;

    const handleSelect = (id: string) => {
        setActive(id);
        setExplored((prev) => new Set([...prev, id]));
    };

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="rounded-lg bg-blue-100 p-2">
                    <Droplets className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på et spørsmål og se hva de tre kirkene svarer
                    </p>
                </div>
                <div className="ml-auto text-sm font-medium text-slate-400">
                    {explored.size}/{DIMENSIONS.length} utforsket
                </div>
            </div>

            {/* Dimension tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50">
                {DIMENSIONS.map((dim) => {
                    const isExplored = explored.has(dim.id);
                    const isActive = active === dim.id;
                    return (
                        <button
                            key={dim.id}
                            onClick={() => handleSelect(dim.id)}
                            className={`relative flex-1 px-3 py-3 text-sm font-medium transition-all ${
                                isActive
                                    ? 'border-b-2 border-blue-500 bg-white text-blue-700'
                                    : isExplored
                                      ? 'text-slate-600 hover:bg-white'
                                      : 'text-slate-400 hover:bg-white hover:text-slate-600'
                            }`}
                        >
                            {dim.label}
                            {isExplored && !isActive && (
                                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                    >
                        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {activeDim.question}
                        </p>

                        {/* Church cards */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {activeDim.churches.map((church, i) => {
                                const color = CHURCH_COLORS[i];
                                return (
                                    <motion.div
                                        key={church.name}
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.06 }}
                                        className={`rounded-xl border border-slate-200 border-t-4 bg-white p-4 shadow-sm ${color.border}`}
                                    >
                                        <p
                                            className={`text-xs font-bold uppercase tracking-wide ${color.text} mb-1`}
                                        >
                                            {church.name}
                                        </p>
                                        <p className="mb-2 text-sm font-semibold text-slate-800">
                                            {church.short}
                                        </p>
                                        <p className="text-xs leading-relaxed text-slate-600">
                                            {church.explanation}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Bible verses */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
                        >
                            {activeDim.verses.map((verse) => (
                                <div
                                    key={verse.ref}
                                    className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3"
                                >
                                    <p className="text-sm italic text-blue-800">«{verse.text}»</p>
                                    <p className="mt-1 text-xs text-blue-500">{verse.ref}</p>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Completion banner */}
            <AnimatePresence>
                {allExplored && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-6 mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
                    >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <p className="text-sm text-emerald-700">
                            Du har vært gjennom alle fire spørsmålene. Alle tre kirkene bygger på
                            Bibelen, men de leser den ulikt og legger vekt på ulike tekster. Ingen
                            av svarene er «det kristne svaret»: dette er en uenighet kristne har
                            hatt med hverandre i flere hundre år.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="px-6 pb-5 text-xs text-slate-400">
                Kilder: Store norske leksikon (baptisme, dåp), Den katolske kirkes katekisme og Den
                norske kirke. Se kildelisten nederst i artikkelen.
            </p>
        </div>
    );
}
