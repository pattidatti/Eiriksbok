import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone,
    Cpu,
    BatteryFull,
    MonitorSmartphone,
    MapPin,
    Check,
    RotateCcw,
    Scissors,
    Lightbulb,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå at mobilen i
// lomma er multipolaritet i praksis. Fire deler kommer fra fire ulike
// maktsentre, og ingen enkelt makt kontrollerer alt sammen. Men én makt KAN
// stanse deler av mobilen - som når Kina stopper eksporten av sjeldne
// jordarter. Flere poler betyr at alle er avhengige av hverandre.

interface MobilensVerdenskartProps {
    title?: string;
}

type PartId = 'skjerm' | 'apper' | 'brikke' | 'batteri';
type RegionId = 'kina' | 'taiwan' | 'kongo' | 'usa';

interface PhonePart {
    id: PartId;
    label: string;
    sub: string;
    icon: LucideIcon | null; // null = appene tegner sitt eget app-rutenett
    color: string;
    iconClass: string;
    bandY: number;
}

const BAND_X = 68;
const BAND_W = 108;
const BAND_H = 68;
const THREAD_START_X = 196;
const CARD_X = 384;
const CARD_W = 248;
const CARD_H = 74;

const PARTS: PhonePart[] = [
    {
        id: 'skjerm',
        label: 'Skjermen',
        sub: 'sjeldne jordarter',
        icon: MonitorSmartphone,
        color: '#0ea5e9',
        iconClass: 'text-sky-600',
        bandY: 38,
    },
    {
        id: 'apper',
        label: 'Appene',
        sub: 'programvare',
        icon: null,
        color: '#8b5cf6',
        iconClass: 'text-violet-600',
        bandY: 114,
    },
    {
        id: 'brikke',
        label: 'Databrikken',
        sub: 'hjernen i mobilen',
        icon: Cpu,
        color: '#f59e0b',
        iconClass: 'text-amber-600',
        bandY: 190,
    },
    {
        id: 'batteri',
        label: 'Batteriet',
        sub: 'kobolt og litium',
        icon: BatteryFull,
        color: '#10b981',
        iconClass: 'text-emerald-600',
        bandY: 266,
    },
];

interface Region {
    id: RegionId;
    name: string;
    resource: string;
    partId: PartId;
    fact: string;
    centerY: number;
}

const REGIONS: Region[] = [
    {
        id: 'taiwan',
        name: 'Taiwan',
        resource: 'databrikker',
        partId: 'brikke',
        fact: 'De mest avanserte databrikkene i verden lages på Taiwan.',
        centerY: 57,
    },
    {
        id: 'usa',
        name: 'USA',
        resource: 'programvare og apper',
        partId: 'apper',
        fact: 'Programvaren og de fleste store appene kommer fra amerikanske selskaper.',
        centerY: 147,
    },
    {
        id: 'kina',
        name: 'Kina',
        resource: 'sjeldne jordarter',
        partId: 'skjerm',
        fact: 'Nesten alle sjeldne jordarter renses i Kina.',
        centerY: 237,
    },
    {
        id: 'kongo',
        name: 'Kongo og Sør-Amerika',
        resource: 'kobolt og litium',
        partId: 'batteri',
        fact: 'Kobolt fra Kongo og litium fra Sør-Amerika driver batteriet ditt.',
        centerY: 327,
    },
];

const APP_COLORS = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

const partCenterY = (part: PhonePart) => part.bandY + BAND_H / 2;

const threadPath = (fromY: number, toY: number) =>
    `M ${THREAD_START_X} ${fromY} C 285 ${fromY}, 295 ${toY}, ${CARD_X - 2} ${toY}`;

