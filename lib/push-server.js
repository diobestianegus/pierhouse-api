// Server-only. Push endpoints and capability hashes never enter /api/data.
import webpush from 'web-push';
import {catalog} from './chores.js';
import {reminderTasks,notificationCopy} from './notification-copy.js';
export const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');
export async function pushTables(db){await db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS push_devices (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, subscription TEXT NOT NULL, person TEXT NOT NULL, last_day TEXT, last_test INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL, last_result TEXT)'),
 db.prepare('CREATE TABLE IF NOT EXISTS push_meta (id TEXT PRIMARY KEY, value TEXT NOT NULL)')
]);}
export function validateSubscription(s){
 if(!s||typeof s.endpoint!=='string'||s.endpoint.length>2048)throw Error('Registrazione push non valida.');
 const u=new URL(s.endpoint);const h=u.hostname;
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||!(h==='fcm.googleapis.com'||h==='updates.push.services.mozilla.com'||h.endsWith('.push.apple.com')||h==='web.push.apple.com'||h.endsWith('.notify.windows.com')))throw Error('Servizio push non supportato. Usa Safari, Chrome, Firefox o Edge aggiornati.');
 if(!s.keys||!/^B[A-Za-z0-9_-]{86}$/.test(s.keys.p256dh)||!/^[A-Za-z0-9_-]{22}$/.test(s.keys.auth))throw Error('Chiavi push non valide.');
 return {endpoint:s.endpoint,keys:{p256dh:s.keys.p256dh,auth:s.keys.auth}};
}
export async function sendPush(subscription,copy,env,fetcher=fetch){
 const request=webpush.generateRequestDetails(subscription,JSON.stringify({...copy,url:env.FRONTEND_URL}),{TTL:3600,urgency:'normal',contentEncoding:'aes128gcm',vapidDetails:{subject:env.FRONTEND_URL,publicKey:env.PUSH_VAPID_PUBLIC_KEY,privateKey:env.PUSH_VAPID_PRIVATE_KEY}});
 const response=await fetcher(request.endpoint,{method:'POST',headers:request.headers,body:new Uint8Array(request.body),redirect:'error',signal:AbortSignal.timeout(15000)});
 return {accepted:response.status>=200&&response.status<300,expired:response.status===404||response.status===410,status:response.status};
}
export async function dispatchReminders(env,{now=new Date(),fetcher=fetch}={}){
 await pushTables(env.DB);
 const day=now.toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});
 const raw=await env.DB.prepare('SELECT * FROM records ORDER BY created DESC').all();const records=raw.results.map(r=>({id:r.id,kind:r.kind,created:r.created,...JSON.parse(r.payload)}));
 const tasks=catalog(records),assignments=records.find(r=>r.kind==='assignments')?.map||{};
 const devices=await env.DB.prepare('SELECT * FROM push_devices').all();const result={date:day,devices:devices.results.length,accepted:0,failed:0,skipped:0,expired:0};
 for(const device of devices.results){
  const list=reminderTasks(tasks,records,assignments,device.person,day);if(!list.length||device.last_day===day){result.skipped++;continue;}
  const claim=await env.DB.prepare('UPDATE push_devices SET last_day=? WHERE id=? AND (last_day IS NULL OR last_day<>?)').bind(day,device.id,day).run();if(!claim.meta.changes){result.skipped++;continue;}
  try{
   const sent=await sendPush(JSON.parse(device.subscription),{...notificationCopy(list),tag:'pierhouse-'+device.person+'-'+day},env,fetcher);
   if(sent.expired){await env.DB.prepare('DELETE FROM push_devices WHERE id=?').bind(device.id).run();result.expired++;}
   else if(sent.accepted){result.accepted++;await env.DB.prepare('UPDATE push_devices SET last_result=? WHERE id=?').bind('accepted:'+day,device.id).run();}
   else throw Error('push:'+sent.status);
  }catch{result.failed++;await env.DB.prepare('UPDATE push_devices SET last_day=?,last_result=? WHERE id=? AND last_day=?').bind(device.last_day,'failed:'+day,device.id,day).run();}
 }
 await env.DB.prepare('INSERT INTO push_meta(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('last_dispatch',JSON.stringify({...result,at:now.toISOString()})).run();return result;
}
// waitUntil keeps this short server-side test alive after the page closes.
export async function queuePushTest(req,env,ctx){
 const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
 if(req.method!=='POST')return json({error:'Metodo non valido.'},405);
 if(req.headers.get('Origin')&&req.headers.get('Origin')!==new URL(env.FRONTEND_URL).origin)return json({error:'Origine non valida.'},403);
 if(!env.PUSH_VAPID_PRIVATE_KEY)return json({error:'Invio push non configurato.'},503);
 await pushTables(env.DB);const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||!/^[a-f0-9]{64}$/.test(token))return json({error:'Dispositivo non riconosciuto.'},401);
 const d=await env.DB.prepare('SELECT * FROM push_devices WHERE token_hash=?').bind(await hash(token)).first();if(!d)return json({error:'Prima abilita le notifiche.'},401);
 const now=Date.now(),claim=await env.DB.prepare('UPDATE push_devices SET last_test=?,last_result=? WHERE id=? AND last_test<?').bind(now,'test-queued',d.id,now-30000).run();if(!claim.meta.changes)return json({error:'Aspetta 30 secondi prima di un’altra prova.'},429);
 ctx.waitUntil((async()=>{await new Promise(resolve=>setTimeout(resolve,10000));const current=await env.DB.prepare('SELECT * FROM push_devices WHERE id=? AND token_hash=?').bind(d.id,d.token_hash).first();if(!current)return;try{const sent=await sendPush(JSON.parse(current.subscription),{...notificationCopy([],true),tag:'pierhouse-push-test'},env);if(sent.expired)await env.DB.prepare('DELETE FROM push_devices WHERE id=?').bind(d.id).run();else await env.DB.prepare('UPDATE push_devices SET last_result=? WHERE id=?').bind(sent.accepted?'test-accepted':'test-failed:'+sent.status,d.id).run();}catch{await env.DB.prepare('UPDATE push_devices SET last_result=? WHERE id=?').bind('test-failed',d.id).run();}})());
 return json({ok:true,queued:true,delaySeconds:10},202);
}
