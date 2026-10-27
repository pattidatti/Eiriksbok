import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Flat mot progressiv skatt med tre tenkte personer. Lønnen er en søyle, skatten er den røde
 * toppen. Med flat skatt er toppen like stor del av hver søyle. Med progressiv skatt vokser
 * delen med lønnen, mens summen av skatt (potten til høyre) er den samme.
 * Høydene er ikke målestokk.
 */

const BUNN = 740;

const FOLK = [
    { x: 260, navn: 'Butikkmedarbeider', lonn: 130, flat: 0.3, prog: 0.1, farge: '#0d9488' },
    { x: 620, navn: 'Middels lønn', lonn: 250, flat: 0.3, prog: 0.25, farge: '#2563eb' },
    { x: 980, navn: 'Direktør', lonn: 500, flat: 0.3, prog: 0.375, farge: '#7c3aed' },
];

const BREDDE = 170;

export function SkattFlat({ beat }: VisualProps) {
    const prog = beat >= 3;
    const visSkatt = beat >= 1;
    const tittel = ['Tre personer, ulik lønn', 'Flat skatt: samme del for alle', 'Like stor del av lønnen', 'Progressiv skatt', 'Mer lønn, større del'][
        Math.min(beat, 4)
    ];
    const sum = FOLK.reduce((s, f) => s + f.lonn * (prog ? f.prog : f.flat), 0);
    return (
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full bg-slate-50">
            <AnimatePresence mode="wait">
                <motion.text
                    key={tittel}
                    x={800}
                    y={90}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={800}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {tittel}
                </motion.text>
            </AnimatePresence>
            <line x1={120} x2={1180} y1={BUNN} y2={BUNN} stroke="#334155" strokeWidth={5} />
            {FOLK.map((f, i) => {
                const andel = prog ? f.prog : f.flat;
                const skatt = f.lonn * andel;
                const topp = BUNN - f.lonn;
                const lys = beat === 0 ? i === 2 : beat === 2 ? i !== 1 : true;
                const etikett = !visSkatt
                    ? ''
                    : !prog
                      ? 'samme del'
                      : i === 0
                        ? 'liten del'
                        : i === 1
                          ? 'større del'
                          : 'størst del';
                return (
                    <motion.g key={f.navn} animate={{ opacity: lys ? 1 : 0.35 }} transition={{ duration: 0.5 }}>
                        {/* Personen */}
                        <circle cx={f.x - 140} cy={BUNN - 150} r={30} fill="#e8b48c" />
                        <rect x={f.x - 170} y={BUNN - 115} width={60} height={115} rx={28} fill={f.farge} />
                        {/* Lønna */}
                        <rect x={f.x - BREDDE / 2 + 20} y={topp} width={BREDDE} height={f.lonn} rx={12} fill="#cbd5e1" />
                        <motion.rect
                            x={f.x - BREDDE / 2 + 20}
                            y={topp}
                            width={BREDDE}
                            rx={12}
                            fill="#dc2626"
                            initial={{ height: 0 }}
                            animate={{ height: visSkatt ? skatt : 0 }}
                            transition={{ duration: 1 }}
                        />
                        <text x={f.x - 40} y={BUNN + 50} textAnchor="middle" fontSize={32} fontWeight={700} fill="#1e293b">
                            {f.navn}
                        </text>
                        {etikett && (
                            <motion.text
                                key={etikett}
                                x={f.x + 20}
                                y={topp - 22}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={800}
                                fill="#b91c1c"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                {etikett}
                            </motion.text>
                        )}
                    </motion.g>
                );
            })}
            {beat === 1 && (
                <motion.text
                    x={1000}
                    y={BUNN - 520 - 70}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={800}
                    fill="#5b21b6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    flest kroner
                </motion.text>
            )}
            {beat === 4 && (
                <motion.text
                    x={1000}
                    y={BUNN - 520 - 70}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={800}
                    fill="#5b21b6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    flest kroner og størst del
                </motion.text>
            )}
            {/* Potten: skatten til sammen */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: visSkatt ? 1 : 0 }} transition={{ duration: 0.6 }}>
                <text x={1390} y={330} textAnchor="middle" fontSize={32} fontWeight={800} fill="#0f172a">
                    Fellesskapet
                </text>
                <rect x={1300} y={BUNN - 340} width={180} height={340} rx={16} fill="none" stroke="#94a3b8" strokeWidth={4} />
                <motion.rect
                    x={1300}
                    width={180}
                    rx={16}
                    fill="#dc2626"
                    initial={{ y: BUNN, height: 0 }}
                    animate={{ y: BUNN - sum, height: sum }}
                    transition={{ duration: 1 }}
                />
                {prog && (
                    <motion.text
                        x={1390}
                        y={BUNN + 50}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#0f766e"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        like mye til sammen
                    </motion.text>
                )}
            </motion.g>
        </svg>
    );
}
