import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {characters} from '../data/characters.mjs';
import {categories} from '../data/questions.mjs';
import {questionMap,scoreAnswers,rankCharacters,makeReport,publicReport} from '../server/engine.mjs';

const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/reachable-60.json',import.meta.url),'utf8'));
const reportFor=(w,answers=w.answers)=>publicReport(makeReport(scoreAnswers(w.selection,answers),{},'full',{selection:w.selection,answers}));
test('报告的六类分析和全部回顾均来自本轮真实答案',()=>{
 for(const w of [fixtures[0],fixtures.find(w=>w.characterId==='homura')]){
  const r=reportFor(w),a=r.analysis;assert.equal(r.version,3);assert.equal(r.questionCount,60);
  assert.deepEqual(a.chapters.map(c=>c.category),categories);assert.equal(a.recap.length,60);
  for(const e of [...a.recap,...a.chapters,...a.resonance.map(x=>x.evidence),a.difference.evidence]){
   const q=questionMap.get(e.questionId);assert.ok(w.selection.some(s=>s.id===q.id));
   assert.equal(e.prompt,q.text);assert.equal(e.category,q.category);assert.equal(e.choice,q.options.find(o=>o.id===w.answers[q.id]).label);
  }
  assert.deepEqual(reportFor(w).analysis,a,'同一份答案的分析稳定，不随机改写');
  const forbidden=new Set(['weights','vector','scores','sourceUrl','matchIndex','distance','focus']);
  function inspect(v){if(v&&typeof v==='object')for(const [key,value] of Object.entries(v)){assert.ok(!forbidden.has(key),key);inspect(value)}}inspect(r);
 }
});
test('同一个角色也能因实际答案变化而产生不同分析正文',()=>{
 const w=fixtures[0],original=reportFor(w);let variation=null;
 for(const s of w.selection){
  for(const o of questionMap.get(s.id).options){
   if(o.id===w.answers[s.id])continue;
   const answers={...w.answers,[s.id]:o.id};
   if(rankCharacters(scoreAnswers(w.selection,answers))[0].character.id!==w.characterId)continue;
   const next=reportFor(w,answers);
   if(JSON.stringify(next.analysis.chapters.map(c=>c.text))!==JSON.stringify(original.analysis.chapters.map(c=>c.text))){variation=next;break}
  }
  if(variation)break;
 }
 assert.ok(variation,'应存在同人物、不同答案和分析的实际组合');
 assert.equal(variation.character.id,original.character.id);assert.notDeepEqual(variation.analysis.recap,original.analysis.recap);
});
test('接近均衡时不用强烈倾向解释，旧报告不捏造答题依据',()=>{
 const w=fixtures[0],balanced=makeReport(Array(8).fill(50),{},'full',{selection:w.selection,answers:w.answers});
 assert.match(balanced.analysis.introduction,/比较接近/);
 const old=publicReport(makeReport(characters[0].vector,{},'standard'));
 assert.equal(old.version,2);assert.equal(old.questionCount,24);assert.equal('analysis' in old,false);
});
