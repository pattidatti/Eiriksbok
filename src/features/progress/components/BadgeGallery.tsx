// Badge-galleriet: «Nærmest deg» viser de 3 utmerkelsene eleven er nærmest å
// låse opp, med fremdrift og en lenke til aktiviteten som gir fremgang.
// Resten av galleriet ligger bak en «Vis alle»-knapp. Gull-badges kan klikkes
// for å spille av feiringen på nytt - fint å vise sidemannen.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { BADGES, BADGE_TIERS, TIER_LABELS, badgeTierKey } from '../badges';
import { useCelebration } from '../useCelebration';
import type { BadgeDef, BadgeTier } from '../types';

const TIER_PILL: Record<BadgeTier, string> = {
    bronse: 'bg-orange-100 text-orange-700 border-orange-200',
    solv: 'bg-slate-100 text-slate-600 border-slate-300',
    gull: 'bg-amber-100 text-amber-700 border-amber-300',
};

// Badges låst opp de siste 48 timene får en gull-glød i galleriet.
const RECENT_MS = 48 * 60 * 60 * 1000;

interface BadgeGalleryProps {
    unlocked: Record<string, number>;
    metrics: Record<string, number>;
}

const BadgeCard = ({
    badge,
    unlocked,
    metrics,
    delay,
    now,
}: {
    badge: BadgeDef;
    unlocked: Record<string, number>;
    metrics: Record<string, number>;
    delay: number;
    now: number;
}) => {
    const value = metrics[badge.counter] ?? 0;
    const nextTierIndex = badge.tiers.findIndex((t) => value < t);
    const allDone = nextTierIndex === -1;
    const nextThreshold = allDone ? null : badge.tiers[nextTierIndex];
    const anyUnlocked = BADGE_TIERS.some((tier) => unlocked[badgeTierKey(badge.id, tier)]);
    const hasGold = Boolean(unlocked[badgeTierKey(badge.id, 'gull')]);
    const recentlyUnlocked = BADGE_TIERS.some((tier) => {
        const at = unlocked[badgeTierKey(badge.id, tier)];
        return at !== undefined && now - at < RECENT_MS;
    });
    const celebrate = useCelebration((s) => s.celebrate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, delay }}
            onClick={
                hasGold
                    ? () => celebrate({ type: 'badge-gull', title: badge.title, emoji: badge.emoji })
                    : undefined
            }
            title={hasGold ? 'Vis frem utmerkelsen' : undefined}
            className={`rounded-xl border p-3 ${
                anyUnlocked ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-100 bg-slate-50/60'
            } ${hasGold ? 'cursor-pointer transition-shadow hover:shadow-md' : ''} ${
                recentlyUnlocked ? 'ring-2 ring-amber-300/80 shadow-lg shadow-amber-200/50' : ''
            }`}
        >
            <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-2xl ${anyUnlocked ? '' : 'grayscale opacity-40'}`}>
                    {badge.emoji}
                </span>
                <p className="text-sm font-bold text-slate-800 leading-tight">{badge.title}</p>
            </div>
            <p className="text-[11px] text-slate-500 mb-2 leading-snug">
                {badge.description.replace('{n}', String(nextThreshold ?? badge.tiers[2]))}
            </p>
            <div className="flex items-center gap-1 mb-1.5">
                {BADGE_TIERS.map((tier) => {
                    const isUnlocked = Boolean(unlocked[badgeTierKey(badge.id, tier)]);
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
                        style={{ width: `${Math.min(100, (value / nextThreshold) * 100)}%` }}
                    />
                </div>
            )}
            {allDone && <p className="text-[10px] font-bold text-amber-600">⭐ Alle trinn fullført!</p>}
        </motion.div>
    );
};

export const BadgeGallery = ({ unlocked, metrics }: BadgeGalleryProps) => {
    const unlockedCount = Object.keys(unlocked).length;
    const totalCount = BADGES.length * 3;
    const [showAll, setShowAll] = useState(false);
    // Snapshot av «nå» per mount - godt nok for 48-timers-gløden.
    const [now] = useState(() => Date.now());

    // De nærmeste badgene: størst andel fremgang mot neste trinn (men ikke
    // ferdige). Disse får fremdriftsbar + CTA til aktiviteten som teller.
    const nearest = BADGES.map((badge) => {
        const value = metrics[badge.counter] ?? 0;
        const nextTierIndex = badge.tiers.findIndex((t) => value < t);
        if (nextTierIndex === -1) return null;
        const nextThreshold = badge.tiers[nextTierIndex];
        return { badge, value, nextThreshold, ratio: value / nextThreshold };
    })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 3);

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-slate-900">Utmerkelser</h2>
                <p className="text-xs text-slate-500">
                    {unlockedCount} av {totalCount}
                </p>
            </div>

            {nearest.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">
                        Nærmest deg
                    </p>
                    <div className="space-y-2">
                        {nearest.map(({ badge, value, nextThreshold }, i) => (
                            <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 320,
                                    damping: 26,
                                    delay: i * 0.05,
                                }}
                                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                            >
                                <span className="text-2xl shrink-0">{badge.emoji}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="truncate text-sm font-bold text-slate-800">
                                            {badge.title}
                                        </p>
                                        <p className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                                            {value}/{nextThreshold}
                                        </p>
                                    </div>
                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-indigo-400"
                                            style={{
                                                width: `${Math.min(100, (value / nextThreshold) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <Link
                                    to={badge.actionLink}
                                    className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 no-underline transition-colors hover:bg-indigo-100"
                                >
                                    {badge.actionLabel}
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={() => setShowAll((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-100 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
                {showAll ? 'Skjul alle' : `Vis alle ${BADGES.length} utmerkelser`}
                <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence initial={false}>
                {showAll && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-3">
                            {BADGES.map((badge, i) => (
                                <BadgeCard
                                    key={badge.id}
                                    badge={badge}
                                    unlocked={unlocked}
                                    metrics={metrics}
                                    delay={i * 0.03}
                                    now={now}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
