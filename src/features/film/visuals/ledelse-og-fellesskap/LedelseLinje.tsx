import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Demp, Figur, Flate, Kort, Overskrift, Vis } from './felles';

/**
 * Lærere, linjer og en bok. Fire moduser i 2D:
 * - jodedom: tolkningen som går gjennom tid, fra Tora til rabbinere i dag.
 * - hindu: ingen topp, mange retninger, guruen og misbruket.
 * - sangha: forsamlingen som må være enstemmig, rangen, lærerlinjen og Dalai Lama.
 * - sikh: ti guruer etter hverandre, og så en bok på setet.
 */

type Modus = 'jodedom' | 'hindu' | 'sangha' | 'sikh';

function Pil({
    x1,
    y1,
    x2,
    y2,
    farge = '#475569',
}: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    farge?: string;
}) {
    return (
        <motion.path
            d={`M ${x1} ${y1} L ${x2} ${y2}`}
            stroke={farge}
            strokeWidth={7}
            fill="none"
            markerEnd="url(#ledelse-pil)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7 }}
        />
    );
}

function Bok({
    x,
    y,
    skala = 1,
    farge = '#1e3a8a',
}: {
    x: number;
    y: number;
    skala?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <path
                d="M 0 0 Q -40 -16 -80 -4 L -80 46 Q -40 34 0 50 Z"
                fill="#fff"
                stroke={farge}
                strokeWidth={5}
            />
            <path
                d="M 0 0 Q 40 -16 80 -4 L 80 46 Q 40 34 0 50 Z"
                fill="#fff"
                stroke={farge}
                strokeWidth={5}
            />
            {[10, 22, 34].map((ly) => (
                <g key={ly}>
                    <line x1={-66} y1={ly} x2={-14} y2={ly + 4} stroke="#94a3b8" strokeWidth={4} />
                    <line x1={14} y1={ly + 4} x2={66} y2={ly} stroke="#94a3b8" strokeWidth={4} />
                </g>
            ))}
        </g>
    );
}

function Jodedom({ beat }: { beat: number }) {
    const Y = 500;
    return (
        <Flate>
            <Overskrift>Jødedommen: en samtale gjennom tid</Overskrift>
            {beat <= 3 ? (
                <Kort x={800} y={175} tekst="Ingen sentral ledelse" str={36} kant="#cbd5e1" />
            ) : (
                <Kort
                    x={800}
                    y={175}
                    tekst="Ingen læresetninger alle må slutte seg til"
                    str={36}
                    bakgrunn="#0f172a"
                    farge="#fff"
                />
            )}
            <line
                x1={150}
                y1={Y}
                x2={beat >= 3 ? 1150 : 1450}
                y2={Y}
                stroke="#94a3b8"
                strokeWidth={8}
            />
            <Bok x={200} y={Y - 25} />
            <Kort x={200} y={Y + 85} tekst="Tora" str={34} />
            <Vis nar={beat >= 1}>
                <circle cx={440} cy={Y} r={20} fill="#b91c1c" />
                <Kort
                    x={440}
                    y={Y - 100}
                    tekst="År 70: tempelet ødelagt"
                    str={30}
                    bakgrunn="#fee2e2"
                />
                <Figur x={440} y={Y + 230} farge="#1d4ed8" skala={0.9} />
                <Kort x={440} y={Y + 285} tekst="Rabbi: min lærer" str={30} bakgrunn="#dbeafe" />
            </Vis>
            <Vis nar={beat >= 2}>
                <Bok x={720} y={Y - 25} skala={0.8} />
                <Kort x={720} y={Y + 85} tekst="Mishna, ca. 200" str={30} />
                <Bok x={1080} y={Y - 25} skala={0.8} />
                <Kort x={1080} y={Y + 85} tekst="Talmud, 400-500" str={30} />
                <Kort
                    x={900}
                    y={Y - 175}
                    tekst="Halakha: den jødiske loven"
                    str={32}
                    bakgrunn="#dbeafe"
                />
            </Vis>
            <Vis nar={beat >= 3}>
                {[310, 500, 690].map((ty, i) => (
                    <g key={ty}>
                        <motion.path
                            d={`M 1150 ${Y} C 1250 ${Y}, 1250 ${ty}, 1340 ${ty}`}
                            stroke="#94a3b8"
                            strokeWidth={8}
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, delay: i * 0.15 }}
                        />
                        <Figur x={1400} y={ty + 60} farge="#1d4ed8" skala={0.6} />
                    </g>
                ))}
                <Kort
                    x={1300}
                    y={830}
                    tekst="Rabbinere i dag: ulike svar"
                    str={30}
                    bakgrunn="#dbeafe"
                />
            </Vis>
            <Vis nar={beat >= 4}>
                {[300, 490, 680].map((ty, i) => (
                    <g key={ty}>
                        <circle
                            cx={1500}
                            cy={ty - 30}
                            r={34}
                            fill="#fff"
                            stroke="#1d4ed8"
                            strokeWidth={5}
                        />
                        <text
                            x={1500}
                            y={ty - 14}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#1d4ed8"
                        >
                            {['?', '!', '?'][i]}
                        </text>
                    </g>
                ))}
            </Vis>
        </Flate>
    );
}

