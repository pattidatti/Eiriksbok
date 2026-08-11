import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Hammer, RotateCcw, Sparkles, X } from 'lucide-react';

interface HanStiftetIngenReligionProps {
    title?: string;
}

type Zone = 'levetid' | 'etter';

interface Stein {
    id: number;
    kort: string;
    lang: string;
    zone: Zone;
    fasit: string;
}

const STEINER: Stein[] = [
    {
        id: 1,
        kort: 'Døpt av Johannes',
        lang: 'Han lot seg døpe av Johannes døperen og begynte å reise rundt og forkynne.',
        zone: 'levetid',
        fasit: 'Dette skjedde mens han levde. Det offentlige virket hans varte kort, kanskje bare ett år, og ikke mer enn tre.',
    },
    {
        id: 2,
        kort: 'Navnet kristne',
        lang: 'Tilhengerne begynte å bli kalt kristne.',
        zone: 'etter',
        fasit: 'Det første stedet der tilhengerne av Jesus ble kalt kristne, var byen Antiokia. Navnet kom først i bruk etter hans død.',
    },
    {
        id: 3,
        kort: 'Korsfestet i Jerusalem',
        lang: 'Han ble korsfestet i Jerusalem i påsken, rundt år 30.',
        zone: 'levetid',
        fasit: 'Dette regner historikere som sikkert. Også ikke-kristne forfattere som Josefus og Tacitus nevner korsfestelsen.',
    },
    {
        id: 4,
        kort: 'Kristus er sann Gud',
        lang: 'Læren om at Kristus er sann Gud, av samme vesen som Faderen.',
        zone: 'etter',
        fasit: 'Dette slo kirkemøtet i Nikea fast i år 325, nesten 300 år etter at Jesus døde. Formuleringen kommer fra kirkemøtet, ikke fra Jesus selv.',
    },
    {
        id: 5,
        kort: 'Troen på oppstandelsen',
        lang: 'Troen på at han hadde stått opp fra de døde.',
        zone: 'etter',
        fasit: 'Det blir fortalt at han viste seg for noen av disiplene noen dager etter at han døde, og at graven ble funnet tom. Denne troen er selve starten på kristendommen.',
    },
    {
        id: 6,
        kort: 'Fornyelse i jødedommen',
        lang: 'Bevegelsen rundt ham var en fornyelsesbevegelse inne i jødedommen.',
        zone: 'levetid',
        fasit: 'Jesus var jøde og forsto seg selv innenfor rammen av jødisk tradisjon. Det gjorde de som fulgte ham også.',
    },
    {
        id: 7,
        kort: 'De fire evangeliene',
        lang: 'De fire evangeliene ble skrevet ned.',
        zone: 'etter',
        fasit: 'Evangeliene ble trolig skrevet mellom 70 og 90 år etter at Jesus ble født. De bygger på fortellinger som først gikk muntlig fra person til person.',
    },
    {
        id: 8,
        kort: 'Misjon blant ikke-jøder',
        lang: 'Enighet om at Paulus særlig skulle ha ansvar for misjonen blant ikke-jøder.',
        zone: 'etter',
        fasit: 'Dette ble bestemt på apostelmøtet i Jerusalem i år 48. Et hovedtema der var hvordan jødiske og ikke-jødiske Jesus-troende skulle forholde seg til hverandre.',
    },
];

const ANTALL_LEVETID = STEINER.filter((s) => s.zone === 'levetid').length;
const ANTALL_ETTER = STEINER.filter((s) => s.zone === 'etter').length;

