import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Falskt flagg: et angrep laget for å se ut som om fienden sto bak. Tegnet som et lite
 * teater i snitt. Ingen blir skadet i bildet: bare bygninger, flagg, uniformer og pilen.
 * «gleiwitz»: radiostasjonen 1939, SS-menn som bytter uniform, og Tyskland inn i Polen.
 * «mukden»: jernbanen i Mandsjuria 1931, byen Mukden, hæren bak, og Lytton-kommisjonen.
 */

type Modus = 'gleiwitz' | 'mukden';

const B = 1600;
const H = 900;
const BAKKE = 690;

const FARGE = {
    himmel: '#e0ecf7',
    bakke: '#c8bfa4',
    tysk: '#57534e',
    polsk: '#a3a35a',
    japansk: '#6b7a3a',
    rod: '#dc2626',
    oransje: '#f97316',
};

const LAPPER: Record<Modus, string[]> = {
    gleiwitz: [
        'Vil ha krig, men mangler en grunn',
        'Falskt flagg: lat som fienden gjorde det',
        '31. august 1939: SS-menn i polske uniformer',
        'Et falskt angrep på egen radiostasjon',
        'Dagen etter: Tyskland invaderer Polen',
    ],
    mukden: [
        '1931: eksplosjon på japansk jernbane',
        'Påskudd: Japan tar Mukden',
        'De fleste mener: hæren sto bak selv',
        'Lytton-kommisjonen: Japan er angriperen',
    ],
};

export function CasusFalskFlagg({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'gleiwitz';
    const lapper = LAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.himmel }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill={FARGE.bakke} />
                {modus === 'gleiwitz' ? <Gleiwitz beat={beat} /> : <Mukden beat={beat} />}
            </svg>
            <div
                className="absolute left-[3%] top-[4%] px-5 py-2 rounded-xl bg-white/90 shadow-lg font-black text-slate-800"
                style={{ fontSize: '1.7rem' }}
            >
                {modus === 'gleiwitz' ? 'Gleiwitz, Tyskland' : 'Mandsjuria, Kina'}
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute left-[3%] bottom-[4%] px-5 py-3 rounded-2xl bg-slate-900/90 text-white font-bold shadow-xl"
                    style={{ fontSize: '1.65rem', maxWidth: '70%' }}
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Et enkelt menneske: hode og kropp, i uniformens farge. Med armbind når det er polsk uniform. */
function Figur({ x, farge, armbind }: { x: number; farge: string; armbind?: boolean }) {
    return (
        <g transform={`translate(${x} ${BAKKE})`}>
            <motion.rect
                x={-22}
                y={-120}
                width={44}
                height={90}
                rx={18}
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 1 }}
            />
            <rect x={-18} y={-34} width={14} height={34} fill="#292524" />
            <rect x={4} y={-34} width={14} height={34} fill="#292524" />
            <circle cx={0} cy={-142} r={22} fill="#f1d3b3" />
            <motion.rect
                x={-24}
                y={-154}
                width={48}
                height={14}
                rx={4}
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 1 }}
            />
            {armbind && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <rect x={-24} y={-104} width={10} height={8} fill="#ffffff" />
                    <rect x={-24} y={-96} width={10} height={8} fill={FARGE.rod} />
                </motion.g>
            )}
        </g>
    );
}

