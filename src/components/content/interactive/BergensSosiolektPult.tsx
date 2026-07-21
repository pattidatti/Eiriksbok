import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Sparkles, RotateCcw, Lightbulb, User } from 'lucide-react';

// Signaturkomponent 2 for artikkelen «Bergensk».
//
// Lyspære-øyeblikket: «Sosiolekt er ikke én bryter, men mange små valg. Ved å
// skru på hvert enkelt trekk – pronomen, nekting, spørreord, kj-lyd – bygger
// eleven seg fra en rendyrket penbergenser til en ekte gatebergenser, og ser
// den SAMME setningen forvandle seg. Poenget: ekte bergensere ligger som regel
// et sted i midten og blander.»

interface Akse {
    id: string;
    // Kort forklaring på hva trekket er
    label: string;
    // Formen i penbergensk (fint, nær skriftspråket)
    pen: string;
    // Formen i gatebergensk (folkelig)
    gate: string;
}

// Rekkefølgen her styrer også rekkefølgen ordene får i eksempelsetningen.
const AKSER: Akse[] = [
    { id: 'jeg', label: 'Ordet for «jeg»', pen: 'Jei', gate: 'Eg' },
    { id: 'ikke', label: 'Ordet for «ikke»', pen: 'ikke', gate: 'ikkje' },
    { id: 'hvor', label: 'Ordet for «hvor»', pen: 'vor', gate: 'kor' },
    { id: 'dere', label: 'Ordet for «dere»', pen: 'dere', gate: 'dokkar' },
    { id: 'kj', label: 'Kj-lyden', pen: 'kjøtt', gate: 'sjøtt' },
];

type Valg = Record<string, boolean>; // true = gate, false = pen

const START: Valg = { jeg: false, ikke: false, hvor: false, dere: true, kj: false };

function byggSetning(valg: Valg): { tekst: string; gate: boolean }[] {
    const jeg = valg.jeg ? 'Eg' : 'Jei';
    const ikke = valg.ikke ? 'ikkje' : 'ikke';
    const hvor = valg.hvor ? 'kor' : 'vor';
    const dere = valg.dere ? 'dokkar' : 'dere';
    const kjopte = valg.kj ? 'sjøpte' : 'kjøpte';
    const kjott = valg.kj ? 'sjøttet' : 'kjøttet';
    return [
        { tekst: jeg, gate: valg.jeg },
        { tekst: 'vet', gate: false },
        { tekst: ikke, gate: valg.ikke },
        { tekst: hvor, gate: valg.hvor },
        { tekst: dere, gate: valg.dere },
        { tekst: kjopte, gate: valg.kj },
        { tekst: kjott + '.', gate: valg.kj },
    ];
}

function persona(gateCount: number): { navn: string; farge: string } {
    if (gateCount === 0)
        return { navn: 'Rendyrket penbergensk', farge: 'bg-indigo-50 border-indigo-200 text-indigo-700' };
    if (gateCount <= 2)
        return { navn: 'Moderat penbergensk', farge: 'bg-sky-50 border-sky-200 text-sky-700' };
    if (gateCount <= 4)
        return { navn: 'Moderat gatebergensk', farge: 'bg-amber-50 border-amber-200 text-amber-700' };
    return { navn: 'Ekte gatebergensk', farge: 'bg-rose-50 border-rose-200 text-rose-700' };
}

interface BergensSosiolektPultProps {
    title?: string;
}

