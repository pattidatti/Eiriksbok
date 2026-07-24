import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor, ContactShadows } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

// Standardisert R3F-Canvas for mikrospill. Kapsler lyssetting, skygger, fog,
// bakgrunn og en trygg OrbitControls-preset slik at ALLE mikrospill får samme
// visuelle look (lys, lavpoly, varm sol) uten å gjenta ~40 linjer per spill.
//
// Bevisst likt på tvers av spill: ingen LUT/color grading, samme sol-vinkel og
// hemisfærelys. Bytt heller bakgrunn/fog per scene enn lysrigg.
//
//   <MicroCanvas idle={stage === 0} camera={{ position: [13, 9.5, 13], fov: 38 }}>
//       <MyValley stage={stage} />
//   </MicroCanvas>
//
// Chromebook-vennlig (alle mikrospill arver dette):
//  - Render-loopen FRYSES når spillet er utenfor skjermen (IntersectionObserver).
//    Et spill langt nede i en lang artikkel skal ikke male GPU-en mens eleven
//    leser noe annet. Tilstanden beholdes - vi pauser bare frames.
//  - Konservativt skygge-/DPR-budsjett. PerformanceMonitor hever DPR igjen når
//    maskinen har rom, men vi starter alltid lavt for å unngå startspiken.

// Lys-stemninger: distinkt atmosfære uten LUT (kun lysfarge/-vinkel/-styrke + hemi).
// Alle holder seg LYSE (drama fra emnet, ikke mørk UI). 'day' = nøyaktig dagens
// standardrigg, så spill uten `light`-prop ser identiske ut.
export type LightMood = 'day' | 'overcast' | 'golden' | 'noon' | 'twilight' | 'arctic';

interface LightMoodCfg {
    sun: [number, number, number];
    sunColor: string;
    sunIntensity: number;
    ambient: number;
    hemiSky: string;
    hemiGround: string;
    hemiIntensity: number;
}

const LIGHT_MOODS: Record<LightMood, LightMoodCfg> = {
    day: { sun: [10, 16, 8], sunColor: '#ffffff', sunIntensity: 1.15, ambient: 0.62, hemiSky: '#fff3d6', hemiGround: '#5a7045', hemiIntensity: 0.4 },
    overcast: { sun: [6, 18, 6], sunColor: '#eef2f4', sunIntensity: 0.6, ambient: 0.9, hemiSky: '#dfe6ea', hemiGround: '#6a6a5a', hemiIntensity: 0.55 },
    golden: { sun: [16, 8, 10], sunColor: '#ffc98a', sunIntensity: 1.3, ambient: 0.55, hemiSky: '#ffe6c0', hemiGround: '#6a5a40', hemiIntensity: 0.45 },
    noon: { sun: [2, 22, 3], sunColor: '#fffaf0', sunIntensity: 1.5, ambient: 0.5, hemiSky: '#fff6e0', hemiGround: '#5a6a45', hemiIntensity: 0.35 },
    twilight: { sun: [14, 6, 9], sunColor: '#ffb27a', sunIntensity: 0.85, ambient: 0.7, hemiSky: '#f3d2c0', hemiGround: '#5a5570', hemiIntensity: 0.5 },
    arctic: { sun: [10, 15, 8], sunColor: '#eaf2ff', sunIntensity: 1.15, ambient: 0.85, hemiSky: '#eaf4ff', hemiGround: '#8a98a4', hemiIntensity: 0.5 },
};

export interface MicroCanvasProps {
    children: React.ReactNode;
    // Kamera-startposisjon og fov. Default er en behagelig isometrisk-aktig vinkel.
    camera?: { position?: [number, number, number]; fov?: number };
    // Bakgrunnsfarge (himmel). Settes både som clear color og scene-bakgrunn.
    background?: string;
    // Fog [near, far] i samme farge-familie som bakgrunnen. null = av.
    fog?: { color?: string; near: number; far: number } | null;
    // Roter sakte av seg selv mens eleven ikke har gjort noe (idle-tilstand).
    idle?: boolean;
    autoRotateSpeed?: number;
    // OrbitControls. Som standard: ingen zoom/pan (Chromebook), kun rotasjon
    // innenfor trygge polar-vinkler så man aldri ser under bakken.
    enableZoom?: boolean;
    enablePan?: boolean;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    target?: [number, number, number];
    // Lys-stemning: 'day' (default, = dagens rigg), 'overcast', 'golden', 'noon',
    // 'twilight', 'arctic'. Gir distinkt atmosfære uten LUT. Eksplisitte sun*/
    // ambient*-props nedenfor vinner over stemningens verdier.
    light?: LightMood;
    // Solstyrke og -posisjon kan finjusteres. Udefinert = hentes fra `light`-stemningen.
    sunPosition?: [number, number, number];
    sunIntensity?: number;
    ambientIntensity?: number;
    // Slå av OrbitControls helt (f.eks. hvis spillet styrer kamera selv).
    controls?: boolean;
    // Myk kontaktskygge under scenen - billig dybde/forankring. Sett false for å slå av.
    contactShadows?: boolean;
    // Y-nivå for kontaktskyggen (vanligvis bakkenivå 0).
    shadowY?: number;
}

