import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Crown, Trophy, Sparkles } from 'lucide-react';
import type { LiteraryDevice, WorkshopMode } from '../../data/virkemiddelverkstedet/types';
import { deviceColorMap } from '../../data/virkemiddelverkstedet/devices';
import { useVirkemiddelStore } from '../../stores/useVirkemiddelStore';

interface MasteryScreenProps {
    device: LiteraryDevice;
    mode: WorkshopMode;
    onBack: () => void;
}

export const MasteryScreen = ({ device, mode, onBack }: MasteryScreenProps) => {
    const colors = deviceColorMap[device.color];
    const isApply = mode === 'bruk';
    const { getDeviceProgress, getApplyDeviceProgress, addPoints, addApplyPoints } =
        useVirkemiddelStore();
    const progress = isApply
        ? getApplyDeviceProgress(device.id)
        : getDeviceProgress(device.id);

    useEffect(() => {
        // Mastery bonus
        if (isApply) {
            addApplyPoints(500);
        } else {
            addPoints(500);
        }

        // Max celebration!
        const burst = (delay: number, opts: confetti.Options) => {
            setTimeout(() => confetti(opts), delay);
        };

        burst(200, {
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5, x: 0.5 },
        });
        burst(500, {
            particleCount: 80,
            spread: 60,
            origin: { y: 0.4, x: 0.3 },
        });
        burst(700, {
            particleCount: 80,
            spread: 60,
            origin: { y: 0.4, x: 0.7 },
        });
        burst(1000, {
            particleCount: 120,
            spread: 100,
            origin: { y: 0.6, x: 0.5 },
            startVelocity: 45,
        });
        // Samme som i CompletionScreen: poengene deles ut én gang, ved mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const modeLabel = isApply ? 'bruke' : 'analysere';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
            className="max-w-md mx-auto text-center"
        >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Glowing header */}
                <div className={`${colors.light} p-10 relative overflow-hidden`}>
                    {/* Sparkle decorations */}
                    <motion.div
                        className="absolute top-4 left-8"
                        animate={{ rotate: 360, scale: [1, 1.3, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Sparkles className="w-6 h-6 text-amber-400" />
                    </motion.div>
                    <motion.div
                        className="absolute top-6 right-10"
                        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        <Sparkles className="w-5 h-5 text-amber-300" />
                    </motion.div>
                    <motion.div
                        className="absolute bottom-4 left-12"
                        animate={{ rotate: 180, scale: [1, 1.4, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    >
                        <Crown className="w-16 h-16 text-amber-500 mx-auto mb-3" />
                    </motion.div>

                    <motion.span
                        className="text-6xl block mb-3"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                    >
                        {device.emoji}
                    </motion.span>

                    <motion.h2
                        className="text-3xl font-display font-bold text-slate-900"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        {isApply ? 'Fullført!' : 'Mester!'}
                    </motion.h2>
                    <motion.p
                        className={`font-bold mt-1 ${colors.text}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        Du kan {modeLabel} {device.name}!
                    </motion.p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 rounded-xl p-3">
                            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-amber-700">
                                {progress.bestScore}
                            </p>
                            <p className="text-xs text-amber-600">Totalpoeng</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3">
                            <p className="text-2xl font-bold text-orange-700">
                                🔥 {progress.maxStreak}
                            </p>
                            <p className="text-xs text-orange-600">Beste streak</p>
                        </div>
                    </div>

                    {/* Mastery badge */}
                    <motion.div
                        className={`${colors.light} rounded-xl p-4 border-2 ${colors.border}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <p className={`font-bold ${colors.text}`}>+500 mestringsbonus!</p>
                    </motion.div>

                    <motion.button
                        onClick={onBack}
                        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                    >
                        Tilbake til oversikten
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
