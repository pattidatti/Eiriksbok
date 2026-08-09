import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, RotateCcw } from 'lucide-react';

// Naam Karan: navneseremonien i sikhismen. Eleven åpner Guru Granth Sahib på en
// tilfeldig side, får bokstaven som siden begynner med, velger et navn på den
// bokstaven og legger til Singh eller Kaur.
//
// Lyspære-øyeblikket: navnet ditt blir ikke valgt av foreldrene alene. Første
// bokstav kommer fra en tilfeldig side i den hellige boka, og etternavnet er
// likt for alle - så ingen kan lese familie eller kaste ut av navnet.

interface LetterOption {
    // Bokstaven slik den skrives i gurmukhi-alfabetet.
    gurmukhi: string;
    // Slik bokstaven uttales/skrives med våre bokstaver.
    lyd: string;
    navn: string[];
}

interface SikhNavneseremoniProps {
    title?: string;
    letters?: LetterOption[];
}

const STANDARD_LETTERS: LetterOption[] = [
    { gurmukhi: 'ਸ', lyd: 'S', navn: ['Simran', 'Satnam', 'Sukhdeep'] },
    { gurmukhi: 'ਗ', lyd: 'G', navn: ['Gurpreet', 'Gagan', 'Gurdeep'] },
    { gurmukhi: 'ਹ', lyd: 'H', navn: ['Harpreet', 'Harjit', 'Himmat'] },
    { gurmukhi: 'ਜ', lyd: 'J', navn: ['Jasmeet', 'Jagdeep', 'Jaswinder'] },
    { gurmukhi: 'ਮ', lyd: 'M', navn: ['Manpreet', 'Mandeep', 'Manjit'] },
    { gurmukhi: 'ਕ', lyd: 'K', navn: ['Kiran', 'Karamjit', 'Kulwinder'] },
    { gurmukhi: 'ਅ', lyd: 'A', navn: ['Amrit', 'Arjan', 'Avtar'] },
    { gurmukhi: 'ਪ', lyd: 'P', navn: ['Paramjit', 'Prabhjot', 'Pardeep'] },
];

type Phase = 'lukket' | 'bokstav' | 'navn' | 'ferdig';

export function SikhNavneseremoni({
    title = 'Navneseremonien (Naam Karan)',
    letters = STANDARD_LETTERS,
}: SikhNavneseremoniProps) {
    const [phase, setPhase] = useState<Phase>('lukket');
    const [side, setSide] = useState(0);
    const [valgt, setValgt] = useState<LetterOption | null>(null);
    const [fornavn, setFornavn] = useState('');
    const [etternavn, setEtternavn] = useState('');

    const handleReset = () => {
        setPhase('lukket');
        setSide(0);
        setValgt(null);
        setFornavn('');
        setEtternavn('');
    };

    const apneBoka = () => {
        // Guru Granth Sahib har 1430 sider. Vi slår opp på en tilfeldig side.
        setSide(1 + Math.floor(Math.random() * 1430));
        setValgt(letters[Math.floor(Math.random() * letters.length)]);
        setPhase('bokstav');
    };

    const velgNavn = (n: string) => {
        setFornavn(n);
        setPhase('navn');
    };

    const velgEtternavn = (e: string) => {
        setEtternavn(e);
        setPhase('ferdig');
    };

    const beskjed =
        phase === 'lukket'
            ? 'Trykk på boka for å slå opp en tilfeldig side.'
            : phase === 'bokstav'
              ? 'Velg et navn som begynner på denne bokstaven.'
              : phase === 'navn'
                ? 'Legg til etternavnet: Singh eller Kaur.'
                : 'Ferdig. Navnet er gitt.';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Gi barnet et navn slik sikhene gjør det: la boka bestemme bokstaven.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                <div className="grid gap-5 md:grid-cols-[minmax(0,17rem)_1fr] md:items-start">
                    {/* Boka */}
                    <button
                        type="button"
                        onClick={phase === 'lukket' ? apneBoka : undefined}
                        disabled={phase !== 'lukket'}
                        aria-label="Slå opp en tilfeldig side i Guru Granth Sahib"
                        className={`w-full rounded-xl border p-5 text-left ${
                            phase === 'lukket'
                                ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer shadow-sm hover:shadow-md'
                                : 'border-slate-200 bg-slate-50 cursor-default'
                        }`}
                    >
                        <motion.div
                            animate={{ rotateX: phase === 'lukket' ? 0 : -12 }}
                            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
                            className="rounded-lg bg-white border border-amber-200 px-4 py-6 text-center shadow-inner"
                        >
                            <AnimatePresence mode="wait">
                                {phase === 'lukket' ? (
                                    <motion.div
                                        key="lukket"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="text-4xl">📖</div>
                                        <p className="mt-2 text-sm font-semibold text-amber-800">
                                            Guru Granth Sahib
                                        </p>
                                        <p className="text-xs text-slate-500">1430 sider</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="apen"
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                    >
                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                            Side {side}
                                        </p>
                                        <div className="mt-1 text-6xl leading-none text-indigo-700">
                                            {valgt?.gurmukhi}
                                        </div>
                                        <p className="mt-2 text-sm font-semibold text-slate-700">
                                            Uttales «{valgt?.lyd}»
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                        <p className="mt-3 text-xs text-slate-500">
                            {phase === 'lukket'
                                ? 'Klikk her for å slå opp.'
                                : 'Siden er slått opp. Bokstaven er bestemt.'}
                        </p>
                    </button>

                    {/* Valg */}
                    <div className="min-w-0">
                        <AnimatePresence mode="wait">
                            {phase === 'lukket' && (
                                <motion.p
                                    key="vent"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm text-slate-500"
                                >
                                    I gurdwaraen slår en av de voksne opp boka på måfå. Bokstaven
                                    øverst på siden bestemmer hva barnet skal hete.
                                </motion.p>
                            )}

                            {phase === 'bokstav' && valgt && (
                                <motion.div
                                    key="navnevalg"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <p className="text-sm font-semibold text-slate-700 mb-3">
                                        Navn som begynner på «{valgt.lyd}»:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {valgt.navn.map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => velgNavn(n)}
                                                className="bg-slate-100 hover:bg-indigo-100 text-slate-700 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {phase === 'navn' && (
                                <motion.div
                                    key="etternavn"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <p className="text-sm font-semibold text-slate-700 mb-3">
                                        Alle sikher får det samme etternavnet. Velg:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => velgEtternavn('Singh')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                                        >
                                            Singh (løve)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => velgEtternavn('Kaur')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                                        >
                                            Kaur (prinsesse)
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {phase === 'ferdig' && (
                                <motion.div
                                    key="ferdig"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                    className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center"
                                >
                                    <Sparkles className="w-6 h-6 text-emerald-500 mx-auto" />
                                    <p className="mt-2 text-2xl font-bold text-emerald-900">
                                        {fornavn} {etternavn}
                                    </p>
                                    <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
                                        Ingen kan lese ut av dette navnet hvilken familie, yrkesgruppe
                                        eller kaste barnet kommer fra. Det er hele poenget.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                {beskjed}
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                    Steg {phase === 'lukket' ? 1 : phase === 'bokstav' ? 2 : 3} av 3
                </p>
                <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
