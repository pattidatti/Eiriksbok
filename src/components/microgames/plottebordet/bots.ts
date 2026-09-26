import { BASES, dist, overEngland, type XZ } from './geo';
import { order, raidActive, findRaid, airborne, type G, type IO } from './game';

// Selvspill-robotene for Plottebordet. De gir ordre gjennom order() - det samme
// grepet som eleven gjør når hen drar en brikke - og ser bare plott som står på
// bordet (r.visible), akkurat som eleven.

export type BotStyle = 'radar' | 'kysten' | 'patrulje';

/** Hvor mange fly som allerede er sendt mot raidet. */
function assigned(g: G, id: number) {
    let n = 0;
    for (const q of g.squadrons)
        if (airborne(q) && q.state !== 'hjem' && ((q.order?.kind === 'raid' && q.order.id === id) || q.engaged === id)) n += q.planes;
    return n;
}

/** Nærmeste skvadron som kan ta et nytt oppdrag (klar på bakken, eller i lufta uten mål). */
function freeSquadron(g: G, p: XZ, reserve: number) {
    let best = -1;
    let bd = Infinity;
    const readyOnGround = g.squadrons.filter((q) => q.state === 'klar' && g.crater[q.i] <= 0 && q.planes >= 4).length;
    for (const q of g.squadrons) {
        const idleAir = q.state === 'lufta' && (!q.order || !raidActive(q.order.kind === 'raid' ? findRaid(g, q.order.id) : undefined)) && q.fuel > 12;
        const ground = q.state === 'klar' && g.crater[q.i] <= 0 && q.planes >= 4 && readyOnGround > reserve;
        if (!idleAir && !ground) continue;
        const d = dist(q.pos, p) + (ground ? 0.8 : 0);
        if (d < bd) {
            bd = d;
            best = q.i;
        }
    }
    return best;
}

const PATROL: XZ[] = [
    [-5.4, 3.4],
    [0.2, 3.6],
    [3.4, 3.5],
    [6.2, 2.6],
    [7.6, -1.2],
];

export function botTick(g: G, style: BotStyle, io: IO) {
    if (style === 'patrulje') {
        // Uten radar: hold skvadronene i lufta langs kysten og håp at de ser noe.
        for (const q of g.squadrons) if (q.state === 'klar') order(g, q.i, { p: PATROL[q.i] }, io);
        return;
    }
    const raids = g.raids
        .filter((r) => r.state === 'inn' && r.visible)
        .filter((r) => style === 'radar' || overEngland(r.pos[0], r.pos[1]))
        .sort((a, b) => dist(a.pos, a.target.p) - dist(b.pos, b.target.p));
    for (const r of raids) {
        if (assigned(g, r.id) >= r.size * 0.95) continue;
        const i = freeSquadron(g, r.pos, style === 'radar' && g.day < 33 ? 0 : 0);
        if (i < 0) return;
        order(g, i, { raid: r.id }, io);
        return; // ett grep per tikk, som en elev
    }
    // Skvadroner i lufta uten noe å gjøre: land og tank.
    for (const q of g.squadrons)
        if (q.state === 'lufta' && !q.order && q.fuel < 20) {
            order(g, q.i, { p: BASES[q.i].pos }, io);
            return;
        }
}
