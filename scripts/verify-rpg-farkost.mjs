// Driver båten i Minnevokteren (/oving/rpg) gjennom en ekte nettleser.
//
//   npm run dev                            # i et annet skall
//   node scripts/verify-rpg-farkost.mjs
//
// Farkosten er den ene delen av spillet der spillerens egen kollisjon slås av
// og en annen maske tar over. Det er nettopp der ting går galt: går båten på
// land, eller blir eleven stående på vannet etter landgang, er spillet ødelagt
// på en måte hun ikke kommer seg ut av. Derfor måles begge veier.
//
// To ting skriptet må ta hensyn til: eleven starter midt i bygda og må gå til
// brygga (fem-seks sekunder), og et tastetrykk må holdes i over 100 ms for å
// bli sett hvis spillet står i en hitstop.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
    reducedMotion: 'no-preference',
});

const sidefeil = [];
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));
page.on('pageerror', (e) => sidefeil.push(String(e)));

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(3000);

/** Tilstanden til båt, elev og maske, lest rett fra scenen. */
const tilstand = () =>
    page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        if (!scene) return null;
        const f = scene.farkoster;
        // Feltene er private i TypeScript, men helt vanlige i kjøretid.
        const baat = f.fartoyer[0];
        return {
            seiler: f.seiler,
            baatX: Math.round(baat.bilde.x),
            baatY: Math.round(baat.bilde.y),
            eleveX: Math.round(scene.helt.sprite.x),
            eleveY: Math.round(scene.helt.sprite.y),
            kroppPa: Boolean(scene.helt.sprite.body?.enable),
            /** Er ruta eleven står i farbar (= vann) eller gåbar (= land/brygge)? */
            paaVann:
                scene.kart.farbart[Math.floor(scene.helt.sprite.y / 16)]?.[
                    Math.floor(scene.helt.sprite.x / 16)
                ],
            blokkert:
                scene.kart.blokkert[Math.floor(scene.helt.sprite.y / 16)]?.[
                    Math.floor(scene.helt.sprite.x / 16)
                ],
            hint: document.querySelector('.text-amber-200.ring-white\\/15')?.textContent ?? null,
        };
    });

const hint = () =>
    page.evaluate(
        () =>
            [...document.querySelectorAll('div')]
                .map((d) => d.textContent)
                .find((t) => t && t.startsWith('E - ')) ?? null
    );

/** Et tastetrykk som er langt nok til å bli sett selv under en hitstop. */
const trykk = async (tast, ms = 140) => {
    await page.keyboard.down(tast);
    await page.waitForTimeout(ms);
    await page.keyboard.up(tast);
};

// ── Fram til brygga ─────────────────────────────────────────────────────────
// Eleven settes rett ut på bryggeenden. Å gå dit tar sju sekunder og kan
// avbrytes av en fiende, og skriptet skal måle båten - ikke gåturen.
const start = await page.evaluate(() => {
    const scene = window.__rpg.scene.getScene('verden');
    const baat = scene.farkoster.fartoyer[0];
    // Bryggeenden ligger på rad 41. Ruta rett over båten er plankene.
    scene.helt.sprite.setPosition(baat.bilde.x, 41 * 16 + 8);
    window.__rpgStore.getState().settHp(9999);
    return { baatX: Math.round(baat.bilde.x), baatY: Math.round(baat.bilde.y) };
});
await page.waitForTimeout(700);
console.log(`     (båten ligger på ${start.baatX}, ${start.baatY})`);

const paaBrygga = await tilstand();
sjekk(
    'brygga er gåbar og usjøbar',
    paaBrygga.blokkert === false && paaBrygga.paaVann === false,
    `blokkert=${paaBrygga.blokkert}, farbart=${paaBrygga.paaVann}`
);
sjekk('hintet tilbyr å gå om bord', (await hint())?.includes('om bord'), await hint());

// ── Om bord ─────────────────────────────────────────────────────────────────
await trykk('e');
await page.waitForTimeout(400);
const ombord = await tilstand();
sjekk('eleven er om bord', ombord.seiler === true);
sjekk(
    'spillerens egen kollisjon er slått av',
    ombord.kroppPa === false,
    `kropp.enable=${ombord.kroppPa}`
);
sjekk(
    'eleven står på dekk, ikke der hun sto',
    Math.abs(ombord.eleveX - ombord.baatX) < 4 && Math.abs(ombord.eleveY - ombord.baatY) < 12,
    `elev (${ombord.eleveX}, ${ombord.eleveY}) vs båt (${ombord.baatX}, ${ombord.baatY})`
);
sjekk('hintet tilbyr å gå i land', (await hint())?.includes('i land'), await hint());
await page.screenshot({ path: `${UT}/farkost-1-ombord.png` });

