import { motion } from 'framer-motion';
import { Baby, Coins, GraduationCap, HeartPulse, Hourglass, Sparkles, UserX, type LucideIcon } from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Grunnene til fallet. «tre»: de tre tingene Folkehelseinstituttet fant, ett kort per beat.
 * «tester»: fire forklaringer som forskerne testet, der hver får sin dom når stemmen
 * kommer til den. Fargen sier hvor mye den forklarer: grå = lite, gul = kanskje.
 */

type Modus = 'tre' | 'tester';

interface Kort {
    Ikon: LucideIcon;
    tittel: string;
    tekst: string;
    fraBeat: number;
    dom?: string;
    tone?: 'lite' | 'kanskje';
}

const TRE: Kort[] = [
    { Ikon: UserX, tittel: 'Flere får ikke barn', tekst: 'i det hele tatt', fraBeat: 1 },
    { Ikon: Hourglass, tittel: 'Første barn senere', tekst: 'folk venter lenger', fraBeat: 2 },
    { Ikon: Baby, tittel: 'Færre får et tredje barn', tekst: 'tre barn blir sjeldnere', fraBeat: 3 },
];

const TESTER: Kort[] = [
    { Ikon: GraduationCap, tittel: 'Utdanning', tekst: 'Fallet var omtrent like sterkt i alle utdanningsgrupper', fraBeat: 1, dom: 'mindre enn mange tror', tone: 'lite' },
    { Ikon: Coins, tittel: 'Penger', tekst: 'Krisen rammet ulikt, barnetallet falt likt. Usikkerhet kan bety noe', fraBeat: 2, dom: 'kanskje', tone: 'kanskje' },
    { Ikon: HeartPulse, tittel: 'Helse', tekst: 'Fallet var ikke større blant folk med dårlig helse', fraBeat: 3, dom: 'forklarer lite', tone: 'lite' },
    { Ikon: Sparkles, tittel: 'Verdier', tekst: 'Hva folk synes er viktig, har trolig endret seg', fraBeat: 4, dom: 'vanskelig å måle', tone: 'kanskje' },
];

const TONE = {
    lite: { bg: '#e2e8f0', tekst: '#475569' },
    kanskje: { bg: '#fef3c7', tekst: '#b45309' },
};

function TreKort({ k, beat }: { k: Kort; beat: number }) {
    const vis = beat >= k.fraBeat;
    return (
        <motion.div
            initial={false}
            animate={{ opacity: vis ? 1 : 0.25, y: vis ? 0 : 20, scale: beat === k.fraBeat ? 1.04 : 1 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-white shadow-2xl px-6 py-8 flex flex-col items-center text-center"
            style={{ width: 280, border: beat === k.fraBeat ? '5px solid #0d9488' : '5px solid transparent' }}
        >
            <k.Ikon size={88} className="text-teal-700 mb-4" strokeWidth={2.2} />
            <div className="text-3xl font-black text-slate-900 mb-2">{vis ? k.tittel : '?'}</div>
            <div className="text-xl font-semibold text-slate-500">{vis ? k.tekst : ''}</div>
        </motion.div>
    );
}

function TestKort({ k, beat }: { k: Kort; beat: number }) {
    const ferdig = beat >= k.fraBeat;
    const naa = beat === k.fraBeat;
    const tone = TONE[k.tone ?? 'lite'];
    return (
        <motion.div
            initial={false}
            animate={{ scale: naa ? 1.03 : 1, opacity: ferdig || beat === 0 ? 1 : 0.55 }}
            className="rounded-3xl bg-white shadow-xl px-5 py-4 flex items-center gap-5"
            style={{ border: naa ? '5px solid #0d9488' : '5px solid transparent', minHeight: 140 }}
        >
            <k.Ikon size={64} className="text-slate-700 shrink-0" strokeWidth={2.2} />
            <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-slate-900">{k.tittel}?</div>
                {ferdig && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xl font-semibold text-slate-600 leading-snug mt-1">
                        {k.tekst}
                    </motion.div>
                )}
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.6, rotate: -8 }}
                        animate={{ opacity: 1, scale: 1, rotate: -4 }}
                        transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 18 }}
                        className="inline-block mt-2 px-3 py-1 rounded-xl text-xl font-black whitespace-nowrap"
                        style={{ background: tone.bg, color: tone.tekst }}
                    >
                        {k.dom}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export function FodselstalletGrunner({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'tre';
    return (
        <div className="absolute inset-0 flex flex-col items-center" style={{ background: 'linear-gradient(180deg, #f0fdfa 0%, #e2e8f0 100%)' }}>
            <div className="mt-[4%] text-center">
                <div className="text-5xl font-black text-slate-900">
                    {modus === 'tre' ? 'Hvorfor færre barn?' : 'Hvorfor venter folk?'}
                </div>
                <div className="text-2xl font-bold text-slate-500 mt-2">
                    {modus === 'tre' ? 'Svaret fra et stort forskningsprosjekt ledet av Folkehelseinstituttet' : 'Fire forklaringer forskerne har testet'}
                </div>
            </div>
            {modus === 'tre' ? (
                <div className="flex gap-8 mt-[5%]">
                    {TRE.map((k) => (
                        <TreKort key={k.tittel} k={k} beat={beat} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-5 mt-[3%]" style={{ width: '94%' }}>
                    {TESTER.map((k) => (
                        <TestKort key={k.tittel} k={k} beat={beat} />
                    ))}
                </div>
            )}
        </div>
    );
}
