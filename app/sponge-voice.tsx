import {apiUrl,sitePath} from '../lib/hosting';
'use client';
import {useEffect,useRef,useState} from 'react';
import clips from '../lib/chatterbox-clips.json';
const key='pierhouse-sponge-voice';
const previewText='Sono la spugna di Pierhouse. Le scuse non lavano i piatti!';
const defaults={enabled:true,engine:'chatterbox',voice:'',rate:1,pitch:1};
type Preferences=typeof defaults;
const normalize=(text:string)=>text.toLocaleLowerCase('it').replace(/[.!?…]+/g,'').replace(/\s+/g,' ').trim();
export function chatterboxClip(text:string){return (clips as Record<string,string>)[text]||Object.entries(clips).find(([line])=>normalize(line)===normalize(text))?.[1]||null}
function readPreferences():Preferences{try{const p=JSON.parse(localStorage.getItem(key)||'{}');return {enabled:typeof p.enabled==='boolean'?p.enabled:true,engine:p.engine==='system'?'system':'chatterbox',voice:typeof p.voice==='string'?p.voice:'',rate:p.engine===undefined?1:typeof p.rate==='number'?Math.min(1.5,Math.max(.6,p.rate)):1,pitch:typeof p.pitch==='number'?Math.min(2,Math.max(.5,p.pitch)):1}}catch{return defaults}}
export function useSpongeVoice(){
 const [prefs,setPrefs]=useState(defaults),[voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[supported,setSupported]=useState<boolean|null>(null),[systemSupported,setSystemSupported]=useState(false),[error,setError]=useState('');
 const player=useRef<HTMLAudioElement|null>(null);
 function stop(){if(player.current){player.current.pause();player.current=null}if('speechSynthesis'in window)window.speechSynthesis.cancel()}
 useEffect(()=>{setSupported('Audio'in window);setPrefs(readPreferences());const ok='speechSynthesis'in window&&'SpeechSynthesisUtterance'in window;setSystemSupported(ok);
 const updateVoices=()=>{if(ok)setVoices(window.speechSynthesis.getVoices())};const sync=()=>{setPrefs(readPreferences());stop()};const hidden=()=>{if(document.hidden)stop()};
 updateVoices();if(ok)window.speechSynthesis.addEventListener('voiceschanged',updateVoices);window.addEventListener('storage',sync);window.addEventListener(key,sync);document.addEventListener('visibilitychange',hidden);
 return()=>{stop();if(ok)window.speechSynthesis.removeEventListener('voiceschanged',updateVoices);window.removeEventListener('storage',sync);window.removeEventListener(key,sync);document.removeEventListener('visibilitychange',hidden)};
 },[]);
 function update(change:Partial<Preferences>){const next={...prefs,...change};setPrefs(next);stop();try{localStorage.setItem(key,JSON.stringify(next));window.dispatchEvent(new Event(key))}catch{}setError('')}
 function speak(text:string,preview=false){if(!supported||(!prefs.enabled&&!preview)||!text.trim())return;stop();setError('');
 if(prefs.engine==='chatterbox'){
  const src=chatterboxClip(preview?previewText:text);if(!src){setError('Questa frase non ha ancora un audio Chatterbox. La battuta resta leggibile.');return}
  const audio=new Audio(sitePath(src));audio.playbackRate=prefs.rate;audio.preservesPitch=true;player.current=audio;
  audio.onerror=()=>{if(player.current===audio)setError('Non riesco a caricare la voce Chatterbox. Controlla la connessione e ritocca la spugna.')};
  audio.play().catch(()=>{if(player.current===audio)setError('Tocca di nuovo la spugna per avviare la voce.')});return;
 }
 if(!systemSupported){setError('La voce del dispositivo non è disponibile. Scegli Chatterbox.');return}
 const synth=window.speechSynthesis,utterance=new SpeechSynthesisUtterance(text),available=synth.getVoices();const selected=available.find(v=>v.voiceURI===prefs.voice)||available.find(v=>/^it(?:-|_)/i.test(v.lang));utterance.lang=selected?.lang||'it-IT';if(selected)utterance.voice=selected;utterance.rate=prefs.rate;utterance.pitch=prefs.pitch;utterance.onerror=e=>{if(!['canceled','interrupted'].includes(e.error))setError('Voce non disponibile. Prova Chatterbox.')};synth.speak(utterance);
 }
 return {prefs,voices,supported,systemSupported,error,update,speak};
}
export function SpongeVoiceControls({voice}:{voice:ReturnType<typeof useSpongeVoice>}){const {prefs,voices,supported,systemSupported,error,update,speak}=voice;return <div className="sponge-voice-controls"><label><input type="checkbox" checked={prefs.enabled} disabled={!supported} onChange={e=>update({enabled:e.target.checked})}/> Voce della spugna</label><p className="muted">Parla solo quando tocchi la spugna. Preferenze salvate su questo dispositivo.</p><label>Tipo di voce<select value={prefs.engine} onChange={e=>update({engine:e.target.value,rate:1,pitch:1})}><option value="chatterbox">Chatterbox · Italiano naturale</option><option value="system" disabled={!systemSupported}>Voce del dispositivo</option></select></label>{prefs.engine==='chatterbox'?<p className="muted">Battute registrate con Chatterbox Multilingual. Le frasi aggiunte o cambiate richiedono un nuovo audio; il sito segnala se manca.</p>:<label>Voce del dispositivo<select value={prefs.voice} disabled={!systemSupported} onChange={e=>update({voice:e.target.value})}><option value="">Italiano automatico</option>{voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>}<label>Velocità · {prefs.rate.toFixed(1)}×<input aria-label="Velocità della voce" type="range" min="0.6" max="1.5" step="0.1" value={prefs.rate} onChange={e=>update({rate:Number(e.target.value)})}/></label>{prefs.engine==='system'&&<label>Tono · {prefs.pitch.toFixed(1)}<input aria-label="Tono della voce" type="range" min="0.5" max="2" step="0.1" value={prefs.pitch} onChange={e=>update({pitch:Number(e.target.value)})}/></label>}<button type="button" className="outline" disabled={!supported} onClick={()=>speak(previewText,true)}>Prova voce</button>{error&&<p role="status">{error}</p>}</div>}
