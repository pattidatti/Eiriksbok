import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './kartFelles';

/**
 * Det Shaka forandret, sett fra siden: kastespyd på avstand, det korte stikkespydet, de store
 * skjoldene tett i tett, barbeint over steinete bakke, og avdelinger av unge menn i samme
 * alder. Ingen treff og ingen sårede: spydene i beat 0 lander i bakken mellom linjene.
 */

const HUD = '#3f2a1d';
const BLEKK = '#0f172a';

const OVERSKRIFTER = ['Før: kastespyd på avstand', 'Shaka: kort stikkespyd', 'Store skjold, tett i tett', 'Barbeint', 'Avdelinger etter alder'];

export function ZuluKrigere({ beat, playing }: VisualProps) {
    const overskrift = OVERSKRIFTER[Math.min(beat, OVERSKRIFTER.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#f6d9a6, #f3e7cc 55%)' }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <rect x={0} y={640} width={1600} height={260} fill="#c9b27c" />
                <path d="M 0 640 Q 400 610 800 640 T 1600 630 L 1600 650 L 0 650 Z" fill="#b59b62" />
                {beat === 0 && <Avstand playing={playing} />}
                {beat === 1 && <Spydene />}
                {beat === 2 && <Skjoldmur />}
                {beat === 3 && <Barbeint playing={playing} />}
                {beat >= 4 && <Avdelinger />}
            </svg>
            <Overskrift tekst={overskrift} />
        </div>
    );
}

function Skjold({ x, y, s = 1, monster = 0 }: { x: number; y: number; s?: number; monster?: number }) {
    const bunn = ['#f8fafc', '#1f1611', '#8b4513'][monster % 3];
    const flekk = ['#3f2a1d', '#f8fafc', '#f8fafc'][monster % 3];
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx={0} cy={0} rx={34} ry={66} fill={bunn} stroke={HUD} strokeWidth={4} />
            <ellipse cx={-10} cy={-26} rx={11} ry={14} fill={flekk} />
            <ellipse cx={12} cy={14} rx={9} ry={12} fill={flekk} />
            <ellipse cx={-6} cy={36} rx={7} ry={9} fill={flekk} />
            <line x1={0} y1={-76} x2={0} y2={76} stroke="#6b4423" strokeWidth={5} />
        </g>
    );
}

/** Kriger sett fra siden. `spyd`: hva han holder. */
function Kriger({
    x,
    y,
    s = 1,
    spyd,
    skjold = true,
    monster = 0,
    farge = HUD,
}: {
    x: number;
    y: number;
    s?: number;
    spyd?: 'kort' | 'langt';
    skjold?: boolean;
    monster?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <line x1={-8} y1={40} x2={-14} y2={100} stroke={farge} strokeWidth={12} strokeLinecap="round" />
            <line x1={8} y1={40} x2={16} y2={100} stroke={farge} strokeWidth={12} strokeLinecap="round" />
            <rect x={-16} y={-24} width={32} height={70} rx={14} fill={farge} />
            <circle cx={0} cy={-44} r={18} fill={farge} />
            {spyd === 'langt' && <line x1={10} y1={-110} x2={30} y2={60} stroke="#6b4423" strokeWidth={5} strokeLinecap="round" />}
            {spyd === 'kort' && (
                <g>
                    <line x1={26} y1={-40} x2={26} y2={40} stroke="#6b4423" strokeWidth={6} strokeLinecap="round" />
                    <path d="M 26 -76 L 34 -46 L 26 -38 L 18 -46 Z" fill="#cbd5e1" stroke="#475569" strokeWidth={2} />
                </g>
            )}
            {skjold && <Skjold x={-22} y={10} s={0.8} monster={monster} />}
        </g>
    );
}

function Etikett({ x, y, tekst, str = 38, farge = BLEKK }: { x: number; y: number; tekst: string; str?: number; farge?: string }) {
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={str} fontWeight={800} fill={farge} stroke="#fff" strokeWidth={7} paintOrder="stroke">
            {tekst}
        </text>
    );
}

/** Beat 0: to linjer langt fra hverandre. Spyd i bue som lander i bakken mellom dem. */
function Avstand({ playing }: { playing: boolean }) {
    return (
        <g>
            {[0, 1, 2, 3, 4].map((i) => (
                <Kriger key={i} x={150 + i * 80} y={540} s={0.9} spyd="langt" skjold={false} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
                <Kriger key={`m${i}`} x={1170 + i * 80} y={540} s={0.9} skjold={false} farge="#64748b" />
            ))}
            {[0, 1, 2].map((i) => {
                const fra = 480;
                const til = 720 + i * 90;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 1 }}
                        animate={playing ? { opacity: [0, 1, 1] } : { opacity: 1 }}
                        transition={{ duration: 2.2, delay: i * 0.5, repeat: playing ? Infinity : 0, repeatDelay: 1 }}
                    >
                        <path d={`M ${fra} 440 Q ${(fra + til) / 2} 200 ${til} 630`} fill="none" stroke="#6b4423" strokeWidth={3} strokeDasharray="6 12" />
                        <line x1={til - 12} y1={570} x2={til + 4} y2={640} stroke="#6b4423" strokeWidth={6} strokeLinecap="round" />
                    </motion.g>
                );
            })}
            <line x1={520} y1={760} x2={1130} y2={760} stroke={BLEKK} strokeWidth={5} />
            <path d="M 520 745 L 520 775 M 1130 745 L 1130 775" stroke={BLEKK} strokeWidth={5} />
            <Etikett x={825} y={820} tekst="lang avstand" />
        </g>
    );
}

