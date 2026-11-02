import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SqliteAdapter} from './sqlite-adapter.mjs';
import {D1Store} from '../server/store.mjs';
import {handleApi} from '../server/app.mjs';
import {securityHeaders} from '../server/security.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.mkdirSync(path.join(root,'work'),{recursive:true});
const db=new SqliteAdapter(path.join(root,'work','local.sqlite'));db.db.exec(fs.readFileSync(path.join(root,'schema.sql'),'utf8'));const store=new D1Store(db);
if(!db.db.prepare('PRAGMA table_info(sessions)').all().some(column=>column.name==='access_code_hash'))db.db.exec('ALTER TABLE sessions ADD COLUMN access_code_hash TEXT REFERENCES activation_codes(code_hash)');
const publicRoot=path.join(root,'public');const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{
 const origin=`http://127.0.0.1:${port}`,url=new URL(req.url,origin);
 if(url.pathname.startsWith('/api/')){
  let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>22000){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'请求内容过长'}));return}chunks.push(chunk)}
  const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
  const response=await handleApi(request,store,{clientIp:req.socket.remoteAddress,FULFILLMENT_API_KEY:process.env.FULFILLMENT_API_KEY,FULFILLMENT_ENCRYPTION_KEY:process.env.FULFILLMENT_ENCRYPTION_KEY,FULFILLMENT_PRODUCT_ID:process.env.FULFILLMENT_PRODUCT_ID,FULFILLMENT_SOURCE:process.env.FULFILLMENT_SOURCE});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 let target=path.resolve(publicRoot,'.'+decodeURIComponent(url.pathname));if(target!==publicRoot&&!target.startsWith(publicRoot+path.sep)){res.writeHead(403);res.end();return}
 if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
 if(!fs.existsSync(target)){if(!path.extname(target))target=path.join(publicRoot,'index.html');else{res.writeHead(404);res.end('Not found');return}}
 res.writeHead(200,{...securityHeaders,'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res);
 }catch(e){console.error(e);res.writeHead(500);res.end('Local server error')}});
server.listen(port,'127.0.0.1',()=>console.log(`次元来信本地预览: http://127.0.0.1:${port}\n输入解锁码即可测试；用 node scripts/codes.mjs --count 5 --local 生成本地测试码。`));
function stop(){server.close(()=>{db.close();process.exit(0)})}process.on('SIGINT',stop);process.on('SIGTERM',stop);
