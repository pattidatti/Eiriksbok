import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Isfjell-metoden. Over vannet står symbolet, det du ser. Under vannet ligger meningen.
 * «hjerte»: et hjerte på toppen, kjærlighet under. «blomst»: en blomst som visner, og det den
 * kan bety. «tekst»: tre små isfjell for kappen, rosen og fyrtårnet, med meningen under.
 */

type Modus = 'hjerte' | 'blomst' | 'tekst';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const VANN = 430;
const BLEKK = '#0f172a';
const GULL = '#fbbf24';

const TOPP = 'M640,430 L700,300 L760,250 L820,190 L870,260 L930,330 L970,430 Z';
const BUNN =
    'M560,430 L470,560 L430,700 L520,830 L800,870 L1080,820 L1170,680 L1120,540 L1040,430 Z';

function Hav() {
    return (
        <>
            <defs>
                <linearGradient id="bs-himmel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#bae6fd" />
                    <stop offset="1" stopColor="#e0f2fe" />
                </linearGradient>
                <linearGradient id="bs-hav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#0e7490" />
                    <stop offset="1" stopColor="#082f49" />
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={1600} height={VANN} fill="url(#bs-himmel)" />
            <rect x={0} y={VANN} width={1600} height={900 - VANN} fill="url(#bs-hav)" />
            <line x1={0} y1={VANN} x2={1600} y2={VANN} stroke="#e0f2fe" strokeWidth={4} />
        </>
    );
}

function Vis({ synlig, children }: { synlig: boolean; children: ReactNode }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.8 }}
        >
            {children}
        </motion.g>
    );
}

function Tekst({
    x,
    y,
    tekst,
    storrelse = 44,
    farge = '#ffffff',
    vekt = 800,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    storrelse?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            style={FONT}
        >
            {tekst}
        </text>
    );
}

/** Det store isfjellet, med lys på den delen stemmen snakker om. */
function Isfjell({ topp, bunn }: { topp: boolean; bunn: boolean }) {
    return (
        <g>
            <motion.path
                d={BUNN}
                animate={{ fill: bunn ? '#38bdf8' : '#155e75', opacity: bunn ? 0.85 : 0.55 }}
                transition={{ duration: 0.9 }}
            />
            <motion.path
                d={TOPP}
                stroke="#e0f2fe"
                strokeWidth={4}
                animate={{ fill: topp ? '#ffffff' : '#e2e8f0' }}
                transition={{ duration: 0.9 }}
            />
        </g>
    );
}

function Hjerte({ beat }: { beat: number }) {
    return (
        <g>
            <Isfjell topp={beat === 1 || beat === 3} bunn={beat === 2 || beat >= 4} />
            <Vis synlig={beat === 0}>
                <Tekst x={1020} y={250} tekst="Noe du kan se" farge={BLEKK} anker="start" />
                <Tekst x={800} y={640} tekst="En stor idé" />
            </Vis>
            <Vis synlig={beat === 1}>
                <Tekst
                    x={1020}
                    y={250}
                    tekst="Symbolet"
                    farge={BLEKK}
                    anker="start"
                    storrelse={56}
                    vekt={900}
                />
            </Vis>
            <Vis synlig={beat === 2}>
                <Tekst x={800} y={620} tekst="Meningen" storrelse={60} vekt={900} />
                <rect x={130} y={110} width={420} height={90} rx={45} fill={BLEKK} />
                <Tekst x={340} y={170} tekst="Isfjell-metoden" storrelse={42} farge={GULL} />
            </Vis>
            <motion.path
                d="M800,385 C740,340 735,290 770,280 C790,275 800,292 800,305 C800,292 810,275 830,280 C865,290 860,340 800,385 Z"
                fill="#e11d48"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: beat >= 3 ? 1 : 0, opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 1.2 }}
            />
            <Vis synlig={beat === 3}>
                <Tekst x={1020} y={250} tekst="Bare en form" farge={BLEKK} anker="start" />
            </Vis>
            <Vis synlig={beat >= 4}>
                <Tekst x={800} y={640} tekst="kjærlighet" storrelse={84} vekt={900} />
            </Vis>
        </g>
    );
}

