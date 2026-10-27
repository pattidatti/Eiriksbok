import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Landene som dominobrikker på et bord. Tre moduser:
 * - allianser: brikkene samler seg i to lag på en vippe som står i balanse. Til slutt velter
 *   en liten brikke i midten, og alle de andre velter med.
 * - juli: rekka står klar. Tyskland lover støtte, Serbia får ultimatum, og Østerrike-Ungarn
 *   velter mot Serbia.
 * - kjede: brikkene velter én etter én, med datoen over, til hele rekka ligger.
 * Merkelappene er DOM over lerretet, plassert med kameraets projeksjon.
 */

type Modus = 'allianser' | 'juli' | 'kjede';

const BLA = '#2563eb';
const ROD = '#dc2626';
const NOYTRAL = '#a8a29e';
const GRA = '#94a3b8';

const H = 3;
const B = 0.5;
const D = 1.7;
const AVSTAND = 2.3;
/** Vinkelen en brikke får når den lener seg mot den neste. */
const LENER = Math.asin((AVSTAND - B) / H);

interface Brikke {
    id: string;
    navn: string;
    farge: string;
}

const BRIKKER: Brikke[] = [
    { id: 'ou', navn: 'Østerrike-Ungarn', farge: ROD },
    { id: 'serbia', navn: 'Serbia', farge: NOYTRAL },
    { id: 'russland', navn: 'Russland', farge: BLA },
    { id: 'tyskland', navn: 'Tyskland', farge: ROD },
    { id: 'frankrike', navn: 'Frankrike', farge: BLA },
    { id: 'belgia', navn: 'Belgia', farge: NOYTRAL },
    { id: 'storbritannia', navn: 'Storbritannia', farge: BLA },
    { id: 'italia', navn: 'Italia', farge: ROD },
    { id: 'krangel', navn: 'En liten krangel', farge: '#f59e0b' },
];

/** Plassen i rekka i juli og kjeden (Italia og krangelen er ikke med). */
const REKKE = ['ou', 'serbia', 'russland', 'tyskland', 'frankrike', 'belgia', 'storbritannia'];
const rekkeX = (id: string) => (REKKE.indexOf(id) - 3) * AVSTAND;

/** Når hver brikke velter i kjeden, og datoen som står over. */
const VELTER: Record<string, { beat: number; dato: string }> = {
    ou: { beat: 0, dato: '28. juli' },
    serbia: { beat: 0, dato: '28. juli' },
    russland: { beat: 1, dato: 'mobiliserer' },
    tyskland: { beat: 2, dato: '1. august' },
    frankrike: { beat: 3, dato: '3. august' },
    belgia: { beat: 5, dato: '4. august' },
    storbritannia: { beat: 5, dato: '4. august' },
};

interface Mal {
    x: number;
    z: number;
    y: number;
    /** Helling rundt z-aksen. Negativ = velter mot +x. */
    vipp: number;
    farge: string;
    synlig: boolean;
    skala: number;
}

const VIPPE_Y = 0.6;

function mal(modus: Modus, beat: number, b: Brikke): Mal {
    if (modus === 'allianser') {
        const lag: Record<string, { x: number; side: -1 | 1 }> = {
            storbritannia: { x: -8.8, side: -1 },
            frankrike: { x: -6.2, side: -1 },
            russland: { x: -3.6, side: -1 },
            tyskland: { x: 3.6, side: 1 },
            ou: { x: 6.2, side: 1 },
            italia: { x: 8.8, side: 1 },
        };
        if (b.id === 'krangel') {
            return {
                x: 0,
                z: 0,
                y: VIPPE_Y,
                vipp: beat >= 4 ? -1.45 : 0,
                farge: b.farge,
                synlig: beat >= 4,
                skala: 0.6,
            };
        }
        const l = lag[b.id];
        if (!l) return { x: 0, z: 0, y: 0, vipp: 0, farge: GRA, synlig: false, skala: 1 };
        const iLag = (beat >= 1 && l.side === -1) || (beat >= 2 && l.side === 1);
        // Før lagene finnes, står brikkene spredt og grå.
        const spredt: Record<string, number> = {
            storbritannia: -3.6,
            frankrike: -8.8,
            russland: -6.2,
            tyskland: 8.8,
            ou: 3.6,
            italia: 6.2,
        };
        const x = iLag ? l.x : spredt[b.id];
        // Til slutt: krangelen i midten velter, og lagene velter utover.
        const vipp = beat >= 4 ? -l.side * (Math.abs(l.x) > 8 ? 1.45 : LENER) : 0;
        return {
            x,
            z: 0,
            y: VIPPE_Y,
            vipp,
            farge: iLag ? b.farge : GRA,
            synlig: true,
            skala: 1,
        };
    }
    if (!REKKE.includes(b.id)) return { x: 0, z: 0, y: 0, vipp: 0, farge: GRA, synlig: false, skala: 1 };
    const x = rekkeX(b.id);
    let vipp = 0;
    if (modus === 'juli') {
        if (b.id === 'serbia' && beat === 5) vipp = 0.08;
        if (b.id === 'ou' && beat >= 6) vipp = -LENER;
        if (b.id === 'serbia' && beat >= 6) vipp = -0.12;
    } else {
        const v = VELTER[b.id];
        if (v.beat <= beat) vipp = b.id === 'storbritannia' ? -1.45 : -LENER;
        // Belgia vakler idet planen nevnes.
        if (b.id === 'belgia' && beat === 4) vipp = -0.1;
    }
    return { x, z: 0, y: 0, vipp, farge: b.farge, synlig: true, skala: 1 };
}

