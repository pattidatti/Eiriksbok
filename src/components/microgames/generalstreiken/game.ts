// Kjerneløkka: update(g, dt). Bevegelse rute for rute, hekting, krasj i egen kjede,
// bølgen bakfra etter Grenelle, fristen (30. mai) og nye fabrikker i regionene.

import { DX, MOTSATT, type Game, type Retning } from './state';
import {
    bølgeFart,
    erX2,
    fart,
    fraParis,
    iRute,
    millioner,
    neste,
    neste1,
    nesteBrett,
    tap,
    tiendeler,
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
        const x2 = erX2(g, f);
        const v = verdiFor(g, f);
        g.verdi.unshift(v);
        g.fabrikker.splice(fi, 1);
        if (f.navn) g.brukteNavn.add(f.navn);
        // Etter Grenelle: neste fabrikk gir mer, og bølgen blir raskere.
        if (g.grenelle !== null) g.etterN++;
        g.sisteHekt = g.bt;
        g.hendelser.push({ k: 'hekt', x: p.x, y: p.y, verdi: v, navn: f.navn, x2 });
    } else {
        g.body.pop();
    }
    if (krasj && millioner(g) < TUNING.splittetUnder) tap(g, 'splittet');
}

/** Velger en region etter vekt. */
function region(g: Game) {
    const rs = g.brett.regioner;
    let r = g.rng() * rs.reduce((s, x) => s + x.vekt, 0);
    for (const x of rs) {
        r -= x.vekt;
        if (r <= 0) return x;
    }
    return rs[rs.length - 1];
}

function nyFabrikk(g: Game) {
    const b = g.brett;
    const fa = TUNING.fabrikk;
    const etter = g.grenelle !== null;
    const [nær, fjern] = etter ? fa.etterAvstand : [fa.minAvstand, 999];
    const ledig = (x: number, y: number) => {
        if (!iRute(g, x, y) || opptatt(g, x, y)) return false;
        if (g.fabrikker.some((f) => f.x === x && f.y === y)) return false;
        const d = Math.abs(x - g.hode.x) + Math.abs(y - g.hode.y);
        return d >= nær && d <= fjern;
    };
    const legg = (x: number, y: number, navn: string | null, reg: string | null) => {
        const f = { x, y, verdi: 0, navn, region: reg, født: g.bt, x2Til: -1 };
        // x2 er sjelden, og bare langt ute i provinsen. Ca. 60 % av fabrikkene ligger langt
        // ute, så sjanse / 0,6 der gir ca. 15 % av alle fabrikkene.
        if (b.x2 && fraParis(g, f) >= TUNING.x2.fraParis && g.rng() < TUNING.x2.sjanse / 0.6)
            f.x2Til = g.bt + TUNING.x2.varer;
        g.fabrikker.push(f);
        g.valg++;
    };
    if (g.rng() < fa.navngitt) {
        const navn = b.fabrikker.filter(
            (n) =>
                !g.brukteNavn.has(n.navn) &&
                !g.fabrikker.some((f) => f.navn === n.navn) &&
                ledig(n.x, n.y)
        );
        if (navn.length) {
            const n = navn[Math.floor(g.rng() * navn.length)];
            legg(n.x, n.y, n.navn, null);
            return;
        }
    }
    for (let forsøk = 0; forsøk < 120; forsøk++) {
        if (etter && forsøk < 60) {
            // Etter Grenelle: et sted 10-15 ruter fra hodet, hvor som helst på kartet.
            const d = nær + Math.floor(g.rng() * (fjern - nær + 1));
            const dx = Math.floor(g.rng() * (d + 1));
            const x = g.hode.x + (g.rng() < 0.5 ? -dx : dx);
            const y = g.hode.y + (g.rng() < 0.5 ? dx - d : d - dx);
            if (ledig(x, y)) return legg(x, y, null, null);
            continue;
        }
        const rg = region(g);
        const a = g.rng() * Math.PI * 2;
        const r = Math.sqrt(g.rng()) * rg.r;
        const x = Math.round(rg.x + Math.cos(a) * r);
        const y = Math.round(rg.y + Math.sin(a) * r);
        if (ledig(x, y)) return legg(x, y, null, rg.navn);
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
            // Bølgen tar en del av leddets verdi. Resten er vunnet for godt.
            const v = g.verdi.pop() ?? 0;
            g.bevart += v * (1 - TUNING.trekk);
            g.hendelser.push({ k: 'spist', mistet: v * TUNING.trekk });
        }
    }
    const m = millioner(g);
    g.toppMillioner = Math.max(g.toppMillioner, m);
    if (!g.brett.knapp && tiendeler(m) >= g.brett.mål) {
        g.resultat[g.bi] = tiendeler(m);
        neste(g);
    }
}
