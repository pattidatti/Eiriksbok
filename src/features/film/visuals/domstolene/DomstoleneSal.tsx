import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Rettssalen i 3D, sett fra tilhørerbenkene.
 * «apning»: Jonas og advokaten venter, døra bak dommerbordet åpnes, tre dommere kommer inn
 * og alle reiser seg.
 * «roller»: én rolle om gangen lyser opp: aktor, forsvareren, tiltalte, vitnet, bistandsadvokaten.
 * «dommere»: fagdommeren og de to meddommerne, så det lukkede rommet der de diskuterer.
 * «lagmannsrett»: en ny sal med sju dommere, vitnet forklarer seg igjen, fem av sju må si skyldig.
 * Alt styres av (beat, beatTid), så bildet tåler at eleven hopper.
 */

type Modus = 'apning' | 'roller' | 'dommere' | 'lagmannsrett';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    apning: ['Tingretten, klokka ni', 'Jonas, 19 år', 'Anklaget for å ha slått', 'Døra bak bordet åpnes', 'Alle reiser seg'],
    roller: ['Hvem er hvem?', 'Aktor må bevise', 'Forsvareren passer på Jonas', 'Tiltalte kan tie', 'Vitnet så eller hørte noe', 'Bistandsadvokat og siste ord'],
    dommere: ['Tingretten: tre dommere', 'Fagdommeren', 'To meddommere', 'Et eget rom', 'Lukket dør, hemmelig samtale'],
    lagmannsrett: ['Lagmannsretten: alt på nytt', 'Anket om skyld: sju dommere', 'Skyldig? Minst fem av sju', 'En ny gruppe dommere', 'To runder'],
};

/** Hvor alle sitter. Salen vender mot dommerbordet (negativ z). */
const PLASS = {
    aktor: v(-6.4, 0, 1.3),
    bistand: v(-4.6, 0, 1.3),
    forsvarer: v(4.8, 0, 1.3),
    jonas: v(6.6, 0, 1.3),
    vitne: v(0, 0, -2.2),
    dor: v(9, 0, -9.2),
};
const BENK_Z = -7.4;
const BENK_Y = 1.2;
/** Dommernes x-plass bak bordet. */
function dommerX(antall: number, i: number) {
    const avstand = antall > 3 ? 2.1 : 2.6;
    return (i - (antall - 1) / 2) * avstand;
}
const RAD_X = 60;

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    const glid = Math.min(t, 12);
    if (modus === 'apning') {
        switch (beat) {
            case 0:
                return { pos: v(-2 + glid * 0.15, 8.5, 17 - glid * 0.2), se: v(0, 1, -3) };
            case 1:
                return { pos: v(11.5, 3.4, 6.5), se: v(5.6, 1.3, 0.4) };
            case 2:
                return { pos: v(10 - glid * 0.1, 4, 8), se: v(5.6, 1.2, 0) };
            case 3:
                return { pos: v(-1, 7, 3), se: v(5, 1.6, -8) };
            default:
                return { pos: v(0, 6, 12 - glid * 0.1), se: v(0, 1.8, -5) };
        }
    }
    if (modus === 'roller') {
        switch (beat) {
            case 0:
                return { pos: v(0, 10, 17), se: v(0, 0.5, -2) };
            case 1:
                return { pos: v(-9.5, 4.6, 4.8), se: v(-5.6, 1.2, 0.6) };
            case 2:
                return { pos: v(9, 3.6, 7.5), se: v(4.6, 1.2, 0.6) };
            case 3:
                return { pos: v(11, 3.2, 6), se: v(6.4, 1.2, 0.8) };
            case 4:
                return { pos: v(3.5, 3.4, 5), se: v(0, 1.3, -2.4) };
            default:
                return { pos: v(-2, 4.5, 7.5), se: v(-4.5, 1.2, 0.6) };
        }
    }
    if (modus === 'dommere') {
        switch (beat) {
            case 0:
                return { pos: v(0, 4.4, 3.5), se: v(0, 2.2, -7) };
            case 1:
                return { pos: v(-0.6, 3.8, 0), se: v(0, 2.3, -7.4) };
            case 2:
                return { pos: v(0, 4.2, 2.5), se: v(0, 2.2, -7.4) };
            case 3:
                return { pos: v(RAD_X + 6, 5, 7), se: v(RAD_X, 1, 0) };
            default:
                return { pos: v(RAD_X + 4 - glid * 0.1, 7, 9), se: v(RAD_X, 1, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(5, 4.5, 3.5), se: v(0, 1.4, -3.5) };
        case 1:
        case 2:
            return { pos: v(3.5, 5.2, 3.5), se: v(0, 2.3, -7.2) };
        default:
            return { pos: v(0, 9, 17 - glid * 0.15), se: v(0, 1.2, -4) };
    }
}

const mat = {
    gulv: new THREE.MeshStandardMaterial({ color: '#d6c3a5', roughness: 0.9 }),
    vegg: new THREE.MeshStandardMaterial({ color: '#eef2f7', roughness: 0.95 }),
    veggLag: new THREE.MeshStandardMaterial({ color: '#dfe7df', roughness: 0.95 }),
    tre: new THREE.MeshStandardMaterial({ color: '#a0703f', roughness: 0.7, flatShading: true }),
    treMork: new THREE.MeshStandardMaterial({ color: '#6b4524', roughness: 0.7, flatShading: true }),
    stol: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 }),
    dor: new THREE.MeshStandardMaterial({ color: '#7c4a21', roughness: 0.8 }),
    hud: new THREE.MeshStandardMaterial({ color: '#e8b48c', roughness: 0.9, flatShading: true }),
    hudMork: new THREE.MeshStandardMaterial({ color: '#a8724a', roughness: 0.9, flatShading: true }),
    papir: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
    ja: new THREE.MeshStandardMaterial({ color: '#16a34a', emissive: '#16a34a', emissiveIntensity: 0.4 }),
    nei: new THREE.MeshStandardMaterial({ color: '#94a3b8', emissive: '#475569', emissiveIntensity: 0.2 }),
    lys: new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.55 }),
    vindu: new THREE.MeshStandardMaterial({ color: '#bfe3ff', emissive: '#bfe3ff', emissiveIntensity: 0.6 }),
};

