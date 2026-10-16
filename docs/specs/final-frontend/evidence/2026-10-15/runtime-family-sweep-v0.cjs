async (sharedPage) => {
  const BASE = 'http://127.0.0.1:5175';
  const CREDS_PATH = '.cache/development-role-accounts/credentials.json';
  const aliases = [
    { alias: 'A1', role: 'super_admin' },
    { alias: 'A2', role: 'tenant_admin' },
    { alias: 'A3', role: 'admin_unidad' },
    { alias: 'A4', role: 'comandante_unidad' },
    { alias: 'A5', role: 'oficial_tiro' },
    { alias: 'A6', role: 'oficial_observador' },
    { alias: 'A7', role: 'encargado_almacen' },
    { alias: 'A8', role: 'tirador' },
  ];
  const opByPath = {
    '/api/auth/login/': 'OP-AUT-001',
    '/api/auth/context/': 'OP-AUT-002',
    '/api/auth/audit-log/': 'OP-AUT-004',
    '/api/logout/': 'OP-AUT-005',
    '/api/authz/catalog/': 'OP-AZC-001',
    '/api/authz/role-categories/': 'OP-AZC-002',
    '/api/authz/personas-por-unidad/': 'OP-AZC-003',
    '/api/authz/eligible-target-units/': 'OP-AZC-004',
    '/api/armorias/': 'OP-ARM-001',
    '/api/calibres/': 'OP-CAL-001',
    '/api/consumos-arma/': 'OP-CAR-001',
    '/api/consumos-municion/': 'OP-CMN-001',
    '/api/ejercicios/': 'OP-EJR-001',
    '/api/fracciones/': 'OP-FRC-001',
    '/api/lecciones/': 'OP-LES-001',
    '/api/memberships/': 'OP-MEM-001',
    '/api/authz/overrides/': 'OP-OVR-001',
    '/api/posiciones/': 'OP-POS-001',
    '/api/authz/position-permissions/': 'OP-PPR-001',
    '/api/authz/permissions/': 'OP-PRM-001',
    '/api/recintos/': 'OP-RCT-001',
    '/api/resultados/': 'OP-RES-001',
    '/api/poligonos/': 'OP-RNG-001',
    '/api/authz/roles/': 'OP-ROL-001',
    '/api/authz/role-permissions/': 'OP-RPR-001',
    '/api/authz/scopes/': 'OP-SCP-001',
    '/api/organization-units/': 'OP-UNT-001',
    '/api/organization-units/lookup/': 'OP-UNT-009',
    '/api/me/assignable-units/': 'OP-UNT-010',
    '/api/usuarios/': 'OP-USR-001',
    '/api/armas/': 'OP-WPN-001',
  };
  const routes = [
    { family: 'organizaciones', route: '/organizacion/unidades', fallback: '/api/organization-units/' },
    { family: 'organizaciones', route: '/organizacion/recintos', fallback: '/api/recintos/' },
    { family: 'organizaciones', route: '/organizacion/puestos', fallback: '/api/posiciones/' },
    { family: 'organizaciones', route: '/organizacion/membresias', fallback: '/api/memberships/' },
    { family: 'personas', route: '/personas', fallback: '/api/usuarios/' },
    { family: 'autorizacion', route: '/personas/roles', fallback: '/api/authz/roles/' },
    { family: 'autorizacion', route: '/personas/scopes', fallback: '/api/authz/scopes/' },
    { family: 'autorizacion', route: '/personas/permisos', fallback: '/api/authz/permissions/' },
    { family: 'autorizacion', route: '/personas/overrides', fallback: null, limitation: 'closed_route_no_probe' },
    { family: 'armas', route: '/almacen/armerias', fallback: '/api/armorias/' },
    { family: 'armas', route: '/almacen/armas', fallback: '/api/armas/' },
    { family: 'calibres', route: '/almacen/calibres', fallback: '/api/calibres/' },
    { family: 'tiro', route: '/tiro/poligonos', fallback: '/api/poligonos/' },
    { family: 'tiro', route: '/tiro/lecciones', fallback: '/api/lecciones/' },
    { family: 'ejercicios', route: '/tiro/ejercicios', fallback: '/api/ejercicios/' },
    { family: 'consumos', route: '/tiro/consumos-municion', fallback: '/api/consumos-municion/' },
    { family: 'consumos', route: '/tiro/consumos-arma', fallback: '/api/consumos-arma/' },
    { family: 'auditoria', route: '/auditoria', fallback: '/api/auth/audit-log/' },
    { family: 'cuenta', route: '/cuenta', fallback: null, accountMenu: true },
  ];
  const browser = sharedPage.context().browser();
  const fileCtx = await browser.newContext();
  const filePage = await fileCtx.newPage();
  const fileUrl = `file:///proc/self/cwd/${CREDS_PATH}`;
  let credentials;
  try {
    await filePage.goto(fileUrl, { waitUntil: 'load' });
    credentials = JSON.parse(await filePage.locator('body').innerText());
  } finally {
    await fileCtx.close();
  }

  const normalizePath = (path) => path.split('?')[0].replace(/\/\d+(?=\/|$)/g, '/{id}');
  const publicOp = (path) => opByPath[path] || null;
  const allActors = [];

  for (const actor of aliases) {
    const account = credentials.accounts.find((item) => item.role === actor.role);
    if (!account) {
      allActors.push({ actor: actor.alias, status: 'credential_missing', families: [] });
      continue;
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    const responses = [];
    const blocked = [];
    let activeSource = 'ui';
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();
      if (path.startsWith('/api/me/preferences/appearance/') && method !== 'GET') {
        blocked.push({ method, path: normalizePath(path), reason: 'preferences_excluded' });
        await route.abort('blockedbyclient');
        return;
      }
      if (method === 'GET' || (method === 'POST' && ['/api/auth/login/', '/api/logout/'].includes(path))) {
        await route.continue();
        return;
      }
      blocked.push({ method, path: normalizePath(path), reason: 'non_read_blocked' });
      await route.abort('blockedbyclient');
    });
    page.on('response', (response) => {
      try {
        const url = new URL(response.url());
        if (url.pathname.startsWith('/api/')) {
          responses.push({
            source: activeSource,
            method: response.request().method(),
            path: normalizePath(url.pathname),
            status: response.status(),
          });
        }
      } catch {}
    });

    const record = { actor: actor.alias, login: null, families: [], logout: null, blocked };
    let activeStage = 'login';
    try {
      activeSource = 'ui';
      const loginStart = responses.length;
      await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#tenantCode', { timeout: 12000 });
      await page.fill('#tenantCode', credentials.context.tenant);
      await page.fill('#rut', account.rut);
      await page.fill('#password', account.password);
      await page.click('.auth-button[type="submit"]');
      await page.waitForURL((url) => !String(url).includes('/login'), { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {});
      const loginEvents = responses.slice(loginStart).filter((item) => item.path === '/api/auth/login/' || item.path === '/api/auth/context/');
      record.login = {
        status: 'ui_login',
        http: loginEvents.map((response) => ({ ...response, public_op: publicOp(response.path) })),
      };

      for (const item of routes) {
        try {
        activeStage = `route:${item.route}`;
        activeSource = 'ui';
        let navigation = 'deep_link';
        let start = responses.length;
        let landed = null;
        if (item.accountMenu) {
          try {
            const trigger = page.locator('#actor-menu-trigger');
            if (await trigger.count() && await trigger.isVisible().catch(() => false)) {
              await trigger.click({ timeout: 4000 });
              await page.waitForTimeout(300);
              const link = page.locator(`#actor-context-menu a[href="${item.route}"]`);
              if (await link.count() && await link.first().isVisible().catch(() => false)) {
                navigation = 'menu';
                start = responses.length;
                await link.first().click({ timeout: 4000 });
                await page.waitForTimeout(400);
              } else {
                await page.keyboard.press('Escape').catch(() => {});
              }
            }
          } catch (menuError) {
            record.menu_error = String((menuError && menuError.message) || menuError).slice(0, 180);
            await page.keyboard.press('Escape').catch(() => {});
          }
        } else {
          const link = page.locator(`a.menu-link[href="${item.route}"]`);
          if (await link.count()) {
            navigation = 'menu';
            start = responses.length;
            await link.first().click();
            await page.waitForTimeout(250);
          }
        }

        if (navigation === 'deep_link') {
          start = responses.length;
          await page.goto(`${BASE}${item.route}?tenant=${encodeURIComponent(credentials.context.tenant)}`, { waitUntil: 'domcontentloaded' });
        }
        await page.waitForLoadState('networkidle', { timeout: 1800 }).catch(() => {});
        await page.waitForTimeout(250);
        landed = await page.evaluate(() => location.pathname);
        const appearanceExcluded = blocked.some((entry) => entry.reason === 'preferences_excluded');
        const uiState = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          const visible = (element) => !!(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
          const alertNodes = [...document.querySelectorAll('.alert.state-message, [role="alert"], #actor-context-menu')].filter(visible);
          const codes = [...new Set(alertNodes.flatMap((element) => (element.textContent || '').match(/\b(?:[a-z][a-z0-9_]*:[a-z][a-z0-9_]*|view_[a-z0-9_]+)\b/g) || []))];
          const denial = [...document.querySelectorAll('.alert.state-message, [role="alert"]')]
            .some((element) => visible(element) && (element.textContent || '').includes('Acceso denegado'));
          return {
            state: denial ? 'neutral_denial' : (document.querySelector('main.page-content') ? 'page_shell' : 'unresolved'),
            permission_codes: codes,
          };
        });
        const uiEvents = responses.slice(start).filter((response) => response.source === 'ui');
        const observation = {
          family: item.family,
          route: item.route,
          navigation,
          landed,
          surface: uiState.state,
          permission_codes_visible: uiState.permission_codes,
          http: uiEvents,
          limitation: item.limitation || null,
        };

        if (item.fallback && !uiEvents.some((response) => response.path === normalizePath(item.fallback))) {
          activeSource = 'direct_read_fallback';
          try {
            const status = await page.evaluate(async ({ apiPath, tenant }) => {
              const response = await fetch(apiPath, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
                headers: { 'X-Tenant-Code': tenant },
              });
              return response.status;
            }, { apiPath: item.fallback, tenant: credentials.context.tenant });
            observation.http.push({
              source: 'direct_read_fallback',
              method: 'GET',
              path: normalizePath(item.fallback),
              status,
              public_op: publicOp(item.fallback),
            });
          } catch {
            observation.http.push({
              source: 'direct_read_fallback',
              method: 'GET',
              path: normalizePath(item.fallback),
              status: null,
              public_op: publicOp(item.fallback),
              result: 'no_http_response',
            });
          }
          activeSource = 'ui';
          if (!observation.limitation) observation.limitation = 'no_fresh_ui_response_direct_GET_observed';
        }
        if (!item.fallback && !uiEvents.length && !observation.limitation) observation.limitation = 'no_account_http_observed';
        observation.http = observation.http.map((response) => ({
          source: response.source,
          method: response.method,
          path: response.path,
          status: response.status,
          public_op: response.public_op || publicOp(response.path),
          ...(response.result ? { result: response.result } : {}),
        }));
        if (appearanceExcluded && observation.surface !== 'neutral_denial') {
          observation.surface = 'not_assessed_appearance_preferences_excluded';
        }
        if (!observation.http.length) observation.limitation = observation.limitation || 'no_new_http_response_observed';
        record.families.push(observation);
        } catch (routeError) {
          record.families.push({ family: item.family, route: item.route, navigation: 'error', landed: null, surface: 'route_error', permission_codes_visible: [], http: [], limitation: null, error: String((routeError && routeError.message) || routeError).slice(0, 200) });
        }
      }

      activeStage = 'logout';
      activeSource = 'ui';
      const logoutStart = responses.length;
      await page.goto(`${BASE}/?tenant=${encodeURIComponent(credentials.context.tenant)}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 1800 }).catch(() => {});
      if (await page.locator('#actor-menu-trigger').count()) {
        await page.click('#actor-menu-trigger').catch(() => {});
        const logoutButton = page.locator('#actor-context-menu button.dropdown-item-danger');
        if (await logoutButton.count()) {
          await logoutButton.first().click();
          await page.waitForURL((url) => String(url).includes('/login'), { timeout: 10000 }).catch(() => {});
        }
      }
      record.logout = {
        path: await page.evaluate(() => location.pathname).catch(() => null),
        http: responses.slice(logoutStart)
          .filter((item) => item.path === '/api/logout/')
          .map((response) => ({ ...response, public_op: publicOp(response.path) })),
      };
    } catch {
      record.status = 'harness_error';
      record.harness_error_stage = activeStage;
    } finally {
      await context.close().catch(() => {});
    }
    allActors.push(record);
  }

  const evidence = {
    schema: 'frontend-runtime-family-sweep/v1',
    date: '2026-10-13',
    source: {
      routes: 'front/src/router/routes.ts',
      matrix: 'docs/specs/final-frontend/evidence/2026-10-12/acceptance-matrix.json',
    },
    policy: {
      business_methods: ['GET'],
      auth_methods: ['POST /api/auth/login/', 'POST /api/logout/'],
      excluded: ['appearance preference API calls', 'closed overrides backend probe', 'detail routes without existing IDs', 'response bodies'],
      context: 'I use one fresh browser context per actor, UI login/logout, and no shared-page interaction',
    },
    harness_retry: {
      first_attempt: 'harness_error',
      cause: 'process_global_unavailable_in_playwright_runtime',
      retry: 'credential_file_url_via_proc_self_cwd',
      second_attempt: 'harness_error_during_account_menu_or_logout_after_family_routes',
      current_attempt: '2026-10-15 v0: GETs de apariencia permitidos; menú con timeout y caída a deep-link; try/catch por ruta; logout garantizado',
    },
    actors: allActors,
  };
  const saveContext = await browser.newContext({ acceptDownloads: true });
  try {
    const savePage = await saveContext.newPage();
    await savePage.setContent('<!doctype html><html><body></body></html>');
    const downloadReady = savePage.waitForEvent('download');
    await savePage.evaluate((json) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      link.download = 'runtime-family-evidence.json';
      link.click();
    }, `${JSON.stringify(evidence, null, 2)}\n`);
    const download = await downloadReady;
    await download.saveAs('/proc/self/cwd/.cache/frontend-acceptance/2026-10-15/runtime-family-evidence.json');
  } finally {
    await saveContext.close().catch(() => {});
  }
  return {
    artifact: '.cache/frontend-acceptance/2026-10-15/runtime-family-evidence.json',
    schema: evidence.schema,
    actors: allActors.map((item) => ({ actor: item.actor, status: item.status || 'observed', families: item.families.length })),
  };
}
