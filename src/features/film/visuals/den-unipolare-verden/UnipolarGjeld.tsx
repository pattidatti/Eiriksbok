import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Gjelda og kravene, tegnet som en enkel mekanisme.
 * «krav»: et fattig land med en voksende gjeldsstabel, veien til IMF, lånepapiret med lenke,
 * de fire kravene som stemples inn ett etter ett, og stempelet «Bestemt i Washington».
 * «syn»: to syn side om side (medisin eller kolonistyre), råvarene som strømmer fra fattige
 * land til rike, og protestene.
 */

type Modus = 'krav' | 'syn';

const B = 1600;
const H = 900;

const KRAV = [
    { tekst: 'Kutt i statens utgifter', fraBeat: 3 },
    { tekst: 'Selg statlige selskaper', fraBeat: 3 },
    { tekst: 'Fjern subsidier', fraBeat: 4 },
    { tekst: 'Slipp priser og handel fri', fraBeat: 4 },
];

export function UnipolarGjeld({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'krav';
    return (
        <div className="absolute inset-0 overflow-hidden bg-amber-50">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'krav' ? <Krav beat={beat} /> : <Syn beat={beat} />}
            </svg>
            <AnimatePresence>
                {modus === 'krav' && beat === 0 && <Brikke key="k0" tekst="Store lån på 1970- og 80-tallet" />}
                {modus === 'krav' && beat === 1 && <Brikke key="k1" tekst="Klarer ikke å betale" farge="rod" />}
                {modus === 'krav' && beat === 2 && <Brikke key="k2" tekst="Strukturtilpasning: lån med krav" />}
                {modus === 'syn' && beat === 2 && <Brikke key="s2" tekst="Nykolonialisme" />}
                {modus === 'syn' && beat === 3 && <Brikke key="s3" tekst="Protester" farge="rod" />}
            </AnimatePresence>
        </div>
    );
}

