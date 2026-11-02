// Internal editorial shortlist: widely recognised classics and established fan favourites.
// Recognition is a selection judgement, not a measured population percentage.
// Only reviewed IDs enter matching; adding a record to the archive does not opt it in.
export const rosterGroups = [
  ['火影忍者', ['naruto','sasuke','kakashi','hinata','sakura-naruto','itachi','gaara','jiraiya','tsunade','shikamaru','rock-lee','minato','madara','might-guy']],
  ['海贼王', ['luffy','zoro','nami','robin','sanji','chopper','ace','law','shanks','hancock','usopp','sabo','brook']],
  ['名侦探柯南', ['conan','haibara','ran','kaito','amuro-conan','akai-conan','heiji','kogoro','kazuha','sonoko']],
  ['七龙珠', ['goku','vegeta','gohan','trunks','piccolo','bulma']],
  ['灌篮高手', ['sakuragi','rukawa','akagi','mitsui','miyagi-slam','sendoh','haruko']],
  ['樱桃小丸子', ['maruko','tama-chan']],
  ['宝可梦', ['ash','pikachu','kasumi','takeshi']],
  ['数码宝贝', ['taichi','yamato','agumon']],
  ['美少女战士', ['usagi','ami','rei-sailor','makoto','minako-sailor','mamoru-sailor']],
  ['魔卡少女樱', ['sakura-cardcaptor','syaoran','tomoyo','keroberos']],
  ['圣斗士星矢', ['seiya','shiryu','hyoga','shun','ikki','saori']],
  ['犬夜叉', ['inuyasha','kagome','sesshomaru','kikyo','sango','miroku']],
  ['银魂', ['gintoki','kagura','shinpachi','hijikata','okita-gintama','katsura']],
  ['死神', ['ichigo','rukia','hitsugaya','byakuya','aizen']],
  ['新世纪福音战士', ['shinji','rei','asuka','kaworu']],
  ['JOJO的奇妙冒险', ['jotaro','joseph','josuke','giorno','dio']],
  ['钢之炼金术师', ['edward','alphonse','roy','riza']],
  ['鬼灭之刃', ['tanjiro','nezuko','zenitsu','shinobu','inosuke','giyu','rengoku']],
  ['咒术回战', ['gojo','yuji','megumi','nobara','nanami-jjk','geto','sukuna']],
  ['进击的巨人', ['eren','mikasa','armin','levi','hange']],
  ['排球少年!!', ['hinata-shoyo','kageyama','kenma','kuroo','oikawa','tsukishima','bokuto']],
  ['间谍过家家', ['loid','yor','anya']],
  ['一拳超人', ['saitama','genos','tatsumaki']],
  ['夏目友人帐', ['natsume','nyanko']],
  ['你的名字。', ['taki','mitsuha']],
  ['千与千寻', ['chihiro','haku-ghibli','no-face']],
  ['龙猫', ['totoro']],
  ['哈尔的移动城堡', ['howl','sophie']],
  ['天气之子', ['hodaka','hina-weather']],
  ['铃芽之旅', ['suzume','souta']],
  ['全职猎人', ['gon','killua','kurapika','leorio','hisoka']],
  ['死亡笔记', ['death-note','l','misa']],
  ['刀剑神域', ['kirito','asuna','sinon','alice']],
  ['葬送的芙莉莲', ['frieren','fern','stark','himmel']],
  ['文豪野犬', ['atsushi','dazai','chuuya','ranpo']],
  ['蓝色监狱', ['isagi','bachira','nagi','rin']],
  ['链锯人', ['denji','power','aki','makima']],
  ['东京喰种', ['kaneki','touka','juuzou']],
  ['Re:从零开始的异世界生活', ['subaru','emilia','rem','ram']],
  ['魔法少女小圆', ['madoka','homura','mami','kyoko']],
  ['辉夜大小姐想让我告白', ['kaguya','miyuki','chika','ishigami']],
  ['妖精的尾巴', ['natsu','lucy','gray','erza']],
  ['轻音少女', ['yui','mio','ritsu-k','azusa','tsumugi']],
  ['反叛的鲁路修', ['lelouch','suzaku','cc','kallen']],
  ['黑子的篮球', ['kuroko','kagami','kise','akashi','aomine']],
  ['齐木楠雄的灾难', ['saiki','teruhashi','kaido','nendou']],
  ['水果篮子', ['tohru','yuki','kyo']],
  ['命运石之门', ['okabe','kurisu','mayuri']],
  ['幽游白书', ['yusuke-yyh','kurama-yyh','hiei-yyh','kuwabara-yyh']],
  ['网球王子', ['ryoma-tennis','tezuka-tennis','fuji-tennis','atobe-tennis']],
  ['家庭教师Hitman REBORN!', ['tsuna','reborn','gokudera','hibari']],
  ['灵能百分百', ['mob','reigen']],
  ['四月是你的谎言', ['kousei','kaori']],
  ['紫罗兰永恒花园', ['violet']],
  ['孤独摇滚', ['bocchi','nijika','ryo','kita']],
  ['龙与虎', ['taiga','ryuuji']],
  ['某科学的超电磁炮', ['mikoto-railgun','kuroko-railgun']],
  ['凉宫春日的忧郁', ['haruhi-suzumiya','yuki-nagato']],
];

// Use familiar names where an official full name alone is harder to recognise.
const displayNames = {
  maruko: '小丸子', 'tama-chan': '小玉', eren: '艾伦·耶格',
  asuna: '亚丝娜',
};

export function curateCharacters(candidates) {
  const records = new Map();
  for (const character of candidates) {
    if (records.has(character.id)) throw new Error(`Duplicate character ID: ${character.id}`);
    records.set(character.id, character);
  }
  const included = new Set();
  return rosterGroups.flatMap(([work, ids]) => ids.map(id => {
    if (included.has(id)) throw new Error(`Repeated shortlist ID: ${id}`);
    included.add(id);
    const character = records.get(id);
    if (!character || character.work !== work) throw new Error(`Unresolved shortlist character: ${work}/${id}`);
    return {...character, name: displayNames[id] || character.name};
  }));
}
