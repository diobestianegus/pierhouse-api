// Corrections can be proposed by any roommate. Keep the original record and a
// separate audit entry so mistakes can be corrected without silently erasing history.
export function correctionDetails(records, request) {
 const done=records.find(r=>r.id===request.recordId&&r.kind==='done');
 if(!done)throw Error('Questa registrazione non esiste più o è già stata corretta.');
 const reason=typeof request.reason==='string'?request.reason.trim():'';
 if(reason.length<8||reason.length>300)throw Error('Spiega in almeno 8 caratteri perché la registrazione è sbagliata (massimo 300).');
 return {done,reason};
}
