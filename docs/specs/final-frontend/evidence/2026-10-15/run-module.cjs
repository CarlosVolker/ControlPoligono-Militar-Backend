// Ejecutor de módulos del arnés de aceptación — reconstruido el 2026-10-15
// (el ejecutor original no quedó persistido en .cache). Uso:
//   node run-module.cjs <modulo.cjs> [salida.json]
// El módulo recibe `page` (Playwright/Chromium) y devuelve su registro.
// Variables: PW_PATH fuerza el paquete playwright; HEADED=1 navegador visible.
const fs = require('node:fs');
const path = require('node:path');

const CANDIDATES = [
  process.env.PW_PATH,
  '/home/gianluca/.npm/_npx/9833c18b2d85bc59/node_modules/playwright',
  '/home/gianluca/.npm/_npx/381cec31605a419a/node_modules/playwright',
].filter(Boolean);

let chromium = null;
for (const c of CANDIDATES) {
  try { ({ chromium } = require(c)); break; } catch (e) { /* siguiente */ }
}
if (!chromium) { console.error('RUNNER_ERROR: paquete playwright no encontrado'); process.exit(2); }

// Los builds de Chromium instalados (1234/1243) difieren del que espera este
// paquete playwright (1247); se usa el más cercano con executablePath. PW_EXECUTABLE
// fuerza uno concreto.
const FALLBACK_EXECUTABLES = [
  '/home/gianluca/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/home/gianluca/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  '/home/gianluca/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
  '/home/gianluca/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
];

async function launchChromium() {
  const headless = process.env.HEADED !== '1';
  if (process.env.PW_EXECUTABLE) {
    return chromium.launch({ headless, executablePath: process.env.PW_EXECUTABLE });
  }
  try {
    return await chromium.launch({ headless });
  } catch (e) {
    // sin build exacto: se intenta la reserva
  }
  let lastErr = null;
  for (const ep of FALLBACK_EXECUTABLES) {
    try { return await chromium.launch({ headless, executablePath: ep }); }
    catch (e) { lastErr = e; }
  }
  throw lastErr;
}

(async () => {
  const modulePath = path.resolve(process.argv[2]);
  const outPath = process.argv[3] ? path.resolve(process.argv[3]) : null;
  let mod = null;
  try {
    const req = require(modulePath);
    if (typeof req === 'function') mod = req;
  } catch (e) { /* se intenta como expresión */ }
  if (!mod) mod = eval(fs.readFileSync(modulePath, 'utf8'));
  if (typeof mod !== 'function') { console.error('RUNNER_ERROR: el módulo no expone una función'); process.exit(3); }
  const browser = await launchChromium();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 920 } });
    const page = await ctx.newPage();
    const result = await mod(page);
    const payload = JSON.stringify(result, null, 2) + '\n';
    if (outPath) fs.writeFileSync(outPath, payload);
    process.stdout.write(payload.slice(0, 4000));
  } finally {
    await browser.close().catch(() => {});
  }
})().catch((e) => { console.error('RUNNER_ERROR:', (e && e.stack) || e); process.exit(1); });
