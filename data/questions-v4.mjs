import { questions as baseQuestions, categories } from './questions-v3.mjs';

// 第二批题目仍然围绕八个倾向，但加入更多动漫世界常见的任务：训练、调查、救援、舞台、家族与选择代价。
const weights={
  sprint:[2,-1,0,1,1,1,1,0],care:[-1,2,0,-1,0,0,0,2],plan:[-1,0,2,0,-1,1,1,1],free:[0,-1,0,2,0,1,0,-1],
  speak:[1,0,0,0,2,0,0,0],explore:[1,0,0,1,0,2,-1,-1],persist:[0,0,1,0,-1,-1,2,1],protect:[1,1,1,-1,-1,-1,1,2],
  listen:[-1,2,1,0,-2,0,0,0],bridge:[0,2,1,-1,2,0,0,1],boundary:[0,-1,1,2,1,-1,0,-1],adapt:[1,1,0,0,1,2,-1,0],
  rest:[-2,1,0,1,-1,0,-2,-1],learn:[-1,0,2,1,-1,2,1,0],honest:[0,1,0,1,2,0,0,0],steady:[-1,1,1,-1,-1,-1,2,2],
  experiment:[2,0,1,1,0,2,0,-1],lead:[2,0,2,0,2,0,1,2],quiet:[-1,1,1,1,-2,1,1,0],support:[0,2,0,-1,-1,0,1,2],
  play:[1,1,-1,1,2,2,-1,-1],craft:[0,0,2,1,-1,1,2,0],negotiate:[0,1,2,0,2,0,1,1],trust:[1,2,-1,-1,1,1,0,1],
  risk:[2,-1,0,1,0,1,1,-1],observe:[-1,1,2,0,-1,1,0,0],
  protect2:[1,2,2,-1,-1,0,1,2],
};
const choices={
  sprint:['先抢在变化前完成第一步','sprint'],care:['先确认最需要帮助的人','care'],plan:['把线索、时间和退路列出来','plan'],free:['按自己的判断改掉既定路线','free'],
  speak:['把关键疑问直接说出来','speak'],explore:['沿着没人验证过的方向调查','explore'],persist:['认定值得，就继续练下去','persist'],protect:['优先守住队友和撤退路线','protect'],
  listen:['先给对方完整说完的空间','listen'],bridge:['把冲突的人请到同一张桌前','bridge'],boundary:['先说清楚绝不能越过的底线','boundary'],adapt:['保留目标，换一种办法完成','adapt'],
  rest:['先恢复状态，不把透支当勇敢','rest'],learn:['先查清它的原理和来历','learn'],honest:['把真实感受说清楚','honest'],steady:['按节奏把最基本的动作做稳','steady'],
  experiment:['做一个小范围的试验','experiment'],lead:['站出来分配方向和责任','lead'],quiet:['找安静的位置整理信息','quiet'],support:['先接过一件具体的杂务','support'],
  play:['把紧张变成一次即兴互动','play'],craft:['重复练习最关键的细节','craft'],negotiate:['先约定一个大家能接受的版本','negotiate'],trust:['把选择权交给对方，相信他的判断','trust'],
  risk:['先试一次高风险但有机会的招式','risk'],observe:['再看一轮对手和环境的变化','observe'],protect2:['先建立共同的安全信号','protect2'],
};
const optionSets=[
 ['sprint','plan','care','explore'],['free','negotiate','trust','boundary'],['protect','craft','explore','quiet'],['honest','speak','listen','boundary'],
 ['play','observe','quiet','speak'],['learn','boundary','bridge','adapt'],['care','negotiate','support','quiet'],['trust','craft','protect','explore'],
 ['lead','bridge','sprint','plan'],['persist','learn','honest','quiet'],['adapt','risk','observe','craft'],['rest','observe','honest','protect2'],
 ['protect2','listen','learn','sprint'],['plan','steady','bridge','trust'],['speak','risk','care','adapt'],['free','play','honest','observe'],
];
const prompts=['你会先做哪一步？','如果只能保留一个目标，你会保留什么？','此刻你会把哪件事交给同伴？','哪一种选择最像你的第一反应？','如果结果无法重来，你会怎么决定？'];
const scenes=[
 ['月台广播把你的名字读成了另一个人的名字','训练场的影子比本人先做出了动作','一条新街道在地图上只出现了十分钟','你在无人售票机里发现一张写着未来日期的票','海边的灯塔把不同阵营召到同一片沙滩','商店橱窗里摆着一件只属于你的旧制服','夜行列车突然停在没有站名的地方','一场雨让所有人的能力短暂失效','你被邀请参加一场不允许说真话的宴会','废弃的校舍里传来熟悉的片尾曲'],
 ['城镇决定用抽签分配最后一块安全区域','导师的遗言要求你保护一个你不信任的人','胜利可以提前结束战争，但会牺牲一段记忆','规则只对没有背景的人严格执行','你发现最有效的方案会让朋友失去选择权','有人把你的善意写进了正式的契约','所有人都要求你立刻表态，事实却还不完整','一次回溯机会只能改变一个人的结局','你必须选择公开真相还是保护一个家庭','最方便的道路会把责任推给陌生人'],
 ['临时小队在地下站台被分成了两组','一位新同伴只在你独处时愿意说话','队伍拿到三份互相矛盾的任务书','庆功时最沉默的人突然提出离开','你和最熟悉的人被安排负责相反的路线','伙伴把最后一份补给塞进你的包里','一个曾经的敌人请求加入今晚的守夜','队友的成功会让你的名字消失在记录里','有人说自己没事，却一直把手藏在袖口','大家都在等待你先承认害怕'],
 ['你的能力会在最强时影响无辜建筑','对手提出一场只允许使用非致命招式的决斗','训练工具只能选择一个人使用','你拥有一次复制招式的机会，但会失去一项习惯','战斗的倒计时和救援的倒计时重叠','队友的绝招需要你站在最危险的位置','你第一次失败的录像正在被全城播放','敌人的弱点和你的底线刚好重合','你必须在胜利前先证明自己能停手','最后一击出现时，另一条路仍然来得及'],
 ['你在旧相册里看见一张没有自己却写着你名字的照片','陌生人的日记准确记下了你昨天的选择','一段广播把同一件往事讲成了四个版本','你追查的线索会让一位值得信任的人失去职位','导师留下的钥匙只能打开一扇不该存在的门','一个孩子记得所有成年人都忘记的约定','你发现敌人的证词和朋友的记忆都是真的','答案藏在一件被大家认为无关紧要的日常物品里','你终于完成曾经不敢开始的练习','下一章没有文字，只有一条回家的路线'],
 ['演出前五分钟，主角突然把麦克风交给你','休息日有人邀请你参加完全陌生的社团','旅店只剩一张长桌，所有人必须交换座位','同伴把一件小事做得像一场最终决战','聚光灯照向最不想被看见的人','你要为全队调配一锅能让大家安心的热汤','庆典音乐停止后，只有你记得下一段旋律','可靠的伙伴突然学会了一个奇怪的小习惯','冒险结束后，大家选择了不同的告别方式','你要为这一集的片尾留下最后一句话'],
];
const twists=['补给只够一半的人使用','不能向任何人解释真正原因','最熟悉的人恰好不在现场','选择会改变下一场任务的入口','你必须在十分钟内决定','留下的人会承担后续责任','有一个看似无关的人正在记录','你只能带走一件物品','现场没有所谓的标准答案','你的选择会被公开保存','有人已经替你做了一个决定','最安全的方案会放弃一条重要线索','你发现自己其实也在害怕','这件事与一段旧约定有关','同伴的期待和你的愿望相反','如果失败，所有人都会记住你的名字','你可以拒绝，但没人知道拒绝的代价','你必须先照顾结果，再解释动机','这次选择会改变谁能继续同行'];
const kinds=['scene','dilemma','choice','line','resonance','battle','investigation','rescue'];
const extra=[];let serial=1;
for(let categoryIndex=0;categoryIndex<categories.length;categoryIndex++){
  const amount=categoryIndex<4?167:166;
  for(let i=0;i<amount;i++){
    const scene=scenes[categoryIndex][i%10],twist=twists[(i*11+categoryIndex*3)%twists.length],prompt=prompts[(i*2+categoryIndex)%prompts.length];
    const kind=kinds[(i*5+categoryIndex)%kinds.length],keys=optionSets[(i*5+categoryIndex)%optionSets.length],selected=kind==='line'?keys.slice(0,2):keys;
    extra.push({id:'v4-'+String(serial++).padStart(4,'0'),category:categories[categoryIndex],kind,text:`${scene}。${twist}。${prompt}`,options:selected.map((key,index)=>({id:String(index),label:choices[key][0],weights:weights[choices[key][1]]}))});
  }
}
export { categories };
export const questions=[...baseQuestions,...extra];
