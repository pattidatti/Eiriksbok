import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Landet og hjemmene som står der, i tre modus:
 * «balfour»: brevet fra London i 1917 med de to løftene som ikke går sammen.
 * «mandat»: britisk styre 1920-1948, innvandringen fra Europa og uroen som vokser.
 * «nakba»: 700 prikker (én per 1000 mennesker) går ut av landet i 1948. Husene står tomme.
 * Ingen vold vises. Uroen vises bare som røde gnister mellom to grupper.
 */

const B = 1600;
const H = 900;
type Modus = 'balfour' | 'mandat' | 'nakba';

const FARGE = {
    himmel: '#f5efe2',
    hav: '#93c5fd',
    land: '#d6c7a1',
    landMork: '#a8956b',
    israel: '#2563eb',
    palestina: '#0f766e',
    flukt: '#b45309',
    rod: '#b91c1c',
    papir: '#fffdf5',
    blekk: '#1f2937',
    tom: '#9ca3af',
};

// Landet ligger til høyre, havet til venstre (Middelhavet ligger vest for landet).
const KYST = 640;
const BAKKE = 640;

/** Faste hus i landsbyene. Rekkefølgen er bakerst først. */
const HUS: [number, number, number][] = [
    [900, 560, 0.8],
    [1010, 548, 0.8],
    [1180, 556, 0.8],
    [1300, 545, 0.8],
    [1430, 560, 0.8],
    [840, 610, 1],
    [960, 622, 1],
    [1090, 604, 1],
    [1240, 618, 1],
    [1370, 606, 1],
    [1500, 620, 1],
];

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

export function IsraelPalestinaHjem({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'balfour';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.himmel }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'nakba' ? (
                    <Nakba beat={beat} />
                ) : (
                    <>
                        <Landskap />
                        {modus === 'balfour' && <Balfour beat={beat} />}
                        {modus === 'mandat' && <Mandat beat={beat} />}
                    </>
                )}
            </svg>
        </div>
    );
}

function Landskap() {
    return (
        <g>
            <rect x={0} y={BAKKE - 20} width={KYST + 40} height={H} fill={FARGE.hav} />
            <path
                d={`M ${KYST} ${BAKKE + 10} C ${KYST + 60} ${BAKKE - 40} ${KYST + 160} ${BAKKE - 120} 1000 ${
                    BAKKE - 130
                } C 1250 ${BAKKE - 140} 1450 ${BAKKE - 110} ${B} ${BAKKE - 120} L ${B} ${H} L ${KYST - 40} ${H} Z`}
                fill={FARGE.land}
            />
            <text
                x={300}
                y={BAKKE + 220}
                textAnchor="middle"
                fontSize={42}
                fontWeight={800}
                fill="#1e40af"
                opacity={0.7}
            >
                Middelhavet
            </text>
        </g>
    );
}

function Hus({
    x,
    y,
    s,
    farge,
    tomt,
}: {
    x: number;
    y: number;
    s: number;
    farge: string;
    tomt?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <motion.path
                d="M -34 0 L -34 -46 L 0 -78 L 34 -46 L 34 0 Z"
                animate={{ fill: tomt ? FARGE.tom : farge }}
                transition={{ duration: 1.2 }}
            />
            <rect x={-10} y={-26} width={20} height={26} fill={tomt ? '#4b5563' : '#fef3c7'} />
        </g>
    );
}

