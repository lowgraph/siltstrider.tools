const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../lib/account-settings.mjs');

test('settings supply fresh sparse defaults and keep contract version separate from mod version', async () => {
  const { defaultAccountSettings, validateAccountSettings } = await load();
  const defaults = defaultAccountSettings();
  assert.deepEqual(validateAccountSettings({ version: 1 }), defaults);
  defaults.toolDefaults.travel.mageGuild = false;
  assert.deepEqual(defaultAccountSettings().toolDefaults.travel, {});
  for (const world of ['vanilla', 'tr', 'tr_arce']) {
    assert.equal(validateAccountSettings({ version: 1, world }).world, world);
  }
  assert.equal(validateAccountSettings({ version: 1, world: 'tr', modVersionId: 'tr-25.12' }).version, 1);
});

test('settings reject malformed shapes, wrong booleans, unknown fields and unsupported versions', async () => {
  const { validateAccountSettings } = await load();
  for (const value of [null, [], {}, { version: null }, { version: '1' }, { version: 2 },
    { version: 1, world: 'other' }, { version: 1, overrideSaveToggles: 'false' },
    { version: 1, toolDefaults: null }, { version: 1, toolDefaults: [] },
    { version: 1, toolDefaults: { travel: null } },
    { version: 1, toolDefaults: { travel: { mageGuild: 1 } } },
    { version: 1, toolDefaults: { travel: { carried: 100 } } },
    { version: 1, toolDefaults: { futureTool: {} } }, { version: 1, futureSetting: true },
    JSON.parse('{"version":1,"__proto__":{"polluted":true}}'),
    Object.assign(Object.create({ world: 'tr' }), { version: 1 })]) {
    assert.throws(() => validateAccountSettings(value));
  }
  assert.equal({}.polluted, undefined);
});

test('modpack and version IDs prepare immutable data selections without accepting paths or latest aliases', async () => {
  const { validateAccountSettings, accountDataSelectionKey } = await load();
  const first = { version: 1, world: 'tr', modpackId: 'pack-one', modVersionId: 'release-1' };
  assert.equal(validateAccountSettings(first).modVersionId, 'release-1');
  assert.notEqual(accountDataSelectionKey(first), accountDataSelectionKey({ ...first, modVersionId: 'release-2' }));
  assert.notEqual(accountDataSelectionKey(first), accountDataSelectionKey({ ...first, modpackId: 'pack-two' }));
  assert.notEqual(accountDataSelectionKey(first), accountDataSelectionKey({ ...first, world: 'tr_arce' }));
  assert.notEqual(accountDataSelectionKey({ version: 1, world: 'tr' }), accountDataSelectionKey(first));
  for (const id of ['', '../pack', 'https://example.com/pack', 'a'.repeat(97), 1, {}, 'bad id']) {
    assert.throws(() => validateAccountSettings({ version: 1, modpackId: id }));
    assert.throws(() => validateAccountSettings({ version: 1, world: 'tr', modVersionId: id }));
  }
  for (const modVersionId of ['latest', 'CURRENT', 'release-1']) {
    assert.throws(() => validateAccountSettings({ version: 1, modVersionId }));
  }
  assert.throws(() => validateAccountSettings({ version: 1, world: 'tr', modVersionId: 'latest' }));
});

test('guest/manual planning applies sparse global toggles including explicit false without mutating inputs', async () => {
  const { resolveAccountTravelOptions } = await load();
  const settings = Object.freeze({ version: 1,
    toolDefaults: Object.freeze({ travel: Object.freeze({ mageGuild: false, walking: false }) }) });
  const defaults = Object.freeze({ mageGuild: true, divine: false, walking: true, held: new Set(['amulet']) });
  const result = resolveAccountTravelOptions({ settings, defaults });
  assert.equal(result.mageGuild, false);
  assert.equal(result.walking, false);
  assert.equal(result.divine, false);
  result.held.add('ring');
  assert.deepEqual([...defaults.held], ['amulet']);
  assert.equal(defaults.mageGuild, true);
});

test('disabled overwrite preserves save defaults and remembered booleans while applying route choices', async () => {
  const { resolveAccountTravelOptions } = await load();
  const result = resolveAccountTravelOptions({
    settings: { version: 1, overrideSaveToggles: false,
      toolDefaults: { travel: { mageGuild: true, divine: true, walking: false } } },
    defaults: { mageGuild: true, divine: true, walking: true },
    saveDefaults: { mageGuild: false, divine: true }, saveOverrides: { divine: false }
  });
  assert.equal(result.mageGuild, false);
  assert.equal(result.divine, false);
  assert.equal(result.walking, false);
});

test('enabled overwrite replaces only selected booleans, and switching off restores per-save edits', async () => {
  const { resolveAccountTravelOptions } = await load();
  const settings = { version: 1, overrideSaveToggles: true,
    toolDefaults: { travel: { mageGuild: true, divine: false } } };
  const saveDefaults = Object.freeze({ mageGuild: false, divine: true, conjurer: true,
    carried: 91, levitate: 30, held: new Set(['amulet']), magicka: 10 });
  const saveOverrides = Object.freeze({ mageGuild: false, carried: 80, held: Object.freeze({ ring: true }) });
  const input = { settings, saveDefaults, saveOverrides };
  const result = resolveAccountTravelOptions(input);
  assert.equal(result.mageGuild, true);
  assert.equal(result.divine, false);
  assert.equal(result.conjurer, true, 'unset global inherits');
  assert.equal(result.carried, 80);
  assert.equal(result.levitate, 30);
  assert.equal(result.magicka, 10);
  assert.deepEqual([...result.held], ['amulet', 'ring']);
  const restored = resolveAccountTravelOptions({ ...input, settings: { ...settings, overrideSaveToggles: false } });
  assert.equal(restored.mageGuild, false);
  assert.equal(restored.divine, true);
  assert.deepEqual([...saveDefaults.held], ['amulet']);
  assert.equal(saveOverrides.mageGuild, false);
});

test('explicit links and current edits beat global defaults without masking later unspecified save data', async () => {
  const { resolveAccountTravelOptions } = await load();
  const input = {
    settings: { version: 1, overrideSaveToggles: true, toolDefaults: { travel: { mageGuild: true, walking: true } } },
    saveDefaults: { mageGuild: false, divine: false, carried: 25 },
    linkOverrides: { mageGuild: false, walking: false }, sessionOverrides: { walking: true }
  };
  const first = resolveAccountTravelOptions(input);
  assert.equal(first.mageGuild, false);
  assert.equal(first.walking, true);
  const later = resolveAccountTravelOptions({ ...input, saveDefaults: { ...input.saveDefaults, divine: true, carried: 51 } });
  assert.equal(later.divine, true);
  assert.equal(later.carried, 51);
  assert.equal(later.mageGuild, false);
});
