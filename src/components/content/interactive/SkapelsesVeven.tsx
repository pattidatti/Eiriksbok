import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Sparkles, Layers } from 'lucide-react';

// Skapelsesveven: fire faser, flere tradisjoner ved siden av hverandre.
//
// Lyspaere-oyeblikket: eleven skrubber gjennom de fire fasene og ser at noen
// tradisjoner rett og slett ikke har en «for begynnelsen» eller en «verden blir
// til» - fordi de mener det aldri var noen begynnelse. Den tomme ruta er ikke en
// mangel i oppslagsverket, den ER svaret.
//
// All religionsdata kommer fra props. Ingenting er hardkodet her.

interface Fase {
    id: string;
    label: string;
}

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
    beats: Record<string, { text: string } | undefined>;
}

interface SkapelsesVevenProps {
    title?: string;
    intro?: string;
    phases?: Fase[];
    traditions?: Tradisjon[];
    defaultSelection?: string[];
    maxVisible?: number;
}

export function SkapelsesVeven({
    title = 'Skapelsesveven',
    intro = 'Velg inntil tre tradisjoner, og gå gjennom de fire fasene.',
    phases = [],
    traditions = [],
    defaultSelection = [],
    maxVisible = 3,
}: SkapelsesVevenProps) {
    const [valgte, setValgte] = useState<string[]>(
        defaultSelection.length ? defaultSelection.slice(0, maxVisible) : traditions.slice(0, maxVisible).map((t) => t.id)
    );
    const [fase, setFase] = useState(0);
    const [besokt, setBesokt] = useState<number[]>([0]);

    const synlige = useMemo(
        () => valgte.map((id) => traditions.find((t) => t.id === id)).filter(Boolean) as Tradisjon[],
        [valgte, traditions]
    );
    const aktivFase = phases[fase];
    const ferdig = besokt.length === phases.length && phases.length > 0;

    // Hvor mange av de valgte har faktisk noe a si i denne fasen?
    const tomme = synlige.filter((t) => !t.beats?.[aktivFase?.id ?? '']).length;

    const velg = (id: string) => {
        setValgte((v) => {
            if (v.includes(id)) return v.length > 1 ? v.filter((x) => x !== id) : v;
            return v.length >= maxVisible ? [...v.slice(1), id] : [...v, id];
        });
    };

    const gaaTil = (i: number) => {
        setFase(i);
        setBesokt((b) => (b.includes(i) ? b : [...b, i]));
    };

    if (!phases.length || !traditions.length) return null;

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-700">
                    <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {/* Tradisjonsvelger */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-3">
                {traditions.map((t) => {
                    const paa = valgte.includes(t.id);
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => velg(t.id)}
                            aria-pressed={paa}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                paa
                                    ? 'border-transparent text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                            style={paa ? { backgroundColor: t.color } : undefined}
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>

            {/* Fase-skrubber */}
            <div className="flex flex-wrap gap-1.5 px-5 pt-4">
                {phases.map((f, i) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => gaaTil(i)}
                        aria-current={i === fase}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            i === fase
                                ? 'bg-slate-900 text-white'
                                : besokt.includes(i)
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Sporene */}
            <div className="grid gap-3 p-5 md:grid-cols-3">
                {synlige.map((t) => {
                    const beat = t.beats?.[aktivFase.id];
                    return (
                        <div
                            key={t.id}
                            className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3"
                            style={{ minHeight: '150px', borderTopWidth: '3px', borderTopColor: t.color }}
                        >
                            <span className="mb-1.5 text-xs font-semibold" style={{ color: t.color }}>
                                {t.name}
                            </span>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={`${t.id}-${aktivFase.id}`}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className={`text-sm ${beat ? 'text-slate-700' : 'italic text-slate-400'}`}
                                >
                                    {beat ? beat.text : 'Denne tradisjonen har ingenting å si her, og det er selve poenget.'}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.p
                            key="ferdig"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 text-sm text-slate-700"
                        >
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                            <span>
                                Du har vært gjennom alle fire fasene. Bytt ut en tradisjon og gå gjennom dem
                                igjen, så ser du hvor ulikt de fyller de samme rutene.
                            </span>
                        </motion.p>
                    ) : (
                        <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-600">
                            {tomme > 0
                                ? 'Legg merke til de tomme rutene. De betyr ikke at vi mangler informasjon.'
                                : 'Klikk deg videre gjennom fasene, og bytt tradisjoner underveis.'}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    Fase {fase + 1} av {phases.length} · {valgte.length} av maks {maxVisible} tradisjoner
                </span>
                <button
                    type="button"
                    onClick={() => {
                        setValgte(defaultSelection.slice(0, maxVisible));
                        setFase(0);
                        setBesokt([0]);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
