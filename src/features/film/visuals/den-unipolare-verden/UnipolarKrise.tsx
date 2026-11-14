import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { TelleTall } from '../shared';

/**
 * Finanskrisen i 2008, tegnet som en enkel mekanisme.
 * Beat 0: investeringsbanken Lehman Brothers sprekker, og stempelet «Konkurs» kommer.
 * Beat 1: banken har lånt ut penger til boligkjøpere, og husene kan ikke betale tilbake.
 * Beat 2: krisa sprer seg som en rekke dominobrikker som faller over hele bildet.
 * Beat 3: Lehman blir liggende. Krisepakkene støtter opp de andre bankene og forsikringsselskapene.
 * Beat 4: USA hadde fortalt alle andre hvordan økonomi skulle styres, med et rødt kryss ved siden av.
 */

const B = 1600;
const H = 900;
const BAKKE = 720;

const HUS = [740, 890, 1040, 1190, 1340];
const BRIKKER = Array.from({ length: 8 }, (_, i) => 640 + i * 85);

export function UnipolarKrise({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Bakken */}
                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#cbd5e1" />
                <line x1={0} y1={BAKKE} x2={B} y2={BAKKE} stroke="#0f172a" strokeWidth={4} />

                <Lehman beat={beat} />

                {beat === 1 && <Huslan />}
                {beat === 2 && <Domino />}
                {beat >= 3 && <Reddet beat={beat} />}
                {beat === 3 && <Krisepakke />}
                {beat === 4 && <Rad />}

                <Overskrift beat={beat} />
            </svg>
        </div>
    );
}

const OVERSKRIFT = [
    { tekst: 'September 2008: Lehman Brothers går konkurs', rod: true },
    { tekst: 'Huslån som ikke kunne betales tilbake', rod: false },
    { tekst: 'Millioner mistet jobb og bolig', rod: true },
    { tekst: 'Myndighetene redder banker og forsikringsselskaper', rod: false },
    { tekst: 'USA mistet kontrollen over egen økonomi', rod: false },
];

/** Overskriften øverst, på et kort som er målt etter teksten. */
function Overskrift({ beat }: { beat: number }) {
    const o = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    const fs = Math.min(50, 1300 / (o.tekst.length * 0.56));
    const bredde = o.tekst.length * fs * 0.56 + 80;
    return (
        <motion.g
            key={beat}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
        >
            <rect
                x={B / 2 - bredde / 2}
                y={40}
                width={bredde}
                height={88}
                rx={24}
                fill={o.rod ? '#b91c1c' : '#ffffff'}
                stroke="#0f172a"
                strokeWidth={3}
            />
            <text
                x={B / 2}
                y={86}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fs}
                fontWeight={800}
                fill={o.rod ? '#ffffff' : '#0f172a'}
            >
                {o.tekst}
            </text>
        </motion.g>
    );
}

/** Lehman Brothers med søyler, sprekk og stempel. Blir liggende knust, også når de andre reddes. */
function Lehman({ beat }: { beat: number }) {
    return (
        <g opacity={beat >= 3 ? 0.5 : 1}>
            <Bygning x={150} b={400} topp={330} />
            <text
                x={350}
                y={BAKKE + 70}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#0f172a"
            >
                Lehman Brothers
            </text>
            {/* Sprekken */}
            <motion.path
                d={`M 360 230 L 325 350 L 380 470 L 335 590 L 370 ${BAKKE - 40}`}
                fill="none"
                stroke="#b91c1c"
                strokeWidth={9}
                strokeLinejoin="round"
                initial={{ pathLength: beat === 0 ? 0 : 1 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 0.6 }}
            />
            {/* Stempelet */}
            <motion.g
                initial={{ opacity: beat === 0 ? 0 : 1 }}
                animate={{ opacity: 1 }}
                transition={{ delay: beat === 0 ? 2.1 : 0, duration: 0.3 }}
            >
                <g transform="translate(350 530) rotate(-12)">
                    <rect
                        x={-190}
                        y={-52}
                        width={380}
                        height={104}
                        rx={10}
                        fill="#ffffff"
                        stroke="#b91c1c"
                        strokeWidth={9}
                    />
                    <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={68}
                        fontWeight={900}
                        fill="#b91c1c"
                        y={4}
                    >
                        KONKURS
                    </text>
                </g>
            </motion.g>
        </g>
    );
}

