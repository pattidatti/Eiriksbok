import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { damp, useDpr } from './felles3d';
import { GRUPPE_X, TRAADER, formX, gruppeX } from './data';

/**
 * Veven: de ni setningene som ni fargede tråder spent opp mellom to bjelker. Fire modus:
 * - traader: trådene spennes opp, og de tre gruppene lyser opp én etter én.
 * - bud: to steintavler senker seg over de abrahamittiske trådene.
 * - nyere: de tre nyere trådene vokser ut fra trådene de kom fra.
 * - kryss: trådene sorteres etter form (ikke gjør / gjør) og krysser gruppene.
 */

type Modus = 'traader' | 'bud' | 'nyere' | 'kryss';

const TOPP = 2.8;
const BUNN = -2.8;
const HOYDE = TOPP - BUNN;

const OVERSKRIFT: Record<Modus, string[]> = {
    traader: ['Ni setninger, ni tråder', 'Abrahamittiske røtter', 'Fra India', 'Nyere bevegelser'],
    bud: ['Bud fra Gud', 'De ti bud', 'Jødedom', 'Kristendom', 'Islam'],
    nyere: ['Ny bevegelse, samme regel', "Bahá'í", 'Mormonismen', 'Jehovas vitner', 'Reglene rundt'],
    kryss: ['Mønsteret', 'Ikke gjør', 'Gjør', 'Hvorfor gjelder regelen?', 'En svakhet'],
};

/** Hvor sterkt hver tråd lyser (0-1) på en beat. */
function lysFor(modus: Modus, beat: number, i: number): number {
    const t = TRAADER[i];
    if (modus === 'traader') {
        if (beat === 0) return 1;
        const aktiv = beat - 1;
        if (t.gruppe === aktiv) return 1;
        return t.gruppe < aktiv ? 0.5 : 0.18;
    }
    if (modus === 'bud') {
        if (t.gruppe !== 0) return 0.15;
        return beat < 2 || uthevet(modus, beat, i) ? 1 : 0.35;
    }
    if (modus === 'nyere') {
        if (t.gruppe !== 2) return t.id === 'kristendom' || t.id === 'islam' ? 0.7 : 0.15;
        if (beat === 0 || beat === 4) return 1;
        return i - 6 === beat - 1 ? 1 : 0.25;
    }
    // kryss
    if (beat === 1) return t.form === 'negativ' ? 1 : 0.2;
    if (beat === 2) return t.form === 'negativ' ? 0.35 : 1;
    if (beat === 4) return 0.55;
    return 1;
}

function xFor(modus: Modus, beat: number, i: number): number {
    if (modus === 'kryss' && (beat === 1 || beat === 2)) return formX(i);
    return gruppeX(i);
}

/** Uthevet tråd (sterkere glød) i bud-modus. */
function uthevet(modus: Modus, beat: number, i: number): boolean {
    if (modus !== 'bud') return false;
    return (beat === 2 && i === 0) || (beat === 3 && i === 1) || (beat === 4 && i === 2);
}

function visNavn(modus: Modus, beat: number, i: number): boolean {
    const t = TRAADER[i];
    if (modus === 'traader') return beat >= 1 && t.gruppe === beat - 1;
    if (modus === 'bud') return t.gruppe === 0;
    if (modus === 'kryss') {
        if (beat === 1) return t.form === 'negativ';
        if (beat === 2) return t.form !== 'negativ';
    }
    return false;
}

function Traad({ modus, beat, i, playing }: { modus: Modus; beat: number; i: number; playing: boolean }) {
    const t = TRAADER[i];
    const gruppe = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const [startX] = useState(() => xFor(modus, beat, i));
    const vekst = useRef(modus === 'traader' ? 0 : 1);
    const forste = useRef(true);
    const glodRef = useRef(0);
    const farge = useMemo(() => new THREE.Color(t.farge), [t.farge]);
    const skjult = modus === 'nyere' && t.gruppe === 2;

    useFrame((_, raa) => {
        const g = gruppe.current;
        const m = mat.current;
        if (!g || !m) return;
        const dt = forste.current ? 10 : playing ? Math.min(raa, 0.05) : 0;
        forste.current = false;
        g.position.x = damp(g.position.x, xFor(modus, beat, i), 5, dt);
        vekst.current = damp(vekst.current, 1, 1.6, playing ? Math.min(raa, 0.05) : beat > 0 ? 10 : 0);
        if (modus === 'traader' && beat > 0) vekst.current = 1;
        g.scale.y = Math.max(0.001, vekst.current);
        const lys = lysFor(modus, beat, i);
        m.opacity = damp(m.opacity, lys, 4, dt);
        const glod = uthevet(modus, beat, i) ? 0.75 : lys * 0.25;
        glodRef.current = damp(glodRef.current, glod, 4, dt);
        m.emissive.copy(farge).multiplyScalar(glodRef.current);
    });

    if (skjult) return null;
    return (
        <group ref={gruppe} position={[startX, 0, 0]}>
            <mesh>
                <cylinderGeometry args={[uthevet(modus, beat, i) ? 0.2 : 0.11, uthevet(modus, beat, i) ? 0.2 : 0.11, HOYDE, 10]} />
                <meshStandardMaterial ref={mat} color={t.farge} transparent opacity={1} roughness={0.6} />
            </mesh>
            {visNavn(modus, beat, i) && (
                <Html position={[0.42, 0.2, 0.2]} center zIndexRange={[10, 0]}>
                    <div
                        className="text-2xl font-black whitespace-nowrap"
                        style={{
                            color: '#1e293b',
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            textShadow: '0 0 6px #fff, 0 0 6px #fff',
                        }}
                    >
                        {t.navn}
                    </div>
                </Html>
            )}
        </group>
    );
}