export function HanStiftetIngenReligion({
    title = 'Hvem la steinene?',
}: HanStiftetIngenReligionProps) {
    const [index, setIndex] = useState(0);
    const [lagt, setLagt] = useState<number[]>([]);
    const [feil, setFeil] = useState<string | null>(null);
    const [riktig, setRiktig] = useState<string | null>(null);
    const [rist, setRist] = useState(0);

    const ferdig = index >= STEINER.length;
    const kort = ferdig ? null : STEINER[index];

    const velg = (zone: Zone) => {
        if (!kort) return;
        if (zone === kort.zone) {
            setLagt((forrige) => [...forrige, kort.id]);
            setRiktig(kort.fasit);
            setFeil(null);
            setIndex((forrige) => forrige + 1);
        } else {
            setFeil(kort.fasit);
            setRiktig(null);
            setRist((forrige) => forrige + 1);
        }
    };

    const handleReset = () => {
        setIndex(0);
        setLagt([]);
        setFeil(null);
        setRiktig(null);
        setRist(0);
    };

    const iSone = (zone: Zone) => STEINER.filter((s) => lagt.includes(s.id) && s.zone === zone);

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <Hammer className="h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Åtte byggesteiner i kristendommen. Kom denne mens Jesus levde, eller etter
                        at han døde?
                    </p>
                </div>
            </div>

            <div className="px-5 pt-5">
                <AnimatePresence mode="wait">
                    {kort ? (
                        <motion.div
                            key={`stein-${kort.id}-${rist}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, x: feil ? [0, -8, 8, -5, 5, 0] : 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.28 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"
                        >
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Byggestein {index + 1} av {STEINER.length}
                            </p>
                            <p className="mt-1 text-base leading-snug text-slate-800 sm:text-lg">
                                {kort.lang}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4"
                        >
                            <motion.div
                                initial={{ rotate: -25, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-sm"
                            >
                                <Sparkles className="h-5 w-5" />
                            </motion.div>
                            <div>
                                <p className="font-semibold text-emerald-800">
                                    {ANTALL_LEVETID} steiner i grunnmuren, {ANTALL_ETTER} bygd
                                    etterpå.
                                </p>
                                <p className="text-sm text-emerald-700">
                                    Jesus stiftet ingen ny religion. Han levde og døde som jøde.
                                    Kristendommen ble bygd av dem som kom etter ham, rundt troen på
                                    at han hadde stått opp fra de døde.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5 pt-4">
                <motion.button
                    type="button"
                    onClick={() => velg('levetid')}
                    disabled={ferdig}
                    whileHover={ferdig ? undefined : { y: -2 }}
                    whileTap={ferdig ? undefined : { scale: 0.98 }}
                    className="rounded-full border-2 border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:border-amber-400 disabled:cursor-default disabled:opacity-60"
                >
                    Mens Jesus levde
                </motion.button>
                <motion.button
                    type="button"
                    onClick={() => velg('etter')}
                    disabled={ferdig}
                    whileHover={ferdig ? undefined : { y: -2 }}
                    whileTap={ferdig ? undefined : { scale: 0.98 }}
                    className="rounded-full border-2 border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition-colors hover:border-indigo-400 disabled:cursor-default disabled:opacity-60"
                >
                    Etter at han døde
                </motion.button>
            </div>

            <div className="px-5 pt-4">
                <motion.div
                    animate={ferdig ? { scale: [1, 1.01, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5, delay: ferdig ? 0.25 : 0 }}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                        Bygd etter hans død
                    </p>
                    <div className="mt-1.5 grid min-h-[4.5rem] grid-cols-2 gap-1.5 sm:grid-cols-3">
                        <AnimatePresence>
                            {iSone('etter').map((s) => (
                                <motion.p
                                    key={s.id}
                                    initial={{ opacity: 0, y: -14, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    className="rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-[11px] font-medium leading-tight text-indigo-800"
                                >
                                    {s.kort}
                                </motion.p>
                            ))}
                        </AnimatePresence>
                    </div>

                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        Grunnmur: mens Jesus levde
                    </p>
                    <div className="mt-1.5 grid min-h-[2.5rem] grid-cols-3 gap-1.5">
                        <AnimatePresence>
                            {iSone('levetid').map((s) => (
                                <motion.p
                                    key={s.id}
                                    initial={{ opacity: 0, y: -14, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    className="rounded-lg border-2 border-amber-300 bg-amber-100 px-2 py-1.5 text-[11px] font-medium leading-tight text-amber-900"
                                >
                                    {s.kort}
                                </motion.p>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feil ? `feil-${rist}` : riktig ? `riktig-${index}` : 'tom'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                            feil
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : riktig
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-blue-200 bg-blue-50 text-blue-700'
                        }`}
                    >
                        {feil ? (
                            <X className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : riktig ? (
                            <Check className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                            <Hammer className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <span>
                            {feil ??
                                riktig ??
                                'Gjett først, så får du fasiten. Se hvor liten grunnmuren blir til slutt.'}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
                <p className="text-xs text-slate-400">
                    {lagt.length} av {STEINER.length} steiner lagt
                </p>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
