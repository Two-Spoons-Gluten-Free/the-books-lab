export const initial=()=>({version:1,name:'',attempts:[],completed:[],xp:0,streak:0,checks:{},queue:[]});
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function valid(p){
 if(!object(p)||!Array.isArray(p.attempts)||!Array.isArray(p.completed))return false;
 if(!p.completed.every(v=>typeof v==='string'))return false;
 if(!p.attempts.every(a=>object(a)&&typeof a.exerciseId==='string'&&typeof a.module==='string'&&typeof a.correct==='boolean'&&Number.isFinite(a.score)&&a.score>=0&&a.score<=100))return false;
 if(p.checks!==undefined&&(!object(p.checks)||!Object.values(p.checks).every(v=>typeof v==='boolean')))return false;
 if(p.queue!==undefined&&(!Array.isArray(p.queue)||!p.queue.every(e=>object(e)&&typeof e.eventId==='string')))return false;
 if(p.name!==undefined&&typeof p.name!=='string')return false;
 return ['xp','streak'].every(k=>p[k]===undefined||(Number.isFinite(p[k])&&p[k]>=0));
}
export function createStore(storage){
 let memory=initial(),available=Boolean(storage);
 return {
  read(){try{const raw=storage?.getItem('books-lab-v1');if(raw){const p=JSON.parse(raw);if(!valid(p))throw Error('Invalid saved progress');memory={...initial(),...p};}}catch{available=false;}return memory;},
  save(value){memory=value;try{storage?.setItem('books-lab-v1',JSON.stringify(value));}catch{available=false;}},
  get available(){return available;}
 };
}
let storage;try{storage=globalThis.localStorage;}catch{}
export const store=createStore(storage);
