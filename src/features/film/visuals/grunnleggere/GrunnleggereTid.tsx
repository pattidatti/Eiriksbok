import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tidslinjene i grunnleggerfilmen, i tre modus:
 * - jesus: år 30 (det historikere regner som sikkert, og det kristne tror) fram til Nikea 325.
 * - guruer: de ti guruene i sikhismen, én etter én, og boka som tok over i 1708.
 * - nyere: Báb 1844, Bahá'u'lláh 1863, Joseph Smith 1805-1844 og Russell på 1870-tallet.
 */

type Modus = 'jesus' | 'guruer' | 'nyere';

const B = 1600;
const H = 900;

const OVERSKRIFT: Record<Modus, string[]> = {
    jesus: [
        'Jesus grunnla ikke kristendommen',
        'Det historikere regner som sikkert',
        'Det kristne tror',
        'Religionen blir til',
        'Nesten 300 år senere',
    ],
    guruer: [
        'Sikhismen: Guru Nanak',
        'Ni guruer til',
        'Den tiende guruen',
        'En bok tar over',
        'Ingen levende guru',
    ],
    nyere: [
        'Grunnleggere i papirene',
        "Bahá'í: Báb",
        "Bahá'í: Bahá'u'lláh",
        'Mormonismen: Joseph Smith',
        'Jehovas vitner: Russell',
    ],
};

