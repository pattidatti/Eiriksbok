
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Users, FileWarning, Stamp, ArrowRight, RefreshCcw } from 'lucide-react';

interface Outcome {
    text: string;
    supportChange: number; // For Politisk Støtte
    riskChange: number;    // For Atomkrig-fare
}

interface Scenario {
    id: string;
    date: string;
    title: string;
    description: string;
    secretInfo: string; // "Top Secret" context
    choiceA: {
        label: string;
        outcome: Outcome;
    };
    choiceB: {
        label: string;
        outcome: Outcome;
    };
}

const scenarios: Scenario[] = [
    {
        id: 'invasion',
        date: '25. JUNI 1950',
        title: 'Nord-Korea Angriper',
        description: 'Nord-koreanske styrker har krysset den 38. breddegrad. Seoul er under angrep. Sør-Korea kollapser.',
        secretInfo: 'INTERN RAPPORT: Hvis vi ikke handler, vil kommunismen spre seg til hele Asia. Men en krigserklæring krever Kongressens godkjennelse (tar tid).',
        choiceA: {
            label: 'Send amerikanske tropper NÅ (Sololøp)',
            outcome: {
                text: 'Rask handling reddet Pusan-perimeteret, men Sovjet kaller det "amerikansk imperialisme".',
                supportChange: 10,
                riskChange: 15
            }
        },
        choiceB: {
            label: 'Gå til FN og be om mandat',
            outcome: {
                text: 'FNs sikkerhetsråd (uten Sovjet til stede) godkjenner "politiaksjon". Vi har verdens støtte.',
                supportChange: 5,
                riskChange: -5
            }
        }
    },
    {
        id: 'crossing',
        date: 'OKTOBER 1950',
        title: 'Krysse Linjen?',
        description: 'Inchon-landingen var en suksess! Fienden flykter nordover. Skal vi stoppe ved grensen?',
        secretInfo: 'TOP SECRET: Kina har sendt signaler. Hvis vi nærmer oss Yalu-elven, vil de gripe inn.',
        choiceA: {
            label: 'Stopp ved 38. breddegrad',
            outcome: {
                text: 'Vi reddet Sør-Korea, men lot kommunistregimet i nord overleve. Opposisjonen kaller deg svak.',
                supportChange: -20,
                riskChange: -10
            }
        },
        choiceB: {
            label: 'Kryss grensen! (Foren Korea)',
            outcome: {
                text: 'Vi rykker nordover mot Kina. Seieren virker nær! MacArthur lover at soldatene er "hjemme til jul".',
                supportChange: 15,
                riskChange: 25
            }
        }
    },
    {
        id: 'china',
        date: 'NOVEMBER 1950',
        title: 'Kinesisk Sjokk',
        description: 'Hundretusener av kinesiske soldater har angrepet oss i isødet! Vi blir presset tilbake.',
        secretInfo: 'MACARTHUR KREVER: Tillatelse til å bombe kinesiske baser og forsyningslinjer inne i Kina.',
        choiceA: {
            label: 'Bomb basene i Kina',
            outcome: {
                text: 'Bomberne flyr. Sovjet svarer med å mobilisere i Europa. Faren for atomkrig er ekstrem.',
                supportChange: 10,
                riskChange: 50
            }
        },
        choiceB: {
            label: 'Nekt (Begrenset Krig)',
            outcome: {
                text: 'MacArthur er rasende. Våre soldater må kjempe med "en hånd på ryggen". Tapene er store.',
                supportChange: -15,
                riskChange: -10
            }
        }
    },
    {
        id: 'general',
        date: 'APRIL 1951',
        title: 'Generalens Opprør',
        description: 'MacArthur har offentlig kritisert din strategi og sabotert fredsforsøkene.',
        secretInfo: 'GRUNNLOVEN: Presidenten er øverstkommanderende. En general kan ikke lage sin egen utenrikspolitikk.',
        choiceA: {
            label: 'Gi ham en advarsel',
            outcome: {
                text: 'MacArthur fortsetter å undergrave deg. Verden lurer på hvem som egentlig styrer USA.',
                supportChange: -30,
                riskChange: 10
            }
        },
        choiceB: {
            label: 'Spark ham på dagen',
            outcome: {
                text: 'Sjokk i USA! Du er den mest upopulære presidenten i historien. Men demokratiet er reddet.',
                supportChange: -40,
                riskChange: -20
            }
        }
    }
];

