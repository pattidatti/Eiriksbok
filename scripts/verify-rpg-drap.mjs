// Fanger et drap i Minnevokteren ramme for ramme, og sjekker at tiden går normalt
// etterpå.
//
//   npm run dev                        # i et annet skall
//   node scripts/verify-rpg-drap.mjs
//
// Avslutningene varer 150-320 ms, så page.screenshot er for treg - CDP-fangst
// tar bilder tett nok til å se lemlestelse, saktefilm og liket som blir liggende.
// Bildene havner i .screenshots/, som ikke committes.
//
// Drap oppdages på XP, ikke sølv: XP gis i drapsøyeblikket, mens sølv krever at
// eleven går bort og plukker det opp.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' });
const feil = [];
page.on('pageerror', (e) => feil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && feil.push(m.text()));

await page.goto('http://localhost:5173/oving/rpg', { waitUntil: 'networkidle' });
await page.fill('input[placeholder="Skriv navnet ditt"]', 'Torstein');
await page.click('button:has-text("Reis til Nordvik")');
await page.waitForSelector('canvas');
await page.waitForTimeout(3000);

const cdp = await page.context().newCDPSession(page);
const skudd = async (navn, i) => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`.screenshots/${navn}-${String(i).padStart(2, '0')}.png`, Buffer.from(data, 'base64'));
};

const liv = async () => Number(await (await page.$('[aria-label="Liv"]')).getAttribute('aria-valuenow'));
// XP gis i drapsøyeblikket. Sølv krever at hun plukker det opp, så det er
// ubrukelig som signal.
const xp = async () => {
    const el = await page.$('[aria-label="Erfaring"]');
    return el ? Number(await el.getAttribute('aria-valuenow')) : 0;
};

// Oppsøk kamp.
for (const r of ['d', 'd', 's', 'd', 's', 's', 'd', 'w']) {
    await page.keyboard.down(r);
    await page.waitForTimeout(1200);
    await page.keyboard.up(r);
    if ((await liv()) < 100) break;
}
console.log('i kamp, liv =', await liv());

// Slå til noe dør. Sølvet stiger når en fiende felles - det er signalet vårt.
let xpFor = await xp();
let drept = false;
for (let runde = 0; runde < 60 && !drept; runde++) {
    // Snu deg, så slagene treffer noe. Sektoren er smal, og hun stod og slo i
    // tomme lufta da retningen var fast.
    const t = ['w', 'd', 's', 'a'][runde % 4];
    await page.keyboard.down(t);
    await page.waitForTimeout(70);
    await page.keyboard.up(t);
    await page.keyboard.down('Space');
    await page.waitForTimeout(130);
    await page.keyboard.up('Space');
    // Fang tett rundt slaget.
    for (let i = 0; i < 5; i++) {
        await skudd(`slag${runde}`, i);
        await page.waitForTimeout(55);
    }
    const na = await xp();
    if (na > xpFor + 4) {
        console.log(`drap i runde ${runde} (xp ${xpFor} -> ${na})`);
        drept = true;
        // Fang etterspillet: saktefilm, biter som lander, lik.
        for (let i = 5; i < 16; i++) {
            await skudd(`drap`, i);
            await page.waitForTimeout(70);
        }
    }
    xpFor = Math.max(xpFor, await xp());
    await page.waitForTimeout(160);
}
if (!drept) console.log('ingen drap fanget');

// Sjekk at tiden er tilbake til normalt etterpå. Saktefilmen skalerer vår egen
// delta, og pusten er en presis klokke: garden drenerer 6 i sekundet. Men den
// målingen holder bare i fred - blokker koster 8-18 pust hver, og i en pågående
// kamp drukner de signalet. Derfor løper hun først vekk: eleven har fart 96,
// fiendene 42-70, så hun kommer unna.
const pust = async () => {
    const el = await page.$('[aria-label="Pust"]');
    return el ? Number(await el.getAttribute('aria-valuenow')) : null;
};
const liv2 = async () => {
    const el = await page.$('[aria-label="Liv"]');
    return el ? Number(await el.getAttribute('aria-valuenow')) : null;
};

if (await page.$('button:has-text("Reis deg")')) {
    console.log('tidssjekk: eleven døde, reiser henne opp');
    await page.click('button:has-text("Reis deg")');
    await page.waitForTimeout(1800);
}

await page.keyboard.down('a');
await page.waitForTimeout(5000);
await page.keyboard.up('a');

// Vent til hun har fred: livet står stille og pusten er full.
let rolig = false;
for (let i = 0; i < 40; i++) {
    const l1 = await liv2();
    await page.waitForTimeout(500);
    if (l1 === (await liv2()) && (await pust()) >= 99) {
        rolig = true;
        break;
    }
}

if (!rolig) {
    console.log('tidssjekk hoppet over - fikk ikke fred til å måle');
} else {
    // Livet leses før og etter: blir eleven truffet mens garden står, koster
    // blokken 8-18 pust i tillegg, og målingen er ikke lenger et rent tilfelle.
    // Uten denne vakten rapporterte skriptet «tiden er ute av lås» hver gang en
    // fiende kom bort og slo, som er en falsk alarm - samme grunn til at
    // verify-rpg-kamp.mjs måler med `lFor`/`lEtter`.
    const f = await pust();
    const lFor = await liv2();
    await page.keyboard.down('Shift');
    await page.waitForTimeout(2000);
    const e = await pust();
    const lEtter = await liv2();
    await page.keyboard.up('Shift');
    const drenert = f - e;
    // Dør eleven under målingen, forsvinner HUD-en og begge avlesningene blir
    // null. Da er `f - e` null-null = 0, som leser som «tiden står stille» -
    // en falsk alarm som så helt ekte ut.
    if (f === null || e === null || lFor === null || lEtter === null) {
        console.log('tidssjekk hoppet over - eleven døde under målingen');
    } else if (lFor !== lEtter) {
        console.log(
            `tidssjekk hoppet over - eleven ble truffet under målingen (${drenert} pust, liv ${lFor} -> ${lEtter})`
        );
    } else {
        console.log(
            `tid etter drap: garden drenerte ${drenert} pust i 2 sek`,
            drenert >= 9 && drenert <= 18 ? '- OK, normal tid' : '- FEIL, tiden er ute av lås'
        );
    }
}
await skudd('etterpaa', 0);
console.log('konsollfeil:', feil.length ? feil.slice(0, 3) : 'ingen');
await browser.close();
