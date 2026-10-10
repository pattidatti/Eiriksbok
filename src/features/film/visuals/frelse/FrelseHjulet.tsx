import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate, Tekst } from './felles';

/**
 * De indiske tradisjonene.
 * - `samsara`: hjulet av fødsel, død og ny fødsel, drevet av dine egne handlinger. Til slutt en
 *   vei ut: moksha.
 * - `veier`: hinduismens tre veier ut av hjulet.
 * - `flamme`: nirvana, flammen som slukner, og veien dit.
 */

interface Props {
    modus?: 'samsara' | 'veier' | 'flamme';
}

const ROSA = '#be185d';

function Hjul({
    cx,
    cy,
    r,
    fart,
    ut,
}: {
    cx: number;
    cy: number;
    r: number;
    fart: number;
    ut?: boolean;
}) {
    return (
        <g>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f9a8d4" strokeWidth={r * 0.1} />
            {[0, 60, 120, 180, 240, 300].map((a) => (
                <line
                    key={a}
                    x1={cx}
                    y1={cy}
                    x2={cx + Math.cos((a * Math.PI) / 180) * r}
                    y2={cy + Math.sin((a * Math.PI) / 180) * r}
                    stroke="#fbcfe8"
                    strokeWidth={6}
                />
            ))}
            <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: fart, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
                {!ut && <circle cx={cx} cy={cy - r} r={r * 0.12} fill={ROSA} />}
                <path d={`M ${cx + r} ${cy - 20} l -22 34 l 44 0 Z`} fill={ROSA} />
                <path d={`M ${cx - r} ${cy + 20} l -22 -34 l 44 0 Z`} fill={ROSA} />
            </motion.g>
        </g>
    );
}

