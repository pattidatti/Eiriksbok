// Driver slutten på kampanjen: bordet «Og du?» og epilogen på Nordvik i 1100.
//
//   npm run dev                                # i et annet skall
//   node scripts/verify-rpg-mellomspill5.mjs
//
// Det som måles:
//
//   1. Døden ved brua tar ingen skjerm av seg selv: beskjeden fra rekka leses,
//      og så kommer bordet med én gang. Ingen tur innom hallen imellom.
//   2. Tidsrekka legger alle ni kildene ut samtidig, og de to uten forfatter -
//      steinen og skrinet - er tegnet annerledes enn bøkene.
//   3. Det åttende kortet er ikke en tekst: merkene på kortet sier «Laget av»
//      og ikke «Skrevet av», og utdraget står uten hermetegn.
//   4. Fasiten står også når eleven bommer. Samme regel som på de fire andre
//      bordene.
//   5. Det tomme feltet er henne selv, og linjene under er de valgene hun
//      faktisk tok - ett per kapittel, hentet fra flaggene.
//   6. Bordet fullført gir `[Arkeologi som kilde]` og `[De skriftløse]`, og
//      sender henne til Nordvik i 1100 - ikke til hallen.
//   7. Epilogen: kameraet stiger, oppgavekortet peker på haugene, og haugene
//      vet at skrinet ligger der hvis hun tok det i 793.
//   8. Det kontrafaktiske: tre spørsmål som veier ulikt, et kart som tegnes om,
//      `[Hva om]` som forstått - og så er kampanjen over.

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

/**
 * Fem kapitler bak seg, og hun står i rekka ved brua.
 *
 * Flaggene er valgt slik at hvert kapittel har satt sitt: det er nettopp de
 * det tomme feltet skal lese, og et bord som bare kan prøves med ett flagg
 * satt, er et bord som ikke er prøvd.
 */
const HELE_KAMPANJEN = {
    steg: [
        'kapittel:1',
        'mellomspill:mellomspill-1',
        'kapittel:2',
        'mellomspill:mellomspill-2',
        'kapittel:3',
        'mellomspill:mellomspill-3',
        'kapittel:4',
        'mellomspill:mellomspill-4',
        'k5-leiren',
        'k5-brynja',
    ],
    sette: ['opptakt:k5'],
    flagg: {
        'k1-tok-skrinet': true,
        'k2-matet-harald': true,
        'k3-nektet': true,
        'k4-sonnen-med': true,
        'k5-brynja-igjen': true,
    },
    kilder: [
        'alkuin-aethelred',
        'angelsaksiske-kroniken-793',
        'haraldskvadet-hafrsfjord',
        'heimskringla-hafrsfjord',
        'kulisteinen',
        'heimskringla-kristningen',
        'sigvat-erfidrapa',
        'heimskringla-stiklestad',
    ],
    begreper: { skjoldborg: 'forstatt', etterpaaklokskap: 'hort' },
    klokke: { aar: 1066, dag: 1 },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
await entreEpoke(page, { kapittel: 5, sisteSted: 'stanford-bru', kampanje: HELE_KAMPANJEN });
await page.waitForTimeout(3400);

const tilstand = () =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { kapittel: s.kapittel, begreper: s.begreper, steg: s.steg, flagg: s.flagg } : null;
    });

const stedNaa = () =>
    page.evaluate(() => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null);

const klikk = async (tekst) => {
    await page.getByRole('button', { name: tekst }).first().click();
    await page.waitForTimeout(340);
};

