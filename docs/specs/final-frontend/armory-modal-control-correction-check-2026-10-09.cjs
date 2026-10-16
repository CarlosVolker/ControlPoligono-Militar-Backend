/* armory-modal-control-correction-check-2026-10-09.cjs (baseline+append+verify, single run)
 * Appends a scoped correction block under .armory-editor-field restoring source-exact .form-select
 * declarations (baseui-forms.css:159-190) where the view-local .form-select diverges:
 *   min-height (source declares none), background-color, background-image, border, border-radius,
 *   :focus border-color, :disabled background-color. Template/script/historical CSS untouched.
 * One execution from the repo root; exit preserved.
 */
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const REPO = process.cwd();
const FRONT = path.join(REPO, 'front');
const TMP = '/tmp/opencode';
const DOCDIR = path.join(REPO, 'docs/specs/final-frontend');
const FILE = path.join(FRONT, 'src/views/armory/ArmoryView.vue');
const BASE_JSON = path.join(DOCDIR, 'armory-modal-control-correction-baseline-2026-10-09.json');
const CHECK_JSON = path.join(DOCDIR, 'armory-modal-control-correction-check-2026-10-09.json');
function req(p) { try { return require(p); } catch (e) { return null; } }
const sfc = req(path.join(FRONT, 'node_modules/@vue/compiler-sfc')) || req(path.join(FRONT, 'node_modules/.pnpm/@vue+compiler-sfc@3.5.43/node_modules/@vue/compiler-sfc'));
const dom = req(path.join(FRONT, 'node_modules/.pnpm/@vue+compiler-dom@3.5.43/node_modules/@vue/compiler-dom'));
if (!sfc || !dom) { console.error('COMPILER_NOT_FOUND'); process.exit(2); }
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const NT = dom.NodeTypes;
const FORM_IDS = ['armory-editor-form', 'weapon-editor-form', 'calibre-editor-form'];
const EXPW = { 'armory-editor-form': 5, 'weapon-editor-form': 5, 'calibre-editor-form': 3 };
const CORRECTION = `\n/* Armory editors: restore source-exact .form-select declarations where the view-local .form-select diverges (baseui-forms.css:159-190). */\n.armory-editor-field .form-select {\n  min-height: auto;\n  background-color: var(--bui-surface);\n  background-image: var(--buf-select-chevron), var(--buf-select-icon, none);\n  border: 1px solid var(--buf-input-border);\n  border-radius: var(--bui-radius);\n}\n\n.armory-editor-field .form-select:focus {\n  border-color: var(--buf-input-focus);\n}\n\n.armory-editor-field .form-select:disabled {\n  background-color: var(--bui-bg);\n}\n`;

function attrs(n, inc) { const o = {}; for (const p of n.props || []) { if (p.type === NT.ATTRIBUTE) { if (!inc && p.name === 'class') continue; o[p.name] = p.value ? p.value.content : null; } } return o; }
function dirs(n) { return (n.props || []).filter((p) => p.type === NT.DIRECTIVE).map((p) => [p.name, p.arg ? p.arg.content : null, p.exp ? p.exp.content : null, (p.modifiers || []).map((m) => m.content)]); }
function findId(n, id) { let f = null; const w = (x) => { if (!x || f) return; if (x.type === NT.ELEMENT) { if (attrs(x, true).id === id) { f = x; return; } } for (const c of x.children || []) w(c); }; w(n); return f; }
function sig(n, inc, prune) {
  if (!n) return null;
  if (n.type === NT.TEXT) return { t: 'text', c: (n.content || '').trim() };
  if (n.type === NT.INTERPOLATION) return { t: 'mst', c: (n.content && n.content.content || '').trim() };
  if (n.type === NT.IF) return { t: 'if', b: (n.branches || []).map((x) => ({ c: x.condition ? x.condition.content.trim() : null, k: (x.children || []).map((k) => sig(k, inc, prune)) })) };
  if (n.type === NT.FOR) return { t: 'for', s: n.source.content.trim(), k: (n.children || []).map((k) => sig(k, inc, prune)) };
  if (n.type === NT.ELEMENT) { const a = attrs(n, true); if (prune && FORM_IDS.includes(a.id)) return { pruned: a.id }; return { t: 'el', g: n.tag, a: attrs(n, inc), d: dirs(n), k: (n.children || []).map((k) => sig(k, inc, prune)) }; }
  if (n.children) return { t: 'frag', k: n.children.map((k) => sig(k, inc, prune)) };
  return { t: 'x' };
}
function pairs(node) { /* within a form: label[for] set vs control[id] set, unique */ const fors = []; const ids = []; const w = (x) => { if (!x) return; if (x.type === NT.ELEMENT) { const a = attrs(x, true); if (x.tag === 'label' && a.for) fors.push(a.for); if (['input', 'select', 'textarea'].includes(x.tag) && a.id) ids.push(a.id); } for (const c of x.children || []) w(c); }; w(node); return { fors, ids }; }
function styleText(parsed) { return (parsed.descriptor.styles || []).filter((s) => s.scoped).map((s) => s.content).join('\n'); }