/** Hvit merkelapp med ramme. Bredden regnes ut fra teksten. */
function Merke({
    x,
    y,
    tekst,
    farge,
    stor,
    fylt,
    venstre,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    stor?: boolean;
    fylt?: boolean;
    venstre?: boolean;
}) {
    const fs = stor ? 50 : 40;
    const b = tekst.length * fs * 0.62 + 64;
    const h = fs + 40;
    const x0 = venstre ? x : x - b / 2;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect
                x={x0}
                y={y - h / 2}
                width={b}
                height={h}
                rx={18}
                fill={fylt ? farge : '#ffffff'}
                stroke={farge}
                strokeWidth={5}
            />
            <text
                x={x0 + b / 2}
                y={y + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fs}
                fontWeight={900}
                fill={fylt ? '#ffffff' : farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Balfour({ beat }: { beat: number }) {
    // Brevet ligger over havet, landet med husene til høyre.
    const BX = 90;
    const BY = 150;
    const BB = 620;
    const BH = 420;
    return (
        <g>
            {HUS.map(([x, y, s], i) => (
                <Hus key={i} x={x} y={y} s={s} farge={FARGE.palestina} />
            ))}

            {/* Britisk styre: en rød ramme rundt hele regionen */}
            <motion.rect
                x={KYST - 10}
                y={420}
                width={B - KYST}
                height={300}
                rx={30}
                fill="none"
                stroke={FARGE.rod}
                strokeWidth={8}
                strokeDasharray="28 16"
                animate={{ opacity: beat === 0 ? 1 : 0.35 }}
            />
            {beat === 0 && (
                <Merke
                    x={800}
                    y={180}
                    tekst="Britene styrer store deler av Midtøsten"
                    farge={FARGE.rod}
                />
            )}
            {beat === 0 && <Merke x={1120} y={370} tekst="Britisk styre" farge={FARGE.rod} fylt />}

            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0, y: -120, rotate: -8 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                    <rect
                        x={BX}
                        y={BY}
                        width={BB}
                        height={BH}
                        rx={10}
                        fill={FARGE.papir}
                        stroke="#d6d3d1"
                        strokeWidth={4}
                    />
                    <text x={BX + 40} y={BY + 66} fontSize={36} fontWeight={800} fill={FARGE.blekk}>
                        London, 1917
                    </text>
                    <text x={BX + 40} y={BY + 116} fontSize={32} fontWeight={600} fill="#57534e">
                        Fra: utenriksminister Balfour
                    </text>
                    <text x={BX + 40} y={BY + 158} fontSize={32} fontWeight={600} fill="#57534e">
                        Til: Lord Rothschild
                    </text>
                    {/* Løfte 1 */}
                    <motion.rect
                        x={BX + 26}
                        y={BY + 192}
                        width={BB - 52}
                        height={84}
                        rx={10}
                        animate={{
                            fill: beat >= 2 ? '#dbeafe' : '#f5f5f4',
                            opacity: 1,
                        }}
                    />
                    <text
                        x={BX + 44}
                        y={BY + 228}
                        fontSize={30}
                        fontWeight={800}
                        fill={beat >= 2 ? FARGE.israel : '#57534e'}
                    >
                        1. Et nasjonalt hjem for
                    </text>
                    <text
                        x={BX + 44}
                        y={BY + 262}
                        fontSize={30}
                        fontWeight={800}
                        fill={beat >= 2 ? FARGE.israel : '#57534e'}
                    >
                        jøder i Palestina
                    </text>
                    {/* Løfte 2 */}
                    <motion.rect
                        x={BX + 26}
                        y={BY + 296}
                        width={BB - 52}
                        height={84}
                        rx={10}
                        animate={{
                            fill: beat >= 3 ? '#ccfbf1' : '#f5f5f4',
                            opacity: 1,
                        }}
                    />
                    <text
                        x={BX + 44}
                        y={BY + 332}
                        fontSize={30}
                        fontWeight={800}
                        fill={beat >= 3 ? FARGE.palestina : '#57534e'}
                    >
                        2. Ikke skade rettighetene til
                    </text>
                    <text
                        x={BX + 44}
                        y={BY + 366}
                        fontSize={30}
                        fontWeight={800}
                        fill={beat >= 3 ? FARGE.palestina : '#57534e'}
                    >
                        dem som bor der
                    </text>
                </motion.g>
            )}
            {beat === 1 && (
                <Merke x={1120} y={180} tekst="1917: Brev fra Balfour" farge={FARGE.blekk} />
            )}

            {/* Pilene fra løftene til landet */}
            {beat >= 2 && (
                <motion.path
                    d={`M ${BX + BB} ${BY + 234} C 820 ${BY + 234} 900 380 960 470`}
                    fill="none"
                    stroke={FARGE.israel}
                    strokeWidth={8}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />
            )}
            {beat >= 3 && (
                <motion.path
                    d={`M ${BX + BB} ${BY + 338} C 860 ${BY + 338} 1080 400 1240 470`}
                    fill="none"
                    stroke={FARGE.palestina}
                    strokeWidth={8}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />
            )}
            {beat === 2 && <Merke x={1170} y={180} tekst="Løfte 1: jødene" farge={FARGE.israel} />}
            {beat === 3 && (
                <Merke x={1170} y={180} tekst="Løfte 2: de som bor der" farge={FARGE.palestina} />
            )}

            {beat >= 4 && (
                <>
                    <Merke
                        x={1170}
                        y={180}
                        tekst="Palestinerne ble ikke spurt"
                        farge={FARGE.rod}
                        fylt
                    />
                    <Merke
                        x={BX + BB / 2}
                        y={BY + BH + 70}
                        tekst="Umulig å holde begge"
                        farge={FARGE.rod}
                    />
                    {/* Et rødt kryss mellom de to løftene */}
                    <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 16 }}
                        style={{
                            transformOrigin: `${BX + BB - 10}px ${BY + 286}px`,
                            transformBox: 'view-box',
                        }}
                    >
                        <circle cx={BX + BB - 10} cy={BY + 286} r={34} fill={FARGE.rod} />
                        <path
                            d={`M ${BX + BB - 26} ${BY + 270} L ${BX + BB + 6} ${BY + 302} M ${BX + BB + 6} ${BY + 270} L ${BX + BB - 26} ${BY + 302}`}
                            stroke="#ffffff"
                            strokeWidth={8}
                            strokeLinecap="round"
                        />
                    </motion.g>
                </>
            )}
        </g>
    );
}

