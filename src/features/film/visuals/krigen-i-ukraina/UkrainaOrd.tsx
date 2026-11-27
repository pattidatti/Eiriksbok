import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Ordene og forhandlingsbordet i Ukraina-filmen, på en flate på 1000x562.
 * «ord»: en russisk TV-skjerm med «spesiell militær operasjon», ordene som ble regnet som
 * falsk informasjon, og de to forklaringene side om side.
 * «fred»: forhandlingsbordet sett ovenfra. Det stopper, USA mekler, og de to vanskelige spørsmålene.
 */

type Modus = 'ord' | 'fred';

export function UkrainaOrd({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ord';
    return (
        <Flate bakgrunn={modus === 'ord' ? '#f1f5f9' : '#e7e5e4'}>
            {modus === 'ord' ? <Ord beat={beat} /> : <Fred beat={beat} />}
        </Flate>
    );
}

function Inn({
    children,
    forsinkelse = 0.3,
    className,
    style,
}: {
    children: ReactNode;
    forsinkelse?: number;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    );
}

function Ord({ beat }: { beat: number }) {
    const tv = beat <= 2;
    return (
        <div className="absolute inset-0">
            <AnimatePresence mode="wait">
                {tv ? (
                    <motion.div key="tv" exit={{ opacity: 0 }} className="absolute inset-0">
                        <div
                            className="absolute font-display font-black text-slate-900 text-center"
                            style={{ left: 0, right: 0, top: 26, fontSize: 34 }}
                        >
                            {beat === 0
                                ? 'En krig kjempes også med ord'
                                : 'Russiske myndigheter og medier'}
                        </div>
                        {/* TV-skjermen */}
                        <div
                            className="absolute rounded-2xl shadow-2xl"
                            style={{
                                left: beat >= 2 ? 40 : 200,
                                top: 100,
                                width: 560,
                                height: 330,
                                background: '#0f172a',
                                border: '14px solid #334155',
                                transition: 'left 0.8s ease',
                            }}
                        >
                            {beat === 0 && (
                                <Inn className="absolute inset-0 flex items-center justify-center gap-8">
                                    <span
                                        className="font-display font-black text-white"
                                        style={{ fontSize: 44 }}
                                    >
                                        våpen
                                    </span>
                                    <span
                                        className="font-display font-black text-slate-500"
                                        style={{ fontSize: 44 }}
                                    >
                                        +
                                    </span>
                                    <span
                                        className="font-display font-black text-yellow-300"
                                        style={{ fontSize: 44 }}
                                    >
                                        ord
                                    </span>
                                </Inn>
                            )}
                            {beat >= 1 && (
                                <Inn className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                                    <span
                                        className="font-bold text-slate-300"
                                        style={{ fontSize: 22 }}
                                    >
                                        Det myndighetene kaller krigen:
                                    </span>
                                    <span
                                        className="font-display font-black text-white mt-3"
                                        style={{ fontSize: 42, lineHeight: 1.1 }}
                                    >
                                        spesiell militær operasjon
                                    </span>
                                </Inn>
                            )}
                        </div>
                        {beat >= 2 && (
                            <Inn
                                forsinkelse={0.7}
                                className="absolute rounded-2xl bg-white shadow-xl px-6 py-4"
                                style={{ left: 630, top: 100, width: 330 }}
                            >
                                <div className="font-bold text-slate-700" style={{ fontSize: 20 }}>
                                    Russiske myndigheter: fra samme dag regnet som falsk
                                    informasjon:
                                </div>
                                {['angrep', 'invasjon', 'krig'].map((o, i) => (
                                    <Inn
                                        key={o}
                                        forsinkelse={1 + i * 0.4}
                                        className="flex items-center gap-4 mt-3"
                                    >
                                        <Kryss />
                                        <span
                                            className="font-display font-black text-slate-900"
                                            style={{ fontSize: 36 }}
                                        >
                                            {o}
                                        </span>
                                    </Inn>
                                ))}
                            </Inn>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="to"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0"
                    >
                        <div
                            className="absolute font-display font-black text-slate-900 text-center"
                            style={{ left: 0, right: 0, top: 26, fontSize: 34 }}
                        >
                            To fortellinger om samme krig
                        </div>
                        <Panel
                            x={50}
                            farge="#b91c1c"
                            avsender="Russland sier:"
                            tekst="Krigen er forsvar mot NATO, som Russland mener har kommet for nær grensen."
                            dempet={beat === 5}
                        />
                        {beat >= 4 && (
                            <Panel
                                x={520}
                                farge="#1d4ed8"
                                avsender="Ukraina og de aller fleste land:"
                                tekst="Et ulovlig angrep på et selvstendig land."
                                dempet={beat === 5}
                            />
                        )}
                        {beat === 5 && (
                            <Inn
                                forsinkelse={0.4}
                                className="absolute rounded-2xl bg-yellow-300 shadow-2xl px-6 py-4 text-center"
                                style={{ left: 150, top: 400, width: 700 }}
                            >
                                <div
                                    className="font-display font-black text-slate-900"
                                    style={{ fontSize: 34, lineHeight: 1.2 }}
                                >
                                    Hvem forteller dette, og hva vil de at jeg skal tro?
                                </div>
                            </Inn>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Panel({
    x,
    farge,
    avsender,
    tekst,
    dempet,
}: {
    x: number;
    farge: string;
    avsender: string;
    tekst: string;
    dempet: boolean;
}) {
    return (
        <Inn
            className="absolute rounded-2xl bg-white shadow-xl px-6 py-5"
            style={{
                left: x,
                top: 100,
                width: 430,
                borderTop: `10px solid ${farge}`,
                opacity: dempet ? 0.5 : 1,
                transition: 'opacity 0.6s',
            }}
        >
            <div className="font-display font-black" style={{ fontSize: 28, color: farge }}>
                {avsender}
            </div>
            <div
                className="font-display font-bold text-slate-900 mt-2"
                style={{ fontSize: 30, lineHeight: 1.2 }}
            >
                {tekst}
            </div>
        </Inn>
    );
}

function Kryss() {
    return (
        <svg width={40} height={40} viewBox="0 0 40 40">
            <g stroke="#dc2626" strokeWidth={7} strokeLinecap="round">
                <line x1={6} y1={6} x2={34} y2={34} />
                <line x1={34} y1={6} x2={6} y2={34} />
            </g>
        </svg>
    );
}

/** Forhandlingsbordet sett ovenfra, med stoler og navnelapper. */
function Fred({ beat }: { beat: number }) {
    const stoppet = beat === 1;
    const overskrift = [
        'Våren 2022: partene forhandler',
        'Forhandlingene stopper',
        '2025 og 2026: USA prøver å mekle',
        'De to vanskeligste spørsmålene',
    ][Math.min(beat, 3)];
    return (
        <div className="absolute inset-0">
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute font-display font-black text-slate-900 text-center"
                    style={{ left: 0, right: 0, top: 22, fontSize: 34 }}
                >
                    {overskrift}
                </motion.div>
            </AnimatePresence>
            <svg viewBox="0 0 1000 562" className="absolute inset-0 w-full h-full">
                {/* Bordet */}
                <ellipse
                    cx={500}
                    cy={320}
                    rx={250}
                    ry={110}
                    fill={stoppet ? '#a8a29e' : '#92400e'}
                    style={{ transition: 'fill 0.8s' }}
                />
                <ellipse
                    cx={500}
                    cy={312}
                    rx={238}
                    ry={100}
                    fill={stoppet ? '#d6d3d1' : '#b45309'}
                    style={{ transition: 'fill 0.8s' }}
                />
                {/* Stolene */}
                <Stol x={200} y={320} farge="#facc15" />
                <Stol x={800} y={320} farge="#dc2626" />
                {beat >= 2 && <Stol x={500} y={460} farge="#1d4ed8" />}
            </svg>
            <Lapp x={60} y={250} tekst="Ukraina" farge="#facc15" />
            <Lapp x={820} y={250} tekst="Russland" farge="#fecaca" />
            {beat >= 2 && <Lapp x={560} y={530} tekst="USA, mekler" farge="#bfdbfe" />}
            {beat === 1 && (
                <Inn
                    className="absolute rounded-2xl bg-white shadow-xl px-6 py-4 text-center"
                    style={{ left: 280, top: 250, width: 440 }}
                >
                    <div className="font-display font-black text-red-700" style={{ fontSize: 30 }}>
                        Stopp
                    </div>
                    <div
                        className="font-display font-bold text-slate-900"
                        style={{ fontSize: 24, lineHeight: 1.25 }}
                    >
                        Det ble kjent at russiske soldater hadde drept sivile i Butsja og Irpin.
                    </div>
                </Inn>
            )}
            {beat === 2 && (
                <Inn
                    className="absolute rounded-2xl bg-white/95 shadow-xl px-5 py-3 text-center"
                    style={{ left: 330, top: 280, width: 340 }}
                >
                    <div className="font-display font-bold text-slate-900" style={{ fontSize: 24 }}>
                        Mekle: hjelpe partene å bli enige
                    </div>
                </Inn>
            )}
            {beat >= 3 && (
                <div className="absolute flex gap-5" style={{ left: 250, top: 75, width: 500 }}>
                    <Sporsmal nr={1} tekst="Hvem skal eie landområdene Russland har tatt?" />
                    <Sporsmal nr={2} tekst="Hvilken rolle skal NATO ha?" forsinkelse={1} />
                </div>
            )}
        </div>
    );
}

function Stol({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <circle cx={x} cy={y} r={40} fill="#44403c" />
            <circle cx={x} cy={y} r={30} fill={farge} />
        </motion.g>
    );
}

function Lapp({ x, y, tekst, farge }: { x: number; y: number; tekst: string; farge: string }) {
    return (
        <Inn
            className="absolute rounded-xl shadow-lg px-4 py-1 font-display font-black text-slate-900"
            style={{ left: x, top: y - 70, background: farge, fontSize: 28 }}
        >
            {tekst}
        </Inn>
    );
}

function Sporsmal({
    nr,
    tekst,
    forsinkelse = 0.3,
}: {
    nr: number;
    tekst: string;
    forsinkelse?: number;
}) {
    return (
        <Inn
            forsinkelse={forsinkelse}
            className="rounded-2xl bg-white shadow-xl px-5 py-4"
            style={{ width: 240 }}
        >
            <div className="font-display font-black text-slate-400" style={{ fontSize: 26 }}>
                {nr}
            </div>
            <div
                className="font-display font-bold text-slate-900"
                style={{ fontSize: 24, lineHeight: 1.2 }}
            >
                {tekst}
            </div>
        </Inn>
    );
}
