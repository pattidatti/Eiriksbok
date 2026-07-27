// Sjekker at eleven kan flytte seg fra ett sted til et annet.
//
//   npm run dev                        # i et annet skall
//   node scripts/verify-rpg-reise.mjs
//
// Reisen er det farligste i R2: scenen rives og bygges på nytt mens spillet
// går. Blueprintens fallgruve 5 sier at Phaser rydder scenen, men ikke det som
// ligger utenfor den - og her fantes det allerede én slik lekkasje, en
// resize-lytter på skalamanageren som ble lagt til på nytt for hver create().
//
// Registeret har foreløpig bare ett ekte sted. Derfor lager dette skriptet et
// prøvested i minnet: samme kart, men egen id, eget tema, eget spawnpunkt og
// ingen boss. Det er nok til å bevise at scenen bygger det den får inn - og at
// den ikke drar noe med seg fra forrige verden. Når Lindisfarne finnes, byttes
// prøvestedet ut med det.

import { chromium } from 'playwright';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

const sidefeil = [];
page.on('pageerror', (e) => sidefeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));

const feil = [];
const sjekk = (ok, melding) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'} ${melding}`);
    if (!ok) feil.push(melding);
};

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(4000);

/** Alt vi måler på verdenen, lest rett ut av scenen. */
const tilstand = () =>
    page.evaluate(() => {
        const spill = window.__rpg;
        const scene = spill?.scene.getScene('verden');
        if (!scene) return null;
        const liste = scene.children.list;
        return {
            stedId: scene.sted.id,
            spillerX: Math.round(scene.helt.sprite.x),
            spillerY: Math.round(scene.helt.sprite.y),
            questPrefiks: scene.quester[0]?.id.split('-')[0] ?? null,
            questAntall: scene.quester.length,
            npcer: liste.filter((o) => o.texture?.key?.startsWith?.('npc-')).length,
            props: liste.filter((o) => o.texture?.key?.startsWith?.('prop-')).length,
            vegger: scene.data.get('vegger')?.getChildren?.().length ?? -1,
            propKropper: scene.data.get('propKropper')?.getChildren?.().length ?? -1,
            harBoss: Boolean(scene.fiendeSystem.bossen),
            // Lekkasjemåleren: skalamanageren overlever scenen, så en lytter
            // som ikke meldes av her hoper seg opp for hver reise.
            resizeLyttere: spill.scale.listenerCount('resize'),
            scener: spill.scene.getScenes(true).length,
            lerret: document.querySelectorAll('canvas').length,
        };
    });

const fore = await tilstand();
sjekk(fore?.stedId === 'nordvik', `står i Nordvik ved start (${fore?.stedId})`);

// ── Registrer et prøvested ──────────────────────────────────────────────────
const lagd = await page.evaluate(async () => {
    // Registeret hentes fra `window.__rpgSteder`, ikke med en egen import:
    // Vite kan gi skriptet en annen modulinstans enn appen bruker, og da ville
    // prøvestedet vært usynlig for spillet.
    const steder = window.__rpgSteder;
    const epoker = await import('/src/features/rpg/data/epoker.ts');
    const nordvik = steder.STED_BY_ID.nordvik;
    const annet = epoker.EPOKER.find((e) => e.id !== nordvik.epokeId);
    const prove = {
        ...nordvik,
        id: 'proveplass',
        tittel: 'Prøveplassen',
        undertittel: 'Bare for verifisering',
        tema: annet.tema,
        spawn: [20, 20],
        // Uten boss: her testes også at et sted kan mangle en.
        boss: undefined,
    };
    steder.STEDER.push(prove);
    steder.STED_BY_ID.proveplass = prove;
    return { tema: annet.id, spawn: prove.spawn };
});
console.log(`     (prøvestedet bruker temaet fra «${lagd.tema}»)`);

// ── Reis ────────────────────────────────────────────────────────────────────
await page.evaluate(() => window.__rpg.scene.getScene('verden').bestillReise('proveplass'));
await page.waitForTimeout(3000);

const etter = await tilstand();
sjekk(etter?.stedId === 'proveplass', `scenen bygget det nye stedet (${etter?.stedId})`);
sjekk(
    etter?.questPrefiks === 'proveplass',
    `questene ble bygget på nytt for stedet (${etter?.questPrefiks})`
);
// TILE er 16. Spawnruta [20, 20] skal gi omtrent (328, 328) - eleven kan ha
// rukket å bevege seg noen piksler, men ikke tvers over kartet.
sjekk(
    Math.abs((etter?.spillerX ?? 0) - 328) < 60 && Math.abs((etter?.spillerY ?? 0) - 328) < 60,
    `eleven står på det nye spawnpunktet (${etter?.spillerX}, ${etter?.spillerY})`
);
sjekk(etter?.harBoss === false, `stedet uten boss fikk ingen boss (harBoss=${etter?.harBoss})`);
sjekk(
    etter?.scener === 1 && etter?.lerret === 1,
    `én scene og ett lerret (${etter?.scener}/${etter?.lerret})`
);
sjekk(
    etter?.resizeLyttere === fore?.resizeLyttere,
    `ingen lytter ble liggende igjen (${fore?.resizeLyttere} -> ${etter?.resizeLyttere})`
);

// ── Reis tilbake ────────────────────────────────────────────────────────────
await page.evaluate(() => window.__rpg.scene.getScene('verden').bestillReise('nordvik'));
await page.waitForTimeout(3000);

const hjemme = await tilstand();
sjekk(hjemme?.stedId === 'nordvik', `kom tilbake til Nordvik (${hjemme?.stedId})`);
sjekk(
    hjemme?.questAntall === fore?.questAntall && hjemme?.questPrefiks === 'nordvik',
    `questene er Nordviks igjen (${hjemme?.questAntall} stk, ${hjemme?.questPrefiks})`
);
sjekk(hjemme?.harBoss === true, `bossen står der igjen (harBoss=${hjemme?.harBoss})`);
for (const felt of ['npcer', 'props', 'vegger', 'propKropper']) {
    sjekk(
        hjemme?.[felt] === fore?.[felt],
        `${felt} er som før reisen (${fore?.[felt]} -> ${hjemme?.[felt]})`
    );
}
sjekk(
    hjemme?.resizeLyttere === fore?.resizeLyttere,
    `fortsatt ingen lytterlekkasje etter to reiser (${fore?.resizeLyttere} -> ${hjemme?.resizeLyttere})`
);

console.log('\nsidefeil:', sidefeil.length ? sidefeil.slice(0, 3).join(' | ') : 'ingen');
await browser.close();

if (feil.length || sidefeil.length) {
    console.error(`\nFEIL i ${feil.length} sjekk${feil.length === 1 ? '' : 'er'}.`);
    process.exit(1);
}
console.log('\nReisen virker.');
