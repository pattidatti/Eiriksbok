import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    Coins,
    HandHeart,
    RotateCcw,
    Sparkles,
    Users,
    Vote,
    X,
} from 'lucide-react';

// Syforeningen: eleven følger kvinneforeningene i misjonsbevegelsen fra det første
// møtet i Lyngdal i 1844 til kvinnene fikk stemmerett i Misjonsselskapet i 1904.
// På hvert møte gjetter eleven først, og så vokser foreningen og en ny ferdighet tennes.
//
// Lyspære-øyeblikket: en syforening i bygda var mer enn strikking. Kvinnene lærte å
// drive en organisasjon - samle penger, holde møter og til slutt stemme - og ble
// den største delen av misjonsbevegelsen.
//
// Tallene bygger på SNL: Norseth (Gustava Kielland) og Engelsviken mfl. (Det Norske
// Misjonsselskap).

interface SyforeningenProps {
    title?: string;
}

type Phase = 'gjett' | 'svart' | 'ferdig';

interface Valg {
    tekst: string;
    riktig: boolean;
}

interface Stasjon {
    aar: string;
    sted: string;
    sporsmal: string;
    valg: Valg[];
    forklaring: string;
    kvinner: number;
    menn: number | null;
    ferdighet: string;
}

const STASJONER: Stasjon[] = [
    {
        aar: '1844',
        sted: 'Lyngdal',
        sporsmal: 'Gustava Kielland samler bondekvinner i Lyngdal. Hva gjør de på møtet?',
        valg: [
            { tekst: 'De drar ut som misjonærer neste dag', riktig: false },
            { tekst: 'De arbeider sammen en hel dag for misjonen', riktig: true },
            { tekst: 'De velger ny prest til bygda', riktig: false },
        ],
        forklaring:
            'Møtet var en hel arbeidsdag for misjonen. Kvinnene arbeidet, lærte nye ting og ble et fellesskap der forskjellen mellom rik og fattig ble mindre.',
        kvinner: 1,
        menn: null,
        ferdighet: 'Arbeide sammen for en sak',
    },
    {
        aar: '1882',
        sted: 'Hele landet',
        sporsmal:
            'Det finnes 830 misjonsforeninger for menn. Hvor mange foreninger for kvinner finnes det?',
        valg: [
            { tekst: 'Rundt 400', riktig: false },
            { tekst: 'Rundt 830', riktig: false },
            { tekst: 'Rundt 1700', riktig: true },
        ],
        forklaring:
            'Kvinnene hadde omtrent dobbelt så mange foreninger som mennene. Lyngdal-foreningen var blitt en modell for resten av landet.',
        kvinner: 1700,
        menn: 830,
        ferdighet: 'Samle penger og holde møter',
    },
    {
        aar: '1904',
        sted: 'Hele landet',
        sporsmal: 'Kvinneforeningene er blitt 3500. Hva får kvinnene i Misjonsselskapet dette året?',
        valg: [
            { tekst: 'Lov til å preke', riktig: false },
            { tekst: 'Stemmerett', riktig: true },
            { tekst: 'Sitt eget skip', riktig: false },
        ],
        forklaring:
            'I 1904 fikk kvinnene stemmerett i Misjonsselskapet. Preke fikk de fortsatt ikke - det var forbeholdt menn.',
        kvinner: 3500,
        menn: null,
        ferdighet: 'Stemme og være med å bestemme',
    },
];

const MAKS = 3500;
const IKONER = [HandHeart, Coins, Vote];

