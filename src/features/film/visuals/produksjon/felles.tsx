import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Felles biter for visualene i filmen om produksjon. */

export const B = 1600;
export const H = 900;

export const FARGE = {
    bakgrunn: '#f6f1e7',
    blek: '#e7dfcf',
    blekk: '#1e293b',
    gra: '#64748b',
    stat: '#2563eb',
    marked: '#ea580c',
    gronn: '#0d9488',
    rod: '#dc2626',
    gull: '#ca8a04',
} as const;

/** Overskrift øverst i bildet. Bytter tekst med en myk overgang. */
export function Overskrift({ tekst }: { tekst: string | null }) {
    return (
        <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ top: 18 }}>
            <AnimatePresence mode="wait">
                {tekst && (
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.45 }}
                        className="px-6 py-2.5 rounded-2xl bg-white/95 shadow-xl font-black text-slate-900 whitespace-nowrap"
                        style={{ fontSize: 30 }}
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Tekst i SVG med hvit kant, så den kan leses oppå alt. Animerer bare opacity. */
export function Tekst({
    x,
    y,
    children,
    synlig = true,
    farge = FARGE.blekk,
    storrelse = 34,
    anker = 'middle',
    vekt = 800,
}: {
    x: number;
    y: number;
    children: ReactNode;
    synlig?: boolean;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
    vekt?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={storrelse / 5}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.text>
    );
}

/** En gruppe som tones inn og ut. */
export function Vis({ synlig, children, forsinkelse = 0 }: { synlig: boolean; children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6, delay: synlig ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

/** Pil med bue fra et punkt til et annet, tegnes opp når den blir synlig. */
export function Pil({
    fra,
    til,
    farge,
    synlig,
    bue = 0.2,
    bredde = 8,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    synlig: boolean;
    bue?: number;
    bredde?: number;
}) {
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2;
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    const k: [number, number] = [mx - dy * bue, my + dx * bue];
    const vinkel = Math.atan2(til[1] - k[1], til[0] - k[0]);
    const spiss = 24;
    const a: [number, number] = [til[0] - spiss * Math.cos(vinkel - 0.45), til[1] - spiss * Math.sin(vinkel - 0.45)];
    const b: [number, number] = [til[0] - spiss * Math.cos(vinkel + 0.45), til[1] - spiss * Math.sin(vinkel + 0.45)];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: synlig ? 1 : 0 }} transition={{ duration: 0.5 }}>
            <motion.path
                d={`M ${fra.join(' ')} Q ${k.join(' ')} ${til.join(' ')}`}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: synlig ? 1 : 0 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
            <path
                d={`M ${a.join(' ')} L ${til.join(' ')} L ${b.join(' ')}`}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </motion.g>
    );
}

/** Kort med ikon (emoji-fri: en farget sirkel med bokstav) og etikett under. */
export function Boks({
    x,
    y,
    b,
    h,
    farge,
    tittel,
    under,
    synlig = true,
    fyll = '#ffffff',
    storrelse = 34,
}: {
    x: number;
    y: number;
    b: number;
    h: number;
    farge: string;
    tittel: string;
    under?: string;
    synlig?: boolean;
    fyll?: string;
    storrelse?: number;
}) {
    return (
        <Vis synlig={synlig}>
            <rect x={x - b / 2} y={y - h / 2} width={b} height={h} rx={22} fill={fyll} stroke={farge} strokeWidth={6} />
            <text
                x={x}
                y={under ? y - 4 : y + storrelse * 0.35}
                textAnchor="middle"
                fontSize={storrelse}
                fontWeight={900}
                fill={farge}
            >
                {tittel}
            </text>
            {under && (
                <text x={x} y={y + 38} textAnchor="middle" fontSize={26} fontWeight={700} fill={FARGE.gra}>
                    {under}
                </text>
            )}
        </Vis>
    );
}
