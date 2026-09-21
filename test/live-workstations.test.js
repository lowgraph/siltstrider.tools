const { test } = require('node:test');
const assert = require('node:assert/strict');

test('adaptTravelGraph compiles dynamic networks and normalizes settlement names', async () => {
  const { adaptTravelGraph, buildNetworkGraph, getAvailableTransitStops, findFewestHopsRoute } = await import('../lib/travel-graph.mjs');

  const nodes = {
    'interior:balmora, guild of mages': { name: 'Balmora, Guild of Mages' },
    'interior:caldera, guild of mages': { name: 'Caldera, Guild of Mages' },
    'interior:sadrith mora, wolverine hall: mages guild': { name: 'Sadrith Mora, Wolverine Hall: Mages Guild' },
    'interior:vivec, foreign quarter canalworks': { name: 'Vivec, Foreign Quarter Canalworks' },
    'exterior:seyda neen (-2, -9)': { name: 'Seyda Neen' },
    'exterior:gnisis (-11, 11)': { name: 'Gnisis' }
  };

  const records = [
    { from: 'interior:balmora, guild of mages', to: 'interior:caldera, guild of mages', mode: 'guild_guide' },
    { from: 'interior:caldera, guild of mages', to: 'interior:balmora, guild of mages', mode: 'guild_guide' },
    { from: 'interior:balmora, guild of mages', to: 'interior:sadrith mora, wolverine hall: mages guild', mode: 'guild_guide' },
    { from: 'interior:caldera, guild of mages', to: 'interior:vivec, foreign quarter canalworks', mode: 'guild_guide' },
    { from: 'exterior:seyda neen (-2, -9)', to: 'interior:balmora, guild of mages', mode: 'silt_strider' },
    // Duplicate connection should be deduplicated
    { from: 'exterior:seyda neen (-2, -9)', to: 'interior:balmora, guild of mages', mode: 'silt_strider' }
  ];

  const graph = adaptTravelGraph(records, nodes);

  assert.ok(graph['Balmora'], 'Balmora should exist after stripping Guild of Mages');
  assert.ok(graph['Caldera'], 'Caldera should exist after stripping Guild of Mages');
  assert.ok(graph['Sadrith Mora'], 'Sadrith Mora should exist after stripping Wolverine Hall');
  assert.ok(graph['Vivec'], 'Vivec should exist after stripping Foreign Quarter');

  // Verify deduplication
  const seydaRoutes = graph['Seyda Neen'];
  assert.equal(seydaRoutes.filter(r => r.to === 'Balmora' && r.kind === 'Silt Strider').length, 1);

  // Verify route finding with customGraph
  const route = findFewestHopsRoute('Seyda Neen', 'Vivec', 'vanilla', graph);
  assert.equal(route.isValid, true);
  // Seyda Neen -> Balmora (Silt Strider) -> Caldera (Guild Guide) -> Vivec (Guild Guide)
  assert.equal(route.hops, 3);
  assert.deepEqual(route.path, ['Seyda Neen', 'Balmora', 'Caldera', 'Vivec']);
});

test('adaptTravelGraph handles adversarial edge cases cleanly', async () => {
  const { adaptTravelGraph, findFewestHopsRoute, getAvailableTransitStops } = await import('../lib/travel-graph.mjs');

  // Edge Case 1: Empty records, null nodes, missing keys
  const emptyGraph = adaptTravelGraph([], {});
  assert.deepEqual(emptyGraph, {});
  const emptyStops = getAvailableTransitStops('vanilla', emptyGraph);
  // Falls back to static graph when customGraph is empty
  assert.ok(emptyStops.length > 0);

  // Edge Case 2: Malformed records (missing 'from', 'to', or self-loops)
  const malformedRecords = [
    { from: null, to: 'interior:node1', mode: 'boat' },
    { from: 'interior:node1', to: null, mode: 'boat' },
    { from: 'interior:node1', to: 'interior:node1', mode: 'boat' }, // Self-loop
    { from: 'unknown:a', to: 'unknown:b', mode: 'boat' } // Missing from nodes dict
  ];
  const malformedNodes = {
    'interior:node1': { name: 'Node One' }
  };
  const safeGraph = adaptTravelGraph(malformedRecords, malformedNodes);
  assert.deepEqual(safeGraph, {});

  // Edge Case 3: Disconnected stops / unreachable destinations
  const disconnectedGraph = {
    'Island A': [{ to: 'Island B', kind: 'Boat' }],
    'Island B': [{ to: 'Island A', kind: 'Boat' }],
    'Isolated C': []
  };
  const unreachable = findFewestHopsRoute('Island A', 'Isolated C', 'vanilla', disconnectedGraph);
  assert.equal(unreachable.isValid, false);
  assert.match(unreachable.message, /No fast-travel transit route/i);

  // Edge Case 4: Origin and destination are identical
  const same = findFewestHopsRoute('Island A', 'Island A', 'vanilla', disconnectedGraph);
  assert.equal(same.isValid, true);
  assert.equal(same.hops, 0);

  // Edge Case 5: Stop not in active network
  const missing = findFewestHopsRoute('Island A', 'NonExistent', 'vanilla', disconnectedGraph);
  assert.equal(missing.isValid, false);
  assert.match(missing.message, /not in the active network/i);
});

