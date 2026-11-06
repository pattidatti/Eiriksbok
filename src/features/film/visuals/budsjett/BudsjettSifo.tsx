import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { formatTall } from '../format';
import { Overskrift, Tekst, Vis } from './budsjettFelles';

/**
 * SIFOs referansebudsjett. To moduser:
 * - kurv: hva det koster å leve. Seks poster som er med (mat og drikke, klær og sko, hygiene,
 *   fritid, reiser, møbler) og fire som ikke er med (husleie, strøm, feriereiser, uteliv).
 * - pris: familien med mor, far og datter på 15 år. 27 854 kroner i 2022 og 33 456 kroner i
 *   februar 2026, stolper fra null, og omtrent 20 prosent økning på fire år.
 */

type Modus = 'kurv' | 'pris';

const OVERSKRIFT: Record<Modus, string[]> = {
    kurv: [
        'Hva koster ting?',
        'SIFOs referansebudsjett',
        'Et nivå de fleste kan godta',
        'Dette er med',
        'Dette er ikke med',
        'Husleia: legg til selv',
    ],
    pris: ['Dyrere å leve', 'I 2022', 'I februar 2026', 'Omtrent 20 prosent mer', 'Inflasjon: prisene stiger'],
};

const MED = ['Mat og drikke', 'Klær og sko', 'Hygiene', 'Fritid', 'Reiser', 'Møbler'];
const IKKE = ['Husleie', 'Strøm', 'Feriereiser', 'Uteliv'];

