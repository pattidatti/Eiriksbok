// Analyse for tuning (kjøres med tsx, ikke en del av spillet):
//   npx tsx src/components/microgames/pengeballongen/analyse.ts [runder]
// Viser per robot: seier, poeng, snitt-ganger og hvor mye av valggrensen den bruker tidlig og sent.

import { BOT_EVERY, PLAYTEST_DT } from '../playtest';
import { seeded } from '../sim';
import { BOTS } from './bots';
import { newGame, update } from './game';
import { TUNING } from './tuning';

const median = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const pct = (a: number[], q: number) => {
    const s = [...a].sort((x, y) => x - y);
    return s.length ? s[Math.floor(s.length * q)] : 0;
};

export function analyser(runder = 100) {
    const linjer: string[] = [];
    for (const [navn, bot] of Object.entries(BOTS)) {
        const poeng: number[] = [];
        const ganger: number[] = [];
        const tidlig: number[] = [];
        const sent: number[] = [];
        const under: number[] = [];
        let seire = 0;
        const tap: Record<string, number> = {};
        for (let r = 0; r < runder; r++) {
            const seed = 1000 + r * 7919;
            const g = newGame(seed);
            const grep = bot.make(seeded(seed + 1));
            let neste = 0;
            let klokke = 0;
            let knauser = 0;
            let lave = 0;
            // Egen klokke (som simuleringen): spilltida spoles tilbake ved en ny sjanse.
            while (g.mode === 'play' && klokke < 260) {
                if (klokke >= neste - 1e-9) {
                    grep(g);
                    neste += BOT_EVERY;
                }
                update(g, PLAYTEST_DT);
                klokke += PLAYTEST_DT;
                for (const h of g.hendelser)
                    if (h.slag === 'veiskille' && h.konge) {
                        knauser++;
                        if (h.vei === 'under') lave++;
                    }
                g.hendelser.length = 0;
            }
            if (g.mode === 'won') seire++;
            else {
                const k = `${g.årsak} ${Math.floor(g.år / 10) * 10}`;
                tap[k] = (tap[k] ?? 0) + 1;
            }
            poeng.push(Math.floor(g.spart));
            if (g.gangerTidSum > 0) ganger.push(g.gangerSum / g.gangerTidSum);
            const gr = TUNING.penger.grense;
            for (const p of g.perioder) {
                if (p.år <= 1848) tidlig.push(p.brukt / gr);
                if (p.år >= 1866) sent.push(p.brukt / gr);
            }
            if (knauser) under.push(lave / knauser);
        }
        const f = (x: number) => x.toFixed(2);
        linjer.push(
            `${navn.padEnd(11)} seier ${Math.round((100 * seire) / runder)} %  poeng ${median(poeng)} (p10 ${pct(poeng, 0.1)}, p90 ${pct(poeng, 0.9)})  ganger ${f(median(ganger))}  grense tidlig ${f(median(tidlig))} sent ${f(median(sent))} (p90 ${f(pct(sent, 0.9))})  under ${f(median(under))}  tap ${JSON.stringify(tap)}`
        );
    }
    return linjer.join('\n');
}

const proc = (globalThis as { process?: { argv: string[] } }).process;
if (proc?.argv[1]?.includes('analyse')) console.log(analyser(Number(proc.argv[2] ?? 100)));
