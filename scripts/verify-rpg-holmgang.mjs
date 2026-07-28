// Driver holmgangen på tingvollen, alle tre utgangene.
//
//   npm run dev                           # i et annet skall
//   node scripts/verify-rpg-holmgang.mjs
//
// Det som måles er reglene, ikke at det finnes en kamp:
//
//   1. Utfordringen kommer først etter blotet, og knappen på vollen står ikke
//      framme før noen har krevd ham ut.
//   2. Huden ligger på bakken mens kampen står, og den tas opp etterpå.
//   3. Tre skjold. Brister det, får han et nytt - to ganger, og ikke tre.
//   4. Å gå av huden er å vike: én advarsel, og så er det tapt.
//   5. Ingen dør. Blodet avgjør, og taperen betaler tre mark sølv.
//   6. Alle tre utgangene gir `[Holmgang]`. Æren skiller dem.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

/** Kapittel 3 til og med blotet. */
const ETTER_BLOTET = {
    steg: ['kapittel:2', 'k3-knarren', 'k3-blotet'],
    sette: ['opptakt:k3'],
    begreper: { blot: 'forstatt' },
};

const browser = await chromium.launch();

/** Én økt. `oppsett` får siden etter at huden er lagt ut. */
async function okt(navn, kampanje, kjor) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const konsollfeil = [];
    page.on('pageerror', (e) => konsollfeil.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
    await stengHmr(page);
    await entreEpoke(page, { kapittel: 3, sisteSted: 'nordvik-995', kampanje });
    await page.waitForTimeout(3200);
    await kjor(page);
    sjekk(`ingen konsollfeil (${navn})`, konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));
    await page.close();
}

const tilstand = (page) =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { aere: s.aere, solv: s.solv, hp: s.hp, begreper: s.begreper, steg: s.steg } : null;
    });

const klikk = async (page, tekst) => {
    await page.getByRole('button', { name: tekst }).first().click();
    await page.waitForTimeout(320);
};

const gaaTil = async (page, type, id) => {
    await page.evaluate(
        ([t, i]) => {
            const scene = window.__rpg?.scene.getScene('verden');
            const mal = scene?.samhandling?.mal(t, i);
            if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
        },
        [type, id]
    );
    await page.waitForTimeout(430);
    await page.keyboard.down('e');
    await page.waitForTimeout(160);
    await page.keyboard.up('e');
    await page.waitForTimeout(800);
};

/** Leser holmgangens indre tilstand rett ut av scenen. */
const holm = (page) =>
    page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        return {
            fase: s?.holmgang?.fase ?? null,
            skjoldIgjen: s?.holmgang?.skjoldIgjen ?? null,
            hud: Boolean(s?.hudBilde),
            vern: s?.helt?.vernHelse ?? null,
        };
    });

/** Setter eleven midt på huden og tar imot utfordringen. */
const utTilHuden = async (page) => {
    await gaaTil(page, 'npc', 'skjalg-npc');
    await klikk(page, 'Si det du har å si');
    await page.waitForTimeout(500);
    await gaaTil(page, 'landemerke', 'vollen-995');
    await klikk(page, 'Gå ut på huden');
    await page.waitForTimeout(900);
    // Hun skal være satt ned på huden av holmgangen selv. Står hun igjen der
    // landemerket sto, begynner kampen med en advarsel.
    sjekk(
        'hun stilles opp på huden',
        await page.evaluate(() => {
            const s = window.__rpg?.scene.getScene('verden');
            return Math.abs(s.helt.sprite.y - (24 * 16 + 8)) < 3.2 * 16;
        })
    );
    // Nåden i starten. Kanten teller ikke før den er ute, og en prøve som
    // måler kanten før den gjelder, måler ingenting.
    await page.waitForTimeout(1800);
};

