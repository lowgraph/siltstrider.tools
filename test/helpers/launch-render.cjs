const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');
const {pathToFileURL}=require('node:url');const React=require('react');const {JSDOM}=require('jsdom');
exports.React=React;
exports.load=async(file,deps={})=>{
  const full=path.resolve(file);
  const code=require('esbuild').transformSync(fs.readFileSync(full,'utf8'),{loader:'jsx',format:'cjs',jsx:'automatic'}).code;
  for(const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g))deps[match[1]]??=await import(pathToFileURL(path.resolve(path.dirname(full),match[1])));
  const m=new Module(full,module);m.paths=module.paths;m.require=id=>deps[id]||require(id);m._compile(code,full);return m.exports;
};
exports.mount=async(Component,check,props={})=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
  Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const root=require('react-dom/client').createRoot(document.querySelector('#root'));
  try {await React.act(async()=>root.render(React.createElement(Component,props)));await check(root,dom.window);}
  finally {await React.act(async()=>root.unmount());dom.window.close();}
};
