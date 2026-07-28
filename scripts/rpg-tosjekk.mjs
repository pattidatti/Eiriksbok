import { chromium } from 'playwright';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(p);
await entreEpoke(p, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await p.waitForTimeout(5000);
// 1) Ligger langskipet på stein?
const skip = await p.evaluate(() => {
  const sc = window.__rpg.scene.getScene('verden');
  const pr = (sc.sted.byggKart ? null : null);
  const kart = sc.kart;
  const funn = (sc.verden?.props ?? []).filter(o => o.kind === 'langskip');
  const alle = kart.props?.filter?.(o => o.kind === 'langskip') ?? [];
  const s = funn[0] ?? alle[0];
  if (!s) return { fant: false, nokler: Object.keys(kart) };
  const tx = Math.floor(s.x / 16), ty = Math.floor(s.y / 16);
  return { tx, ty, terreng: kart.terreng?.[ty]?.[tx], blokkert: kart.blokkert?.[ty]?.[tx], farbart: kart.farbart?.[ty]?.[tx] };
});
console.log('LANGSKIP:', JSON.stringify(skip));
// Sikt kameraet mot skipet
if (skip.tx !== undefined) {
  await p.evaluate(([tx, ty]) => {
    const cam = window.__rpg.scene.getScene('verden').cameras.main;
    cam.stopFollow(); cam.centerOn(tx * 16 + 8, ty * 16 + 8);
  }, [skip.tx, skip.ty]);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '.screenshots/langskip.png' });
}
// 2) Hudskyggen: hent faktiske piksler fra helt-teksturen
const hud = await p.evaluate(() => {
  const t = window.__rpg.textures.get('helt');
  const src = t.getSourceImage();
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  // Første ramme er 18x24. Hent en kolonne over halsen.
  const d = ctx.getImageData(0, 0, 18, 24).data;
  const rad = [];
  for (let y = 0; y < 24; y++) {
    const px = [];
    for (let x = 4; x < 14; x++) {
      const i = (y * 18 + x) * 4;
      if (d[i + 3] > 0) px.push('#' + [d[i], d[i+1], d[i+2]].map(v => v.toString(16).padStart(2,'0')).join(''));
    }
    rad.push(y + ': ' + px.join(' '));
  }
  return rad.slice(4, 16);
});
console.log('HELT-PIKSLER (rad 4-15, x 4-13):');
hud.forEach(r => console.log('  ', r));
await b.close();