export function MobilensVerdenskart({
    title = 'Verdenspolitikk i lomma di',
}: MobilensVerdenskartProps) {
    const [selected, setSelected] = useState<PartId | null>(null);
    const [connectedParts, setConnectedParts] = useState<PartId[]>([]);
    const [lastConnected, setLastConnected] = useState<RegionId | null>(null);
    const [lastFact, setLastFact] = useState<string | null>(null);
    const [wrongFlash, setWrongFlash] = useState<RegionId | null>(null);
    const [wrongMsg, setWrongMsg] = useState(false);
    const [crisisOn, setCrisisOn] = useState(false);
    const [triedCrisis, setTriedCrisis] = useState(false);

    const allConnected = connectedParts.length === PARTS.length;
    const complete = allConnected && triedCrisis;
    const selectedPart = PARTS.find((p) => p.id === selected) ?? null;

    useEffect(() => {
        if (!wrongFlash) return;
        const t = setTimeout(() => setWrongFlash(null), 700);
        return () => clearTimeout(t);
    }, [wrongFlash]);

    const handlePartClick = (id: PartId) => {
        if (connectedParts.includes(id)) return;
        setSelected((prev) => (prev === id ? null : id));
        setWrongMsg(false);
    };

    const handleRegionClick = (region: Region) => {
        if (connectedParts.includes(region.partId)) return;
        if (!selected) return;
        if (region.partId === selected) {
            setConnectedParts((prev) => [...prev, region.partId]);
            setLastConnected(region.id);
            setLastFact(region.fact);
            setSelected(null);
            setWrongMsg(false);
        } else {
            setWrongFlash(region.id);
            setWrongMsg(true);
        }
    };

    const handleCrisisToggle = () => {
        setCrisisOn((v) => !v);
        setTriedCrisis(true);
    };

    const handleReset = () => {
        setSelected(null);
        setConnectedParts([]);
        setLastConnected(null);
        setLastFact(null);
        setWrongFlash(null);
        setWrongMsg(false);
        setCrisisOn(false);
        setTriedCrisis(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fire deler, fire maktsentre. Koble mobilen til verden.
                    </p>
                </div>
                <div className="ml-auto flex gap-1.5">
                    {PARTS.map((_, i) => (
                        <span
                            key={i}
                            className={`h-2 w-2 rounded-full transition-colors ${
                                i < connectedParts.length ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {/* Oppdrags-kort */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-4 flex gap-3">
                    <span className="mt-0.5 text-amber-500 font-bold shrink-0">Oppdraget:</span>
                    <p className="text-sm text-amber-900 leading-snug">
                        Klikk en del av mobilen. Klikk deretter maktsenteret delen kommer fra. Klar
                        du å koble alle fire?
                    </p>
                </div>

                {/* Interaksjonsflate: mobil + trådene + regionkort i ett koordinatsystem */}
                <div className="mx-auto w-full max-w-[640px]">
                    <svg
                        viewBox="0 0 640 380"
                        className="w-full h-auto select-none"
                        role="img"
                        aria-label="Mobil med fire deler som kobles til fire maktsentre i verden"
                    >
                        {/* Mobilkropp */}
                        <rect x={52} y={18} width={140} height={344} rx={28} fill="#1e293b" />
                        <rect
                            x={62}
                            y={32}
                            width={120}
                            height={316}
                            rx={16}
                            fill="#f8fafc"
                            stroke="#e2e8f0"
                        />
                        <rect x={107} y={22} width={30} height={5} rx={2.5} fill="#475569" />
                        <rect x={107} y={353} width={30} height={4} rx={2} fill="#475569" />

                        {/* Mobildeler */}
                        {PARTS.map((p, i) => {
                            const Icon = p.icon;
                            const isConnected = connectedParts.includes(p.id);
                            const isSelected = selected === p.id;
                            const isDead = crisisOn && p.id === 'skjerm';
                            const isIdle = !isConnected && !isSelected;
                            const cx = BAND_X + BAND_W / 2;
                            return (
                                <motion.g
                                    key={p.id}
                                    onClick={() => handlePartClick(p.id)}
                                    animate={{
                                        scale: isSelected ? 1.06 : 1,
                                        y: isSelected ? -3 : 0,
                                    }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    style={{
                                        transformBox: 'fill-box',
                                        transformOrigin: 'center',
                                        cursor: isConnected ? 'default' : 'pointer',
                                    }}
                                >
                                    <rect
                                        x={BAND_X}
                                        y={p.bandY}
                                        width={BAND_W}
                                        height={BAND_H}
                                        rx={10}
                                        fill={
                                            isConnected
                                                ? '#ecfdf5'
                                                : isSelected
                                                  ? '#eef2ff'
                                                  : '#ffffff'
                                        }
                                        stroke={
                                            isConnected
                                                ? '#a7f3d0'
                                                : isSelected
                                                  ? '#6366f1'
                                                  : '#e2e8f0'
                                        }
                                        strokeWidth={isSelected ? 2 : 1}
                                    />
                                    {/* Rolig puls på deler som ikke er koblet enda */}
                                    <motion.rect
                                        x={BAND_X}
                                        y={p.bandY}
                                        width={BAND_W}
                                        height={BAND_H}
                                        rx={10}
                                        fill="none"
                                        stroke={p.color}
                                        strokeWidth={2}
                                        pointerEvents="none"
                                        animate={
                                            isIdle ? { opacity: [0.15, 0.7, 0.15] } : { opacity: 0 }
                                        }
                                        transition={
                                            isIdle
                                                ? {
                                                      duration: 2.4,
                                                      repeat: Infinity,
                                                      delay: i * 0.35,
                                                  }
                                                : { duration: 0.2 }
                                        }
                                    />
                                    {Icon ? (
                                        <Icon
                                            x={cx - 11}
                                            y={p.bandY + 7}
                                            width={22}
                                            height={22}
                                            strokeWidth={1.8}
                                            className={isDead ? 'text-slate-400' : p.iconClass}
                                        />
                                    ) : (
                                        // App-rutenettet
                                        APP_COLORS.map((c, j) => (
                                            <rect
                                                key={c}
                                                x={cx - 21.5 + (j % 3) * 15}
                                                y={p.bandY + 6 + Math.floor(j / 3) * 15}
                                                width={11}
                                                height={11}
                                                rx={3}
                                                fill={c}
                                            />
                                        ))
                                    )}
                                    <text
                                        x={cx}
                                        y={p.bandY + 45}
                                        textAnchor="middle"
                                        fontSize={11}
                                        fontWeight={600}
                                        fill="#1e293b"
                                    >
                                        {p.label}
                                    </text>
                                    <text
                                        x={cx}
                                        y={p.bandY + 58}
                                        textAnchor="middle"
                                        fontSize={9}
                                        fill="#64748b"
                                    >
                                        {p.sub}
                                    </text>
                                    {/* Krise: skjermen gråes ut */}
                                    {isDead && (
                                        <motion.rect
                                            x={BAND_X}
                                            y={p.bandY}
                                            width={BAND_W}
                                            height={BAND_H}
                                            rx={10}
                                            fill="#64748b"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.45 }}
                                            pointerEvents="none"
                                        />
                                    )}
                                    {isConnected && !isDead && (
                                        <motion.g
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 18,
                                            }}
                                            style={{
                                                transformBox: 'fill-box',
                                                transformOrigin: 'center',
                                            }}
                                        >
                                            <circle
                                                cx={BAND_X + BAND_W - 2}
                                                cy={p.bandY + 2}
                                                r={8}
                                                fill="#10b981"
                                            />
                                            <Check
                                                x={BAND_X + BAND_W - 7.5}
                                                y={p.bandY - 3.5}
                                                width={11}
                                                height={11}
                                                strokeWidth={3}
                                                className="text-white"
                                            />
                                        </motion.g>
                                    )}
                                </motion.g>
                            );
                        })}

                        {/* Trådene */}
                        {REGIONS.map((r) => {
                            const part = PARTS.find((p) => p.id === r.partId);
                            if (!part || !connectedParts.includes(r.partId)) return null;
                            const fromY = partCenterY(part);
                            const d = threadPath(fromY, r.centerY);
                            const isCut = crisisOn && r.partId === 'skjerm';
                            return (
                                <g key={r.id} pointerEvents="none">
                                    <motion.path
                                        d={d}
                                        fill="none"
                                        stroke={part.color}
                                        strokeWidth={3.5}
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: isCut ? 0 : 1 }}
                                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                                    />
                                    {/* Pulserende strøm langs intakte tråder */}
                                    {!isCut && (
                                        <motion.path
                                            d={d}
                                            fill="none"
                                            stroke="#ffffff"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeDasharray="3 14"
                                            strokeOpacity={0.9}
                                            initial={{ opacity: 0 }}
                                            animate={{
                                                opacity: 1,
                                                strokeDashoffset: [0, -34],
                                            }}
                                            transition={{
                                                opacity: { delay: 0.5, duration: 0.3 },
                                                strokeDashoffset: {
                                                    duration: 1.1,
                                                    repeat: Infinity,
                                                    ease: 'linear',
                                                },
                                            }}
                                        />
                                    )}
                                    <motion.circle
                                        cx={THREAD_START_X}
                                        cy={fromY}
                                        r={4.5}
                                        fill={part.color}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: isCut ? 0 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                    />
                                    <motion.circle
                                        cx={CARD_X - 2}
                                        cy={r.centerY}
                                        r={4.5}
                                        fill={part.color}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: isCut ? 0 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                    />
                                    {/* Klippet tråd: rest + saks */}
                                    {isCut && (
                                        <>
                                            <path
                                                d={d}
                                                fill="none"
                                                stroke="#cbd5e1"
                                                strokeWidth={2}
                                                strokeDasharray="4 8"
                                            />
                                            <motion.g
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1, rotate: [0, -28, 12, 0] }}
                                                transition={{ duration: 0.6 }}
                                                style={{
                                                    transformBox: 'fill-box',
                                                    transformOrigin: 'center',
                                                }}
                                            >
                                                <circle
                                                    cx={289}
                                                    cy={154}
                                                    r={14}
                                                    fill="#fef2f2"
                                                    stroke="#fecaca"
                                                />
                                                <Scissors
                                                    x={280}
                                                    y={145}
                                                    width={18}
                                                    height={18}
                                                    strokeWidth={2}
                                                    className="text-red-600"
                                                />
                                            </motion.g>
                                        </>
                                    )}
                                </g>
                            );
                        })}

                        {/* Krise-stempel over mobilen */}
                        <AnimatePresence>
                            {crisisOn && (
                                <motion.g
                                    initial={{ scale: 0, rotate: -30, opacity: 0 }}
                                    animate={{ scale: 1, rotate: -12, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                    pointerEvents="none"
                                >
                                    <rect
                                        x={47}
                                        y={168}
                                        width={150}
                                        height={40}
                                        rx={8}
                                        fill="#ffffff"
                                        fillOpacity={0.92}
                                        stroke="#dc2626"
                                        strokeWidth={2.5}
                                    />
                                    <text
                                        x={122}
                                        y={193}
                                        textAnchor="middle"
                                        fontSize={13}
                                        fontWeight={800}
                                        fill="#dc2626"
                                        letterSpacing={0.5}
                                    >
                                        KAN IKKE BYGGES
                                    </text>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* Regionkort */}
                        {REGIONS.map((r) => {
                            const isConnected = connectedParts.includes(r.partId);
                            const isWrong = wrongFlash === r.id;
                            const justConnected = lastConnected === r.id;
                            const inCrisis = crisisOn && r.id === 'kina';
                            const y = r.centerY - CARD_H / 2;
                            return (
                                <motion.g
                                    key={r.id}
                                    onClick={() => handleRegionClick(r)}
                                    whileHover={!isConnected ? { scale: 1.02 } : undefined}
                                    animate={
                                        isWrong
                                            ? { x: [0, -6, 6, -4, 4, 0] }
                                            : justConnected
                                              ? { scale: [1, 1.05, 1], x: 0 }
                                              : { x: 0, scale: 1 }
                                    }
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        transformBox: 'fill-box',
                                        transformOrigin: 'center',
                                        cursor: isConnected ? 'default' : 'pointer',
                                    }}
                                >
                                    <rect
                                        x={CARD_X}
                                        y={y}
                                        width={CARD_W}
                                        height={CARD_H}
                                        rx={12}
                                        fill={
                                            inCrisis
                                                ? '#fef2f2'
                                                : isConnected
                                                  ? '#ecfdf5'
                                                  : isWrong
                                                    ? '#fff1f2'
                                                    : '#ffffff'
                                        }
                                        stroke={
                                            inCrisis
                                                ? '#ef4444'
                                                : isConnected
                                                  ? '#6ee7b7'
                                                  : isWrong
                                                    ? '#fda4af'
                                                    : '#e2e8f0'
                                        }
                                        strokeWidth={inCrisis ? 2 : 1}
                                    />
                                    <MapPin
                                        x={CARD_X + 14}
                                        y={r.centerY - 11}
                                        width={22}
                                        height={22}
                                        strokeWidth={1.8}
                                        className={inCrisis ? 'text-red-500' : 'text-slate-400'}
                                    />
                                    <text
                                        x={CARD_X + 46}
                                        y={r.centerY - 4}
                                        fontSize={13.5}
                                        fontWeight={700}
                                        fill="#1e293b"
                                    >
                                        {r.name}
                                    </text>
                                    <text
                                        x={CARD_X + 46}
                                        y={r.centerY + 14}
                                        fontSize={11}
                                        fill="#64748b"
                                    >
                                        {r.resource}
                                    </text>
                                    {inCrisis && (
                                        <text
                                            x={CARD_X + 46}
                                            y={r.centerY + 28}
                                            fontSize={9}
                                            fontWeight={700}
                                            fill="#dc2626"
                                            letterSpacing={0.5}
                                        >
                                            EKSPORT STANSET
                                        </text>
                                    )}
                                    {isConnected && !inCrisis && (
                                        <motion.g
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 18,
                                            }}
                                            style={{
                                                transformBox: 'fill-box',
                                                transformOrigin: 'center',
                                            }}
                                        >
                                            <circle
                                                cx={CARD_X + CARD_W - 4}
                                                cy={y + 4}
                                                r={9}
                                                fill="#10b981"
                                            />
                                            <Check
                                                x={CARD_X + CARD_W - 10}
                                                y={y - 2}
                                                width={12}
                                                height={12}
                                                strokeWidth={3}
                                                className="text-white"
                                            />
                                        </motion.g>
                                    )}
                                </motion.g>
                            );
                        })}
                    </svg>
                </div>

                {/* Feedback-sone */}
                <div className="mt-3 min-h-[3rem]">
                    <AnimatePresence mode="wait">
                        {wrongMsg ? (
                            <motion.div
                                key="wrong"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="px-4 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                            >
                                Ikke helt. Denne delen kommer fra et annet maktsenter. Prøv igjen.
                            </motion.div>
                        ) : selectedPart ? (
                            <motion.div
                                key={`sel-${selectedPart.id}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm"
                            >
                                Du valgte {selectedPart.label.toLowerCase()}. Hvor i verden kommer
                                denne delen fra?
                            </motion.div>
                        ) : lastFact ? (
                            <motion.div
                                key={lastFact}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-2"
                            >
                                <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                                <span>{lastFact}</span>
                            </motion.div>
                        ) : (
                            <motion.p
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="px-1 text-sm text-slate-400"
                            >
                                Klikk en av de fire delene i mobilen for å starte.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Krise-bryter */}
                <AnimatePresence>
                    {allConnected && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3"
                        >
                            <span className="text-red-600 font-bold text-sm shrink-0">Krise!</span>
                            <p className="text-sm text-red-900 leading-snug">
                                Kina stanser eksporten av sjeldne jordarter.
                            </p>
                            <button
                                onClick={handleCrisisToggle}
                                aria-pressed={crisisOn}
                                aria-label="Slå krisen av eller på"
                                className={`ml-auto flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
                                    crisisOn
                                        ? 'bg-red-600 justify-end'
                                        : 'bg-slate-300 justify-start'
                                }`}
                            >
                                <motion.span
                                    layout
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="h-5 w-5 rounded-full bg-white shadow"
                                />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Innsikts-kort mens krisen er på */}
                <AnimatePresence>
                    {crisisOn && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex gap-3"
                        >
                            <Lightbulb className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500" />
                            <p className="text-sm text-emerald-900 leading-snug">
                                Én pol kan stanse deler - men ingen pol kontrollerer alt. Det er en
                                multipolar verden. Legg merke til at de tre andre trådene fortsatt
                                lever.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Fullført */}
                <AnimatePresence>
                    {complete && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 18,
                                    delay: 0.1,
                                }}
                                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100"
                            >
                                <Smartphone className="w-6 h-6 text-emerald-600" />
                            </motion.div>
                            <h4 className="font-bold text-slate-800">Verden i lomma di</h4>
                            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
                                Mobilen din trenger fire maktsentre samtidig: Kina, Taiwan, Kongo og
                                Sør-Amerika, og USA. Ingen av dem kontrollerer alt, men én av dem
                                kan stanse deler av den. Det er multipolaritet i praksis.
                            </p>
                            <button
                                onClick={handleReset}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-200 hover:bg-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" /> Prøv igjen
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Kontrollrad */}
                {!complete && (
                    <div className="mt-2">
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" /> Start på nytt
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
