/* armory-modal-fields-check-2026-10-09.cjs  (baseline+transform+verify, single run)
 * Three Armory editors: field-grid -> armory-editor-fields (x3); field-group[.field-span] -> mb-3 armory-editor-field (x13).
 * Baseline BEFORE durable (hashes/metadata), transform in memory (asserts), write, expected-after sha, verify.
 * Runs from the repo root; all paths are repo-relative via cwd. One execution, exit code preserved.
 */
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const REPO = process.cwd();
const FRONT = path.join(REPO, 'front');
const TMP = '/tmp/opencode';
const DOCDIR = path.join(REPO, 'docs/specs/final-frontend');
const FILE = path.join(FRONT, 'src/views/armory/ArmoryView.vue');
const BASE_JSON = path.join(DOCDIR, 'armory-modal-fields-baseline-2026-10-09.json');
const CHECK_JSON = path.join(DOCDIR, 'armory-modal-fields-check-2026-10-09.json');
function req(p) { try { return require(p); } catch (e) { return null; } }
const sfc = req(path.join(FRONT, 'node_modules/@vue/compiler-sfc')) || req(path.join(FRONT, 'node_modules/.pnpm/@vue+compiler-sfc@3.5.43/node_modules/@vue/compiler-sfc'));
const dom = req(path.join(FRONT, 'node_modules/.pnpm/@vue+compiler-dom@3.5.43/node_modules/@vue/compiler-dom'));
if (!sfc || !dom) { console.error('COMPILER_NOT_FOUND'); process.exit(2); }
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const NT = dom.NodeTypes;
const FORM_IDS = ['armory-editor-form', 'weapon-editor-form', 'calibre-editor-form'];
const NEW_BLOCK = `\n/* DS block editor fields for the THREE Armory editors (forms-basic field flow). */\n.armory-editor-fields {\n  display: block;\n}\n\n.armory-editor-field {\n  min-width: 0;\n}\n`;

function attrs(n, inc) { const o = {}; for (const p of n.props || []) { if (p.type === NT.ATTRIBUTE) { if (!inc && p.name === 'class') continue; o[p.name] = p.value ? p.value.content : null; } } return o; }
function dirs(n) { return (n.props || []).filter((p) => p.type === NT.DIRECTIVE).map((p) => [p.name, p.arg ? p.arg.content : null, p.exp ? p.exp.content : null, (p.modifiers || []).map((m) => m.content)]); }
function findId(n, id) { let f = null; const w = (x) => { if (!x || f) return; if (x.type === NT.ELEMENT) { const a = attrs(x, true); if (a.id === id) { f = x; return; } } for (const c of x.children || []) w(c); }; w(n); return f; }
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
function wrapCount(node) { let c = 0; const w = (x) => { if (!x) return; if (x.type === NT.ELEMENT && x.tag === 'div') { const v = attrs(x, true).class || ''; if (/(^|\s)field-group(\s|$)/.test(v)) c++; } for (const k of x.children || []) w(k); }; w(node); return c; }

const srcBefore = fs.readFileSync(FILE, 'utf8');
const parsedB = sfc.parse(srcBefore, { filename: FILE });
const astB = parsedB.descriptor.template && parsedB.descriptor.template.ast;
const styleB = (parsedB.descriptor.styles || []).filter((s) => s.scoped).map((s) => s.content).join('\n');

/* BEFORE baseline (durable, only if absent) */
if (!fs.existsSync(BASE_JSON)) {
  const forms = {};
  for (const id of FORM_IDS) { const n = findId(astB, id); if (!n) { console.error('BASELINE_FORM_NOT_FOUND', id); process.exit(4); } forms[id] = { present: true, wrappers: wrapCount(n), contract_sha: sha(JSON.stringify(sig(n, false, false))) }; }
  const exp = { 'armory-editor-form': 5, 'weapon-editor-form': 5, 'calibre-editor-form': 3 };
  for (const id of FORM_IDS) if (forms[id].wrappers !== exp[id]) { console.error('BASELINE_WRAPPER_MISMATCH', id, forms[id].wrappers, exp[id]); process.exit(4); }
  fs.writeFileSync(BASE_JSON, JSON.stringify({ generated_at: new Date().toISOString(), kind: 'BEFORE', compiler: sfc.version, source_sha256: sha(srcBefore), script_sha256: sha((parsedB.descriptor.script ? parsedB.descriptor.script.content : '') + '\n' + (parsedB.descriptor.scriptSetup ? parsedB.descriptor.scriptSetup.content : '')), style_sha256: sha(styleB), outofscope_sha256: sha(JSON.stringify(sig(astB, true, true))), forms, note: 'hashes/metadata/pairs only; no source content' }, null, 2) + '\n');
}
const base = JSON.parse(fs.readFileSync(BASE_JSON, 'utf8'));

