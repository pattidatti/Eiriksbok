import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Lock, Swords, Mountain, HeartHandshake, Anchor, RotateCcw } from 'lucide-react';

interface Faktor {
    id: string;
    tittel: string;
    forklaring: string;
    vekt: number;
    ikon: typeof Swords;
    /** Uten denne faktoren kan Hellas aldri bli helt fritt. */
    avgjorende?: boolean;
}

interface VeienTilFrihetProps {
    title?: string;
    intro?: string;
    faktorer?: Faktor[];
}

const STANDARD_FAKTORER: Faktor[] = [
    {
        id: 'oppror',
        tittel: 'Gresk opprør (1821)',
        forklaring: 'Grekerne reiste seg mot osmanene. Uten et folk som vil kjempe, skjer ingenting.',
        vekt: 30,
        ikon: Swords,
    },
    {
        id: 'gerilja',
        tittel: 'Gerilja i fjellene',
        forklaring: 'Greske geriljagrupper holdt kampen i gang år etter år i det ulendte landet.',
        vekt: 15,
        ikon: Mountain,
    },
    {
        id: 'filhellenisme',
        tittel: 'Europa heier på Hellas',
        forklaring: 'Diktere og malere som Byron og Delacroix vakte sympati i hele Europa (filhellenisme).',
        vekt: 15,
        ikon: HeartHandshake,
    },
    {
        id: 'navarino',
        tittel: 'Stormaktene griper inn: Navarino (1827)',
        forklaring: 'Britiske, franske og russiske flåter knuste den osmanske flåten. Dette avgjorde krigen.',
        vekt: 40,
        ikon: Anchor,
        avgjorende: true,
    },
];

export function VeienTilFrihet({
    title = 'Veien til frihet',
    intro = 'Slå på faktorene og se hvor nær Hellas kommer selvstendighet. Hva skal egentlig til?',
    faktorer = STANDARD_FAKTORER,
}: VeienTilFrihetProps) {
    const [aktive, setAktive] = useState<Set<string>>(new Set());

    const avgjorendeId = faktorer.find((f) => f.avgjorende)?.id;
    const oppror = aktive.has('oppror');
    const harAvgjorende = avgjorendeId ? aktive.has(avgjorendeId) : false;
    const erFritt = oppror && harAvgjorende;

    // Rå sum av aktive vekter.
    const raSum = faktorer.reduce((sum, f) => (aktive.has(f.id) ? sum + f.vekt : sum), 0);
    // Uten stormaktshjelp stopper opprøret opp — måleren låses under 60 %.
    const maal = erFritt ? 100 : Math.min(raSum, 58);

    function toggle(id: string) {
        setAktive((prev) => {
            const neste = new Set(prev);
            if (neste.has(id)) neste.delete(id);
            else neste.add(id);
            return neste;
        });
    }

    function reset() {
        setAktive(new Set());
    }

    const status = erFritt
        ? 'Hellas er fritt! Osmanene måtte gi opp etter Navarino.'
        : harAvgjorende && !oppror
          ? 'Stormaktene kan hjelpe — men det må finnes et opprør å hjelpe. Slå på det greske opprøret.'
          : oppror
            ? 'Opprøret alene var ikke nok. Osmanene var for sterke. Noe mer måtte til …'
            : 'Ingen kamp, ingen frihet. Begynn med å slå på det greske opprøret.';

    return (
        <div className="my-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Flag className="h-5 w-5" />
                </span>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[1fr_170px]">
                {/* Faktorkort */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                    {faktorer.map((f) => {
                        const på = aktive.has(f.id);
                        const Ikon = f.ikon;
                        return (
                            <motion.button
                                key={f.id}
                                type="button"
                                onClick={() => toggle(f.id)}
                                whileTap={{ scale: 0.97 }}
                                animate={på ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors ${
                                    på
                                        ? 'border-sky-300 bg-white shadow-md'
                                        : 'border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                            på ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <Ikon className="h-4 w-4" />
                                    </span>
                                    <span className="text-sm font-semibold leading-tight text-slate-800">
                                        {f.tittel}
                                    </span>
                                </span>
                                <span className="text-xs leading-snug text-slate-500">{f.forklaring}</span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Frihetsmåler */}
                <div className="flex flex-col items-center justify-end rounded-xl border border-slate-200 bg-white p-4">
                    <div className="relative flex h-44 w-16 items-end overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                        <motion.div
                            className={`w-full rounded-full ${erFritt ? 'bg-emerald-500' : 'bg-sky-500'}`}
                            initial={false}
                            animate={{ height: `${maal}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        />
                        <AnimatePresence>
                            {erFritt && (
                                <motion.span
                                    key="flagg"
                                    initial={{ opacity: 0, y: 20, scale: 0.5 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                    className="absolute inset-x-0 top-2 flex justify-center"
                                >
                                    <Flag className="h-7 w-7 text-white drop-shadow" />
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {!erFritt && (
                            <span className="absolute inset-x-0 top-2 flex justify-center text-slate-400">
                                <Lock className="h-5 w-5" />
                            </span>
                        )}
                    </div>
                    <span className="mt-3 text-2xl font-bold tabular-nums text-slate-800">{maal}%</span>
                    <span className="text-xs font-medium text-slate-400">selvstendighet</span>
                </div>
            </div>

            {/* Feedback-sone — alltid til stede */}
            <motion.div
                key={status}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 rounded-xl border p-3 text-sm font-medium ${
                    erFritt
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : oppror && !harAvgjorende
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}
            >
                {status}
            </motion.div>

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                    <RotateCcw className="h-4 w-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
