import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, RotateCcw, X } from 'lucide-react';

// Terskelen: Arnold van Genneps tre faser, brukt på en konkret rite.
//
// Lyspære-øyeblikket: eleven sorterer seks øyeblikk fra én rite, bytter så til en helt
// annen rite - og oppdager at de samme tre fasene ligger under begge. Mønsteret sitter i
// formen, ikke i innholdet.
//
// Sorteringen skjer med tre knapper, ikke drag-and-drop. Det fungerer med tastatur og på
// en Chromebook-styreplate uten ekstra arbeid.
//
// All ritedata kommer fra props. Ingenting er hardkodet her.

interface Fase {
    id: string;
    label: string;
    hint?: string;
}

interface Oyeblikk {
    id: string;
    text: string;
    phase: string;
    feedback?: string;
}

interface Rite {
    id: string;
    name: string;
    tradition?: string;
    color?: string;
    moments?: Oyeblikk[];
}

interface TerskelVerkstedetProps {
    title?: string;
    intro?: string;
    phases?: Fase[];
    rites?: Rite[];
}

export function TerskelVerkstedet({
    title = 'Terskelen',
    intro = 'Velg en rite, og plasser hvert øyeblikk i den fasen det hører hjemme i.',
    phases = [],
    rites = [],
}: TerskelVerkstedetProps) {
    const [riteId, setRiteId] = useState(rites[0]?.id ?? '');
    const [indeks, setIndeks] = useState(0);
    const [svar, setSvar] = useState<Record<string, string>>({});
    const [fasit, setFasit] = useState(false);

    const rite = useMemo(
        () => rites.find((r) => r.id === riteId) ?? rites[0],
        [rites, riteId]
    );
    const oyeblikk = useMemo(() => rite?.moments ?? [], [rite]);
    const farge = rite?.color ?? '#475569';

    const aktivt = oyeblikk[indeks];
    const ferdig = oyeblikk.length > 0 && indeks >= oyeblikk.length;
    const riktige = oyeblikk.filter((o) => svar[o.id] === o.phase).length;

    const nullstill = (nyRiteId: string) => {
        setRiteId(nyRiteId);
        setIndeks(0);
        setSvar({});
        setFasit(false);
    };

    const plasser = (faseId: string) => {
        if (!aktivt) return;
        setSvar((s) => ({ ...s, [aktivt.id]: faseId }));
        setIndeks((i) => i + 1);
    };

    // Et øyeblikk vises i kolonnen sin så snart eleven har tatt stilling til det, eller
    // når fasiten er slått på. Det havner alltid i riktig kolonne - et feilsvar merkes,
    // det flyttes ikke.
    const iKolonne = (faseId: string) =>
        oyeblikk.filter((o) => o.phase === faseId && (fasit || svar[o.id] !== undefined));

    const sisteSvar = indeks > 0 ? oyeblikk[indeks - 1] : undefined;
    const sisteRiktig = sisteSvar ? svar[sisteSvar.id] === sisteSvar.phase : false;

    if (!phases.length || !rites.length) return null;

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600">{intro}</p>
            </div>

            {/* Ritevelger */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3">
                <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:w-auto sm:pr-1">
                    Velg rite
                </span>
                {rites.map((r) => {
                    const paa = r.id === rite?.id;
                    return (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => nullstill(r.id)}
                            aria-pressed={paa}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                paa
                                    ? 'border-transparent text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                            style={paa ? { backgroundColor: r.color ?? '#475569' } : undefined}
                        >
                            {r.name}
                            {r.tradition ? (
                                <span className={paa ? 'opacity-80' : 'text-slate-400'}>
                                    {' '}
                                    · {r.tradition}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {/* Kortet, eller oppsummeringen */}
            <div className="px-5 py-4">
                <AnimatePresence mode="wait">
                    {fasit ? (
                        <motion.p
                            key="fasit-vist"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                            Fasiten står under. Trykk «Start på nytt» hvis du vil sortere selv.
                        </motion.p>
                    ) : !ferdig && aktivt ? (
                        <motion.div
                            key={aktivt.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                        >
                            <p className="mb-1.5 text-xs text-slate-500">
                                Øyeblikk {indeks + 1} av {oyeblikk.length}
                            </p>
                            <p
                                className="rounded-lg border-l-4 bg-slate-50 px-4 py-3 text-[15px] leading-relaxed text-slate-800"
                                style={{ borderLeftColor: farge }}
                            >
                                {aktivt.text}
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                {phases.map((f, i) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => plasser(f.id)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                                    >
                                        <span className="block text-sm font-semibold">
                                            {i + 1}. {f.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                            <p className="text-sm font-semibold text-slate-900">
                                {riktige} av {oyeblikk.length} riktig plassert.
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                                Bytt til en annen rite og gjør det samme. De tre fasene ligger
                                under begge, selv om alt annet er ulikt.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tilbakemelding på forrige valg. Vises ett sted, ikke to. */}
                <AnimatePresence>
                    {!fasit && !ferdig && sisteSvar && (
                        <motion.p
                            key={sisteSvar.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mt-3 flex items-start gap-2 text-sm text-slate-600"
                        >
                            {sisteRiktig ? (
                                <Check
                                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                                    aria-hidden="true"
                                />
                            ) : (
                                <X
                                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                                    aria-hidden="true"
                                />
                            )}
                            <span>{sisteSvar.feedback ?? ''}</span>
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* De tre fasene. Fylles opp underveis, og er den lesbare tilstanden med fasit på. */}
            <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
                {phases.map((f, i) => (
                    <div key={f.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">
                            {i + 1}. {f.label}
                        </p>
                        {f.hint && <p className="mb-2 text-xs text-slate-500">{f.hint}</p>}
                        <ul className="space-y-1.5">
                            {iKolonne(f.id).map((o) => {
                                const bomma = svar[o.id] !== undefined && svar[o.id] !== o.phase;
                                return (
                                    <li
                                        key={o.id}
                                        className={`rounded border-l-2 py-0.5 pl-2 text-xs leading-snug ${
                                            bomma
                                                ? 'border-amber-400 text-slate-500'
                                                : 'border-emerald-400 text-slate-700'
                                        }`}
                                    >
                                        {o.text}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-2.5">
                <button
                    type="button"
                    onClick={() => setFasit(true)}
                    disabled={fasit}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-40"
                >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Vis fasit
                </button>
                <button
                    type="button"
                    onClick={() => nullstill(rite?.id ?? '')}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
