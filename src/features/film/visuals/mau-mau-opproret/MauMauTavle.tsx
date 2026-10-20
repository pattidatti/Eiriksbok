import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Check, Gavel, Lock, MoveRight, ShieldAlert, Truck, Users, X } from 'lucide-react';
import { TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Ordene i Mau Mau-opprøret, som kort på en tavle. «navn»: britenes navn mot kjempernes
 * eget. «veier»: de fredelige veiene som ble stengt, én etter én. «krig»: unntakstilstanden,
 * og hvorfor britene ikke ville kalle det krig. «unnskyldning»: saken i London og
 * beklagelsen i 2013, som ikke var en innrømmelse av skyld.
 */

type Modus = 'navn' | 'veier' | 'krig' | 'unnskyldning';

const PAPIR = '#f3ead7';
const BLEKK = '#1c1917';
const ROD = '#b91c1c';
const GRONN = '#15803d';

function Kort({
    children,
    fra = 'under',
    bredde,
    farge = '#fffdf7',
    kant = '#d6c7a6',
}: {
    children: ReactNode;
    fra?: 'under' | 'venstre' | 'hoyre';
    bredde?: number;
    farge?: string;
    kant?: string;
}) {
    const start = fra === 'under' ? { y: 30 } : { x: fra === 'venstre' ? -40 : 40 };
    return (
        <motion.div
            initial={{ opacity: 0, ...start }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 170, damping: 22 }}
            className="relative rounded-2xl shadow-xl px-7 py-5"
            style={{ width: bredde, background: farge, border: `3px solid ${kant}` }}
        >
            {children}
        </motion.div>
    );
}

/** Rødt stempel på skrå over et kort. */
function Stempel({ tekst, farge = ROD }: { tekst: string; farge?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -9 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 260, damping: 18 }}
            className="absolute right-4 bottom-3 px-3 py-1 rounded-md font-black tracking-wider text-xl whitespace-nowrap"
            style={{ color: farge, border: `4px solid ${farge}`, background: 'rgba(255,253,247,0.9)' }}
        >
            {tekst}
        </motion.div>
    );
}

function Liten({ children }: { children: ReactNode }) {
    return <div className="text-lg font-semibold text-stone-500 uppercase tracking-wider">{children}</div>;
}

function Stor({ children, farge = BLEKK }: { children: ReactNode; farge?: string }) {
    return (
        <div className="font-display font-black text-4xl leading-tight" style={{ color: farge }}>
            {children}
        </div>
    );
}

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-[6%] left-1/2 -translate-x-1/2 font-display font-black text-4xl whitespace-nowrap"
                style={{ color: BLEKK }}
            >
                {tekst}
            </motion.div>
        </AnimatePresence>
    );
}

function Navn({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift tekst="Hva skal kjemperne hete?" />
            <div className="absolute inset-x-0 top-[22%] flex justify-center items-start gap-10">
                <Kort fra="venstre" bredde={380}>
                    <Liten>Britenes navn</Liten>
                    <div className="font-display font-black text-6xl mt-2" style={{ color: ROD }}>
                        Mau Mau
                    </div>
                </Kort>
                {beat >= 1 && (
                    <Kort fra="hoyre" bredde={480}>
                        <Liten>Deres eget navn</Liten>
                        <Stor>Kenya Land and Freedom Army</Stor>
                        <div className="text-xl text-stone-600 mt-2">Kenyas land- og frihetshær</div>
                    </Kort>
                )}
            </div>
            {beat >= 2 && (
                <div className="absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-4">
                    <div className="flex gap-8">
                        {['JORD', 'FRIHET'].map((o, i) => (
                            <motion.div
                                key={o}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.6, type: 'spring', stiffness: 200, damping: 16 }}
                                className="px-8 py-3 rounded-2xl font-display font-black text-5xl text-white"
                                style={{ background: i === 0 ? '#92400e' : GRONN }}
                            >
                                {o}
                            </motion.div>
                        ))}
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                        className="text-2xl font-semibold text-stone-700 flex items-center gap-3"
                    >
                        <Users size={28} /> De fleste var kikuyuer, et av folkene i Kenya
                    </motion.div>
                </div>
            )}
        </>
    );
}

const VEIER = [
    { aar: '1921', tittel: 'En forening klager', stempel: 'FORBUDT 1922' },
    { aar: 'Andre verdenskrig', tittel: 'Kjemper for britene', stempel: 'INGEN JORD' },
    { aar: 'Partiet KAU', tittel: 'Makt uten vold', stempel: null },
];

