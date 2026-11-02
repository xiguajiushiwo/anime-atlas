import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handleApi} from '../server/app.mjs';
import {D1Store} from '../server/store.mjs';
import {SqliteAdapter} from '../scripts/sqlite-adapter.mjs';
import {hash} from '../server/security.mjs';
const config={FULFILLMENT_API_KEY:'unit-test-only-not-a-production-secret',FULFILLMENT_ENCRYPTION_KEY:'ab'.repeat(32),FULFILLMENT_PRODUCT_ID:'anime-access',FULFILLMENT_SOURCE:'test-store'};
const paid={orderId:'order-001',productId:'anime-access',paymentStatus:'paid',quantity:1};
function setup(){
 const db=new SqliteAdapter();db.db.exec(fs.readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));const store=new D1Store(db);
 const issue=async(body=paid,headers={},env=config)=>{
  const r=await handleApi(new Request('https://atlas.example/api/fulfillment/issue',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.FULFILLMENT_API_KEY,...headers},body:JSON.stringify(body)}),store,env);
  return{status:r.status,data:await r.json(),headers:r.headers};
 };return{db,store,issue};
}
test('发码默认关闭，必须通过服务认证且不接受浏览器调用',async()=>{
 const {db,issue}=setup();try{
  assert.equal((await issue(paid,{},{})).status,404);
  assert.equal((await issue(paid,{Authorization:'Bearer wrong'})).status,401);
  assert.equal((await issue(paid,{Origin:'https://atlas.example'})).status,403);
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM activation_codes').get().n,0);
 }finally{db.close()}
});
test('未付款、非目标商品、数量不支持和坏订单不会发码',async()=>{
 const {db,issue}=setup();try{
  for(const body of [{...paid,paymentStatus:'pending'},{...paid,productId:'other'},{...paid,quantity:2},{...paid,orderId:''},null,[]])assert.equal((await issue(body)).status,400);
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM fulfillment_orders').get().n,0);
 }finally{db.close()}
});
test('同订单重复及并发调用只生成一个码，其他订单生成独立码',async()=>{
 const {db,store,issue}=setup();try{
  const results=await Promise.all(Array.from({length:5},()=>issue()));
  assert.equal(results.filter(r=>r.status===201).length,1);assert.ok(results.every(r=>[200,201].includes(r.status)));
  const codes=results.map(r=>r.data.code);assert.equal(new Set(codes).size,1);assert.match(codes[0],/^\d{6}$/);
  assert.ok(await store.getAccessCode(await hash(codes[0])));
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM activation_codes').get().n,1);
  const row=db.db.prepare('SELECT * FROM fulfillment_orders').get();assert.notEqual(row.code_cipher,codes[0]);assert.match(row.code_cipher,/^[a-f0-9]{24}\.[a-f0-9]+$/);
  const other=await issue({...paid,orderId:'order-002'});assert.equal(other.status,201);assert.notEqual(other.data.code,codes[0]);
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM activation_codes').get().n,2);
  assert.equal(results[0].headers.get('Cache-Control'),'no-store');
 }finally{db.close()}
});

test('生成数字码撞到已有或停用的码时重新分配，不串到其他订单',async t=>{
 const {db,issue}=setup();try{
  db.db.prepare('INSERT INTO activation_codes(code_hash,batch,disabled) VALUES(?,?,?)').run(await hash('123456'),'old-stock',1);
  const original=crypto.getRandomValues.bind(crypto),sequence=[123456,38271,38271,234567];
  t.mock.method(crypto,'getRandomValues',array=>{if(array instanceof Uint32Array){array[0]=sequence.shift();return array}return original(array)});
  const first=await issue();assert.equal(first.status,201);assert.equal(first.data.code,'038271');
  const second=await issue({...paid,orderId:'order-002'});assert.equal(second.status,201);assert.equal(second.data.code,'234567');
  assert.equal((await issue()).data.code,'038271');
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM activation_codes').get().n,3);
  assert.equal(db.db.prepare('SELECT disabled FROM activation_codes WHERE batch=?').get('old-stock').disabled,1);
 }finally{db.close()}
});

test('连续撞码会有界失败，不生成错误订单或复用别人的码',async t=>{
 const {db,issue}=setup();try{
  db.db.prepare('INSERT INTO activation_codes(code_hash,batch) VALUES(?,?)').run(await hash('123456'),'old-stock');
  const original=crypto.getRandomValues.bind(crypto);
  t.mock.method(crypto,'getRandomValues',array=>{if(array instanceof Uint32Array){array[0]=123456;return array}return original(array)});
  assert.equal((await issue()).status,503);
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM fulfillment_orders').get().n,0);
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM activation_codes').get().n,1);
 }finally{db.close()}
});
test('发出的码可直接解锁；停用后重试订单不会另外补发',async()=>{
 const {db,store,issue}=setup();try{
  const result=await issue(),code=result.data.code;
  const unlocked=await handleApi(new Request('https://atlas.example/api/unlock',{method:'POST',headers:{Origin:'https://atlas.example','Content-Type':'application/json'},body:JSON.stringify({code})}),store);
  assert.equal(unlocked.status,200);
  db.db.prepare('UPDATE activation_codes SET disabled=1 WHERE code_hash=?').run(await hash(code));
  assert.equal((await issue()).status,409);assert.equal(db.db.prepare('SELECT count(*) AS n FROM activation_codes').get().n,1);
 }finally{db.close()}
});
test('解密配置错误返回失败，不替换已经交付的码',async()=>{
 const {db,issue}=setup();try{
  const original=await issue();
  assert.equal((await issue(paid,{}, {...config,FULFILLMENT_ENCRYPTION_KEY:'cd'.repeat(32)})).status,500);
  assert.equal((await issue()).data.code,original.data.code);
  assert.equal(db.db.prepare('SELECT count(*) AS n FROM activation_codes').get().n,1);
 }finally{db.close()}
});
