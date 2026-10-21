import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Armchair, Check, FileText, Minus, Plus, RotateCcw, Scale } from 'lucide-react';

// BordetIVereeniging: eleven gjetter først hvem som satt ved forhandlingsbordet
// da Boerkrigen sluttet i 1902. Så åpner eleven punktene i fredsavtalen ett for
// ett og ser hvem hvert punkt hjalp og hvem det skadet.
//
// Lyspære-øyeblikket: Freden ble skrevet av dem som satt ved bordet. De som ikke
// var der, de svarte sørafrikanerne, fikk ingenting - selv om de hadde vært med
// i krigen på begge sider.
//
// Fakta: South African History Online (2012): Peace Treaty of Vereeniging
// (transcript), og South African History Online (2011): Role of Black people in
// the South African War.

interface BordetIVereenigingProps {
    title?: string;
}

type Phase = 'bordet' | 'punkter' | 'ferdig';
type GruppeId = 'britene' | 'boerne' | 'svarte';
type Effekt = 1 | 0 | -1;

interface Gruppe {
    id: GruppeId;
    navn: string;
    beskrivelse: string;
    vedBordet: boolean;
    farge: string;
}

interface Punkt {
    id: string;
    tittel: string;
    tekst: string;
    effekt: Record<GruppeId, Effekt>;
}

const GRUPPER: Gruppe[] = [
    {
        id: 'britene',
        navn: 'Britene',
        beskrivelse: 'Imperiet som vant krigen',
        vedBordet: true,
        farge: 'bg-rose-400',
    },
    {
        id: 'boerne',
        navn: 'Boerne',
        beskrivelse: 'De to republikkene som tapte',
        vedBordet: true,
        farge: 'bg-amber-400',
    },
    {
        id: 'svarte',
        navn: 'Svarte sørafrikanere',
        beskrivelse: 'Over 100 000 arbeidet for britene, minst 10 000 fulgte boerne',
        vedBordet: false,
        farge: 'bg-emerald-500',
    },
];

const PUNKTER: Punkt[] = [
    {
        id: 'vapen',
        tittel: 'Våpnene legges ned',
        tekst: 'Boernes soldater skal legge ned våpnene og levere fra seg kanoner og geværer.',
        effekt: { britene: 1, boerne: -1, svarte: 0 },
    },
    {
        id: 'sprak',
        tittel: 'Språket deres i skolen',
        tekst: 'Nederlandsk skal undervises i skolene der foreldrene ønsker det, og kan brukes i retten.',
        effekt: { britene: 0, boerne: 1, svarte: 0 },
    },
    {
        id: 'selvstyre',
        tittel: 'Løfte om selvstyre',
        tekst: 'Det britiske militærstyret skal så snart som mulig byttes ut med sivilt styre, og etter hvert med selvstyre.',
        effekt: { britene: 0, boerne: 1, svarte: 0 },
    },
    {
        id: 'stemmerett',
        tittel: 'Stemmerett for svarte',
        tekst: 'Spørsmålet om stemmerett for svarte skal ikke avgjøres før selvstyret er innført.',
        effekt: { britene: 0, boerne: 1, svarte: -1 },
    },
    {
        id: 'penger',
        tittel: 'Penger til gjenoppbygging',
        tekst: 'Britene setter av tre millioner pund for å hjelpe folk hjem igjen, med mat, husly, såkorn og redskaper.',
        effekt: { britene: 0, boerne: 1, svarte: 0 },
    },
];

function sum(id: GruppeId, apnet: string[]) {
    return PUNKTER.filter((p) => apnet.includes(p.id)).reduce((s, p) => s + p.effekt[id], 0);
}

