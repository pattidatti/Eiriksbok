import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Gavel, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface RettsoppgjoretsSakerProps {
    title?: string;
}

type Phase = 'idle' | 'answered' | 'complete';

type Utfall = 'streng' | 'bot' | 'slapp' | 'utenDom';

// Lyspære-øyeblikket: eleven skal oppdage at et rettsoppgjør bare er rettferdig når
// straffen følger lov og dom - også for dem folk er sintest på. Fire av sakene gikk
// gjennom retten. Én gruppe ble straffet uten lov og uten dom: tyskerjentene.
const UTFALL: { id: Utfall; label: string }[] = [
    { id: 'streng', label: 'Dømt i retten - den strengeste straffen' },
    { id: 'bot', label: 'Bot og tap av rettigheter' },
    { id: 'slapp', label: 'De fleste slapp unna straff' },
    { id: 'utenDom', label: 'Straffet uten lov og uten dom' },
];

interface Sak {
    hvem: string;
    hva: string;
    riktig: Utfall;
    lovOgDom: boolean;
    forklaring: string;
}

const SAKER: Sak[] = [
    {
        hvem: 'Minister i Quislings regjering',
        hva: 'Han satt i NS-regjeringen og hjalp tyskerne å styre Norge i flere år.',
        riktig: 'streng',
        lovOgDom: true,
        forklaring:
            'Tre NS-politikere ble skutt etter dom: Quisling, Hagelin og Skancke. Skancke var den siste som ble henrettet, i august 1948.',
    },
    {
        hvem: 'Angiver i det tyske hemmelige politiet',
        hva: 'Han spionerte på naboer, meldte motstandsfolk til tyskerne og var med på å torturere fanger.',
        riktig: 'streng',
        lovOgDom: true,
        forklaring:
            '22 av nordmennene som ble henrettet, hadde jobbet for det hemmelige politiet. Ti av dem var med i Rinnanbanden i Trøndelag.',
    },
    {
        hvem: 'Vanlig medlem av NS',
        hva: 'Hun meldte seg inn i Quislings parti i 1941, men hadde ingen viktig jobb i partiet.',
        riktig: 'bot',
        lovOgDom: true,
        forklaring:
            'Det var straffbart å ha vært medlem av NS etter 9. april 1940. Mange vanlige medlemmer fikk bot og mistet rettigheter, ofte gjennom et forelegg i stedet for en lang rettssak.',
    },
    {
        hvem: 'Bedriftseier som bygde for tyskerne',
        hva: 'Firmaet hans bygde flyplasser og bunkere for okkupantene og tjente godt på det.',
        riktig: 'slapp',
        lovOgDom: true,
        forklaring:
            'Bare rundt én av fem som ble etterforsket for å ha tjent penger på tyskerne, ble dømt. Mange mente det var urettferdig at små NS-medlemmer ble straffet mens rike forretningsfolk slapp.',
    },
    {
        hvem: '«Tyskerjente»',
        hva: 'Hun var kjæreste med en tysk soldat under krigen. Det var ikke forbudt i noen lov.',
        riktig: 'utenDom',
        lovOgDom: false,
        forklaring:
            'Flere tusen kvinner ble satt i leir uten rettssak. Noen mistet statsborgerskapet. I 2018 sa statsminister Erna Solberg unnskyld: staten hadde straffet dem uten dom og uten lov.',
    },
];

