import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    RotateCcw,
    X,
    BookOpen,
    CalendarDays,
    GraduationCap,
    Landmark,
    Tag,
    UserRound,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface LetingenEtterEnStifterProps {
    title?: string;
}

interface Spor {
    id: string;
    ikon: LucideIcon;
    sporsmal: string;
    funn: string;
    detalj: string;
}

const SPOR: Spor[] = [
    {
        id: 'person',
        ikon: UserRound,
        sporsmal: 'Hvem grunnla religionen?',
        funn: 'Ingen person',
        detalj: 'Hinduismen oppstod ikke på ett tidspunkt eller ett sted. Den har ingen stifter, ingen trosartikler og ingen fast organisert ledelse.',
    },
    {
        id: 'aar',
        ikon: CalendarDays,
        sporsmal: 'Hvilket år startet det?',
        funn: 'Ingen startdato',
        detalj: 'Tradisjonene vokste fram på det indiske subkontinentet gjennom flere tusen år. Den eldste bykulturen langs elva Indus er rundt 4500 år gammel.',
    },
    {
        id: 'navn',
        ikon: Tag,
        sporsmal: 'Hvem ga religionen navnet?',
        funn: 'Naboene i vest',
        detalj: 'Hindu var det gammelpersiske navnet på folk som bodde ved elva Indus, på sanskrit Sindhu. Ordet fikk religiøs betydning først etter at muslimer bosatte seg i Nord-India.',
    },
    {
        id: 'bok',
        ikon: BookOpen,
        sporsmal: 'Hvilken bok skrev stifteren?',
        funn: 'Ingen forfatter',
        detalj: 'Vedaene er de eldste kjente hellige skriftene i India. Etter hinduisk oppfatning er de tidløse. De er ikke forfattet, men skuet av hellige seere som kalles rishier.',
    },
    {
        id: 'leder',
        ikon: Landmark,
        sporsmal: 'Hvem leder religionen i dag?',
        funn: 'Ingen sentral ledelse',
        detalj: 'Hinduismen har ikke noe sentrum og ingen sentral organisasjon. De enkelte trossamfunnene kalles sampradayaer, og en religiøs lærer kalles guru.',
    },
    {
        id: 'shankara',
        ikon: GraduationCap,
        sporsmal: 'Var ikke Shankara grunnleggeren?',
        funn: 'Grunnla klostre, ikke religionen',
        detalj: 'Shankara levde trolig rundt år 800 og grunnla mange klostersamfunn. Flere retninger inne i hinduismen har egne stiftere, men religionen som helhet har ingen.',
    },
];

const BAEREBJELKER: { tittel: string; tekst: string }[] = [
    { tittel: 'Tempelet', tekst: 'Tilbedelsen i tempelet og hjemme' },
    { tittel: 'Tekstene', tekst: 'Vedaene og de andre hellige skriftene' },
    { tittel: 'Guru og elev', tekst: 'Læren gis videre fra lærer til elev' },
];

export function LetingenEtterEnStifter({
    title = 'Letingen etter en stifter',
}: LetingenEtterEnStifterProps) {
    const [apnet, setApnet] = useState<string[]>([]);
    const [sist, setSist] = useState<Spor | null>(null);

    const ferdig = apnet.length === SPOR.length;

    const sok = (spor: Spor) => {
        setSist(spor);
        setApnet((forrige) => (forrige.includes(spor.id) ? forrige : [...forrige, spor.id]));
    };

    const handleReset = () => {
        setApnet([]);
        setSist(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på hvert spor. Se hva du finner der en stifter skulle ha vært.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                {SPOR.map((spor) => {
                    const er = apnet.includes(spor.id);
                    const Ikon = spor.ikon;
                    return (
                        <motion.button
                            key={spor.id}
                            type="button"
                            onClick={() => sok(spor)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            animate={{
                                backgroundColor: er ? '#fff7ed' : '#f8fafc',
                                borderColor: er ? '#fdba74' : '#e2e8f0',
                            }}
                            transition={{ duration: 0.25 }}
                            className="text-left rounded-xl border-2 p-3 min-h-[7.5rem] flex flex-col justify-between"
                        >
                            <div className="flex items-start gap-2">
                                <Ikon className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                                <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                                    {spor.sporsmal}
                                </p>
                            </div>
                            <AnimatePresence mode="wait">
                                {er ? (
                                    <motion.div
                                        key="funn"
                                        initial={{ opacity: 0, y: 8, scale: 0.94 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                                        className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-white px-2 py-1"
                                    >
                                        <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-500" />
                                        <span className="text-[11px] leading-tight text-amber-800">
                                            {spor.funn}
                                        </span>
                                    </motion.div>
                                ) : (
                                    <motion.span
                                        key="sok"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600"
                                    >
                                        <Search className="w-3 h-3" />
                                        Undersøk sporet
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                        >
                            <p className="flex items-center gap-2 font-semibold text-emerald-800">
                                <Sparkles className="w-4 h-4 shrink-0" />
                                Seks spor, null stiftere.
                            </p>
                            <p className="mt-1 text-sm text-emerald-700">
                                Hinduer kaller ofte religionen sin Sanatana Dharma, den evige veien.
                                I stedet for en stifter hviler den på tre bærebjelker.
                            </p>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {BAEREBJELKER.map((b, i) => (
                                    <motion.div
                                        key={b.tittel}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 0.15 + i * 0.12,
                                            type: 'spring',
                                            stiffness: 240,
                                            damping: 20,
                                        }}
                                        className="rounded-lg border border-emerald-200 bg-white px-3 py-2"
                                    >
                                        <p className="text-[13px] font-semibold text-emerald-800">
                                            {b.tittel}
                                        </p>
                                        <p className="text-[11px] leading-tight text-slate-600">
                                            {b.tekst}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={sist ? `funn-${sist.id}` : 'tom'}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                                sist
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            <Search className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                {sist
                                    ? sist.detalj
                                    : 'Seks spørsmål som pleier å ha et enkelt svar. Her får du seks andre svar i stedet.'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {apnet.length} av {SPOR.length} spor undersøkt
                </p>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
