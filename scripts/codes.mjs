import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {hash,randomId} from '../server/security.mjs';
import {makeAccessCode} from '../server/access-codes.mjs';
const args=process.argv.slice(2),get=(key,fallback)=>{const i=args.indexOf(key);return i>=0?args[i+1]:fallback};
const count=Number(get('--count','10'));if(!Number.isInteger(count)||count<1||count>5000)throw new Error('--count 必须是 1 到 5000');
const site=get('--site','');
if(site){const url=new URL(site);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('--site 请填写不含参数、凭据或片段的网站地址');if(url.protocol==='http:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('正式交付链接需要 HTTPS')}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),batch='B'+new Date().toISOString().replace(/\D/g,'').slice(0,14)+'-'+randomId(2);
const destination=path.join(root,'work','codes',batch);fs.mkdirSync(destination,{recursive:true});
const usedCodes=new Set(),usedHashes=new Set(),codeRoot=path.join(root,'work','codes');
for(const entry of fs.readdirSync(codeRoot,{withFileTypes:true})){
 if(!entry.isDirectory())continue;
 const csv=path.join(codeRoot,entry.name,'codes.csv');
 if(fs.existsSync(csv))for(const line of fs.readFileSync(csv,'utf8').split(/\r?\n/).slice(1)){const code=line.split(',')[0];if(code)usedCodes.add(code)}
}
const localDatabase=path.join(root,'work','local.sqlite');
if(fs.existsSync(localDatabase)){
 const {SqliteAdapter}=await import('./sqlite-adapter.mjs'),db=new SqliteAdapter(localDatabase);
 try{for(const row of db.db.prepare('SELECT code_hash FROM activation_codes').all())usedHashes.add(row.code_hash)}finally{db.close()}
}
const codes=[];
for(let attempt=0;codes.length<count&&attempt<count*100;attempt++){
 const code=makeAccessCode();if(usedCodes.has(code)||usedHashes.has(await hash(code)))continue;
 usedCodes.add(code);codes.push(code);
}
if(codes.length!==count)throw new Error('可用数字码不足，请检查库存后再生成；本批次未导入。');
const inserts=await Promise.all(codes.map(async code=>`INSERT INTO activation_codes(code_hash,batch) VALUES('${await hash(code)}','${batch}');`));
fs.writeFileSync(path.join(destination,'codes.csv'),'code,batch\n'+codes.map(c=>`${c},${batch}`).join('\n')+'\n','utf8');
fs.writeFileSync(path.join(destination,'import.sql'),inserts.join('\n')+'\n','utf8');
fs.writeFileSync(path.join(destination,'codes.txt'),codes.join('\n')+'\n','utf8');
if(site)fs.writeFileSync(path.join(destination,'delivery.txt'),codes.map(code=>`次元来信｜测试链接：${site} ｜解锁码：${code} ｜点击“开始测试”后粘贴解锁码。无需注册，同一个码可反复使用，请保存好。`).join('\n')+'\n','utf8');
if(args.includes('--local')){const {SqliteAdapter}=await import('./sqlite-adapter.mjs');const db=new SqliteAdapter(localDatabase);try{db.db.exec(fs.readFileSync(path.join(root,'schema.sql'),'utf8'));db.db.exec('BEGIN IMMEDIATE');try{db.db.exec(inserts.join('\n'));db.db.exec('COMMIT')}catch(error){db.db.exec('ROLLBACK');throw error}}finally{db.close()}}
console.log(`已生成 ${count} 个 6 位数字解锁码，可重复使用。\n清单：${path.join(destination,'codes.csv')}\n一行一码：${path.join(destination,'codes.txt')}\n数据库导入文件：${path.join(destination,'import.sql')}${site?'\n一行一份发货内容：'+path.join(destination,'delivery.txt'):''}\n明文交付文件仅保存在 work/codes 中，请保管好。${args.includes('--local')?'\n已导入本地预览数据库。':''}`);
