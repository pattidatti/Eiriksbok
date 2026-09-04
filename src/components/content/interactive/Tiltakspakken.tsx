import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Hand,
    Users,
    School,
    Home,
    Store,
    Plane,
    HeartPulse,
    SlidersHorizontal,
    RotateCcw,
    Flag,
    CheckCircle2,
} from 'lucide-react';

type IconType = typeof Hand;

interface Tiltak {
    id: string;
    label: string;
    icon: IconType;
    // Hvor mange poeng tiltaket presser smittetrykket ned.
    smitte: number;
    // Hva tiltaket koster skolen og de unge, og jobbene og økonomien.
    skole: number;
    jobb: number;
}

const TILTAK: Tiltak[] = [
    { id: 'hygiene', label: 'Vask hendene og hold avstand', icon: Hand, smitte: 12, skole: 0, jobb: 2 },
    { id: 'sykehjem', label: 'Stopp besøk på sykehjem', icon: HeartPulse, smitte: 8, skole: 0, jobb: 3 },
    { id: 'karantene', label: 'Karantene etter utenlandsreise', icon: Plane, smitte: 10, skole: 2, jobb: 8 },
    { id: 'hjemmekontor', label: 'Hjemmekontor der det går', icon: Home, smitte: 12, skole: 0, jobb: 12 },
    { id: 'arrangement', label: 'Forby store arrangementer', icon: Users, smitte: 14, skole: 6, jobb: 10 },
    { id: 'naerkontakt', label: 'Steng frisører, treningssentre og barer', icon: Store, smitte: 16, skole: 4, jobb: 26 },
    { id: 'skole', label: 'Steng skoler og barnehager', icon: School, smitte: 18, skole: 30, jobb: 14 },
];

const MAX_SKOLE = TILTAK.reduce((s, t) => s + t.skole, 0);
const MAX_JOBB = TILTAK.reduce((s, t) => s + t.jobb, 0);
const MAALSMITTE = 40;

interface TiltakspakkenProps {
    title?: string;
}