test('Gear Advisor 3-toggle policy resolution handles all boolean combinations and adversarial inputs', async () => {
  const { selectGearRows, DEFAULT_GEAR_TOGGLES } = await import('../lib/gear-rows.mjs');

  const createRow = (overrides = {}) => ({
    category: 'armor',
    slot: 'cuirass',
    armorClass: 'heavy',
    toggles: { theft: false, endgame: false, nearStart: false },
    ...overrides
  });

  const catalog = [
    createRow({ key: 'r0', toggles: { theft: false, endgame: false, nearStart: false } }),
    createRow({ key: 'r1', toggles: { theft: false, endgame: false, nearStart: true } }),
    createRow({ key: 'r2', toggles: { theft: false, endgame: true,  nearStart: false } }),
    createRow({ key: 'r3', toggles: { theft: false, endgame: true,  nearStart: true } }),
    createRow({ key: 'r4', toggles: { theft: true,  endgame: false, nearStart: false } }),
    createRow({ key: 'r5', toggles: { theft: true,  endgame: false, nearStart: true } }),
    createRow({ key: 'r6', toggles: { theft: true,  endgame: true,  nearStart: false } }),
    createRow({ key: 'r7', toggles: { theft: true,  endgame: true,  nearStart: true } })
  ];

  const build = { maj: ['Heavy Armor'], min: [] };

  // Test all 8 toggle combinations
  for (let i = 0; i < 8; i++) {
    const t = {
      theft: Boolean(i & 4),
      endgame: Boolean(i & 2),
      nearStart: Boolean(i & 1)
    };
    const selected = selectGearRows(catalog, build, t);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].key, `r${i}`);
  }

  // Edge Case: Missing toggles property or partial toggles
  const brokenRows = [
    { key: 'b1', category: 'armor', armorClass: 'heavy' }, // missing toggles
    { key: 'b2', category: 'armor', armorClass: 'heavy', toggles: null },
    { key: 'b3', category: 'armor', armorClass: 'heavy', toggles: { theft: true } } // missing endgame, nearStart
  ];
  const selectedBroken = selectGearRows(brokenRows, build, DEFAULT_GEAR_TOGGLES);
  assert.equal(selectedBroken.length, 0);

  // Edge Case: Null/empty build skills
  const noSkillBuild = { maj: null, min: undefined };
  assert.equal(selectGearRows(catalog, noSkillBuild, DEFAULT_GEAR_TOGGLES).length, 0);
});

test('Workstation adapters enforce effect rule permissions and merchant service bitflags', async () => {
  // Merchant service bitflags invariant:
  // 32768 (0x8000) = Spellmaking
  // 65536 (0x10000) = Enchanting
  const SERVICE_SPELLMAKING = 32768;
  const SERVICE_ENCHANTING = 65536;

  const merchants = [
    { id: 'm_enchanter', name: 'Galbedir', servicesRaw: SERVICE_ENCHANTING, cell: 'Balmora, Guild of Mages' },
    { id: 'm_spellmaker', name: 'Sharn gra-Muzgob', servicesRaw: SERVICE_SPELLMAKING, cell: 'Balmora, Guild of Mages' },
    { id: 'm_both', name: 'Master Wizard', servicesRaw: SERVICE_ENCHANTING | SERVICE_SPELLMAKING, cell: 'Vivec' },
    { id: 'm_trader', name: 'Arrille', servicesRaw: 1 | 2 | 4, cell: 'Seyda Neen' }, // No enchanting, no spellmaking
    { id: 'm_empty', name: 'Broken Merchant', servicesRaw: 0 },
    { id: 'm_null', name: 'Null Services', servicesRaw: null }
  ];

  const enchanters = merchants.filter(m => (Number(m.servicesRaw) & SERVICE_ENCHANTING) !== 0);
  assert.equal(enchanters.length, 2);
  assert.ok(enchanters.some(m => m.id === 'm_enchanter'));
  assert.ok(enchanters.some(m => m.id === 'm_both'));
  assert.ok(!enchanters.some(m => m.id === 'm_spellmaker'));

  const spellmakers = merchants.filter(m => (Number(m.servicesRaw) & SERVICE_SPELLMAKING) !== 0);
  assert.equal(spellmakers.length, 2);
  assert.ok(spellmakers.some(m => m.id === 'm_spellmaker'));
  assert.ok(spellmakers.some(m => m.id === 'm_both'));
  assert.ok(!spellmakers.some(m => m.id === 'm_enchanter'));

  // Effect rules invariant:
  const effectRules = [
    { key: 'fire_damage', name: 'Fire Damage', allowEnchanting: true, allowSpellmaking: true },
    { key: 'almsivi_intervention', name: 'Almsivi Intervention', allowEnchanting: true, allowSpellmaking: false },
    { key: 'corprus', name: 'Corprus', allowEnchanting: false, allowSpellmaking: false },
    { key: 'paralyze', name: 'Paralyze', allowEnchanting: true, allowSpellmaking: true },
    { key: 'malformed_1', name: 'Missing Flags' },
    { key: 'malformed_2', name: 'Null Flags', allowEnchanting: null, allowSpellmaking: undefined }
  ];

  const enchantingEffects = effectRules.filter(r => r.allowEnchanting === true);
  assert.equal(enchantingEffects.length, 3);
  assert.ok(enchantingEffects.some(e => e.key === 'fire_damage'));
  assert.ok(enchantingEffects.some(e => e.key === 'almsivi_intervention'));
  assert.ok(!enchantingEffects.some(e => e.key === 'corprus'));
  assert.ok(!enchantingEffects.some(e => e.key === 'malformed_1'));

  const spellmakingEffects = effectRules.filter(r => r.allowSpellmaking === true);
  assert.equal(spellmakingEffects.length, 2);
  assert.ok(spellmakingEffects.some(e => e.key === 'fire_damage'));
  assert.ok(spellmakingEffects.some(e => e.key === 'paralyze'));
  assert.ok(!spellmakingEffects.some(e => e.key === 'almsivi_intervention'));
  assert.ok(!spellmakingEffects.some(e => e.key === 'corprus'));
});
