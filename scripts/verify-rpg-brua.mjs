// Driver Stanford bru: dagen som snur, og rekka som ikke kan holde.
//
//   npm run dev                        # i et annet skall
//   node scripts/verify-rpg-brua.mjs
//
// Det som måles:
//
//   1. Å komme fram til brua er steget. Marsjen er venting, og den skal ikke
//      være et puzzle.
//   2. Leiren står på venting: kongen, skalden og naboen er her, mannen med
//      øksa er det ikke. Veien har ingen knapp før kongen har sagt hva dagen
//      er - uten den er støvet bare støv.
//   3. Støvet snur dagen: skjermbildet sier hva de ser, `[Hurtigmarsjen]` blir
//      forstått, de tre går over brua, og mannen med øksa kommer på plankene.
//   4. Rekka: streken, seks menn, Torfinn til venstre, rullen sperret. Uten
//      brynje står dekningen nesten helt åpen.
//   5. Med brynje: dekningen er som på Stiklestad, og hun kommer fram sliten.
//      Ingen av de to redder henne, og det er hele valget.
//   6. Rekka tynnes ut av seg selv. Ingenting hun gjør stanser det.
//   7. Merket går ned etter halvannet minutt, og faller hun etter det, vet hun
//      hvordan det gikk. Faller hun før, gjør hun ikke det.
//   8. Døden gjør opp kapittelet: steget, `[Etterpåklokskap]` som forstått, og
//      ingen «prøv igjen».

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

/** Kapittel 5 fram til at brynja er avgjort, med eller uten den på. */
const framTilBrua = (medBrynje) => ({
    steg: [
        'kapittel:4',
        'mellomspill:mellomspill-4',
        'k5-leiren',
        'k5-brynja',
    ],
    sette: ['opptakt:k5'],
    flagg: medBrynje ? { 'k5-brynja-med': true } : { 'k5-brynja-igjen': true },
    begreper: { skjoldborg: 'forstatt', etterpaaklokskap: 'hort', tronkravet: 'hort' },
    klokke: { aar: 1066, dag: 1 },
});

const browser = await chromium.launch();

async function okt(navn, kampanje, kjor) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const konsollfeil = [];
    page.on('pageerror', (e) => konsollfeil.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
    await stengHmr(page);
    await entreEpoke(page, { kapittel: 5, sisteSted: 'stanford-bru', kampanje });
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
        return s ? { hp: s.hp, begreper: s.begreper, steg: s.steg, flagg: s.flagg } : null;
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
const rekka = (page) =>
    page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        const b = s?.brua;
        return {
            fase: b?.fase ?? null,
            gaatt: b?.gaatt ?? null,
            venstre: b?.venstre?.navn ?? null,
            staaende: (b?.rekka ?? []).filter((m) => !m.falt).length,
            kongenFalt: b?.kongenFalt ?? null,
            linje: Boolean(s?.linjeBilde),
            dekning: s?.helt?.dekning ?? null,
            iRekke: s?.helt?.iRekke ?? null,
            skjulte: [...(s?.samhandling?.skjulte ?? [])],
        };
    });

/** Ser på støvet og stiller seg opp i rekka. */
const stillOpp = async (page) => {
    await gaaTil(page, 'npc', 'harald-hardraade');
    await klikk(page, 'Hvor blir det av dem?');
    await page.waitForTimeout(400);
    await gaaTil(page, 'landemerke', 'veien-fra-york');
    await klikk(page, 'Se hva som kommer');
    await page.waitForTimeout(600);
    await klikk(page, 'Over brua');
    await page.waitForTimeout(500);
    await gaaTil(page, 'landemerke', 'rekka-brua');
    await klikk(page, 'Still deg i rekka');
    await page.waitForTimeout(900);
};

