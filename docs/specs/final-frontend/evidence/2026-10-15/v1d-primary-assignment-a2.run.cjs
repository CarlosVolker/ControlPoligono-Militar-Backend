// T11 — V1d: A2 (tenant_admin) — variante de la asignación principal POR UI (OP-USR-007/008):
// alta formal de persona descartable, edición de la principal en PUT y en PATCH (botón «PUT / PATCH»
// del panel de asignaciones), confirmación por lectura, limpieza trazable y barrido de residuo.
// Derivado de v1a. Cero escrituras RBAC.
async (page) => {
  const BASE = 'http://127.0.0.1:5175';
  const CRED_PATH = '/run/media/gianluca/Gian SSD 1T/Proyectos Desarrollo/Poligono backend/ControlPoligono-Militar-Backend/.cache/development-role-accounts/credentials.json';
  const ALIAS = 'A2';
  const EXPECTED_ROLE = 'tenant_admin';

  const MARKER = `T11A2PRA${Date.now().toString(36).toUpperCase()}`;
  const UNIT_CODE = `${MARKER}U`;
  const UNIT_NAME = `${MARKER} unidad descartable`;
  const USER_RUT = `${MARKER}R`;
  const PRIMARY_ROLE = 'oficial_observador';
  const SECONDARY_ROLE = 'oficial_tiro';

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

  const nav = (sel) => p.evaluate((s) => { const a = document.querySelector(s); if (a) a.click(); return !!a; }, sel);
  const navLink = (href) => p.evaluate((h) => { const a = document.querySelector(`a[href="${h}"]`); if (a) a.click(); return !!a; }, href);
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
  const setMethod = (selector, want) => p.evaluate(({ selector, want }) => {
    const s = document.querySelector(selector);
    if (!s) return false;
    const opt = [...s.options].find((o) => String(o.value).toLowerCase() === want);
    if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); return opt.value; }
    return false;
  }, { selector, want });
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
  const waitModalClosed = async () => {
    await p.waitForFunction(() => !document.querySelector('.ds-modal, [role="dialog"], .modal-backdrop'), null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(400);
  };
  const ensureModalGone = async () => {
    await waitModalClosed();
    const still = await p.evaluate(() => !!document.querySelector('.ds-modal, [role="dialog"]')).catch(() => false);
    if (still) { await clickUnique('Cancelar').catch(() => {}); await waitModalClosed(); }
  };

  const rec = {
    schema: 'frontend-t11-v1d-primary-assignment/v1',
    date: '2026-10-15',
    task: 'T11 V1d — asignación principal por UI: PUT y PATCH separados (alias A2 acreditado)',
    alias: ALIAS,
    stage: 'boot',
    acreditacion: { alias_claimed: ALIAS, private_role_expected: EXPECTED_ROLE, alias_matched: false, missing_field: null, login: null, context_read: null },
    unit: { marker: MARKER, code: UNIT_CODE, id: null, create: null, create_response_field_names: null, in_assignable_units: null },
    user: { marker: MARKER, id: null, create: null, field_names: null, booleans: null, primary_returned: null, assignments_returned_count: null },
    membership: { applicable: null, note: null },
    primary_edit: { affordance_button: 'PUT / PATCH', put: null, patch: null },
    api_confirm: { get_status: null, primary_role_after: null },
    user_delete: null,
    positions_cleanup: [],
    unit_delete: null,
    verify: { user_get_before_delete: null, user_get_after_delete: null, unit_get_after_delete: null },
    residue: { users_rows_with_marker: null, positions_rows_with_marker: null },
    gate: { actor_role: EXPECTED_ROLE, used_super_admin_bypass: false, created_role: PRIMARY_ROLE, created_role_privileged: false, secondary_role: SECONDARY_ROLE, unit_is_own_disposable: true, credentials_printed_or_persisted: false, created_account_login_attempted: false },
    cleanup_errors: [],
  };

  const cleanup = async (reason) => {
    rec.stage = `cleanup:${reason}`;
    const step = async (name, fn) => { try { await fn(); } catch (e) { rec.cleanup_errors.push(`${name}:${String(e && e.message ? e.message : e).slice(0, 140)}`); } };

    // 1) delete user via UI
    await step('user_delete', async () => {
      if (!rec.user.id || rec.user_delete) return;
      await nav('a.menu-link[href="/personas"]');
      await p.waitForTimeout(900);
      const search = p.locator('input[aria-label="Buscar usuarios"]');
      if (await search.count()) { await search.fill(USER_RUT); await p.waitForTimeout(800); }
      await navLink(`/personas/${rec.user.id}`);
      await p.waitForTimeout(1100);
      const baja = p.getByRole('button', { name: 'Dar de baja', exact: true });
      if (!(await baja.count())) return;
      await baja.first().click();
      const pr = p.waitForResponse((r) => r.request().method() === 'DELETE' && /\/api\/usuarios\/\d+\/$/.test(new URL(r.url()).pathname), { timeout: 15000 });
      await p.getByRole('button', { name: 'Confirmar baja', exact: true }).first().click();
      const r = await pr.catch(() => null);
      if (r) rec.user_delete = { method: 'DELETE', path: `/api/usuarios/${rec.user.id}/`, raw: new URL(r.url()).pathname, status: r.status() };
      await p.waitForTimeout(1200);
    });

    // 2) delete positions created for my unit
    await step('positions', async () => {
      if (!rec.unit.code) return;
      await nav('a.menu-link[href="/organizacion/puestos"]');
      await p.waitForTimeout(1000);
      const cargar = p.getByRole('button', { name: 'Cargar / reconciliar lectura' });
      if (await cargar.count()) { await cargar.first().click(); await p.waitForTimeout(1300); }
      for (let i = 0; i < 8; i += 1) {
        const row = p.locator('table tbody tr', { hasText: rec.unit.code }).first();
        if (!(await row.count())) break;
        const btn = row.getByRole('button', { name: 'Baja', exact: true });
        if (!(await btn.count())) break;
        await btn.click();
        const pr = p.waitForResponse((r) => r.request().method() === 'DELETE' && new URL(r.url()).pathname.startsWith('/api/posiciones/'), { timeout: 15000 });
        await p.getByRole('button', { name: 'Confirmar baja', exact: true }).first().click();
        const r = await pr.catch(() => null);
        rec.positions_cleanup.push(r ? { method: 'DELETE', raw: new URL(r.url()).pathname, status: r.status() } : { method: 'DELETE', status: 'no-response' });
        await p.waitForTimeout(800);
      }
    });

    // 3) delete my unit
    await step('unit_delete', async () => {
      if (!rec.unit.id || rec.unit_delete) return;
      await nav('a.menu-link[href="/organizacion/unidades"]');
      await p.waitForTimeout(1000);
      const refresh = p.getByRole('button', { name: 'Actualizar', exact: true });
      if (await refresh.count()) { await refresh.first().click(); await p.waitForTimeout(1500); }
      const tlink = p.locator('a.organization-view__tree-link', { hasText: rec.unit.code }).first();
      if (!(await tlink.count())) { rec.cleanup_errors.push('unit_delete:tree_link_not_found'); return; }
      await tlink.click();
      await p.waitForTimeout(1100);
      const del = p.getByRole('button', { name: 'Eliminar unidad (DELETE simple)', exact: true });
      if (!(await del.count())) { rec.cleanup_errors.push('unit_delete:delete_button_not_found'); return; }
      await del.first().click();
      const pr = p.waitForResponse((r) => r.request().method() === 'DELETE' && /\/api\/organization-units\/\d+\/$/.test(new URL(r.url()).pathname), { timeout: 15000 });
      await p.getByRole('button', { name: 'Eliminar unidad', exact: true }).first().click();
      const r = await pr.catch(() => null);
      if (r) rec.unit_delete = { method: 'DELETE', path: `/api/organization-units/${rec.unit.id}/`, raw: new URL(r.url()).pathname, status: r.status() };
      await p.waitForTimeout(1200);
    });

    // 4) verify
    await step('verify', async () => {
      if (rec.user.id) rec.verify.user_get_after_delete = await getStatus(`/api/usuarios/${rec.user.id}/`);
      if (rec.unit.id) rec.verify.unit_get_after_delete = await getStatus(`/api/organization-units/${rec.unit.id}/`);
    });
  };

  const residueCheck = async () => {
    rec.stage = 'residue';
    try {
      await nav('a.menu-link[href="/personas"]');
      await p.waitForTimeout(900);
      const s2 = p.locator('input[aria-label="Buscar usuarios"]');
      if (await s2.count()) { await s2.fill(USER_RUT); await p.waitForTimeout(900); }
      rec.residue.users_rows_with_marker = await p.locator('table tbody tr', { hasText: USER_RUT }).count();
      await nav('a.menu-link[href="/organizacion/puestos"]');
      await p.waitForTimeout(1000);
      const cargar2 = p.getByRole('button', { name: 'Cargar / reconciliar lectura' });
      if (await cargar2.count()) { await cargar2.first().click(); await p.waitForTimeout(1300); }
      rec.residue.positions_rows_with_marker = await p.locator('table tbody tr', { hasText: UNIT_CODE }).count();
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

    // ---------- ACREDITACIÓN ALIAS A2 -> CONTEXTO (gate: antes de mutar) ----------
    rec.stage = 'context';
    const ctxResp = await apiGet('/api/auth/context/');
    const ctxBody = await ctxResp.json().catch(() => null);
    const assignments = ctxBody && Array.isArray(ctxBody.assignments) ? ctxBody.assignments : [];
    const primary = assignments.find((a) => a.is_primary) || null;
    const primaryRole = primary ? primary.role : null;
    rec.acreditacion.context_read = {
      method: 'GET',
      path: '/api/auth/context/',
      status: ctxResp.status(),
      active_role: primaryRole,
      assignments_roles: assignments.map((a) => ({ role: a.role, is_primary: !!a.is_primary })),
      permissions_count: Array.isArray(ctxBody?.permissions) ? ctxBody.permissions.length : null,
    };
    rec.acreditacion.alias_matched = ctxResp.status() === 200 && primaryRole === EXPECTED_ROLE;
    if (!rec.acreditacion.alias_matched) {
      rec.acreditacion.missing_field = ctxResp.status() !== 200
        ? `GET /api/auth/context/ status ${ctxResp.status()}`
        : `primary active role '${primaryRole}' != expected '${EXPECTED_ROLE}'`;
      rec.gate.blocked = 'accreditation_failed_before_mutations';
      await ctx.close().catch(() => {});
      return rec;
    }

    // 1) own disposable unit
    rec.stage = 'unit_create';
    await nav('a.menu-link[href="/organizacion/unidades"]');
    await p.waitForURL((u) => u.pathname === '/organizacion/unidades', { timeout: 12000 }).catch(() => {});
    await p.waitForTimeout(1100);
    await p.getByRole('button', { name: 'Crear unidad', exact: true }).click();
    await p.waitForSelector('#organization-unit-code', { timeout: 12000 });
    await p.fill('#organization-unit-code', UNIT_CODE);
    await p.fill('#organization-unit-name', UNIT_NAME);
    const prUnit = p.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/api/organization-units/'), { timeout: 20000 });
    await p.locator('button[type="submit"][form="organization-unit-form"]').click();
    const rUnit = await prUnit;
    const bUnit = await rUnit.json().catch(() => null);
    rec.unit.create = { method: 'POST', path: '/api/organization-units/', raw: '/api/organization-units/', status: rUnit.status() };
    rec.unit.id = bUnit ? (bUnit.id ?? null) : null;
    rec.unit.create_response_field_names = bUnit ? Object.keys(bUnit).sort() : null;
    await p.waitForTimeout(1200);

    // 2) formal account creation
    rec.stage = 'user_create';
    await nav('a.menu-link[href="/personas"]');
    await p.waitForURL((u) => u.pathname === '/personas', { timeout: 12000 }).catch(() => {});
    await p.waitForTimeout(1000);
    const cargar = p.getByRole('button', { name: 'Cargar / reconciliar lectura' });
    if (await cargar.count()) { await cargar.first().click(); await p.waitForTimeout(1400); }
    await p.getByRole('button', { name: 'Alta formal', exact: true }).click();
    await p.waitForSelector('#identity-user-unit-code', { timeout: 15000 });
    await p.waitForFunction((code) => {
      const el = document.querySelector('#identity-user-unit-code');
      return el && !el.disabled && [...el.options].some((o) => o.value === code);
    }, UNIT_CODE, { timeout: 15000 }).catch(() => {});
    rec.unit.in_assignable_units = (await p.locator(`#identity-user-unit-code option[value="${UNIT_CODE}"]`).count()) > 0;
    if (!rec.unit.in_assignable_units) throw new Error('own_unit_not_in_assignable_units');
    await p.fill('#identity-user-rut', USER_RUT);
    await p.fill('#identity-user-apellido-paterno', MARKER);
    await p.fill('#identity-user-apellido-materno', 'DISC');
    await p.fill('#identity-user-nombre', MARKER);
    await p.selectOption('#identity-user-unit-code', UNIT_CODE);
    await p.selectOption('#identity-user-role-code', PRIMARY_ROLE);
    const prUser = p.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/usuarios/', { timeout: 20000 });
    await p.locator('#identity-operation-modal button[type="submit"]').click();
    const rUser = await prUser;
    const bUser = await rUser.json().catch(() => null);
    rec.user.create = { method: 'POST', path: '/api/usuarios/', raw: '/api/usuarios/', status: rUser.status() };
    if (bUser) {
      rec.user.id = bUser.id_usuario ?? null;
      rec.user.field_names = Object.keys(bUser).sort();
      rec.user.booleans = {
        habilitado: typeof bUser.habilitado === 'boolean' ? bUser.habilitado : null,
        is_locked: typeof bUser.is_locked === 'boolean' ? bUser.is_locked : null,
        must_change_password: typeof bUser.must_change_password === 'boolean' ? bUser.must_change_password : null,
      };
      rec.user.primary_returned = bUser.primary_assignment
        ? { unit_matches_created: bUser.primary_assignment.unit_code === UNIT_CODE, role_code: bUser.primary_assignment.role_code, scope_code: bUser.primary_assignment.scope_code ?? null }
        : null;
      rec.user.assignments_returned_count = Array.isArray(bUser.assignments) ? bUser.assignments.length : null;
    }
    await p.waitForTimeout(1400);
    if (!rec.user.id) throw new Error('no_user_id_in_create_response');

    // 3) detail via owned row link
    rec.stage = 'user_detail';
    await p.fill('input[aria-label="Buscar usuarios"]', USER_RUT);
    await p.waitForTimeout(800);
    await navLink(`/personas/${rec.user.id}`);
    await p.waitForURL((u) => u.pathname === `/personas/${rec.user.id}`, { timeout: 12000 }).catch(() => {});
    await p.waitForTimeout(1400);
    await p.locator('#user-tab-assignments').click();
    await p.waitForTimeout(900);
    rec.verify.user_get_before_delete = await getStatus(`/api/usuarios/${rec.user.id}/`);

    // 4) edición de la asignación principal — PUT (affordance del panel: botón «PUT / PATCH»)
    const editPrimary = async (method) => {
      await ensureModalGone();
      const opened = await clickUnique('PUT / PATCH');
      if (!opened) return { opened: false, status: null };
      const ready = await p.waitForSelector('#identity-assignment-method', { timeout: 12000 }).then(() => true).catch(() => false);
      if (!ready) return { opened: true, status: 'method_field_missing' };
      await waitOption('#identity-assignment-unit-code', 10000);
      await waitOption('#identity-assignment-role-code', 10000);
      const prefill = await p.evaluate(() => {
        const val = (sel) => {
          const el = document.querySelector(sel);
          return el ? { value: el.value, text: (el.selectedOptions[0]?.textContent || '').trim().slice(0, 60) } : null;
        };
        return { unit: val('#identity-assignment-unit-code'), role: val('#identity-assignment-role-code'), scope: val('#identity-assignment-scopeselection') };
      }).catch(() => null);
      const methodSet = await setMethod('#identity-assignment-method', method);
      await p.selectOption('#identity-assignment-unit-code', UNIT_CODE).catch(() => {});
      const avoid = method === 'put'
        ? (prefill && prefill.role ? prefill.role.value : '')
        : (rec.primary_edit.put && rec.primary_edit.put.role_chosen ? rec.primary_edit.put.role_chosen : '');
      const rolePick = await p.evaluate(({ avoid }) => {
        const s = document.querySelector('#identity-assignment-role-code');
        if (!s) return null;
        const opts = [...s.options].filter((o) => o.value !== '' && !/super_admin|tenant_admin/i.test(o.value));
        const pool = opts.filter((o) => o.value !== avoid);
        const chosen = (pool.length ? pool : opts)[0];
        if (!chosen) return null;
        s.value = chosen.value; s.dispatchEvent(new Event('change', { bubbles: true }));
        return chosen.value;
      }, { avoid });
      if (!rolePick) { await ensureModalGone(); return { opened: true, status: 'sin_rol_seguro' }; }
      const pr = p.waitForResponse((r) => r.request().method() === (method === 'put' ? 'PUT' : 'PATCH') && new RegExp(`^/api/usuarios/${rec.user.id}/asignacion-principal/$`).test(new URL(r.url()).pathname), { timeout: 20000 }).catch(() => null);
      await clickSubmit('Guardar asignación principal');
      const r = await pr;
      const body = r ? await r.json().catch(() => null) : null;
      await ensureModalGone();
      return { opened: true, method_set: methodSet, prefill, role_chosen: rolePick, status: r ? r.status() : null, detail: body ? (body.detail ?? null) : null };
    };
    rec.stage = 'primary_put';
    rec.primary_edit.put = await editPrimary('put');
    await p.waitForTimeout(700);
    rec.stage = 'primary_patch';
    rec.primary_edit.patch = await editPrimary('patch');
    await p.waitForTimeout(700);

    // 5) confirmación por lectura del backend
    rec.stage = 'api_confirm';
    const vResp = await apiGet(`/api/usuarios/${rec.user.id}/`);
    const vBody = await vResp.json().catch(() => null);
    rec.api_confirm.get_status = vResp.status();
    rec.api_confirm.primary_role_after = vBody && vBody.primary_assignment ? (vBody.primary_assignment.role_code ?? null) : null;

    // 7) cleanup
    await cleanup('post_mutations');
  } catch (err) {
    errors.push(`harness:${rec.stage}:${String(err && err.message ? err.message : err).slice(0, 220)}`);
    await cleanup('on_error');
  }

  await residueCheck();

  rec.membership.applicable = rec.user.id !== null;
  rec.membership.note = 'POST /api/usuarios/ with initial_unit_code creates a UnitMembership + implicit tirador Assignment on the server (apipoligono/views.py:326-327). Membership was not exercised through its own UI form.';
  rec.network = {
    total_api_calls: net.length,
    mutations: net.filter((n) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(n.method) && !['/api/auth/login/', '/api/auth/logout/'].includes(n.path)),
  };
  rec.page_errors = errors;
  await ctx.close().catch(() => {});
  return rec;
}
