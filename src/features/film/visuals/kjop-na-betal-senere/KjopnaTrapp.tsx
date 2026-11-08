import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Trappa fra glemt regning til inkasso, i 3D. Fakturaen (200 kroner) er en blå stabel med
 * mynter. På hvert trinn legges gebyret oppå som et rødt lag, og stabelen flytter seg ett
 * trinn opp. Høyden er i målestokk: 1 enhet = 100 kroner. Beløpene er artikkelens tenkte
 * eksempel med de høyeste gebyrene som er lov i 2026.
 */

type Modus = 'oversikt' | 'purring' | 'varsel' | 'inkasso';

const SKALA = 0.01; // høyde per krone
const TRINN = [
    { navn: 'Faktura', x: -9, h: 0.4, farge: '#60a5fa' },
    { navn: 'Purring', x: -3, h: 1.6, farge: '#facc15' },
    { navn: 'Inkassovarsel', x: 3, h: 2.8, farge: '#fb923c' },
    { navn: 'Inkasso', x: 9, h: 4.0, farge: '#ef4444' },
];

interface Lag {
    kroner: number;
    farge: string;
}

/** Hvilket trinn stabelen står på, og hvilke lag den har, per modus og beat. */
function tilstand(modus: Modus, beat: number): { trinn: number; lag: Lag[]; rente: boolean } {
    const vare = { kroner: 200, farge: '#2563eb' };
    const purr = { kroner: 38, farge: '#eab308' };
    const varsel = { kroner: 38, farge: '#f97316' };
    if (modus === 'oversikt') return { trinn: 0, lag: [vare], rente: false };
    if (modus === 'purring')
        return { trinn: 1, lag: beat >= 2 ? [vare, purr] : [vare], rente: false };
    if (modus === 'varsel')
        return { trinn: 2, lag: beat >= 1 ? [vare, purr, varsel] : [vare, purr], rente: false };
    const salaer = beat >= 3 ? 375 : 187.5;
    return {
        trinn: 3,
        lag:
            beat >= 2
                ? [vare, purr, varsel, { kroner: salaer, farge: '#dc2626' }]
                : [vare, purr, varsel],
        rente: beat >= 4,
    };
}

function sum(lag: Lag[]) {
    return lag.reduce((s, l) => s + l.kroner, 0);
}

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'oversikt') {
        if (beat === 0) return { pos: v(-14 + t * 0.15, 5, 11), se: v(-9, 1.4, 0) };
        return { pos: v(-4 + Math.min(t, 8) * 0.2, 9, 22), se: v(0, 2.2, 0) };
    }
    const tilst = tilstand(modus, beat);
    const { x, h } = TRINN[tilst.trinn];
    // Kameraet trekker seg bakover når stabelen vokser, så toppen alltid er med.
    const topp = sum(tilst.lag) * SKALA;
    // Sara venter: kameraet ser mot neste trinn, inkasso.
    if (modus === 'varsel' && beat >= 3) {
        return { pos: v(x - 2 + t * 0.12, h + 5, 15), se: v(TRINN[3].x, TRINN[3].h + 0.5, 0) };
    }
    return {
        pos: v(x - 9 + t * 0.12, h + topp * 0.55 + 4.5, 15 + topp * 1.5),
        se: v(x + 1.2, h + topp * 0.5, 0),
    };
}

/** Én blokk i trappa som reiser seg når den skal vises. */
function Trinnblokk({ i, synlig }: { i: number; synlig: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const t = TRINN[i];
    useFrame((_, dt) => {
        const m = ref.current;
        if (!m) return;
        const s = damp(m.scale.y, synlig ? 1 : 0.02, 3, dt || 1);
        m.scale.y = s;
        m.position.y = (t.h * s) / 2;
    });
    return (
        <mesh ref={ref} position={[t.x, t.h / 2, 0]} scale={[1, synlig ? 1 : 0.02, 1]}>
            <boxGeometry args={[5.6, t.h, 5]} />
            <meshStandardMaterial color={t.farge} flatShading roughness={0.7} />
        </mesh>
    );
}

/** Myntstabelen: ett lag per beløp, høyden glir mot målet. */
function Stabel({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const gruppe = useRef<THREE.Group>(null);
    const lagRefs = useRef<(THREE.Mesh | null)[]>([]);
    const rente = useRef<THREE.Mesh>(null);
    const forste = useRef(true);
    const farger = ['#2563eb', '#eab308', '#f97316', '#dc2626'];
    const tilst = tilstand(modus, beat);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = gruppe.current;
        if (!g) return;
        const trinn = TRINN[tilst.trinn];
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        g.position.x = THREE.MathUtils.lerp(g.position.x, trinn.x, k);
        g.position.y = THREE.MathUtils.lerp(g.position.y, trinn.h, k);
        let y = 0;
        for (let i = 0; i < 4; i++) {
            const m = lagRefs.current[i];
            if (!m) continue;
            const mal = (tilst.lag[i]?.kroner ?? 0) * SKALA;
            const naa = forste.current ? mal : damp(m.scale.y, Math.max(mal, 0.0001), 2.2, dt);
            m.scale.y = naa;
            m.position.y = y + naa / 2;
            m.visible = naa > 0.01;
            y += naa;
        }
        const r = rente.current;
        if (r) {
            r.visible = tilst.rente;
            r.position.y = y + 0.45;
        }
        forste.current = false;
    });

    return (
        <group ref={gruppe} position={[TRINN[0].x, TRINN[0].h, 0]}>
            {farger.map((f, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        lagRefs.current[i] = m;
                    }}
                >
                    <cylinderGeometry args={[1.3, 1.3, 1, 32]} />
                    <meshStandardMaterial color={f} flatShading roughness={0.5} metalness={0.2} />
                </mesh>
            ))}
            {modus === 'oversikt' && (
                <Html position={[0, 2.7, 0]} center zIndexRange={[10, 0]}>
                    <div className="whitespace-nowrap rounded-xl bg-blue-700 px-3 py-1 text-2xl font-black text-white shadow">
                        Regningen
                    </div>
                </Html>
            )}
            <mesh ref={rente} visible={false}>
                <cylinderGeometry args={[1.3, 1.3, 0.8, 32]} />
                <meshStandardMaterial color="#dc2626" transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

