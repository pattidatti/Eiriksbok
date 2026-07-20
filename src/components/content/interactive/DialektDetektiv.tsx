import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RotateCcw, Check, X, MapPin, Trophy } from 'lucide-react';

interface Malmerke {
    // Ordet/uttrykket i setningen som er et målmerke (må stå ordrett i `setning`)
    ord: string;
    // Kort forklaring på hva målmerket avslører
    forklaring: string;
}

interface Runde {
    setning: string;
    fasit: string; // id-en til riktig område
    malmerker: Malmerke[];
}

interface DialektDetektivProps {
    title?: string;
    omrader?: { id: string; navn: string }[];
    runder?: Runde[];
}

type Fase = 'idle' | 'reveal';

const DEFAULT_OMRADER = [
    { id: 'nord', navn: 'Nordnorsk' },
    { id: 'trond', navn: 'Trøndersk' },
    { id: 'vest', navn: 'Vestnorsk' },
    { id: 'ost', navn: 'Østnorsk' },
];

const DEFAULT_RUNDER: Runde[] = [
    {
        setning: 'Æ e så trøtt at æ ikkje gidd å gå på skoln.',
        fasit: 'nord',
        malmerker: [
            { ord: 'Æ', forklaring: '«Æ» for «jeg» er et sterkt nordnorsk målmerke.' },
            { ord: 'ikkje', forklaring: 'Nektingsordet «ikkje» (ikke «ikke») peker nordover og vestover.' },
        ],
    },
    {
        setning: 'Æ må heim og ét, for æ e skikkelig sulten.',
        fasit: 'trond',
        malmerker: [
            { ord: 'Æ', forklaring: 'Trøndersk bruker også «æ» for «jeg».' },
            { ord: 'ét', forklaring: 'Kort, apokopert form («ét» for «ete/spise») er typisk trøndersk.' },
        ],
    },
    {
        setning: 'Eg veit ikkje kor eg la boka mi i går.',
        fasit: 'vest',
        malmerker: [
            { ord: 'Eg', forklaring: '«Eg» for «jeg» er kjennetegnet på vestnorsk.' },
            { ord: 'kor', forklaring: '«Kor» for «hvor» hører til vestlandsdialektene.' },
        ],
    },
    {
        setning: 'Jæ skal bare kaste sekken min oppi bilen først.',
        fasit: 'ost',
        malmerker: [
            { ord: 'Jæ', forklaring: '«Jæ/jeg» for «jeg» er et østnorsk målmerke.' },
            { ord: 'kaste', forklaring: 'Infinitiv på -e («kaste», ikke «kasta/kast») er vanlig på Østlandet.' },
        ],
    },
];

export function DialektDetektiv({
    title = 'Dialektdetektiven',
    omrader = DEFAULT_OMRADER,
    runder = DEFAULT_RUNDER,
}: DialektDetektivProps) {
    const [runde, setRunde] = useState(0);
    const [fase, setFase] = useState<Fase>('idle');
    const [valgt, setValgt] = useState<string | null>(null);
    const [poeng, setPoeng] = useState(0);

    const aktiv = runder[runde];
    const riktig = valgt === aktiv.fasit;
    const ferdig = runde === runder.length - 1 && fase === 'reveal';

    const omradeNavn = (id: string) => omrader.find((o) => o.id === id)?.navn ?? id;

    // Del opp setningen slik at målmerke-ordene kan markeres når svaret vises.
    const biter = useMemo(() => {
        const merker = aktiv.malmerker.map((m) => m.ord);
        if (merker.length === 0) return [{ tekst: aktiv.setning, merke: false }];
        const mønster = new RegExp(`(${merker.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
        return aktiv.setning
            .split(mønster)
            .filter((s) => s.length > 0)
            .map((tekst) => ({ tekst, merke: merker.includes(tekst) }));
    }, [aktiv]);

    const velg = (id: string) => {
        if (fase === 'reveal') return;
        setValgt(id);
        setFase('reveal');
        if (id === aktiv.fasit) setPoeng((p) => p + 1);
    };

    const neste = () => {
        setRunde((r) => Math.min(r + 1, runder.length - 1));
        setFase('idle');
        setValgt(null);
    };

    const tilbakestill = () => {
        setRunde(0);
        setFase('idle');
        setValgt(null);
        setPoeng(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les setningen og gjett hvilket dialektområde den kommer fra.
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-sm font-medium text-slate-500 shrink-0">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    {poeng}/{runder.length}
                </div>
            </div>

            {/* Interaksjonsflate */}
            <div className="p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                    Setning {runde + 1} av {runder.length}
                </div>
                <p className="text-xl md:text-2xl font-display text-slate-800 leading-snug mb-6">
                    «
                    {biter.map((b, i) =>
                        b.merke && fase === 'reveal' ? (
                            <motion.span
                                key={i}
                                initial={{ backgroundColor: 'rgba(129,140,248,0)' }}
                                animate={{ backgroundColor: 'rgba(199,210,254,1)' }}
                                className="rounded px-1 text-indigo-800"
                            >
                                {b.tekst}
                            </motion.span>
                        ) : (
                            <span key={i}>{b.tekst}</span>
                        )
                    )}
                    »
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {omrader.map((o) => {
                        const erFasit = o.id === aktiv.fasit;
                        const erValgt = o.id === valgt;
                        let stil = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md';
                        if (fase === 'reveal') {
                            if (erFasit) stil = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                            else if (erValgt) stil = 'bg-rose-50 border-rose-300 text-rose-700';
                            else stil = 'bg-slate-50 border-slate-200 text-slate-400';
                        }
                        return (
                            <motion.button
                                key={o.id}
                                onClick={() => velg(o.id)}
                                disabled={fase === 'reveal'}
                                whileTap={fase === 'idle' ? { scale: 0.97 } : undefined}
                                className={`flex items-center justify-between gap-2 border rounded-xl px-4 py-3 text-left font-medium transition-colors ${stil}`}
                            >
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    {o.navn}
                                </span>
                                {fase === 'reveal' && erFasit && <Check className="w-4 h-4" />}
                                {fase === 'reveal' && erValgt && !erFasit && <X className="w-4 h-4" />}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                {fase === 'reveal' && (
                    <motion.div
                        key={`fb-${runde}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mx-6 mb-4 px-4 py-3 rounded-lg border text-sm ${
                            riktig
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                    >
                        <p className="font-semibold mb-1">
                            {riktig
                                ? 'Riktig! Godt lyttet.'
                                : `Ikke helt — dette er ${omradeNavn(aktiv.fasit)}.`}
                        </p>
                        <ul className="space-y-1 text-slate-600">
                            {aktiv.malmerker.map((m, i) => (
                                <li key={i}>
                                    <span className="font-medium text-indigo-700">{m.ord}</span> — {m.forklaring}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullført-tilstand */}
            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mx-6 mb-4 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm flex items-center gap-2"
                    >
                        <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                        <span>
                            Ferdig! Du kjente igjen {poeng} av {runder.length} dialekter. Målmerkene er nøkkelen —
                            jo flere du lærer, jo raskere plasserer du en stemme på kartet.
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {fase === 'reveal' && !ferdig ? (
                    <button
                        onClick={neste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Neste setning
                    </button>
                ) : (
                    <span className="text-sm text-slate-400">
                        {fase === 'idle' ? 'Velg et område over' : 'Alle setningene er gjettet'}
                    </span>
                )}
                <button
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
