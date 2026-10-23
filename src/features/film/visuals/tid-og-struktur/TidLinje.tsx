import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Fortellingen som fem kort på en linje, i den rekkefølgen ting skjedde. Leseren er en gul
 * markør som viser hvor teksten starter, og piler viser hopp bakover (tilbakeblikk) og hint
 * framover (frampek). Hver modus er ett grep.
 */

type Modus = 'medias' | 'tilbakeblikk' | 'frampek';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const KORT_X = [200, 500, 800, 1100, 1400];
const KORT_Y = 470;
const KORT_B = 260;
const KORT_H = 190;

interface Kort {
    tittel: string;
    tekst?: string;
    tone?: 'aktiv' | 'lys' | 'dempet' | 'ukjent' | 'skygge';
}

interface Pil {
    fra: number;
    til: number;
    /** 'over' bøyer seg over kortene, 'under' under dem. */
    side: 'over' | 'under';
    farge: string;
    etikett: string;
    stiplet?: boolean;
}

interface Steg {
    overskrift: string;
    kort: Kort[];
    leser?: number;
    piler: Pil[];
    /** Rett pil langs linja fra første til siste kort (kronologisk). */
    rett?: boolean;
    sitat?: string;
    merker?: string[];
}

const tom = (t: string): Kort => ({ tittel: t, tone: 'lys' });

const NUMMER = ['1', '2', '3', '4', '5'].map(tom);

const MEDIAS: Steg[] = [
    { overskrift: 'En historie, fra start til slutt', kort: NUMMER, piler: [], rett: true },
    {
        overskrift: 'Kronologisk: i den rekkefølgen det skjedde',
        kort: [{ tittel: '1', tekst: 'Det var en gang', tone: 'aktiv' }, ...NUMMER.slice(1)],
        leser: 0,
        piler: [],
        rett: true,
    },
    {
        overskrift: 'In medias res',
        kort: [
            tom('1'),
            tom('2'),
            { tittel: '3', tekst: 'Start her', tone: 'aktiv' },
            tom('4'),
            tom('5'),
        ],
        leser: 2,
        piler: [],
    },
    {
        overskrift: 'Latin: midt inn i begivenhetene',
        kort: [
            { tittel: '1', tone: 'dempet' },
            { tittel: '2', tone: 'dempet' },
            { tittel: '3', tekst: 'Pangstart', tone: 'aktiv' },
            tom('4'),
            tom('5'),
        ],
        leser: 2,
        piler: [],
    },
    {
        overskrift: 'Rett inn, uten forklaring',
        kort: [
            { tittel: '?', tekst: 'Hvem?', tone: 'ukjent' },
            { tittel: '?', tekst: 'Hvorfor?', tone: 'ukjent' },
            { tittel: '3', tekst: 'Pangstart', tone: 'aktiv' },
            tom('4'),
            tom('5'),
        ],
        leser: 2,
        piler: [],
        merker: ['en krangel', 'en biljakt', 'rett etter et mord'],
    },
    {
        overskrift: 'Leseren må finne ut av det selv',
        kort: [
            { tittel: '?', tekst: 'Hvem?', tone: 'ukjent' },
            { tittel: '?', tekst: 'Hvorfor?', tone: 'ukjent' },
            { tittel: '3', tekst: 'Pangstart', tone: 'aktiv' },
            tom('4'),
            tom('5'),
        ],
        leser: 2,
        piler: [
            {
                fra: 2,
                til: 0,
                side: 'over',
                farge: '#64748b',
                etikett: 'leseren leter',
                stiplet: true,
            },
        ],
        merker: ['krim', 'noveller'],
    },
];

