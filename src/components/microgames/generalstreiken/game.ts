// Kjerneløkka: update(g, dt). Bevegelse rute for rute, hekting, krasj i egen kjede,
// bølgen bakfra etter Grenelle, fristen (30. mai) og nye fabrikker i regionene.

import { DX, MOTSATT, type Game, type Retning } from './state';
import {
    byksVarsel,
    bølgeFart,
    grunnverdi,
    rå,
    planleggByks,
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
    const halen = ki === g.body.length - 1 && !spiser && g.vekst === 0;
    if (ki >= 0 && !halen) {
        const ledd = g.body.length - ki;
        // Krasjet koster med en gang: leddene bak faller av, og hvert ledd trekker litt ekstra.
        const straff = Math.min(
            rå(g) - g.verdi.slice(ki).reduce((s, v) => s + v, 0),
            ledd * TUNING.krasjStraff
        );
        const mistet = g.verdi.slice(ki).reduce((s, v) => s + v, 0) + Math.max(0, straff);
        const celler = g.body.slice(ki);
        g.body.length = ki;
        g.verdi.length = ki;
        g.bevart -= Math.max(0, straff);
        g.bølgeRest = 0;
        g.vekst = 0;
        g.krasj++;
        g.hendelser.push({ k: 'krasj', mistet, ledd, x: p.x, y: p.y, celler });
        krasj = true;
    }
    g.body.unshift({ ...g.hode });
    g.hode = p;
    g.spor[p.y * g.brett.b + p.x] = 1;
    if (spiser) {
        const f = g.fabrikker[fi];
        const x2 = erX2(g, f);
        const v = grunnverdi(g, f);
        const vis = verdiFor(g, f);
        // Fabrikken gir `leddPer` ledd; verdien deles på dem.
        const per = g.brett.leddPer;
        g.verdi.unshift(v / per);
        g.vekst += per - 1;
        g.vekstVerdi = v / per;
        g.fabrikker.splice(fi, 1);
        if (f.navn) g.brukteNavn.add(f.navn);
        // Etter Grenelle: bølgen blir raskere for hver fabrikk du tar (x2 flytter ingenting).
        if (g.grenelle !== null && !x2) g.etterN++;
        g.sisteHekt = g.bt;
        const sisteLiten = f.jobbTil - g.bt < TUNING.sisteLiten;
        g.hendelser.push({ k: 'hekt', x: p.x, y: p.y, verdi: vis, navn: f.navn, x2, sisteLiten });
    } else if (g.vekst > 0) {
        g.vekst--;
        g.verdi.unshift(g.vekstVerdi);
    } else {
        g.body.pop();
    }
    if (krasj && g.brett.splitt && millioner(g) < TUNING.splittetUnder) tap(g, 'splittet');
}

/**
 * TV-sendingen (brett 3): når streiken passerer terskelen, viser TV den i hele verden.
 * Unge i Berkeley, Vest-Berlin, Praha og Oslo protesterer også, og hvert land gir en bonus.
 * Det er artikkelens forklaring på hvorfor protestene spredte seg så fort.
 */
