import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Solkongens makt som bilder i SVG. Fem moduser:
 * - barn: familien, Anna og Mazarin som styrer, embetsmennene og den sure adelen
 * - enevelde: Ludvig tar makten i 1661, pyramiden med Gud øverst, «Staten, det er jeg»
 * - sol: solen som merke, Apollon og Frankrike i bane rundt kongen
 * - gullbur: hoffet flytter til Versailles, adelen i bane rundt kongen, buret
 * - arv: solen går ned i 1715, den lille arvingen, 1789 og 1919
 */

type Modus = 'barn' | 'enevelde' | 'sol' | 'gullbur' | 'arv';

const B = 1600;
const H = 900;
const GULL = '#f5b301';
const ADEL = '#7c3aed';
const KIRKE = '#b91c1c';
const EMBETE = '#0284c7';
const BLEK = '#94a3b8';

const inn = {
    initial: { opacity: 0, scale: 0.6 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
    transition: { type: 'spring' as const, stiffness: 160, damping: 18 },
};

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** Et enkelt menneske: hode og kropp. */
function Person({
    x,
    y,
    farge,
    s = 1,
    krone = false,
    opacity = 1,
}: {
    x: number;
    y: number;
    farge: string;
    s?: number;
    krone?: boolean;
    opacity?: number;
}) {
    return (
        <motion.g animate={{ opacity }} transition={{ duration: 0.8 }}>
            <g transform={`translate(${x} ${y}) scale(${s})`}>
                <circle cx={0} cy={-62} r={26} fill="#f1d3b3" stroke="#1e293b" strokeWidth={4} />
                <path
                    d="M -42 40 Q -42 -26 0 -28 Q 42 -26 42 40 Z"
                    fill={farge}
                    stroke="#1e293b"
                    strokeWidth={4}
                />
                {krone && <Krone x={0} y={-96} s={0.7} />}
            </g>
        </motion.g>
    );
}

function Krone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M -40 18 L -46 -22 L -22 0 L 0 -32 L 22 0 L 46 -22 L 40 18 Z"
                fill={GULL}
                stroke="#78350f"
                strokeWidth={5}
                strokeLinejoin="round"
            />
            <circle cx={0} cy={-32} r={6} fill="#dc2626" />
        </g>
    );
}