const TOJ: Record<string, THREE.MeshStandardMaterial> = {};
function toj(farge: string) {
    if (!TOJ[farge]) TOJ[farge] = new THREE.MeshStandardMaterial({ color: farge, roughness: 0.85, flatShading: true });
    return TOJ[farge];
}

/** En person. Sitter eller står; kroppen glir opp når personen reiser seg. */
function Person({
    pos,
    farge,
    star,
    mork = false,
    rotY = 0,
}: {
    pos: THREE.Vector3;
    farge: string;
    star: boolean;
    mork?: boolean;
    rotY?: number;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const mal = star ? 0 : -0.5;
        g.position.y = forste.current ? mal : damp(g.position.y, mal, 5, Math.min(dt, 0.05));
        forste.current = false;
    });
    return (
        <group position={[pos.x, pos.y, pos.z]} rotation={[0, rotY, 0]}>
            <group ref={ref}>
                <mesh material={toj(farge)} position={[0, 0.85, 0]}>
                    <cylinderGeometry args={[0.32, 0.42, 1.3, 10]} />
                </mesh>
                <mesh material={mork ? mat.hudMork : mat.hud} position={[0, 1.75, 0]}>
                    <sphereGeometry args={[0.3, 12, 10]} />
                </mesh>
            </group>
        </group>
    );
}

function Stol({ pos }: { pos: THREE.Vector3 }) {
    return (
        <group position={[pos.x, pos.y, pos.z]}>
            <mesh material={mat.stol} position={[0, 0.45, 0.15]}>
                <boxGeometry args={[0.8, 0.12, 0.7]} />
            </mesh>
            <mesh material={mat.stol} position={[0, 0.75, 0.5]}>
                <boxGeometry args={[0.8, 0.5, 0.1]} />
            </mesh>
        </group>
    );
}

/** Lysende ring på gulvet under den som snakker. */
function Lyskjegle({ pos, synlig }: { pos: THREE.Vector3; synlig: boolean }) {
    if (!synlig) return null;
    return (
        <mesh material={mat.lys} position={[pos.x, pos.y + 0.03, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.1, 32]} />
        </mesh>
    );
}

