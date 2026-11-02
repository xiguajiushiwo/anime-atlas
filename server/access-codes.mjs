import {randomId} from './security.mjs';

export function makeAccessCode(){
  const values=new Uint32Array(1),range=1000000,limit=Math.floor(2**32/range)*range;
  do{crypto.getRandomValues(values)}while(values[0]>=limit);
  return String(values[0]%range).padStart(6,'0');
}

const encoder=new TextEncoder(),decoder=new TextDecoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const unhex=value=>Uint8Array.from(value.match(/../g)||[],v=>parseInt(v,16));
async function encryptionKey(secret){
  if(!/^[a-f0-9]{64}$/i.test(secret||''))throw new Error('Invalid fulfillment encryption key');
  return crypto.subtle.importKey('raw',unhex(secret),'AES-GCM',false,['encrypt','decrypt']);
}
export async function sealCode(code,orderKey,secret){
  const iv=unhex(randomId(12));
  const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(orderKey)},await encryptionKey(secret),encoder.encode(code));
  return hex(iv)+'.'+hex(new Uint8Array(encrypted));
}
export async function openCode(cipher,orderKey,secret){
  const [iv,data]=cipher.split('.');
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unhex(iv),additionalData:encoder.encode(orderKey)},await encryptionKey(secret),unhex(data));
  return decoder.decode(plain);
}
