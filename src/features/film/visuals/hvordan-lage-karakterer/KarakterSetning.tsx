import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from './felles';

/**
 * Setninger som viser en person.
 * - flat: en flat setning mot en levende, med detaljene som lyser opp, og spørsmålene
 *   leseren sitter igjen med.
 * - direkte: direkte personskildring (fortelleren sier det rett ut) mot indirekte (vi
 *   forstår det gjennom replikker, handlinger, tanker og kroppsspråk).
 */

type Modus = 'flat' | 'direkte';

function Kort({
    synlig,
    tittel,
    farge,
    fokus,
    children,
}: {
    synlig: boolean;
    tittel: string;
    farge: string;
    fokus: boolean;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: synlig ? (fokus ? 1 : 0.55) : 0, y: synlig ? 0 : 24 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            className="rounded-3xl bg-white shadow-xl px-6 py-4 border-l-[10px]"
            style={{ borderColor: farge }}
        >
            <div
                className="text-xl font-black uppercase tracking-wider mb-2"
                style={{ color: farge }}
            >
                {tittel}
            </div>
            {children}
        </motion.div>
    );
}

function Lys({ på, children }: { på: boolean; children: React.ReactNode }) {
    return (
        <motion.span
            animate={{ backgroundColor: på ? '#fde68a' : 'rgba(253,230,138,0)' }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="rounded px-1"
        >
            {children}
        </motion.span>
    );
}

function Flat({ beat }: { beat: number }) {
    return (
        <div className="flex flex-col gap-4" style={{ width: 880 }}>
            <Kort synlig tittel="Flatt" farge="#94a3b8" fokus={beat === 0}>
                <p className="text-3xl leading-snug text-slate-700">
                    Elias var en vanlig gutt med brunt hår og vanlige klær.
                </p>
            </Kort>
            <Kort synlig={beat >= 1} tittel="Levende" farge="#dc2626" fokus={beat >= 1}>
                <p className="text-3xl leading-snug text-slate-900">
                    Elias trakk den <Lys på={beat >= 1}>falmede, røde hettegenseren</Lys> over
                    hodet. Han trommet urolig på urskiven til{' '}
                    <Lys på={beat >= 1}>den gamle klokka</Lys> på håndleddet, den som hadde stoppet
                    for flere år siden, men som han nektet å ta av seg.
                </p>
            </Kort>
            <div className="flex gap-6 justify-center" style={{ height: 76 }}>
                {['Hvorfor går ikke klokka?', 'Hvorfor er den så viktig?'].map((s, i) => (
                    <motion.div
                        key={s}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: beat >= 2 ? 1 : 0, scale: beat >= 2 ? 1 : 0.7 }}
                        transition={{ delay: i * 0.6, type: 'spring', stiffness: 220, damping: 16 }}
                        className="px-6 py-3 rounded-full bg-amber-400 text-slate-900 text-3xl font-black shadow-lg"
                    >
                        {s}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

const INDIREKTE = ['replikker', 'handlinger', 'tanker', 'kroppsspråk'];

function Direkte({ beat }: { beat: number }) {
    return (
        <div className="grid grid-cols-2 gap-8" style={{ width: 920 }}>
            <Kort synlig tittel="Direkte personskildring" farge="#2563eb" fokus={beat <= 1}>
                <p className="text-2xl text-slate-600 mb-4">Fortelleren sier det rett ut.</p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 1 ? 1 : 0 }}
                    className="text-4xl font-bold text-slate-900 leading-snug"
                >
                    «Elias var stille og forsiktig.»
                </motion.p>
            </Kort>
            <Kort
                synlig
                tittel="Indirekte personskildring"
                farge="#dc2626"
                fokus={beat === 0 || beat >= 2}
            >
                <p className="text-2xl text-slate-600 mb-4">Vi forstår det selv, gjennom:</p>
                <div className="grid grid-cols-2 gap-3">
                    {INDIREKTE.map((ord, i) => (
                        <motion.div
                            key={ord}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: beat >= 2 ? 1 : 0, y: beat >= 2 ? 0 : 12 }}
                            transition={{ delay: i * 0.4 }}
                            className="px-4 py-2 rounded-xl bg-red-50 text-red-800 text-2xl font-bold text-center"
                        >
                            {ord}
                        </motion.div>
                    ))}
                </div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 3 ? 1 : 0 }}
                    className="mt-4 text-3xl font-bold text-slate-900 leading-snug"
                >
                    Hettegenseren og klokka får oss til å lure.
                </motion.p>
            </Kort>
        </div>
    );
}

export function KarakterSetning({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'flat';
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-amber-50">
            <Flate>{modus === 'flat' ? <Flat beat={beat} /> : <Direkte beat={beat} />}</Flate>
        </div>
    );
}