// ── Økt 1: dagen som snur, og den som falt uten å vite hvordan det gikk ─────
await okt('uten brynje', framTilBrua(false), async (page) => {
    // 1. Å komme fram er steget.
    const framme = await tilstand(page);
    sjekk('å komme fram til brua er steget', framme?.steg?.includes('k5-veien'));

    // 2. Leiren står på venting.
    const verden = await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        return {
            sted: s?.sted?.id ?? null,
            folk: (s?.sted?.npcer ?? []).map((n) => n.id),
            skjulte: [...(s?.samhandling?.skjulte ?? [])],
            planker: (s?.kart?.terreng ?? [])
                .flat()
                .filter((t) => t === 'tregulv').length,
        };
    });
    sjekk('scenen bygger brua', verden.sted === 'stanford-bru', String(verden.sted));
    sjekk(
        'folkene som venter står her',
        ['harald-hardraade', 'tjodolv-brua', 'torfinn-brua'].every((id) =>
            verden.folk.includes(id)
        ),
        verden.folk.join(', ')
    );
    sjekk(
        'mannen med øksa står ikke der ennå',
        verden.skjulte.includes('mannen-med-oksa'),
        verden.skjulte.join(', ')
    );
    sjekk('plankene ligger over elva', verden.planker >= 16, String(verden.planker));
    await page.screenshot({ path: `${UT}/rpg-k5-brua-venting.png` });

    await gaaTil(page, 'landemerke', 'gislene-plassen');
    const gislene = (await page.textContent('body')) ?? '';
    sjekk(
        'venteplassen viser en hær som ikke venter noe',
        gislene.includes('Skjoldene står lent mot hverandre')
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Veien er stengt til kongen har sagt hva dagen er.
    await gaaTil(page, 'landemerke', 'veien-fra-york');
    sjekk(
        'veien har ingen knapp før kongen har sagt hva dagen er',
        (await page.getByRole('button', { name: 'Se hva som kommer' }).count()) === 0
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await gaaTil(page, 'npc', 'harald-hardraade');
    const konge = (await page.textContent('body')) ?? '';
    sjekk('kongen sier hvorfor ingen har brynje på', konge.includes('Vi skal ta imot'));
    await klikk(page, 'Hvor blir det av dem?');
    await page.waitForTimeout(500);
    sjekk('ventingen er et steg', (await tilstand(page))?.steg?.includes('k5-gislene'));

    // 3. Støvet snur dagen.
    await gaaTil(page, 'landemerke', 'veien-fra-york');
    await klikk(page, 'Se hva som kommer');
    await page.waitForTimeout(700);
    const stovet = (await page.textContent('body')) ?? '';
    sjekk('skjermbildet sier hva de ser', stovet.includes('Støvet på veien'));
    sjekk('og hvor fort han gikk', stovet.includes('fra London på fire dager'));
    sjekk('og hva de ble tilbudt', stovet.includes('Sju fot engelsk jord'.toLowerCase()) || stovet.includes('sju fot engelsk jord'));
    sjekk('og at bildet er Snorres', stovet.includes('seksti år senere skriver en islending'));
    await page.screenshot({ path: `${UT}/rpg-k5-stovet.png` });
    await klikk(page, 'Over brua');
    await page.waitForTimeout(700);

    const etterStovet = await tilstand(page);
    sjekk('steget er gitt', etterStovet?.steg?.includes('k5-stovet'));
    sjekk(
        'hurtigmarsjen er forstått',
        etterStovet?.begreper?.hurtigmarsjen === 'forstatt',
        JSON.stringify(etterStovet?.begreper?.hurtigmarsjen)
    );
    const snudd = await rekka(page);
    sjekk(
        'de som ventet er over brua',
        ['harald-hardraade', 'tjodolv-brua', 'torfinn-brua'].every((id) =>
            snudd.skjulte.includes(id)
        ),
        snudd.skjulte.join(', ')
    );
    sjekk('og mannen med øksa står på plankene', !snudd.skjulte.includes('mannen-med-oksa'));

    // 4. Rekka.
    await gaaTil(page, 'landemerke', 'rekka-brua');
    const skiltet = (await page.textContent('body')) ?? '';
    sjekk('skiltet sier hva som er annerledes', skiltet.includes('dere har ikke jernet deres'));
    await klikk(page, 'Still deg i rekka');
    await page.waitForTimeout(1000);
    const start = await rekka(page);
    sjekk('rekka står', start.fase === 'staar', String(start.fase));
    sjekk('streken ligger i gresset', start.linje === true);
    sjekk('seks menn står i den', start.staaende === 6, String(start.staaende));
    sjekk('Torfinn står til venstre', start.venstre === 'Torfinn', String(start.venstre));
    sjekk('rullen er sperret i rekka', start.iRekke === true);
    sjekk('uten brynje står hun nesten bar', start.dekning === 0.95, String(start.dekning));
    sjekk('mannen med øksa er borte når rekka står', start.skjulte.includes('mannen-med-oksa'));
    const kort = (await page.textContent('body')) ?? '';
    sjekk('kortet teller hjelpen som ikke rekker fram', kort.includes('5 t'));
    await page.screenshot({ path: `${UT}/rpg-k5-rekka.png` });

    // 6. Rekka tynnes ut av seg selv, uten at hun gjør noe.
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        window.__rpgStore.setState({ hp: 999 });
        s.brua.gaatt = 55_000;
    });
    await page.waitForTimeout(1500);
    const tynnet = await rekka(page);
    sjekk('menn faller uten at hun gjorde noe', tynnet.staaende < 6, String(tynnet.staaende));
    sjekk('og slaget står fortsatt', tynnet.fase === 'staar', String(tynnet.fase));

    // 7. Hun går ned før merket. Da får hun aldri vite hvordan det gikk.
    await page.evaluate(() => {
        window.__rpgStore.setState({ hp: 1 });
    });
    await page.waitForTimeout(2600);
    const etter = await rekka(page);
    sjekk('slaget er over', etter.fase === 'over', String(etter.fase));
    sjekk('streken er tatt opp', etter.linje === false);
    sjekk('rullen er tilbake', etter.iRekke === false);
    const tekst = (await page.textContent('body')) ?? '';
    sjekk('beskjeden er skrevet ferdig', tekst.includes('Ved brua'));
    sjekk('merket sto da hun falt', tekst.includes('Landøyda. Det står ennå'));
    sjekk('hun får aldri vite hvordan det gikk', tekst.includes('Det får du aldri vite'));
    sjekk('og brynja ligger der hun la den', tekst.includes('i kista ved skipene'));
    sjekk('det står ingen «prøv igjen»', !tekst.includes('Prøv igjen'));
    await page.screenshot({ path: `${UT}/rpg-k5-falt.png` });

    // 8. Kapittelet gjøres opp.
    const s1 = await tilstand(page);
    sjekk('steget er gjort', s1?.steg?.includes('k5-rekka'));
    sjekk(
        'etterpåklokskap er forstått nå',
        s1?.begreper?.etterpaaklokskap === 'forstatt',
        JSON.stringify(s1?.begreper?.etterpaaklokskap)
    );
    sjekk('flagget står', s1?.flagg?.['k5-falt-for-kongen'] === true);
    sjekk('og hun så ikke merket falle', !s1?.flagg?.['k5-saa-merket-falle']);
    await klikk(page, 'Videre');
    await page.waitForTimeout(4600);
    const s2 = await tilstand(page);
    sjekk('kapittelet er over', s2?.steg?.includes('kapittel:5'));
    const hvor = await page.evaluate(
        () => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null
    );
    sjekk('og hun er ute av 1066', hvor === 'hub', String(hvor));
});

