// Kjerneløkka: update(g, dt). Tid og vei, varme og løft, pengene, Ueland-gangeren, funn,
// valgene og krasj. Tallene står i tuning.ts, fagreglene i rules.ts.

import { brettFor } from './levels';
import { fly, iBåndet, kostnad, krasjer, sparing, synk } from './rules';
import { bakke, årFor, veiVed } from './terrain';
import type { Game, Årsak } from './state';
import { TUNING } from './tuning';

export { newGame, type Game } from './state';

const T = TUNING;

function settGanger(g: Game, n: number) {
    if (n === g.ganger) return;
    g.hendelser.push({ slag: 'ganger', ganger: n, fra: g.ganger });
    g.ganger = n;
}

/** Lagre stedet ved valgflagget: en ny sjanse starter herfra. */
function lagreSjekk(g: Game) {
    g.sjekk = {
        t: g.t,
        år: g.år,
        y: g.y,
        nesteValg: g.nesteValg,
        nesteVp: g.nesteVp,
        hatter: g.hatter,
        kongeHatter: g.kongeHatter,
        spart: g.spart,
        brukt: g.brukt,
        perioder: g.perioder.length,
        spor: g.spor.length,
    };
}

/**
 * Krasj eller stemt ut: har du sjanser igjen, starter du ved forrige valgflagg og mister en
 * del av det du har spart. Ellers er runden over.
 */
function slutt(g: Game, årsak: Årsak, brukt?: number) {
    const s = g.sjekk;
    if (s && g.sjanser > 0) {
        g.sjanser--;
        const år = Math.floor(g.år);
        const straff = Math.round(s.spart * T.sjekk.straff);
        g.t = s.t;
        g.år = s.år;
        g.x = veiVed(g.t);
        g.y = Math.max(T.ballong.tak + T.ballong.høyde + 10, Math.min(s.y, bakke(g.ter, g.x) - T.sjekk.over));
        g.vy = 0;
        g.varme = 0.4;
        g.nesteValg = s.nesteValg;
        g.nesteVp = s.nesteVp;
        g.hatter = s.hatter;
        g.kongeHatter = s.kongeHatter;
        g.spart = s.spart - straff;
        g.brukt = s.brukt;
        g.periode = 0;
        g.perioder.length = s.perioder;
        g.spor.length = s.spor;
        g.ganger = 1;
        g.gangerTid = 0;
        g.fallTid = 0;
        g.rolig = g.t - T.løft.rolig.sekunder;
        g.harRor = g.år >= T.år.rorFra;
        g.ror = false;
        for (const k of g.ter.knauser) if (k.x0 > g.x) k.valgt = null;
        for (const st of g.ter.stemmer) if (st.x > g.x) st.tatt = false;
        g.stemmer = g.ter.stemmer.filter((st) => st.tatt).length;
        s.spart = g.spart;
        g.hendelser.push({ slag: 'sjanse', årsak, år, tilbake: Math.floor(s.år), straff });
        return;
    }
    if (årsak === 'valg') g.hendelser.push({ slag: 'stemtUt', år: Math.round(g.år), brukt: brukt ?? 0 });
    else g.hendelser.push({ slag: 'krasj' });
    g.mode = 'lost';
    g.årsak = årsak;
    g.hold = false;
    g.ror = false;
}

