import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Livet til Tord Øverås som én lang linje. Bjørnson viser bare noen få dager, og hopper
 * over resten. Buene over linja er tidshoppene. I «analysen» blir det samme livet til en
 * huskeliste for elevens egen tekst.
 */

type Modus = 'dagene' | 'hoppene' | 'analysen';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const LINJE_Y = 560;
const X0 = 170;
const X1 = 1430;
/** Årene i novellen: dåp, konfirmasjon (seksten år etter), lysning (åtte år etter), vannet. */
const AAR_SLUTT = 25;
const xFor = (aar: number) => X0 + (aar / AAR_SLUTT) * (X1 - X0);

interface Dag {
    aar: number;
    navn: string;
    sitat?: string;
}

const DAGER_FORTELLING: Dag[] = [
    { aar: 0, navn: 'Dåpen', sitat: '«Jeg har fått en sønn»' },
    { aar: 16, navn: 'Konfirmasjonen', sitat: '«Han skal stå nummer 1»' },
    { aar: 24, navn: 'Avtalt bryllup', sitat: '«bygdens rikeste jente»' },
    { aar: 24.6, navn: 'På vannet' },
];

const HOPP = [
    { fra: 0, til: 16, tekst: 'Seksten år etter', fraBeat: 2 },
    { fra: 16, til: 24, tekst: 'Åtte år etter', fraBeat: 3 },
    { fra: 24, til: 24.6, tekst: '', fraBeat: 4 },
];

/** Plassert for å kunne leses, ikke på riktig år: når begravelsen var, sier ikke novellen. */
const DAGER_HOPP = [
    { aar: 0, navn: 'Dåp' },
    { aar: 14, navn: 'Konfirmasjon' },
    { aar: 19.5, navn: 'Bryllup' },
    { aar: 25, navn: 'Begravelse' },
];

function Bue({ fra, til, tekst }: { fra: number; til: number; tekst: string }) {
    const a = xFor(fra);
    const b = xFor(til);
    const midt = (a + b) / 2;
    const hoyde = Math.min(160, Math.max(70, (b - a) * 0.45));
    const d = `M ${a} ${LINJE_Y - 30} Q ${midt} ${LINJE_Y - 30 - hoyde * 2} ${b} ${LINJE_Y - 30}`;
    const kort = b - a < 100;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray="2 18"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
            />
            {tekst && (
                <motion.text
                    x={kort ? a - 30 : midt}
                    y={kort ? LINJE_Y - 150 : LINJE_Y - 50 - hoyde}
                    textAnchor={kort ? 'end' : 'middle'}
                    fontSize={38}
                    fontWeight={800}
                    fill="#b45309"
                    style={FONT}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                >
                    {tekst}
                </motion.text>
            )}
        </g>
    );
}

function Linje({ morke }: { morke: boolean }) {
    return (
        <g>
            <rect
                x={X0}
                y={LINJE_Y - 10}
                width={X1 - X0}
                height={20}
                rx={10}
                fill={morke ? '#cbd5e1' : '#94a3b8'}
            />
            {morke &&
                Array.from({ length: 120 }, (_, i) => (
                    <rect
                        key={i}
                        x={X0 + 6 + i * ((X1 - X0 - 12) / 120)}
                        y={LINJE_Y + 22}
                        width={4}
                        height={18}
                        fill="#cbd5e1"
                    />
                ))}
        </g>
    );
}

function DagPunkt({
    aar,
    navn,
    lys,
    under,
}: {
    aar: number;
    navn: string;
    lys: boolean;
    under?: boolean;
}) {
    const x = xFor(aar);
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ originX: `${x}px`, originY: `${LINJE_Y}px` }}
        >
            <circle
                cx={x}
                cy={LINJE_Y}
                r={lys ? 30 : 22}
                fill={lys ? '#f59e0b' : '#64748b'}
                stroke="#fff"
                strokeWidth={6}
            />
            <text
                x={x}
                y={under ? LINJE_Y + 145 : LINJE_Y + 90}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill="#1e293b"
                style={FONT}
            >
                {navn}
            </text>
        </motion.g>
    );
}

