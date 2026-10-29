import {spongePhrases,validateSpongePhrase} from '../../lib/sponge-copy.js';
import {reportDecision,monthlyStats,recoverySuggestion} from '../../lib/fairness.js';
import {catalog,lottery,people,exchange,taskKey,checklist,lastCompletion,dueDate,extendAssignments,completionTiming,participantsForTask,cycleProgress,earnedPoints,nextOwner} from '../../lib/chores.js';
export function createDataHandler(env:any){
async function rows(){const r=await env.DB.prepare('SELECT * FROM records ORDER BY created DESC').all();return r.results.map((x:any)=>({id:x.id,kind:x.kind,created:x.created,...JSON.parse(x.payload)}))}
const statement=(id:string,kind:string,payload:any)=>env.DB.prepare('INSERT INTO records(id,kind,payload,created) VALUES(?,?,?,?)').bind(id,kind,JSON.stringify(payload),Date.now());
const audit=(person:string,action:string,detail:string)=>statement(crypto.randomUUID(),'audit',{person,action,detail});
async function assignment(records:any[]){
const tasks=catalog(records),found=records.find(r=>r.kind==='assignments');
const date=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'}),present=people.filter(p=>!records.some(a=>a.kind==='absence'&&a.person===p&&a.start<=date&&a.end>=date));
if(found){if(tasks.every(t=>participantsForTask(t).includes(found.map[taskKey(t)]))||!present.length)return found;
const data={map:extendAssignments(tasks,found.map,present),revision:crypto.randomUUID()};
await env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(data),'assignments',JSON.stringify({map:found.map,revision:found.revision})).run();
return (await rows()).find(r=>r.kind==='assignments')}
const data={map:lottery(tasks,present.length?present:people),revision:crypto.randomUUID()};
await env.DB.prepare('INSERT OR IGNORE INTO records(id,kind,payload,created) VALUES(?,?,?,?)').bind('assignments','assignments',JSON.stringify(data),Date.now()).run();
return (await rows()).find(r=>r.kind==='assignments')
}
async function GET(){try{const r=await rows();await assignment(r);return Response.json(await rows(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Dati non disponibili. Riprova.'},{status:500})}}
async function POST(req:Request){try{const b=await req.json();const r=await rows(),state=await assignment(r);const oldPayload=JSON.stringify({map:state.map,revision:state.revision});const tasks=catalog(r);const now=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});
if(!people.includes(b.person))throw Error('Scegli un coinquilino.');
if(b.kind==='sponge_phrase'){if(b.person!=='Pie')throw Error('Queste impostazioni sono riservate al profilo Pie.');const existing=b.phraseId?spongePhrases(r).find(x=>x.phraseId===b.phraseId):null;if(b.phraseId&&!existing)throw Error('Frase non trovata o già rimossa.');const phraseId=b.phraseId||crypto.randomUUID(),text=b.deleted?existing.text:validateSpongePhrase(b.text),payload={phraseId,text,deleted:b.deleted===true,person:b.person};const old=r.find(x=>x.kind==='sponge_phrase'&&x.phraseId===phraseId);if(old){const{id,kind,created,...previous}=old;const result=await env.DB.prepare('UPDATE records SET payload=?,created=? WHERE id=? AND payload=?').bind(JSON.stringify(payload),Date.now(),id,JSON.stringify(previous)).run();if(!result.meta.changes)throw Error('Frase aggiornata nel frattempo. Riprova.')}else await statement('sponge-phrase:'+phraseId,'sponge_phrase',payload).run();await audit(b.person,b.deleted?'Frase spugna rimossa':existing?'Frase spugna modificata':'Frase spugna aggiunta',text).run();return Response.json({ok:true})}
if(b.kind==='correct_done'){const done=r.find(x=>x.id===b.recordId&&x.kind==='done');if(!done||done.person!==b.person)throw Error('Puoi correggere solo una tua registrazione.');const next={map:state.map,revision:crypto.randomUUID()};const result=await env.DB.batch([env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(next),'assignments',oldPayload),env.DB.prepare("UPDATE records SET kind='cancelled_done' WHERE id=? AND kind='done' AND EXISTS(SELECT 1 FROM records WHERE id=? AND payload=?)").bind(done.id,'assignments',JSON.stringify(next))]);if(!result[0].meta.changes)throw Error('Turni aggiornati, riprova.');await audit(b.person,'Registrazione errata eliminata',done.name+' · rimossi '+done.effort+' punti; turni attuali mantenuti.').run();return Response.json({ok:true})}
if(b.kind==='undo'){
const done=r.find(x=>x.id===b.recordId&&x.kind==='done');if(!done||done.person!==b.person||!done.beforeMap||Date.now()-done.created>600000)throw Error('Puoi annullare una tua pulizia recente entro 10 minuti.');if(state.revision!==done.afterRevision)throw Error('I turni sono cambiati dopo questa pulizia: non posso ripristinarli senza sovrascrivere le modifiche degli altri.');const next={map:done.beforeMap,revision:crypto.randomUUID()};const result=await env.DB.batch([env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(next),'assignments',oldPayload),env.DB.prepare('DELETE FROM records WHERE id=? AND EXISTS(SELECT 1 FROM records WHERE id=? AND payload=?)').bind(done.id,'assignments',JSON.stringify(next))]);if(!result[0].meta.changes)throw Error('Turni aggiornati: riprova.');await audit(b.person,'Pulizia annullata',done.name).run();return Response.json({ok:true})}
if(b.kind==='shopping'){if(typeof b.name!=='string'||!b.name.trim()||b.name.length>100)throw Error('Scrivi il nome del prodotto.');const id=crypto.randomUUID();await env.DB.batch([statement(id,'shopping',{name:b.name.trim(),person:b.person,bought:false}),audit(b.person,'Aggiunto alla spesa',b.name.trim())]);return Response.json({id})}
if(b.kind==='shopping_update'){const item=r.find(x=>x.kind==='shopping'&&x.id===b.itemId);if(!item||!!item.bought!==b.expectedBought||typeof b.bought!=='boolean')throw Error('Lista aggiornata: riprova.');const {id,kind,created,...old}=item;const payload={...old,bought:b.bought,buyer:b.bought?b.person:null};const result=await env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(payload),item.id,JSON.stringify(old)).run();if(!result.meta.changes)throw Error('Prodotto aggiornato da un altro coinquilino.');await audit(b.person,b.bought?'Prodotto comprato':'Prodotto rimesso in lista',item.name).run();return Response.json({ok:true})}
if(b.kind==='randomize'){
const present=people.filter(p=>!r.some(a=>a.kind==='absence'&&a.person===p&&a.start<=now&&a.end>=now));if(!present.length)throw Error('Tutti assenti: aggiusta le assenze prima del sorteggio.');
const next={map:lottery(tasks,present),revision:crypto.randomUUID()};const result=await env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(next),'assignments',oldPayload).run();if(!result.meta.changes)return Response.json({error:'I turni sono cambiati. Aggiorna e riprova.'},{status:409});await audit(b.person,'Turni rimescolati','Sorteggio tra i coinquilini presenti, rispettando i bagni.').run();return Response.json({ok:true})}
if(!['task','done','absence','deadline','mess','mess_status','mess_vote','recover_assign'].includes(b.kind))throw Error('Operazione non valida.');
if(b.kind!=='task'&&!people.includes(b.person))throw Error('Scegli un coinquilino.');
const validDate=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T12:00:00'));
if(b.kind==='task'&&(!b.name?.trim()||b.name.length>100||!Number.isInteger(b.effort)||b.effort<1||b.effort>5||!Number.isInteger(b.every)||b.every<1||b.every>365||!['days','weeks','months'].includes(b.unit)||!validDate(b.since)||!people.includes(b.assignee)))throw Error('Controlla nome, impegno, frequenza e assegnatario.');
if(b.kind==='absence'&&(!validDate(b.start)||!validDate(b.end)||b.start>b.end))throw Error('Controlla le date dell’assenza.');
const id=crypto.randomUUID();delete b.id;delete b.created;
if(b.kind==='mess'){
if(![1,2,3].includes(b.severity))throw Error('Scegli un grado di schifosità da 1 a 3.');
if(!people.includes(b.target)||b.target===b.person||!validDate(b.date)||b.date>now||typeof b.description!=='string'||b.description.trim().length<5||b.description.trim().length>1000)throw Error('Scegli un altro coinquilino, una data valida e descrivi il casino (5–1000 caratteri).');
if(!['task','common'].includes(b.category||'common'))throw Error('Categoria non valida.');
const linkedTask=b.category==='task'?tasks.find(t=>taskKey(t)===b.taskId):null;
if(b.category==='task'&&!linkedTask)throw Error('Scegli la pulizia contestata.');
if(r.some(x=>x.kind==='mess'&&x.person===b.person&&x.target===b.target&&x.date===b.date&&x.description===b.description.trim()&&x.kind!=='withdrawn'))throw Error('Questa segnalazione esiste già.');
const payload={person:b.person,target:b.target,severity:b.severity,date:b.date,description:b.description.trim(),category:b.category||'common',taskId:linkedTask?taskKey(linkedTask):null,taskName:linkedTask?.name||null},statePayload={reportId:id,status:'open',person:b.person,at:Date.now()};
await env.DB.batch([statement(id,'mess',payload),statement('mess-state:'+id,'mess_status',statePayload)]);return Response.json({id})}
if(b.kind==='mess_vote'){
 const report=r.find(x=>x.kind==='mess'&&x.id===b.reportId),status=r.find(x=>x.kind==='mess_status'&&x.reportId===b.reportId)?.status||'open';
 if(!report||status!=='open'||reportDecision(r,report)!=='pending')throw Error('La votazione è già chiusa o non disponibile.');
 if(b.person===report.person||b.person===report.target||typeof b.approve!=='boolean')throw Error('Può votare solo chi non è coinvolto nella segnalazione.');
 const id='mess-vote:'+report.id+':'+b.person,payload={reportId:report.id,person:b.person,approve:b.approve,at:Date.now()};
 const existing=r.find(x=>x.id===id);
 if(existing){
  const old={reportId:existing.reportId,person:existing.person,approve:existing.approve,at:existing.at};
  const change=await env.DB.prepare('UPDATE records SET payload=?,created=? WHERE id=? AND payload=?').bind(JSON.stringify(payload),Date.now(),id,JSON.stringify(old)).run();
  if(!change.meta.changes)throw Error('Votazione modificata nel frattempo. Riprova.');
 }else await statement(id,'mess_vote',payload).run();
 await audit(b.person,b.approve?'Segnalazione confermata':'Segnalazione respinta',report.target+' · '+report.description.slice(0,90)).run();
 return Response.json({ok:true});
}
if(b.kind==='recover_assign'){
 const month=now.slice(0,7),due=monthlyStats(r,month,now).find(x=>x.name===b.person);
 if(!due||due.recovery<=0)throw Error('Nessun recupero da assegnare per questo mese.');
 if(r.some(x=>x.kind==='recovery_assignment'&&x.person===b.person&&x.month===month))throw Error('Hai già preso in carico una pulizia di recupero questo mese.');
 if(b.expectedRevision!==state.revision)return Response.json({error:'Turni aggiornati: riapri il recupero.'},{status:409});
 const selected=recoverySuggestion(tasks,r,state.map,b.person,month,now);
 if(!selected||taskKey(selected)!==b.taskId)throw Error('La pulizia di recupero è cambiata: aggiorna la pagina.');
 const oldOwner=state.map[taskKey(selected)];
 const next={map:{...state.map,[taskKey(selected)]:b.person},revision:crypto.randomUUID()};
 const result=await env.DB.batch([
  env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(next),'assignments',oldPayload),
  env.DB.prepare('INSERT INTO records(id,kind,payload,created) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND payload=?)').bind('recovery:'+month+':'+b.person,'recovery_assignment',JSON.stringify({person:b.person,month,taskId:taskKey(selected),name:selected.name,effort:selected.effort,previous:oldOwner}),Date.now(),'assignments',JSON.stringify(next))
 ]);
 if(!result[0].meta.changes)throw Error('Turni aggiornati: riprova.');
 await audit(b.person,'Recupero preso in carico',selected.name+' · '+selected.effort+' punti, dal precedente assegnatario '+oldOwner).run();
 return Response.json({ok:true,taskId:taskKey(selected)});
}
if(b.kind==='mess_status'){
const report=r.find(x=>x.kind==='mess'&&x.id===b.reportId),current=r.find(x=>x.kind==='mess_status'&&x.reportId===b.reportId);
if(!report||!['open','resolved','withdrawn'].includes(b.status))throw Error('Segnalazione o stato non valido.');
if((b.status==='withdrawn'||current?.status==='withdrawn')&&b.person!==report.person)throw Error('Solo chi ha scritto la segnalazione può ritirarla o riaprirla dopo il ritiro.');
if(current?.status!==b.expectedStatus)return Response.json({error:'La segnalazione è stata aggiornata. Riprova.'},{status:409});
const payload={reportId:b.reportId,status:b.status,person:b.person,at:Date.now()};
const changed=await env.DB.prepare('UPDATE records SET payload=?,created=? WHERE id=? AND payload=?').bind(JSON.stringify(payload),Date.now(),'mess-state:'+b.reportId,JSON.stringify({reportId:current.reportId,status:current.status,person:current.person,at:current.at})).run();
if(!changed.meta.changes)return Response.json({error:'Stato aggiornato da un altro coinquilino. Riprova.'},{status:409});return Response.json({ok:true})}
if(b.kind==='deadline'){
const task=tasks.find(t=>taskKey(t)===b.taskId);if(!task||!validDate(b.date)||b.date<now||!b.reason?.trim()||b.reason.length>250)throw Error('Scegli una nuova data da oggi in poi e indica il motivo.');
if(b.expectedRevision!==state.revision||b.expectedDue!==dueDate(task,r,now))return Response.json({error:'Scadenza o turni aggiornati. Riapri lo spostamento.'},{status:409});
const next={map:state.map,revision:crypto.randomUUID()},payload={taskId:taskKey(task),name:task.name,date:b.date,previousDate:dueDate(task,r,now),reason:b.reason.trim(),person:b.person,anchor:lastCompletion(task,r)?.id||'initial'};
const results=await env.DB.batch([env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(next),'assignments',oldPayload),env.DB.prepare('INSERT INTO records(id,kind,payload,created) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND payload=?)').bind(id,'deadline',JSON.stringify(payload),Date.now(),'assignments',JSON.stringify(next))]);if(!results[0].meta.changes)return Response.json({error:'Qualcuno ha aggiornato i turni. Riprova.'},{status:409});await audit(b.person,'Scadenza spostata',task.name+': '+payload.previousDate+' → '+b.date+' · '+b.reason.trim()).run();return Response.json({id})}

