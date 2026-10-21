import {apiUrl,sitePath} from '../lib/hosting';
'use client';
import {useEffect,useState} from 'react';
import {useSpongeVoice,SpongeVoiceControls} from './sponge-voice';
import {spongePhrases} from '../lib/sponge-copy.js';
import {spongeMood,spongeReminder} from '../lib/sponge-mood.js';
import {Sparkles,Hand,X} from 'lucide-react';
export function Sponge({size=96,excited=false,anger=0}:{size?:number;excited?:boolean;anger?:number}){
return <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true" className={'sponge-character anger-'+anger+' '+(excited?'excited':'')}>
<ellipse cx="60" cy="104" rx="29" ry="5" fill="#0b190e" opacity=".28"/>
<g className="sponge-body"><path d="m29 72-12 7m73-7 12 7M44 91l-5 9m37-9 5 9" stroke="#c3d3a2" strokeWidth="5" strokeLinecap="round"/>
<path d="M24 43c0-8 6-14 14-14h44c8 0 14 6 14 14v35c0 9-6 15-14 15H38c-8 0-14-6-14-15V43Z" fill={anger>=3?'#ed8061':anger===2?'#e8a15c':anger===1?'#e4bb63':'#e6ca6e'} stroke="#f0dc9b" strokeWidth="2"/>
<path d="M24 44V39c0-8 6-14 14-14h44c8 0 14 6 14 14v5H24Z" fill="#6e925a"/>
<path d="m31 33 5 4 6-5 6 5 6-5 6 5 6-5 6 5 6-5 7 5 5-3" stroke="#9fc27c" strokeWidth="2" strokeLinecap="round"/>
<circle cx="35" cy="57" r="4" fill="#c8aa4d"/><circle cx="84" cy="79" r="5" fill="#c8aa4d"/><circle cx="36" cy="81" r="3" fill="#c8aa4d"/><circle cx="85" cy="52" r="3" fill="#c8aa4d"/>
<g className="sponge-eyes"><ellipse cx="48" cy="61" rx="3" ry="4" fill="#304025"/><ellipse cx="72" cy="61" rx="3" ry="4" fill="#304025"/></g>
{anger>0&&<g stroke="#593124" strokeWidth={anger>=2?4:3} strokeLinecap="round"><path d={anger>=2?'M40 51l14 6m12 0 14-6':'M40 53l13 3m14 0 13-3'}/></g>}
<path d={anger>0?(anger>=3?'M48 79q12-15 24 0M51 76h18':'M51 79q9-10 18 0'):excited?'M49 72c5 11 17 11 22 0H49Z':'M51 74c5 6 13 6 18 0'} stroke="#596439" strokeWidth="2.5" strokeLinecap="round" fill={excited?'#596439':'none'}/>
<ellipse cx="40" cy="69" rx="5" ry="2.5" fill="#dcab64"/><ellipse cx="80" cy="69" rx="5" ry="2.5" fill="#dcab64"/>
</g>{anger>=2&&<g className="sponge-steam" stroke="#eec7ae" strokeWidth="3" strokeLinecap="round"><path d="M17 44c-9-5 6-10-2-16m89 16c9-5-6-10 2-16"/>{anger>=3&&<path d="M51 15c-5-5 4-7 0-12m17 12c5-5-4-7 0-12"/>}</g>}<g className="sponge-bubbles" stroke="#bad7ad" strokeWidth="2"><circle cx="18" cy="27" r="5"/><circle cx="99" cy="19" r="6"/><circle cx="107" cy="38" r="3"/></g>
</svg>
}

