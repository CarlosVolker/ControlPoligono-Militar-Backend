// T11 — V1e: ejercicios con relevo de actores — A7 (encargado_almacen) crea y edita por UI
// (PUT y PATCH separados) con marcador propio; A1 (super_admin) releva para el borrado (A7 no
// ofrece baja: asimetría §12) y aprovecha para la lectura de detalle de recinto (RCT-003 de A1).
// Limpieza trazable, sin RBAC, sin forzar la API. Derivado del patrón v1a/v1c.
async (page) => {
  const BASE = 'http://127.0.0.1:5175';
  const CRED_PATH = '/run/media/gianluca/Gian SSD 1T/Proyectos Desarrollo/Poligono backend/ControlPoligono-Militar-Backend/.cache/development-role-accounts/credentials.json';

  const MARKER = `T11A7EJR${Date.now().toString(36).toUpperCase()}`;
  const EXERCISE_NAME = `${MARKER} ejercicio`;

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

  const clickUnique = async (pg, text) => {
    for (let i = 0; i < 48; i += 1) {
      const b = pg.getByRole('button', { name: text, exact: true });
      const n = await b.count();
      for (let j = n - 1; j >= 0; j -= 1) {
        const el = b.nth(j);
        if (await el.isVisible().catch(() => false) && !(await el.isDisabled().catch(() => true))) {
          const ok = await el.click({ timeout: 6000 }).then(() => true).catch(() => false);
          if (ok) return true;
        }
      }
      await pg.waitForTimeout(250);
    }
    return false;
  };
  const waitModalClosed = async (pg) => {
    await pg.waitForFunction(() => !document.querySelector('.ds-modal, [role="dialog"], .modal-backdrop'), null, { timeout: 8000 }).catch(() => {});
    await pg.waitForTimeout(400);
  };
  const ensureModalGone = async (pg) => {
    await waitModalClosed(pg);
    const still = await pg.evaluate(() => !!document.querySelector('.ds-modal, [role="dialog"]')).catch(() => false);
    if (still) { await clickUnique(pg, 'Cancelar').catch(() => {}); await waitModalClosed(pg); }
  };
  const hardGoto = async (pg, pathOnly) => {
    await pg.goto(`${BASE}${pathOnly}${pathOnly.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(TENANT)}`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(1500);
    let landed = await pg.evaluate(() => location.pathname);
    if (landed === '/contexto' && await pg.locator('#tenant-code').count()) {
      await pg.fill('#tenant-code', TENANT);
      await pg.click('.connection-form button[type="submit"]').catch(() => {});
      await pg.waitForTimeout(1800);
      landed = await pg.evaluate(() => location.pathname);
    }
    return landed;
  };
  const getStatus = (pg, path) => pg.evaluate(async ({ path, tenant }) => {
    try { const r = await fetch(path, { credentials: 'include', headers: { 'X-Tenant-Code': tenant } }); return r.status; }
    catch (e) { return 'fetch_error'; }
  }, { path, tenant: TENANT });

  const makeSession = async (roleExpected, alias) => {
    const acct = creds.accounts.find((a) => a.role === roleExpected);
    if (!acct) return { error: 'role-not-provisioned', role: roleExpected };
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
    return { ctx, p, net, errors, acc };
  };

  const rec = {
    schema: 'frontend-t11-v1e-exercises-relay/v1',
    date: '2026-10-15',
    task: 'T11 V1e — ejercicios: alta y edición por A7 (PUT/PATCH separados), baja por relevo A1, y lectura de recinto RCT-003 de A1',
    stage: 'boot',
    acreditacion_a7: null,
    acreditacion_a1: null,
    exercise: { marker: MARKER, id: null, create: null, create_fields: null, detail_get: null, edit_put: null, edit_patch: null, a7_delete_affordance: null, delete_a1: null, get_after: null },
    rct003_a1: { row_opened: null, detail_status: null },
    residue: { exercises_rows_with_marker: null },
    gate: { a7_role: 'encargado_almacen', a1_relay_for_delete: true, used_super_admin_bypass_from_a7: false, credentials_printed_or_persisted: false },
    cleanup_errors: [],
    page_errors: [],
    mutations: [],
  };

  let s7 = null;
  let s1 = null;

  const deleteExerciseAsA1 = async (id) => {
    if (!id) return null;
    if (!(s1 && s1.p)) s1 = await makeSession('super_admin', 'A1');
    if (!s1 || !s1.p || (s1.acc && s1.acc.alias_matched !== true)) return { status: 'a1_session_unavailable' };
    const pg = s1.p;
    await hardGoto(pg, `/tiro/ejercicios/${id}`);
    const openDel = await clickUnique(pg, 'Eliminar');
    if (!openDel) return { status: 'delete_button_absent' };
    await pg.waitForTimeout(400);
    const pr = pg.waitForResponse((r) => r.request().method() === 'DELETE' && new RegExp(`^/api/ejercicios/${id}/$`).test(new URL(r.url()).pathname), { timeout: 20000 }).catch(() => null);
    await clickUnique(pg, 'Confirmar baja');
    const r = await pr;
    await pg.waitForTimeout(1000);
    return r ? { method: 'DELETE', path: `/api/ejercicios/${id}/`, status: r.status() } : { method: 'DELETE', status: 'no_response' };
  };

  try {
    // ---- Sesión A7 ----
    rec.stage = 'a7_session';
    s7 = await makeSession('encargado_almacen', 'A7');
    if (s7.error || !s7.acc.alias_matched) throw new Error('a7_accreditation_failed');
    rec.acreditacion_a7 = s7.acc;
    const p7 = s7.p;

    rec.stage = 'exercise_create';
    await p7.evaluate(() => { const a = document.querySelector('a.menu-link[href="/tiro/ejercicios"]'); if (a) a.click(); });
    await p7.waitForTimeout(1300);
    const created = await clickUnique(p7, 'Crear ejercicio');
    if (!created) throw new Error('boton_crear_ejercicio_ausente');
    await p7.waitForSelector('#exercise-name', { timeout: 12000 });
    await p7.fill('#exercise-name', EXERCISE_NAME);
    await p7.fill('#exercise-date', '2026-10-15');
    const prCr = p7.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/ejercicios/', { timeout: 20000 });
    await clickUnique(p7, 'Crear');
    const rCr = await prCr;
    const bCr = await rCr.json().catch(() => null);
    rec.exercise.create = { method: 'POST', path: '/api/ejercicios/', status: rCr.status() };
    rec.exercise.id = bCr ? (bCr.id_ejercicio ?? bCr.id ?? null) : null;
    rec.exercise.create_fields = bCr ? Object.keys(bCr).sort() : null;
    await ensureModalGone(p7);
    if (!rec.exercise.id) throw new Error('no_exercise_id_in_create');

    rec.stage = 'exercise_detail';
    let before = s7.net.length;
    await hardGoto(p7, `/tiro/ejercicios/${rec.exercise.id}`);
    const dGet = s7.net.slice(before).find((x) => x.method === 'GET' && x.raw === `/api/ejercicios/${rec.exercise.id}/`);
    rec.exercise.detail_get = dGet ? dGet.status : null;
    rec.exercise.a7_delete_affordance = await p7.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Eliminar');
      const hint = document.querySelector('#exercises-detail-delete-hint');
      return { present: !!b, disabled: b ? b.disabled === true : null, hint: hint ? (hint.textContent || '').trim().slice(0, 120) : null };
    }).catch(() => null);

    const edit7 = async (kind) => {
      await hardGoto(p7, `/tiro/ejercicios/${rec.exercise.id}`);
      const opened = await clickUnique(p7, 'Editar');
      if (!opened) return { opened: false, status: null };
      await p7.waitForSelector('#exercise-name', { timeout: 12000 });
      await p7.fill('#exercise-name', `${EXERCISE_NAME} ${kind}`);
      const pr = p7.waitForResponse((r) => r.request().method() === (kind === 'put' ? 'PUT' : 'PATCH') && new RegExp(`^/api/ejercicios/${rec.exercise.id}/$`).test(new URL(r.url()).pathname), { timeout: 20000 }).catch(() => null);
      await clickUnique(p7, kind === 'put' ? 'Guardar completo · PUT' : 'Guardar cambios · PATCH');
      const r = await pr;
      await ensureModalGone(p7);
      return { opened: true, status: r ? r.status() : null };
    };
    rec.stage = 'exercise_edit_put';
    rec.exercise.edit_put = await edit7('put');
    await p7.waitForTimeout(600);
    rec.stage = 'exercise_edit_patch';
    rec.exercise.edit_patch = await edit7('patch');
    await p7.waitForTimeout(600);

    // ---- Sesión A1: relevo para la baja + RCT-003 ----
    rec.stage = 'a1_session';
    if (!(s1 && s1.p)) s1 = await makeSession('super_admin', 'A1');
    if (!s1 || !s1.p || !s1.acc.alias_matched) throw new Error('a1_accreditation_failed');
    rec.acreditacion_a1 = s1.acc;
    const p1 = s1.p;

    rec.stage = 'exercise_delete_a1';
    rec.exercise.delete_a1 = await deleteExerciseAsA1(rec.exercise.id);
    rec.exercise.get_after = await getStatus(p1, `/api/ejercicios/${rec.exercise.id}/`);

    rec.stage = 'rct003_a1';
    await p1.evaluate(() => { const a = document.querySelector('a.menu-link[href="/organizacion/recintos"]'); if (a) a.click(); });
    await p1.waitForTimeout(1300);
    before = s1.net.length;
    rec.rct003_a1.row_opened = await p1.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/organizacion/recintos/"]')].find((x) => /\/organizacion\/recintos\/\d+$/.test(x.getAttribute('href') || ''));
      if (a) { a.click(); return true; }
      return false;
    });
    await p1.waitForTimeout(1600);
    const rGet = s1.net.slice(before).find((x) => x.method === 'GET' && /^\/api\/recintos\/\d+\/$/.test(x.raw));
    rec.rct003_a1.detail_status = rec.rct003_a1.row_opened ? (rGet ? rGet.status : null) : 'sin_fila_disponible';

    rec.stage = 'residue';
    await p1.evaluate(() => { const a = document.querySelector('a.menu-link[href="/tiro/ejercicios"]'); if (a) a.click(); });
    await p1.waitForTimeout(1300);
    rec.residue.exercises_rows_with_marker = await p1.locator('table tbody tr', { hasText: EXERCISE_NAME }).count().catch(() => null);
  } catch (err) {
    rec.page_errors.push(`harness:${rec.stage}:${String(err && err.message ? err.message : err).slice(0, 220)}`);
    try {
      if (rec.exercise && rec.exercise.id && !(rec.exercise.delete_a1 && typeof rec.exercise.delete_a1.status === 'number' && rec.exercise.delete_a1.status < 300)) {
        rec.exercise.delete_a1 = await deleteExerciseAsA1(rec.exercise.id);
      }
    } catch (e) {
      rec.cleanup_errors.push(`relay_delete:${String(e && e.message ? e.message : e).slice(0, 140)}`);
    }
  } finally {
    if (s7 && s7.ctx) await s7.ctx.close().catch(() => {});
    if (s1 && s1.ctx) await s1.ctx.close().catch(() => {});
  }

  const allNets = [s7 && s7.p ? s7.net.map((x) => ({ actor: 'A7', ...x })) : [], s1 && s1.p ? s1.net.map((x) => ({ actor: 'A1', ...x })) : []].flat();
  rec.mutations = allNets
    .filter((n) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(n.method) && !['/api/auth/login/', '/api/auth/logout/'].includes(n.path))
    .map((n) => ({ actor: n.actor, method: n.method, path: n.path, status: n.status }));
  if (s7 && s7.errors) rec.page_errors.push(...s7.errors.map((e) => `A7:${e}`));
  if (s1 && s1.errors) rec.page_errors.push(...s1.errors.map((e) => `A1:${e}`));
  return rec;
}
