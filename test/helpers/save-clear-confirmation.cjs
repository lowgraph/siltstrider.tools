const path=require('node:path');
const Module=require('node:module');
const file=path.resolve(__dirname,'../../components/character-vault/use-save-clear-confirmation.jsx');
const result=require('esbuild').buildSync({entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','react-dom']});
const compiled=new Module(file,module);compiled.paths=module.paths;compiled._compile(result.outputFiles[0].text,file);
module.exports=compiled.exports;
