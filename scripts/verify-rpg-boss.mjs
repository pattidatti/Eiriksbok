// Sjekker bossdysten mot Den store Glemselen.
//
//   npm run dev                       # i et annet skall
//   node scripts/verify-rpg-boss.mjs
//
// Bossen er den ene delen av kampen ingen andre skript rører: skjoldet som bare
// kunnskap river ned, kunnskapsdysten som åpner seg av seg selv når eleven slår
// på en beskyttet boss, og vakten som må slippes igjen etterpå.
//
// Eleven flyttes rett til gravhaugen. Å gå dit tar for lang tid og går sjelden
// bra - hun møter halve bygdas fiender på veien.

import { chromium } from 'playwright';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

const sidefeil = [];
page.on('pageerror', (e) => sidefeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(4000);

const feil = [];
const sjekk = (ok, melding) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'} ${melding}`);
    if (!ok) feil.push(melding);
};

/** Bossens tilstand, lest rett ut av scenen. */
const boss = async () =>
    page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('nordvik');
        const b = scene?.fiendeSystem?.bossen;
        return b ? { skjold: b.skjold, hp: b.hp, tilstand: b.tilstand } : null;
    });

const fore = await boss();
sjekk((fore?.skjold ?? 0) > 0, `bossen står med skjold: ${JSON.stringify(fore)}`);

// Still deg inntil den og slå. Et slag på en beskyttet boss skal åpne dysten.
const stillDegVedBossen = () =>
    page.evaluate(() => {
        const scene = window.__rpg.scene.getScene('nordvik');
        const b = scene.fiendeSystem.bossen;
        // Rett under den, så «opp» er riktig vei. Slagsektoren er smal, og et
        // slag i feil retning treffer ingenting.
        scene.helt.sprite.setPosition(b.sprite.x, b.sprite.y + 14);
    });

/** Slår til dysten åpner seg. Returnerer om den kom. */
const apneDysten = async () => {
    for (let i = 0; i < 10 && !(await page.$('text=Kunnskapsdyst')); i++) {
        // Bossen dytter henne unna mellom slagene, så still henne tilbake hver gang.
        await stillDegVedBossen();
        await page.keyboard.down('w');
        await page.waitForTimeout(80);
        await page.keyboard.up('w');
        await page.keyboard.down('Space');
        await page.waitForTimeout(150);
        await page.keyboard.up('Space');
        await page.waitForTimeout(450);
    }
    return Boolean(await page.$('text=Kunnskapsdyst'));
};

await stillDegVedBossen();
await page.waitForTimeout(600);
const dystApen = await apneDysten();
sjekk(dystApen, 'slag mot beskyttet boss åpnet kunnskapsdysten');

let riktigTruffet = false;
if (dystApen) {
    // Vi vet ikke hvilket alternativ som er riktig, så vi prøver oss fram til
    // svaret er riktig. Det er hele poenget med sjekken: et riktig svar - og
    // bare det - skal rive ned et skjold.
    for (let forsok = 0; forsok < 4 && !riktigTruffet; forsok++) {
        if (forsok > 0 && !(await apneDysten())) {
            console.log(`     (forsøk ${forsok}: fikk ikke åpnet dysten på nytt)`);
            break;
        }
        const alternativer = await page.$$('button.flex.w-full.items-start');
        if (alternativer.length <= forsok) {
            console.log(`     (forsøk ${forsok}: bare ${alternativer.length} alternativer)`);
            break;
        }
        const forSkjold = (await boss())?.skjold ?? -1;
        await alternativer[forsok].click();
        await page.waitForTimeout(500);
        riktigTruffet = Boolean(await page.$('text=Riktig!'));
        await page.click('button.bg-amber-400');
        await page.waitForTimeout(1400);

        if (forsok === 0) {
            sjekk(!(await page.$('text=Kunnskapsdyst')), 'dysten lukket seg etter svar');
            const vakt = await page.evaluate(
                () => window.__rpg.scene.getScene('nordvik').fiendeSystem.bossVakt
            );
            sjekk(vakt === false, `bossvakten ble sluppet igjen (bossVakt=${vakt})`);
        }
        if (riktigTruffet) {
            const etterSkjold = (await boss())?.skjold ?? -1;
            sjekk(
                etterSkjold === forSkjold - 1,
                `riktig svar rev ned et skjold (${forSkjold} -> ${etterSkjold})`
            );
        }
    }
    if (!riktigTruffet) sjekk(false, 'traff aldri et riktig svar på fire forsøk');
}

const etter = await boss();
sjekk(etter !== null, `bossen lever fortsatt: ${JSON.stringify(etter)}`);

console.log('\nsidefeil:', sidefeil.length ? sidefeil.slice(0, 3).join(' | ') : 'ingen');
await browser.close();

if (feil.length || sidefeil.length) {
    console.error(`\nFEIL i ${feil.length} sjekk${feil.length === 1 ? '' : 'er'}.`);
    process.exit(1);
}
console.log('\nBossdysten virker.');