function Kort({
    x,
    y,
    tekst,
    farge,
    fs = 38,
    delay = 0.2,
    mork = false,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    fs?: number;
    delay?: number;
    mork?: boolean;
}) {
    const b = tekst.length * fs * 0.56 + 56;
    const venstre = Math.max(30, Math.min(B - 30 - b, x - b / 2));
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay }}
        >
            <rect
                x={venstre}
                y={y - fs * 1.15}
                width={b}
                height={fs * 1.8}
                rx={18}
                fill={mork ? farge : '#fff'}
                stroke={farge}
                strokeWidth={5}
            />
            <text
                x={venstre + b / 2}
                y={y + fs * 0.1}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={900}
                fill={mork ? '#fff' : '#0f172a'}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Stolpe({ x, y1, y2, farge }: { x: number; y1: number; y2: number; farge: string }) {
    return (
        <motion.line
            x1={x}
            x2={x}
            y1={y1}
            y2={y2}
            stroke={farge}
            strokeWidth={5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        />
    );
}

/* ---------- jesus ---------- */

const J_X0 = 160;
const J_X1 = 1440;
const J_Y = 560;
const jx = (ar: number) => J_X0 + (ar / 500) * (J_X1 - J_X0);

function Jesus({ beat }: { beat: number }) {
    return (
        <g>
            <line x1={J_X0} x2={J_X1} y1={J_Y} y2={J_Y} stroke="#475569" strokeWidth={6} />
            {[0, 100, 200, 300, 400, 500].map((ar) => (
                <g key={ar}>
                    <line
                        x1={jx(ar)}
                        x2={jx(ar)}
                        y1={J_Y - 12}
                        y2={J_Y + 12}
                        stroke="#475569"
                        strokeWidth={4}
                    />
                    <text
                        x={jx(ar)}
                        y={J_Y + 56}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#64748b"
                    >
                        {ar === 0 ? 'år 1' : `år ${ar}`}
                    </text>
                </g>
            ))}
            {beat === 0 && (
                <>
                    <Kort x={800} y={260} tekst="Kristne: Jesus er Gud" farge="#6366f1" mork />
                    <Kort
                        x={800}
                        y={400}
                        tekst="Men han var selv jøde"
                        farge="#3b82f6"
                        delay={0.8}
                    />
                </>
            )}
            {beat >= 1 && (
                <>
                    <motion.circle
                        cx={jx(30)}
                        cy={J_Y}
                        r={18}
                        fill="#0f766e"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                    <Stolpe x={jx(30)} y1={J_Y - 20} y2={330} farge="#0f766e" />
                    <Kort
                        x={jx(30) + 300}
                        y={300}
                        tekst="Historikere: levde, korsfestet ca. år 30"
                        farge="#0f766e"
                        fs={34}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Stolpe x={jx(30)} y1={J_Y + 70} y2={700} farge="#7c3aed" />
                    <Kort
                        x={jx(30) + 300}
                        y={730}
                        tekst="Kristne tror: han sto opp igjen"
                        farge="#7c3aed"
                        fs={34}
                    />
                </>
            )}
            {beat >= 3 && (
                <motion.rect
                    x={jx(30)}
                    y={J_Y - 14}
                    height={28}
                    rx={14}
                    fill="#6366f1"
                    initial={{ width: 0 }}
                    animate={{ width: beat >= 4 ? jx(325) - jx(30) : 70 }}
                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                />
            )}
            {beat === 3 && (
                <Kort
                    x={jx(30) + 380}
                    y={440}
                    tekst="Etter hans død: de første kristne"
                    farge="#6366f1"
                    fs={34}
                    delay={0.6}
                />
            )}
            {beat >= 4 && (
                <>
                    <text
                        x={(jx(30) + jx(325)) / 2}
                        y={J_Y - 40}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#4338ca"
                    >
                        nesten 300 år
                    </text>
                    <motion.circle
                        cx={jx(325)}
                        cy={J_Y}
                        r={20}
                        fill="#b45309"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                    />
                    <Kort
                        x={jx(325) + 120}
                        y={440}
                        tekst="325: Nikea, Kristus er ekte Gud"
                        farge="#b45309"
                        fs={34}
                        delay={1.4}
                        mork
                    />
                </>
            )}
        </g>
    );
}

/* ---------- guruer ---------- */

const G_Y = 500;
const gx = (i: number) => 140 + i * 116;

function Guruer({ beat }: { beat: number }) {
    const antall = beat === 0 ? 1 : 10;
    const levende = beat < 3;
    return (
        <g>
            <motion.line
                x1={gx(0)}
                x2={beat >= 3 ? 1390 : gx(antall - 1)}
                y1={G_Y}
                y2={G_Y}
                stroke="#fdba74"
                strokeWidth={8}
                initial={false}
                animate={{ x2: beat >= 3 ? 1390 : gx(antall - 1) }}
            />
            {Array.from({ length: antall }, (_, i) => {
                const fremhev = (beat === 0 && i === 0) || (beat === 2 && i === 9);
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: levende || beat === 3 ? 1 : 0.55 }}
                        transition={{ delay: beat === 1 && i > 0 ? 0.2 + i * 0.25 : 0 }}
                    >
                        <circle
                            cx={gx(i)}
                            cy={G_Y}
                            r={50}
                            fill={fremhev ? '#ea580c' : '#fb923c'}
                            stroke="#fff"
                            strokeWidth={5}
                        />
                        <text
                            x={gx(i)}
                            y={G_Y + 15}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#fff"
                        >
                            {i + 1}
                        </text>
                    </motion.g>
                );
            })}
            {beat === 0 && (
                <Kort x={gx(0) + 260} y={330} tekst="Guru Nanak, 1469-1539" farge="#ea580c" />
            )}
            {beat === 1 && (
                <Kort x={800} y={330} tekst="guru = lærer" farge="#ea580c" delay={2.2} />
            )}
            {beat === 2 && (
                <>
                    <Kort
                        x={gx(9) - 200}
                        y={300}
                        tekst="1708: Guru Gobind Singh"
                        farge="#ea580c"
                        mork
                    />
                    <Kort
                        x={gx(9) - 200}
                        y={640}
                        tekst="den siste guruen av kjøtt og blod"
                        farge="#ea580c"
                        fs={34}
                        delay={0.8}
                    />
                </>
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ transformOrigin: `1400px ${G_Y}px` }}
                >
                    <rect x={1310} y={G_Y - 70} width={90} height={140} rx={8} fill="#1e3a8a" />
                    <rect x={1400} y={G_Y - 70} width={90} height={140} rx={8} fill="#1e40af" />
                    <line
                        x1={1400}
                        x2={1400}
                        y1={G_Y - 70}
                        y2={G_Y + 70}
                        stroke="#fde68a"
                        strokeWidth={6}
                    />
                </motion.g>
            )}
            {beat === 3 && (
                <Kort x={1250} y={680} tekst="Guru Granth Sahib" farge="#1e40af" delay={1} mork />
            )}
            {beat === 4 && (
                <>
                    <Kort
                        x={1250}
                        y={680}
                        tekst="Guru Granth Sahib"
                        farge="#1e40af"
                        delay={0}
                        mork
                    />
                    <Kort
                        x={520}
                        y={700}
                        tekst="I dag: ingen levende guru"
                        farge="#b91c1c"
                        delay={0.5}
                    />
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        <circle cx={130} cy={690} r={36} fill="#b91c1c" />
                        <path
                            d="M 112 672 L 148 708 M 148 672 L 112 708"
                            stroke="#fff"
                            strokeWidth={9}
                            strokeLinecap="round"
                        />
                    </motion.g>
                </>
            )}
        </g>
    );
}

