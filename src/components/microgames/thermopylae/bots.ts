import type { Rng } from '../sim';
import {
    alive,
    angleTo,
    attack,
    fwdX,
    fwdZ,
    look,
    setMove,
    setShield,
    setTurn,
    WALL_Z,
    type Enemy,
    type G,
    type IO,
} from './game';

// Selvspill-robotene for Tre dager i porten. De bruker de samme grepene som eleven: gå
// (setMove), snu (look = musa), skjold (setShield) og stikk/dytt (attack). De ser det eleven
// ser: fiender som løfter våpenet, himmelen som mørkner, klatrere på muren.

export type BotStyle = 'seende' | 'halvgod' | 'jeger' | 'tilfeldig';

export const BOTS: Record<
    string,
    { style: BotStyle; forventer: 'vinner' | 'middels' | 'taper'; tilfeldig?: boolean; beskrivelse: string }
> = {
    seende: {
        style: 'seende',
        forventer: 'vinner',
        beskrivelse: 'står i porten, parerer når de løfter våpenet, skjold mot pilene, snur seg dag 3, henter klatrere',
    },
    halvgod: {
        style: 'halvgod',
        forventer: 'middels',
        beskrivelse: 'som den seende, men treg: reagerer bare på to av tre grep og står litt skjevt i porten',
    },
    jeger: {
        style: 'jeger',
        forventer: 'taper',
        beskrivelse: 'ignorerer terrenget: løper ut på stranda etter nærmeste perser (slåss ellers godt)',
    },
    tilfeldig: {
        style: 'tilfeldig',
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'tilfeldige lovlige grep: går, snur, stikker og løfter skjoldet uten plan',
    },
};

const d2 = (g: G, e: { x: number; z: number }) => Math.hypot(e.x - g.px, e.z - g.pz);

/** Gå mot et punkt med WASD, regnet om fra verden til blikket. */
function moveTo(g: G, x: number, z: number) {
    const dx = x - g.px;
    const dz = z - g.pz;
    const L = Math.hypot(dx, dz);
    if (L < 0.12) return setMove(g, 0, 0);
    const k = Math.min(1, L / 0.5) / L;
    const f = (dx * fwdX(g.yaw) + dz * fwdZ(g.yaw)) * k;
    const s = (dx * Math.cos(g.yaw) - dz * Math.sin(g.yaw)) * k;
    setMove(g, f, s);
}

function face(g: G, x: number, z: number, amount = 1) {
    look(g, angleTo(g, x, z) * amount);
}

const OPEN: Enemy['state'][] = ['stagger', 'recover', 'knocked', 'climb', 'toclimb', 'rush', 'plunder'];

function priority(e: Enemy) {
    if (e.state === 'stagger') return 0;
    if (e.state === 'recover' || e.state === 'climb' || e.state === 'toclimb' || e.state === 'rush' || e.state === 'plunder') return 1;
    if (e.kind === 'lev') return 2;
    return 9; // en udødelig med skjoldet oppe: vent til han slår
}

export function botTick(g: G, style: BotStyle, io: IO, rng: Rng, tick: number) {
    if (g.ended) return;
    setTurn(g, 0);
    if (style === 'tilfeldig') return randomTick(g, io, rng);
    if (style === 'halvgod' && tick % 3 === 0) return;

    const home = style === 'halvgod' ? { x: 0.35, z: WALL_Z - 0.1 } : { x: 0, z: WALL_Z };

    // Pilregn på vei: skjold opp i tide.
    if (g.volleyWarn > 0 && g.volleyWarn < 0.9) {
        setShield(g, true);
        if (style !== 'jeger') moveTo(g, home.x, home.z);
        else setMove(g, 0, 0);
        return;
    }

    // Noen løfter våpenet mot meg: snu mot ham og parer i siste øyeblikk.
    const threats = g.enemies.filter((e) => e.state === 'windup' && d2(g, e) < 2.6);
    threats.sort((a, b) => a.timer - b.timer);
    if (threats.length && threats[0].timer <= 0.38) {
        const t = threats[0];
        face(g, t.x, t.z);
        // Et nytt slag: senk og løft skjoldet igjen, så det blir en parering.
        if (g.shield && (g.shieldAt < t.timerStart || g.t - g.shieldAt > 0.3)) setShield(g, false);
        setShield(g, true);
        if (style !== 'jeger') moveTo(g, home.x, home.z);
        else setMove(g, 0, 0);
        return;
    }
    if (g.shield) setShield(g, false);

    // Skyvekampen: dytt når måleren begynner å bli full.
    if (style !== 'jeger' && g.push > (style === 'halvgod' ? 0.75 : 0.55)) {
        setShield(g, true);
        attack(g, io);
        setShield(g, false);
        moveTo(g, home.x, home.z);
        return;
    }

    // Mål for spydet.
    let target: Enemy | null = null;
    let best = 1e9;
    for (const e of g.enemies) {
        if (!alive(e)) continue;
        const d = d2(g, e);
        if (d > 2.7) continue;
        const p = priority(e) * 3 + d;
        if (p < best) {
            best = p;
            target = e;
        }
    }

    if (style === 'jeger') {
        // Løper etter nærmeste perser, hvor han enn står.
        let prey: Enemy | null = null;
        let pd = 1e9;
        for (const e of g.enemies)
            if (alive(e) && e.state !== 'rush' && d2(g, e) < pd) {
                pd = d2(g, e);
                prey = e;
            }
        if (target && priority(target) < 9) {
            face(g, target.x, target.z);
            attack(g, io);
        } else if (prey) face(g, prey.x, prey.z, 0.6);
        if (prey && pd > 1.6) moveTo(g, prey.x, prey.z);
        else setMove(g, 0, 0);
        return;
    }

    // Klatrere og de som har sluppet forbi: hent dem, så tilbake.
    const climber = g.enemies.find(
        (e) => alive(e) && (e.state === 'climb' || e.state === 'toclimb' || e.state === 'plunder' || (e.state === 'rush' && e.z > WALL_Z - 1)) &&
            d2(g, e) < 8,
    );
    const busy = g.enemies.some((e) => alive(e) && OPEN.indexOf(e.state) < 0 && e.state !== 'march' && e.state !== 'wait' && d2(g, e) < 2.2);

    if (target && priority(target) < 9) {
        face(g, target.x, target.z);
        attack(g, io);
    }
    if (climber && (!busy || climber.state === 'rush' || climber.state === 'plunder')) {
        if (!target) face(g, climber.x, climber.z, 0.7);
        moveTo(g, climber.x, climber.z);
        return;
    }
    // Se mot den nærmeste som kommer.
    if (!target) {
        let near: Enemy | null = null;
        let nd = 1e9;
        for (const e of g.enemies)
            if (alive(e) && e.state !== 'rush' && d2(g, e) < nd) {
                nd = d2(g, e);
                near = e;
            }
        if (near && nd < 6) face(g, near.x, near.z, 0.7);
        else face(g, g.px, g.pz - 5, 0.5);
    }
    moveTo(g, home.x, home.z);
}

function randomTick(g: G, io: IO, rng: Rng) {
    const r = rng();
    if (r < 0.3) setMove(g, rng() * 2 - 1, rng() * 2 - 1);
    else if (r < 0.45) look(g, (rng() - 0.5) * 1.6);
    else if (r < 0.75) {
        setShield(g, false);
        attack(g, io);
    } else if (r < 0.9) setShield(g, rng() < 0.5);
    else setMove(g, 0, 0);
}