/** Innvandrere som tett, utellbar mengde (ingen tall), på venstre del av landet. */
const NYE = Array.from({ length: 150 }, (_, i) => ({
    x: 700 + frø(i) * 340,
    y: 560 + frø(i + 500) * 150,
}));

function Mandat({ beat }: { beat: number }) {
    return (
        <g>
            {HUS.map(([x, y, s], i) => (
                <Hus key={i} x={x} y={y} s={s} farge={FARGE.palestina} />
            ))}

            {beat === 0 && (
                <>
                    <motion.rect
                        x={KYST - 10}
                        y={420}
                        width={B - KYST}
                        height={300}
                        rx={30}
                        fill="none"
                        stroke={FARGE.rod}
                        strokeWidth={8}
                        strokeDasharray="28 16"
                    />
                    <Merke
                        x={800}
                        y={170}
                        tekst="1920-1948: Britisk mandat"
                        farge={FARGE.blekk}
                        stor
                    />
                    <Merke
                        x={800}
                        y={290}
                        tekst="Et oppdrag fra Folkeforbundet"
                        farge={FARGE.rod}
                    />
                </>
            )}

            {/* Skip fra Europa over havet */}
            {beat >= 1 &&
                [0, 1, 2].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ x: -260, opacity: 0 }}
                        animate={{ x: beat === 1 ? 0 : 60, opacity: 1 }}
                        transition={{ duration: 2.2, delay: i * 0.35, ease: 'easeOut' }}
                    >
                        <g transform={`translate(${180 + i * 150} ${700 + (i % 2) * 70})`}>
                            <path d="M -60 0 L 60 0 L 44 26 L -44 26 Z" fill={FARGE.blekk} />
                            <rect x={-30} y={-26} width={44} height={26} fill="#e5e7eb" />
                            <rect x={22} y={-40} width={12} height={40} fill={FARGE.rod} />
                        </g>
                    </motion.g>
                ))}
            {beat >= 1 && (
                <text
                    x={330}
                    y={630}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill={FARGE.israel}
                >
                    Fra Europa
                </text>
            )}

            {/* Mengden som kommer, tett og uten tall */}
            {beat >= 1 &&
                NYE.map((p, i) => (
                    <motion.circle
                        key={i}
                        cx={p.x + (beat >= 2 ? 60 : 0)}
                        cy={p.y}
                        r={8}
                        fill={FARGE.israel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.85 }}
                        transition={{ delay: 0.6 + (i % 30) * 0.04, duration: 0.5 }}
                    />
                ))}

            {beat === 1 && (
                <>
                    <Merke
                        x={800}
                        y={170}
                        tekst="Hundretusener av jøder kommer"
                        farge={FARGE.israel}
                        stor
                    />
                    <Merke
                        x={800}
                        y={290}
                        tekst="Mange flykter fra hat mot jøder i Europa"
                        farge={FARGE.israel}
                    />
                </>
            )}
            {beat === 2 && (
                <>
                    <Merke
                        x={800}
                        y={170}
                        tekst="Araberne blir skeptiske, så fiendtlige"
                        farge={FARGE.palestina}
                        stor
                    />
                    <Merke
                        x={800}
                        y={290}
                        tekst="De frykter å bli presset ut"
                        farge={FARGE.palestina}
                    />
                </>
            )}
            {beat >= 2 &&
                HUS.slice(5).map(([x, y], i) => (
                    <motion.text
                        key={i}
                        x={x}
                        y={y - 96}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={FARGE.palestina}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.15 }}
                    >
                        ?
                    </motion.text>
                ))}

            {beat >= 3 && (
                <>
                    <Merke
                        x={800}
                        y={170}
                        tekst="Opprør og angrep fra begge sider"
                        farge={FARGE.rod}
                        fylt
                        stor
                    />
                    {[0, 1, 2, 3].map((i) => (
                        <motion.path
                            key={i}
                            d={`M ${1110 + i * 8} ${470 + i * 50} l 30 -24 l 6 30 l 30 -26`}
                            fill="none"
                            stroke={FARGE.rod}
                            strokeWidth={9}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.4, 1] }}
                            transition={{ delay: i * 0.25, duration: 1.4 }}
                        />
                    ))}
                </>
            )}
        </g>
    );
}