// Uten OrbitControls er det ingen som sikter kameraet - da må vi selv rette det
// mot `target`, ellers ignoreres proppen stille og scenen ligger skjevt i bildet.
function StaticCameraAim({ target }: { target: [number, number, number] }) {
    const camera = useThree((s) => s.camera);
    useEffect(() => {
        camera.lookAt(target[0], target[1], target[2]);
    }, [camera, target]);
    return null;
}

// Mekanisk selvrevisjon: eksponerer window.__microSceneAudit() som harnessen
// (scripts/audit-microgames.mjs) og CI-porten kaller. Fanger de to vanligste
// feilklassene fra storrevisjonen 2026-07-24 maskinelt: modell utenfor
// kamerautsnittet og geometri langt under origo (begravd). Terreng-/vannplan
// (svært brede mesh) holdes utenfor målingen.
function SceneAuditProbe() {
    const scene = useThree((s) => s.scene);
    const camera = useThree((s) => s.camera);
    useEffect(() => {
        const w = window as unknown as { __microSceneAudit?: () => string[] };
        w.__microSceneAudit = () => {
            const warnings: string[] = [];
            const model = new THREE.Box3();
            const tmp = new THREE.Box3();
            let meshCount = 0;
            scene.updateMatrixWorld(true);
            scene.traverse((o) => {
                const m = o as THREE.Mesh;
                if (!m.isMesh || !m.visible || !m.geometry) return;
                meshCount++;
                tmp.setFromObject(m);
                if (tmp.isEmpty()) return;
                // Parkerte pool-objekter (partikler o.l. gjemmes ofte på y≈-999)
                // er ikke scene-innhold - hold dem utenfor målingen.
                if (tmp.max.y < -50) return;
                const sx = tmp.max.x - tmp.min.x;
                const sz = tmp.max.z - tmp.min.z;
                if (sx > 26 || sz > 26) return; // bakke/hav - ikke "modellen"
                model.union(tmp);
            });
            if (meshCount === 0) {
                warnings.push('[scene-audit] ingen synlige mesh i scenen');
                return warnings;
            }
            if (!model.isEmpty()) {
                // Terskel -5: noen spill senker innhold bevisst (skip som synker
                // i Fimreite ligger på ~-4.5). Sjekken skal kun ta det groteske.
                if (model.min.y < -5) {
                    warnings.push(
                        `[scene-audit] geometri ned til y=${model.min.y.toFixed(1)} - begravd under bakken?`
                    );
                }
                // Punktprøve: prosjiser et 3x3x3-rutenett over modellboksen og
                // tell andelen som lander i utsnittet. (Boks-hjørner/-areal er
                // upålitelig: punkter nær kameraet eksploderer i projeksjonen.)
                let inside = 0;
                const p = new THREE.Vector3();
                for (let ix = 0; ix < 3; ix++)
                    for (let iy = 0; iy < 3; iy++)
                        for (let iz = 0; iz < 3; iz++) {
                            p.set(
                                model.min.x + ((model.max.x - model.min.x) * ix) / 2,
                                model.min.y + ((model.max.y - model.min.y) * iy) / 2,
                                model.min.z + ((model.max.z - model.min.z) * iz) / 2
                            ).project(camera);
                            if (p.z < 1 && Math.abs(p.x) <= 1.1 && Math.abs(p.y) <= 1.1)
                                inside++;
                        }
                const visibleFrac = inside / 27;
                (window as unknown as { __microSceneAuditDebug?: unknown }).__microSceneAuditDebug =
                    {
                        box: { min: model.min.toArray(), max: model.max.toArray() },
                        visibleFrac,
                        meshCount,
                        camPos: camera.position.toArray(),
                    };
                // Terskel 0.45: kalibrert 2026-07-24 mot 8 friske spill
                // (0.56-1.0) og et bortvendt-kamera-sabotasjespill (0.33).
                if (visibleFrac < 0.45) {
                    warnings.push(
                        `[scene-audit] bare ${inside}/27 prøvepunkter i modellen ligger i kamerautsnittet - feil innramming?`
                    );
                }
            }
            return warnings;
        };
        return () => {
            delete w.__microSceneAudit;
        };
    }, [scene, camera]);
    return null;
}

