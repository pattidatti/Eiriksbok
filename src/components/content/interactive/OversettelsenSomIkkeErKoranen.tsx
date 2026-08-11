import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, Languages, RotateCcw, Sparkles, X } from 'lucide-react';

type Svar = 'arabisk' | 'oversettelse';

interface Situasjon {
    id: string;
    tekst: string;
    fasit: Svar;
    forklaring: string;
}

interface OversettelsenSomIkkeErKoranenProps {
    title?: string;
}

const SITUASJONER: Situasjon[] = [
    {
        id: 'bonn',
        tekst: 'En muslim ber en av de faste, daglige bønnene.',
        fasit: 'arabisk',
        forklaring:
            'Den rituelle bønnen utføres i all hovedsak på arabisk, og åpningssuren al-Fatiha resiteres i alle rituelle bønner.',
    },
    {
        id: 'forstaa',
        tekst: 'Du vil finne ut hva sure 24, Lyset, egentlig handler om.',
        fasit: 'oversettelse',
        forklaring:
            'Koranen er oversatt til mange språk nettopp for at folk skal kunne forstå det de leser. Oversettelsen er veien inn i innholdet.',
    },
    {
        id: 'regel',
        tekst: 'Rettslærde skal avgjøre hva et bestemt vers krever av folk.',
        fasit: 'arabisk',
        forklaring:
            'I normativ tolkning, altså når man skal avgjøre hva en regel betyr, legges vanligvis den arabiske teksten til grunn.',
    },
    {
        id: 'resitasjon',
        tekst: 'Noen resiterer høyt, og hver bokstavlyd og stavelse skal uttales korrekt og klart.',
        fasit: 'arabisk',
        forklaring:
            'Hovedfokuset i koranresitasjon er å bevare teksten nøyaktig slik den er, ved at hver bokstavlyd uttales korrekt. Lydene finnes bare i den arabiske teksten.',
    },
    {
        id: 'laerebok',
        tekst: 'En norsk bok skal forklare innholdet i Koranen for lesere som ikke kan arabisk.',
        fasit: 'oversettelse',
        forklaring:
            'Enhver oversettelse regnes som en tolkning av grunnteksten. Den er nyttig for å forstå, men den er ikke selve åpenbaringen.',
    },
];

