import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Maktstigen. Nederst presten og vennene hans i Romsdal, i midten biskopen i Trondheim,
 * øverst kongen. Modus «prest»: livet hans fyller venstre kant, biskopen sier nei til
 * samisk, og brevet går rundt biskopen rett til kongen. Modus «kollegiet»: kongen lager
 * Misjonskollegiet, kontoret sender misjon til tre steder, og von Westen får jobben.
 */

type Modus = 'prest' | 'kollegiet';

const GULL = '#b45309';
const BLA = '#1d4ed8';
const ROD = '#b91c1c';

function Person({ x, y, farge, skala = 1 }: { x: number; y: number; farge: string; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-62} r={22} fill="#f5d0a9" stroke="#57534e" strokeWidth={3} />
            <path d="M -34 0 Q -34 -38 0 -38 Q 34 -38 34 0 Z" fill={farge} />
            <rect x={-6} y={-38} width={12} height={10} fill="#fafaf9" />
        </g>
    );
}

function Krone({ x, y }: { x: number; y: number }) {
    return (
        <path
            transform={`translate(${x} ${y})`}
            d="M -30 0 L -34 -30 L -16 -14 L 0 -36 L 16 -14 L 34 -30 L 30 0 Z"
            fill="#facc15"
            stroke="#a16207"
            strokeWidth={3}
        />
    );
}

function Stjerne({ x, y, r = 14 }: { x: number; y: number; r?: number }) {
    const p = Array.from({ length: 10 }, (_, i) => {
        const v = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.45;
        return `${x + Math.cos(v) * rr},${y + Math.sin(v) * rr}`;
    }).join(' ');
    return <polygon points={p} fill="#facc15" stroke="#a16207" strokeWidth={1.5} />;
}

function Vis({ nar, children, k }: { nar: boolean; children: React.ReactNode; k: string }) {
    return (
        <AnimatePresence>
            {nar && (
                <motion.g
                    key={k}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    {children}
                </motion.g>
            )}
        </AnimatePresence>
    );
}

// Trinnene i stigen (y for gulvet på hvert trinn).
const KONGE_Y = 250;
const BISKOP_Y = 500;
const PREST_Y = 790;

export function WestenMakten({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'prest';
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-stone-200 overflow-hidden">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'prest' ? <Prest beat={beat} /> : <Kollegiet beat={beat} />}
            </svg>
        </div>
    );
}

function Trinn({ y, tekst, lys }: { y: number; tekst: string; lys: boolean }) {
    return (
        <g>
            <rect x={620} y={y} width={720} height={14} rx={7} fill={lys ? '#78716c' : '#a8a29e'} />
            <text x={1360} y={y + 12} fontSize={30} fontWeight={800} fill={lys ? '#1c1917' : '#78716c'}>
                {tekst}
            </text>
        </g>
    );
}

function Prest({ beat }: { beat: number }) {
    const liv = [
        { ar: '1682', tekst: 'Født i Trondheim', fraBeat: 0 },
        { ar: 'København', tekst: 'Studerer teologi', fraBeat: 0 },
        { ar: 'Romsdal', tekst: 'Prest, pietist', fraBeat: 1 },
        { ar: '1713', tekst: 'Syvstjernen', fraBeat: 2 },
    ];
    // Brevet: fra presten, ut til venstre rundt biskopen, opp til kongen.
    const brevBane = 'M 980 700 C 560 640 560 360 960 210';
    return (
        <g>
            <text x={800} y={90} textAnchor="middle" fontSize={50} fontWeight={900} fill="#1c1917">
                Hvem bestemmer?
            </text>

            {/* Livet hans, venstre kant */}
            {liv.map((l, i) => (
                <Vis key={l.ar} k={l.ar} nar={beat >= l.fraBeat}>
                    <rect
                        x={40}
                        y={190 + i * 150}
                        width={420}
                        height={120}
                        rx={18}
                        fill="white"
                        opacity={0.95}
                        stroke={beat === l.fraBeat ? GULL : '#d6d3d1'}
                        strokeWidth={beat === l.fraBeat ? 6 : 3}
                    />
                    <text x={70} y={240 + i * 150} fontSize={36} fontWeight={900} fill={GULL}>
                        {l.ar}
                    </text>
                    <text x={70} y={285 + i * 150} fontSize={30} fontWeight={700} fill="#292524">
                        {l.tekst}
                    </text>
                </Vis>
            ))}

            <Trinn y={KONGE_Y} tekst="Kongen" lys={beat >= 4} />
            <Trinn y={BISKOP_Y} tekst="Biskopen" lys={beat === 3} />
            <Trinn y={PREST_Y} tekst="Prestene" lys={beat <= 2} />

            {/* Kongen */}
            <Person x={980} y={KONGE_Y} farge="#7c2d12" />
            <Krone x={980} y={KONGE_Y - 92} />

            {/* Biskopen */}
            <Person x={980} y={BISKOP_Y} farge="#4c1d95" />
            <path d={`M 962 ${BISKOP_Y - 88} L 980 ${BISKOP_Y - 122} L 998 ${BISKOP_Y - 88} Z`} fill="#fafaf9" stroke="#4c1d95" strokeWidth={3} />
            <Vis k="dansk" nar={beat >= 3}>
                <rect x={1040} y={BISKOP_Y - 120} width={370} height={84} rx={20} fill="white" stroke={ROD} strokeWidth={4} />
                <text x={1225} y={BISKOP_Y - 65} textAnchor="middle" fontSize={34} fontWeight={900} fill={ROD}>
                    Dansk, ikke samisk
                </text>
            </Vis>

            {/* Von Westen */}
            <Person x={980} y={PREST_Y} farge="#1c1917" />
            <Vis k="pietisme" nar={beat === 1}>
                <text x={980} y={PREST_Y - 115} textAnchor="middle" fontSize={36} fontWeight={900} fill="#1c1917">
                    Strengt og rent liv
                </text>
            </Vis>
            {/* Syvstjernen: vennene i Romsdal */}
            <Vis k="venner" nar={beat >= 2}>
                <Person x={830} y={PREST_Y} farge="#44403c" skala={0.8} />
                <Person x={1130} y={PREST_Y} farge="#44403c" skala={0.8} />
                <Person x={720} y={PREST_Y} farge="#57534e" skala={0.7} />
                <Person x={1240} y={PREST_Y} farge="#57534e" skala={0.7} />
                <Stjerne x={980} y={PREST_Y - 150} r={30} />
            </Vis>

            {/* Brevet rundt biskopen */}
            <Vis k="bane" nar={beat >= 4}>
                <motion.path
                    d={brevBane}
                    fill="none"
                    stroke={BLA}
                    strokeWidth={6}
                    strokeDasharray="14 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.8, ease: 'easeInOut' }}
                />
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.5 }}
                >
                    <rect x={790} y={170} width={84} height={58} rx={6} fill="white" stroke={BLA} strokeWidth={4} />
                    <path d="M 790 172 L 832 206 L 874 172" fill="none" stroke={BLA} strokeWidth={4} />
                    <text x={1040} y={205} textAnchor="start" fontSize={34} fontWeight={900} fill="#7c2d12">
                        Frederik 4.
                    </text>
                </motion.g>
            </Vis>
        </g>
    );
}

