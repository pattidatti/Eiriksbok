import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, RotateCcw, TrendingUp, Check } from 'lucide-react';

interface Utfall {
    mal: string;
    resultat: string;
}

interface MotsattVirkningProps {
    title?: string;
    sporsmal?: string;
    utfall?: Utfall[];
    konklusjon?: string;
}

type Fase = 'gjett' | 'avdekk' | 'ferdig';

type Gjetning = 'sank' | 'uendret' | 'okte';

const STANDARD_UTFALL: Utfall[] = [
    {
        mal: 'Bokserne ville jage de fremmede soldatene ut av Kina.',
        resultat:
            'I fredsavtalen fikk stormaktene rett til å ha egne soldater langs veien mellom Beijing og havet. Det sto flere fremmede soldater i Kina etter opprøret enn før.',
    },
    {
        mal: 'Bokserne ville holde Beijing på kinesiske hender.',
        resultat:
            '14. august 1900 brøt en internasjonal styrke seg inn i Beijing, satte de innestengte utlendingene fri og plyndret byen.',
    },
    {
        mal: 'Bokserne ville slippe å betale mer til utlendingene.',
        resultat:
            'Kina måtte betale 450 millioner tael sølv i erstatning, med fire prosent rente, og nedbetalingen skulle vare helt til 1940.',
    },
    {
        mal: 'Bokserne ville at bevegelsen deres skulle vokse seg sterk.',
        resultat:
            'Da freden ble undertegnet 7. september 1901, ble bokserorganisasjonen rett og slett forbudt.',
    },
];

const GJETNINGER: { id: Gjetning; tekst: string }[] = [
    { id: 'sank', tekst: 'Den sank' },
    { id: 'uendret', tekst: 'Den ble omtrent som før' },
    { id: 'okte', tekst: 'Den økte' },
];

export function MotsattVirkning({
    title = 'Slik slo opprøret tilbake',
    sporsmal = 'Bokserne ville kaste utlendingene ut av Kina. Hva tror du skjedde med den utenlandske makten over Kina etterpå?',
    utfall = STANDARD_UTFALL,
    konklusjon = 'Alle de fire målene endte med det motsatte. Opprøret som skulle gjøre Kina fritt, ga stormaktene mer makt over landet enn de hadde hatt før.',
}: MotsattVirkningProps) {
    const [fase, setFase] = useState<Fase>('gjett');
    const [gjetning, setGjetning] = useState<Gjetning | null>(null);
    const [avdekket, setAvdekket] = useState<number[]>([]);

    const antall = utfall.length;
    const makt = Math.round((avdekket.length / antall) * 100);

    const velgGjetning = (id: Gjetning) => {
        setGjetning(id);
        setFase('avdekk');
    };

    const avdekk = (i: number) => {
        if (avdekket.includes(i)) return;
        const neste = [...avdekket, i];
        setAvdekket(neste);
        if (neste.length === antall) setFase('ferdig');
    };

    const nullstill = () => {
        setFase('gjett');
        setGjetning(null);
        setAvdekket([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Target className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {fase === 'gjett'
                            ? 'Gjett først. Så ser du hvordan det faktisk gikk.'
                            : 'Klikk hvert mål bokserne hadde, og se resultatet.'}
                    </p>
                </div>
            </div>

            {/* Målestokk */}
            <div className="px-6 pt-5">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Utenlandsk makt over Kina
                    </span>
                    <span className="text-sm font-bold text-slate-700 tabular-nums">{makt} %</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${makt}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                {fase === 'gjett' ? (
                    <div>
                        <p className="text-slate-700 mb-4 leading-relaxed">{sporsmal}</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {GJETNINGER.map((g) => (
                                <motion.button
                                    key={g.id}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => velgGjetning(g.id)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                    {g.tekst}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {utfall.map((u, i) => {
                            const apen = avdekket.includes(i);
                            return (
                                <motion.button
                                    key={i}
                                    onClick={() => avdekk(i)}
                                    whileHover={apen ? undefined : { scale: 1.02 }}
                                    whileTap={apen ? undefined : { scale: 0.98 }}
                                    animate={apen ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.35 }}
                                    className={`text-left rounded-xl border p-4 ${
                                        apen
                                            ? 'border-rose-200 bg-rose-50 cursor-default'
                                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                    }`}
                                >
                                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                                        {u.mal}
                                    </p>
                                    <AnimatePresence>
                                        {apen ? (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="text-sm text-rose-800 mt-2 leading-relaxed"
                                            >
                                                {u.resultat}
                                            </motion.p>
                                        ) : (
                                            <motion.span
                                                exit={{ opacity: 0 }}
                                                className="inline-block text-xs font-semibold text-indigo-600 mt-2"
                                            >
                                                Klikk for å se hvordan det gikk
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                {fase === 'ferdig' ? (
                    <motion.div
                        key="ferdig"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                        className="mx-6 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                    >
                        <span className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>
                                <span className="font-semibold">
                                    {gjetning === 'okte'
                                        ? 'Du gjettet riktig. '
                                        : 'Du gjettet at makten ikke skulle øke. '}
                                </span>
                                {konklusjon}
                            </span>
                        </span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="venter"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex items-center gap-2"
                    >
                        <TrendingUp className="w-4 h-4 flex-shrink-0" />
                        {fase === 'gjett'
                            ? 'Velg et svar, så åpner de fire målene seg.'
                            : `Åpnet ${avdekket.length} av ${antall} mål.`}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={nullstill}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
