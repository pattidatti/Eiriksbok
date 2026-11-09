import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Boble, Figur, Flate, MiniStige, Tekst } from './felles';

/**
 * To svar side om side.
 * - `start`: presten med gaven som kommer ovenfra, og munken som jobber med seg selv.
 * - `problem`: hva mennesket skal bli fri fra: skyld (en tung bør) eller kretsløpet.
 * - `gave`: kristendommen øverst på stigen. Paulus, Luther og Calvin, og katolikkene.
 * - `pakt`: jødedommen. Ingen fødes med synd, avtalen og de 613 budene, Guds første steg.
 */

interface Props {
    modus?: 'start' | 'problem' | 'gave' | 'pakt';
}

/** En gave med sløyfe. */
function Gave({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-50} y={-40} width={100} height={80} rx={8} fill="#6366f1" />
            <rect x={-10} y={-40} width={20} height={80} fill="#fde68a" />
            <rect x={-50} y={-8} width={100} height={16} fill="#fde68a" />
            <path d="M 0 -40 C -30 -80 -50 -50 0 -40 C 50 -50 30 -80 0 -40" fill="#fbbf24" />
        </g>
    );
}

function Start({ beat }: { beat: number }) {
    const munk = beat >= 2;
    return (
        <>
            {/* Venstre: kirken */}
            <rect x={60} y={60} width={700} height={720} rx={28} fill="#e0e7ff" />
            <path d="M 260 640 L 260 400 L 410 290 L 560 400 L 560 640 Z" fill="#c7d2fe" />
            <rect x={400} y={210} width={20} height={90} fill="#a5b4fc" />
            <rect x={380} y={235} width={60} height={18} fill="#a5b4fc" />
            <Tekst x={410} y={130} str={40} farge="#3730a3">
                Presten
            </Tekst>
            <Figur x={410} y={720} farge="#1e1b4b" />
            {/* Strålen og gaven som kommer ovenfra */}
            <motion.path
                d="M 360 60 L 460 60 L 520 560 L 300 560 Z"
                fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 0.45 : 0 }}
                transition={{ duration: 0.8 }}
            />
            <motion.g
                initial={{ y: -260, opacity: 0 }}
                animate={{ y: beat >= 1 ? 0 : -260, opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
            >
                <Gave x={410} y={520} />
            </motion.g>
            <Boble x={410} y={330} b={560} tekst="Ingenting du kan gjøre" vis={beat === 0} />
            {/* Betaling krysses ut */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 1 ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
            >
                <rect
                    x={560}
                    y={440}
                    width={150}
                    height={70}
                    rx={12}
                    fill="#fff"
                    stroke="#94a3b8"
                    strokeWidth={3}
                />
                <text
                    x={635}
                    y={488}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#475569"
                >
                    betale?
                </text>
                <path
                    d="M 725 455 L 765 495 M 765 455 L 725 495"
                    stroke="#dc2626"
                    strokeWidth={9}
                    strokeLinecap="round"
                />
            </motion.g>

            {/* Høyre: munken */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: munk ? 1 : 0.15 }}
                transition={{ duration: 0.8 }}
            >
                <rect x={840} y={60} width={700} height={720} rx={28} fill="#fef3c7" />
                <Tekst x={1190} y={130} str={40} farge="#92400e">
                    Munken
                </Tekst>
                <Figur x={1190} y={700} farge="#c2410c" sitter />
                {/* Dagene som går: én sol per dag */}
                {Array.from({ length: 7 }, (_, i) => (
                    <motion.circle
                        key={i}
                        cx={950 + i * 80}
                        cy={250}
                        r={22}
                        fill="#f59e0b"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 0 }}
                        transition={{ delay: beat >= 3 ? i * 0.45 : 0, duration: 0.3 }}
                    />
                ))}
                <Tekst x={1190} y={330} str={34} farge="#92400e" vis={beat >= 3}>
                    dag etter dag
                </Tekst>
                {/* Arbeidet inne i ham: en ring som fylles */}
                <motion.circle
                    cx={1190}
                    cy={560}
                    r={150}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={12}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 3 ? 1 : beat >= 2 ? 0.2 : 0 }}
                    transition={{ duration: beat >= 3 ? 3 : 1 }}
                    style={{ rotate: -90, transformOrigin: '1190px 560px' }}
                />
            </motion.g>

            {/* Spørsmålet i midten */}
            <motion.g
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: beat >= 4 ? 1 : 0, y: beat >= 4 ? 0 : 20 }}
                transition={{ duration: 0.6 }}
            >
                <rect x={450} y={790} width={700} height={90} rx={24} fill="#0f172a" />
                <text
                    x={800}
                    y={850}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#fff"
                >
                    Hvem gjør jobben?
                </text>
            </motion.g>
        </>
    );
}

