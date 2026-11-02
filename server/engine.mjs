import { characters, dimensions, modes } from '../data/characters.mjs';
import { questions, categories } from '../data/questions.mjs';
export const questionMap = new Map(questions.map(q=>[q.id,q]));
export function shuffle(items, random=Math.random) { const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a; }
export function secureRandom(){const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]/4294967296;}
export function selectQuestions(count, recent=[], random=secureRandom){
  if(![12,24,36].includes(count))throw new Error('不支持的测试长度');
  const used=new Set(recent), selected=[];
  for(const category of categories){const pool=questions.filter(q=>q.category===category);const fresh=shuffle(pool.filter(q=>!used.has(q.id)),random);const previous=shuffle(pool.filter(q=>used.has(q.id)),random);selected.push(...fresh.concat(previous).slice(0,count/6))}
  return shuffle(selected,random).map(q=>({id:q.id,order:shuffle(q.options.map(o=>o.id),random)}));
}
export function presentQuestions(selection){return selection.map(({id,order})=>{const q=questionMap.get(id);return{id,category:q.category,kind:q.kind||'choice',text:q.text,options:order.map(oid=>({id:oid,label:q.options.find(o=>o.id===oid).label}))}})}
export function scoreAnswers(selection, answers){
  if(!answers||typeof answers!=='object'||Array.isArray(answers)||Object.keys(answers).length!==selection.length)throw new Error('请完成全部题目后再生成档案');
  const sums=Array(8).fill(0),den=Array(8).fill(0);
  for(const {id} of selection){const q=questionMap.get(id);const option=q?.options.find(o=>o.id===answers[id]);if(!option)throw new Error('答案不完整或格式不正确');option.weights.forEach((v,i)=>{sums[i]+=v;den[i]+=Math.max(...q.options.map(o=>Math.abs(o.weights[i])))});}
  return sums.map((v,i)=>Math.round(50+50*v/(den[i]+2)));
}
// Match the relative shape of eight tendencies. Absolute scale is not a population percentile.
export function signature(vector){const avg=vector.reduce((a,b)=>a+b,0)/8;const centered=vector.map(v=>v-avg);const norm=Math.hypot(...centered);return norm<1e-9?centered:centered.map(v=>v/norm);}
// 第二层匹配把八维分成行动、关系、思考和自主四组，避免只有相对轮廓相似、但整体投入强度完全不同的角色排在一起。
export function matchAxes(vector){return [
  (vector[0]+vector[6])/200,
  (vector[1]+vector[4]+vector[7])/300,
  (vector[2]+vector[5])/200,
  vector[3]/100,
];}
function profileDistance(a,b){return Math.hypot(...matchAxes(a).map((v,i)=>v-matchAxes(b)[i]))/2;}
export function rankCharacters(scores, preferences={}){
  const pool=characters.filter(c=>(!preferences.work||preferences.work==='all'||c.work===preferences.work)&&(!preferences.gender||preferences.gender==='all'||c.gender===preferences.gender));
  if(!pool.length)throw new Error('这个筛选组合暂时没有角色，请放宽筛选范围');
  const v=signature(scores);
  return pool.map(c=>{const shapeDistance=Math.hypot(...v.map((x,i)=>x-signature(c.vector)[i]));const intensityDistance=profileDistance(scores,c.vector);const distance=shapeDistance*.88+intensityDistance*.12;return{character:c,distance,shapeDistance,intensityDistance,index:Math.round(Math.max(0,1-distance/2)*100)}}).sort((a,b)=>a.distance-b.distance||a.character.id.localeCompare(b.character.id));
}
const signals=[
 ['行动之前会给自己一点观察时间','遇到事情，你更愿意先行动再调整'],
 ['你会保留客观距离，再决定如何靠近','你很容易注意到别人没有说出口的感受'],
 ['你给临场变化留了较大的空间','你倾向于先理清关系和步骤，再推进事情'],
 ['你更愿意在共同的节奏里发挥力量','你很重视自己的判断，不轻易被外界带走'],
 ['你习惯把心意留在细节与行动里','你愿意让想法被听见，也用表达推动关系'],
 ['你更愿意把熟悉的事情做深、做扎实','未知会吸引你，你愿意尝试新的路径'],
 ['你会根据状态及时调整，不把坚持当唯一答案','对认定的事，你愿意反复练习、持续投入'],
 ['你尊重每个人的空间与自主承担','有人需要支持时，你倾向于主动接住责任'],
];
function publicCharacter(c){
  const allowed=['id','name','work','gender','tag','color','summary','strength','blind','practice','scene'];
  return Object.fromEntries(allowed.filter(key=>key in c).map(key=>[key,c[key]]));
}
export function makeReport(scores, preferences={}, mode='standard'){
  const ranked=rankCharacters(scores,preferences),best=ranked[0],char=best.character;
  const userSig=signature(scores),charSig=signature(char.vector),balanced=Math.max(...scores)-Math.min(...scores)<=4;
  const overlaps=dimensions.map((d,i)=>({dimension:d.name,text:signals[i][scores[i]>=50?1:0],delta:Math.abs(userSig[i]-charSig[i]),strength:Math.abs(userSig[i])+Math.abs(charSig[i]),value:scores[i]})).sort((a,b)=>(a.delta-a.strength*.3)-(b.delta-b.strength*.3)).slice(0,3);
  const distinct=dimensions.map((d,i)=>({name:d.name,delta:Math.abs(userSig[i]-charSig[i]),value:scores[i],text:signals[i][scores[i]>=50?1:0]})).sort((a,b)=>b.delta-a.delta)[0];
  return {version:2,createdAt:new Date().toISOString(),mode,balanced,questionCount:modes.find(x=>x.id===mode)?.count||24,character:publicCharacter(char),matchIndex:best.index,
    alternatives:ranked.slice(1,3).map(r=>({character:publicCharacter(r.character),matchIndex:r.index})),scores,overlaps,
    difference:{dimension:distinct.name,text:`你与${char.name}并不完全相同。在「${distinct.name}」方面，${distinct.text}。这部分差异同样值得保留。`},
    closeMatch:ranked.length>1&&best.index-ranked[1].index<=3,
    reflection:balanced?'本轮八维倾向十分接近，尚未形成明确的第一匹配。这里的角色仅供探索，不宜把排序解读为确定结论。':mode==='light'?'这是一份轻量观察。增加情境数量，有助于看到更多面的自己。':'这是你在本轮情境中的倾向快照。不同阶段、不同经历，都可能让选择发生变化。',
    disclaimer:'趣味性的故事角色探索，不是心理诊断。角色解读用于帮助你观察本轮选择。'};
}
export function publicReport(report){
  return {version:report.version,createdAt:report.createdAt,mode:report.mode,questionCount:report.questionCount,character:{id:report.character.id,name:report.character.name}};
}
export function catalog(){return characters.map(c=>publicCharacter(c))}
