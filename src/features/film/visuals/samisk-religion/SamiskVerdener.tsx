import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Snitt av verdenene i samisk religion. «verdener»: menneskenes verden og de andre rundt
 * den. «reise»: noaiden slår på trommen, frisjelen reiser ned til de dødes rike og kommer
 * tilbake. «balanse»: å ta og gi tilbake. «joik»: lyden som er fjellet, dyret og personen.
 */

type Modus = 'verdener' | 'reise' | 'balanse' | 'joik';

const B = 1600;
const H = 900;

interface Felt {
    id: string;
    navn: string;
    x: number;
    y: number;
    w: number;
    h: number;
    farge: string;
    fraBeat: number;
}

const FELT: Felt[] = [
    {
        id: 'himmel',
        navn: 'Himmelen',
        x: 300,
        y: 30,
        w: 1000,
        h: 130,
        farge: '#bfdbfe',
        fraBeat: 2,
    },
    {
        id: 'dyr',
        navn: 'Dyrenes verden',
        x: 40,
        y: 190,
        w: 400,
        h: 250,
        farge: '#d9f99d',
        fraBeat: 2,
    },
    {
        id: 'menneske',
        navn: 'Menneskenes verden',
        x: 470,
        y: 190,
        w: 660,
        h: 250,
        farge: '#fef3c7',
        fraBeat: 0,
    },
    {
        id: 'saivu',
        navn: 'Sáivu, det gode',
        x: 1160,
        y: 190,
        w: 400,
        h: 250,
        farge: '#a7f3d0',
        fraBeat: 2,
    },
    {
        id: 'dode',
        navn: 'Jábmiid áibmu: de dødes rike',
        x: 300,
        y: 470,
        w: 1000,
        h: 250,
        farge: '#c7d2fe',
        fraBeat: 1,
    },
    {
        id: 'under',
        navn: 'Underverdenen',
        x: 300,
        y: 750,
        w: 1000,
        h: 120,
        farge: '#d6d3d1',
        fraBeat: 2,
    },
];

function Fjell({
    x,
    y,
    s = 1,
    farge = '#64748b',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -90 0 L -20 -110 L 20 -60 L 50 -90 L 110 0 Z" fill={farge} />
            <path d="M -20 -110 L -42 -76 L -24 -82 L -8 -72 L 6 -90 Z" fill="#f8fafc" />
        </g>
    );
}

function Lavvu({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -45 0 L 0 -90 L 45 0 Z" fill="#a9875e" />
            <path
                d="M -8 -80 L 0 -104 M 8 -80 L 0 -104 M 0 -90 L 0 -108"
                stroke="#4a3826"
                strokeWidth={5}
            />
            <path d="M -12 0 L 0 -30 L 12 0 Z" fill="#3a2a1a" />
        </g>
    );
}

function Menneske({
    x,
    y,
    farge = '#1e293b',
    s = 1,
    opacity = 1,
}: {
    x: number;
    y: number;
    farge?: string;
    s?: number;
    opacity?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
            <circle cx={0} cy={-62} r={14} fill={farge} />
            <path d="M -20 0 L -14 -44 Q 0 -52 14 -44 L 20 0 Z" fill={farge} />
        </g>
    );
}

