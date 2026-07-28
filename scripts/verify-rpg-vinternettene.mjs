// Driver kapittelets siste handling: hallen, valget og kirken.
//
//   npm run dev                                # i et annet skall
//   node scripts/verify-rpg-vinternettene.mjs
//
// Det som måles:
//
//   1. Knappen i hallen står ikke framme før holmgangen er over.
//   2. Alle fem i husstanden sier hva de mener, og ingen av dem bestemmer.
//   3. Esc lukker ikke. Fristen er ute, og det finnes ikke et «senere».
//   4. Alle tre svarene fører kapittelet i mål og gir `[Kristningen]`.
//   5. Kirken reises på hovets grunn uansett hva eleven svarte.
//   6. Primsigningen gir sitt eget begrep - det er hele mellomtingen.

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

/** Kapittel 3 til og med holmgangen. */
const ETTER_HOLMGANGEN = {
    steg: ['kapittel:2', 'k3-knarren', 'k3-blotet', 'k3-utfordret', 'k3-holmgangen'],
    sette: ['opptakt:k3'],
    begreper: { blot: 'forstatt', holmgang: 'forstatt' },
};

const browser = await chromium.launch();

async function okt(navn, kampanje, kjor) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const konsollfeil = [];
    page.on('pageerror', (e) => konsollfeil.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
    await stengHmr(page);
    await entreEpoke(page, { kapittel: 3, sisteSted: 'nordvik-995', kampanje });
    await page.waitForTimeout(3200);
    await kjor(page);
    sjekk(
        `ingen konsollfeil (${navn})`,
        konsollfeil.length === 0,
        konsollfeil.slice(0, 2).join(' | ')
    );
    await page.close();
}

const tilstand = (page) =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { aere: s.aere, solv: s.solv, begreper: s.begreper, steg: s.steg, flagg: s.flagg } : null;
    });

const klikk = async (page, tekst) => {
    await page.getByRole('button', { name: tekst }).first().click();
    await page.waitForTimeout(340);
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

/** Fra tunet og inn i hallen. */
const iHallen = async (page) => {
    await gaaTil(page, 'landemerke', 'langhuset-995');
    await klikk(page, 'Kall folkene sammen');
    await page.waitForTimeout(700);
};

// ── Økt 1: gatingen, hallen, Esc og dåpen ───────────────────────────────────
await okt(
    'dåp',
    { steg: ['kapittel:2', 'k3-knarren', 'k3-blotet'], sette: ['opptakt:k3'] },
    async (page) => {
        await gaaTil(page, 'landemerke', 'langhuset-995');
        sjekk(
            'hallen kaller ikke sammen før holmgangen',
            (await page.getByRole('button', { name: 'Kall folkene sammen' }).count()) === 0
        );
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        await page.evaluate(() => window.__rpgStore.getState().fullforSteg('k3-holmgangen'));

        await iHallen(page);
        sjekk(
            'hallen står på skjermen',
            (await page.locator('[data-prove="vinternettene"]').count()) === 1
        );
        sjekk('hele husstanden sier sitt', (await page.locator('[data-prove="stemme"]').count()) === 5);
        const hallen = (await page.textContent('[data-prove="vinternettene"]')) ?? '';
        sjekk('broren står på den andre siden', hallen.includes('Jeg lar meg døpe'));
        sjekk('husbonden svarer for alle', hallen.includes('én gård av gangen'));
        await page.screenshot({ path: `${UT}/rpg-k3-hallen.png` });

        // 3. Esc lukker ikke.
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        sjekk(
            'Esc lukker ikke vinternettene',
            (await page.locator('[data-prove="vinternettene"]').count()) === 1
        );

        await klikk(page, 'Svar dem');
        await klikk(page, 'Vi lar oss døpe');
        await page.waitForTimeout(500);
        const etterpa = (await page.textContent('[data-prove="vinternettene"]')) ?? '';
        sjekk('dåpen skjer i fjorden', etterpa.includes('døper dere i fjorden'));
        sjekk('Ulv går', etterpa.includes('Ulv går samme kveld'));
        sjekk('kirken reises på hovet', etterpa.includes('Ikke ved siden av hovet - på det'));
        sjekk('Mære er kilden bak den påstanden', etterpa.includes('Mære kirke'));
        await page.screenshot({ path: `${UT}/rpg-k3-vinternettene-daap.png` });
        await klikk(page, 'Gå ut');
        await page.waitForTimeout(900);

        const s = await tilstand(page);
        sjekk('steget er gjort', s?.steg?.includes('k3-valget'));
        sjekk('kapittelet er ført i mål', s?.steg?.includes('kapittel:3'));
        sjekk('kristningen er forstått', s?.begreper?.kristningen === 'forstatt');
        sjekk('kongens gave kom', s?.solv === 40, String(s?.solv));
        sjekk('flagget står', s?.flagg?.['k3-dopt'] === true);
        const beskjed = (await page.textContent('body')) ?? '';
        sjekk('vinteren melder seg', beskjed.includes('Vinteren 995'));
        sjekk('broren snakker med kongens folk', beskjed.includes('Broren din snakker'));
    }
);

// ── Økt 2: primsigningen ────────────────────────────────────────────────────
await okt('primsignet', ETTER_HOLMGANGEN, async (page) => {
    await iHallen(page);
    await klikk(page, 'Svar dem');
    await klikk(page, 'Primsign meg. Ikke mer');
    await page.waitForTimeout(500);
    const t = (await page.textContent('[data-prove="vinternettene"]')) ?? '';
    sjekk('primsigningen forklares i handling', t.includes('korsets tegn over deg'));
    sjekk('kirken kommer også her', t.includes('Mære kirke'));
    await klikk(page, 'Gå ut');
    await page.waitForTimeout(900);
    const s = await tilstand(page);
    sjekk('primsigning er forstått', s?.begreper?.primsigning === 'forstatt');
    sjekk('ingen gave fra kongen', s?.solv === 0, String(s?.solv));
    sjekk('kapittelet er ført i mål', s?.steg?.includes('kapittel:3'));
});

// ── Økt 3: nei ──────────────────────────────────────────────────────────────
await okt('nektet', ETTER_HOLMGANGEN, async (page) => {
    await page.evaluate(() => window.__rpgStore.setState({ solv: 100 }));
    await iHallen(page);
    await klikk(page, 'Svar dem');
    await klikk(page, 'Nei');
    await page.waitForTimeout(500);
    const t = (await page.textContent('[data-prove="vinternettene"]')) ?? '';
    sjekk('hovet rives', t.includes('river hovet'));
    sjekk('han lever', t.includes('Han lar deg leve'));
    sjekk('kirken kommer likevel', t.includes('Mære kirke'));
    await page.screenshot({ path: `${UT}/rpg-k3-vinternettene-nei.png` });
    await klikk(page, 'Gå ut');
    await page.waitForTimeout(900);
    const s = await tilstand(page);
    sjekk('tre mark gikk ut', s?.solv === 40, String(s?.solv));
    sjekk('æren steg', (s?.aere ?? 0) > 50, String(s?.aere));
    sjekk('kristningen er forstått også her', s?.begreper?.kristningen === 'forstatt');
    const beskjed = (await page.textContent('body')) ?? '';
    sjekk('sot der hovet sto', beskjed.includes('stokker og sot'));
});

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