export const MicroCanvas: React.FC<MicroCanvasProps> = ({
    children,
    camera = { position: [13, 9.5, 13], fov: 38 },
    background = '#bfe0f2',
    fog = { near: 26, far: 50 },
    idle = false,
    autoRotateSpeed = 0.45,
    enableZoom = false,
    enablePan = false,
    minPolarAngle = Math.PI / 7,
    maxPolarAngle = Math.PI / 2.4,
    target = [0, 0.5, 0],
    light = 'day',
    sunPosition,
    sunIntensity,
    ambientIntensity,
    controls = true,
    contactShadows = true,
    shadowY = 0,
}) => {
    const fogColor = fog?.color ?? background;
    // Lys-stemningen gir defaults; eksplisitte props vinner.
    const mood = LIGHT_MOODS[light];
    const sunPos = sunPosition ?? mood.sun;
    const sunInt = sunIntensity ?? mood.sunIntensity;
    const ambInt = ambientIntensity ?? mood.ambient;
    // Reduserer oppløsning automatisk hvis bildeflyten faller (svake Chromebooks),
    // og hever den igjen når det er rom. Starter på 1 - den billigste - og lar
    // PerformanceMonitor klatre til maks 1.5 først når maskinen viser at den
    // tåler det. (Tidligere [1, 2] ga en startspike som veltet billige maskiner.)
    const [dpr, setDpr] = useState<number | [number, number]>(1);
    // Respekter prefers-reduced-motion: ingen auto-rotasjon for de som ber om ro.
    const reduce = useReducedMotion();

    // DEV-vakthund: idle-rotasjon virker bare med OrbitControls - si det høyt i
    // stedet for å ignorere proppen stille.
    useEffect(() => {
        if (import.meta.env.DEV && !controls && idle) {
            console.warn('[kit/MicroCanvas] idle (auto-rotasjon) krever controls: true - ignoreres.');
        }
    }, [controls, idle]);

    // Frys render-loopen når spillet er utenfor skjermen. Alle mikrospill bruker
    // useFrame (kontinuerlig animasjon), så uten dette maler hvert mountet spill
    // GPU-en i 60 fps for alltid - også scrollet ut av syne. Det er den største
    // enkeltårsaken til at viftefrie Chromebooker struper og krasjer fanen.
    const wrapRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(true);
    useEffect(() => {
        const el = wrapRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const io = new IntersectionObserver(
            ([entry]) => setActive(entry.isIntersecting),
            // Litt margin så loopen er varm idet vinduet rulles inn i syne.
            { rootMargin: '200px 0px' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: camera.position ?? [13, 9.5, 13], fov: camera.fov ?? 38 }}
                gl={{ antialias: true }}
                dpr={dpr}
                // 'always' mens synlig, 'never' fryser loopen uten å rive ned
                // konteksten - tilstand og siste frame beholdes.
                frameloop={active ? 'always' : 'never'}
                shadows
            >
                <PerformanceMonitor
                    onDecline={() => setDpr(1)}
                    onIncline={() => setDpr([1, 1.5])}
                    flipflops={3}
                    onFallback={() => setDpr(1)}
                />
                <color attach="background" args={[background]} />
                {fog && <fog attach="fog" args={[fogColor, fog.near, fog.far]} />}

                <ambientLight intensity={ambInt} />
                <hemisphereLight args={[mood.hemiSky, mood.hemiGround, mood.hemiIntensity]} />
                <directionalLight
                    position={sunPos}
                    intensity={sunInt}
                    color={mood.sunColor}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-20}
                    shadow-camera-right={20}
                    shadow-camera-top={20}
                    shadow-camera-bottom={-20}
                />

                {children}

                {contactShadows && (
                    <ContactShadows
                        position={[0, shadowY + 0.01, 0]}
                        opacity={0.38}
                        scale={42}
                        blur={2.4}
                        far={14}
                        resolution={512}
                        color="#1e293b"
                    />
                )}

                {controls ? (
                    <OrbitControls
                        makeDefault
                        enableZoom={enableZoom}
                        enablePan={enablePan}
                        minPolarAngle={minPolarAngle}
                        maxPolarAngle={maxPolarAngle}
                        autoRotate={idle && !reduce}
                        autoRotateSpeed={autoRotateSpeed}
                        target={target}
                    />
                ) : (
                    <StaticCameraAim target={target} />
                )}
                <SceneAuditProbe />
            </Canvas>
        </div>
    );
};
