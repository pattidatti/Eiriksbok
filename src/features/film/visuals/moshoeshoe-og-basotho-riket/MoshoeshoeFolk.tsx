import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';
import { Overskrift } from './felles';

/**
 * Folk og kveg, tegnet som et landskap fra siden. Kveg var rikdommen, og filmen viser
 * hvordan Moshoeshoe brukte den.
 * «flukt»: difaqane, hele folk på flukt, og Butha-Buthe som angripes.
 * «lan»: flyktningene kommer til fjellet og får låne kyr.
 * «fred»: regnet og vinden, og mange folk som blir ett.
 * «bot»: seirene i 1851 og 1852, og boten britene krevde.
 */

type Modus = 'flukt' | 'lan' | 'fred' | 'bot';

const BAKKE = 700;

/** En ku fra siden, med føttene i (x, y). */
function Ku({ x, y, s = 1, farge = '#7c4a24' }: { x: number; y: number; s?: number; farge?: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-26} y={-40} width={46} height={24} rx={8} fill={farge} />
            <rect x={16} y={-50} width={18} height={16} rx={5} fill={farge} />
            <path d="M 18 -50 l -4 -8 M 32 -50 l 4 -8" stroke="#f5efe0" strokeWidth={3} strokeLinecap="round" />
            <circle cx={-6} cy={-30} r={6} fill="#f5efe0" />
            {[-20, -10, 6, 14].map((lx) => (
                <rect key={lx} x={lx} y={-17} width={5} height={17} fill={farge} />
            ))}
        </g>
    );
}

/** Et menneske fra siden: hode og kropp. */
function Person({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-52} r={9} fill="#3f2a1d" />
            <path d="M -11 0 L -9 -40 Q 0 -46 9 -40 L 11 0 Z" fill={farge} />
        </g>
    );
}

/** En gruppe på seks mennesker. */
function Gruppe({ x, y, farge, s = 1 }: { x: number; y: number; farge: string; s?: number }) {
    return (
        <g>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <Person key={i} x={x + (i % 3) * 26 * s + (i >= 3 ? 13 * s : 0)} y={y - (i >= 3 ? 0 : 10) * s} farge={farge} s={s * (i >= 3 ? 1 : 0.92)} />
            ))}
        </g>
    );
}

/** Det flate fjellet fra siden. */
function Fjell({ x, bredde = 520 }: { x: number; bredde?: number }) {
    const topp = BAKKE - 260;
    return (
        <g>
            <path
                d={`M ${x - 80} ${BAKKE} L ${x + 30} ${topp} L ${x + bredde - 30} ${topp} L ${x + bredde + 80} ${BAKKE} Z`}
                fill="#9c7a55"
            />
            <path d={`M ${x + 30} ${topp} L ${x + bredde - 30} ${topp} L ${x + bredde - 20} ${topp + 22} L ${x + 20} ${topp + 22} Z`} fill="#c49a6c" />
            <rect x={x + 30} y={topp - 6} width={bredde - 60} height={8} fill="#9fae6a" />
        </g>
    );
}

function Landskap() {
    return (
        <>
            <rect width={1600} height={900} fill="#e9dfc6" />
            <path d="M 0 560 Q 300 470 620 540 T 1250 520 T 1600 540 L 1600 900 L 0 900 Z" fill="#d7c79d" />
            <rect y={BAKKE} width={1600} height={200} fill="#c2b07a" />
        </>
    );
}

function Tekst({ x, y, tekst, str = 40, farge = '#0f172a', anker = 'middle', delay = 0 }: { x: number; y: number; tekst: string; str?: number; farge?: string; anker?: 'middle' | 'start' | 'end'; delay?: number }) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
        >
            {tekst}
        </motion.text>
    );
}

const FARGER = ['#b45309', '#0f766e', '#7c3aed', '#be123c', '#1d4ed8', '#4d7c0f'];

