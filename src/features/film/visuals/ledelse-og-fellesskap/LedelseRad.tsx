import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Demp, Figur, Flate, Kort, Overskrift, Vis } from './felles';

/**
 * Uten sjef: tre moduser i 2D.
 * - uenig: to som er uenige, spørsmålene, og veiskillet (noen avgjør / en måte uten sjef).
 * - rad: sunniislam uten topp, ulama, mufti gir råd (fatwa), qadi dømmer.
 * - ijma: enigheten som autoritet, de fire røttene, hvem som må være enige, og marja i sjiaislam.
 */

type Modus = 'uenig' | 'rad' | 'ijma';

const GRONN = '#0f9f6e';
const GRA = '#94a3b8';

function Pil({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    return (
        <motion.path
            d={`M ${x1} ${y1} L ${x2} ${y2}`}
            stroke="#475569"
            strokeWidth={7}
            fill="none"
            markerEnd="url(#ledelse-pil)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7 }}
        />
    );
}

/** Små symboler for de tre svarene. */
function Topp({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M 0 -110 L 110 80 L -110 80 Z"
                fill="#c7d2fe"
                stroke="#4f46e5"
                strokeWidth={6}
            />
            <circle cx={0} cy={-110} r={24} fill="#4f46e5" />
        </g>
    );
}
function Rad({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={0} cy={-10} r={70} fill="#fde68a" stroke="#b45309" strokeWidth={6} />
            {Array.from({ length: 9 }, (_, i) => {
                const a = (i / 9) * Math.PI * 2;
                return (
                    <circle
                        key={i}
                        cx={Math.cos(a) * 92}
                        cy={-10 + Math.sin(a) * 92}
                        r={15}
                        fill="#b45309"
                    />
                );
            })}
        </g>
    );
}
const NETT: [number, number][] = [
    [-100, -60],
    [20, -100],
    [110, -20],
    [60, 80],
    [-70, 70],
];
function Nettverk({
    x,
    y,
    farge = GRONN,
    r = 22,
}: {
    x: number;
    y: number;
    farge?: string;
    r?: number;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {NETT.map((a, i) =>
                NETT.slice(i + 1).map((b, j) => (
                    <line
                        key={`${i}-${j}`}
                        x1={a[0]}
                        y1={a[1]}
                        x2={b[0]}
                        y2={b[1]}
                        stroke={farge}
                        strokeOpacity={0.45}
                        strokeWidth={5}
                    />
                ))
            )}
            {NETT.map(([nx, ny], i) => (
                <circle key={i} cx={nx} cy={ny} r={r} fill={farge} />
            ))}
        </g>
    );
}

function Uenig({ beat }: { beat: number }) {
    return (
        <Flate>
            <Overskrift>Hvem har rett når to er uenige?</Overskrift>
            <Vis nar={beat >= 1}>
                <Kort x={800} y={190} tekst="Kan en kvinne lede bønnen?" kant="#cbd5e1" />
                <Kort x={800} y={285} tekst="Et helt nytt spørsmål fra medisinen?" kant="#cbd5e1" />
            </Vis>
            <Vis nar={beat <= 2}>
                <Figur x={200} y={700} farge="#0d9488" skala={1.6} />
                <Figur x={1400} y={700} farge="#b45309" skala={1.6} />
                <circle cx={330} cy={420} r={58} fill="#fff" stroke="#0d9488" strokeWidth={6} />
                <text
                    x={330}
                    y={452}
                    textAnchor="middle"
                    fontSize={88}
                    fontWeight={900}
                    fill="#0d9488"
                >
                    ?
                </text>
                <circle cx={1270} cy={420} r={58} fill="#fff" stroke="#b45309" strokeWidth={6} />
                <text
                    x={1270}
                    y={452}
                    textAnchor="middle"
                    fontSize={88}
                    fontWeight={900}
                    fill="#b45309"
                >
                    !
                </text>
            </Vis>
            <Vis nar={beat === 2}>
                <Pil x1={800} y1={380} x2={600} y2={640} />
                <Pil x1={800} y1={380} x2={1000} y2={640} />
                <Kort x={600} y={720} tekst="Noen avgjør" str={42} bakgrunn="#e0e7ff" />
                <Kort x={1000} y={720} tekst="En måte uten sjef" str={42} bakgrunn="#d1fae5" />
            </Vis>
            <Vis nar={beat >= 3}>
                <Topp x={360} y={560} />
                <Kort x={360} y={720} tekst="En topp" bakgrunn="#e0e7ff" />
                <Rad x={800} y={560} />
                <Kort x={800} y={720} tekst="Et valgt råd" bakgrunn="#fef3c7" />
                <Nettverk x={1240} y={550} />
                <Kort x={1240} y={720} tekst="Et nettverk uten topp" bakgrunn="#d1fae5" />
            </Vis>
        </Flate>
    );
}

function RadModus({ beat }: { beat: number }) {
    const flyt = beat >= 2;
    return (
        <Flate>
            <Overskrift>{flyt ? 'Et råd og en dom' : 'Sunniislam: ingen på toppen'}</Overskrift>
            <Vis nar={!flyt}>
                <circle
                    cx={800}
                    cy={250}
                    r={62}
                    fill="none"
                    stroke={GRA}
                    strokeWidth={6}
                    strokeDasharray="14 10"
                />
                <path
                    d="M 760 210 L 840 290 M 840 210 L 760 290"
                    stroke="#dc2626"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <Kort
                    x={1150}
                    y={250}
                    tekst="Ingen sentral læremyndighet"
                    str={30}
                    kant="#fecaca"
                />
                <Nettverk x={800} y={540} r={30} />
                <Vis nar={beat >= 1}>
                    <Kort
                        x={800}
                        y={760}
                        tekst="Ulama: de som har religiøs kunnskap"
                        str={40}
                        bakgrunn="#d1fae5"
                    />
                </Vis>
            </Vis>
            <Vis nar={flyt}>
                <g transform="translate(200 520) scale(0.6)">
                    <Nettverk x={0} y={0} r={30} />
                </g>
                <Kort x={200} y={680} tekst="Ulama" bakgrunn="#d1fae5" />
                {/* Rad 1: spørsmål -> mufti -> fatwa */}
                <Figur x={500} y={420} farge="#64748b" skala={1.15} />
                <Kort x={500} y={470} tekst="Spørsmål" str={28} />
                <Pil x1={570} y1={340} x2={730} y2={340} />
                <Figur x={820} y={420} farge={GRONN} skala={1.15} />
                <Kort x={820} y={470} tekst="Mufti" str={30} bakgrunn="#d1fae5" />
                <Pil x1={890} y1={340} x2={1050} y2={340} />
                <Demp lys={beat !== 4}>
                    <rect
                        x={1080}
                        y={250}
                        width={150}
                        height={190}
                        rx={10}
                        fill="#fff"
                        stroke="#94a3b8"
                        strokeWidth={4}
                    />
                    {[290, 325, 360, 395].map((ly) => (
                        <line
                            key={ly}
                            x1={1105}
                            y1={ly}
                            x2={1205}
                            y2={ly}
                            stroke="#cbd5e1"
                            strokeWidth={8}
                        />
                    ))}
                    <Kort x={1155} y={480} tekst="Fatwa: et råd" str={30} />
                </Demp>
            </Vis>
            <Vis nar={beat >= 3}>
                <Figur x={820} y={760} farge="#7c3aed" skala={1.15} />
                <Kort x={820} y={810} tekst="Qadi: dommer" str={30} bakgrunn="#ede9fe" />
                <Pil x1={890} y1={680} x2={1050} y2={680} />
                {/* Klubbe */}
                <g transform="translate(1155 690) rotate(-30)">
                    <rect x={-60} y={-24} width={120} height={48} rx={10} fill="#7c3aed" />
                    <rect x={-8} y={20} width={16} height={90} rx={6} fill="#a78bfa" />
                </g>
                <Kort x={1155} y={810} tekst="Dom" str={30} bakgrunn="#ede9fe" />
            </Vis>
            <Vis nar={beat === 4}>
                <Kort
                    x={1300}
                    y={575}
                    tekst="Et råd er ikke en dom"
                    str={38}
                    bakgrunn="#0f172a"
                    farge="#fff"
                />
                <rect
                    x={1050}
                    y={625}
                    width={210}
                    height={225}
                    rx={20}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth={8}
                />
            </Vis>
        </Flate>
    );
}

// Faste, pseudotilfeldige plasser, så bildet blir likt fra kjøring til kjøring.
function tilf(i: number) {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
}
const RING = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    return {
        fra: [200 + tilf(i) * 1200, 160 + tilf(i + 50) * 640],
        til: [800 + Math.cos(a) * 190, 400 + Math.sin(a) * 150],
    };
});
const MENGDE = Array.from({ length: 260 }, (_, i) => {
    const r = Math.sqrt(tilf(i + 100)) * 300;
    const a = tilf(i + 400) * Math.PI * 2;
    return [800 + Math.cos(a) * r * 1.6, 520 + Math.sin(a) * r * 0.95] as const;
});

