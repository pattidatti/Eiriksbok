import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, Medal, RotateCcw, ScrollText, Trees, Users, X } from 'lucide-react';

// VeienTilSkogen: eleven prøver de fredelige veiene kikuyuene hadde for å få
// jorda si tilbake før 1952, og ser at alle ble stengt. Først da åpner den
// siste døra: skogen og den væpnede kampen.
//
// Lyspære-øyeblikket: Mau Mau-opprøret handlet om jord, og det kom etter at de
// fredelige veiene var prøvd og stengt.
//
// Fakta: Eriksen (2024), Store norske leksikon: Mau Mau, og South African
// History Online (2016): The Mau Mau Uprising.

interface VeienTilSkogenProps {
    title?: string;
}

type Phase = 'gjett' | 'dorer' | 'ferdig';
type GjettId = 'mindre' | 'likt' | 'mer';
type DorId = 'forening' | 'krigen' | 'partiet';

interface Gjett {
    id: GjettId;
    tekst: string;
}

interface Dor {
    id: DorId;
    tittel: string;
    hva: string;
    utfall: string;
    Ikon: typeof Users;
}

const GJETT: Gjett[] = [
    { id: 'mindre', tekst: 'Mye mindre jord' },
    { id: 'likt', tekst: 'Omtrent like mye jord' },
    { id: 'mer', tekst: 'Mer jord' },
];

const DORER: Dor[] = [
    {
        id: 'forening',
        tittel: 'Starte en forening',
        hva: 'I 1921 startet kenyanere East African Association for å klage på kolonistyret.',
        utfall: 'Foreningen ble forbudt året etter.',
        Ikon: ScrollText,
    },
    {
        id: 'krigen',
        tittel: 'Kjempe for britene',
        hva: 'Mange afrikanere kjempet for Storbritannia i andre verdenskrig. De håpet å få jord og mer å si etterpå.',
        utfall: 'Da krigen var over i 1945, fikk de ingen jord.',
        Ikon: Medal,
    },
    {
        id: 'partiet',
        tittel: 'Stemme på et parti',
        hva: 'Partiet KAU, ledet av Jomo Kenyatta, ville få mer makt til afrikanere på fredelig vis.',
        utfall: 'I 1952 ble Kenyatta arrestert og dømt til sju års straffarbeid, selv om han ikke var med i opprøret.',
        Ikon: Users,
    },
];

// 1 prikk = 20 000 kikuyuer (50 prikker = én million). 1 hus = 1000 familier.
const KIKUYU_PRIKKER = 50;
const EUROPA_HUS = 3;