function Merke({ pos, tekst, farge = '#0f172a', hoyde = 1.9 }: { pos: THREE.Vector3; tekst: string; farge?: string; hoyde?: number }) {
    return (
        <Html position={[pos.x, pos.y + hoyde, pos.z]} center zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-xl bg-white/95 shadow-lg font-bold whitespace-nowrap text-2xl"
                style={{ border: `3px solid ${farge}`, color: farge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

/** Dommerne som kommer inn gjennom døra og går til plassen sin. */
function Dommer({
    i,
    antall,
    farge,
    modus,
    beat,
    playing,
    stemmer,
}: {
    i: number;
    antall: number;
    farge: string;
    modus: Modus;
    beat: number;
    playing: boolean;
    stemmer: boolean | null;
}) {
    const ref = useRef<THREE.Group>(null);
    const kropp = useRef<THREE.Group>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const plass = v(dommerX(antall, i), BENK_Y, BENK_Z);
    useFrame((_, rawDt) => {
        const g = ref.current;
        const k = kropp.current;
        if (!g || !k) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        let p = 1;
        if (modus === 'apning') {
            if (beat < 3) p = 0;
            else if (beat === 3) p = Math.min(1, Math.max(0, (tid.current - 0.8 - i * 0.5) / 3));
        }
        // Fra døra langs bakveggen til plassen.
        const dorPos = v(PLASS.dor.x - 0.5, BENK_Y, BENK_Z);
        g.position.lerpVectors(dorPos, plass, p);
        g.visible = p > 0.01;
        const sitter = modus === 'apning' ? false : modus === 'lagmannsrett' ? beat !== 2 : true;
        const mal = sitter ? -0.5 : 0;
        k.position.y = damp(k.position.y, mal, 5, Math.max(dt, 0.016));
    });
    return (
        <group ref={ref}>
            <group ref={kropp}>
                <mesh material={toj(farge)} position={[0, 0.85, 0]}>
                    <cylinderGeometry args={[0.32, 0.45, 1.3, 10]} />
                </mesh>
                <mesh material={i % 2 ? mat.hudMork : mat.hud} position={[0, 1.75, 0]}>
                    <sphereGeometry args={[0.3, 12, 10]} />
                </mesh>
                {stemmer !== null && (
                    <mesh material={stemmer ? mat.ja : mat.nei} position={[0, 2.55, 0]}>
                        <sphereGeometry args={[0.28, 12, 10]} />
                    </mesh>
                )}
            </group>
        </group>
    );
}

/** Døra i bakveggen, åpen når dommerne kommer inn. */
function Dor({ apen }: { apen: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        g.rotation.y = damp(g.rotation.y, apen ? -1.6 : 0, 3, Math.min(dt, 0.05));
    });
    return (
        <group position={[PLASS.dor.x - 0.8, 0, -9.85]}>
            <mesh material={mat.treMork} position={[0.8, 1.5, -0.02]}>
                <boxGeometry args={[1.9, 3.1, 0.05]} />
            </mesh>
            <group ref={ref}>
                <mesh material={mat.dor} position={[0.8, 1.45, 0.08]}>
                    <boxGeometry args={[1.6, 2.9, 0.12]} />
                </mesh>
            </group>
        </group>
    );
}

/** Farger i lagmannsretten: to fagdommere i svart, fem meddommere i farger. */
function dommerFarger(antall: number) {
    if (antall === 3) return ['#0d9488', '#1e293b', '#b45309'];
    return ['#0d9488', '#b45309', '#1e293b', '#7c3aed', '#1e293b', '#be123c', '#2563eb'];
}

function Sal({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const lag = modus === 'lagmannsrett';
    const antall = lag ? 7 : 3;
    const farger = dommerFarger(antall);
    const tomBenk = modus === 'dommere' && beat >= 3;
    const alleStar = modus === 'apning' && beat >= 4;
    const vitneInne = (modus === 'roller' && beat >= 4) || (lag && beat !== 1 && beat !== 2);
    const bistandInne = modus === 'roller' && beat >= 5;
    const lyser = (rolle: string) =>
        modus === 'roller' &&
        ((rolle === 'aktor' && beat === 1) ||
            (rolle === 'forsvarer' && beat === 2) ||
            (rolle === 'jonas' && (beat === 3 || beat === 5)) ||
            (rolle === 'vitne' && beat === 4) ||
            (rolle === 'bistand' && beat === 5));
    const veggMat = lag ? mat.veggLag : mat.vegg;
    return (
        <>
            {/* Rommet */}
            <mesh material={mat.gulv} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
                <planeGeometry args={[30, 26]} />
            </mesh>
            <mesh material={veggMat} position={[0, 3.5, -10]}>
                <boxGeometry args={[30, 7, 0.2]} />
            </mesh>
            <mesh material={veggMat} position={[-15, 3.5, 2]}>
                <boxGeometry args={[0.2, 7, 26]} />
            </mesh>
            <mesh material={veggMat} position={[15, 3.5, 2]}>
                <boxGeometry args={[0.2, 7, 26]} />
            </mesh>
            {[-9, -3, 3].map((z) => (
                <mesh key={z} material={mat.vindu} position={[-14.85, 3.6, z + 6]}>
                    <boxGeometry args={[0.05, 2.6, 2.2]} />
                </mesh>
            ))}
            <Dor apen={(modus === 'apning' && beat === 3) || (modus === 'dommere' && beat === 3)} />
            {/* Dommerbordet på en forhøyning */}
            <mesh material={mat.treMork} position={[0, BENK_Y / 2, BENK_Z]}>
                <boxGeometry args={[17, BENK_Y, 3.6]} />
            </mesh>
            <mesh material={mat.tre} position={[0, 0.95, BENK_Z + 1.6]}>
                <boxGeometry args={[16, 1.9, 0.35]} />
            </mesh>
            {farger.map((f, i) => (
                <Dommer
                    key={`${antall}-${i}`}
                    i={i}
                    antall={antall}
                    farge={f}
                    modus={modus}
                    beat={beat}
                    playing={playing}
                    stemmer={lag && beat === 2 ? i !== 1 && i !== 4 : null}
                />
            ))}
            {tomBenk &&
                [0, 1, 2].map((i) => (
                    <mesh key={i} material={mat.stol} position={[dommerX(3, i), BENK_Y + 0.9, BENK_Z - 0.4]}>
                        <boxGeometry args={[0.9, 1.6, 0.15]} />
                    </mesh>
                ))}
            {/* Bordene foran: aktor til venstre, forsvareren og Jonas til høyre */}
            {[-5.5, 5.7].map((x) => (
                <mesh key={x} material={mat.tre} position={[x, 0.9, 0.1]}>
                    <boxGeometry args={[4.2, 0.12, 1.4]} />
                </mesh>
            ))}
            {[-5.5, 5.7].map((x) => (
                <mesh key={`f${x}`} material={mat.treMork} position={[x, 0.45, -0.5]}>
                    <boxGeometry args={[4.2, 0.9, 0.1]} />
                </mesh>
            ))}
            {(['aktor', 'forsvarer', 'jonas'] as const).map((r) => (
                <Stol key={r} pos={PLASS[r]} />
            ))}
            {bistandInne && <Stol pos={PLASS.bistand} />}
            <Person pos={PLASS.aktor} farge="#1e293b" star={alleStar || (modus === 'roller' && beat === 1)} />
            <Person pos={PLASS.forsvarer} farge="#1e293b" star={alleStar} mork />
            <Person pos={PLASS.jonas} farge="#2563eb" star={alleStar || (modus === 'roller' && beat === 5)} />
            {bistandInne && <Person pos={PLASS.bistand} farge="#475569" star={false} mork />}
            {/* Vitneboksen midt på gulvet */}
            <mesh material={mat.tre} position={[PLASS.vitne.x, 0.55, PLASS.vitne.z - 0.7]}>
                <boxGeometry args={[1.6, 1.1, 0.12]} />
            </mesh>
            {vitneInne && <Person pos={PLASS.vitne} farge="#be123c" star rotY={Math.PI} />}
            {(['aktor', 'forsvarer', 'jonas', 'vitne', 'bistand'] as const).map((r) => (
                <Lyskjegle key={r} pos={PLASS[r]} synlig={lyser(r)} />
            ))}
            {/* Tilhørerbenkene bak */}
            {[6, 8.4].map((z) => (
                <mesh key={z} material={mat.tre} position={[0, 0.5, z]}>
                    <boxGeometry args={[18, 0.2, 1]} />
                </mesh>
            ))}
            {[
                [-6, 6.3, '#64748b'],
                [-1.5, 6.3, '#a16207'],
                [3.5, 6.3, '#475569'],
                [-4, 8.7, '#0f766e'],
                [2, 8.7, '#9f1239'],
            ].map(([x, z, f]) => (
                <Person key={`${x}${z}`} pos={v(x as number, 0, z as number)} farge={f as string} star={alleStar} />
            ))}
            {/* Merkelapper */}
            {modus === 'apning' && (beat === 1 || beat === 2) && (
                <>
                    <Merke pos={PLASS.jonas} tekst="Jonas" farge="#2563eb" />
                    <Merke pos={PLASS.forsvarer} tekst="Advokaten" hoyde={2.1} />
                </>
            )}
            {modus === 'roller' && beat === 1 && <Merke pos={PLASS.aktor} tekst="Aktor" />}
            {modus === 'roller' && beat === 2 && <Merke pos={PLASS.forsvarer} tekst="Forsvareren" />}
            {modus === 'roller' && beat === 3 && <Merke pos={PLASS.jonas} tekst="Tiltalte" farge="#2563eb" />}
            {modus === 'roller' && beat === 4 && <Merke pos={PLASS.vitne} tekst="Vitne" farge="#be123c" hoyde={2.5} />}
            {modus === 'roller' && beat === 5 && <Merke pos={PLASS.bistand} tekst="Bistandsadvokat" />}
            {modus === 'lagmannsrett' && beat === 0 && <Merke pos={PLASS.vitne} tekst="Vitnet, på nytt" farge="#be123c" hoyde={2.5} />}
            {modus === 'dommere' && beat === 1 && (
                <Merke pos={v(dommerX(3, 1), BENK_Y, BENK_Z)} tekst="Fagdommer" hoyde={2.1} />
            )}
            {modus === 'dommere' && beat === 2 && (
                <>
                    <Merke pos={v(dommerX(3, 0), BENK_Y, BENK_Z)} tekst="Meddommer" farge="#0d9488" hoyde={2.1} />
                    <Merke pos={v(dommerX(3, 2), BENK_Y, BENK_Z)} tekst="Meddommer" farge="#b45309" hoyde={2.1} />
                </>
            )}
        </>
    );
}

/** Det lukkede rommet der dommerne diskuterer, et stykke unna salen. */
function Radsrom() {
    const plasser = [0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
        return { pos: v(RAD_X + Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2), rot: -a - Math.PI / 2 };
    });
    const farger = ['#0d9488', '#1e293b', '#b45309'];
    return (
        <group>
            <mesh material={mat.gulv} rotation={[-Math.PI / 2, 0, 0]} position={[RAD_X, 0, 0]}>
                <planeGeometry args={[12, 12]} />
            </mesh>
            <mesh material={mat.vegg} position={[RAD_X, 2.5, -5]}>
                <boxGeometry args={[12, 5, 0.2]} />
            </mesh>
            <mesh material={mat.vegg} position={[RAD_X - 6, 2.5, 0]}>
                <boxGeometry args={[0.2, 5, 10]} />
            </mesh>
            <mesh material={mat.dor} position={[RAD_X - 2.5, 1.45, -4.85]}>
                <boxGeometry args={[1.6, 2.9, 0.12]} />
            </mesh>
            <mesh material={mat.treMork} position={[RAD_X, 0.45, 0]}>
                <cylinderGeometry args={[0.3, 0.5, 0.9, 10]} />
            </mesh>
            <mesh material={mat.tre} position={[RAD_X, 0.95, 0]}>
                <cylinderGeometry args={[1.6, 1.6, 0.12, 24]} />
            </mesh>
            {[-0.5, 0.4].map((x, i) => (
                <mesh key={x} material={mat.papir} position={[RAD_X + x, 1.03, 0.2 - i * 0.4]} rotation={[0, i * 0.5, 0]}>
                    <boxGeometry args={[0.7, 0.02, 0.9]} />
                </mesh>
            ))}
            {plasser.map((p, i) => (
                <Person key={i} pos={p.pos} farge={farger[i]} star={false} rotY={p.rot} mork={i === 1} />
            ))}
        </group>
    );
}

function Kamerastyring({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        let hopp = false;
        if (beat !== forrige.current) {
            // Mellom salen og rådsrommet klipper kameraet i stedet for å fly gjennom veggen.
            const bytter = modus === 'dommere' && (beat >= 3) !== (forrige.current >= 3);
            hopp = forrige.current >= 0 && bytter;
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        if (forste.current || hopp) {
            camera.position.copy(m.pos);
            se.current.copy(m.se);
            forste.current = false;
        }
        const k = 1 - Math.exp(-1.3 * dt);
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            <color attach="background" args={['#cfd8e3']} />
            <fog attach="fog" args={['#cfd8e3', 40, 90]} />
            <hemisphereLight args={['#ffffff', '#b59b7a', 1.15]} />
            <directionalLight position={[-10, 20, 12]} intensity={1.3} />
            <Sal modus={modus} beat={beat} playing={playing} />
            {modus === 'dommere' && <Radsrom />}
            <Kamerastyring modus={modus} beat={beat} playing={playing} />
        </>
    );
}

/** Kortene i lagmannsretten: stemmene og de to rundene. */
function LagKort({ beat }: { beat: number }) {
    if (beat < 1) return null;
    if (beat <= 2) {
        const farger = dommerFarger(7);
        return (
            <div className="absolute inset-x-0 bottom-[5%] flex justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl flex items-center gap-4"
                >
                    <div className="flex gap-2">
                        {farger.map((f, i) => {
                            const ja = beat === 2 && i !== 1 && i !== 4;
                            return (
                                <div
                                    key={i}
                                    className="rounded-full flex items-center justify-center text-white font-black text-lg"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        background: beat === 2 ? (ja ? '#16a34a' : '#94a3b8') : f,
                                    }}
                                >
                                    {f === '#1e293b' ? 'F' : 'M'}
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {beat === 1 ? '2 fagdommere og 5 meddommere' : 'Eksempel: 5 av 7 sier skyldig'}
                    </div>
                </motion.div>
            </div>
        );
    }
    return (
        <div className="absolute inset-x-0 bottom-[6%] flex justify-center gap-6">
            {[
                { navn: 'Tingretten', tekst: '3 dommere', fra: 3 },
                { navn: 'Lagmannsretten', tekst: '7 nye dommere', fra: 3 },
            ].map((k) => (
                <motion.div
                    key={k.navn}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                    style={{ minWidth: 260 }}
                >
                    <div className="text-xl font-bold uppercase tracking-wide text-slate-500">{k.navn}</div>
                    <div className="text-3xl font-black text-slate-900">{k.tekst}</div>
                    {beat >= 4 && <div className="text-2xl font-black text-teal-600">Skyldig? Ja</div>}
                </motion.div>
            ))}
        </div>
    );
}

/** Kort om hva Jonas er anklaget for, og om rådsrommet. */
function SideKort({ modus, beat }: { modus: Modus; beat: number }) {
    let tekst: string | null = null;
    if (modus === 'apning' && beat === 2) tekst = 'Et halvt år siden: en fest';
    if (modus === 'dommere' && beat === 4) tekst = 'Bare det som ble lagt fram i retten';
    if (modus === 'roller' && beat === 5) tekst = 'Jonas får si noen siste ord';
    if (!tekst) return null;
    return (
        <div className="absolute inset-x-0 bottom-[6%] flex justify-center">
            <motion.div
                key={tekst}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl font-bold text-slate-800"
            >
                {tekst}
            </motion.div>
        </div>
    );
}

export function DomstoleneSal({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'apning';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [0, 8, 16] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <div className="absolute inset-x-0 top-[5%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'lagmannsrett' && <LagKort beat={beat} />}
            <SideKort modus={modus} beat={beat} />
        </div>
    );
}
