// T11 — V1c: A1 (super_admin) — puestos POR UI de punta a punta (OP-POS-002/003/004/005/006/009):
// alta con rol no privilegiado, detalle, histórico, edición PUT y PATCH separadas, baja
// SIN holder (se evita a propósito la trampa §11 de puestos indelebles) y barrido de residuo.
// Basado en a2-core-families-ui.run.cjs (sección PUESTOS) + acreditación de a1-borders. Cero RBAC.
async (page) => {
  const BASE = 'http://127.0.0.1:5175';
  const CRED_PATH = '/run/media/gianluca/Gian SSD 1T/Proyectos Desarrollo/Poligono backend/ControlPoligono-Militar-Backend/.cache/development-role-accounts/credentials.json';
  const ALIAS = 'A1';
  const EXPECTED_ROLE = 'super_admin';

  const MARKER = `T11A1POS${Date.now().toString(36).toUpperCase()}`;
  const POS_CODE = `${MARKER}P`;
  const POS_NAME = `${MARKER} puesto descartable`;

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
      net.push({ seq: net.length, method: r.request().method(), path: u.pathname.replace(/\/\d+(?=\/|$)/g, '/{id}'), raw: u.pathname, status: r.status() });
    } catch (e) { /* ignore */ }
  });
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e && e.message).slice(0, 160)));

  const nav = (sel) => p.evaluate((s) => { const a = document.querySelector(s); if (a) a.click(); return !!a; }, sel);
  const getStatus = (path) => p.evaluate(async ({ path, tenant }) => {
    try { const r = await fetch(path, { credentials: 'include', headers: { 'X-Tenant-Code': tenant } }); return r.status; }
    catch (e) { return 'fetch_error'; }
  }, { path, tenant: TENANT });
  const apiGet = (path) => p.request.get(`${BASE}${path}`, { headers: { 'X-Tenant-Code': TENANT } });

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
  const clickSubmit = async (text) => {
    for (let i = 0; i < 48; i += 1) {
      const b = p.locator('button[type="submit"]', { hasText: text });
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
  const waitOption = async (selector, ms = 12000) => {
    for (let i = 0; i < Math.ceil(ms / 200); i += 1) {
      const ok = await p.evaluate((sel) => {
        const s = document.querySelector(sel);
        return !!s && [...s.options].some((o) => !o.disabled && o.value !== '');
      }, selector).catch(() => false);
      if (ok) return true;
      await p.waitForTimeout(200);
    }
    return false;
  };
  const setMethod = (selector, want) => p.evaluate(({ selector, want }) => {
    const s = document.querySelector(selector);
    if (!s) return false;
    const opt = [...s.options].find((o) => String(o.value).toLowerCase() === want);
    if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); return opt.value; }
    return false;
  }, { selector, want });
  const waitModalClosed = async () => {
    await p.waitForFunction(() => !document.querySelector('.ds-modal, [role="dialog"], .modal-backdrop'), null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(400);
  };
  const ensureModalGone = async () => {
    await waitModalClosed();
    const still = await p.evaluate(() => !!document.querySelector('.ds-modal, [role="dialog"]')).catch(() => false);
    if (still) { await clickUnique('Cancelar').catch(() => {}); await waitModalClosed(); }
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

  const rec = {
    schema: 'frontend-t11-v1c-positions-a1/v1',
    date: '2026-10-15',
    task: 'T11 V1c — puestos por UI de punta a punta (alias A1 acreditado; sin holder a propósito)',
    alias: ALIAS,
    stage: 'boot',
    acreditacion: { alias_claimed: ALIAS, private_role_expected: EXPECTED_ROLE, alias_matched: false, missing_field: null, login: null, context_read: null },
    position: { marker: MARKER, code: POS_CODE, id: null, create: null, create_fields: null, role_selected: null, unit_selected: null, detail_get: null, history_get: null, history_tab: null, holders_tab: null, edit_put: null, edit_patch: null, delete: null },
    verify: { position_get_after_delete: null },
    residue: { positions_rows_with_marker: null },
    gate: { actor_role: EXPECTED_ROLE, holder_assigned_on_purpose: false, credentials_printed_or_persisted: false },
    cleanup_errors: [],
  };

  const deletePosition = async () => {
    if (!rec.position.id || rec.position.delete) return;
    await hardGoto(`/organizacion/puestos/${rec.position.id}`);
    const openDel = await clickUnique('Dar de baja');
    if (!openDel) { rec.cleanup_errors.push('position_delete:button_absent'); return; }
    await p.waitForTimeout(400);
    const pr = p.waitForResponse((r) => r.request().method() === 'DELETE' && new RegExp(`^/api/posiciones/${rec.position.id}/$`).test(new URL(r.url()).pathname), { timeout: 15000 }).catch(() => null);
    await clickUnique('Confirmar baja');
    const r = await pr;
    if (r) rec.position.delete = { method: 'DELETE', path: `/api/posiciones/${rec.position.id}/`, status: r.status() };
    await p.waitForTimeout(1000);
  };

  const cleanup = async (reason) => {
    rec.stage = `cleanup:${reason}`;
    const step = async (name, fn) => { try { await fn(); } catch (e) { rec.cleanup_errors.push(`${name}:${String(e && e.message ? e.message : e).slice(0, 140)}`); } };
    await step('position_delete', deletePosition);
    await step('verify', async () => {
      if (rec.position.id) rec.verify.position_get_after_delete = await getStatus(`/api/posiciones/${rec.position.id}/`);
    });
  };

  const residueCheck = async () => {
    rec.stage = 'residue';
    try {
      await nav('a.menu-link[href="/organizacion/puestos"]');
      await p.waitForTimeout(1000);
      const cargar = p.getByRole('button', { name: 'Cargar / reconciliar lectura' });
      if (await cargar.count()) { await cargar.first().click(); await p.waitForTimeout(1300); }
      rec.residue.positions_rows_with_marker = await p.locator('table tbody tr', { hasText: POS_CODE }).count();
    } catch (e) {
      rec.cleanup_errors.push(`residue:${String(e && e.message ? e.message : e).slice(0, 140)}`);
    }
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

    // ---------- ACREDITACIÓN ALIAS A1 -> CONTEXTO (gate: antes de mutar) ----------
    rec.stage = 'context';
    const ctxResp = await apiGet('/api/auth/context/');
    const ctxBody = await ctxResp.json().catch(() => null);
    const assignments = ctxBody && Array.isArray(ctxBody.assignments) ? ctxBody.assignments : [];
    const primary = assignments.find((a) => a.is_primary) || null;
    const primaryRole = primary ? primary.role : null;
    rec.acreditacion.context_read = {
      method: 'GET', path: '/api/auth/context/', status: ctxResp.status(), active_role: primaryRole,
      permissions_count: Array.isArray(ctxBody?.permissions) ? ctxBody.permissions.length : null,
    };
    rec.acreditacion.alias_matched = ctxResp.status() === 200 && primaryRole === EXPECTED_ROLE;
    if (!rec.acreditacion.alias_matched) {
      rec.acreditacion.missing_field = ctxResp.status() !== 200 ? `status ${ctxResp.status()}` : `primary role '${primaryRole}' != '${EXPECTED_ROLE}'`;
      rec.gate.blocked = 'accreditation_failed_before_mutations';
      await ctx.close().catch(() => {});
      return rec;
    }

    // 1) alta de puesto (sin holder)
    rec.stage = 'position_create';
    await nav('a.menu-link[href="/organizacion/puestos"]');
    await p.waitForURL((u) => u.pathname === '/organizacion/puestos', { timeout: 12000 }).catch(() => {});
    await p.waitForTimeout(1100);
    const created = await clickUnique('Crear puesto');
    if (!created) throw new Error('boton_crear_puesto_ausente');
    await p.waitForSelector('#identity-position-code', { timeout: 12000 });
    await p.fill('#identity-position-code', POS_CODE);
    await p.fill('#identity-position-name', POS_NAME);
    await waitOption('#identity-position-organization-unit-code-write', 10000);
    rec.position.unit_selected = await p.evaluate(() => {
      const s = document.querySelector('#identity-position-organization-unit-code-write');
      if (!s) return false;
      const o = [...s.options].find((x) => x.value !== '');
      if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); return true; }
      return false;
    });
    await waitOption('#identity-position-role-code-write', 10000);
    rec.position.role_selected = await p.evaluate(() => {
      const s = document.querySelector('#identity-position-role-code-write');
      if (!s) return null;
      const opts = [...s.options].filter((o) => o.value !== '');
      const safe = opts.find((o) => !/super_admin|tenant_admin/i.test(o.value));
      if (safe) { s.value = safe.value; s.dispatchEvent(new Event('change', { bubbles: true })); return safe.value; }
      return null;
    });
    if (!rec.position.role_selected) throw new Error('sin_rol_no_privilegiado_en_selector');
    const prCreate = p.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/posiciones/', { timeout: 20000 });
    await clickSubmit('Crear puesto');
    const rCreate = await prCreate;
    const bCreate = await rCreate.json().catch(() => null);
    rec.position.create = { method: 'POST', path: '/api/posiciones/', status: rCreate.status() };
    rec.position.id = bCreate ? (bCreate.id ?? null) : null;
    rec.position.create_fields = bCreate ? Object.keys(bCreate).sort() : null;
    await ensureModalGone();
    if (!rec.position.id) throw new Error('no_position_id_in_create_response');

    // 2) detalle + histórico por ficha
    rec.stage = 'position_detail';
    let before = net.length;
    await hardGoto(`/organizacion/puestos/${rec.position.id}`);
    const dGet = net.slice(before).find((x) => x.method === 'GET' && x.raw === `/api/posiciones/${rec.position.id}/`);
    rec.position.detail_get = dGet ? dGet.status : null;
    const hGet = net.slice(before).find((x) => x.method === 'GET' && x.raw === `/api/posiciones/${rec.position.id}/historico/`);
    rec.position.history_get = hGet ? hGet.status : null;
    if (await p.locator('#position-tab-history').count()) {
      before = net.length;
      await p.locator('#position-tab-history').first().click().catch(() => {});
      await p.waitForTimeout(700);
      const hGet2 = net.slice(before).find((x) => x.method === 'GET' && x.raw === `/api/posiciones/${rec.position.id}/historico/`);
      rec.position.history_tab = hGet2 ? hGet2.status : (rec.position.history_get !== null ? 'sin_request_nuevo' : null);
    }
    if (await p.locator('#position-tab-holders').count()) {
      await p.locator('#position-tab-holders').first().click().catch(() => {});
      await p.waitForTimeout(500);
      rec.position.holders_tab = true;
    }

    // 3) edición PUT y PATCH por separado
    const editPosition = async (method) => {
      await hardGoto(`/organizacion/puestos/${rec.position.id}`);
      const opened = await clickUnique('Editar');
      if (!opened) return { opened: false, status: null };
      const ready = await p.waitForSelector('#identity-position-name', { timeout: 12000 }).then(() => true).catch(() => false);
      if (!ready) return { opened: true, status: 'name_field_missing' };
      await p.fill('#identity-position-name', `${POS_NAME} ${method}`);
      const methodSet = await setMethod('#identity-position-method', method);
      const pr = p.waitForResponse((r) => r.request().method() === method.toUpperCase() && new RegExp(`^/api/posiciones/${rec.position.id}/$`).test(new URL(r.url()).pathname), { timeout: 20000 }).catch(() => null);
      await clickSubmit('Guardar puesto');
      const r = await pr;
      await ensureModalGone();
      return { opened: true, method_set: methodSet, status: r ? r.status() : null };
    };
    rec.stage = 'position_edit_put';
    rec.position.edit_put = await editPosition('put');
    await p.waitForTimeout(600);
    rec.stage = 'position_edit_patch';
    rec.position.edit_patch = await editPosition('patch');
    await p.waitForTimeout(600);

    // 4) baja (sin holder: debe poder borrarse)
    rec.stage = 'position_delete';
    await hardGoto(`/organizacion/puestos/${rec.position.id}`);
    const openDel = await clickUnique('Dar de baja');
    if (!openDel) throw new Error('boton_dar_de_baja_ausente');
    await p.waitForTimeout(400);
    const prDel = p.waitForResponse((r) => r.request().method() === 'DELETE' && new RegExp(`^/api/posiciones/${rec.position.id}/$`).test(new URL(r.url()).pathname), { timeout: 20000 }).catch(() => null);
    await clickUnique('Confirmar baja');
    const rDel = await prDel;
    if (rDel) rec.position.delete = { method: 'DELETE', path: `/api/posiciones/${rec.position.id}/`, status: rDel.status() };
    await p.waitForTimeout(1200);

    // 5) verificación
    rec.stage = 'verify';
    rec.verify.position_get_after_delete = await getStatus(`/api/posiciones/${rec.position.id}/`);
  } catch (err) {
    errors.push(`harness:${rec.stage}:${String(err && err.message ? err.message : err).slice(0, 220)}`);
    await cleanup('on_error');
  }

  await residueCheck();

  rec.network = {
    total_api_calls: net.length,
    mutations: net.filter((n) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(n.method) && !['/api/auth/login/', '/api/auth/logout/'].includes(n.path)),
  };
  rec.page_errors = errors;
  await ctx.close().catch(() => {});
  return rec;
}
