import webpush from 'web-push';
import {pushTables} from '../lib/push-server.js';
import {migrateLegacy} from './migrate';

// Deployment needs only a D1 binding. Keys stay in the private database and
// are never included in API data, source code, build output or logs.
const ready = new WeakMap<object, Promise<any>>();
export function prepareRuntime(env:any) {
 let pending=ready.get(env.DB);
 if(!pending){
  pending=(async()=>{
   await env.DB.prepare('CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,payload TEXT NOT NULL,created INTEGER NOT NULL)').run();
   await pushTables(env.DB);
   await migrateLegacy(env);
   if(env.PUSH_VAPID_PUBLIC_KEY && env.PUSH_VAPID_PRIVATE_KEY)return env;
   let stored=await env.DB.prepare("SELECT value FROM push_meta WHERE id='vapid_keys'").first();
   if(!stored){
    const candidate=webpush.generateVAPIDKeys();
    await env.DB.prepare("INSERT OR IGNORE INTO push_meta(id,value) VALUES('vapid_keys',?)").bind(JSON.stringify(candidate)).run();
    stored=await env.DB.prepare("SELECT value FROM push_meta WHERE id='vapid_keys'").first();
   }
   const keys=JSON.parse(stored.value);
   return {...env,PUSH_VAPID_PUBLIC_KEY:keys.publicKey,PUSH_VAPID_PRIVATE_KEY:keys.privateKey};
  })();
  ready.set(env.DB,pending);
  pending.catch(()=>ready.delete(env.DB));
 }
 return pending;
}
