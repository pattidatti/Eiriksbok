import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowDown,
    ArrowUp,
    CloudHail,
    RotateCcw,
    Sprout,
    Store,
    Sun,
    Trophy,
    Users,
} from 'lucide-react';

// Jordbærtorget: eleven selger jordbær på torget og setter prisen selv. For høy
// pris gir kurver som blir liggende igjen, for lav pris gir kunder som går
// tomhendte hjem. Så skjer det noe (sankthans, hetebølge, hagl), og eleven må
// gjette hvilken vei prisen går før hen finner den nye prisen.
//
// Lyspære-øyeblikket: Prisen havner der det kjøperne vil ha, er like mye som det
// selgerne vil selge. Blir noe sjeldnere eller mer ettertraktet, stiger prisen.
//
// Tallene er tenkte. Kurvene er rette linjer for å gjøre det enkelt, slik
// lærebøkene også gjør (Stoltz & Andresen, 2025; Stoltz, 2025).

interface JordbaertorgetProps {
    title?: string;
}

type Phase = 'gjett' | 'finn' | 'likevekt' | 'ferdig';
type Retning = 'opp' | 'ned';

interface Dag {
    id: string;
    navn: string;
    hendelse: string;
    forklaring: string;
    Ikon: typeof Sun;
    // Etterspurt mengde = a - 2 * pris. Tilbudt mengde = 2 * pris + c.
    a: number;
    c: number;
    retning: Retning | null;
    endret: 'tilbud' | 'etterspørsel' | null;
}

const DAGER: Dag[] = [
    {
        id: 'start',
        navn: 'Dag 1',
        hendelse: 'En helt vanlig dag på torget.',
        forklaring: 'Finn prisen der du selger alle kurvene, og ingen kunder går tomhendte hjem.',
        Ikon: Store,
        a: 120,
        c: -20,
        retning: null,
        endret: null,
    },
    {
        id: 'sankthans',
        navn: 'Dag 2',
        hendelse: 'Sankthans: Alle bøndene i bygda høster på en gang.',
        forklaring:
            'Det kommer mange flere kurver til torget. Tilbudet øker, og bøndene må konkurrere om kundene.',
        Ikon: Sprout,
        a: 120,
        c: 20,
        retning: 'ned',
        endret: 'tilbud',
    },
    {
        id: 'hete',
        navn: 'Dag 3',
        hendelse: 'Hetebølge: 30 grader, og alle vil ha jordbær og is.',
        forklaring:
            'Like mange kurver, men mange flere vil kjøpe. Etterspørselen øker, og kundene byr over hverandre.',
        Ikon: Sun,
        a: 160,
        c: -20,
        retning: 'opp',
        endret: 'etterspørsel',
    },
    {
        id: 'hagl',
        navn: 'Dag 4',
        hendelse: 'Haglbyge: Isklumper ødela mange av bærene på åkeren.',
        forklaring:
            'Det kommer færre kurver til torget. Tilbudet går ned, og jordbærene blir sjeldnere.',
        Ikon: CloudHail,
        a: 120,
        c: -40,
        retning: 'opp',
        endret: 'tilbud',
    },
];

const MIN_PRIS = 10;
const MAKS_PRIS = 70;
const STARTPRIS = 60;

// Rå kurver kan gi negativ mengde. De brukes til å tegne, de klippede til å telle.
const ettersporselRa = (dag: Dag, pris: number) => dag.a - 2 * pris;
const tilbudRa = (dag: Dag, pris: number) => 2 * pris + dag.c;
const ettersporsel = (dag: Dag, pris: number) => Math.max(0, ettersporselRa(dag, pris));
const tilbud = (dag: Dag, pris: number) => Math.max(0, tilbudRa(dag, pris));
const likevektspris = (dag: Dag) => (dag.a - dag.c) / 4;

