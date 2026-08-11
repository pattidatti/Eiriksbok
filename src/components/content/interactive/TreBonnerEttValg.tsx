import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Compass,
    Sun,
    Sunrise,
    Sunset,
    Clock,
    Droplets,
    Hand,
    Sparkles,
    RotateCcw,
} from 'lucide-react';

interface TreBonnerEttValgProps {
    title?: string;
}

interface BonnValg {
    id: 'kort' | 'middels' | 'lang';
    navn: string;
    merke: string;
    naar: string;
    detaljer: string[];
    farge: string;
    kant: string;
    tekst: string;
}

const VALG: BonnValg[] = [
    {
        id: 'kort',
        navn: 'Den korte',
        merke: '1 gang',
        naar: 'Mellom middag og solnedgang',
        detaljer: [
            'Noen få linjer, lest en gang i døgnet',
            'Ingen faste bevegelser',
            'Passer en dag der alt går fort',
        ],
        farge: 'bg-amber-50',
        kant: 'border-amber-300',
        tekst: 'text-amber-700',
    },
    {
        id: 'middels',
        navn: 'Den middels lange',
        merke: '3 ganger',
        naar: 'Morgen, middag og kveld',
        detaljer: [
            'Leses tre ganger samme døgn',
            'Du står, bøyer deg med hendene på knærne og setter deg',
            'Deler dagen i tre faste stopp',
        ],
        farge: 'bg-sky-50',
        kant: 'border-sky-300',
        tekst: 'text-sky-700',
    },
    {
        id: 'lang',
        navn: 'Den lange',
        merke: '1 gang',
        naar: 'En gang i løpet av døgnet',
        detaljer: [
            'Den lengste av de tre, lest en gang i døgnet',
            'Du står, løfter hendene, kneler og bøyer pannen mot bakken',
            'Krever tid og ro du må sette av selv',
        ],
        farge: 'bg-violet-50',
        kant: 'border-violet-300',
        tekst: 'text-violet-700',
    },
];

const FELLES = [
    { ikon: Compass, tekst: 'Vend deg mot Bahjí ved Akko' },
    { ikon: Droplets, tekst: 'Vask hender og ansikt først' },
    { ikon: Hand, tekst: 'Du velger selv, ingen prest velger for deg' },
];

const IKON = {
    kort: Sun,
    middels: Sunrise,
    lang: Sunset,
};

export function TreBonnerEttValg({ title = 'Tre bønner, ett valg' }: TreBonnerEttValgProps) {
    const [valgt, setValgt] = useState<BonnValg['id'] | null>(null);
    const [besokt, setBesokt] = useState<BonnValg['id'][]>([]);

    const ferdig = besokt.length === 3;
    const aktiv = VALG.find((v) => v.id === valgt) ?? null;

    const velg = (id: BonnValg['id']) => {
        setValgt(id);
        setBesokt((forrige) => (forrige.includes(id) ? forrige : [...forrige, id]));
    };

    const tilbakestill = () => {
        setValgt(null);
        setBesokt([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Compass className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg dagens bønn. Prøv alle tre, og se hva som aldri forandrer seg.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-5 grid gap-3 sm:grid-cols-3 items-start">
                {VALG.map((valg) => {
                    const Ikon = IKON[valg.id];
                    const erValgt = valgt === valg.id;
                    const erBesokt = besokt.includes(valg.id);
                    return (
                        <motion.button
                            key={valg.id}
                            type="button"
                            onClick={() => velg(valg.id)}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            animate={{ opacity: valgt && !erValgt ? 0.65 : 1 }}
                            className={`text-left rounded-xl border p-4 min-h-[150px] w-full transition-shadow ${
                                erValgt
                                    ? `${valg.farge} ${valg.kant} shadow-md`
                                    : 'bg-slate-50 border-slate-200 shadow-sm hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <Ikon
                                    className={`w-5 h-5 ${erValgt ? valg.tekst : 'text-slate-400'}`}
                                />
                                <span
                                    className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${
                                        erValgt
                                            ? 'bg-white/80 text-slate-600'
                                            : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {valg.merke} i døgnet
                                </span>
                            </div>
                            <p className="mt-2 font-semibold text-slate-800 text-sm">{valg.navn}</p>
                            <p className="mt-1 text-xs text-slate-500 flex items-start gap-1.5">
                                <Clock className="w-3.5 h-3.5 mt-px shrink-0" />
                                <span>{valg.naar}</span>
                            </p>
                            {erBesokt && !erValgt && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-3 text-[11px] text-slate-400"
                                >
                                    Prøvd
                                </motion.p>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-6 pt-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 min-h-[132px]">
                    <AnimatePresence mode="wait">
                        {aktiv ? (
                            <motion.div
                                key={aktiv.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.22 }}
                            >
                                <p className={`text-sm font-semibold ${aktiv.tekst}`}>
                                    Da ser dagen din slik ut
                                </p>
                                <ul className="mt-2 space-y-1.5">
                                    {aktiv.detaljer.map((linje) => (
                                        <motion.li
                                            key={linje}
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-sm text-slate-600 flex gap-2"
                                        >
                                            <span className="text-slate-300">•</span>
                                            <span>{linje}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                        ) : (
                            <motion.p
                                key="tom"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-slate-400"
                            >
                                Trykk på en av de tre bønnene over.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="px-6 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Dette er likt uansett hva du velger
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {FELLES.map((felles, i) => {
                        const Ikon = felles.ikon;
                        return (
                            <motion.div
                                key={felles.tekst}
                                animate={{
                                    backgroundColor: valgt ? '#ecfdf5' : '#f8fafc',
                                    borderColor: valgt ? '#a7f3d0' : '#e2e8f0',
                                }}
                                transition={{ duration: 0.3, delay: valgt ? i * 0.08 : 0 }}
                                className="rounded-lg border px-3 py-2 flex items-center gap-2"
                            >
                                <motion.span
                                    animate={valgt ? { rotate: [0, -12, 8, 0] } : { rotate: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.08 }}
                                    className={valgt ? 'text-emerald-600' : 'text-slate-400'}
                                >
                                    <Ikon className="w-4 h-4" />
                                </motion.span>
                                <span
                                    className={`text-xs ${valgt ? 'text-emerald-800' : 'text-slate-500'}`}
                                >
                                    {felles.tekst}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="mx-6 mt-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                    >
                        <motion.span
                            animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.25, 1] }}
                            transition={{ duration: 0.7 }}
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 text-emerald-600" />
                        </motion.span>
                        <span>
                            Du har prøvd alle tre. Alle oppfyller den samme plikten. Bønnen er ikke
                            valgfri, men formen er det, og valget tar du selv hver dag.
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-6 py-5 flex items-center justify-between">
                <p className="text-xs text-slate-500">Prøvd {besokt.length} av 3</p>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