const NAA: Kort = { tittel: 'I dag', tekst: 'redd for vann', tone: 'aktiv' };
const TILBAKE: Steg[] = [
    {
        overskrift: 'Tilbakeblikk: et hopp bakover i tid',
        kort: [tom('Før'), tom(''), tom(''), { tittel: 'Nå', tone: 'aktiv' }, tom('')],
        leser: 3,
        piler: [{ fra: 3, til: 0, side: 'over', farge: '#7c3aed', etikett: 'tilbake i tid' }],
    },
    {
        overskrift: 'En mann er redd for vann',
        kort: [{ tittel: '?', tone: 'ukjent' }, tom(''), tom(''), NAA, tom('')],
        leser: 3,
        piler: [],
    },
    {
        overskrift: 'Tilbakeblikket viser fortiden',
        kort: [
            { tittel: 'Som barn', tekst: 'holdt på å drukne', tone: 'aktiv' },
            tom(''),
            tom(''),
            { ...NAA, tone: 'lys' },
            tom(''),
        ],
        leser: 0,
        piler: [{ fra: 3, til: 0, side: 'over', farge: '#7c3aed', etikett: 'tilbakeblikk' }],
    },
    {
        overskrift: 'Fortiden forklarer nåtiden',
        kort: [
            { tittel: 'Som barn', tekst: 'holdt på å drukne', tone: 'lys' },
            tom(''),
            tom(''),
            NAA,
            tom(''),
        ],
        leser: 3,
        piler: [
            { fra: 3, til: 0, side: 'over', farge: '#7c3aed', etikett: 'tilbakeblikk' },
            { fra: 0, til: 3, side: 'under', farge: '#0f766e', etikett: 'derfor' },
        ],
    },
    {
        overskrift: 'Fortiden slipper ikke taket',
        kort: [
            { tittel: 'Sommeren', tekst: 'for ti år siden', tone: 'lys' },
            tom(''),
            tom(''),
            { tittel: 'Nå', tekst: 'alt minner ham', tone: 'aktiv' },
            tom(''),
        ],
        leser: 3,
        piler: [{ fra: 3, til: 0, side: 'over', farge: '#7c3aed', etikett: 'minnet' }],
        sitat: 'Alt minnet ham om den sommeren for ti år siden, den gangen hun fortsatt var i live.',
    },
];

const FRAMPEK: Steg[] = [
    {
        overskrift: 'Frampek: et hint om det som kommer',
        kort: [{ tittel: 'Nå', tone: 'aktiv' }, tom(''), tom(''), tom(''), tom('Senere')],
        leser: 0,
        piler: [{ fra: 0, til: 4, side: 'over', farge: '#b45309', etikett: 'hint', stiplet: true }],
    },
    {
        overskrift: 'En skygge kastes foran hendelsen',
        kort: [
            { tittel: 'Nå', tone: 'aktiv' },
            { tittel: '', tone: 'skygge' },
            { tittel: '', tone: 'skygge' },
            { tittel: '', tone: 'skygge' },
            { tittel: '?', tone: 'ukjent' },
        ],
        leser: 0,
        piler: [],
    },
    {
        overskrift: 'Kniven fra første kapittel',
        kort: [
            { tittel: 'Kapittel 1', tekst: 'en kniv nevnes', tone: 'aktiv' },
            tom(''),
            tom(''),
            tom(''),
            { tittel: 'Siste kapittel', tekst: 'kniven brukes', tone: 'lys' },
        ],
        leser: 0,
        piler: [
            { fra: 0, til: 4, side: 'over', farge: '#b45309', etikett: 'frampek', stiplet: true },
        ],
    },
    {
        overskrift: 'Et hint rett til leseren',
        kort: [
            { tittel: 'Nå', tone: 'aktiv' },
            tom(''),
            tom(''),
            tom(''),
            { tittel: 'Siste gang', tone: 'skygge' },
        ],
        leser: 0,
        piler: [
            { fra: 0, til: 4, side: 'over', farge: '#b45309', etikett: 'frampek', stiplet: true },
        ],
        sitat: 'Han visste ikke da at dette var siste gang han skulle se henne.',
    },
    {
        overskrift: 'Noe kommer. Men hva, og når?',
        kort: [
            { tittel: 'Nå', tone: 'aktiv' },
            { tittel: '?', tone: 'ukjent' },
            { tittel: '?', tone: 'ukjent' },
            { tittel: '?', tone: 'ukjent' },
            { tittel: '?', tone: 'ukjent' },
        ],
        leser: 0,
        piler: [
            { fra: 0, til: 4, side: 'over', farge: '#b45309', etikett: 'spenning', stiplet: true },
        ],
    },
];

