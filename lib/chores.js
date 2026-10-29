export const people=['Pie','Edo','Albi','Umbe'];
export const defaults=[{id:'a',name:'Pulire il bagno',room:'Bagno',effort:4},{id:'b',name:'Lavare i pavimenti',room:'Tutta casa',effort:3},{id:'d',name:'Portare fuori la spazzatura',room:'Tutta casa',effort:1},{id:'e',name:'Pulire il forno',room:'Cucina',effort:5,every:3,unit:'months'},{id:'f',name:'Lavare le finestre',room:'Tutta casa',effort:5,every:1,unit:'months'},{id:'g',name:'Passare l’aspirapolvere',room:'Tutta casa',effort:2}];
export const additionalTasks=[
{id:'living-chairs-clean',name:'Pulire le sedie del salotto',room:'Soggiorno',effort:4,every:3,unit:'months',since:'2026-10-20',checklist:['Rimuovi briciole e polvere da sedute e fessure','Pulisci sedute e schienali con un prodotto adatto','Pulisci gambe e parte inferiore','Asciuga e rimetti le sedie in ordine']},
{id:'fridge-clean',name:'Pulire il frigo',room:'Cucina',effort:4,every:3,unit:'months',since:'2026-10-20',checklist:['Svuota e controlla gli alimenti','Lava ripiani e cassetti','Pulisci interno, guarnizioni e maniglia','Asciuga e rimetti gli alimenti in ordine']},
{id:'albi-bathroom',name:'Pulire il bagno di Albi',room:'Bagno Albi',effort:4,every:1,unit:'weeks',since:'2026-10-20',checklist:['Pulisci lavandino e rubinetti','Igienizza WC e sanitari','Pulisci doccia, specchio e pavimento']},
{id:'trash-bins-clean',name:'Pulire i bidoni della spazzatura',room:'Tutta casa',effort:2,every:1,unit:'weeks',since:'2026-10-20',checklist:['Svuota i bidoni e rimuovi i residui senza lasciarli sparsi','Lava interno, esterno, bordi e coperchi','Asciuga e rimetti i sacchetti corretti in ciascun bidone']},
{id:'balcony-sweep',name:'Spazzare il balcone',room:'Balcone',effort:2,every:3,unit:'weeks',since:'2026-10-20',checklist:['Sposta gli oggetti leggeri','Spazza pavimento e angoli','Raccogli e butta polvere e foglie']},
{id:'sofa-clean',name:'Pulire il divano',room:'Soggiorno',effort:3,every:2,unit:'weeks',since:'2026-10-20',checklist:['Togli i cuscini e aspira seduta e fessure','Pulisci braccioli e schienale','Rimetti in ordine i cuscini']},
{id:'under-sofa',name:'Pulire sotto il divano',room:'Soggiorno',effort:3,every:2,unit:'weeks',since:'2026-10-20',checklist:['Libera lo spazio sotto il divano','Aspira polvere e residui','Pulisci il pavimento e rimetti tutto a posto']},
{id:'tv-shelves',name:'Pulire gli scaffali TV',room:'Soggiorno',effort:2,every:2,unit:'weeks',since:'2026-10-20',checklist:['Sposta gli oggetti dagli scaffali','Spolvera superfici e bordi','Rimetti gli oggetti in ordine']},
{id:'kitchen-counter',name:'Pulire il piano cucina',room:'Cucina',effort:1,every:1,unit:'days',since:'2026-10-20',checklist:['Libera piano cucina e piano cottura da oggetti, briciole e residui','Sgrassa il piano di lavoro e il piano cottura freddo, inclusi i fornelli','Pulisci paraschizzi e superfici vicine; rimuovi eventuali residui dal bordo del lavello','Asciuga e rimetti tutto in ordine']},
{id:'living-vacuum',name:'Aspirapolvere in sala',room:'Soggiorno',effort:2,every:3,unit:'days',since:'2026-10-20',checklist:['Libera il pavimento della sala','Aspira pavimento, tappeto e angoli','Riponi l’aspirapolvere']},
{id:'kitchen-sink',name:'Pulire il lavandino cucina',room:'Cucina',effort:1,every:2,unit:'days',since:'2026-10-20',checklist:['Rimuovi residui, piatti dimenticati e svuota il filtro','Pulisci vasca, scarico, bordi e rubinetti','Risciacqua, asciuga e lascia libero il lavello']},
{id:'outside-sink',name:'Pulire il lavandino fuori',room:'Fuori',effort:2,every:1,unit:'weeks',since:'2026-10-20',checklist:['Libera il lavandino','Pulisci vasca e rubinetti','Risciacqua e asciuga']},
{id:'white-cabinet',name:'Pulire l’armadio bianco fuori',room:'Fuori',effort:3,every:5,unit:'months',since:'2026-10-20',checklist:['Spolvera la parte superiore e i bordi','Pulisci ante e maniglie','Asciuga le superfici']},
{id:'shower-clean',name:'Pulire la doccia',room:'Bagno',effort:3,every:1,unit:'weeks',since:'2026-10-20',checklist:['Pulisci piatto doccia e scarico','Pulisci pareti, vetri e rubinetteria','Risciacqua e asciuga']},
{id:'stairs-clean',name:'Pulire le scale',room:'Scale',effort:3,every:3,unit:'weeks',since:'2026-10-20',checklist:['Spazza o aspira gradini e angoli','Pulisci corrimano e ringhiera','Lava i gradini e lascia asciugare']},
{id:'kitchen-doors',name:'Pulire le ante cucina',room:'Cucina',effort:3,every:1,unit:'months',since:'2026-10-20',checklist:['Rimuovi polvere e unto dalle ante','Pulisci maniglie e bordi','Asciuga le superfici']},
{id:'kitchen-shelves-lower',name:'Pulire gli scaffali cucina (sotto)',room:'Cucina',effort:3,every:3,unit:'months',since:'2026-10-20',checklist:['Svuota gli scaffali inferiori','Rimuovi briciole e pulisci ripiani e angoli','Asciuga e rimetti tutto in ordine']},
{id:'kitchen-shelves-upper',name:'Pulire gli scaffali cucina (sopra)',room:'Cucina',effort:4,every:3,unit:'months',since:'2026-10-20',checklist:['Svuota gli scaffali superiori raggiungibili','Spolvera e pulisci i ripiani','Asciuga e rimetti tutto in ordine']}
];
defaults.push(...additionalTasks);
export const taskKey=t=>t.baseId||t.id;
export function catalog(records){return [...defaults.map(t=>({every:1,unit:'weeks',since:'2026-10-20',...t,...records.find(r=>r.kind==='task'&&r.baseId===t.id)})),...records.filter(r=>r.kind==='task'&&!r.baseId).map(t=>({...t,...records.find(r=>r.kind==='task'&&r.baseId===t.id)}))]}
export function participantsForTask(t){if(taskKey(t)==='albi-bathroom'||t.room==='Bagno Albi')return ['Albi'];if(['a','shower-clean'].includes(taskKey(t))||t.room==='Bagno')return people.filter(p=>p!=='Albi');return people}
export function swapCandidates(tasks,map,task,person){const previous=map[taskKey(task)];return tasks.filter(t=>taskKey(t)!==taskKey(task)&&map[taskKey(t)]===person&&participantsForTask(task).includes(person)&&participantsForTask(t).includes(previous))}
export function lottery(tasks,names=people,random=Math.random){return extendAssignments(tasks,{},names,random)}
export function exchange(map,key,person,swapKey,tasks=defaults){const task=tasks.find(t=>taskKey(t)===key);if(!task||!participantsForTask(task).includes(person))throw Error('Questa pulizia è riservata agli utilizzatori del bagno.');const previous=map[key],next={...map};if(previous===person)return {map:next,previous,swapKey:null};const choices=swapCandidates(tasks,map,task,person);if(swapKey){if(!choices.some(t=>taskKey(t)===swapKey))throw Error('Scambio non consentito: rispetta i bagni di ciascuno.');next[swapKey]=previous}else if(choices.length)throw Error('Scegli una tua task da scambiare.');next[key]=person;return {map:next,previous,swapKey:swapKey||null}}
export const defaultChecklists={
a:['Pulisci lavandino e rubinetti','Igienizza WC e bidet','Pulisci specchio e pavimento'],
b:['Libera il pavimento e verifica che sia stato aspirato o spazzato prima del mocio','Lava il pavimento delle stanze comuni, anche bordi e punti raggiungibili','Risciacqua, lascia asciugare e riponi secchio e mocio puliti'],
c:['Pulisci piano cottura e paraschizzi','Pulisci piano di lavoro e lavello','Togli briciole e residui'],
d:['Controlla raccolta differenziata e sacchetti dei bidoni pieni','Porta fuori tutti i rifiuti da svuotare senza lasciarli a terra','Rimetti un sacchetto corretto in OGNI bidone svuotato; non lasciare contenitori senza sacchetto'],
e:['Rimuovi e lava griglie e teglie','Pulisci interno e sportello','Rimuovi i residui del detergente'],
f:['Pulisci vetri interni ed esterni raggiungibili','Pulisci telai e davanzali','Asciuga senza lasciare aloni'],
g:['Libera i pavimenti da ostacoli, briciole e residui grossi','Aspira le stanze comuni, gli angoli e sotto i mobili raggiungibili PRIMA del mocio','Svuota il contenitore se pieno e riponi l’aspirapolvere']
};
export function checklist(t){return t.checklist??defaultChecklists[taskKey(t)]??[]}
export function lastCompletion(t,records){return records.filter(r=>r.kind==='done'&&!r.partial&&r.name===t.name).sort((a,b)=>b.date.localeCompare(a.date)||(b.created||0)-(a.created||0))[0]}
export function advance(date,every,unit){const d=new Date(date+'T12:00:00');if(unit==='months'){const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+every);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}else d.setDate(d.getDate()+every*(unit==='days'?1:7));return d.toLocaleDateString('sv-SE')}
export function dueDate(t,records,today){const last=lastCompletion(t,records),anchor=last?.id||'initial';const moved=records.find(r=>r.kind==='deadline'&&r.taskId===taskKey(t)&&r.anchor===anchor);return moved?.date||advance(last?.date||t.since||today,t.every||1,t.unit||'weeks')}

