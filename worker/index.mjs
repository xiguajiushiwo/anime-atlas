import {handleApi} from '../server/app.mjs';
import {D1Store} from '../server/store.mjs';
import {securityHeaders} from '../server/security.mjs';
export default {
 async fetch(request,env){
  if(new URL(request.url).pathname.startsWith('/api/')){
   if(!env.DB)return new Response(JSON.stringify({error:'数据库尚未配置，请联系站点管理员'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
   return handleApi(request,new D1Store(env.DB),env);
  }
  const response=await env.ASSETS.fetch(request);const result=new Response(response.body,response);Object.entries(securityHeaders).forEach(([k,v])=>result.headers.set(k,v));return result;
 },
 async scheduled(event,env,ctx){ctx.waitUntil(env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(Date.now())]));}
};