// ── Økt 2: med brynje, og den som sto til merket gikk ned ───────────────────
await okt('med brynje', framTilBrua(true), async (page) => {
    // Livet før hun stiller seg opp er fullt. Det er den eneste målestokken
    // som holder: maksverdien avhenger av nivå og utstyr, og et fast tall her
    // ville ryket neste gang nivåkurven ble rørt.
    const uthvilt = (await tilstand(page))?.hp ?? 0;
    await stillOpp(page);
    const start = await rekka(page);
    const s0 = await tilstand(page);
    sjekk('med brynje dekker rekka henne som i 1030', start.dekning === 0.62, String(start.dekning));
    sjekk(
        'men hun kom fram sliten',
        (s0?.hp ?? 999) < uthvilt,
        `${s0?.hp} av ${uthvilt}`
    );

    // `iRekke` leses her også: spydet er verdt mer enn øksa, og bare her.
    const faktorer = await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        return { spyd: s.brua.skadefaktor('god'), oks: s.brua.skadefaktor('ubrukelig') };
    });
    sjekk('spydet er best i rekka', faktorer.spyd > 1, String(faktorer.spyd));
    sjekk('øksa er nesten ubrukelig', faktorer.oks < 0.5, String(faktorer.oks));

    // 7. Merket går ned, og hun står ennå.
    await page.evaluate(() => {
        const s = window.__rpg?.scene.getScene('verden');
        window.__rpgStore.setState({ hp: 999 });
        s.brua.gaatt = 77_000;
    });
    await page.waitForTimeout(2200);
    const merket = await rekka(page);
    sjekk('merket er nede', merket.kongenFalt === true);
    sjekk('og rekka står fortsatt', merket.fase === 'staar', String(merket.fase));
    sjekk('men ingen dekker henne lenger', merket.dekning === 1, String(merket.dekning));
    sjekk(
        'flagget om merket står',
        (await tilstand(page))?.flagg?.['k5-saa-merket-falle'] === true
    );
    await page.screenshot({ path: `${UT}/rpg-k5-merket.png` });

    await page.evaluate(() => window.__rpgStore.setState({ hp: 1 }));
    await page.waitForTimeout(2600);
    const tekst = (await page.textContent('body')) ?? '';
    sjekk('hun så hvordan det gikk', tekst.includes('Merket er nede'));
    sjekk('Øystein Orre kom for sent', tekst.includes('løpt seg i hjel'));
    sjekk('brynja var ikke nok', tekst.includes('den var ikke nok'));
    sjekk('og han kommer ikke hjem', tekst.includes('kommer ikke hjem til Nordvik'));
    await page.screenshot({ path: `${UT}/rpg-k5-merket-falt.png` });
    const s = await tilstand(page);
    sjekk('steget er gjort', s?.steg?.includes('k5-rekka'));
    sjekk('og hun falt ikke før kongen', !s?.flagg?.['k5-falt-for-kongen']);
});

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