// En tett, utellbar klynge midt i mengden.
const JURISTER = Array.from({ length: 34 }, (_, i) => {
    const r = Math.sqrt(tilf(i + 900)) * 95;
    const a = tilf(i + 1200) * Math.PI * 2;
    return [800 + Math.cos(a) * r * 1.3, 520 + Math.sin(a) * r] as const;
});

function Ijma({ beat }: { beat: number }) {
    const tittel =
        beat <= 1
            ? 'Ijma: enighet'
            : beat <= 3
              ? 'Hvem må være enige?'
              : 'Tolversjiaismen: et forbilde å følge';
    return (
        <Flate>
            <Overskrift>{tittel}</Overskrift>
            <Vis nar={beat <= 1}>
                {RING.map((p, i) => (
                    <motion.g
                        key={i}
                        initial={{ x: p.fra[0], y: p.fra[1] }}
                        animate={{ x: p.til[0], y: p.til[1] }}
                        transition={{
                            duration: 1.6,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.3 + (i % 6) * 0.05,
                        }}
                    >
                        <circle r={18} fill={GRONN} />
                    </motion.g>
                ))}
                <Kort x={800} y={400} tekst="Enigheten avgjør" str={34} bakgrunn="#d1fae5" />
            </Vis>
            <Vis nar={beat === 1}>
                <Kort x={800} y={620} tekst="De fire røttene retten bygger på" str={36} />
                {[0, 1, 2, 3].map((i) => {
                    const x = 470 + i * 220;
                    const lys = i === 2;
                    return (
                        <g key={i}>
                            <rect
                                x={x - 70}
                                y={670}
                                width={140}
                                height={160}
                                rx={14}
                                fill={lys ? GRONN : '#e2e8f0'}
                            />
                            <text
                                x={x}
                                y={770}
                                textAnchor="middle"
                                fontSize={64}
                                fontWeight={900}
                                fill={lys ? '#fff' : '#64748b'}
                            >
                                {i + 1}
                            </text>
                        </g>
                    );
                })}
                <Kort x={1350} y={750} tekst="3: ijma" str={40} bakgrunn={GRONN} farge="#fff" />
            </Vis>
            <Vis nar={beat === 2 || beat === 3}>
                {MENGDE.map(([x, y], i) => {
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={10}
                            fill={beat === 2 ? GRONN : '#d5dbe3'}
                        />
                    );
                })}
                {beat === 3 &&
                    JURISTER.map(([x, y], i) => (
                        <circle key={`j${i}`} cx={x} cy={y} r={13} fill="#065f46" />
                    ))}
                {beat === 2 ? (
                    <Kort
                        x={800}
                        y={170}
                        tekst="al-Shafi'i (død 820): alle troende"
                        str={36}
                        bakgrunn="#d1fae5"
                    />
                ) : (
                    <Kort
                        x={800}
                        y={170}
                        tekst="Senere lærde: bare juristene"
                        str={36}
                        bakgrunn="#065f46"
                        farge="#fff"
                    />
                )}
                {beat === 2 && (
                    <Kort
                        x={800}
                        y={835}
                        tekst="Da kan det bare gjelde det mest grunnleggende"
                        str={36}
                    />
                )}
                {beat === 3 && (
                    <circle
                        cx={800}
                        cy={520}
                        r={128}
                        fill="none"
                        stroke="#065f46"
                        strokeWidth={6}
                        strokeDasharray="12 10"
                    />
                )}
            </Vis>
            <Vis nar={beat >= 4}>
                <circle cx={800} cy={290} r={64} fill="#f59e0b" />
                <Kort x={800} y={400} tekst="Marja: et forbilde" str={36} bakgrunn="#fef3c7" />
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    const x = 400 + i * 160;
                    return (
                        <g key={i}>
                            <line
                                x1={800}
                                y1={440}
                                x2={x}
                                y2={600}
                                stroke="#b45309"
                                strokeWidth={5}
                                strokeOpacity={0.6}
                            />
                            <Figur x={x} y={780} farge="#475569" skala={1} />
                        </g>
                    );
                })}
                <Kort x={800} y={840} tekst="Hver troende skal ha en marja" str={32} />
            </Vis>
        </Flate>
    );
}

export function LedelseRad({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'uenig';
    if (modus === 'rad') return <RadModus beat={beat} />;
    if (modus === 'ijma') return <Ijma beat={beat} />;
    return <Uenig beat={beat} />;
}