// ── Økt 1: gatingen, huden, og seieren ──────────────────────────────────────
await okt('seier', { steg: ['kapittel:2', 'k3-knarren'], sette: ['opptakt:k3'] }, async (page) => {
    // 1. Ingen utfordring før blotet.
    await gaaTil(page, 'npc', 'skjalg-npc');
    sjekk(
        'ingen utfordring før blotet',
        (await page.getByRole('button', { name: 'Si det du har å si' }).count()) === 0
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await gaaTil(page, 'landemerke', 'vollen-995');
    sjekk(
        'vollen har ingen knapp uten en avtale',
        (await page.getByRole('button', { name: 'Gå ut på huden' }).count()) === 0
    );
    sjekk(
        'vollen forklarer hva en holmgang er',
        ((await page.textContent('body')) ?? '').includes('fem alen hud')
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Blotet er holdt (sådd rett i lagringen - kvelden måles for seg).
    await page.evaluate(() => window.__rpgStore.getState().fullforSteg('k3-blotet'));
    await utTilHuden(page);

    // 2. Huden ligger der.
    const start = await holm(page);
    sjekk('holmgangen går', start.fase === 'gaar', String(start.fase));
    sjekk('huden ligger på bakken', start.hud === true);
    sjekk('to skjold i reserve', start.skjoldIgjen === 2, String(start.skjoldIgjen));
    await page.screenshot({ path: `${UT}/rpg-k3-holmgang.png` });

    // 3. Skjoldet rekkes over kanten når det brister.
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        s.helt.kamp.vernHelse = 0;
    });
    await page.waitForTimeout(400);
    const etterBrudd = await holm(page);
    sjekk('nytt skjold når det brister', etterBrudd.skjoldIgjen === 1, String(etterBrudd.skjoldIgjen));
    sjekk('og det er helt', (etterBrudd.vern ?? 0) > 0, String(etterBrudd.vern));

    // 5. Blodet avgjør. Skjalg har slått på henne mens prøven målte skjoldene,
    //    så livet settes tilbake først - ellers kan hun rekke å blø selv, og da
    //    måler denne økta feil utgang.
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        window.__rpgStore.setState({ hp: 999 });
        const f = s.fiendeSystem.alle().find((x) => x.def.id === 'skjalg');
        if (f) f.hp = Math.floor(f.maksHp * 0.3);
    });
    await page.waitForTimeout(2200);
    const etter = await holm(page);
    sjekk('huden er tatt opp igjen', etter.hud === false);
    const tekst = (await page.textContent('body')) ?? '';
    sjekk('blodet falt på huden', tekst.includes('Blodet falt på huden'));
    sjekk('holmløsningen forklares', tekst.includes('Holmløsning'));
    await page.screenshot({ path: `${UT}/rpg-k3-holmgang-seier.png` });
    await klikk(page, 'Gå ned igjen');
    await page.waitForTimeout(600);

    const s = await tilstand(page);
    sjekk('steget er gjort', s?.steg?.includes('k3-holmgangen'));
    sjekk('holmgang er forstått', s?.begreper?.holmgang === 'forstatt', String(s?.begreper?.holmgang));
    sjekk('tre mark sølv kom inn', s?.solv === 60, String(s?.solv));
    sjekk('æren steg', (s?.aere ?? 0) > 50, String(s?.aere));
});

// ── Økt 2: å gå av huden ────────────────────────────────────────────────────
await okt('viker', ETTER_BLOTET, async (page) => {
    await utTilHuden(page);
    // Første fot utenfor: en advarsel, ikke et tap.
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        s.flyttHelt(30 * 16, 24 * 16);
    });
    await page.waitForTimeout(300);
    const advart = await holm(page);
    sjekk('én fot utenfor er ikke tap', advart.fase === 'gaar', String(advart.fase));
    sjekk(
        'han blir advart',
        ((await page.textContent('body')) ?? '').includes('Én fot utenfor')
    );
    // Tilbake inn, og så ut igjen. Da er det over.
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        s.flyttHelt(38 * 16 + 8, 24 * 16 + 8);
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        s.flyttHelt(30 * 16, 24 * 16);
    });
    await page.waitForTimeout(2000);
    const tekst = (await page.textContent('body')) ?? '';
    sjekk('andre gang er å vike', tekst.includes('Du gikk av huden'));
    await page.screenshot({ path: `${UT}/rpg-k3-holmgang-veket.png` });
    await klikk(page, 'Gå hjem');
    await page.waitForTimeout(600);
    const s = await tilstand(page);
    sjekk('å vike gir også begrepet', s?.begreper?.holmgang === 'forstatt');
    sjekk('men det koster ære', (s?.aere ?? 99) < 50, String(s?.aere));
});

// ── Økt 3: blodet hans ──────────────────────────────────────────────────────
await okt('blodet', ETTER_BLOTET, async (page) => {
    await utTilHuden(page);
    await page.evaluate(() => {
        const st = window.__rpgStore.getState();
        window.__rpgStore.setState({ hp: 20, solv: 100 });
        void st;
    });
    await page.waitForTimeout(2200);
    const tekst = (await page.textContent('body')) ?? '';
    sjekk('han blør, men dør ikke', tekst.includes('Ditt blod på huden'));
    sjekk('ingen dødsskjerm', (await page.locator('text=Du falt').count()) === 0);
    await klikk(page, 'Reis deg');
    await page.waitForTimeout(600);
    const s = await tilstand(page);
    sjekk('tre mark sølv går ut', s?.solv === 40, String(s?.solv));
    sjekk('han lever', (s?.hp ?? 0) > 0, String(s?.hp));
    sjekk('begrepet står', s?.begreper?.holmgang === 'forstatt');
});

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
