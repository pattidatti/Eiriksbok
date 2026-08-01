import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, RotateCcw, Sparkles } from 'lucide-react';

// Lyspære-øyeblikk: Mogulriket var et rike der de aller fleste hadde en annen tro
// enn keiseren. Eleven tar de fire valgene keiserne faktisk sto overfor og ser at
// samholdet i riket henger sammen med hvor mye plass keiseren gir de andre.

interface StormogulensValgProps {
    title?: string;
}

interface Option {
    label: string;
    blurb: string;
    effect: number;
    feedback: string;
}

interface Decision {
    id: string;
    question: string;
    context: string;
    open: Option;
    strict: Option;
}

const DECISIONS: Decision[] = [
    {
        id: 'jizya',
        question: 'Skal du kreve inn den ekstra skatten fra dem som ikke er muslimer?',
        context: 'Skatten heter jizya. Den gir mye penger, men den minner hver hindu i riket om at hen er en annenrangs innbygger.',
        open: {
            label: 'Fjern skatten',
            blurb: 'Alle betaler det samme',
            effect: 14,
            feedback: 'Kassa blir tynnere, men hinduene kjenner for første gang at riket også er deres.',
        },
        strict: {
            label: 'Krev den inn',
            blurb: 'Bare muslimer slipper',
            effect: -14,
            feedback: 'Pengene renner inn. Men i by etter by får folk en daglig påminnelse om at troen deres koster penger.',
        },
    },
    {
        id: 'rajputene',
        question: 'Hva gjør du med rajput-fyrstene, de hinduiske krigerfyrstene i nord?',
        context: 'De har egne hærer og egne borger. De kan bli dine farligste fiender eller dine sterkeste allierte.',
        open: {
            label: 'Gjør dem til familie',
            blurb: 'Gift deg inn og gi dem topp-stillinger',
            effect: 14,
            feedback: 'Rajput-fyrstene blir generaler og guvernører i din egen hær. Nå slåss de for riket, ikke mot det.',
        },
        strict: {
            label: 'Hold dem utenfor',
            blurb: 'Hoffet er bare for dine egne',
            effect: -12,
            feedback: 'Du slipper å dele makten. Til gjengjeld har du nå fiender med egne hærer inne i ditt eget rike.',
        },
    },
    {
        id: 'templene',
        question: 'Noen ved hoffet vil rive hindutempler. Hva svarer du?',
        context: 'Templene er ikke bare bygninger. De er midtpunktet i landsbyene, og folk har bygd dem gjennom hundrevis av år.',
        open: {
            label: 'La dem stå',
            blurb: 'Alle får dyrke sin egen tro',
            effect: 12,
            feedback: 'Landsbyene puster ut. Ryktet om en keiser som lar folk være i fred sprer seg raskere enn noen hær.',
        },
        strict: {
            label: 'Riv dem',
            blurb: 'Bare én tro skal synes',
            effect: -16,
            feedback: 'Templene faller. Det gjør sinnet i landsbyene om til noe farligere: opprør som varer i generasjoner.',
        },
    },
    {
        id: 'krigen',
        question: 'Skal du bruke skattepengene på nye erobringer i sør?',
        context: 'Rikene i Deccan lokker. Men en hær som står i felt år etter år, koster mer enn den bringer hjem.',
        open: {
            label: 'Bygg heller riket',
            blurb: 'Veier, styring og handel',
            effect: 12,
            feedback: 'Riket vokser ikke på kartet, men det vokser innover. Handelen blomstrer og skattekassa fylles av seg selv.',
        },
        strict: {
            label: 'Marsjer sørover',
            blurb: 'Riket skal bli størst mulig',
            effect: -14,
            feedback: 'Kartet blir større enn noen gang. Men krigen tar aldri slutt, og pengene til å styre alt sammen finnes ikke.',
        },
    },
];

const TILES = 12;
const START = 50;

function verdict(score: number) {
    if (score >= 74)
        return {
            tone: 'success' as const,
            heading: 'Riket holder sammen',
            text: 'Du valgte omtrent som Akbar gjorde da han styrte fra 1556 til 1605. Han fjernet skatten på ikke-muslimer, giftet seg inn i rajput-familiene og gjorde hinduer til generaler og guvernører. Riket hans ble både rikt og rolig.',
        };
    if (score >= 45)
        return {
            tone: 'neutral' as const,
            heading: 'Riket vakler',
            text: 'Du ga med den ene hånda og tok med den andre. Et rike der de fleste tror noe annet enn keiseren, tåler noen harde valg, men ikke mange på rad. Sprekkene begynner å vise seg.',
        };
    return {
        tone: 'warning' as const,
        heading: 'Riket sprekker',
        text: 'Du valgte omtrent som Aurangzeb gjorde da han styrte fra 1658 til 1707. Han krevde inn skatten igjen, lot templer bli revet og førte krig i sør i tjuefem år. Riket ble større enn noen gang på kartet, og falt fra hverandre kort tid etter at han døde.',
    };
}

