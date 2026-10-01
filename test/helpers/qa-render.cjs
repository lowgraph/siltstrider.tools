const Module=require('node:module');const path=require('node:path');
const result=require('esbuild').buildSync({stdin:{contents:`
export {default as About} from './components/views/about-view.jsx';
export {default as Premades} from './components/character-builder/premade-browser.jsx';
export {default as Roster} from './components/journal-factions/faction-roster.jsx';
export {default as Faction} from './components/journal-factions/faction-detail-view.jsx';
export {default as Sheet} from './components/character-builder/character-sheet.jsx';
export {default as HomeHero} from './components/home-hub/home-hero.jsx';
export {default as ProgressionSheet} from './components/level-simulator/progression-sheet.jsx';
export {default as AccountPage} from './components/account-page.jsx';
export {default as Challenge} from './components/challenge-runs/challenge-runs-root.jsx';
export {default as Travel} from './components/calculators/travel/travel-workstation.jsx';
export {useCloudVault} from './components/character-vault/use-cloud-vault.js';
export * from './components/account-context.jsx';
export * from './components/account-settings-context.jsx';
export * from './components/challenge-run-context.jsx';
export * from './components/character-context.jsx';
export * from './components/shell-context.jsx';`,resolveDir:path.resolve(__dirname,'../..')},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
const fixture=new Module(path.resolve(__dirname,'qa-fixture.cjs'),module);fixture.paths=module.paths;fixture._compile(result.outputFiles[0].text,path.resolve(__dirname,'qa-fixture.cjs'));module.exports=fixture.exports;
