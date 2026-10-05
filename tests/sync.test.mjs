import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {config} from '../config.js';
import {enqueue,flush} from '../js/sync.js';

test('sync is optional, nonblocking, and preserves failed network sends for retry',async()=>{
 const originalFetch=globalThis.fetch;
 const state={name:'Test',queue:[]};let writes=0;
 const event={module:'m1',exerciseId:'q1',correct:true,score:100};
 try{
  globalThis.fetch=()=>{throw Error('network offline');};
  enqueue(state,event,()=>writes++);assert.equal(state.queue.length,0);
  config.sheetEndpoint='https://example.invalid/exec';config.sharedToken='test-token';
  enqueue(state,event,()=>writes++);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(state.queue.length,1);
  globalThis.fetch=async(url,options)=>{assert.equal(url,config.sheetEndpoint);assert.equal(options.method,'POST');assert.equal(options.headers,undefined);assert.equal(options.mode,'no-cors');assert.equal(JSON.parse(options.body).token,'test-token');return {type:'opaque'};};
  await flush(state,()=>writes++);assert.equal(state.queue.length,0);assert(writes>=2);
 }finally{config.sheetEndpoint='';config.sharedToken='';globalThis.fetch=originalFetch;}
});

test('Apps Script receiver validates token, appends both event types, and deduplicates',()=>{
 const tabs=new Map();
 const book={getSheetByName:name=>tabs.get(name),insertSheet:name=>{
  const tab={rows:[],appendRow(row){this.rows.push(row)},setFrozenRows(){},getLastRow(){return this.rows.length},getLastColumn(){return this.rows[0].length},getRange(){return {createTextFinder:needle=>({matchEntireCell(){return this},findNext:()=>tab.rows.slice(1).some(row=>row.at(-1)===needle)})}}};tabs.set(name,tab);return tab;
 }};
 const context=vm.createContext({ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this}})},SpreadsheetApp:{getActiveSpreadsheet:()=>book},LockService:{getScriptLock:()=>({waitLock(){},hasLock:()=>true,releaseLock(){}})}});
 vm.runInContext(fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8').replace("'CHANGE_ME'","'test-token'"),context);
 const send=data=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(data)}}).text);
 const base={eventId:'event-1',timestamp:'2026-10-05T00:00:00Z',learner:'=IMPORTXML("bad")',module:'m1',exerciseId:'q1',correct:true,score:100,timeSpent:20,token:'test-token'};
 assert.equal(send({...base,token:'wrong'}).ok,false);assert.equal(tabs.size,0);
 assert.equal(send(base).ok,true);assert.equal(tabs.get('Attempts').rows.length,2);
 assert.match(tabs.get('Attempts').rows[1][1],/^'/,'formula-like text must be escaped');
 assert.equal(send(base).duplicate,true);assert.equal(tabs.get('Attempts').rows.length,2);
 assert.equal(send({...base,eventId:'event-2',type:'summary',mastery:100}).ok,true);assert.equal(tabs.get('Summary').rows.length,2);
 assert.equal(JSON.parse(context.doGet().text).ok,true);
});
