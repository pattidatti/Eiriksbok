import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Pengene og presset i Suez-krisen, tegnet som enkle skjemaer.
 * «demning»: Assuan-demningen, lånetilbudene som trekkes tilbake, og kanalpengene som tar over.
 * «pund»: Eisenhower blir rasende, frykten for at araberne går til Sovjet, og trusselen mot pundet.
 * «klemme»: Storbritannia og Frankrike klemt mellom pengepress og rakettrusler.
 */

type Modus = 'demning' | 'pund' | 'klemme';

const B = 1600;
const H = 900;
const BLEKK = '#0f172a';
const BRITISK = '#b91c1c';
const FRANSK = '#1d4ed8';
const USA = '#1e40af';
const SOVJET = '#7f1d1d';
const EGYPT = '#15803d';
const VANN = '#3b82f6';

export function SuezMakt({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'demning';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'demning' && <Demning beat={beat} />}
                {modus === 'pund' && <Pund beat={beat} />}
                {modus === 'klemme' && <Klemme beat={beat} />}
            </svg>
        </div>
    );
}

function Demning({ beat }: { beat: number }) {
    const laanBrutt = beat >= 2;
    const egyptEier = beat >= 3;
    return (
        <g>
            {/* Nilen */}
            <rect x={760} y={0} width={80} height={H} fill={VANN} />
            <motion.ellipse
                cx={800}
                cy={250}
                rx={190}
                initial={{ ry: 40, opacity: 0.4 }}
                animate={{ ry: 170, opacity: 0.85 }}
                transition={{ duration: 3 }}
                fill={VANN}
            />
            <motion.rect
                x={600}
                width={400}
                fill="#78716c"
                stroke="#44403c"
                strokeWidth={5}
                rx={8}
                initial={{ y: 450, height: 0 }}
                animate={{ y: 410, height: 60 }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
            />
            <Merke x={800} y={530} tekst="Assuan-demningen" />
            <Merke x={800} y={60} tekst="Nilen" liten farge="#1e3a8a" />

            {/* Lånetilbudene */}
            <Boks x={70} y={150} b={300} tekst="USA" farge={USA} />
            <Boks x={70} y={330} b={300} tekst="Storbritannia" farge={BRITISK} />
            {beat >= 1 && (
                <>
                    <Strom fra={[370, 195]} til={[600, 420]} farge="#ca8a04" brutt={laanBrutt} />
                    <Strom fra={[370, 375]} til={[600, 440]} farge="#ca8a04" brutt={laanBrutt} forsinkelse={0.3} />
                    <Merke
                        x={390}
                        y={600}
                        tekst={laanBrutt ? 'Tilbudet trekkes tilbake' : 'Tilbud om lån'}
                        farge={laanBrutt ? '#b91c1c' : '#854d0e'}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Boks x={1200} y={110} b={330} tekst="Østblokken" farge={SOVJET} />
                    <Boks x={1050} y={290} b={240} tekst="Nasser" farge={EGYPT} />
                    <Strom fra={[1290, 290]} til={[1340, 200]} farge={SOVJET} />
                </>
            )}

            {/* Kanalen og hvem som eier den */}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={1060} y={640} width={460} height={190} rx={18} fill="#ffffff" stroke={egyptEier ? EGYPT : BLEKK} strokeWidth={6} />
                    <rect x={1090} y={760} width={400} height={40} rx={8} fill={VANN} />
                    <text x={1290} y={695} textAnchor="middle" fontSize={40} fontWeight={900} fill={BLEKK}>
                        Suezkanalen
                    </text>
                    <text x={1290} y={742} textAnchor="middle" fontSize={30} fontWeight={800} fill={EGYPT}>
                        Eier nå: staten Egypt
                    </text>
                    <motion.g
                        initial={{ opacity: 0, scale: 1.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 16 }}
                        style={{ transformOrigin: '1290px 590px' }}
                    >
                        <g transform="rotate(-5 1290 590)">
                            <rect x={1110} y={555} width={360} height={70} rx={10} fill="#ffffff" stroke="#dc2626" strokeWidth={6} />
                            <text x={1290} y={592} textAnchor="middle" dominantBaseline="middle" fontSize={38} fontWeight={900} fill="#dc2626">
                                26. juli 1956
                            </text>
                        </g>
                    </motion.g>
                </motion.g>
            )}
            {beat >= 4 && (
                <>
                    <Strom fra={[1110, 640]} til={[990, 485]} farge={EGYPT} />
                    <Merke x={780} y={800} tekst="Kanalpengene betaler" farge={EGYPT} />
                </>
            )}
        </g>
    );
}