// Nakba: 700 prikker, én per 1000 mennesker, i et rutenett inne i landet.
const KOL = 35;
const RAD = 20;
const NX0 = 460;
const NY0 = 300;
const AVST = 19;
const PRIKKER = Array.from({ length: KOL * RAD }, (_, i) => {
    const k = i % KOL;
    const r = Math.floor(i / KOL);
    const hjemme = { x: NX0 + k * AVST, y: NY0 + r * AVST };
    // På flukt: ut av landet, til venstre eller høyre, spredt
    const venstre = k < KOL / 2;
    const ut = {
        x: venstre ? 60 + frø(i) * 300 : 1240 + frø(i) * 300,
        y: 300 + frø(i + 900) * 420,
    };
    return { hjemme, ut, forsinkelse: frø(i + 77) * 1.2 };
});

function Nakba({ beat }: { beat: number }) {
    const ute = beat >= 1;
    const tomme = beat >= 1;
    return (
        <g>
            {/* Landet som en flate med stiplet grense */}
            <rect x={420} y={250} width={760} height={510} rx={40} fill={FARGE.land} />
            <rect
                x={420}
                y={250}
                width={760}
                height={510}
                rx={40}
                fill="none"
                stroke={FARGE.landMork}
                strokeWidth={6}
                strokeDasharray="22 14"
            />
            {/* Hus langs nederkanten av landet */}
            {[500, 600, 700, 800, 900, 1000, 1100].map((x, i) => (
                <Hus key={i} x={x} y={745} s={0.7} farge={FARGE.palestina} tomt={tomme} />
            ))}

            {PRIKKER.map((p, i) => {
                const mal = ute ? p.ut : p.hjemme;
                return (
                    <circle
                        key={i}
                        cx={0}
                        cy={0}
                        r={7}
                        style={{
                            transform: `translate(${mal.x}px, ${mal.y}px)`,
                            transition: `transform 1.8s cubic-bezier(.3,.7,.3,1) ${ute ? p.forsinkelse : 0}s, fill 1s`,
                            fill: ute ? FARGE.flukt : FARGE.palestina,
                        }}
                    />
                );
            })}

            {beat === 0 && (
                <>
                    <text
                        x={800}
                        y={110}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill={FARGE.palestina}
                    >
                        ca. <TelleTall verdi={700000} /> palestinere
                    </text>
                    <text
                        x={800}
                        y={180}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#57534e"
                    >
                        Hver prikk er 1000 mennesker
                    </text>
                </>
            )}
            {beat === 1 && (
                <>
                    <text
                        x={800}
                        y={110}
                        textAnchor="middle"
                        fontSize={60}
                        fontWeight={900}
                        fill={FARGE.flukt}
                    >
                        Flyktet eller drevet ut
                    </text>
                    <text
                        x={800}
                        y={180}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#57534e"
                    >
                        Fra hjemmene sine
                    </text>
                </>
            )}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <text
                        x={800}
                        y={130}
                        textAnchor="middle"
                        fontSize={110}
                        fontWeight={900}
                        fill={FARGE.rod}
                    >
                        NAKBA
                    </text>
                    <text
                        x={800}
                        y={200}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill={FARGE.rod}
                    >
                        betyr «katastrofen»
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <text
                    x={800}
                    y={440}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill={FARGE.landMork}
                >
                    1948
                </text>
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <rect x={480} y={600} width={640} height={6} rx={3} fill={FARGE.rod} />
                    <circle cx={480} cy={603} r={14} fill={FARGE.rod} />
                    <circle cx={1120} cy={603} r={14} fill={FARGE.rod} />
                    <text
                        x={480}
                        y={660}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill={FARGE.blekk}
                    >
                        1948
                    </text>
                    <text
                        x={1120}
                        y={660}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill={FARGE.blekk}
                    >
                        i dag
                    </text>
                    <text
                        x={800}
                        y={560}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={800}
                        fill={FARGE.rod}
                    >
                        Såret har ikke grodd
                    </text>
                </motion.g>
            )}
        </g>
    );
}