export function SpongeBuddy({person,today,records=[],late=[],dueToday=[],upcoming=[],onShow,onClean}:{person:string;today:string;records?:any[];late?:any[];dueToday?:any[];upcoming?:any[];onShow:(filter:string)=>void;onClean:(task:any)=>void}){
const [pokes,setPokes]=useState(0),[squash,setSquash]=useState(false);
const voice=useSpongeVoice();
useEffect(()=>{if(!squash)return;const t=setTimeout(()=>setSquash(false),650);return()=>clearTimeout(t)},[squash,pokes]);
const banter=spongePhrases(records).map(p=>p.text);
const next=late[0]||dueToday[0]||upcoming[0],mood=spongeMood(late,today),reminder=spongeReminder(person,late,dueToday,upcoming,mood);
return <div className={'sponge-buddy sponge-assistant mood-'+mood.level}><button className={'sponge-poke '+(squash?'is-squashed':'')} onClick={()=>{if(banter.length)voice.speak(banter[pokes%banter.length]);setPokes(p=>p+1);setSquash(true)}} aria-label="Stuzzica la spugna di Pierhouse" title="Toccami, pisquano"><Sponge size={126} anger={Math.max(mood.level,squash?2:0)}/></button><div className="sponge-speech"><span className="eyebrow">PAROLA ALLA SPUGNA</span><h2>{['Il tuo coinquilino più assorbente.','La spugna ha perso il sorriso.','La spugna sta sbroccando.','ALLARME SPUGNA: FURIA TOTALE.'][mood.level]}</h2><span className="sponge-mood-badge">{['Pazienza: ancora disponibile','Pazienza: agli sgoccioli','Pazienza: esaurita','Pazienza: porco dio.'][mood.level]}{mood.days>0?' · ritardo massimo: '+mood.days+' giorni':''}</span><div className="sponge-reminder" aria-live="polite">{reminder}</div><p key={pokes} aria-live="polite">{banter.length?(pokes?banter[(pokes-1)%banter.length]:banter[0]):'Tocca le tue attività per iniziare.'}</p><details className="sponge-voice-options"><summary>Audio della spugna · {voice.prefs.enabled?'attivo':'spento'}</summary><SpongeVoiceControls voice={voice}/></details>{voice.error&&<small role="status">{voice.error}</small>}<small>{pokes?'Ogni tanto ha anche ragione.':'Tocca la spugna. Ha qualcosa da dirti.'}</small><div className="sponge-shortcuts"><button className="outline" onClick={()=>onShow(late.length?'late':dueToday.length?'today':'all')}>{late.length?'Recupera gli arretrati':dueToday.length?'Le tue task di oggi':'Le tue attività'}</button>{next&&<button className="primary" onClick={()=>onClean(next)}>Ho fatto questa!</button>}</div>{next&&<small className="sponge-next">{next.name} · {next.dueLabel}</small>}</div></div>
}
export type CleaningWin={id:number;person:string;name:string;effort:number;recordId?:string;nextPerson?:string};
export function CleaningCelebration({win,onClose,onUndo}:{win:CleaningWin;onClose:()=>void;onUndo?:()=>void}){
const [five,setFive]=useState(false),[reduced,setReduced]=useState(false);
useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');setReduced(media.matches);const changed=()=>setReduced(media.matches);media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed)},[]);
useEffect(()=>{const t=setTimeout(onClose,4300);return()=>clearTimeout(t)},[win.id,onClose]);
return <div className="cleaning-celebration">
{!reduced&&<div className="cleaning-confetti" aria-hidden="true" key={five?'five':'first'}>{Array.from({length:28},(_,i)=><i key={i} style={{'--dx':Math.round(Math.cos(i*2.399)*(90+(i%6)*30))+'px','--dy':Math.round(Math.sin(i*2.399)*(90+(i%7)*27)-50)+'px','--rot':i*83+'deg','--lag':(i%5)*22+'ms',background:['#c6dfa0','#f0d178','#dfae94','#9ebed1','#e3e9cd'][i%5]} as React.CSSProperties}/>)}</div>}
<div className={'cleaning-win '+(five?'high-fived':'')}><button type="button" className="win-close icon-button" aria-label="Chiudi festa della pulizia" onClick={onClose}><X size={18}/></button><div className="win-sponge"><Sponge size={116} excited/></div><p className="eyebrow">{five?'LA SPUGNA APPROVA':'MISSIONE SPUGNA: COMPLETATA'}</p><h2>{win.effort>=4?'Boss finale asfaltato.':'Polvere 0. '+win.person+' 1.'}</h2><p className="win-task">{win.name}</p><div className="win-points"><Sparkles size={18}/><b>+{win.effort}</b><span>{win.effort===1?'punto di gloria':'punti di gloria'}</span></div><p className="win-one-liner" role="status">{five?'Cinque ricevuto. La polvere rosica.':win.person+' ha pulito. La casa prende appunti.'}</p><button type="button" className="win-five" disabled={five} onClick={()=>setFive(true)}><Hand size={17}/>{five?'Onore alla spugna.':'Batti il cinque alla spugna'}</button><button className="outline" onClick={onUndo}>Annulla, ho sbagliato</button><small className="muted">Entro 10 minuti, anche dallo storico. Se i turni cambiano, il ripristino si blocca.</small>{win.nextPerson&&<p className="muted">Prossimo turno: {win.nextPerson}</p>}<div className="win-timeout" aria-hidden="true"><i/></div></div>
</div>
}
