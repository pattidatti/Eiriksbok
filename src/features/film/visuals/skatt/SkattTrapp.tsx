import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Skatten på lønn. Tre moduser:
 * - deler: lønnen som en stolpe. Fradragene skjæres av, 22 prosent av resten, og trygdeavgiften.
 * - trapp: trinnskatten som en trapp med fem trinn.
 * - feil: den vanlige feilen. Den høyere satsen gjelder bare kronene over grensen.
 * Stolpene viser hvordan delene henger sammen, ikke målestokk.
 */

type Modus = 'deler' | 'trapp' | 'feil';

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                x={800}
                y={90}
                textAnchor="middle"
                fontSize={54}
                fontWeight={800}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

function Kort({
    x,
    y,
    b,
    linjer,
    farge,
    vis,
}: {
    x: number;
    y: number;
    b: number;
    linjer: string[];
    farge: string;
    vis: boolean;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: vis ? 1 : 0 }} transition={{ duration: 0.6 }}>
            <rect x={x} y={y} width={b} height={40 + linjer.length * 44} rx={20} fill="#ffffff" stroke={farge} strokeWidth={5} />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x + b / 2}
                    y={y + 54 + i * 44}
                    textAnchor="middle"
                    fontSize={i === 0 ? 36 : 30}
                    fontWeight={i === 0 ? 800 : 600}
                    fill={i === 0 ? farge : '#334155'}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

// ---------- Deler ----------

const L0 = 160;
const LB = 1280;
const FRADRAG = 420;