function Problem({ beat }: { beat: number }) {
    return (
        <>
            <Tekst x={800} y={110} str={56}>
                Fri fra hva?
            </Tekst>
            {/* Venstre: skyld som en tung bør */}
            <rect x={80} y={170} width={680} height={560} rx={28} fill="#e0e7ff" />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0.15 }}
                transition={{ duration: 0.6 }}
            >
                <Figur x={420} y={660} farge="#1e1b4b" />
                <motion.g
                    initial={{ y: -200 }}
                    animate={{ y: beat >= 1 ? 0 : -200 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 12, delay: 0.3 }}
                >
                    <path
                        d="M 330 520 Q 420 380 510 520 Q 520 560 420 565 Q 320 560 330 520 Z"
                        fill="#475569"
                    />
                    <text
                        x={420}
                        y={530}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fff"
                    >
                        skyld
                    </text>
                </motion.g>
                <Tekst x={420} y={250} str={42} farge="#3730a3" vis={beat >= 1}>
                    Kristne: synd og skyld
                </Tekst>
            </motion.g>

            {/* Høyre: kretsløpet */}
            <rect x={840} y={170} width={680} height={560} rx={28} fill="#fce7f3" />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 2 ? 1 : 0.15 }}
                transition={{ duration: 0.6 }}
            >
                <Tekst x={1180} y={250} str={42} farge="#9d174d" vis={beat >= 2}>
                    Født om og om igjen
                </Tekst>
                <circle cx={1180} cy={490} r={170} fill="none" stroke="#f9a8d4" strokeWidth={16} />
                <motion.g
                    animate={{ rotate: beat >= 2 ? 360 : 0 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '1180px 490px' }}
                >
                    <circle cx={1180} cy={320} r={22} fill="#be185d" />
                    <path d="M 1350 470 l 20 30 l 20 -30 Z" fill="#be185d" />
                    <path d="M 1010 510 l -20 -30 l -20 30 Z" fill="#be185d" />
                </motion.g>
                <text
                    x={1180}
                    y={500}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#9d174d"
                >
                    født · dør · født
                </text>
            </motion.g>

            {/* Ordet som ikke passer */}
            <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 0.8 }}
                transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                style={{ transformOrigin: '800px 810px' }}
            >
                <rect
                    x={380}
                    y={760}
                    width={840}
                    height={100}
                    rx={24}
                    fill="#fff"
                    stroke="#0f172a"
                    strokeWidth={4}
                />
                <text
                    x={800}
                    y={826}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    «Frelse»? Ordet passer dårlig for noen
                </text>
            </motion.g>
        </>
    );
}

