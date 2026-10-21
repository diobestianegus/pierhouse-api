import {apiUrl,sitePath} from '../lib/hosting';
import {Bath,ShowerHead,Sofa,Tv,Trash2,BrushCleaning,SprayCan,DoorOpen,Refrigerator,Utensils} from 'lucide-react';
export function iconFor(task:any){
const n=task.name.toLowerCase();
if(n.includes('sotto')&&n.includes('divano'))return 'under-sofa';
if(n.includes('divano'))return 'sofa';
if(n.includes('doccia'))return 'shower';
if(n.includes('lavandino')||n.includes('lavello'))return 'sink';
if(n.includes('scale'))return 'stairs';
if(n.includes('aspirapolvere')||n.includes('aspirare'))return 'vacuum';
if(n.includes('spazzare')||n.includes('balcone'))return 'broom';
if(n.includes('tv')||n.includes('televis'))return 'tv';
if(n.includes('scaffali')||n.includes('ripiani'))return n.includes('sopra')?'upper-shelves':n.includes('sotto')?'lower-shelves':'shelves';
if(n.includes('armadio')||n.includes('ante'))return 'cabinet';
if(n.includes('piano cucina')||n.includes('piano di lavoro'))return 'counter';
if(n.includes('forno'))return 'oven';
if(n.includes('finestre')||n.includes('vetri'))return 'window';
if(n.includes('spazzatura')||n.includes('rifiuti'))return 'trash';
if(n.includes('pavimenti'))return 'mop';
if(n.includes('bagno'))return 'bath';
if(n.includes('frigo')||n.includes('freezer'))return 'fridge';
if(n.includes('cucina'))return 'kitchen';
return 'spray';
}
export default function TaskIcon({task,size=24}:{task:any,size?:number}){
const icon=iconFor(task),common={size,strokeWidth:1.65,'aria-hidden':true as const};
const icons:any={sofa:Sofa,shower:ShowerHead,tv:Tv,trash:Trash2,broom:BrushCleaning,bath:Bath,fridge:Refrigerator,kitchen:Utensils,spray:SprayCan};
const Icon=icons[icon];if(Icon)return <Icon {...common}/>;
return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
{icon==='sink'&&<><path d="M3 12h18l-2 5H5l-2-5ZM12 12V5a3 3 0 0 1 6 0v2h-3M8 17v4m8-4v4M8 9v3m8-3v3"/></>}
{icon==='vacuum'&&<><rect x="3" y="14" width="10" height="6" rx="2"/><path d="M5 20v1m6-1v1m2-4c7 0 8-6 3-9l-2-1M13 3l-2 4 7 12m-3 1h6"/></>}
{icon==='stairs'&&<><path d="M3 21h6v-5h5v-5h5V6h3M3 5l15-3M6 5v8m6-9v5m6-6v3"/></>}
{icon==='cabinet'&&<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18m-3-11v3m6-3v3M6 21v1m12-1v1"/></>}
{icon==='counter'&&<><path d="M2 8h20v3H2zM4 11v10m16-10v10M7 15h4m-2-1v3m6-3h3"/><path d="M6 5h4m-2-2v2m8-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/></>}
{icon==='oven'&&<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M8 5.5h.01M12 5.5h.01M16 5.5h.01"/><rect x="7" y="11" width="10" height="7" rx="1"/><path d="M9 13h6"/></>}
{icon==='window'&&<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16M7 6l2 2m6 7 2 2"/></>}
{icon==='under-sofa'&&<><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M3 10v5h18v-5M5 15v2m14-2v2M9 20h6m-3-3v5m-2-2 2 2 2-2"/></>}
{icon==='mop'&&<><path d="m16 2-6 14m-5 1 10 4 2-4-10-4-2 4ZM3 22h18M19 6h2m-1-1v2"/></>}
{['shelves','upper-shelves','lower-shelves'].includes(icon)&&<><path d="M4 3v18m16-18v18M4 9h16M4 16h16M4 21h16M7 5v4m3-3v3m5-4v4m3-3v3M7 12v4m3-3v3m5-4v4m3-3v3"/>{icon==='upper-shelves'&&<path d="m9 2 3-2 3 2"/>}{icon==='lower-shelves'&&<path d="m9 22 3 2 3-2"/>}</>}
</svg>
}