export const TrumansDilemma: React.FC = () => {
    const [support, setSupport] = useState(60); // Politisk støtte
    const [risk, setRisk] = useState(20);       // Atomkrig-fare
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lastOutcome, setLastOutcome] = useState<string | null>(null);

    // Utledet, ikke egen state: utfallet følger alltid direkte av målerne og hvor
    // langt eleven har kommet.
    const state: 'playing' | 'ww3' | 'impeached' | 'won' =
        risk >= 100
            ? 'ww3'
            : support <= 0
              ? 'impeached'
              : currentIndex >= scenarios.length && !lastOutcome
                ? 'won'
                : 'playing';

    const handleChoice = (outcome: Outcome) => {
        setSupport(prev => Math.min(100, prev + outcome.supportChange));
        setRisk(prev => Math.min(100, Math.max(0, prev + outcome.riskChange)));
        setLastOutcome(outcome.text);
    };

    const nextScenario = () => {
        setLastOutcome(null);
        setCurrentIndex(prev => prev + 1);
    };

    const resetGame = () => {
        setSupport(60);
        setRisk(20);
        setCurrentIndex(0);
        setLastOutcome(null);
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-12 font-mono text-zinc-900 bg-[#f0e6d2] rounded-sm shadow-xl border-4 border-zinc-400 relative overflow-hidden">
            {/* Bakgrunnstekstur lå her, men aged-paper.png på
                transparenttextures.com svarer 404. Laget var tomt. */}

            {/* Header / Top Secret Stamp */}
            <div className="bg-zinc-800 text-zinc-200 p-4 border-b-4 border-zinc-400 flex justify-between items-center relative z-10">
                <div className="flex flex-col">
                    <span className="text-xs tracking-[0.2em] text-zinc-400">CLASSIFIED // EYES ONLY</span>
                    <h2 className="text-2xl font-bold tracking-tighter">THE TRUMAN FILES</h2>
                </div>
                <div className="border border-red-500 text-red-500 px-2 py-1 text-xs font-bold border-2 rotate-[-5deg] opacity-80">
                    TOP SECRET
                </div>
            </div>

            {/* Meters Panel */}
            <div className="grid grid-cols-2 gap-px bg-zinc-400 border-b-4 border-zinc-400 relative z-10">
                <div className="bg-[#e6dac3] p-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2 text-sm font-bold uppercase tracking-wider text-zinc-600">
                        <Users className="w-4 h-4" /> Politisk Støtte
                    </div>
                    <div className="w-full h-3 bg-zinc-300 border border-zinc-500 relative">
                        <motion.div
                            className="h-full bg-blue-700"
                            initial={{ width: `${support}%` }}
                            animate={{ width: `${support}%` }}
                        />
                    </div>
                    <span className="text-xs mt-1 text-zinc-500">{support}%</span>
                </div>
                <div className="bg-[#e6dac3] p-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2 text-sm font-bold uppercase tracking-wider text-red-700">
                        <Bomb className="w-4 h-4" /> Atomkrig-Bareometer
                    </div>
                    <div className="w-full h-3 bg-zinc-300 border border-zinc-500 relative">
                        <motion.div
                            className="h-full bg-red-600"
                            initial={{ width: `${risk}%` }}
                            animate={{ width: `${risk}%` }}
                        />
                    </div>
                    <span className="text-xs mt-1 text-red-700 font-bold">{risk}%</span>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="p-8 min-h-[400px] flex flex-col items-center justify-center relative z-10">
                <AnimatePresence mode="wait">
                    {state !== 'playing' ? (
                        <motion.div
                            key="gameover"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center max-w-md"
                        >
                            <div className="mb-6 flex justify-center">
                                {state === 'ww3' && <Bomb className="w-24 h-24 text-red-700 animate-pulse" />}
                                {state === 'impeached' && <FileWarning className="w-24 h-24 text-zinc-700" />}
                                {state === 'won' && <Stamp className="w-24 h-24 text-green-700 rotate-[-10deg]" />}
                            </div>

                            <h3 className="text-3xl font-bold mb-4 uppercase text-zinc-900 border-b-4 border-zinc-900 inline-block">
                                {state === 'ww3' && "GAME OVER: Verdenskrig"}
                                {state === 'impeached' && "GAME OVER: Riksrett"}
                                {state === 'won' && "MISSION ACCOMPLISHED"}
                            </h3>

                            <p className="mb-8 text-lg font-bold leading-relaxed">
                                {state === 'ww3' && "Du eskalerte konflikten. Sovjet svarte med atomvåpen. Sivilisasjonen er over."}
                                {state === 'impeached' && "Du mistet folkets og Kongressens støtte. Du blir den første presidenten som blir avsatt."}
                                {state === 'won' && "Du klarte det umulige: Å begrense krigen. Korea er delt, og du er upopulær, men verden går videre uten atomkrig."}
                            </p>

                            <button
                                onClick={resetGame}
                                className="px-8 py-3 bg-zinc-800 text-zinc-100 font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <RefreshCcw className="w-4 h-4" /> Prøv Igjen
                            </button>
                        </motion.div>
                    ) : lastOutcome ? (
                        <motion.div
                            key="outcome"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full text-center"
                        >
                            <div className="bg-white p-6 border-2 border-zinc-800 shadow-lg transform rotate-1 mb-8">
                                <h4 className="text-sm uppercase tracking-widest text-zinc-500 mb-2 border-b border-zinc-200 pb-1">Resultat</h4>
                                <p className="text-xl font-bold leading-relaxed">{lastOutcome}</p>
                            </div>
                            <button
                                onClick={nextScenario}
                                className="px-8 py-3 bg-blue-800 text-white font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto shadow-lg"
                            >
                                Neste <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={scenarios[currentIndex].id}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            className="w-full"
                        >
                            {/* Scenario Header */}
                            <div className="flex justify-between items-end mb-6 border-b-2 border-zinc-300 pb-2">
                                <span className="text-sm font-bold bg-zinc-800 text-white px-2 py-1">SCENARIO {currentIndex + 1}/4</span>
                                <span className="text-sm font-bold text-zinc-500">{scenarios[currentIndex].date}</span>
                            </div>

                            <h3 className="text-2xl font-bold mb-4">{scenarios[currentIndex].title}</h3>
                            <p className="text-lg mb-6 leading-relaxed">{scenarios[currentIndex].description}</p>

                            {/* Secret Info Box */}
                            <div className="bg-[#e3d5bc] p-4 border-l-4 border-red-700 mb-8 text-sm italic relative">
                                <span className="absolute -top-3 left-2 bg-red-700 text-white text-[10px] px-1 font-bold uppercase">Intelligence</span>
                                {scenarios[currentIndex].secretInfo}
                            </div>

                            {/* Choices */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleChoice(scenarios[currentIndex].choiceA.outcome)}
                                    className="p-4 border-2 border-zinc-800 bg-white hover:bg-zinc-50 text-left transition-transform active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                                >
                                    <span className="block font-bold mb-1 underline decoration-zinc-400">ALTERNATIV A</span>
                                    {scenarios[currentIndex].choiceA.label}
                                </button>
                                <button
                                    onClick={() => handleChoice(scenarios[currentIndex].choiceB.outcome)}
                                    className="p-4 border-2 border-zinc-800 bg-white hover:bg-zinc-50 text-left transition-transform active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                                >
                                    <span className="block font-bold mb-1 underline decoration-zinc-400">ALTERNATIV B</span>
                                    {scenarios[currentIndex].choiceB.label}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="bg-zinc-800 text-zinc-500 p-2 text-[10px] text-center uppercase tracking-widest relative z-10">
                White House Situation Room // Washington D.C.
            </div>
        </div>
    );
};
