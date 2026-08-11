import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, HandHeart, Layers, Lightbulb, RotateCcw, Sparkles, X } from 'lucide-react';

type Svar = 'soyle' | 'trossannhet';

interface Paastand {
    id: string;
    tekst: string;
    fasit: Svar;
    forklaring: string;
}

interface Soyle {
    id: string;
    navn: string;
    arabisk: string;
    beskrivelse: string;
    form: 'Sier' | 'Gjør';
}

interface FemHandlingerIkkeFemTankerProps {
    title?: string;
}

const PAASTANDER: Paastand[] = [
    {
        id: 'shahada',
        tekst: 'Si setningen: Det er ingen gud uten Gud, og Muhammad er hans profet.',
        fasit: 'soyle',
        forklaring:
            'Dette er trosbekjennelsen, shahada, og den er den første søylen. Legg merke til hva plikten går ut på: å si setningen, ikke bare å mene den.',
    },
    {
        id: 'tawhid',
        tekst: 'Tro at Gud er én, og at ingen kan settes ved siden av ham.',
        fasit: 'trossannhet',
        forklaring:
            'Læren om den ene Guden er selve kjernen i islam, men den står ikke som en egen søyle. Den er innholdet i den første halvdelen av trosbekjennelsen.',
    },
    {
        id: 'salah',
        tekst: 'Be den rituelle bønnen til faste tider gjennom døgnet.',
        fasit: 'soyle',
        forklaring:
            'Salah er den andre søylen. I sunnitradisjonen bes den fem ganger daglig. Sjiamuslimer ber like mange bønner, men samler dem i tre tidspunkter.',
    },
    {
        id: 'dom',
        tekst: 'Tro at alle mennesker skal stå til ansvar overfor Gud på dommens dag.',
        fasit: 'trossannhet',
        forklaring:
            'I islam står både den enkelte og fellesskapet ansvarlig overfor Gud på dommens dag. Det er en grunnleggende tro, men det er ikke en av de fem pliktene.',
    },
    {
        id: 'zakat',
        tekst: 'Gi en fast andel av det årlige overskuddet sitt til dem som trenger det.',
        fasit: 'soyle',
        forklaring:
            'Zakat er den tredje søylen. Den er en plikt, ikke en frivillig gave, og i hadith-litteraturen er den satt til 2,5 prosent av årlig overskudd.',
    },
    {
        id: 'profet',
        tekst: 'Tro at Muhammad er den siste i en lang rekke profeter.',
        fasit: 'trossannhet',
        forklaring:
            'Profetlæren er den andre halvdelen av trosbekjennelsen. Den er helt sentral i islam, men den er ikke ført opp som en egen søyle.',
    },
    {
        id: 'sawm',
        tekst: 'Avstå fra mat og drikke fra daggry til solnedgang gjennom hele ramadan.',
        fasit: 'soyle',
        forklaring:
            'Fasten, sawm, er den fjerde søylen. Den varer en hel måned og gjelder alle voksne muslimer som er i stand til det.',
    },
    {
        id: 'hajj',
        tekst: 'Reise til Mekka én gang i livet, hvis du er i stand til det.',
        fasit: 'soyle',
        forklaring:
            'Pilegrimsferden, hajj, er den femte søylen. Den pålegges én gang i livet, og bare den som er helsemessig, økonomisk og praktisk i stand til å reise.',
    },
];

const SOYLER: Soyle[] = [
    {
        id: 'shahada',
        navn: 'Trosbekjennelsen',
        arabisk: 'shahada',
        beskrivelse: 'Du sier setningen høyt.',
        form: 'Sier',
    },
    {
        id: 'salah',
        navn: 'Bønnen',
        arabisk: 'salah',
        beskrivelse: 'Til faste tider, hver dag.',
        form: 'Gjør',
    },
    {
        id: 'zakat',
        navn: 'Avgiften',
        arabisk: 'zakat',
        beskrivelse: 'En andel av overskuddet, hvert år.',
        form: 'Gjør',
    },
    {
        id: 'sawm',
        navn: 'Fasten',
        arabisk: 'sawm',
        beskrivelse: 'En hel måned, hvert år.',
        form: 'Gjør',
    },
    {
        id: 'hajj',
        navn: 'Pilegrimsferden',
        arabisk: 'hajj',
        beskrivelse: 'Til Mekka, én gang i livet.',
        form: 'Gjør',
    },
];

