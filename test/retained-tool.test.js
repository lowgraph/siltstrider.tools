const {test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');const {JSDOM}=require('jsdom');const Module=require('node:module');const fs=require('node:fs');
test('tools mount lazily and retain drafts through repeated navigation',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const code=require('esbuild').transformSync(fs.readFileSync('components/retained-tool.jsx','utf8'),{loader:'jsx',format:'cjs',jsx:'automatic'}).code;
 const m=new Module(module.filename,module);m.paths=module.paths;m._compile(code,module.filename);const Tool=m.exports.default;
 const root=require('react-dom/client').createRoot(document.getElementById('root'));let mounts=0;
 function Draft(){const [value,setValue]=React.useState(0);React.useEffect(()=>{mounts++},[]);return React.createElement('button',{onClick:()=>setValue(value+1)},String(value));}
 const render=active=>React.act(async()=>root.render(React.createElement(Tool,{active},React.createElement(Draft))));
 await render(false);assert.equal(mounts,0);
 await render(true);await React.act(async()=>document.querySelector('button').click());
 for(let i=0;i<3;i++){await render(false);await render(true);}
 assert.equal(mounts,1);assert.equal(document.querySelector('button').textContent,'1');
 await React.act(async()=>root.unmount());dom.window.close();
});
