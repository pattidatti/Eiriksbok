import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRight, RotateCcw, Lightbulb, Sparkles } from 'lucide-react';

interface Skatt {
    id: string;
    navn: string;
    fra: string;
    til: string;
    fakta: string;
}

interface KunnskapsbroAndalusProps {
    title?: string;
    skatter?: Skatt[];
}

const STANDARD_SKATTER: Skatt[] = [
    {
        id: 'aristoteles',
        navn: 'Aristoteles',
        fra: 'Gresk filosofi som Europa hadde mistet',
        til: 'Grunnlaget for de første universitetene',
        fakta: 'De gamle greske bøkene var nesten glemt i Europa. I Córdoba ble de oversatt til arabisk, og derfra til latin, så Europa fikk dem tilbake.',
    },
    {
        id: 'tallene',
        navn: 'Tallene 0-9',
        fra: 'Talltegn fra India',
        til: 'Tallene vi regner med i dag',
        fakta: 'Ideen om null og de ti sifrene kom fra India via den muslimske verden. Vi kaller dem fortsatt "arabiske tall".',
    },
    {
        id: 'algebra',
        navn: 'Algebra',
        fra: 'al-jabr, laget av al-Khwarizmi',
        til: 'Matematikken du har på skolen',
        fakta: 'Selve ordet algebra kommer fra arabisk (al-jabr). Boka til al-Khwarizmi lærte Europa å løse likninger.',
    },
    {
        id: 'medisin',
        navn: 'Legekunst',
        fra: 'Ibn Sinas store legebok',
        til: 'Lærebok for leger i 500 år',
        fakta: 'Legeboka til Ibn Sina ble oversatt i Spania og brukt på europeiske legestudier helt fram til 1600-tallet.',
    },
    {
        id: 'astronomi',
        navn: 'Stjernekart',
        fra: 'Astrolab og kart over himmelen',
        til: 'Hjelp for sjøfarere og forskere',
        fakta: 'Muslimske astronomer kartla stjernene nøye. Kunnskapen hjalp senere europeiske sjøfarere å finne veien over havet.',
    },
];

type Status = 'venter' | 'kommet';

export function KunnskapsbroAndalus({
    title = 'Kunnskapsbroen fra Al-Andalus',
    skatter = STANDARD_SKATTER,
}: KunnskapsbroAndalusProps) {
    const [status, setStatus] = useState<Record<string, Status>>(
        () => Object.fromEntries(skatter.map((s) => [s.id, 'venter' as Status]))
    );
    const [sisteFakta, setSisteFakta] = useState<string | null>(null);

    const antallKommet = Object.values(status).filter((s) => s === 'kommet').length;
    const ferdig = antallKommet === skatter.length;

    const send = (s: Skatt) => {
        if (status[s.id] === 'kommet') return;
        setStatus((prev) => ({ ...prev, [s.id]: 'kommet' }));
        setSisteFakta(s.fakta);
    };

    const reset = () => {
        setStatus(Object.fromEntries(skatter.map((s) => [s.id, 'venter' as Status])));
        setSisteFakta(null);
    };

    const venter = skatter.filter((s) => status[s.id] === 'venter');
    const kommet = skatter.filter((s) => status[s.id] === 'kommet');

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk hver kunnskapsskatt og send den over broen til Europa.
                    </p>
                </div>
            </div>

            {/* Interaksjonsflate: to kolonner med broen imellom */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                {/* Venstre: kilden */}
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-xs font-semibold text-emerald-800 mb-2 uppercase tracking-wide">
                        Antikkens og Østens visdom
                    </p>
                    <div className="space-y-2 min-h-[9rem]">
                        <AnimatePresence>
                            {venter.map((s) => (
                                <motion.button
                                    key={s.id}
                                    layout
                                    onClick={() => send(s)}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full text-left bg-white border border-emerald-300 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow group"
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-slate-800 text-sm">
                                            {s.navn}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                    <span className="block text-xs text-slate-500 mt-0.5">{s.fra}</span>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {venter.length === 0 && (
                            <p className="text-xs text-emerald-700/70 italic pt-2">
                                Alt er sendt av gårde.
                            </p>
                        )}
                    </div>
                </div>

                {/* Midten: broen gjennom Córdoba */}
                <div className="flex md:flex-col items-center justify-center gap-2 px-2">
                    <div className="text-center">
                        <div className="text-[0.65rem] font-semibold text-amber-700 uppercase tracking-wide">
                            Córdoba
                        </div>
                        <div className="text-[0.65rem] text-slate-400">oversettelseshuset</div>
                    </div>
                    <div className="h-1 w-16 md:h-24 md:w-1 rounded-full bg-gradient-to-r md:bg-gradient-to-b from-emerald-400 via-amber-400 to-blue-400" />
                    <ArrowRight className="w-5 h-5 text-amber-500 md:rotate-90" />
                </div>

                {/* Høyre: Europa */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">
                        Europa (universitetene)
                    </p>
                    <div className="space-y-2 min-h-[9rem]">
                        <AnimatePresence>
                            {kommet.map((s) => (
                                <motion.div
                                    key={s.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white border border-blue-300 rounded-lg px-3 py-2 shadow-sm"
                                >
                                    <span className="font-medium text-slate-800 text-sm">{s.navn}</span>
                                    <span className="block text-xs text-blue-700 mt-0.5">{s.til}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {kommet.length === 0 && (
                            <p className="text-xs text-blue-700/70 italic pt-2">
                                Ingenting har kommet fram ennå.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-5 mb-4 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm min-h-[3.25rem] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-slate-600">
                    {sisteFakta ??
                        'Hver skatt du sender, ble oversatt i Al-Andalus og båret videre nordover. Send den første.'}
                </p>
            </div>

            {/* Suksess-tilstand */}
            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="mx-5 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                    >
                        <Lightbulb className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <p>
                            <span className="font-semibold">Nå ser du broen:</span> Al-Andalus tok vare
                            på kunnskap Europa hadde mistet, og la til ny vitenskap. Uten denne broen
                            hadde mye av det som senere skapte renessansen aldri nådd Europa.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    {antallKommet} av {skatter.length} skatter er kommet fram
                </span>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