function Krav({ beat }: { beat: number }) {
    const stabel = beat === 0 ? 6 : 9;
    return (
        <>
            {/* Det fattige landet */}
            <g transform="translate(120 430)">
                <rect x={0} y={120} width={260} height={150} fill="#d6b88a" stroke="#0f172a" strokeWidth={5} />
                <path d="M -20 125 L 130 20 L 280 125 Z" fill="#92400e" stroke="#0f172a" strokeWidth={5} />
                <rect x={105} y={190} width={50} height={80} fill="#0f172a" />
                <text x={130} y={320} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                    Fattig land
                </text>
            </g>
            {/* Gjeldsstabelen */}
            <g transform="translate(420 700)">
                {Array.from({ length: 9 }, (_, i) => (
                    <motion.rect
                        key={i}
                        x={0}
                        width={130}
                        height={34}
                        rx={8}
                        initial={false}
                        animate={{
                            y: -i * 38,
                            opacity: i < stabel ? 1 : 0,
                            fill: beat >= 1 ? '#dc2626' : '#f59e0b',
                        }}
                        transition={{ delay: (beat === 0 ? i : i - 6) * 0.2, duration: 0.5 }}
                        stroke="#0f172a"
                        strokeWidth={3}
                    />
                ))}
                <text x={65} y={70} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a">
                    Gjeld
                </text>
            </g>

            {/* IMF */}
            <motion.g initial={false} animate={{ opacity: beat >= 1 ? 1 : 0.15 }} transition={{ duration: 0.8 }}>
                <g transform="translate(1220 380)">
                    <path d="M 0 90 L 150 20 L 300 90 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth={5} />
                    <rect x={10} y={90} width={280} height={24} fill="#e2e8f0" stroke="#0f172a" strokeWidth={4} />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <rect key={i} x={30 + i * 56} y={114} width={22} height={150} fill="#f8fafc" stroke="#0f172a" strokeWidth={3} />
                    ))}
                    <rect x={0} y={264} width={300} height={26} fill="#e2e8f0" stroke="#0f172a" strokeWidth={4} />
                    <text x={150} y={78} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a">
                        IMF
                    </text>
                    <text x={150} y={334} textAnchor="middle" fontSize={28} fontWeight={800} fill="#334155">
                        Det internasjonale
                    </text>
                    <text x={150} y={368} textAnchor="middle" fontSize={28} fontWeight={800} fill="#334155">
                        pengefondet
                    </text>
                </g>
            </motion.g>
            {beat === 1 && (
                <motion.path
                    d="M 400 470 Q 800 300 1200 470"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth={6}
                    strokeDasharray="16 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, delay: 0.4 }}
                />
            )}

            {/* Lånepapiret med kravene */}
            <AnimatePresence>
                {beat >= 2 && (
                    <motion.g
                        key="papir"
                        initial={{ opacity: 0, x: 300, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.9 }}
                    >
                        <rect x={620} y={120} width={520} height={680} rx={14} fill="#ffffff" stroke="#0f172a" strokeWidth={5} />
                        <text x={880} y={190} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                            LÅN
                        </text>
                        <text x={880} y={240} textAnchor="middle" fontSize={28} fontWeight={700} fill="#64748b">
                            på disse vilkårene:
                        </text>
                        {KRAV.map((k, i) =>
                            beat >= k.fraBeat ? (
                                <motion.g
                                    key={k.tekst}
                                    initial={{ opacity: 0, scale: 1.4 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + (i % 2) * 1.2, type: 'spring', stiffness: 220, damping: 18 }}
                                    style={{ transformOrigin: `880px ${310 + i * 95}px` }}
                                >
                                    <rect x={650} y={275 + i * 95} width={460} height={72} rx={12} fill="#fef2f2" stroke="#b91c1c" strokeWidth={4} />
                                    <text x={880} y={320 + i * 95} textAnchor="middle" fontSize={32} fontWeight={800} fill="#7f1d1d">
                                        {k.tekst}
                                    </text>
                                </motion.g>
                            ) : (
                                <rect key={k.tekst} x={650} y={275 + i * 95} width={460} height={72} rx={12} fill="#f1f5f9" />
                            )
                        )}
                        {/* Lenka fra papiret til landet */}
                        {[0, 1, 2, 3].map((i) => (
                            <motion.ellipse
                                key={i}
                                cx={590 - i * 40}
                                cy={340 + i * 4}
                                rx={26}
                                ry={14}
                                fill="none"
                                stroke="#475569"
                                strokeWidth={8}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 + i * 0.2 }}
                            />
                        ))}
                    </motion.g>
                )}
            </AnimatePresence>
            {beat >= 5 && (
                <motion.g
                    initial={{ opacity: 0, scale: 2 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 14 }}
                    style={{ transformOrigin: '880px 740px' }}
                >
                    <g transform="rotate(-5 880 740)">
                        <rect x={660} y={695} width={440} height={90} rx={12} fill="#ffffff" stroke="#b91c1c" strokeWidth={8} />
                        <text x={880} y={758} textAnchor="middle" fontSize={32} fontWeight={900} fill="#b91c1c">
                            BESTEMT I WASHINGTON
                        </text>
                    </g>
                </motion.g>
            )}
        </>
    );
}

