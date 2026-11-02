import concurrent.futures
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'work' / 'character-research'
OUT.mkdir(parents=True, exist_ok=True)
ROSTER = [
 ('naruto','Naruto Uzumaki'),('sasuke','Sasuke Uchiha'),('kakashi','Kakashi Hatake'),('hinata','Hinata Hyuuga'),
 ('luffy','Monkey D. Luffy'),('zoro','Roronoa Zoro'),('nami','Nami'),('robin','Nico Robin'),
 ('gojo','Satoru Gojou'),('yuji','Yuuji Itadori'),('megumi','Megumi Fushiguro'),('nobara','Nobara Kugisaki'),
 ('tanjiro','Tanjirou Kamado'),('nezuko','Nezuko Kamado'),('zenitsu','Zenitsu Agatsuma'),('shinobu','Shinobu Kochou'),
 ('hinata-shoyo','Shouyou Hinata'),('kageyama','Tobio Kageyama'),('kenma','Kenma Kozume'),('kuroo','Tetsurou Kuroo'),
 ('natsume','Takashi Natsume'),('nyanko','Nyanko-sensei'),('natori','Shuuichi Natori'),('tanuma','Kaname Tanuma'),
 ('loid','Loid Forger'),('yor','Yor Forger'),('anya','Anya Forger'),('damian','Damian Desmond'),
 ('edward','Edward Elric'),('alphonse','Alphonse Elric'),('roy','Roy Mustang'),('riza','Riza Hawkeye'),
 ('frieren','Frieren'),('fern','Fern'),('stark','Stark'),('himmel','Himmel'),
 ('eren','Eren Yeager'),('mikasa','Mikasa Ackerman'),('armin','Armin Arlert'),('levi','Levi'),
 ('conan','Conan Edogawa'),('haibara','Ai Haibara'),('ran','Ran Mouri'),('kaito','Kaito Kuroba'),
 ('ichigo','Ichigo Kurosaki'),('rukia','Rukia Kuchiki'),('uryu','Uryuu Ishida'),('hitsugaya','Toushirou Hitsugaya'),
 ('gintoki','Gintoki Sakata'),('kagura','Kagura'),('shinpachi','Shinpachi Shimura'),('hijikata','Toushirou Hijikata'),
 ('atsushi','Atsushi Nakajima'),('dazai','Osamu Dazai'),('chuuya','Chuuya Nakahara'),('ranpo','Ranpo Edogawa'),
 ('isagi','Yoichi Isagi'),('bachira','Meguru Bachira'),('nagi','Seishirou Nagi'),('rin','Rin Itoshi'),
 ('bocchi','Hitori Gotou'),('nijika','Nijika Ijichi'),('ryo','Ryou Yamada'),('kita','Ikuyo Kita'),
 ('shinji','Shinji Ikari'),('rei','Rei Ayanami'),('asuka','Asuka Langley Souryuu'),('kaworu','Kaworu Nagisa'),
 ('mob','Shigeo Kageyama'),('reigen','Arataka Reigen'),('ritsu','Ritsu Kageyama'),('teru','Teruki Hanazawa'),
]

def fetch_batch(batch):
    fields = 'id name { full native alternative } description(asHtml:false) image { large } siteUrl media(perPage:4,type:ANIME,sort:POPULARITY_DESC) { nodes { title { romaji english } } }'
    query = 'query {' + ' '.join(f'c{i}: Character(search:{json.dumps(name)}) {{ {fields} }}' for i, (_, name) in enumerate(batch)) + '}'
    body = json.dumps({'query':query}).encode()
    req = urllib.request.Request('https://graphql.anilist.co',data=body,headers={'Content-Type':'application/json','User-Agent':'AnimeAtlas-Research/1.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        payload = json.load(response)
    if payload.get('errors'):
        raise RuntimeError(payload['errors'])
    return {local_id: payload['data'][f'c{i}'] for i, (local_id, _) in enumerate(batch)}

records = {}
for index in range(0,len(ROSTER),6):
    batch=ROSTER[index:index+6]
    cache=OUT / f'batch-{index//6:02d}.json'
    if cache.exists():
        data=json.loads(cache.read_text(encoding='utf-8'))
    else:
        data=fetch_batch(batch)
        cache.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
        time.sleep(.4)
    records.update(data)
    print(f'Researched {index+len(batch)}/{len(ROSTER)}',flush=True)
(OUT / 'records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
for index in range(0,len(ROSTER),12):
    text=[]
    for key,_ in ROSTER[index:index+12]:
        c=records[key]
        text.append(f"\n[{key}] {c['name']['full']} / {c['name']['native']}\nSource: {c['siteUrl']}\nWorks: {', '.join(m['title']['romaji'] for m in c['media']['nodes'])}\n{c.get('description') or '[No description]'}\n")
    (OUT / f'reading-{index//12+1}.txt').write_text('\n'.join(text),encoding='utf-8')
print('Finished. Raw source biographies stay in work/ and are not served to visitors.')
