// Kjerneløkka: update(g, dt). Bevegelse rute for rute, hekting, krasj i egen kjede,
// bølgen bakfra etter Grenelle, fristen (30. mai) og nye fabrikker.

import { DX, MOTSATT, type Game, type Retning } from './state';
import {
    bølgeFart,
    fart,
    iRute,
    millioner,
    neste,
    neste1,
    nesteBrett,
    tap,
    verdiFor,
} from './rules';
import { TUNING } from './tuning';

export { newGame } from './state';
export type { Game } from './state';

const SIDER: Record<Retning, [Retning, Retning]> = {
    opp: ['venstre', 'høyre'],
    ned: ['høyre', 'venstre'],
    venstre: ['ned', 'opp'],
    høyre: ['opp', 'ned'],
};

const opptatt = (g: Game, x: number, y: number) => g.body.some((c) => c.x === x && c.y === y);

/** Fri strekning rett fram fra (x, y) i retning r. */
function fritt(g: Game, x: number, y: number, r: Retning) {
    let n = 0;
    for (;;) {
        x += DX[r][0];
        y += DX[r][1];
        if (!iRute(g, x, y) || opptatt(g, x, y)) return n;
        n++;
    }
}

/** Ved kartkanten svinger hodet selv dit det er mest plass. Kanten er aldri et tap. */
function vedKanten(g: Game, r: Retning): Retning {
    const [a, b] = SIDER[r];
    const pa = neste1(g.hode, a);
    const pb = neste1(g.hode, b);
    const okA = iRute(g, pa.x, pa.y);
    const okB = iRute(g, pb.x, pb.y);
    if (okA && !okB) return a;
    if (okB && !okA) return b;
    return fritt(g, g.hode.x, g.hode.y, a) >= fritt(g, g.hode.x, g.hode.y, b) ? a : b;
}

export function ettSteg(g: Game) {
    while (g.kø.length) {
        const r = g.kø.shift()!;
        if (r !== MOTSATT[g.retning]) {
            g.retning = r;
            break;
        }
    }
    let p = neste1(g.hode, g.retning);
    if (!iRute(g, p.x, p.y)) {
        g.retning = vedKanten(g, g.retning);
        g.kø.length = 0;
        p = neste1(g.hode, g.retning);
    }
    const fi = g.fabrikker.findIndex((f) => f.x === p.x && f.y === p.y);
    const spiser = fi >= 0;
    // Krasj i egen kjede: alt bak krasjpunktet faller av. Halespissen flytter seg selv.
    let krasj = false;
    const ki = g.body.findIndex((c) => c.x === p.x && c.y === p.y);
    if (ki >= 0 && !(ki === g.body.length - 1 && !spiser)) {
        const mistet = g.verdi.slice(ki).reduce((s, v) => s + v, 0);
        g.body.length = ki;
        g.verdi.length = ki;
        g.bølgeRest = 0;
        g.hendelser.push({ k: 'krasj', mistet });
        krasj = true;
    }
    g.body.unshift({ ...g.hode });
    g.hode = p;
    if (spiser) {
        const f = g.fabrikker[fi];
        const x2 = g.bt < g.x2Til;
        const v = verdiFor(g, f);
        g.verdi.unshift(v);
        g.fabrikker.splice(fi, 1);
        if (f.navn) g.brukteNavn.add(f.navn);
        if (x2) g.x2Til = -1;
        else if (g.bt - g.sisteHekt < TUNING.sammen.vindu) g.x2Til = g.bt + TUNING.sammen.varer;
        g.forrigeHekt = g.sisteHekt;
        g.sisteHekt = g.bt;
        g.hendelser.push({ k: 'hekt', x: p.x, y: p.y, verdi: v, navn: f.navn, x2 });
    } else {
        g.body.pop();
    }
    if (krasj && millioner(g) < TUNING.splittetUnder) tap(g, 'splittet');
}

function nyFabrikk(g: Game) {
    const b = g.brett;
    const fa = TUNING.fabrikk;
    const radius = fa.radius.start + fa.radius.perLedd * g.body.length;
    const ledig = (x: number, y: number) =>
        iRute(g, x, y) &&
        !opptatt(g, x, y) &&
        !(g.hode.x === x && g.hode.y === y) &&
        !g.fabrikker.some((f) => f.x === x && f.y === y) &&
        Math.abs(x - g.hode.x) + Math.abs(y - g.hode.y) >= fa.minAvstand;
    if (g.rng() < fa.navngitt) {
        const navn = b.fabrikker.filter(
            (n) =>
                !g.brukteNavn.has(n.navn) &&
                !g.fabrikker.some((f) => f.navn === n.navn) &&
                Math.hypot(n.x - b.paris.x, n.y - b.paris.y) <= radius * 1.3 &&
                ledig(n.x, n.y)
        );
        if (navn.length) {
            const n = navn[Math.floor(g.rng() * navn.length)];
            g.fabrikker.push({ x: n.x, y: n.y, verdi: 0, navn: n.navn, født: g.bt });
            g.valg++;
            return;
        }
    }
    for (let forsøk = 0; forsøk < 80; forsøk++) {
        const a = g.rng() * Math.PI * 2;
        const r = Math.sqrt(g.rng()) * radius;
        const x = Math.round(b.paris.x + Math.cos(a) * r);
        const y = Math.round(b.paris.y + Math.sin(a) * r);
        if (!ledig(x, y)) continue;
        g.fabrikker.push({ x, y, verdi: 0, navn: null, født: g.bt });
        g.valg++;
        return;
    }
}

export function update(g: Game, dt: number) {
    if (g.mode === 'kort') {
        g.t += dt;
        g.kortIgjen -= dt;
        if (g.kortIgjen <= 0) nesteBrett(g);
        return;
    }
    if (g.mode !== 'play') return;
    g.t += dt;
    g.bt += dt;
    while (g.fabrikker.length < g.brett.samtidig) {
        const før = g.fabrikker.length;
        nyFabrikk(g);
        if (g.fabrikker.length === før) break;
    }
    // 30. mai (eller fristen på brett 1 og 2) uten avtale.
    if (g.grenelle === null && g.bt >= g.brett.frist) {
        tap(g, g.brett.knapp ? 'frist' : 'stille');
        return;
    }
    g.steg += fart(g) * dt;
    while (g.steg >= 1 && g.mode === 'play') {
        g.steg -= 1;
        ettSteg(g);
    }
    if (g.mode !== 'play') return;
    // Bølgen spiser kjeden bakfra, ledd for ledd. Når kjeden er borte, tar den hodet.
    if (g.grenelle !== null) {
        g.bølgeRest += bølgeFart(g) * dt;
        while (g.bølgeRest >= 1) {
            g.bølgeRest -= 1;
            if (!g.body.length) {
                tap(g, 'bølgen');
                return;
            }
            g.body.pop();
            g.verdi.pop();
            g.hendelser.push({ k: 'spist' });
        }
    }
    const m = millioner(g);
    g.toppMillioner = Math.max(g.toppMillioner, m);
    if (!g.brett.knapp && m >= g.brett.mål) {
        g.resultat[g.bi] = Math.round(m * 10) / 10;
        neste(g);
    }
}
