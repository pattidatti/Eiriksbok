import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './Overskrift';

/**
 * Striden om hvem Kristus var, og hva møtet i Nikea bestemte.
 * - strid: de kristne samlet, så Arius (Kristus skapt og lavere enn Gud, en tid da Kristus
 *   ikke fantes) mot Alexander (Faderen og Sønnen hører sammen). De kristne splittes.
 * - vedtak: «av samme vesen», Arius kastet ut, trosbekjennelsen 325 og 381, statens stempel.
 */

type Modus = 'strid' | 'vedtak';

const B = 1600;
const H = 900;
const ARIUS = '#c2410c';
const ALEX = '#1d4ed8';
const GULL = '#b45309';
const ROD = '#9f1239';

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** De kristne som prikker. Hver har en plass samlet og en plass i hver leir. */
const KRISTNE = Array.from({ length: 60 }, (_, i) => {
    const a = frø(i) * Math.PI * 2;
    const r = Math.sqrt(frø(i + 7)) * 150;
    const leir = i % 2;
    const ra = Math.sqrt(frø(i + 31)) * 110;
    const aa = frø(i + 53) * Math.PI * 2;
    return {
        samlet: [800 + Math.cos(a) * r * 1.6, 560 + Math.sin(a) * r] as [number, number],
        delt: [(leir ? 1180 : 420) + Math.cos(aa) * ra * 1.3, 640 + Math.sin(aa) * ra * 0.6] as [number, number],
        leir,
    };
});

export function LegitimitetNikea({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'strid';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f4efe6' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'strid' ? <Strid beat={beat} /> : <Vedtak beat={beat} />}
            </svg>
            <Overskrift tekst={overskrift(modus, beat)} />
        </div>
    );
}

function overskrift(modus: Modus, beat: number) {
    if (modus === 'strid') {
        return ['Hvem var Kristus?', 'Arius: Kristus er skapt', 'En tid uten Kristus?', 'Alexander: de hører sammen', 'Splittelse'][
            Math.min(beat, 4)
        ];
    }
    return ['Av samme vesen', 'Arius kastes ut', 'Den nikenske trosbekjennelsen', 'Staten bestemmer rett tro'][Math.min(beat, 3)];
}

function Tekst({ x, y, tekst, farge = '#334155', str = 48, forsinkelse = 0 }: { x: number; y: number; tekst: string; farge?: string; str?: number; forsinkelse?: number }) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={str}
            fontWeight={800}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Gud og Kristus som sirkler. Arius: Kristus liten og under. Alexander: like store, overlapper. */
function Arius({ x, y, forsinkelse = 0 }: { x: number; y: number; forsinkelse?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.6 }}>
            <circle cx={x} cy={y - 80} r={100} fill="#fed7aa" stroke={ARIUS} strokeWidth={6} />
            <text x={x} y={y - 64} textAnchor="middle" fontSize={50} fontWeight={900} fill={ARIUS}>
                Gud
            </text>
            <line x1={x} y1={y + 20} x2={x} y2={y + 86} stroke={ARIUS} strokeWidth={7} />
            <circle cx={x} cy={y + 150} r={64} fill="#ffedd5" stroke={ARIUS} strokeWidth={5} />
            <text x={x} y={y + 161} textAnchor="middle" fontSize={30} fontWeight={900} fill={ARIUS}>
                Kristus
            </text>
            <text x={x + 90} y={y + 66} textAnchor="start" fontSize={40} fontWeight={800} fill={ARIUS}>
                skapt av Gud
            </text>
        </motion.g>
    );
}

