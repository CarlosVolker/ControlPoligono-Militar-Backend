// T11 — Certificación de CONTENIDO (2026-10-16) — SOLO LECTURA.
// Condiciones de conjunto visible de las celdas EXPECTED_ALLOW_SCOPED (C-4 §4.3/§4.4):
//  · ramas de unidades de A3 (unidad_y_descendientes) y A7 (unidad_propia): subconjunto del total de A1
//  · lecciones visibles de A6 y A8 (caso tirador puro): subconjunto del total de A1 + filtro activo
//  · participación de A8 (LES-008 como A1, búsqueda en cuerpo in-memory; el RUT no se persiste)
// Sin mutaciones, sin residuo, sin cookies fabricadas. Conteos y booleanos únicamente.
async (page) => {
  const BASE = 'http://127.0.0.1:5175';
  const CRED_PATH = '/run/media/gianluca/Gian SSD 1T/Proyectos Desarrollo/Poligono backend/ControlPoligono-Militar-Backend/.cache/development-role-accounts/credentials.json';

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
  const TENANT = creds.context.tenant;
  const browser = page.context().browser();

  const makeSession = async (roleExpected, alias) => {
    const acct = creds.accounts.find((a) => a.role === roleExpected);
    if (!acct) return { error: 'role-not-provisioned', role: roleExpected };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 920 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(String(e && e.message).slice(0, 160)));
    await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#rut', { timeout: 20000 });
    await p.fill('#tenantCode', TENANT); await p.fill('#rut', acct.rut); await p.fill('#password', acct.password);
    await p.click('.auth-button[type="submit"]');
    await p.waitForURL((u) => !String(u).includes('/login'), { timeout: 25000 });
    await p.waitForTimeout(1400);
    await p.waitForSelector('a.menu-link', { timeout: 20000 });
    const ctxResp = await p.request.get(`${BASE}/api/auth/context/`, { headers: { 'X-Tenant-Code': TENANT } });
    const ctxBody = await ctxResp.json().catch(() => null);
    const assignments = ctxBody && Array.isArray(ctxBody.assignments) ? ctxBody.assignments : [];
    const primary = assignments.find((a) => a.is_primary) || null;
    const primaryRole = primary ? primary.role : null;
    const acc = {
      alias,
      private_role_expected: roleExpected,
      login: { method: 'POST', path: '/api/auth/login/', status: 200, source: 'UI' },
      context_read: { method: 'GET', path: '/api/auth/context/', status: ctxResp.status(), active_role: primaryRole },
      alias_matched: ctxResp.status() === 200 && primaryRole === roleExpected,
      missing_field: null,
    };
    if (!acc.alias_matched) acc.missing_field = ctxResp.status() !== 200 ? `status ${ctxResp.status()}` : `primary role '${primaryRole}' != '${roleExpected}'`;
    return { ctx, p, errors, acc, acct };
  };

  const apiGetJson = async (pg, path) => {
    const r = await pg.request.get(`${BASE}${path}`, { headers: { 'X-Tenant-Code': TENANT } });
    let body = null;
    try { body = await r.json(); } catch (e) { /* sin cuerpo json */ }
    return { status: r.status(), body };
  };
  const listFrom = (body, idKeys) => {
    const arr = Array.isArray(body) ? body : (body && Array.isArray(body.results) ? body.results : null);
    if (!arr) return null;
    return arr.map((it) => {
      for (const k of idKeys) if (it && it[k] !== undefined && it[k] !== null) return String(it[k]);
      return null;
    }).filter((x) => x !== null);
  };
  const subset = (a, b) => !!a && !!b && a.every((x) => b.includes(x));

  const rec = {
    schema: 'frontend-t11-content-cert/v1',
    date: '2026-10-16',
    task: 'T11 — Certificación de contenido: conjuntos visibles SCOPED (ramas A3/A7; lecciones A6/A8) — solo lectura',
    sessions: {},
    units: {},
    lessons: {},
    page_errors: [],
  };

  const sessions = {};
  try {
    for (const [alias, role] of [['A1', 'super_admin'], ['A3', 'admin_unidad'], ['A7', 'encargado_almacen'], ['A6', 'oficial_observador'], ['A8', 'tirador']]) {
      sessions[alias] = await makeSession(role, alias);
      if (!sessions[alias] || !sessions[alias].acc) throw new Error(`sesion_${alias}_no_iniciada`);
      rec.sessions[alias] = sessions[alias].acc;
      if (!sessions[alias].acc.alias_matched) throw new Error(`acreditacion_${alias}_fallida`);
    }

    // ---- Unidades: conjuntos visibles de A1 (total), A3 (rama), A7 (unidad propia) ----
    const u1 = await apiGetJson(sessions.A1.p, '/api/organization-units/');
    const u3 = await apiGetJson(sessions.A3.p, '/api/organization-units/');
    const u7 = await apiGetJson(sessions.A7.p, '/api/organization-units/');
    const c1 = listFrom(u1.body, ['code']);
    const c3 = listFrom(u3.body, ['code']);
    const c7 = listFrom(u7.body, ['code']);
    rec.units = {
      reads: { a1: u1.status, a3: u3.status, a7: u7.status },
      counts: { a1: c1 ? c1.length : null, a3: c3 ? c3.length : null, a7: c7 ? c7.length : null },
      a1_body_shape: u1.body && !Array.isArray(u1.body) ? Object.keys(u1.body).slice(0, 8) : 'array',
      a3_subset_of_a1: subset(c3, c1),
      a3_delta: (c1 && c3) ? c1.length - c3.length : null,
      a7_subset_of_a1: subset(c7, c1),
      a7_delta: (c1 && c7) ? c1.length - c7.length : null,
      method: 'lectura directa con sesión real de cada actor (mismo recurso que consume la UI); códigos no persistidos',
    };
    for (const [alias, key] of [['A3', 'a3'], ['A7', 'a7']]) {
      const s = sessions[alias];
      await s.p.evaluate(() => { const a = document.querySelector('a.menu-link[href="/organizacion/unidades"]'); if (a) a.click(); });
      await s.p.waitForTimeout(1300);
      rec.units[`${key}_ui_shell`] = await s.p.evaluate(() => !!document.querySelector('.organization-view, main.page-content')).catch(() => null);
      rec.units[`${key}_ui_tree_links`] = await s.p.locator('a.organization-view__tree-link').count().catch(() => null);
    }

    // ---- Lecciones: conjuntos visibles de A1 (total), A6 y A8 (caso tirador puro) ----
    const l1 = await apiGetJson(sessions.A1.p, '/api/lecciones/');
    const l6 = await apiGetJson(sessions.A6.p, '/api/lecciones/');
    const l8 = await apiGetJson(sessions.A8.p, '/api/lecciones/');
    const k1 = listFrom(l1.body, ['id_leccion', 'id']);
    const k6 = listFrom(l6.body, ['id_leccion', 'id']);
    const k8 = listFrom(l8.body, ['id_leccion', 'id']);
    rec.lessons = {
      reads: { a1: l1.status, a6: l6.status, a8: l8.status },
      counts: { a1: k1 ? k1.length : null, a6: k6 ? k6.length : null, a8: k8 ? k8.length : null },
      a1_body_shape: l1.body && !Array.isArray(l1.body) ? Object.keys(l1.body).slice(0, 8) : 'array',
      a6_subset_of_a1: subset(k6, k1),
      a6_delta: (k1 && k6) ? k1.length - k6.length : null,
      a8_subset_of_a1: subset(k8, k1),
      a8_delta: (k1 && k8) ? k1.length - k8.length : null,
      method: 'lectura directa con sesión real de cada actor; ids numéricos únicamente',
    };

    // ---- Participación de A8 en sus lecciones visibles (LES-008 como A1; RUT buscado in-memory) ----
    if (k8 && k8.length) {
      const rutA8 = sessions.A8.acct.rut;
      const check = { checked: 0, a8_present: 0, a8_absent_ids: [], fetch_status: [], body_keys_sample: null };
      for (const lid of k8.slice(0, 5)) {
        const resp = await apiGetJson(sessions.A1.p, `/api/lecciones/${lid}/usuarios/`);
        check.checked += 1;
        check.fetch_status.push(resp.status);
        if (!check.body_keys_sample && resp.body && typeof resp.body === 'object' && !Array.isArray(resp.body)) check.body_keys_sample = Object.keys(resp.body).slice(0, 10);
        const present = resp.status === 200 && JSON.stringify(resp.body || '').includes(rutA8);
        if (present) check.a8_present += 1; else check.a8_absent_ids.push(lid);
      }
      rec.lessons.participation = check;
    } else {
      rec.lessons.participation = { checked: 0, note: 'A8 sin lecciones visibles o lista no parseada; nada que comprobar (no se inventa)' };
    }
  } catch (err) {
    rec.page_errors.push(`harness:${String(err && err.message ? err.message : err).slice(0, 220)}`);
  } finally {
    for (const k of Object.keys(sessions)) {
      if (sessions[k] && sessions[k].ctx) await sessions[k].ctx.close().catch(() => {});
    }
  }

  for (const k of Object.keys(sessions)) {
    if (sessions[k] && sessions[k].errors && sessions[k].errors.length) rec.page_errors.push(...sessions[k].errors.map((e) => `${k}:${e}`));
  }
  rec.read_only = true;
  rec.mutations = [];
  return rec;
}