function Deler({ beat }: { beat: number }) {
    const delt = beat >= 1;
    const tittel = [
        'Den største delen: 22 prosent',
        'Lønn minus fradrag',
        'Personfradrag: alle får det',
        'Minstefradrag: for de som jobber',
        'Trygdeavgift: 7,6 prosent av lønnen',
    ][Math.min(beat, 4)];
    const alm0 = delt ? L0 + FRADRAG : L0;
    const almB = L0 + LB - alm0;
    return (
        <>
            <Overskrift tekst={tittel} />
            {delt && (
                <text x={L0} y={190} fontSize={34} fontWeight={700} fill="#334155">
                    Lønnen din
                </text>
            )}
            <rect x={L0} y={210} width={LB} height={120} rx={18} fill="#e2e8f0" />
            <motion.rect
                y={210}
                height={120}
                rx={18}
                fill="#94a3b8"
                initial={{ x: L0, width: 0 }}
                animate={{ x: L0, width: delt ? FRADRAG - 10 : 0 }}
                transition={{ duration: 1 }}
            />
            <motion.text
                x={L0 + FRADRAG / 2}
                y={282}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill="#ffffff"
                initial={{ opacity: 0 }}
                animate={{ opacity: delt ? 1 : 0 }}
                transition={{ delay: 0.8 }}
            >
                Fradrag
            </motion.text>
            <motion.rect
                y={210}
                height={120}
                rx={18}
                fill="#1d4ed8"
                initial={{ x: L0, width: LB }}
                animate={{ x: alm0, width: almB }}
                transition={{ duration: 1 }}
            />
            <motion.text
                y={282}
                textAnchor="middle"
                fontSize={38}
                fontWeight={800}
                fill="#ffffff"
                initial={{ x: L0 + LB / 2 }}
                animate={{ x: alm0 + almB / 2 }}
                transition={{ duration: 1 }}
            >
                Alminnelig inntekt
            </motion.text>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <path d={`M ${L0 + LB - 140} 340 L ${L0 + LB - 140} 380`} stroke="#ca8a04" strokeWidth={6} />
                <rect x={L0 + LB - 320} y={380} width={360} height={90} rx={20} fill="#ca8a04" />
                <text x={L0 + LB - 140} y={440} textAnchor="middle" fontSize={44} fontWeight={900} fill="#ffffff">
                    22 % skatt
                </text>
            </motion.g>
            <motion.text
                x={L0 + FRADRAG / 2}
                y={378}
                textAnchor="middle"
                fontSize={30}
                fontWeight={700}
                fill="#475569"
                initial={{ opacity: 0 }}
                animate={{ opacity: delt ? 1 : 0 }}
                transition={{ delay: 0.8 }}
            >
                ingen 22 % skatt av dette
            </motion.text>
            <Kort x={L0} y={420} b={480} linjer={['Personfradrag', '114 540 kr']} farge="#475569" vis={beat >= 2} />
            <Kort
                x={L0 + 520}
                y={420}
                b={460}
                linjer={['Minstefradrag', '46 % av lønnen,', 'men maks 95 700 kr']}
                farge="#475569"
                vis={beat >= 3}
            />
            {/* Trygdeavgiften */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 4 ? 1 : 0 }} transition={{ duration: 0.6 }}>
                <text x={L0} y={660} fontSize={34} fontWeight={700} fill="#334155">
                    Hele lønnen
                </text>
                <rect x={L0} y={680} width={LB} height={90} rx={16} fill="#e2e8f0" />
                <motion.rect
                    x={L0}
                    y={680}
                    height={90}
                    rx={16}
                    fill="#0d9488"
                    initial={{ width: 0 }}
                    animate={{ width: beat >= 4 ? LB * 0.076 : 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                />
                <text x={L0 + LB * 0.076 + 24} y={738} fontSize={36} fontWeight={800} fill="#0f766e">
                    7,6 % trygdeavgift: pensjoner og sykepenger
                </text>
            </motion.g>
        </>
    );
}

// ---------- Trapp ----------

const TRINN = [
    { navn: '0 %', grense: 'første 226 100 kr', fraBeat: 1, farge: '#94a3b8' },
    { navn: '1,7 %', grense: 'over 226 100 kr', fraBeat: 2, farge: '#5eead4' },
    { navn: '4 %', grense: 'over 318 300 kr', fraBeat: 3, farge: '#2dd4bf' },
    { navn: '…', grense: '', fraBeat: 3, farge: '#14b8a6' },
    { navn: '…', grense: '', fraBeat: 3, farge: '#0d9488' },
    { navn: '17,8 %', grense: 'over 1 467 200 kr', fraBeat: 4, farge: '#0f766e' },
];

function Trapp({ beat }: { beat: number }) {
    const B = 220;
    const X0 = 140;
    const GULV = 780;
    const tittel = ['Trinnskatt: en trapp med fem trinn', 'Bunnen: ingen trinnskatt', 'Trinn 1', 'Trinn 2, og videre opp', 'Det øverste trinnet'][
        Math.min(beat, 4)
    ];
    return (
        <>
            <Overskrift tekst={tittel} />
            <line x1={X0 - 20} x2={X0 + B * 6 + 20} y1={GULV} y2={GULV} stroke="#334155" strokeWidth={6} />
            <text x={X0 + B * 3} y={GULV + 60} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                Lønnen din →
            </text>
            {TRINN.map((t, i) => {
                const h = 30 + i * 85;
                const x = X0 + i * B;
                const vis = beat >= t.fraBeat;
                const ny = beat === t.fraBeat;
                return (
                    <g key={i}>
                        <rect
                            x={x}
                            y={GULV - h}
                            width={B - 8}
                            height={h}
                            rx={10}
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth={3}
                        />
                        <motion.rect
                            x={x}
                            width={B - 8}
                            rx={10}
                            fill={t.farge}
                            initial={{ y: GULV, height: 0 }}
                            animate={{ y: vis ? GULV - h : GULV, height: vis ? h : 0 }}
                            transition={{ duration: 0.9, delay: vis && t.navn === '…' ? 0.5 + (i - 3) * 0.3 : 0 }}
                        />
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: vis ? 1 : 0 }} transition={{ delay: 0.5 }}>
                            {i > 0 && h > 80 && (
                                <text x={x + (B - 8) / 2} y={GULV - 22} textAnchor="middle" fontSize={26} fontWeight={800} fill="#ffffff">
                                    {`trinn ${i}`}
                                </text>
                            )}
                            <text
                                x={x + (B - 8) / 2}
                                y={GULV - h - 24}
                                textAnchor="middle"
                                fontSize={ny ? 56 : 46}
                                fontWeight={900}
                                fill={t.navn === '…' ? '#94a3b8' : '#0f172a'}
                            >
                                {t.navn}
                            </text>
                            {t.grense && (
                                <text
                                    x={x + (B - 8) / 2}
                                    y={i === 0 ? GULV + 44 : GULV - h - (ny ? 92 : 82)}
                                    textAnchor="middle"
                                    fontSize={30}
                                    fontWeight={700}
                                    fill="#334155"
                                >
                                    {t.grense}
                                </text>
                            )}
                        </motion.g>
                    </g>
                );
            })}
        </>
    );
}

