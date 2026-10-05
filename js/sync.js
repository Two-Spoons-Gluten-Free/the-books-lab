import {config} from '../config.js';
let running=false;
export function enqueue(state,event,save){
 if(!config.sheetEndpoint)return;
 state.queue.push({...event,learner:state.name||'Learner',eventId:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`});
 save();void flush(state,save);
}
export async function flush(state,save){
 if(running||!config.sheetEndpoint||globalThis.navigator?.onLine===false)return;
 running=true;
 try{
  while(state.queue.length){
   const event=state.queue[0];
   // text/plain + no custom headers avoids Apps Script's unsupported preflight.
   // Opaque success cannot prove delivery; server deduplicates eventId on retries.
   await fetch(config.sheetEndpoint,{method:'POST',body:JSON.stringify({...event,token:config.sharedToken}),mode:'no-cors',signal:AbortSignal.timeout(12000)});
   state.queue.shift();save();
  }
 }catch{/* Keep failed network sends queued for the next online/reload event. */}
 finally{running=false;}
}
