import {characters} from '../data/characters.mjs';

const characterById=new Map(characters.map(c=>[c.id,c]));

// Prefer the saved result's description. Fill missing metadata in older name-only
// snapshots by exact character ID, without rerunning or changing the match.
export function displayCharacter(saved){
  const fallback=characterById.get(saved.id);
  const value=key=>typeof saved[key]==='string'&&saved[key].trim()?saved[key]:fallback?.[key];
  const result={id:saved.id,name:saved.name};
  for(const key of ['work','tag','summary']){
    const text=value(key);
    if(typeof text==='string'&&text.trim())result[key]=text;
  }
  if(result.summary){
    const pronoun=value('gender')==='male'?'他':value('gender')==='female'?'她':'这位角色';
    // Convert editorial second-person descriptions to character introductions,
    // preserving quoted phrases such as “我相信你”.
    result.summary=result.summary.replace(/“[^”]*”|「[^」]*」|『[^』]*』|你/g,text=>text==='你'?pronoun:text);
  }
  return result;
}

export function historyCharacter(saved){
  const c=displayCharacter(saved);
  return {id:c.id,name:c.name,...(c.work?{work:c.work}:{})};
}
