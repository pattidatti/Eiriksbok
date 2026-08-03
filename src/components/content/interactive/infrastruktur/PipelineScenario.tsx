import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    title?: string;
    intro?: string;
}

type Choice = {
    id: string;
    text: string;
    consequence: string;
    effects: { economy: number; security: number; popularity: number };
};

type Stage = {
    situation: string;
    choices: Choice[];
};

const STAGES: Stage[] = [
    {
        situation:
            'Januar 2022. Russland har samlet 100 000 soldater ved Ukrainas grense. Din rådgiver sier: "Putin truer med å kutte gassforsyningen hvis vi støtter Ukraina. Vi får 40 % av gassen vår fra Russland. Det er midtvinter."',
        choices: [
            {
                id: 'diversify',
                text: 'Signer hastekontrakter med norske og algeriske gass-leverandører',
                consequence:
                    'Du får dyrere gass, men minsker avhengigheten. Russland er misfornøyd. Energiregningene for befolkningen stiger 35 %. Næringslivet klager.',
                effects: { economy: -2, security: 3, popularity: -1 },
            },
            {
                id: 'appease',
                text: 'Hold deg nøytral. Ikke si noe om Ukraina',
                consequence:
                    'Gassen fortsetter å flyte. Men allierte er skuffet. Ukraina tolker det som svik. Pressen angriper deg for feighet.',
                effects: { economy: 1, security: -2, popularity: -2 },
            },
            {
                id: 'lng',
                text: 'Bestill fem LNG-skip fra USA umiddelbart',
                consequence:
                    'Det tar tre måneder å sette i gang. Denne vinteren må du uansett betale russisk pris. Men til neste vinter har du et alternativ. Kostbart, men klokt.',
                effects: { economy: -1, security: 2, popularity: 0 },
            },
        ],
    },
    {
        situation:
            'September 2022. Nord Stream 1 og 2 eksploderer i Østersjøen. Russland er nå ute av bildet som energileverandør. Du mangler 20 % av energibehovet for vinteren. Det er tre måneder til frost.',
        choices: [
            {
                id: 'save',
                text: 'Innfør energirasjonering: industri ned 20 %, boliger ned 10 %',
                consequence:
                    'Tøft men effektivt. Store bedrifter stenger midlertidig. Arbeidsledigheten stiger. Noen mennesker fryser. Men strømnettverket holder.',
                effects: { economy: -3, security: 2, popularity: -3 },
            },
            {
                id: 'nuclear',
                text: 'Åpne igjen ett gammelt atomkraftverk',
                consequence:
                    'Politisk kontroversielt. Tar uker å restarte. Miljøpartiet forlater koalisjonen. Men du klarer vinteren uten rasjonering.',
                effects: { economy: 1, security: 3, popularity: -1 },
            },
            {
                id: 'coal',
                text: 'Kjøp kullfraktskontrakter fra Australia',
                consequence:
                    'Raskt og billig på kort sikt. CO₂-utslippene spretter. EU er sint. Grønne velgere forlater deg. Men lyser er på.',
                effects: { economy: 0, security: 1, popularity: -2 },
            },
        ],
    },
];

// Modulnivå, ikke inne i PipelineScenario: en komponent som defineres på nytt
// hver render får ny identitet, og React remonterer baren i stedet for å
// animere bredden — nettopp overgangen denne komponenten finnes for å vise.
const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-2 text-xs">
        <span className="w-20 text-slate-400 text-right">{label}</span>
        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
            <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                    width: `${value * 10}%`,
                    backgroundColor: value >= 6 ? '#4ade80' : value >= 4 ? '#facc15' : '#f87171',
                }}
            />
        </div>
        <span className="w-4 text-slate-400">{value}</span>
    </div>
);

export function PipelineScenario({ title, intro }: Props) {
    const [stage, setStage] = useState(0);
    const [chosen, setChosen] = useState<Choice | null>(null);
    const [scores, setScores] = useState({ economy: 5, security: 5, popularity: 5 });
    const [done, setDone] = useState(false);

    const currentStage = STAGES[stage];

    function handleChoice(choice: Choice) {
        setChosen(choice);
        setScores((s) => ({
            economy: Math.max(0, Math.min(10, s.economy + choice.effects.economy)),
            security: Math.max(0, Math.min(10, s.security + choice.effects.security)),
            popularity: Math.max(0, Math.min(10, s.popularity + choice.effects.popularity)),
        }));
    }

    function next() {
        if (stage + 1 >= STAGES.length) {
            setDone(true);
        } else {
            setStage((s) => s + 1);
            setChosen(null);
        }
    }

    return (
        <div className="my-6 rounded-xl border border-amber-500/30 bg-slate-900/80 overflow-hidden">
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3">
                <h4 className="font-bold text-amber-300 text-sm">{title ?? 'Energiminister-dilemmaet'}</h4>
                {intro && !stage && <p className="text-xs text-slate-400 mt-1">{intro}</p>}
            </div>

            <div className="p-4">
                {/* Score bars */}
                <div className="mb-4 space-y-1.5 bg-slate-800/50 rounded-lg p-3">
                    <ScoreBar label="Økonomi" value={scores.economy} />
                    <ScoreBar label="Sikkerhet" value={scores.security} />
                    <ScoreBar label="Popularitet" value={scores.popularity} />
                </div>

                {done ? (
                    <div className="text-center py-4">
                        <div className="text-2xl mb-2">🏛️</div>
                        <h5 className="font-bold text-white mb-2">Mandatperioden er over</h5>
                        <p className="text-sm text-slate-400">
                            Økonomi {scores.economy}/10 · Sikkerhet {scores.security}/10 · Popularitet {scores.popularity}/10
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Det finnes ingen perfekte svar i energipolitikk. Hvert valg har sine kostnader.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-3 text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3 leading-relaxed">
                            {currentStage.situation}
                        </div>

                        <AnimatePresence mode="wait">
                            {!chosen ? (
                                <motion.div key="choices" className="space-y-2">
                                    {currentStage.choices.map((choice) => (
                                        <button
                                            key={choice.id}
                                            onClick={() => handleChoice(choice)}
                                            className="w-full text-left text-sm px-3 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
                                        >
                                            {choice.text}
                                        </button>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="consequence"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-800/80 rounded-lg p-3"
                                >
                                    <p className="text-xs font-semibold text-amber-400 mb-1">Konsekvens:</p>
                                    <p className="text-sm text-slate-300 mb-3">{chosen.consequence}</p>
                                    <button
                                        onClick={next}
                                        className="text-xs bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors"
                                    >
                                        {stage + 1 >= STAGES.length ? 'Se resultat' : 'Neste dilemma →'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </div>
    );
}
