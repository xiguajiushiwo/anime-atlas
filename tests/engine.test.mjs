import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {characters,dimensions} from '../data/characters.mjs';import {questions,categories} from '../data/questions.mjs';
import {curateCharacters} from '../data/roster-policy.mjs';
import {selectQuestions,scoreAnswers,rankCharacters,makeReport,publicReport,presentQuestions,signature} from '../server/engine.mjs';
const random=()=>{let seed=33;return()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)};
test('题库及角色结构完整，每个人物有独立匹配轮廓',()=>{assert.ok(characters.length>0);assert.equal(questions.length,2000);assert.equal(new Set(questions.map(x=>x.text)).size,2000);assert.equal(dimensions.length,8);assert.ok(new Set(questions.map(x=>x.kind)).size>=3);for(const q of questions){assert.ok(q.options.length>=2);for(const o of q.options){assert.equal(o.weights.length,8);assert.ok(o.weights.every(Number.isFinite))}}for(const c of characters){assert.equal(c.vector.length,8,c.id);assert.ok(c.vector.every(n=>Number.isFinite(n)&&n>=0&&n<=100),c.id)}assert.equal(new Set(characters.map(c=>c.id)).size,characters.length);assert.equal(new Set(characters.map(x=>JSON.stringify(signature(x.vector)) )).size,characters.length)});
test('大众精选取消人数配额，未入选的作品和配角不会匹配',()=>{
 const counts=new Map();for(const c of characters)counts.set(c.work,(counts.get(c.work)||0)+1);
 assert.ok([...counts.values()].some(count=>count===1));assert.ok([...counts.values()].some(count=>count>4));
 for(const id of ['cattleya','iris','gaoshun','satomi-parasyte','jin','tanuma','nishiki','ichikazu','okudera'])assert.ok(!characters.some(c=>c.id===id),id);
 for(const work of ['花牌情缘','寒蝉鸣泣之时','魔法科高校的劣等生','樱花庄的宠物女孩','哆啦A梦','蜡笔小新'])assert.throws(()=>rankCharacters(Array(8).fill(50),{work}));
 for(const id of ['itachi','jiraiya','sanji','chopper','amuro-conan','sakura-cardcaptor','totoro','killua','l','asuna','frieren','dazai','minato','madara','might-guy','nanami-jjk'])assert.ok(characters.some(c=>c.id===id),id);
 assert.ok(!characters.some(c=>c.id==='nanami'));
 assert.equal(characters.find(c=>c.id==='nanami-jjk').work,'咒术回战');
 for(const [id,work] of [['kurama-yyh','幽游白书'],['ryoma-tennis','网球王子'],['kuroko-railgun','某科学的超电磁炮'],['kuroko','黑子的篮球'],['haruhi-suzumiya','凉宫春日的忧郁'],['tsuna','家庭教师Hitman REBORN!'],['mob','灵能百分百'],['kaori','四月是你的谎言'],['violet','紫罗兰永恒花园'],['bocchi','孤独摇滚'],['taiga','龙与虎']]){
  const character=characters.find(c=>c.id===id);assert.equal(character?.work,work,id);
  assert.ok(character.sourceUrl?.startsWith('https://anilist.co/character/'),id);
 }
 assert.deepEqual(curateCharacters([...characters,{...characters[0],id:'unreviewed-addition'}]).map(c=>c.id),characters.map(c=>c.id));
});
test('三种模式按六类均衡抽样且轮内不重复',()=>{for(const n of [12,24,36]){const selection=selectQuestions(n,[],random());assert.equal(selection.length,n);assert.equal(new Set(selection.map(q=>q.id)).size,n);for(const cat of categories)assert.equal(selection.filter(s=>questions.find(q=>q.id===s.id).category===cat).length,n/6);for(const s of selection){const q=questions.find(x=>x.id===s.id);assert.equal(s.order.length,q.options.length);assert.deepEqual([...s.order].sort(),q.options.map(o=>o.id).sort())}}});
test('近期抽过的题目有足够替代时不会再次选中',()=>{const a=selectQuestions(12,[],random()),b=selectQuestions(24,a.map(x=>x.id),random());assert.ok(b.every(x=>!a.some(y=>x.id===y.id)))});
test('每个角色用自身参数都能排到第一，避免同模板角色永远不可达',()=>{for(const c of characters)assert.equal(rankCharacters(c.vector)[0].character.id,c.id,c.name)});
test('展示给浏览器的题目不包含权重',()=>{const output=JSON.stringify(presentQuestions(selectQuestions(12,[],random())));assert.ok(!output.includes('weights'))});
test('不完整和伪造答案被拒绝，合法分数保持在 0–100',()=>{const s=selectQuestions(12,[],random());assert.throws(()=>scoreAnswers(s,{}));assert.throws(()=>scoreAnswers(s,Object.fromEntries(s.map(q=>[q.id,'fake']))));const scores=scoreAnswers(s,Object.fromEntries(s.map(q=>[q.id,'0'])));assert.ok(scores.every(x=>x>=0&&x<=100))});
test('匹配使用筛选范围，空范围清晰报错',()=>{assert.ok(rankCharacters(characters[0].vector,{gender:'female'}).every(x=>x.character.gender==='female'));assert.throws(()=>rankCharacters(characters[0].vector,{work:'排球少年!!',gender:'female'}));const r=makeReport(characters[0].vector);assert.equal(r.character.id,'naruto');assert.equal(r.alternatives.length,2);assert.equal(r.overlaps.length,3);assert.ok(!('vector' in r.character))});
test('每个角色在默认 24 题和深度 36 题中都能实际匹配到',()=>{
 for(const [count,file] of [[24,'reachable-standard.json'],[36,'reachable.json']]){
  const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/'+file,import.meta.url),'utf8'));
  assert.equal(fixtures.length,characters.length);assert.deepEqual(fixtures.map(f=>f.characterId).sort(),characters.map(c=>c.id).sort());
  for(const f of fixtures){assert.equal(f.selection.length,count);assert.equal(new Set(f.selection.map(q=>q.id)).size,count);assert.equal(rankCharacters(scoreAnswers(f.selection,f.answers))[0].character.id,f.characterId)}
 }
});
test('完全均衡的回答明确提示未形成第一匹配',()=>{const r=makeReport(Array(8).fill(50));assert.equal(r.balanced,true);assert.match(r.reflection,/尚未形成明确/)});
test('对外结果只暴露角色名字，不暴露匹配细节',()=>{const r=publicReport(makeReport(characters[0].vector));assert.deepEqual(Object.keys(r.character),['id','name']);assert.equal('scores' in r,false);assert.equal('overlaps' in r,false);assert.equal('vector' in r.character,false)});