function kameraFor(modus: Modus, beat: number): { pos: THREE.Vector3; se: THREE.Vector3 } {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    if (modus === 'allianser') {
        if (beat === 1) return { pos: v(-10, 6, 13), se: v(-5.5, 2.2, 0) };
        if (beat === 2) return { pos: v(5, 6, 14), se: v(6.2, 2.2, 0) };
        return { pos: v(-1.5, 8, 23), se: v(0, 1.8, 0) };
    }
    if (modus === 'juli') {
        if (beat === 0) return { pos: v(-6, 8, 20), se: v(0, 1.8, 0) };
        if (beat <= 2) return { pos: v(-8, 7, 17), se: v(-1.5, 1.8, 0) };
        return { pos: v(-11, 6, 13), se: v(-4.5, 1.8, 0) };
    }
    // kjede: følg den brikken som velter nå
    const fokus = [-4.6, -2.3, 0, 2.3, 4.6, 5.8][Math.min(beat, 5)];
    if (beat >= 6) return { pos: v(-6, 8.5, 20), se: v(0, 1.2, 0) };
    return { pos: v(fokus - 6, 6, 13), se: v(fokus, 1.6, 0) };
}

/** Merkene på vippa står i høyder etter plassen, så naboene ikke kolliderer i perspektivet. */
function radAllianser(x: number) {
    if (Math.abs(Math.abs(x) - 6.2) < 0.1) return 1;
    if (x > 8) return 2;
    return 0;
}

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

interface Merke {
    id: string;
    tekst: string;
    x: number;
    y: number;
    farge: string;
    synlig: boolean;
}