// ---------- Feilen ----------

const GRENSE = 430;

function Stolpe({ x, tittel, alt, vis, riktig }: { x: number; tittel: string; alt: boolean; vis: boolean; riktig: boolean }) {
    const TOPP = 250;
    const BUNN = 780;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: vis ? 1 : 0 }} transition={{ duration: 0.6 }}>
            <text x={x} y={200} textAnchor="middle" fontSize={40} fontWeight={800} fill={riktig ? '#0f766e' : '#b91c1c'}>
                {tittel}
            </text>
            <rect x={x - 130} y={TOPP} width={260} height={BUNN - TOPP} rx={16} fill="#2dd4bf" />
            <motion.rect
                x={x - 130}
                width={260}
                rx={16}
                fill="#dc2626"
                initial={{ y: TOPP, height: 0 }}
                animate={{ y: TOPP, height: vis ? (alt ? BUNN - TOPP : GRENSE - TOPP) : 0 }}
                transition={{ duration: 1, delay: 0.4 }}
            />
            <text x={x} y={riktig ? 352 : 330} textAnchor="middle" fontSize={30} fontWeight={800} fill="#ffffff">
                høyere sats
            </text>
            {riktig && (
                <text x={x} y={620} textAnchor="middle" fontSize={30} fontWeight={800} fill="#134e4a">
                    lavere sats
                </text>
            )}
        </motion.g>
    );
}

function Feil({ beat }: { beat: number }) {
    const tittel = ['Her gjør mange en feil', 'Det mange tror', 'Slik er det', 'En krone mer lønner seg alltid'][Math.min(beat, 3)];
    return (
        <>
            <Overskrift tekst={tittel} />
            {beat === 0 && (
                <g>
                    <rect x={670} y={250} width={260} height={530} rx={16} fill="#2dd4bf" />
                    <text x={800} y={540} textAnchor="middle" fontSize={34} fontWeight={800} fill="#134e4a">
                        Lønnen din
                    </text>
                </g>
            )}
            <Stolpe x={480} tittel="Feil" alt vis={beat >= 1} riktig={false} />
            <Stolpe x={1120} tittel="Riktig" alt={false} vis={beat >= 2} riktig />
            {/* Grensa */}
            <line x1={240} x2={1360} y1={GRENSE} y2={GRENSE} stroke="#0f172a" strokeWidth={5} strokeDasharray="16 10" />
            <text x={1380} y={GRENSE + 12} fontSize={30} fontWeight={800} fill="#0f172a">
                grense
            </text>
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 0.9 : 1 }} transition={{ delay: 1.2 }}>
                    <line x1={300} y1={280} x2={660} y2={760} stroke="#0f172a" strokeWidth={14} strokeLinecap="round" opacity={beat >= 2 ? 1 : 0} />
                    <line x1={660} y1={280} x2={300} y2={760} stroke="#0f172a" strokeWidth={14} strokeLinecap="round" opacity={beat >= 2 ? 1 : 0} />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <circle cx={1120} cy={234} r={22} fill="#facc15" stroke="#a16207" strokeWidth={4} />
                    <rect x={1260} y={200} width={300} height={60} rx={16} fill="#ffffff" stroke="#0d9488" strokeWidth={4} />
                    <text x={1410} y={241} textAnchor="middle" fontSize={30} fontWeight={800} fill="#0f766e">
                        + 1 krone
                    </text>
                </motion.g>
            )}
        </>
    );
}

export function SkattTrapp({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'deler';
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            {modus === 'deler' && <Deler beat={beat} />}
            {modus === 'trapp' && <Trapp beat={beat} />}
            {modus === 'feil' && <Feil beat={beat} />}
        </svg>
    );
}
