import React from 'react';
import { DIMENSIONS, type DimensionKey } from './dimensionMeta';

interface MiniWheelProps {
    /** Dimensjoner eleven har åpnet i denne profilen */
    visited: Set<DimensionKey>;
    /** Dimensjonen som er linse akkurat nå - lyser opp i sin egen farge */
    active: DimensionKey;
    /** Religionens farge, brukt på fremdriftsringen rundt navet */
    color: string;
    size?: number;
}

const GAP = 3;
const SLICE = 360 / DIMENSIONS.length;

const polar = (cx: number, r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cx + r * Math.sin(rad)] as const;
};

/**
 * Dimensjonshjulet i miniatyr, uten klikkflater. Brukes på religionskortene i
 * huben, slik at eleven ser hvor langt hen er kommet i hver profil før hen går
 * inn - og hvilken av de sju sidene linsen står på.
 */
export const MiniWheel: React.FC<MiniWheelProps> = ({ visited, active, color, size = 64 }) => {
    const c = size / 2;
    const rOuter = size * 0.46;
    const rInner = size * 0.26;
    const rHub = size * 0.23;
    const progress = visited.size / DIMENSIONS.length;
    const circumference = 2 * Math.PI * rHub;

    const wedge = (startDeg: number, endDeg: number) => {
        const [x0, y0] = polar(c, rOuter, startDeg);
        const [x1, y1] = polar(c, rOuter, endDeg);
        const [x2, y2] = polar(c, rInner, endDeg);
        const [x3, y3] = polar(c, rInner, startDeg);
        return `M ${x0} ${y0} A ${rOuter} ${rOuter} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${rInner} ${rInner} 0 0 0 ${x3} ${y3} Z`;
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={`${visited.size} av ${DIMENSIONS.length} sider lest`}
        >
            {DIMENSIONS.map((dim, index) => {
                const isActive = dim.key === active;
                const isVisited = visited.has(dim.key);
                return (
                    <path
                        key={dim.key}
                        d={wedge(index * SLICE + GAP / 2, (index + 1) * SLICE - GAP / 2)}
                        fill={dim.color}
                        fillOpacity={isActive ? 0.95 : isVisited ? 0.38 : 0.14}
                    />
                );
            })}
            <circle cx={c} cy={c} r={rHub} fill="#ffffff" />
            <circle cx={c} cy={c} r={rHub} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={3} />
            {visited.size > 0 && (
                <circle
                    cx={c}
                    cy={c}
                    r={rHub}
                    fill="none"
                    stroke={color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={`${progress * circumference} ${circumference}`}
                    transform={`rotate(-90 ${c} ${c})`}
                />
            )}
        </svg>
    );
};