export function BergensSosiolektPult({ title = 'Sosiolekt-pulten' }: BergensSosiolektPultProps) {
    const [valg, setValg] = useState<Valg>(START);
    const [settPen, setSettPen] = useState(false);
    const [settGate, setSettGate] = useState(false);

    const gateCount = AKSER.filter((a) => valg[a.id]).length;
    const pers = persona(gateCount);
    const setning = byggSetning(valg);
    const laastOpp = settPen && settGate;

    const registrer = (neste: Valg) => {
        const count = AKSER.filter((a) => neste[a.id]).length;
        if (count === 0) setSettPen(true);
        if (count === AKSER.length) setSettGate(true);
    };

    const toggle = (id: string) => {
        setValg((v) => {
            const neste = { ...v, [id]: !v[id] };
            registrer(neste);
            return neste;
        });
    };

    const settAlle = (gate: boolean) => {
        const neste: Valg = Object.fromEntries(AKSER.map((a) => [a.id, gate]));
        registrer(neste);
        setValg(neste);
    };

    const reset = () => {
        setValg(START);
        setSettPen(false);
        setSettGate(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Skru på hvert trekk og bygg din egen bergenser, fra fin til folkelig.
                    </p>
                </div>
            </div>

            {/* Eksempelsetning */}
            <div className="px-6 pt-5">
                <div className="rounded-xl bg-slate-900 px-4 py-4 text-center">
                    <p className="text-lg font-semibold leading-relaxed">
                        {setning.map((ord, i) => (
                            <span key={i}>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={ord.tekst}
                                        initial={{ y: 6, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={
                                            ord.gate
                                                ? 'text-amber-300'
                                                : ord.tekst === 'vet'
                                                  ? 'text-slate-400'
                                                  : 'text-sky-300'
                                        }
                                    >
                                        {ord.tekst}
                                    </motion.span>
                                </AnimatePresence>
                                {i < setning.length - 1 ? ' ' : ''}
                            </span>
                        ))}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">«{'Jeg vet ikke hvor dere kjøpte kjøttet.'}»</p>
                </div>
            </div>

            {/* Persona + måler */}
            <div className="px-6 pt-4 flex items-center justify-between gap-3">
                <motion.div
                    key={pers.navn}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${pers.farge}`}
                >
                    <User className="w-4 h-4" />
                    {pers.navn}
                </motion.div>
                <div className="flex-1 max-w-[180px] h-2 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-400 to-rose-400"
                        animate={{ width: `${(gateCount / AKSER.length) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>
            </div>

            {/* Akse-brytere */}
            <div className="p-6 pt-4 space-y-2">
                {AKSER.map((akse) => {
                    const erGate = valg[akse.id];
                    return (
                        <div
                            key={akse.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                            <span className="text-sm text-slate-600 flex-shrink-0 w-28">
                                {akse.label}
                            </span>
                            <button
                                onClick={() => toggle(akse.id)}
                                className="flex items-center gap-2 flex-1 justify-end"
                                aria-pressed={erGate}
                            >
                                <span
                                    className={`text-sm font-bold w-16 text-right transition-colors ${
                                        erGate ? 'text-slate-300' : 'text-indigo-600'
                                    }`}
                                >
                                    {akse.pen}
                                </span>
                                <span
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                        erGate ? 'bg-amber-400' : 'bg-indigo-500'
                                    }`}
                                >
                                    <motion.span
                                        layout
                                        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow ${
                                            erGate ? 'right-0.5' : 'left-0.5'
                                        }`}
                                    />
                                </span>
                                <span
                                    className={`text-sm font-bold w-16 text-left transition-colors ${
                                        erGate ? 'text-amber-600' : 'text-slate-300'
                                    }`}
                                >
                                    {akse.gate}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                {laastOpp ? (
                    <motion.div
                        key="innsikt"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-6 mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2"
                    >
                        <Lightbulb className="w-5 h-5 flex-shrink-0 text-amber-500" />
                        <span>
                            Nå har du prøvd begge ytterpunktene. En sosiolekt er ikke én bryter,
                            men mange små valg. De færreste snakker helt rent penbergensk eller
                            helt rent gatebergensk. De fleste bergensere ligger et sted i midten
                            og blander trekkene, og de justerer seg etter hvem de snakker med.
                        </span>
                    </motion.div>
                ) : (
                    <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex gap-2">
                        <Sparkles className="w-5 h-5 flex-shrink-0 text-blue-400" />
                        <span>
                            Prøv begge ytterpunktene: sett alt til «pen» og alt til «gate», og
                            hør forskjellen.
                        </span>
                    </div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => settAlle(false)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
                    >
                        Penbergenser
                    </button>
                    <button
                        onClick={() => settAlle(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
                    >
                        Gategutt
                    </button>
                </div>
                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
