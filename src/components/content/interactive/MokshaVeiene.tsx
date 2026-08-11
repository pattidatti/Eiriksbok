import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BookOpen, Heart, Star, RotateCcw } from 'lucide-react';

interface YogaPath {
    id: 'karma' | 'jnana' | 'bhakti';
    Icon: React.ComponentType<{ className?: string }>;
    name: string;
    subtitle: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    description: string;
    example: string;
    kjerne: string;
    kjerneKilde: string;
}

const YOGA_PATHS: YogaPath[] = [
    {
        id: 'karma',
        Icon: Zap,
        name: 'Karma Yoga',
        subtitle: 'Handlingens vei',
        bgClass: 'bg-orange-50',
        borderClass: 'border-orange-200',
        textClass: 'text-orange-600',
        description:
            'Veien gjennom handling. Du gjør pliktene som følger av din plass i livet, men uten egoistisk begjær etter hva du selv får igjen. I Bhagavadgita er dette svaret Krishna gir Arjuna når han blir lammet av tvil: handling er det rette, følg din natur, men handle uten egoistisk begjær.',
        example:
            'Bhagavadgita kritiserer asketer som trekker seg unna verden. I stedet forkynner den en streng pliktetikk der man deltar aktivt i samfunnet.',
        kjerne: 'Ikke hva du gjør, men med hvilket motiv du gjør det.',
        kjerneKilde: 'Jacobsen (2025b), Bhagavadgita, Store norske leksikon',
    },
    {
        id: 'jnana',
        Icon: BookOpen,
        name: 'Jnana Yoga',
        subtitle: 'Kunnskapens vei',
        bgClass: 'bg-cyan-50',
        borderClass: 'border-cyan-200',
        textClass: 'text-cyan-600',
        description:
            'Veien gjennom innsikt. Upanishadene knytter det innerste i mennesket (atman) til grunnlaget for hele universet (brahman). Skolen advaita vedanta lærer at de to er identiske: du er allerede brahman, men uvitenheten hindrer deg i å se det. Andre skoler er uenige, og mener mennesket beholder sin egen atman.',
        example:
            'Filosofen Shankara mente at frigjøringen er å oppdage noe som allerede er sant. Ramanuja mente derimot at det alltid består en forskjell mellom mennesket og brahman.',
        kjerne: 'Frigjøring ved å forstå hva du allerede er.',
        kjerneKilde: 'Jacobsen (2024), Brahman, Store norske leksikon',
    },
    {
        id: 'bhakti',
        Icon: Heart,
        name: 'Bhakti Yoga',
        subtitle: 'Kjærlighetens vei',
        bgClass: 'bg-pink-50',
        borderClass: 'border-pink-200',
        textClass: 'text-pink-600',
        description:
            'Veien gjennom hengivelse. Mennesket vender seg til en gud i hengivelse og handler med guddommen i tankene, gjerne Vishnu, Krishna, Shiva eller gudinnen Devi. Bhagavadgita framhever denne veien som den beste av dem.',
        example:
            'Mange hinduer mener at hellige steder i seg selv har frelsende kraft. Festivalen Kumbhamela samler titalls millioner deltakere.',
        kjerne: 'Frigjøring gjennom kjærlighet til en gud, ikke gjennom egen prestasjon.',
        kjerneKilde: 'Jacobsen (2025b, 2025c), Bhagavadgita og Moksha, Store norske leksikon',
    },
];

export function MokshaVeiene() {
    const [explored, setExplored] = useState<Set<string>>(new Set());
    const [active, setActive] = useState<'karma' | 'jnana' | 'bhakti' | null>(null);
    const [done, setDone] = useState(false);

    const handleSelect = (id: 'karma' | 'jnana' | 'bhakti') => {
        if (done) return;
        setActive(id);
        const next = new Set(explored);
        next.add(id);
        setExplored(next);
        if (next.size === 3) {
            setTimeout(() => setDone(true), 600);
        }
    };

    const reset = () => {
        setExplored(new Set());
        setActive(null);
        setDone(false);
    };

    const activePath = YOGA_PATHS.find((p) => p.id === active);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">Tre veier til moksha</h3>
                    <p className="text-sm text-slate-500">Klikk på hver vei for å utforske den</p>
                </div>
                <div className="ml-auto text-sm font-medium text-slate-400 tabular-nums">
                    {explored.size}/3 utforsket
                </div>
            </div>

            {/* Path cards */}
            <div className="p-6 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {YOGA_PATHS.map((path) => {
                        const isExplored = explored.has(path.id);
                        const isActive = active === path.id;
                        return (
                            <motion.button
                                key={path.id}
                                onClick={() => handleSelect(path.id)}
                                whileHover={{ scale: done ? 1 : 1.02 }}
                                whileTap={{ scale: done ? 1 : 0.97 }}
                                className={`text-left p-4 rounded-xl border-2 transition-colors ${
                                    isActive
                                        ? `${path.bgClass} ${path.borderClass} shadow-md`
                                        : isExplored
                                          ? `${path.bgClass} ${path.borderClass} opacity-80`
                                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${path.bgClass} border ${path.borderClass}`}
                                >
                                    <path.Icon className={`w-4 h-4 ${path.textClass}`} />
                                </div>
                                <div
                                    className={`font-semibold text-sm leading-snug ${isActive || isExplored ? path.textClass : 'text-slate-700'}`}
                                >
                                    {path.name}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{path.subtitle}</div>
                                <AnimatePresence>
                                    {isExplored && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mt-2 text-xs text-emerald-600 font-medium"
                                        >
                                            Utforsket
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Detail panel */}
                <AnimatePresence mode="wait">
                    {activePath && !done && (
                        <motion.div
                            key={activePath.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className={`mt-4 p-5 rounded-xl border ${activePath.bgClass} ${activePath.borderClass}`}
                        >
                            <h4 className={`font-semibold mb-2 ${activePath.textClass}`}>
                                {activePath.name} - {activePath.subtitle}
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed mb-3">
                                {activePath.description}
                            </p>
                            <p className="text-sm text-slate-600 italic mb-3">
                                {activePath.example}
                            </p>
                            <blockquote
                                className={`border-l-2 pl-3 ${activePath.borderClass} text-sm ${activePath.textClass} italic`}
                            >
                                {activePath.kjerne}
                                <span className="block text-xs text-slate-400 not-italic mt-0.5">
                                    Kilde: {activePath.kjerneKilde}
                                </span>
                            </blockquote>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Completion */}
                <AnimatePresence>
                    {done && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            className="mt-4 p-5 rounded-xl bg-amber-50 border border-amber-200 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.3, 1] }}
                                transition={{ delay: 0.15, duration: 0.5, type: 'spring' }}
                                className="flex justify-center mb-2"
                            >
                                <Star className="w-8 h-8 text-amber-400 fill-amber-300" />
                            </motion.div>
                            <h4 className="font-semibold text-amber-800 mb-1">
                                Veiene til moksha er kartlagt
                            </h4>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                Tradisjonen peker på flere veier til moksha: innsikt, yoga, askese
                                (streng selvfornektelse) og tilbedelse av guder. Men hinduer er ikke
                                enige om hva målet er. Tilhengere av advaita vedanta mener at
                                mennesket går opp i verdensaltet, andre venter et liv i en guds
                                himmel.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex justify-end">
                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
