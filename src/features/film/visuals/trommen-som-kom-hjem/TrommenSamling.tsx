import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { frø, MALING } from './felles';
import { TrommenOverskrift } from './TrommenOverskrift';

/**
 * Museets verden i 2D. «kort»: trommen blir et registreringskort med nummer og mål, og to
 * blikk på samme ting. «innsamling»: hyllene fylles med samiske gjenstander mens fornorskingen
 * går ute i samfunnet. «baastede»: ordet repatriering, avtalen fra 2012 og gjenstandene som
 * fordeles til seks samiske museer. «sider»: museenes grunner og den andre siden.
 */

const B = 1600;
const H = 900;
type Modus = 'kort' | 'innsamling' | 'baastede' | 'sider';

function Vis({
    når,
    children,
    forsinkelse = 0,
    dur,
}: {
    når: boolean;
    children: ReactNode;
    forsinkelse?: number;
    dur: (s: number) => number;
}) {
    if (!når) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: dur(forsinkelse), duration: dur(0.6) }}
        >
            {children}
        </motion.g>
    );
}

function Tekst({
    x,
    y,
    children,
    size = 40,
    farge = '#0f172a',
    anker = 'middle',
    vekt = 900,
}: {
    x: number;
    y: number;
    children: ReactNode;
    size?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    vekt?: number;
}) {
    return (
        <text x={x} y={y} fontSize={size} fontWeight={vekt} fill={farge} textAnchor={anker}>
            {children}
        </text>
    );
}

/** Trommen sett ovenfra: ramme, skinn og noen av figurene. */
function Trommetegning({
    x,
    y,
    s = 1,
    grå = false,
}: {
    x: number;
    y: number;
    s?: number;
    grå?: boolean;
}) {
    const m = grå ? '#94a3b8' : MALING;
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse rx={150} ry={112} fill={grå ? '#e2e8f0' : '#a16207'} />
            <ellipse rx={136} ry={100} fill={grå ? '#f1f5f9' : '#e9d3a8'} />
            <circle r={18} fill="none" stroke={m} strokeWidth={5} />
            <path d="M -120 -30 L 120 -30" stroke={m} strokeWidth={5} />
            <path
                d="M -80 -60 l 40 0 M -76 -60 l -6 20 M -48 -60 l 6 20 M -40 -60 l 10 -16 l -4 -10"
                stroke={m}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
            />
            <path
                d="M 30 -70 l 0 30 M 20 -55 l 20 0 M 30 -40 l -8 14 M 30 -40 l 8 14"
                stroke={m}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
            />
            <ellipse cx={-30} cy={50} rx={40} ry={13} fill={m} />
            <path
                d="M 50 40 l 60 -10 M 52 52 l 60 -10"
                stroke={m}
                strokeWidth={5}
                strokeLinecap="round"
            />
        </g>
    );
}

/** Gjenstander fra hverdagen: klær, verktøy, kjøreredskap, skål. Enkle ikoner. */
function Gjenstand({ type, x, y, s = 1 }: { type: number; x: number; y: number; s?: number }) {
    const f = ['#1d4ed8', '#71717a', '#a16207', '#b45309'][type % 4];
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            {type % 4 === 0 && (
                // Kofte: kjole med bånd nederst.
                <>
                    <path d="M -18 -24 L 18 -24 L 26 22 L -26 22 Z" fill={f} />
                    <path d="M -26 14 L 26 14" stroke="#dc2626" strokeWidth={5} />
                    <path d="M -26 19 L 26 19" stroke="#facc15" strokeWidth={3} />
                </>
            )}
            {type % 4 === 1 && (
                // Kniv.
                <>
                    <path d="M -26 4 L 8 -6 L 8 6 Z" fill="#cbd5e1" stroke={f} strokeWidth={2} />
                    <rect x={8} y={-6} width={22} height={12} rx={3} fill="#a16207" />
                </>
            )}
            {type % 4 === 2 && (
                // Pulk: en slede formet som en båt.
                <path d="M -30 0 Q -26 16 0 16 L 30 16 Q 34 6 26 -2 Z" fill={f} />
            )}
            {type % 4 === 3 && (
                // Skål.
                <path d="M -24 -6 L 24 -6 Q 22 18 0 18 Q -22 18 -24 -6 Z" fill={f} />
            )}
        </g>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    kort: [
        'I samlingen',
        'Et nummer og et mål',
        'Skrevet av fremmede',
        'Museet: en gjenstand',
        'Eierne: et tap',
    ],
    innsamling: [
        'Ikke bare trommer',
        '1800-tallet: alt samles inn',
        'Norsk Folkemuseum',
        'Samtidig: fornorskingen',
        'To ting på en gang',
    ],
    baastede: [
        'Repatriering: å gi tilbake',
        'Særlig når',
        '19. juni 2012: en avtale',
        'Bååstede betyr hjemkomst',
        '2019: fordelt',
        'En av de største i Norge',
    ],
    sider: [
        'Hvem eier en hellig gjenstand?',
        'Museene',
        'Museene',
        'Den andre siden',
        'Den andre siden',
    ],
};

