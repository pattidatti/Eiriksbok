import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Figurene i filmen: mannen som er lei seg (vis, ikke fortell), vannet der ulykken skjer,
 * Tord før og etter, og gården som deles. Ulykken vises aldri: bare båten, ringer i vannet
 * og en tom plass.
 */

type Modus = 'vis' | 'vannet' | 'forEtter' | 'gaven';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

/** En enkel figur. `boy` er hvor mye ryggen bøyer seg fremover (0-1). */
function Figur({
    x,
    y,
    hoyde = 360,
    boy = 0,
    har = '#3f2a1d',
    drakt = '#334155',
    blikkNed = false,
    rister = false,
    mager = false,
    bein = '#1e293b',
    playing = true,
}: {
    x: number;
    y: number;
    hoyde?: number;
    boy?: number;
    har?: string;
    drakt?: string;
    blikkNed?: boolean;
    rister?: boolean;
    mager?: boolean;
    bein?: string;
    playing?: boolean;
}) {
    const s = hoyde / 360;
    const kropp = mager ? 70 : 92;
    const hodeX = boy * 70;
    const hodeY = -300 + boy * 50;
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            {/* Bein */}
            <rect x={-32} y={-150} width={26} height={150} rx={10} fill={bein} />
            <rect x={6} y={-150} width={26} height={150} rx={10} fill={bein} />
            {/* Kropp, bøyd fremover rundt hofta */}
            <g transform={`rotate(${boy * 28} 0 -150)`}>
                <rect x={-kropp / 2} y={-270} width={kropp} height={130} rx={30} fill={drakt} />
                {/* Armer */}
                <motion.g
                    animate={rister && playing ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                    transition={rister ? { duration: 0.35, repeat: Infinity } : { duration: 0.2 }}
                >
                    <rect
                        x={-kropp / 2 - 18}
                        y={-262}
                        width={20}
                        height={120}
                        rx={10}
                        fill={drakt}
                    />
                    <rect x={kropp / 2 - 2} y={-262} width={20} height={120} rx={10} fill={drakt} />
                    <circle cx={-kropp / 2 - 8} cy={-136} r={13} fill="#f1c9a5" />
                    <circle cx={kropp / 2 + 8} cy={-136} r={13} fill="#f1c9a5" />
                </motion.g>
            </g>
            {/* Hode */}
            <g transform={`translate(${hodeX} ${hodeY})`}>
                <circle cx={0} cy={0} r={38} fill="#f1c9a5" />
                <path d="M -38 -6 Q -36 -44 0 -44 Q 36 -44 38 -6 Q 20 -24 -38 -6 Z" fill={har} />
                <motion.g initial={false} animate={{ y: blikkNed ? 12 : 0, x: blikkNed ? -10 : 0 }}>
                    <circle cx={-12} cy={2} r={4.5} fill="#1e293b" />
                    <circle cx={13} cy={2} r={4.5} fill="#1e293b" />
                </motion.g>
            </g>
        </g>
    );
}

function Kort({
    x,
    y,
    b,
    tittel,
    tekst,
    tone = 'lys',
    strek = false,
}: {
    x: number;
    y: number;
    b: number;
    tittel: string;
    tekst?: string;
    tone?: 'lys' | 'rod' | 'gronn' | 'mork';
    strek?: boolean;
}) {
    const farger = {
        lys: ['#ffffff', '#cbd5e1', '#0f172a'],
        rod: ['#fef2f2', '#dc2626', '#7f1d1d'],
        gronn: ['#f0fdf4', '#16a34a', '#14532d'],
        mork: ['#1e293b', '#475569', '#f8fafc'],
    }[tone];
    const h = tekst ? 140 : 90;
    return (
        <motion.g
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <rect
                x={x}
                y={y}
                width={b}
                height={h}
                rx={22}
                fill={farger[0]}
                stroke={farger[1]}
                strokeWidth={5}
            />
            <text
                x={x + 34}
                y={y + 58}
                fontSize={44}
                fontWeight={900}
                fill={farger[2]}
                style={FONT}
            >
                {tittel}
            </text>
            {tekst && (
                <text
                    x={x + 34}
                    y={y + 108}
                    fontSize={32}
                    fontWeight={600}
                    fill={farger[2]}
                    opacity={0.85}
                    style={FONT}
                >
                    {tekst}
                </text>
            )}
            {strek && (
                <motion.line
                    x1={x + 20}
                    x2={x + b - 20}
                    y1={y + h / 2}
                    y2={y + h / 2}
                    stroke="#dc2626"
                    strokeWidth={8}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                />
            )}
        </motion.g>
    );
}

