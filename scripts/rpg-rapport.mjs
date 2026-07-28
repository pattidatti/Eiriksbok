// Bygger den visuelle rapporten: en side med før/etter-skyvere, der bildene
// ligger inne i HTML-en som data-URI-er.
//
// Bildene *må* bygges inn. Sida vises under en streng CSP som blokkerer alle
// forespørsler ut, så en <img src="fil.png"> ville blitt et tomt felt.
//
//   node scripts/rpg-rapport.mjs <ut-fil>

import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const UT = process.argv[2];
if (!UT) {
    console.error('bruk: node scripts/rpg-rapport.mjs <ut-fil>');
    process.exit(1);
}

/**
 * PNG til innebygd WebP.
 *
 * WebP og ikke JPEG: dette er pikselkunst med harde kanter, og JPEG legger
 * ringer rundt hver eneste flisovergang. WebP holder kantene skarpe og lander
 * likevel på en brøkdel av PNG-en - og hele sida skal bæres av åtte bilder.
 */
async function bygg(fil, bredde = 1100) {
    const raa = await readFile(`.screenshots/${fil}.png`);
    const webp = await sharp(raa).resize(bredde).webp({ quality: 86 }).toBuffer();
    console.log(`  ${fil}: ${Math.round(webp.length / 1024)} kB`);
    return `data:image/webp;base64,${webp.toString('base64')}`;
}

const PAR = [
    {
        id: 'vaer',
        stikkord: 'Samme rute, to øyeblikk',
        tittel: 'Sola går bak en sky',
        brod: `Kameraet står stille. Det eneste som skiller de to bildene er tid: et skydekke driver over Nordvik, og
               skyggen sveiper diagonalt over bygda. Skydekket er ikke bilder i scenen - det regnes ut per piksel i
               etterbehandlingen, av to prøver i et støyfelt som driver i vindretningen.`,
        venstre: 'vaer-sol',
        hoyre: 'vaer-skygge',
        merkeV: 'Sol',
        merkeH: 'Skygge',
    },
    {
        id: 'bygd',
        stikkord: 'Bygda',
        tittel: 'Lys, blomster og røyk fra taket',
        brod: `Graderingen trekker skyggene mot kaldt blått og høylysene mot varmt gult - det samme grepet
               <code>ramp()</code> gjør inne i en enkelt sprite, men nå over hele bildet, så figurer og landskap står i
               samme lys. I gresset står det hundre og sytti blomster, bakt rett inn i bakketeksturen. Over langhuset
               står det røyk, fordi noen bor der.`,
        venstre: 'FOR-bygd-2',
        hoyre: 'ETTER-bygd-2',
        merkeV: 'Før',
        merkeH: 'Etter',
    },
    {
        id: 'ting',
        stikkord: 'Tingplassen',
        tittel: 'Bålet lyser opp bakken',
        brod: `Bålet hadde ett svakt lysfelt før. Nå er det to - ett vidt som farger jorda rundt, ett tett i selve
               flammen - pluss gnister som stiger og dør ut. Det ene lysfeltet alene ble enten en grøtete flekk eller et
               hardt punkt, aldri begge deler.`,
        venstre: 'FOR-ting-2',
        hoyre: 'ETTER-ting-2',
        merkeV: 'Før',
        merkeH: 'Etter',
    },
    {
        id: 'fjord',
        stikkord: 'Fjorden',
        tittel: 'Vannet fikk en bunn',
        brod: `Fjorden var én blåfarge fra bredd til bredd, og det leste som gulv. Nå måles avstanden fra hver
               vannrute ut til nærmeste land, og alt som ligger tre ruter eller mer fra stranda får en mørkere tone.
               Det er nok til at øyet ser en bunn som skråner.`,
        venstre: 'FOR-fjord-2',
        hoyre: 'ETTER-fjord-2',
        merkeV: 'Før',
        merkeH: 'Etter',
    },
];

console.log('bygger bilder:');
for (const par of PAR) {
    par.bildeV = await bygg(par.venstre);
    par.bildeH = await bygg(par.hoyre);
}