const VALG = [
    {
        verdi: 'soyle' as Svar,
        tittel: 'Én av de fem søylene',
        under: 'Står på plikt-lista',
    },
    {
        verdi: 'trossannhet' as Svar,
        tittel: 'En trossannhet',
        under: 'Viktig, men ikke en søyle',
    },
];

export function FemHandlingerIkkeFemTanker({
    title = 'Søyle eller trossannhet?',
}: FemHandlingerIkkeFemTankerProps) {
    const [indeks, setIndeks] = useState(0);
    const [valgt, setValgt] = useState<Svar | null>(null);
    const [riktige, setRiktige] = useState(0);
    const [ferdig, setFerdig] = useState(false);

    const naa = PAASTANDER[indeks];
    const erRiktig = valgt !== null && valgt === naa.fasit;

    const velg = (svar: Svar) => {
        if (valgt !== null) return;
        setValgt(svar);
        if (svar === naa.fasit) setRiktige((r) => r + 1);
    };

    const neste = () => {
        if (indeks === PAASTANDER.length - 1) {
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
            <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                <Layers className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Åtte utsagn om islam. Bare fem av dem står på lista over de fem søylene.
                        Velg for hvert utsagn.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-4 flex items-center gap-2">
                {PAASTANDER.map((p, i) => (
                    <motion.span
                        key={p.id}
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
                    {ferdig ? PAASTANDER.length : indeks + 1} av {PAASTANDER.length}
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
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-5"
                        >
                            <div className="flex items-center gap-3">
                                <motion.span
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 14,
                                        delay: 0.1,
                                    }}
                                    className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                                >
                                    <Sparkles className="w-5 h-5 text-white" />
                                </motion.span>
                                <div>
                                    <p className="font-semibold text-emerald-800">
                                        Du fikk {riktige} av {PAASTANDER.length} riktig.
                                    </p>
                                    <p className="text-sm text-emerald-700">
                                        Se på lista under, så ser du poenget.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {SOYLER.map((s, i) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25 + i * 0.09, duration: 0.3 }}
                                        className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-white px-3 py-2"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center shrink-0 tabular-nums">
                                            {i + 1}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-medium text-slate-800">
                                                {s.navn}{' '}
                                                <span className="font-normal text-slate-400">
                                                    ({s.arabisk})
                                                </span>
                                            </span>
                                            <span className="block text-xs text-slate-500 truncate">
                                                {s.beskrivelse}
                                            </span>
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                s.form === 'Sier'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            }`}
                                        >
                                            {s.form}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-4 text-sm text-emerald-800"
                            >
                                Fire av fem søyler er noe du gjør. Troen på den ene Guden, på
                                profetene og på dommens dag er helt sentral i islam, men den står
                                ikke som egne søyler. Lista over det mest sentrale er stort sett en
                                liste over handlinger.
                            </motion.p>
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
                                <Lightbulb className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-slate-800 text-base leading-relaxed">
                                    {naa.tekst}
                                </p>
                            </motion.div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {VALG.map((valg) => {
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
                                                <span className="flex items-center gap-2 font-medium text-slate-800">
                                                    {valg.verdi === 'soyle' ? (
                                                        <HandHeart className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <Lightbulb className="w-4 h-4 text-slate-400" />
                                                    )}
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
                                            <span className="mt-0.5 block text-xs text-slate-500">
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

            <div className="px-6 pb-2 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {valgt !== null && !ferdig ? (
                        <motion.div
                            key={naa.id + valgt}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`rounded-lg border px-4 py-3 text-sm ${
                                erRiktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {naa.forklaring}
                        </motion.div>
                    ) : (
                        !ferdig && (
                            <motion.p
                                key="tom"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
                            >
                                Velg ett av de to svarene, så får du forklaringen med en gang.
                            </motion.p>
                        )
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 py-4 flex items-center justify-between gap-3">
                {ferdig ? (
                    <span className="text-sm text-slate-500">Ferdig med alle åtte.</span>
                ) : (
                    <button
                        onClick={neste}
                        disabled={valgt === null}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {indeks === PAASTANDER.length - 1 ? 'Se de fem søylene' : 'Neste'}
                    </button>
                )}
                <button
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