function Pund({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat <= 1 && (
                <motion.g key="usa" exit={{ opacity: 0 }}>
                    <motion.circle
                        cx={500}
                        cy={430}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={10}
                        initial={{ r: 180, opacity: 0.8 }}
                        animate={{ r: 300, opacity: 0 }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                    />
                    <rect x={260} y={280} width={480} height={300} rx={28} fill={USA} />
                    <text x={500} y={385} textAnchor="middle" fontSize={78} fontWeight={900} fill="#ffffff">
                        USA
                    </text>
                    <text x={500} y={450} textAnchor="middle" fontSize={34} fontWeight={700} fill="#bfdbfe">
                        President Eisenhower
                    </text>
                    <text x={500} y={530} textAnchor="middle" fontSize={46} fontWeight={900} fill="#fecaca">
                        Rasende
                    </text>
                    {beat >= 1 && (
                        <>
                            <Boks x={880} y={250} b={590} tekst="Krig bak ryggen hans" farge={BRITISK} />
                            <Boks x={880} y={440} b={590} tekst="Rett før presidentvalget" farge="#475569" forsinkelse={0.6} />
                            <Urne x={1175} y={700} />
                        </>
                    )}
                </motion.g>
            )}
            {beat === 2 && (
                <motion.g key="arabisk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Boks x={60} y={380} b={240} tekst="USA" farge={USA} />
                    <Boks x={1290} y={380} b={260} tekst="Sovjet" farge={SOVJET} />
                    <motion.g initial={{ x: 0 }} animate={{ x: 300 }} transition={{ duration: 3.5, ease: 'easeInOut' }}>
                        <rect x={430} y={350} width={440} height={150} rx={22} fill={EGYPT} />
                        <text x={650} y={415} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                            Den arabiske
                        </text>
                        <text x={650} y={465} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                            verden
                        </text>
                    </motion.g>
                    <Merke x={800} y={640} tekst="USAs frykt: over til Sovjets side" farge={BLEKK} />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g key="pund" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Merke x={800} y={95} tekst="USA truer med å selge britiske pund" farge={USA} />
                    <circle cx={480} cy={470} r={210} fill="#facc15" stroke="#a16207" strokeWidth={12} />
                    <text x={480} y={480} textAnchor="middle" dominantBaseline="middle" fontSize={260} fontWeight={900} fill="#a16207">
                        £
                    </text>
                    <motion.path
                        d="M 400 270 L 460 380 L 430 460 L 510 560 L 480 680"
                        fill="none"
                        stroke={BLEKK}
                        strokeWidth={9}
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1, duration: 1.2 }}
                    />
                    <rect x={830} y={240} width={660} height={460} rx={20} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
                    <line x1={890} y1={290} x2={890} y2={650} stroke="#94a3b8" strokeWidth={5} />
                    <line x1={890} y1={650} x2={1450} y2={650} stroke="#94a3b8" strokeWidth={5} />
                    <motion.path
                        d="M 900 330 L 1040 340 L 1150 380 L 1240 470 L 1330 570 L 1430 630"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={12}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0.35, 1] }}
                        strokeDasharray="22 18"
                        transition={{ delay: 1.6, duration: 2.4, repeat: Infinity }}
                    />
                    <text x={1160} y={300} textAnchor="middle" fontSize={40} fontWeight={900} fill="#b91c1c">
                        Hvis USA selger?
                    </text>
                    <Merke x={1160} y={790} tekst="Britisk økonomi i fare" farge="#b91c1c" />
                </motion.g>
            )}
        </AnimatePresence>
    );
}

