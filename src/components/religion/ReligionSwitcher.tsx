import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, ChevronDown, MoreHorizontal } from 'lucide-react';
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
    /**
     * `rail` viser religionene som piller med fremdriftsring - riktig i
     * profilvisning, der ringene måler nettopp det eleven ser på.
     * `compact` viser én knapp som åpner de samme religionene i et panel.
     * Brukes i leksjonsvisning, der en full pillerad både brekker over to
     * linjer og lover en fremdrift som ikke handler om leksjoner.
     */
    variant?: 'rail' | 'compact';
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

/** Rad i panelet: samme innhold som en pille, men stablet under hverandre. */
const PanelRow: React.FC<{
    religion: SwitcherReligion;
    isActive: boolean;
    read: number;
    href: string;
    onNavigate: () => void;
}> = ({ religion, isActive, read, href, onNavigate }) => {
    const color = religion.color || '#64748b';
    return (
        <Link
            to={href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
            <span
                aria-hidden
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: religion.hasProfile ? color : '#cbd5e1' }}
            />
            <span className="flex-1 min-w-0 truncate">{religion.name}</span>
            {religion.hasProfile ? (
                read > 0 ? (
                    <ProgressRing read={read} total={DIMENSIONS.length} color={color} onDark={false} />
                ) : null
            ) : (
                <span className="text-[11px] font-medium text-slate-400">bare leksjoner</span>
            )}
        </Link>
    );
};

export const ReligionSwitcher: React.FC<ReligionSwitcherProps> = ({
    religions,
    activeId,
    dim,
    visning,
    variant = 'rail',
}) => {
    const location = useLocation();
    const chipRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

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

    const hrefFor = (religion: SwitcherReligion) =>
        profileHref(religion.id, {
            dim,
            // Religioner uten profildata har bare leksjoner å vise
            visning: religion.hasProfile ? visning : 'leksjoner',
        });

    // Railen viser bare religionene med profil. De to som bare har leksjoner
    // ville presset raden over på en ny linje for en lenke som uansett fører
    // et annet sted - de bor bak «+N flere».
    const railReligions = religions.filter((r) => r.hasProfile || r.id === activeId);
    const overflowReligions = religions.filter((r) => !railReligions.includes(r));

    // Escape lukker panelet, og et klikk utenfor gjør det samme
    useEffect(() => {
        if (!panelOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setPanelOpen(false);
                triggerRef.current?.focus();
            }
        };
        const onClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            setPanelOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClick);
        };
    }, [panelOpen]);

    const active = religions.find((r) => r.id === activeId);
    const activeColor = active?.color || '#64748b';

    const panel = (
        <div
            ref={panelRef}
            className="absolute z-30 mt-2 w-64 max-h-[60vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-lg p-1.5"
        >
            {religions.map((religion) => (
                <PanelRow
                    key={religion.id}
                    religion={religion}
                    isActive={religion.id === activeId}
                    read={visitedCounts.get(religion.id) ?? 0}
                    href={hrefFor(religion)}
                    onNavigate={() => setPanelOpen(false)}
                />
            ))}
        </div>
    );

    if (variant === 'compact') {
        return (
            <div className="relative inline-block">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setPanelOpen((open) => !open)}
                    aria-expanded={panelOpen}
                    aria-haspopup="menu"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all"
                >
                    <span
                        aria-hidden
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: activeColor }}
                    />
                    {active?.name ?? 'Velg religion'}
                    <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${panelOpen ? 'rotate-180' : ''}`}
                    />
                </button>
                {panelOpen && panel}
            </div>
        );
    }

    const onKeyDown = (event: React.KeyboardEvent) => {
        const currentIndex = railReligions.findIndex((r) => r.id === activeId);
        let nextIndex = -1;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % railReligions.length;
        if (event.key === 'ArrowLeft')
            nextIndex = (currentIndex - 1 + railReligions.length) % railReligions.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = railReligions.length - 1;
        if (nextIndex >= 0) {
            event.preventDefault();
            chipRefs.current[nextIndex]?.focus();
        }
    };

    return (
        <div className="relative">
            <nav
                aria-label="Bytt religion"
                onKeyDown={onKeyDown}
                // Bryter i stedet for å scrolle: på 1366x768 må ingen religion
                // ligge gjemt utenfor kanten uten synlig rullefelt. Med bare de
                // ni profilene på raden holder det på én linje.
                className="flex flex-wrap gap-1.5"
            >
                {railReligions.map((religion, index) => {
                    const isActive = religion.id === activeId;
                    const color = religion.color || '#64748b';
                    const read = visitedCounts.get(religion.id) ?? 0;

                    return (
                        <Link
                            key={religion.id}
                            ref={(el) => {
                                chipRefs.current[index] = el;
                            }}
                            to={hrefFor(religion)}
                            aria-current={isActive ? 'page' : undefined}
                            title={
                                religion.hasProfile
                                    ? `${religion.name}: ${read} av ${DIMENSIONS.length} sider lest`
                                    : `${religion.name}: bare leksjoner`
                            }
                            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-bold border transition-all ${
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
                                    style={{
                                        backgroundColor: religion.hasProfile ? color : '#cbd5e1',
                                    }}
                                />
                            )}
                            {religion.name}
                            {/* Tom ring sier ingenting og gjør raden bredere.
                                Den dukker opp så snart eleven har lest noe. */}
                            {religion.hasProfile && read > 0 && (
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

                {overflowReligions.length > 0 && (
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={() => setPanelOpen((open) => !open)}
                        aria-expanded={panelOpen}
                        aria-haspopup="menu"
                        title={overflowReligions.map((r) => r.name).join(', ')}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm font-bold border border-slate-200 bg-white/70 text-slate-500 hover:text-slate-700 hover:shadow-sm transition-all"
                    >
                        <MoreHorizontal size={16} />+{overflowReligions.length}
                    </button>
                )}
            </nav>
            {panelOpen && panel}
        </div>
    );
};