function Etikett({
    x,
    y,
    tekst,
    farge = '#0f172a',
    str = 40,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    str?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={str / 4}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

function Sol({ x, y, r, stråler = true }: { x: number; y: number; r: number; stråler?: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {stråler && (
                <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                    {Array.from({ length: 16 }, (_, i) => (
                        <path
                            key={i}
                            d={`M ${-r * 0.16} ${-r * 1.05} L 0 ${-r * 1.6} L ${r * 0.16} ${-r * 1.05} Z`}
                            fill={GULL}
                            transform={`rotate(${i * 22.5})`}
                        />
                    ))}
                </motion.g>
            )}
            <circle r={r} fill="#fcd34d" stroke={GULL} strokeWidth={r * 0.08} />
        </g>
    );
}

/* ---------------------------------------------------------------- barn */

function Barn({ beat }: { beat: number }) {
    const embetsmenn = useMemo(
        () => Array.from({ length: 22 }, (_, i) => ({ x: 170 + i * 58, y: 760 + (i % 2) * 18 })),
        []
    );
    const dimmet = beat >= 3 ? 0.35 : 1;
    return (
        <>
            <rect width={B} height={H} fill="#f8f1e3" />
            <motion.g animate={{ opacity: dimmet }}>
                {/* Faren */}
                <Person x={300} y={280} farge="#334155" krone opacity={beat === 0 ? 1 : 0.3} />
                <Etikett x={300} y={380} tekst="Faren: Ludvig 13." str={36} />
                {beat >= 1 && (
                    <motion.g {...inn}>
                        <Etikett x={300} y={130} tekst="død" farge={BLEK} str={34} />
                    </motion.g>
                )}
                {/* Gutten */}
                <Person x={640} y={560} farge="#1d4ed8" s={0.7} krone={beat >= 1} />
                <Etikett x={640} y={650} tekst="Ludvig, født 1638" str={36} />
                <line
                    x1={300}
                    y1={410}
                    x2={600}
                    y2={480}
                    stroke={BLEK}
                    strokeWidth={5}
                    strokeDasharray="10 10"
                />
                {beat >= 1 && (
                    <motion.g {...inn}>
                        <Etikett x={640} y={705} tekst="1643: konge" farge="#b45309" str={44} />
                    </motion.g>
                )}
                {/* Anna og Mazarin, som styrer */}
                {beat >= 2 && (
                    <motion.g {...inn} animate={{ opacity: beat >= 4 ? 0 : 1, scale: 1 }}>
                        <Person x={1010} y={420} farge="#be185d" />
                        <Etikett x={1010} y={520} tekst="Anna, moren" str={36} />
                        <Person x={1330} y={420} farge={KIRKE} />
                        <path
                            d="M 1300 352 L 1330 322 L 1360 352 Z"
                            fill={KIRKE}
                            stroke="#1e293b"
                            strokeWidth={4}
                        />
                        <Etikett x={1330} y={520} tekst="Kardinal Mazarin" str={36} />
                        <Etikett x={1170} y={250} tekst="De styrer" farge={KIRKE} str={50} />
                        <path
                            d="M 900 470 Q 800 470 740 530"
                            stroke={KIRKE}
                            strokeWidth={7}
                            fill="none"
                            strokeDasharray="14 10"
                        />
                    </motion.g>
                )}
            </motion.g>
            {beat >= 3 && (
                <motion.g {...inn}>
                    {embetsmenn.map((e, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Person x={e.x} y={e.y} farge={EMBETE} s={0.42} />
                        </motion.g>
                    ))}
                    <Etikett
                        x={800}
                        y={860}
                        tekst="Embetsmenn: styrer landet for kongen"
                        farge={EMBETE}
                        str={42}
                    />
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g {...inn}>
                    <rect
                        x={1060}
                        y={90}
                        width={500}
                        height={440}
                        rx={30}
                        fill="#ede9fe"
                        stroke={ADEL}
                        strokeWidth={6}
                    />
                    {[0, 1, 2].map((i) => (
                        <Person key={i} x={1180 + i * 130} y={300} farge={ADEL} s={0.85} />
                    ))}
                    <Etikett x={1310} y={170} tekst="Adelen" farge={ADEL} str={54} />
                    <Etikett x={1310} y={430} tekst="hertuger og grever" str={34} />
                    <Etikett x={1310} y={490} tekst="Vil bestemme selv!" farge={KIRKE} str={38} />
                </motion.g>
            )}
        </>
    );
}

/* ------------------------------------------------------------- enevelde */

function Enevelde({ beat }: { beat: number }) {
    const folk = useMemo(
        () =>
            Array.from({ length: 48 }, (_, i) => {
                const rad = Math.floor(i / 16);
                return { x: 520 + (i % 16) * 38 + (rad % 2) * 19, y: 720 + rad * 46 };
            }),
        []
    );
    if (beat <= 1)
        return (
            <>
                <rect width={B} height={H} fill="#f8f1e3" />
                <Etikett x={800} y={140} tekst="1661" farge="#b45309" str={110} />
                <Person x={470} y={560} farge="#1d4ed8" s={1.5} krone />
                <Etikett x={470} y={720} tekst="Ludvig, 22 år" str={44} />
                <Etikett x={470} y={780} tekst="vil styre selv" farge="#b45309" str={38} />
                <motion.g animate={{ opacity: beat === 0 ? 1 : 0 }}>
                    <Person x={1130} y={450} farge={KIRKE} opacity={0.4} />
                    <Etikett x={1130} y={560} tekst="Mazarin dør" farge={BLEK} str={38} />
                </motion.g>
                {beat >= 1 && (
                    <>
                        <motion.g {...inn}>
                            <Person x={1000} y={470} farge="#475569" s={0.9} />
                            {[-60, -30, 0, 30, 60].map((dx) => (
                                <rect
                                    key={dx}
                                    x={1000 + dx - 5}
                                    y={330}
                                    width={10}
                                    height={190}
                                    fill="#1e293b"
                                />
                            ))}
                            <rect x={925} y={320} width={150} height={14} fill="#1e293b" />
                            <Etikett
                                x={1000}
                                y={590}
                                tekst="Fouquet: fengsel på livstid"
                                str={34}
                            />
                        </motion.g>
                        <motion.g
                            initial={{ scale: 1, opacity: 0 }}
                            animate={{ scale: 0.6, opacity: 1 }}
                            transition={{ delay: 1.2, duration: 1.4 }}
                            style={{ transformOrigin: '1380px 470px' }}
                        >
                            <rect
                                x={1270}
                                y={380}
                                width={220}
                                height={170}
                                rx={16}
                                fill="#e2e8f0"
                                stroke="#475569"
                                strokeWidth={6}
                            />
                            <path
                                d="M 1260 380 L 1380 320 L 1500 380 Z"
                                fill="#cbd5e1"
                                stroke="#475569"
                                strokeWidth={6}
                            />
                        </motion.g>
                        <motion.g {...inn} transition={{ delay: 1.8 }}>
                            <Etikett x={1380} y={660} tekst="Parlamentet: svakere" str={34} />
                        </motion.g>
                    </>
                )}
            </>
        );
    return (
        <>
            <rect width={B} height={H} fill="#1e1b4b" />
            {/* Pyramiden: Gud, kongen, alle andre */}
            <motion.g animate={{ opacity: beat === 3 ? 0.35 : 1 }}>
                <g>
                    {Array.from({ length: 9 }, (_, i) => (
                        <line
                            key={i}
                            x1={800}
                            y1={110}
                            x2={800 + Math.cos((i / 8) * Math.PI) * 260}
                            y2={110 + Math.sin((i / 8) * Math.PI) * 120}
                            stroke="#fde68a"
                            strokeWidth={5}
                            opacity={0.6}
                        />
                    ))}
                    <Etikett x={800} y={125} tekst="GUD" farge="#78350f" str={60} />
                </g>
                <motion.path
                    d="M 800 250 L 800 380"
                    stroke="#fde68a"
                    strokeWidth={10}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />
                <Person x={800} y={520} farge="#1d4ed8" s={1.1} krone />
                <Etikett x={800} y={620} tekst="KONGEN: all makt" farge="#b45309" str={48} />
                {folk.map((f, i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.02 }}
                    >
                        <Person x={f.x} y={f.y + 40} farge="#64748b" s={0.3} />
                    </motion.g>
                ))}
                <Etikett
                    x={1310}
                    y={800}
                    tekst="alle andre"
                    farge="#334155"
                    str={36}
                    anker="start"
                />
            </motion.g>
            {beat === 2 && (
                <motion.g {...inn}>
                    <Etikett
                        x={60}
                        y={380}
                        tekst="Eneveldet:"
                        farge="#1e1b4b"
                        str={50}
                        anker="start"
                    />
                    <Etikett
                        x={60}
                        y={440}
                        tekst="én har all makt"
                        farge="#1e1b4b"
                        str={38}
                        anker="start"
                    />
                    <Etikett
                        x={60}
                        y={490}
                        tekst="og svarer bare til Gud"
                        farge="#1e1b4b"
                        str={38}
                        anker="start"
                    />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g {...inn}>
                    <rect
                        x={200}
                        y={300}
                        width={1200}
                        height={260}
                        rx={40}
                        fill="#0f172a"
                        stroke={GULL}
                        strokeWidth={6}
                    />
                    <text
                        x={800}
                        y={460}
                        textAnchor="middle"
                        fontSize={96}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        «Staten, det er jeg.»
                    </text>
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2 }}
                    >
                        <rect x={520} y={600} width={560} height={80} rx={20} fill="#ffffff" />
                        <text
                            x={800}
                            y={655}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill={KIRKE}
                        >
                            Sa han det? Ingen vet.
                        </text>
                    </motion.g>
                </motion.g>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ sol */

function Banen({ beat }: { beat: number }) {
    const ringer = [190, 280, 370];
    const prikker = useMemo(
        () =>
            Array.from({ length: 42 }, (_, i) => ({
                ring: i % 3,
                vinkel: frø(i) * 360,
                farge: ['#2563eb', '#16a34a', ADEL, '#ea580c', '#0891b2'][i % 5],
            })),
        []
    );
    return (
        <>
            <rect width={B} height={H} fill="#0b1026" />
            {Array.from({ length: 60 }, (_, i) => (
                <circle
                    key={i}
                    cx={frø(i + 70) * B}
                    cy={frø(i + 170) * H}
                    r={2 + frø(i) * 2}
                    fill="#e2e8f0"
                    opacity={0.5}
                />
            ))}
            <motion.g
                animate={{ x: beat === 1 ? -260 : 0 }}
                transition={{ type: 'spring', stiffness: 60, damping: 18 }}
            >
                {beat >= 2 &&
                    ringer.map((r, i) => (
                        <motion.circle
                            key={r}
                            cx={800}
                            cy={450}
                            r={r}
                            fill="none"
                            stroke="#475569"
                            strokeWidth={3}
                            strokeDasharray="8 10"
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.3, duration: 0.9 }}
                            style={{ transformOrigin: '800px 450px' }}
                        />
                    ))}
                {beat >= 2 &&
                    [0, 1, 2].map((ring) => (
                        <g key={ring}>
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0 800 450"
                                to={`${ring % 2 ? -360 : 360} 800 450`}
                                dur={`${26 + ring * 12}s`}
                                repeatCount="indefinite"
                            />
                            {prikker
                                .filter((p) => p.ring === ring)
                                .map((p, i) => {
                                    const a = (p.vinkel * Math.PI) / 180;
                                    return (
                                        <motion.circle
                                            key={i}
                                            cx={800 + Math.cos(a) * ringer[ring]}
                                            cy={450 + Math.sin(a) * ringer[ring]}
                                            r={15}
                                            fill={p.farge}
                                            stroke="#ffffff"
                                            strokeWidth={3}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 + i * 0.06 + ring * 0.3 }}
                                        />
                                    );
                                })}
                        </g>
                    ))}
                <Sol x={800} y={450} r={beat >= 2 ? 110 : 150} />
                {beat >= 2 && <Krone x={800} y={455} s={1.1} />}
            </motion.g>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g key="merke" {...inn}>
                        <Etikett
                            x={800}
                            y={800}
                            tekst="Ludvigs merke: solen"
                            farge="#78350f"
                            str={56}
                        />
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g key="apollon" {...inn}>
                        {/* Lyre, Apollons instrument */}
                        <g transform="translate(1180 360)">
                            <path
                                d="M -70 -110 Q -110 40 -40 90 L 40 90 Q 110 40 70 -110"
                                fill="none"
                                stroke={GULL}
                                strokeWidth={16}
                                strokeLinecap="round"
                            />
                            <line
                                x1={-60}
                                y1={-40}
                                x2={60}
                                y2={-40}
                                stroke={GULL}
                                strokeWidth={12}
                            />
                            {[-30, -10, 10, 30].map((x) => (
                                <line
                                    key={x}
                                    x1={x}
                                    y1={-40}
                                    x2={x}
                                    y2={88}
                                    stroke="#fde68a"
                                    strokeWidth={4}
                                />
                            ))}
                        </g>
                        <Etikett x={1180} y={560} tekst="Apollon" farge="#78350f" str={64} />
                        <Etikett x={1180} y={625} tekst="gresk gud for fred og kunst" str={38} />
                    </motion.g>
                )}
                {beat >= 2 && (
                    <motion.g key="frankrike" {...inn}>
                        <Etikett
                            x={800}
                            y={60 + 0}
                            tekst="Hele Frankrike i bane rundt kongen"
                            farge="#78350f"
                            str={52}
                        />
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

/* -------------------------------------------------------------- gullbur */

function Gullbur({ beat }: { beat: number }) {
    const adel = useMemo(
        () =>
            Array.from({ length: 30 }, (_, i) => ({
                vinkel: (i / 30) * Math.PI * 2 + frø(i) * 0.2,
                ute: 620 + frø(i + 9) * 200,
                bane: 250 + frø(i + 19) * 110,
                nær: 165 + frø(i + 29) * 50,
            })),
        []
    );
    if (beat <= 1)
        return (
            <>
                <rect width={B} height={H} fill="#f8f1e3" />
                <circle cx={360} cy={450} r={28} fill="#475569" />
                <Etikett x={360} y={390} tekst="Paris" str={52} />
                <circle cx={1240} cy={450} r={34} fill={GULL} stroke="#78350f" strokeWidth={5} />
                <Etikett x={1240} y={255} tekst="Versailles" farge="#78350f" str={52} />
                <motion.path
                    d="M 400 450 Q 800 300 1195 445"
                    fill="none"
                    stroke="#b45309"
                    strokeWidth={10}
                    strokeDasharray="18 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2 }}
                />
                <Etikett
                    x={700}
                    y={170}
                    tekst="1682: hoffet og regjeringen flytter"
                    farge="#b45309"
                    str={44}
                />
                {Array.from({ length: beat === 0 ? 30 : 90 }, (_, i) => (
                    <motion.circle
                        key={i}
                        cx={1240 + Math.cos(i * 2.4) * (60 + (i % 9) * 14)}
                        cy={450 + Math.sin(i * 2.4) * (60 + (i % 9) * 14)}
                        r={8}
                        fill={i < 30 ? '#1d4ed8' : '#60a5fa'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 + (i % 30) * 0.04 }}
                    />
                ))}
            </>
        );
    return (
        <>
            <rect width={B} height={H} fill="#1c1917" />
            {/* Rangstigen som ringer: kongefamilien innerst, adelen, tjenerne ytterst */}
            {[
                { r: 150, tekst: 'kongefamilien' },
                { r: 300, tekst: 'adelen' },
                { r: 420, tekst: 'vakter og tjenere' },
            ].map((ring) => (
                <g key={ring.r}>
                    <circle
                        cx={800}
                        cy={470}
                        r={ring.r}
                        fill="none"
                        stroke="#57534e"
                        strokeWidth={3}
                        strokeDasharray="8 10"
                    />
                    <text
                        x={800}
                        y={470 - ring.r - 10}
                        textAnchor="middle"
                        fontSize={26}
                        fontWeight={800}
                        fill="#a8a29e"
                        opacity={beat >= 3 ? 0 : 1}
                    >
                        {ring.tekst}
                    </text>
                </g>
            ))}
            {adel.map((a, i) => {
                const r = beat === 2 ? a.bane : a.nær;
                return (
                    <motion.circle
                        key={i}
                        initial={{
                            cx: 800 + Math.cos(a.vinkel) * a.ute,
                            cy: 470 + Math.sin(a.vinkel) * a.ute,
                        }}
                        animate={{
                            cx: 800 + Math.cos(a.vinkel) * r,
                            cy: 470 + Math.sin(a.vinkel) * r * 0.95,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 30,
                            damping: 9,
                            delay: (i % 10) * 0.08,
                        }}
                        r={16}
                        fill={ADEL}
                        stroke="#ede9fe"
                        strokeWidth={3}
                    />
                );
            })}
            <Sol x={800} y={470} r={78} />
            <Krone x={800} y={476} s={0.8} />
            {beat === 2 && (
                <motion.g {...inn}>
                    {[
                        { x: 260, y: 220, tekst: 'Konserter' },
                        { x: 1340, y: 220, tekst: 'Ball' },
                        { x: 260, y: 760, tekst: 'Teater' },
                        { x: 1340, y: 760, tekst: 'Kortspill' },
                    ].map((f) => (
                        <g key={f.tekst}>
                            <rect
                                x={f.x - 150}
                                y={f.y - 50}
                                width={300}
                                height={80}
                                rx={22}
                                fill="#fef3c7"
                            />
                            <text
                                x={f.x}
                                y={f.y + 6}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#78350f"
                            >
                                {f.tekst}
                            </text>
                        </g>
                    ))}
                </motion.g>
            )}
            {beat === 3 && (
                <motion.g {...inn}>
                    <rect x={1080} y={60} width={480} height={190} rx={24} fill="#fef3c7" />
                    <text
                        x={1320}
                        y={130}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#78350f"
                    >
                        Kongens gunst
                    </text>
                    <text
                        x={1320}
                        y={185}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#78350f"
                    >
                        Kongen liker deg
                    </text>
                    <text
                        x={1320}
                        y={225}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#78350f"
                    >
                        og gir deg fordeler
                    </text>
                </motion.g>
            )}
            {/* Buret */}
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0, y: -120 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                >
                    <path
                        d="M 340 860 L 340 330 Q 340 40 800 40 Q 1260 40 1260 330 L 1260 860"
                        fill="none"
                        stroke={GULL}
                        strokeWidth={14}
                    />
                    {Array.from({ length: 13 }, (_, i) => {
                        const x = 380 + i * 70;
                        const topp = 330 - Math.sqrt(Math.max(0, 1 - ((x - 800) / 460) ** 2)) * 290;
                        return (
                            <line
                                key={i}
                                x1={x}
                                y1={topp}
                                x2={x}
                                y2={860}
                                stroke={GULL}
                                strokeWidth={8}
                                opacity={0.85}
                            />
                        );
                    })}
                    <rect x={320} y={850} width={960} height={26} fill={GULL} />
                    <Etikett
                        x={24}
                        y={480}
                        tekst="Et gullbur"
                        farge="#b45309"
                        str={52}
                        anker="start"
                    />
                </motion.g>
            )}
            {beat >= 5 && (
                <motion.g {...inn}>
                    <rect x={1290} y={520} width={290} height={300} rx={24} fill="#f8f1e3" />
                    {/* Godset hjemme, tomt */}
                    <path
                        d="M 1350 700 L 1350 620 L 1435 570 L 1520 620 L 1520 700 Z"
                        fill="#d6d3d1"
                        stroke="#44403c"
                        strokeWidth={5}
                    />
                    <text
                        x={1435}
                        y={760}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={900}
                        fill="#44403c"
                    >
                        Godset hjemme
                    </text>
                    <text
                        x={1435}
                        y={800}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill={KIRKE}
                    >
                        ingen hær
                    </text>
                </motion.g>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ arv */

function Arv({ beat }: { beat: number }) {
    if (beat <= 1) {
        const solY = beat === 0 ? 640 : 760;
        return (
            <>
                <motion.rect
                    width={B}
                    height={H}
                    animate={{ fill: beat === 0 ? '#f59e0b' : '#1e1b4b' }}
                    transition={{ duration: 3 }}
                />
                <motion.g
                    initial={{ y: 380 }}
                    animate={{ y: solY }}
                    transition={{ duration: 4, ease: 'easeInOut' }}
                >
                    <Sol x={beat === 0 ? 800 : 520} y={0} r={140} stråler={false} />
                </motion.g>
                <rect x={0} y={680} width={B} height={220} fill="#292524" />
                <Etikett x={800} y={150} tekst="1715: Solkongen dør" farge="#0f172a" str={70} />
                {beat >= 1 && (
                    <motion.g {...inn}>
                        <rect x={760} y={240} width={780} height={360} rx={30} fill="#f8f1e3" />
                        {[
                            { y: 310, tekst: 'Sønnen: død før ham', farge: BLEK },
                            { y: 380, tekst: 'Sønnesønnen: død før ham', farge: BLEK },
                            { y: 470, tekst: 'Oldebarnet blir konge', farge: '#b45309' },
                        ].map((r, i) => (
                            <motion.text
                                key={r.y}
                                x={800}
                                y={r.y}
                                fontSize={42}
                                fontWeight={900}
                                fill={r.farge}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.7 }}
                            >
                                {r.tekst}
                            </motion.text>
                        ))}
                        <motion.g
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2.4 }}
                        >
                            <Sol x={1430} y={520} r={44} />
                            <text
                                x={1340}
                                y={560}
                                textAnchor="end"
                                fontSize={40}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                bare fem år
                            </text>
                        </motion.g>
                    </motion.g>
                )}
            </>
        );
    }
    const bilde =
        beat === 4
            ? '/images/den-franske-revolusjon/solkongen-ludvig-xiv-02.webp'
            : beat === 3
              ? '/images/den-franske-revolusjon/solkongen-ludvig-xiv-03.webp'
              : '/images/den-franske-revolusjon/solkongen-ludvig-xiv-hero.webp';
    return (
        <>
            <rect width={B} height={H} fill="#0f172a" />
            <AnimatePresence mode="wait">
                <motion.image
                    key={bilde}
                    href={bilde}
                    x={0}
                    y={0}
                    width={B}
                    height={H}
                    preserveAspectRatio="xMidYMid slice"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: beat === 2 ? 0.35 : 0.85, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                />
            </AnimatePresence>
            {/* Tidslinje nederst */}
            <rect x={120} y={780} width={1360} height={12} rx={6} fill="#e2e8f0" />
            {[
                { år: 1682, x: 220, tekst: '1682' },
                { år: 1715, x: 420, tekst: '1715' },
                { år: 1789, x: 860, tekst: '1789' },
                { år: 1919, x: 1380, tekst: '1919' },
            ].map((t) => {
                const aktiv =
                    (beat === 2 && t.år <= 1789) ||
                    (beat === 3 && t.år === 1789) ||
                    (beat === 4 && t.år === 1919);
                return (
                    <g key={t.år}>
                        <circle
                            cx={t.x}
                            cy={786}
                            r={aktiv ? 22 : 14}
                            fill={aktiv ? GULL : '#64748b'}
                            stroke="#ffffff"
                            strokeWidth={4}
                        />
                        <text
                            x={t.x}
                            y={850}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            {t.tekst}
                        </text>
                    </g>
                );
            })}
            {beat === 2 && (
                <motion.rect
                    x={220}
                    y={774}
                    height={24}
                    rx={12}
                    fill={GULL}
                    initial={{ width: 0 }}
                    animate={{ width: 640 }}
                    transition={{ duration: 2 }}
                />
            )}
            <AnimatePresence mode="wait">
                <motion.g key={beat} {...inn}>
                    <rect
                        x={200}
                        y={90}
                        width={1200}
                        height={beat === 4 ? 200 : 150}
                        rx={30}
                        fill="#ffffff"
                        opacity={0.94}
                    />
                    <text
                        x={800}
                        y={185}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        {beat === 2
                            ? 'Versailles: maktens sentrum'
                            : beat === 3
                              ? 'Oktober 1789: kvinnene marsjerer'
                              : '1919: fredsavtalen i Speilsalen'}
                    </text>
                    {beat === 4 && (
                        <text
                            x={800}
                            y={255}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#b45309"
                        >
                            I dag: et museum
                        </text>
                    )}
                </motion.g>
            </AnimatePresence>
        </>
    );
}

export function SolkongenBane({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'sol';
    const viserTall = modus === 'gullbur' && beat <= 1;
    return (
        <div className="absolute inset-0 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                {modus === 'barn' && <Barn beat={beat} />}
                {modus === 'enevelde' && <Enevelde beat={beat} />}
                {modus === 'sol' && <Banen beat={beat} />}
                {modus === 'gullbur' && <Gullbur beat={beat} />}
                {modus === 'arv' && <Arv beat={beat} />}
            </svg>
            {viserTall && (
                <div className="absolute left-0 right-0 bottom-[7%] flex justify-center gap-4">
                    <Teller verdi={3000} prefiks="minst " etikett="bodde fast i slottet" />
                    {beat >= 1 && (
                        <Teller
                            verdi={10000}
                            prefiks="opptil "
                            etikett="mennesker der hver dag"
                            tone="rod"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
