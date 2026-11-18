// Judge probe: load a served URL in Chromium and WebKit; report title, h1, colours, request origins, console errors.
// Usage: node page-probe.mjs <repoRoot> <url>
import { join } from 'node:path';
import { createRequire } from 'node:module';
const [root, url] = process.argv.slice(2);
const require = createRequire(join(root, 'package.json'));
const pw = require('@playwright/test');
for (const name of ['chromium', 'webkit']) {
  const browser = await pw[name].launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const reqs = []; const errors = [];
  page.on('request', (r) => reqs.push(r.url()));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url); await page.waitForLoadState('networkidle');
  const info = await page.evaluate(() => ({
    title: document.title, h1: document.querySelector('main h1')?.textContent, p: document.querySelector('main p')?.textContent,
    bg: getComputedStyle(document.documentElement).backgroundColor, color: getComputedStyle(document.body).color, lang: document.documentElement.lang,
    inlineScripts: [...document.querySelectorAll('script:not([src])')].length, inlineStyles: document.querySelectorAll('style').length,
  }));
  console.log(name, JSON.stringify(info), 'origins', [...new Set(reqs.map((u) => new URL(u).origin))], 'nReq', reqs.length, 'errors', errors);
  await browser.close();
}
