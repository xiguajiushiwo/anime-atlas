import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handleApi} from '../server/app.mjs';
import {D1Store} from '../server/store.mjs';
import {SqliteAdapter} from '../scripts/sqlite-adapter.mjs';
import {hash} from '../server/security.mjs';
import {characters} from '../data/characters.mjs';

const origin='https://atlas.example',code='038271';
async function setup(){
 const db=new SqliteAdapter();db.db.exec(fs.readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const store=new D1Store(db),codeHash=await hash(code);
 db.db.prepare('INSERT INTO activation_codes(code_hash,batch) VALUES(?,?)').run(codeHash,'test');
 const call=async(path,body,cookie='',headers={})=>{
  const r=await handleApi(new Request(origin+'/api'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),store);
  return{status:r.status,data:await r.json(),cookie:r.headers.get('Set-Cookie')?.split(';')[0],headers:r.headers};
 };
 return{db,store,call,codeHash};
}

test('36 / 60 / 90 题保存完整的个性化来信，重读与重复提交保持一致',async()=>{
 const {db,call}=await setup();try{
  const access=await call('/unlock',{code});
  for(const [mode,count] of [['story',36],['full',60],['extended',90]]){
   const begun=await call('/runs',{mode},access.cookie);assert.equal(begun.status,201);
   const run=begun.data.run;assert.equal(run.questions.length,count);
   const answers=Object.fromEntries(run.questions.map(q=>[q.id,q.options[0].id]));
   const done=await call('/runs/'+run.id+'/finish',{answers},access.cookie);assert.equal(done.status,200);
   assert.equal(done.data.report.version,3);assert.equal(done.data.report.questionCount,count);assert.equal(done.data.report.analysis.recap.length,count);
   for(const item of done.data.report.analysis.recap){const q=run.questions.find(q=>q.id===item.questionId);assert.equal(item.choice,q.options[0].label)}
   assert.deepEqual((await call('/runs/'+run.id,undefined,access.cookie)).data.report,done.data.report);
   assert.deepEqual((await call('/runs/'+run.id+'/finish',{answers:{}},access.cookie)).data.report,done.data.report);
  }
  assert.equal((await call('/history',undefined,access.cookie)).data.history.length,3);
 }finally{db.close()}
});

test('未解锁不能访问题目；预览和旧注册入口不能绕过解锁',async()=>{
 const {db,call}=await setup();try{
  assert.equal((await call('/runs',{mode:'standard'})).status,401);
  for(const path of ['/demo','/register','/login','/redeem'])assert.equal((await call(path,{})).status,404);
  const b=await call('/bootstrap');assert.equal(b.data.demo,false);assert.equal(b.data.user,null);
  for(const key of ['characters','works','dimensions'])assert.deepEqual(b.data[key],[]);assert.deepEqual(b.data.modes.map(m=>m.count),[36,60,90]);assert.equal(b.data.defaultMode,'full');
 }finally{db.close()}
});

test('历史显示最近二十次及作品名，旧记录可补充介绍且仍按浏览器隔离',async()=>{
 const {db,store,call}=await setup();try{
  const a=await call('/unlock',{code}),b=await call('/unlock',{code});
  const c=characters.find(c=>c.id==='naruto'),ids=[];
  for(let i=0;i<21;i++){
   const id=i.toString(16).padStart(48,'0');ids.push(id);
   await store.createRun({id,user_id:a.data.user.id,mode:'standard',preferences:{},selection:[],created_at:1000+i});
   await store.finishRun(id,a.data.user.id,{version:2,createdAt:new Date(1000+i).toISOString(),mode:'standard',questionCount:24,character:{id:c.id,name:c.name}});
  }
  const history=(await call('/history',undefined,a.cookie)).data.history;
  assert.equal(history.length,20);assert.equal(history[0].id,ids[20]);assert.equal(history.at(-1).id,ids[1]);
  for(const item of history){assert.equal(item.character.work,c.work);assert.deepEqual(Object.keys(item.character),['id','name','work'])}
  const read=(await call('/runs/'+ids[20],undefined,a.cookie)).data.report;
  assert.equal(read.character.id,c.id);assert.equal(read.character.work,c.work);assert.ok(read.character.summary);assert.equal(read.analysis,undefined);
  assert.deepEqual((await store.getRun(ids[20],a.data.user.id)).report.character,{id:c.id,name:c.name});
  assert.equal((await call('/runs/'+ids[20],undefined,b.cookie)).status,404);
  assert.deepEqual((await call('/history',undefined,b.cookie)).data.history,[]);
 }finally{db.close()}
});

test('只需解锁码，同一码允许多个浏览器独立进入且不被核销',async()=>{
 const {db,call,codeHash}=await setup();try{
  const results=await Promise.all(Array.from({length:3},()=>call('/unlock',{code:' '+code+' '})));
  for(const result of results){assert.equal(result.status,200);assert.equal(result.data.user.unlocked,true);assert.deepEqual(Object.keys(result.data.user).sort(),['id','unlocked']);assert.match(result.headers.get('Set-Cookie'),/HttpOnly.*SameSite=Lax.*Secure/)}
  assert.equal(new Set(results.map(r=>r.data.user.id)).size,3);
  for(const result of results)assert.equal((await call('/runs',{mode:'standard'},result.cookie)).status,201);
  assert.equal(db.db.prepare('SELECT claimed_by FROM activation_codes WHERE code_hash=?').get(codeHash).claimed_by,null);
 }finally{db.close()}
});

test('数字密码保留开头的零，旧的已发长码仍可使用',async()=>{
 const {db,call}=await setup();try{
  assert.equal((await call('/unlock',{code:code.slice(1)})).status,400);
  assert.equal((await call('/unlock',{code})).status,200);
  const legacy='CY-ABCDE-FGHJK-MNPQR-STUVW';
  db.db.prepare('INSERT INTO activation_codes(code_hash,batch) VALUES(?,?)').run(await hash(legacy),'legacy');
  assert.equal((await call('/unlock',{code:legacy.toLowerCase()})).status,200);
 }finally{db.close()}
});

test('错误、空值和跨站解锁不会创建访客或会话，猜码受限',async()=>{
 const {db,call}=await setup();try{
  assert.equal((await call('/unlock',{code},'',{Origin:'https://evil.example'})).status,403);
  for(const body of [{code:'INVALID-CODE'},null,{},[]])assert.equal((await call('/unlock',body)).status,400);
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM users').get().n,0);
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM sessions').get().n,0);
  for(let i=0;i<16;i++)assert.equal((await call('/unlock',{code:'INVALID-CODE'})).status,400);
  assert.equal((await call('/unlock',{code})).status,429);
 }finally{db.close()}
});

test('浏览器记住解锁；重复输入保留本机记录并轮换会话',async()=>{
 const {db,call}=await setup();try{
  const a=await call('/unlock',{code});
  assert.deepEqual((await call('/bootstrap',undefined,a.cookie)).data.user,a.data.user);
  const again=await call('/unlock',{code},a.cookie);assert.equal(again.data.user.id,a.data.user.id);assert.notEqual(again.cookie,a.cookie);
  assert.equal((await call('/history',undefined,a.cookie)).status,401);
  for(let i=0;i<3;i++)assert.equal((await call('/runs',{mode:'light'},again.cookie)).status,201);
  await call('/logout',{},again.cookie);assert.equal((await call('/history',undefined,again.cookie)).status,401);
  assert.equal((await call('/unlock',{code})).status,200);
 }finally{db.close()}
});

test('停用解锁码立即阻止所有已有会话与新进入；会话过期可重新输入',async()=>{
 const {db,call,codeHash}=await setup();try{
  const a=await call('/unlock',{code}),b=await call('/unlock',{code});
  db.db.prepare('UPDATE activation_codes SET disabled=1 WHERE code_hash=?').run(codeHash);
  for(const cookie of [a.cookie,b.cookie])assert.equal((await call('/runs',{mode:'standard'},cookie)).status,401);
  assert.equal((await call('/unlock',{code})).status,400);
  db.db.prepare('UPDATE activation_codes SET disabled=0 WHERE code_hash=?').run(codeHash);
  db.db.exec('UPDATE sessions SET expires_at=1');
  assert.equal((await call('/history',undefined,a.cookie)).status,401);
  assert.equal((await call('/unlock',{code})).status,200);
 }finally{db.close()}
});

test('同码使用者互相看不到答题记录，服务端评分和提交保持幂等',async()=>{
 const {db,call}=await setup();try{
  const a=await call('/unlock',{code}),b=await call('/unlock',{code});
  const begun=await call('/runs',{mode:'light'},a.cookie),run=begun.data.run;
  assert.ok(!JSON.stringify(run).includes('weights'));
  assert.equal((await call('/runs/'+run.id+'/finish',{answers:{}},a.cookie)).status,400);
  const answers=Object.fromEntries(run.questions.map(q=>[q.id,q.options[0].id]));
  const done=await call('/runs/'+run.id+'/finish',{answers},a.cookie);assert.equal(done.status,200);
  const again=await call('/runs/'+run.id+'/finish',{answers:{}},a.cookie);assert.deepEqual(again.data.report,done.data.report);
  assert.equal((await call('/runs/'+run.id,undefined,b.cookie)).status,404);
  assert.equal((await call('/history',undefined,a.cookie)).data.history.length,1);
  assert.equal((await call('/history',undefined,b.cookie)).data.history.length,0);
 }finally{db.close()}
});

test('解锁后的性别选择随测试保存，结果与重读均遵守选择',async()=>{
 const {db,call}=await setup();try{
  const access=await call('/unlock',{code});
  for(const gender of ['all','male','female']){
   const begun=await call('/runs',{mode:'standard',work:'all',gender},access.cookie);assert.equal(begun.status,201);
   const run=begun.data.run;assert.equal(run.preferences.gender,gender);
   assert.equal((await call('/runs/'+run.id,undefined,access.cookie)).data.run.preferences.gender,gender);
   const answers=Object.fromEntries(run.questions.map(q=>[q.id,q.options[0].id]));
   const done=await call('/runs/'+run.id+'/finish',{answers,gender:gender==='female'?'male':'female'},access.cookie);
   assert.equal(done.status,200);const character=characters.find(c=>c.id===done.data.report.character.id);assert.ok(character);
   if(gender!=='all')assert.equal(character.gender,gender);
   assert.deepEqual((await call('/runs/'+run.id,undefined,access.cookie)).data.report,done.data.report);
   assert.deepEqual(Object.keys(done.data.report.character).sort(),['id','name','summary','tag','work']);
  }
 }finally{db.close()}
});
