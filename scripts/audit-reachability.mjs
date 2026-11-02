import fs from 'node:fs';
import {characters} from '../data/characters.mjs';
import {selectQuestions,questionMap,signature,rankCharacters,scoreAnswers} from '../server/engine.mjs';
const questionCount=Number(process.argv[2]||36);
if(![24,36].includes(questionCount))throw new Error('Audit supports the standard (24) and deep (36) modes');
let seed=482971;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
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
 if(witness){witnesses.push(witness);console.log(`OK ${character.id}`)}else{failed.push({id:character.id,bestLoss});console.log(`UNREACHED ${character.id} loss=${bestLoss}`)}
}
fs.mkdirSync(new URL('../tests/fixtures/',import.meta.url),{recursive:true});
const fixture=questionCount===36?'reachable.json':'reachable-standard.json';
fs.writeFileSync(new URL('../tests/fixtures/'+fixture,import.meta.url),JSON.stringify(witnesses));
console.log(JSON.stringify({questionCount,reached:witnesses.length,total:characters.length,failed}));if(failed.length)process.exitCode=1;