const KLYNGER: { x: number; y: number; farge: string }[] = [
    { x: 300, y: 330, farge: '#ea580c' },
    { x: 620, y: 560, farge: '#0d9488' },
    { x: 1000, y: 330, farge: '#7c3aed' },
    { x: 1300, y: 560, farge: '#db2777' },
    { x: 260, y: 700, farge: '#2563eb' },
];

function Tempel({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-60} y={-40} width={120} height={60} fill="#d6a76c" />
            <path d="M -42 -40 L 0 -150 L 42 -40 Z" fill="#c2410c" />
            <rect x={-14} y={-18} width={28} height={38} fill="#7c2d12" />
        </g>
    );
}

function Hindu({ beat }: { beat: number }) {
    return (
        <Flate>
            <Overskrift>Hinduismen: ingen topp</Overskrift>
            <Vis nar={beat === 0}>
                <circle
                    cx={800}
                    cy={470}
                    r={100}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={7}
                    strokeDasharray="16 12"
                />
                <path
                    d="M 750 420 L 850 520 M 850 420 L 750 520"
                    stroke="#dc2626"
                    strokeWidth={12}
                    strokeLinecap="round"
                />
                <Kort x={800} y={230} tekst="Ingen grunnlegger" str={34} />
                <Kort x={400} y={680} tekst="Ingen felles trosbekjennelse" str={34} />
                <Kort x={1200} y={680} tekst="Ingen organisasjon på toppen" str={34} />
            </Vis>
            <Vis nar={beat === 1}>
                <Demp lys>
                    {KLYNGER.map((k, i) => (
                        <g key={i}>
                            {[0, 1, 2, 3, 4].map((j) => {
                                const a = (j / 5) * Math.PI * 2;
                                return (
                                    <circle
                                        key={j}
                                        cx={k.x + Math.cos(a) * 46}
                                        cy={k.y + Math.sin(a) * 46}
                                        r={20}
                                        fill={k.farge}
                                    />
                                );
                            })}
                        </g>
                    ))}
                    <Tempel x={760} y={330} />
                    <Tempel x={1160} y={790} />
                    <Kort x={760} y={385} tekst="Prester" str={26} />
                    <Kort x={1160} y={845} tekst="Prester" str={26} />
                </Demp>
                <Vis nar={beat === 1}>
                    <Kort
                        x={800}
                        y={170}
                        tekst="Sampradaya: mange retninger"
                        str={36}
                        bakgrunn="#ffedd5"
                    />
                </Vis>
            </Vis>
            <Vis nar={beat >= 2}>
                <Demp lys={beat === 2}>
                    <rect
                        x={480}
                        y={420}
                        width={640}
                        height={340}
                        rx={30}
                        fill="#fff7ed"
                        stroke="#fdba74"
                        strokeWidth={4}
                    />
                    <Figur x={640} y={690} farge="#ea580c" skala={1.4} />
                    <Pil x1={720} y1={590} x2={880} y2={590} />
                    <Figur x={960} y={690} farge="#475569" skala={1.1} />
                    <Kort x={640} y={730} tekst="Guru" str={30} />
                    <Kort x={960} y={730} tekst="Elev" str={30} />
                </Demp>
                <Vis nar={beat === 2}>
                    <Kort x={800} y={170} tekst="Guru: en lærer" str={36} bakgrunn="#ffedd5" />
                </Vis>
            </Vis>
            <Vis nar={beat >= 3}>
                <g transform="translate(1180 160)">
                    <rect
                        x={0}
                        y={0}
                        width={320}
                        height={230}
                        rx={8}
                        fill="#fff"
                        stroke="#334155"
                        strokeWidth={4}
                    />
                    <rect x={20} y={20} width={280} height={36} fill="#334155" />
                    {[80, 110, 140, 170, 200].map((ly) => (
                        <line
                            key={ly}
                            x1={20}
                            y1={ly}
                            x2={ly % 60 ? 300 : 200}
                            y2={ly}
                            stroke="#cbd5e1"
                            strokeWidth={10}
                        />
                    ))}
                </g>
                <Kort
                    x={1340}
                    y={450}
                    tekst="Indiske aviser: misbruk"
                    str={32}
                    bakgrunn="#fee2e2"
                />
                <Kort
                    x={560}
                    y={190}
                    tekst="Mange hinduer er skeptiske til guruer"
                    str={36}
                    bakgrunn="#0f172a"
                    farge="#fff"
                />
            </Vis>
        </Flate>
    );
}