const STEG: Record<Modus, Steg[]> = {
    medias: MEDIAS,
    tilbakeblikk: TILBAKE,
    frampek: FRAMPEK,
};

const TONE: Record<NonNullable<Kort['tone']>, { fyll: string; strek: string; tekst: string }> = {
    aktiv: { fyll: '#1e293b', strek: '#facc15', tekst: '#ffffff' },
    lys: { fyll: '#ffffff', strek: '#cbd5e1', tekst: '#334155' },
    dempet: { fyll: '#e2e8f0', strek: '#e2e8f0', tekst: '#94a3b8' },
    ukjent: { fyll: '#f1f5f9', strek: '#94a3b8', tekst: '#64748b' },
    skygge: { fyll: '#475569', strek: '#334155', tekst: '#e2e8f0' },
};

function PilBue({ pil }: { pil: Pil }) {
    // Pilene starter og slutter litt inn på kortet, så de ikke treffer «du er her»-merket.
    const retning = Math.sign(KORT_X[pil.til] - KORT_X[pil.fra]);
    const x1 = KORT_X[pil.fra] + retning * 95;
    const x2 = KORT_X[pil.til] - retning * 95;
    const over = pil.side === 'over';
    const y = over ? KORT_Y - KORT_H / 2 - 14 : KORT_Y + KORT_H / 2 + 14;
    const hoyde = Math.min(200, 70 + Math.abs(x2 - x1) * 0.14);
    const ty = over ? y - hoyde : y + hoyde;
    const d = `M ${x1} ${y} C ${x1} ${ty}, ${x2} ${ty}, ${x2} ${y}`;
    // Pilspissen peker rett ned (over) eller opp (under) mot målkortet.
    const spiss = over
        ? `${x2},${y + 4} ${x2 - 16},${y - 24} ${x2 + 16},${y - 24}`
        : `${x2},${y - 4} ${x2 - 16},${y + 24} ${x2 + 16},${y + 24}`;
    const midtY = over ? y - hoyde * 0.75 : y + hoyde * 0.75;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.path
                d={d}
                fill="none"
                stroke={pil.farge}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={pil.stiplet ? '4 22' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
            <motion.polygon
                points={spiss}
                fill={pil.farge}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            />
            <text
                x={(x1 + x2) / 2}
                y={midtY + (over ? -14 : 40)}
                textAnchor="middle"
                fontSize={38}
                fontWeight={800}
                fill={pil.farge}
                style={FONT}
            >
                {pil.etikett}
            </text>
        </motion.g>
    );
}

