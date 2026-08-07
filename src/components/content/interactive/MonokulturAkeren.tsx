import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, CloudRain } from 'lucide-react';

// Lyspære-øyeblikket: poteten var det eneste som kunne mette en stor familie på
// en bitteliten leid jordlapp. Nettopp derfor ble ett eneste sykdomsutbrudd
// dødelig. Eleven skal kjenne at valget som gir mest mat i et godt år, er det
// samme valget som gir minst mat i et dårlig år.

interface MonokulturAkerenProps {
    title?: string;
    /** Antall ruter i åkeren. */
    ruter?: number;
    /** Hvor mange munner én potetrute metter. */
    potetPerRute?: number;
    /** Hvor mange munner én kornrute metter. */
    kornPerRute?: number;
}

type Fase = 'idle' | 'ferdig';

// Fast, stokket rekkefølge så potetrutene ligger spredt utover åkeren i stedet
// for i en blokk. Modulnivå = ingen tilfeldighet under render.
const SPREDNING = [
    18, 3, 31, 12, 27, 7, 36, 21, 1, 14, 39, 24, 9, 33, 16, 5, 28, 11, 22, 0, 35, 19, 30, 8, 25, 13,
    2, 37, 20, 6, 32, 15, 26, 4, 38, 17, 29, 10, 34, 23,
];

const STEG = [0, 20, 40, 60, 80, 100];

export function MonokulturAkeren({
    title = 'Åkeren: mette munner eller trygg mat?',
    ruter = 40,
    potetPerRute = 4,
    kornPerRute = 1,
}: MonokulturAkerenProps) {
    const [potetAndel, setPotetAndel] = useState(60);
    const [fase, setFase] = useState<Fase>('idle');

    const antallPotet = Math.round((ruter * potetAndel) / 100);

    // Hvilke ruter er poteter? Første N i spredningsrekkefølgen.
    const potetRuter = useMemo(() => {
        const rekke = SPREDNING.filter((i) => i < ruter);
        return new Set(rekke.slice(0, antallPotet));
    }, [antallPotet, ruter]);

    const godtAar = antallPotet * potetPerRute + (ruter - antallPotet) * kornPerRute;
    const etterToraate = (ruter - antallPotet) * kornPerRute;
    const maks = ruter * potetPerRute;

    const slippToraaten = () => setFase('ferdig');

    const nullstill = () => {
        setFase('idle');
        setPotetAndel(60);
    };

    const dom =
        potetAndel >= 80
            ? 'Nesten alt er borte. Så avhengig var Irland av poteten i 1845.'
            : potetAndel >= 40
              ? 'Du mistet mye, men noe står igjen. Familien sulter, men flere overlever.'
              : 'Åkeren overlevde tørråten. Men i et godt år mettet den langt færre munner.';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Sprout className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg hvor mye av jorda du dyrker med poteter, og slipp så tørråten løs.
                    </p>
                </div>
            </div>

            {/* Spaken */}
            <div className="px-6 pt-5">
                <div className="flex items-baseline justify-between mb-2">
                    <label
                        htmlFor="potet-andel"
                        className="text-sm font-semibold text-slate-700"
                    >
                        Poteter på åkeren
                    </label>
                    <span className="text-sm font-bold text-emerald-700 tabular-nums">
                        {potetAndel} %
                    </span>
                </div>
                <input
                    id="potet-andel"
                    type="range"
                    min={0}
                    max={100}
                    step={20}
                    value={potetAndel}
                    disabled={fase === 'ferdig'}
                    onChange={(e) => setPotetAndel(Number(e.target.value))}
                    className="w-full accent-emerald-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex justify-between mt-1">
                    {STEG.map((s) => (
                        <span key={s} className="text-[11px] text-slate-400 tabular-nums">
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Åkeren */}
            <div className="px-6 pt-4">
                <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                    {Array.from({ length: ruter }).map((_, i) => {
                        const erPotet = potetRuter.has(i);
                        const doed = erPotet && fase === 'ferdig';
                        return (
                            <motion.div
                                key={i}
                                aria-hidden
                                animate={{
                                    backgroundColor: doed
                                        ? '#1e293b'
                                        : erPotet
                                          ? '#059669'
                                          : '#f59e0b',
                                    scale: doed ? 0.86 : 1,
                                }}
                                transition={{
                                    duration: 0.35,
                                    delay: doed ? (i % 8) * 0.03 + Math.floor(i / 8) * 0.05 : 0,
                                }}
                                className="aspect-square rounded-md shadow-sm"
                            />
                        );
                    })}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-emerald-600" /> Poteter
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-amber-500" /> Korn og annet
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-slate-800" /> Ødelagt av tørråte
                    </span>
                </div>
            </div>

            {/* Feedback-sone: alltid i DOM-et */}
            <div className="px-6 pt-5 space-y-3">
                <Maaler
                    etikett="Munner du metter i et godt år"
                    verdi={godtAar}
                    maks={maks}
                    farge="bg-emerald-500"
                />
                <Maaler
                    etikett="Munner du metter etter tørråten"
                    verdi={fase === 'ferdig' ? etterToraate : null}
                    maks={maks}
                    farge="bg-rose-500"
                />

                <AnimatePresence mode="wait">
                    {fase === 'ferdig' ? (
                        <motion.div
                            key="dom"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm leading-relaxed"
                        >
                            <span className="font-semibold">{dom}</span> Tørråten spiser bare
                            poteter. Kornet står urørt. Legg merke til at den innstillingen som
                            metter flest i et godt år, er den samme som etterlater minst når
                            sykdommen kommer.
                        </motion.div>
                    ) : (
                        <motion.div
                            key="hvile"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm leading-relaxed"
                        >
                            En potetrute metter fire munner. En kornrute metter én. På en liten leid
                            jordlapp er poteter derfor den eneste måten å mette en stor familie på.
                            Dra spaken dit du selv ville lagt deg, og slipp så tørråten løs.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={slippToraaten}
                    disabled={fase === 'ferdig'}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    <CloudRain className="w-4 h-4" />
                    Slipp tørråten løs
                </button>
                <button
                    type="button"
                    onClick={nullstill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>

            <p className="px-6 pb-5 text-xs text-slate-400 leading-relaxed">
                Tallene er en forenklet modell laget for å vise sammenhengen. Poteten ga langt mer
                mat per mål enn korn, og derfor levde de fattigste på Irland nesten bare av poteter.
            </p>
        </div>
    );
}

function Maaler({
    etikett,
    verdi,
    maks,
    farge,
}: {
    etikett: string;
    verdi: number | null;
    maks: number;
    farge: string;
}) {
    const andel = verdi === null ? 0 : Math.max(0, Math.min(1, verdi / maks));
    return (
        <div>
            <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">{etikett}</span>
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                    {verdi === null ? 'ikke prøvd ennå' : verdi}
                </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${farge}`}
                    animate={{ width: `${andel * 100}%` }}
                    transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                />
            </div>
        </div>
    );
}
