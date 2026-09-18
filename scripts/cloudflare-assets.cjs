// Bridge for a connector-created, short-lived Cloudflare asset upload session.
// No account API tokens are read or stored. Session input and completion output
// must be passed privately by the deployment orchestrator, never logged.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../.next-export');
const mime={'.html':'text/html','.txt':'text/plain','.js':'application/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
function manifest(){
 const result={};
 function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()) visit(file);
  else if(entry.isFile()) {
   const bytes=fs.readFileSync(file), ext=path.extname(file);
   result['/'+path.relative(root,file).replaceAll('\\','/')]={hash:crypto.createHash('sha256').update(bytes.toString('base64')+ext).digest('hex').slice(0,32),size:bytes.length};
  }
 }}visit(root);return result;
}
async function run(){
 const files=manifest();
 if(process.argv[2]==='manifest'){console.log(JSON.stringify(files));return;}
 if(process.argv[2]!=='upload') throw new Error('Use manifest or upload');
 const input=JSON.parse(fs.readFileSync(0,'utf8'));
 let completion=input.buckets.length?null:input.jwt;
 for(const bucket of input.buckets){
  const form=new FormData();
  for(const hash of bucket){
   const item=Object.entries(files).find(([,v])=>v.hash===hash);
   if(!item) throw new Error('Asset changed after creating the session');
   const file=path.join(root,item[0].slice(1)), data=fs.readFileSync(file);
   form.append(hash,new Blob([data.toString('base64')],{type:mime[path.extname(file)]||'application/octet-stream'}),hash);
  }
  const response=await fetch('https://api.cloudflare.com/client/v4/accounts/4653c1ab885ae65ebea83b3804643010/workers/assets/upload?base64=true',{method:'POST',headers:{Authorization:'Bearer '+input.jwt},body:form});
  const result=await response.json();
  if(!response.ok||!result.success) throw new Error('Asset upload failed: HTTP '+response.status);
  if(result.result?.jwt) completion=result.result.jwt;
 }
 if(!completion) throw new Error('Upload completion token missing');
 console.log(JSON.stringify({jwt:completion,files:Object.keys(files).length}));
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
