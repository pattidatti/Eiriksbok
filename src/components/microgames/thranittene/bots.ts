import { PLACES, dist } from './geo';
import { throwBundle, heatOf, MEETING_DECAY, type G, type IO } from './game';

// Selvspill-robotene for Thranittene. De kaster bunter med throwBundle() - det
// samme grepet som eleven gjør når hen klikker på en bygd - og ser bare det
// eleven ser: ringene, flaggene og de svarte annonsene.

export type BotStyle = 'fokus' | 'stro' | 'overser';

/** Hvor godt en bygd ligger an: nabo-foreninger tenner den, stor bygd gir mye. */
function promise(g: G, i: number) {
    const p = PLACES[i];
    let near = 0;
    for (const o of g.villages)
        if (o.forening && o.i !== i) {
            const d = dist(p.pos, PLACES[o.i].pos);
            if (d < 1.55) near += 1 - d / 1.55;
        }
    return p.pop / 1500 + near * 0.8;
}

export function botTick(g: G, style: BotStyle, io: IO, memo: { k: number }) {
    if (g.stock < 1) return;
    if (style === 'stro') {
        // Ignorerer fagkjernen: sprer avisene jevnt over alle bygdene, én hver.
        memo.k = (memo.k + 1) % PLACES.length;
        throwBundle(g, PLACES[memo.k].pos, io);
        return;
    }
    // Svar på annonsene først (det gjør ikke «overser»).
    if (style === 'fokus') {
        const inFlight = new Set(g.bundles.map((b) => b.target));
        const ann = g.villages
            .filter((v) => v.annonse > 0 && !inFlight.has(v.i))
            .sort((a, b) => b.members - a.members)[0];
        if (ann) {
            throwBundle(g, PLACES[ann.i].pos, io);
            return;
        }
    }
    // Fokus: fyll den bygda som er nærmest å starte egen forening.
    const flying = new Map<number, number>();
    for (const b of g.bundles) flying.set(b.target, (flying.get(b.target) ?? 0) + 1);
    let best = -1;
    let bs = -Infinity;
    for (const v of g.villages) {
        if (v.forening || v.fear > 0) continue;
        const glow = v.glow + (flying.get(v.i) ?? 0) * 0.36;
        if (glow >= 1) continue;
        // Naboene tenner den allerede - la foreningene gjøre jobben.
        if (heatOf(g, v.i) > MEETING_DECAY * 1.1) continue;
        const s = glow * 4 + promise(g, v.i);
        if (s > bs) {
            bs = s;
            best = v.i;
        }
    }
    if (best >= 0) {
        throwBundle(g, PLACES[best].pos, io);
        return;
    }
    // Alt har forening: styrk den minste.
    const small = g.villages
        .filter((v) => v.forening)
        .sort((a, b) => a.members / PLACES[a.i].pop - b.members / PLACES[b.i].pop)[0];
    if (small) throwBundle(g, PLACES[small.i].pos, io);
}
