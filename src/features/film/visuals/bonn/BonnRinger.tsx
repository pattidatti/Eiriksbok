import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { GRAD_NAVN, GRUPPER, RINGER, RING_FARGE, TRADISJONER, type Grad } from './data';

/**
 * De fire ringene fra Bønnekompasset i artikkelen: retning, tid, kropp og ord.
 * «intro»: ringene kommer én og én, med spørsmålet som hører til, og til slutt de ni tradisjonene.
 * «alle»: alle ni side om side, med hvor fast hver ring er. Kolonnene lyser når stemmen
 * snakker om dem.
 */

type Modus = 'intro' | 'alle';

const B = 1600;
const H = 900;

const TEKST: Record<Modus, string[]> = {
    intro: ['Fire spørsmål', 'Retning', 'Tid', 'Kropp', 'Ord', 'Det folk gjør, ikke det de tror'],
    alle: [
        'Alle ni, side om side',
        'Ingen har bare faste eller bare frie regler',
        'Hver ring strammes for seg',
        'Retning og tid',
        'Kropp og ord',
    ],
};

/** Et merke for hvor fast regelen er: full, halv eller tom sirkel. */
function Merke({
    x,
    y,
    grad,
    farge,
    r = 24,
}: {
    x: number;
    y: number;
    grad: Grad;
    farge: string;
    r?: number;
}) {
    if (grad === 'fast') return <circle cx={x} cy={y} r={r} fill={farge} />;
    if (grad === 'fri')
        return <circle cx={x} cy={y} r={r - 3} fill="#ffffff" stroke={farge} strokeWidth={6} />;
    return (
        <g>
            <circle cx={x} cy={y} r={r - 3} fill="#ffffff" stroke={farge} strokeWidth={6} />
            <path d={`M ${x} ${y - r} A ${r} ${r} 0 0 0 ${x} ${y + r} Z`} fill={farge} />
        </g>
    );
}

function Intro({ beat }: { beat: number }) {
    const cx = 450;
    const cy = 540;
    const radier = [320, 250, 180, 110];
    const visNi = beat >= 5;
    return (
        <>
            {RINGER.map((r, i) => {
                const vis = beat >= i + 1;
                const aktiv = beat === i + 1;
                return (
                    <motion.circle
                        key={r.id}
                        cx={cx}
                        cy={cy}
                        r={radier[i]}
                        fill="none"
                        stroke={RING_FARGE[r.id]}
                        strokeWidth={46}
                        initial={{ opacity: 0, pathLength: 0 }}
                        animate={{
                            opacity: vis ? (aktiv || beat >= 5 || beat === 0 ? 1 : 0.45) : 0.08,
                            pathLength: vis ? 1 : 1,
                        }}
                        transition={{ duration: 0.8 }}
                    />
                );
            })}
            <circle cx={cx} cy={cy} r={64} fill="#0f172a" />
            <text
                x={cx}
                y={cy + 22}
                textAnchor="middle"
                fontSize={64}
                fontWeight={900}
                fill="#ffffff"
            >
                ?
            </text>
            {!visNi &&
                RINGER.map((r, i) => {
                    const vis = beat >= i + 1;
                    const y = 270 + i * 150;
                    return (
                        <motion.g
                            key={r.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: vis ? (beat === i + 1 ? 1 : 0.5) : 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <circle cx={900} cy={y} r={26} fill={RING_FARGE[r.id]} />
                            <text x={950} y={y + 14} fontSize={46} fontWeight={900} fill="#0f172a">
                                {r.navn}
                            </text>
                            <text x={950} y={y + 64} fontSize={36} fontWeight={600} fill="#475569">
                                {r.sporsmal}
                            </text>
                        </motion.g>
                    );
                })}
            {visNi &&
                GRUPPER.map((g, gi) => {
                    const liste = TRADISJONER.filter((t) => t.gruppe === g.id);
                    const y0 = 230 + gi * 210;
                    return (
                        <motion.g
                            key={g.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: gi * 0.4, duration: 0.5 }}
                        >
                            <text x={880} y={y0} fontSize={32} fontWeight={800} fill="#64748b">
                                {g.navn}
                            </text>
                            {liste.map((t, i) => (
                                <g key={t.id}>
                                    <circle cx={900} cy={y0 + 50 + i * 48} r={14} fill={t.farge} />
                                    <text
                                        x={930}
                                        y={y0 + 62 + i * 48}
                                        fontSize={36}
                                        fontWeight={800}
                                        fill="#0f172a"
                                    >
                                        {t.navn}
                                    </text>
                                </g>
                            ))}
                        </motion.g>
                    );
                })}
        </>
    );
}

