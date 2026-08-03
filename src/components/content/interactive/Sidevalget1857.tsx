import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Flame, Shield, Check, X, Lightbulb } from 'lucide-react';

// Signaturkomponent for artikkelen «Opprøret i 1857».
//
// Lyspære-øyeblikket: Etter denne interaksjonen skal eleven forstå at opprøret i
// 1857 ikke var «India mot Storbritannia». Britene vant fordi store deler av
// India aldri ble med - og fordi britisk makt hele veien hvilte på indiske
// soldater og indiske fyrster.

type Side = 'oppror' | 'britene';

interface Gruppe {
    id: string;
    navn: string;
    beskrivelse: string;
    fasit: Side;
    forklaring: string;
}

interface Sidevalget1857Props {
    title?: string;
    grupper?: Gruppe[];
}

const STANDARD_GRUPPER: Gruppe[] = [
    {
        id: 'bengal',
        navn: 'Bengal-hæren',
        beskrivelse: 'Den største av kompaniets tre hærer, med hovedsete i nord.',
        fasit: 'oppror',
        forklaring:
            'Det var her opprøret startet. Nesten hele Bengal-hæren gjorde mytteri i 1857 - alle de ti kavaleriregimentene og de fleste av de 74 infanteriregimentene.',
    },
    {
        id: 'bombay-madras',
        navn: 'Bombay- og Madras-hærene',
        beskrivelse: 'Kompaniets to andre hærer, i vest og i sør.',
        fasit: 'britene',
        forklaring:
            'De ble nesten ikke berørt. To av tre hærer fortsatte å adlyde britiske offiserer, og det er en hovedgrunn til at opprøret aldri ble en krig for hele India.',
    },
    {
        id: 'sikher',
        navn: 'Sikh-soldatene i Punjab',
        beskrivelse: 'Soldater fra nordvest, som selv hadde tapt en krig mot britene ti år før.',
        fasit: 'britene',
        forklaring:
            'De sluttet seg til britene. Forsterkninger fra Punjab var med på å ta Delhi tilbake i september 1857.',
    },
    {
        id: 'gurkha',
        navn: 'Gurkha-soldatene fra Nepal',
        beskrivelse: 'Leiesoldater fra fjellene nord for India.',
        fasit: 'britene',
        forklaring:
            'Også gurkhaene støttet britene. Sammen med sikhene og punjabiske muslimer utgjorde de en hær britene kunne stole på.',
    },
    {
        id: 'stormogulen',
        navn: 'Stormogulen Bahadur Shah Zafar',
        beskrivelse: 'Den siste mogulkeiseren, en gammel mann uten reell makt i Delhi.',
        fasit: 'oppror',
        forklaring:
            'Opprørerne nådde Delhi 11. mai 1857 og ropte ham ut som keiser. Han sa ja, og håpet mogulstyret kunne gjenopprettes.',
    },
    {
        id: 'fyrstene',
        navn: 'De fleste indiske fyrstene',
        beskrivelse: 'Hundrevis av små og store fyrster styrte fortsatt sine egne riker.',
        fasit: 'britene',
        forklaring:
            'Bortsett fra stormogulen, sønnene hans og Nana Sahib ble ingen av de viktige fyrstene med. De aller fleste holdt seg i ro eller hjalp britene.',
    },
    {
        id: 'jhansi',
        navn: 'Rani Lakshmibai av Jhansi',
        beskrivelse: 'En fyrstinne som hadde mistet riket sitt til britene fordi hun ikke fikk arving.',
        fasit: 'oppror',
        forklaring:
            'Hun ble et av opprørets mest kjente ansikter. Jhansi falt likevel 3. april 1858, og hun døde i kampene om Gwalior.',
    },
];

