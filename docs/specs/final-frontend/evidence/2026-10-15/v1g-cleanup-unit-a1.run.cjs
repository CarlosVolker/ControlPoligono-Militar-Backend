// T11 — limpieza de relevo (2026-10-15): A1 elimina la unidad descartable que quedó como
// residuo de la corrida V1g (marcador T11A3USR..., id 43), por UI y por ficha directa
// (el árbol colapsado no ofreció el enlace). Sin reparar por base; sólo interfaz.
async (page) => {
  const BASE = 'http://127.0.0.1:5175';
  const CRED_PATH = '/run/media/gianluca/Gian SSD 1T/Proyectos Desarrollo/Poligono backend/ControlPoligono-Militar-Backend/.cache/development-role-accounts/credentials.json';
  const ALIAS = 'A1';
  const EXPECTED_ROLE = 'super_admin';
  const UNIT_ID = 43;
  const UNIT_CODE_HINT = 'T11A3USR';

  const readCreds = async () => {
    try { const fs = require('node:fs'); return JSON.parse(fs.readFileSync(CRED_PATH, 'utf8')); }
    catch (e) {
      const tmp = await page.context().browser().newContext();
      const pg = await tmp.newPage();
      await pg.goto('file://' + encodeURI(CRED_PATH), { waitUntil: 'load' });
      const t = await pg.locator('body').innerText(); await tmp.close(); return JSON.parse(t);
    }
  };

  const creds = await readCreds();
  const acct = creds.accounts.find((a) => a.role === EXPECTED_ROLE);
  const TENANT = creds.context.tenant;
  if (!acct) return { crash: 'role-not-provisioned', role: EXPECTED_ROLE };

  const browser = page.context().browser();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 920 } });
  const p = await ctx.newPage();

  const net = [];
  p.on('response', (r) => {
    try {
      const u = new URL(r.url());
      if (!u.pathname.startsWith('/api/')) return;
      net.push({ method: r.request().method(), path: u.pathname.replace(/\/\d+(?=\/|$)/g, '/{id}'), raw: u.pathname, status: r.status() });
    } catch (e) { /* ignore */ }
  });
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e && e.message).slice(0, 160)));

  const clickUnique = async (text) => {
    for (let i = 0; i < 48; i += 1) {
      const b = p.getByRole('button', { name: text, exact: true });
      const n = await b.count();
      for (let j = n - 1; j >= 0; j -= 1) {
        const el = b.nth(j);
        if (await el.isVisible().catch(() => false) && !(await el.isDisabled().catch(() => true))) {
          const ok = await el.click({ timeout: 6000 }).then(() => true).catch(() => false);
          if (ok) return true;
        }
      }
      await p.waitForTimeout(250);
    }
    return false;
  };
  const hardGoto = async (pathOnly) => {
    await p.goto(`${BASE}${pathOnly}${pathOnly.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(TENANT)}`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    let landed = await p.evaluate(() => location.pathname);
    if (landed === '/contexto' && await p.locator('#tenant-code').count()) {
      await p.fill('#tenant-code', TENANT);
      await p.click('.connection-form button[type="submit"]').catch(() => {});
      await p.waitForTimeout(1800);
      landed = await p.evaluate(() => location.pathname);
    }
    return landed;
  };
  const getStatus = (path) => p.evaluate(async ({ path, tenant }) => {
    try { const r = await fetch(path, { credentials: 'include', headers: { 'X-Tenant-Code': tenant } }); return r.status; }
    catch (e) { return 'fetch_error'; }
  }, { path, tenant: TENANT });

  const rec = {
    schema: 'frontend-t11-v1g-residue-cleanup/v1',
    date: '2026-10-15',
    task: 'T11 — limpieza de relevo: A1 elimina la unidad residuo de V1g (id 43, marcador T11A3USR)',
    alias: ALIAS,
    stage: 'boot',
    acreditacion: { alias_claimed: ALIAS, private_role_expected: EXPECTED_ROLE, alias_matched: false, missing_field: null, login: null, context_read: null },
    cleanup: { detail_get: null, delete_opened: null, delete: null, get_after: null },
    residue: { units_with_marker: null },
    page_errors: [],
  };

  try {
    rec.stage = 'login';
    await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#rut', { timeout: 20000 });
    await p.fill('#tenantCode', TENANT); await p.fill('#rut', acct.rut); await p.fill('#password', acct.password);
    await p.click('.auth-button[type="submit"]');
    await p.waitForURL((u) => !String(u).includes('/login'), { timeout: 25000 });
    await p.waitForTimeout(1400);
    await p.waitForSelector('a.menu-link', { timeout: 20000 });
    rec.acreditacion.login = { method: 'POST', path: '/api/auth/login/', status: 200, source: 'UI' };

    rec.stage = 'context';
    const ctxResp = await p.request.get(`${BASE}/api/auth/context/`, { headers: { 'X-Tenant-Code': TENANT } });
    const ctxBody = await ctxResp.json().catch(() => null);
    const assignments = ctxBody && Array.isArray(ctxBody.assignments) ? ctxBody.assignments : [];
    const primary = assignments.find((a) => a.is_primary) || null;
    const primaryRole = primary ? primary.role : null;
    rec.acreditacion.context_read = { method: 'GET', path: '/api/auth/context/', status: ctxResp.status(), active_role: primaryRole };
    rec.acreditacion.alias_matched = ctxResp.status() === 200 && primaryRole === EXPECTED_ROLE;
    if (!rec.acreditacion.alias_matched) {
      rec.acreditacion.missing_field = ctxResp.status() !== 200 ? `status ${ctxResp.status()}` : `primary role '${primaryRole}' != '${EXPECTED_ROLE}'`;
      await ctx.close().catch(() => {});
      return rec;
    }

    rec.stage = 'cleanup_detail';
    let before = net.length;
    await hardGoto(`/organizacion/unidades/${UNIT_ID}`);
    const dGet = net.slice(before).find((x) => x.method === 'GET' && x.raw === `/api/organization-units/${UNIT_ID}/`);
    rec.cleanup.detail_get = dGet ? dGet.status : null;

    rec.stage = 'cleanup_delete';
    rec.cleanup.delete_opened = await clickUnique('Eliminar unidad (DELETE simple)');
    if (rec.cleanup.delete_opened) {
      await p.waitForTimeout(400);
      const pr = p.waitForResponse((r) => r.request().method() === 'DELETE' && new RegExp(`^/api/organization-units/${UNIT_ID}/$`).test(new URL(r.url()).pathname), { timeout: 20000 }).catch(() => null);
      await clickUnique('Eliminar unidad');
      const r = await pr;
      if (r) rec.cleanup.delete = { method: 'DELETE', path: `/api/organization-units/${UNIT_ID}/`, status: r.status() };
      await p.waitForTimeout(1200);
    }
    rec.cleanup.get_after = await getStatus(`/api/organization-units/${UNIT_ID}/`);

    rec.stage = 'residue';
    await p.evaluate(() => { const a = document.querySelector('a.menu-link[href="/organizacion/unidades"]'); if (a) a.click(); });
    await p.waitForTimeout(1300);
    rec.residue.units_with_marker = await p.evaluate((m) => {
      const links = [...document.querySelectorAll('a.organization-view__tree-link')].filter((a) => (a.textContent || '').includes(m)).length;
      const rows = [...document.querySelectorAll('table tbody tr')].filter((tr) => (tr.textContent || '').includes(m)).length;
      return { tree_links: links, table_rows: rows };
    }, UNIT_CODE_HINT).catch(() => null);
  } catch (err) {
    rec.page_errors.push(`harness:${rec.stage}:${String(err && err.message ? err.message : err).slice(0, 220)}`);
  }

  rec.network = { total_api_calls: net.length, mutations: net.filter((n) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(n.method) && !['/api/auth/login/', '/api/auth/logout/'].includes(n.path)) };
  rec.page_errors.push(...errors.map((e) => `page:${e}`));
  await ctx.close().catch(() => {});
  return rec;
}
