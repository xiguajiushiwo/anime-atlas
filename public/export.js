export function renderReportImage(report,dimensions,portraitImage=null){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),W=1080,M=64,inner=W-M*2;
 const font=(size,weight=400)=>`${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
 const lines=(text,width,size,weight=400)=>{ctx.font=font(size,weight);const out=[];for(const paragraph of String(text).split('\n')){let line='';for(const char of paragraph){if(line&&ctx.measureText(line+char).width>width){out.push(line);line=char}else line+=char}out.push(line)}return out};
 const h=(text,width=inner-68,size=24,line=42)=>lines(text,width,size).length*line;
 const commonHeight=130+report.overlaps.reduce((n,x)=>n+55+h(x.text,inner-68,24,42)+25,0);
 const differenceHeight=140+h(report.difference.text);
 const practiceHeight=145+[['值得保留的优势',report.character.strength],['可以留意的盲点',report.character.blind],['给下一周的小练习',report.character.practice]].reduce((n,[t,body])=>n+52+h(body)+32,0);
 const introHeight=580+h(report.character.summary,inner-90,26,44);
 canvas.width=W;canvas.height=Math.ceil(M+introHeight+28+750+28+commonHeight+28+differenceHeight+28+practiceHeight+28+(report.alternatives.length?290:0)+210);
 const rect=(x,y,w,height,r,fill)=>{ctx.beginPath();ctx.roundRect(x,y,w,height,r);ctx.fillStyle=fill;ctx.fill()};
 const text=(value,x,y,size=24,color='#252821',weight=400)=>{ctx.font=font(size,weight);ctx.fillStyle=color;ctx.textBaseline='top';ctx.textAlign='left';ctx.fillText(String(value),x,y)};
 const para=(value,x,y,width=inner-68,size=24,line=42,color='#747969',weight=400)=>{for(const row of lines(value,width,size,weight)){text(row,x,y,size,color,weight);y+=line}return y};
 const section=(title,y,height)=>{rect(M,y,inner,height,24,'#fffef9');text(title,M+34,y+32,29,'#252821',700);return y+96};
 ctx.fillStyle='#f1eee5';ctx.fillRect(0,0,W,canvas.height);
 let y=M;rect(M,y,inner,introHeight,26,'#fffef9');text('✳  次元来信  /  ANIMA LETTER',M+42,y+35,22,'#6f7860',700);text(report.sample?'示例报告 · 非个人测试结果':'在另一个宇宙，遇见另一面的你。',M+42,y+88,23,'#7c7f73');
 rect(M+42,y+155,inner-84,180,16,report.character.color);if(portraitImage){ctx.save();ctx.beginPath();ctx.roundRect(M+inner-84-170,y+155,170,180,16);ctx.clip();ctx.drawImage(portraitImage,M+inner-84-170,y+155,170,180);ctx.restore()}text(report.character.name,M+70,y+187,47,'#fffef9',800);text(report.character.work,M+72,y+263,25,'#fffef9');
 text(report.character.tag,M+42,y+370,32,'#252821',700);let summaryY=para(report.character.summary,M+42,y+425,inner-90,26,44);
 text(`${report.matchIndex} / 100`,M+42,summaryY+26,47,'#252821',700);text('规则匹配指数 · 不代表心理测量准确率',M+310,summaryY+46,19,'#7c7f73');y+=introHeight+28;
 let body=section('01  你的故事倾向',y,750);text('没有好坏之分，是这一轮选择的不同侧面。',M+34,body,21,'#7c7f73');body+=65;
 dimensions.forEach((d,i)=>{const row=body+i*68;text(d.name,M+34,row,24);rect(M+165,row+7,inner-270,15,8,'#eeeee6');rect(M+165,row+7,(inner-270)*report.scores[i]/100,15,8,d.color);text(report.scores[i],M+inner-65,row-1,24);text(d.low+'  ←  →  '+d.high,M+165,row+31,15,'#8d9280')});y+=750+28;
 body=section('02  你们共鸣的地方',y,commonHeight);report.overlaps.forEach((x,i)=>{text(`0${i+1} · ${x.dimension}`,M+34,body,25,'#78864e',700);body+=49;body=para(x.text+'。',M+34,body)+29});y+=commonHeight+28;
 body=section('03  你也有自己的部分',y,differenceHeight);para(report.difference.text,M+34,body);y+=differenceHeight+28;
 body=section('04  把这封来信带回日常',y,practiceHeight);for(const [title,value] of [['值得保留的优势',report.character.strength],['可以留意的盲点',report.character.blind],['给下一周的小练习',report.character.practice]]){text(title,M+34,body,25,'#252821',700);body+=48;body=para(value,M+34,body)+35}y+=practiceHeight+28;
 if(report.alternatives.length){body=section('05  另外的可能',y,290);report.alternatives.forEach((a,i)=>{const x=M+34+i*(inner-68)/2;rect(x,body+4,55,72,10,a.character.color);text(a.character.name,x+73,body+3,24,'#252821',700);text(a.character.work,x+73,body+44,18,'#7c7f73');text(`匹配指数 ${a.matchIndex} / 100`,x+73,body+78,18,'#7c7f73')});y+=290}
 para(report.reflection,M+8,y+40,inner-16,18,32);para('非官方趣味性格探索 · 非心理诊断 · 角色相关权利归各自权利人所有。',M+8,y+125,inner-16,16,28);return canvas;
}