export function BordetIVereeniging({
    title = 'Hvem satt ved bordet i Vereeniging?',
}: BordetIVereenigingProps) {
    const [phase, setPhase] = useState<Phase>('bordet');
    const [valgt, setValgt] = useState<GruppeId[]>([]);
    const [sjekket, setSjekket] = useState(false);
    const [apnet, setApnet] = useState<string[]>([]);

    const alleApnet = apnet.length === PUNKTER.length;
    const antallRiktig = GRUPPER.filter((g) => valgt.includes(g.id) === g.vedBordet).length;

    const handleStol = (id: GruppeId) => {
        if (sjekket) return;
        setValgt((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const handlePunkt = (id: string) => {
        if (apnet.includes(id)) return;
        const neste = [...apnet, id];
        setApnet(neste);
        if (neste.length === PUNKTER.length) setPhase('ferdig');
    };

    const handleReset = () => {
        setPhase('bordet');
        setValgt([]);
        setSjekket(false);
        setApnet([]);
    };

    const feedback = (() => {
        if (phase === 'ferdig') {
            return 'Boerne tapte krigen, men fikk språket, pengene og løftet om selvstyre. De svarte sørafrikanerne var med i krigen på begge sider, men satt ikke ved bordet. Det eneste punktet om dem utsatte stemmeretten deres, og la avgjørelsen i hendene på de hvite.';
        }
        if (phase === 'punkter') {
            return `Åpne alle punktene i avtalen. Du har lest ${apnet.length} av ${PUNKTER.length}.`;
        }
        if (!sjekket)
            return 'Klikk på stolene for å sette de gruppene du tror var med og forhandlet.';
        if (antallRiktig === GRUPPER.length)
            return 'Riktig! Bare britene og boerne forhandlet. De svarte sørafrikanerne hadde ingen plass ved bordet.';
        return 'Ikke helt. Bare britene og boerne forhandlet. De svarte sørafrikanerne hadde ingen plass ved bordet.';
    })();

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {phase === 'bordet'
                            ? 'Mai 1902: Krigen skal avsluttes. Hvem fikk være med og bestemme freden?'
                            : 'Åpne punktene i fredsavtalen og se hvem hvert punkt hjalp.'}
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 space-y-5">
                {/* Stolene og poengtavla */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {GRUPPER.map((g) => {
                        const sitter = phase === 'bordet' ? valgt.includes(g.id) : g.vedBordet;
                        const riktig = valgt.includes(g.id) === g.vedBordet;
                        const poeng = sum(g.id, apnet);
                        let stil = sitter
                            ? 'bg-indigo-50 border-indigo-300'
                            : 'bg-white border-slate-200 hover:shadow-md';
                        if (phase === 'bordet' && sjekket)
                            stil = riktig
                                ? 'bg-emerald-50 border-emerald-300'
                                : 'bg-rose-50 border-rose-200';
                        if (phase !== 'bordet')
                            stil = g.vedBordet
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-slate-50 border-dashed border-slate-300';
                        return (
                            <motion.button
                                key={g.id}
                                layout
                                whileTap={
                                    phase === 'bordet' && !sjekket ? { scale: 0.96 } : undefined
                                }
                                onClick={() => phase === 'bordet' && handleStol(g.id)}
                                disabled={phase !== 'bordet' || sjekket}
                                className={`text-left rounded-xl border p-4 ${stil}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-3 h-3 rounded-full ${g.farge}`} />
                                    <span className="text-sm font-semibold text-slate-800">
                                        {g.navn}
                                    </span>
                                    <motion.span
                                        animate={{
                                            scale: sitter ? 1 : 0.8,
                                            opacity: sitter ? 1 : 0.35,
                                        }}
                                        className="ml-auto"
                                    >
                                        <Armchair
                                            className={`w-5 h-5 ${sitter ? 'text-indigo-600' : 'text-slate-400'}`}
                                        />
                                    </motion.span>
                                </div>
                                <p className="text-xs text-slate-500">{g.beskrivelse}</p>
                                {phase !== 'bordet' && (
                                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-xs text-slate-500 w-full">
                                            {g.vedBordet ? 'Ved bordet' : 'Ikke med'}
                                        </span>
                                        <div className="flex gap-1">
                                            {PUNKTER.filter((p) => apnet.includes(p.id)).map(
                                                (p) =>
                                                    p.effekt[g.id] !== 0 && (
                                                        <motion.span
                                                            key={p.id}
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                                                p.effekt[g.id] > 0
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-rose-100 text-rose-700'
                                                            }`}
                                                        >
                                                            {p.effekt[g.id] > 0 ? (
                                                                <Plus className="w-3 h-3" />
                                                            ) : (
                                                                <Minus className="w-3 h-3" />
                                                            )}
                                                        </motion.span>
                                                    )
                                            )}
                                        </div>
                                        <motion.span
                                            key={poeng}
                                            initial={{ scale: 1.4 }}
                                            animate={{ scale: 1 }}
                                            className={`ml-auto text-sm font-bold ${
                                                poeng > 0
                                                    ? 'text-emerald-600'
                                                    : poeng < 0
                                                      ? 'text-rose-600'
                                                      : 'text-slate-400'
                                            }`}
                                        >
                                            {poeng > 0 ? `+${poeng}` : poeng}
                                        </motion.span>
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Punktene i avtalen */}
                <AnimatePresence>
                    {phase !== 'bordet' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-5 gap-2"
                        >
                            {PUNKTER.map((p, i) => {
                                const erApen = apnet.includes(p.id);
                                return (
                                    <motion.button
                                        key={p.id}
                                        layout
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handlePunkt(p.id)}
                                        className={`text-left rounded-xl border p-3 ${
                                            erApen
                                                ? p.effekt.svarte < 0
                                                    ? 'bg-rose-50 border-rose-200'
                                                    : 'bg-slate-50 border-slate-200'
                                                : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                            <span className="text-xs font-semibold text-slate-800">
                                                Punkt {i + 1}
                                            </span>
                                        </div>
                                        {erApen ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <p className="text-xs font-medium text-slate-700 mb-1">
                                                    {p.tittel}
                                                </p>
                                                <p className="text-xs text-slate-600">{p.tekst}</p>
                                            </motion.div>
                                        ) : (
                                            <p className="text-xs text-slate-500">
                                                Klikk for å lese
                                            </p>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback}
                        initial={{ opacity: 0, y: 6 }}
                        animate={
                            phase === 'ferdig'
                                ? { opacity: 1, y: 0, scale: [1, 1.03, 1] }
                                : { opacity: 1, y: 0 }
                        }
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm flex items-start gap-2 ${
                            phase === 'ferdig'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {phase === 'ferdig' && <Check className="w-4 h-4 mt-0.5 shrink-0" />}
                        <span>{feedback}</span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'bordet' && !sjekket && (
                    <button
                        onClick={() => setSjekket(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Sjekk
                    </button>
                )}
                {phase === 'bordet' && sjekket && (
                    <button
                        onClick={() => setPhase('punkter')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Les fredsavtalen
                    </button>
                )}
                {phase !== 'bordet' && (
                    <span className="text-xs text-slate-400">
                        {alleApnet
                            ? 'Ferdig!'
                            : `${apnet.length} av ${PUNKTER.length} punkter lest`}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