const srcBefore = fs.readFileSync(FILE, 'utf8');
const parsedB = sfc.parse(srcBefore, { filename: FILE });
const astB = parsedB.descriptor.template && parsedB.descriptor.template.ast;
const styleB = styleText(parsedB);
if (!fs.existsSync(BASE_JSON)) {
  const forms = {};
  for (const id of FORM_IDS) { const n = findId(astB, id); if (!n) { console.error('BASELINE_FORM_NOT_FOUND', id); process.exit(4); } const pr = pairs(n); const okPairs = pr.fors.length === EXPW[id] && pr.ids.length === EXPW[id] && new Set(pr.fors).size === EXPW[id] && pr.fors.every((f) => pr.ids.includes(f)); if (!okPairs) { console.error('BASELINE_PAIRS_FAIL', id, JSON.stringify({ fors: pr.fors.length, ids: pr.ids.length })); process.exit(4); } forms[id] = { present: true, for_count: pr.fors.length, id_count: pr.ids.length }; }
  fs.writeFileSync(BASE_JSON, JSON.stringify({ generated_at: new Date().toISOString(), kind: 'BEFORE', phase: 'armory control CSS correction (pre-append)', compiler: sfc.version, source_sha256: sha(srcBefore), script_sha256: sha((parsedB.descriptor.script ? parsedB.descriptor.script.content : '') + '\n' + (parsedB.descriptor.scriptSetup ? parsedB.descriptor.scriptSetup.content : '')), style_sha256: sha(styleB), outofscope_sha256: sha(JSON.stringify(sig(astB, true, true))), forms, note: 'hashes/metadata only; no source content' }, null, 2) + '\n');
}
const base = JSON.parse(fs.readFileSync(BASE_JSON, 'utf8'));

/* append the correction block (append only) */
const styleEnd = srcBefore.lastIndexOf('</style>');
const out = srcBefore.slice(0, styleEnd) + CORRECTION + srcBefore.slice(styleEnd);
const expectedAfter = sha(out);

/* write app */
fs.writeFileSync(FILE, out);

