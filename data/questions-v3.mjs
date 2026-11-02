export const categories=['世界探索','立场与代价','羁绊与协作','能力与危机','线索与成长','舞台与日常'];
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
const choices={
 move:['先走一步，让现场给你答案','move'],plan:['先看地图、线索和退路','plan'],care:['先确认同行者是否还好','care'],explore:['沿着没人走过的方向看看','explore'],
 free:['按自己的判断改变路线','free'],boundary:['守住不能越过的底线','boundary'],learn:['先查清楚它为什么这样运转','learn'],speak:['把疑问直接说出来','speak'],
 listen:['给对方空间，告诉他我在','listen'],bridge:['把不同的人拉到同一张桌前','bridge'],support:['先接过一件实际的事','support'],trust:['把选择权交给对方，相信他的决定','trust'],
 craft:['重复练习最关键的基本动作','craft'],risk:['先试一次高风险的新招','risk'],observe:['观察对手和环境再出手','observe'],protect:['优先保护队友和撤退路线','protect'],
 persist:['认定值得，就继续练下去','persist'],adapt:['换一种方式，保留目标','adapt'],rest:['先恢复状态，不把逞强当勇敢','rest'],experiment:['做一个小规模试验','experiment'],
 play:['把它变成一场有趣的即兴演出','play'],quiet:['找个安静角落独自整理','quiet'],honest:['把真实感受说清楚','honest'],negotiate:['和大家约定一个都能接受的版本','negotiate'],
 lead:['站出来把方向和分工定下来','lead'],steady:['按既定节奏把基本功做稳','steady'],
};
const optionSets=[
 ['move','plan','care','explore'],['free','negotiate','trust','boundary'],['protect','craft','explore','quiet'],['honest','speak','listen','boundary'],
 ['play','observe','quiet','speak'],['learn','boundary','bridge','adapt'],['care','negotiate','support','quiet'],['trust','craft','protect','explore'],
 ['lead','bridge','move','plan'],['persist','learn','honest','quiet'],['adapt','risk','observe','craft'],['rest','observe','honest','protect'],
];
const prompts=['你会先做哪一步？','如果只能保留一个目标，你会保留什么？','你会把哪件事交给同伴？','此刻最值得保护的是什么？','哪一种选择最像你的第一反应？'];
const scenes=[
 ['玻璃港的夜市突然停电','一座刚开放的浮岛把航线改成单向','旧灯塔下出现一条不在地图上的栈桥','你在陌生港口被叫出了一个从未用过的名字','雾海退潮后露出一座倒置的车站','一艘没有船员的客船靠上码头','你在集市买到一枚写着明日日期的硬币','岛上的居民把同一段梦当成了天气预报','一场庆典把来自不同阵营的人安排在同一桌','远处的海面亮起三盏互不相同的灯'],
 ['议会准备封锁一条救援航线','一位守门人要求你交出最重要的记忆','敌对阵营提出用一座城市换取一名俘虏','你发现安全规则只保护了最有资源的人','导师留下的命令和现场情况完全相反','一项古老誓约要求你在今天做出选择','胜利的代价会由没有参与战斗的人承担','你获得一次修改过去决定的机会','有人把你的底线称作不合时宜','所有人都认为沉默就是同意'],
 ['临时队伍在暴雨中失去了联络','一名新伙伴拒绝说出自己的来历','你和最信任的人拿到了相反的地图','队伍中有人把功劳全部推给你','一个沉默的成员在最后关头提出异议','伙伴受伤却坚持继续赶路','你必须在陌生人和熟人之间分配最后的药','队伍决定是否接纳一名曾经的敌人','庆功宴上最重要的人没有出现','你听见同伴说没事，但他的手一直在发抖'],
 ['你的招式被对手看穿，只剩一次改变节奏的机会','训练场给出一件无法重复使用的工具','能力越强，周围的建筑越容易受损','敌人不断挑衅，试图让你失去判断','队友的能力和你的计划完全不相容','比赛开始前只剩十分钟准备','你第一次失败后，所有人都看向你','复制对手的绝招会暂时抹掉你的习惯','战斗结束后，敌人请求你教他控制力量','最终一击出现时，仍有一条不伤人的路线'],
 ['你在废弃档案里看见自己的笔迹','一封没有署名的信准确预告了明天','旧敌人带来一条只有他知道的线索','你发现一段历史被不同的人写成了三个版本','导师的遗物里藏着一个无法解释的空格','一个孩子记得所有成年人都忘了的事','你追查的答案会让一位朋友失去位置','回潮把过去的自己带到你面前','你终于完成了曾经觉得不可能的事','下一章没有预告，只有一张空白的纸'],
 ['演出、比赛或任务前，后台只剩五分钟','休息日有人邀请你去完全不擅长的活动','旅店里只剩一间房和一张长桌','同伴把一件平凡小事做得像主线剧情','聚光灯突然对准了最不想发言的人','你要为全队准备一顿能让大家安心的饭','庆典上的音乐在最热闹时突然停止','你发现可靠的伙伴有一个奇怪的小习惯','冒险结束后，大家各自选择了不同的庆祝方式','你要为这一集的片尾留下一句话'],
];
const twists=['补给只够一半的人使用','不能向任何人解释真正原因','最熟悉的人恰好不在现场','选择会影响下一座岛的通行权','你必须在十分钟内决定','留下的人会承担后续责任','有一个看似无关的人正在观察','你只能带走一件物品','现场没有所谓的正确答案','你的选择会被公开记录','有人已经替你做了一个决定','最安全的方案会放弃一个重要线索','你发现自己其实也在害怕','这件事与一段旧承诺有关','同伴的期待和你的愿望相反','如果失败，所有人都会记住你的名字','你可以拒绝，但没人知道拒绝的代价'];
const kinds=['scene','dilemma','choice','line','resonance','battle'];
const questions=[];let serial=1;
for(let categoryIndex=0;categoryIndex<categories.length;categoryIndex++){
 const amount=categoryIndex<4?167:166;
 for(let i=0;i<amount;i++){
  const scene=scenes[categoryIndex][i%10],twist=twists[(i*7+categoryIndex)%twists.length],prompt=prompts[(i+categoryIndex)%prompts.length];
  const kind=kinds[(i+categoryIndex)%kinds.length],keys=optionSets[(i*3+categoryIndex)%optionSets.length];
  const selected=kind==='line'?keys.slice(0,2):keys;
  questions.push({id:'v3-'+String(serial++).padStart(4,'0'),category:categories[categoryIndex],kind,text:`${scene}。${twist}。${prompt}`,options:selected.map((key,index)=>({id:String(index),label:choices[key][0],weights:weights[choices[key][1]]}))});
 }
}

export { questions };
