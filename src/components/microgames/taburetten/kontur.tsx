// Terrenget eleven surfer på, gjort lesbart: en tykk svertelinje langs toppen av hendene,
// skygge under nedoverbakkene (der du lener og lander), gull der kongens livgarde bærer, og
// rødt der Odelstinget kan anklage (de røde hendene mellom øyene etter valget 1882).

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas } from '../kit';
import { flate, helning, iRødSone, påØy } from './crowd';
import { ANTIKVA, FARGE } from './farger';
import type { Game } from './state';

type GRef = React.MutableRefObject<Game>;

const N = 200;
const FRA = -14;
const LENGDE = 44;
const Z = -0.12;
/** Linja ligger litt over håndflatene, så den leses som overflaten stolen ruller på. */
const LINJE_BUNN = 0.06;
const LINJE_TOPP = 0.17;
/** Skyggen under nedoverbakkene. */
const SKYGGE = 0.75;

const sverte = new THREE.Color(FARGE.hatt);
const gull = new THREE.Color(FARGE.gull);
const rød = new THREE.Color(FARGE.rød);
const c = new THREE.Color();

/** Et bånd med N par av punkter (topp og bunn), farge og alfa per punkt. */
function bånd() {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 2 * 3);
    const col = new Float32Array(N * 2 * 4);
    const idx: number[] = [];
    for (let i = 0; i < N - 1; i++) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setIndex(idx);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    return g;
}

export function Kontur({ gRef }: { gRef: GRef }) {
    const linje = useMemo(() => bånd(), []);
    const skygge = useMemo(() => bånd(), []);
    const skilt = useRef<THREE.Mesh>(null);
    const linjeM = useRef<THREE.Mesh>(null);
    const skyggeM = useRef<THREE.Mesh>(null);
    const cc = useMemo(() => crispCanvas(320, 96), []);
    useEffect(() => {
        cc.draw((ctx, w, h) => {
            ctx.fillStyle = FARGE.rød;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = FARGE.hatt;
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, w - 6, h - 6);
            ctx.fillStyle = '#fff8e8';
            ctx.font = `800 40px ${ANTIKVA}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ANKLAG HER!', w / 2, h / 2 + 2);
        });
    }, [cc]);
    useEffect(
        () => () => {
            linje.dispose();
            skygge.dispose();
            cc.tex.dispose();
        },
        [linje, skygge, cc]
    );

    useFrame(({ clock }) => {
        const g = gRef.current;
        if (!linjeM.current || !skyggeM.current) return;
        const linje = linjeM.current.geometry;
        const skygge = skyggeM.current.geometry;
        const lp = linje.attributes.position.array as Float32Array;
        const lc = linje.attributes.color.array as Float32Array;
        const sp = skygge.attributes.position.array as Float32Array;
        const sc = skygge.attributes.color.array as Float32Array;
        const x0 = Math.floor(g.x) + FRA;
        const puls = 0.75 + 0.25 * Math.sin(clock.elapsedTime * 6);
        let rødStart: number | null = null;
        for (let i = 0; i < N; i++) {
            const x = x0 + (i / (N - 1)) * LENGDE;
            const y = flate(g, x);
            const s = helning(g, x);
            const øy = g.vern && påØy(g, x);
            const rødSone = iRødSone(g, x);
            if (rødSone && rødStart === null && x > g.x + 1) rødStart = x;
            // Linja: gull på øyene, rødt der du kan anklage, ellers sverte.
            const tykk = øy || rødSone ? 1.6 : 1;
            c.copy(øy ? gull : rødSone ? rød : sverte);
            const a = i * 6;
            lp[a] = x;
            lp[a + 1] = y + LINJE_TOPP * tykk;
            lp[a + 2] = Z;
            lp[a + 3] = x;
            lp[a + 4] = y + LINJE_BUNN - (tykk - 1) * 0.06;
            lp[a + 5] = Z;
            const k = i * 8;
            for (const o of [0, 4]) {
                lc[k + o] = c.r;
                lc[k + o + 1] = c.g;
                lc[k + o + 2] = c.b;
                lc[k + o + 3] = rødSone ? puls : 1;
            }
            // Skyggen: bare under nedoverbakkene, sterkest der bakken er brattest.
            const ned = Math.max(0, Math.min(1, -s / 1.2));
            sp[a] = x;
            sp[a + 1] = y + LINJE_BUNN;
            sp[a + 2] = Z - 0.01;
            sp[a + 3] = x;
            sp[a + 4] = Math.max(0, y - SKYGGE);
            sp[a + 5] = Z - 0.01;
            const sk = rødSone ? rød : sverte;
            sc[k] = sk.r;
            sc[k + 1] = sk.g;
            sc[k + 2] = sk.b;
            sc[k + 3] = 0.5 * ned + (rødSone ? 0.25 : 0);
            sc[k + 4] = sk.r;
            sc[k + 5] = sk.g;
            sc[k + 6] = sk.b;
            sc[k + 7] = 0;
        }
        linje.attributes.position.needsUpdate = true;
        linje.attributes.color.needsUpdate = true;
        skygge.attributes.position.needsUpdate = true;
        skygge.attributes.color.needsUpdate = true;
        linje.computeBoundingSphere();
        skygge.computeBoundingSphere();
        // Skiltet står over starten av neste røde sone (eller den stolen er i).
        const sk = skilt.current;
        if (sk) {
            const her = iRødSone(g, g.x);
            const x = her ? g.x + 2.2 : rødStart;
            sk.visible = x !== null;
            if (x !== null)
                sk.position.set(
                    x + 1.6,
                    flate(g, x) + 1.3 + Math.sin(clock.elapsedTime * 3) * 0.08,
                    Z
                );
        }
    });

    return (
        <>
            <mesh ref={skyggeM} geometry={skygge} renderOrder={1} frustumCulled={false}>
                <meshBasicMaterial vertexColors transparent depthWrite={false} />
            </mesh>
            <mesh ref={linjeM} geometry={linje} renderOrder={2} frustumCulled={false}>
                <meshBasicMaterial vertexColors transparent depthWrite={false} />
            </mesh>
            <mesh ref={skilt} visible={false} renderOrder={3}>
                <planeGeometry args={[2.2, 0.66]} />
                <meshBasicMaterial map={cc.tex} transparent depthWrite={false} />
            </mesh>
        </>
    );
}
