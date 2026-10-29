import {people,participantsForTask,taskKey,dueDate} from './chores.js';

const round=n=>Math.round(n*100)/100;
const dateUtc=s=>Date.parse(s+'T12:00:00Z');
const median=values=>{const a=[...values].sort((x,y)=>x-y);return a.length?(a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2):0};
export const previousMonth=month=>{const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-2,1)).toISOString().slice(0,7)};
export function reportDecision(records,report){
 if(!report||report.person===report.target)return 'invalid';
 const state=records.find(r=>r.kind==='mess_status'&&r.reportId===report.id);
 if(state?.status==='withdrawn')return 'withdrawn';
 const voters=people.filter(p=>p!==report.person&&p!==report.target);
 if(voters.length!==2)return 'invalid';
 const votes=voters.map(person=>records.find(r=>r.kind==='mess_vote'&&r.reportId===report.id&&r.person===person)?.approve);
 if(votes.some(v=>v===false))return 'rejected';
 return votes.every(v=>v===true)?'approved':'pending';
}
export function reportVotes(records,report){
 const eligible=people.filter(p=>p!==report.person&&p!==report.target);
 return {eligible,yes:eligible.filter(p=>records.some(r=>r.kind==='mess_vote'&&r.reportId===report.id&&r.person===p&&r.approve===true)).length,no:eligible.filter(p=>records.some(r=>r.kind==='mess_vote'&&r.reportId===report.id&&r.person===p&&r.approve===false)).length};
}
export function reportPenalty(records,person,month){
 return records.filter(r=>r.kind==='mess'&&r.target===person&&r.date?.startsWith(month)&&reportDecision(records,r)==='approved').reduce((sum,r)=>sum+(Number.isInteger(r.severity)?Math.max(1,Math.min(3,r.severity)):1),0);
}
function monthEnd(month,today){
 const last=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
 return today<month+'-01'?null:(today<last?today:last);
}
function snapshot(records,month,today){
 const end=monthEnd(month,today);
 const completed=records.filter(r=>r.kind==='done'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(r.date||'')).map(r=>r.date).sort();
 const trackingStart=completed[0]||null;
 return people.map(name=>{
  let days=0;
  if(end&&trackingStart)for(let day=1;day<=Number(end.slice(8));day++){
   const date=month+'-'+String(day).padStart(2,'0');
   if(date>=trackingStart&&!records.some(r=>r.kind==='absence'&&r.person===name&&r.start<=date&&r.end>=date))days++;
  }
  const done=records.filter(r=>r.kind==='done'&&r.person===name&&r.date?.startsWith(month));
  const raw=round(done.reduce((s,r)=>s+(Number(r.effort)||0),0)),penalties=reportPenalty(records,name,month);
  const points=round(raw-penalties);
  return {name,days,raw,penalties,points,count:done.length,rate:days?points/days:0};
 });
}
export function monthlyStats(records,month,today,includeRecovery=true){
 const base=snapshot(records,month,today);
 const previousWithTargets=includeRecovery?monthlyStats(records,previousMonth(month),today,false):[];
 return base.map(current=>{
  const peers=base.filter(x=>x.name!==current.name&&x.days>=5);
  const baseTarget=round(current.days*(peers.length>=2?Math.max(0,median(peers.map(x=>x.rate)))*0.75:0));
  const prior=previousWithTargets.find(x=>x.name===current.name);
  const prevDeficit=prior&&prior.days>=5?Math.max(0,prior.baseTarget-prior.points):0;
  const recovery=includeRecovery&&prevDeficit>=2?Math.min(8,Math.ceil(prevDeficit)):0;
  const target=round(baseTarget+recovery);
  return {...current,baseTarget,recovery,target,deficit:round(Math.max(0,target-current.points)),baseDeficit:round(Math.max(0,baseTarget-current.points)),reliable:peers.length>=2};
 }).sort((a,b)=>b.rate-a.rate);
}
export function recoverySuggestion(tasks,records,assignments,person,month,today){
 const entry=monthlyStats(records,month,today).find(x=>x.name===person);
 if(!entry||entry.recovery<=0||records.some(r=>r.kind==='absence'&&r.person===person&&r.start<=today&&r.end>=today))return null;
 const cutoff=dateUtc(today)+90*86400000;
 const candidates=tasks.filter(t=>participantsForTask(t).includes(person)&&assignments[taskKey(t)]!==person&&dateUtc(dueDate(t,records,today))<=cutoff)
  .sort((a,b)=>b.effort-a.effort||dueDate(a,records,today).localeCompare(dueDate(b,records,today)));
 return candidates[0]||null;
}
