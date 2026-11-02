import {categories} from '../data/questions.mjs';

// Editorial descriptions of answer tendencies; they are not psychological diagnoses.
// Each pole has a title, interpretation, contribution and a small practical suggestion.
const poles = [
  [
    ['先看清，再出发','先留出观察和确认的时间','为仓促的决定留一道缓冲','试着为观察设一个结束时间，再完成一个小步骤。'],
    ['把故事推向下一幕','先行动，再根据反馈调整','让停在原地的事情开始发生','下一次抢先行动前，用一句话确认风险和退路。'],
  ],
  [
    ['保留一点观察距离','先保持距离、核实情况，再决定如何靠近','让判断不完全被现场情绪带走','核实事情时，也问对方一句“你现在最需要什么”。'],
    ['先听见人的声音','先注意同伴的感受和需要','让容易被忽略的人进入讨论','关心别人之前，也确认这件事有没有超出自己的精力。'],
  ],
  [
    ['给意外留一个位置','给临场变化和直觉多留一些空间','在计划失效时保持转弯的余地','即兴开始前，先记住一个必须完成的目标。'],
    ['把线索连成路线','先整理信息、步骤和可能的后果','把复杂的局面拆成可以处理的小事','准备好基本方案后，允许自己带着一个尚未解开的疑问出发。'],
  ],
  [
    ['在并肩中找到方向','先照顾共同的节奏，寻找能一起走的路线','让个人行动和伙伴的步伐相互接得上','商量共同方案时，也明确说出一个属于自己的偏好。'],
    ['守住自己的坐标','保留自己的判断与选择空间','在外界期待里记住自己真正想做的事','坚持自己的路线时，告诉同伴理由和你愿意协商的部分。'],
  ],
  [
    ['把心意藏进行动','先用观察、倾听或具体行动回应','让支持落在细节里，不必每次都站到聚光灯下','让一个重要的人知道你做这件小事的心意，不必等对方猜到。'],
    ['让想法被听见','主动表达疑问、愿望或感受','让沉默中的信息真正进入讨论','说出自己的想法后，留一段时间听对方把话讲完。'],
  ],
  [
    ['把熟悉的路走深','先用熟悉的方法，把已有的事情做扎实','在变化中保留可靠的经验和节奏','在熟悉的办法旁边，加一次成本很小的新尝试。'],
    ['为未知留一扇门','调查未知，尝试没有完全验证过的路径','发现原本不在计划里的可能性','选择一个新方向后，先写清楚这次探索想找到什么。'],
  ],
  [
    ['让调整也成为前进','根据状态调整节奏，不把硬撑当作唯一办法','在消耗累积前保留重新出发的能力','停下来时，顺手约定一个可以重新开始的小节点。'],
    ['把认定的事走到底','继续练习、复盘或坚持一个认定的目标','把短暂的热情变成可持续的积累','继续投入前，检查目标是否仍值得，以及身体是否需要休息。'],
  ],
  [
    ['给彼此留下空间','让每个人保留选择权和承担自己事情的空间','减少替别人做决定，也守住彼此的边界','保留边界时，说明你愿意提供哪一种具体帮助。'],
    ['替同行的人留一盏灯','优先守住伙伴、安全或共同的承诺','在关键时刻让同行的人知道有人愿意承担','接下责任时，把其中一件可以分担的事交给可靠的伙伴。'],
  ],
];
const offsets=scores=>scores.map(v=>v-50);
function focus(scores){return offsets(scores).map((v,i)=>({i,side:v>=0?1:0,value:Math.abs(v)})).sort((a,b)=>b.value-a.value||a.i-b.i)[0]}
function tendency(f){return poles[f.i][f.side]}
function summarize(rows){
  return Array.from({length:8},(_,i)=>{
    const sum=rows.reduce((n,r)=>n+r.option.weights[i],0);
    const den=2+rows.reduce((n,r)=>n+Math.max(...r.question.options.map(o=>Math.abs(o.weights[i]))),0);
    return Math.round(50+50*sum/den);
  });
}
function evidence(rows,f){
  const sign=f.side?1:-1;
  const ranked=rows.map((r,index)=>({r,index,value:sign*r.option.weights[f.i]})).sort((a,b)=>b.value-a.value||a.index-b.index);
  return ranked[0].r;
}
const quote=r=>({questionId:r.question.id,category:r.question.category,prompt:r.question.text,choice:r.option.label});

