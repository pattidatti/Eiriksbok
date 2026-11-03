import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Hvordan makten gikk videre: keiserne som medaljonger på rad, med en kobling mellom dem
 * som sier hvordan neste fikk tronen (slekt, adoptert, egen sønn).
 *  - julisk:   Augustus til Nero, én etter én
 *  - nero:     Nero, brannen, forfølgelsen, slekten som dør ut, navnet som hugges vekk
 *  - adopsjon: de fem gode keiserne, ingen egne sønner, adoptert
 *  - arv:      Marcus Aurelius og Commodus
 */

type Modus = 'julisk' | 'nero' | 'adopsjon' | 'arv';

const B = 1600;
const H = 900;
const BLEKK = '#1c1917';
const GULL = '#a16207';
const ROD = '#b91c1c';
const GRONN = '#0f766e';
const GRA = '#78716c';
const PAPIR = '#f4ecdc';

/** Omtrentlig bredde på en tekst i SVG (ca. 0,58 x skriftstørrelse per tegn i fet skrift). */
const bredde = (tekst: string, fs: number) => tekst.length * fs * 0.58;

function Fade({ children, k, delay = 0 }: { children: ReactNode; k: string; delay?: number }) {
    return (
        <motion.g
            key={k}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay }}
        >
            {children}
        </motion.g>
    );
}

function Medalje({
    x,
    y,
    navn,
    aar,
    r = 78,
    aktiv = false,
    dempet = false,
    gra = false,
    farge = GULL,
    navnFs = 34,
}: {
    x: number;
    y: number;
    navn: string;
    aar?: string;
    r?: number;
    aktiv?: boolean;
    dempet?: boolean;
    gra?: boolean;
    farge?: string;
    navnFs?: number;
}) {
    const f = gra ? GRA : farge;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: dempet ? 0.45 : 1 }}
            transition={{ duration: 0.6 }}
        >
            {aktiv && (
                <motion.circle
                    cx={x}
                    cy={y}
                    r={r + 18}
                    fill="none"
                    stroke={f}
                    strokeWidth={6}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.25, 0.7, 0.25] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                />
            )}
            <circle
                cx={x}
                cy={y}
                r={r}
                fill={gra ? '#d6d3d1' : '#fff7e6'}
                stroke={f}
                strokeWidth={8}
            />
            {/* Laurbærkrans: små blad langs kanten */}
            {Array.from({ length: 14 }, (_, i) => {
                const a = Math.PI * 0.62 + (i / 13) * Math.PI * 1.76;
                const bx = x + Math.cos(a) * (r - 20);
                const by = y + Math.sin(a) * (r - 20);
                return (
                    <ellipse
                        key={i}
                        cx={bx}
                        cy={by}
                        rx={9}
                        ry={4}
                        fill={gra ? '#a8a29e' : '#65a30d'}
                        transform={`rotate(${(a * 180) / Math.PI + 90} ${bx} ${by})`}
                    />
                );
            })}
            <text
                x={x}
                y={y + r * 0.22}
                textAnchor="middle"
                fontSize={r * 0.7}
                fontWeight={900}
                fill={f}
                fontFamily="Georgia, serif"
            >
                {navn[0]}
            </text>
            <text
                x={x}
                y={y + r + 50}
                textAnchor="middle"
                fontSize={navnFs}
                fontWeight={900}
                fill={gra ? GRA : BLEKK}
            >
                {navn}
            </text>
            {aar && (
                <text
                    x={x}
                    y={y + r + 86}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={700}
                    fill={GRA}
                >
                    {aar}
                </text>
            )}
        </motion.g>
    );
}

