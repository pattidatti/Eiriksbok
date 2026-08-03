import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Sun, Waves, User, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket: etter denne interaksjonen skal eleven forstå at ma'at bandt
// sammen kosmos, staten og enkeltmennesket. For egypterne hang det du gjorde hjemme
// sammen med at sola sto opp og Nilen flommet - alt var samme balanse.

interface MaatValg {
    handling: string;
    virkning: string;
}

interface MaatNiva {
    id: string;
    label: string;
    undertittel: string;
    maat: MaatValg;
    isfet: MaatValg;
}

interface MaatBalansenProps {
    title?: string;
    intro?: string;
    nivaer?: MaatNiva[];
}

type Valg = 'maat' | 'isfet';

const STANDARD_NIVAER: MaatNiva[] = [
    {
        id: 'kosmos',
        label: 'Kosmos',
        undertittel: 'Sola, Nilen og året',
        maat: {
            handling: 'Sola står opp, og Nilen flommer i rett tid',
            virkning: 'Verden går sin vante gang. Egypterne kalte denne rytmen ma\'at.',
        },
        isfet: {
            handling: 'Slangen Apofis stanser solbåten i natten',
            virkning: 'Egypterne fryktet at mørket kunne vinne og at året ville bryte sammen.',
        },
    },
    {
        id: 'staten',
        label: 'Staten',
        undertittel: 'Farao og embetsmennene',
        maat: {
            handling: 'Farao ofrer til gudene og dømmer rettferdig',
            virkning: 'Faraos viktigste oppgave var nettopp å holde ma\'at oppe.',
        },
        isfet: {
            handling: 'Dommeren tar imot bestikkelser og flytter grensesteinen',
            virkning: 'Da sviktet staten sin del av balansen, mente egypterne.',
        },
    },
    {
        id: 'mennesket',
        label: 'Mennesket',
        undertittel: 'Ditt eget liv',
        maat: {
            handling: 'Du gir brød til den sultne og sier sant',
            virkning: 'Hjertet ditt holdt seg lett, og du kunne bestå dommen etter døden.',
        },
        isfet: {
            handling: 'Du lyver og tar det som ikke er ditt',
            virkning: 'Hjertet ble tungt av det du gjorde. Det var hjertet som ble veid.',
        },
    },
];

const NIVA_IKON = [Sun, Scale, User];