/** De andre bankene og forsikringsselskapene, støttet opp av krisepakkene. */
function Reddet({ beat }: { beat: number }) {
    const x = 640;
    const b = 300;
    const topp = 430;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            {[
                [x - 60, BAKKE, x + 30, topp + 90],
                [x + b + 60, BAKKE, x + b - 30, topp + 90],
            ].map(([x1, y1, x2, y2], i) => (
                <motion.line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#1d4ed8"
                    strokeWidth={24}
                    strokeLinecap="round"
                    initial={{ pathLength: beat === 3 ? 0 : 1 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 0.5 + i * 0.3 }}
                />
            ))}
            <Bygning x={x} b={b} topp={topp} />
            <text
                x={x + b / 2}
                y={BAKKE + 55}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
            >
                Andre banker og
            </text>
            <text
                x={x + b / 2}
                y={BAKKE + 100}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
            >
                forsikringsselskaper
            </text>
        </motion.g>
    );
}

/** En bank med tak og søyler. */
function Bygning({ x, b, topp }: { x: number; b: number; topp: number }) {
    const soyler = 5;
    const steg = (b - 40) / (soyler - 1);
    return (
        <g>
            <path
                d={`M ${x - 30} ${topp} L ${x + b / 2} ${topp - 110} L ${x + b + 30} ${topp} Z`}
                fill="#e2e8f0"
                stroke="#0f172a"
                strokeWidth={5}
                strokeLinejoin="round"
            />
            <rect
                x={x - 30}
                y={topp}
                width={b + 60}
                height={34}
                fill="#e2e8f0"
                stroke="#0f172a"
                strokeWidth={5}
            />
            {Array.from({ length: soyler }, (_, i) => (
                <rect
                    key={i}
                    x={x + i * steg}
                    y={topp + 34}
                    width={40}
                    height={BAKKE - topp - 74}
                    fill="#f8fafc"
                    stroke="#0f172a"
                    strokeWidth={4}
                />
            ))}
            <rect
                x={x - 30}
                y={BAKKE - 40}
                width={b + 60}
                height={40}
                fill="#e2e8f0"
                stroke="#0f172a"
                strokeWidth={5}
            />
            <text
                x={x + b / 2}
                y={topp - 30}
                textAnchor="middle"
                fontSize={30}
                fontWeight={900}
                fill="#0f172a"
            >
                BANK
            </text>
        </g>
    );
}

/** Lån fra banken til boligkjøpere, og husene som ikke kan betale tilbake. */
function Huslan() {
    return (
        <g>
            {HUS.map((hx, i) => (
                <g key={i}>
                    <motion.path
                        d={`M 580 450 Q ${(580 + hx) / 2} ${300 - i * 10} ${hx} ${BAKKE - 170}`}
                        fill="none"
                        stroke="#15803d"
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.25 }}
                    />
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.25 }}
                    >
                        <path
                            d={`M ${hx - 60} ${BAKKE - 110} L ${hx} ${BAKKE - 175} L ${hx + 60} ${BAKKE - 110} Z`}
                            fill="#b45309"
                            stroke="#0f172a"
                            strokeWidth={4}
                            strokeLinejoin="round"
                        />
                        <rect
                            x={hx - 48}
                            y={BAKKE - 110}
                            width={96}
                            height={110}
                            fill="#fde68a"
                            stroke="#0f172a"
                            strokeWidth={4}
                        />
                        <rect x={hx - 14} y={BAKKE - 60} width={28} height={60} fill="#0f172a" />
                    </motion.g>
                    {/* Kan ikke betale */}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.4 + i * 0.15 }}
                    >
                        <circle
                            cx={hx + 46}
                            cy={BAKKE - 150}
                            r={26}
                            fill="#b91c1c"
                            stroke="#ffffff"
                            strokeWidth={4}
                        />
                        <text
                            x={hx + 46}
                            y={BAKKE - 148}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={36}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            !
                        </text>
                    </motion.g>
                </g>
            ))}
            <motion.text
                x={1040}
                y={BAKKE + 80}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                Boligkjøpere som ikke kunne betale
            </motion.text>
        </g>
    );
}

