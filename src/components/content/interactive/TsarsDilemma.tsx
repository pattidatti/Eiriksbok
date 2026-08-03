
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Flame, Snowflake, RefreshCw } from 'lucide-react';
import { scatter } from '../../../utils/random';

// Snøfnuggene er rent dekorative og endrer seg aldri — regn dem ut én gang på
// modulnivå i stedet for på hver render.
const SNOWFLAKES = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${scatter(i, 1) * 100}%`,
    delay: scatter(i, 2) * 5,
    duration: 5 + scatter(i, 3) * 5,
}));

interface Outcome {
    text: string;
    loyalty: number;
    anger: number;
}

interface Scenario {
    id: string;
    title: string;
    description: string;
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
        id: 'boots',
        title: 'Vinteren 1916',
        description: 'Soldatene ved fronten mangler støvler. Mange fryser i hjel. Generalene krever penger fra statskassen for å kjøpe utstyr.',
        choiceA: {
            label: 'Kjøp utstyr (Tøm statskassen)',
            outcome: { text: 'Hæren takker deg, men adelen murrer over pengebruken.', loyalty: 10, anger: 0 }
        },
        choiceB: {
            label: 'Be dem ofre seg for Russland',
            outcome: { text: 'Soldatene føler seg sviktet. Moral faller.', loyalty: -15, anger: 5 }
        }
    },
    {
        id: 'bread',
        title: 'Brødkøer i Petrograd',
        description: 'Tusenvis av kvinner demonstrerer i gatene. De roper "Brød!" og "Ned med Tsaren!". Politiet ber om ordre.',
        choiceA: {
            label: 'Send kosakkene for å rydde opp',
            outcome: { text: 'Blodbad i gatene. Folket er i sjokk og raseri.', loyalty: -5, anger: 25 }
        },
        choiceB: {
            label: 'Ignorer dem (Det går over)',
            outcome: { text: 'Demonstrasjonene vokser. Soldater slutter seg til dem.', loyalty: -10, anger: 15 }
        }
    },
    {
        id: 'rasputin',
        title: 'Rasputins Råd',
        description: 'Den mystiske munken Rasputin hevder han har guds ord. Han vil at du skal sparke din dyktigste general og innsette hans venn.',
        choiceA: {
            label: 'Gjør som Rasputin sier',
            outcome: { text: 'Generalene er rasende. Rykter om skandale sprer seg.', loyalty: -20, anger: 10 }
        },
        choiceB: {
            label: 'Send Rasputin vekk',
            outcome: { text: 'Din kone (Tsarinaen) er knust, men hæren er lettet.', loyalty: 5, anger: 0 }
        }
    },
    {
        id: 'front',
        title: 'Fronten Kollapser',
        description: 'Tyske styrker rykker frem. Rådgiverne dine er uenige om hvor du bør være.',
        choiceA: {
            label: 'Dra til fronten for å lede',
            outcome: { text: 'Du får skylden for alle tap. Regjeringen i byen mister kontrollen.', loyalty: -10, anger: 10 }
        },
        choiceB: {
            label: 'Bli i palasset',
            outcome: { text: 'Folket ser på deg som en feiging som gjemmer seg.', loyalty: -5, anger: 15 }
        }
    }
];

const TsarsDilemma: React.FC = () => {
    const [loyalty, setLoyalty] = useState(70);
    const [anger, setAnger] = useState(20);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lastOutcome, setLastOutcome] = useState<string | null>(null);

    // Utledet, ikke egen state: utfallet følger alltid direkte av målerne og hvor
    // langt eleven har kommet. Revolusjon slår abdikasjon, slik det gjorde før.
    const gameState: 'playing' | 'abdicated' | 'revolution' | 'survived' =
        anger >= 100
            ? 'revolution'
            : loyalty <= 0
              ? 'abdicated'
              : currentIndex >= scenarios.length
                ? 'survived'
                : 'playing';

    const handleChoice = (outcome: Outcome) => {
        setLoyalty(prev => Math.min(100, Math.max(0, prev + outcome.loyalty)));
        setAnger(prev => Math.min(100, Math.max(0, prev + outcome.anger)));
        setLastOutcome(outcome.text);

        setTimeout(() => {
            setLastOutcome(null);
            setCurrentIndex(prev => prev + 1);
        }, 4500);
    };

    const resetGame = () => {
        setLoyalty(70);
        setAnger(20);
        setCurrentIndex(0);
        setLastOutcome(null);
    };

    return (
        <div className="w-full my-12 font-serif relative overflow-hidden rounded-xl border-4 border-double border-amber-600/50 shadow-2xl bg-[#2a0a0a] min-h-[500px] text-amber-50">
            {/* Background Texture & Snow */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
            />
            {SNOWFLAKES.map(flake => (
                <motion.div
                    key={flake.id}
                    className="absolute top-0 text-white/30 pointer-events-none"
                    style={{ left: flake.left }}
                    animate={{ y: [0, 500], opacity: [0, 1, 0] }}
                    transition={{ duration: flake.duration, repeat: Infinity, delay: flake.delay, ease: "linear" }}
                >
                    <Snowflake size={10} />
                </motion.div>
            ))}

            <div className="relative z-10 p-6 flex flex-col items-center h-full justify-between">

                {/* Meters */}
                <div className="w-full grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/40 p-3 rounded border border-amber-900/50 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1 text-sm uppercase tracking-widest text-amber-200">
                            <Crown className="w-4 h-4" /> Hæren
                        </div>
                        <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-amber-500"
                                animate={{ width: `${loyalty}%` }}
                                transition={{ type: 'spring' }}
                            />
                        </div>
                    </div>
                    <div className="bg-black/40 p-3 rounded border border-amber-900/50 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1 text-sm uppercase tracking-widest text-red-200">
                            <Flame className="w-4 h-4" /> Folket
                        </div>
                        <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-red-600"
                                animate={{ width: `${anger}%` }}
                                transition={{ type: 'spring' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow flex items-center justify-center w-full max-w-md relative">
                    <AnimatePresence mode='wait'>
                        {gameState !== 'playing' ? (
                            <motion.div
                                key="gameover"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#1a0505] border-2 border-amber-700 p-8 rounded-lg text-center shadow-2xl"
                            >
                                <h3 className="text-3xl font-bold mb-4 font-serif text-amber-500 uppercase">
                                    {gameState === 'abdicated' && "Abdisert"}
                                    {gameState === 'revolution' && "Revolusjon!"}
                                    {gameState === 'survived' && "Historien Endret?"}
                                </h3>
                                <p className="mb-6 text-stone-300 italic">
                                    {gameState === 'abdicated' && "Hæren nektet å adlyde dine ordre. Du ble tvunget til å gå av, alene og forlatt på et togspor."}
                                    {gameState === 'revolution' && "Folket stormet palasset. Dine vakter la ned våpnene. Romanov-dynastiet er falt."}
                                    {gameState === 'survived' && "Du klarte det tsaren ikke klarte: Å overleve til 1918. Men stormen er ikke over..."}
                                </p>
                                <button
                                    onClick={resetGame}
                                    className="flex items-center gap-2 mx-auto px-6 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded uppercase tracking-widest font-bold text-sm transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" /> Prøv igjen
                                </button>
                            </motion.div>
                        ) : lastOutcome ? (
                            <motion.div
                                key="outcome"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-center p-6 bg-black/60 backdrop-blur rounded-lg border border-amber-500/30"
                            >
                                <p className="text-xl italic font-serif leading-relaxed text-amber-100">
                                    "{lastOutcome}"
                                </p>
                            </motion.div>
                        ) : currentIndex < scenarios.length ? (
                            <motion.div
                                key={scenarios[currentIndex].id}
                                initial={{ x: 300, opacity: 0, rotate: 10 }}
                                animate={{ x: 0, opacity: 1, rotate: 0 }}
                                exit={{ x: -300, opacity: 0, rotate: -10 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="bg-[#f5e6d3] text-stone-900 p-6 rounded shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-double border-amber-700 w-full relative"
                            >
                                {/* Papirtekstur lå her, men aged-paper.png på
                                    transparenttextures.com svarer 404. Laget var
                                    tomt og kostet kun et bomkall over skolenettet. */}

                                <div className="relative z-10 text-center">
                                    <div className="mb-4 flex justify-center text-amber-800 opacity-50">
                                        <Crown className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 uppercase tracking-wide border-b border-stone-400 pb-2">
                                        {scenarios[currentIndex].title}
                                    </h3>
                                    <p className="mb-8 font-serif text-lg leading-relaxed">
                                        {scenarios[currentIndex].description}
                                    </p>

                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => handleChoice(scenarios[currentIndex].choiceA.outcome)}
                                            className="p-3 border-2 border-stone-800 rounded hover:bg-stone-800 hover:text-amber-50 transition-all font-bold text-sm uppercase tracking-wide"
                                        >
                                            {scenarios[currentIndex].choiceA.label}
                                        </button>
                                        <div className="text-xs text-stone-500 font-serif italic">- ELLER -</div>
                                        <button
                                            onClick={() => handleChoice(scenarios[currentIndex].choiceB.outcome)}
                                            className="p-3 border-2 border-stone-800 rounded hover:bg-stone-800 hover:text-amber-50 transition-all font-bold text-sm uppercase tracking-wide"
                                        >
                                            {scenarios[currentIndex].choiceB.label}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                <div className="text-center mt-4 opacity-50 text-xs font-mono uppercase">
                    Petrograd, Russland | {1916 + Math.floor(currentIndex / 2)}
                </div>
            </div>
        </div>
    );
};

export default TsarsDilemma;