function Scene({
    modus,
    beat,
    playing,
    setMerker,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    setMerker: (m: Merke[]) => void;
}) {
    const { camera, size } = useThree();
    const grupper = useRef<(THREE.Group | null)[]>([]);
    const materialer = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    const vippe = useRef<THREE.Group>(null);
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const sistMerket = useRef('');
    const farge = useMemo(() => new THREE.Color(), []);
    const tmp = useMemo(() => new THREE.Vector3(), []);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const forsteBilde = forste.current;
        const steg = forsteBilde ? 1000 : dt;

        BRIKKER.forEach((b, i) => {
            const g = grupper.current[i];
            const m = materialer.current[i];
            if (!g || !m) return;
            const mål = mal(modus, beat, b);
            g.visible = mål.synlig;
            g.position.x = damp(g.position.x, mål.x, 2.2, steg);
            g.position.z = damp(g.position.z, mål.z, 2.2, steg);
            g.position.y = mål.y;
            // Velting går fortere enn flytting, og akselererer som en ekte brikke.
            g.rotation.z = damp(g.rotation.z, mål.vipp, 3.2, steg);
            g.scale.setScalar(mål.skala);
            farge.set(mål.farge);
            m.color.lerp(farge, forsteBilde ? 1 : 1 - Math.exp(-3 * dt));
            // Tyskland lyser når løftet gis.
            const gløder = modus === 'juli' && b.id === 'tyskland' && beat >= 1 && beat <= 2;
            m.emissive.set(gløder ? '#f59e0b' : '#000000');
            m.emissiveIntensity = gløder ? 0.35 + 0.25 * Math.sin(beatTid.current * 4) : 0;
        });
        if (vippe.current) vippe.current.visible = modus === 'allianser';

        const mål = kameraFor(modus, beat);
        const k = forsteBilde ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
        camera.updateMatrixWorld();

        // Merkelapper: toppen av hver brikke, projisert til skjermen.
        const merker: Merke[] = [];
        BRIKKER.forEach((b, i) => {
            const g = grupper.current[i];
            if (!g || !g.visible) return;
            // Fast høyde over foten, så merkene står jevnt også når brikkene ligger.
            tmp.set(g.position.x, g.position.y + H * g.scale.y + 0.5, g.position.z).project(camera);
            merker.push({
                id: b.id,
                tekst: b.navn,
                x: Math.round(((tmp.x + 1) / 2) * size.width),
                y: Math.round(((1 - tmp.y) / 2) * size.height),
                farge: mal(modus, beat, b).farge,
                synlig: tmp.z < 1,
            });
        });
        const nokkel = merker.map((m) => `${m.id}${m.x >> 2},${m.y >> 2}`).join('|') + beat;
        if (nokkel !== sistMerket.current) {
            sistMerket.current = nokkel;
            setMerker(merker);
        }
    });

    return (
        <>
            <color attach="background" args={['#e9e2d3']} />
            <fog attach="fog" args={['#e9e2d3', 30, 70]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[8, 14, 10]} intensity={1.5} color="#fff3dc" />
            <hemisphereLight args={['#ffffff', '#7c5a3a', 0.4]} />
            {/* Bordet */}
            <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[40, 0.5, 14]} />
                <meshStandardMaterial color="#8a5a35" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[34, 10]} />
                <meshStandardMaterial color="#2f5d46" roughness={0.95} />
            </mesh>
            {/* Vippa: en planke på en kile, i balanse */}
            <group ref={vippe}>
                <mesh position={[0, VIPPE_Y - 0.15, 0]}>
                    <boxGeometry args={[21, 0.3, 2.6]} />
                    <meshStandardMaterial color="#d6b88a" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[0.55, 0.55, 2.4]} />
                    <meshStandardMaterial color="#6b4a2c" />
                </mesh>
            </group>
            {BRIKKER.map((b, i) => (
                <group
                    key={b.id}
                    ref={(g) => {
                        grupper.current[i] = g;
                    }}
                >
                    <mesh position={[0, H / 2, 0]}>
                        <boxGeometry args={[B, H, D]} />
                        <meshStandardMaterial
                            ref={(m) => {
                                materialer.current[i] = m;
                            }}
                            color={GRA}
                            roughness={0.45}
                        />
                    </mesh>
                    {/* Hvit stripe og prikker, så det ser ut som en dominobrikke */}
                    {[1, -1].map((side) => (
                        <group key={side} position={[(side * B) / 2 + side * 0.006, 0, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
                            <mesh position={[0, H / 2, 0]}>
                                <planeGeometry args={[D * 0.8, 0.07]} />
                                <meshBasicMaterial color="#f8fafc" />
                            </mesh>
                            {[0.75, 2.25].map((y) => (
                                <mesh key={y} position={[0, y, 0]}>
                                    <circleGeometry args={[0.16, 16]} />
                                    <meshBasicMaterial color="#f8fafc" />
                                </mesh>
                            ))}
                        </group>
                    ))}
                </group>
            ))}
        </>
    );
}

const TITLER: Record<Modus, (string | null)[]> = {
    allianser: ['Hvem holder med hvem?', 'Trippelententen', 'Trippelalliansen', 'Maktbalanse', 'Én faller, de andre følger'],
    juli: ['Juli 1914', '5. juli: Tyskland lover støtte', '5. juli: blankofullmakt', '23. juli: ultimatum', 'Harde krav', 'Ikke alle krav', '28. juli: krig mot Serbia'],
    kjede: ['Løfter og krigsplaner', 'Russland mobiliserer', '1. august', '3. august', 'Schlieffen-planen', '4. august', 'Under en uke'],
};

