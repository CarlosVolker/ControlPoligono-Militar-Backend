/* modal-control-layer-check-2026-10-09.cjs  (baseline | apply | verify via one run)
 * Seam CSS for the Teleported DsModal body fields + one Shooting class expression fix.
 * DsModal.vue: append ONE scoped CSS block (.modal-body :deep(...) fields/labels/states).
 * ShootingView.vue: selectClass -> fieldClass on #shooting-lesson-units ONLY.
 * Baseline BEFORE durable; expected-after = exact append + one exact replace.
 * Run from the repo root (cwd-relative). One execution; exit preserved.
 */
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const REPO = process.cwd();
const FRONT = path.join(REPO, 'front');
const TMP = '/tmp/opencode';
const DOCDIR = path.join(REPO, 'docs/specs/final-frontend');
const DSMODAL = path.join(FRONT, 'src/components/shared/DsModal.vue');
const SHOOTING = path.join(FRONT, 'src/views/shooting/ShootingView.vue');
const BASE_JSON = path.join(DOCDIR, 'modal-control-layer-baseline-2026-10-09.json');
const CHECK_JSON = path.join(DOCDIR, 'modal-control-layer-check-2026-10-09.json');
function req(p) { try { return require(p); } catch (e) { return null; } }
const sfc = req(path.join(FRONT, 'node_modules/@vue/compiler-sfc')) || req(path.join(FRONT, 'node_modules/.pnpm/@vue+compiler-sfc@3.5.43/node_modules/@vue/compiler-sfc'));
if (!sfc) { console.error('COMPILER_NOT_FOUND'); process.exit(2); }
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const APPEND = `
/* DS field seam for the Teleported modal body (no .page-content ancestor). Source:
   baseui-forms.css:53-102 (label/control + states), :159-190 (select + states), :405-455 (invalid). */
.modal-body :deep(.form-label) {
  display: inline-block;
  margin-bottom: 8px;
  font-weight: 500;
}

.modal-body :deep(.form-control) {
  display: block;
  width: 100%;
  min-height: calc(1.5em + 1rem + 2px);
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--bui-text);
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bui-surface);
  background-clip: padding-box;
  border: 1px solid var(--buf-input-border);
  border-radius: var(--bui-radius);
  transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

.modal-body :deep(.form-control:focus-visible) {
  color: var(--bui-text);
  background-color: var(--bui-surface);
  border-color: var(--buf-input-focus);
  outline: 0;
  box-shadow: none;
}

.modal-body :deep(.form-control::placeholder) {
  color: var(--buf-placeholder);
  opacity: 1;
}

.modal-body :deep(.form-control[readonly]:not(:disabled)) {
  background-color: var(--bui-surface);
  opacity: 1;
}

.modal-body :deep(.form-control:disabled) {
  background-color: var(--bui-bg);
  opacity: 1;
}

/* select: source-exact (baseui-forms.css:159-190 declares NO min-height) */
.modal-body :deep(.form-select) {
  display: block;
  width: 100%;
  padding: 8px 72px 8px 24px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--bui-text);
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bui-surface);
  background-image: var(--buf-select-chevron), var(--buf-select-icon, none);
  background-repeat: no-repeat;
  background-position: right 24px center;
  background-size: 14px 10px;
  border: 1px solid var(--buf-input-border);
  border-radius: var(--bui-radius);
  transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

.modal-body :deep(.form-select:focus) {
  border-color: var(--buf-input-focus);
  outline: 0;
  box-shadow: none;
}

.modal-body :deep(.form-select[multiple]),
.modal-body :deep(.form-select[size]:not([size="1"])) {
  padding-right: 24px;
  background-image: none;
}

.modal-body :deep(.form-select:disabled) {
  background-color: var(--bui-bg);
}

/* invalid keeps BOTH layers (chevron + status icon) for selects, per source */
.modal-body :deep(.form-control.is-invalid),
.modal-body :deep(.was-validated .form-control:invalid) {
  border-color: var(--buf-invalid);
}

.modal-body :deep(.form-select.is-invalid),
.modal-body :deep(.was-validated .form-select:invalid) {
  border-color: var(--buf-invalid);
}

.modal-body :deep(.form-select.is-invalid:not([multiple]):not([size])),
.modal-body :deep(.form-select.is-invalid:not([multiple])[size="1"]) {
  padding-right: 132px;
  background-image: var(--buf-select-chevron), var(--buf-select-icon, none);
  background-position: right 24px center, center right 72px;
  background-size: 14px 10px, calc(.75em + .5rem) calc(.75em + .5rem);
}
`;

const SHOOT_FROM = ":class=\"selectClass('unidades_participantes_codes')\"";
const SHOOT_TO = ":class=\"fieldClass('unidades_participantes_codes')\"";

function blocks(src) { const p = sfc.parse(src, { filename: 'x.vue' }); return { script: sha((p.descriptor.script ? p.descriptor.script.content : '') + '\n' + (p.descriptor.scriptSetup ? p.descriptor.scriptSetup.content : '')), template: sha(p.descriptor.template ? p.descriptor.template.content : ''), style: sha((p.descriptor.styles || []).filter((s) => s.scoped).map((s) => s.content).join('\n')) }; }

