import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Crown, Globe, GraduationCap, RotateCcw, Sparkles } from 'lucide-react';

// Bahá'í-argumentet for at skapelsen ikke har noen begynnelse.
//
// Lyspære-øyeblikket: en tittel som "skaper" holder bare så lenge det finnes
// noe skapt. Tar du bort motstykket, faller tittelen sammen. Bahá'í-troen
// bruker nettopp dette om Gud: Gud har alltid vært skaper, altså må det
// alltid ha vært noe skapt, og da kan ikke skapelsen ha hatt en første dag.

type IkonNavn = 'krone' | 'laerer' | 'forelder' | 'skaper';

interface TittelPar {
    id: string;
    tittel: string;
    motstykke: string;
    ikon: IkonNavn;
    utenTekst: string;
}

interface SkapelseUtenBegynnelseProps {
    title?: string;
    par?: TittelPar[];
}

const IKONER: Record<IkonNavn, typeof Crown> = {
    krone: Crown,
    laerer: GraduationCap,
    forelder: Baby,
    skaper: Globe,
};

const STANDARD_PAR: TittelPar[] = [
    {
        id: 'konge',
        tittel: 'Konge',
        motstykke: 'et rike',
        ikon: 'krone',
        utenTekst: 'Uten land og folk er han bare et menneske. Tittelen har ingenting å holde i.',
    },
    {
        id: 'laerer',
        tittel: 'Lærer',
        motstykke: 'elever',
        ikon: 'laerer',
        utenTekst: 'Hun kan like mye som før, men hun lærer ingen noe. Da er hun ikke lærer.',
    },
    {
        id: 'forelder',
        tittel: 'Forelder',
        motstykke: 'et barn',
        ikon: 'forelder',
        utenTekst: 'Uten barn finnes ikke ordet forelder i det hele tatt.',
    },
    {
        id: 'skaper',
        tittel: 'Skaper',
        motstykke: 'et skaperverk',
        ikon: 'skaper',
        utenTekst: "Uten noe skapt finnes ingen skaper. Det er her bahá'í-troen setter inn støtet.",
    },
];

export function SkapelseUtenBegynnelse({
    title = 'Tittelen som faller sammen',
    par = STANDARD_PAR,
}: SkapelseUtenBegynnelseProps) {
    const [harMotstykke, setHarMotstykke] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(par.map((p) => [p.id, true]))
    );
    const [testet, setTestet] = useState<string[]>([]);

    const ferdig = testet.length === par.length;

    const handleReset = () => {
        setHarMotstykke(Object.fromEntries(par.map((p) => [p.id, true])));
        setTestet([]);
    };

    const veksle = (p: TittelPar) => {
        const hadde = harMotstykke[p.id];
        setHarMotstykke((forrige) => ({ ...forrige, [p.id]: !hadde }));
        if (hadde) {
            setTestet((forrige) => (forrige.includes(p.id) ? forrige : [...forrige, p.id]));
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Ta bort motstykket til hver tittel, og se hva som skjer med tittelen.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 grid gap-4 sm:grid-cols-2">
                {par.map((p) => {
                    const Ikon = IKONER[p.ikon];
                    const paa = harMotstykke[p.id];
                    return (
                        <motion.div
                            key={p.id}
                            layout
                            className={`rounded-xl border p-4 ${
                                paa ? 'border-slate-200 bg-slate-50' : 'border-rose-200 bg-rose-50'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <motion.span
                                    animate={{
                                        scale: paa ? 1 : 0.85,
                                        rotate: paa ? 0 : -8,
                                        opacity: paa ? 1 : 0.5,
                                    }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 15 }}
                                    className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${
                                        paa ? 'bg-white text-indigo-500' : 'bg-white text-slate-400'
                                    }`}
                                >
                                    <Ikon className="w-5 h-5" />
                                </motion.span>
                                <div className="min-w-0">
                                    <motion.p
                                        animate={{ opacity: paa ? 1 : 0.45 }}
                                        className={`font-display text-lg font-semibold ${
                                            paa ? 'text-slate-800' : 'text-slate-500 line-through'
                                        }`}
                                    >
                                        {p.tittel}
                                    </motion.p>
                                    <p className="text-xs text-slate-500">trenger {p.motstykke}</p>
                                </div>
                            </div>

                            <div className="mt-3 min-h-[3.25rem]">
                                <AnimatePresence mode="wait">
                                    {paa ? (
                                        <motion.p
                                            key="med"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className="text-sm text-slate-600"
                                        >
                                            Så lenge {p.motstykke} finnes, holder tittelen.
                                        </motion.p>
                                    ) : (
                                        <motion.p
                                            key="uten"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className="text-sm text-rose-700"
                                        >
                                            {p.utenTekst}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                type="button"
                                onClick={() => veksle(p)}
                                className={`mt-3 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    paa
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            >
                                {paa ? `Ta bort ${p.motstykke}` : `Gi tilbake ${p.motstykke}`}
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
                        >
                            <p className="text-sm text-emerald-800">
                                Alle fire titlene falt sammen uten motstykket sitt.
                                Bahá&#8217;í-troen bruker akkurat dette om Gud: Gud har alltid vært
                                skaper, altså må det alltid ha vært noe skapt. Da kan ikke skapelsen
                                ha hatt en første dag.
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                                <motion.span
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 260,
                                        damping: 12,
                                        delay: 0.15,
                                    }}
                                    className="font-display text-2xl text-emerald-600"
                                >
                                    &#8734;
                                </motion.span>
                                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-emerald-100">
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '0%' }}
                                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                                        className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-600"
                                    />
                                </div>
                                <span className="text-xs font-medium text-emerald-700">nå</span>
                            </div>
                            <p className="mt-1 text-xs text-emerald-700">
                                Linjen har ingen start. Den kommer bare inn fra venstre.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ikke-ferdig"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
                        >
                            Du har prøvd {testet.length} av {par.length} titler. Ta bort motstykket
                            på alle sammen, og se om noen av titlene overlever.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    Bygd på argumentet til &#8216;Abdu&#8217;l-Bahá
                </p>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
