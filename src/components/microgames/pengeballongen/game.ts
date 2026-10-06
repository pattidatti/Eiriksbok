// Kjerneløkka: update(g, dt). Tid og vei, varme og løft, pengene, Ueland-gangeren, funn,
// valgene og krasj. Tallene står i tuning.ts, fagreglene i rules.ts.

import { brettFor } from './levels';
import { klaring, krasjer, stig, synk } from './rules';
import { årFor, veiVed } from './terrain';
import type { Game } from './state';
import { TUNING } from './tuning';

export { newGame, type Game } from './state';

const T = TUNING;

export function update(g: Game, dt: number) {
    if (g.mode !== 'play' || dt <= 0) return;
    g.t += dt;
    g.år = årFor(g.t);
    g.x = veiVed(g.t);

    const b = brettFor(g.år);
    if (b !== g.brett) {
        g.brett = b;
        g.hendelser.push({ slag: 'brett', brett: b });
    }

    // Varme og løft: varmen følger knappen litt etter, farten følger varmen.
    const l = T.løft;
    g.varme += ((g.hold ? 1 : 0) - g.varme) * (1 - Math.exp(-dt / l.varmeTau));
    const mål = -stig(g.y) * g.varme + synk(g) * (1 - g.varme);
    const maks = (mål > g.vy && g.vy >= 0 ? l.akselerasjonNed : l.akselerasjon) * dt;
    g.vy += Math.max(-maks, Math.min(maks, mål - g.vy));
    g.y += g.vy * dt;
    const tak = T.ballong.tak + T.ballong.høyde;
    if (g.y < tak) {
        g.y = tak;
        if (g.vy < 0) g.vy = 0;
    }

    // Pengene: hold = bruk, slipp = spar (ganger Ueland).
    if (!g.stabel && g.år >= T.penger.stabelFra) {
        g.stabel = true;
        g.periode = 0;
    }
    if (g.hold) {
        const kr = T.penger.perSek * dt;
        g.brukt += kr;
        g.periode += kr;
    } else g.spart += T.penger.perSek * g.ganger * dt;

    // Ueland-gangeren: i nær-båndet vokser den, utenfor går den straks tilbake til ×1.
    if (g.år >= T.ganger.fra) {
        if (klaring(g) < T.ganger.nær) {
            g.gangerTid += dt;
            while (g.gangerTid >= T.ganger.trinn && g.ganger < T.ganger.maks) {
                g.gangerTid -= T.ganger.trinn;
                g.ganger++;
                g.hendelser.push({ slag: 'ganger', ganger: g.ganger });
            }
        } else {
            if (g.ganger > 1) g.hendelser.push({ slag: 'ganger', ganger: 1 });
            g.ganger = 1;
            g.gangerTid = 0;
        }
        g.gangerSum += g.ganger * dt;
        g.gangerTidSum += dt;
    }

    // Veiskillene: forbi midten av knausen avgjøres hvilken vei du tok.
    for (const k of g.ter.knauser) {
        if (k.valgt || g.x < (k.x0 + k.x1) / 2) continue;
        k.valgt = g.y <= k.topp ? 'over' : 'under';
        const hatt = k.konge && k.valgt === 'over';
        if (hatt) g.hatter += T.veiskille.kongeveiHatt;
        g.hendelser.push({ slag: 'veiskille', vei: k.valgt, hatt });
    }

    // Funn som henger lavt.
    for (const f of g.ter.funn) {
        if (f.tatt || Math.abs(f.x - g.x) > T.funn.radius) continue;
        const midt = g.y - 10;
        if (Math.abs(f.y - midt) < T.funn.radius) {
            f.tatt = true;
            g.funn.push(f.id);
            g.hendelser.push({ slag: 'funn', id: f.id });
        }
    }

    // Valgene: hvert tredje år teller bøndene pengene i stabelen.
    const v = g.ter.valg[g.nesteValg];
    if (v && g.x >= v.x) {
        g.nesteValg++;
        const brukt = Math.round(g.periode);
        if (v.ekte && g.periode > T.penger.grense) {
            g.hendelser.push({ slag: 'stemtUt', år: v.år, brukt });
            g.mode = 'lost';
            g.årsak = 'valg';
            g.hold = false;
            return;
        }
        const hatt = v.år >= T.penger.hattFra;
        if (hatt) g.hatter++;
        g.hendelser.push({ slag: 'valg', år: v.år, ekte: v.ekte, brukt, hatt });
        g.periode = 0;
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
        g.mode = 'lost';
        g.årsak = 'fjell';
        g.hold = false;
        g.hendelser.push({ slag: 'krasj' });
        return;
    }
    if (g.år >= T.år.slutt) {
        g.mode = 'won';
        g.hold = false;
        g.hendelser.push({ slag: 'landet' });
    }
}