/** Dominobrikker som faller etter hverandre, bort fra banken. */
function Domino() {
    const hoyde = 200;
    const bredde = 46;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {BRIKKER.map((bx, i) => {
                // Brikken står på bakken og faller mot høyre rundt sitt nedre høyre hjørne.
                const oppreist = `M ${bx} ${BAKKE} L ${bx} ${BAKKE - hoyde} L ${bx + bredde} ${BAKKE - hoyde} L ${bx + bredde} ${BAKKE} Z`;
                const v = (68 * Math.PI) / 180;
                const px = bx + bredde;
                const py = BAKKE;
                const rot = (dx: number, dy: number) => {
                    const rx = dx * Math.cos(v) - dy * Math.sin(v);
                    const ry = dx * Math.sin(v) + dy * Math.cos(v);
                    return `${px + rx} ${py + ry}`;
                };
                const liggende = `M ${rot(-bredde, 0)} L ${rot(-bredde, -hoyde)} L ${rot(0, -hoyde)} L ${rot(0, 0)} Z`;
                return (
                    <motion.path
                        key={i}
                        initial={{ d: oppreist }}
                        animate={{ d: liggende }}
                        transition={{
                            duration: 0.45,
                            delay: 0.8 + i * 0.28,
                            ease: 'easeIn',
                        }}
                        fill={i % 2 ? '#334155' : '#0f172a'}
                        stroke="#ffffff"
                        strokeWidth={3}
                    />
                );
            })}
        </motion.g>
    );
}

/** Tallet på krisepakkene, til høyre for bankene. */
function Krisepakke() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <rect
                x={1060}
                y={330}
                width={420}
                height={260}
                rx={28}
                fill="#ffffff"
                stroke="#1d4ed8"
                strokeWidth={5}
            />
            <text
                x={1270}
                y={440}
                textAnchor="middle"
                fontSize={96}
                fontWeight={900}
                fill="#1d4ed8"
            >
                ca. <TelleTall verdi={700} forsinkelse={0.8} />
            </text>
            <text
                x={1270}
                y={505}
                textAnchor="middle"
                fontSize={34}
                fontWeight={700}
                fill="#334155"
            >
                milliarder dollar
            </text>
            <text
                x={1270}
                y={550}
                textAnchor="middle"
                fontSize={34}
                fontWeight={700}
                fill="#334155"
            >
                i krisepakker
            </text>
        </motion.g>
    );
}

/** Det USA hadde fortalt alle andre, med et rødt kryss ved siden av. */
function Rad() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <path
                d="M 590 150 L 1230 150 Q 1260 150 1260 180 L 1260 270 Q 1260 300 1230 300 L 1060 300 L 1000 350 L 1010 300 L 590 300 Q 560 300 560 270 L 560 180 Q 560 150 590 150 Z"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth={4}
            />
            <text x={910} y={208} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                USA hadde fortalt alle andre
            </text>
            <text x={910} y={268} textAnchor="middle" fontSize={38} fontWeight={900} fill="#0f172a">
                hvordan økonomi skulle styres
            </text>
            <motion.g
                stroke="#b91c1c"
                strokeWidth={18}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
            >
                <line x1={1290} y1={180} x2={1350} y2={270} />
                <line x1={1350} y1={180} x2={1290} y2={270} />
            </motion.g>
        </motion.g>
    );
}
