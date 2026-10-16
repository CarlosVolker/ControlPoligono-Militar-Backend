/* modal-control-layer-correction-check-2026-10-09.cjs (baseline | apply | verify)
 * Replaces the seam block in DsModal.vue (from its comment to </style>) with the corrected
 * literal block: .ds-modal .modal-body :deep(...) prefix (specificity beats the view marker 0,3,0),
 * full invalid states restored (padding/icon/ring, textarea top-right, select 2-layer 132px/icon),
 * explicit source chevron, and select min-height:initial (source declares none).
 * Shooting/Armory READ-ONLY. One run from the repo root; exit preserved.
 */
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const REPO = process.cwd();
const FRONT = path.join(REPO, 'front');
const TMP = '/tmp/opencode';
const DOCDIR = path.join(REPO, 'docs/specs/final-frontend');
const DSMODAL = path.join(FRONT, 'src/components/shared/DsModal.vue');
const SHOOTING = path.join(FRONT, 'src/views/shooting/ShootingView.vue');
const BASE_JSON = path.join(DOCDIR, 'modal-control-layer-correction-baseline-2026-10-09.json');
const CHECK_JSON = path.join(DOCDIR, 'modal-control-layer-correction-check-2026-10-09.json');
const MARK = '/* DS field seam for the Teleported modal body';
const BEFORE_SHA = '384135717650b2a4be5d2ecdf4ee83f08e49b0023fc8877b4c7166e2e1594409';
const SHOOTING_SHA = 'c6588244f7521caefccac52fbd8ad163fe58890e9dda82b84ea0dec0971b425f';
function req(p) { try { return require(p); } catch (e) { return null; } }
const sfc = req(path.join(FRONT, 'node_modules/@vue/compiler-sfc')) || req(path.join(FRONT, 'node_modules/.pnpm/@vue+compiler-sfc@3.5.43/node_modules/@vue/compiler-sfc'));
if (!sfc) { console.error('COMPILER_NOT_FOUND'); process.exit(2); }
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const CHEVRON = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2336404a' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")";
const ICON_INVALID = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23d75341'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23d75341' stroke='none'/%3e%3c/svg%3e\")";

const NEWBLOCK = `/* DS field seam for the Teleported modal body (no .page-content ancestor). Corrected: the
   .ds-modal .modal-body :deep(...) prefix outranks the view-local marker (0,3,0), the invalid states
   are restored in full and the normal layer cannot drop them. Source: baseui-forms.css:53-102
   (label/control + states), :159-190 (select + states), :405-455 (invalid). */
.ds-modal .modal-body :deep(.form-label) {
  display: inline-block;
  margin-bottom: 8px;
  font-weight: 500;
}

.ds-modal .modal-body :deep(.form-control) {
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

.ds-modal .modal-body :deep(.form-control:focus-visible) {
  color: var(--bui-text);
  background-color: var(--bui-surface);
  border-color: var(--buf-input-focus);
  outline: 0;
  box-shadow: none;
}

.ds-modal .modal-body :deep(.form-control::placeholder) {
  color: var(--buf-placeholder);
  opacity: 1;
}

.ds-modal .modal-body :deep(.form-control[readonly]:not(:disabled)) {
  background-color: var(--bui-surface);
  opacity: 1;
}

.ds-modal .modal-body :deep(.form-control:disabled) {
  background-color: var(--bui-bg);
  opacity: 1;
}

/* invalid (baseui-forms.css:405-426): padding/right icon + focus ring; textarea top-right */
.ds-modal .modal-body :deep(.form-control.is-invalid),
.ds-modal .modal-body :deep(.was-validated .form-control:invalid) {
  border-color: var(--buf-invalid);
  padding-right: calc(1.5em + 1rem);
  background-image: ${ICON_INVALID};
  background-repeat: no-repeat;
  background-position: right calc(.375em + .25rem) center;
  background-size: calc(.75em + .5rem) calc(.75em + .5rem);
}

.ds-modal .modal-body :deep(.form-control.is-invalid:focus),
.ds-modal .modal-body :deep(.was-validated .form-control:invalid:focus) {
  border-color: var(--buf-invalid);
  box-shadow: 0 0 0 .15rem rgba(215, 83, 65, .25);
}

.ds-modal .modal-body :deep(textarea.form-control.is-invalid),
.ds-modal .modal-body :deep(.was-validated textarea.form-control:invalid) {
  padding-right: calc(1.5em + 1rem);
  background-position: top calc(.375em + .25rem) right calc(.375em + .25rem);
}

/* select (baseui-forms.css:159-190): source declares NO min-height -> restore initial;
   the source chevron is declared explicitly to avoid depending on the global rule. */
.ds-modal .modal-body :deep(.form-select) {
  --buf-select-chevron: ${CHEVRON};
  display: block;
  width: 100%;
  min-height: initial;
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

.ds-modal .modal-body :deep(.form-select:focus) {
  border-color: var(--buf-input-focus);
  outline: 0;
  box-shadow: none;
}

.ds-modal .modal-body :deep(.form-select[multiple]),
.ds-modal .modal-body :deep(.form-select[size]:not([size="1"])) {
  padding-right: 24px;
  background-image: none;
}

.ds-modal .modal-body :deep(.form-select:disabled) {
  background-color: var(--bui-bg);
}

/* select invalid (baseui-forms.css:437-455): two layers (chevron + status icon), 132px + ring */
.ds-modal .modal-body :deep(.form-select.is-invalid),
.ds-modal .modal-body :deep(.was-validated .form-select:invalid) {
  border-color: var(--buf-invalid);
}

.ds-modal .modal-body :deep(.form-select.is-invalid:not([multiple]):not([size])),
.ds-modal .modal-body :deep(.form-select.is-invalid:not([multiple])[size="1"]) {
  --buf-select-icon: ${ICON_INVALID};
  padding-right: 132px;
  background-image: var(--buf-select-chevron), var(--buf-select-icon, none);
  background-position: right 24px center, center right 72px;
  background-size: 14px 10px, calc(.75em + .5rem) calc(.75em + .5rem);
}

.ds-modal .modal-body :deep(.form-select.is-invalid:focus),
.ds-modal .modal-body :deep(.was-validated .form-select:invalid:focus) {
  border-color: var(--buf-invalid);
  box-shadow: 0 0 0 .15rem rgba(215, 83, 65, .25);
}
`;