/** Et rødt kryss ved siden av noe som ikke teller. */
function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 22} ${y - 22} L ${x + 22} ${y + 22} M ${x + 22} ${y - 22} L ${x - 22} ${y + 22}`}
            stroke="#dc2626"
            strokeWidth={10}
            strokeLinecap="round"
        />
    );
}

/** Et kort med tekst, bredde målt ut fra teksten. */
function Kort({
    x,
    y,
    tekst,
    str = 38,
    fyll = '#fff',
    farge = '#0f172a',
    kant = '#cbd5e1',
}: {
    x: number;
    y: number;
    tekst: string;
    str?: number;
    fyll?: string;
    farge?: string;
    kant?: string;
}) {
    const b = Math.round(tekst.length * str * 0.58 + 70);
    return (
        <g>
            <rect
                x={x - b / 2}
                y={y - str - 18}
                width={b}
                height={str + 50}
                rx={20}
                fill={fyll}
                stroke={kant}
                strokeWidth={4}
            />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={str} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </g>
    );
}

function Inn({ children, k }: { children: ReactNode; k: string }) {
    return (
        <motion.g
            key={k}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {children}
        </motion.g>
    );
}

function GaveModus({ beat }: { beat: number }) {
    return (
        <>
            {/* Venstre: stigen med kristendommen øverst */}
            <rect x={50} y={50} width={440} height={800} rx={28} fill="#e0e7ff" />
            <motion.path
                d="M 200 50 L 340 50 L 330 230 L 210 230 Z"
                fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 1 }}
            />
            <Tekst x={270} y={130} str={46} farge="#3730a3">
                Kristendom
            </Tekst>
            <MiniStige x={270} y={260} trinn={0} farge="#6366f1" steg={110} />

            {/* Høyre: én ting per beat */}
            {beat === 0 && (
                <Inn k="b0">
                    <Tekst x={1020} y={180} str={50}>
                        Så høyt mot gaven
                    </Tekst>
                    <Tekst x={1020} y={245} str={50}>
                        som det går an
                    </Tekst>
                    <motion.path
                        d="M 940 280 L 1100 280 L 1180 760 L 860 760 Z"
                        fill="#fde68a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.45 }}
                        transition={{ duration: 1 }}
                    />
                    <motion.g
                        initial={{ y: -200 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                    >
                        <Gave x={1020} y={560} />
                    </motion.g>
                    <Figur x={1020} y={800} farge="#1e1b4b" skala={0.8} />
                </Inn>
            )}
            {beat === 1 && (
                <Inn k="b1">
                    <Tekst x={1020} y={150} str={52} farge="#3730a3">
                        Paulus:
                    </Tekst>
                    <Tekst x={1020} y={220} str={44}>
                        frelse kan ikke fortjenes
                    </Tekst>
                    {/* Gode gjerninger som betaling: de teller ikke */}
                    <Kort x={760} y={420} tekst="gode gjerninger" str={36} />
                    <Kryss x={970} y={404} />
                    <Tekst x={760} y={520} str={32} farge="#334155">
                        som betaling
                    </Tekst>
                    <motion.g
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.8, type: 'spring' }}
                        style={{ transformOrigin: '1300px 460px' }}
                    >
                        <Gave x={1300} y={460} />
                    </motion.g>
                    <Tekst x={1300} y={580} str={40} farge="#4338ca" forsinkelse={1}>
                        gratis
                    </Tekst>
                    <Kort
                        x={1020}
                        y={760}
                        tekst="Du får den gratis"
                        str={44}
                        fyll="#312e81"
                        farge="#fff"
                        kant="#312e81"
                    />
                </Inn>
            )}
            {beat === 2 && (
                <Inn k="b2">
                    <Tekst x={1020} y={150} str={52} farge="#3730a3">
                        Luther og Calvin:
                    </Tekst>
                    <motion.g
                        initial={{ scale: 0.7 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
                        style={{ transformOrigin: '1020px 380px' }}
                    >
                        <rect x={700} y={290} width={640} height={170} rx={30} fill="#312e81" />
                        <text
                            x={1020}
                            y={405}
                            textAnchor="middle"
                            fontSize={84}
                            fontWeight={900}
                            fill="#fde68a"
                        >
                            TROEN ALENE
                        </text>
                    </motion.g>
                    <Kort
                        x={940}
                        y={640}
                        tekst="det du selv presterer"
                        str={34}
                        fyll="#f1f5f9"
                        farge="#64748b"
                    />
                    <Kryss x={1200} y={624} />
                </Inn>
            )}
            {beat >= 3 && (
                <Inn k="b3">
                    <Tekst x={1020} y={150} str={52} farge="#3730a3">
                        Den katolske kirken:
                    </Tekst>
                    <Gave x={760} y={420} />
                    <Tekst x={760} y={540} str={36} farge="#4338ca">
                        1. nåden først
                    </Tekst>
                    <path
                        d="M 870 420 L 1080 420"
                        stroke="#94a3b8"
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <path d="M 1080 396 L 1120 420 L 1080 444 Z" fill="#94a3b8" />
                    <Figur x={1290} y={500} farge="#1e1b4b" />
                    {/* Armer i arbeid */}
                    <motion.path
                        d="M 1250 420 L 1200 360 M 1330 420 L 1380 360"
                        stroke="#1e1b4b"
                        strokeWidth={14}
                        strokeLinecap="round"
                        animate={{ rotate: [0, 8, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{ transformOrigin: '1290px 420px' }}
                    />
                    <Tekst x={1290} y={590} str={36} farge="#4338ca">
                        2. mennesket sitter ikke stille
                    </Tekst>
                    <Kort x={1020} y={760} tekst="Kristne er ikke enige om alt" str={40} />
                </Inn>
            )}
        </>
    );
}

function PaktModus({ beat }: { beat: number }) {
    const prikker = Array.from({ length: 613 }, (_, i) => i);
    return (
        <>
            {beat === 0 && (
                <Inn k="p0">
                    <Tekst x={800} y={120} str={54} farge="#1d4ed8">
                        Jødiske lærde: ingen fødes med synd
                    </Tekst>
                    <rect x={200} y={180} width={560} height={620} rx={28} fill="#dbeafe" />
                    <Figur x={480} y={720} farge="#1e3a8a" skala={1.2} />
                    <Tekst x={480} y={290} str={40} farge="#1e3a8a">
                        Et nyfødt menneske
                    </Tekst>
                    {/* Børen fra «Fri fra hva?», som ikke hører til her */}
                    <path
                        d="M 950 520 Q 1040 380 1130 520 Q 1140 560 1040 565 Q 940 560 950 520 Z"
                        fill="#94a3b8"
                    />
                    <text
                        x={1040}
                        y={530}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fff"
                    >
                        skyld
                    </text>
                    <Kryss x={1210} y={470} />
                    <Tekst x={1060} y={680} str={36} farge="#475569">
                        ikke noe å bære fra fødselen
                    </Tekst>
                </Inn>
            )}
            {beat === 1 && (
                <Inn k="p1">
                    <Tekst x={800} y={110} str={54} farge="#1d4ed8">
                        Avtalen med Gud: 613 bud
                    </Tekst>
                    {prikker.map((i) => (
                        <motion.circle
                            key={i}
                            cx={460 + (i % 31) * 22.5}
                            cy={200 + Math.floor(i / 31) * 24}
                            r={8}
                            fill="#3b82f6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: (i / 613) * 2.5, duration: 0.2 }}
                        />
                    ))}
                    <Kort
                        x={800}
                        y={760}
                        tekst="Hvordan du lever akkurat nå"
                        str={42}
                        fyll="#1e3a8a"
                        farge="#fff"
                        kant="#1e3a8a"
                    />
                </Inn>
            )}
            {beat >= 2 && (
                <Inn k="p2">
                    <Tekst x={800} y={110} str={50} farge="#1d4ed8">
                        Ifølge tradisjonen:
                    </Tekst>
                    {/* En trapp: Gud tar det første steget, resten går du selv */}
                    {[0, 1, 2, 3, 4, 5].map((k) => (
                        <rect
                            key={k}
                            x={260 + k * 180}
                            y={720 - k * 80}
                            width={180}
                            height={80 + k * 80}
                            fill={k === 0 ? '#fcd34d' : '#93c5fd'}
                            stroke="#fff"
                            strokeWidth={4}
                        />
                    ))}
                    <motion.path
                        d="M 290 170 L 410 170 L 440 700 L 260 700 Z"
                        fill="#fde68a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.55 }}
                        transition={{ duration: 0.8 }}
                    />
                    <Kort
                        x={350}
                        y={250}
                        tekst="Gud: første steg"
                        str={34}
                        fyll="#fff7d6"
                        kant="#f59e0b"
                    />
                    <motion.g
                        initial={{ x: 0, y: 0 }}
                        animate={{ x: 360, y: -160 }}
                        transition={{ duration: 3, delay: 0.8, ease: 'easeInOut' }}
                    >
                        <Figur x={530} y={640} farge="#1e3a8a" skala={0.7} />
                    </motion.g>
                    <Kort
                        x={1100}
                        y={300}
                        tekst="Resten av jobben er din"
                        str={40}
                        fyll="#1e3a8a"
                        farge="#fff"
                        kant="#1e3a8a"
                    />
                </Inn>
            )}
        </>
    );
}

export function FrelseToVeier({ beat, props }: VisualProps<Props>) {
    return (
        <Flate>
            {props.modus === 'problem' ? (
                <Problem beat={beat} />
            ) : props.modus === 'gave' ? (
                <GaveModus beat={beat} />
            ) : props.modus === 'pakt' ? (
                <PaktModus beat={beat} />
            ) : (
                <Start beat={beat} />
            )}
        </Flate>
    );
}