function Rein({
    x,
    y,
    s = 1,
    farge = '#57534e',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`} fill={farge} stroke={farge}>
            <rect x={-40} y={-50} width={70} height={26} rx={10} />
            <rect x={-36} y={-28} width={7} height={28} />
            <rect x={-20} y={-28} width={7} height={28} />
            <rect x={6} y={-28} width={7} height={28} />
            <rect x={20} y={-28} width={7} height={28} />
            <path d="M 26 -48 L 44 -68 L 54 -62 L 38 -42 Z" />
            <path
                d="M 44 -68 L 36 -96 M 44 -68 L 58 -96 M 40 -82 L 28 -88 M 52 -84 L 64 -86"
                fill="none"
                strokeWidth={4}
                strokeLinecap="round"
            />
        </g>
    );
}

function Tre({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-5} y={-30} width={10} height={30} fill="#5b4630" />
            <path d="M -32 -26 L 0 -110 L 32 -26 Z" fill="#3f6b45" />
        </g>
    );
}

function Stein({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <path
            transform={`translate(${x} ${y}) scale(${s})`}
            d="M -50 0 L -42 -40 L -6 -62 L 34 -48 L 50 0 Z"
            fill="#8b8478"
        />
    );
}

function Vann({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g
            transform={`translate(${x} ${y}) scale(${s})`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={8}
            strokeLinecap="round"
        >
            <path d="M -50 -40 Q -25 -55 0 -40 T 50 -40" />
            <path d="M -50 -15 Q -25 -30 0 -15 T 50 -15" />
        </g>
    );
}

/** Trommen: en oval med figurer, og ringer som slår ut i takt. */
function Tromme({
    x,
    y,
    slår,
    playing,
}: {
    x: number;
    y: number;
    slår: boolean;
    playing: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {slår &&
                [0, 1, 2].map((i) => (
                    <motion.ellipse
                        key={i}
                        cx={0}
                        cy={0}
                        rx={46}
                        ry={36}
                        fill="none"
                        stroke="#b45309"
                        strokeWidth={4}
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={
                            playing
                                ? { scale: [1, 2.6], opacity: [0.8, 0] }
                                : { scale: 1.6, opacity: 0.4 }
                        }
                        transition={
                            playing
                                ? {
                                      duration: 1.6,
                                      repeat: Infinity,
                                      delay: i * 0.53,
                                      ease: 'easeOut',
                                  }
                                : { duration: 0 }
                        }
                    />
                ))}
            <ellipse
                cx={0}
                cy={0}
                rx={46}
                ry={36}
                fill="#e9cf9f"
                stroke="#7c4a1e"
                strokeWidth={5}
            />
            <path d="M -30 0 L 30 0 M 0 -26 L 0 26" stroke="#9a3412" strokeWidth={3} />
            <circle cx={-14} cy={-12} r={5} fill="#9a3412" />
            <circle cx={14} cy={12} r={5} fill="#9a3412" />
            <path d="M 14 -18 l 6 -8 l 6 8 Z M -20 10 l 6 -8 l 6 8 Z" fill="#9a3412" />
        </g>
    );
}

/** Innholdet i hvert felt: det eleven skal se der. */
function Innhold({ id }: { id: string }) {
    switch (id) {
        case 'himmel':
            return (
                <g>
                    <circle cx={800} cy={95} r={38} fill="#fbbf24" />
                    {[620, 980, 1120, 480].map((x, i) => (
                        <circle key={x} cx={x} cy={70 + (i % 2) * 40} r={6} fill="#fff" />
                    ))}
                </g>
            );
        case 'dyr':
            return (
                <g>
                    <Rein x={170} y={400} s={1.1} />
                    <Rein x={320} y={410} s={0.9} />
                </g>
            );
        case 'menneske':
            return (
                <g>
                    <Fjell x={620} y={420} s={1.1} />
                    <Lavvu x={830} y={420} s={1.1} />
                    <Tre x={1010} y={420} />
                    <Tre x={1070} y={420} s={0.8} />
                </g>
            );
        case 'saivu':
            return (
                <g>
                    <Fjell x={1360} y={420} s={1.1} farge="#059669" />
                    <circle cx={1360} cy={300} r={60} fill="#fef08a" opacity={0.5} />
                </g>
            );
        case 'dode':
            return (
                <g>
                    {[560, 680, 800, 920, 1040].map((x, i) => (
                        <Menneske key={x} x={x} y={690} farge="#4338ca" s={0.95 + (i % 2) * 0.1} />
                    ))}
                    <Lavvu x={440} y={690} s={0.8} />
                </g>
            );
        default:
            return (
                <g>
                    {[480, 700, 900, 1120].map((x) => (
                        <path
                            key={x}
                            d={`M ${x - 40} 850 L ${x} 800 L ${x + 40} 850 Z`}
                            fill="#78716c"
                        />
                    ))}
                </g>
            );
    }
}

/** Et punkt som glir mellom to steder; viser frisjelen på reise. */
function useGlid(mål: [number, number], playing: boolean) {
    const [pos, setPos] = useState<[number, number]>(mål);
    const naa = useRef(pos);
    useEffect(() => {
        const fra = naa.current;
        if (fra[0] === mål[0] && fra[1] === mål[1]) return;
        const c = animate(0, 1, {
            duration: playing ? 2.6 : 0.01,
            delay: playing ? 0.6 : 0,
            ease: 'easeInOut',
            onUpdate: (k) => {
                const ny: [number, number] = [
                    fra[0] + (mål[0] - fra[0]) * k,
                    fra[1] + (mål[1] - fra[1]) * k,
                ];
                naa.current = ny;
                setPos(ny);
            },
        });
        return () => c.stop();
    }, [mål[0], mål[1], playing]); // eslint-disable-line react-hooks/exhaustive-deps
    return pos;
}

function Verdener({ beat, modus, playing }: { beat: number; modus: Modus; playing: boolean }) {
    const reise = modus === 'reise';
    // Reisen: alle verdener er der, men dempet. Bare menneskene og de døde er i fokus.
    const synlig = (f: Felt) => (reise ? true : beat >= f.fraBeat);
    const sterk = (f: Felt) => (reise ? f.id === 'menneske' || f.id === 'dode' : true);
    const SJEL_HJEMME: [number, number] = [930, 330];
    const SJEL_DODE: [number, number] = [800, 560];
    const mål = !reise || beat === 0 ? SJEL_HJEMME : beat === 3 ? SJEL_HJEMME : SJEL_DODE;
    const sjel = useGlid(mål, playing);
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {FELT.map((f) => (
                <motion.g
                    key={f.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: synlig(f) ? (sterk(f) ? 1 : 0.35) : 0.18 }}
                    transition={{ duration: 0.9 }}
                >
                    <rect
                        x={f.x}
                        y={f.y}
                        width={f.w}
                        height={f.h}
                        rx={28}
                        fill={synlig(f) ? f.farge : '#f1f5f9'}
                        stroke={synlig(f) ? '#475569' : '#94a3b8'}
                        strokeWidth={3}
                        strokeDasharray={synlig(f) ? undefined : '14 10'}
                    />
                    {synlig(f) && <Innhold id={f.id} />}
                    {synlig(f) && (
                        <text
                            x={f.x + 24}
                            y={f.y + 46}
                            fontSize={f.id === 'dyr' || f.id === 'saivu' ? 32 : 38}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            {f.navn}
                        </text>
                    )}
                </motion.g>
            ))}
            {/* Stiene mellom verdenene */}
            {!reise &&
                beat >= 3 &&
                [
                    [800, 190, 800, 160],
                    [470, 315, 440, 315],
                    [1130, 315, 1160, 315],
                    [800, 440, 800, 470],
                    [800, 720, 800, 750],
                ].map(([x1, y1, x2, y2], i) => (
                    <motion.circle
                        key={i}
                        cx={(x1 + x2) / 2}
                        cy={(y1 + y2) / 2}
                        r={18}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={4}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            delay: 0.3 + i * 0.35,
                            type: 'spring',
                            stiffness: 200,
                            damping: 14,
                        }}
                    />
                ))}
            {reise && (
                <>
                    {/* Noaiden og trommen; kroppen blir grå når sjelen er borte */}
                    <Menneske
                        x={930}
                        y={420}
                        farge={beat === 1 || beat === 2 ? '#94a3b8' : '#1d4ed8'}
                        s={1.4}
                    />
                    <Tromme x={1040} y={350} slår={beat === 0 || beat === 3} playing={playing} />
                    {beat === 2 &&
                        [700, 900].map((x, i) => (
                            <motion.circle
                                key={x}
                                cx={x}
                                cy={540}
                                r={16}
                                fill="#fde68a"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{
                                    duration: 2,
                                    repeat: playing ? Infinity : 0,
                                    delay: i * 0.5,
                                }}
                            />
                        ))}
                    <circle cx={sjel[0]} cy={sjel[1]} r={34} fill="#fde68a" opacity={0.35} />
                    <circle
                        cx={sjel[0]}
                        cy={sjel[1]}
                        r={18}
                        fill="#fbbf24"
                        stroke="#fff"
                        strokeWidth={4}
                    />
                </>
            )}
        </svg>
    );
}

const REISE_LAPPER = [
    'Transe: en slags dyp drøm',
    'Frisjelen reiser. Kroppen ligger igjen.',
    'Forfedrene og hjelpeåndene',
    'Tilbake med svar',
];

/** Vekta: å ta fra naturen og å gi tilbake. */
function Balanse({ beat, playing }: { beat: number; playing: boolean }) {
    // Vekta tipper mot «ta» først, og retter seg opp når gaven legges i den andre skåla.
    const [vinkel, setVinkel] = useState(0);
    useEffect(() => {
        const c =
            beat === 1
                ? animate(0, [0, -12, -12, 0], {
                      duration: playing ? 4 : 0,
                      times: [0, 0.25, 0.45, 1],
                      onUpdate: setVinkel,
                  })
                : animate(vinkel, 0, { duration: playing ? 1 : 0, onUpdate: setVinkel });
        return () => c.stop();
    }, [beat, playing]); // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            <rect width={B} height={H} fill="#f7f3ea" />
            {beat === 0 ? (
                <g>
                    <text
                        x={800}
                        y={140}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Animisme
                    </text>
                    <text
                        x={800}
                        y={210}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#475569"
                    >
                        Alt har en åndelig kraft
                    </text>
                    {[
                        { x: 340, el: <Tre x={0} y={0} s={1.8} />, navn: 'tre' },
                        { x: 640, el: <Rein x={-10} y={0} s={1.7} />, navn: 'dyr' },
                        { x: 960, el: <Stein x={0} y={0} s={1.7} />, navn: 'stein' },
                        { x: 1260, el: <Vann x={0} y={0} s={1.7} />, navn: 'vann' },
                    ].map((t, i) => (
                        <motion.g
                            key={t.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + i * 0.6 }}
                        >
                            <motion.circle
                                cx={t.x}
                                cy={540}
                                r={140}
                                fill="#fde68a"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.45 }}
                                transition={{ delay: 0.9 + i * 0.6, duration: 1.2 }}
                            />
                            <g transform={`translate(${t.x} 620)`}>{t.el}</g>
                            <text
                                x={t.x}
                                y={740}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={800}
                                fill="#0f172a"
                            >
                                {t.navn}
                            </text>
                        </motion.g>
                    ))}
                </g>
            ) : (
                <g>
                    <text
                        x={800}
                        y={120}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        {beat === 1 ? 'Du tar, og du gir tilbake' : 'Balanse, ikke å eie mest'}
                    </text>
                    <path d="M 760 820 L 800 380 L 840 820 Z" fill="#78716c" />
                    <rect
                        x={360}
                        y={370}
                        width={880}
                        height={20}
                        rx={10}
                        fill="#57534e"
                        transform={`rotate(${vinkel} 800 380)`}
                    />
                    {/* Venstre skål: det du tar */}
                    <g
                        transform={`translate(420 ${390 + Math.sin((-vinkel * Math.PI) / 180) * 380})`}
                    >
                        <line x1={0} y1={0} x2={0} y2={180} stroke="#57534e" strokeWidth={5} />
                        <path d="M -120 180 L 120 180 L 90 230 L -90 230 Z" fill="#a8a29e" />
                        <Rein x={-10} y={176} s={1.2} />
                        <text
                            x={0}
                            y={300}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            ta
                        </text>
                    </g>
                    {/* Høyre skål: det du gir tilbake */}
                    <g
                        transform={`translate(1180 ${390 - Math.sin((-vinkel * Math.PI) / 180) * 380})`}
                    >
                        <line x1={0} y1={0} x2={0} y2={180} stroke="#57534e" strokeWidth={5} />
                        <path d="M -120 180 L 120 180 L 90 230 L -90 230 Z" fill="#a8a29e" />
                        {beat >= 1 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: beat === 1 && playing ? 1.6 : 0 }}
                            >
                                <circle cx={0} cy={150} r={30} fill="#f59e0b" />
                                <path
                                    d="M -14 150 L 14 150 M 0 136 L 0 164"
                                    stroke="#fff"
                                    strokeWidth={6}
                                />
                            </motion.g>
                        )}
                        <text
                            x={0}
                            y={300}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            gi tilbake
                        </text>
                    </g>
                    {beat >= 2 && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: playing ? 0.6 : 0 }}
                        >
                            <circle
                                cx={800}
                                cy={380}
                                r={46}
                                fill="#10b981"
                                stroke="#fff"
                                strokeWidth={6}
                            />
                            <path
                                d="M 778 380 L 794 396 L 824 364"
                                fill="none"
                                stroke="#fff"
                                strokeWidth={9}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </motion.g>
                    )}
                    {beat >= 2 && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: playing ? 1.6 : 0 }}
                        >
                            {[0, 1, 2, 3, 4].map((i) => (
                                <ellipse
                                    key={i}
                                    cx={1470}
                                    cy={830 - i * 16}
                                    rx={56}
                                    ry={14}
                                    fill="#eab308"
                                    stroke="#a16207"
                                    strokeWidth={3}
                                />
                            ))}
                            <text
                                x={1470}
                                y={725}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={800}
                                fill="#64748b"
                            >
                                eie mest
                            </text>
                            <line
                                x1={1395}
                                y1={860}
                                x2={1545}
                                y2={760}
                                stroke="#dc2626"
                                strokeWidth={10}
                                strokeLinecap="round"
                            />
                        </motion.g>
                    )}
                </g>
            )}
        </svg>
    );
}

/** En lydbølge som følger en form: fjellet, dyret, personen. */
function bolge(y0: number, form: (x: number) => number, fra: number, til: number) {
    const pts: string[] = [];
    for (let x = fra; x <= til; x += 6) {
        const h = form(x);
        pts.push(`${x},${y0 - h + Math.sin(x * 0.18) * Math.min(14, h * 0.25 + 4)}`);
    }
    return `M ${pts.join(' L ')}`;
}
const fjellForm = (c: number, b: number, h: number) => (x: number) =>
    Math.max(0, h * (1 - Math.abs(x - c) / b));

function Joik({ beat }: { beat: number }) {
    return (
        <svg
            viewBox={`0 0 ${B} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            <rect width={B} height={H} fill="#1e293b" />
            {beat === 0 && (
                <g>
                    <text
                        x={800}
                        y={150}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={800}
                        fill="#94a3b8"
                    >
                        Du joiker ikke om fjellet.
                    </text>
                    <motion.text
                        x={800}
                        y={240}
                        textAnchor="middle"
                        fontSize={72}
                        fontWeight={900}
                        fill="#fde68a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                    >
                        Du joiker fjellet.
                    </motion.text>
                    <Fjell x={800} y={760} s={3.6} farge="#334155" />
                    <motion.path
                        d={bolge(760, fjellForm(800, 390, 390), 360, 1240)}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 3, delay: 0.6 }}
                    />
                </g>
            )}
            {beat === 1 && (
                <g>
                    <text
                        x={800}
                        y={130}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        Joiken er det den joiker
                    </text>
                    {[
                        {
                            x: 330,
                            navn: 'en person',
                            el: <Menneske x={0} y={0} s={3.6} farge="#334155" />,
                        },
                        {
                            x: 800,
                            navn: 'et dyr',
                            el: <Rein x={-20} y={0} s={3.4} farge="#334155" />,
                        },
                        {
                            x: 1270,
                            navn: 'et sted',
                            el: <Fjell x={0} y={0} s={1.9} farge="#334155" />,
                        },
                    ].map((t, i) => (
                        <motion.g
                            key={t.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 + i * 1 }}
                        >
                            <g transform={`translate(${t.x} 680)`}>{t.el}</g>
                            <motion.path
                                d={bolge(
                                    680,
                                    fjellForm(t.x, 170, 230 + (i === 1 ? -50 : 0)),
                                    t.x - 190,
                                    t.x + 190
                                )}
                                fill="none"
                                stroke="#fbbf24"
                                strokeWidth={7}
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.4, delay: 0.6 + i * 1 }}
                            />
                            <text
                                x={t.x}
                                y={790}
                                textAnchor="middle"
                                fontSize={44}
                                fontWeight={800}
                                fill="#e2e8f0"
                            >
                                {t.navn}
                            </text>
                        </motion.g>
                    ))}
                </g>
            )}
            {beat >= 2 && (
                <g>
                    <text
                        x={800}
                        y={140}
                        textAnchor="middle"
                        fontSize={60}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        Et tonenavn
                    </text>
                    <text
                        x={800}
                        y={210}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#cbd5e1"
                    >
                        en lyd som var bare din
                    </text>
                    <Menneske x={420} y={720} s={3.4} farge="#2563eb" />
                    <motion.path
                        d={(() => {
                            const pts: string[] = [];
                            for (let x = 560; x <= 1360; x += 6) {
                                const k = (x - 560) / 800;
                                pts.push(
                                    `${x},${520 + Math.sin(x * 0.045) * 90 * Math.sin(k * Math.PI) + Math.sin(x * 0.19) * 18}`
                                );
                            }
                            return `M ${pts.join(' L ')}`;
                        })()}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={9}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.6, delay: 0.5 }}
                    />
                </g>
            )}
        </svg>
    );
}

export function SamiskVerdener({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'verdener';
    return (
        <div className="absolute inset-0 bg-[#f8fafc] overflow-hidden">
            {(modus === 'verdener' || modus === 'reise') && (
                <Verdener beat={beat} modus={modus} playing={playing} />
            )}
            {modus === 'balanse' && <Balanse beat={beat} playing={playing} />}
            {modus === 'joik' && <Joik beat={beat} />}
            {modus === 'reise' && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={beat}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-[2%] top-[66%] -translate-y-1/2 w-[18%] px-4 py-3 rounded-2xl bg-white/95 text-slate-900 font-black text-2xl shadow-xl"
                    >
                        {REISE_LAPPER[Math.min(beat, REISE_LAPPER.length - 1)]}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
