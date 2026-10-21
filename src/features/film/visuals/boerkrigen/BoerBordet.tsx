import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Freden i Vereeniging som et rom sett ovenfra. «bordet»: håpet om stemmerett, bordet der
 * britene og boerne skriver under, og menneskene som står utenfor. «punkt8»: avtalen og
 * punktet om stemmerett. «etter»: veien fra unionen i 1910 til apartheid i 1948.
 */

type Modus = 'bordet' | 'punkt8' | 'etter';

const BRITISK = '#be123c';
const BOER = '#c2410c';
const UTENFOR = '#0f766e';
const MORK = '#0f172a';

/** Et menneske sett forfra: hode og kropp. */
function Figur({
    x,
    y,
    farge,
    s = 1,
    opacity = 1,
}: {
    x: number;
    y: number;
    farge: string;
    s?: number;
    opacity?: number;
}) {
    return (
        <motion.g initial={false} animate={{ opacity }} transition={{ duration: 0.8 }}>
            <circle cx={x} cy={y - 34 * s} r={15 * s} fill={farge} />
            <path
                d={`M ${x - 22 * s} ${y + 22 * s} Q ${x - 22 * s} ${y - 14 * s} ${x} ${y - 14 * s} Q ${x + 22 * s} ${y - 14 * s} ${x + 22 * s} ${y + 22 * s} Z`}
                fill={farge}
            />
        </motion.g>
    );
}

/** Menneskene utenfor rommet: svarte, fargede og indiske sørafrikanere. */
const FOLK: [number, number][] = Array.from({ length: 15 }, (_, i) => {
    const rad = Math.floor(i / 5);
    const kol = i % 5;
    return [110 + kol * 78 + (rad % 2) * 34, 560 + rad * 88];
});

function Folket({ opacity = 1, uthevet = false }: { opacity?: number; uthevet?: boolean }) {
    return (
        <g>
            {uthevet && (
                <motion.rect
                    x={60}
                    y={470}
                    width={440}
                    height={330}
                    rx={30}
                    fill="none"
                    stroke={UTENFOR}
                    strokeWidth={6}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
            {FOLK.map(([x, y], i) => (
                <Figur key={i} x={x} y={y} farge={UTENFOR} opacity={opacity} />
            ))}
            <text x={280} y={850} textAnchor="middle" fontSize={28} fontWeight={800} fill={UTENFOR}>
                Svarte, fargede og indiske
            </text>
            <text x={280} y={884} textAnchor="middle" fontSize={28} fontWeight={800} fill={UTENFOR}>
                sørafrikanere
            </text>
        </g>
    );
}

/** Tankeboble over folket. */
function Boble({ linjer, borte = false }: { linjer: string[]; borte?: boolean }) {
    return (
        <motion.g
            key={linjer.join('|')}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: borte ? 0.25 : 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <circle cx={250} cy={450} r={12} fill="#fff" stroke={UTENFOR} strokeWidth={4} />
            <circle cx={225} cy={418} r={18} fill="#fff" stroke={UTENFOR} strokeWidth={4} />
            <rect x={60} y={170} width={440} height={220} rx={50} fill="#fff" stroke={UTENFOR} strokeWidth={5} />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={280}
                    y={240 + i * 56}
                    textAnchor="middle"
                    fontSize={i === 0 ? 40 : 32}
                    fontWeight={i === 0 ? 900 : 700}
                    fill={MORK}
                    textDecoration={borte ? 'line-through' : undefined}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

/** Rommet med bordet, sett ovenfra. */
function Rommet({ beat, modus }: { beat: number; modus: Modus }) {
    const vis = modus === 'bordet' && beat >= 2;
    const boerneBritiske = modus === 'bordet' && beat >= 3;
    return (
        <AnimatePresence>
            {vis && (
                <motion.g key="rom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Veggene */}
                    <rect x={600} y={170} width={940} height={640} rx={14} fill="#f5efe2" stroke="#57534e" strokeWidth={14} />
                    <rect x={596} y={430} width={20} height={130} fill="#f5efe2" />
                    <text x={1070} y={218} textAnchor="middle" fontSize={30} fontWeight={800} fill="#57534e">
                        Vereeniging, 31. mai 1902
                    </text>
                    {/* Bordet */}
                    <rect x={760} y={390} width={620} height={210} rx={20} fill="#8b5e34" />
                    <rect x={780} y={410} width={580} height={170} rx={14} fill="#a47148" />
                    {/* Avtalen på bordet */}
                    <motion.g animate={{ rotate: 0 }}>
                        <rect x={1010} y={440} width={120} height={110} rx={6} fill="#fffdf6" stroke="#57534e" strokeWidth={3} />
                        {[0, 1, 2, 3].map((i) => (
                            <rect key={i} x={1026} y={462 + i * 20} width={88 - (i % 2) * 22} height={6} rx={3} fill="#a8a29e" />
                        ))}
                    </motion.g>
                    {/* Britene på den ene siden, boerne på den andre */}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <Figur key={`b${i}`} x={830 + i * 120} y={335} farge={BRITISK} s={1.15} />
                    ))}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <Figur key={`o${i}`} x={830 + i * 120} y={690} farge={BOER} s={1.15} />
                    ))}
                    <text x={705} y={345} textAnchor="middle" fontSize={32} fontWeight={900} fill={BRITISK}>
                        Britene
                    </text>
                    <text x={705} y={700} textAnchor="middle" fontSize={32} fontWeight={900} fill={BOER}>
                        Boerne
                    </text>
                    {boerneBritiske && (
                        <motion.g initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <rect x={790} y={420} width={560} height={150} rx={18} fill="#fff" stroke={BOER} strokeWidth={5} />
                            <text x={1070} y={482} textAnchor="middle" fontSize={36} fontWeight={900} fill={BOER}>
                                Republikkene blir britiske
                            </text>
                            <text x={1070} y={538} textAnchor="middle" fontSize={32} fontWeight={700} fill={MORK}>
                                men boerne får mye
                            </text>
                        </motion.g>
                    )}
                </motion.g>
            )}
        </AnimatePresence>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    bordet: ['Et håp', 'Stemmerett for alle?', 'Freden i Vereeniging', 'Boerne skriver under', 'Hvem satt ved bordet?'],
    punkt8: ['Fredsavtalen', 'Punkt 8', 'Hvem bestemmer?', 'Håpet blir ikke oppfylt'],
    etter: ['1910: én stat', '1918: en hemmelig forening', '1948: et nytt parti vinner', 'Apartheid'],
};