function Vis({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <g>
            <rect width={1600} height={900} fill="#f1f5f9" />
            <rect y={760} width={1600} height={140} fill="#cbd5e1" />
            <Figur
                x={1120}
                y={780}
                hoyde={520}
                boy={beat >= 1 ? 0.25 : 0}
                blikkNed={beat >= 1}
                rister={beat >= 2}
                playing={playing}
            />
            <AnimatePresence>
                <Kort
                    key="fortell"
                    x={120}
                    y={110}
                    b={620}
                    tittel="«Han var lei seg.»"
                    tekst="Fortelle (tell)"
                    tone="rod"
                    strek={beat >= 1}
                />
                {beat >= 1 && (
                    <Kort
                        key="oyne"
                        x={120}
                        y={300}
                        b={620}
                        tittel="Ser ikke opp"
                        tekst="unngår øyekontakt"
                    />
                )}
                {beat >= 2 && (
                    <Kort
                        key="hender"
                        x={120}
                        y={480}
                        b={620}
                        tittel="Hendene rister"
                        tekst="kroppen viser følelsen"
                    />
                )}
                {beat >= 3 && (
                    <Kort key="vis" x={120} y={660} b={620} tittel="Vise (show)" tone="gronn" />
                )}
            </AnimatePresence>
        </g>
    );
}

function Robat({ to, tom }: { to: boolean; tom: boolean }) {
    return (
        <g>
            <path d="M -150 0 Q -120 46 0 50 Q 120 46 160 -6 Z" fill="#7c4a2d" />
            <path d="M -150 0 L 160 -6" stroke="#5b3520" strokeWidth={8} />
            {/* Faren */}
            <g transform="translate(-60 -4)">
                <rect x={-20} y={-80} width={40} height={78} rx={14} fill="#1e293b" />
                <circle cx={0} cy={-100} r={22} fill="#f1c9a5" />
                <line x1={10} y1={-50} x2={110} y2={30} stroke="#a16207" strokeWidth={7} />
            </g>
            {/* Sønnen, eller plassen der han sto */}
            <motion.g
                initial={false}
                animate={{ opacity: to ? 1 : 0 }}
                transition={{ duration: 1.2 }}
            >
                <g transform="translate(80 -6)">
                    <rect x={-18} y={-96} width={36} height={94} rx={14} fill="#1d4ed8" />
                    <circle cx={0} cy={-116} r={21} fill="#f1c9a5" />
                </g>
            </motion.g>
            {tom && <rect x={56} y={-14} width={56} height={10} rx={4} fill="#a16207" />}
        </g>
    );
}

function Vannet({ beat, playing }: { beat: number; playing: boolean }) {
    const ringer = beat >= 2;
    return (
        <g>
            <defs>
                <linearGradient id="novelle-kveld" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={beat >= 3 ? '#475569' : '#93c5fd'} />
                    <stop offset="1" stopColor={beat >= 3 ? '#94a3b8' : '#e0f2fe'} />
                </linearGradient>
            </defs>
            <rect width={1600} height={900} fill="url(#novelle-kveld)" />
            <path
                d="M0 470 L 260 300 L 470 430 L 700 260 L 980 450 L 1250 320 L 1600 470 Z"
                fill="#334155"
                opacity={0.75}
            />
            <rect
                y={470}
                width={1600}
                height={430}
                fill={beat >= 3 ? '#1e3a5f' : '#2563eb'}
                opacity={0.85}
            />
            {/* Speilblankt vann: noen svake streker */}
            {[540, 620, 720, 820].map((y, i) => (
                <rect
                    key={y}
                    x={100 + i * 160}
                    y={y}
                    width={500 - i * 40}
                    height={4}
                    rx={2}
                    fill="#bfdbfe"
                    opacity={0.35}
                />
            ))}
            <motion.g
                initial={false}
                animate={{ x: beat >= 1 ? 820 : 620 }}
                transition={{ duration: playing ? 4 : 0, ease: 'easeOut' }}
            >
                <g transform="translate(0 560)">
                    <Robat to={beat < 2} tom={beat >= 2} />
                </g>
            </motion.g>
            {ringer &&
                [0, 1, 2].map((i) => (
                    <motion.ellipse
                        key={i}
                        cx={1040}
                        cy={600}
                        fill="none"
                        stroke="#dbeafe"
                        strokeWidth={4}
                        initial={{ rx: 10, ry: 3, opacity: 0.9 }}
                        animate={
                            playing
                                ? { rx: [10, 260], ry: [3, 50], opacity: [0.9, 0] }
                                : { rx: 120, ry: 24, opacity: 0.5 }
                        }
                        transition={{
                            duration: 4,
                            delay: i * 1.3,
                            repeat: Infinity,
                            ease: 'easeOut',
                        }}
                    />
                ))}
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Kort
                        key="vp"
                        x={110}
                        y={90}
                        b={700}
                        tittel="Vendepunktet"
                        tekst="stedet der alt snur"
                        tone="mork"
                    />
                )}
                {beat === 1 && (
                    <Kort
                        key="stille"
                        x={110}
                        y={90}
                        b={700}
                        tittel="Stille vær"
                        tekst="far og sønn ror ut"
                    />
                )}
                {beat === 2 && (
                    <Kort
                        key="planken"
                        x={110}
                        y={90}
                        b={700}
                        tittel="Planken glir"
                        tekst="noen få ord om ulykken"
                        tone="mork"
                    />
                )}
                {beat >= 3 && (
                    <Kort
                        key="du"
                        x={110}
                        y={90}
                        b={700}
                        tittel="Resten kjenner du"
                        tekst="det tomme rom"
                        tone="mork"
                    />
                )}
            </AnimatePresence>
        </g>
    );
}

