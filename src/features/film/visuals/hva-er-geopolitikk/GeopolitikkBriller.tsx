import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Anchor,
    ArrowRight,
    Car,
    CloudSun,
    Droplets,
    Fuel,
    MapPin,
    House,
    Mountain,
    Pickaxe,
    Scale,
    Smartphone,
    Trees,
    User,
    Users,
    Waves,
    X,
    Check,
    type LucideIcon,
} from 'lucide-react';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Brillene: kort og ikoner om hva geopolitikk er, i fire moduser.
 *
 * «hus»: geografi og makt (beat 0), hva geografi er (1), Kjellén og staten som vokser (2),
 * tre hus ved vei, skog og sjø (3), og husene som blir land (4).
 * «tre»: brillene og de tre tingene forskerne ser etter, én per beat.
 * «valg»: den gamle tenkemåten som en kjede (0-1), dårlig rykte (2), kjeden brytes (3) og to
 * like land som velger ulike veier (4).
 * «fire»: to måter å bruke ordet på, USA og Kina, klima (0-2), og de fire spørsmålene (3-4).
 */

type Modus = 'hus' | 'tre' | 'valg' | 'fire';

const inn = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 },
};

function Tittel({ children }: { children: ReactNode }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: 26 }}>
            <motion.div
                {...inn}
                className="font-display font-black text-slate-900 text-center"
                style={{ fontSize: 38 }}
            >
                {children}
            </motion.div>
        </div>
    );
}

function Brikke({
    ikon: Ikon,
    tekst,
    farge = '#2563eb',
    forsinkelse = 0,
}: {
    ikon: LucideIcon;
    tekst: string;
    farge?: string;
    forsinkelse?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse }}
            className="flex flex-col items-center gap-1"
        >
            <div
                className="rounded-2xl flex items-center justify-center shadow"
                style={{ width: 70, height: 70, background: farge }}
            >
                <Ikon size={40} color="#ffffff" />
            </div>
            <span className="font-bold text-slate-800" style={{ fontSize: 20 }}>
                {tekst}
            </span>
        </motion.div>
    );
}

function Boks({
    children,
    farge = '#ffffff',
    style,
}: {
    children: ReactNode;
    farge?: string;
    style?: React.CSSProperties;
}) {
    return (
        <motion.div
            {...inn}
            className="absolute rounded-3xl shadow-xl flex flex-col items-center justify-center text-center"
            style={{ background: farge, padding: '16px 22px', ...style }}
        >
            {children}
        </motion.div>
    );
}

// ---------- hus ----------

