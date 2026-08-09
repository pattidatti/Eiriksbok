import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Star, ArrowRight, RotateCcw } from 'lucide-react';
import type { LiteraryDevice, Level, ApplyLevel, WorkshopMode } from '../../data/virkemiddelverkstedet/types';
import { deviceColorMap } from '../../data/virkemiddelverkstedet/devices';
import { getLevelExerciseCount } from '../../data/virkemiddelverkstedet/exercises';
import { getApplyLevelExerciseCount } from '../../data/virkemiddelverkstedet/exercises/apply';
import { getLevelName, getApplyLevelName } from '../../data/virkemiddelverkstedet/levels';
import { useVirkemiddelStore } from '../../stores/useVirkemiddelStore';

interface CompletionScreenProps {
    device: LiteraryDevice;
    level: Level | ApplyLevel;
    score: number;
    mode: WorkshopMode;
    onNextLevel: () => void;
    onRetry: () => void;
    onBack: () => void;
}

export const CompletionScreen = ({
    device,
    level,
    score,
    mode,
    onNextLevel,
    onRetry,
    onBack,
}: CompletionScreenProps) => {
    const colors = deviceColorMap[device.color];
    const isApply = mode === 'bruk';
    const {
        getDeviceProgress,
        getApplyDeviceProgress,
        unlockLevel,
        unlockApplyLevel,
        addPoints,
        addApplyPoints,
    } = useVirkemiddelStore();
    const progress = isApply
        ? getApplyDeviceProgress(device.id)
        : getDeviceProgress(device.id);

    const totalExercises = isApply
        ? getApplyLevelExerciseCount(device.id, level as ApplyLevel)
        : getLevelExerciseCount(device.id, level as Level);
    const maxPossible = totalExercises * 150;
    const percentage = maxPossible > 0 ? (score / maxPossible) * 100 : 0;
    const stars = percentage >= 80 ? 3 : percentage >= 50 ? 2 : 1;

    const maxLevel = isApply ? 3 : 10;
    const hasNextLevel = level < maxLevel;
    const nextLevelUnlocked = level < maxLevel && progress.levelUnlocked >= level + 1;

    const levelName = isApply
        ? getApplyLevelName(level as ApplyLevel)
        : getLevelName(level as Level);

    useEffect(() => {
        // Unlock next level when player earns 2+ stars
        if (hasNextLevel && stars >= 2) {
            if (isApply) {
                unlockApplyLevel(device.id, (level + 1) as Exclude<Level, 1>);
            } else {
                unlockLevel(device.id, (level + 1) as Exclude<Level, 1>);
            }
        }

        // Level completion bonus
        if (isApply) {
            addApplyPoints(200);
        } else {
            addPoints(200);
        }

        const timer = setTimeout(() => {
            confetti({
                particleCount: 80 + stars * 40,
                spread: 70,
                origin: { y: 0.6 },
            });
        }, 300);

        return () => clearTimeout(timer);
        // Skal kjøre NØYAKTIG én gang, når fullført-skjermen dukker opp. Tar vi
        // inn poeng-funksjonene og nivå-verdiene i dep-lista, deles bonusen ut
        // på nytt hver gang en av dem får ny identitet - eleven kan da farme
        // poeng ved å bli stående på skjermen.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
        >
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className={`${colors.light} p-8`}>
                    <span className="text-5xl mb-3 block">{device.emoji}</span>

                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">
                        Nivå {level} fullført!
                    </h2>
                    <p className="text-slate-500">
                        {device.name} - {levelName}
                        {isApply && (
                            <span className="text-indigo-500 ml-1">(Bruk)</span>
                        )}
                    </p>

                    {/* Stars */}
                    <div className="flex justify-center gap-2 mt-4">
                        {[1, 2, 3].map((s) => (
                            <motion.div
                                key={s}
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    delay: 0.3 + s * 0.15,
                                    type: 'spring',
                                    stiffness: 200,
                                }}
                            >
                                <Star
                                    className={`w-10 h-10 ${
                                        s <= stars
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-slate-300'
                                    }`}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Score */}
                    <div className="bg-amber-50 rounded-xl p-4">
                        <p className="text-sm text-amber-600 font-medium">Poeng denne runden</p>
                        <p className="text-3xl font-bold text-amber-700">{score}</p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        {hasNextLevel && (
                            <motion.button
                                onClick={onNextLevel}
                                disabled={!nextLevelUnlocked && stars < 2}
                                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Neste nivå <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        )}

                        <button
                            onClick={onRetry}
                            className="w-full py-3 px-6 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" /> Prøv igjen
                        </button>

                        <button
                            onClick={onBack}
                            className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Tilbake til oversikten
                        </button>
                    </div>

                    {stars < 2 && hasNextLevel && (
                        <p className="text-xs text-slate-400">
                            Få minst 2 stjerner for å låse opp neste nivå.
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