export function Tiltakspakken({ title = 'Tiltakspakken: mars 2020' }: TiltakspakkenProps) {
    const [valgte, setValgte] = useState<string[]>([]);
    const [saaNorge, setSaaNorge] = useState(false);

    const sum = useMemo(() => {
        const aktive = TILTAK.filter((t) => valgte.includes(t.id));
        return {
            smitte: aktive.reduce((s, t) => s + t.smitte, 0),
            skole: aktive.reduce((s, t) => s + t.skole, 0),
            jobb: aktive.reduce((s, t) => s + t.jobb, 0),
        };
    }, [valgte]);

    const smittetrykk = Math.max(0, 100 - sum.smitte);
    const iMaal = smittetrykk <= MAALSMITTE;
    const skolePst = Math.round((sum.skole / MAX_SKOLE) * 100);
    const jobbPst = Math.round((sum.jobb / MAX_JOBB) * 100);

    const toggle = (id: string) => {
        setSaaNorge(false);
        setValgte((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
    };

    const visNorge = () => {
        setValgte(TILTAK.map((t) => t.id));
        setSaaNorge(true);
    };

    const reset = () => {
        setValgte([]);
        setSaaNorge(false);
    };

    // Hvem betaler mest i pakken eleven har satt sammen?
    const tyngst =
        sum.skole === 0 && sum.jobb === 0
            ? null
            : skolePst > jobbPst + 8
              ? 'skole'
              : jobbPst > skolePst + 8
                ? 'jobb'
                : 'begge';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er regjeringen. Slå på tiltak til smittetrykket er under 40, og se hvem
                        som betaler for pakken din.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                {/* Tiltakskort */}
                <div className="space-y-2">
                    {TILTAK.map((t) => {
                        const aktiv = valgte.includes(t.id);
                        const Ikon = t.icon;
                        return (
                            <motion.button
                                key={t.id}
                                onClick={() => toggle(t.id)}
                                whileTap={{ scale: 0.98 }}
                                animate={{
                                    backgroundColor: aktiv ? '#eef2ff' : '#ffffff',
                                    borderColor: aktiv ? '#a5b4fc' : '#e2e8f0',
                                }}
                                transition={{ duration: 0.18 }}
                                className="w-full text-left border rounded-xl px-3 py-2.5 flex items-center gap-3 shadow-sm hover:shadow-md"
                            >
                                <motion.span
                                    animate={{ scale: aktiv ? 1.1 : 1 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        aktiv ? 'bg-indigo-600' : 'bg-slate-100'
                                    }`}
                                >
                                    <Ikon
                                        className={`w-4 h-4 ${aktiv ? 'text-white' : 'text-slate-500'}`}
                                    />
                                </motion.span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-slate-800 leading-snug">
                                        {t.label}
                                    </span>
                                    <span className="block text-[11px] text-slate-500 mt-0.5">
                                        Smitte ned {t.smitte} · Skole {t.skole} · Jobb {t.jobb}
                                    </span>
                                </span>
                                <span
                                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                        aktiv
                                            ? 'border-indigo-600 bg-indigo-600'
                                            : 'border-slate-300 bg-white'
                                    }`}
                                >
                                    {aktiv && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Målere */}
                <div className="space-y-4">
                    <div>
                        <div className="flex items-baseline justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-600">Smittetrykk</span>
                            <motion.span
                                key={smittetrykk}
                                initial={{ scale: 1.25 }}
                                animate={{ scale: 1 }}
                                className={`text-sm font-bold ${
                                    iMaal ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                            >
                                {smittetrykk}
                            </motion.span>
                        </div>
                        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: `${smittetrykk}%` }}
                                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                                className={`h-full rounded-full ${
                                    iMaal ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                            />
                        </div>
                        <div className="relative h-4 mt-0.5">
                            <span
                                className="absolute text-[10px] text-slate-500 -translate-x-1/2"
                                style={{ left: `${MAALSMITTE}%` }}
                            >
                                mål: 40
                            </span>
                        </div>
                    </div>

                    <Kostnad
                        etikett="Skole og unge betaler"
                        prosent={skolePst}
                        farge="bg-amber-500"
                    />
                    <Kostnad etikett="Jobb og økonomi betaler" prosent={jobbPst} farge="bg-sky-600" />

                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Tallene er forenklet. De viser retningen forskerne og myndighetene
                            regnet med, ikke nøyaktige mål.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-5 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={saaNorge ? 'norge' : iMaal ? 'maal' : valgte.length ? 'gang' : 'start'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`px-4 py-3 rounded-lg border text-sm leading-relaxed ${
                            saaNorge
                                ? 'bg-blue-50 border-blue-200 text-blue-800'
                                : iMaal
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                    >
                        {saaNorge ? (
                            <>
                                Dette er omtrent pakken Norge slo på 12. mars 2020, alt på én dag.
                                Smitten stupte. Prisen var skoler, jobber og et helt år av livet til
                                mange unge.
                            </>
                        ) : iMaal ? (
                            <>
                                Du klarte målet. Men se på de to nederste stolpene:{' '}
                                {tyngst === 'skole'
                                    ? 'pakken din sender mesteparten av regningen til skolen og de unge.'
                                    : tyngst === 'jobb'
                                      ? 'pakken din sender mesteparten av regningen til jobbene og økonomien.'
                                      : 'pakken din deler regningen mellom skolen og jobbene.'}{' '}
                                Ingen pakke er gratis. Politikk under en pandemi er å velge hvem som
                                skal betale.
                            </>
                        ) : valgte.length ? (
                            <>
                                Smittetrykket er {smittetrykk}. Du må under {MAALSMITTE} for at
                                sykehusene skal klare seg. Slå på flere tiltak.
                            </>
                        ) : (
                            <>
                                Ingen tiltak er slått på. Smittetrykket ligger på 100, og sykehusene
                                fylles opp. Trykk på et tiltak for å begynne.
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between gap-3">
                <button
                    onClick={visNorge}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                >
                    <Flag className="w-4 h-4" />
                    Vis pakken Norge valgte
                </button>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}

function Kostnad({
    etikett,
    prosent,
    farge,
}: {
    etikett: string;
    prosent: number;
    farge: string;
}) {
    return (
        <div>
            <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">{etikett}</span>
                <span className="text-sm font-bold text-slate-700">{prosent}</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    animate={{ width: `${prosent}%` }}
                    transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                    className={`h-full rounded-full ${farge}`}
                />
            </div>
        </div>
    );
}