/** Hyllene: plassene der gjenstandene står, i tre hyller med 26 i hver. */
const HYLLE_X0 = 870;
const HYLLE_PLASSER: [number, number][] = Array.from({ length: 51 }, (_, i) => [
    HYLLE_X0 + 60 + (i % 17) * 34,
    326 + Math.floor(i / 17) * 150,
]);

function Kort({ beat, dur }: { beat: number; dur: (s: number) => number }) {
    const delt = beat >= 3;
    return (
        <>
            <motion.g
                initial={false}
                animate={{ x: delt ? -330 : 0, scale: delt ? 0.82 : 1 }}
                transition={{ duration: dur(1) }}
                style={{ originX: '800px', originY: '520px' }}
            >
                {/* Registreringskortet. */}
                <rect
                    x={330}
                    y={190}
                    width={940}
                    height={610}
                    rx={14}
                    fill="#fbf7ec"
                    stroke="#a8a29e"
                    strokeWidth={4}
                />
                <path d="M 330 260 L 1270 260" stroke="#e7e5e4" strokeWidth={3} />
                <Trommetegning x={560} y={500} s={1.1} />
                <Vis når={beat >= 1} dur={dur} forsinkelse={0.3}>
                    {/* Målestrek under trommen: mål i centimeter. */}
                    <path
                        d="M 395 660 L 725 660 M 395 645 L 395 675 M 725 645 L 725 675"
                        stroke="#0f172a"
                        strokeWidth={4}
                    />
                    <Tekst x={560} y={710} size={36}>
                        cm
                    </Tekst>
                    <rect
                        x={810}
                        y={300}
                        width={400}
                        height={92}
                        rx={10}
                        fill="#fff"
                        stroke="#0f172a"
                        strokeWidth={4}
                    />
                    <Tekst x={835} y={362} size={46} anker="start">
                        Nr.
                    </Tekst>
                    {[0, 1, 2, 3].map((i) => (
                        <rect
                            key={i}
                            x={935 + i * 62}
                            y={326}
                            width={46}
                            height={44}
                            rx={6}
                            fill="#cbd5e1"
                        />
                    ))}
                </Vis>
                <Vis når={beat >= 2} dur={dur} forsinkelse={0.3}>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.rect
                            key={i}
                            x={810}
                            y={440 + i * 56}
                            height={16}
                            rx={8}
                            fill="#94a3b8"
                            initial={{ width: 0 }}
                            animate={{ width: 380 - (i % 2) * 90 }}
                            transition={{ delay: dur(0.4 + i * 0.3), duration: dur(0.5) }}
                        />
                    ))}
                    <Tekst x={990} y={762} size={30} farge="#1e293b" vekt={900}>
                        av folk som aldri så den i bruk
                    </Tekst>
                </Vis>
            </motion.g>
            <Vis når={beat >= 3} dur={dur} forsinkelse={0.6}>
                <rect
                    x={1040}
                    y={170}
                    width={520}
                    height={300}
                    rx={18}
                    fill="#e0f2fe"
                    stroke="#0369a1"
                    strokeWidth={4}
                />
                <Tekst x={1070} y={232} size={42} anker="start" farge="#0369a1">
                    Museet:
                </Tekst>
                <Tekst x={1070} y={296} size={34} anker="start" vekt={700}>
                    en godt bevart gjenstand
                </Tekst>
                <Tekst x={1070} y={344} size={34} anker="start" vekt={700}>
                    fra et fjernt folk.
                </Tekst>
                <Tekst x={1070} y={420} size={34} anker="start" vekt={700}>
                    Trygg bak glass.
                </Tekst>
            </Vis>
            <Vis når={beat >= 4} dur={dur} forsinkelse={0.4}>
                <rect
                    x={1040}
                    y={500}
                    width={520}
                    height={300}
                    rx={18}
                    fill="#fef2f2"
                    stroke="#b91c1c"
                    strokeWidth={4}
                />
                <Tekst x={1070} y={562} size={42} anker="start" farge="#b91c1c">
                    Eierne:
                </Tekst>
                <Tekst x={1070} y={626} size={34} anker="start" vekt={700}>
                    borte.
                </Tekst>
                <Tekst x={1070} y={674} size={34} anker="start" vekt={700}>
                    De fleste visste ikke
                </Tekst>
                <Tekst x={1070} y={722} size={34} anker="start" vekt={700}>
                    hvor den var.
                </Tekst>
                <ellipse
                    cx={1470}
                    cy={552}
                    rx={54}
                    ry={38}
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth={4}
                    strokeDasharray="10 8"
                />
                <Tekst x={1470} y={568} size={44} farge="#b91c1c">
                    ?
                </Tekst>
            </Vis>
        </>
    );
}