function Klemme({ beat }: { beat: number }) {
    const ut = beat >= 1;
    const skremsel = beat >= 2;
    return (
        <g>
            <Merke x={800} y={85} tekst="USA og Sovjet på samme side" farge={BLEKK} />

            {/* Presset fra venstre: USA */}
            <motion.g initial={false} animate={{ opacity: skremsel ? 1 : 0.95 }}>
                <motion.path
                    d="M 60 380 L 470 380 L 470 320 L 600 450 L 470 580 L 470 520 L 60 520 Z"
                    fill={USA}
                    initial={{ x: -200 }}
                    animate={{ x: ut ? -40 : 0 }}
                    transition={{ duration: 1.2 }}
                />
                <text x={250} y={462} textAnchor="middle" dominantBaseline="middle" fontSize={84} fontWeight={900} fill="#facc15">
                    £
                </text>
                <Merke x={300} y={650} tekst="Pengepress" farge={USA} />
                {skremsel && <Merke x={300} y={720} tekst="Avgjorde i praksis krisen" farge={USA} liten />}
            </motion.g>

            {/* Presset fra høyre: Sovjet */}
            <motion.g initial={false} animate={{ opacity: skremsel ? 0.3 : 1 }} transition={{ duration: 1 }}>
                <motion.path
                    d="M 1540 380 L 1130 380 L 1130 320 L 1000 450 L 1130 580 L 1130 520 L 1540 520 Z"
                    fill={SOVJET}
                    initial={{ x: 200 }}
                    animate={{ x: ut ? 40 : 0 }}
                    transition={{ duration: 1.2 }}
                />
                <g transform="translate(1340 450) rotate(-90)">
                    <rect x={-20} y={-90} width={40} height={150} rx={18} fill="#e5e7eb" />
                    <path d="M -20 -70 Q 0 -140 20 -70 Z" fill="#f87171" />
                </g>
                <Merke x={1300} y={650} tekst="Rakettrusler" farge={SOVJET} />
            </motion.g>
            {skremsel && <Merke x={1300} y={720} tekst="Mer skremsel enn alvor" farge="#64748b" liten />}

            {/* Storbritannia og Frankrike i midten */}
            <motion.g
                initial={false}
                animate={{ y: ut ? 60 : 0, opacity: ut ? 0.75 : 1 }}
                transition={{ duration: 1.2 }}
            >
                <motion.rect
                    y={300}
                    height={150}
                    rx={18}
                    fill={BRITISK}
                    initial={{ x: 600, width: 400 }}
                    animate={{ x: ut ? 640 : 650, width: ut ? 320 : 300 }}
                    transition={{ duration: 1.2 }}
                />
                <motion.rect
                    y={460}
                    height={150}
                    rx={18}
                    fill={FRANSK}
                    initial={{ x: 600, width: 400 }}
                    animate={{ x: ut ? 640 : 650, width: ut ? 320 : 300 }}
                    transition={{ duration: 1.2 }}
                />
                <text x={800} y={378} textAnchor="middle" dominantBaseline="middle" fontSize={36} fontWeight={900} fill="#ffffff">
                    Storbritannia
                </text>
                <text x={800} y={538} textAnchor="middle" dominantBaseline="middle" fontSize={36} fontWeight={900} fill="#ffffff">
                    Frankrike
                </text>
            </motion.g>
            {ut && beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                    <line x1={800} y1={150} x2={800} y2={350} stroke="#475569" strokeWidth={8} />
                    <motion.path
                        d="M 800 160 L 920 175 L 905 215 L 920 255 L 800 240 Z"
                        fill="#ffffff"
                        stroke="#475569"
                        strokeWidth={4}
                        initial={{ scaleX: 0.2 }}
                        animate={{ scaleX: 1 }}
                        style={{ transformOrigin: '800px 200px' }}
                    />
                    <Merke x={800} y={780} tekst="Våpenhvile. De trekker seg ut." farge={BLEKK} />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <rect x={430} y={140} width={740} height={150} rx={22} fill={SOVJET} />
                    <text x={800} y={195} textAnchor="middle" dominantBaseline="middle" fontSize={34} fontWeight={700} fill="#fecaca">
                        Nikita Khrusjtsjov lærte:
                    </text>
                    <text x={800} y={250} textAnchor="middle" dominantBaseline="middle" fontSize={52} fontWeight={900} fill="#ffffff">
                        Atomtrusler virker
                    </text>
                </motion.g>
            )}
        </g>
    );
}