function Alexander({ x, y, forsinkelse = 0, stor = false }: { x: number; y: number; forsinkelse?: number; stor?: boolean }) {
    const r = stor ? 150 : 105;
    const d = stor ? 95 : 66;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.6 }}>
            <circle cx={x - d} cy={y} r={r} fill="#bfdbfe" fillOpacity={0.8} stroke={ALEX} strokeWidth={6} />
            <circle cx={x + d} cy={y} r={r} fill="#bfdbfe" fillOpacity={0.8} stroke={ALEX} strokeWidth={6} />
            <text x={x - d - r * 0.3} y={y + 12} textAnchor="middle" fontSize={stor ? 46 : 29} fontWeight={900} fill={ALEX}>
                Faderen
            </text>
            <text x={x + d + r * 0.3} y={y + 12} textAnchor="middle" fontSize={stor ? 46 : 29} fontWeight={900} fill={ALEX}>
                Sønnen
            </text>
        </motion.g>
    );
}

function Strid({ beat }: { beat: number }) {
    const delt = beat >= 4;
    return (
        <>
            {beat === 0 &&
                KRISTNE.map((k, i) => (
                    <motion.circle
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        cx={k.samlet[0]}
                        cy={k.samlet[1]}
                        r={20}
                        fill="#64748b"
                    />
                ))}
            {beat === 0 && <Tekst x={800} y={300} tekst="De kristne" str={56} />}

            {beat >= 1 && beat <= 3 && <Arius x={380} y={400} />}
            {beat >= 1 && beat <= 3 && <Tekst x={420} y={210} tekst="Arius, prest i Alexandria" farge={ARIUS} />}

            {beat === 2 && (
                <g>
                    <line x1={180} y1={800} x2={1420} y2={800} stroke="#94a3b8" strokeWidth={6} />
                    <Tekst x={1470} y={812} tekst="tid" str={40} farge="#64748b" />
                    <motion.rect x={180} y={712} height={40} rx={10} fill="#fdba74" initial={{ width: 0 }} animate={{ width: 1240 }} transition={{ duration: 1.4 }} />
                    <Tekst x={1000} y={704} tekst="Gud" farge={ARIUS} str={40} />
                    <motion.rect x={720} y={756} height={40} rx={8} fill={ARIUS} initial={{ width: 0 }} animate={{ width: 700 }} transition={{ delay: 1.2, duration: 1.2 }} />
                    <Tekst x={1070} y={788} tekst="Kristus" farge="#ffffff" str={32} forsinkelse={1.6} />
                    <Tekst x={450} y={870} tekst="En tid da Kristus ikke fantes" farge={ARIUS} str={44} forsinkelse={0.8} />
                </g>
            )}

            {beat === 3 && <Alexander x={1180} y={440} />}
            {beat === 3 && <Tekst x={1180} y={210} tekst="Biskop Alexander" farge={ALEX} />}
            {beat === 3 && <Tekst x={1180} y={640} tekst="hører sammen" farge={ALEX} str={52} />}
            {beat === 3 && <Tekst x={830} y={460} tekst="mot" str={60} farge="#475569" />}

            {delt && (
                <>
                    {KRISTNE.map((k, i) => (
                        <motion.circle
                            key={i}
                            initial={{ cx: k.samlet[0], cy: k.samlet[1] }}
                            animate={{ cx: k.delt[0], cy: k.delt[1] }}
                            transition={{ duration: 1.6, ease: 'easeInOut' }}
                            r={20}
                            fill={k.leir ? ALEX : ARIUS}
                        />
                    ))}
                    <motion.path
                        d="M 800 180 L 770 330 L 830 450 L 770 580 L 830 720 L 800 860"
                        fill="none"
                        stroke={ROD}
                        strokeWidth={8}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                    />
                    <Tekst x={420} y={420} tekst="Arius" farge={ARIUS} str={60} />
                    <Tekst x={1180} y={420} tekst="Alexander" farge={ALEX} str={60} />
                </>
            )}
        </>
    );
}