function Innsamling({ beat, dur }: { beat: number; dur: (s: number) => number }) {
    const fylt = beat >= 2;
    const vistAntall = beat === 0 ? 0 : beat === 1 ? 4 : HYLLE_PLASSER.length;
    return (
        <>
            {/* Høyre: museet med hyller bak glass. */}
            <rect
                x={HYLLE_X0}
                y={190}
                width={700}
                height={640}
                rx={16}
                fill="#f8fafc"
                stroke="#94a3b8"
                strokeWidth={4}
            />
            <Tekst x={HYLLE_X0 + 350} y={250} size={40}>
                I museet
            </Tekst>
            {[0, 1, 2].map((r) => (
                <rect
                    key={r}
                    x={HYLLE_X0 + 10}
                    y={352 + r * 150}
                    width={680}
                    height={12}
                    fill="#a16207"
                />
            ))}
            {/* Trommen står alltid på hylla øverst til venstre. */}
            <g transform={`translate(${HYLLE_X0 + 32} 318) scale(0.2)`}>
                <Trommetegning x={0} y={0} />
            </g>
            {HYLLE_PLASSER.slice(0, vistAntall).map(([x, y], i) => {
                const type = Math.floor(frø(i) * 4);
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: dur(fylt ? 0.2 + i * 0.025 : 0.6 + i * 0.6),
                            duration: dur(0.4),
                        }}
                    >
                        <Gjenstand type={type} x={x + 30} y={y} s={0.95} />
                    </motion.g>
                );
            })}
            <rect
                x={HYLLE_X0}
                y={190}
                width={700}
                height={640}
                rx={16}
                fill="#cfe8f5"
                fillOpacity={0.18}
                stroke="none"
            />
            {beat === 1 && (
                <g>
                    {['klær', 'verktøy', 'kjøreredskaper', 'hverdagsting'].map((t, i) => (
                        <motion.g
                            key={t}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: dur(0.6 + i * 0.6) }}
                        >
                            <Gjenstand type={i} x={120} y={330 + i * 120} s={1.5} />
                            <Tekst x={190} y={344 + i * 120} size={40} anker="start">
                                {t}
                            </Tekst>
                        </motion.g>
                    ))}
                </g>
            )}

            {/* Venstre: ute i samfunnet, fornorskingen. */}
            <Vis når={beat >= 3} dur={dur} forsinkelse={0.2}>
                <rect
                    x={40}
                    y={190}
                    width={780}
                    height={640}
                    rx={16}
                    fill="#fff7ed"
                    stroke="#c2410c"
                    strokeWidth={4}
                />
                <Tekst x={430} y={250} size={40}>
                    Ute i samfunnet
                </Tekst>
                <rect
                    x={120}
                    y={330}
                    width={300}
                    height={110}
                    rx={20}
                    fill="#fde68a"
                    stroke="#b45309"
                    strokeWidth={4}
                />
                <Tekst x={270} y={400} size={44}>
                    samisk
                </Tekst>
                <Tekst x={470} y={408} size={64} farge="#dc2626">
                    ✕
                </Tekst>
                <motion.path
                    d="M 270 470 L 270 560"
                    stroke="#475569"
                    strokeWidth={8}
                    markerEnd="url(#pil-samling)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: dur(1.2), duration: dur(0.8) }}
                />
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: dur(1.8) }}
                >
                    <rect
                        x={120}
                        y={590}
                        width={300}
                        height={110}
                        rx={20}
                        fill="#e2e8f0"
                        stroke="#475569"
                        strokeWidth={4}
                    />
                    <Tekst x={270} y={660} size={44}>
                        norsk
                    </Tekst>
                </motion.g>
                <Tekst x={620} y={420} size={40} farge="#431407">
                    språk
                </Tekst>
                <Tekst x={620} y={476} size={40} farge="#431407">
                    og kultur
                </Tekst>
                <Tekst x={620} y={532} size={40} farge="#431407">
                    byttes ut
                </Tekst>
            </Vis>
            <Vis når={beat >= 4} dur={dur} forsinkelse={0.4}>
                <rect x={170} y={740} width={520} height={68} rx={34} fill="#b91c1c" />
                <Tekst x={430} y={788} size={36} farge="#fff">
                    motarbeidet
                </Tekst>
            </Vis>
            <Vis når={beat >= 4} dur={dur} forsinkelse={1.6}>
                <rect x={HYLLE_X0 + 90} y={740} width={520} height={68} rx={34} fill="#0369a1" />
                <Tekst x={HYLLE_X0 + 350} y={788} size={36} farge="#fff">
                    samlet inn, bak glass
                </Tekst>
            </Vis>
        </>
    );
}