function Flukt({ beat, playing }: { beat: number; playing: boolean }) {
    const grupper = [
        { x: 1260, y: BAKKE + 60, f: FARGER[0] },
        { x: 980, y: BAKKE + 150, f: FARGER[1] },
        { x: 720, y: BAKKE + 50, f: FARGER[2] },
        { x: 460, y: BAKKE + 150, f: FARGER[3] },
        { x: 200, y: BAKKE + 70, f: FARGER[4] },
    ];
    return (
        <>
            <Landskap />
            {beat === 0 && (
                <>
                    <Tekst x={800} y={330} tekst="difaqane" str={110} farge="#7c2d12" />
                    <Tekst x={800} y={420} tekst="omtrent «hamringen»" str={50} delay={0.6} />
                </>
            )}
            {grupper.map((g, i) => (
                <motion.g
                    key={i}
                    initial={{ x: 220, opacity: 1 }}
                    animate={{ x: beat >= 3 ? 260 : 0, opacity: beat >= 3 ? 0.35 : 1 }}
                    transition={{ duration: playing ? 6 : 0, ease: 'linear' }}
                >
                    <Gruppe x={g.x} y={g.y} farge={g.f} s={1.6} />
                    <motion.path
                        d={`M ${g.x + 150} ${g.y - 60} l 90 0 M ${g.x + 160} ${g.y - 30} l 60 0`}
                        stroke="#7c2d12"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= 1 ? 0.7 : 0 }}
                    />
                </motion.g>
            ))}
            {beat === 1 &&
                ['krig', 'tørke', 'sult'].map((o, i) => <Tekst key={o} x={400 + i * 400} y={360} tekst={o} str={72} farge="#b91c1c" delay={0.3 + i * 0.6} />)}
            {beat === 2 && (
                <>
                    <Tekst x={1560} y={300} tekst="Zulu-riket lenger øst" str={50} anker="end" farge="#7c2d12" />
                    <Tekst x={1560} y={370} tekst="men mange årsaker" str={40} anker="end" delay={1} />
                    <Pil fra={[1500, 420]} til={[1100, 480]} />
                </>
            )}
            {beat >= 3 && (
                <>
                    {[0, 1, 2, 3].map((i) => (
                        <g key={i} transform={`translate(${200 + i * 70} ${BAKKE - 10})`}>
                            <rect x={-26} y={-40} width={52} height={40} fill="#c8a77a" />
                            <path d="M -36 -38 L 0 -78 L 36 -38 Z" fill="#7a5b2e" />
                        </g>
                    ))}
                    <motion.ellipse
                        cx={305}
                        cy={BAKKE - 40}
                        rx={190}
                        ry={90}
                        fill="none"
                        stroke="#b91c1c"
                        strokeWidth={8}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ transformOrigin: `305px ${BAKKE - 40}px` }}
                    />
                    <Tekst x={305} y={BAKKE - 170} tekst="Butha-Buthe, 1822" str={46} farge="#b91c1c" />
                </>
            )}
        </>
    );
}

function Pil({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    return (
        <motion.path
            d={`M ${fra[0]} ${fra[1]} L ${til[0]} ${til[1]}`}
            stroke="#7c2d12"
            strokeWidth={8}
            strokeLinecap="round"
            markerEnd="url(#moshoeshoe-pil)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 }}
        />
    );
}

function Lan({ beat }: { beat: number }) {
    const grupper = [
        { x: 800, f: FARGER[1] },
        { x: 1070, f: FARGER[2] },
        { x: 1340, f: FARGER[3] },
    ];
    return (
        <>
            <Landskap />
            <Fjell x={60} bredde={460} />
            <Tekst x={290} y={BAKKE - 300} tekst="Thaba Bosiu" str={44} farge="#7c2d12" />
            {/* Flokken til Moshoeshoe */}
            {Array.from({ length: 9 }, (_, i) => {
                const g = Math.floor(i / 3);
                const mål = beat >= 1 ? { x: grupper[g].x + 10 + (i % 3) * 62, y: BAKKE + 175 } : { x: 130 + (i % 5) * 80, y: BAKKE + 80 + Math.floor(i / 5) * 60 };
                return (
                    <motion.g key={i} initial={false} animate={{ x: mål.x, y: mål.y }} transition={{ duration: 2.2, delay: (i % 3) * 0.25 }}>
                        <Ku x={0} y={0} s={1.2} />
                    </motion.g>
                );
            })}
            {Array.from({ length: 4 }, (_, i) => (
                <Ku key={`h${i}`} x={150 + i * 95} y={BAKKE + 190} s={1.2} />
            ))}
            {grupper.map((g, i) => (
                <motion.g key={i} initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 2, delay: i * 0.4 }}>
                    <Gruppe x={g.x} y={BAKKE + 95} farge={g.f} s={1.5} />
                </motion.g>
            ))}
            {beat === 0 && <Tekst x={1110} y={BAKKE - 90} tekst="flyktninger" str={56} />}
            {beat === 1 && <Tekst x={1110} y={BAKKE - 90} tekst="kyr til låns" str={56} farge="#7c4a24" />}
            {beat >= 2 &&
                ['melk', 'mat', 'en ny start'].map((o, i) => (
                    <Tekst key={o} x={grupper[i].x + 60} y={BAKKE - 90} tekst={o} str={52} farge="#0f766e" delay={0.3 + i * 0.6} />
                ))}
        </>
    );
}