export function OpptaktDomino({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'kjede';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const [merker, setMerker] = useState<Merke[]>([]);
    const [bredde, setBredde] = useState(1000);
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];

    // Hvilke merkelapper vises: i nærbilder bare brikkene i fokus, ellers alle (vekselvis høyde).
    const vis = (id: string) => {
        if (modus === 'allianser') {
            if (id === 'krangel') return beat >= 4;
            return true;
        }
        return REKKE.includes(id);
    };

    return (
        <div
            className="absolute inset-0"
            ref={(el) => {
                if (el && el.offsetWidth && el.offsetWidth !== bredde) setBredde(el.offsetWidth);
            }}
        >
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 200, position: [0, 6, 19] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} setMerker={setMerker} />
            </Canvas>
            {merker
                .filter((m) => m.synlig && vis(m.id) && m.x > 90 && m.x < bredde - 90)
                .map((m) => {
                    const rekkeIndeks = REKKE.indexOf(m.id);
                    const brikke = BRIKKER.find((b) => b.id === m.id)!;
                    const rad =
                        modus === 'allianser'
                            ? radAllianser(mal(modus, beat, brikke).x)
                            : rekkeIndeks % 2;
                    // Aldri oppå tittelen øverst til venstre: senk merket, eller dropp det.
                    const iTittel = (y: number) => m.x - 70 < 30 + (tittel?.length ?? 0) * 15 + 60 && y < 150;
                    let loft = rad * (modus === 'allianser' ? 52 : 58);
                    if (iTittel(m.y - loft)) loft = 0;
                    if (iTittel(m.y)) return null;
                    const dato =
                        modus === 'kjede' && VELTER[m.id] && VELTER[m.id].beat <= beat
                            ? VELTER[m.id].dato
                            : null;
                    return (
                        <div
                            key={m.id}
                            className="absolute -translate-x-1/2 -translate-y-full text-center pointer-events-none"
                            style={{ left: m.x, top: m.y - loft, transition: 'left 0.2s, top 0.2s' }}
                        >
                            {dato && (
                                <div className="text-lg font-black text-slate-900 whitespace-nowrap mb-0.5 px-1.5 rounded bg-white/85">{dato}</div>
                            )}
                            <div
                                className="px-2.5 py-0.5 rounded-lg text-white font-black text-lg whitespace-nowrap shadow-md"
                                style={{ background: m.farge === GRA ? '#64748b' : m.farge === NOYTRAL ? '#78716c' : m.farge }}
                            >
                                {m.tekst}
                            </div>
                            {modus === 'allianser' && m.id === 'italia' && beat >= 2 && (
                                <div className="text-base font-black text-slate-900 whitespace-nowrap mt-0.5">byttet side i 1915</div>
                            )}
                        </div>
                    );
                })}
            <AnimatePresence mode="wait">
                {tittel && (
                    <motion.div
                        key={`${modus}-${tittel}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                        style={{ top: '4%', left: '3%' }}
                    >
                        {tittel}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'juli' && (beat === 3 || beat === 4) && (
                    <motion.div
                        key="ultimatum"
                        initial={{ opacity: 0, rotate: -6, y: 20 }}
                        animate={{ opacity: 1, rotate: -3, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-xl bg-amber-50 border-2 border-amber-800 shadow-2xl px-6 py-4 text-amber-950"
                        style={{ right: '4%', bottom: '8%', width: 320 }}
                    >
                        <div className="font-black text-2xl">ULTIMATUM</div>
                        <div className="text-lg font-semibold mt-1">Gjør dette, ellers blir det krig.</div>
                        <div className="text-lg font-semibold mt-2 text-amber-950">Fra Østerrike-Ungarn til Serbia</div>
                    </motion.div>
                )}
                {modus === 'juli' && (beat === 1 || beat === 2) && (
                    <motion.div
                        key="lofte"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-xl bg-white/95 border-l-8 border-amber-500 shadow-2xl px-6 py-4 text-slate-900"
                        style={{ right: '4%', bottom: '8%', width: 340 }}
                    >
                        <div className="font-black text-2xl">Full støtte</div>
                        <div className="text-lg font-semibold mt-1">uansett hva Østerrike-Ungarn gjør</div>
                    </motion.div>
                )}
                {modus === 'allianser' && beat === 3 && (
                    <motion.div
                        key="balanse"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 rounded-xl bg-white/95 shadow-2xl px-6 py-3 text-slate-900 text-center"
                        style={{ bottom: '8%' }}
                    >
                        <div className="font-black text-2xl">Begge sider har mektige venner</div>
                        <div className="text-lg font-semibold">Ingen tør å starte</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
