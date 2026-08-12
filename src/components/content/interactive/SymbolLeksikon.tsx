import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, HelpCircle, History, ScanEye } from 'lucide-react';

// Symbolleksikonet: et lite galleri der hvert religiøst tegn settes opp i to spalter -
// «mange tror» mot «kildene sier» - pluss en kort opprinnelseshistorie.
//
// Lyspære-øyeblikket: eleven oppdager at nesten ingen av tegnene begynte som symbol
// for den religionen som bruker dem i dag. Korset var et straffredskap, halvmånen er
// eldre enn islam, hakekorset er to helt ulike historier i samme figur.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface SymbolGruppe {
    id: string;
    label: string;
    note?: string;
}

interface SymbolKort {
    id: string;
    name: string;
    tradition: string;
    color: string;
    group: string;
    glyph?: string;
    negated?: boolean;
    myth: string;
    fact: string;
    origin: string;
}

interface SymbolLeksikonProps {
    title?: string;
    intro?: string;
    groups?: SymbolGruppe[];
    symbols?: SymbolKort[];
    defaultGroup?: string;
    mythLabel?: string;
    factLabel?: string;
    originLabel?: string;
    note?: string;
}

function tint(hex: string, alpha: number): string {
    const rent = hex.replace('#', '');
    if (rent.length !== 6) return `rgba(100, 116, 139, ${alpha})`;
    const r = parseInt(rent.slice(0, 2), 16);
    const g = parseInt(rent.slice(2, 4), 16);
    const b = parseInt(rent.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SymbolLeksikon({
    title = 'Symbolleksikonet',
    intro = 'Velg et tegn. Se hva folk tror det betyr, og hva kildene faktisk sier.',
    groups = [],
    symbols = [],
    defaultGroup,
    mythLabel = 'Mange tror',
    factLabel = 'Kildene sier',
    originLabel = 'Der det kommer fra',
    note,
}: SymbolLeksikonProps) {
    const grupper = useMemo<SymbolGruppe[]>(() => {
        if (groups.length) return groups;
        const sett: string[] = [];
        symbols.forEach((s) => {
            if (s.group && !sett.includes(s.group)) sett.push(s.group);
        });
        return sett.map((id) => ({ id, label: id }));
    }, [groups, symbols]);

    const [aktivGruppe, setAktivGruppe] = useState<string>(defaultGroup ?? grupper[0]?.id ?? '');
    const [valgtId, setValgtId] = useState<string | null>(null);

    const synlige = useMemo(
        () => symbols.filter((s) => s.group === aktivGruppe),
        [symbols, aktivGruppe]
    );

    const valgt = synlige.find((s) => s.id === valgtId) ?? synlige[0];
    const gruppe = grupper.find((g) => g.id === aktivGruppe);

    if (!symbols.length || !synlige.length || !valgt) return null;

    return (
        <figure className="my-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <figcaption className="mb-4">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                    <ScanEye className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{intro}</p>
            </figcaption>

            <div className="mb-4 flex flex-wrap gap-2">
                {grupper.map((g) => {
                    const aktiv = g.id === aktivGruppe;
                    return (
                        <button
                            key={g.id}
                            type="button"
                            aria-pressed={aktiv}
                            onClick={() => {
                                setAktivGruppe(g.id);
                                setValgtId(null);
                            }}
                            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                aktiv
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                            }`}
                        >
                            {g.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {synlige.map((s) => {
                    const aktiv = s.id === valgt.id;
                    return (
                        <motion.button
                            key={s.id}
                            type="button"
                            aria-pressed={aktiv}
                            onClick={() => setValgtId(s.id)}
                            whileTap={{ scale: 0.97 }}
                            animate={{ scale: aktiv ? 1 : 0.98 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="flex flex-col items-center gap-1.5 rounded-xl border-2 bg-white px-1.5 py-3 text-center transition-colors"
                            style={{
                                borderColor: aktiv ? s.color : '#e2e8f0',
                                backgroundColor: aktiv ? tint(s.color, 0.08) : '#ffffff',
                            }}
                        >
                            <span
                                className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none ${
                                    s.negated ? 'border-2 border-dashed' : ''
                                }`}
                                style={
                                    s.negated
                                        ? {
                                              borderColor: tint(s.color, 0.5),
                                              backgroundColor: tint(s.color, 0.08),
                                              color: tint(s.color, 0.4),
                                          }
                                        : { backgroundColor: s.color, color: '#ffffff' }
                                }
                                aria-hidden="true"
                            >
                                {s.glyph ?? s.name.slice(0, 1)}
                            </span>
                            <span className="text-sm font-bold leading-tight text-slate-900">
                                {s.name}
                            </span>
                            <span className="text-xs leading-tight text-slate-500">
                                {s.tradition}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={valgt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="mt-4"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                {mythLabel}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                {valgt.myth}
                            </p>
                        </div>
                        <div
                            className="rounded-xl border p-3"
                            style={{
                                borderColor: tint(valgt.color, 0.45),
                                backgroundColor: tint(valgt.color, 0.08),
                            }}
                        >
                            <p
                                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
                                style={{ color: valgt.color }}
                            >
                                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                                {factLabel}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-800">
                                {valgt.fact}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                            <History className="h-3.5 w-3.5" aria-hidden="true" />
                            {originLabel}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-amber-900">
                            {valgt.origin}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {gruppe?.note && <p className="mt-3 text-xs text-slate-500">{gruppe.note}</p>}
            {note && <p className="mt-2 text-xs italic text-slate-500">{note}</p>}
        </figure>
    );
}
