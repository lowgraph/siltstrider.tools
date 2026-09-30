const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../lib/account-settings.mjs');

test('least real time is a stored objective and shared/current choices keep precedence', async () => {
  const { validateAccountSettings, resolveAccountTravelOptions } = await load();
  const settings=validateAccountSettings({version:1,toolDefaults:{travel:{objective:'real'}}});
  assert.equal(resolveAccountTravelOptions({settings}).objective,'real');
  assert.equal(resolveAccountTravelOptions({settings,linkOverrides:{objective:'time'}}).objective,'time');
  assert.equal(resolveAccountTravelOptions({settings,linkOverrides:{objective:'time'},sessionOverrides:{objective:'real'}}).objective,'real');
});

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

test('approved settings use existing theme IDs, opt-in gear policies and standard Challenge defaults', async () => {
  const { defaultAccountSettings, validateAccountSettings, resolveAccountToolDefaults } = await load();
  const { DEFAULT_THEME, THEMES } = await import('../lib/theme.mjs');
  const defaults = defaultAccountSettings();
  assert.equal(defaults.theme, DEFAULT_THEME);
  assert.deepEqual(defaults.versionUpdates, { policy: 'pinned', notify: true });
  assert.equal(defaults.defaultScope, 'global');
  for (const theme of Object.keys(THEMES)) assert.equal(validateAccountSettings({ version: 1, theme }).theme, theme);
  const tools = resolveAccountToolDefaults(defaults);
  assert.equal(tools.travel.objective, 'hops');
  assert.ok(Object.values(tools.gear).every(value => value === false));
  assert.deepEqual(tools.challenge, { preset: 'standard', restrictionCount: '3', objectiveCount: '2',
    allowedBands: { Easy: true, Medium: true, Hard: false, Grind: false } });
  tools.challenge.allowedBands.Easy = false;
  assert.equal(resolveAccountToolDefaults(defaults).challenge.allowedBands.Easy, true);
});

test('approved settings reject unsupported themes, auto-upgrades, malformed scopes and invalid tool values', async () => {
  const { validateAccountSettings } = await load();
  for (const patch of [{ theme: 'modern' }, { theme: null }, { versionUpdates: null },
    { versionUpdates: { policy: 'latest' } }, { versionUpdates: { notify: 'true' } },
    { defaultScope: 'character' }, { datasetOverrides: {} }, { datasetOverrides: [null] },
    { datasetOverrides: [{ toolDefaults: {} }] },
    { toolDefaults: { travel: { objective: 'fastest' } } },
    { toolDefaults: { gear: { theft: 'false' } } }, { toolDefaults: { gear: { imaginary: true } } },
    { toolDefaults: { challenge: { preset: 'unknown' } } },
    { toolDefaults: { challenge: { objectiveCount: '0' } } },
    { toolDefaults: { challenge: { restrictionCount: 3 } } },
    { toolDefaults: { challenge: { objectiveCount: '6' } } },
    { toolDefaults: { challenge: { allowedBands: { Hard: 1 } } } },
    { toolDefaults: { challenge: { allowedBands: { unknown: true } } } }]) {
    assert.throws(() => validateAccountSettings({ version: 1, ...patch }));
  }
});

test('Challenge presets supply coherent counts/bands, custom dials stay explicit and random counts round-trip', async () => {
  const { resolveAccountToolDefaults, validateAccountSettings } = await load();
  const settings = { version: 1, toolDefaults: { challenge: { preset: 'hardcore' } } };
  assert.deepEqual(resolveAccountToolDefaults(settings).challenge, {
    preset: 'hardcore', restrictionCount: '4', objectiveCount: '3',
    allowedBands: { Easy: false, Medium: true, Hard: true, Grind: false }
  });
  assert.equal(resolveAccountToolDefaults({ ...settings, toolDefaults: { challenge: { preset: 'hardcore', objectiveCount: '1' } } }).challenge.preset, 'custom');
  const custom = { version: 1, toolDefaults: { challenge: { restrictionCount: 'random',
    objectiveCount: 'random', allowedBands: { Grind: true } } } };
  assert.equal(validateAccountSettings(custom).toolDefaults.challenge.restrictionCount, 'random');
  assert.equal(resolveAccountToolDefaults(custom).challenge.allowedBands.Grind, true);
  assert.equal(resolveAccountToolDefaults(custom).challenge.preset, 'custom');
});