function Samsara({ beat }: { beat: number }) {
    const cx = 800;
    const cy = 480;
    const r = 260;
    return (
        <>
            <Tekst x={cx} y={100} str={54} farge="#831843">
                {beat >= 1 ? 'Samsara: kretsløpet' : 'Verden går i ring'}
            </Tekst>
            <Hjul cx={cx} cy={cy} r={r} fart={beat >= 2 ? 3 : 8} ut={beat >= 3} />
            {/* Etikettene rundt hjulet */}
            {[
                { t: 'født', x: cx, y: cy - r - 50 },
                { t: 'dør', x: cx + r + 90, y: cy + 10 },
                { t: 'født på nytt', x: cx, y: cy + r + 70 },
            ].map((e, i) => (
                <Tekst
                    key={e.t}
                    x={e.x}
                    y={e.y}
                    str={40}
                    farge={ROSA}
                    vis={beat >= 1}
                    forsinkelse={i * 0.5}
                >
                    {e.t}
                </Tekst>
            ))}
            {/* Handlingene som skyver hjulet rundt */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                {[
                    { x: 300, y: 330 },
                    { x: 300, y: 630 },
                ].map((p, i) => (
                    <g key={i}>
                        <rect
                            x={p.x - 170}
                            y={p.y - 40}
                            width={340}
                            height={80}
                            rx={18}
                            fill="#fff"
                            stroke={ROSA}
                            strokeWidth={4}
                        />
                        <text
                            x={p.x}
                            y={p.y + 12}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill={ROSA}
                        >
                            dine handlinger
                        </text>
                        <motion.path
                            d={`M ${p.x + 180} ${p.y} L ${p.x + 240} ${p.y}`}
                            stroke={ROSA}
                            strokeWidth={10}
                            strokeLinecap="round"
                            animate={{ x: [0, 18, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    </g>
                ))}
            </motion.g>
            <Tekst x={1250} y={820} str={36} farge="#475569" vis={beat === 2}>
                tilgivelse stopper ikke hjulet
            </Tekst>
            {/* Veien ut: moksha */}
            <motion.path
                d={`M ${cx} ${cy - r} C ${cx + 120} ${cy - r - 140} ${cx + 360} ${cy - r - 100} 1360 200`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray="1 0"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 1.5 }}
            />
            <motion.circle
                r={30}
                fill="#f59e0b"
                initial={{ cx, cy: cy - r, opacity: 0 }}
                animate={
                    beat >= 3 ? { cx: 1360, cy: 200, opacity: 1 } : { cx, cy: cy - r, opacity: 0 }
                }
                transition={{ duration: 1.5 }}
            />
            <Tekst x={1360} y={280} str={50} farge="#b45309" vis={beat >= 3} forsinkelse={1.2}>
                moksha
            </Tekst>
            <Tekst x={1360} y={330} str={30} farge="#b45309" vis={beat >= 3} forsinkelse={1.4}>
                fri fra hjulet
            </Tekst>
        </>
    );
}

const VEIER = [
    { navn: 'Handlingens vei', tekst: 'du gjør det du skal', y: 220, farge: '#0891b2', selv: true },
    {
        navn: 'Kunnskapens vei',
        tekst: 'du forstår sammenhengen',
        y: 450,
        farge: '#7c3aed',
        selv: true,
    },
    {
        navn: 'Bhakti: hengivelsens vei',
        tekst: 'en gud full av nåde',
        y: 680,
        farge: '#f59e0b',
        selv: false,
    },
];

function Veier({ beat }: { beat: number }) {
    const cx = 330;
    const cy = 450;
    return (
        <>
            <Hjul cx={cx} cy={cy} r={170} fart={8} />
            <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#831843"
            >
                samsara
            </text>
            <Tekst x={800} y={80} str={48} farge="#831843">
                Tre veier ut
            </Tekst>
            {VEIER.map((v, i) => {
                const aktiv = beat === i + 1 || beat >= 4;
                const vist = beat >= i + 1;
                return (
                    <g key={v.navn}>
                        <motion.path
                            d={`M ${cx + 170} ${cy} C ${cx + 320} ${cy} ${cx + 320} ${v.y} 780 ${v.y}`}
                            fill="none"
                            stroke={v.farge}
                            strokeWidth={vist ? 16 : 8}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: vist ? 1 : 0.15, opacity: aktiv ? 1 : 0.35 }}
                            transition={{ duration: 1 }}
                        />
                        {/* Et varmt lys rundt bhakti-veien: nåden */}
                        {!v.selv && (
                            <motion.rect
                                x={770}
                                y={v.y - 90}
                                width={560}
                                height={180}
                                rx={40}
                                fill="#fde68a"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: beat >= 3 ? [0.5, 0.9, 0.5] : 0 }}
                                transition={{ duration: 2.4, repeat: beat >= 3 ? Infinity : 0 }}
                            />
                        )}
                        <motion.g
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: vist ? (aktiv ? 1 : 0.4) : 0, x: vist ? 0 : -30 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <rect
                                x={790}
                                y={v.y - 70}
                                width={520}
                                height={140}
                                rx={24}
                                fill="#fff"
                                stroke={v.farge}
                                strokeWidth={5}
                            />
                            <text
                                x={820}
                                y={v.y - 10}
                                fontSize={35}
                                fontWeight={900}
                                fill={v.farge}
                            >
                                {v.navn}
                            </text>
                            <text
                                x={820}
                                y={v.y + 42}
                                fontSize={32}
                                fontWeight={600}
                                fill="#475569"
                            >
                                {v.tekst}
                            </text>
                        </motion.g>
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= 4 ? 1 : 0 }}
                            transition={{ duration: 0.5, delay: 0.2 * i }}
                        >
                            <rect
                                x={1325}
                                y={v.y - 32}
                                width={255}
                                height={64}
                                rx={32}
                                fill={v.selv ? '#334155' : '#f59e0b'}
                            />
                            <text
                                x={1452}
                                y={v.y + 11}
                                textAnchor="middle"
                                fontSize={28}
                                fontWeight={800}
                                fill="#fff"
                            >
                                {v.selv ? 'du gjør selv' : 'nærmere nåden'}
                            </text>
                        </motion.g>
                    </g>
                );
            })}
        </>
    );
}