export function BoerBordet({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'bordet';
    const liste = OVERSKRIFT[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100 to-stone-200">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'etter' ? (
                    <Etter beat={beat} />
                ) : (
                    <>
                        <Rommet beat={beat} modus={modus} />
                        {modus === 'punkt8' && <Avtalen beat={beat} />}
                        <Folket
                            uthevet={modus === 'bordet' && beat === 4}
                            opacity={modus === 'punkt8' && beat >= 3 ? 0.55 : 1}
                        />
                        {modus === 'bordet' && beat <= 1 && (
                            <Boble linjer={beat === 0 ? ['Et håp', 'hvis britene vinner'] : ['Stemmerett', 'som i Kappkolonien,', 'i hele Sør-Afrika?']} />
                        )}
                        {modus === 'bordet' && beat === 4 && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                <rect x={60} y={250} width={440} height={130} rx={24} fill="#fff" stroke={UTENFOR} strokeWidth={5} />
                                <text x={280} y={306} textAnchor="middle" fontSize={38} fontWeight={900} fill={MORK}>
                                    Ingen plass
                                </text>
                                <text x={280} y={352} textAnchor="middle" fontSize={32} fontWeight={700} fill={MORK}>
                                    ved bordet
                                </text>
                            </motion.g>
                        )}
                        {modus === 'punkt8' && <Boble linjer={['Stemmerett', 'i hele Sør-Afrika?']} borte={beat >= 3} />}
                    </>
                )}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {overskrift}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Avtalen som et stort ark over bordet, med punkt 8. */
function Avtalen({ beat }: { beat: number }) {
    return (
        <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <rect x={690} y={170} width={760} height={640} rx={16} fill="#fffdf6" stroke="#57534e" strokeWidth={5} />
            <text x={1070} y={226} textAnchor="middle" fontSize={28} fontWeight={800} fill="#78716c">
                Vereeniging, 31. mai 1902
            </text>
            <text x={1070} y={318} textAnchor="middle" fontSize={36} fontWeight={900} fill={MORK}>
                Fredsavtalen
            </text>
            {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                    <motion.rect
                        x={740}
                        y={360 + i * 52}
                        width={660}
                        height={44}
                        rx={8}
                        initial={false}
                        animate={{ fill: i === 3 ? '#fde68a' : '#f5f5f4' }}
                    />
                    <text x={760} y={391 + i * 52} fontSize={26} fontWeight={800} fill={i === 3 ? MORK : '#57534e'}>
                        Punkt {i + 5}
                    </text>
                </g>
            ))}
            <AnimatePresence mode="wait">
                {beat >= 1 && (
                    <motion.g
                        key={beat >= 2 ? 'hvem' : 'tekst'}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ transformOrigin: '1070px 670px' }}
                    >
                        <rect x={720} y={570} width={700} height={210} rx={22} fill="#fff" stroke={BRITISK} strokeWidth={5} />
                        {(beat >= 2
                            ? ['Det betyr:', 'de hvite kolonistene', 'bestemmer selv']
                            : ['Stemmerett for svarte:', 'avgjøres ikke før', 'selvstyret er innført']
                        ).map((l, i) => (
                            <text
                                key={l}
                                x={1070}
                                y={630 + i * 56}
                                textAnchor="middle"
                                fontSize={i === 0 ? 38 : 34}
                                fontWeight={i === 0 ? 900 : 700}
                                fill={MORK}
                            >
                                {l}
                            </text>
                        ))}
                    </motion.g>
                )}
            </AnimatePresence>
        </motion.g>
    );
}