function Vedtak({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <>
                    <Alexander x={800} y={430} stor />
                    <motion.g initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 0.5 }} style={{ transformOrigin: '800px 720px' }}>
                        <rect x={460} y={660} width={680} height={110} rx={16} fill="#ffffff" stroke={ALEX} strokeWidth={6} />
                        <text x={800} y={734} textAnchor="middle" fontSize={60} fontWeight={900} fill={ALEX}>
                            av samme vesen
                        </text>
                    </motion.g>
                </>
            )}
            {beat === 1 && (
                <>
                    {/* Ringen av biskoper, og Arius som må ut */}
                    {Array.from({ length: 24 }, (_, i) => {
                        const a = (i / 24) * Math.PI * 2;
                        return <circle key={i} cx={700 + Math.cos(a) * 300} cy={480 + Math.sin(a) * 230} r={28} fill={ALEX} opacity={0.85} />;
                    })}
                    <motion.g initial={{ x: 0 }} animate={{ x: 720 }} transition={{ delay: 0.8, duration: 1.6, ease: 'easeInOut' }}>
                        <circle cx={700} cy={480} r={42} fill={ARIUS} />
                        <text x={700} y={570} textAnchor="middle" fontSize={48} fontWeight={900} fill={ARIUS}>
                            Arius
                        </text>
                    </motion.g>
                    <Tekst x={800} y={840} tekst="Ekskommunisert: kastet ut av kirken" farge={ROD} str={52} forsinkelse={1.6} />
                </>
            )}
            {beat >= 2 && (
                <>
                    <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <rect x={560} y={210} width={480} height={560} rx={20} fill="#fef9ec" stroke={GULL} strokeWidth={6} />
                        <rect x={540} y={190} width={520} height={44} rx={22} fill="#e9d5a6" stroke={GULL} strokeWidth={5} />
                        <rect x={540} y={746} width={520} height={44} rx={22} fill="#e9d5a6" stroke={GULL} strokeWidth={5} />
                        <text x={800} y={310} textAnchor="middle" fontSize={40} fontWeight={900} fill={GULL}>
                            Vi tror
                        </text>
                        {[370, 420, 470, 520, 570, 620, 670].map((y, i) => (
                            <rect key={y} x={620} y={y} width={i % 3 === 2 ? 260 : 360} height={14} rx={7} fill="#d6c7a1" />
                        ))}
                    </motion.g>
                    <Merke x={280} y={330} tekst="Nikea" tall="325" />
                    {beat >= 2 && <Merke x={1320} y={330} tekst="Konstantinopel" tall="381" forsinkelse={0.8} />}
                    {beat >= 2 && (
                        <motion.path
                            d="M 380 420 Q 800 140 1220 420"
                            fill="none"
                            stroke={GULL}
                            strokeWidth={6}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            opacity={0.5}
                        />
                    )}
                </>
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 1.8, rotate: -14 }}
                    animate={{ opacity: 1, scale: 1, rotate: -10 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 16 }}
                    style={{ transformOrigin: '800px 600px' }}
                >
                    <rect x={590} y={545} width={420} height={110} rx={18} fill="none" stroke={ROD} strokeWidth={10} />
                    <text x={800} y={622} textAnchor="middle" fontSize={56} fontWeight={900} fill={ROD}>
                        RETT TRO
                    </text>
                </motion.g>
            )}
            {beat >= 3 && <Tekst x={800} y={866} tekst="Bestemt med statens makt" farge={ROD} str={48} forsinkelse={0.8} />}
        </>
    );
}

function Merke({ x, y, tekst, tall, forsinkelse = 0 }: { x: number; y: number; tekst: string; tall: string; forsinkelse?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.5 }}>
            <circle cx={x} cy={y + 80} r={84} fill="#ffffff" stroke={GULL} strokeWidth={6} />
            <text x={x} y={y + 100} textAnchor="middle" fontSize={56} fontWeight={900} fill={GULL}>
                {tall}
            </text>
            <text x={x} y={y + 220} textAnchor="middle" fontSize={46} fontWeight={800} fill="#334155">
                {tekst}
            </text>
        </motion.g>
    );
}