/* verify */
const srcAfter = fs.readFileSync(FILE, 'utf8');
const cur = sha(srcAfter);
const parA = sfc.parse(srcAfter, { filename: FILE });
const astA = parA.descriptor.template && parA.descriptor.template.ast;
const styleA = styleText(parA);
const scriptA = sha((parA.descriptor.script ? parA.descriptor.script.content : '') + '\n' + (parA.descriptor.scriptSetup ? parA.descriptor.scriptSetup.content : ''));
const outofA = sha(JSON.stringify(sig(astA, true, true)));
const oldStyle = sha(styleA.replace(CORRECTION, ''));
const formsPairs = {};
for (const id of FORM_IDS) { const n = findId(astA, id); const pr = pairs(n); formsPairs[id] = { for_count: pr.fors.length, id_count: pr.ids.length, all_match: pr.fors.every((f) => pr.ids.includes(f)) && new Set(pr.fors).size === pr.fors.length && pr.fors.length === EXPW[id] }; }
const styleErrs = []; let css = '';
for (const s of (parA.descriptor.styles || []).filter((s) => s.scoped)) { const r = sfc.compileStyle({ source: s.content, filename: FILE, id: 'data-v-acc', scoped: true }); styleErrs.push(...r.errors.map((e) => String(e.message || e))); css += r.code + '\n'; }
const tmplErrs = parA.descriptor.template ? (sfc.compileTemplate({ source: parA.descriptor.template.content, filename: FILE, id: 'data-v-acc' }).errors || []).map((e) => String(e.message || e)) : [];
fs.writeFileSync(path.join(TMP, 'armory-modal-control-correction-oct09-compiled.css'), css + '\n');
const noC = css.replace(/\/\*[\s\S]*?\*\//g, ''); const sels = []; const re = /([^{}]+)\{/g; let m; while ((m = re.exec(noC)) !== null) { const s = m[1].trim(); if (s && !s.startsWith('@')) sels.push(s); }

const defects = [];
if (cur !== expectedAfter) defects.push({ reason: 'CURRENT_NOT_EXPECTED_AFTER' });
if (scriptA !== base.script_sha256) defects.push({ reason: 'SCRIPT_CHANGED' });
if (outofA !== base.outofscope_sha256) defects.push({ reason: 'OUTOFSCOPE_CHANGED' });
if (oldStyle !== base.style_sha256) defects.push({ reason: 'OLD_STYLE_NOT_INTACT_AFTER_STRIP' });
for (const id of FORM_IDS) if (!formsPairs[id].all_match) defects.push({ reason: 'PAIRS_NOT_ALL_MATCH', form: id, ...formsPairs[id] });
if (tmplErrs.length || styleErrs.length) defects.push({ reason: 'COMPILE_ERROR', tmplErrs, styleErrs });

const propertyMap = {
  'min-height': { source: 'not declared in baseui-forms.css:159-190 .form-select', targetLocal: 'calc(1.5em + 1rem + 2px)', rule: 'min-height:auto (technical adaptation to neutralize the view-local override; source declares none)' },
  'border-radius': { source: 'var(--bui-radius) (baseui-forms.css:187)', targetLocal: 'var(--card-radius)', rule: 'border-radius:var(--bui-radius)' },
  'background-image': { source: 'var(--buf-select-chevron), var(--buf-select-icon, none) (baseui-forms.css:173)', targetLocal: 'single url(svg)', rule: 'background-image:var(--buf-select-chevron), var(--buf-select-icon, none)' },
  'background-color': { source: 'var(--bui-surface) (baseui-forms.css:172)', targetLocal: 'var(--surface)', rule: 'background-color:var(--bui-surface)' },
  border: { source: '1px solid var(--buf-input-border) (baseui-forms.css:186)', targetLocal: '1px solid var(--input-border)', rule: 'border:1px solid var(--buf-input-border)' },
  'focus border-color': { source: 'var(--buf-input-focus) (baseui-forms.css:180)', targetLocal: 'var(--input-focus)', rule: 'border-color:var(--buf-input-focus)' },
  'disabled background-color': { source: 'var(--bui-bg) (baseui-forms.css:190)', targetLocal: 'var(--bg)', rule: 'background-color:var(--bui-bg)' }
};

const check = { generated_at: new Date().toISOString(), compiler: sfc.version,
  before_hashes: { source: base.source_sha256, script: base.script_sha256, style: base.style_sha256, outofscope: base.outofscope_sha256 },
  after_hashes: { source: cur, script: scriptA, style: sha(styleA), outofscope: outofA },
  expected_after_sha256: expectedAfter,
  identities: { current_equals_expected_after: cur === expectedAfter, script_unchanged: scriptA === base.script_sha256, outofscope_unchanged: outofA === base.outofscope_sha256, old_style_intact: oldStyle === base.style_sha256 },
  pairs_by_form: formsPairs, property_map: propertyMap, source_order: ['styles.css', 'baseui.css', 'baseui-content.css', 'baseui-forms.css', 'theme-customizer.css'],
  new_scoped_selectors: sels.filter((s) => /armory-editor-field/.test(s)),
  compile: { template_errors: tmplErrs, style_errors: styleErrs }, defects, ok: defects.length === 0 };
fs.writeFileSync(CHECK_JSON, JSON.stringify(check, null, 2) + '\n');
console.log(JSON.stringify({ ok: check.ok, before: base.source_sha256, expected_after: expectedAfter, current: cur, identities: check.identities, pairs_by_form: formsPairs, new_selectors: check.new_scoped_selectors, tmplErrs, styleErrs, defects }));
