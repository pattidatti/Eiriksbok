import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Waves, Sprout, Fish, Users, RotateCcw, Check, Sparkles } from 'lucide-react';

// Seks dagers verket: den skjulte strukturen i 1. Mosebok 1.
//
// Lyspære-øyeblikket: de seks dagene er ikke en tilfeldig liste. De tre første
// dagene lager tre tomme rom, og de tre siste fyller nøyaktig de samme rommene -
// i samme rekkefølge. Dag 1 hører sammen med dag 4, dag 2 med dag 5, dag 3 med
// dag 6. Eleven oppdager paret selv ved å koble dem.

interface DagPar {
    id: string;
    romDag: number;
    romTittel: string;
    romTekst: string;
    fyllDag: number;
    fyllTittel: string;
    fyllTekst: string;
}

interface SeksDagersVerketProps {
    title?: string;
    par?: DagPar[];
}

const STANDARD_PAR: DagPar[] = [
    {
        id: 'lys',
        romDag: 1,
        romTittel: 'Lys og mørke',
        romTekst: 'Gud skiller lyset fra mørket. Det blir dag og natt - men ingenting lyser ennå.',
        fyllDag: 4,
        fyllTittel: 'Sol, måne og stjerner',
        fyllTekst: 'Nå kommer lysene som skal styre dagen og natten.',
    },
    {
        id: 'himmel',
        romDag: 2,
        romTittel: 'Himmel og hav',
        romTekst: 'Gud skiller vannet over fra vannet under. Det blir en himmel og et hav - begge tomme.',
        fyllDag: 5,
        fyllTittel: 'Fugler og fisk',
        fyllTekst: 'Fuglene fyller himmelen, fiskene fyller havet.',
    },
    {
        id: 'land',
        romDag: 3,
        romTittel: 'Land og planter',
        romTekst: 'Det tørre landet kommer til syne, og det gror. Men ingen går der.',
        fyllDag: 6,
        fyllTittel: 'Dyr og mennesker',
        fyllTekst: 'Landdyrene og menneskene får plassen sin på jorda.',
    },
];

const ROM_IKON = [Sun, Waves, Sprout];
const FYLL_IKON = [Moon, Fish, Users];

export function SeksDagersVerket({
    title = 'Finn mønsteret i de seks dagene',
    par = STANDARD_PAR,
}: SeksDagersVerketProps) {
    const [valgtFyll, setValgtFyll] = useState<string | null>(null);
    const [koblet, setKoblet] = useState<string[]>([]);
    const [bom, setBom] = useState<string | null>(null);

    // Rekkefølgen på fyll-kortene stokkes én gang, ellers ligger fasiten rett under.
    const fyllRekke = useMemo(() => [par[1], par[2], par[0]].filter(Boolean), [par]);

    const ferdig = koblet.length === par.length;

    const handleReset = () => {
        setValgtFyll(null);
        setKoblet([]);
        setBom(null);
    };

    const velgRom = (romId: string) => {
        if (!valgtFyll || koblet.includes(romId)) return;
        if (valgtFyll === romId) {
            setKoblet((k) => [...k, romId]);
            setValgtFyll(null);
            setBom(null);
        } else {
            setBom(romId);
            window.setTimeout(() => setBom(null), 600);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className="font-display font-bold text-lg text-slate-900">{title}</h3>
                <button
                    type="button"
                    onClick={handleReset}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start på nytt
                </button>
            </div>
            <p className="text-sm text-slate-600 mb-5">
                Velg et kort nederst, og klikk på rommet det fyller.
            </p>

            {/* Rommene - dag 1, 2, 3 */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3">
                {par.map((p, i) => {
                    const Ikon = ROM_IKON[i % ROM_IKON.length];
                    const erKoblet = koblet.includes(p.id);
                    const erBom = bom === p.id;
                    return (
                        <motion.button
                            key={p.id}
                            type="button"
                            onClick={() => velgRom(p.id)}
                            animate={erBom ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`text-left rounded-xl border p-3 transition-colors ${
                                erKoblet
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : erBom
                                      ? 'bg-rose-50 border-rose-200'
                                      : valgtFyll
                                        ? 'bg-white border-indigo-300 hover:bg-indigo-50 cursor-pointer'
                                        : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Ikon
                                    className={`w-4 h-4 shrink-0 ${erKoblet ? 'text-emerald-600' : 'text-slate-400'}`}
                                />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Dag {p.romDag}
                                </span>
                                {erKoblet && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
                            </div>
                            <div className="font-bold text-sm text-slate-800 leading-tight">
                                {p.romTittel}
                            </div>
                            <AnimatePresence>
                                {erKoblet && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-xs text-slate-600 mt-1.5 leading-snug"
                                    >
                                        {p.romTekst}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    fylles av
                </span>
                <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Innbyggerne - dag 4, 5, 6, i stokket rekkefølge */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
                {fyllRekke.map((p) => {
                    const i = par.findIndex((x) => x.id === p.id);
                    const Ikon = FYLL_IKON[i % FYLL_IKON.length];
                    const erKoblet = koblet.includes(p.id);
                    const erValgt = valgtFyll === p.id;
                    return (
                        <motion.button
                            key={p.id}
                            type="button"
                            disabled={erKoblet}
                            onClick={() => setValgtFyll(erValgt ? null : p.id)}
                            whileTap={erKoblet ? undefined : { scale: 0.97 }}
                            className={`text-left rounded-xl border p-3 transition-colors ${
                                erKoblet
                                    ? 'bg-emerald-50 border-emerald-200 opacity-70'
                                    : erValgt
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                      : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Ikon
                                    className={`w-4 h-4 shrink-0 ${
                                        erValgt
                                            ? 'text-white'
                                            : erKoblet
                                              ? 'text-emerald-600'
                                              : 'text-slate-400'
                                    }`}
                                />
                                <span
                                    className={`text-[11px] font-bold uppercase tracking-wider ${
                                        erValgt ? 'text-indigo-100' : 'text-slate-500'
                                    }`}
                                >
                                    Dag {p.fyllDag}
                                </span>
                            </div>
                            <div
                                className={`font-bold text-sm leading-tight ${erValgt ? 'text-white' : 'text-slate-800'}`}
                            >
                                {p.fyllTittel}
                            </div>
                            <AnimatePresence>
                                {erKoblet && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-xs text-slate-600 mt-1.5 leading-snug"
                                    >
                                        {p.fyllTekst}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-emerald-800 text-sm">
                                Du fant mønsteret
                            </span>
                        </div>
                        <p className="text-sm text-emerald-900 leading-snug">
                            De seks dagene er bygget som tre par. Først lager Gud tre tomme rom, så
                            fyller han dem i samme rekkefølge: 1 og 4, 2 og 5, 3 og 6. Fortellingen
                            er ikke en liste over hendelser - den er komponert som et dikt.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
