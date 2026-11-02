import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash} from '../server/security.mjs';
import {makeAccessCode} from '../server/access-codes.mjs';

const root=new URL('../work/',import.meta.url);fs.mkdirSync(root,{recursive:true});
if(process.argv.includes('--prepare')){
 const code=makeAccessCode();
 fs.writeFileSync(new URL('runtime-code.json',root),JSON.stringify({code}));
 fs.writeFileSync(new URL('runtime-seed.sql',root),`INSERT INTO activation_codes(code_hash,batch) VALUES('${await hash(code)}','runtime-check');`);
 console.log('Private deployment test code and import SQL prepared in work/.');
}else{
 const origin=process.env.SMOKE_ORIGIN||'http://127.0.0.1:4174';
 const code=process.env.SMOKE_CODE_FILE?fs.readFileSync(process.env.SMOKE_CODE_FILE,'utf8').trim().split(/\r?\n/)[0]:JSON.parse(fs.readFileSync(new URL('runtime-code.json',root),'utf8')).code;
 function client(){
  let cookie='';
  return async(route,body)=>{
   const r=await fetch(origin+'/api'+route,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},...(body===undefined?{}:{body:JSON.stringify(body)})});
   const newCookie=r.headers.get('Set-Cookie');if(newCookie)cookie=newCookie.split(';')[0];
   return{status:r.status,data:await r.json(),headers:r.headers};
  };
 }
 const call=client(),other=client();
 const boot=await call('/bootstrap');assert.equal(boot.status,200);assert.equal(boot.data.user,null);assert.equal(boot.data.demo,false);
 for(const key of ['characters','works','dimensions','modes'])assert.deepEqual(boot.data[key],[]);
 assert.equal((await call('/runs',{mode:'standard'})).status,401);
 for(const route of ['/demo','/register','/login','/redeem'])assert.equal((await call(route,{})).status,404);
 assert.equal((await call('/unlock',{code:'INVALID-CODE'})).status,400);
 const access=await call('/unlock',{code});assert.equal(access.status,200);
 assert.match(access.headers.get('Set-Cookie'),/HttpOnly/);
 if(origin.startsWith('https:'))assert.match(access.headers.get('Set-Cookie'),/Secure/);
 assert.equal((await other('/unlock',{code})).status,200);
 assert.equal((await call('/bootstrap')).data.user.id,access.data.user.id);
 for(const gender of ['all','male','female']){
  const begun=await call('/runs',{mode:'standard',gender});assert.equal(begun.status,201);
  const run=begun.data.run;assert.equal(run.questions.length,24);assert.ok(!JSON.stringify(run).includes('weights'));
  const answers=Object.fromEntries(run.questions.map((q,i)=>[q.id,q.options[i%q.options.length].id]));
  const done=await call('/runs/'+run.id+'/finish',{answers});assert.equal(done.status,200);
  assert.equal(done.data.report.questionCount,24);assert.deepEqual(Object.keys(done.data.report.character).sort(),['id','name']);
  assert.deepEqual((await call('/runs/'+run.id)).data.report,done.data.report);
  assert.equal((await other('/runs/'+run.id)).status,404);
 }
 assert.equal((await call('/history')).data.history.length,3);
 assert.equal((await other('/history')).data.history.length,0);
 assert.equal((await call('/logout',{})).status,200);assert.equal((await call('/history')).status,401);
 assert.equal((await call('/unlock',{code})).status,200);
 const page=await fetch(origin+'/?preview=1');assert.equal(page.status,200);assert.match(await page.text(),/次元来信/);
 for(const path of ['/data/characters.mjs','/CHARACTER_ROSTER.md','/schema.sql','/.env','/docs/SALES_SETUP.md']){
  const response=await fetch(origin+path),text=await response.text();
  assert.ok(response.status===404||response.headers.get('content-type')?.includes('text/html'),path);
  assert.ok(!text.includes('CREATE TABLE')&&!text.includes('export const characters')&&!text.includes('FULFILLMENT_API_KEY'),path);
 }
 console.log('Deployment verified: HTTPS page, numeric unlock, repeated use, three 24-question runs, remembered access, isolated history, logout and private data.');
}