const gaaTil = async (type, id) => {
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

/** Velger alternativ n i veiingen og går videre. */
const vei = async (n, videre) => {
    const valg = await page.$$('[data-prove="veiing"] button');
    if (!valg[n]) throw new Error(`veiingen hadde ikke alternativ ${n}`);
    await valg[n].click();
    await page.waitForTimeout(340);
    await klikk(videre);
};

const bordtekst = async () => (await page.textContent('[data-prove="mellomspill"]')) ?? '';

// ── 1. Fra rekka til bordet, uten omvei ─────────────────────────────────────
await gaaTil('npc', 'harald-hardraade');
await klikk('Hvor blir det av dem?');
await page.waitForTimeout(400);
await gaaTil('landemerke', 'veien-fra-york');
await klikk('Se hva som kommer');
await page.waitForTimeout(600);
await klikk('Over brua');
await page.waitForTimeout(500);
await gaaTil('landemerke', 'rekka-brua');
await klikk('Still deg i rekka');
await page.waitForTimeout(900);
await page.evaluate(() => window.__rpgStore.setState({ hp: 1 }));
await page.waitForTimeout(2600);

sjekk('rekka gir seg med en beskjed', ((await page.textContent('body')) ?? '').includes('Ved brua'));
sjekk('bordet ligger ikke oppå den', (await page.locator('[data-prove="mellomspill"]').count()) === 0);
await klikk('Videre');
await page.waitForTimeout(1600);
const etterDoden = await tilstand();
sjekk('kapittelet er gjort opp', etterDoden?.steg?.includes('kapittel:5'));
sjekk('bordet kommer med én gang', (await page.locator('[data-prove="mellomspill"]').count()) === 1);
sjekk('og hun er ikke sendt til hallen', (await stedNaa()) === 'stanford-bru', String(await stedNaa()));

// ── 2. Tidsrekka ────────────────────────────────────────────────────────────
sjekk('bordet heter «Og du?»', (await bordtekst()).includes('Og du?'));
await klikk('Legg dem i rekkefølge');
await page.waitForTimeout(2600);
const linja = await bordtekst();
sjekk('Alkuin ligger på linja', linja.includes('Alkuins brev'));
sjekk('og Snorre helt til høyre', linja.includes('Heimskringla'));
sjekk('krøniken om 1066 er med', linja.includes('Krøniken om året 1066'));
sjekk('og skrinet, som er nytt', linja.includes('Skrinet fra Melhus'));

// De to uten forfatter skal være tegnet annerledes enn bøkene. Fargen er hele
// argumentet i veiingen som følger: hun skal kunne se svaret sitt i formen.
const streker = await page.evaluate(() => {
    const felt = document.querySelector('[data-prove="mellomspill"]');
    const bjelker = [...(felt?.querySelectorAll('li span[class*="absolute inset-y-0 rounded-full"]') ?? [])];
    return bjelker.map((b) => b.className);
});
sjekk('ni streker er tegnet', streker.length === 9, String(streker.length));
sjekk(
    'to av dem er de uten forfatter',
    streker.filter((k) => k.includes('emerald')).length === 2,
    String(streker.filter((k) => k.includes('emerald')).length)
);
await page.screenshot({ path: `${UT}/rpg-m5-tidsrekka.png` });

// ── 3. Kortet som ikke er en tekst ──────────────────────────────────────────
await vei(1, 'Legg ut skrinet');
await page.waitForTimeout(500);
const skrinet = await bordtekst();
sjekk('skrinet er lagt ut', skrinet.includes('Et lite hus av barlind'));
sjekk('merket sier «Laget av»', skrinet.includes('Laget av'));
sjekk('og ikke «Skrevet av»', !skrinet.includes('Skrevet av'));
sjekk('funnstedet står', skrinet.includes('Overhalla'));
sjekk('læreren kan slå det opp', skrinet.includes('T8144'));
const anfoersel = await page.evaluate(() => {
    const felt = document.querySelector('[data-prove="mellomspill"]');
    return [...(felt?.querySelectorAll('p.italic') ?? [])].some((p) => p.textContent?.startsWith('«'));
});
sjekk('en gjenstand siteres ikke', anfoersel === false);
await page.screenshot({ path: `${UT}/rpg-m5-skrinet.png` });

// ── 4. Fasiten står også når hun bommer ─────────────────────────────────────
await page.$$('[data-prove="veiing"] button').then((b) => b[1].click());
await page.waitForTimeout(400);
sjekk(
    'fasiten står også når hun bommer',
    (await bordtekst()).includes('Et brev vil overbevise deg')
);
await klikk('Neste spørsmål');
await vei(1, 'Neste spørsmål');
const detFjerde = await bordtekst();
sjekk('de fire hundre funnene står i spørsmålet', detFjerde.includes('fire hundre'));
await vei(1, 'Se etter deg selv');

// ── 5. Det tomme feltet er henne ────────────────────────────────────────────
await klikk('Se etter deg selv');
await page.waitForTimeout(2600);
const tomt = await bordtekst();
sjekk('feltet er henne selv', tomt.includes('Ingen kilde'));
sjekk('ingen av kildene nevner henne', tomt.includes('Ingen av dem nevner deg'));
sjekk('skrinet fra 793 står oppført', tomt.includes('Du tok et skrin fra kirken'));
sjekk('kornet fra 872 står oppført', tomt.includes('Du ga korn til Harald'));
sjekk('neiet fra 995 står oppført', tomt.includes('Du sa nei, høyt'));
sjekk('sønnen fra 1030 står oppført', tomt.includes('sønnen din til Stiklestad'));
sjekk('brynja fra 1066 står oppført', tomt.includes('brynja ligge i kista'));
sjekk('men ikke det hun ikke gjorde', !tomt.includes('Du brente rommet'));
await page.screenshot({ path: `${UT}/rpg-m5-tomtfelt.png` });

await page.$$('[data-prove="veiing"] button').then((b) => b[1].click());
await page.waitForTimeout(400);
const fasit = await bordtekst();
sjekk('håndskriftet som bryter av står i fasiten', fasit.includes('innskutt blad'));
sjekk('og mannen med øksa', fasit.includes('holdt brua alene'));
await klikk('Se på bordet');
await page.waitForTimeout(400);

// ── 6. Regnskapet, og veien til 1100 ────────────────────────────────────────
await klikk('Legg fra deg kildene');
await page.waitForTimeout(1600);
const etterBordet = await tilstand();
sjekk('bordet er fullført', etterBordet?.steg?.includes('mellomspill:mellomspill-5'));
sjekk(
    'arkeologi som kilde er forstått',
    etterBordet?.begreper?.['arkeologi-som-kilde'] === 'forstatt'
);
sjekk('de skriftløse er forstått', etterBordet?.begreper?.['de-skriftlose'] === 'forstatt');
await page.waitForTimeout(4400);
sjekk('hun kommer til Nordvik i 1100', (await stedNaa()) === 'nordvik-1100', String(await stedNaa()));

// ── 7. Epilogen ─────────────────────────────────────────────────────────────
// Klippet varer i knappe tretti sekunder (§8 sier maks førti), og det kan ikke
// hoppes over første gang. Prøven venter det ut, for det er det eleven gjør.
await page.waitForTimeout(6500);
const klipper = () =>
    page.evaluate(() => window.__rpg?.scene.getScene('verden')?.klippAktivt ?? null);
sjekk('epilogklippet spilles', (await klipper()) === true);
await page.screenshot({ path: `${UT}/rpg-epilog-kamera-stiger.png` });
await page.waitForTimeout(28000);
sjekk('og det er over etter under førti sekunder', (await klipper()) === false);

const iEpilogen = (await page.textContent('body')) ?? '';
sjekk('oppgavekortet peker på haugene', iEpilogen.includes('Haugene'));
await page.screenshot({ path: `${UT}/rpg-epilog-gaarden.png` });

const kartet = await page.evaluate(() => {
    const s = window.__rpg?.scene.getScene('verden');
    return {
        kors: (s?.kart?.props ?? []).filter((p) => p.kind === 'kors').length,
        skip: (s?.kart?.props ?? []).filter((p) => p.kind === 'langskip').length,
        folk: (s?.sted?.npcer ?? []).map((n) => n.id),
    };
});
sjekk('kirkegården står med rader', kartet.kors === 20, String(kartet.kors));
sjekk('og fjorden er tom', kartet.skip === 0, String(kartet.skip));
sjekk('to mennesker bor her nå', kartet.folk.length === 2, kartet.folk.join(', '));

await gaaTil('landemerke', 'haugene-1100');
const haugene = (await page.textContent('body')) ?? '';
sjekk('haugene har mistet navnene', haugene.includes('kaller dem haugene'));
sjekk('men hun vet hvem som ligger der', haugene.includes('Du er den eneste som gjør det'));
sjekk('og skrinet ligger i den ene', haugene.includes('åtte hundre år'));

// ── 8. Det kontrafaktiske ───────────────────────────────────────────────────
await klikk('Bli stående. Tenk på hva som skulle til');
await page.waitForTimeout(700);
sjekk('kartet kommer fram', (await page.locator('[data-prove="kontrafaktisk"]').count()) === 1);
const valgene = (await page.textContent('[data-prove="kontrafaktisk"]')) ?? '';
sjekk('seilet er ett av spørsmålene', valgene.includes('Hva om seilet aldri var funnet opp?'));
sjekk('murene er ett', valgene.includes('Hva om klostrene hadde vært befestet?'));
sjekk(
    'og kornet spør om det motsatte av det hun gjorde',
    valgene.includes('Hva om Åsa hadde matet den andre siden?')
);

await klikk('Hva om seilet aldri var funnet opp?');
await page.waitForTimeout(2600);
const utenSeil = (await page.textContent('[data-prove="kontrafaktisk"]')) ?? '';
sjekk('uten seil rakner alt', utenSeil.includes('Ingen Grønland'));
sjekk('og det står hva slags årsak det er', utenSeil.includes('bærer alt annet'));
const ruterUtenSeil = await page.$$eval('[data-prove="kontrafaktisk"] svg path[stroke="#7dd3fc"]', (n) => n.length);
sjekk('bare kystruta er igjen på kartet', ruterUtenSeil === 1, String(ruterUtenSeil));
await page.screenshot({ path: `${UT}/rpg-epilog-kartet.png` });

await klikk('Hva om Åsa hadde matet den andre siden?');
await page.waitForTimeout(2600);
const kornet = (await page.textContent('[data-prove="kontrafaktisk"]')) ?? '';
sjekk('kornet endrer nesten ingenting', kornet.includes('Her rakner ingenting'));
const ruterKorn = await page.$$eval('[data-prove="kontrafaktisk"] svg path[stroke="#7dd3fc"]', (n) => n.length);
sjekk('og kartet står som før', ruterKorn === 4, String(ruterKorn));

await klikk('Legg fra deg kartet');
await page.waitForTimeout(1600);
const slutt = await tilstand();
sjekk('epilogen er gjort opp', slutt?.steg?.includes('puzzle:epilog'));
sjekk('hva om er forstått', slutt?.begreper?.kontrafaktisk === 'forstatt');
await page.waitForTimeout(4400);
sjekk('og hun ender i hallen', (await stedNaa()) === 'hub', String(await stedNaa()));

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
