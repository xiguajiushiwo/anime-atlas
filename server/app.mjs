import {works,modes} from '../data/characters.mjs';
import {selectQuestions,presentQuestions,scoreAnswers,makeReport,publicReport,rankCharacters} from './engine.mjs';
import {hash,randomId,normalizeCode,cookieToken,sessionCookie,securityHeaders} from './security.mjs';
import {handleFulfillment} from './fulfillment.mjs';
import {visibleModes,defaultMode} from '../data/test-modes.mjs';
const maxAge=90*86400;
const safeUser=u=>u?{id:u.id,unlocked:!!u.unlocked_at}:null;
class ApiError extends Error{constructor(status,message){super(message);this.status=status}}
export async function handleApi(request,store,env={}){
 const url=new URL(request.url),path=url.pathname;let cookie=null;
 const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...securityHeaders,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
 try{
  if(path==='/api/fulfillment/issue')return handleFulfillment(request,store,env);
  if(!['GET','POST'].includes(request.method))throw new ApiError(405,'不支持的请求方式');
  if(request.method==='POST'){
   if(request.headers.get('Origin')!==url.origin)throw new ApiError(403,'请从本站页面发起操作');
   if(!request.headers.get('Content-Type')?.includes('application/json'))throw new ApiError(415,'请求格式不正确');
  }
  const token=cookieToken(request),tokenHash=token?await hash(token):null;
  const session=tokenHash?await store.findSession(tokenHash):null;
  let user=session?await store.getUser(session.user_id):null;
  if(user&&session.expires_at<Date.now()+60*86400000){await store.renewSession(tokenHash,Date.now()+maxAge*1000);cookie=sessionCookie(request,token)}
  const requireUser=()=>{if(!user)throw new ApiError(401,'请输入购买后获得的解锁码');return user};
  const requireUnlocked=()=>{requireUser();if(!user.unlocked_at)throw new ApiError(403,'请输入解锁码后开始测试')};
  const body=async()=>{const text=await request.text();if(text.length>20000)throw new ApiError(413,'请求内容过长');try{return JSON.parse(text)}catch{throw new ApiError(400,'请求内容不是有效的数据')}};
  const throttle=async(action,limit=12)=>{const ip=request.headers.get('CF-Connecting-IP')||env.clientIp||'local';if(!await store.rate(`${action}:${await hash(ip)}`,limit,600000))throw new ApiError(429,'操作有些频繁，请稍后再试')};
  if(path==='/api/bootstrap'&&request.method==='GET')return respond({user:safeUser(user),characters:[],dimensions:[],works:[],modes:visibleModes,defaultMode,demo:false});
  if(path==='/api/unlock'&&request.method==='POST'){
   await throttle('unlock',20);const b=await body();const code=normalizeCode(b?.code);
   if(!/^\d{6}$/.test(code)&&!(/^(CY|ANIMA)-[A-Z0-9-]+$/.test(code)&&code.length>=8&&code.length<=80))throw new ApiError(400,'请输入 6 位数字解锁码');
   const codeHash=await hash(code);if(!await store.getAccessCode(codeHash))throw new ApiError(400,'解锁码不正确或已停用，请检查后重试');
   const now=Date.now(),id=randomId(),u=user||{id,username:'visitor_'+id,salt:'',password_hash:'',created_at:now,unlocked_at:now};
   const raw=randomId(32),s={token_hash:await hash(raw),expires_at:now+maxAge*1000};
   if(!await store.openAccess(codeHash,u,s))throw new ApiError(400,'解锁码不正确或已停用，请检查后重试');
   if(tokenHash)await store.deleteSession(tokenHash);
   cookie=sessionCookie(request,raw);return respond({user:safeUser(u)});
  }
  if(path==='/api/logout'&&request.method==='POST'){if(tokenHash)await store.deleteSession(tokenHash);cookie=sessionCookie(request,'',0);return respond({ok:true})}
  if(path==='/api/history'&&request.method==='GET'){requireUnlocked();return respond({history:await store.history(user.id)})}
  if(path==='/api/runs'&&request.method==='POST'){
   requireUnlocked();await throttle(`run:${user.id}`,30);const b=await body(),mode=modes.find(m=>m.id===b.mode);if(!mode)throw new ApiError(400,'请选择测试长度');
   const preferences={work:typeof b.work==='string'?b.work:'all',gender:typeof b.gender==='string'?b.gender:'all'};
   if(!['all',...works].includes(preferences.work)||!['all','male','female','other'].includes(preferences.gender))throw new ApiError(400,'筛选条件不正确');
   try{rankCharacters(Array(8).fill(50),preferences)}catch(e){throw new ApiError(400,e.message)}
   const recent=(await store.recentRuns(user.id)).flatMap(r=>r.selection.map(q=>q.id));
   const run={id:randomId(),user_id:user.id,mode:mode.id,preferences,selection:selectQuestions(mode.count,recent),created_at:Date.now(),report:null};await store.createRun(run);
   return respond({run:{id:run.id,mode:run.mode,preferences,questions:presentQuestions(run.selection)}},201);
  }
  const match=path.match(/^\/api\/runs\/([a-f0-9]{48})(\/finish)?$/);
  if(match){requireUnlocked();const run=await store.getRun(match[1],user.id);if(!run)throw new ApiError(404,'没有找到这份档案');
   if(request.method==='GET'&&!match[2])return respond(run.report?{report:publicReport(run.report),id:run.id}:{run:{id:run.id,mode:run.mode,preferences:run.preferences,questions:presentQuestions(run.selection)}});
   if(request.method==='POST'&&match[2]){if(run.report)return respond({report:publicReport(run.report),id:run.id});const b=await body();let scores;try{scores=scoreAnswers(run.selection,b.answers)}catch(e){throw new ApiError(400,e.message)}const report=await store.finishRun(run.id,user.id,makeReport(scores,run.preferences,run.mode,{selection:run.selection,answers:b.answers}));return respond({report:publicReport(report),id:run.id})}
  }
  throw new ApiError(404,'没有找到这个页面或接口');
 }catch(error){if(!(error instanceof ApiError))console.error('API failure:',error.message);return respond({error:error instanceof ApiError?error.message:'暂时无法完成操作，请稍后再试'},error.status||500)}
}