/** En ny tråd som vokser ut av tråden den kom fra (bahá'í fra islam, de to andre fra kristendommen). */
function Gren({ i, beat, playing }: { i: number; beat: number; playing: boolean }) {
    const t = TRAADER[i];
    const fraX = t.id === 'bahai' ? gruppeX(2) : gruppeX(1);
    const tilX = gruppeX(i);
    const geo = useMemo(() => {
        const kurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(fraX, BUNN, 0.25),
            new THREE.Vector3(fraX, BUNN + 1.6, 0.35),
            new THREE.Vector3((fraX + tilX) / 2, 0.6, 0.6),
            new THREE.Vector3(tilX, TOPP - 0.9, 0.35),
            new THREE.Vector3(tilX, TOPP, 0.25),
        ]);
        return new THREE.TubeGeometry(kurve, 80, 0.11, 8, false);
    }, [fraX, tilX]);
    const andel = useRef(0);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, raa) => {
        const dt = playing ? Math.min(raa, 0.05) : beat > 0 ? 10 : 0;
        andel.current = damp(andel.current, 1, 1.3, dt);
        if (beat > 0) andel.current = 1;
        const n = geo.index ? geo.index.count : 0;
        geo.setDrawRange(0, Math.floor((n * andel.current) / 3) * 3);
        if (mat.current) mat.current.opacity = damp(mat.current.opacity, lysFor('nyere', beat, i), 4, playing ? Math.min(raa, 0.05) : 10);
    });
    return (
        <mesh geometry={geo} frustumCulled={false}>
            <meshStandardMaterial
                ref={mat}
                color={t.farge}
                emissive={t.farge}
                emissiveIntensity={0.25}
                transparent
                opacity={1}
            />
        </mesh>
    );
}