export const TV_LAND = ['Berkeley', 'Vest-Berlin', 'Praha', 'Oslo'];
function tvSending(g: Game) {
    g.tvSendt = true;
    const verdi = TUNING.tv.verdi * TV_LAND.length;
    g.bevart += verdi;
    g.hendelser.push({ k: 'tv', land: TV_LAND, verdi });
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
        // Aldri to fabrikker rett ved siden av hverandre (verdiene skal kunne leses).
        if (g.fabrikker.some((f) => Math.abs(f.x - x) <= 1 && Math.abs(f.y - y) <= 1)) return false;
        const d = Math.abs(x - g.hode.x) + Math.abs(y - g.hode.y);
        return d >= nær && d <= fjern;
    };
    const legg = (x: number, y: number, navn: string | null, reg: string | null) => {
        const f = { x, y, verdi: 0, navn, region: reg, født: g.bt, x2Til: -1, jobbTil: Infinity };
        if (b.tilbake > 0) f.jobbTil = g.bt + b.tilbake;
        // x2 er sjelden, og bare langt ute i provinsen. Ca. 60 % av fabrikkene ligger langt
        // ute, så sjanse / 0,6 der gir ca. 15 % av alle fabrikkene.
        if (b.x2 && fraParis(g, f) >= TUNING.x2.fraParis && g.rng() < TUNING.x2.sjanse / 0.6)
            f.x2Til = g.bt + TUNING.x2.varer;
        g.fabrikker.push(f);
        g.valg++;
    };
    // Klynge (brett 1): tre fabrikker tett i én region, 2-3 ruter mellom. Da må du svinge tett.
    if (b.klynge) {
        for (let forsøk = 0; forsøk < 60; forsøk++) {
            const rg = region(g);
            if (rg.navn === g.sisteRegion) continue;
            const cx = Math.round(rg.x + (g.rng() - 0.5) * rg.r * 2);
            const cy = Math.round(rg.y + (g.rng() - 0.5) * rg.r * 2);
            const a = Math.floor(g.rng() * 4) * (Math.PI / 2);
            const d = 2 + Math.floor(g.rng() * 2);
            const pkt = [0, 1, 2].map((i) => ({
                x: cx + Math.round(Math.cos(a + (i * 2 * Math.PI) / 3) * d),
                y: cy + Math.round(Math.sin(a + (i * 2 * Math.PI) / 3) * d),
            }));
            if (!pkt.every((q) => ledig(q.x, q.y))) continue;
            // Et navn bare hvis den navngitte fabrikken faktisk ligger i denne regionen.
            const navn = b.fabrikker.find(
                (n) => !g.brukteNavn.has(n.navn) && Math.hypot(n.x - rg.x, n.y - rg.y) <= rg.r + 2
            );
            pkt.forEach((q, i) =>
                legg(q.x, q.y, i === 0 && navn && g.rng() < 0.6 ? navn.navn : null, rg.navn)
            );
            g.sisteRegion = rg.navn;
            return;
        }
    }
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
    // Etter Grenelle: helst en region langt fra hodet, en annen enn forrige.
    if (etter) {
        for (let forsøk = 0; forsøk < 40; forsøk++) {
            const rg = region(g);
            if (rg.navn === g.sisteRegion) continue;
            const a = g.rng() * Math.PI * 2;
            const r = Math.sqrt(g.rng()) * rg.r;
            const x = Math.round(rg.x + Math.cos(a) * r);
            const y = Math.round(rg.y + Math.sin(a) * r);
            if (ledig(x, y)) {
                g.sisteRegion = rg.navn;
                return legg(x, y, null, rg.navn);
            }
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
        if (ledig(x, y)) {
            g.sisteRegion = rg.navn;
            return legg(x, y, null, rg.navn);
        }
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
    while (g.fabrikker.length < g.brett.samtidig && !(g.brett.klynge && g.fabrikker.length)) {
        const før = g.fabrikker.length;
        nyFabrikk(g);
        if (g.fabrikker.length === før) break;
    }
    // 30. mai (eller fristen på brett 1 og 2) uten avtale.
    if (g.grenelle === null && g.bt >= g.brett.frist) {
        tap(g, g.brett.knapp ? 'frist' : 'stille');
        return;
    }
    // Brett 1: fabrikker du ikke rekker i tide, går tilbake på jobb.
    for (let i = g.fabrikker.length - 1; i >= 0; i--) {
        const f = g.fabrikker[i];
        if (g.bt >= f.jobbTil) {
            g.fabrikker.splice(i, 1);
            g.hendelser.push({ k: 'tilbake', x: f.x, y: f.y });
        }
    }
    // Brett 2: den nordre broen stenges, så veien vestover deler seg.
    const elv = g.brett.elv;
    if (elv && !g.broStengt && g.bt >= elv.stengesVed) {
        g.broStengt = true;
        for (const c of elv.bro) g.sperret[c.y * g.brett.b + c.x] = 1;
        g.hendelser.push({ k: 'bro', celler: elv.bro });
    }
    if (g.brett.tvVed > 0 && !g.tvSendt && millioner(g) >= g.brett.tvVed) tvSending(g);
    g.steg += fart(g) * dt;
    while (g.steg >= 1 && g.mode === 'play') {
        g.steg -= 1;
        ettSteg(g);
    }
    if (g.mode !== 'play') return;
    // Bølgen spiser kjeden bakfra, ledd for ledd. Når kjeden er borte, tar den hodet.
    if (g.grenelle !== null) {
        // En del kryper jevnt, resten kommer i byks med et blink først.
        const v = bølgeFart(g);
        g.bølgeRest += v * TUNING.byks.kryp * dt;
        if (!g.byksVarslet && byksVarsel(g)) {
            g.byksVarslet = true;
            g.hendelser.push({ k: 'varsel' });
        }
        if (g.bt >= g.byksNeste) {
            const [a, c] = TUNING.byks.hvert;
            const ledd = Math.max(
                1,
                Math.round((1 - TUNING.byks.kryp) * v * ((a + c) / 2) * (0.67 + 0.66 * g.rng()))
            );
            g.bølgeRest += ledd;
            g.hendelser.push({ k: 'byks', ledd });
            planleggByks(g);
        }
        while (g.bølgeRest >= 1) {
            g.bølgeRest -= 1;
            if (!g.body.length) {
                tap(g, 'bølgen');
                return;
            }
            const c = g.body.pop()!;
            g.spor[c.y * g.brett.b + c.x] = 2;
            // Bølgen tar en del av leddets verdi. Resten er vunnet for godt.
            const lv = g.verdi.pop() ?? 0;
            g.bevart += lv * (1 - TUNING.trekk);
            g.hendelser.push({ k: 'spist', mistet: lv * TUNING.trekk, x: c.x, y: c.y });
        }
    }
    const m = millioner(g);
    g.toppMillioner = Math.max(g.toppMillioner, m);
    if (!g.brett.knapp && tiendeler(m) >= g.brett.mål) {
        g.resultat[g.bi] = tiendeler(m);
        neste(g);
    }
}