const MUSEER = 6;

function Baastede({ beat, dur }: { beat: number; dur: (s: number) => number }) {
    const fordelt = beat >= 4;
    return (
        <>
            {beat <= 1 && (
                <g>
                    {/* Fra museet og hjem: en pil mellom to hus. */}
                    <rect
                        x={200}
                        y={300}
                        width={360}
                        height={260}
                        rx={10}
                        fill="#e2e8f0"
                        stroke="#475569"
                        strokeWidth={4}
                    />
                    <path d="M 180 300 L 380 190 L 580 300 Z" fill="#94a3b8" />
                    {[0, 1, 2, 3].map((i) => (
                        <rect
                            key={i}
                            x={235 + i * 80}
                            y={330}
                            width={30}
                            height={200}
                            fill="#cbd5e1"
                        />
                    ))}
                    <Tekst x={380} y={620} size={38}>
                        museet
                    </Tekst>
                    <path
                        d="M 1040 560 L 1040 360 L 1200 250 L 1360 360 L 1360 560 Z"
                        fill="#fde68a"
                        stroke="#b45309"
                        strokeWidth={4}
                    />
                    <Tekst x={1200} y={620} size={38}>
                        dem den hører til
                    </Tekst>
                    <motion.g
                        initial={{ x: 0 }}
                        animate={{ x: 620 }}
                        transition={{ duration: dur(2.6), delay: dur(0.6) }}
                    >
                        <g transform="translate(400 450) scale(0.42)">
                            <Trommetegning x={0} y={0} />
                        </g>
                    </motion.g>
                    <path
                        d="M 620 690 L 980 690"
                        stroke="#0d9488"
                        strokeWidth={10}
                        markerEnd="url(#pil-samling)"
                    />
                    <Tekst x={800} y={760} size={40} farge="#0d9488">
                        å gi tilbake
                    </Tekst>
                </g>
            )}
            {beat === 1 && (
                <g>
                    {['havnet i samlingen urimelig', 'betyr mye for kultur eller tro'].map(
                        (t, i) => (
                            <motion.g
                                key={t}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: dur(0.6 + i * 2.2) }}
                            >
                                <rect
                                    x={300 + i * 520}
                                    y={150}
                                    width={480}
                                    height={80}
                                    rx={40}
                                    fill="#0f172a"
                                />
                                <Tekst x={540 + i * 520} y={204} size={32} farge="#fff">
                                    {t}
                                </Tekst>
                            </motion.g>
                        )
                    )}
                </g>
            )}
            {(beat === 2 || beat === 3) && (
                <g>
                    {/* Avtalen med tre underskrifter. */}
                    <rect
                        x={500}
                        y={170}
                        width={600}
                        height={680}
                        rx={12}
                        fill="#fffbeb"
                        stroke="#a8a29e"
                        strokeWidth={4}
                    />
                    <Tekst x={800} y={240} size={42}>
                        Avtale
                    </Tekst>
                    {[0, 1, 2].map((i) => (
                        <rect
                            key={i}
                            x={560}
                            y={290 + i * 44}
                            width={480 - (i % 2) * 120}
                            height={14}
                            rx={7}
                            fill="#cbd5e1"
                        />
                    ))}
                    {['Norsk Folkemuseum', 'Kulturhistorisk museum', 'Sametinget'].map((n, i) => (
                        <motion.g
                            key={n}
                            initial={{ opacity: beat === 2 ? 0 : 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: dur(0.6 + i * 1.2) }}
                        >
                            <path
                                d={`M 570 ${510 + i * 110} q 30 -30 60 0 t 60 0 t 60 -10`}
                                fill="none"
                                stroke="#1e3a8a"
                                strokeWidth={4}
                            />
                            <path
                                d={`M 560 ${520 + i * 110} L 1040 ${520 + i * 110}`}
                                stroke="#57534e"
                                strokeWidth={3}
                            />
                            <Tekst
                                x={1040}
                                y={556 + i * 110}
                                size={30}
                                anker="end"
                                vekt={700}
                                farge="#44403c"
                            >
                                {n}
                            </Tekst>
                        </motion.g>
                    ))}
                    {beat === 3 && (
                        <motion.g
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: dur(1.4) }}
                            style={{ originX: '1240px', originY: '420px' }}
                        >
                            <rect
                                x={1130}
                                y={330}
                                width={420}
                                height={190}
                                rx={20}
                                fill="#b45309"
                            />
                            <Tekst x={1340} y={410} size={54} farge="#fff">
                                Bååstede
                            </Tekst>
                            <Tekst x={1340} y={480} size={40} farge="#fde68a">
                                = hjemkomst
                            </Tekst>
                        </motion.g>
                    )}
                    {beat === 3 && (
                        <Vis når dur={dur} forsinkelse={0.4}>
                            <rect
                                x={40}
                                y={330}
                                width={430}
                                height={190}
                                rx={20}
                                fill="#fff"
                                stroke="#b45309"
                                strokeWidth={4}
                            />
                            <Tekst x={255} y={400} size={32} vekt={700}>
                                tilbake til museer
                            </Tekst>
                            <Tekst x={255} y={446} size={32} vekt={700}>
                                som Sametinget
                            </Tekst>
                            <Tekst x={255} y={492} size={32} vekt={700}>
                                har ansvar for
                            </Tekst>
                        </Vis>
                    )}
                </g>
            )}
            {fordelt && (
                <g>
                    {/* Tidslinja 2012 til 2019. */}
                    <path d="M 160 230 L 1440 230" stroke="#475569" strokeWidth={6} />
                    <circle cx={160} cy={230} r={14} fill="#475569" />
                    <motion.circle
                        cx={1440}
                        cy={230}
                        r={14}
                        fill="#0d9488"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: dur(1) }}
                    />
                    <Tekst x={160} y={200} size={36} anker="start">
                        2012
                    </Tekst>
                    <Tekst x={1440} y={200} size={36} anker="end" farge="#0d9488">
                        2019
                    </Tekst>
                    <Tekst x={800} y={210} size={34} vekt={700} farge="#475569">
                        sju år
                    </Tekst>
                    {/* Seks samiske museer. */}
                    {Array.from({ length: MUSEER }, (_, i) => {
                        const x = 100 + i * 240;
                        return (
                            <g key={i}>
                                <path
                                    d={`M ${x} 800 L ${x} 690 L ${x + 90} 630 L ${x + 180} 690 L ${x + 180} 800 Z`}
                                    fill="#fde68a"
                                    stroke="#b45309"
                                    strokeWidth={4}
                                />
                                <Tekst x={x + 90} y={850} size={30} vekt={800} farge="#78350f">
                                    {`museum ${i + 1}`}
                                </Tekst>
                            </g>
                        );
                    })}
                    {/* Gjenstandene: en tett sky som deler seg i seks. */}
                    {Array.from({ length: 180 }, (_, i) => {
                        const m = i % MUSEER;
                        const sx = 800 + (frø(i) - 0.5) * 300;
                        const sy = 400 + (frø(i + 7) - 0.5) * 150;
                        const mx = 100 + m * 240 + 30 + frø(i + 11) * 120;
                        const my = 700 + frø(i + 13) * 80;
                        return (
                            <motion.circle
                                key={i}
                                r={7}
                                cx={sx}
                                cy={sy}
                                fill="#b45309"
                                initial={{ x: 0, y: 0 }}
                                animate={{ x: mx - sx, y: my - sy }}
                                transition={{
                                    duration: dur(1.8),
                                    delay: dur(1.2 + (i % 30) * 0.04),
                                }}
                            />
                        );
                    })}
                </g>
            )}
            {beat >= 5 && (
                <Vis når dur={dur} forsinkelse={0.4}>
                    <rect x={350} y={300} width={900} height={110} rx={55} fill="#0f172a" />
                    <Tekst x={800} y={372} size={42} farge="#fff">
                        En av de største tilbakeføringene
                    </Tekst>
                </Vis>
            )}
        </>
    );
}

