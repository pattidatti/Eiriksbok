import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { SekOverskrift } from './felles';

/**
 * De tre nivåene for sekularisering (SVG 1600x900).
 * «ord»: hva ordet betyr. Kirken står, men krona (makta) løfter seg av.
 * «tre»: samfunnet, organisasjonene og den enkelte, som tre tannhjul i ulikt tempo.
 * «skole»: nivå 2 i skoledagen: ingen bønn, KRLE om mange religioner.
 * «krangel»: to påstander om Norge peker på hvert sitt nivå.
 */

type Modus = 'ord' | 'tre' | 'skole' | 'krangel';

const BAKGRUNN = '#f4efe6';
const BLEKK = '#1c1917';
const DEMPET = '#78716c';

const NIVAER = [
    { tittel: 'I samfunnet', under: 'Lovene løsner fra kirken', farge: '#b45309', fart: 90 },
    { tittel: 'I organisasjonene', under: 'Skoler, hjelp og idrett', farge: '#0f766e', fart: 30 },
    {
        tittel: 'Hos den enkelte',
        under: 'Færre tror, går i kirken, er medlem',
        farge: '#4338ca',
        fart: 6,
    },
];

function Vis({ nar, children }: { nar: boolean; children: ReactNode }) {
    if (!nar) return null;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {children}
        </motion.g>
    );
}

/** Et tannhjul som går rundt med `fart` grader i sekundet når filmen spiller. */
function Tannhjul({
    cx,
    cy,
    r,
    farge,
    fart,
    gaar,
}: {
    cx: number;
    cy: number;
    r: number;
    farge: string;
    fart: number;
    gaar: boolean;
}) {
    const ref = useRef<SVGGElement>(null);
    useEffect(() => {
        const g = ref.current;
        if (!g) return;
        if (!gaar) {
            g.setAttribute('transform', `rotate(12 ${cx} ${cy})`);
            return;
        }
        let vinkel = 12;
        let sist = performance.now();
        let id = 0;
        const steg = (n: number) => {
            vinkel += ((n - sist) / 1000) * fart;
            sist = n;
            g.setAttribute('transform', `rotate(${vinkel.toFixed(2)} ${cx} ${cy})`);
            id = requestAnimationFrame(steg);
        };
        id = requestAnimationFrame(steg);
        return () => cancelAnimationFrame(id);
    }, [cx, cy, fart, gaar]);
    const tenner = 10;
    const d: string[] = [];
    for (let i = 0; i < tenner * 2; i++) {
        const a0 = (i / (tenner * 2)) * Math.PI * 2;
        const a1 = ((i + 1) / (tenner * 2)) * Math.PI * 2;
        const rr = i % 2 === 0 ? r : r * 0.8;
        d.push(
            `${i === 0 ? 'M' : 'L'} ${cx + Math.cos(a0) * rr} ${cy + Math.sin(a0) * rr} L ${cx + Math.cos(a1) * rr} ${cy + Math.sin(a1) * rr}`
        );
    }
    return (
        <g ref={ref} transform={`rotate(12 ${cx} ${cy})`}>
            <path d={d.join(' ') + ' Z'} fill={farge} />
            <circle cx={cx} cy={cy} r={r * 0.3} fill={BAKGRUNN} />
        </g>
    );
}

/** Rødt kryss ved siden av en tekst (ikke strek over). */
function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <g stroke="#dc2626" strokeWidth={12} strokeLinecap="round">
            <line x1={x - 24} y1={y - 24} x2={x + 24} y2={y + 24} />
            <line x1={x + 24} y1={y - 24} x2={x - 24} y2={y + 24} />
        </g>
    );
}

