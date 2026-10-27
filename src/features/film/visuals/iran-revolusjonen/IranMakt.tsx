import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Makten i Iran som et snitt, i tre modus:
 * «sjah»: sjahens maktbygning. Kronen på taket, fire søyler som holder den oppe (SAVAK, hæren,
 * oljen og basarene) og folket under. Hemmelig politi, tause religiøse ledere, oljepenger som
 * går til toppen, og gapet som vokser.
 * «fall»: oljen og basarene har sviktet. Svart fredag, raseriet, hæren som går ut av bygningen,
 * og taket som raser sammen.
 * «faqih»: Khomeinis styresett. En lærd religiøs leder over presidenten, parlamentet og hæren.
 */

type Modus = 'sjah' | 'fall' | 'faqih';

const B = 1600;
const H = 900;

const SØYLER = [
    { id: 'savak', navn: 'SAVAK', x: 470 },
    { id: 'haer', navn: 'Hæren', x: 670 },
    { id: 'olje', navn: 'Oljen', x: 930 },
    { id: 'basar', navn: 'Basarene', x: 1130 },
] as const;
const SØYLE_B = 130;
const SØYLE_TOPP = 380;
const SØYLE_BUNN = 620;

const FOLK = Array.from({ length: 3 * 30 }, (_, i) => ({
    x: 140 + (i % 30) * 45 + (Math.floor(i / 30) % 2) * 22,
    y: 730 + Math.floor(i / 30) * 52,
}));
/** Folk som «forsvinner» når SAVAK slår til. */
const BORTE = new Set([4, 11, 19, 26, 33, 41, 48, 57, 63, 72, 80, 86]);
/** De religiøse lederne i folkemengden. */
const PRESTER = [36, 37, 38, 39, 40];

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    sjah: [
        { tekst: 'Sjahen: en diktator' },
        { tekst: 'SAVAK: det hemmelige politiet', rod: true },
        { tekst: 'Religiøse ledere må tie', rod: true },
        { tekst: 'Hvem får oljepengene?' },
        { tekst: 'Gapet vokser', rod: true },
    ],
    fall: [
        { tekst: 'September 1978: Svart fredag', rod: true },
        { tekst: 'Enda mer raseri', rod: true },
        { tekst: 'Soldatene nekter' },
        { tekst: 'Januar 1979: hæren tar ikke side' },
        { tekst: '16. januar 1979: sjahen drar' },
    ],
    faqih: [
        { tekst: 'Velayet-e faqih: de lærdes styre' },
        { tekst: 'En lærd religiøs leder' },
        { tekst: 'Over alle andre' },
        { tekst: 'Ikke et demokrati', rod: true },
        { tekst: 'Frihet?', rod: true },
    ],
};