// ── Ro nordover ─────────────────────────────────────────────────────────────
// Fjorden går nord-sør. Nordover er den lange leia; sørover stenger fjellet
// etter et par ruter. Tregheten gjør at båten bruker et halvt sekund på å komme
// i gang - derfor holdes tasten i tre.
const forRotur = await tilstand();
await page.keyboard.down('w');
await page.waitForTimeout(3000);
await page.keyboard.up('w');
const etterRotur = await tilstand();
sjekk(
    'båten ror nordover',
    etterRotur.baatY < forRotur.baatY - 40,
    `y ${forRotur.baatY} -> ${etterRotur.baatY}`
);
sjekk(
    'eleven ble med båten',
    Math.abs(etterRotur.eleveY - etterRotur.baatY) < 12,
    `elev y=${etterRotur.eleveY}, båt y=${etterRotur.baatY}`
);
sjekk(
    'båten ligger på farbart vann',
    Boolean(
        await page.evaluate(() => {
            const scene = window.__rpg.scene.getScene('verden');
            const b = scene.farkoster.fartoyer[0].bilde;
            return scene.kart.farbart[Math.floor(b.y / 16)]?.[Math.floor(b.x / 16)];
        })
    )
);
await page.screenshot({ path: `${UT}/farkost-2-rotur.png` });

// ── Land stopper båten ──────────────────────────────────────────────────────
// Østover ligger stranda. Båten skal legge seg mot land og bli der, ikke gli
// opp i gresset.
const forLand = await tilstand();
await page.keyboard.down('d');
await page.waitForTimeout(3500);
await page.keyboard.up('d');
await page.waitForTimeout(400);
const motLand = await page.evaluate(() => {
    const scene = window.__rpg.scene.getScene('verden');
    const b = scene.farkoster.fartoyer[0].bilde;
    const tx = Math.floor(b.x / 16);
    const ty = Math.floor(b.y / 16);
    return {
        x: Math.round(b.x),
        farbart: scene.kart.farbart[ty]?.[tx],
        flis: scene.kart.terreng[ty]?.[tx],
    };
});
sjekk('båten flyttet seg østover', motLand.x > forLand.baatX, `${forLand.baatX} -> ${motLand.x}`);
sjekk(
    'båten gikk ikke på land',
    motLand.farbart === true && motLand.flis === 'vann',
    `flis=${motLand.flis}, farbart=${motLand.farbart}`
);
await page.screenshot({ path: `${UT}/farkost-3-mot-land.png` });

// ── I land ──────────────────────────────────────────────────────────────────
await trykk('e');
await page.waitForTimeout(500);
const iland = await tilstand();
sjekk('eleven er av båten', iland.seiler === false);
sjekk('kollisjonen er skrudd på igjen', iland.kroppPa === true, `kropp.enable=${iland.kroppPa}`);
sjekk(
    'eleven står på en rute hun kan stå på',
    iland.blokkert === false,
    `blokkert=${iland.blokkert} på (${iland.eleveX}, ${iland.eleveY})`
);
await page.screenshot({ path: `${UT}/farkost-4-iland.png` });

// ── Går selv igjen ──────────────────────────────────────────────────────────
// Østover, altså innover mot land. Nordover ville hun stått fast i sjøen hvis
// landgangen satte henne på brygga, og da måler prøven kartet og ikke beina.
const forGange = await tilstand();
await page.keyboard.down('d');
await page.waitForTimeout(900);
await page.keyboard.up('d');
const etterGange = await tilstand();
sjekk(
    'eleven går for egen maskin igjen',
    etterGange.eleveX > forGange.eleveX + 8,
    `x ${forGange.eleveX} -> ${etterGange.eleveX}`
);

console.log(`\nsidefeil: ${sidefeil.length ? sidefeil.slice(0, 3).join(' | ') : 'ingen'}`);
if (sidefeil.length) feil.push('konsollfeil');

await browser.close();
console.log(feil.length ? `\n${feil.length} feilet: ${feil.join(', ')}` : '\nFarkosten virker.');
process.exit(feil.length ? 1 : 0);
