import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { B, FARGE, H, Overskrift, Pil, Tekst, Vis } from './felles';

/**
 * To moduser i SVG:
 * - «tid»: hvor langt fram hver tenker. Kvartalet, selskapets framtid, valget og
 *   planene som henger sammen gjennom renter og priser. Avstandene er en skisse.
 * - «blanding»: en skala fra planøkonomi til markedsøkonomi, med de fleste land og
 *   Norge et sted i midten.
 */

type Modus = 'tid' | 'blanding';

const OVERSKRIFT: Record<Modus, string[]> = {
    tid: ['Kritikk: bare neste kvartal', 'Østerrikerne: verdien ligger i framtida', 'De mener: ødelegg i dag, tap i morgen', 'De mener: politikere ser til neste valg', 'Østerrikerne: planer langt fram'],
    blanding: ['Blandingsøkonomi', 'Både marked og stat', 'Norge', 'Privat og offentlig'],
};

const X0 = 160;
const X1 = 1460;
const LINJE = 600;

function Spenn({ fra, til, y, farge, synlig, tekst, under }: { fra: number; til: number; y: number; farge: string; synlig: boolean; tekst: string; under?: string }) {
    return (
        <Vis synlig={synlig}>
            <motion.rect
                x={fra}
                y={y}
                height={44}
                rx={22}
                fill={farge}
                initial={{ width: 0 }}
                animate={{ width: synlig ? til - fra : 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <Tekst x={fra} y={y - 22} anker="start" farge={farge} storrelse={32}>
                {tekst}
            </Tekst>
            {under && (
                <Tekst x={fra} y={y + 84} anker="start" storrelse={32} vekt={700} farge={FARGE.gra}>
                    {under}
                </Tekst>
            )}
        </Vis>
    );
}

function Tid({ beat }: { beat: number }) {
    return (
        <>
            {/* Tidslinja */}
            <line x1={X0} y1={LINJE} x2={X1} y2={LINJE} stroke={FARGE.blekk} strokeWidth={6} />
            <path d={`M ${X1 - 10} ${LINJE - 18} L ${X1 + 22} ${LINJE} L ${X1 - 10} ${LINJE + 18} Z`} fill={FARGE.blekk} />
            <circle cx={X0} cy={LINJE} r={14} fill={FARGE.blekk} />
            <Tekst x={X0} y={LINJE + 56} storrelse={30}>
                I dag
            </Tekst>
            <Tekst x={X1} y={LINJE + 56} storrelse={30} anker="end">
                Framtida
            </Tekst>
            <Tekst x={X1} y={880} storrelse={32} farge={FARGE.gra} anker="end" vekt={700}>
                Skisse: avstandene er ikke målt
            </Tekst>
            <Spenn fra={X0} til={X0 + 90} y={LINJE - 110} farge={FARGE.rod} synlig={beat === 0} tekst="Kritikk: de nærmeste månedene" />
            {/* Selskapets verdi: alt det skal tjene */}
            <Spenn
                fra={X0}
                til={X1 - 20}
                y={250}
                farge={FARGE.gronn}
                synlig={beat >= 1 && beat !== 3}
                tekst="Østerrikerne: verdien er alt selskapet skal tjene"
            />
            {Array.from({ length: 9 }, (_, i) => {
                const x = X0 + 120 + i * 135;
                const tapt = beat === 2 && i >= 1;
                return (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={{ opacity: beat >= 1 && beat !== 3 ? (tapt ? 0.15 : 1) : 0 }}
                        transition={{ duration: 0.6, delay: tapt ? i * 0.12 : 0 }}
                    >
                        <circle cx={x} cy={390} r={34} fill={FARGE.gull} stroke="#a16207" strokeWidth={5} />
                        <text x={x} y={402} textAnchor="middle" fontSize={32} fontWeight={900} fill="#713f12">
                            kr
                        </text>
                    </motion.g>
                );
            })}
            <Vis synlig={beat === 2}>
                <rect x={X0 + 60} y={700} width={420} height={110} rx={20} fill="#ffffff" stroke={FARGE.rod} strokeWidth={5} />
                <text x={X0 + 270} y={770} textAnchor="middle" fontSize={32} fontWeight={900} fill={FARGE.rod}>
                    Ødelegger ressursene
                </text>
                <Tekst x={900} y={480} storrelse={32} farge={FARGE.rod}>
                    taper penger i morgen
                </Tekst>
            </Vis>
            {/* Politikeren */}
            <Spenn
                fra={X0}
                til={X0 + 380}
                y={LINJE - 110}
                farge={FARGE.stat}
                synlig={beat >= 3}
                tekst="De mener: politikere ser til neste valg"
                under="om fire år"
            />
            {/* Planer koblet sammen langt fram */}
            <Vis synlig={beat >= 4}>
                {[0, 1, 2].map((i) => {
                    const a = X0 + 200 + i * 360;
                    return <Pil key={i} fra={[a, 330]} til={[a + 330, 330]} farge={FARGE.marked} synlig={beat >= 4} bue={-0.18} bredde={6} />;
                })}
                <rect x={980} y={710} width={480} height={110} rx={22} fill={FARGE.marked} />
                <text x={1220} y={780} textAnchor="middle" fontSize={36} fontWeight={900} fill="#ffffff">
                    Renter og priser
                </text>
            </Vis>
        </>
    );
}

/** Norges flagg i liten utgave. */
function Flagg({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-4} y={-150} width={8} height={170} fill="#475569" />
            <rect x={4} y={-150} width={132} height={96} fill="#ba0c2f" />
            <rect x={40} y={-150} width={24} height={96} fill="#ffffff" />
            <rect x={4} y={-114} width={132} height={24} fill="#ffffff" />
            <rect x={46} y={-150} width={12} height={96} fill="#00205b" />
            <rect x={4} y={-108} width={132} height={12} fill="#00205b" />
        </g>
    );
}

function Blanding({ beat }: { beat: number }) {
    const y = 420;
    return (
        <>
            <defs>
                <linearGradient id="produksjon-skala" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor={FARGE.stat} />
                    <stop offset="1" stopColor={FARGE.marked} />
                </linearGradient>
            </defs>
            <rect x={160} y={y} width={1280} height={60} rx={30} fill="url(#produksjon-skala)" />
            <Tekst x={160} y={y + 120} anker="start" farge={FARGE.stat} storrelse={36}>
                Planøkonomi
            </Tekst>
            <Tekst x={1440} y={y + 120} anker="end" farge={FARGE.marked} storrelse={36}>
                Markedsøkonomi
            </Tekst>
            {/* Det brede båndet i midten: ikke tellbart, bare «de fleste» */}
            <rect x={520} y={y - 40} width={560} height={140} rx={30} fill="#ffffff" fillOpacity={0.35} stroke={FARGE.blekk} strokeWidth={4} strokeDasharray="16 12" />
            <Tekst x={800} y={y - 70} storrelse={34} synlig={beat < 2}>
                De aller fleste land
            </Tekst>
            <Vis synlig={beat === 1}>
                <Pil fra={[1300, 280]} til={[1000, 400]} farge={FARGE.marked} synlig={beat === 1} bue={-0.15} />
                <Tekst x={1300} y={250} storrelse={30} farge={FARGE.marked} anker="end">
                    Markeder og private bedrifter
                </Tekst>
                <Pil fra={[300, 280]} til={[600, 400]} farge={FARGE.stat} synlig={beat === 1} bue={0.15} />
                <Tekst x={300} y={250} storrelse={30} farge={FARGE.stat} anker="start">
                    Staten og fagforeningene
                </Tekst>
            </Vis>
            <Vis synlig={beat >= 2}>
                <Flagg x={760} y={y - 30} />
                <Tekst x={800} y={y - 210} storrelse={36}>
                    Norge: hele tiden etter krigen
                </Tekst>
            </Vis>
            <Vis synlig={beat >= 3} forsinkelse={0.3}>
                <rect x={260} y={650} width={500} height={150} rx={24} fill="#ffffff" stroke={FARGE.marked} strokeWidth={6} />
                <text x={510} y={715} textAnchor="middle" fontSize={36} fontWeight={900} fill={FARGE.marked}>
                    Private bedrifter
                </text>
                <text x={510} y={765} textAnchor="middle" fontSize={30} fontWeight={700} fill={FARGE.blekk}>
                    mat og klær
                </text>
                <rect x={840} y={650} width={500} height={150} rx={24} fill="#ffffff" stroke={FARGE.stat} strokeWidth={6} />
                <text x={1090} y={715} textAnchor="middle" fontSize={36} fontWeight={900} fill={FARGE.stat}>
                    Det offentlige
                </text>
                <text x={1090} y={765} textAnchor="middle" fontSize={30} fontWeight={700} fill={FARGE.blekk}>
                    sykehus og skoler
                </text>
            </Vis>
        </>
    );
}

export function ProduksjonTid({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'tid';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.bakgrunn }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {modus === 'tid' ? <Tid beat={beat} /> : <Blanding beat={beat} />}
            </svg>
            <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
        </div>
    );
}