/** En pil mellom to medaljonger, med ord over: hvordan makten gikk videre. */
function Kobling({
    x1,
    x2,
    y,
    tekst,
    farge,
    stiplet = false,
}: {
    x1: number;
    x2: number;
    y: number;
    tekst: string;
    farge: string;
    stiplet?: boolean;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <line
                x1={x1}
                y1={y}
                x2={x2 - 14}
                y2={y}
                stroke={farge}
                strokeWidth={6}
                strokeDasharray={stiplet ? '14 10' : undefined}
            />
            <path d={`M${x2} ${y} l-22 -13 v26 z`} fill={farge} />
            <text
                x={(x1 + x2) / 2}
                y={y - 20}
                textAnchor="middle"
                fontSize={21}
                fontWeight={800}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Et merke med hvit bakgrunn som måles etter teksten. */
function Merke({
    x,
    y,
    tekst,
    farge = BLEKK,
    fs = 26,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    fs?: number;
}) {
    const w = bredde(tekst, fs) + 36;
    return (
        <g>
            <rect
                x={x - w / 2}
                y={y - fs - 8}
                width={w}
                height={fs + 24}
                rx={12}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={3}
            />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={fs} fontWeight={800} fill={farge}>
                {tekst}
            </text>
        </g>
    );
}

function Overskrift({ tittel, under }: { tittel: string; under?: string }) {
    return (
        <g>
            <text
                x={B / 2}
                y={96}
                textAnchor="middle"
                fontSize={52}
                fontWeight={900}
                fill={BLEKK}
                fontFamily="Georgia, serif"
            >
                {tittel}
            </text>
            {under && (
                <text
                    x={B / 2}
                    y={146}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill={GULL}
                >
                    {under}
                </text>
            )}
        </g>
    );
}

/** Kortet nederst: to linjer som skifter per beat. */
function Bunnkort({
    k,
    tittel,
    tekst,
    farge,
}: {
    k: string;
    tittel: string;
    tekst?: string;
    farge: string;
}) {
    const w = Math.max(bredde(tittel, 40), tekst ? bredde(tekst, 30) : 0) + 90;
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={k}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
            >
                <rect
                    x={B / 2 - w / 2}
                    y={tekst ? 692 : 712}
                    width={w}
                    height={tekst ? 150 : 100}
                    rx={22}
                    fill="#ffffff"
                    stroke={farge}
                    strokeWidth={4}
                />
                <rect
                    x={B / 2 - w / 2}
                    y={tekst ? 692 : 712}
                    width={14}
                    height={tekst ? 150 : 100}
                    rx={6}
                    fill={farge}
                />
                <text
                    x={B / 2}
                    y={tekst ? 754 : 776}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill={farge}
                >
                    {tittel}
                </text>
                {tekst && (
                    <text
                        x={B / 2}
                        y={808}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill={BLEKK}
                    >
                        {tekst}
                    </text>
                )}
            </motion.g>
        </AnimatePresence>
    );
}

// ---------- julisk ----------

const JULISK = [
    { navn: 'Augustus', merke: 'den første' },
    { navn: 'Tiberius', merke: 'Capri' },
    { navn: 'Caligula', merke: 'hesten?' },
    { navn: 'Claudius', merke: 'Britannia, 43' },
    { navn: 'Nero', merke: '54-68' },
];
const JULISK_X = [200, 500, 800, 1100, 1400];
const JULISK_KORT = [
    { t: 'Makten går i arv', s: 'Fra far til sønn, eller til en annen i familien', f: GULL },
    { t: 'Tiberius: fra år 26 på Capri', s: 'Gardeprefekten Sejanus styrer mye i Roma', f: GULL },
    { t: 'Caligula: hesten som konsul?', s: 'Historien som alle husker', f: ROD },
    { t: 'Gal? Heller maktsyk', s: 'Kildene var fiender av ham', f: GRONN },
    { t: 'Claudius: stammet, men dyktig', s: 'Britannia erobres i år 43', f: GRONN },
    { t: 'Nero: keiser fra 54 til 68', s: 'Den siste i slekten', f: ROD },
];

function Julisk({ beat }: { beat: number }) {
    const antall = [1, 2, 3, 3, 4, 5][Math.min(beat, 5)];
    const aktiv = [0, 1, 2, 2, 3, 4][Math.min(beat, 5)];
    const kort = JULISK_KORT[Math.min(beat, 5)];
    const y = 360;
    return (
        <>
            <Overskrift tittel="Det julisk-claudiske dynastiet" under="Fra Augustus til år 68" />
            {JULISK.slice(0, antall).map((k, i) => (
                <g key={k.navn}>
                    {i > 0 && (
                        <Kobling
                            x1={JULISK_X[i - 1] + 84}
                            x2={JULISK_X[i] - 84}
                            y={y}
                            tekst="slekt"
                            farge={GULL}
                        />
                    )}
                    <Medalje
                        x={JULISK_X[i]}
                        y={y}
                        navn={k.navn}
                        aktiv={i === aktiv}
                        dempet={i !== aktiv}
                        farge={i === 2 && beat === 3 ? GRONN : i === 4 ? ROD : GULL}
                    />
                    <text
                        x={JULISK_X[i]}
                        y={y + 166}
                        textAnchor="middle"
                        fontSize={26}
                        fontWeight={700}
                        fill={GRA}
                    >
                        {k.merke}
                    </text>
                </g>
            ))}
            <Bunnkort k={`j${beat}`} tittel={kort.t} tekst={kort.s} farge={kort.f} />
        </>
    );
}

// ---------- nero ----------

function Lyre({ x, y }: { x: number; y: number }) {
    return (
        <g
            transform={`translate(${x} ${y})`}
            fill="none"
            stroke={GULL}
            strokeWidth={8}
            strokeLinecap="round"
        >
            <path d="M-50 60 C-80 0 -70 -60 -40 -80 M50 60 C80 0 70 -60 40 -80 M-50 60 H50 M-48 -60 H48" />
            {[-24, -8, 8, 24].map((sx) => (
                <line key={sx} x1={sx} y1={-60} x2={sx} y2={60} strokeWidth={3} />
            ))}
        </g>
    );
}

function Maske({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M-70 -60 Q0 -95 70 -60 Q80 30 0 85 Q-80 30 -70 -60 Z"
                fill="#fff7e6"
                stroke={BLEKK}
                strokeWidth={6}
            />
            <ellipse cx={-28} cy={-15} rx={16} ry={10} fill={BLEKK} />
            <ellipse cx={28} cy={-15} rx={16} ry={10} fill={BLEKK} />
            <path d="M-30 35 Q0 60 30 35" fill="none" stroke={BLEKK} strokeWidth={6} />
        </g>
    );
}

function Flamme({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <motion.g
            transform={`translate(${x} ${y}) scale(${s})`}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.2, repeat: Infinity }}
        >
            <path
                d="M0 -110 C40 -60 70 -30 60 20 C55 60 25 80 0 80 C-25 80 -55 60 -60 20 C-70 -30 -20 -50 0 -110 Z"
                fill="#ea580c"
            />
            <path
                d="M0 -40 C20 -15 35 0 30 30 C25 55 10 62 0 62 C-10 62 -28 55 -30 30 C-33 0 -10 -15 0 -40 Z"
                fill="#facc15"
            />
        </motion.g>
    );
}