/** Gresstrå som vokser eller tørker. */
function Gress({ x, bredde, hoyde, boy }: { x: number; bredde: number; hoyde: number; boy: number }) {
    return (
        <>
            {Array.from({ length: 16 }, (_, i) => {
                const gx = x + 20 + (i * (bredde - 40)) / 15;
                const h = hoyde * (0.7 + ((i * 37) % 10) / 30);
                return (
                    <motion.path
                        key={i}
                        initial={false}
                        animate={{ d: `M ${gx} ${BAKKE} Q ${gx + boy * 0.5} ${BAKKE - h * 0.6} ${gx + boy} ${BAKKE - h}` }}
                        transition={{ duration: 1.8, delay: i * 0.04 }}
                        stroke={hoyde > 60 ? '#4d7c0f' : '#a16207'}
                        strokeWidth={7}
                        strokeLinecap="round"
                        fill="none"
                    />
                );
            })}
        </>
    );
}

function Fred({ beat, playing }: { beat: number; playing: boolean }) {
    if (beat === 1 || beat === 2) {
        const regn = beat >= 1;
        const vind = beat >= 2;
        return (
            <>
                <rect width={1600} height={900} fill="#e9dfc6" />
                <rect x={60} y={150} width={700} height={680} rx={30} fill="#dbeafe" />
                <rect x={840} y={150} width={700} height={680} rx={30} fill={vind ? '#fde68a' : '#f1f5f9'} />
                <rect x={60} y={BAKKE} width={700} height={130} fill="#a3a36a" />
                <rect x={840} y={BAKKE} width={700} height={130} fill="#c2a46a" />
                {regn &&
                    Array.from({ length: 30 }, (_, i) => {
                        const rx = 90 + (i % 10) * 66;
                        const ry = 220 + Math.floor(i / 10) * 140;
                        return (
                            <motion.line
                                key={i}
                                x1={rx}
                                x2={rx - 8}
                                initial={{ y1: ry, y2: ry + 30 }}
                                animate={{ y1: [ry, ry + 140], y2: [ry + 30, ry + 170] }}
                                transition={{ duration: 0.9, repeat: playing ? Infinity : 0, ease: 'linear', delay: (i % 7) * 0.12 }}
                                stroke="#2563eb"
                                strokeWidth={5}
                                strokeLinecap="round"
                            />
                        );
                    })}
                <Gress x={60} bredde={700} hoyde={regn ? 170 : 30} boy={0} />
                <Gress x={840} bredde={700} hoyde={vind ? 40 : 120} boy={vind ? 60 : 0} />
                {vind &&
                    [0, 1, 2].map((i) => (
                        <motion.path
                            key={i}
                            d={`M 900 ${280 + i * 110} q 180 -40 360 0 t 240 -10`}
                            stroke="#a16207"
                            strokeWidth={7}
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.8 }}
                            transition={{ duration: 1.4, delay: i * 0.3 }}
                        />
                    ))}
                <Tekst x={410} y={230} tekst="Fred er som regnet" str={50} farge="#1d4ed8" />
                <Tekst x={410} y={290} tekst="som får gresset til å gro" str={36} />
                {vind && (
                    <>
                        <Tekst x={1190} y={230} tekst="Krig er som vinden" str={50} farge="#a16207" />
                        <Tekst x={1190} y={290} tekst="som tørker det bort" str={36} />
                    </>
                )}
            </>
        );
    }
    // Beat 0 og 3: mange folk rundt fjellet, som blir ett.
    const ett = beat >= 3;
    return (
        <>
            <Landskap />
            <Fjell x={540} bredde={520} />
            {Array.from({ length: 6 }, (_, i) => (
                <motion.g key={i} initial={false} animate={{ opacity: 1 }}>
                    <Gruppe x={ett ? 590 + (i % 3) * 150 + (i >= 3 ? 75 : 0) : 70 + i * 250 + (i >= 3 ? 40 : 0)} y={ett ? BAKKE - 262 - (i >= 3 ? 0 : 40) : BAKKE + 140} farge={ett ? '#8b3a1e' : FARGER[i]} s={ett ? 1.1 : 1.5} />
                </motion.g>
            ))}
            {beat === 0 && <Tekst x={800} y={250} tekst="avtaler, ikke erobring" str={56} farge="#0f766e" />}
            {ett && (
                <>
                    <Tekst x={800} y={BAKKE + 130} tekst="ett folk: basotho" str={64} farge="#7c2d12" />
                    <motion.g initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <rect x={1180} y={150} width={360} height={150} rx={24} fill="#fff" />
                        <foreignObject x={1180} y={160} width={360} height={140}>
                            <div className="text-center">
                                <div className="text-6xl font-black text-slate-900">
                                    ca. <TelleTall verdi={5000} />
                                </div>
                                <div className="text-3xl font-semibold text-slate-600">krigere</div>
                            </div>
                        </foreignObject>
                    </motion.g>
                </>
            )}
        </>
    );
}