const TIDSLINJE = [
    { aar: '1910', linjer: ['Den sørafrikanske', 'union'], x: 260 },
    { aar: '1918', linjer: ['Afrikaner', 'Broederbond'], x: 620 },
    { aar: '1948', linjer: ['Nasjonalistpartiet', 'vinner valget'], x: 980 },
    { aar: '1948', linjer: ['Apartheid', 'atskilt ved lov'], x: 1340 },
];

/** Veien fra unionen til apartheid, som en tidslinje. */
function Etter({ beat }: { beat: number }) {
    return (
        <g>
            <line x1={120} y1={250} x2={1480} y2={250} stroke="#a8a29e" strokeWidth={8} strokeLinecap="round" />
            {TIDSLINJE.map((t, i) => {
                const vis = beat >= i;
                const naa = beat === i;
                return (
                    <motion.g
                        key={i}
                        initial={false}
                        animate={{ opacity: vis ? (naa ? 1 : 0.55) : 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <circle cx={t.x} cy={250} r={naa ? 22 : 16} fill={i === 3 ? BRITISK : MORK} stroke="#fff" strokeWidth={5} />
                        {i !== 3 && (
                            <text x={t.x} y={212} textAnchor="middle" fontSize={40} fontWeight={900} fill={MORK}>
                                {t.aar}
                            </text>
                        )}
                        {t.linjer.map((l, k) => (
                            <text
                                key={l}
                                x={t.x}
                                y={316 + k * 42}
                                textAnchor="middle"
                                fontSize={k === 0 ? 34 : 30}
                                fontWeight={k === 0 ? 900 : 700}
                                fill={i === 3 ? BRITISK : MORK}
                            >
                                {l}
                            </text>
                        ))}
                    </motion.g>
                );
            })}
            {/* Bildet under tidslinja: fire deler blir én stat, og så blir folk skilt. */}
            <AnimatePresence mode="wait">
                {beat <= 2 ? (
                    <motion.g key="union" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Union samlet={beat >= 0} />
                    </motion.g>
                ) : (
                    <motion.g key="skilt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Atskilt />
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

const DELER = [
    { navn: 'Transvaal', farge: BOER },
    { navn: 'Oranjefristaten', farge: '#a16207' },
    { navn: 'Kappkolonien', farge: BRITISK },
    { navn: 'Natal', farge: BRITISK },
];

function Union({ samlet }: { samlet: boolean }) {
    return (
        <g>
            {DELER.map((d, i) => (
                <motion.g
                    key={d.navn}
                    initial={{ x: (i - 1.5) * 90, opacity: 0 }}
                    animate={{ x: samlet ? 0 : (i - 1.5) * 90, opacity: 1 }}
                    transition={{ duration: 1.4, delay: i * 0.15 }}
                >
                    <rect x={310 + i * 250} y={500} width={230} height={130} rx={16} fill={d.farge} fillOpacity={0.85} />
                    <text x={425 + i * 250} y={575} textAnchor="middle" fontSize={i === 1 ? 24 : 30} fontWeight={900} fill="#fff">
                        {d.navn}
                    </text>
                </motion.g>
            ))}
            <motion.rect
                x={295}
                y={485}
                width={1010}
                height={160}
                rx={24}
                fill="none"
                stroke={MORK}
                strokeWidth={6}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            />
            <motion.text
                x={800}
                y={705}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill={MORK}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
            >
                Den sørafrikanske union, 1910
            </motion.text>
        </g>
    );
}

/** To grupper mennesker med en vegg imellom. */
function Atskilt() {
    return (
        <g>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <Figur key={`h${i}`} x={330 + (i % 3) * 90} y={560 + Math.floor(i / 3) * 110} farge="#64748b" s={1.2} />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <Figur key={`i${i}`} x={1090 + (i % 3) * 90} y={560 + Math.floor(i / 3) * 110} farge={UTENFOR} s={1.2} />
            ))}
            <motion.rect
                x={786}
                y={460}
                width={28}
                height={300}
                fill={MORK}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <text x={420} y={790} textAnchor="middle" fontSize={34} fontWeight={900} fill="#475569">
                hvite
            </text>
            <text x={1180} y={790} textAnchor="middle" fontSize={34} fontWeight={900} fill={UTENFOR}>
                ikke-hvite
            </text>
        </g>
    );
}
