import React, { useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { DIMENSIONS } from './dimensionMeta';
import { profileHref, type ProfileView } from '../../features/religion-nav/links';
import { loadVisitedDimensions } from '../../features/religion-nav/progress';

export interface SwitcherReligion {
    id: string;
    name: string;
    color?: string | null;
    /** Har religionen sju-dimensjonsdata, eller finnes den bare som leksjoner? */
    hasProfile: boolean;
}

interface ReligionSwitcherProps {
    religions: SwitcherReligion[];
    activeId: string;
    /** Linsen som skal følge med til neste profil */
    dim: string;
    /** Visningen eleven står i, så et bytte ikke kaster hen tilbake til lista */
    visning: ProfileView;
}

const RING_SIZE = 18;
const RING_RADIUS = 7;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Liten fremdriftsring: hvor mange av de sju sidene eleven har åpnet. */
const ProgressRing: React.FC<{ read: number; total: number; color: string; onDark: boolean }> = ({
    read,
    total,
    color,
    onDark,
}) => {
    const done = read >= total;
    if (done) {
        return (
            <Check
                size={14}
                strokeWidth={3}
                style={{ color: onDark ? '#ffffff' : color }}
                aria-hidden
            />
        );
    }
    return (
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden>
            <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                strokeWidth={2.5}
                stroke={onDark ? 'rgba(255,255,255,0.35)' : '#e2e8f0'}
            />
            {read > 0 && (
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    stroke={onDark ? '#ffffff' : color}
                    strokeDasharray={`${(read / total) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
            )}
        </svg>
    );
};

export const ReligionSwitcher: React.FC<ReligionSwitcherProps> = ({
    religions,
    activeId,
    dim,
    visning,
}) => {
    const location = useLocation();
    const chipRefs = useRef<(HTMLAnchorElement | null)[]>([]);

    // Leses på nytt hver gang eleven navigerer, slik at ringen vokser med en
    // gang hen kommer tilbake fra en profil hen nettopp leste.
    const visitedCounts = useMemo(() => {
        const map = new Map<string, number>();
        for (const religion of religions) {
            if (!religion.hasProfile) continue;
            map.set(religion.id, loadVisitedDimensions(religion.id).size);
        }
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [religions, location.key]);

    const onKeyDown = (event: React.KeyboardEvent) => {
        const currentIndex = religions.findIndex((r) => r.id === activeId);
        let nextIndex = -1;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % religions.length;
        if (event.key === 'ArrowLeft')
            nextIndex = (currentIndex - 1 + religions.length) % religions.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = religions.length - 1;
        if (nextIndex >= 0) {
            event.preventDefault();
            chipRefs.current[nextIndex]?.focus();
        }
    };

    return (
        <nav
            aria-label="Bytt religion"
            onKeyDown={onKeyDown}
            // Bryter i stedet for å scrolle: på 1366x768 må ingen religion
            // ligge gjemt utenfor kanten uten synlig rullefelt
            className="flex flex-wrap gap-2"
        >
            {religions.map((religion, index) => {
                const isActive = religion.id === activeId;
                const color = religion.color || '#64748b';
                const read = visitedCounts.get(religion.id) ?? 0;

                return (
                    <Link
                        key={religion.id}
                        ref={(el) => {
                            chipRefs.current[index] = el;
                        }}
                        to={profileHref(religion.id, {
                            dim,
                            // Religioner uten profildata har bare leksjoner å vise
                            visning: religion.hasProfile ? visning : 'leksjoner',
                        })}
                        aria-current={isActive ? 'page' : undefined}
                        title={
                            religion.hasProfile
                                ? `${religion.name}: ${read} av ${DIMENSIONS.length} sider lest`
                                : `${religion.name}: bare leksjoner`
                        }
                        className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border transition-all ${
                            isActive
                                ? 'text-white shadow-md'
                                : religion.hasProfile
                                  ? 'bg-white/80 text-slate-600 hover:text-slate-900 hover:shadow-sm'
                                  : 'bg-white/50 text-slate-400 hover:text-slate-600'
                        }`}
                        style={{
                            backgroundColor: isActive ? color : undefined,
                            borderColor: isActive ? color : `${color}33`,
                        }}
                    >
                        {!isActive && (
                            <span
                                aria-hidden
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: religion.hasProfile ? color : '#cbd5e1' }}
                            />
                        )}
                        {religion.name}
                        {religion.hasProfile && (
                            <ProgressRing
                                read={read}
                                total={DIMENSIONS.length}
                                color={color}
                                onDark={isActive}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
};