function Syn({ beat }: { beat: number }) {
    return (
        <>
            <AnimatePresence>
                {beat <= 1 && (
                    <motion.g key="to" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Panel x={120} tittel="Nødvendig medisin" undertittel="for syke økonomier" farge="#0d9488" aktiv={beat === 0}>
                            <g transform="translate(430 300)">
                                <rect x={-110} y={-45} width={220} height={90} rx={45} fill="#ffffff" stroke="#0f172a" strokeWidth={5} />
                                <path d="M 0 -45 L 0 45 L -65 45 A 45 45 0 0 1 -65 -45 Z" fill="#14b8a6" />
                                <rect x={-110} y={-45} width={220} height={90} rx={45} fill="none" stroke="#0f172a" strokeWidth={5} />
                            </g>
                        </Panel>
                        {beat >= 1 && (
                            <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                                <Panel x={860} tittel="Kolonistyre" undertittel="uten soldater, gjennom gjeld" farge="#b91c1c" aktiv>
                                    <g transform="translate(1170 300)">
                                        {[0, 1, 2, 3].map((i) => (
                                            <ellipse
                                                key={i}
                                                cx={-105 + i * 70}
                                                cy={0}
                                                rx={44}
                                                ry={26}
                                                fill="none"
                                                stroke="#475569"
                                                strokeWidth={12}
                                            />
                                        ))}
                                    </g>
                                </Panel>
                            </motion.g>
                        )}
                    </motion.g>
                )}
            </AnimatePresence>

            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                    <rect x={80} y={200} width={360} height={260} rx={24} fill="#d6b88a" stroke="#0f172a" strokeWidth={5} />
                    <text x={260} y={340} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                        Fattige land
                    </text>
                    <rect x={1160} y={200} width={360} height={260} rx={24} fill="#93c5fd" stroke="#0f172a" strokeWidth={5} />
                    <text x={1340} y={340} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a">
                        Rike land
                    </text>
                    <text x={800} y={240} textAnchor="middle" fontSize={34} fontWeight={800} fill="#334155">
                        råvarer og fortjeneste
                    </text>
                    {Array.from({ length: 6 }, (_, i) => (
                        <motion.rect
                            key={i}
                            y={300 + (i % 3) * 36}
                            width={46}
                            height={30}
                            rx={6}
                            fill={i % 2 ? '#ca8a04' : '#78716c'}
                            stroke="#0f172a"
                            strokeWidth={3}
                            initial={{ x: 460, opacity: 0 }}
                            animate={{ x: [460, 1100], opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: 'linear' }}
                        />
                    ))}
                </motion.g>
            )}

            {beat >= 3 && (
                <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
                    {Array.from({ length: 9 }, (_, i) => {
                        const x = 180 + i * 140;
                        return (
                            <g key={i}>
                                <circle cx={x} cy={640} r={24} fill="#57534e" />
                                <rect x={x - 26} y={668} width={52} height={90} rx={18} fill="#57534e" />
                                {i % 2 === 0 && (
                                    <g>
                                        <line x1={x + 34} y1={700} x2={x + 34} y2={560} stroke="#57534e" strokeWidth={6} />
                                        <rect x={x - 16} y={520} width={100} height={56} rx={6} fill="#ffffff" stroke="#b91c1c" strokeWidth={4} />
                                        <text x={x + 34} y={556} textAnchor="middle" fontSize={22} fontWeight={900} fill="#b91c1c">
                                            {i % 4 === 0 ? 'JOBB!' : 'PRIS!'}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                    <text x={800} y={830} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a">
                        Mange mistet jobben, og prisene steg
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Panel({
    x,
    tittel,
    undertittel,
    farge,
    aktiv,
    children,
}: {
    x: number;
    tittel: string;
    undertittel: string;
    farge: string;
    aktiv: boolean;
    children: React.ReactNode;
}) {
    return (
        <g opacity={aktiv ? 1 : 0.55}>
            <rect x={x} y={120} width={620} height={660} rx={28} fill="#ffffff" stroke={farge} strokeWidth={8} />
            {children}
            <text x={x + 310} y={540} textAnchor="middle" fontSize={56} fontWeight={900} fill={farge}>
                {tittel}
            </text>
            <text x={x + 310} y={610} textAnchor="middle" fontSize={34} fontWeight={700} fill="#334155">
                {undertittel}
            </text>
        </g>
    );
}

function Brikke({ tekst, farge }: { tekst: string; farge?: 'rod' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className={`absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                farge === 'rod' ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
            }`}
        >
            {tekst}
        </motion.div>
    );
}