function Dagene({ beat }: { beat: number }) {
    const synlige = DAGER_FORTELLING.filter((_, i) => (i === 0 ? beat >= 1 : beat >= i + 1));
    const aktiv = synlige[synlige.length - 1];
    return (
        <g>
            <AnimatePresence>
                {beat === 0 && (
                    <motion.g
                        key="bok"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <rect x={560} y={150} width={480} height={300} rx={20} fill="#7c2d12" />
                        <rect
                            x={585}
                            y={172}
                            width={430}
                            height={256}
                            rx={12}
                            fill="none"
                            stroke="#fcd34d"
                            strokeWidth={4}
                        />
                        <text
                            x={800}
                            y={290}
                            textAnchor="middle"
                            fontSize={68}
                            fontWeight={900}
                            fill="#fef3c7"
                            style={FONT}
                        >
                            Faderen
                        </text>
                        <text
                            x={800}
                            y={360}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={600}
                            fill="#fde68a"
                            style={FONT}
                        >
                            Bjørnstjerne Bjørnson
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {beat >= 1 && <Linje morke={false} />}
            {HOPP.filter((h) => beat >= h.fraBeat).map((h) => (
                <Bue key={h.fra} fra={h.fra} til={h.til} tekst={h.tekst} />
            ))}
            {synlige.map((d, i) => (
                <DagPunkt
                    key={d.navn}
                    aar={d.aar}
                    navn={d.navn}
                    lys={d === aktiv}
                    under={i === 3}
                />
            ))}
            <AnimatePresence mode="wait">
                {aktiv?.sitat && beat >= 1 && (
                    <motion.g
                        key={aktiv.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <rect
                            x={120}
                            y={90}
                            width={760}
                            height={110}
                            rx={22}
                            fill="#ffffff"
                            stroke="#f59e0b"
                            strokeWidth={5}
                        />
                        <text
                            x={160}
                            y={162}
                            fontSize={44}
                            fontWeight={700}
                            fontStyle="italic"
                            fill="#334155"
                            style={FONT}
                        >
                            {aktiv.sitat}
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <rect
                        x={120}
                        y={90}
                        width={760}
                        height={110}
                        rx={22}
                        fill="#e0f2fe"
                        stroke="#0284c7"
                        strokeWidth={5}
                    />
                    <text
                        x={160}
                        y={162}
                        fontSize={44}
                        fontWeight={700}
                        fill="#0c4a6e"
                        style={FONT}
                    >
                        Fjorten dager etter: ut på vannet
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Hoppene({ beat }: { beat: number }) {
    return (
        <g>
            <Linje morke />
            {/* Hverdagene imellom blir grå og blekner bort når de ikke betyr noe for temaet. */}
            <motion.text
                x={800}
                y={LINJE_Y + 190}
                textAnchor="middle"
                fontSize={36}
                fontWeight={700}
                fill="#64748b"
                style={FONT}
                initial={false}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
            >
                Tiden imellom: uviktig for temaet
            </motion.text>
            {DAGER_HOPP.map((d) => (
                <DagPunkt key={d.navn} aar={d.aar} navn={d.navn} lys={beat >= 1} />
            ))}
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g
                        key="prosent"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <text
                            x={800}
                            y={260}
                            textAnchor="middle"
                            fontSize={150}
                            fontWeight={900}
                            fill="#0f172a"
                            style={FONT}
                        >
                            99 %
                        </text>
                        <text
                            x={800}
                            y={340}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={700}
                            fill="#475569"
                            style={FONT}
                        >
                            av livet til Tord er hoppet over
                        </text>
                    </motion.g>
                )}
                {(beat === 1 || beat === 2) && (
                    <motion.g
                        key="fire"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <text
                            x={800}
                            y={280}
                            textAnchor="middle"
                            fontSize={96}
                            fontWeight={900}
                            fill="#b45309"
                            style={FONT}
                        >
                            Fire dager
                        </text>
                        <text
                            x={800}
                            y={350}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={700}
                            fill="#475569"
                            style={FONT}
                        >
                            spredt over et helt liv
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g
                        key="bygda"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Bygda ser på: små folk rundt hver av de store dagene */}
                        {DAGER_HOPP.slice(0, 3).map((d) =>
                            [-60, -20, 20, 60].map((dx, j) => (
                                <g
                                    key={`${d.navn}${dx}`}
                                    transform={`translate(${xFor(d.aar) + dx} ${LINJE_Y - 80 - (j % 2) * 18})`}
                                >
                                    <circle cx={0} cy={-26} r={11} fill="#475569" />
                                    <rect
                                        x={-10}
                                        y={-14}
                                        width={20}
                                        height={30}
                                        rx={8}
                                        fill="#475569"
                                    />
                                </g>
                            ))
                        )}
                        <rect
                            x={260}
                            y={110}
                            width={1080}
                            height={beat >= 4 ? 230 : 140}
                            rx={24}
                            fill="#ffffff"
                            stroke="#f59e0b"
                            strokeWidth={5}
                        />
                        <text
                            x={800}
                            y={190}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={800}
                            fill="#1e293b"
                            style={FONT}
                        >
                            Dagene da bygda ser på
                        </text>
                        {beat >= 4 && (
                            <motion.text
                                x={800}
                                y={290}
                                textAnchor="middle"
                                fontSize={46}
                                fontWeight={900}
                                fill="#b45309"
                                style={FONT}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                Tord vil vise fram og være best
                            </motion.text>
                        )}
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

const PUNKTER = [
    { fraBeat: 1, tittel: 'Oppbygning', tekst: 'få dager, store tidshopp' },
    { fraBeat: 2, tittel: 'Vendepunktet', tekst: 'ulykken på vannet' },
    { fraBeat: 3, tittel: 'Det ytre viser det indre', tekst: 'bøyd rygg og hvitt hår' },
    { fraBeat: 4, tittel: 'Temaet', tekst: 'hovmod og fall' },
];

const FAGORD = ['isfjell-teorien', 'in medias res', 'tidshopp', 'show, don’t tell', 'tema'];

function Analysen({ beat }: { beat: number }) {
    return (
        <g>
            {/* Arket */}
            <rect
                x={300}
                y={60}
                width={1000}
                height={790}
                rx={18}
                fill="#fffdf7"
                stroke="#e2e8f0"
                strokeWidth={4}
            />
            {Array.from({ length: 14 }, (_, i) => (
                <line
                    key={i}
                    x1={340}
                    x2={1260}
                    y1={190 + i * 48}
                    y2={190 + i * 48}
                    stroke="#e0e7ff"
                    strokeWidth={3}
                />
            ))}
            <text x={360} y={140} fontSize={54} fontWeight={900} fill="#0f172a" style={FONT}>
                Min novelleanalyse
            </text>
            {/* Fagordene som merkelapper øverst */}
            <motion.g initial={false} animate={{ opacity: beat === 0 ? 1 : 0.7 }}>
                {FAGORD.map((f, i) => {
                    const rad = i < 3 ? 0 : 1;
                    const forran = rad === 0 ? FAGORD.slice(0, i) : FAGORD.slice(3, i);
                    const bredde = f.length * 17 + 40;
                    const x = 360 + forran.reduce((s, g) => s + g.length * 17 + 56, 0);
                    return (
                        <g key={f} transform={`translate(${x} ${168 + rad * 62})`}>
                            <rect
                                width={bredde}
                                height={52}
                                rx={26}
                                fill="#fef3c7"
                                stroke="#f59e0b"
                                strokeWidth={3}
                            />
                            <text
                                x={bredde / 2}
                                y={36}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={700}
                                fill="#92400e"
                                style={FONT}
                            >
                                {f}
                            </text>
                        </g>
                    );
                })}
            </motion.g>
            {PUNKTER.map((p, i) => {
                const y = 320 + i * 128;
                const vis = beat >= p.fraBeat;
                const aktiv = beat === p.fraBeat;
                return (
                    <motion.g
                        key={p.tittel}
                        initial={false}
                        animate={{ opacity: vis ? 1 : 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <rect
                            x={350}
                            y={y}
                            width={900}
                            height={110}
                            rx={18}
                            fill={aktiv ? '#fef3c7' : '#ffffff'}
                            stroke={aktiv ? '#f59e0b' : '#cbd5e1'}
                            strokeWidth={4}
                        />
                        <circle cx={410} cy={y + 55} r={30} fill="#16a34a" />
                        <path
                            d={`M ${394} ${y + 56} l 12 12 l 22 -26`}
                            fill="none"
                            stroke="#fff"
                            strokeWidth={8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <text
                            x={470}
                            y={y + 50}
                            fontSize={40}
                            fontWeight={900}
                            fill="#0f172a"
                            style={FONT}
                        >
                            {p.tittel}
                        </text>
                        <text
                            x={470}
                            y={y + 92}
                            fontSize={32}
                            fontWeight={600}
                            fill="#475569"
                            style={FONT}
                        >
                            {p.tekst}
                        </text>
                    </motion.g>
                );
            })}
        </g>
    );
}

export function NovelleLivet({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'dagene';
    return (
        <div
            className="absolute inset-0"
            style={{ background: modus === 'analysen' ? '#e2e8f0' : '#f8fafc' }}
        >
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'dagene' && <Dagene beat={beat} />}
                {modus === 'hoppene' && <Hoppene beat={beat} />}
                {modus === 'analysen' && <Analysen beat={beat} />}
            </svg>
        </div>
    );
}
