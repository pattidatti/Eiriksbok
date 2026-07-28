// Måler hva som faller under folden på Chromebook-oppløsning, og hvor mange
// klikk/skjermer eleven må gjennom for å komme i gang.
import { chromium } from 'playwright';
import { stengHmr, BASE } from './lib/rpg-testside.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(page);
await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const mal = await page.evaluate(() => {
    const ut = { dokHoyde: document.documentElement.scrollHeight, vindu: innerHeight, knapper: [] };
    for (const b of document.querySelectorAll('button')) {
        const r = b.getBoundingClientRect();
        ut.knapper.push({
            tekst: (b.textContent || '').trim().slice(0, 40),
            top: Math.round(r.top),
            h: Math.round(r.height),
            w: Math.round(r.width),
            underFolden: r.top > innerHeight - 8,
        });
    }
    const rullebar = [...document.querySelectorAll('*')].filter(
        (e) => e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflowY !== 'visible'
    );
    ut.rullebare = rullebar.length;
    return ut;
});
console.log('KARAKTERSKAPER');
console.log(' dokumenthøyde', mal.dokHoyde, 'vindu', mal.vindu, 'rullebare beholdere', mal.rullebare);
for (const k of mal.knapper) {
    console.log(
        `  ${k.underFolden ? 'UNDER FOLDEN ' : '             '}top=${String(k.top).padStart(4)} ${k.w}x${k.h}  «${k.tekst}»`
    );
}

// Skriv inn navn og se hva som skjer
await page.fill('input', 'Torstein');
await page.waitForTimeout(500);
const etter = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].filter((x) =>
        /begynn|start|gå|videre|lag/i.test(x.textContent || '')
    );
    return b.map((x) => {
        const r = x.getBoundingClientRect();
        return { tekst: x.textContent.trim(), top: Math.round(r.top), synlig: r.top < innerHeight };
    });
});
console.log('\nSTARTKNAPP etter navn:', JSON.stringify(etter));

// Klikk den og tell skjermer fram til spillbar verden
if (etter.length) {
    await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) =>
            /begynn|start|gå|videre|lag/i.test(x.textContent || '')
        );
        b?.scrollIntoView();
        b?.click();
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: '.screenshots/fold-etter-start.png' });
    const tekst = await page.evaluate(() => document.body.innerText.slice(0, 900));
    console.log('\nETTER START:\n', tekst);
}

await browser.close();
