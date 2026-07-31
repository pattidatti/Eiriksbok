import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, RotateCcw, CheckCircle2, HelpCircle } from 'lucide-react';

// Signaturkomponent for artikkelen «Hvem eier vikingene?».
// Lyspære: et vikingsymbol forteller ikke selv hvor det kommer fra. Eleven må
// spore det gjennom tre spørsmål - hva sier funnene, hvem fant det på, og hvem
// bruker det nå - før hen vet hva symbolet egentlig er.

type Status = 'belagt' | 'ikke-belagt' | 'omstridt';

interface SporCell {
    columnId: string;
    meaning: string;
    evidence: string;
    status: Status;
}

interface SporRow {
    id: string;
    name: string;
    glyph?: 'rune' | 'hjelm' | 'folk';
    cells: SporCell[];
}

interface SymbolSporetProps {
    title?: string;
    lead?: string;
    columns?: { id: string; label: string }[];
    rows?: SporRow[];
    conclusion?: string;
}

const STATUS_STYLE: Record<Status, { label: string; box: string }> = {
    belagt: { label: 'Belagt', box: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    'ikke-belagt': { label: 'Ikke belagt', box: 'bg-rose-50 border-rose-200 text-rose-700' },
    omstridt: { label: 'Omstridt i dag', box: 'bg-amber-50 border-amber-200 text-amber-700' },
};

const DEFAULT_COLUMNS = [
    { id: 'funn', label: 'Hva sier funnene?' },
    { id: 'opphav', label: 'Hvem fant det på?' },
    { id: 'bruk', label: 'Hvem bruker det nå?' },
];

const DEFAULT_ROWS: SporRow[] = [
    {
        id: 'hornhjelmen',
        name: 'Hornhjelmen',
        glyph: 'hjelm',
        cells: [
            {
                columnId: 'funn',
                status: 'ikke-belagt',
                meaning: 'Ingen hjelm med horn er funnet fra vikingtiden. Den eneste bevarte vikinghjelmen i Norge er rund og glatt.',
                evidence: 'Arkeologer har ikke funnet en eneste hjelm med horn fra vikingtiden (Andersen, 2025). Gjermundbuhjelmen fra 1943 er den eneste bevarte vikinghjelmen i Norge (Stylegar, 2026).',
            },
            {
                columnId: 'opphav',
                status: 'belagt',
                meaning: 'Kostymetegneren Carl Emil Doepler satte horn på hjelmene i Wagners opera på 1870-tallet.',
                evidence: 'Doepler (1824-1905) laget kostymene til «Nibelungens ring». Etter premieren i 1876 spredte hornhjelmen seg til kunst, bøker og engelske skolebøker (Andersen, 2025).',
            },
            {
                columnId: 'bruk',
                status: 'omstridt',
                meaning: 'Hornhjelmen lever videre i tegneserier, reklame og turistbutikker. Den er blitt det folk ser for seg når de hører «viking».',
                evidence: 'Norrøn kultur lever videre i filmer, spill, tegneserier og romaner, og bildet disse gir stemmer ikke alltid med kildene (Moe, 2021).',
            },
        ],
    },
    {
        id: 'runene',
        name: 'Runene',
        glyph: 'rune',
        cells: [
            {
                columnId: 'funn',
                status: 'belagt',
                meaning: 'Runer var vanlig skrift. Folk hogg dem i minnesteiner over slektninger og ristet korte beskjeder i tre og bein.',
                evidence: 'Runeinnskrifter er en av hovedkildene våre til vikingtiden, som varte fra omkring 800 til omkring 1050 (Bandlien, 2026).',
            },
            {
                columnId: 'opphav',
                status: 'belagt',
                meaning: 'Nasjonal Samling hentet navn og tegn fra vikingtiden. Hirden fikk navn etter livvakten til vikingkongene.',
                evidence: 'NS brukte hirden, solkorset og kongefargene rødt og gull for å knytte seg til en gullalder de mente var tapt (Korneliussen, 2022).',
            },
            {
                columnId: 'bruk',
                status: 'omstridt',
                meaning: 'Runer står på gravsteiner, i museer og i spill. Samtidig går de igjen i logoene til høyreekstreme grupper.',
                evidence: 'Karoline Kjesrud finner at «vikingtidas symboler går igjen» i dagens høyreekstreme propaganda, både runer og stavkirke-ornamentikk (Korneliussen, 2022).',
            },
        ],
    },
    {
        id: 'det-rene-folket',
        name: '«Det rene nordiske folket»',
        glyph: 'folk',
        cells: [
            {
                columnId: 'funn',
                status: 'ikke-belagt',
                meaning: 'DNA fra 442 skjeletter viser at folk i vikingtiden var blandet. Mange hadde brunt hår, ikke lyst.',
                evidence: 'Gener kom inn i Skandinavia fra sør og øst, og folk gravlagt som vikinger på Orknøyene hadde irsk og skotsk opphav (University of Cambridge, 2020).',
            },
            {
                columnId: 'opphav',
                status: 'belagt',
                meaning: 'Tanken om et rent nordisk folk vokste fram i nasjonalismen på 1800- og 1900-tallet, ikke i vikingtiden.',
                evidence: 'Historiker Øystein Sørensen peker på at «å søke seg til en tidligere gullalder» er noe man finner i all nasjonalisme (Korneliussen, 2022).',
            },
            {
                columnId: 'bruk',
                status: 'omstridt',
                meaning: 'Grupper som Den nordiske motstandsbevegelsen bygger på ideen om et nordisk folk som må forsvares.',
                evidence: 'Forskerne nevner Proud Boys, Soldiers of Odin og Den nordiske motstandsbevegelsen blant grupper som låner symboler fra fortiden (Korneliussen, 2022).',
            },
        ],
    },
];

const DEFAULT_CONCLUSION =
    'Symbolet sier ikke selv hvor det kommer fra. Først når du sjekker funnene, opphavet og dagens bruk, vet du hva du faktisk ser på.';

function Glyph({ kind }: { kind: SporRow['glyph'] }) {
    const stroke = 'currentColor';
    if (kind === 'hjelm') {
        return (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.8">
                <path d="M4 14a8 8 0 0 1 16 0v3H4z" strokeLinejoin="round" />
                <path d="M12 6v11" />
            </svg>
        );
    }
    if (kind === 'folk') {
        return (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.8">
                <circle cx="8" cy="8" r="3" />
                <circle cx="16.5" cy="9.5" r="2.4" />
                <path d="M3 19c0-3 2.2-5 5-5s5 2 5 5" strokeLinecap="round" />
                <path d="M13.5 19c0-2.4 1.6-4 3.5-4s3.5 1.6 3.5 4" strokeLinecap="round" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.8">
            <path d="M7 3v18" strokeLinecap="round" />
            <path d="M7 8l5-5" strokeLinecap="round" />
            <path d="M7 14l5 5" strokeLinecap="round" />
            <path d="M17 3v18" strokeLinecap="round" />
        </svg>
    );
}

export function SymbolSporet({
    title = 'Spor symbolet tilbake',
    lead = 'Klikk en rute. Tre spørsmål avslører hvor symbolet egentlig kommer fra.',
    columns = DEFAULT_COLUMNS,
    rows = DEFAULT_ROWS,
    conclusion = DEFAULT_CONCLUSION,
}: SymbolSporetProps) {
    const [opened, setOpened] = useState<string[]>([]);
    const [active, setActive] = useState<{ row: SporRow; cell: SporCell } | null>(null);

    const total = rows.reduce((sum, r) => sum + r.cells.length, 0);
    const done = opened.length >= total && total > 0;

    const openCell = (row: SporRow, cell: SporCell) => {
        const key = `${row.id}:${cell.columnId}`;
        setActive({ row, cell });
        setOpened((prev) => (prev.includes(key) ? prev : [...prev, key]));
    };

    const handleReset = () => {
        setOpened([]);
        setActive(null);
    };

    const columnLabel = (id: string) => columns.find((c) => c.id === id)?.label ?? id;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{lead}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-5 sm:p-6 space-y-5">
                {rows.map((row) => (
                    <div key={row.id}>
                        <div className="flex items-center gap-2 mb-2 text-slate-700">
                            <span className="text-indigo-500">
                                <Glyph kind={row.glyph} />
                            </span>
                            <h4 className="font-semibold text-sm">{row.name}</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {row.cells.map((cell) => {
                                const key = `${row.id}:${cell.columnId}`;
                                const isOpen = opened.includes(key);
                                const isActive =
                                    active?.row.id === row.id &&
                                    active?.cell.columnId === cell.columnId;
                                const style = STATUS_STYLE[cell.status];
                                return (
                                    <motion.button
                                        key={key}
                                        onClick={() => openCell(row, cell)}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`text-left rounded-xl border p-3 min-h-[120px] flex flex-col gap-1.5 ${
                                            isOpen
                                                ? `${style.box} ${
                                                      isActive ? 'ring-2 ring-indigo-300' : ''
                                                  }`
                                                : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60'
                                        }`}
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
                                            {columnLabel(cell.columnId)}
                                        </span>
                                        <AnimatePresence mode="wait" initial={false}>
                                            {isOpen ? (
                                                <motion.span
                                                    key="open"
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="text-[13px] leading-snug"
                                                >
                                                    {cell.meaning}
                                                </motion.span>
                                            ) : (
                                                <motion.span
                                                    key="closed"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-1.5 text-[13px] text-slate-400"
                                                >
                                                    <HelpCircle className="w-4 h-4" />
                                                    Klikk for å sjekke
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        {isOpen && (
                                            <span
                                                className={`mt-auto self-start rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.box}`}
                                            >
                                                {style.label}
                                            </span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-5 sm:mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {active ? (
                        <motion.div
                            key={`${active.row.id}:${active.cell.columnId}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                        >
                            <span className="font-semibold">Belegget: </span>
                            {active.cell.evidence}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Her dukker belegget opp: hva kildene faktisk sier om ruten du åpner.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Suksess */}
            <AnimatePresence>
                {done && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                        className="mx-5 sm:mx-6 mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-2.5"
                    >
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                        <span>
                            <span className="font-semibold">Alle ni ruter er sjekket. </span>
                            {conclusion}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-28 sm:w-40 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500"
                            animate={{ width: `${total ? (opened.length / total) * 100 : 0}%` }}
                            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                        {opened.length} av {total} sjekket
                    </span>
                </div>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