function Hake({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 28} ${y} L ${x - 6} ${y + 24} L ${x + 30} ${y - 26}`}
            stroke="#0d9488"
            strokeWidth={13}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    );
}

/** Enkel kirkesilhuett med tårn. */
function KirkeIkon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect
                x={-40}
                y={-120}
                width={240}
                height={150}
                fill="#fafaf9"
                stroke={BLEKK}
                strokeWidth={6}
            />
            <path d="M -50 -120 L 80 -200 L 210 -120 Z" fill="#44403c" />
            <rect
                x={-110}
                y={-210}
                width={80}
                height={240}
                fill="#fafaf9"
                stroke={BLEKK}
                strokeWidth={6}
            />
            <path d="M -120 -210 L -70 -320 L -20 -210 Z" fill="#292524" />
            <line x1={-70} y1={-320} x2={-70} y2={-370} stroke="#ca8a04" strokeWidth={8} />
            <line x1={-88} y1={-352} x2={-52} y2={-352} stroke="#ca8a04" strokeWidth={8} />
            <rect x={-88} y={-40} width={36} height={70} rx={18} fill="#78350f" />
            {[20, 80, 140].map((wx) => (
                <rect
                    key={wx}
                    x={wx}
                    y={-90}
                    width={30}
                    height={60}
                    rx={15}
                    fill="#bae6fd"
                    stroke={BLEKK}
                    strokeWidth={3}
                />
            ))}
        </g>
    );
}

function Krone({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -70 30 L -70 -20 L -40 10 L 0 -40 L 40 10 L 70 -20 L 70 30 Z"
                fill="#eab308"
                stroke="#a16207"
                strokeWidth={5}
                strokeLinejoin="round"
            />
            <circle cx={0} cy={-46} r={9} fill="#dc2626" />
        </g>
    );
}

/* ---------------------------------------------------------------- moduser */

function Ord({ beat }: { beat: number }) {
    return (
        <>
            <text x={110} y={260} fontSize={92} fontWeight={900} fill={BLEKK}>
                Sekularisering
            </text>
            <text x={110} y={330} fontSize={40} fontWeight={700} fill={DEMPET}>
                = religion mister makt over mennesker,
            </text>
            <text x={110} y={380} fontSize={40} fontWeight={700} fill={DEMPET}>
                kultur og samfunn
            </text>
            <Vis nar={beat >= 1}>
                <text x={110} y={520} fontSize={46} fontWeight={800} fill={BLEKK}>
                    Religionen forsvinner
                </text>
                <Kryss x={640} y={504} />
                <text x={110} y={610} fontSize={46} fontWeight={800} fill={BLEKK}>
                    Folk slutter å tro
                </text>
                <Kryss x={640} y={594} />
            </Vis>
            <Vis nar={beat >= 2}>
                <rect
                    x={90}
                    y={660}
                    width={640}
                    height={100}
                    rx={22}
                    fill="#ccfbf1"
                    stroke="#0d9488"
                    strokeWidth={5}
                />
                <text x={120} y={727} fontSize={46} fontWeight={900} fill="#115e59">
                    Religionen mister makt
                </text>
                <Hake x={680} y={708} />
            </Vis>
            <KirkeIkon x={1180} y={720} s={1.15} />
            <motion.g
                initial={false}
                animate={{ opacity: beat >= 2 ? 0.25 : 1 }}
                transition={{ duration: 1 }}
            >
                <Krone x={beat >= 2 ? 1420 : 1180} y={beat >= 2 ? 200 : 250} />
            </motion.g>
            <Vis nar={beat >= 2}>
                <text
                    x={1110}
                    y={810}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#115e59"
                >
                    Kirken står fortsatt
                </text>
                <text
                    x={1420}
                    y={300}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#a16207"
                >
                    makta
                </text>
            </Vis>
        </>
    );
}

function Baand({
    i,
    y,
    h,
    lys,
    gaar,
    visTempo,
}: {
    i: number;
    y: number;
    h: number;
    lys: boolean;
    gaar: boolean;
    visTempo: boolean;
}) {
    const n = NIVAER[i];
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: lys ? 1 : 0.35 }}
            transition={{ duration: 0.5 }}
        >
            <rect
                x={110}
                y={y}
                width={1380}
                height={h}
                rx={28}
                fill="#ffffff"
                stroke={n.farge}
                strokeWidth={lys ? 6 : 3}
            />
            <Tannhjul
                cx={230}
                cy={y + h / 2}
                r={h * 0.38}
                farge={n.farge}
                fart={n.fart}
                gaar={gaar}
            />
            <text x={360} y={y + h / 2 - 6} fontSize={50} fontWeight={900} fill={n.farge}>
                {i + 1}. {n.tittel}
            </text>
            <text x={360} y={y + h / 2 + 46} fontSize={36} fontWeight={700} fill={DEMPET}>
                {n.under}
            </text>
            {visTempo && (
                <text
                    x={1450}
                    y={y + h / 2 + 14}
                    textAnchor="end"
                    fontSize={40}
                    fontWeight={900}
                    fill={BLEKK}
                >
                    {i === 0 ? 'Kan skje på én dag' : i === 2 ? 'Tar generasjoner' : ''}
                </text>
            )}
        </motion.g>
    );
}

function Tre({ beat, playing }: { beat: number; playing: boolean }) {
    const gaar = beat >= 4 && playing;
    return (
        <>
            {beat === 0 && (
                <g>
                    {[0, 1, 2].map((i) => (
                        <g key={i}>
                            <rect
                                x={110}
                                y={200 + i * 220}
                                width={1380}
                                height={180}
                                rx={28}
                                fill="#ffffff"
                                stroke="#d6d3d1"
                                strokeWidth={4}
                            />
                            <text
                                x={800}
                                y={305 + i * 220}
                                textAnchor="middle"
                                fontSize={64}
                                fontWeight={900}
                                fill="#d6d3d1"
                            >
                                Nivå {i + 1}
                            </text>
                        </g>
                    ))}
                </g>
            )}
            {beat >= 1 &&
                [0, 1, 2].map((i) =>
                    beat >= i + 1 ? (
                        <Baand
                            key={i}
                            i={i}
                            y={200 + i * 220}
                            h={180}
                            lys={beat === i + 1 || beat >= 4}
                            gaar={gaar}
                            visTempo={beat >= 4}
                        />
                    ) : (
                        <g key={i}>
                            <rect
                                x={110}
                                y={200 + i * 220}
                                width={1380}
                                height={180}
                                rx={28}
                                fill="#ffffff"
                                stroke="#d6d3d1"
                                strokeWidth={4}
                            />
                            <text
                                x={800}
                                y={305 + i * 220}
                                textAnchor="middle"
                                fontSize={64}
                                fontWeight={900}
                                fill="#d6d3d1"
                            >
                                Nivå {i + 1}
                            </text>
                        </g>
                    )
                )}
        </>
    );
}

/** Enkle symboler for religioner og livssyn i KRLE. */
function Symboler({ x, y }: { x: number; y: number }) {
    const s = 'none';
    return (
        <g transform={`translate(${x} ${y})`} strokeLinecap="round" strokeLinejoin="round">
            {/* Kors */}
            <g transform="translate(0 0)" stroke="#b45309" strokeWidth={14} fill={s}>
                <line x1={0} y1={-50} x2={0} y2={50} />
                <line x1={-30} y1={-18} x2={30} y2={-18} />
            </g>
            {/* Halvmåne */}
            <g transform="translate(140 0)">
                <circle cx={0} cy={0} r={46} fill="#0f766e" />
                <circle cx={18} cy={-8} r={40} fill="#ffffff" />
            </g>
            {/* Davidsstjerne */}
            <g transform="translate(280 0)" stroke="#1d4ed8" strokeWidth={9} fill={s}>
                <path d="M 0 -50 L 43 25 L -43 25 Z" />
                <path d="M 0 50 L 43 -25 L -43 -25 Z" />
            </g>
            {/* Hjul */}
            <g transform="translate(420 0)" stroke="#ca8a04" strokeWidth={9} fill={s}>
                <circle cx={0} cy={0} r={44} />
                <circle cx={0} cy={0} r={10} />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
                    const a = (k / 8) * Math.PI * 2;
                    return (
                        <line
                            key={k}
                            x1={Math.cos(a) * 10}
                            y1={Math.sin(a) * 10}
                            x2={Math.cos(a) * 44}
                            y2={Math.sin(a) * 44}
                        />
                    );
                })}
            </g>
            {/* Menneske (livssyn) */}
            <g transform="translate(560 0)" fill="#7c3aed">
                <circle cx={0} cy={-30} r={16} />
                <path d="M -40 -10 Q 0 10 40 -10 L 14 4 L 10 50 L -10 50 L -14 4 Z" />
            </g>
        </g>
    );
}

function Skole({ beat }: { beat: number }) {
    return (
        <>
            {/* Nivå 2-båndet øverst */}
            <rect
                x={110}
                y={170}
                width={1380}
                height={130}
                rx={26}
                fill="#ffffff"
                stroke="#0f766e"
                strokeWidth={5}
            />
            <Tannhjul cx={200} cy={235} r={46} farge="#0f766e" fart={30} gaar={false} />
            <text x={280} y={252} fontSize={46} fontWeight={900} fill="#0f766e">
                2. I organisasjonene
            </text>
            <text x={1450} y={252} textAnchor="end" fontSize={36} fontWeight={700} fill={DEMPET}>
                Fra kirken til andre
            </text>

            {beat === 0 && (
                <g>
                    {['Skoler', 'Hjelpeorganisasjoner', 'Idrettslag'].map((t, i) => (
                        <motion.g
                            key={t}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.4 }}
                        >
                            <rect
                                x={160 + i * 470}
                                y={420}
                                width={400}
                                height={260}
                                rx={28}
                                fill="#f0fdfa"
                                stroke="#0f766e"
                                strokeWidth={4}
                            />
                            <text
                                x={360 + i * 470}
                                y={570}
                                textAnchor="middle"
                                fontSize={i === 1 ? 30 : 48}
                                fontWeight={900}
                                fill="#115e59"
                            >
                                {t}
                            </text>
                            <text
                                x={360 + i * 470}
                                y={630}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={700}
                                fill={DEMPET}
                            >
                                mindre religiøse
                            </text>
                        </motion.g>
                    ))}
                </g>
            )}

            {beat >= 1 && (
                <g>
                    {/* Skoledagen */}
                    <rect
                        x={160}
                        y={360}
                        width={600}
                        height={440}
                        rx={28}
                        fill="#ffffff"
                        stroke={BLEKK}
                        strokeWidth={5}
                    />
                    <text
                        x={460}
                        y={430}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        Skoledagen din
                    </text>
                    <line x1={200} y1={460} x2={720} y2={460} stroke="#e7e5e4" strokeWidth={4} />
                    <text x={220} y={545} fontSize={44} fontWeight={800} fill={BLEKK}>
                        Begynner med bønn
                    </text>
                    <Kryss x={690} y={530} />
                    <Vis nar={beat >= 2}>
                        <rect
                            x={200}
                            y={600}
                            width={520}
                            height={160}
                            rx={20}
                            fill="#fef3c7"
                            stroke="#b45309"
                            strokeWidth={4}
                        />
                        <text
                            x={460}
                            y={665}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#92400e"
                        >
                            KRLE
                        </text>
                        <text
                            x={460}
                            y={720}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#92400e"
                        >
                            flere religioner og livssyn
                        </text>
                    </Vis>
                </g>
            )}
            <Vis nar={beat >= 2}>
                <rect
                    x={840}
                    y={360}
                    width={620}
                    height={250}
                    rx={28}
                    fill="#ffffff"
                    stroke="#d6d3d1"
                    strokeWidth={4}
                />
                <text
                    x={1150}
                    y={420}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={DEMPET}
                >
                    ved siden av hverandre
                </text>
                <Symboler x={870} y={520} />
            </Vis>
            <Vis nar={beat >= 3}>
                <rect
                    x={840}
                    y={650}
                    width={620}
                    height={150}
                    rx={28}
                    fill="#ccfbf1"
                    stroke="#0d9488"
                    strokeWidth={5}
                />
                <text
                    x={1150}
                    y={712}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={900}
                    fill="#115e59"
                >
                    En annen oppgave
                </text>
                <text
                    x={1150}
                    y={762}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={700}
                    fill="#115e59"
                >
                    enn skolen hadde i 1850
                </text>
            </Vis>
        </>
    );
}

function Boble({
    x,
    y,
    tekst,
    lys,
    farge,
}: {
    x: number;
    y: number;
    tekst: string;
    lys: boolean;
    farge: string;
}) {
    const b = Math.max(420, tekst.length * 25 + 80);
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: lys ? 1 : 0.4 }}
            transition={{ duration: 0.4 }}
        >
            <rect
                x={x - b / 2}
                y={y - 60}
                width={b}
                height={110}
                rx={50}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={6}
            />
            <path
                d={`M ${x - 30} ${y + 48} L ${x} ${y + 95} L ${x + 30} ${y + 48} Z`}
                fill={farge}
            />
            <text x={x} y={y + 12} textAnchor="middle" fontSize={44} fontWeight={900} fill={BLEKK}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Krangel({ beat }: { beat: number }) {
    const venstre = beat === 0 || beat >= 2;
    const hoyre = beat >= 1;
    return (
        <>
            <Boble
                x={430}
                y={230}
                tekst="Norge er et kristent land"
                lys={venstre && beat !== 1}
                farge="#b45309"
            />
            {beat >= 1 && (
                <Boble
                    x={1170}
                    y={230}
                    tekst="Norge er blitt gudløst"
                    lys={hoyre && beat !== 0}
                    farge="#4338ca"
                />
            )}
            {[0, 1, 2].map((i) => {
                const n = NIVAER[i];
                const y = 370 + i * 130;
                const lys = (i === 0 && venstre) || (i === 2 && hoyre);
                return (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={{ opacity: lys ? 1 : 0.3 }}
                        transition={{ duration: 0.4 }}
                    >
                        <rect
                            x={360}
                            y={y}
                            width={880}
                            height={105}
                            rx={24}
                            fill="#ffffff"
                            stroke={n.farge}
                            strokeWidth={lys ? 6 : 3}
                        />
                        <text
                            x={800}
                            y={y + 68}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={n.farge}
                        >
                            {i === 0
                                ? 'Lovene og historien'
                                : i === 1
                                  ? 'Organisasjonene'
                                  : 'Hva folk faktisk tror'}
                        </text>
                    </motion.g>
                );
            })}
            {venstre && beat !== 1 && (
                <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    d="M 300 330 Q 220 390 350 420"
                    stroke="#b45309"
                    strokeWidth={8}
                    fill="none"
                    markerEnd="url(#sek-pil-a)"
                />
            )}
            {hoyre && beat !== 0 && (
                <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    d="M 1300 330 Q 1440 500 1250 690"
                    stroke="#4338ca"
                    strokeWidth={8}
                    fill="none"
                    markerEnd="url(#sek-pil-b)"
                />
            )}
            <Vis nar={beat === 2}>
                <text
                    x={800}
                    y={830}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f766e"
                >
                    Begge kan ha rett: de måler ulike ting
                </text>
            </Vis>
            <Vis nar={beat >= 3}>
                <text
                    x={800}
                    y={830}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill={BLEKK}
                >
                    Hvilket nivå snakker du om?
                </text>
            </Vis>
        </>
    );
}

const OVERSKRIFT: Record<Modus, (string | null)[]> = {
    ord: [null, null, null],
    tre: [
        'Tre nivåer',
        'Nivå 1: samfunnet',
        'Nivå 2: organisasjonene',
        'Nivå 3: hver enkelt',
        'Ulikt tempo',
    ],
    skole: [null, null, null, null],
    krangel: [null, null, null, null],
};

export function SekulariseringNivaer({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'tre';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: BAKGRUNN }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <marker
                        id="sek-pil-a"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#b45309" />
                    </marker>
                    <marker
                        id="sek-pil-b"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#4338ca" />
                    </marker>
                </defs>
                {modus === 'ord' && <Ord beat={beat} />}
                {modus === 'tre' && <Tre beat={beat} playing={playing} />}
                {modus === 'skole' && <Skole beat={beat} />}
                {modus === 'krangel' && <Krangel beat={beat} />}
            </svg>
            {tekst && <SekOverskrift tekst={tekst} />}
        </div>
    );
}
