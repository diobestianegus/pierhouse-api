// Import once from the owner's configured legacy API. No household data is
// stored in Git; the migration marker and records are committed atomically.
export async function migrateLegacy(env:any){
 if(!env.MIGRATION_SOURCE_URL)return;
 const marker='legacy_import_v1';
 if(await env.DB.prepare('SELECT value FROM push_meta WHERE id=?').bind(marker).first())return;
 const existing=await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE kind<>'assignments'").first();
 if(existing.n)throw Error('Legacy import requires an unused database.');
 const response=await fetch(env.MIGRATION_SOURCE_URL,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Legacy data unavailable.');
 const records=await response.json();
 if(!Array.isArray(records)||!records.length||records.length>5000||!records.some(r=>r.id==='assignments'&&r.kind==='assignments'))throw Error('Invalid legacy snapshot.');
 const ids=new Set();
 const statements=records.map(row=>{
  const {id,kind,created,...payload}=row;
  if(typeof id!=='string'||!id||ids.has(id)||typeof kind!=='string'||!Number.isSafeInteger(created)||['push_meta','push_devices'].includes(kind))throw Error('Invalid legacy record.');
  ids.add(id);
  return env.DB.prepare('INSERT INTO records(id,kind,payload,created) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM push_meta WHERE id=?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,payload=excluded.payload,created=excluded.created').bind(id,kind,JSON.stringify(payload),created,marker);
 });
 statements.push(env.DB.prepare('INSERT OR IGNORE INTO push_meta(id,value) VALUES(?,?)').bind(marker,JSON.stringify({count:records.length,at:new Date().toISOString()})));
 await env.DB.batch(statements);
}