export function MaatBalansen({
    title = "Ma'at-balansen",
    intro = "Verden er i uorden. Velg ma'at på alle tre nivåene og se hva egypterne trodde skjedde.",
    nivaer = STANDARD_NIVAER,
}: MaatBalansenProps) {
    const start = () =>
        Object.fromEntries(nivaer.map((n) => [n.id, 'isfet' as Valg])) as Record<string, Valg>;

    const [valg, setValg] = useState<Record<string, Valg>>(start);
    const [sist, setSist] = useState<{ niva: string; valgt: Valg } | null>(null);

    const orden = nivaer.filter((n) => valg[n.id] === 'maat').length;
    const andel = nivaer.length > 0 ? orden / nivaer.length : 0;
    const ferdig = orden === nivaer.length;

    const velg = (nivaId: string, v: Valg) => {
        setValg((f) => ({ ...f, [nivaId]: v }));
        setSist({ niva: nivaId, valgt: v });
    };

    const nullstill = () => {
        setValg(start());
        setSist(null);
    };

    const sistNiva = sist ? nivaer.find((n) => n.id === sist.niva) : null;
    const sistTekst = sistNiva ? sistNiva[sist!.valgt].virkning : null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Verdensruta - reagerer umiddelbart på hvert valg */}
            <div className="px-5 sm:px-6 pt-5">
                <div className="relative h-40 sm:h-44 rounded-xl overflow-hidden border border-slate-200">
                    {/* Himmel */}
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            background:
                                andel === 1
                                    ? 'linear-gradient(to bottom, #fde68a, #fef3c7 55%, #fdf6e3)'
                                    : andel >= 0.5
                                      ? 'linear-gradient(to bottom, #d6c9a8, #e7dcc4 55%, #efe7d5)'
                                      : 'linear-gradient(to bottom, #6b6480, #8a8296 55%, #b3aab0)',
                        }}
                        transition={{ duration: 0.7 }}
                    />

                    {/* Sola */}
                    <motion.div
                        className="absolute rounded-full"
                        style={{ right: '12%', top: '14%', width: 46, height: 46 }}
                        animate={{
                            backgroundColor: andel === 1 ? '#fbbf24' : '#c9c3ae',
                            opacity: 0.35 + andel * 0.65,
                            scale: 0.7 + andel * 0.35,
                            boxShadow:
                                andel === 1
                                    ? '0 0 44px 16px rgba(251,191,36,0.55)'
                                    : '0 0 0 0 rgba(0,0,0,0)',
                        }}
                        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                    />

                    {/* Apofis - kaosslangen kryper inn når ma'at mangler */}
                    <motion.div
                        className="absolute left-0 top-0 bottom-0"
                        style={{
                            background:
                                'linear-gradient(to right, rgba(49,32,64,0.85), rgba(49,32,64,0))',
                        }}
                        animate={{ width: `${(1 - andel) * 62}%`, opacity: 1 - andel }}
                        transition={{ duration: 0.6 }}
                    />

                    {/* Åkeren */}
                    <div className="absolute left-0 right-0" style={{ bottom: 34 }}>
                        <div className="flex items-end gap-1.5 px-6">
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <motion.div
                                    key={i}
                                    className="flex-1 rounded-t-sm"
                                    animate={{
                                        height: 8 + andel * 22,
                                        backgroundColor: andel === 1 ? '#7f9a3c' : '#9a8a63',
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 150,
                                        damping: 16,
                                        delay: i * 0.03,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Nilen */}
                    <motion.div
                        className="absolute left-0 right-0 bottom-0"
                        animate={{
                            height: 14 + andel * 20,
                            backgroundColor: andel === 1 ? '#3f7f9c' : '#7d7159',
                        }}
                        transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                    />

                    {/* Statuslinje i ruta */}
                    <div className="absolute top-2 left-3 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-white/85 text-[11px] font-semibold text-slate-700">
                            Balanse {orden} av {nivaer.length}
                        </span>
                    </div>

                    {/* Seiersanimasjon */}
                    <AnimatePresence>
                        {ferdig && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="px-4 py-2 rounded-full bg-white/90 border border-amber-300 text-amber-800 text-sm font-semibold shadow-md flex items-center gap-2">
                                    <Waves className="w-4 h-4" />
                                    Ma&apos;at er hel. Verden holder.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Primær interaksjonsflate: de tre nivåene */}
            <div className="px-5 sm:px-6 py-5 grid gap-3 sm:grid-cols-3">
                {nivaer.map((n, i) => {
                    const Ikon = NIVA_IKON[i % NIVA_IKON.length];
                    const aktiv = valg[n.id];
                    return (
                        <div
                            key={n.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2"
                        >
                            <div className="flex items-center gap-2">
                                <Ikon className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                                        {n.label}
                                    </p>
                                    <p className="text-xs text-slate-500 leading-tight">
                                        {n.undertittel}
                                    </p>
                                </div>
                            </div>

                            {(['maat', 'isfet'] as Valg[]).map((v) => {
                                const erValgt = aktiv === v;
                                const erMaat = v === 'maat';
                                return (
                                    <motion.button
                                        key={v}
                                        type="button"
                                        onClick={() => velg(n.id, v)}
                                        whileTap={{ scale: 0.97 }}
                                        animate={{ scale: erValgt ? 1.02 : 1 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                        className={`text-left rounded-lg border px-3 py-2 text-xs leading-snug ${
                                            erValgt
                                                ? erMaat
                                                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-md'
                                                    : 'bg-violet-50 border-violet-300 text-violet-900 shadow-md'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                                        }`}
                                    >
                                        <span
                                            className={`block text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                                                erMaat ? 'text-amber-600' : 'text-violet-600'
                                            }`}
                                        >
                                            {erMaat ? "Ma'at" : 'Isfet'}
                                        </span>
                                        {n[v].handling}
                                    </motion.button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-5 sm:mx-6 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={ferdig ? 'ferdig' : (sist?.niva ?? 'tom') + (sist?.valgt ?? '')}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            ferdig
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : sist?.valgt === 'isfet'
                                  ? 'bg-violet-50 border-violet-200 text-violet-800'
                                  : sist?.valgt === 'maat'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {ferdig
                            ? "Alle tre nivåene står i ma'at. Slik hang verden sammen for egypterne: rytmen i naturen, rettferdigheten i staten og handlingene dine hjemme var deler av den samme balansen."
                            : (sistTekst ??
                              "Trykk på et kort. Ma'at var ordenen som holdt verden oppe, isfet var uorden og løgn.")}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    Egypterne mente at ma&apos;at måtte holdes oppe hver eneste dag - av gudene, av
                    farao og av hvert menneske.
                </p>
                <button
                    type="button"
                    onClick={nullstill}
                    className="shrink-0 inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
