import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Papirene i Suez-krisen, på et mørkt skrivebord.
 * «sevres»: sinne i London og Paris, så den hemmelige Sèvres-protokollen. De tre stegene
 * skrives på arket ett for ett, og skissa til høyre viser hva hvert steg betyr ved kanalen.
 * «brev»: Bulganins brev fra Moskva. Konvoluttene går ut, brevet åpnes, og truslene
 * skrives inn linje for linje.
 */

type Modus = 'sevres' | 'brev';

const B = 1600;
const H = 900;
const PAPIR = '#fbf6e9';
const BLEKK = '#1f2937';
const BRITISK = '#b91c1c';
const FRANSK = '#1d4ed8';
const ISRAEL = '#7c3aed';

const STEG = [
    { nr: '1', linjer: ['Israel invaderer Sinai', 'og rykker fram mot kanalen'] },
    { nr: '2', linjer: ['Ultimatum: Egypt og Israel', 'skal trekke seg bort fra kanalen'] },
    { nr: '3', linjer: ['Nasser nekter. Britene og', 'franskmennene går inn'] },
];

export function SuezPapir({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'sevres';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#3b2a1e' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <radialGradient id="suez-papir-lys" cx="50%" cy="45%" r="65%">
                        <stop offset="0%" stopColor="#6b4a32" />
                        <stop offset="100%" stopColor="#2a1d14" />
                    </radialGradient>
                </defs>
                <rect width={B} height={H} fill="url(#suez-papir-lys)" />
                {modus === 'sevres' ? <Sevres beat={beat} /> : <Brev beat={beat} />}
            </svg>
        </div>
    );
}

function Sevres({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <motion.g key="sinne" exit={{ opacity: 0 }}>
                    <Kort x={170} y={200} linjer={['London']} stor farge={BRITISK} />
                    <Kort x={930} y={200} linjer={['Paris']} stor farge={FRANSK} forsinkelse={0.3} />
                    <Stempel x={430} y={380} tekst="RASENDE" forsinkelse={0.7} />
                    <Stempel x={1190} y={380} tekst="RASENDE" forsinkelse={0.9} />
                    <Kort
                        x={300}
                        y={560}
                        linjer={['Eden: Nasser er en trussel', 'på linje med Hitler']}
                        forsinkelse={1.4}
                    />
                </motion.g>
            )}
            {beat === 1 && (
                <motion.g key="grunn" exit={{ opacity: 0 }}>
                    <Kort x={160} y={220} linjer={['Nasser stenger', 'for oljen?']} stor />
                    <Tonne x={420} y={560} />
                    <Kort
                        x={880}
                        y={220}
                        linjer={['Lovlig rett til', 'å angripe Egypt?']}
                        stor
                        forsinkelse={0.6}
                    />
                    <Stempel x={1140} y={620} tekst="NEI" forsinkelse={1.3} stor />
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g key="protokoll" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Protokoll beat={beat} />
                    <Skisse beat={beat} />
                </motion.g>
            )}
        </AnimatePresence>
    );
}

function Protokoll({ beat }: { beat: number }) {
    return (
        <g>
            <rect x={90} y={70} width={760} height={780} rx={10} fill={PAPIR} />
            <text x={470} y={160} textAnchor="middle" fontSize={54} fontWeight={900} fill={BLEKK} fontFamily="Georgia, serif">
                Sèvres-protokollen
            </text>
            <line x1={150} y1={195} x2={790} y2={195} stroke="#94a3b8" strokeWidth={3} />
            {STEG.map((s, i) => {
                const vis = beat >= 3 + i;
                const aktiv = beat === 3 + i;
                const y = 290 + i * 190;
                return (
                    <motion.g
                        key={s.nr}
                        initial={false}
                        animate={{ opacity: vis ? 1 : 0.18 }}
                        transition={{ duration: 0.7 }}
                    >
                        {aktiv && <rect x={120} y={y - 62} width={700} height={160} rx={14} fill="#fde68a" opacity={0.6} />}
                        <circle cx={185} cy={y + 8} r={38} fill={vis ? BLEKK : '#cbd5e1'} />
                        <text x={185} y={y + 10} textAnchor="middle" dominantBaseline="middle" fontSize={44} fontWeight={900} fill="#ffffff">
                            {s.nr}
                        </text>
                        {s.linjer.map((l, k) => (
                            <text key={k} x={250} y={y - 6 + k * 52} fontSize={38} fontWeight={700} fill={BLEKK} fontFamily="Georgia, serif">
                                {vis ? l : '. . . . . . . . . . . .'}
                            </text>
                        ))}
                    </motion.g>
                );
            })}
            <motion.g
                initial={{ opacity: 0, scale: 1.6 }}
                animate={{ opacity: 0.9, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 16 }}
                style={{ transformOrigin: '640px 800px' }}
            >
                <g transform="rotate(-8 640 800)">
                    <rect x={480} y={760} width={320} height={80} rx={8} fill="none" stroke="#b91c1c" strokeWidth={7} />
                    <text x={640} y={803} textAnchor="middle" dominantBaseline="middle" fontSize={46} fontWeight={900} fill="#b91c1c" letterSpacing={4}>
                        HEMMELIG
                    </text>
                </g>
            </motion.g>
        </g>
    );
}

