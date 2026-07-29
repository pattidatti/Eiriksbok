// Sjekker at kapittelmålene når skjermen.
//
// `synligeSteg()` var skrevet ferdig i `data/kapitler.ts` og hadde null
// kallsteder: tjuefem mål-linjer som aldri ble rendret. Denne prøven leser
// begge stedene de skal stå nå - HUD-kortet nede til venstre, og toppen av
// oppdragsloggen - i hvert kapittel.
//
//   node scripts/rpg-maaltavle.mjs

import { chromium } from 'playwright';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

const KAPITLER = [
    { nr: 1, sted: 'nordvik' },
    { nr: 2, sted: 'nordvik-872' },
    { nr: 3, sted: 'nordvik-995' },
    { nr: 4, sted: 'nordvik-1030' },
    { nr: 5, sted: 'riccall' },
];

const browser = await chromium.launch();
let feilet = 0;

for (const kap of KAPITLER) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await stengHmr(page);
    await entreEpoke(page, { navn: 'Torstein', kapittel: kap.nr, sisteSted: kap.sted });
    await page.waitForTimeout(3500);

    // Opptakten først. Den dekker hele flaten i kapittel 2-5, og HUD-en tegnes
    // ikke lenger under den - et overlegg tar den ned, slik `Skjermkontroll` og
    // `HubHud` alltid har blitt tatt ned. Leser man kortet før opptakten er
    // lest, leser man en skjerm eleven ikke har fått ennå.
    const opptakt = page.locator('div.z-\\[60\\] button').last();
    if (await opptakt.count()) {
        await opptakt.click({ timeout: 15000 });
        await page.waitForTimeout(900);
    }

    // 1. Kortet i HUD-en.
    const kort = await page.evaluate(() => {
        const el = document.querySelector('[data-prove="oppgave"]');
        if (!el) return null;
        const p = el.querySelectorAll('p');
        return { tittel: (p[0]?.textContent || '').trim(), mal: (p[1]?.textContent || '').trim() };
    });

    // 2. Oppdragsloggen.
    await page.keyboard.press('l');
    await page.waitForTimeout(700);
    const steg = await page.evaluate(() =>
        [...document.querySelectorAll('[data-prove="kapittelsteg"]')].map((el) => {
            const p = el.querySelectorAll('p');
            return (p[0]?.textContent || '').trim();
        })
    );

    const ok = kort !== null && steg.length > 0;
    if (!ok) feilet++;
    console.log(`KAPITTEL ${kap.nr} (${kap.sted}) ${ok ? 'OK' : 'MANGLER MÅL'}`);
    console.log(`  HUD-kort: ${kort ? `«${kort.tittel}» - ${kort.mal}` : 'TOMT'}`);
    console.log(`  logg (${steg.length}): ${steg.join(' | ') || 'TOM'}`);
    await page.close();
}

await browser.close();
console.log(feilet === 0 ? '\nALLE KAPITLER HAR SYNLIG MÅL' : `\n${feilet} KAPITTEL UTEN MÅL`);
process.exit(feilet === 0 ? 0 : 1);