function Hus({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <motion.div key="geo" {...inn} className="absolute inset-0">
                <Tittel>Geopolitikk</Tittel>
                <div className="absolute inset-x-0 flex justify-center" style={{ top: 88 }}>
                    <span className="text-slate-500 font-semibold" style={{ fontSize: 22 }}>
                        Store norske leksikon: politikk og makt henger sammen med geografien
                    </span>
                </div>
                <Boks
                    farge="#dcfce7"
                    style={{ left: 70, top: 150, width: 380, height: beat >= 1 ? 330 : 150 }}
                >
                    <div
                        className="font-display font-black text-green-800"
                        style={{ fontSize: 40 }}
                    >
                        Geografi
                    </div>
                    {beat >= 1 && (
                        <div className="mt-2 text-slate-700 font-semibold" style={{ fontSize: 20 }}>
                            alt som har med jordas overflate å gjøre
                        </div>
                    )}
                    {beat >= 1 && (
                        <div className="grid grid-cols-3 gap-x-5 gap-y-3 mt-4">
                            <Brikke
                                ikon={Mountain}
                                tekst="fjell"
                                farge="#16a34a"
                                forsinkelse={0.2}
                            />
                            <Brikke
                                ikon={Droplets}
                                tekst="elver"
                                farge="#0891b2"
                                forsinkelse={0.4}
                            />
                            <Brikke ikon={Waves} tekst="hav" farge="#2563eb" forsinkelse={0.6} />
                            <Brikke
                                ikon={CloudSun}
                                tekst="klima"
                                farge="#f59e0b"
                                forsinkelse={0.8}
                            />
                            <Brikke
                                ikon={Pickaxe}
                                tekst="i bakken"
                                farge="#78716c"
                                forsinkelse={1}
                            />
                        </div>
                    )}
                </Boks>
                <div
                    className="absolute flex items-center justify-center"
                    style={{ left: 450, width: 100, top: 190 }}
                >
                    <ArrowRight size={64} color="#0f172a" />
                </div>
                <Boks farge="#fee2e2" style={{ left: 550, top: 150, width: 380, height: 150 }}>
                    <div className="font-display font-black text-red-800" style={{ fontSize: 40 }}>
                        Makt og politikk
                    </div>
                </Boks>
            </motion.div>
        );
    }
    if (beat === 2) {
        return (
            <motion.div key="kjellen" {...inn} className="absolute inset-0">
                <Tittel>Rudolf Kjellén fant opp ordet</Tittel>
                <Boks style={{ left: 80, top: 140, width: 380, height: 300 }}>
                    <User size={90} color="#334155" />
                    <div
                        className="font-display font-black text-slate-900 mt-2"
                        style={{ fontSize: 34 }}
                    >
                        Rudolf Kjellén
                    </div>
                    <div className="text-slate-600 font-semibold" style={{ fontSize: 24 }}>
                        svensk forsker
                    </div>
                </Boks>
                <div className="absolute" style={{ left: 560, top: 150, width: 360, height: 280 }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{ scale: [0.7, 1.05, 0.7] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            style={{
                                width: 220,
                                height: 180,
                                borderRadius: '45% 55% 50% 50%',
                                background: '#fca5a5',
                            }}
                        />
                    </div>
                    <div
                        className="absolute inset-0 flex items-center justify-center font-display font-black text-red-900"
                        style={{ fontSize: 34 }}
                    >
                        Staten
                    </div>
                </div>
                <div className="absolute inset-x-0 flex justify-center" style={{ top: 460 }}>
                    <span
                        className="font-bold text-slate-800 bg-white/90 rounded-2xl px-5 py-2 shadow"
                        style={{ fontSize: 26 }}
                    >
                        Han så staten nesten som et levende vesen: den vokser og trenger plass
                    </span>
                </div>
            </motion.div>
        );
    }
    const steder: { ikon: LucideIcon; tekst: string; farge: string }[] =
        beat === 3
            ? [
                  { ikon: Car, tekst: 'ved en stor vei', farge: '#64748b' },
                  { ikon: Trees, tekst: 'i en skog', farge: '#16a34a' },
                  { ikon: Waves, tekst: 'ved sjøen', farge: '#2563eb' },
              ]
            : [
                  { ikon: MapPin, tekst: 'Hvor ligger landet?', farge: '#dc2626' },
                  { ikon: Users, tekst: 'Hvem er naboen?', farge: '#7c3aed' },
                  { ikon: Pickaxe, tekst: 'Hva har det i bakken?', farge: '#78716c' },
              ];
    return (
        <motion.div key="hus" {...inn} className="absolute inset-0">
            <Tittel>
                {beat === 3 ? 'Hvor du bor, påvirker hverdagen' : 'Slik er det for land også'}
            </Tittel>
            {steder.map((s, i) => (
                <Boks
                    key={s.tekst}
                    style={{ left: 60 + i * 300, top: 120, width: 270, height: 260 }}
                >
                    <div className="flex items-end gap-2">
                        {beat === 3 ? (
                            <House size={80} color="#0f172a" />
                        ) : (
                            <div
                                style={{
                                    width: 90,
                                    height: 74,
                                    background: '#fde68a',
                                    border: '4px solid #0f172a',
                                    borderRadius: '30% 50% 40% 55%',
                                }}
                            />
                        )}
                        <s.ikon size={60} color={s.farge} />
                    </div>
                    <div className="font-bold text-slate-900 mt-3" style={{ fontSize: 28 }}>
                        {s.tekst}
                    </div>
                </Boks>
            ))}
            {beat >= 4 && (
                <div className="absolute inset-x-0 flex justify-center gap-6" style={{ top: 420 }}>
                    <Boks farge="#fee2e2" style={{ position: 'relative', padding: '12px 24px' }}>
                        <span className="font-bold text-red-900" style={{ fontSize: 28 }}>
                            Hva er landet redd for?
                        </span>
                    </Boks>
                    <Boks farge="#dcfce7" style={{ position: 'relative', padding: '12px 24px' }}>
                        <span className="font-bold text-green-900" style={{ fontSize: 28 }}>
                            Hva vil landet ha?
                        </span>
                    </Boks>
                </div>
            )}
        </motion.div>
    );
}

// ---------- tre og fire ----------

function Briller({ topp = 90 }: { topp?: number }) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: topp }}>
            <svg width={360} height={120} viewBox="0 0 360 120">
                <circle cx={95} cy={62} r={50} fill="#bfdbfe" stroke="#0f172a" strokeWidth={10} />
                <circle cx={265} cy={62} r={50} fill="#bfdbfe" stroke="#0f172a" strokeWidth={10} />
                <path d="M 145 56 Q 180 34 215 56" fill="none" stroke="#0f172a" strokeWidth={10} />
                <path d="M 45 56 L 6 40" stroke="#0f172a" strokeWidth={10} strokeLinecap="round" />
                <path
                    d="M 315 56 L 354 40"
                    stroke="#0f172a"
                    strokeWidth={10}
                    strokeLinecap="round"
                />
                <path
                    d="M 70 40 Q 85 30 100 34"
                    stroke="#ffffff"
                    strokeWidth={6}
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M 240 40 Q 255 30 270 34"
                    stroke="#ffffff"
                    strokeWidth={6}
                    fill="none"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

