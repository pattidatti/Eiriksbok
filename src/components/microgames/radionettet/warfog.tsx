import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import { MAP_D, MAP_W, SLAG } from './levels';
import { LOOK, type Look } from './models';
import { waveDef, type G } from './game';
import { CLOCK, DENS, MAX, flashes, fogFlash } from './fogState';

// Krigståka rundt kartet: tykk røyk og dis som ruller utenfor brettet, og artilleri som blinker
// inne i den. Tre lag med flate plan i hver sin høyde gir dybde i det skrå kameraet; glimtene er
// lys inne i tåka (`fogFlash`), ikke partikler, så de koster ingenting ekstra å tegne.

const COLOR: Record<Look, string> = { kyst: '#7d8584', ørken: '#c2ae86', steppe: '#8f8468', vinter: '#c3cbd1' };

const VERT = `
varying vec2 vW;
void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = `
uniform float uTime;
uniform float uSeed;
uniform float uDens;
uniform float uLayer;
uniform vec2 uShift;
uniform vec3 uCol;
uniform vec4 uFlash[${MAX}];
varying vec2 vW;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
float n(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return n(p) * 0.55 + n(p * 2.1 + 3.7) * 0.3 + n(p * 4.3 + 7.1) * 0.15; }
float box(vec2 p, vec2 a, vec2 b) {
    vec2 c = (a + b) * 0.5, e = (b - a) * 0.5;
    vec2 d = abs(p - c) - e;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
void main() {
    // Avstanden fra brettet (og flyplassen til venstre): tåka begynner like utenfor kanten.
    // Masken regnes på bakken bak tåka (langs blikket), ellers glir de høye lagene inn over brettet.
    vec2 gp = vW - uShift;
    float d = min(box(gp, vec2(0.0), vec2(${MAP_W}.0, ${MAP_D}.0)), box(gp, vec2(-2.9, 6.6), vec2(0.0, ${MAP_D}.0)));
    float edge = smoothstep(0.2, 3.2, d);
    vec2 wind = vec2(uTime * 0.09, uTime * 0.035);
    float cloud = fbm(vW * 0.32 + wind + uSeed) * 0.75 + fbm(vW * 0.9 - wind * 1.7) * 0.4;
    float a = edge * smoothstep(0.2, 0.8, cloud + edge * 0.4) * uDens * uLayer;
    if (a < 0.004) discard;
    // Artilleriet lyser opp tåka innenfra.
    float glow = 0.0;
    for (int i = 0; i < ${MAX}; i++) {
        vec4 f = uFlash[i];
        if (f.z <= 0.0) continue;
        vec2 q = gp - f.xy;
        glow += f.z * exp(-dot(q, q) / (f.w * f.w));
    }
    glow = min(glow, 1.6);
    vec3 warm = vec3(1.9, 1.05, 0.45);
    vec3 col = mix(uCol * (0.82 + cloud * 0.3), warm, min(1.0, glow * 0.9));
    gl_FragColor = vec4(col, min(0.94, a + glow * 0.25 * edge));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;

function Layer({ y, seed, col }: { y: number; seed: number; col: string }) {
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader: VERT,
                fragmentShader: FRAG,
                transparent: true,
                depthWrite: false,
                uniforms: {
                    uTime: CLOCK,
                    uSeed: { value: seed },
                    uDens: DENS,
                    uLayer: { value: y > 1 ? 0.7 : 1 },
                    // Kameraet ser 48 grader ned fra sørøst (world.tsx CAM_DIR): xz / y.
                    uShift: { value: new THREE.Vector2(0.445 * y, 0.777 * y) },
                    uCol: { value: new THREE.Color(col) },
                    uFlash: { value: flashes },
                },
            }),
        [seed, col, y]
    );
    return (
        <mesh rotation-x={-Math.PI / 2} position={[MAP_W / 2, y, MAP_D / 2]} material={mat} renderOrder={2} userData={{ sceneAuditIgnore: true }}>
            <planeGeometry args={[60, 50]} />
        </mesh>
    );
}