/** Et hvitt merke med tekst. Bredden regnes ut fra teksten. */
function Merke({
    x,
    y,
    tekst,
    farge = BLEKK,
    liten,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    liten?: boolean;
}) {
    const fs = liten ? 32 : 42;
    const bredde = tekst.length * fs * 0.56 + 60;
    return (
        <motion.g
            key={tekst}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        >
            <rect x={x - bredde / 2} y={y - fs * 0.85} width={bredde} height={fs * 1.7} rx={14} fill="#ffffff" stroke="#e2e8f0" strokeWidth={3} />
            <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Boks({
    x,
    y,
    b,
    tekst,
    farge,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    b: number;
    tekst: string;
    farge: string;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            <rect x={x} y={y} width={b} height={90} rx={16} fill={farge} />
            <text x={x + b / 2} y={y + 47} textAnchor="middle" dominantBaseline="middle" fontSize={40} fontWeight={900} fill="#ffffff">
                {tekst}
            </text>
        </motion.g>
    );
}

/** En pil med mynter. Brutt: pila blekner og får et rødt kryss. */
function Strom({
    fra,
    til,
    farge,
    brutt,
    forsinkelse = 0,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    brutt?: boolean;
    forsinkelse?: number;
}) {
    const vinkel = (Math.atan2(til[1] - fra[1], til[0] - fra[0]) * 180) / Math.PI;
    const mx = (fra[0] + til[0]) / 2;
    const my = (fra[1] + til[1]) / 2;
    return (
        <g>
            <motion.g initial={false} animate={{ opacity: brutt ? 0.25 : 1 }} transition={{ duration: 0.8 }}>
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
                    transition={{ duration: 1.1, delay: forsinkelse }}
                />
                <motion.path
                    d="M -30 -22 L 12 0 L -30 22 Z"
                    fill={farge}
                    transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: forsinkelse + 1 }}
                />
                {[0.3, 0.55].map((f) => (
                    <circle
                        key={f}
                        cx={fra[0] + (til[0] - fra[0]) * f}
                        cy={fra[1] + (til[1] - fra[1]) * f - 26}
                        r={16}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                    />
                ))}
            </motion.g>
            {brutt && (
                <motion.g initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: `${mx}px ${my}px` }}>
                    <circle cx={mx} cy={my} r={34} fill="#ffffff" stroke="#111827" strokeWidth={4} />
                    <path
                        d={`M ${mx - 16} ${my - 16} L ${mx + 16} ${my + 16} M ${mx + 16} ${my - 16} L ${mx - 16} ${my + 16}`}
                        stroke="#dc2626"
                        strokeWidth={9}
                        strokeLinecap="round"
                    />
                </motion.g>
            )}
        </g>
    );
}

function Urne({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <rect x={x - 90} y={y - 70} width={180} height={140} rx={12} fill="#ffffff" stroke="#475569" strokeWidth={6} />
            <rect x={x - 50} y={y - 78} width={100} height={14} rx={4} fill="#475569" />
            <motion.rect
                x={x - 30}
                width={60}
                height={70}
                rx={4}
                fill="#e0e7ff"
                stroke="#1e40af"
                strokeWidth={4}
                initial={{ y: y - 190 }}
                animate={{ y: y - 120 }}
                transition={{ delay: 1.4, duration: 1, repeat: Infinity, repeatDelay: 1 }}
            />
        </motion.g>
    );
}
