import {people} from '../../lib/chores.js';
import {hash,pushTables,validateSubscription,sendPush} from '../../lib/push-server.js';
import {notificationCopy} from '../../lib/notification-copy.js';
export function createPushHandler(env:any){
const runtime=env as typeof env & {PUSH_VAPID_PUBLIC_KEY?:string;PUSH_VAPID_PRIVATE_KEY?:string};
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function device(req:Request){const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||!/^[a-f0-9]{64}$/.test(token))return null;return await env.DB.prepare('SELECT * FROM push_devices WHERE token_hash=?').bind(await hash(token)).first<any>();}
async function GET(req:Request){try{await pushTables(env.DB);const d=await device(req);const last=await env.DB.prepare("SELECT value FROM push_meta WHERE id='last_dispatch'").first<{value:string}>();const schedule=await env.DB.prepare("SELECT value FROM push_meta WHERE id='schedule'").first<{value:string}>();return json({configured:!!runtime.PUSH_VAPID_PRIVATE_KEY&&!!runtime.PUSH_VAPID_PUBLIC_KEY,publicKey:runtime.PUSH_VAPID_PUBLIC_KEY||null,registered:!!d,person:d?.person||null,automatic:true,lastDispatch:last?JSON.parse(last.value).at:null});}catch{return json({error:'Notifiche temporaneamente non disponibili.'},503)}}
async function POST(req:Request){try{
 if(req.headers.get('Origin')&&req.headers.get('Origin')!==new URL(env.FRONTEND_URL).origin)return json({error:'Origine non valida.'},403);
 if(Number(req.headers.get('Content-Length')||0)>6000)return json({error:'Richiesta troppo grande.'},413);
 if(!runtime.PUSH_VAPID_PUBLIC_KEY||!runtime.PUSH_VAPID_PRIVATE_KEY)return json({error:'Invio push dal server non ancora configurato.'},503);
 await pushTables(env.DB);const text=await req.text();if(text.length>6000)return json({error:'Richiesta troppo grande.'},413);const b=JSON.parse(text);const d=await device(req);
 if(b.action==='subscribe'){
  if(!people.includes(b.person))throw Error('Scegli un coinquilino.');
  const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||!/^[a-f0-9]{64}$/.test(token))return json({error:'Identificativo del dispositivo non valido.'},401);
  const s=validateSubscription(b.subscription),id=await hash(s.endpoint),tokenHash=await hash(token);
  const existing=await env.DB.prepare('SELECT token_hash FROM push_devices WHERE id=?').bind(id).first<{token_hash:string}>();if(existing&&existing.token_hash!==tokenHash)return json({error:'Registrazione precedente: disattiva e riattiva le notifiche su questo dispositivo.'},409);
  if(!existing){const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM push_devices').first<{n:number}>();if((count?.n||0)>=100)return json({error:'Troppi dispositivi registrati. Rimuovi quelli non usati.'},429);}
  if(d&&d.id!==id)await env.DB.prepare('DELETE FROM push_devices WHERE id=?').bind(d.id).run();
  await env.DB.prepare('INSERT INTO push_devices(id,token_hash,subscription,person,updated) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET subscription=excluded.subscription,person=excluded.person,updated=excluded.updated').bind(id,tokenHash,JSON.stringify(s),b.person,Date.now()).run();return json({ok:true});
 }
 if(!d)return json({error:'Prima abilita le notifiche su questo dispositivo.'},401);
 if(b.action==='unsubscribe'){await env.DB.prepare('DELETE FROM push_devices WHERE id=?').bind(d.id).run();return json({ok:true});}
 if(b.action==='test'){
  const now=Date.now();const claimed=await env.DB.prepare('UPDATE push_devices SET last_test=? WHERE id=? AND last_test<?').bind(now,d.id,now-30000).run();if(!claimed.meta.changes)return json({error:'Aspetta 30 secondi prima di un’altra prova.'},429);
  const sent=await sendPush(JSON.parse(d.subscription),{...notificationCopy([],true),tag:'pierhouse-push-test'},runtime);
  if(sent.expired){await env.DB.prepare('DELETE FROM push_devices WHERE id=?').bind(d.id).run();return json({error:'Registrazione scaduta: disattiva e riattiva le notifiche.'},410);}
  if(!sent.accepted)return json({error:'Il servizio push ha rifiutato l’invio (HTTP '+sent.status+'). Riprova più tardi.'},502);
  return json({ok:true,accepted:true});
 }
 return json({error:'Operazione non valida.'},400);
}catch(e){return json({error:e instanceof Error?e.message:'Invio non riuscito.'},400)}}
return {GET,POST};
}
