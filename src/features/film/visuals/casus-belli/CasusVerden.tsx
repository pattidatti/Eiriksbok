import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Verdens dom over en krigsgrunn. Til venstre: Irak, nabolandet og en ring av prikker som
 * står for resten av verden (ikke et antall land, bare «verden»). Til høyre: en måler som
 * spør om verden godtar grunnen.
 * «kuwait»: 1990. Verden samler seg i en koalisjon, og måleren går til JA.
 * «irak»: 2003. Påstanden om våpen, inspektørene som ikke finner noe, og måleren går til NEI.
 */

type Modus = 'kuwait' | 'irak';

const B = 1600;
const H = 900;
const SENTER: [number, number] = [520, 470];
const PRIKKER = 40;
const IRAK: [number, number] = [470, 470];
const KUWAIT: [number, number] = [640, 600];

const FARGE = {
    noytral: '#94a3b8',
    rod: '#dc2626',
    oransje: '#f97316',
    blaa: '#2563eb',
    gronn: '#16a34a',
    irak: '#b45309',
    kuwait: '#0d9488',
};

/** 0 = NEI, 1 = JA, null = ikke vist ennå. */
function malerFor(modus: Modus, beat: number): number | null {
    if (modus === 'kuwait') return beat === 0 ? null : beat === 1 ? 0.72 : 0.94;
    return beat <= 1 ? null : beat === 2 ? 0.35 : 0.08;
}

function prikkFor(modus: Modus, beat: number, i: number) {
    const v = (i / PRIKKER) * Math.PI * 2 - Math.PI / 2;
    const ring: [number, number] = [SENTER[0] + Math.cos(v) * 400, SENTER[1] + Math.sin(v) * 300];
    if (modus === 'kuwait') {
        if (beat >= 2) {
            // Koalisjonen samler seg ved Kuwait og presser Irak ut.
            const k = i * 2.399963;
            const r = 17 * Math.sqrt(i + 0.5);
            return {
                pos: [KUWAIT[0] + 200 + Math.cos(k) * r, KUWAIT[1] + 40 + Math.sin(k) * r * 0.6],
                farge: FARGE.blaa,
            };
        }
        return { pos: ring, farge: beat >= 1 ? FARGE.oransje : FARGE.noytral };
    }
    // Irak 2003: en liten gruppe går til krig, resten blir stående.
    const angriper = i < 6;
    if (angriper) {
        const k = i * 2.399963;
        const r = 22 * Math.sqrt(i + 0.5);
        return {
            pos: [IRAK[0] - 140 + Math.cos(k) * r, IRAK[1] - 140 + Math.sin(k) * r],
            farge: FARGE.blaa,
        };
    }
    return { pos: ring, farge: beat >= 3 ? FARGE.rod : FARGE.noytral };
}

export function CasusVerden({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kuwait';
    const maler = malerFor(modus, beat);
    const prikker = useMemo(
        () => Array.from({ length: PRIKKER }, (_, i) => prikkFor(modus, beat, i)),
        [modus, beat]
    );
    const irakUte = modus === 'kuwait' && beat >= 2;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f8fafc' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Irak og nabolandet */}
                <motion.circle
                    cx={IRAK[0]}
                    cy={IRAK[1]}
                    r={120}
                    fill="#fde7c7"
                    stroke={FARGE.irak}
                    strokeWidth={6}
                />
                <text
                    x={IRAK[0]}
                    y={IRAK[1] + 14}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill={FARGE.irak}
                >
                    Irak
                </text>
                {modus === 'kuwait' && (
                    <>
                        <motion.circle
                            cx={KUWAIT[0]}
                            cy={KUWAIT[1]}
                            r={52}
                            initial={false}
                            animate={{ fill: irakUte ? '#ccfbf1' : '#fecaca' }}
                            transition={{ duration: 1.2, delay: irakUte ? 1.6 : 0.8 }}
                            stroke={FARGE.kuwait}
                            strokeWidth={6}
                        />
                        <text
                            x={KUWAIT[0]}
                            y={KUWAIT[1] + 92}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={FARGE.kuwait}
                        >
                            Kuwait
                        </text>
                        <Pil
                            key={irakUte ? 'ut' : 'inn'}
                            fra={
                                irakUte
                                    ? [KUWAIT[0] - 20, KUWAIT[1] - 30]
                                    : [IRAK[0] + 90, IRAK[1] + 70]
                            }
                            til={
                                irakUte
                                    ? [IRAK[0] + 70, IRAK[1] + 40]
                                    : [KUWAIT[0] - 50, KUWAIT[1] - 20]
                            }
                            farge={irakUte ? FARGE.blaa : FARGE.rod}
                        />
                    </>
                )}
                {modus === 'irak' && (
                    <Pil
                        fra={[IRAK[0] - 110, IRAK[1] - 110]}
                        til={[IRAK[0] - 70, IRAK[1] - 70]}
                        farge={FARGE.blaa}
                    />
                )}

                {prikker.map((p, i) => (
                    <motion.circle
                        key={i}
                        r={13}
                        initial={false}
                        animate={{ cx: p.pos[0], cy: p.pos[1], fill: p.farge }}
                        transition={{ duration: 1.4, delay: (i % 10) * 0.06 + (i / PRIKKER) * 0.6 }}
                    />
                ))}

                <Maler verdi={maler} />
            </svg>

            <div
                className="absolute left-[3%] top-[4%] px-5 py-2 rounded-xl bg-white shadow-lg font-black text-slate-800"
                style={{ fontSize: '1.7rem' }}
            >
                {modus === 'kuwait' ? 'Kuwait, 1990' : 'Irak, 2003'}
            </div>

            <AnimatePresence mode="wait">
                <Lapp key={`${modus}-${beat}`} modus={modus} beat={beat} />
            </AnimatePresence>

            {modus === 'irak' && beat >= 2 && <Lupe />}
        </div>
    );
}