interface Linse {
    ikon: LucideIcon;
    tittel: string;
    sporsmal: string;
    farge: string;
}

const TRE: Linse[] = [
    { ikon: Users, tittel: 'Naboene', sporsmal: 'Venner eller fiender?', farge: '#7c3aed' },
    {
        ikon: Anchor,
        tittel: 'Havet',
        sporsmal: 'Isfrie havner? Sund og kanaler?',
        farge: '#2563eb',
    },
    {
        ikon: Fuel,
        tittel: 'Ressursene',
        sporsmal: 'Olje, gass, mineraler, fisk?',
        farge: '#ea580c',
    },
];

const FIRE: Linse[] = [
    { ikon: Users, tittel: 'Naboene', sporsmal: 'Hvem er naboene?', farge: '#7c3aed' },
    { ikon: Anchor, tittel: 'Havet', sporsmal: 'Hva skjer med havet?', farge: '#2563eb' },
    { ikon: Fuel, tittel: 'Ressursene', sporsmal: 'Hvilke ressurser?', farge: '#ea580c' },
    { ikon: Scale, tittel: 'Størrelsen', sporsmal: 'Store eller små land?', farge: '#0f766e' },
];

function Linsekort({ l, aktiv, bredde }: { l: Linse; aktiv: boolean; bredde: number }) {
    return (
        <motion.div
            animate={{ opacity: aktiv ? 1 : 0.35, scale: aktiv ? 1 : 0.94 }}
            className="rounded-3xl shadow-xl flex flex-col items-center text-center"
            style={{
                width: bredde,
                padding: '18px 14px',
                background: aktiv ? '#ffffff' : '#e2e8f0',
            }}
        >
            <div
                className="rounded-full flex items-center justify-center"
                style={{
                    width: 96,
                    height: 96,
                    background: aktiv ? l.farge : '#94a3b8',
                    border: '6px solid #0f172a',
                }}
            >
                {aktiv ? (
                    <l.ikon size={52} color="#ffffff" />
                ) : (
                    <span className="font-black text-white" style={{ fontSize: 46 }}>
                        ?
                    </span>
                )}
            </div>
            {aktiv && (
                <>
                    <div
                        className="font-display font-black text-slate-900 mt-3"
                        style={{ fontSize: 30 }}
                    >
                        {l.tittel}
                    </div>
                    <div className="font-semibold text-slate-700 mt-1" style={{ fontSize: 22 }}>
                        {l.sporsmal}
                    </div>
                </>
            )}
        </motion.div>
    );
}

function Tre({ beat }: { beat: number }) {
    return (
        <div className="absolute inset-0">
            <Tittel>Geopolitiske briller: tre ting</Tittel>
            <Briller />
            <div className="absolute inset-x-0 flex justify-center gap-8" style={{ top: 240 }}>
                {TRE.map((l, i) => (
                    <Linsekort key={l.tittel} l={l} aktiv={beat >= i + 1} bredde={270} />
                ))}
            </div>
        </div>
    );
}

