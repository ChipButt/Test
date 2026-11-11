const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers});
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const id=()=>crypto.randomUUID();
const token=()=>id().replaceAll('-','')+id().replaceAll('-','');
const valid=t=>typeof t==='string'&&/^[0-9a-f]{64}$/.test(t);
const limit=async(env,key,max,windowSeconds)=>{const now=Math.floor(Date.now()/1000);await env.DB.prepare('INSERT INTO request_limits (key,window_start,attempts) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END,attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END').bind(key,now,now-windowSeconds,now-windowSeconds).run();const r=await env.DB.prepare('SELECT attempts FROM request_limits WHERE key=?').bind(key).first();return r.attempts<=max};
const customer=async(env,t)=>valid(t)?env.DB.prepare('SELECT id,stamps,rewards,redeemed FROM customers WHERE token_hash=?').bind(await hash(t)).first():null;
async function staff(env,req){const auth=req.headers.get('authorization')||'';if(!auth.startsWith('Bearer '))return false;const t=auth.slice(7);if(!valid(t))return false;const row=await env.DB.prepare('SELECT 1 AS ok FROM staff_sessions WHERE token_hash=? AND expires_at>?').bind(await hash(t),Math.floor(Date.now()/1000)).first();return !!row}
async function body(req){if(Number(req.headers.get('content-length')||0)>4096)throw new Error('Request too large');return req.json()}
export default {async fetch(req,env){
const url=new URL(req.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(req);
const path=url.pathname,method=req.method,ip=req.headers.get('cf-connecting-ip')||'unknown';
try {
if(path==='/api/health'&&method==='GET')return json({ok:true});
if(path==='/api/join'&&method==='POST'){
if(!await limit(env,'join:'+ip,12,3600))return json({error:'Too many new cards. Try later.'},429);
const t=token();await env.DB.prepare('INSERT INTO customers(id,token_hash) VALUES(?,?)').bind(id(),await hash(t)).run();return json({token:t},201)}
if(path==='/api/card'&&method==='GET'){
if(!await limit(env,'card:'+ip,600,3600))return json({error:'Too many requests'},429);
const c=await customer(env,url.searchParams.get('token'));return c?json({stamps:c.stamps,rewards:c.rewards,redeemed:c.redeemed}):json({error:'Card not found or invalid'},404)}
if(path==='/api/staff/login'&&method==='POST'){
if(!await limit(env,'login:'+ip,8,900))return json({error:'Too many attempts. Try later.'},429);
if(!env.STAFF_KEY||env.STAFF_KEY.length<16)return json({error:'Staff access is not configured'},503);
const b=await body(req);if(typeof b.key!=='string'||b.key.length>256||await hash(b.key)!==await hash(env.STAFF_KEY))return json({error:'Incorrect access key'},401);
const t=token();await env.DB.prepare('INSERT INTO staff_sessions(token_hash,expires_at) VALUES(?,?)').bind(await hash(t),Math.floor(Date.now()/1000)+8*3600).run();return json({token:t,expiresIn:28800})}
if(!await staff(env,req))return json({error:'Staff session expired. Sign in again.'},401);
if(path==='/api/staff/logout'&&method==='POST'){await env.DB.prepare('DELETE FROM staff_sessions WHERE token_hash=?').bind(await hash(req.headers.get('authorization').slice(7))).run();return json({ok:true})}
if(path==='/api/stats'&&method==='GET'){
const q=await env.DB.batch([env.DB.prepare('SELECT COUNT(*) AS n FROM customers'),env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE type='stamp'"),env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE type='redeem'"),env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE type='stamp' AND date(created_at)=date('now')")]);
return json({members:q[0].results[0].n,stamps:q[1].results[0].n,redemptions:q[2].results[0].n,today:q[3].results[0].n})}
if(path==='/api/staff/card'&&method==='POST'){const b=await body(req);const c=await customer(env,b.token);return c?json({stamps:c.stamps,rewards:c.rewards,redeemed:c.redeemed}):json({error:'Card not found'},404)}
if((path==='/api/stamp'||path==='/api/redeem')&&method==='POST'){
const b=await body(req);const c=await customer(env,b.token);if(!c)return json({error:'Card not found'},404);
if(!await limit(env,'change:'+ip,400,3600))return json({error:'Too many operations'},429);
const action=path.slice(5),n=Number(env.STAMPS_REQUIRED||8);
if(!Number.isInteger(n)||n<1||n>20)return json({error:'Invalid reward configuration'},500);
const op=typeof b.operationId==='string'&&/^[0-9a-f-]{36}$/.test(b.operationId)?b.operationId:null;
if(!op)return json({error:'Operation ID required'},400);
const exists=await env.DB.prepare('SELECT 1 AS ok FROM operations WHERE id=?').bind(op).first();
if(exists)return json({ok:true,duplicate:true});
if(action==='redeem'&&c.rewards<1)return json({error:'No reward available'},409);
const earn=c.stamps+1>=n;
const queries=[env.DB.prepare('INSERT INTO operations(id,customer_id,action) VALUES(?,?,?)').bind(op,c.id,action)];
if(action==='stamp'){
queries.push(env.DB.prepare('UPDATE customers SET stamps=?,rewards=rewards+? WHERE id=? AND stamps=?').bind(earn?0:c.stamps+1,earn?1:0,c.id,c.stamps));
queries.push(env.DB.prepare("INSERT INTO events(id,customer_id,type) VALUES(?,?,'stamp')").bind(id(),c.id));
if(earn)queries.push(env.DB.prepare("INSERT INTO events(id,customer_id,type) VALUES(?,?,'earn')").bind(id(),c.id));
}else{
queries.push(env.DB.prepare('UPDATE customers SET rewards=rewards-1,redeemed=redeemed+1 WHERE id=? AND rewards>0').bind(c.id));
queries.push(env.DB.prepare("INSERT INTO events(id,customer_id,type) VALUES(?,?,'redeem')").bind(id(),c.id));
}
const result=await env.DB.batch(queries);
if(!result[1].meta.changes)return json({error:'Card changed; refresh and try again'},409);
return json({ok:true})}
return json({error:'Not found'},404);
}catch(e){console.error('request failed',e);return json({error:'Unable to complete request'},500)}
}};