function Flamme({ beat }: { beat: number }) {
    const slukket = beat >= 1;
    return (
        <>
            {/* Venstre: lyset */}
            <Tekst x={420} y={110} str={50} farge="#92400e">
                Nirvana = å slukne
            </Tekst>
            <rect
                x={370}
                y={560}
                width={100}
                height={220}
                rx={10}
                fill="#fef3c7"
                stroke="#d6d3d1"
                strokeWidth={4}
            />
            <motion.rect
                x={385}
                width={70}
                rx={6}
                fill="#78350f"
                initial={false}
                animate={{ y: slukket ? 530 : 470, height: slukket ? 30 : 90 }}
                transition={{ duration: 2.5 }}
            />
            <motion.path
                d="M 420 300 C 470 380 480 430 420 470 C 360 430 370 380 420 300 Z"
                fill="#f59e0b"
                animate={
                    slukket ? { scale: 0, opacity: 0 } : { scale: [1, 1.08, 0.96, 1], opacity: 1 }
                }
                transition={
                    slukket ? { duration: 2.5, delay: 1.2 } : { duration: 1.2, repeat: Infinity }
                }
                style={{ transformOrigin: '420px 470px' }}
            />
            {/* Røyken etterpå */}
            <motion.path
                d="M 420 520 C 380 470 460 430 420 380 C 380 330 460 290 420 240"
                fill="none"
                stroke="#a8a29e"
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: slukket ? 1 : 0, opacity: slukket ? 0.7 : 0 }}
                transition={{ duration: 2, delay: 3.2 }}
            />
            <Tekst x={420} y={850} str={34} farge="#475569" vis={beat === 1}>
                ikke mer å brenne på
            </Tekst>

            {/* Høyre side skifter per beat */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 0 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <rect x={850} y={330} width={620} height={240} rx={28} fill="#fff" />
                <text
                    x={1160}
                    y={430}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Buddhismens mål
                </text>
                <text
                    x={1160}
                    y={500}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#b45309"
                >
                    nirvana
                </text>
            </motion.g>
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 1 ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 1 }}
            >
                <rect x={850} y={330} width={620} height={240} rx={28} fill="#fff" />
                <text
                    x={1160}
                    y={430}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Ikke et paradis
                </text>
                <text
                    x={1160}
                    y={500}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={700}
                    fill="#b45309"
                >
                    lidelsen tar slutt
                </text>
            </motion.g>
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <text
                    x={1160}
                    y={210}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Din egen jobb
                </text>
                {['måten du lever på', 'meditasjon', 'forståelse'].map((t, i) => (
                    <motion.g
                        key={t}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: beat === 2 ? 1 : 0, x: beat === 2 ? 0 : 40 }}
                        transition={{ delay: 0.4 + i * 0.6 }}
                    >
                        <rect
                            x={880}
                            y={270 + i * 150}
                            width={560}
                            height={110}
                            rx={24}
                            fill="#fef3c7"
                            stroke="#f59e0b"
                            strokeWidth={4}
                        />
                        <text
                            x={1160}
                            y={338 + i * 150}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#92400e"
                        >
                            {t}
                        </text>
                    </motion.g>
                ))}
            </motion.g>
        </>
    );
}

export function FrelseHjulet({ beat, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'samsara';
    return (
        <Flate bakgrunn={modus === 'flamme' ? '#fffbeb' : '#fdf2f8'}>
            {modus === 'veier' ? (
                <Veier beat={beat} />
            ) : modus === 'flamme' ? (
                <Flamme beat={beat} />
            ) : (
                <Samsara beat={beat} />
            )}
        </Flate>
    );
}