const skyver = (par) => `
<figure class="par" id="${par.id}">
  <div class="ramme" style="--pos:50%">
    <img class="under" src="${par.bildeH}" alt="${par.tittel} - ${par.merkeH}">
    <div class="over"><img src="${par.bildeV}" alt="${par.tittel} - ${par.merkeV}"></div>
    <div class="strek" aria-hidden="true"><span class="grep"></span></div>
    <span class="merke v">${par.merkeV}</span>
    <span class="merke h">${par.merkeH}</span>
    <input type="range" min="0" max="100" value="50" step="0.5"
           aria-label="Sammenlign ${par.merkeV} og ${par.merkeH}: ${par.tittel}">
  </div>
  <figcaption>Dra i skyveren. Venstre side er <b>${par.merkeV.toLowerCase()}</b>, høyre er <b>${par.merkeH.toLowerCase()}</b>.</figcaption>
</figure>`;

const seksjon = (par) => `
<section class="blokk">
  <div class="tekst">
    <p class="stikkord">${par.stikkord}</p>
    <h2>${par.tittel}</h2>
    <p>${par.brod}</p>
  </div>
  ${skyver(par)}
</section>`;

const html = `<title>Nordvik i nytt lys</title>
<style>
  :root {
    --grunn: #f1f3ee;
    --flate: #fbfcf9;
    --kant: #d9ded4;
    --blekk: #161d26;
    --demp: #5a6572;
    --gull: #8a6410;
    --fjord: #2c5f8a;
    --mose: #3f6a39;
    --skygge: 0 1px 2px rgba(22,29,38,.06), 0 8px 28px -12px rgba(22,29,38,.22);
    --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --grunn: #12181f; --flate: #1a222c; --kant: #2c3743;
      --blekk: #e7ebe6; --demp: #98a4b0; --gull: #e0b64a;
      --fjord: #6fa8d4; --mose: #7fb373;
      --skygge: 0 1px 2px rgba(0,0,0,.4), 0 10px 30px -14px rgba(0,0,0,.7);
    }
  }
  :root[data-theme="dark"] {
    --grunn: #12181f; --flate: #1a222c; --kant: #2c3743;
    --blekk: #e7ebe6; --demp: #98a4b0; --gull: #e0b64a;
    --fjord: #6fa8d4; --mose: #7fb373;
    --skygge: 0 1px 2px rgba(0,0,0,.4), 0 10px 30px -14px rgba(0,0,0,.7);
  }
  :root[data-theme="light"] {
    --grunn: #f1f3ee; --flate: #fbfcf9; --kant: #d9ded4;
    --blekk: #161d26; --demp: #5a6572; --gull: #8a6410;
    --fjord: #2c5f8a; --mose: #3f6a39;
    --skygge: 0 1px 2px rgba(22,29,38,.06), 0 8px 28px -12px rgba(22,29,38,.22);
  }

  body {
    background: var(--grunn);
    color: var(--blekk);
    font-family: var(--sans);
    font-size: 17px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }
  .ark { max-width: 1180px; margin: 0 auto; padding: clamp(2rem, 5vw, 4.5rem) clamp(1rem, 4vw, 2.5rem) 5rem; }

  /* ── Toppen ──────────────────────────────────────────────────────────── */
  header { display: flex; flex-direction: column; gap: 1.1rem; margin-bottom: clamp(2.5rem, 6vw, 4rem); }
  .eyebrow {
    font-family: var(--mono); font-size: .74rem; letter-spacing: .16em; text-transform: uppercase;
    color: var(--gull); margin: 0;
  }
  h1 {
    font-size: clamp(2.1rem, 5.4vw, 3.6rem); line-height: 1.04; letter-spacing: -.035em;
    font-weight: 800; text-wrap: balance; margin: 0; max-width: 20ch;
  }
  .ingress { font-size: clamp(1.02rem, 2vw, 1.16rem); color: var(--demp); max-width: 62ch; margin: 0; }

  /* ── Nøkkeltall ──────────────────────────────────────────────────────── */
  .tall {
    display: grid; gap: 1px; background: var(--kant);
    grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
    border: 1px solid var(--kant); border-radius: 10px; overflow: hidden; margin: 2.4rem 0 0;
  }
  .tall div { background: var(--flate); padding: 1rem 1.15rem; }
  .tall dt {
    font-family: var(--mono); font-size: .7rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--demp); margin: 0 0 .35rem;
  }
  .tall dd {
    margin: 0; font-family: var(--mono); font-size: 1.42rem; font-variant-numeric: tabular-nums;
    letter-spacing: -.02em; color: var(--blekk);
  }
  .tall dd small { font-size: .78rem; color: var(--demp); letter-spacing: 0; }

  /* ── Blokkene ────────────────────────────────────────────────────────── */
  .blokk { margin-top: clamp(3rem, 7vw, 5rem); }
  .tekst { max-width: 66ch; display: flex; flex-direction: column; gap: .7rem; margin-bottom: 1.6rem; }
  .stikkord {
    font-family: var(--mono); font-size: .74rem; letter-spacing: .13em; text-transform: uppercase;
    color: var(--demp); margin: 0; display: flex; align-items: baseline; gap: .6rem;
  }
  h2 {
    font-size: clamp(1.42rem, 3vw, 1.95rem); line-height: 1.16; letter-spacing: -.024em;
    font-weight: 700; margin: 0; text-wrap: balance;
  }
  .tekst p:not(.stikkord) { margin: 0; color: var(--demp); }
  code {
    font-family: var(--mono); font-size: .88em; background: var(--flate);
    border: 1px solid var(--kant); border-radius: 4px; padding: .08em .34em; color: var(--blekk);
  }

  /* ── Paletten ────────────────────────────────────────────────────────── */
  .palett {
    margin-top: clamp(2.6rem, 6vw, 4rem); display: grid; gap: 1px; background: var(--kant);
    border: 1px solid var(--kant); border-radius: 10px; overflow: hidden;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  .halv { background: var(--flate); padding: clamp(1.1rem, 2.5vw, 1.6rem); display: flex; flex-direction: column; gap: .7rem; }
  .palettbrod { margin: 0; color: var(--demp); font-size: .94rem; max-width: 46ch; }
  .palettbrod.smal { font-size: .88rem; }
  .prover { list-style: none; margin: .2rem 0 0; padding: 0; display: grid; gap: .4rem; }
  .prover li { display: grid; grid-template-columns: 14px minmax(0,1fr) auto; gap: .7rem; align-items: center; }
  .brikke { width: 14px; height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(22,29,38,.22); }
  .navn { font-size: .88rem; color: var(--blekk); }
  .hex {
    font-family: var(--mono); font-size: .76rem; color: var(--demp);
    font-variant-numeric: tabular-nums; letter-spacing: .01em;
  }

  /* ── Skyveren ────────────────────────────────────────────────────────── */
  .par { margin: 0; }
  .ramme {
    position: relative; border-radius: 10px; overflow: hidden; box-shadow: var(--skygge);
    border: 1px solid var(--kant); line-height: 0; touch-action: pan-y;
  }
  .ramme img { width: 100%; height: auto; display: block; }
  .ramme .over { position: absolute; inset: 0; width: var(--pos); overflow: hidden; }
  .ramme .over img { width: 100cqw; }
  .ramme { container-type: inline-size; }
  .strek {
    position: absolute; top: 0; bottom: 0; left: var(--pos); width: 2px;
    background: rgba(255,255,255,.9); transform: translateX(-1px); pointer-events: none;
    box-shadow: 0 0 0 1px rgba(22,29,38,.35);
  }
  .grep {
    position: absolute; top: 50%; left: 50%; width: 38px; height: 38px; border-radius: 50%;
    transform: translate(-50%,-50%); background: rgba(255,255,255,.94);
    box-shadow: 0 0 0 1px rgba(22,29,38,.3), 0 4px 12px rgba(22,29,38,.3);
  }
  .grep::before, .grep::after {
    content: ""; position: absolute; top: 50%; width: 0; height: 0;
    border-top: 5px solid transparent; border-bottom: 5px solid transparent;
  }
  .grep::before { left: 8px; border-right: 6px solid #161d26; transform: translateY(-50%); }
  .grep::after { right: 8px; border-left: 6px solid #161d26; transform: translateY(-50%); }
  .merke {
    position: absolute; top: 12px; font-family: var(--mono); font-size: .68rem; letter-spacing: .12em;
    text-transform: uppercase; padding: .3rem .6rem; border-radius: 5px; line-height: 1;
    background: rgba(10,14,20,.72); color: #fff; pointer-events: none;
  }
  .merke.v { left: 12px; }
  .merke.h { right: 12px; }
  .ramme input[type="range"] {
    position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: ew-resize;
    -webkit-appearance: none; appearance: none; background: transparent;
  }
  .ramme input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 44px; height: 100%; }
  .ramme input[type="range"]::-moz-range-thumb { width: 44px; height: 100%; border: 0; background: transparent; }
  .ramme:focus-within { outline: 3px solid var(--gull); outline-offset: 3px; }
  figcaption { font-size: .88rem; color: var(--demp); margin-top: .7rem; }
  figcaption b { color: var(--blekk); font-weight: 600; }

  /* ── Notatet nederst ─────────────────────────────────────────────────── */
  .notat {
    margin-top: clamp(3.5rem, 8vw, 5.5rem); background: var(--flate); border: 1px solid var(--kant);
    border-radius: 10px; padding: clamp(1.3rem, 3vw, 2rem);
  }
  .notat h2 { margin-bottom: .9rem; }
  .notat p { color: var(--demp); max-width: 68ch; margin: 0 0 .9rem; }
  .notat p:last-child { margin-bottom: 0; }
  .liste { list-style: none; padding: 0; margin: 0 0 1.2rem; display: grid; gap: .55rem; }
  .liste li { display: flex; gap: .7rem; align-items: baseline; color: var(--demp); }
  .liste li::before { content: "—"; color: var(--gull); flex: none; }
  .liste b { color: var(--blekk); font-weight: 600; }
  .tabell { width: 100%; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: .92rem; min-width: 420px; }
  th, td { text-align: left; padding: .5rem .8rem .5rem 0; border-bottom: 1px solid var(--kant); }
  th {
    font-family: var(--mono); font-size: .68rem; letter-spacing: .1em; text-transform: uppercase;
    color: var(--demp); font-weight: 500;
  }
  td.n { font-family: var(--mono); font-variant-numeric: tabular-nums; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
</style>

<div class="ark">
  <header>
    <p class="eyebrow">Minnevokteren · /oving/rpg · gren rpg-pen</p>
    <h1>Nordvik i nytt lys</h1>
    <p class="ingress">
      Vikingbygda hadde flat, jevn belysning uten en eneste skygge som beveget seg. Den har nå et drivende skydekke,
      gradert lys, tåke, svaiende skog, røyk fra takene og en fjord med bunn i - regnet ut per piksel i stedet for
      tegnet som lag oppå lag.
    </p>
    <dl class="tall">
      <div><dt>Skyer og tåke</dt><dd>0 <small>sprites</small></dd></div>
      <div><dt>Teksturprøver</dt><dd>3 <small>per piksel</small></dd></div>
      <div><dt>Objekter i scenen</dt><dd>+14 <small>mot 292</small></dd></div>
      <div><dt>Bildefrekvens</dt><dd>74 % <small>av utgangspunktet</small></dd></div>
    </dl>
  </header>

  <section class="palett">
    <div class="halv">
      <p class="stikkord">Uendret · paletten</p>
      <p class="palettbrod">Ikke én flisfarge er rørt. Nordvik er laget av de samme ti verdiene som før.</p>
      <ul class="prover">
        ${[
            ['gress', '#4d7c45'],
            ['løv', '#3d7a42'],
            ['vann', '#2c5f8a'],
            ['sand', '#d8c89a'],
            ['jord', '#8a7355'],
            ['åker', '#7a6236'],
            ['tømmer', '#6b5335'],
            ['tak', '#3d5c30'],
            ['stein', '#7d8590'],
            ['himmel', '#8fb8d8'],
        ]
            .map(
                ([navn, hex]) =>
                    `<li><span class="brikke" style="background:${hex}"></span>` +
                    `<span class="navn">${navn}</span><span class="hex">${hex}</span></li>`
            )
            .join('')}
      </ul>
    </div>
    <div class="halv">
      <p class="stikkord">Nytt · lyset</p>
      <p class="palettbrod">
        Det som er lagt til er et <i>lysbilde</i> og et <i>værlag</i> på epoken. Paletten sier hva gresset er laget
        av; lysbildet sier hva slags dag det er.
      </p>
      <ul class="prover">
        ${[
            ['skygge trekkes mot', '#7f9fd8'],
            ['høylys trekkes mot', '#fff2cf'],
            ['skyskygge', '#93a9c8'],
            ['tåke', '#d6e4f0'],
        ]
            .map(
                ([navn, hex]) =>
                    `<li><span class="brikke" style="background:${hex}"></span>` +
                    `<span class="navn">${navn}</span><span class="hex">${hex}</span></li>`
            )
            .join('')}
      </ul>
      <p class="palettbrod smal">
        En rå vikingmorgen og en tørr romersk ettermiddag kan dele hver eneste flisfarge og likevel se ut som to
        verdener. Det er derfor de er skilt.
      </p>
    </div>
  </section>

  ${PAR.map(seksjon).join('\n')}

  <section class="notat">
    <h2>Hva som faktisk ble gjort</h2>
    <ul class="liste">
      <li><b>Etterbehandling på hovedkameraet.</b> Ett fullskjermspass som graderer bildet - kalde skygger, varme
        høylys, mykt skuldertrekk på høylysene og vignett - og som samtidig regner ut skydekke og tåke fra et sømløst
        støyfelt som driver i vindretningen.</li>
      <li><b>Skyene lå først som tjue gjennomsiktige bilder</b> som drev over kartet. De kostet halve
        bildefrekvensen i ren overtegning og ble flyttet inn i shaderen, der de koster to teksturprøver.</li>
      <li><b>Glødepasset ble kuttet.</b> Fire ekstra prøver per piksel som gjorde nesten ingenting som ikke
        gloa-spritene rundt bålet alt gjorde bedre - de vet hvor lyset er, mens shaderen bare gjettet.</li>
      <li><b>Skogen svaier</b> i kastevind som vandrer over kartet, i samme retning som skyene driver.</li>
      <li><b>170 blomster</b> er bakt rett inn i bakketeksturen, så de koster null tegnekall.</li>
      <li><b>Røyk fra takene, gnister fra bålet, glitter på fjorden, fugler over himmelen</b> - alt som har en
        bestemt plass i verden ligger igjen som sprites. Alt som er like sant overalt ligger i shaderen.</li>
    </ul>

    <h2>Om måletallene</h2>
    <div class="tabell">
      <table>
        <thead><tr><th>Trinn</th><th>Bildefrekvens</th><th>Andel</th></tr></thead>
        <tbody>
          <tr><td>Utgangspunktet (main)</td><td class="n">60,0</td><td class="n">100 %</td></tr>
          <tr><td>Første utgave, skyer som sprites</td><td class="n">31,8</td><td class="n">53 %</td></tr>
          <tr><td>Etter opprydningen</td><td class="n">44,3</td><td class="n">74 %</td></tr>
        </tbody>
      </table>
    </div>
    <p style="margin-top:1.1rem">
      Tallene er medianer fra fire runder der de to utgavene måles vekselvis i samme økt, så maskinlasten rammer
      begge likt. Utgangspunktet ligger på taket på 60, så det har ukjent margin over.
    </p>
    <p>
      <b>Men dette er headless Chromium, som rasteriserer på CPU-en.</b> Der er en fullskjerms shader
      uforholdsmessig dyr og alfablanding uforholdsmessig billig - altså stikk motsatt av en ekte GPU. Tallene
      duger til å sammenligne to utgaver av denne koden med hverandre. De sier ingenting sikkert om hva en
      Chromebook klarer. Det må måles på en Chromebook før dette går i produksjon.
    </p>
  </section>
</div>

<script>
  for (const ramme of document.querySelectorAll('.ramme')) {
    const glider = ramme.querySelector('input[type="range"]');
    const still = () => ramme.style.setProperty('--pos', glider.value + '%');
    glider.addEventListener('input', still);
    still();
  }
</script>
`;

await writeFile(UT, html);
console.log(`\nskrev ${UT} (${Math.round(html.length / 1024)} kB)`);
