// Driver skjoldborgen på Stiklestad: reglene, ikke at det finnes en kamp.
//
//   npm run dev                             # i et annet skall
//   node scripts/verify-rpg-skjoldborg.mjs
//
// Det som måles:
//
//   1. Å komme fram til sletta er steget. Rekka har ingen knapp før Skofte har
//      vist henne hvor hun skal stå - og han gir henne et spyd når han gjør det.
//   2. Rekka stiller seg opp: streken i gresset, mennene, og hun midt i.
//   3. Mannen til venstre er sønnen hvis hun sa ja, og naboens gutt hvis hun
//      sa nei. Valget flyttet ikke et barn ut av rekka.
//   4. Rullen er sperret, og dekningen står på mens hun er i rekka.
//   5. Går hun fram: dekningen faller bort, Skofte roper, og naboen begynner
//      å ta imot for henne. Tre sår, og rekka brister.
//   6. Står hun halvannet minutt: rekka holdt. Begge utganger gir
//      `[Skjoldborg]` og fører kapittelet videre.
//   7. `iRekke` leses: spydet er verdt mer enn øksa her, og bare her.

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

/** Kapittel 4 fram til båtene, med sønnen med eller hjemme. */
const framTilSletta = (sonnenMed) => ({
    steg: ['kapittel:3', 'k4-budstikka', 'k4-hvem-drar'],
    sette: ['opptakt:k4'],
    flagg: sonnenMed ? { 'k4-sonnen-med': true } : { 'k4-sonnen-hjemme': true },
    begreper: { bondehaeren: 'forstatt' },
});

const browser = await chromium.launch();

async function okt(navn, kampanje, kjor) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const konsollfeil = [];
    page.on('pageerror', (e) => konsollfeil.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
    await stengHmr(page);
    await entreEpoke(page, { kapittel: 4, sisteSted: 'stiklestad', kampanje });
    await page.waitForTimeout(3400);
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
        return s
            ? {
                  aere: s.aere,
                  hp: s.hp,
                  begreper: s.begreper,
                  steg: s.steg,
                  flagg: s.flagg,
                  utstyr: s.utstyr,
              }
            : null;
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

/** Leser rekkas indre tilstand rett ut av scenen. */
const borg = (page) =>
    page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        const b = s?.skjoldborg;
        return {
            fase: b?.fase ?? null,
            gaatt: b?.gaatt ?? null,
            venstre: b?.venstre?.navn ?? null,
            venstreLiv: b?.venstre?.liv ?? null,
            iRekka: (b?.rekka ?? []).length,
            linje: Boolean(s?.linjeBilde),
            dekning: s?.helt?.dekning ?? null,
            iRekke: s?.helt?.iRekke ?? null,
            y: s?.helt?.sprite?.y ?? null,
        };
    });

/** Snakker med Skofte og stiller seg i rekka. */
const stillOpp = async (page) => {
    await gaaTil(page, 'npc', 'skofte-stiklestad');
    await klikk(page, 'Vis meg hvor jeg skal stå');
    await page.waitForTimeout(500);
    await gaaTil(page, 'landemerke', 'rekka-stiklestad');
    await klikk(page, 'Still deg i rekka');
    await page.waitForTimeout(900);
};