test('dataset overrides inherit globals, honor explicit false and apply exact releases after pack-wide defaults', async () => {
  const { resolveAccountToolDefaults, resolveAccountTravelOptions } = await load();
  const settings = { version: 1, world: 'tr', modpackId: 'pack-a', modVersionId: 'release-2',
    defaultScope: 'dataset', toolDefaults: { travel: { objective: 'hops', mageGuild: true },
      gear: { theft: true }, challenge: { allowedBands: { Hard: true } } },
    datasetOverrides: [
      { world: 'tr', modpackId: 'pack-a', modVersionId: 'release-2',
        toolDefaults: { travel: { objective: 'time', mageGuild: false }, challenge: { allowedBands: { Grind: true } } } },
      { world: 'tr', modpackId: 'pack-a', toolDefaults: { travel: { objective: 'gold' }, gear: { theft: false } } },
      { world: 'tr', modpackId: 'pack-b', toolDefaults: { travel: { walking: false } } }
    ] };
  const tools = resolveAccountToolDefaults(settings);
  assert.equal(tools.travel.objective, 'time');
  assert.equal(tools.travel.mageGuild, false);
  assert.equal(tools.travel.walking, true);
  assert.equal(tools.gear.theft, false);
  assert.equal(tools.challenge.allowedBands.Hard, true);
  assert.equal(tools.challenge.allowedBands.Grind, true);
  assert.equal(tools.challenge.allowedBands.Easy, true);
  assert.equal(resolveAccountToolDefaults(settings, { world: 'tr', modpackId: 'pack-a', modVersionId: 'release-1' }).travel.objective, 'gold');
  assert.equal(resolveAccountToolDefaults(settings, { world: 'vanilla' }).travel.objective, 'hops');
  assert.equal(resolveAccountToolDefaults({ ...settings, defaultScope: 'global' }).gear.theft, true);
  assert.equal(resolveAccountTravelOptions({ settings }).objective, 'time');
  assert.equal(resolveAccountTravelOptions({ settings, linkOverrides: { objective: 'gold' }, sessionOverrides: { objective: 'hops' } }).objective, 'hops');
  const fromSave = resolveAccountTravelOptions({ settings, saveDefaults: { mageGuild: true } });
  assert.equal(fromSave.mageGuild, true, 'save toggle wins unless overwrite is enabled');
  assert.equal(fromSave.objective, 'time', 'route objective remains an account default');
});

test('duplicate, prototype and excessive dataset entries cannot bypass scope validation', async () => {
  const { validateAccountSettings, resolveAccountToolDefaults } = await load();
  const entry = { world: 'tr', modpackId: 'pack-a', toolDefaults: { gear: { theft: false } } };
  assert.throws(() => validateAccountSettings({ version: 1, datasetOverrides: [entry, { ...entry, modVersionId: null }] }));
  assert.throws(() => validateAccountSettings({ version: 1, datasetOverrides: Array.from({ length: 25 }, (_, i) => ({ ...entry, modpackId: `pack-${i}` })) }));
  assert.throws(() => validateAccountSettings({ version: 1, datasetOverrides: [{ ...entry, toolDefaults: JSON.parse('{"__proto__":{}}') }] }));
  assert.throws(() => validateAccountSettings({ version: 1, datasetOverrides: [{ ...entry, modVersionId: 'latest' }] }));
  assert.throws(() => resolveAccountToolDefaults({ version: 1 }, { world: null }));
});

test('reset one tool clears its global and dataset defaults while preserving other settings and inputs', async () => {
  const { resetAccountSettings, resetAccountToolSettings, defaultAccountSettings } = await load();
  const settings = { version: 1, world: 'tr', theme: 'morrowind', defaultScope: 'dataset',
    versionUpdates: { notify: false }, toolDefaults: { travel: { objective: 'gold' }, gear: { theft: true } },
    datasetOverrides: [
      { world: 'tr', toolDefaults: { travel: { mageGuild: false }, gear: { theft: false } } },
      { world: 'vanilla', toolDefaults: { travel: { walking: false } } }
    ] };
  const before = JSON.stringify(settings);
  const reset = resetAccountToolSettings(settings, 'travel');
  assert.deepEqual(reset.toolDefaults.travel, {});
  assert.deepEqual(reset.datasetOverrides[0].toolDefaults.travel, {});
  assert.equal(reset.datasetOverrides.length, 1);
  assert.equal(reset.toolDefaults.gear.theft, true);
  assert.equal(reset.datasetOverrides[0].toolDefaults.gear.theft, false);
  assert.equal(reset.theme, 'morrowind');
  assert.equal(reset.world, 'tr');
  assert.equal(reset.versionUpdates.notify, false);
  assert.equal(JSON.stringify(settings), before);
  assert.throws(() => resetAccountToolSettings(settings, 'unknown'));
  assert.deepEqual(resetAccountSettings(), defaultAccountSettings());
});

test('Travel objective precedence is independent of the overwrite-save switch', async () => {
  const { resolveAccountTravelOptions } = await load();
  const settings = { version: 1, toolDefaults: { travel: { objective: 'gold' } } };
  for (const overrideSaveToggles of [true, false]) {
    const input = { settings: { ...settings, overrideSaveToggles }, saveDefaults: { mageGuild: false } };
    assert.equal(resolveAccountTravelOptions(input).objective, 'gold');
    assert.equal(resolveAccountTravelOptions({ ...input, linkOverrides: { objective: 'time' } }).objective, 'time');
    assert.equal(resolveAccountTravelOptions({ ...input, linkOverrides: { objective: 'time' }, sessionOverrides: { objective: 'hops' } }).objective, 'hops');
  }
});

test('scoped preference edits keep explicit false, remove inherited fields and preserve other scopes', async () => {
  const { updateAccountToolSettings, accountToolChoices, validateAccountSettings } = await load();
  const original = validateAccountSettings({ version: 1, defaultScope: 'dataset', toolDefaults: { travel: { mageGuild: true } } });
  const edited = updateAccountToolSettings(original, 'travel', { mageGuild: false, objective: 'gold' }, { world: 'tr' });
  assert.equal(accountToolChoices(edited, { world: 'tr' }).travel.mageGuild, false);
  assert.equal(accountToolChoices(edited, { world: 'vanilla' }).travel.mageGuild, true);
  const inherited = updateAccountToolSettings(edited, 'travel', { mageGuild: undefined }, { world: 'tr' });
  assert.equal(accountToolChoices(inherited, { world: 'tr' }).travel.mageGuild, true);
  assert.equal(inherited.datasetOverrides[0].toolDefaults.travel.objective, 'gold');
  assert.equal(original.datasetOverrides.length, 0);
});
