const base=import.meta.env.BASE_URL||'/';
export const sitePath=(path:string)=>base+path.replace(/^\//,'');
const api=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');
export function apiUrl(path:string){return api+path}