function Nero({ beat }: { beat: number }) {
    const b = Math.min(beat, 4);
    const nx = 330;
    const ny = 380;
    return (
        <>
            <Medalje
                x={nx}
                y={ny}
                r={120}
                navn="Nero"
                aar="keiser 54-68"
                farge={ROD}
                gra={b >= 3}
                navnFs={44}
            />
            {b >= 4 && (
                <motion.path
                    d={`M${nx - 60} ${ny - 100} L${nx - 10} ${ny - 20} L${nx - 40} ${ny + 30} L${nx + 20} ${ny + 110} M${nx - 10} ${ny - 20} L${nx + 70} ${ny - 50}`}
                    fill="none"
                    stroke={BLEKK}
                    strokeWidth={6}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />
            )}
            <AnimatePresence mode="wait">
                {b === 0 && (
                    <Fade k="n0">
                        <Lyre x={900} y={360} />
                        <Maske x={1220} y={360} />
                        <Merke x={1060} y={560} tekst="Sang og teater" farge={GULL} fs={40} />
                        <text
                            x={1060}
                            y={640}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill={GRA}
                        >
                            viktigere enn å styre riket
                        </text>
                    </Fade>
                )}
                {b === 1 && (
                    <Fade k="n1">
                        <Flamme x={1060} y={330} s={1.3} />
                        <Merke x={1060} y={530} tekst="Brannen i år 64" farge="#c2410c" fs={40} />
                        <text
                            x={1060}
                            y={610}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill={BLEKK}
                        >
                            Noen kristne får skylden
                        </text>
                        <text
                            x={1060}
                            y={656}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={700}
                            fill={GRA}
                        >
                            og blir straffet brutalt
                        </text>
                    </Fade>
                )}
                {b === 2 && (
                    <Fade k="n2">
                        <text
                            x={1060}
                            y={210}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            Staten forfølger kristne
                        </text>
                        <motion.line
                            x1={700}
                            y1={400}
                            x2={1460}
                            y2={400}
                            stroke={GRA}
                            strokeWidth={8}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.6 }}
                        />
                        <circle cx={700} cy={400} r={20} fill={ROD} />
                        <text
                            x={700}
                            y={470}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={800}
                            fill={ROD}
                        >
                            Nero
                        </text>
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4 }}
                        >
                            <circle cx={1460} cy={400} r={20} fill={BLEKK} />
                            <text
                                x={1440}
                                y={470}
                                textAnchor="end"
                                fontSize={30}
                                fontWeight={800}
                                fill={BLEKK}
                            >
                                over 150 år senere
                            </text>
                            <text
                                x={1440}
                                y={516}
                                textAnchor="end"
                                fontSize={28}
                                fontWeight={700}
                                fill={GRA}
                            >
                                forfølgelser i hele riket
                            </text>
                        </motion.g>
                    </Fade>
                )}
                {b === 3 && (
                    <Fade k="n3">
                        <text
                            x={1060}
                            y={220}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            Juni 68: slekten dør ut
                        </text>
                        {JULISK.map((k, i) => (
                            <motion.g
                                key={k.navn}
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ duration: 0.8, delay: 0.6 + i * 0.4 }}
                            >
                                <circle
                                    cx={740 + i * 160}
                                    cy={400}
                                    r={52}
                                    fill="#e7e5e4"
                                    stroke={GRA}
                                    strokeWidth={6}
                                />
                                <text
                                    x={740 + i * 160}
                                    y={420}
                                    textAnchor="middle"
                                    fontSize={52}
                                    fontWeight={900}
                                    fill={GRA}
                                    fontFamily="Georgia, serif"
                                >
                                    {k.navn[0]}
                                </text>
                                <text
                                    x={740 + i * 160}
                                    y={500}
                                    textAnchor="middle"
                                    fontSize={24}
                                    fontWeight={800}
                                    fill={GRA}
                                >
                                    {k.navn}
                                </text>
                            </motion.g>
                        ))}
                    </Fade>
                )}
                {b === 4 && (
                    <Fade k="n4">
                        <text
                            x={1060}
                            y={200}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            Damnatio memoriae
                        </text>
                        <text
                            x={1060}
                            y={248}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill={GRA}
                        >
                            senatet kan slette en keiser etter døden
                        </text>
                        <rect
                            x={760}
                            y={310}
                            width={600}
                            height={240}
                            rx={10}
                            fill="#d6d3d1"
                            stroke="#a8a29e"
                            strokeWidth={6}
                        />
                        <motion.text
                            x={1060}
                            y={470}
                            textAnchor="middle"
                            fontSize={130}
                            fontWeight={700}
                            letterSpacing={20}
                            fill="#57534e"
                            fontFamily="Georgia, serif"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0.12 }}
                            transition={{ duration: 2.4, delay: 0.8 }}
                        >
                            NERO
                        </motion.text>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <motion.path
                                key={i}
                                d={`M${840 + i * 90} ${360 + (i % 2) * 30} l${30 - (i % 3) * 10} ${110 + (i % 2) * 20}`}
                                stroke="#44403c"
                                strokeWidth={6}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3, delay: 0.8 + i * 0.3 }}
                            />
                        ))}
                        <text
                            x={1060}
                            y={640}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill={BLEKK}
                        >
                            Navnet hugges vekk, statuene knuses
                        </text>
                    </Fade>
                )}
            </AnimatePresence>
        </>
    );
}