export function buildAnalysis(character,scores,rows){
  if(!rows.length)return null;
  const primary=focus(scores),[title,meaning,contribution,practice]=tendency(primary);
  const balanced=Math.max(...scores)-Math.min(...scores)<=4;
  const subtle=primary.value<6;
  const chapters=categories.map(category=>{
    const subset=rows.filter(r=>r.question.category===category);
    if(!subset.length)return null;
    const f=focus(summarize(subset)),[heading,description]=tendency(f),example=evidence(subset,f);
    const aligned=subset.filter(r=>(f.side?1:-1)*r.option.weights[f.i]>0).length;
    return {category,title:f.value<6?'这里的选择，没有单一方向':heading,
      text:f.value<6?'在这一组故事中，你的选择分散在不同方向。与其给它一个固定标签，更值得看见你在具体处境里如何改变优先顺序。':`这组 ${subset.length} 道题里，有 ${aligned} 次选择体现了“${description}”的侧重。下面这一幕，是其中一个具体落点。`,
      ...quote(example),focus:f};
  }).filter(Boolean);
  const shared=offsets(scores).map((value,i)=>({i,side:value>=0?1:0,value:Math.abs(value)}))
    .filter(f=>f.value>=6&&(character.vector[f.i]-50)*(f.side?1:-1)>0)
    .sort((a,b)=>b.value-a.value||a.i-b.i).slice(0,2);
  const resonance=shared.map(f=>({title:tendency(f)[0],text:`在这份角色解读中，${character.name}也有“${tendency(f)[1]}”的一面。你的本轮选择在这里产生了共鸣，但这不代表你们在所有事情上都相同。`,evidence:quote(evidence(rows,f))}));
  const counter=chapters.find(c=>c.focus.value>=6&&(c.focus.i!==primary.i||c.focus.side!==primary.side));
  const difference=counter?{title:'相似之外，你也会换一种选择',text:`整体上，你更倾向于${meaning}。但到了「${counter.category}」这组题，你的侧重变成了${tendency(counter.focus)[1]}。这种随处境变化的部分，也属于你，不必把自己装进一个角色的全部设定。`,evidence:{questionId:counter.questionId,category:counter.category,prompt:counter.prompt,choice:counter.choice}}
    :{title:'一个名字，装不下你的全部',text:`本轮不同场景里的选择比较一致，暂时没有明显的转向。${character.name}是这次故事的参照；你在每一幕里选择的具体做法，才是这封来信的内容。`,evidence:quote(evidence(rows,primary))};
  if(balanced||subtle){difference.text='本轮选择没有形成特别突出的单一方向，因此角色只是这次探索的一个参照。下面这些具体选择，比一个固定标签更能说明你如何回应不同处境。';}
  return {
    title:balanced||subtle?'一封拥有不止一种方向的来信':title,
    introduction:balanced||subtle?`这次，你与${character.name}相遇。你的选择分布得比较接近，可以先读一读各个场景，再决定哪些描述与你有共鸣。`:`这次，你与${character.name}相遇。贯穿这轮选择的一条线索是：${meaning}。接下来这封信，会从你真正选过的答案里，看看这份共鸣怎样发生。`,
    resonance,
    difference,
    chapters:chapters.map(({focus,...chapter})=>chapter),
    strength:{title:balanced||subtle?'值得留意的选择':title,text:balanced||subtle?'你在不同情节里留下了不同方向的答案。挑出一个最在意的选择，想想自己当时优先保护了什么。':`本轮这些选择可能带来的贡献是：${contribution}。这是一种在故事里出现的倾向，是否也适合你的日常，还要由你自己判断。`},
    growth:{title:'把来信带回日常',text:balanced||subtle?'选出本轮最犹豫的一道题，分别写下两个选项各自在保护什么。不急着找出“正确的自己”。':practice},
    closing:'角色是这一刻的共鸣，选择仍然在你手里。下次重逢，也可以从另一条路开始。',
    recap:rows.map(quote),
  };
}

// Explicit response allowlist: never return option weights, character vectors or scoring internals.
export function publicAnalysis(a){
  const pair=v=>({title:v.title,text:v.text});
  const evidence=v=>({questionId:v.questionId,category:v.category,prompt:v.prompt,choice:v.choice});
  return {title:a.title,introduction:a.introduction,resonance:a.resonance.map(v=>({...pair(v),evidence:evidence(v.evidence)})),
    difference:{...pair(a.difference),evidence:evidence(a.difference.evidence)},
    chapters:a.chapters.map(v=>({...pair(v),...evidence(v)})),strength:pair(a.strength),growth:pair(a.growth),closing:a.closing,recap:a.recap.map(evidence)};
}
