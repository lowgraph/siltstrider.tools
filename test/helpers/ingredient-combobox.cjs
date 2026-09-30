// The real IngredientCombobox (CALC-3), compiled once, for tests that load the Alchemy
// workstation with a hand-made map of its imports.
const path = require('node:path');
const Module = require('node:module');

const file = path.join(__dirname, '..', '..', 'components', 'calculators', 'alchemy', 'ingredient-combobox.jsx');
const built = require('esbuild').buildSync({
  entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/*']
});
const compiled = new Module(file, module);
compiled.paths = module.paths;
compiled._compile(built.outputFiles[0].text, file);

module.exports = compiled.exports;

// Choose an ingredient the way a player does: type its name in the slot's box, then Enter.
module.exports.pickIngredient = async (React, window, slot, name) => {
  const box = window.document.querySelectorAll('.alchemy-workstation input[role="combobox"]')[slot];
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await React.act(async () => {
    box.focus();
    setter.call(box, name);
    box.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  await React.act(async () => box.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
  return box;
};