function Kollegiet({ beat }: { beat: number }) {
    const steder = [
        { navn: 'India', x: 380 },
        { navn: 'Grønland', x: 800 },
        { navn: 'Samene', x: 1220 },
    ];
    return (
        <g>
            <text x={800} y={90} textAnchor="middle" fontSize={50} fontWeight={900} fill="#1c1917">
                Misjonskollegiet, 1714
            </text>

            {/* Kongen godkjenner */}
            <Person x={800} y={250} farge="#7c2d12" />
            <Krone x={800} y={158} />
            <Vis k="ja" nar={beat === 0}>
                <circle cx={920} cy={170} r={38} fill="white" stroke="#15803d" strokeWidth={5} />
                <path d="M 902 172 L 916 188 L 942 154" fill="none" stroke="#15803d" strokeWidth={8} strokeLinecap="round" />
            </Vis>

            {/* Kontoret */}
            <motion.g
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
            >
                <rect x={560} y={300} width={480} height={150} rx={10} fill="#e7e5e4" stroke="#57534e" strokeWidth={4} />
                <path d="M 540 304 L 800 240 L 1060 304 Z" fill="#a8a29e" stroke="#57534e" strokeWidth={4} />
                {[0, 1, 2, 3].map((i) => (
                    <rect key={i} x={600 + i * 110} y={340} width={60} height={80} fill="#fef3c7" stroke="#57534e" strokeWidth={3} />
                ))}
            </motion.g>
            <Vis k="kontor" nar={beat >= 1}>
                <text x={800} y={500} textAnchor="middle" fontSize={32} fontWeight={800} fill="#44403c">
                    Et kontor som styrer misjonen
                </text>
            </Vis>

            {/* Tre steder */}
            {steder.map((s) => (
                <Vis key={s.navn} k={s.navn} nar={beat >= 2}>
                    <motion.path
                        d={`M 800 525 Q ${(800 + s.x) / 2} 580 ${s.x} 645`}
                        fill="none"
                        stroke={s.navn === 'Samene' && beat >= 3 ? GULL : '#78716c'}
                        strokeWidth={s.navn === 'Samene' && beat >= 3 ? 8 : 5}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.1 }}
                    />
                    <rect
                        x={s.x - 150}
                        y={650}
                        width={300}
                        height={100}
                        rx={18}
                        fill="white"
                        stroke={s.navn === 'Samene' && beat >= 3 ? GULL : '#d6d3d1'}
                        strokeWidth={s.navn === 'Samene' && beat >= 3 ? 7 : 3}
                        opacity={s.navn !== 'Samene' && beat >= 3 ? 0.6 : 1}
                    />
                    <text x={s.x} y={714} textAnchor="middle" fontSize={40} fontWeight={900} fill="#1c1917" opacity={s.navn !== 'Samene' && beat >= 3 ? 0.5 : 1}>
                        {s.navn}
                    </text>
                </Vis>
            ))}

            {/* Von Westen får jobben */}
            <Vis k="leder" nar={beat >= 3}>
                <rect x={1000} y={780} width={460} height={90} rx={18} fill={GULL} />
                <text x={1230} y={820} textAnchor="middle" fontSize={30} fontWeight={900} fill="white">
                    Leder: von Westen
                </text>
                <text x={1230} y={855} textAnchor="middle" fontSize={26} fontWeight={700} fill="#fef3c7">
                    28. februar 1716
                </text>
            </Vis>
        </g>
    );
}