function Alle({ beat }: { beat: number }) {
    const kol = [560, 700, 840, 980];
    const y0 = 250;
    const steg = 64;
    const lysKol = (i: number) =>
        beat === 2 || (beat === 3 && i <= 1) || (beat >= 4 && i >= 2) || beat <= 1;
    return (
        <>
            {/* Kolonnene: bakgrunn som lyser når ringen er i fokus */}
            {RINGER.map((r, i) => (
                <motion.rect
                    key={r.id}
                    x={kol[i] - 62}
                    y={y0 - 92}
                    width={124}
                    height={steg * 9 + 52}
                    rx={18}
                    fill={RING_FARGE[r.id]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 2 && lysKol(i) ? 0.16 : 0 }}
                    transition={{ duration: 0.5 }}
                />
            ))}
            {RINGER.map((r, i) => (
                <motion.text
                    key={r.id}
                    x={kol[i]}
                    y={y0 - 50}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill={RING_FARGE[r.id]}
                    animate={{ opacity: lysKol(i) ? 1 : 0.35 }}
                >
                    {r.navn}
                </motion.text>
            ))}
            {TRADISJONER.map((t, ri) => {
                const y = y0 + ri * steg;
                return (
                    <motion.g
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: beat === 0 ? ri * 0.12 : 0, duration: 0.4 }}
                    >
                        <circle cx={128} cy={y} r={12} fill={t.farge} />
                        <text x={154} y={y + 12} fontSize={34} fontWeight={800} fill="#0f172a">
                            {t.navn}
                        </text>
                        {RINGER.map((r, ci) => (
                            <motion.g key={r.id} animate={{ opacity: lysKol(ci) ? 1 : 0.3 }}>
                                <Merke
                                    x={kol[ci]}
                                    y={y}
                                    grad={t.grad[r.id]}
                                    farge={RING_FARGE[r.id]}
                                />
                                {r.id === 'tid' && t.faste && beat === 3 && (
                                    <text
                                        x={kol[ci]}
                                        y={y + 11}
                                        textAnchor="middle"
                                        fontSize={30}
                                        fontWeight={900}
                                        fill="#ffffff"
                                    >
                                        {t.faste}
                                    </text>
                                )}
                            </motion.g>
                        ))}
                    </motion.g>
                );
            })}
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {[
                        { id: 'sikhisme', tekst: 'Mest fast, men ikke bare fast' },
                        { id: 'jehovas-vitner', tekst: 'Mest fritt, men ikke bare fritt' },
                    ].map((m) => {
                        const ri = TRADISJONER.findIndex((t) => t.id === m.id);
                        const y = y0 + ri * steg;
                        return (
                            <g key={m.id}>
                                <rect
                                    x={100}
                                    y={y - 30}
                                    width={1480}
                                    height={60}
                                    rx={30}
                                    fill="none"
                                    stroke="#0f172a"
                                    strokeWidth={4}
                                />
                                <text
                                    x={1030}
                                    y={y + 11}
                                    fontSize={30}
                                    fontWeight={800}
                                    fill="#0f172a"
                                >
                                    {m.tekst}
                                </text>
                            </g>
                        );
                    })}
                </motion.g>
            )}
            {/* Forklaring nederst */}
            {(['fast', 'begge', 'fri'] as Grad[]).map((g, i) => (
                <g key={g}>
                    <Merke x={360 + i * 400} y={848} grad={g} farge="#334155" r={20} />
                    <text x={392 + i * 400} y={858} fontSize={28} fontWeight={700} fill="#334155">
                        {GRAD_NAVN[g]}
                    </text>
                </g>
            ))}
        </>
    );
}

export function BonnRinger({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'intro';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f8fafc' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'intro' ? <Intro beat={beat} /> : <Alle beat={beat} />}
            </svg>
            <Brikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