/** Skissa til høyre: Egypt, kanalen, Sinai og Israel fra vest mot øst. */
function Skisse({ beat }: { beat: number }) {
    const X = { egypt: 900, kanal: 1060, sinai: 1100, israel: 1400, slutt: 1560 };
    return (
        <g>
            <rect x={X.egypt} y={250} width={X.slutt - X.egypt} height={520} rx={12} fill="#ead7ad" />
            <rect x={X.israel} y={250} width={X.slutt - X.israel} height={520} rx={12} fill={ISRAEL} opacity={0.85} />
            <rect x={X.kanal} y={250} width={36} height={520} fill="#2563eb" />
            <text x={980} y={300} textAnchor="middle" fontSize={34} fontWeight={900} fill="#44403c">Egypt</text>
            <text x={1250} y={300} textAnchor="middle" fontSize={34} fontWeight={900} fill="#78350f">Sinai (Egypt)</text>
            <text x={1480} y={300} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">Israel</text>
            <text x={1078} y={740} textAnchor="middle" fontSize={34} fontWeight={800} fill="#ffffff" stroke="#1e3a8a" strokeWidth={6} paintOrder="stroke">
                Kanalen
            </text>
            {beat === 2 && (
                <motion.text
                    x={1230}
                    y={520}
                    textAnchor="middle"
                    fontSize={120}
                    fontWeight={900}
                    fill="#44403c"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    ?
                </motion.text>
            )}
            {beat >= 3 && <SkissePil fra={[1440, 470]} til={[1120, 470]} farge={ISRAEL} />}
            {beat >= 4 && (
                <>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <rect x={930} y={360} width={300} height={64} rx={12} fill="#ffffff" stroke={BLEKK} strokeWidth={4} />
                        <text x={1080} y={394} textAnchor="middle" dominantBaseline="middle" fontSize={34} fontWeight={900} fill={BLEKK}>
                            Bort fra kanalen
                        </text>
                    </motion.g>
                    <SkissePil fra={[1020, 560]} til={[930, 560]} farge="#44403c" kort />
                    <SkissePil fra={[1150, 560]} til={[1300, 560]} farge="#44403c" kort />
                </>
            )}
            {beat >= 5 && (
                <>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <rect x={910} y={620} width={130} height={64} rx={12} fill="#15803d" />
                        <text x={975} y={654} textAnchor="middle" dominantBaseline="middle" fontSize={36} fontWeight={900} fill="#ffffff">
                            Nei
                        </text>
                    </motion.g>
                    <SkissePil fra={[960, 640]} til={[1050, 560]} farge={BRITISK} forsinkelse={0.8} />
                    <SkissePil fra={[1220, 660]} til={[1108, 590]} farge={FRANSK} forsinkelse={1.1} />
                </>
            )}
        </g>
    );
}

function SkissePil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    kort,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    kort?: boolean;
}) {
    const vinkel = (Math.atan2(til[1] - fra[1], til[0] - fra[0]) * 180) / Math.PI;
    return (
        <g>
            <motion.line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={farge}
                strokeWidth={kort ? 9 : 14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: forsinkelse }}
            />
            <motion.path
                d="M -28 -20 L 10 0 L -28 20 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 0.9 }}
            />
        </g>
    );
}

