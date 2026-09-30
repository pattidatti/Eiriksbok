import { newGame, update, progress, pressure, finalScore, slagDef, CAUSE_TEXT, type G, type IO } from './game';
import { botTick, BOTS } from './bots';
import { TOTAL_WAVES } from './levels';
import { seeded, type SimSpec } from '../sim';
import { PLAYTEST_DT, BOT_EVERY } from '../playtest';

// Simuleringen av Radionettet: samme regler og roboter som Radionettet3D.tsx.

interface W {
    g: G;
    io: IO;
    tick: number;
}

export function silentIO(): IO {
    return { sfx: () => {}, banner: () => {}, lesson: () => {}, event: () => {} };
}

export function årsak(g: G) {
    if (!g.cause) return undefined;
    return `${CAUSE_TEXT[g.cause].tittel.toLowerCase()} (${slagDef(g).sted}, bølge ${g.wave + 1})`;
}

export function snapshotOf(g: G) {
    return {
        fase: g.phase === 'vunnet' ? ('vunnet' as const) : g.phase === 'tapt' ? ('tapt' as const) : ('spiller' as const),
        poeng: finalScore(g),
        framdrift: progress(g),
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak: g.phase === 'tapt' ? årsak(g) : undefined,
    };
}

const spec: SimSpec<W> = {
    id: 'radionettet',
    maksSekunder: TOTAL_WAVES * 110,
    create: (seed) => ({ g: newGame(seed), io: silentIO(), tick: 0 }),
    step: (w, dt) => update(w.g, dt, w.io),
    snapshot: ({ g }) => snapshotOf(g),
    bots: Object.fromEntries(
        Object.entries(BOTS).map(([name, b]) => [
            name,
            {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                make: (rng) => (w: W) => {
                    w.tick += 1;
                    botTick(w.g, name as keyof typeof BOTS, w.io, rng);
                },
            },
        ])
    ),
};

export default spec;

/**
 * Spor én runde bølge for bølge (til feilsøking av balansen):
 *   npx tsx -e "import('./src/components/microgames/radionettet/sim.ts').then(m => m.trace('samvirke', 3, true))"
 */
export function trace(bot: keyof typeof BOTS, seed = 1, verbose = false) {
    const g = newGame(seed);
    const io = silentIO();
    if (verbose) io.event = (n, x, z) => console.log(`       ${g.waveT.toFixed(1)}s ${n} (${x.toFixed(1)}, ${z.toFixed(1)})`);
    const rng = seeded(seed);
    let acc = 0;
    let key = '';
    while (g.phase !== 'vunnet' && g.phase !== 'tapt' && g.t < spec.maksSekunder) {
        acc += PLAYTEST_DT;
        if (acc >= BOT_EVERY) {
            acc = 0;
            botTick(g, bot, io, rng);
        }
        const k = `${g.slag}.${g.wave}.${g.phase}`;
        if (k !== key) {
            key = k;
            const hær = g.units.filter((u) => !u.dead).map((u) => `${u.kind}${u.vet ? '*' : u.copies > 1 ? u.copies : ''}${u.linked ? '~' : ''}@${u.x},${u.z}`);
            console.log(`${g.t.toFixed(0).padStart(4)}s ${slagDef(g).id} b${g.wave + 1} ${g.phase.padEnd(10)} linje ${g.linje} hq ${Math.round(g.hqHp)} kr ${g.forsyninger} drap ${g.kills} tap ${g.tap} | ${hær.join(' ')}`);
        }
        update(g, PLAYTEST_DT, io);
    }
    console.log(`slutt: ${g.phase} ${årsak(g) ?? ''} poeng ${finalScore(g)}`);
}
