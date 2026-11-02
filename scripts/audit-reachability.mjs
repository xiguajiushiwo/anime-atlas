import fs from 'node:fs';
import {characters} from '../data/characters.mjs';
import {selectQuestions,questionMap,signature,rankCharacters,scoreAnswers,shuffle} from '../server/engine.mjs';
import {categories,questions} from '../data/questions.mjs';
const questionCount=Number(process.argv[2]||36);
if(![24,36,60,90].includes(questionCount))throw new Error('Audit supports 24, 36, 60 and 90 questions');
let seed=482971;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
// Long runs can trap coordinate descent in local minima. Independently try extending a
// verified shorter run with distinct real questions that offer the same option weights.
// This changes only the audit search, never production scoring or sampling.
const shortWitnesses=questionCount>36?JSON.parse(fs.readFileSync(new URL('../tests/fixtures/reachable.json',import.meta.url),'utf8')):[];
const pattern=q=>q.category+JSON.stringify(q.options.map(o=>o.weights));
const equivalent=new Map();
for(const q of questions){const key=pattern(q);if(!equivalent.has(key))equivalent.set(key,[]);equivalent.get(key).push(q)}
function extendWitness(characterId){
 const source=shortWitnesses.find(w=>w.characterId===characterId);if(!source)return null;
 for(let attempt=0;attempt<1000;attempt++){
  const selection=[],answers={},used=new Set();let possible=true;
  for(const category of categories){
   const samples=source.selection.filter(s=>questionMap.get(s.id).category===category);let deck=[];
   for(let i=0;i<questionCount/6;i++){
    if(!deck.length)deck=shuffle(samples,random);
    const s=deck.pop(),original=questionMap.get(s.id),pool=equivalent.get(pattern(original)).filter(q=>!used.has(q.id));
    if(!pool.length){possible=false;break}
    const q=pool[Math.floor(random()*pool.length)],index=original.options.findIndex(o=>o.id===source.answers[s.id]);
    used.add(q.id);selection.push({id:q.id,order:shuffle(q.options.map(o=>o.id),random)});answers[q.id]=q.options[index].id;
   }
   if(!possible)break;
  }
  if(possible&&rankCharacters(scoreAnswers(selection,answers))[0].character.id===characterId)return{characterId,selection:shuffle(selection,random),answers};
 }
 return null;
}
const witnesses=[],failed=[];
for(const character of characters){
 const target=signature(character.vector);let witness=null,bestLoss=Infinity;
 for(let attempt=0;attempt<600&&!witness;attempt++){
  const selection=selectQuestions(questionCount,[],random),qs=selection.map(s=>questionMap.get(s.id));
  const den=Array.from({length:8},(_,i)=>2+qs.reduce((s,q)=>s+Math.max(...q.options.map(o=>Math.abs(o.weights[i]))),0));
  const choices=qs.map(q=>Math.floor(random()*q.options.length));let sums=Array.from({length:8},(_,i)=>qs.reduce((s,q,j)=>s+q.options[choices[j]].weights[i],0));
  const score=s=>s.map((v,i)=>Math.round(50+50*v/den[i]));
  const loss=s=>{const v=signature(score(s));return v.reduce((n,x,i)=>n+(x-target[i])**2,0)};
  for(let round=0;round<50;round++){
   let changed=false;
   for(let j=0;j<qs.length;j++){
    const old=qs[j].options[choices[j]].weights;let best=choices[j],value=loss(sums),bestSums=sums;
    for(let option=0;option<qs[j].options.length;option++){if(option===choices[j])continue;const next=sums.map((s,i)=>s-old[i]+qs[j].options[option].weights[i]),v=loss(next);if(v<value-1e-10){value=v;best=option;bestSums=next}}
    if(best!==choices[j]){choices[j]=best;sums=bestSums;changed=true}
   }
   const scores=score(sums),ranked=rankCharacters(scores);bestLoss=Math.min(bestLoss,loss(sums));
   if(ranked[0].character.id===character.id){const answers=Object.fromEntries(qs.map((q,i)=>[q.id,String(choices[i])]));if(JSON.stringify(scoreAnswers(selection,answers))!==JSON.stringify(scores))throw new Error('Audit scoring mismatch');witness={characterId:character.id,selection,answers};break}
   if(!changed)break;
  }
 }
 if(!witness)witness=extendWitness(character.id);
 if(witness){witnesses.push(witness);console.log(`OK ${character.id}`)}else{failed.push({id:character.id,bestLoss});console.log(`UNREACHED ${character.id} loss=${bestLoss}`)}
}
fs.mkdirSync(new URL('../tests/fixtures/',import.meta.url),{recursive:true});
const fixture=questionCount===36?'reachable.json':questionCount===24?'reachable-standard.json':`reachable-${questionCount}.json`;
fs.writeFileSync(new URL('../tests/fixtures/'+fixture,import.meta.url),JSON.stringify(witnesses));
console.log(JSON.stringify({questionCount,reached:witnesses.length,total:characters.length,failed}));if(failed.length)process.exitCode=1;