const dsB = fs.readFileSync(DSMODAL, 'utf8');
const shB = fs.readFileSync(SHOOTING, 'utf8');
const dsBlocksB = blocks(dsB); const shBlocksB = blocks(shB);
const shootCount = (shB.match(new RegExp(SHOOT_FROM.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

const dsStyleEnd = dsB.lastIndexOf('</style>');
const dsAfter = dsB.slice(0, dsStyleEnd) + APPEND + dsB.slice(dsStyleEnd);
const dsExpected = sha(dsAfter);
const shAfter = shB.split(SHOOT_FROM).join(SHOOT_TO);
const shExpected = sha(shAfter);

if (!fs.existsSync(BASE_JSON)) {
  if (dsStyleEnd < 0) { console.error('DSMODAL_STYLE_NOT_FOUND'); process.exit(4); }
  if (shootCount !== 1) { console.error('SHOOTING_CLASS_OCCURRENCE', shootCount); process.exit(4); }
  fs.writeFileSync(BASE_JSON, JSON.stringify({ generated_at: new Date().toISOString(), kind: 'BEFORE', compiler: sfc.version,
    dsmodal: { source_sha256: sha(dsB), script_sha256: dsBlocksB.script, template_sha256: dsBlocksB.template, style_sha256: dsBlocksB.style, expected_after_source_sha256: dsExpected },
    shooting: { source_sha256: sha(shB), script_sha256: shBlocksB.script, style_sha256: shBlocksB.style, expected_after_source_sha256: shExpected, selected_occurrences: shootCount },
    note: 'hashes/metadata only; no source content' }, null, 2) + '\n');
}
const base = JSON.parse(fs.readFileSync(BASE_JSON, 'utf8'));

/* apply */
if (sha(dsB) === base.dsmodal.source_sha256) fs.writeFileSync(DSMODAL, dsAfter);
if (sha(fs.readFileSync(SHOOTING, 'utf8')) === base.shooting.source_sha256) fs.writeFileSync(SHOOTING, shAfter);

/* verify */
const dsA = fs.readFileSync(DSMODAL, 'utf8'); const shA = fs.readFileSync(SHOOTING, 'utf8');
const dsBlocksA = blocks(dsA); const shBlocksA = blocks(shA);
const dsOldStyle = sha(((sfc.parse(dsA, { filename: 'x.vue' }).descriptor.styles || []).filter((s) => s.scoped).map((s) => s.content).join('\n')).replace(APPEND, ''));
const styleErrsD = []; let cssD = '';
for (const s of (sfc.parse(dsA, { filename: 'x.vue' }).descriptor.styles || []).filter((s) => s.scoped)) { const r = sfc.compileStyle({ source: s.content, filename: DSMODAL, id: 'data-v-mcl', scoped: true }); styleErrsD.push(...r.errors.map((e) => String(e.message || e))); cssD += r.code + '\n'; }
fs.writeFileSync(path.join(TMP, 'modal-control-layer-oct09-compiled.css'), cssD + '\n');
/* shooting compile */
const shParsed = sfc.parse(shA, { filename: SHOOTING });
const shTmplErrs = shParsed.descriptor.template ? (sfc.compileTemplate({ source: shParsed.descriptor.template.content, filename: SHOOTING, id: 'data-v-mcl' }).errors || []).map((e) => String(e.message || e)) : [];
const shStyleErrs = []; for (const s of (shParsed.descriptor.styles || []).filter((s) => s.scoped)) shStyleErrs.push(...sfc.compileStyle({ source: s.content, filename: SHOOTING, id: 'data-v-mcl', scoped: true }).errors.map((e) => String(e.message || e)));

const defects = [];
if (sha(dsA) !== dsExpected) defects.push({ reason: 'DSMODAL_NOT_EXPECTED_AFTER' });
if (dsBlocksA.script !== base.dsmodal.script_sha256) defects.push({ reason: 'DSMODAL_SCRIPT_CHANGED' });
if (dsBlocksA.template !== base.dsmodal.template_sha256) defects.push({ reason: 'DSMODAL_TEMPLATE_CHANGED' });
if (dsOldStyle !== base.dsmodal.style_sha256) defects.push({ reason: 'DSMODAL_OLD_STYLE_NOT_INTACT' });
if (sha(shA) !== shExpected) defects.push({ reason: 'SHOOTING_NOT_EXPECTED_AFTER' });
if (shBlocksA.script !== base.shooting.script_sha256) defects.push({ reason: 'SHOOTING_SCRIPT_CHANGED' });
if (shBlocksA.style !== base.shooting.style_sha256) defects.push({ reason: 'SHOOTING_STYLE_CHANGED' });
if (/selectClass\('unidades_participantes_codes'\)/.test(shA)) defects.push({ reason: 'SHOOTING_SELECTCLASS_REMAINS' });
if (styleErrsD.length || shTmplErrs.length || shStyleErrs.length) defects.push({ reason: 'COMPILE_ERROR', styleErrsD, shTmplErrs, shStyleErrs });

const check = { generated_at: new Date().toISOString(), compiler: sfc.version,
  dsmodal: { before: base.dsmodal.source_sha256, expected_after: dsExpected, current: sha(dsA), script_unchanged: dsBlocksA.script === base.dsmodal.script_sha256, template_unchanged: dsBlocksA.template === base.dsmodal.template_sha256, old_style_intact: dsOldStyle === base.dsmodal.style_sha256, style_errors: styleErrsD },
  shooting: { before: base.shooting.source_sha256, expected_after: shExpected, current: sha(shA), script_unchanged: shBlocksA.script === base.shooting.script_sha256, style_unchanged: shBlocksA.style === base.shooting.style_sha256, template_errors: shTmplErrs, style_errors: shStyleErrs },
  defects, ok: defects.length === 0 };
fs.writeFileSync(CHECK_JSON, JSON.stringify(check, null, 2) + '\n');
console.log(JSON.stringify({ ok: check.ok, dsmodal: check.dsmodal, shooting: check.shooting, defects }));
