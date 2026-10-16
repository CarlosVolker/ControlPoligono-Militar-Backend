// T11 — V1b: A2 (tenant_admin) — relaciones de recinto POR UI (OP-RCT-007/008):
// unidad descartable + recinto descartable propios, agregar/quitar relación con marcador,
// sonda de duplicado a nivel UI, limpieza trazable y barrido de residuo. Cero RBAC.
async (page) => {
  const BASE = 'http://127.0.0.1:5175';
  const CRED_PATH = '/run/media/gianluca/Gian SSD 1T/Proyectos Desarrollo/Poligono backend/ControlPoligono-Militar-Backend/.cache/development-role-accounts/credentials.json';
  const ALIAS = 'A2';
  const EXPECTED_ROLE = 'tenant_admin';

  const MARKER = `T11A2RCT${Date.now().toString(36).toUpperCase()}`;
  const UNIT_CODE = `${MARKER}U`;
  const UNIT_NAME = `${MARKER} unidad descartable`;
  const RECINTO_CODE = `${MARKER}R`;
  const RECINTO_NAME = `${MARKER} recinto descartable`;

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
  const getStatus = (path) => p.evaluate(async ({ path, tenant }) => {
    try { const r = await fetch(path, { credentials: 'include', headers: { 'X-Tenant-Code': tenant } }); return r.status; }
    catch (e) { return 'fetch_error'; }
  }, { path, tenant: TENANT });
  const apiGet = (path) => p.request.get(`${BASE}${path}`, { headers: { 'X-Tenant-Code': TENANT } });

  const waitModalClosed = async () => {
    await p.waitForFunction(() => !document.querySelector('.ds-modal, [role="dialog"], .modal-backdrop'), null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(400);
  };
  const waitEnabled = async (loc) => {
    for (let i = 0; i < 40; i += 1) {
      const ok = await loc.first().evaluate((el) => !el.disabled).catch(() => false);
      if (ok) return true;
      await p.waitForTimeout(200);
    }
    return false;
  };

  const rec = {
    schema: 'frontend-t11-v1b-recinto-relations/v1',
    date: '2026-10-15',
    task: 'T11 V1b — relaciones de recinto por UI (RCT-007/008) con alias A2 acreditado',
    alias: ALIAS,
    stage: 'boot',
    acreditacion: { alias_claimed: ALIAS, private_role_expected: EXPECTED_ROLE, alias_matched: false, missing_field: null, login: null, context_read: null },
    unit: { marker: MARKER, code: UNIT_CODE, id: null, create: null, delete: null },
    recinto: {
      marker: MARKER, code: RECINTO_CODE, id: null, create: null, create_response_field_names: null,
      unit_codes_before: null,
      relation_add: null, relation_add_body: null,
      option_present_after_relate: null,
      relation_present_after_add: null,
      relation_remove: null, relation_remove_body: null,
      relation_present_after_remove: null,
      delete: null,
    },
    verify: { recinto_get_after_delete: null, unit_get_after_delete: null },
    residue: { recintos_rows_with_marker: null, units_tree_links_with_marker: null },
    gate: { actor_role: EXPECTED_ROLE, used_super_admin_bypass: false, credentials_printed_or_persisted: false },
    cleanup_errors: [],
  };

  const openRecintoDetail = async () => {
    await nav('a.menu-link[href="/organizacion/recintos"]');
    await p.waitForTimeout(1000);
    const link = p.locator(`a[href="/organizacion/recintos/${rec.recinto.id}"]`).first();
    if (await link.count()) { await link.click(); }
    else {
      const byCode = p.locator('.organization-view__table a', { hasText: RECINTO_CODE }).first();
      if (await byCode.count()) await byCode.click();
    }
    await p.waitForTimeout(1200);
  };

  const removeRelationIfPresent = async () => {
    if (!rec.recinto.relation_add || rec.recinto.relation_remove) return;
    await openRecintoDetail();
    const li = p.locator('ul.organization-view__relation-list li', { hasText: UNIT_CODE }).first();
    if (!(await li.count())) return;
    await li.getByRole('button', { name: 'Quitar', exact: true }).first().click();
    await p.waitForTimeout(500);
    const pr = p.waitForResponse((r) => r.request().method() === 'DELETE' && new URL(r.url()).pathname.includes('/quitar-unidad/'), { timeout: 15000 }).catch(() => null);
    await p.locator('.modal-footer button', { hasText: 'Quitar unidad' }).first().click();
    const r = await pr;
    rec.recinto.relation_remove = r ? { method: 'DELETE', raw: new URL(r.url()).pathname, status: r.status() } : { method: 'DELETE', status: 'no-response' };
    await p.waitForTimeout(900);
  };

  const deleteRecinto = async () => {
    if (!rec.recinto.id || rec.recinto.delete) return;
    await openRecintoDetail();
    const del = p.locator('.organization-view__toolbar-actions button', { hasText: 'Eliminar recinto' }).first();
    if (!(await del.count())) { rec.cleanup_errors.push('recinto_delete:button_absent'); return; }
    await del.click();
    await p.waitForTimeout(400);
    const pr = p.waitForResponse((r) => r.request().method() === 'DELETE' && /\/api\/recintos\/\d+\/$/.test(new URL(r.url()).pathname), { timeout: 15000 }).catch(() => null);
    await p.locator('.modal-footer button', { hasText: 'Eliminar recinto' }).first().click();
    const r = await pr;
    if (r) rec.recinto.delete = { method: 'DELETE', path: `/api/recintos/${rec.recinto.id}/`, raw: new URL(r.url()).pathname, status: r.status() };
    await p.waitForTimeout(1000);
  };

  const deleteUnit = async () => {
    if (!rec.unit.id || rec.unit.delete) return;
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
    const pr = p.waitForResponse((r) => r.request().method() === 'DELETE' && /\/api\/organization-units\/\d+\/$/.test(new URL(r.url()).pathname), { timeout: 15000 }).catch(() => null);
    await p.getByRole('button', { name: 'Eliminar unidad', exact: true }).first().click();
    const r = await pr;
    if (r) rec.unit.delete = { method: 'DELETE', path: `/api/organization-units/${rec.unit.id}/`, raw: new URL(r.url()).pathname, status: r.status() };
    await p.waitForTimeout(1200);
  };

  const cleanup = async (reason) => {
    rec.stage = `cleanup:${reason}`;
    const step = async (name, fn) => { try { await fn(); } catch (e) { rec.cleanup_errors.push(`${name}:${String(e && e.message ? e.message : e).slice(0, 140)}`); } };
    await step('relation_remove', removeRelationIfPresent);
    await step('recinto_delete', deleteRecinto);
    await step('unit_delete', deleteUnit);
    await step('verify', async () => {
      if (rec.recinto.id) rec.verify.recinto_get_after_delete = await getStatus(`/api/recintos/${rec.recinto.id}/`);
      if (rec.unit.id) rec.verify.unit_get_after_delete = await getStatus(`/api/organization-units/${rec.unit.id}/`);
    });
  };

  const residueCheck = async () => {
    rec.stage = 'residue';
    try {
      await nav('a.menu-link[href="/organizacion/recintos"]');
      await p.waitForTimeout(1000);
      const s = p.locator('#organization-recinto-search');
      if (await s.count()) { await s.fill(MARKER); await p.waitForTimeout(900); }
      rec.residue.recintos_rows_with_marker = await p.locator('table tbody tr', { hasText: MARKER }).count();
      await nav('a.menu-link[href="/organizacion/unidades"]');
      await p.waitForTimeout(1100);
      const refresh = p.getByRole('button', { name: 'Actualizar', exact: true });
      if (await refresh.count()) { await refresh.first().click(); await p.waitForTimeout(1500); }
      rec.residue.units_tree_links_with_marker = await p.locator('a.organization-view__tree-link', { hasText: MARKER }).count();
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

    // 1) unidad descartable (destino de la relación)
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
    await p.waitForTimeout(1000);

    // 2) recinto descartable (sin unidades al crear: la relación se ejerce en su panel)
    rec.stage = 'recinto_create';
    await nav('a.menu-link[href="/organizacion/recintos"]');
    await p.waitForURL((u) => u.pathname === '/organizacion/recintos', { timeout: 12000 }).catch(() => {});
    await p.waitForTimeout(1000);
    await p.getByRole('button', { name: 'Crear recinto', exact: true }).click();
    await p.waitForSelector('#organization-recinto-code', { timeout: 12000 });
    await p.fill('#organization-recinto-code', RECINTO_CODE);
    await p.fill('#organization-recinto-name', RECINTO_NAME);
    await p.fill('#organization-recinto-description', `${MARKER} descartable para relaciones`);
    const prRec = p.waitForResponse((r) => ['POST', 'PUT'].includes(r.request().method()) && /\/api\/recintos\/(\d+\/)?$/.test(new URL(r.url()).pathname), { timeout: 20000 });
    await p.locator('button[form="organization-recinto-form"]').click();
    const rRec = await prRec;
    const bRec = await rRec.json().catch(() => null);
    rec.recinto.create = { method: rRec.request().method(), path: '/api/recintos/', raw: new URL(rRec.url()).pathname, status: rRec.status() };
    rec.recinto.id = bRec ? (bRec.id ?? null) : null;
    rec.recinto.create_response_field_names = bRec ? Object.keys(bRec).sort() : null;
    await p.waitForTimeout(1200);
    if (!rec.recinto.id) throw new Error('no_recinto_id_in_create_response');

    // 3) detalle: línea base de relaciones
    rec.stage = 'recinto_detail';
    await openRecintoDetail();
    rec.recinto.unit_codes_before = await p.locator('ul.organization-view__relation-list li').count();

    // 4) agregar relación POR UI
    rec.stage = 'relation_add';
    await p.locator('.org-rel-units-card').getByRole('button', { name: 'Agregar unidad', exact: true }).click();
    await p.waitForSelector('#organization-unit-lookup-select', { timeout: 12000 });
    await p.waitForFunction((code) => {
      const el = document.querySelector('#organization-unit-lookup-select');
      return el && !el.disabled && [...el.options].some((o) => o.value === code);
    }, UNIT_CODE, { timeout: 15000 }).catch(() => {});
    await p.selectOption('#organization-unit-lookup-select', UNIT_CODE);
    await p.waitForTimeout(300);
    const prAdd = p.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname.includes(`/agregar-unidad/`), { timeout: 20000 });
    await p.locator('.modal-footer button', { hasText: 'Agregar unidad' }).first().click();
    const rAdd = await prAdd;
    const bAdd = await rAdd.json().catch(() => null);
    rec.recinto.relation_add = { method: 'POST', path: `/api/recintos/{id}/agregar-unidad/${UNIT_CODE}/`, raw: new URL(rAdd.url()).pathname, status: rAdd.status() };
    rec.recinto.relation_add_body = bAdd ? { detail: bAdd.detail ?? null, unit_count: bAdd.unit_count ?? null } : null;
    await waitModalClosed();
    rec.recinto.relation_present_after_add = await p.locator('ul.organization-view__relation-list li', { hasText: UNIT_CODE }).count();

    // 5) diagnóstico del estado posterior al alta + sonda de duplicado a nivel UI
    rec.stage = 'post_add_state';
    const snapshot = () => p.evaluate(() => {
      const btn = document.querySelector('.org-rel-units-card button.btn-primary');
      const r = btn ? btn.getBoundingClientRect() : null;
      const center = r ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null;
      const banner = document.querySelector('.alert-danger[role="alert"]');
      return {
        button_present: !!btn,
        button_disabled: btn ? !!btn.disabled : null,
        button_html: btn ? btn.outerHTML.slice(0, 200) : null,
        pointer_events: btn ? getComputedStyle(btn).pointerEvents : null,
        element_at_center_class: center ? (center.tagName + '.' + String(center.className).slice(0, 70)) : null,
        uncertain_banner_visible: !!banner,
        uncertain_banner_text: banner ? (banner.textContent || '').trim().slice(0, 170) : null,
        modal_present: !!document.querySelector('.ds-modal, [role="dialog"], .modal-backdrop'),
      };
    }).catch(() => null);
    rec.post_add_now = await snapshot();
    await p.waitForTimeout(4000);
    rec.post_add_after_4s = await snapshot();
    await openRecintoDetail();
    rec.post_renav = await snapshot();

    rec.stage = 'duplicate_probe';
    try {
      const opened = await p.evaluate(() => {
        const b = document.querySelector('.org-rel-units-card button.btn-primary');
        if (b && !b.disabled) { b.click(); return true; }
        return false;
      }).catch(() => false);
      rec.duplicate_probe_click_via_dom = opened;
      if (opened) {
        await p.waitForSelector('#organization-unit-lookup-select', { timeout: 12000 });
        await p.waitForFunction(() => {
          const el = document.querySelector('#organization-unit-lookup-select');
          return el && !el.disabled;
        }, null, { timeout: 10000 }).catch(() => {});
        await p.waitForTimeout(500);
        rec.recinto.option_present_after_relate = await p.locator(`#organization-unit-lookup-select option[value="${UNIT_CODE}"]`).count();
        await p.locator('.modal-footer button', { hasText: 'Cancelar' }).first().click();
        await waitModalClosed();
      }
    } catch (probeErr) {
      rec.recinto.duplicate_probe_error = String(probeErr && probeErr.message ? probeErr.message : probeErr).slice(0, 200);
    }

    // 6) quitar relación POR UI (sobre ficha recién abierta, como en la limpieza)
    rec.stage = 'relation_remove';
    await openRecintoDetail();
    const li = p.locator('ul.organization-view__relation-list li', { hasText: UNIT_CODE }).first();
    if (await li.count()) {
      await waitEnabled(li.getByRole('button', { name: 'Quitar', exact: true }));
      await li.getByRole('button', { name: 'Quitar', exact: true }).first().click();
      await p.waitForTimeout(500);
      const prRem = p.waitForResponse((r) => r.request().method() === 'DELETE' && new URL(r.url()).pathname.includes('/quitar-unidad/'), { timeout: 20000 });
      await p.locator('.modal-footer button', { hasText: 'Quitar unidad' }).first().click();
      const rRem = await prRem;
      const bRem = await rRem.json().catch(() => null);
      rec.recinto.relation_remove = { method: 'DELETE', path: `/api/recintos/{id}/quitar-unidad/${UNIT_CODE}/`, raw: new URL(rRem.url()).pathname, status: rRem.status() };
      rec.recinto.relation_remove_body = bRem ? { detail: bRem.detail ?? null, unit_count: bRem.unit_count ?? null } : null;
      await waitModalClosed();
    } else {
      rec.recinto.relation_remove = { status: 'relation_row_absent' };
    }
    rec.recinto.relation_present_after_remove = await p.locator('ul.organization-view__relation-list li', { hasText: UNIT_CODE }).count();

    // 7) limpieza
    await cleanup('post_mutations');
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
