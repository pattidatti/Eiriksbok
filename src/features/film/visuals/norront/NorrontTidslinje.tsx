import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Språket som en elv gjennom tiden.
 *
 *  - start: urnordisk, norrønt fra 700 til 1350, og den samme elva fram til norsk i dag
 *  - dansk: svartedauden, unionen 1380-1814, skrift på dansk og tale på norsk
 *  - uke:   ukedagene som har navn etter norrøne guder
 *
 * Bare årstall fra artikkelen står på aksen. Avstandene mellom dem er i riktig målestokk.
 */

type Modus = 'start' | 'dansk' | 'uke';

const B = 1600;
const H = 900;
const BAKGRUNN = '#1c1611';
const NORRONT = '#f59e0b';
const URNORDISK = '#a8a29e';
const NORSK = '#3b82f6';
const DANSK = '#dc2626';
const TEKST = '#fef3c7';

function Tittel({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                x={B / 2}
                y={86}
                textAnchor="middle"
                fontSize={52}
                fontWeight={800}
                fill={TEKST}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ fontFamily: 'Outfit, sans-serif' }}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

/* ---------------- start ---------------- */

/** År 200 til i dag over bildet. Bare 700 og 1350 får merke. */
const xStart = (ar: number) => 100 + ((ar - 200) / (2030 - 200)) * 1400;
const ELV_Y = 470;

function Start({ beat }: { beat: number }) {
    const x700 = xStart(700);
    const x1350 = xStart(1350);
    const xIdag = xStart(2030);
    const titler = ['Urnordisk', 'Norrønt fra rundt år 700', 'Norrønt: 700 til 1350', 'Det samme språket', 'Oldemoren til norsk'];
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            <defs>
                <linearGradient id="nt-ur" x1="0" x2="1">
                    <stop offset="0" stopColor={URNORDISK} stopOpacity={0} />
                    <stop offset="0.35" stopColor={URNORDISK} stopOpacity={0.9} />
                    <stop offset="1" stopColor={URNORDISK} />
                </linearGradient>
                <linearGradient id="nt-overgang" x1="0" x2="1">
                    <stop offset="0" stopColor={NORRONT} />
                    <stop offset="1" stopColor={NORSK} />
                </linearGradient>
            </defs>
            {/* Aksen */}
            <line x1={80} x2={1520} y1={640} y2={640} stroke="#78716c" strokeWidth={3} />
            {/* Urnordisk */}
            <motion.rect
                x={80}
                y={ELV_Y - 40}
                height={80}
                rx={40}
                fill="url(#nt-ur)"
                initial={{ width: 0 }}
                animate={{ width: x700 - 80 + 40 }}
                transition={{ duration: 1.2 }}
            />
            <motion.text
                x={(80 + x700) / 2}
                y={ELV_Y + 12}
                textAnchor="middle"
                fontSize={38}
                fontWeight={700}
                fill="#1c1917"
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                transition={{ delay: 0.6 }}
            >
                urnordisk
            </motion.text>
            <motion.text
                x={(80 + x700) / 2}
                y={ELV_Y - 70}
                textAnchor="middle"
                fontSize={30}
                fill={TEKST}
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 0 ? 1 : 0.5 }}
            >
                kjent fra runesteiner
            </motion.text>
            {/* Norrønt */}
            <motion.rect
                x={x700}
                y={ELV_Y - 50}
                height={100}
                fill={NORRONT}
                initial={{ width: 0 }}
                animate={{ width: beat >= 1 ? (beat >= 2 ? x1350 - x700 : (x1350 - x700) * 0.55) : 0 }}
                transition={{ duration: 1.4 }}
            />
            {beat >= 1 && (
                <motion.text
                    x={beat >= 2 ? (x700 + x1350) / 2 : x700 + (x1350 - x700) * 0.27}
                    y={ELV_Y + 16}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill="#1c1917"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    norrønt
                </motion.text>
            )}
            {beat >= 2 && (
                <motion.text
                    x={(x700 + x1350) / 2}
                    y={ELV_Y + 100}
                    textAnchor="middle"
                    fontSize={32}
                    fill={TEKST}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    i Norge også kalt gammelnorsk
                </motion.text>
            )}
            {/* Videre til i dag */}
            <motion.rect
                x={x1350}
                y={ELV_Y - 50}
                height={100}
                fill="url(#nt-overgang)"
                initial={{ width: 0 }}
                animate={{ width: beat >= 3 ? xIdag - x1350 : 0 }}
                transition={{ duration: 1.6 }}
            />
            {beat >= 3 && (
                <motion.text
                    x={(x1350 + xIdag) / 2 + 60}
                    y={ELV_Y + 16}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={900}
                    fill="white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    norsk
                </motion.text>
            )}
            {/* Merker på aksen */}
            {[
                { x: x700, tekst: '700', vis: beat >= 1 },
                { x: x1350, tekst: '1350', vis: beat >= 2 },
                { x: xIdag, tekst: 'i dag', vis: beat >= 3 },
            ].map((m) => (
                <motion.g key={m.tekst} initial={{ opacity: 0 }} animate={{ opacity: m.vis ? 1 : 0 }}>
                    <line x1={m.x} x2={m.x} y1={625} y2={655} stroke={TEKST} strokeWidth={4} />
                    <text x={m.x} y={705} textAnchor={m.tekst === 'i dag' ? 'end' : 'middle'} fontSize={38} fontWeight={700} fill={TEKST}>
                        {m.tekst}
                    </text>
                </motion.g>
            ))}
            {/* Slekt */}
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <rect x={(x700 + x1350) / 2 - 130} y={250} width={260} height={84} rx={20} fill="#fef3c7" />
                        <text x={(x700 + x1350) / 2} y={306} textAnchor="middle" fontSize={44} fontWeight={800} fill="#92400e">
                            oldemor
                        </text>
                        <rect x={xIdag - 290} y={250} width={260} height={84} rx={20} fill="#dbeafe" />
                        <text x={xIdag - 160} y={306} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                            norsk i dag
                        </text>
                        <motion.path
                            d={`M ${(x700 + x1350) / 2 + 140} 292 C 900 200, 1100 200, ${xIdag - 300} 292`}
                            fill="none"
                            stroke={TEKST}
                            strokeWidth={5}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 0.4 }}
                        />
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------------- dansk ---------------- */

