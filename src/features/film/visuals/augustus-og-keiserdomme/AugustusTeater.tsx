import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Slutten: en scene med laurbærkrans i lyset, Augustus' siste ord, teppet som går ned, og
 * til slutt måneden som fikk navnet hans.
 */

const REPLIKK: (string[] | null)[] = [
    null,
    ['«Har jeg spilt rollen min godt', 'i livets komedie?»'],
    ['«Klapp da,', 'for stykket er over.»'],
    ['Et teater', 'som holdt verden sammen'],
    null,
];

export function AugustusTeater({ beat }: VisualProps) {
    const teppeNede = beat >= 2;
    const linjer = REPLIKK[Math.min(beat, REPLIKK.length - 1)];
    return (
        <Flate bakgrunn="#120c0a">
            {/* Bakveggen og scenegulvet */}
            <div
                className="absolute"
                style={{
                    left: 120,
                    right: 120,
                    top: 40,
                    height: 400,
                    background: '#2a1d17',
                    borderRadius: 8,
                }}
            />
            <div
                className="absolute"
                style={{
                    left: 60,
                    right: 60,
                    top: 430,
                    height: 100,
                    background: '#5c3d24',
                    clipPath: 'polygon(6% 0, 94% 0, 100% 100%, 0 100%)',
                }}
            />
            {/* Lyskjegla */}
            <motion.div
                className="absolute"
                style={{
                    left: 330,
                    width: 340,
                    top: 0,
                    height: 500,
                    background:
                        'linear-gradient(to bottom, rgba(254,243,199,0.05), rgba(254,243,199,0.35))',
                    clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
                }}
                animate={{ opacity: teppeNede ? 0 : 1 }}
                transition={{ duration: 1 }}
            />
            {/* Laurbærkransen på en pidestall */}
            <motion.svg
                viewBox="-120 -90 240 220"
                className="absolute"
                style={{ left: 380, top: 220, width: 240, height: 220 }}
                animate={{ opacity: teppeNede ? 0 : 1 }}
            >
                {[-1, 1].map((s) =>
                    [0, 1, 2, 3, 4, 5].map((i) => {
                        const a = Math.PI * (0.1 + i * 0.14);
                        const x = s * Math.cos(a) * 70;
                        const y = -Math.sin(a) * 60 + 20;
                        return (
                            <ellipse
                                key={`${s}${i}`}
                                cx={x}
                                cy={y}
                                rx={24}
                                ry={10}
                                fill="#65a30d"
                                transform={`rotate(${s * (20 + i * 22)} ${x} ${y})`}
                            />
                        );
                    })
                )}
                <rect x={-50} y={50} width={100} height={80} fill="#d6d3d1" />
            </motion.svg>

            {/* Teppet: to røde halvdeler som går sammen */}
            {[-1, 1].map((s) => (
                <motion.div
                    key={s}
                    className="absolute"
                    style={{
                        top: 0,
                        bottom: 0,
                        width: 520,
                        [s < 0 ? 'left' : 'right']: 0,
                        background:
                            'repeating-linear-gradient(90deg, #7f1d1d 0px, #991b1b 30px, #7f1d1d 60px)',
                        boxShadow: '0 0 40px rgba(0,0,0,0.6)',
                    }}
                    initial={false}
                    animate={{ x: teppeNede ? 0 : s * 400 }}
                    transition={{ duration: 2.2, ease: 'easeInOut' }}
                />
            ))}

            {/* Øverst: sted og dato */}
            <AnimatePresence>
                {beat <= 1 && (
                    <motion.div
                        key="dato"
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 60 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="font-black text-amber-100" style={{ fontSize: 40 }}>
                            Nola, 19. august år 14
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Replikkene */}
            <div
                className="absolute inset-x-0 flex justify-center"
                style={{ top: beat === 1 ? 130 : 190 }}
            >
                <AnimatePresence mode="wait">
                    {linjer && (
                        <motion.div
                            key={beat}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: beat === 3 ? 0.4 : 0.2, duration: 0.8 }}
                            className="text-center font-black"
                            style={{
                                fontSize: 50,
                                lineHeight: 1.2,
                                color: '#fef3c7',
                                fontFamily: 'Georgia, serif',
                                textShadow: '0 3px 12px rgba(0,0,0,0.8)',
                            }}
                        >
                            {linjer.map((l) => (
                                <div key={l}>{l}</div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Måneden */}
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.div
                        key="maned"
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: 110 }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                    >
                        <div className="flex items-center" style={{ gap: 26 }}>
                            <Kalender navn="SEXTILIS" under="den sjette" gammel />
                            <div className="font-black text-amber-200" style={{ fontSize: 60 }}>
                                →
                            </div>
                            <Kalender navn="AUGUST" under="etter Augustus" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Flate>
    );
}

function Kalender({ navn, under, gammel }: { navn: string; under: string; gammel?: boolean }) {
    return (
        <div className="flex items-center" style={{ gap: 12 }}>
            <div
                className="rounded-2xl bg-white shadow-2xl overflow-hidden text-center"
                style={{ width: 280 }}
            >
                <div
                    className="font-black text-white"
                    style={{
                        background: gammel ? '#57534e' : '#b91c1c',
                        fontSize: 34,
                        padding: '10px 0',
                    }}
                >
                    {navn}
                </div>
                <div
                    className="font-bold text-slate-700"
                    style={{ fontSize: 28, padding: '22px 0' }}
                >
                    {under}
                </div>
            </div>
            {gammel && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 14 }}
                    className="rounded-full bg-red-600 flex items-center justify-center text-white font-black"
                    style={{ width: 64, height: 64, fontSize: 40 }}
                >
                    ✕
                </motion.div>
            )}
        </div>
    );
}
