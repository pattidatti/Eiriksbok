// Profildialog: velg kallenavn og avatar. Avatarer låses opp med nivå.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { AVATARS } from '../avatars';
import { useProgressStore } from '../useProgressStore';
import { levelForXp } from '../xp';

interface ProfileDialogProps {
    open: boolean;
    onClose: () => void;
}

export const ProfileDialog = ({ open, onClose }: ProfileDialogProps) => {
    const profile = useProgressStore((s) => s.profile);
    const totalXp = useProgressStore((s) => s.totalXp);
    const setNickname = useProgressStore((s) => s.setNickname);
    const setAvatar = useProgressStore((s) => s.setAvatar);
    const level = levelForXp(totalXp);

    const [name, setName] = useState(profile.nickname ?? '');

    const handleSave = () => {
        setNickname(name);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.92, y: 16, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.92, y: 16, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-display font-bold text-slate-900">
                                Profilen din
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                                aria-label="Lukk"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Kallenavn
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.slice(0, 20))}
                            placeholder="Hva skal vi kalle deg?"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />

                        <p className="text-sm font-semibold text-slate-700 mb-1.5">Avatar</p>
                        <p className="text-xs text-slate-500 mb-2">
                            Nye avatarer låses opp når du går opp i nivå.
                        </p>
                        <div className="grid grid-cols-4 gap-2 mb-5">
                            {AVATARS.map((avatar) => {
                                const isLocked = level < avatar.unlockLevel;
                                const isSelected = profile.avatarId === avatar.id;
                                return (
                                    <button
                                        key={avatar.id}
                                        disabled={isLocked}
                                        onClick={() => setAvatar(avatar.id)}
                                        title={
                                            isLocked
                                                ? `Låses opp på nivå ${avatar.unlockLevel}`
                                                : avatar.label
                                        }
                                        className={`relative aspect-square rounded-xl flex items-center justify-center text-3xl border-2 transition-all ${
                                            isSelected
                                                ? 'border-indigo-500 bg-indigo-50 scale-105'
                                                : isLocked
                                                  ? 'border-slate-100 bg-slate-50 grayscale opacity-50 cursor-not-allowed'
                                                  : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {avatar.emoji}
                                        {isLocked && (
                                            <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 bg-white rounded-md px-1 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-200">
                                                <Lock className="w-2.5 h-2.5" />
                                                {avatar.unlockLevel}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                        >
                            Lagre
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