const xD = (ar: number) => 140 + ((ar - 1200) / (1880 - 1200)) * 1320;
const SKRIFT_Y = 400;
const TALE_Y = 580;

function Dansk({ beat }: { beat: number }) {
    const titler = ['Svartedauden', 'Nye skrivere', 'Union med Danmark', 'Skrift og tale skilles', '1814: ingen norsk skrift'];
    const x1350 = xD(1350);
    const x1380 = xD(1380);
    const x1814 = xD(1814);
    const xSlutt = xD(1880);
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            <line x1={120} x2={1500} y1={760} y2={760} stroke="#78716c" strokeWidth={3} />
            {/* Unionen */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? 1 : 0 }}>
                <rect x={x1380} y={175} width={x1814 - x1380} height={70} rx={14} fill="#7f1d1d" />
                <text x={(x1380 + x1814) / 2} y={222} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fee2e2">
                    Union med Danmark: felles konge
                </text>
            </motion.g>
            {/* Skriftspråket */}
            <text x={130} y={SKRIFT_Y - 70} fontSize={32} fontWeight={700} fill={TEKST}>
                Skrift
            </text>
            <rect x={140} y={SKRIFT_Y - 36} width={x1350 - 140} height={72} fill={NORRONT} />
            <text x={150 + (x1350 - 140) / 2} y={SKRIFT_Y + 12} textAnchor="middle" fontSize={34} fontWeight={800} fill="#1c1917">
                norrønt
            </text>
            <defs>
                <linearGradient id="nt-skrift" x1="0" x2="1">
                    <stop offset="0" stopColor={NORRONT} />
                    <stop offset="0.35" stopColor="#ea580c" />
                    <stop offset="1" stopColor={DANSK} />
                </linearGradient>
            </defs>
            <motion.rect
                x={x1350}
                y={SKRIFT_Y - 36}
                height={72}
                fill={beat >= 3 ? 'url(#nt-skrift)' : '#ea580c'}
                initial={{ width: 0 }}
                animate={{ width: beat >= 1 ? (beat >= 3 ? xSlutt - x1350 : x1380 - x1350 + 60) : 0 }}
                transition={{ duration: 1.2 }}
            />
            {beat >= 3 && (
                <motion.text
                    x={(x1380 + x1814) / 2}
                    y={SKRIFT_Y + 12}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill="white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    dansk tar over, bit for bit
                </motion.text>
            )}
            {beat === 1 && (
                <motion.text
                    x={x1350 + 20}
                    y={SKRIFT_Y + 90}
                    fontSize={30}
                    fill={TEKST}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    ny generasjon skrivere, nytt skriftspråk
                </motion.text>
            )}
            {/* Talespråket */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 3 ? 1 : 0 }}>
                <text x={130} y={TALE_Y - 56} fontSize={32} fontWeight={700} fill={TEKST}>
                    Tale
                </text>
                <line
                    x1={140}
                    x2={xSlutt}
                    y1={TALE_Y}
                    y2={TALE_Y}
                    stroke={NORSK}
                    strokeWidth={26}
                    strokeDasharray="34 18"
                />
                <rect x={(x1380 + x1814) / 2 - 330} y={TALE_Y + 26} width={660} height={56} rx={12} fill="#1e3a8a" />
                <text x={(x1380 + x1814) / 2} y={TALE_Y + 66} textAnchor="middle" fontSize={30} fontWeight={700} fill="#dbeafe">
                    folk snakker norsk, men ingen skriver det
                </text>
            </motion.g>
            {/* Svartedauden */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                <rect x={x1350 - 14} y={140} width={22} height={620} fill="#0c0a09" stroke="#57534e" strokeWidth={2} />
                <motion.rect x={140} y={SKRIFT_Y - 36} height={72} width={x1350 - 140} fill="#0c0a09" initial={{ opacity: 0 }} animate={{ opacity: beat === 0 ? [0, 0.55, 0.35] : 0 }} transition={{ duration: 2 }} />
                <motion.g animate={{ opacity: beat === 0 ? 1 : beat >= 2 ? 0 : 0.7 }}>
                    <rect x={x1350 + 24} y={258} width={470} height={56} rx={12} fill="#292524" />
                    <text x={x1350 + 40} y={297} fontSize={30} fontWeight={700} fill="#e7e5e4">
                        Svartedauden, 1349 til 1350
                    </text>
                </motion.g>
            </motion.g>
            {/* 1814 */}
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <line x1={x1814} x2={x1814} y1={150} y2={760} stroke="#fbbf24" strokeWidth={6} />
                        <rect x={x1814 - 360} y={252} width={350} height={104} rx={14} fill="#fef3c7" />
                        <text x={x1814 - 185} y={294} textAnchor="middle" fontSize={30} fontWeight={800} fill="#1c1917">
                            Norge selvstendig
                        </text>
                        <text x={x1814 - 185} y={336} textAnchor="middle" fontSize={28} fontWeight={600} fill="#b91c1c">
                            skrift: bare dansk
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {/* Årstall */}
            {[
                { ar: 1350, tekst: '1350', vis: true },
                { ar: 1380, tekst: '1380', vis: beat >= 2 },
                { ar: 1814, tekst: '1814', vis: beat >= 2 },
            ].map((m) => (
                <motion.g key={m.tekst} initial={{ opacity: 0 }} animate={{ opacity: m.vis ? 1 : 0 }}>
                    <line x1={xD(m.ar)} x2={xD(m.ar)} y1={745} y2={775} stroke={TEKST} strokeWidth={4} />
                    <text
                        x={xD(m.ar) + (m.ar === 1350 ? -18 : m.ar === 1380 ? 18 : 0)}
                        y={822}
                        textAnchor={m.ar === 1350 ? 'end' : m.ar === 1380 ? 'start' : 'middle'}
                        fontSize={38}
                        fontWeight={700}
                        fill={TEKST}
                    >
                        {m.tekst}
                    </text>
                </motion.g>
            ))}
        </>
    );
}

