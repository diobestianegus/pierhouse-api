import test from 'node:test';
import assert from 'node:assert/strict';
import {reportDecision,reportPenalty,monthlyStats,recoverySuggestion} from '../lib/fairness.js';
import {catalog,checklist} from '../lib/chores.js';

const report={id:'report-1',kind:'mess',person:'Pie',target:'Edo',severity:2,date:'2026-10-29',description:'Manca il sacchetto'};
const vote=(person,approve)=>({kind:'mess_vote',reportId:'report-1',person,approve});
test('una segnalazione non penalizza fino a due voti favorevoli indipendenti',()=>{
 assert.equal(reportDecision([report],report),'pending');
 assert.equal(reportDecision([report,vote('Albi',true)],report),'pending');
 const records=[report,vote('Albi',true),vote('Umbe',true)];
 assert.equal(reportDecision(records,report),'approved');
 assert.equal(reportPenalty(records,'Edo','2026-10'),2);
 assert.equal(reportPenalty([...records,{kind:'mess_status',reportId:report.id,status:'withdrawn'}],'Edo','2026-10'),0);
});
test('il voto contrario impedisce la penalità',()=>{
 const records=[report,vote('Albi',true),vote('Umbe',false)];
 assert.equal(reportDecision(records,report),'rejected');
 assert.equal(reportPenalty(records,'Edo','2026-10'),0);
});
test('le task contengono istruzioni che evitano pulizie fatte a metà',()=>{
 const tasks=catalog([]);
 const trash=checklist(tasks.find(t=>t.id==='d')).join(' ').toLowerCase();
 const counter=checklist(tasks.find(t=>t.id==='kitchen-counter')).join(' ').toLowerCase();
 const floor=checklist(tasks.find(t=>t.id==='b')).join(' ').toLowerCase();
 assert.match(trash,/sacchett/);
 assert.match(counter,/fornell/);
 assert.match(floor,/prima del mocio/);
});
test('le assenze abbassano i giorni contati e non generano recupero da due giorni di presenza',()=>{
 const records=[
  {kind:'done',person:'Edo',effort:30,date:'2026-09-01'},
  {kind:'done',person:'Albi',effort:30,date:'2026-09-01'},
  {kind:'done',person:'Umbe',effort:30,date:'2026-09-01'},
  {kind:'done',person:'Pie',effort:1,date:'2026-10-01'},
  {kind:'absence',person:'Pie',start:'2026-09-01',end:'2026-09-28'}
 ];
 const september=monthlyStats(records,'2026-09','2026-10-29');
 assert.equal(september.find(s=>s.name==='Pie').days,2);
 assert.equal(monthlyStats(records,'2026-10','2026-10-29').find(s=>s.name==='Pie').recovery,0);
});
test('un debito reale compare il mese successivo e il recupero riserva una sola task',()=>{
 const records=[
  {kind:'done',person:'Edo',effort:60,date:'2026-09-01'},
  {kind:'done',person:'Albi',effort:60,date:'2026-09-01'},
  {kind:'done',person:'Umbe',effort:60,date:'2026-09-01'},
  {kind:'done',person:'Edo',effort:2,date:'2026-10-01'}
 ];
 const data=monthlyStats(records,'2026-10','2026-10-29');
 const pie=data.find(s=>s.name==='Pie');
 assert.ok(pie.recovery>0);
 const tasks=catalog([]);
 const map=Object.fromEntries(tasks.map((t,i)=>[t.id,['Edo','Albi','Umbe'][i%3]]));
 const choice=recoverySuggestion(tasks,records,map,'Pie','2026-10','2026-10-29');
 assert.ok(choice);
 const reserved=[...records,{kind:'recovery_assignment',month:'2026-10',taskId:choice.id,person:'Edo'}];
 const next=recoverySuggestion(tasks,reserved,map,'Pie','2026-10','2026-10-29');
 assert.notEqual(next?.id,choice.id);
});