function Gleiwitz({ beat }: { beat: number }) {
    const grense = 1300;
    const polsk = beat >= 2 && beat <= 3;
    return (
        <g>
            {/* Grensen */}
            <line
                x1={grense}
                y1={300}
                x2={grense}
                y2={H}
                stroke="#334155"
                strokeWidth={6}
                strokeDasharray="20 16"
            />
            <text
                x={grense - 30}
                y={340}
                textAnchor="end"
                fontSize={44}
                fontWeight={900}
                fill="#334155"
            >
                Tyskland
            </text>
            <text x={grense + 30} y={340} fontSize={44} fontWeight={900} fill="#334155">
                Polen
            </text>

            {/* Radiostasjonen */}
            <rect
                x={560}
                y={BAKKE - 170}
                width={300}
                height={170}
                fill="#e7e5e4"
                stroke="#57534e"
                strokeWidth={5}
            />
            <rect x={600} y={BAKKE - 120} width={60} height={60} fill="#94a3b8" />
            <rect x={760} y={BAKKE - 120} width={60} height={60} fill="#94a3b8" />
            <rect x={680} y={BAKKE - 90} width={50} height={90} fill="#78716c" />
            <text
                x={710}
                y={BAKKE - 190}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#44403c"
            >
                Radiostasjonen
            </text>
            <path
                d={`M 940 ${BAKKE} L 1000 120 L 1060 ${BAKKE}`}
                fill="none"
                stroke="#57534e"
                strokeWidth={8}
            />
            {[0, 1, 2, 3, 4].map((i) => (
                <line
                    key={i}
                    x1={955 + i * 9}
                    y1={BAKKE - 110 - i * 110}
                    x2={1045 - i * 9}
                    y2={BAKKE - 110 - i * 110}
                    stroke="#57534e"
                    strokeWidth={5}
                />
            ))}
            <circle cx={1000} cy={115} r={12} fill={FARGE.rod} />

            {/* Radiobølger: den falske meldingen */}
            {beat === 3 &&
                [0, 1, 2].map((i) => (
                    <motion.circle
                        key={i}
                        cx={1000}
                        cy={115}
                        fill="none"
                        stroke={FARGE.oransje}
                        strokeWidth={8}
                        initial={{ r: 20, opacity: 0 }}
                        animate={{ r: [20, 340], opacity: [0.9, 0] }}
                        transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity }}
                    />
                ))}
            {beat === 3 && (
                <Boble
                    x={420}
                    y={230}
                    tekst="Falskt angrep: skal se polsk ut"
                    farge={FARGE.oransje}
                />
            )}

            {/* Flagget: det som skal lure verden */}
            {beat === 1 && <FlaggBytte />}
            {beat === 0 && <Boble x={330} y={260} tekst="Ingen god grunn?" farge="#334155" />}

            {/* SS-mennene */}
            {beat >= 2 && beat <= 3 && (
                <g>
                    {[0, 1, 2, 3].map((i) => (
                        <motion.g
                            key={i}
                            initial={{ x: -260 }}
                            animate={{ x: beat >= 3 ? 60 : 0 }}
                            transition={{ duration: 2, delay: i * 0.15 }}
                        >
                            <Figur
                                x={220 + i * 80}
                                farge={polsk ? FARGE.polsk : FARGE.tysk}
                                armbind={polsk}
                            />
                        </motion.g>
                    ))}
                    {beat === 2 && (
                        <>
                            <Boble x={330} y={300} tekst="Tyske SS-menn" farge={FARGE.tysk} />
                            <Boble
                                x={330}
                                y={420}
                                tekst="i polske uniformer"
                                farge="#65651f"
                                forsinkelse={0.9}
                            />
                        </>
                    )}
                </g>
            )}

            {/* Dagen etter */}
            {beat >= 4 && (
                <g>
                    <motion.path
                        d={`M 1020 470 Q 1260 380 1480 520`}
                        fill="none"
                        stroke={FARGE.rod}
                        strokeWidth={28}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.6 }}
                    />
                    <motion.path
                        d="M -50 -40 L 20 0 L -50 40 Z"
                        fill={FARGE.rod}
                        transform="translate(1490 524) rotate(22)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                    />
                    <Boble
                        x={1350}
                        y={200}
                        tekst="Invasjonen av Polen"
                        farge={FARGE.rod}
                        forsinkelse={1}
                    />
                </g>
            )}
        </g>
    );
}

/** Forklaringen av ordet: et flagg som bytter farge, med en maske foran. */
function FlaggBytte() {
    return (
        <g transform="translate(300 230)">
            <line x1={0} y1={0} x2={0} y2={BAKKE - 230} stroke="#44403c" strokeWidth={10} />
            <motion.rect
                x={6}
                y={6}
                width={220}
                height={140}
                initial={{ fill: '#57534e' }}
                animate={{ fill: ['#57534e', '#57534e', '#ffffff'] }}
                transition={{ duration: 2.4, times: [0, 0.5, 1] }}
                stroke="#1e293b"
                strokeWidth={4}
            />
            <motion.rect
                x={6}
                y={76}
                width={220}
                height={70}
                initial={{ fill: '#57534e' }}
                animate={{ fill: ['#57534e', '#57534e', FARGE.rod] }}
                transition={{ duration: 2.4, times: [0, 0.5, 1] }}
            />
            <text x={116} y={-30} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                Falskt flagg
            </text>
        </g>
    );
}

