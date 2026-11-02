export const categories=['世界与归属','信念与代价','羁绊与协作','能力与战斗','剧情与成长','舞台与日常'];
const weights={
 move:[2,-1,-1,1,1,0,1,0],care:[-1,2,0,-1,0,0,0,1],plan:[-1,0,2,0,-1,1,1,1],
 free:[0,-1,0,2,0,1,0,-1],speak:[1,0,0,0,2,0,0,0],explore:[1,0,0,1,0,2,-1,-1],
 persist:[0,0,1,0,-1,-1,2,1],protect:[1,1,1,-1,-1,-1,1,2],listen:[-1,2,1,0,-2,0,0,0],
 bridge:[0,2,1,-1,2,0,0,1],boundary:[0,-1,1,2,1,-1,0,-1],adapt:[1,1,0,0,1,2,-1,0],
 rest:[-2,1,0,1,-1,0,-2,-1],learn:[-1,0,2,1,-1,2,1,0],honest:[0,1,0,1,2,0,0,0],
 steady:[-1,1,1,-1,-1,-1,2,2],experiment:[2,0,1,1,0,2,0,-1],lead:[2,0,2,0,2,0,1,2],
 quiet:[-1,1,1,1,-2,1,1,0],support:[0,2,0,-1,-1,0,1,2],play:[1,1,-1,1,2,2,-1,-1],
 craft:[0,0,2,1,-1,1,2,0],negotiate:[0,1,2,0,2,0,1,1],trust:[1,2,-1,-1,1,1,0,1],
 risk:[2,-1,0,1,0,1,1,-1],observe:[-1,1,2,0,-1,1,0,0],
};
const all={
 move:['先走一步，让现场给你答案','move'],plan:['先看地图、线索和退路','plan'],care:['先确认同行者是否还好','care'],explore:['沿着没人走过的方向看看','explore'],
 free:['按自己的判断改变路线','free'],boundary:['守住不能越过的底线','boundary'],learn:['先查清楚它为什么这样运转','learn'],speak:['把疑问直接说出来','speak'],
 listen:['给对方空间，告诉他我在','listen'],bridge:['把不同的人拉到同一张桌前','bridge'],support:['先接过一件实际的事','support'],trust:['把选择权交给对方，相信他的决定','trust'],
 craft:['重复练习最关键的基本动作','craft'],risk:['先试一次高风险的新招','risk'],observe:['观察对手和环境再出手','observe'],protect:['优先保护队友和撤退路线','protect'],
 persist:['认定值得，就继续练下去','persist'],adapt:['换一种方式，保留目标','adapt'],rest:['先恢复状态，不把逞强当勇敢','rest'],experiment:['做一个小规模试验','experiment'],
 play:['把它变成一场有趣的即兴演出','play'],quiet:['找个安静角落独自整理','quiet'],honest:['把真实感受说清楚','honest'],negotiate:['和大家约定一个都能接受的版本','negotiate'],
 share:['把这份喜悦分给一起走来的人','support'],
 lead:['站出来把方向和分工定下来','lead'],steady:['按既定节奏把基本功做稳','steady'],
};
const sets={
 a:['move','plan','care','explore'],b:['free','negotiate','trust','boundary'],c:['protect','craft','explore','quiet'],d:['honest','speak','listen','boundary'],
 e:['play','observe','quiet','speak'],f:['explore','learn','risk','plan'],g:['honest','care','free','trust'],h:['learn','boundary','bridge','adapt'],
 i:['protect','free','honest','rest'],j:['care','negotiate','support','quiet'],k:['observe','explore','care','speak'],l:['boundary','negotiate','protect','risk'],
 m:['learn','free','persist','rest'],n:['speak','boundary','care','experiment'],o:['craft','risk','negotiate','boundary'],p:['speak','support','quiet','honest'],
 q:['bridge','observe','trust','plan'],r:['care','boundary','support','honest'],s:['trust','craft','protect','explore'],t:['lead','bridge','move','plan'],
 u:['observe','care','support','quiet'],v:['honest','speak','bridge','quiet'],w:['trust','boundary','negotiate','protect'],x:['care','learn','boundary','support'],
 y:['protect','negotiate','lead','trust'],z:['listen','care','support','quiet'],aa:['support','bridge','honest','play'],ab:['speak','listen','trust','protect'],
 ac:['adapt','risk','observe','craft'],ad:['move','steady','craft','explore'],ae:['protect','rest','learn','boundary'],af:['observe','boundary','risk','quiet'],
 ag:['negotiate','adapt','craft','trust'],ah:['craft','plan','rest','move'],ai:['persist','learn','honest','quiet'],aj:['risk','free','craft','boundary'],
 ak:['care','learn','boundary','trust'],al:['rest','observe','honest','protect'],am:['move','lead','observe','protect'],an:['risk','craft','negotiate','protect'],
 ao:['honest','persist','adapt','quiet'],ap:['lead','learn','trust','free'],aq:['persist','observe','rest','risk'],ar:['care','honest','learn','boundary'],
 as:['rest','learn','free','persist'],at:['speak','play','quiet','honest'],au:['support','rest','quiet','play'],av:['speak','persist','learn','boundary'],
 aw:['observe','trust','negotiate','boundary'],ax:['adapt','honest','free','persist'],ay:['care','rest','explore','honest'],az:['experiment','explore','plan','play'],
 ba:['craft','rest','support','move'],bb:['play','quiet','learn','support'],bc:['care','play','craft','observe'],bd:['plan','care','experiment','support'],
 be:['speak','quiet','play','honest'],bf:['craft','care','free','explore'],bg:['play','trust','rest','risk'],bh:['care','play','quiet','honest'],
 bi:['move','observe','speak','support'],bj:['honest','play','quiet','persist'],bk:['protect','craft','care','free'],bl:['share','quiet','play','support'],
};
sets.au=['support','quiet','play','honest']; // alias for the final card
const q=(id,cat,text,kind,keys)=>{const usable=keys.filter(k=>all[k]);const selected=kind==='line'?usable.slice(0,2):usable;return {id,category:cat,text,kind,options:selected.map((k,i)=>({id:String(i),label:all[k][0],weights:weights[all[k][1]]}))};};
const raw=[
 ['世界与归属',[
 ['你第一次踏进一座陌生城镇，发现这里的人都在躲着同一个传闻。','scene','a'],['冒险队伍给你留了一个空位，但入队条件和你的习惯不太一样。','dilemma','b'],['穿过结界只能带一件东西，你会带什么？','card','c'],['你被误认为来自敌对阵营，解释机会只有一句话。','line','d'],['村庄庆典的面具让每个人都能暂时成为另一个身份。','resonance','e'],['地图上出现一块没有被记录的空白。','choice','f'],['新的伙伴问你“为什么要和我们一起走”。','line','g'],['你发现故乡的传说和现实并不一样。','dilemma','h'],['一扇门只会为真正想回去的人打开。','resonance','i'],['旅店老板把最后一间房让给了你们，却不肯收钱。','choice','j'],['两个世界短暂相连，只有一个人能留下。','dilemma','l'],['你终于看见一直想看的海、天空或墙外。','resonance','k']]],
 ['信念与代价',[
 ['敌人提出一个能立刻结束战斗的交易，但代价会落在陌生人身上。','dilemma','l'],['导师告诉你：真正的强大不是赢，而是知道何时停手。','line','m'],['规则保护了多数人，却让一个具体的人无法获救。','dilemma','n'],['你拥有能改变战局的力量，却不确定自己能否控制它。','choice','ae'],['队伍都说“牺牲一个人是最有效率的办法”。','dilemma','n'],['你发现一直相信的英雄做过不愿被提起的事。','resonance','h'],['为了赢得比赛，你可以使用别人还没准备好的秘密招式。','choice','o'],['你能获得永远不受伤的身体，但会失去一段记忆。','dilemma','i'],['有人把你的善意解释成软弱。','line','d'],['任务目标与朋友正在做的事发生冲突。','dilemma','ap'],['你可以成为传说，却必须放弃普通生活。','choice','am'],['胜利之后，所有人只记住了最响亮的那个人。','resonance','p']]],
 ['羁绊与协作',[
 ['临时队友完全不按你的节奏行动，却总能在关键处补位。','scene','q'],['伙伴受伤后坚持继续任务，你会怎么和他谈？','dilemma','r'],['你需要从三个人中选一位共同面对最终关卡。','card','s'],['队伍争论不休，敌人已经在逼近。','scene','t'],['一个沉默的人总是最后一个离开训练场。','resonance','u'],['伙伴把功劳全部让给你，你知道事实并非如此。','choice','v'],['你和最信任的人得到了相反的命令。','dilemma','w'],['有人加入队伍的理由并不光彩，但他确实在努力。','resonance','x'],['需要有人留下断后，你会怎样分配这件事？','choice','y'],['你听见伙伴说“我没事”，但他的声音在发抖。','line','z'],['团队庆功时，最辛苦的人没有出现。','choice','aa'],['你可以替朋友说完，也可以等他自己开口。','resonance','ab']]],
 ['能力与战斗',[
 ['你的招式被对手看穿，只剩一次改变节奏的机会。','battle','ac'],['训练场给出四种武器：速度、耐心、精准或直觉。','card','ad'],['你发现自己的能力越强，周围的东西越容易受伤。','dilemma','ae'],['敌人不断挑衅，试图让你在愤怒里出手。','scene','af'],['队友的能力和你的招式完全不相容。','choice','ag'],['你在比赛前只剩十分钟准备。','scene','ah'],['一次失败让所有人怀疑你是否适合这个位置。','resonance','ai'],['你可以复制对手最强的一招，但会暂时失去自己的风格。','dilemma','aj'],['战斗结束后，敌人请求你教他如何控制力量。','choice','ak'],['你的武器会回应情绪，而你现在很生气。','scene','al'],['你更愿意当冲在最前面的人，还是改变全局的人？','card','am'],['最终一击出现时，你发现还有一条不伤人的路线。','dilemma','an']]],
 ['剧情与成长',[
 ['故事翻到下一章，你必须承认自己已经不是从前的人。','resonance','ao'],['导师离开后，你第一次独自决定任务方向。','choice','ap'],['你回到曾经失败的地方，入口仍然在那里。','scene','aq'],['一个过去的自己出现在面前，向你求助。','dilemma','ar'],['你可以抹掉最痛苦的记忆，也会失去它教会你的东西。','dilemma','as'],['队伍要为下一段旅程选择新的名字。','card','at'],['你终于完成了曾经觉得不可能的事。','resonance','au'],['有人说你的成长只是运气。','line','av'],['旧敌人带来一条只有他知道的线索。','choice','aw'],['你发现自己一直追逐的目标已经改变。','resonance','ax'],['故事需要一个结尾，但你还舍不得告别。','choice','ay'],['下一章没有预告，只有一张空白的纸。','resonance','az']]],
 ['舞台与日常',[
 ['演出、比赛或任务前，后台只剩五分钟。','scene','ba'],['你在社团、船舱或基地里有一整天空闲。','choice','bb'],['同伴把一件平凡小事做得像一场主线剧情。','resonance','bc'],['你要为队伍准备一顿能让大家安心的饭。','card','bd'],['镜头或聚光灯突然对准了你。','scene','be'],['你最想把哪种东西带进冒险后的普通生活？','card','bf'],['休息日有人邀请你去一个完全不擅长的活动。','choice','bg'],['你发现最可靠的伙伴其实有很奇怪的小习惯。','resonance','bh'],['庆典、演唱会或球场上，观众的声音突然消失。','scene','bi'],['你要为这一集的片尾留下一句话。','line','bj'],['旅程中你最愿意守护的一件日常物品是什么？','card','bk'],['在一切结束后，你会怎样庆祝这次相遇？','choice','bl']]],
];
let n=1;
export const questions=raw.flatMap(([cat,items])=>items.map(([text,kind,key])=>q('v2-'+String(n++).padStart(3,'0'),cat,text,kind,sets[key])));
