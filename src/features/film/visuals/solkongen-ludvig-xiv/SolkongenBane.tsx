import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { Etikett, Krone, Sol } from './felles';
import { ADEL, B, GULL, H, KIRKE, frø, inn } from './felles2d';

/**
 * Solkongens makt som bilder i SVG. Tre moduser:
 * - sol: solen som merke, Apollon og Frankrike i bane rundt kongen
 * - gullbur: hoffet flytter til Versailles, adelen i bane rundt kongen, buret
 * - arv: solen går ned i 1715, den lille arvingen, 1789 og 1919
 */

type Modus = 'sol' | 'gullbur' | 'arv';

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
                        fontSize={36}
                        fontWeight={800}
                        fill="#e7e5e4"
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
                        ikke tid til hær
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
                            { y: 310, tekst: 'Sønnen: død før ham', farge: '#475569' },
                            { y: 380, tekst: 'Sønnesønnen: død før ham', farge: '#475569' },
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