function Blomst({ beat }: { beat: number }) {
    // Blomsten visner: hodet synker mot siden, og fargen blekner.
    const hode = { x: 950, y: 150 };
    return (
        <g>
            <Isfjell topp={beat !== 2} bunn={beat >= 2} />
            <motion.path
                d="M820,195 Q812,110 820,45"
                stroke="#15803d"
                strokeWidth={12}
                fill="none"
                initial={{ d: 'M820,195 Q812,110 820,45' }}
                animate={{ d: `M820,195 Q840,70 ${hode.x},${hode.y}`, stroke: '#65a30d' }}
                transition={{ duration: 2.5, delay: 0.6 }}
            />
            {[0, 1, 2, 3, 4].map((i) => {
                const a = (i / 5) * Math.PI * 2;
                return (
                    <motion.circle
                        key={i}
                        r={34}
                        initial={{
                            cx: 820 + Math.cos(a) * 38,
                            cy: 45 + Math.sin(a) * 38,
                            fill: '#e11d48',
                        }}
                        animate={{
                            cx: hode.x + Math.cos(a) * 32,
                            cy: hode.y + 20 + Math.sin(a) * 32,
                            fill: '#a16207',
                        }}
                        transition={{ duration: 2.5, delay: 0.6 }}
                    />
                );
            })}
            <Vis synlig>
                <Tekst x={800} y={560} tekst="Et forhold tar slutt?" storrelse={46} />
                <Tekst x={800} y={650} tekst="En person er syk?" storrelse={46} />
            </Vis>
            <Vis synlig={beat === 1}>
                <rect
                    x={110}
                    y={140}
                    width={420}
                    height={110}
                    rx={20}
                    fill="#ffffff"
                    stroke={BLEKK}
                    strokeWidth={3}
                />
                <Tekst x={320} y={212} tekst="Hun var syk." farge={BLEKK} storrelse={48} />
                <line
                    x1={140}
                    y1={198}
                    x2={500}
                    y2={198}
                    stroke="#dc2626"
                    strokeWidth={8}
                    strokeLinecap="round"
                />
                <Tekst
                    x={320}
                    y={310}
                    tekst="trenger ikke stå der"
                    farge={BLEKK}
                    storrelse={34}
                    vekt={700}
                />
            </Vis>
            <Vis synlig={beat === 2}>
                <rect x={110} y={150} width={480} height={90} rx={45} fill={BLEKK} />
                <Tekst x={350} y={210} tekst="Du finner meningen" storrelse={40} farge={GULL} />
            </Vis>
            {[0, 1, 2, 3].map((i) => (
                <Vis key={i} synlig={beat >= 3}>
                    <motion.circle
                        cx={[560, 1080, 700, 950][i]}
                        cy={[760, 740, 800, 800][i]}
                        r={16}
                        fill={GULL}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }}
                    />
                </Vis>
            ))}
            <Vis synlig={beat >= 3}>
                <rect x={110} y={150} width={460} height={90} rx={45} fill={BLEKK} />
                <Tekst x={340} y={210} tekst="Noe nytt hver gang" storrelse={40} farge={GULL} />
            </Vis>
        </g>
    );
}

const SMA = [
    { x: 300, setning: 'Mannen i den svarte kappen gikk forbi.', mening: 'døden' },
    { x: 800, setning: 'Han holdt en rød rose, men den visnet.', mening: 'kjærlighet' },
    { x: 1300, setning: 'Langt borte lyste et fyrtårn.', mening: 'håp' },
];

