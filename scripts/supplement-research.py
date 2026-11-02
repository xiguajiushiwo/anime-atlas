import concurrent.futures, json, urllib.request, re
from pathlib import Path
from html.parser import HTMLParser
class TextParser(HTMLParser):
 def __init__(self):super().__init__();self.parts=[];self.skip=0
 def handle_starttag(self,tag,attrs):
  if tag in ['script','style']:self.skip+=1
 def handle_endtag(self,tag):
  if tag in ['script','style']:self.skip=max(0,self.skip-1)
 def handle_data(self,data):
  if not self.skip and data.strip():self.parts.append(data.strip())
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'work'/'character-research'
SOURCES={
 'kimetsu':'https://kimetsu.com/anime/character/',
 'spy':'https://spy-family.net/tvseries/character/',
 'frieren':'https://frieren-anime.jp/character/',
 'bocchi':'https://bocchi.rocks/tv/character/',
 'bluelock':'https://bluelock-pr.com/character/',
 'mob':'https://mobpsycho100.com/character/',
 'bungo':'https://bungo-stray-dogs.jp/character/',
 'eva':'https://en.wikipedia.org/wiki/Kaworu_Nagisa',
 'fma':'https://en.wikipedia.org/wiki/Alphonse_Elric',
 'zenitsu':'https://en.wikipedia.org/wiki/Zenitsu_Agatsuma',
}
def fetch(item):
 key,url=item
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=25) as response: html=response.read().decode('utf-8','replace')
  parser=TextParser();parser.feed(html);text=' '.join(parser.parts)
  (OUT/f'official-{key}.txt').write_text(text,encoding='utf-8')
  return {'key':key,'url':url,'ok':True,'length':len(text),'excerpt':text[:7000]}
 except Exception as e:return {'key':key,'url':url,'ok':False,'error':str(e)}
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=5).map(fetch,SOURCES.items()))
(OUT/'supplement-sources.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
for result in results:print(json.dumps(result,ensure_ascii=False))