const SITAT_1 = [
    '«Hvilken situasjon ville Storbritannia',
    'vært i hvis landet ble angrepet av',
    'sterkere stater med alle typer',
    'moderne ødeleggelsesvåpen?',
];
const SITAT_2 = [
    'Slike land trenger ikke sende krigsskip',
    'eller fly til Storbritannias kyster.',
    'De kan bruke andre midler, for',
    'eksempel ',
];

function Brev({ beat }: { beat: number }) {
    if (beat === 0) {
        const mål = [
            { navn: 'London', x: 330, farge: BRITISK },
            { navn: 'Paris', x: 800, farge: FRANSK },
            { navn: 'Israel', x: 1270, farge: ISRAEL },
        ];
        return (
            <g>
                <rect x={600} y={90} width={400} height={110} rx={16} fill="#7f1d1d" />
                <text x={800} y={147} textAnchor="middle" dominantBaseline="middle" fontSize={52} fontWeight={900} fill="#ffffff">
                    Moskva
                </text>
                <text x={800} y={262} textAnchor="middle" fontSize={36} fontWeight={700} fill="#fde68a">
                    Kvelden 5. november 1956
                </text>
                {mål.map((m, i) => (
                    <g key={m.navn}>
                        <motion.line
                            x1={800}
                            y1={300}
                            x2={m.x}
                            y2={640}
                            stroke="#fde68a"
                            strokeWidth={4}
                            opacity={0.5}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 0.3 + i * 0.3 }}
                        />
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 + i * 0.3 }}
                        >
                            <Konvolutt x={m.x} y={620} />
                            <rect x={m.x - 140} y={700} width={280} height={80} rx={14} fill={m.farge} />
                            <text x={m.x} y={742} textAnchor="middle" dominantBaseline="middle" fontSize={42} fontWeight={900} fill="#ffffff">
                                {m.navn}
                            </text>
                        </motion.g>
                    </g>
                ))}
            </g>
        );
    }
    return (
        <g>
            <motion.g
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: beat >= 4 ? 0.45 : 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <rect x={110} y={60} width={980} height={790} rx={10} fill={PAPIR} />
                <text x={150} y={130} fontSize={32} fontWeight={700} fill="#64748b" fontFamily="Georgia, serif">
                    Moskva, 5. november 1956
                </text>
                <text x={150} y={190} fontSize={40} fontWeight={900} fill={BLEKK} fontFamily="Georgia, serif">
                    Til Anthony Eden
                </text>
                <text x={150} y={240} fontSize={30} fontWeight={700} fill="#64748b" fontFamily="Georgia, serif">
                    Fra Nikolaj Bulganin
                </text>
                <Linjer linjer={SITAT_1} y={330} vis={beat >= 2} />
                <Linjer linjer={SITAT_2} y={590} vis={beat >= 3} rakett />
            </motion.g>
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <Kort x={1140} y={300} linjer={['Guy Mollet,', 'Frankrike:', 'nesten likt', 'brev']} farge={FRANSK} />
                </motion.g>
            )}
            {beat === 3 && <Rakett x={1330} y={460} />}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <rect x={1120} y={110} width={420} height={150} rx={16} fill="#ffffff" />
                    <text x={1330} y={175} textAnchor="middle" dominantBaseline="middle" fontSize={50} fontWeight={900} fill={BLEKK}>
                        atombombe
                    </text>
                    <motion.line
                        x1={1150}
                        y1={175}
                        x2={1510}
                        y2={175}
                        stroke="#dc2626"
                        strokeWidth={10}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    />
                    <text x={1330} y={232} textAnchor="middle" fontSize={28} fontWeight={700} fill="#64748b">
                        aldri skrevet
                    </text>
                    <Mal x={1230} y={460} navn="London" forsinkelse={1.4} />
                    <Mal x={1430} y={640} navn="Paris" forsinkelse={1.8} />
                </motion.g>
            )}
        </g>
    );
}

function Linjer({ linjer, y, vis, rakett }: { linjer: string[]; y: number; vis: boolean; rakett?: boolean }) {
    return (
        <g>
            {linjer.map((l, i) => (
                <motion.text
                    key={i}
                    x={150}
                    y={y + i * 54}
                    fontSize={40}
                    fontWeight={600}
                    fill={BLEKK}
                    fontFamily="Georgia, serif"
                    initial={false}
                    animate={{ opacity: vis ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: vis ? i * 0.5 : 0 }}
                >
                    {l}
                    {rakett && i === linjer.length - 1 && (
                        <tspan fill="#dc2626" fontWeight={900}>
                            rakettvåpen.»
                        </tspan>
                    )}
                </motion.text>
            ))}
        </g>
    );
}

