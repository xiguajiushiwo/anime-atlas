import {equal,hash,securityHeaders} from './security.mjs';
import {makeAccessCode,sealCode,openCode} from './access-codes.mjs';

// This is a trusted fulfillment bridge, not a payment verification service.
// The caller must verify the paid order with its sales platform before calling.
export async function handleFulfillment(request,store,env){
  const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...securityHeaders,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  const apiKey=env.FULFILLMENT_API_KEY,encryptionKey=env.FULFILLMENT_ENCRYPTION_KEY,productId=env.FULFILLMENT_PRODUCT_ID;
  if(!apiKey||apiKey.length<32||!/^[a-f0-9]{64}$/i.test(encryptionKey||'')||!productId)return respond({error:'发码接口尚未启用'},404);
  if(request.method!=='POST')return respond({error:'不支持的请求方式'},405);
  if(request.headers.has('Origin'))return respond({error:'仅供发货服务调用'},403);
  if(!equal(request.headers.get('Authorization')||'','Bearer '+apiKey))return respond({error:'发货服务认证失败'},401);
  if(!request.headers.get('Content-Type')?.includes('application/json'))return respond({error:'请求格式不正确'},415);
  try{
    const text=await request.text();if(text.length>4000)return respond({error:'请求内容过长'},413);
    let body;try{body=JSON.parse(text)}catch{return respond({error:'请求内容不是有效的数据'},400)}
    if(!body||typeof body!=='object'||Array.isArray(body))return respond({error:'订单格式不正确'},400);
    if(body.paymentStatus!=='paid'||body.productId!==productId||(body.quantity??1)!==1)return respond({error:'需要已付款的指定商品订单，单次订单数量为 1'},400);
    if(typeof body.orderId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(body.orderId))return respond({error:'订单号格式不正确'},400);
    const orderKey=await hash(JSON.stringify([env.FULFILLMENT_SOURCE||'store',productId,body.orderId]));
    let order=await store.getFulfillment(orderKey),created=false;
    for(let attempt=0;!order&&attempt<32;attempt++){
      const code=makeAccessCode(),codeHash=await hash(code),cipher=await sealCode(code,orderKey,encryptionKey);
      created=await store.issueOrder({orderKey,codeHash,cipher,createdAt:Date.now()});
      order=await store.getFulfillment(orderKey);
    }
    if(!order)return respond({error:'暂时无法分配新的解锁码，请稍后重试'},503);
    if(order.disabled)return respond({error:'此订单的解锁码已停用，请人工核实'},409);
    return respond({orderId:body.orderId,code:await openCode(order.code_cipher,orderKey,encryptionKey),created},created?201:200);
  }catch(error){
    // Do not log request bodies, credentials or recoverable codes.
    console.error('Fulfillment operation failed:',error.name);
    return respond({error:'暂时无法发码，请保留订单号并重试'},500);
  }
}