export function update(g: Game, dt: number) {
    if (g.mode !== 'play' || dt <= 0) return;
    const førÅr = g.år;
    g.t += dt;
    g.år = årFor(g.t);
    // Regelskiftene midt i runden: Bondetinget (brenneren billigere) og kongens veto (motvind).
    const krysset = (år: number) => førÅr < år && g.år >= år;
    if (krysset(T.penger.førsteEkteValg)) g.hendelser.push({ slag: 'bondeting' });
    if (krysset(T.veto.fra)) g.hendelser.push({ slag: 'veto', slutt: false });
    if (krysset(T.veto.til)) g.hendelser.push({ slag: 'veto', slutt: true });
    g.x = veiVed(g.t);

    const b = brettFor(g.år);
    if (b !== g.brett) {
        g.brett = b;
        g.hendelser.push({ slag: 'brett', brett: b });
    }

    // Varme og løft: varmen følger knappen litt etter, farten følger varmen.
    // Riksretten er over: Stortinget styrer kursen, og eleven får roret.
    if (!g.harRor && g.år >= T.år.rorFra) {
        g.harRor = true;
        g.hendelser.push({ slag: 'roret' });
    }
    fly(g, g.hold, g.ror, g.harRor, synk(g), dt);

    // Pengene: hold = bruk, slipp = spar (ganger Ueland).
    if (!g.stabel && g.år >= T.penger.stabelFra) {
        g.stabel = true;
        g.periode = 0;
    }
    if (g.hold) {
        const kr = kostnad(g) * dt;
        g.brukt += kr;
        g.periode += kr;
    } else g.spart += sparing(g) * dt;

    // Ueland-gangeren: sammenhengende tid i nær-båndet gir et trinn opp; over båndet faller
    // den ett trinn om gangen.
    if (g.år >= T.ganger.fra) {
        const G = T.ganger;
        if (iBåndet(g)) {
            g.fallTid = 0;
            g.gangerTid += dt;
            if (g.gangerTid >= G.trinn) {
                g.gangerTid -= G.trinn;
                if (g.ganger < G.maks) settGanger(g, g.ganger + 1);
            }
        } else {
            // Et kort hopp over båndet (under `fall` s) koster ingenting. Lenger ute: ett trinn
            // ned per `fall` s, og tida mot neste trinn opp begynner på nytt.
            g.fallTid += dt;
            if (g.fallTid >= G.fall) {
                g.fallTid -= G.fall;
                g.gangerTid = 0;
                if (g.ganger > 1) settGanger(g, g.ganger - 1);
            }
        }
        g.gangerSum += g.ganger * dt;
        g.gangerTidSum += dt;
    }

    // Veiskillene: forbi midten av knausen avgjøres hvilken vei du tok.
    for (const k of g.ter.knauser) {
        if (k.valgt || g.x < (k.x0 + k.x1) / 2) continue;
        k.valgt = g.y <= k.topp ? 'over' : 'under';
        const hatt = k.konge && k.valgt === 'over';
        if (hatt) {
            // Kongeveien: trygg, men en embetsmann til, og brenneren blir dyrere for godt.
            g.hatter++;
            g.kongeHatter++;
            if (g.ganger > 1) settGanger(g, 1);
        } else if (k.valgt === 'under' && g.år >= T.ganger.fra) {
            settGanger(g, Math.min(T.ganger.maks, g.ganger + 1));
        }
        g.hendelser.push({ slag: 'veiskille', vei: k.valgt, hatt, konge: k.konge });
    }

    // Funn som henger lavt.
    for (const f of g.ter.funn) {
        if (f.tatt || Math.abs(f.x - g.x) > T.funn.radius) continue;
        const midt = g.y - 10;
        if (Math.abs(f.y - midt) < T.funn.radius) {
            f.tatt = true;
            g.funn.push(f.id);
            if (f.id === 'olaboka') g.olaboka = true;
            g.hendelser.push({ slag: 'funn', id: f.id });
        }
    }

    // Stemmene i rorstrekket: bare den som styrer ned, når dem.
    for (const st of g.ter.stemmer) {
        if (st.tatt || Math.abs(st.x - g.x) > T.funn.radius) continue;
        if (Math.abs(st.y - (g.y - 10)) < T.funn.radius) {
            st.tatt = true;
            g.stemmer++;
            const verdi = T.ror.stemme * g.ganger;
            g.spart += verdi;
            g.hendelser.push({ slag: 'stemme', verdi });
        }
    }

    // Valgene: hvert tredje år teller bøndene pengene i stabelen.
    const v = g.ter.valg[g.nesteValg];
    if (v && g.x >= v.x) {
        g.nesteValg++;
        const brukt = Math.round(g.periode);
        if (v.ekte && g.periode > T.penger.grense) {
            g.perioder.push({ år: v.år, brukt: g.periode });
            slutt(g, 'valg', brukt);
            return;
        }
        if (v.ekte) g.perioder.push({ år: v.år, brukt: g.periode });
        const hatt = v.år >= T.penger.hattFra;
        if (hatt) g.hatter++;
        g.hendelser.push({ slag: 'valg', år: v.år, ekte: v.ekte, brukt, hatt });
        g.periode = 0;
        if (v.ekte) lagreSjekk(g);
    }

    // Nye valg for eleven: rygger, valg, funn og veiskiller som kommer til syne.
    const vp = g.ter.valgpunkter;
    while (g.nesteVp < vp.length && vp[g.nesteVp] < g.x + 640) {
        g.nesteVp++;
        g.valg++;
    }

    // Spøkelsesballongen: høyden per 8 px vei.
    const i = Math.floor(g.x / 8);
    while (g.spor.length <= i) g.spor.push(Math.round(g.y));

    if (krasjer(g)) {
        slutt(g, 'fjell');
        return;
    }
    if (g.år >= T.år.slutt) {
        g.mode = 'won';
        g.hold = false;
        g.hendelser.push({ slag: 'landet' });
    }
}
