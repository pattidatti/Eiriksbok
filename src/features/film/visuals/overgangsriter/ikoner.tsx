import type { ReactNode } from 'react';

/**
 * Små tegninger av det riten faktisk gjør (vann, snor, øre, kompass ...), vist i kortet over
 * trappa. Navnet kan ha et tall etter kolon, f.eks. «kalender:8».
 */

const S = { fill: 'none', stroke: '#0f172a', strokeWidth: 4, strokeLinecap: 'round' } as const;

function figur(x: number, farge: string) {
    return (
        <g>
            <circle cx={x} cy={22} r={7} fill={farge} />
            <rect x={x - 8} y={31} width={16} height={24} rx={7} fill={farge} />
        </g>
    );
}

const IKONER: Record<string, (tall?: string) => ReactNode> = {
    kalender: (tall) => (
        <g>
            <rect x={8} y={14} width={64} height={56} rx={8} {...S} fill="white" />
            <rect x={8} y={14} width={64} height={16} rx={6} fill="#dc2626" />
            <text x={40} y={62} textAnchor="middle" fontSize={30} fontWeight={900} fill="#0f172a">
                {tall}
            </text>
        </g>
    ),
    bok: () => (
        <g>
            <path d="M 40 22 Q 24 14 8 18 L 8 64 Q 24 60 40 68 Z" {...S} fill="#fef3c7" />
            <path d="M 40 22 Q 56 14 72 18 L 72 64 Q 56 60 40 68 Z" {...S} fill="#fef3c7" />
            <path
                d="M 16 32 L 32 34 M 16 42 L 32 44 M 48 34 L 64 32 M 48 44 L 64 42"
                {...S}
                strokeWidth={3}
            />
        </g>
    ),
    overlevering: () => (
        <g>
            {figur(16, '#64748b')}
            {figur(64, '#2563eb')}
            <path d="M 28 40 L 52 40" {...S} />
            <path d="M 46 33 L 53 40 L 46 47" {...S} />
            <circle cx={40} cy={68} r={0} />
        </g>
    ),
    vann: () => (
        <g>
            {figur(40, '#334155')}
            <rect x={6} y={44} width={68} height={30} rx={6} fill="#38bdf8" opacity={0.75} />
            <path
                d="M 6 44 q 8.5 -7 17 0 t 17 0 t 17 0 t 17 0"
                fill="none"
                stroke="#0284c7"
                strokeWidth={4}
            />
        </g>
    ),
    ore: () => (
        <g>
            <path d="M 30 16 Q 50 10 54 32 Q 56 46 44 54 Q 38 60 38 68" {...S} fill="#f1c27d" />
            <path d="M 40 30 Q 46 32 44 40" {...S} strokeWidth={3} />
            <path d="M 12 30 q -6 10 0 20 M 20 34 q -4 6 0 12" {...S} stroke="#16a34a" />
        </g>
    ),
    avtale: () => (
        <g>
            <rect x={14} y={8} width={52} height={64} rx={6} {...S} fill="white" />
            <path d="M 22 24 L 58 24 M 22 34 L 58 34 M 22 44 L 46 44" {...S} strokeWidth={3} />
            <path d="M 24 60 q 6 -10 12 0 t 12 0 t 10 -2" {...S} stroke="#2563eb" strokeWidth={3} />
        </g>
    ),
    kompass: () => (
        <g>
            <circle cx={40} cy={40} r={30} {...S} fill="white" />
            <path d="M 40 40 L 58 20 L 46 46 Z" fill="#16a34a" />
            <path d="M 40 40 L 22 60 L 34 34 Z" fill="#94a3b8" />
            <text x={40} y={78} textAnchor="middle" fontSize={13} fontWeight={900} fill="#16a34a">
                Mekka
            </text>
        </g>
    ),
    flamme: () => (
        <g>
            <path
                d="M 40 8 Q 62 32 56 52 Q 52 68 40 70 Q 28 68 24 52 Q 20 36 34 24 Q 34 38 42 40 Q 46 26 40 8 Z"
                fill="#f97316"
            />
            <path d="M 40 40 Q 50 52 46 62 Q 40 68 34 62 Q 32 52 40 40 Z" fill="#fde047" />
        </g>
    ),
    snor: () => (
        <g>
            {figur(40, '#334155')}
            <path
                d="M 30 32 L 50 56"
                fill="none"
                stroke="#facc15"
                strokeWidth={5}
                strokeLinecap="round"
            />
            <path
                d="M 30 32 L 50 56"
                fill="none"
                stroke="#a16207"
                strokeWidth={1.5}
                strokeDasharray="3 3"
            />
        </g>
    ),
    lag: () => (
        <g>
            <rect x={10} y={10} width={60} height={16} rx={4} fill="#ec4899" />
            <rect x={10} y={30} width={60} height={16} rx={4} fill="#f472b6" />
            <rect x={10} y={50} width={60} height={16} rx={4} fill="#f9a8d4" />
            <rect x={10} y={66} width={60} height={8} rx={3} fill="#e2e8f0" />
            <path d="M 4 48 L 76 48" stroke="#dc2626" strokeWidth={4} strokeDasharray="6 4" />
        </g>
    ),
    navnelapp: () => (
        <g>
            <rect x={8} y={22} width={64} height={38} rx={8} {...S} fill="white" />
            <rect x={8} y={22} width={64} height={12} rx={6} fill="#0d9488" />
            <path d="M 18 48 L 50 48" {...S} strokeWidth={3} />
        </g>
    ),
    ja: () => (
        <g>
            <rect x={4} y={10} width={34} height={26} rx={10} {...S} fill="white" strokeWidth={3} />
            <text x={21} y={30} textAnchor="middle" fontSize={16} fontWeight={900} fill="#16a34a">
                Ja
            </text>
            <rect
                x={42}
                y={30}
                width={34}
                height={26}
                rx={10}
                {...S}
                fill="white"
                strokeWidth={3}
            />
            <text x={59} y={50} textAnchor="middle" fontSize={16} fontWeight={900} fill="#16a34a">
                Ja
            </text>
            <path d="M 16 36 L 12 46 L 24 36" {...S} fill="white" strokeWidth={3} />
        </g>
    ),
    tempel: () => (
        <g>
            <path d="M 8 30 L 40 10 L 72 30 Z" fill="#8b5cf6" />
            <rect x={14} y={30} width={52} height={36} {...S} fill="white" />
            <path d="M 24 34 L 24 62 M 40 34 L 40 62 M 56 34 L 56 62" {...S} strokeWidth={3} />
            <circle cx={33} cy={74} r={0} />
        </g>
    ),
    tom: () => (
        <g>
            <rect
                x={14}
                y={14}
                width={52}
                height={52}
                rx={6}
                fill="none"
                stroke="#dc2626"
                strokeWidth={4}
                strokeDasharray="8 6"
            />
            <path
                d="M 28 28 L 52 52 M 52 28 L 28 52"
                stroke="#dc2626"
                strokeWidth={4}
                strokeLinecap="round"
            />
        </g>
    ),
};

export function RiteIkon({ navn }: { navn: string }) {
    const [id, tall] = navn.split(':');
    const tegn = IKONER[id];
    if (!tegn) return null;
    return (
        <svg viewBox="0 0 80 80" className="w-14 h-14 md:w-20 md:h-20 shrink-0">
            {tegn(tall)}
        </svg>
    );
}