function Mukden({ beat }: { beat: number }) {
    const smell: [number, number] = [520, BAKKE - 20];
    return (
        <g>
            {/* Jernbanen */}
            <rect x={0} y={BAKKE - 14} width={B} height={14} fill="#78716c" />
            {Array.from({ length: 32 }, (_, i) => (
                <rect
                    key={i}
                    x={i * 52}
                    y={BAKKE - 22}
                    width={30}
                    height={30}
                    fill="#57534e"
                    opacity={0.6}
                />
            ))}
            <text x={880} y={BAKKE + 60} fontSize={34} fontWeight={800} fill="#44403c">
                Japansk jernbane
            </text>

            {/* Eksplosjonen på sporet: lys og røyk, ingen mennesker */}
            <motion.g
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: beat === 0 ? 1 : 0.55, scale: 1 }}
                transition={{ duration: 0.8 }}
                style={{ transformOrigin: `${smell[0]}px ${smell[1]}px` }}
            >
                {[0, 1, 2, 3, 4].map((i) => (
                    <circle
                        key={i}
                        cx={smell[0] + (i - 2) * 46}
                        cy={smell[1] - 70 - (i % 2) * 40}
                        r={70 - Math.abs(i - 2) * 12}
                        fill={i === 2 ? '#fbbf24' : '#a8a29e'}
                        opacity={0.85}
                    />
                ))}
                <circle cx={smell[0]} cy={smell[1] - 40} r={44} fill={FARGE.oransje} />
            </motion.g>

            {/* Byen Mukden */}
            <g>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <rect
                        key={i}
                        x={1080 + i * 70}
                        y={BAKKE - 100 - (i % 3) * 50}
                        width={60}
                        height={100 + (i % 3) * 50 - 14}
                        fill="#e7e5e4"
                        stroke="#78716c"
                        strokeWidth={4}
                    />
                ))}
                <text
                    x={1290}
                    y={BAKKE - 250}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#44403c"
                >
                    Mukden
                </text>
                {beat >= 1 && (
                    <motion.g
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, duration: 0.8 }}
                    >
                        <line
                            x1={1420}
                            y1={BAKKE - 220}
                            x2={1420}
                            y2={BAKKE - 380}
                            stroke="#44403c"
                            strokeWidth={8}
                        />
                        <rect
                            x={1424}
                            y={BAKKE - 380}
                            width={150}
                            height={100}
                            fill="#ffffff"
                            stroke="#44403c"
                            strokeWidth={3}
                        />
                        <circle cx={1499} cy={BAKKE - 330} r={30} fill={FARGE.rod} />
                    </motion.g>
                )}
            </g>
            {beat >= 1 && (
                <>
                    <motion.path
                        d={`M 640 ${BAKKE - 160} Q 860 ${BAKKE - 300} 1060 ${BAKKE - 170}`}
                        fill="none"
                        stroke={FARGE.japansk}
                        strokeWidth={20}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4 }}
                    />
                    <motion.path
                        d="M -40 -30 L 16 0 L -40 30 Z"
                        fill={FARGE.japansk}
                        transform={`translate(1068 ${BAKKE - 166}) rotate(30)`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                    />
                </>
            )}

            {/* Hæren bak: figurene som står gjemt bak en voll */}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    {[0, 1, 2].map((i) => (
                        <Figur key={i} x={150 + i * 70} farge={FARGE.japansk} />
                    ))}
                    <motion.path
                        d={`M 300 ${BAKKE - 170} Q 400 ${BAKKE - 260} ${smell[0] - 40} ${smell[1] - 120}`}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={6}
                        strokeDasharray="12 12"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 0.6 }}
                    />
                    <Boble
                        x={290}
                        y={330}
                        tekst="Den japanske hæren?"
                        farge={FARGE.japansk}
                        forsinkelse={1}
                    />
                </motion.g>
            )}

            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 1.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ transformOrigin: '800px 260px' }}
                >
                    <rect
                        x={560}
                        y={170}
                        width={500}
                        height={170}
                        rx={20}
                        fill="#ffffff"
                        stroke={FARGE.rod}
                        strokeWidth={10}
                        transform="rotate(-4 800 255)"
                    />
                    <text
                        x={800}
                        y={240}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={FARGE.rod}
                        transform="rotate(-4 800 255)"
                    >
                        Folkeforbundet
                    </text>
                    <text
                        x={800}
                        y={300}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={FARGE.rod}
                        transform="rotate(-4 800 255)"
                    >
                        Japan er angriperen
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Boble({
    x,
    y,
    tekst,
    farge,
    forsinkelse = 0.3,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    forsinkelse?: number;
}) {
    const b = tekst.length * 20 + 56;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            <rect
                x={x - b / 2}
                y={y - 36}
                width={b}
                height={72}
                rx={18}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            <text
                x={x}
                y={y + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={38}
                fontWeight={900}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}