export function extendAssignments(tasks,map,names=people,random=Math.random){
const next={...map},load=Object.fromEntries(people.map(n=>[n,0]));
for(const t of tasks)if(participantsForTask(t).includes(map[taskKey(t)]))load[map[taskKey(t)]]+=t.effort;
for(const t of [...tasks].sort((a,b)=>b.effort-a.effort)){if(participantsForTask(t).includes(map[taskKey(t)]))continue;const eligible=participantsForTask(t).filter(n=>names.includes(n)),min=Math.min(...eligible.map(n=>load[n])),pool=eligible.filter(n=>load[n]===min),owner=pool[Math.floor(random()*pool.length)]||null;next[taskKey(t)]=owner;if(owner)load[owner]+=t.effort}return next
}
export function dayDifference(later,earlier){return Math.round((Date.parse(later+'T12:00:00Z')-Date.parse(earlier+'T12:00:00Z'))/86400000)}
export function completionTiming(t,records,date,today){
const last=lastCompletion(t,records),anchor=last?.id||'initial';
if((last&&last.date>date)||(!last&&t.since&&date<t.since))return {timingKnown:false};
const moves=records.filter(r=>r.kind==='deadline'&&r.taskId===taskKey(t)&&r.anchor===anchor).sort((a,b)=>(a.created||0)-(b.created||0));
const originalDue=moves[0]?.previousDate||advance(last?.date||t.since||today,t.every||1,t.unit||'weeks');
const effectiveDue=dueDate(t,records,today),lateDaysOriginal=Math.max(0,dayDifference(date,originalDue)),lateDays=Math.max(0,dayDifference(date,effectiveDue));
const delayed=moves.filter(r=>r.date>r.previousDate);
return {timingKnown:true,originalDue,effectiveDue,lateDaysOriginal,lateDays,onTimeOriginal:lateDaysOriginal===0,onTime:lateDays===0,postponeCount:delayed.length,postponeDays:delayed.reduce((s,r)=>s+dayDifference(r.date,r.previousDate),0)}
}
export function punctualityStats(records,month,mode='original'){
return people.map(person=>{const entries=records.filter(r=>r.kind==='done'&&r.person===person&&r.date.startsWith(month)),known=entries.filter(r=>r.timingKnown===true&&typeof r.lateDaysOriginal==='number'&&typeof r.lateDays==='number');
const late=known.filter(r=>(mode==='original'?r.lateDaysOriginal:r.lateDays)>0),delay=late.reduce((s,r)=>s+(mode==='original'?r.lateDaysOriginal:r.lateDays),0);
const moves=records.filter(r=>r.kind==='deadline'&&r.person===person&&r.date>r.previousDate&&new Date(r.created||0).toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'}).startsWith(month));
return {person,total:entries.length,known:known.length,unknown:entries.length-known.length,onTime:known.length-late.length,late:late.length,percent:known.length?Math.round((known.length-late.length)/known.length*100):null,averageLate:late.length?delay/late.length:0,postponements:moves.length,postponedDays:moves.reduce((s,r)=>s+dayDifference(r.date,r.previousDate),0)}
})
}
export function messStatus(records,id){return records.find(r=>r.kind==='mess_status'&&r.reportId===id)||{status:'open'}}

export function cycleProgress(t,records){const anchor=lastCompletion(t,records)?.id||'initial';return [...new Set(records.filter(r=>r.kind==='done'&&r.partial&&r.name===t.name&&r.anchor===anchor).flatMap(r=>r.checkedItems||[]))].filter(x=>checklist(t).includes(x))}
export function earnedPoints(t,items){const steps=checklist(t);return steps.length?Math.round(t.effort*new Set(items.filter(x=>steps.includes(x))).size/steps.length*100)/100:t.effort}

export const messLevels=[{value:1,label:'Schifetto',description:'Piccolo casino, grande fastidio.'},{value:2,label:'Schifo serio',description:'Qui serve una spugna e un esame di coscienza.'},{value:3,label:'Disastro biologico',description:'La casa sta chiedendo asilo politico.'}];

export function nextOwner(task,current,records,date){const pool=participantsForTask(task).filter(p=>!records.some(a=>a.kind==='absence'&&a.person===p&&a.start<=date&&a.end>=date));if(!pool.length)return null;const start=people.indexOf(current);for(let i=1;i<=people.length;i++){const p=people[(start+i+people.length)%people.length];if(pool.includes(p))return p}return pool[0]}
