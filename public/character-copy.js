export function discoveryCopy(character){
  if(!character.work)return '';
  return `如果你还不熟悉${character.name}，或者没看过《${character.work}》，不妨找个空闲的时候，从这部作品开始认识这位角色。看看故事里的选择、羁绊与成长，也许会发现这次相遇之外，更多让你产生共鸣的地方。`;
}