function Sider({ beat, dur }: { beat: number; dur: (s: number) => number }) {
    const venstre = [
        { tekst: 'utstyr og fagfolk', fra: 1 },
        { tekst: 'tar vare på skjøre ting', fra: 1 },
        { tekst: 'viser fram for forskere', fra: 2 },
        { tekst: 'og publikum fra hele verden', fra: 2 },
    ];
    const hoyre = [
        { tekst: 'ikke solgt, ikke gitt bort', fra: 3 },
        { tekst: 'tatt av den som hadde makt', fra: 3 },
        { tekst: 'retten til å fortelle', fra: 4 },
        { tekst: 'sin egen historie', fra: 4 },
    ];
    return (
        <>
            {/* Vekta står i balanse: artikkelen sier at spørsmålet ikke er løst. */}
            <path d="M 800 820 L 800 330" stroke="#475569" strokeWidth={14} />
            <path d="M 700 830 L 900 830" stroke="#475569" strokeWidth={14} strokeLinecap="round" />
            <path
                d="M 420 330 L 1180 330"
                stroke="#475569"
                strokeWidth={12}
                strokeLinecap="round"
            />
            <circle cx={800} cy={330} r={18} fill="#334155" />
            <g transform="translate(800 250) scale(0.34)">
                <Trommetegning x={0} y={0} />
            </g>
            {[420, 1180].map((x) => (
                <g key={x}>
                    <path
                        d={`M ${x} 330 L ${x - 70} 470 M ${x} 330 L ${x + 70} 470`}
                        stroke="#64748b"
                        strokeWidth={4}
                    />
                    <path d={`M ${x - 110} 470 Q ${x} 530 ${x + 110} 470 Z`} fill="#94a3b8" />
                </g>
            ))}
            <Vis når={beat >= 1} dur={dur}>
                <Tekst x={420} y={570} size={42} farge="#0369a1">
                    Museene:
                </Tekst>
            </Vis>
            <Vis når={beat >= 3} dur={dur}>
                <Tekst x={1180} y={570} size={42} farge="#b45309">
                    Den andre siden:
                </Tekst>
            </Vis>
            {venstre.map((r, i) => (
                <Vis key={r.tekst} når={beat >= r.fra} dur={dur} forsinkelse={0.5 + (i % 2) * 1.2}>
                    <Tekst x={420} y={640 + i * 52} size={34} vekt={700}>
                        {r.tekst}
                    </Tekst>
                </Vis>
            ))}
            {hoyre.map((r, i) => (
                <Vis key={r.tekst} når={beat >= r.fra} dur={dur} forsinkelse={0.5 + (i % 2) * 1.2}>
                    <Tekst x={1180} y={640 + i * 52} size={34} vekt={700}>
                        {r.tekst}
                    </Tekst>
                </Vis>
            ))}
            {beat === 0 && (
                <Vis når dur={dur} forsinkelse={1}>
                    <Tekst x={1180} y={640} size={46} farge="#b91c1c">
                        Ikke løst
                    </Tekst>
                </Vis>
            )}
        </>
    );
}

