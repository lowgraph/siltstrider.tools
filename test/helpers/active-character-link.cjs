// The real ActiveCharacterLink (SITE-4), compiled once, for tests that load a tool with a
// hand-made map of its imports. Without a site shell around it, it renders as a plain link.
const path = require('node:path');
const Module = require('node:module');

const file = path.join(__dirname, '..', '..', 'components', 'active-character-link.jsx');
const built = require('esbuild').buildSync({
  entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/*']
});
const compiled = new Module(file, module);
compiled.paths = module.paths;
compiled._compile(built.outputFiles[0].text, file);

module.exports = compiled.exports;