export function TidLinje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'medias';
    const liste = STEG[modus];
    const steg = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f5f3ee' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {/* Tidslinja: alltid i den rekkefølgen ting skjedde */}
                <line
                    x1={60}
                    y1={KORT_Y}
                    x2={1530}
                    y2={KORT_Y}
                    stroke="#cbd5e1"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <polygon
                    points={`1560,${KORT_Y} 1522,${KORT_Y - 22} 1522,${KORT_Y + 22}`}
                    fill="#cbd5e1"
                />
                <text
                    x={60}
                    y={KORT_Y + 150}
                    fontSize={34}
                    fontWeight={700}
                    fill="#94a3b8"
                    style={FONT}
                >
                    tidligere
                </text>
                <text
                    x={1530}
                    y={KORT_Y + 150}
                    textAnchor="end"
                    fontSize={34}
                    fontWeight={700}
                    fill="#94a3b8"
                    style={FONT}
                >
                    senere
                </text>
                {steg.rett && (
                    <motion.line
                        key={`rett-${modus}-${beat}`}
                        x1={KORT_X[0]}
                        y1={KORT_Y + KORT_H / 2 + 36}
                        x2={KORT_X[4]}
                        y2={KORT_Y + KORT_H / 2 + 36}
                        stroke="#0f766e"
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                    />
                )}
                {steg.kort.map((k, i) => {
                    const tone = TONE[k.tone ?? 'lys'];
                    const b = KORT_B;
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: steg.rett && beat === 0 ? i * 0.35 : 0,
                            }}
                        >
                            <motion.rect
                                initial={false}
                                animate={{
                                    x: KORT_X[i] - b / 2,
                                    width: b,
                                    fill: tone.fyll,
                                    stroke: tone.strek,
                                }}
                                y={KORT_Y - KORT_H / 2}
                                height={KORT_H}
                                rx={26}
                                strokeWidth={k.tone === 'aktiv' ? 8 : 4}
                                transition={{ duration: 0.6 }}
                            />
                            <text
                                x={KORT_X[i]}
                                y={KORT_Y + (k.tekst ? -10 : 22)}
                                textAnchor="middle"
                                fontSize={k.tittel.length > 9 ? 30 : k.tittel.length > 4 ? 38 : 64}
                                fontWeight={900}
                                fill={tone.tekst}
                                style={FONT}
                            >
                                {k.tittel}
                            </text>
                            {k.tekst && (
                                <text
                                    x={KORT_X[i]}
                                    y={KORT_Y + 44}
                                    textAnchor="middle"
                                    fontSize={k.tekst.length > 14 ? 29 : 34}
                                    fontWeight={600}
                                    fill={tone.tekst}
                                    opacity={0.9}
                                    style={FONT}
                                >
                                    {k.tekst}
                                </text>
                            )}
                        </motion.g>
                    );
                })}
                {/* Leseren: hvor teksten begynner, eller hvor vi er nå */}
                {steg.leser !== undefined && (
                    <motion.g
                        initial={false}
                        animate={{ x: KORT_X[steg.leser] }}
                        transition={{ type: 'spring', stiffness: 70, damping: 16 }}
                    >
                        <polygon points="0,372 -26,330 26,330" fill="#facc15" />
                        <rect x={-95} y={272} width={190} height={54} rx={27} fill="#facc15" />
                        <text
                            x={0}
                            y={316}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#1e293b"
                            style={FONT}
                        >
                            du er her
                        </text>
                    </motion.g>
                )}
                <AnimatePresence>
                    {steg.piler.map((p) => (
                        <PilBue key={`${p.fra}-${p.til}-${p.etikett}`} pil={p} />
                    ))}
                </AnimatePresence>
                {steg.merker && (
                    <g>
                        {steg.merker.map((m, i) => {
                            const x = 800 + (i - (steg.merker!.length - 1) / 2) * 360;
                            return (
                                <motion.g
                                    key={m}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.5 }}
                                >
                                    <rect
                                        x={x - 160}
                                        y={680}
                                        width={320}
                                        height={70}
                                        rx={35}
                                        fill="#ffffff"
                                        stroke="#1e293b"
                                        strokeWidth={4}
                                    />
                                    <text
                                        x={x}
                                        y={727}
                                        textAnchor="middle"
                                        fontSize={34}
                                        fontWeight={700}
                                        fill="#1e293b"
                                        style={FONT}
                                    >
                                        {m}
                                    </text>
                                </motion.g>
                            );
                        })}
                    </g>
                )}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={steg.overskrift}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-0 right-0 text-center font-black text-slate-900"
                    style={{ ...FONT, top: '5%', fontSize: '2.3rem' }}
                >
                    {steg.overskrift}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {steg.sitat && (
                    <motion.div
                        key={steg.sitat}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.8 }}
                        className="absolute left-1/2 -translate-x-1/2 rounded-2xl bg-slate-900 text-white shadow-xl text-center italic"
                        style={{
                            ...FONT,
                            bottom: '5%',
                            width: '82%',
                            padding: '0.8rem 1.4rem',
                            fontSize: '1.55rem',
                            fontWeight: 600,
                        }}
                    >
                        «{steg.sitat}»
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