const MUNK = '#ea8a0c';
const NONNE = '#9f1239';

function Sangha({ beat }: { beat: number }) {
    const tittel =
        beat <= 2
            ? 'Sangha: munker og nonner'
            : beat === 3
              ? 'Fra lærer til elev'
              : 'Dalai Lama: funnet, ikke valgt';
    const n = 10;
    return (
        <Flate>
            <Overskrift>{tittel}</Overskrift>
            <Vis nar={beat <= 2}>
                {Array.from({ length: n }, (_, i) => {
                    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                    const ring = { x: 800 + Math.cos(a) * 440, y: 540 + Math.sin(a) * 250 };
                    const rekke = { x: 170 + i * 140, y: 720 };
                    const p = beat === 2 ? rekke : ring;
                    const munk = i < 6;
                    return (
                        <motion.g
                            key={i}
                            initial={false}
                            animate={{ x: p.x, y: p.y }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Figur x={0} y={60} farge={munk ? MUNK : NONNE} skala={0.75} />
                            {beat === 1 && (
                                <g>
                                    <circle cx={0} cy={-80} r={26} fill="#16a34a" />
                                    <path
                                        d="M -12 -80 L -3 -70 L 13 -92"
                                        stroke="#fff"
                                        strokeWidth={7}
                                        fill="none"
                                    />
                                </g>
                            )}
                        </motion.g>
                    );
                })}
                {beat <= 1 && (
                    <>
                        <Kort
                            x={800}
                            y={540}
                            tekst={beat === 0 ? 'Forsamlingen' : 'Lokale vedtak: alle må si ja'}
                            str={38}
                            bakgrunn={beat === 1 ? '#dcfce7' : '#fff'}
                        />
                    </>
                )}
                <Kort x={600} y={170} tekst="Munk" str={30} bakgrunn={MUNK} farge="#fff" />
                <Kort x={1000} y={170} tekst="Nonne" str={30} bakgrunn={NONNE} farge="#fff" />
                {beat === 2 && (
                    <>
                        <Pil x1={150} y1={430} x2={1450} y2={430} />
                        <Kort
                            x={800}
                            y={360}
                            tekst="Rang: hvor lenge du har vært munk eller nonne"
                            str={32}
                        />
                        <Kort
                            x={800}
                            y={860}
                            tekst="Munker går foran nonner"
                            str={32}
                            bakgrunn="#ffedd5"
                        />
                    </>
                )}
            </Vis>
            <Vis nar={beat === 3}>
                {['Lærer', 'Elev', 'Ny lærer', 'Elev'].map((t, i) => {
                    const x = 260 + i * 360;
                    return (
                        <g key={i}>
                            <Figur
                                x={x}
                                y={620}
                                farge={t === 'Elev' ? '#475569' : MUNK}
                                skala={1.3}
                            />
                            <Kort x={x} y={670} tekst={t} str={32} />
                            {i < 3 && <Pil x1={x + 80} y1={520} x2={x + 280} y2={520} />}
                        </g>
                    );
                })}
                <Kort
                    x={800}
                    y={790}
                    tekst="Eleven kan bli den neste læreren"
                    str={34}
                    bakgrunn="#ffedd5"
                />
            </Vis>
            <Vis nar={beat >= 4}>
                <Kort
                    x={800}
                    y={175}
                    tekst="Høyeste tittel i den største tibetanske retningen"
                    str={30}
                />
                <rect x={620} y={560} width={360} height={60} rx={24} fill="#b91c1c" />
                <rect x={660} y={620} width={280} height={120} rx={12} fill="#7f1d1d" />
                {beat === 4 && (
                    <>
                        <Kort
                            x={800}
                            y={420}
                            tekst="Ikke valgt, men funnet"
                            str={44}
                            bakgrunn="#0f172a"
                            farge="#fff"
                        />
                        <ellipse cx={800} cy={550} rx={140} ry={22} fill="#fbbf24" opacity={0.6} />
                    </>
                )}
                {beat >= 5 && (
                    <>
                        <Figur x={800} y={560} farge={MUNK} skala={1.1} />
                        <Kort
                            x={800}
                            y={300}
                            tekst="Et barn som må kjenne igjen eiendelene"
                            str={34}
                            bakgrunn="#ffedd5"
                        />
                        {/* Eiendelene på et lavt bord */}
                        <rect x={1060} y={600} width={380} height={24} rx={8} fill="#a16207" />
                        <circle cx={1130} cy={575} r={26} fill="#64748b" />
                        <rect x={1215} y={540} width={50} height={60} rx={6} fill="#ca8a04" />
                        <circle
                            cx={1360}
                            cy={580}
                            r={22}
                            fill="none"
                            stroke="#7c2d12"
                            strokeWidth={8}
                        />
                        <circle
                            cx={1240}
                            cy={570}
                            r={62}
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth={6}
                        />
                        <Pil x1={880} y1={500} x2={1160} y2={540} />
                    </>
                )}
            </Vis>
        </Flate>
    );
}

function Sikh({ beat }: { beat: number }) {
    const Y = 650;
    return (
        <Flate>
            <Overskrift>Sikhismen: ti guruer, så en bok</Overskrift>
            <Demp lys={beat <= 2}>
                {Array.from({ length: 10 }, (_, i) => {
                    const x = 140 + i * 120;
                    const siste = i === 9;
                    return (
                        <g key={i}>
                            {siste && beat >= 1 && (
                                <circle cx={x} cy={Y - 70} r={92} fill="#fde68a" opacity={0.7} />
                            )}
                            <Figur x={x} y={Y} farge="#1e40af" skala={0.85} hode="#c8956a" />
                            <circle cx={x} cy={Y - 118 * 0.85} r={24} fill="#f97316" />
                            <text
                                x={x}
                                y={Y + 50}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill="#334155"
                            >
                                {i + 1}
                            </text>
                        </g>
                    );
                })}
                <Kort x={170} y={Y + 115} tekst="Guru Nanak" str={30} />
                <Kort x={1180} y={Y + 115} tekst="Guru Gobind Singh" str={30} />
            </Demp>
            <Vis nar={beat >= 1}>
                <Kort
                    x={980}
                    y={300}
                    tekst="1708: den siste menneskelige guruen"
                    str={30}
                    bakgrunn="#fef3c7"
                />
            </Vis>
            <Vis nar={beat >= 2}>
                <Pil x1={1290} y1={Y - 60} x2={1370} y2={Y - 60} farge="#b45309" />
                {beat >= 3 && (
                    <circle cx={1470} cy={Y - 80} r={130} fill="#fde68a" opacity={0.75} />
                )}
                {/* Baldakin og sete */}
                <rect x={1380} y={Y - 260} width={180} height={26} rx={8} fill="#b45309" />
                <rect x={1388} y={Y - 236} width={10} height={236} fill="#b45309" />
                <rect x={1542} y={Y - 236} width={10} height={236} fill="#b45309" />
                <rect x={1400} y={Y - 40} width={140} height={40} rx={8} fill="#fbbf24" />
                <Bok x={1470} y={Y - 92} skala={0.8} farge="#b45309" />
                <Kort x={1440} y={Y + 115} tekst="Boka" str={30} bakgrunn="#fef3c7" />
            </Vis>
            <Vis nar={beat >= 3}>
                <Kort
                    x={800}
                    y={190}
                    tekst="Guru Granth Sahib: den levende guruen"
                    str={38}
                    bakgrunn="#0f172a"
                    farge="#fff"
                />
            </Vis>
        </Flate>
    );
}

export function LedelseLinje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'jodedom';
    if (modus === 'hindu') return <Hindu beat={beat} />;
    if (modus === 'sangha') return <Sangha beat={beat} />;
    if (modus === 'sikh') return <Sikh beat={beat} />;
    return <Jodedom beat={beat} />;
}