/** Beat 1: det lange kastespydet mot det korte stikkespydet. */
function Spydene() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Kriger x={330} y={470} s={1.9} spyd="kort" skjold={false} />
            <rect x={720} y={220} width={780} height={420} rx={26} fill="#fff" fillOpacity={0.92} stroke={BLEKK} strokeWidth={3} />
            <line x1={780} y1={340} x2={1440} y2={340} stroke="#94a3b8" strokeWidth={7} strokeLinecap="round" />
            <path d="M 1440 340 L 1412 330 L 1412 350 Z" fill="#94a3b8" />
            <text x={1110} y={300} textAnchor="middle" fontSize={36} fontWeight={800} fill="#64748b">
                Før: langt kastespyd
            </text>
            <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
                <line x1={900} y1={510} x2={1180} y2={510} stroke="#6b4423" strokeWidth={10} strokeLinecap="round" />
                <path d="M 1180 494 L 1270 510 L 1180 526 Z" fill="#cbd5e1" stroke="#475569" strokeWidth={3} />
                <text x={1110} y={600} textAnchor="middle" fontSize={38} fontWeight={900} fill={BLEKK}>
                    Nå: kort stikkespyd i hånda
                </text>
            </motion.g>
        </motion.g>
    );
}

/** Beat 2: en vegg av skjold. */
function Skjoldmur() {
    return (
        <g>
            {Array.from({ length: 11 }, (_, i) => (
                <motion.g key={i} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}>
                    <circle cx={260 + i * 108} cy={350} r={22} fill={HUD} />
                    <Skjold x={260 + i * 108} y={470} s={1.55} monster={i % 2} />
                </motion.g>
            ))}
            <Etikett x={800} y={760} tekst="skjold av kuhud" str={44} />
            <Etikett x={800} y={820} tekst="tett i tett" str={44} />
        </g>
    );
}

/** Beat 3: sandalen er forbudt. Krigerne løper over steinene. */
function Barbeint({ playing }: { playing: boolean }) {
    const steiner = Array.from({ length: 18 }, (_, i) => [80 + i * 85 + (i % 3) * 14, 660 + (i % 4) * 22, 10 + (i % 3) * 7]);
    return (
        <g>
            {steiner.map(([x, y, r], i) => (
                <ellipse key={i} cx={x} cy={y} rx={r * 1.5} ry={r} fill="#8b8172" />
            ))}
            {/* Sandalen: såle med reimer */}
            <g transform="translate(260 300)">
                <path d="M -34 -96 Q 0 -120 34 -96 Q 46 -20 30 60 Q 22 104 0 106 Q -22 104 -30 60 Q -46 -20 -34 -96 Z" fill="#c2853d" stroke="#713f12" strokeWidth={5} />
                <path d="M -40 -50 Q 0 -80 40 -50" fill="none" stroke="#713f12" strokeWidth={10} strokeLinecap="round" />
                <path d="M -38 10 L 38 10" stroke="#713f12" strokeWidth={10} strokeLinecap="round" />
                <path d="M 0 -50 L 0 -96" stroke="#713f12" strokeWidth={8} strokeLinecap="round" />
                <motion.path
                    d="M -90 -120 L 90 120 M 90 -120 L -90 120"
                    stroke="#b91c1c"
                    strokeWidth={18}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                />
            </g>
            <Etikett x={260} y={490} tekst="sandaler forbudt" />
            {[0, 1, 2, 3].map((i) => (
                <motion.g
                    key={i}
                    initial={{ x: 0, y: 0 }}
                    animate={playing ? { x: [0, 140], y: [0, -10, 0, -10, 0] } : { x: 70, y: 0 }}
                    transition={{ duration: 2.4, repeat: playing ? Infinity : 0, repeatType: 'reverse', ease: 'linear' }}
                >
                    <Kriger x={640 + i * 170} y={520} s={1.1} spyd="kort" monster={i % 3} />
                </motion.g>
            ))}
            <Etikett x={1000} y={800} tekst="raskere over steinete bakke" str={42} />
        </g>
    );
}

/** Beat 4: avdelinger med hvert sitt skjoldmønster, og kongens gård bak. */
function Avdelinger() {
    const grupper = [
        { x: 320, monster: 0 },
        { x: 800, monster: 1 },
        { x: 1280, monster: 2 },
    ];
    return (
        <g>
            {/* Kongens gård: en ring av hus */}
            {Array.from({ length: 14 }, (_, i) => {
                const a = (i / 14) * Math.PI * 2;
                const x = 800 + Math.cos(a) * 700;
                const y = 250 + Math.sin(a) * 60;
                return (
                    <g key={i} transform={`translate(${x} ${y})`} opacity={0.6}>
                        <path d="M -30 10 Q 0 -40 30 10 Z" fill="#b59a6a" stroke="#8b7355" strokeWidth={3} />
                    </g>
                );
            })}
            {grupper.map((g, gi) => (
                <motion.g key={g.x} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.5 }}>
                    {Array.from({ length: 8 }, (_, i) => {
                        const rad = Math.floor(i / 4);
                        const kol = i % 4;
                        return <Skjold key={i} x={g.x - 135 + kol * 90 + rad * 30} y={430 + rad * 110} s={0.95} monster={g.monster} />;
                    })}
                    <rect x={g.x - 160} y={650} width={320} height={64} rx={14} fill="#fff" stroke={BLEKK} strokeWidth={3} />
                    <text x={g.x} y={694} textAnchor="middle" fontSize={32} fontWeight={800} fill={BLEKK}>
                        samme alder
                    </text>
                </motion.g>
            ))}
            <Etikett x={800} y={810} tekst="bodde og øvde sammen" str={44} />
        </g>
    );
}
