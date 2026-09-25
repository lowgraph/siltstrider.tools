export const MAX_PACKED_BYTES = 1024 * 1024;
export const MAX_UNPACKED_BYTES = 8 * 1024 * 1024;
export const MAX_COLLECTION_ENTRIES = 100000;
export function validateSaveBudget(value) {
 const stack = [[value,0]]; let entries=0, text=0;
 while(stack.length) {
  const [item,depth]=stack.pop();
  if (++entries>250000 || depth>32) throw new Error('Save structure exceeds limits');
  if(typeof item==='number' && !Number.isFinite(item)) throw new Error('Save numbers must be finite');
  if(typeof item==='string') {text+=item.length;if(text>MAX_UNPACKED_BYTES)throw new Error('Save text exceeds limits');}
  if(item && typeof item==='object') {
   const keys=Object.keys(item);if(keys.length>MAX_COLLECTION_ENTRIES)throw new Error('Save collection exceeds limits');
   for(const key of keys) {if(['__proto__','prototype','constructor'].includes(key))throw new Error('Unsafe save property');stack.push([item[key],depth+1]);}
  }
 }
}
export async function readLimitedBytes(stream,limit=MAX_UNPACKED_BYTES) {
 if(!stream)return new Uint8Array();
 const reader=stream.getReader();const chunks=[];let size=0;
 try {while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('Payload exceeds size limit');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const output=new Uint8Array(size);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.byteLength;}return output;
}
export async function readSaveJson(request) {
 if(Number(request.headers.get('Content-Length'))>MAX_UNPACKED_BYTES)throw new Error('Payload exceeds size limit');
 const data=JSON.parse(new TextDecoder().decode(await readLimitedBytes(request.body)));
 validateSaveBudget(data);return data;
}