function ForEtter({ beat, playing }: { beat: number; playing: boolean }) {
    const visFor = beat >= 2;
    return (
        <g>
            {/* Høyre: nå, en mørk høstkveld ved prestens dør */}
            <rect x={visFor ? 800 : 0} width={visFor ? 800 : 1600} height={900} fill="#1e293b" />
            <circle cx={visFor ? 1450 : 1400} cy={150} r={56} fill="#e2e8f0" />
            <circle cx={visFor ? 1475 : 1425} cy={135} r={50} fill="#1e293b" />
            {Array.from({ length: 9 }, (_, i) => (
                <motion.ellipse
                    key={i}
                    cx={(visFor ? 840 : 120) + ((i * 173) % (visFor ? 720 : 1400))}
                    rx={12}
                    ry={7}
                    fill={i % 2 ? '#c2410c' : '#a16207'}
                    initial={{ cy: -20 }}
                    animate={playing ? { cy: [-20, 900], rotate: [0, 360] } : { cy: 200 + i * 60 }}
                    transition={{
                        duration: 7 + (i % 3),
                        delay: i * 0.8,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            ))}
            {/* Døra med lys */}
            <rect
                x={visFor ? 1330 : 1180}
                y={360}
                width={190}
                height={420}
                fill="#fbbf24"
                opacity={0.85}
            />
            <rect
                y={780}
                x={visFor ? 800 : 0}
                width={visFor ? 800 : 1600}
                height={120}
                fill="#0f172a"
            />
            <motion.g
                initial={false}
                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 1 }}
            >
                <Figur
                    x={visFor ? 1150 : 900}
                    y={790}
                    hoyde={500}
                    boy={0.6}
                    har="#f8fafc"
                    drakt="#64748b"
                    bein="#94a3b8"
                    mager
                    playing={playing}
                />
            </motion.g>

            {/* Venstre: før, midt på dagen */}
            <AnimatePresence>
                {visFor && (
                    <motion.g
                        key="for"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <rect width={800} height={900} fill="#bae6fd" />
                        <circle cx={120} cy={300} r={56} fill="#fde047" />
                        <rect y={780} width={800} height={120} fill="#86efac" />
                        <Figur x={420} y={790} hoyde={500} drakt="#1e3a8a" playing={playing} />
                        <rect x={796} width={8} height={900} fill="#f8fafc" />
                    </motion.g>
                )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Kort
                        key="host"
                        x={100}
                        y={90}
                        b={720}
                        tittel="Et år etter"
                        tekst="sent en høstkveld"
                        tone="mork"
                    />
                )}
                {beat === 1 && (
                    <Kort
                        key="tord"
                        x={100}
                        y={90}
                        b={820}
                        tittel="Foroverbøyd, mager"
                        tekst="og hvit i håret"
                        tone="mork"
                    />
                )}
            </AnimatePresence>
            {visFor && (
                <AnimatePresence mode="wait">
                    {beat === 2 && (
                        <motion.g
                            key="rygg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Kort x={60} y={60} b={500} tittel="Før: rak og stolt" />
                            <Kort x={860} y={60} b={500} tittel="Nå: bøyd" tone="mork" />
                        </motion.g>
                    )}
                    {beat === 3 && (
                        <motion.g
                            key="lys"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Kort
                                x={240}
                                y={60}
                                b={500}
                                tittel="Midt på dagen"
                                tekst="hele bygda ser"
                            />
                            <Kort
                                x={860}
                                y={60}
                                b={420}
                                tittel="I mørket"
                                tekst="bryr seg ikke"
                                tone="mork"
                            />
                        </motion.g>
                    )}
                    {beat >= 4 && (
                        <motion.g
                            key="har"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Kort
                                x={860}
                                y={60}
                                b={460}
                                tittel="Hvitt hår"
                                tekst="gammel og klokere"
                                tone="mork"
                            />
                        </motion.g>
                    )}
                </AnimatePresence>
            )}
        </g>
    );
}

