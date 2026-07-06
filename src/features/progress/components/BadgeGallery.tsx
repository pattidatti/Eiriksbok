// Badge-galleriet: alle utmerkelser med bronse/sølv/gull-trinn og
// fremdrift mot neste trinn.

import { BADGES, BADGE_TIERS, TIER_LABELS, badgeTierKey } from '../badges';
import type { BadgeTier } from '../types';

const TIER_PILL: Record<BadgeTier, string> = {
    bronse: 'bg-orange-100 text-orange-700 border-orange-200',
    solv: 'bg-slate-100 text-slate-600 border-slate-300',
    gull: 'bg-amber-100 text-amber-700 border-amber-300',
};

interface BadgeGalleryProps {
    unlocked: Record<string, number>;
    metrics: Record<string, number>;
}

export const BadgeGallery = ({ unlocked, metrics }: BadgeGalleryProps) => {
    const unlockedCount = Object.keys(unlocked).length;
    const totalCount = BADGES.length * 3;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-slate-900">Utmerkelser</h2>
                <p className="text-xs text-slate-500">
                    {unlockedCount} av {totalCount}
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {BADGES.map((badge) => {
                    const value = metrics[badge.counter] ?? 0;
                    const nextTierIndex = badge.tiers.findIndex((t) => value < t);
                    const allDone = nextTierIndex === -1;
                    const nextThreshold = allDone ? null : badge.tiers[nextTierIndex];
                    const anyUnlocked = BADGE_TIERS.some(
                        (tier) => unlocked[badgeTierKey(badge.id, tier)]
                    );

                    return (
                        <div
                            key={badge.id}
                            className={`rounded-xl border p-3 ${
                                anyUnlocked
                                    ? 'border-indigo-100 bg-indigo-50/40'
                                    : 'border-slate-100 bg-slate-50/60'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span
                                    className={`text-2xl ${anyUnlocked ? '' : 'grayscale opacity-40'}`}
                                >
                                    {badge.emoji}
                                </span>
                                <p className="text-sm font-bold text-slate-800 leading-tight">
                                    {badge.title}
                                </p>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-2 leading-snug">
                                {badge.description.replace(
                                    '{n}',
                                    String(nextThreshold ?? badge.tiers[2])
                                )}
                            </p>
                            <div className="flex items-center gap-1 mb-1.5">
                                {BADGE_TIERS.map((tier) => {
                                    const isUnlocked = Boolean(
                                        unlocked[badgeTierKey(badge.id, tier)]
                                    );
                                    return (
                                        <span
                                            key={tier}
                                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border ${
                                                isUnlocked
                                                    ? TIER_PILL[tier]
                                                    : 'bg-white text-slate-300 border-slate-100'
                                            }`}
                                        >
                                            {TIER_LABELS[tier]}
                                        </span>
                                    );
                                })}
                            </div>
                            {!allDone && nextThreshold !== null && (
                                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-indigo-400"
                                        style={{
                                            width: `${Math.min(100, (value / nextThreshold) * 100)}%`,
                                        }}
                                    />
                                </div>
                            )}
                            {allDone && (
                                <p className="text-[10px] font-bold text-amber-600">
                                    ⭐ Alle trinn fullført!
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