function LiteFjell({
    x,
    mening,
    vis,
    apen,
}: {
    x: number;
    mening: string;
    vis: boolean;
    apen: boolean;
}) {
    return (
        <Vis synlig={vis}>
            <path
                d={`M${x - 170},${VANN} L${x - 210},560 L${x - 120},720 L${x + 120},730 L${x + 210},560 L${x + 170},${VANN} Z`}
                fill={apen ? '#38bdf8' : '#155e75'}
                opacity={0.75}
            />
            <path
                d={`M${x - 140},${VANN} L${x - 60},330 L${x + 60},330 L${x + 140},${VANN} Z`}
                fill="#f1f5f9"
                stroke="#e0f2fe"
                strokeWidth={3}
            />
            <Tekst
                x={x}
                y={630}
                tekst={apen ? mening : '?'}
                storrelse={apen ? 54 : 72}
                vekt={900}
            />
        </Vis>
    );
}

function Kappe({ x }: { x: number }) {
    return (
        <g>
            <path
                d={`M${x - 45},330 L${x - 28},230 Q${x},185 ${x + 28},230 L${x + 45},330 Z`}
                fill="#111827"
            />
            <ellipse cx={x} cy={232} rx={14} ry={18} fill="#030712" />
        </g>
    );
}

function Rose({ x }: { x: number }) {
    return (
        <g>
            <path
                d={`M${x},330 Q${x + 5},270 ${x + 40},250`}
                stroke="#15803d"
                strokeWidth={7}
                fill="none"
            />
            <motion.circle
                cx={x + 45}
                cy={258}
                r={26}
                initial={{ fill: '#be123c' }}
                animate={{ fill: '#78350f' }}
                transition={{ duration: 2.5, delay: 1.5 }}
            />
            <circle cx={x + 50} cy={262} r={11} fill="#881337" />
        </g>
    );
}

function Fyr({ x, lyser }: { x: number; lyser: boolean }) {
    return (
        <g>
            <motion.path
                d={`M${x},225 L${x + 300},170 L${x + 300},280 Z`}
                fill="#fde68a"
                animate={{ opacity: lyser ? [0.2, 0.75, 0.2] : 0 }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <path
                d={`M${x - 26},330 L${x - 16},235 L${x + 16},235 L${x + 26},330 Z`}
                fill="#f8fafc"
                stroke="#dc2626"
                strokeWidth={4}
            />
            <rect x={x - 16} y={270} width={32} height={18} fill="#dc2626" />
            <rect x={x - 20} y={205} width={40} height={30} fill="#fbbf24" />
            <path d={`M${x - 24},205 L${x},185 L${x + 24},205 Z`} fill="#dc2626" />
        </g>
    );
}

function TekstModus({ beat }: { beat: number }) {
    const apen = beat >= 3;
    return (
        <g>
            {SMA.map((s, i) => (
                <LiteFjell
                    key={s.x}
                    x={s.x}
                    mening={s.mening}
                    vis={beat >= i || apen}
                    apen={apen}
                />
            ))}
            <Vis synlig={beat >= 0 || apen}>
                <Kappe x={300} />
            </Vis>
            <Vis synlig={beat >= 1}>
                <Rose x={790} />
            </Vis>
            <Vis synlig={beat >= 2}>
                <Fyr x={1300} lyser={beat >= 2} />
            </Vis>
            {SMA.map((s, i) => (
                <Vis key={s.setning} synlig={beat === i}>
                    <Tekst
                        x={800}
                        y={110}
                        tekst={s.setning}
                        farge={BLEKK}
                        storrelse={50}
                        vekt={800}
                    />
                </Vis>
            ))}
            <Vis synlig={apen}>
                <Tekst
                    x={800}
                    y={110}
                    tekst="Tingen du ser, og det den står for"
                    farge={BLEKK}
                    storrelse={50}
                    vekt={900}
                />
            </Vis>
        </g>
    );
}

export function BildesprakIsfjell({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'hjerte';
    return (
        <div className="absolute inset-0" style={{ background: '#082f49' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Hav />
                {modus === 'hjerte' && <Hjerte beat={beat} />}
                {modus === 'blomst' && <Blomst beat={beat} />}
                {modus === 'tekst' && <TekstModus beat={beat} />}
            </svg>
        </div>
    );
}