function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 18} ${y - 18} L ${x + 18} ${y + 18} M ${x + 18} ${y - 18} L ${x - 18} ${y + 18}`}
            stroke="#e11d48"
            strokeWidth={9}
            strokeLinecap="round"
        />
    );
}

function Kurv({ beat }: { beat: number }) {
    return (
        <g>
            <Vis vis={beat === 0}>
                <rect x={480} y={260} width={640} height={300} rx={30} fill="#ffffff" stroke="#94a3b8" strokeWidth={5} />
                <Tekst x={800} y={370} str={46} vekt={900}>
                    Mat i måneden
                </Tekst>
                <Tekst x={800} y={480} str={90} vekt={900} farge="#94a3b8">
                    ? kr
                </Tekst>
            </Vis>
            <Vis vis={beat === 1 || beat === 2}>
                <rect x={520} y={200} width={560} height={500} rx={24} fill="#ffffff" stroke="#0f766e" strokeWidth={6} />
                <rect x={520} y={200} width={560} height={110} rx={24} fill="#0f766e" />
                <Tekst x={800} y={270} str={42} farge="#ffffff" vekt={900}>
                    Referansebudsjett
                </Tekst>
                <Tekst x={800} y={370} str={34} farge="#334155" vekt={800}>
                    SIFO ved OsloMet
                </Tekst>
                {[0, 1, 2, 3].map((i) => (
                    <rect key={i} x={590} y={420 + i * 48} width={420 - i * 60} height={18} rx={9} fill="#cbd5e1" />
                ))}
                <rect x={1120} y={240} width={300} height={90} rx={45} fill="#0f172a" />
                <Tekst x={1270} y={298} str={36} farge="#ffffff">
                    Nytt hvert år
                </Tekst>
            </Vis>
            <Vis vis={beat === 2}>
                <rect x={1120} y={380} width={300} height={150} rx={20} fill="#fef3c7" stroke="#b45309" strokeWidth={5} />
                <Tekst x={1270} y={440} str={32} farge="#92400e" vekt={800}>
                    Første gang
                </Tekst>
                <Tekst x={1270} y={500} str={50} farge="#92400e" vekt={900}>
                    1987
                </Tekst>
                <rect x={130} y={380} width={360} height={150} rx={20} fill="#ffffff" stroke="#94a3b8" strokeWidth={4} />
                <Tekst x={310} y={445} str={30} farge="#334155" vekt={800}>
                    Et nivå de fleste
                </Tekst>
                <Tekst x={310} y={495} str={30} farge="#334155" vekt={800}>
                    kan godta
                </Tekst>
            </Vis>

            {/* Med og ikke med */}
            <Vis vis={beat >= 3}>
                <rect x={90} y={170} width={840} height={600} rx={30} fill="#f0fdfa" stroke="#0d9488" strokeWidth={5} />
                <Tekst x={510} y={230} str={38} farge="#0f766e" vekt={900}>
                    Blant annet dette er med
                </Tekst>
                {MED.map((m, i) => {
                    const x = 130 + (i % 2) * 400;
                    const y = 270 + Math.floor(i / 2) * 160;
                    return (
                        <motion.g
                            key={m}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: beat >= 3 ? 1 : 0, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.3 }}
                        >
                            <rect x={x} y={y} width={360} height={130} rx={20} fill="#ffffff" stroke="#0d9488" strokeWidth={4} />
                            <text x={x + 180} y={y + 78} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a">
                                {m}
                            </text>
                        </motion.g>
                    );
                })}
            </Vis>
            <Vis vis={beat >= 4}>
                <Tekst x={1250} y={230} str={38} farge="#be123c" vekt={900}>
                    Ikke med
                </Tekst>
                {IKKE.map((m, i) => {
                    const y = 270 + i * 125;
                    const stor = beat >= 5 && m === 'Husleie';
                    return (
                        <motion.g
                            key={m}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: beat >= 5 && !stor ? 0.35 : 1, x: 0 }}
                            transition={{ delay: beat === 4 ? 0.3 + i * 0.3 : 0 }}
                        >
                            <rect
                                x={1010}
                                y={y}
                                width={400}
                                height={105}
                                rx={20}
                                fill={stor ? '#fff1f2' : '#ffffff'}
                                stroke="#e11d48"
                                strokeWidth={stor ? 8 : 4}
                            />
                            <text x={1210} y={y + 66} textAnchor="middle" fontSize={38} fontWeight={800} fill="#0f172a">
                                {m}
                            </text>
                            <Kryss x={1470} y={y + 52} />
                        </motion.g>
                    );
                })}
            </Vis>
            <Vis vis={beat >= 5}>
                <rect x={950} y={790} width={560} height={80} rx={40} fill="#e11d48" />
                <Tekst x={1230} y={844} str={34} farge="#ffffff" vekt={900}>
                    For mange den største utgiften
                </Tekst>
            </Vis>
        </g>
    );
}

// ---------- pris ----------

const BUNN = 790;
const MAKS_H = 470;
const MAKS = 33456;

function Person({ x, y, s, farge }: { x: number; y: number; s: number; farge: string }) {
    return (
        <g>
            <circle cx={x} cy={y - 70 * s} r={22 * s} fill={farge} />
            <rect x={x - 26 * s} y={y - 44 * s} width={52 * s} height={70 * s} rx={20 * s} fill={farge} />
        </g>
    );
}

function Stolpe({ x, verdi, aar, vis, farge }: { x: number; verdi: number; aar: string; vis: boolean; farge: string }) {
    const h = (verdi / MAKS) * MAKS_H;
    return (
        <g>
            <motion.rect
                x={x - 120}
                width={240}
                rx={14}
                fill={farge}
                initial={{ height: 0, y: BUNN }}
                animate={{ height: vis ? h : 0, y: vis ? BUNN - h : BUNN }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <Tekst x={x} y={BUNN - h - 24} str={46} vekt={900} vis={vis}>
                {`${formatTall(verdi)} kr`}
            </Tekst>
            <Tekst x={x} y={BUNN + 56} str={38} vekt={800} farge="#334155" vis={vis}>
                {aar}
            </Tekst>
        </g>
    );
}

function Pris({ beat }: { beat: number }) {
    const h22 = (27854 / MAKS) * MAKS_H;
    return (
        <g>
            {/* Familien */}
            <Person x={190} y={330} s={1.2} farge="#0f766e" />
            <Person x={290} y={330} s={1.25} farge="#1d4ed8" />
            <Person x={380} y={330} s={0.95} farge="#c026d3" />
            <Tekst x={285} y={400} str={30} farge="#334155" vekt={800}>
                Mor, far og datter (15)
            </Tekst>
            <Tekst x={610} y={250} str={30} farge="#64748b" vekt={700} anker="start">
                Kroner i måneden
            </Tekst>

            <line x1={600} y1={BUNN} x2={1500} y2={BUNN} stroke="#334155" strokeWidth={5} />
            <Stolpe x={780} verdi={27854} aar="2022" vis={beat >= 1} farge="#94a3b8" />
            <Stolpe x={1200} verdi={33456} aar="Februar 2026" vis={beat >= 2} farge="#e11d48" />

            <Vis vis={beat >= 3}>
                <line x1={900} y1={BUNN - h22} x2={1500} y2={BUNN - h22} stroke="#94a3b8" strokeWidth={4} strokeDasharray="12 10" />
                <line x1={1360} y1={BUNN - h22} x2={1360} y2={BUNN - MAKS_H} stroke="#0f172a" strokeWidth={6} />
                <rect x={1370} y={BUNN - MAKS_H - 10} width={200} height={110} rx={18} fill="#0f172a" />
                <Tekst x={1470} y={BUNN - MAKS_H + 36} str={34} farge="#ffffff" vekt={900}>
                    ca. 20 %
                </Tekst>
                <Tekst x={1470} y={BUNN - MAKS_H + 80} str={28} farge="#cbd5e1" vekt={700}>
                    på fire år
                </Tekst>
            </Vis>
            <Vis vis={beat >= 4}>
                <rect x={110} y={520} width={360} height={220} rx={20} fill="#ffffff" stroke="#94a3b8" strokeWidth={4} />
                <Tekst x={290} y={580} str={32} farge="#334155" vekt={800}>
                    Fjorårets budsjett
                </Tekst>
                {[0, 1].map((i) => (
                    <rect key={i} x={160} y={610 + i * 36} width={260 - i * 60} height={16} rx={8} fill="#cbd5e1" />
                ))}
                <motion.g
                    initial={{ opacity: 0, scale: 1.6 }}
                    animate={{ opacity: beat >= 4 ? 1 : 0, scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 14 }}
                    style={{ transformOrigin: '290px 700px' }}
                >
                    <rect x={190} y={672} width={200} height={56} rx={10} fill="none" stroke="#e11d48" strokeWidth={6} />
                    <text x={290} y={712} textAnchor="middle" fontSize={34} fontWeight={900} fill="#e11d48">
                        Juster!
                    </text>
                </motion.g>
            </Vis>
        </g>
    );
}

export function BudsjettSifo({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kurv';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <Overskrift tekst={tekst} />
                {modus === 'kurv' && <Kurv beat={beat} />}
                {modus === 'pris' && <Pris beat={beat} />}
            </svg>
        </div>
    );
}