function Hus({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-60} y={-70} width={120} height={70} fill="#b91c1c" />
            <path d="M -72 -66 L 0 -120 L 72 -66 Z" fill="#334155" />
            <rect x={-14} y={-38} width={28} height={38} fill="#fef3c7" />
        </g>
    );
}

function Gaven({ beat }: { beat: number }) {
    return (
        <g>
            <rect width={1600} height={900} fill="#f8fafc" />
            {/* Gården, sett ovenfra og litt på skrå */}
            <g transform="translate(0 40)">
                <motion.g
                    initial={{ x: 0 }}
                    animate={{ x: -30 }}
                    transition={{ duration: 1.2, delay: 1.2 }}
                >
                    <rect x={260} y={330} width={540} height={300} rx={20} fill="#84cc16" />
                    {[0, 1, 2, 3].map((i) => (
                        <rect
                            key={i}
                            x={280}
                            y={350 + i * 70}
                            width={500}
                            height={40}
                            rx={8}
                            fill="#65a30d"
                        />
                    ))}
                    <Hus x={530} y={330} />
                    <text
                        x={530}
                        y={690}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#1e293b"
                        style={FONT}
                    >
                        Øverås
                    </text>
                </motion.g>
                <motion.g
                    initial={{ x: 0, opacity: 1 }}
                    animate={{ x: 80 }}
                    transition={{ duration: 1.6, delay: 1.2 }}
                >
                    {/* Først én hel gård; så blir halvparten gul og glir over til de fattige. */}
                    <motion.rect
                        x={800}
                        y={330}
                        width={540}
                        height={300}
                        rx={20}
                        initial={{ fill: '#84cc16' }}
                        animate={{ fill: '#facc15' }}
                        transition={{ duration: 1, delay: 1.2 }}
                    />
                    {[0, 1, 2, 3].map((i) => (
                        <rect
                            key={i}
                            x={820}
                            y={350 + i * 70}
                            width={500}
                            height={40}
                            rx={8}
                            fill="#eab308"
                        />
                    ))}
                    <Hus x={1070} y={330} />
                    <motion.text
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        x={1070}
                        y={690}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#92400e"
                        style={FONT}
                    >
                        Til de fattige
                    </motion.text>
                </motion.g>
            </g>
            <motion.g
                initial={false}
                animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 0.6 }}
                style={{ originX: '500px', originY: '560px' }}
                transition={{ duration: 0.8 }}
            >
                <circle cx={500} cy={560} r={110} fill="#fde68a" opacity={0.5} />
                <path
                    d="M 500 610 C 420 560 430 500 470 495 C 490 493 500 510 500 520 C 500 510 510 493 530 495 C 570 500 580 560 500 610 Z"
                    fill="#e11d48"
                />
            </motion.g>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Kort
                        key="sitat"
                        x={170}
                        y={70}
                        b={1260}
                        tittel="«Det er halvparten av min gård.»"
                        tekst="Tord, hos presten"
                    />
                )}
                {beat === 1 && (
                    <Kort
                        key="svak"
                        x={170}
                        y={70}
                        b={1260}
                        tittel="Svak analyse: Hva skjer?"
                        tekst="Han gir bort gården fordi han er trist."
                        tone="rod"
                    />
                )}
                {beat === 2 && (
                    <Kort
                        key="god"
                        x={170}
                        y={70}
                        b={1260}
                        tittel="God analyse: Hvorfor?"
                        tekst="Gaven er et ytre tegn på en indre forandring."
                        tone="gronn"
                    />
                )}
                {beat >= 3 && (
                    <Kort
                        key="fred"
                        x={170}
                        y={70}
                        b={1260}
                        tittel="Gods og penger er ikke nok"
                        tekst="uten fred i sjelen"
                        tone="mork"
                    />
                )}
            </AnimatePresence>
        </g>
    );
}

export function NovelleTord({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'vis';
    return (
        <div className="absolute inset-0" style={{ background: '#f1f5f9' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'vis' && <Vis beat={beat} playing={playing} />}
                {modus === 'vannet' && <Vannet beat={beat} playing={playing} />}
                {modus === 'forEtter' && <ForEtter beat={beat} playing={playing} />}
                {modus === 'gaven' && <Gaven beat={beat} />}
            </svg>
        </div>
    );
}