export function StormogulensValg({ title = 'Stormogulens valg' }: StormogulensValgProps) {
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(START);
    const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null);

    const done = step >= DECISIONS.length;
    const decision = done ? null : DECISIONS[step];
    const lit = Math.max(1, Math.min(TILES, Math.round((score / 100) * TILES)));
    const result = verdict(score);

    const choose = (option: Option) => {
        setScore((s) => Math.max(4, Math.min(96, s + option.effect)));
        setFeedback({ text: option.feedback, good: option.effect > 0 });
        setStep((s) => s + 1);
    };

    const handleReset = () => {
        setStep(0);
        setScore(START);
        setFeedback(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Crown className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er stormogul, og du er muslim. Svært mange av innbyggerne dine er
                        hinduer. Ta fire valg og se om riket holder sammen.
                    </p>
                </div>
            </div>

            {/* Rikets tilstand */}
            <div className="px-5 sm:px-6 pt-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Samhold i riket
                    </span>
                    <motion.span
                        key={score}
                        initial={{ scale: 1.25 }}
                        animate={{ scale: 1 }}
                        className={`text-sm font-bold tabular-nums ${
                            score >= 74
                                ? 'text-emerald-600'
                                : score >= 45
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                        }`}
                    >
                        {score} av 100
                    </motion.span>
                </div>
                <div className="flex gap-1.5">
                    {Array.from({ length: TILES }, (_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                backgroundColor:
                                    i < lit
                                        ? score >= 74
                                            ? '#10b981'
                                            : score >= 45
                                              ? '#f59e0b'
                                              : '#f43f5e'
                                        : '#e2e8f0',
                                y: i < lit ? 0 : 3,
                            }}
                            transition={{ duration: 0.35, delay: i * 0.025 }}
                            className="h-7 flex-1 rounded-md"
                        />
                    ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                    Hver rute er en landsdel. Lyser den, blir skatten betalt og freden holdt.
                </p>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="px-5 sm:px-6 py-5">
                <AnimatePresence mode="wait">
                    {decision ? (
                        <motion.div
                            key={decision.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                        >
                            <p className="font-semibold text-slate-800">{decision.question}</p>
                            <p className="mt-1 text-sm text-slate-500">{decision.context}</p>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[decision.open, decision.strict].map((option) => (
                                    <motion.button
                                        key={option.label}
                                        onClick={() => choose(option)}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 shadow-sm hover:shadow-md p-4 transition-colors"
                                    >
                                        <span className="block font-semibold text-slate-800">
                                            {option.label}
                                        </span>
                                        <span className="block mt-0.5 text-sm text-slate-500">
                                            {option.blurb}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="resultat"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className={`rounded-xl border p-4 ${
                                result.tone === 'success'
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : result.tone === 'neutral'
                                      ? 'bg-blue-50 border-blue-200'
                                      : 'bg-rose-50 border-rose-200'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <motion.span
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                                >
                                    <Sparkles
                                        className={`w-5 h-5 ${
                                            result.tone === 'success'
                                                ? 'text-emerald-600'
                                                : result.tone === 'neutral'
                                                  ? 'text-blue-600'
                                                  : 'text-rose-600'
                                        }`}
                                    />
                                </motion.span>
                                <h4
                                    className={`font-semibold ${
                                        result.tone === 'success'
                                            ? 'text-emerald-800'
                                            : result.tone === 'neutral'
                                              ? 'text-blue-800'
                                              : 'text-rose-800'
                                    }`}
                                >
                                    {result.heading}
                                </h4>
                            </div>
                            <p
                                className={`mt-2 text-sm leading-relaxed ${
                                    result.tone === 'success'
                                        ? 'text-emerald-800'
                                        : result.tone === 'neutral'
                                          ? 'text-blue-800'
                                          : 'text-rose-800'
                                }`}
                            >
                                {result.text}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-5 sm:px-6 pb-4">
                <div
                    className={`min-h-[3.25rem] flex items-center rounded-lg border px-4 py-3 text-sm ${
                        feedback
                            ? feedback.good
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={feedback?.text ?? 'tom'}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {feedback?.text ?? 'Velg ett av de to svarene over, så ser du hva som skjer med riket.'}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {DECISIONS.map((d, i) => (
                        <span
                            key={d.id}
                            className={`h-2 rounded-full transition-all ${
                                i < step ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-200'
                            }`}
                        />
                    ))}
                    <span className="ml-2 text-xs text-slate-400">
                        Valg {Math.min(step + 1, DECISIONS.length)} av {DECISIONS.length}
                    </span>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