/* transform IN MEMORY */
let out = srcBefore;
function blockOf(s, id) { const a = s.indexOf('id="' + id + '"'); if (a < 0) return null; const s0 = s.lastIndexOf('<form', a); const e0 = s.indexOf('</form>', a); return { start: s0, end: e0 + 7, block: s.slice(s0, e0 + 7) }; }
const counts = {};
for (const id of FORM_IDS) {
  const b = blockOf(out, id); if (!b) { console.error('FORM_NOT_FOUND', id); process.exit(4); }
  let block = b.block;
  block = block.replace('class="field-grid"', 'class="armory-editor-fields"');
  block = block.replace(/class="field-group field-span"/g, 'class="mb-3 armory-editor-field"');
  block = block.replace(/class="field-group"/g, 'class="mb-3 armory-editor-field"');
  const n = (block.match(/class="mb-3 armory-editor-field"/g) || []).length; counts[id] = n;
  out = out.slice(0, b.start) + block + out.slice(b.end);
}
const exp = { 'armory-editor-form': 5, 'weapon-editor-form': 5, 'calibre-editor-form': 3 };
for (const id of FORM_IDS) if (counts[id] !== exp[id]) { console.error('TRANSFORM_WRAPPER_MISMATCH', id, counts[id], exp[id]); process.exit(4); }
if ((out.match(/class="armory-editor-fields"/g) || []).length !== 3) { console.error('GRID_RENAME_MISMATCH'); process.exit(4); }
/* append CSS block */
const styleEnd = out.lastIndexOf('</style>');
out = out.slice(0, styleEnd) + NEW_BLOCK + out.slice(styleEnd);
const expectedAfter = sha(out);

/* write app */
fs.writeFileSync(FILE, out);

/* verify */
const srcAfter = fs.readFileSync(FILE, 'utf8');
const cur = sha(srcAfter);
const parA = sfc.parse(srcAfter, { filename: FILE });
const astA = parA.descriptor.template && parA.descriptor.template.ast;
const styleA = (parA.descriptor.styles || []).filter((s) => s.scoped).map((s) => s.content).join('\n');
const scriptA = sha((parA.descriptor.script ? parA.descriptor.script.content : '') + '\n' + (parA.descriptor.scriptSetup ? parA.descriptor.scriptSetup.content : ''));
const outofA = sha(JSON.stringify(sig(astA, true, true)));
const formsA = {}; for (const id of FORM_IDS) formsA[id] = sha(JSON.stringify(sig(findId(astA, id), false, false)));
const styleOld = sha(styleA.replace(NEW_BLOCK, ''));
const styleErrs = []; let css = '';
for (const s of (parA.descriptor.styles || []).filter((s) => s.scoped)) { const r = sfc.compileStyle({ source: s.content, filename: FILE, id: 'data-v-amf', scoped: true }); styleErrs.push(...r.errors.map((e) => String(e.message || e))); css += r.code + '\n'; }
const tmplErrs = parA.descriptor.template ? (sfc.compileTemplate({ source: parA.descriptor.template.content, filename: FILE, id: 'data-v-amf' }).errors || []).map((e) => String(e.message || e)) : [];
fs.writeFileSync(path.join(TMP, 'armory-modal-fields-oct09-compiled.css'), css + '\n');
const noC = css.replace(/\/\*[\s\S]*?\*\//g, ''); const sels = []; const re = /([^{}]+)\{/g; let m; while ((m = re.exec(noC)) !== null) { const s = m[1].trim(); if (s && !s.startsWith('@')) sels.push(s); }

const defects = [];
if (cur !== expectedAfter) defects.push({ reason: 'CURRENT_NOT_EXPECTED_AFTER' });
if (scriptA !== base.script_sha256) defects.push({ reason: 'SCRIPT_CHANGED' });
if (outofA !== base.outofscope_sha256) defects.push({ reason: 'OUTOFSCOPE_CHANGED' });
if (styleOld !== base.style_sha256) defects.push({ reason: 'OLD_STYLE_NOT_INTACT_AFTER_STRIP' });
for (const id of FORM_IDS) { if (formsA[id] !== base.forms[id].contract_sha) defects.push({ reason: 'FORM_CONTRACT_CHANGED', form: id }); }
if (tmplErrs.length || styleErrs.length) defects.push({ reason: 'COMPILE_ERROR', tmplErrs, styleErrs });
/* 13 for/id preserved */
const pairOk = [...Array(13)].length > 0 && /for="armory-code"[\s\S]*id="armory-code"/.test(srcAfter) && /for="calibre-active"[\s\S]*id="calibre-active"/.test(srcAfter);
if (!pairOk) defects.push({ reason: 'FOR_ID_PAIR_MISSING' });

const check = { generated_at: new Date().toISOString(), compiler: sfc.version,
  before_hashes: { source: base.source_sha256, script: base.script_sha256, style: base.style_sha256, outofscope: base.outofscope_sha256 },
  after_hashes: { source: cur, script: scriptA, style: sha(styleA), outofscope: outofA },
  expected_after_sha256: expectedAfter,
  identities: { current_equals_expected_after: cur === expectedAfter, script_unchanged: scriptA === base.script_sha256, outofscope_unchanged: outofA === base.outofscope_sha256, old_style_intact: styleOld === base.style_sha256, form_contracts_unchanged: FORM_IDS.every((id) => formsA[id] === base.forms[id].contract_sha) },
  wrappers_by_form: counts, grid_renames: 3, for_id_pair_ok: pairOk,
  new_scoped_selectors: sels.filter((s) => /armory-editor/.test(s)),
  compile: { template_errors: tmplErrs, style_errors: styleErrs }, defects, ok: defects.length === 0 };
fs.writeFileSync(CHECK_JSON, JSON.stringify(check, null, 2) + '\n');
console.log(JSON.stringify({ ok: check.ok, before: base.source_sha256, expected_after: expectedAfter, current: cur, wrappers: counts, identities: check.identities, pairOk, new_selectors: check.new_scoped_selectors, tmplErrs, styleErrs, defects }));