/* ---------------- uke ---------------- */

const DAGER = [
    { navn: 'mandag' },
    { navn: 'tirsdag', gud: 'Ty', hvem: 'krigsguden', beat: 1 },
    { navn: 'onsdag', gud: 'Odin', hvem: 'hovedguden', beat: 2 },
    { navn: 'torsdag', gud: 'Tor', hvem: '', beat: 2 },
    { navn: 'fredag', gud: 'Frigg / Frøya', hvem: 'gudinner', beat: 3 },
    { navn: 'lørdag' },
    { navn: 'søndag' },
];

function Uke({ beat }: { beat: number }) {
    const bredde = 196;
    const gap = 16;
    const start = (B - (bredde * 7 + gap * 6)) / 2;
    return (
        <>
            <Tittel tekst="Ukedager med norrøne navn" />
            {DAGER.map((d, i) => {
                const x = start + i * (bredde + gap);
                const gud = d.beat !== undefined;
                const vist = gud && beat >= d.beat!;
                const fokus = gud && beat === d.beat;
                return (
                    <motion.g
                        key={d.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: gud ? 1 : beat >= 1 ? 0.3 : 0.75 }}
                        transition={{ delay: beat === 0 ? i * 0.12 : 0 }}
                    >
                        <rect
                            x={x}
                            y={200}
                            width={bredde}
                            height={480}
                            rx={20}
                            fill={vist ? '#fef3c7' : '#f5f5f4'}
                            stroke={fokus ? NORRONT : 'none'}
                            strokeWidth={8}
                        />
                        <rect x={x} y={200} width={bredde} height={70} rx={20} fill={vist ? '#b45309' : '#57534e'} />
                        <rect x={x} y={240} width={bredde} height={30} fill={vist ? '#b45309' : '#57534e'} />
                        <text
                            x={x + bredde / 2}
                            y={248}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="white"
                        >
                            {d.navn}
                        </text>
                        {gud && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: vist ? 1 : 0 }} transition={{ duration: 0.6 }}>
                                <text
                                    x={x + bredde / 2}
                                    y={440}
                                    textAnchor="middle"
                                    fontSize={d.gud!.length > 6 ? 30 : 58}
                                    fontWeight={900}
                                    fill="#7c2d12"
                                >
                                    {d.gud}
                                </text>
                                <text x={x + bredde / 2} y={500} textAnchor="middle" fontSize={26} fontWeight={600} fill="#57534e">
                                    {d.hvem}
                                </text>
                            </motion.g>
                        )}
                        {gud && !vist && (
                            <text x={x + bredde / 2} y={460} textAnchor="middle" fontSize={64} fontWeight={900} fill="#d6d3d1">
                                ?
                            </text>
                        )}
                    </motion.g>
                );
            })}
            <AnimatePresence>
                {beat === 0 && (
                    <motion.text
                        x={B / 2}
                        y={780}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={700}
                        fill={TEKST}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Navn etter gamle guder
                    </motion.text>
                )}
            </AnimatePresence>
        </>
    );
}

export function NorrontTidslinje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'start';
    return (
        <div className="absolute inset-0" style={{ background: BAKGRUNN }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                {modus === 'start' && <Start beat={beat} />}
                {modus === 'dansk' && <Dansk beat={beat} />}
                {modus === 'uke' && <Uke beat={beat} />}
            </svg>
        </div>
    );
}
