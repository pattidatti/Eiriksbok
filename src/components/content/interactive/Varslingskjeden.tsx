import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Filter, Building2, Eye, Plane, RotateCcw, Trophy, Check, X } from 'lucide-react';

interface VarslingskjedenProps {
    title?: string;
}

type Phase = 'blind' | 'switch' | 'chain' | 'done';

interface Raid {
    target: number;
    lowFlying?: boolean;
}

const SECTORS = ['Hampshire', 'Sussex', 'Kent', 'Essex'];
const ROUNDS = 5;

// Fast rekkefølge i runde 2, slik at alle elever møter det lavtflygende angrepet
const CHAIN_RAIDS: Raid[] = [
    { target: 2 },
    { target: 0 },
    { target: 3 },
    { target: 1, lowFlying: true },
    { target: 2 },
];

const CHAIN_STEPS = [
    { icon: Radio, label: 'Radar', short: 'Ser fly over havet' },
    { icon: Filter, label: 'Filterrom', short: 'Sorterer meldingene' },
    { icon: Building2, label: 'Sektorstasjon', short: 'Sender jagerfly' },
    { icon: Eye, label: 'Observatører', short: 'Ser fly over land' },
];

function stepText(step: number, raid: Raid): string {
    const name = SECTORS[raid.target];
    if (raid.lowFlying) {
        if (step === 1)
            return 'Radaren ser ingenting! Flyene flyr så lavt over havet at de glir under radarstrålene.';
        if (step === 2) return 'Filterrommet har ingen melding å sortere. Det er stille ... for stille.';
        if (step === 3) return 'Sektorstasjonen venter. Skvadronen står klar på bakken.';
        return `Frivillige observatører på bakken ser flyene komme inn over kysten. De ringer inn: «Fiendtlige fly over ${name}!»`;
    }
    if (step === 1) return 'En radarstasjon på kysten fanger opp et ekko: mange fly samler seg over Frankrike.';
    if (step === 2)
        return 'Filterrommet i Bentley Priory setter sammen meldinger fra flere radarstasjoner til ett bilde.';
    return `Sektorstasjonen får beskjed: flyene er på vei mot ${name}. Send skvadronen dit!`;
}

function randomTarget() {
    return Math.floor(Math.random() * SECTORS.length);
}