function Fire({ beat }: { beat: number }) {
    if (beat <= 2) {
        const chips: { tekst: string; farge: string; fra: number }[] = [
            { tekst: 'Løst: all politikk mellom land', farge: '#e2e8f0', fra: 0 },
            { tekst: 'Presist: geografi og makt', farge: '#dbeafe', fra: 1 },
            { tekst: 'USA og Kina i Asia', farge: '#fee2e2', fra: 1 },
            {
                tekst: 'Klimaendringer: når naturen endrer seg, kan makten endre seg',
                farge: '#dcfce7',
                fra: 2,
            },
        ];
        return (
            <motion.div key="ord" {...inn} className="absolute inset-0">
                <Tittel>Ordet geopolitikk i dag</Tittel>
                <div
                    className="absolute flex flex-col items-center justify-center"
                    style={{ left: 70, top: 120, width: 230, height: 380 }}
                >
                    <Smartphone size={210} color="#0f172a" strokeWidth={1.3} />
                    <div className="font-bold text-slate-700 mt-2" style={{ fontSize: 24 }}>
                        Nyhetene
                    </div>
                </div>
                <div
                    className="absolute flex flex-col gap-4"
                    style={{ left: 340, top: 130, width: 600 }}
                >
                    {chips
                        .filter((c) => beat >= c.fra)
                        .map((c) => (
                            <motion.div
                                key={c.tekst}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-2xl shadow font-bold text-slate-900"
                                style={{ background: c.farge, padding: '14px 22px', fontSize: 28 }}
                            >
                                {c.tekst}
                            </motion.div>
                        ))}
                </div>
            </motion.div>
        );
    }
    return (
        <motion.div key="linser" {...inn} className="absolute inset-0">
            <Tittel>Ta på deg brillene</Tittel>
            <div className="absolute inset-x-0 flex justify-center" style={{ top: 86 }}>
                <span className="font-semibold text-slate-600" style={{ fontSize: 24 }}>
                    En konflikt, et sund eller en grense i nyhetene?
                </span>
            </div>
            <Briller topp={120} />
            <div className="absolute inset-x-0 flex justify-center gap-5" style={{ top: 260 }}>
                {FIRE.map((l, i) => (
                    <Linsekort
                        key={l.tittel}
                        l={l}
                        aktiv={beat === 3 ? i < 2 : true}
                        bredde={215}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ---------- valg ----------

function Ledd({ tekst, farge, ikon: Ikon }: { tekst: string; farge: string; ikon?: LucideIcon }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl shadow-xl flex items-center gap-3 font-display font-black"
            style={{
                background: farge,
                padding: '14px 16px',
                fontSize: 23,
                color: '#0f172a',
                whiteSpace: 'nowrap',
            }}
        >
            {Ikon && <Ikon size={42} />}
            <span>{tekst}</span>
        </motion.div>
    );
}

function Veier() {
    // To like land med like naboer. Fra hvert land går en vei som deler seg ulikt.
    const land = (x: number, vei: string, farge: string) => (
        <g>
            <rect
                x={x - 70}
                y={220}
                width={140}
                height={110}
                rx={30}
                fill="#fde68a"
                stroke="#0f172a"
                strokeWidth={6}
            />
            <rect x={x - 150} y={240} width={60} height={70} rx={18} fill="#cbd5e1" />
            <rect x={x + 90} y={240} width={60} height={70} rx={18} fill="#cbd5e1" />
            <motion.path
                d={vei}
                fill="none"
                stroke={farge}
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: 0.4 }}
            />
        </g>
    );
    return (
        <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
            {land(260, 'M 260 335 L 260 400 Q 260 450 160 500', '#2563eb')}
            {land(740, 'M 740 335 L 740 400 Q 740 450 840 500', '#ea580c')}
            <text x={260} y={210} textAnchor="middle" fontSize={26} fontWeight={800} fill="#0f172a">
                Land 1
            </text>
            <text x={740} y={210} textAnchor="middle" fontSize={26} fontWeight={800} fill="#0f172a">
                Land 2
            </text>
            <text x={500} y={290} textAnchor="middle" fontSize={22} fontWeight={700} fill="#475569">
                samme type naboer
            </text>
            <text x={130} y={540} textAnchor="middle" fontSize={24} fontWeight={800} fill="#1d4ed8">
                én vei
            </text>
            <text x={870} y={540} textAnchor="middle" fontSize={24} fontWeight={800} fill="#c2410c">
                en helt annen vei
            </text>
        </svg>
    );
}

function Valg({ beat }: { beat: number }) {
    if (beat <= 2) {
        return (
            <motion.div key="kjede" {...inn} className="absolute inset-0">
                <Tittel>Den gamle geopolitikken</Tittel>
                <div
                    className="absolute inset-x-0 flex justify-center items-center gap-3"
                    style={{ top: 120 }}
                >
                    <Ledd tekst="Geografien" farge="#dcfce7" ikon={Mountain} />
                    <ArrowRight size={52} />
                    <Ledd tekst="bestemmer alt" farge="#fef3c7" />
                    {beat >= 1 && <ArrowRight size={52} />}
                    {beat >= 1 && <Ledd tekst="krig og erobring virker naturlig" farge="#fecaca" />}
                </div>
                {beat >= 2 && (
                    <>
                        <div
                            className="absolute inset-x-0 flex justify-center"
                            style={{ top: 280 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 1.4, rotate: -8 }}
                                animate={{ opacity: 1, scale: 1, rotate: -4 }}
                                className="font-display font-black text-red-700 rounded-2xl"
                                style={{
                                    fontSize: 38,
                                    border: '6px solid #b91c1c',
                                    padding: '6px 22px',
                                    background: 'rgba(255,255,255,0.9)',
                                }}
                            >
                                Dårlig rykte etter nazistene
                            </motion.div>
                        </div>
                        <div
                            className="absolute inset-x-0 flex justify-center gap-4"
                            style={{ top: 420 }}
                        >
                            <span
                                className="font-bold text-slate-700"
                                style={{ fontSize: 24, alignSelf: 'center' }}
                            >
                                Rester finnes ennå:
                            </span>
                            <span
                                className="rounded-2xl bg-white shadow font-bold px-4 py-2"
                                style={{ fontSize: 24 }}
                            >
                                Russland
                            </span>
                            <span
                                className="rounded-2xl bg-white shadow font-bold px-4 py-2"
                                style={{ fontSize: 24 }}
                            >
                                noe av sikkerhetstenkningen i USA
                            </span>
                        </div>
                    </>
                )}
            </motion.div>
        );
    }
    if (beat === 3) {
        return (
            <motion.div key="laerdom" {...inn} className="absolute inset-0">
                <Tittel>Lærdommen</Tittel>
                <div className="absolute flex flex-col gap-5" style={{ left: 50, top: 150 }}>
                    <div className="flex items-center gap-4">
                        <Ledd tekst="Geografien forklarer mye" farge="#dcfce7" ikon={Mountain} />
                        <Check size={60} color="#16a34a" strokeWidth={4} />
                    </div>
                    <div className="flex items-center gap-4">
                        <Ledd
                            tekst="Gammel tanke: geografien bestemmer alt"
                            farge="#e2e8f0"
                            ikon={Mountain}
                        />
                        <X size={60} color="#dc2626" strokeWidth={4} />
                    </div>
                </div>
                <Boks farge="#0f172a" style={{ left: 690, top: 140, width: 260, height: 260 }}>
                    <Users size={90} color="#ffffff" />
                    <div
                        className="font-display font-black text-white mt-3"
                        style={{ fontSize: 30 }}
                    >
                        Mennesker tar valgene
                    </div>
                </Boks>
            </motion.div>
        );
    }
    return (
        <motion.div key="veier" {...inn} className="absolute inset-0">
            <Tittel>Samme naboer, ulike valg</Tittel>
            <Veier />
        </motion.div>
    );
}

export function GeopolitikkBriller({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = (['hus', 'tre', 'valg', 'fire'] as const).includes(props?.modus as Modus)
        ? (props?.modus as Modus)
        : 'tre';
    return (
        <Flate bakgrunn="linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)">
            <AnimatePresence mode="wait">
                {modus === 'hus' && (
                    <Hus key={`hus-${beat <= 1 ? 0 : beat === 2 ? 2 : 3}`} beat={beat} />
                )}
                {modus === 'tre' && <Tre key="tre" beat={beat} />}
                {modus === 'valg' && (
                    <Valg key={`valg-${Math.min(beat, 3) >= 3 ? beat : 0}`} beat={beat} />
                )}
                {modus === 'fire' && <Fire key={`fire-${beat <= 2 ? 0 : 1}`} beat={beat} />}
            </AnimatePresence>
        </Flate>
    );
}
