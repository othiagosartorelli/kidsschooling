// Gera as ilustrações da apostila a partir dos modelos 3D (node render.js [nome...])
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto('file://' + path.join(__dirname, 'render.html'));
  const names = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => Object.keys(window.SHOTS));
  const outDir = path.join(__dirname, '..', 'img'); fs.mkdirSync(outDir, { recursive: true });
  const meta = fs.existsSync(path.join(outDir, 'meta.json')) ? JSON.parse(fs.readFileSync(path.join(outDir, 'meta.json'))) : {};
  for (const n of names) {
    const p2 = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
    p2.on('pageerror', e => console.log('pageerror:', e.message));
    await p2.goto('file://' + path.join(__dirname, 'render.html'));
    const r = await p2.evaluate(n => window.renderShot(n), n);
    fs.writeFileSync(path.join(outDir, n + '.png'), Buffer.from(r.dataURL.split(',')[1], 'base64'));
    meta[n] = { w: r.w, h: r.h, markers: r.markers };
    console.log(n, r.w + 'x' + r.h, JSON.stringify(r.touches));
    await p2.close();
  }
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 1));
  await browser.close();
})();