export function OversettelsenSomIkkeErKoranen({
    title = 'Arabisk eller oversettelse?',
}: OversettelsenSomIkkeErKoranenProps) {
    const [indeks, setIndeks] = useState(0);
    const [valgt, setValgt] = useState<Svar | null>(null);
    const [riktige, setRiktige] = useState(0);
    const [ferdig, setFerdig] = useState(false);

    const naa = SITUASJONER[indeks];
    const erRiktig = valgt !== null && valgt === naa.fasit;

    const velg = (svar: Svar) => {
        if (valgt !== null) return;
        setValgt(svar);
        if (svar === naa.fasit) setRiktige((r) => r + 1);
    };

    const neste = () => {
        if (indeks === SITUASJONER.length - 1) {
            setFerdig(true);
            return;
        }
        setIndeks((i) => i + 1);
        setValgt(null);
    };

    const tilbakestill = () => {
        setIndeks(0);
        setValgt(null);
        setRiktige(0);
        setFerdig(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Languages className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        I islam regnes den arabiske teksten som Koranen selv, mens en oversettelse
                        regnes som en tolkning av grunnteksten. Hva brukes i hver situasjon?
                    </p>
                </div>
            </div>

            <div className="px-6 pt-4 flex items-center gap-2">
                {SITUASJONER.map((s, i) => (
                    <motion.span
                        key={s.id}
                        className={`h-1.5 flex-1 rounded-full ${
                            ferdig || i < indeks || (i === indeks && valgt !== null)
                                ? 'bg-indigo-500'
                                : 'bg-slate-200'
                        }`}
                        initial={false}
                        animate={{ opacity: i === indeks && !ferdig ? 1 : 0.75 }}
                    />
                ))}
                <span className="text-xs text-slate-400 tabular-nums w-14 text-right">
                    {ferdig ? SITUASJONER.length : indeks + 1} av {SITUASJONER.length}
                </span>
            </div>

            <div className="p-6 pt-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 14,
                                    delay: 0.1,
                                }}
                                className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center"
                            >
                                <Sparkles className="w-6 h-6 text-white" />
                            </motion.div>
                            <p className="font-semibold text-emerald-800">
                                Du fikk {riktige} av {SITUASJONER.length} riktig.
                            </p>
                            <p className="mt-2 text-sm text-emerald-700 max-w-xl mx-auto">
                                Ser du mønsteret? Der teksten skal være Koranen, i bønn, i
                                resitasjon og i strid om hva et vers krever, brukes arabisk. Der
                                teksten skal forstås av noen som ikke kan arabisk, brukes en
                                oversettelse. Oversettelsen er ikke forbudt. Den har bare en annen
                                status.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={naa.id}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
                        >
                            <motion.div
                                animate={
                                    valgt !== null && !erRiktig
                                        ? { x: [0, -8, 8, -5, 5, 0] }
                                        : { x: 0 }
                                }
                                transition={{ duration: 0.35 }}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5 flex items-start gap-3"
                            >
                                <BookOpen className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-slate-800 text-base leading-relaxed">
                                    {naa.tekst}
                                </p>
                            </motion.div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(
                                    [
                                        {
                                            verdi: 'arabisk' as Svar,
                                            tittel: 'Den arabiske teksten',
                                            under: 'Regnes som Koranen selv',
                                        },
                                        {
                                            verdi: 'oversettelse' as Svar,
                                            tittel: 'En oversettelse holder',
                                            under: 'En tolkning av grunnteksten',
                                        },
                                    ] as const
                                ).map((valg) => {
                                    const erValgt = valgt === valg.verdi;
                                    const erFasit = naa.fasit === valg.verdi;
                                    let stil = 'border-slate-200 bg-white hover:border-indigo-300';
                                    if (valgt !== null && erFasit) {
                                        stil = 'border-emerald-300 bg-emerald-50';
                                    } else if (valgt !== null && erValgt) {
                                        stil = 'border-rose-300 bg-rose-50';
                                    } else if (valgt !== null) {
                                        stil = 'border-slate-200 bg-white opacity-60';
                                    }
                                    return (
                                        <motion.button
                                            key={valg.verdi}
                                            onClick={() => velg(valg.verdi)}
                                            whileHover={valgt === null ? { y: -2 } : undefined}
                                            whileTap={valgt === null ? { scale: 0.98 } : undefined}
                                            className={`text-left rounded-xl border px-4 py-3 shadow-sm ${stil}`}
                                        >
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="font-medium text-slate-800">
                                                    {valg.tittel}
                                                </span>
                                                {valgt !== null && erFasit && (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 400,
                                                            damping: 15,
                                                        }}
                                                    >
                                                        <Check className="w-4 h-4 text-emerald-600" />
                                                    </motion.span>
                                                )}
                                                {valgt !== null && erValgt && !erFasit && (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 400,
                                                            damping: 15,
                                                        }}
                                                    >
                                                        <X className="w-4 h-4 text-rose-600" />
                                                    </motion.span>
                                                )}
                                            </span>
                                            <span className="block text-xs text-slate-500 mt-0.5">
                                                {valg.under}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mx-6 mb-4 min-h-[64px]">
                <AnimatePresence mode="wait">
                    {!ferdig && valgt !== null && (
                        <motion.div
                            key={`${naa.id}-feedback`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm border ${
                                erRiktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            {erRiktig ? 'Riktig. ' : 'Ikke helt. '}
                            {naa.forklaring}
                        </motion.div>
                    )}
                    {!ferdig && valgt === null && (
                        <motion.p
                            key={`${naa.id}-hint`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-500"
                        >
                            Velg ett av de to svarene over.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={neste}
                    disabled={ferdig || valgt === null}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {indeks === SITUASJONER.length - 1 ? 'Se mønsteret' : 'Neste situasjon'}
                </button>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
