const { before, after } = require('node:test');

// Shell/navigation tests exercise the UI while catalogs are loading. Keep that
// state explicit instead of contacting a developer's server and racing teardown.
// Catalog success/error behavior is covered by the loader and workstation tests.
const originalFetch = global.fetch;
before(() => {
  global.fetch = (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input, 'http://localhost/');
    if (url.pathname.startsWith('/game-data/')) return new Promise(() => {});
    return originalFetch(input, options);
  };
});
after(() => { global.fetch = originalFetch; });