function Mal({ x, y, navn, forsinkelse }: { x: number; y: number; navn: string; forsinkelse: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse }}>
            <circle cx={x} cy={y} r={70} fill="none" stroke="#dc2626" strokeWidth={8} />
            <circle cx={x} cy={y} r={36} fill="none" stroke="#dc2626" strokeWidth={6} />
            <circle cx={x} cy={y} r={9} fill="#dc2626" />
            <text x={x} y={y + 115} textAnchor="middle" fontSize={40} fontWeight={900} fill="#ffffff" stroke="#1f2937" strokeWidth={8} paintOrder="stroke">
                {navn}
            </text>
        </motion.g>
    );
}

function Rakett({ x, y }: { x: number; y: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.8 }}
        >
            <g transform={`translate(${x} ${y}) rotate(35)`}>
                <rect x={-30} y={-150} width={60} height={240} rx={26} fill="#e5e7eb" stroke="#1f2937" strokeWidth={5} />
                <path d="M -30 -120 Q 0 -230 30 -120 Z" fill="#dc2626" stroke="#1f2937" strokeWidth={5} />
                <path d="M -30 50 L -70 110 L -30 90 Z" fill="#dc2626" stroke="#1f2937" strokeWidth={5} />
                <path d="M 30 50 L 70 110 L 30 90 Z" fill="#dc2626" stroke="#1f2937" strokeWidth={5} />
                <circle cx={0} cy={-60} r={16} fill="#1f2937" />
            </g>
        </motion.g>
    );
}

function Konvolutt({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect x={x - 50} y={y - 34} width={100} height={68} rx={6} fill="#fffbeb" stroke="#78350f" strokeWidth={4} />
            <path d={`M ${x - 50} ${y - 34} L ${x} ${y + 6} L ${x + 50} ${y - 34}`} fill="none" stroke="#78350f" strokeWidth={4} />
        </g>
    );
}

function Tonne({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <rect x={x - 70} y={y - 100} width={140} height={200} rx={20} fill="#111827" />
            <rect x={x - 70} y={y - 50} width={140} height={10} fill="#f59e0b" />
            <rect x={x - 70} y={y + 40} width={140} height={10} fill="#f59e0b" />
            <text x={x} y={y + 5} textAnchor="middle" dominantBaseline="middle" fontSize={34} fontWeight={900} fill="#f59e0b">
                OLJE
            </text>
        </motion.g>
    );
}

/** Kort med tekst. Bredden regnes ut fra den lengste linja, så teksten aldri flyter ut. */
function Kort({
    x,
    y,
    linjer,
    stor,
    farge = BLEKK,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    linjer: string[];
    stor?: boolean;
    farge?: string;
    forsinkelse?: number;
}) {
    const fs = stor ? 56 : 40;
    const bredde = Math.max(...linjer.map((l) => l.length)) * fs * 0.58 + 80;
    const hoyde = linjer.length * fs * 1.25 + 50;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            <rect x={x} y={y} width={bredde} height={hoyde} rx={18} fill="#ffffff" />
            <rect x={x} y={y} width={14} height={hoyde} rx={7} fill={farge} />
            {linjer.map((l, i) => (
                <text key={i} x={x + 44} y={y + 25 + fs + i * fs * 1.25 - fs * 0.15} fontSize={fs} fontWeight={900} fill={farge === BLEKK ? BLEKK : farge}>
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

function Stempel({
    x,
    y,
    tekst,
    forsinkelse,
    stor,
}: {
    x: number;
    y: number;
    tekst: string;
    forsinkelse: number;
    stor?: boolean;
}) {
    const fs = stor ? 110 : 60;
    const bredde = tekst.length * fs * 0.72 + 60;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.92 }}
            transition={{ delay: forsinkelse, duration: 0.3 }}
        >
            <g transform={`rotate(-7 ${x} ${y})`}>
                <rect x={x - bredde / 2} y={y - fs * 0.75} width={bredde} height={fs * 1.5} rx={10} fill="none" stroke="#dc2626" strokeWidth={8} />
                <text x={x} y={y + 4} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight={900} fill="#dc2626" letterSpacing={4}>
                    {tekst}
                </text>
            </g>
        </motion.g>
    );
}