export function Sidevalget1857({
    title = 'Hvem valgte hvilken side i 1857?',
    grupper = STANDARD_GRUPPER,
}: Sidevalget1857Props) {
    const [indeks, setIndeks] = useState(0);
    const [svar, setSvar] = useState<Record<string, Side>>({});
    const [siste, setSiste] = useState<{ gruppe: Gruppe; valg: Side } | null>(null);

    const ferdig = indeks >= grupper.length;
    const aktiv = ferdig ? null : grupper[indeks];

    const velg = (side: Side) => {
        if (!aktiv) return;
        setSvar((f) => ({ ...f, [aktiv.id]: side }));
        setSiste({ gruppe: aktiv, valg: side });
        setIndeks((i) => i + 1);
    };

    const tilbakestill = () => {
        setIndeks(0);
        setSvar({});
        setSiste(null);
    };

    const plassert = (side: Side) => grupper.filter((g) => svar[g.id] === side);
    const antallRiktige = grupper.filter((g) => svar[g.id] === g.fasit).length;
    const medIOpproret = grupper.filter((g) => g.fasit === 'oppror').length;
    const motOpproret = grupper.length - medIOpproret;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Plasser hver gruppe på den siden du tror den valgte.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-start">
                    {/* Kolonne: opprør */}
                    <Kolonne
                        tittel="Ble med i opprøret"
                        ikon={<Flame className="w-4 h-4" />}
                        farge="rose"
                        grupper={plassert('oppror')}
                        svar={svar}
                    />

                    {/* Midten: kortet som skal plasseres */}
                    <div className="sm:w-56 flex flex-col items-center justify-start">
                        <AnimatePresence mode="wait">
                            {aktiv ? (
                                <motion.div
                                    key={aktiv.id}
                                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm"
                                >
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                                        Gruppe {indeks + 1} av {grupper.length}
                                    </p>
                                    <p className="mt-1 font-bold text-slate-800 leading-snug">
                                        {aktiv.navn}
                                    </p>
                                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                                        {aktiv.beskrivelse}
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="ferdig"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"
                                >
                                    <p className="text-3xl font-black text-emerald-600 tabular-nums">
                                        {antallRiktige}/{grupper.length}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-emerald-800">
                                        riktig plassert
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {aktiv && (
                            <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                                <button
                                    onClick={() => velg('oppror')}
                                    className="flex items-center justify-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-bold text-white transition-colors"
                                >
                                    <Flame className="w-3.5 h-3.5" />
                                    Opprør
                                </button>
                                <button
                                    onClick={() => velg('britene')}
                                    className="flex items-center justify-center gap-1.5 rounded-full bg-sky-700 hover:bg-sky-800 px-3 py-2 text-xs font-bold text-white transition-colors"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    Britene
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Kolonne: britene */}
                    <Kolonne
                        tittel="Sto med britene"
                        ikon={<Shield className="w-4 h-4" />}
                        farge="sky"
                        grupper={plassert('britene')}
                        svar={svar}
                    />
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="innsikt"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3"
                        >
                            <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-900 leading-relaxed">
                                    Av de {grupper.length} gruppene her ble {medIOpproret} med i
                                    opprøret, mens {motOpproret} sto med britene. Det er nøkkelen:
                                    dette var ikke India mot Storbritannia. Britene hadde rundt 45
                                    000 egne soldater i India og over 230 000 indiske. Da Bengal-hæren
                                    gjorde opprør, var det de andre inderne som avgjorde utfallet.
                                </p>
                            </div>
                        </motion.div>
                    ) : siste ? (
                        <motion.div
                            key={siste.gruppe.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg px-4 py-3 border ${
                                siste.valg === siste.gruppe.fasit
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                {siste.valg === siste.gruppe.fasit ? (
                                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                )}
                                <p className="text-sm leading-relaxed">
                                    <span className="font-bold">{siste.gruppe.navn}:</span>{' '}
                                    {siste.gruppe.forklaring}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700"
                        >
                            Velg en side for gruppen i midten. Du får svaret med én gang.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {ferdig ? 'Alle gruppene er plassert.' : `${grupper.length - indeks} igjen`}
                </p>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}

function Kolonne({
    tittel,
    ikon,
    farge,
    grupper,
    svar,
}: {
    tittel: string;
    ikon: React.ReactNode;
    farge: 'rose' | 'sky';
    grupper: Gruppe[];
    svar: Record<string, Side>;
}) {
    const stil =
        farge === 'rose'
            ? 'border-rose-200 bg-rose-50/60 text-rose-700'
            : 'border-sky-200 bg-sky-50/60 text-sky-700';

    return (
        <div className={`rounded-xl border ${stil} p-3 min-h-[7rem]`}>
            <div className="flex items-center gap-1.5 mb-2">
                {ikon}
                <p className="text-xs font-bold uppercase tracking-wide">{tittel}</p>
            </div>
            <div className="space-y-1.5">
                {grupper.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">Ingen ennå</p>
                )}
                {grupper.map((g) => {
                    const riktig = svar[g.id] === g.fasit;
                    return (
                        <motion.div
                            key={g.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`flex items-start gap-1.5 rounded-lg bg-white border px-2.5 py-1.5 ${
                                riktig ? 'border-emerald-200' : 'border-rose-300'
                            }`}
                        >
                            {riktig ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            ) : (
                                <X className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                            )}
                            <span className="text-[11px] font-semibold text-slate-700 leading-snug">
                                {g.navn}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
