#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const manifestPath = path.join(root, 'modules', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];
const notes = [];

const fail = message => failures.push(message);
const note = message => notes.push(message);

const records = [manifest.runtime, ...manifest.modules];
for (const record of records) {
  const filePath = path.join(root, record.path);
  if (!fs.existsSync(filePath)) {
    fail(`Missing module file: ${record.path}`);
    continue;
  }
  const source = fs.readFileSync(filePath, 'utf8');
  try { new vm.Script(source, { filename: record.path }); }
  catch (error) { fail(`Syntax error in ${record.path}: ${error.message}`); }

  if (/\beval\s*\(|new\s+Function\s*\(/.test(source)) fail(`${record.path} uses dynamic code execution.`);
  if (/addEventListener\s*\(\s*['"](?:keydown|keypress)['"]/.test(source) && /reconstruction/i.test(record.id)) {
    fail(`${record.path} installs a keyboard listener in reconstruction code.`);
  }
  if (/\b(fetch|XMLHttpRequest)\s*\(/.test(source) && !/updateURL|downloadURL/.test(source)) {
    note(`${record.path} contains a network primitive; review before release.`);
  }
  if (/\.click\s*\(\s*\)/.test(source) && /(?:incident-save-button|postIncident|finishIncident|triggerTransfer)/.test(source)) {
    fail(`${record.path} appears capable of clicking a Save/Post/Finish/Transfer path.`);
  }
}

const moduleIds = new Set(manifest.modules.map(m => m.id));
for (const mod of manifest.modules) {
  for (const dep of mod.dependsOn || []) {
    if (dep !== manifest.runtime.id && !moduleIds.has(dep)) fail(`${mod.id} depends on missing module ${dep}.`);
  }
}

for (const id of manifest.loadOrder || []) {
  if (id !== manifest.runtime.id && !moduleIds.has(id)) fail(`loadOrder contains unknown module ${id}.`);
}

const reconstruction = fs.readFileSync(path.join(root, 'modules', 'a15-reconstruction.user.js'), 'utf8');
if (!/MutationObserver/.test(reconstruction)) fail('Reconstruction mapper has no structural observer.');
if (/characterData\s*:\s*true/.test(reconstruction)) fail('Reconstruction mapper observes characterData.');
if (/attributes\s*:\s*true/.test(reconstruction)) fail('Reconstruction mapper observes all attributes; this is noisier than intended.');

const clinical = fs.readFileSync(path.join(root, 'modules', 'a15-clinical-logic.user.js'), 'utf8');
for (const required of ['Intraosseous (IO)', 'Intravenous (IV)', 'Milliliters (ml)', 'prepareSalineFlush']) {
  if (!clinical.includes(required)) fail(`Clinical logic missing expected IV/IO/flush marker: ${required}`);
}

const protectedFields = fs.readFileSync(path.join(root, 'modules', 'a15-protected-fields.user.js'), 'utf8');
if (!protectedFields.includes('14775b1d-c505-5161-b7c9-7c9ea3c56cc4')) fail('Procedure equipment-size quarantine field is missing.');
if (!/numeric field/.test(protectedFields)) fail('Procedure equipment-size quarantine does not document numeric semantics.');

const ai = fs.readFileSync(path.join(root, 'modules', 'a15-ai-bridge.user.js'), 'utf8');
if (!ai.includes('clickAiGenerateValues')) fail('Native AI Generate Values handler is not mapped.');
if (!ai.includes('AI Capture')) fail('Native AI Capture surface is not mapped.');

const ui = fs.readFileSync(path.join(root, 'modules', 'a15-control-center.user.js'), 'utf8');
if (!ui.includes('Adaptive reconstruction')) fail('Control center is missing reconstruction disclosure/settings.');
if (!ui.includes('Go to field')) fail('Control center is missing clickable finding navigation.');

console.log(`A15 static regression: ${records.length} files checked.`);
for (const n of notes) console.log(`NOTE: ${n}`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  process.exitCode = 1;
} else {
  console.log('PASS: static module contract checks passed.');
}
