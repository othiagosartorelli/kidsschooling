// Gera o PDF da apostila e (opcional) imagens das páginas para conferência: node pdf.js [pastaPreview]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  // As fontes já estão em apostila/fonts; o link do Google Fonts é só reserva e não é usado aqui.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
  const html = path.join(__dirname, '..', 'amostra-financas-nivel1.html');
  await page.goto('file://' + html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const fam = await page.evaluate(() => [document.fonts.check('600 20px Fredoka'), document.fonts.check('700 20px "Nunito Sans"')]);
  console.log('fontes carregadas (Fredoka, Nunito Sans):', fam);
  // conferência: conteúdo que passa da página ou encosta no rodapé
  const over = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => {
    const pb = p.getBoundingClientRect(); let worst = 0;
    p.querySelectorAll('*').forEach(el => {
      if (el.closest('.band') || el.classList.contains('frame') || el.classList.contains('sun') || el.closest('defs')) return;
      const b = el.getBoundingClientRect(); if (b.height) worst = Math.max(worst, b.bottom - pb.bottom, b.right - pb.right);
    });
    const foot = p.querySelector('.pg-foot'); let clash = -99;
    if (foot) { const fb = foot.getBoundingClientRect(); p.querySelectorAll(':scope > *:not(.pg-foot):not(.band)').forEach(el => { const b = el.getBoundingClientRect(); clash = Math.max(clash, b.bottom - fb.top); }); }
    return { page: i + 1, over: Math.round(worst), footClash: Math.round(clash) };
  }));
  console.log(JSON.stringify(over.filter(o => o.over > 0 || o.footClash > -4)));
  await page.pdf({ path: html.replace('.html', '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  const prev = process.argv[2];
  if (prev) {
    fs.mkdirSync(prev, { recursive: true });
    const els = await page.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(prev, 'p' + String(i + 1).padStart(2, '0') + '.png') });
  }
  await browser.close();
})();