function Stolpe({ y, bredde, farge, tekst, verdi, etikett }: { y: number; bredde: number; farge: string; tekst: string; verdi: string; etikett: string }) {
    return (
        <g>
            <Tekst x={120} y={y - 20} tekst={tekst} str={38} anker="start" />
            <motion.rect
                x={120}
                y={y}
                height={110}
                rx={14}
                fill={farge}
                initial={{ width: 0 }}
                animate={{ width: bredde }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
            />
            <motion.rect
                x={120}
                y={y}
                height={110}
                rx={14}
                fill="url(#moshoeshoe-kyr)"
                initial={{ width: 0 }}
                animate={{ width: bredde }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
            />
            <Tekst x={140 + bredde} y={y + 52} tekst={verdi} str={52} anker="start" delay={1.4} />
            <Tekst x={140 + bredde} y={y + 98} tekst={etikett} str={32} anker="start" farge="#475569" delay={1.4} />
        </g>
    );
}

function Bot({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <>
                <rect width={1600} height={900} fill="#efe7d4" />
                {['1851', '1852'].map((aar, i) => (
                    <motion.g key={aar} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.8 }}>
                        <rect x={330 + i * 520} y={260} width={420} height={380} rx={30} fill="#fff" stroke="#a16207" strokeWidth={6} />
                        <text x={540 + i * 520} y={420} textAnchor="middle" fontSize={110} fontWeight={900} fill="#7c2d12">
                            {aar}
                        </text>
                        <text x={540 + i * 520} y={520} textAnchor="middle" fontSize={46} fontWeight={800} fill="#0f766e">
                            basotho vinner
                        </text>
                    </motion.g>
                ))}
            </>
        );
    }
    return (
        <>
            <rect width={1600} height={900} fill="#efe7d4" />
            <Stolpe y={210} bredde={1000} farge="#7c4a24" tekst="Krevd av britene" verdi="10 000" etikett="kyr" />
            <Tekst x={120} y={400} tekst="og 1000 hester" str={36} anker="start" farge="#475569" delay={1.6} />
            {beat >= 2 && <Stolpe y={540} bredde={300} farge="#b45309" tekst="Sendt av Moshoeshoe" verdi="ca. 3000" etikett="kyr og noen hester" />}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: '1200px 640px' }}>
                    <rect x={1000} y={580} width={420} height={120} rx={16} fill="none" stroke="#b91c1c" strokeWidth={10} transform="rotate(-6 1210 640)" />
                    <text x={1210} y={665} textAnchor="middle" fontSize={70} fontWeight={900} fill="#b91c1c" transform="rotate(-6 1210 640)">
                        IKKE NOK
                    </text>
                </motion.g>
            )}
        </>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    flukt: ['Uro i det sørlige Afrika', 'Hele folk på flukt', 'Mange årsaker', '1822: Butha-Buthe angripes'],
    lan: ['Flyktninger kommer', 'Kyr til låns', 'Kveg er livet'],
    fred: ['Folk tas inn', 'Fred er som regnet', 'Krig er som vinden', 'Ett folk'],
    bot: ['Basotho vinner', '1852: britene krever bot', 'Moshoeshoe sender', 'Ikke nok for britene'],
};

export function MoshoeshoeFolk({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'lan';
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden">
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="moshoeshoe-pil" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c2d12" />
                    </marker>
                    <pattern id="moshoeshoe-kyr" width="60" height="55" patternUnits="userSpaceOnUse">
                        <g transform="translate(26 50) scale(0.8)" opacity={0.35}>
                            <rect x={-26} y={-40} width={46} height={24} rx={8} fill="#fff" />
                            <rect x={16} y={-50} width={18} height={16} rx={5} fill="#fff" />
                            {[-20, -10, 6, 14].map((lx) => (
                                <rect key={lx} x={lx} y={-17} width={5} height={17} fill="#fff" />
                            ))}
                        </g>
                    </pattern>
                </defs>
                {modus === 'flukt' && <Flukt beat={beat} playing={playing} />}
                {modus === 'lan' && <Lan beat={beat} />}
                {modus === 'fred' && <Fred beat={beat} playing={playing} />}
                {modus === 'bot' && <Bot beat={beat} />}
            </svg>
            <Overskrift tekst={overskrift} />
        </div>
    );
}