// ---------- adopsjon ----------

const GODE = [
    { navn: 'Nerva' },
    { navn: 'Trajan', aar: '98-117' },
    { navn: 'Hadrian', aar: '117-138' },
    { navn: 'Antoninus Pius' },
    { navn: 'Marcus Aurelius', aar: '161-180' },
];

function Adopsjon({ beat }: { beat: number }) {
    const b = Math.min(beat, 3);
    const y = 370;
    return (
        <>
            <Overskrift tittel="De fem gode keiserne" under="Gullalderen, fram til år 180" />
            {b === 0 && (
                <Fade k="gibbon">
                    <text
                        x={B / 2}
                        y={360}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={GULL}
                        fontFamily="Georgia, serif"
                    >
                        Den beste tiden menneskene hadde hatt
                    </text>
                    <text
                        x={B / 2}
                        y={420}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill={GRA}
                    >
                        mente historikeren Edward Gibbon
                    </text>
                </Fade>
            )}
            {b >= 1 &&
                GODE.map((k, i) => (
                    <motion.g
                        key={k.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: b === 1 ? i * 0.5 : 0 }}
                    >
                        {b >= 3 && i > 0 && (
                            <Kobling
                                x1={JULISK_X[i - 1] + 84}
                                x2={JULISK_X[i] - 84}
                                y={y}
                                tekst="adoptert"
                                farge={GRONN}
                            />
                        )}
                        <Medalje
                            x={JULISK_X[i]}
                            y={y}
                            navn={k.navn}
                            aar={k.aar}
                            farge={GRONN}
                            navnFs={k.navn.length > 10 ? 28 : 34}
                            aktiv={false}
                        />
                        {b === 2 && i < 4 && (
                            <g>
                                <text
                                    x={JULISK_X[i]}
                                    y={y + 210}
                                    textAnchor="middle"
                                    fontSize={26}
                                    fontWeight={800}
                                    fill={ROD}
                                >
                                    ingen egen sønn
                                </text>
                            </g>
                        )}
                    </motion.g>
                ))}
            {b >= 2 && (
                <Bunnkort
                    k={`a${b}`}
                    tittel={
                        b === 2 ? 'De første hadde ingen egne sønner' : 'De adopterte den dyktigste'
                    }
                    tekst={b === 2 ? undefined : 'Han ble keiser etter dem'}
                    farge={b === 2 ? ROD : GRONN}
                />
            )}
        </>
    );
}