export function VeienTilSkogen({ title = 'Hvorfor gikk de til skogen?' }: VeienTilSkogenProps) {
    const [phase, setPhase] = useState<Phase>('gjett');
    const [gjett, setGjett] = useState<GjettId | null>(null);
    const [apnet, setApnet] = useState<DorId[]>([]);

    const alleApnet = apnet.length === DORER.length;

    const handleGjett = (id: GjettId) => {
        if (gjett) return;
        setGjett(id);
    };

    const handleDor = (id: DorId) => {
        if (apnet.includes(id)) return;
        setApnet((prev) => [...prev, id]);
    };

    const handleReset = () => {
        setPhase('gjett');
        setGjett(null);
        setApnet([]);
    };

    const feedback = (() => {
        if (phase === 'ferdig') {
            return 'Alle de fredelige dørene var stengt. Det gjør ikke volden riktig, men det forklarer hvorfor opprøret kom: det handlet om jord og frihet.';
        }
        if (phase === 'dorer') {
            if (alleApnet) return 'Alle tre dørene er prøvd. Én dør er igjen.';
            return `Åpne alle tre dørene. Du har prøvd ${apnet.length} av ${DORER.length}.`;
        }
        if (!gjett) return 'Velg det svaret du tror er riktig.';
        if (gjett === 'mer')
            return 'Riktig! Rundt 3000 europeiske familier hadde mer jord enn én million kikuyuer til sammen.';
        return 'Ikke helt. Rundt 3000 europeiske familier hadde faktisk mer jord enn én million kikuyuer til sammen.';
    })();

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Trees className="w-5 h-5 text-emerald-600" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {phase === 'gjett'
                            ? 'Kenya rundt 1950: Hvor mye jord hadde de 3000 europeiske familiene?'
                            : 'Prøv de fredelige veiene til å få jorda tilbake.'}
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {phase === 'gjett' && (
                        <motion.div
                            key="gjett"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-5"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">
                                        Europeiske nybyggere
                                    </p>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Ca. 3000 familier. 1 hus = 1000 familier
                                    </p>
                                    <div className="flex gap-2">
                                        {Array.from({ length: EUROPA_HUS }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-8 h-8 rounded-lg bg-amber-400 border border-amber-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">
                                        Kikuyuer i reservatene
                                    </p>
                                    <p className="text-xs text-slate-500 mb-3">
                                        Ca. én million mennesker. 1 prikk = 20 000
                                    </p>
                                    <div className="grid grid-cols-10 gap-1 w-fit">
                                        {Array.from({ length: KIKUYU_PRIKKER }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-3 h-3 rounded-full bg-emerald-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-700">
                                Sammenlignet med alle kikuyuene i reservatene til sammen, hadde de
                                3000 familiene ...
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {GJETT.map((g) => {
                                    const valgt = gjett === g.id;
                                    const riktig = g.id === 'mer';
                                    let stil =
                                        'bg-white border-slate-200 text-slate-700 hover:shadow-md';
                                    if (gjett && riktig)
                                        stil = 'bg-emerald-50 border-emerald-300 text-emerald-700';
                                    else if (valgt)
                                        stil = 'bg-rose-50 border-rose-200 text-rose-700';
                                    return (
                                        <motion.button
                                            key={g.id}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleGjett(g.id)}
                                            disabled={gjett !== null}
                                            className={`px-4 py-2 rounded-full border text-sm font-medium ${stil}`}
                                        >
                                            {g.tekst}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {gjett && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-28 text-xs text-slate-600">
                                            3000 familier
                                        </span>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '70%' }}
                                            transition={{ duration: 0.8 }}
                                            className="h-4 rounded-full bg-amber-400"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="w-28 text-xs text-slate-600">
                                            1 million kikuyuer
                                        </span>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '55%' }}
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                            className="h-4 rounded-full bg-emerald-500"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Stolpene viser bare hvem som hadde mest, ikke nøyaktige mål.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {phase !== 'gjett' && (
                        <motion.div
                            key="dorer"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-3"
                        >
                            {DORER.map((d) => {
                                const erApen = apnet.includes(d.id);
                                return (
                                    <motion.button
                                        key={d.id}
                                        layout
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleDor(d.id)}
                                        className={`text-left flex flex-col justify-start rounded-xl border p-4 ${
                                            erApen
                                                ? 'bg-rose-50 border-rose-200'
                                                : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <d.Ikon
                                                className={`w-4 h-4 ${erApen ? 'text-rose-500' : 'text-indigo-500'}`}
                                            />
                                            <span className="text-sm font-semibold text-slate-800">
                                                {d.tittel}
                                            </span>
                                        </div>
                                        {erApen ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-2"
                                            >
                                                <p className="text-xs text-slate-600">{d.hva}</p>
                                                <p className="text-xs font-medium text-rose-700 flex items-start gap-1">
                                                    <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                    {d.utfall}
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <p className="text-xs text-slate-500">
                                                Klikk for å prøve
                                            </p>
                                        )}
                                    </motion.button>
                                );
                            })}

                            <motion.button
                                layout
                                whileTap={alleApnet ? { scale: 0.97 } : undefined}
                                onClick={() => alleApnet && setPhase('ferdig')}
                                disabled={!alleApnet}
                                animate={
                                    phase === 'ferdig'
                                        ? { scale: [1, 1.06, 1] }
                                        : alleApnet
                                          ? { opacity: 1 }
                                          : { opacity: 0.55 }
                                }
                                className={`text-left flex flex-col justify-start rounded-xl border p-4 ${
                                    phase === 'ferdig'
                                        ? 'bg-emerald-50 border-emerald-300'
                                        : alleApnet
                                          ? 'bg-white border-emerald-300 shadow-md'
                                          : 'bg-slate-100 border-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {phase === 'ferdig' || alleApnet ? (
                                        <Trees className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className="text-sm font-semibold text-slate-800">
                                        Gå til skogen
                                    </span>
                                </div>
                                {phase === 'ferdig' ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-xs text-slate-700"
                                    >
                                        I 1954 kjempet 18 000-24 000 mennesker i skogene ved Mount
                                        Kenya og Nyandarua. De kalte seg Kenyas land- og frihetshær.
                                    </motion.p>
                                ) : (
                                    <p className="text-xs text-slate-500">
                                        {alleApnet ? 'Klikk for å åpne' : 'Låst'}
                                    </p>
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm flex items-start gap-2 ${
                            phase === 'ferdig'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {phase === 'ferdig' && <Check className="w-4 h-4 mt-0.5 shrink-0" />}
                        <span>{feedback}</span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'gjett' ? (
                    <button
                        onClick={() => setPhase('dorer')}
                        disabled={!gjett}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Hva kunne de gjøre?
                    </button>
                ) : (
                    <span className="text-xs text-slate-400">
                        {phase === 'ferdig'
                            ? 'Ferdig!'
                            : `${apnet.length} av ${DORER.length} dører prøvd`}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