const LAPPER: Record<Modus, ({ tekst: string; farge: string } | null)[]> = {
    kuwait: [
        { tekst: 'Irak invaderer nabolandet', farge: FARGE.rod },
        { tekst: 'Verden: et åpenbart brudd på reglene', farge: '#c2410c' },
        { tekst: 'Koalisjonen driver Irak ut', farge: FARGE.blaa },
    ],
    irak: [
        { tekst: 'USA og allierte går til krig', farge: FARGE.blaa },
        { tekst: 'Påstand: masseødeleggelsesvåpen', farge: FARGE.rod },
        { tekst: 'Inspektørene: ingen bevis', farge: '#334155' },
        { tekst: 'Store deler av verden sier nei', farge: FARGE.rod },
    ],
};

function Lapp({ modus, beat }: { modus: Modus; beat: number }) {
    const l = LAPPER[modus][Math.min(beat, LAPPER[modus].length - 1)];
    if (!l) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute left-[3%] bottom-[5%] px-5 py-3 rounded-2xl bg-white shadow-xl font-black"
            style={{ fontSize: '1.7rem', color: l.farge, border: `4px solid ${l.farge}` }}
        >
            {l.tekst}
        </motion.div>
    );
}

/** Måleren: halvsirkel fra NEI (rødt) til JA (grønt). Nåla regnes ut, ikke roteres. */
function Maler({ verdi }: { verdi: number | null }) {
    const cx = 1250;
    const cy = 600;
    const r = 230;
    const v = verdi ?? 0.5;
    const vinkel = Math.PI - v * Math.PI;
    const nx = cx + Math.cos(vinkel) * (r - 40);
    const ny = cy - Math.sin(vinkel) * (r - 40);
    const bue = (fra: number, til: number) => {
        const a = Math.PI - fra * Math.PI;
        const b = Math.PI - til * Math.PI;
        return `M ${cx + Math.cos(a) * r} ${cy - Math.sin(a) * r} A ${r} ${r} 0 0 1 ${cx + Math.cos(b) * r} ${cy - Math.sin(b) * r}`;
    };
    return (
        <g>
            <text
                x={cx}
                y={cy - r - 80}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#0f172a"
            >
                Godtar verden grunnen?
            </text>
            <path d={bue(0, 0.33)} stroke={FARGE.rod} strokeWidth={46} fill="none" />
            <path d={bue(0.33, 0.67)} stroke="#e2e8f0" strokeWidth={46} fill="none" />
            <path d={bue(0.67, 1)} stroke={FARGE.gronn} strokeWidth={46} fill="none" />
            <text
                x={cx - r}
                y={cy + 70}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={FARGE.rod}
            >
                NEI
            </text>
            <text
                x={cx + r}
                y={cy + 70}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={FARGE.gronn}
            >
                JA
            </text>
            <motion.line
                x1={cx}
                y1={cy}
                initial={false}
                animate={{ x2: nx, y2: ny, opacity: verdi === null ? 0 : 1 }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
                stroke="#0f172a"
                strokeWidth={14}
                strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={22} fill="#0f172a" />
            {verdi === null && (
                <text
                    x={cx}
                    y={cy - 70}
                    textAnchor="middle"
                    fontSize={90}
                    fontWeight={900}
                    fill="#94a3b8"
                >
                    ?
                </text>
            )}
        </g>
    );
}

/** Inspektørenes lupe over Irak: ingenting å finne. */
function Lupe() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="absolute"
            style={{ left: '26%', top: '30%', width: '13%' }}
        >
            <svg viewBox="0 0 200 200" className="w-full">
                <circle
                    cx={80}
                    cy={80}
                    r={60}
                    fill="#ffffff"
                    fillOpacity={0.75}
                    stroke="#334155"
                    strokeWidth={14}
                />
                <line
                    x1={124}
                    y1={124}
                    x2={185}
                    y2={185}
                    stroke="#334155"
                    strokeWidth={22}
                    strokeLinecap="round"
                />
                <path
                    d="M 55 55 L 105 105 M 105 55 L 55 105"
                    stroke={FARGE.rod}
                    strokeWidth={14}
                    strokeLinecap="round"
                />
            </svg>
        </motion.div>
    );
}

function Pil({ fra, til, farge }: { fra: [number, number]; til: [number, number]; farge: string }) {
    const vinkel = (Math.atan2(til[1] - fra[1], til[0] - fra[0]) * 180) / Math.PI;
    return (
        <g>
            <motion.line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={farge}
                strokeWidth={12}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.3 }}
            />
            <motion.path
                d="M -28 -20 L 10 0 L -28 20 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
            />
        </g>
    );
}
