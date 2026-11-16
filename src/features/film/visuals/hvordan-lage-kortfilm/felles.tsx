import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FARGE } from './farger';

/** Felles biter for 2D-visualene i kortfilm-filmen. Alt tegnes på en 1600 x 900-flate. */

export function Lerret({ children }: { children: ReactNode }) {
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
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

/** Overskrift øverst i midten. */
export function Overskrift({ tekst, farge = FARGE.blekk }: { tekst: string; farge?: string }) {
    return (
        <motion.text
            key={tekst}
            x={800}
            y={96}
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="font-display"
            fontSize={58}
            fontWeight={800}
            fill={farge}
        >
            {tekst}
        </motion.text>
    );
}

/** Vis innholdet med en myk inngang. Returnerer null når det er skjult. */
export function Vis({
    nar,
    children,
    forsinkelse = 0,
}: {
    nar: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    if (!nar) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

/** En tekst på et farget merke. Bredden regnes ut fra teksten. */
export function Merke({
    x,
    y,
    tekst,
    farge = FARGE.blekk,
    str = 34,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    str?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    const b = tekst.length * str * 0.56 + str * 1.2;
    const h = str * 1.6;
    const x0 = anker === 'middle' ? x - b / 2 : anker === 'end' ? x - b : x;
    return (
        <g>
            <rect x={x0} y={y - h / 2} width={b} height={h} rx={h / 2.4} fill={farge} />
            <text
                x={x0 + b / 2}
                y={y + str * 0.35}
                textAnchor="middle"
                fontSize={str}
                fontWeight={800}
                fill="#fff"
                className="font-display"
            >
                {tekst}
            </text>
        </g>
    );
}

/** Rødt kryss eller grønn hake i en sirkel. */
export function Dom({ x, y, ok, r = 34 }: { x: number; y: number; ok: boolean; r?: number }) {
    return (
        <g>
            <circle cx={x} cy={y} r={r} fill={ok ? FARGE.gronn : FARGE.rod} />
            {ok ? (
                <path
                    d={`M ${x - r * 0.45} ${y} L ${x - r * 0.1} ${y + r * 0.38} L ${x + r * 0.5} ${y - r * 0.4}`}
                    stroke="#fff"
                    strokeWidth={r * 0.22}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : (
                <path
                    d={`M ${x - r * 0.4} ${y - r * 0.4} L ${x + r * 0.4} ${y + r * 0.4} M ${x + r * 0.4} ${y - r * 0.4} L ${x - r * 0.4} ${y + r * 0.4}`}
                    stroke="#fff"
                    strokeWidth={r * 0.22}
                    strokeLinecap="round"
                />
            )}
        </g>
    );
}

/** Et lite filmbilde (ramme) med mørk bakgrunn. Innholdet tegnes inni med egne koordinater. */
export function Bilde({
    x,
    y,
    b,
    h,
    children,
    bakgrunn = '#1e293b',
    kant = '#0f172a',
}: {
    x: number;
    y: number;
    b: number;
    h: number;
    children?: ReactNode;
    bakgrunn?: string;
    kant?: string;
}) {
    const id = `klipp-${Math.round(x)}-${Math.round(y)}-${Math.round(b)}`;
    return (
        <g>
            <defs>
                <clipPath id={id}>
                    <rect x={x} y={y} width={b} height={h} rx={14} />
                </clipPath>
            </defs>
            <rect x={x} y={y} width={b} height={h} rx={14} fill={bakgrunn} />
            <g clipPath={`url(#${id})`}>{children}</g>
            <rect
                x={x}
                y={y}
                width={b}
                height={h}
                rx={14}
                fill="none"
                stroke={kant}
                strokeWidth={6}
            />
        </g>
    );
}

/** En person sett forfra: hode og skuldre. `ser` flytter øynene (-1 venstre, 1 høyre). */
export function Hode({
    x,
    y,
    r = 60,
    farge,
    ser = 0,
    munn = 'rett',
    har = '#3f2a14',
}: {
    x: number;
    y: number;
    r?: number;
    farge: string;
    ser?: number;
    munn?: 'rett' | 'smil' | 'blank';
    har?: string;
}) {
    return (
        <g>
            <path
                d={`M ${x - r * 1.5} ${y + r * 2.4} Q ${x - r * 1.5} ${y + r * 0.9} ${x} ${y + r * 0.9} Q ${x + r * 1.5} ${y + r * 0.9} ${x + r * 1.5} ${y + r * 2.4} Z`}
                fill={farge}
            />
            <circle cx={x} cy={y} r={r} fill="#e8b996" />
            <path
                d={`M ${x - r} ${y - r * 0.1} Q ${x - r} ${y - r * 1.15} ${x} ${y - r * 1.12} Q ${x + r} ${y - r * 1.15} ${x + r} ${y - r * 0.1} Q ${x} ${y - r * 0.6} ${x - r} ${y - r * 0.1} Z`}
                fill={har}
            />
            {[-1, 1].map((s) => (
                <g key={s}>
                    <circle cx={x + s * r * 0.36} cy={y + r * 0.05} r={r * 0.17} fill="#fff" />
                    <circle
                        cx={x + s * r * 0.36 + ser * r * 0.08}
                        cy={y + r * 0.05}
                        r={r * (munn === 'blank' ? 0.06 : 0.09)}
                        fill={FARGE.blekk}
                    />
                </g>
            ))}
            {munn === 'smil' ? (
                <path
                    d={`M ${x - r * 0.3} ${y + r * 0.45} Q ${x} ${y + r * 0.7} ${x + r * 0.3} ${y + r * 0.45}`}
                    stroke="#9a3412"
                    strokeWidth={r * 0.08}
                    fill="none"
                    strokeLinecap="round"
                />
            ) : (
                <line
                    x1={x - r * (munn === 'blank' ? 0.12 : 0.25)}
                    y1={y + r * 0.52}
                    x2={x + r * (munn === 'blank' ? 0.12 : 0.25)}
                    y2={y + r * 0.52}
                    stroke="#9a3412"
                    strokeWidth={r * 0.08}
                    strokeLinecap="round"
                />
            )}
        </g>
    );
}

/** En person sett fra siden: hode med nese som peker dit personen ser (1 = høyre, -1 = venstre). */
export function Profil({
    x,
    y,
    r = 60,
    farge,
    retning,
}: {
    x: number;
    y: number;
    r?: number;
    farge: string;
    retning: 1 | -1;
}) {
    const d = retning;
    return (
        <g>
            <path
                d={`M ${x - r * 1.3} ${y + r * 2.4} Q ${x - r * 1.3} ${y + r * 0.9} ${x} ${y + r * 0.9} Q ${x + r * 1.3} ${y + r * 0.9} ${x + r * 1.3} ${y + r * 2.4} Z`}
                fill={farge}
            />
            <circle cx={x} cy={y} r={r} fill="#e8b996" />
            <path
                d={`M ${x + d * r * 0.9} ${y - r * 0.05} L ${x + d * r * 1.25} ${y + r * 0.22} L ${x + d * r * 0.9} ${y + r * 0.32} Z`}
                fill="#e8b996"
            />
            <path
                d={`M ${x - d * r * 1.02} ${y + r * 0.3} Q ${x - d * r * 1.1} ${y - r * 1.1} ${x + d * r * 0.2} ${y - r * 1.05} Q ${x + d * r * 0.9} ${y - r * 0.9} ${x + d * r * 0.85} ${y - r * 0.35} Q ${x} ${y - r * 0.55} ${x - d * r * 0.3} ${y + r * 0.1} Z`}
                fill="#3f2a14"
            />
            <circle cx={x + d * r * 0.55} cy={y + r * 0.02} r={r * 0.1} fill={FARGE.blekk} />
        </g>
    );
}
