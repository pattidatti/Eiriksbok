import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ORDERS } from './tuning';
import { slagDef, type G } from './game';
import { canCall, squadOf, STRIKE_FROM, ROCKET_T, type Barrage } from './orders';
import { MARKS, lift } from './ground';
import { modelsFor, propeller, figureMaterial } from './models';
import type { FxPool } from './fxPool';
import type { Speed } from './world';

// Visningen av ordrene i bølgen: siktet under musa, sperreild-sonen som teller ned, rakettflyet
// som stuper inn og skyter, kompaniet som er valgt og målet det går mot. Reglene: orders.ts.

const AIM_KIND = { sperre: 1, rakett: 2, snik: 3, kompani: 0 } as const;

interface Local {
    /** Sperreilden som vises (blir stående litt etter at spillet er ferdig med den). */
    zone: Barrage | null;
    zoneT: number;
    zoneSeen: Barrage | null;
    strike: Barrage | null;
    strikeT: number;
    fired: number;
    goalKey: string;
    goalT: number;
}

export function OrderView({ gRef, fxRef, speedRef, pointer, sfx }: { gRef: React.MutableRefObject<G>; fxRef: React.MutableRefObject<FxPool>; speedRef: Speed; pointer: React.MutableRefObject<[number, number]>; sfx: (n: string) => void }) {
    const plane = useRef<THREE.Group>(null);
    const props = useRef<THREE.Group>(null);
    const L = useRef<Local>({ zone: null, zoneT: 0, zoneSeen: null, strike: null, strikeT: 0, fired: 0, goalKey: '', goalT: 0 });
    useFrame((_, raw) => {
        const g = gRef.current;
        const fx = fxRef.current;
        const s = L.current;
        const dt = Math.min(0.05, raw) * speedRef.current;
        const o = g.ord;
        const def = slagDef(g);
        const wave = g.phase === 'wave';

        // Siktet under musa (gult = lov, rødt = ingen i nettet ser dit). Snikskytteren som sikter: trådkors på målet.
        const [px, pz] = pointer.current;
        if (wave && o.armed && o.armed !== 'kompani') {
            const k = AIM_KIND[o.armed];
            const r = o.armed === 'sperre' ? ORDERS.sperreild.radius : o.armed === 'rakett' ? ORDERS.rakett.lengde : 0.55;
            MARKS.uAim.value.set(px, pz, r, canCall(g, o.armed, px, pz) ? k : -k);
        } else if (wave && o.snipe) {
            const e = g.enemies.find((v) => v.id === o.snipe!.id);
            if (e) MARKS.uAim.value.set(e.x, e.z, 0.55 * (1 - (o.snipe.t / ORDERS.snik.sikt) * 0.5), -3);
        } else MARKS.uAim.value.w = 0;

        // Sperreilden: signalrakett, fjern torden, hyl, to innskytingsskudd, så salven.
        if (o.sperre && o.sperre !== s.zoneSeen) {
            s.zoneSeen = o.sperre;
            s.zone = o.sperre;
            s.zoneT = 0;
            const [hx, hz] = def.hq;
            const { x, z } = o.sperre;
            const delay = ORDERS.sperreild.forsinkelse;
            fx.signal(hx - 0.4, hz + 0.1);
            sfx('signal');
            fx.after(0.55, () => sfx('fjernSalve'));
            fx.after(delay - 1.3, () => sfx('hyl'));
            for (const t of [delay - 0.9, delay - 0.5]) {
                fx.after(t, () => {
                    const a = Math.random() * Math.PI * 2;
                    fx.blast(x + Math.cos(a) * 1.1, z + Math.sin(a) * 1.1);
                    sfx('nedslag');
                });
            }
        }
        if (s.zone) {
            s.zoneT += dt;
            const p = s.zoneT / ORDERS.sperreild.forsinkelse;
            MARKS.uZone.value.set(s.zone.x, s.zone.z, ORDERS.sperreild.radius, Math.min(p, 1.66));
            if (p > 1.7 || !wave) {
                // Røykteppet blir hengende over området etterpå.
                if (wave) for (let i = 0; i < 10; i++) fx.puff('røyk', s.zone.x + (Math.random() - 0.5) * 3, 0.3, s.zone.z + (Math.random() - 0.5) * 3, { r: 0.45, grow: 2.6, life: 5, up: 0.12, spread: 0.3 });
                s.zone = null;
                MARKS.uZone.value.w = 0;
            }
        }

        // Rakettflyet: kommer lavt inn fra vest, stuper, skyter rakettene og stiger ut mot øst.
        if (o.strike && o.strike !== s.strike) {
            s.strike = o.strike;
            s.strikeT = 0;
            s.fired = 0;
            sfx('typhoon');
        }
        const pl = plane.current;
        if (pl) {
            const st = s.strike;
            pl.visible = !!st;
            if (st) {
                s.strikeT += dt;
                const t = s.strikeT;
                const fart = ORDERS.rakett.fart;
                const x = st.x - STRIKE_FROM + fart * t;
                const dist = x - st.x;
                // Høyden: 5 langt ute, ned til 1,4 over linja, opp igjen etterpå.
                const alt = 1.4 + Math.min(3.6, Math.abs(dist) * (dist < 0 ? 0.45 : 0.7));
                pl.position.set(x, alt + lift(def, x, st.z), st.z);
                // Nesa ned i stupet, opp når det stiger ut (modellen peker mot +x).
                pl.rotation.set(0, 0, dist < -0.6 ? -0.4 : dist > 0.6 ? 0.55 : 0);
                if (props.current) for (const c of props.current.children) c.rotation.x += dt * 46;
                for (; s.fired < st.shells.length && st.shells[s.fired][2] - ROCKET_T <= t; s.fired++) {
                    const [sx, sz] = st.shells[s.fired];
                    fx.rocket(x + 0.3, alt, st.z + (s.fired % 2 ? 0.25 : -0.25), sx, sz, ROCKET_T);
                    sfx('rakett');
                }
                const first = st.shells[0][2];
                MARKS.uStrike.value.set(st.x, st.z, ORDERS.rakett.lengde, wave ? Math.min(1.7, t / first) : 0);
                if (x > st.x + 14) {
                    s.strike = null;
                    MARKS.uStrike.value.w = 0;
                }
            } else MARKS.uStrike.value.w = 0;
        }

        // Kompaniet: hvit ring når det er valgt, og målet det går mot.
        const u = wave ? squadOf(g) : undefined;
        MARKS.uSel.value.set(u?.x ?? 0, u?.z ?? 0, u && o.armed === 'kompani' ? 1 : 0, 0);
        const going = u && ((u.follow ?? -1) >= 0 || Math.hypot(u.tx - u.x, u.tz - u.z) > 0.15);
        if (u && going) {
            const e = (u.follow ?? -1) >= 0 ? g.enemies.find((v) => v.id === u.follow) : undefined;
            const gx = e ? e.x : u.tx;
            const gz = e ? e.z : u.tz;
            const key = e ? `e${e.id}` : `${u.tx.toFixed(2)},${u.tz.toFixed(2)}`;
            if (key !== s.goalKey) {
                s.goalKey = key;
                s.goalT = 0;
            }
            s.goalT += Math.min(0.05, raw);
            MARKS.uGoal.value.set(gx, gz, s.goalT, 1);
        } else MARKS.uGoal.value.w = 0;
    });
    const set = modelsFor('kyst');
    return (
        <group ref={plane} visible={false} scale={1.9}>
            <mesh geometry={set.unit.jag} material={figureMaterial()} />
            <group ref={props}>
                <mesh geometry={propeller()} material={figureMaterial()} position={[0.34, 0, 0]} />
            </group>
        </group>
    );
}