export function Syforeningen({
    title = 'Syforeningen: Fra ett møte til tusenvis',
}: SyforeningenProps) {
    const [steg, setSteg] = useState(0);
    const [valgt, setValgt] = useState<number | null>(null);
    const [phase, setPhase] = useState<Phase>('gjett');
    const [treff, setTreff] = useState(0);

    const stasjon = STASJONER[Math.min(steg, STASJONER.length - 1)];
    const antallLaast = phase === 'gjett' ? steg : steg + 1;
    const visKvinner = antallLaast === 0 ? 0 : STASJONER[antallLaast - 1].kvinner;
    const visMenn = antallLaast === 0 ? null : STASJONER[antallLaast - 1].menn;

    const velg = (i: number) => {
        if (phase !== 'gjett') return;
        setValgt(i);
        setPhase('svart');
        if (stasjon.valg[i].riktig) setTreff((t) => t + 1);
    };

    const neste = () => {
        if (steg >= STASJONER.length - 1) {
            setPhase('ferdig');
            return;
        }
        setSteg(steg + 1);
        setValgt(null);
        setPhase('gjett');
    };

    const reset = () => {
        setSteg(0);
        setValgt(null);
        setPhase('gjett');
        setTreff(0);
    };

    const bredde = (n: number) => `${Math.max(n > 0 ? 2 : 0, (n / MAKS) * 100)}%`;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Følg kvinneforeningene i tre møter. Gjett svaret, og se foreningen vokse.
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-5 grid md:grid-cols-[minmax(0,1fr)_240px] gap-5">
                <div>
                    <div className="flex gap-2 mb-3">
                        {STASJONER.map((s, i) => (
                            <motion.div
                                key={s.aar}
                                animate={{
                                    scale: i === steg && phase !== 'ferdig' ? 1.05 : 1,
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                    i < antallLaast
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : i === steg
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                          : 'bg-slate-50 border-slate-200 text-slate-400'
                                }`}
                            >
                                {s.aar}
                            </motion.div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {phase === 'ferdig' ? (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800"
                            >
                                <div className="flex items-center gap-2 font-semibold mb-1">
                                    <motion.span
                                        animate={{ rotate: [0, 15, -15, 0] }}
                                        transition={{ duration: 0.8, repeat: 2 }}
                                    >
                                        <Sparkles className="w-5 h-5" />
                                    </motion.span>
                                    Du traff {treff} av {STASJONER.length}
                                </div>
                                <p className="text-sm">
                                    En syforening var mer enn strikking. Rundt bordet lærte
                                    kvinnene å samle penger, holde møter og til slutt stemme. Fra
                                    ett møte i Lyngdal ble det Norges første store kvinnebevegelse.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={stasjon.aar}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                    {stasjon.sted}, {stasjon.aar}
                                </p>
                                <p className="font-medium text-slate-800 mb-3">
                                    {stasjon.sporsmal}
                                </p>
                                <div className="space-y-2">
                                    {stasjon.valg.map((v, i) => {
                                        const vist = phase === 'svart';
                                        const stil = !vist
                                            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                            : v.riktig
                                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                              : i === valgt
                                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-400';
                                        return (
                                            <motion.button
                                                key={v.tekst}
                                                onClick={() => velg(i)}
                                                disabled={vist}
                                                whileTap={!vist ? { scale: 0.97 } : undefined}
                                                animate={
                                                    vist && i === valgt && !v.riktig
                                                        ? { x: [0, -6, 6, -4, 0] }
                                                        : { x: 0 }
                                                }
                                                className={`w-full text-left rounded-xl border px-4 py-2 text-sm flex items-center justify-between ${stil}`}
                                            >
                                                {v.tekst}
                                                {vist && v.riktig && <Check className="w-4 h-4" />}
                                                {vist && i === valgt && !v.riktig && (
                                                    <X className="w-4 h-4" />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">
                            Misjonsforeninger
                        </p>
                        <div className="space-y-2">
                            <div>
                                <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                                    <span>Kvinner</span>
                                    <span className="tabular-nums">{visKvinner}</span>
                                </div>
                                <div className="h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-rose-400"
                                        animate={{ width: bredde(visKvinner) }}
                                        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                                    <span>Menn</span>
                                    <span className="tabular-nums">
                                        {visMenn === null ? 'ikke oppgitt' : visMenn}
                                    </span>
                                </div>
                                <div className="h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-sky-400"
                                        animate={{ width: bredde(visMenn ?? 0) }}
                                        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">
                            Det kvinnene lærte
                        </p>
                        <ul className="space-y-1.5">
                            {STASJONER.map((s, i) => {
                                const Ikon = IKONER[i];
                                const aktiv = i < antallLaast;
                                return (
                                    <motion.li
                                        key={s.ferdighet}
                                        animate={{ opacity: aktiv ? 1 : 0.4, scale: aktiv ? 1 : 0.98 }}
                                        className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 ${
                                            aktiv ? 'bg-white text-slate-800' : 'text-slate-400'
                                        }`}
                                    >
                                        <Ikon
                                            className={`w-4 h-4 shrink-0 ${
                                                aktiv ? 'text-indigo-500' : 'text-slate-300'
                                            }`}
                                        />
                                        {s.ferdighet}
                                    </motion.li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mx-6 mb-4 min-h-[56px]">
                <AnimatePresence mode="wait">
                    {phase === 'svart' ? (
                        <motion.div
                            key={`svar-${steg}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {stasjon.forklaring}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`info-${steg}-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm"
                        >
                            {phase === 'ferdig'
                                ? 'Kvinnene fikk ikke preke, men de bar mye av misjonen med pengene og arbeidet sitt.'
                                : 'Velg det svaret du tror er riktig.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'svart' ? (
                    <button
                        onClick={neste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {steg >= STASJONER.length - 1 ? 'Se resultatet' : 'Neste møte'}
                    </button>
                ) : (
                    <span className="text-sm text-slate-500">
                        {phase === 'ferdig' ? 'Ferdig!' : `Møte ${steg + 1} av ${STASJONER.length}`}
                    </span>
                )}
                <button
                    onClick={reset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
