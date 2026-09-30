/* The local test site: this checkout's pages and Worker with a local database, for signed-in
 * Cloud Vault checks. It never touches production: Wrangler always runs with --local and
 * wrangler.local.jsonc, whose database matches no real one, and the pages are built into
 * .next-export-local, never .next-export, which is what deploys upload.
 *
 *   node scripts/local-stack.cjs build
 *     Static export of this checkout with the Clerk development key from .env.local.
 *   node scripts/local-stack.cjs start [--port 8787] [--state A:/Cache/silt-local-stack/clerk]
 *     Applies the migrations to the local database, then serves http://localhost:<port>,
 *     signed in through the Clerk development instance (.env.local's pk_test_/sk_test_ keys).
 *     Sign up there with an address like you+clerk_test@example.com; the code is 424242.
 *   node scripts/local-stack.cjs sql "<SQL>" [--state …]
 *     Runs SQL on that local database, e.g. to damage a save's hash on purpose.
 *
 * scripts/test-vault.cjs uses the same pieces with tokens it signs itself instead of Clerk.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const repo = path.join(__dirname, '..');
const CONFIG = path.join(repo, 'wrangler.local.jsonc');
const EXPORT_DIR = '.next-export-local';
const DEFAULT_STATE = 'A:/Cache/silt-local-stack/clerk';
const WRANGLER = path.join(repo, 'node_modules/wrangler/bin/wrangler.js');
const NEXT = path.join(repo, 'node_modules/next/dist/bin/next');
const quiet = { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false', NEXT_TELEMETRY_DISABLED: '1' };

function readEnvFile(file) {
  const values = {};
  if (!fs.existsSync(file)) return values;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

// The Clerk development instance only: live keys would sign real accounts into a local database.
function developmentKeys(file = path.join(repo, '.env.local'), { secret = true } = {}) {
  const env = readEnvFile(file);
  if (!/^pk_test_[A-Za-z0-9_-]+$/.test(env.CLERK_PUBLISHABLE_KEY || '')) throw Error(`${path.basename(file)} needs CLERK_PUBLISHABLE_KEY from the Clerk development instance (pk_test_…).`);
  if (secret && !/^sk_test_[A-Za-z0-9_-]+$/.test(env.CLERK_SECRET_KEY || '')) throw Error(`${path.basename(file)} needs CLERK_SECRET_KEY from the Clerk development instance (sk_test_…).`);
  return env;
}

function build(publishableKey = developmentKeys(undefined, { secret: false }).CLERK_PUBLISHABLE_KEY, exportDir = EXPORT_DIR) {
  if (!/^pk_test_/.test(publishableKey)) throw Error('The local site is built with a development (pk_test_) key only.');
  // An explicit environment wins over .env.production.local, should one be present mid-deploy.
  const env = { ...quiet, SILT_STATIC_EXPORT: '1', SILT_EXPORT_DIR: exportDir, CLERK_PUBLISHABLE_KEY: publishableKey };
  const result = spawnSync(process.execPath, [NEXT, 'build'], { cwd: repo, stdio: 'inherit', env });
  if (result.status !== 0) throw Error('The local build failed.');
}

// The key a build carries, from the meta tag every page has.
function builtKey(exportDir = EXPORT_DIR) {
  const index = path.join(repo, exportDir, 'index.html');
  if (!fs.existsSync(index)) return null;
  return fs.readFileSync(index, 'utf8').match(/<meta name="clerk-publishable-key" content="([^"]*)"/)?.[1] ?? '';
}

function wrangler(args) {
  const result = spawnSync(process.execPath, [WRANGLER, ...args], { cwd: repo, encoding: 'utf8', env: quiet, windowsHide: true });
  if (result.status !== 0) throw Error(`wrangler ${args.slice(0, 3).join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
const local = (state) => ['--local', '--config', CONFIG, '--persist-to', state];

function migrate(state) { wrangler(['d1', 'migrations', 'apply', 'DB', ...local(state)]); }

function sql(state, command) {
  const out = wrangler(['d1', 'execute', 'DB', ...local(state), '--json', '--command', command]);
  return JSON.parse(out.slice(out.indexOf('[')));
}

// assetsDir serves another build than wrangler.local.jsonc's (the automated suite has its own, so it
// can rebuild while this site runs: Windows will not replace a folder Wrangler is serving).
function start({ port = 8787, state = DEFAULT_STATE, envFiles = [], assetsDir, stdio = 'inherit' } = {}) {
  const origin = `http://localhost:${port}`;
  fs.mkdirSync(state, { recursive: true });
  migrate(state);
  const args = ['dev', ...local(state), '--ip', '127.0.0.1', '--port', String(port), '--var', `APP_ORIGIN:${origin}`,
    '--show-interactive-dev-session=false', '--live-reload=false', '--log-level', 'warn'];
  if (assetsDir) args.push('--assets', assetsDir);
  for (const file of envFiles) args.push('--env-file', file);
  const child = spawn(process.execPath, [WRANGLER, ...args], { cwd: repo, stdio, env: quiet, windowsHide: true });
  return { child, origin, api: `http://127.0.0.1:${port}` };
}

async function ready(url, timeout = 90000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { if ((await fetch(url)).status < 500) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw Error(`The local site did not answer at ${url}.`);
}

module.exports = { build, builtKey, developmentKeys, readEnvFile, migrate, sql, start, ready, CONFIG, EXPORT_DIR, repo };

if (require.main === module) {
  const [command, ...rest] = process.argv.slice(2);
  const option = (name, fallback) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : fallback);
  const state = option('--state', DEFAULT_STATE);
  try {
    if (command === 'build') build();
    else if (command === 'sql') console.log(JSON.stringify(sql(state, rest[0]), null, 2));
    else if (command === 'start') {
      const keys = developmentKeys();
      const key = builtKey();
      if (key !== keys.CLERK_PUBLISHABLE_KEY) throw Error(key === null ? 'No local build yet: run `node scripts/local-stack.cjs build` first.' : 'The local build carries a different Clerk key: run `node scripts/local-stack.cjs build` again.');
      const { child, origin } = start({ port: Number(option('--port', 8787)), state, envFiles: [path.join(repo, '.env.local')] });
      console.log(`Local site: ${origin}, signed in through the Clerk development instance; database in ${state}.`);
      const stop = () => child.kill();
      process.on('SIGINT', stop); process.on('SIGTERM', stop);
      child.on('exit', (code) => process.exit(code ?? 0));
    } else {
      console.log('Usage: node scripts/local-stack.cjs build | start [--port 8787] [--state <dir>] | sql "<SQL>" [--state <dir>]');
      process.exitCode = command ? 1 : 0;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
