const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// VAULT-TEST: the local test site (scripts/local-stack.cjs) must never reach production: only
// Clerk development keys, a Wrangler config with no routes, account or real database, and
// builds in folders a deploy never uploads.
const ROOT = path.join(__dirname, '..');
const stack = require('../scripts/local-stack.cjs');
const readJsonc = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const tempFile = (text) => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'silt-stack-')); const file = path.join(dir, '.env.local'); fs.writeFileSync(file, text); return file; };

test('only Clerk development keys: live, missing or malformed keys are refused', () => {
  const ok = tempFile('# local\r\nCLERK_PUBLISHABLE_KEY="pk_test_abc123"\r\nCLERK_SECRET_KEY=sk_test_def456\r\n');
  assert.deepEqual(stack.developmentKeys(ok), { CLERK_PUBLISHABLE_KEY: 'pk_test_abc123', CLERK_SECRET_KEY: 'sk_test_def456' }, 'quotes, comments and CRLF');
  for (const [why, text] of [
    ['a live publishable key', 'CLERK_PUBLISHABLE_KEY=pk_live_abc\nCLERK_SECRET_KEY=sk_test_x'],
    ['a live secret key', 'CLERK_PUBLISHABLE_KEY=pk_test_abc\nCLERK_SECRET_KEY=sk_live_x'],
    ['no secret key', 'CLERK_PUBLISHABLE_KEY=pk_test_abc'],
    ['a key with a space', 'CLERK_PUBLISHABLE_KEY=pk_test_a b\nCLERK_SECRET_KEY=sk_test_x'],
  ]) assert.throws(() => stack.developmentKeys(tempFile(text)), /development instance/, why);
  assert.equal(stack.developmentKeys(tempFile('CLERK_PUBLISHABLE_KEY=pk_test_abc'), { secret: false }).CLERK_PUBLISHABLE_KEY, 'pk_test_abc', 'a build needs no secret');
  assert.throws(() => stack.developmentKeys(path.join(os.tmpdir(), 'no-such-dir', '.env.local')), /development instance/, 'no file at all');
});

test('a build refuses a live key before running anything, and reads back the key it carries', () => {
  assert.throws(() => stack.build('pk_live_abc'), /development \(pk_test_\) key only/);
  const dir = fs.mkdtempSync(path.join(ROOT, '.next-export-vault-unit-'));
  const rel = path.relative(ROOT, dir);
  try {
    assert.equal(stack.builtKey(rel), null, 'no build yet');
    fs.writeFileSync(path.join(dir, 'index.html'), '<html><head><meta name="clerk-publishable-key" content="pk_test_built"/></head></html>');
    assert.equal(stack.builtKey(rel), 'pk_test_built');
    fs.writeFileSync(path.join(dir, 'index.html'), '<html><head><meta name="clerk-publishable-key" content=""/></head></html>');
    assert.equal(stack.builtKey(rel), '', 'a build made without a key');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the local Wrangler config shares nothing with production', () => {
  const prod = readJsonc('wrangler.jsonc');
  const local = readJsonc('wrangler.local.jsonc');
  assert.equal(local.routes, undefined, 'no routes');
  assert.equal(local.account_id, undefined, 'no account');
  assert.equal(local.vars, undefined, 'APP_ORIGIN and the keys come from the script');
  assert.notEqual(local.name, prod.name);
  const [db] = local.d1_databases, [prodDb] = prod.d1_databases;
  assert.equal(db.binding, prodDb.binding, 'the Worker still finds env.DB');
  assert.notEqual(db.database_id, prodDb.database_id);
  assert.notEqual(db.database_name, prodDb.database_name);
  assert.equal(local.main, prod.main, 'the same Worker code');
  assert.deepEqual(local.assets.run_worker_first, prod.assets.run_worker_first);
  assert.equal(local.assets.directory, './.next-export-local');
  assert.notEqual(local.assets.directory, prod.assets.directory, 'never the folder a deploy uploads');
  const ignored = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/);
  for (const dir of ['.next-export/', '.next-export-local/', '.next-export-vault/']) assert.ok(ignored.includes(dir), `${dir} is ignored`);
});

test('the static export goes to SILT_EXPORT_DIR when set, and to .next-export otherwise', async () => {
  const saved = { ...process.env };
  const load = async (tag) => (await import(pathToFileURL(path.join(ROOT, 'next.config.mjs')).href + `?${tag}`)).default;
  try {
    process.env.SILT_STATIC_EXPORT = '1'; delete process.env.SILT_EXPORT_DIR;
    assert.equal((await load('a')).distDir, '.next-export');
    process.env.SILT_EXPORT_DIR = '.next-export-local';
    assert.equal((await load('b')).distDir, '.next-export-local');
    delete process.env.SILT_STATIC_EXPORT;
    assert.equal((await load('c')).distDir, undefined, 'next dev and next build keep their own folder');
  } finally { process.env = saved; }
});