// Diagrammet: pris på y-aksen, mengde på x-aksen, slik økonomer tegner det.
const W = 300;
const H = 210;
const PAD = 30;
const MAKS_MENGDE = 140;
const x = (mengde: number) => PAD + (mengde / MAKS_MENGDE) * (W - PAD - 10);
const y = (pris: number) => H - PAD - ((pris - 0) / 80) * (H - PAD - 10);

function linje(f: (pris: number) => number) {
    const punkter: string[] = [];
    for (let p = 0; p <= 80; p += 5) {
        const q = f(p);
        if (q >= 0 && q <= MAKS_MENGDE) punkter.push(`${x(q)},${y(p)}`);
    }
    return punkter.join(' ');
}

export function Jordbaertorget({ title = 'Jordbærtorget: Sett prisen' }: JordbaertorgetProps) {
    const [dagNr, setDagNr] = useState(0);
    const [phase, setPhase] = useState<Phase>('finn');
    const [pris, setPris] = useState(STARTPRIS);
    const [gjett, setGjett] = useState<Retning | null>(null);
    const [funnet, setFunnet] = useState<number[]>([]);

    const dag = DAGER[dagNr];
    const forrige = dagNr > 0 ? DAGER[0] : null;
    const qd = ettersporsel(dag, pris);
    const qs = tilbud(dag, pris);
    const differanse = qs - qd;

    const handlePris = (ny: number) => {
        if (phase !== 'finn') return;
        setPris(ny);
        if (ettersporsel(dag, ny) === tilbud(dag, ny)) {
            setPhase('likevekt');
            setFunnet((f) => [...f, ny]);
        }
    };

    const handleGjett = (retning: Retning) => {
        if (phase !== 'gjett') return;
        setGjett(retning);
        setPhase('finn');
    };

    const handleNeste = () => {
        if (dagNr === DAGER.length - 1) {
            setPhase('ferdig');
            return;
        }
        const neste = dagNr + 1;
        setDagNr(neste);
        setPris(likevektspris(DAGER[0]));
        setGjett(null);
        setPhase('gjett');
    };

    const handleReset = () => {
        setDagNr(0);
        setPhase('finn');
        setPris(STARTPRIS);
        setGjett(null);
        setFunnet([]);
    };

    const gjettRiktig = gjett !== null && gjett === dag.retning;

    let melding: { tekst: string; tone: 'info' | 'feil' | 'ok' };
    if (phase === 'gjett') {
        melding = {
            tekst: `Hva tror du skjer med prisen i dag? På en vanlig dag var den ${likevektspris(DAGER[0])} kroner.`,
            tone: 'info',
        };
    } else if (phase === 'likevekt' || phase === 'ferdig') {
        melding = {
            tekst: `Likevekt! Til ${pris} kroner vil kundene kjøpe ${qd} kurver, og bøndene vil selge ${qs}. Alt blir solgt, og ingen går tomhendte hjem.`,
            tone: 'ok',
        };
    } else if (differanse > 0) {
        melding = {
            tekst: `For dyrt: ${differanse} kurver blir liggende igjen og blir dårlige. Prøv en lavere pris.`,
            tone: 'feil',
        };
    } else {
        melding = {
            tekst: `For billig: ${-differanse} kunder går tomhendte hjem. Mange ville betalt mer. Prøv en høyere pris.`,
            tone: 'feil',
        };
    }

    const toneKlasser = {
        info: 'bg-blue-50 border-blue-200 text-blue-700',
        feil: 'bg-rose-50 border-rose-200 text-rose-700',
        ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    }[melding.tone];

    const kurverIgjen = Math.max(0, differanse);
    const tomhendte = Math.max(0, -differanse);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <motion.div
                    key={dag.id}
                    initial={{ scale: 0.6, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-xl"
                    aria-hidden
                >
                    🍓
                </motion.div>
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du selger jordbær. Dra i prisen til du har solgt alt, uten at noen
                        går tomhendte hjem.
                    </p>
                </div>
            </div>

            {phase === 'ferdig' ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -6, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8 }}
                        >
                            <Trophy className="w-8 h-8 text-amber-500" />
                        </motion.div>
                        <p className="font-semibold text-slate-800">
                            Du fant prisen fire dager på rad!
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {DAGER.map((d, i) => (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.12 }}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"
                            >
                                <d.Ikon className="w-5 h-5 mx-auto text-slate-500 mb-1" />
                                <div className="text-xs text-slate-500">{d.navn}</div>
                                <div className="text-lg font-bold text-slate-800">
                                    {funnet[i] ?? likevektspris(d)} kr
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 space-y-1">
                        <p>Flere kurver på torget (mer tilbud): prisen går ned.</p>
                        <p>Flere som vil kjøpe (mer etterspørsel): prisen går opp.</p>
                        <p>Færre kurver (mindre tilbud): prisen går opp.</p>
                        <p className="pt-1 font-medium">
                            Ingen sjef bestemte prisen. Den ble til der kjøperne og selgerne møttes.
                        </p>
                    </div>
                </motion.div>
            ) : (
                <>
                    {/* Dagens hendelse */}
                    <div className="px-6 pt-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={dag.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                                <dag.Ikon className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        {dag.navn} av {DAGER.length}
                                    </div>
                                    <div className="font-medium text-slate-800">{dag.hendelse}</div>
                                    {phase !== 'gjett' && dag.endret && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-sm text-slate-600 mt-1"
                                        >
                                            {gjettRiktig ? 'Riktig gjettet! ' : 'Ikke helt. '}
                                            {dag.forklaring}
                                        </motion.div>
                                    )}
                                    {!dag.endret && (
                                        <div className="text-sm text-slate-600 mt-1">
                                            {dag.forklaring}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-6 items-center">
                        {/* Diagram */}
                        <svg
                            viewBox={`0 0 ${W} ${H}`}
                            className="w-full max-w-sm mx-auto"
                            role="img"
                            aria-label="Diagram med tilbudskurve og etterspørselskurve"
                        >
                            <line x1={PAD} y1={H - PAD} x2={W - 5} y2={H - PAD} stroke="#94a3b8" />
                            <line x1={PAD} y1={5} x2={PAD} y2={H - PAD} stroke="#94a3b8" />
                            <text x={W - 8} y={H - 10} textAnchor="end" fontSize="10" fill="#64748b">
                                Antall kurver
                            </text>
                            <text x={4} y={14} fontSize="10" fill="#64748b">
                                Pris
                            </text>

                            {/* Gårsdagens kurver, stiplet */}
                            {forrige && phase !== 'gjett' && dag.endret === 'tilbud' && (
                                <polyline
                                    points={linje((p) => tilbudRa(forrige, p))}
                                    fill="none"
                                    stroke="#93c5fd"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                />
                            )}
                            {forrige && phase !== 'gjett' && dag.endret === 'etterspørsel' && (
                                <polyline
                                    points={linje((p) => ettersporselRa(forrige, p))}
                                    fill="none"
                                    stroke="#fda4af"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                />
                            )}

                            {phase !== 'gjett' && (
                                <>
                                    <motion.polyline
                                        key={`t-${dag.id}`}
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        points={linje((p) => tilbudRa(dag, p))}
                                        fill="none"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                    />
                                    <motion.polyline
                                        key={`e-${dag.id}`}
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        points={linje((p) => ettersporselRa(dag, p))}
                                        fill="none"
                                        stroke="#e11d48"
                                        strokeWidth={3}
                                    />
                                    <text x={x(tilbud(dag, 55)) - 4} y={y(55) - 6} fontSize="10" fill="#2563eb" textAnchor="end">
                                        Tilbud
                                    </text>
                                    <text x={x(ettersporsel(dag, 12)) + 4} y={y(12) - 6} fontSize="10" fill="#e11d48">
                                        Etterspørsel
                                    </text>

                                    {/* Prislinja eleven styrer */}
                                    <motion.line
                                        animate={{ y1: y(pris), y2: y(pris) }}
                                        x1={PAD}
                                        x2={W - 10}
                                        stroke={phase === 'likevekt' ? '#059669' : '#475569'}
                                        strokeWidth={1.5}
                                        strokeDasharray="3 3"
                                    />
                                    <motion.circle
                                        animate={{ cx: x(qd), cy: y(pris) }}
                                        r={4}
                                        fill="#e11d48"
                                    />
                                    <motion.circle
                                        animate={{ cx: x(qs), cy: y(pris) }}
                                        r={4}
                                        fill="#2563eb"
                                    />
                                    {phase === 'likevekt' && (
                                        <motion.circle
                                            initial={{ r: 0 }}
                                            animate={{ r: [0, 14, 8] }}
                                            cx={x(qd)}
                                            cy={y(pris)}
                                            fill="none"
                                            stroke="#059669"
                                            strokeWidth={3}
                                        />
                                    )}
                                </>
                            )}
                        </svg>

                        {/* Kontroller */}
                        <div>
                            {phase === 'gjett' ? (
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleGjett('opp')}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md px-4 py-4 font-medium text-slate-700"
                                    >
                                        <ArrowUp className="w-5 h-5 text-rose-500" /> Prisen går opp
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleGjett('ned')}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md px-4 py-4 font-medium text-slate-700"
                                    >
                                        <ArrowDown className="w-5 h-5 text-emerald-500" /> Prisen går ned
                                    </motion.button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-baseline justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-700">
                                            Pris per kurv
                                        </span>
                                        <motion.span
                                            key={pris}
                                            initial={{ scale: 1.25 }}
                                            animate={{ scale: 1 }}
                                            className="text-2xl font-bold text-slate-800"
                                        >
                                            {pris} kr
                                        </motion.span>
                                    </div>
                                    <input
                                        type="range"
                                        min={MIN_PRIS}
                                        max={MAKS_PRIS}
                                        step={5}
                                        value={pris}
                                        disabled={phase !== 'finn'}
                                        onChange={(e) => handlePris(Number(e.target.value))}
                                        className="w-full accent-indigo-600"
                                        aria-label="Pris per kurv"
                                    />
                                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                                            <div className="text-rose-700 font-medium">Kundene vil kjøpe</div>
                                            <div className="text-xl font-bold text-rose-800">{qd} kurver</div>
                                        </div>
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                                            <div className="text-blue-700 font-medium">Bøndene vil selge</div>
                                            <div className="text-xl font-bold text-blue-800">{qs} kurver</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 h-6 text-slate-500 text-sm">
                                        {kurverIgjen > 0 && (
                                            <span className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(8, Math.ceil(kurverIgjen / 10)) }).map((_, i) => (
                                                    <motion.span
                                                        key={i}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        aria-hidden
                                                    >
                                                        🧺
                                                    </motion.span>
                                                ))}
                                                <span className="ml-1">til overs</span>
                                            </span>
                                        )}
                                        {tomhendte > 0 && (
                                            <span className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(8, Math.ceil(tomhendte / 10)) }).map((_, i) => (
                                                    <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                        <Users className="w-4 h-4 text-rose-400" />
                                                    </motion.span>
                                                ))}
                                                <span className="ml-1">uten bær</span>
                                            </span>
                                        )}
                                    </div>
                                    {phase === 'finn' && dag.endret && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            Stiplet linje = {dag.endret} på en vanlig dag, da prisen var {likevektspris(DAGER[0])} kr.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${phase}-${melding.tone}-${dagNr}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${phase === 'ferdig' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : toneKlasser}`}
                    >
                        {phase === 'ferdig'
                            ? 'Prisen er et signal. Høy pris sier til bøndene: lag mer! Lav pris sier: dette er det nok av.'
                            : melding.tekst}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'likevekt' ? (
                    <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={handleNeste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {dagNr === DAGER.length - 1 ? 'Se hva du lærte' : 'Neste dag'}
                    </motion.button>
                ) : (
                    <span className="text-sm text-slate-400">
                        {phase === 'ferdig' ? 'Ferdig!' : `${funnet.length} av ${DAGER.length} dager klare`}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