export function IranMakt({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'sjah';
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-amber-50 to-stone-200">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'faqih' ? (
                    // Under sitatet tones skjemaet helt bort, så teksten ikke ligger under boksen.
                    <motion.g initial={false} animate={{ opacity: beat >= 4 ? 0 : 1 }}>
                        {beat < 4 && <Faqih beat={beat} />}
                    </motion.g>
                ) : (
                    <Bygning modus={modus} beat={beat} />
                )}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'faqih' && beat >= 4 && (
                    <motion.div
                        key="sitat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center bg-slate-950/80"
                    >
                        <div className="max-w-[80%] text-center">
                            <div className="text-white font-display font-black text-5xl leading-tight">
                                «Vi ville ha frihet.
                                <br />
                                <span className="text-amber-300">Vi fikk Khomeini.»</span>
                            </div>
                            <div className="mt-5 text-white/80 text-2xl font-semibold">
                                Iransk student
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Bygning({ modus, beat }: { modus: 'sjah' | 'fall'; beat: number }) {
    const sjah = modus === 'sjah';
    // Hvor taket og kronen er. I «fall» vipper taket og raser til slutt.
    const tak = sjah
        ? { y: 0, rotate: 0, opacity: 1 }
        : beat >= 4
          ? { y: 230, rotate: 14, opacity: 0.35 }
          : beat >= 3
            ? { y: 30, rotate: 6, opacity: 1 }
            : { y: 0, rotate: 0, opacity: 1 };
    const krone = !sjah && beat >= 4 ? { y: -420, opacity: 0 } : { y: 0, opacity: 1 };
    const folkY = sjah && beat >= 4 ? 40 : 0;

    return (
        <g>
            {/* Grunnmuren */}
            <rect x={350} y={SØYLE_BUNN} width={900} height={36} rx={6} fill="#a8a29e" />

            {SØYLER.map((s) => (
                <Søyle
                    key={s.id}
                    navn={s.navn}
                    x={s.x}
                    tilstand={søyleTilstand(modus, beat, s.id)}
                />
            ))}

            {/* Taket med kronen */}
            <motion.g
                initial={false}
                animate={tak}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                style={{ transformBox: 'view-box', transformOrigin: '470px 380px' }}
            >
                <path
                    d="M 350 330 L 800 255 L 1250 330 Z"
                    fill="#d6d3d1"
                    stroke="#78716c"
                    strokeWidth={6}
                />
                <rect
                    x={350}
                    y={330}
                    width={900}
                    height={50}
                    fill="#e7e5e4"
                    stroke="#78716c"
                    strokeWidth={6}
                />
                <motion.g
                    initial={false}
                    animate={krone}
                    transition={{ duration: 1.6, ease: 'easeIn' }}
                >
                    <Krone x={800} y={200} />
                    <text
                        x={800}
                        y={300}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#44403c"
                    >
                        Sjahen
                    </text>
                </motion.g>
            </motion.g>

            {/* Folket */}
            <motion.g initial={false} animate={{ y: folkY }} transition={{ duration: 1.4 }}>
                {FOLK.map((f, i) => (
                    <Person
                        key={i}
                        x={f.x}
                        y={f.y}
                        farge={personFarge(modus, beat, i)}
                        borte={sjah && beat >= 1 && BORTE.has(i)}
                        pulser={!sjah && beat >= 1}
                    />
                ))}
            </motion.g>
            <text
                x={70}
                y={790}
                fontSize={34}
                fontWeight={900}
                fill="#44403c"
                textAnchor="middle"
                transform="rotate(-90 70 790)"
            >
                Folket
            </text>

            {sjah && beat === 0 && (
                <Merknad x={1420} y={460} linjer={['Ingen kan', 'velge ham bort']} />
            )}
            {sjah && beat === 1 && (
                <Merknad x={180} y={460} linjer={['Fengslet.', 'Torturert.', 'Forsvant.']} rod />
            )}
            {sjah && beat === 2 && <Taus x={FOLK[38].x} y={FOLK[38].y - 90} />}
            {sjah && beat === 2 && (
                <Merknad x={180} y={460} linjer={['Religiøse', 'ledere', 'må tie']} />
            )}
            {sjah && beat >= 3 && <Oljepenger vis={beat >= 3} />}
            {sjah && beat >= 4 && <Gap />}

            {!sjah && beat === 0 && (
                <Merknad x={1420} y={300} linjer={['Oljen:', 'streik', 'Basarene:', 'stengt']} />
            )}
            {!sjah && beat === 2 && <Merknad x={1420} y={470} linjer={['Sønner', 'og brødre']} />}
        </g>
    );
}

type SøyleTilstand = { farge: string; y: number; x: number; sprukket: boolean; opacity: number };

function søyleTilstand(modus: 'sjah' | 'fall', beat: number, id: string): SøyleTilstand {
    const vanlig = { farge: '#f5f5f4', y: 0, x: 0, sprukket: false, opacity: 1 };
    if (modus === 'sjah') {
        if (id === 'savak' && beat >= 1) return { ...vanlig, farge: '#fecaca' };
        if (id === 'olje' && beat >= 3) return { ...vanlig, farge: '#fde68a' };
        return vanlig;
    }
    if (id === 'olje' || id === 'basar') return { ...vanlig, farge: '#d6d3d1', sprukket: true };
    if (id === 'haer') {
        if (beat >= 2) return { ...vanlig, farge: '#d6d3d1', x: -330, y: 60, opacity: 0.55 };
        return { ...vanlig, farge: '#fca5a5' };
    }
    return vanlig;
}

function personFarge(modus: 'sjah' | 'fall', beat: number, i: number) {
    if (modus === 'sjah') {
        if (beat === 2 && PRESTER.includes(i)) return '#15803d';
        if (beat >= 4) return '#78716c';
        return '#334155';
    }
    return beat >= 1 ? '#dc2626' : '#334155';
}

function Søyle({ navn, x, tilstand }: { navn: string; x: number; tilstand: SøyleTilstand }) {
    const midt = (SØYLE_TOPP + SØYLE_BUNN) / 2;
    return (
        <motion.g
            initial={false}
            animate={{ x: tilstand.x, y: tilstand.y, opacity: tilstand.opacity }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
        >
            <motion.rect
                x={x - SØYLE_B / 2}
                y={SØYLE_TOPP}
                width={SØYLE_B}
                height={SØYLE_BUNN - SØYLE_TOPP}
                rx={8}
                stroke="#78716c"
                strokeWidth={6}
                initial={false}
                animate={{ fill: tilstand.farge }}
                transition={{ duration: 0.9 }}
            />
            {tilstand.sprukket && (
                <path
                    d={`M ${x - 20} ${SØYLE_TOPP + 20} L ${x + 14} ${midt - 40} L ${x - 12} ${midt} L ${x + 22} ${midt + 50} L ${x - 6} ${SØYLE_BUNN - 10}`}
                    fill="none"
                    stroke="#44403c"
                    strokeWidth={6}
                />
            )}
            <text
                x={x}
                y={midt}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={40}
                fontWeight={900}
                fill="#292524"
                stroke="#f5f5f4"
                strokeWidth={8}
                paintOrder="stroke"
                transform={`rotate(-90 ${x} ${midt})`}
            >
                {navn}
            </text>
        </motion.g>
    );
}

function Krone({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 60} ${y + 30} L ${x - 66} ${y - 30} L ${x - 30} ${y} L ${x} ${y - 46} L ${x + 30} ${y} L ${x + 66} ${y - 30} L ${x + 60} ${y + 30} Z`}
            fill="#eab308"
            stroke="#854d0e"
            strokeWidth={6}
            strokeLinejoin="round"
        />
    );
}

function Person({
    x,
    y,
    farge,
    borte,
    pulser,
}: {
    x: number;
    y: number;
    farge: string;
    borte: boolean;
    pulser: boolean;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ opacity: borte ? 0.12 : 1, scale: pulser ? [1, 1.18, 1] : 1 }}
            transition={pulser ? { duration: 1.1, repeat: Infinity } : { duration: 1 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
            <motion.circle
                cx={x}
                cy={y - 14}
                r={9}
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 0.8 }}
            />
            <motion.path
                d={`M ${x - 14} ${y + 16} Q ${x} ${y - 10} ${x + 14} ${y + 16} Z`}
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 0.8 }}
            />
        </motion.g>
    );
}

function Merknad({ x, y, linjer, rod }: { x: number; y: number; linjer: string[]; rod?: boolean }) {
    const h = linjer.length * 48 + 36;
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
        >
            <rect
                x={x - 150}
                y={y - h / 2}
                width={300}
                height={h}
                rx={22}
                fill={rod ? '#b91c1c' : '#ffffff'}
                stroke={rod ? '#7f1d1d' : '#d6d3d1'}
                strokeWidth={4}
            />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={x}
                    y={y - h / 2 + 58 + i * 48}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill={rod ? '#ffffff' : '#1c1917'}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

/** En snakkeboble med et rødt kryss: de religiøse lederne får ikke si noe. */
function Taus({ x, y }: { x: number; y: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 14 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
            <path
                d={`M ${x - 90} ${y - 110} h 180 a 24 24 0 0 1 24 24 v 70 a 24 24 0 0 1 -24 24 h -70 l -20 34 l -20 -34 h -70 a 24 24 0 0 1 -24 -24 v -70 a 24 24 0 0 1 24 -24 Z`}
                fill="#ffffff"
                stroke="#15803d"
                strokeWidth={6}
            />
            <line
                x1={x - 50}
                y1={y - 90}
                x2={x + 50}
                y2={y - 10}
                stroke="#dc2626"
                strokeWidth={14}
                strokeLinecap="round"
            />
            <line
                x1={x + 50}
                y1={y - 90}
                x2={x - 50}
                y2={y - 10}
                stroke="#dc2626"
                strokeWidth={14}
                strokeLinecap="round"
            />
        </motion.g>
    );
}

/** Mynter fra oljesøylen opp til eliten og selskapene. Folket får én. */
function Oljepenger({ vis }: { vis: boolean }) {
    const mynter = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);
    if (!vis) return null;
    const fra = { x: 930, y: 500 };
    return (
        <g>
            <Merknad x={180} y={240} linjer={['Liten elite']} />
            <Merknad x={1420} y={240} linjer={['Vestlige', 'selskaper']} />
            {mynter.map((i) => {
                const mål = i % 2 === 0 ? { x: 180, y: 320 } : { x: 1420, y: 340 };
                return (
                    <motion.ellipse
                        key={i}
                        rx={26}
                        ry={10}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                        initial={{ cx: fra.x, cy: fra.y, opacity: 0 }}
                        animate={{
                            cx: mål.x + (i % 3) * 8 - 8,
                            cy: mål.y + Math.floor(i / 2) * 14,
                            opacity: 1,
                        }}
                        transition={{ duration: 1.2, delay: 0.6 + i * 0.2, ease: 'easeOut' }}
                    />
                );
            })}
            <motion.ellipse
                rx={14}
                ry={6}
                fill="#facc15"
                stroke="#a16207"
                strokeWidth={3}
                initial={{ cx: fra.x, cy: fra.y, opacity: 0 }}
                animate={{ cx: 800, cy: 690, opacity: 1 }}
                transition={{ duration: 1.2, delay: 2.8 }}
            />
        </g>
    );
}

/** En dobbelpil mellom toppen og folket: gapet mellom rik og fattig. */
function Gap() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <line x1={1330} y1={420} x2={1330} y2={720} stroke="#b91c1c" strokeWidth={10} />
            <path d="M 1305 440 L 1330 400 L 1355 440 Z" fill="#b91c1c" />
            <path d="M 1305 700 L 1330 740 L 1355 700 Z" fill="#b91c1c" />
            <text
                x={1360}
                y={560}
                fontSize={34}
                fontWeight={900}
                fill="#b91c1c"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Rik
            </text>
            <text
                x={1360}
                y={610}
                fontSize={34}
                fontWeight={900}
                fill="#b91c1c"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                og fattig
            </text>
        </motion.g>
    );
}

/** Khomeinis styresett: boka, den lærde lederen, og alt som ligger under ham. */
function Faqih({ beat }: { beat: number }) {
    const nede = beat >= 2;
    return (
        <g>
            {/* Boka med Guds lov */}
            <motion.g
                initial={false}
                animate={{ x: nede ? -470 : 0, y: nede ? -200 : 0, scale: nede ? 0.6 : 1 }}
                transition={{ duration: 1.2 }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
                <path
                    d="M 800 470 Q 690 430 560 450 L 560 650 Q 690 630 800 670 Z"
                    fill="#ecfdf5"
                    stroke="#166534"
                    strokeWidth={8}
                />
                <path
                    d="M 800 470 Q 910 430 1040 450 L 1040 650 Q 910 630 800 670 Z"
                    fill="#ecfdf5"
                    stroke="#166534"
                    strokeWidth={8}
                />
                <text
                    x={800}
                    y={740}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#166534"
                >
                    Guds lov
                </text>
            </motion.g>

            {/* Den lærde lederen */}
            <AnimatePresence>
                {beat >= 1 && (
                    <motion.g
                        key="leder"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: nede ? -95 : 0 }}
                        transition={{ duration: 1.1 }}
                    >
                        <circle cx={800} cy={300} r={48} fill="#1c1917" />
                        <ellipse cx={800} cy={262} rx={58} ry={26} fill="#1c1917" />
                        <path d="M 720 420 Q 800 330 880 420 Z" fill="#1c1917" />
                        {beat === 1 && (
                            <text x={1000} y={330} fontSize={40} fontWeight={900} fill="#166534">
                                Faqih: lærd leder
                            </text>
                        )}
                        {nede && (
                            <text
                                x={800}
                                y={460}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#166534"
                                stroke="#fffbeb"
                                strokeWidth={8}
                                paintOrder="stroke"
                            >
                                Øverste leder: Khomeini
                            </text>
                        )}
                    </motion.g>
                )}
            </AnimatePresence>

            {/* Alt som ligger under ham */}
            {nede &&
                (['Presidenten', 'Parlamentet', 'Hæren'] as const).map((n, i) => {
                    const x = 380 + i * 420;
                    return (
                        <motion.g
                            key={n}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 + i * 0.4 }}
                        >
                            <line
                                x1={800}
                                y1={395}
                                x2={x}
                                y2={690}
                                stroke="#166534"
                                strokeWidth={6}
                            />
                            <rect
                                x={x - 170}
                                y={690}
                                width={340}
                                height={100}
                                rx={20}
                                fill="#ffffff"
                                stroke="#a8a29e"
                                strokeWidth={5}
                            />
                            <text
                                x={x}
                                y={755}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#292524"
                            >
                                {n}
                            </text>
                        </motion.g>
                    );
                })}

            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 1.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                    <g transform="rotate(-8 800 560)">
                        <rect
                            x={430}
                            y={500}
                            width={740}
                            height={130}
                            rx={18}
                            fill="#fffbeb"
                            fillOpacity={0.9}
                            stroke="#b91c1c"
                            strokeWidth={10}
                        />
                        <text
                            x={800}
                            y={588}
                            textAnchor="middle"
                            fontSize={56}
                            fontWeight={900}
                            fill="#b91c1c"
                        >
                            ISLAMSK REPUBLIKK
                        </text>
                    </g>
                </motion.g>
            )}
        </g>
    );
}
