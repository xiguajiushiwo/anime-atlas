const encoder=new TextEncoder();
export const randomId=(bytes=24)=>{const a=new Uint8Array(bytes);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('')};
export async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),x=>x.toString(16).padStart(2,'0')).join('')}
export function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0}
export function normalizeCode(code){return String(code||'').trim().toUpperCase().replace(/\s+/g,'')}
export function cookieToken(request){const m=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)anima_session=([a-f0-9]{64})(?:;|$)/);return m?.[1]||null}
export function sessionCookie(request,token,maxAge=90*86400){return `anima_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`}
export const securityHeaders={
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
};
