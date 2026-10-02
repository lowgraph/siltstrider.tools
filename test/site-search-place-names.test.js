const { test } = require('node:test');
const assert = require('node:assert/strict');
const staged = require('./helpers/qa-staged-data.cjs');

const search = () => import('../lib/site-search.mjs');
const graph = {
  'Ald-ruhn': [{to: 'Balmora', kind: 'Silt Strider'}],
  'Ald-ruhn, Guild of Mages': [],
  'Sadrith Mora': [],
  Vos: [],
  Balmora: []
};
const hits = (S, entries, query) => S.searchEntries(entries, query, {group: 'places'}).flatMap(group => group.items);

test('QA-32: apostrophe, hyphen and joined spellings resolve the same canonical stop', async () => {
  const S = await search();
  const entries = S.stopEntries(graph);
  for (const query of ["Ald'ruhn", 'Ald-ruhn', 'Aldruhn', 'Ald ruhn', 'ALD’RUHN', 'Ald‘ruhn', 'Aldʼruhn', 'Ald‑ruhn', 'Ald—ruhn', ' Ald  ruhn ']) {
    const [top] = hits(S, entries, query);
    assert.ok(top, `Result for ${query}`);
    assert.equal(top.entry.id, 'stop:Ald-ruhn', query);
    assert.equal(top.entry.title, 'Ald-ruhn', 'Catalog label stays unchanged');
    assert.equal(top.entry.ref.stop, 'Ald-ruhn', 'Navigation keeps the canonical stop');
    assert.equal(top.score, 1000, 'Equivalent spelling ranks as an exact place name');
    assert.deepEqual(top.ranges, [[0, 8]], 'Highlight includes original punctuation');
  }
});

test('QA-32: multiword and short names still match, including joined words', async () => {
  const S = await search();
  const entries = S.stopEntries(graph);
  for (const query of ['Sadrith Mora', 'sadrithmora', 'Sadrith-Mora', 'Sadrith’Mora', '  sadrith   mora  ']) {
    const [top] = hits(S, entries, query);
    assert.equal(top.entry.id, 'stop:Sadrith Mora');
    assert.equal(top.score, 1000);
    assert.deepEqual(top.ranges, [[0, 12]]);
  }
  assert.equal(hits(S, entries, 'Vos')[0].entry.id, 'stop:Vos');
});

test('QA-32: partial, separated and reversed-word place queries retain their matches', async () => {
  const S = await search();
  const entries = S.stopEntries(graph);
  for (const query of ["Ald'r", 'aldru', 'ald r', 'ruhn ald']) assert.equal(hits(S, entries, query)[0].entry.id, 'stop:Ald-ruhn', query);
  for (const query of ['sad mo', 'mora sad', 'sadrithm']) assert.equal(hits(S, entries, query)[0].entry.id, 'stop:Sadrith Mora', query);
  assert.deepEqual(S.highlightRanges('Ald-ruhn', "Ald'ru"), [[0, 6]]);
  assert.deepEqual(S.highlightRanges('Sadrith Mora', 'mora sad'), [[0, 3], [8, 12]]);
});

test('QA-32: compact matches map accents, repeated spaces and punctuation to original offsets', async () => {
  const S = await search();
  const title = 'Áld — ruhn';
  const entries = S.stopEntries({[title]: []});
  const [top] = hits(S, entries, 'aldruhn');
  assert.equal(top.entry.title, title);
  assert.deepEqual(top.ranges, [[0, title.length]]);
  assert.deepEqual(S.highlightRanges(title, 'aldru'), [[0, 8]]);
  assert.deepEqual(S.highlightRanges("Azura's Star", 'star az'), [[0, 2], [8, 12]], 'Existing word highlights remain unchanged');
});

test('QA-32: exact names outrank extensions and suppress unrelated typo matches', async () => {
  const S = await search();
  const entries = S.stopEntries({...graph, 'Ald-ruha': []});
  const result = hits(S, entries, "Ald'ruhn");
  assert.deepEqual(result.map(hit => hit.entry.id), ['stop:Ald-ruhn', 'stop:Ald-ruhn, Guild of Mages']);
  assert.ok(result[0].score > result[1].score);
  assert.equal(hits(S, entries, 'balmorra')[0].entry.id, 'stop:Balmora', 'Existing typo tolerance survives');
});

test('QA-32: blank, punctuation-only, absent and unknown queries remain safe', async () => {
  const S = await search();
  const entries = S.stopEntries(graph);
  for (const query of ['', '   ', "-'’—", null, undefined]) {
    assert.equal(hits(S, entries, query).length, entries.length, 'Empty place query browses the group');
    assert.deepEqual(S.highlightRanges('Ald-ruhn', query), []);
  }
  assert.deepEqual(hits(S, entries, 'zzzzzz'), []);
  assert.deepEqual(S.searchEntries([], "Ald'ruhn"), []);
});

for (const profile of ['vanilla', 'tr', 'tr_arce']) test(`QA-32: staged ${profile} search preserves published place names and stop IDs`, staged.staged(), async () => {
  const S = await search();
  const loader = await staged.loader();
  const {adaptTravelGraph} = await import('../lib/travel-graph.mjs');
  const [records, metadata] = await Promise.all([loader.loadCatalog(profile, 'Travel'), loader.loadCatalogMetadata(profile, 'Travel')]);
  const entries = S.stopEntries(adaptTravelGraph(records, metadata.nodes));
  for (const [title, queries] of [['Ald-ruhn', ["Ald'ruhn", 'Ald-ruhn', 'Aldruhn']], ['Sadrith Mora', ['Sadrith Mora', 'SadrithMora']], ['Vos', ['Vos']]]) {
    for (const query of queries) {
      const [top] = hits(S, entries, query);
      assert.equal(top?.entry.title, title, `${profile}: ${query}`);
      assert.equal(top.entry.id, `stop:${title}`);
      assert.equal(top.entry.ref.stop, title);
    }
  }
});
