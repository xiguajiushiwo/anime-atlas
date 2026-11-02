"""Local prototype images only. Provenance does not grant commercial rights."""
import concurrent.futures, io, json, urllib.request
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
records=json.loads((ROOT/'work/character-research/records.json').read_text(encoding='utf-8'))
out=ROOT/'public/images/characters';out.mkdir(parents=True,exist_ok=True)
def fetch(item):
 key,c=item; url=c['image']['large'];dest=out/f'{key}.webp'
 if not dest.exists():
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=30) as response:raw=response.read()
  im=Image.open(io.BytesIO(raw)).convert('RGB');im.thumbnail((600,800));im.save(dest,'WEBP',quality=88)
 with Image.open(dest) as im:size=im.size
 return {'id':key,'file':f'/images/characters/{key}.webp','sourcePage':c['siteUrl'],'sourceImage':url,'dimensions':size,'license':'未取得商业使用授权；仅用于本地设计验证'}
items=list(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(fetch,records.items()))
docs=ROOT/'docs';docs.mkdir(exist_ok=True)
(docs/'image-sources.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
for start in range(0,len(items),24):
 sheet=Image.new('RGB',(6*170,4*230),'#f7f4ec');d=ImageDraw.Draw(sheet)
 for j,c in enumerate(items[start:start+24]):
  im=Image.open(out/f"{c['id']}.webp");im=ImageOps.fit(im,(156,198),centering=(.5,.3))
  x=(j%6)*170+7;y=(j//6)*230;sheet.paste(im,(x,y));d.text((x,y+202),c['id'],fill='#252821')
 sheet.save(ROOT/f'work/portraits-{start//24+1}.jpg')
print(f'Prepared {len(items)} portraits; source manifest saved privately in docs/.')