function blocks(src) { const p = sfc.parse(src, { filename: 'x.vue' }); return { script: sha((p.descriptor.script ? p.descriptor.script.content : '') + '\n' + (p.descriptor.scriptSetup ? p.descriptor.scriptSetup.content : '')), template: sha(p.descriptor.template ? p.descriptor.template.content : ''), style: (p.descriptor.styles || []).filter((s) => s.scoped).map((s) => s.content).join('\n') }; }

const dsB = fs.readFileSync(DSMODAL, 'utf8');
const bB = blocks(dsB);
const start = dsB.indexOf(MARK);
const end = dsB.lastIndexOf('</style>');
if (start < 0 || end < 0) { console.error('MARK_OR_STYLE_NOT_FOUND'); process.exit(4); }
const oldBlock = dsB.slice(start, end);
const dsAfter = dsB.slice(0, start) + NEWBLOCK + dsB.slice(end);
const dsExpected = sha(dsAfter);
const bBefore = sha(bB.style);
const shootB = fs.readFileSync(SHOOTING, 'utf8');

if (!fs.existsSync(BASE_JSON)) {
  fs.writeFileSync(BASE_JSON, JSON.stringify({ generated_at: new Date().toISOString(), kind: 'BEFORE', phase: 'seam correction (pre-replace)', compiler: sfc.version,
    dsmodal: { source_sha256: sha(dsB), script_sha256: bB.script, template_sha256: bB.template, style_sha256: bBefore, old_block_sha256: sha(oldBlock),
      expected_after_source_sha256: dsExpected,
      replaced_span: { start_index: start, end_index: end, old_block_lines: oldBlock.split('\n').length } },
    shooting_readonly_sha256: sha(shootB), shooting_expected_readonly: SHOOTING_SHA,
    note: 'hashes/metadata only; no source content' }, null, 2) + '\n');
}
const base = JSON.parse(fs.readFileSync(BASE_JSON, 'utf8'));
if (base.dsmodal.source_sha256 !== BEFORE_SHA) { console.error('BASELINE_NOT_CURRENT', base.dsmodal.source_sha256, '!=', BEFORE_SHA); process.exit(4); }
const expectedFinal = base.dsmodal.expected_after_source_sha256;

/* apply (idempotent: only if current == before) */
if (sha(dsB) === base.dsmodal.source_sha256) fs.writeFileSync(DSMODAL, dsAfter);

