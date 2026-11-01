import { AnimatePresence, motion } from 'framer-motion';

/** Felles tegnehjelpere for Hverdagsliv-filmens 2D-visualer (SVG på 1600x900). */

/** Etikett med lys kant, så den leses på alle bakgrunner. */
export function Etikett({
    x,
    y,
    tekst,
    str = 40,
    farge = '#0f172a',
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    str?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
}) {
    // Hvit merkelapp bak teksten, som i 3D-scenene. Bredden er anslått ut fra tekstlengden.
    const b = tekst.length * str * 0.56 + 36;
    const x0 = anker === 'middle' ? x - b / 2 : anker === 'end' ? x - b + 18 : x - 18;
    return (
        <g>
            <rect
                x={x0}
                y={y - str * 0.98}
                width={b}
                height={str * 1.34}
                rx={str * 0.4}
                fill="#ffffff"
                opacity={0.94}
            />
            <text x={x} y={y} textAnchor={anker} fontSize={str} fontWeight={800} fill={farge}>
                {tekst}
            </text>
        </g>
    );
}

/** Et lag som tones inn. */
export function Inn({
    children,
    forsinkelse = 0,
}: {
    children: React.ReactNode;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

/**
 * En enkel figur. (x, y) er føttene. «sitt» sitter på en benk i høyde y, «ligg» ligger på
 * siden langs en divan.
 */
export function Person({
    x,
    y,
    s = 1,
    kropp = '#a16207',
    hud = '#e7c4a0',
    pose = 'sta',
    hår = '#3f2a1d',
}: {
    x: number;
    y: number;
    s?: number;
    kropp?: string;
    hud?: string;
    pose?: 'sta' | 'sitt' | 'ligg';
    hår?: string;
}) {
    if (pose === 'ligg') {
        return (
            <g transform={`translate(${x} ${y}) scale(${s})`}>
                <path d="M-90,0 C-90,-40 40,-46 60,-30 L60,0 Z" fill={kropp} />
                <rect
                    x={30}
                    y={-58}
                    width={16}
                    height={34}
                    rx={8}
                    fill={hud}
                    transform="rotate(-20 38 -40)"
                />
                <circle cx={78} cy={-62} r={24} fill={hud} />
                <path d="M56,-70 C60,-92 98,-92 100,-66 Z" fill={hår} />
            </g>
        );
    }
    const sitter = pose === 'sitt';
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            {sitter ? (
                <>
                    <path
                        d="M-12,-14 L34,-14 L34,40 M12,-6 L50,-6 L50,40"
                        stroke="#57402c"
                        strokeWidth={10}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path d="M-34,-10 L-26,-110 L26,-110 L34,-10 Z" fill={kropp} />
                </>
            ) : (
                <>
                    <path
                        d="M-12,-70 L-14,0 M12,-70 L14,0"
                        stroke="#57402c"
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <path d="M-36,-60 L-26,-170 L26,-170 L36,-60 Z" fill={kropp} />
                </>
            )}
            <circle cx={0} cy={sitter ? -136 : -196} r={26} fill={hud} />
            <path
                d={
                    sitter
                        ? 'M-26,-140 C-26,-170 26,-170 26,-140 Z'
                        : 'M-26,-200 C-26,-230 26,-230 26,-200 Z'
                }
                fill={hår}
            />
        </g>
    );
}

/** Overskriften øverst i midten, som bytter med beaten. */
export function Overskrift({ tekst }: { tekst: string }) {
    return (
        <div className="absolute top-[6%] inset-x-0 flex justify-center pointer-events-none z-10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Rødt kryss over noe som ikke fantes. */
export function Kryss({ x, y, r = 70 }: { x: number; y: number; r?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <circle cx={x} cy={y} r={r} fill="none" stroke="#dc2626" strokeWidth={12} />
            <line
                x1={x - r * 0.7}
                y1={y + r * 0.7}
                x2={x + r * 0.7}
                y2={y - r * 0.7}
                stroke="#dc2626"
                strokeWidth={12}
            />
        </motion.g>
    );
}