export function TrommenSamling({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kort';
    const dur = (s: number) => (playing ? s : 0);
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: modus === 'sider' ? '#f1f5f9' : '#e7e2d6' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <marker
                        id="pil-samling"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="3"
                        markerHeight="3"
                        orient="auto"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill="context-stroke" />
                    </marker>
                </defs>
                {modus === 'kort' && <Kort beat={beat} dur={dur} />}
                {modus === 'innsamling' && <Innsamling beat={beat} dur={dur} />}
                {modus === 'baastede' && <Baastede beat={beat} dur={dur} />}
                {modus === 'sider' && <Sider beat={beat} dur={dur} />}
            </svg>
            <TrommenOverskrift tekst={overskrift} />
            <AnimatePresence>
                {modus === 'innsamling' && beat === 2 && (
                    <motion.div
                        key="4300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute"
                        style={{ left: '6%', top: '38%' }}
                    >
                        <Teller
                            verdi={4300}
                            etikett="samiske gjenstander"
                            prefiks="ca. "
                            forsinkelse={dur(0.6)}
                        />
                    </motion.div>
                )}
                {modus === 'baastede' && beat === 4 && (
                    <motion.div
                        key="1600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: '34%' }}
                    >
                        <Teller
                            verdi={1600}
                            etikett="gjenstander til seks samiske museer"
                            prefiks="over "
                            tone="gronn"
                            forsinkelse={dur(0.4)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