/* verify */
const dsA = fs.readFileSync(DSMODAL, 'utf8');
const bA = blocks(dsA);
const insertedBlockExact = dsA.slice(start, start + NEWBLOCK.length) === NEWBLOCK;
const shootA = fs.readFileSync(SHOOTING, 'utf8');
const styleErrs = []; let css = '';
for (const s of (sfc.parse(dsA, { filename: 'x.vue' }).descriptor.styles || []).filter((s) => s.scoped)) { const r = sfc.compileStyle({ source: s.content, filename: DSMODAL, id: 'data-v-mcc', scoped: true }); styleErrs.push(...r.errors.map((e) => String(e.message || e))); css += r.code + '\n'; }
fs.writeFileSync(path.join(TMP, 'modal-control-layer-correction-oct09-compiled.css'), css + '\n');
const noC = css.replace(/\/\*[\s\S]*?\*\//g, ''); const sels = []; const re = /([^{}]+)\{/g; let m; while ((m = re.exec(noC)) !== null) { const s = m[1].trim(); if (s && !s.startsWith('@')) sels.push(s); }
const seamSelectors = sels.filter((s) => /ds-modal .modal-body .*form-(control|select|label)/.test(s));

const defects = [];
if (sha(dsA) !== expectedFinal) defects.push({ reason: 'DSMODAL_NOT_EXPECTED_AFTER' });
if (bA.script !== base.dsmodal.script_sha256) defects.push({ reason: 'DSMODAL_SCRIPT_CHANGED' });
if (bA.template !== base.dsmodal.template_sha256) defects.push({ reason: 'DSMODAL_TEMPLATE_CHANGED' });
if (!insertedBlockExact) defects.push({ reason: 'INSERTED_BLOCK_NOT_EXACT' });
if (bA.style.indexOf(MARK) === -1) defects.push({ reason: 'SEAM_MARK_MISSING' });
if (sha(shootA) !== SHOOTING_SHA) defects.push({ reason: 'SHOOTING_CHANGED_NOT_ALLOWED' });
if (styleErrs.length) defects.push({ reason: 'COMPILE_ERROR', styleErrs });

const propertyMap = {
  "specificity": "seam uses `.ds-modal .modal-body :deep(...)` => `.ds-modal .modal-body[data-v] .form-control` (0,4,0), which beats the view-local `.armory-editor-field .form-select[data-v-view]` (0,3,0); invalid rules are (0,5,0)+ so the normal layer cannot drop them.",
  "form-control.is-invalid": "border-color var(--buf-invalid); padding-right calc(1.5em + 1rem); background-image invalid icon; background-position right calc(.375em + .25rem) center; background-size calc(.75em + .5rem) (baseui-forms.css:405-413)",
  "form-control.is-invalid:focus": "border-color var(--buf-invalid); box-shadow 0 0 0 .15rem rgba(215,83,65,.25) (baseui-forms.css:414-417)",
  "textarea.form-control.is-invalid": "padding-right calc(1.5em + 1rem); background-position top calc(.375em + .25rem) right calc(.375em + .25rem) (baseui-forms.css:418-422)",
  "form-select normal": "min-height:initial (source declares none); --buf-select-chevron set to the source chevron URL explicitly; border-radius var(--bui-radius); border var(--buf-input-border) (baseui-forms.css:159-179)",
  "form-select.is-invalid": "border-color var(--buf-invalid) (baseui-forms.css:437-438)",
  "form-select.is-invalid:not(multiple/size)": "--buf-select-icon = source invalid icon; padding-right 132px; background-image chevron,icon; background-position right 24px center, center right 72px; background-size 14px 10px, calc(...) (baseui-forms.css:439-446)",
  "form-select.is-invalid:focus": "border-color var(--buf-invalid); box-shadow 0 0 0 .15rem rgba(215,83,65,.25) (baseui-forms.css:447-450)"
};

const check = { generated_at: new Date().toISOString(), compiler: sfc.version,
  dsmodal: { before: base.dsmodal.source_sha256, expected_after: expectedFinal, current: sha(dsA), script_unchanged: bA.script === base.dsmodal.script_sha256, template_unchanged: bA.template === base.dsmodal.template_sha256, inserted_block_exact: insertedBlockExact, style_errors: styleErrs },
  shooting_readonly: { expected: SHOOTING_SHA, current: sha(shootA), unchanged: sha(shootA) === SHOOTING_SHA },
  seam_selectors_compiled: seamSelectors, property_map: propertyMap, defects, ok: defects.length === 0 };
fs.writeFileSync(CHECK_JSON, JSON.stringify(check, null, 2) + '\n');
console.log(JSON.stringify({ ok: check.ok, dsmodal: check.dsmodal, shooting_readonly: check.shooting_readonly, seam_selectors: seamSelectors.slice(0, 12), defects }));