/** Den grønne døra ved inkassovarselet: betal her, og inkassoselskapet får ikke sende regning. */
function Utgang({ synlig }: { synlig: boolean }) {
    return (
        <group position={[TRINN[2].x + 2, TRINN[2].h, 2.6]} visible={synlig}>
            <mesh position={[0, 1.3, 0]}>
                <boxGeometry args={[1.4, 2.6, 0.2]} />
                <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
            </mesh>
            {synlig && (
                <Html position={[0, 3.2, 0]} center zIndexRange={[10, 0]}>
                    <div className="whitespace-nowrap rounded-xl bg-emerald-600 px-3 py-1 text-2xl font-black text-white shadow">
                        Betal her
                    </div>
                </Html>
            )}
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        se.current.lerp(mal.se, k);
        camera.lookAt(se.current);
    });

    const trappSynlig = (i: number) => i === 0 || modus !== 'oversikt' || beat >= 1;
    const trinnNaa = tilstand(modus, beat).trinn;
    const navnSynlig = (i: number) =>
        modus === 'oversikt' ? i === 0 || beat >= 2 : i <= trinnNaa + 1 && i >= trinnNaa;

    return (
        <>
            <color attach="background" args={['#f1f5f9']} />
            <fog attach="fog" args={['#f1f5f9', 40, 90]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[8, 16, 12]} intensity={1.5} />
            <hemisphereLight args={['#ffffff', '#94a3b8', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[120, 120]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {TRINN.map((_, i) => (
                <Trinnblokk key={i} i={i} synlig={trappSynlig(i)} />
            ))}
            {TRINN.map((t, i) =>
                navnSynlig(i) ? (
                    <Html key={t.navn} position={[t.x, t.h / 2, 2.6]} center zIndexRange={[10, 0]}>
                        <div className="whitespace-nowrap rounded-xl bg-white/90 px-3 py-1 text-2xl font-black text-slate-900 shadow">
                            {t.navn}
                        </div>
                    </Html>
                ) : null
            )}
            <Stabel modus={modus} beat={beat} playing={playing} />
            <Utgang synlig={modus === 'varsel' && beat === 2} />
        </>
    );
}

const NAVN = ['T-skjorta', 'Purring', 'Inkassovarsel', 'Salær'];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','));

/** Tekst øverst til venstre per beat. */
const TEKST: Record<Modus, string[]> = {
    oversikt: [
        'Inkassoloven fra 1988',
        'Varsler og frister',
        'Tre trinn',
        'Tenkt eksempel, gebyrer i 2026',
    ],
    purring: [
        'Purring: en påminnelse',
        'Gebyr tidligst 14 dager etter fristen',
        'Purregebyr: 38 kroner',
        'Minst 14 nye dager',
    ],
    varsel: [
        'Skriftlig inkassovarsel',
        'Gebyr: 38 kroner',
        'Betal nå: ingen regning fra inkassoselskapet',
        'Sara venter',
    ],
    inkasso: [
        'Inkassoselskapet tar over',
        'Ny frist: 14 dager',
        'Salær: 187,50 kroner (regning på 500 kroner eller mindre)',
        'Over fire uker etter fristen: salæret kan dobles til 375',
        'Pluss forsinkelsesrente',
    ],
};

interface Props {
    modus?: Modus;
}

export function KjopnaTrapp({ beat, playing, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'oversikt';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekster = TEKST[modus];
    const tekst = tekster[Math.min(beat, tekster.length - 1)];
    const lag = tilstand(modus, beat).lag;
    const total = sum(lag);
    const gronn = modus === 'varsel' && beat === 2;
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 40, near: 0.3, far: 200, position: [-14, 5, 11] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute" style={{ left: 28, top: 26, maxWidth: 560 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-2xl px-5 py-3 text-3xl font-black leading-tight shadow-xl ${
                            gronn ? 'bg-emerald-600 text-white' : 'bg-white/95 text-slate-900'
                        }`}
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div
                className="absolute rounded-2xl bg-slate-900/90 px-5 py-3 text-right text-white shadow-xl"
                style={{ right: 28, top: 26 }}
            >
                <div className="text-lg font-semibold text-slate-300">Sara skylder</div>
                <div className="text-5xl font-black tabular-nums">
                    {fmt(total)} kr{modus === 'inkasso' && beat >= 4 ? ' +' : ''}
                </div>
                <div className="mt-2 flex flex-col gap-0.5">
                    {lag.map((l, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-end gap-2 text-lg font-bold text-slate-200"
                        >
                            <span>
                                {NAVN[i]}: {fmt(l.kroner)}
                            </span>
                            <span
                                className="inline-block rounded-sm"
                                style={{ width: 16, height: 16, background: l.farge }}
                            />
                        </div>
                    ))}
                    {modus === 'inkasso' && beat >= 4 && (
                        <div className="text-lg font-bold text-red-300">+ rente</div>
                    )}
                </div>
            </div>
        </div>
    );
}
