const path = require('node:path');
const Module = require('node:module');
const file = path.join(__dirname, '..', '..', 'components', 'calculators', 'alchemy', 'ingredient-sources.jsx');
const built = require('esbuild').buildSync({ entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
const compiled = new Module(file, module);
compiled.paths = module.paths;
compiled._compile(built.outputFiles[0].text, file);
module.exports = compiled.exports;
