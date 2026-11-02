// Uses only the public report. No matching parameters or full answer recap enter the share image.
export function renderReportImage(report){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),W=1080,M=66,inner=W-M*2;
 const font=(size,weight=400)=>`${weight} ${size}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
 const wrap=(value,size,width,weight=400)=>{ctx.font=font(size,weight);return String(value).split('\n').flatMap(paragraph=>{const rows=[];let line='';for(const c of paragraph){if(line&&ctx.measureText(line+c).width>width){rows.push(line);line=c}else line+=c}rows.push(line);return rows})};
 const blocks=[];
 const add=(value,size=26,color='#75687f',weight=400,gap=22)=>{if(value)blocks.push({rows:wrap(value,size,inner-76,weight),size,color,weight,gap,line:Math.ceil(size*1.75)})};
 add('次元来信  /  ANIMA LETTER',24,'#8e77a1',600,38);
 add('这一次，你遇见的是',24,'#9986a8',400,12);
 add(report.character.name,54,'#3d3047',700,28);
 const a=report.analysis;
 if(a){
  add(a.title,32,'#725785',600,16);add(a.introduction);
  const section=(number,title)=>{add(number+'  /  '+title,30,'#3d3047',600,24)};
  const entry=r=>{add(r.title,27,'#725785',600,12);add(r.text,24);if(r.evidence){add(r.evidence.prompt,21,'#9988a4',400,10);add('你的选择：'+r.evidence.choice,23,'#725785',400,32)}};
  section('01','故事里的共鸣');a.resonance.forEach(entry);entry(a.difference);
  section('02','走进不同的故事');a.chapters.forEach(r=>{add(r.category,21,'#9988a4',500,8);entry({...r,evidence:r})});
  section('03','从故事回到日常');entry(a.strength);entry(a.growth);add(a.closing,25,'#725785',500,28);
 }
 add(`${report.questionCount} 次选择 · 一封属于这一刻的来信`,20,'#9988a4',400,12);
 add('本轮选择的趣味解读 · 次元来信',20,'#9988a4',400,0);
 canvas.width=W;canvas.height=Math.ceil(M*2+76+blocks.reduce((h,b)=>h+b.rows.length*b.line+b.gap,0));
 ctx.fillStyle='#f7f3ec';ctx.fillRect(0,0,W,canvas.height);ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.roundRect(M,M,inner,canvas.height-M*2,22);ctx.fill();
 ctx.fillStyle='#d7c5e5';ctx.fillRect(M+38,M+24,inner-76,5);
 let y=M+48;
 for(const b of blocks){ctx.font=font(b.size,b.weight);ctx.fillStyle=b.color;ctx.textBaseline='top';for(const row of b.rows){ctx.fillText(row,M+38,y);y+=b.line}y+=b.gap}
 return canvas;
}