/** Et punkt i tåkebeltet: helst på fiendens side (høyre og oppe), noen bak egne linjer. */
function spot(enemy: boolean): [number, number] {
    if (enemy) return Math.random() < 0.7 ? [MAP_W + 1.5 + Math.random() * 3.5, -1 + Math.random() * (MAP_D + 2)] : [Math.random() * MAP_W, -1.5 - Math.random() * 3];
    return Math.random() < 0.5 ? [Math.random() * MAP_W, MAP_D + 1.5 + Math.random() * 3] : [-3.5 - Math.random() * 3, Math.random() * 6];
}

export function WarFog({ gRef, speedRef, sfx }: { gRef: React.MutableRefObject<G>; speedRef: React.MutableRefObject<number>; sfx?: (name: string) => void }) {
    const q = useQuality();
    const t = useRef({ next: 1, salvo: 0, sx: 0, sz: 0, dx: 0, dz: 0, thunder: 0 });
    const [slag, setSlag] = useState(0);
    useFrame((_, raw) => {
        const real = Math.min(0.05, raw);
        const dt = real * Math.max(0.15, speedRef.current);
        CLOCK.value += dt;
        const g = gRef.current;
        if (g.slag !== slag) setSlag(g.slag);
        // Tåka er tettere når sikten er dårlig (Bastogne), og litt tettere i bølgen.
        const want = ((waveDef(g).sikt ?? 1) < 1 ? 1.25 : 0.85) + (g.phase === 'wave' ? 0.1 : 0);
        DENS.value += (want - DENS.value) * Math.min(1, real * 0.8);
        // Glimtene svinner fort, med et lite flimmer.
        for (const f of flashes) if (f.z > 0) f.z = Math.max(0, f.z - dt * (3 + Math.random() * 4));
        if (speedRef.current <= 0) return;
        const s = t.current;
        const wave = g.phase === 'wave';
        // En salve: tre til seks glimt etter hverandre langs en linje.
        if (s.salvo > 0) {
            s.next -= dt;
            if (s.next <= 0) {
                s.salvo--;
                s.next = 0.07 + Math.random() * 0.14;
                fogFlash(s.sx + s.dx * s.salvo, s.sz + s.dz * s.salvo, 0.7 + Math.random() * 0.5, 1.6 + Math.random());
            }
            return;
        }
        s.next -= dt;
        if (s.next > 0) return;
        s.next = wave ? 0.25 + Math.random() * 0.8 : 1.4 + Math.random() * 3;
        const enemy = Math.random() < 0.75;
        const [x, z] = spot(enemy);
        if (wave && Math.random() < 0.3) {
            s.salvo = 3 + ((Math.random() * 4) | 0);
            s.sx = x;
            s.sz = z;
            const a = Math.random() * Math.PI * 2;
            s.dx = Math.cos(a) * 0.7;
            s.dz = Math.sin(a) * 0.7;
        }
        fogFlash(x, z, (enemy ? 1 : 0.6) * (0.8 + Math.random() * 0.6), 1.8 + Math.random() * 1.4);
        // Tordenen kommer etter glimtet, og ikke for hvert eneste.
        s.thunder -= 1;
        if (s.thunder <= 0) {
            s.thunder = wave ? 3 : 1;
            const delay = 0.4 + Math.random() * 0.9;
            setTimeout(() => sfx?.('fjern'), delay * 1000);
        }
    });
    const look = LOOK[SLAG[slag]?.id] ?? 'kyst';
    const layers = q.tier === 'lav' ? [0.35, 1.3] : [0.2, 0.75, 1.5];
    return (
        <>
            {layers.map((y, i) => (
                <Layer key={`${look}${i}`} y={y} seed={i * 7.3 + 1} col={COLOR[look]} />
            ))}
        </>
    );
}