// ---------- arv ----------

function Bok({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-110}
                y={-80}
                width={220}
                height={160}
                rx={10}
                fill="#fef3c7"
                stroke={GULL}
                strokeWidth={6}
            />
            <line x1={0} y1={-80} x2={0} y2={80} stroke={GULL} strokeWidth={5} />
            {[-50, -25, 0, 25, 50].map((ly) => (
                <g key={ly}>
                    <line x1={-90} y1={ly} x2={-20} y2={ly} stroke="#d6b36a" strokeWidth={4} />
                    <line x1={20} y1={ly} x2={90} y2={ly} stroke="#d6b36a" strokeWidth={4} />
                </g>
            ))}
        </g>
    );
}

function Arv({ beat }: { beat: number }) {
    const b = Math.min(beat, 5);
    const mx = 420;
    const cx = 1180;
    const y = 450;
    return (
        <>
            <Overskrift tittel="Fra far til sønn" />
            <Medalje
                x={mx}
                y={y}
                r={100}
                navn="Marcus Aurelius"
                aar="161-180"
                farge={GRONN}
                aktiv={b <= 2}
                navnFs={36}
            />
            <AnimatePresence mode="wait">
                {b === 0 && (
                    <Fade k="r0">
                        <Merke x={1000} y={460} tekst="Filosofkeiseren" farge={GRONN} fs={46} />
                    </Fade>
                )}
                {b === 1 && (
                    <Fade k="r1">
                        <Bok x={1000} y={420} />
                        <Merke x={1000} y={590} tekst="Til meg selv" farge={GULL} fs={40} />
                        <text
                            x={1000}
                            y={660}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={700}
                            fill={GRA}
                        >
                            korte, filosofiske notater
                        </text>
                    </Fade>
                )}
                {b === 2 && (
                    <Fade k="r2">
                        <path
                            d="M700 300 C820 260 900 340 1020 300 S1240 260 1380 310"
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={16}
                            strokeLinecap="round"
                        />
                        <text
                            x={1040}
                            y={370}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#1d4ed8"
                        >
                            Donau: grensen
                        </text>
                        {[820, 1040, 1260].map((ax) => (
                            <path
                                key={ax}
                                d={`M${ax} 190 v60 l-18 -18 m18 18 l18 -18`}
                                fill="none"
                                stroke={ROD}
                                strokeWidth={8}
                                strokeLinecap="round"
                            />
                        ))}
                        <text
                            x={1040}
                            y={180}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={800}
                            fill={ROD}
                        >
                            germanske folk
                        </text>
                        <text
                            x={1040}
                            y={480}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill={GRA}
                        >
                            Keiseren forsvarer riket
                        </text>
                    </Fade>
                )}
            </AnimatePresence>
            {b >= 3 && (
                <>
                    <Kobling x1={mx + 120} x2={cx - 120} y={y} tekst="egen sønn" farge={ROD} />
                    <Medalje
                        x={cx}
                        y={y}
                        r={100}
                        navn="Commodus"
                        farge={ROD}
                        aktiv={b === 3}
                        gra={b >= 5}
                        navnFs={36}
                    />
                </>
            )}
            {b === 3 && (
                <Bunnkort
                    k="r3"
                    tittel="Tradisjonen er brutt"
                    tekst="Sønnen arver tronen"
                    farge={ROD}
                />
            )}
            {b === 4 && (
                <Fade k="r4">
                    <Merke x={B / 2} y={700} tekst="Gå forbi sønnen?" farge={GRA} fs={34} />
                    <text
                        x={B / 2}
                        y={790}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill={ROD}
                    >
                        Da ville Commodus i praksis vært dømt til døden
                    </text>
                </Fade>
            )}
            {b === 5 && (
                <Fade k="r5">
                    <text
                        x={cx}
                        y={y + 200}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill={GRA}
                    >
                        Fest og moro
                    </text>
                    <text
                        x={cx}
                        y={y + 240}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill={GRA}
                    >
                        Korrupte rådgivere styrer
                    </text>
                    <Merke x={cx} y={y + 320} tekst="Myrdet nyttårsaften 192" farge={ROD} fs={30} />
                </Fade>
            )}
        </>
    );
}

export function KeisereRekke({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'julisk';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: PAPIR }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Marmorbord øverst og nederst */}
                <rect x={0} y={0} width={B} height={14} fill={GULL} opacity={0.5} />
                <rect x={0} y={H - 14} width={B} height={14} fill={GULL} opacity={0.5} />
                {modus === 'julisk' && <Julisk beat={beat} />}
                {modus === 'nero' && <Nero beat={beat} />}
                {modus === 'adopsjon' && <Adopsjon beat={beat} />}
                {modus === 'arv' && <Arv beat={beat} />}
            </svg>
        </div>
    );
}
