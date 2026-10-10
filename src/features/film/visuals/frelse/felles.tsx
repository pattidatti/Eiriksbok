import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** SVG-flate i 16:9 som alle 2D-visualene i filmen tegner på. */
export function Flate({
    children,
    bakgrunn = '#f5efe4',
}: {
    children: ReactNode;
    bakgrunn?: string;
}) {
    return (
        <div className="absolute inset-0" style={{ background: bakgrunn }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {children}
            </svg>
        </div>
    );
}

/** En enkel menneskefigur. */
export function Figur({
    x,
    y,
    farge = '#334155',
    skala = 1,
    sitter = false,
}: {
    x: number;
    y: number;
    farge?: string;
    skala?: number;
    sitter?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-118} r={26} fill="#e0b98a" />
            {sitter ? (
                <>
                    <path d="M -38 -88 Q 0 -100 38 -88 L 46 -10 L -46 -10 Z" fill={farge} />
                    <ellipse cx={0} cy={-4} rx={78} ry={16} fill={farge} />
                </>
            ) : (
                <>
                    <path d="M -36 -88 Q 0 -100 36 -88 L 44 0 L -44 0 Z" fill={farge} />
                </>
            )}
        </g>
    );
}

/** Stor tekst som tones inn. */
export function Tekst({
    x,
    y,
    children,
    str = 40,
    farge = '#0f172a',
    vis = true,
    vekt = 800,
    anker = 'middle',
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    children: ReactNode;
    str?: number;
    farge?: string;
    vis?: boolean;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.5, delay: vis ? forsinkelse : 0 }}
            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
        >
            {children}
        </motion.text>
    );
}

/** Snakkeboble med tekst. */
export function Boble({
    x,
    y,
    b,
    tekst,
    vis,
    farge = '#ffffff',
}: {
    x: number;
    y: number;
    b: number;
    tekst: string;
    vis: boolean;
    farge?: string;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: vis ? 1 : 0, scale: vis ? 1 : 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
        >
            <rect
                x={x - b / 2}
                y={y - 44}
                width={b}
                height={80}
                rx={22}
                fill={farge}
                stroke="#cbd5e1"
                strokeWidth={3}
            />
            <text
                x={x}
                y={y + 8}
                textAnchor="middle"
                fontSize={32}
                fontWeight={800}
                fill="#0f172a"
                style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
            >
                {tekst}
            </text>
        </motion.g>
    );
}