// ── Økt 1: gatingen, oppstillingen og hullet ────────────────────────────────
await okt('hullet', framTilSletta(true), async (page) => {
    // 1. Å komme fram er steget.
    const framme = await tilstand(page);
    sjekk('å komme fram til sletta er steget', framme?.steg?.includes('k4-veien'));

    // Rekka står låst til Skofte har snakket.
    await gaaTil(page, 'landemerke', 'rekka-stiklestad');
    sjekk(
        'rekka har ingen knapp før Skofte har vist henne plassen',
        (await page.getByRole('button', { name: 'Still deg i rekka' }).count()) === 0
    );
    sjekk(
        'rekka forklarer hva en skjoldborg er',
        ((await page.textContent('body')) ?? '').includes('den som går fram')
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    await gaaTil(page, 'npc', 'skofte-stiklestad');
    sjekk(
        'Skofte sier regelen før hun står i den',
        ((await page.textContent('body')) ?? '').includes('dekker deg og halve ham')
    );
    await page.screenshot({ path: `${UT}/rpg-k4-skofte.png` });
    await klikk(page, 'Vis meg hvor jeg skal stå');
    await page.waitForTimeout(600);
    const etterSkofte = await tilstand(page);
    sjekk('steget er gitt', etterSkofte?.steg?.includes('k4-linja'));
    sjekk('og spydet er i hånda', etterSkofte?.utstyr?.vapen === 'tingspyd', String(etterSkofte?.utstyr?.vapen));

    // 2-3. Oppstillingen.
    await gaaTil(page, 'landemerke', 'rekka-stiklestad');
    await klikk(page, 'Still deg i rekka');
    await page.waitForTimeout(900);
    const start = await borg(page);
    sjekk('rekka står', start.fase === 'staar', String(start.fase));
    sjekk('streken ligger i gresset', start.linje === true);
    sjekk('seks menn står i den', start.iRekka === 6, String(start.iRekka));
    sjekk('sønnen står til venstre', start.venstre === 'Åsmund', String(start.venstre));
    sjekk('hun står på raden', Math.abs((start.y ?? 0) - (21 * 16 + 8)) < 8, String(start.y));

    // 4. Rullen er sperret, dekningen står på.
    sjekk('rullen er sperret i rekka', start.iRekke === true);
    sjekk('mannen til høyre dekker halve henne', start.dekning === 0.6, String(start.dekning));
    await page.screenshot({ path: `${UT}/rpg-k4-rekka.png` });

    // Nåden først: kanten teller ikke før den er ute.
    await page.waitForTimeout(2200);

    // 5. Hullet. Hun flyttes to skritt fram og blir stående.
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        s.flyttHelt(s.helt.sprite.x, 21 * 16 + 8 - 40);
    });
    await page.waitForTimeout(1300);
    const framme2 = await borg(page);
    sjekk('dekningen faller bort når hun går fram', framme2.dekning === 1, String(framme2.dekning));
    sjekk(
        'Skofte roper før noe skjer',
        ((await page.textContent('body')) ?? '').includes('TILBAKE I REKKA')
    );
    sjekk('naboen er uskadd ennå', framme2.venstreLiv === 3, String(framme2.venstreLiv));

    // Blir hun stående, tar naboen imot. Hun holdes framme mens det skjer.
    for (let i = 0; i < 12; i++) {
        await page.evaluate(() => {
            const s = window.__rpg?.scene.getScene('verden');
            s.flyttHelt(s.helt.sprite.x, 21 * 16 + 8 - 40);
        });
        await page.waitForTimeout(420);
        const naa = await borg(page);
        if (naa.fase !== 'staar') break;
    }
    const etterHullet = await borg(page);
    sjekk('rekka brast', etterHullet.fase === 'over', String(etterHullet.fase));
    sjekk('streken er tatt opp igjen', etterHullet.linje === false);
    await page.waitForTimeout(1600);
    const tekst = (await page.textContent('body')) ?? '';
    sjekk('beskjeden sier at rekka brast', tekst.includes('Rekka brast'));
    sjekk('og hvem som lå der', tekst.includes('Åsmund ligger der du sto'));
    sjekk('slaget ble vunnet likevel', tekst.includes('Slaget vant dere likevel'));
    await page.screenshot({ path: `${UT}/rpg-k4-brast.png` });
    await klikk(page, 'Reis deg');
    await page.waitForTimeout(600);
    const s = await tilstand(page);
    sjekk('steget er gjort', s?.steg?.includes('k4-slaget'));
    sjekk('skjoldborg er forstått', s?.begreper?.skjoldborg === 'forstatt');
    sjekk('flagget står', s?.flagg?.['k4-rekka-brast'] === true);
});

// ── Økt 2: rekka som holder, og våpenet ─────────────────────────────────────
await okt('holdt', framTilSletta(false), async (page) => {
    await stillOpp(page);
    const start = await borg(page);
    sjekk('naboens gutt står der i stedet', start.venstre === 'Halvor på Sæbø', String(start.venstre));

    // 7. `iRekke` leses: spydet er verdt mer enn øksa - og bare her.
    const faktorer = await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        return {
            spyd: s.skjoldborg.skadefaktor('god'),
            oks: s.skjoldborg.skadefaktor('ubrukelig'),
            sverd: s.skjoldborg.skadefaktor('brukbar'),
        };
    });
    sjekk('spydet er best i rekka', faktorer.spyd > 1, String(faktorer.spyd));
    sjekk('øksa er nesten ubrukelig', faktorer.oks < 0.5, String(faktorer.oks));
    sjekk('sverdet er midt imellom', faktorer.sverd > faktorer.oks && faktorer.sverd < faktorer.spyd);

    // 6. Klokka skrus fram. Å stå i halvannet minutt er poenget, ikke å måle
    //    halvannet minutt - det er tiden som er regelen, og den er prøvd.
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        window.__rpgStore.setState({ hp: 999 });
        s.skjoldborg.gaatt = 89_500;
    });
    await page.waitForTimeout(2600);
    const etter = await borg(page);
    sjekk('rekka holdt til slutt', etter.fase === 'over', String(etter.fase));
    sjekk('streken er tatt opp', etter.linje === false);
    sjekk('rullen er tilbake etterpå', etter.iRekke === false);
    sjekk('dekningen er tilbake til vanlig', etter.dekning === 1, String(etter.dekning));
    const tekst = (await page.textContent('body')) ?? '';
    sjekk('beskjeden sier at rekka holdt', tekst.includes('Rekka holdt'));
    sjekk('og hva hun ikke så', tekst.includes('Du så ingenting av det'));
    await page.screenshot({ path: `${UT}/rpg-k4-holdt.png` });
    await klikk(page, 'Se deg om');
    await page.waitForTimeout(600);
    const s = await tilstand(page);
    sjekk('steget er gjort', s?.steg?.includes('k4-slaget'));
    sjekk('skjoldborg er forstått', s?.begreper?.skjoldborg === 'forstatt');
    sjekk('flagget står', s?.flagg?.['k4-holdt-linja'] === true);
    sjekk('æren steg', (s?.aere ?? 0) > 50, String(s?.aere));
});

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