export function Varslingskjeden({
    title = 'Varslingskjeden: Kan du stoppe angrepene?',
}: VarslingskjedenProps) {
    const [phase, setPhase] = useState<Phase>('blind');
    const [round, setRound] = useState(0);
    const [choice, setChoice] = useState<number | null>(null);
    const [blindTarget, setBlindTarget] = useState<number | null>(null);
    const [blindHits, setBlindHits] = useState(0);
    const [chainHits, setChainHits] = useState(0);
    const [chainStep, setChainStep] = useState(0);

    const raid = CHAIN_RAIDS[round];
    const lastStep = raid?.lowFlying ? 4 : 3;
    const chainReady = phase === 'chain' && chainStep >= lastStep;

    // Varslingen tennes ett ledd av gangen
    useEffect(() => {
        if (phase !== 'chain' || choice !== null || chainStep >= lastStep) return;
        const t = setTimeout(() => setChainStep((s) => s + 1), chainStep === 0 ? 400 : 1100);
        return () => clearTimeout(t);
    }, [phase, chainStep, choice, lastStep]);

    const handleSector = (i: number) => {
        if (choice !== null) return;
        if (phase === 'blind') {
            const target = randomTarget();
            setChoice(i);
            setBlindTarget(target);
            if (target === i) setBlindHits((h) => h + 1);
        } else if (phase === 'chain' && chainReady) {
            setChoice(i);
            if (raid.target === i) setChainHits((h) => h + 1);
        }
    };

    const handleNext = () => {
        const next = round + 1;
        setChoice(null);
        setBlindTarget(null);
        setChainStep(0);
        if (next < ROUNDS) {
            setRound(next);
            return;
        }
        setRound(0);
        setPhase(phase === 'blind' ? 'switch' : 'done');
    };

    const handleReset = () => {
        setPhase('blind');
        setRound(0);
        setChoice(null);
        setBlindTarget(null);
        setBlindHits(0);
        setChainHits(0);
        setChainStep(0);
    };

    const target = phase === 'blind' ? blindTarget : chainReady ? raid.target : null;
    const hit = choice !== null && choice === (phase === 'blind' ? blindTarget : raid?.target);

    let feedback: { text: string; tone: 'info' | 'good' | 'bad' } = {
        text: '',
        tone: 'info',
    };
    if (phase === 'blind') {
        feedback =
            choice === null
                ? {
                      text: 'Du har ingen radar. Tyske fly er på vei, men du vet ikke hvor. Gjett: hvor sender du skvadronen?',
                      tone: 'info',
                  }
                : hit
                  ? { text: 'Flaks! Skvadronen var på rett sted.', tone: 'good' }
                  : {
                        text: `Bomber faller over ${SECTORS[blindTarget ?? 0]}. Skvadronen din fløy rundt over ${SECTORS[choice]} og så ingenting.`,
                        tone: 'bad',
                    };
    } else if (phase === 'chain') {
        feedback =
            choice !== null
                ? hit
                    ? { text: 'Truffet! Jagerflyene møtte angrepet i tide.', tone: 'good' }
                    : {
                          text: `Feil sektor. Varslingen pekte på ${SECTORS[raid.target]}.`,
                          tone: 'bad',
                      }
                : chainStep === 0
                  ? { text: 'Nytt angrep på vei. Følg med på varslingskjeden ...', tone: 'info' }
                  : { text: stepText(chainStep, raid), tone: raid.lowFlying && chainStep < 4 ? 'bad' : 'info' };
    }

    const toneClass = {
        info: 'bg-blue-50 border-blue-200 text-blue-700',
        good: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        bad: 'bg-rose-50 border-rose-200 text-rose-700',
    }[feedback.tone];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Radio className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du styrer én skvadron jagerfly. Klikk på sektoren du vil forsvare.
                    </p>
                </div>
            </div>

            {(phase === 'blind' || phase === 'chain') && (
                <div className="p-6 space-y-5">
                    {/* Status */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                            {phase === 'blind' ? 'Runde 1: Uten radar' : 'Runde 2: Med varslingskjeden'}
                        </span>
                        <span className="text-slate-500">
                            Angrep {round + 1} av {ROUNDS} · Stoppet:{' '}
                            {phase === 'blind' ? blindHits : chainHits}
                        </span>
                    </div>

                    {/* Varslingskjeden */}
                    {phase === 'chain' && (
                        <div className="grid grid-cols-4 gap-2">
                            {CHAIN_STEPS.map((s, i) => {
                                const Icon = s.icon;
                                const stepNo = i + 1;
                                const skipped = !raid.lowFlying && stepNo === 4;
                                const failed = raid.lowFlying && stepNo < 4 && chainStep >= stepNo;
                                const lit = chainStep >= stepNo && !skipped && !failed;
                                return (
                                    <motion.div
                                        key={s.label}
                                        animate={{ scale: chainStep === stepNo ? 1.06 : 1 }}
                                        className={`rounded-xl border px-2 py-2 text-center ${
                                            lit
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                : failed
                                                  ? 'bg-rose-50 border-rose-200 text-rose-500'
                                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5 mx-auto mb-1" />
                                        <div className="text-xs font-semibold">{s.label}</div>
                                        <div className="text-[11px] leading-tight hidden sm:block">
                                            {s.short}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Kystkartet */}
                    <div className="rounded-xl bg-sky-50 border border-sky-200 p-3">
                        <div className="grid grid-cols-4 gap-2">
                            {SECTORS.map((name, i) => {
                                const isTarget = target === i;
                                const isChoice = choice === i;
                                const clickable =
                                    choice === null && (phase === 'blind' || chainReady);
                                return (
                                    <motion.button
                                        key={name}
                                        onClick={() => handleSector(i)}
                                        disabled={!clickable}
                                        whileHover={clickable ? { y: -3 } : undefined}
                                        whileTap={clickable ? { scale: 0.95 } : undefined}
                                        animate={
                                            isTarget && choice === null
                                                ? { scale: [1, 1.05, 1] }
                                                : { scale: 1 }
                                        }
                                        transition={
                                            isTarget && choice === null
                                                ? { repeat: Infinity, duration: 1 }
                                                : undefined
                                        }
                                        className={`relative h-24 rounded-xl border-2 font-semibold text-sm flex flex-col items-center justify-center gap-1 ${
                                            isChoice && hit
                                                ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                                : isChoice
                                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                                  : isTarget
                                                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                                                    : 'bg-lime-50 border-lime-200 text-slate-700'
                                        } ${clickable ? 'cursor-pointer shadow-sm hover:shadow-md' : 'cursor-default'}`}
                                    >
                                        <span>{name}</span>
                                        {isTarget && (
                                            <motion.span
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="flex items-center gap-1 text-xs text-amber-700"
                                            >
                                                <Plane className="w-4 h-4 rotate-[-45deg]" /> Angrep
                                            </motion.span>
                                        )}
                                        {isChoice && (
                                            <span className="absolute top-1 right-1">
                                                {hit ? (
                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <X className="w-4 h-4 text-rose-500" />
                                                )}
                                            </span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                        <div className="text-center text-xs text-sky-700 mt-2">
                            ~ Den engelske kanal ~ tyske fly kommer fra Frankrike ~
                        </div>
                    </div>
                </div>
            )}

            {phase === 'switch' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 text-center space-y-3"
                >
                    <p className="text-3xl font-bold text-rose-600">
                        {blindHits} av {ROUNDS}
                    </p>
                    <p className="text-slate-700">
                        Så mange angrep stoppet du ved å gjette. Resten av gangene var jagerflyene
                        på feil sted.
                    </p>
                    <p className="text-slate-700">
                        Nå får du samme antall fly, men med hjelp fra varslingskjeden: radar,
                        filterrom, sektorstasjoner og observatører på bakken.
                    </p>
                </motion.div>
            )}

            {phase === 'done' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="p-6 space-y-4"
                >
                    <div className="flex justify-center">
                        <motion.div
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.8 }}
                            className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center"
                        >
                            <Trophy className="w-7 h-7 text-emerald-600" />
                        </motion.div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                        {[
                            { label: 'Uten radar', value: blindHits, color: 'bg-rose-400' },
                            { label: 'Med varslingskjeden', value: chainHits, color: 'bg-emerald-500' },
                        ].map((r) => (
                            <div key={r.label} className="text-center">
                                <div className="h-28 bg-slate-100 rounded-xl flex items-end overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(r.value / ROUNDS) * 100}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className={`w-full ${r.color}`}
                                    />
                                </div>
                                <div className="mt-1 text-sm font-semibold text-slate-700">
                                    {r.value} av {ROUNDS}
                                </div>
                                <div className="text-xs text-slate-500">{r.label}</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-slate-700 text-center max-w-xl mx-auto">
                        Britene hadde færre jagerfly enn tyskerne. Men varslingskjeden gjorde at hvert
                        fly kom til rett sted i rett tid, i stedet for å fly rundt og lete. Og der
                        radaren ikke så noe, tok folk på bakken over.
                    </p>
                </motion.div>
            )}

            {/* Feedback-sone */}
            <div className="mx-6 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {feedback.text && (
                        <motion.div
                            key={feedback.text}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${toneClass}`}
                        >
                            {feedback.text}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'switch' ? (
                    <button
                        onClick={() => setPhase('chain')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Prøv med varslingskjeden
                    </button>
                ) : phase !== 'done' ? (
                    <button
                        onClick={handleNext}
                        disabled={choice === null}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {round + 1 < ROUNDS ? 'Neste angrep' : 'Se resultatet'}
                    </button>
                ) : (
                    <span className="text-sm font-medium text-emerald-700">Ferdig!</span>
                )}
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