/* ---------- nyere ---------- */

const N_X0 = 160;
const N_X1 = 1440;
const N_Y = 600;
const nx = (ar: number) => N_X0 + ((ar - 1800) / 80) * (N_X1 - N_X0);

function Nyere({ beat }: { beat: number }) {
    return (
        <g>
            <line x1={N_X0} x2={N_X1} y1={N_Y} y2={N_Y} stroke="#475569" strokeWidth={6} />
            {[1800, 1820, 1840, 1860, 1880].map((ar) => (
                <g key={ar}>
                    <line
                        x1={nx(ar)}
                        x2={nx(ar)}
                        y1={N_Y - 12}
                        y2={N_Y + 12}
                        stroke="#475569"
                        strokeWidth={4}
                    />
                    <text
                        x={nx(ar)}
                        y={N_Y + 52}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#64748b"
                    >
                        {ar}
                    </text>
                </g>
            ))}
            {beat === 0 &&
                ['aviser', 'folketellinger', 'trykkerier'].map((t, i) => (
                    <Kort
                        key={t}
                        x={340 + i * 460}
                        y={330}
                        tekst={t}
                        farge="#475569"
                        delay={0.3 + i * 0.4}
                    />
                ))}
            {beat >= 1 && (
                <>
                    <Stolpe x={nx(1844)} y1={N_Y} y2={275} farge="#14b8a6" />
                    <Kort
                        x={nx(1844) - 40}
                        y={250}
                        tekst="1844: Báb står fram"
                        farge="#14b8a6"
                        fs={34}
                        mork={beat === 1}
                    />
                </>
            )}
            {beat === 1 && (
                <>
                    <Kort
                        x={nx(1844) - 40}
                        y={370}
                        tekst="porten"
                        farge="#14b8a6"
                        fs={34}
                        delay={0.6}
                    />
                    <motion.path
                        d={`M ${nx(1844) + 90} 370 L ${nx(1863) - 70} 370`}
                        stroke="#14b8a6"
                        strokeWidth={5}
                        fill="none"
                        strokeDasharray="14 10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    />
                    <Kort
                        x={nx(1863) + 60}
                        y={370}
                        tekst="en større utsending?"
                        farge="#14b8a6"
                        fs={30}
                        delay={1.2}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Stolpe x={nx(1863)} y1={N_Y} y2={395} farge="#14b8a6" />
                    <Kort
                        x={nx(1863)}
                        y={370}
                        tekst="1863: Bahá'u'lláh"
                        farge="#14b8a6"
                        fs={34}
                        mork={beat === 2}
                    />
                </>
            )}
            {beat >= 3 && (
                <>
                    <motion.rect
                        x={nx(1805)}
                        y={N_Y + 80}
                        height={34}
                        rx={17}
                        fill="#8b5cf6"
                        initial={{ width: 0 }}
                        animate={{ width: nx(1844) - nx(1805) }}
                        transition={{ duration: 1.2 }}
                    />
                    <Kort
                        x={(nx(1805) + nx(1844)) / 2}
                        y={790}
                        tekst="Joseph Smith, 1805-1844"
                        farge="#8b5cf6"
                        fs={34}
                        mork={beat === 3}
                    />
                    <Kort
                        x={nx(1844) + 260}
                        y={850}
                        tekst="så: delt i flere trossamfunn"
                        farge="#8b5cf6"
                        fs={30}
                        delay={1.4}
                    />
                </>
            )}
            {beat >= 4 && (
                <>
                    <motion.rect
                        x={nx(1870)}
                        y={N_Y - 16}
                        width={nx(1880) - nx(1870)}
                        height={32}
                        fill="#64748b"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                    <Stolpe x={nx(1875)} y1={N_Y + 60} y2={725} farge="#64748b" />
                    <Kort
                        x={1600}
                        y={770}
                        tekst="Historikere: Russell, 1870-tallet"
                        farge="#64748b"
                        fs={34}
                        mork
                    />
                </>
            )}
        </g>
    );
}

export function GrunnleggereTid({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'jesus';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f3efe6' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tekst}
                        x={B / 2}
                        y={100}
                        textAnchor="middle"
                        fontSize={58}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {tekst}
                    </motion.text>
                </AnimatePresence>
                {modus === 'jesus' && <Jesus beat={beat} />}
                {modus === 'guruer' && <Guruer beat={beat} />}
                {modus === 'nyere' && <Nyere beat={beat} />}
            </svg>
        </div>
    );
}
