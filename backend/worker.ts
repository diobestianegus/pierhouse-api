import {createDataHandler} from './routes/data';
import {createCalendarHandler} from './routes/calendar';
import {createPushHandler} from './routes/push';
import {dispatchReminders,queuePushTest} from '../lib/push-server.js';
import {prepareRuntime} from './runtime';
export default {
 async fetch(req:Request,env:any,ctx:any){
  const origin=req.headers.get('Origin'),allowed=new URL(env.FRONTEND_URL).origin;
  const cors={'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Vary':'Origin'};
  if(origin&&origin!==allowed)return new Response('Origine non consentita',{status:403});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  let response:Response;
  try{env=await prepareRuntime(env);const path=new URL(req.url).pathname;
   if(path==='/health')response=Response.json({ok:true});
   else if(path==='/api/push/test')response=await queuePushTest(req,env,ctx);
   else {const handler=path==='/api/data'?createDataHandler(env):path==='/api/calendar'?createCalendarHandler(env):path==='/api/push'?createPushHandler(env):null;const method=handler?.[req.method];response=method?await method(req):new Response('Non trovato',{status:404})}
  }catch{response=Response.json({error:'Servizio temporaneamente non disponibile.'},{status:503})}
  const headers=new Headers(response.headers);for(const [k,v]of Object.entries(cors))headers.set(k,v);
  return new Response(response.body,{status:response.status,headers});
 },
 async scheduled(event:any,env:any,ctx:any){const now=new Date(event.scheduledTime);const hour=Number(new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',hourCycle:'h23'}).format(now));if(hour===18)ctx.waitUntil(prepareRuntime(env).then(runtime=>dispatchReminders(runtime,{now})));}
};