export function RettsoppgjoretsSaker({
    title = 'Rettssalen 1945: Hva skjedde med dem?',
}: RettsoppgjoretsSakerProps) {
    const [index, setIndex] = useState(0);
    const [valgt, setValgt] = useState<Utfall | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [poeng, setPoeng] = useState(0);

    const sak = SAKER[index];
    const erRiktig = valgt === sak.riktig;

    const velg = (u: Utfall) => {
        if (phase !== 'idle') return;
        setValgt(u);
        setPhase('answered');
        if (u === sak.riktig) setPoeng((p) => p + 1);
    };

    const neste = () => {
        if (index + 1 >= SAKER.length) {
            setPhase('complete');
            return;
        }
        setIndex((i) => i + 1);
        setValgt(null);
        setPhase('idle');
    };

    const handleReset = () => {
        setIndex(0);
        setValgt(null);
        setPhase('idle');
        setPoeng(0);
    };

    const medDom = SAKER.filter((s) => s.lovOgDom);
    const utenDom = SAKER.filter((s) => !s.lovOgDom);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Gavel className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les saken og gjett hvordan den endte etter krigen.
                    </p>
                </div>
                <div className="flex gap-1.5" aria-label={`Sak ${index + 1} av ${SAKER.length}`}>
                    {SAKER.map((_, i) => (
                        <motion.span
                            key={i}
                            animate={{
                                scale: i === index && phase !== 'complete' ? 1.3 : 1,
                            }}
                            className={`w-2.5 h-2.5 rounded-full ${
                                phase === 'complete' || i < index
                                    ? 'bg-indigo-500'
                                    : i === index
                                      ? 'bg-indigo-300'
                                      : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {phase !== 'complete' ? (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                        >
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                                    Sak {index + 1} av {SAKER.length}
                                </p>
                                <p className="font-semibold text-slate-800">{sak.hvem}</p>
                                <p className="text-sm text-slate-600 mt-1">{sak.hva}</p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2">
                                {UTFALL.map((u) => {
                                    const valgtDenne = valgt === u.id;
                                    const fasit = phase === 'answered' && u.id === sak.riktig;
                                    const feil = phase === 'answered' && valgtDenne && !erRiktig;
                                    return (
                                        <motion.button
                                            key={u.id}
                                            onClick={() => velg(u.id)}
                                            whileHover={phase === 'idle' ? { scale: 1.02 } : {}}
                                            whileTap={phase === 'idle' ? { scale: 0.97 } : {}}
                                            animate={feil ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                                            disabled={phase !== 'idle'}
                                            className={`text-left text-sm rounded-xl border px-4 py-3 font-medium ${
                                                fasit
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : feil
                                                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                                                      : phase === 'idle'
                                                        ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md'
                                                        : 'bg-white border-slate-200 text-slate-400'
                                            }`}
                                        >
                                            {u.label}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <motion.div
                                    initial={{ rotate: -20 }}
                                    animate={{ rotate: [-20, 15, -8, 0] }}
                                    transition={{ duration: 1 }}
                                >
                                    <Scale className="w-8 h-8 text-indigo-500" />
                                </motion.div>
                                <p className="font-semibold text-slate-800">
                                    Du traff {poeng} av {SAKER.length} saker
                                </p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="flex items-center gap-2 font-semibold text-emerald-800 text-sm mb-2">
                                        <CheckCircle2 className="w-4 h-4" /> Etter lov og dom
                                    </p>
                                    {medDom.map((s, i) => (
                                        <motion.p
                                            key={s.hvem}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 * i }}
                                            className="text-sm text-emerald-700"
                                        >
                                            {s.hvem}
                                        </motion.p>
                                    ))}
                                </div>
                                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                                    <p className="flex items-center gap-2 font-semibold text-rose-700 text-sm mb-2">
                                        <XCircle className="w-4 h-4" /> Uten lov og uten dom
                                    </p>
                                    {utenDom.map((s) => (
                                        <motion.p
                                            key={s.hvem}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7 }}
                                            className="text-sm text-rose-700"
                                        >
                                            {s.hvem}
                                        </motion.p>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'idle' && (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Velg ett av de fire svarene over.
                        </motion.p>
                    )}
                    {phase === 'answered' && (
                        <motion.div
                            key={`svar-${index}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                erRiktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                        >
                            <p className="font-semibold mb-1">
                                {erRiktig ? 'Riktig!' : 'Ikke helt.'}{' '}
                                <span
                                    className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                                        sak.lovOgDom
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                    }`}
                                >
                                    {sak.lovOgDom ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                        <XCircle className="w-3 h-3" />
                                    )}
                                    {sak.lovOgDom ? 'Lov og dom' : 'Uten lov og dom'}
                                </span>
                            </p>
                            <p>{sak.forklaring}</p>
                        </motion.div>
                    )}
                    {phase === 'complete' && (
                        <motion.div
                            key="lyspaere"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            Fire av sakene gikk gjennom retten, også de verste. Den femte gikk
                            utenom. Et rettsoppgjør er bare rettferdig når straffen følger lov og
                            dom - også for dem folk er sintest på.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={neste}
                    disabled={phase !== 'answered'}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium ${
                        phase === 'answered'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {index + 1 >= SAKER.length ? 'Se resultatet' : 'Neste sak'}
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
