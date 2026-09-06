import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Check, X, Gavel, RotateCcw, Sparkles } from 'lucide-react';

// Signaturkomponent for artikkelen «Bill of Rights 1689».
// Lyspære-øyeblikket: eleven skal kjenne at det avgjørende ordet i Bill of
// Rights er «uten parlamentets samtykke». De samme handlingene er lov når
// parlamentet har sagt ja, og ulovlige når kongen gjør dem alene. Det var
// akkurat den forskjellen som gjorde eneveldet umulig i England.

interface RettsSak {
    id: string;
    handling: string;
    lovlig: boolean;
    forklaring: string;
}

interface ParlamentetsJaProps {
    title?: string;
    saker?: RettsSak[];
}

const STANDARD_SAKER: RettsSak[] = [
    {
        id: 'lov',
        handling: 'Kongen setter til side en lov parlamentet har vedtatt. Han spør ingen først.',
        lovlig: false,
        forklaring:
            'Ulovlig. Bill of Rights slår fast at kongen ikke kan oppheve eller sette til side lover uten at parlamentet sier ja.',
    },
    {
        id: 'skatt-alene',
        handling: 'Krigen koster mer enn ventet. Kongen krever inn en ny skatt på egen hånd.',
        lovlig: false,
        forklaring:
            'Ulovlig. Å kreve inn penger til kronen uten at parlamentet har gitt lov til det, er forbudt i Bill of Rights.',
    },
    {
        id: 'skatt-med-ja',
        handling: 'Kongen ber parlamentet om penger til krigen. Parlamentet sier ja, og skatten kreves inn.',
        lovlig: true,
        forklaring:
            'Lov. Dette er hele poenget: kongen får fortsatt pengene sine, men bare gjennom parlamentet.',
    },
    {
        id: 'haer-alene',
        handling: 'Det er fred i landet. Kongen holder likevel en hær på ti tusen mann. Parlamentet har ikke sagt ja.',
        lovlig: false,
        forklaring:
            'Ulovlig. Bill of Rights sier at det er mot loven å holde en stående hær i riket i fredstid uten parlamentets samtykke.',
    },
    {
        id: 'haer-med-ja',
        handling: 'Det er fred, og parlamentet har sagt ja til at kongen kan beholde hæren. Hæren blir stående.',
        lovlig: true,
        forklaring:
            'Lov. Samme hær, samme fred. Det eneste som er forskjellig, er at parlamentet har sagt ja.',
    },
    {
        id: 'valg',
        handling: 'Kongen liker ikke mannen en by har valgt inn i parlamentet, og bytter ham ut med sin egen.',
        lovlig: false,
        forklaring: 'Ulovlig. Bill of Rights krever at valgene til parlamentet skal være frie.',
    },
    {
        id: 'tale',
        handling: 'Et parlamentsmedlem kritiserer kongen hardt i en tale i salen. Kongen får ham stilt for retten for det han sa.',
        lovlig: false,
        forklaring:
            'Ulovlig. Det som blir sagt i debatter i parlamentet, skal ingen domstol utenfor parlamentet kunne straffe.',
    },
];

type Fase = 'spor' | 'svart' | 'ferdig';

export function ParlamentetsJa({
    title = 'Parlamentets ja',
    saker = STANDARD_SAKER,
}: ParlamentetsJaProps) {
    const [steg, setSteg] = useState(0);
    const [fase, setFase] = useState<Fase>('spor');
    const [sisteSvar, setSisteSvar] = useState<boolean | null>(null);
    const [riktige, setRiktige] = useState(0);

    const sak = saker[steg];
    const traff = sisteSvar !== null && sisteSvar === sak?.lovlig;

    const svar = (valgtLovlig: boolean) => {
        if (fase !== 'spor') return;
        setSisteSvar(valgtLovlig);
        if (valgtLovlig === sak.lovlig) setRiktige((r) => r + 1);
        setFase('svart');
    };

    const neste = () => {
        if (steg + 1 >= saker.length) {
            setFase('ferdig');
            return;
        }
        setSteg((s) => s + 1);
        setSisteSvar(null);
        setFase('spor');
    };

    const handleReset = () => {
        setSteg(0);
        setFase('spor');
        setSisteSvar(null);
        setRiktige(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er dommer i England etter 1689. Er handlingen lov eller ulovlig?
                    </p>
                </div>
            </div>

            {/* Framdrift */}
            <div className="px-6 pt-4 flex items-center gap-2">
                {saker.map((s, i) => (
                    <div
                        key={s.id}
                        className={`h-1.5 flex-1 rounded-full ${
                            i < steg || fase === 'ferdig'
                                ? 'bg-indigo-400'
                                : i === steg
                                  ? 'bg-indigo-200'
                                  : 'bg-slate-100'
                        }`}
                    />
                ))}
                <span className="text-xs text-slate-400 tabular-nums ml-1">
                    {fase === 'ferdig' ? saker.length : steg + 1}/{saker.length}
                </span>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 pt-4">
                <AnimatePresence mode="wait">
                    {fase === 'ferdig' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center"
                        >
                            <motion.div
                                initial={{ rotate: -20, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3"
                            >
                                <Sparkles className="w-6 h-6 text-emerald-600" />
                            </motion.div>
                            <p className="font-semibold text-emerald-800">
                                Du dømte riktig i {riktige} av {saker.length} saker.
                            </p>
                            <p className="text-sm text-emerald-700 mt-2 max-w-md mx-auto">
                                Legg merke til hva som avgjorde hver sak. Det var ikke hva kongen
                                gjorde, men om parlamentet hadde sagt ja. Etter 1689 måtte kongen ha
                                med seg parlamentet på lovene, skatten, hæren og valgene. Da var det
                                ikke lenger mulig å styre alene.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={sak.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.18 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5"
                        >
                            <div className="flex items-start gap-3">
                                <Gavel className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-slate-800 leading-relaxed">{sak.handling}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="mx-6 mb-4 min-h-[68px]">
                <AnimatePresence mode="wait">
                    {fase === 'svart' ? (
                        <motion.div
                            key={`fb-${sak.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex items-start gap-2 ${
                                traff
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {traff ? (
                                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                            ) : (
                                <X className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <span>
                                {traff ? 'Riktig dømt. ' : 'Ikke helt. '}
                                {sak.forklaring}
                            </span>
                        </motion.div>
                    ) : (
                        <div
                            key="tom"
                            className="px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm"
                        >
                            {fase === 'ferdig'
                                ? 'Trykk Start på nytt for å dømme sakene en gang til.'
                                : 'Les saken, og velg Lov eller Ulovlig.'}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {fase === 'spor' && (
                        <>
                            <button
                                onClick={() => svar(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                            >
                                Lov
                            </button>
                            <button
                                onClick={() => svar(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-6 py-2 text-sm font-medium transition-colors"
                            >
                                Ulovlig
                            </button>
                        </>
                    )}
                    {fase === 'svart' && (
                        <button
                            onClick={neste}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            {steg + 1 >= saker.length ? 'Se dommen din' : 'Neste sak'}
                        </button>
                    )}
                </div>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