if(b.kind==='task'){
if(!Array.isArray(b.checklist)||b.checklist.length>20||b.checklist.some((x:any)=>typeof x!=='string'||!x.trim()||x.length>140)||new Set(b.checklist).size!==b.checklist.length)throw Error('La checklist può avere fino a 20 voci diverse, da 140 caratteri.');
if(b.baseId&&!tasks.some(t=>taskKey(t)===b.baseId))throw Error('Task non trovata.');
if(!b.baseId&&tasks.some(t=>t.name.toLowerCase()===b.name.trim().toLowerCase()))throw Error('Esiste già una task con questo nome.');
if(!participantsForTask({...b,id:b.baseId||id}).includes(b.assignee))throw Error('Assegnatario non consentito per questo bagno.');
const next={map:{...state.map,[b.baseId||id]:b.assignee},revision:crypto.randomUUID()};const {kind,...payload}=b;const result=await env.DB.batch([env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(next),'assignments',oldPayload),env.DB.prepare('INSERT INTO records(id,kind,payload,created) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND payload=?)').bind(id,kind,JSON.stringify(payload),Date.now(),'assignments',JSON.stringify(next))]);if(!result[0].meta.changes)return Response.json({error:'I turni sono cambiati. Riprova.'},{status:409});const old=tasks.find(t=>taskKey(t)===b.baseId);await audit(b.person,b.baseId?'Task modificata':'Task aggiunta',b.name+' · difficoltà '+(old?old.effort+' → ':'')+b.effort+' · frequenza '+(old?old.every+' '+old.unit+' → ':'')+b.every+' '+b.unit+' · assegnatario '+(old?state.map[taskKey(old)]+' → ':'')+b.assignee).run();return Response.json({id})}
if(b.kind==='done'){
const task=tasks.find(t=>t.name===b.name);if(!task||!validDate(b.date)||b.date>now)throw Error('Controlla task e data.');
if(b.expectedRevision!==state.revision)return Response.json({error:'Qualcuno ha aggiornato i turni. Riapri la registrazione.'},{status:409});
const steps=checklist(task),already=cycleProgress(task,r);if(!Array.isArray(b.checkedItems))throw Error('Spunta le parti che hai pulito.');const selected=[...new Set(b.checkedItems)].filter((x:any)=>steps.includes(x)&&!already.includes(x));if(steps.length&&!selected.length)throw Error('Queste parti sono già state registrate. Aggiorna e spunta una parte ancora da fare.');if(!participantsForTask(task).includes(b.person))throw Error('Questa pulizia è riservata agli utilizzatori del bagno.');const partial=steps.some((s:string)=>!already.includes(s)&&!selected.includes(s));const points=earnedPoints(task,selected);
const swap=partial?{map:state.map,previous:state.map[taskKey(task)],swapKey:null}:exchange(state.map,taskKey(task),b.person,b.swapKey,tasks);
const rotated={...swap.map};if(!partial)rotated[taskKey(task)]=nextOwner(task,b.person,r,now);const next={map:rotated,revision:crypto.randomUUID()};const payload={beforeMap:state.map,afterRevision:next.revision,nextPerson:rotated[taskKey(task)],...completionTiming(task,r,b.date,now),name:task.name,effort:points,totalEffort:task.effort,partial,anchor:lastCompletion(task,r)?.id||'initial',checkedItems:selected,person:b.person,date:b.date,checklist:steps,previous:swap.previous,swappedTask:swap.swapKey?tasks.find(t=>taskKey(t)===swap.swapKey)?.name:null};
const results=await env.DB.batch([env.DB.prepare('UPDATE records SET payload=? WHERE id=? AND payload=?').bind(JSON.stringify(next),'assignments',oldPayload),env.DB.prepare('INSERT INTO records(id,kind,payload,created) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND payload=?)').bind(id,'done',JSON.stringify(payload),Date.now(),'assignments',JSON.stringify(next))]);if(!results[0].meta.changes)return Response.json({error:'Turni modificati nel frattempo. Riprova.'},{status:409});await audit(b.person,partial?'Pulizia parziale':'Pulizia completata',task.name+' · '+points+' punti'+(!partial?' · prossimo turno: '+(payload.nextPerson||'in attesa di rientri'):'')).run();return Response.json({id,points,partial,nextPerson:payload.nextPerson})}
const {kind,...payload}=b;await env.DB.batch([statement(id,kind,payload),audit(b.person,kind==='absence'?'Assenza aggiunta':'Registrazione aggiunta',kind==='absence'?b.start+' → '+b.end:kind)]);return Response.json({id});
}catch(e){return Response.json({error:e instanceof Error?e.message:'Controlla i dati e riprova.'},{status:400})}}
async function DELETE(req:Request){const url=new URL(req.url),id=url.searchParams.get('id'),person=url.searchParams.get('person');if(!id||id==='assignments'||!people.includes(person))return new Response('',{status:400});const found=(await rows()).find(r=>r.id===id);if(!found||!['done','absence'].includes(found.kind))return new Response('',{status:404});if(found.kind==='done'&&found.beforeMap)return Response.json({error:'Usa Annulla per ripristinare anche i turni.'},{status:400});await env.DB.batch([env.DB.prepare("DELETE FROM records WHERE id=? AND kind IN ('done','absence')").bind(id),audit(person,found.kind==='absence'?'Assenza eliminata':'Registrazione storica eliminata',found.name||found.person+' · '+found.start+' → '+found.end)]);return Response.json({ok:true})}
return {GET,POST,DELETE};
}