function Veier({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift tekst="Tre fredelige veier" />
            <div className="absolute inset-x-0 top-[24%] flex justify-center gap-6">
                {VEIER.map((v, i) => (
                    <div key={v.aar} style={{ width: 290, height: 230 }}>
                        {beat >= i + 1 ? (
                            <Kort bredde={290}>
                                <Liten>{v.aar}</Liten>
                                <div className="font-display font-black text-3xl mt-1" style={{ color: BLEKK }}>
                                    {v.tittel}
                                </div>
                                {i === 2 && (
                                    <div className="text-xl text-stone-600 mt-2">ledet av Jomo Kenyatta</div>
                                )}
                                <div style={{ height: 70 }} />
                                {v.stempel && <Stempel tekst={v.stempel} />}
                            </Kort>
                        ) : (
                            <motion.div
                                animate={{ opacity: beat === 0 ? [0.5, 1, 0.5] : 0.6 }}
                                transition={{ duration: 2.4, repeat: Infinity }}
                                className="w-full h-full rounded-2xl flex items-center justify-center"
                                style={{ border: '3px dashed #c4b48f' }}
                            >
                                <MoveRight size={56} color="#b8a57e" />
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="absolute bottom-[12%] left-1/2 -translate-x-1/2 px-7 py-3 rounded-2xl text-white font-display font-black text-3xl whitespace-nowrap"
                    style={{ background: BLEKK }}
                >
                    Mange mister tålmodigheten
                </motion.div>
            )}
        </>
    );
}

const MAKT = [
    { ikon: Lock, tekst: 'arrestere' },
    { ikon: ShieldAlert, tekst: 'sperre inne' },
    { ikon: Truck, tekst: 'flytte med makt' },
];

function Krig({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <Kort bredde={620}>
                    <Liten>Oktober 1952</Liten>
                    <Stor>Høvdingen Waruhiu blir drept</Stor>
                    <div className="text-2xl text-stone-600 mt-2">Han samarbeidet med britene.</div>
                </Kort>
            </div>
        );
    }
    if (beat <= 2) {
        return (
            <>
                <div className="absolute inset-x-0 top-[12%] flex flex-col items-center">
                    <Liten>To uker senere</Liten>
                    <motion.div
                        initial={{ opacity: 0, scale: 1.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-display font-black text-6xl mt-1"
                        style={{ color: ROD }}
                    >
                        UNNTAKSTILSTAND
                    </motion.div>
                    <div className="text-2xl text-stone-700 mt-2">Vanlige lover settes til side</div>
                </div>
                {beat === 2 && (
                    <div className="absolute inset-x-0 top-[50%] flex justify-center gap-6">
                        {MAKT.map(({ ikon: Ikon, tekst }, i) => (
                            <motion.div
                                key={tekst}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.5 }}
                                className="rounded-2xl px-6 py-4 flex flex-col items-center gap-2 shadow-lg"
                                style={{ background: '#fffdf7', border: '3px solid #d6c7a6', width: 230 }}
                            >
                                <Ikon size={48} color={BLEKK} />
                                <div className="text-2xl font-bold" style={{ color: BLEKK }}>
                                    {tekst}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                {beat === 2 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.8, type: 'spring', stiffness: 240, damping: 18 }}
                        className="absolute bottom-[7%] left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 rounded-xl text-white font-black text-3xl whitespace-nowrap"
                        style={{ background: ROD }}
                    >
                        <Gavel size={30} /> uten rettssak
                    </motion.div>
                )}
            </>
        );
    }
    return (
        <>
            <Overskrift tekst="Hva skal det kalles?" />
            <div className="absolute inset-x-0 top-[22%] flex justify-center gap-10">
                <Kort fra="venstre" bredde={420} farge={beat >= 4 ? '#ece6da' : '#fffdf7'}>
                    <Liten>Hvis det er en krig</Liten>
                    <Stor>Krig</Stor>
                    <div className="text-2xl text-stone-700 mt-3">
                        Internasjonale regler for hvordan fanger skal behandles
                    </div>
                    <div style={{ height: 50 }} />
                    {beat >= 4 && <Stempel tekst="IKKE BRUKT" />}
                </Kort>
                {beat >= 4 && (
                    <Kort fra="hoyre" bredde={420} kant={ROD}>
                        <Liten>Britenes ord</Liten>
                        <Stor farge={ROD}>Nødsituasjon</Stor>
                        <div className="text-2xl text-stone-700 mt-3">Fiendene kalles</div>
                        <div className="font-display font-black text-4xl mt-1" style={{ color: ROD }}>
                            terrorister
                        </div>
                    </Kort>
                )}
            </div>
        </>
    );
}

function Unnskyldning({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <>
                <Overskrift tekst="Saken i London" />
                <div className="absolute inset-x-0 top-[26%] flex justify-center items-end gap-4">
                    {Array.from({ length: 4 }, (_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.3 }}
                        >
                            <Users size={84} color={BLEKK} strokeWidth={2.2} />
                        </motion.div>
                    ))}
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="absolute inset-x-0 top-[50%] text-center"
                >
                    <Stor>Fire kenyanere går til sak</Stor>
                    <div className="text-2xl text-stone-700 mt-2">på vegne av flere tusen andre</div>
                </motion.div>
            </>
        );
    }
    if (beat === 1) {
        return (
            <>
                <Overskrift tekst="Juni 2013" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Kort bredde={780}>
                        <Liten>Utenriksminister William Hague i parlamentet</Liten>
                        <div className="font-display font-black text-4xl leading-snug mt-3" style={{ color: BLEKK }}>
                            «Den britiske regjeringen beklager oppriktig at disse overgrepene skjedde»
                        </div>
                    </Kort>
                </div>
            </>
        );
    }
    if (beat === 2) {
        return (
            <>
                <Overskrift tekst="Erstatning" />
                <div className="absolute inset-0 flex items-center justify-center gap-10">
                    <Kort bredde={360}>
                        <div className="font-display font-black text-7xl tabular-nums" style={{ color: GRONN }}>
                            19,9
                        </div>
                        <div className="text-2xl font-bold text-stone-600">millioner pund til sammen</div>
                    </Kort>
                    <MoveRight size={56} color="#a8a29e" />
                    <Kort bredde={360}>
                        <div className="font-display font-black text-7xl tabular-nums" style={{ color: BLEKK }}>
                            <TelleTall verdi={5228} />
                        </div>
                        <div className="text-2xl font-bold text-stone-600">personer</div>
                    </Kort>
                </div>
            </>
        );
    }
    return (
        <>
            <Overskrift tekst="Er det en ekte unnskyldning?" />
            <div className="absolute inset-x-0 top-[26%] flex justify-center gap-10">
                <Kort fra="venstre" bredde={400} kant={GRONN}>
                    <div className="flex items-center gap-3">
                        <Check size={56} color={GRONN} strokeWidth={3} />
                        <Stor>Beklager</Stor>
                    </div>
                    <div className="text-2xl text-stone-700 mt-2">Innrømmer tortur og mishandling</div>
                </Kort>
                <Kort fra="hoyre" bredde={400} kant={ROD}>
                    <div className="flex items-center gap-3">
                        <X size={56} color={ROD} strokeWidth={3} />
                        <Stor>Skyldig?</Stor>
                    </div>
                    <div className="text-2xl text-stone-700 mt-2">Nekter for juridisk ansvar</div>
                </Kort>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="absolute bottom-[12%] left-1/2 -translate-x-1/2 flex items-center gap-3 text-2xl font-semibold text-stone-700 whitespace-nowrap"
            >
                <Ban size={28} /> Juridisk ansvar betyr skyldig etter loven
            </motion.div>
        </>
    );
}

/** Når bildet byttes helt ut. Innen samme bilde bygges kortene på. */
function nokkel(modus: Modus, beat: number) {
    if (modus === 'krig') return `krig-${beat === 0 ? 0 : beat <= 2 ? 1 : 3}`;
    if (modus === 'unnskyldning') return `unnskyldning-${beat}`;
    return modus;
}

export function MauMauTavle({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'navn';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: PAPIR }}>
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 20% 15%, #fff8e6 0, transparent 45%), radial-gradient(circle at 85% 90%, #e2d3b0 0, transparent 50%)',
                }}
            />
            <AnimatePresence mode="wait">
                <motion.div
                    key={nokkel(modus, beat)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                >
                    {modus === 'navn' && <Navn beat={beat} />}
                    {modus === 'veier' && <Veier beat={beat} />}
                    {modus === 'krig' && <Krig beat={beat} />}
                    {modus === 'unnskyldning' && <Unnskyldning beat={beat} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