function Tavler({ beat, playing }: { beat: number; playing: boolean }) {
    const g = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, raa) => {
        if (!g.current) return;
        const dt = forste.current && beat > 0 ? 10 : playing ? Math.min(raa, 0.05) : 0;
        forste.current = false;
        g.current.position.y = damp(g.current.position.y, 0.2, 2.2, dt);
    });
    const stein = '#9ca3af';
    return (
        <group ref={g} position={[-2.6, 7, 0.9]}>
            {[-0.85, 0.85].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                    <mesh>
                        <boxGeometry args={[1.5, 2.1, 0.22]} />
                        <meshStandardMaterial color={stein} roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.75, 0.75, 0.22, 24, 1, false, Math.PI / 2, Math.PI]} />
                        <meshStandardMaterial color={stein} roughness={0.9} />
                    </mesh>
                    {[0, 1, 2, 3, 4].map((r) => (
                        <mesh key={r} position={[0, 0.65 - r * 0.32, 0.12]}>
                            <boxGeometry args={[1.05, 0.07, 0.02]} />
                            <meshStandardMaterial color="#4b5563" />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

function Vev() {
    const tre = '#8b5a2b';
    return (
        <group>
            {[TOPP + 0.1, BUNN - 0.1].map((y) => (
                <mesh key={y} position={[0, y, 0]}>
                    <boxGeometry args={[19, 0.42, 0.5]} />
                    <meshStandardMaterial color={tre} roughness={0.8} />
                </mesh>
            ))}
            {[-9.6, 9.6].map((x) => (
                <mesh key={x} position={[x, -0.3, 0]}>
                    <boxGeometry args={[0.5, 7.4, 0.5]} />
                    <meshStandardMaterial color="#6b4423" roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
}

/** Det gyldne båndet: kjernen som går gjennom alle trådene. */
function Baand({ synlig }: { synlig: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, raa) => {
        if (mat.current) mat.current.opacity = damp(mat.current.opacity, synlig ? 0.95 : 0, 4, Math.min(raa, 0.05) || 10);
    });
    return (
        <mesh position={[0, 0.2, 0.15]}>
            <boxGeometry args={[18.8, 0.55, 0.12]} />
            <meshStandardMaterial ref={mat} color="#facc15" emissive="#facc15" emissiveIntensity={0.35} transparent opacity={0} />
        </mesh>
    );
}

function kameraFor(modus: Modus, beat: number) {
    if (modus === 'bud') return { pos: new THREE.Vector3(-5, 0.8, 12.5), se: new THREE.Vector3(-5, 0.1, 0) };
    if (modus === 'traader' && beat === 0) return { pos: new THREE.Vector3(3, 1.2, 18), se: new THREE.Vector3(0, -0.8, 0) };
    // Med kort nederst står veven høyere i bildet.
    const kort = modus === 'nyere' || (modus === 'kryss' && beat === 4);
    return kort
        ? { pos: new THREE.Vector3(0, 0.6, 17), se: new THREE.Vector3(0, -1.5, 0) }
        : { pos: new THREE.Vector3(0, 0.9, 17), se: new THREE.Vector3(0, -0.8, 0) };
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const forste = useRef(true);
    const se = useRef(new THREE.Vector3());
    useFrame(({ camera }, raa) => {
        const mal = kameraFor(modus, beat);
        const dt = forste.current ? 10 : playing ? Math.min(raa, 0.05) : 0;
        forste.current = false;
        const k = 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Gruppemerke({ x, linjer, farge }: { x: number; linjer: string[]; farge: string }) {
    return (
        <Html position={[x, BUNN - 1.35, 0]} center zIndexRange={[10, 0]}>
            <div className="text-2xl font-black text-center leading-tight whitespace-nowrap" style={{ color: farge }}>
                {linjer.map((l) => (
                    <div key={l}>{l}</div>
                ))}
            </div>
        </Html>
    );
}

function Merker({ modus, beat }: { modus: Modus; beat: number }) {
    const ut: ReactNode[] = [];
    if (modus === 'traader') {
        const navn = [['Abrahamittiske', 'røtter'], ['Indiske', 'tradisjoner'], ['Nyere', 'bevegelser']];
        for (let g = 0; g < 3; g++)
            if (beat >= g + 1) ut.push(<Gruppemerke key={g} x={GRUPPE_X[g]} linjer={navn[g]} farge={g === beat - 1 ? '#0f172a' : '#334155'} />);
    }
    if (modus === 'kryss' && (beat === 1 || beat === 2)) {
        ut.push(<Gruppemerke key="ikke" x={-6.45} linjer={['IKKE GJØR']} farge="#dc2626" />);
        if (beat === 2) {
            ut.push(<Gruppemerke key="del" x={0} linjer={['DEL', '(sikhismen)']} farge="#c2410c" />);
            ut.push(<Gruppemerke key="gjor" x={6.45} linjer={['GJØR']} farge="#059669" />);
        }
    }
    if (modus === 'kryss' && beat === 3) {
        ut.push(<Gruppemerke key="gud" x={GRUPPE_X[0]} linjer={['Abrahamittiske:', 'bud fra Gud']} farge="#1e3a8a" />);
        ut.push(<Gruppemerke key="karma" x={GRUPPE_X[1]} linjer={['Indiske: karma,', 'virker tilbake på deg']} farge="#9d174d" />);
    }
    if (modus === 'kryss' && beat === 0) {
        ut.push(
            <Html key="kjerne" position={[0, 0.95, 0.4]} center zIndexRange={[10, 0]}>
                <div className="px-4 py-1 rounded-xl bg-white/95 shadow-lg text-2xl font-black whitespace-nowrap text-amber-800">
                    samme kjerne: deg selv som målestokk
                </div>
            </Html>
        );
    }
    return <>{ut}</>;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#f1e9da']} />
            <fog attach="fog" args={['#f1e9da', 30, 70]} />
            <ambientLight intensity={1.1} />
            <directionalLight position={[6, 10, 12]} intensity={1.4} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            <Vev />
            {TRAADER.map((t, i) => (
                <Traad key={t.id} modus={modus} beat={beat} i={i} playing={playing} />
            ))}
            {modus === 'nyere' && [6, 7, 8].map((i) => <Gren key={i} i={i} beat={beat} playing={playing} />)}
            {modus === 'bud' && <Tavler beat={beat} playing={playing} />}
            {modus === 'kryss' && <Baand synlig={beat === 0} />}
            <Merker modus={modus} beat={beat} />
        </>
    );
}

function Kort({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl bg-white/95 shadow-2xl px-6 py-4"
        >
            {children}
        </motion.div>
    );
}

function Brikke({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <span className="inline-block rounded-xl px-3 py-1 text-2xl font-black text-white mr-2 mt-2" style={{ background: farge }}>
            {tekst}
        </span>
    );
}

/** Kortet nederst i bildet: hva den uthevede tråden sier. */
function Infokort({ modus, beat }: { modus: Modus; beat: number }): ReactNode {
    if (modus === 'bud') {
        if (beat === 1)
            return (
                <Kort>
                    <div className="text-2xl font-bold text-slate-500">De ti bud: Den hebraiske bibelen</div>
                    <div className="text-3xl font-black text-slate-900">Andre Mosebok 20 og Femte Mosebok 5</div>
                    <div className="text-2xl font-bold text-slate-700">Der står også: Elsk din neste som deg selv.</div>
                </Kort>
            );
        if (beat === 2)
            return (
                <Kort>
                    <div className="text-2xl font-bold text-slate-500">Mange jøder leser Hillels setning som</div>
                    <div className="text-3xl font-black" style={{ color: '#1d4ed8' }}>et kort sammendrag av budene</div>
                </Kort>
            );
        if (beat === 3)
            return (
                <Kort>
                    <div className="text-3xl font-black" style={{ color: '#4338ca' }}>Nestekjærlighet: den viktigste regelen</div>
                    <div className="text-2xl font-bold text-slate-700">Nesten er hvem som helst du møter.</div>
                </Kort>
            );
        if (beat === 4)
            return (
                <Kort>
                    <div className="text-3xl font-black" style={{ color: '#047857' }}>Sharia: ingen ferdig lovbok</div>
                    <div className="text-2xl font-bold text-slate-700">Muslimske lærde bygde den opp gjennom flere hundre år.</div>
                </Kort>
            );
        return null;
    }
    if (modus === 'nyere') {
        if (beat === 0)
            return (
                <Kort>
                    <div className="text-3xl font-black text-slate-900">Regelen blir med. Reglene rundt er nye.</div>
                    <div className="text-2xl font-bold text-slate-600">Bahá'í fra sjia-islam. Mormonismen og Jehovas vitner fra kristendommen.</div>
                </Kort>
            );
        if (beat === 1)
            return (
                <Kort>
                    <div className="text-2xl font-bold" style={{ color: '#0f766e' }}>Bahá'í: ikke legg på andre det du ikke vil ha lagt på deg</div>
                    <Brikke tekst="kvinner og menn likeverdige" farge="#0f766e" />
                </Kort>
            );
        if (beat === 2)
            return (
                <Kort>
                    <div className="text-2xl font-bold" style={{ color: '#6d28d9' }}>Mormonismen: regelen ordrett i Mormons bok</div>
                    <div className="text-xl font-bold text-slate-500">Visdomsordet i dag:</div>
                    <Brikke tekst="ikke alkohol, tobakk, kaffe, te" farge="#6d28d9" />
                    <Brikke tekst="en tiendedel til kirken" farge="#6d28d9" />
                </Kort>
            );
        if (beat === 3)
            return (
                <Kort>
                    <div className="text-2xl font-bold" style={{ color: '#0369a1' }}>Jehovas vitner:</div>
                    <Brikke tekst="utenfor politikk" farge="#0369a1" />
                    <Brikke tekst="nei til blodoverføring" farge="#0369a1" />
                    <Brikke tekst="ingen bursdag eller jul" farge="#0369a1" />
                </Kort>
            );
        return (
            <Kort>
                <div className="text-3xl font-black text-slate-900">Hvor strengt hver enkelt følger reglene, varierer.</div>
            </Kort>
        );
    }
    if (modus === 'kryss' && beat === 4)
        return (
            <Kort>
                <div className="text-2xl font-bold text-slate-500">Svakheten:</div>
                <div className="text-3xl font-black text-slate-900">Det du liker, er ikke alltid det den andre liker.</div>
            </Kort>
        );
    return null;
}

export function EtikkVeven({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'traader';
    const dpr = useDpr();
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const start = kameraFor(modus, beat).pos;
    const kort = Infokort({ modus, beat });
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 45, near: 0.2, far: 200, position: [start.x, start.y, start.z] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${tekst}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: '4%' }}
                >
                    <div
                        className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl md:text-4xl font-display font-black text-slate-900"
                        style={{ borderLeft: '10px solid #a16207' }}
                    >
                        {tekst}
                    </div>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
                {kort && (
                    <motion.div
                        key={`${modus}-k${beat}`}
                        className="absolute inset-x-0 flex justify-center"
                        style={{ bottom: '4%' }}
                        exit={{ opacity: 0 }}
                    >
                        <div style={{ maxWidth: '78%' }}>{kort}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
