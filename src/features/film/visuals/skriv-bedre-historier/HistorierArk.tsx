import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Et manusark på skrivebordet. Den svake setningen skrives først, så strykes den med rødt,
 * og den bedre versjonen skrives inn under med grønn blekk. Til slutt stemples grunnen.
 */

interface Rad {
    svak: string;
    god: string;
    svakFra: number;
    godFra: number;
}

interface Props {
    tittel: string;
    rader: Rad[];
    hvorfor?: string;
    hvorforFra?: number;
    notat?: { tekst: string; fraBeat: number };
    etiketter?: { svak: string; god: string };
}

const SKRIFT = { fontFamily: 'Georgia, "Times New Roman", serif' };
const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

function Etikett({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <div
            className="font-black uppercase"
            style={{ ...FONT, color: farge, fontSize: '0.95rem', letterSpacing: '0.08em' }}
        >
            {tekst}
        </div>
    );
}

export function HistorierArk({ beat, props }: VisualProps<Props>) {
    const { tittel, rader, hvorfor, hvorforFra = 99, notat, etiketter } = props;
    const storrelse = rader.length > 1 ? '1.9rem' : '2rem';
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #5b3a22 0%, #3b2414 100%)' }}
        >
            {/* Blyant på bordet */}
            <div
                className="absolute"
                style={{
                    right: '3%',
                    bottom: '12%',
                    width: 230,
                    height: 16,
                    borderRadius: 8,
                    background:
                        'linear-gradient(90deg, #f59e0b 0 85%, #fde68a 85% 93%, #1f2937 93%)',
                    transform: 'rotate(-28deg)',
                    boxShadow: '0 6px 10px rgba(0,0,0,0.35)',
                }}
            />
            {/* Arket */}
            <div
                className="absolute flex flex-col"
                style={{
                    left: '12%',
                    right: '17%',
                    top: '5%',
                    bottom: '5%',
                    background: '#fffdf5',
                    borderRadius: 6,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
                    padding: '1.4rem 2.2rem 1.2rem 3.4rem',
                    backgroundImage:
                        'linear-gradient(90deg, transparent 2.3rem, #fca5a5 2.3rem, #fca5a5 2.45rem, transparent 2.45rem)',
                }}
            >
                <div
                    className="font-black text-slate-800"
                    style={{
                        ...FONT,
                        fontSize: '2.2rem',
                        borderBottom: '3px solid #e2e8f0',
                        paddingBottom: '0.4rem',
                    }}
                >
                    {tittel}
                </div>
                <div className="flex flex-col justify-center flex-1" style={{ gap: '1.1rem' }}>
                    {rader.map((r, i) => {
                        if (beat < r.svakFra) return null;
                        const stroket = beat >= r.godFra;
                        return (
                            <div key={i} className="flex flex-col" style={{ gap: '0.35rem' }}>
                                <motion.div
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {etiketter && (
                                        <Etikett tekst={etiketter.svak} farge="#b91c1c" />
                                    )}
                                    <span
                                        style={{
                                            ...SKRIFT,
                                            fontSize: storrelse,
                                            lineHeight: 1.3,
                                            color: stroket ? '#64748b' : '#1e293b',
                                            textDecoration: stroket ? 'line-through' : 'none',
                                            textDecorationColor: '#dc2626',
                                            textDecorationThickness: '4px',
                                            whiteSpace: 'pre-line',
                                            transition: 'color 0.6s',
                                        }}
                                    >
                                        {r.svak}
                                    </span>
                                </motion.div>
                                {stroket && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.7 }}
                                        className="flex"
                                        style={{ gap: '0.7rem' }}
                                    >
                                        <span
                                            className="font-black"
                                            style={{
                                                ...FONT,
                                                color: '#0d9488',
                                                fontSize: storrelse,
                                            }}
                                        >
                                            ✓
                                        </span>
                                        <div>
                                            {etiketter && (
                                                <Etikett tekst={etiketter.god} farge="#0f766e" />
                                            )}
                                            <span
                                                style={{
                                                    ...SKRIFT,
                                                    fontSize: storrelse,
                                                    lineHeight: 1.3,
                                                    color: '#115e59',
                                                    whiteSpace: 'pre-line',
                                                }}
                                            >
                                                {r.god}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div style={{ minHeight: '3.2rem' }} className="flex justify-end items-end">
                    <AnimatePresence>
                        {hvorfor && beat >= hvorforFra && (
                            <motion.div
                                key="hvorfor"
                                initial={{ opacity: 0, scale: 1.6, rotate: -8 }}
                                animate={{ opacity: 1, scale: 1, rotate: -3 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 18,
                                    delay: 0.4,
                                }}
                                className="font-black uppercase"
                                style={{
                                    ...FONT,
                                    color: '#0f766e',
                                    border: '4px solid #0f766e',
                                    borderRadius: 10,
                                    padding: '0.2rem 1rem',
                                    fontSize: '1.5rem',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {hvorfor}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {/* Gul lapp på hjørnet av arket */}
            <AnimatePresence>
                {notat && beat >= notat.fraBeat && (
                    <motion.div
                        key="notat"
                        initial={{ opacity: 0, y: -20, rotate: 0 }}
                        animate={{ opacity: 1, y: 0, rotate: 4 }}
                        transition={{ duration: 0.6 }}
                        className="absolute font-black text-slate-800 text-center flex items-center justify-center"
                        style={{
                            ...FONT,
                            right: '2.5%',
                            top: '10%',
                            width: 190,
                            height: 170,
                            padding: '0.8rem',
                            background: '#fde047',
                            boxShadow: '0 10px 18px rgba(0,0,0,0.35)',
                            fontSize: '1.35rem',
                            lineHeight: 1.2,
                        }}
                    >
                        {notat.tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
